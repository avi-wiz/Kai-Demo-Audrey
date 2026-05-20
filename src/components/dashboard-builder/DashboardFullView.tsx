'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useDashboardBuilder } from '@/contexts/DashboardBuilderContext';
import { useLayout } from '@/contexts/LayoutContext';
import { useArtifacts } from '@/contexts/ArtifactContext';
import DashboardCompositeWidget from '@/components/widgets/ui/DashboardCompositeWidget';
import DashboardKaiSidebar from '@/components/dashboard-builder/DashboardKaiSidebar';
import SaveArtifactModal from '@/components/modals/SaveArtifactModal';
import { exportDashboardAsPdf, exportDashboardAsCsv } from '@/lib/dashboardExport';
import type { DashboardCompositeData } from '@/lib/types';

function ArrowLeftIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  );
}

function SaveIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
      <polyline points="17 21 17 13 7 13 7 21" />
      <polyline points="7 3 7 8 15 8" />
    </svg>
  );
}

function ExportIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

// ── Export dropdown ──────────────────────────────────────────────────────────

interface ExportMenuProps {
  dashboard: DashboardCompositeData;
  getStageNode: () => HTMLElement | null;
}

function ExportMenu({ dashboard, getStageNode }: ExportMenuProps) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<'pdf' | 'csv' | null>(null);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Position the portal-rendered menu under the trigger button.
  useEffect(() => {
    if (!open || !wrapperRef.current) return;
    const update = () => {
      const r = wrapperRef.current!.getBoundingClientRect();
      const menuWidth = 220;
      setMenuPos({ top: r.bottom + 6, left: r.right - menuWidth });
    };
    update();
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [open]);

  // Close on outside click — check both the wrapper (trigger) and the portal menu.
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node;
      if (wrapperRef.current?.contains(t)) return;
      if (menuRef.current?.contains(t)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  const handlePdf = async () => {
    if (busy) return;
    const node = getStageNode();
    if (!node) return;
    setBusy('pdf');
    setOpen(false);
    try {
      await exportDashboardAsPdf(dashboard, node);
    } catch (e) {
      console.error('[dashboard pdf export]', e);
    } finally {
      setBusy(null);
    }
  };

  const handleCsv = () => {
    if (busy) return;
    setBusy('csv');
    setOpen(false);
    try {
      exportDashboardAsCsv(dashboard);
    } catch (e) {
      console.error('[dashboard csv export]', e);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div ref={wrapperRef} style={{ position: 'relative', display: 'inline-flex' }}>
      <button
        onClick={() => setOpen((v) => !v)}
        disabled={!!busy}
        title="Export dashboard"
        style={{
          height: 34, padding: '0 14px', fontSize: 12.5, fontWeight: 500,
          background: 'var(--surface2)', color: 'var(--text)',
          border: '1px solid var(--border)', borderRadius: 8,
          cursor: busy ? 'default' : 'pointer',
          fontFamily: 'var(--display)', display: 'flex', alignItems: 'center',
          gap: 6, transition: 'all 150ms ease',
          opacity: busy ? 0.6 : 1,
        }}
        onMouseEnter={(e) => { if (!busy) e.currentTarget.style.borderColor = 'var(--border2)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; }}
      >
        <ExportIcon />
        {busy === 'pdf' ? 'Generating PDF…' : busy === 'csv' ? 'Generating CSV…' : 'Export'}
        <ChevronDownIcon />
      </button>

      {open && menuPos && typeof window !== 'undefined' && createPortal(
        <div ref={menuRef} style={{
          position: 'fixed',
          top: menuPos.top,
          left: menuPos.left,
          width: 220,
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 8,
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
          zIndex: 9999,
          overflow: 'hidden',
        }}>
          <button
            onClick={handlePdf}
            style={{
              width: '100%', textAlign: 'left',
              padding: '10px 14px', fontSize: 12.5,
              background: 'transparent', border: 'none', cursor: 'pointer',
              fontFamily: 'var(--sans)', color: 'var(--text)',
              display: 'flex', flexDirection: 'column', gap: 2,
              transition: 'background 120ms ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--surface2)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
          >
            <span style={{ fontWeight: 600 }}>Download as PDF</span>
            <span style={{ fontSize: 11, color: 'var(--text3)' }}>Single-page A4, embedded snapshot</span>
          </button>
          <div style={{ borderTop: '1px solid var(--border)' }} />
          <button
            onClick={handleCsv}
            style={{
              width: '100%', textAlign: 'left',
              padding: '10px 14px', fontSize: 12.5,
              background: 'transparent', border: 'none', cursor: 'pointer',
              fontFamily: 'var(--sans)', color: 'var(--text)',
              display: 'flex', flexDirection: 'column', gap: 2,
              transition: 'background 120ms ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--surface2)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
          >
            <span style={{ fontWeight: 600 }}>Download as CSV</span>
            <span style={{ fontSize: 11, color: 'var(--text3)' }}>Metric cards + tables flattened</span>
          </button>
        </div>,
        document.body
      )}
    </div>
  );
}

export default function DashboardFullView() {
  const { activeDashboard, activeArtifactId, returnView, clearActive } = useDashboardBuilder();
  const { setView } = useLayout();
  const { updateArtifact } = useArtifacts();
  const [saveModal, setSaveModal] = useState(false);
  const [savedToast, setSavedToast] = useState(false);
  // Ref + DOM tag so the export menu (and the sidebar's "Export this dashboard"
  // chip via `data-dashboard-stage`) can locate the dashboard node to capture.
  const stageRef = useRef<HTMLDivElement>(null);

  const isUnsaved = !activeArtifactId;

  // Edge-case safety: if no active dashboard, kick back to artifacts
  useEffect(() => {
    if (!activeDashboard) {
      setView('artifacts');
    }
  }, [activeDashboard, setView]);

  if (!activeDashboard) return null;

  const handleBack = () => {
    clearActive();
    setView(returnView);
  };

  const handleSaveChanges = () => {
    if (isUnsaved) {
      // No artifact yet — open SaveArtifactModal to create one
      setSaveModal(true);
    } else {
      // Already saved — patch the existing artifact in place
      updateArtifact(activeArtifactId, {
        sourceWidget: { widgetType: 'UW-030', data: activeDashboard as unknown as Record<string, unknown> },
        ...({ dashboardData: activeDashboard } as Record<string, unknown>),
      });
      setSavedToast(true);
      setTimeout(() => setSavedToast(false), 2000);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'row', height: '100%', width: '100%', overflow: 'hidden' }}>
      {/* Left column — header + dashboard grid */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        {/* Header */}
        <div style={{
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '20px 28px',
          borderBottom: '1px solid var(--border)',
          background: 'var(--surface)',
          gap: 16,
        }}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                fontFamily: 'var(--display)',
                fontWeight: 700,
                fontSize: 18,
                color: 'var(--text)',
                marginBottom: 2,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                {activeDashboard.title}
              </div>
              {isUnsaved && (
                <span style={{
                  fontSize: 10, fontWeight: 600, letterSpacing: '0.04em',
                  textTransform: 'uppercase', padding: '2px 8px', borderRadius: 99,
                  background: 'rgba(234,179,8,0.1)', border: '1px solid rgba(234,179,8,0.3)',
                  color: '#b45309', fontFamily: 'var(--display)', flexShrink: 0,
                }}>
                  Unsaved
                </span>
              )}
            </div>
            {activeDashboard.description && (
              <div style={{
                fontFamily: 'var(--sans)',
                fontSize: 12,
                color: 'var(--text2)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                {activeDashboard.description}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <button
              onClick={handleBack}
              style={{
                height: 34, padding: '0 14px', fontSize: 12.5, fontWeight: 500,
                background: 'var(--surface2)', color: 'var(--text)',
                border: '1px solid var(--border)', borderRadius: 8, cursor: 'pointer',
                fontFamily: 'var(--display)', display: 'flex', alignItems: 'center',
                gap: 6, transition: 'all 150ms ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--border2)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; }}
            >
              <ArrowLeftIcon />
              Back
            </button>
            <button
              onClick={handleSaveChanges}
              style={{
                height: 34, padding: '0 16px', fontSize: 12.5, fontWeight: 600,
                background: 'var(--primary-80)', color: '#fff', border: 'none',
                borderRadius: 8, cursor: 'pointer', fontFamily: 'var(--display)',
                display: 'flex', alignItems: 'center', gap: 6, transition: 'all 150ms ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--primary-70)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--primary-80)'; }}
            >
              <SaveIcon />
              {isUnsaved ? 'Save Dashboard' : 'Save Changes'}
            </button>
            <ExportMenu
              dashboard={activeDashboard}
              getStageNode={() => stageRef.current}
            />
          </div>
        </div>

        {/* Body — full-bleed dashboard */}
        <div style={{
          flex: 1, overflow: 'auto', padding: '32px 40px',
          background: 'var(--bg)', display: 'flex', justifyContent: 'center',
        }}>
          <div
            ref={stageRef}
            data-dashboard-stage="true"
            style={{ width: '100%', maxWidth: 1200 }}
          >
            <DashboardCompositeWidget data={activeDashboard} config={{ mode: 'full' }} />
          </div>
        </div>
      </div>

      {/* Right column — Kai sidebar */}
      <DashboardKaiSidebar />

      {/* Save modal — for unsaved dashboards */}
      {saveModal && (
        <SaveArtifactModal
          widgetType="UW-030"
          defaultTitle={activeDashboard.title}
          defaultDescription={activeDashboard.description}
          data={activeDashboard as unknown as Record<string, unknown>}
          categoryOverride="Dashboards and Reports"
          dashboardData={activeDashboard}
          onClose={() => setSaveModal(false)}
          onSaved={() => {
            setSaveModal(false);
            clearActive();
            setView('artifacts');
          }}
        />
      )}

      {/* In-place save toast */}
      {savedToast && (
        <div style={{
          position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
          background: '#166534', color: '#fff', padding: '10px 20px', borderRadius: 8,
          fontSize: 14, fontWeight: 500, zIndex: 9999, boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
        }}>
          Dashboard saved
        </div>
      )}
    </div>
  );
}
