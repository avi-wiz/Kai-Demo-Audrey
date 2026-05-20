'use client';

import type { ReactNode } from 'react';
import type { ActionChip } from '@/lib/types';

interface FilterChip {
  label: string;
  active?: boolean;
  onClick?: () => void;
}

interface WizOrderPageProps {
  title: string;
  subtitle?: string;
  filterChips?: FilterChip[];
  /** Contextual action chips shown as quick-start buttons in the header */
  actionChips?: ActionChip[];
  onActionChip?: (chip: ActionChip) => void;
  children?: ReactNode;
}

export default function WizOrderPage({
  title,
  subtitle,
  filterChips,
  children,
}: WizOrderPageProps) {
  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--bg)',
        minHeight: 0,
        overflow: 'hidden',
        animation: 'wizPageFadeIn 200ms ease-out both',
      }}
    >
      <style>{`
        @keyframes wizPageFadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
      `}</style>
      {/* Page header */}
      <div
        style={{
          padding: '24px 24px 0',
          background: 'var(--surface)',
          borderBottom: '1px solid var(--border)',
          flexShrink: 0,
        }}
      >
        {/* Title row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            marginBottom: subtitle ? 6 : 16,
          }}
        >
          <h1
            style={{
              fontFamily: 'var(--display)',
              fontWeight: 700,
              fontSize: 20,
              color: 'var(--text)',
              margin: 0,
              letterSpacing: '-0.3px',
            }}
          >
            {title}
          </h1>
        </div>

        {/* Subtitle */}
        {subtitle && (
          <p
            style={{
              fontFamily: 'var(--display)',
              fontWeight: 400,
              fontSize: 13,
              color: 'var(--text2)',
              margin: '0 0 14px 0',
              lineHeight: 1.5,
            }}
          >
            {subtitle}
          </p>
        )}

        {/* Filter chips row */}
        {filterChips && filterChips.length > 0 && (
          <div
            style={{
              display: 'flex',
              gap: 8,
              flexWrap: 'wrap',
              paddingBottom: 14,
            }}
          >
            {filterChips.map((chip) => (
              <button
                key={chip.label}
                onClick={chip.onClick}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '5px 12px',
                  fontSize: 12,
                  fontWeight: chip.active ? 600 : 500,
                  fontFamily: 'var(--display)',
                  borderRadius: 20,
                  border: '1px solid transparent',
                  borderColor: chip.active
                    ? 'var(--primary-80)'
                    : 'var(--border2)',
                  background: chip.active
                    ? 'rgba(22, 136, 95, 0.08)'
                    : 'var(--surface)',
                  color: chip.active ? 'var(--primary-80)' : 'var(--text2)',
                  cursor: 'pointer',
                  transition: 'all 200ms ease',
                  whiteSpace: 'nowrap',
                }}
                onMouseEnter={(e) => {
                  if (!chip.active) {
                    e.currentTarget.style.borderColor = 'var(--primary-80)';
                    e.currentTarget.style.color = 'var(--primary-80)';
                    e.currentTarget.style.background = 'rgba(22, 136, 95, 0.04)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!chip.active) {
                    e.currentTarget.style.borderColor = 'var(--border2)';
                    e.currentTarget.style.color = 'var(--text2)';
                    e.currentTarget.style.background = 'var(--surface)';
                  }
                }}
              >
                {chip.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Page body */}
      <div
        style={{
          flex: 1,
          overflow: 'auto',
          padding: 24,
          minHeight: 0,
        }}
      >
        {children}
      </div>
    </div>
  );
}
