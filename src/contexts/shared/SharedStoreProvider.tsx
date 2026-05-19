'use client';

import type { ReactNode } from 'react';
import { SharedOrdersProvider } from './SharedOrdersContext';
import { SharedCustomersProvider } from './SharedCustomersContext';
import { SharedCRMProvider } from './SharedCRMContext';

export function SharedStoreProvider({ children }: { children: ReactNode }) {
  return (
    <SharedOrdersProvider>
      <SharedCustomersProvider>
        <SharedCRMProvider>
          {children}
        </SharedCRMProvider>
      </SharedCustomersProvider>
    </SharedOrdersProvider>
  );
}
