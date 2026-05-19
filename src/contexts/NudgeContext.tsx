'use client';

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

export type NudgeType = 'chart' | 'action-chip' | 'dashboard' | 'email';

interface NudgeContextValue {
  activeNudge: NudgeType | null;
  triggerNudge: (type: NudgeType) => void;
  dismissNudge: () => void;
}

const LS_PREFIX = 'kai-nudge-seen-';

function hasSeen(type: NudgeType): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(`${LS_PREFIX}${type}`) === 'true';
}

function markSeen(type: NudgeType) {
  localStorage.setItem(`${LS_PREFIX}${type}`, 'true');
}

const NudgeContext = createContext<NudgeContextValue | null>(null);

export function NudgeProvider({ children }: { children: ReactNode }) {
  const [activeNudge, setActiveNudge] = useState<NudgeType | null>(null);

  const triggerNudge = useCallback((type: NudgeType) => {
    if (hasSeen(type)) return;
    setActiveNudge(type);
  }, []);

  const dismissNudge = useCallback(() => {
    setActiveNudge((prev) => {
      if (prev) markSeen(prev);
      return null;
    });
  }, []);

  return (
    <NudgeContext.Provider value={{ activeNudge, triggerNudge, dismissNudge }}>
      {children}
    </NudgeContext.Provider>
  );
}

export function useNudge() {
  const ctx = useContext(NudgeContext);
  if (!ctx) throw new Error('useNudge must be used inside NudgeProvider');
  return ctx;
}
