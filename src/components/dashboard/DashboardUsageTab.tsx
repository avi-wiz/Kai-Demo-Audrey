'use client';

import { useState } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell,
} from 'recharts';
import allUsageData from '@/fixtures/dashboard-usage.json';
import type { RangeKey } from './DashboardLayout';

type UsageData = typeof allUsageData['30days'];

// ── Card ──────────────────────────────────────────────────────────────────────

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '20px 24px' }}>
      <p style={{ fontFamily: 'var(--display)', fontWeight: 600, fontSize: 14, color: 'var(--text)', margin: '0 0 20px' }}>{title}</p>
      {children}
    </div>
  );
}

// ── Token summary cards ───────────────────────────────────────────────────────

function TokenSummaryCards({ tokenConsumption }: { tokenConsumption: UsageData['tokenConsumption'] }) {
  const { total, estimatedCost } = tokenConsumption;

  function formatTokens(n: number) {
    return n >= 1_000_000 ? `${(n / 1_000_000).toFixed(2)}M` : `${(n / 1000).toFixed(0)}K`;
  }

  const cards = [
    { label: 'Total Input Tokens',  value: formatTokens(total.input),  sub: `${(total.input  / 1000).toFixed(0)}K tokens` },
    { label: 'Total Output Tokens', value: formatTokens(total.output), sub: `${(total.output / 1000).toFixed(0)}K tokens` },
    { label: 'Estimated Cost', value: `$${estimatedCost.total.toFixed(2)}`, sub: `Based on ${estimatedCost.model} pricing`, highlight: true },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
      {cards.map((c) => (
        <div key={c.label} style={{
          background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '16px 18px',
        }}>
          <p style={{ fontFamily: 'var(--sans)', fontWeight: 500, fontSize: 12, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 8px' }}>
            {c.label}
          </p>
          <p style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 24, color: c.highlight ? '#6366f1' : 'var(--text)', margin: '0 0 4px', lineHeight: 1 }}>
            {c.value}
          </p>
          <p style={{ fontFamily: 'var(--sans)', fontSize: 11.5, color: 'var(--text3)', margin: 0 }}>{c.sub}</p>
        </div>
      ))}
    </div>
  );
}

// ── Stacked area chart tooltip ────────────────────────────────────────────────

const UC_KEYS = ['uc1', 'uc2', 'uc3', 'docs'] as const;
const UC_COLORS: Record<string, string> = {
  uc1: '#34D399',
  uc2: '#FBBF24',
  uc3: '#60A5FA',
  docs: '#A78BFA',
};
const UC_LABELS: Record<string, string> = {
  uc1: 'Surface (UC-1)',
  uc2: 'Act (UC-2)',
  uc3: 'Multi-Intent (UC-3)',
  docs: 'Docs Q&A',
};

function StackedTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; fill: string; dataKey: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  const total = payload.reduce((s, p) => s + p.value, 0);
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
      <p style={{ fontFamily: 'var(--sans)', fontSize: 11, color: 'var(--text2)', margin: '0 0 6px' }}>{label}</p>
      {[...payload].reverse().map((p) => (
        <p key={p.dataKey} style={{ fontFamily: 'var(--sans)', fontSize: 12, color: 'var(--text)', margin: '2px 0', display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: UC_COLORS[p.dataKey], flexShrink: 0 }} />
          {UC_LABELS[p.dataKey]}: {(p.value / 1000).toFixed(0)}K
        </p>
      ))}
      <p style={{ fontFamily: 'var(--display)', fontWeight: 600, fontSize: 12, color: 'var(--text)', margin: '6px 0 0', borderTop: '1px solid var(--border)', paddingTop: 6 }}>
        Total: {(total / 1000).toFixed(0)}K
      </p>
    </div>
  );
}

// ── Stacked area chart ────────────────────────────────────────────────────────

function TokenAreaChart({ tokenConsumption }: { tokenConsumption: UsageData['tokenConsumption'] }) {
  const [hidden, setHidden] = useState<Set<string>>(new Set());

  function toggle(key: string) {
    setHidden((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }

  return (
    <Card title="Token Consumption by Use Case">
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={tokenConsumption.byUseCase} margin={{ top: 4, right: 4, left: -4, bottom: 0 }}>
          <defs>
            {UC_KEYS.map((key) => (
              <linearGradient key={key} id={`ugrad-${key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={UC_COLORS[key]} stopOpacity={0.6} />
                <stop offset="95%" stopColor={UC_COLORS[key]} stopOpacity={0.08} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid stroke="var(--border)" strokeDasharray="4 4" vertical={false} />
          <XAxis dataKey="date" tick={{ fontSize: 10, fontFamily: 'var(--sans)', fill: 'var(--text3)' }} axisLine={false} tickLine={false} interval={2} />
          <YAxis tick={{ fontSize: 10, fontFamily: 'var(--sans)', fill: 'var(--text3)' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
          <Tooltip content={<StackedTooltip />} cursor={{ stroke: 'var(--border)', strokeWidth: 1 }} />
          {UC_KEYS.map((key) => (
            <Area
              key={key}
              type="monotone"
              dataKey={key}
              name={UC_LABELS[key]}
              stroke={UC_COLORS[key]}
              strokeWidth={1.5}
              fill={`url(#ugrad-${key})`}
              stackId="tokens"
              hide={hidden.has(key)}
              dot={false}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>

      {/* Toggleable legend */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 14 }}>
        {UC_KEYS.map((key) => {
          const isHidden = hidden.has(key);
          return (
            <button
              key={key}
              onClick={() => toggle(key)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: 'none', border: '1px solid var(--border)', borderRadius: 20,
                padding: '4px 10px', cursor: 'pointer',
                opacity: isHidden ? 0.4 : 1,
                transition: 'opacity 150ms ease',
              }}
            >
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: UC_COLORS[key], display: 'inline-block', flexShrink: 0 }} />
              <span style={{ fontFamily: 'var(--sans)', fontSize: 11.5, color: 'var(--text2)' }}>{UC_LABELS[key]}</span>
            </button>
          );
        })}
      </div>
    </Card>
  );
}

// ── Pattern list ──────────────────────────────────────────────────────────────

function PatternList({ topQueryPatterns }: { topQueryPatterns: UsageData['topQueryPatterns'] }) {
  const maxCount = Math.max(...topQueryPatterns.map((p) => p.count));

  return (
    <Card title="Most Frequent Query Patterns">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {topQueryPatterns.map((p, i) => (
          <div key={p.pattern} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* Rank */}
            <div style={{
              width: 24, height: 24, borderRadius: '50%', background: 'var(--surface2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <span style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 11, color: 'var(--text3)' }}>{i + 1}</span>
            </div>

            {/* Name + bar */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontFamily: 'var(--display)', fontWeight: 600, fontSize: 13, color: 'var(--text)', margin: '0 0 5px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {p.pattern}
              </p>
              <div style={{ height: 8, background: 'var(--surface2)', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{
                  width: `${Math.round((p.count / maxCount) * 100)}%`,
                  height: '100%',
                  borderRadius: 4,
                  background: 'linear-gradient(90deg, #6366f1, #3b82f6)',
                }} />
              </div>
            </div>

            {/* Count */}
            <span style={{ fontFamily: 'var(--mono, monospace)', fontSize: 12, color: 'var(--text2)', minWidth: 28, textAlign: 'right', flexShrink: 0 }}>{p.count}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

// ── Peak hours bar tooltip ────────────────────────────────────────────────────

function HourTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
      <p style={{ fontFamily: 'var(--sans)', fontSize: 11, color: 'var(--text2)', margin: '0 0 2px' }}>{label}</p>
      <p style={{ fontFamily: 'var(--display)', fontWeight: 600, fontSize: 14, color: 'var(--text)', margin: 0 }}>{payload[0].value} queries</p>
    </div>
  );
}

function barColor(v: number) {
  if (v > 25) return '#6366f1';
  if (v >= 10) return '#a5b4fc';
  return '#e5e7eb';
}

function PeakHoursChart({ peakHours }: { peakHours: UsageData['peakHours'] }) {
  return (
    <Card title="Peak Usage Hours">
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={peakHours} margin={{ top: 4, right: 4, left: -20, bottom: 20 }}>
          <CartesianGrid stroke="var(--border)" strokeDasharray="4 4" vertical={false} />
          <XAxis
            dataKey="hour"
            tick={{ fontSize: 9, fontFamily: 'var(--sans)', fill: 'var(--text3)' }}
            axisLine={false}
            tickLine={false}
            angle={-45}
            textAnchor="end"
            interval={0}
          />
          <YAxis tick={{ fontSize: 9, fontFamily: 'var(--sans)', fill: 'var(--text3)' }} axisLine={false} tickLine={false} allowDecimals={false} />
          <Tooltip content={<HourTooltip />} cursor={{ fill: 'rgba(99,102,241,0.06)' }} />
          <Bar dataKey="queries" radius={[3, 3, 0, 0]} maxBarSize={22}>
            {peakHours.map((entry, i) => (
              <Cell key={i} fill={barColor(entry.queries)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}

// ── Main tab ──────────────────────────────────────────────────────────────────

export default function DashboardUsageTab({ rangeKey }: { rangeKey: RangeKey }) {
  const usageData = allUsageData[rangeKey];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <TokenSummaryCards tokenConsumption={usageData.tokenConsumption} />
      <TokenAreaChart tokenConsumption={usageData.tokenConsumption} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <PatternList topQueryPatterns={usageData.topQueryPatterns} />
        <PeakHoursChart peakHours={usageData.peakHours} />
      </div>
    </div>
  );
}
