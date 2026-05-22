'use client';

import { useEffect, useState } from 'react';
import { usePageContext } from '@/contexts/PageContext';
import { useArtifacts } from '@/contexts/ArtifactContext';
import { useDashboardBuilder } from '@/contexts/DashboardBuilderContext';
import { useLayout } from '@/contexts/LayoutContext';
import WizOrderPage from './WizOrderPage';
import MetricCard from '@/components/widgets/ui/MetricCard';
import LineChart from '@/components/widgets/charts/LineChart';
import CompactList from '@/components/widgets/ui/CompactList';
import ArtifactSearchDropdown from '@/components/views/ArtifactSearchDropdown';
import { PRODUCTS, ORDERS, SALES_HISTORY } from '@/data/audreys';
import type { CompactListData, SavedArtifact, SavedDashboard } from '@/lib/types';

const OPEN_ORDER_COUNT = ORDERS.filter(o => o.status === 'Open' || o.status === 'Submitted').length;
const PREBOOK_PIPELINE = ORDERS
  .filter(o => o.status === 'Pre-Book Confirmed')
  .reduce((sum, o) => sum + o.total, 0);

const METRICS = [
  { label: 'Active SKUs', value: String(PRODUCTS.length), format: 'count', trend: { direction: 'flat' as const, percent: 0, period: 'catalog stable' } },
  { label: 'This Week Revenue', value: '$42,800', format: 'currency', trend: { direction: 'up' as const, percent: 8, period: 'vs last week' } },
  { label: 'Open Orders', value: String(OPEN_ORDER_COUNT), format: 'count', trend: { direction: 'up' as const, percent: 12, period: 'vs last week' } },
  { label: 'Pre-Book Pipeline', value: `$${Math.round(PREBOOK_PIPELINE).toLocaleString()}`, format: 'currency', trend: { direction: 'up' as const, percent: 18, period: 'July 2026 release' } },
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
    { id: 'A-2', icon: 'lead', text: 'New lead: Rustic Charm Boutique via website signup', timestamp: '3h ago' },
    { id: 'A-3', icon: 'order', text: 'Order #1047 shipped to Magnolia Home & Garden', timestamp: 'yesterday' },
  ],
};

export default function WizDashboardPage() {
  const { setPage } = usePageContext();
  const { artifacts, setActiveArtifactId } = useArtifacts();
  const { setActive } = useDashboardBuilder();
  const { setView } = useLayout();
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    setPage('dashboard', {
      metrics: METRICS,
      activeSkus: PRODUCTS.length,
      openOrders: OPEN_ORDER_COUNT,
      prebookPipeline: PREBOOK_PIPELINE,
    });
  }, [setPage]);

  // Close modal on Esc
  useEffect(() => {
    if (!modalOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setModalOpen(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [modalOpen]);

  const handleArtifactOpen = (a: SavedArtifact) => {
    setModalOpen(false);
    if (a.category === 'Dashboards and Reports') {
      const saved = a as SavedDashboard;
      if (saved.dashboardData) {
        setActive(saved.dashboardData, saved.id);
        setView('dashboard-view');
        return;
      }
    }
    setActiveArtifactId(a.id);
    setView('view-artifact');
  };

  const artifactCount = artifacts.length;

  return (
    <>
      <WizOrderPage
        title="Dashboard"
        subtitle="Overview of your sales performance and activity."
        filterChips={[
          { label: 'Dashboard', active: !modalOpen, onClick: () => setModalOpen(false) },
          { label: `My Artifacts${artifactCount > 0 ? ` (${artifactCount})` : ''}`, active: modalOpen, onClick: () => setModalOpen(true) },
        ]}
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

      {modalOpen && (
        <div
          onClick={() => setModalOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 22, 32, 0.45)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
            animation: 'fadeIn 160ms ease-out both',
          }}
        >
          <style>{`@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }`}</style>
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: 560,
              maxHeight: '70vh',
              background: 'var(--bg)',
              border: '1px solid var(--border)',
              borderRadius: 14,
              boxShadow: '0 24px 48px rgba(0,0,0,0.18)',
              padding: 20,
              display: 'flex',
              flexDirection: 'column',
              minHeight: 0,
            }}
          >
            {/* Modal header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div>
                <h2 style={{
                  margin: 0, fontFamily: 'var(--display)', fontSize: 16, fontWeight: 700, color: 'var(--text)',
                }}>
                  My Artifacts
                </h2>
                <p style={{
                  margin: '2px 0 0', fontSize: 12, color: 'var(--text3)', fontFamily: 'var(--sans)',
                }}>
                  Saved charts, dashboards, and workflows from Kai.
                </p>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                aria-label="Close"
                style={{
                  border: '1px solid var(--border)',
                  background: 'var(--surface)',
                  borderRadius: 6,
                  padding: 6,
                  cursor: 'pointer',
                  display: 'flex',
                  color: 'var(--text2)',
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <ArtifactSearchDropdown
              artifacts={artifacts}
              onOpen={handleArtifactOpen}
              autoFocus
            />
          </div>
        </div>
      )}
    </>
  );
}
