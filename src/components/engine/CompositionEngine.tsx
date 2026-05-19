'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { ParsedWidget } from './FrameParser';
import { FrameActionsContext, ConsentHandlersContext, type ConsentHandlers } from './FrameParser';
import SaveArtifactButton from '@/components/widgets/actions/SaveArtifactButton';
import SaveArtifactModal from '@/components/modals/SaveArtifactModal';

const SAVEABLE_WIDGET_TYPES = new Set(['CH-001', 'UW-004', 'UW-030']);

// Widgets we render on-screen but want excluded from PNG snapshots:
// UW-014 (AgentReasoningCard) is conversational scaffolding; AW-001
// (DeepLinkButton) is an interactive CTA.
const SNAPSHOT_IGNORE_WIDGET_TYPES = new Set(['UW-014', 'AW-001']);

function SaveableWrapper({ w }: { w: ParsedWidget }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [hovered, setHovered] = useState(false);
  const title =
    (w.data as Record<string, unknown>)?.title as string | undefined ?? w.widgetType;

  return (
    <div
      style={{ position: 'relative' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <w.Component data={w.data} config={w.config} highlights={w.highlights} />
      <div style={{ position: 'absolute', inset: 0, pointerEvents: hovered ? 'auto' : 'none' }}>
        <SaveArtifactButton isVisible={hovered} onClick={() => setModalOpen(true)} />
      </div>
      {modalOpen && (
        <SaveArtifactModal
          widgetType={w.widgetType}
          defaultTitle={title}
          data={w.data as Record<string, unknown>}
          config={w.config as Record<string, unknown> | undefined}
          onClose={() => setModalOpen(false)}
        />
      )}
    </div>
  );
}

export interface CompositionEngineProps {
  widgets: ParsedWidget[];
  staggerDelay?: number;
  entranceDuration?: number;
  streaming?: boolean;
  className?: string;
  consentHandlers?: ConsentHandlers;
}

export function WidgetEntrance({
  delayMs,
  durationMs,
  children,
  snapshotIgnore,
}: {
  delayMs: number;
  durationMs: number;
  children: ReactNode;
  snapshotIgnore?: boolean;
}) {
  return (
    <div
      className="kai-entrance"
      data-snapshot-ignore={snapshotIgnore ? 'true' : undefined}
      style={{
        animationDuration: `${durationMs}ms`,
        animationDelay: `${delayMs}ms`,
      }}
    >
      {children}
    </div>
  );
}

// Group widgets into frame-aligned slices (preserving order) for context boundaries.
function groupByFrame(
  widgets: ParsedWidget[]
): Array<{ frameId: string; actions: ParsedWidget['actions']; items: ParsedWidget[] }> {
  const groups: ReturnType<typeof groupByFrame> = [];
  for (const w of widgets) {
    const last = groups[groups.length - 1];
    if (last && last.frameId === w.frameId) {
      last.items.push(w);
    } else {
      groups.push({ frameId: w.frameId, actions: w.actions, items: [w] });
    }
  }
  return groups;
}

export function CompositionEngine({
  widgets,
  staggerDelay = 200,
  entranceDuration = 400,
  streaming = true,
  className,
  consentHandlers,
}: CompositionEngineProps) {
  const seenKeys = useRef<Set<string>>(new Set());
  const containerRef = useRef<HTMLDivElement>(null);

  // Compute per-widget delay: new widgets stagger in, already-seen ones get 0.
  const delayMap = new Map<string, number>();
  let newIndex = 0;
  for (const w of widgets) {
    if (!streaming || !seenKeys.current.has(w.key)) {
      delayMap.set(w.key, newIndex * staggerDelay);
      newIndex++;
    } else {
      delayMap.set(w.key, 0);
    }
  }

  // Smooth scroll to the bottom of the container when widgets are added
  useEffect(() => {
    if (widgets.length > 0 && containerRef.current) {
      // Find the last widget element and scroll it into view
      const elements = containerRef.current.querySelectorAll('.kai-entrance');
      if (elements.length > 0) {
        const lastElement = elements[elements.length - 1];
        lastElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }, [widgets.length]);

  // Mark current widgets as seen and prune old ones in an effect, not during render.
  useEffect(() => {
    const currentKeys = new Set(widgets.map((w) => w.key));
    
    // Prune seen keys that are no longer in the widget list (e.g. chat cleared).
    for (const k of seenKeys.current) {
      if (!currentKeys.has(k)) seenKeys.current.delete(k);
    }
    
    // Mark all current widgets as seen for the NEXT render.
    for (const w of widgets) {
      seenKeys.current.add(w.key);
    }
  }, [widgets]);

  const groups = groupByFrame(widgets);

  console.log('[CompositionEngine] rendering', widgets.length, 'widgets across', groups.length, 'frames');

  if (widgets.length === 0) {
    return <div className={className} />;
  }

  return (
    <div ref={containerRef} className={`flex flex-col gap-4 message-slide-in-left ${className ?? ''}`}>
      {groups.map((group) => (
        <FrameActionsContext.Provider key={group.frameId} value={group.actions}>
          <ConsentHandlersContext.Provider value={consentHandlers}>
            {group.items.map((w) => {
              console.log('[CompositionEngine] rendering widget:', w.widgetType, w.key);
              return (
                <WidgetEntrance
                  key={w.key}
                  delayMs={delayMap.get(w.key) ?? 0}
                  durationMs={entranceDuration}
                  snapshotIgnore={SNAPSHOT_IGNORE_WIDGET_TYPES.has(w.widgetType)}
                >
                  {SAVEABLE_WIDGET_TYPES.has(w.widgetType)
                    ? <SaveableWrapper w={w} />
                    : <w.Component data={w.data} config={w.config} highlights={w.highlights} />
                  }
                </WidgetEntrance>
              );
            })}
          </ConsentHandlersContext.Provider>
        </FrameActionsContext.Provider>
      ))}
    </div>
  );
}

export default CompositionEngine;
