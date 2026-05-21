# Routing Wire-Up — Caps 1–6 + 6 Reports + Chip Chains

## Context

All 14 new fixtures are authored on disk but **none of them stream** because the routing pipeline has gaps in five places. The user reports stale widgets / nothing rendering. This plan documents exactly what's wired, what's not, and the minimum surface area to fix it.

### The streaming pipeline (verified)

```

user input

  → handleSend()                                ChatShell.tsx:2350

  → matchSpecialCapabilityQuery() returns useCase ChatShell.tsx:2605  ✅ wired (queryMatcher.ts:213-226)

  → setKaiTurns([{ useCase, ... }])                                  ✅ KaiTurn union has cap*/report-* (ChatShell.tsx:154-167)

  → ConsentTurnRenderer / StandardTurnRenderer renders the turn

  → useStreamSimulator(useCase) loads fixture from fixtureMap         ❌ NO cap*/report-* ENTRIES (useStreamSimulator.ts:8-46)

  → returns empty widgets array → renders nothing

```

**Root cause**: [src/hooks/useStreamSimulator.ts](src/hooks/useStreamSimulator.ts) `fixtureMap` (lines 8-46) is the source of truth for "which fixture file gets loaded for which useCase." All 14 Cap/Report fixtures are missing from it. The `useStreamSimulator` type union (lines 96-117) also doesn't list the new useCases, causing the cast at ChatShell.tsx:1452 to silently coerce to a type that returns no fixture loader.

The reason **previous (stale) widgets show** is that ChatShell preserves prior `kaiTurns`. A new turn is appended with `useCase: 'cap1-task-email'`, but its `useStreamSimulator` returns `widgets: []` — the visible content is from the *previous* turn still mounted in the scroll view. Combined with the auto-confirm fallback when `requireConfirmation` is OFF, prior consent banners may also re-fire and re-render their fixtures.

## Wiring State — Before vs After

### 1. queryMatcher CAPABILITY_ROUTES (queryMatcher.ts:200-227)

| useCase | Keywords today | Status |

|---|---|---|

| `cap1-task-email` | `wildflower`, `birdhouse`, `samples`, `send email to wildflower` | ✅ Already wired |

| `cap2-lead-creation` | `add lead`, `new lead`, `create lead`, `pine and thistle`, `pine & thistle` | ✅ |

| `cap3-lead-won` | `move to won`, `convert lead`, `stage to won`, `verdant home`, `verdant` | ✅ |

| `cap4-merge-customer` | `merge`, `combine records`, `duplicate`, `garden gate` | ✅ |

| `cap5-user-creation` | `create user`, `website access`, `wizshop user`, `lakeside living`, `lakeside` | ✅ |

| `cap6-catalog-builder` | `build catalog`, `create wishlist`, `curated catalog`, `mountain bloom` | ✅ |

| `report-collection-performance` | `collection performance`, `how are collections`, `collection report` | ✅ |

| `report-prebook-pacing` | `pre-book pacing`, `july release`, `july 2026`, `release pacing` | ✅ |

| `report-customer-health` | `customer health`, `account health`, … | ✅ |

| `report-pipeline` | `pipeline`, `lead conversion`, … | ✅ |

| `report-team-performance` | `team performance`, `rep performance`, `team report` | ✅ |

| `report-catalog-health` | `catalog health`, `inventory status`, `stock levels`, `catalog report` | ✅ |

**No changes needed in queryMatcher.** Routes already land correctly.

### 2. useStreamSimulator fixtureMap (useStreamSimulator.ts:8-46) — THE BUG

| useCase | Today | Required |

|---|---|---|

| `cap1-task-email` | ❌ missing | → load `cap1-task-email-voice.json` |

| `cap1-email-draft` | ❌ missing (chip-chained) | → load `cap1-email-draft.json` |

| `cap1-task-confirmed` | ❌ missing | → load `cap1-task-confirmed.json` (post-confirm — see §5) |

| `cap2-lead-creation` | ❌ missing | → load `cap2-lead-creation.json` |

| `cap2-auto-task` | ❌ missing (chip-chained) | → load `cap2-auto-task-followup.json` |

| `cap3-lead-won` | ❌ missing | → load `cap3-lead-stage-won.json` |

| `cap3-conversion-confirmed` | ❌ missing | → load `cap3-conversion-confirmed.json` |

| `cap4-merge-customer` | ❌ missing | → load `cap4-merge-customer.json` |

| `cap4-merge-confirmed` | ❌ missing | → load `cap4-merge-confirmed.json` |

| `cap5-user-creation` | ❌ missing | → load `cap5-user-creation.json` |

| `cap5-user-confirmed` | ❌ missing | → load `cap5-user-confirmed.json` |

| `cap6-catalog-builder` | ❌ missing | → load `cap6-catalog-creation.json` |

| `cap6-catalog-confirmed` | ❌ missing | → load `cap6-catalog-confirmed.json` |

| `report-collection-performance` | ❌ missing | → load `report-collection-performance.json` |

| `report-prebook-pacing` | ❌ missing | → load `report-prebook-pacing.json` |

| `report-customer-health` | ❌ missing | → load `report-customer-health.json` |

| `report-pipeline` | ❌ missing | → load `report-pipeline.json` |

| `report-team-performance` | ❌ missing | → load `report-team-performance.json` |

| `report-catalog-health` | ❌ missing | → load `report-catalog-health.json` |

### 3. useStreamSimulator type union (useStreamSimulator.ts:96-117)

Currently lists only `uc1/uc2/uc3/uc1-swap/uc2-restage/uc2-order/docs-qa/email-*/sr*/ad*`. Must add all 14 new useCases (cap1–6 + 6 reports) plus the 5 chained ones (`cap1-email-draft`, `cap1-task-confirmed`, `cap2-auto-task`, `cap3-conversion-confirmed`, `cap4-merge-confirmed`, `cap5-user-confirmed`, `cap6-catalog-confirmed`).

### 4. ChatShell `KaiTurn.useCase` union (ChatShell.tsx:128-167)

Already has `cap1-task-email` through `cap6-catalog-builder` + all 6 `report-*` keys. **Missing the chain useCases**: `cap1-email-draft`, `cap1-task-confirmed`, `cap2-auto-task`, `cap3-conversion-confirmed`, `cap4-merge-confirmed`, `cap5-user-confirmed`, `cap6-catalog-confirmed`. These need to be appended.

### 5. Post-confirm fixture loading (the second bug)

[ConsentTurnRenderer at ChatShell.tsx:351-358](src/components/chat/ChatShell.tsx#L351-L358) wires consent via `useConsentFlow` with `onConfirmed: wrappedOnConfirmed` + a `deepLink`. On confirm, [useConsentFlow.ts:33 `buildConfirmationWidget`](src/hooks/useConsentFlow.ts#L33) builds an AW-003 dialog inline (with `isOrder`/`isTask` branches only) — **it does NOT load the `*-confirmed.json` fixtures we authored**.

Two options for post-confirm:

-**(a) Spawn a follow-up turn** with a `*-confirmed` useCase (so useStreamSimulator loads the fixture). Best when chips are needed on the confirmation. Requires adding a post-confirm spawn helper.

-**(b) Don't render *-confirmed.json fixtures at all** — keep the auto-built AW-003 from `buildConfirmationWidget` and extend its branches to handle lead/customer/merge/user/catalog cases. Smaller blast radius. The authored `*-confirmed.json` fixtures become dead weight unless we want chips below them.

**Recommended: option (b) for the user-visible AW-003 message** plus option (a) **only for Cap 2's auto-task follow-up** (which is a brand-new fixture with its own form, not just a success dialog). Concretely:

- Extend `buildConfirmationWidget` ([useConsentFlow.ts:33-115](src/hooks/useConsentFlow.ts#L33)) with branches for `isLead` (Cap 2), `isCustomerConversion` (Cap 3 — fields contain `taxId`), `isMerge` (Cap 4 — fields contain `mergeTarget`), `isUser` (Cap 5 — fields contain `username`), `isCatalog` (Cap 6 — fields contain `catalogName`). Each produces a tailored success message.
- For **Cap 2 auto-task**: after the lead-confirm `addLead` fires inside `handleConfirmed`, spawn a follow-up turn with `useCase: 'cap2-auto-task'` so useStreamSimulator loads `cap2-auto-task-followup.json` below the success dialog. Need a new spawn helper or inline `setKaiTurns(prev => [...prev, { id, useCase: 'cap2-auto-task', ... }])` at the end of the cap2 branch in `handleConfirmed`.
- The 5 other `*-confirmed.json` fixtures become unused — flag as cleanup or keep on disk for future "chips below confirmation" wiring.

### 6. Chip-map entries (action-chips-map.json)

Verified by grep: **no `cap*` or `report-*` keys exist today** in `capabilityChips`. Required additions per `USECASE_CHIP_KEY` lookup pattern at [ChatShell.tsx:59-86](src/components/chat/ChatShell.tsx#L59):

| useCase | chip-key to add | Chips (label / query) |

|---|---|---|

| `cap1-task-email` | `cap1-task-email` | `Draft the email now` → `Draft the email for Wildflower Market now`; `View in CRM` → `Show me overdue tasks`; `Create another task` → `Create another task` |

| `cap1-email-draft` | `cap1-email-draft` | `Make it more casual` → `Rewrite the email in a more casual tone`; `Add the July release preview` → `Add the July 2026 release preview to the email`; `Send it` → `Send the email` |

| `cap2-lead-creation` | `cap2-lead-creation` | `Draft intro email to Emma` → `Draft an intro email to Emma at Pine & Thistle`; `View lead in CRM` → `Show me my leads`; `Show me all new leads this week` → `Show me all new leads this week` |

| `cap3-lead-won` | `cap3-lead-won` | `Create their first order` → `Create a new order for {customerName}`; `Set up website access` → `Set up website access for {customerName}` (→ Cap 5); `Build a welcome catalog` → `Build a catalog for {customerName}` (→ Cap 6); `View customer profile` → `Show {customerName} profile` |

| `cap4-merge-customer` | `cap4-merge-customer` | `View merged record` → `Show me the merged customer record`; `Create a re-engagement order` → `Create a re-engagement order for The Garden Gate Shop`; `Draft 'welcome back' email` → `Draft a welcome-back email to David` |

| `cap5-user-creation` | `cap5-user-creation` | `Build a catalog for Lakeside Living` → `Build a catalog for Lakeside Living` (→ Cap 6); `Create their first wishlist` → `Create a wishlist for Lakeside Living`; `View user in manage panel` → `Show me website users` |

| `cap6-catalog-builder` | `cap6-catalog-builder` | `Email this catalog to Julia` → `Draft an email to Julia at Mountain Bloom with this catalog`; `Add Bunnies collection products` → `Add Bunnies collection products to this catalog`; `Convert to wishlist` → `Convert this catalog to a wishlist`; `View in My Catalogs` → `Show me my catalogs` |

Reports (Cap 7) don't have chip groups in the original spec — skipping. Empty entries in `USECASE_CHIP_KEY` (`''`) are fine.

### 7. `USECASE_CHIP_KEY` map (ChatShell.tsx:59-86)

Add 7 entries:

```ts

'cap1-task-email':    'cap1-task-email',

'cap1-email-draft':   'cap1-email-draft',

'cap2-lead-creation': 'cap2-lead-creation',

'cap3-lead-won':      'cap3-lead-won',

'cap4-merge-customer':'cap4-merge-customer',

'cap5-user-creation': 'cap5-user-creation',

'cap6-catalog-builder':'cap6-catalog-builder',

// Chain & report useCases — no chip group

'cap1-task-confirmed': '',

'cap2-auto-task':      '',

'cap3-conversion-confirmed': '',

'cap4-merge-confirmed': '',

'cap5-user-confirmed':  '',

'cap6-catalog-confirmed':'',

'report-collection-performance': '',

'report-prebook-pacing':         '',

'report-customer-health':        '',

'report-pipeline':               '',

'report-team-performance':       '',

'report-catalog-health':         '',

```

### 8. Template variable resolution

[src/lib/templateVars.ts:21-109](src/lib/templateVars.ts) reads `{customerName}`, `{contactName}`, `{orderId}`, `{fromRep}`, `{toRep}` from the **last completed turn's widgets**. Verified behavior:

- After **Cap 3 conversion**, the staged UW-003 has `entityType: "lead"` with title "Verdant Home Collective". The current extractor reads `customerName` from `entityType === 'customer'` or `entityType === 'order'` UW-003s **only** — `entityType: 'lead'` is NOT a source. So `{customerName}` in the cap3 chip queries (`Build a catalog for {customerName}`) would not resolve.

**Fix**: extend `extractTemplateVars` to ALSO populate `customerName` from `UW-003` when `entityType === 'lead'` (use `title` as the name). This is a 4-line addition to templateVars.ts that doesn't break existing behavior (lead-name leaking into customer slot is acceptable — the chip is asking "build catalog for this entity").

Alternative: hard-code customer name in the chip query (e.g., `Build a catalog for Verdant Home Collective`). Less reusable. Going with the templateVars extension.

### 9. The chip chain — Cap 5 → Cap 6 verification

`cap5-user-creation` chips include `Build a catalog for Lakeside Living`. When clicked, `handleChipClick` calls `handleSend` which routes through `matchSpecialCapabilityQuery` → matches `build catalog` AND `lakeside` keywords. **`build catalog` resolves to `cap6-catalog-builder` first** (it's the earlier route in CAPABILITY_ROUTES order: `Array.find` returns first match). Confirmed working.

But: cap6 fixture is hardcoded for Mountain Bloom (L-9006), not Lakeside Living. The Lakeside chip will fire cap6 but render the **Mountain Bloom** catalog. Two fixes:

-**(a)** Accept the cosmetic mismatch (demo is single-track — clicking Lakeside chip shows Mountain Bloom; user can hand-wave it).

-**(b)** Param-ize cap6 fixture by lead name (substantially more work — `useStreamSimulator` doesn't support templated fixtures today).

Going with **(a)** — flag in the chip query so the narrative reads "Build a catalog for Lakeside Living" but the result shows Mountain Bloom's curated grid. Annotated as a known limitation.

## Diff Summary

| File | Change |

|---|---|

| [src/hooks/useStreamSimulator.ts](src/hooks/useStreamSimulator.ts) | (1) Add 14 new useCases to type union; (2) add 14 fixture imports to `fixtureMap` |

| [src/components/chat/ChatShell.tsx](src/components/chat/ChatShell.tsx) | (1) Append 7 chain useCases to `KaiTurn.useCase` union (lines 128-167); (2) add 13 entries to `USECASE_CHIP_KEY` (lines 59-86); (3) inside `handleConfirmed` Cap 2 branch, spawn `cap2-auto-task` follow-up turn after `addLead` fires |

| [src/fixtures/action-chips-map.json](src/fixtures/action-chips-map.json) | Add 7 chip groups under `capabilityChips`: `cap1-task-email`, `cap1-email-draft`, `cap2-lead-creation`, `cap3-lead-won`, `cap4-merge-customer`, `cap5-user-creation`, `cap6-catalog-builder` |

| [src/hooks/useConsentFlow.ts](src/hooks/useConsentFlow.ts) | Extend `buildConfirmationWidget` (line 33) with discriminator branches for lead (`company`+`source`), customer-conversion (`taxId`), merge (`mergeTarget`), user (`username`), catalog (`catalogName`) — produces a tailored success message instead of the generic fallback |

| [src/lib/templateVars.ts](src/lib/templateVars.ts) | Extend `extractTemplateVars` (line 38) to read `customerName` from UW-003 when `entityType === 'lead'` (using `title`) |

## Files NOT Touched

- queryMatcher.ts — all routes already correct.
- The 14 Cap/Report fixtures — JSON unchanged.
- ChatShell `handleConfirmed` Cap 1/3/4/5/6 branches — they already handle shared-state writes correctly; Cap 2 is the only one that needs an *additional* follow-up spawn.
- Post-confirm `*-confirmed.json` fixtures — left on disk as dead code for now (no streaming wire). Flag as cleanup once Phase 5 is closed.

## Verification

1.`npx tsc --noEmit` — must be clean. Most surface area is type-union widening.

2. Boot dev server.
3. Type each Cap keyword in a fresh chat session (click "New conversation" between caps to avoid stale-widget visual):

-`Create a task for Wildflower Market` → cap1 widgets stream (UW-014 → UW-003 → AW-004 → AW-012). Confirm → success dialog with tailored "Task created" message. 3 chips appear: Draft the email now / View in CRM / Create another task. Click "Draft the email now" → cap1-email-draft fixture streams.

-`Add a lead for Pine & Thistle` → cap2 lead form streams. Confirm → lead-created dialog + cap2-auto-task fixture spawns below it with the auto-task form + own consent banner. Confirm the auto-task → second success dialog. CRM page shows new lead + new task.

-`Move Verdant Home to Won` → cap3 streams. Confirm → customer-created dialog. Chips include "Set up website access" + "Build a welcome catalog". Click "Build a welcome catalog" → cap6 fires (Mountain Bloom narrative — cosmetic mismatch noted).

-`Merge Garden Gate` → cap4 side-by-side renders. Confirm → merge-complete dialog. View merged record / Create re-engagement / Draft welcome-back chips visible.

-`Create a website user for Lakeside Living` → cap5 streams. Confirm → user-created dialog. "Build a catalog for Lakeside Living" chip → cap6 fires.

-`Build a catalog for Mountain Bloom` → cap6 product grid renders with all 11 real product images. Confirm → catalog-saved dialog.

- For reports, type `Show me collection performance`, `Show me pre-book pacing`, `Show me customer health`, `Show me pipeline`, `Show me team performance`, `Show me catalog health` — each streams its UW-014 + UW-030 dashboard with no consent step.

4. Refresh between cap tests if visual confusion arises — in-memory state persists across sends in a session.
5. Negative test: `How's Acme doing?` returns unknown (verified earlier).

## Resolved Decisions

-**Stale-widget root cause = missing `fixtureMap` entries**, not a render-state bug. Earlier diagnosis confirmed.

-**Post-confirm dialogs**: extend `buildConfirmationWidget` rather than loading separate `*-confirmed.json` fixtures (smaller blast radius; matches existing pattern).

-**Cap 2 auto-task**: special-cased — spawns a real follow-up turn so its AW-004 + AW-012 actually render.

-**Cap 5 → Cap 6 chip "Build a catalog for Lakeside Living"**: accepts cosmetic Mountain Bloom mismatch as a known demo limitation rather than building a fixture parameterization layer.

-**Template vars**: extend `extractTemplateVars` to populate `customerName` from `entityType === 'lead'` UW-003 cards so Cap 3 chips resolve.

-**`*-confirmed.json` fixtures (5 files)**: left as dead code, not deleted. Phase-5 cleanup item.
