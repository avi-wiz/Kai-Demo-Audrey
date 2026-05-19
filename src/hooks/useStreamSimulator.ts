'use client';

import { useState, useEffect } from 'react';
import type { UseCase, FrameActions, FrameBundle, ResponseMode, ClosingText, TextOnlyActions } from '@/lib/types';
import { flattenFrames, parseFrame, type ParsedWidget } from '@/components/engine/FrameParser';
import { STREAM_WIDGET_DELAY_MS, STREAM_FRAME_PAUSE_MS, UC3_FRAME_PAUSES_MS } from '@/lib/constants';

const fixtureMap: Record<string, () => Promise<FrameBundle>> = {
  uc1: () => import('@/fixtures/uc1-customer-intel.json').then((m) => m.default as unknown as FrameBundle),
  uc2: () => import('@/fixtures/uc2-task-creation.json').then((m) => m.default as unknown as FrameBundle),
  // uc2 variant — used when user query mentions Acme so the staged form
  // pre-fills with Acme Corp data instead of the default Shaw N Solutions.
  'uc2-acme': () => import('@/fixtures/uc2-task-creation-acme.json').then((m) => m.default as unknown as FrameBundle),
  // uc2 variant — used when the task is being created from an invoice context
  // (sr-11 chip "Create task for this"). Pre-fills with INV-3382 metadata.
  'uc2-invoice': () => import('@/fixtures/uc2-task-creation-invoice.json').then((m) => m.default as unknown as FrameBundle),
  // uc2 variant — used when the task is being created from a meeting brief
  // (sr-14 chip "Create meeting tasks"). Lists action items + stages the top one.
  'uc2-brief': () => import('@/fixtures/uc2-task-creation-brief.json').then((m) => m.default as unknown as FrameBundle),
  // uc2-order: order creation flow (distinct chip group + shared-state target).
  'uc2-order': () => import('@/fixtures/uc2-order-creation.json').then((m) => m.default as unknown as FrameBundle),
  uc3: () => import('@/fixtures/uc3-multi-intent.json').then((m) => m.default as unknown as FrameBundle),
  // widget-swap follow-up: replaces CH-001 with UW-004 in a new turn
  'uc1-swap': () => import('@/fixtures/uc1-table-variant.json').then((m) => m.default as unknown as FrameBundle),
  // email draft chain
  'email-draft':   () => import('@/fixtures/email-draft.json').then((m) => m.default as unknown as FrameBundle),
  'email-shorter': () => import('@/fixtures/email-shorter.json').then((m) => m.default as unknown as FrameBundle),
  'email-handoff':         () => import('@/fixtures/email-handoff.json').then((m) => m.default as unknown as FrameBundle),
  'email-customer-notify': () => import('@/fixtures/email-customer-notify.json').then((m) => m.default as unknown as FrameBundle),
  'email-handoff-casual':         () => import('@/fixtures/email-handoff-casual.json').then((m) => m.default as unknown as FrameBundle),
  'email-customer-notify-casual': () => import('@/fixtures/email-customer-notify-casual.json').then((m) => m.default as unknown as FrameBundle),
  'email-report-summary':         () => import('@/fixtures/email-report-summary.json').then((m) => m.default as unknown as FrameBundle),
  // sr/ad capability groups
  'sr2-reorder':   () => import('@/fixtures/sr2-reorder.json').then((m) => m.default as unknown as FrameBundle),
  'sr2-compare':   () => import('@/fixtures/sr2-compare.json').then((m) => m.default as unknown as FrameBundle),
  'sr11-invoice':  () => import('@/fixtures/sr11-invoice.json').then((m) => m.default as unknown as FrameBundle),
  'sr14-brief':    () => import('@/fixtures/sr14-brief.json').then((m) => m.default as unknown as FrameBundle),
  'sr20-outreach': () => import('@/fixtures/sr20-outreach.json').then((m) => m.default as unknown as FrameBundle),
  'ad1-approval':  () => import('@/fixtures/ad1-approval.json').then((m) => m.default as unknown as FrameBundle),
  'ad1-approved':  () => import('@/fixtures/ad1-approved.json').then((m) => m.default as unknown as FrameBundle),
  'ad1-flagged':   () => import('@/fixtures/ad1-flagged.json').then((m) => m.default as unknown as FrameBundle),
  'ad3-handoff':   () => import('@/fixtures/ad3-handoff.json').then((m) => m.default as unknown as FrameBundle),
  'ad17-report':   () => import('@/fixtures/ad17-report.json').then((m) => m.default as unknown as FrameBundle),
  'ad29-workflow': () => import('@/fixtures/ad29-workflow.json').then((m) => m.default as unknown as FrameBundle),
  'ad29-test':     () => import('@/fixtures/ad29-test.json').then((m) => m.default as unknown as FrameBundle),
};

const textOnlyFixtureMap: Record<string, () => Promise<FrameBundle>> = {
  uc1: () => import('@/fixtures/uc1-text-only.json').then((m) => m.default as unknown as FrameBundle),
  uc2: () => import('@/fixtures/uc2-text-only.json').then((m) => m.default as unknown as FrameBundle),
  uc3: () => import('@/fixtures/uc3-text-only.json').then((m) => m.default as unknown as FrameBundle),
  'sr2-reorder':   () => import('@/fixtures/sr2-reorder-text-only.json').then((m) => m.default as unknown as FrameBundle),
  'sr11-invoice':  () => import('@/fixtures/sr11-invoice-text-only.json').then((m) => m.default as unknown as FrameBundle),
  'sr14-brief':    () => import('@/fixtures/sr14-brief-text-only.json').then((m) => m.default as unknown as FrameBundle),
  'sr20-outreach': () => import('@/fixtures/sr20-outreach-text-only.json').then((m) => m.default as unknown as FrameBundle),
  'ad1-approval':  () => import('@/fixtures/ad1-approval-text-only.json').then((m) => m.default as unknown as FrameBundle),
  'ad3-handoff':   () => import('@/fixtures/ad3-handoff-text-only.json').then((m) => m.default as unknown as FrameBundle),
  'ad17-report':   () => import('@/fixtures/ad17-report-text-only.json').then((m) => m.default as unknown as FrameBundle),
  'ad29-workflow': () => import('@/fixtures/ad29-workflow-text-only.json').then((m) => m.default as unknown as FrameBundle),
};

// Per-use-case inter-frame pause overrides. Key = frame index (0-based),
// value = ms to wait after that frame's last widget before emitting the next frame.
const framePauseOverrides: Partial<Record<string, Record<number, number>>> = {
  uc3: UC3_FRAME_PAUSES_MS,
};

export interface StreamSimulatorResult {
  widgets: ParsedWidget[];
  isStreaming: boolean;
  frameActions: FrameActions | null;
  closingText: ClosingText | null;
  textOnlyActions: TextOnlyActions | null;
}

import type { PersonalityId } from '@/lib/types';

const CLOSING_TEXT_VARIANTS: Record<string, Record<PersonalityId, ClosingText>> = {
  uc1: {
    professional: { type: 'insight', text: 'Revenue up 12% QoQ. 4 tasks on track. Renewal due Q3. Recommend scheduling check-in.' },
    friendly:     { type: 'insight', text: "Great news on Acme Corp! Revenue's climbing steadily — up 12% this quarter. All 4 tasks are moving along nicely. Maybe worth a quick check-in call before the Q3 renewal comes up? 😊" },
    executive:    { type: 'insight', text: 'Acme Corp: strong trajectory. Revenue +12% QoQ signals expansion readiness. Recommend pre-renewal engagement to upsell premium tier. Risk: none flagged.' },
  },
  uc2: {
    professional: { type: 'description', text: 'Task staged. Fields pre-filled from Lead record. Confirm to execute.' },
    friendly:     { type: 'description', text: "I've got the task all set up for Shaw N Solutions! Everything's filled in based on their Lead record. Take a look and hit confirm when you're ready — or let me know if anything needs tweaking." },
    executive:    { type: 'description', text: 'Follow-up task staged for Shaw N Solutions. Recommend confirming to maintain pipeline velocity. No blockers identified.' },
  },
  uc3: {
    professional: { type: 'question', text: 'Revenue data retrieved. Follow-up task staged. Two independent actions — confirm task separately.' },
    friendly:     { type: 'question', text: "Here's everything in one shot! Revenue's looking healthy, and I've staged a follow-up task below. You can confirm the task whenever you're ready — it won't affect the revenue display above. Want me to dig into anything else?" },
    executive:    { type: 'question', text: 'Dual-intent execution complete. Revenue trend confirms growth thesis. Follow-up task staged to maintain momentum. Recommend: confirm task, then schedule strategic review.' },
  },
};

export function useStreamSimulator(
  useCase:
    | UseCase
    | 'uc1-swap'
    | 'uc2-restage'
    | 'uc2-order'
    | 'docs-qa'
    | 'email-draft'
    | 'email-shorter'
    | 'sr2-reorder'
    | 'sr2-compare'
    | 'sr11-invoice'
    | 'sr14-brief'
    | 'sr20-outreach'
    | 'ad1-approval'
    | 'ad1-approved'
    | 'ad1-flagged'
    | 'ad3-handoff'
    | 'ad17-report'
    | 'ad29-workflow'
    | 'ad29-test'
    | null,
  turnId: string,
  responseMode: ResponseMode = 'text-widget',
  personalityId: PersonalityId = 'friendly',
  userQuery?: string,
): StreamSimulatorResult {
  // For uc2: when the user's query mentions Acme, swap in the Acme-prefilled
  // fixture variant. Variant only affects the standard (text-widget) map;
  // text-only mode still uses the canonical Shaw N Solutions fixture.
  const effectiveUseCase: typeof useCase | 'uc2-acme' | 'uc2-invoice' | 'uc2-brief' | 'email-handoff' | 'email-customer-notify' | 'email-handoff-casual' | 'email-customer-notify-casual' | 'email-report-summary' = (() => {
    if (useCase === 'email-shorter' && responseMode !== 'text-only' && userQuery) {
      const q = userQuery.toLowerCase();
      if (q.includes('__handoff__')) return 'email-handoff-casual';
      if (q.includes('__customernotify__')) return 'email-customer-notify-casual';
    }
    if (useCase === 'email-draft' && responseMode !== 'text-only' && userQuery) {
      const q = userQuery.toLowerCase();
      if (q.includes('handoff email')) return 'email-handoff';
      if ((q.includes('notification') || q.includes('notify')) && (q.includes('new rep') || q.includes('affected customers'))) return 'email-customer-notify';
      if (q.includes('report summary') || (q.includes('report') && q.includes('leadership'))) return 'email-report-summary';
    }
    if (useCase !== 'uc2' || responseMode === 'text-only' || !userQuery) return useCase;
    if (/invoice/i.test(userQuery)) return 'uc2-invoice';
    if (/from this brief|action items from/i.test(userQuery)) return 'uc2-brief';
    if (/acme/i.test(userQuery)) return 'uc2-acme';
    return useCase;
  })();
  const [widgets, setWidgets] = useState<ParsedWidget[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [frameActions, setFrameActions] = useState<FrameActions | null>(null);
  const [closingText, setClosingText] = useState<ClosingText | null>(null);
  const [textOnlyActions, setTextOnlyActions] = useState<TextOnlyActions | null>(null);

  useEffect(() => {
    if (!effectiveUseCase || effectiveUseCase === 'unknown') {
      setWidgets([]);
      setIsStreaming(false);
      setFrameActions(null);
      setClosingText(null);
      setTextOnlyActions(null);
      return;
    }

    // uc1-swap always uses the standard fixture map (no text-only variant)
    const map = (responseMode === 'text-only' && effectiveUseCase !== 'uc1-swap') ? textOnlyFixtureMap : fixtureMap;
    if (!map[effectiveUseCase]) {
      setWidgets([]);
      setIsStreaming(false);
      return;
    }

    let cancelled = false;
    const timers: ReturnType<typeof setTimeout>[] = [];

    setWidgets([]);
    setFrameActions(null);
    setClosingText(null);
    setTextOnlyActions(null);
    setIsStreaming(true);

    map[effectiveUseCase]().then((bundle) => {
      if (cancelled) return;
      const frames = flattenFrames(bundle);
      const pauses = framePauseOverrides[effectiveUseCase] ?? {};

      const schedule: { widget: ParsedWidget; delayMs: number }[] = [];
      let cursor = 0;

      frames.forEach((frame, frameIndex) => {
        const parsed = parseFrame(frame, frameIndex);
        parsed.forEach((widget) => {
          schedule.push({ widget: { ...widget, key: `${turnId}:${widget.key}` }, delayMs: cursor });
          cursor += STREAM_WIDGET_DELAY_MS;
        });
        if (frameIndex < frames.length - 1) {
          cursor += pauses[frameIndex] ?? STREAM_FRAME_PAUSE_MS;
        }
      });

      const lastFrame = frames[frames.length - 1];
      if (lastFrame.actions) setFrameActions(lastFrame.actions);
      if (lastFrame.textOnlyActions) setTextOnlyActions(lastFrame.textOnlyActions);
      // Persona variant overrides fixture closingText for uc1/uc2/uc3.
      // uc2-acme reuses uc2's persona variants. uc2-order has no persona
      // variant entry, so it falls through to its fixture closingText.
      // uc2-acme reuses uc2's persona variants. uc2-invoice keeps the fixture's
      // own closingText (which references the invoice) instead of falling back
      // to the generic uc2 persona text.
      const variantKey: string | null =
        effectiveUseCase === 'uc2-acme'
          ? 'uc2'
          : effectiveUseCase === 'uc2-invoice' || effectiveUseCase === 'uc2-brief'
            ? null
            : (effectiveUseCase as string);
      const variantMap = variantKey ? CLOSING_TEXT_VARIANTS[variantKey] : undefined;
      if (variantMap) {
        setClosingText(variantMap[personalityId] ?? variantMap.friendly);
      } else if (lastFrame.closingText) {
        setClosingText(lastFrame.closingText);
      }

      schedule.forEach(({ widget, delayMs }) => {
        const t = setTimeout(() => {
          if (cancelled) return;
          setWidgets((prev) => [...prev, widget]);
        }, delayMs);
        timers.push(t);
      });

      const lastDelay = schedule[schedule.length - 1]?.delayMs ?? 0;
      timers.push(setTimeout(() => {
        if (!cancelled) setIsStreaming(false);
      }, lastDelay + STREAM_WIDGET_DELAY_MS));
    });

    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
  }, [effectiveUseCase, responseMode, personalityId, turnId]);

  return { widgets, isStreaming, frameActions, closingText, textOnlyActions };
}
