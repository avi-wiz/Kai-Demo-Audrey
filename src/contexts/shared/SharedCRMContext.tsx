'use client';

import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import type { WizOrderTask, WizOrderLead, WizOrderDeal, SharedTask, SharedLead } from '@/lib/types';
import { TASKS as AUDREY_TASKS, LEADS as AUDREY_LEADS, DEALS as AUDREY_DEALS } from '@/data/audreys';

const RAW = {
  tasks: AUDREY_TASKS as unknown as WizOrderTask[],
  leads: AUDREY_LEADS as unknown as WizOrderLead[],
  deals: AUDREY_DEALS as unknown as WizOrderDeal[],
};

interface SharedCRMState {
  existingTasks: WizOrderTask[];
  kaiCreatedTasks: SharedTask[];
  addTask: (task: SharedTask) => void;
  allTasks: WizOrderTask[];

  existingLeads: WizOrderLead[];
  kaiCreatedLeads: SharedLead[];
  addLead: (lead: SharedLead) => void;
  updateLeadStage: (leadId: string, newStage: string) => void;
  archiveLead: (leadId: string) => void;
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
  const [kaiCreatedLeads, setKaiCreatedLeads] = useState<SharedLead[]>([]);
  const [leadStageOverrides, setLeadStageOverrides] = useState<Record<string, string>>({});
  const [archivedLeadIds, setArchivedLeadIds] = useState<Set<string>>(new Set());

  const addTask = (task: SharedTask) =>
    setKaiCreatedTasks(prev => [task, ...prev]);

  const addLead = (lead: SharedLead) =>
    setKaiCreatedLeads(prev => [lead, ...prev]);

  const updateLeadStage = (leadId: string, newStage: string) =>
    setLeadStageOverrides(prev => ({ ...prev, [leadId]: newStage }));

  const archiveLead = (leadId: string) =>
    setArchivedLeadIds(prev => {
      const next = new Set(prev);
      next.add(leadId);
      return next;
    });

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

  const allLeads = useMemo(() => {
    const kaiItems: WizOrderLead[] = kaiCreatedLeads
      .slice()
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .map(l => ({
        id: l.id,
        name: l.name,
        contact: l.contact,
        source: l.source,
        status: l.status,
        assignedTo: l.assignedTo,
        createdDate: new Date(l.createdAt).toISOString().split('T')[0],
        lastContact: null,
        createdByKai: true,
      }));
    const merged = [...kaiItems, ...existingLeads];
    return merged.map(l => {
      const archived = archivedLeadIds.has(l.id);
      const overriddenStatus = leadStageOverrides[l.id];
      if (!archived && !overriddenStatus) return l;
      return {
        ...l,
        status: overriddenStatus ?? l.status,
        archived: archived || undefined,
        archivedAt: archived ? new Date().toISOString() : undefined,
      };
    });
  }, [kaiCreatedLeads, existingLeads, leadStageOverrides, archivedLeadIds]);

  return (
    <SharedCRMContext.Provider value={{
      existingTasks, kaiCreatedTasks, addTask, allTasks,
      existingLeads, kaiCreatedLeads, addLead, updateLeadStage, archiveLead, allLeads,
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
