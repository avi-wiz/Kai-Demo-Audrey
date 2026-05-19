'use client';

import { useEffect, useState } from 'react';
import { usePageContext } from '@/contexts/PageContext';
import WizOrderPage from './WizOrderPage';
import type { WizOrderProduct } from '@/lib/types';
import productsRaw from '@/fixtures/wizorder-products.json';

const ALL_PRODUCTS = (productsRaw as { products: WizOrderProduct[] }).products;

const STATUS_FILTERS = ['All', 'In Stock', 'Low Stock', 'Out of Stock'] as const;
type StatusFilter = typeof STATUS_FILTERS[number];

const CATEGORY_ICONS: Record<string, string> = {
  Lighting:  '💡',
  Décor:     '🏺',
  Fragrance: '🕯️',
  Textiles:  '🛋️',
  Furniture: '🪑',
};

const STOCK_BADGE: Record<string, { bg: string; text: string; border: string }> = {
  'In Stock':     { bg: 'var(--badge-success-bg)', text: 'var(--badge-success-text)', border: 'var(--badge-success-border)' },
  'Low Stock':    { bg: 'var(--badge-warning-bg)', text: 'var(--badge-warning-text)', border: 'var(--badge-warning-border)' },
  'Out of Stock': { bg: 'var(--badge-danger-bg)',  text: 'var(--badge-danger-text)',  border: 'var(--badge-danger-border)' },
};

function StockBadge({ status, stock }: { status: string; stock: number }) {
  const style = STOCK_BADGE[status] ?? { bg: 'var(--badge-neutral-bg)', text: 'var(--badge-neutral-text)', border: 'var(--badge-neutral-border)' };
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 4,
      padding: '3px 8px',
      borderRadius: 20,
      fontSize: 11,
      fontWeight: 600,
      fontFamily: 'var(--display)',
      background: style.bg,
      color: style.text,
      border: `1px solid ${style.border}`,
      whiteSpace: 'nowrap',
    }}>
      {status}
      {status !== 'Out of Stock' && (
        <span style={{ fontFamily: 'var(--mono)', fontWeight: 500, opacity: 0.75 }}>
          · {stock}
        </span>
      )}
    </span>
  );
}

function ProductCard({ product }: { product: WizOrderProduct }) {
  const [hovered, setHovered] = useState(false);

  const fmt = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 });
  const categoryIcon = CATEGORY_ICONS[product.category] ?? '📦';

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
        boxShadow: hovered ? '0 4px 16px rgba(0,0,0,0.08)' : '0 1px 3px rgba(0,0,0,0.04)',
        cursor: 'default',
      }}
    >
      {/* Thumbnail + status row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <div style={{
          width: 64,
          height: 64,
          borderRadius: 8,
          background: 'var(--surface2)',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 26,
          border: '1px solid var(--border)',
        }}>
          {categoryIcon}
        </div>
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{
            fontFamily: 'var(--display)',
            fontSize: 13,
            fontWeight: 700,
            color: 'var(--text)',
            letterSpacing: '-0.1px',
            lineHeight: 1.3,
          }}>
            {product.name}
          </span>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text3)', fontWeight: 500 }}>
            {product.sku}
          </span>
        </div>
      </div>

      {/* Price + stock */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 8,
        borderTop: '1px solid var(--border)',
        gap: 8,
        flexWrap: 'wrap',
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <span style={{ fontFamily: 'var(--display)', fontSize: 10, color: 'var(--text3)', fontWeight: 600, letterSpacing: '0.4px', textTransform: 'uppercase' }}>
            Unit Price
          </span>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>
            {fmt.format(product.price)}
          </span>
        </div>
        <StockBadge status={product.status} stock={product.stock} />
      </div>

      {/* Category */}
      <div style={{ marginTop: -4 }}>
        <span style={{
          fontFamily: 'var(--display)',
          fontSize: 11,
          color: 'var(--text3)',
          fontWeight: 500,
        }}>
          {product.category}
        </span>
      </div>
    </div>
  );
}

export default function ProductsPage() {
  const { setPage } = usePageContext();
  const [activeFilter, setActiveFilter] = useState<StatusFilter>('All');

  useEffect(() => {
    setPage('products', { products: ALL_PRODUCTS });
  }, [setPage]);

  const filtered = activeFilter === 'All'
    ? ALL_PRODUCTS
    : ALL_PRODUCTS.filter(p => p.status === activeFilter);

  const filterChips = STATUS_FILTERS.map(f => ({
    label: f,
    active: f === activeFilter,
    onClick: () => setActiveFilter(f),
  }));

  return (
    <WizOrderPage
      title="Products"
      icon="📦"
      subtitle="Browse and manage your product catalog."
      filterChips={filterChips}
    >
      <div style={{ marginBottom: 16 }}>
        <span style={{ fontFamily: 'var(--display)', fontSize: 13, fontWeight: 500, color: 'var(--text2)' }}>
          {filtered.length} product{filtered.length !== 1 ? 's' : ''}
          {activeFilter !== 'All' && (
            <span style={{ color: 'var(--text3)', marginLeft: 4 }}>· {activeFilter}</span>
          )}
        </span>
      </div>

      <style>{`
        .products-grid {
          display: grid;
          gap: 16px;
          grid-template-columns: repeat(1, 1fr);
        }
        @media (min-width: 768px) {
          .products-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (min-width: 1200px) {
          .products-grid { grid-template-columns: repeat(3, 1fr); }
        }
      `}</style>

      <div className="products-grid">
        {filtered.map(product => (
          <ProductCard key={product.sku} product={product} />
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
            No products found
          </div>
        )}
      </div>
    </WizOrderPage>
  );
}
