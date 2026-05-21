# Kai vDemo — Claude Code Build Workflow

**Purpose:** Step-by-step prompting playbook for one developer using Claude Code to execute the entire `Kai_vDemo_Implementation_Plan.md` — from data foundation to demo-ready deployment.

**Assumptions:**

- You have `claude` CLI installed and authenticated
- The Kai v2 repo is cloned locally with all v2 blocks complete (per `Kai_v2_Summary.md`)
- The 4 Audrey data files (`audreys_products.json`, `audreys_heroes.json`, `audreys_collections.json`, `audreys_curation_report.txt`) are in your working directory
- You're working from the `poc-v2.2` branch (or a new `demo/audreys-ceo` branch off it)

---

## How to Read This Document

Each step is a **Claude Code prompt** you paste into the terminal. Every prompt specifies:

- **Mode** — whether to run in `plan` mode first or go straight to `execute`
- **Model** — which Claude model to select for the task
- **The prompt itself** — copy-paste ready, with `[PLACEHOLDERS]` where you need to substitute paths

**Model selection rationale:**

| Model            | When to Use                                                                                                                                              |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Opus**   | Architecture decisions, complex multi-file refactors, fixture authoring that requires cross-referencing 3+ source documents, debugging subtle state bugs |
| **Sonnet** | Straightforward file creation, single-file edits, data entry tasks, simple wiring, test runs                                                             |

**Mode selection rationale:**

| Mode                              | When to Use                                                                                                                                   |
| --------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| **Plan first** (`--plan`) | Any task touching 4+ files, any task where wrong ordering breaks the build, any task you haven't done before in the codebase                  |
| **Direct execute**          | Single-file creation, mechanical find-and-replace, running commands, tasks where the implementation plan already specifies exactly what to do |

---

## Phase 0: Branch Setup & Orientation

### Step 0.1 — Create the working branch

**Mode:** Direct execute
**Model:** Sonnet

```
Create a new git branch called demo/audreys-ceo off the current HEAD. Don't push yet.
```

### Step 0.2 — Codebase orientation

**Mode:** Plan
**Model:** Opus

```
Read the following files and give me a map of the codebase relevant to what I'm about to build:

1. The existing fixture files in src/fixtures/ — list them all with their use-case IDs
2. The queryMatcher or capability router (wherever user queries get routed to fixtures)
3. The chip-map (wherever action chip definitions live)
4. The PageContext provider (where page-aware briefs and starters are defined)
5. The SharedCRMContext, SharedOrdersContext, SharedCustomersContext providers
6. The system prompt assembly in /api/kai/generate (the fixed order: persona → custom instructions → page context → capability prompt → widget data)
7. The component registry (where widget codes like UW-003, AW-004 are mapped to React components)

For each, give me: file path, what it exports, and what I'll need to modify for the Audrey demo.
Do NOT make any changes yet — just map it out.
```

> **Why Opus + Plan:** This is the highest-leverage orientation step. Opus will catch nuances in the codebase structure that Sonnet might miss, and plan mode ensures it reads before acting.

---

## Phase 1: Data Foundation (Track A)

### Step 1.1 — Drop Audrey product data files + create types

**Mode:** Direct execute
**Model:** Sonnet

```
I'm integrating Audrey's product catalog into the Kai v2 demo. I have already created the directory src/data/audreys/ and copied the following files :
   - audreys_products.json → src/data/audreys/products.json
   - audreys_heroes.json → src/data/audreys/heroes.json
   - audreys_collections.json → src/data/audreys/collections.json

1. Create src/data/audreys/types.ts with these TypeScript interfaces:

export type ProductBucket =
  | "spring_summer"
  | "garden_outdoor"
  | "july_release"
  | "featured_collections"
  | "sale_clearance"
  | "atlanta_top_sellers"
  | "fall_holdovers";

export interface AudreyProduct {
  sku: string;
  upc: string | null;
  name: string;
  description: string;
  retail_price: number;
  wholesale_price: number;
  msrp: number | null;
  available_qty: number;
  case_qty: number;
  min_order_qty: number;
  uom: string | null;
  is_new: boolean;
  is_featured: boolean;
  stock_status: string | null;
  division: string[];
  sub_division: string[];
  category: string[];
  group: string[];
  collections: string[];
  materials: string[];
  dimensions: string[];
  pack: string[];
  sold_as: string[];
  unit_price: string[];
  image_urls: string[];
  image_urls_by_size: {
    medium: string[];
    large: string[];
    original: string[];
  } | null;
  bucket: ProductBucket;
  is_hero: boolean;
}

export interface AudreyCollection {
  name: string;
  sku_count: number;
  sample_skus: string[];
  is_featured: boolean;
}

2. Create src/data/audreys/accessors.ts that imports the 3 JSON files, types them, and exports:
   - PRODUCTS: AudreyProduct[] (all 50)
   - HEROES: AudreyProduct[] (the 18 heroes)
   - COLLECTIONS: AudreyCollection[]
   - byBucket(bucket: ProductBucket): AudreyProduct[]
   - bySku(sku: string): AudreyProduct | undefined
   - byCollection(name: string): AudreyProduct[]
   - randomHero(): AudreyProduct

3. Create src/data/audreys/pricing.ts with a single function:
   - getDisplayPrice(product: AudreyProduct): { label: string; value: string }
   - For now, return { label: "MSRP", value: `$${product.retail_price.toFixed(2)}` }
   - Add a comment: "// Switch to wholesale when B2B credentials are available"

4. Create src/data/audreys/index.ts that re-exports everything from accessors.ts, types.ts, and pricing.ts.

Verify the JSON files parse correctly after copying. Run tsc --noEmit on the new files if a tsconfig exists.
```

### Step 1.2 — Author synthetic customers (8 records)

**Mode:** Direct execute
**Model:** Opus

```
Create src/data/audreys/synthetic/customers.ts

This file exports a typed const array of 8 customer records for the Audrey's demo. Each customer must match the existing customer shape used by SharedCustomersContext in this codebase (look at the existing type first).

Here are the 8 customers — map every field precisely:

| ID | Name | Region | Type | Rep | Lifetime Rev | Status | Key Detail |
|---|---|---|---|---|---|---|---|
| C-8001 | Magnolia Home & Garden | Texas | Garden Center | Beth Calloway (R-001) | $142,000 | Active | Biggest account. Heavy on Gardeners Grove. preferredCollections: ["Gardeners Grove", "Garden Evergreen"] |
| C-8002 | The Potting Shed | Atlanta | Gift Store | Beth Calloway (R-001) | $98,500 | Active | Atlanta market winner. Reorders quarterly. preferredCollections: ["A Blooming Porch", "The Herb Garden"] |
| C-8003 | Bloom & Basket | Nashville | Gift + Home | Marcus Rivera (R-002) | $76,200 | Active | Loves A Blooming Porch collection. preferredCollections: ["A Blooming Porch", "Bunnies"] |
| C-8004 | Seaside Gifts | Carolina | Coastal Décor | Marcus Rivera (R-002) | $61,000 | Active | Seasonal buyer — Spring/Summer heavy. preferredCollections: ["Spring & Summer", "Garden Evergreen"] |
| C-8005 | Copper Creek Trading | Denver | Mountain Retail | Hannah Cho (R-003) | $52,800 | Active | New-ish. Growing fast. preferredCollections: ["Gardeners Grove", "A Blooming Porch"] |
| C-8006 | Harbor Lane Boutique | Maine | Boutique | Hannah Cho (R-003) | $44,000 | Warning | Hasn't reordered in 52 days. preferredCollections: ["The Herb Garden"] |
| C-8007 | Sunflower & Sage | Asheville | Lifestyle | Beth Calloway (R-001) | $38,500 | Active | Bunnies collection fan. preferredCollections: ["Bunnies", "A Blooming Porch"] |
| C-8008 | Golden Meadow Co | Savannah | Gift Store | Marcus Rivera (R-002) | $28,000 | Dormant | Last order 90 days ago. At risk. preferredCollections: ["Gardeners Grove"] |

For each customer also include:
- 3-5 recentOrders referencing hero SKUs from src/data/audreys/heroes.json (import and reference real SKUs — look up actual product names and prices)
- 1-2 openTasks (some overdue — use dates relative to May 20, 2026)
- creditLimit (between $25K-$75K scaled to lifetime revenue)
- currentBalance (some healthy, Harbor Lane near limit, Golden Meadow near limit)
- ordersYTD (3-12 range), lastOrderDate (Active = within 30 days, Warning = 52 days ago, Dormant = 90 days ago)
- tags array (e.g. ["garden-center", "high-volume", "quarterly-reorder"])

Import hero SKUs from the Audrey data to populate order line items with real product names and prices. Every product reference must be a real SKU from the catalog.
```

> **Why Opus:** This requires cross-referencing the heroes.json to create realistic order line items. Opus handles multi-source synthesis much better than Sonnet.

### Step 1.3 — Author synthetic leads (6 records)

**Mode:** Direct execute
**Model:** Sonnet

```
Create src/data/audreys/synthetic/leads.ts

Export a typed const array of 6 lead records. Match the shape used by SharedCRMContext in this codebase for leads (look at the existing type first).

| ID | Name | Contact | Email | Source | Stage | Rep | Key Detail |
|---|---|---|---|---|---|---|---|
| L-9001 | Wildflower Market | Sarah Chen | sarah.chen@wildflowermarket.com | Atlanta Market Jan '25 | Qualified | Beth Calloway (R-001) | Interested in Birdhouses. Used in Capability 1. |
| L-9002 | Rustic Charm Boutique | Mike Daniels | mike@rusticcharmboutique.com | Website | New | Marcus Rivera (R-002) | Just signed up. No contact yet. Used in Capability 2. |
| L-9003 | Verdant Home Collective | Amy Brooks | amy@verdanthome.com | Referral from Magnolia | In-Progress | Beth Calloway (R-001) | Almost ready to convert. Used in Capability 3. |
| L-9004 | The Garden Gate Shop | David Park | david@gardengate.com | Trade Show | Qualified | Hannah Cho (R-003) | Duplicate of an old customer record. Used in Capability 4. |
| L-9005 | Lakeside Living Co | Rachel Torres | rachel@lakesideliving.com | Website | Contacted | Marcus Rivera (R-002) | Wants website access for browsing. Used in Capability 5. |
| L-9006 | Mountain Bloom Studio | Julia Reed | julia@mountainbloom.com | Atlanta Market Jan '25 | Qualified | Hannah Cho (R-003) | Wants a curated catalog. Used in Capability 6. |

Include plausible phone numbers, regions, notes, and a createdAt date for each.
```

### Step 1.4 — Author synthetic sales reps, orders, tasks, deals, users, wishlists, sales history

**Mode:** Plan first, then execute
**Model:** Opus

```
I need to create the remaining synthetic data files for the Audrey demo. Read the existing customer and lead files I just created at src/data/audreys/synthetic/customers.ts and src/data/audreys/synthetic/leads.ts, and also read the Audrey product data at src/data/audreys/products.json and heroes.json.

Then create these files:

1. src/data/audreys/synthetic/sales-reps.ts — 4 reps:
   - R-001 Beth Calloway, Southeast (GA, FL, SC, NC), $186K pipeline
   - R-002 Marcus Rivera, Mid-South (TN, VA, LA), $124K pipeline
   - R-003 Hannah Cho, Mountain/West (CO, ME, OR), $89K pipeline
   - R-004 James Whitfield, Northeast (NY, NJ, CT), $42K pipeline
   Each rep has accounts[] (referencing customer/lead IDs from my data) and pipeline value.

2. src/data/audreys/synthetic/orders.ts — 35 orders. Distribution:
   - 12 orders reference featured_collections heroes
   - 8 orders reference july_release heroes (Pre-Book Confirmed status)
   - 6 orders reference garden_outdoor heroes (Shipped/Delivered)
   - 5 orders reference sale_clearance (clearing PhaseOut)
   - 4 orders are mixed/general
   Statuses: Open (5), Submitted (8), Pre-Book Confirmed (8), Shipped (7), Delivered (7)
   Each order has 2-4 line items with REAL SKUs from products.json, quantities in case_qty multiples, totals based on retail_price. Orders reference customers (C-8001 through C-8008) and leads where appropriate.

3. src/data/audreys/synthetic/tasks.ts — 12 tasks exactly as specified:
   T-2001 through T-2012 with the exact titles, lead/customer references, due dates (relative to May 20, 2026), priorities, and statuses from the implementation plan.

4. src/data/audreys/synthetic/deals.ts — 8 deals across pipeline stages (Qualified, Proposal Sent, Negotiation, Closed Won), tied to leads and customers.

5. src/data/audreys/synthetic/users.ts — 5 WizShop website users (for Capability 5 demo).

6. src/data/audreys/synthetic/wishlists.ts — 3 existing wishlists referencing real SKUs (for Capability 6 demo).

7. src/data/audreys/synthetic/sales-history.ts — monthly revenue traces by bucket for the last 12 months. Use these shapes:
   - july_release: flat then sharp Q3 ramp
   - featured_collections: strong Q1-Q2 peak
   - sale_clearance: declining slope
   - garden_outdoor: flat with small Q2 bump
   - atlanta_top_sellers: spike at January, decay through year

Every file should export typed const arrays. Every product reference must use a real SKU from products.json. Cross-reference customers.ts and leads.ts for entity IDs.

Plan the work first — show me the file list and key cross-references before writing.
```

> **Why Opus + Plan:** 7 interconnected files that must cross-reference each other and the real product catalog. Plan mode catches circular dependency issues before they're written. Opus is essential for maintaining data consistency across 35 orders × 2-4 line items each.

### Step 1.5 — Wire the barrel export

**Mode:** Direct execute
**Model:** Sonnet

```
Update src/data/audreys/index.ts to also re-export everything from the synthetic/ directory:

import and re-export:
- CUSTOMERS from ./synthetic/customers
- LEADS from ./synthetic/leads
- SALES_REPS from ./synthetic/sales-reps
- ORDERS from ./synthetic/orders
- TASKS from ./synthetic/tasks
- DEALS from ./synthetic/deals
- WIZSHOP_USERS from ./synthetic/users
- WISHLISTS from ./synthetic/wishlists
- SALES_HISTORY from ./synthetic/sales-history

Also create src/data/audreys/synthetic/index.ts as a barrel file.

After wiring, run tsc --noEmit to verify everything compiles.
```

### Step 1.6 — Verify data foundation integrity

**Mode:** Direct execute
**Model:** Sonnet

```
Run a quick verification on the Audrey data foundation:

1. Import everything from src/data/audreys/index.ts
2. Check: PRODUCTS.length === 50
3. Check: HEROES.length === 18
4. Check: COLLECTIONS.length >= 17
5. Check: CUSTOMERS.length === 8
6. Check: LEADS.length === 6
7. Check: ORDERS.length === 35
8. Check: TASKS.length === 12
9. Verify every order line item SKU exists in PRODUCTS (via bySku)
10. Verify every customer's recentOrders reference real SKUs
11. Verify every task references a valid customer ID or lead ID

Write a quick Node script that runs these checks and prints PASS/FAIL. Run it.
```

---

## Phase 2: Core Page Reskins (Track B)

### Step 2.1 — Dashboard page reskin

**Mode:** Plan first, then execute
**Model:** Opus

```
Reskin the Dashboard page to use Audrey data. Read the current Dashboard page implementation and the PageContext provider to understand the existing structure.

Changes needed:

1. MetricCard tiles (find where Dashboard KPI data is defined):
   - "Active SKUs": 50 (from PRODUCTS.length)
   - "This Week Revenue": $42,800 (synthetic)
   - "Open Orders": count from ORDERS where status is Open or Submitted
   - "Pre-Book Pipeline": sum totals from ORDERS where status is Pre-Book Confirmed

2. Activity Feed (the CompactList on Dashboard):
   - "Beth closed Pre-Book for Bloom & Basket — 24 cases of Pick Of The Patch" (1h ago)
   - "New lead: Rustic Charm Boutique via website signup" (3h ago)
   - "Order #1047 shipped to Magnolia Home & Garden" (yesterday)

3. Dashboard proactive brief — update the brief content in PageContext:
   "Good morning, Beth. Two things need your attention.
   🔴 15 SKUs are in PhaseOut. Heaviest: [first 2 sale_clearance heroes by name]. Market week is your last clean window.
   (chip: Draft clearance email)
   🟡 July 2026 Virtual Release is 16 days out. Pre-book on Pick Of The Patch Gnome is tracking +18% vs January.
   (chip: Show pacing table)
   📊 Today: 3 tasks due, 1 new lead in queue, Magnolia quarterly review at 2 PM."

4. Dashboard starter prompts:
   - "What needs my attention today?"
   - "Show me this week's revenue breakdown"
   - "How's the July release pacing?"
   - "Any overdue tasks?"

Import data from src/data/audreys. Reference real SKU names in the brief text by importing HEROES and filtering by bucket.

Plan first — show me which files you'll touch and in what order.
```

### Step 2.2 — Products page reskin

**Mode:** Plan first, then execute
**Model:** Opus

```
Reskin the Products page to show Audrey's real 50-product catalog. Read the current Products page implementation.

Changes:

1. Replace the existing product grid data source with:
   import { PRODUCTS, HEROES } from "@/data/audreys";
   const FEATURED_FIRST = [...HEROES, ...PRODUCTS.filter(p => !p.is_hero)];

2. Each product card should show:
   - Real product image from image_urls[0]
   - Product name
   - SKU in mono font
   - Retail price from getDisplayPrice()
   - Case qty
   - Stock badge: "In Stock" (green), "Pre-Book" (blue), "Limited Quantity" (amber), "PhaseOut" (red) — derived from stock_status and bucket
   - Hero cards get a subtle "Featured" or "New Launch" ribbon (check is_hero and is_new)

3. Filter chips above the grid:
   All | A Blooming Porch | Gardeners Grove | The Herb Garden | Bunnies | Garden Evergreen | PhaseOut
   Use byCollection() for named collections, byBucket("sale_clearance") for PhaseOut.

4. Card click → should trigger askKai(`Tell me about ${product.sku}`) or render an EntityDetailCard.

5. Products page proactive brief:
   "Your Featured Collections are carrying the catalog. Gardeners Grove is 42% sold through; A Blooming Porch at 38%. Two SKUs — [first 2 featured_collections heroes below refill threshold] — are below refill threshold.
   (chip: Build a Gardeners Grove refill list)"

6. Products page starter prompts:
   - "How's our July 2026 release pacing?"
   - "Show me Featured Collections inventory"
   - "Which SKUs are in PhaseOut?"
   - "Top-selling birdhouses this quarter"

Plan first — this touches the page component, PageContext for briefs/starters, and possibly the product card component.
```

### Step 2.3 — Orders page reskin

**Mode:** Direct execute
**Model:** Sonnet

```
Reskin the Orders page to show the 35 synthetic Audrey orders. Read the current Orders page implementation.

Changes:

1. Replace the orders data source with: import { ORDERS } from "@/data/audreys"

2. Filter chips: All | Open | Submitted | Pre-Book Confirmed | Shipped | Delivered

3. Table columns: Order # | Customer/Lead | Total | Status | Date | Rep | Items (count)
   - Pre-Book Confirmed orders show a 📦 icon and ship window text "Ships Sep/Oct"
   - Kai-created orders (from capability flows) should appear at top with a KaiBadge — check if SharedOrdersContext already supports this badge pattern.

4. Orders page proactive brief:
   "12 orders this week reference Featured Collections SKUs — your spring catalog is moving. 2 Pre-Book Confirmed orders for July 2026 are pending quantity confirmation from Bloom & Basket.
   (chip: Show Pre-Book orders)"

5. Orders page starter prompts:
   - "Show me all pre-book orders"
   - "Which orders shipped this week?"
   - "Any orders pending confirmation?"
   - "Revenue by customer this month"
```

### Step 2.4 — Customers page reskin

**Mode:** Direct execute
**Model:** Sonnet

```
Reskin the Customers page to show the 8 synthetic customers + 6 leads in a secondary tab. Read the current Customers page implementation.

Changes:

1. Replace customers data source with: import { CUSTOMERS, LEADS } from "@/data/audreys"

2. Card grid showing 8 customers:
   - Lifetime revenue, last order date, ordersYTD
   - Top 3 preferredCollections as tag pills
   - Risk badges: "At Risk" on Harbor Lane (52 days since last order), "Dormant" on Golden Meadow (90 days)
   - Status badges: Active (green), Warning (amber), Dormant (red)

3. Tab structure: Customers (8) | Leads (6)
   - Leads tab shows the 6 leads with stage badges

4. Customers page proactive brief:
   "3 of your top 10 accounts haven't reordered Spring inventory in 45+ days: Harbor Lane Boutique, Golden Meadow Co, and Seaside Gifts.
   (chip: Draft outreach for dormant accounts)"

5. Customers page starter prompts:
   - "How's Magnolia Home & Garden doing?"
   - "Which accounts are at risk?"
   - "Show me my top customers by revenue"
   - "Draft re-engagement for dormant accounts"
```

### Step 2.5 — CRM page reskin

**Mode:** Direct execute
**Model:** Sonnet

```
Reskin the CRM page to show Audrey leads, tasks, and deals. Read the current CRM page implementation.

Changes:

1. Replace CRM data sources with imports from src/data/audreys:
   - TASKS (12 items), LEADS (6 items), DEALS (8 items)

2. Tab 1 — Tasks: 12 tasks, 4 overdue (red badges on T-2001, T-2003, T-2005, T-2008). Each references a real lead or customer name.

3. Tab 2 — Leads: 6 leads with stage badges (New → Contacted → Qualified → In-Progress → Won). Show as a list or kanban depending on existing component.

4. Tab 3 — Deals: 8 deals across Qualified, Proposal Sent, Negotiation, Closed Won stages.

5. CRM proactive brief:
   "4 tasks overdue — highest priority: Follow up with Wildflower Market (Beth, 5 days late) and PhaseOut clearance call for Golden Meadow (Marcus, 10 days late). The Pick Of The Patch Gnome pre-book line has been mentioned in 6 buyer calls this month.
   (chip: Show overdue tasks)"

6. CRM starter prompts:
   - "Show me overdue tasks"
   - "What's the status of my leads?"
   - "Move Verdant Home to Won"
   - "Create a task for Wildflower Market"
```

### Step 2.6 — Verify all 5 pages render

**Mode:** Direct execute
**Model:** Sonnet

```
Run the dev server (npm run dev or equivalent) and verify:
1. No TypeScript errors
2. No build errors
3. Navigate to each of the 5 pages (Dashboard, Products, Orders, Customers, CRM)
4. Check the browser console for any runtime errors

If there are errors, fix them. Show me what you find.
```

---

## Phase 3: LLM System Prompt + Query Routing Updates

### Step 3.1 — Add Audrey context block to system prompt

**Mode:** Direct execute
**Model:** Sonnet

```
Find the LLM system prompt assembly in /api/kai/generate (or wherever the system prompt is built — should follow the order: persona → custom instructions → page context → capability prompt → widget data).

Insert a new "Audrey context" block BETWEEN page context and capability prompt:

"""
You are an AI sales assistant for Audrey's Home & Gift, a wholesale home decor and gift brand. Audrey's catalog is organized into Pre-Book pre-orders, Seasonal ranges (Fall/Winter/Spring/Summer), and Home & Garden evergreen lines. Their biggest current collections are A Blooming Porch, Gardeners Grove, The Herb Garden, and Bunnies. The next major launch is the July 2026 Virtual Release.

When mentioning products, prefer the actual SKUs and product names from the catalog file rather than generic terms. Audrey reps care about: case quantity, minimum order quantity, pre-book ship windows (Sep/Oct/Dec), and PhaseOut clearance. Price references use retail/MSRP.

Key collections: A Blooming Porch (spring florals), Gardeners Grove (garden tools/decor), The Herb Garden (herb-themed), Bunnies (seasonal rabbit motifs), Garden Evergreen (year-round outdoor).

Current sales team: Beth Calloway (Southeast), Marcus Rivera (Mid-South), Hannah Cho (Mountain/West), James Whitfield (Northeast).
"""

The prompt order should now be: persona → custom instructions → page context → AUDREY CONTEXT → capability prompt → widget data.
```

### Step 3.2 — Update query matcher with new keywords

**Mode:** Plan first, then execute
**Model:** Opus

```
Find the queryMatcher / capability router (the file that maps user queries to fixture files). Read its current structure.

Add these new keyword-to-fixture routes:

Capability 1 keywords: ["create task", "wildflower", "birdhouse", "samples", "send email to wildflower"]
  → fixture: cap1-task-email-voice (will be created in Phase 4)

Capability 2 keywords: ["add lead", "new lead", "create lead", "pine and thistle", "pine & thistle"]
  → fixture: cap2-lead-creation

Capability 3 keywords: ["move to won", "convert lead", "stage to won", "verdant home", "verdant"]
  → fixture: cap3-lead-stage-won

Capability 4 keywords: ["merge", "combine records", "duplicate", "garden gate"]
  → fixture: cap4-merge-customer

Capability 5 keywords: ["create user", "website access", "wizshop user", "lakeside living", "lakeside"]
  → fixture: cap5-user-creation

Capability 6 keywords: ["build catalog", "create wishlist", "curated catalog", "mountain bloom"]
  → fixture: cap6-catalog-creation

Report keywords:
  - ["collection performance", "how are collections", "collection report"] → report-collection-performance
  - ["pre-book pacing", "july release", "july 2026", "release pacing"] → report-prebook-pacing
  - ["customer health", "account health", "customer dashboard"] → report-customer-health
  - ["pipeline", "lead conversion", "my pipeline", "pipeline report"] → report-pipeline
  - ["team performance", "rep performance", "team report"] → report-team-performance
  - ["catalog health", "inventory status", "stock levels", "catalog report"] → report-catalog-health

Also update existing UC-1 / UC-2 / UC-3 keyword routes to reference Audrey entities instead of "Acme Corp" — any "acme" references should now map to Magnolia Home & Garden (C-8001) or another Audrey customer.

Plan first to show me the current router structure and exactly where each addition goes.
```

### Step 3.3 — Update action chip map

**Mode:** Direct execute
**Model:** Sonnet

```
Find the chip-map file (wherever action chip definitions are keyed by useCase). Add these new chip templates:

{
  key: "clearance_email",
  label: "Draft clearance email",
  query: "Write a market-week clearance email for PhaseOut inventory"
},
{
  key: "collection_refill",
  label: "Build refill list",
  query: "Build a refill outreach list for the Gardeners Grove collection"
},
{
  key: "july_pacing",
  label: "Show July 2026 pacing",
  query: "Show pre-book pacing for the July 2026 Virtual Release vs January 2025"
},
{
  key: "prebook_orders",
  label: "Show Pre-Book orders",
  query: "Show me all Pre-Book Confirmed orders"
},
{
  key: "dormant_outreach",
  label: "Draft outreach for dormant accounts",
  query: "Draft re-engagement emails for accounts that haven't ordered in 45+ days"
},
{
  key: "overdue_tasks",
  label: "Show overdue tasks",
  query: "Show me all overdue tasks"
}

Also look for any existing chip templates that reference "Acme" or placeholder data and update them to reference Audrey entities.
```

---

## Phase 4: Capability Fixtures — Caps 1-3 (Track C)

### Step 4.1 — Capability 1: Task Creation + Email Draft

**Mode:** Plan first, then execute
**Model:** Opus

```
Build the Capability 1 fixture for the Audrey demo: "Task Creation for Lead + Email Draft (Voice)".

Read the existing UC-2 task creation fixture to understand the Frame JSON structure this codebase uses (the shape that FrameParser → ComponentRegistry → CompositionEngine expects).

Create TWO fixture files:

FILE 1: src/fixtures/cap1-task-email-voice.json
This is the initial task creation flow. The Frame JSON should compose these widgets:

Frame 1:
- UW-014 AgentReasoningCard (collapsed): "Resolved Wildflower Market as Lead L-9001. Building task."
- UW-003 EntityDetailCard — lead summary:
  { Name: "Wildflower Market", Contact: "Sarah Chen", Stage: "Qualified", Source: "Atlanta Market Jan '25" }
- AW-004 MultiStepFormWizard — task form pre-filled:
  { Lead: "Wildflower Market (Lead)" [locked], Title: "Send Birdhouse collection samples", Type: "Email", Assigned To: "Beth Calloway" [locked], Due Date: "2026-05-30", Priority: "High", Status: "Open" }
- AW-012 ConsentBanner:
  "Create high-priority task 'Send Birdhouse collection samples' for Wildflower Market, due May 30, assigned to Beth?"
  Actions: [Confirm] [Modify] [Cancel]

Post-confirm frame:
- AW-003 ConfirmationDialog: "Task created successfully"
- Action chips: ["Draft the email now", "View in CRM", "Create another task"]
  - "Draft the email now" chip should route to the cap1-email-draft fixture

FILE 2: src/fixtures/cap1-email-draft.json
This is the email chain follow-up. Frame JSON:

- UW-014 AgentReasoningCard (collapsed): "Drafting email for Wildflower Market. Including Birdhouse heroes."
- EmailDraftCard (check if this component exists — if not, use UW-003 EntityDetailCard styled as an email):
  { To: "sarah.chen@wildflowermarket.com", Subject: "Audrey's Birdhouse Collection — Samples for Your Review", Body: [fixture text referencing real SKUs: Birdhouse Planter (6FA2329) — case qty 6, $82.50 retail; Hanging Birdhouse — Weathered; mentions Atlanta market connection] }
- Action chips: ["Make it more casual", "Add the July release preview", "Send it"]

Use the EXACT Frame JSON shape this codebase expects. Plan first — show me the existing fixture structure before writing.
```

> **Why Opus + Plan:** Fixtures must match the exact Frame JSON contract. Getting the widget composition wrong means the rendering engine silently fails. Opus reads the existing fixtures to pattern-match correctly.

### Step 4.2 — Capability 2: Lead Creation + Auto Task

**Mode:** Direct execute
**Model:** Opus

```
Build the Capability 2 fixtures for the Audrey demo: "Lead Creation + Automatic Task".

Read the cap1 fixture I just created for the Frame JSON pattern. Also read the existing UC-2 fixture for any lead/task creation patterns.

Create TWO fixture files:

FILE 1: src/fixtures/cap2-lead-creation.json
Frame JSON composing:
- UW-014 AgentReasoningCard: "No existing lead or customer found for Pine & Thistle. Creating new lead."
- AW-004 MultiStepFormWizard — 3-step lead form:
  Step 1 (Basic Info): Company "Pine & Thistle Gift Shop", Contact "Emma Walsh", Email "emma@pineandthistle.com", Phone empty, Source "Website"
  Step 2 (Details): Stage "New", Assigned To "Hannah Cho", Region empty, Notes empty
  Step 3 (Review): Summary card
- AW-012 ConsentBanner: "Create lead 'Pine & Thistle Gift Shop' assigned to Hannah Cho?"
  Actions: [Confirm] [Modify] [Cancel]

Post-confirm:
- AW-003 ConfirmationDialog: "Lead created: Pine & Thistle Gift Shop (L-9007)"
- Action chips: ["Draft intro email to Emma", "View lead in CRM", "Show me all new leads this week"]

FILE 2: src/fixtures/cap2-auto-task-followup.json
This renders BELOW the confirmation (the "Kai also created" moment):
- Canvas text: "I've also created an initial outreach task for Hannah — first contact should happen within 48 hours for website leads."
- UW-003 EntityDetailCard — auto-task preview:
  { Title: "First outreach — Pine & Thistle Gift Shop", Lead: "Pine & Thistle Gift Shop", Assigned To: "Hannah Cho", Due Date: "2026-05-22" (48h from now), Priority: "Medium", Type: "Email" }
- AW-012 ConsentBanner (lighter tier): "Auto-create this follow-up task?"
  Actions: [Confirm] [Skip] [Modify]
```

### Step 4.3 — Capability 3: Lead → Customer Conversion

**Mode:** Direct execute
**Model:** Opus

```
Build the Capability 3 fixture: "Lead Stage Movement → Customer Conversion".

Create src/fixtures/cap3-lead-stage-won.json

Frame JSON composing:
- UW-014 AgentReasoningCard: "Found Lead L-9003 (Verdant Home Collective, stage: In-Progress). Moving to Won triggers customer conversion. Collecting required fields."
- UW-003 EntityDetailCard — current lead state with visual stage transition:
  { Name: "Verdant Home Collective", Contact: "Amy Brooks", Stage: "In-Progress → Won ✅", Source: "Referral from Magnolia", Rep: "Beth Calloway" }
- Canvas text: "Moving Verdant Home to Won — great news! 🎉 To convert them to a full customer account, I need a few details."
- AW-004 MultiStepFormWizard — 4-step customer conversion form:
  Step 1 (Business Details): Legal Name "Verdant Home Collective LLC" [pre-filled], Tax ID/EIN empty [required], Business Type dropdown [Retailer, Wholesaler, Designer, Other], Website empty
  Step 2 (Billing & Shipping): Billing address fields, Shipping address with "same as billing" checkbox, Shipping notes
  Step 3 (Account Setup): Payment Terms [Net 30, Net 60, COD, Prepaid], Credit Limit [$25,000 suggested], Price List [Wholesale Tier 1, Wholesale Tier 2, Retail], Sales Rep "Beth Calloway" [locked]
  Step 4 (Review): Summary card
- AW-012 ConsentBanner: "Convert Verdant Home Collective from lead to customer account with these details?"
  Actions: [Confirm] [Modify] [Cancel]

Post-confirm:
- AW-003 ConfirmationDialog: "Customer account created: Verdant Home Collective (C-8009). Lead L-9003 has been archived."
- Action chips: ["Create their first order", "Set up website access", "Build a welcome catalog", "View customer profile"]
  - "Set up website access" should chain to cap5-user-creation
  - "Build a welcome catalog" should chain to cap6-catalog-creation
```

### Step 4.4 — Wire shared context mutations for Caps 1-3

**Mode:** Plan first, then execute
**Model:** Opus

```
Read SharedCRMContext, SharedCustomersContext, and SharedOrdersContext. Check what mutations already exist (addTask should exist from UC-2).

Add these new mutations if they don't already exist:

SharedCRMContext:
- addLead(lead) — adds a new lead to the leads list, marks it with KaiBadge
- updateLeadStage(leadId, newStage) — updates a lead's stage
- archiveLead(leadId) — marks a lead as archived (for Cap 3 conversion)

SharedCustomersContext:
- addCustomer(customer) — adds a new customer (from lead conversion), marks with KaiBadge

Then wire the fixture confirmation handlers:
- Cap 1 confirm → SharedCRMContext.addTask(newTask)
- Cap 2 confirm → SharedCRMContext.addLead(newLead) + SharedCRMContext.addTask(autoTask)
- Cap 3 confirm → SharedCustomersContext.addCustomer(converted) + SharedCRMContext.archiveLead(L-9003)

Plan first — show me what already exists and what's new.
```

---

## Phase 5: Capability Fixtures — Caps 4-6 (Track D)

### Step 5.1 — Capability 4: Merge Customer Flow

**Mode:** Direct execute
**Model:** Opus

```
Build the Capability 4 fixture: "Merge Customer Flow".

Create src/fixtures/cap4-merge-customer.json

This is the most complex fixture — it has a side-by-side comparison. Frame JSON composing:

- UW-014 AgentReasoningCard: "Found Lead L-9004 (The Garden Gate Shop) and Customer C-8050 (Garden Gate — inactive since 2024). Showing both records for merge review."

- Two UW-003 EntityDetailCards rendered side-by-side (check if the Frame JSON supports a layout hint like "row" or "flex-row" — read the CompositionEngine to see how layout is handled):
  LEFT — Lead L-9004: Name "The Garden Gate Shop", Contact "David Park", Email "david@gardengate.com", Phone "(404) 555-1234", Address "142 Peach St, ATL", Stage "Qualified", Rep "Hannah Cho", Orders: 0
  RIGHT — Customer C-8050: Name "Garden Gate", Contact "David Park", Email "dpark@gardengate.com" (old), Phone "(404) 555-1234" (same), Address "140 Peach St, ATL" (close), Status "Inactive", Rep "(unassigned)", Orders: "3 (2024, totaling $8,200)"

- Canvas text: "These look like the same business — David Park, same phone, similar address. The old record has 3 historical orders worth $8,200. What would you like to merge?"

- AW-004 MultiStepFormWizard — single step with checkboxes:
  ☑️ Contact information (keep lead's email — newer)
  ☑️ Shipping address (keep lead's — 142 Peach St)
  ☑️ Order history (bring 3 orders from old record)
  ☑️ Quotes (bring 1 expired quote)
  ☐ Wishlist (old record has none — skip)
  ☑️ Assign rep: Hannah Cho (from lead)
  Dropdown: Merge into: ["Keep as Lead" / "Convert to Customer"]

- AW-012 ConsentBanner: "Merge these records? The old customer record will be archived. Order history and quotes will transfer to the surviving record."
  Actions: [Confirm Merge] [Cancel]

Post-confirm:
- AW-003 ConfirmationDialog: "Records merged. The Garden Gate Shop now has $8,200 in historical orders. Old record C-8050 archived."
- Action chips: ["View merged record", "Create a re-engagement order", "Draft 'welcome back' email to David"]

Also add a synthetic inactive customer C-8050 to src/data/audreys/synthetic/customers.ts for the merge source.
```

### Step 5.2 — Capability 5: User Creation for Website Access

**Mode:** Direct execute
**Model:** Opus

```
Build the Capability 5 fixture: "User Creation for Website Access".

Create src/fixtures/cap5-user-creation.json

Frame JSON composing:
- UW-014 AgentReasoningCard: "Found Lead L-9005 (Lakeside Living Co). Setting up WizShop user."
- UW-003 EntityDetailCard — lead context:
  { Name: "Lakeside Living Co", Contact: "Rachel Torres", Email: "rachel@lakesideliving.com", Stage: "Contacted" }
- AW-004 MultiStepFormWizard — 3-step user creation:
  Step 1 (Account Details): Username "rachel.torres" [auto-suggested], Email "rachel@lakesideliving.com" [pre-filled], Role dropdown [Buyer, Browse Only, Admin], Status "Active"
  Step 2 (Access Configuration): Price List dropdown with descriptions [Wholesale Tier 1 — 50-55% off, Wholesale Tier 2 — 55-60% off, Retail — Full MSRP, Custom], Customer Access dropdown, Order Access dropdown, Can Place Orders toggle (ON)
  Step 3 (Review + Notification): Summary + checkbox "Send welcome email with login credentials"
- AW-012 ConsentBanner: "Create WizShop user 'rachel.torres' for Lakeside Living Co with Wholesale Tier 1 pricing?"
  Actions: [Create User] [Modify] [Cancel]

Post-confirm:
- AW-003 ConfirmationDialog: "Website user created. Rachel Torres can now log in at shop.audreys.com. Welcome email sent."
- Action chips: ["Build a catalog for Lakeside Living", "Create their first wishlist", "View user in manage panel"]
  - "Build a catalog" should chain to cap6-catalog-creation
```

### Step 5.3 — Capability 6: Catalog Builder

**Mode:** Plan first, then execute
**Model:** Opus

```
Build the Capability 6 fixture: "Create Wishlist / Catalog Against a Lead".

This fixture needs to show a product grid with real Audrey product images and data. Read the existing component registry to see if there's a ProductCardGrid (UW-009) component, or if I need to use UW-004 DataTable with image columns.

Create src/fixtures/cap6-catalog-creation.json

Frame JSON composing:
- UW-014 AgentReasoningCard: "Found Lead L-9006 (Mountain Bloom Studio). Filtering catalog for garden_outdoor and Herb Garden collection. Found 11 matching SKUs."
- UW-003 EntityDetailCard — lead context:
  { Name: "Mountain Bloom Studio", Contact: "Julia Reed", Interest: "Garden décor, natural materials" }
- Canvas text: "Here's a curated selection for Mountain Bloom — 11 products from your Garden Outdoor line and The Herb Garden collection. I've put the hero pieces first."
- Product display widget (UW-009 or UW-004):
  Show 11 products filtered from garden_outdoor bucket + Herb Garden collection.
  Each item: product image (from image_urls[0]), name, SKU (mono), retail price, case qty, stock badge.
  Hero products first, marked with a 🌟.
  Use REAL data from the Audrey catalog — import and filter at fixture-build time, embedding the actual product data.
- AW-004 MultiStepFormWizard — single step catalog config:
  Catalog Name: "Mountain Bloom — Garden Collection" [editable]
  Include Pricing toggle (ON)
  Include Stock Levels toggle
  Format dropdown [Digital Catalog / PDF / Shareable Link]
  Personal Note textarea
- AW-012 ConsentBanner: "Create catalog 'Mountain Bloom — Garden Collection' with 11 products?"
  Actions: [Create Catalog] [Add/Remove Products] [Cancel]

Post-confirm:
- AW-003 ConfirmationDialog: "Catalog created with 11 products. Saved to My Catalogs."
- Action chips: ["Email this catalog to Julia", "Add Bunnies collection products", "Convert to wishlist", "View in My Catalogs"]

Plan first — I need to know if UW-009 exists or if I'm using UW-004, and how to embed product image URLs in the fixture.
```

---

## Phase 6: Report Fixtures — Cap 7 (Track E)

### Step 6.1 — Create all 6 report fixtures

**Mode:** Direct execute
**Model:** Opus

```
Create 6 report fixtures, all using UW-030 DashboardCompositeWidget composing existing sub-widgets. Read the existing dashboard fixtures (the 8 pre-built ones mentioned in the codebase) to understand the DashboardCompositeWidget Frame JSON structure.

All 6 reports use Audrey data — import real SKU names and synthetic metrics.

FILE 1: src/fixtures/report-collection-performance.json
DashboardCompositeWidget (grid 2x3):
- [0,0 span 2] MetricCardRow: A Blooming Porch $48,200 +22%, Gardeners Grove $36,800 +15%, The Herb Garden $21,400 +8%, Bunnies $12,100 -5%
- [1,0] LineChart: "Collection Revenue — Weekly Trend" — 4 lines, 8-week window
- [1,1] DataTable: "Top 5 SKUs by Collection Revenue" — hero products with SKU, name, collection, units, revenue
- [2,0] DataTable: "Refill Opportunities" — customers whose last collection order was 30+ days ago
- [2,1] CompactList: "PhaseOut Watch" — sale_clearance products with <50 units

FILE 2: src/fixtures/report-prebook-pacing.json
DashboardCompositeWidget (grid 2x2):
- [0,0 span 2] MetricCardRow: July Pre-Book Orders 18, Pre-Book Revenue $68,500 +28%, Top Pre-Book SKU "Pick Of The Patch Gnome", Days to Release 16
- [1,0] LineChart: "Pre-Book Pacing: July 2026 vs January 2025" — 2 cumulative lines
- [1,1] DataTable: "Pre-Book by Customer" — customer, SKUs ordered, total, confirmation status

FILE 3: src/fixtures/report-customer-health.json
DashboardCompositeWidget (grid 2x3):
- [0,0 span 2] MetricCardRow: Active 6/8, At-Risk 2, Avg Reorder Cycle 34 days, Q Revenue $142,800
- [1,0] LineChart: "Customer Reorder Frequency"
- [1,1] DataTable: "Accounts Needing Attention" — days_since_last_order > 30
- [2,0 span 2] CompactList: "Upcoming Renewals & Reviews"

FILE 4: src/fixtures/report-pipeline.json
DashboardCompositeWidget (grid 2x2):
- [0,0 span 2] MetricCardRow: Pipeline Value $186K, Leads 6, Avg Convert Time 42 days, Conversion Rate 68%
- [1,0] DataTable: "Leads by Stage" — name, stage, days in stage, next action, rep
- [1,1] CompactList: "Deals Closing This Month"

FILE 5: src/fixtures/report-team-performance.json
DashboardCompositeWidget (grid 2x3):
- [0,0 span 2] MetricCardRow: Team Revenue Q2 $384,200, Orders 67, New Customers 3, Avg Order Value $5,734
- [1,0] DataTable: "Performance by Rep" — Beth/Marcus/Hannah/James with revenue, orders, conversion %, customers, pipeline
- [1,1] LineChart: "Revenue by Rep — Weekly" — 4 lines
- [2,0] DataTable: "Top Accounts by Rep"
- [2,1] CompactList: "Overdue Tasks by Rep"

FILE 6: src/fixtures/report-catalog-health.json
DashboardCompositeWidget (grid 2x3):
- [0,0 span 2] MetricCardRow: Active SKUs 50, In Stock 35, Low Stock 8, PhaseOut 15
- [1,0] DataTable: "Inventory by Collection" — collection, SKU count, total units, sell-through %
- [1,1] LineChart: "Stock Depletion Trend"
- [2,0 span 2] DataTable: "PhaseOut Clearance Priority" — SKU, name, remaining units, days in PhaseOut, suggested action. Urgent highlights on items with <10 units.

Use the EXACT DashboardCompositeWidget JSON structure from existing fixtures. Reference real Audrey product names and hero SKUs in all data tables.
```

> **Why Opus:** 6 complex nested fixtures with real data. Getting the grid layout coordinates and widget composition right in one pass requires strong reasoning.

---

## Phase 7: Integration + Wiring

### Step 7.1 — Wire all new fixtures into the capability router

**Mode:** Plan first, then execute
**Model:** Opus

```
Now wire everything together. Read the queryMatcher/capability router (which you updated in Step 3.2 with keywords) and verify that every new fixture file is properly imported and mapped.

Check:
1. cap1-task-email-voice.json is imported and mapped to Cap 1 keywords
2. cap1-email-draft.json is mapped as a chain follow-up from Cap 1's "Draft the email now" chip
3. cap2-lead-creation.json is mapped to Cap 2 keywords
4. cap2-auto-task-followup.json is triggered after Cap 2 confirmation
5. cap3-lead-stage-won.json is mapped to Cap 3 keywords
6. cap4-merge-customer.json is mapped to Cap 4 keywords
7. cap5-user-creation.json is mapped to Cap 5 keywords
8. cap6-catalog-creation.json is mapped to Cap 6 keywords
9. All 6 report fixtures are mapped to their report keywords
10. Action chip chains work: Cap 1 email → Cap 3 "Set up website access" → Cap 5, Cap 3 "Build a welcome catalog" → Cap 6, Cap 5 "Build a catalog" → Cap 6

Also verify that the chip-map entries from Step 3.3 are correctly wired and that template variables ({customer}, {leadId}, etc.) resolve from the previous turn's widget data.

Plan first — show me the full routing table before and after.
```

### Step 7.2 — Replace all remaining "Acme Corp" references

**Mode:** Direct execute
**Model:** Sonnet

```
Search the entire codebase for any remaining references to "Acme Corp", "Acme", "generic widget", or any other placeholder content from the v2 demo. Replace them with Audrey-appropriate references:

- "Acme Corp" → "Magnolia Home & Garden" (or another Audrey customer as contextually appropriate)
- Generic product names → real Audrey SKU names
- Generic order IDs → Audrey order IDs (from ORDERS)
- "John Smith" / generic contacts → Audrey customer contacts

Search patterns: grep -ri "acme" src/
Also search for: "lorem", "placeholder", "TODO", "generic", "sample" in fixture files.
```

### Step 7.3 — Build verification

**Mode:** Direct execute
**Model:** Sonnet

```
Run a full build and verify:
1. npm run build (or the equivalent) — must complete with zero errors
2. npm run lint — fix any lint issues
3. Check for TypeScript errors: tsc --noEmit
4. Run the dev server and navigate to each page

Report any errors and fix them.
```

---

## Phase 8: End-to-End Demo Dry Run

### Step 8.1 — Script walkthrough verification

**Mode:** Plan
**Model:** Opus

```
I need you to trace through the full 22-minute demo script and verify every step works against the fixtures and data we've built. Don't execute anything — just read and verify.

For each demo act, confirm:
1. The user query matches a keyword in the queryMatcher
2. The matched fixture file exists and has valid Frame JSON
3. The widgets in the fixture are registered in the ComponentRegistry
4. Action chips on the fixture map to valid chip-map entries
5. Chain follow-ups route to the correct next fixture
6. Shared state mutations are wired correctly
7. Product names and SKUs in the fixture reference real Audrey catalog entries

Demo acts to verify:
- Opening: Morning Brief (Dashboard proactive brief)
- Act 1: "Create a task for Wildflower Market..." → cap1 → "Draft the email now" → cap1-email
- Act 2: "Add Pine & Thistle Gift Shop..." → cap2 → auto-task
- Act 3: "Move Verdant Home Collective to Won" → cap3
- Act 4: "Merge Garden Gate Shop..." → cap4
- Act 5: "Create website access for Lakeside Living" → cap5
- Act 6: "Build a catalog for Mountain Bloom Studio..." → cap6
- Act 7: "Show me collection performance" → report-1, "pipeline" → report-4, "team performance" → report-5
- Act 8: Navigate Products page, navigate CRM page

Report any gaps, missing routes, or broken chains.
```

### Step 8.2 — Fix any issues found

**Mode:** Direct execute
**Model:** Opus (if complex) / Sonnet (if simple)

```
[Use this step for any fixes identified in Step 8.1. Paste the specific issues here.]
```

---

## Phase 9: Polish & Deploy

### Step 9.1 — Visual polish pass

**Mode:** Direct execute
**Model:** Sonnet

```
Do a visual polish pass on the Audrey demo:

1. Verify all product images load (check that image_urls[0] from the Audrey data return valid images — the URLs point to emun CDN)
2. Add the hero image fallback chain everywhere product images are used:
   const heroImg = product.image_urls_by_size?.large?.[0] ?? product.image_urls_by_size?.original?.[0] ?? product.image_urls[0];
3. Check that the "Featured" / "New Launch" ribbons appear on hero product cards
4. Check that stock badges (In Stock/Pre-Book/Limited Quantity/PhaseOut) have the correct colors
5. Verify risk badges on Customers page (At Risk on Harbor Lane, Dormant on Golden Meadow)
6. Check that overdue task badges are red on CRM page (T-2001, T-2003, T-2005, T-2008)
```

### Step 9.2 — Deploy

**Mode:** Direct execute
**Model:** Sonnet

```
Commit all changes with the message: "feat: Audrey's CEO demo — full data integration + 7 capabilities + 6 reports"

Push the branch. Then deploy to Vercel:
- Verify the required env vars are set: ANTHROPIC_API_KEY, ELEVENLABS_API_KEY, ELEVENLABS_VOICE_ID
- Run: vercel --prod
- After deploy, verify the production URL loads and the Dashboard morning brief shows Audrey content.
```

---

## Appendix A: Prompt Cheat Sheet — Quick Reference

| Phase                 | Steps              | Model         | Mode           | Est. Time          |
| --------------------- | ------------------ | ------------- | -------------- | ------------------ |
| 0 — Setup            | 0.1–0.2           | Sonnet / Opus | Execute / Plan | 15 min             |
| 1 — Data Foundation  | 1.1–1.6           | Mixed         | Mixed          | 90 min             |
| 2 — Page Reskins     | 2.1–2.6           | Opus / Sonnet | Mixed          | 60 min             |
| 3 — Prompt + Routing | 3.1–3.3           | Sonnet / Opus | Mixed          | 30 min             |
| 4 — Caps 1-3         | 4.1–4.4           | Opus          | Mixed          | 75 min             |
| 5 — Caps 4-6         | 5.1–5.3           | Opus          | Mixed          | 60 min             |
| 6 — Reports          | 6.1                | Opus          | Execute        | 45 min             |
| 7 — Integration      | 7.1–7.3           | Opus / Sonnet | Mixed          | 45 min             |
| 8 — Dry Run          | 8.1–8.2           | Opus          | Plan           | 30 min             |
| 9 — Polish + Deploy  | 9.1–9.2           | Sonnet        | Execute        | 20 min             |
| **Total**       | **27 steps** |               |                | **~8 hours** |

## Appendix B: When Things Go Wrong

**Fixture doesn't render → the Frame JSON shape is wrong.**
Use this prompt:

```
Read the existing working fixture at src/fixtures/[working-fixture].json and compare its
Frame JSON structure to src/fixtures/[broken-fixture].json. Show me every structural
difference. The rendering engine is: Frame JSON → FrameParser → ComponentRegistry →
CompositionEngine → Widgets. The fixture must match what FrameParser expects.
```

Model: Opus. Mode: Plan.

**Widget shows but data is empty → the widget data contract doesn't match.**
Use this prompt:

```
Read the React component for widget [UW-XXX] and show me the exact props/data shape
it expects. Then read the fixture at src/fixtures/[fixture].json and show me what data
it's passing. Highlight mismatches.
```

Model: Opus. Mode: Plan.

**Action chip click does nothing → the chip query doesn't match any route.**
Use this prompt:

```
Trace the action chip "[chip label]" from click to fixture:
1. Find the chip definition in chip-map
2. Show me the query it generates
3. Check if that query matches any keyword in the queryMatcher
4. If no match, tell me what keyword to add and where.
```

Model: Sonnet. Mode: Execute.

**TypeScript error after data changes → a type mismatch in the synthetic data.**
Use this prompt:

```
Run tsc --noEmit and show me all errors. For each error, show the expected type
and the actual value. Fix them.
```

Model: Sonnet. Mode: Execute.

## Appendix C: Key File Paths (Post-Build)

```
src/data/audreys/
  products.json                    — 50 curated SKUs (real)
  heroes.json                      — 18 hero SKUs (real)
  collections.json                 — 17 collections (real)
  types.ts                         — AudreyProduct, AudreyCollection, ProductBucket
  accessors.ts                     — PRODUCTS, HEROES, COLLECTIONS, byBucket, bySku, byCollection
  pricing.ts                       — getDisplayPrice (MSRP-only for now)
  index.ts                         — barrel export
  synthetic/
    customers.ts                   — 8 converted customers + C-8050 (merge target)
    leads.ts                       — 6 leads at various pipeline stages
    sales-reps.ts                  — 4 reps (Beth is real from API)
    orders.ts                      — 35 orders with real SKU line items
    tasks.ts                       — 12 tasks (4 overdue)
    deals.ts                       — 8 deals across pipeline stages
    users.ts                       — 5 WizShop website users
    wishlists.ts                   — 3 wishlists with real SKUs
    sales-history.ts               — monthly traces by bucket
    index.ts                       — barrel export

src/fixtures/
  cap1-task-email-voice.json       — Capability 1: task creation
  cap1-email-draft.json            — Capability 1: email chain
  cap2-lead-creation.json          — Capability 2: lead creation
  cap2-auto-task-followup.json     — Capability 2: auto-generated task
  cap3-lead-stage-won.json         — Capability 3: lead → customer conversion
  cap4-merge-customer.json         — Capability 4: merge customer records
  cap5-user-creation.json          — Capability 5: website user creation
  cap6-catalog-creation.json       — Capability 6: catalog builder
  report-collection-performance.json
  report-prebook-pacing.json
  report-customer-health.json
  report-pipeline.json
  report-team-performance.json
  report-catalog-health.json
```
