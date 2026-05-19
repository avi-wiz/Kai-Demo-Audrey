'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useGuidedTour, TOUR_PREFILL_QUERY } from '@/contexts/GuidedTourContext';
import { useLayout } from '@/contexts/LayoutContext';

// ── Tour step definitions ─────────────────────────────────────────────────────

interface TourStep {
  target: string;          // data-tour attribute value
  title: string;
  description: string;
  tooltipSide: 'right' | 'left' | 'top' | 'bottom';
  padding?: number;        // extra spotlight padding beyond the element
  tooltipOffset?: number;  // extra px gap between spotlight edge and tooltip
}

const STEPS: TourStep[] = [
  {
    target: 'sidebar',
    title: 'Navigate WizOrder & Kai',
    description: 'Use the sidebar to move between WizOrder pages and Kai features — orders, customers, products, CRM, and more.',
    tooltipSide: 'right',
    padding: 4,
  },
  {
    target: 'ask-kai-button',
    title: 'Open Kai in One Click',
    description: 'This button opens Kai chat from any WizOrder page. Kai picks up where you are and offers relevant actions.',
    tooltipSide: 'bottom',
    padding: 6,
  },
  {
    target: 'chat-input',
    title: 'Ask Anything',
    description: 'Type in plain language — "Show me overdue orders", "Draft a follow-up email for Acme Corp", or "Build a dashboard".',
    tooltipSide: 'top',
    padding: 8,
  },
  {
    target: 'action-chips',
    title: 'One-Tap Actions',
    description: 'After every response Kai suggests next steps. Click a chip to instantly drill deeper without typing.',
    tooltipSide: 'top',
    padding: 6,
    tooltipOffset: 16,
  },
  {
    target: 'proactive-brief',
    title: 'Your Morning Briefing',
    description: 'Each new conversation opens with a brief — flagged orders, tasks due today, and sales signals that need your attention.',
    tooltipSide: 'bottom',
    padding: 8,
  },
  {
    target: 'cmd-k-hint',
    title: 'Quick-Access Any Capability',
    description: 'Press ⌘K (or Ctrl+K) to open the command palette and jump to any Kai capability or WizOrder page instantly.',
    tooltipSide: 'top',
    padding: 6,
  },
];

// ── Spotlight rect ─────────────────────────────────────────────────────────────

interface SpotRect {
  x: number;
  y: number;
  w: number;
  h: number;
  r: number; // border radius
}

function getSpotRect(target: string, padding: number): SpotRect | null {
  const el = document.querySelector(`[data-tour="${target}"]`);
  if (!el) return null;
  const rect = el.getBoundingClientRect();
  const p = padding;
  return {
    x: rect.left - p,
    y: rect.top - p,
    w: rect.width + p * 2,
    h: rect.height + p * 2,
    r: 10,
  };
}

// ── Tooltip positioning ────────────────────────────────────────────────────────

const TOOLTIP_W = 300;
const TOOLTIP_GAP = 14;

interface TooltipPos {
  top?: number;
  left?: number;
  right?: number;
  bottom?: number;
  arrowSide: 'top' | 'bottom' | 'left' | 'right';
  arrowOffset: number; // px from edge to arrow center
}

function computeTooltipPos(spot: SpotRect, side: TourStep['tooltipSide'], extraOffset = 0): TooltipPos {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const TOOLTIP_H_APPROX = 180;
  const gap = TOOLTIP_GAP + extraOffset;

  switch (side) {
    case 'right': {
      const top = Math.max(12, Math.min(spot.y + spot.h / 2 - TOOLTIP_H_APPROX / 2, vh - TOOLTIP_H_APPROX - 12));
      return {
        top,
        left: spot.x + spot.w + gap,
        arrowSide: 'left',
        arrowOffset: spot.y + spot.h / 2 - top,
      };
    }
    case 'left': {
      const top = Math.max(12, Math.min(spot.y + spot.h / 2 - TOOLTIP_H_APPROX / 2, vh - TOOLTIP_H_APPROX - 12));
      return {
        top,
        left: spot.x - TOOLTIP_W - gap,
        arrowSide: 'right',
        arrowOffset: spot.y + spot.h / 2 - top,
      };
    }
    case 'bottom': {
      const left = Math.max(12, Math.min(spot.x + spot.w / 2 - TOOLTIP_W / 2, vw - TOOLTIP_W - 12));
      return {
        top: spot.y + spot.h + gap,
        left,
        arrowSide: 'top',
        arrowOffset: spot.x + spot.w / 2 - left,
      };
    }
    case 'top':
    default: {
      // Center over the spotlight, but clamp so tooltip never leaves the viewport
      const idealLeft = spot.x + spot.w / 2 - TOOLTIP_W / 2;
      const left = Math.max(12, Math.min(idealLeft, vw - TOOLTIP_W - 12));
      // Place above the spotlight; if there's not enough room above, flip below
      const idealTop = spot.y - TOOLTIP_H_APPROX - gap;
      const top = idealTop < 12 ? spot.y + spot.h + gap : idealTop;
      const arrowSide: TooltipPos['arrowSide'] = idealTop < 12 ? 'top' : 'bottom';
      return {
        top,
        left,
        arrowSide,
        arrowOffset: spot.x + spot.w / 2 - left,
      };
    }
  }
}

// ── Arrow SVG ─────────────────────────────────────────────────────────────────

function TooltipArrow({ side, offset }: { side: TooltipPos['arrowSide']; offset: number }) {
  const SIZE = 8;
  const clampedOffset = Math.max(16, Math.min(offset, TOOLTIP_W - 16));

  const commonStyle: React.CSSProperties = {
    position: 'absolute',
    width: SIZE * 2,
    height: SIZE * 2,
    pointerEvents: 'none',
  };

  if (side === 'top') {
    return (
      <div style={{ ...commonStyle, top: -(SIZE * 2 - 1), left: clampedOffset - SIZE }}>
        <svg width={SIZE * 2} height={SIZE * 2} viewBox={`0 0 ${SIZE * 2} ${SIZE * 2}`}>
          <path d={`M0 ${SIZE * 2} L${SIZE} 0 L${SIZE * 2} ${SIZE * 2}`} fill="var(--surface)" />
          <path d={`M0 ${SIZE * 2} L${SIZE} 1 L${SIZE * 2} ${SIZE * 2}`} stroke="var(--border)" strokeWidth="1" fill="none" />
        </svg>
      </div>
    );
  }
  if (side === 'bottom') {
    return (
      <div style={{ ...commonStyle, bottom: -(SIZE * 2 - 1), left: clampedOffset - SIZE }}>
        <svg width={SIZE * 2} height={SIZE * 2} viewBox={`0 0 ${SIZE * 2} ${SIZE * 2}`}>
          <path d={`M0 0 L${SIZE} ${SIZE * 2} L${SIZE * 2} 0`} fill="var(--surface)" />
          <path d={`M0 1 L${SIZE} ${SIZE * 2 - 1} L${SIZE * 2} 1`} stroke="var(--border)" strokeWidth="1" fill="none" />
        </svg>
      </div>
    );
  }
  if (side === 'left') {
    const clampedV = Math.max(16, Math.min(offset, 108));
    return (
      <div style={{ ...commonStyle, left: -(SIZE * 2 - 1), top: clampedV - SIZE }}>
        <svg width={SIZE * 2} height={SIZE * 2} viewBox={`0 0 ${SIZE * 2} ${SIZE * 2}`}>
          <path d={`M${SIZE * 2} 0 L0 ${SIZE} L${SIZE * 2} ${SIZE * 2}`} fill="var(--surface)" />
          <path d={`M${SIZE * 2 - 1} 0 L1 ${SIZE} L${SIZE * 2 - 1} ${SIZE * 2}`} stroke="var(--border)" strokeWidth="1" fill="none" />
        </svg>
      </div>
    );
  }
  // right
  const clampedV = Math.max(16, Math.min(offset, 108));
  return (
    <div style={{ ...commonStyle, right: -(SIZE * 2 - 1), top: clampedV - SIZE }}>
      <svg width={SIZE * 2} height={SIZE * 2} viewBox={`0 0 ${SIZE * 2} ${SIZE * 2}`}>
        <path d={`M0 0 L${SIZE * 2} ${SIZE} L0 ${SIZE * 2}`} fill="var(--surface)" />
        <path d={`M1 0 L${SIZE * 2 - 1} ${SIZE} L1 ${SIZE * 2}`} stroke="var(--border)" strokeWidth="1" fill="none" />
      </svg>
    </div>
  );
}

// ── Spotlight SVG overlay ──────────────────────────────────────────────────────

function SpotlightMask({ spot }: { spot: SpotRect }) {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const { x, y, w, h, r } = spot;

  // Rounded rect cutout using clip-path in SVG
  const cutout = `M${x + r},${y} h${w - r * 2} a${r},${r},0,0,1,${r},${r} v${h - r * 2} a${r},${r},0,0,1,-${r},${r} h-${w - r * 2} a${r},${r},0,0,1,-${r},-${r} v-${h - r * 2} a${r},${r},0,0,1,${r},-${r} z`;

  return (
    <svg
      style={{
        position: 'fixed',
        inset: 0,
        width: vw,
        height: vh,
        pointerEvents: 'none',
        zIndex: 2099,
      }}
      viewBox={`0 0 ${vw} ${vh}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <mask id="tour-mask">
          <rect width={vw} height={vh} fill="white" />
          <path 
            d={cutout} 
            fill="black" 
            style={{ transition: 'd 300ms cubic-bezier(0.4, 0, 0.2, 1)' }} 
          />
        </mask>
      </defs>
      <rect
        width={vw}
        height={vh}
        fill="rgba(15,18,28,0.62)"
        mask="url(#tour-mask)"
        style={{ transition: 'opacity 300ms ease' }}
      />
      {/* Spotlight ring */}
      <path
        d={cutout}
        fill="none"
        stroke="rgba(91,106,240,0.55)"
        strokeWidth="2"
        style={{ transition: 'd 300ms cubic-bezier(0.4, 0, 0.2, 1)' }}
      />
    </svg>
  );
}

// ── Main overlay component ────────────────────────────────────────────────────

// Targets that only exist when the chat view is mounted
const CHAT_VIEW_TARGETS = new Set(['chat-input', 'action-chips', 'proactive-brief']);

export default function GuidedTourOverlay() {
  const { active, overlayHidden, endTour, pauseTour, onTourWidgetsReady, onTourResume, triggerTourPrefill } = useGuidedTour();
  const { setView } = useLayout();
  const [stepIdx, setStepIdx] = useState(0);
  // When true, Next button is hidden on step 3 — tour waits for widgets before advancing
  const [waitingForWidgets, setWaitingForWidgets] = useState(false);
  const [spot, setSpot] = useState<SpotRect | null>(null);
  const [tooltipPos, setTooltipPos] = useState<TooltipPos | null>(null);
  const [animKey, setAnimKey] = useState(0);
  const rafRef = useRef<number | null>(null);
  const retryRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const step = STEPS[stepIdx];

  // Mutable refs so effect callbacks read current values without changing dep array size
  const stepRef = useRef(step);
  const setViewRef = useRef(setView);
  const setStepIdxRef = useRef(setStepIdx);
  stepRef.current = step;
  setViewRef.current = setView;
  setStepIdxRef.current = setStepIdx;

  const measureOrFallback = useCallback(() => {
    const s = stepRef.current;
    if (!s) return;
    const rect = getSpotRect(s.target, s.padding ?? 6);
    if (rect) {
      setSpot(rect);
      setTooltipPos(computeTooltipPos(rect, s.tooltipSide, s.tooltipOffset));
    } else {
      setSpot(null);
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      setTooltipPos({
        top: vh / 2 - 80,
        left: vw / 2 - TOOLTIP_W / 2,
        arrowSide: 'bottom',
        arrowOffset: TOOLTIP_W / 2,
      });
    }
  }, []);

  const measure = measureOrFallback;

  useEffect(() => {
    if (!active) return;
    setSpot(null);
    setTooltipPos(null);
    setAnimKey((k) => k + 1);
    setWaitingForWidgets(false);

    const currentStep = stepRef.current;

    if (currentStep && CHAT_VIEW_TARGETS.has(currentStep.target)) {
      setViewRef.current('chat');
    }

    // Step 3 (chat-input): prefill the input and wait for the user to send.
    if (currentStep?.target === 'chat-input') {
      setWaitingForWidgets(true);
      triggerTourPrefill();
      onTourWidgetsReady(() => {
        setWaitingForWidgets(false);
        setStepIdxRef.current((i) => i + 1);
      });
    }

    // Step 4 (action-chips): register resume callback so that when the user starts
    // a new conversation (proactive brief visible), tour picks up at step 5.
    if (currentStep?.target === 'action-chips') {
      onTourResume(() => {
        setStepIdxRef.current(4); // jump to step 5 (proactive-brief)
      });
    }

    rafRef.current = requestAnimationFrame(() => {
      const s = stepRef.current;
      const rect = s ? getSpotRect(s.target, s.padding ?? 6) : null;
      if (rect) {
        setSpot(rect);
        setTooltipPos(computeTooltipPos(rect, s!.tooltipSide, s!.tooltipOffset));
      } else {
        retryRef.current = setTimeout(() => {
          measureOrFallback();
        }, 320);
      }
    });

    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (retryRef.current) clearTimeout(retryRef.current);
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure, true);
    };
  }, [active, stepIdx, measure, onTourWidgetsReady, onTourResume]);

  // Reset step when tour starts
  useEffect(() => {
    if (active) setStepIdx(0);
  }, [active]);

  function goNext() {
    if (stepIdx < STEPS.length - 1) {
      setStepIdx((i) => i + 1);
    } else {
      endTour();
    }
  }

  function skipTour() {
    // On step 4 (action-chips), pause and wait for proactive brief to resume at step 5
    if (stepIdx === 3) {
      pauseTour();
    } else {
      endTour();
    }
  }

  if (!active || overlayHidden) return null;

  const isLast = stepIdx === STEPS.length - 1;

  return (
    <>
      <style>{`
        @keyframes tourTooltipIn {
          from { opacity: 0; transform: scale(0.95) translateY(4px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes tourSpotIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes tourBtnShimmer {
          0%   { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        .tour-next-btn {
          background: linear-gradient(
            105deg,
            var(--primary-80) 0%,
            var(--primary-80) 35%,
            rgba(255,255,255,0.28) 50%,
            var(--primary-80) 65%,
            var(--primary-80) 100%
          );
          background-size: 200% 100%;
          animation: tourBtnShimmer 2s linear infinite;
        }
        .tour-next-btn:hover { opacity: 0.88; }
      `}</style>

      {/* Dim + spotlight mask */}
      {spot && <SpotlightMask spot={spot} />}

      {/* Fallback full dim while measuring */}
      {!spot && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15,18,28,0.62)',
          zIndex: 2099,
        }} />
      )}

      {/* Tooltip */}
      {tooltipPos && (
        <div
          key={animKey}
          style={{
            position: 'fixed',
            top: tooltipPos.top,
            left: tooltipPos.left,
            right: tooltipPos.right,
            bottom: tooltipPos.bottom,
            width: TOOLTIP_W,
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 14,
            boxShadow: '0 8px 32px rgba(0,0,0,0.18), 0 0 0 1px var(--border)',
            padding: '20px 20px 16px',
            zIndex: 2100,
            animation: 'tourTooltipIn 220ms cubic-bezier(0.22,1,0.36,1) both',
          }}
        >
          <TooltipArrow
            side={tooltipPos.arrowSide}
            offset={tooltipPos.arrowOffset}
          />

          {/* Step counter */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 10,
          }}>
            <span style={{
              fontFamily: 'var(--display)',
              fontSize: 10.5,
              fontWeight: 700,
              color: 'var(--primary-80)',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
            }}>
              Step {stepIdx + 1} of {STEPS.length}
            </span>
            {/* Mini step dots */}
            <div style={{ display: 'flex', gap: 4 }}>
              {STEPS.map((_, i) => (
                <div key={i} style={{
                  width: i === stepIdx ? 14 : 5,
                  height: 5,
                  borderRadius: 99,
                  background: i === stepIdx
                    ? 'var(--primary-80)'
                    : i < stepIdx
                    ? 'rgba(22,136,95,0.3)'
                    : 'var(--border2)',
                  transition: 'width 200ms ease',
                }} />
              ))}
            </div>
          </div>

          <h3 style={{
            fontFamily: 'var(--display)',
            fontWeight: 700,
            fontSize: 15,
            color: 'var(--text)',
            margin: '0 0 6px',
            lineHeight: 1.3,
          }}>
            {step.title}
          </h3>

          <p style={{
            fontFamily: 'var(--sans)',
            fontSize: 13,
            color: 'var(--text2)',
            lineHeight: 1.6,
            margin: '0 0 16px',
          }}>
            {step.description}
          </p>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <button
              onClick={skipTour}
              style={{
                background: 'none',
                border: 'none',
                fontFamily: 'var(--sans)',
                fontSize: 12,
                color: 'var(--text3)',
                cursor: 'pointer',
                padding: '4px 0',
                transition: 'color 120ms ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text2)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text3)'; }}
            >
              Skip tour
            </button>

            {waitingForWidgets ? (
              <span style={{
                fontFamily: 'var(--sans)',
                fontSize: 12,
                color: 'var(--primary-80)',
                fontStyle: 'italic',
              }}>
                Send the query to continue →
              </span>
            ) : (
            <button
              className="tour-next-btn"
              onClick={goNext}
              style={{
                height: 34,
                padding: '0 18px',
                color: 'white',
                border: 'none',
                borderRadius: 8,
                fontFamily: 'var(--display)',
                fontWeight: 700,
                fontSize: 13,
                cursor: 'pointer',
                transition: 'opacity 150ms ease',
              }}
            >
              {isLast ? 'Done ✓' : 'Next →'}
            </button>
            )}
          </div>
        </div>
      )}
    </>
  );
}
