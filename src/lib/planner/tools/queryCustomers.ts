import { z } from 'zod';
import { CUSTOMERS, type AudreyCustomer } from '@/data/audreys/synthetic/customers';
import { ORDERS } from '@/data/audreys/synthetic/orders';
import { resolveRepRef } from './resolveRef';

export const queryCustomersArgsSchema = z.object({
  status: z.string().optional(),
  region: z.string().optional(),
  repId: z.string().optional(),
  customerType: z.string().optional(),
  minLifetimeRevenue: z.number().optional(),
  maxDaysSinceLastOrder: z.number().optional(),
  groupBy: z.enum(['status', 'region', 'rep']).optional(),
  aggregate: z.enum(['count', 'sum_lifetimeRevenue', 'sum_ordersYTD', 'sum_currentBalance']).optional(),
});

export type QueryCustomersArgs = z.infer<typeof queryCustomersArgsSchema>;

export interface HydratedCustomer extends AudreyCustomer {
  daysSinceLastOrder: number;
  orderCountTotal: number;
}

type RowResult = { kind: 'rows'; rows: HydratedCustomer[]; truncated: boolean; total: number };
type GroupResult = {
  kind: 'groups';
  groups: { key: string; count: number; agg?: number }[];
  truncated: boolean;
  total: number;
};
export type QueryCustomersResult = RowResult | GroupResult;

const TODAY = '2026-05-21';

function daysBetween(dateStr: string): number {
  return Math.floor((new Date(TODAY).getTime() - new Date(dateStr).getTime()) / 86400000);
}

function hydrate(c: AudreyCustomer): HydratedCustomer {
  const daysSinceLastOrder = c.lastOrder ? daysBetween(c.lastOrder) : 9999;
  const orderCountTotal = ORDERS.filter(o => o.customerId === c.id).length;
  return { ...c, daysSinceLastOrder, orderCountTotal };
}

export function queryCustomers(args: QueryCustomersArgs): QueryCustomersResult {
  let rows = CUSTOMERS.filter(c => c.id !== 'C-8050').map(hydrate);

  if (args.status) rows = rows.filter(c => c.status.toLowerCase() === args.status!.toLowerCase());
  if (args.region) rows = rows.filter(c => c.region.toLowerCase().includes(args.region!.toLowerCase()));
  if (args.repId) {
    const resolved = resolveRepRef(args.repId);
    rows = resolved ? rows.filter(c => c.repId === resolved) : [];
  }
  if (args.customerType) rows = rows.filter(c => c.customerType.toLowerCase().includes(args.customerType!.toLowerCase()));
  if (args.minLifetimeRevenue !== undefined) rows = rows.filter(c => c.lifetimeRevenue >= args.minLifetimeRevenue!);
  if (args.maxDaysSinceLastOrder !== undefined) rows = rows.filter(c => c.daysSinceLastOrder <= args.maxDaysSinceLastOrder!);

  if (!args.groupBy) {
    const total = rows.length;
    return { kind: 'rows', rows: rows.slice(0, 50), truncated: total > 50, total };
  }

  const buckets: Record<string, HydratedCustomer[]> = {};
  for (const c of rows) {
    const key =
      args.groupBy === 'status' ? c.status :
      args.groupBy === 'region' ? c.region :
      c.rep;
    (buckets[key] ??= []).push(c);
  }

  const groups = Object.entries(buckets).sort(([a], [b]) => a.localeCompare(b)).map(([key, items]) => {
    const count = items.length;
    let agg: number | undefined;
    if (args.aggregate === 'sum_lifetimeRevenue') agg = items.reduce((s, c) => s + c.lifetimeRevenue, 0);
    else if (args.aggregate === 'sum_ordersYTD') agg = items.reduce((s, c) => s + c.ordersYTD, 0);
    else if (args.aggregate === 'sum_currentBalance') agg = items.reduce((s, c) => s + c.currentBalance, 0);
    return { key, count, ...(agg !== undefined ? { agg } : {}) };
  });

  return { kind: 'groups', groups, truncated: false, total: groups.length };
}

export const definitionForPrompt = `queryCustomers(args):
  Filter: status ("Active"|"Warning"|"Dormant"|"Inactive"), region (substring), repId, customerType (substring),
          minLifetimeRevenue (number), maxDaysSinceLastOrder (number)
  Group: groupBy = "status"|"region"|"rep"
  Aggregate: aggregate = "count"|"sum_lifetimeRevenue"|"sum_ordersYTD"|"sum_currentBalance"
  Returns rows (HydratedCustomer[]) or groups. Excludes merge-target C-8050. Max 50 rows.`;
