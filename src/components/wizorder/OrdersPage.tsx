'use client';

import { useEffect, useState } from 'react';
import { usePageContext } from '@/contexts/PageContext';
import { useSharedOrders } from '@/contexts/shared/SharedOrdersContext';
import WizOrderPage from './WizOrderPage';
import type { WizOrderOrder } from '@/lib/types';

const STATUS_FILTERS = ['All', 'Open', 'Submitted', 'Pre-Book Confirmed', 'Shipped', 'Delivered'] as const;
type StatusFilter = typeof STATUS_FILTERS[number];

const PAGE_SIZE = 20;

// Alternating header colors from reference
const COL_HEADERS = [
  { label: '#', align: 'center' as const, color: '#F2F6E8' },
  { label: 'Reference ID', align: 'left' as const, color: '#EBF3EF' },
  { label: 'Type', align: 'left' as const, color: '#F2F6E8' },
  { label: 'Status', align: 'left' as const, color: '#EBF3EF' },
  { label: 'Customer ID', align: 'left' as const, color: '#F2F6E8' },
  { label: 'Total', align: 'right' as const, color: '#EBF3EF' },
  { label: 'Date', align: 'left' as const, color: '#F2F6E8' },
  { label: 'Rep', align: 'left' as const, color: '#EBF3EF' },
  { label: 'Items', align: 'right' as const, color: '#F2F6E8' },
];

const STATUS_DOT: Record<string, string> = {
  'Open': '#f59e0b',
  'Submitted': '#f59e0b',
  'Pre-Book Confirmed': '#16a34a',
  'Shipped': '#f59e0b',
  'Delivered': '#16a34a',
};

function StatusCell({ status }: { status: string }) {
  const dot = STATUS_DOT[status] ?? '#94a3b8';
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: 'var(--sans)', fontSize: 13, color: 'var(--text)' }}>
      <span style={{ width: 7, height: 7, borderRadius: '50%', background: dot, flexShrink: 0, display: 'inline-block' }} />
      {status}
    </span>
  );
}

function TypePill() {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '3px 12px',
      borderRadius: 999,
      background: 'rgb(151, 183, 62)',
      color: '#fff',
      fontFamily: 'var(--sans)',
      fontSize: 12,
      fontWeight: 600,
      whiteSpace: 'nowrap',
    }}>
      Order
    </span>
  );
}

function EditIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function PagBtn({ label, onClick, disabled, active }: {
  label: string; onClick: () => void; disabled?: boolean; active?: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: '4px 10px', borderRadius: 6,
        border: active ? '1px solid rgb(9,102,69)' : '1px solid var(--border2)',
        background: active ? 'rgb(9,102,69)' : hovered && !disabled ? 'var(--surface2)' : 'var(--surface)',
        color: active ? '#fff' : disabled ? 'var(--text3)' : 'var(--text2)',
        fontFamily: 'var(--display)', fontSize: 12,
        fontWeight: active ? 600 : 400,
        cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? 0.4 : 1,
        transition: 'all 150ms ease',
      }}
    >
      {label}
    </button>
  );
}

function KaiBadge() {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 3,
      padding: '2px 6px', borderRadius: 10,
      fontSize: 10, fontWeight: 700, fontFamily: 'var(--display)',
      background: 'var(--ai-accent-bg)', color: 'var(--ai-accent-text)',
      marginLeft: 6,
    }}>
      ✦ Kai
    </span>
  );
}

function OrderRow({ order, rowNum, isEven }: { order: WizOrderOrder; rowNum: number; isEven: boolean }) {
  const [hovered, setHovered] = useState(false);
  const isDelivered = order.status === 'Delivered' || order.status === 'Pre-Book Confirmed';
  const fmt = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 });
  const dateStr = order.date
    ? new Date(order.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : '—';

  const rowBg = hovered ? 'rgba(9,102,69,0.04)' : isEven ? '#F2F4F7' : '#FFFFFF';

  const cell: React.CSSProperties = {
    padding: '11px 14px',
    borderBottom: '1px solid #f0f0f0',
    verticalAlign: 'middle',
  };

  return (
    <tr
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ background: rowBg, transition: 'background 100ms ease' }}
    >
      {/* # */}
      <td style={{ ...cell, textAlign: 'center', fontFamily: 'var(--sans)', fontSize: 13, color: 'var(--text2)' }}>
        {rowNum}
      </td>

      {/* Reference ID */}
      <td style={{ ...cell }}>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>
          {order.id}
        </span>
        {order.createdByKai && <KaiBadge />}
      </td>

      {/* Type */}
      <td style={{ ...cell }}>
        <TypePill />
      </td>

      {/* Status */}
      <td style={{ ...cell, whiteSpace: 'nowrap' }}>
        <StatusCell status={order.status} />
      </td>

      {/* Customer ID */}
      <td style={{ ...cell }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <span style={{ fontFamily: 'var(--sans)', fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>
            {order.customer}
          </span>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text3)' }}>
            {order.customerId ?? '—'}
          </span>
        </div>
      </td>

      {/* Total */}
      <td style={{ ...cell, textAlign: 'right', whiteSpace: 'nowrap' }}>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>
          {fmt.format(order.total)}
        </span>
      </td>

      {/* Date */}
      <td style={{ ...cell, whiteSpace: 'nowrap' }}>
        <span style={{ fontFamily: 'var(--sans)', fontSize: 12, color: 'var(--text2)' }}>
          {dateStr}
        </span>
      </td>

      {/* Rep */}
      <td style={{ ...cell }}>
        <span style={{ fontFamily: 'var(--sans)', fontSize: 12, color: 'var(--text2)' }}>
          {order.rep ?? '—'}
        </span>
      </td>

      {/* Items */}
      <td style={{ ...cell, textAlign: 'right' }}>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--text2)' }}>
          {order.items ?? '—'}
        </span>
      </td>
    </tr>
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
  const startRow = (page - 1) * PAGE_SIZE + 1;

  const handleFilterChange = (f: StatusFilter) => {
    setActiveFilter(f);
    setCurrentPage(1);
  };

  const filterChips = STATUS_FILTERS.map(f => ({
    label: f,
    active: f === activeFilter,
    onClick: () => handleFilterChange(f),
  }));

  const totalValue = filtered.reduce((s, o) => s + o.total, 0);
  const fmt = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 });

  return (
    <WizOrderPage
      title="Orders"
      subtitle="Manage and track all customer orders across your team."
      filterChips={filterChips}
    >
      {/* Table */}
      <div style={{
        background: '#fff',
        borderRadius: 12,
        border: '1px solid var(--border)',
        overflow: 'hidden',
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
      }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 900 }}>
            <thead>
              <tr>
                {COL_HEADERS.map((col) => (
                  <th
                    key={col.label}
                    style={{
                      padding: '11px 14px',
                      textAlign: col.align,
                      fontFamily: 'var(--sans)',
                      fontSize: 12,
                      fontWeight: 600,
                      color: '#1a1a1a',
                      background: col.color,
                      borderBottom: '1px solid #e0e0e0',
                      whiteSpace: 'nowrap',
                      letterSpacing: '0.01em',
                    }}
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pageOrders.length === 0 ? (
                <tr>
                  <td colSpan={COL_HEADERS.length} style={{
                    padding: '40px 16px', textAlign: 'center',
                    fontFamily: 'var(--sans)', fontSize: 13, color: 'var(--text3)',
                  }}>
                    No orders found
                  </td>
                </tr>
              ) : (
                pageOrders.map((order, idx) => (
                  <OrderRow
                    key={order.id}
                    order={order}
                    rowNum={startRow + idx}
                    isEven={idx % 2 === 1}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer — totals + pagination */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 16px',
          borderTop: '1px solid var(--border)',
          background: 'var(--surface)',
          flexWrap: 'wrap',
          gap: 8,
        }}>
          {/* Left: Total Orders */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M14 3v4a1 1 0 0 0 1 1h4" /><path d="M17 21h-10a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2h7l5 5v11a2 2 0 0 1 -2 2z" /><path d="M9 9l1 0" /><path d="M9 13l6 0" /><path d="M9 17l6 0" />
            </svg>
            <span style={{ fontFamily: 'var(--sans)', fontSize: 12, color: 'var(--text2)' }}>Total Orders: <strong>{filtered.length}</strong></span>
          </div>

          {/* Right: Total Value + Pagination */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, borderRadius: 20, background: 'rgb(242, 244, 247)', padding: '0.5rem 1.2rem' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M16.7 8a3 3 0 0 0 -2.7 -2h-4a3 3 0 0 0 0 6h4a3 3 0 0 1 0 6h-4a3 3 0 0 1 -2.7 -2" /><path d="M12 3v3m0 12v3" />
              </svg>
              <span style={{ fontFamily: 'var(--sans)', fontSize: 12, color: 'var(--text2)' }}>Total Value: <strong>{fmt.format(totalValue)}</strong></span>
            </div>

            {totalPages > 1 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <PagBtn label="← Prev" disabled={page === 1} onClick={() => setCurrentPage(p => p - 1)} />
                {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i + 1).map(p => (
                  <PagBtn key={p} label={String(p)} active={p === page} onClick={() => setCurrentPage(p)} />
                ))}
                {totalPages > 7 && <span style={{ color: 'var(--text3)', fontSize: 12, padding: '0 4px' }}>…</span>}
                <PagBtn label="Next →" disabled={page === totalPages} onClick={() => setCurrentPage(p => p + 1)} />
              </div>
            )}
          </div>
        </div>
      </div>
    </WizOrderPage>
  );
}
