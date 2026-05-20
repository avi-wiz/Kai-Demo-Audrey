import type { AudreyProduct, AudreyCollection, ProductBucket } from './types';
import productsRaw from './audreys_products.json';
import heroesRaw from './audreys_heroes.json';
import collectionsRaw from './audreys_collections.json';

export const PRODUCTS: AudreyProduct[] = productsRaw as AudreyProduct[];
export const HEROES: AudreyProduct[] = heroesRaw as AudreyProduct[];
export const COLLECTIONS: AudreyCollection[] = collectionsRaw as AudreyCollection[];

export function byBucket(bucket: ProductBucket): AudreyProduct[] {
  return PRODUCTS.filter((p) => p.bucket === bucket);
}

export function bySku(sku: string): AudreyProduct | undefined {
  return PRODUCTS.find((p) => p.sku === sku);
}

export function byCollection(name: string): AudreyProduct[] {
  return PRODUCTS.filter((p) => p.collections.includes(name));
}

export function randomHero(): AudreyProduct {
  return HEROES[Math.floor(Math.random() * HEROES.length)];
}
