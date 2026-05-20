export type AudreyPricelist = 'Standard Wholesale' | 'Premier' | 'Garden Center';
export type AudreyUserStatus = 'Active' | 'Pending Activation' | 'Inactive';

export interface AudreyWebsiteUser {
  id: string;
  email: string;
  name: string;
  customerId: string;
  customerName: string;
  pricelist: AudreyPricelist;
  lastLogin: string | null;
  status: AudreyUserStatus;
  createdAt: string;
}

export const WEBSITE_USERS: AudreyWebsiteUser[] = [
  {
    id: 'U-7001',
    email: 'lillian.hayes@magnoliahg.com',
    name: 'Lillian Hayes',
    customerId: 'C-8001',
    customerName: 'Magnolia Home & Garden',
    pricelist: 'Garden Center',
    lastLogin: '2026-05-19',
    status: 'Active',
    createdAt: '2024-03-12',
  },
  {
    id: 'U-7002',
    email: 'marlene@pottingshed.com',
    name: 'Marlene Whitfield',
    customerId: 'C-8002',
    customerName: 'The Potting Shed',
    pricelist: 'Premier',
    lastLogin: '2026-05-18',
    status: 'Active',
    createdAt: '2024-06-04',
  },
  {
    id: 'U-7003',
    email: 'carter@bloomandbasket.com',
    name: 'Carter Ellis',
    customerId: 'C-8003',
    customerName: 'Bloom & Basket',
    pricelist: 'Standard Wholesale',
    lastLogin: '2026-05-17',
    status: 'Active',
    createdAt: '2024-09-21',
  },
  {
    id: 'U-7004',
    email: 'wren@seasidegifts.com',
    name: 'Wren Caldwell',
    customerId: 'C-8004',
    customerName: 'Seaside Gifts',
    pricelist: 'Standard Wholesale',
    lastLogin: '2026-04-28',
    status: 'Active',
    createdAt: '2025-01-08',
  },
  {
    id: 'U-7005',
    email: 'imogen@sunflowerandsage.com',
    name: 'Imogen Park',
    customerId: 'C-8007',
    customerName: 'Sunflower & Sage',
    pricelist: 'Standard Wholesale',
    lastLogin: null,
    status: 'Pending Activation',
    createdAt: '2026-05-10',
  },
];
