'use client';

import { useAgentStore } from '@/contexts/AgentStoreContext';
import type { Agent } from '@/lib/types';

function initials(name: string) {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function categoryLabel(cat: string) {
  return cat.charAt(0).toUpperCase() + cat.slice(1);
}

export interface AgentCardProps {
  agent: Agent;
  context: 'library' | 'my-agents';
  onClick?: () => void;
}

// No cart / checkout. Each agent starts as "Activate"; once activated the CTA
// swaps to "Configure" and the per-agent config page becomes reachable.
// `included` agents (bundled with WizCommerce) are activated by default.
export default function AgentCard({ agent, onClick }: AgentCardProps) {
  const { setAgentStoreView, activateAgent, isActivated } = useAgentStore();

  const activated = isActivated(agent.id);
  const isIncluded = agent.status === 'included';

  function handleCardClick() {
    if (onClick) {
      onClick();
      return;
    }
    if (activated) setAgentStoreView('my-agent-config', agent.id);
  }

  function handleConfigure(e: React.MouseEvent) {
    e.stopPropagation();
    setAgentStoreView('my-agent-config', agent.id);
  }

  function handleActivate(e: React.MouseEvent) {
    e.stopPropagation();
    activateAgent(agent.id);
  }

  return (
    <div
      onClick={handleCardClick}
      className="transition-all duration-200 ease-in-out hover:-translate-y-1 hover:shadow-lg shadow-sm"
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-card, 12px)',
        overflow: 'hidden',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div style={{
        height: 72,
        background: agent.color,
        flexShrink: 0,
        backgroundImage: `linear-gradient(160deg, ${agent.color}ee 0%, ${agent.color} 100%)`,
      }} />

      <div style={{ display: 'flex', justifyContent: 'center', marginTop: -36 }}>
        <div style={{
          width: 72,
          height: 72,
          borderRadius: '50%',
          background: 'var(--surface)',
          border: '4px solid var(--surface)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          boxShadow: '0 2px 12px rgba(0,0,0,0.14)',
          overflow: 'hidden',
        }}>
          <div style={{
            width: '100%',
            height: '100%',
            borderRadius: '50%',
            background: agent.color,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <span style={{
              fontFamily: 'var(--display)',
              fontWeight: 800,
              fontSize: 22,
              color: 'white',
              lineHeight: 1,
              userSelect: 'none',
              letterSpacing: '-0.5px',
            }}>
              {initials(agent.name)}
            </span>
          </div>
        </div>
      </div>

      <div style={{ padding: '10px 18px 0', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
        <p style={{
          fontFamily: 'var(--display)',
          fontWeight: 700,
          fontSize: 14.5,
          color: 'var(--text)',
          margin: 0,
          lineHeight: 1.2,
        }}>
          {agent.name}
        </p>
        <p style={{
          fontFamily: 'var(--sans)',
          fontWeight: 400,
          fontSize: 12,
          color: 'var(--text2)',
          margin: 0,
          lineHeight: 1.45,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}>
          {agent.tagline}
        </p>
        <span style={{
          display: 'inline-block',
          padding: '2px 9px',
          borderRadius: 20,
          background: 'var(--surface2)',
          color: 'var(--text3)',
          fontFamily: 'var(--display)',
          fontWeight: 600,
          fontSize: 10,
          letterSpacing: '0.03em',
          marginTop: 2,
        }}>
          {categoryLabel(agent.category)}
        </span>
      </div>

      <div style={{ flex: 1, minHeight: 12 }} />

      <div style={{
        padding: '11px 16px 14px',
        borderTop: '1px solid var(--border)',
        marginTop: 4,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
      }}>
        {activated ? (
          <>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              padding: '5px 10px',
              borderRadius: 20,
              background: 'rgba(22,163,74,0.1)',
              color: '#16a34a',
              fontFamily: 'var(--display)',
              fontWeight: 600,
              fontSize: 11.5,
            }}>
              {isIncluded ? 'Included' : 'Active'}
            </span>
            <button
              onClick={handleConfigure}
              style={{
                background: 'none',
                border: 'none',
                padding: 0,
                fontFamily: 'var(--display)',
                fontWeight: 600,
                fontSize: 12.5,
                color: 'var(--primary-80)',
                cursor: 'pointer',
                marginLeft: 'auto',
              }}
            >
              Configure →
            </button>
          </>
        ) : (
          <button
            onClick={handleActivate}
            style={{
              width: '100%',
              padding: '7px 0',
              borderRadius: 'var(--radius-button, 8px)',
              border: '1px solid var(--primary-80)',
              background: 'var(--primary-80)',
              color: 'white',
              fontFamily: 'var(--display)',
              fontWeight: 600,
              fontSize: 12.5,
              cursor: 'pointer',
              transition: 'opacity 150ms ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.88'; }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
          >
            Activate
          </button>
        )}
      </div>
    </div>
  );
}
