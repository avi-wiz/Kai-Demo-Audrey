'use client';

import { useEffect, useRef, useState } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';
import allData from '@/fixtures/dashboard-overview.json';
import type { RangeKey } from './DashboardLayout';

// ── Count-up ──────────────────────────────────────────────────────────────────

function useCountUp(target: number, durationMs = 900): number {
  const [value, setValue] = useState(0);
  const rafRef = useRef<number | null>(null);
  useEffect(() => {
    const start = performance.now();
    function tick(now: number) {
      const p = Math.min((now - start) / durationMs, 1);
      setValue(Math.round((1 - Math.pow(1 - p, 3)) * target));
      if (p < 1) rafRef.current = requestAnimationFrame(tick);
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [target, durationMs]);
  return value;
}

// ── Metric card ───────────────────────────────────────────────────────────────

interface TrendShape {
  direction: string;
  percent: number;
  period: string;
}

interface MetricCardProps {
  label: string;
  value: string | number;
  trend: TrendShape;
  isNumeric?: boolean;
  lowerIsBetter?: boolean;
}

function MetricCard({ label, value, trend, isNumeric = true, lowerIsBetter = false }: MetricCardProps) {
  const numericTarget = isNumeric ? (value as number) : 0;
  const animated = useCountUp(numericTarget);
  const display = isNumeric ? animated : value;
  const isUp = trend.direction === 'up';
  const isPositive = lowerIsBetter ? !isUp : isUp;
  const trendColor = isPositive ? '#16a34a' : '#ef4444';
  const arrow = isUp ? '↑' : '↓';

  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 10,
      padding: '16px 18px',
    }}>
      <p style={{ fontFamily: 'var(--sans)', fontWeight: 500, fontSize: 12, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 8px' }}>
        {label}
      </p>
      <p style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 24, color: 'var(--text)', margin: '0 0 6px', lineHeight: 1 }}>
        {display}
      </p>
      <p style={{ fontFamily: 'var(--sans)', fontSize: 11.5, color: trendColor, margin: 0 }}>
        {arrow} {trend.percent}% {trend.period}
      </p>
    </div>
  );
}

// ── Area chart tooltip ────────────────────────────────────────────────────────

function AreaTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
      <p style={{ fontFamily: 'var(--sans)', fontSize: 11, color: 'var(--text2)', margin: '0 0 2px' }}>{label}</p>
      <p style={{ fontFamily: 'var(--display)', fontWeight: 600, fontSize: 14, color: 'var(--text)', margin: 0 }}>{payload[0].value} queries</p>
    </div>
  );
}

// ── Donut tooltip ─────────────────────────────────────────────────────────────

function DonutTooltip({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number }> }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
      <p style={{ fontFamily: 'var(--display)', fontWeight: 600, fontSize: 13, color: 'var(--text)', margin: 0 }}>
        {payload[0].name}: {payload[0].value}
      </p>
    </div>
  );
}

// ── Card wrapper ──────────────────────────────────────────────────────────────

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '20px 24px' }}>
      <p style={{ fontFamily: 'var(--display)', fontWeight: 600, fontSize: 14, color: 'var(--text)', margin: '0 0 20px' }}>{title}</p>
      {children}
    </div>
  );
}

// ── Donut center label ────────────────────────────────────────────────────────

function DonutCenter({ total }: { total: number }) {
  return (
    <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle">
      <tspan x="50%" dy="-6" style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 20, fill: 'var(--text)' }}>{total}</tspan>
      <tspan x="50%" dy="18" style={{ fontFamily: 'var(--sans)', fontSize: 12, fill: 'var(--text2)' }}>actions</tspan>
    </text>
  );
}

// ── Main tab ──────────────────────────────────────────────────────────────────

const DONUT_COLORS = ['#16a34a', '#ef4444', '#3b82f6'];

export default function DashboardOverviewTab({ rangeKey }: { rangeKey: RangeKey }) {
  const { metrics, queryVolume, actionOutcomes } = allData[rangeKey];

  const donutData = [
    { name: 'Confirmed', value: actionOutcomes.confirmed },
    { name: 'Cancelled', value: actionOutcomes.cancelled },
    { name: 'Edited', value: actionOutcomes.edited },
  ];

  const donutTotal = donutData.reduce((s, d) => s + d.value, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* KPI grid — 3 columns × 2 rows */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        <MetricCard label="Total Queries" value={metrics.totalQueries.value} trend={metrics.totalQueries.trend} />
        <MetricCard label="Actions Executed" value={metrics.actionsExecuted.value} trend={metrics.actionsExecuted.trend} />
        <MetricCard label="Actions Staged" value={metrics.actionsStaged.value} trend={metrics.actionsStaged.trend} />
        <MetricCard label="Artifacts Created" value={metrics.artifactsCreated.value} trend={metrics.artifactsCreated.trend} />
        <MetricCard label="Avg Response Time" value={metrics.avgResponseTime.value} trend={metrics.avgResponseTime.trend} isNumeric={false} lowerIsBetter />
        <MetricCard label="Intent Accuracy" value={metrics.intentAccuracy.value} trend={metrics.intentAccuracy.trend} isNumeric={false} />
      </div>

      {/* Charts row */}
      <div style={{ display: 'flex', gap: 16 }}>
        {/* Area chart */}
        <div style={{ flex: 1, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '20px 24px' }}>
          <p style={{ fontFamily: 'var(--display)', fontWeight: 600, fontSize: 14, color: 'var(--text)', margin: '0 0 20px' }}>Query Volume Over Time</p>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={queryVolume} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="ovAreaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--primary-80, #6366f1)" stopOpacity={0.12} />
                    <stop offset="95%" stopColor="var(--primary-80, #6366f1)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="var(--border)" strokeDasharray="4 4" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 10, fontFamily: 'var(--sans)', fill: 'var(--text3)' }} axisLine={false} tickLine={false} interval={2} />
                <YAxis tick={{ fontSize: 10, fontFamily: 'var(--sans)', fill: 'var(--text3)' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<AreaTooltip />} cursor={{ stroke: 'var(--border)', strokeWidth: 1 }} />
                <Area type="monotone" dataKey="queries" stroke="#6366f1" strokeWidth={2} fill="url(#ovAreaGrad)" dot={{ r: 3, fill: '#6366f1', strokeWidth: 0 }} activeDot={{ r: 5, fill: '#6366f1', strokeWidth: 0 }} />
              </AreaChart>
            </ResponsiveContainer>
        </div>

        {/* Donut chart */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '20px 24px', minWidth: 260 }}>
          <p style={{ fontFamily: 'var(--display)', fontWeight: 600, fontSize: 14, color: 'var(--text)', margin: '0 0 8px' }}>Action Outcomes</p>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                data={donutData}
                cx="50%"
                cy="50%"
                innerRadius="55%"
                outerRadius="80%"
                paddingAngle={3}
                dataKey="value"
                stroke="none"
              >
                {donutData.map((_, i) => (
                  <Cell key={i} fill={DONUT_COLORS[i]} />
                ))}
              </Pie>
              <Tooltip content={<DonutTooltip />} />
              <DonutCenter total={donutTotal} />
            </PieChart>
          </ResponsiveContainer>
          {/* Legend */}
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginTop: 4 }}>
            {donutData.map((d, i) => (
              <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <div style={{ width: 9, height: 9, borderRadius: '50%', background: DONUT_COLORS[i], flexShrink: 0 }} />
                <span style={{ fontFamily: 'var(--sans)', fontSize: 12, color: 'var(--text2)' }}>{d.name}</span>
                <span style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 12, color: 'var(--text)' }}>{d.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
