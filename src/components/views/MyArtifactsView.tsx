'use client';

import { useState } from 'react';
import { useArtifacts } from '@/contexts/ArtifactContext';
import { useDashboardBuilder } from '@/contexts/DashboardBuilderContext';
import { useLayout } from '@/contexts/LayoutContext';
import type { SavedArtifact, SavedDashboard, SavedWorkflow } from '@/lib/types';
import { resolveWidget } from '@/components/engine/ComponentRegistry';

// ── Thumbnail renderers ───────────────────────────────────────────────────────

function SparklineThumbnail() {
  const points = [40, 65, 45, 80, 60, 90, 75];
  const w = 200, h = 80;
  const min = Math.min(...points), max = Math.max(...points);
  const range = max - min || 1;
  const xs = points.map((_, i) => (i / (points.length - 1)) * w);
  const ys = points.map((v) => h - ((v - min) / range) * (h * 0.7) - h * 0.1);
  const d = xs.map((x, i) => `${i === 0 ? 'M' : 'L'}${x},${ys[i]}`).join(' ');
  const fill = `${d} L${w},${h} L0,${h} Z`;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" height="100%" preserveAspectRatio="none">
      <defs>
        <linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--primary-70)" stopOpacity="0.3" />
          <stop offset="100%" stopColor="var(--primary-70)" stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <path d={fill} fill="url(#sg)" />
      <path d={d} fill="none" stroke="var(--primary-70)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {xs.map((x, i) => (
        <circle key={i} cx={x} cy={ys[i]} r="3" fill="var(--primary-70)" />
      ))}
    </svg>
  );
}

function DataTableThumbnail() {
  const cols = 3;
  const rows = 4;
  const cw = 54, rh = 14, gap = 4;
  const totalW = cols * cw + (cols - 1) * gap;
  const totalH = rows * rh + (rows - 1) * gap;

  return (
    <svg viewBox={`0 0 ${totalW + 16} ${totalH + 16}`} width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
      {Array.from({ length: rows }).map((_, r) =>
        Array.from({ length: cols }).map((_, c) => (
          <rect
            key={`${r}-${c}`}
            x={8 + c * (cw + gap)}
            y={8 + r * (rh + gap)}
            width={cw}
            height={rh}
            rx={3}
            fill={r === 0 ? 'var(--primary-70)' : 'var(--border)'}
            opacity={r === 0 ? 0.5 : 1}
          />
        ))
      )}
    </svg>
  );
}

function DashboardGridThumbnail() {
  return (
    <svg viewBox="0 0 80 60" width="64" height="48">
      <rect x="2" y="2" width="36" height="14" rx="3" fill="rgba(91,106,240,0.15)" stroke="rgba(91,106,240,0.3)" strokeWidth="1" />
      <rect x="42" y="2" width="36" height="14" rx="3" fill="rgba(91,106,240,0.15)" stroke="rgba(91,106,240,0.3)" strokeWidth="1" />
      <rect x="2" y="20" width="36" height="18" rx="3" fill="rgba(91,106,240,0.1)" stroke="rgba(91,106,240,0.25)" strokeWidth="1" />
      <rect x="42" y="20" width="36" height="18" rx="3" fill="rgba(91,106,240,0.1)" stroke="rgba(91,106,240,0.25)" strokeWidth="1" />
      <rect x="2" y="42" width="36" height="14" rx="3" fill="rgba(91,106,240,0.08)" stroke="rgba(91,106,240,0.2)" strokeWidth="1" />
      <rect x="42" y="42" width="36" height="14" rx="3" fill="rgba(91,106,240,0.08)" stroke="rgba(91,106,240,0.2)" strokeWidth="1" />
    </svg>
  );
}

function LiveWidgetThumbnail({ artifact }: { artifact: SavedArtifact }) {
  const Widget = resolveWidget(artifact.sourceWidget.widgetType);
  // Render the real widget at full size inside a clipped, scaled container.
  // scale 0.42 + width 240% means the mini fills the 160px card top while
  // the underlying widget still gets its natural layout width.
  const SCALE = 0.42;
  return (
    <div
      style={{
        height: 160,
        background: 'var(--surface)',
        borderBottom: '1px solid var(--border)',
        borderRadius: '10px 10px 0 0',
        overflow: 'hidden',
        position: 'relative',
        pointerEvents: 'none',
        userSelect: 'none',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: `${100 / SCALE}%`,
          transform: `scale(${SCALE})`,
          transformOrigin: 'top left',
          padding: 12,
        }}
      >
        <Widget
          data={artifact.sourceWidget.data as never}
          config={artifact.sourceWidget.config as never}
        />
      </div>
      {/* Soft bottom fade so clipped content doesn't feel abrupt */}
      <div
        style={{
          position: 'absolute',
          inset: 'auto 0 0 0',
          height: 40,
          background: 'linear-gradient(to bottom, rgba(255,255,255,0), var(--surface))',
          pointerEvents: 'none',
        }}
      />
    </div>
  );
}

function ArtifactThumbnail({ artifact }: { artifact: SavedArtifact }) {
  const hasData = artifact.sourceWidget.data
    && Object.keys(artifact.sourceWidget.data as Record<string, unknown>).length > 0;

  if (hasData) return <LiveWidgetThumbnail artifact={artifact} />;

  // Fallback: legacy SVG placeholders when the artifact has no real payload
  const thumbnail = artifact.thumbnail;
  return (
    <div
      style={{
        height: 160,
        background: 'var(--surface2)',
        borderBottom: '1px solid var(--border)',
        borderRadius: '10px 10px 0 0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: thumbnail === 'line-chart' ? '16px 12px 8px' : '24px',
        overflow: 'hidden',
      }}
    >
      {thumbnail === 'line-chart' && <SparklineThumbnail />}
      {thumbnail === 'data-table' && <DataTableThumbnail />}
      {!thumbnail && (
        <span style={{ fontSize: 32, opacity: 0.3 }}>◫</span>
      )}
    </div>
  );
}

function DashboardThumbnail({ artifact }: { artifact: SavedArtifact }) {
  const dashboardData = (artifact as SavedDashboard).dashboardData;

  if (!dashboardData) {
    return (
      <div
        style={{
          height: 160,
          background: 'linear-gradient(135deg, rgba(91,106,240,0.06) 0%, rgba(40,170,123,0.04) 100%)',
          borderBottom: '1px solid var(--border)',
          borderRadius: '10px 10px 0 0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <DashboardGridThumbnail />
      </div>
    );
  }

  // Live mini-render of the composite dashboard via UW-030. Same scale trick
  // as LiveWidgetThumbnail — wider stretch since dashboards have multi-column grids.
  const Widget = resolveWidget('UW-030');
  const SCALE = 0.28;
  return (
    <div
      style={{
        height: 160,
        background: 'var(--surface)',
        borderBottom: '1px solid var(--border)',
        borderRadius: '10px 10px 0 0',
        overflow: 'hidden',
        position: 'relative',
        pointerEvents: 'none',
        userSelect: 'none',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: `${100 / SCALE}%`,
          transform: `scale(${SCALE})`,
          transformOrigin: 'top left',
          padding: 12,
        }}
      >
        <Widget data={dashboardData as never} config={undefined as never} />
      </div>
      <div
        style={{
          position: 'absolute',
          inset: 'auto 0 0 0',
          height: 40,
          background: 'linear-gradient(to bottom, rgba(255,255,255,0), var(--surface))',
          pointerEvents: 'none',
        }}
      />
    </div>
  );
}

// ── Artifact card ─────────────────────────────────────────────────────────────

function ArtifactCard({ artifact, onOpen, onDelete }: { artifact: SavedArtifact; onOpen: () => void; onDelete: () => void }) {
  const [hovered, setHovered] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const savedDate = new Date(artifact.savedAt).toLocaleDateString([], {
    month: 'short', day: 'numeric', year: 'numeric',
  });

  return (
    <div
      onClick={() => !confirming && onOpen()}
      style={{
        background: 'var(--surface)',
        border: `1px solid ${hovered && !confirming ? 'rgba(91,106,240,0.4)' : confirming ? 'var(--error-80, #dc2626)' : 'var(--border)'}`,
        borderRadius: 10,
        cursor: confirming ? 'default' : 'pointer',
        overflow: 'hidden',
        transform: hovered && !confirming ? 'translateY(-4px)' : 'translateY(0)',
        boxShadow: hovered && !confirming ? '0 8px 24px rgba(91,106,240,0.16)' : '0 2px 8px rgba(0,0,0,0.04)',
        transition: 'transform 250ms cubic-bezier(0.2, 0, 0, 1), box-shadow 250ms cubic-bezier(0.2, 0, 0, 1), border-color 150ms ease',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setConfirming(false); }}
    >
      <ArtifactThumbnail artifact={artifact} />

      <div style={{ padding: '12px 14px 14px', position: 'relative' }}>
        <p style={{
          fontFamily: 'var(--display)', fontWeight: 600, fontSize: 13,
          color: 'var(--text)', margin: '0 0 5px', overflow: 'hidden',
          display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical',
          paddingRight: hovered ? 28 : 0, transition: 'padding-right 150ms ease',
        }}>
          {artifact.title}
        </p>
        <p style={{
          fontSize: 11.5, fontFamily: 'var(--sans)', color: 'var(--text2)',
          margin: '0 0 8px', overflow: 'hidden', display: '-webkit-box',
          WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', lineHeight: 1.5,
        }}>
          {artifact.description || <span style={{ fontStyle: 'italic', opacity: 0.5 }}>No description</span>}
        </p>

        {confirming ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 11, color: 'var(--error-80, #dc2626)', fontFamily: 'var(--sans)', flex: 1 }}>
              Delete this artifact?
            </span>
            <button onClick={(e) => { e.stopPropagation(); onDelete(); }} style={{
              padding: '3px 10px', borderRadius: 5, border: 'none',
              background: '#dc2626', color: '#fff', fontSize: 11, fontWeight: 600,
              cursor: 'pointer', fontFamily: 'var(--display)',
            }}>Delete</button>
            <button onClick={(e) => { e.stopPropagation(); setConfirming(false); }} style={{
              padding: '3px 10px', borderRadius: 5, border: '1px solid var(--border)',
              background: 'var(--surface)', color: 'var(--text2)', fontSize: 11,
              fontWeight: 500, cursor: 'pointer', fontFamily: 'var(--display)',
            }}>Cancel</button>
          </div>
        ) : (
          <p style={{ fontSize: 10, fontFamily: 'var(--mono)', color: 'var(--text3)', margin: 0 }}>
            Saved {savedDate}
          </p>
        )}

        {hovered && !confirming && (
          <button
            onClick={(e) => { e.stopPropagation(); setConfirming(true); }}
            title="Delete artifact"
            style={{
              position: 'absolute', top: 12, right: 14, width: 24, height: 24,
              borderRadius: 5, border: '1px solid var(--border)', background: 'var(--surface2)',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0,
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--text3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
              <path d="M10 11v6M14 11v6" />
              <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

// ── Dashboard card ────────────────────────────────────────────────────────────

function DashboardCard({
  artifact,
  onOpen,
  onDelete,
}: {
  artifact: SavedArtifact;
  onOpen: () => void;
  onDelete: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const savedDate = new Date(artifact.savedAt).toLocaleDateString([], {
    month: 'short', day: 'numeric', year: 'numeric',
  });

  return (
    <div
      onClick={() => !confirming && onOpen()}
      style={{
        background: 'var(--surface)',
        border: `1px solid ${hovered && !confirming ? 'rgba(91,106,240,0.4)' : confirming ? 'var(--error-80, #dc2626)' : 'var(--border)'}`,
        borderRadius: 10,
        cursor: confirming ? 'default' : 'pointer',
        overflow: 'hidden',
        transform: hovered && !confirming ? 'translateY(-4px)' : 'translateY(0)',
        boxShadow: hovered && !confirming ? '0 8px 24px rgba(91,106,240,0.16)' : '0 2px 8px rgba(0,0,0,0.04)',
        transition: 'transform 250ms cubic-bezier(0.2, 0, 0, 1), box-shadow 250ms cubic-bezier(0.2, 0, 0, 1), border-color 150ms ease',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setConfirming(false); }}
    >
      <DashboardThumbnail artifact={artifact} />

      <div style={{ padding: '12px 14px 14px', position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 5 }}>
          <p style={{
            fontFamily: 'var(--display)', fontWeight: 600, fontSize: 13,
            color: 'var(--text)', margin: 0, flex: 1, overflow: 'hidden',
            display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical',
            paddingRight: hovered ? 28 : 0, transition: 'padding-right 150ms ease',
          }}>
            {artifact.title}
          </p>
          <span style={{
            flexShrink: 0,
            fontSize: 9.5, fontWeight: 600, letterSpacing: '0.05em',
            textTransform: 'uppercase', padding: '2px 7px', borderRadius: 99,
            background: 'var(--badge-info-bg, rgba(91,106,240,0.08))',
            border: '1px solid var(--badge-info-border, rgba(91,106,240,0.2))',
            color: 'var(--info-80, #4f5ecc)',
            fontFamily: 'var(--display)',
          }}>
            Dashboard
          </span>
        </div>

        <p style={{
          fontSize: 11.5, fontFamily: 'var(--sans)', color: 'var(--text2)',
          margin: '0 0 8px', overflow: 'hidden', display: '-webkit-box',
          WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', lineHeight: 1.5,
        }}>
          {artifact.description || <span style={{ fontStyle: 'italic', opacity: 0.5 }}>No description</span>}
        </p>

        {confirming ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 11, color: 'var(--error-80, #dc2626)', fontFamily: 'var(--sans)', flex: 1 }}>
              Delete this dashboard?
            </span>
            <button onClick={(e) => { e.stopPropagation(); onDelete(); }} style={{
              padding: '3px 10px', borderRadius: 5, border: 'none',
              background: '#dc2626', color: '#fff', fontSize: 11, fontWeight: 600,
              cursor: 'pointer', fontFamily: 'var(--display)',
            }}>Delete</button>
            <button onClick={(e) => { e.stopPropagation(); setConfirming(false); }} style={{
              padding: '3px 10px', borderRadius: 5, border: '1px solid var(--border)',
              background: 'var(--surface)', color: 'var(--text2)', fontSize: 11,
              fontWeight: 500, cursor: 'pointer', fontFamily: 'var(--display)',
            }}>Cancel</button>
          </div>
        ) : (
          <p style={{ fontSize: 10, fontFamily: 'var(--mono)', color: 'var(--text3)', margin: 0 }}>
            Saved {savedDate}
          </p>
        )}

        {hovered && !confirming && (
          <button
            onClick={(e) => { e.stopPropagation(); setConfirming(true); }}
            title="Delete dashboard"
            style={{
              position: 'absolute', top: 12, right: 14, width: 24, height: 24,
              borderRadius: 5, border: '1px solid var(--border)', background: 'var(--surface2)',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0,
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--text3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
              <path d="M10 11v6M14 11v6" />
              <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

// ── Workflow card ─────────────────────────────────────────────────────────────

function WorkflowCard({ artifact, onDelete }: { artifact: SavedWorkflow; onDelete: () => void }) {
  const [hovered, setHovered] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const savedDate = new Date(artifact.savedAt).toLocaleDateString([], {
    month: 'short', day: 'numeric', year: 'numeric',
  });

  return (
    <div
      style={{
        background: 'var(--surface)',
        border: `1px solid ${hovered && !confirming ? 'rgba(91,106,240,0.4)' : confirming ? 'var(--error-80, #dc2626)' : 'var(--border)'}`,
        borderRadius: 10,
        overflow: 'hidden',
        transform: hovered && !confirming ? 'translateY(-4px)' : 'translateY(0)',
        boxShadow: hovered && !confirming ? '0 8px 24px rgba(91,106,240,0.16)' : '0 2px 8px rgba(0,0,0,0.04)',
        transition: 'transform 250ms cubic-bezier(0.2, 0, 0, 1), box-shadow 250ms cubic-bezier(0.2, 0, 0, 1), border-color 150ms ease',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setConfirming(false); }}
    >
      {/* Status strip */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(22,136,95,0.08), rgba(91,106,240,0.05))',
        borderBottom: '1px solid var(--border)',
        padding: '8px 14px',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
      }}>
        <span style={{
          width: 7, height: 7, borderRadius: '50%',
          background: 'var(--primary-70)',
          boxShadow: '0 0 0 3px rgba(22,136,95,0.15)',
        }} />
        <span style={{
          fontFamily: 'var(--display)', fontSize: 10.5, fontWeight: 700,
          color: 'var(--primary-80)', letterSpacing: '0.04em', textTransform: 'uppercase',
        }}>
          {artifact.scheduleStatus}
        </span>
      </div>

      <div style={{ padding: '12px 14px 14px', position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 5 }}>
          <p style={{
            fontFamily: 'var(--display)', fontWeight: 600, fontSize: 13,
            color: 'var(--text)', margin: 0, flex: 1,
            paddingRight: hovered ? 28 : 0, transition: 'padding-right 150ms ease',
          }}>
            {artifact.title}
          </p>
          <span style={{
            flexShrink: 0,
            fontSize: 9.5, fontWeight: 600, letterSpacing: '0.05em',
            textTransform: 'uppercase', padding: '2px 7px', borderRadius: 99,
            background: 'rgba(22,136,95,0.08)',
            border: '1px solid rgba(22,136,95,0.2)',
            color: 'var(--primary-80)',
            fontFamily: 'var(--display)',
          }}>
            Workflow
          </span>
        </div>

        <p style={{
          fontSize: 11.5, fontFamily: 'var(--sans)', color: 'var(--text2)',
          margin: '0 0 10px', lineHeight: 1.5,
        }}>
          {artifact.description}
        </p>

        <div style={{
          fontSize: 11, fontFamily: 'var(--sans)', color: 'var(--text3)',
          background: 'var(--surface2)', borderRadius: 6, padding: '6px 10px',
          marginBottom: 8, lineHeight: 1.5,
        }}>
          <strong style={{ color: 'var(--text2)', fontWeight: 600 }}>Trigger:</strong> {artifact.trigger}
        </div>

        {artifact.audienceSummary && (
          <div style={{
            fontSize: 10.5, fontFamily: 'var(--mono)', color: 'var(--text3)',
            marginBottom: 8,
          }}>
            {artifact.audienceSummary}
          </div>
        )}

        {confirming ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 11, color: 'var(--error-80, #dc2626)', fontFamily: 'var(--sans)', flex: 1 }}>
              Pause this workflow?
            </span>
            <button onClick={(e) => { e.stopPropagation(); onDelete(); }} style={{
              padding: '3px 10px', borderRadius: 5, border: 'none',
              background: '#dc2626', color: '#fff', fontSize: 11, fontWeight: 600,
              cursor: 'pointer', fontFamily: 'var(--display)',
            }}>Remove</button>
            <button onClick={(e) => { e.stopPropagation(); setConfirming(false); }} style={{
              padding: '3px 10px', borderRadius: 5, border: '1px solid var(--border)',
              background: 'var(--surface)', color: 'var(--text2)', fontSize: 11,
              fontWeight: 500, cursor: 'pointer', fontFamily: 'var(--display)',
            }}>Cancel</button>
          </div>
        ) : (
          <p style={{ fontSize: 10, fontFamily: 'var(--mono)', color: 'var(--text3)', margin: 0 }}>
            Activated {savedDate}
          </p>
        )}

        {hovered && !confirming && (
          <button
            onClick={(e) => { e.stopPropagation(); setConfirming(true); }}
            title="Remove workflow"
            style={{
              position: 'absolute', top: 12, right: 14, width: 24, height: 24,
              borderRadius: 5, border: '1px solid var(--border)', background: 'var(--surface2)',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0,
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--text3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
              <path d="M10 11v6M14 11v6" />
              <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

// ── Section header ────────────────────────────────────────────────────────────

function SectionHeader({ label, count }: { label: string; count?: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
      <p style={{
        fontFamily: 'var(--display)', fontWeight: 600, fontSize: 11,
        color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0,
      }}>
        {label}
      </p>
      {count !== undefined && count > 0 && (
        <span style={{
          fontSize: 10, fontWeight: 600, fontFamily: 'var(--display)',
          background: 'var(--surface2)', border: '1px solid var(--border)',
          color: 'var(--text3)', borderRadius: 99, padding: '1px 7px',
        }}>
          {count}
        </span>
      )}
    </div>
  );
}

function EmptyScheduled() {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '32px 0', gap: 8,
    }}>
      <span style={{ fontSize: 28, opacity: 0.25 }}>🕐</span>
      <p style={{ fontSize: 12, fontFamily: 'var(--sans)', color: 'var(--text3)', fontStyle: 'italic', margin: 0 }}>
        No scheduled artifacts yet
      </p>
    </div>
  );
}

// ── Filter tabs ───────────────────────────────────────────────────────────────

type FilterTab = 'all' | 'charts' | 'dashboards' | 'scheduled';

function FilterTabs({ active, onChange }: { active: FilterTab; onChange: (t: FilterTab) => void }) {
  const tabs: { id: FilterTab; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'charts', label: 'Charts' },
    { id: 'dashboards', label: 'Dashboards' },
    // { id: 'scheduled', label: 'Scheduled' },
  ];

  return (
    <div style={{ display: 'flex', gap: 4, marginBottom: 28 }}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          style={{
            padding: '6px 14px',
            borderRadius: 8,
            border: active === tab.id ? '1px solid var(--border2)' : '1px solid transparent',
            background: active === tab.id ? 'var(--surface)' : 'transparent',
            color: active === tab.id ? 'var(--text)' : 'var(--text3)',
            fontSize: 12.5,
            fontWeight: active === tab.id ? 600 : 400,
            fontFamily: 'var(--display)',
            cursor: 'pointer',
            transition: 'all 150ms ease',
            boxShadow: active === tab.id ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
          }}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

// ── Card grid ─────────────────────────────────────────────────────────────────

function CardGrid({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
      {children}
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <p style={{ fontSize: 13, color: 'var(--text3)', fontStyle: 'italic', fontFamily: 'var(--sans)' }}>
      {label}
    </p>
  );
}

// ── Main view ─────────────────────────────────────────────────────────────────

export default function MyArtifactsView() {
  const { artifacts, removeArtifact, setActiveArtifactId } = useArtifacts();
  const { setActive } = useDashboardBuilder();
  const { setView } = useLayout();
  const [activeTab, setActiveTab] = useState<FilterTab>('all');

  const handleArtifactOpen = (a: SavedArtifact) => {
    setActiveArtifactId(a.id);
    setView('view-artifact');
  };

  const dashboards = artifacts.filter((a) => a.category === 'Dashboards and Reports');
  const chartsAndReports = artifacts.filter((a) => a.type === 'chart' || a.type === 'table');
  const scheduled = artifacts.filter((a) => a.category === 'Scheduled') as SavedWorkflow[];

  const handleDashboardClick = (a: SavedArtifact) => {
    const saved = a as SavedDashboard;
    if (!saved.dashboardData) return;
    setActive(saved.dashboardData, saved.id);
    setView('dashboard-view');
  };

  const showDashboards = activeTab === 'all' || activeTab === 'dashboards';
  const showCharts = activeTab === 'all' || activeTab === 'charts';
  const showScheduled = activeTab === 'all' || activeTab === 'scheduled';

  return (
    <div className="flex-1 overflow-y-auto" style={{ padding: '32px 40px' }}>
      <h1 style={{
        fontFamily: 'var(--display)', fontWeight: 700, fontSize: 18,
        color: 'var(--text)', marginBottom: 20,
      }}>
        My Artifacts
      </h1>

      <FilterTabs active={activeTab} onChange={setActiveTab} />

      {/* Dashboards and Reports */}
      {showDashboards && (
        <section style={{ marginBottom: 40 }}>
          <SectionHeader label="Dashboards and Reports" count={dashboards.length} />
          {dashboards.length === 0 ? (
            <EmptyState label="No dashboards saved yet. Ask Kai to build one." />
          ) : (
            <CardGrid>
              {dashboards.map((a) => (
                <DashboardCard
                  key={a.id}
                  artifact={a}
                  onOpen={() => handleDashboardClick(a)}
                  onDelete={() => removeArtifact(a.id)}
                />
              ))}
            </CardGrid>
          )}
        </section>
      )}

      {/* Charts and Reports */}
      {showCharts && (
        <section style={{ marginBottom: 40 }}>
          <SectionHeader label="Charts and Reports" count={chartsAndReports.length} />
          {chartsAndReports.length === 0 ? (
            <EmptyState label="No artifacts saved yet." />
          ) : (
            <CardGrid>
              {chartsAndReports.map((a) => (
                <ArtifactCard
                  key={a.id}
                  artifact={a}
                  onOpen={() => handleArtifactOpen(a)}
                  onDelete={() => removeArtifact(a.id)}
                />
              ))}
            </CardGrid>
          )}
        </section>
      )}

      {/* Scheduled — hidden (workflow creation not exposed in this build) */}
      {/* {showScheduled && (
        <section>
          <SectionHeader label="Scheduled Artifacts" count={scheduled.length} />
          {scheduled.length === 0 ? (
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10 }}>
              <EmptyScheduled />
            </div>
          ) : (
            <CardGrid>
              {scheduled.map((wf) => (
                <WorkflowCard
                  key={wf.id}
                  artifact={wf}
                  onDelete={() => removeArtifact(wf.id)}
                />
              ))}
            </CardGrid>
          )}
        </section>
      )} */}
    </div>
  );
}
