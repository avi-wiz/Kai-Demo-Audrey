'use client';

import { useState, useEffect } from 'react';
import DashboardOverviewTab from './DashboardOverviewTab';
import DashboardPerformanceTab from './DashboardPerformanceTab';
import DashboardUsageTab from './DashboardUsageTab';
import DashboardAgentsTab from './DashboardAgentsTab';

// ── Types ─────────────────────────────────────────────────────────────────────

type DashboardTab = 'overview' | 'performance' | 'usage' | 'agents';
type DateRange = '7 days' | '30 days' | '90 days' | 'Custom';

// ── Tab button ────────────────────────────────────────────────────────────────

interface TabButtonProps {
  label: string;
  active: boolean;
  onClick: () => void;
}

function TabButton({ label, active, onClick }: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '0 16px',
        height: '100%',
        background: 'none',
        border: 'none',
        borderBottom: active ? '2px solid var(--primary-80)' : '2px solid transparent',
        fontFamily: 'var(--display)',
        fontWeight: 600,
        fontSize: 13,
        color: active ? 'var(--text)' : 'var(--text2)',
        cursor: 'pointer',
        transition: 'color 150ms ease, border-color 150ms ease',
        whiteSpace: 'nowrap',
      }}
      onMouseEnter={(e) => { if (!active) e.currentTarget.style.color = 'var(--text)'; }}
      onMouseLeave={(e) => { if (!active) e.currentTarget.style.color = 'var(--text2)'; }}
    >
      {label}
    </button>
  );
}

// ── Date range pill ───────────────────────────────────────────────────────────

interface PillProps {
  label: DateRange;
  active: boolean;
  onClick: () => void;
}

function Pill({ label, active, onClick }: PillProps) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '5px 14px',
        borderRadius: 20,
        border: 'none',
        background: active ? 'var(--primary-80)' : 'var(--surface2)',
        color: active ? 'white' : 'var(--text2)',
        fontFamily: 'var(--display)',
        fontWeight: 600,
        fontSize: 12.5,
        cursor: 'pointer',
        transition: 'background 150ms ease, color 150ms ease',
        whiteSpace: 'nowrap',
      }}
      onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = 'var(--border)'; }}
      onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = 'var(--surface2)'; }}
    >
      {label}
    </button>
  );
}

// ── Range key helper ──────────────────────────────────────────────────────────

export type RangeKey = '7days' | '30days' | '90days';

function toRangeKey(range: DateRange): RangeKey {
  if (range === '7 days')  return '7days';
  if (range === '90 days') return '90days';
  return '30days';
}

// ── Skeleton shimmer ──────────────────────────────────────────────────────────

function SkeletonBlock({ height, width = '100%', borderRadius = 8 }: { height: number; width?: string | number; borderRadius?: number }) {
  return (
    <div style={{
      height,
      width,
      borderRadius,
      background: 'linear-gradient(90deg, var(--surface2) 25%, var(--border) 50%, var(--surface2) 75%)',
      backgroundSize: '200% 100%',
      animation: 'skeleton-shimmer 1.2s ease-in-out infinite',
    }} />
  );
}

function DashboardSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Top row — 3 cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        {[0, 1, 2].map((i) => <SkeletonBlock key={i} height={88} borderRadius={10} />)}
      </div>
      {/* Second row — 2 cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        {[0, 1, 2].map((i) => <SkeletonBlock key={i} height={88} borderRadius={10} />)}
      </div>
      {/* Chart row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 16 }}>
        <SkeletonBlock height={260} borderRadius={12} />
        <SkeletonBlock height={260} borderRadius={12} />
      </div>
    </div>
  );
}

// ── Tab content renderer ──────────────────────────────────────────────────────

function renderTab(tab: DashboardTab, rangeKey: RangeKey) {
  switch (tab) {
    case 'overview':    return <DashboardOverviewTab    rangeKey={rangeKey} />;
    case 'performance': return <DashboardPerformanceTab rangeKey={rangeKey} />;
    case 'usage':       return <DashboardUsageTab       rangeKey={rangeKey} />;
    case 'agents':      return <DashboardAgentsTab      rangeKey={rangeKey} />;
  }
}

// ── Main layout ───────────────────────────────────────────────────────────────

const TABS: Array<{ id: DashboardTab; label: string }> = [
  { id: 'overview',    label: 'Overview' },
  { id: 'performance', label: 'Performance' },
  { id: 'usage',       label: 'Usage' },
  // { id: 'agents',      label: 'Agents' },
];

const DATE_RANGES: DateRange[] = ['7 days', '30 days', '90 days', 'Custom'];

export default function DashboardLayout() {
  const [activeTab, setActiveTab] = useState<DashboardTab>('overview');
  const [dateRange, setDateRange] = useState<DateRange>('30 days');
  const [showSkeleton, setShowSkeleton] = useState(false);

  function switchTab(tab: DashboardTab) {
    if (tab === activeTab) return;
    setShowSkeleton(true);
    setActiveTab(tab);
    setTimeout(() => setShowSkeleton(false), 220);
  }

  function switchRange(range: DateRange) {
    if (range === dateRange) return;
    setShowSkeleton(true);
    setDateRange(range);
    setTimeout(() => setShowSkeleton(false), 220);
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => setShowSkeleton(false);
  }, []);

  return (
    <>
      <style>{`
        @keyframes skeleton-shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg)' }}>
        {/* Page header */}
        <div style={{ padding: '28px 40px 0', flexShrink: 0 }}>
          <h1 style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 20, color: 'var(--text)', margin: '0 0 4px' }}>
            Kai Analytics Dashboard
          </h1>
          <p style={{ fontFamily: 'var(--sans)', fontSize: 13, color: 'var(--text2)', margin: 0 }}>
            Monitor Performance and Usage of Kai
          </p>
        </div>

        {/* Tab nav */}
        <div style={{
          height: 44,
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'stretch',
          paddingLeft: 40,
          flexShrink: 0,
          marginTop: 20,
        }}>
          {TABS.map((tab) => (
            <TabButton
              key={tab.id}
              label={tab.label}
              active={activeTab === tab.id}
              onClick={() => switchTab(tab.id)}
            />
          ))}
        </div>

        {/* Filter bar */}
        <div style={{
          padding: '14px 40px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          flexShrink: 0,
          background: 'var(--surface)',
        }}>
          <span style={{ fontFamily: 'var(--sans)', fontSize: 12, color: 'var(--text3)', marginRight: 4 }}>Date range:</span>
          {DATE_RANGES.map((range) => (
            <Pill
              key={range}
              label={range}
              active={dateRange === range}
              onClick={() => switchRange(range)}
            />
          ))}
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 40px 48px' }}>
          {showSkeleton ? <DashboardSkeleton /> : renderTab(activeTab, toRangeKey(dateRange))}
        </div>
      </div>
    </>
  );
}
