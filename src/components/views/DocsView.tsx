'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

// ── Types ─────────────────────────────────────────────────────────────────────

type DocStatus = 'uploading' | 'processing' | 'indexed';

interface DocEntry {
  id: string;
  name: string;
  ext: string;
  pages: number | null;
  status: DocStatus;
  progress: number;
}

// ── Static pre-seeded docs ────────────────────────────────────────────────────

const PRESEEDED: DocEntry[] = [
  { id: 'pre-1', name: 'WizCommerce Product Guide', ext: 'pdf', pages: 42, status: 'indexed', progress: 100 },
  { id: 'pre-2', name: 'WizOrder Feature Documentation', ext: 'pdf', pages: 28, status: 'indexed', progress: 100 },
  { id: 'pre-3', name: 'AI Order Entry Assistant Guide', ext: 'md', pages: 12, status: 'indexed', progress: 100 },
];

// ── Re-index toast ────────────────────────────────────────────────────────────

const TOAST_DURATION_MS = 3200;

function ReindexToast({ visible, progress }: { visible: boolean; progress: number }) {
  const r = 14;
  const circ = 2 * Math.PI * r;
  const dash = circ * (progress / 100);

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 32,
        left: '50%',
        transform: `translateX(-50%) translateY(${visible ? 0 : 16}px)`,
        opacity: visible ? 1 : 0,
        transition: 'opacity 200ms ease, transform 200ms ease',
        pointerEvents: 'none',
        zIndex: 200,
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 12,
        boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
        padding: '12px 18px',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        minWidth: 220,
        whiteSpace: 'nowrap',
      }}
    >
      {/* Circular gauge */}
      <svg width="34" height="34" viewBox="0 0 34 34" style={{ flexShrink: 0, transform: 'rotate(-90deg)' }}>
        {/* Track */}
        <circle cx="17" cy="17" r={r} fill="none" stroke="var(--border)" strokeWidth="3" />
        {/* Progress arc */}
        <circle
          cx="17"
          cy="17"
          r={r}
          fill="none"
          stroke="var(--primary-70)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`}
          style={{ transition: 'stroke-dasharray 120ms linear' }}
        />
      </svg>

      <div>
        <p style={{ fontFamily: 'var(--display)', fontWeight: 600, fontSize: 13, color: 'var(--text)', margin: 0, lineHeight: 1.3 }}>
          {progress < 100 ? 'Re-indexing knowledge base…' : 'Re-index complete ✓'}
        </p>
        <p style={{ fontSize: 11.5, fontFamily: 'var(--sans)', color: 'var(--text2)', margin: '2px 0 0' }}>
          {progress < 100 ? `${Math.round(progress)}%` : 'All documents up to date'}
        </p>
      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function FileIcon({ ext }: { ext: string }) {
  const color = ext === 'pdf' ? '#ef4444' : ext === 'md' ? '#6366f1' : '#6b7280';
  return (
    <svg width="28" height="34" viewBox="0 0 28 34" fill="none" style={{ flexShrink: 0 }}>
      <rect x="0.5" y="0.5" width="27" height="33" rx="3.5" fill="white" stroke="var(--border)" />
      <rect x="0" y="22" width="28" height="12" rx="3" fill={color} />
      <text x="14" y="32" textAnchor="middle" fill="white" fontSize="7" fontFamily="var(--sans)" fontWeight="600">
        {ext.toUpperCase()}
      </text>
    </svg>
  );
}

function ExtBadge({ ext }: { ext: string }) {
  const styles: Record<string, { color: string; bg: string }> = {
    pdf: { color: '#b91c1c', bg: 'rgba(239,68,68,0.1)' },
    docx: { color: '#1d4ed8', bg: 'rgba(59,130,246,0.1)' },
    txt: { color: '#374151', bg: 'rgba(107,114,128,0.1)' },
    md: { color: '#4338ca', bg: 'rgba(99,102,241,0.1)' },
  };
  const s = styles[ext] ?? styles.txt;
  return (
    <span style={{ fontSize: 10.5, fontFamily: 'var(--sans)', fontWeight: 600, color: s.color, background: s.bg, borderRadius: 4, padding: '2px 6px' }}>
      .{ext}
    </span>
  );
}

function StatusBadge({ status }: { status: DocStatus }) {
  if (status === 'indexed') {
    return (
      <span style={{ fontSize: 11, fontFamily: 'var(--sans)', fontWeight: 500, color: '#15803d', background: 'rgba(22,163,74,0.1)', borderRadius: 5, padding: '2px 8px', whiteSpace: 'nowrap' }}>
        Indexed ✓
      </span>
    );
  }
  return (
    <span style={{ fontSize: 11, fontFamily: 'var(--sans)', fontWeight: 500, color: 'var(--primary-70)', background: 'var(--primary-10, rgba(99,102,241,0.08))', borderRadius: 5, padding: '2px 8px', whiteSpace: 'nowrap' }}>
      {status === 'uploading' ? 'Uploading…' : 'Processing…'}
    </span>
  );
}

function ProgressBar({ progress }: { progress: number }) {
  return (
    <div style={{ height: 3, background: 'var(--border)', borderRadius: 2, marginTop: 6, overflow: 'hidden' }}>
      <div
        style={{
          height: '100%',
          width: `${progress}%`,
          background: 'linear-gradient(90deg, var(--primary-70), var(--ai-accent, #818cf8))',
          borderRadius: 2,
          transition: 'width 400ms ease-in-out',
        }}
      />
    </div>
  );
}

function DocRow({ doc, onRemove }: { doc: DocEntry; onRemove: (id: string) => void }) {
  const isProcessing = doc.status !== 'indexed';
  const [hovered, setHovered] = useState(false);

  return (
    <div
      style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <FileIcon ext={doc.ext} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontFamily: 'var(--display)', fontWeight: 600, fontSize: 13, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {doc.name}
          </span>
          <ExtBadge ext={doc.ext} />
          {doc.pages !== null && (
            <span style={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--text3)' }}>
              {doc.pages} {doc.pages === 1 ? 'page' : 'pages'}
            </span>
          )}
        </div>
        {isProcessing && <ProgressBar progress={doc.progress} />}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        <StatusBadge status={doc.status} />
        {/* Remove button — only shown on hover, only for indexed docs */}
        {doc.status === 'indexed' && (
          <button
            onClick={() => onRemove(doc.id)}
            title="Remove document"
            style={{
              opacity: hovered ? 1 : 0,
              transition: 'opacity 150ms ease',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: '3px 4px',
              borderRadius: 5,
              display: 'flex',
              alignItems: 'center',
              color: 'var(--text3)',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#ef4444')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text3)')}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2 3.5h10M5.5 3.5V2.5a.5.5 0 0 1 .5-.5h2a.5.5 0 0 1 .5.5v1M3.5 3.5l.5 8h6l.5-8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

// ── Upload zone ───────────────────────────────────────────────────────────────

function UploadIcon() {
  return (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
      <circle cx="18" cy="18" r="18" fill="var(--surface2)" />
      <path d="M18 24V14M18 14L14 18M18 14L22 18" stroke="var(--primary-70)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 26h12" stroke="var(--primary-70)" strokeWidth="1.8" strokeLinecap="round" opacity="0.5" />
    </svg>
  );
}

// ── Main view ─────────────────────────────────────────────────────────────────

export default function DocsView() {
  const [docs, setDocs] = useState<DocEntry[]>(PRESEEDED);
  const [isDragOver, setIsDragOver] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [reindexProgress, setReindexProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reindexTickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      if (reindexTickRef.current) clearInterval(reindexTickRef.current);
    };
  }, []);

  const startReindex = useCallback(() => {
    // Cancel any in-progress reindex
    if (reindexTickRef.current) clearInterval(reindexTickRef.current);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);

    setReindexProgress(0);
    setToastVisible(true);

    let p = 0;
    reindexTickRef.current = setInterval(() => {
      p += 4;
      setReindexProgress(Math.min(p, 100));
      if (p >= 100) {
        clearInterval(reindexTickRef.current!);
        // Hold at 100% briefly then hide
        toastTimerRef.current = setTimeout(() => setToastVisible(false), 900);
      }
    }, TOAST_DURATION_MS / 100 * 4); // ~128ms per tick → ~3.2s total
  }, []);

  const handleRemove = useCallback((id: string) => {
    setDocs((prev) => prev.filter((d) => d.id !== id));
    startReindex();
  }, [startReindex]);

  const processFile = useCallback((file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase() ?? 'txt';
    const name = file.name.replace(/\.[^/.]+$/, '');
    const id = `upload-${Date.now()}`;

    setDocs((prev) => [{ id, name, ext, pages: null, status: 'uploading', progress: 0 }, ...prev]);

    let p = 0;
    const tick = setInterval(() => {
      p += 5;
      setDocs((prev) => prev.map((d) => {
        if (d.id !== id) return d;
        const status: DocStatus = p < 50 ? 'uploading' : p < 100 ? 'processing' : 'indexed';
        return { ...d, progress: Math.min(p, 100), status };
      }));
      if (p >= 100) clearInterval(tick);
    }, 150);
  }, []);

  const handleFiles = useCallback((files: FileList | null) => {
    if (!files) return;
    const allowed = ['pdf', 'docx', 'txt', 'md'];
    Array.from(files).forEach((f) => {
      const ext = f.name.split('.').pop()?.toLowerCase() ?? '';
      if (allowed.includes(ext)) processFile(f);
    });
  }, [processFile]);

  return (
    <div className="flex-1 overflow-y-auto" style={{ padding: '32px 40px' }}>
      <h1 style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 18, color: 'var(--text)', marginBottom: 24 }}>
        Knowledge Base
      </h1>

      {/* Upload zone */}
      <div
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setIsDragOver(false); handleFiles(e.dataTransfer.files); }}
        style={{
          border: `2px dashed ${isDragOver ? 'var(--primary-70)' : 'var(--border)'}`,
          borderRadius: 12,
          background: isDragOver ? 'var(--primary-10, rgba(99,102,241,0.05))' : 'transparent',
          padding: '36px 24px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 10,
          cursor: 'pointer',
          transition: 'border-color 150ms ease, background 150ms ease',
          marginBottom: 28,
          userSelect: 'none',
        }}
      >
        <UploadIcon />
        <p style={{ fontFamily: 'var(--display)', fontWeight: 600, fontSize: 14, color: 'var(--text)', margin: 0 }}>
          Drag &amp; drop files here or click to browse
        </p>
        <p style={{ fontSize: 12, fontFamily: 'var(--sans)', color: 'var(--text3)', margin: 0 }}>
          Supports .pdf, .docx, .txt, .md
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx,.txt,.md"
          multiple
          style={{ display: 'none' }}
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {/* Indexed docs */}
      <section style={{ marginBottom: 24 }}>
        <p style={{ fontFamily: 'var(--display)', fontWeight: 600, fontSize: 11, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 12px' }}>
          Indexed Documents
        </p>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
          {docs.length === 0 ? (
            <p style={{ fontSize: 13, fontFamily: 'var(--sans)', color: 'var(--text3)', fontStyle: 'italic', padding: '20px 16px', margin: 0 }}>
              No documents indexed yet.
            </p>
          ) : (
            docs.map((doc, i) => (
              <div key={doc.id} style={{ borderBottom: i < docs.length - 1 ? '1px solid var(--border)' : 'none' }}>
                <DocRow doc={doc} onRemove={handleRemove} />
              </div>
            ))
          )}
        </div>
      </section>

      {/* Info footer */}
      <p style={{ fontSize: 12, fontFamily: 'var(--sans)', color: 'var(--text3)', lineHeight: 1.6, margin: 0 }}>
        Kai uses these documents to answer knowledge-base questions.<br />
        Ask anything about the indexed content in the chat.
      </p>

      {/* Re-index toast */}
      <ReindexToast visible={toastVisible} progress={reindexProgress} />
    </div>
  );
}
