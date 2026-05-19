'use client';

import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from 'react';
import type { SavedSession } from '@/lib/historyTypes';

const LS_KEY = 'kai_chat_history_v1';

interface ChatHistoryState {
  sessions: SavedSession[];
  addSession: (s: SavedSession) => void;
  updateSession: (id: string, patch: Partial<SavedSession>) => void;
  removeSession: (id: string) => void;
  getSession: (id: string) => SavedSession | undefined;
}

const ChatHistoryContext = createContext<ChatHistoryState | null>(null);

export function ChatHistoryProvider({ children }: { children: ReactNode }) {
  const [sessions, setSessions] = useState<SavedSession[]>([]);
  const hydratedRef = useRef(false);

  // Hydrate on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed?.sessions)) {
          setSessions(parsed.sessions as SavedSession[]);
        }
      }
    } catch {
      // ignore
    }
    hydratedRef.current = true;
  }, []);

  // Persist whenever sessions change (post-hydration)
  useEffect(() => {
    if (!hydratedRef.current) return;
    try {
      localStorage.setItem(LS_KEY, JSON.stringify({ sessions }));
    } catch {
      // ignore (quota / SSR)
    }
  }, [sessions]);

  const addSession = useCallback((s: SavedSession) => {
    setSessions((prev) => [s, ...prev.filter((x) => x.id !== s.id)]);
  }, []);

  const updateSession = useCallback((id: string, patch: Partial<SavedSession>) => {
    setSessions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...patch, updatedAt: Date.now() } : s)),
    );
  }, []);

  const removeSession = useCallback((id: string) => {
    setSessions((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const getSession = useCallback(
    (id: string) => sessions.find((s) => s.id === id),
    [sessions],
  );

  return (
    <ChatHistoryContext.Provider value={{ sessions, addSession, updateSession, removeSession, getSession }}>
      {children}
    </ChatHistoryContext.Provider>
  );
}

export function useChatHistory() {
  const ctx = useContext(ChatHistoryContext);
  if (!ctx) throw new Error('useChatHistory must be used inside ChatHistoryProvider');
  return ctx;
}
