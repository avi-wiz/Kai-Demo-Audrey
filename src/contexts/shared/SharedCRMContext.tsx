'use client';

import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import type { WizOrderTask, WizOrderLead, WizOrderDeal, SharedTask } from '@/lib/types';
import rawCRM from '@/fixtures/wizorder-crm.json';

const RAW = rawCRM as {
  tasks: WizOrderTask[];
  leads: WizOrderLead[];
  deals: WizOrderDeal[];
};

interface SharedCRMState {
  existingTasks: WizOrderTask[];
  kaiCreatedTasks: SharedTask[];
  addTask: (task: SharedTask) => void;
  allTasks: WizOrderTask[];

  existingLeads: WizOrderLead[];
  allLeads: WizOrderLead[];

  existingDeals: WizOrderDeal[];
  allDeals: WizOrderDeal[];
}

const SharedCRMContext = createContext<SharedCRMState | null>(null);

export function SharedCRMProvider({ children }: { children: ReactNode }) {
  const [existingTasks] = useState<WizOrderTask[]>(RAW.tasks);
  const [existingLeads] = useState<WizOrderLead[]>(RAW.leads);
  const [existingDeals] = useState<WizOrderDeal[]>(RAW.deals);
  const [kaiCreatedTasks, setKaiCreatedTasks] = useState<SharedTask[]>([]);

  const addTask = (task: SharedTask) =>
    setKaiCreatedTasks(prev => [task, ...prev]);

  const allTasks = useMemo(() => {
    const kaiItems: WizOrderTask[] = kaiCreatedTasks
      .slice()
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .map(t => ({
        id: t.id,
        title: t.title,
        customer: t.customerName ?? null,
        dueDate: t.dueDate,
        priority: t.priority,
        assignedTo: t.assignedTo,
        status: t.status,
        type: t.type,
        createdByKai: true as const,
      }));
    return [...kaiItems, ...existingTasks];
  }, [kaiCreatedTasks, existingTasks]);

  return (
    <SharedCRMContext.Provider value={{
      existingTasks, kaiCreatedTasks, addTask, allTasks,
      existingLeads, allLeads: existingLeads,
      existingDeals, allDeals: existingDeals,
    }}>
      {children}
    </SharedCRMContext.Provider>
  );
}

export function useSharedCRM(): SharedCRMState {
  const ctx = useContext(SharedCRMContext);
  if (!ctx) throw new Error('useSharedCRM must be used inside SharedCRMProvider');
  return ctx;
}
