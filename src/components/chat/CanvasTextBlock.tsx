'use client';

import { useEffect, useRef } from 'react';
import type { ClosingText } from '@/lib/types';

// ── Badge config ──────────────────────────────────────────────────────────────

const BADGE: Record<string, { label: string; bg: string; color: string }> = {
  insight:     { label: 'Insight',        bg: 'rgba(59,130,246,0.10)',  color: '#2563eb' },
  description: { label: 'Action Summary', bg: 'rgba(34,197,94,0.10)',   color: '#16a34a' },
  question:    { label: 'Clarification',  bg: 'rgba(245,158,11,0.10)',  color: '#d97706' },
};

// ── Speaker icons ─────────────────────────────────────────────────────────────

function SpeakerIdleIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
      <path d="M3 6h2l3-3v10l-3-3H3V6z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
      <path d="M11 5.5a3 3 0 0 1 0 5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

function SpeakerActiveIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
      <path d="M3 6h2l3-3v10l-3-3H3V6z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
      <style>{`
        @keyframes wave1 { 0%,100%{opacity:0.3}50%{opacity:1} }
        @keyframes wave2 { 0%,100%{opacity:0.3}50%{opacity:1} }
        @keyframes wave3 { 0%,100%{opacity:0.3}50%{opacity:1} }
      `}</style>
      <rect x="11"   y="6.5" width="1.2" height="3"   rx="0.6" fill="currentColor" style={{ animation: 'wave1 0.8s ease 0s   infinite' }} />
      <rect x="13.2" y="5.5" width="1.2" height="5"   rx="0.6" fill="currentColor" style={{ animation: 'wave2 0.8s ease 0.2s infinite' }} />
      <rect x="15.4" y="4.5" width="1.2" height="7"   rx="0.6" fill="currentColor" style={{ animation: 'wave3 0.8s ease 0.4s infinite' }} />
    </svg>
  );
}

// ── Blinking cursor ───────────────────────────────────────────────────────────

function Cursor() {
  return (
    <>
      <style>{`
        @keyframes kai-blink { 0%,100%{opacity:1} 50%{opacity:0} }
      `}</style>
      <span
        aria-hidden
        style={{
          display: 'inline-block',
          width: 2,
          height: '1em',
          background: 'rgba(91,106,240,0.85)',
          borderRadius: 1,
          verticalAlign: 'text-bottom',
          marginLeft: 2,
          animation: 'kai-blink 900ms step-end infinite',
        }}
      />
    </>
  );
}

// ── Inline markdown renderer (bold, italic, inline-code) ─────────────────────

function InlineText({ text, isStreaming, showCursor }: { text: string; isStreaming: boolean; showCursor: boolean }) {
  // Split on **bold**, *italic*, `code`
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={i} style={{ fontWeight: 700, color: 'var(--text)' }}>{part.slice(2, -2)}</strong>;
        }
        if (part.startsWith('*') && part.endsWith('*')) {
          return <em key={i}>{part.slice(1, -1)}</em>;
        }
        if (part.startsWith('`') && part.endsWith('`')) {
          return (
            <code key={i} style={{ fontFamily: 'var(--mono)', fontSize: 12, background: 'rgba(91,106,240,0.08)', padding: '1px 5px', borderRadius: 4, color: 'var(--text)' }}>
              {part.slice(1, -1)}
            </code>
          );
        }
        return <span key={i}>{part}</span>;
      })}
      {isStreaming && showCursor && <Cursor />}
    </>
  );
}

// ── Text renderer ─────────────────────────────────────────────────────────────

function BodyText({ text, isStreaming }: { text: string; isStreaming: boolean }) {
  const lines = text.split('\n');
  const nodes: React.ReactNode[] = [];
  let bulletBuffer: { text: string; isLast: boolean }[] = [];

  function flushBullets(key: number, attachCursor: boolean) {
    if (bulletBuffer.length === 0) return;
    nodes.push(
      <ul key={`ul-${key}`} style={{ margin: '6px 0 8px', paddingLeft: 20, listStyle: 'disc' }}>
        {bulletBuffer.map((b, i) => {
          const isLastBullet = i === bulletBuffer.length - 1;
          return (
            <li key={i} style={{ fontSize: 14, fontFamily: 'var(--sans)', color: 'var(--text)', lineHeight: 1.75, marginBottom: 2 }}>
              <InlineText text={b.text} isStreaming={isStreaming} showCursor={attachCursor && isLastBullet} />
            </li>
          );
        })}
      </ul>
    );
    bulletBuffer = [];
  }

  lines.forEach((line, idx) => {
    const isLast = idx === lines.length - 1;

    // Headings: ## or ###
    if (line.startsWith('### ')) {
      flushBullets(idx, false);
      nodes.push(
        <p key={idx} style={{ margin: '10px 0 4px', fontSize: 12, fontWeight: 700, fontFamily: 'var(--display)', color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          <InlineText text={line.slice(4)} isStreaming={isStreaming} showCursor={isLast} />
        </p>
      );
      return;
    }
    if (line.startsWith('## ')) {
      flushBullets(idx, false);
      nodes.push(
        <p key={idx} style={{ margin: '12px 0 4px', fontSize: 14, fontWeight: 700, fontFamily: 'var(--display)', color: 'var(--text)' }}>
          <InlineText text={line.slice(3)} isStreaming={isStreaming} showCursor={isLast} />
        </p>
      );
      return;
    }
    if (line.startsWith('# ')) {
      flushBullets(idx, false);
      nodes.push(
        <p key={idx} style={{ margin: '12px 0 6px', fontSize: 15, fontWeight: 700, fontFamily: 'var(--display)', color: 'var(--text)' }}>
          <InlineText text={line.slice(2)} isStreaming={isStreaming} showCursor={isLast} />
        </p>
      );
      return;
    }

    // Bullets: -, *, •, or numbered (1. 2. etc)
    const bulletMatch = line.match(/^(\s*)([-*•]|\d+\.)\s+(.*)$/);
    if (bulletMatch) {
      bulletBuffer.push({ text: bulletMatch[3], isLast });
      if (isLast) flushBullets(idx, isStreaming);
      return;
    }

    // Flush any pending bullets before a non-bullet line
    flushBullets(idx, false);

    if (line.trim()) {
      nodes.push(
        <p key={idx} style={{ margin: '0 0 6px', fontSize: 14, fontFamily: 'var(--sans)', color: 'var(--text)', lineHeight: 1.75 }}>
          <InlineText text={line} isStreaming={isStreaming} showCursor={isLast} />
        </p>
      );
    } else if (isStreaming && isLast && text.endsWith('\n')) {
      nodes.push(<p key={idx} style={{ margin: 0 }}><Cursor /></p>);
    }
  });

  flushBullets(lines.length, isStreaming);

  return <div>{nodes}</div>;
}

// ── Main component ────────────────────────────────────────────────────────────

interface Props {
  /**
   * Static fallback text from fixture. Rendered when:
   *   - Demo mode is active (no LLM call), OR
   *   - LLM stream failed/timed-out AND streamingText is empty.
   */
  closingText: ClosingText;
  /**
   * Live text accumulating from the LLM stream. Takes priority over closingText
   * once it has at least one character.
   */
  streamingText?: string;
  /** True while the fetch is in-flight — shows blinking cursor. */
  isStreaming?: boolean;
  isReading?: boolean;
  onToggleTTS?: () => void;
  /** Fired when streaming completes and the final text is ready for TTS. */
  onStreamComplete?: (text: string) => void;
}

export default function CanvasTextBlock({
  closingText,
  streamingText = '',
  isStreaming = false,
  isReading = false,
  onToggleTTS,
  onStreamComplete,
}: Props) {
  const badge = BADGE[closingText.type] ?? BADGE.insight;

  // In AI mode (isStreaming=true but no text yet) show nothing — no fixture flash.
  // Once streaming ends without any LLM text (failed/empty), fall back to fixture.
  const aiModeActive = isStreaming || streamingText.length > 0;
  const displayText = streamingText.length > 0
    ? streamingText
    : aiModeActive
      ? ''
      : closingText.text;
  const showCursor = isStreaming;

  // Fire onStreamComplete once streaming ends and we have dynamic text
  const completedRef = useRef(false);
  useEffect(() => {
    if (!isStreaming && streamingText.length > 0 && !completedRef.current) {
      completedRef.current = true;
      onStreamComplete?.(streamingText);
    }
  }, [isStreaming, streamingText, onStreamComplete]);

  return (
    <div
      style={{
        width: '100%',
        marginTop: 16,
        borderLeft: `4px solid rgba(91,106,240,${isReading ? 1 : 0.85})`,
        borderRadius: '0 8px 8px 0',
        background: 'linear-gradient(135deg, rgba(91,106,240,0.04), transparent)',
        padding: '16px 20px 16px 24px',
      }}
      className={`animate-fade-in ${isReading ? 'animate-pulse-opacity' : ''}`}
    >
      {/* Top row: avatar + badge + speaker */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        {/* Kai avatar */}
        <div style={{
          width: 20, height: 20, borderRadius: '50%',
          background: 'rgba(91,106,240,1)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: 'white', fontFamily: 'var(--display)', lineHeight: 1 }}>K</span>
        </div>

        {/* Type badge */}
        <span style={{
          fontSize: 10, fontWeight: 600,
          padding: '2px 8px', borderRadius: 99,
          background: badge.bg, color: badge.color,
          fontFamily: 'var(--display)',
          letterSpacing: '0.02em',
        }}>
          {badge.label}
        </span>

        {/* Spacer + speaker */}
        <div style={{ flex: 1 }} />
        {onToggleTTS && (
          <button
            onClick={onToggleTTS}
            title={isReading ? 'Stop reading' : 'Read aloud'}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: isReading ? 'rgba(91,106,240,1)' : 'var(--text3)',
              padding: 2, display: 'flex', alignItems: 'center',
              transition: 'color 150ms ease',
            }}
            onMouseEnter={(e) => { if (!isReading) e.currentTarget.style.color = 'var(--text2)'; }}
            onMouseLeave={(e) => { if (!isReading) e.currentTarget.style.color = 'var(--text3)'; }}
          >
            {isReading ? <SpeakerActiveIcon /> : <SpeakerIdleIcon />}
          </button>
        )}
      </div>

      {/* Body text — hidden until first token or fallback text is ready */}
      {displayText.length > 0 && <BodyText text={displayText} isStreaming={showCursor} />}
      {/* Cursor-only state: streaming has started but no text yet */}
      {displayText.length === 0 && isStreaming && <Cursor />}
    </div>
  );
}
