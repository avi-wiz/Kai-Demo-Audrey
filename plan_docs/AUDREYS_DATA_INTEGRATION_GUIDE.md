# Audrey's Product Data — Kai v2 Integration Guide

This document explains how to wire the curated Audrey's Home & Gift product catalog into the existing Kai v2 POC for a controlled demo with the customer's CEO. The catalog was extracted from `https://www.audreys.com/service/QueryProducts.json`, deduplicated, bucketed by demo narrative, and reduced to a tight hero set.

---

## TL;DR

Drop four files into the Kai repo, add one TypeScript type, and rewire the existing demo fixtures to read from the new data instead of the placeholder "Acme Corp / generic widget" content. The data is structured around seven demo buckets (each maps to a specific Kai talking point in May 2026) with 18 hero SKUs flagged for scripted moments. Everything else — customers, orders, sales reps, tasks — is synthetic and still needs to be authored on top of this product catalog.

The narrative shift to be aware of: Audrey's public catalog in May is **not** fall pre-book. It is dominated by Spring/Summer immediate-ship, Garden evergreen, the upcoming July 2026 release, and named collections like *A Blooming Porch*, *Gardeners Grove*, *The Herb Garden*, and *Bunnies*. Tune any pre-written demo scripts to that voice.

---

## 1. What's in This Drop

| File | Rows | Purpose |
|---|---|---|
| `audreys_products.json` | 50 | The full curated catalog. Use for the Products page grid, filter chips, and as the lookup table everywhere else. |
| `audreys_heroes.json` | 18 | Subset of the above, with extra image sizes. Use for any product that appears in a scripted demo moment (mentioned by name, hero photo, top-of-list, etc.). |
| `audreys_collections.json` | ~17 | Every named collection observed in the catalog, with SKU counts and an `is_featured` flag. Powers filter chips, breadcrumbs, and Kai's "your Gardeners Grove line" voice. |
| `audreys_curation_report.txt` | human-readable | Snapshot of bucket counts and hero picks at the time of the drop. Reference only — do not parse. |

Bucket distribution at time of drop:

| Bucket | Curated | Heroes |
|---|---|---|
| `featured_collections` | 17 | 3 |
| `sale_clearance` | 15 | 2 |
| `garden_outdoor` | 8 | 4 |
| `july_release` | 6 | 5 |
| `atlanta_top_sellers` | 2 | 2 |
| `spring_summer` | 1 | 1 |
| `fall_holdovers` | 1 | 1 |
| **Total** | **50** | **18** |

The bucket sizes are uneven because the API's public view of the catalog is dominated by Featured Collections and Sale/Clearance product — that's the Audrey reality in May 2026, not a curation choice. Build scripted demo flows around where the data actually lives.

---

## 2. Recommended File Locations in the Repo

```
src/
  data/
    audreys/
      products.json              ← rename from audreys_products.json
      heroes.json                ← rename from audreys_heroes.json
      collections.json           ← rename from audreys_collections.json
      index.ts                   ← new — exports typed accessors
      types.ts                   ← new — TypeScript interfaces below
      synthetic/
        customers.ts             ← new — see §10
        sales-reps.ts            ← new — see §10
        orders.ts                ← new — see §10
        tasks.ts                 ← new — see §10
```

Suggested public API from `src/data/audreys/index.ts`:

```ts
export {
  PRODUCTS,           // AudreyProduct[]    — all 50
  HEROES,             // AudreyProduct[]    — the 18 heroes
  COLLECTIONS,        // AudreyCollection[] — collection taxonomy
  byBucket,           // (bucket) => AudreyProduct[]
  bySku,              // (sku)    => AudreyProduct | undefined
  byCollection,       // (name)   => AudreyProduct[]
  randomHero,         // ()       => AudreyProduct  (deterministic seed if needed)
} from "./accessors";

export type { AudreyProduct, AudreyCollection, ProductBucket } from "./types";
```

---

## 3. The Product Data Contract

Drop this into `src/data/audreys/types.ts`:

```ts
export type ProductBucket =
  | "spring_summer"
  | "garden_outdoor"
  | "july_release"
  | "featured_collections"
  | "sale_clearance"
  | "atlanta_top_sellers"
  | "fall_holdovers";

export interface AudreyProduct {
  sku: string;                       // primary identifier (manufacturerNumber)
  upc: string | null;
  name: string;                      // human-readable product name
  description: string;               // longer marketing copy

  retail_price: number;              // MSRP — always present
  wholesale_price: number;           // 0 for guest API view — see §11
  msrp: number | null;
  available_qty: number;
  case_qty: number;
  min_order_qty: number;
  uom: string | null;                // e.g. "Pk/06", "Pk/02 Sets"

  is_new: boolean;
  is_featured: boolean;
  stock_status: string | null;       // "In Stock" | "Pre-Book" | "Limited Quantity"

  // Flattened taxonomy — ready for filtering / chips / breadcrumbs
  division: string[];                // ["Home & Garden", "Seasonal", ...]
  sub_division: string[];            // ["Spring & Summer"] etc.
  category: string[];                // ["Garden", "By Collection"]
  group: string[];                   // ["Planters,Pottery,Vases"]
  collections: string[];             // named collections (SubCategory)
  materials: string[];               // ["Cotton", "Marble"]
  dimensions: string[];              // ["20\" H x 20\" W"]
  pack: string[];
  sold_as: string[];
  unit_price: string[];              // textual "$18.00 PC" style strings

  image_urls: string[];              // [medium-size primary, ...positions]
  image_urls_by_size: {              // populated only for heroes
    medium: string[];
    large: string[];
    original: string[];
  } | null;

  bucket: ProductBucket;             // which demo bucket
  is_hero: boolean;                  // true for the 18 scripted-moment SKUs
}

export interface AudreyCollection {
  name: string;                      // e.g. "A Blooming Porch"
  sku_count: number;
  sample_skus: string[];             // up to 5
  is_featured: boolean;              // appears in the merchandised list
}
```

---

## 4. The Seven Buckets — Demo Narratives Each One Enables

Use this table when authoring fixtures, briefs, action chips, and LLM prompts. Each bucket maps to a specific Kai talking point a real Audrey rep would use in May 2026.

| Bucket | Kai narrative | Best surfaces |
|---|---|---|
| `july_release` | "Your **July 2026 Virtual Release** is two weeks out — here's how pre-orders are pacing vs January." | Proactive brief on Dashboard, MetricCardRow on Products page, "Pitch the launch" action chip |
| `featured_collections` | "Your **A Blooming Porch / Gardeners Grove / Herb Garden** collections are pulling the spring catalog. Want to draft a refill email for stores who haven't reordered?" | Customer360Card, email drafting (T2), DataTable filtered by collection |
| `sale_clearance` | "**15 SKUs are in PhaseOut** — pitch them at the show before they hit deeper discount." | Proactive brief (urgent dot), CompactList of clearance candidates, reorder flow (SR2) |
| `garden_outdoor` | "Your **year-round garden evergreens** are the steady earners — birdhouses, planters, outdoor decor. Want a "top sellers" pitch for new accounts?" | Top-sellers DataTable, EntityDetailCard, Dashboard Builder fixtures |
| `atlanta_top_sellers` | "Here's what won at the **January 2025 Atlanta market** — perfect for similar buyer profiles." | LineChart "Atlanta winners vs current pacing", CompactList in CRM context |
| `spring_summer` | "**Spring/Summer immediate-ship** — refill business that's open right now." | Generic Spring filter, "what's in stock" queries |
| `fall_holdovers` | "Small fall inventory still on the shelf — clear it before the new Fall pre-book opens." | Single mention in a brief; nice "we still have a fall hook" beat |

The `featured_collections` bucket is the heaviest because that's where Audrey is investing merchandising energy right now. Lean into it.

---

## 5. Hero vs Background — When to Use Which

**Hero** (18 SKUs, `is_hero: true`):
- Any product Kai mentions by name in a brief, chip, email, or LLM-streamed sentence.
- Top item in any list (CompactList, DataTable's first row, Customer360Card's first recent-order).
- Any product whose detail card opens (`EntityDetailCard`, `Customer360Card`).
- Anything the user clicks on during the scripted demo.
- Hero shots in `MetricCard.image` slots — use `image_urls_by_size.large` (falls back to medium if `large` 404s; see §11).

**Background** (32 SKUs):
- Filler in the Products page grid so it doesn't look like a 10-item catalog.
- Filter facet counts (e.g. "Birdhouses (12)" in a category chip).
- Aggregate metrics ("revenue from your Spring catalog: $487K") that don't name specific SKUs.
- Backing data for charts — denominators only.

Rule of thumb: **if it's named in pixels or in prose, it's a hero.** If it's in a denominator, it can be background.

---

## 6. Wiring Products Into Each Widget

This section maps the existing Kai v2 widgets onto the new data. The Widget Contract stays the same: `{ data, config?, highlights? }`. Only the *content* of `data` changes.

### 6.1 Products page — grid view

The Products page in `PageContext` should render all 50 products as a CSS-grid of cards. Hero items can show a "Featured" or "New Launch" ribbon.

```ts
// pages/products.tsx (sketch)
import { PRODUCTS, HEROES } from "@/data/audreys";

const FEATURED_FIRST = [...HEROES, ...PRODUCTS.filter(p => !p.is_hero)];

<ProductGrid
  items={FEATURED_FIRST}
  onCardClick={sku => askKai(`Tell me about ${sku}`)}
/>
```

Pre-seed the four starter prompts under the Kai input on this page from the data:

```ts
const starterPrompts = [
  `How's our July 2026 release pacing?`,
  `Show me my Featured Collections inventory`,
  `Which SKUs are in PhaseOut?`,
  `Top-selling birdhouses this quarter`,
];
```

### 6.2 UW-007 Customer360Card — recent orders

Bind each "recent order" line to one of the heroes. Keep customer-facing fields (name, balance, credit limit) in the synthetic-customer file; line items come from heroes:

```ts
import { HEROES, bySku } from "@/data/audreys";

const acmeRecentOrders = [
  { date: "2026-05-12", sku: "6FA2329", qty: 24, total: 1980 },
  { date: "2026-04-28", sku: "6PM1022", qty: 12, total: 3540 },
  { date: "2026-03-15", sku: "6T2885-S2", qty: 8,  total: 1320 },
].map(line => ({ ...line, product: bySku(line.sku) }));
```

Apply highlights as usual — e.g. an `urgent` highlight on a line that's 60 days unreordered, with an action chip *"Send refill nudge for {{product.name}}"* dereferencing to the product's actual name.

### 6.3 UW-004 DataTable — low stock / top sellers / clearance

```ts
import { byBucket, PRODUCTS } from "@/data/audreys";

// Low stock table — products where available_qty is below 30
const lowStock = PRODUCTS
  .filter(p => p.available_qty > 0 && p.available_qty < 30)
  .sort((a, b) => a.available_qty - b.available_qty)
  .slice(0, 8);

// Clearance table — bucket-driven
const clearance = byBucket("sale_clearance");
```

Map rows like:

```ts
{
  sku: p.sku,
  name: p.name,
  collection: p.collections[0] ?? "—",
  qty: p.available_qty,
  retail: `$${p.retail_price.toFixed(2)}`,
  stock_status: p.stock_status,
}
```

For `highlights` use the existing `generateHighlights` rule engine — passing `available_qty < 30` triggers a `warning`, `< 10` triggers `urgent`. Both attach the right action chip out of the box.

### 6.4 UW-011 CompactList — "Quick picks" surfaces

CompactList is perfect for the proactive brief's three-section format. Examples per bucket:

```ts
// "OVERDUE / FLAGGED" red+amber dots
const overdue = byBucket("sale_clearance").slice(0, 3).map(p => ({
  dot: "urgent",
  title: p.name,
  meta: `${p.available_qty} on hand · PhaseOut`,
  chip: `Draft clearance email for ${p.sku}`,
}));

// "TODAY" neutral dots
const todays = byBucket("july_release").slice(0, 3).map(p => ({
  dot: "neutral",
  title: p.name,
  meta: `Pre-book — ships ${p.stock_status}`,
  chip: `Show pre-order pacing for ${p.sku}`,
}));
```

### 6.5 UW-002 MetricCardRow — performance numbers

Use bucket roll-ups as the metric source. Example "Spring catalog at a glance":

```ts
const springSkus = [...byBucket("featured_collections"), ...byBucket("spring_summer")];
const totalAvailable = springSkus.reduce((s, p) => s + p.available_qty, 0);
const avgRetail = springSkus.reduce((s, p) => s + p.retail_price, 0) / springSkus.length;

[
  { label: "Active SKUs",   value: springSkus.length },
  { label: "Units on hand", value: totalAvailable.toLocaleString() },
  { label: "Avg retail",    value: `$${avgRetail.toFixed(0)}` },
  { label: "Top collection", value: "A Blooming Porch" },
]
```

Add a `warning` highlight on the "Units on hand" tile when total drops below a threshold — the chip auto-generates as *"Draft refill outreach"*.

### 6.6 UW-003 EntityDetailCard — product detail

For the "open a product" flow, populate from a single AudreyProduct. The card already supports a hero image — use `image_urls_by_size.large[0]` for heroes, fall back to `image_urls[0]` for background products.

```ts
{
  title: product.name,
  subtitle: product.collections[0] ?? product.group[0],
  hero_image: (product.image_urls_by_size?.large?.[0]) ?? product.image_urls[0],
  fields: [
    { label: "SKU",       value: product.sku, mono: true },
    { label: "Retail",    value: `$${product.retail_price.toFixed(2)}` },
    { label: "Stock",     value: `${product.available_qty} ${product.uom ?? "units"}` },
    { label: "Case qty",  value: product.case_qty },
    { label: "Dimensions",value: product.dimensions.join(" · ") },
    { label: "Materials", value: product.materials.join(" · ") },
  ],
  highlights: product.available_qty < 30
    ? [{ field: "Stock", type: "warning", tooltip: "Below typical refill threshold" }]
    : [],
}
```

### 6.7 CH-001 LineChart — sales trends

You don't have real sales history for these SKUs. Synthesize plausible 12-month traces in `src/data/audreys/synthetic/sales-history.ts` keyed by SKU, using bucket-aware shapes:

- `july_release` → flat then a sharp Q3 ramp (pre-book → ship → reorder)
- `featured_collections` → strong Q1–Q2 peak
- `sale_clearance` → declining slope
- `garden_outdoor` → flat with small Q2 bump
- `atlanta_top_sellers` → spike at January, decay through year

Keep the y-axis scale plausible (Audrey's case qty × wholesale × frequency).

### 6.8 UW-030 DashboardCompositeWidget — composed views

The existing 8 pre-built dashboards (Overview, Performance, Pipeline, Customer Health, Order Analytics, Sales Performance, Agents, Usage) should be re-skinned with Audrey's data. Suggested mapping:

| Dashboard | Source bucket(s) |
|---|---|
| Order Analytics | sale of all 50 (synthetic orders) |
| Sales Performance | top sellers from `garden_outdoor` + `featured_collections` |
| Customer Health | synthetic customer roster (see §10) cross-referenced with heroes they buy |
| Pipeline | `july_release` pacing visualization |

---

## 7. Proactive Brief Recipes (Page-Aware)

Each of the 5 WizOrder pages should produce a Kai brief that mentions specific real SKUs. Here are five drop-in recipes:

### Dashboard
> **Good morning. Two things on your radar.**
> **OVERDUE — 15 SKUs are in PhaseOut.** Heaviest hitters: *{{hero(sale_clearance, 0).name}}*, *{{hero(sale_clearance, 1).name}}*. Want me to draft a market-week clearance email?
> **TODAY — July 2026 Virtual Release is 16 days out.** Pre-book pacing on *{{hero(july_release, 0).name}}* is +18% vs the January release. *(chip: Show pacing table)*

### Products page
> Your **Featured Collections** are carrying the catalog this week. *Gardeners Grove* is sold through 42% of allocated stock; *A Blooming Porch* is at 38%. Two SKUs — *{{hero(featured_collections, 0).name}}* and *{{hero(featured_collections, 1).name}}* — are below refill threshold. *(chip: Build a Gardeners Grove refill list)*

### Customers page
> 3 of your **top 10 accounts** haven't reordered Spring inventory in 45+ days. *(chip: Draft outreach for these accounts)*

### CRM
> The **{{hero(july_release, 0).name}}** pre-book line has been mentioned in 6 buyer calls this month. *(chip: Build a pitch deck)*

### Orders
> 12 orders this week reference Featured Collections SKUs. *(chip: Filter to Featured Collections orders)*

Use `bySku()` to dereference the placeholders at fixture-build time so the prose stays naturally written.

---

## 8. Action Chips That Use This Data

Chip templates that benefit from the new data — extend `chip-map.ts`:

```ts
{
  key: "clearance_email",
  label: "Draft clearance email for {{sku}}",
  query: ctx => `Write a market-week clearance email for ${ctx.sku} (${ctx.product.name})`,
},
{
  key: "collection_refill",
  label: "Build {{collection}} refill list",
  query: ctx => `Build a refill outreach list for the ${ctx.collection} collection`,
},
{
  key: "july_pacing",
  label: "Show July 2026 release pacing",
  query: () => `Show pre-book pacing for the July 2026 Virtual Release vs January 2025`,
},
{
  key: "atlanta_winners",
  label: "Pitch Atlanta top-sellers to {{customer}}",
  query: ctx => `Build a one-pager of the January 2025 Atlanta top-sellers for ${ctx.customer}`,
},
```

Chains-of-3 work nicely here — *"Show pacing"* → *"Compare to January"* → *"Draft an email to top buyers"* — and each step still terminates within the existing max-depth-3 rule.

---

## 9. LLM Prompt Hooks

Two places to inject Audrey context into the system prompt:

**1. Persistent Audrey context block** (lives next to `pageContext` in the prompt assembly order: persona → custom instructions → page context → **audrey context** → capability prompt → widget data):

```text
You are an AI sales assistant for Audrey's Home & Gift, a wholesale home decor
and gift brand. Audrey's catalog is organized into Pre-Book pre-orders, Seasonal
ranges (Fall/Winter/Spring/Summer), and Home & Garden evergreen lines. Their
biggest current collections are A Blooming Porch, Gardeners Grove, The Herb
Garden, and Bunnies. The next major launch is the July 2026 Virtual Release.

When mentioning products, prefer the actual SKUs and product names from the
catalog file rather than generic terms. Audrey reps care about: case quantity,
minimum order quantity, pre-book ship windows (Sep/Oct/Dec), and PhaseOut
clearance.
```

**2. Tool/data shim** — when the LLM needs to reference specific products, pass the top N heroes for the active bucket into the prompt's `widget data` slot. Keep it small: 5–10 products max per turn, each compressed to `{sku, name, collection, retail_price, available_qty}`.

For touchpoint T2 (email body) and T3 (meeting talking points), include 2–4 hero product summaries in the user-side context so the LLM doesn't hallucinate product names.

---

## 10. Synthetic Data You Still Need to Build

The product catalog is real; everything else around it is fiction we author. Build these alongside the integration work:

**Customers** (~6–8 records). Use plausible gift-store and garden-center names. Each customer needs:
- name, region, store type, sales rep, credit limit, current balance
- a "recent orders" list referencing 3–5 hero SKUs each
- a couple of "open tasks" so Customer360Card has highlight bait
- a risk badge (some healthy, one or two warning, one urgent)

**Sales reps** (~3–4). The real API surfaced *Beth* (id 24786) — keep her as one of them, invent the others. Each rep has a territory, account list, and a "pipeline" sized in dollars.

**Orders** (~30–40). Most reference 2–4 SKUs each, weighted toward Featured Collections and July Release pre-orders. Statuses split across `Open`, `Submitted`, `Pre-Book Confirmed`, `Shipped`.

**Tasks** (~10–12). Things like *"Follow up with [customer] on Gardeners Grove refill"*, *"PhaseOut clearance call before market week"*. Several should be overdue to power the OVERDUE section of the brief.

**Notes / call summaries** (~5). For Gong/Salesloft-style "summary of last call" widgets. Reference real SKUs and collections.

Keep all of this in `src/data/audreys/synthetic/`, each as a typed const array. Import them from the same `audreys/index.ts` for a single source of truth.

---

## 11. Known Gaps & How to Handle Them

### Wholesale price is `0` on every product
The QueryProducts API returns `wholesalePrice: 0` for unauthenticated requests — these are gated to B2B buyer accounts. Three options:

1. **Best** — get a sandbox B2B login from Audrey before the demo, re-run the extractor with the auth cookie, and you get real prices.
2. **Honest** — display only `retail_price` and label it MSRP. Skip any "your margin" or "wholesale total" widgets.
3. **Synthetic** — multiply retail by `0.45` (industry-typical gift wholesale margin) at fixture-build time. Risky if the CEO knows their real numbers; only do this if option 1 isn't possible and you can't avoid showing wholesale figures.

Whichever you pick, isolate the price logic in one place (`src/data/audreys/pricing.ts`) so switching strategies later is a one-line change.

### Fall pre-book is essentially not in the catalog
Only one product landed in `fall_holdovers`. Audrey hasn't published their fall pre-book to the public API yet (probable B2B-gated, similar to wholesale price). Don't write scripts that lean on fall-pre-book content — the SKUs aren't there to back it up. The proactive brief recipe in §7 already accounts for this.

### Image sizes
`/medium/` is confirmed against live S3. `/large/` and `/original/` paths are guesses based on emun's conventions and weren't HEAD-verified. Recommend wrapping `image_urls_by_size.large` access in a fallback chain:

```ts
const heroImg =
  product.image_urls_by_size?.large?.[0] ??
  product.image_urls_by_size?.original?.[0] ??
  product.image_urls[0];
```

Or run `verify_image_urls.py` once locally to confirm — see `image_url_verification.json` for results.

### `spring_summer` bucket has only 1 product
After dedup, virtually every Spring & Summer product is *also* in a Featured Collection (A Blooming Porch / Gardeners Grove / Herb Garden / Bunnies are all spring). The Featured Collections bucket captured the bulk of spring. If a fixture really wants "generic Spring/Summer not in a featured collection", widen the source:

```ts
const allSpring = PRODUCTS.filter(p =>
  p.bucket === "spring_summer" || p.bucket === "featured_collections"
);
```

### Sale and PhaseOut overlap
Audrey tags some products as both "Sale" and "PhaseOut" Divisions. The bucketing logic routes them to `sale_clearance` regardless. If you need to distinguish "discounted" from "being-discontinued" for a chart, read `division[]` directly.

---

## 12. Quick-Start Checklist

1. Copy the four files into `src/data/audreys/` (rename as in §2).
2. Add `types.ts` from §3 and `accessors.ts` (small file — wraps the JSON imports).
3. Add the Audrey context block to the LLM system-prompt assembly (§9.1).
4. Stub the synthetic data files in `src/data/audreys/synthetic/` (§10) so the rest of the integration has something to import.
5. Wire the Products page to render `PRODUCTS` (§6.1).
6. Rewrite the 5 page-aware proactive briefs to use the recipes in §7.
7. Update `chip-map.ts` with the new templates in §8.
8. Re-skin the 8 pre-built dashboards using bucket roll-ups (§6.8).
9. Replace any "Acme Corp"-style placeholders in UC-1 / UC-2 / UC-3 fixtures with one of the synthetic customers from step 4.
10. Run a dry run of the full scripted demo end-to-end. Verify every product mention dereferences to a real SKU in `PRODUCTS`.

When all of that is in, you have a controlled demo where Kai speaks Audrey's actual product vocabulary — A Blooming Porch, July 2026 Virtual Release, Pick Of The Patch, Pre-Book ship windows — instead of generic placeholder content. That's the moment the CEO leans forward.

---

## Appendix — Files referenced

| Reference | Path |
|---|---|
| Curated catalog | `audreys_products.json` |
| Hero set | `audreys_heroes.json` |
| Collection taxonomy | `audreys_collections.json` |
| Picks summary (human-readable) | `audreys_curation_report.txt` |
| Raw API dump (audit trail) | `audreys_products_raw.json` |
| Image-URL verifier output | `image_url_verification.json` |
| Source extractor | `extract_audreys.py` |
| Source curator | `curate_audreys.py` |
