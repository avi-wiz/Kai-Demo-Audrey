'use client';

import { useState } from 'react';
import type { ActionChip } from '@/lib/types';

type ChipVariant = 'indigo' | 'amber' | 'emerald' | 'docs';

interface Chip {
  label: string;
  query: string;
  variant: ChipVariant;
}

const CHIPS: Chip[] = [
  {
    label: "How's Acme Corp doing?",
    query: "How's Acme Corp doing?",
    variant: 'indigo',
  },
  {
    label: 'Create a task for Shaw N Solutions',
    query: 'Create a task for Shaw N Solutions',
    variant: 'amber',
  },
  {
    label: 'Show revenue and create a follow-up',
    query: 'Show Acme revenue and create a follow-up',
    variant: 'emerald',
  },
  {
    label: 'What can Kai do for sales reps?',
    query: 'What can Kai do for sales reps?',
    variant: 'docs',
  },
  {
    label: 'How does customer-specific pricing work?',
    query: 'How does customer-specific pricing work?',
    variant: 'docs',
  },
];

const VARIANT_STYLES: Record<ChipVariant, { border: string; bg: string; text: string; hoverBorder: string; hoverBg: string }> = {
  indigo:  { border: '#c7d2fe', bg: 'rgba(238,242,255,0.5)',  text: 'var(--text2)', hoverBorder: '#a5b4fc', hoverBg: 'rgba(238,242,255,0.9)' },
  amber:   { border: '#fde68a', bg: 'rgba(255,251,235,0.5)',  text: 'var(--text2)', hoverBorder: '#fcd34d', hoverBg: 'rgba(255,251,235,0.9)' },
  emerald: { border: '#a7f3d0', bg: 'rgba(236,253,245,0.5)',  text: 'var(--text2)', hoverBorder: '#6ee7b7', hoverBg: 'rgba(236,253,245,0.9)' },
  docs:    { border: '#e5e7eb', bg: 'rgba(249,250,251,0.5)',  text: 'var(--text2)', hoverBorder: '#d1d5db', hoverBg: 'rgba(249,250,251,0.9)' },
};

interface SuggestedQueriesProps {
  onSelect: (query: string) => void;
  inline?: boolean;
  /** If provided, replaces default starters with page-specific chips */
  pageChips?: ActionChip[];
}

function ChipButton({ chip, onSelect }: { chip: Chip; onSelect: (q: string) => void }) {
  const [pressed, setPressed] = useState(false);
  const [hovered, setHovered] = useState(false);
  const s = VARIANT_STYLES[chip.variant];

  const handleClick = () => {
    setPressed(true);
    setTimeout(() => {
      setPressed(false);
      onSelect(chip.query);
    }, 120);
  };

  return (
    <button
      onClick={handleClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        padding: '6px 14px',
        fontSize: 12,
        fontWeight: 500,
        fontFamily: 'var(--display)',
        borderRadius: 20,
        border: `1px solid ${hovered ? s.hoverBorder : s.border}`,
        background: hovered ? s.hoverBg : s.bg,
        color: s.text,
        cursor: 'pointer',
        transition: 'all 150ms ease',
        transform: pressed ? 'scale(0.95)' : 'scale(1)',
        opacity: pressed ? 0.7 : 1,
        boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
        userSelect: 'none',
        whiteSpace: 'nowrap',
      }}
    >
      {chip.label}
      {chip.variant === 'docs' && (
        <span style={{
          fontSize: 9,
          fontWeight: 700,
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
          color: 'var(--text3)',
          paddingLeft: 2,
        }}>
          KB
        </span>
      )}
    </button>
  );
}

export default function SuggestedQueries({ onSelect, inline = false, pageChips = [] }: SuggestedQueriesProps) {
  if (pageChips.length > 0) {
    return (
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 8,
        justifyContent: 'center',
        marginBottom: inline ? 0 : 12,
      }}>
        {pageChips.map((chip) => (
          <ChipButton
            key={chip.query}
            chip={{ label: chip.label, query: chip.query, variant: 'indigo' }}
            onSelect={onSelect}
          />
        ))}
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex',
      flexWrap: 'wrap',
      gap: 8,
      justifyContent: 'center',
      marginBottom: inline ? 0 : 12,
    }}>
      {CHIPS.map((chip) => (
        <ChipButton key={chip.query} chip={chip} onSelect={onSelect} />
      ))}
    </div>
  );
}
