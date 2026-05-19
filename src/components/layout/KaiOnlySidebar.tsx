'use client';

import { useLayout } from '@/contexts/LayoutContext';
import { useConversation } from '@/contexts/ConversationContext';
import { useChatSession } from '@/contexts/ChatSessionContext';
import KaiHoverMenu from './KaiHoverMenu';

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
        style={{ transition: 'transform 250ms ease', transform: collapsed ? 'rotate(180deg)' : 'rotate(0deg)' }}
      >
        <path d="M9 2L4 7L9 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}

export default function KaiOnlySidebar() {
  const { setView, sidebarCollapsed, setSidebarCollapsed } = useLayout();
  const { clearMessages } = useConversation();
  const { requestSaveAndReset } = useChatSession();

  const w = sidebarCollapsed ? 52 : 260;

  function handleLogoClick() {
    clearMessages();
    requestSaveAndReset();
  }

  return (
    <aside
      style={{
        width: w,
        transition: 'width 250ms ease',
        flexShrink: 0,
      }}
      className="flex flex-col fixed inset-y-0 left-0 z-50 bg-[var(--surface)] border-r border-[var(--border)] overflow-hidden"
    >
      {/* Logo */}
      <button
        onClick={handleLogoClick}
        className="flex items-center hover:opacity-80 transition-opacity text-left shrink-0"
        style={{
          gap: sidebarCollapsed ? 0 : 10,
          padding: sidebarCollapsed ? '20px 0' : '20px',
          justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
          width: '100%',
        }}
      >
        <span
          style={{
            fontSize: 18,
            background: 'linear-gradient(135deg, var(--primary-70), var(--ai-accent))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            lineHeight: 1,
            flexShrink: 0,
          }}
        >
          ✦
        </span>
        {!sidebarCollapsed && (
          <span
            style={{
              fontFamily: 'var(--display)',
              fontWeight: 700,
              fontSize: 20,
              background: 'linear-gradient(135deg, var(--primary-70) 0%, var(--ai-accent) 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              letterSpacing: '-0.3px',
              whiteSpace: 'nowrap',
            }}
          >
            Kai
          </span>
        )}
      </button>

      {/* Nav */}
      <nav className="flex-1 px-3 py-1 overflow-y-auto overflow-x-hidden">
        <KaiHoverMenu collapsed={sidebarCollapsed} />
      </nav>

      {/* Collapse toggle + user footer */}
      <div className="shrink-0">
        <div className="mx-4 border-t border-[var(--border)]" />

        <CollapseToggle collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />

        <div className="mx-4 border-t border-[var(--border)]" />

        {/* User row */}
        <div
          className="flex items-center"
          style={{
            padding: sidebarCollapsed ? '10px 0' : '10px 16px',
            gap: sidebarCollapsed ? 0 : 12,
            justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
          }}
        >
          <div
            className="shrink-0 flex items-center justify-center rounded-full text-white text-[12px] font-semibold"
            style={{ width: 32, height: 32, background: 'var(--primary-80)' }}
            title={sidebarCollapsed ? 'Heman Bhullar — Admin' : undefined}
          >
            HB
          </div>
          {!sidebarCollapsed && (
            <div className="flex-1 overflow-hidden">
              <p className="text-[13px] font-medium text-[var(--text)] truncate leading-tight">Heman Bhullar</p>
              <p className="text-[11px] text-[var(--text3)] truncate leading-tight">Admin</p>
            </div>
          )}
          {!sidebarCollapsed && (
            <button
              className="shrink-0 text-[11px] text-[var(--text3)] hover:text-[var(--text2)] transition-colors font-sans"
              onClick={() => {}}
              title="Logout"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path
                  d="M5 2H2.5A1.5 1.5 0 0 0 1 3.5v7A1.5 1.5 0 0 0 2.5 12H5M9.5 9.5L13 7m0 0L9.5 4.5M13 7H5"
                  stroke="currentColor"
                  strokeWidth="1.3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
