'use client';

import { useState } from 'react';
import type { ActionChip as ActionChipType } from '@/lib/types';

// ── Icon map ──────────────────────────────────────────────────────────────────

function ChipIcon({ name }: { name: string }) {
  const s: React.CSSProperties = { flexShrink: 0, display: 'block' };
  switch (name) {
    case 'task':
      return (
        <svg width="12" height="12" viewBox="0 0 16 16" fill="none" style={s}>
          <rect x="2" y="1.5" width="12" height="13" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
          <path d="M5 5.5h6M5 8h6M5 10.5h4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        </svg>
      );
    case 'email':
      return (
        <svg width="12" height="12" viewBox="0 0 16 16" fill="none" style={s}>
          <rect x="1.5" y="3.5" width="13" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
          <path d="M1.5 5l6.5 4.5L14.5 5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        </svg>
      );
    case 'orders':
    case 'order':
      return (
        <svg width="12" height="12" viewBox="0 0 16 16" fill="none" style={s}>
          <rect x="2" y="1.5" width="12" height="13" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
          <path d="M5 5.5h6M5 8h4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        </svg>
      );
    case 'brief':
      return (
        <svg width="12" height="12" viewBox="0 0 16 16" fill="none" style={s}>
          <rect x="2" y="1.5" width="12" height="13" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
          <path d="M5 5h6M5 7.5h6M5 10h4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        </svg>
      );
    case 'search':
      return (
        <svg width="12" height="12" viewBox="0 0 16 16" fill="none" style={s}>
          <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.3" />
          <path d="M10.5 10.5l3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        </svg>
      );
    case 'filter':
      return (
        <svg width="12" height="12" viewBox="0 0 16 16" fill="none" style={s}>
          <path d="M2 4h12M4.5 8h7M7 12h2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        </svg>
      );
    case 'user':
      return (
        <svg width="12" height="12" viewBox="0 0 16 16" fill="none" style={s}>
          <circle cx="8" cy="5.5" r="3" stroke="currentColor" strokeWidth="1.3" />
          <path d="M2 14c0-3.5 2.5-5 6-5s6 1.5 6 5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        </svg>
      );
    case 'check':
      return (
        <svg width="12" height="12" viewBox="0 0 16 16" fill="none" style={s}>
          <path d="M2.5 8.5l4 4 7-7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'plus':
      return (
        <svg width="12" height="12" viewBox="0 0 16 16" fill="none" style={s}>
          <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        </svg>
      );
    case 'tag':
      return (
        <svg width="12" height="12" viewBox="0 0 16 16" fill="none" style={s}>
          <path d="M2 2h5.5l6.5 6.5-5.5 5.5L2 7.5V2z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
          <circle cx="5" cy="5" r="1" fill="currentColor" />
        </svg>
      );
    case 'edit':
      return (
        <svg width="12" height="12" viewBox="0 0 16 16" fill="none" style={s}>
          <path d="M11 2l3 3-8 8H3v-3l8-8z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
        </svg>
      );
    case 'compare':
      return (
        <svg width="12" height="12" viewBox="0 0 16 16" fill="none" style={s}>
          <path d="M5 2v12M11 2v12M2 8h4M10 5l3 3-3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'save':
      return (
        <svg width="12" height="12" viewBox="0 0 16 16" fill="none" style={s}>
          <path d="M2 2h9l3 3v9a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
          <path d="M11 2v4H4V2M6 9v4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        </svg>
      );
    case 'download':
      return (
        <svg width="12" height="12" viewBox="0 0 16 16" fill="none" style={s}>
          <path d="M8 2v8M4.5 7l3.5 4 3.5-4M2 13h12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'test':
      return (
        <svg width="12" height="12" viewBox="0 0 16 16" fill="none" style={s}>
          <path d="M5 2v6l-3 5h12l-3-5V2M4 2h8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'workflow':
      return (
        <svg width="12" height="12" viewBox="0 0 16 16" fill="none" style={s}>
          <circle cx="3" cy="4" r="2" stroke="currentColor" strokeWidth="1.2" />
          <circle cx="13" cy="4" r="2" stroke="currentColor" strokeWidth="1.2" />
          <circle cx="8" cy="12" r="2" stroke="currentColor" strokeWidth="1.2" />
          <path d="M5 4h6M4 5.5L7 10M12 5.5L9 10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      );
    case 'swap':
      return (
        <svg width="12" height="12" viewBox="0 0 16 16" fill="none" style={s}>
          <path d="M2 5h12M11 2l3 3-3 3M14 11H2M5 8l-3 3 3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'calendar':
      return (
        <svg width="12" height="12" viewBox="0 0 16 16" fill="none" style={s}>
          <rect x="1.5" y="3" width="13" height="11.5" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
          <path d="M5 1.5v3M11 1.5v3M1.5 7h13" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        </svg>
      );
    case 'chart':
    case 'dashboard':
      return (
        <svg width="12" height="12" viewBox="0 0 16 16" fill="none" style={s}>
          <path d="M1.5 13h13M4 13V9m4 4V6m4 7V3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        </svg>
      );
    case 'shipping':
      return (
        <svg width="12" height="12" viewBox="0 0 16 16" fill="none" style={s}>
          <path d="M1 4h9v7.5H1V4z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
          <path d="M10 6h2.5L15 9v2.5h-5V6z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
          <circle cx="3.5" cy="12.5" r="1.2" stroke="currentColor" strokeWidth="1.1" />
          <circle cx="11.5" cy="12.5" r="1.2" stroke="currentColor" strokeWidth="1.1" />
        </svg>
      );
    case 'alert':
      return (
        <svg width="12" height="12" viewBox="0 0 16 16" fill="none" style={s}>
          <path d="M8 2L14 13H2L8 2z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
          <path d="M8 7v3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          <circle cx="8" cy="11.5" r="0.6" fill="currentColor" />
        </svg>
      );
    case 'star':
      return (
        <svg width="12" height="12" viewBox="0 0 16 16" fill="none" style={s}>
          <path d="M8 1.5l1.8 3.6 4 .6-2.9 2.8.7 4L8 10.6l-3.6 1.9.7-4L2.2 5.7l4-.6L8 1.5z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
        </svg>
      );
    case 'clock':
      return (
        <svg width="12" height="12" viewBox="0 0 16 16" fill="none" style={s}>
          <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.3" />
          <path d="M8 5v3.5l2.5 1.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        </svg>
      );
    case 'trend':
      return (
        <svg width="12" height="12" viewBox="0 0 16 16" fill="none" style={s}>
          <path d="M1.5 12l4-4 3 3 6-7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'users':
      return (
        <svg width="12" height="12" viewBox="0 0 16 16" fill="none" style={s}>
          <circle cx="6" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.3" />
          <path d="M1 14c0-3 2-4 5-4s5 1 5 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          <circle cx="12" cy="5" r="2" stroke="currentColor" strokeWidth="1.2" />
          <path d="M15 14c0-2-1-3.2-3-3.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      );
    case 'file':
      return (
        <svg width="12" height="12" viewBox="0 0 16 16" fill="none" style={s}>
          <path d="M3 2h7l3 3v9a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
          <path d="M10 2v4h4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        </svg>
      );
    case 'grid':
      return (
        <svg width="12" height="12" viewBox="0 0 16 16" fill="none" style={s}>
          <rect x="1.5" y="1.5" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.3" />
          <rect x="9.5" y="1.5" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.3" />
          <rect x="1.5" y="9.5" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.3" />
          <rect x="9.5" y="9.5" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.3" />
        </svg>
      );
    case 'trash':
      return (
        <svg width="12" height="12" viewBox="0 0 16 16" fill="none" style={s}>
          <path d="M2 4h12M6 4V2.5h4V4M5 4v9.5h6V4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    default:
      return (
        <svg width="12" height="12" viewBox="0 0 16 16" fill="none" style={s}>
          <circle cx="8" cy="8" r="5" stroke="currentColor" strokeWidth="1.3" />
        </svg>
      );
  }
}

// ── Category decoration ───────────────────────────────────────────────────────

function PageActionDot() {
  return (
    <span style={{
      display: 'inline-block',
      width: 5,
      height: 5,
      borderRadius: '50%',
      background: 'var(--primary-80)',
      flexShrink: 0,
      marginRight: -2,
    }} />
  );
}

function FollowOnArrow() {
  return (
    <span style={{
      fontSize: 11,
      color: 'var(--text3)',
      fontFamily: 'var(--sans)',
      flexShrink: 0,
      lineHeight: 1,
      marginRight: -2,
    }}>→</span>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

interface Props {
  chip: ActionChipType;
  onChipClick: (query: string) => void;
}

export default function ActionChip({ chip, onChipClick }: Props) {
  const [pressed, setPressed] = useState(false);
  const [hovered, setHovered] = useState(false);

  const handleClick = () => {
    setPressed(true);
    setTimeout(() => {
      setPressed(false);
      onChipClick(chip.query);
    }, 100);
  };

  return (
    <button
      onClick={handleClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); }}
      title={chip.query}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '6px 14px',
        borderRadius: 20,
        border: `1px solid ${hovered ? 'var(--border2)' : 'var(--border)'}`,
        background: hovered ? 'var(--surface)' : 'var(--surface2)',
        color: 'var(--text2)',
        fontFamily: 'var(--display)',
        fontSize: 12,
        fontWeight: 600,
        cursor: 'pointer',
        whiteSpace: 'nowrap',
        userSelect: 'none',
        transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
        transform: pressed ? 'scale(0.94)' : hovered ? 'scale(1.02)' : 'scale(1)',
        boxShadow: hovered ? 'var(--shadow-card-hover)' : 'var(--shadow-card)',
        flexShrink: 0,
        opacity: pressed ? 0.8 : 1,
      }}
    >
      {chip.category === 'page-action' && <PageActionDot />}
      {chip.category === 'follow-on' && <FollowOnArrow />}
      <ChipIcon name={chip.icon} />
      <span>{chip.label}</span>
    </button>
  );
}
