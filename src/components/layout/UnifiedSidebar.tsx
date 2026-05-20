'use client';

import { useState, useRef, useEffect } from 'react';
import { useLayout } from '@/contexts/LayoutContext';
import { useConversation } from '@/contexts/ConversationContext';
import { useChatSession } from '@/contexts/ChatSessionContext';
import { useAgentStore } from '@/contexts/AgentStoreContext';
import type { ViewRoute } from '@/lib/types';

// ── Types ────────────────────────────────────────────────────────────────────

interface NavItem {
  kind: 'item';
  icon: string;
  label: string;
  route: ViewRoute;
  onClick?: () => void;
}

interface NavGroup {
  kind: 'group';
  id: string;
  icon: string;
  label: string;
  children: NavItem[];
  defaultOpen?: boolean;
}

type NavEntry = NavItem | NavGroup;

interface NavSection {
  label: string;
  icon?: string;
  entries: NavEntry[];
}

// ── Flat NavRow ───────────────────────────────────────────────────────────────

function NavRow({
  icon,
  label,
  isActive,
  collapsed,
  indented,
  onClick,
  onMouseEnter,
  onMouseLeave,
}: {
  icon: string;
  label: string;
  isActive: boolean;
  collapsed: boolean;
  indented?: boolean;
  onClick: () => void;
  onMouseEnter?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  onMouseLeave?: (e: React.MouseEvent<HTMLButtonElement>) => void;
}) {
  return (
    <button
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      title={collapsed ? label : undefined}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: collapsed ? 0 : 9,
        width: '100%',
        padding: collapsed ? '7px 0' : `7px 10px 7px ${indented ? 26 : 10}px`,
        justifyContent: collapsed ? 'center' : 'flex-start',
        background: isActive ? 'var(--surface2)' : 'transparent',
        borderLeft: isActive ? '3px solid var(--primary-80)' : '3px solid transparent',
        borderRight: 'none',
        borderTop: 'none',
        borderBottom: 'none',
        borderRadius: '0 6px 6px 0',
        marginRight: 8,
        fontFamily: 'var(--display)',
        fontWeight: isActive ? 600 : 500,
        fontSize: indented ? 12.5 : 13,
        color: isActive ? 'var(--text)' : 'var(--text2)',
        cursor: 'pointer',
        transition: 'background 120ms ease, color 120ms ease',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textAlign: 'left',
      }}
      onMouseOver={(e) => {
        if (!isActive) {
          e.currentTarget.style.background = 'var(--surface2)';
          e.currentTarget.style.color = 'var(--text)';
        }
      }}
      onMouseOut={(e) => {
        if (!isActive) {
          e.currentTarget.style.background = 'transparent';
          e.currentTarget.style.color = 'var(--text2)';
        }
      }}
    >
      <span
        style={{
          fontSize: 14,
          lineHeight: 1,
          flexShrink: 0,
          color: isActive ? 'var(--primary-80)' : 'var(--text3)',
        }}
      >
        {icon}
      </span>
      {!collapsed && (
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</span>
      )}
    </button>
  );
}

// ── Group line-head (expanded) ───────────────────────────────────────────────

function GroupHead({
  icon,
  label,
  open,
  onToggle,
}: {
  icon: string;
  label: string;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 9,
        width: '100%',
        padding: '7px 10px',
        background: 'transparent',
        border: 'none',
        borderLeft: '3px solid transparent',
        borderRadius: '0 6px 6px 0',
        marginRight: 8,
        fontFamily: 'var(--display)',
        fontWeight: 600,
        fontSize: 13,
        color: 'var(--text2)',
        cursor: 'pointer',
        transition: 'background 120ms ease, color 120ms ease',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textAlign: 'left',
      }}
      onMouseOver={(e) => {
        e.currentTarget.style.background = 'var(--surface2)';
        e.currentTarget.style.color = 'var(--text)';
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.background = 'transparent';
        e.currentTarget.style.color = 'var(--text2)';
      }}
    >
      <span style={{ fontSize: 14, lineHeight: 1, flexShrink: 0, color: 'var(--text3)' }}>
        {icon}
      </span>
      <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</span>
      <svg
        width="10"
        height="10"
        viewBox="0 0 10 10"
        style={{
          flexShrink: 0,
          transition: 'transform 180ms ease',
          transform: open ? 'rotate(90deg)' : 'rotate(0deg)',
          color: 'var(--text3)',
        }}
      >
        <path d="M3 2L7 5L3 8" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}

// ── Collapsed group icon + flyout ────────────────────────────────────────────

function CollapsedGroup({
  group,
  isAnyChildActive,
  onItemClick,
}: {
  group: NavGroup;
  isAnyChildActive: boolean;
  onItemClick: (item: NavItem) => void;
}) {
  const [open, setOpen] = useState(false);
  const [anchorRect, setAnchorRect] = useState<{ top: number; left: number } | null>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const anchorRef = useRef<HTMLDivElement>(null);

  function clearCloseTimer() {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }
  function scheduleClose() {
    clearCloseTimer();
    closeTimerRef.current = setTimeout(() => setOpen(false), 150);
  }

  function openFlyout() {
    clearCloseTimer();
    if (anchorRef.current) {
      const r = anchorRef.current.getBoundingClientRect();
      setAnchorRect({ top: r.top, left: r.right });
    }
    setOpen(true);
  }

  useEffect(() => () => clearCloseTimer(), []);

  return (
    <div
      ref={anchorRef}
      style={{ position: 'relative' }}
      onMouseEnter={openFlyout}
      onMouseLeave={scheduleClose}
    >
      <button
        title={group.label}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          padding: '7px 0',
          background: isAnyChildActive ? 'var(--surface2)' : 'transparent',
          borderLeft: isAnyChildActive ? '3px solid var(--primary-80)' : '3px solid transparent',
          borderRight: 'none',
          borderTop: 'none',
          borderBottom: 'none',
          borderRadius: '0 6px 6px 0',
          marginRight: 8,
          cursor: 'pointer',
          transition: 'background 120ms ease',
        }}
      >
        <span
          style={{
            fontSize: 14,
            lineHeight: 1,
            color: isAnyChildActive ? 'var(--primary-80)' : 'var(--text3)',
          }}
        >
          {group.icon}
        </span>
      </button>

      {open && anchorRect && (
        <div
          onMouseEnter={clearCloseTimer}
          onMouseLeave={scheduleClose}
          style={{
            position: 'fixed',
            top: anchorRect.top,
            left: anchorRect.left + 6,
            minWidth: 180,
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 8,
            boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
            padding: '6px 0',
            zIndex: 200,
          }}
        >
          <div
            style={{
              padding: '4px 12px 6px',
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.07em',
              textTransform: 'uppercase',
              color: 'var(--text3)',
              fontFamily: 'var(--display)',
              borderBottom: '1px solid var(--border)',
              marginBottom: 4,
            }}
          >
            {group.label}
          </div>
          {group.children.map((child) => (
            <button
              key={child.label}
              onClick={() => { setOpen(false); onItemClick(child); }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 9,
                width: '100%',
                padding: '7px 12px',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'var(--display)',
                fontWeight: 500,
                fontSize: 12.5,
                color: 'var(--text2)',
                textAlign: 'left',
                whiteSpace: 'nowrap',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = 'var(--surface2)';
                e.currentTarget.style.color = 'var(--text)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = 'var(--text2)';
              }}
            >
              <span style={{ fontSize: 13, lineHeight: 1, flexShrink: 0, color: 'var(--text3)' }}>
                {child.icon}
              </span>
              <span>{child.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Section divider ───────────────────────────────────────────────────────────

function SectionDivider({
  label,
  icon,
  collapsed,
  withTopRule,
}: {
  label: string;
  icon?: string;
  collapsed: boolean;
  withTopRule: boolean;
}) {
  return (
    <div
      style={{
        margin: withTopRule ? '12px 0 4px' : '4px 0 4px',
        borderTop: withTopRule ? '1px solid var(--border)' : 'none',
        paddingTop: withTopRule ? 10 : 0,
      }}
    >
      {collapsed ? (
        icon ? (
          <div
            title={label}
            style={{
              display: 'flex',
              justifyContent: 'center',
              padding: '4px 0',
              fontSize: 14,
              lineHeight: 1,
              background: 'linear-gradient(135deg, var(--primary-70), var(--ai-accent))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontWeight: 700,
            }}
          >
            {icon}
          </div>
        ) : null
      ) : (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            paddingLeft: 13,
            marginBottom: 4,
          }}
        >
          {icon && (
            <span
              style={{
                fontSize: 11,
                lineHeight: 1,
                background: 'linear-gradient(135deg, var(--primary-70), var(--ai-accent))',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                fontWeight: 800,
              }}
            >
              {icon}
            </span>
          )}
          <span
            style={{
              display: 'block',
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.07em',
              textTransform: 'uppercase',
              color: 'var(--text3)',
              fontFamily: 'var(--display)',
            }}
          >
            {label}
          </span>
        </div>
      )}
    </div>
  );
}

// ── Collapse toggle ───────────────────────────────────────────────────────────

function CollapseToggle({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        padding: '8px 0',
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
        color: 'var(--text3)',
        transition: 'color 150ms ease',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text2)')}
      onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text3)')}
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 14 14"
        fill="none"
        style={{
          transition: 'transform 250ms ease',
          transform: collapsed ? 'rotate(180deg)' : 'rotate(0deg)',
        }}
      >
        <path
          d="M9 2L4 7L9 12"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}

// ── UnifiedSidebar ────────────────────────────────────────────────────────────

export default function UnifiedSidebar() {
  const { currentView, setView, sidebarCollapsed, setSidebarCollapsed } = useLayout();
  const { clearMessages } = useConversation();
  const { requestSaveAndReset } = useChatSession();
  const { setAgentStoreView } = useAgentStore();

  const w = sidebarCollapsed ? 52 : 220;

  function nav(route: ViewRoute) {
    setView(route);
  }

  function newChat() {
    clearMessages();
    requestSaveAndReset();
  }

  function openKaiAddons() {
    setAgentStoreView('my-agents');
    setView('agent-store');
  }

  const SECTIONS: NavSection[] = [
    {
      label: 'WizOrder',
      entries: [
        { kind: 'item', icon: '📊', label: 'Dashboard', route: 'wizorder/dashboard' },
        { kind: 'item', icon: '📦', label: 'Products', route: 'wizorder/products' },
        { kind: 'item', icon: '📋', label: 'Orders', route: 'wizorder/orders' },
        { kind: 'item', icon: '👥', label: 'Customers', route: 'wizorder/customers' },
        { kind: 'item', icon: '✅', label: 'CRM', route: 'wizorder/crm' },
      ],
    },
    {
      label: 'Kai',
      icon: '✦',
      entries: [
        {
          kind: 'group',
          id: 'kai-chat',
          icon: '💬',
          label: 'Chat',
          defaultOpen: true,
          children: [
            { kind: 'item', icon: '✦', label: 'New Chat', route: 'chat', onClick: newChat },
            { kind: 'item', icon: '📜', label: 'History', route: 'history' },
          ],
        },
        { kind: 'item', icon: '📌', label: 'My Artifacts', route: 'artifacts' },
        { kind: 'item', icon: '📊', label: 'Reports & Dashboards', route: 'reports-dashboards' },
        { kind: 'item', icon: '📄', label: 'Knowledge Store', route: 'docs' },
        // { kind: 'item', icon: '🤖', label: 'Kai add-ons', route: 'agent-store', onClick: openKaiAddons },
        {
          kind: 'group',
          id: 'kai-user-prefs',
          icon: '👤',
          label: 'User Preferences',
          children: [
            { kind: 'item', icon: '✦', label: 'Configure Kai', route: 'admin/prefs' },
          ],
        },
        {
          kind: 'group',
          id: 'kai-admin',
          icon: '⚙️',
          label: 'Admin',
          children: [
            { kind: 'item', icon: '⚙️', label: 'Settings', route: 'settings' },
            { kind: 'item', icon: '📊', label: 'Analytics', route: 'admin/dashboard' },
            // { kind: 'item', icon: '🔧', label: 'Models', route: 'admin/models' },
          ],
        },
      ],
    },
  ];

  // Track which groups are open in expanded mode. Keyed by group id.
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    SECTIONS.forEach((s) => s.entries.forEach((e) => {
      if (e.kind === 'group') init[e.id] = e.defaultOpen ?? false;
    }));
    return init;
  });

  function isItemActive(item: NavItem): boolean {
    return currentView === item.route;
  }

  function handleItemClick(item: NavItem) {
    if (item.onClick) item.onClick();
    else nav(item.route);
  }

  return (
    <aside
      data-tour="sidebar"
      style={{
        width: w,
        transition: 'width 250ms ease',
        flexShrink: 0,
      }}
      className="flex flex-col fixed inset-y-0 left-0 z-50 bg-[var(--surface)] border-r border-[var(--border)] overflow-visible"
    >
      {/* Logo */}
      <button
        onClick={() => nav('wizorder/dashboard')}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: sidebarCollapsed ? 0 : 8,
          padding: sidebarCollapsed ? '18px 0' : '18px 16px',
          justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          flexShrink: 0,
          width: '100%',
        }}
        title={sidebarCollapsed ? 'WizCommerce' : undefined}
      >
        {sidebarCollapsed ? (
          <span
            style={{
              fontFamily: 'var(--display)',
              fontWeight: 700,
              fontSize: 14,
              color: 'var(--text)',
            }}
          >
            W
          </span>
        ) : (
          <span
            style={{
              fontFamily: 'var(--display)',
              fontWeight: 600,
              fontSize: 15,
              color: 'var(--text)',
              letterSpacing: '-0.2px',
              whiteSpace: 'nowrap',
            }}
          >
            WizCommerce
          </span>
        )}
      </button>

      {/* Nav sections */}
      <nav
        className="flex-1 overflow-y-auto overflow-x-visible"
        style={{ padding: sidebarCollapsed ? '0 4px' : '0 0' }}
      >
        {SECTIONS.map((section, si) => (
          <div key={section.label}>
            <SectionDivider
              label={section.label}
              icon={section.icon}
              collapsed={sidebarCollapsed}
              withTopRule={si > 0}
            />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {section.entries.map((entry) => {
                if (entry.kind === 'item') {
                  return (
                    <NavRow
                      key={entry.label}
                      icon={entry.icon}
                      label={entry.label}
                      isActive={isItemActive(entry)}
                      collapsed={sidebarCollapsed}
                      onClick={() => handleItemClick(entry)}
                    />
                  );
                }
                // group
                const anyChildActive = entry.children.some(isItemActive);
                if (sidebarCollapsed) {
                  return (
                    <CollapsedGroup
                      key={entry.id}
                      group={entry}
                      isAnyChildActive={anyChildActive}
                      onItemClick={handleItemClick}
                    />
                  );
                }
                const open = openGroups[entry.id] ?? false;
                return (
                  <div key={entry.id}>
                    <GroupHead
                      icon={entry.icon}
                      label={entry.label}
                      open={open}
                      onToggle={() => setOpenGroups((g) => ({ ...g, [entry.id]: !open }))}
                    />
                    {open && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        {entry.children.map((child) => (
                          <NavRow
                            key={child.label}
                            icon={child.icon}
                            label={child.label}
                            isActive={isItemActive(child)}
                            collapsed={false}
                            indented
                            onClick={() => handleItemClick(child)}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="shrink-0">
        <div className="mx-4 border-t border-[var(--border)]" />
        <CollapseToggle
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
        <div className="mx-4 border-t border-[var(--border)]" />
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: sidebarCollapsed ? '10px 0' : '10px 16px',
            gap: sidebarCollapsed ? 0 : 12,
            justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
          }}
        >
          <div
            style={{
              width: 30,
              height: 30,
              borderRadius: '50%',
              background: 'var(--primary-80)',
              color: 'white',
              fontSize: 11,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
            title={sidebarCollapsed ? 'Heman Bhullar — Admin' : undefined}
          >
            HB
          </div>
          {!sidebarCollapsed && (
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <p
                style={{
                  fontSize: 12,
                  fontWeight: 500,
                  color: 'var(--text)',
                  margin: 0,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  lineHeight: 1.3,
                }}
              >
                Heman Bhullar
              </p>
              <p
                style={{
                  fontSize: 11,
                  color: 'var(--text3)',
                  margin: 0,
                  lineHeight: 1.3,
                }}
              >
                Admin
              </p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
