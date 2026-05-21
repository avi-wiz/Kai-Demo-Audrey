# Products Reskin — Audrey's Home & Gift

## Context

Reskin the WizOrder Products page so the grid sources from `PRODUCTS` / `HEROES` in `src/data/audreys/` instead of the generic Acme fixture (`src/fixtures/wizorder-products.json`). Cards render real product images, real SKUs, MSRP via `getDisplayPrice()`, case qty, and a stock-status badge derived from `stock_status` + `bucket`. Hero SKUs get a "Featured" / "New Launch" ribbon. Filter chips switch from generic stock filters to four named collections + Garden Evergreen + PhaseOut. Brief + starter prompts are rewritten for Audrey.

## Files Modified

| # | File | Change |
|---|---|---|
| 1 | [src/components/wizorder/ProductsPage.tsx](../src/components/wizorder/ProductsPage.tsx) | Full rewrite — source from `PRODUCTS`/`HEROES`, new card layout (image, SKU, MSRP, case qty, ribbon, stock badge), new filter chips by collection/bucket, card click dispatches query event |
| 2 | [src/fixtures/proactive-brief-products.json](../src/fixtures/proactive-brief-products.json) | Rewrite brief — Featured Collections sell-through + refill threshold callout + "Build a Gardeners Grove refill list" chip |
| 3 | [src/contexts/PageContext.tsx](../src/contexts/PageContext.tsx) | Replace 4 `products` starters (lines 43–48) |
| 4 | [src/components/chat/ChatShell.tsx](../src/components/chat/ChatShell.tsx) | Add a `window` event listener (`kai:ask`) inside ChatShell that funnels into the existing chip-click submit path — enables card click → Kai query without exporting an `askKai` symbol |

One file (ChatShell) gets a minimally invasive bridge so the Products page can dispatch queries; no public API change.

## 1. ProductsPage.tsx — Real catalog grid

### Imports
```ts
import { PRODUCTS, HEROES, byCollection, byBucket, getDisplayPrice } from '@/data/audreys';
import type { AudreyProduct } from '@/data/audreys/types';
```

### Data source
```ts
const FEATURED_FIRST: AudreyProduct[] = [...HEROES, ...PRODUCTS.filter(p => !p.is_hero)];
```
Heroes-first ordering ensures the named-in-prose SKUs (18 of them) lead the page.

### Filter chips (replace `STATUS_FILTERS`)

| Chip label | Source |
|---|---|
| All | `FEATURED_FIRST` |
| A Blooming Porch | `byCollection('A Blooming Porch')` |
| Gardeners Grove | `byCollection('Gardeners Grove')` |
| The Herb Garden | `byCollection('The Herb Garden')` |
| Bunnies | `byCollection('Bunnies')` |
| Garden Evergreen | `byBucket('garden_outdoor')` |
| PhaseOut | `byBucket('sale_clearance')` |

Implementation: a `FILTERS: { label, get: () => AudreyProduct[] }[]` array; clicking a chip swaps the displayed list (re-applied to FEATURED_FIRST ordering by intersecting via a Set of SKUs).

```ts
const FILTERS: { label: string; resolve: () => AudreyProduct[] }[] = [
  { label: 'All',                resolve: () => FEATURED_FIRST },
  { label: 'A Blooming Porch',   resolve: () => byCollection('A Blooming Porch') },
  { label: 'Gardeners Grove',    resolve: () => byCollection('Gardeners Grove') },
  { label: 'The Herb Garden',    resolve: () => byCollection('The Herb Garden') },
  { label: 'Bunnies',            resolve: () => byCollection('Bunnies') },
  { label: 'Garden Evergreen',   resolve: () => byBucket('garden_outdoor') },
  { label: 'PhaseOut',           resolve: () => byBucket('sale_clearance') },
];
```

For non-`All` filters, we re-order the resolved set by the index in `FEATURED_FIRST` so heroes still float to the top within the filtered view.

### Stock badge derivation

Real `stock_status` distribution in the catalog:

| `stock_status` | Count | Badge |
|---|---|---|
| `In Stock` | 34 | **In Stock** — green |
| `Buy Now, Limited Quantity` | 8 | **Limited Quantity** — amber |
| `Pre-Book` | 5 | **Pre-Book** — blue |
| `Out of Stock` | 3 | (handled below) |

Plus bucket override:
- If `product.bucket === 'sale_clearance'` → force **PhaseOut** (red), regardless of `stock_status`.

```ts
type StockKind = 'in-stock' | 'pre-book' | 'limited' | 'phaseout';

function stockKind(p: AudreyProduct): StockKind {
  if (p.bucket === 'sale_clearance') return 'phaseout';
  if (p.stock_status === 'Pre-Book') return 'pre-book';
  if (p.stock_status === 'Buy Now, Limited Quantity') return 'limited';
  return 'in-stock';
}

const STOCK_BADGE: Record<StockKind, { label: string; bg: string; text: string; border: string }> = {
  'in-stock':  { label: 'In Stock',         bg: 'var(--badge-success-bg)', text: 'var(--badge-success-text)', border: 'var(--badge-success-border)' },
  'pre-book':  { label: 'Pre-Book',         bg: 'var(--badge-info-bg)',    text: 'var(--badge-info-text)',    border: 'var(--badge-info-border)' },
  'limited':   { label: 'Limited Quantity', bg: 'var(--badge-warning-bg)', text: 'var(--badge-warning-text)', border: 'var(--badge-warning-border)' },
  'phaseout':  { label: 'PhaseOut',         bg: 'var(--badge-danger-bg)',  text: 'var(--badge-danger-text)',  border: 'var(--badge-danger-border)' },
};
```

Note: I'm deliberately dropping the literal 3 `Out of Stock` SKUs into one of the above buckets (they're all in `sale_clearance` per spot-check, so they'll all show PhaseOut). If demo needs an explicit OOS state, easy add — flag and move on.

### Card layout

Replace the placeholder emoji thumbnail with the real image using the standard fallback chain from CLAUDE.md:

```ts
const img =
  product.image_urls_by_size?.large?.[0] ??
  product.image_urls_by_size?.original?.[0] ??
  product.image_urls[0];
```

Card structure (top → bottom):
1. **Image** — 100% width × 160px, `object-fit: cover`, `background: var(--surface2)` placeholder shown if `<img>` fails (onError handler hides the img and shows a 📦 fallback).
2. **Ribbon** (absolute-positioned top-left over the image) — only if `is_hero`:
   - `is_new === true` → "New Launch" (indigo / primary background)
   - else → "Featured" (amber background)
3. **Name** — Satoshi 13/700, 2-line clamp.
4. **SKU** — JetBrains Mono 11/500, `var(--text3)`.
5. **Price + Case qty row** — left: `MSRP $XX.XX` via `getDisplayPrice()`; right: `Case: N` in mono.
6. **Stock badge** — bottom row, right-aligned.

Click handler:
```tsx
<div role="button" tabIndex={0}
  onClick={() => window.dispatchEvent(new CustomEvent('kai:ask', { detail: { query: `Tell me about ${product.sku}` } }))}
  onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); /* same dispatch */ } }}
  ...
>
```

Why a window event rather than `askKai()`: there is no exported chat-submit API in the codebase today. `ChatShell.tsx` owns the submit pipeline (`handleChipClick` / message construction). A `kai:ask` window event listened to inside ChatShell is the smallest bridge that doesn't require lifting state up or threading callbacks through 3 layers of providers. See section 4.

### setPage payload
```ts
setPage('products', {
  products: FEATURED_FIRST,
  totalSkus: PRODUCTS.length,
  heroCount: HEROES.length,
});
```

### Header count line
Stays — but now reads e.g. `50 products` or `8 products · Gardeners Grove`.

## 2. proactive-brief-products.json

Replace with:

```json
{
  "briefType": "page-products",
  "greeting": "Your Featured Collections are carrying the catalog.",
  "urgentItems": [
    {
      "icon": "trend",
      "text": "Gardeners Grove is 42% sold through; A Blooming Porch at 38%.",
      "priority": "attention",
      "actionChip": {
        "label": "Build a Gardeners Grove refill list",
        "query": "Build a refill list for Gardeners Grove",
        "icon": "list",
        "category": "page-action"
      }
    },
    {
      "icon": "alert",
      "text": "Window - Hello Spring, Herbs and Cement Planter - Urn are below refill threshold.",
      "priority": "urgent",
      "actionChip": {
        "label": "Show refill candidates",
        "query": "Which Featured Collections SKUs are below refill threshold?",
        "icon": "search",
        "category": "page-action"
      }
    }
  ],
  "todaysSummary": [
    { "icon": "package", "text": "50 active SKUs across 7 buckets", "priority": "info" },
    { "icon": "star",    "text": "18 hero SKUs lead the catalog",   "priority": "info" }
  ]
}
```

**Refill-candidate selection** — chose by picking the two `featured_collections` heroes with the lowest `available_qty`:

| SKU | Name | available_qty | Collection |
|---|---|---|---|
| 51GR1643 | Window - Hello Spring, Herbs | 76 | The Herb Garden |
| 51GR1905 | Cement Planter - Urn | 204 | A Blooming Porch |

These two are named in the urgent item. (51GR1522-U Cottage Bunny — Sitting Up at 225 is the next candidate if we want a swap.)

## 3. PageContext.tsx — Products starter prompts

[src/contexts/PageContext.tsx:43–48](../src/contexts/PageContext.tsx) — replace verbatim:

```ts
products: [
  "How's our July 2026 release pacing?",
  'Show me Featured Collections inventory',
  'Which SKUs are in PhaseOut?',
  'Top-selling birdhouses this quarter',
],
```

## 4. ChatShell.tsx — `kai:ask` event bridge

ChatShell already wires `handleChipClick(query: string)` that constructs a user message and runs the pipeline. Add inside ChatShell's body:

```ts
useEffect(() => {
  function onAsk(e: Event) {
    const ce = e as CustomEvent<{ query: string }>;
    if (ce.detail?.query) handleChipClick(ce.detail.query);
  }
  window.addEventListener('kai:ask', onAsk);
  return () => window.removeEventListener('kai:ask', onAsk);
}, [handleChipClick]);
```

This is the minimum surface needed for the Products card click to reach Kai. The plan deliberately keeps this generic — same hook will serve future page widgets (Customers row click, Orders row click, etc.) without further plumbing.

**Risk note:** `handleChipClick` must be stable or wrapped in `useCallback` to avoid re-binding the listener every render. Quick check on existing code before implementing — if it isn't already a callback, hoist it or use a ref shim. Not blocking.

## What I'm NOT doing (deliberate)

- **Not** rendering an `EntityDetailCard` directly from the card click. The spec offered either dispatch-query *or* render-detail-card; the dispatch path keeps everything inside the Kai conversation flow (consistent with how the rest of the demo works) and gives the LLM a chance to enrich the response. Render-detail-card would require a side channel into ChatShell's turn list and double the surface area.
- **Not** touching `wizorder-products.json` — leaving the file in place since other things may still import it; the page just stops reading from it.
- **Not** changing the v2 widget contract. `EntityDetailCardData` etc. unchanged.
- **Not** adding a hover state showing stock count — the original card showed `In Stock · 240`. With 4 stock kinds and the `available_qty` field already exposed in the right column ("Case: N" + price), adding raw stock counts to every badge clutters the cards. If desired, easy add to "In Stock" only.

## Sanity numbers (derived now)

- `PRODUCTS.length` = **50**
- `HEROES.length` = **18**
- Filter counts:
  - A Blooming Porch — `byCollection('A Blooming Porch')` (multi-collection products will appear in their respective filters too)
  - Gardeners Grove — `byCollection('Gardeners Grove')`
  - The Herb Garden — `byCollection('The Herb Garden')`
  - Bunnies — `byCollection('Bunnies')`
  - Garden Evergreen — `byBucket('garden_outdoor')` = **8**
  - PhaseOut — `byBucket('sale_clearance')` = **15**
- Lowest-qty featured_collections heroes (refill threshold callout): **51GR1643** (76 units), **51GR1905** (204 units).

## Verification

1. `npx tsc --noEmit` — must pass clean.
2. Boot dev server, navigate to Products tab:
   - Heroes lead the grid (real images, "Featured" or "New Launch" ribbon on hero cards).
   - Each card shows: image, name, SKU (mono), MSRP, case qty, stock badge.
   - Stock badges: In Stock (green), Pre-Book (blue), Limited Quantity (amber), PhaseOut (red) — sale_clearance SKUs all read PhaseOut.
   - Filter chips: All / A Blooming Porch / Gardeners Grove / The Herb Garden / Bunnies / Garden Evergreen / PhaseOut.
   - Click a card → Kai receives "Tell me about &lt;SKU&gt;" and responds.
   - Brief greets with Featured Collections sell-through + names the two refill SKUs.
   - 4 starter chips read as listed.
3. Browser network tab — confirm real `s3.amazonaws.com/emuncloud-staticassets/…` image URLs resolve (not local placeholders).
