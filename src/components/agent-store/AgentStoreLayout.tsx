'use client';

import { useAgentStore } from '@/contexts/AgentStoreContext';
import MyAgentsView from './MyAgentsView';
import MyAgentConfigView from './MyAgentConfigView';

// All agents are owned by default. The store now collapses into a single
// "Capabilities" surface — no library, no cart, no checkout.

export default function AgentStoreLayout() {
  const { agentStoreView } = useAgentStore();

  const view = agentStoreView === 'my-agent-config' ? <MyAgentConfigView /> : <MyAgentsView />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg)' }}>
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {view}
      </div>
    </div>
  );
}
