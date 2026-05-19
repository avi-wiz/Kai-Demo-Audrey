'use client';

import { createContext, useContext, useState, type ReactNode } from 'react';
import type { DashboardCompositeData, DashboardCell, ViewRoute } from '@/lib/types';

interface DashboardBuilderState {
  activeDashboard: DashboardCompositeData | null;
  activeArtifactId: string | null;
  returnView: ViewRoute;
  setActive: (d: DashboardCompositeData, artifactId: string, returnView?: ViewRoute) => void;
  clearActive: () => void;
  patchCells: (mutator: (cells: DashboardCell[]) => DashboardCell[]) => void;
  replaceDashboard: (d: DashboardCompositeData) => void;
}

const DashboardBuilderContext = createContext<DashboardBuilderState | null>(null);

export function DashboardBuilderProvider({ children }: { children: ReactNode }) {
  const [activeDashboard, setActiveDashboard] = useState<DashboardCompositeData | null>(null);
  const [activeArtifactId, setActiveArtifactId] = useState<string | null>(null);
  const [returnView, setReturnView] = useState<ViewRoute>('artifacts');

  function setActive(d: DashboardCompositeData, artifactId: string, rv: ViewRoute = 'artifacts') {
    setActiveDashboard(d);
    setActiveArtifactId(artifactId);
    setReturnView(rv);
  }

  function clearActive() {
    setActiveDashboard(null);
    setActiveArtifactId(null);
    setReturnView('artifacts');
  }

  function patchCells(mutator: (cells: DashboardCell[]) => DashboardCell[]) {
    setActiveDashboard((prev) => prev ? { ...prev, cells: mutator(prev.cells) } : prev);
  }

  function replaceDashboard(d: DashboardCompositeData) {
    setActiveDashboard(d);
  }

  return (
    <DashboardBuilderContext.Provider value={{ activeDashboard, activeArtifactId, returnView, setActive, clearActive, patchCells, replaceDashboard }}>
      {children}
    </DashboardBuilderContext.Provider>
  );
}

export function useDashboardBuilder() {
  const ctx = useContext(DashboardBuilderContext);
  if (!ctx) throw new Error('useDashboardBuilder must be used inside DashboardBuilderProvider');
  return ctx;
}
