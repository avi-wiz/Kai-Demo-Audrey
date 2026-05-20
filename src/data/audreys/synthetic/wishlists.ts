import { bySku } from '../accessors';

export interface AudreyWishlistItem {
  sku: string;
  name: string;
  qty: number;
  unitPrice: number;
}

export interface AudreyWishlist {
  id: string;
  name: string;
  customerId: string;
  customerName: string;
  createdAt: string;
  updatedAt: string;
  items: AudreyWishlistItem[];
  notes?: string;
}

function wItem(sku: string, qty: number): AudreyWishlistItem {
  const p = bySku(sku);
  if (!p) throw new Error(`Unknown SKU in wishlists.ts: ${sku}`);
  return { sku: p.sku, name: p.name, qty, unitPrice: p.retail_price };
}

export const WISHLISTS: AudreyWishlist[] = [
  {
    id: 'W-6001',
    name: 'Spring 2026 Refill Pick',
    customerId: 'C-8001',
    customerName: 'Magnolia Home & Garden',
    createdAt: '2026-04-22',
    updatedAt: '2026-05-15',
    items: [
      wItem('51GR1779-U', 12),
      wItem('51GR1780', 24),
      wItem('51GR1871', 3),
      wItem('51GR1844', 4),
      wItem('51GR1888', 8),
    ],
    notes: 'Gardeners Grove refill pick — Lillian to confirm quantities by month end.',
  },
  {
    id: 'W-6002',
    name: 'Atlanta Market Picks',
    customerId: 'C-8003',
    customerName: 'Bloom & Basket',
    createdAt: '2026-02-10',
    updatedAt: '2026-05-09',
    items: [
      wItem('51GR1522-U', 6),
      wItem('51GR1880', 16),
      wItem('51GR1596', 12),
      wItem('51GR1905', 8),
    ],
    notes: 'A Blooming Porch + Bunnies favorites from Carter\'s Atlanta market visit.',
  },
  {
    id: 'W-6003',
    name: 'Summer Refill Candidates',
    customerId: 'C-8007',
    customerName: 'Sunflower & Sage',
    createdAt: '2026-05-01',
    updatedAt: '2026-05-18',
    items: [
      wItem('51GR1596', 12),
      wItem('51GR1880', 16),
      wItem('51GR1522-U', 4),
    ],
    notes: 'Bunnies collection summer window. Imogen to finalize.',
  },
];
