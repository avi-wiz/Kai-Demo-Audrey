'use client';

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import type { WizOrderPageName, PageContextData, ActionChip, ProactiveBrief } from '@/lib/types';
import actionChipsRaw from '@/fixtures/action-chips-map.json';
import briefGeneral from '@/fixtures/proactive-brief-general.json';
import briefOrders from '@/fixtures/proactive-brief-orders.json';
import briefCustomers from '@/fixtures/proactive-brief-customers.json';
import briefProducts from '@/fixtures/proactive-brief-products.json';
import briefCrm from '@/fixtures/proactive-brief-crm.json';

// ── Static maps loaded once ───────────────────────────────────────────────────

const PAGE_CHIPS = (actionChipsRaw as { pageChips: Record<string, ActionChip[]> }).pageChips;

const BRIEF_MAP: Record<WizOrderPageName, ProactiveBrief> = {
  orders: briefOrders as unknown as ProactiveBrief,
  customers: briefCustomers as unknown as ProactiveBrief,
  products: briefProducts as unknown as ProactiveBrief,
  crm: briefCrm as unknown as ProactiveBrief,
  dashboard: briefGeneral as unknown as ProactiveBrief,
};

const STARTER_MAP: Record<WizOrderPageName, string[]> = {
  orders: [
    'Show me all pre-book orders',
    'Which orders shipped this week?',
    'Any orders pending confirmation?',
    'Revenue by customer this month',
  ],
  customers: [
    "How's Magnolia Home & Garden doing?",
    'Which accounts are at risk?',
    'Show me my top customers by revenue',
    'Draft re-engagement for dormant accounts',
  ],
  products: [
    "How's our July 2026 release pacing?",
    'Show me Featured Collections inventory',
    'Which SKUs are in PhaseOut?',
    'Top-selling birdhouses this quarter',
  ],
  crm: [
    'Show me overdue tasks',
    "What's the status of my leads?",
    'Move Verdant Home to Won',
    'Create a task for Wildflower Market',
  ],
  dashboard: [
    'What needs my attention today?',
    "Show me this week's revenue breakdown",
    "How's the July release pacing?",
    'Any overdue tasks?',
  ],
};

// ── Context interface ─────────────────────────────────────────────────────────

interface PageContextValue {
  currentPage: WizOrderPageName | null;
  pageData: Record<string, unknown>;
  pageActions: ActionChip[];
  starterPrompts: string[];
  proactiveBrief: ProactiveBrief;
  setPage: (page: WizOrderPageName, data?: Record<string, unknown>) => void;
  clearPage: () => void;
}

const PageContext = createContext<PageContextValue | null>(null);

// ── Provider ──────────────────────────────────────────────────────────────────

export function PageContextProvider({ children }: { children: ReactNode }) {
  const [currentPage, setCurrentPage] = useState<WizOrderPageName | null>(null);
  const [pageData, setPageData] = useState<Record<string, unknown>>({});

  const setPage = useCallback(
    (page: WizOrderPageName, data: Record<string, unknown> = {}) => {
      setCurrentPage(page);
      setPageData(data);
    },
    []
  );

  const clearPage = useCallback(() => {
    setCurrentPage(null);
    setPageData({});
  }, []);

  const pageActions: ActionChip[] = currentPage ? (PAGE_CHIPS[currentPage] ?? []) : [];
  const starterPrompts: string[] = currentPage ? (STARTER_MAP[currentPage] ?? []) : [];
  const proactiveBrief: ProactiveBrief = currentPage
    ? BRIEF_MAP[currentPage]
    : (briefGeneral as unknown as ProactiveBrief);

  return (
    <PageContext.Provider
      value={{
        currentPage,
        pageData,
        pageActions,
        starterPrompts,
        proactiveBrief,
        setPage,
        clearPage,
      }}
    >
      {children}
    </PageContext.Provider>
  );
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function usePageContext(): PageContextValue {
  const ctx = useContext(PageContext);
  if (!ctx) throw new Error('usePageContext must be used inside PageContextProvider');
  return ctx;
}
