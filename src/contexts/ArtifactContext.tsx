'use client';

import { createContext, useContext, useState, type ReactNode } from 'react';
import type { SavedArtifact, ArtifactType, ArtifactCategory } from '@/lib/types';
import rawArtifacts from '@/fixtures/artifacts-preseeded.json';

function normalizeArtifacts(): SavedArtifact[] {
  return rawArtifacts.artifacts.map((a) => ({
    id: a.id,
    type: a.type as ArtifactType,
    category: 'other' as ArtifactCategory,
    title: a.title,
    description: a.description,
    savedAt: new Date(a.savedAt).getTime(),
    sourceWidget: {
      widgetType: a.sourceWidget,
      data: {},
    },
    thumbnail: a.thumbnail,
  }));
}

interface ArtifactContextValue {
  artifacts: SavedArtifact[];
  addArtifact: (artifact: SavedArtifact) => void;
  removeArtifact: (id: string) => void;
  updateArtifact: (id: string, patch: Partial<SavedArtifact>) => void;
}

const ArtifactContext = createContext<ArtifactContextValue | null>(null);

export function ArtifactProvider({ children }: { children: ReactNode }) {
  const [artifacts, setArtifacts] = useState<SavedArtifact[]>(normalizeArtifacts);

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
    <ArtifactContext.Provider value={{ artifacts, addArtifact, removeArtifact, updateArtifact }}>
      {children}
    </ArtifactContext.Provider>
  );
}

export function useArtifacts() {
  const ctx = useContext(ArtifactContext);
  if (!ctx) throw new Error('useArtifacts must be used inside ArtifactProvider');
  return ctx;
}
