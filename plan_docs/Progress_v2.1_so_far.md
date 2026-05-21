# Kai 2.0 POC v2.1 — Progress So Far

## Scope of This Document
This document captures all work completed on the v2.1 branch *to date*. It is intended as exhaustive handoff context for developers continuing the build. The reference plan is [`plan_docs/Kai_2_0_POC_Plan_v2_1_final.md`](plan_docs/Kai_2_0_POC_Plan_v2_1_final.md). The active CLAUDE.md describes v2.1 architecture goals; this doc describes what is *actually built*.

---

## Block 0 — Type Foundations (DONE)

All v2.1 type definitions added to [`src/lib/types.ts`](src/lib/types.ts) without breaking any existing V2 contracts.

### Modified Types
- **`ArtifactCategory`** — widened to include `'Dashboards and Reports'` (additive enum, non-breaking).
- **`Widget<TData,TConfig>`** — added optional `highlights?: WidgetHighlight[]` field.
- **`WidgetProps<TData,TConfig>`** — added optional `highlights?: WidgetHighlight[]` field.

### New Types Added (v2.1 section)

| Category | Types |
|---|---|
| Proactive Brief | `ProactiveBrief`, `BriefItem` |
| Action Chips | `ActionChip`, `ActionChipsMap` |
| Page Context | `WizOrderPageName`, `PageContextData` |
| Highlights | `WidgetHighlight` |
| Dashboard Builder | `DashboardLayout`, `DashboardCell`, `DashboardCompositeData`, `SavedDashboard` |
| Shared State | `KaiCreatedItem`, `SharedOrder`, `SharedTask`, `SharedQuote` |
| WizOrder Entities | `WizOrderOrder`, `WizOrderCustomer`, `WizOrderProduct`, `WizOrderTask`, `WizOrderLead`, `WizOrderDeal` |
| Onboarding | `OnboardingState` |
| User Preferences | `UserPreferences` (reuses existing `ResponseMode`) |
| Command Palette | `CommandItem` |

### `WidgetHighlight` Contract
```ts
interface WidgetHighlight {
  fieldPath: string;            // dot-notation: "currentBalance" or "items[0].dueDate"
  type: 'urgent' | 'warning' | 'positive' | 'info';
  message: string;              // tooltip text
  action?: ActionChip;          // optional one-click follow-up query
}
```

### Engine Wiring
- [`src/components/engine/FrameParser.tsx`](src/components/engine/FrameParser.tsx) extracts `highlights` from each widget JSON and passes them into `ParsedWidget`.
- [`src/components/engine/CompositionEngine.tsx`](src/components/engine/CompositionEngine.tsx) forwards `highlights` to every rendered component as a prop.

**Verification:** `npx tsc --noEmit` → 0 errors after all changes.

---

## Block 1 — Highlight UI Pass on Existing Widgets (DONE)

Every UI widget that displays structured data now accepts an optional `highlights?: WidgetHighlight[]` and `onAction?: (query: string) => void` prop. The pattern is consistent across all widgets:

### Visual Spec (consistent across widgets)
- **Color tokens** per highlight `type`:
  - `urgent` → `var(--error-80)` border, `rgba(220,38,38,0.04)` bg, `rgba(220,38,38,0.12)` chip
  - `warning` → `var(--warning-80)` border, `rgba(245,158,11,0.04)` bg, `rgba(245,158,11,0.12)` chip
  - `positive` → `var(--success-80)` border, `rgba(22,136,95,0.04)` bg, `rgba(22,136,95,0.12)` chip
  - `info` → `var(--info-80)` border, `rgba(91,106,240,0.04)` bg, `rgba(91,106,240,0.12)` chip
- **Accent**: 3–4px left border or absolute positioned 3px wide div (in cases where `borderLeft` conflicts with layout).
- **Tooltip**: `var(--surface)` background, `var(--border)` outline, fontSize 12, `var(--shadow-tooltip)`, appears on hover above the highlighted field, `zIndex: 20+`, `pointerEvents: none`.
- **Action chip**: pill button with `&rarr; {label}` text, 10px font, `HL_CHIP` background, `HL_BORDER` color and outline. Click invokes `onAction(chip.query)` to chain into the next turn.

### Widgets Updated

| Widget | File | `fieldPath` Conventions |
|---|---|---|
| **CompactList** (UW-011) | [`src/components/widgets/ui/CompactList.tsx`](src/components/widgets/ui/CompactList.tsx) | `items[N].dueDate`, `items[N].title`, `items[N].status`, `items[N].priority` |
| **DataTable** (UW-004) | [`src/components/widgets/ui/DataTable.tsx`](src/components/widgets/ui/DataTable.tsx) | `rows[N].{colKey}` |
| **EntityDetailCard** (UW-003) | [`src/components/widgets/ui/EntityDetailCard.tsx`](src/components/widgets/ui/EntityDetailCard.tsx) | `fields[N]` (by index) or `fields.{label}` (by label, lowercase) |
| **MetricCardRow** (UW-002) | [`src/components/widgets/ui/MetricCardRow.tsx`](src/components/widgets/ui/MetricCardRow.tsx) | `cards[N]` or `cards[N].value` |
| **MetricCard** (UW-001) | [`src/components/widgets/ui/MetricCard.tsx`](src/components/widgets/ui/MetricCard.tsx) | `value`, `label`, or `trend` |
| **Customer360Card** (UW-007) | [`src/components/widgets/ui/Customer360Card.tsx`](src/components/widgets/ui/Customer360Card.tsx) | `metrics.cards[N].value`, `recentOrders[N].status`, `openTasks[N].title`, `riskIndicator`, plus profile-field paths |

### Customer360Card — Field Path Notes
The widget transforms its raw input into a view model before rendering, so highlight `fieldPath`s do **not** match raw data field names:

| Raw Data | Highlight `fieldPath` |
|---|---|
| `currentBalance` | `metrics.cards[1].value` |
| `lastOrderDate` (used in recent orders row) | `recentOrders[0].status` |
| `creditLimit` | `metrics.cards[2].value` |
| `lifetimeRevenue` | `metrics.cards[0].value` |

**This caught us once during testing** — fixtures that name raw fields will silently render with no highlight visible. Always use the rendered view-model paths.

### CompactList — Row-Level Highlight Lookup
A row-level highlight is resolved by checking these field keys in order:
```ts
rowHighlights.get('dueDate')
  ?? rowHighlights.get('title')
  ?? rowHighlights.get('status')
  ?? rowHighlights.get('priority')
```
> Initially missed `'dueDate'` — symptom was overdue tasks in UC-1 not rendering highlights even though the fixture had them. Fixed.

---

## Block 2 — Highlight Generation Utility (DONE)

[`src/lib/generateHighlights.ts`](src/lib/generateHighlights.ts) — fallback rule engine that derives highlights from raw widget data when the fixture doesn't provide explicit ones.

```ts
generateHighlights(widgetType: string, data: any): WidgetHighlight[]
```

### Rules Implemented

| Trigger | Type | Message | Applies To |
|---|---|---|---|
| Due date in the past | `urgent` | "Overdue by X days" | `UW-011`, `UW-004` (date columns), `UW-003` (date-labeled fields) |
| Due date within 2 days | `warning` | "Due in X days" / "Due today" | same as above |
| Stock = 0 | `urgent` | "Out of stock" | `UW-004` (stock col), `UW-003` (stock/inventory label) |
| Stock < 20 | `warning` | "Low stock — N units" | same as above |
| Balance > 50% of credit limit | `warning` | "Balance is $X — N% of $Y credit limit" | `UW-007` |
| VIP tag + last order > 30 days | `info` | "Last order was X days ago — above 30-day VIP cadence" | `UW-007` |
| Negative trend on metric | `warning` | "Down N% {period}" | `UW-002`, `UW-001` |

The utility is **not yet wired into the rendering pipeline** — this is intentional. The plan calls for fixture-provided highlights to take priority, with `generateHighlights` as a fallback when none are provided. Wire-up will live in the FrameParser or CompositionEngine in a later block.

---

## Block 3 — Fixture Updates (DONE)

### `src/fixtures/uc1-customer-intel.json` — UC-1: "How's Acme Corp doing?"

**UW-007 (Customer360Card)** — 2 highlights added:
- `metrics.cards[1].value` (warning) — "Balance is $18,200 — 24% of $75,000 credit limit" + "Send payment reminder" chip
- `recentOrders[0].status` (info) — "Last order was 45 days ago — slightly above your 30-day VIP cadence" + "Check in with Acme" chip

**UW-011 (CompactList)** — 2 highlights added:
- `items[0].dueDate` (urgent) — "Overdue — was due April 28" + "Create follow-up" chip
- `items[3].dueDate` (warning) — "Due tomorrow — claim review pending" + "Review claim" chip

### `src/fixtures/uc3-multi-intent.json` — UC-3: dual-intent revenue + task

**UW-002 (MetricCardRow)** — 1 highlight added:
- `cards[2]` (warning) — "Avg order value down 3.1% vs Q1 — consider pushing higher-margin SKUs" + "View top SKUs" chip

> Both fixtures validated as well-formed JSON via `node -e "JSON.parse(...)"`.

---

## Block 4 — Proactive Briefs + Contextual Starters (DONE)

### `ProactiveBriefCard` Component
[`src/components/chat/ProactiveBriefCard.tsx`](src/components/chat/ProactiveBriefCard.tsx) — renders the morning briefing as the first message on a new conversation when `proactiveAssistance` preference is ON.

- Three visual sections: a personalized greeting line ("Good morning, {firstName}…"), an `OVERDUE / FLAGGED` block with red/amber dots and inline action chips, a `TODAY` block with neutral dots.
- Each `BriefItem.action` renders as a pill chip on the right of the row. Click fires `onChipClick(query)` which auto-sends the query through the regular pipeline.
- Hides itself entirely when `kaiTurns.length > 0` (only shows on a fresh conversation).

### Page-Aware Brief Selection
The brief shown depends on the current WizOrder page (see Block 5). Five fixtures in [`src/fixtures/`](src/fixtures/):
- `proactive-brief-general.json` — default Kai chat (Acme quote expiring, approvals pending, claim CLM-0892)
- `proactive-brief-orders.json` — Orders page
- `proactive-brief-customers.json` — Customers page
- `proactive-brief-products.json` — Products page
- `proactive-brief-crm.json` — CRM page

### Contextual Starter Prompts
The four starter chips below the input field are also page-driven, sourced from `PageContextData.starters`. Click sends the prompt as a normal user query.

### Render Wiring
- ChatShell renders `<ProactiveBriefCard>` only when `kaiTurns.length === 0 && !isBusy && proactiveAssistance`.
- Wrapped with `data-tour="proactive-brief"` for guided-tour Step 5 targeting.

---

## Block 5 — Unified Sidebar + 5 WizOrder Pages + Page Context (DONE)

### `PageContext`
[`src/contexts/PageContext.tsx`](src/contexts/PageContext.tsx) — single source of truth for "which WizOrder page am I on".

```ts
interface PageContextData {
  pageName: WizOrderPageName;           // 'kai' | 'dashboard' | 'orders' | 'customers' | 'products' | 'crm'
  pageData: unknown;                    // page-specific data (orders[], customers[], etc.)
  starters: string[];                   // 4 contextual starter prompts
  proactiveBrief: ProactiveBrief;       // brief to show on new chat
  pageActions: PageAction[];            // page-level "Ask Kai" buttons (top-right of page)
  systemPromptInjection: string;        // appended to Kai's system prompt
}
```

The provider switches its data based on `useLayout().currentView` and loads the matching JSON fixture.

### Five WizOrder Pages
All under [`src/components/wizorder/`](src/components/wizorder/) and routed via `LayoutContext.currentView`:
- **Dashboard** — KPI tiles, recent activity feed
- **Orders** — table of orders, status filters, Kai-bridge for created orders
- **Customers** — searchable customer list with risk badges
- **Products** — product grid with stock indicators
- **CRM** — leads/deals pipeline view

Each page exposes "Ask Kai" page actions in the top-right that pre-seed Kai's input with a context-aware query.

### Unified Sidebar
[`src/components/layout/Sidebar.tsx`](src/components/layout/Sidebar.tsx) — single sidebar with two sections (`WIZORDER` + `KAI`) and the existing admin section underneath. The active item is highlighted by `currentView` from `LayoutContext`.

### Shared State Bridges
Three context providers under [`src/contexts/shared/`](src/contexts/shared/):
- `SharedOrdersContext` — orders Kai creates flow into the Orders page list
- `SharedCustomersContext` — Kai-created customers
- `SharedCRMContext` — Kai-created tasks/leads (used by UC-2 task confirmation)

[`SharedStoreProvider`](src/contexts/shared/SharedStoreProvider.tsx) wraps all three so they're available everywhere.

---

## Block 6 — Action Chips Bar + Capability Chains (DONE)

### `ActionChipsBar` Component
[`src/components/chat/ActionChipsBar.tsx`](src/components/chat/ActionChipsBar.tsx) — renders below `CanvasTextBlock` after every Kai turn. Pulls suggestions from [`src/fixtures/action-chips-map.json`](src/fixtures/action-chips-map.json) keyed by `useCase`.

- Up to 4 chips per turn, each a pill button with an `→` glyph.
- Click invokes `handleChipClick(query)` in ChatShell, which:
  1. Resolves template variables (`{customer}`, `{orderId}`, etc.) via `extractTemplateVars(lastTurnWidgets)` + `resolveChipQuery`.
  2. Sends the resolved query through `handleSend(resolved, false, true)` with `fromChip = true`.
- Rendering is gated by `kaiTurns.length > 0` and is wrapped with `data-tour="action-chips"` for tour targeting.

### Chip Chain Depth Tracking
`chipChainDepthRef` in ChatShell increments on every chip-triggered send and resets on a manual send. After the 3rd consecutive chip click, the next response asks for explicit user input rather than offering more chips. Spec aligns with the v2.1 plan ("max action chain depth: 3").

### Visual Polish
Chips use `var(--border)` outline, hover bumps the background slightly. Active state uses the highlight color tokens from Block 1 when the chip originates from a widget highlight.

---

## Block 7 — GTM: Onboarding, Guided Tour, Command Palette, Nudges (DONE)

### Onboarding Flow
[`src/components/gtm/OnboardingFlow.tsx`](src/components/gtm/OnboardingFlow.tsx) — 3-step modal shown on first ever app load. Tracked by [`src/contexts/OnboardingContext.tsx`](src/contexts/OnboardingContext.tsx) with `localStorage` key `kai_onboarding_v1`.

- **Step 1 — Meet Kai**: animated avatar with radial glow, intro copy, single CTA.
- **Step 2 — Choose Your Style**: three persona cards (Professional / Friendly / Concise) with custom SVG icons. Selecting a card writes to `PersonaContext` immediately.
- **Step 3 — Your First Briefing**: live preview of `ProactiveBriefCard` driven by current `PageContext.proactiveBrief`. Optional chip click stages a query for after onboarding completes.

The component returns `null` until `OnboardingContext.hydrated === true` to prevent the modal from flashing on every page load before localStorage is read. Persona selection persists across sessions via `kai-persona-id` in localStorage (see PersonaContext changes).

### Guided Tour (6 Steps)
[`src/components/gtm/GuidedTourOverlay.tsx`](src/components/gtm/GuidedTourOverlay.tsx) + [`src/contexts/GuidedTourContext.tsx`](src/contexts/GuidedTourContext.tsx). Triggered from Settings → "Take a Tour" button.

| Step | Target (`data-tour`) | Tooltip Side |
|---|---|---|
| 1 | `sidebar` | right |
| 2 | `ask-kai-button` | bottom |
| 3 | `chat-input` | top |
| 4 | `action-chips` | top (offset 16) |
| 5 | `proactive-brief` | bottom |
| 6 | `cmd-k-hint` | top |

#### Spotlight + Tooltip
- Uses an SVG mask with a rounded-rect cutout to dim everything except the target. Cutout `d` attribute animates with `transition: d 300ms cubic-bezier(0.4, 0, 0.2, 1)` for smooth target-to-target movement.
- Tooltip auto-positions per `tooltipSide` and clamps to viewport edges. For `'top'` side, auto-flips to bottom if there's not enough room above (`idealTop < 12`).
- Step counter, mini step dots, and a shimmer-animated `Next →` button (linear gradient + `tourBtnShimmer` keyframe) draw the eye to the action.

#### Step 3 → 4 Sequencing (the trickiest part)
1. On entering Step 3, the overlay calls `triggerTourPrefill()` which sets `tourPrefill = "How's Acme Corp doing?"` in context.
2. ChatShell's `useEffect([tourPrefill])` fills the input box and immediately calls `clearTourPrefill()`.
3. The Next button is replaced by italic `"Send the query to continue →"` text (state: `waitingForWidgets`).
4. User sends → `notifyTourQuerySent()` → `overlayHidden = true` → overlay disappears so Kai's response renders unobstructed.
5. ChatShell's `handleWidgetsReady` fires when widgets render. It does a two-pass scroll-to-bottom (300ms apart, using `scrollIntoView({ behavior: 'instant' })` on a sentinel `div` at the very bottom of the chat) and then calls `notifyTourWidgetsReady()` after 350ms.
6. The context un-hides the overlay and fires the registered "widgets ready" callback, which advances `stepIdx` to 3 (Step 4 of 6).

#### Step 4 — Pause/Resume Pattern
Step 4 highlights `action-chips`. Two exit paths:
1. **User clicks an action chip** → `notifyTourChipClicked()` (deferred via `setTimeout(0)` to dodge React's setState-during-render warning) → `pauseTour()` → overlay disappears, `paused = true`.
2. **User clicks "Skip tour"** → also calls `pauseTour()` (overridden behavior on step 4 only — on every other step, "Skip tour" ends the tour).

Tour resumes at Step 5 when the user starts a new conversation:
- `handleReset()` calls `clearTourPrefill()` then `resumeTour()`.
- `resumeTour` reads from `pausedRef.current` (not the stale `paused` state) so it works even when the closure is captured at provider construction.
- Resume fires the registered callback which calls `setStepIdx(4)` → Step 5 (proactive-brief) renders.

The `notifyTourWidgetsReady` function gates its un-hide behavior on `paused` state — using the functional `setPaused((currentlyPaused) => …)` updater to read the latest value — so a paused tour does not get re-shown by a subsequent widget render.

### Command Palette (⌘K)
[`src/components/chat/CommandPalette.tsx`](src/components/chat/CommandPalette.tsx) — modal triggered globally by Cmd+K (or Ctrl+K). Contents driven by [`src/fixtures/command-palette-items.json`](src/fixtures/command-palette-items.json).

- **Categories** in fixed order: `SALES`, `ADMIN`, `NAVIGATION`, `SETTINGS`.
- **Fuzzy match**: every search character must appear in the item title in order. No scoring beyond category order.
- **Keyboard nav**: ↑/↓ moves selection, Enter selects, Escape closes.
- **Item types**:
  - `query` items → `clearMessages` + `setView('chat')` + `setPendingQuery(query)` + `triggerChatFocus`. ChatShell auto-sends `pendingQuery` once the chat view mounts.
  - `route` items → `setView(route)` to navigate.
- The header pill button (`⌘K` glyph) carries `data-tour="cmd-k-hint"` for guided-tour Step 6.

### Usage Nudges
[`src/components/gtm/UsageNudge.tsx`](src/components/gtm/UsageNudge.tsx) + [`src/contexts/NudgeContext.tsx`](src/contexts/NudgeContext.tsx) — small one-time inline tips that appear after specific moments:
- `chart` — first time a `CH-001` chart is rendered.
- `dashboard` — first time a `UW-030` dashboard is rendered.
- `email` — first time an email-draft turn completes.
- `action-chip` — first time the user clicks any action chip.

State is tracked per-type in `localStorage` (`kai_nudges_seen_v1`); each nudge shows once and is dismissed via the `Got it` button.

### Share Snapshot
[`src/components/gtm/ShareSnapshotButton.tsx`](src/components/gtm/ShareSnapshotButton.tsx) — small share icon in the message header that builds a snapshot link of the current turn (POC-only; copies a stub URL to clipboard).

---

## Bug Fixes During Build

> Block 8 fixes (#19–25) are documented inline in the Block 8 section above.

### Block 1–3 fixes
1. **`Customer360Card.tsx` parse error** — Next.js swc parser was rejecting Unicode box-drawing chars (`──`, `→`) in source. Replaced with ASCII (`--`) and HTML entities (`&rarr;`).
2. **Customer360Card highlight invisible on metric cards** — `HighlightedField` wrapper was breaking the metric card's `flex: '1 1 140px'` sizing. Fix: gave `HighlightedField` an optional `flex` prop that it applies whether or not a highlight is present.
3. **CompactList row highlights not resolving** — `dueDate` was missing from the row-level field-key lookup chain. Added.
4. **Fixture field paths didn't match widget render paths** — UC-1 fixture initially used raw data names (`currentBalance`, `lastOrderDate`); the widget renders these at view-model paths. Fixture corrected; `generateHighlights.ts` updated to emit matching paths so rules and fixtures stay consistent.

### Block 7 fixes
5. **`flexShrink` DOM-prop warning in CommandPalette** — was spreading `{ width, height, flexShrink }` directly onto `<svg>` elements. Fixed: moved `flexShrink: 0` into a `style` object.
6. **Persona selection lost after onboarding** — `PersonaContext` was using `useState(() => localStorage.getItem(...))` which doesn't run on the server, causing an SSR/CSR hydration mismatch. Fixed: `useState(DEFAULT)` + post-mount `useEffect` to read localStorage. Two `useEffect`s now write `kai-persona-id` and `kai-voice-id` whenever the selection changes.
7. **Onboarding modal flashing on every page load** — `OnboardingContext` was rendering the modal during the first render before localStorage was read. Added `hydrated` flag set inside the `useEffect`; `OnboardingFlow` returns `null` until `hydrated === true`.
8. **Onboarding modal reappearing on scroll** — same root cause as #7 (re-render before hydration). Same fix.
9. **Guided tour Step 3 hydration mismatch** — caused by the persona-context bug (#6). Fixed by that bug's resolution.
10. **Guided tour Steps 4–6 not rendering** — `chat-input`, `action-chips`, and `proactive-brief` only exist when chat view is mounted, and `action-chips` only after a completed turn. Fixed by:
   - `CHAT_VIEW_TARGETS = new Set(['chat-input', 'action-chips', 'proactive-brief'])` — overlay calls `setView('chat')` before measuring.
   - `tourPrefill` + `notifyTourWidgetsReady` callback wiring (see Step 3→4 sequencing above).
   - Two-pass scroll-to-bottom using `scrollIntoView({ behavior: 'instant' })` on a sentinel `div` so the smooth-scroll CSS doesn't delay the spotlight measurement.
11. **`useEffect` dep-array changed-size warning in GuidedTourOverlay** — adding `step` and `setView` to deps grew the array from 3 to 5 items mid-life. Fixed: moved both into mutable refs (`stepRef`, `setViewRef`, `setStepIdxRef`) and kept the dep array stable.
12. **Tour seed query hit "unknown" use case** — the original prefill `"Show me top customers this month"` had no matcher in `queryMatcher.ts`. Changed to `"How's Acme Corp doing?"` which routes to UC-1 via `m.includes("how's")`.
13. **Step 4 tooltip clipping or covering action chips** — first attempt with `tooltipSide: 'right'` overflowed the viewport edge; switching to `'top'` with `tooltipOffset: 16` and `TOOLTIP_H_APPROX: 180` placed it cleanly above without obscuring chips.
14. **Dashboard widgets not horizontally scrollable inside chat** — `overflow: 'hidden'` on multiple widget outer containers blocked their inner `overflowX: 'auto'` scroll containers (because `hidden` creates a block-formatting context that intercepts scroll). Fixed: changed `overflow: 'hidden'` → `'clip'` on `DataTable.tsx`, `CompactList.tsx`, `LineChart.tsx`, and the `DashboardCompositeWidget.tsx` cell wrapper. Also added `minWidth: 420` and `WebkitOverflowScrolling: 'touch'` to the `DataTable` scroll wrapper.
15. **Step 4 re-triggered after action-chip click** — when a chip click started a new turn, `handleWidgetsReady` would fire `notifyTourWidgetsReady` which un-hid the overlay even though the tour was paused. Fixed: `notifyTourWidgetsReady` now reads `paused` via the functional `setPaused` updater and skips un-hide when paused.
16. **Step 5 not resuming after new conversation** — `resumeTour` had `if (!paused) return` which read a stale `paused` value (always the closure's initial `false`). Fixed: added `pausedRef` mirroring the state and gated on `pausedRef.current`.
17. **Tour prefill persisting after reset** — `handleReset` cleared `input` but didn't clear `tourPrefill` in context, so the prefill `useEffect` would re-run and re-fill the input on the new conversation. Fixed: `handleReset` now calls `clearTourPrefill()`.
18. **`setState during render` warnings (`NudgeProvider` from `ChatShell`)** — `triggerNudge` was called inside both `handleWidgetsReady` (which fires during a child's render via `onWidgetsReady`) and inside a `setKaiTurns` updater function in `handleStreamEnd` (state updaters run during reconciliation). Fixed: wrapped both call sites in `setTimeout(0)` so they fire after the current render commit.

---

## Block 8 — LLM Streaming Text + Voice Integration (DONE)

Two-pass response pattern: widgets render from fixtures (instant), LLM text streams into `CanvasTextBlock` in parallel via the Anthropic Messages API. Demo mode (Cmd+Shift+D, no `?ai=true`) uses fixture closing text only — no LLM calls.

### Streaming API Route
[`src/app/api/kai/generate/route.ts`](src/app/api/kai/generate/route.ts) — POST endpoint that streams Claude Sonnet 4.6 responses as `text/plain; charset=utf-8` with `Transfer-Encoding: chunked`. Accepts: `messages`, `capability`, `persona`, `customInstructions`, `pageContext`, `widgetData`, `includeFinancial`, plus touchpoint-specific fields (`userQuery`, `originalText`, `additionalContext`, `changes`, `originalTotal`, `newTotal`).

System prompt is assembled by [`src/lib/systemPrompts.ts`](src/lib/systemPrompts.ts) in this fixed order: **[1] persona → [2] custom instructions → [3] page context → [4] capability prompt → [5] widget data**. Per-touchpoint `max_tokens` from `getMaxTokens(capability)`.

### 10 Touchpoint System Prompts (T1–T10)
Each is a function in `systemPrompts.ts`:

| Key | Function | Purpose | Max tokens |
|---|---|---|---|
| T1 | `t1CanvasTextBlock` | 2–4 sentence insight narrative below widgets | 300 |
| T2 | `t2EmailBody` | Complete email with Subject/body/sign-off, 150–220 words | 400 |
| T3 | `t3MeetingTalkingPoints` | Exactly 4 dash-formatted talking points | 350 |
| T4 | `t4ApprovalQueue` | 2–3 sentences on time-sensitive items + patterns | 200 |
| T5 | `t5ReportNarrative` | 3–5 sentence "chief of staff" dashboard summary | 250 |
| T6 | `t6ToneChangeFollowUp` | Rewrites `originalText`, facts unchanged | 400 |
| T7 | `t7ModificationDescription` | 2–3 sentences describing order diff with totals | 150 |
| T8 | `t8DocsQAAugmentation` | Reformulates matched doc excerpt conversationally | 250 |
| T9 | `t9TextOnlyNarrative` | Full prose narrative replacing all widgets | 600 |
| T10 | `t10WorkflowImpact` | Exactly 2 sentences — impact estimate + edge cases | 150 |

`buildSystemPrompt(key, args)` dispatches by capability key; falls back to T1. Custom instructions section is labeled: *"USER CUSTOM INSTRUCTIONS — always follow these exactly. They override default style, format, length, chart-type, and tone choices."* T5 explicitly mentions custom instructions govern chart-type choices.

### Streaming Hook
[`src/hooks/useKaiGenerate.ts`](src/hooks/useKaiGenerate.ts) — fires once per turn when `widgetsDone === true && enabled === true`. POSTs to `/api/kai/generate`, reads `ReadableStream` chunk-by-chunk via `getReader()`, accumulates into `streamingText`. Returns `{ streamingText, isStreaming, failed }`.

- **Connection-only timeout** (`timeoutMs = 8000`): cleared on first chunk arrival via `firstChunk` flag — slow completions don't get aborted mid-stream.
- **Fallback rules**: demo mode → no fetch, caller uses fixture; timeout/network error → `failed = true`, caller uses fixture.
- `firedRef` ensures exactly one fetch per turn instance.

### CanvasTextBlock Two-Pass Display
[`src/components/chat/CanvasTextBlock.tsx`](src/components/chat/CanvasTextBlock.tsx) — accepts `streamingText`, `isStreaming`, `onStreamComplete` props.

Display logic prevents fixture-flash before first token:
```ts
const aiModeActive = isStreaming || streamingText.length > 0;
const displayText = streamingText.length > 0
  ? streamingText
  : aiModeActive ? '' : closingText.text;
```

A blinking cursor (`kai-blink` keyframe, 900ms step-end) appears at the end of the last paragraph or bullet during streaming. When streaming has started but no text yet, a standalone `<Cursor />` shows. `BodyText` renderer supports inline bullets (`• ` / `- ` prefixes) and email body paragraphs. `onStreamComplete` fires once via `useEffect` when `!isStreaming && streamingText.length > 0`.

### ChatShell Integration (`GenerateContext` Pattern)
Each turn renderer (`StandardTurnRenderer`, `ConsentTurnRenderer`, `DocsQATurnRenderer`, `PageContextTurnRenderer`, `DashboardBuilderTurnRenderer`) accepts a `generateCtx: GenerateContext` prop:
```ts
interface GenerateContext {
  aiMode: boolean;
  capability: string;
  userQuery: string;
  persona?: string;
  customInstructions?: string;
  pageContext?: { page; visibleData?; systemPromptInjection? };
  includeFinancial: boolean;
}
```

Each renderer has its own `[widgetsDone, setWidgetsDone]` state, set to `true` when its widget stream simulator finishes. `useKaiGenerate` is called inside the renderer with the appropriate capability key:
- `StandardTurnRenderer`: uses `'text-only'` (T9) when `responseMode === 'text-only'`, else the turn's `useCase`.
- `DocsQATurnRenderer`: `'docs-qa'` (T8), passes `additionalContext: qa.answer`.
- `DashboardBuilderTurnRenderer`: `'dashboard'` (T5).

`generateCtx` is built once per turn in the ChatShell render loop and passed down through `KaiTurnRenderer`. Each `CanvasTextBlock` receives `streamingText={llm.failed ? '' : llm.streamingText}` — failure suppresses the streaming text so the fixture fallback shows.

### Auto-Speak (Read Responses Aloud)
When the user toggles **Settings → Voice & Audio → Read responses aloud** ON, the LLM stream's final text is auto-spoken via ElevenLabs.

#### Module-Level Audio Unlock (the hard part)
Browser autoplay policy blocks `audio.play()` on a fresh `Audio` instance unless it's called inside a user-gesture handler. Auto-speak fires inside a `useEffect` after streaming completes — **not** a gesture. Solution:

1. [`src/hooks/useVoice.ts`](src/hooks/useVoice.ts) exposes a **module-level** `unlockAudio()` (not a hook return) and a module-level `_primedAudio` singleton:
```ts
let _primedAudio: HTMLAudioElement | null = null;
export function unlockAudio() {
  if (_primedAudio || typeof window === 'undefined') return;
  // Play a 0-volume silent WAV synchronously inside the gesture
  const el = new Audio(silentWavBlobUrl);
  el.volume = 0;
  el.play().catch(() => {});  // unlocks this element instance for life
  _primedAudio = el;
}
```
2. The `Audio` element instance, once unlocked via `.play()` in a gesture, retains permission for subsequent `.play()` calls — even after `.src` is swapped to ElevenLabs MP3 blobs and `.play()` is called from inside an async `.then()`. Works on Chromium and Safari.
3. `speak()` checks `_primedAudio` — if `null`, falls back to `speechSynthesis` (browser TTS) to avoid `NotAllowedError`.
4. `stopSpeaking()` does **not** null `.src` on the primed element (would invalidate the unlock).

#### Why Module-Level
`useVoice()` is called in two separate components (`ChatShell` and `UserPreferencesView`) — these are **distinct hook instances** with separate refs. Hoisting `_primedAudio` and `unlockAudio` to module scope makes them a singleton; the unlock done in one component is visible to all others.

#### Trigger Points
`unlockAudio()` is called inside:
- `UserPreferencesView` — when "Read responses aloud" toggle is turned ON.
- `ChatShell.handleToggleTTS` — when the user clicks the volume button on any response (covers the case where the user wants ElevenLabs without enabling auto-speak).

#### handleStreamComplete Wiring
ChatShell builds `handleStreamComplete = (text) => { if (!readAloud) return; if (voice.isSpeaking) voice.stopSpeaking(); voice.speak(text); }` and passes it through every renderer to `CanvasTextBlock`. Fires once when streaming ends. Auto-speak respects manual toggle interruption: clicking the volume button while auto-speak is running stops it (the toggle handler also catches `speakingTurnId === null`, which is the auto-speak case).

### UserPreferencesContext + readAloud
[`src/contexts/UserPreferencesContext.tsx`](src/contexts/UserPreferencesContext.tsx) is the single source of truth for `readAloud`. Storage key: `kai_user_prefs_v1`. The toggle in `UserPreferencesView` reads `readAloud` directly from context (not from its own local `prefs` state) and writes via `setReadAloud(v)`.

> Earlier bug: dual-key storage (`kai_prefs_v1` from the view + `kai_user_prefs_v1` from the context) caused stale state. Symptom: toggle showed OFF but auto-speak still fired because context had a stale `true` from `kai_prefs_v1`. Fix: removed the dual-read; context is the only source of truth.

### Vercel Deployment
Project: `kai_demo_v0` (linked via `.vercel/project.json`).
Production URL: **https://kaidemov0.vercel.app**
Env vars set in Vercel: `ANTHROPIC_API_KEY`, `ELEVENLABS_API_KEY`, `ELEVENLABS_VOICE_ID`.
Deploys via `vercel --prod` from the linked repo.

### Block 8 Bugs Fixed During Build
19. **Mid-stream timeout overriding LLM text with fixture** — original 3s timeout fired while Sonnet was still streaming. Fix: connection-only timeout cleared on first chunk + raised default to 8000ms.
20. **Fixture text flashing before first token in AI mode** — `displayText` was falling back to `closingText.text` while `isStreaming === true`. Fix: `aiModeActive` flag forces `displayText = ''` until the first streamed character arrives.
21. **`audio.play()` NotAllowedError on auto-speak** — Browser autoplay policy blocks `.play()` outside user gestures. Fix: module-level `unlockAudio()` primes a persistent `Audio` element on toggle-ON click; `speak()` reuses that exact element instance for subsequent ElevenLabs playback.
22. **Volume button re-triggers speech instead of stopping** — `handleToggleTTS` only stopped speech when `speakingTurnId === turnId`, but auto-speak doesn't set `speakingTurnId`. Fix: also stops when `voice.isSpeaking && speakingTurnId === null` (the auto-speak case).
23. **Browser TTS playing instead of ElevenLabs even with toggle ON** — Two separate `useVoice()` instances meant the unlock didn't propagate. Fix: hoisted `unlockAudio` and `_primedAudio` to module scope.
24. **Auto-speak firing while toggle appears OFF** — Stale `readAloud` from the context's secondary read of `kai_prefs_v1`. Fix: context now reads only from its own `kai_user_prefs_v1`; toggle reads `readAloud` directly from context.
25. **Manual volume button using browser TTS when toggle is OFF** — `unlockAudio()` was only called when toggling auto-speak ON. Fix: also call from `handleToggleTTS` (it's a click handler, gesture-safe).

---

## What's NOT Yet Built

| Block | Title | Status |
|---|---|---|
| 0 | Type foundations | ✅ Done |
| 1 | Widget highlights UI | ✅ Done |
| 2 | `generateHighlights` utility | ✅ Done (not wired into pipeline yet) |
| 3 | Fixture highlight data | ✅ Done (UC-1 + UC-3) |
| 4 | Proactive Briefs + contextual starters | ✅ Done |
| 5 | Unified Sidebar + 5 WizOrder pages + PageContext + SharedState | ✅ Done |
| 6 | Action Chips Bar + capability chains | ✅ Done |
| 7 | GTM (Onboarding, Guided Tour, Command Palette, Nudges, Share) | ✅ Done |
| 8 | LLM streaming text + voice (auto-speak via ElevenLabs with module-level unlock) | ✅ Done |
| — | Wire `generateHighlights.ts` into the render pipeline as a fallback | ❌ Not started |

### Remaining Work
All planned blocks are complete. Remaining scope is **frontend polish and bug fixes** as the user iterates on the deployed POC.

---

## Testing Notes

### How to Test the Guided Tour (end-to-end)
1. Run `pnpm dev`. If onboarding hasn't been completed, finish the 3-step flow (or open DevTools → Application → Local Storage and remove `kai_onboarding_v1` to retrigger).
2. Settings → "Take a Tour".
3. Step 1 (sidebar) → Next → Step 2 (Ask Kai pill) → Next → Step 3 (chat input prefilled with "How's Acme Corp doing?") → click Send.
4. Overlay disappears. Widgets render. View auto-scrolls to bottom. Step 4 (action chips) appears.
5. From Step 4 either click "Skip tour" *or* click any action chip — overlay disappears in both cases.
6. Click "New conversation" (top-right of chat). Proactive brief reappears. Tour resumes at Step 5 (proactive-brief target). Next → Step 6 (⌘K pill in header) → Done.

### How to Test UC-1 Highlights
1. In Kai chat: type **"How's Acme Corp doing?"** → triggers UC-1.
2. Expect to see:
   - **Customer360Card**: warning accent on the "Current Balance" metric card with a tooltip on hover; info accent on the recent order row.
   - **CompactList ("Open Tasks for Acme Corp")**: red urgent accent on T-1001 (overdue Q2 catalog), amber warning accent on T-1004 (claim review).
   - Each highlight has a hoverable tooltip and a clickable action chip below the field.

### How to Test UC-3 Highlight
1. In Kai chat: type a UC-3 trigger query (e.g. "Show me Acme Corp Q2 revenue and create a follow-up task").
2. Expect: `MetricCardRow` with the third card ("Avg Order Value") showing a warning accent + tooltip about the down trend.

### How to Test the Command Palette
1. Press ⌘K (or Ctrl+K) anywhere in the app.
2. Type a few characters of any item name. Items group under SALES / ADMIN / NAVIGATION / SETTINGS.
3. Up/Down to navigate, Enter to select. `query` items send the query; `route` items navigate.

### Known UI Polish Items
- Tooltips currently use `whiteSpace: 'nowrap'` — long messages will overflow. Acceptable for POC.
- Action chips use a default border color in `Customer360Card` (linter chose neutral) but a typed border color in other widgets.

---

## File Inventory

### Created (since v2.1 build started)
- [`src/lib/generateHighlights.ts`](src/lib/generateHighlights.ts)
- [`src/components/chat/ProactiveBriefCard.tsx`](src/components/chat/ProactiveBriefCard.tsx)
- [`src/components/chat/ActionChipsBar.tsx`](src/components/chat/ActionChipsBar.tsx)
- [`src/components/chat/ActionChip.tsx`](src/components/chat/ActionChip.tsx)
- [`src/components/chat/CommandPalette.tsx`](src/components/chat/CommandPalette.tsx)
- [`src/components/widgets/ui/DashboardCompositeWidget.tsx`](src/components/widgets/ui/DashboardCompositeWidget.tsx)
- [`src/components/gtm/OnboardingFlow.tsx`](src/components/gtm/OnboardingFlow.tsx)
- [`src/components/gtm/GuidedTourOverlay.tsx`](src/components/gtm/GuidedTourOverlay.tsx)
- [`src/components/gtm/UsageNudge.tsx`](src/components/gtm/UsageNudge.tsx)
- [`src/components/gtm/ShareSnapshotButton.tsx`](src/components/gtm/ShareSnapshotButton.tsx)
- [`src/contexts/PageContext.tsx`](src/contexts/PageContext.tsx)
- [`src/contexts/OnboardingContext.tsx`](src/contexts/OnboardingContext.tsx)
- [`src/contexts/GuidedTourContext.tsx`](src/contexts/GuidedTourContext.tsx)
- [`src/contexts/NudgeContext.tsx`](src/contexts/NudgeContext.tsx)
- [`src/contexts/UserPreferencesContext.tsx`](src/contexts/UserPreferencesContext.tsx)
- [`src/contexts/DashboardBuilderContext.tsx`](src/contexts/DashboardBuilderContext.tsx)
- [`src/contexts/shared/SharedOrdersContext.tsx`](src/contexts/shared/SharedOrdersContext.tsx)
- [`src/contexts/shared/SharedCustomersContext.tsx`](src/contexts/shared/SharedCustomersContext.tsx)
- [`src/contexts/shared/SharedCRMContext.tsx`](src/contexts/shared/SharedCRMContext.tsx)
- [`src/contexts/shared/SharedStoreProvider.tsx`](src/contexts/shared/SharedStoreProvider.tsx)
- Fixtures: `action-chips-map.json`, `command-palette-items.json`, `proactive-brief-*.json` (5 files), `page-context-*.json` (5 files), `wizorder-*.json` (4 files), `dashboard-*.json` (8 files).
- Block 8 (LLM + voice):
  - [`src/app/api/kai/generate/route.ts`](src/app/api/kai/generate/route.ts) — streaming Anthropic endpoint
  - [`src/lib/systemPrompts.ts`](src/lib/systemPrompts.ts) — T1–T10 system prompt builders + `getMaxTokens`
  - [`src/hooks/useKaiGenerate.ts`](src/hooks/useKaiGenerate.ts) — streaming hook with timeout + fallback

### Modified (v2.1 changes on top of V2)
- [`src/lib/types.ts`](src/lib/types.ts) — full v2.1 type section appended; widened `ArtifactCategory`; added `highlights?` to `Widget` and `WidgetProps`.
- [`src/components/engine/FrameParser.tsx`](src/components/engine/FrameParser.tsx) — extracts and forwards `highlights`.
- [`src/components/engine/CompositionEngine.tsx`](src/components/engine/CompositionEngine.tsx) — passes `highlights` to widget components.
- [`src/components/widgets/ui/CompactList.tsx`](src/components/widgets/ui/CompactList.tsx), [`DataTable.tsx`](src/components/widgets/ui/DataTable.tsx), [`EntityDetailCard.tsx`](src/components/widgets/ui/EntityDetailCard.tsx), [`MetricCardRow.tsx`](src/components/widgets/ui/MetricCardRow.tsx), [`MetricCard.tsx`](src/components/widgets/ui/MetricCard.tsx), [`Customer360Card.tsx`](src/components/widgets/ui/Customer360Card.tsx) — highlight-rendering passes; `overflow: hidden → clip` for scroll fixes.
- [`src/components/widgets/charts/LineChart.tsx`](src/components/widgets/charts/LineChart.tsx) — `overflow: hidden → clip`.
- [`src/components/chat/ChatShell.tsx`](src/components/chat/ChatShell.tsx) — proactive brief render, action chips wiring, tour prefill/widgets-ready callbacks, scroll sentinel + `scrollIntoView` instant scroll, `clearTourPrefill` on reset, deferred `triggerNudge` calls. Block 8: `GenerateContext` plumbed through every renderer, `useKaiGenerate` wired per turn, `handleStreamComplete` for auto-speak, `unlockAudio()` called from `handleToggleTTS`.
- [`src/components/chat/CanvasTextBlock.tsx`](src/components/chat/CanvasTextBlock.tsx) — `streamingText` / `isStreaming` / `onStreamComplete` props, blinking cursor, `aiModeActive` flag prevents fixture flash before first token.
- [`src/hooks/useVoice.ts`](src/hooks/useVoice.ts) — module-level `unlockAudio()` + `_primedAudio` singleton; `speak()` reuses primed `Audio` element for ElevenLabs MP3 playback; falls back to `speechSynthesis` when not unlocked.
- [`src/contexts/UserPreferencesContext.tsx`](src/contexts/UserPreferencesContext.tsx) — added `readAloud` + `setReadAloud`; single source of truth for the auto-speak preference.
- [`src/components/views/UserPreferencesView.tsx`](src/components/views/UserPreferencesView.tsx) — "Read responses aloud" toggle reads from context, calls `unlockAudio()` on toggle-ON.
- [`src/contexts/PersonaContext.tsx`](src/contexts/PersonaContext.tsx) — SSR-safe localStorage hydration for persona/voice persistence.
- [`src/components/layout/Sidebar.tsx`](src/components/layout/Sidebar.tsx), [`LayoutShell.tsx`](src/components/layout/LayoutShell.tsx) — unified sidebar; ⌘K listener + pill button.
- [`src/fixtures/uc1-customer-intel.json`](src/fixtures/uc1-customer-intel.json), [`uc3-multi-intent.json`](src/fixtures/uc3-multi-intent.json) — highlight data.

### Untouched (V2 carry-forward intact)
All Agent Store, Docs, History, Voice, Follow-ups, Persona base data, Demo/AI toggle, and other V2 features remain unmodified per the V2 carry-forward rule.
