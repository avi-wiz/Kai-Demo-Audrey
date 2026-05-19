'use client';

import { useRef, useEffect, useState } from 'react';
import type { ActionChip as ActionChipType } from '@/lib/types';
import ActionChip from './ActionChip';

interface Props {
  chips: ActionChipType[];
  onChipClick: (query: string) => void;
}

export default function ActionChipsBar({ chips, onChipClick }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [hasOverflow, setHasOverflow] = useState(false);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const check = () => setHasOverflow(el.scrollWidth > el.clientWidth);
    check();
    const ro = new ResizeObserver(check);
    ro.observe(el);
    return () => ro.disconnect();
  }, [chips]);

  if (!chips.length) return null;

  return (
    <div
      style={{
        position: 'relative',
        marginTop: 10,
        marginBottom: 4,
      }}
    >
      {/* Scrollable row */}
      <div
        ref={scrollRef}
        style={{
          display: 'flex',
          flexDirection: 'row',
          gap: 8,
          overflowX: 'auto',
          paddingBottom: 2,
          // Hide scrollbar cross-browser
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
        // Webkit scrollbar hidden via global CSS — inline style can't target pseudo-elements
        className="kai-chips-bar"
      >
        {chips.map((chip, i) => (
          <ActionChip key={`${chip.label}-${i}`} chip={chip} onChipClick={onChipClick} />
        ))}
      </div>

      {/* Right fade mask when content overflows */}
      {hasOverflow && (
        <div
          aria-hidden
          style={{
            position: 'absolute',
            top: 0,
            right: -1,
            bottom: 0,
            width: 60,
            pointerEvents: 'none',
            background: 'linear-gradient(to right, transparent, var(--bg))',
            zIndex: 1,
          }}
        />
      )}

      <style>{`
        .kai-chips-bar {
          scroll-behavior: smooth;
          -webkit-overflow-scrolling: touch;
        }
        .kai-chips-bar::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
}
