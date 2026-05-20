# Kai vDemo

## What This Is

A controlled demo of Kai for the CEO of Audrey's Home & Gift (wholesale home decor/gift brand). Built on top of Kai v2 (all 8 blocks complete, deployed at kaidemov0.vercel.app). Every fixture, widget, brief, and chip references  **real Audrey SKUs and collection names** . The CEO should never see "Acme Corp" or placeholder content anywhere.

**Branch:** `demo/audreys-ceo`
**Base:** `poc-v2.2` (all v2 blocks done)
**Demo scope:** 7 scripted capabilities + 5 page reskins + 6 reports

## Tech Stack

* Next.js 14 (App Router) + TypeScript + Tailwind CSS
* Recharts for charts
* Web Speech API for voice (STT + TTS)
* Anthropic Messages API (Claude Sonnet 4.6) for dynamic text generation
* ElevenLabs for TTS

## Rules

1. Always run after completing work:

```
npx tsc --noEmit 2>&1
```

2. **Every product reference must be a real SKU** from `src/data/audreys/products.json`. Use `bySku()` to validate. Never invent product names or SKUs.
3. **Every customer/lead/rep reference must come from the synthetic data** in `src/data/audreys/synthetic/`. Never use "Acme Corp", "John Smith", or generic placeholders.
4. **Fixture JSON must match the Frame JSON contract** exactly as FrameParser expects it. When creating a new fixture, read an existing working fixture first and match its structure.
5. **Do not modify V2 features** (listed below). Only add new fixtures, data files, page data sources, and routing entries.
6. **Hero vs Background rule:** If a product is named in pixels or prose, it must be a hero (`is_hero: true`). Background products (32 SKUs) are for grid filler, aggregates, and chart denominators only.
7. **Price display:** Use `getDisplayPrice()` from `src/data/audreys/pricing.ts`. Currently MSRP-only (wholesale is gated behind B2B auth). Never show wholesale price or margin calculations.
8. **Image fallback chain** — always use this pattern for product images:

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
* **Action Chips:** Contextual pills below every response. Click auto-sends chip.query → pipeline → new response. Max chain depth: 3.
* **Shared State:** SharedContexts bridge Kai-created entities to WizOrder listing pages.
* **LLM System Prompt Order:** persona → custom instructions → page context → **Audrey context block** → capability prompt → widget data

## Data Architecture

### Real Product Data (from Audrey's API)

```
src/data/audreys/
  products.json          — 50 curated SKUs (the full demo catalog)
  heroes.json            — 18 hero SKUs (scripted moments, named in prose)
  collections.json       — 17 named collections
  types.ts               — AudreyProduct, AudreyCollection, ProductBucket
  accessors.ts           — PRODUCTS, HEROES, COLLECTIONS, byBucket, bySku, byCollection
  pricing.ts             — getDisplayPrice() (MSRP-only for now)
  index.ts               — barrel re-export of everything
```

### Synthetic CRM Data (authored, must feel real)

```
src/data/audreys/synthetic/
  customers.ts           — 8 converted customers (+ C-8050 inactive merge target)
  leads.ts               — 6 leads at various pipeline stages
  sales-reps.ts          — 4 reps (Beth is real from API, others synthetic)
  orders.ts              — 35 orders referencing real hero SKUs
  tasks.ts               — 12 tasks (4 overdue), tied to leads + customers
  deals.ts               — 8 deals across pipeline stages
  users.ts               — 5 WizShop website users
  wishlists.ts           — 3 wishlists with real SKUs
  sales-history.ts       — monthly revenue traces by bucket (for charts)
  index.ts               — barrel re-export
```

### Seven Product Buckets

| Bucket                   | Count | Heroes | Demo Narrative                                                              |
| ------------------------ | ----- | ------ | --------------------------------------------------------------------------- |
| `featured_collections` | 17    | 3      | A Blooming Porch / Gardeners Grove / Herb Garden — spring catalog strength |
| `sale_clearance`       | 15    | 2      | 15 SKUs in PhaseOut — clearance urgency                                    |
| `garden_outdoor`       | 8     | 4      | Year-round evergreens — steady earners                                     |
| `july_release`         | 6     | 5      | July 2026 Virtual Release — pre-book pacing                                |
| `atlanta_top_sellers`  | 2     | 2      | January 2025 Atlanta market winners                                         |
| `spring_summer`        | 1     | 1      | Immediate-ship refill business                                              |
| `fall_holdovers`       | 1     | 1      | Small fall remnant — mention once at most                                  |

### Key Entities (for fixture authoring)

**Customers:** C-8001 Magnolia Home & Garden (biggest), C-8002 The Potting Shed, C-8003 Bloom & Basket, C-8004 Seaside Gifts, C-8005 Copper Creek Trading, C-8006 Harbor Lane Boutique (warning — 52 days), C-8007 Sunflower & Sage, C-8008 Golden Meadow Co (dormant — 90 days)

**Leads:** L-9001 Wildflower Market (Cap 1), L-9002 Rustic Charm Boutique (Cap 2), L-9003 Verdant Home Collective (Cap 3), L-9004 The Garden Gate Shop (Cap 4), L-9005 Lakeside Living Co (Cap 5), L-9006 Mountain Bloom Studio (Cap 6)

**Reps:** R-001 Beth Calloway (Southeast, $186K), R-002 Marcus Rivera (Mid-South, $124K), R-003 Hannah Cho (Mountain/West, $89K), R-004 James Whitfield (Northeast, $42K)

## Design System

Source of truth: widget_system.md (light mode)

* Primary font: Satoshi (400, 600, 700, 800)
* Mono font: JetBrains Mono (SKUs, IDs, timestamps, prices)
* Surface: var(--surface) #FFFFFF, var(--surface2) #f0f2f5
* Background: var(--bg) #F7F8F8
* Borders: var(--border) #DBE6F5, var(--border2) #BECADC
* Text: var(--text) #2E3643, var(--text2) #586476, var(--text3) #8895A9
* Primary: var(--primary-80) #16885F, var(--primary-70) #28AA7B
* AI accent: rgba(91, 106, 240, X) for reasoning, highlights
* Shadows: light mode values (0.06-0.08 opacity)
* Stock badges: In Stock (green), Pre-Book (blue), Limited Quantity (amber), PhaseOut (red)
* Risk badges: Active (green), Warning (amber), Dormant/At Risk (red)

## The Widget Contract

Every widget: `{ data: SpecificDataInterface, config?: any, highlights?: WidgetHighlight[] }`
FrameParser passes `{ data, config, highlights }` from JSON frames directly. No transformation.
Highlight types: `urgent` (red), `warning` (amber), `positive` (green), `info` (blue).

## Registered Widgets

UW-014 AgentReasoningCard, UW-007 Customer360Card, UW-003 EntityDetailCard,
UW-002 MetricCardRow, UW-011 CompactList, UW-004 DataTable,
CH-001 LineChart, AW-001 DeepLinkButton, AW-004 MultiStepFormWizard,
AW-012 ConsentBanner, AW-003 ConfirmationDialog, UW-030 DashboardCompositeWidget
Sub-components (NOT registered): UW-001 MetricCard, AW-005 FormField

## The 7 Demo Capabilities

### Cap 1 — Task + Email via Voice (Lead: L-9001 Wildflower Market)

Fixtures: `cap1-task-email-voice.json`, `cap1-email-draft.json`
Widgets: UW-014 → UW-003 → AW-004 → AW-012 → AW-003, then EmailDraftCard
Chain: confirm task → "Draft the email now" chip → email fixture
Keywords: "create task", "wildflower", "birdhouse", "samples"

### Cap 2 — Lead Creation + Auto Task (New: Pine & Thistle Gift Shop)

Fixtures: `cap2-lead-creation.json`, `cap2-auto-task-followup.json`
Widgets: UW-014 → AW-004 (3-step) → AW-012 → AW-003, then auto UW-003 + AW-012
Chain: confirm lead → auto-task renders below → optional confirm
Keywords: "add lead", "new lead", "create lead", "pine and thistle"
Shared state: SharedCRMContext.addLead() + SharedCRMContext.addTask()

### Cap 3 — Lead → Customer Conversion (Lead: L-9003 Verdant Home)

Fixture: `cap3-lead-stage-won.json`
Widgets: UW-014 → UW-003 (stage transition arrow) → AW-004 (4-step) → AW-012 → AW-003
Chain: confirm → chips include "Set up website access" (→ Cap 5) and "Build a welcome catalog" (→ Cap 6)
Keywords: "move to won", "convert lead", "verdant home"
Shared state: SharedCustomersContext.addCustomer() + SharedCRMContext.archiveLead()

### Cap 4 — Merge Customer Records (Lead: L-9004 Garden Gate Shop)

Fixture: `cap4-merge-customer.json`
Widgets: UW-014 → UW-003 ×2 side-by-side → AW-004 (checkbox merge) → AW-012 → AW-003
Keywords: "merge", "combine records", "duplicate", "garden gate"

### Cap 5 — Website User Creation (Lead: L-9005 Lakeside Living)

Fixture: `cap5-user-creation.json`
Widgets: UW-014 → UW-003 → AW-004 (3-step with pricelist dropdown) → AW-012 → AW-003
Chain: confirm → "Build a catalog for Lakeside Living" chip (→ Cap 6)
Keywords: "create user", "website access", "wizshop user", "lakeside"

### Cap 6 — Catalog Builder (Lead: L-9006 Mountain Bloom Studio)

Fixture: `cap6-catalog-creation.json`
Widgets: UW-014 → UW-003 → product grid (UW-004/UW-009) → AW-004 (catalog config) → AW-012 → AW-003
Keywords: "build catalog", "create wishlist", "curated catalog", "mountain bloom"

### Cap 7 — Reports (6 dashboards using UW-030 DashboardCompositeWidget)

Fixtures: `report-collection-performance.json`, `report-prebook-pacing.json`, `report-customer-health.json`, `report-pipeline.json`, `report-team-performance.json`, `report-catalog-health.json`
Keywords: "collection performance", "pre-book pacing", "july release", "customer health", "pipeline", "team performance", "catalog health", "inventory status"

## 5 Page Reskins

Each page sources data from `src/data/audreys/` and has a rewritten proactive brief + 4 starter prompts.

| Page      | Data Source                                          | Brief Theme                                          |
| --------- | ---------------------------------------------------- | ---------------------------------------------------- |
| Dashboard | Aggregate metrics from ORDERS, PRODUCTS              | PhaseOut urgency + July release pacing + tasks due   |
| Products  | All 50 products (heroes first), filter by collection | Featured Collections sell-through + refill threshold |
| Orders    | 35 synthetic orders with real SKUs                   | Featured Collections orders + Pre-Book confirmations |
| Customers | 8 customers + 6 leads (tabbed)                       | Dormant account re-engagement (45+ days)             |
| CRM       | Tasks (12), Leads (6), Deals (8) in tabs             | Overdue tasks + Pick Of The Patch pre-book mentions  |

## Shared Context Mutations (New for vDemo)

| Context                | Method                        | Used By      |
| ---------------------- | ----------------------------- | ------------ |
| SharedCRMContext       | `addLead()`                 | Cap 2        |
| SharedCRMContext       | `updateLeadStage()`         | Cap 3        |
| SharedCRMContext       | `archiveLead()`             | Cap 3, Cap 4 |
| SharedCRMContext       | `addTask()`(already exists) | Cap 1, Cap 2 |
| SharedCustomersContext | `addCustomer()`             | Cap 3        |

## LLM System Prompt — Audrey Context Block

Injected between page context and capability prompt:

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

## Action Chip Templates (New for vDemo)

Key new chips in chip-map:

* `clearance_email` — "Draft clearance email" → PhaseOut inventory email
* `collection_refill` — "Build refill list" → Gardeners Grove refill outreach
* `july_pacing` — "Show July 2026 pacing" → pre-book pacing report
* `prebook_orders` — "Show Pre-Book orders" → filtered orders view
* `dormant_outreach` — "Draft outreach for dormant accounts" → re-engagement emails
* `overdue_tasks` — "Show overdue tasks" → filtered CRM tasks

## V2 Features — DO NOT MODIFY

* Agent Store (all views, cart, payment, checkout)
* Docs view (upload, QA)
* History view
* Voice (STT + TTS) — mechanism unchanged, content now references Audrey
* Follow-ups (widget swap, form re-staging)
* Text-only mode
* Demo/AI mode toggle (Cmd+Shift+D)
* Onboarding (3-step), Guided Tour (6-step), Command Palette (⌘K)
* Personas (Professional, Friendly, Concise)
* Custom instructions

## Contexts

* LayoutContext: current view, navigation
* PageContext: current WizOrder page, page data, page actions, starters, brief — **briefs rewritten for Audrey**
* ArtifactContext: saved artifacts (includes "Dashboards and Reports" + new "Catalogs" category)
* PersonaContext: selected personality + voice
* ResponseModeContext: text-widget vs text-only
* ConversationContext: chat history, stale marking, follow-up tracking
* SharedOrdersContext: Kai-created orders appear in Orders list
* SharedCustomersContext: Kai-created customers appear in Customers list — **new: addCustomer() for Cap 3**
* SharedCRMContext: Kai-created tasks/leads appear in CRM — **new: addLead(), updateLeadStage(), archiveLead()**
* SharedCartsContext, SharedQuotesContext, SharedClaimsContext: unchanged
* DashboardBuilderContext: active dashboard data for full-view editing
* OnboardingContext, GuidedTourContext, NudgeContext: unchanged
* UserPreferencesContext: all preferences + customInstructions

## Fixture Files (New for vDemo)

```
src/fixtures/
  cap1-task-email-voice.json       — Cap 1: task creation for Wildflower Market
  cap1-email-draft.json            — Cap 1: email chain with Birdhouse SKUs
  cap2-lead-creation.json          — Cap 2: Pine & Thistle lead creation
  cap2-auto-task-followup.json     — Cap 2: auto-generated outreach task
  cap3-lead-stage-won.json         — Cap 3: Verdant Home conversion
  cap4-merge-customer.json         — Cap 4: Garden Gate merge
  cap5-user-creation.json          — Cap 5: Lakeside Living website user
  cap6-catalog-creation.json       — Cap 6: Mountain Bloom catalog builder
  report-collection-performance.json
  report-prebook-pacing.json
  report-customer-health.json
  report-pipeline.json
  report-team-performance.json
  report-catalog-health.json
```

## Demo Script (22 minutes)

1. **Morning Brief** (2 min) — Beth's brief: PhaseOut urgency, July pacing, tasks due
2. **Cap 1: Voice → Task → Email** (3 min) — Wildflower Market + Birdhouse samples
3. **Cap 2: Lead Creation** (2 min) — Pine & Thistle Gift Shop + auto-task
4. **Cap 3: Lead → Customer** (3 min) — Verdant Home Collective → Won → conversion form
5. **Cap 4: Merge** (2 min) — Garden Gate Shop + old record side-by-side
6. **Cap 5: Website User** (2 min) — Lakeside Living + pricelist question
7. **Cap 6: Catalog Builder** (2 min) — Mountain Bloom + garden outdoor grid
8. **Cap 7: Reports** (3 min) — collection performance, pipeline, team performance
9. **Page Intelligence** (2 min) — Products page with real images, CRM with real context
10. **Close** (1 min) — "That's your data. Kai speaks Audrey's language on day one."

## Current Build Status

Phase: vDemo — Audrey's CEO Demo
Base: V2.1 complete (all 8 blocks done)
Target: Full demo-ready build with Audrey data + 7 capabilities + 6 reports
