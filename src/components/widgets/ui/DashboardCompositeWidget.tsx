'use client';

import type { WidgetProps, DashboardCompositeData } from '@/lib/types';
import { resolveWidget } from '@/components/engine/ComponentRegistry';

const LAYOUT_COLUMNS: Record<string, number> = {
  'grid-2x2': 2,
  'grid-2x3': 2,
  'grid-3x2': 3,
};

export default function DashboardCompositeWidget({
  data,
}: WidgetProps<DashboardCompositeData>) {
  const columns = LAYOUT_COLUMNS[data.layout] ?? 2;

  return (
    <div
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 14,
        position: 'relative',
        // Chat mode: render full height, let the outer ChatShell scroller handle scrolling
        // Full mode: no constraints
      }}
    >
      {/* Top accent line — rendered as a normal block element, no absolute positioning needed */}
      <div
        style={{
          height: 3,
          background: 'linear-gradient(90deg, rgba(91,106,240,0.8) 0%, rgba(40,170,123,0.6) 100%)',
          borderRadius: '14px 14px 0 0',
          position: 'sticky',
          top: 0,
          zIndex: 1,
        }}
      />

      <div style={{ padding: 20 }}>
        {/* Header */}
        <div style={{ marginBottom: 16 }}>
          <div
            style={{
              fontFamily: 'Satoshi, sans-serif',
              fontWeight: 700,
              fontSize: 16,
              color: 'var(--text)',
              marginBottom: 4,
            }}
          >
            {data.title}
          </div>
          {data.description && (
            <div
              style={{
                fontSize: 12,
                color: 'var(--text2)',
                fontFamily: 'Satoshi, sans-serif',
              }}
            >
              {data.description}
            </div>
          )}
        </div>

        {/* Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${columns}, 1fr)`,
            gap: 16,
          }}
        >
          {data.cells.map((cell, i) => {
            const Component = resolveWidget(cell.widgetType);
            const colSpan = cell.position.colSpan ?? 1;
            // Clamp colSpan to the current column count so a span:2 cell in a
            // 3-column grid renders correctly; clamp to columns when bigger.
            const effectiveSpan = Math.min(colSpan, columns);
            const hasExplicitPosition =
              typeof cell.position.col === 'number' &&
              typeof cell.position.row === 'number';
            const colStart = hasExplicitPosition ? (cell.position.col as number) + 1 : undefined;
            const rowStart = hasExplicitPosition ? (cell.position.row as number) + 1 : undefined;
            const cellKey = `${cell.widgetType}-${i}-${cell.position.row ?? 'auto'}-${cell.position.col ?? 'auto'}-${JSON.stringify(cell.config)}`;

            return (
              <div
                key={cellKey}
                className="kai-entrance"
                style={{
                  gridColumn: hasExplicitPosition
                    ? `${colStart} / span ${effectiveSpan}`
                    : `span ${effectiveSpan}`,
                  ...(hasExplicitPosition ? { gridRow: `${rowStart}` } : {}),
                  border: '1px solid var(--border)',
                  borderRadius: 10,
                  overflow: 'clip', // clips border-radius visually without blocking inner scroll
                  minWidth: 0,
                  animationDelay: `${i * 100}ms`,
                  background: 'var(--surface)',
                  boxShadow: 'var(--shadow-card)',
                }}
              >
                <Component
                  data={cell.data}
                  config={cell.config}
                  highlights={cell.highlights}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
