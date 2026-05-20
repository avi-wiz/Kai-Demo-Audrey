import type { ProductBucket } from '../types';

export interface SalesHistoryPoint {
  month: string; // YYYY-MM
  revenue: number;
  orders: number;
}

export interface BucketSalesTrace {
  bucket: ProductBucket;
  label: string;
  data: SalesHistoryPoint[];
}

// 12-month window: 2025-06 → 2026-05 (anchored to today = 2026-05-20)
const MONTHS = [
  '2025-06', '2025-07', '2025-08', '2025-09', '2025-10', '2025-11',
  '2025-12', '2026-01', '2026-02', '2026-03', '2026-04', '2026-05',
];

function trace(
  bucket: ProductBucket,
  label: string,
  revenues: number[],
  orders: number[],
): BucketSalesTrace {
  return {
    bucket,
    label,
    data: MONTHS.map((month, i) => ({ month, revenue: revenues[i], orders: orders[i] })),
  };
}

export const SALES_HISTORY: BucketSalesTrace[] = [
  // july_release — flat then sharp Q2 ramp into pre-book confirmations
  trace(
    'july_release',
    'July 2026 Virtual Release',
    [1800, 2100, 1900, 2400, 2200, 1700, 1500, 1900, 2400, 3200, 8400, 24600],
    [1, 1, 1, 2, 1, 1, 1, 1, 2, 3, 6, 18],
  ),
  // featured_collections — Q1-Q2 strong peak
  trace(
    'featured_collections',
    'Featured Collections',
    [9800, 11200, 10400, 12600, 13800, 11500, 9400, 15200, 18400, 22100, 28600, 34200],
    [8, 9, 8, 10, 11, 10, 8, 12, 14, 17, 22, 26],
  ),
  // sale_clearance — declining (PhaseOut clearing)
  trace(
    'sale_clearance',
    'Sale / Clearance',
    [14200, 12800, 11900, 10400, 9600, 8500, 7800, 7100, 6200, 5400, 4100, 3100],
    [9, 8, 8, 7, 6, 6, 5, 5, 4, 4, 3, 3],
  ),
  // garden_outdoor — flat with Q2 bump
  trace(
    'garden_outdoor',
    'Garden & Outdoor',
    [9100, 9400, 8900, 9200, 8700, 8400, 7900, 8600, 9100, 11200, 14400, 16100],
    [7, 7, 7, 7, 7, 6, 6, 7, 7, 9, 11, 12],
  ),
  // atlanta_top_sellers — January spike, decay through year
  trace(
    'atlanta_top_sellers',
    'Atlanta Top Sellers',
    [5200, 4800, 4100, 3600, 3100, 2700, 8400, 32400, 18600, 11200, 7400, 4200],
    [4, 4, 3, 3, 3, 2, 6, 22, 13, 8, 5, 3],
  ),
  // spring_summer — small contributor, peaks Mar-May
  trace(
    'spring_summer',
    'Spring & Summer',
    [2400, 2200, 1900, 1700, 1500, 1400, 1300, 1900, 3100, 4600, 5800, 6400],
    [2, 2, 1, 1, 1, 1, 1, 2, 2, 3, 4, 4],
  ),
  // fall_holdovers — tiny tail
  trace(
    'fall_holdovers',
    'Fall Holdovers',
    [600, 500, 700, 1200, 1800, 2400, 2100, 1400, 900, 600, 400, 300],
    [1, 1, 1, 1, 2, 2, 2, 1, 1, 1, 1, 0],
  ),
];
