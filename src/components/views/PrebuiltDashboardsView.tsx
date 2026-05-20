'use client';

import { useMemo } from 'react';
import { useLayout } from '@/contexts/LayoutContext';
import { useDashboardBuilder } from '@/contexts/DashboardBuilderContext';
import type { DashboardCompositeData } from '@/lib/types';

import collectionPerformanceRaw from '@/fixtures/report-collection-performance.json';
import prebookPacingRaw from '@/fixtures/report-prebook-pacing.json';
import customerHealthRaw from '@/fixtures/report-customer-health.json';
import pipelineRaw from '@/fixtures/report-pipeline.json';
import teamPerformanceRaw from '@/fixtures/report-team-performance.json';
import catalogHealthRaw from '@/fixtures/report-catalog-health.json';

type ReportFixtureShape = {
  widgets: Array<{ widgetType: string; data: unknown }>;
};

const collectionPerformance = collectionPerformanceRaw as unknown as ReportFixtureShape;
const prebookPacing = prebookPacingRaw as unknown as ReportFixtureShape;
const customerHealth = customerHealthRaw as unknown as ReportFixtureShape;
const pipeline = pipelineRaw as unknown as ReportFixtureShape;
const teamPerformance = teamPerformanceRaw as unknown as ReportFixtureShape;
const catalogHealth = catalogHealthRaw as unknown as ReportFixtureShape;

interface PrebuiltDashboard {
  id: string;
  title: string;
  description: string;
  icon: string;
  source: ReportFixtureShape;
}

const PREBUILT: PrebuiltDashboard[] = [
  {
    id: 'rpt-collection-performance',
    title: 'Collection Performance',
    description: 'Sell-through, revenue, and unit velocity across the Featured Collections — A Blooming Porch, Gardeners Grove, The Herb Garden, Bunnies.',
    icon: '🌿',
    source: collectionPerformance,
  },
  {
    id: 'rpt-prebook-pacing',
    title: 'Pre-Book Pacing — July 2026',
    description: 'Cumulative pre-book orders for the July 2026 Virtual Release vs. the January 2025 Atlanta benchmark.',
    icon: '📅',
    source: prebookPacing,
  },
  {
    id: 'rpt-customer-health',
    title: 'Customer Health',
    description: 'Account-level reorder cadence, lifetime revenue, and at-risk flags across the active book.',
    icon: '💚',
    source: customerHealth,
  },
  {
    id: 'rpt-pipeline',
    title: 'Pipeline Health',
    description: 'Lead funnel, deal velocity, and closing-this-month watchlist across the 6 active leads + 8 open deals.',
    icon: '📈',
    source: pipeline,
  },
  {
    id: 'rpt-team-performance',
    title: 'Team Performance — Q2',
    description: 'Q2 revenue, conversion rate, top accounts, and overdue task load by rep.',
    icon: '👥',
    source: teamPerformance,
  },
  {
    id: 'rpt-catalog-health',
    title: 'Catalog Health',
    description: 'Active SKU mix, stock levels, sell-through by collection, and PhaseOut clearance priority.',
    icon: '📦',
    source: catalogHealth,
  },
];

function extractDashboardData(fixture: ReportFixtureShape): DashboardCompositeData | null {
  const grid = fixture.widgets.find((w) => w.widgetType === 'UW-030');
  if (!grid) return null;
  return grid.data as DashboardCompositeData;
}

export default function PrebuiltDashboardsView() {
  const { setView } = useLayout();
  const { setActive } = useDashboardBuilder();

  const cards = useMemo(() => PREBUILT.map((p) => ({
    ...p,
    data: extractDashboardData(p.source),
  })), []);

  const openDashboard = (card: { id: string; title: string; data: DashboardCompositeData | null }) => {
    if (!card.data) return;
    setActive(card.data, card.id, 'reports-dashboards');
    setView('dashboard-view');
  };

  return (
    <div style={{
      padding: '40px 48px',
      maxWidth: 1280,
      margin: '0 auto',
      width: '100%',
    }}>
      <header style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
          <span style={{ fontSize: 26 }}>📊</span>
          <h1 style={{ fontSize: 24, fontFamily: 'var(--display)', fontWeight: 700, color: 'var(--text)', margin: 0 }}>
            Reports &amp; Dashboards
          </h1>
        </div>
        <p style={{ fontSize: 13, color: 'var(--text2)', fontFamily: 'var(--sans)', margin: 0, maxWidth: 720 }}>
          Pre-built dashboards curated for Audrey&apos;s. Click any card to open the full editor with View, Edit, Save, Download, and the Kai sidebar. You can also ask Kai to build any of these from chat.
        </p>
      </header>

      <style>{`
        .pbd-grid {
          display: grid;
          gap: 16px;
          grid-template-columns: repeat(1, 1fr);
        }
        @media (min-width: 720px) { .pbd-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (min-width: 1080px) { .pbd-grid { grid-template-columns: repeat(3, 1fr); } }
      `}</style>

      <div className="pbd-grid">
        {cards.map((card) => (
          <button
            key={card.id}
            type="button"
            onClick={() => openDashboard(card)}
            disabled={!card.data}
            style={{
              all: 'unset',
              cursor: card.data ? 'pointer' : 'not-allowed',
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
              padding: 20,
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 12,
              transition: 'box-shadow 150ms ease, border-color 150ms ease, transform 150ms ease',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              position: 'relative',
              overflow: 'hidden',
            }}
            onMouseEnter={(e) => {
              if (!card.data) return;
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.08)';
              e.currentTarget.style.borderColor = 'var(--border2)';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)';
              e.currentTarget.style.borderColor = 'var(--border)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            {/* Top accent stripe (matches dashboard widget styling) */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 3,
              background: 'linear-gradient(90deg, rgba(91,106,240,0.8) 0%, rgba(40,170,123,0.6) 100%)',
            }} />

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4 }}>
              <span style={{ fontSize: 24 }}>{card.icon}</span>
            </div>

            <div style={{
              fontFamily: 'var(--display)',
              fontSize: 16,
              fontWeight: 700,
              color: 'var(--text)',
              lineHeight: 1.3,
            }}>
              {card.title}
            </div>

            <div style={{
              fontSize: 13,
              color: 'var(--text2)',
              fontFamily: 'var(--sans)',
              lineHeight: 1.5,
              flex: 1,
            }}>
              {card.description}
            </div>

            <div style={{
              fontSize: 12,
              fontWeight: 600,
              color: 'var(--primary-70)',
              fontFamily: 'var(--sans)',
              marginTop: 4,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
            }}>
              Open dashboard
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
              </svg>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
