import { createContext } from 'react';
import type { Frame, FrameBundle, FrameActions, WidgetHighlight } from '@/lib/types';
export type { WidgetHighlight };
import { resolveWidget, type WidgetComponent } from './ComponentRegistry';

export const FrameActionsContext = createContext<FrameActions | undefined>(
  undefined
);

export interface ConsentHandlers {
  onConfirm: () => void;
  onEdit: () => void;
  onCancel: () => void;
  onResetEdit: () => void;
  isConfirming: boolean;
}

export const ConsentHandlersContext = createContext<ConsentHandlers | undefined>(
  undefined
);

export interface WidgetActionHandlers {
  onSaveAsDashboard?: () => void;
  /** ClarificationCard (AW-006): user confirmed a subset of the candidates. */
  onClarificationConfirm?: (selectedLabels: string[]) => void;
  /** ClarificationCard (AW-006): user dismissed without choosing. */
  onClarificationCancel?: () => void;
}

export const WidgetActionContext = createContext<WidgetActionHandlers | undefined>(
  undefined
);

export interface ParsedWidget {
  key: string;
  widgetType: string;
  Component: WidgetComponent;
  data: Record<string, unknown>;
  config?: Record<string, unknown>;
  highlights?: WidgetHighlight[];
  frameId: string;
  frameType: Frame['frameType'];
  branchId?: string;
  actions?: FrameActions;
}

export function flattenFrames(bundle: FrameBundle): Frame[] {
  if ('frames' in bundle) return bundle.frames;
  return [bundle as Frame];
}

export function parseFrame(frame: Frame, frameIndex: number): ParsedWidget[] {
  const parsed = frame.widgets.map((widget, i) => ({
    key: `${frameIndex}:${frame.frameId}:${i}:${widget.widgetType}`,
    widgetType: widget.widgetType,
    Component: resolveWidget(widget.widgetType),
    data: widget.data as Record<string, unknown>,
    config: widget.config as Record<string, unknown> | undefined,
    highlights: (widget as { highlights?: WidgetHighlight[] }).highlights,
    frameId: frame.frameId,
    frameType: frame.frameType,
    branchId: frame.branchId,
    ...(frame.actions ? { actions: frame.actions } : {}),
  }));
  return parsed;
}

export function parseFrameBundle(bundle: FrameBundle): ParsedWidget[] {
  const frames = flattenFrames(bundle);
  const result = frames.flatMap((frame, i) => parseFrame(frame, i));
  return result;
}
