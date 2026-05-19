'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import type { ArtifactType, ArtifactCategory, SavedArtifact, DashboardCompositeData } from '@/lib/types';
import { useArtifacts } from '@/contexts/ArtifactContext';
import { useLayout } from '@/contexts/LayoutContext';

interface SaveArtifactModalProps {
  widgetType: string;
  defaultTitle: string;
  defaultDescription?: string;
  data: Record<string, unknown>;
  config?: Record<string, unknown>;
  categoryOverride?: ArtifactCategory;
  dashboardData?: DashboardCompositeData;
  onClose: () => void;
  onSaved?: (artifactId: string) => void;
}

function artifactTypeFor(widgetType: string): ArtifactType {
  if (widgetType === 'CH-001') return 'chart';
  if (widgetType === 'UW-004') return 'table';
  return 'metric';
}

function thumbnailFor(widgetType: string): string {
  if (widgetType === 'CH-001') return 'line-chart';
  if (widgetType === 'UW-004') return 'data-table';
  return 'metric';
}

let toastTimeout: ReturnType<typeof setTimeout> | null = null;

export default function SaveArtifactModal({
  widgetType,
  defaultTitle,
  defaultDescription,
  data,
  config,
  categoryOverride,
  dashboardData,
  onClose,
  onSaved,
}: SaveArtifactModalProps) {
  const [title, setTitle] = useState(defaultTitle);
  const [description, setDescription] = useState(defaultDescription ?? '');
  const [titleTouched, setTitleTouched] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);
  const { addArtifact } = useArtifacts();
  const { setView } = useLayout();

  useEffect(() => {
    titleRef.current?.focus();
    titleRef.current?.select();
  }, []);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  function handleSave() {
    if (!title.trim()) { setTitleTouched(true); titleRef.current?.focus(); return; }

    const id = crypto.randomUUID();
    const artifact: SavedArtifact = {
      id,
      type: artifactTypeFor(widgetType),
      category: categoryOverride ?? ('reports' as ArtifactCategory),
      title: title.trim(),
      description: description.trim(),
      savedAt: Date.now(),
      sourceWidget: { widgetType, data, config },
      thumbnail: thumbnailFor(widgetType),
      ...(dashboardData ? { dashboardData } : {}),
    } as SavedArtifact;

    addArtifact(artifact);
    onClose();
    onSaved?.(id);
    setView('artifacts');

    // Toast
    const existing = document.getElementById('kai-artifact-toast');
    if (existing) existing.remove();
    if (toastTimeout) clearTimeout(toastTimeout);

    const toast = document.createElement('div');
    toast.id = 'kai-artifact-toast';
    toast.textContent = 'Artifact saved';
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
    toastTimeout = setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 300);
    }, 2000);
  }

  const modal = (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.45)',
          zIndex: 1000,
          animation: 'backdropFadeIn 200ms ease-out both',
        }}
      />
      <style>{`
        @keyframes backdropFadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes modalEntrance {
          from { opacity: 0; transform: translate(-50%, -48%) scale(0.95); }
          to   { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        }
      `}</style>

      {/* Modal card */}
      <div
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 1001,
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 12,
          maxWidth: 480,
          width: 'calc(100vw - 48px)',
          padding: 24,
          boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
          animation: 'modalEntrance 250ms cubic-bezier(0.34, 1.56, 0.64, 1) both',
        }}
      >
        <h2 style={{ margin: '0 0 20px', fontSize: 16, fontWeight: 700, color: 'var(--text)', fontFamily: 'var(--display)' }}>
          Save to My Artifacts
        </h2>

        <label style={{ display: 'block', marginBottom: 12 }}>
          <span style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text2)', marginBottom: 6 }}>Title</span>
          <input
            ref={titleRef}
            value={title}
            onChange={(e) => { setTitle(e.target.value); if (e.target.value.trim()) setTitleTouched(false); }}
            style={{
              width: '100%',
              boxSizing: 'border-box',
              border: `1px solid ${titleTouched && !title.trim() ? 'var(--error-80, #dc2626)' : 'var(--border)'}`,
              borderRadius: 8,
              padding: '10px 12px',
              fontSize: 14,
              fontWeight: 500,
              fontFamily: 'var(--display)',
              color: 'var(--text)',
              background: 'var(--surface2)',
              outline: 'none',
            }}
          />
        </label>

        <label style={{ display: 'block', marginBottom: 24 }}>
          <span style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text2)', marginBottom: 6 }}>Description</span>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add a description..."
            style={{
              width: '100%',
              boxSizing: 'border-box',
              border: '1px solid var(--border)',
              borderRadius: 8,
              padding: '10px 12px',
              fontSize: 14,
              fontFamily: 'var(--display)',
              color: 'var(--text)',
              background: 'var(--surface2)',
              outline: 'none',
              resize: 'vertical',
              lineHeight: 1.5,
            }}
          />
        </label>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 8 }}>
          <button
            onClick={handleSave}
            disabled={!title.trim()}
            style={{
              padding: '10px 24px',
              borderRadius: 8,
              border: 'none',
              background: title.trim() ? 'var(--primary-80)' : 'var(--border)',
              color: '#fff',
              fontSize: 14,
              fontWeight: 600,
              cursor: title.trim() ? 'pointer' : 'not-allowed',
              fontFamily: 'var(--display)',
              transition: 'all 200ms ease',
              boxShadow: title.trim() ? '0 2px 8px rgba(22, 136, 95, 0.2)' : 'none',
            }}
          >
            Save to My Artifacts
          </button>
          <button
            onClick={onClose}
            style={{
              padding: '10px 24px',
              borderRadius: 8,
              border: '1px solid var(--border)',
              background: 'var(--surface)',
              color: 'var(--text2)',
              fontSize: 14,
              fontWeight: 500,
              cursor: 'pointer',
              fontFamily: 'var(--display)',
              transition: 'all 200ms ease',
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </>
  );

  return createPortal(modal, document.body);
}
