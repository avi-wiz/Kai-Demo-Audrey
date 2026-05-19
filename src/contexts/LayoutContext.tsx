'use client';

import { createContext, useContext, useState, type ReactNode } from 'react';
import type { LayoutMode, ViewRoute } from '@/lib/types';

interface LayoutContextValue {
  layoutMode: LayoutMode;
  currentView: ViewRoute;
  setLayoutMode: (mode: LayoutMode) => void;
  setView: (view: ViewRoute) => void;
  /** Set before navigating to 'chat' to auto-submit a query. ChatShell consumes and clears it. */
  pendingQuery: string | null;
  setPendingQuery: (query: string | null) => void;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  /** Increments each time "Ask Kai" is clicked. ChatShell watches this to focus the input. */
  focusChatSignal: number;
  triggerChatFocus: () => void;
}

const LayoutContext = createContext<LayoutContextValue | null>(null);

export function LayoutProvider({ children }: { children: ReactNode }) {
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('kai-only');
  const [currentView, setCurrentView] = useState<ViewRoute>('chat');
  const [pendingQuery, setPendingQuery] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [focusChatSignal, setFocusChatSignal] = useState(0);

  function triggerChatFocus() {
    setFocusChatSignal((n) => n + 1);
  }

  return (
    <LayoutContext.Provider
      value={{
        layoutMode,
        currentView,
        setLayoutMode,
        setView: setCurrentView,
        pendingQuery,
        setPendingQuery,
        sidebarCollapsed,
        setSidebarCollapsed,
        focusChatSignal,
        triggerChatFocus,
      }}
    >
      {children}
    </LayoutContext.Provider>
  );
}

export function useLayout() {
  const ctx = useContext(LayoutContext);
  if (!ctx) throw new Error('useLayout must be used inside LayoutProvider');
  return ctx;
}
