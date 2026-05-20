# Demo-Stabilize 6 Operational Queries

## Context

The CEO demo script covers Caps 1–7 and a few special flows (recent orders, meeting prep, reports). Six **operational** queries that any sales leader would naturally type at this UI currently miss the matcher and either return generic uc1 customer-intel, fire the wrong report, or fall through to the LLM where the response is unpredictable. The goal is to make all six demo-stable: a typed query routes to a deterministic, Audrey-flavored fixture with the right output shape.

Prior coverage audit summary:
1. **Inventory status** — keyword fires but routes to a full UW-030 dashboard (wrong shape)
2. **Order status / recent orders (no customer)** — no route; existing `recent orders` fixture is scoped to a single customer
3. **Lead status** — no route
4. **Customers who purchased SKU X in last 15 days** — no route, no SKU resolution
5. **Current status of the order** → clarification → status text — no clarification flow exists for orders (AW-006 confirm handlers are hardcoded to ad17/ad29)
6. **List of open orders** — no route

User decisions from clarification:
- Query 5: build a **generic clarification handler** (new kind `'order-status'`), reusable beyond this one query
- Query 4: cover **three hero SKUs** with per-SKU fixtures, fall back to a helpful "no recent purchases" reply for others
- Query 1: **new simple-table fixture overrides `inventory status` keyword**; catalog-health stays reachable via `catalog health` / `catalog report`

## Files to modify

| File | Change |
|---|---|
| [src/lib/queryMatcher.ts](src/lib/queryMatcher.ts) | Add 5 new entries to `SPECIAL_ROUTES`; remove `'inventory status'` from the catalog-health entry in `CAPABILITY_ROUTES`; add SKU-aware special route for query 4 |
| [src/fixtures/special-inventory-status.json](src/fixtures/special-inventory-status.json) | NEW — UW-004 4-column table (Total/In-Stock/Back-order/In-Transit SKUs) computed from real `products.json` |
| [src/fixtures/special-orders-recent-status.json](src/fixtures/special-orders-recent-status.json) | NEW — UW-002 status-count tiles + UW-004 recent orders across all customers |
| [src/fixtures/special-leads-status.json](src/fixtures/special-leads-status.json) | NEW — UW-002 stage-count tiles + UW-004 lead list with stage/contact/rep |
| [src/fixtures/special-customers-by-sku-*.json](src/fixtures/) | NEW — 3 fixtures keyed by hero SKU (Bird Pot Feet, Cement Bird Feeder, A Blooming Porch lead SKU) |
| [src/fixtures/special-open-orders.json](src/fixtures/special-open-orders.json) | NEW — UW-004 filtered to `status IN (Open, Submitted, Pre-Book Confirmed, Shipped)` |
| [src/fixtures/special-order-status-clarify.json](src/fixtures/special-order-status-clarify.json) | NEW — AW-006 clarification card listing 4–5 recent order IDs |
| [src/fixtures/special-order-status-*.json](src/fixtures/) | NEW — one per option in the clarification card; each is a closing-text-only frame describing the picked order's status |
| [src/components/chat/ChatShell.tsx](src/components/chat/ChatShell.tsx) | Add generic clarification kind `'order-status'`: new turn type, renderer reusing existing `MetricClarificationTurnRenderer` pattern (~line 998–1073), new confirm handler that spawns a follow-up turn loading `special-order-status-{orderId}.json` |
| [src/lib/types.ts](src/lib/types.ts) | Add `'order-status'` literal alongside existing `'metric-clarification'` / `'workflow-clarification'` turn kinds |

## Detailed changes

### 1. Query 1 — Inventory status

**Route:** Add to `SPECIAL_ROUTES` (queryMatcher.ts ~line 137) BEFORE the existing routes so it wins on the `inventory` keyword:
```ts
{
  keywords: ['inventory status', "what's my inventory", 'what is my inventory', 'status of my inventory', 'status of inventory', 'sku status', 'stock breakdown'],
  fixture: inventoryStatusFixture,
}
```
**Remove** `'inventory status'` from the catalog-health entry in `CAPABILITY_ROUTES` (line 232).

**Fixture content** (`special-inventory-status.json`):
- UW-014 reasoning card (collapsed): 3 steps — `fetch_skus` / `bucket_by_state` / `compute_in_transit`
- UW-004 DataTable, 1 row × 4 columns:
  - `Total SKUs` — 50 (from `PRODUCTS.length`)
  - `In-Stock SKUs` — ~35 (count where `available_qty > 0` and not PhaseOut)
  - `Back-order SKUs` — count where `available_qty ≤ 0` (compute from products.json)
  - `In-Transit SKUs` — ~5 (matches pre-book pacing narrative)
- Closing text (insight): mentions PhaseOut overlap and that 15 of the 50 are clearance-bucket

### 2. Query 2 — Order status (no specific customer)

**Route:**
```ts
{
  keywords: ['status of my orders', 'status of my recent orders', 'orders placed recently', 'recent order status', 'how are my orders'],
  fixture: ordersRecentStatusFixture,
}
```

**Fixture:** UW-002 row of 5 status counters (Open / Submitted / Pre-Book Confirmed / Shipped / Delivered) + UW-004 table of the 15 most recent orders from `synthetic/orders.ts` showing `orderId`, `customer`, `rep`, `date`, `status` (badge), `total`. Closing text (insight) calls out the Pre-Book queue and any partial-shipped lines.

### 3. Query 3 — Lead status

**Route:**
```ts
{
  keywords: ['status of my leads', 'my leads', 'how are my leads', 'lead status', 'leads status'],
  fixture: leadsStatusFixture,
}
```

**Fixture:** UW-002 counts by stage (using `AudreyLead.status` values: New / Qualified / Working / etc.) + UW-004 of all 6 leads from `synthetic/leads.ts` with `id`, `name`, `region`, `status`, `assignedTo`, `lastContact`. Closing text (insight) ties to the Cap 2/3 storyline (Pine & Thistle just added, Verdant Home moving to Won).

### 4. Query 4 — Customers who purchased SKU X in last 15 days

**Route:** SKU-aware matcher in `matchSpecialQuery` (queryMatcher.ts) — match `purchased` + (`last \d+ days` OR `in the last`) + a hero-SKU keyword or SKU id. Dispatch to one of:
- `special-customers-by-sku-bird-pot-feet.json` (Bird Pot Feet — PhaseOut narrative)
- `special-customers-by-sku-cement-bird-feeder.json` (51GR1776-U — Featured Collections top-seller)
- `special-customers-by-sku-blooming-porch.json` (A Blooming Porch lead SKU)

Each fixture: UW-014 (1-step `search_orders_by_sku`) + UW-004 with columns `customer`, `customerId`, `orderDate`, `units`, `rep` (3–5 rows drawn from `synthetic/orders.ts` filtered by the SKU). Closing text references real Audrey customers (Magnolia, Potting Shed, etc.). If query mentions a SKU we don't have a fixture for, fall through to the LLM (no fixture, so general matcher handles it).

### 5. Query 5 — Order status clarification flow

**Route:**
```ts
// Uses a distinct return type — emits a clarification-staged turn, not a result turn
{
  keywords: ['current status of the order', 'status of the order', 'check order status', 'where is my order'],
  fixture: orderStatusClarifyFixture,
}
```

**New turn kind in [types.ts](src/lib/types.ts):** add `'order-status'` to the existing clarification-kind union (model after `metric-clarification` / `workflow-clarification`).

**Clarify fixture (`special-order-status-clarify.json`):**
- UW-014 reasoning: "Multiple recent orders found — confirming which one"
- AW-006 ClarificationCard with `mode: 'single'`, options = 5 most recent open orders. Each option `{ value: orderId, label: 'ORD-xxxxx — Customer Name', description: '$x,xxx · {date} · {status}' }`
- Closing text (question): "Which order do you want details on?"

**ChatShell generic clarification handler:**
- New turn type `OrderStatusClarificationTurn` (mirror `MetricClarificationTurn` at ~line 232)
- New `OrderStatusClarificationTurnRenderer` (mirror `MetricClarificationTurnRenderer` at ~line 998–1073) — renders the AW-006 from the staged options
- New `handleOrderStatusClarificationConfirm(selectedOrderId)` (~line 3416 sibling) — dynamically imports `special-order-status-{orderId}.json` and spawns a follow-up turn with just the closing text + a small UW-003 entity card

**Per-order follow-up fixtures (5 files, e.g. `special-order-status-ORD-A8012.json`):**
- UW-003 EntityDetailCard with order header (id, date, customer, rep, status, total)
- Closing text (description): plain-English status: "ORD-A8012 to Magnolia Home & Garden is on the truck — left the Atlanta DC Tuesday, expected delivery May 22. All 12 SKUs from A Blooming Porch are in this shipment."

### 6. Query 6 — Open orders list

**Route:**
```ts
{
  keywords: ['list of open orders', 'open orders', 'show open orders', 'pending orders'],
  fixture: openOrdersFixture,
}
```

**Fixture:** UW-002 (4 counters — Open / Submitted / Pre-Book Confirmed / Shipped) + UW-004 filtered to those statuses from `synthetic/orders.ts`, sorted by date desc. Closing text (insight) flags any Pre-Book deadlines coming up.

## Reused infrastructure

- **Matcher pattern:** `SPECIAL_ROUTES` static-import + keyword array → `PageContextMatch { widgets, closingText }` (queryMatcher.ts:137)
- **AW-006 renderer:** `MetricClarificationTurnRenderer` (ChatShell.tsx:998–1073) → cloned for `order-status`
- **DataTable shape:** `{ title, columns: [{key, label, align?, format?}], rows: [...] }` per [DataTable.tsx:64-66](src/components/widgets/ui/DataTable.tsx#L64-L66) + types.ts:550–570
- **ClosingText enum:** `'insight' | 'description' | 'question' | 'action_summary'` (types.ts:393)
- **Audrey data accessors:** `PRODUCTS`, `HEROES` from `@/data/audreys` for SKU counts and SKU resolution; `ORDERS`, `LEADS`, `CUSTOMERS` from `@/data/audreys/synthetic` for table rows

## Things explicitly NOT in this pass

- Real-time computation of inventory state — fixture values are hand-rolled to match the products.json snapshot, not computed at runtime
- Adding the new flows to the demo script or page starter prompts — that's a separate authoring pass
- SKU resolution for arbitrary SKUs in query 4 — only the 3 hero SKUs are wired; other SKUs fall through
- A generic "any-clarification" framework — `order-status` is the second concrete kind alongside `metric-clarification`, not a fully abstract picker

## Verification

1. `npx tsc --noEmit` — must pass.
2. `npm run dev` and open `localhost:3000`.
3. From the Kai chat input, type each of these and confirm the rendered output matches the spec:
   - "What is my inventory status?" → 1×4 data table with the four SKU columns
   - "What is the status of my orders?" → status-count tiles + recent orders table
   - "What is the status of my leads?" → stage-count tiles + leads table
   - "Find me the list of customers who have purchased Bird Pot Feet in the last 15 days" → customer list table, ~3 rows
   - "What is the current status of the order" → clarification card with 5 order options → pick one → status text renders below
   - "List of open orders" → open-orders status counts + filtered table
4. Send "catalog health" — confirm the OLD UW-030 dashboard still renders (i.e., the keyword split didn't break it).
5. Send "What is the current status of order ORD-X9999" (unknown id) — confirm it still shows the clarification card (fixture isn't id-specific at the entry point).
6. Spot-check: no fixture references "Acme Corp" or `C-4201` — every customer/lead/rep/SKU comes from `src/data/audreys/`.
