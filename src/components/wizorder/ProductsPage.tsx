'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePageContext } from '@/contexts/PageContext';
import WizOrderPage from './WizOrderPage';
import { PRODUCTS, HEROES, byCollection, byBucket, getDisplayPrice } from '@/data/audreys';
import type { AudreyProduct } from '@/data/audreys/types';
import { useSharedCatalogs, type SharedCatalog } from '@/contexts/shared/SharedCatalogsContext';

const FEATURED_FIRST: AudreyProduct[] = [...HEROES, ...PRODUCTS.filter(p => !p.is_hero)];
const FEATURED_INDEX = new Map(FEATURED_FIRST.map((p, i) => [p.sku, i]));

const FILTERS: { label: string; resolve: () => AudreyProduct[] }[] = [
  { label: 'All', resolve: () => FEATURED_FIRST },
  { label: 'A Blooming Porch', resolve: () => byCollection('A Blooming Porch') },
  { label: 'Gardeners Grove', resolve: () => byCollection('Gardeners Grove') },
  { label: 'The Herb Garden', resolve: () => byCollection('The Herb Garden') },
  { label: 'Bunnies', resolve: () => byCollection('Bunnies') },
  { label: 'Garden Evergreen', resolve: () => byBucket('garden_outdoor') },
  { label: 'PhaseOut', resolve: () => byBucket('sale_clearance') },
];
type FilterLabel = typeof FILTERS[number]['label'];


function ProductCard({ product }: { product: AudreyProduct }) {
  const [wishlisted, setWishlisted] = useState(false);
  const [cartHovered, setCartHovered] = useState(false);
  const price = getDisplayPrice(product);

  const src =
    product.image_urls_by_size?.large?.[0] ??
    product.image_urls_by_size?.original?.[0] ??
    product.image_urls[0];
  const [imgFailed, setImgFailed] = useState(false);

  const availableQty = product.available_qty ?? product.case_qty ?? 0;

  const ask = () => {
    window.dispatchEvent(new CustomEvent('kai:ask', { detail: { query: `Tell me about ${product.sku}` } }));
  };

  return (
    <div
      style={{
        position: 'relative',
        height: '100%',
        borderRadius: '1.3rem',
        backgroundColor: '#fff',
        border: '1px solid rgba(0,0,0,0.12)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        cursor: 'pointer',
      }}
      onClick={ask}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); ask(); } }}
    >
      {/* Image area */}
      <div style={{ position: 'relative', width: '100%', aspectRatio: '1 / 1', background: '#f5f5f5', overflow: 'hidden' }}>
        {!imgFailed && src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt={product.name}
            onError={() => setImgFailed(true)}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48 }}>📦</div>
        )}

        {/* Featured / New Launch ribbon */}
        {product.is_hero && (
          <span style={{
            position: 'absolute', top: 10, left: 10,
            padding: '3px 8px', borderRadius: 4,
            fontSize: 10, fontWeight: 700,
            fontFamily: 'var(--display)',
            letterSpacing: '0.4px', textTransform: 'uppercase',
            color: '#fff',
            background: product.is_new ? 'rgba(91,106,240,0.95)' : 'rgba(217,138,22,0.95)',
            boxShadow: '0 1px 2px rgba(0,0,0,0.15)',
            zIndex: 1,
          }}>
            {product.is_new ? 'New Launch' : 'Featured'}
          </span>
        )}

        {/* Heart button */}
        <button
          onClick={(e) => { e.stopPropagation(); setWishlisted(v => !v); }}
          style={{
            position: 'absolute', top: 10, right: 10,
            width: 34, height: 34,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.9)',
            border: 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 1px 4px rgba(0,0,0,0.12)',
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill={wishlisted ? '#e53e3e' : 'none'} stroke={wishlisted ? '#e53e3e' : '#666'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </button>

        {/* View similar — right-aligned */}
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'absolute', bottom: 10, right: 10,
            background: 'rgba(255,255,255,0.92)',
            border: '1px solid rgba(0,0,0,0.10)',
            borderRadius: 20,
            padding: '4px 10px',
            whiteSpace: 'nowrap',
            display: 'flex', alignItems: 'center', gap: 5,
            boxShadow: '0 1px 4px rgba(0,0,0,0.10)',
            cursor: 'pointer',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3.604 7.197l7.138 -3.109a.96 .96 0 0 1 1.27 .527l4.924 11.902a1 1 0 0 1 -.514 1.304l-7.137 3.109a.96 .96 0 0 1 -1.271 -.527l-4.924 -11.903a1 1 0 0 1 .514 -1.304z" />
            <path d="M15 4h1a1 1 0 0 1 1 1v3.5" />
            <path d="M20 6c.264 .112 .52 .217 .768 .315a1 1 0 0 1 .53 1.311l-2.298 5.374" />
          </svg>
          <span style={{ color: '#000', fontSize: 12, fontWeight: 700, fontFamily: 'var(--sans)' }}>View similar</span>
        </div>
      </div>

      {/* Available count */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        background: 'rgb(247, 248, 250)',
        padding: '5px 14px',
      }}>
        <span style={{ color: '#000', fontSize: 10, fontWeight: 400, fontFamily: 'var(--sans)' }}>Available</span>
        <span style={{ color: '#000', fontSize: 10, fontWeight: 400, fontFamily: 'var(--sans)' }}>:{availableQty}</span>
      </div>

      {/* Info */}
      <div style={{ padding: '6px 14px 14px', display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
        <span style={{
          fontFamily: 'var(--sans)',
          fontSize: 13,
          fontWeight: 500,
          color: 'var(--text)',
          lineHeight: 1.35,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}>
          {product.name}
        </span>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text3)' }}>
          {product.sku}
        </span>
        <span style={{ fontFamily: 'var(--sans)', fontSize: 14, fontWeight: 600, color: 'var(--text)', marginTop: 2 }}>
          {price.value}
        </span>

        {/* Add to Cart */}
        <button
          onClick={(e) => { e.stopPropagation(); }}
          onMouseEnter={() => setCartHovered(true)}
          onMouseLeave={() => setCartHovered(false)}
          style={{
            marginTop: 8,
            width: '100%',
            padding: '10px 0',
            borderRadius: 8,
            border: 'none',
            background: cartHovered ? '#0b7a52' : '#096645',
            color: '#fff',
            fontFamily: 'var(--sans)',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'background 150ms ease',
          }}
        >
          Add to cart
        </button>
      </div>
    </div>
  );
}

type Tab = 'products' | 'catalogs';

export default function ProductsPage() {
  const { setPage } = usePageContext();
  const [activeFilter, setActiveFilter] = useState<FilterLabel>('All');
  const [activeTab, setActiveTab] = useState<Tab>('products');
  const { catalogs } = useSharedCatalogs();

  useEffect(() => {
    setPage('products', {
      products: FEATURED_FIRST,
      totalSkus: PRODUCTS.length,
      heroCount: HEROES.length,
      catalogs,
    });
  }, [setPage, catalogs]);

  const filtered = useMemo(() => {
    const entry = FILTERS.find(f => f.label === activeFilter) ?? FILTERS[0];
    const list = entry.resolve();
    if (entry.label === 'All') return list;
    return [...list].sort((a, b) => {
      const ai = FEATURED_INDEX.get(a.sku) ?? Number.MAX_SAFE_INTEGER;
      const bi = FEATURED_INDEX.get(b.sku) ?? Number.MAX_SAFE_INTEGER;
      return ai - bi;
    });
  }, [activeFilter]);

  const filterChips = FILTERS.map(f => ({
    label: f.label,
    active: f.label === activeFilter,
    onClick: () => setActiveFilter(f.label),
  }));

  return (
    <WizOrderPage
      title="Products"
      subtitle="Browse and manage your product catalog."
      filterChips={activeTab === 'products' ? filterChips : undefined}
    >
      {/* Tab row */}
      <div style={{ display: 'flex', gap: 2, marginBottom: 20, borderBottom: '1px solid var(--border)', paddingBottom: 0 }}>
        {(['products', 'catalogs'] as Tab[]).map((tab) => {
          const count = tab === 'products' ? PRODUCTS.length : catalogs.length;
          const isActive = tab === activeTab;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '8px 16px',
                background: 'none',
                border: 'none',
                borderBottom: isActive ? '2px solid var(--primary-80)' : '2px solid transparent',
                marginBottom: -1,
                cursor: 'pointer',
                fontFamily: 'var(--display)',
                fontSize: 13,
                fontWeight: isActive ? 700 : 500,
                color: isActive ? 'var(--primary-80)' : 'var(--text3)',
                transition: 'color 150ms ease',
                textTransform: 'capitalize',
              }}
            >
              {tab === 'products' ? 'Products' : 'Catalogs'} ({count})
            </button>
          );
        })}
      </div>

      <style>{`
        .products-grid {
          display: grid;
          gap: 16px;
          grid-template-columns: repeat(1, 1fr);
        }
        @media (min-width: 640px) {
          .products-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (min-width: 1024px) {
          .products-grid { grid-template-columns: repeat(3, 1fr); }
        }
        @media (min-width: 1400px) {
          .products-grid { grid-template-columns: repeat(4, 1fr); }
        }
      `}</style>

      {activeTab === 'products' ? (
        <>
          <div style={{ marginBottom: 16 }}>
            <span style={{ fontFamily: 'var(--display)', fontSize: 13, fontWeight: 500, color: 'var(--text2)' }}>
              {filtered.length} product{filtered.length !== 1 ? 's' : ''}
              {activeFilter !== 'All' && (
                <span style={{ color: 'var(--text3)', marginLeft: 4 }}>· {activeFilter}</span>
              )}
            </span>
          </div>
          <div className="products-grid">
            {filtered.map((product) => (
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
        </>
      ) : (
        <CatalogsView catalogs={catalogs} />
      )}
    </WizOrderPage>
  );
}

// ── Catalogs view ─────────────────────────────────────────────────────────────

function CatalogsView({ catalogs }: { catalogs: SharedCatalog[] }) {
  if (catalogs.length === 0) {
    return (
      <div style={{
        padding: '64px 0',
        textAlign: 'center',
        fontFamily: 'var(--display)',
        fontSize: 13,
        color: 'var(--text3)',
      }}>
        No catalogs yet. Ask Kai to build one — e.g. <span style={{ color: 'var(--text2)', fontStyle: 'italic' }}>&ldquo;Build a catalog for Mountain Bloom&rdquo;</span>.
      </div>
    );
  }
  return (
    <>
      <div style={{ marginBottom: 16 }}>
        <span style={{ fontFamily: 'var(--display)', fontSize: 13, fontWeight: 500, color: 'var(--text2)' }}>
          {catalogs.length} catalog{catalogs.length !== 1 ? 's' : ''}
        </span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {catalogs.map((c) => <CatalogCard key={c.id} catalog={c} />)}
      </div>
    </>
  );
}

function CatalogCard({ catalog }: { catalog: SharedCatalog }) {
  const handleDownload = () => downloadCatalogPdf(catalog);
  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 12,
      padding: 16,
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontFamily: 'var(--display)', fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>
              {catalog.name}
            </span>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 3,
              padding: '2px 7px', borderRadius: 10,
              fontSize: 10, fontWeight: 700, fontFamily: 'var(--display)',
              background: 'rgba(91, 106, 240, 0.14)',
              color: 'rgba(91, 106, 240, 1)',
              border: '1px solid rgba(91, 106, 240, 0.28)',
              letterSpacing: '0.2px',
            }}>
              ✦ Kai
            </span>
          </div>
          <span style={{ fontFamily: 'var(--display)', fontSize: 12, color: 'var(--text3)' }}>
            For {catalog.recipient} · {catalog.items.length} product{catalog.items.length !== 1 ? 's' : ''} · {catalog.format}
          </span>
        </div>
        <button
          type="button"
          onClick={handleDownload}
          style={{
            height: 32,
            padding: '0 14px',
            fontSize: 12.5,
            fontWeight: 600,
            background: 'var(--primary-80)',
            color: 'white',
            border: 'none',
            borderRadius: 'var(--radius-button)',
            cursor: 'pointer',
            fontFamily: 'var(--sans)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            flexShrink: 0,
          }}
        >
          ⬇ Download PDF
        </button>
      </div>

      {/* Mini thumbnail grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))',
        gap: 8,
      }}>
        {catalog.items.map((item) => (
          <div key={item.sku} style={{
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-inner)',
            overflow: 'hidden',
            background: 'var(--surface2)',
            display: 'flex',
            flexDirection: 'column',
          }}>
            <div style={{
              width: '100%',
              aspectRatio: '1 / 1',
              background: 'var(--surface2)',
              overflow: 'hidden',
            }}>
              {item.imageUrl && (
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  loading="lazy"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              )}
            </div>
            <div style={{ padding: '6px 8px', display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{
                fontSize: 11, fontWeight: 600, color: 'var(--text)',
                display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                overflow: 'hidden', lineHeight: 1.3,
              }}>
                {item.name}
              </span>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text3)' }}>
                {item.sku}
              </span>
              {catalog.includePricing && (
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text)' }}>
                  ${item.retailPrice.toFixed(2)}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Personal note */}
      {catalog.personalNote && (
        <div style={{
          borderTop: '1px solid var(--border)',
          paddingTop: 10,
          fontSize: 12,
          color: 'var(--text2)',
          fontStyle: 'italic',
          fontFamily: 'var(--sans)',
          whiteSpace: 'pre-wrap',
        }}>
          “{catalog.personalNote}”
        </div>
      )}
    </div>
  );
}

// ── PDF generation ────────────────────────────────────────────────────────────
// Renders the catalog into a printable HTML document and triggers the browser's
// native Save-as-PDF dialog via window.print(). No external PDF lib needed.

function downloadCatalogPdf(catalog: SharedCatalog) {
  const win = window.open('', '_blank');
  if (!win) return;
  const itemsHtml = catalog.items.map((i) => `
    <div class="card">
      ${i.imageUrl ? `<img src="${i.imageUrl}" alt="${escapeHtml(i.name)}" />` : ''}
      <div class="meta">
        <div class="name">${escapeHtml(i.name)}</div>
        <div class="sku">${i.sku}</div>
        ${catalog.includePricing ? `<div class="price">$${i.retailPrice.toFixed(2)} <span class="case">· case ${i.caseQty}</span></div>` : ''}
        ${catalog.includeStockLevels ? `<div class="stock">${escapeHtml(i.stockStatus)}</div>` : ''}
      </div>
    </div>
  `).join('');
  const createdDate = new Date(catalog.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  win.document.write(`<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>${escapeHtml(catalog.name)}</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: 'Helvetica Neue', Arial, sans-serif; margin: 0; padding: 36px; color: #2E3643; }
  header { display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 2px solid #16885F; padding-bottom: 14px; margin-bottom: 24px; }
  header .brand { font-size: 13px; color: #586476; letter-spacing: 1px; text-transform: uppercase; }
  header h1 { margin: 4px 0 0; font-size: 22px; }
  header .recipient { font-size: 12px; color: #586476; }
  header .date { font-size: 11px; color: #8895A9; text-align: right; }
  .note { background: #f0f2f5; padding: 12px 14px; border-left: 3px solid #16885F; margin-bottom: 24px; font-style: italic; font-size: 13px; color: #586476; white-space: pre-wrap; }
  .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
  .card { border: 1px solid #DBE6F5; border-radius: 8px; overflow: hidden; page-break-inside: avoid; }
  .card img { width: 100%; aspect-ratio: 1/1; object-fit: cover; display: block; }
  .meta { padding: 10px 12px; }
  .meta .name { font-size: 13px; font-weight: 600; line-height: 1.3; margin-bottom: 4px; }
  .meta .sku { font-family: 'SF Mono', Consolas, monospace; font-size: 10px; color: #8895A9; margin-bottom: 4px; }
  .meta .price { font-size: 13px; font-weight: 700; }
  .meta .price .case { font-weight: 400; color: #8895A9; font-size: 11px; }
  .meta .stock { font-size: 11px; color: #586476; margin-top: 3px; }
  footer { margin-top: 32px; padding-top: 14px; border-top: 1px solid #DBE6F5; font-size: 11px; color: #8895A9; }
  @media print {
    body { padding: 24px; }
    .grid { grid-template-columns: repeat(3, 1fr); }
  }
</style>
</head>
<body>
  <header>
    <div>
      <div class="brand">Audrey's Home &amp; Gift</div>
      <h1>${escapeHtml(catalog.name)}</h1>
      <div class="recipient">Curated for ${escapeHtml(catalog.recipient)} · ${catalog.items.length} product${catalog.items.length !== 1 ? 's' : ''}</div>
    </div>
    <div class="date">${createdDate}</div>
  </header>
  ${catalog.personalNote ? `<div class="note">${escapeHtml(catalog.personalNote)}</div>` : ''}
  <div class="grid">${itemsHtml}</div>
  <footer>Generated by Kai · ${createdDate}</footer>
</body>
</html>`);
  win.document.close();
  // Wait for images to load before triggering print so the PDF includes them.
  setTimeout(() => {
    try { win.focus(); win.print(); } catch { /* ignore */ }
  }, 400);
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    c === '&' ? '&amp;' :
      c === '<' ? '&lt;' :
        c === '>' ? '&gt;' :
          c === '"' ? '&quot;' :
            '&#39;'
  );
}
