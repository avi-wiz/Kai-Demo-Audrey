'use client';

import { useContext } from 'react';
import { ConsentHandlersContext } from '@/components/engine/FrameParser';
import type { WidgetProps, ConsentBannerData } from '@/lib/types';

function ShieldIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <svg
      width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
      style={{ animation: 'kai-spin 600ms linear infinite', display: 'block' }}
    >
      <style>{`@keyframes kai-spin { to { transform: rotate(360deg); } }`}</style>
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
    </svg>
  );
}

const stateStyles = {
  staged: {
    bg: 'var(--badge-warning-bg)',
    border: 'var(--badge-warning-border)',
    iconColor: 'var(--warning-80)',
    msgColor: 'var(--text2)',
    badgeBg: 'var(--badge-warning-bg)',
    badgeText: 'var(--warning-80)',
    badgeBorder: 'var(--badge-warning-border)',
    opacity: 1
  },
  confirmed: {
    bg: 'var(--badge-success-bg)',
    border: 'var(--badge-success-border)',
    iconColor: 'var(--primary-80)',
    msgColor: 'var(--text2)',
    badgeBg: 'var(--badge-success-bg)',
    badgeText: 'var(--primary-80)',
    badgeBorder: 'var(--badge-success-border)',
    opacity: 1
  },
  editing: {
    bg: 'var(--badge-info-bg)',
    border: 'var(--badge-info-border)',
    iconColor: 'var(--info-80)',
    msgColor: 'var(--info-80)',
    badgeBg: 'var(--badge-info-bg)',
    badgeText: 'var(--info-80)',
    badgeBorder: 'var(--badge-info-border)',
    opacity: 1
  },
  cancelled: {
    bg: 'var(--badge-neutral-bg)',
    border: 'var(--badge-neutral-border)',
    iconColor: 'var(--text3)',
    msgColor: 'var(--text3)',
    badgeBg: 'var(--badge-neutral-bg)',
    badgeText: 'var(--text3)',
    badgeBorder: 'var(--badge-neutral-border)',
    opacity: 0.6
  }
};

export default function ConsentBanner({ data: rawData }: WidgetProps) {
  const data = rawData as unknown as ConsentBannerData;
  const handlers = useContext(ConsentHandlersContext);

  // Derive state (note: the widget data currently has a 'tier' field but message content implies the workflow state)
  // We'll use staged as default, and check handlers for other visual states if they were implemented.
  // For this design transformation, we'll map based on data.tier or assume staged.
  const currentState = (data.tier === 'draft' ? 'staged' : 'staged') as keyof typeof stateStyles;
  const s = stateStyles[currentState];

  return (
    <div style={{
      background: s.bg,
      border: `1px solid ${s.border}`,
      borderRadius: 'var(--radius-card)',
      padding: '14px 18px',
      transition: 'var(--transition-default)',
      opacity: s.opacity,
    }}>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 14 }}>
        <span style={{ color: s.iconColor, flexShrink: 0, marginTop: 2 }}>
          {currentState === 'confirmed' ? <CheckIcon /> : <ShieldIcon />}
        </span>
        <span style={{ flex: 1, fontSize: 12.5, color: s.msgColor, lineHeight: 1.5, fontFamily: 'var(--sans)' }}>
          {data.message}
        </span>
        <span style={{
          flexShrink: 0,
          fontSize: 10,
          fontWeight: 600,
          color: s.badgeText,
          background: s.badgeBg,
          border: `1px solid ${s.badgeBorder}`,
          borderRadius: 'var(--radius-badge)',
          padding: '2px 8px',
          fontFamily: 'var(--sans)',
          textTransform: 'uppercase',
        }}>
          {data.tier}
        </span>
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' as const }}>
        {/* Confirm */}
        <button
          onClick={handlers?.onConfirm}
          disabled={handlers?.isConfirming}
          style={{
            height: 34,
            padding: '0 18px',
            fontSize: 12.5,
            fontWeight: 600,
            background: 'var(--primary-80)',
            color: '#ffffff',
            border: 'none',
            borderRadius: 'var(--radius-button)',
            cursor: handlers?.isConfirming ? 'default' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            transition: 'var(--transition-fast)',
            fontFamily: 'var(--sans)',
          }}
          onMouseEnter={(e) => {
            if (!handlers?.isConfirming) {
              e.currentTarget.style.background = 'var(--primary-70)';
              e.currentTarget.style.transform = 'scale(1.02)';
            }
          }}
          onMouseLeave={(e) => {
            if (!handlers?.isConfirming) {
              e.currentTarget.style.background = 'var(--primary-80)';
              e.currentTarget.style.transform = 'scale(1)';
            }
          }}
          onMouseDown={(e) => {
            if (!handlers?.isConfirming) e.currentTarget.style.transform = 'scale(0.98)';
          }}
          onMouseUp={(e) => {
            if (!handlers?.isConfirming) e.currentTarget.style.transform = 'scale(1.02)';
          }}
        >
          {handlers?.isConfirming && <SpinnerIcon />}
          {data.actions[0] ?? 'Confirm & Create'}
        </button>

        {/* Edit */}
        <button
          onClick={handlers?.onEdit}
          style={{
            height: 34,
            padding: '0 14px',
            fontSize: 12.5,
            fontWeight: 500,
            background: 'var(--surface2)',
            color: 'var(--text)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-button)',
            cursor: 'pointer',
            transition: 'var(--transition-fast)',
            fontFamily: 'var(--sans)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--border2)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--border)';
          }}
        >
          {data.actions[1] ?? 'Edit'}
        </button>

        {/* Cancel */}
        <button
          onClick={handlers?.onCancel}
          style={{
            height: 34,
            padding: '0 10px',
            fontSize: 12,
            background: 'none',
            color: 'var(--text3)',
            border: 'none',
            cursor: 'pointer',
            transition: 'var(--transition-fast)',
            fontFamily: 'var(--sans)',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text2)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text3)')}
        >
          {data.actions[2] ?? 'Cancel'}
        </button>
      </div>
    </div>
  );
}
