'use client';

import { useState } from 'react';
import { usePersona } from '@/contexts/PersonaContext';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { usePageContext } from '@/contexts/PageContext';
import ProactiveBriefCard from '@/components/chat/ProactiveBriefCard';
import type { Personality } from '@/lib/types';

// ── Step indicators ────────────────────────────────────────────────────────────

function StepDots({ step, total }: { step: number; total: number }) {
  return (
    <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 32 }}>
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          style={{
            width: i === step ? 20 : 6,
            height: 6,
            borderRadius: 99,
            background: i === step
              ? 'var(--primary-80)'
              : i < step
              ? 'rgba(22,136,95,0.3)'
              : 'var(--border2)',
            transition: 'width 250ms ease, background 250ms ease',
          }}
        />
      ))}
    </div>
  );
}

// ── Persona icon SVGs ─────────────────────────────────────────────────────────

function PersonaIcon({ icon, size = 20 }: { icon: string; size?: number }) {
  const s: React.CSSProperties = { flexShrink: 0 };
  if (icon === 'briefcase') return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" style={s}>
      <rect x="2" y="7" width="16" height="11" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M7 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M2 12h16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
  if (icon === 'smile') return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" style={s}>
      <circle cx="10" cy="10" r="7.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M7 12.5s1 1.5 3 1.5 3-1.5 3-1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="7.5" cy="8.5" r="1" fill="currentColor" />
      <circle cx="12.5" cy="8.5" r="1" fill="currentColor" />
    </svg>
  );
  // crown
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" style={s}>
      <path d="M2 14h16M3 14l2-7 5 4 5-4 2 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="10" cy="5" r="1.2" fill="currentColor" />
    </svg>
  );
}

// ── Step 1: Meet Kai ──────────────────────────────────────────────────────────

function StepMeetKai({ onNext }: { onNext: () => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
      {/* Large avatar with glow */}
      <div style={{ position: 'relative', marginBottom: 28 }}>
        <div style={{
          position: 'absolute',
          inset: -12,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(91,106,240,0.18) 0%, transparent 70%)',
          animation: 'kaiGlow 2.5s ease-in-out infinite',
        }} />
        <div style={{
          width: 72,
          height: 72,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, rgba(91,106,240,0.9) 0%, rgba(22,136,95,0.8) 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 0 4px rgba(91,106,240,0.12), 0 8px 24px rgba(91,106,240,0.2)',
          position: 'relative',
          zIndex: 1,
        }}>
          <span style={{
            fontSize: 28,
            fontWeight: 800,
            color: 'white',
            fontFamily: 'var(--display)',
            lineHeight: 1,
          }}>K</span>
        </div>
      </div>

      <h2 style={{
        fontFamily: 'var(--display)',
        fontWeight: 800,
        fontSize: 24,
        color: 'var(--text)',
        margin: '0 0 12px',
        lineHeight: 1.2,
      }}>
        Hi, I&apos;m Kai
      </h2>

      <p style={{
        fontFamily: 'var(--sans)',
        fontSize: 15,
        color: 'var(--text2)',
        lineHeight: 1.65,
        margin: '0 0 8px',
        maxWidth: 380,
      }}>
        Your AI sales assistant inside WizOrder. I help with customer lookups, order creation, meeting prep, email drafts, and more.
      </p>

      <p style={{
        fontFamily: 'var(--sans)',
        fontSize: 14,
        color: 'var(--text3)',
        margin: '0 0 36px',
      }}>
        Let&apos;s set me up for you.
      </p>

      <button
        onClick={onNext}
        style={{
          height: 44,
          padding: '0 32px',
          background: 'var(--primary-80)',
          color: 'white',
          border: 'none',
          borderRadius: 10,
          fontFamily: 'var(--display)',
          fontWeight: 700,
          fontSize: 15,
          cursor: 'pointer',
          boxShadow: '0 2px 8px rgba(22,136,95,0.25)',
          transition: 'opacity 150ms ease',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.88'; }}
        onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
      >
        Let&apos;s get started →
      </button>
    </div>
  );
}

// ── Step 2: Choose persona ────────────────────────────────────────────────────

function StepChoosePersona({
  onNext,
  onSkip,
}: {
  onNext: () => void;
  onSkip: () => void;
}) {
  const { personalities, selectedPersonality, setPersonality } = usePersona();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <h2 style={{
        fontFamily: 'var(--display)',
        fontWeight: 800,
        fontSize: 22,
        color: 'var(--text)',
        margin: '0 0 8px',
        textAlign: 'center',
      }}>
        Choose Your Style
      </h2>
      <p style={{
        fontFamily: 'var(--sans)',
        fontSize: 14,
        color: 'var(--text3)',
        margin: '0 0 28px',
        textAlign: 'center',
      }}>
        How should Kai communicate with you?
      </p>

      <div style={{ display: 'flex', gap: 12, marginBottom: 32, width: '100%' }}>
        {personalities.map((persona: Personality) => {
          const selected = selectedPersonality.id === persona.id;
          return (
            <button
              key={persona.id}
              onClick={() => setPersonality(persona)}
              style={{
                flex: 1,
                padding: '16px 12px',
                border: selected ? '2px solid var(--primary-80)' : '1.5px solid var(--border)',
                borderRadius: 12,
                background: selected ? 'rgba(22,136,95,0.06)' : 'var(--surface)',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 8,
                transition: 'border-color 150ms ease, background 150ms ease',
              }}
            >
              <div style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: selected ? 'rgba(22,136,95,0.12)' : 'var(--surface2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: selected ? 'var(--primary-80)' : 'var(--text3)',
                transition: 'all 150ms ease',
              }}>
                <PersonaIcon icon={(persona as Personality & { icon?: string }).icon ?? 'smile'} size={18} />
              </div>
              <span style={{
                fontFamily: 'var(--display)',
                fontWeight: 700,
                fontSize: 13,
                color: selected ? 'var(--primary-80)' : 'var(--text)',
              }}>
                {persona.label}
              </span>
              <span style={{
                fontFamily: 'var(--sans)',
                fontSize: 11,
                color: 'var(--text3)',
                lineHeight: 1.5,
                textAlign: 'center',
              }}>
                {persona.description}
              </span>
            </button>
          );
        })}
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        <button
          onClick={onSkip}
          style={{
            height: 40,
            padding: '0 20px',
            background: 'transparent',
            color: 'var(--text3)',
            border: '1px solid var(--border)',
            borderRadius: 8,
            fontFamily: 'var(--display)',
            fontWeight: 600,
            fontSize: 13,
            cursor: 'pointer',
          }}
        >
          Skip
        </button>
        <button
          onClick={onNext}
          style={{
            height: 40,
            padding: '0 28px',
            background: 'var(--primary-80)',
            color: 'white',
            border: 'none',
            borderRadius: 8,
            fontFamily: 'var(--display)',
            fontWeight: 700,
            fontSize: 13,
            cursor: 'pointer',
            transition: 'opacity 150ms ease',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.88'; }}
          onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
        >
          Next →
        </button>
      </div>
    </div>
  );
}

// ── Step 3: First Briefing ────────────────────────────────────────────────────

function StepFirstBriefing({ onGetStarted }: { onGetStarted: () => void }) {
  const { proactiveBrief } = usePageContext();
  const [sentQuery, setSentQuery] = useState<string | null>(null);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
      <h2 style={{
        fontFamily: 'var(--display)',
        fontWeight: 800,
        fontSize: 22,
        color: 'var(--text)',
        margin: '0 0 8px',
        textAlign: 'center',
      }}>
        Your First Briefing
      </h2>
      <p style={{
        fontFamily: 'var(--sans)',
        fontSize: 14,
        color: 'var(--text3)',
        margin: '0 0 24px',
        textAlign: 'center',
        lineHeight: 1.55,
        maxWidth: 380,
      }}>
        This is what I&apos;ll show you every morning. Here&apos;s what needs attention today.
      </p>

      <div style={{
        width: '100%',
        background: 'var(--surface2)',
        border: '1px solid var(--border)',
        borderRadius: 12,
        padding: '16px 20px',
        marginBottom: 28,
      }}>
        <ProactiveBriefCard
          brief={proactiveBrief}
          onChipClick={(q) => setSentQuery(q)}
        />
        {sentQuery && (
          <div style={{
            marginTop: 10,
            padding: '8px 12px',
            background: 'rgba(22,136,95,0.06)',
            border: '1px solid rgba(22,136,95,0.2)',
            borderRadius: 8,
            fontFamily: 'var(--sans)',
            fontSize: 12,
            color: 'var(--primary-80)',
          }}>
            Query ready: &ldquo;{sentQuery}&rdquo; — Kai will run this when you get started.
          </div>
        )}
      </div>

      <button
        onClick={onGetStarted}
        style={{
          height: 44,
          padding: '0 36px',
          background: 'var(--primary-80)',
          color: 'white',
          border: 'none',
          borderRadius: 10,
          fontFamily: 'var(--display)',
          fontWeight: 700,
          fontSize: 15,
          cursor: 'pointer',
          boxShadow: '0 2px 8px rgba(22,136,95,0.25)',
          transition: 'opacity 150ms ease',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.88'; }}
        onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
      >
        Get Started
      </button>
    </div>
  );
}

// ── Main OnboardingFlow ───────────────────────────────────────────────────────

export default function OnboardingFlow() {
  const { completed, hydrated, markComplete } = useOnboarding();
  const { selectedPersonality } = usePersona();
  const [step, setStep] = useState(0);
  const [visible, setVisible] = useState(true);

  // Don't render until localStorage has been read — prevents flash on reload
  if (!hydrated || completed || !visible) return null;

  function handleComplete() {
    markComplete(selectedPersonality.id);
    setVisible(false);
  }

  const STEPS = 3;

  return (
    <>
      <style>{`
        @keyframes kaiGlow {
          0%, 100% { transform: scale(1); opacity: 0.7; }
          50% { transform: scale(1.12); opacity: 1; }
        }
        @keyframes onboardingIn {
          from { opacity: 0; transform: translateY(16px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes stepSlideIn {
          from { opacity: 0; transform: translateX(20px); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>

      {/* Backdrop */}
      <div style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(20, 24, 32, 0.55)',
        backdropFilter: 'blur(4px)',
        zIndex: 2000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}>
        {/* Modal card */}
        <div
          style={{
            background: 'var(--surface)',
            borderRadius: 20,
            boxShadow: '0 24px 64px rgba(0,0,0,0.18), 0 0 0 1px var(--border)',
            width: '100%',
            maxWidth: step === 1 ? 560 : 480,
            animation: 'onboardingIn 320ms cubic-bezier(0.22,1,0.36,1) both',
            transition: 'max-width 350ms cubic-bezier(0.4, 0, 0.2, 1)',
            overflow: 'hidden',
          }}
        >
          <div style={{ padding: '40px 40px 10px' }}>
            <StepDots step={step} total={STEPS} />
          </div>

          <div style={{ 
            display: 'flex', 
            width: `${STEPS * 100}%`,
            transform: `translateX(-${(step / STEPS) * 100}%)`,
            transition: 'transform 300ms cubic-bezier(0.4, 0, 0.2, 1)',
          }}>
            {[0, 1, 2].map(sIdx => (
              <div key={sIdx} style={{ 
                width: `${100 / STEPS}%`, 
                padding: '0 40px 40px',
                flexShrink: 0,
                opacity: step === sIdx ? 1 : 0,
                transition: 'opacity 300ms ease',
              }}>
                {sIdx === 0 && <StepMeetKai onNext={() => setStep(1)} />}
                {sIdx === 1 && (
                  <StepChoosePersona
                    onNext={() => setStep(2)}
                    onSkip={() => setStep(2)}
                  />
                )}
                {sIdx === 2 && <StepFirstBriefing onGetStarted={handleComplete} />}
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
