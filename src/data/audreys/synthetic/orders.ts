import type { WizOrderOrder } from '@/lib/types';
import type { ProductBucket } from '../types';
import { bySku } from '../accessors';

export interface AudreyOrderLineDetail {
  sku: string;
  name: string;
  qty: number;
  unitPrice: number;
  lineTotal: number;
}

export interface AudreyOrder extends WizOrderOrder {
  customerId: string;
  repId: string;
  bucket: ProductBucket;
  lines: AudreyOrderLineDetail[];
  shipWindow?: string;
}

function ln(sku: string, qty: number): AudreyOrderLineDetail {
  const p = bySku(sku);
  if (!p) throw new Error(`Unknown SKU in orders.ts: ${sku}`);
  const lineTotal = Math.round(p.retail_price * qty * 100) / 100;
  return { sku: p.sku, name: p.name, qty, unitPrice: p.retail_price, lineTotal };
}

function mk(
  id: string,
  customerId: string,
  customer: string,
  repId: string,
  rep: string,
  date: string,
  status: string,
  bucket: ProductBucket,
  lines: AudreyOrderLineDetail[],
  shipWindow?: string,
): AudreyOrder {
  const total = Math.round(lines.reduce((s, l) => s + l.lineTotal, 0) * 100) / 100;
  return {
    id,
    orderNumber: id,
    customerId,
    customer,
    repId,
    rep,
    date,
    status,
    bucket,
    lines,
    items: lines.length,
    total,
    ...(shipWindow ? { shipWindow } : {}),
  };
}

// Reps (mirror sales-reps.ts so this file is self-contained for typing only)
const BETH = { id: 'R-001', name: 'Beth Calloway' };
const MARCUS = { id: 'R-002', name: 'Marcus Rivera' };
const HANNAH = { id: 'R-003', name: 'Hannah Cho' };

export const ORDERS: AudreyOrder[] = [
  // ── featured_collections (12) ──────────────────────────────────────────────
  mk('O-50001', 'C-8001', 'Magnolia Home & Garden', BETH.id, BETH.name, '2026-05-04', 'Shipped', 'featured_collections', [ln('51GR1779-U', 12), ln('51GR1780', 24), ln('51GR1871', 4)]),
  mk('O-50002', 'C-8001', 'Magnolia Home & Garden', BETH.id, BETH.name, '2026-04-12', 'Delivered', 'featured_collections', [ln('51GR1888', 12), ln('51GR1844', 4)]),
  mk('O-50003', 'C-8002', 'The Potting Shed', BETH.id, BETH.name, '2026-05-12', 'Submitted', 'featured_collections', [ln('51GR1522-U', 4), ln('51GR1905', 8), ln('51GR1643', 15)]),
  mk('O-50004', 'C-8002', 'The Potting Shed', BETH.id, BETH.name, '2026-04-08', 'Delivered', 'featured_collections', [ln('51GR1864', 24), ln('51GR1676', 3)]),
  mk('O-50005', 'C-8003', 'Bloom & Basket', MARCUS.id, MARCUS.name, '2026-05-09', 'Submitted', 'featured_collections', [ln('51GR1522-U', 6), ln('51GR1880', 16), ln('51GR1596', 8)]),
  mk('O-50006', 'C-8003', 'Bloom & Basket', MARCUS.id, MARCUS.name, '2026-04-02', 'Shipped', 'featured_collections', [ln('51GR1905', 8), ln('51GR1844', 4)]),
  mk('O-50007', 'C-8005', 'Copper Creek Trading', HANNAH.id, HANNAH.name, '2026-05-15', 'Submitted', 'featured_collections', [ln('51GR1779-U', 8), ln('51GR1780', 16)]),
  mk('O-50008', 'C-8005', 'Copper Creek Trading', HANNAH.id, HANNAH.name, '2026-04-18', 'Delivered', 'featured_collections', [ln('51GR1871', 2), ln('51GR1844', 4)]),
  mk('O-50009', 'C-8007', 'Sunflower & Sage', BETH.id, BETH.name, '2026-05-06', 'Submitted', 'featured_collections', [ln('51GR1596', 12), ln('51GR1880', 8), ln('51GR1522-U', 4)]),
  mk('O-50010', 'C-8007', 'Sunflower & Sage', BETH.id, BETH.name, '2026-04-05', 'Shipped', 'featured_collections', [ln('51GR1880', 16), ln('51GR1905', 6)]),
  mk('O-50011', 'C-8001', 'Magnolia Home & Garden', BETH.id, BETH.name, '2026-02-22', 'Delivered', 'featured_collections', [ln('51GR1779-U', 8), ln('51GR1929', 24)]),
  mk('O-50012', 'C-8003', 'Bloom & Basket', MARCUS.id, MARCUS.name, '2026-02-19', 'Delivered', 'featured_collections', [ln('51GR1522-U', 4), ln('51GR1888', 8)]),

  // ── july_release (8) — all Pre-Book Confirmed ──────────────────────────────
  mk('O-50013', 'C-8001', 'Magnolia Home & Garden', BETH.id, BETH.name, '2026-05-10', 'Pre-Book Confirmed', 'july_release', [ln('51GR1952-S3', 12), ln('51GR1953', 9), ln('51GR1954', 9)], 'Sep 2026'),
  mk('O-50014', 'C-8002', 'The Potting Shed', BETH.id, BETH.name, '2026-05-08', 'Pre-Book Confirmed', 'july_release', [ln('51GR1951-S8', 8), ln('51GR1952-S3', 12)], 'Sep 2026'),
  mk('O-50015', 'C-8003', 'Bloom & Basket', MARCUS.id, MARCUS.name, '2026-05-11', 'Pre-Book Confirmed', 'july_release', [ln('51GR1953', 6), ln('51GR1945-S2', 2)], 'Oct 2026'),
  mk('O-50016', 'C-8004', 'Seaside Gifts', MARCUS.id, MARCUS.name, '2026-05-07', 'Pre-Book Confirmed', 'july_release', [ln('51GR1954', 6), ln('51GR1952-S3', 6)], 'Oct 2026'),
  mk('O-50017', 'C-8005', 'Copper Creek Trading', HANNAH.id, HANNAH.name, '2026-05-13', 'Pre-Book Confirmed', 'july_release', [ln('51GR1951-S8', 4), ln('51GR1953', 3)], 'Sep 2026'),
  mk('O-50018', 'C-8007', 'Sunflower & Sage', BETH.id, BETH.name, '2026-05-09', 'Pre-Book Confirmed', 'july_release', [ln('51GR1952-S3', 6), ln('51GR1954', 3)], 'Sep 2026'),
  mk('O-50019', 'C-8001', 'Magnolia Home & Garden', BETH.id, BETH.name, '2026-04-28', 'Pre-Book Confirmed', 'july_release', [ln('51GR1945-S2', 4), ln('51GR1951-S8', 4)], 'Dec 2026'),
  mk('O-50020', 'C-8003', 'Bloom & Basket', MARCUS.id, MARCUS.name, '2026-04-25', 'Pre-Book Confirmed', 'july_release', [ln('51GR1953', 6), ln('51GR1952-S3', 6)], 'Dec 2026'),

  // ── garden_outdoor (6) — Shipped / Delivered ──────────────────────────────
  mk('O-50021', 'C-8001', 'Magnolia Home & Garden', BETH.id, BETH.name, '2026-04-12', 'Delivered', 'garden_outdoor', [ln('51GR1928', 8), ln('51GR1900', 12)]),
  mk('O-50022', 'C-8004', 'Seaside Gifts', MARCUS.id, MARCUS.name, '2026-04-30', 'Shipped', 'garden_outdoor', [ln('51GR1943', 6), ln('51GR1898', 12)]),
  mk('O-50023', 'C-8004', 'Seaside Gifts', MARCUS.id, MARCUS.name, '2026-03-25', 'Delivered', 'garden_outdoor', [ln('51GR1900', 8), ln('51GR1928', 4)]),
  mk('O-50024', 'C-8004', 'Seaside Gifts', MARCUS.id, MARCUS.name, '2026-02-14', 'Delivered', 'garden_outdoor', [ln('51GR1916', 16), ln('51GR1898', 6)]),
  mk('O-50025', 'C-8005', 'Copper Creek Trading', HANNAH.id, HANNAH.name, '2026-03-30', 'Delivered', 'garden_outdoor', [ln('51GR1904', 4), ln('51GR1944', 8)]),
  mk('O-50026', 'C-8007', 'Sunflower & Sage', BETH.id, BETH.name, '2026-03-15', 'Shipped', 'garden_outdoor', [ln('51GR1898', 6), ln('51GR1916', 16)]),

  // ── sale_clearance (5) — Open / Submitted ──────────────────────────────────
  mk('O-50027', 'C-8001', 'Magnolia Home & Garden', BETH.id, BETH.name, '2026-05-18', 'Open', 'sale_clearance', [ln('51GR1907', 8), ln('51GR1919', 24)]),
  mk('O-50028', 'C-8002', 'The Potting Shed', BETH.id, BETH.name, '2026-05-16', 'Open', 'sale_clearance', [ln('51GR1895', 8), ln('51GR1876', 12)]),
  mk('O-50029', 'C-8005', 'Copper Creek Trading', HANNAH.id, HANNAH.name, '2026-05-14', 'Submitted', 'sale_clearance', [ln('51GR1762', 6), ln('51GR1890', 4)]),
  mk('O-50030', 'C-8006', 'Harbor Lane Boutique', HANNAH.id, HANNAH.name, '2026-05-12', 'Open', 'sale_clearance', [ln('51GR1653', 16), ln('51GR1937', 8)]),
  mk('O-50031', 'C-8007', 'Sunflower & Sage', BETH.id, BETH.name, '2026-05-10', 'Submitted', 'sale_clearance', [ln('51GR1786', 12), ln('51GR1891', 4)]),

  // ── mixed (4) — Open / Submitted ───────────────────────────────────────────
  mk('O-50032', 'C-8006', 'Harbor Lane Boutique', HANNAH.id, HANNAH.name, '2026-03-29', 'Submitted', 'featured_collections', [ln('51GR1643', 15), ln('51GR1864', 12)]),
  mk('O-50033', 'C-8008', 'Golden Meadow Co', MARCUS.id, MARCUS.name, '2026-02-19', 'Submitted', 'featured_collections', [ln('51GR1779-U', 4), ln('51GR1780', 8)]),
  mk('O-50034', 'C-8002', 'The Potting Shed', BETH.id, BETH.name, '2026-05-19', 'Open', 'atlanta_top_sellers', [ln('51GR1776-U', 4), ln('51GR1914', 16)]),
  mk('O-50035', 'C-8005', 'Copper Creek Trading', HANNAH.id, HANNAH.name, '2026-05-17', 'Open', 'spring_summer', [ln('51GR1943', 4), ln('51GR1898', 12)]),
];
