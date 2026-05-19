'use client';

import { useState, useRef, useEffect } from 'react';
import { usePersona } from '@/contexts/PersonaContext';
import { useToast } from '@/contexts/ToastContext';
import { useGuidedTour } from '@/contexts/GuidedTourContext';
import type { Personality, VoiceOption } from '@/lib/types';

const PERSONA_ICONS: Record<string, string> = {
  professional: '💼',
  friendly: '😊',
  executive: '👑',
};

function EditIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path
        d="M9.5 2.5l2 2-7 7H2.5v-2l7-7zM8.5 3.5l2 2"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PersonaCard({
  persona,
  selected,
  isEditing,
  onSelect,
  onStartEdit,
}: {
  persona: Personality;
  selected: boolean;
  isEditing: boolean;
  onSelect: () => void;
  onStartEdit: () => void;
}) {
  const { renamePersonality } = usePersona();
  const { showToast } = useToast();
  const [draft, setDraft] = useState(persona.label);
  const inputRef = useRef<HTMLInputElement>(null);
  const icon = PERSONA_ICONS[persona.id] ?? '✦';

  useEffect(() => {
    if (isEditing) {
      setDraft(persona.label);
      // rAF so the input is in the DOM before we focus
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [isEditing, persona.label]);

  function confirm() {
    const trimmed = draft.trim();
    if (trimmed && trimmed !== persona.label) {
      renamePersonality(persona.id, trimmed);
      showToast(`Persona renamed to '${trimmed}'`);
    }
    onStartEdit(); // exit edit mode (parent clears editing id)
  }

  function cancel() {
    setDraft(persona.label);
    onStartEdit(); // exit
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') { e.preventDefault(); confirm(); }
    if (e.key === 'Escape') { e.preventDefault(); cancel(); }
  }

  return (
    <div
      onClick={!isEditing ? onSelect : undefined}
      style={{
        flex: 1,
        position: 'relative',
        background: 'var(--surface)',
        border: `1.5px solid ${selected ? 'var(--primary-80)' : 'var(--border)'}`,
        borderRadius: 12,
        padding: 20,
        cursor: isEditing ? 'default' : 'pointer',
        boxShadow: selected ? '0 0 0 3px var(--primary-10, rgba(99,102,241,0.12))' : 'none',
        transition: 'all 150ms ease',
        animation: selected && !isEditing ? 'personaBounce 300ms ease' : 'none',
      }}
    >
      <style>{`
        @keyframes personaBounce {
          0%, 100% { transform: scale(1); }
          50%      { transform: scale(1.02); }
        }
      `}</style>

      {selected && !isEditing && (
        <div
          style={{
            position: 'absolute',
            top: 10,
            right: 10,
            width: 18,
            height: 18,
            borderRadius: '50%',
            background: 'var(--primary-80)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M2 5l2.5 2.5L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      )}

      <div style={{ fontSize: 24, marginBottom: 10 }}>{icon}</div>

      {/* Name row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
        {isEditing ? (
          <>
            <input
              ref={inputRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={handleKeyDown}
              onClick={(e) => e.stopPropagation()}
              style={{
                fontFamily: 'var(--display)',
                fontWeight: 700,
                fontSize: 15,
                color: 'var(--text)',
                background: 'transparent',
                border: 'none',
                borderBottom: '2px solid var(--primary-80)',
                outline: 'none',
                padding: '0 2px 2px',
                width: '100%',
                minWidth: 0,
              }}
            />
            {/* Confirm */}
            <button
              onClick={(e) => { e.stopPropagation(); confirm(); }}
              title="Confirm"
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary-80)', padding: 2, flexShrink: 0, lineHeight: 1 }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M3 8l3.5 3.5L13 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            {/* Cancel */}
            <button
              onClick={(e) => { e.stopPropagation(); cancel(); }}
              title="Cancel"
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', padding: 2, flexShrink: 0, lineHeight: 1 }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </button>
          </>
        ) : (
          <>
            <p style={{ fontFamily: 'var(--display)', fontWeight: 600, fontSize: 15, color: 'var(--text)', margin: 0 }}>
              {persona.label}
            </p>
            <button
              onClick={(e) => { e.stopPropagation(); onStartEdit(); }}
              title="Rename persona"
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text3)',
                padding: 2,
                flexShrink: 0,
                lineHeight: 1,
                display: 'flex',
                alignItems: 'center',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text2)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text3)')}
            >
              <EditIcon />
            </button>
          </>
        )}
      </div>

      <p style={{ fontSize: 12, fontFamily: 'var(--sans)', color: 'var(--text2)', margin: 0, lineHeight: 1.6 }}>
        {persona.description}
      </p>
    </div>
  );
}

function VoiceCard({ voice, selected, onSelect }: { voice: VoiceOption; selected: boolean; onSelect: () => void }) {
  return (
    <div
      onClick={onSelect}
      style={{
        flex: 1,
        position: 'relative',
        background: 'var(--surface)',
        border: `1.5px solid ${selected ? 'var(--primary-80)' : 'var(--border)'}`,
        borderRadius: 10,
        padding: 16,
        cursor: 'pointer',
        boxShadow: selected ? '0 0 0 3px var(--primary-10, rgba(99,102,241,0.12))' : 'none',
        transition: 'border-color 150ms ease, box-shadow 150ms ease',
      }}
    >
      {selected && (
        <div
          style={{
            position: 'absolute',
            top: 10,
            right: 10,
            width: 16,
            height: 16,
            borderRadius: '50%',
            background: 'var(--primary-80)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <svg width="9" height="9" viewBox="0 0 10 10" fill="none">
            <path d="M2 5l2.5 2.5L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      )}
      <p style={{ fontFamily: 'var(--display)', fontWeight: 600, fontSize: 14, color: 'var(--text)', margin: '0 0 4px' }}>
        {voice.label}
      </p>
      <p style={{ fontSize: 11.5, fontFamily: 'var(--sans)', color: 'var(--text2)', margin: 0, lineHeight: 1.5 }}>
        {(voice as VoiceOption & { description: string }).description}
      </p>
    </div>
  );
}

function SectionHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <p style={{ fontFamily: 'var(--display)', fontWeight: 600, fontSize: 11, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 4px' }}>
        {title}
      </p>
      <p style={{ fontSize: 13, fontFamily: 'var(--sans)', color: 'var(--text3)', margin: 0 }}>
        {subtitle}
      </p>
    </div>
  );
}

export default function SettingsView() {
  const { personalities, voices, selectedPersonality, selectedVoice, setPersonality, setVoice } = usePersona();
  const [editingId, setEditingId] = useState<string | null>(null);
  const { startTour } = useGuidedTour();

  function handleStartEdit(id: string) {
    setEditingId((prev) => (prev === id ? null : id));
  }

  return (
    <div className="flex-1 overflow-y-auto" style={{ padding: '32px 40px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
        <h1 style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 18, color: 'var(--text)', margin: 0 }}>
          Settings
        </h1>
        <button
          onClick={startTour}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            height: 34,
            padding: '0 14px',
            background: 'var(--surface2)',
            border: '1px solid var(--border)',
            borderRadius: 8,
            fontFamily: 'var(--display)',
            fontWeight: 600,
            fontSize: 12.5,
            color: 'var(--text2)',
            cursor: 'pointer',
            transition: 'border-color 150ms ease, color 150ms ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--primary-80)';
            e.currentTarget.style.color = 'var(--primary-80)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--border)';
            e.currentTarget.style.color = 'var(--text2)';
          }}
        >
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.4" />
            <path d="M8 5v1.5M8 8.5v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          Take a Tour
        </button>
      </div>

      {/* Personality section */}
      <section style={{ marginBottom: 36 }}>
        <SectionHeader title="Personality" subtitle="Choose how Kai communicates" />
        <div style={{ display: 'flex', gap: 16 }}>
          {personalities.map((p) => (
            <PersonaCard
              key={p.id}
              persona={p}
              selected={selectedPersonality.id === p.id}
              isEditing={editingId === p.id}
              onSelect={() => { if (editingId !== p.id) setPersonality(p); }}
              onStartEdit={() => handleStartEdit(p.id)}
            />
          ))}
        </div>
      </section>

      {/* Voice section */}
      <section>
        <SectionHeader title="Voice" subtitle="Choose Kai's speaking voice" />
        <div style={{ display: 'flex', gap: 16 }}>
          {voices.map((v) => (
            <VoiceCard
              key={v.id}
              voice={v}
              selected={selectedVoice.id === v.id}
              onSelect={() => setVoice(v)}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
