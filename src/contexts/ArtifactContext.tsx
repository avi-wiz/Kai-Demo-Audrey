'use client';

import { createContext, useContext, useState, type ReactNode } from 'react';
import type { SavedArtifact, ArtifactType, ArtifactCategory } from '@/lib/types';
import rawArtifacts from '@/fixtures/artifacts-preseeded.json';

interface RawArtifact {
  id: string;
  type: string;
  category?: string;
  title: string;
  description: string;
  savedAt: string;
  sourceWidget: string | { widgetType: string; data?: Record<string, unknown>; config?: Record<string, unknown> };
  thumbnail?: string;
  data?: Record<string, unknown>;
  config?: Record<string, unknown>;
}

function normalizeArtifacts(): SavedArtifact[] {
  return (rawArtifacts.artifacts as RawArtifact[]).map((a) => {
    // Support both legacy string form and the new {widgetType, data, config} object form
    const sw = typeof a.sourceWidget === 'string'
      ? { widgetType: a.sourceWidget, data: a.data ?? {}, config: a.config }
      : { widgetType: a.sourceWidget.widgetType, data: a.sourceWidget.data ?? a.data ?? {}, config: a.sourceWidget.config ?? a.config };
    return {
      id: a.id,
      type: a.type as ArtifactType,
      category: (a.category as ArtifactCategory) ?? ('other' as ArtifactCategory),
      title: a.title,
      description: a.description,
      savedAt: new Date(a.savedAt).getTime(),
      sourceWidget: sw,
      thumbnail: a.thumbnail,
    };
  });
}

interface ArtifactContextValue {
  artifacts: SavedArtifact[];
  addArtifact: (artifact: SavedArtifact) => void;
  removeArtifact: (id: string) => void;
  updateArtifact: (id: string, patch: Partial<SavedArtifact>) => void;
  activeArtifactId: string | null;
  setActiveArtifactId: (id: string | null) => void;
}

const ArtifactContext = createContext<ArtifactContextValue | null>(null);

export function ArtifactProvider({ children }: { children: ReactNode }) {
  const [artifacts, setArtifacts] = useState<SavedArtifact[]>(normalizeArtifacts);
  const [activeArtifactId, setActiveArtifactId] = useState<string | null>(null);

  function addArtifact(artifact: SavedArtifact) {
    setArtifacts((prev) => [artifact, ...prev]);
  }

  function removeArtifact(id: string) {
    setArtifacts((prev) => prev.filter((a) => a.id !== id));
  }

  function updateArtifact(id: string, patch: Partial<SavedArtifact>) {
    setArtifacts((prev) => prev.map((a) => (a.id === id ? { ...a, ...patch } : a)));
  }

  return (
    <ArtifactContext.Provider value={{
      artifacts, addArtifact, removeArtifact, updateArtifact,
      activeArtifactId, setActiveArtifactId,
    }}>
      {children}
    </ArtifactContext.Provider>
  );
}

export function useArtifacts() {
  const ctx = useContext(ArtifactContext);
  if (!ctx) throw new Error('useArtifacts must be used inside ArtifactProvider');
  return ctx;
}
