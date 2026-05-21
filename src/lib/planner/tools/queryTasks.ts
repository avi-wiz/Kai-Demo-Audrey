import { z } from 'zod';
import { TASKS, type AudreyTask } from '@/data/audreys/synthetic/tasks';
import { SALES_REPS } from '@/data/audreys/synthetic/sales-reps';
import { resolveCustomerRef, resolveLeadRef, resolveRepRef } from './resolveRef';

export const queryTasksArgsSchema = z.object({
  status: z.string().optional(),
  priority: z.string().optional(),
  type: z.string().optional(),
  repId: z.string().optional(),
  customerId: z.string().optional(),
  leadId: z.string().optional(),
  dueBefore: z.string().optional(),
  createdAfter: z.string().optional(),
  groupBy: z.enum(['status', 'priority', 'type', 'rep']).optional(),
  aggregate: z.enum(['count']).optional(),
});

export type QueryTasksArgs = z.infer<typeof queryTasksArgsSchema>;

export interface HydratedTask extends AudreyTask {
  repName: string;
  isOverdue: boolean;
}

type RowResult = { kind: 'rows'; rows: HydratedTask[]; truncated: boolean; total: number };
type GroupResult = {
  kind: 'groups';
  groups: { key: string; count: number }[];
  truncated: boolean;
  total: number;
};
export type QueryTasksResult = RowResult | GroupResult;

const repMap = Object.fromEntries(SALES_REPS.map(r => [r.id, r.name]));
const TODAY = '2026-05-21';

function hydrate(t: AudreyTask): HydratedTask {
  const repName = repMap[t.repId] ?? t.assignedTo;
  const isOverdue = t.status === 'Overdue' || (t.status === 'Open' && t.dueDate < TODAY);
  return { ...t, repName, isOverdue };
}

export function queryTasks(args: QueryTasksArgs): QueryTasksResult {
  let rows = TASKS.map(hydrate);

  if (args.status) rows = rows.filter(t => t.status.toLowerCase() === args.status!.toLowerCase());
  if (args.priority) rows = rows.filter(t => t.priority.toLowerCase() === args.priority!.toLowerCase());
  if (args.type) rows = rows.filter(t => t.type.toLowerCase().includes(args.type!.toLowerCase()));
  if (args.repId) {
    const resolved = resolveRepRef(args.repId);
    rows = resolved ? rows.filter(t => t.repId === resolved) : [];
  }
  if (args.customerId) {
    const resolved = resolveCustomerRef(args.customerId);
    rows = resolved ? rows.filter(t => t.customerId === resolved) : [];
  }
  if (args.leadId) {
    const resolved = resolveLeadRef(args.leadId);
    rows = resolved ? rows.filter(t => t.leadId === resolved) : [];
  }
  if (args.dueBefore) rows = rows.filter(t => t.dueDate <= args.dueBefore!);
  if (args.createdAfter) rows = rows.filter(t => (t.createdAt ?? '') >= args.createdAfter!);

  if (!args.groupBy) {
    const total = rows.length;
    return { kind: 'rows', rows: rows.slice(0, 50), truncated: total > 50, total };
  }

  const buckets: Record<string, HydratedTask[]> = {};
  for (const t of rows) {
    const key =
      args.groupBy === 'status' ? t.status :
      args.groupBy === 'priority' ? t.priority :
      args.groupBy === 'type' ? t.type :
      t.repName;
    (buckets[key] ??= []).push(t);
  }

  const groups = Object.entries(buckets).sort(([a], [b]) => a.localeCompare(b)).map(([key, items]) => ({
    key,
    count: items.length,
  }));

  return { kind: 'groups', groups, truncated: false, total: groups.length };
}

export const definitionForPrompt = `queryTasks(args):
  Filter: status ("Open"|"Overdue"|"Completed"), priority ("High"|"Medium"|"Low"),
          type (substring: "Follow Up"|"Email"|"Schedule Call"|"Other"),
          repId, customerId, leadId, dueBefore (YYYY-MM-DD), createdAfter (YYYY-MM-DD)
  Group: groupBy = "status"|"priority"|"type"|"rep"
  Aggregate: aggregate = "count"
  Returns rows (HydratedTask[]) or groups. Max 50 rows.`;
