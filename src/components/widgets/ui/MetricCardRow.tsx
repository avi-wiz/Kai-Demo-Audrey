'use client';

import { useState } from 'react';
import type { WidgetProps, MetricCardRowData, MetricCardData, WidgetHighlight } from '@/lib/types';
import MetricCard from './MetricCard';

const HL_BORDER: Record<WidgetHighlight['type'], string> = {
  urgent:   'var(--error-80)',
  warning:  'var(--warning-80)',
  positive: 'var(--success-80)',
  info:     'var(--info-80)',
};

const HL_BG: Record<WidgetHighlight['type'], string> = {
  urgent:   'rgba(220,38,38,0.04)',
  warning:  'rgba(245,158,11,0.04)',
  positive: 'rgba(22,136,95,0.04)',
  info:     'rgba(91,106,240,0.04)',
};

const HL_CHIP: Record<WidgetHighlight['type'], string> = {
  urgent:   'rgba(220,38,38,0.12)',
  warning:  'rgba(245,158,11,0.12)',
  positive: 'rgba(22,136,95,0.12)',
  info:     'rgba(91,106,240,0.12)',
};

function HighlightedCard({
  card,
  hl,
  onAction,
}: {
  card: MetricCardData;
  hl?: WidgetHighlight;
  onAction?: (query: string) => void;
}) {
  const [showTooltip, setShowTooltip] = useState(false);

  if (!hl) {
    return <MetricCard data={card as unknown as Record<string, unknown>} />;
  }

  return (
    <div
      style={{
        position: 'relative',
        boxShadow: `inset 3px 0 0 0 ${HL_BORDER[hl.type]}`,
        background: HL_BG[hl.type],
        borderRadius: 'var(--radius-card)',
      }}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <MetricCard data={card as unknown as Record<string, unknown>} />

      {showTooltip && (
        <div 
          className="highlight-tooltip"
          style={{
          position: 'absolute',
          bottom: 'calc(100% + 6px)',
          left: 0,
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 6,
          padding: '6px 10px',
          fontSize: 12,
          color: 'var(--text)',
          fontFamily: 'var(--sans)',
          boxShadow: 'var(--shadow-tooltip)',
          whiteSpace: 'nowrap',
          zIndex: 20,
          pointerEvents: 'none',
        }}>
          {hl.message}
        </div>
      )}

      {hl.action && onAction && (
        <div style={{ padding: '0 12px 10px' }}>
          <button
            onClick={() => onAction(hl.action!.query)}
            className="highlight-action-chip"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              border: '1px solid var(--border)',
              borderRadius: 99,
              padding: '2px 8px',
              fontSize: 10,
              fontWeight: 600,
              fontFamily: 'var(--sans)',
              cursor: 'pointer',
            }}
          >
            &rarr; {hl.action.label}
          </button>
        </div>
      )}
    </div>
  );
}

export default function MetricCardRow({ data: rawData, highlights, onAction }: WidgetProps & { highlights?: WidgetHighlight[]; onAction?: (query: string) => void }) {
  const data = rawData as unknown as MetricCardRowData;

  // Build lookup by index: "cards[N]" or "cards[N].value" both resolve to card N
  const hlByIndex = new Map<number, WidgetHighlight>();
  for (const hl of highlights ?? []) {
    const m = hl.fieldPath.match(/^cards\[(\d+)\]/);
    if (m) hlByIndex.set(parseInt(m[1], 10), hl);
  }

  // Layout rule: up to 4 cards render as evenly-distributed columns (matches
  // existing dashboards / ad-17 default). 5+ cards wrap onto additional rows
  // in a fixed 4-column grid (n×4) so the PNG export stays well-structured
  // and the chat frame never overflows horizontally. Each cell holds a min
  // width of 180px so cards stay readable in narrow panels.
  const useFixedGrid = data.cards.length > 4;
  const gridTemplateColumns = useFixedGrid
    ? 'repeat(4, minmax(180px, 1fr))'
    : `repeat(${data.cards.length}, minmax(180px, 1fr))`;

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns,
      gap: 12,
      width: '100%',
      paddingBottom: 4,
    }}>
      {data.cards.map((card: MetricCardData, i: number) => (
        <HighlightedCard key={i} card={card} hl={hlByIndex.get(i)} onAction={onAction} />
      ))}
    </div>
  );
}
