'use client';

import { useResponseMode } from '@/contexts/ResponseModeContext';
import type { ResponseMode } from '@/lib/types';

const OPTIONS: { value: ResponseMode; label: string }[] = [
  { value: 'text-widget', label: 'Text + Widgets' },
  { value: 'text-only',   label: 'Text Only' },
];

export default function ResponseModeToggle() {
  const { mode, setMode } = useResponseMode();

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        background: 'var(--surface2)',
        border: '1px solid var(--border)',
        borderRadius: 8,
        padding: 2,
        gap: 2,
        flexShrink: 0,
      }}
    >
      {OPTIONS.map(({ value, label }) => {
        const active = mode === value;
        return (
          <button
            key={value}
            onClick={() => setMode(value)}
            style={{
              padding: '4px 10px',
              fontFamily: 'var(--sans)',
              fontWeight: 500,
              fontSize: 11,
              borderRadius: 6,
              border: 'none',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'background 200ms ease, box-shadow 200ms ease, color 200ms ease',
              background: active ? 'var(--surface)' : 'transparent',
              color: active ? 'var(--text)' : 'var(--text3)',
              boxShadow: active ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
            }}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
