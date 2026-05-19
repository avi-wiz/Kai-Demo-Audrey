'use client';

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, ReferenceLine, Label,
} from 'recharts';
import allPerfData from '@/fixtures/dashboard-performance.json';
import type { RangeKey } from './DashboardLayout';

// ── Card ──────────────────────────────────────────────────────────────────────

function Card({ title, children, style }: { title: string; children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '20px 24px', ...style }}>
      <p style={{ fontFamily: 'var(--display)', fontWeight: 600, fontSize: 14, color: 'var(--text)', margin: '0 0 20px' }}>{title}</p>
      {children}
    </div>
  );
}

// ── Stacked bar tooltip ───────────────────────────────────────────────────────

type PerfData = typeof allPerfData['30days'];

function LatencyBarTooltip({ active, payload, label, latencyBreakdown }: {
  active?: boolean;
  payload?: Array<{ value: number; dataKey: string }>;
  label?: string;
  latencyBreakdown: PerfData['latencyBreakdown'];
}) {
  if (!active || !payload?.length) return null;
  const row = latencyBreakdown.find((r) => r.stage === label);
  if (!row) return null;
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
      <p style={{ fontFamily: 'var(--display)', fontWeight: 600, fontSize: 13, color: 'var(--text)', margin: '0 0 6px' }}>{label}</p>
      {[
        { label: 'P50', value: row.p50 },
        { label: 'P90', value: row.p90 },
        { label: 'P99', value: row.p99 },
      ].map((p) => (
        <p key={p.label} style={{ fontFamily: 'var(--sans)', fontSize: 12, color: 'var(--text2)', margin: '2px 0', display: 'flex', justifyContent: 'space-between', gap: 16 }}>
          <span>{p.label}</span>
          <span style={{ fontFamily: 'var(--mono, monospace)', color: 'var(--text)', fontWeight: 500 }}>{p.value} ms</span>
        </p>
      ))}
    </div>
  );
}

// ── TTFF tooltip ──────────────────────────────────────────────────────────────

function TtffTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
      <p style={{ fontFamily: 'var(--sans)', fontSize: 11, color: 'var(--text2)', margin: '0 0 2px' }}>{label}</p>
      <p style={{ fontFamily: 'var(--display)', fontWeight: 600, fontSize: 14, color: 'var(--text)', margin: 0 }}>{payload[0].value} ms</p>
    </div>
  );
}

// ── Latency stacked bar chart ─────────────────────────────────────────────────

const STAGE_COLORS: Record<string, string> = {
  Ingestion: '#60A5FA',
  Planning: '#34D399',
  Execution: '#FBBF24',
  'Widget Resolve': '#A78BFA',
};

function LatencyBarChart({ latencyBreakdown }: { latencyBreakdown: PerfData['latencyBreakdown'] }) {
  const rows = latencyBreakdown.filter((r) => r.stage !== 'Total');

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart
        data={rows}
        layout="vertical"
        margin={{ top: 4, right: 16, left: 16, bottom: 0 }}
        barCategoryGap="30%"
      >
        <CartesianGrid stroke="var(--border)" strokeDasharray="4 4" horizontal={false} />
        <YAxis
          dataKey="stage"
          type="category"
          tick={{ fontFamily: 'var(--sans)', fontSize: 12, fill: 'var(--text2)' }}
          axisLine={false}
          tickLine={false}
          width={96}
        />
        <XAxis
          type="number"
          tick={{ fontFamily: 'var(--sans)', fontSize: 10, fill: 'var(--text3)' }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `${v}ms`}
        />
        <Tooltip content={<LatencyBarTooltip latencyBreakdown={rows} />} cursor={{ fill: 'rgba(0,0,0,0.04)' }} />
        {rows.map((row) => (
          <Bar
            key={row.stage}
            dataKey="p50"
            name={row.stage}
            fill={STAGE_COLORS[row.stage] ?? '#6366f1'}
            radius={[0, 4, 4, 0]}
            maxBarSize={18}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}

// ── TTFF line chart ───────────────────────────────────────────────────────────

function TtffChart({ ttffTrend }: { ttffTrend: PerfData['ttffTrend'] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={ttffTrend} margin={{ top: 4, right: 16, left: -10, bottom: 0 }}>
        <CartesianGrid stroke="var(--border)" strokeDasharray="4 4" vertical={false} />
        <XAxis dataKey="date" tick={{ fontSize: 10, fontFamily: 'var(--sans)', fill: 'var(--text3)' }} axisLine={false} tickLine={false} interval={2} />
        <YAxis tick={{ fontSize: 10, fontFamily: 'var(--sans)', fill: 'var(--text3)' }} axisLine={false} tickLine={false} domain={['auto', 'auto']} tickFormatter={(v) => `${v}ms`} />
        <Tooltip content={<TtffTooltip />} cursor={{ stroke: 'var(--border)', strokeWidth: 1 }} />
        <ReferenceLine y={350} stroke="var(--text3, #9ca3af)" strokeDasharray="5 5">
          <Label value="Target: 350ms" position="insideTopRight" style={{ fontFamily: 'var(--sans)', fontSize: 11, fill: 'var(--text3, #9ca3af)' }} />
        </ReferenceLine>
        <Line type="monotone" dataKey="ttff" stroke="#3b82f6" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: '#3b82f6', strokeWidth: 0 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}

// ── P99 color ─────────────────────────────────────────────────────────────────

function p99Color(v: number) {
  if (v < 500) return '#6366f1';
  if (v <= 1000) return '#f59e0b';
  return '#ef4444';
}

// ── Latency percentiles table ─────────────────────────────────────────────────

function LatencyPercentilesTable({ latencyBreakdown }: { latencyBreakdown: PerfData['latencyBreakdown'] }) {
  const cols = ['Stage', 'P50', 'P90', 'P99'];

  return (
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <thead>
        <tr>
          {cols.map((c) => (
            <th key={c} style={{
              fontFamily: 'var(--display)', fontWeight: 600, fontSize: 11, color: 'var(--text3)',
              textTransform: 'uppercase', letterSpacing: '0.04em',
              textAlign: c === 'Stage' ? 'left' : 'right',
              paddingBottom: 8, borderBottom: '1px solid var(--border)',
            }}>{c}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {latencyBreakdown.map((row, i) => {
          const isTotal = row.stage === 'Total';
          const isLast = i === latencyBreakdown.length - 1;
          return (
            <tr key={row.stage} style={{ borderTop: isTotal ? '2px solid var(--border)' : undefined }}>
              <td style={{
                fontFamily: 'var(--display)', fontWeight: isTotal ? 700 : 400, fontSize: 13,
                color: 'var(--text)', padding: '9px 0',
                borderBottom: !isLast ? '1px solid var(--border)' : 'none',
              }}>{row.stage}</td>
              {([row.p50, row.p90, row.p99] as number[]).map((v, j) => (
                <td key={j} style={{
                  fontFamily: 'var(--mono, monospace)', fontSize: 13,
                  color: j === 2 ? p99Color(v) : 'var(--text)',
                  fontWeight: isTotal ? 700 : 400,
                  textAlign: 'right', padding: '9px 0',
                  borderBottom: !isLast ? '1px solid var(--border)' : 'none',
                }}>{v} ms</td>
              ))}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

// ── Classification accuracy ───────────────────────────────────────────────────

function ClassificationAccuracy({ intentClassification, entityResolution, fallbackRate }: {
  intentClassification: PerfData['intentClassification'];
  entityResolution: PerfData['entityResolution'];
  fallbackRate: PerfData['fallbackRate'];
}) {
  const { breakdown, accuracy } = intentClassification;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Big number */}
      <div>
        <p style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 28, color: '#6366f1', margin: '0 0 2px', lineHeight: 1 }}>{accuracy}%</p>
        <p style={{ fontFamily: 'var(--sans)', fontSize: 12, color: 'var(--text3)', margin: 0 }}>Overall Intent Accuracy</p>
      </div>

      {/* Breakdown */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        {/* Header */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 60px 60px 80px', gap: 8, paddingBottom: 6, borderBottom: '1px solid var(--border)', marginBottom: 2 }}>
          {['Intent', 'Correct', 'Total', 'Accuracy'].map((h) => (
            <span key={h} style={{ fontFamily: 'var(--display)', fontWeight: 600, fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.04em', textAlign: h === 'Intent' ? 'left' : 'right' }}>{h}</span>
          ))}
        </div>
        {breakdown.map((row, i) => {
          const pct = row.correct !== null ? Math.round((row.correct / row.total) * 100) : null;
          const barColor = pct !== null ? (pct >= 90 ? '#16a34a' : pct >= 75 ? '#f59e0b' : '#ef4444') : 'var(--border)';
          return (
            <div key={row.intent} style={{
              display: 'grid', gridTemplateColumns: '1fr 60px 60px 80px', gap: 8,
              alignItems: 'center', padding: '8px 0',
              borderBottom: i < breakdown.length - 1 ? '1px solid var(--border)' : 'none',
            }}>
              <div>
                <span style={{ fontFamily: 'var(--sans)', fontSize: 12, color: 'var(--text)', display: 'block', marginBottom: 4 }}>{row.intent}</span>
                <div style={{ height: 5, background: 'var(--surface2)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ width: `${pct ?? 0}%`, height: '100%', background: barColor, borderRadius: 3 }} />
                </div>
              </div>
              <span style={{ fontFamily: 'var(--mono, monospace)', fontSize: 12, color: 'var(--text2)', textAlign: 'right' }}>{row.correct ?? '—'}</span>
              <span style={{ fontFamily: 'var(--mono, monospace)', fontSize: 12, color: 'var(--text2)', textAlign: 'right' }}>{row.total}</span>
              <span style={{ fontFamily: 'var(--mono, monospace)', fontSize: 12, color: pct !== null ? barColor : 'var(--text3)', fontWeight: 600, textAlign: 'right' }}>{pct !== null ? `${pct}%` : '—'}</span>
            </div>
          );
        })}
      </div>

      {/* Entity resolution + fallback */}
      <div style={{ display: 'flex', gap: 10 }}>
        <div style={{ flex: 1, background: 'var(--surface2)', borderRadius: 8, padding: '12px 14px' }}>
          <p style={{ fontFamily: 'var(--sans)', fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 4px' }}>Entity Resolution</p>
          <p style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 18, color: '#16a34a', margin: '0 0 2px' }}>{entityResolution.accuracy}%</p>
          <p style={{ fontFamily: 'var(--mono, monospace)', fontSize: 11, color: 'var(--text3)', margin: 0 }}>{entityResolution.successful}/{entityResolution.totalAttempts}</p>
        </div>
        <div style={{ flex: 1, background: 'var(--surface2)', borderRadius: 8, padding: '12px 14px' }}>
          <p style={{ fontFamily: 'var(--sans)', fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 4px' }}>Fallback Rate</p>
          <p style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 18, color: '#f59e0b', margin: '0 0 2px' }}>{fallbackRate}%</p>
          <p style={{ fontFamily: 'var(--sans)', fontSize: 11, color: 'var(--text3)', margin: 0 }}>Queries Kai couldn&apos;t classify</p>
        </div>
      </div>
    </div>
  );
}

// ── Main tab ──────────────────────────────────────────────────────────────────

export default function DashboardPerformanceTab({ rangeKey }: { rangeKey: RangeKey }) {
  const perfData = allPerfData[rangeKey];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Row 1: Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Card title="Response Latency by Stage">
          <LatencyBarChart latencyBreakdown={perfData.latencyBreakdown} />
        </Card>
        <Card title="Time to First Frame (TTFF)">
          <TtffChart ttffTrend={perfData.ttffTrend} />
        </Card>
      </div>

      {/* Row 2: Tables */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Card title="Latency Percentiles">
          <LatencyPercentilesTable latencyBreakdown={perfData.latencyBreakdown} />
        </Card>
        <Card title="Intent Classification Accuracy">
          <ClassificationAccuracy
            intentClassification={perfData.intentClassification}
            entityResolution={perfData.entityResolution}
            fallbackRate={perfData.fallbackRate}
          />
        </Card>
      </div>
    </div>
  );
}
