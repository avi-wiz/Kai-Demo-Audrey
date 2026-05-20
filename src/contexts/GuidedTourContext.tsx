'use client';

import { createContext, useContext, useState, useRef, type ReactNode } from 'react';

interface GuidedTourContextValue {
  active: boolean;
  overlayHidden: boolean;
  paused: boolean;
  startTour: () => void;
  endTour: () => void;
  /** Pause overlay (e.g. after step 4 chip click) — tour resumes at next step on resumeTour(). */
  pauseTour: () => void;
  /** Resume from the paused step — called when proactive brief is visible. */
  resumeTour: () => void;
  tourPrefill: string | null;
  triggerTourPrefill: () => void;
  clearTourPrefill: () => void;
  notifyTourQuerySent: () => void;
  notifyTourWidgetsReady: () => void;
  onTourWidgetsReady: (cb: () => void) => void;
  notifyTourChipClicked: () => void;
  /** Overlay registers a callback to be called when resumeTour fires. */
  onTourResume: (cb: () => void) => void;
}

const GuidedTourContext = createContext<GuidedTourContextValue | null>(null);

export const TOUR_PREFILL_QUERY = "How's Magnolia Home & Garden doing?";

export function GuidedTourProvider({ children }: { children: ReactNode }) {
  const [active, setActive] = useState(false);
  const [overlayHidden, setOverlayHidden] = useState(false);
  const [paused, setPaused] = useState(false);
  const [tourPrefill, setTourPrefill] = useState<string | null>(null);
  const widgetsReadyCbRef = useRef<(() => void) | null>(null);
  const resumeCbRef = useRef<(() => void) | null>(null);
  // Ref mirror of paused — functions close over stale state, ref is always current
  const pausedRef = useRef(false);

  function startTour() {
    setActive(true);
    setOverlayHidden(false);
    setPaused(false);
    pausedRef.current = false;
    widgetsReadyCbRef.current = null;
    resumeCbRef.current = null;
  }

  function endTour() {
    setActive(false);
    setOverlayHidden(false);
    setPaused(false);
    pausedRef.current = false;
    setTourPrefill(null);
    widgetsReadyCbRef.current = null;
    resumeCbRef.current = null;
  }

  function pauseTour() {
    setOverlayHidden(true);
    setPaused(true);
    pausedRef.current = true;
  }

  function onTourResume(cb: () => void) {
    resumeCbRef.current = cb;
  }

  function resumeTour() {
    if (!pausedRef.current) return;
    pausedRef.current = false;
    setPaused(false);
    setOverlayHidden(false);
    resumeCbRef.current?.();
    resumeCbRef.current = null;
  }

  function notifyTourQuerySent() {
    setOverlayHidden(true);
  }

  function triggerTourPrefill() {
    setTourPrefill(TOUR_PREFILL_QUERY);
  }

  function clearTourPrefill() {
    setTourPrefill(null);
  }

  function notifyTourWidgetsReady() {
    // Only un-hide the overlay if tour is not paused (paused = waiting for new conversation)
    setPaused((currentlyPaused) => {
      if (!currentlyPaused) {
        setOverlayHidden(false);
        widgetsReadyCbRef.current?.();
        widgetsReadyCbRef.current = null;
      }
      return currentlyPaused;
    });
  }

  function onTourWidgetsReady(cb: () => void) {
    widgetsReadyCbRef.current = cb;
  }

  // Deferred so it never fires during a React render cycle
  function notifyTourChipClicked() {
    setTimeout(() => {
      pauseTour();
    }, 0);
  }

  return (
    <GuidedTourContext.Provider
      value={{
        active,
        overlayHidden,
        paused,
        startTour,
        endTour,
        pauseTour,
        resumeTour,
        tourPrefill,
        triggerTourPrefill,
        clearTourPrefill,
        notifyTourQuerySent,
        notifyTourWidgetsReady,
        onTourWidgetsReady,
        notifyTourChipClicked,
        onTourResume,
      }}
    >
      {children}
    </GuidedTourContext.Provider>
  );
}

export function useGuidedTour() {
  const ctx = useContext(GuidedTourContext);
  if (!ctx) throw new Error('useGuidedTour must be used inside GuidedTourProvider');
  return ctx;
}
