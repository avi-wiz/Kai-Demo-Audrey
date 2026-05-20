'use client';

import { useState } from 'react';
import type { WidgetProps, CompactListData, CompactListTaskItem, CompactListActivityItem, WidgetHighlight } from '@/lib/types';

const ACTIVITY_ICON: Record<string, string> = {
  order: '📦', lead: '🆕', task: '✅', deal: '💼', check: '✅', alert: '⚠️',
};

function formatDate(iso: string): string {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

const priorityStyles: Record<string, { bg: string; text: string; border: string }> = {
  High:   { bg: 'var(--badge-danger-bg)', text: 'var(--badge-danger-text)', border: 'var(--badge-danger-border)' },
  Medium: { bg: 'var(--badge-warning-bg)', text: 'var(--badge-warning-text)', border: 'var(--badge-warning-border)' },
  Low:    { bg: 'var(--badge-neutral-bg)', text: 'var(--badge-neutral-text)', border: 'var(--badge-neutral-border)' },
};

const statusStyles: Record<string, string> = {
  'Open':        'var(--text3)',
  'In Progress': 'var(--primary-70)',
  'Completed':   'var(--success-80)',
  'Hold':        'var(--warning-80)',
};

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

function TaskRow({
  item,
  isLast,
  rowHighlights,
  onAction,
}: {
  item: CompactListTaskItem;
  isLast: boolean;
  rowHighlights: Map<string, WidgetHighlight>;
  onAction?: (query: string) => void;
}) {
  const pri = priorityStyles[item.priority] ?? priorityStyles.Low;
  const statusColor = statusStyles[item.status] ?? 'var(--text3)';
  const [tooltip, setTooltip] = useState<string | null>(null);

  // Row-level highlight: check all supported field keys
  const rowHl = rowHighlights.get('dueDate') ?? rowHighlights.get('title') ?? rowHighlights.get('status') ?? rowHighlights.get('priority');

  return (
    <div
      style={{
        position: 'relative',
        borderBottom: isLast ? 'none' : '1px solid var(--border)',
        ...(rowHl ? {
          boxShadow: `inset 3px 0 0 0 ${HL_BORDER[rowHl.type]}`,
          background: HL_BG[rowHl.type],
          paddingLeft: 12,
          marginLeft: -12,
          borderRadius: '4px',
        } : {}),
      }}
      onMouseEnter={() => rowHl && setTooltip(rowHl.fieldPath)}
      onMouseLeave={() => setTooltip(null)}
    >
      {/* Tooltip */}
      {rowHl && tooltip && (
        <div 
          className="highlight-tooltip"
          style={{
          position: 'absolute',
          bottom: 'calc(100% + 6px)',
          left: 12,
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
          {rowHl.message}
        </div>
      )}

      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '10px 0',
        transition: 'var(--transition-fast)',
        cursor: 'default',
      }}
      onMouseEnter={(e) => !rowHl && (e.currentTarget.style.background = 'rgba(0, 0, 0, 0.02)')}
      onMouseLeave={(e) => !rowHl && (e.currentTarget.style.background = 'transparent')}
      >
        {/* Title + meta */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 12.5,
            fontWeight: 600,
            color: 'var(--text)',
            marginBottom: 2,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            fontFamily: 'var(--sans)',
          }}>
            {item.title}
          </div>
          <div style={{ fontSize: 10.5, color: 'var(--text3)', fontFamily: 'var(--mono)' }}>
            <span style={{ fontFamily: 'var(--mono)' }}>Due: {formatDate(item.dueDate)}</span> &middot; {item.assignedTo}
          </div>
          {/* Action chip */}
          {rowHl?.action && onAction && (
            <button
              onClick={() => onAction(rowHl.action!.query)}
              className="highlight-action-chip"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                marginTop: 5,
                border: '1px solid var(--border)',
                borderRadius: 99,
                padding: '2px 8px',
                fontSize: 10,
                fontWeight: 600,
                fontFamily: 'var(--sans)',
                cursor: 'pointer',
              }}
            >
              &rarr; {rowHl.action.label}
            </button>
          )}
        </div>

        {/* Priority badge */}
        <span style={{
          flexShrink: 0,
          fontSize: 10, fontWeight: 600,
          background: pri.bg, color: pri.text,
          border: `1px solid ${pri.border}`,
          borderRadius: 'var(--radius-inner)',
          padding: '2px 8px',
          fontFamily: 'var(--sans)',
        }}>
          {item.priority}
        </span>

        {/* Status */}
        <span style={{
          flexShrink: 0,
          fontSize: 10,
          fontWeight: 500,
          color: statusColor,
          minWidth: 72,
          textAlign: 'right',
          fontFamily: 'var(--mono)',
        }}>
          {item.status}
        </span>
      </div>
    </div>
  );
}

function ActivityRow({
  item,
  isLast,
  rowHighlights,
}: {
  item: CompactListActivityItem;
  isLast: boolean;
  rowHighlights: Map<string, WidgetHighlight>;
}) {
  const rowHl = rowHighlights.get('text') ?? rowHighlights.get('timestamp');
  const glyph = ACTIVITY_ICON[item.icon ?? ''] ?? '•';
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '10px 0',
        borderBottom: isLast ? 'none' : '1px solid var(--border)',
        ...(rowHl ? {
          boxShadow: `inset 3px 0 0 0 ${HL_BORDER[rowHl.type]}`,
          background: HL_BG[rowHl.type],
          paddingLeft: 12,
          marginLeft: -12,
          borderRadius: '4px',
        } : {}),
      }}
    >
      <span style={{
        flexShrink: 0,
        width: 24, height: 24,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 14,
        background: 'var(--surface2)',
        border: '1px solid var(--border)',
        borderRadius: 6,
      }}>
        {glyph}
      </span>
      <div style={{
        flex: 1, minWidth: 0,
        fontSize: 12.5, color: 'var(--text)',
        fontFamily: 'var(--sans)',
        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
      }}>
        {item.text}
      </div>
      <span style={{
        flexShrink: 0,
        fontSize: 10.5, color: 'var(--text3)',
        fontFamily: 'var(--mono)',
        textAlign: 'right',
      }}>
        {item.timestamp}
      </span>
    </div>
  );
}

export default function CompactList({ data: rawData, highlights, onAction }: WidgetProps & { highlights?: WidgetHighlight[]; onAction?: (query: string) => void }) {
  const data = rawData as unknown as CompactListData;

  // Build per-row highlight maps: rowIndex -> Map<fieldKey, WidgetHighlight>
  const rowHighlightMaps: Map<string, WidgetHighlight>[] = data.items.map(() => new Map());
  for (const hl of highlights ?? []) {
    // Matches "items[N].fieldKey"
    const m = hl.fieldPath.match(/^items\[(\d+)\]\.(.+)$/);
    if (m) {
      const rowIdx = parseInt(m[1], 10);
      const fieldKey = m[2];
      if (rowIdx < rowHighlightMaps.length) {
        rowHighlightMaps[rowIdx].set(fieldKey, hl);
      }
    }
  }

  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-card)',
      padding: '16px',
      overflow: 'clip',
    }}>
      <div style={{
        fontSize: 13,
        fontWeight: 700,
        color: 'var(--text)',
        marginBottom: 12,
        fontFamily: 'var(--sans)',
      }}>
        {data.title}
      </div>
      <div style={{ marginLeft: 16 }}>
        {data.kind === 'activity'
          ? data.items.map((item, i) => (
              <ActivityRow
                key={item.id}
                item={item}
                isLast={i === data.items.length - 1}
                rowHighlights={rowHighlightMaps[i]}
              />
            ))
          : data.items.map((item, i) => (
              <TaskRow
                key={item.id}
                item={item}
                isLast={i === data.items.length - 1}
                rowHighlights={rowHighlightMaps[i]}
                onAction={onAction}
              />
            ))}
      </div>
    </div>
  );
}
