'use client';

import { useEffect } from 'react';
import { usePageContext } from '@/contexts/PageContext';
import WizOrderPage from './WizOrderPage';
import MetricCard from '@/components/widgets/ui/MetricCard';
import LineChart from '@/components/widgets/charts/LineChart';
import CompactList from '@/components/widgets/ui/CompactList';
import { PRODUCTS, ORDERS, SALES_HISTORY } from '@/data/audreys';
import type { CompactListData } from '@/lib/types';

const OPEN_ORDER_COUNT = ORDERS.filter(o => o.status === 'Open' || o.status === 'Submitted').length;
const PREBOOK_PIPELINE = ORDERS
  .filter(o => o.status === 'Pre-Book Confirmed')
  .reduce((sum, o) => sum + o.total, 0);

const METRICS = [
  { label: 'Active SKUs',       value: String(PRODUCTS.length),                                       format: 'count',    trend: { direction: 'flat' as const, percent: 0,  period: 'catalog stable' } },
  { label: 'This Week Revenue', value: '$42,800',                                                     format: 'currency', trend: { direction: 'up' as const,   percent: 8,  period: 'vs last week' } },
  { label: 'Open Orders',       value: String(OPEN_ORDER_COUNT),                                      format: 'count',    trend: { direction: 'up' as const,   percent: 12, period: 'vs last week' } },
  { label: 'Pre-Book Pipeline', value: `$${Math.round(PREBOOK_PIPELINE).toLocaleString()}`,           format: 'currency', trend: { direction: 'up' as const,   percent: 18, period: 'July 2026 release' } },
];

const REVENUE_SERIES = SALES_HISTORY[0].data.map((_, i) => ({
  month: SALES_HISTORY[0].data[i].month,
  revenue: SALES_HISTORY.reduce((sum, trace) => sum + trace.data[i].revenue, 0),
}));

const CHART_DATA = {
  title: 'Revenue — Last 12 Months',
  series: REVENUE_SERIES,
  yAxisLabel: 'Revenue',
  xAxisLabel: 'Month',
};

const CHART_CONFIG = {
  chartType: 'line' as const,
  showArea: true,
  showDataPoints: true,
  subtitle: 'Jun 2025 – May 2026 · Monthly revenue across all buckets',
};

const ACTIVITY: CompactListData = {
  kind: 'activity',
  title: 'Recent Activity',
  items: [
    { id: 'A-1', icon: 'check', text: 'Beth closed Pre-Book for Bloom & Basket — 24 cases of Pick Of The Patch', timestamp: '1h ago' },
    { id: 'A-2', icon: 'lead',  text: 'New lead: Rustic Charm Boutique via website signup',                       timestamp: '3h ago' },
    { id: 'A-3', icon: 'order', text: 'Order #1047 shipped to Magnolia Home & Garden',                            timestamp: 'yesterday' },
  ],
};

export default function WizDashboardPage() {
  const { setPage } = usePageContext();

  useEffect(() => {
    setPage('dashboard', {
      metrics: METRICS,
      activeSkus: PRODUCTS.length,
      openOrders: OPEN_ORDER_COUNT,
      prebookPipeline: PREBOOK_PIPELINE,
    });
  }, [setPage]);

  return (
    <WizOrderPage
      title="Dashboard"
      icon="📊"
      subtitle="Overview of your sales performance and activity."
    >
      <style>{`
        .dashboard-grid {
          display: grid;
          gap: 16px;
          grid-template-columns: repeat(1, 1fr);
          margin-bottom: 16px;
        }
        @media (min-width: 640px) {
          .dashboard-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (min-width: 1024px) {
          .dashboard-grid { grid-template-columns: repeat(4, 1fr); }
        }
        .dashboard-activity { margin-top: 16px; }
      `}</style>

      {/* Metric cards */}
      <div className="dashboard-grid">
        {METRICS.map(m => (
          <MetricCard key={m.label} data={m} />
        ))}
      </div>

      {/* Revenue chart */}
      <LineChart data={CHART_DATA} config={CHART_CONFIG} />

      {/* Activity feed */}
      <div className="dashboard-activity">
        <CompactList data={ACTIVITY} />
      </div>
    </WizOrderPage>
  );
}
