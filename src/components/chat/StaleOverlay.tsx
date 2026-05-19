'use client';

export default function StaleOverlay() {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: 'rgba(255,255,255,0.72)',
        borderRadius: 'inherit',
        pointerEvents: 'none',
        animation: 'staleFadeIn 300ms ease both',
        zIndex: 10,
      }}
    >
      <style>{`
        @keyframes staleFadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
      <span
        style={{
          position: 'absolute',
          top: 8,
          right: 12,
          fontFamily: 'var(--sans)',
          fontSize: 10,
          fontStyle: 'italic',
          color: 'var(--text3)',
          letterSpacing: '0.02em',
        }}
      >
        Superseded
      </span>
    </div>
  );
}
