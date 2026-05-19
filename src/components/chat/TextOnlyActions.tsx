'use client';

import { useContext } from 'react';
import { ConsentHandlersContext } from '@/components/engine/FrameParser';
import type { TextOnlyActions as TextOnlyActionsType } from '@/lib/types';

interface Props {
  actions: TextOnlyActionsType;
}

export default function TextOnlyActions({ actions }: Props) {
  const handlers = useContext(ConsentHandlersContext);

  if (!handlers) return null;

  const { isConfirming, onConfirm, onEdit, onCancel } = handlers;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        marginTop: 14,
        paddingLeft: 4,
        animation: 'kai-entrance 300ms ease both',
      }}
    >
      {/* Confirm */}
      <button
        onClick={onConfirm}
        disabled={isConfirming}
        style={{
          padding: '6px 14px',
          fontFamily: 'var(--sans)',
          fontWeight: 600,
          fontSize: 12.5,
          color: 'white',
          background: 'var(--primary-80, #4f46e5)',
          border: 'none',
          borderRadius: 7,
          cursor: isConfirming ? 'wait' : 'pointer',
          opacity: isConfirming ? 0.75 : 1,
          transition: 'opacity 150ms ease',
        }}
        onMouseEnter={(e) => { if (!isConfirming) e.currentTarget.style.opacity = '0.88'; }}
        onMouseLeave={(e) => { if (!isConfirming) e.currentTarget.style.opacity = '1'; }}
      >
        {isConfirming ? 'Creating…' : actions.confirmText}
      </button>

      {/* Edit */}
      <button
        onClick={onEdit}
        disabled={isConfirming}
        style={{
          padding: '6px 14px',
          fontFamily: 'var(--sans)',
          fontWeight: 500,
          fontSize: 12.5,
          color: 'var(--text)',
          background: 'var(--surface2)',
          border: '1px solid var(--border)',
          borderRadius: 7,
          cursor: isConfirming ? 'not-allowed' : 'pointer',
          opacity: isConfirming ? 0.5 : 1,
          transition: 'opacity 150ms ease',
        }}
      >
        {actions.editText}
      </button>

      {/* Cancel */}
      <button
        onClick={onCancel}
        disabled={isConfirming}
        style={{
          padding: '6px 12px',
          fontFamily: 'var(--sans)',
          fontWeight: 400,
          fontSize: 12.5,
          color: 'var(--text3)',
          background: 'transparent',
          border: 'none',
          borderRadius: 7,
          cursor: isConfirming ? 'not-allowed' : 'pointer',
          opacity: isConfirming ? 0.5 : 1,
          transition: 'color 150ms ease',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text2)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text3)'; }}
      >
        {actions.cancelText}
      </button>
    </div>
  );
}
