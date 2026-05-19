'use client';

import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import type { WizOrderCustomer, KaiCreatedItem } from '@/lib/types';
import rawCustomers from '@/fixtures/wizorder-customers.json';

const INITIAL_CUSTOMERS = (rawCustomers as { customers: WizOrderCustomer[] }).customers;

export interface CustomerModification extends KaiCreatedItem {
  patch: Partial<WizOrderCustomer>;
}

interface SharedCustomersState {
  existingCustomers: WizOrderCustomer[];
  kaiCreatedCustomers: CustomerModification[];
  addCustomer: (mod: CustomerModification) => void;
  allCustomers: WizOrderCustomer[];
}

const SharedCustomersContext = createContext<SharedCustomersState | null>(null);

export function SharedCustomersProvider({ children }: { children: ReactNode }) {
  const [existingCustomers] = useState<WizOrderCustomer[]>(INITIAL_CUSTOMERS);
  const [kaiCreatedCustomers, setKaiCreatedCustomers] = useState<CustomerModification[]>([]);

  const addCustomer = (mod: CustomerModification) =>
    setKaiCreatedCustomers(prev => [mod, ...prev]);

  const allCustomers = useMemo(() => {
    if (kaiCreatedCustomers.length === 0) return existingCustomers;

    const latestPatchById = new Map<string, CustomerModification>();
    kaiCreatedCustomers
      .slice()
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      .forEach(m => latestPatchById.set(m.id, m));

    const modified: WizOrderCustomer[] = [];
    const untouched: WizOrderCustomer[] = [];
    for (const c of existingCustomers) {
      const m = latestPatchById.get(c.id);
      if (m) modified.push({ ...c, ...m.patch, createdByKai: true });
      else untouched.push(c);
    }
    modified.sort((a, b) => {
      const am = latestPatchById.get(a.id)!.createdAt;
      const bm = latestPatchById.get(b.id)!.createdAt;
      return new Date(bm).getTime() - new Date(am).getTime();
    });
    return [...modified, ...untouched];
  }, [kaiCreatedCustomers, existingCustomers]);

  return (
    <SharedCustomersContext.Provider value={{ existingCustomers, kaiCreatedCustomers, addCustomer, allCustomers }}>
      {children}
    </SharedCustomersContext.Provider>
  );
}

export function useSharedCustomers(): SharedCustomersState {
  const ctx = useContext(SharedCustomersContext);
  if (!ctx) throw new Error('useSharedCustomers must be used inside SharedCustomersProvider');
  return ctx;
}
