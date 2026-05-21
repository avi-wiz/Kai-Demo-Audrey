# CLAUDE.md

Behavioral guidelines to reduce common LLM coding mistakes. Merge with project-specific instructions as needed.

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

---

**These guidelines are working if:** fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.

# Kai vDemo

## What This Is

A controlled demo of Kai for the CEO of Audrey's Home & Gift (wholesale home decor/gift brand). Built on top of Kai v2. Every fixture, widget, brief, and chip references **real Audrey SKUs and collection names**. The Acme-era data has been fully scrubbed — the CEO will never see "Acme Corp" or placeholder content anywhere.

**Status:** ✅ Demo-ready. All 7 Caps, all 6 reports, all 6 operational queries, customer 360, special routes, page context, chip chains, voice/TTS, and My Artifacts (with live thumbnails + PNG/CSV export) are wired and demo-stable.

**Branch:** `ui-overhaul` (current working branch; merge target `main`)
**Base:** Kai v2.2 (all v2 blocks complete)

## Tech Stack

* Next.js 14 (App Router) + TypeScript + Tailwind CSS
* Recharts for charts; html2canvas for artifact PNG export
* Web Speech API for voice STT; ElevenLabs for TTS
* Anthropic Messages API (Claude Sonnet 4.6) for streamed closing-text generation

## Rules

1. Always run after completing work: `npx tsc --noEmit`
2. **Every product reference must be a real SKU** from `src/data/audreys/products.json`. Use `bySku()` to validate. Never invent SKUs.
3. **Every customer/lead/rep reference must come from the synthetic data** in `src/data/audreys/synthetic/`. Never use "Acme Corp", "John Smith", or generic placeholders.
4. **Fixture JSON must match the Frame JSON contract** exactly as FrameParser expects it. When creating a new fixture, read an existing working fixture first and match its structure.
5. **Hero vs Background rule:** If a product is named in pixels or prose, it must be a hero (`is_hero: true`). Background products are for grid filler and chart denominators only.
6. **Price display:** Use `getDisplayPrice()` from `src/data/audreys/pricing.ts`. Currently MSRP-only. Never show wholesale or margin.
7. **Image fallback chain:**

```ts
const img =
  product.image_urls_by_size?.large?.[0] ??
  product.image_urls_by_size?.original?.[0] ??
  product.image_urls[0];
```

## Architecture

* **Rendering Engine:** Frame JSON → FrameParser → ComponentRegistry → CompositionEngine → Widgets
* **Text Generation:** Two-pass. Widgets render from fixtures (instant). LLM text streams into CanvasTextBlock (parallel).
* **Page Context:** 5 WizOrder pages inject context into Kai's system prompt, starters, briefs, page actions.
* **Action Chips:** Contextual pills below every response. Click auto-sends `chip.query` → pipeline → new response. Max chain depth: 3.
* **Shared State:** SharedContexts bridge Kai-created entities to WizOrder listing pages.
* **LLM System Prompt Order:** persona → custom instructions → page context → Audrey context block → capability prompt → widget data
* **Query Routing Order** (first-match-wins, in ChatShell `handleSend`):
  Page Context → Dashboard Routes → Special Routes → Chip Spawns → Capability Routes → Email Pre-router → SKU-lookup guard → LLM classifier → general `matchQuery` → unknown

## Data Architecture

### Real Product Data

```
src/data/audreys/
  products.json          — 50 curated SKUs (the full demo catalog)
  heroes.json            — 18 hero SKUs (scripted moments, named in prose)
  collections.json       — 17 named collections
  types.ts               — AudreyProduct, AudreyCollection, ProductBucket
  accessors.ts           — PRODUCTS, HEROES, COLLECTIONS, byBucket, bySku, byCollection
  pricing.ts             — getDisplayPrice() (MSRP-only)
  index.ts               — barrel re-export
```

### Synthetic CRM Data

```
src/data/audreys/synthetic/
  customers.ts           — 8 converted customers (+ C-8050 inactive merge target)
  leads.ts               — 6 leads at various pipeline stages
  sales-reps.ts          — 4 reps (Beth is real from API, others synthetic)
  orders.ts              — 35 orders referencing real hero SKUs
  tasks.ts               — 12 tasks (4 overdue)
  deals.ts               — 8 deals across pipeline stages
  users.ts               — 5 WizShop website users
  wishlists.ts           — 3 wishlists with real SKUs
  sales-history.ts       — monthly revenue traces by bucket
  index.ts               — barrel re-export
```

### Seven Product Buckets

| Bucket | Count | Heroes | Narrative |
|---|---|---|---|
| `featured_collections` | 17 | 3 | A Blooming Porch / Gardeners Grove / Herb Garden — spring strength |
| `sale_clearance` | 15 | 2 | PhaseOut — clearance urgency |
| `garden_outdoor` | 8 | 4 | Year-round evergreens |
| `july_release` | 6 | 5 | July 2026 Virtual Release — pre-book pacing |
| `atlanta_top_sellers` | 2 | 2 | Atlanta market winners |
| `spring_summer` | 1 | 1 | Immediate-ship refill |
| `fall_holdovers` | 1 | 1 | Fall remnant — mention once |

### Key Entities

**Customers:** C-8001 Magnolia Home & Garden (top account, $186K YTD, Beth's rep), C-8002 The Potting Shed, C-8003 Bloom & Basket, C-8004 Seaside Gifts, C-8005 Copper Creek Trading, C-8006 Harbor Lane Boutique (Warning — 52 days), C-8007 Sunflower & Sage, C-8008 Golden Meadow Co (Dormant — 90 days)

**Leads:** L-9001 Wildflower Market (Cap 1), L-9002 Rustic Charm Boutique (no outreach yet — Q3 follow-up), L-9003 Verdant Home Collective (Cap 3), L-9004 The Garden Gate Shop (Cap 4), L-9005 Lakeside Living Co (Cap 5), L-9006 Mountain Bloom Studio (Cap 6). New lead created at runtime: Pine & Thistle (Cap 2).

**Reps:** R-001 Beth Calloway (Southeast, $186K), R-002 Marcus Rivera (Mid-South, $124K), R-003 Hannah Cho (Mountain/West, $89K), R-004 James Whitfield (Northeast, $42K)

**Demo persona / user:** Heman Bhullar (Sales Ops). Appears in the top bar avatar (HB initials) and as email signature when Kai drafts outgoing messages.

## Design System

Light mode. Source of truth: `widget_system.md` + the `:root` token bridge in `globals.css`.

* **Fonts:** Satoshi (400/500/700) for sans; JetBrains Mono for IDs/SKUs/prices
* **Surfaces:** `--surface` #FFFFFF, `--surface2` #f0f2f5; `--bg` #F7F8F8
* **Borders:** `--border` #DBE6F5, `--border2` #BECADC
* **Text:** `--text` #2E3643, `--text2` #586476, `--text3` #8895A9
* **Primary:** `--primary-80` #16885F (also used as `#096645` for Ask Kai pill + Add-to-cart CTAs), `--primary-70` #28AA7B
* **AI accent:** rgba(91, 106, 240, X) for reasoning, highlights
* **Stock badges:** In Stock (green), Pre-Book (blue), Limited Quantity (amber), PhaseOut (red)
* **Risk badges:** Active (green), Warning (amber), Dormant/At Risk (red)

## The Widget Contract

Every widget: `{ data: SpecificDataInterface, config?: any, highlights?: WidgetHighlight[] }`. FrameParser passes these through directly — no transformation. Highlight types: `urgent` (red), `warning` (amber), `positive` (green), `info` (blue).

## Registered Widgets

UW-014 AgentReasoningCard, UW-007 Customer360Card, UW-003 EntityDetailCard, UW-002 MetricCardRow, UW-011 CompactList, UW-004 DataTable, UW-009 ProductCardGrid, UW-030 DashboardCompositeWidget, CH-001 LineChart, AW-001 DeepLinkButton, AW-003 ConfirmationDialog, AW-004 MultiStepFormWizard, AW-006 ClarificationCard, AW-012 ConsentBanner. Sub-components (NOT registered): UW-001 MetricCard, AW-005 FormField.

## The 7 Demo Capabilities (✅ all wired)

### Cap 1 — Task + Email via Voice (Lead: L-9001 Wildflower Market)

Fixtures: `cap1-task-email-voice.json`, `cap1-task-confirmed.json`, `cap1-email-draft.json`. Chain: confirm task → "Draft the email now" chip → email fixture. Keywords: `wildflower`, `birdhouse`, `samples`, `create task`. Email-chain keywords: `draft the email for wildflower`, `draft the email now`, `rewrite the email`.

### Cap 2 — Lead Creation + Auto Task (Pine & Thistle)

Fixtures: `cap2-lead-creation.json`, `cap2-auto-task-followup.json`. Confirm lead → auto-task renders below. Keywords: `add lead`, `new lead`, `pine and thistle`. Shared state: `SharedCRMContext.addLead()` + `addTask()`.

### Cap 3 — Lead → Customer Conversion (L-9003 Verdant Home)

Fixtures: `cap3-lead-stage-won.json`, `cap3-conversion-confirmed.json`. Confirm chips link to Cap 5 + Cap 6. Keywords: `move to won`, `convert lead`, `verdant home`. Shared state: `addCustomer()` + `archiveLead()` + `updateLeadStage()`.

### Cap 4 — Merge Customer Records (L-9004 Garden Gate)

Fixtures: `cap4-merge-customer.json`, `cap4-merge-confirmed.json`. Two side-by-side UW-003 cards (Garden Gate vs C-8050 legacy) + checkbox merge wizard. Keywords: `merge`, `combine records`, `garden gate`. Shared state: `archiveLead()`.

### Cap 5 — Website User Creation (L-9005 Lakeside Living)

Fixtures: `cap5-user-creation.json`, `cap5-user-confirmed.json`. 3-step wizard with pricelist dropdown. Confirm chip → Cap 6. Keywords: `create user`, `website access`, `wizshop user`, `lakeside`.

### Cap 6 — Catalog Builder (L-9006 Mountain Bloom)

Fixtures: `cap6-catalog-creation.json`, `cap6-catalog-confirmed.json`. Product grid (UW-009) + catalog config wizard. Keywords: `build catalog`, `curated catalog`, `mountain bloom`.

### Cap 7 — 6 Reports (UW-030 dashboards)

Fixtures: `report-collection-performance.json`, `report-prebook-pacing.json`, `report-customer-health.json`, `report-pipeline.json`, `report-team-performance.json`, `report-catalog-health.json`. Each is keyword-routed and re-routes through the V2 dashboard-builder pipeline so the Edit / Save / Download flow lights up.

> Note: `inventory status` keyword was moved off `report-catalog-health` onto its own simple-table fixture (see Operational Queries below). Catalog Health is still reachable via `catalog health` / `catalog report` / `stock levels`.

## Operational Queries (✅ all wired — new)

Six demo-stable queries every sales leader naturally types. All deterministic, no LLM in the routing path.

| # | Query | Fixture |
|---|---|---|
| 1 | "What is my inventory status?" | `special-inventory-status.json` — 1×4 SKU count table (Total/In-Stock/Back-order/In-Transit) |
| 2 | "What is the status of my orders?" | `special-orders-recent-status.json` — 5 status tiles + 15-row recent table |
| 3 | "What is the status of my leads?" | `special-leads-status.json` — 3 stage tiles + 6-row leads table |
| 4a | "Customers who purchased Bird Pot Feet last 15 days" | `special-customers-by-sku-bird-pot-feet.json` |
| 4b | "Customers who purchased Cement Bird Feeder…" | `special-customers-by-sku-cement-bird-feeder.json` |
| 4c | "Customers who purchased A Blooming Porch…" | `special-customers-by-sku-blooming-porch.json` |
| 5 | "What is the current status of the order" | `special-order-status-clarify.json` (AW-006 picker) → `special-order-status-{orderId}.json` (5 per-order fixtures: O-50001/7/13/27/34) |
| 6 | "List of open orders" | `special-open-orders.json` — 4 status tiles + 15-row filtered table |

**SKU-lookup guard** (ChatShell): if a query has the SKU-lookup shape (`purchased` / `who bought` / `customers who bought|order`) but no hero-SKU keyword, short-circuits to `unknown` so unknown SKUs don't misroute to Magnolia 360.

**Order-status clarification flow:** new turn kind `order-status-clarification` (mirrors `metric-clarification`). The AW-006 picker's confirm callback dynamically imports `special-order-status-{orderId}.json` and spawns a follow-up `page-context` turn with the UW-003 detail + plain-English status.

## 5 Page Reskins (✅ done)

Each page sources data from `src/data/audreys/` and has a rewritten proactive brief + 4 starter prompts.

| Page | Data Source | Brief Theme |
|---|---|---|
| Dashboard | Aggregate metrics from ORDERS, PRODUCTS | PhaseOut urgency + July release pacing + tasks due |
| Products | All 50 products (heroes first), filter by collection | Featured Collections sell-through + refill threshold |
| Orders | 35 synthetic orders with real SKUs | Featured Collections orders + Pre-Book confirmations |
| Customers | 8 customers + 6 leads (tabbed) | Dormant account re-engagement (45+ days) |
| CRM | Tasks (12), Leads (6), Deals (8) in tabs | Overdue tasks + Pick Of The Patch pre-book mentions |

## UI Overhaul (✅ done — see `UI_Overhaul.md` for the full diff)

* **Two-rail sidebar** (`UnifiedSidebar.tsx`): 56px icon rail with inline Tabler glyphs + recursive flyout menu rendered via `createPortal`. Active state: `rgb(9, 102, 69)` background pill, white glyph. Hover label pill positioned with `getBoundingClientRect()` so it escapes ancestor overflow.
* **Top bar** (`LayoutShell.tsx`): breadcrumb (Dashboard / Leaf), Ask Kai pill (`#096645`), notification bell with outside-click popover, HB avatar. ⌘K / AiModeToggle removed; AI mode is default-on.
* **Scrolling:** `<main>` is `h-screen overflow-hidden`; inner wrapper `overflow-y-auto`. DataTable card uses `maxWidth: 100%` so wide tables scroll horizontally inside Kai bubbles + dashboard cells.
* **Product cards** (`ProductsPage.tsx`): 1.3rem radius, square images, Featured / New Launch ribbon for `is_hero`, View similar chip, centered Available row, `#096645` Add to Cart.
* **Orders page** (`OrdersPage.tsx`): alternating header `#F2F6E8`/`#EBF3EF` + row `#FFFFFF`/`#F2F4F7`, colored-dot status cells, green Type pill, tabler footer icons + pagination on the right.

## My Artifacts (✅ done)

* **MyArtifactsView.tsx** — Charts & Reports section + Dashboards section. Each card renders the actual widget at `scale(0.42)` (charts/tables) or `scale(0.28)` (dashboards) clipped to a 160px window with soft bottom fade. Fallback to legacy SVG placeholders when no `data` payload.
* **ViewArtifactView.tsx** — full-size single-artifact viewer at route `view-artifact`. Back button + Save dropdown: Save as PNG (html2canvas, 2× scale) and Save as CSV (handles `series`, `rows`/`columns`, `cards`).
* **artifacts-preseeded.json** — 3 Audrey-flavored seed artifacts (Magnolia 12-month revenue, Featured Collections sell-through, Top 8 Customers table) with embedded `data`.

## Shared Context Mutations (✅ all wired)

| Context | Method | Used By |
|---|---|---|
| SharedCRMContext | `addTask()` | Cap 1, Cap 2 |
| SharedCRMContext | `addLead()` | Cap 2 |
| SharedCRMContext | `updateLeadStage()` | Cap 3 |
| SharedCRMContext | `archiveLead()` | Cap 3, Cap 4 |
| SharedCustomersContext | `addCustomer()` | Cap 3 |
| SharedOrdersContext | `addOrder()` | uc2-order |

Kai-created entities appear at the top of their listing pages with the `KaiBadge` (✦).

## LLM System Prompt — Audrey Context Block (✅ injected in all T1–T10)

```
You are an AI sales assistant for Audrey's Home & Gift, a wholesale home decor
and gift brand. Audrey's catalog is organized into Pre-Book pre-orders, Seasonal
ranges, and Home & Garden evergreen lines. Current key collections: A Blooming
Porch, Gardeners Grove, The Herb Garden, Bunnies. Next major launch: July 2026
Virtual Release.

When mentioning products, use actual SKUs and names from the catalog.
Audrey reps care about: case quantity, minimum order qty, pre-book ship
windows (Sep/Oct/Dec), PhaseOut clearance. Price references use retail/MSRP.
```

## Action Chip Templates (✅ wired)

* `clearance_email` — Draft clearance email for PhaseOut SKUs
* `collection_refill` — Build refill list for Gardeners Grove
* `july_pacing` — Show July 2026 pacing report
* `prebook_orders` — Show Pre-Book orders
* `dormant_outreach` — Draft outreach for dormant accounts (C-8006, C-8008)
* `overdue_tasks` — Show overdue CRM tasks

Plus cap-to-cap chain chips: Cap 3 → Cap 5 + Cap 6; Cap 5 → Cap 6.

## V2 Features — DO NOT MODIFY

* Agent Store (all views, cart, payment, checkout)
* Docs view (upload, QA)
* History view
* Voice (STT + TTS) — mechanism unchanged
* Follow-ups (widget swap, form re-staging)
* Text-only mode
* Onboarding (3-step), Guided Tour (6-step)
* Personas (Professional, Friendly, Concise)
* Custom instructions

> Removed in the UI overhaul: ⌘K Command Palette, AiModeToggle (AI mode is default-on now), Demo/AI mode toggle (Cmd+Shift+D), expanded sidebar with section labels.

## Contexts

* **LayoutContext** — current view, navigation. Routes added: `view-artifact` (single artifact viewer).
* **PageContext** — current WizOrder page, page data, page actions, starters, brief — Audrey-flavored.
* **ArtifactContext** — saved artifacts. Carries `activeArtifactId` for the viewer route. Normalizes legacy (string `sourceWidget`) and new (object with embedded `data`) shapes.
* **PersonaContext** — selected personality + voice.
* **ResponseModeContext** — text-widget (default) vs text-only.
* **ConversationContext** — chat history, stale marking, follow-up tracking.
* **SharedOrdersContext** — Kai-created orders appear in Orders list (source: `AUDREY_ORDERS`).
* **SharedCustomersContext** — Kai-created customers appear in Customers list (source: `AUDREY_CUSTOMERS`).
* **SharedCRMContext** — Kai-created tasks/leads appear in CRM (source: `AUDREY_TASKS` / `AUDREY_LEADS` / `AUDREY_DEALS`).
* **SharedCartsContext, SharedQuotesContext, SharedClaimsContext** — unchanged.
* **DashboardBuilderContext** — active dashboard data for full-view editing.
* **OnboardingContext, GuidedTourContext, NudgeContext** — unchanged.
* **UserPreferencesContext** — all preferences + customInstructions.

## Demo Script (22 minutes — see `Kai Demo Script.md` for full prompt library + every keyword variant)

1. **Morning Brief** (2 min) — Beth's brief surfaces PhaseOut, July pacing, overdue tasks
2. **Cap 1: Voice → Task → Email** (3 min) — Wildflower Market + Birdhouse samples
3. **Cap 2: Lead Creation** (2 min) — Pine & Thistle + auto-task
4. **Cap 3: Lead → Customer** (3 min) — Verdant Home → Won → conversion form
5. **Cap 4: Merge** (2 min) — Garden Gate side-by-side
6. **Cap 5: Website User** (2 min) — Lakeside Living + pricelist
7. **Cap 6: Catalog Builder** (2 min) — Mountain Bloom + product grid
8. **Cap 7: Reports** (3 min) — collection performance, pipeline, team performance
9. **Operational Queries** (1 min) — `What is my inventory status?` → `List of open orders` → `Customers who purchased Bird Pot Feet last 15 days`
10. **Page Intelligence** (1 min) — Products page → click Ask Kai → starter prompt
11. **Close** (1 min) — "That's your data. Kai speaks Audrey's language on day one."

## Quick Verification

```bash
# Typecheck must pass
npx tsc --noEmit

# No Acme contamination anywhere
grep -rin "acme\|c-4201\|rachel martinez" src   # → exit 1 (no matches)

# All fixtures present
ls src/fixtures/cap*.json src/fixtures/report-*.json src/fixtures/special-*.json | wc -l
# → 34+
```

**Demo readiness:** ✅ All 7 Caps, all 6 reports, all 6 operational queries, customer 360, special routes, page context, chip chains, voice/TTS, and My Artifacts viewer are demo-stable. Every entity name comes from real Audrey data.

## Key Reference Docs

* [Kai Demo Script.md](Kai%20Demo%20Script.md) — every demo-stable prompt + expected output + all keyword variants. Hand to anyone running a demo.
* [UI_Overhaul.md](UI_Overhaul.md) — chrome/product/orders visual changes diff.
* [plan_docs/Repo_Overview.md](plan_docs/Repo_Overview.md) — codebase map with current status markers per area.
