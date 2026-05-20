'use client';

import { useRef, useState } from 'react';
import { useArtifacts } from '@/contexts/ArtifactContext';
import { useLayout } from '@/contexts/LayoutContext';
import { resolveWidget } from '@/components/engine/ComponentRegistry';

function BackIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M19 12H5" />
      <path d="M12 19l-7-7 7-7" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function showToast(message: string) {
  const existing = document.getElementById('kai-artifact-export-toast');
  if (existing) existing.remove();
  const toast = document.createElement('div');
  toast.id = 'kai-artifact-export-toast';
  toast.textContent = message;
  Object.assign(toast.style, {
    position: 'fixed',
    bottom: '24px',
    left: '50%',
    transform: 'translateX(-50%)',
    background: '#166534',
    color: '#fff',
    padding: '10px 20px',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
    zIndex: '9999',
    boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
    transition: 'opacity 300ms ease',
  });
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, 2200);
}

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-z0-9-_]+/gi, '_').replace(/^_+|_+$/g, '').slice(0, 80) || 'artifact';
}

function toCSV(rows: Array<Record<string, unknown>>, columns?: Array<{ key: string; label: string }>): string {
  if (!rows.length) return '';
  const keys = columns ? columns.map((c) => c.key) : Object.keys(rows[0] ?? {});
  const headers = columns ? columns.map((c) => c.label) : keys;
  const escape = (v: unknown) => {
    const s = v == null ? '' : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const header = headers.map(escape).join(',');
  const body = rows.map((r) => keys.map((k) => escape(r[k])).join(',')).join('\n');
  return `${header}\n${body}`;
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function ViewArtifactView() {
  const { artifacts, activeArtifactId, setActiveArtifactId } = useArtifacts();
  const { setView } = useLayout();
  const widgetRef = useRef<HTMLDivElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [exporting, setExporting] = useState(false);

  const artifact = artifacts.find((a) => a.id === activeArtifactId) ?? null;

  function handleBack() {
    setActiveArtifactId(null);
    setView('artifacts');
  }

  async function handleSavePNG() {
    if (!widgetRef.current || !artifact) return;
    setMenuOpen(false);
    setExporting(true);
    try {
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(widgetRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
        logging: false,
      });
      canvas.toBlob((blob) => {
        if (!blob) {
          showToast('Failed to export PNG');
          return;
        }
        downloadBlob(blob, `${sanitizeFilename(artifact.title)}.png`);
        showToast('Saved as PNG');
      }, 'image/png');
    } catch (err) {
      console.error('[ViewArtifact] PNG export failed', err);
      showToast('Failed to export PNG');
    } finally {
      setExporting(false);
    }
  }

  function handleSaveCSV() {
    if (!artifact) return;
    setMenuOpen(false);
    const data = artifact.sourceWidget.data as Record<string, unknown>;
    let csv = '';

    // Chart: { series: [{month, revenue}, ...] }
    if (Array.isArray(data.series)) {
      csv = toCSV(data.series as Array<Record<string, unknown>>);
    }
    // Table: { columns, rows }
    else if (Array.isArray(data.rows)) {
      csv = toCSV(
        data.rows as Array<Record<string, unknown>>,
        data.columns as Array<{ key: string; label: string }> | undefined,
      );
    }
    // Metric row: { cards: [{label, value, ...}] }
    else if (Array.isArray((data as { cards?: unknown[] }).cards)) {
      csv = toCSV((data as { cards: Array<Record<string, unknown>> }).cards);
    }
    else {
      showToast('No tabular data to export');
      return;
    }

    if (!csv) {
      showToast('No tabular data to export');
      return;
    }
    downloadBlob(new Blob([csv], { type: 'text/csv;charset=utf-8;' }), `${sanitizeFilename(artifact.title)}.csv`);
    showToast('Saved as CSV');
  }

  if (!artifact) {
    return (
      <div className="flex-1 overflow-y-auto" style={{ padding: '32px 40px' }}>
        <button
          onClick={handleBack}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '8px 14px', borderRadius: 8,
            border: '1px solid var(--border)', background: 'var(--surface)',
            color: 'var(--text2)', fontSize: 13, fontFamily: 'var(--display)',
            cursor: 'pointer', marginBottom: 24,
          }}
        >
          <BackIcon /> Back to My Artifacts
        </button>
        <p style={{ color: 'var(--text3)', fontFamily: 'var(--sans)' }}>Artifact not found.</p>
      </div>
    );
  }

  const Widget = resolveWidget(artifact.sourceWidget.widgetType);
  const savedDate = new Date(artifact.savedAt).toLocaleDateString([], {
    month: 'long', day: 'numeric', year: 'numeric',
  });

  return (
    <div className="flex-1 overflow-y-auto" style={{ padding: '32px 40px', background: 'var(--bg)' }}>
      {/* Action bar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 24, gap: 12, flexWrap: 'wrap',
      }}>
        <button
          onClick={handleBack}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '8px 14px', borderRadius: 8,
            border: '1px solid var(--border)', background: 'var(--surface)',
            color: 'var(--text2)', fontSize: 13, fontWeight: 500,
            fontFamily: 'var(--display)', cursor: 'pointer',
            transition: 'all 150ms ease',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--surface2)'; e.currentTarget.style.color = 'var(--text)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--surface)'; e.currentTarget.style.color = 'var(--text2)'; }}
        >
          <BackIcon /> Back
        </button>

        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setMenuOpen((v) => !v)}
            disabled={exporting}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '8px 14px', borderRadius: 8,
              border: 'none', background: '#096645',
              color: '#fff', fontSize: 13, fontWeight: 600,
              fontFamily: 'var(--display)', cursor: exporting ? 'wait' : 'pointer',
              opacity: exporting ? 0.7 : 1,
              transition: 'background 150ms ease',
            }}
            onMouseEnter={(e) => { if (!exporting) e.currentTarget.style.background = '#0b7a52'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = '#096645'; }}
          >
            <DownloadIcon /> {exporting ? 'Exporting…' : 'Save'} <ChevronIcon />
          </button>

          {menuOpen && (
            <>
              <div
                onClick={() => setMenuOpen(false)}
                style={{ position: 'fixed', inset: 0, zIndex: 50 }}
              />
              <div style={{
                position: 'absolute', top: 'calc(100% + 6px)', right: 0,
                background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: 8, boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                minWidth: 180, zIndex: 51, overflow: 'hidden',
              }}>
                <button
                  onClick={handleSavePNG}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    width: '100%', padding: '10px 14px', textAlign: 'left',
                    background: 'transparent', border: 'none',
                    color: 'var(--text)', fontSize: 13, fontFamily: 'var(--display)',
                    fontWeight: 500, cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--surface2)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                >
                  Save as PNG
                </button>
                <div style={{ height: 1, background: 'var(--border)' }} />
                <button
                  onClick={handleSaveCSV}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    width: '100%', padding: '10px 14px', textAlign: 'left',
                    background: 'transparent', border: 'none',
                    color: 'var(--text)', fontSize: 13, fontFamily: 'var(--display)',
                    fontWeight: 500, cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--surface2)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                >
                  Save as CSV
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Title block */}
      <div style={{ marginBottom: 20 }}>
        <h1 style={{
          fontFamily: 'var(--display)', fontWeight: 700, fontSize: 22,
          color: 'var(--text)', margin: '0 0 6px',
        }}>
          {artifact.title}
        </h1>
        {artifact.description && (
          <p style={{
            fontFamily: 'var(--sans)', fontSize: 14, color: 'var(--text2)',
            lineHeight: 1.5, margin: '0 0 8px', maxWidth: 720,
          }}>
            {artifact.description}
          </p>
        )}
        <p style={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--text3)', margin: 0 }}>
          Saved {savedDate}
        </p>
      </div>

      {/* Widget */}
      <div
        ref={widgetRef}
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 12,
          padding: 24,
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        }}
      >
        <Widget
          data={artifact.sourceWidget.data as never}
          config={artifact.sourceWidget.config as never}
        />
      </div>
    </div>
  );
}
