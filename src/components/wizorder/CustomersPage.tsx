'use client';

import { useEffect, useState } from 'react';
import { usePageContext } from '@/contexts/PageContext';
import { useSharedCustomers } from '@/contexts/shared/SharedCustomersContext';
import WizOrderPage from './WizOrderPage';
import type { WizOrderCustomer } from '@/lib/types';

const STATUS_FILTERS = ['All', 'Active', 'Dormant'] as const;
type StatusFilter = typeof STATUS_FILTERS[number];

const TAG_COLORS: Record<string, { bg: string; color: string }> = {
  VIP:            { bg: 'rgba(234,179,8,0.12)',   color: '#B45309' },
  'Home Decor':   { bg: 'rgba(59,130,246,0.10)',  color: '#1D4ED8' },
  Lighting:       { bg: 'rgba(249,115,22,0.10)',  color: '#C2410C' },
  Furniture:      { bg: 'rgba(168,85,247,0.10)',  color: '#7C3AED' },
  Design:         { bg: 'rgba(236,72,153,0.10)',  color: '#BE185D' },
  Urban:          { bg: 'rgba(20,184,166,0.10)',  color: '#0F766E' },
  Lifestyle:      { bg: 'rgba(99,102,241,0.10)',  color: '#4338CA' },
  Boutique:       { bg: 'rgba(239,68,68,0.10)',   color: '#B91C1C' },
  Interiors:      { bg: 'rgba(16,185,129,0.10)',  color: '#065F46' },
  'New Customer': { bg: 'rgba(22,136,95,0.10)',   color: '#16885F' },
};

function TagPill({ tag }: { tag: string }) {
  const style = TAG_COLORS[tag] ?? { bg: 'rgba(139,148,158,0.12)', color: '#586476' };
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      padding: '2px 8px',
      borderRadius: 20,
      fontSize: 10,
      fontWeight: 600,
      fontFamily: 'var(--display)',
      letterSpacing: '0.2px',
      background: style.bg,
      color: style.color,
      whiteSpace: 'nowrap',
    }}>
      {tag}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const isActive = status === 'Active';
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      padding: '3px 8px',
      borderRadius: 20,
      fontSize: 11,
      fontWeight: 600,
      fontFamily: 'var(--display)',
      background: isActive ? 'var(--badge-success-bg)' : 'var(--badge-warning-bg)',
      color: isActive ? 'var(--badge-success-text)' : 'var(--badge-warning-text)',
      border: `1px solid ${isActive ? 'var(--badge-success-border)' : 'var(--badge-warning-border)'}`,
      whiteSpace: 'nowrap',
    }}>
      {status}
    </span>
  );
}

function KaiBadge() {
  return (
    <>
      <style>{`
        @keyframes kaiBadgePulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.1); box-shadow: 0 0 10px var(--ai-accent-border); }
          100% { transform: scale(1); }
        }
      `}</style>
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 3,
        padding: '2px 6px',
        borderRadius: 10,
        fontSize: 10,
        fontWeight: 700,
        fontFamily: 'var(--display)',
        background: 'var(--ai-accent-bg)',
        color: 'var(--ai-accent-text)',
        letterSpacing: '0.1px',
        animation: 'kaiBadgePulse 600ms ease-out forwards',
        animationIterationCount: 1,
      }}>
        ✦ Kai
      </span>
    </>
  );
}

function CustomerCard({ customer }: { customer: WizOrderCustomer }) {
  const [hovered, setHovered] = useState(false);

  const fmt = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 });
  const lastOrderStr = customer.lastOrder
    ? new Date(customer.lastOrder + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : '—';

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 10,
        padding: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        transition: 'box-shadow 150ms ease',
        boxShadow: hovered
          ? '0 4px 16px rgba(0,0,0,0.08)'
          : '0 1px 3px rgba(0,0,0,0.04)',
        cursor: 'default',
      }}
    >
      {/* Name row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span style={{
              fontFamily: 'var(--display)',
              fontSize: 14,
              fontWeight: 700,
              color: 'var(--text)',
              letterSpacing: '-0.2px',
            }}>
              {customer.name}
            </span>
            {customer.createdByKai && <KaiBadge />}
          </div>
          <span style={{
            fontFamily: 'var(--display)',
            fontSize: 12,
            color: 'var(--text3)',
          }}>
            {customer.contact}
          </span>
        </div>
        <StatusBadge status={customer.status} />
      </div>

      {/* Tags */}
      {customer.tags.length > 0 && (
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {customer.tags.map(tag => <TagPill key={tag} tag={tag} />)}
        </div>
      )}

      {/* Metrics */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 8,
        paddingTop: 8,
        borderTop: '1px solid var(--border)',
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span style={{ fontFamily: 'var(--display)', fontSize: 10, color: 'var(--text3)', fontWeight: 600, letterSpacing: '0.4px', textTransform: 'uppercase' }}>
            Lifetime Revenue
          </span>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>
            {fmt.format(customer.lifetimeRevenue)}
          </span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span style={{ fontFamily: 'var(--display)', fontSize: 10, color: 'var(--text3)', fontWeight: 600, letterSpacing: '0.4px', textTransform: 'uppercase' }}>
            Last Order
          </span>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 12, fontWeight: 500, color: 'var(--text2)' }}>
            {lastOrderStr}
          </span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span style={{ fontFamily: 'var(--display)', fontSize: 10, color: 'var(--text3)', fontWeight: 600, letterSpacing: '0.4px', textTransform: 'uppercase' }}>
            Orders YTD
          </span>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>
            {customer.ordersYTD}
          </span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span style={{ fontFamily: 'var(--display)', fontSize: 10, color: 'var(--text3)', fontWeight: 600, letterSpacing: '0.4px', textTransform: 'uppercase' }}>
            Rep
          </span>
          <span style={{ fontFamily: 'var(--display)', fontSize: 12, fontWeight: 500, color: 'var(--text2)' }}>
            {customer.rep}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function CustomersPage() {
  const { setPage } = usePageContext();
  const { allCustomers } = useSharedCustomers();
  const [activeFilter, setActiveFilter] = useState<StatusFilter>('All');

  useEffect(() => {
    setPage('customers', { customers: allCustomers });
  }, [setPage, allCustomers]);

  const filtered: WizOrderCustomer[] = activeFilter === 'All'
    ? allCustomers
    : allCustomers.filter(c => c.status === activeFilter);

  const filterChips = STATUS_FILTERS.map(f => ({
    label: f,
    active: f === activeFilter,
    onClick: () => setActiveFilter(f),
  }));

  return (
    <WizOrderPage
      title="Customers"
      icon="👥"
      subtitle="View and manage your customer accounts."
      filterChips={filterChips}
    >
      <div style={{ marginBottom: 16 }}>
        <span style={{ fontFamily: 'var(--display)', fontSize: 13, fontWeight: 500, color: 'var(--text2)' }}>
          {filtered.length} customer{filtered.length !== 1 ? 's' : ''}
          {activeFilter !== 'All' && (
            <span style={{ color: 'var(--text3)', marginLeft: 4 }}>· {activeFilter}</span>
          )}
        </span>
      </div>

      <style>{`
        .customers-grid {
          display: grid;
          gap: 16px;
          grid-template-columns: repeat(1, 1fr);
        }
        @media (min-width: 768px) {
          .customers-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (min-width: 1200px) {
          .customers-grid { grid-template-columns: repeat(3, 1fr); }
        }
      `}</style>

      <div className="customers-grid">
        {filtered.map(customer => (
          <CustomerCard key={customer.id} customer={customer} />
        ))}
        {filtered.length === 0 && (
          <div style={{
            gridColumn: '1 / -1',
            padding: '48px 0',
            textAlign: 'center',
            fontFamily: 'var(--display)',
            fontSize: 13,
            color: 'var(--text3)',
          }}>
            No customers found
          </div>
        )}
      </div>
    </WizOrderPage>
  );
}
