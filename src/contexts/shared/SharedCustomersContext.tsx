'use client';

import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import type { WizOrderCustomer, KaiCreatedItem } from '@/lib/types';
import { CUSTOMERS as AUDREY_CUSTOMERS } from '@/data/audreys';

const INITIAL_CUSTOMERS: WizOrderCustomer[] = AUDREY_CUSTOMERS;

export interface CustomerModification extends KaiCreatedItem {
  patch: Partial<WizOrderCustomer>;
}

export interface NewCustomerInput extends WizOrderCustomer {
  createdAt?: string;
}

type AddCustomerInput = CustomerModification | NewCustomerInput;

interface SharedCustomersState {
  existingCustomers: WizOrderCustomer[];
  kaiCreatedCustomers: CustomerModification[];
  kaiNewCustomers: WizOrderCustomer[];
  addCustomer: (input: AddCustomerInput) => void;
  allCustomers: WizOrderCustomer[];
}

const SharedCustomersContext = createContext<SharedCustomersState | null>(null);

function isPatchMod(input: AddCustomerInput): input is CustomerModification {
  return 'patch' in input && typeof (input as CustomerModification).patch === 'object';
}

export function SharedCustomersProvider({ children }: { children: ReactNode }) {
  const [existingCustomers] = useState<WizOrderCustomer[]>(INITIAL_CUSTOMERS);
  const [kaiCreatedCustomers, setKaiCreatedCustomers] = useState<CustomerModification[]>([]);
  const [kaiNewCustomers, setKaiNewCustomers] = useState<WizOrderCustomer[]>([]);

  const addCustomer = (input: AddCustomerInput) => {
    if (isPatchMod(input)) {
      setKaiCreatedCustomers(prev => [input, ...prev]);
    } else {
      setKaiNewCustomers(prev => [{ ...input, createdByKai: true }, ...prev]);
    }
  };

  const allCustomers = useMemo(() => {
    const patchByIdLatest = new Map<string, CustomerModification>();
    kaiCreatedCustomers
      .slice()
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      .forEach(m => patchByIdLatest.set(m.id, m));

    // Build a set of new-customer ids so we can suppress the original synthetic
    // record when a NewCustomerInput collides on id (e.g. Cap 4 merge promotes
    // C-8050 to an active customer — we want the new record to replace, not
    // duplicate, the inactive synthetic C-8050).
    const newCustomerIds = new Set(kaiNewCustomers.map(c => c.id));

    const modified: WizOrderCustomer[] = [];
    const untouched: WizOrderCustomer[] = [];
    for (const c of existingCustomers) {
      if (newCustomerIds.has(c.id)) continue; // shadowed by a NewCustomerInput
      const m = patchByIdLatest.get(c.id);
      if (m) modified.push({ ...c, ...m.patch, createdByKai: true });
      else untouched.push(c);
    }
    modified.sort((a, b) => {
      const am = patchByIdLatest.get(a.id)!.createdAt;
      const bm = patchByIdLatest.get(b.id)!.createdAt;
      return new Date(bm).getTime() - new Date(am).getTime();
    });

    return [...kaiNewCustomers, ...modified, ...untouched];
  }, [kaiCreatedCustomers, kaiNewCustomers, existingCustomers]);

  return (
    <SharedCustomersContext.Provider value={{ existingCustomers, kaiCreatedCustomers, kaiNewCustomers, addCustomer, allCustomers }}>
      {children}
    </SharedCustomersContext.Provider>
  );
}

export function useSharedCustomers(): SharedCustomersState {
  const ctx = useContext(SharedCustomersContext);
  if (!ctx) throw new Error('useSharedCustomers must be used inside SharedCustomersProvider');
  return ctx;
}
