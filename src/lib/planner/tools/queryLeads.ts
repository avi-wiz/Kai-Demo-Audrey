import { z } from 'zod';
import { LEADS, type AudreyLead } from '@/data/audreys/synthetic/leads';
import { SALES_REPS } from '@/data/audreys/synthetic/sales-reps';
import { resolveRepRef } from './resolveRef';

export const queryLeadsArgsSchema = z.object({
  status: z.string().optional(),
  repId: z.string().optional(),
  region: z.string().optional(),
  source: z.string().optional(),
  hasBeenContacted: z.boolean().optional(),
  groupBy: z.enum(['status', 'source', 'rep', 'region']).optional(),
  aggregate: z.enum(['count']).optional(),
});

export type QueryLeadsArgs = z.infer<typeof queryLeadsArgsSchema>;

export interface HydratedLead extends AudreyLead {
  repName: string;
}

type RowResult = { kind: 'rows'; rows: HydratedLead[]; truncated: boolean; total: number };
type GroupResult = {
  kind: 'groups';
  groups: { key: string; count: number }[];
  truncated: boolean;
  total: number;
};
export type QueryLeadsResult = RowResult | GroupResult;

const repMap = Object.fromEntries(SALES_REPS.map(r => [r.id, r.name]));

function hydrate(l: AudreyLead): HydratedLead {
  return { ...l, repName: repMap[l.repId] ?? l.assignedTo };
}

export function queryLeads(args: QueryLeadsArgs): QueryLeadsResult {
  let rows = LEADS.filter(l => !l.archived).map(hydrate);

  if (args.status) rows = rows.filter(l => l.status.toLowerCase() === args.status!.toLowerCase());
  if (args.repId) {
    const resolved = resolveRepRef(args.repId);
    rows = resolved ? rows.filter(l => l.repId === resolved) : [];
  }
  if (args.region) rows = rows.filter(l => l.region.toLowerCase().includes(args.region!.toLowerCase()));
  if (args.source) rows = rows.filter(l => l.source.toLowerCase() === args.source!.toLowerCase());
  if (args.hasBeenContacted !== undefined) {
    rows = args.hasBeenContacted
      ? rows.filter(l => l.lastContact !== null)
      : rows.filter(l => l.lastContact === null);
  }

  if (!args.groupBy) {
    const total = rows.length;
    return { kind: 'rows', rows: rows.slice(0, 50), truncated: total > 50, total };
  }

  const buckets: Record<string, HydratedLead[]> = {};
  for (const l of rows) {
    const key =
      args.groupBy === 'status' ? l.status :
      args.groupBy === 'source' ? l.source :
      args.groupBy === 'rep' ? l.repName :
      l.region;
    (buckets[key] ??= []).push(l);
  }

  const groups = Object.entries(buckets).sort(([a], [b]) => a.localeCompare(b)).map(([key, items]) => ({
    key,
    count: items.length,
  }));

  return { kind: 'groups', groups, truncated: false, total: groups.length };
}

export const definitionForPrompt = `queryLeads(args):
  Filter: status ("New"|"Contacted"|"Qualified"), repId, region (substring), source ("Trade Show"|"Website"|"Referral"),
          hasBeenContacted (boolean)
  Group: groupBy = "status"|"source"|"rep"|"region"
  Aggregate: aggregate = "count"
  Returns rows (HydratedLead[]) or groups. Excludes archived leads. Max 50 rows.`;
