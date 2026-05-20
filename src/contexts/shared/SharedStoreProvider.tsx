'use client';

import type { ReactNode } from 'react';
import { SharedOrdersProvider } from './SharedOrdersContext';
import { SharedCustomersProvider } from './SharedCustomersContext';
import { SharedCRMProvider } from './SharedCRMContext';
import { SharedCatalogsProvider } from './SharedCatalogsContext';

export function SharedStoreProvider({ children }: { children: ReactNode }) {
  return (
    <SharedOrdersProvider>
      <SharedCustomersProvider>
        <SharedCRMProvider>
          <SharedCatalogsProvider>
            {children}
          </SharedCatalogsProvider>
        </SharedCRMProvider>
      </SharedCustomersProvider>
    </SharedOrdersProvider>
  );
}
