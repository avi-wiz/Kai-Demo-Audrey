'use client';

import { useContext } from 'react';
import type { WidgetProps, DeepLinkButtonData } from '@/lib/types';
import { WidgetActionContext } from '@/components/engine/FrameParser';

export default function DeepLinkButton({ data: rawData }: WidgetProps) {
  const data = rawData as unknown as DeepLinkButtonData;
  const actions = useContext(WidgetActionContext);
  // Unused secondary-style flag kept on the data shape; future variants can read it.
  void (data.style === 'secondary');

  const sharedStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 5,
    fontSize: 12.5,
    fontWeight: 600,
    color: 'var(--primary-70)',
    textDecoration: 'none',
    transition: 'var(--transition-fast)',
    fontFamily: 'var(--sans)',
    cursor: 'pointer',
    background: 'transparent',
    border: 'none',
    padding: 0,
  } as const;

  const arrow = (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--primary-70)' }}>
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );

  if (data.action === 'save-as-dashboard' && actions?.onSaveAsDashboard) {
    return (
      <button
        type="button"
        onClick={actions.onSaveAsDashboard}
        style={sharedStyle}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.color = 'var(--primary-80)';
          (e.currentTarget as HTMLButtonElement).style.textDecoration = 'underline';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.color = 'var(--primary-70)';
          (e.currentTarget as HTMLButtonElement).style.textDecoration = 'none';
        }}
      >
        {data.label}
        {arrow}
      </button>
    );
  }

  return (
    <a
      href={data.url}
      style={sharedStyle}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLAnchorElement).style.color = 'var(--primary-80)';
        (e.currentTarget as HTMLAnchorElement).style.textDecoration = 'underline';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLAnchorElement).style.color = 'var(--primary-70)';
        (e.currentTarget as HTMLAnchorElement).style.textDecoration = 'none';
      }}
    >
      {data.label}
      {arrow}
    </a>
  );
}
