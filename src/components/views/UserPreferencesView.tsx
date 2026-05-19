'use client';

import { useState, useEffect, useRef } from 'react';
import { useResponseMode } from '@/contexts/ResponseModeContext';
import { useUserPreferences } from '@/contexts/UserPreferencesContext';
import { unlockAudio } from '@/hooks/useVoice';

interface ToggleProps {
  checked: boolean;
  disabled?: boolean;
  onChange: (v: boolean) => void;
}

function Toggle({ checked, disabled = false, onChange }: ToggleProps) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      style={{
        flexShrink: 0,
        width: 44,
        height: 24,
        borderRadius: 12,
        border: 'none',
        cursor: disabled ? 'not-allowed' : 'pointer',
        background: checked ? 'var(--primary-80, #4f46e5)' : 'var(--border2, #d1d5db)',
        opacity: disabled ? 0.45 : 1,
        position: 'relative',
        transition: 'background 200ms ease',
        padding: 0,
      }}
    >
      <span
        style={{
          position: 'absolute',
          top: 4,
          left: checked ? 23 : 4,
          width: 16,
          height: 16,
          borderRadius: '50%',
          background: 'white',
          boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
          transition: 'left 200ms ease',
        }}
      />
    </button>
  );
}

interface WarningBannerProps {
  onConfirm: () => void;
  onCancel: () => void;
}

function WarningBanner({ onConfirm, onCancel }: WarningBannerProps) {
  return (
    <div style={{
      marginTop: 10,
      padding: '10px 14px',
      background: 'rgba(239,68,68,0.06)',
      border: '1px solid rgba(239,68,68,0.25)',
      borderRadius: 8,
      display: 'flex',
      alignItems: 'flex-start',
      gap: 10,
    }}>
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, marginTop: 1 }}>
        <path d="M8 2L14 13H2L8 2Z" stroke="#ef4444" strokeWidth="1.4" strokeLinejoin="round" />
        <path d="M8 7v3" stroke="#ef4444" strokeWidth="1.4" strokeLinecap="round" />
        <circle cx="8" cy="11.5" r="0.75" fill="#ef4444" />
      </svg>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontFamily: 'var(--sans)', fontSize: 12, color: 'var(--text2)', margin: '0 0 10px', lineHeight: 1.5 }}>
          Disabling this allows Kai to execute actions without confirmation. Are you sure?
        </p>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={onConfirm}
            style={{
              padding: '5px 14px',
              background: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: 6,
              fontFamily: 'var(--display)',
              fontWeight: 600,
              fontSize: 12,
              cursor: 'pointer',
            }}
          >
            Confirm
          </button>
          <button
            onClick={onCancel}
            style={{
              padding: '5px 14px',
              background: 'var(--surface2)',
              color: 'var(--text2)',
              border: '1px solid var(--border)',
              borderRadius: 6,
              fontFamily: 'var(--display)',
              fontWeight: 600,
              fontSize: 12,
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

interface PrefRowProps {
  label: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (v: boolean) => void;
  warning?: React.ReactNode;
  isLast?: boolean;
}

function PrefRow({ label, description, checked, disabled = false, onChange, warning, isLast = false }: PrefRowProps) {
  return (
    <div style={{ padding: '12px 0', borderBottom: isLast ? 'none' : '1px solid var(--border)' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 20 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontFamily: 'var(--display)', fontWeight: 600, fontSize: 13.5, color: 'var(--text)', margin: '0 0 3px' }}>
            {label}
          </p>
          <p style={{ fontFamily: 'var(--sans)', fontSize: 12, color: 'var(--text2)', margin: 0, lineHeight: 1.5, maxWidth: 480 }}>
            {description}
          </p>
        </div>
        <Toggle checked={checked} disabled={disabled} onChange={onChange} />
      </div>
      {warning}
    </div>
  );
}

interface SectionProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}

function Section({ title, subtitle, children }: SectionProps) {
  return (
    <section style={{ marginBottom: 24 }}>
      <div style={{ marginBottom: 14 }}>
        <p style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 15, color: 'var(--text)', margin: '0 0 3px' }}>
          {title}
        </p>
        <p style={{ fontFamily: 'var(--sans)', fontSize: 12, color: 'var(--text3)', margin: 0 }}>
          {subtitle}
        </p>
      </div>
      <div style={{ border: '1px solid var(--border)', borderRadius: 10, padding: '0 16px', background: 'var(--surface)' }}>
        {children}
      </div>
    </section>
  );
}

const MAX_CHARS = 500;

function CustomInstructionsSection() {
  const { customInstructions, setCustomInstructions } = useUserPreferences();
  const [draft, setDraft] = useState(customInstructions);
  const [saved, setSaved] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setDraft(customInstructions);
  }, [customInstructions]);

  function handleChange(v: string) {
    const clamped = v.slice(0, MAX_CHARS);
    setDraft(clamped);
    setSaved(false);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setCustomInstructions(clamped);
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    }, 2000);
  }

  function handleSave() {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setCustomInstructions(draft);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  const count = draft.length;

  return (
    <section style={{ marginBottom: 24 }}>
      <div style={{ marginBottom: 14 }}>
        <p style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 15, color: 'var(--text)', margin: '0 0 3px' }}>
          Custom Instructions
        </p>
        <p style={{ fontFamily: 'var(--sans)', fontSize: 12, color: 'var(--text3)', margin: 0 }}>
          Tell Kai how to behave across all conversations
        </p>
      </div>
      <div style={{ border: '1px solid var(--border)', borderRadius: 10, padding: 16, background: 'var(--surface)' }}>
        <textarea
          value={draft}
          onChange={(e) => handleChange(e.target.value)}
          placeholder={`Tell Kai how you'd like it to behave. For example: "Only use bar charts, never pie charts. Start every response with a one-sentence summary. Show revenue in thousands ($32.4K). Keep responses under 100 words."`}
          style={{
            width: '100%',
            minHeight: 120,
            maxHeight: 300,
            resize: 'vertical',
            fontFamily: 'var(--mono)',
            fontSize: 13,
            color: 'var(--text)',
            background: 'var(--surface2)',
            border: '1px solid var(--border)',
            borderRadius: 8,
            padding: '10px 12px',
            outline: 'none',
            lineHeight: 1.6,
            boxSizing: 'border-box',
            transition: 'border-color 150ms ease',
          }}
          onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(91,106,240,0.5)'; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; }}
        />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
          <span style={{
            fontFamily: 'var(--sans)', fontSize: 11.5,
            color: count >= MAX_CHARS ? '#ef4444' : 'var(--text3)',
          }}>
            {count} / {MAX_CHARS} characters
          </span>
          <button
            onClick={handleSave}
            style={{
              height: 30, padding: '0 14px',
              background: saved ? 'rgba(22,136,95,0.1)' : 'var(--primary-80)',
              color: saved ? 'var(--primary-80)' : '#fff',
              border: saved ? '1px solid rgba(22,136,95,0.3)' : 'none',
              borderRadius: 6,
              fontFamily: 'var(--display)', fontWeight: 600, fontSize: 12,
              cursor: 'pointer', transition: 'all 150ms ease',
            }}
          >
            {saved ? 'Saved' : 'Save'}
          </button>
        </div>
      </div>
    </section>
  );
}

export default function UserPreferencesView() {
  const { mode: responseMode, setMode: setResponseMode } = useResponseMode();
  const {
    autoExpandReasoning, setAutoExpandReasoning,
    proactiveAssistance, setProactiveAssistance,
    includeFinancial, setIncludeFinancial,
    readAloud, setReadAloud,
    showConfidence, setShowConfidence,
    autoSendVoice, setAutoSendVoice,
    notificationSounds, setNotificationSounds,
    showContactInfo, setShowContactInfo,
    requireConfirmation, setRequireConfirmation,
    autoSaveArtifacts, setAutoSaveArtifacts,
  } = useUserPreferences();
  const [showConfirmWarning, setShowConfirmWarning] = useState(false);

  function handleRequireConfirmationChange(v: boolean) {
    if (!v) {
      setShowConfirmWarning(true);
    } else {
      setRequireConfirmation(true);
    }
  }

  const showWidgets = responseMode === 'text-widget';

  return (
    <div className="flex-1 overflow-y-auto" style={{ padding: '32px 40px' }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 18, color: 'var(--text)', margin: '0 0 4px' }}>
          User Preferences
        </h1>
        <p style={{ fontFamily: 'var(--sans)', fontSize: 13, color: 'var(--text2)', margin: 0 }}>
          Control how Kai works for you
        </p>
      </div>

      <div style={{ maxWidth: 560 }}>
        <CustomInstructionsSection />

        {/* Section 1: Response Display */}
        <Section title="Response Display" subtitle="How Kai presents information">
          <PrefRow
            label="Show widgets alongside text"
            description="When enabled, Kai renders interactive charts, cards, and forms alongside text responses. When disabled, Kai responds with text only."
            checked={showWidgets}
            onChange={(v) => setResponseMode(v ? 'text-widget' : 'text-only')}
          />
          <PrefRow
            label="Auto-expand Agent Reasoning"
            description="Show Kai's step-by-step thinking process expanded by default. Useful for understanding how Kai arrived at an answer."
            checked={autoExpandReasoning}
            onChange={setAutoExpandReasoning}
          />
          <PrefRow
            label="Show confidence scores"
            description="Display a confidence indicator on knowledge base answers, showing how certain Kai is about its response."
            checked={showConfidence}
            onChange={setShowConfidence}
            isLast
          />
        </Section>

        {/* Section 2: Voice & Audio */}
        <Section title="Voice & Audio" subtitle="How Kai communicates">
          <PrefRow
            label="Read responses aloud"
            description="Kai will speak its text response after displaying widgets. Uses your device's text-to-speech engine."
            checked={readAloud}
            onChange={(v) => {
              setReadAloud(v);
              if (v) unlockAudio();
            }}
          />
          <PrefRow
            label="Auto-send after speaking"
            description="When using voice input, automatically send your message after 2 seconds of silence. Disable to review before sending."
            checked={autoSendVoice}
            onChange={setAutoSendVoice}
          />
          <PrefRow
            label="Notification sounds"
            description="Play a subtle sound when Kai finishes generating a response."
            checked={notificationSounds}
            onChange={setNotificationSounds}
            isLast
          />
        </Section>

        {/* Section 3: Data & Privacy */}
        <Section title="Data & Privacy" subtitle="What Kai can access in responses">
          <PrefRow
            label="Include customer financial data"
            description="Allow Kai to show credit limits, account balances, and payment history in customer lookups. Disable for privacy."
            checked={includeFinancial}
            onChange={setIncludeFinancial}
          />
          <PrefRow
            label="Show contact information"
            description="Display email addresses and phone numbers in customer cards. Disable if you prefer to access contacts separately."
            checked={showContactInfo}
            onChange={setShowContactInfo}
            isLast
          />
        </Section>

        {/* Section 4: Workflow */}
        <Section title="Workflow" subtitle="How Kai handles tasks and actions">
          <PrefRow
            label="Proactive assistance"
            description="Show Kai's contextual brief at the start of each new conversation — a quick summary of what needs your attention based on the current page."
            checked={proactiveAssistance}
            onChange={setProactiveAssistance}
          />
          <PrefRow
            label="Require confirmation for all actions"
            description="Kai will always ask for your explicit approval before creating, updating, or deleting anything. Strongly recommended."
            checked={requireConfirmation}
            onChange={handleRequireConfirmationChange}
            warning={showConfirmWarning ? (
              <WarningBanner
                onConfirm={() => { setRequireConfirmation(false); setShowConfirmWarning(false); }}
                onCancel={() => setShowConfirmWarning(false)}
              />
            ) : undefined}
          />
          <PrefRow
            label="Auto-save artifacts"
            description="Automatically save charts and reports to My Artifacts when Kai generates them. You can always remove them later."
            checked={autoSaveArtifacts}
            onChange={setAutoSaveArtifacts}
            isLast
          />
        </Section>
      </div>
    </div>
  );
}
