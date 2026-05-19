'use client';

import type { ClosingText as ClosingTextType } from '@/lib/types';

function LightbulbIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, marginTop: 1 }}>
      <path d="M8 1a5 5 0 0 1 3 9v1.5a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V10A5 5 0 0 1 8 1z" stroke="var(--primary-70)" strokeWidth="1.3" strokeLinejoin="round" />
      <path d="M6 13.5h4" stroke="var(--primary-70)" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

function QuestionIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, marginTop: 1 }}>
      <circle cx="8" cy="8" r="6.5" stroke="var(--text3)" strokeWidth="1.3" />
      <path d="M6.5 6.5a1.5 1.5 0 0 1 3 0c0 1-1.5 1.5-1.5 2.5" stroke="var(--text3)" strokeWidth="1.3" strokeLinecap="round" />
      <circle cx="8" cy="11.5" r="0.6" fill="var(--text3)" />
    </svg>
  );
}

interface Props {
  closingText: ClosingTextType;
}

export default function ClosingText({ closingText }: Props) {
  const { type, text } = closingText;

  const hasIcon = type === 'insight' || type === 'question';

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 6,
        marginTop: 12,
        paddingLeft: 4,
        maxWidth: '85%',
        animation: 'closingFadeIn 300ms ease both',
      }}
    >
      <style>{`
        @keyframes closingFadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      {type === 'insight' && <LightbulbIcon />}
      {type === 'question' && <QuestionIcon />}
      <p
        style={{
          fontFamily: 'var(--sans)',
          fontWeight: 400,
          fontSize: 13,
          color: 'var(--text)',
          lineHeight: 1.65,
          margin: 0,
          paddingLeft: hasIcon ? 0 : 0,
          whiteSpace: 'pre-wrap',
        }}
      >
        {text}
      </p>
    </div>
  );
}
