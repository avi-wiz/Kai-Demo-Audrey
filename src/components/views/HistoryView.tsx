'use client';

import { useState } from 'react';
import { useLayout } from '@/contexts/LayoutContext';
import { useChatHistory } from '@/contexts/ChatHistoryContext';
import { useChatSession } from '@/contexts/ChatSessionContext';
import { TAG_COLORS } from '@/lib/historyTags';
import type { SavedSession } from '@/lib/historyTypes';

function formatRelative(ts: number): string {
  const d = new Date(ts);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / 86400000);
  const hhmm = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (diffDays === 0) return `Today, ${hhmm}`;
  if (diffDays === 1) return `Yesterday, ${hhmm}`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' }) + `, ${hhmm}`;
}

export default function HistoryView() {
  const { setView } = useLayout();
  const { sessions, removeSession } = useChatHistory();
  const { requestRestore } = useChatSession();
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const sorted = [...sessions].sort((a, b) => b.updatedAt - a.updatedAt);

  function handleCardClick(s: SavedSession) {
    requestRestore(s);
    setView('chat');
  }

  function handleDelete(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    if (confirmDeleteId === id) {
      removeSession(id);
      setConfirmDeleteId(null);
    } else {
      setConfirmDeleteId(id);
      setTimeout(() => {
        setConfirmDeleteId((curr) => (curr === id ? null : curr));
      }, 2500);
    }
  }

  return (
    <div className="flex-1 overflow-y-auto" style={{ padding: '32px 40px' }}>
      <h1 style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 18, color: 'var(--text)', marginBottom: 6 }}>
        Chat History
      </h1>
      <p style={{ fontFamily: 'var(--sans)', fontSize: 13, color: 'var(--text2)', margin: 0, marginBottom: 24 }}>
        Past Kai sessions are summarized and saved automatically when you start a new chat.
      </p>

      {sorted.length === 0 ? (
        <div
          style={{
            background: 'var(--surface)',
            border: '1px dashed var(--border)',
            borderRadius: 10,
            padding: '28px 24px',
            textAlign: 'center',
          }}
        >
          <p style={{ fontFamily: 'var(--display)', fontWeight: 600, fontSize: 14, color: 'var(--text)', margin: '0 0 4px' }}>
            No conversations yet
          </p>
          <p style={{ fontFamily: 'var(--sans)', fontSize: 12.5, color: 'var(--text2)', margin: 0 }}>
            Start chatting with Kai. When you click <strong>New Chat</strong>, the previous session is automatically saved here.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <style>{`
            @keyframes cardStaggerIn {
              from { opacity: 0; transform: translateY(10px); }
              to   { opacity: 1; transform: translateY(0); }
            }
          `}</style>
          {sorted.map((s, i) => {
            const badge = TAG_COLORS[s.tag] ?? TAG_COLORS['Other'];
            const isHover = hoverId === s.id;
            const isConfirming = confirmDeleteId === s.id;

            return (
              <button
                key={s.id}
                onClick={() => handleCardClick(s)}
                onMouseEnter={() => setHoverId(s.id)}
                onMouseLeave={() => { setHoverId(null); if (isConfirming) setConfirmDeleteId(null); }}
                className="text-left w-full transition-all duration-200"
                style={{
                  background: 'var(--surface)',
                  border: '1px solid ' + (isHover ? 'var(--border2, var(--primary-70))' : 'var(--border)'),
                  borderRadius: 10,
                  padding: '16px 20px',
                  cursor: 'pointer',
                  boxShadow: isHover ? 'var(--shadow-card-hover, 0 4px 12px rgba(0,0,0,0.08))' : 'none',
                  opacity: 0,
                  animation: 'cardStaggerIn 400ms ease forwards',
                  animationDelay: `${i * 40}ms`,
                  position: 'relative',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <span
                        style={{
                          fontFamily: 'var(--display)',
                          fontWeight: 600,
                          fontSize: 14,
                          color: 'var(--text)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          flex: 1,
                          minWidth: 0,
                        }}
                      >
                        {s.title}
                      </span>
                      <span
                        style={{
                          flexShrink: 0,
                          fontSize: 11,
                          fontFamily: 'var(--sans)',
                          fontWeight: 500,
                          color: badge.color,
                          background: badge.bg,
                          borderRadius: 5,
                          padding: '2px 7px',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {s.tag}
                      </span>
                    </div>
                    <p
                      style={{
                        fontSize: 12.5,
                        fontFamily: 'var(--sans)',
                        color: 'var(--text2)',
                        margin: 0,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        lineHeight: '1.5',
                      }}
                    >
                      {s.subtext}
                    </p>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
                    <span
                      style={{
                        fontSize: 10.5,
                        fontFamily: 'var(--mono)',
                        color: 'var(--text3)',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {formatRelative(s.updatedAt)}
                    </span>
                    {isHover && (
                      <span
                        role="button"
                        tabIndex={0}
                        onClick={(e) => handleDelete(s.id, e)}
                        onKeyDown={(e) => { if (e.key === 'Enter') handleDelete(s.id, e as unknown as React.MouseEvent); }}
                        style={{
                          fontSize: 10.5,
                          fontFamily: 'var(--display)',
                          fontWeight: 600,
                          color: isConfirming ? '#dc2626' : 'var(--text3)',
                          cursor: 'pointer',
                          padding: '2px 6px',
                          borderRadius: 4,
                          border: '1px solid ' + (isConfirming ? '#dc2626' : 'var(--border)'),
                          background: isConfirming ? 'rgba(220,38,38,0.06)' : 'var(--surface2)',
                          userSelect: 'none',
                        }}
                      >
                        {isConfirming ? 'Confirm delete' : 'Delete'}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
