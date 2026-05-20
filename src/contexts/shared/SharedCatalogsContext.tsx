'use client';

import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import type { ProductCardItem } from '@/lib/types';

export interface SharedCatalog {
  id: string;
  name: string;
  recipient: string;       // Lead or customer the catalog was built for
  recipientId?: string;
  createdAt: string;
  createdByKai: true;
  items: ProductCardItem[];
  includePricing: boolean;
  includeStockLevels: boolean;
  format: string;          // "PDF" | "Digital Catalog" | "Shareable Link"
  personalNote?: string;
}

interface SharedCatalogsState {
  catalogs: SharedCatalog[];
  addCatalog: (c: SharedCatalog) => void;
}

const SharedCatalogsContext = createContext<SharedCatalogsState | null>(null);

export function SharedCatalogsProvider({ children }: { children: ReactNode }) {
  const [catalogs, setCatalogs] = useState<SharedCatalog[]>([]);

  const addCatalog = useCallback((c: SharedCatalog) => {
    setCatalogs((prev) => [c, ...prev]);
  }, []);

  return (
    <SharedCatalogsContext.Provider value={{ catalogs, addCatalog }}>
      {children}
    </SharedCatalogsContext.Provider>
  );
}

export function useSharedCatalogs(): SharedCatalogsState {
  const ctx = useContext(SharedCatalogsContext);
  if (!ctx) throw new Error('useSharedCatalogs must be used inside SharedCatalogsProvider');
  return ctx;
}
