'use client';

import { useState, useCallback } from 'react';
import type { ParsedWidget } from '@/components/engine/FrameParser';
import type { ClosingText } from '@/lib/types';

// ── Snapshot text builder ─────────────────────────────────────────────────────

function stringify(v: unknown): string {
  if (v === null || v === undefined) return '';
  if (typeof v === 'string') return v;
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  return '';
}

function extractWidgetText(w: ParsedWidget): string {
  const d = w.data;
  const lines: string[] = [];

  switch (w.widgetType) {
    // AgentReasoningCard
    case 'UW-014': {
      if (d.summary) lines.push(`[Reasoning] ${stringify(d.summary)}`);
      break;
    }
    // MetricCardRow
    case 'UW-002': {
      const cards = d.cards as Array<Record<string, unknown>> | undefined;
      if (cards?.length) {
        lines.push('[Metrics]');
        cards.forEach((c) => {
          const val = stringify(c.value);
          const label = stringify(c.label);
          const change = c.change ? ` (${stringify(c.change)})` : '';
          if (label && val) lines.push(`  ${label}: ${val}${change}`);
        });
      }
      break;
    }
    // Customer360Card
    case 'UW-007': {
      const name = stringify(d.customerName ?? d.name ?? '');
      if (name) lines.push(`[Customer] ${name}`);
      const metrics = d.metrics as { cards?: Array<Record<string, unknown>> } | undefined;
      metrics?.cards?.forEach((c) => {
        const val = stringify(c.value);
        const label = stringify(c.label);
        if (label && val) lines.push(`  ${label}: ${val}`);
      });
      break;
    }
    // EntityDetailCard
    case 'UW-003': {
      const title = stringify(d.title ?? '');
      const type = stringify(d.entityType ?? '');
      if (title) lines.push(`[${type || 'Item'}] ${title}`);
      const fields = d.fields as Array<Record<string, unknown>> | undefined;
      fields?.slice(0, 6).forEach((f) => {
        const label = stringify(f.label);
        const val = stringify(f.value);
        if (label && val) lines.push(`  ${label}: ${val}`);
      });
      break;
    }
    // CompactList
    case 'UW-011': {
      const title = stringify(d.title ?? '');
      if (title) lines.push(`[List] ${title}`);
      const items = d.items as Array<Record<string, unknown>> | undefined;
      items?.slice(0, 8).forEach((item) => {
        const primary = stringify(item.primary ?? item.title ?? item.label ?? item.name ?? '');
        const secondary = stringify(item.secondary ?? item.subtitle ?? item.value ?? '');
        if (primary) lines.push(`  • ${primary}${secondary ? ` — ${secondary}` : ''}`);
      });
      break;
    }
    // DataTable
    case 'UW-004': {
      const title = stringify(d.title ?? '');
      if (title) lines.push(`[Table] ${title}`);
      const columns = d.columns as Array<Record<string, unknown>> | undefined;
      const rows = d.rows as Array<Record<string, unknown>> | undefined;
      if (columns && rows) {
        const headers = columns.map((c) => stringify(c.label ?? c.key ?? '')).filter(Boolean);
        lines.push(`  ${headers.join(' | ')}`);
        rows.slice(0, 8).forEach((row) => {
          const cells = columns.map((c) => stringify(row[stringify(c.key ?? '')] ?? '')).filter(Boolean);
          lines.push(`  ${cells.join(' | ')}`);
        });
        if (rows.length > 8) lines.push(`  … and ${rows.length - 8} more rows`);
      }
      break;
    }
    // LineChart
    case 'CH-001': {
      const title = stringify(d.title ?? '');
      if (title) lines.push(`[Chart] ${title}`);
      const series = d.series as Array<Record<string, unknown>> | undefined;
      series?.forEach((s) => {
        const name = stringify(s.name ?? s.label ?? '');
        const points = s.data as Array<Record<string, unknown>> | undefined;
        if (name && points?.length) {
          const first = points[0];
          const last = points[points.length - 1];
          lines.push(`  ${name}: ${stringify(first.value ?? first.y ?? '')} → ${stringify(last.value ?? last.y ?? '')}`);
        }
      });
      break;
    }
    // DashboardCompositeWidget
    case 'UW-030': {
      const title = stringify(d.title ?? 'Dashboard');
      lines.push(`[Dashboard] ${title}`);
      const cells = d.cells as Array<Record<string, unknown>> | undefined;
      if (cells?.length) lines.push(`  ${cells.length} widget${cells.length !== 1 ? 's' : ''}`);
      break;
    }
    default:
      break;
  }

  return lines.join('\n');
}

function buildSnapshotText(widgets: ParsedWidget[], closingText?: ClosingText): string {
  const parts: string[] = [];
  parts.push('── Kai Snapshot ──────────────────────');

  // Widget data
  const widgetParts = widgets
    .map(extractWidgetText)
    .filter(Boolean);

  if (widgetParts.length) {
    parts.push(...widgetParts);
  }

  // Closing text / insight
  if (closingText?.text) {
    parts.push('');
    const typeLabel = closingText.type === 'insight'
      ? 'Insight'
      : closingText.type === 'description'
      ? 'Summary'
      : closingText.type === 'question'
      ? 'Question'
      : 'Note';
    parts.push(`[${typeLabel}]`);
    parts.push(closingText.text);
  }

  parts.push('──────────────────────────────────────');
  return parts.join('\n');
}

// ── Share icon ────────────────────────────────────────────────────────────────

function ShareIcon({ size = 13 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <circle cx="12.5" cy="3.5" r="1.8" stroke="currentColor" strokeWidth="1.3" />
      <circle cx="12.5" cy="12.5" r="1.8" stroke="currentColor" strokeWidth="1.3" />
      <circle cx="3.5" cy="8" r="1.8" stroke="currentColor" strokeWidth="1.3" />
      <path
        d="M5.2 7.1L10.8 4.4M5.2 8.9L10.8 11.6"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CheckIcon({ size = 13 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <path d="M2.5 8.5l4 4 7-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

interface ShareSnapshotButtonProps {
  widgets: ParsedWidget[];
  closingText?: ClosingText;
}

export default function ShareSnapshotButton({ widgets, closingText }: ShareSnapshotButtonProps) {
  const [state, setState] = useState<'idle' | 'copied'>('idle');

  const handleClick = useCallback(async () => {
    if (state === 'copied') return;
    const text = buildSnapshotText(widgets, closingText);
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Fallback for environments where clipboard API isn't available
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setState('copied');
    setTimeout(() => setState('idle'), 2000);
  }, [widgets, closingText, state]);

  const copied = state === 'copied';

  return (
    <>
      <style>{`
        @keyframes shareToastIn {
          from { opacity: 0; transform: translateY(8px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes shareToastOut {
          from { opacity: 1; transform: translateY(0) scale(1); }
          to   { opacity: 0; transform: translateY(-8px) scale(0.98); }
        }
      `}</style>

      <div style={{ position: 'relative', display: 'inline-flex' }}>
        {/* Toast */}
        {copied && (
          <div
            style={{
              position: 'absolute',
              bottom: 'calc(100% + 6px)',
              right: 0,
              whiteSpace: 'nowrap',
              padding: '5px 10px',
              background: 'var(--text)',
              color: 'var(--surface)',
              borderRadius: 6,
              fontFamily: 'var(--sans)',
              fontSize: 11,
              fontWeight: 500,
              pointerEvents: 'none',
              animation: 'shareToastIn 150ms ease both',
              zIndex: 50,
            }}
          >
            Snapshot copied to clipboard
          </div>
        )}

        {/* Button */}
        <button
          onClick={handleClick}
          title="Copy snapshot to clipboard"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 26,
            height: 26,
            borderRadius: 6,
            border: 'none',
            background: 'transparent',
            color: copied ? 'var(--primary-80)' : 'var(--text3)',
            cursor: 'pointer',
            transition: 'background 120ms ease, color 120ms ease',
            padding: 0,
          }}
          onMouseEnter={(e) => {
            if (!copied) {
              e.currentTarget.style.background = 'var(--surface2)';
              e.currentTarget.style.color = 'var(--text2)';
            }
          }}
          onMouseLeave={(e) => {
            if (!copied) {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = 'var(--text3)';
            }
          }}
        >
          {copied ? <CheckIcon /> : <ShareIcon />}
        </button>
      </div>
    </>
  );
}
