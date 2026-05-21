import { z } from 'zod';
import { PRODUCTS } from '@/data/audreys/accessors';
import type { AudreyProduct, ProductBucket } from '@/data/audreys/types';

export const queryProductsArgsSchema = z.object({
  bucket: z.string().optional(),
  collection: z.string().optional(),
  stockStatus: z.string().optional(),
  isHero: z.boolean().optional(),
  skuContains: z.string().optional(),
  nameContains: z.string().optional(),
  groupBy: z.enum(['bucket', 'collection', 'stockStatus']).optional(),
  aggregate: z.enum(['count', 'sum_availableQty']).optional(),
});

export type QueryProductsArgs = z.infer<typeof queryProductsArgsSchema>;

export interface HydratedProduct extends AudreyProduct {
  stockStatus: 'In Stock' | 'Pre-Book' | 'Limited Quantity' | 'PhaseOut';
}

type RowResult = { kind: 'rows'; rows: HydratedProduct[]; truncated: boolean; total: number };
type GroupResult = {
  kind: 'groups';
  groups: { key: string; count: number; agg?: number }[];
  truncated: boolean;
  total: number;
};
export type QueryProductsResult = RowResult | GroupResult;

function deriveStockStatus(p: AudreyProduct): HydratedProduct['stockStatus'] {
  if (p.bucket === 'sale_clearance') return 'PhaseOut';
  if (p.bucket === 'july_release') return 'Pre-Book';
  if ((p.available_qty ?? 0) < 5) return 'Limited Quantity';
  return 'In Stock';
}

function hydrate(p: AudreyProduct): HydratedProduct {
  return { ...p, stockStatus: deriveStockStatus(p) };
}

export function queryProducts(args: QueryProductsArgs): QueryProductsResult {
  let rows = (PRODUCTS as AudreyProduct[]).map(hydrate);

  if (args.bucket) rows = rows.filter(p => p.bucket === args.bucket);
  if (args.collection) rows = rows.filter(p => p.collections.some(c => c.toLowerCase().includes(args.collection!.toLowerCase())));
  if (args.stockStatus) rows = rows.filter(p => p.stockStatus.toLowerCase() === args.stockStatus!.toLowerCase());
  if (args.isHero !== undefined) rows = rows.filter(p => !!p.is_hero === args.isHero);
  if (args.skuContains) rows = rows.filter(p => p.sku.toLowerCase().includes(args.skuContains!.toLowerCase()));
  if (args.nameContains) rows = rows.filter(p => p.name.toLowerCase().includes(args.nameContains!.toLowerCase()));

  if (!args.groupBy) {
    const total = rows.length;
    return { kind: 'rows', rows: rows.slice(0, 50), truncated: total > 50, total };
  }

  const buckets: Record<string, HydratedProduct[]> = {};
  for (const p of rows) {
    const key =
      args.groupBy === 'bucket' ? p.bucket :
      args.groupBy === 'collection' ? (p.collections[0] ?? 'Unknown') :
      p.stockStatus;
    (buckets[key] ??= []).push(p);
  }

  const groups = Object.entries(buckets).sort(([a], [b]) => a.localeCompare(b)).map(([key, items]) => {
    const count = items.length;
    let agg: number | undefined;
    if (args.aggregate === 'sum_availableQty') agg = items.reduce((s, p) => s + (p.available_qty ?? 0), 0);
    return { key, count, ...(agg !== undefined ? { agg } : {}) };
  });

  return { kind: 'groups', groups, truncated: false, total: groups.length };
}

export const definitionForPrompt = `queryProducts(args):
  Filter: bucket (ProductBucket string), collection (substring), stockStatus ("In Stock"|"Pre-Book"|"Limited Quantity"|"PhaseOut"),
          isHero (boolean), skuContains (substring), nameContains (substring)
  Group: groupBy = "bucket"|"collection"|"stockStatus"
  Aggregate: aggregate = "count"|"sum_availableQty"
  Returns rows (HydratedProduct[]) or groups. Max 50 rows.`;
