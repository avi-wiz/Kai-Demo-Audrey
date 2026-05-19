'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useLayout } from '@/contexts/LayoutContext';
import { useConversation } from '@/contexts/ConversationContext';
import type { ViewRoute } from '@/lib/types';
import paletteData from '@/fixtures/command-palette-items.json';

// ── Types ─────────────────────────────────────────────────────────────────────

interface PaletteItem {
  id: string;
  label: string;
  category: string;
  query?: string;
  route?: string;
  icon: string;
}

// ── Icon map ──────────────────────────────────────────────────────────────────

function ItemIcon({ name }: { name: string }) {
  const s = { width: 14, height: 14, style: { flexShrink: 0 } } as const;
  switch (name) {
    case 'user':
      return <svg {...s} viewBox="0 0 16 16" fill="none"><circle cx="8" cy="5.5" r="2.5" stroke="currentColor" strokeWidth="1.4"/><path d="M2.5 13.5c0-3 2.5-5 5.5-5s5.5 2 5.5 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>;
    case 'order':
      return <svg {...s} viewBox="0 0 16 16" fill="none"><rect x="2.5" y="2.5" width="11" height="11" rx="2" stroke="currentColor" strokeWidth="1.4"/><path d="M5 8h6M5 5.5h6M5 10.5h4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>;
    case 'refresh':
      return <svg {...s} viewBox="0 0 16 16" fill="none"><path d="M2.5 8a5.5 5.5 0 0 1 9.5-3.8L13.5 6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/><path d="M13.5 2.5v4h-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/><path d="M13.5 8a5.5 5.5 0 0 1-9.5 3.8L2.5 10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>;
    case 'brief':
      return <svg {...s} viewBox="0 0 16 16" fill="none"><rect x="3" y="2" width="10" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.4"/><path d="M5.5 5.5h5M5.5 8h5M5.5 10.5h3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>;
    case 'email':
      return <svg {...s} viewBox="0 0 16 16" fill="none"><rect x="2" y="4" width="12" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.4"/><path d="M2 4.5l6 4.5 6-4.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>;
    case 'search':
      return <svg {...s} viewBox="0 0 16 16" fill="none"><circle cx="7" cy="7" r="4" stroke="currentColor" strokeWidth="1.4"/><path d="M10.5 10.5l2.5 2.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>;
    case 'file':
      return <svg {...s} viewBox="0 0 16 16" fill="none"><path d="M4 2h5.5L12 4.5V14H4V2z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/><path d="M9 2v3h3" stroke="currentColor" strokeWidth="1.3"/><path d="M6 7h4M6 9.5h4M6 12h2.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>;
    case 'task':
      return <svg {...s} viewBox="0 0 16 16" fill="none"><rect x="3" y="3" width="10" height="10" rx="2" stroke="currentColor" strokeWidth="1.4"/><path d="M5.5 8l2 2 3-3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>;
    case 'check':
      return <svg {...s} viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.4"/><path d="M5.5 8.5l2 2 3-3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>;
    case 'swap':
      return <svg {...s} viewBox="0 0 16 16" fill="none"><path d="M2 5h12M11 2.5L13.5 5 11 7.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/><path d="M14 11H2M5 8.5L2.5 11 5 13.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>;
    case 'dashboard':
      return <svg {...s} viewBox="0 0 16 16" fill="none"><rect x="2" y="2" width="5.5" height="5.5" rx="1.2" stroke="currentColor" strokeWidth="1.3"/><rect x="8.5" y="2" width="5.5" height="5.5" rx="1.2" stroke="currentColor" strokeWidth="1.3"/><rect x="2" y="8.5" width="5.5" height="5.5" rx="1.2" stroke="currentColor" strokeWidth="1.3"/><rect x="8.5" y="8.5" width="5.5" height="5.5" rx="1.2" stroke="currentColor" strokeWidth="1.3"/></svg>;
    case 'workflow':
      return <svg {...s} viewBox="0 0 16 16" fill="none"><circle cx="3" cy="8" r="1.8" stroke="currentColor" strokeWidth="1.3"/><circle cx="13" cy="4" r="1.8" stroke="currentColor" strokeWidth="1.3"/><circle cx="13" cy="12" r="1.8" stroke="currentColor" strokeWidth="1.3"/><path d="M4.8 7.4L11.2 4.6M4.8 8.6L11.2 11.4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>;
    case 'users':
      return <svg {...s} viewBox="0 0 16 16" fill="none"><circle cx="6" cy="5" r="2" stroke="currentColor" strokeWidth="1.3"/><path d="M1.5 13c0-2.5 2-4 4.5-4s4.5 1.5 4.5 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><circle cx="11.5" cy="5" r="2" stroke="currentColor" strokeWidth="1.3"/><path d="M12.5 9.2c1.5.4 2.5 1.7 2.5 3.8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>;
    case 'package':
      return <svg {...s} viewBox="0 0 16 16" fill="none"><path d="M2 5l6-3 6 3v6l-6 3-6-3V5z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/><path d="M8 2v13M2 5l6 3 6-3" stroke="currentColor" strokeWidth="1.3"/></svg>;
    case 'tasks':
      return <svg {...s} viewBox="0 0 16 16" fill="none"><path d="M3 4h10M3 8h8M3 12h6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>;
    case 'chart':
      return <svg {...s} viewBox="0 0 16 16" fill="none"><path d="M2 12l4-4 3 2 5-6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>;
    case 'gear':
      return <svg {...s} viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="2.2" stroke="currentColor" strokeWidth="1.3"/><path d="M8 1.5v1.3M8 13.2v1.3M1.5 8h1.3M13.2 8h1.3M3.2 3.2l.9.9M11.9 11.9l.9.9M3.2 12.8l.9-.9M11.9 4.1l.9-.9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>;
    case 'sliders':
      return <svg {...s} viewBox="0 0 16 16" fill="none"><path d="M3 4h10M6 8h7M3 12h10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/><circle cx="5" cy="4" r="1.5" fill="currentColor"/><circle cx="10" cy="8" r="1.5" fill="currentColor"/><circle cx="6.5" cy="12" r="1.5" fill="currentColor"/></svg>;
    case 'save':
      return <svg {...s} viewBox="0 0 16 16" fill="none"><path d="M3 2h8l3 3v9H3V2z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/><path d="M5 2v4h6V2" stroke="currentColor" strokeWidth="1.3"/><rect x="4.5" y="9" width="7" height="4.5" rx="0.5" stroke="currentColor" strokeWidth="1.3"/></svg>;
    default:
      return <svg {...s} viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.4"/></svg>;
  }
}

// ── Category label ────────────────────────────────────────────────────────────

const CATEGORY_ORDER = ['Sales', 'Admin', 'Navigation', 'Settings'];

// ── Fuzzy match (simple: all chars present in order) ─────────────────────────

function fuzzyMatch(label: string, query: string): boolean {
  if (!query) return true;
  const l = label.toLowerCase();
  const q = query.toLowerCase();
  let qi = 0;
  for (let i = 0; i < l.length && qi < q.length; i++) {
    if (l[i] === q[qi]) qi++;
  }
  return qi === q.length;
}

// ── CommandPalette ────────────────────────────────────────────────────────────

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
}

const ITEMS = paletteData.items as PaletteItem[];

export default function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const { setView, setPendingQuery, triggerChatFocus, clearMessages: _unused } = useLayout() as ReturnType<typeof useLayout> & { clearMessages?: () => void };
  const { clearMessages } = useConversation();

  const [query, setQuery] = useState('');
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Filtered + grouped items
  const { filtered, grouped, flatItems } = useMemo(() => {
    const f = ITEMS.filter((item) => fuzzyMatch(item.label, query));
    const g = CATEGORY_ORDER.reduce<{ category: string; items: PaletteItem[] }[]>((acc, cat) => {
      const items = f.filter((i) => i.category === cat);
      if (items.length) acc.push({ category: cat, items });
      return acc;
    }, []);
    const flat = g.flatMap((group) => group.items);
    return { filtered: f, grouped: g, flatItems: flat };
  }, [query]);

  // Reset on open
  useEffect(() => {
    if (open) {
      setQuery('');
      setActiveIdx(0);
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [open]);

  // Reset active when filter changes
  useEffect(() => {
    setActiveIdx(0);
  }, [query]);

  // Scroll active item into view
  useEffect(() => {
    if (!listRef.current) return;
    const el = listRef.current.querySelector<HTMLElement>('[data-active="true"]');
    el?.scrollIntoView({ block: 'nearest' });
  }, [activeIdx]);

  const handleSelect = useCallback((item: PaletteItem) => {
    onClose();
    if (item.query) {
      clearMessages();
      setView('chat');
      setPendingQuery(item.query);
      triggerChatFocus();
    } else if (item.route) {
      const route = `wizorder/${item.route}` as ViewRoute;
      const knownKaiRoutes = ['chat', 'history', 'artifacts', 'docs', 'settings', 'agent-store', 'admin/dashboard', 'admin/models', 'admin/api-key', 'admin/prefs'];
      if (knownKaiRoutes.includes(item.route)) {
        setView(item.route as ViewRoute);
      } else {
        setView(route);
      }
    }
  }, [onClose, clearMessages, setView, setPendingQuery, triggerChatFocus]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') { onClose(); return; }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, flatItems.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const item = flatItems[activeIdx];
      if (item) handleSelect(item);
    }
  }, [flatItems, activeIdx, handleSelect, onClose]);

  if (!open) return null;

  // Build flat-index map for active tracking
  let flatIdx = 0;

  return (
    <>
      <style>{`
        @keyframes cmdPaletteIn {
          from { opacity: 0; transform: translateY(-8px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>

      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 3000,
          background: 'rgba(15, 18, 28, 0.4)',
          backdropFilter: 'blur(8px)',
        }}
      />

      {/* Panel */}
      <div
        onKeyDown={handleKeyDown}
        style={{
          position: 'fixed',
          top: '18%',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 3001,
          width: 480,
          maxWidth: 'calc(100vw - 32px)',
          maxHeight: '60vh',
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 12,
          boxShadow: '0 8px 32px rgba(0,0,0,0.14), 0 2px 8px rgba(0,0,0,0.08)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'cmdPaletteIn 160ms ease both',
        }}
      >
        {/* Search row */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '12px 16px',
          borderBottom: '1px solid var(--border)',
          flexShrink: 0,
        }}>
          <svg width="15" height="15" viewBox="0 0 16 16" fill="none" style={{ color: 'var(--text3)', flexShrink: 0 }}>
            <circle cx="7" cy="7" r="4" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M10.5 10.5l2.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search capabilities, pages…"
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              background: 'transparent',
              fontFamily: 'var(--sans)',
              fontSize: 14,
              color: 'var(--text)',
              caretColor: 'var(--primary-80)',
            }}
          />
          <kbd style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2px 6px',
            background: 'var(--surface2)',
            border: '1px solid var(--border)',
            borderRadius: 5,
            fontFamily: 'var(--mono)',
            fontSize: 10,
            color: 'var(--text3)',
            lineHeight: 1.5,
            flexShrink: 0,
          }}>
            esc
          </kbd>
        </div>

        {/* Results */}
        <div ref={listRef} style={{ overflowY: 'auto', flex: 1 }}>
          {grouped.length === 0 ? (
            <div style={{
              padding: '32px 16px',
              textAlign: 'center',
              fontFamily: 'var(--sans)',
              fontSize: 13,
              color: 'var(--text3)',
            }}>
              No results for &ldquo;{query}&rdquo;
            </div>
          ) : grouped.map((group) => (
            <div key={group.category}>
              <div style={{
                padding: '8px 16px 4px',
                fontFamily: 'var(--sans)',
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '0.06em',
                color: 'var(--text3)',
                textTransform: 'uppercase',
              }}>
                {group.category}
              </div>
              {group.items.map((item) => {
                const isActive = flatIdx === activeIdx;
                const currentFlatIdx = flatIdx++;
                return (
                  <div
                    key={item.id}
                    data-active={isActive ? 'true' : 'false'}
                    onClick={() => handleSelect(item)}
                    onMouseEnter={() => setActiveIdx(currentFlatIdx)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '8px 16px',
                      cursor: 'pointer',
                      background: isActive ? 'var(--surface2)' : 'transparent',
                      transition: 'background 100ms ease',
                    }}
                  >
                    <span style={{ color: isActive ? 'var(--primary-80)' : 'var(--text3)', display: 'flex', alignItems: 'center' }}>
                      <ItemIcon name={item.icon} />
                    </span>
                    <span style={{
                      flex: 1,
                      fontFamily: 'var(--sans)',
                      fontSize: 13,
                      fontWeight: 500,
                      color: 'var(--text)',
                    }}>
                      {item.label}
                    </span>
                    {item.query && (
                      <span style={{
                        fontFamily: 'var(--sans)',
                        fontSize: 11,
                        color: 'var(--text3)',
                        background: 'var(--surface2)',
                        border: '1px solid var(--border)',
                        borderRadius: 5,
                        padding: '1px 7px',
                      }}>
                        Ask Kai
                      </span>
                    )}
                    {item.route && (
                      <span style={{
                        fontFamily: 'var(--sans)',
                        fontSize: 11,
                        color: 'var(--text3)',
                        background: 'var(--surface2)',
                        border: '1px solid var(--border)',
                        borderRadius: 5,
                        padding: '1px 7px',
                      }}>
                        Go
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* Footer hint */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '8px 16px',
          borderTop: '1px solid var(--border)',
          flexShrink: 0,
        }}>
          {[
            { keys: ['↑', '↓'], label: 'navigate' },
            { keys: ['↵'], label: 'select' },
            { keys: ['esc'], label: 'close' },
          ].map(({ keys, label }) => (
            <span key={label} style={{ display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'var(--sans)', fontSize: 11, color: 'var(--text3)' }}>
              {keys.map((k) => (
                <kbd key={k} style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '1px 5px',
                  background: 'var(--surface2)',
                  border: '1px solid var(--border)',
                  borderRadius: 4,
                  fontFamily: 'var(--mono)',
                  fontSize: 10,
                  color: 'var(--text2)',
                }}>
                  {k}
                </kbd>
              ))}
              {label}
            </span>
          ))}
        </div>
      </div>
    </>
  );
}
