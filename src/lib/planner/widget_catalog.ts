import { z } from 'zod';

// ─── Shared sub-schemas ───────────────────────────────────────────────────────

const metricTrendSchema = z.object({
  direction: z.enum(['up', 'down', 'flat']),
  percent: z.number(),
  period: z.string(),
});

const metricCardSchema = z.object({
  label: z.string(),
  value: z.union([z.string(), z.number()]),
  format: z.string().optional(),
  trend: metricTrendSchema.optional(),
});

const widgetHighlightSchema = z.object({
  type: z.enum(['urgent', 'warning', 'positive', 'info']),
  message: z.string(),
  fieldKey: z.string().optional(),
});

// ─── Per-widget data shape schemas ───────────────────────────────────────────

const uw002Schema = z.object({
  cards: z.array(metricCardSchema),
});

const uw003Schema = z.object({
  entityType: z.string(),
  title: z.string().optional(),
  fields: z.array(z.object({
    label: z.string(),
    value: z.string(),
    entityId: z.string().optional(),
  })),
});

const uw004Schema = z.object({
  title: z.string().optional(),
  columns: z.array(z.object({
    key: z.string(),
    label: z.string(),
    format: z.string().optional(),
    align: z.enum(['left', 'right', 'center']).optional(),
    width: z.string().optional(),
    sortable: z.boolean().optional(),
  })),
  rows: z.array(z.record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.null()]))),
  totalRow: z.record(z.string(), z.union([z.string(), z.number()])).optional(),
});

const uw011Schema = z.union([
  z.object({ kind: z.literal('task').optional(), title: z.string(), items: z.array(z.object({
    id: z.string(),
    title: z.string(),
    dueDate: z.string(),
    priority: z.string(),
    assignedTo: z.string(),
    status: z.string(),
  })) }),
  z.object({ kind: z.literal('activity'), title: z.string(), items: z.array(z.object({
    id: z.string(),
    text: z.string(),
    timestamp: z.string(),
    icon: z.string().optional(),
    actor: z.string().optional(),
  })) }),
]);

const uw014Schema = z.object({
  summary: z.string(),
  steps: z.array(z.object({
    id: z.string(),
    label: z.string(),
    status: z.string(),
    detail: z.string().optional(),
  })).optional(),
  mcpsAccessed: z.array(z.string()),
  totalMs: z.number(),
});

const uw009Schema = z.object({
  title: z.string().optional(),
  items: z.array(z.object({
    sku: z.string(),
    name: z.string(),
    retailPrice: z.number(),
    caseQty: z.number(),
    stockStatus: z.string(),
    imageUrl: z.string(),
    isHero: z.boolean().optional(),
    bucket: z.string().optional(),
    collection: z.string().optional(),
  })),
});

const ch001Schema = z.object({
  title: z.string(),
  series: z.array(z.record(z.string(), z.union([z.string(), z.number()]))),
  yAxisLabel: z.string(),
  xAxisLabel: z.string(),
});

// ─── Catalog entry type ───────────────────────────────────────────────────────

export interface WidgetCatalogEntry {
  widgetType: string;
  dataShape: z.ZodSchema;
  goodFor: string;
  example: Record<string, unknown>;
}

// ─── WIDGET_CATALOG ───────────────────────────────────────────────────────────

export const WIDGET_CATALOG: Record<string, WidgetCatalogEntry> = {
  'UW-002': {
    widgetType: 'UW-002',
    dataShape: uw002Schema,
    goodFor: 'KPI summary row — show 2-5 scalar metrics (revenue, counts, days) side by side',
    example: {
      cards: [
        { label: 'YTD Revenue', value: 186000, format: 'currency' },
        { label: 'Orders', value: 11, format: 'count' },
      ],
    },
  },
  'UW-003': {
    widgetType: 'UW-003',
    dataShape: uw003Schema,
    goodFor: 'Single-entity detail card — name/value pairs for one customer, lead, rep, or deal',
    example: {
      entityType: 'customer',
      title: 'Magnolia Home & Garden',
      fields: [
        { label: 'Contact', value: 'Lillian Hayes' },
        { label: 'Status', value: 'Active' },
        { label: 'Rep', value: 'Beth Calloway' },
      ],
    },
  },
  'UW-004': {
    widgetType: 'UW-004',
    dataShape: uw004Schema,
    goodFor: 'Tabular list of rows — orders, tasks, customers, leads; supports currency/badge/date column formatting',
    example: {
      title: 'Open Tasks',
      columns: [
        { key: 'title', label: 'Task', format: 'text' },
        { key: 'dueDate', label: 'Due', format: 'date' },
        { key: 'status', label: 'Status', format: 'badge' },
      ],
      rows: [
        { title: 'Follow up on Birdhouse samples', dueDate: '2026-05-15', status: 'Overdue' },
      ],
    },
  },
  'UW-011': {
    widgetType: 'UW-011',
    dataShape: uw011Schema,
    goodFor: 'Compact vertical list of tasks or activity feed items — best for ≤8 items, when table feels heavy',
    example: {
      kind: 'task',
      title: 'Overdue Tasks',
      items: [
        { id: 'T-2001', title: 'Follow up on Birdhouse samples', dueDate: '2026-05-15', priority: 'High', assignedTo: 'Beth Calloway', status: 'Overdue' },
      ],
    },
  },
  'UW-014': {
    widgetType: 'UW-014',
    dataShape: uw014Schema,
    goodFor: 'Agent reasoning trace — use at the start of a planner response to show steps taken; collapses to summary',
    example: {
      summary: 'Queried tasks for Marcus Rivera — found 3 overdue items',
      mcpsAccessed: ['queryTasks'],
      totalMs: 420,
    },
  },
  'UW-009': {
    widgetType: 'UW-009',
    dataShape: uw009Schema,
    goodFor: 'Product card grid — show 3-9 products with images, prices, stock badges; best for catalog or collection browsing',
    example: {
      title: 'Gardeners Grove — Top SKUs',
      items: [
        { sku: '51GR1779-U', name: 'Pick Of The Patch, Watering Can', retailPrice: 14.99, caseQty: 12, stockStatus: 'In Stock', imageUrl: '' },
      ],
    },
  },
  'CH-001': {
    widgetType: 'CH-001',
    dataShape: ch001Schema,
    goodFor: 'Line/bar/area chart — revenue trends, order volume over time, rep comparisons by month',
    example: {
      title: 'Magnolia Revenue — Last 6 Months',
      series: [
        { month: 'Dec', revenue: 22000 },
        { month: 'Jan', revenue: 28000 },
        { month: 'Feb', revenue: 31000 },
      ],
      yAxisLabel: 'Revenue ($)',
      xAxisLabel: 'Month',
    },
  },
};

export type WidgetType = keyof typeof WIDGET_CATALOG;
