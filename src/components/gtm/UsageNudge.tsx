'use client';

import { useEffect, useState } from 'react';
import { useNudge, type NudgeType } from '@/contexts/NudgeContext';

// ── Copy map ──────────────────────────────────────────────────────────────────

const NUDGE_TEXT: Record<NudgeType, string> = {
  'chart':       'Hover the save icon to keep this chart in My Artifacts.',
  'action-chip': 'Action chips suggest what to do next — click any to drill deeper.',
  'dashboard':   'Save this dashboard to revisit and edit it later.',
  'email':       'Say "make it shorter" or "make it more formal" to adjust the email.',
};

// ── Lightbulb icon ────────────────────────────────────────────────────────────

function LightbulbIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 16 16"
      fill="none"
      style={{ flexShrink: 0, marginTop: 1 }}
    >
      <path
        d="M8 1.5a4.5 4.5 0 0 1 2.5 8.2V11a1 1 0 0 1-1 1H6.5a1 1 0 0 1-1-1v-1.3A4.5 4.5 0 0 1 8 1.5z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
      <path
        d="M6.5 13.5h3M7 12v1.5M9 12v1.5"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
    </svg>
  );
}

// ── UsageNudge ────────────────────────────────────────────────────────────────

interface UsageNudgeProps {
  /** Which nudge type this instance should display. Renders nothing if activeNudge !== type. */
  type: NudgeType;
}

export default function UsageNudge({ type }: UsageNudgeProps) {
  const { activeNudge, dismissNudge } = useNudge();
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);

  // Animate in when this nudge becomes active
  useEffect(() => {
    if (activeNudge === type) {
      setExiting(false);
      // Tiny delay so the DOM is painted before the entrance animation fires
      const t = setTimeout(() => setVisible(true), 30);
      return () => clearTimeout(t);
    } else {
      setVisible(false);
      setExiting(false);
    }
  }, [activeNudge, type]);

  if (activeNudge !== type) return null;

  function handleDismiss() {
    setExiting(true);
    setTimeout(() => {
      dismissNudge();
      setVisible(false);
      setExiting(false);
    }, 200);
  }

  return (
    <>
      <style>{`
        @keyframes nudgeIn {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes nudgeOut {
          from { opacity: 1; transform: translateY(0); }
          to   { opacity: 0; transform: translateY(8px); }
        }
      `}</style>
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 7,
          marginTop: 8,
          padding: '7px 11px',
          background: 'var(--surface2)',
          border: '1px solid var(--border)',
          borderRadius: 8,
          animation: exiting
            ? 'nudgeOut 200ms ease forwards'
            : visible
            ? 'nudgeIn 200ms ease both'
            : 'none',
        }}
      >
        <span style={{ color: 'var(--text3)', display: 'flex', alignItems: 'center' }}>
          <LightbulbIcon />
        </span>

        <span style={{
          flex: 1,
          fontFamily: 'var(--sans)',
          fontSize: 11,
          color: 'var(--text3)',
          lineHeight: 1.5,
        }}>
          <strong style={{ fontWeight: 600, color: 'var(--text3)' }}>Tip:</strong>{' '}
          {NUDGE_TEXT[type]}
        </span>

        <button
          onClick={handleDismiss}
          style={{
            flexShrink: 0,
            background: 'none',
            border: 'none',
            padding: '0 2px',
            fontFamily: 'var(--sans)',
            fontSize: 11,
            fontWeight: 600,
            color: 'var(--text3)',
            cursor: 'pointer',
            lineHeight: 1.5,
            transition: 'color 120ms ease',
            whiteSpace: 'nowrap',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--primary-80)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text3)'; }}
        >
          Got it
        </button>
      </div>
    </>
  );
}
