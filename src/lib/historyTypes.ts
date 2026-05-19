import type { Message, WidgetHighlight, DocsQAPair } from './types';

export type HistoryTag =
  | 'Sales'
  | 'Admin Ops'
  | 'Reports & Analytics'
  | 'Email & Outreach'
  | 'Workflows'
  | 'Knowledge Base'
  | 'Dashboards'
  | 'Other';

export interface SerializedWidget {
  key: string;
  widgetType: string;
  data: Record<string, unknown>;
  config?: Record<string, unknown>;
  highlights?: WidgetHighlight[];
  frameId?: string;
  frameType?: string;
  branchId?: string;
}

export interface SerializedTurn {
  id: string;
  useCase: string;
  userQuery?: string;
  isStale?: boolean;
  widgets: SerializedWidget[];
  closingText?: { type: string; text: string };
  llmText?: string;
  workflowId?: string;
  ad17AddedMetrics?: string[];
  docsQA?: DocsQAPair;
  unknownReply?: string;
}

export interface SavedSession {
  id: string;
  title: string;
  subtext: string;
  tag: HistoryTag;
  createdAt: number;
  updatedAt: number;
  messages: Message[];
  turns: SerializedTurn[];
}
