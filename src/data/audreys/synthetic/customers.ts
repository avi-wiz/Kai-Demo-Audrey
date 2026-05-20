import type { WizOrderCustomer } from '@/lib/types';
import { bySku } from '../accessors';

export interface AudreyOrderLine {
  sku: string;
  name: string;
  qty: number;
  unitPrice: number;
}

export interface AudreyRecentOrder {
  orderId: string;
  date: string;
  total: number;
  lines: AudreyOrderLine[];
}

export interface AudreyOpenTask {
  id: string;
  title: string;
  dueDate: string;
  priority: 'High' | 'Medium' | 'Low';
  status: 'Open' | 'Overdue';
}

export interface AudreyCustomer extends WizOrderCustomer {
  region: string;
  customerType: string;
  repId: string;
  preferredCollections: string[];
  creditLimit: number;
  currentBalance: number;
  recentOrders: AudreyRecentOrder[];
  openTasks: AudreyOpenTask[];
}

function line(sku: string, qty: number): AudreyOrderLine {
  const p = bySku(sku);
  if (!p) throw new Error(`Unknown SKU referenced in customers.ts: ${sku}`);
  return { sku: p.sku, name: p.name, qty, unitPrice: p.retail_price };
}

function order(orderId: string, date: string, lines: AudreyOrderLine[]): AudreyRecentOrder {
  const total = lines.reduce((sum, l) => sum + l.qty * l.unitPrice, 0);
  return { orderId, date, total: Math.round(total * 100) / 100, lines };
}

export const CUSTOMERS: AudreyCustomer[] = [
  {
    id: 'C-8001',
    name: 'Magnolia Home & Garden',
    contact: 'Lillian Hayes',
    lifetimeRevenue: 142000,
    lastOrder: '2026-05-04',
    tags: ['garden-center', 'high-volume', 'quarterly-reorder'],
    rep: 'Beth Calloway',
    status: 'Active',
    ordersYTD: 11,
    region: 'Texas',
    customerType: 'Garden Center',
    repId: 'R-001',
    preferredCollections: ['Gardeners Grove', 'Garden Evergreen'],
    creditLimit: 75000,
    currentBalance: 18450,
    recentOrders: [
      order('O-44021', '2026-05-04', [line('51GR1779-U', 12), line('51GR1780', 24), line('51GR1871', 4)]),
      order('O-43882', '2026-04-12', [line('51GR1928', 8), line('51GR1900', 12)]),
      order('O-43705', '2026-03-18', [line('51GR1844', 6), line('51GR1888', 10)]),
      order('O-43511', '2026-02-22', [line('51GR1898', 18), line('51GR1779-U', 8)]),
    ],
    openTasks: [
      { id: 'T-9101', title: 'Confirm July 2026 Virtual Release pre-book quantities', dueDate: '2026-05-28', priority: 'High', status: 'Open' },
    ],
  },
  {
    id: 'C-8002',
    name: 'The Potting Shed',
    contact: 'Marlene Whitfield',
    lifetimeRevenue: 98500,
    lastOrder: '2026-05-12',
    tags: ['gift-store', 'atlanta-market', 'quarterly-reorder'],
    rep: 'Beth Calloway',
    status: 'Active',
    ordersYTD: 8,
    region: 'Atlanta, GA',
    customerType: 'Gift Store',
    repId: 'R-001',
    preferredCollections: ['A Blooming Porch', 'The Herb Garden'],
    creditLimit: 60000,
    currentBalance: 11200,
    recentOrders: [
      order('O-44089', '2026-05-12', [line('51GR1522-U', 4), line('51GR1905', 8), line('51GR1643', 12)]),
      order('O-43901', '2026-04-08', [line('51GR1776-U', 6), line('51GR1864', 16)]),
      order('O-43622', '2026-02-28', [line('51GR1905', 10), line('51GR1643', 18)]),
    ],
    openTasks: [
      { id: 'T-9102', title: 'Schedule Atlanta market follow-up visit', dueDate: '2026-05-30', priority: 'Medium', status: 'Open' },
      { id: 'T-9103', title: 'Send refill quote for Herb Garden tins', dueDate: '2026-05-15', priority: 'High', status: 'Overdue' },
    ],
  },
  {
    id: 'C-8003',
    name: 'Bloom & Basket',
    contact: 'Carter Ellis',
    lifetimeRevenue: 76200,
    lastOrder: '2026-05-09',
    tags: ['gift-home', 'collection-loyal', 'blooming-porch'],
    rep: 'Marcus Rivera',
    status: 'Active',
    ordersYTD: 9,
    region: 'Nashville, TN',
    customerType: 'Gift + Home',
    repId: 'R-002',
    preferredCollections: ['A Blooming Porch', 'Bunnies'],
    creditLimit: 50000,
    currentBalance: 8900,
    recentOrders: [
      order('O-44065', '2026-05-09', [line('51GR1522-U', 6), line('51GR1880', 14), line('51GR1596', 8)]),
      order('O-43844', '2026-04-02', [line('51GR1905', 8), line('51GR1844', 4)]),
      order('O-43577', '2026-02-19', [line('51GR1522-U', 4), line('51GR1888', 6)]),
    ],
    openTasks: [
      { id: 'T-9104', title: 'Pitch Bunnies collection refill for Easter restock', dueDate: '2026-06-02', priority: 'Medium', status: 'Open' },
    ],
  },
  {
    id: 'C-8004',
    name: 'Seaside Gifts',
    contact: 'Wren Caldwell',
    lifetimeRevenue: 61000,
    lastOrder: '2026-04-30',
    tags: ['coastal', 'seasonal-buyer', 'spring-summer'],
    rep: 'Marcus Rivera',
    status: 'Active',
    ordersYTD: 7,
    region: 'Charleston, SC',
    customerType: 'Coastal Décor',
    repId: 'R-002',
    preferredCollections: ['Spring & Summer', 'Garden Evergreen'],
    creditLimit: 40000,
    currentBalance: 6200,
    recentOrders: [
      order('O-44002', '2026-04-30', [line('51GR1943', 6), line('51GR1898', 12)]),
      order('O-43811', '2026-03-25', [line('51GR1900', 8), line('51GR1928', 4)]),
      order('O-43544', '2026-02-14', [line('51GR1916', 10), line('51GR1898', 8)]),
    ],
    openTasks: [
      { id: 'T-9105', title: 'Send Spring & Summer refill availability', dueDate: '2026-05-25', priority: 'Medium', status: 'Open' },
    ],
  },
  {
    id: 'C-8005',
    name: 'Copper Creek Trading',
    contact: 'Holden Briggs',
    lifetimeRevenue: 52800,
    lastOrder: '2026-05-15',
    tags: ['mountain', 'new-account', 'growing'],
    rep: 'Hannah Cho',
    status: 'Active',
    ordersYTD: 6,
    region: 'Denver, CO',
    customerType: 'Mountain Retail',
    repId: 'R-003',
    preferredCollections: ['Gardeners Grove', 'A Blooming Porch'],
    creditLimit: 35000,
    currentBalance: 5400,
    recentOrders: [
      order('O-44112', '2026-05-15', [line('51GR1779-U', 8), line('51GR1780', 16)]),
      order('O-43933', '2026-04-18', [line('51GR1871', 2), line('51GR1844', 4)]),
      order('O-43698', '2026-03-12', [line('51GR1905', 6), line('51GR1888', 8)]),
    ],
    openTasks: [
      { id: 'T-9106', title: 'Discuss expanded line for fall 2026', dueDate: '2026-06-10', priority: 'Low', status: 'Open' },
    ],
  },
  {
    id: 'C-8006',
    name: 'Harbor Lane Boutique',
    contact: 'Maeve Sutton',
    lifetimeRevenue: 44000,
    lastOrder: '2026-03-29',
    tags: ['boutique', 'warning', 'reorder-overdue'],
    rep: 'Hannah Cho',
    status: 'Warning',
    ordersYTD: 4,
    region: 'Portland, ME',
    customerType: 'Boutique',
    repId: 'R-003',
    preferredCollections: ['The Herb Garden'],
    creditLimit: 30000,
    currentBalance: 27800,
    recentOrders: [
      order('O-43781', '2026-03-29', [line('51GR1643', 14), line('51GR1864', 10)]),
      order('O-43412', '2026-02-04', [line('51GR1676', 4), line('51GR1864', 8)]),
      order('O-43205', '2025-12-18', [line('51GR1650', 2), line('51GR1643', 12)]),
    ],
    openTasks: [
      { id: 'T-9107', title: 'Re-engagement call — no reorder in 52 days', dueDate: '2026-05-22', priority: 'High', status: 'Open' },
      { id: 'T-9108', title: 'Review credit balance (near limit)', dueDate: '2026-05-18', priority: 'High', status: 'Overdue' },
    ],
  },
  {
    id: 'C-8007',
    name: 'Sunflower & Sage',
    contact: 'Imogen Park',
    lifetimeRevenue: 38500,
    lastOrder: '2026-05-06',
    tags: ['lifestyle', 'bunnies-fan', 'collection-loyal'],
    rep: 'Beth Calloway',
    status: 'Active',
    ordersYTD: 6,
    region: 'Asheville, NC',
    customerType: 'Lifestyle',
    repId: 'R-001',
    preferredCollections: ['Bunnies', 'A Blooming Porch'],
    creditLimit: 28000,
    currentBalance: 4100,
    recentOrders: [
      order('O-44038', '2026-05-06', [line('51GR1596', 12), line('51GR1880', 8), line('51GR1522-U', 4)]),
      order('O-43858', '2026-04-05', [line('51GR1880', 10), line('51GR1905', 6)]),
      order('O-43601', '2026-02-26', [line('51GR1522-U', 4), line('51GR1596', 8)]),
    ],
    openTasks: [
      { id: 'T-9109', title: 'Confirm Bunnies refill for summer window', dueDate: '2026-06-05', priority: 'Medium', status: 'Open' },
    ],
  },
  {
    id: 'C-8008',
    name: 'Golden Meadow Co',
    contact: 'Roland Pace',
    lifetimeRevenue: 28000,
    lastOrder: '2026-02-19',
    tags: ['gift-store', 'dormant', 'at-risk'],
    rep: 'Marcus Rivera',
    status: 'Dormant',
    ordersYTD: 3,
    region: 'Savannah, GA',
    customerType: 'Gift Store',
    repId: 'R-002',
    preferredCollections: ['Gardeners Grove'],
    creditLimit: 25000,
    currentBalance: 22400,
    recentOrders: [
      order('O-43488', '2026-02-19', [line('51GR1779-U', 4), line('51GR1780', 8)]),
      order('O-43102', '2025-11-08', [line('51GR1871', 1), line('51GR1779-U', 4)]),
      order('O-42889', '2025-09-22', [line('51GR1780', 12), line('51GR1888', 4)]),
    ],
    openTasks: [
      { id: 'T-9110', title: 'Win-back outreach — 90 days dormant', dueDate: '2026-05-22', priority: 'High', status: 'Open' },
      { id: 'T-9111', title: 'Credit balance review — near limit', dueDate: '2026-05-19', priority: 'High', status: 'Overdue' },
    ],
  },
  {
    id: 'C-8050',
    name: 'Garden Gate',
    contact: 'David Park',
    lifetimeRevenue: 8200,
    lastOrder: '2024-10-14',
    tags: ['inactive', 'merge-source'],
    rep: '(unassigned)',
    status: 'Inactive',
    ordersYTD: 0,
    region: 'Atlanta, GA',
    customerType: 'Boutique',
    repId: '',
    preferredCollections: [],
    creditLimit: 10000,
    currentBalance: 0,
    recentOrders: [
      order('O-30412', '2024-10-14', [line('51GR1779-U', 6), line('51GR1780', 12)]),
      order('O-29881', '2024-06-03', [line('51GR1776-U', 4), line('51GR1864', 8)]),
      order('O-29155', '2024-02-22', [line('51GR1643', 10), line('51GR1596', 6)]),
    ],
    openTasks: [],
  },
];
