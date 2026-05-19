'use client';

import { useState } from 'react';

interface SaveArtifactButtonProps {
  isVisible?: boolean;
  onClick: () => void;
}

export default function SaveArtifactButton({ isVisible = true, onClick }: SaveArtifactButtonProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      title="Save to My Artifacts"
      className="save-artifact-btn"
      style={{
        position: 'absolute',
        top: 12,
        right: 12,
        width: 28,
        height: 28,
        borderRadius: 6,
        border: '1px solid var(--border)',
        background: hovered ? 'var(--surface2)' : 'var(--surface)',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10,
        transition: 'all 250ms cubic-bezier(0.2, 0, 0, 1)',
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(4px)',
      }}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text2)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
      </svg>
    </button>
  );
}
