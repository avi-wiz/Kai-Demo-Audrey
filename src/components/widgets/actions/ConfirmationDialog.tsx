'use client';

import type { WidgetProps, ConfirmationDialogData } from '@/lib/types';

interface ConfirmationDialogConfig {
  /** If provided, entityLink.url is treated as a ViewRoute and fired via this callback */
  onNavigate?: (route: string) => void;
}

export default function ConfirmationDialog({ data: rawData, config: rawConfig }: WidgetProps) {
  const data = rawData as unknown as ConfirmationDialogData;
  const config = (rawConfig ?? {}) as ConfirmationDialogConfig;

  return (
    <div style={{
      background: 'var(--badge-success-bg)',
      border: '1px solid var(--badge-success-border)',
      borderRadius: 'var(--radius-card)',
      padding: '14px 18px',
      display: 'flex',
      alignItems: 'flex-start',
      gap: 12,
    }}>
      {/* Animated check icon */}
      <div className="kai-pulse-subtle" style={{
        flexShrink: 0,
        width: 32,
        height: 32,
        borderRadius: '50%',
        background: 'var(--badge-success-bg)',
        border: '1.5px solid var(--badge-success-border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
      }}>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--primary-80)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ animation: 'kai-check-draw 400ms ease forwards' }}
        >
          <style>{`
            @keyframes kai-check-draw {
              from { stroke-dashoffset: 30; opacity: 0; }
              to   { stroke-dashoffset: 0;  opacity: 1; }
            }
          `}</style>
          <polyline
            points="20 6 9 17 4 12"
            style={{ strokeDasharray: 30, strokeDashoffset: 30, animation: 'kai-check-draw 400ms ease 100ms forwards', opacity: 0 }}
          />
        </svg>
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--primary-80)', marginBottom: 3, fontFamily: 'var(--sans)' }}>
          {data.title}
        </div>
        <div style={{ fontSize: 12.5, color: 'var(--text2)', lineHeight: 1.5, fontFamily: 'var(--sans)' }}>
          {data.message}
        </div>
        {data.entityLink && (
          <button
            onClick={() => config.onNavigate?.(data.entityLink!.url)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              marginTop: 8,
              fontSize: 12,
              fontWeight: 600,
              color: 'var(--primary-70)',
              background: 'none',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              fontFamily: 'var(--sans)',
              textDecoration: 'none',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
            onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
          >
            {data.entityLink.label}
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
