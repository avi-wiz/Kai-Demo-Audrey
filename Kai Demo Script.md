# Kai — Demo Script & Prompt Library

A complete catalog of every demo-stable prompt in the Kai vDemo build, with every live keyword variant and the exact output to expect. Use this as a handoff sheet for sales-led demos.

**Demo persona:** Heman Bhullar (Sales Ops at Audrey's Home & Gift)
**Demo company:** Audrey's Home & Gift (real wholesale home decor brand)
**Demo date assumption:** May 20, 2026

> **How matching works:** Each capability has a **keyword set**. Any user input that contains ANY of the listed phrases (case-insensitive substring match) fires that capability. You can wrap a keyword in a longer sentence — e.g., the keyword `"inventory status"` fires for "What is my inventory status?", "Tell me my inventory status quickly.", etc.
>
> **First-match-wins order:** Page Context → Dashboard Routes → Special Routes → Chip Spawns → Capability Routes → Email Pre-router → SKU-lookup guard → LLM classifier → keyword fallback.

---

## Section 1 — The 7 Scripted Capabilities (Caps 1–7)

These form the **core 22-minute demo flow**. Each one is a multi-step staged workflow with a Reasoning Card → Detail Card → Form Wizard → Consent Banner → Confirmation Dialog.

### Cap 1 — Voice → Task → Email

**Live keywords (cap1-task-email):**
- `wildflower`
- `birdhouse`
- `samples`
- `send email to wildflower`
- `create a task`
- `create task`

**Live keywords (cap1-email-draft) — fires on follow-up chip:**
- `draft the email for wildflower`
- `draft email for wildflower`
- `draft the email now`
- `send the email`
- `rewrite the email`
- `add the july 2026 release preview to the email`

**Expected output (cap1-task-email):**
Reasoning card → Lead 360 (L-9001 Wildflower Market, Sarah Chen, Beth Calloway as rep) → 3-step form wizard (task title, due date, priority pre-filled with the Birdhouse sample narrative) → Consent banner → Confirmation dialog. End chips include **"Draft the email for Wildflower Market now"**.

**Expected output (cap1-email-draft):**
Email Draft card pre-filled with Sarah's address, subject line about Birdhouse samples + the July 2026 release preview, editable body referencing the just-created task. Chips: "Send the email", "Make it shorter", "Add the July 2026 release preview to the email".

### Cap 2 — Lead Creation + Auto-Task

**Live keywords:**
- `add lead`
- `new lead`
- `create lead`
- `pine and thistle`
- `pine & thistle`

**Expected output:** Reasoning → 3-step lead-creation wizard (contact, address, preferred collections) → Consent banner → Confirmation. Immediately spawns a **second** auto-task card prompting Heman to schedule the first outreach call.

### Cap 3 — Lead → Customer Conversion

**Live keywords:**
- `move to won`
- `convert lead`
- `stage to won`
- `verdant home`
- `verdant`

**Expected output:** Reasoning → Lead 360 (L-9003 Verdant Home Collective) showing the stage transition arrow Qualified → Won → 4-step conversion wizard (terms, pricelist, credit limit, billing contact) → Consent banner → Confirmation. Chips: **"Set up website access"** (→ Cap 5), **"Build a welcome catalog"** (→ Cap 6).

### Cap 4 — Merge Customer Records

**Live keywords:**
- `merge`
- `combine records`
- `duplicate`
- `garden gate`

**Expected output:** Reasoning → Two Lead 360 cards side-by-side (L-9004 Garden Gate vs legacy C-8050) → Multi-step merge wizard with checkbox per field showing which side wins → Consent banner → Confirmation.

### Cap 5 — Website User Creation

**Live keywords:**
- `create user`
- `website access`
- `wizshop user`
- `lakeside living`
- `lakeside`

**Expected output:** Reasoning → Lead 360 (L-9005 Lakeside Living, Rachel Torres) → 3-step user-creation wizard (login, password setup, pricelist dropdown showing Retail/Wholesale/MSRP options) → Consent banner → Confirmation. Chip: **"Build a catalog for Lakeside Living"** (→ Cap 6).

### Cap 6 — Catalog Builder

**Live keywords:**
- `build catalog`
- `create wishlist`
- `curated catalog`
- `mountain bloom`

**Expected output:** Reasoning → Lead 360 (L-9006 Mountain Bloom, Julia Reed) → Product grid showing 8 Garden Evergreen + Gardeners Grove SKUs with real Audrey imagery → Catalog config wizard → Consent → Confirmation.

### Cap 7 — The 6 Reports

Each report is a full dashboard built from UW-030 DashboardCompositeWidget with metric tiles, line charts, lists, and tables. Each has a built-in **Save as Dashboard** consent banner. Confirming saves to My Artifacts → Dashboards & Reports.

#### Collection Performance

**Live keywords:**
- `collection performance`
- `how are collections`
- `collection report`

**Expected output:** Revenue by collection (A Blooming Porch leads), weekly trend chart, top 5 SKUs table, refill opportunities, PhaseOut watch list.

#### Pre-Book Pacing

**Live keywords:**
- `pre-book pacing`
- `july release`
- `july 2026`
- `release pacing`

**Expected output:** September/October/December ship-window queues, customer commit table, missing-commit alerts.

#### Customer Health

**Live keywords:**
- `customer health`
- `account health`
- `customer dashboard`
- `customer retention`
- `dormant customer`
- `churn dashboard`
- `retention dashboard`

**Expected output:** Risk segmentation (Active/Warning/Dormant), days-since-last-order tiles, dormant-account re-engagement list.

#### Pipeline

**Live keywords:**
- `pipeline`
- `lead conversion`
- `my pipeline`
- `pipeline report`
- `pipeline dashboard`
- `pipeline health`
- `open quotes`
- `quote pipeline`
- `deal pipeline`
- `show pipeline`

**Expected output:** Funnel by stage, deal velocity, win/loss reasons, deals by rep.

#### Team Performance

**Live keywords:**
- `team performance`
- `rep performance`
- `team report`

**Expected output:** YTD revenue by rep (Beth $186K leads), territory map, deal volume by rep, quota attainment.

#### Catalog Health

**Live keywords:**
- `catalog health`
- `stock levels`
- `catalog report`

**Expected output:** 50 SKU breakdown across 7 buckets, sell-through by collection, PhaseOut clearance priority.

---

## Section 2 — Operational Queries (newly demo-stable)

These six queries cover the questions any sales leader naturally types. All deterministic — no LLM in the loop for the routing.

### 1. Inventory Status

**Live keywords:**
- `inventory status`
- `what's my inventory`
- `what is my inventory`
- `status of my inventory`
- `status of inventory`
- `sku status`
- `stock breakdown`

**Expected output:** UW-014 reasoning + **1×4 SKU-count table**: Total 50 / In-Stock 35 / Back-order 7 / In-Transit 5. Closing-text insight about PhaseOut overlap.

### 2. Recent Order Status

**Live keywords:**
- `status of my orders`
- `status of my recent orders`
- `orders placed recently`
- `recent order status`
- `how are my orders`

**Expected output:** UW-014 + 5 status-count tiles (Open 5 / Submitted 8 / Pre-Book Confirmed 8 / Shipped 5 / Delivered 9) + 15-row table of the most recent orders.

### 3. Leads Status

**Live keywords:**
- `status of my leads`
- `my leads`
- `how are my leads`
- `lead status`
- `leads status`

**Expected output:** UW-014 + 3 stage-count tiles (New 1 / Contacted 1 / Qualified 4) + 6-row leads table. Verdant Home highlighted ready-to-convert; Rustic Charm flagged as needing outreach.

### 4. Customers by SKU (three hero SKUs)

**4a — Bird Pot Feet — Live keywords:**
- `51gr1907`
- `bird pot feet`

**Expected output:** UW-014 + 3-row customer table (Magnolia, Potting Shed, Sunflower & Sage). Closing-text: PhaseOut clearance urgency.

**4b — Cement Bird Feeder — Live keywords:**
- `51gr1776-u`
- `51gr1776`
- `cement bird feeder`

**Expected output:** UW-014 + 4-row customer table (Potting Shed, Magnolia, Bloom & Basket, Seaside Gifts). Closing-text: top-seller reorder cadence.

**4c — A Blooming Porch — Live keywords:**
- `51gr1522-u`
- `51gr1522`
- `blooming porch`
- `a blooming porch`
- `porch lead`

**Expected output:** UW-014 + 5-row customer table. Closing-text: spring catalyst narrative; suggests outreach to Harbor Lane + Golden Meadow.

**Negative test (worth showing):** `Customers who purchased Garden Stake in the last 15 days` → Kai replies with the "I don't have that capability yet" graceful-fail message instead of misrouting. Demonstrates the guardrails.

### 5. Order Status Clarification (multi-turn)

**Live keywords:**
- `current status of the order`
- `status of the order`
- `check order status`
- `where is my order`

**Expected output (first turn):** UW-014 + AW-006 ClarificationCard listing 5 recent orders as radio options (O-50034, O-50027, O-50007, O-50013, O-50001).

**Expected output (second turn — after picking one):** UW-003 detail card with that order's live status (Open / Submitted / Pre-Book Confirmed / Shipped) and a plain-language closing-text.

### 6. Open Orders

**Live keywords:**
- `list of open orders`
- `open orders`
- `show open orders`
- `pending orders`

**Expected output:** UW-014 + 4 status tiles (Open 5 / Submitted 8 / Pre-Book Confirmed 8 / Shipped 5) + 15-row table with a **Ship Window** column showing "Immediate", "Sep 2026", "Oct 2026".

---

## Section 3 — Customer Intelligence (uc1)

The general matcher returns uc1 (Customer 360) when these conditions are met.

### Magnolia 360 — always-on

**Triggers (any of):**
- Any message containing `magnolia` (without `revenue` / `follow` / `task` keywords, which would route to uc3 instead)
- Any "how's / hows / doing / tell me about" phrase **combined with** customer/account/client OR any of:
  - `c-8001`, `c-8002`, `c-8003`, `c-8004`, `c-8005`, `c-8006`, `c-8007`, `c-8008`
  - `potting shed`, `bloom`, `seaside`, `copper creek`, `harbor lane`, `sunflower`, `golden meadow`

**Sample prompts:**
- `How's Magnolia Home & Garden doing?`
- `Tell me about Magnolia`
- `Pull up Magnolia`
- `How is C-8003 doing as a customer?`
- `Tell me about Sunflower & Sage account`

**Expected output:** UW-014 → UW-007 Customer 360 (C-8001, Jennifer Holloway, Beth Calloway, $186K YTD) → Revenue trend line chart (12 months) → Open Tasks compact list (3 tasks incl. July pre-book overdue) → "View Full Profile" deep link.

### Meeting Prep

**Live keywords:**
- `prep me`
- `prep for meeting`
- `meeting prep`
- `next meeting`
- `prep for my next meeting`
- `meeting brief` *(also covered by SR-14 — same fixture wins on substring)*
- `pre-meeting brief`
- `prepare for meeting`
- `prepare me for`

**Expected output:** Meeting Prep card — Tomorrow 10 AM with Jennifer, talking points (YTD up 18%, A Blooming Porch look-book, July pre-book lock-in), recent activity feed.

### Magnolia Order History

**Live keywords:**
- `recent orders`
- `order history`
- `past orders`
- `previous orders`
- `'s recent orders` (e.g., "magnolia's recent orders")
- `show order history`
- `orders for magnolia`
- `magnolia orders`
- `orders from magnolia`
- `magnolia home orders`

**Expected output:** Recent Orders table for Magnolia — 8 orders, status badges, $24.5K most recent.

---

## Section 4 — Special Routes (SR series — surface flows)

### SR-2 — Reorder

**Live keywords:**
- `reorder`
- `restock magnolia`
- `amend this order`

**Expected output:** Reasoning → Order detail card → Reorder form wizard with line items pre-filled from a previous order → Consent → Confirmation.

### SR-11 — Invoice

**Live keywords:**
- `overdue invoice`
- `payment due`
- `show me overdue`
- `show me invoice`
- `pull up invoice`
- `invoice for magnolia`

**Expected output:** Reasoning → Invoice entity card with payment status, line items, balance due → suggested-action chips (send reminder, mark paid).

### SR-14 — Meeting Brief

**Live keywords:**
- `meeting brief`
- `action items from meeting`
- `meeting summary`
- `post-meeting`

**Expected output:** Compact list of action items, owners, due dates extracted from a notional meeting transcript.

### SR-20 — Outreach Email

**Live keywords:**
- `outreach`
- `outreach email`
- `campaign message`
- `campaign email`
- `re-engagement email`

**Expected output:** Email Draft card targeted at dormant accounts, with editable subject + body referencing real Audrey collections.

---

## Section 5 — Admin / Approval Flows (AD series)

### AD-1 — Approval Queue

**Live keywords:**
- `approval queue`
- `pending approval`
- `pending approvals`
- `waiting for approval`
- `waiting for my approval`
- `waiting on my approval`
- `awaiting approval`
- `awaiting my approval`
- `needs my approval`
- `need my approval`

**Expected output:** Reasoning → Data table of 4–6 items awaiting approval (orders, returns, credit overrides) → bulk action chips: **"Approve all standard"**, **"Show details on flagged items"**.

### AD-1 Chip Follow-ups

**Live keywords (ad1-approved):**
- contains both `approve all` AND `standard`

**Expected output:** AD-1 Approved confirmation card showing what was actioned.

**Live keywords (ad1-flagged):**
- `details on the flagged`
- `flagged items`

**Expected output:** AD-1 Flagged card surfacing the held items with reason codes.

### AD-3 — Rep Handoff

**Live keywords:**
- `rep handoff`
- `reassign rep`
- `account transition`
- `territory rebalance`

**Expected output:** Side-by-side rep cards (outgoing/incoming), accounts moving over, handoff form wizard with notes, consent, confirmation.

### AD-17 — Quarterly Report Builder

**Live keywords:**
- `q1 sales report`
- `quarterly report`
- `build me a report`
- `monthly report`
- `sales report`

**Expected output:** Reasoning → Metric row → Editable chart → suggested-metric chips. Chip: **"Add more metrics"** → opens AW-006 multi-select clarification card pulling from the metric catalog. Confirming adds the picked metrics inline.

### AD-29 — Workflow Setup

**Trigger:** Any vague workflow request (e.g., `set up a workflow`, `I want a workflow`) without naming a specific workflow id. Detection lives in `ChatShell` — looks for "workflow" + lack of a known catalog name.

**Expected output (clarification turn):** AW-006 single-select clarification card listing workflows from the catalog. Pick one → AD-29 Workflow turn renders with trigger config, audience preview, test chip.

### AD-29 Chip Follow-up

**Live keywords (ad29-test):**
- `which records would have triggered`
- contains both `sample data` AND `workflow`

**Expected output:** AD-29 Test card showing 3–5 sample records that would have fired the workflow.

### Chip Spawn — Compare Side-by-Side (sr2-compare)

**Live keywords:**
- `side-by-side`
- `side by side`
- `with the original order`

**Expected output:** Two-column comparison view of the new vs original order (typically fired from an SR-2 reorder chip).

---

## Section 6 — Dashboard Builder (free-form)

### Sales Performance Dashboard

**Live keywords:**
- `sales dashboard`
- `sales performance`
- `build me a dashboard`
- `build a dashboard`
- `build a sales`
- `create a dashboard`
- `create a sales`
- `rep performance` *(also covered by Team Performance — fixtures share the keyword; the first-found wins per FIND order)*
- `revenue dashboard`
- `save this as a dashboard`
- `save as dashboard`

**Expected output:** UW-030 **Sales Performance** dashboard — YTD revenue tile, rep leaderboard, monthly trend, customer concentration chart. Edit/Save/Download buttons rendered on hover.

### Order Analytics Dashboard

**Live keywords:**
- `order analytics`
- `order dashboard`
- `order volume`
- `fulfillment dashboard`
- `orders dashboard`

**Expected output:** UW-030 **Order Analytics** dashboard — order volume by week, fulfillment SLAs, status distribution, late-shipment list.

### Save Any Rendered Dashboard

**Live keywords:**
- `save this as a dashboard`
- `save as dashboard`

**Expected output:** Save modal → on confirm, the dashboard appears in My Artifacts → Dashboards section with the live-render thumbnail.

---

## Section 7 — Page Context Queries

These activate when the user is on a WizOrder page (Dashboard / Products / Orders / Customers / CRM) and click "Ask Kai". Each page's starter prompts are pre-authored in `page-context-*.json` fixtures. Sample prompts to try on each page:

### Dashboard page
- `What's the most urgent thing today?`
- `What should I focus on?`
- `Show me the morning brief`

**Expected output:** Brief calling out PhaseOut clearance + July pre-book pacing + overdue tasks.

### Products page
- `What's selling best this week?`
- `Top SKUs this week`
- `Which products are low on stock?`

**Expected output:** Top-SKU table from the visible bucket, with refill suggestions.

### Orders page
- `Which orders need attention?`
- `Show me the orders that are stalled`
- `What's overdue?`

**Expected output:** Filtered list of Open + Pre-Book stalled orders with rep ownership.

### Customers page
- `Who's gone quiet?`
- `Which accounts are at risk?`
- `Dormant customers`

**Expected output:** Dormant-account list (last order >45 days), tied to re-engagement chips.

### CRM page
- `What's overdue?`
- `Show me overdue tasks`
- `What did we agree on with Pick Of The Patch?`

**Expected output:** 4 overdue tasks across the team with assigned reps and due dates.

---

## Section 8 — Email Pre-router

Outside the capability routes, any query containing `email` or `draft` (without other capability-trigger keywords) routes to the email pre-router.

**Live keywords:**
- Anything containing `email` OR `draft`
- If the query also contains `shorter` / `shorten` / `concise` → routes to **email-shorter** (compresses an existing draft)
- Otherwise → routes to **email-draft** (general drafting)

**Expected output:** Email Draft card with editable subject + body, regenerated by the LLM around the current turn's context.

---

## Section 9 — General Classification (uc2 / uc3)

When nothing above matches and AI mode is on, the LLM classifier picks between uc2/uc3/unknown. Keyword fallback also handles uc2:

### uc2 — Task Creation

**Trigger:** Any message containing BOTH `create` AND `task`.

**Sample prompts:**
- `Create a task to follow up with The Potting Shed next week`
- `Create a task — send Bloom & Basket the new look-book`

**Expected output:** uc2 staged-form flow — Reasoning → Lead/Customer 360 → Task form wizard → Consent → Confirmation.

### uc3 — Magnolia + Action

**Trigger:** Message contains `magnolia` AND any of (`revenue` / `follow` / `task`) AND does NOT contain `email`/`draft`.

**Sample prompts:**
- `Show me Magnolia's revenue and create a follow-up task`
- `Pull up Magnolia revenue and schedule a follow-up`

**Expected output:** uc3 multi-intent flow — Customer 360 + Revenue chart + staged task form in one turn.

---

## Section 10 — Chip Chains (follow-ups within a response)

Most Kai responses end with 3–4 **action chips**. Clicking a chip auto-sends the chip's query and renders a follow-on response. **Max chain depth: 3** turns before chips disappear and the user must type something fresh.

Examples to demo the chain:
1. `Show me my pipeline` → chip **"Draft outreach for stalled deals"** → SR-20 Outreach fixture renders with the stalled-deal list pre-filled.
2. `Customer health report` → chip **"Draft outreach for dormant accounts"** → Email draft for the 3 dormant accounts.
3. `What is the status of my leads?` → chip **"Move Verdant Home to Won"** → Cap 3 flow.

---

## Section 11 — My Artifacts (no-prompt section)

Click the sidebar Kai rail → **My Artifacts** flyout entry.

| Action | What to show |
|---|---|
| Land on the page | Charts and Reports section + Dashboards section, each card showing a **live mini-render** of the actual widget at 42% scale (charts show real trend lines, tables show first rows). |
| Click any Charts & Reports card | Opens single-artifact viewer with full-size widget render + Back button + Save dropdown (PNG / CSV). |
| Click **Save as PNG** | Downloads a high-res snapshot of the rendered widget. |
| Click **Save as CSV** | Downloads the underlying series/rows as a spreadsheet. |
| Click any Dashboard card | Opens the Dashboard Full View with Edit / Save / Download buttons. |

---

## Section 12 — Voice & Multi-modal

| Action | Behavior |
|---|---|
| Click the microphone in the chat input | Voice capture starts (Web Speech API). Speak: *"Create a task for Wildflower Market about Birdhouse samples."* On stop, the text auto-fills and (optionally) auto-sends. |
| Click the speaker icon on any Kai response | Streams the closing text via ElevenLabs TTS. |

---

## Demo Flow Recommendation (22-min script)

| Time | Section | Suggested prompts |
|---|---|---|
| 0:00 | **Morning Brief** | (no prompt — proactive brief renders on chat load referencing Beth's day) |
| 2:00 | **Cap 1: Voice → Task → Email** | (voice) `Create a task for Wildflower Market about Birdhouse samples` → confirm → chip "Draft the email now" → confirm |
| 5:00 | **Cap 2: Lead Creation** | `Add a new lead — Pine & Thistle Gift Shop` → confirm → auto-task renders |
| 7:00 | **Cap 3: Lead → Won** | `Move Verdant Home to Won` → confirm |
| 10:00 | **Cap 4: Merge** | `Merge The Garden Gate Shop with the old record` |
| 12:00 | **Cap 5: Website User** | `Create a WizShop user for Lakeside Living` |
| 14:00 | **Cap 6: Catalog Builder** | `Build a curated catalog for Mountain Bloom Studio` |
| 16:00 | **Cap 7: Reports** | `Show me collection performance` → `Customer health report` → `Team performance` |
| 19:00 | **Operational Queries** (Section 2) | `What is my inventory status?` → `List of open orders` → `Customers who purchased Bird Pot Feet last 15 days` |
| 21:00 | **Page Intelligence** | Navigate to Products → click Ask Kai → `What's selling best this week?` |
| 22:00 | **Close** — "That's your data. Kai speaks Audrey's language on day one." |

---

## Keyword Collision Cheat Sheet

These keywords appear in multiple routes — first-match-wins resolves the conflict. Useful to know when crafting demo prompts:

| Keyword / phrase | Which route wins | What to type instead if you want the OTHER fixture |
|---|---|---|
| `meeting brief` | Special: Meeting Prep (Magnolia) | Use `action items from meeting` to get SR-14 |
| `rep performance` | Sales Performance Dashboard (DASHBOARD_ROUTES runs before CAPABILITY_ROUTES) | Use `team performance` for the Team report |
| `inventory status` | Special: Inventory simple-table | Use `catalog health` for the dashboard view |
| `magnolia` (alone) | uc1 Customer 360 | Add `revenue and follow-up` to get uc3 |
| `pipeline` | Capability: report-pipeline | Use `lead conversion` to disambiguate |
| `merge` | Cap 4: Merge Customer | (no conflict — Cap 4 keyword only used here) |
| `order history` | Special: Magnolia Order History | Specify customer name to keep scope |

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| Kai routes "Magnolia" to a wrong fixture | Multiple matchers contain `magnolia` keyword | Quote a specific phrase, e.g., `Show me orders for Magnolia` (forces SPECIAL route) |
| Customers-by-SKU query returns Magnolia 360 | SKU name not in the 3 hero list — should hit the guard and return "I don't have that capability yet" | Use a hero SKU: Bird Pot Feet, Cement Bird Feeder, or A Blooming Porch |
| Clarification card doesn't render Cancel | Browser zoom or narrow viewport | Reset zoom to 100%, ensure window ≥ 1280px |
| Dashboard table horizontal scroll missing | Old build cached | Hard refresh (Cmd+Shift+R) — DataTable has `maxWidth: 100%` on the outer card |
| Voice doesn't capture | Browser permissions | Chrome/Edge required; grant mic access on first prompt |
| Chip doesn't fire as expected | Chip chain depth reached 3 | Type a fresh query to reset the chain |

---

**End of script.** Hand this to anyone running a Kai demo — every prompt is keyword-matched, every output is deterministic, and every entity name comes from real Audrey data (no Acme Corp anywhere).
