'use client';

import { useEffect, useState } from 'react';
import { usePageContext } from '@/contexts/PageContext';
import { useSharedOrders } from '@/contexts/shared/SharedOrdersContext';
import WizOrderPage from './WizOrderPage';
import type { WizOrderOrder } from '@/lib/types';

const STATUS_FILTERS = ['All', 'Open', 'Submitted', 'Pre-Book Confirmed', 'Shipped', 'Delivered'] as const;
type StatusFilter = typeof STATUS_FILTERS[number];

const STATUS_BADGE: Record<string, { bg: string; text: string; border: string; label: string }> = {
  'Open':                { bg: 'var(--badge-info-bg)',    text: 'var(--badge-info-text)',    border: 'var(--badge-info-border)',    label: 'Open' },
  'Submitted':           { bg: 'var(--badge-warning-bg)', text: 'var(--badge-warning-text)', border: 'var(--badge-warning-border)', label: 'Submitted' },
  'Pre-Book Confirmed':  { bg: 'var(--badge-neutral-bg)', text: 'var(--badge-neutral-text)', border: 'var(--badge-neutral-border)', label: 'Pre-Book Confirmed' },
  'Shipped':             { bg: 'var(--badge-warning-bg)', text: 'var(--badge-warning-text)', border: 'var(--badge-warning-border)', label: 'Shipped' },
  'Delivered':           { bg: 'var(--badge-success-bg)', text: 'var(--badge-success-text)', border: 'var(--badge-success-border)', label: 'Delivered' },
};

const PAGE_SIZE = 10;

function StatusBadge({ status }: { status: string }) {
  const style = STATUS_BADGE[status] ?? { bg: 'var(--badge-neutral-bg)', text: 'var(--badge-neutral-text)', border: 'var(--badge-neutral-border)', label: status };
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      padding: '3px 8px',
      borderRadius: 20,
      fontSize: 11,
      fontWeight: 600,
      fontFamily: 'var(--display)',
      letterSpacing: '0.2px',
      background: style.bg,
      color: style.text,
      border: `1px solid ${style.border}`,
      whiteSpace: 'nowrap',
    }}>
      {style.label}
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
        marginLeft: 6,
        letterSpacing: '0.1px',
        animation: 'kaiBadgePulse 600ms ease-out forwards',
        animationIterationCount: 1,
      }}>
        ✦ Kai
      </span>
    </>
  );
}

export default function OrdersPage() {
  const { setPage } = usePageContext();
  const { allOrders } = useSharedOrders();
  const [activeFilter, setActiveFilter] = useState<StatusFilter>('All');
  const [page, setCurrentPage] = useState(1);

  useEffect(() => {
    setPage('orders', { orders: allOrders });
  }, [setPage, allOrders]);

  const filtered = activeFilter === 'All'
    ? allOrders
    : allOrders.filter(o => o.status === activeFilter);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const pageOrders = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleFilterChange = (f: StatusFilter) => {
    setActiveFilter(f);
    setCurrentPage(1);
  };

  const filterChips = STATUS_FILTERS.map(f => ({
    label: f,
    active: f === activeFilter,
    onClick: () => handleFilterChange(f),
  }));

  return (
    <WizOrderPage
      title="Orders"
      icon="📋"
      subtitle="Manage and track all customer orders across your team."
      filterChips={filterChips}
    >
      {/* Count badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <span style={{
          fontFamily: 'var(--display)',
          fontSize: 13,
          fontWeight: 500,
          color: 'var(--text2)',
        }}>
          {filtered.length} order{filtered.length !== 1 ? 's' : ''}
          {activeFilter !== 'All' && (
            <span style={{ color: 'var(--text3)', marginLeft: 4 }}>· filtered by {activeFilter}</span>
          )}
        </span>
      </div>

      {/* Table */}
      <div style={{
        background: 'var(--surface)',
        borderRadius: 12,
        border: '1px solid var(--border)',
        overflow: 'hidden',
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--surface2)' }}>
              {['Order #', 'Customer', 'Total', 'Status', 'Date', 'Rep', 'Items'].map((col, i) => (
                <th
                  key={col}
                  style={{
                    padding: '10px 16px',
                    textAlign: i === 2 || i === 6 ? 'right' : 'left',
                    fontFamily: 'var(--display)',
                    fontSize: 10.5,
                    fontWeight: 600,
                    color: 'var(--text3)',
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase',
                    borderBottom: '1px solid var(--border)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageOrders.length === 0 ? (
              <tr>
                <td colSpan={7} style={{
                  padding: '40px 16px',
                  textAlign: 'center',
                  fontFamily: 'var(--display)',
                  fontSize: 13,
                  color: 'var(--text3)',
                }}>
                  No orders found
                </td>
              </tr>
            ) : (
              pageOrders.map((order: WizOrderOrder, idx) => (
                <OrderRow key={order.id} order={order} isLast={idx === pageOrders.length - 1} />
              ))
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 16px',
            borderTop: '1px solid var(--border)',
            background: 'var(--surface)',
          }}>
            <span style={{
              fontFamily: 'var(--display)',
              fontSize: 12,
              color: 'var(--text3)',
            }}>
              Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
            </span>
            <div style={{ display: 'flex', gap: 4 }}>
              <PagBtn label="← Prev" disabled={page === 1} onClick={() => setCurrentPage(p => p - 1)} />
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <PagBtn key={p} label={String(p)} active={p === page} onClick={() => setCurrentPage(p)} />
              ))}
              <PagBtn label="Next →" disabled={page === totalPages} onClick={() => setCurrentPage(p => p + 1)} />
            </div>
          </div>
        )}
      </div>
    </WizOrderPage>
  );
}

function OrderRow({ order, isLast }: { order: WizOrderOrder; isLast: boolean }) {
  const [hovered, setHovered] = useState(false);
  const isPreBook = order.status === 'Pre-Book Confirmed';
  // AudreyOrder carries shipWindow; access defensively since WizOrderOrder doesn't declare it
  const shipWindow = (order as unknown as Record<string, unknown>)['shipWindow'] as string | undefined;

  const fmt = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 });
  const dateStr = order.date
    ? new Date(order.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : '—';

  return (
    <tr
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? 'rgba(0,0,0,0.02)' : 'transparent',
        transition: 'background 100ms ease',
        borderBottom: isLast ? 'none' : '1px solid var(--border)',
      }}
    >
      {/* Order # */}
      <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 12, fontWeight: 500, color: 'var(--primary-80)' }}>
          {order.id}
        </span>
        {order.createdByKai && <KaiBadge />}
      </td>

      {/* Customer */}
      <td style={{ padding: '12px 16px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span style={{ fontFamily: 'var(--display)', fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>
            {order.customer}
          </span>
          {isPreBook && shipWindow && (
            <span style={{ fontFamily: 'var(--mono)', fontSize: 10.5, color: 'var(--badge-info-text)', display: 'flex', alignItems: 'center', gap: 3 }}>
              📦 Ships {shipWindow}
            </span>
          )}
        </div>
      </td>

      {/* Total */}
      <td style={{ padding: '12px 16px', textAlign: 'right', whiteSpace: 'nowrap' }}>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>
          {fmt.format(order.total)}
        </span>
      </td>

      {/* Status */}
      <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
        <StatusBadge status={order.status} />
      </td>

      {/* Date */}
      <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
        <span style={{ fontFamily: 'var(--display)', fontSize: 12, color: 'var(--text2)' }}>
          {dateStr}
        </span>
      </td>

      {/* Rep */}
      <td style={{ padding: '12px 16px' }}>
        <span style={{ fontFamily: 'var(--display)', fontSize: 12, color: 'var(--text2)' }}>
          {order.rep}
        </span>
      </td>

      {/* Items */}
      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--text2)' }}>
          {order.items ?? '—'}
        </span>
      </td>
    </tr>
  );
}

function PagBtn({ label, onClick, disabled, active }: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: '4px 10px',
        borderRadius: 6,
        border: active ? '1px solid var(--primary-80)' : '1px solid var(--border2)',
        background: active ? 'var(--primary-80)' : hovered && !disabled ? 'var(--surface2)' : 'var(--surface)',
        color: active ? '#fff' : disabled ? 'var(--text3)' : 'var(--text2)',
        fontFamily: 'var(--display)',
        fontSize: 12,
        fontWeight: active ? 600 : 400,
        cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? 0.4 : 1,
        transition: 'all 200ms ease',
      }}
    >
      {label}
    </button>
  );
}
