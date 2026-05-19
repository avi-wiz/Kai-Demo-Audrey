'use client';

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { ConversationMessage } from '@/lib/types';

interface ConversationContextValue {
  messages: ConversationMessage[];
  addMessage: (message: ConversationMessage) => void;
  markStale: (id: string) => void;
  clearMessages: () => void;
  getLastKaiMessage: () => ConversationMessage | undefined;
}

const ConversationContext = createContext<ConversationContextValue | null>(null);

export function ConversationProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<ConversationMessage[]>([]);

  const addMessage = useCallback((message: ConversationMessage) => {
    setMessages((prev) => [...prev, message]);
  }, []);

  const markStale = useCallback((id: string) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === id ? { ...m, isStale: true } : m))
    );
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  const getLastKaiMessage = useCallback((): ConversationMessage | undefined => {
    return [...messages].reverse().find((m) => m.role === 'assistant');
  }, [messages]);

  return (
    <ConversationContext.Provider
      value={{ messages, addMessage, markStale, clearMessages, getLastKaiMessage }}
    >
      {children}
    </ConversationContext.Provider>
  );
}

export function useConversation() {
  const ctx = useContext(ConversationContext);
  if (!ctx) throw new Error('useConversation must be used inside ConversationProvider');
  return ctx;
}
