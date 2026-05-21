import { z } from 'zod';
import { TOOL_REGISTRY } from './tools/index';
import { WIDGET_CATALOG } from './widget_catalog';

const toolNames = Object.keys(TOOL_REGISTRY) as [string, ...string[]];
const widgetTypes = Object.keys(WIDGET_CATALOG) as [string, ...string[]];

const planStepSchema = z.object({
  tool: z.enum(toolNames),
  args: z.record(z.string(), z.unknown()),
  bindTo: z.string().min(1),
});

const planWidgetSchema = z.object({
  widgetType: z.enum(widgetTypes),
  dataFrom: z.string().min(1),
  transform: z.object({
    pick: z.array(z.string()).optional(),
    rename: z.record(z.string(), z.string()).optional(),
  }).optional(),
  config: z.record(z.string(), z.unknown()).optional(),
  highlights: z.array(z.object({
    type: z.enum(['urgent', 'warning', 'positive', 'info']),
    message: z.string().optional(),
    fieldPath: z.string().optional(),
  })).optional(),
});

export const planSchema = z.object({
  reasoning: z.string(),
  steps: z.array(planStepSchema).min(1),
  widgets: z.array(planWidgetSchema).min(1).max(4),
  closingTextHint: z.string().nullable(),
  emptyResultInsight: z.boolean().optional(),
});

export type ValidatedPlan = z.infer<typeof planSchema>;
