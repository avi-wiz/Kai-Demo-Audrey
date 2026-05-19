'use client';

import { createContext, useContext, useState, type ReactNode } from 'react';
import type { ResponseMode } from '@/lib/types';

interface ResponseModeContextValue {
  mode: ResponseMode;
  setMode: (mode: ResponseMode) => void;
  toggleMode: () => void;
}

const ResponseModeContext = createContext<ResponseModeContextValue | null>(null);

export function ResponseModeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<ResponseMode>('text-widget');

  function toggleMode() {
    setMode((prev) => (prev === 'text-widget' ? 'text-only' : 'text-widget'));
  }

  return (
    <ResponseModeContext.Provider value={{ mode, setMode, toggleMode }}>
      {children}
    </ResponseModeContext.Provider>
  );
}

export function useResponseMode() {
  const ctx = useContext(ResponseModeContext);
  if (!ctx) throw new Error('useResponseMode must be used inside ResponseModeProvider');
  return ctx;
}
