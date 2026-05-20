import { createElement, type ComponentType } from 'react';
import type { WidgetProps } from '@/lib/types';

// UI widgets
import AgentReasoningCard from '@/components/widgets/ui/AgentReasoningCard';
import Customer360Card from '@/components/widgets/ui/Customer360Card';
import EntityDetailCard from '@/components/widgets/ui/EntityDetailCard';
import MetricCard from '@/components/widgets/ui/MetricCard';
import MetricCardRow from '@/components/widgets/ui/MetricCardRow';
import CompactList from '@/components/widgets/ui/CompactList';
import DataTable from '@/components/widgets/ui/DataTable';
import ProductCardGrid from '@/components/widgets/ui/ProductCardGrid';
import DashboardCompositeWidget from '@/components/widgets/ui/DashboardCompositeWidget';

// Chart widgets
import LineChart from '@/components/widgets/charts/LineChart';

// Action widgets
import DeepLinkButton from '@/components/widgets/actions/DeepLinkButton';
import ConfirmationDialog from '@/components/widgets/actions/ConfirmationDialog';
import MultiStepFormWizard from '@/components/widgets/actions/MultiStepFormWizard';
import ConsentBanner from '@/components/widgets/actions/ConsentBanner';
import ClarificationCard from '@/components/widgets/actions/ClarificationCard';

export type WidgetComponent = ComponentType<WidgetProps>;

export const ComponentRegistry: Record<string, WidgetComponent> = {
  'UW-014': AgentReasoningCard,
  'UW-007': Customer360Card,
  'UW-003': EntityDetailCard,
  'UW-001': MetricCard,
  'UW-002': MetricCardRow,
  'UW-011': CompactList,
  'UW-004': DataTable,
  'UW-009': ProductCardGrid,
  'CH-001': LineChart,
  'AW-001': DeepLinkButton,
  'AW-003': ConfirmationDialog,
  'AW-004': MultiStepFormWizard,
  'AW-006': ClarificationCard,
  'AW-012': ConsentBanner,
  'UW-030': DashboardCompositeWidget as unknown as WidgetComponent,
};

// Renders a dashed-border error card for any unregistered widgetType.
// Defined with createElement so this .ts file doesn't need JSX.
function makeFallback(widgetType: string): WidgetComponent {
  const Fallback: WidgetComponent = ({ data }) =>
    createElement(
      'div',
      {
        style: {
          border: '2px dashed #ef4444',
          borderRadius: '8px',
          padding: '12px',
          fontFamily: 'monospace',
          fontSize: '12px',
          color: '#ef4444',
          background: '#fff5f5',
        },
      },
      createElement('strong', null, `Unsupported widget: ${widgetType}`),
      createElement(
        'details',
        { style: { marginTop: '8px' } },
        createElement('summary', null, 'data'),
        createElement(
          'pre',
          {
            style: {
              margin: '4px 0 0',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-all',
            },
          },
          JSON.stringify(data, null, 2)
        )
      )
    );
  Fallback.displayName = `FallbackWidget(${widgetType})`;
  return Fallback;
}

const fallbackCache = new Map<string, WidgetComponent>();

export function resolveWidget(widgetType: string): WidgetComponent {
  if (ComponentRegistry[widgetType]) return ComponentRegistry[widgetType];
  if (!fallbackCache.has(widgetType)) {
    fallbackCache.set(widgetType, makeFallback(widgetType));
  }
  return fallbackCache.get(widgetType)!;
}
