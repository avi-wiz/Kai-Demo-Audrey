'use client';

import { useMemo, useState } from 'react';
import { useAgentStore } from '@/contexts/AgentStoreContext';
import type { AgentCategory } from '@/lib/types';
import AgentCard from './AgentCard';

type FilterValue = 'all' | AgentCategory;

const FILTER_OPTIONS: { value: FilterValue; label: string }[] = [
  { value: 'all',        label: 'All' },
  { value: 'sales',      label: 'Sales' },
  { value: 'support',    label: 'Support' },
  { value: 'analytics',  label: 'Analytics' },
  { value: 'operations', label: 'Operations' },
  { value: 'management', label: 'Management' },
  { value: 'general',    label: 'General' },
];

export default function MyAgentsView() {
  const { agents, isActivated } = useAgentStore();
  const activeCount = agents.filter((a) => isActivated(a.id)).length;
  const [filter, setFilter] = useState<FilterValue>('all');

  // Only render chips for categories that exist in the catalog (drops empty
  // ones so the filter row stays tight without manual curation).
  const availableFilters = useMemo(() => {
    const present = new Set<AgentCategory>(agents.map((a) => a.category));
    return FILTER_OPTIONS.filter((o) => o.value === 'all' || present.has(o.value as AgentCategory));
  }, [agents]);

  const visibleAgents = useMemo(() => {
    if (filter === 'all') return agents;
    return agents.filter((a) => a.category === filter);
  }, [agents, filter]);

  return (
    <div style={{ padding: '32px 40px' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{
          fontFamily: 'var(--display)',
          fontWeight: 700,
          fontSize: 18,
          color: 'var(--text)',
          margin: '0 0 4px',
        }}>
          Kai&rsquo;s additional capabilities
        </h1>
        <p style={{ fontFamily: 'var(--sans)', fontSize: 13, color: 'var(--text2)', margin: 0 }}>
          Capabilities — manage and configure your active AI agents.
        </p>
      </div>

      <p style={{ fontFamily: 'var(--sans)', fontSize: 12, color: 'var(--text3)', margin: '0 0 16px' }}>
        {activeCount} of {agents.length} capabilit{agents.length !== 1 ? 'ies' : 'y'} active
      </p>

      {/* Category filter chips */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
        {availableFilters.map((opt) => {
          const active = filter === opt.value;
          return (
            <button
              key={opt.value}
              onClick={() => setFilter(opt.value)}
              style={{
                padding: '6px 14px',
                borderRadius: 999,
                border: '1px solid ' + (active ? 'var(--primary-80)' : 'var(--border)'),
                background: active ? 'var(--primary-80)' : 'var(--surface)',
                color: active ? '#fff' : 'var(--text2)',
                fontFamily: 'var(--display)',
                fontWeight: 600,
                fontSize: 12,
                cursor: 'pointer',
                transition: 'all 150ms ease',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={(e) => {
                if (!active) {
                  e.currentTarget.style.borderColor = 'var(--primary-80)';
                  e.currentTarget.style.color = 'var(--text)';
                }
              }}
              onMouseLeave={(e) => {
                if (!active) {
                  e.currentTarget.style.borderColor = 'var(--border)';
                  e.currentTarget.style.color = 'var(--text2)';
                }
              }}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      <style>{`
        .my-agents-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
        @media (max-width: 1024px) { .my-agents-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 640px)  { .my-agents-grid { grid-template-columns: 1fr; } }
      `}</style>
      {visibleAgents.length > 0 ? (
        <div className="my-agents-grid">
          {visibleAgents.map((agent) => (
            <AgentCard key={agent.id} agent={agent} context="my-agents" />
          ))}
        </div>
      ) : (
        <div style={{
          padding: '24px 20px',
          textAlign: 'center',
          border: '1px dashed var(--border)',
          borderRadius: 10,
          background: 'var(--surface)',
          fontFamily: 'var(--sans)',
          fontSize: 13,
          color: 'var(--text2)',
        }}>
          No capabilities in this category.
        </div>
      )}
    </div>
  );
}
