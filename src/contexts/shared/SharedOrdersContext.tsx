'use client';

import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import type { WizOrderOrder, SharedOrder } from '@/lib/types';
import rawOrders from '@/fixtures/wizorder-orders.json';

const INITIAL_ORDERS = (rawOrders as { orders: WizOrderOrder[] }).orders;

interface SharedOrdersState {
  existingOrders: WizOrderOrder[];
  kaiCreatedOrders: SharedOrder[];
  addOrder: (order: SharedOrder) => void;
  allOrders: WizOrderOrder[];
}

const SharedOrdersContext = createContext<SharedOrdersState | null>(null);

export function SharedOrdersProvider({ children }: { children: ReactNode }) {
  const [existingOrders] = useState<WizOrderOrder[]>(INITIAL_ORDERS);
  const [kaiCreatedOrders, setKaiCreatedOrders] = useState<SharedOrder[]>([]);

  const addOrder = (order: SharedOrder) =>
    setKaiCreatedOrders(prev => [order, ...prev]);

  const allOrders = useMemo(() => {
    const kaiItems: WizOrderOrder[] = kaiCreatedOrders
      .slice()
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .map(o => ({
        id: o.id,
        orderNumber: o.orderNumber,
        customer: o.customer,
        customerId: o.customerId,
        total: o.total,
        status: o.status,
        items: o.items,
        rep: o.rep,
        date: new Date(o.createdAt).toISOString().split('T')[0],
        createdByKai: true as const,
      }));
    return [...kaiItems, ...existingOrders];
  }, [kaiCreatedOrders, existingOrders]);

  return (
    <SharedOrdersContext.Provider value={{ existingOrders, kaiCreatedOrders, addOrder, allOrders }}>
      {children}
    </SharedOrdersContext.Provider>
  );
}

export function useSharedOrders(): SharedOrdersState {
  const ctx = useContext(SharedOrdersContext);
  if (!ctx) throw new Error('useSharedOrders must be used inside SharedOrdersProvider');
  return ctx;
}
