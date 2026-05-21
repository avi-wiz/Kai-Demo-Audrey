# Kai vDemo — Complete Implementation Plan

**For:** Audrey's CEO demo
**Built on:** Kai v2 (all blocks complete, deployed at kaidemov0.vercel.app)
**Data source:** Audrey's live product catalog (50 SKUs, 18 heroes, 17 collections) + synthetic CRM layer
**Capabilities to demo:** 7 scripted flows + 5 core page reskins + 6 reports

---

## The Big Picture

This plan has three layers, built bottom-up:

```
LAYER 3 — 7 Demo Capabilities (the scripted wow moments)
LAYER 2 — 5 Core Page Reskins (the ambient Audrey feel)
LAYER 1 — Data Foundation (products, customers, leads, orders, tasks, reps)
```

Every fixture, every widget, every chip references real Audrey SKUs and collection names. The CEO should never see "Acme Corp" or "generic widget" anywhere on screen.

---

## LAYER 1: Data Foundation

### 1.1 Audrey Product Data (real — from their API)

Drop the 4 files from the integration guide into `src/data/audreys/`:

```
src/data/audreys/
  products.json          — 50 curated SKUs
  heroes.json            — 18 hero SKUs (scripted moments)
  collections.json       — 17 named collections
  types.ts               — AudreyProduct, AudreyCollection, ProductBucket
  accessors.ts           — PRODUCTS, HEROES, COLLECTIONS, byBucket, bySku, byCollection
  index.ts               — re-exports everything
  pricing.ts             — isolate MSRP-only logic (no wholesale in demo)
```

### 1.2 Synthetic CRM Data (authored — must feel real)

```
src/data/audreys/synthetic/
  customers.ts           — 8 converted customers
  leads.ts               — 6 leads at various pipeline stages
  sales-reps.ts          — 4 reps (Beth is real from API)
  orders.ts              — 35 orders referencing hero SKUs
  tasks.ts               — 12 tasks (4 overdue) tied to leads + customers
  deals.ts               — 8 deals across pipeline stages
  users.ts               — 5 WizShop website users (for Cap 5)
  wishlists.ts           — 3 existing wishlists (for Cap 6)
  sales-history.ts       — synthetic monthly traces by bucket (for charts)
```

### 1.3 Customers (8 records)

These are **converted** accounts — they've bought before. They appear on the Customers page.

| ID | Name | Region | Type | Rep | Lifetime Rev | Status | Key Detail |
|---|---|---|---|---|---|---|---|
| C-8001 | Magnolia Home & Garden | Texas | Garden Center | Beth | $142,000 | Active | Biggest account. Heavy on Gardeners Grove. |
| C-8002 | The Potting Shed | Atlanta | Gift Store | Beth | $98,500 | Active | Atlanta market winner. Reorders quarterly. |
| C-8003 | Bloom & Basket | Nashville | Gift + Home | Marcus Rivera | $76,200 | Active | Loves A Blooming Porch collection. |
| C-8004 | Seaside Gifts | Carolina | Coastal Décor | Marcus Rivera | $61,000 | Active | Seasonal buyer — Spring/Summer heavy. |
| C-8005 | Copper Creek Trading | Denver | Mountain Retail | Hannah Cho | $52,800 | Active | New-ish. Growing fast. |
| C-8006 | Harbor Lane Boutique | Maine | Boutique | Hannah Cho | $44,000 | Warning | Hasn't reordered in 52 days. |
| C-8007 | Sunflower & Sage | Asheville | Lifestyle | Beth | $38,500 | Active | Bunnies collection fan. |
| C-8008 | Golden Meadow Co | Savannah | Gift Store | Marcus Rivera | $28,000 | Dormant | Last order 90 days ago. At risk. |

Each customer record includes:
- 3-5 recent orders referencing hero SKUs
- 1-2 open tasks (some overdue)
- Credit limit, current balance, tags
- `ordersYTD`, `lastOrderDate`, `preferredCollections[]`

### 1.4 Leads (6 records)

These are **not yet customers**. They appear on the CRM page. Critical for Capabilities 1–5.

| ID | Name | Contact | Source | Stage | Rep | Key Detail |
|---|---|---|---|---|---|---|
| L-9001 | Wildflower Market | Sarah Chen | Atlanta Market Jan '25 | Qualified | Beth | Met at Atlanta. Interested in Birdhouses. **Used in Cap 1 (task + email).** |
| L-9002 | Rustic Charm Boutique | Mike Daniels | Website | New | Marcus Rivera | Just signed up. No contact yet. **Used in Cap 2 (lead creation is modeled on this pattern).** |
| L-9003 | Verdant Home Collective | Amy Brooks | Referral from Magnolia | In-Progress | Beth | Almost ready to convert. **Used in Cap 3 (stage → Won → customer fields).** |
| L-9004 | The Garden Gate Shop | David Park | Trade Show | Qualified | Hannah Cho | Duplicate of an old customer record. **Used in Cap 4 (merge flow).** |
| L-9005 | Lakeside Living Co | Rachel Torres | Website | Contacted | Marcus Rivera | Wants website access for browsing. **Used in Cap 5 (user creation).** |
| L-9006 | Mountain Bloom Studio | Julia Reed | Atlanta Market Jan '25 | Qualified | Hannah Cho | Wants a curated catalog. **Used in Cap 6 (wishlist/catalog).** |

### 1.5 Sales Reps (4)

| ID | Name | Territory | Accounts | Pipeline |
|---|---|---|---|---|
| R-001 | Beth Calloway | Southeast (GA, FL, SC, NC) | Magnolia, Potting Shed, Sunflower, Verdant (lead), Wildflower (lead) | $186K |
| R-002 | Marcus Rivera | Mid-South (TN, VA, LA) | Bloom & Basket, Seaside, Golden Meadow, Rustic Charm (lead), Lakeside (lead) | $124K |
| R-003 | Hannah Cho | Mountain/West (CO, ME, OR) | Copper Creek, Harbor Lane, Garden Gate (lead), Mountain Bloom (lead) | $89K |
| R-004 | James Whitfield | Northeast (NY, NJ, CT) | (newer territory — smaller book) | $42K |

Beth is the real rep from the Audrey API (id 24786). The others are synthetic.

### 1.6 Orders (35 records)

Weighted distribution:
- 12 orders reference `featured_collections` heroes (A Blooming Porch, Gardeners Grove, Herb Garden)
- 8 orders reference `july_release` heroes (Pre-Book Confirmed status)
- 6 orders reference `garden_outdoor` heroes (Shipped/Delivered — steady business)
- 5 orders reference `sale_clearance` (clearing PhaseOut inventory)
- 4 orders are mixed/general

Statuses: Open (5), Submitted (8), Pre-Book Confirmed (8), Shipped (7), Delivered (7)

Each order has 2-4 line items with real SKUs, quantities in case_qty multiples, totals based on retail_price.

### 1.7 Tasks (12 records)

| ID | Title | Lead/Customer | Due | Priority | Status | Used In |
|---|---|---|---|---|---|---|
| T-2001 | Follow up with Wildflower Market on Birdhouse samples | L-9001 | May 15 | High | Overdue | Cap 1 context |
| T-2002 | Send A Blooming Porch catalog to Verdant Home | L-9003 | May 22 | Medium | Open | Cap 3 context |
| T-2003 | PhaseOut clearance call — Golden Meadow Co | C-8008 | May 10 | High | Overdue | Brief |
| T-2004 | Quarterly review — Magnolia Home | C-8001 | May 25 | Medium | Open | Brief |
| T-2005 | Re-engage Harbor Lane Boutique | C-8006 | May 12 | High | Overdue | Brief |
| T-2006 | July 2026 release preview — The Potting Shed | C-8002 | May 28 | Medium | Open | Cap 7 context |
| T-2007 | Confirm pre-book quantities — Bloom & Basket | C-8003 | May 20 | High | Open | Brief |
| T-2008 | First outreach — Rustic Charm Boutique | L-9002 | May 18 | Medium | Overdue | Cap 2 context |
| T-2009 | Prepare merge — Garden Gate vs old record | L-9004 | May 24 | Low | Open | Cap 4 context |
| T-2010 | Set up website access — Lakeside Living | L-9005 | May 26 | Medium | Open | Cap 5 context |
| T-2011 | Build catalog for Mountain Bloom Studio | L-9006 | May 30 | Medium | Open | Cap 6 context |
| T-2012 | Gardeners Grove refill outreach — Seaside Gifts | C-8004 | Jun 01 | Low | Open | General |

---

## LAYER 2: Core Page Reskins

### 2.1 Dashboard Page

**What changes:** KPI tiles + activity feed use Audrey aggregate data.

MetricCards:
- **Active SKUs:** 50 (from PRODUCTS.length)
- **This Week Revenue:** $42,800 (synthetic)
- **Open Orders:** 13 (from orders with status Open or Submitted)
- **Pre-Book Pipeline:** $68,500 (from july_release orders)

Activity Feed (CompactList):
- "Beth closed Pre-Book for Bloom & Basket — 24 cases of Pick Of The Patch" (1h ago)
- "New lead: Rustic Charm Boutique via website signup" (3h ago)
- "Order #1047 shipped to Magnolia Home & Garden" (yesterday)

**Proactive Brief (Dashboard):**
> Good morning, Beth. Two things need your attention.
>
> 🔴 **15 SKUs are in PhaseOut.** Heaviest: *Scalloped Garden Pot — Blue/White* and *Butterfly Garden Stake Set*. Market week is your last clean window.
> *(chip: Draft clearance email)*
>
> 🟡 **July 2026 Virtual Release is 16 days out.** Pre-book on *Pick Of The Patch Gnome* is tracking +18% vs January.
> *(chip: Show pacing table)*
>
> 📊 **Today:** 3 tasks due, 1 new lead in queue, Magnolia quarterly review at 2 PM.

### 2.2 Products Page

**What changes:** Entire grid is Audrey's real catalog.

- 50 products rendered as cards with real images from `image_urls[0]`
- Heroes first (18), then background (32)
- Hero cards get a subtle "Featured" or "New Launch" ribbon
- Filter chips by collection: All | A Blooming Porch | Gardeners Grove | The Herb Garden | Bunnies | Garden Evergreen | PhaseOut
- Stock badges: In Stock (green), Pre-Book (blue), Limited Quantity (amber), PhaseOut (red)
- Card click → EntityDetailCard with real product data (SKU, retail price, case qty, dimensions, materials, image)

**Starter prompts:**
- "How's our July 2026 release pacing?"
- "Show me Featured Collections inventory"
- "Which SKUs are in PhaseOut?"
- "Top-selling birdhouses this quarter"

**Proactive Brief (Products):**
> Your **Featured Collections** are carrying the catalog. *Gardeners Grove* is 42% sold through; *A Blooming Porch* at 38%. Two SKUs — *Birdhouse Planter* and *Herb Garden Stake Set* — are below refill threshold.
> *(chip: Build a Gardeners Grove refill list)*

### 2.3 Orders Page

**What changes:** All 35 synthetic orders, referencing real SKUs.

- Filter chips: All | Open | Submitted | Pre-Book Confirmed | Shipped | Delivered
- Table: Order # | Customer/Lead | Total | Status | Date | Rep | Items
- Pre-Book Confirmed orders show a 📦 icon and ship window (Sep/Oct/Dec)
- Kai-created orders (from Cap 1/2 flows) appear at top with KaiBadge

**Proactive Brief (Orders):**
> 12 orders this week reference Featured Collections SKUs — your spring catalog is moving. 2 Pre-Book Confirmed orders for July 2026 are pending quantity confirmation from Bloom & Basket.
> *(chip: Show Pre-Book orders)*

### 2.4 Customers Page

**What changes:** 8 synthetic customers + leads visible in a secondary tab.

- Card grid showing the 8 customers with lifetime revenue, last order, collection preferences, risk badges
- "At Risk" badge on Harbor Lane (52 days) and Golden Meadow (90 days)
- Each card shows top 3 collections they buy (tag pills)
- Tab: Customers (8) | Leads (6)

**Proactive Brief (Customers):**
> 3 of your **top 10 accounts** haven't reordered Spring inventory in 45+ days: *Harbor Lane Boutique*, *Golden Meadow Co*, and *Seaside Gifts*.
> *(chip: Draft outreach for dormant accounts)*

### 2.5 CRM Page

**What changes:** Leads with stages, tasks with Audrey context, deals pipeline.

- **Tab 1 — Tasks:** 12 tasks, 4 overdue (red badges). Each references a real lead or customer.
- **Tab 2 — Leads:** 6 leads with stage badges (New → Contacted → Qualified → In-Progress → Won). Kanban or list view.
- **Tab 3 — Deals:** 8 deals across Qualified, Proposal Sent, Negotiation, Closed Won stages.

**Proactive Brief (CRM):**
> 4 tasks overdue — highest priority: *Follow up with Wildflower Market* (Beth, 5 days late) and *PhaseOut call for Golden Meadow* (Marcus, 10 days late).
> The *Pick Of The Patch Gnome* pre-book line has been mentioned in 6 buyer calls this month.
> *(chip: Show overdue tasks)*

---

## LAYER 3: The 7 Demo Capabilities

Each capability below is fully specified with: the demo script line, the user query, the fixture structure (widget composition), the follow-up chain, and the shared state mutations.

---

### CAPABILITY 1: Task Creation for Lead + Email Draft (Voice)

**What it proves:** Kai takes voice commands, creates CRM tasks, and chains into email drafting — all referencing real Audrey products.

**Demo script:**
> Beth picks up her headset. She has a note from the Atlanta market — Wildflower Market was interested in the Birdhouse line. She speaks to Kai.

**Flow:**

```
STEP 1: Voice Input
User speaks: "Create a task for Wildflower Market to send them
our Birdhouse collection samples. High priority, due next Friday,
assign to me."

STEP 2: Kai Renders Task Form (fixture-driven)
├── UW-014 AgentReasoningCard (collapsed)
│   └── "Resolved Wildflower Market as Lead L-9001. Building task."
├── UW-003 EntityDetailCard — shows lead summary
│   ├── Name: Wildflower Market
│   ├── Contact: Sarah Chen
│   ├── Stage: Qualified
│   └── Source: Atlanta Market Jan '25
├── AW-004 MultiStepFormWizard — task form (pre-filled from voice)
│   ├── Lead/Customer: "Wildflower Market (Lead)" [locked]
│   ├── Title: "Send Birdhouse collection samples"
│   ├── Type: "Email" [dropdown: Schedule Call, Email, Follow Up, Other]
│   ├── Assigned To: "Beth Calloway" [locked — "me"]
│   ├── Due Date: "2026-05-30" [calculated: next Friday]
│   ├── Priority: "High" [dropdown]
│   └── Status: "Open" [dropdown]
└── AW-012 ConsentBanner
    └── "Create high-priority task 'Send Birdhouse collection samples'
         for Wildflower Market, due May 30, assigned to Beth?"
    └── [Confirm] [Modify] [Cancel]

STEP 3: User clicks Confirm
├── AW-003 ConfirmationDialog — "Task created successfully"
├── SharedCRMContext.addTask(newTask) — appears on CRM page with KaiBadge
├── Deep link to CRM Tasks tab
└── ACTION CHIPS appear:
    ├── "Draft the email now" ← THIS IS THE CHAIN
    ├── "View in CRM"
    └── "Create another task"

STEP 4: User clicks "Draft the email now" (action chip chain)
├── Kai auto-sends: "Draft an email to Sarah Chen at Wildflower Market
│   about our Birdhouse collection samples"
├── UW-014 AgentReasoningCard (collapsed)
│   └── "Drafting email for Wildflower Market. Including Birdhouse heroes."
├── EmailDraftCard renders:
│   ├── To: sarah.chen@wildflowermarket.com
│   ├── Subject: "Audrey's Birdhouse Collection — Samples for Your Review"
│   ├── Body: (LLM-generated in AI mode, fixture in demo mode)
│   │   References specific products:
│   │   - Birdhouse Planter (6FA2329) — case qty 6, $82.50 retail
│   │   - Hanging Birdhouse — Weathered (hero SKU)
│   │   - Mentions Atlanta market connection
│   │   - Offers to set up a sample shipment
│   └── Tone: Professional (from persona)
└── ACTION CHIPS:
    ├── "Make it more casual"
    ├── "Add the July release preview"
    └── "Send it" (POC stub — clipboard copy)
```

**Fixture file:** `src/fixtures/cap1-task-email-voice.json`
**Follow-up fixture:** `src/fixtures/cap1-email-draft.json`
**Keywords:** ["create task", "wildflower", "birdhouse", "samples", "send email"]

---

### CAPABILITY 2: Lead Creation + Automatic Task

**What it proves:** Kai creates CRM entities from chat, and intelligently generates a follow-up task without being asked.

**Demo script:**
> "A new gift shop in Portland just filled out the contact form on our site. Let me add them."

**Flow:**

```
STEP 1: Chat Input
User types: "Add a new lead — Pine & Thistle Gift Shop, contact is
Emma Walsh, emma@pineandthistle.com, they came through the website.
Assign to Hannah."

STEP 2: Kai Renders Lead Creation Form
├── UW-014 AgentReasoningCard
│   └── "No existing lead or customer found for Pine & Thistle.
│        Creating new lead."
├── AW-004 MultiStepFormWizard — 3-step lead form
│   STEP 1 — Basic Info:
│   ├── Company Name: "Pine & Thistle Gift Shop" [pre-filled]
│   ├── Contact Name: "Emma Walsh" [pre-filled]
│   ├── Email: "emma@pineandthistle.com" [pre-filled]
│   ├── Phone: "" [empty — optional]
│   └── Source: "Website" [pre-filled, dropdown]
│
│   STEP 2 — Details:
│   ├── Stage: "New" [default, dropdown: New/Contacted/Qualified/In-Progress/Won]
│   ├── Assigned To: "Hannah Cho" [pre-filled from "Hannah"]
│   ├── Region: "" [empty — optional]
│   └── Notes: "" [textarea — optional]
│
│   STEP 3 — Review:
│   └── Summary card showing all fields
│
└── AW-012 ConsentBanner
    └── "Create lead 'Pine & Thistle Gift Shop' assigned to Hannah Cho?"
    └── [Confirm] [Modify] [Cancel]

STEP 3: User clicks Confirm
├── AW-003 ConfirmationDialog — "Lead created: Pine & Thistle Gift Shop (L-9007)"
├── SharedCRMContext.addLead(newLead) — appears on CRM Leads tab with KaiBadge
│
├── ✨ AUTO-GENERATED FOLLOW-UP (this is the magic moment):
│   Kai immediately renders a SECOND frame below the confirmation:
│   ├── CanvasTextBlock: "I've also created an initial outreach task
│   │   for Hannah — first contact should happen within 48 hours
│   │   for website leads."
│   ├── UW-003 EntityDetailCard — auto-created task preview:
│   │   ├── Title: "First outreach — Pine & Thistle Gift Shop"
│   │   ├── Lead: Pine & Thistle Gift Shop
│   │   ├── Assigned To: Hannah Cho
│   │   ├── Due Date: May 22 (48h from now)
│   │   ├── Priority: Medium
│   │   └── Type: Email
│   └── AW-012 ConsentBanner (lighter — "suggest" tier)
│       └── "Auto-create this follow-up task?"
│       └── [Confirm] [Skip] [Modify]
│
└── ACTION CHIPS:
    ├── "Draft intro email to Emma"
    ├── "View lead in CRM"
    └── "Show me all new leads this week"

STEP 4 (optional): User confirms auto-task
├── Task added to SharedCRMContext
└── Both lead AND task appear on CRM page with KaiBadge
```

**What's new to build:**
- Lead creation form wizard (3-step: Basic → Details → Review)
- Auto-task generation logic: when a lead is created, Kai proposes a follow-up task with smart defaults (48h for website leads, 1 week for trade show leads)
- Second frame emission after confirmation (the "also created" pattern)

**Fixture files:**
- `src/fixtures/cap2-lead-creation.json`
- `src/fixtures/cap2-auto-task-followup.json` (rendered after confirm)

---

### CAPABILITY 3: Lead Stage Movement → Customer Conversion

**What it proves:** Kai manages pipeline progression and knows when stage changes require additional data collection.

**Demo script:**
> "Verdant Home Collective has been in our pipeline for months. They just placed their first order verbally. Let me move them forward."

**Flow:**

```
STEP 1: Chat Input
User types: "Move Verdant Home Collective from In-Progress to Won"

STEP 2: Kai Renders Stage Change + Conversion Prompt
├── UW-014 AgentReasoningCard
│   └── "Found Lead L-9003 (Verdant Home Collective, stage: In-Progress).
│        Moving to Won triggers customer conversion. Collecting required fields."
│
├── UW-003 EntityDetailCard — current lead state
│   ├── Name: Verdant Home Collective
│   ├── Contact: Amy Brooks
│   ├── Stage: In-Progress → Won ✅ (visual transition arrow)
│   ├── Source: Referral from Magnolia
│   └── Rep: Beth Calloway
│
├── CanvasTextBlock:
│   "Moving Verdant Home to Won — great news! 🎉
│    To convert them to a full customer account, I need a few details."
│
├── AW-004 MultiStepFormWizard — Customer Conversion Form
│   STEP 1 — Business Details (mandatory):
│   ├── Legal Business Name: "Verdant Home Collective LLC" [pre-filled from lead]
│   ├── Tax ID / EIN: "" [required, empty]
│   ├── Business Type: [dropdown: Retailer, Wholesaler, Designer, Other]
│   └── Website: "" [optional]
│
│   STEP 2 — Billing & Shipping:
│   ├── Billing Address: [address fields — street, city, state, zip]
│   ├── Shipping Address: [same as billing checkbox + address fields]
│   └── Shipping Notes: "" [textarea]
│
│   STEP 3 — Account Setup:
│   ├── Payment Terms: [dropdown: Net 30, Net 60, COD, Prepaid]
│   ├── Credit Limit: [currency input — suggest $25,000 for referral leads]
│   ├── Price List: [dropdown: Wholesale Tier 1, Wholesale Tier 2, Retail]
│   └── Sales Rep: "Beth Calloway" [locked — carried from lead]
│
│   STEP 4 — Review:
│   └── Summary card with all fields
│
└── AW-012 ConsentBanner
    └── "Convert Verdant Home Collective from lead to customer account
         with these details?"
    └── [Confirm] [Modify] [Cancel]

STEP 3: User fills form + confirms
├── AW-003 ConfirmationDialog:
│   "Customer account created: Verdant Home Collective (C-8009).
│    Lead L-9003 has been archived."
├── SharedCustomersContext.addCustomer(newCustomer)
├── SharedCRMContext.updateLead(L-9003, { stage: 'Won', archived: true })
│
└── ACTION CHIPS:
    ├── "Create their first order"
    ├── "Set up website access" (→ chains to Cap 5!)
    ├── "Build a welcome catalog" (→ chains to Cap 6!)
    └── "View customer profile"
```

**What's new to build:**
- Stage transition rendering (visual arrow: In-Progress → Won)
- Conditional form trigger: "Won" stage requires customer conversion fields
- 4-step customer conversion form
- Dual shared state mutation (lead archived + customer created)

**Fixture file:** `src/fixtures/cap3-lead-stage-won.json`

---

### CAPABILITY 4: Merge Customer Flow

**What it proves:** Kai handles complex data operations with user control over what gets merged.

**Demo script:**
> "We realized The Garden Gate Shop (a lead) is actually the same entity as an old inactive customer record. Let's clean this up."

**Flow:**

```
STEP 1: Chat Input
User types: "Merge Garden Gate Shop with the old Garden Gate customer record"

STEP 2: Kai Shows Both Records Side-by-Side + Merge Selection
├── UW-014 AgentReasoningCard
│   └── "Found Lead L-9004 (The Garden Gate Shop) and
│        Customer C-8050 (Garden Gate — inactive since 2024).
│        Showing both records for merge review."
│
├── UW-015 ComparisonCard (or two EntityDetailCards side-by-side)
│   LEFT — Lead L-9004:              RIGHT — Customer C-8050:
│   ├── Name: The Garden Gate Shop    ├── Name: Garden Gate
│   ├── Contact: David Park           ├── Contact: David Park (same!)
│   ├── Email: david@gardengate.com   ├── Email: dpark@gardengate.com (old)
│   ├── Phone: (404) 555-1234         ├── Phone: (404) 555-1234 (same!)
│   ├── Address: 142 Peach St, ATL    ├── Address: 140 Peach St, ATL (close)
│   ├── Stage: Qualified              ├── Status: Inactive
│   ├── Rep: Hannah Cho               ├── Rep: (unassigned)
│   └── Orders: 0                     └── Orders: 3 (2024, totaling $8,200)
│
├── CanvasTextBlock:
│   "These look like the same business — David Park, same phone,
│    similar address. The old record has 3 historical orders worth $8,200.
│    What would you like to merge?"
│
├── AW-004 MultiStepFormWizard — Merge Selection
│   Single step with checkboxes (multi-select):
│   ├── ☑️ Contact information (keep lead's email, it's newer)
│   ├── ☑️ Shipping address (keep lead's address — 142 Peach St)
│   ├── ☑️ Order history (bring 3 orders from old record)
│   ├── ☑️ Quotes (bring 1 expired quote from old record)
│   ├── ☐ Wishlist (old record has no wishlist — skip)
│   ├── ☑️ Assign rep: Hannah Cho (from lead)
│   └── Merge into: [dropdown: "Keep as Lead" / "Convert to Customer"]
│
└── AW-012 ConsentBanner
    └── "Merge these records? The old customer record will be archived.
         Order history and quotes will transfer to the surviving record."
    └── [Confirm Merge] [Cancel]

STEP 3: User confirms
├── AW-003 ConfirmationDialog:
│   "Records merged. The Garden Gate Shop now has $8,200 in historical orders.
│    Old record C-8050 archived."
├── SharedCRMContext updates
│
└── ACTION CHIPS:
    ├── "View merged record"
    ├── "Create a re-engagement order"
    └── "Draft 'welcome back' email to David"
```

**What's new to build:**
- ComparisonCard layout (side-by-side entity display) — or reuse two EntityDetailCards in a flex row
- Merge selection form with checkboxes
- Merge confirmation with archive logic

**Fixture file:** `src/fixtures/cap4-merge-customer.json`

---

### CAPABILITY 5: User Creation for Website Access

**What it proves:** Kai handles B2B-specific workflows — creating WizShop portal users with pricelist assignment.

**Demo script:**
> "Lakeside Living wants to browse our catalog online. Let me set them up with website access."

**Flow:**

```
STEP 1: Chat Input
User types: "Create a website user for Lakeside Living Co"

STEP 2: Kai Renders User Setup Form
├── UW-014 AgentReasoningCard
│   └── "Found Lead L-9005 (Lakeside Living Co). Setting up WizShop user."
│
├── UW-003 EntityDetailCard — lead context
│   ├── Name: Lakeside Living Co
│   ├── Contact: Rachel Torres
│   ├── Email: rachel@lakesideliving.com
│   └── Stage: Contacted
│
├── AW-004 MultiStepFormWizard — User Creation
│   STEP 1 — Account Details:
│   ├── Username: "rachel.torres" [auto-suggested from contact name]
│   ├── Email: "rachel@lakesideliving.com" [pre-filled from lead]
│   ├── Role: [dropdown: Buyer, Browse Only, Admin]
│   └── Status: "Active" [default]
│
│   STEP 2 — Access Configuration:
│   ├── 🔑 **Which price list should this user see?**
│   │   [dropdown with descriptions:]
│   │   ├── Wholesale Tier 1 — Standard wholesale (50-55% off retail)
│   │   ├── Wholesale Tier 2 — Volume wholesale (55-60% off retail)
│   │   ├── Retail — Full MSRP (browse-only, no wholesale pricing)
│   │   └── Custom — Contact admin to configure
│   ├── Customer Access: [dropdown: "Lakeside Living Co only" / "All" / "Self"]
│   ├── Order Access: [dropdown: "Self" / "Self + Assigned" / "All"]
│   └── Can Place Orders: [toggle — default ON for Buyer role]
│
│   STEP 3 — Review + Notification:
│   ├── Summary of all settings
│   └── ☑️ Send welcome email with login credentials
│
└── AW-012 ConsentBanner
    └── "Create WizShop user 'rachel.torres' for Lakeside Living Co
         with Wholesale Tier 1 pricing?"
    └── [Create User] [Modify] [Cancel]

STEP 3: User confirms
├── AW-003 ConfirmationDialog:
│   "Website user created. Rachel Torres can now log in at
│    shop.audreys.com. Welcome email sent."
│
└── ACTION CHIPS:
    ├── "Build a catalog for Lakeside Living" (→ Cap 6!)
    ├── "Create their first wishlist"
    └── "View user in manage panel"
```

**What's new to build:**
- User creation form with pricelist dropdown (this is the key follow-up question)
- Access configuration step (customer access, order access, permissions)
- Welcome email toggle

**Fixture file:** `src/fixtures/cap5-user-creation.json`

---

### CAPABILITY 6: Create Wishlist / Catalog Against a Lead

**What it proves:** Kai can curate product selections from the real catalog, creating shareable assets for leads.

**Demo script:**
> "Mountain Bloom Studio in Asheville is interested in garden décor. Let me build them a curated catalog."

**Flow:**

```
STEP 1: Chat Input
User types: "Build a catalog for Mountain Bloom Studio focused on
garden outdoor and the Herb Garden collection"

STEP 2: Kai Renders Catalog Builder
├── UW-014 AgentReasoningCard
│   └── "Found Lead L-9006 (Mountain Bloom Studio). Filtering catalog
│        for garden_outdoor and Herb Garden collection. Found 11 matching SKUs."
│
├── UW-003 EntityDetailCard — lead context
│   ├── Name: Mountain Bloom Studio
│   ├── Contact: Julia Reed
│   └── Interest: Garden décor, natural materials
│
├── CanvasTextBlock:
│   "Here's a curated selection for Mountain Bloom — 11 products from your
│    Garden Outdoor line and The Herb Garden collection. I've put the hero
│    pieces first."
│
├── UW-009 ProductCardGrid (or UW-004 DataTable with product images)
│   Shows 11 products in a grid:
│   ├── 🌟 Herb Garden Stake Set (hero) — $28.50, case of 12, In Stock
│   ├── 🌟 Birdhouse Planter (hero) — $82.50, case of 6, In Stock
│   ├── 🌟 Terracotta Herb Pot — Sage (hero) — $18.00, case of 12, In Stock
│   ├── Hanging Birdhouse — Weathered — $45.00, case of 6, In Stock
│   ├── Garden Gnome — Welcome (background) — $32.00, case of 4, Low Stock
│   └── ... (6 more)
│   Each card: product image, name, SKU (mono), retail price, case qty, stock badge
│
├── AW-004 — Catalog Configuration
│   ├── Catalog Name: "Mountain Bloom — Garden Collection" [editable]
│   ├── Include Pricing: [toggle — ON shows retail, OFF hides prices]
│   ├── Include Stock Levels: [toggle]
│   ├── Format: [dropdown: Digital Catalog / PDF / Shareable Link]
│   └── Add Personal Note: [textarea — "Hi Julia, here are my top picks..."]
│
└── AW-012 ConsentBanner
    └── "Create catalog 'Mountain Bloom — Garden Collection' with
         11 products? This will be saved to your catalogs."
    └── [Create Catalog] [Add/Remove Products] [Cancel]

STEP 3: User confirms
├── AW-003 ConfirmationDialog:
│   "Catalog created with 11 products. Saved to My Catalogs."
│
└── ACTION CHIPS:
    ├── "Email this catalog to Julia"
    ├── "Add Bunnies collection products"
    ├── "Convert to wishlist"
    └── "View in My Catalogs"
```

**What's new to build:**
- Product grid filtered by collection/bucket (uses `byBucket` + `byCollection` accessors)
- Catalog configuration form (name, pricing toggle, format, personal note)
- Catalog saved to ArtifactContext (new category: "Catalogs")

**Fixture file:** `src/fixtures/cap6-catalog-creation.json`

---

### CAPABILITY 7: Reports (6 Hyper-Relevant Dashboards)

**What it proves:** Kai generates analytics dashboards using Audrey's actual data, not generic charts.

All 6 reports use the existing `UW-030 DashboardCompositeWidget` composing existing sub-widgets. No new components needed — just new fixture data.

#### Report 1: Collection Performance (Sales Rep Facing)

**Query:** "Show me how my collections are performing"

```
DashboardCompositeWidget (grid-2x3):
├── [0,0 span 2] MetricCardRow:
│   ├── A Blooming Porch: $48,200 revenue, +22% vs last quarter
│   ├── Gardeners Grove: $36,800, +15%
│   ├── The Herb Garden: $21,400, +8%
│   └── Bunnies: $12,100, -5% (seasonal decline — expected)
├── [1,0] LineChart: "Collection Revenue — Weekly Trend"
│   4 lines, one per collection, 8-week window
├── [1,1] DataTable: "Top 5 SKUs by Collection Revenue"
│   Hero products with SKU, name, collection, units, revenue
├── [2,0] DataTable: "Refill Opportunities"
│   Customers whose last collection order was 30+ days ago
└── [2,1] CompactList: "PhaseOut Watch"
    Products in sale_clearance with <50 units remaining
```

#### Report 2: Pre-Book Pacing (Sales Rep Facing)

**Query:** "Show me July 2026 release pacing"

```
DashboardCompositeWidget (grid-2x2):
├── [0,0 span 2] MetricCardRow:
│   ├── July Pre-Book Orders: 18 (vs 14 at same point for Jan release)
│   ├── Pre-Book Revenue: $68,500 (+28% vs Jan pacing)
│   ├── Top Pre-Book SKU: Pick Of The Patch Gnome
│   └── Days to Release: 16
├── [1,0] LineChart: "Pre-Book Pacing: July 2026 vs January 2025"
│   Two lines showing cumulative pre-book orders over time
└── [1,1] DataTable: "Pre-Book by Customer"
    Customer, SKUs ordered, total, confirmation status
```

#### Report 3: Customer Health (Sales Rep Facing)

**Query:** "Show me my customer health dashboard"

```
DashboardCompositeWidget (grid-2x3):
├── [0,0 span 2] MetricCardRow:
│   ├── Active Customers: 6 / 8
│   ├── At-Risk: 2 (Harbor Lane, Golden Meadow)
│   ├── Avg Reorder Cycle: 34 days
│   └── This Quarter Revenue: $142,800
├── [1,0] LineChart: "Customer Reorder Frequency"
├── [1,1] DataTable: "Accounts Needing Attention"
│   Customers with days_since_last_order > 30
├── [2,0 span 2] CompactList: "Upcoming Renewals & Reviews"
    Quarterly reviews, annual contracts, re-engagement candidates
```

#### Report 4: Pipeline & Lead Conversion (Sales Rep Facing)

**Query:** "What does my pipeline look like?"

```
DashboardCompositeWidget (grid-2x2):
├── [0,0 span 2] MetricCardRow:
│   ├── Pipeline Value: $186K (Beth's territory)
│   ├── Leads in Queue: 6
│   ├── Avg Time to Convert: 42 days
│   └── Conversion Rate: 68%
├── [1,0] DataTable: "Leads by Stage"
│   Name, stage, days in stage, next action, rep
└── [1,1] CompactList: "Deals Closing This Month"
    Deals with close dates in current month
```

#### Report 5: Team Performance (Admin Facing)

**Query:** "Show me the team performance report"

```
DashboardCompositeWidget (grid-2x3):
├── [0,0 span 2] MetricCardRow:
│   ├── Team Revenue (Q2): $384,200
│   ├── Orders: 67
│   ├── New Customers: 3
│   └── Avg Order Value: $5,734
├── [1,0] DataTable: "Performance by Rep"
│   Rep, revenue, orders, conversion %, active customers, pipeline
│   (Beth leading, James newest/smallest)
├── [1,1] LineChart: "Revenue by Rep — Weekly"
│   4 lines, one per rep
├── [2,0] DataTable: "Top Accounts by Rep"
│   Which rep owns which high-value accounts
└── [2,1] CompactList: "Overdue Tasks by Rep"
    Who has the most overdue items
```

#### Report 6: Catalog Health (Admin Facing)

**Query:** "Show me catalog health"

```
DashboardCompositeWidget (grid-2x3):
├── [0,0 span 2] MetricCardRow:
│   ├── Active SKUs: 50
│   ├── In Stock: 35
│   ├── Low Stock / Limited: 8
│   ├── PhaseOut: 15
├── [1,0] DataTable: "Inventory by Collection"
│   Collection name, SKU count, total units, sell-through %
├── [1,1] LineChart: "Stock Depletion Trend"
│   Projected stockout dates for low-stock items
├── [2,0 span 2] DataTable: "PhaseOut Clearance Priority"
    SKU, name, remaining units, days in PhaseOut, suggested action
    With urgent highlights on items with <10 units
```

**Fixture files:** One per report:
- `src/fixtures/report-collection-performance.json`
- `src/fixtures/report-prebook-pacing.json`
- `src/fixtures/report-customer-health.json`
- `src/fixtures/report-pipeline.json`
- `src/fixtures/report-team-performance.json`
- `src/fixtures/report-catalog-health.json`

**Query matching:** Add to queryMatcher:
- "collection performance" / "how are collections" → report 1
- "pre-book pacing" / "july release" / "july 2026" → report 2
- "customer health" / "account health" → report 3
- "pipeline" / "lead conversion" / "my pipeline" → report 4
- "team performance" / "rep performance" → report 5
- "catalog health" / "inventory status" / "stock levels" → report 6

---

## What's New to Build (Component-Level)

### New Fixtures (not components — just JSON data)

| Fixture | Capability | Widgets Used |
|---|---|---|
| cap1-task-email-voice.json | 1 | UW-014, UW-003, AW-004, AW-012, AW-003 |
| cap1-email-draft.json | 1 (chain) | UW-014, EmailDraftCard |
| cap2-lead-creation.json | 2 | UW-014, AW-004 (3-step), AW-012, AW-003 |
| cap2-auto-task-followup.json | 2 (auto) | UW-003, AW-012 |
| cap3-lead-stage-won.json | 3 | UW-014, UW-003, AW-004 (4-step), AW-012 |
| cap4-merge-customer.json | 4 | UW-014, UW-003 ×2 (side-by-side), AW-004, AW-012 |
| cap5-user-creation.json | 5 | UW-014, UW-003, AW-004 (3-step), AW-012 |
| cap6-catalog-creation.json | 6 | UW-014, UW-003, UW-009/UW-004, AW-004, AW-012 |
| 6 report fixtures | 7 | UW-030 composing existing widgets |

### New Shared Context Mutations

| Context | New Methods | Used By |
|---|---|---|
| SharedCRMContext | `addLead()`, `updateLeadStage()`, `archiveLead()` | Cap 2, 3, 4 |
| SharedCustomersContext | `addCustomer()` (from lead conversion) | Cap 3 |
| SharedCRMContext | `addTask()` (already exists from UC-2) | Cap 1, 2 |

### New Form Wizard Configurations

| Form | Steps | Capability |
|---|---|---|
| Lead Creation | Basic → Details → Review | Cap 2 |
| Customer Conversion | Business → Billing/Shipping → Account Setup → Review | Cap 3 |
| Merge Selection | Single step with checkboxes + merge-into dropdown | Cap 4 |
| User Creation | Account Details → Access Config → Review | Cap 5 |
| Catalog Config | Single step: name, toggles, format, note | Cap 6 |

### New Query Keywords

Add to queryMatcher / capability router:

| Keywords | Route To |
|---|---|
| "create task for [lead]", "follow up with" | Cap 1 fixture |
| "add lead", "new lead", "create lead" | Cap 2 fixture |
| "move [lead] to won", "convert lead", "stage to won" | Cap 3 fixture |
| "merge [entity]", "combine records", "duplicate" | Cap 4 fixture |
| "create user", "website access", "wizshop user" | Cap 5 fixture |
| "build catalog", "create wishlist", "curated catalog" | Cap 6 fixture |
| "collection performance", "pre-book pacing", "customer health", "pipeline", "team performance", "catalog health" | Report 1-6 |

### LLM System Prompt Update

Add the Audrey context block from the integration guide (§9) into the prompt assembly, between page context and capability prompt:

```
You are Kai, an AI sales assistant for Audrey's Home & Gift, a wholesale
home decor and gift brand. The catalog is organized into Pre-Book pre-orders,
Seasonal ranges, and Home & Garden evergreen lines. Current key collections:
A Blooming Porch, Gardeners Grove, The Herb Garden, Bunnies. Next major
launch: July 2026 Virtual Release.

When mentioning products, use actual SKUs and names from the catalog.
Audrey reps care about: case quantity, minimum order qty, pre-book ship
windows (Sep/Oct/Dec), PhaseOut clearance. Price references use retail/MSRP.
```

---

## Demo Script — Full Run (22 minutes)

### Opening: Morning Brief (2 min)
- App loads → Beth's morning brief: PhaseOut urgency, July release pacing, tasks due
- "This is what Beth sees before her first coffee."

### Act 1: Task + Email via Voice — Cap 1 (3 min)
- Voice: "Create a task for Wildflower Market to send Birdhouse samples"
- Form renders pre-filled → Confirm → Task created
- Click "Draft the email now" → email with real product names → "Make it more casual"
- **Beat:** "Voice to task to email. Three steps, zero typing."

### Act 2: Lead Creation — Cap 2 (2 min)
- "Add Pine & Thistle Gift Shop as a lead, contact Emma Walsh"
- 3-step form → Confirm → Auto-task generated
- "Kai didn't just create the lead — it knew to schedule the first outreach."

### Act 3: Lead → Customer Conversion — Cap 3 (3 min)
- "Move Verdant Home Collective to Won"
- Stage transitions, conversion form appears with business details
- Fill mandatory fields → Confirm → Customer created, lead archived
- **Beat:** "Pipeline to customer in one conversation."

### Act 4: Merge — Cap 4 (2 min)
- "Merge Garden Gate Shop with the old customer record"
- Side-by-side comparison → checkbox selection → Confirm
- "Historical orders preserved. One clean record."

### Act 5: Website User — Cap 5 (2 min)
- "Create website access for Lakeside Living"
- User form with pricelist question → Select Wholesale Tier 1 → Confirm
- "The pricelist question is the key — Kai knows this is a B2B decision."

### Act 6: Catalog Builder — Cap 6 (2 min)
- "Build a catalog for Mountain Bloom Studio focused on garden outdoor"
- Product grid with real images → catalog config → Confirm
- "A shareable, branded catalog built from one sentence."

### Act 7: Reports — Cap 7 (3 min)
- "Show me collection performance" → dashboard with Audrey data
- "What does my pipeline look like?" → pipeline dashboard
- "Show me team performance" → admin dashboard
- "These aren't canned reports — they're composed from your live data."

### Act 8: Page Intelligence (2 min)
- Navigate to Products page → real Audrey products with images
- Navigate to CRM → leads with pipeline stages, tasks with real context
- "Kai is embedded in every page — not a separate tool."

### Close (1 min)
- "Everything you saw — the products, the collections, the SKUs — that's your data. This is Kai speaking Audrey's language on day one."

---

## Build Sequence (Parallelizable Across Your Army)

### Track A — Data Foundation (1 person)
1. Drop Audrey files + types + accessors
2. Author all synthetic data (customers, leads, reps, orders, tasks, deals)
3. Wire `src/data/audreys/index.ts` exports

### Track B — Core Page Reskins (1 person)
1. Dashboard page → Audrey metrics + brief
2. Products page → real catalog grid
3. Orders page → synthetic orders with real SKUs
4. Customers page → synthetic customers
5. CRM page → leads with stages, tasks, deals

### Track C — Capabilities 1-3 (1 person)
1. Cap 1 fixture + task form + email chain
2. Cap 2 fixture + lead creation form + auto-task
3. Cap 3 fixture + stage transition + conversion form

### Track D — Capabilities 4-6 (1 person)
1. Cap 4 fixture + merge comparison + checkbox form
2. Cap 5 fixture + user creation form + pricelist step
3. Cap 6 fixture + catalog builder + product grid

### Track E — Reports + Polish (1 person)
1. 6 report fixtures (dashboard composites with Audrey data)
2. QueryMatcher keyword additions
3. LLM system prompt update
4. Action chip map updates
5. Proactive brief rewrites (5 pages)

### Track F — Integration + Demo Prep (you)
1. Wire all new fixtures into capability router
2. Shared context mutations for new flows
3. End-to-end dry run
4. Fix edge cases
5. Demo rehearsal ×3
