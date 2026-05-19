'use client';

import { useState, useCallback } from 'react';
import { useAgentStore } from '@/contexts/AgentStoreContext';
import type { AgentConnector, AgentDataPermission } from '@/lib/types';

// ── Shared helpers ────────────────────────────────────────────────────────────

function initials(name: string) {
  return name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
}

// ── Section wrapper ────────────────────────────────────────────────────────────

function Section({ title, children, note }: { title: string; children: React.ReactNode; note?: string }) {
  return (
    <section>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        paddingBottom: 12,
        marginBottom: 16,
        borderBottom: '1px solid var(--border)',
      }}>
        <h2 style={{
          fontFamily: 'var(--display)',
          fontWeight: 700,
          fontSize: 17,
          color: 'var(--text)',
          margin: 0,
        }}>
          {title}
        </h2>
      </div>
      {children}
      {note && (
        <p style={{
          fontFamily: 'var(--sans)',
          fontSize: 12,
          color: 'var(--text3)',
          margin: '10px 0 0',
          fontStyle: 'italic',
        }}>
          {note}
        </p>
      )}
    </section>
  );
}

// ── Toggle (mirrors UserPreferencesView) ──────────────────────────────────────

interface ToggleProps {
  checked: boolean;
  disabled?: boolean;
  onChange: (v: boolean) => void;
}

function Toggle({ checked, disabled = false, onChange }: ToggleProps) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      style={{
        flexShrink: 0,
        width: 44,
        height: 24,
        borderRadius: 12,
        border: 'none',
        cursor: disabled ? 'not-allowed' : 'pointer',
        background: checked ? '#16a34a' : 'var(--border2, #d1d5db)',
        opacity: disabled ? 0.45 : 1,
        position: 'relative',
        transition: 'background 200ms ease',
        padding: 0,
      }}
    >
      <span style={{
        position: 'absolute',
        top: 4,
        left: checked ? 23 : 4,
        width: 16,
        height: 16,
        borderRadius: '50%',
        background: 'white',
        boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
        transition: 'left 200ms ease',
      }} />
    </button>
  );
}

// ── Toast ─────────────────────────────────────────────────────────────────────

function Toast({ message, visible }: { message: string; visible: boolean }) {
  return (
    <div style={{
      position: 'fixed',
      bottom: 28,
      right: 32,
      zIndex: 200,
      background: '#1a1a2e',
      color: 'white',
      fontFamily: 'var(--display)',
      fontWeight: 500,
      fontSize: 13,
      padding: '10px 18px',
      borderRadius: 8,
      boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(8px)',
      transition: 'opacity 200ms ease, transform 200ms ease',
      pointerEvents: 'none',
    }}>
      {message}
    </div>
  );
}

// ── Data Permissions (editable) ───────────────────────────────────────────────

interface EditablePermissionsProps {
  permissions: AgentDataPermission[];
}

function EditablePermissions({ permissions }: EditablePermissionsProps) {
  const [optionalEnabled, setOptionalEnabled] = useState<Set<string>>(
    () => new Set(permissions.filter((p) => !p.required).map((p) => p.id))
  );
  const [flashingId, setFlashingId] = useState<string | null>(null);

  function handleToggle(permId: string) {
    setOptionalEnabled((prev) => {
      const next = new Set(prev);
      if (next.has(permId)) {
        next.delete(permId);
      } else {
        next.add(permId);
      }
      return next;
    });
    setFlashingId(permId);
    setTimeout(() => setFlashingId(null), 600);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {permissions.map((perm, i) => {
        const isOn = perm.required || optionalEnabled.has(perm.id);
        const isFlashing = flashingId === perm.id;

        return (
          <div
            key={perm.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '13px 16px',
              background: isFlashing
                ? 'rgba(22,163,74,0.08)'
                : i % 2 === 0 ? 'var(--surface)' : 'var(--surface2)',
              borderBottom: i < permissions.length - 1 ? '1px solid var(--border)' : 'none',
              borderRadius: i === 0 ? '8px 8px 0 0' : i === permissions.length - 1 ? '0 0 8px 8px' : 0,
              transition: 'background 300ms ease',
            }}
          >
            {/* Icon */}
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
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                <p style={{ fontFamily: 'var(--display)', fontWeight: 600, fontSize: 13, color: 'var(--text)', margin: 0 }}>
                  {perm.name}
                </p>
                {perm.required && (
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
                )}
              </div>
              <p style={{ fontFamily: 'var(--sans)', fontSize: 12, color: 'var(--text3)', margin: 0, lineHeight: 1.4 }}>
                {perm.description}
              </p>
            </div>

            {/* Toggle — required: locked ON; optional: freely togglable */}
            <div
              title={perm.required ? 'This permission is required for the agent to function' : undefined}
              style={{ flexShrink: 0 }}
            >
              <Toggle
                checked={isOn}
                disabled={perm.required}
                onChange={() => handleToggle(perm.id)}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Connectors (editable with async connect) ──────────────────────────────────

interface ConnectorStatus {
  [id: string]: AgentConnector['status'];
}

interface ConnectorsEditableProps {
  connectors: AgentConnector[];
  agentName: string;
  onToast: (msg: string) => void;
}

function ConnectorsEditable({ connectors, agentName, onToast }: ConnectorsEditableProps) {
  const [statuses, setStatuses] = useState<ConnectorStatus>(
    () => Object.fromEntries(connectors.map((c) => [c.id, c.status]))
  );
  const [connecting, setConnecting] = useState<string | null>(null);

  function handleConnect(conn: AgentConnector) {
    if (connecting) return;
    setConnecting(conn.id);
    setTimeout(() => {
      setStatuses((prev) => ({ ...prev, [conn.id]: 'connected' }));
      setConnecting(null);
      onToast(`${conn.name} enabled for ${agentName}`);
    }, 1500);
  }

  function handleDisconnect(conn: AgentConnector) {
    setStatuses((prev) => ({ ...prev, [conn.id]: 'available' }));
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {connectors.map((conn) => {
        const status = statuses[conn.id];
        const isConnecting = connecting === conn.id;
        const isInternal = conn.type === 'internal' || conn.type === 'erp';
        const dotColor = status === 'connected' ? '#16a34a' : status === 'unavailable' ? '#ef4444' : 'var(--text3)';
        const dotLabel = status === 'connected' ? 'Connected' : status === 'unavailable' ? 'Not available' : 'Available';

        return (
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
            {/* Icon */}
            <div style={{
              width: 36, height: 36, borderRadius: 8,
              background: 'var(--surface2)', border: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M3 8h10M8 3l5 5-5 5" stroke="var(--text3)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>

            {/* Name + description */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                <p style={{ fontFamily: 'var(--display)', fontWeight: 600, fontSize: 13.5, color: 'var(--text)', margin: 0 }}>
                  {conn.name}
                </p>
                <span style={{
                  padding: '2px 7px', borderRadius: 20,
                  background: isInternal ? 'rgba(59,130,246,0.1)' : 'var(--surface2)',
                  color: isInternal ? '#2563eb' : 'var(--text3)',
                  fontFamily: 'var(--display)', fontWeight: 600, fontSize: 10,
                  letterSpacing: '0.02em', whiteSpace: 'nowrap',
                }}>
                  {isInternal ? 'Internal' : 'External'}
                </span>
              </div>
              <p style={{ fontFamily: 'var(--sans)', fontSize: 12, color: 'var(--text2)', margin: 0, lineHeight: 1.4 }}>
                {conn.description}
              </p>
            </div>

            {/* Status + action */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
              {/* Status dot + label */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: dotColor, flexShrink: 0 }} />
                <span style={{
                  fontFamily: 'var(--sans)', fontSize: 11.5, fontWeight: 500,
                  color: status === 'connected' ? '#16a34a' : status === 'unavailable' ? '#ef4444' : 'var(--text3)',
                }}>
                  {dotLabel}
                </span>
              </div>

              {/* Action button */}
              {status === 'available' && (
                <button
                  onClick={() => handleConnect(conn)}
                  disabled={!!connecting}
                  style={{
                    padding: '5px 12px',
                    borderRadius: 6,
                    border: '1px solid var(--primary-80)',
                    background: 'transparent',
                    color: 'var(--primary-80)',
                    fontFamily: 'var(--display)',
                    fontWeight: 600,
                    fontSize: 11.5,
                    cursor: connecting ? 'default' : 'pointer',
                    whiteSpace: 'nowrap',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                    opacity: connecting && !isConnecting ? 0.5 : 1,
                    transition: 'opacity 150ms ease',
                  }}
                >
                  {isConnecting ? (
                    <>
                      <svg width="12" height="12" viewBox="0 0 12 12" style={{ animation: 'spin 0.7s linear infinite', flexShrink: 0 }}>
                        <circle cx="6" cy="6" r="4.5" stroke="var(--primary-80)" strokeWidth="1.5" fill="none" strokeDasharray="20" strokeDashoffset="7" />
                      </svg>
                      Connecting...
                    </>
                  ) : 'Connect'}
                </button>
              )}
              {status === 'connected' && (
                <button
                  onClick={() => handleDisconnect(conn)}
                  style={{
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
                    transition: 'border-color 150ms ease, color 150ms ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#ef4444';
                    e.currentTarget.style.color = '#ef4444';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border)';
                    e.currentTarget.style.color = 'var(--text3)';
                  }}
                >
                  Disconnect
                </button>
              )}
              {status === 'unavailable' && (
                <span style={{
                  fontFamily: 'var(--display)',
                  fontWeight: 500,
                  fontSize: 11.5,
                  color: 'var(--text3)',
                }}>
                  Coming Soon
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Agent Permissions section ─────────────────────────────────────────────────

const AGENT_PERMISSION_DEFAULTS: Array<{ id: string; label: string; description: string; default: boolean; warning?: boolean }> = [
  { id: 'ap-create',   label: 'Create tasks and records',             description: 'Agent can create new tasks, notes, and records in WizOrder.',                    default: true  },
  { id: 'ap-notify',  label: 'Send notifications to customers',       description: 'Agent can send email or in-app notifications to customers on your behalf.',       default: false },
  { id: 'ap-finance', label: 'Access financial data',                 description: 'Agent can read invoices, payment history, and financial summaries.',               default: false },
  { id: 'ap-modify',  label: 'Modify existing records',               description: 'Agent can update orders, contacts, and other existing data.',                     default: true  },
  { id: 'ap-auto',    label: 'Execute actions without confirmation',   description: 'Agent will act autonomously without asking for your approval first.',             default: false, warning: true },
];

interface AgentPermissionsProps {
  agentIncluded: boolean;
}

function AgentPermissionsSection({ agentIncluded }: AgentPermissionsProps) {
  const [perms, setPerms] = useState<Record<string, boolean>>(
    () => Object.fromEntries(AGENT_PERMISSION_DEFAULTS.map((p) => [p.id, p.default]))
  );
  const [showWarningFor, setShowWarningFor] = useState<string | null>(null);

  function handleChange(id: string, val: boolean, hasWarning?: boolean) {
    if (val && hasWarning) {
      setShowWarningFor(id);
      return;
    }
    setPerms((prev) => ({ ...prev, [id]: val }));
    setShowWarningFor(null);
  }

  return (
    <div>
      {AGENT_PERMISSION_DEFAULTS.map((perm, i) => (
        <div
          key={perm.id}
          style={{
            padding: '12px 0',
            borderBottom: i < AGENT_PERMISSION_DEFAULTS.length - 1 ? '1px solid var(--border)' : 'none',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 20 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{
                fontFamily: 'var(--display)',
                fontWeight: 600,
                fontSize: 13.5,
                color: 'var(--text)',
                margin: '0 0 3px',
              }}>
                {perm.label}
              </p>
              <p style={{
                fontFamily: 'var(--sans)',
                fontSize: 12,
                color: 'var(--text2)',
                margin: 0,
                lineHeight: 1.5,
                maxWidth: 480,
              }}>
                {perm.description}
              </p>
            </div>
            <Toggle
              checked={perms[perm.id]}
              disabled={agentIncluded}
              onChange={(v) => handleChange(perm.id, v, perm.warning)}
            />
          </div>

          {/* Warning banner for "Execute without confirmation" */}
          {showWarningFor === perm.id && (
            <div style={{
              marginTop: 10,
              padding: '10px 14px',
              background: 'rgba(239,68,68,0.06)',
              border: '1px solid rgba(239,68,68,0.25)',
              borderRadius: 8,
              display: 'flex',
              alignItems: 'flex-start',
              gap: 10,
            }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, marginTop: 1 }}>
                <path d="M8 2L14 13H2L8 2Z" stroke="#ef4444" strokeWidth="1.4" strokeLinejoin="round" />
                <path d="M8 7v3" stroke="#ef4444" strokeWidth="1.4" strokeLinecap="round" />
                <circle cx="8" cy="11.5" r="0.75" fill="#ef4444" />
              </svg>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontFamily: 'var(--sans)', fontSize: 12, color: 'var(--text2)', margin: '0 0 10px', lineHeight: 1.5 }}>
                  This allows the agent to execute actions without asking for your confirmation. Are you sure?
                </p>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => { setPerms((p) => ({ ...p, [perm.id]: true })); setShowWarningFor(null); }}
                    style={{
                      padding: '5px 14px', background: '#ef4444', color: 'white', border: 'none',
                      borderRadius: 6, fontFamily: 'var(--display)', fontWeight: 600, fontSize: 12, cursor: 'pointer',
                    }}
                  >
                    Confirm
                  </button>
                  <button
                    onClick={() => setShowWarningFor(null)}
                    style={{
                      padding: '5px 14px', background: 'var(--surface2)', color: 'var(--text2)',
                      border: '1px solid var(--border)', borderRadius: 6,
                      fontFamily: 'var(--display)', fontWeight: 600, fontSize: 12, cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Deactivate confirmation modal ─────────────────────────────────────────────

interface DeactivateModalProps {
  agentName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

function DeactivateModal({ agentName, onConfirm, onCancel }: DeactivateModalProps) {
  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onCancel}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.25)',
          zIndex: 100,
        }}
      />
      {/* Dialog */}
      <div style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 101,
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 12,
        padding: '28px 32px',
        width: 400,
        maxWidth: 'calc(100vw - 48px)',
        boxShadow: '0 20px 60px rgba(0,0,0,0.18)',
      }}>
        <h3 style={{
          fontFamily: 'var(--display)',
          fontWeight: 700,
          fontSize: 16,
          color: 'var(--text)',
          margin: '0 0 10px',
        }}>
          Deactivate {agentName}?
        </h3>
        <p style={{
          fontFamily: 'var(--sans)',
          fontSize: 13,
          color: 'var(--text2)',
          margin: '0 0 24px',
          lineHeight: 1.6,
        }}>
          Are you sure? This will disable <strong>{agentName}</strong> and its capabilities.
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button
            onClick={onCancel}
            style={{
              padding: '9px 20px',
              borderRadius: 8,
              border: '1px solid var(--border)',
              background: 'var(--surface2)',
              color: 'var(--text2)',
              fontFamily: 'var(--display)',
              fontWeight: 600,
              fontSize: 13,
              cursor: 'pointer',
              transition: 'border-color 150ms ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--text3)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            style={{
              padding: '9px 20px',
              borderRadius: 8,
              border: 'none',
              background: '#ef4444',
              color: 'white',
              fontFamily: 'var(--display)',
              fontWeight: 700,
              fontSize: 13,
              cursor: 'pointer',
              transition: 'opacity 150ms ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.88'; }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
          >
            Deactivate
          </button>
        </div>
      </div>
    </>
  );
}

// ── Main view ──────────────────────────────────────────────────────────────────

export default function MyAgentConfigView() {
  const { agents, selectedAgentId, deactivateAgent, setAgentStoreView } = useAgentStore();
  const agent = agents.find((a) => a.id === selectedAgentId);

  const [toastMsg, setToastMsg] = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);

  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 2800);
  }, []);

  function handleDeactivateConfirm() {
    if (!agent) return;
    setShowDeactivateModal(false);
    deactivateAgent(agent.id);
    setAgentStoreView('my-agents');
    showToast(`${agent.name} has been deactivated`);
  }

  if (!agent) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: 'var(--text3)', fontFamily: 'var(--sans)', fontSize: 14 }}>
        Agent not found.{' '}
        <button
          onClick={() => setAgentStoreView('my-agents')}
          style={{ background: 'none', border: 'none', color: 'var(--primary-80)', cursor: 'pointer', fontFamily: 'var(--display)', fontWeight: 600 }}
        >
          Back to My Agents
        </button>
      </div>
    );
  }

  const isIncluded = agent.status === 'included';

  return (
    <>
      <div style={{ paddingBottom: 60 }}>
        {/* Back link */}
        <div style={{ padding: '16px 40px 0' }}>
          <button
            onClick={() => setAgentStoreView('my-agents')}
            style={{
              background: 'none', border: 'none', padding: 0,
              fontFamily: 'var(--display)', fontWeight: 600, fontSize: 13,
              color: 'var(--text2)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 4,
              transition: 'color 150ms ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text2)'; }}
          >
            ← Back to My Agents
          </button>
        </div>

        {/* Color banner */}
        <div style={{
          height: 80,
          background: agent.color,
          marginTop: 16,
          backgroundImage: `linear-gradient(150deg, ${agent.color}ee 0%, ${agent.color} 100%)`,
        }} />

        {/* Hero */}
        <div style={{ padding: '0 40px', marginTop: -60 }}>
          {/* Avatar */}
          <div style={{
            width: 120, height: 120, borderRadius: '50%',
            background: 'var(--surface)', border: '5px solid var(--surface)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 20px rgba(0,0,0,0.14)',
            overflow: 'hidden', marginBottom: 16,
          }}>
            <div style={{
              width: '100%', height: '100%', borderRadius: '50%',
              background: agent.color,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{
                fontFamily: 'var(--display)', fontWeight: 800, fontSize: 36,
                color: 'white', lineHeight: 1, userSelect: 'none', letterSpacing: '-1px',
              }}>
                {initials(agent.name)}
              </span>
            </div>
          </div>

          {/* Identity row */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <h1 style={{
                fontFamily: 'var(--display)', fontWeight: 800, fontSize: 24,
                color: 'var(--text)', margin: '0 0 6px',
              }}>
                {agent.name}
              </h1>
              <p style={{
                fontFamily: 'var(--sans)', fontSize: 14, color: 'var(--text2)',
                margin: '0 0 10px', lineHeight: 1.5,
              }}>
                {agent.tagline}
              </p>
              {/* Badges */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{
                  padding: '3px 10px', borderRadius: 20,
                  background: 'rgba(22,163,74,0.1)', color: '#16a34a',
                  fontFamily: 'var(--display)', fontWeight: 600, fontSize: 11,
                }}>
                  Active
                </span>
                <span style={{
                  fontFamily: 'var(--sans)', fontSize: 12, color: 'var(--text3)',
                }}>
                  Activated on April 28, 2026
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Body sections */}
        <div style={{ padding: '36px 40px 0', display: 'flex', flexDirection: 'column', gap: 28 }}>

          {/* About */}
          <Section title="About">
            <div style={{
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 10, padding: '18px 22px', maxWidth: 700,
            }}>
              <p style={{ fontFamily: 'var(--sans)', fontSize: 14, color: 'var(--text2)', margin: 0, lineHeight: 1.7 }}>
                {agent.description}
              </p>
            </div>
          </Section>

          {/* Data Permissions — editable */}
          {agent.dataPermissions.length > 0 && (
            <Section title="Data Permissions" note="Changes take effect immediately">
              <EditablePermissions permissions={agent.dataPermissions} />
            </Section>
          )}

          {/* Connectors — editable */}
          {agent.connectors.length > 0 && (
            <Section title="Connectors">
              <ConnectorsEditable
                connectors={agent.connectors}
                agentName={agent.name}
                onToast={showToast}
              />
            </Section>
          )}

          {/* Agent Permissions */}
          <Section title="Agent Permissions">
            <AgentPermissionsSection agentIncluded={isIncluded} />
            {isIncluded && (
              <p style={{
                fontFamily: 'var(--sans)', fontSize: 12, color: 'var(--text3)',
                margin: '10px 0 0', fontStyle: 'italic',
              }}>
                Permissions for included agents are managed by WizCommerce.
              </p>
            )}
          </Section>

          {/* Deactivate */}
          <div style={{ marginTop: 4 }}>
            <div
              title={isIncluded ? 'Included agents cannot be deactivated' : undefined}
              style={{ display: 'inline-block', width: '100%' }}
            >
              <button
                onClick={() => !isIncluded && setShowDeactivateModal(true)}
                disabled={isIncluded}
                style={{
                  width: '100%',
                  padding: '12px 0',
                  borderRadius: 'var(--radius-button, 8px)',
                  border: `1px solid ${isIncluded ? 'var(--border)' : '#ef4444'}`,
                  background: 'transparent',
                  color: isIncluded ? 'var(--text3)' : '#ef4444',
                  fontFamily: 'var(--display)',
                  fontWeight: 700,
                  fontSize: 14,
                  cursor: isIncluded ? 'not-allowed' : 'pointer',
                  transition: 'background 150ms ease, color 150ms ease',
                }}
                onMouseEnter={(e) => {
                  if (!isIncluded) {
                    e.currentTarget.style.background = '#ef4444';
                    e.currentTarget.style.color = 'white';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isIncluded) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = '#ef4444';
                  }
                }}
              >
                Deactivate Agent
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Deactivate confirmation modal */}
      {showDeactivateModal && (
        <DeactivateModal
          agentName={agent.name}
          onConfirm={handleDeactivateConfirm}
          onCancel={() => setShowDeactivateModal(false)}
        />
      )}

      {/* Toast */}
      <Toast message={toastMsg} visible={toastVisible} />
    </>
  );
}
