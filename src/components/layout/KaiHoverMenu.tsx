'use client';

import { useLayout } from '@/contexts/LayoutContext';
import { useConversation } from '@/contexts/ConversationContext';
import { useChatSession } from '@/contexts/ChatSessionContext';
import { useAgentStore } from '@/contexts/AgentStoreContext';
import SidebarNavItem, { type SubMenuItem } from './SidebarNavItem';
import type { ViewRoute } from '@/lib/types';

interface NavEntry {
  icon: string;
  label: string;
  viewRoute: ViewRoute;
  submenuItems?: SubMenuItem[];
}

interface KaiHoverMenuProps {
  onNavigate?: () => void;
  collapsed?: boolean;
}

export default function KaiHoverMenu({ onNavigate, collapsed = false }: KaiHoverMenuProps = {}) {
  const { currentView, setView } = useLayout();
  const { clearMessages } = useConversation();
  const { requestSaveAndReset } = useChatSession();
  const { setAgentStoreView } = useAgentStore();

  function navigate(view: ViewRoute) {
    setView(view);
    onNavigate?.();
  }

  function newChat() {
    clearMessages();
    requestSaveAndReset();
    onNavigate?.();
  }

  function goAgentStore(subView: 'library' | 'my-agents') {
    setAgentStoreView(subView);
    setView('agent-store');
    onNavigate?.();
  }

  const NAV: NavEntry[] = [
    {
      icon: '✦',
      label: 'New Chat',
      viewRoute: 'chat',
    },
    {
      icon: '🕐',
      label: 'History',
      viewRoute: 'history',
    },
    {
      icon: '📌',
      label: 'My Artifacts',
      viewRoute: 'artifacts',
    },
    {
      icon: '📖',
      label: 'Docs',
      viewRoute: 'docs',
    },
    {
      icon: '🤖',
      label: 'Agent Store',
      viewRoute: 'agent-store',
      submenuItems: [
        {
          icon: '🏪',
          label: 'Agent Library',
          viewRoute: 'agent-store',
          onClick: () => goAgentStore('library'),
        },
        {
          icon: '⚡',
          label: 'My Agents',
          viewRoute: 'agent-store',
          onClick: () => goAgentStore('my-agents'),
        },
      ],
    },
    {
      icon: '⚙️',
      label: 'Settings',
      viewRoute: 'settings',
      submenuItems: [
        {
          icon: '🎭',
          label: 'Personas',
          viewRoute: 'settings',
          onClick: () => navigate('settings'),
        },
      ],
    },
    {
      icon: '🛠',
      label: 'Admin',
      viewRoute: 'admin/dashboard',
      submenuItems: [
        {
          icon: '📊',
          label: 'Dashboard',
          viewRoute: 'admin/dashboard',
          onClick: () => navigate('admin/dashboard'),
        },
        {
          icon: '🔮',
          label: 'Add Your Models',
          viewRoute: 'admin/models',
          onClick: () => navigate('admin/models'),
        },
        {
          icon: '👤',
          label: 'User Preferences',
          viewRoute: 'admin/prefs',
          onClick: () => navigate('admin/prefs'),
        },
      ],
    },
  ];

  return (
    <div className="flex flex-col gap-1">
      {NAV.map((entry) => {
        const isNewChat = entry.viewRoute === 'chat' && entry.label === 'New Chat';
        const hasSubmenu = Boolean(entry.submenuItems?.length);
        const isActive = !isNewChat && currentView === entry.viewRoute;

        return (
          <SidebarNavItem
            key={entry.label}
            icon={entry.icon}
            label={entry.label}
            viewRoute={entry.viewRoute}
            isActive={isActive}
            hasSubmenu={hasSubmenu}
            submenuItems={entry.submenuItems}
            collapsed={collapsed}
            onClick={isNewChat ? newChat : () => navigate(entry.viewRoute)}
          />
        );
      })}
    </div>
  );
}
