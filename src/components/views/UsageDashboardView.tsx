'use client';

import { useState, useEffect, useRef } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import dashboardData from '@/fixtures/usage-dashboard.json';

// ── Count-up hook ─────────────────────────────────────────────────────────────

function useCountUp(target: number, durationMs = 900): number {
  const [value, setValue] = useState(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const start = performance.now();
    function tick(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / durationMs, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      }
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current !== null) cancelAnimationFrame(rafRef.current); };
  }, [target, durationMs]);

  return value;
}

// ── Metric card ───────────────────────────────────────────────────────────────

interface MetricCardProps {
  label: string;
  value: number;
  icon: React.ReactNode;
}

function DashMetricCard({ label, value, icon }: MetricCardProps) {
  const displayValue = useCountUp(value);

  return (
    <div
      style={{
        flex: 1,
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 10,
        padding: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ color: 'var(--primary-70)', opacity: 0.8 }}>{icon}</span>
        <p style={{ fontSize: 12, fontFamily: 'var(--sans)', color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
          {label}
        </p>
      </div>
      <p style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 28, color: 'var(--text)', margin: 0, lineHeight: 1 }}>
        {displayValue}
      </p>
    </div>
  );
}

// ── SVG icons ─────────────────────────────────────────────────────────────────

function IconChat() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M14 10a1 1 0 0 1-1 1H5l-3 3V3a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v7z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  );
}

function IconCheck() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.4" />
      <path d="M5.5 8l2 2 3-3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconClipboard() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <rect x="4" y="3" width="8" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M6 3V2.5A.5.5 0 0 1 6.5 2h3a.5.5 0 0 1 .5.5V3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function IconBookmark() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M4 2h8a1 1 0 0 1 1 1v10l-5-3-5 3V3a1 1 0 0 1 1-1z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  );
}

// ── Chart tooltip ─────────────────────────────────────────────────────────────

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 8,
        padding: '8px 12px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
      }}
    >
      <p style={{ fontFamily: 'var(--sans)', fontSize: 11, color: 'var(--text2)', margin: '0 0 2px' }}>{label}</p>
      <p style={{ fontFamily: 'var(--display)', fontWeight: 600, fontSize: 14, color: 'var(--text)', margin: 0 }}>
        {payload[0].value} queries
      </p>
    </div>
  );
}

// ── Main view ─────────────────────────────────────────────────────────────────

type FilterKey = 'Daily' | 'Weekly' | 'Monthly' | 'Custom';

const FILTER_SERIES_KEY: Record<FilterKey, keyof typeof dashboardData.metrics.queryTrend> = {
  Daily: 'daily',
  Weekly: 'weekly',
  Monthly: 'monthly',
  Custom: 'daily',
};

const CHART_LABELS: Record<FilterKey, string> = {
  Daily: 'Query Volume — Last 15 Days',
  Weekly: 'Query Volume — Last 6 Weeks',
  Monthly: 'Query Volume — Last 6 Months',
  Custom: 'Query Volume — Last 15 Days',
};

function formatLabel(dateStr: string, filter: FilterKey): string {
  const d = new Date(dateStr + 'T00:00:00');
  if (filter === 'Monthly') {
    return d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
  }
  if (filter === 'Weekly') {
    return 'Wk ' + d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

const FILTERS: FilterKey[] = ['Daily', 'Weekly', 'Monthly', 'Custom'];

export default function UsageDashboardView() {
  const [activeFilter, setActiveFilter] = useState<FilterKey>('Daily');

  const { metrics } = dashboardData;

  const seriesKey = FILTER_SERIES_KEY[activeFilter];
  const rawSeries = metrics.queryTrend[seriesKey];

  const chartData = rawSeries.map((d) => ({
    date: formatLabel(d.date, activeFilter),
    queries: d.queries,
  }));

  return (
    <div className="flex-1 overflow-y-auto" style={{ padding: '32px 40px' }}>
      <h1 style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 18, color: 'var(--text)', marginBottom: 24 }}>
        Usage Dashboard
      </h1>

      {/* Metric cards row */}
      <div style={{ display: 'flex', gap: 14, marginBottom: 28 }}>
        <DashMetricCard label="Total Queries" value={metrics.totalQueries} icon={<IconChat />} />
        <DashMetricCard label="Actions Executed" value={metrics.totalActionsExecuted} icon={<IconCheck />} />
        <DashMetricCard label="Actions Staged" value={metrics.totalActionsStaged} icon={<IconClipboard />} />
        <DashMetricCard label="Artifacts Created" value={metrics.totalArtifactsCreated} icon={<IconBookmark />} />
      </div>

      {/* Chart section */}
      <div
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 12,
          padding: '20px 24px',
        }}
      >
        {/* Header row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <p style={{ fontFamily: 'var(--display)', fontWeight: 600, fontSize: 14, color: 'var(--text)', margin: 0 }}>
            {CHART_LABELS[activeFilter]}
          </p>
          {/* Filter buttons */}
          <div style={{ display: 'flex', gap: 4 }}>
            {FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                style={{
                  padding: '4px 10px',
                  fontSize: 12,
                  fontFamily: 'var(--sans)',
                  fontWeight: 500,
                  borderRadius: 6,
                  border: `1px solid ${activeFilter === f ? 'var(--primary-80)' : 'var(--border)'}`,
                  background: activeFilter === f ? 'var(--primary-10, rgba(99,102,241,0.08))' : 'transparent',
                  color: activeFilter === f ? 'var(--primary-80)' : 'var(--text2)',
                  cursor: 'pointer',
                  transition: 'all 150ms ease',
                }}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Recharts area chart */}
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="queryAreaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--primary-70, #6366f1)" stopOpacity={0.18} />
                <stop offset="95%" stopColor="var(--primary-70, #6366f1)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="var(--border)" strokeDasharray="4 4" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fontFamily: 'var(--sans)', fill: 'var(--text3)' }}
              axisLine={false}
              tickLine={false}
              interval={2}
            />
            <YAxis
              tick={{ fontSize: 11, fontFamily: 'var(--sans)', fill: 'var(--text3)' }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
            />
            <Tooltip content={<ChartTooltip />} cursor={{ stroke: 'var(--border)', strokeWidth: 1 }} />
            <Area
              type="monotone"
              dataKey="queries"
              stroke="var(--primary-70, #6366f1)"
              strokeWidth={2}
              fill="url(#queryAreaGradient)"
              dot={false}
              activeDot={{ r: 4, fill: 'var(--primary-70, #6366f1)', strokeWidth: 0 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
