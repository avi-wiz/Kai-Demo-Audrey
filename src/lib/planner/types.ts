import type { ToolName } from './tools/index';
import type { WidgetType } from './widget_catalog';

export interface PlanStep {
  tool: ToolName;
  args: Record<string, unknown>;
  bindTo: string;
}

export interface PlanWidget {
  widgetType: WidgetType;
  dataFrom: string;
  transform?: {
    pick?: string[];
    rename?: Record<string, string>;
  };
  config?: Record<string, unknown>;
  highlights?: Array<{
    type: 'urgent' | 'warning' | 'positive' | 'info';
    message: string;
    fieldPath: string;
  }>;
}

export interface Plan {
  reasoning: string;
  steps: PlanStep[];
  widgets: PlanWidget[];
  closingTextHint: string | null;
  emptyResultInsight?: boolean;
}

export interface PlannerRunLog {
  query: string;
  ir: Plan;
  toolResults: Record<string, unknown>;
  frame: unknown;
  latencyMs: number;
}
