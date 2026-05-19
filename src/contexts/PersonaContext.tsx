'use client';

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { Personality, PersonalityId, VoiceOption } from '@/lib/types';
import rawPersonas from '@/fixtures/personas.json';

function normalizePersonalities(): Personality[] {
  const variantMap: Record<PersonalityId, Personality['closingTextVariant']> = {
    professional: 'formal',
    friendly: 'friendly',
    executive: 'short',
  };

  return rawPersonas.personalities.map((p) => ({
    id: p.id as PersonalityId,
    label: p.name,
    description: p.description,
    systemPromptSuffix: p.systemPromptModifier,
    closingTextVariant: variantMap[p.id as PersonalityId] ?? 'friendly',
  }));
}

function normalizeVoices(): (VoiceOption & { description: string })[] {
  return rawPersonas.voices.map((v) => ({
    id: v.id,
    label: v.name,
    lang: 'en-US',
    description: v.description,
  }));
}

const PERSONALITIES = normalizePersonalities();
const VOICES = normalizeVoices();

const DEFAULT_PERSONALITY = PERSONALITIES.find((p) => p.id === 'friendly') ?? PERSONALITIES[0];
const DEFAULT_VOICE = VOICES[0];

interface PersonaContextValue {
  selectedPersonality: Personality;
  selectedVoice: VoiceOption;
  personalities: Personality[];
  voices: VoiceOption[];
  setPersonality: (personality: Personality) => void;
  setVoice: (voice: VoiceOption) => void;
  renamePersonality: (id: string, newLabel: string) => void;
}

const PersonaContext = createContext<PersonaContextValue | null>(null);

const LS_PERSONALITY = 'kai-persona-id';
const LS_VOICE = 'kai-voice-id';

export function PersonaProvider({ children }: { children: ReactNode }) {
  const [selectedPersonality, setSelectedPersonality] = useState<Personality>(DEFAULT_PERSONALITY);
  const [selectedVoice, setSelectedVoice] = useState<VoiceOption>(DEFAULT_VOICE);
  const [personalities, setPersonalities] = useState<Personality[]>(PERSONALITIES);

  // Hydrate from localStorage after mount (avoids SSR/client mismatch)
  useEffect(() => {
    try {
      const pid = localStorage.getItem(LS_PERSONALITY);
      if (pid) {
        const p = PERSONALITIES.find((x) => x.id === pid);
        if (p) setSelectedPersonality(p);
      }
      const vid = localStorage.getItem(LS_VOICE);
      if (vid) {
        const v = VOICES.find((x) => x.id === vid);
        if (v) setSelectedVoice(v);
      }
    } catch {}
  }, []);

  useEffect(() => {
    try { localStorage.setItem(LS_PERSONALITY, selectedPersonality.id); } catch {}
  }, [selectedPersonality]);

  useEffect(() => {
    try { localStorage.setItem(LS_VOICE, selectedVoice.id); } catch {}
  }, [selectedVoice]);

  function setPersonality(p: Personality) {
    setSelectedPersonality(p);
  }

  function setVoice(v: VoiceOption) {
    setSelectedVoice(v);
  }

  function renamePersonality(id: string, newLabel: string) {
    setPersonalities((prev) =>
      prev.map((p) => (p.id === id ? { ...p, label: newLabel } : p)),
    );
    setSelectedPersonality((prev) => (prev.id === id ? { ...prev, label: newLabel } : prev));
  }

  return (
    <PersonaContext.Provider
      value={{
        selectedPersonality,
        selectedVoice,
        personalities,
        voices: VOICES,
        setPersonality,
        setVoice,
        renamePersonality,
      }}
    >
      {children}
    </PersonaContext.Provider>
  );
}

export function usePersona() {
  const ctx = useContext(PersonaContext);
  if (!ctx) throw new Error('usePersona must be used inside PersonaProvider');
  return ctx;
}
