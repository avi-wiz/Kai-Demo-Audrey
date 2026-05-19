'use client';

import { useState } from 'react';
import type { WidgetProps, EntityDetailCardData, EntityDetailField, WidgetHighlight } from '@/lib/types';

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

function FieldRow({
  field,
  isEven,
  hl,
  onAction,
}: {
  field: EntityDetailField;
  isEven: boolean;
  hl?: WidgetHighlight;
  onAction?: (query: string) => void;
}) {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div
      style={{
        position: 'relative',
        boxShadow: hl ? `inset 3px 0 0 0 ${HL_BORDER[hl.type]}` : undefined,
        background: hl ? HL_BG[hl.type] : isEven ? 'var(--surface2)' : 'transparent',
        borderRadius: hl ? '4px' : undefined,
      }}
      onMouseEnter={() => hl && setShowTooltip(true)}
      onMouseLeave={() => hl && setShowTooltip(false)}
    >
      {hl && showTooltip && (
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

      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        padding: hl ? '9px 12px 9px 8px' : '9px 12px',
      }}>
        <span style={{
          fontSize: 10.5,
          fontWeight: 600,
          color: 'var(--text3)',
          textTransform: 'uppercase',
          letterSpacing: '0.4px',
          flexShrink: 0,
          minWidth: 100,
          fontFamily: 'var(--sans)',
        }}>
          {field.label}
        </span>
        <div style={{ textAlign: 'right' }}>
          {field.entityId ? (
            <span
              style={{
                fontSize: 13,
                fontWeight: 500,
                color: 'var(--primary-70)',
                cursor: 'pointer',
                fontFamily: 'var(--sans)',
              }}
              className="hover:underline"
            >
              {field.value}
              <span style={{ fontSize: 10, color: 'var(--text3)', fontFamily: 'var(--mono)', marginLeft: 5 }}>
                {field.entityId}
              </span>
            </span>
          ) : (
            <span style={{ fontSize: 13, fontWeight: 500, color: hl ? HL_BORDER[hl.type] : 'var(--text)', fontFamily: 'var(--sans)' }}>
              {field.value}
            </span>
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
        </div>
      </div>
    </div>
  );
}

export default function EntityDetailCard({ data: rawData, highlights, onAction }: WidgetProps & { highlights?: WidgetHighlight[]; onAction?: (query: string) => void }) {
  const data = rawData as unknown as EntityDetailCardData;

  // Build lookup by index ("fields[N]") and by label ("fields.{label}")
  const hlByIndex = new Map<number, WidgetHighlight>();
  const hlByLabel = new Map<string, WidgetHighlight>();
  for (const hl of highlights ?? []) {
    const idxMatch = hl.fieldPath.match(/^fields\[(\d+)\]/);
    if (idxMatch) {
      hlByIndex.set(parseInt(idxMatch[1], 10), hl);
    }
    const labelMatch = hl.fieldPath.match(/^fields\.(.+)$/);
    if (labelMatch) {
      hlByLabel.set(labelMatch[1].toLowerCase(), hl);
    }
  }

  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-card)',
      padding: '16px 20px',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{ padding: '0 0 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{
          fontSize: 10,
          fontWeight: 600,
          color: 'var(--badge-special-text)',
          background: 'var(--badge-special-bg)',
          border: '1px solid var(--badge-special-border)',
          borderRadius: 'var(--radius-badge)',
          padding: '2px 8px',
          textTransform: 'uppercase',
          flexShrink: 0,
          fontFamily: 'var(--sans)',
        }}>
          {data.entityType}
        </span>
        {data.title && (
          <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', fontFamily: 'var(--display)' }}>
            {data.title}
          </span>
        )}
      </div>

      {/* Fields */}
      <div style={{ borderRadius: 'var(--radius-inner)', overflow: 'hidden', border: '1px solid var(--border)' }}>
        {data.fields.map((field, i) => {
          const hl = hlByIndex.get(i) ?? hlByLabel.get(field.label.toLowerCase());
          return (
            <FieldRow key={field.label} field={field} isEven={i % 2 === 1} hl={hl} onAction={onAction} />
          );
        })}
      </div>
    </div>
  );
}
