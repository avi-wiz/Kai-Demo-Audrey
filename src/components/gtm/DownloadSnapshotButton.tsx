'use client';

import { useState, useCallback, useRef } from 'react';
import { toPng } from 'html-to-image';

interface DownloadSnapshotButtonProps {
  /** Slugified filename stem; ISO date + .png are appended automatically. */
  filenameStem: string;
  /** Returns the DOM node to capture. Called at click time so the node is live. */
  getTarget: () => HTMLElement | null;
}

function DownloadIcon({ size = 13 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <path d="M8 2v8M5 7l3 3 3-3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M2.5 12.5v1A1.5 1.5 0 0 0 4 15h8a1.5 1.5 0 0 0 1.5-1.5v-1" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
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

function SpinnerIcon({ size = 13 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" style={{ animation: 'kai-spin 700ms linear infinite' }}>
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.4" strokeOpacity="0.25" />
      <path d="M14 8a6 6 0 0 0-6-6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

export default function DownloadSnapshotButton({ filenameStem, getTarget }: DownloadSnapshotButtonProps) {
  const [state, setState] = useState<'idle' | 'capturing' | 'done'>('idle');
  const resetRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleClick = useCallback(async () => {
    if (state !== 'idle') return;
    const node = getTarget();
    if (!node) return;
    setState('capturing');

    // Temporarily un-clip any horizontally-scrolling children inside the frame
    // so widgets like UW-002 MetricCardRow (overflowX: auto) render every card
    // into the snapshot instead of clipping cards that scroll off-screen.
    // We collect the elements we touched and restore them in `finally`.
    const overflowOverrides: { el: HTMLElement; overflowX: string; overflowY: string }[] = [];
    const scrollers = node.querySelectorAll<HTMLElement>('*');
    scrollers.forEach((el) => {
      const cs = window.getComputedStyle(el);
      if (cs.overflowX === 'auto' || cs.overflowX === 'scroll') {
        overflowOverrides.push({
          el,
          overflowX: el.style.overflowX,
          overflowY: el.style.overflowY,
        });
        el.style.overflowX = 'visible';
        el.style.overflowY = 'visible';
      }
    });

    try {
      // Wait for any pending webfonts so Satoshi/JetBrains Mono rasterize
      // instead of falling back to the system stack in the PNG.
      if (document.fonts?.ready) {
        await document.fonts.ready;
      }
      // Capture the full natural width of the (now un-clipped) frame so any
      // content that previously overflowed horizontally is included.
      const naturalWidth = Math.max(node.scrollWidth, node.offsetWidth);
      const naturalHeight = Math.max(node.scrollHeight, node.offsetHeight);

      const dataUrl = await toPng(node, {
        pixelRatio: 2,
        cacheBust: true,
        backgroundColor: '#f0f2f5',
        width: naturalWidth,
        height: naturalHeight,
        // skipFonts avoids a SecurityError when html-to-image tries to read
        // cssRules on a cross-origin stylesheet (Google Fonts, Next font CDN,
        // browser extensions). Our fonts are loaded by the page anyway, so
        // the rasterized text picks them up from the live DOM.
        skipFonts: true,
        // Skip the floating share/download controls inside the frame so they
        // don't appear in the saved image.
        filter: (el) => {
          if (!(el instanceof HTMLElement)) return true;
          return el.dataset.snapshotIgnore !== 'true';
        },
      });
      const link = document.createElement('a');
      const iso = new Date().toISOString().slice(0, 10);
      link.download = `${filenameStem}-${iso}.png`;
      link.href = dataUrl;
      link.click();
      setState('done');
      if (resetRef.current) clearTimeout(resetRef.current);
      resetRef.current = setTimeout(() => setState('idle'), 2000);
    } catch {
      setState('idle');
    } finally {
      // Restore the original overflow styles.
      for (const o of overflowOverrides) {
        o.el.style.overflowX = o.overflowX;
        o.el.style.overflowY = o.overflowY;
      }
    }
  }, [getTarget, filenameStem, state]);

  const labelMap = { idle: 'Download as PNG', capturing: 'Capturing…', done: 'Saved' };
  const icon =
    state === 'capturing' ? <SpinnerIcon /> :
    state === 'done' ? <CheckIcon /> :
    <DownloadIcon />;

  return (
    <>
      <style>{`
        @keyframes kai-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
      <button
        onClick={handleClick}
        disabled={state !== 'idle'}
        title={labelMap[state]}
        data-snapshot-ignore="true"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 26,
          height: 26,
          borderRadius: 6,
          border: 'none',
          background: 'transparent',
          color: state === 'done' ? 'var(--primary-80)' : 'var(--text3)',
          cursor: state === 'idle' ? 'pointer' : 'default',
          transition: 'background 120ms ease, color 120ms ease',
          padding: 0,
        }}
        onMouseEnter={(e) => {
          if (state === 'idle') {
            e.currentTarget.style.background = 'var(--surface2)';
            e.currentTarget.style.color = 'var(--text2)';
          }
        }}
        onMouseLeave={(e) => {
          if (state === 'idle') {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = 'var(--text3)';
          }
        }}
      >
        {icon}
      </button>
    </>
  );
}
