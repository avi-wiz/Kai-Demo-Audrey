'use client';

import type { AgentConnector } from '@/lib/types';

interface AgentConnectorsListProps {
  connectors: AgentConnector[];
  mode: 'read' | 'edit';
}

function StatusDot({ status }: { status: AgentConnector['status'] }) {
  const color =
    status === 'connected' ? '#16a34a' :
    status === 'available' ? 'var(--text3)' :
    '#ef4444';
  const label =
    status === 'connected' ? 'Connected' :
    status === 'available' ? 'Available' :
    'Not available';

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
      <div style={{
        width: 7,
        height: 7,
        borderRadius: '50%',
        background: color,
        flexShrink: 0,
      }} />
      <span style={{
        fontFamily: 'var(--sans)',
        fontSize: 11.5,
        color: status === 'connected' ? '#16a34a' : status === 'unavailable' ? '#ef4444' : 'var(--text3)',
        fontWeight: 500,
      }}>
        {label}
      </span>
    </div>
  );
}

function TypeBadge({ type }: { type: string }) {
  const isInternal = type === 'internal' || type === 'erp';
  return (
    <span style={{
      padding: '2px 7px',
      borderRadius: 20,
      background: isInternal ? 'rgba(59,130,246,0.1)' : 'var(--surface2)',
      color: isInternal ? '#2563eb' : 'var(--text3)',
      fontFamily: 'var(--display)',
      fontWeight: 600,
      fontSize: 10,
      letterSpacing: '0.02em',
      whiteSpace: 'nowrap',
    }}>
      {isInternal ? 'Internal' : 'External'}
    </span>
  );
}

export default function AgentConnectorsList({ connectors, mode }: AgentConnectorsListProps) {
  return (
    <div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {connectors.map((conn) => (
          <div
            key={conn.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              padding: '14px 16px',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 10,
            }}
          >
            {/* Connector icon */}
            <div style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              background: 'var(--surface2)',
              border: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M3 8h10M8 3l5 5-5 5" stroke="var(--text3)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>

            {/* Name + description */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                <p style={{
                  fontFamily: 'var(--display)',
                  fontWeight: 600,
                  fontSize: 13.5,
                  color: 'var(--text)',
                  margin: 0,
                }}>
                  {conn.name}
                </p>
                <TypeBadge type={conn.type} />
              </div>
              <p style={{
                fontFamily: 'var(--sans)',
                fontSize: 12,
                color: 'var(--text2)',
                margin: 0,
                lineHeight: 1.4,
              }}>
                {conn.description}
              </p>
            </div>

            {/* Status + optional action */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
              <StatusDot status={conn.status} />
              {mode === 'edit' && conn.status === 'available' && (
                <button style={{
                  padding: '5px 12px',
                  borderRadius: 6,
                  border: '1px solid var(--primary-80)',
                  background: 'transparent',
                  color: 'var(--primary-80)',
                  fontFamily: 'var(--display)',
                  fontWeight: 600,
                  fontSize: 11.5,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}>
                  Connect
                </button>
              )}
              {mode === 'edit' && conn.status === 'connected' && (
                <button style={{
                  padding: '5px 12px',
                  borderRadius: 6,
                  border: '1px solid var(--border)',
                  background: 'transparent',
                  color: 'var(--text3)',
                  fontFamily: 'var(--display)',
                  fontWeight: 600,
                  fontSize: 11.5,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}>
                  Disconnect
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {mode === 'read' && (
        <p style={{
          fontFamily: 'var(--sans)',
          fontSize: 12,
          color: 'var(--text3)',
          margin: '10px 0 0',
          fontStyle: 'italic',
        }}>
          Enable connectors after purchase in My Agents.
        </p>
      )}
    </div>
  );
}
