import type { AudreyProduct } from './types';

// Switch to wholesale when B2B credentials are available
export function getDisplayPrice(product: AudreyProduct): { label: string; value: string } {
  return { label: 'MSRP', value: `$${product.retail_price.toFixed(2)}` };
}
