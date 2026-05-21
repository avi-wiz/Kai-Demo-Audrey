# Plan: Wire 8 Capability Chip Groups (sr-2, sr-11, sr-14, sr-20, ad-1, ad-3, ad-17, ad-29)

## Context

Testing.md §7.A lists eight action-chip capability groups (sr-2, sr-11, sr-14, sr-20, ad-1, ad-3, ad-17, ad-29) defined in `src/fixtures/action-chips-map.json`. They are not currently triggered by any useCase — `USECASE_CHIP_KEY` only maps existing useCases to `sr-1`, `sr-13`, `email`, and `dashboard-edit`. As a result, these 22 chips never render, and the Testing.md row that says "verify each by running their corresponding query type" cannot be executed.

This plan introduces a triggering query, a dedicated fixture, and renderer wiring for each of the 8 groups so that each chip group renders below a real Kai turn. Each of the 22 chips also gets a dedicated downstream response (per the user's decision) — most route to existing flows (email-draft, dashboard-builder, form-restage), the rest become small new useCases.

The intended outcome: a tester can paste a trigger phrase from §7.A, see the matching widget surface render, see the corresponding capability chips below it, click each chip, and watch a tailored response appear.

## Scope decisions (locked)

- **All 8 groups** with their own dedicated fixtures (no reuse-only shortcuts).
- **Each chip click → dedicated response.** Many chip clicks reuse existing pipelines (email-draft, dashboard-builder, form-restage, page-context for "approval receipt"-type confirmations); a few need new small useCases (e.g. compare-orders, workflow-test).
- **ad-17 = new `admin-report` useCase**, not a remap of dashboard-builder. The "Save as dashboard" chip bridges from admin-report → dashboard-builder.
- **Form-restage chip clicks use the AI restage path** (no new DEMO_TRIGGERS). Requires `ANTHROPIC_API_KEY`.
- **Full text-only parity**: every new widget-mode fixture gets a paired `*-text-only.json` variant.

## Approach

### 1. New useCase string-literal values (KaiTurn union)

Add to `KaiTurn.useCase` union in [src/components/chat/ChatShell.tsx:84](src/components/chat/ChatShell.tsx#L84):

```
'sr2-reorder' | 'sr11-invoice' | 'sr14-brief' | 'sr20-outreach' |
'ad1-approval' | 'ad3-handoff' | 'ad17-report' | 'ad29-workflow'
```

Plus two extra small useCases driven by chip-click follow-ups that don't fit any existing flow:

- `'sr2-compare'` — side-by-side reorder vs original (chip "Compare with original")
- `'ad29-test'` — workflow test results (chip "Test with sample data")
- `'ad1-approved'` — bulk-approval receipt (chip "Approve all standard")
- `'ad1-flagged'` — drill-down on flagged item (chip "Show details on flagged")

Total: 12 new useCase values. Half of them produce form-stageable surfaces (consent flow), half are read-only result frames.

### 2. Trigger phrases (matchSpecialCapabilityQuery)

Extend [src/lib/queryMatcher.ts](src/lib/queryMatcher.ts) with a new `matchSpecialCapabilityQuery(message)` function returning `{ useCase, fixture } | null`. Runs in `ChatShell.handleSend` BEFORE the email pre-router, AFTER the existing `matchSpecialQuery` (order history / meeting prep).

Trigger keywords (collision-checked against `matchQuery`, `matchDashboardQuery`, `matchPageContextQuery`, `matchSpecialQuery`):

| useCase | Trigger keywords (lowercased `String.includes`) |
|---|---|
| `sr2-reorder` | `reorder`, `restock acme`, `amend this order` |
| `sr11-invoice` | `invoice`, `payment due`, `overdue invoice` |
| `sr14-brief` | `meeting brief`, `action items from meeting`, `meeting summary` |
| `sr20-outreach` | `outreach`, `outreach email`, `campaign message` |
| `ad1-approval` | `approval queue`, `pending approval`, `items waiting for approval` |
| `ad3-handoff` | `rep handoff`, `reassign rep`, `account transition` |
| `ad17-report` | `q1 sales report`, `quarterly report`, `build me a report`, `monthly report` |
| `ad29-workflow` | `set up a workflow`, `dormant customer workflow`, `workflow for re-engagement` |

Avoiding: `acme` (uc1), `create + task` (uc2), `create … order` (uc2-order pre-router), `dashboard` (matchDashboardQuery), `email`/`draft` (email pre-router), `meeting prep`/`prep me`/`prep for meeting` (matchSpecialQuery), `recent orders`/`order history` (matchSpecialQuery).

### 3. Fixtures (16 files — 8 widget-mode + 8 text-only)

All under `src/fixtures/`. Modeled on existing structures noted in parentheses.

| File | Widgets | Modeled after |
|---|---|---|
| `sr2-reorder.json` | UW-014, UW-003 (original order summary), AW-004 (modify quantities form), AW-012 | `uc2-order-creation.json` |
| `sr11-invoice.json` | UW-014, UW-003 (invoice detail), UW-002 (days overdue, amount, AR%), UW-011 (reminder history), AW-001 | `special-meeting-prep.json` |
| `sr14-brief.json` | UW-014, UW-003 (meeting metadata), UW-002 (attendees, action items, next review), UW-011 (action items list), AW-001 | `special-meeting-prep.json` |
| `sr20-outreach.json` | UW-014, UW-003 (email metadata: To/Subject/Body), AW-001 ("Send draft" + "Copy") | `email-draft.json` |
| `ad1-approval.json` | UW-014, UW-002 (queue totals), UW-004 (queue table with policy/flag columns), AW-012 ("Bulk approve") | `page-context-orders.json` |
| `ad3-handoff.json` | UW-014, UW-003 (from/to rep summary), UW-002 (LTV, customers, open quotes), UW-011 (affected accounts) | `special-meeting-prep.json` |
| `ad17-report.json` | UW-014, UW-002 (KPI summary), CH-001 (revenue/quote trend), UW-004 (top rows breakdown), AW-001 ("Save as dashboard") | `uc1-customer-intel.json` (chart + entity blend) |
| `ad29-workflow.json` | UW-014, UW-003 (workflow definition), UW-002 (sample stats), AW-012 ("Activate workflow") | `uc2-task-creation.json` |

Plus eight `*-text-only.json` variants: each carries only `closingText` (no widgets), in the same shape as existing `uc1-text-only.json`. Used when ResponseMode === 'text-only'.

### 4. Renderer dispatch (KaiTurnRenderer in ChatShell.tsx)

Update the renderer dispatcher (around [src/components/chat/ChatShell.tsx:976-1009](src/components/chat/ChatShell.tsx#L976-L1009)) to route the new useCases:

- **Consent-flow useCases** (have AW-004 form + AW-012): `sr2-reorder`, `ad29-workflow` → ConsentTurnRenderer (same path as `uc2`/`uc2-order`).
- **Read-only result useCases**: `sr11-invoice`, `sr14-brief`, `sr20-outreach`, `ad1-approval`, `ad3-handoff`, `ad17-report` → reuse `StandardTurnRenderer` (uc1 pathway).
- **Chip-spawn useCases**: `sr2-compare`, `ad29-test`, `ad1-approved`, `ad1-flagged` → StandardTurnRenderer with their own fixture.

`StandardTurnRenderer` already accepts any useCase that has an entry in `fixtureMap`. Confirm the standard-renderer path renders correctly for these by populating `fixtureMap` (next step) — no new renderer component required.

### 5. useStreamSimulator wiring

Update [src/hooks/useStreamSimulator.ts](src/hooks/useStreamSimulator.ts):

- Extend the type union signature on `useCase` parameter to include all 12 new values.
- Add 12 entries to `fixtureMap` and 8 to `textOnlyFixtureMap` (the four chip-spawn useCases skip text-only since they're rare follow-on responses).
- No new entries in `CLOSING_TEXT_VARIANTS` — let the fixture's own `closingText` show. (Persona variants are uc1/uc2/uc3-only by current design.)

### 6. USECASE_CHIP_KEY mapping

Update [src/components/chat/ChatShell.tsx:47-59](src/components/chat/ChatShell.tsx#L47-L59):

```
'sr2-reorder'   : 'sr-2',
'sr11-invoice'  : 'sr-11',
'sr14-brief'    : 'sr-14',
'sr20-outreach' : 'sr-20',
'ad1-approval'  : 'ad-1',
'ad3-handoff'   : 'ad-3',
'ad17-report'   : 'ad-17',
'ad29-workflow' : 'ad-29',
// Chip-spawn useCases: no chip group (terminal).
'sr2-compare':'', 'ad29-test':'', 'ad1-approved':'', 'ad1-flagged':'',
```

### 7. Chip-click downstream wiring (22 chips)

For each chip, define how the click resolves. Most queries already lead to the right pipeline via existing matchers; a handful need new keyword/route entries. Template-var resolution via existing `extractTemplateVars` + `resolveChipQuery` in [src/lib/templateVars.ts](src/lib/templateVars.ts) is reused as-is.

| Group | Chip | Query | Routes to |
|---|---|---|---|
| sr-2 | Modify quantities | "Change the quantities on this reorder" | form-restage (AI path) over the staged sr2-reorder form |
| sr-2 | Compare with original | "Show me a side-by-side with the original order" | new useCase `sr2-compare` (UW-004 side-by-side fixture) |
| sr-11 | Create task for this | "Create a follow-up task about this invoice" | existing uc2 path (matchQuery: create+task) |
| sr-11 | Email the customer | "Draft a payment reminder email for this invoice" | existing email-draft path |
| sr-14 | Draft pre-meeting email | "Draft an email to {contactName} confirming our meeting" | existing email-draft path |
| sr-14 | Create meeting tasks | "Create tasks for the action items from this brief" | existing uc2 path (create+task keyword present) |
| sr-20 | Make it more casual | "Rewrite the email in a more casual tone" | existing email-shorter path (already keyword-matched) |
| sr-20 | Make it shorter | "Shorten this email to 3 sentences" | existing email-shorter path |
| sr-20 | Add a discount offer | "Add a mention of our 10% early-access discount" | new keyword in email pre-router → email-shorter (treat as edit) |
| ad-1 | Approve all standard | "Approve all items that are within standard policy" | new useCase `ad1-approved` (AW-003 ConfirmationDialog success) |
| ad-1 | Show details on flagged | "Give me more details on the flagged items" | new useCase `ad1-flagged` (UW-003 drill-down) |
| ad-3 | Draft handoff email | "Draft a handoff email from {fromRep} to {toRep} with key account details" | existing email-draft path |
| ad-3 | Notify affected customers | "Draft a notification to affected customers about their new rep" | existing email-draft path |
| ad-17 | Save as dashboard | "Save this as a dashboard" | new keyword in matchDashboardQuery → dashboard-builder |
| ad-17 | Add more metrics | "Add average order value and quote conversion rate to this report" | form-restage (AI path) over the ad17-report turn |
| ad-17 | Email this report | "Draft an email with this report summary to the leadership team" | existing email-draft path |
| ad-29 | Test with sample data | "Show me which records would have triggered this workflow in the last 30 days" | new useCase `ad29-test` (UW-004 sample-records fixture) |
| ad-29 | Create another workflow | "Set up a workflow for dormant customer re-engagement" | matches `ad29-workflow` keywords → re-stages a workflow form |
| sr-1 | (already wired, verified working) | — | — |

To make this work cleanly:

1. Extend `detectFollowUp` in [src/hooks/useFollowUp.ts](src/hooks/useFollowUp.ts) so `sr2-reorder` and `ad17-report` are valid prior useCases for form-restage. Add the chip queries' lead phrases (`"change the quantities"`, `"add average order value"`) to `FORM_RESTAGE_KEYWORDS` if collision-safe; otherwise rely on the existing `'change'` and `'add more'` substrings already present.
2. Extend the email pre-router in [src/components/chat/ChatShell.tsx:1471-1483](src/components/chat/ChatShell.tsx#L1471-L1483) to recognize the new email chip queries (most already match via "email" or "draft" — no change needed).
3. Extend `matchDashboardQuery` keyword list with `"save this as a dashboard"` so the ad-17 → dashboard bridge works.

### 8. Form-restage AI path

Per the user's choice, NO new DEMO_TRIGGERS in `/api/kai/restage`. The chip queries land in the AI path (`buildSystemPrompt` already has today's date + weekday table). Two implications:

- Demo mode WITHOUT `ANTHROPIC_API_KEY` → "no changes detected" toast for sr-2 / ad-17 restage chips. Document this in the verify section of Testing.md.
- AI path needs the staged form fields snapshot. `currentUc2Fields` in ChatShell currently only tracks uc2 task forms — extend `handleFormReady` and `RestageRenderer.onFormReady` so sr2-reorder and ad17-report forms also write to a comparable state slot. Simplest: rename the state to `currentRestageableFields` and let any consent-flow form populate it.

### 9. Persona / closing text variants

Skip persona variants for new useCases. The fixture's own `closingText` is shown verbatim, same as for `uc2-order` today. Acceptable for v2.1 POC; can be added later if persona drift is noticed.

### 10. Testing.md updates

Update §7.A so each chip group has a runnable trigger row pointing at the new keyword phrase, plus the chip click table indicates the downstream useCase. Mark "row is now executable; was deferred in v2.1.0".

## Files to modify or create

**New files (16):**

```
src/fixtures/sr2-reorder.json
src/fixtures/sr2-reorder-text-only.json
src/fixtures/sr2-compare.json                    (chip-spawn)
src/fixtures/sr11-invoice.json
src/fixtures/sr11-invoice-text-only.json
src/fixtures/sr14-brief.json
src/fixtures/sr14-brief-text-only.json
src/fixtures/sr20-outreach.json
src/fixtures/sr20-outreach-text-only.json
src/fixtures/ad1-approval.json
src/fixtures/ad1-approval-text-only.json
src/fixtures/ad1-approved.json                   (chip-spawn)
src/fixtures/ad1-flagged.json                    (chip-spawn)
src/fixtures/ad3-handoff.json
src/fixtures/ad3-handoff-text-only.json
src/fixtures/ad17-report.json
src/fixtures/ad17-report-text-only.json
src/fixtures/ad29-workflow.json
src/fixtures/ad29-workflow-text-only.json
src/fixtures/ad29-test.json                      (chip-spawn)
```

(Note: 16 numbered above + 4 chip-spawn = 20 fixture files total. The chip-spawn ones don't need text-only variants since they're rare follow-on responses.)

**Edited files:**

```
src/lib/queryMatcher.ts                          - new matchSpecialCapabilityQuery + new keyword in matchDashboardQuery
src/hooks/useStreamSimulator.ts                  - 12 new fixtureMap entries, 8 new textOnlyFixtureMap entries, type signature
src/hooks/useFollowUp.ts                         - whitelist sr2-reorder, ad17-report as form-restage parents
src/components/chat/ChatShell.tsx                - KaiTurn union, USECASE_CHIP_KEY, dispatcher, handleSend pre-router, currentRestageableFields rename
Testing.md                                       - §7.A trigger phrases + chip click downstream table
```

**No code changes** to: `src/app/api/kai/restage/route.ts`, `src/components/engine/*`, any widget components, any context providers.

## Existing utilities to reuse (do not duplicate)

- `parseFrame` and `flattenFrames` from [src/components/engine/FrameParser](src/components/engine/FrameParser.tsx) — fixtures pass through unmodified.
- `useStreamSimulator` — handles all timing, no new streaming logic needed.
- `useConsentFlow` — `sr2-reorder` and `ad29-workflow` use it as-is (form-restage + AW-003 confirmation widget already detects order vs task via `subtotal`/`title`/etc. — for these new forms, neither field will be present, so the generic "Action confirmed" branch is needed). **Add a third branch to `buildConfirmationWidget`** in [src/hooks/useConsentFlow.ts](src/hooks/useConsentFlow.ts) that emits a generic "{Capability} Confirmed" message when neither order nor task fields are present; deep-link can be omitted.
- `extractTemplateVars` and `resolveChipQuery` from [src/lib/templateVars.ts](src/lib/templateVars.ts) — chip queries containing `{customerName}`, `{contactName}`, `{fromRep}`, `{toRep}` resolve via these. Already populated from UW-007 / UW-003 / UW-011 widget data.
- `spawnTurn` and the `userQuery` field — pass `trimmed` through so fixtures can later be query-aware (Acme variant pattern).

## Implementation order

1. **Fixtures first** (data-only PR — easy to review). All 20 fixture files. No code changes — TypeScript still passes.
2. **Wire useStreamSimulator + KaiTurn union + USECASE_CHIP_KEY**. After this, every new useCase technically renders if fed a turn — but no triggers exist yet.
3. **Wire matchSpecialCapabilityQuery + ChatShell.handleSend pre-router**. After this, the 8 trigger phrases produce real turns + chip groups.
4. **Wire chip-click destinations**. Most reuse existing pipelines; ad-17 → dashboard bridge needs a single keyword in `DASHBOARD_ROUTES`.
5. **Wire form-restage whitelist for sr2-reorder + ad17-report** in `useFollowUp.ts`.
6. **Rename `currentUc2Fields` → `currentRestageableFields`** so the new forms participate in restage.
7. **Generic confirmation branch** in `buildConfirmationWidget`.
8. **Testing.md updates** — replace §7.A's "verify each by running…" prose with a real table.
9. **Run `npx tsc --noEmit`** after each phase.

## Verification

End-to-end flow per group, executed by tester:

1. **Run `npx tsc --noEmit`** — must show 0 errors after each implementation phase.
2. **For each of the 8 groups:**
   - Paste the trigger phrase from §7.A's new table into chat (Demo mode).
   - Verify the matching widget surface renders (per fixture-to-widget table above).
   - Verify the matching capability chip group appears below the response.
   - Click each chip in the group; verify the resulting turn matches the chip-click downstream table (existing email-draft surface, new fixture, form-restage of parent, etc.).
3. **AI mode (`?ai=true`)**: re-run a representative chip from each group that uses AI restage (sr-2 "Modify quantities", ad-17 "Add more metrics"). Verify the form re-stages with the parsed change. Confirm "no changes detected" toast in Demo mode without `ANTHROPIC_API_KEY` (documented behavior).
4. **Confirm dispatch**: Verify ConsentTurnRenderer fires for `sr2-reorder` and `ad29-workflow` (form + consent banner visible); StandardTurnRenderer fires for the other 6 (no consent banner, just widgets + closing text).
5. **Persona spot-check**: switch persona to Friendly / Executive — closing text remains the fixture text (no persona variants), but the rest of the surface stays consistent.
6. **Text-only mode**: toggle "Show widgets" OFF in Settings, run all 8 trigger phrases, verify each renders only the text-only fixture's closing text and zero widgets.
7. **Chip chain depth cap**: verify §7.C's `MAX_CHIP_CHAIN_DEPTH=3` still applies — clicking 3 chips in a row through any new group ends with the "What would you like to do next?" terminal text.

When all 8 groups + their 22 chips behave per the table above, Testing.md §7.A goes from "deferred" to ✅.










While testing "Open any saved dashboard → sidebar → "add a metric" → inline ClarificationCard scoped to that dashboard's category." I saw the clarification card, selected 2 metrics and added them to the dashboard, but got the following error in  the terminal : 
"
## Error Type
Console Error

## Error Message
Cannot update a component (`DashboardBuilderProvider`) while rendering a different component (`DashboardKaiSidebar`). To locate the bad setState() call inside `DashboardKaiSidebar`, follow the stack trace as described in https://react.dev/link/setstate-in-render


    at replaceDashboard (src/contexts/DashboardBuilderContext.tsx:40:5)
    at DashboardKaiSidebar.useCallback[handleClarifyConfirm] (src/components/dashboard-builder/DashboardKaiSidebar.tsx:308:7)
    at DashboardKaiSidebar (src/components/dashboard-builder/DashboardKaiSidebar.tsx:175:43)
    at DashboardFullView (src/components/dashboard-builder/DashboardFullView.tsx:167:7)
    at ViewContent (src/components/layout/MainContent.tsx:48:40)
    at MainContent (src/components/layout/MainContent.tsx:62:9)
    at LayoutShell (src/components/layout/LayoutShell.tsx:137:9)
    at Page (src/app/page.tsx:10:7)

## Code Frame
  38 |
  39 |   function replaceDashboard(d: DashboardCompositeData) {
> 40 |     setActiveDashboard(d);
     |     ^
  41 |   }
  42 |
  43 |   return (

Next.js version: 16.2.4 (Turbopack)
"