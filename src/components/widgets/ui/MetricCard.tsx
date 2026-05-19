'use client';

import { useState, useEffect } from 'react';
import type { WidgetProps, MetricCardData, WidgetHighlight } from '@/lib/types';

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

function CountUp({ value }: { value: string | number }) {
  const [displayValue, setDisplayValue] = useState(0);
  
  useEffect(() => {
    // Basic parser for numbers with symbols like "$", "%", "k"
    const numericPart = typeof value === 'string' 
      ? parseFloat(value.replace(/[^0-9.]/g, '')) 
      : value;
    
    if (isNaN(numericPart)) return;

    let start = 0;
    const end = numericPart;
    const duration = 1500;
    const startTime = performance.now();

    function update(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // easeOutExpo
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      
      const current = start + (end - start) * eased;
      setDisplayValue(current);

      if (progress < 1) {
        requestAnimationFrame(update);
      }
    }

    requestAnimationFrame(update);
  }, [value]);

  // Replace the entire numeric run (digits, commas, decimals) — not just the
  // first digit cluster — so values like "$18,200" don't get re-formatted as
  // "$18,200,200".
  const formatted = typeof value === 'string'
    ? value.replace(/[0-9][0-9,.]*/, displayValue.toLocaleString(undefined, {
        maximumFractionDigits: displayValue > 100 ? 0 : 1,
      }))
    : Math.round(displayValue).toLocaleString();

  return <>{formatted}</>;
}

function TrendIndicator({ direction, percent, period }: { direction: string; percent: number; period: string }) {
  const color = direction === 'up' ? 'var(--success-80)' : direction === 'down' ? 'var(--error-80)' : 'var(--text3)';
  const icon = direction === 'up' ? '▲' : direction === 'down' ? '▼' : '→';
  
  return (
    <span style={{ 
      fontSize: 10.5, 
      color, 
      display: 'flex', 
      alignItems: 'center', 
      gap: 3,
      fontWeight: 500,
      fontFamily: 'var(--mono)'
    }}>
      <span style={{ fontSize: 9 }}>{icon}</span>
      <span>{percent}%</span>
      <span style={{ color: 'var(--text3)', marginLeft: 1 }}>{period}</span>
    </span>
  );
}

export default function MetricCard({ data: rawData, highlights, onAction }: WidgetProps & { highlights?: WidgetHighlight[]; onAction?: (query: string) => void }) {
  const data = rawData as unknown as MetricCardData;
  const [showTooltip, setShowTooltip] = useState(false);

  // Match on field name: "value", "label", "trend" — take the first match
  const hl = (highlights ?? []).find((h) =>
    h.fieldPath === 'value' || h.fieldPath === 'label' || h.fieldPath === 'trend'
  );

  return (
    <div
      style={{
        background: hl ? HL_BG[hl.type] : 'var(--surface2)',
        border: '1px solid var(--border)',
        borderLeft: hl ? `4px solid ${HL_BORDER[hl.type]}` : '1px solid var(--border)',
        borderRadius: 'var(--radius-card)',
        padding: '16px',
        minWidth: 180,
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        position: 'relative',
        overflow: 'visible',
        transition: 'var(--transition-default)',
        cursor: 'default',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        if (!hl) e.currentTarget.style.borderColor = 'var(--border2)';
        if (hl) setShowTooltip(true);
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        if (!hl) e.currentTarget.style.borderColor = 'var(--border)';
        if (hl) setShowTooltip(false);
      }}
    >
      {/* Top Accent Line — hidden when left border highlight is active */}
      {!hl && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          background: 'linear-gradient(90deg, var(--primary-80), var(--info-80))',
        }} />
      )}

      {/* Tooltip */}
      {hl && showTooltip && (
        <div style={{
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
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
          whiteSpace: 'nowrap',
          zIndex: 20,
          pointerEvents: 'none',
        }}>
          {hl.message}
        </div>
      )}

      <div style={{
        fontSize: 10.5,
        fontWeight: 400,
        color: 'var(--text3)',
        fontFamily: 'var(--sans)',
      }}>
        {data.label}
      </div>
      <div style={{
        fontSize: 22,
        fontWeight: 800,
        color: hl ? HL_BORDER[hl.type] : 'var(--text)',
        lineHeight: 1.1,
        fontFamily: 'var(--mono)',
        margin: '2px 0'
      }}>
        <CountUp value={data.value} />
      </div>
      {data.trend && (
        <TrendIndicator
          direction={data.trend.direction}
          percent={data.trend.percent}
          period={data.trend.period}
        />
      )}

      {/* Action chip */}
      {hl?.action && onAction && (
        <button
          onClick={() => onAction(hl.action!.query)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            marginTop: 6,
            background: HL_CHIP[hl.type],
            border: `1px solid ${HL_BORDER[hl.type]}`,
            borderRadius: 99,
            padding: '2px 8px',
            fontSize: 10,
            fontWeight: 600,
            fontFamily: 'var(--sans)',
            color: HL_BORDER[hl.type],
            cursor: 'pointer',
          }}
        >
          &rarr; {hl.action.label}
        </button>
      )}
    </div>
  );
}
