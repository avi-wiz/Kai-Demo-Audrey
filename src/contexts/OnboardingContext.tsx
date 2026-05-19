'use client';

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

interface OnboardingState {
  completed: boolean;
  completedAt?: string;
  selectedPersonaId?: string;
}

interface OnboardingContextValue extends OnboardingState {
  hydrated: boolean;
  markComplete: (personaId?: string) => void;
  resetOnboarding: () => void;
}

const LS_KEY = 'kai_onboarding_v1';
const DEFAULT: OnboardingState = { completed: false };

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<OnboardingState>(DEFAULT);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) setState(JSON.parse(raw));
    } catch {}
    setHydrated(true);
  }, []);

  function markComplete(personaId?: string) {
    const next: OnboardingState = {
      completed: true,
      completedAt: new Date().toISOString(),
      selectedPersonaId: personaId,
    };
    setState(next);
    localStorage.setItem(LS_KEY, JSON.stringify(next));
  }

  function resetOnboarding() {
    setState(DEFAULT);
    localStorage.removeItem(LS_KEY);
  }

  return (
    <OnboardingContext.Provider value={{ ...state, hydrated, markComplete, resetOnboarding }}>
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const ctx = useContext(OnboardingContext);
  if (!ctx) throw new Error('useOnboarding must be used inside OnboardingProvider');
  return ctx;
}
