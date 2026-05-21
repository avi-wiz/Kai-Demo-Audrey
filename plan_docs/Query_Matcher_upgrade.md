# Query Matcher Upgrade — Audrey vDemo Capability Routes

## Context

The Kai vDemo needs the 7 demo capabilities (Caps 1–6 plus 6 reports under Cap 7) to fire when the CEO types or clicks the corresponding starter prompts/chips. Today `src/lib/queryMatcher.ts` routes only the v2-era `sr*`/`ad*`/`uc*` capabilities and still carries Acme-flavored keywords. This change wires Audrey capability keywords + report keywords into the existing router, and neutralizes "acme" so the CEO never triggers an Acme-flavored fixture.

The fixture JSON files referenced by these new routes (`cap1-…json` through `cap6-…json` and `report-*.json`) do **not yet exist** — they're scheduled for Phase 4 of the workflow. This plan therefore stages **only the routing entries** in a way that compiles cleanly without those fixtures: routes that depend on a fixture file go in commented-out blocks with `TODO(cap-fixtures)` markers, while the Acme→Audrey keyword cleanup ships immediately.

Per the user request, the plan file lives at `Query_Matcher_upgrade.md` (this file copied/renamed at write time — see Phase 5).

---

## Files To Modify

| File | Why |
|---|---|
| `src/lib/queryMatcher.ts` | All routing tables live here. Single file edit. |

No new files are created in this step. Fixture creation is a separate phase.

---

## Current Router Structure (verified)

Routing order in `src/components/chat/ChatShell.tsx` (`handleSend`):
`matchDashboardQuery` → `matchPageContextQuery` → `matchSpecialQuery` → `matchSpecialCapabilityQuery` → order/email heuristics → `matchQuery` (uc fallback).

Three route tables are relevant:

1. **`SPECIAL_ROUTES`** (lines 141–150) — `{ keywords, fixture }`, fixture imported at top. Pre-empts email/general matchers.
2. **`CAPABILITY_ROUTES`** (lines 190–201) — `{ keywords, useCase }`. `useCase` is a string union (`CapabilityUseCase`, lines 180–188); ChatShell looks it up to pick a fixture/prompt path.
3. **`matchQuery`** (lines 219–240) — General classifier returning `'uc1' | 'uc2' | 'uc3' | 'unknown'`. Contains 3 `m.includes('acme')` checks (lines 225, 235) plus an "acme orders" / "acme corp orders" entry in `SPECIAL_ROUTES` (line 143) and `restock acme` / `invoice for acme` in `CAPABILITY_ROUTES` (lines 191–192).

The lightest-touch route shape for a JSON-fixture-backed capability is `SPECIAL_ROUTES` (already what `meetingPrepFixture` and `orderHistoryFixture` use). Caps 1–6 and the 6 reports will follow this same shape.

---

## Plan

### 1. Extend `CapabilityUseCase` (lines 180–188)

Add 12 new identifiers — 6 for caps, 6 for reports:

```ts
export type CapabilityUseCase =
  | 'sr2-reorder' | 'sr11-invoice' | 'sr14-brief' | 'sr20-outreach'
  | 'ad1-approval' | 'ad3-handoff' | 'ad17-report' | 'ad29-workflow'
  // Audrey vDemo caps
  | 'cap1-task-email' | 'cap2-lead-creation' | 'cap3-lead-won'
  | 'cap4-merge-customer' | 'cap5-user-creation' | 'cap6-catalog-builder'
  // Audrey vDemo reports
  | 'report-collection-performance' | 'report-prebook-pacing'
  | 'report-customer-health' | 'report-pipeline'
  | 'report-team-performance' | 'report-catalog-health';
```

This is a pure type extension — no runtime change, no fixture dependency. Safe to land now. ChatShell will need a switch-case for each new useCase later (separate task in Phase 4).

### 2. Add Audrey capability routes to `CAPABILITY_ROUTES` (after line 197, before the ad29 comment)

Append the following entries inside the existing array. Keywords come straight from the user's spec:

```ts
// Audrey vDemo capabilities (Caps 1–6)
{ keywords: ['wildflower', 'birdhouse', 'samples', 'send email to wildflower'], useCase: 'cap1-task-email' },
{ keywords: ['add lead', 'new lead', 'create lead', 'pine and thistle', 'pine & thistle'], useCase: 'cap2-lead-creation' },
{ keywords: ['move to won', 'convert lead', 'stage to won', 'verdant home', 'verdant'], useCase: 'cap3-lead-won' },
{ keywords: ['merge', 'combine records', 'duplicate', 'garden gate'], useCase: 'cap4-merge-customer' },
{ keywords: ['create user', 'website access', 'wizshop user', 'lakeside living', 'lakeside'], useCase: 'cap5-user-creation' },
{ keywords: ['build catalog', 'create wishlist', 'curated catalog', 'mountain bloom'], useCase: 'cap6-catalog-builder' },

// Audrey vDemo reports (Cap 7)
{ keywords: ['collection performance', 'how are collections', 'collection report'], useCase: 'report-collection-performance' },
{ keywords: ['pre-book pacing', 'july release', 'july 2026', 'release pacing'], useCase: 'report-prebook-pacing' },
{ keywords: ['account health', 'customer dashboard'], useCase: 'report-customer-health' },
{ keywords: ['lead conversion', 'my pipeline', 'pipeline report'], useCase: 'report-pipeline' },
{ keywords: ['team performance', 'team report'], useCase: 'report-team-performance' },
{ keywords: ['catalog health', 'inventory status', 'stock levels', 'catalog report'], useCase: 'report-catalog-health' },
```

**Decision (confirmed with user): hijack the legacy DASHBOARD_ROUTES** so the natural-language keywords route to the new Audrey report fixtures rather than the v2 Acme dashboards. This means the `'customer health'` keyword set on line 64 and the `'pipeline'` keyword set on line 72 will be relocated.

Concrete sub-steps (executed as part of step 2):

- **Remove the entire `customerHealthFixture` entry (lines 63–66)** from `DASHBOARD_ROUTES`. Move its keywords (`'customer health'`, `'customer dashboard'`, `'customer retention'`, `'dormant customer'`, `'churn dashboard'`, `'retention dashboard'`) into the new `report-customer-health` capability route. **Also remove the now-unused `customerHealthFixture` import** at line 31 (TypeScript will flag this if left dangling).
- **Remove the entire `pipelineFixture` entry (lines 71–74)** from `DASHBOARD_ROUTES`. Move its keywords (`'pipeline dashboard'`, `'pipeline health'`, `'open quotes'`, `'quote pipeline'`, `'deal pipeline'`, `'show pipeline'`) plus the user's requested ones (`'pipeline'`, `'lead conversion'`, `'my pipeline'`, `'pipeline report'`) into the new `report-pipeline` capability route. **Also remove the now-unused `pipelineFixture` import** at line 32.
- **`'rep performance'`** (line 76) is still on the `salesPerfFixture` "build me a dashboard" entry. That entry has multiple other generic keywords (`'sales dashboard'`, `'build a dashboard'`, etc.) and isn't a pure rep-performance route — leave it intact, but add `'rep performance'` to the new `report-team-performance` route too. Since `matchDashboardQuery` runs first, `'rep performance'` will still hit the legacy sales-performance dashboard until that fixture is also retired (out of scope for this PR). Keyword stays in the new route as documented intent.
- **`'july release'`, `'july 2026'`, `'release pacing'`** — clean, no collision.
- **`'create task'`** was in the user's Cap 1 spec but it's also the trigger for `uc2` in `matchQuery` (line 231) and is intercepted in ChatShell's order/task heuristics. Dropped from Cap 1 keywords; the remaining 4 (`wildflower`, `birdhouse`, `samples`, `send email to wildflower`) are unique enough. Voice-typed "create task for Wildflower" still routes via `wildflower`.
- **Updated report routes after hijack:**
  ```ts
  { keywords: ['collection performance', 'how are collections', 'collection report'], useCase: 'report-collection-performance' },
  { keywords: ['pre-book pacing', 'july release', 'july 2026', 'release pacing'], useCase: 'report-prebook-pacing' },
  { keywords: ['customer health', 'account health', 'customer dashboard', 'customer retention', 'dormant customer', 'churn dashboard', 'retention dashboard'], useCase: 'report-customer-health' },
  { keywords: ['pipeline', 'lead conversion', 'my pipeline', 'pipeline report', 'pipeline dashboard', 'pipeline health', 'open quotes', 'quote pipeline', 'deal pipeline', 'show pipeline'], useCase: 'report-pipeline' },
  { keywords: ['team performance', 'rep performance', 'team report'], useCase: 'report-team-performance' },
  { keywords: ['catalog health', 'inventory status', 'stock levels', 'catalog report'], useCase: 'report-catalog-health' },
  ```

**Hijack risk:** until Phase 4 authors `report-customer-health.json` and `report-pipeline.json`, the keywords that previously hit the legacy dashboards will now match a useCase that ChatShell can't yet resolve. Two mitigations:
1. Phase 4 fixture authoring should land before this PR ships to the demo, OR
2. Leave the legacy dashboard entries in place commented-out as a rollback safety net (recommended — adds ~10 lines of comments to the diff but zero runtime cost). Plan goes with mitigation 2.

### 3. Acme → Audrey keyword cleanup

Five surgical edits in `queryMatcher.ts`:

| Line | Current | New |
|---|---|---|
| 143 | `'orders for acme', 'acme orders', 'orders from acme', 'acme corp orders'` | `'orders for magnolia', 'magnolia orders', 'orders from magnolia', 'magnolia home orders'` |
| 191 | `'restock acme'` | `'restock magnolia'` |
| 192 | `'invoice for acme'` | `'invoice for magnolia'` |
| 225 | `m.includes('acme') && (...)` | `m.includes('magnolia') && (...)` |
| 235 | `m.includes('acme')` | `m.includes('magnolia')` |

Magnolia Home & Garden (C-8001) is the biggest Audrey account — natural stand-in for the "marquee customer intel" role Acme played. This keeps uc1/uc2/uc3 alive as a graceful fallback for queries about Magnolia until the cap fixtures are authored.

Note: there are additional Acme references in `src/lib/constants.ts` (lines 4, 6) and `src/lib/workflowCatalog.ts` (lines 111, 119, 236, 274) — those are **out of scope for this file** but should be tracked in a follow-up Acme sweep (already on the Progress doc as Step 7.2).

### 4. Fixture imports — DEFERRED

The 14 cap/report fixture files do not exist on disk. Importing them at the top of `queryMatcher.ts` now would crash the TypeScript build. `CAPABILITY_ROUTES` only stores `useCase` strings (not fixture references), so the entries in step 2 compile fine with no fixture imports. ChatShell's switch on `useCase` will be the place where the fixture file is loaded once they exist — that's Phase 4 work, not this step.

Net effect of this plan: routing keywords are in place, but routes for unauthored cap fixtures will fall through ChatShell's `useCase` switch (likely to a "fixture not found" path) until Phase 4 adds the JSON files + switch cases. Cap routes are inert until then. That's intentional — it lets us land the keyword changes in a small, reviewable diff without coupling them to the fixture work.

---

## Critical Files (for execution & verification)

- `src/lib/queryMatcher.ts` — the only file edited
- `src/components/chat/ChatShell.tsx` lines 2589–2606 — consumer of `matchSpecialCapabilityQuery`; will need a `useCase → fixture` switch update in Phase 4
- `src/lib/constants.ts`, `src/lib/workflowCatalog.ts` — out of scope, tracked for follow-up Acme sweep
- `CLAUDE.md` §"The 7 Demo Capabilities" — source of truth for keyword spec

## Existing Utilities Reused

- `matchSpecialCapabilityQuery` (queryMatcher.ts:203) — no signature change needed; it iterates `CAPABILITY_ROUTES` generically
- The `isDelegated` guard (queryMatcher.ts:208–214) already prevents `'email'`/`'draft'`/`'create … task'`/`'save … dashboard'` from triggering capability fixtures. Verified the new Audrey keywords don't accidentally match this guard except `'create lead'`/`'create user'` — neither contains the word `task`/`email`/`draft`/`dashboard`, so they pass through cleanly.

## Verification

1. `npx tsc --noEmit 2>&1` — must be clean. The type-union extension is the main thing that could fail.
2. Boot dev server (`npm run dev`), open localhost:3000.
3. Manual keyword test in Kai chat (with `matchSpecialCapabilityQuery` returning a useCase that ChatShell doesn't yet route — expect the fallback "I don't have that capability yet" reply OR an explicit console log if added). Try at minimum:
   - "Tell me about Wildflower Market" → should classify as `cap1-task-email`
   - "Create a lead for Pine & Thistle" → `cap2-lead-creation`
   - "Move Verdant Home to won" → `cap3-lead-won`
   - "Merge Garden Gate records" → `cap4-merge-customer`
   - "Create a website user for Lakeside Living" → `cap5-user-creation` *(verify the `isDelegated` guard does NOT trip — `create user` has no `task`/`email`/`draft`)*
   - "Build a catalog for Mountain Bloom" → `cap6-catalog-builder`
   - "Show me collection performance" → `report-collection-performance`
   - "Show pre-book pacing" → `report-prebook-pacing`
4. Acme regression check: type "How's Acme doing?" — should now return `'unknown'` from `matchQuery`, not `'uc1'`. Type "How's Magnolia doing?" — should return `'uc1'` and route through uc1 fixture (will still show Acme-flavored fixture content until uc1 fixtures are rewritten in the follow-up Acme sweep).
5. To confirm wiring without exposing the cap routing gap to UI: add a temporary `console.log` in ChatShell's `matchSpecialCapabilityQuery` consumer that logs the matched `useCase`, run the test queries, remove the log after verification.

## Resolved Decisions

- **Keyword collision** → Hijack legacy `DASHBOARD_ROUTES`. Customer-health and pipeline keywords move to the new report routes; legacy dashboard entries get commented out as a rollback safety net. Unused fixture imports removed.
- **Plan filename** → Plan is mirrored from this harness-mandated location to `Query_Matcher_upgrade.md` in the repo (at `/Users/avi/Code/WizCommerce_Work/POCs/kai-poc-demo/plan_docs/Query_Matcher_upgrade.md` to sit alongside the other plan docs) as the first action after exiting plan mode.
