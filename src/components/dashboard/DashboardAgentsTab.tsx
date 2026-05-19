'use client';

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList,
} from 'recharts';
import allAgentsData from '@/fixtures/dashboard-agents.json';
import type { RangeKey } from './DashboardLayout';

type AgentsData = typeof allAgentsData['30days'];

// ── Agent colors (keyed by name) ──────────────────────────────────────────────

const AGENT_COLORS: Record<string, string> = {
  Kai: '#16885F',
  Ella: '#6BA6FE',
};

// ── Card ──────────────────────────────────────────────────────────────────────

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '20px 24px' }}>
      <p style={{ fontFamily: 'var(--display)', fontWeight: 600, fontSize: 14, color: 'var(--text)', margin: '0 0 20px' }}>{title}</p>
      {children}
    </div>
  );
}

// ── Agent status cards ────────────────────────────────────────────────────────

function AgentStatusCards({ agentStatus }: { agentStatus: AgentsData['agentStatus'] }) {

  return (
    <div style={{ display: 'flex', gap: 16 }}>
      {agentStatus.map((agent) => {
        const color = AGENT_COLORS[agent.name] ?? '#6366f1';
        return (
          <div key={agent.id} style={{
            flex: 1,
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderTop: `4px solid ${color}`,
            borderRadius: 12,
            padding: '18px 20px',
          }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 15, color: 'var(--text)' }}>{agent.name}</span>
              <span style={{
                background: 'rgba(22,163,74,0.1)', color: '#16a34a',
                fontFamily: 'var(--display)', fontWeight: 600, fontSize: 11,
                padding: '2px 8px', borderRadius: 20,
              }}>Active</span>
            </div>

            {/* Uptime */}
            <p style={{ fontFamily: 'var(--mono, monospace)', fontSize: 12, color, fontWeight: 600, margin: '0 0 10px' }}>
              {agent.uptime}% uptime
            </p>

            {/* Mini metrics */}
            <div style={{ display: 'flex', gap: 16 }}>
              <div>
                <p style={{ fontFamily: 'var(--sans)', fontSize: 11, color: 'var(--text3)', margin: '0 0 2px' }}>Queries</p>
                <p style={{ fontFamily: 'var(--display)', fontWeight: 600, fontSize: 13, color: 'var(--text)', margin: 0 }}>{agent.queriesHandled}</p>
              </div>
              <div>
                <p style={{ fontFamily: 'var(--sans)', fontSize: 11, color: 'var(--text3)', margin: '0 0 2px' }}>Actions</p>
                <p style={{ fontFamily: 'var(--display)', fontWeight: 600, fontSize: 13, color: 'var(--text)', margin: 0 }}>{agent.actionsExecuted}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Queries per agent tooltip ─────────────────────────────────────────────────

function QueriesBarTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
      <p style={{ fontFamily: 'var(--sans)', fontSize: 11, color: 'var(--text2)', margin: '0 0 2px' }}>{label}</p>
      <p style={{ fontFamily: 'var(--display)', fontWeight: 600, fontSize: 14, color: 'var(--text)', margin: 0 }}>{payload[0].value} queries</p>
    </div>
  );
}

// ── Queries per agent bar chart ───────────────────────────────────────────────

function QueriesBarChart({ queriesPerAgent }: { queriesPerAgent: AgentsData['queriesPerAgent'] }) {

  return (
    <Card title="Queries per Agent">
      <ResponsiveContainer width="100%" height={160}>
        <BarChart
          data={queriesPerAgent}
          layout="vertical"
          margin={{ top: 4, right: 40, left: 8, bottom: 0 }}
          barCategoryGap="35%"
        >
          <CartesianGrid stroke="var(--border)" strokeDasharray="4 4" horizontal={false} />
          <YAxis
            dataKey="agent"
            type="category"
            tick={{ fontFamily: 'var(--sans)', fontSize: 13, fill: 'var(--text)' }}
            axisLine={false}
            tickLine={false}
            width={36}
          />
          <XAxis type="number" hide />
          <Tooltip content={<QueriesBarTooltip />} cursor={{ fill: 'rgba(0,0,0,0.04)' }} />
          <Bar dataKey="queries" radius={[0, 4, 4, 0]} maxBarSize={22}>
            <LabelList dataKey="queries" position="right" style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 13, fill: 'var(--text)' }} />
            {queriesPerAgent.map((entry, i) => (
              <Cell key={i} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}

// ── Actions stacked bar ───────────────────────────────────────────────────────

const ACTION_COLORS: Record<string, string> = {
  tasks: '#34D399',
  quotes: '#FBBF24',
  lookups: '#60A5FA',
  orders_processed: '#34D399',
  validations: '#FBBF24',
};

const ACTION_LABELS: Record<string, string> = {
  tasks: 'Tasks',
  quotes: 'Quotes',
  lookups: 'Lookups',
  orders_processed: 'Orders Processed',
  validations: 'Validations',
};

function ActionsStackedTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ dataKey: string; value: number; fill: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  const total = payload.reduce((s, p) => s + p.value, 0);
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
      <p style={{ fontFamily: 'var(--display)', fontWeight: 600, fontSize: 13, color: 'var(--text)', margin: '0 0 6px' }}>{label}</p>
      {[...payload].reverse().map((p) => (
        <p key={p.dataKey} style={{ fontFamily: 'var(--sans)', fontSize: 12, color: 'var(--text2)', margin: '2px 0', display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: p.fill, display: 'inline-block', flexShrink: 0 }} />
          {ACTION_LABELS[p.dataKey] ?? p.dataKey}: {p.value}
        </p>
      ))}
      <p style={{ fontFamily: 'var(--display)', fontWeight: 600, fontSize: 12, color: 'var(--text)', margin: '6px 0 0', borderTop: '1px solid var(--border)', paddingTop: 6 }}>
        Total: {total}
      </p>
    </div>
  );
}

function ActionsStackedChart({ actionsPerAgent }: { actionsPerAgent: AgentsData['actionsPerAgent'] }) {

  // Collect all unique action keys across all agents
  const allKeys = Array.from(new Set(actionsPerAgent.flatMap((a) => Object.keys(a.breakdown))));

  // Flatten for recharts: one row per agent with all action keys
  const chartData = actionsPerAgent.map((a) => {
    const row: Record<string, unknown> = { agent: a.agent };
    allKeys.forEach((k) => { row[k] = (a.breakdown as Record<string, number | undefined>)[k] ?? 0; });
    return row;
  });

  // Legend items that are actually present
  const legendKeys = allKeys.filter((k) => chartData.some((d) => ((d[k] as number) ?? 0) > 0));

  return (
    <Card title="Actions per Agent">
      <ResponsiveContainer width="100%" height={160}>
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 4, right: 16, left: 8, bottom: 0 }}
          barCategoryGap="35%"
        >
          <CartesianGrid stroke="var(--border)" strokeDasharray="4 4" horizontal={false} />
          <YAxis
            dataKey="agent"
            type="category"
            tick={{ fontFamily: 'var(--sans)', fontSize: 13, fill: 'var(--text)' }}
            axisLine={false}
            tickLine={false}
            width={36}
          />
          <XAxis type="number" hide />
          <Tooltip content={<ActionsStackedTooltip />} cursor={{ fill: 'rgba(0,0,0,0.04)' }} />
          {allKeys.map((key) => (
            <Bar
              key={key}
              dataKey={key}
              name={ACTION_LABELS[key] ?? key}
              stackId="actions"
              fill={ACTION_COLORS[key] ?? '#6366f1'}
              radius={allKeys.indexOf(key) === allKeys.length - 1 ? [0, 4, 4, 0] : [0, 0, 0, 0]}
              maxBarSize={22}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginTop: 14 }}>
        {legendKeys.map((key) => (
          <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: ACTION_COLORS[key] ?? '#6366f1', display: 'inline-block', flexShrink: 0 }} />
            <span style={{ fontFamily: 'var(--sans)', fontSize: 11.5, color: 'var(--text2)' }}>{ACTION_LABELS[key] ?? key}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

// ── Top capabilities table ────────────────────────────────────────────────────

function TopCapabilitiesTable({ topCapabilities }: { topCapabilities: AgentsData['topCapabilities'] }) {
  const caps = [...topCapabilities].sort((a, b) => b.uses - a.uses);
  const maxUses = caps[0].uses;

  return (
    <Card title="Top Capabilities">
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            {['Capability', 'Agent', 'Uses'].map((h) => (
              <th key={h} style={{
                fontFamily: 'var(--display)', fontWeight: 600, fontSize: 11, color: 'var(--text3)',
                textTransform: 'uppercase', letterSpacing: '0.04em',
                textAlign: h === 'Uses' ? 'right' : 'left',
                paddingBottom: 8, borderBottom: '1px solid var(--border)',
              }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {caps.map((cap, i) => {
            const color = AGENT_COLORS[cap.agent] ?? '#6366f1';
            const isLast = i === caps.length - 1;
            return (
              <tr key={cap.capability}>
                <td style={{ fontFamily: 'var(--sans)', fontSize: 13, color: 'var(--text)', padding: '10px 0', borderBottom: !isLast ? '1px solid var(--border)' : 'none', paddingRight: 16 }}>
                  {cap.capability}
                </td>
                <td style={{ padding: '10px 0', borderBottom: !isLast ? '1px solid var(--border)' : 'none', paddingRight: 16 }}>
                  <span style={{ fontFamily: 'var(--display)', fontWeight: 600, fontSize: 12, color }}>
                    {cap.agent}
                  </span>
                </td>
                <td style={{ padding: '10px 0', borderBottom: !isLast ? '1px solid var(--border)' : 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'flex-end' }}>
                    <div style={{ width: 80, height: 6, background: 'var(--surface2)', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ width: `${Math.round((cap.uses / maxUses) * 100)}%`, height: '100%', background: 'linear-gradient(90deg, #6366f1, #3b82f6)', borderRadius: 3 }} />
                    </div>
                    <span style={{ fontFamily: 'var(--mono, monospace)', fontSize: 12, color: 'var(--text2)', minWidth: 24, textAlign: 'right' }}>{cap.uses}</span>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </Card>
  );
}

// ── Main tab ──────────────────────────────────────────────────────────────────

export default function DashboardAgentsTab({ rangeKey }: { rangeKey: RangeKey }) {
  const agentsData = allAgentsData[rangeKey];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <AgentStatusCards agentStatus={agentsData.agentStatus} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <QueriesBarChart queriesPerAgent={agentsData.queriesPerAgent} />
        <ActionsStackedChart actionsPerAgent={agentsData.actionsPerAgent} />
      </div>
      <TopCapabilitiesTable topCapabilities={agentsData.topCapabilities} />
    </div>
  );
}
