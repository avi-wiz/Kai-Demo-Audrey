import { z } from 'zod';
import { SALES_REPS, type AudreySalesRep } from '@/data/audreys/synthetic/sales-reps';
import { ORDERS } from '@/data/audreys/synthetic/orders';
import { DEALS } from '@/data/audreys/synthetic/deals';
import { TASKS } from '@/data/audreys/synthetic/tasks';
import { CUSTOMERS } from '@/data/audreys/synthetic/customers';
import { resolveRepRef } from './resolveRef';

export const queryRepsArgsSchema = z.object({
  repId: z.string().optional(),
  territory: z.string().optional(),
  groupBy: z.enum(['territory']).optional(),
  aggregate: z.enum(['count', 'sum_ytdRevenue', 'sum_pipelineValue']).optional(),
});

export type QueryRepsArgs = z.infer<typeof queryRepsArgsSchema>;

export interface HydratedRep extends AudreySalesRep {
  activeCustomerCount: number;
  openTaskCount: number;
  openDealCount: number;
  openDealValue: number;
  orderCount: number;
}

type RowResult = { kind: 'rows'; rows: HydratedRep[]; truncated: boolean; total: number };
type GroupResult = {
  kind: 'groups';
  groups: { key: string; count: number; agg?: number }[];
  truncated: boolean;
  total: number;
};
export type QueryRepsResult = RowResult | GroupResult;

function hydrate(r: AudreySalesRep): HydratedRep {
  const activeCustomerCount = CUSTOMERS.filter(c => c.repId === r.id && c.status === 'Active').length;
  const openTaskCount = TASKS.filter(t => t.repId === r.id && (t.status === 'Open' || t.status === 'Overdue')).length;
  const openDeals = DEALS.filter(d => d.repId === r.id && d.stage !== 'Closed Won' && d.stage !== 'Closed Lost');
  const openDealCount = openDeals.length;
  const openDealValue = openDeals.reduce((s, d) => s + d.value, 0);
  const orderCount = ORDERS.filter(o => o.repId === r.id).length;
  return { ...r, activeCustomerCount, openTaskCount, openDealCount, openDealValue, orderCount };
}

export function queryReps(args: QueryRepsArgs): QueryRepsResult {
  let rows = SALES_REPS.map(hydrate);

  if (args.repId) {
    const resolved = resolveRepRef(args.repId);
    rows = resolved ? rows.filter(r => r.id === resolved) : [];
  }
  if (args.territory) rows = rows.filter(r => r.territory.toLowerCase().includes(args.territory!.toLowerCase()));

  if (!args.groupBy) {
    return { kind: 'rows', rows: rows.slice(0, 50), truncated: false, total: rows.length };
  }

  const buckets: Record<string, HydratedRep[]> = {};
  for (const r of rows) {
    const key = r.territory;
    (buckets[key] ??= []).push(r);
  }

  const groups = Object.entries(buckets).sort(([a], [b]) => a.localeCompare(b)).map(([key, items]) => {
    const count = items.length;
    let agg: number | undefined;
    if (args.aggregate === 'sum_ytdRevenue') agg = items.reduce((s, r) => s + r.ytdRevenue, 0);
    else if (args.aggregate === 'sum_pipelineValue') agg = items.reduce((s, r) => s + r.pipelineValue, 0);
    return { key, count, ...(agg !== undefined ? { agg } : {}) };
  });

  return { kind: 'groups', groups, truncated: false, total: groups.length };
}

export const definitionForPrompt = `queryReps(args):
  Filter: repId, territory (substring: "Southeast"|"Mid-South"|"Mountain/West"|"Northeast")
  Group: groupBy = "territory"
  Aggregate: aggregate = "count"|"sum_ytdRevenue"|"sum_pipelineValue"
  Returns rows (HydratedRep[] with activeCustomerCount, openTaskCount, openDealCount, openDealValue, orderCount) or groups.`;
