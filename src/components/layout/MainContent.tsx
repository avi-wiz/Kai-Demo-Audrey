'use client';

import { Suspense } from 'react';
import { useLayout } from '@/contexts/LayoutContext';
import ChatShell from '@/components/chat/ChatShell';
import HistoryView from '@/components/views/HistoryView';
import MyArtifactsView from '@/components/views/MyArtifactsView';
import DocsView from '@/components/views/DocsView';
import SettingsView from '@/components/views/SettingsView';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import ApiKeyView from '@/components/views/ApiKeyView';
import UserPreferencesView from '@/components/views/UserPreferencesView';
import AddYourModelsView from '@/components/views/AddYourModelsView';
import AgentStoreLayout from '@/components/agent-store/AgentStoreLayout';
import OrdersPage from '@/components/wizorder/OrdersPage';
import CustomersPage from '@/components/wizorder/CustomersPage';
import ProductsPage from '@/components/wizorder/ProductsPage';
import CRMPage from '@/components/wizorder/CRMPage';
import WizDashboardPage from '@/components/wizorder/WizDashboardPage';
import DashboardFullView from '@/components/dashboard-builder/DashboardFullView';
import PrebuiltDashboardsView from '@/components/views/PrebuiltDashboardsView';
import ViewArtifactView from '@/components/views/ViewArtifactView';


function ViewContent() {
  const { currentView } = useLayout();

  switch (currentView) {
    case 'chat':
      // Wrapped in Suspense because ChatShell uses useSearchParams internally
      return (
        <Suspense fallback={null}>
          <ChatShell />
        </Suspense>
      );
    case 'history':        return <HistoryView />;
    case 'artifacts':      return <MyArtifactsView />;
    case 'docs':           return <DocsView />;
    case 'settings':       return <SettingsView />;
    case 'agent-store':    return <AgentStoreLayout />;
    case 'admin/dashboard': return <DashboardLayout />;
    case 'admin/api-key':  return <ApiKeyView />;
    case 'admin/models':   return <AddYourModelsView />;
    case 'admin/prefs':    return <UserPreferencesView />;
    case 'wizorder/orders':     return <OrdersPage />;
    case 'wizorder/customers':  return <CustomersPage />;
    case 'wizorder/products':   return <ProductsPage />;
    case 'wizorder/crm':        return <CRMPage />;
    case 'wizorder/dashboard':  return <WizDashboardPage />;
    case 'dashboard-view':      return <DashboardFullView />;
    case 'reports-dashboards':  return <PrebuiltDashboardsView />;
    case 'view-artifact':       return <ViewArtifactView />;
    default:               return null;
  }
}

export default function MainContent() {
  const { currentView } = useLayout();

  return (
    <div className="flex-1 flex flex-col relative overflow-y-auto">
      <div 
        key={currentView} 
        className="flex-1 flex flex-col animate-fade-in"
      >
        <ViewContent />
      </div>
    </div>
  );
}
