'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { SavedArtifact } from '@/lib/types';

// Subsequence-fuzzy match: characters of `query` must appear in `target` in
// order, not necessarily contiguous. Returns a score (lower = better, -1 = no
// match). Exact substring matches always win.
function fuzzyMatch(query: string, target: string): number {
  if (!query) return 0;
  const q = query.toLowerCase();
  const t = target.toLowerCase();
  if (t.includes(q)) return t.indexOf(q);
  let qi = 0, score = 0, lastIdx = -1;
  for (let ti = 0; ti < t.length && qi < q.length; ti += 1) {
    if (t[ti] === q[qi]) {
      score += (lastIdx === -1 ? ti : ti - lastIdx);
      lastIdx = ti;
      qi += 1;
    }
  }
  return qi === q.length ? 1000 + score : -1;
}

export default function ArtifactSearchDropdown({
  artifacts,
  onOpen,
  autoFocus = false,
}: {
  artifacts: SavedArtifact[];
  onOpen: (a: SavedArtifact) => void;
  autoFocus?: boolean;
}) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  const sorted = useMemo(() => [...artifacts].sort((a, b) => b.savedAt - a.savedAt), [artifacts]);

  const matched = useMemo(() => {
    if (!query.trim()) return sorted;
    return sorted
      .map((a) => {
        const titleScore = fuzzyMatch(query, a.title);
        const descScore = a.description ? fuzzyMatch(query, a.description) : -1;
        const best = titleScore === -1 ? descScore : descScore === -1 ? titleScore : Math.min(titleScore, descScore);
        return { a, score: best };
      })
      .filter((x) => x.score !== -1)
      .sort((a, b) => a.score - b.score)
      .map((x) => x.a);
  }, [sorted, query]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      {/* Search input */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '10px 14px',
          border: '1px solid var(--border)',
          borderRadius: 8,
          background: 'var(--surface)',
          marginBottom: 12,
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={artifacts.length === 0 ? 'No artifacts saved yet' : `Search ${artifacts.length} artifact${artifacts.length === 1 ? '' : 's'}…`}
          disabled={artifacts.length === 0}
          style={{
            flex: 1,
            border: 'none',
            outline: 'none',
            background: 'transparent',
            fontSize: 13,
            fontFamily: 'var(--sans)',
            color: 'var(--text)',
          }}
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            style={{
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              padding: 2,
              display: 'flex',
              color: 'var(--text3)',
            }}
            aria-label="Clear search"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </div>

      {/* Results list */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          border: '1px solid var(--border)',
          borderRadius: 8,
          background: 'var(--surface)',
          minHeight: 0,
        }}
      >
        {artifacts.length === 0 ? (
          <div style={{ padding: 24, textAlign: 'center', fontSize: 12, fontFamily: 'var(--sans)', color: 'var(--text3)' }}>
            Save a chart or dashboard from Kai to see it here.
          </div>
        ) : matched.length === 0 ? (
          <div style={{ padding: 16, fontSize: 12, fontFamily: 'var(--sans)', color: 'var(--text3)' }}>
            No artifacts match “{query}”.
          </div>
        ) : (
          matched.map((a) => (
            <button
              key={a.id}
              onClick={() => onOpen(a)}
              style={{
                width: '100%',
                textAlign: 'left',
                padding: '10px 14px',
                border: 'none',
                borderBottom: '1px solid var(--border)',
                background: 'transparent',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--surface2)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{
                  fontSize: 9.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em',
                  background: 'var(--surface2)', border: '1px solid var(--border)',
                  borderRadius: 4, padding: '1px 6px', color: 'var(--text3)', fontFamily: 'var(--display)',
                }}>
                  {a.category === 'Dashboards and Reports' ? 'Dashboard' : a.type === 'workflow' ? 'Workflow' : 'Chart'}
                </span>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', fontFamily: 'var(--sans)' }}>
                  {a.title}
                </span>
              </div>
              {a.description && (
                <span style={{ fontSize: 11.5, color: 'var(--text3)', fontFamily: 'var(--sans)', lineHeight: 1.4 }}>
                  {a.description.length > 110 ? `${a.description.slice(0, 110)}…` : a.description}
                </span>
              )}
            </button>
          ))
        )}
      </div>
    </div>
  );
}
