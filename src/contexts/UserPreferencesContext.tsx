'use client';

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

const LS_KEY = 'kai_user_prefs_v1';

interface UserPreferencesState {
  // Behavioral prefs (consumed by widgets + ChatShell)
  autoExpandReasoning: boolean;
  proactiveAssistance: boolean;
  includeFinancial: boolean;
  readAloud: boolean;
  showConfidence: boolean;
  autoSendVoice: boolean;
  notificationSounds: boolean;
  showContactInfo: boolean;
  requireConfirmation: boolean;
  autoSaveArtifacts: boolean;
  // Custom instructions (injected into LLM)
  customInstructions: string;
  // Setters
  setAutoExpandReasoning: (v: boolean) => void;
  setProactiveAssistance: (v: boolean) => void;
  setIncludeFinancial: (v: boolean) => void;
  setReadAloud: (v: boolean) => void;
  setShowConfidence: (v: boolean) => void;
  setAutoSendVoice: (v: boolean) => void;
  setNotificationSounds: (v: boolean) => void;
  setShowContactInfo: (v: boolean) => void;
  setRequireConfirmation: (v: boolean) => void;
  setAutoSaveArtifacts: (v: boolean) => void;
  setCustomInstructions: (v: string) => void;
}

const DEFAULTS = {
  autoExpandReasoning: false,
  proactiveAssistance: true,
  includeFinancial: true,
  readAloud: false,
  showConfidence: true,
  autoSendVoice: true,
  notificationSounds: true,
  showContactInfo: true,
  requireConfirmation: true,
  autoSaveArtifacts: false,
  customInstructions: '',
};

const UserPreferencesContext = createContext<UserPreferencesState | null>(null);

export function UserPreferencesProvider({ children }: { children: ReactNode }) {
  const [autoExpandReasoning, setAutoExpandReasoningState] = useState(DEFAULTS.autoExpandReasoning);
  const [proactiveAssistance, setProactiveAssistanceState] = useState(DEFAULTS.proactiveAssistance);
  const [includeFinancial, setIncludeFinancialState] = useState(DEFAULTS.includeFinancial);
  const [readAloud, setReadAloudState] = useState(DEFAULTS.readAloud);
  const [showConfidence, setShowConfidenceState] = useState(DEFAULTS.showConfidence);
  const [autoSendVoice, setAutoSendVoiceState] = useState(DEFAULTS.autoSendVoice);
  const [notificationSounds, setNotificationSoundsState] = useState(DEFAULTS.notificationSounds);
  const [showContactInfo, setShowContactInfoState] = useState(DEFAULTS.showContactInfo);
  const [requireConfirmation, setRequireConfirmationState] = useState(DEFAULTS.requireConfirmation);
  const [autoSaveArtifacts, setAutoSaveArtifactsState] = useState(DEFAULTS.autoSaveArtifacts);
  const [customInstructions, setCustomInstructionsState] = useState(DEFAULTS.customInstructions);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        const p = JSON.parse(raw);
        if (typeof p.autoExpandReasoning === 'boolean') setAutoExpandReasoningState(p.autoExpandReasoning);
        if (typeof p.proactiveAssistance === 'boolean') setProactiveAssistanceState(p.proactiveAssistance);
        if (typeof p.includeFinancial === 'boolean') setIncludeFinancialState(p.includeFinancial);
        if (typeof p.readAloud === 'boolean') setReadAloudState(p.readAloud);
        if (typeof p.showConfidence === 'boolean') setShowConfidenceState(p.showConfidence);
        if (typeof p.autoSendVoice === 'boolean') setAutoSendVoiceState(p.autoSendVoice);
        if (typeof p.notificationSounds === 'boolean') setNotificationSoundsState(p.notificationSounds);
        if (typeof p.showContactInfo === 'boolean') setShowContactInfoState(p.showContactInfo);
        if (typeof p.requireConfirmation === 'boolean') setRequireConfirmationState(p.requireConfirmation);
        if (typeof p.autoSaveArtifacts === 'boolean') setAutoSaveArtifactsState(p.autoSaveArtifacts);
        if (typeof p.customInstructions === 'string') setCustomInstructionsState(p.customInstructions);
      }
    } catch {
      // ignore
    }
  }, []);

  function persist(patch: Partial<typeof DEFAULTS>) {
    try {
      const existing = JSON.parse(localStorage.getItem(LS_KEY) ?? '{}');
      localStorage.setItem(LS_KEY, JSON.stringify({ ...existing, ...patch }));
    } catch {
      // ignore
    }
  }

  function setAutoExpandReasoning(v: boolean) {
    setAutoExpandReasoningState(v);
    persist({ autoExpandReasoning: v });
  }
  function setProactiveAssistance(v: boolean) {
    setProactiveAssistanceState(v);
    persist({ proactiveAssistance: v });
  }
  function setIncludeFinancial(v: boolean) {
    setIncludeFinancialState(v);
    persist({ includeFinancial: v });
  }
  function setReadAloud(v: boolean) {
    setReadAloudState(v);
    persist({ readAloud: v });
  }
  function setShowConfidence(v: boolean) {
    setShowConfidenceState(v);
    persist({ showConfidence: v });
  }
  function setAutoSendVoice(v: boolean) {
    setAutoSendVoiceState(v);
    persist({ autoSendVoice: v });
  }
  function setNotificationSounds(v: boolean) {
    setNotificationSoundsState(v);
    persist({ notificationSounds: v });
  }
  function setShowContactInfo(v: boolean) {
    setShowContactInfoState(v);
    persist({ showContactInfo: v });
  }
  function setRequireConfirmation(v: boolean) {
    setRequireConfirmationState(v);
    persist({ requireConfirmation: v });
  }
  function setAutoSaveArtifacts(v: boolean) {
    setAutoSaveArtifactsState(v);
    persist({ autoSaveArtifacts: v });
  }
  function setCustomInstructions(v: string) {
    const clamped = v.slice(0, 500);
    setCustomInstructionsState(clamped);
    persist({ customInstructions: clamped });
  }

  return (
    <UserPreferencesContext.Provider value={{
      autoExpandReasoning, proactiveAssistance, includeFinancial, readAloud,
      showConfidence, autoSendVoice, notificationSounds, showContactInfo,
      requireConfirmation, autoSaveArtifacts, customInstructions,
      setAutoExpandReasoning, setProactiveAssistance, setIncludeFinancial, setReadAloud,
      setShowConfidence, setAutoSendVoice, setNotificationSounds, setShowContactInfo,
      setRequireConfirmation, setAutoSaveArtifacts, setCustomInstructions,
    }}>
      {children}
    </UserPreferencesContext.Provider>
  );
}

export function useUserPreferences() {
  const ctx = useContext(UserPreferencesContext);
  if (!ctx) throw new Error('useUserPreferences must be used inside UserPreferencesProvider');
  return ctx;
}
