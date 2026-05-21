'use client';

import { CUSTOMERS } from '@/data/audreys/synthetic/customers';
import { LEADS } from '@/data/audreys/synthetic/leads';
import { SALES_REPS } from '@/data/audreys/synthetic/sales-reps';

interface Chip {
  label: string;
  query: string;
}

interface EntityHit {
  kind: 'customer' | 'lead' | 'rep';
  name: string;
}

function detectEntity(query: string): EntityHit | null {
  const q = query.toLowerCase();
  for (const c of CUSTOMERS) {
    if (q.includes(c.name.toLowerCase()) || q.includes(c.name.split(' ')[0].toLowerCase())) {
      return { kind: 'customer', name: c.name };
    }
  }
  for (const l of LEADS) {
    if (q.includes(l.name.toLowerCase()) || q.includes(l.name.split(' ')[0].toLowerCase())) {
      return { kind: 'lead', name: l.name };
    }
  }
  for (const r of SALES_REPS) {
    if (q.includes(r.name.toLowerCase()) || q.includes(r.name.split(' ')[0].toLowerCase())) {
      return { kind: 'rep', name: r.name };
    }
  }
  return null;
}

function chipsForEntity(entity: EntityHit | null): Chip[] {
  if (entity?.kind === 'customer') {
    return [
      { label: `Show ${entity.name}'s recent orders`, query: `Show me ${entity.name}'s recent orders` },
      { label: `Draft email to ${entity.name}`, query: `Draft a follow-up email to ${entity.name}` },
      { label: `Customer 360 for ${entity.name}`, query: `Show me ${entity.name}'s customer profile` },
    ];
  }
  if (entity?.kind === 'lead') {
    return [
      { label: `Lead details: ${entity.name}`, query: `Show me the lead profile for ${entity.name}` },
      { label: `Create follow-up task`, query: `Create a follow-up task for ${entity.name}` },
      { label: `Draft outreach email`, query: `Draft an outreach email to ${entity.name}` },
    ];
  }
  if (entity?.kind === 'rep') {
    return [
      { label: `Overdue tasks for ${entity.name}`, query: `Show overdue tasks for ${entity.name}` },
      { label: `${entity.name}'s pipeline`, query: `Show me ${entity.name}'s pipeline` },
      { label: `${entity.name}'s recent orders`, query: `Show me orders closed by ${entity.name}` },
    ];
  }
  return [
    { label: 'Show overdue tasks', query: 'Show overdue tasks' },
    { label: 'Pipeline report', query: 'Show me my pipeline report' },
    { label: 'Customer health', query: 'Customer health report' },
  ];
}

const REASON_COPY: Record<string, string> = {
  client_kill_switch: "Open-ended answers are turned off in this demo. Try one of these instead:",
  planner_disabled: "Open-ended answers are turned off right now. Try one of these instead:",
  planner_upstream_error: "I couldn't reach the planner — try one of these instead:",
  ir_parse_failed: "I had trouble structuring an answer for that. Try a more concrete question:",
  ir_schema_invalid: "I had trouble structuring an answer for that. Try a more concrete question:",
  stream_closed_early: "Something interrupted the answer. Try one of these instead:",
  network_error: "I couldn't reach the planner — try one of these instead:",
};

export default function PlannerFallbackCard({
  reason,
  userQuery,
  onSelect,
}: {
  reason?: string;
  userQuery?: string;
  onSelect: (q: string) => void;
}) {
  const entity = userQuery ? detectEntity(userQuery) : null;
  const chips = chipsForEntity(entity);
  const headline = (reason && REASON_COPY[reason])
    ?? "I couldn't answer that with confidence yet. Want to try one of these instead?";

  return (
    <div
      style={{
        padding: 16,
        background: 'var(--surface2)',
        border: '1px solid var(--border)',
        borderRadius: 12,
      }}
    >
      <div style={{ fontSize: 14, color: 'var(--text)', marginBottom: 10, lineHeight: 1.5 }}>
        {headline}
      </div>
      {reason && process.env.NODE_ENV !== 'production' && (
        <div style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'monospace', marginBottom: 8 }}>
          [debug: {reason}{entity ? ` · matched ${entity.kind} ${entity.name}` : ''}]
        </div>
      )}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {chips.map((c) => (
          <button
            key={c.query}
            onClick={() => onSelect(c.query)}
            style={{
              padding: '6px 14px',
              borderRadius: 999,
              border: '1px solid var(--border2)',
              background: 'var(--surface)',
              color: 'var(--text)',
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            {c.label}
          </button>
        ))}
      </div>
    </div>
  );
}
