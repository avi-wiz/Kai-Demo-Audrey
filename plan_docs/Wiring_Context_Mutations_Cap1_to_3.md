# Wiring Context Mutations — Caps 1, 2, 3

## Context

Caps 1–3 fixtures are authored ([cap1-task-email-voice.json](../src/fixtures/cap1-task-email-voice.json), [cap2-lead-creation.json](../src/fixtures/cap2-lead-creation.json), [cap2-auto-task-followup.json](../src/fixtures/cap2-auto-task-followup.json), [cap3-lead-stage-won.json](../src/fixtures/cap3-lead-stage-won.json)). Their AW-012 ConsentBanner triggers a generic `onConfirmed(fields)` callback in [ChatShell.tsx:2780](../src/components/chat/ChatShell.tsx#L2780) which today only writes to `addOrder` / `addTask`. To make Kai-created leads + customers appear in the WizOrder pages and to mark L-9003 as archived after Cap 3, three new mutations are needed on `SharedCRMContext`, one new code path on `SharedCustomersContext`, and three new discriminator branches in `handleConfirmed`.

## What Already Exists

### [src/contexts/shared/SharedCRMContext.tsx](../src/contexts/shared/SharedCRMContext.tsx)

Currently exposes:
- `existingTasks`, `kaiCreatedTasks`, `addTask(task: SharedTask)`, `allTasks` — task creation flow used by UC-2 + Cap 1 + Cap 2 auto-task. ✅
- `existingLeads`, `allLeads` (= `existingLeads`) — **read-only.** No mutation methods.
- `existingDeals`, `allDeals` (= `existingDeals`) — read-only.

The `allLeads` getter today simply returns `existingLeads` unchanged. We need it to merge Kai-created leads + apply archive markers + apply stage updates.

### [src/contexts/shared/SharedCustomersContext.tsx](../src/contexts/shared/SharedCustomersContext.tsx)

Currently exposes:
- `existingCustomers`, `kaiCreatedCustomers` (typed `CustomerModification[]` — `KaiCreatedItem` + `{ patch: Partial<WizOrderCustomer> }`), `addCustomer(mod)`, `allCustomers`.

**Critical finding**: the existing `allCustomers` merge logic is a **patch-merge by id against `existingCustomers`** ([SharedCustomersContext.tsx:40-44](../src/contexts/shared/SharedCustomersContext.tsx#L40-L44)):

```ts
for (const c of existingCustomers) {
  const m = latestPatchById.get(c.id);
  if (m) modified.push({ ...c, ...m.patch, createdByKai: true });
  else untouched.push(c);
}
```

If you call `addCustomer({ id: 'C-8009', patch: {...} })` for a customer ID that doesn't exist in `existingCustomers`, the patch is silently dropped — the loop only iterates `existingCustomers`. So `addCustomer` cannot create a brand-new customer today; it can only edit one.

### [src/contexts/shared/SharedOrdersContext.tsx](../src/contexts/shared/SharedOrdersContext.tsx)

No changes needed for Caps 1–3. `addOrder` is untouched.

### [src/components/chat/ChatShell.tsx](../src/components/chat/ChatShell.tsx)

`handleConfirmed` at line 2780 already discriminates orders vs tasks by inspecting `fields`. We extend it with two more branches (lead, customer-conversion). It currently uses:
- `useSharedCRM()` → destructures `addTask` (line 1969).
- `useSharedOrders()` → `addOrder`.
- Will need to also destructure `addLead`, `archiveLead` (new) + `useSharedCustomers` → `addCustomer`.

### [src/hooks/useConsentFlow.ts](../src/hooks/useConsentFlow.ts)

`buildConfirmationWidget` (line 33) builds the post-confirm AW-003 ConfirmationDialog text by inspecting fields. Today it handles `isOrder` / `isTask` branches. **Optional follow-up**: extend it to also produce friendly messages for lead / customer-conversion confirmations. Not strictly required since Cap 1/2/3 fixtures author their own `-confirmed.json` files — flagged as a polish item, not a blocker.

## What's New

### SharedCRMContext additions

**Type changes** ([src/lib/types.ts](../src/lib/types.ts)):

Add `SharedLead` after `SharedTask` (~line 975):

```ts
export interface SharedLead extends KaiCreatedItem {
  name: string;
  contact: string;
  email?: string;
  source: string;
  status: string;
  assignedTo: string;
}
```

Extend `WizOrderLead` with optional flags (~line 1035):

```ts
export interface WizOrderLead {
  // ...existing fields...
  createdByKai?: boolean;
  archived?: boolean;
  archivedAt?: string;
}
```

(No change to existing literal-union fields — purely additive optional flags.)

**State + mutations** ([SharedCRMContext.tsx](../src/contexts/shared/SharedCRMContext.tsx)):

Add three pieces of state and three mutations:

```ts
const [kaiCreatedLeads, setKaiCreatedLeads] = useState<SharedLead[]>([]);
const [leadStageOverrides, setLeadStageOverrides] = useState<Record<string, string>>({});
const [archivedLeadIds, setArchivedLeadIds] = useState<Set<string>>(new Set());

const addLead = (lead: SharedLead) =>
  setKaiCreatedLeads(prev => [lead, ...prev]);

const updateLeadStage = (leadId: string, newStage: string) =>
  setLeadStageOverrides(prev => ({ ...prev, [leadId]: newStage }));

const archiveLead = (leadId: string) =>
  setArchivedLeadIds(prev => new Set(prev).add(leadId));
```

Rewire `allLeads` to merge:

```ts
const allLeads = useMemo(() => {
  const kaiItems: WizOrderLead[] = kaiCreatedLeads.map(l => ({
    id: l.id, name: l.name, contact: l.contact, source: l.source,
    status: l.status, assignedTo: l.assignedTo,
    createdDate: new Date(l.createdAt).toISOString().split('T')[0],
    lastContact: null, createdByKai: true,
  }));
  const merged = [...kaiItems, ...existingLeads];
  return merged.map(l => ({
    ...l,
    status: leadStageOverrides[l.id] ?? l.status,
    archived: archivedLeadIds.has(l.id) || undefined,
  }));
}, [kaiCreatedLeads, existingLeads, leadStageOverrides, archivedLeadIds]);
```

Expose `addLead`, `updateLeadStage`, `archiveLead`, `kaiCreatedLeads` on the provider value + interface.

**Why three separate stores instead of one merged structure**: keeps Kai-created leads visually distinct (so KaiBadge applies via `createdByKai: true` only on append), while still allowing stage/archive operations on the original `existingLeads` (Cap 3 archives L-9003 which is an existing lead). A single store would force us to deep-clone existing leads into the Kai bucket on first mutation.

### SharedCustomersContext additions

**Schema change**: today `kaiCreatedCustomers` carries `CustomerModification[]` (`{ id, createdAt, createdByKai, patch }`). For Cap 3 we need to **append a whole new customer**, not patch an existing one. Two clean options:

- **(a) Add a sibling state for new customers** (recommended — least risky).
  Add `kaiNewCustomers: WizOrderCustomer[]` alongside `kaiCreatedCustomers`. Extend `addCustomer` signature to accept either a `CustomerModification` (patch on existing) or a full `WizOrderCustomer` (new). Discriminate by presence of `patch` field.
- **(b) Unify the payload shape** — make `addCustomer` always take a `WizOrderCustomer` + optional `patch` flag. Larger refactor; risk of breaking the few v2 fixtures already using addCustomer.

Going with **(a)**. Concretely:

```ts
const [kaiNewCustomers, setKaiNewCustomers] = useState<WizOrderCustomer[]>([]);

const addCustomer = (input: CustomerModification | WizOrderCustomer) => {
  if ('patch' in input) {
    setKaiCreatedCustomers(prev => [input, ...prev]);
  } else {
    setKaiNewCustomers(prev => [{ ...input, createdByKai: true }, ...prev]);
  }
};
```

Rewire `allCustomers` to prepend `kaiNewCustomers` ahead of the patch-merged list.

Cap 3 callsite then becomes:

```ts
addCustomer({
  id: 'C-8009',
  name: 'Verdant Home Collective',
  contact: 'Amy Brooks',
  lifetimeRevenue: 0,
  lastOrder: '',
  tags: ['New'],
  rep: 'Beth Calloway',
  status: 'Active',
  ordersYTD: 0,
  // createdByKai stamped by addCustomer
});
```

### ChatShell.tsx wiring

[ChatShell.tsx:2780](../src/components/chat/ChatShell.tsx#L2780) `handleConfirmed` gains two new branches before the existing `isTask` fallback. Existing discriminator logic (line 2783, `isOrder = fields.some(f => f.fieldId === 'subtotal')`) stays unchanged.

```ts
// Cap 3 — customer conversion (4-step form has 'taxId' field; existing fixtures don't)
const isCustomerConversion = fields.some(f => f.fieldId === 'taxId');
if (isCustomerConversion) {
  const legalName = fields.find(f => f.fieldId === 'legalName')?.value;
  addCustomer({ id: 'C-8009', name: legalName ?? 'Verdant Home Collective', /* …other fields… */ });
  archiveLead('L-9003');
  return;
}

// Cap 2 — lead creation (has 'company' + 'source' but no 'subtotal' or 'title')
const isLead =
  fields.some(f => f.fieldId === 'company') &&
  fields.some(f => f.fieldId === 'source') &&
  !fields.some(f => f.fieldId === 'subtotal') &&
  !fields.some(f => f.fieldId === 'title');
if (isLead) {
  const lead: SharedLead = {
    id: `L-${Date.now()}`,
    createdAt: new Date().toISOString(),
    createdByKai: true,
    name: fields.find(f => f.fieldId === 'company')?.value ?? 'New Lead',
    contact: fields.find(f => f.fieldId === 'contact')?.value ?? '',
    email: fields.find(f => f.fieldId === 'email')?.value,
    source: fields.find(f => f.fieldId === 'source')?.value ?? 'Other',
    status: fields.find(f => f.fieldId === 'stage')?.value ?? 'New',
    assignedTo: fields.find(f => f.fieldId === 'assignee')?.value ?? 'Hannah Cho',
  };
  addLead(lead);
  return;
}
```

The Cap 2 *auto-task* uses the existing task discriminator (it carries `title` + `assignee` fields) and falls through to the existing `addTask` path — no new branch needed.

**Discriminator hygiene**: lead form fields `company`, `contact`, `email`, `source`, `stage`, `assignee` are unique enough that the negative checks (`!subtotal`, `!title`) suffice. Cap 3 conversion form's `taxId` is unique to customer-conversion (no other fixture uses it). Verified no collisions with existing UC-2/UC-3 fixtures.

**Cap 1 already works** — its form has the `title` + `assignee` shape, hits the existing `isTask` branch, calls `addTask`. No code change.

## Diff Summary

| File | Change |
|---|---|
| [src/lib/types.ts](../src/lib/types.ts) | Add `SharedLead` interface; add optional `createdByKai`/`archived`/`archivedAt` to `WizOrderLead`. |
| [src/contexts/shared/SharedCRMContext.tsx](../src/contexts/shared/SharedCRMContext.tsx) | Add 3 state slots + `addLead`/`updateLeadStage`/`archiveLead` mutations; rewire `allLeads` to merge. |
| [src/contexts/shared/SharedCustomersContext.tsx](../src/contexts/shared/SharedCustomersContext.tsx) | Add `kaiNewCustomers` state; widen `addCustomer` signature; rewire `allCustomers` to prepend new customers. |
| [src/components/chat/ChatShell.tsx](../src/components/chat/ChatShell.tsx) | Destructure `addLead, archiveLead` from `useSharedCRM` + `addCustomer` from `useSharedCustomers` (already partially imported). Add `isCustomerConversion` + `isLead` branches in `handleConfirmed` before existing `isTask` fallback. |

## Files NOT Touched

- [SharedOrdersContext.tsx](../src/contexts/shared/SharedOrdersContext.tsx) — no Cap 1–3 order mutations.
- Fixture JSON files — unchanged. The form-field shape already authored is what discriminates.
- [useConsentFlow.ts](../src/hooks/useConsentFlow.ts) — `buildConfirmationWidget` keeps its 2 branches. Cap 1/2/3 use their own `-confirmed.json` post-confirm fixtures, so the auto-built AW-003 is bypassed. (Optional polish: extend `buildConfirmationWidget` with isLead/isCustomer branches — flagged but not in scope.)

## Verification

1. `npx tsc --noEmit` — must be clean.
2. Boot dev server. Trigger Cap 1: "Create a task for Wildflower Market" → confirm → navigate to CRM page → new task appears at top with KaiBadge.
3. Trigger Cap 2: "Add a lead for Pine & Thistle" → confirm lead → confirm auto-task → CRM page shows new lead (Pine & Thistle, status New, KaiBadge) AND new task ("First outreach — Pine & Thistle Gift Shop") at top of tasks list.
4. Trigger Cap 3: "Move Verdant Home to Won" → confirm conversion → Customers page shows C-8009 Verdant Home Collective (KaiBadge), CRM Leads tab shows L-9003 grayed/archived (or hidden depending on list filter).
5. Refresh page → all Kai-created entities disappear (in-memory state is intentional for the demo).

## Risk Notes

- **In-memory only** — refresh clears state. Acceptable for the demo per CLAUDE.md, but flag to user if persistence is expected.
- **Hardcoded C-8009 / L-9003 ids in handleConfirmed** — Cap 3 dispatcher needs the lead ID to archive. The fixture authors `leadId: "L-9003"` in `actions.onConfirm.payload`, but that payload isn't currently piped through to `onConfirmed(fields)` — `onConfirmed` only sees form field values. Options:
  - **Lift the leadId** by adding a hidden form field `{ fieldId: 'sourceLeadId', value: 'L-9003', type: 'hidden' }` in the Cap 3 form (cleanest — fits the existing dispatcher contract).
  - Hardcode `L-9003` / `C-8009` in the ChatShell branch (works since Cap 3 only handles Verdant, but brittle if we ever generalize).
  - Extend `onConfirmed` to receive the fixture's `actions.onConfirm.payload`. Larger refactor.

Recommended: **hidden-field approach** — add `sourceLeadId: 'L-9003'` to the Cap 3 fixture's `Step 4 (Review)` fields (or a separate non-displayed step), and `addCustomer` derives the new customer ID from a `newCustomerId` hidden field (or hardcoded `C-8009` since Cap 3 is single-Verdant).
