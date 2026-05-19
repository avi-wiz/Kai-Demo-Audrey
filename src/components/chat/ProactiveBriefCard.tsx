'use client';

import type { ProactiveBrief, BriefItem, ActionChip } from '@/lib/types';

// ── Priority config ───────────────────────────────────────────────────────────

const PRIORITY_DOT: Record<string, string> = {
  urgent:    'var(--error-80,  #ef4444)',
  attention: 'var(--warning-80,#f59e0b)',
  info:      'var(--info-80,   #3b82f6)',
};

const PRIORITY_ACCENT: Record<string, string> = {
  urgent:    'var(--error-80,  #ef4444)',
  attention: 'var(--warning-80,#f59e0b)',
  info:      'transparent',
};

// ── Icon map (icon string → inline SVG) ──────────────────────────────────────

function BriefIcon({ name }: { name: string }) {
  const style: React.CSSProperties = { flexShrink: 0 };
  switch (name) {
    case 'alert':
      return (
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style={style}>
          <path d="M8 2L14 13H2L8 2z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
          <path d="M8 7v3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          <circle cx="8" cy="11.5" r="0.6" fill="currentColor" />
        </svg>
      );
    case 'clock':
      return (
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style={style}>
          <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.3" />
          <path d="M8 5v3.5l2.5 1.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        </svg>
      );
    case 'calendar':
      return (
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style={style}>
          <rect x="1.5" y="3" width="13" height="11.5" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
          <path d="M5 1.5v3M11 1.5v3M1.5 7h13" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        </svg>
      );
    case 'order':
    case 'orders':
      return (
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style={style}>
          <rect x="2" y="1.5" width="12" height="13" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
          <path d="M5 5.5h6M5 8h6M5 10.5h4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        </svg>
      );
    case 'trend':
      return (
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style={style}>
          <path d="M1.5 12l4-4 3 3 6-7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'chart':
      return (
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style={style}>
          <path d="M1.5 13h13M4 13V9m4 4V6m4 7V3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        </svg>
      );
    case 'check':
      return (
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style={style}>
          <path d="M2.5 8.5l4 4 7-7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'shipping':
      return (
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style={style}>
          <path d="M1 4h9v7.5H1V4z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
          <path d="M10 6h2.5L15 9v2.5h-5V6z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
          <circle cx="3.5" cy="12.5" r="1.2" stroke="currentColor" strokeWidth="1.1" />
          <circle cx="11.5" cy="12.5" r="1.2" stroke="currentColor" strokeWidth="1.1" />
        </svg>
      );
    case 'flag':
      return (
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style={style}>
          <path d="M3 2v12M3 2h9l-2.5 4L12 10H3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'star':
      return (
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style={style}>
          <path d="M8 1.5l1.8 3.6 4 .6-2.9 2.8.7 4L8 10.6l-3.6 1.9.7-4L2.2 5.7l4-.6L8 1.5z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
        </svg>
      );
    case 'users':
      return (
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style={style}>
          <circle cx="6" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.3" />
          <path d="M1 14c0-3 2-4 5-4s5 1 5 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          <circle cx="12" cy="5" r="2" stroke="currentColor" strokeWidth="1.3" />
          <path d="M15 14c0-2-1-3.2-3-3.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        </svg>
      );
    case 'user':
      return (
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style={style}>
          <circle cx="8" cy="5.5" r="3" stroke="currentColor" strokeWidth="1.3" />
          <path d="M2 14c0-3.5 2.5-5 6-5s6 1.5 6 5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        </svg>
      );
    case 'package':
      return (
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style={style}>
          <path d="M8 1.5l6 3.5v6L8 14.5 2 11V5l6-3.5z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
          <path d="M8 14.5V8.5M2 5l6 3.5 6-3.5M5.5 3.25L11.5 6.75" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        </svg>
      );
    case 'warning':
      return (
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style={style}>
          <path d="M8 2L14 13H2L8 2z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
          <path d="M8 7v2.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        </svg>
      );
    case 'tasks':
      return (
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style={style}>
          <path d="M2 4.5h12M2 8h8M2 11.5h6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          <circle cx="13" cy="11" r="2.5" stroke="currentColor" strokeWidth="1.2" />
          <path d="M12 11l.8.8 1.4-1.4" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'deal':
      return (
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style={style}>
          <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.3" />
          <path d="M8 4.5v7M6 9.5c0 1.1.9 2 2 2s2-.9 2-2-2-1.5-2-2.5.9-1.5 2-1.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      );
    default:
      return (
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style={style}>
          <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.3" />
        </svg>
      );
  }
}

// ── Chip button ───────────────────────────────────────────────────────────────

interface ChipButtonProps {
  chip: ActionChip;
  onChipClick?: (query: string) => void;
}

function ChipButton({ chip, onChipClick }: ChipButtonProps) {
  return (
    <button
      onClick={() => onChipClick?.(chip.query)}
      title={chip.query}
      style={{
        flexShrink: 0,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '3px 10px',
        borderRadius: 99,
        border: '1px solid var(--border)',
        background: 'var(--surface)',
        color: 'var(--text2)',
        fontFamily: 'var(--sans)',
        fontSize: 11,
        fontWeight: 600,
        cursor: 'pointer',
        whiteSpace: 'nowrap',
        transition: 'background 120ms ease, border-color 120ms ease, color 120ms ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'var(--ai-accent-bg)';
        e.currentTarget.style.borderColor = 'var(--ai-accent-border)';
        e.currentTarget.style.color = 'var(--ai-accent)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'var(--surface)';
        e.currentTarget.style.borderColor = 'var(--border)';
        e.currentTarget.style.color = 'var(--text2)';
      }}
    >
      {chip.label}
    </button>
  );
}

// ── Brief row ─────────────────────────────────────────────────────────────────

interface RowProps {
  item: BriefItem;
  onChipClick?: (query: string) => void;
}

function BriefRow({ item, onChipClick }: RowProps) {
  const dotColor = PRIORITY_DOT[item.priority] ?? PRIORITY_DOT.info;
  const accentColor = PRIORITY_ACCENT[item.priority] ?? 'transparent';
  const isUrgent = item.priority === 'urgent';
  const iconColor = isUrgent
    ? 'var(--error-80, #ef4444)'
    : item.priority === 'attention'
    ? 'var(--warning-80, #f59e0b)'
    : 'var(--text3)';

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        paddingLeft: isUrgent ? 10 : 0,
        borderLeft: isUrgent ? `3px solid ${accentColor}` : '3px solid transparent',
        minHeight: 28,
      }}
    >
      {/* Dot */}
      <div style={{
        width: 8,
        height: 8,
        borderRadius: '50%',
        background: dotColor,
        flexShrink: 0,
      }} />

      {/* Icon */}
      <span style={{ color: iconColor, display: 'flex', alignItems: 'center' }}>
        <BriefIcon name={item.icon} />
      </span>

      {/* Text */}
      <span style={{
        flex: 1,
        fontFamily: 'var(--sans)',
        fontSize: 13,
        fontWeight: 400,
        color: 'var(--text)',
        lineHeight: 1.5,
      }}>
        {item.text}
      </span>

      {/* Optional chip */}
      {item.actionChip && (
        <ChipButton chip={item.actionChip} onChipClick={onChipClick} />
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

interface Props {
  brief: ProactiveBrief;
  onChipClick?: (query: string) => void;
}

export default function ProactiveBriefCard({ brief, onChipClick }: Props) {
  return (
    <div
      style={{
        width: '100%',
        marginBottom: 16,
      }}
    >
      <style>{`
        @keyframes briefGreetingIn {
          from { opacity: 0; transform: translateY(4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes briefRowIn {
          from { opacity: 0; transform: translateX(-4px); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>

      {/* Greeting row */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        marginBottom: 14,
        animation: 'briefGreetingIn 250ms cubic-bezier(0.22, 1, 0.36, 1) both',
      }}>
        {/* Kai avatar */}
        <div style={{
          width: 24,
          height: 24,
          borderRadius: '50%',
          background: 'var(--ai-accent)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}>
          <span style={{
            fontSize: 11,
            fontWeight: 700,
            color: 'white',
            fontFamily: 'var(--display)',
            lineHeight: 1,
          }}>K</span>
        </div>

        <p style={{
          margin: 0,
          fontFamily: 'var(--display)',
          fontSize: 16,
          fontWeight: 700,
          color: 'var(--text)',
          lineHeight: 1.3,
        }}>
          {brief.greeting}
        </p>
      </div>

      {/* Divider before items */}
      <div style={{
        borderTop: '1px solid var(--border)',
        marginBottom: 12,
        opacity: 0.6,
      }} />

      {/* Urgent items */}
      {brief.urgentItems.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
          {brief.urgentItems.map((item, i) => (
            <div
              key={i}
              style={{ 
                animation: `briefRowIn 400ms cubic-bezier(0.22, 1, 0.36, 1) both`,
                animationDelay: `${150 + (i * 80)}ms` 
              }}
            >
              <BriefRow item={item} onChipClick={onChipClick} />
            </div>
          ))}
        </div>
      )}

      {/* Today's summary */}
      {brief.todaysSummary.length > 0 && (
        <div>
          <p style={{
            margin: '0 0 8px',
            fontFamily: 'var(--display)',
            fontSize: 11,
            fontWeight: 600,
            color: 'var(--text3)',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            animation: 'briefGreetingIn 250ms cubic-bezier(0.22, 1, 0.36, 1) both',
            animationDelay: `${250 + (brief.urgentItems.length * 80)}ms`
          }}>
            Today
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {brief.todaysSummary.map((item, i) => (
              <div
                key={i}
                style={{
                  animation: `briefRowIn 400ms cubic-bezier(0.22, 1, 0.36, 1) both`,
                  animationDelay: `${350 + (brief.urgentItems.length * 80) + (i * 80)}ms`,
                }}
              >
                <BriefRow item={item} onChipClick={onChipClick} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
