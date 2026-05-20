export type ProductBucket =
  | 'spring_summer'
  | 'garden_outdoor'
  | 'july_release'
  | 'featured_collections'
  | 'sale_clearance'
  | 'atlanta_top_sellers'
  | 'fall_holdovers';

export interface AudreyProduct {
  sku: string;
  upc: string | null;
  name: string;
  description: string;
  retail_price: number;
  wholesale_price: number;
  msrp: number | null;
  available_qty: number;
  case_qty: number;
  min_order_qty: number;
  uom: string | null;
  is_new: boolean;
  is_featured: boolean;
  stock_status: string | null;
  division: string[];
  sub_division: string[];
  category: string[];
  group: string[];
  collections: string[];
  materials: string[];
  dimensions: string[];
  pack: string[];
  sold_as: string[];
  unit_price: string[];
  image_urls: string[];
  image_urls_by_size: {
    medium: string[];
    large: string[];
    original: string[];
  } | null;
  bucket: ProductBucket;
  is_hero: boolean;
}

export interface AudreyCollection {
  name: string;
  sku_count: number;
  sample_skus: string[];
  is_featured: boolean;
}
