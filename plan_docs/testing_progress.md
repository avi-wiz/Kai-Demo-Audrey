# Kai 2.0 POC v2.1 — Testing Progress & Resolutions

Living log of the v2.1 capability-chip QA sweep (per `Testing.md` §7.A). Each entry records what was tested, what broke, and how it was resolved.

---

## Scope

Battle-testing the 8 capability-chip groups wired in `Plan_sr_update.md`:

`sr-2` · `sr-11` · `sr-14` · `sr-20` · `ad-1` · `ad-3` · `ad-17` · `ad-29`

Test pattern: trigger the group's seed query → exercise each chip → verify routing, fixtures, template-var resolution, downstream renderers.

---

## sr-2 — Reorder flow

**Seed:** "Reorder for Acme Corp" / "Restock Acme" → `sr2-reorder` fixture

### Bugs resolved

| # | Bug | Fix |
|---|---|---|
| 1 | AI restage parse error: `SyntaxError: Unexpected token 'I'` | Strengthened JSON-only prompt in [`/api/kai/restage`](src/app/api/kai/restage/route.ts); defensive `{...}` slice extraction with fallback to `{changes: []}`. |
| 2 | Staged form showed "Task" entity-type tag instead of "Order" | `RestageRenderer` was hardcoded `entityType='task'`. Added `isOrder` discriminator based on field presence (`subtotal`). |
| 3 | Render-phase `setState` warning in `MultiStepFormWizard` | Moved `onValuesChange` out of `setValues` updater into a `useEffect` with first-run guard + ref. |
| 4 | "Maximum update depth exceeded" on Restock Acme | `liveFormFields` recreated a fresh array each render. Replaced with `editedSignature` string + `liveFormFieldsRef` to gate updates. |
| 5 | "Compare with original" chip rendered hardcoded quantities, ignoring edits | Snapshotted `liveFields` onto the new `KaiTurn` + added `patchCompareWidget` that rebuilds UW-004 rows from snapshot using `SR2_SKU_PRICES` lookup + `parseLineItems` regex. |
| 6 | Subtotal didn't update in the staged reorder card **or** the side-by-side compare | Auto-recompute block now compares edits against `baseFormFields` baseline (`itemsActuallyChanged` / `subtotalActuallyChanged`) so derived subtotal updates whenever items change. |
| 7 | Order Created success state showed pre-edit total | Recomputed subtotal now flows through `handleConfirmed` into shared-orders state. |

---

## sr-11 — Overdue invoice follow-up

**Seed:** "Show me overdue invoice for Acme" / "Payment due" → `sr11-invoice` fixture

### Bugs resolved

| # | Bug | Fix |
|---|---|---|
| 8 | Chips "Create task for this" / "Email the customer" re-rendered the **same** `sr11-invoice` fixture instead of routing to task/email flows | Tightened `sr-11` keyword set in `matchSpecialCapabilityQuery` to require `overdue invoice` / `payment due` / `pull up invoice` etc. Added `isDelegated` guard that short-circuits to dedicated routers when the query contains `email`, `draft`, `create…task`, or `save…dashboard`. |
| 9 | MetricCard rendered `$18,200` as `$18,200,200` | `CountUp` regex `/[0-9.]+/` was stopping at the comma. Changed to `/[0-9][0-9,.]*/` to consume the full digit/comma/period run. |
| 10 | "Create a follow-up task about this invoice" staged the default "Send Catalogue" UC-2 fixture | Created [`uc2-task-creation-invoice.json`](src/fixtures/uc2-task-creation-invoice.json) (INV-3382, due May 12, "Follow up on overdue invoice"). Added `'uc2-invoice'` branch to `effectiveUseCase` in `useStreamSimulator` (triggers on `/invoice/i.test(userQuery)`). |

---

## sr-14 — Meeting brief

**Seed:** "Meeting brief" / "Action items from meeting" → `sr14-brief` fixture

### Bugs resolved

| # | Bug | Fix |
|---|---|---|
| 11 | LLM overload error rendered as raw `[Error: overloaded_error …]` text in the response | Moved `client.messages.create()` *before* the `ReadableStream` open in [`/api/kai/generate`](src/app/api/kai/generate/route.ts) so upstream failures become real HTTP statuses (503 for overload, otherwise propagate). Removed `[Error: …]` text injection into the body. Added 600ms retry on 503 in [`useKaiGenerate`](src/hooks/useKaiGenerate.ts). |
| 12 | "Create tasks for the action items from this brief" staged the default Send Catalogue task | Created [`uc2-task-creation-brief.json`](src/fixtures/uc2-task-creation-brief.json) with the Q3 Catalog Review top-priority task + UW-011 list of 4 queued items. Added `'uc2-brief'` branch (`/from this brief|action items from/i`) to `effectiveUseCase`. |

---

## ad-1 — Approval queue

**Seed:** "Approval queue" (cmd-palette → "Show me everything waiting for my approval") → `ad1-approval` fixture

### Bugs resolved

| # | Bug | Fix |
|---|---|---|
| 13 | "Approval queue" trigger fell through to UC-1 — `ad-1` group not firing | Cmd-palette query is `"Show me everything waiting for my approval"`, which did not match the existing keyword set (`items waiting for approval` ≠ `waiting for my approval`). Broadened `ad-1` keywords in [`queryMatcher.ts`](src/lib/queryMatcher.ts) to include `waiting for approval`, `waiting for my approval`, `waiting on my approval`, `awaiting approval`, `awaiting my approval`, `needs my approval`, `need my approval`. |

---

## ad-3 — Rep handoff

**Seed:** "Rep handoff" / "Reassign rep" → `ad3-handoff` fixture

### Bugs resolved

| # | Bug | Fix |
|---|---|---|
| 14 | "Draft handoff email" chip resolved to `Draft a handoff email from Top priority to {toRep} with key account details` — both template vars wrong | `extractTemplateVars` read UW-011's first item `assignedTo` ("Top priority") as `fromRep`, and never saw "From Rep"/"To Rep" fields on the UW-003 handoff card. Added `entityType === 'handoff'` branch in [`templateVars.ts`](src/lib/templateVars.ts) that reads "From Rep" / "To Rep" directly and strips the trailing `(U-xxxx)` id suffix. |
| 15 | "Draft handoff email" still rendered default Follow-Up Email — Acme Corp fixture | `EmailDraftTurnRenderer` called `useStreamSimulator` without passing `turn.userQuery`, so variant routing always saw `undefined` and fell through. Threaded `turn.userQuery` through. |
| 16 | "Draft handoff email" / "Notify affected customers" produced wrong context (Rachel/Acme instead of Sara/handoff details) | Created [`email-handoff.json`](src/fixtures/email-handoff.json) (Heman → Sara, 12 accounts, $1.42M LTV, priority accounts) and [`email-customer-notify.json`](src/fixtures/email-customer-notify.json) (12 affected customers BCC, `{{first_name}}` merge tag). Added `email-handoff` / `email-customer-notify` branches to `effectiveUseCase` (`'handoff email'` and `'notification' + ('new rep' | 'affected customers')`). |
| 17 | "Rewrite the email in a more casual tone" after a handoff still rendered the Follow-Up Email — Acme Corp shorter fixture | Added carry-forward context in `spawnTurn`: when spawning `email-shorter`, scans the most recent email turn's `userQuery` and appends a hidden `__handoff__` / `__customernotify__` marker to the new turn's `userQuery`. Markers don't render in the user bubble (bubble uses original `trimmed` text). Simulator's `effectiveUseCase` reads markers and routes to [`email-handoff-casual.json`](src/fixtures/email-handoff-casual.json) or [`email-customer-notify-casual.json`](src/fixtures/email-customer-notify-casual.json). |

---

## ad-17 — Q1 Sales Report

**Seed:** "Q1 sales report" / "Quarterly report" / "Sales report" → `ad17-report` fixture

### Bugs resolved

| # | Bug | Fix |
|---|---|---|
| 18 | "Save as Dashboard" CTA inside the report (AW-001 widget) pointed to `/dashboards/save` — a dead URL | Added optional `action: 'save-as-dashboard'` to `DeepLinkButtonData` in [`types.ts`](src/lib/types.ts). New `WidgetActionContext` in [`FrameParser.tsx`](src/components/engine/FrameParser.tsx) exposes `onSaveAsDashboard?`. `DeepLinkButton` consumes it and renders as a `<button>` instead of `<a>` when `action` is set. `StandardTurnRenderer` wraps ad17-report turns in the provider and wires the handler to `handleSaveAsDashboardFromAd17`, which calls `buildDashboardFromAd17(widgets)` → opens the existing `SaveArtifactModal` with the report widgets reshaped as a `DashboardCompositeData`. Fixture updated to `{ action: "save-as-dashboard", url: "#" }`. |
| 19 | "Save as dashboard" action chip below the report opened the Sales Performance Dashboard instead of saving the current report | In `handleChipClick`, short-circuit when the last turn is `ad17-report` and the chip query matches `/save (this )?as (a )?dashboard/i` — call `handleSaveAsDashboardFromAd17` directly instead of routing through `handleSend` (which would hit `matchDashboardQuery`'s `'save as dashboard'` keyword). |
| 20 | "Add more metrics" chip surfaced docs-qa Sales Report KB entry instead of restaging the report | In Demo mode, no AI restage endpoint existed for the report's metric row. Added a new chip-intercept in `handleChipClick` and a manual-type intercept in `handleSend` that route metric-add queries to a new `/api/kai/restage-metrics` endpoint. Added `ad17AddedMetrics?: string[]` field on `KaiTurn` + `patchAd17MetricsWidget(w, labels)` helper that appends catalog cards + rewrites the UW-014 reasoning steps. |
| 21 | Restaged report turn rendered but the user bubble didn't pair with it — old turn became stale, new turn invisible | `userMessages.map((msg, i) => kaiTurns[i])` pairs by index. The chip intercept added a `kaiTurn` but no corresponding `Message`, breaking alignment. Fix: push the user `Message` BEFORE spawning the new turn. |
| 22 | "Add average order value and quote conversion rate" → duplicated the existing Quote Conversion card | Removed the redundant "Quote Conversion" card from the default [`ad17-report.json`](src/fixtures/ad17-report.json) baseline (3 cards now: Q1 Revenue, Orders, New Customers). The chip's deterministic demo trigger now appends AOV + Quote Conversion Rate cleanly. `patchAd17MetricsWidget` also de-dupes via case-insensitive label set. |
| 23 | "Email this report" chip rendered the default Follow-Up Email — Acme Corp fixture (Rachel / ORD-LATEST) | Created [`email-report-summary.json`](src/fixtures/email-report-summary.json) — Q1 leadership email with UW-014 reasoning, UW-003 email card (To: `leadership@wizcommerce.com`, Subject: "Q1 2026 Sales Report — $1.84M closed, +14% vs Q4", body with $1.84M / 412 orders / 27 customers / Pacific +24% / Riverstone +18% / Acme +12%). Registered the fixture in `useStreamSimulator`'s fixture map. Added `email-report-summary` branch to `effectiveUseCase`'s `email-draft` discriminator (matches `report summary` OR `report + leadership` on the userQuery). |
| 24 | No way to download the rendered report as an image | Installed `html-to-image` (~12KB gz). New [`DownloadSnapshotButton.tsx`](src/components/gtm/DownloadSnapshotButton.tsx) component renders an icon next to the share button; on click awaits `document.fonts.ready`, calls `toPng` at 2× pixel ratio with `skipFonts: true` to dodge cross-origin stylesheet `SecurityError`, triggers a download. `KaiResponse` converted to `forwardRef` with an optional `extraToolbar` slot, used only by ad17-report turns. Excluded UW-014 (AgentReasoningCard) and AW-001 (DeepLinkButton) from captures via `data-snapshot-ignore` on `WidgetEntrance` (gated by `SNAPSHOT_IGNORE_WIDGET_TYPES`). |
| 25 | PNG capture clipped metric cards beyond the 4th — UW-002 uses `overflowX: auto`, and `html-to-image` rasterizes only what's in view | Two-part fix: (a) `DownloadSnapshotButton` and `EmailAttachmentChip` temporarily set `overflowX/Y: visible` on every auto-scroll descendant before `toPng`, capture at natural `scrollWidth/scrollHeight`, then restore in a `finally`. (b) Replaced UW-002's flex+overflow layout with a CSS grid: up to 4 cards render as even columns; 5+ wrap to additional rows in a fixed 4-column grid (`repeat(4, minmax(180px, 1fr))`). Defense-in-depth: the un-clip helper stays wired for any other widget that might scroll. |
| 26 | "Email this report" should attach the PNG snapshot — but generating it on chip click would block the email turn | Followed the placeholder approach (Option C). New [`EmailAttachmentChip.tsx`](src/components/chat/EmailAttachmentChip.tsx) renders a faux file row (📎 `q1-sales-report.png · PNG · 248 KB · [Download]`) beneath the email card. On Download click, `querySelectorAll('[data-ad17-snapshot]')` finds the still-mounted ad17 frame and runs the same `toPng` capture. The ad17 frame self-tags via an effect that sets `data-ad17-snapshot="<turnId>"` when the turn mounts. |

---

## ad-29 — Workflows

**Seed (new):** "Set up a workflow" (vague) → ClarificationCard with 7 pre-built workflows · "Set up a `<name>` workflow" (specific) → direct apply

### Bugs resolved

| # | Bug | Fix |
|---|---|---|
| 27 | "Create another workflow" chip query (`Set up a workflow for dormant customer re-engagement`) got hijacked by `detectFollowUp` because the prior `ad29-workflow` turn was in the form-restage list and the keyword "set" matched | Removed `ad29-workflow` from the `FORM_RESTAGE_KEYWORDS`-eligible useCases in [`useFollowUp.ts`](src/hooks/useFollowUp.ts). Workflows don't have an editable AW-004 form — they should never go through form-restage. |
| 28 | Hardcoded single-workflow fixture (dormant re-engagement) — no way to support multiple pre-built workflows or workflow-specific test data | Created [`src/lib/workflowCatalog.ts`](src/lib/workflowCatalog.ts) — 7 workflows × full setup+test data each: dormant re-engagement, quote expiry reminder, low-stock reorder, VIP upgrade, high-value approval, stalled deal nudge, new customer onboarding. Each entry carries UW-003 fields, UW-002 audience metrics, reasoning summary, closing text, plus matching test metrics + sample triggered records for the "Test with sample data" turn. Helpers: `getWorkflow(id)`, `inferWorkflowId(message)`, `isVagueWorkflowRequest(message)`. |
| 29 | AW-006 ClarificationCard was multi-select only — workflows need radio (pick exactly one) | Extended `ClarificationCardData` in [`types.ts`](src/lib/types.ts) with `mode?: 'single' \| 'multi'`. ClarificationCard now renders `RadioIcon` instead of `CheckSquareIcon` when `mode==='single'`, hides the select-all row, hides the `(N)` counter on the confirm button, and replaces the selection on each toggle. |
| 30 | "Set up a workflow" always rendered the dormant fixture — no clarify path | Added a `workflow-clarification` turn type with `workflowClarificationPayload`. `handleSend` intercept (placed BEFORE `matchDashboardQuery`) checks for `(set up\|create\|build\|configure\|make\|new)` + `\bworkflow\b`: if `inferWorkflowId(message)` resolves AND `isVagueWorkflowRequest` is false → `spawnAd29WorkflowTurn(id, ...)`; otherwise → `spawnWorkflowClarificationTurn(...)`. Removed `ad29-workflow` from `matchSpecialCapabilityQuery` routes so the intercept owns it entirely. |
| 31 | Specific phrasings like "Set up a low stock reorder workflow", "Set up a VIP upgrade workflow", "Create a stalled deal nudge workflow" fell through to unknown or Task creation | Original regex used `.{0,12}\bworkflow\b` — too short. Long noun phrases between the verb and "workflow" (e.g. "a low stock reorder ") exceeded 12 chars and never matched. Replaced with two independent checks: `hasSetupVerb` (`set up\|setup\|create\|build\|configure\|make\|new`) AND `hasWorkflowWord` (`\bworkflow\b`), unbounded proximity. |
| 32 | "Set up a workflow for dormant customer re-engagement" rendered the **customer-health dashboard** because `matchDashboardQuery` includes `'dormant customer'` and ran before the workflow intercept | Moved the ad-29 workflow intercept ABOVE `matchDashboardQuery` in `handleSend`. Workflow setup intent now always wins over dashboard rendering. |
| 33 | Both `ad29-workflow` and `ad29-test` turns always rendered the dormant data regardless of which workflow was picked | Added `workflowId?: WorkflowId` to `KaiTurn`. Built `buildAd29WorkflowFromCatalog(id, turnId)` and `buildAd29TestFromCatalog(id, turnId)` that synthesize the widget arrays at render time via `parseFrame`. `ConsentTurnRenderer` (workflow setup) and `StandardTurnRenderer` (test data) now substitute the streamed widgets with the catalog output when `turn.workflowId` is set, while letting the simulator's `isStreaming` flag drive end-of-stream timing. |
| 34 | "Test with sample data" chip rendered the dormant fixture regardless of the staged workflow | Added a chip intercept in `handleChipClick` that, when the prior turn is `ad29-workflow` with a `workflowId`, spawns `ad29-test` carrying that ID. |
| 35 | "Create another workflow" chip should re-spawn the picker (not the dormant fixture) | New chip intercept that always spawns `spawnWorkflowClarificationTurn(...)` when triggered from an `ad29-workflow` or `ad29-test` turn. |
| 36 | "Activate Workflow" CTA (AW-012 ConsentBanner) didn't persist anywhere | Added `'workflow'` to `ArtifactType` and `'Scheduled'` to `ArtifactCategory`. New `SavedWorkflow` interface (`workflowId`, `trigger`, `audienceSummary`, `scheduleStatus`). `ConsentTurnRenderer` wraps the existing `onConfirmed` callback — when `turn.useCase === 'ad29-workflow' && turn.workflowId`, also fires `onWorkflowActivated(workflowId)`. ChatShell's `handleWorkflowActivated` builds a `SavedWorkflow` from the catalog and calls `addArtifact`. Toast: `"{Label} activated · saved to My Artifacts"`. The deep-link in the confirmation AW-003 now points to `artifacts`. |
| 37 | Scheduled tab in My Artifacts always rendered the empty state | New `WorkflowCard` component in [`MyArtifactsView.tsx`](src/components/views/MyArtifactsView.tsx) renders activated workflows (status strip with pulse dot, trigger excerpt, audience summary, activated date, hover-to-remove confirm). Scheduled section filters `artifacts.filter((a) => a.category === 'Scheduled')` and renders the cards in a grid. |

---

## ad-17 metric clarification flow + Dashboard Editor sidebar

(These intersect with multiple capability groups — grouped here.)

### Bugs resolved

| # | Bug | Fix |
|---|---|---|
| 38 | Manual-typed "add a metric" / "add another KPI" on an ad17-report turn fell through to unknown → docs-qa | Added a manual-type intercept in `handleSend` mirroring the chip intercept: when `lastKai?.useCase === 'ad17-report'` and the query matches `\b(add\|include\|append)\b` (carve-outs for email/draft/task/dashboard/save/snapshot/etc.), route to `handleAd17MetricsRequest`. Required moving the metric helpers above `handleSend` to dodge a TDZ ReferenceError. |
| 39 | Chip "Add more metrics" (query: `"Add average order value and quote conversion rate to this report"`) got blocked by an over-broad carve-out — the word "order" matched the uc2-order carve list | Tightened the carve-out from `\border\b` to specific order-creation phrasings (`new order\|this order\|an order\|the order\|create order`). |
| 40 | "add sentiment score" returned the generic Unknown reply because the previous regex used a keyword whitelist | Broadened the intercept from a metric-name allowlist to `\b(add\|include\|append)\b` + carve-outs. Unknown metrics now hit the endpoint, which returns `intent: clarify` with the catalog. |
| 41 | Cancelling the ClarificationCard left the ad17-report turn marked stale (and chips hidden) | `handleAd17MetricsRequest` was preemptively staling the prior turn. Now it leaves the prior turn untouched on the clarify path. `handleClarificationCancel` removes the clarification turn AND pops the trailing user message so state returns to exactly what it was before "add a metric" was typed. |
| 42 | PNG download showed only 4 metric cards after "Add more metrics" pushed it to 5 | Two-part fix described in #25 (un-clip overflow + grid layout). The captured PNG now includes every card. |
| 43 | DashboardKaiSidebar threw `Cannot update a component (DashboardBuilderProvider) while rendering DashboardKaiSidebar` when confirming a metric ClarificationCard | `replaceDashboard()` was being called from inside a `setMessages` updater function — a different component's setter inside another's render. Hoisted the call out: compute the resolved metric list + updated dashboard up front, call `replaceDashboard` and `setMessages` serially at the top level. |
| 44 | "Add a metric" via DashboardKaiSidebar → ClarificationCard rendered but Quote Conversion Rate label was treated as a metric search keyword instead of an action | Sidebar's `isMetricRequest` regex + `inferScope(activeDashboard)` map inferred the right `MetricScope` from the dashboard title (`customer health` → `customer-health`, `pipeline` → `pipeline`, etc.). The endpoint then returned scope-specific candidates. |
| 45 | "Change layout to 2x2 grid" sidebar chip reported success but the dashboard grid didn't re-flow | `DashboardCell.position` had required `row`/`col`. Re-laying out the grid changed `layout` but the cells kept their original `position.row/col` from the JSON, so CSS Grid placed them at stale lines. Made `row`/`col` optional in [`types.ts`](src/lib/types.ts); `DashboardCompositeWidget` emits `gridColumn: span N` (auto-place) when coords are absent. Sidebar's layout handler strips `row`/`col` from every cell on layout change so they re-flow into the new column count. Also broadened the keyword set (`2x2 / 2x3 / 3x2 / 3-column / two columns` etc.) and short-circuits when the layout is already correct. |
| 46 | "Export this dashboard as a report" sidebar chip returned a "POC placeholder" reply | Installed `jspdf` (lazy-loaded). New [`src/lib/dashboardExport.ts`](src/lib/dashboardExport.ts) exposes `exportDashboardAsPdf(dashboard, node)` (captures the live stage via html-to-image with the same un-clip treatment, embeds in landscape A4 PDF with title+description header + footer) and `exportDashboardAsCsv(dashboard)` (flattens UW-002 cards / UW-004 tables / UW-011 lists / CH-001 series into CSV sections with proper escaping). Sidebar's `handleSend` intercepts `export\|download\|save as report` queries and picks CSV when the message mentions `csv\|spreadsheet`, otherwise PDF — locating the live stage via `[data-dashboard-stage]`. |
| 47 | Header had no Export CTA in DashboardFullView | New `<ExportMenu>` dropdown component placed to the right of "Save Changes" — `[Export ▾]` button with PDF / CSV options, loading state per format, outside-click close. Captures the same `[data-dashboard-stage]` node. |
| 48 | The pinned input bar in DashboardKaiSidebar got pushed off-screen as messages accumulated | Root cause was `<main className="min-h-screen">` in [`LayoutShell.tsx`](src/components/layout/LayoutShell.tsx) — the flex chain `main → MainContent → DashboardFullView → DashboardKaiSidebar` had no upper height bound. Changed to `h-screen` so the chain has a definite `100vh`. Also restructured the sidebar so the scroll region is `flex: 1, min-height: 0` and the input row is a separate `flex-shrink: 0` block with its own border-top — input now stays anchored to the bottom of the viewport. |

---

## Patterns established

These reusable techniques came out of the debugging:

1. **Capability variants via `effectiveUseCase` + `userQuery` regex** — single fixture map, branch by query content for context-aware variants (uc2-acme/invoice/brief, email-handoff/customer-notify, email-report-summary, casual variants).
2. **Carry-forward context via hidden markers on `userQuery`** — append `__marker__` tokens in `spawnTurn` based on prior turn state; strip from display, read in routing. Avoids new turn-level fields.
3. **Dynamic compare/restage widgets** — snapshot `liveFields` onto the turn, patch widget data at render time (`patchCompareWidget`).
4. **Defensive auto-recompute against baseline** — only recompute derived fields when edits actually diverge from `baseFormFields` (prevents render loops from `MultiStepFormWizard` re-pushing the full values map).
5. **HTTP error status separation from streaming body** — open the upstream call before the `ReadableStream`, return real status codes, never inline `[Error: …]` text.
6. **Delegation guard in `matchSpecialCapabilityQuery`** — prevents overlapping route matching for chip-spawned queries (email/task/dashboard).
7. **Template var hygiene** — `extractTemplateVars` needs explicit branches per `entityType`; UW-011 `assignedTo` should never override an authoritative source.
8. **Server-side allowlists for LLM-touched generative paths** — `src/lib/metricCatalog.ts` and `src/lib/workflowCatalog.ts` centralize the universe of acceptable outputs. Endpoints sanitize LLM responses against the allowlist (drop invented entries), keeping demo and AI modes consistent and preventing hallucinated content from breaking widget rendering.
9. **Apply vs Clarify intents on ambiguous prompts** — endpoints return `{ intent: 'apply', add, remove }` or `{ intent: 'clarify', candidates, prompt }`. Vague phrasings (`add a metric`, `set up a workflow`) trigger an AW-006 ClarificationCard turn instead of guessing. Specific phrasings (`add gross margin`, `set up a VIP upgrade workflow`) apply directly.
10. **Dynamic widget synthesis via `parseFrame`** — instead of duplicating JSON fixtures per variant, build a `Frame` object in TypeScript from a catalog entry and run it through `parseFrame(frame, 0)`. Used for ad29-workflow/test (workflow catalog) and the clarification turn renderers. Keeps one source of truth.
11. **Out-of-band side effects via DOM-tagged anchors** — `data-ad17-snapshot`, `data-dashboard-stage`, `data-snapshot-ignore` let components that don't share a parent (e.g. EmailAttachmentChip below an email turn) find and operate on the ad17 report frame still mounted upstream. Survives staling and turn reordering.
12. **Picking turn-renderer behaviour without forking the renderer** — `ConsentTurnRenderer` and `StandardTurnRenderer` both inspect a per-turn discriminator (`turn.workflowId`, `turn.ad17AddedMetrics`) and substitute their inputs (widget list, closing text). The simulator still runs for `isStreaming` timing, but its widgets get discarded when the catalog path is active.
13. **TDZ-safe callback order inside large components** — when one `useCallback` references another, the referenced callback must be declared above the caller (no const-hoisting). When a `handleSend` body intercepts and calls `handleAd17MetricsRequest`, move the helpers above `handleSend`.
14. **Cancel = remove turn + paired user message (don't just stale)** — keeping a cancelled clarification visible breaks chip rendering (`isLastTurn && !turn.isStale`). Removing the turn AND popping the last `Message` restores `userMessages ↔ kaiTurns` index pairing and lets the prior turn become "last" again.

---

## Still pending

From the 8 capability groups, still to test:

- **sr-14:** "Draft pre-meeting email"
- **sr-20:** "Make it more casual" · "Make it shorter" · "Add a discount offer"
- **ad-1:** "Approve all standard" · "Show details on flagged"

Resolved this session (originally still-pending):

- ✅ **ad-3:** all handoff variants resolved (no remaining chips)
- ✅ **ad-17:** Save as dashboard · Add more metrics (chip + manual-typed + ClarificationCard) · Email this report · PNG download · email attachment chip
- ✅ **ad-29:** Test with sample data (workflow-specific) · Create another workflow (re-spawns picker) · plus new vague→clarify routing for "Set up a workflow", workflow catalog with 7 entries, single-select ClarificationCard mode, Activate Workflow → Scheduled artifacts persistence

Also resolved this session (not originally in the §7.A scope):

- ✅ Dashboard Editor sidebar — input always pinned to viewport bottom; layout chain bug in `LayoutShell` (`min-h-screen` → `h-screen`); React state-during-render warning in `handleClarifyConfirm`
- ✅ Dashboard layout chip (`grid-2x2 / grid-3x2 / grid-2x3`) actually re-flows the grid by auto-placing cells (DashboardCell `row`/`col` made optional)
- ✅ Dashboard export — `[Export ▾]` CTA in the FullView header with PDF + CSV options; sidebar chip wired to the same exports
- ✅ Global UW-002 layout — switched flex+overflow to CSS grid (up to 4 cards even split; 5+ wrap to fixed 4-column grid). Defense-in-depth un-clip helper retained in PNG capture path for any other widget that might scroll.

Type check status: `npx tsc --noEmit` → 0 errors after each fix above.
