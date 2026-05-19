'use client';

import type { AgentDataPermission } from '@/lib/types';

interface AgentPermissionsListProps {
  permissions: AgentDataPermission[];
  mode: 'read' | 'edit';
}

export default function AgentPermissionsList({ permissions, mode }: AgentPermissionsListProps) {
  return (
    <div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        {permissions.map((perm, i) => (
          <div
            key={perm.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '13px 16px',
              background: i % 2 === 0 ? 'var(--surface)' : 'var(--surface2)',
              borderBottom: i < permissions.length - 1 ? '1px solid var(--border)' : 'none',
              borderRadius: i === 0 ? '8px 8px 0 0' : i === permissions.length - 1 ? '0 0 8px 8px' : 0,
            }}
          >
            {/* Permission icon */}
            <div style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: perm.required ? 'rgba(245,158,11,0.1)' : 'var(--surface2)',
              border: `1px solid ${perm.required ? 'rgba(245,158,11,0.25)' : 'var(--border)'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <rect x="2" y="6" width="10" height="7" rx="1.5" stroke={perm.required ? '#f59e0b' : 'var(--text3)'} strokeWidth="1.2" />
                <path d="M4.5 6V4.5a2.5 2.5 0 015 0V6" stroke={perm.required ? '#f59e0b' : 'var(--text3)'} strokeWidth="1.2" strokeLinecap="round" />
              </svg>
            </div>

            {/* Name + description */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{
                fontFamily: 'var(--display)',
                fontWeight: 600,
                fontSize: 13,
                color: 'var(--text)',
                margin: '0 0 2px',
              }}>
                {perm.name}
              </p>
              <p style={{
                fontFamily: 'var(--sans)',
                fontSize: 12,
                color: 'var(--text3)',
                margin: 0,
                lineHeight: 1.4,
              }}>
                {perm.description}
              </p>
            </div>

            {/* Required/Optional badge + toggle */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
              {perm.required ? (
                <span style={{
                  padding: '2px 8px',
                  borderRadius: 20,
                  background: 'rgba(245,158,11,0.1)',
                  color: '#b45309',
                  fontFamily: 'var(--display)',
                  fontWeight: 600,
                  fontSize: 10.5,
                }}>
                  Required
                </span>
              ) : (
                <span style={{
                  padding: '2px 8px',
                  borderRadius: 20,
                  background: 'var(--surface2)',
                  color: 'var(--text3)',
                  fontFamily: 'var(--display)',
                  fontWeight: 600,
                  fontSize: 10.5,
                }}>
                  Optional
                </span>
              )}

              {/* Toggle (always locked in read mode) */}
              <div style={{
                position: 'relative',
                width: 36,
                height: 20,
                borderRadius: 10,
                background: perm.required ? '#16a34a' : 'var(--border)',
                cursor: mode === 'edit' && !perm.required ? 'pointer' : 'default',
                opacity: mode === 'read' ? 0.6 : 1,
                transition: 'background 150ms ease',
                flexShrink: 0,
              }}>
                <div style={{
                  position: 'absolute',
                  top: 2,
                  left: perm.required ? 18 : 2,
                  width: 16,
                  height: 16,
                  borderRadius: '50%',
                  background: 'white',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                  transition: 'left 150ms ease',
                }} />
                {perm.required && (
                  <svg
                    width="8"
                    height="10"
                    viewBox="0 0 8 10"
                    fill="none"
                    style={{ position: 'absolute', left: 5, top: 5 }}
                  >
                    <rect x="1" y="4" width="6" height="5" rx="1" fill="rgba(255,255,255,0.7)" />
                    <path d="M2.5 4V3a1.5 1.5 0 013 0v1" stroke="rgba(255,255,255,0.7)" strokeWidth="1" strokeLinecap="round" />
                  </svg>
                )}
              </div>
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
          Configure permissions after purchase in My Agents.
        </p>
      )}
    </div>
  );
}
