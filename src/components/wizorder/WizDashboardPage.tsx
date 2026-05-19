'use client';

import { useEffect } from 'react';
import { usePageContext } from '@/contexts/PageContext';
import WizOrderPage from './WizOrderPage';
import MetricCard from '@/components/widgets/ui/MetricCard';
import LineChart from '@/components/widgets/charts/LineChart';

const METRICS = [
  { label: 'Total Revenue (MTD)', value: '$384,200', format: 'currency', trend: { direction: 'up' as const, percent: 12, period: 'vs last month' } },
  { label: 'Active Orders',       value: '12',       format: 'count',    trend: { direction: 'up' as const, percent: 4,  period: 'vs last week' } },
  { label: 'Open Quotes',         value: '4',        format: 'count',    trend: { direction: 'flat' as const, percent: 0, period: 'unchanged' } },
  { label: 'Active Customers',    value: '156',      format: 'count',    trend: { direction: 'up' as const, percent: 3,  period: 'vs last month' } },
];

const REVENUE_SERIES = [
  { month: 'Apr 1',  revenue: 9200 },
  { month: 'Apr 4',  revenue: 11400 },
  { month: 'Apr 7',  revenue: 10800 },
  { month: 'Apr 10', revenue: 13600 },
  { month: 'Apr 13', revenue: 12100 },
  { month: 'Apr 16', revenue: 15800 },
  { month: 'Apr 19', revenue: 14200 },
  { month: 'Apr 22', revenue: 17600 },
  { month: 'Apr 25', revenue: 16400 },
  { month: 'Apr 28', revenue: 19800 },
  { month: 'Apr 30', revenue: 21400 },
];

const CHART_DATA = {
  title: 'Revenue This Month',
  series: REVENUE_SERIES,
  yAxisLabel: 'Revenue',
  xAxisLabel: 'Date',
};

const CHART_CONFIG = {
  chartType: 'line' as const,
  showArea: true,
  showDataPoints: true,
  subtitle: 'April 2026 · Daily revenue',
};

export default function WizDashboardPage() {
  const { setPage } = usePageContext();

  useEffect(() => {
    setPage('dashboard', {
      metrics: METRICS,
      revenueThisMonth: 384200,
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
      `}</style>

      {/* Metric cards */}
      <div className="dashboard-grid">
        {METRICS.map(m => (
          <MetricCard key={m.label} data={m} />
        ))}
      </div>

      {/* Revenue chart */}
      <LineChart data={CHART_DATA} config={CHART_CONFIG} />
    </WizOrderPage>
  );
}
