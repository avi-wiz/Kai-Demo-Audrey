'use client';

import { useState } from 'react';
import type { ViewRoute } from '@/lib/types';

export interface SubMenuItem {
  label: string;
  viewRoute: ViewRoute;
  onClick: () => void;
}

interface SidebarNavItemProps {
  label: string;
  viewRoute: ViewRoute;
  isActive: boolean;
  hasSubmenu?: boolean;
  submenuItems?: SubMenuItem[];
  collapsed?: boolean;
  onClick: () => void;
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      style={{
        transition: 'transform 200ms ease',
        transform: open ? 'rotate(90deg)' : 'rotate(0deg)',
        flexShrink: 0,
      }}
    >
      <path d="M4 2.5L7.5 6L4 9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function SidebarNavItem({
  label,
  isActive,
  hasSubmenu = false,
  submenuItems = [],
  collapsed = false,
  onClick,
}: SidebarNavItemProps) {
  const [submenuOpen, setSubmenuOpen] = useState(false);

  function handleClick() {
    if (!collapsed && hasSubmenu) {
      setSubmenuOpen((prev) => !prev);
    } else {
      onClick();
    }
  }

  if (collapsed) {
    return (
      <div title={label}>
        <button
          onClick={handleClick}
          className="w-full flex items-center justify-center rounded-lg transition-all duration-200 ease-in-out"
          style={{
            padding: '8px 0',
            fontSize: 15,
            color: isActive ? 'var(--primary-70)' : 'var(--text2)',
            background: isActive ? 'var(--surface2)' : 'transparent',
          }}
          onMouseEnter={(e) => {
            if (!isActive) {
              e.currentTarget.style.background = 'var(--surface2)';
              e.currentTarget.style.color = 'var(--text)';
            }
          }}
          onMouseLeave={(e) => {
            if (!isActive) {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = 'var(--text2)';
            }
          }}
        >
        </button>
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={handleClick}
        className="w-full text-left flex items-center gap-2.5 rounded-lg transition-all duration-200 ease-in-out"
        style={{
          padding: '8px 12px',
          fontSize: 13,
          fontFamily: 'var(--sans)',
          fontWeight: 500,
          color: isActive ? 'var(--primary-70)' : 'var(--text2)',
          background: isActive ? 'var(--surface2)' : 'transparent',
          borderLeft: 'solid var(--primary-80)',
          borderLeftWidth: isActive ? '3px' : '0px',
          transition: 'all 200ms ease-in-out, border-left-width 150ms ease-in-out',
        }}
        onMouseEnter={(e) => {
          if (!isActive) {
            e.currentTarget.style.background = 'var(--surface2)';
            e.currentTarget.style.color = 'var(--text)';
          }
        }}
        onMouseLeave={(e) => {
          if (!isActive) {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = 'var(--text2)';
          }
        }}
      >
        <span className="flex-1 truncate">{label}</span>
        {hasSubmenu && <ChevronIcon open={submenuOpen} />}
      </button>

      {hasSubmenu && submenuItems.length > 0 && (
        <div
          className="overflow-hidden transition-all duration-[250ms] ease-in-out"
          style={{
            paddingLeft: 24,
            marginTop: submenuOpen ? 2 : 0,
            maxHeight: submenuOpen ? '500px' : '0px',
            opacity: submenuOpen ? 1 : 0,
          }}
        >
          {submenuItems.map((sub) => (
            <button
              key={sub.label}
              onClick={sub.onClick}
              className="w-full text-left flex items-center gap-2 rounded-lg transition-all duration-200 ease-in-out"
              style={{
                padding: '6px 12px',
                fontSize: 12,
                fontFamily: 'var(--sans)',
                fontWeight: 400,
                color: 'var(--text2)',
                background: 'transparent',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--surface2)';
                e.currentTarget.style.color = 'var(--text)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = 'var(--text2)';
              }}
            >
              <span style={{ fontSize: 13, lineHeight: 1, flexShrink: 0 }}></span>
              <span>{sub.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
