# Plan: Dashboard Builder (v2.1, Block 5)

## Context

V2.1 needs a dashboard-building capability: Kai composes existing widgets into a CSS Grid, the user reviews it in chat, saves it to "Dashboards and Reports", and can later reopen it in a full-screen view with a Kai chat sidebar for live edits. Types ([`DashboardCompositeData`, `DashboardCell`, `SavedDashboard`](src/lib/types.ts#L867)), the four fixtures ([`dashboard-sales-performance.json`](src/fixtures/dashboard-sales-performance.json), customer-health, pipeline, order-analytics), and the artifact category widening (`'Dashboards and Reports'`) are already in place. Highlight UI (Block 1–3) is also done. This block builds the runtime: one new widget, one new context, one new top-level view, one new sidebar, three small modifications to existing flows.

The reference build sequence is Part 6 / Block 5 of [`Kai_2_0_POC_Plan_v2_1_final.md`](plan_docs/Kai_2_0_POC_Plan_v2_1_final.md#L872) and the routing contract is in Part 12 ([line 1696](plan_docs/Kai_2_0_POC_Plan_v2_1_final.md#L1696)).

---

## Component Hierarchy

```
RootLayout (src/app/layout.tsx)
└─ ...existing providers...
   └─ ArtifactProvider
      └─ DashboardBuilderProvider          ← NEW (sits between Artifact and AgentStore)
         └─ AgentStoreProvider
            └─ ToastProvider
               └─ LayoutShell
                  └─ MainContent (router on currentView)
                     ├─ 'chat'      → ChatShell
                     │                 └─ KaiResponse → CompositionEngine
                     │                                     └─ DashboardCompositeWidget (UW-030)   ← NEW
                     │                                            └─ <grid>
                     │                                                ├─ MetricCardRow / LineChart /
                     │                                                ├─ DataTable / CompactList / ...
                     │                                                └─ (any registered widget)
                     ├─ 'artifacts' → MyArtifactsView                   ← MODIFIED (new section)
                     └─ 'dashboard-view' → DashboardFullView            ← NEW route
                                              ├─ DashboardHeader (title + Save / Back)
                                              ├─ DashboardCompositeWidget (full-bleed mode)
                                              └─ DashboardKaiSidebar                              ← NEW
                                                  └─ stripped ChatShell (input + messages only)
```

Sub-widgets in the grid go through the existing `ComponentRegistry` — no new chart components.

---

## 1. DashboardCompositeWidget (UW-030)

**File:** `src/components/widgets/ui/DashboardCompositeWidget.tsx`
**Contract:** standard `WidgetProps<DashboardCompositeData>`. No new prop shape.

**Render:**
- Header: `data.title` (Satoshi 700, 16px) + `data.description` (12px, `var(--text2)`).
- Grid container: CSS `display: grid` keyed off `data.layout`:
  - `grid-2x2` → `grid-template-columns: repeat(2, 1fr); grid-auto-rows: minmax(220px, auto);`
  - `grid-2x3` → `repeat(2, 1fr)` × 3 rows
  - `grid-3x2` → `repeat(3, 1fr)` × 2 rows
- Each cell: `gridRow: row + 1`, `gridColumn: \`span ${colSpan ?? 1}\``.
- Each cell wrapped in a card chrome: `var(--surface)`, `1px solid var(--border)`, `border-radius: 12px`, internal padding 12px.
- Sub-widget resolution: call existing [`resolveWidget(cell.widgetType)`](src/components/engine/ComponentRegistry.ts#L80); pass `{ data: cell.data, config: cell.config, highlights: cell.highlights }`. If resolution fails → small "Unsupported widget" placeholder (mirror current registry fallback).
- Two display modes via `config?.mode`:
  - `'chat'` (default) — max-height ~480px, internal `overflow: auto`. Used inside chat.
  - `'full'` — no height cap, grid expands to container width. Used by `DashboardFullView`.

**Register:** add `'UW-030': DashboardCompositeWidget` to [`ComponentRegistry.ts`](src/components/engine/ComponentRegistry.ts#L24).

---

## 2. Dashboard Creation Flow in ChatShell

No new component — extend the existing pipeline.

**Step A — queryMatcher** ([`src/lib/queryMatcher.ts`](src/lib/queryMatcher.ts)):
- Add a `matchDashboardQuery(message)` helper that keyword-maps:
  - "sales performance" / "sales dashboard" / "build a dashboard" → `dashboard-sales-performance.json`
  - "customer health" → `dashboard-customer-health.json`
  - "pipeline dashboard" → `dashboard-pipeline.json`
  - "order analytics" / "order dashboard" → `dashboard-order-analytics.json`
- Returns `{ widgets: ParsedWidget[], closingText, capability: 'dashboard-builder' }` parsed via the existing `parseFrame`. Same shape `matchPageContextQuery` already returns, so ChatShell's render path is reused unchanged.
- Wire it into `ChatShell.handleSend` *before* `matchPageContextQuery`/`matchQuery`, since the keywords are global, not page-scoped.

**Step B — render in chat:** falls through the existing FrameParser → CompositionEngine → resolveWidget pipeline. The fixture's three widgets render in order:
1. `UW-014` (collapsed reasoning)
2. `UW-030` (the dashboard, in `mode: 'chat'`)
3. `AW-012` (ConsentBanner with `["Save Dashboard", "Edit", "Cancel"]`)

**Step C — consent handling** (extend [`useConsentFlow`](src/hooks/useConsentFlow.ts) or branch in ChatShell's confirm handler):
- `Save Dashboard` → open `SaveArtifactModal` pre-filled from the UW-030 widget's `data.title` / `data.description`. On save, build a `SavedDashboard`:
  ```ts
  {
    id, savedAt: Date.now(),
    type: 'chart',                 // closest existing ArtifactType
    category: 'Dashboards and Reports',
    title, description,
    sourceWidget: { widgetType: 'UW-030', data: dashboardData },
    dashboardData,                 // also stored at top-level for typed access
  }
  ```
  Push via `addArtifact` ([`ArtifactContext.tsx`](src/contexts/ArtifactContext.tsx#L34)).
- `Edit` → mark current turn stale (existing pattern), Kai asks "What would you like to change?", action chips offer canned edits ("Replace line chart with bar chart", "Add quote conversion metric", etc.). For the POC, edit responses load a *variant* fixture or apply a small in-state `cells[]` patch — no LLM round-trip.
- `Cancel` → existing cancel flow (toast + stale).

---

## 3. DashboardBuilderContext

**File:** `src/contexts/DashboardBuilderContext.tsx`

```ts
interface DashboardBuilderState {
  activeDashboard: DashboardCompositeData | null;
  activeArtifactId: string | null;        // for "Save Changes" → updateArtifact
  setActive: (d: DashboardCompositeData, artifactId: string) => void;
  clearActive: () => void;
  patchCells: (mutator: (cells: DashboardCell[]) => DashboardCell[]) => void;
  replaceDashboard: (d: DashboardCompositeData) => void;
}
```

- No persistence — session-only, like cart and shared state.
- Mounted in [`src/app/layout.tsx`](src/app/layout.tsx) **between `ArtifactProvider` and `AgentStoreProvider`** so both `DashboardFullView` and the Kai sidebar can read/write it, and `addArtifact`/`updateArtifact` are still reachable.
- Hook `useDashboardBuilder()` throws if used outside provider (mirror [`useArtifacts`](src/contexts/ArtifactContext.tsx#L49)).

`patchCells` exists for the sidebar to apply small local edits (e.g., swap one cell's `widgetType`/`config`); `replaceDashboard` for whole-template swaps.

---

## 4. DashboardFullView

**File:** `src/components/views/DashboardFullView.tsx`

**Contract:** zero props. Reads `useDashboardBuilder().activeDashboard`. If `null`, calls `setView('artifacts')` in an effect (edge-case safety) and renders nothing.

**Layout:**
```
DashboardFullView (flex row, fills MainContent)
├── Left column (flex: 1, overflow: auto, padding 24px)
│   ├── DashboardHeader — title, description, "Save Changes", "Back"
│   └── DashboardCompositeWidget data={activeDashboard} config={{ mode: 'full' }}
└── DashboardKaiSidebar (width: 360px, fixed right; flex: 0 0 360px)
```

**Header actions:**
- `Back` → `clearActive()` + `setView('artifacts')`.
- `Save Changes` → `updateArtifact(activeArtifactId, { dashboardData: activeDashboard, sourceWidget: { ..., data: activeDashboard } })`. Adds `updateArtifact(id, patch)` to ArtifactContext (small additive change).

---

## 5. DashboardKaiSidebar

**File:** `src/components/views/DashboardKaiSidebar.tsx`

**Goal:** a stripped-down ChatShell scoped to dashboard editing — input bar + message list only, no left sidebar, no view switcher, no proactive brief.

**Approach:** extract a lean inner component from ChatShell's body (`ChatTranscript` + input bar) if not already a separate file; otherwise wrap a *new* lightweight conversation panel that reuses the same hooks (`useConversation` if present, plus `useStreamSimulator`). Either way, the sidebar uses its **own** local conversation state — does not pollute the main chat history.

**Behavior:**
- On mount, seeds the conversation with a system-style assistant message: `"Editing **{title}**. Tell me what to change — replace a widget, add a metric, swap chart type, change the date range, etc."`
- Starter prompts (4 chips) loaded from `action-chips-map.json["dashboard-edit"]` (or hard-coded for the POC if that fixture isn't yet authored): "Replace the line chart with a bar chart", "Add a metric for quote conversion", "Remove the products table", "Change date range to last 30 days".
- User submits → small fixture-driven matcher (`matchDashboardEdit(message, activeDashboard)`) returns either a `patchCells` mutator or a full `replaceDashboard` payload, then renders a brief assistant acknowledgement. The grid in `DashboardFullView` re-renders automatically via context reactivity.
- Save is in the header, not the sidebar, to avoid confusion.

For the POC the matcher can recognize ~5 phrases; this is plenty for the demo and avoids LLM latency in the hot path.

---

## 6. My Artifacts — "Dashboards and Reports" Section

**File:** [`src/components/views/MyArtifactsView.tsx`](src/components/views/MyArtifactsView.tsx)

- Add a new derived list at the top of the render: `dashboards = artifacts.filter(a => a.category === 'Dashboards and Reports')`.
- Insert a section above "Charts and Reports":
  ```
  Dashboards and Reports  (count)
  ───────────────────────────────
  [card] [card] [card] ...
  ```
- Card: title, description, savedAt, small grid-icon thumbnail (CSS-only 2×3 placeholder; `html2canvas` is out of scope per existing comment in `SavedArtifact.thumbnail`).
- **Click handler:**
  ```ts
  const handleDashboardClick = (a: SavedDashboard) => {
    setActive(a.dashboardData, a.id);    // DashboardBuilderContext
    setView('dashboard-view');           // LayoutContext
  };
  ```
- Existing "Charts and Reports" filter stays unchanged — those are saved single widgets, not dashboards.

---

## 7. Routing

**Type change** ([`src/lib/types.ts` `ViewRoute`](src/lib/types.ts#L300)):
- Add `'dashboard-view'` to the union. Additive, non-breaking.

**Router change** (`src/components/layout/MainContent.tsx`):
- Add case:
  ```ts
  case 'dashboard-view':
    return <DashboardFullView />;
  ```
- Add to `VIEW_TITLES` in `LayoutShell.tsx`: `'dashboard-view': activeDashboard?.title ?? 'Dashboard'` (read from `useDashboardBuilder` so the header reflects the active board).

**Flow:**
```
MyArtifactsView click
  → setActive(dashboardData, artifactId) on DashboardBuilderContext
  → setView('dashboard-view') on LayoutContext
  → MainContent renders DashboardFullView
  → DashboardFullView reads activeDashboard, renders <DashboardCompositeWidget mode='full'/>
  → DashboardKaiSidebar mounts beside it, fresh conversation
  → User edits via sidebar → patchCells/replaceDashboard → activeDashboard mutates → grid re-renders
  → "Save Changes" → updateArtifact(activeArtifactId, …) → "Back" → clearActive() + setView('artifacts')
```

---

## State Flow Summary

| Producer | Reads | Writes |
|---|---|---|
| ChatShell + queryMatcher | (user input) | renders `UW-030` via existing engine |
| ConsentBanner "Save Dashboard" | dashboard widget data in current turn | `ArtifactContext.addArtifact` |
| MyArtifactsView click | `ArtifactContext.artifacts` | `DashboardBuilderContext.setActive`, `LayoutContext.setView` |
| DashboardFullView | `DashboardBuilderContext.activeDashboard` | (renders only) |
| DashboardKaiSidebar | `activeDashboard` | `patchCells` / `replaceDashboard` |
| Header "Save Changes" | `activeDashboard`, `activeArtifactId` | `ArtifactContext.updateArtifact` |
| Header "Back" | — | `clearActive`, `setView('artifacts')` |

---

## Critical Files

### New
- `src/components/widgets/ui/DashboardCompositeWidget.tsx`
- `src/contexts/DashboardBuilderContext.tsx`
- `src/components/views/DashboardFullView.tsx`
- `src/components/views/DashboardKaiSidebar.tsx`

### Modified
- [`src/lib/types.ts`](src/lib/types.ts#L300) — add `'dashboard-view'` to `ViewRoute`.
- [`src/components/engine/ComponentRegistry.ts`](src/components/engine/ComponentRegistry.ts#L24) — register UW-030.
- [`src/lib/queryMatcher.ts`](src/lib/queryMatcher.ts) — add `matchDashboardQuery`.
- [`src/components/chat/ChatShell.tsx`](src/components/chat/ChatShell.tsx) — call `matchDashboardQuery` before page/general matchers; wire "Save Dashboard" consent path to `SaveArtifactModal` with `category: 'Dashboards and Reports'`.
- [`src/contexts/ArtifactContext.tsx`](src/contexts/ArtifactContext.tsx) — add `updateArtifact(id, patch)`.
- [`src/components/views/MyArtifactsView.tsx`](src/components/views/MyArtifactsView.tsx) — new "Dashboards and Reports" section + click handler.
- [`src/components/layout/MainContent.tsx`](src/components/layout/MainContent.tsx) — new route case.
- [`src/components/layout/LayoutShell.tsx`](src/components/layout/LayoutShell.tsx) — title for `'dashboard-view'`.
- [`src/app/layout.tsx`](src/app/layout.tsx) — wrap with `<DashboardBuilderProvider>` between `ArtifactProvider` and `AgentStoreProvider`.

### Reused (no changes)
- All existing widgets registered in `ComponentRegistry` — they render inside dashboard cells unchanged.
- All four `dashboard-*.json` fixtures already exist.
- `FrameParser` / `CompositionEngine` — no changes; UW-030 is just another registered widget.

---

## Verification

1. **Type check** — `npx tsc --noEmit` → 0 errors.
2. **Sales-performance creation flow:**
   - `pnpm dev` → in chat type "build me a sales performance dashboard" → expect (in order) collapsed reasoning, the 2×3 grid (metrics + line chart + reps table + products table + pipeline list), and the consent banner.
   - Click **Save Dashboard** → modal pre-filled → save → navigate to My Artifacts → see the new "Dashboards and Reports" section with the saved card.
3. **Open + edit flow:**
   - Click the saved card → MainContent switches to `DashboardFullView`, grid is full-bleed, sidebar is on the right.
   - In the sidebar, click "Replace the line chart with a bar chart" → grid re-renders with the swap → click **Save Changes** → toast/confirmation → **Back** → returns to My Artifacts; reopen verifies the change persisted in the artifact.
4. **V2 carry-forward smoke** (from Part 13): UC-1 "How's Acme Corp doing?", UC-2 task creation, UC-3 multi-intent, widget swap, voice STT, Agent Store, Docs Q&A — all still work. None of these paths touch new code.
5. **Edge cases:**
   - Navigate directly to `'dashboard-view'` with no `activeDashboard` → effect kicks user back to `'artifacts'`, no crash.
   - Open dashboard, hit Back without saving edits → original artifact unchanged in My Artifacts.
   - Cancel during creation → no artifact written; turn marked stale.

---

## Out of Scope (deferred)

- LLM-driven dashboard editing (sidebar uses fixture/keyword matcher for the POC; LLM wiring lands in Block 8).
- Dashboard thumbnails via `html2canvas` — CSS placeholder is fine.
- Drag-to-resize / drag-to-reorder cells — the layout is fixture-defined.
- Cross-session persistence of saved dashboards (matches V2 cart and shared-state behavior).
- `action-chips-map.json["dashboard-edit"]` author — if not present at build time, hard-code 4 starter chips in `DashboardKaiSidebar` and migrate later.
