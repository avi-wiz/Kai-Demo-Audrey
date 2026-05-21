# Repo Overview — Kai vDemo (Audrey's Home & Gift)

A map of the codebase areas relevant to the Audrey CEO demo on top of Kai v2. Read this before adding any new fixture, route, chip, or context mutation.

> **Status snapshot (2026-05-21):** All capability fixtures, reports, special routes, page reskins, SharedCRM mutators, system-prompt block, and the **6 operational queries (inventory / orders status / leads status / customers-by-SKU / order-status clarification / open orders)** are **done**. The Acme-era data has been fully scrubbed — every customer/lead/rep/SKU now comes from `src/data/audreys/`. Recent additions also include the **UI overhaul** (two-rail sidebar, breadcrumb top bar, Ask Kai pill, product card redesign, orders table redesign) and the **My Artifacts revamp** (live-render thumbnails + single-artifact viewer with PNG/CSV export). For the demo prompt catalog see [../Kai Demo Script.md](../Kai%20Demo%20Script.md); for the day-to-day status overlay see [Progress_Kai_Demo.md](Progress_Kai_Demo.md).

---

## 1. Fixture Files — `src/fixtures/`

All fixtures are static JSON, imported at build time and routed by `queryMatcher.ts` or ChatShell. The Frame JSON contract is: `{ frameId, frameType, widgets: [{ widgetType, data, config?, highlights? }], closingText, capability? }`.

### Page-context fixtures (one per WizOrder page)
| File | Purpose |
|---|---|
| `page-context-dashboard.json` | Dashboard page keyword queries |
| `page-context-orders.json` | Orders page (overdue shipments, flagged, today's) |
| `page-context-customers.json` | Customers page queries |
| `page-context-products.json` | Products page queries |
| `page-context-crm.json` | CRM page queries |

### Dashboard-builder fixtures
| File | Capability |
|---|---|
| `dashboard-customer-health.json` | dashboard-builder |
| `dashboard-order-analytics.json` | dashboard-builder |
| `dashboard-pipeline.json` | dashboard-builder |
| `dashboard-sales-performance.json` | dashboard-builder |
| `dashboard-overview.json`, `dashboard-performance.json`, `usage-dashboard.json` | variants |

### Special fixtures (keyword-routed before general matcher)
| File | Trigger |
|---|---|
| `special-order-history.json` | "recent orders", "order history" (Magnolia-scoped) |
| `special-meeting-prep.json` | "prep me", "meeting brief" (Magnolia 10am tomorrow) |
| ✅ `special-inventory-status.json` | "inventory status", "stock breakdown" — 4-col SKU table |
| ✅ `special-orders-recent-status.json` | "status of my orders" — counts + 15-row recent table |
| ✅ `special-leads-status.json` | "status of my leads", "my leads" — counts + leads table |
| ✅ `special-open-orders.json` | "open orders", "pending orders" — counts + filtered table |
| ✅ `special-customers-by-sku-bird-pot-feet.json` | "bird pot feet", "51gr1907" |
| ✅ `special-customers-by-sku-cement-bird-feeder.json` | "cement bird feeder", "51gr1776-u" |
| ✅ `special-customers-by-sku-blooming-porch.json` | "a blooming porch", "51gr1522-u" |
| ✅ `special-order-status-clarify.json` | "current status of the order" — AW-006 picker |
| ✅ `special-order-status-O-50001/7/13/27/34.json` | per-order follow-up cards (5 fixtures) |

### Capability fixtures — Audrey vDemo (Caps 1–6) — ✅ all in place
| File | Use-case | Keywords |
|---|---|---|
| `cap1-task-email-voice.json` + `cap1-task-confirmed.json` | cap1-task-email / cap1-task-confirmed | "wildflower", "birdhouse", "create task" |
| `cap1-email-draft.json` | cap1-email-draft | "draft the email for wildflower", "draft the email now" |
| `cap2-lead-creation.json` + `cap2-auto-task-followup.json` | cap2-lead-creation / cap2-auto-task | "add lead", "pine and thistle" |
| `cap3-lead-stage-won.json` + `cap3-conversion-confirmed.json` | cap3-lead-won / cap3-conversion-confirmed | "move to won", "verdant home" |
| `cap4-merge-customer.json` + `cap4-merge-confirmed.json` | cap4-merge-customer / cap4-merge-confirmed | "merge", "garden gate" |
| `cap5-user-creation.json` + `cap5-user-confirmed.json` | cap5-user-creation / cap5-user-confirmed | "create user", "lakeside" |
| `cap6-catalog-creation.json` + `cap6-catalog-confirmed.json` | cap6-catalog-builder / cap6-catalog-confirmed | "build catalog", "mountain bloom" |

### Capability fixtures — Cap 7 reports — ✅ all in place
| File | Use-case |
|---|---|
| `report-collection-performance.json` | report-collection-performance |
| `report-prebook-pacing.json` | report-prebook-pacing |
| `report-customer-health.json` | report-customer-health |
| `report-pipeline.json` | report-pipeline |
| `report-team-performance.json` | report-team-performance |
| `report-catalog-health.json` | report-catalog-health |

### Legacy v2 capability fixtures (still demo-stable, Acme-scrubbed)
| File | Use-case |
|---|---|
| `sr2-reorder.json` | sr2-reorder — Magnolia reorder flow |
| `sr11-invoice.json` | sr11-invoice — INV-3382 for Magnolia |
| `sr14-brief.json` | sr14-brief — meeting action items |
| `sr20-outreach.json` | sr20-outreach — dormant outreach |
| `ad1-approval.json` + `-text-only`, `-approved`, `-flagged` | ad1-approval |
| `ad3-handoff.json` + `-text-only` | ad3-handoff |
| `ad17-report.json` + `-text-only` | ad17-report |
| `ad29-workflow.json` + `-test`, `-text-only` | ad29-workflow |

### Use-case fixtures (uc1/uc2/uc3 — fully Magnolia-flavored now)
- `uc1-customer-intel.json` (+ `-table-variant`, `-text-only`) — Magnolia 360 (C-8001, Jennifer Holloway)
- `uc2-order-creation.json`, `uc2-task-creation.json` (+ `-brief`, `-invoice`, `-magnolia`, `-confirmed`, `-text-only`)
- `uc3-multi-intent.json` (+ `-text-only`) — Magnolia revenue + follow-up task

> **Note:** `uc2-task-creation-acme.json` was renamed to `uc2-task-creation-magnolia.json`; the `uc2-acme` simulator key became `uc2-magnolia` (useStreamSimulator.ts).

### Email fixtures (all Magnolia-flavored)
`email-draft.json`, `email-customer-notify.json` (+ `-casual`), `email-handoff.json` (+ `-casual`), `email-report-summary.json`, `email-shorter.json`

### My Artifacts fixtures
- `artifacts-preseeded.json` — 3 Audrey-flavored seed artifacts with embedded `data` (Magnolia 12-month revenue, Featured Collections sell-through, Top 8 Customers table). All carry the live-render `data` payload so [ViewArtifactView.tsx](src/components/views/ViewArtifactView.tsx) can re-render them at full size.

### Other
- `action-chips-map.json` — chip definitions (see §3)
- `proactive-brief-*.json` (crm, customers, general, orders, products) — per-page briefs (see §4) — ✅ all Audrey-flavored
- `personas.json`, `agent-store-catalog.json`, `command-palette-items.json`, `dashboard-agents.json`, `docs-qa-pairs.json`, `history-items.json`
- `wizorder-*.json` (crm, customers, orders, products) — page data snapshots

---

## 2. Query Router — [src/lib/queryMatcher.ts](src/lib/queryMatcher.ts)

Exports six pure functions called from ChatShell's send pipeline. Routing order: **page-context → dashboard → special → chip-spawn → capability → email pre-router → SKU-lookup guard → LLM classifier → general (`matchQuery`) → unknown**.

| Export | Purpose |
|---|---|
| `matchDashboardQuery(message)` | Static `DASHBOARD_ROUTES` array (sales perf, order analytics) |
| `matchPageContextQuery(page, message)` | Looks up `PAGE_FIXTURES[page]`, iterates `pageQueries[].keywords` |
| `matchSpecialQuery(message)` | Static `SPECIAL_ROUTES` — now 11 entries: 6 operational queries + 3 customer-by-SKU + order-status clarify + order history + meeting prep |
| `matchSpecialCapabilityQuery(message)` | Static `CAPABILITY_ROUTES` for sr-/ad-/cap1-6/report-* caps |
| `matchQuery(message)` | General classifier → `uc1`/`uc2`/`uc3`/`unknown` (Magnolia-anchored) |
| `getUnknownReply(message)` | Fallback copy |

`ad29-workflow` routing intentionally lives in ChatShell's `handleSend` so it can branch on whether a workflow was named.

### SPECIAL_ROUTES (current order, first-match-wins)
1. **inventory-status** (must come before catalog-health so `inventory status` wins)
2. **orders-recent-status**
3. **leads-status**
4. **open-orders**
5. **customers-by-SKU** — bird pot feet, cement bird feeder, blooming porch (3 fixtures)
6. **order-status-clarification** — emits `frameType: 'clarification'`, handled by `OrderStatusClarificationTurnRenderer`
7. **order-history** (Magnolia-scoped)
8. **meeting-prep** (Magnolia 10am)

### CAPABILITY_ROUTES (current set)
- sr2-reorder, sr11-invoice, sr14-brief, sr20-outreach
- ad1-approval, ad3-handoff, ad17-report
- **Audrey vDemo:** cap1-email-draft (chip), cap1-task-email, cap2-lead-creation, cap3-lead-won, cap4-merge-customer, cap5-user-creation, cap6-catalog-builder
- **Cap 7 reports:** report-collection-performance, report-prebook-pacing, report-customer-health, report-pipeline, report-team-performance, report-catalog-health

### General matcher (matchQuery)
- `uc3` if message contains `magnolia` AND any of `revenue`/`follow`/`task` (and is NOT email/draft)
- `uc2` if message contains `create` AND `task`
- `uc1` (Magnolia 360) if message contains `magnolia` OR a `how's`/`hows`/`doing`/`tell me about` phrase combined with customer/account/client/C-8001..C-8008/known customer name
- otherwise `unknown`

### SKU-lookup guard (in ChatShell pre-LLM)
If query shape looks like an SKU lookup (`purchased`, `who bought`, `customers who bought|order`) but no hero-SKU keyword is present → short-circuits to `unknown` so the user gets a helpful "I don't have that SKU yet" reply instead of an unrelated Magnolia 360.

### Status
- ✅ All Audrey capability routes wired
- ✅ All 6 operational-query routes wired
- ✅ Acme keywords fully removed; `uc2-acme` simulator key renamed to `uc2-magnolia`
- ✅ Page-context fixtures still keyword-matched as fallback

---

## 3. Action Chips — [src/fixtures/action-chips-map.json](src/fixtures/action-chips-map.json)

Pure JSON keyed by:
- `capabilityChips: Record<capabilityId, ActionChip[]>` (sr-1, sr-2, sr-11, sr-13, sr-14, sr-20, ad-1, ad-3, ad-17, ad-29, email, cap1–6, report-*)
- `pageChips: Record<WizOrderPageName, ActionChip[]>` consumed by PageContext

Chip shape:
```ts
{ label: string; query: string; icon: string; category: 'suggested' | 'page-action' | 'follow-on' }
```
Query strings may contain `{templateVar}` placeholders (e.g. `{customerName}`, `{fromRep}`) resolved at send time. Icons available: edit, copy, task, email, orders, brief, plus, tag, compare, check, search, save, test (SVGs in `ActionChip.tsx`).

### Status
- ✅ Audrey vDemo chip templates wired (`clearance_email`, `collection_refill`, `july_pacing`, `prebook_orders`, `dormant_outreach`, `overdue_tasks`)
- ✅ Cap-to-cap chain chips wired (Cap 3 → Cap 5 + Cap 6; Cap 5 → Cap 6)
- ✅ Acme defaults swept from `{customerName}` placeholders
- ✅ Per-page `pageChips` refreshed to match Audrey starter prompts

---

## 4. Page Context Provider — [src/contexts/PageContext.tsx](src/contexts/PageContext.tsx)

**Exports:** `PageContextProvider` component + `usePageContext()` hook returning `PageContextValue`.

**Per-page wiring:**
- `BRIEF_MAP` — imports the 5 `proactive-brief-*.json` files (✅ Audrey-flavored)
- `STARTER_MAP` — hardcoded array of 4 starter prompts per page (✅ Audrey-flavored)
- `PAGE_CHIPS` — from `action-chips-map.json#pageChips` (✅ refreshed)

`PageContextValue` shape:
```ts
{
  currentPage: WizOrderPageName | null;
  pageData: Record<string, unknown>;
  pageActions: ActionChip[];
  starterPrompts: string[];
  proactiveBrief: ProactiveBrief;  // { briefType, greeting, urgentItems[], todaysSummary[] }
  setPage(page, data?); clearPage();
}
```

### Status
- ✅ All 20 starter prompts (4 × 5 pages) reference Audrey SKUs/collections/customers
- ✅ All 5 proactive briefs surface PhaseOut urgency, July 2026 pacing, overdue Audrey tasks
- ✅ Briefs greet Beth (Sales Ops persona) on Dashboard, name real Audrey accounts on Customers/CRM/Orders

---

## 5. Shared Contexts — `src/contexts/shared/`

| Context | File | Methods | Data source |
|---|---|---|---|
| **SharedCRMContext** | [SharedCRMContext.tsx](src/contexts/shared/SharedCRMContext.tsx) | ✅ `addTask`, `addLead`, `updateLeadStage`, `archiveLead` | ✅ `AUDREY_TASKS` / `AUDREY_LEADS` / `AUDREY_DEALS` |
| **SharedOrdersContext** | [SharedOrdersContext.tsx](src/contexts/shared/SharedOrdersContext.tsx) | ✅ `addOrder` | ✅ `AUDREY_ORDERS` (35 orders, with Pre-Book ship windows) |
| **SharedCustomersContext** | [SharedCustomersContext.tsx](src/contexts/shared/SharedCustomersContext.tsx) | ✅ `addCustomer` | ✅ `AUDREY_CUSTOMERS` (8 customers, including C-8006 Warning, C-8008 Dormant) |

### Cap-to-context wiring
- Cap 2 (Pine & Thistle) → `addLead()`
- Cap 3 (Verdant Home) → `updateLeadStage('Won')` + `archiveLead()` + `addCustomer()`
- Cap 4 (Garden Gate) → `archiveLead()` (merge target)
- All Kai-created entities show with the `KaiBadge` (✦) at the top of their respective listing pages.

---

## 6. System Prompt Assembly — `/api/kai/generate`

**Route entry:** [src/app/api/kai/generate/route.ts](src/app/api/kai/generate/route.ts) — delegates to `buildSystemPrompt(capability, args)`.

**Assembly module:** [src/lib/systemPrompts.ts](src/lib/systemPrompts.ts) — one function per touchpoint (T1–T10). All use the same `assemble()` helper which filters falsy parts and joins on `\n\n`.

**Current order** (example T1):
```
personaLine(persona)
customInstructionsSection(...)
pageContextSection(pageContext)
audreyContextBlock()                  // ✅ wired in all touchpoints
capability                            // inline string per touchpoint
widgetDataSection(widgetData)
financialGuard(includeFinancial)
```

The Audrey block names current key collections (A Blooming Porch, Gardeners Grove, The Herb Garden, Bunnies), the July 2026 Virtual Release, and the rep-care priorities (case quantity, MOQ, ship windows, PhaseOut clearance, retail/MSRP price references).

### Status
- ✅ `audreyContextBlock()` helper added and injected in all T1–T10 touchpoints
- ✅ No changes to route handler or token budgets needed

---

## 7. Component Registry — [src/components/engine/ComponentRegistry.ts](src/components/engine/ComponentRegistry.ts)

Static map `ComponentRegistry: Record<string, WidgetComponent>`. `resolveWidget(widgetType)` returns the component or a cached fallback error card.

**Registered widget codes:**
- UI: `UW-001` MetricCard, `UW-002` MetricCardRow, `UW-003` EntityDetailCard, `UW-004` DataTable, `UW-007` Customer360Card, `UW-009` ProductCardGrid, `UW-011` CompactList, `UW-014` AgentReasoningCard, `UW-030` DashboardCompositeWidget
- Charts: `CH-001` LineChart
- Actions: `AW-001` DeepLinkButton, `AW-003` ConfirmationDialog, `AW-004` MultiStepFormWizard, `AW-006` ClarificationCard, `AW-012` ConsentBanner

### Status
- ✅ All widgets needed by Caps 1–7 and the 6 operational queries are registered.
- ✅ `UW-011` CompactList carries a discriminated union (`kind?: 'task' | 'activity'`) — task-shape fixtures unchanged; activity-mode opt-in via `kind: 'activity'`.
- ✅ `DataTable` outer card uses `maxWidth: 100%` so horizontal scroll works inside Kai response bubbles and dashboard grid cells (`width: max-content` on the inner `<table>` triggers the scrollbar when content exceeds the cell).

---

## 8. Chrome / Sidebar / Top Bar — [src/components/layout/](src/components/layout/)

Recent UI overhaul (Section 9 of CHANGELOG-style — full diff in [../UI_Overhaul.md](../UI_Overhaul.md)):

| File | What changed |
|---|---|
| [UnifiedSidebar.tsx](src/components/layout/UnifiedSidebar.tsx) | Converted from 220px sectioned sidebar to **56px icon rail**. Inline Tabler glyphs for Dashboard/Products/Orders/Customers/CRM/Logout + `✦` for Kai. Recursive flyout menu rendered via `createPortal` to escape stacking contexts. Outside-click handler collapses the rail when expanded. Kai submenu rows are label-only (no icons). |
| [LayoutShell.tsx](src/components/layout/LayoutShell.tsx) | Top bar: breadcrumb (Dashboard / Leaf), Ask Kai pill (`#096645` background), notification bell with outside-click popover, HB avatar (32px circle, blue). ⌘K / `AiModeToggle` / `CommandPalette` removed. |
| [MainContent.tsx](src/components/layout/MainContent.tsx) | `<main>` capped at `h-screen overflow-hidden`; inner wrapper `overflow-y-auto` so page content scrolls without breaking sticky chrome. Registers new `view-artifact` route. |
| `tokens.css` + `globals.css` | Local Satoshi `@font-face` declarations; legacy v2 token bridge keeps old `--surface`/`--text`/`--primary-80` working with the new Audrey palette. |

---

## 9. My Artifacts — single-artifact viewer + live thumbnails

| File | Purpose |
|---|---|
| [src/contexts/ArtifactContext.tsx](src/contexts/ArtifactContext.tsx) | Holds `artifacts[]` + `activeArtifactId`. Normalizes legacy (string `sourceWidget`) and new (object with embedded `data`) shapes so live re-render works. |
| [src/components/views/MyArtifactsView.tsx](src/components/views/MyArtifactsView.tsx) | Two sections: Charts & Reports + Dashboards. Each card renders a **live mini version** of the actual widget via `resolveWidget` at `scale(0.42)` for charts/tables and `scale(0.28)` for dashboards, clipped to a 160px window with a soft bottom fade. Fallback to legacy SVG placeholders when no `data` is present. |
| [src/components/views/ViewArtifactView.tsx](src/components/views/ViewArtifactView.tsx) | Single-artifact viewer route (`view-artifact`). Renders the saved widget at full size + **Save** dropdown (Save as PNG via `html2canvas` dynamic import; Save as CSV from `series`/`rows`/`cards`) + **Back** to My Artifacts. |
| [src/components/modals/SaveArtifactModal.tsx](src/components/modals/SaveArtifactModal.tsx) | Title + description prompt before save. Persists `sourceWidget: { widgetType, data, config }` so the viewer can re-render the exact same widget. |

### Status
- ✅ Live thumbnails for both Charts & Reports and Dashboards
- ✅ PNG export (html2canvas, 2× scale)
- ✅ CSV export (handles `series` arrays, `rows`/`columns` tables, `cards` metric rows)
- ✅ Back navigation + clean route registration

---

## 10. Product Card Redesign — [src/components/wizorder/ProductsPage.tsx](src/components/wizorder/ProductsPage.tsx)

All product cards now use the WizShop reference design:
- `border-radius: 1.3rem`, white background, subtle border
- Square image (`aspect-ratio: 1/1`, `object-fit: cover`)
- Heart button (top-right, toggles red fill)
- Featured / New Launch ribbon (top-left, only for `is_hero: true` SKUs)
- View similar chip (bottom-right of image, tabler-cards icon)
- Available row — centered, `rgb(247,248,250)` background, shows real `available_qty`
- 2-line name clamp, monospace SKU, 14px price, full-width green Add to cart button (`#096645`)

---

## 11. Orders Page Redesign — [src/components/wizorder/OrdersPage.tsx](src/components/wizorder/OrdersPage.tsx)

Reference-layout match:
- Alternating header colors `#F2F6E8` / `#EBF3EF`
- Alternating row colors `#FFFFFF` / `#F2F4F7`
- Status colored-dot cells + green Type pill (`Order`)
- Footer: Total Orders pill (tabler-file-text) on the left; Total Value pill (tabler-currency-dollar) + pagination on the right
- Both stat pills wrapped in `rgb(242,244,247)` rounded background

---

## Reading order for a new contributor

1. [Progress_Kai_Demo.md](Progress_Kai_Demo.md) §1–4 (status overlay + architecture notes)
2. This file (codebase map)
3. [../Kai Demo Script.md](../Kai%20Demo%20Script.md) (every demo-stable prompt + expected output, with live keyword variants)
4. [../UI_Overhaul.md](../UI_Overhaul.md) (the chrome/product/orders visual changes)
5. [Kai_vDemo_Claude_Code_Workflow.md](Kai_vDemo_Claude_Code_Workflow.md) (legacy step-by-step playbook — most steps complete)

## Quick-fire status check

```bash
# All fixtures present
ls src/fixtures/cap*.json src/fixtures/report-*.json src/fixtures/special-*.json | wc -l
# Expect 34+ files

# No Acme contamination anywhere
grep -rin "acme\|c-4201\|rachel martinez" src   # → no matches

# Typecheck clean
npx tsc --noEmit

# Live keyword variants enumerated
open "Kai Demo Script.md"
```

**Demo readiness:** ✅ All 7 Caps, all 6 reports, all 6 operational queries, customer 360, special routes, page context, chip chains, voice/TTS, and My Artifacts (with live thumbnails + PNG/CSV export) are demo-stable. Data is fully Audrey-anchored.
