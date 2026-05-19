'use client';

import { createContext, useContext, useRef, useState, useCallback, type ReactNode } from 'react';
import type { SavedSession } from '@/lib/historyTypes';

/**
 * Lightweight bridge between the sidebar (and other views) and ChatShell.
 *
 * - ChatShell registers a save+reset implementation on mount via `registerSaveAndReset`.
 * - Sidebar's "New Chat" handler calls `requestSaveAndReset()` instead of clearing state directly.
 * - HistoryView sets a `pendingRestore` session; ChatShell consumes it on mount/update and rehydrates state.
 */
interface ChatSessionState {
  registerSaveAndReset: (fn: () => void) => void;
  requestSaveAndReset: () => void;
  pendingRestore: SavedSession | null;
  requestRestore: (s: SavedSession) => void;
  consumePendingRestore: () => SavedSession | null;
}

const ChatSessionContext = createContext<ChatSessionState | null>(null);

export function ChatSessionProvider({ children }: { children: ReactNode }) {
  const saveAndResetRef = useRef<(() => void) | null>(null);
  const [pendingRestore, setPendingRestore] = useState<SavedSession | null>(null);

  const registerSaveAndReset = useCallback((fn: () => void) => {
    saveAndResetRef.current = fn;
  }, []);

  const requestSaveAndReset = useCallback(() => {
    if (saveAndResetRef.current) saveAndResetRef.current();
  }, []);

  const requestRestore = useCallback((s: SavedSession) => {
    setPendingRestore(s);
  }, []);

  const consumePendingRestore = useCallback(() => {
    const v = pendingRestore;
    if (v) setPendingRestore(null);
    return v;
  }, [pendingRestore]);

  return (
    <ChatSessionContext.Provider
      value={{ registerSaveAndReset, requestSaveAndReset, pendingRestore, requestRestore, consumePendingRestore }}
    >
      {children}
    </ChatSessionContext.Provider>
  );
}

export function useChatSession() {
  const ctx = useContext(ChatSessionContext);
  if (!ctx) throw new Error('useChatSession must be used inside ChatSessionProvider');
  return ctx;
}
