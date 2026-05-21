# Kai vDemo — Progress Report

**Branch:** `demo/audreys-ceo` (working on `main` locally)
**Last updated:** 2026-05-20
**Base:** Kai v2.1 (all 8 v2 blocks complete, deployed at kaidemov0.vercel.app)
**Target:** CEO demo for Audrey's Home & Gift — every fixture, page, brief, and starter prompt references Audrey's real catalog and synthetic CRM.

## TL;DR for the Team Lead

The Audrey data foundation is fully wired and **all 5 WizOrder pages have been reskinned** end-to-end (Dashboard, Products, Orders, Customers, CRM). Each page now sources from `src/data/audreys/`, has an Audrey-flavored proactive brief, and 4 Audrey-flavored starter prompts. `npx tsc --noEmit` passes clean.

**Not yet done:** Capabilities 1–7 fixtures (`cap1`–`cap7`, `report-*.json`), the action chip map updates, the Audrey system-prompt block, the V2-feature-untouched verification pass, and the demo script run-through.

A new dev can pick up at section 5 ("What's left") below.

---

## 1. Repo Snapshot

```
src/data/audreys/                      — 50 SKUs, 18 heroes, 17 collections
  accessors.ts                          — PRODUCTS, HEROES, COLLECTIONS, byBucket, bySku, byCollection
  pricing.ts                            — getDisplayPrice() (MSRP-only)
  types.ts                              — AudreyProduct, AudreyCollection, ProductBucket
  audreys_products.json / heroes.json / collections.json
  index.ts                              — barrel: re-exports everything + synthetic/
  synthetic/
    customers.ts    (8 customers, C-8001…C-8008)
    leads.ts        (6 leads, L-9001…L-9006)
    sales-reps.ts   (4 reps, R-001…R-004)
    orders.ts       (35 orders, O-50001…O-50035)
    tasks.ts        (12 tasks, T-2001…T-2012, 4 Overdue)
    deals.ts        (8 deals, D-3001…D-3008)
    users.ts        (5 WizShop users, U-7001…U-7005)
    wishlists.ts    (3 wishlists, W-6001…W-6003)
    sales-history.ts (12-month revenue trace per bucket, 7 buckets)
    index.ts        — barrel
```

**Validation:** every SKU referenced by `orders.ts`, `wishlists.ts`, etc. is checked against `bySku()` at module load — invalid SKUs crash on import.

**Compile guard:** `npx tsc --noEmit` is clean across all changes.

---

## 2. Data Reference (for fixture authors)

### Customers (8) — `CUSTOMERS`

| ID | Name | Status | Last Order | Lifetime Rev | Notes |
|---|---|---|---|---|---|
| C-8001 | Magnolia Home & Garden | Active | 2026-05-04 | $142,000 | Biggest account, garden center |
| C-8002 | The Potting Shed | Active | 2026-05-12 | $98,500 | A Blooming Porch / Herb Garden |
| C-8003 | Bloom & Basket | Active | 2026-05-09 | $76,200 | Bunnies + A Blooming Porch |
| C-8004 | Seaside Gifts | Active | 2026-04-30 | $61,000 | Spring & Summer |
| C-8005 | Copper Creek Trading | Active | 2026-05-15 | $52,800 | Gardeners Grove |
| C-8006 | Harbor Lane Boutique | **Warning** | 2026-03-29 | $44,000 | 52 days since last order |
| C-8007 | Sunflower & Sage | Active | 2026-05-06 | $38,500 | Bunnies collection |
| C-8008 | Golden Meadow Co | **Dormant** | 2026-02-19 | $28,000 | 90 days since last order |

### Leads (6) — `LEADS`

| ID | Name | Status | Source | Used in Capability |
|---|---|---|---|---|
| L-9001 | Wildflower Market | Qualified | Trade Show | Cap 1 |
| L-9002 | Rustic Charm Boutique | New | Website | Cap 2 |
| L-9003 | Verdant Home Collective | Qualified | Referral | Cap 3 |
| L-9004 | The Garden Gate Shop | Qualified | (dup record) | Cap 4 |
| L-9005 | Lakeside Living Co | Contacted | Website | Cap 5 |
| L-9006 | Mountain Bloom Studio | Qualified | Trade Show | Cap 6 |

### Reps (4) — `SALES_REPS`

R-001 Beth Calloway (Southeast, $186K), R-002 Marcus Rivera (Mid-South, $124K), R-003 Hannah Cho (Mountain/West, $89K), R-004 James Whitfield (Northeast, $42K).

### Orders (35) — `ORDERS`

Status mix: Open(5), Submitted(8), Pre-Book Confirmed(8), Shipped(5), Delivered(9). Pre-Book orders carry `shipWindow` (Sep/Oct/Dec 2026). Bucket mix: featured_collections(14), july_release(8), garden_outdoor(6), sale_clearance(5), atlanta_top_sellers(1), spring_summer(1).

### Tasks (12) — `TASKS`

4 Overdue (T-2001 Wildflower / T-2002 Harbor Lane / T-2003 Golden Meadow / T-2004 Potting Shed), 8 Open. Priority: 6 High / 4 Medium / 2 Low.

### Deals (8) — `DEALS`

Qualified(2): D-3001 Wildflower $4.8K, D-3002 Rustic Charm $2.4K
Proposal Sent(2): D-3003 Verdant Home $12.5K, D-3004 Mountain Bloom $6.8K
Negotiation(2): D-3005 Garden Gate $5.2K, D-3006 Magnolia $22K
Closed Won(2): D-3007 Copper Creek $7.4K, D-3008 Sunflower & Sage $5.6K

Total pipeline: **$64,900**.

### Sales History — `SALES_HISTORY`

12-month traces (Jun 2025 → May 2026) for each of the 7 buckets. Used for Dashboard chart and (pending) collection performance reports.

### Product Buckets

| Bucket | Count | Heroes | Demo narrative |
|---|---|---|---|
| featured_collections | 17 | 3 | A Blooming Porch / Gardeners Grove / Herb Garden — spring catalog strength |
| sale_clearance | 15 | 2 | 15 SKUs in PhaseOut — clearance urgency |
| garden_outdoor | 8 | 4 | Year-round evergreens |
| july_release | 6 | 5 | July 2026 Virtual Release — pre-book pacing |
| atlanta_top_sellers | 2 | 2 | Jan 2025 Atlanta market winners |
| spring_summer | 1 | 1 | Immediate-ship refill |
| fall_holdovers | 1 | 1 | Small remnant — mention once |

---

## 3. Completed Work — Page Reskins

All 5 pages were reskinned via the same pattern: swap the underlying data source (often via the `Shared*Context` file so Kai-created items still merge correctly), update the page component for new badges/filters/columns, rewrite the proactive brief JSON, and update the 4 starter prompts in `PageContext.tsx`.

### 3.1 Dashboard ✅

Plan: [plan_docs/Dashboard Reskin.md](Dashboard%20Reskin.md)

| File | Change |
|---|---|
| [src/lib/types.ts](../src/lib/types.ts) | `CompactListData` is now a discriminated union (`kind: 'task' \| 'activity'`); added `CompactListActivityItem`; preserved `CompactListItem` task-shape alias for back-compat |
| [src/components/widgets/ui/CompactList.tsx](../src/components/widgets/ui/CompactList.tsx) | Branches on `data.kind === 'activity'`; new `ActivityRow` component with icon glyph + timestamp + same outer card chrome |
| [src/components/wizorder/WizDashboardPage.tsx](../src/components/wizorder/WizDashboardPage.tsx) | KPIs derived from Audrey data: Active SKUs (50), This Week Revenue ($42,800), Open Orders (13), Pre-Book Pipeline ($14,295). Chart shows 12-month aggregate Jun 2025–May 2026. Activity Feed renders 3 entries below chart. |
| [src/fixtures/proactive-brief-general.json](../src/fixtures/proactive-brief-general.json) | Beth greeting, PhaseOut + July 2026 release urgent items, 3 summary rows |
| [src/contexts/PageContext.tsx](../src/contexts/PageContext.tsx) | 4 new dashboard starters |

**Notable:** the `CompactList` widget gained an `activity` variant that's back-compatible — every existing task-shape fixture still validates.

### 3.2 Products ✅

Plan: [plan_docs/Products Reskin.md](Products%20Reskin.md)

| File | Change |
|---|---|
| [src/components/wizorder/ProductsPage.tsx](../src/components/wizorder/ProductsPage.tsx) | Full rewrite — sources from `[...HEROES, ...PRODUCTS.filter(p => !p.is_hero)]`. Real product images with fallback chain + `📦` onError. Hero ribbon: `New Launch` (indigo) or `Featured` (amber). Card click dispatches `kai:ask` event. |
| [src/fixtures/proactive-brief-products.json](../src/fixtures/proactive-brief-products.json) | Featured Collections sell-through + names **Window - Hello Spring, Herbs** and **Cement Planter - Urn** as below refill threshold + "Build a Gardeners Grove refill list" chip |
| [src/contexts/PageContext.tsx](../src/contexts/PageContext.tsx) | 4 new products starters |
| [src/components/chat/ChatShell.tsx](../src/components/chat/ChatShell.tsx) | `kai:ask` window event listener (~9 lines) funneling into the existing `handleChipClick`. Generic bridge — also usable from future row-clicks on other pages. |

**Filter chips:** All (50) · A Blooming Porch · Gardeners Grove · The Herb Garden · Bunnies · Garden Evergreen (8) · PhaseOut (15). Non-`All` filters re-sort by hero-first index so heroes still lead within each filter.

**Stock badge derivation:**
- `bucket === 'sale_clearance'` → **PhaseOut** (red), overrides `stock_status` (this catches the 3 OOS SKUs too)
- `stock_status === 'Pre-Book'` → **Pre-Book** (blue)
- `stock_status === 'Buy Now, Limited Quantity'` → **Limited Quantity** (amber)
- else → **In Stock** (green)

### 3.3 Orders ✅

| File | Change |
|---|---|
| [src/contexts/shared/SharedOrdersContext.tsx](../src/contexts/shared/SharedOrdersContext.tsx) | Swapped `wizorder-orders.json` import for `AUDREY_ORDERS`. Kai-created order prepend + `KaiBadge` logic untouched. |
| [src/components/wizorder/OrdersPage.tsx](../src/components/wizorder/OrdersPage.tsx) | New `STATUS_FILTERS` (All / Open / Submitted / Pre-Book Confirmed / Shipped / Delivered). `STATUS_BADGE` map updated. `OrderRow` shows `📦 Ships {shipWindow}` sub-line under customer name for Pre-Book Confirmed rows. |
| [src/fixtures/proactive-brief-orders.json](../src/fixtures/proactive-brief-orders.json) | Featured Collections movement + Bloom & Basket pre-book callout (O-50015 Oct 2026, O-50020 Dec 2026) + "Show Pre-Book orders" chip |
| [src/contexts/PageContext.tsx](../src/contexts/PageContext.tsx) | 4 new orders starters |

### 3.4 Customers ✅

| File | Change |
|---|---|
| [src/contexts/shared/SharedCustomersContext.tsx](../src/contexts/shared/SharedCustomersContext.tsx) | Swapped `wizorder-customers.json` for `AUDREY_CUSTOMERS`. Kai-created customer patching logic untouched. |
| [src/components/wizorder/CustomersPage.tsx](../src/components/wizorder/CustomersPage.tsx) | Full rewrite. **Tabs:** Customers (8) / Leads (6). **CustomerCard:** border tints red/amber on Warning/Dormant; `preferredCollections` as 3 colored pills; days-since shown inline on last order for non-Active accounts. **LeadCard:** stage badge + source + last contact + rep. |
| [src/fixtures/proactive-brief-customers.json](../src/fixtures/proactive-brief-customers.json) | Names Harbor Lane (52d), Golden Meadow (90d), Seaside Gifts as overdue for spring reorder + "Draft outreach for dormant accounts" chip |
| [src/contexts/PageContext.tsx](../src/contexts/PageContext.tsx) | 4 new customers starters |

**Risk badges** computed from `customer.status` directly: Active (green), Warning (amber, Harbor Lane), Dormant (red, Golden Meadow). Days-since computed at render time from `TODAY = 2026-05-20`.

### 3.5 CRM ✅

| File | Change |
|---|---|
| [src/contexts/shared/SharedCRMContext.tsx](../src/contexts/shared/SharedCRMContext.tsx) | Swapped `wizorder-crm.json` for `AUDREY_TASKS / AUDREY_LEADS / AUDREY_DEALS`. Cast through `unknown` since the `Audrey*` types are structural supersets of `WizOrder*`. Kai-created task prepend logic untouched. |
| [src/components/wizorder/CRMPage.tsx](../src/components/wizorder/CRMPage.tsx) | **No changes needed.** The existing 3-tab table layout (Tasks / Leads / Deals) was already correctly structured for Audrey data. Overdue badge (red) automatically applies because 4 task records have `status: 'Overdue'`. |
| [src/fixtures/proactive-brief-crm.json](../src/fixtures/proactive-brief-crm.json) | Names Wildflower (Beth, 5d late) and Golden Meadow (Marcus, 10d late); Pick Of The Patch Gnome mention; "Show overdue tasks" chip |
| [src/contexts/PageContext.tsx](../src/contexts/PageContext.tsx) | 4 new CRM starters |

---

## 4. Architecture Notes for the Next Dev

### The reskin pattern that worked

For every page that has a `Shared*Context` (Orders, Customers, CRM), **swap the fixture import at the context level**, not at the page level. This preserves the Kai-created-item merge logic for free. Example diff (Orders):

```diff
-import rawOrders from '@/fixtures/wizorder-orders.json';
-const INITIAL_ORDERS = (rawOrders as { orders: WizOrderOrder[] }).orders;
+import { ORDERS as AUDREY_ORDERS } from '@/data/audreys';
+const INITIAL_ORDERS: WizOrderOrder[] = AUDREY_ORDERS;
```

Dashboard and Products don't have a shared context, so they pull `PRODUCTS`/`ORDERS`/`HEROES`/`SALES_HISTORY` directly via `import from '@/data/audreys'`.

### Audrey types are structural supersets of WizOrder types

`AudreyOrder extends WizOrderOrder`, `AudreyTask` has all `WizOrderTask` fields plus extras (`customerId`, `leadId`, `repId`, `notes`), etc. So direct assignment usually works for orders; tasks/leads/deals need an `as unknown as WizOrder*[]` cast because TS can't see structural compatibility through generics. We deliberately preserve the WizOrder* type discipline at component boundaries so v2 widgets keep working unchanged.

### `kai:ask` window event bridge

Added during Products reskin in `ChatShell.tsx`. Generic enough to serve future page row-clicks (Customers, Orders) for free:

```ts
window.dispatchEvent(new CustomEvent('kai:ask', { detail: { query: 'Tell me about 51GR1907' } }));
```

ChatShell listens for `kai:ask` and routes into the existing `handleChipClick` callback — same pipeline a Kai action chip uses.

### `CompactList` widget — discriminated union

The widget now accepts two shapes:
```ts
type CompactListData =
  | { kind?: 'task'; title: string; items: CompactListTaskItem[] }
  | { kind: 'activity'; title: string; items: CompactListActivityItem[] };
```
Existing fixtures (Cap-1 tasks, etc.) that omit `kind` continue to validate as the task arm — no migration needed. The `ACTIVITY_ICON` glyph map (`order`, `lead`, `task`, `deal`, `check`, `alert`) is inline in the widget file.

### Files we left intentionally alone

- `src/fixtures/wizorder-products.json`, `wizorder-orders.json`, `wizorder-customers.json`, `wizorder-crm.json` — old Acme fixtures, no longer read by any page. Safe to leave for now; will be deleted in a cleanup pass.
- All v2 widget files except `CompactList.tsx`.
- `queryMatcher.ts`, `chip-map.json`, capability fixtures.

---

## 5. What's Left

This is the punch list for whoever picks this up next. Roughly in order of demo-script dependency.

> **Heads up:** every task below is already specified as a numbered step in [Kai_vDemo_Claude_Code_Workflow.md](Kai_vDemo_Claude_Code_Workflow.md) — copy-paste-ready prompts with mode and model picks. Each subsection below cross-links to the corresponding workflow step so you can jump straight into execution. Treat the workflow doc as the playbook; this progress doc is just the status overlay.

### 5.1 Capability fixtures (P0 — required for demo)

→ Workflow: **Phase 4** (Steps 4.1–4.3, Caps 1–3) and **Phase 5** (Steps 5.1–5.3, Caps 4–6) and **Phase 6** (Step 6.1, reports).

The 7 demo capabilities each need a fixture in `src/fixtures/` that matches the Frame JSON contract. Plan exists in `plan_docs/Kai_vDemo_Implementation_Plan.md`. Status:

| # | Capability | Fixture(s) | Status |
|---|---|---|---|
| 1 | Task + Email via Voice (Wildflower) | `cap1-task-email-voice.json`, `cap1-email-draft.json` | Not started |
| 2 | Lead Creation (Pine & Thistle) | `cap2-lead-creation.json`, `cap2-auto-task-followup.json` | Not started |
| 3 | Lead → Customer (Verdant Home) | `cap3-lead-stage-won.json` | Not started |
| 4 | Merge Records (Garden Gate) | `cap4-merge-customer.json` | Not started |
| 5 | Website User (Lakeside Living) | `cap5-user-creation.json` | Not started |
| 6 | Catalog Builder (Mountain Bloom) | `cap6-catalog-creation.json` | Not started |
| 7 | 6 reports | `report-collection-performance.json`, `report-prebook-pacing.json`, `report-customer-health.json`, `report-pipeline.json`, `report-team-performance.json`, `report-catalog-health.json` | Not started |

**Important:** when authoring a new fixture, **first read an existing working fixture** (e.g. `proactive-brief-general.json` or any v2 capability fixture) and match its structure exactly. The FrameParser is strict.

### 5.2 Action chip map (P0)

→ Workflow: **Step 3.3** (lines 572–612 of `Kai_vDemo_Claude_Code_Workflow.md`).

`src/fixtures/action-chips-map.json` — needs new chip templates per `CLAUDE.md` §"Action Chip Templates":
- `clearance_email`, `collection_refill`, `july_pacing`, `prebook_orders`, `dormant_outreach`, `overdue_tasks`.

Step 3.3 also handles the cleanup of the existing per-page `pageChips` entries (the "Low stock alerts" / "Top sellers" chips that currently render above the input bar on Products, plus the equivalent stale chips on Orders/Customers/CRM/Dashboard). These are a *different* surface from the starter prompts in §3 — both look like pills but the chip bar is always-on, while starters only render in the empty-conversation hero. Until Step 3.3 runs, the chip bar will keep showing the v2 Acme-flavored copy even though the starters and briefs are Audrey-flavored.

The page briefs already reference some of these queries — keyword matcher in `queryMatcher.ts` needs entries so chips actually route to the right capability fixture.

### 5.3 Query matcher entries (P0)

→ Workflow: **Step 3.2**.

`src/lib/queryMatcher.ts` (or wherever the keyword → fixture mapping lives) needs entries for the Audrey capability keywords listed in `CLAUDE.md` §"The 7 Demo Capabilities" (e.g. `wildflower`, `pine and thistle`, `verdant home`, `garden gate`, `lakeside`, `mountain bloom`). Without these, the cap fixtures don't trigger.

### 5.4 Audrey system-prompt block (P1)

→ Workflow: **Step 3.1**.

`CLAUDE.md` §"LLM System Prompt — Audrey Context Block" specifies a block that should be injected between page context and capability prompt. Find the prompt-assembly site (likely in `ChatShell.tsx` near the API call) and slot it in.

### 5.5 SharedCRM mutators for Caps 2 & 3 (P1)

→ Workflow: **Step 4.4**.

`SharedCRMContext` needs new methods per `CLAUDE.md`:
- `addLead()` — used by Cap 2 (Pine & Thistle creation)
- `updateLeadStage()` — used by Cap 3 (Verdant Home → Won)
- `archiveLead()` — used by Cap 3 & 4

`SharedCustomersContext` already has `addCustomer()` — used by Cap 3.

### 5.6 V2-untouched verification (P1)

→ Workflow: **Step 2.6** (per-page render check) and **Step 7.3** (full build + lint + tsc).

Per `CLAUDE.md` §"V2 Features — DO NOT MODIFY", confirm none of these regressed:
Agent Store, Docs view, History view, Voice, Follow-ups, Text-only mode, Demo/AI toggle, Onboarding/Guided Tour/Command Palette, Personas, Custom instructions.

A 15-min click-through is enough. The only v2 surface we did touch is `CompactList` (back-compat discriminated union — existing task-arm fixtures should still render identically) and `ChatShell` (added a `kai:ask` listener — no existing path changed).

### 5.7 Demo script run-through (P0 — final check)

→ Workflow: **Phase 8** (Step 8.1 dry-run, Step 8.2 fixes) followed by **Phase 9** (Step 9.1 polish, Step 9.2 deploy).

`plan_docs/demo_script.md` (or `demo_script_v2.md`) — walk the 22-minute script end-to-end with a stopwatch. Each capability needs to fire cleanly and produce the expected widget chain. Time-box each section.

---

## 6. How to Verify Current State

```bash
# 1. Type-check
npx tsc --noEmit
# (currently clean)

# 2. Boot dev server
npm run dev
# Open localhost:3000

# 3. Click through pages
# Dashboard: KPIs read 50 / $42,800 / 13 / $14,295. Chart shows 12 months. Activity feed has 3 rows.
# Products: 50 cards, heroes lead with Featured/New Launch ribbons, real images, filter chips work.
# Orders: 35 orders, Pre-Book Confirmed rows show "📦 Ships Sep/Oct 2026" sub-line.
# Customers: Tab switch between 8 customers / 6 leads. Harbor Lane shows Warning, Golden Meadow shows Dormant.
# CRM: 3 tabs — Tasks (4 Overdue red badges), Leads (6 rows), Deals (8 rows totaling $64,900).

# 4. Sanity-check page briefs
# Each page's proactive brief greets with Audrey copy, not Acme.

# 5. Click a product card → Kai should receive "Tell me about <SKU>"
# (kai:ask event bridge — works as long as ChatShell is mounted)
```

---

## 7. Plan Documents — What's Where

In `plan_docs/`:

| File | Purpose |
|---|---|
| `Kai_vDemo_Implementation_Plan.md` | Original master plan for the whole demo |
| `AUDREYS_DATA_INTEGRATION_GUIDE.md` | Per-page contract for swapping in Audrey data |
| `Repo Overview.md` | Architecture map of the codebase |
| `Dashboard Reskin.md` | **Executed** — completed plan for Dashboard |
| `Products Reskin.md` | **Executed** — completed plan for Products |
| `Progress_Kai_Demo.md` | **You are here** |
| `demo_script.md` / `demo_script_v2.md` | 22-minute CEO demo walkthrough |
| `widget_system.md` | Light-mode design tokens & widget catalog |
| `Hidden_for_P0.md` | Features intentionally hidden for this demo |
| `Testing.md` / `testing_guide.md` / `testing_progress.md` | QA notes |

The Orders / Customers / CRM reskins were small enough not to warrant standalone plan docs — they followed the Dashboard/Products pattern.

---

## 8. Working Agreement / Conventions Observed

- **`npx tsc --noEmit` after every reskin.** Pass cleanly before moving on.
- **Real SKUs only.** Validate via `bySku()` if you author a new fixture.
- **No "Acme Corp" / "John Smith" placeholders.** Every entity must be a real Audrey customer / lead / rep.
- **Don't modify v2 features.** New behavior goes into new fixtures or additive widget variants.
- **Don't write speculative abstractions.** Three similar lines beats a premature factory. Comments only when the *why* is non-obvious.
- **Today's date is 2026-05-20.** Convert relative dates ("Thursday", "last week") to absolute when writing fixtures.

---

## 9. Contact

Original author of this push: Avi (`avi.b@wizcommerce.com`).
For demo script questions and capability-fixture content review, escalate to whoever owns the Audrey CEO demo brief.
