'use client';

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import type { Agent, AgentCategory, AgentStatus, AgentStoreView } from '@/lib/types';
import rawCatalog from '@/fixtures/agent-store-catalog.json';

function normalizeCatalog(): Agent[] {
  // No cart / checkout — but agents are NOT auto-activated. The user activates
  // each capability via the "Activate" CTA on its card; once activated the
  // card swaps to "Configure" and opens the per-agent config page.
  // `included` agents (bundled with WizCommerce) stay active by default.
  return rawCatalog.agents.map((a) => {
    const rawStatus = a.status as AgentStatus;
    const status: AgentStatus = rawStatus === 'included' ? 'included' : 'available';
    return {
      ...a,
      category: a.category.toLowerCase() as AgentCategory,
      status,
      connectors: a.connectors.map((c) => ({
        ...c,
        status: c.status as 'connected' | 'available' | 'unavailable',
      })),
    };
  });
}

interface AgentStoreContextValue {
  agents: Agent[];
  agentStoreView: AgentStoreView;
  selectedAgentId: string | null;
  isPurchased: (agentId: string) => boolean;
  isActivated: (agentId: string) => boolean;
  activateAgent: (agentId: string) => void;
  deactivateAgent: (agentId: string) => void;
  setAgentStoreView: (view: AgentStoreView, agentId?: string) => void;
}

const AgentStoreContext = createContext<AgentStoreContextValue | null>(null);

export function AgentStoreProvider({ children }: { children: ReactNode }) {
  const [agents, setAgents] = useState<Agent[]>(normalizeCatalog);
  const [agentStoreView, setAgentStoreViewState] = useState<AgentStoreView>('my-agents');
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);

  const isActivated = useCallback(
    (agentId: string) => {
      const a = agents.find((x) => x.id === agentId);
      return !!a && (a.status === 'purchased' || a.status === 'included');
    },
    [agents],
  );

  // Kept for backwards compat with any caller still asking about purchase.
  const isPurchased = isActivated;

  const activateAgent = useCallback((agentId: string) => {
    setAgents((prev) =>
      prev.map((a) =>
        a.id === agentId && a.status === 'available'
          ? { ...a, status: 'purchased' as AgentStatus }
          : a,
      ),
    );
  }, []);

  const deactivateAgent = useCallback((agentId: string) => {
    setAgents((prev) =>
      prev.map((a) =>
        a.id === agentId && a.status === 'purchased'
          ? { ...a, status: 'available' as AgentStatus }
          : a,
      ),
    );
  }, []);

  const setAgentStoreView = useCallback(
    (view: AgentStoreView, agentId?: string) => {
      // Library / payment / checkout-confirmation are no longer reachable;
      // collapse any incoming nav request into the canonical "my-agents".
      const collapsed: AgentStoreView =
        view === 'my-agent-config' || view === 'agent-detail' ? view : 'my-agents';
      setAgentStoreViewState(collapsed);
      setSelectedAgentId(agentId ?? null);
    },
    [],
  );

  return (
    <AgentStoreContext.Provider
      value={{
        agents,
        agentStoreView,
        selectedAgentId,
        isPurchased,
        isActivated,
        activateAgent,
        deactivateAgent,
        setAgentStoreView,
      }}
    >
      {children}
    </AgentStoreContext.Provider>
  );
}

export function useAgentStore() {
  const ctx = useContext(AgentStoreContext);
  if (!ctx) throw new Error('useAgentStore must be used inside AgentStoreProvider');
  return ctx;
}
