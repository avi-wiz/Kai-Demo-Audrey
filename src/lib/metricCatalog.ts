import type { MetricCardData } from './types';

/**
 * Server-side allowlist of metric cards Kai can append to reports/dashboards.
 * Scoped per report or dashboard category so suggestions stay relevant.
 *
 * The full card payload is stored here (label, value, format, trend) so any
 * caller can render it without re-fabricating numbers. The `description` is
 * for the ClarificationCard helper line — not shown on the card itself.
 */

export type MetricScope =
  | 'ad17-report'
  | 'sales-performance'
  | 'customer-health'
  | 'order-analytics'
  | 'pipeline';

export interface CatalogMetric {
  /** Canonical label rendered on the metric card. Must be unique within scope. */
  label: string;
  /** One-line explainer shown under the label in the ClarificationCard. */
  description: string;
  /** The full card payload appended to a UW-002 cards array. */
  card: MetricCardData;
}

const AD17_METRICS: CatalogMetric[] = [
  {
    label: 'Avg Order Value',
    description: 'Mean revenue per confirmed order across the period.',
    card: { label: 'Avg Order Value', value: '$4,466', format: 'currency', trend: { direction: 'up', percent: 4.6, period: 'vs Q4' } },
  },
  {
    label: 'Quote Conversion Rate',
    description: 'Share of sent quotes that closed into a paid order.',
    card: { label: 'Quote Conversion Rate', value: '38%', format: 'percent', trend: { direction: 'up', percent: 4, period: 'vs Q4' } },
  },
  {
    label: 'Repeat Customer Rate',
    description: 'Customers in Q1 who also ordered in the prior quarter.',
    card: { label: 'Repeat Customer Rate', value: '62%', format: 'percent', trend: { direction: 'up', percent: 3.1, period: 'vs Q4' } },
  },
  {
    label: 'Gross Margin',
    description: 'Revenue minus COGS as a share of revenue.',
    card: { label: 'Gross Margin', value: '41.8%', format: 'percent', trend: { direction: 'up', percent: 1.2, period: 'vs Q4' } },
  },
  {
    label: 'New Logo Revenue',
    description: 'Revenue from customers acquired this quarter.',
    card: { label: 'New Logo Revenue', value: '$182K', format: 'currency', trend: { direction: 'up', percent: 22, period: 'vs Q4' } },
  },
  {
    label: 'Discount Rate',
    description: 'Average discount applied across confirmed orders.',
    card: { label: 'Discount Rate', value: '6.4%', format: 'percent', trend: { direction: 'down', percent: 0.8, period: 'vs Q4' } },
  },
];

const SALES_PERFORMANCE_METRICS: CatalogMetric[] = [
  {
    label: 'Pipeline Coverage',
    description: 'Open pipeline value as a multiple of remaining quota.',
    card: { label: 'Pipeline Coverage', value: '3.2×', format: 'count', trend: { direction: 'up', percent: 8, period: 'vs last month' } },
  },
  {
    label: 'Win Rate',
    description: 'Closed-won deals as a share of total decided deals.',
    card: { label: 'Win Rate', value: '47%', format: 'percent', trend: { direction: 'up', percent: 2.5, period: 'vs Q1' } },
  },
  {
    label: 'Sales Cycle Length',
    description: 'Median days from quote sent to order confirmed.',
    card: { label: 'Sales Cycle Length', value: '18 days', format: 'count', trend: { direction: 'down', percent: 6, period: 'vs Q1' } },
  },
  {
    label: 'Forecast Accuracy',
    description: 'Last-quarter forecast vs. actual close rate.',
    card: { label: 'Forecast Accuracy', value: '92%', format: 'percent', trend: { direction: 'up', percent: 4, period: 'vs Q1' } },
  },
  {
    label: 'Quota Attainment',
    description: 'Team revenue as a share of the quarter target.',
    card: { label: 'Quota Attainment', value: '78%', format: 'percent', trend: { direction: 'up', percent: 6, period: 'vs Q1' } },
  },
  {
    label: 'Activity-to-Quote Ratio',
    description: 'Rep touches required to send a single quote.',
    card: { label: 'Activity-to-Quote Ratio', value: '5.4', format: 'count', trend: { direction: 'down', percent: 3, period: 'vs Q1' } },
  },
];

const CUSTOMER_HEALTH_METRICS: CatalogMetric[] = [
  {
    label: 'Churn Risk Accounts',
    description: 'VIP/Enterprise accounts trending toward dormant.',
    card: { label: 'Churn Risk Accounts', value: '7', format: 'count', trend: { direction: 'up', percent: 17, period: 'vs last month' } },
  },
  {
    label: 'Net Retention',
    description: 'Revenue retained from existing customers including expansion.',
    card: { label: 'Net Retention', value: '108%', format: 'percent', trend: { direction: 'up', percent: 2, period: 'vs Q1' } },
  },
  {
    label: 'Avg LTV',
    description: 'Lifetime revenue across all active customers.',
    card: { label: 'Avg LTV', value: '$48,200', format: 'currency', trend: { direction: 'up', percent: 5.4, period: 'vs Q1' } },
  },
  {
    label: 'Time Since Last Order',
    description: 'Median days since the last order across active accounts.',
    card: { label: 'Time Since Last Order', value: '14 days', format: 'count', trend: { direction: 'flat', percent: 0, period: 'vs last month' } },
  },
  {
    label: 'NPS',
    description: 'Net Promoter Score from the latest survey wave.',
    card: { label: 'NPS', value: '54', format: 'count', trend: { direction: 'up', percent: 8, period: 'vs last wave' } },
  },
  {
    label: 'Support Tickets / Account',
    description: 'Open tickets divided by active customer count.',
    card: { label: 'Support Tickets / Account', value: '0.4', format: 'count', trend: { direction: 'down', percent: 12, period: 'vs Q1' } },
  },
];

const ORDER_ANALYTICS_METRICS: CatalogMetric[] = [
  {
    label: 'On-Time Shipment Rate',
    description: 'Orders shipped on or before promised date.',
    card: { label: 'On-Time Shipment Rate', value: '94%', format: 'percent', trend: { direction: 'up', percent: 1.5, period: 'vs Q1' } },
  },
  {
    label: 'Order Cycle Time',
    description: 'Median hours from order placed to shipped.',
    card: { label: 'Order Cycle Time', value: '36 hrs', format: 'count', trend: { direction: 'down', percent: 9, period: 'vs Q1' } },
  },
  {
    label: 'Return Rate',
    description: 'Returned units as a share of units shipped.',
    card: { label: 'Return Rate', value: '2.8%', format: 'percent', trend: { direction: 'down', percent: 0.4, period: 'vs Q1' } },
  },
  {
    label: 'Backorder Volume',
    description: 'Units sitting on backorder across all SKUs.',
    card: { label: 'Backorder Volume', value: '142', format: 'count', trend: { direction: 'down', percent: 18, period: 'vs Q1' } },
  },
  {
    label: 'Avg Fulfillment Cost',
    description: 'Pick/pack/ship cost averaged per order.',
    card: { label: 'Avg Fulfillment Cost', value: '$8.40', format: 'currency', trend: { direction: 'flat', percent: 0.2, period: 'vs Q1' } },
  },
  {
    label: 'Perfect Order Rate',
    description: 'Orders shipped on time, complete, and undamaged.',
    card: { label: 'Perfect Order Rate', value: '88%', format: 'percent', trend: { direction: 'up', percent: 2.1, period: 'vs Q1' } },
  },
];

const PIPELINE_METRICS: CatalogMetric[] = [
  {
    label: 'Quote-to-Close Rate',
    description: 'Quotes that convert into a paid order.',
    card: { label: 'Quote-to-Close Rate', value: '42%', format: 'percent', trend: { direction: 'up', percent: 3, period: 'vs Q1' } },
  },
  {
    label: 'Avg Deal Size',
    description: 'Mean revenue per closed-won deal this quarter.',
    card: { label: 'Avg Deal Size', value: '$12,400', format: 'currency', trend: { direction: 'up', percent: 7, period: 'vs Q1' } },
  },
  {
    label: 'Stalled Deal Count',
    description: 'Deals with no activity in 14+ days.',
    card: { label: 'Stalled Deal Count', value: '9', format: 'count', trend: { direction: 'down', percent: 25, period: 'vs Q1' } },
  },
  {
    label: 'Pipeline Velocity',
    description: 'Deal value moving through the pipeline per day.',
    card: { label: 'Pipeline Velocity', value: '$4,200/day', format: 'currency', trend: { direction: 'up', percent: 11, period: 'vs Q1' } },
  },
  {
    label: 'Avg Time in Stage',
    description: 'Median days a deal spends in each pipeline stage.',
    card: { label: 'Avg Time in Stage', value: '6 days', format: 'count', trend: { direction: 'down', percent: 8, period: 'vs Q1' } },
  },
  {
    label: 'Expiring Quotes',
    description: 'Quotes set to expire within the next 7 days.',
    card: { label: 'Expiring Quotes', value: '4', format: 'count', trend: { direction: 'up', percent: 33, period: 'vs last week' } },
  },
];

export const METRIC_CATALOG: Record<MetricScope, CatalogMetric[]> = {
  'ad17-report': AD17_METRICS,
  'sales-performance': SALES_PERFORMANCE_METRICS,
  'customer-health': CUSTOMER_HEALTH_METRICS,
  'order-analytics': ORDER_ANALYTICS_METRICS,
  'pipeline': PIPELINE_METRICS,
};

/** Filters out metrics already present in `currentLabels` (case-insensitive). */
export function availableMetrics(scope: MetricScope, currentLabels: string[]): CatalogMetric[] {
  const have = new Set(currentLabels.map((l) => l.toLowerCase()));
  return METRIC_CATALOG[scope].filter((m) => !have.has(m.label.toLowerCase()));
}

/** Resolves a list of labels to their full catalog entries. Unknown labels are dropped. */
export function resolveMetrics(scope: MetricScope, labels: string[]): CatalogMetric[] {
  const catalog = METRIC_CATALOG[scope];
  const byLabel = new Map(catalog.map((m) => [m.label.toLowerCase(), m]));
  return labels
    .map((l) => byLabel.get(l.toLowerCase()))
    .filter((m): m is CatalogMetric => !!m);
}
