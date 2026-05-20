'use client';

import { useState } from 'react';
import type { WidgetProps, DataTableData, DataTableConfig, DataTableColumn } from '@/lib/types';
import type { WidgetHighlight } from '@/lib/types';

// Parse "rows[2].stock" → { rowIndex: 2, colKey: 'stock' }
function parseHighlightPath(path: string | undefined | null): { rowIndex: number; colKey: string } | null {
  if (typeof path !== 'string') return null;
  const m = path.match(/^rows\[(\d+)\]\.(.+)$/);
  if (!m) return null;
  return { rowIndex: parseInt(m[1], 10), colKey: m[2] };
}

const HL_BORDER: Record<WidgetHighlight['type'], string> = {
  urgent:   'var(--error-80)',
  warning:  'var(--warning-80)',
  positive: 'var(--success-80)',
  info:     'var(--info-80)',
};

const HL_BG: Record<WidgetHighlight['type'], string> = {
  urgent:   'rgba(220,38,38,0.06)',
  warning:  'rgba(245,158,11,0.06)',
  positive: 'rgba(22,136,95,0.06)',
  info:     'rgba(91,106,240,0.06)',
};

const HL_CHIP: Record<WidgetHighlight['type'], string> = {
  urgent:   'rgba(220,38,38,0.12)',
  warning:  'rgba(245,158,11,0.12)',
  positive: 'rgba(22,136,95,0.12)',
  info:     'rgba(91,106,240,0.12)',
};

function formatCell(value: string | number | boolean | null, col: DataTableColumn): string {
  if (value === null || value === undefined) return '—';

  if (col.format === 'currency' && typeof value === 'number') {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);
  }
  if (col.format === 'percent' && typeof value === 'number') {
    return `${value.toFixed(1)}%`;
  }
  if (col.format === 'number' && typeof value === 'number') {
    return new Intl.NumberFormat('en-US').format(value);
  }
  if (col.format === 'date' && typeof value === 'string') {
    const d = new Date(value + 'T00:00:00');
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }
  return String(value);
}

function isNumeric(col: DataTableColumn): boolean {
  return col.format === 'currency' || col.format === 'number' || col.format === 'percent';
}

function cellAlign(col: DataTableColumn): 'left' | 'right' | 'center' {
  if (col.align) return col.align;
  return isNumeric(col) ? 'right' : 'left';
}

export default function DataTable({ data: rawData, config, highlights, onAction }: WidgetProps & { highlights?: WidgetHighlight[]; onAction?: (query: string) => void }) {
  const data = rawData as unknown as DataTableData & { totals?: Record<string, string | number>; showTotals?: boolean };
  const { title, columns, rows } = data;

  const [tooltipKey, setTooltipKey] = useState<string | null>(null);

  // Build lookup: "rowIndex:colKey" → WidgetHighlight
  const highlightMap = new Map<string, WidgetHighlight>();
  for (const h of highlights ?? []) {
    const parsed = parseHighlightPath(h.fieldPath);
    if (parsed) highlightMap.set(`${parsed.rowIndex}:${parsed.colKey}`, h);
  }

  // Support both `totalRow` (typed) and `totals` (fixture alias)
  const totalsRow = data.totalRow ?? data.totals;
  const showTotals = !!(totalsRow && data.showTotals !== false);

  const _zebra = config?.zebra ?? false;

  return (
    <div
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 12,
        overflow: 'clip',
      }}
    >
      {title && (
        <div
          style={{
            padding: '12px 16px 10px',
            fontFamily: 'var(--display)',
            fontWeight: 600,
            fontSize: 13,
            color: 'var(--text)',
            borderBottom: '1px solid var(--border)',
          }}
        >
          {title}
        </div>
      )}

      <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
        <table style={{ width: '100%', minWidth: 420, borderCollapse: 'collapse' }}>
          {/* Header */}
          <thead>
            <tr style={{ background: 'var(--surface2)' }}>
              {columns.map((col) => (
                <th
                  key={col.key}
                  style={{
                    padding: '8px 12px',
                    fontFamily: 'var(--sans)',
                    fontWeight: 600,
                    fontSize: 10.5,
                    color: 'var(--text3)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    textAlign: cellAlign(col),
                    borderBottom: '1px solid var(--border)',
                    whiteSpace: 'nowrap',
                    width: col.width,
                  }}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>

          {/* Body */}
          <tbody>
            {rows.map((row, rowIdx) => (
              <tr
                key={rowIdx}
                style={{ transition: 'background 100ms ease' }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(0,0,0,0.02)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                {columns.map((col, colIdx) => {
                  const value = row[col.key] ?? null;
                  const isMono = col.format === 'currency' || col.format === 'number' || (col as DataTableColumn & { mono?: boolean }).mono;
                  const hlKey = `${rowIdx}:${col.key}`;
                  const hl = highlightMap.get(hlKey);
                  const isShowingTooltip = tooltipKey === hlKey;
                  return (
                    <td
                      key={col.key}
                      style={{
                        padding: hl ? '9px 12px 9px 12px' : '9px 12px',
                        fontFamily: isMono ? 'var(--mono)' : 'var(--sans)',
                        fontSize: isMono ? 12 : 13,
                        color: hl ? HL_BORDER[hl.type] : 'var(--text)',
                        textAlign: cellAlign(col),
                        borderBottom: rowIdx < rows.length - 1 || showTotals ? '1px solid var(--border)' : 'none',
                        whiteSpace: hl?.action ? 'normal' : 'nowrap',
                        background: hl ? HL_BG[hl.type] : undefined,
                        boxShadow: hl && colIdx === 0 ? `inset 3px 0 0 0 ${HL_BORDER[hl.type]}` : undefined,
                        position: 'relative',
                        cursor: hl ? 'default' : undefined,
                      }}
                      onMouseEnter={hl ? () => setTooltipKey(hlKey) : undefined}
                      onMouseLeave={hl ? () => setTooltipKey(null) : undefined}
                    >
                      {formatCell(value, col)}
                      {hl && isShowingTooltip && (
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
                      {hl?.action && onAction && (
                        <div>
                          <button
                            onClick={() => onAction(hl.action!.query)}
                            className="highlight-action-chip"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                              marginTop: 4,
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
                    </td>
                  );
                })}
              </tr>
            ))}

            {/* Totals row */}
            {showTotals && totalsRow && (
              <tr style={{ background: 'var(--surface2)' }}>
                {columns.map((col, colIdx) => {
                  const value = totalsRow[col.key] ?? null;
                  const isMono = col.format === 'currency' || col.format === 'number' || (col as DataTableColumn & { mono?: boolean }).mono;
                  return (
                    <td
                      key={col.key}
                      style={{
                        padding: '9px 12px',
                        fontFamily: isMono ? 'var(--mono)' : 'var(--sans)',
                        fontWeight: 700,
                        fontSize: isMono ? 12 : 13,
                        color: 'var(--text)',
                        textAlign: cellAlign(col),
                        borderTop: '2px solid var(--border2)',
                        whiteSpace: 'nowrap',
                        borderLeft: colIdx === 0 ? 'none' : undefined,
                      }}
                    >
                      {value !== null && value !== undefined ? formatCell(value as string | number, col) : ''}
                    </td>
                  );
                })}
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
