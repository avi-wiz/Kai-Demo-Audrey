import { z } from 'zod';
import { ORDERS, type AudreyOrder } from '@/data/audreys/synthetic/orders';
import { CUSTOMERS } from '@/data/audreys/synthetic/customers';
import { SALES_REPS } from '@/data/audreys/synthetic/sales-reps';
import { PRODUCTS } from '@/data/audreys/accessors';
import { resolveCustomerRef, resolveRepRef } from './resolveRef';

// SKU → collections lookup, built once. A SKU can belong to multiple
// collections; we explode each line into one bucket per collection so a
// SKU shared across "A Blooming Porch" and "Bunnies" credits both.
const skuToCollections: Record<string, string[]> = Object.fromEntries(
  PRODUCTS.map(p => [p.sku, p.collections ?? []]),
);

export const queryOrdersArgsSchema = z.object({
  customerId: z.string().optional(),
  repId: z.string().optional(),
  bucket: z.string().optional(),
  status: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  skuContains: z.string().optional(),
  groupBy: z.enum(['status', 'rep', 'customer', 'bucket', 'month', 'sku', 'collection']).optional(),
  aggregate: z.enum(['count', 'sum_total', 'sum_items']).optional(),
  limit: z.number().int().positive().max(50).optional(),
  /** Drop groups whose count is below this threshold (applied after grouping). */
  minCount: z.number().int().nonnegative().optional(),
  /** Drop groups whose aggregate is below this threshold (applied after grouping). */
  minAgg: z.number().nonnegative().optional(),
});

export type QueryOrdersArgs = z.infer<typeof queryOrdersArgsSchema>;

export interface HydratedOrder extends AudreyOrder {
  customerName: string;
  repName: string;
}

type RowResult = { kind: 'rows'; rows: HydratedOrder[]; truncated: boolean; total: number };
type GroupResult = {
  kind: 'groups';
  groups: { key: string; count: number; agg?: number }[];
  truncated: boolean;
  total: number;
};
export type QueryOrdersResult = RowResult | GroupResult;

const customerMap = Object.fromEntries(CUSTOMERS.map(c => [c.id, c.name]));
const repMap = Object.fromEntries(SALES_REPS.map(r => [r.id, r.name]));

function hydrate(o: AudreyOrder): HydratedOrder {
  return { ...o, customerName: customerMap[o.customerId] ?? o.customer, repName: repMap[o.repId] ?? o.rep };
}

export function queryOrders(args: QueryOrdersArgs): QueryOrdersResult {
  // Apply post-grouping filters (minCount, minAgg) and limit slice. Centralized
  // so every groupBy branch shares the same semantics.
  const finalizeGroups = (groups: { key: string; count: number; agg?: number }[]): GroupResult => {
    let filtered = groups;
    if (args.minCount !== undefined) filtered = filtered.filter(g => g.count >= args.minCount!);
    if (args.minAgg !== undefined) filtered = filtered.filter(g => (g.agg ?? 0) >= args.minAgg!);
    const total = filtered.length;
    const lim = args.limit ?? 50;
    return { kind: 'groups', groups: filtered.slice(0, lim), truncated: total > lim, total };
  };

  let rows = ORDERS.map(hydrate);

  // Tolerate name-style refs from the planner: "Magnolia" → "C-8001".
  if (args.customerId) {
    const resolved = resolveCustomerRef(args.customerId);
    rows = resolved ? rows.filter(o => o.customerId === resolved) : [];
  }
  if (args.repId) {
    const resolved = resolveRepRef(args.repId);
    rows = resolved ? rows.filter(o => o.repId === resolved) : [];
  }
  if (args.bucket) rows = rows.filter(o => o.bucket === args.bucket);
  if (args.status) rows = rows.filter(o => o.status.toLowerCase() === args.status!.toLowerCase());
  if (args.dateFrom) rows = rows.filter(o => o.date >= args.dateFrom!);
  if (args.dateTo) rows = rows.filter(o => o.date <= args.dateTo!);
  if (args.skuContains) {
    const q = args.skuContains.toLowerCase();
    rows = rows.filter(o => o.lines.some(l => l.sku.toLowerCase().includes(q) || l.name.toLowerCase().includes(q)));
  }

  if (!args.groupBy) {
    const total = rows.length;
    const truncated = total > 50;
    return { kind: 'rows', rows: rows.slice(0, args.limit ?? 50), truncated, total };
  }

  // groupBy='collection' explodes lines into per-collection buckets. A line
  // whose SKU belongs to N collections credits each (so revenue can sum to
  // more than total order revenue if SKUs are multi-tagged).
  if (args.groupBy === 'collection') {
    const collBuckets: Record<string, { count: number; revenue: number; units: number }> = {};
    for (const o of rows) {
      const seenInOrder = new Set<string>();
      for (const line of o.lines) {
        const collections = skuToCollections[line.sku] ?? ['Uncategorized'];
        const cols = collections.length > 0 ? collections : ['Uncategorized'];
        for (const c of cols) {
          const b = (collBuckets[c] ??= { count: 0, revenue: 0, units: 0 });
          // Order-count is dedup'd per (order, collection) so we don't
          // double-count multi-line orders against the same collection.
          if (!seenInOrder.has(`${o.id}|${c}`)) {
            b.count += 1;
            seenInOrder.add(`${o.id}|${c}`);
          }
          b.units += line.qty;
          b.revenue += line.qty * line.unitPrice;
        }
      }
    }
    const sorted = Object.entries(collBuckets).sort(([, a], [, b]) => {
      if (args.aggregate === 'sum_items') return b.units - a.units;
      return b.revenue - a.revenue;
    });
    const groups = sorted.map(([key, b]) => ({
      key,
      count: b.count,
      ...(args.aggregate === 'sum_items'
        ? { agg: b.units }
        : { agg: Math.round(b.revenue * 100) / 100 }),
    }));
    return finalizeGroups(groups);
  }

  // groupBy='sku' explodes order lines into per-SKU buckets. Other groupings
  // bucket by order-level field.
  if (args.groupBy === 'sku') {
    const skuBuckets: Record<string, { count: number; revenue: number; units: number; name: string }> = {};
    for (const o of rows) {
      for (const line of o.lines) {
        const b = (skuBuckets[line.sku] ??= { count: 0, revenue: 0, units: 0, name: line.name });
        b.count += 1;
        b.units += line.qty;
        b.revenue += line.qty * line.unitPrice;
      }
    }
    const sortedSkus = Object.entries(skuBuckets).sort(([, a], [, b]) => {
      if (args.aggregate === 'sum_items') return b.units - a.units;
      return b.revenue - a.revenue;
    });
    const groups = sortedSkus.map(([sku, b]) => ({
      key: `${sku} — ${b.name}`,
      count: b.count,
      ...(args.aggregate === 'sum_items'
        ? { agg: b.units }
        : { agg: Math.round(b.revenue * 100) / 100 }),
    }));
    return finalizeGroups(groups);
  }

  const buckets: Record<string, HydratedOrder[]> = {};
  for (const o of rows) {
    const key =
      args.groupBy === 'month' ? o.date.slice(0, 7) :
      args.groupBy === 'rep' ? o.repName :
      args.groupBy === 'customer' ? o.customerName :
      args.groupBy === 'bucket' ? o.bucket :
      o.status;
    (buckets[key] ??= []).push(o);
  }

  const groups = Object.entries(buckets).sort(([a], [b]) => a.localeCompare(b)).map(([key, items]) => {
    const count = items.length;
    let agg: number | undefined;
    if (args.aggregate === 'sum_total') agg = Math.round(items.reduce((s, o) => s + o.total, 0) * 100) / 100;
    else if (args.aggregate === 'sum_items') agg = items.reduce((s, o) => s + (o.items ?? 0), 0);
    return { key, count, ...(agg !== undefined ? { agg } : {}) };
  });

  return finalizeGroups(groups);
}

export const definitionForPrompt = `queryOrders(args):
  Filter: customerId, repId, bucket, status, dateFrom (YYYY-MM-DD), dateTo (YYYY-MM-DD), skuContains
  Group: groupBy = "status"|"rep"|"customer"|"bucket"|"month"|"sku"|"collection" (sku groups by line item; collection groups lines by their SKU's collection tag — a SKU in N collections credits each)
  Limit: limit = N (cap rows/groups; combine with groupBy + sort to get "top N" — defaults to 50 max)
  Post-group filters: minCount (drop groups with count < N), minAgg (drop groups with agg < N). Use for "more than N orders / more than $N revenue" queries.
  Aggregate: aggregate = "count"|"sum_total"|"sum_items"
  Returns rows (HydratedOrder[]) or groups ({key, count, agg?}). Max 50 rows.`;
