'use client';

import type { AgentCapability } from '@/lib/types';

interface AgentCapabilityListProps {
  capabilities: AgentCapability[];
  accentColor: string;
}

export default function AgentCapabilityList({ capabilities, accentColor }: AgentCapabilityListProps) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
      gap: '24px 32px',
      alignItems: 'start',
      width: '100%',
    }}>
      {capabilities.map((cap, i) => {
        const accented = i % 2 === 0;
        return (
          <div
            key={i}
            style={{
              display: 'flex',
              gap: 14,
              paddingLeft: accented ? 14 : 0,
              borderLeft: accented ? `3px solid ${accentColor}` : '3px solid transparent',
            }}
          >
            <div style={{
              width: 28,
              height: 28,
              borderRadius: '50%',
              background: 'var(--surface2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              marginTop: 1,
            }}>
              <span style={{
                fontFamily: 'var(--display)',
                fontWeight: 700,
                fontSize: 12,
                color: 'var(--text2)',
              }}>
                {i + 1}
              </span>
            </div>

            <div>
              <p style={{
                fontFamily: 'var(--display)',
                fontWeight: 600,
                fontSize: 14,
                color: 'var(--text)',
                margin: '0 0 3px',
              }}>
                {cap.title}
              </p>
              <p style={{
                fontFamily: 'var(--sans)',
                fontSize: 12.5,
                color: 'var(--text2)',
                margin: 0,
                lineHeight: 1.55,
              }}>
                {cap.description}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
