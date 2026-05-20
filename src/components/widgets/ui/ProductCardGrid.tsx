'use client';

import { useEffect, useRef, useState } from 'react';
import type { WidgetProps, ProductCardGridData, ProductCardItem, WidgetHighlight } from '@/lib/types';

const STOCK_BADGE: Record<string, { bg: string; text: string; border: string; label: string }> = {
  'In Stock':                { bg: 'var(--badge-success-bg)', text: 'var(--badge-success-text)', border: 'var(--badge-success-border)', label: 'In Stock' },
  'Pre-Book':                { bg: 'var(--badge-info-bg)',    text: 'var(--badge-info-text)',    border: 'var(--badge-info-border)',    label: 'Pre-Book' },
  'Buy Now, Limited Quantity': { bg: 'var(--badge-warning-bg)', text: 'var(--badge-warning-text)', border: 'var(--badge-warning-border)', label: 'Limited Qty' },
  'Out of Stock':            { bg: 'var(--badge-danger-bg)',  text: 'var(--badge-danger-text)',  border: 'var(--badge-danger-border)',  label: 'Out of Stock' },
  'PhaseOut':                { bg: 'var(--badge-danger-bg)',  text: 'var(--badge-danger-text)',  border: 'var(--badge-danger-border)',  label: 'PhaseOut' },
};

const HL_BORDER: Record<WidgetHighlight['type'], string> = {
  urgent:   'var(--error-80)',
  warning:  'var(--warning-80)',
  positive: 'var(--success-80)',
  info:     'var(--info-80)',
};

function StockBadge({ status }: { status: string }) {
  const s = STOCK_BADGE[status] ?? { bg: 'var(--badge-neutral-bg)', text: 'var(--badge-neutral-text)', border: 'var(--badge-neutral-border)', label: status };
  return (
    <span style={{
      display: 'inline-block',
      padding: '2px 6px',
      fontSize: 10,
      fontWeight: 600,
      borderRadius: 4,
      background: s.bg,
      color: s.text,
      border: `1px solid ${s.border}`,
      whiteSpace: 'nowrap',
    }}>
      {s.label}
    </span>
  );
}

function ProductCard({
  item,
  highlight,
  removeMode,
  removed,
  onToggleRemove,
}: {
  item: ProductCardItem;
  highlight?: WidgetHighlight;
  removeMode?: boolean;
  removed?: boolean;
  onToggleRemove?: () => void;
}) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: 6,
      padding: 8,
      borderRadius: 'var(--radius-inner)',
      border: `1px solid ${removed ? 'var(--error-80)' : highlight ? HL_BORDER[highlight.type] : 'var(--border)'}`,
      background: 'var(--surface)',
      position: 'relative',
      opacity: removed ? 0.55 : 1,
      transition: 'opacity 150ms ease, border-color 150ms ease',
    }}>
      {/* Remove-mode trash button (top-right) */}
      {removeMode && (
        <button
          type="button"
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggleRemove?.(); }}
          title={removed ? 'Restore to catalog' : 'Remove from catalog'}
          style={{
            position: 'absolute',
            top: 6,
            right: 6,
            zIndex: 2,
            width: 28,
            height: 28,
            borderRadius: '50%',
            border: `1px solid ${removed ? 'var(--success-80)' : 'var(--error-80)'}`,
            background: removed ? 'var(--badge-success-bg)' : 'var(--badge-danger-bg)',
            color: removed ? 'var(--badge-success-text)' : 'var(--badge-danger-text)',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 0,
            fontSize: 14,
            lineHeight: 1,
            boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
          }}
        >
          {removed ? '↺' : '🗑'}
        </button>
      )}
      <div style={{
        position: 'relative',
        width: '100%',
        aspectRatio: '1 / 1',
        background: 'var(--surface2)',
        borderRadius: 'var(--radius-inner)',
        overflow: 'hidden',
      }}>
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt={item.name}
            loading="lazy"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: 'block',
              filter: removed ? 'grayscale(1)' : 'none',
              transition: 'filter 150ms ease',
            }}
          />
        ) : null}
        {item.isHero && !removeMode && (
          <span
            aria-label="Hero product"
            style={{
              position: 'absolute',
              top: 4,
              right: 4,
              fontSize: 14,
              filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.4))',
            }}
          >
            🌟
          </span>
        )}
        {removed && (
          <div style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(255,255,255,0.35)',
          }}>
            <span style={{
              fontSize: 11,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.6px',
              color: 'var(--badge-danger-text)',
              background: 'var(--badge-danger-bg)',
              border: `1px solid var(--badge-danger-border)`,
              borderRadius: 4,
              padding: '3px 8px',
            }}>
              Removed
            </span>
          </div>
        )}
      </div>
      <div style={{
        fontSize: 13,
        fontWeight: 600,
        color: 'var(--text)',
        lineHeight: 1.3,
        display: '-webkit-box',
        WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden',
        textDecoration: removed ? 'line-through' : 'none',
      }}>
        {item.name}
      </div>
      <div style={{
        fontFamily: 'var(--mono)',
        fontSize: 11,
        color: 'var(--text3)',
      }}>
        {item.sku}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 6 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>
          ${item.retailPrice.toFixed(2)}
        </span>
        <span style={{ fontSize: 11, color: 'var(--text3)' }}>
          case {item.caseQty}
        </span>
      </div>
      <StockBadge status={item.stockStatus} />
    </div>
  );
}

interface ProductCardGridConfig {
  /** When true, render a trash icon on each card and report removal toggles via onRemovedChange. */
  removeMode?: boolean;
  /** Called whenever the set of "removed" SKUs changes. Parent uses this to compute surviving SKUs at confirm time. */
  onRemovedChange?: (removedSkus: string[]) => void;
}

export default function ProductCardGrid({
  data: rawData,
  config: rawConfig,
  highlights,
}: WidgetProps & { highlights?: WidgetHighlight[] }) {
  const data = rawData as unknown as ProductCardGridData;
  const config = (rawConfig ?? {}) as ProductCardGridConfig;
  const items = data.items ?? [];

  // Per-item highlight map: parses "items[N].fieldKey" the same way CompactList does.
  const itemHighlights: (WidgetHighlight | undefined)[] = items.map(() => undefined);
  for (const hl of highlights ?? []) {
    if (typeof hl.fieldPath !== 'string') continue;
    const m = hl.fieldPath.match(/^items\[(\d+)\]/);
    if (m) {
      const idx = parseInt(m[1], 10);
      if (idx < itemHighlights.length) itemHighlights[idx] = hl;
    }
  }

  // Local state for which SKUs are currently marked for removal. Driven only
  // when removeMode is on; toggles flow back to the parent via onRemovedChange
  // so the consent flow can read surviving SKUs at confirm time.
  const [removed, setRemoved] = useState<Set<string>>(new Set());

  // Reset whenever we leave remove mode so the next entry starts clean.
  useEffect(() => {
    if (!config.removeMode) setRemoved(new Set());
  }, [config.removeMode]);

  const onChangeRef = useRef(config.onRemovedChange);
  onChangeRef.current = config.onRemovedChange;
  useEffect(() => {
    onChangeRef.current?.(Array.from(removed));
  }, [removed]);

  const toggle = (sku: string) => {
    setRemoved((prev) => {
      const next = new Set(prev);
      if (next.has(sku)) next.delete(sku);
      else next.add(sku);
      return next;
    });
  };

  const surviving = items.filter((i) => !removed.has(i.sku)).length;
  const titleText = config.removeMode
    ? `Tap the 🗑 icon to remove products — ${surviving} of ${items.length} will be included`
    : data.title;

  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-card)',
      padding: 16,
    }}>
      {titleText && (
        <div style={{
          fontSize: 13,
          fontWeight: 600,
          color: config.removeMode ? 'var(--badge-danger-text)' : 'var(--text)',
          marginBottom: 12,
        }}>
          {titleText}
        </div>
      )}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
        gap: 12,
      }}>
        {items.map((item, idx) => (
          <ProductCard
            key={item.sku}
            item={item}
            highlight={itemHighlights[idx]}
            removeMode={config.removeMode}
            removed={removed.has(item.sku)}
            onToggleRemove={() => toggle(item.sku)}
          />
        ))}
      </div>
    </div>
  );
}
