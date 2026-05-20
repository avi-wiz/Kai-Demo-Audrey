'use client';

import { useEffect, useRef, useState } from 'react';
import { useLayout } from '@/contexts/LayoutContext';
import { useConversation } from '@/contexts/ConversationContext';
import UnifiedSidebar, { SIDEBAR_TOTAL_WIDTH } from './UnifiedSidebar';
import MainContent from './MainContent';

// Single source of truth for breadcrumb + tab-title resolution.
const VIEW_TITLES: Record<string, string> = {
  chat: 'Kai Assistant',
  history: 'History',
  artifacts: 'My Artifacts',
  docs: 'Knowledge Store',
  settings: 'Settings',
  'agent-store': 'Agent Store',
  'admin/dashboard': 'Analytics Dashboard',
  'admin/models': 'Add Your Models',
  'admin/api-key': 'Add Your Models',
  'admin/prefs': 'User Preferences',
  'reports-dashboards': 'Reports & Dashboards',
  'wizorder/dashboard': 'Dashboard',
  'wizorder/orders': 'Orders',
  'wizorder/customers': 'Customers',
  'wizorder/products': 'Products',
  'wizorder/crm': 'CRM',
};

const WIZORDER_LEAF: Record<string, string> = {
  'wizorder/products': 'Products',
  'wizorder/orders': 'Orders',
  'wizorder/customers': 'Customers',
  'wizorder/crm': 'CRM',
};

function Breadcrumb({ view }: { view: string }) {
  const leaf = WIZORDER_LEAF[view];
  if (leaf) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'var(--display)', fontSize: 14 }}>
        <span style={{ color: 'var(--text3)', fontWeight: 500 }}>Dashboard</span>
        <span style={{ color: 'var(--text3)' }}>/</span>
        <span style={{ color: 'var(--text)', fontWeight: 600 }}>{leaf}</span>
      </div>
    );
  }
  return (
    <span style={{ fontFamily: 'var(--display)', fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>
      {VIEW_TITLES[view] ?? 'Kai Assistant'}
    </span>
  );
}

function BellIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

function NotificationsButton() {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  return (
    <div ref={wrapRef} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen((v) => !v)}
        title="Notifications"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 34,
          height: 34,
          background: 'transparent',
          border: '1px solid transparent',
          borderRadius: 999,
          color: 'var(--text2)',
          cursor: 'pointer',
          transition: 'background 120ms ease, border-color 120ms ease, color 120ms ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'var(--surface2)';
          e.currentTarget.style.borderColor = 'var(--border)';
          e.currentTarget.style.color = 'var(--text)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'transparent';
          e.currentTarget.style.borderColor = 'transparent';
          e.currentTarget.style.color = 'var(--text2)';
        }}
      >
        <BellIcon />
      </button>

      {open && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            right: 0,
            minWidth: 260,
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 10,
            boxShadow: '0 8px 24px rgba(0,0,0,0.10)',
            padding: '14px 16px',
            zIndex: 100,
            fontFamily: 'var(--sans)',
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>
            Notifications
          </div>
          <div style={{ fontSize: 12, color: 'var(--text3)' }}>
            You&apos;re all caught up.
          </div>
        </div>
      )}
    </div>
  );
}

export default function LayoutShell() {
  const { currentView, setView, triggerChatFocus, sidebarCollapsed } = useLayout();
  const { clearMessages } = useConversation();

  function handleAskKai() {
    clearMessages();
    setView('chat');
    triggerChatFocus();
  }

  const sidebarWidth = sidebarCollapsed ? 56 : 240;

  return (
    <>
      <UnifiedSidebar />

      <main
        className="flex-1 flex flex-col h-screen bg-[var(--bg)] transition-all duration-300 overflow-hidden"
        style={{ paddingLeft: sidebarWidth }}
      >
        <header
          className="h-[56px] border-b border-[var(--border)] bg-[var(--surface)] flex items-center justify-between px-6 shrink-0"
        >
          <Breadcrumb view={currentView} />

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              data-tour="ask-kai-button"
              onClick={handleAskKai}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 14px',
                background: '#096645',
                color: '#FFFFFF',
                border: '1px solid #096645',
                borderRadius: 999,
                fontFamily: 'var(--display)',
                fontWeight: 600,
                fontSize: 13,
                cursor: 'pointer',
                transition: 'background 150ms ease, border-color 150ms ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#0b7a52';
                e.currentTarget.style.borderColor = '#0b7a52';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#096645';
                e.currentTarget.style.borderColor = '#096645';
              }}
            >
              <svg width="12" height="12" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <path
                  d="M7 1.5L8.2 5.3H12.2L9 7.7L10.2 11.5L7 9.1L3.8 11.5L5 7.7L1.8 5.3H5.8L7 1.5Z"
                  fill="#FFFFFF"
                />
              </svg>
              Ask Kai
            </button>

            <NotificationsButton />

            <button
              type="button"
              title="Account"
              aria-label="Account"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 32,
                height: 32,
                borderRadius: 999,
                background: 'rgb(69, 120, 196)',
                color: '#FFFFFF',
                border: 'none',
                fontFamily: 'var(--display)',
                fontWeight: 700,
                fontSize: 12,
                letterSpacing: '0.02em',
                cursor: 'pointer',
              }}
            >
              HB
            </button>
          </div>
        </header>

        <MainContent />
      </main>
    </>
  );
}
