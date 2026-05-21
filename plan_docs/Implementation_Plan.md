# Kai v1 Planner — Execution Plan

## Context

Today's Kai pipeline is **keyword → frozen fixture**: every wired capability fuses intent, data slice, and presentation into a single JSON blob. When a client asks an *adjacent* question — "overdue tasks but for Marcus", "Magnolia revenue last 3 months by month" — the system either force-fits to the nearest fixture or terminates to `unknown`.

This plan implements **v1 of the open-ended planner** per [Decision.md](Decision.md). Scope is **adjacent, read-only queries** over the Audrey data model. Scripted demo flows remain rock-solid (keyword fast-paths win); improvised queries get a planned response composed at runtime.

The planner LLM (Opus 4.6) produces a small **Plan IR**, we compile it into Frame JSON, and the existing FrameParser pipeline renders it. **No new rendering engine.** A confidence-gated routing retrofit ensures the planner only fires when fast-paths defer.

### Phase 0 decisions (confirmed)

| # | Question | Answer |
|---|---|---|
| 1 | Ground-truth set | Proceed without; tune live |
| 2 | Audrey data gaps | Backfill data, don't thin tool args |
| 3 | Planner LLM provider | Same provider (Anthropic Messages API direct) — mirror `/api/kai/generate` |
| 4 | `KAI_PLANNER_DISABLED` default | ON (planner disabled) until eval passes, then flip OFF |
| 5 | Code home | `src/lib/planner/` — confirmed |
| 6 | `/api/kai/generate` | Leave completely untouched |

---

## Phase 1 — Foundation (no UI)

### Step 1: Backfill Audrey data (minimal, additive only)

Add only fields the 6 tools need that don't exist today. Per Audrey audit:

| File | Field to add | Type | Notes |
|---|---|---|---|
| `src/data/audreys/synthetic/orders.ts` | `shippedAt?` | `string \| null` | for status='Shipped'/'Delivered' |
| `src/data/audreys/synthetic/tasks.ts` | `completedAt?` | `string \| null` | enables Completed status |
| `src/data/audreys/synthetic/tasks.ts` | extend `status` union | `\| 'Completed'` | currently only `'Overdue' \| 'Open'` |
| `src/data/audreys/synthetic/tasks.ts` | `createdAt?` | `string` | "tasks created last week" |
| `src/data/audreys/synthetic/customers.ts` | `createdAt?` | `string` | "new customers this quarter" |
| `src/data/audreys/synthetic/deals.ts` | `createdAt?` | `string` | "deals created this month" |

**Surgical change rule:** existing fields untouched. New fields optional so nothing currently consuming the arrays breaks.

**Verify:** `npx tsc --noEmit` clean; grep all consumers of `AUDREY_TASKS.status` and confirm none switch-exhaust on `'Overdue' | 'Open'` (if any do, narrow the new `'Completed'` to a separate filter rather than the union — surface for decision).

### Step 2: Data tool layer — `src/lib/planner/tools/`

Six files, one per entity. Each exports `{ schema: ZodSchema, execute: (args) => Result, definitionForPrompt: string }`.

| File | Source array | groupBy options | aggregate options |
|---|---|---|---|
| `queryCustomers.ts` | `AUDREY_CUSTOMERS` | `'status' \| 'region' \| 'rep'` | `count`, `sum(lifetimeRevenue \| ordersYTD \| currentBalance)` |
| `queryLeads.ts` | `AUDREY_LEADS` | `'status' \| 'source' \| 'rep' \| 'region'` | `count` |
| `queryOrders.ts` | `AUDREY_ORDERS` | `'status' \| 'rep' \| 'customer' \| 'bucket' \| 'month'` | `count`, `sum(total \| items)` |
| `queryProducts.ts` | `PRODUCTS` | `'bucket' \| 'collection' \| 'stockStatus'` | `count`, `sum(availableQty)` |
| `queryTasks.ts` | `AUDREY_TASKS` | `'status' \| 'priority' \| 'type' \| 'rep'` | `count` |
| `queryReps.ts` | `AUDREY_REPS` | `'territory'` | `count`, `sum(ytdRevenue \| pipelineValue)` |

**Cross-cutting tool contract:**
- Filter args are rich (per-entity zod schemas — e.g. `queryOrders` accepts `customerId`, `repId`, `bucket`, `status`, `dateFrom`, `dateTo`, `skuContains`).
- Auto-hydrate foreign keys: `Order` returns hydrated `.customer` (from `bySku`-equivalent lookup on customer arrays), `.rep` from `byId` on reps.
- 50-row cap with `{ truncated: true, total: N }` on overflow.
- Result discriminated union: `{ kind: 'rows', rows: T[] } | { kind: 'groups', groups: { key, count, agg? }[] }`.
- `index.ts` exports `TOOL_REGISTRY: Record<string, ToolDef>` consumed by both the system-prompt assembler and the IR compiler.

**Verify:** Write `src/lib/planner/tools/__smoke.ts` (gitignored throwaway) — call `queryOrders({ repId: 'R-002', groupBy: 'month' })` and `queryTasks({ status: 'Overdue', repId: 'R-001' })`, print results, delete after passing. `npx tsc --noEmit` clean.

### Step 3: Widget catalog — `src/lib/planner/widget_catalog.ts`

One entry per registered widget. Skip UW-001 + AW-005 (sub-components only).

```ts
export const WIDGET_CATALOG: Record<string, {
  widgetType: string;
  dataShape: ZodSchema;
  goodFor: string;
  example: object;  // pulled from a real fixture
}> = { ... }
```

`dataShape` zod schemas mirror the TypeScript interfaces at known locations in `src/lib/types.ts`:

| Widget | Interface | types.ts line |
|---|---|---|
| UW-002 MetricCardRow | `MetricCardRowData` | 297 |
| UW-003 EntityDetailCard | `EntityDetailCardData` | 235 |
| UW-004 DataTable | `DataTableData` | 345 |
| UW-007 Customer360Card | `Customer360Data` | 117 |
| UW-009 ProductCardGrid | `ProductCardGridData` | 224 |
| UW-011 CompactList | `CompactListData` | 208 |
| UW-014 AgentReasoningCard | `AgentReasoningCardData` | 104 |
| UW-030 DashboardCompositeWidget | `DashboardCompositeData` | 525 |
| CH-001 LineChart | `LineChartData` | 175 |
| AW-001/003/004/006/012 | per file | 260–319 |

**Verify:** For each catalog entry, parse a real fixture's `data` block against the entry's zod schema. Any failure → either the schema or my reading is wrong; fix the schema (not the fixture).

### Step 4: IR types + zod — `src/lib/planner/types.ts` + `schema.ts`

Mirror Decision §5 exactly. Strict zod. Note: `widgetType` enum must match `WIDGET_CATALOG` keys; `tool` enum must match `TOOL_REGISTRY` keys.

**Verify:** Hand-write 2 sample IRs (one with empty-result path + `emptyResultInsight: true`, one with `closingTextHint: null`). Both must validate.

---

## Phase 2 — Compiler + Route

### Step 5: IR compiler — `src/lib/planner/compile.ts`

```ts
export async function compile(plan: Plan): Promise<
  | { ok: true; frame: Frame; toolResults: Record<string, ToolResult> }
  | { ok: false; reason: string }
>
```

- Runs `plan.steps` in order via `TOOL_REGISTRY`; collects results keyed by `bindTo`.
- For each widget: resolves `dataFrom`, applies optional `transform` (`pick` / `rename`), validates resulting `data` against `WIDGET_CATALOG[widgetType].dataShape`.
- **Whole-plan fail** on any widget shape mismatch (per Decision §19).
- Emits `Frame` with `frameType: 'result'` (or `'error'` on failure), `widgets[]`, optional `closingText` populated by the closing-text pass.

**Verify:** Feed the two sample IRs from Step 4 → compiles to Frame JSON whose shape matches existing fixtures byte-for-byte structurally.

### Step 6: Planner route — `src/app/api/kai/plan/route.ts`

Mirror `src/app/api/kai/generate/route.ts:86-92` pattern exactly. Differences:
- `model: 'claude-opus-4-6'` (planner) — closing-text pass uses Sonnet 4.6 via a separate internal call.
- System prompt = new `buildSystemPrompt('plan', args)` dispatch added to `src/lib/systemPrompts.ts:484` (T11 function).
- T11 assembles: persona → custom instructions → page context → `audreyContextBlock()` (existing helper, line 102) → **tool catalog signatures** (from `TOOL_REGISTRY`, no data) → **widget catalog signatures** (from `WIDGET_CATALOG`) → IR schema → 2-3 hand-crafted few-shot exemplars.
- Output: stream Opus response, parse to IR, zod-validate. **Silent single retry** on validation failure with error appended to messages. On second failure → return `{ ok: false, reason }`.
- If IR valid → `compile(plan)` → hydrate widgets → run **Sonnet 4.6 closing-text pass** seeded by `closingTextHint` + `emptyResultInsight` flag (skip entirely if `closingTextHint === null`) → return final Frame.

**Verify:** Curl 3 hand-picked adjacent prompts:
1. "Show overdue tasks for Marcus"
2. "Magnolia revenue last 3 months by month"
3. "Leads in Discovery stage"

Each returns valid IR → compiles → renders Frame. Inspect via `curl | jq`.

---

## Phase 3 — Routing integration

### Step 7: Confidence-gated routing — `src/lib/queryMatcher.ts` + `ChatShell.handleSend`

**Changes to `queryMatcher.ts`:**
- `matchQuery` signature changes from `(message) => UseCase` → `(message) => { useCase: UseCase; confidence: 'high' | 'medium' | 'low' }`.
- Downgrade signals (Decision §25): time qualifiers (`last month`, `this quarter`, `vs`, `since`, `between`), group/sort qualifiers (`by rep`, `grouped`, `top N`), multi-entity (>1 named customer), non-canonical entities.
- LLM classifier (today inside ChatShell, not in queryMatcher) similarly returns `{ capability, confidence: 'high' | 'medium' | 'low' }`.

**Changes to `ChatShell.handleSend` (file: `src/components/chat/ChatShell.tsx`):**
- **SKU-lookup guard at L2985-3018:** on miss, instead of routing to `'unknown'`, post to `/api/kai/plan` with hint `{ kind: 'unknown_sku', extracted }`.
- **General `matchQuery` at L3020+:** if `confidence === 'high'`, route to wired uc1/2/3 as today; otherwise hand off to planner.
- **LLM classifier (existing call):** `high` → wired cap, `medium`/`low` → planner.
- **Planner stage** is terminal before `'unknown'`. On planner `{ ok: false }`, render fallback card (Step 10).
- **New turn kind `'planning'`** added to `KaiTurn` union (currently around L167-213). Mirrors `'page-context'` rendering: widgets[] + closingText.

**Kill switch:** `process.env.KAI_PLANNER_DISABLED === '1'` short-circuits the planner stage to fallback card. Default `'1'` (disabled) until Step 13 eval passes.

**Verify (highest-risk step):** Run every prompt in `Kai Demo Script.md` with `KAI_PLANNER_DISABLED=0`. Every scripted prompt must still hit its wired fast-path, NOT the planner. Log routing decision per query; manual review.

---

## Phase 4 — UX polish

### Step 8: UW-014 live streaming + collapse

**File:** `src/components/widgets/ui/AgentReasoningCard.tsx`

Current: static `nodes[]` DAG with staggered enter animations.

Extend:
- Accept optional `isLive: boolean` + `liveNodeStream: EventEmitter` (or a controlled-prop `nodes` array that grows during plan execution).
- On plan completion: collapse to compact "Thought for Ns" summary (animate from full DAG to a single pill).
- Existing static behavior unchanged when `isLive !== true` — protects all existing fixtures using UW-014.

**Verify:** In-browser — fire a planner query, watch reasoning card append nodes live, collapse to summary on completion.

### Step 9: Closing-text sequencing

ChatShell rendering of `'planning'` turn must:
1. Render widgets as they hydrate.
2. Wait for ALL widgets hydrated.
3. THEN stream closing text via existing CanvasTextBlock path.

Reuse the existing `onStreamEnd(closingText?.text)` callback at ChatShell L511.

### Step 10: Fallback card

New component `src/components/widgets/actions/PlannerFallbackCard.tsx` (or reuse AW-006 ClarificationCard with a fallback variant).

Content: honest copy ("I can't answer that with confidence yet — want to try one of these?") + 2-3 chips selected by simple entity match against `src/fixtures/action-chips-map.json`. Selection logic: parse query for customer/lead/rep mentions, pick chips referencing those entities; if none, pick top 3 from `capabilityChips.email` or similar safe defaults.

**Verify:** Force-fail a plan (return invalid IR from a test fixture) → fallback renders with sensible chips.

### Step 11: Generic chips on planner responses

Append two static chips below every planner response: `"Save to artifacts"` + `"Show me more"`. Hook into existing `ActionChip` infra. Avoids dead-end feel without overbuilding (Decision §33).

---

## Phase 5 — Safety + Eval

### Step 12: Logging + kill switch

- `process.env.KAI_PLANNER_DISABLED === '1'` honored at routing layer (Step 7).
- Structured `console.log` in `/api/kai/plan/route.ts`: `{ query, ir, toolResults, frame, latencyMs }`.
- Browser-side: `window.lastPlannerRun = { query, ir, toolResults, frame }` after each call for in-DevTools inspection.

### Step 13: Live evaluation

Once Avi delivers the ground-truth set (or via demo-day live use):
- Each prompt → log IR + Frame + closing text.
- Tune: classifier `high`/`medium` cutoff; `matchQuery` downgrade signals; tool filter expressiveness gaps.
- **Target:** ≥80% of adjacent prompts produce a sensible widget response; remaining 20% land on fallback (not a wrong wired cap).

### Step 14: Final regression

- Full `Kai Demo Script.md` run with `KAI_PLANNER_DISABLED=1` (fast-path still works).
- Full demo script run with `KAI_PLANNER_DISABLED=0` (planner reachable, doesn't steal canonical queries).
- `npx tsc --noEmit` clean.
- `grep -rin "acme\|c-4201\|rachel martinez" src` returns nothing.
- Flip `KAI_PLANNER_DISABLED` default to `'0'` (planner ON) only after both runs are clean.

---

## Critical files (modified or created)

### Created
- `src/lib/planner/tools/queryCustomers.ts`
- `src/lib/planner/tools/queryLeads.ts`
- `src/lib/planner/tools/queryOrders.ts`
- `src/lib/planner/tools/queryProducts.ts`
- `src/lib/planner/tools/queryTasks.ts`
- `src/lib/planner/tools/queryReps.ts`
- `src/lib/planner/tools/index.ts` (TOOL_REGISTRY)
- `src/lib/planner/widget_catalog.ts`
- `src/lib/planner/types.ts`
- `src/lib/planner/schema.ts`
- `src/lib/planner/compile.ts`
- `src/app/api/kai/plan/route.ts`
- `src/components/widgets/actions/PlannerFallbackCard.tsx`

### Modified (surgical)
- `src/data/audreys/synthetic/orders.ts` — add `shippedAt?`
- `src/data/audreys/synthetic/tasks.ts` — add `completedAt?`, `createdAt?`, extend status union
- `src/data/audreys/synthetic/customers.ts` — add `createdAt?`
- `src/data/audreys/synthetic/deals.ts` — add `createdAt?`
- `src/lib/systemPrompts.ts` — add T11 `buildSystemPrompt('plan', args)` dispatch
- `src/lib/queryMatcher.ts` — `matchQuery` returns confidence
- `src/components/chat/ChatShell.tsx` — confidence gates + planner stage + `'planning'` turn kind
- `src/components/widgets/ui/AgentReasoningCard.tsx` — live append + collapse-to-summary (additive, gated by `isLive`)

### Untouched (per Phase 0 decision)
- `src/app/api/kai/generate/route.ts`
- All existing fixture JSON files
- All other widgets and components

---

## Reused existing utilities

- `audreyContextBlock()` at `src/lib/systemPrompts.ts:102` — reuse in T11 system prompt.
- `assemble()` helper in `src/lib/systemPrompts.ts` — reuse for T11.
- `buildSystemPrompt` dispatcher at `src/lib/systemPrompts.ts:484` — extend with `'plan'` case.
- Anthropic Messages API streaming pattern at `src/app/api/kai/generate/route.ts:86-129` — mirror for `/api/kai/plan`.
- `bySku()`, `byId` accessors in `src/data/audreys/accessors.ts` — use for auto-hydration of FKs in query tools.
- `FrameParser` + `ComponentRegistry` + `CanvasTextBlock` rendering pipeline — unchanged consumer of planner-emitted Frames.
- `ActionChip` component + `action-chips-map.json` — reused for fallback card chip selection.
- `KaiTurn` union in ChatShell.tsx L167-213 — extended with `'planning'` kind (mirrors existing `'page-context'`, `'order-status-clarification'` patterns).

---

## Verification end-to-end

```bash
# 1. Typecheck clean
npx tsc --noEmit

# 2. Throwaway smoke test against tools
npx tsx src/lib/planner/tools/__smoke.ts   # delete after passing

# 3. Curl planner route directly
curl -X POST http://localhost:3000/api/kai/plan \
  -H 'Content-Type: application/json' \
  -d '{"messages":[{"role":"user","content":"Show overdue tasks for Marcus"}]}' \
  | jq

# 4. Full demo script regression (manual)
# - Run app: pnpm dev
# - With KAI_PLANNER_DISABLED=1: type every prompt from Kai Demo Script.md;
#   confirm each hits its expected fast-path
# - With KAI_PLANNER_DISABLED=0: re-run; confirm no canonical prompt steals
#   into the planner

# 5. Adjacent-query live test
# - Try: "overdue tasks for Marcus", "Magnolia revenue last 3 months by month",
#   "leads in Discovery stage", "compare Beth and Marcus pipeline",
#   "customers with no orders in 90 days"
# - For each: open DevTools, inspect window.lastPlannerRun, verify IR + Frame look sensible

# 6. No Acme regression
grep -rin "acme\|c-4201\|rachel martinez" src   # → no matches

# 7. Final demo readiness
ls src/fixtures/cap*.json src/fixtures/report-*.json src/fixtures/special-*.json | wc -l
# → 34+ (unchanged; planner does not add fixtures)
```

---

## Risk register

| Risk | Mitigation |
|---|---|
| Planner steals a scripted-demo query on demo day | Kill switch defaults ON until eval passes; Step 7 verify runs full demo script |
| Tool filter gaps surface mid-demo | Step 13 live tuning; tool args are rich by design (Decision §11) |
| Sonnet closing text contradicts widget data | Closing pass is post-hydration + hint-seeded; tighten seed prompt if it drifts |
| Opus IR validation flakiness | Silent single retry per Decision §18; persistent failure → fallback card |
| Widget catalog drift from real fixture shapes | Step 3 verify enforces catalog ↔ real-fixture parity at build time |
| `'Completed'` status added to tasks breaks an exhaustive switch | Step 1 verify greps for exhaustive consumers; narrow scope if any found |
