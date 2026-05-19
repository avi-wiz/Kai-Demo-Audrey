'use client';

import { useState, useRef, useCallback } from 'react';
import { useLayout } from '@/contexts/LayoutContext';
import KaiHoverMenu from './KaiHoverMenu';

const WIZORDER_NAV = [
  { label: 'Dashboard', icon: '▣' },
  { label: 'Products', icon: '◫' },
  { label: 'Sales', icon: '◈' },
  { label: 'Customers', icon: '◎' },
  { label: 'WizPay', icon: '◇' },
  { label: 'Manage', icon: '◉' },
  { label: 'Reports', icon: '◳' },
  { label: 'Catalog Manager', icon: '◰' },
  { label: 'Files', icon: '◱' },
];

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

export default function WizOrderSidebar() {
  const { setView, sidebarCollapsed, setSidebarCollapsed } = useLayout();
  const [flyoutVisible, setFlyoutVisible] = useState(false);
  const [flyoutTop, setFlyoutTop] = useState(0);

  const openTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const kaiItemRef = useRef<HTMLDivElement>(null);

  const w = sidebarCollapsed ? 52 : 240;
  const flyoutLeft = sidebarCollapsed ? 60 : 248;

  const scheduleOpen = useCallback(() => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    openTimerRef.current = setTimeout(() => {
      const rect = kaiItemRef.current?.getBoundingClientRect();
      if (rect) setFlyoutTop(rect.top);
      setFlyoutVisible(true);
    }, 150);
  }, []);

  const scheduleClose = useCallback(() => {
    if (openTimerRef.current) clearTimeout(openTimerRef.current);
    closeTimerRef.current = setTimeout(() => setFlyoutVisible(false), 120);
  }, []);

  const cancelClose = useCallback(() => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
  }, []);

  return (
    <aside
      style={{ width: w, transition: 'width 250ms ease' }}
      className="flex flex-col fixed inset-y-0 left-0 z-50 bg-[var(--surface)] border-r border-[var(--border)] overflow-hidden"
    >
      {/* Logo */}
      <div
        style={{
          padding: sidebarCollapsed ? '20px 0' : '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
          flexShrink: 0,
        }}
      >
        {sidebarCollapsed ? (
          <span style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>W</span>
        ) : (
          <span style={{ fontFamily: 'var(--display)', fontWeight: 600, fontSize: 16, color: 'var(--text)', letterSpacing: '-0.2px', whiteSpace: 'nowrap' }}>
            WizCommerce
          </span>
        )}
      </div>

      {/* WizOrder nav */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden" style={{ padding: sidebarCollapsed ? '4px 4px' : '4px 12px' }}>
        <div className="flex flex-col gap-0.5">
          {WIZORDER_NAV.map((item) => {
            const isActive = item.label === 'Dashboard';
            return (
              <div
                key={item.label}
                title={sidebarCollapsed ? item.label : undefined}
                className="flex items-center rounded-lg cursor-default select-none"
                style={{
                  gap: sidebarCollapsed ? 0 : 10,
                  padding: sidebarCollapsed ? '8px 0' : '8px 12px',
                  justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
                  fontSize: 13,
                  fontFamily: 'var(--sans)',
                  fontWeight: 500,
                  color: isActive ? 'var(--primary-70)' : 'var(--text2)',
                  background: isActive ? 'var(--surface2)' : 'transparent',
                  borderLeft: !sidebarCollapsed && isActive ? '3px solid var(--primary-80)' : '3px solid transparent',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    (e.currentTarget as HTMLDivElement).style.background = 'var(--surface2)';
                    (e.currentTarget as HTMLDivElement).style.color = 'var(--text)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    (e.currentTarget as HTMLDivElement).style.background = 'transparent';
                    (e.currentTarget as HTMLDivElement).style.color = 'var(--text2)';
                  }
                }}
              >
                <span style={{ fontSize: 13, lineHeight: 1, opacity: 0.7, flexShrink: 0 }}>{item.icon}</span>
                {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
              </div>
            );
          })}

          {/* Kai item — hover triggers flyout */}
          <div
            ref={kaiItemRef}
            onMouseEnter={scheduleOpen}
            onMouseLeave={scheduleClose}
            title={sidebarCollapsed ? 'Kai' : undefined}
            className="relative flex items-center rounded-lg cursor-default select-none mt-1"
            style={{
              gap: sidebarCollapsed ? 0 : 10,
              padding: sidebarCollapsed ? '8px 0' : '8px 12px',
              justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
              fontSize: 13,
              fontFamily: 'var(--sans)',
              fontWeight: 600,
              color: flyoutVisible ? 'var(--primary-70)' : 'var(--text)',
              background: flyoutVisible ? 'var(--ai-accent-bg, rgba(99,102,241,0.07))' : 'transparent',
              borderLeft: !sidebarCollapsed && flyoutVisible ? '3px solid var(--primary-80)' : '3px solid transparent',
              transition: 'all 150ms ease',
            }}
          >
            <span
              style={{
                fontSize: 13,
                lineHeight: 1,
                flexShrink: 0,
                background: 'linear-gradient(135deg, var(--primary-70), var(--ai-accent))',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              ✦
            </span>
            {!sidebarCollapsed && (
              <>
                <span
                  style={{
                    background: flyoutVisible ? 'linear-gradient(135deg, var(--primary-70), var(--ai-accent))' : 'none',
                    WebkitBackgroundClip: flyoutVisible ? 'text' : 'initial',
                    WebkitTextFillColor: flyoutVisible ? 'transparent' : 'initial',
                    color: flyoutVisible ? undefined : 'var(--text)',
                  }}
                >
                  Kai
                </span>
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="ml-auto" style={{ opacity: 0.4, flexShrink: 0 }}>
                  <path d="M3.5 2L6.5 5L3.5 8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </>
            )}
          </div>
        </div>

        {/* Divider */}
        <div className="mx-1 my-2 border-t border-[var(--border)]" />

        {/* Settings + Logout */}
        <div className="flex flex-col gap-0.5">
          {[{ label: 'Settings', icon: '⚙' }, { label: 'Logout', icon: '⎋' }].map((item) => (
            <div
              key={item.label}
              title={sidebarCollapsed ? item.label : undefined}
              className="flex items-center rounded-lg cursor-default select-none"
              style={{
                gap: sidebarCollapsed ? 0 : 10,
                padding: sidebarCollapsed ? '8px 0' : '8px 12px',
                justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
                fontSize: 13,
                fontFamily: 'var(--sans)',
                fontWeight: 500,
                color: 'var(--text2)',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLDivElement).style.background = 'var(--surface2)';
                (e.currentTarget as HTMLDivElement).style.color = 'var(--text)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.background = 'transparent';
                (e.currentTarget as HTMLDivElement).style.color = 'var(--text2)';
              }}
            >
              <span style={{ fontSize: 13, opacity: 0.7, flexShrink: 0 }}>{item.icon}</span>
              {!sidebarCollapsed && <span>{item.label}</span>}
            </div>
          ))}
        </div>
      </nav>

      {/* Collapse toggle + user footer */}
      <div className="shrink-0">
        <div className="mx-4 border-t border-[var(--border)]" />

        <CollapseToggle collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />

        <div className="mx-4 border-t border-[var(--border)]" />

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
        </div>
      </div>

      {/* Kai flyout panel */}
      {flyoutVisible && (
        <div
          onMouseEnter={cancelClose}
          onMouseLeave={scheduleClose}
          style={{
            position: 'fixed',
            left: flyoutLeft,
            top: flyoutTop - 8,
            zIndex: 60,
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 10,
            boxShadow: '0 8px 24px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.08)',
            padding: '8px',
            minWidth: 220,
            animation: 'flyoutEntrance 180ms ease forwards',
          }}
        >
          <style>{`
            @keyframes flyoutEntrance {
              from { opacity: 0; transform: translateX(-8px) scale(0.98); }
              to   { opacity: 1; transform: translateX(0) scale(1); }
            }
          `}</style>
          <KaiHoverMenu onNavigate={() => setFlyoutVisible(false)} />
        </div>
      )}
    </aside>
  );
}
