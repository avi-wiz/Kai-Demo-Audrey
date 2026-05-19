'use client';

import { useState, useContext, useMemo } from 'react';
import type { WidgetProps, ClarificationCardData } from '@/lib/types';
import { WidgetActionContext } from '@/components/engine/FrameParser';

function CheckSquareIcon({ checked, size = 14 }: { checked: boolean; size?: number }) {
  if (checked) {
    return (
      <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
        <rect x="1.5" y="1.5" width="13" height="13" rx="3" fill="var(--primary-80)" />
        <path d="M4.5 8.2l2.3 2.3 4.7-5" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <rect x="1.5" y="1.5" width="13" height="13" rx="3" stroke="var(--border2)" strokeWidth="1.3" fill="var(--surface)" />
    </svg>
  );
}

function RadioIcon({ checked, size = 14 }: { checked: boolean; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="6.4" stroke={checked ? 'var(--primary-80)' : 'var(--border2)'} strokeWidth="1.3" fill="var(--surface)" />
      {checked && <circle cx="8" cy="8" r="3.4" fill="var(--primary-80)" />}
    </svg>
  );
}

function HelpIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.3" />
      <path d="M6.2 6a1.8 1.8 0 1 1 2.6 1.6c-.4.2-.8.5-.8 1V9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <circle cx="8" cy="11.3" r="0.7" fill="currentColor" />
    </svg>
  );
}

export default function ClarificationCard({ data: rawData }: WidgetProps) {
  const data = rawData as unknown as ClarificationCardData;
  const actions = useContext(WidgetActionContext);
  const mode: 'single' | 'multi' = data.mode ?? 'multi';

  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(data.defaultSelected ?? []),
  );
  const [submitted, setSubmitted] = useState(false);

  const allValues = useMemo(() => data.options.map((o) => o.value), [data.options]);
  const allSelected = selected.size === allValues.length && allValues.length > 0;

  const toggle = (value: string) => {
    if (submitted) return;
    if (mode === 'single') {
      // Radio behaviour: picking one option replaces the selection.
      setSelected(new Set([value]));
      return;
    }
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return next;
    });
  };

  const toggleAll = () => {
    if (submitted) return;
    setSelected((prev) => (prev.size === allValues.length ? new Set() : new Set(allValues)));
  };

  const handleConfirm = () => {
    if (submitted || selected.size === 0) return;
    setSubmitted(true);
    // Preserve catalog order rather than Set insertion order
    const ordered = allValues.filter((v) => selected.has(v));
    actions?.onClarificationConfirm?.(ordered);
  };

  const handleCancel = () => {
    if (submitted) return;
    setSubmitted(true);
    actions?.onClarificationCancel?.();
  };

  const confirmLabel = data.confirmLabel ?? 'Add selected';
  const cancelLabel = data.cancelLabel ?? 'Cancel';

  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderLeft: '3px solid var(--ai-accent)',
      borderRadius: 'var(--radius-card)',
      padding: '16px 18px',
      opacity: submitted ? 0.55 : 1,
      transition: 'opacity 200ms ease',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 4 }}>
        <span style={{
          flexShrink: 0,
          color: 'var(--ai-accent)',
          marginTop: 2,
        }}>
          <HelpIcon />
        </span>
        <div style={{ flex: 1 }}>
          <div style={{
            fontFamily: 'var(--display)',
            fontWeight: 700,
            fontSize: 14,
            color: 'var(--text)',
            lineHeight: 1.4,
          }}>
            {data.prompt}
          </div>
          {data.context && (
            <div style={{
              fontFamily: 'var(--sans)',
              fontSize: 12,
              color: 'var(--text2)',
              marginTop: 4,
              lineHeight: 1.5,
            }}>
              {data.context}
            </div>
          )}
        </div>
      </div>

      {/* Select-all row — multi-mode only; radio mode hides this. */}
      {mode === 'multi' && allValues.length > 1 && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 0',
          marginTop: 8,
          borderBottom: '1px solid var(--border)',
        }}>
          <span style={{
            fontFamily: 'var(--sans)',
            fontSize: 11,
            fontWeight: 600,
            color: 'var(--text3)',
            textTransform: 'uppercase',
            letterSpacing: '0.4px',
          }}>
            {selected.size} of {allValues.length} selected
          </span>
          <button
            onClick={toggleAll}
            disabled={submitted}
            style={{
              fontFamily: 'var(--sans)',
              fontSize: 11.5,
              fontWeight: 500,
              color: 'var(--primary-70)',
              background: 'transparent',
              border: 'none',
              cursor: submitted ? 'default' : 'pointer',
              padding: 0,
            }}
          >
            {allSelected ? 'Clear all' : 'Select all'}
          </button>
        </div>
      )}

      {/* Options */}
      <div style={{ marginTop: 4 }}>
        {data.options.map((opt) => {
          const isChecked = selected.has(opt.value);
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => toggle(opt.value)}
              disabled={submitted}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 10,
                width: '100%',
                padding: '10px 8px',
                background: isChecked ? 'rgba(91,106,240,0.04)' : 'transparent',
                border: 'none',
                borderRadius: 6,
                cursor: submitted ? 'default' : 'pointer',
                textAlign: 'left',
                transition: 'background 120ms ease',
              }}
              onMouseEnter={(e) => {
                if (!submitted && !isChecked) {
                  e.currentTarget.style.background = 'var(--surface2)';
                }
              }}
              onMouseLeave={(e) => {
                if (!submitted && !isChecked) {
                  e.currentTarget.style.background = 'transparent';
                }
              }}
            >
              <span style={{ flexShrink: 0, marginTop: 1 }}>
                {mode === 'single'
                  ? <RadioIcon checked={isChecked} />
                  : <CheckSquareIcon checked={isChecked} />}
              </span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{
                  display: 'block',
                  fontFamily: 'var(--sans)',
                  fontSize: 13,
                  fontWeight: 600,
                  color: 'var(--text)',
                  lineHeight: 1.4,
                }}>
                  {opt.label}
                </span>
                {opt.description && (
                  <span style={{
                    display: 'block',
                    fontFamily: 'var(--sans)',
                    fontSize: 11.5,
                    color: 'var(--text2)',
                    marginTop: 2,
                    lineHeight: 1.45,
                  }}>
                    {opt.description}
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </div>

      {/* Buttons */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        marginTop: 12,
        paddingTop: 12,
        borderTop: '1px solid var(--border)',
      }}>
        <button
          onClick={handleConfirm}
          disabled={submitted || selected.size === 0}
          style={{
            height: 34,
            padding: '0 18px',
            fontSize: 12.5,
            fontWeight: 600,
            background: selected.size === 0 ? 'var(--surface2)' : 'var(--primary-80)',
            color: selected.size === 0 ? 'var(--text3)' : '#fff',
            border: 'none',
            borderRadius: 'var(--radius-button)',
            cursor: submitted || selected.size === 0 ? 'default' : 'pointer',
            fontFamily: 'var(--sans)',
            transition: 'all 120ms ease',
          }}
          onMouseEnter={(e) => {
            if (!submitted && selected.size > 0) e.currentTarget.style.background = 'var(--primary-70)';
          }}
          onMouseLeave={(e) => {
            if (!submitted && selected.size > 0) e.currentTarget.style.background = 'var(--primary-80)';
          }}
        >
          {confirmLabel}{mode === 'multi' && selected.size > 0 ? ` (${selected.size})` : ''}
        </button>
        <button
          onClick={handleCancel}
          disabled={submitted}
          style={{
            height: 34,
            padding: '0 14px',
            fontSize: 12.5,
            fontWeight: 500,
            background: 'transparent',
            color: 'var(--text2)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-button)',
            cursor: submitted ? 'default' : 'pointer',
            fontFamily: 'var(--sans)',
            transition: 'all 120ms ease',
          }}
          onMouseEnter={(e) => {
            if (!submitted) e.currentTarget.style.borderColor = 'var(--border2)';
          }}
          onMouseLeave={(e) => {
            if (!submitted) e.currentTarget.style.borderColor = 'var(--border)';
          }}
        >
          {cancelLabel}
        </button>
      </div>
    </div>
  );
}
