'use client';

import { useState, useEffect, useRef } from 'react';

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  ) : (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M2 2l12 12M6.5 6.6A2 2 0 0 0 9.4 9.5M4.1 4.2C2.6 5.2 1 8 1 8s2.5 5 7 5c1.4 0 2.7-.4 3.8-1.1M7 3.1C7.3 3 7.7 3 8 3c4.5 0 7 5 7 5s-.7 1.4-1.9 2.7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SuccessToast({ visible }: { visible: boolean }) {
  return (
    <div
      style={{
        position: 'fixed',
        bottom: 32,
        left: '50%',
        transform: `translateX(-50%) translateY(${visible ? 0 : 12}px)`,
        opacity: visible ? 1 : 0,
        transition: 'opacity 200ms ease, transform 200ms ease',
        pointerEvents: 'none',
        zIndex: 200,
        background: '#15803d',
        borderRadius: 10,
        padding: '10px 18px',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
        whiteSpace: 'nowrap',
      }}
    >
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <circle cx="7" cy="7" r="6" fill="rgba(255,255,255,0.25)" />
        <path d="M4.5 7l2 2 3-3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span style={{ fontFamily: 'var(--sans)', fontWeight: 500, fontSize: 13, color: 'white' }}>
        API key saved successfully
      </span>
    </div>
  );
}

const MASKED = 'sk-ant-api03-••••••••••••••••••••••••XXXX';
const REAL   = 'sk-ant-api03-AbCdEfGhIjKlMnOpQrStUvWxYzXXXX';

export default function ApiKeyView() {
  const [revealed, setRevealed] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  function handleSave() {
    if (timerRef.current) clearTimeout(timerRef.current);
    setToastVisible(true);
    timerRef.current = setTimeout(() => setToastVisible(false), 2800);
  }

  return (
    <div className="flex-1 overflow-y-auto" style={{ padding: '32px 40px' }}>
      <h1 style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 18, color: 'var(--text)', marginBottom: 28 }}>
        API Configuration
      </h1>

      <div
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 12,
          padding: '24px',
          maxWidth: 520,
        }}
      >
        {/* Label */}
        <label
          htmlFor="api-key-input"
          style={{ display: 'block', fontFamily: 'var(--display)', fontWeight: 600, fontSize: 13, color: 'var(--text)', marginBottom: 8 }}
        >
          Anthropic API Key
        </label>

        {/* Input row */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <input
              id="api-key-input"
              type={revealed ? 'text' : 'password'}
              defaultValue={REAL}
              style={{
                width: '100%',
                padding: '9px 38px 9px 12px',
                fontFamily: 'var(--mono)',
                fontSize: 12.5,
                color: 'var(--text)',
                background: 'var(--surface2, #f9fafb)',
                border: '1px solid var(--border)',
                borderRadius: 8,
                outline: 'none',
                boxSizing: 'border-box',
              }}
              placeholder={MASKED}
              onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--primary-70)')}
              onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
            />
            <button
              onClick={() => setRevealed((v) => !v)}
              title={revealed ? 'Hide key' : 'Show key'}
              style={{
                position: 'absolute',
                right: 10,
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: 2,
                color: 'var(--text3)',
                display: 'flex',
                alignItems: 'center',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text2)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text3)')}
            >
              <EyeIcon open={revealed} />
            </button>
          </div>

          <button
            onClick={handleSave}
            style={{
              padding: '9px 18px',
              fontFamily: 'var(--sans)',
              fontWeight: 600,
              fontSize: 13,
              color: 'white',
              background: 'var(--primary-80, #4f46e5)',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
              flexShrink: 0,
              transition: 'opacity 150ms ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.88')}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
          >
            Save
          </button>
        </div>

        {/* Status */}
        <p style={{ fontFamily: 'var(--sans)', fontSize: 12.5, color: '#15803d', margin: '0 0 10px', display: 'flex', alignItems: 'center', gap: 5 }}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <circle cx="6" cy="6" r="5" fill="rgba(22,163,74,0.15)" />
            <circle cx="6" cy="6" r="2.5" fill="#15803d" />
          </svg>
          Status: Connected ✓
        </p>

        {/* Info */}
        <p style={{ fontFamily: 'var(--sans)', fontSize: 11.5, color: 'var(--text3)', margin: 0, lineHeight: 1.6 }}>
          Your API key is stored locally and never sent to our servers.
        </p>
      </div>

      <SuccessToast visible={toastVisible} />
    </div>
  );
}
