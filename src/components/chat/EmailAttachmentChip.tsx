'use client';

import { useState, useCallback, useRef } from 'react';
import { toPng } from 'html-to-image';

interface EmailAttachmentChipProps {
  filename: string;
  /** Display-only file size (e.g. "248 KB"). Not a real measurement. */
  sizeLabel: string;
  /** Filename stem (no extension) for the downloaded PNG. */
  downloadStem: string;
}

function PaperclipIcon({ size = 13 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <path
        d="M11.5 6L6.8 10.7a2.1 2.1 0 0 1-3-3l5-5a3.3 3.3 0 0 1 4.6 4.6L7.9 12.7a4.5 4.5 0 0 1-6.3-6.3L6.5 1.5"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function DownloadIcon({ size = 13 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <path d="M8 2v8M5 7l3 3 3-3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M2.5 12.5v1A1.5 1.5 0 0 0 4 15h8a1.5 1.5 0 0 0 1.5-1.5v-1" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SpinnerIcon({ size = 13 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" style={{ animation: 'kai-spin 700ms linear infinite' }}>
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.4" strokeOpacity="0.25" />
      <path d="M14 8a6 6 0 0 0-6-6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
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

export default function EmailAttachmentChip({ filename, sizeLabel, downloadStem }: EmailAttachmentChipProps) {
  const [state, setState] = useState<'idle' | 'capturing' | 'done' | 'missing'>('idle');
  const resetRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleClick = useCallback(async () => {
    if (state !== 'idle') return;
    // The ad17-report response frame stays mounted upstream — find the most
    // recent one in the document. Falls back gracefully if it's no longer there.
    const nodes = document.querySelectorAll<HTMLElement>('[data-ad17-snapshot]');
    const target = nodes.length ? nodes[nodes.length - 1] : null;
    if (!target) {
      setState('missing');
      if (resetRef.current) clearTimeout(resetRef.current);
      resetRef.current = setTimeout(() => setState('idle'), 2000);
      return;
    }
    setState('capturing');

    // Same un-clipping treatment as DownloadSnapshotButton — covers cards in
    // UW-002's horizontal scroll container so all metric cards make it into
    // the PNG even if the row would overflow the chat width.
    const overflowOverrides: { el: HTMLElement; overflowX: string; overflowY: string }[] = [];
    target.querySelectorAll<HTMLElement>('*').forEach((el) => {
      const cs = window.getComputedStyle(el);
      if (cs.overflowX === 'auto' || cs.overflowX === 'scroll') {
        overflowOverrides.push({ el, overflowX: el.style.overflowX, overflowY: el.style.overflowY });
        el.style.overflowX = 'visible';
        el.style.overflowY = 'visible';
      }
    });

    try {
      if (document.fonts?.ready) await document.fonts.ready;
      const naturalWidth = Math.max(target.scrollWidth, target.offsetWidth);
      const naturalHeight = Math.max(target.scrollHeight, target.offsetHeight);
      const dataUrl = await toPng(target, {
        pixelRatio: 2,
        cacheBust: true,
        backgroundColor: '#f0f2f5',
        width: naturalWidth,
        height: naturalHeight,
        skipFonts: true,
        filter: (el) => {
          if (!(el instanceof HTMLElement)) return true;
          return el.dataset.snapshotIgnore !== 'true';
        },
      });
      const link = document.createElement('a');
      const iso = new Date().toISOString().slice(0, 10);
      link.download = `${downloadStem}-${iso}.png`;
      link.href = dataUrl;
      link.click();
      setState('done');
      if (resetRef.current) clearTimeout(resetRef.current);
      resetRef.current = setTimeout(() => setState('idle'), 2000);
    } catch {
      setState('idle');
    } finally {
      for (const o of overflowOverrides) {
        o.el.style.overflowX = o.overflowX;
        o.el.style.overflowY = o.overflowY;
      }
    }
  }, [downloadStem, state]);

  const trailingIcon =
    state === 'capturing' ? <SpinnerIcon /> :
    state === 'done' ? <CheckIcon /> :
    <DownloadIcon />;

  const trailingLabel =
    state === 'capturing' ? 'Capturing…' :
    state === 'done' ? 'Saved' :
    state === 'missing' ? 'Report not found' :
    'Download';

  return (
    <>
      <style>{`
        @keyframes kai-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
      <div
        style={{
          marginTop: 8,
          marginBottom: 4,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '10px 14px',
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-card)',
          maxWidth: 360,
        }}
      >
        {/* File icon */}
        <div style={{
          flexShrink: 0,
          width: 32, height: 32,
          borderRadius: 6,
          background: 'rgba(91,106,240,0.08)',
          color: 'var(--ai-accent)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <PaperclipIcon size={15} />
        </div>

        {/* Filename + size */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 12.5,
            fontWeight: 600,
            color: 'var(--text)',
            fontFamily: 'var(--sans)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {filename}
          </div>
          <div style={{
            fontSize: 11,
            color: 'var(--text3)',
            fontFamily: 'var(--mono)',
            marginTop: 1,
          }}>
            PNG · {sizeLabel}
          </div>
        </div>

        {/* Action button */}
        <button
          onClick={handleClick}
          disabled={state !== 'idle'}
          title={trailingLabel}
          style={{
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            padding: '5px 10px',
            background: 'transparent',
            color: state === 'done' ? 'var(--primary-80)' : state === 'missing' ? 'var(--error-80)' : 'var(--text2)',
            border: '1px solid var(--border)',
            borderRadius: 6,
            cursor: state === 'idle' ? 'pointer' : 'default',
            fontSize: 11.5,
            fontWeight: 500,
            fontFamily: 'var(--sans)',
            transition: 'all 120ms ease',
          }}
          onMouseEnter={(e) => {
            if (state === 'idle') {
              e.currentTarget.style.borderColor = 'var(--border2)';
              e.currentTarget.style.background = 'var(--surface2)';
            }
          }}
          onMouseLeave={(e) => {
            if (state === 'idle') {
              e.currentTarget.style.borderColor = 'var(--border)';
              e.currentTarget.style.background = 'transparent';
            }
          }}
        >
          {trailingIcon}
          <span>{trailingLabel}</span>
        </button>
      </div>
    </>
  );
}
