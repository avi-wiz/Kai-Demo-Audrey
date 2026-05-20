'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
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
  children: NavEntry[];
}

type NavEntry = NavItem | NavGroup;

// ── Icon dispatch ─────────────────────────────────────────────────────────────

const SVG_ICON_MAP: Record<string, { outline: string; filled: string }> = {
  'svg:home': { outline: '/icons/menu_icons/home.svg', filled: '/icons/menu_icons/home_filled.svg' },
  'svg:products': { outline: '/icons/menu_icons/products.svg', filled: '/icons/menu_icons/products_filled.svg' },
  'svg:sales': { outline: '/icons/menu_icons/sales.svg', filled: '/icons/menu_icons/sales_filled.svg' },
  'svg:buyer': { outline: '/icons/menu_icons/buyer.svg', filled: '/icons/menu_icons/buyer_filled.svg' },
};

// Stroke color for inline glyphs. Active = white (sits inside the green pill);
// inactive = muted text. Glyphs are stroke-only — no soft active fill anymore.
function glyphColor(active: boolean) {
  return active ? '#FFFFFF' : 'var(--text3)';
}

function DashboardGlyph({ active }: { active: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={glyphColor(active)} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 4m0 2a2 2 0 0 1 2 -2h2a2 2 0 0 1 2 2v1a2 2 0 0 1 -2 2h-2a2 2 0 0 1 -2 -2z" />
      <path d="M4 13m0 2a2 2 0 0 1 2 -2h2a2 2 0 0 1 2 2v3a2 2 0 0 1 -2 2h-2a2 2 0 0 1 -2 -2z" />
      <path d="M14 4m0 2a2 2 0 0 1 2 -2h2a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-2a2 2 0 0 1 -2 -2z" />
    </svg>
  );
}

function ProductsGlyph({ active }: { active: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={glyphColor(active)} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M13 5h8" />
      <path d="M13 9h5" />
      <path d="M13 15h8" />
      <path d="M13 19h5" />
      <path d="M3 4m0 1a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v4a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1z" />
      <path d="M3 14m0 1a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v4a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1z" />
    </svg>
  );
}

function OrdersGlyph({ active }: { active: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={glyphColor(active)} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M14 3v4a1 1 0 0 0 1 1h4" />
      <path d="M17 21h-10a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2h7l5 5v11a2 2 0 0 1 -2 2z" />
      <path d="M9 17h6" />
      <path d="M9 13h6" />
    </svg>
  );
}

function CustomersGlyph({ active }: { active: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={glyphColor(active)} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M8 7a4 4 0 1 0 8 0a4 4 0 0 0 -8 0" />
      <path d="M6 21v-2a4 4 0 0 1 4 -4h4a4 4 0 0 1 4 4v2" />
    </svg>
  );
}

function CrmGlyph({ active }: { active: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={glyphColor(active)} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M19.5 12.572l-7.5 7.428l-7.5 -7.428a5 5 0 1 1 7.5 -6.566a5 5 0 1 1 7.5 6.572" />
      <path d="M12 6l-3.293 3.293a1 1 0 0 0 0 1.414l.543 .543c.69 .69 1.81 .69 2.5 0l1 -1a3.182 3.182 0 0 1 4.5 0l2.25 2.25" />
      <path d="M12.5 15.5l2 2" />
      <path d="M15 13l2 2" />
    </svg>
  );
}

function LogoutGlyph({ active }: { active: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={glyphColor(active)} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M14 8v-2a2 2 0 0 0 -2 -2h-7a2 2 0 0 0 -2 2v12a2 2 0 0 0 2 2h7a2 2 0 0 0 2 -2v-2" />
      <path d="M9 12h12l-3 -3" />
      <path d="M18 15l3 -3" />
    </svg>
  );
}

function KaiSparkleIcon({ active }: { active: boolean }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 20,
        height: 20,
        fontFamily: 'var(--display)',
        fontWeight: 800,
        fontSize: 28,
        lineHeight: 1,
        overflow: 'visible',
        color: active ? '#FFFFFF' : 'var(--primary-70)',
      }}
    >
      ✦
    </span>
  );
}

function NavIcon({ icon, isActive }: { icon: string; isActive: boolean }) {
  if (icon === 'svg:dashboard') return <DashboardGlyph active={isActive} />;
  if (icon === 'svg:products') return <ProductsGlyph active={isActive} />;
  if (icon === 'svg:orders') return <OrdersGlyph active={isActive} />;
  if (icon === 'svg:customers') return <CustomersGlyph active={isActive} />;
  if (icon === 'svg:crm') return <CrmGlyph active={isActive} />;
  if (icon === 'svg:logout') return <LogoutGlyph active={isActive} />;
  if (icon === 'svg:kai') return <KaiSparkleIcon active={isActive} />;
  const svg = SVG_ICON_MAP[icon];
  if (svg) {
    return (
      <img
        src={isActive ? svg.filled : svg.outline}
        alt=""
        width={20}
        height={20}
        style={{ display: 'block', flexShrink: 0 }}
      />
    );
  }
  return (
    <span
      style={{
        fontSize: 16,
        lineHeight: 1,
        flexShrink: 0,
        color: isActive ? 'var(--primary-80)' : 'var(--text3)',
      }}
    >
      {icon}
    </span>
  );
}

// ── Rail row (leaf icon on the rail) ─────────────────────────────────────────

function RailRow({
  icon,
  label,
  isActive,
  sidebarCollapsed = true,
  onClick,
  onMouseEnter,
  onMouseLeave,
}: {
  icon: string;
  label: string;
  isActive: boolean;
  sidebarCollapsed?: boolean;
  onClick?: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const [pillPos, setPillPos] = useState<{ top: number; left: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  const background = isActive
    ? 'rgb(9, 102, 69)'
    : hovered
      ? '#F2F6E8'
      : 'transparent';
  const labelColor = isActive ? '#FFFFFF' : 'var(--text2)';

  function handleMouseEnter() {
    setHovered(true);
    onMouseEnter?.();
    if (sidebarCollapsed && !isActive && btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      setPillPos({ top: r.top + r.height / 2, left: r.right + 8 });
    }
  }

  function handleMouseLeave() {
    setHovered(false);
    setPillPos(null);
    onMouseLeave?.();
  }

  const showPill = sidebarCollapsed && hovered && !isActive && pillPos;

  return (
    <div onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      <button
        ref={btnRef}
        onClick={onClick}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
          width: '100%',
          height: 40,
          padding: sidebarCollapsed ? 0 : '0 12px',
          gap: sidebarCollapsed ? 0 : 12,
          background,
          color: labelColor,
          border: 'none',
          borderRadius: 8,
          cursor: 'pointer',
          transition: 'background 120ms ease, color 120ms ease',
        }}
      >
        <NavIcon icon={icon} isActive={isActive} />
        {!sidebarCollapsed && (
          <span style={{
            fontFamily: 'var(--sans)',
            fontSize: 13,
            fontWeight: isActive ? 600 : 500,
            color: labelColor,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}>
            {label}
          </span>
        )}
      </button>

      {/* Hover label pill — rendered in a portal so nothing clips it */}
      {showPill && typeof window !== 'undefined' && createPortal(
        <div
          style={{
            position: 'fixed',
            top: pillPos!.top,
            left: pillPos!.left,
            transform: 'translateY(-50%)',
            background: '#2E3643',
            color: '#FFFFFF',
            fontFamily: 'var(--sans)',
            fontSize: 12,
            fontWeight: 500,
            padding: '5px 10px',
            borderRadius: 6,
            whiteSpace: 'nowrap',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.12)',
            pointerEvents: 'none',
            zIndex: 9999,
          }}
        >
          {label}
        </div>,
        document.body
      )}
    </div>
  );
}

// ── Recursive flyout menu ────────────────────────────────────────────────────
// Renders a single flyout panel. Leaf items click through; groups recurse
// into a sub-flyout positioned to the right of the row.

function FlyoutMenu({
  title,
  entries,
  anchor,
  onCloseAll,
  isItemActive,
  onItemClick,
  parentClose,
}: {
  title?: string;
  entries: NavEntry[];
  anchor: { top: number; left: number };
  onCloseAll: () => void;
  isItemActive: (item: NavItem) => boolean;
  onItemClick: (item: NavItem) => void;
  parentClose?: () => void;
}) {
  return (
    <div
      style={{
        position: 'fixed',
        top: anchor.top,
        left: anchor.left,
        minWidth: 220,
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 10,
        boxShadow: '0 8px 24px rgba(0,0,0,0.10)',
        padding: '6px 0',
        zIndex: 200,
      }}
    >
      {title && (
        <div
          style={{
            padding: '6px 14px 8px',
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
          {title}
        </div>
      )}
      {entries.map((entry) => (
        <FlyoutRow
          key={entry.kind === 'item' ? entry.label : entry.id}
          entry={entry}
          onCloseAll={onCloseAll}
          isItemActive={isItemActive}
          onItemClick={onItemClick}
          parentClose={parentClose}
        />
      ))}
    </div>
  );
}

function FlyoutRow({
  entry,
  onCloseAll,
  isItemActive,
  onItemClick,
  parentClose,
}: {
  entry: NavEntry;
  onCloseAll: () => void;
  isItemActive: (item: NavItem) => boolean;
  onItemClick: (item: NavItem) => void;
  parentClose?: () => void;
}) {
  const [subOpen, setSubOpen] = useState(false);
  const [subAnchor, setSubAnchor] = useState<{ top: number; left: number } | null>(null);
  const rowRef = useRef<HTMLDivElement>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isGroup = entry.kind === 'group';

  function clearCloseTimer() {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }
  function scheduleClose() {
    clearCloseTimer();
    closeTimerRef.current = setTimeout(() => setSubOpen(false), 150);
  }
  function openSub() {
    if (!isGroup) return;
    clearCloseTimer();
    if (rowRef.current) {
      const r = rowRef.current.getBoundingClientRect();
      setSubAnchor({ top: r.top - 6, left: r.right + 4 });
    }
    setSubOpen(true);
  }

  useEffect(() => () => clearCloseTimer(), []);

  const active = !isGroup && isItemActive(entry as NavItem);
  const anyChildActive = isGroup && groupHasActive(entry as NavGroup, isItemActive);

  return (
    <div
      ref={rowRef}
      onMouseEnter={openSub}
      onMouseLeave={scheduleClose}
      style={{ position: 'relative' }}
    >
      <button
        onClick={() => {
          if (isGroup) return; // groups open via hover
          onItemClick(entry as NavItem);
          onCloseAll();
        }}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          width: '100%',
          padding: '8px 14px',
          background: active || anyChildActive ? 'var(--surface2)' : 'transparent',
          border: 'none',
          cursor: isGroup ? 'default' : 'pointer',
          fontFamily: 'var(--display)',
          fontWeight: active ? 600 : 500,
          fontSize: 13,
          color: active || anyChildActive ? 'var(--text)' : 'var(--text2)',
          textAlign: 'left',
          whiteSpace: 'nowrap',
        }}
        onMouseOver={(e) => {
          if (!active && !anyChildActive) {
            e.currentTarget.style.background = 'var(--surface2)';
            e.currentTarget.style.color = 'var(--text)';
          }
        }}
        onMouseOut={(e) => {
          if (!active && !anyChildActive) {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = 'var(--text2)';
          }
        }}
      >
        <span style={{ flex: 1 }}>{entry.label}</span>
        {isGroup && (
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ opacity: 0.5, flexShrink: 0 }}>
            <path d="M3.5 2L6.5 5L3.5 8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>

      {isGroup && subOpen && subAnchor && (
        <div
          onMouseEnter={clearCloseTimer}
          onMouseLeave={scheduleClose}
        >
          <FlyoutMenu
            title={entry.label}
            entries={(entry as NavGroup).children}
            anchor={subAnchor}
            onCloseAll={onCloseAll}
            isItemActive={isItemActive}
            onItemClick={onItemClick}
            parentClose={() => setSubOpen(false)}
          />
        </div>
      )}
      {/* unused but keeps signature for potential close-on-select chaining */}
      {void parentClose}
    </div>
  );
}

function groupHasActive(group: NavGroup, isItemActive: (item: NavItem) => boolean): boolean {
  return group.children.some((c) =>
    c.kind === 'item' ? isItemActive(c) : groupHasActive(c, isItemActive)
  );
}

// ── Rail row that opens a flyout (used by Kai) ───────────────────────────────

function FlyoutRailRow({
  icon,
  label,
  entries,
  isActive,
  sidebarCollapsed,
  isItemActive,
  onItemClick,
}: {
  icon: string;
  label: string;
  entries: NavEntry[];
  isActive: boolean;
  sidebarCollapsed: boolean;
  isItemActive: (item: NavItem) => boolean;
  onItemClick: (item: NavItem) => void;
}) {
  const [open, setOpen] = useState(false);
  const [anchor, setAnchor] = useState<{ top: number; left: number } | null>(null);
  const rowRef = useRef<HTMLDivElement>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function clearCloseTimer() {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }
  function scheduleClose() {
    clearCloseTimer();
    closeTimerRef.current = setTimeout(() => setOpen(false), 180);
  }
  function openFlyout() {
    clearCloseTimer();
    if (rowRef.current) {
      const r = rowRef.current.getBoundingClientRect();
      setAnchor({ top: r.top - 6, left: r.right + 6 });
    }
    setOpen(true);
  }

  useEffect(() => () => clearCloseTimer(), []);

  return (
    <div
      ref={rowRef}
      onMouseEnter={openFlyout}
      onMouseLeave={scheduleClose}
      style={{ position: 'relative' }}
    >
      <RailRow icon={icon} label={label} isActive={isActive} sidebarCollapsed={sidebarCollapsed} />
      {open && anchor && sidebarCollapsed && (
        <div onMouseEnter={clearCloseTimer} onMouseLeave={scheduleClose}>
          <FlyoutMenu
            title={label}
            entries={entries}
            anchor={anchor}
            onCloseAll={() => setOpen(false)}
            isItemActive={isItemActive}
            onItemClick={onItemClick}
          />
        </div>
      )}
      {open && !sidebarCollapsed && (
        <div onMouseEnter={clearCloseTimer} onMouseLeave={scheduleClose}>
          <FlyoutMenu
            title={label}
            entries={entries}
            anchor={{ top: anchor ? anchor.top : 0, left: 248 }}
            onCloseAll={() => setOpen(false)}
            isItemActive={isItemActive}
            onItemClick={onItemClick}
          />
        </div>
      )}
    </div>
  );
}

// ── UnifiedSidebar (single rail) ─────────────────────────────────────────────

export const SIDEBAR_TOTAL_WIDTH = 56;

export default function UnifiedSidebar() {
  const { currentView, setView, sidebarCollapsed, setSidebarCollapsed } = useLayout();
  const { clearMessages } = useConversation();
  const { requestSaveAndReset } = useChatSession();
  const { setAgentStoreView } = useAgentStore();
  const sidebarRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (sidebarCollapsed) return;
    function handleOutsideClick(e: MouseEvent) {
      if (sidebarRef.current && !sidebarRef.current.contains(e.target as Node)) {
        setSidebarCollapsed(true);
      }
    }
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [sidebarCollapsed, setSidebarCollapsed]);

  function nav(route: ViewRoute) {
    setView(route);
  }

  function newChat() {
    clearMessages();
    requestSaveAndReset();
  }

  // Reserved for the (currently commented) "Kai add-ons" entry; keep it
  // wired so future restoration is one uncomment away.
  void (() => {
    setAgentStoreView('my-agents');
    setView('agent-store');
  });

  const WIZ_ENTRIES: NavItem[] = [
    { kind: 'item', icon: 'svg:dashboard', label: 'Dashboard', route: 'wizorder/dashboard' },
    { kind: 'item', icon: 'svg:products', label: 'Products', route: 'wizorder/products' },
    { kind: 'item', icon: 'svg:orders', label: 'Orders', route: 'wizorder/orders' },
    { kind: 'item', icon: 'svg:customers', label: 'Customers', route: 'wizorder/customers' },
    { kind: 'item', icon: 'svg:crm', label: "CRM", route: 'wizorder/crm' }
  ];

  const KAI_ENTRIES: NavEntry[] = [
    {
      kind: 'group',
      id: 'kai-chat',
      icon: '💬',
      label: 'Chat',
      children: [
        { kind: 'item', icon: '✦', label: 'New Chat', route: 'chat', onClick: newChat },
        { kind: 'item', icon: '📜', label: 'History', route: 'history' },
      ],
    },
    { kind: 'item', icon: '📌', label: 'My Artifacts', route: 'artifacts' },
    { kind: 'item', icon: '📊', label: 'Reports & Dashboards', route: 'reports-dashboards' },
    { kind: 'item', icon: '📄', label: 'Knowledge Store', route: 'docs' },
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
      ],
    },
  ];

  function isItemActive(item: NavItem): boolean {
    return currentView === item.route;
  }

  function handleItemClick(item: NavItem) {
    if (item.onClick) item.onClick();
    else nav(item.route);
  }

  const kaiActive = KAI_ENTRIES.some((e) =>
    e.kind === 'item' ? isItemActive(e) : groupHasActive(e, isItemActive)
  );

  return (
    <aside
      ref={sidebarRef}
      data-tour="sidebar"
      style={{
        width: sidebarCollapsed ? 56 : 240,
        transition: 'width 300ms ease',
        flexShrink: 0,
      }}
      className="fixed inset-y-0 left-0 z-50 bg-[var(--surface)] border-r border-[var(--border)] flex flex-col overflow-visible"
    >
      {/* Brand */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: sidebarCollapsed ? 'center' : 'space-between',
          padding: sidebarCollapsed ? '18px 0' : '18px 16px',
          flexShrink: 0,
        }}
      >
        {sidebarCollapsed ? (
          <button
            onClick={() => setSidebarCollapsed(false)}
            title="Expand sidebar"
            className="flex items-center justify-center p-2 rounded hover:bg-[var(--surface2)] text-[var(--text2)] hover:text-[var(--text)] transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>
        ) : (
          <>
            <button
              onClick={() => nav('wizorder/dashboard')}
              title="WizCommerce"
              style={{
                display: 'flex',
                alignItems: 'center',
                background: 'transparent',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
              }}
            >
              <img
                src="/icons/WizCommerce.svg"
                alt="WizCommerce"
                style={{ height: 22, width: 'auto', display: 'block' }}
              />
            </button>
            <button
              onClick={() => setSidebarCollapsed(true)}
              title="Collapse sidebar"
              className="flex items-center justify-center p-1 rounded hover:bg-[var(--surface2)] text-[var(--text2)] hover:text-[var(--text)] transition-colors"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto overflow-x-visible">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, padding: '4px 8px 0' }}>
          {WIZ_ENTRIES.map((entry) => (
            <RailRow
              key={entry.label}
              icon={entry.icon}
              label={entry.label}
              isActive={isItemActive(entry)}
              sidebarCollapsed={sidebarCollapsed}
              onClick={() => handleItemClick(entry)}
            />
          ))}

          {/* Kai — single rail icon with a recursive flyout for the whole tree */}
          <div style={{ marginTop: 8 }}>
            <FlyoutRailRow
              icon="svg:kai"
              label="Kai"
              entries={KAI_ENTRIES}
              isActive={kaiActive}
              sidebarCollapsed={sidebarCollapsed}
              isItemActive={isItemActive}
              onItemClick={handleItemClick}
            />
          </div>
        </div>
      </nav>

      {/* Logout footer — always visible */}
      <div className="shrink-0 mt-auto">
        <div className="mx-2 border-t border-[var(--border)]" />
        <div className="flex flex-col gap-0.5 p-2">
          <RailRow
            icon="svg:logout"
            label="Logout"
            isActive={false}
            sidebarCollapsed={sidebarCollapsed}
            onClick={() => nav('wizorder/dashboard')}
          />
        </div>
      </div>
    </aside>
  );
}
