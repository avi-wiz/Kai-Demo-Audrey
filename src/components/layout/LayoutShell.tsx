'use client';

import { Suspense, useState, useEffect } from 'react';
import { useLayout } from '@/contexts/LayoutContext';
import { useConversation } from '@/contexts/ConversationContext';
import AiModeToggle from '@/components/chat/AiModeToggle';
import CommandPalette from '@/components/chat/CommandPalette';
import UnifiedSidebar from './UnifiedSidebar';
import MainContent from './MainContent';

const VIEW_TITLES: Record<string, string> = {
  chat: 'Kai Assistant',
  history: 'History',
  artifacts: 'My Artifacts',
  docs: 'Docs',
  settings: 'Settings',
  'agent-store': 'Agent Store',
  'admin/dashboard': 'Analytics Dashboard',
  'admin/models': 'Add Your Models',
  'admin/api-key': 'Add Your Models',
  'admin/prefs': 'User Preferences',
  'wizorder/dashboard': 'Dashboard',
  'wizorder/orders': 'Orders',
  'wizorder/customers': 'Customers',
  'wizorder/products': 'Products',
  'wizorder/crm': 'CRM',
};

// ── LayoutShell ───────────────────────────────────────────────────────────────

export default function LayoutShell() {
  const { sidebarCollapsed, currentView, setView, triggerChatFocus } = useLayout();
  const { clearMessages } = useConversation();
  const [paletteOpen, setPaletteOpen] = useState(false);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setPaletteOpen((v) => !v);
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const sidebarWidth = sidebarCollapsed ? 52 : 220;

  const isOnKaiView = !currentView.startsWith('wizorder/');

  function handleAskKai() {
    if (isOnKaiView) {
      // Already in Kai — just start a new chat and focus
      clearMessages();
      setView('chat');
      triggerChatFocus();
    } else {
      // On a WizOrder page — navigate to Kai chat
      clearMessages();
      setView('chat');
      triggerChatFocus();
    }
  }

  return (
    <>
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
      <UnifiedSidebar />

      <main
        className="flex-1 flex flex-col min-h-screen bg-[var(--bg)]"
        style={{ paddingLeft: sidebarWidth, transition: 'padding-left 250ms ease' }}
      >
        <header className="h-[60px] border-b border-[var(--border)] bg-[var(--surface)] flex items-center justify-between px-6 shrink-0">
          <h2 className="text-[15px] font-bold text-[var(--text)] font-sans">
            {VIEW_TITLES[currentView] ?? 'Kai Assistant'}
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              data-tour="cmd-k-hint"
              onClick={() => setPaletteOpen(true)}
              title="Open command palette (⌘K)"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '4px 10px',
                background: 'var(--surface2)',
                border: '1px solid var(--border)',
                borderRadius: 7,
                fontFamily: 'var(--sans)',
                fontSize: 12,
                color: 'var(--text3)',
                cursor: 'pointer',
                transition: 'border-color 120ms ease, color 120ms ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--border2)'; e.currentTarget.style.color = 'var(--text2)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text3)'; }}
            >
              <svg width="11" height="11" viewBox="0 0 16 16" fill="none"><circle cx="7" cy="7" r="4" stroke="currentColor" strokeWidth="1.5"/><path d="M10.5 10.5l2.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.02em' }}>⌘K</span>
            </button>
            <button
              data-tour="ask-kai-button"
              onClick={handleAskKai}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 14px',
                background: 'var(--primary-80)',
                color: 'white',
                border: 'none',
                borderRadius: 'var(--radius-button, 8px)',
                fontFamily: 'var(--display)',
                fontWeight: 600,
                fontSize: 12.5,
                cursor: 'pointer',
                transition: 'background 150ms ease, transform 100ms ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--primary-70)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--primary-80)')}
              onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.98)')}
              onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0 }}>
                <path d="M7 1.5L8.2 5.3H12.2L9 7.7L10.2 11.5L7 9.1L3.8 11.5L5 7.7L1.8 5.3H5.8L7 1.5Z" fill="white" />
              </svg>
              Ask Kai
            </button>
            <Suspense fallback={<div className="w-20 h-6 bg-[var(--surface2)] rounded-full animate-pulse" />}>
              <AiModeToggle />
            </Suspense>
          </div>
        </header>

        <MainContent />
      </main>
    </>
  );
}
