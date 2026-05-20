'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { useLayout } from '@/contexts/LayoutContext';
import type { Message, UseCase, ResponseMode } from '@/lib/types';
import { matchQuery, getUnknownReply, matchPageContextQuery, matchDashboardQuery, matchSpecialQuery, matchSpecialCapabilityQuery } from '@/lib/queryMatcher';
import type { PageContextMatch } from '@/lib/queryMatcher';
import { extractTemplateVars, resolveChipQuery } from '@/lib/templateVars';
import { STREAM_WIDGET_DELAY_MS } from '@/lib/constants';
import { detectFollowUp } from '@/hooks/useFollowUp';
import { useDocsQA } from '@/hooks/useDocsQA';
import { useKaiGenerate } from '@/hooks/useKaiGenerate';
import { useStreamSimulator } from '@/hooks/useStreamSimulator';
import { useConsentFlow } from '@/hooks/useConsentFlow';
import { useVoice, unlockAudio } from '@/hooks/useVoice';
import type { ParsedWidget, ConsentHandlers, WidgetActionHandlers } from '@/components/engine/FrameParser';
import { WidgetActionContext, parseFrame } from '@/components/engine/FrameParser';
import { WORKFLOW_CATALOG, getWorkflow, inferWorkflowId, isVagueWorkflowRequest, type WorkflowId } from '@/lib/workflowCatalog';
import { resolveWidget } from '@/components/engine/ComponentRegistry';
import MessageBubble from './MessageBubble';
import ThinkingIndicator from './ThinkingIndicator';
import SuggestedQueries from './SuggestedQueries';
import KaiResponse from './KaiResponse';
import CanvasTextBlock from './CanvasTextBlock';
import StaleOverlay from './StaleOverlay';
import VoiceButton from './VoiceButton';
import ProactiveBriefCard from './ProactiveBriefCard';
import ActionChipsBar from './ActionChipsBar';
import { useResponseMode } from '@/contexts/ResponseModeContext';
import { usePersona } from '@/contexts/PersonaContext';
import { usePageContext } from '@/contexts/PageContext';
import { useSharedCRM } from '@/contexts/shared/SharedCRMContext';
import { useSharedCatalogs, type SharedCatalog } from '@/contexts/shared/SharedCatalogsContext';
import { useSharedOrders } from '@/contexts/shared/SharedOrdersContext';
import { useSharedCustomers } from '@/contexts/shared/SharedCustomersContext';
import { useDashboardBuilder } from '@/contexts/DashboardBuilderContext';
import { useArtifacts } from '@/contexts/ArtifactContext';
import { useUserPreferences } from '@/contexts/UserPreferencesContext';
import { useChatHistory } from '@/contexts/ChatHistoryContext';
import { useChatSession } from '@/contexts/ChatSessionContext';
import { heuristicSummary } from '@/lib/historyHeuristics';
import { summarizeSession, buildSummarizePayload } from '@/hooks/useSummarizeSession';
import type { SavedSession, SerializedTurn, SerializedWidget } from '@/lib/historyTypes';
import type { ActionChip, SharedTask, SharedOrder, SharedLead, ViewRoute, DashboardCompositeData } from '@/lib/types';
import actionChipsMapRaw from '@/fixtures/action-chips-map.json';
import SaveArtifactModal from '@/components/modals/SaveArtifactModal';
import UsageNudge from '@/components/gtm/UsageNudge';
import DownloadSnapshotButton from '@/components/gtm/DownloadSnapshotButton';
import EmailAttachmentChip from './EmailAttachmentChip';
import { resolveMetrics, METRIC_CATALOG, type MetricScope } from '@/lib/metricCatalog';
import { useNudge } from '@/contexts/NudgeContext';
import { useGuidedTour } from '@/contexts/GuidedTourContext';

const ACTION_CHIPS_MAP = actionChipsMapRaw as {
  capabilityChips: Record<string, ActionChip[]>;
  pageChips: Record<string, ActionChip[]>;
};

const USECASE_CHIP_KEY: Record<string, string> = {
  uc1:        'sr-13',
  'uc1-swap': 'sr-1',
  uc2:        'sr-1',
  'uc2-order':   'sr-1',
  'uc2-restage': 'sr-1',
  uc3:        'sr-13',
  'docs-qa':         '',
  'email-draft':     'email',
  'email-shorter':   'email',
  'dashboard-builder': 'dashboard-edit',
  'sr2-reorder':   'sr-2',
  'sr11-invoice':  'sr-11',
  'sr14-brief':    'sr-14',
  'sr20-outreach': 'sr-20',
  'ad1-approval':  'ad-1',
  'ad3-handoff':   'ad-3',
  'ad17-report':   'ad-17',
  'ad29-workflow': 'ad-29',
  // Chip-spawn useCases — terminal, no chip group
  'sr2-compare':   '',
  'ad1-approved':  '',
  'ad1-flagged':   '',
  'ad29-test':     '',
  'metric-clarification': '',
  'workflow-clarification': '',
  // Audrey vDemo — Cap 1–6 active chip groups
  'cap1-task-email':     'cap1-task-email',
  'cap1-email-draft':    'cap1-email-draft',
  'cap2-lead-creation':  'cap2-lead-creation',
  'cap3-lead-won':       'cap3-lead-won',
  'cap4-merge-customer': 'cap4-merge-customer',
  'cap5-user-creation':  'cap5-user-creation',
  'cap6-catalog-builder':'cap6-catalog-builder',
  // Audrey vDemo — chain / report useCases (terminal, no chip group)
  'cap1-task-confirmed':       '',
  'cap2-auto-task':            '',
  'cap3-conversion-confirmed': '',
  'cap4-merge-confirmed':      '',
  'cap5-user-confirmed':       '',
  'cap6-catalog-confirmed':    '',
  'report-collection-performance': '',
  'report-prebook-pacing':         '',
  'report-customer-health':        '',
  'report-pipeline':               '',
  'report-team-performance':       '',
  'report-catalog-health':         '',
  unknown:           '',
};

const MAX_CHIP_CHAIN_DEPTH = 3;

// Cap 7 report fixtures — loaded on demand so they can be rerouted through
// the V2 dashboard-builder pipeline (Edit / Save / Download).
type ReportFixture = {
  frameId?: string;
  widgets: Array<{ widgetType: string; data: Record<string, unknown>; config?: Record<string, unknown>; highlights?: unknown[] }>;
  closingText: import('@/lib/types').ClosingText;
};
const REPORT_FIXTURE_LOADERS: Record<string, () => Promise<ReportFixture>> = {
  'report-collection-performance': () => import('@/fixtures/report-collection-performance.json').then((m) => m.default as unknown as ReportFixture),
  'report-prebook-pacing':         () => import('@/fixtures/report-prebook-pacing.json').then((m) => m.default as unknown as ReportFixture),
  'report-customer-health':        () => import('@/fixtures/report-customer-health.json').then((m) => m.default as unknown as ReportFixture),
  'report-pipeline':               () => import('@/fixtures/report-pipeline.json').then((m) => m.default as unknown as ReportFixture),
  'report-team-performance':       () => import('@/fixtures/report-team-performance.json').then((m) => m.default as unknown as ReportFixture),
  'report-catalog-health':         () => import('@/fixtures/report-catalog-health.json').then((m) => m.default as unknown as ReportFixture),
};

// Module-level singleton so we don't churn Audio objects per turn.
let notifyAudio: HTMLAudioElement | null = null;
function playNotifySound() {
  try {
    if (typeof window === 'undefined') return;
    if (!notifyAudio) {
      notifyAudio = new Audio('/sounds/kai-notify.wav');
      notifyAudio.volume = 0.4;
      notifyAudio.preload = 'auto';
    }
    notifyAudio.currentTime = 0;
    void notifyAudio.play().catch(() => {});
  } catch {
    // ignore — autoplay-block or missing asset
  }
}

const AI_TIMEOUT_MS = 15000;
const AI_RETRY_DELAY_MS = 500;

interface KaiClassification {
  useCase: UseCase;
  classification?: string;
  entities?: { name: string; type: string }[];
  intents?: string[];
  confidence?: number;
  latencyMs?: number;
  error?: string;
}

export interface FormFieldSnapshot {
  fieldId: string;
  label: string;
  value: string;
  type: string;
  options?: string[];
}

interface KaiTurn {
  id: string;
  useCase:
    | UseCase
    | 'uc1-swap'
    | 'uc2-restage'
    | 'uc2-order'
    | 'docs-qa'
    | 'page-context'
    | 'email-draft'
    | 'email-shorter'
    | 'dashboard-builder'
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
    | 'metric-clarification'
    | 'workflow-clarification'
    // Audrey vDemo capabilities (Caps 1–6)
    | 'cap1-task-email'
    | 'cap1-email-draft'
    | 'cap1-task-confirmed'
    | 'cap2-lead-creation'
    | 'cap2-auto-task'
    | 'cap3-lead-won'
    | 'cap3-conversion-confirmed'
    | 'cap4-merge-customer'
    | 'cap4-merge-confirmed'
    | 'cap5-user-creation'
    | 'cap5-user-confirmed'
    | 'cap6-catalog-builder'
    | 'cap6-catalog-confirmed'
    // Audrey vDemo reports (Cap 7)
    | 'report-collection-performance'
    | 'report-prebook-pacing'
    | 'report-customer-health'
    | 'report-pipeline'
    | 'report-team-performance'
    | 'report-catalog-health';
  unknownReply?: string;
  aiClassification?: KaiClassification;
  isStale?: boolean;
  /** Populated for uc2-restage turns: the patched form fields to render */
  restagedFields?: FormFieldSnapshot[];
  /** Summary of changes made, shown in AgentReasoningCard */
  restageChangeSummary?: string;
  /** Populated for docs-qa turns */
  docsQA?: import('@/lib/types').DocsQAPair;
  /** True when this turn was triggered by clicking an action chip */
  fromChip?: boolean;
  /** Populated for page-context turns: pre-matched widgets + closing text */
  pageContextMatch?: PageContextMatch;
  /** Original user query that produced this turn — used for fixture variant selection */
  userQuery?: string;
  /** Live snapshot of staged-form fields at the moment a chip-spawned turn fires.
   *  Used by chip-spawn renderers (e.g. sr2-compare) to reflect ongoing edits. */
  liveFields?: FormFieldSnapshot[];
  /** ad17-report turn extension: catalog labels appended to the metric row.
   *  Set when the user adds metrics via chip click or via the ClarificationCard. */
  ad17AddedMetrics?: string[];
  /** metric-clarification turn: payload for the AW-006 ClarificationCard. */
  clarificationPayload?: {
    scope: MetricScope;
    prompt: string;
    candidates: string[];
    /** Labels already on the target report at the time the question was asked. */
    currentLabels: string[];
  };
  /** ad29-workflow / ad29-test turn: which workflow from the catalog drives
   *  the rendered widgets and the chip routing. */
  workflowId?: WorkflowId;
  /** workflow-clarification turn: payload for the single-mode AW-006. */
  workflowClarificationPayload?: {
    prompt: string;
    candidates: WorkflowId[];
  };
  /** History restore: when set, the turn renders from a saved snapshot
   *  instead of going through the simulator + LLM hooks. */
  isRestored?: boolean;
  restoredWidgets?: SerializedWidget[];
  restoredClosingText?: { type: string; text: string };
  restoredLlmText?: string;
  /** Snapshot of widgets from the immediately-prior turn — passed to the LLM
   *  as additional context. Used by chip-chained turns (e.g. cap1-email-draft
   *  fired from a cap1-task-email confirmation) so the email can reference
   *  the exact task fields the user just confirmed. */
  priorContextWidgets?: ParsedWidget[];
}

// ── LLM generate context ──────────────────────────────────────────────────────
// Passed from ChatShell down to every turn renderer so they can call
// useKaiGenerate with the right args without prop-drilling primitives.

interface GenerateContext {
  /** False when demo mode is active — renderers skip the LLM fetch. */
  aiMode: boolean;
  capability: string;
  userQuery: string;
  persona?: string;
  customInstructions?: string;
  pageContext?: {
    page: string;
    visibleData?: unknown[];
    systemPromptInjection?: string;
  };
  includeFinancial: boolean;
}

// ── Mode indicator ─────────────────────────────────────────────────────────────

function ModeIndicator({ aiMode }: { aiMode: boolean }) {
  return (
    <div className="flex items-center gap-[6px]">
      <span className={`w-[7px] h-[7px] rounded-full shrink-0 ${aiMode ? 'bg-[var(--primary-70)] shadow-[0_0_0_2px_var(--primary-10)]' : 'bg-[var(--text3)]'}`} />
      <span className={`text-[12px] font-medium font-sans ${aiMode ? 'text-[var(--primary-80)]' : 'text-[var(--text3)]'}`}>
        {aiMode ? 'AI Classification ON' : 'Demo Mode'}
      </span>
    </div>
  );
}

// ── Consent turn (UC-2 / UC-3) ───────────────────────────────────────────────

function ConsentTurnRenderer({
  turn,
  responseMode,
  personalityId,
  onStreamEnd,
  onFormReady,
  onToggleTTS,
  isReading,
  onStreamComplete,
  onConfirmed,
  onWorkflowActivated,
  onNavigate,
  onWidgetsReady,
  generateCtx,
}: {
  turn: KaiTurn;
  responseMode: ResponseMode;
  personalityId: import('@/lib/types').PersonalityId;
  onStreamEnd: (closingText?: string) => void;
  onFormReady?: (fields: FormFieldSnapshot[]) => void;
  onWorkflowActivated?: (workflowId: WorkflowId) => void;
  onToggleTTS?: (text: string) => void;
  isReading?: boolean;
  onStreamComplete?: (text: string) => void;
  /** Called after consent confirmed — use to write to SharedContext */
  onConfirmed?: (fields: import('@/hooks/useConsentFlow').FormField[]) => void;
  /** Called when user clicks deep-link in confirmation widget */
  onNavigate?: (route: string) => void;
  onWidgetsReady?: (widgets: ParsedWidget[]) => void;
  generateCtx: GenerateContext;
}) {
  const { requireConfirmation } = useUserPreferences();
  const sim = useStreamSimulator(turn.useCase as Parameters<typeof useStreamSimulator>[0], turn.id, responseMode, personalityId, turn.userQuery);
  // When this ad29-workflow turn carries a workflowId, swap the streamed
  // fixture widgets out for catalog-driven widgets keyed off that id. The
  // simulator still runs (so isStreaming / textOnlyActions stay live), we
  // just substitute the data going through the renderer.
  const catalogAd29 = (turn.useCase === 'ad29-workflow' && turn.workflowId)
    ? buildAd29WorkflowFromCatalog(turn.workflowId, turn.id)
    : null;
  const streamedWidgets = catalogAd29 ? catalogAd29.widgets : sim.widgets;
  const isStreaming = sim.isStreaming;
  const closingText = catalogAd29 ? catalogAd29.closingText : sim.closingText;
  const textOnlyActions = sim.textOnlyActions;
  const [editedValues, setEditedValues] = useState<Record<string, string>>({});

  const baseFormFields = (() => {
    const formWidget = streamedWidgets.find((w) => w.widgetType === 'AW-004');
    if (formWidget) {
      const steps = formWidget.data.steps as Array<{ fields: import('@/hooks/useConsentFlow').FormField[] }> | undefined;
      return steps?.[0]?.fields;
    }
    // Fallback for fixtures that stage actions via a UW-003 task card + AW-012
    // (e.g. cap2-auto-task-followup): synthesize FormField[] from the entity's
    // labeled fields so buildConfirmationWidget renders a contextual success
    // message ("Task '…' created for …, assigned to …, due …").
    const entity = streamedWidgets.find(
      (w) => w.widgetType === 'UW-003' && (w.data as { entityType?: string }).entityType === 'task',
    );
    if (entity) {
      const d = entity.data as { title?: string; fields?: Array<{ label: string; value: string; entityId?: string }> };
      const labelToFieldId: Record<string, string> = {
        lead: 'customer',
        customer: 'customer',
        'assigned to': 'assignee',
        'due date': 'dueDate',
        priority: 'priority',
        type: 'type',
        status: 'status',
      };
      const synthesized: import('@/hooks/useConsentFlow').FormField[] = [];
      if (d.title) synthesized.push({ fieldId: 'title', label: 'Title', value: d.title });
      (d.fields ?? []).forEach((f) => {
        const key = labelToFieldId[f.label.toLowerCase()];
        if (key) synthesized.push({ fieldId: key, label: f.label, value: f.value });
      });
      // Need at least title + assignee for buildConfirmationWidget's isTask branch
      if (synthesized.length > 0) return synthesized;
    }
    return undefined;
  })();

  // Merge edited values on top of base fixture fields so confirm always sees latest values
  let liveFormFields = baseFormFields?.map((f) =>
    editedValues[f.fieldId] !== undefined ? { ...f, value: editedValues[f.fieldId] } : f
  );

  // Auto-recompute subtotal for order forms when the user edited `items` but
  // not `subtotal`. MultiStepFormWizard pushes the FULL values map on every
  // change, so we can't use `editedValues.subtotal === undefined`; compare to
  // the original baseline values instead.
  const baseValuesByFieldId = (() => {
    const map: Record<string, string> = {};
    baseFormFields?.forEach((f) => { map[f.fieldId] = f.value; });
    return map;
  })();
  const itemsActuallyChanged =
    editedValues.items !== undefined &&
    editedValues.items !== baseValuesByFieldId.items;
  const subtotalActuallyChanged =
    editedValues.subtotal !== undefined &&
    editedValues.subtotal !== baseValuesByFieldId.subtotal;
  if (
    liveFormFields &&
    (turn.useCase === 'sr2-reorder' || turn.useCase === 'uc2-order') &&
    itemsActuallyChanged &&
    !subtotalActuallyChanged
  ) {
    const itemsValue = editedValues.items;
    const parsed = parseLineItems(itemsValue);
    const gross = parsed.reduce((sum, { sku, qty }) => {
      const p = SR2_SKU_PRICES[sku];
      return p ? sum + p * qty : sum;
    }, 0);
    if (gross > 0) {
      const discountField = liveFormFields.find((f) => f.fieldId === 'discount')?.value ?? '';
      const pctMatch = discountField.match(/(\d+(?:\.\d+)?)\s*%/);
      const pct = pctMatch ? Number(pctMatch[1]) : 0;
      const net = gross * (1 - pct / 100);
      const formatted = `$${net.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      liveFormFields = liveFormFields.map((f) =>
        f.fieldId === 'subtotal' ? { ...f, value: formatted } : f
      );
    }
  }
  // For ad29-workflow turns, additionally fire the workflow-activate hook so
  // ChatShell can persist the workflow into My Artifacts under "Scheduled".
  const wrappedOnConfirmed = (fields: import('@/hooks/useConsentFlow').FormField[]) => {
    // Cap 6 — append the live "removed SKUs" set so the catalog handler can
    // compute surviving SKUs at confirm time. JSON-encoded so the existing
    // string-valued FormField pipeline doesn't choke.
    const removed = removedSkusRef.current;
    const enriched = removed.length > 0
      ? [
          ...fields,
          { fieldId: '_removedSkus', label: '_removedSkus', value: JSON.stringify(removed) } as import('@/hooks/useConsentFlow').FormField,
        ]
      : fields;
    onConfirmed?.(enriched);
    if (turn.useCase === 'ad29-workflow' && turn.workflowId && onWorkflowActivated) {
      onWorkflowActivated(turn.workflowId);
    }
  };
  const consent = useConsentFlow(turn.id, liveFormFields, {
    onConfirmed: wrappedOnConfirmed,
    // For V2 flows that need a hardcoded route, set it explicitly. For everything
    // else (incl. Audrey caps), pass undefined so buildConfirmationWidget picks
    // a route based on form-field discriminators (lead/customer/merge/user/catalog).
    deepLink:
      turn.useCase === 'uc2-order' || turn.useCase === 'sr2-reorder'
        ? { label: 'View in Orders', route: 'wizorder/orders' }
        : turn.useCase === 'ad29-workflow'
          ? { label: 'View in My Artifacts', route: 'artifacts' }
          : undefined,
  });
  const didEnd = useRef(false);
  const didStream = useRef(false);
  const [widgetsDone, setWidgetsDone] = useState(false);

  // Cap 6 — persist the confirmed catalog into SharedCatalogsContext exactly
  // once per turn, on consent.consentState === 'confirmed'. Reads the live
  // UW-009 items list, subtracts the user's removed SKUs (set via the trash
  // badges in remove mode), and snapshots the form field values.
  const { addCatalog } = useSharedCatalogs();
  const catalogPersistedRef = useRef(false);
  useEffect(() => {
    if (turn.useCase !== 'cap6-catalog-builder') return;
    if (consent.consentState !== 'confirmed') return;
    if (catalogPersistedRef.current) return;
    catalogPersistedRef.current = true;
    const grid = streamedWidgets.find((w) => w.widgetType === 'UW-009');
    if (!grid) return;
    const items = ((grid.data as { items?: import('@/lib/types').ProductCardItem[] }).items ?? []);
    const removed = new Set(removedSkusRef.current);
    const surviving = items.filter((i) => !removed.has(i.sku));
    const fieldVal = (id: string): string | undefined => {
      const f = liveFormFields?.find((x) => x.fieldId === id);
      return f?.value as string | undefined;
    };
    const flag = (id: string): boolean => {
      const v = fieldVal(id);
      return v === 'true' || (v as unknown) === true;
    };
    const sourceLeadId = fieldVal('sourceLeadId');
    const catalogName = fieldVal('catalogName') ?? 'Untitled Catalog';
    const format = fieldVal('format') ?? 'Shareable Link';
    const personalNote = fieldVal('personalNote') ?? '';
    const catalog: SharedCatalog = {
      id: `CAT-${Date.now()}`,
      name: catalogName,
      recipient: 'Mountain Bloom Studio',
      recipientId: sourceLeadId,
      createdAt: new Date().toISOString(),
      createdByKai: true,
      items: surviving,
      includePricing: flag('includePricing'),
      includeStockLevels: flag('includeStockLevels'),
      format,
      personalNote: personalNote || undefined,
    };
    addCatalog(catalog);
  }, [turn.useCase, consent.consentState, streamedWidgets, liveFormFields, addCatalog]);

  useEffect(() => {
    if (isStreaming) didStream.current = true;
  }, [isStreaming]);

  useEffect(() => {
    if (!isStreaming && didStream.current && !didEnd.current) {
      didEnd.current = true;
      setWidgetsDone(true);
      if (onFormReady) {
        const formWidget = streamedWidgets.find((w) => w.widgetType === 'AW-004');
        if (formWidget) {
          const steps = (formWidget.data as Record<string, unknown>).steps as Array<{ fields: FormFieldSnapshot[] }> | undefined;
          const fields = steps?.[0]?.fields ?? [];
          onFormReady(fields);
        }
      }
      onWidgetsReady?.(streamedWidgets);
      onStreamEnd(closingText?.text);
    }
  }, [isStreaming, onStreamEnd, onFormReady, onWidgetsReady, streamedWidgets, closingText]);

  // Push live form edits up to ChatShell so chip-spawned follow-ups
  // (e.g. sr2-compare) and downstream restage can read the latest values.
  // `liveFormFields` is a fresh array every render — depend on a stable
  // signature instead, and read the latest fields via a ref.
  const liveFormFieldsRef = useRef(liveFormFields);
  liveFormFieldsRef.current = liveFormFields;
  const editedSignature = JSON.stringify(editedValues);
  useEffect(() => {
    if (!onFormReady) return;
    if (editedSignature === '{}') return;
    const fields = liveFormFieldsRef.current;
    if (!fields) return;
    onFormReady(fields as FormFieldSnapshot[]);
  }, [editedSignature, onFormReady]);

  const llm = useKaiGenerate({
    enabled: generateCtx.aiMode,
    capability: generateCtx.capability,
    userQuery: generateCtx.userQuery,
    widgetData: streamedWidgets,
    persona: generateCtx.persona,
    customInstructions: generateCtx.customInstructions,
    pageContext: generateCtx.pageContext,
    includeFinancial: generateCtx.includeFinancial,
    widgetsDone,
  });

  // When the "Require confirmation" pref is OFF, auto-confirm the consent flow
  // as soon as the staged form has finished streaming. The downstream
  // onConfirmed callbacks (addOrder/addTask/handleWorkflowActivated) still fire.
  const autoConfirmedRef = useRef(false);
  useEffect(() => {
    if (
      !requireConfirmation &&
      widgetsDone &&
      consent.consentState === 'staged' &&
      !autoConfirmedRef.current
    ) {
      autoConfirmedRef.current = true;
      consent.onConfirm();
    }
  }, [requireConfirmation, widgetsDone, consent]);

  // Cap 6 — track SKUs the user removed via the UW-009 trash buttons (only
  // active when consent.formMode === 'edit'). Surviving SKUs flow into
  // handleConfirmed via a hidden `_removedSkus` field on the form snapshot.
  const removedSkusRef = useRef<string[]>([]);
  const handleRemovedChange = useCallback((skus: string[]) => {
    removedSkusRef.current = skus;
  }, []);

  const patchedWidgets: ParsedWidget[] = streamedWidgets
    .filter((w) => requireConfirmation || w.widgetType !== 'AW-012')
    .map((w) => {
    if (w.widgetType === 'AW-004') {
      const isConfirmed = consent.consentState === 'confirmed';
      // Reflect any auto-recomputed values (e.g. subtotal) back into the
      // displayed form so review mode shows the up-to-date numbers.
      const stepsRaw = (w.data as Record<string, unknown>).steps as Array<{ stepTitle: string; fields: import('@/hooks/useConsentFlow').FormField[] }> | undefined;
      const patchedSteps = stepsRaw && liveFormFields
        ? stepsRaw.map((s, idx) => idx === 0 ? { ...s, fields: liveFormFields! } : s)
        : stepsRaw;
      return {
        ...w,
        data: { ...w.data, ...(patchedSteps ? { steps: patchedSteps } : {}) },
        config: { ...w.config, mode: isConfirmed ? 'review' : consent.formMode, editable: !isConfirmed && consent.formMode === 'edit', onValuesChange: setEditedValues },
      };
    }
    if (w.widgetType === 'UW-009') {
      // In edit mode → show trash badges and listen for removal toggles.
      return {
        ...w,
        config: {
          ...w.config,
          removeMode: consent.formMode === 'edit' && consent.consentState !== 'confirmed',
          onRemovedChange: handleRemovedChange,
        },
      };
    }
    if (w.widgetType === 'UW-014' && turn.aiClassification) {
      return injectClassificationStep(w, turn.aiClassification);
    }
    return w;
  });

  const consentHandlers: ConsentHandlers = {
    onConfirm: consent.onConfirm,
    onEdit: consent.onEdit,
    onCancel: consent.onCancel,
    onResetEdit: consent.onResetEdit,
    isConfirming: consent.isConfirming,
  };

  const isDimmed = consent.consentState === 'cancelled' || consent.consentState === 'confirmed';

  return (
    <>
      <div style={{ transition: 'opacity 400ms ease', opacity: isDimmed ? 0.4 : 1 }}>
        <KaiResponse
          widgets={patchedWidgets}
          consentHandlers={consentHandlers}
          textOnlyActions={responseMode === 'text-only' ? textOnlyActions : null}
          closingText={closingText ?? undefined}
        />
        {closingText && (
          <CanvasTextBlock
            closingText={closingText}
            streamingText={llm.failed ? '' : llm.streamingText}
            isStreaming={llm.isStreaming}
            isReading={isReading}
            onToggleTTS={onToggleTTS ? () => onToggleTTS(llm.streamingText || closingText.text) : undefined}
            onStreamComplete={onStreamComplete}
          />
        )}
      </div>
      {consent.confirmedWidgets.length > 0 && (
        <KaiResponse
          widgets={consent.confirmedWidgets.map(w =>
            w.widgetType === 'AW-003' && onNavigate
              ? { ...w, config: { ...w.config, onNavigate } }
              : w
          )}
        />
      )}
    </>
  );
}

// ── ad17-report metric extension ─────────────────────────────────────────────
// Patches the UW-002 metric row to append catalog-driven cards, satisfying the
// "Add more metrics" chip + ClarificationCard flow without a separate fixture.

function patchAd17MetricsWidget(w: ParsedWidget, labels: string[]): ParsedWidget {
  if (labels.length === 0) return w;
  const cards = resolveMetrics('ad17-report', labels).map((m) => m.card as unknown as Record<string, unknown>);
  if (cards.length === 0) return w;

  if (w.widgetType === 'UW-002') {
    const existing = ((w.data as { cards?: Record<string, unknown>[] }).cards) ?? [];
    const have = new Set(existing.map((c) => String(c.label).toLowerCase()));
    const toAdd = cards.filter((c) => !have.has(String(c.label).toLowerCase()));
    if (toAdd.length === 0) return w;
    return {
      ...w,
      data: { ...w.data, cards: [...existing, ...toAdd] },
    };
  }
  if (w.widgetType === 'UW-014') {
    const labelList = cards.map((c) => String(c.label)).join(' + ');
    return {
      ...w,
      data: {
        ...w.data,
        summary: `Added ${labelList} to the Q1 report.`,
        steps: [
          { step: 1, action: 'identify_metrics', result: labelList, ms: 60 },
          { step: 2, action: 'append_metric_cards', result: `${cards.length} card${cards.length !== 1 ? 's' : ''} added`, ms: 80 },
        ],
        totalMs: 140,
      },
    };
  }
  return w;
}

// ── ad17-report → DashboardCompositeData ─────────────────────────────────────
// Converts the structured-report widgets (UW-002, CH-001, UW-004) into a 2x3
// dashboard so the user can save the Q1 report through the existing
// SaveArtifactModal + DashboardFullView pipeline.
function buildDashboardFromAd17(widgets: ParsedWidget[]): DashboardCompositeData {
  const metricRow = widgets.find((w) => w.widgetType === 'UW-002');
  const chart = widgets.find((w) => w.widgetType === 'CH-001');
  const table = widgets.find((w) => w.widgetType === 'UW-004');

  const cells: DashboardCompositeData['cells'] = [];
  if (metricRow) {
    cells.push({
      position: { row: 0, col: 0, colSpan: 2 },
      widgetType: 'UW-002',
      data: metricRow.data,
      config: metricRow.config,
    });
  }
  if (chart) {
    cells.push({
      position: { row: 1, col: 0, colSpan: 2 },
      widgetType: 'CH-001',
      data: chart.data,
      config: chart.config ?? { chartType: 'bar', showDataPoints: false, showArea: false },
    });
  }
  if (table) {
    cells.push({
      position: { row: 2, col: 0, colSpan: 2 },
      widgetType: 'UW-004',
      data: table.data,
      config: table.config,
    });
  }

  return {
    title: 'Q1 2026 Sales Performance Report',
    description: 'Q1 revenue, quote conversion, weekly trend, and top customers.',
    layout: 'grid-2x3',
    cells,
  };
}

// ── ad29-workflow / ad29-test catalog → widgets ──────────────────────────────
// Builds the widget list for an ad29-workflow setup turn from a catalog entry.
// Mirrors the shape that useStreamSimulator would produce from a JSON fixture.
function buildAd29WorkflowFromCatalog(
  workflowId: WorkflowId,
  turnId: string,
): { widgets: ParsedWidget[]; closingText: import('@/lib/types').ClosingText } | null {
  const wf = getWorkflow(workflowId);
  if (!wf) return null;
  const frame = {
    frameId: `f-ad29-${workflowId}`,
    frameType: 'action_staged' as const,
    widgets: [
      {
        widgetType: 'UW-014',
        data: {
          summary: wf.setupSummary,
          steps: [
            { step: 1, action: 'fetch_workflow_template', result: `${wf.label} template loaded`, ms: 110 },
            { step: 2, action: 'evaluate_segment', result: `${wf.setupMetrics[0].value} matches`, ms: 195 },
            { step: 3, action: 'validate_actions', result: 'All actions valid against current schema', ms: 75 },
          ],
          mcpsAccessed: ['Workflows', 'CRM'],
          totalMs: 380,
        },
        config: { collapsed: true },
      },
      {
        widgetType: 'UW-003',
        data: {
          entityType: 'workflow',
          title: `Workflow — ${wf.label}`,
          fields: [
            { label: 'Workflow Name', value: wf.detail.workflowName },
            { label: 'Trigger', value: wf.detail.trigger },
            { label: 'Audience', value: wf.detail.audience },
            ...wf.detail.steps.map((step, i) => ({ label: `Step ${i + 1}`, value: step })),
            { label: 'Status', value: wf.detail.status },
          ],
        },
      },
      {
        widgetType: 'UW-002',
        data: { cards: wf.setupMetrics },
      },
      {
        widgetType: 'AW-012',
        data: {
          message: `Kai has staged this workflow for your review. Activating it will start running against the matched audience immediately.`,
          tier: 'draft',
          actions: ['Activate Workflow', 'Edit', 'Cancel'],
        },
      },
    ],
  };
  const parsed = parseFrame(frame as Parameters<typeof parseFrame>[0], 0)
    .map((w) => ({ ...w, key: `${turnId}:${w.key}` }));
  return {
    widgets: parsed,
    closingText: { type: 'description', text: wf.setupClosing },
  };
}

// Builds the widget list for an ad29-test turn from a catalog entry.
function buildAd29TestFromCatalog(
  workflowId: WorkflowId,
  turnId: string,
): { widgets: ParsedWidget[]; closingText: import('@/lib/types').ClosingText } | null {
  const wf = getWorkflow(workflowId);
  if (!wf) return null;
  const frame = {
    frameId: `f-ad29-test-${workflowId}`,
    frameType: 'result' as const,
    widgets: [
      {
        widgetType: 'UW-014',
        data: {
          summary: wf.testSummary,
          steps: [
            { step: 1, action: 'fetch_eligible_records', result: `${wf.testMetrics[0].value} records crossed threshold`, ms: 210 },
            { step: 2, action: 'simulate_actions', result: `Action mix: ${wf.testRecords[0].wouldDo}, ${wf.testRecords[wf.testRecords.length - 1].wouldDo}`, ms: 195 },
          ],
          totalMs: 405,
        },
        config: { collapsed: true },
      },
      {
        widgetType: 'UW-002',
        data: { cards: wf.testMetrics },
      },
      {
        widgetType: 'UW-004',
        data: {
          title: 'Sample Triggered Records (last 30 days)',
          columns: [
            { key: 'customer', label: 'Customer / SKU' },
            { key: 'tier', label: 'Tier' },
            { key: 'detail', label: 'Detail' },
            { key: 'ltv', label: 'LTV / Value' },
            { key: 'wouldDo', label: 'Action' },
          ],
          rows: wf.testRecords,
        },
      },
    ],
  };
  const parsed = parseFrame(frame as Parameters<typeof parseFrame>[0], 0)
    .map((w) => ({ ...w, key: `${turnId}:${w.key}` }));
  return {
    widgets: parsed,
    closingText: { type: 'insight', text: wf.testClosing },
  };
}

// ── Standard turn (UC-1) ─────────────────────────────────────────────────────

function StandardTurnRenderer({
  turn,
  responseMode,
  personalityId,
  onStreamEnd,
  onToggleTTS,
  isReading,
  onStreamComplete,
  onWidgetsReady,
  onSaveAsDashboardFromAd17,
  generateCtx,
}: {
  turn: KaiTurn;
  responseMode: ResponseMode;
  personalityId: import('@/lib/types').PersonalityId;
  onStreamEnd: (closingText?: string) => void;
  onToggleTTS?: (text: string) => void;
  isReading?: boolean;
  onStreamComplete?: (text: string) => void;
  onWidgetsReady?: (widgets: ParsedWidget[]) => void;
  onSaveAsDashboardFromAd17?: (widgets: ParsedWidget[]) => void;
  generateCtx: GenerateContext;
}) {
  const sim = useStreamSimulator(turn.useCase as Parameters<typeof useStreamSimulator>[0], turn.id, responseMode, personalityId, turn.userQuery);
  // ad29-test turn: render from the workflow catalog tied to turn.workflowId
  // rather than the single dormant-only fixture. Falls back to the simulator
  // output when no workflowId is set (preserves the old behavior).
  const catalogTest = (turn.useCase === 'ad29-test' && turn.workflowId)
    ? buildAd29TestFromCatalog(turn.workflowId, turn.id)
    : null;
  const streamedWidgets = catalogTest ? catalogTest.widgets : sim.widgets;
  const isStreaming = sim.isStreaming;
  const closingText = catalogTest ? catalogTest.closingText : sim.closingText;
  const didEnd = useRef(false);
  const didStream = useRef(false);
  const responseFrameRef = useRef<HTMLDivElement>(null);
  const [widgetsDone, setWidgetsDone] = useState(false);

  // Tag the ad17-report frame so the "Email this report" attachment chip can
  // locate it via DOM query after the email turn is rendered on top of it.
  useEffect(() => {
    if (turn.useCase === 'ad17-report' && responseFrameRef.current) {
      responseFrameRef.current.setAttribute('data-ad17-snapshot', turn.id);
    }
  }, [turn.useCase, turn.id]);

  useEffect(() => {
    if (isStreaming) didStream.current = true;
  }, [isStreaming]);

  useEffect(() => {
    if (!isStreaming && didStream.current && !didEnd.current) {
      didEnd.current = true;
      setWidgetsDone(true);
      onWidgetsReady?.(streamedWidgets);
      onStreamEnd(closingText?.text);
    }
  }, [isStreaming, onStreamEnd, onWidgetsReady, streamedWidgets, closingText]);

  // T9: text-only mode — use text-only capability key so the full narrative is generated
  const capability = responseMode === 'text-only' ? 'text-only' : generateCtx.capability;

  const llm = useKaiGenerate({
    enabled: generateCtx.aiMode,
    capability,
    userQuery: generateCtx.userQuery,
    widgetData: streamedWidgets,
    persona: generateCtx.persona,
    customInstructions: generateCtx.customInstructions,
    pageContext: generateCtx.pageContext,
    includeFinancial: generateCtx.includeFinancial,
    widgetsDone,
  });

  const widgets = streamedWidgets.map((w) => {
    if (w.widgetType === 'UW-014' && turn.aiClassification) {
      return injectClassificationStep(w, turn.aiClassification);
    }
    if (turn.useCase === 'sr2-compare' && w.widgetType === 'UW-004' && turn.liveFields) {
      return patchCompareWidget(w, turn.liveFields);
    }
    if (turn.useCase === 'ad17-report' && turn.ad17AddedMetrics && turn.ad17AddedMetrics.length > 0) {
      return patchAd17MetricsWidget(w, turn.ad17AddedMetrics);
    }
    return w;
  });

  const widgetActionHandlers: WidgetActionHandlers | undefined =
    turn.useCase === 'ad17-report' && onSaveAsDashboardFromAd17
      ? { onSaveAsDashboard: () => onSaveAsDashboardFromAd17(widgets) }
      : undefined;

  const extraToolbar = turn.useCase === 'ad17-report' ? (
    <DownloadSnapshotButton
      filenameStem={turn.ad17AddedMetrics && turn.ad17AddedMetrics.length > 0 ? 'kai-q1-sales-report-extended' : 'kai-q1-sales-report'}
      getTarget={() => responseFrameRef.current}
    />
  ) : undefined;

  const response = (
    <>
      <KaiResponse
        ref={responseFrameRef}
        widgets={widgets}
        closingText={closingText ?? undefined}
        extraToolbar={extraToolbar}
      />
      {closingText && (
        <CanvasTextBlock
          closingText={closingText}
          streamingText={llm.failed ? '' : llm.streamingText}
          isStreaming={llm.isStreaming}
          isReading={isReading}
          onToggleTTS={onToggleTTS ? () => onToggleTTS(llm.streamingText || closingText.text) : undefined}
          onStreamComplete={onStreamComplete}
        />
      )}
    </>
  );

  if (widgetActionHandlers) {
    return (
      <WidgetActionContext.Provider value={widgetActionHandlers}>
        {response}
      </WidgetActionContext.Provider>
    );
  }
  return response;
}

// ── Unknown reply ─────────────────────────────────────────────────────────────

function UnknownTurnRenderer({
  turn,
  onSelect,
  onStreamEnd,
}: {
  turn: KaiTurn;
  onSelect: (q: string) => void;
  onStreamEnd: (closingText?: string) => void;
}) {
  const didEnd = useRef(false);
  useEffect(() => {
    if (!didEnd.current) {
      didEnd.current = true;
      onStreamEnd();
    }
  }, [onStreamEnd]);

  const isNetSuiteReply = turn.unknownReply && !turn.unknownReply.startsWith("I don't");

  return (
    <div className="flex justify-start mb-4 message-slide-in-left">
      <div className="max-w-[85%] w-full bg-transparent px-4 py-3">
        <p className="text-[13.5px] text-[var(--text2)] leading-relaxed mb-3 font-sans">
          {turn.unknownReply}
        </p>
        {!isNetSuiteReply && (
          <SuggestedQueries onSelect={onSelect} inline />
        )}
      </div>
    </div>
  );
}

// ── Metric clarification turn (AW-006 ClarificationCard) ─────────────────────
// Spawned when /api/kai/restage-metrics returns intent=clarify. Renders the
// candidate metric labels in a multi-select dropdown. Confirm → calls the
// onConfirmClarification callback which spawns a new ad17-report turn with the
// selected labels applied.

function MetricClarificationTurnRenderer({
  turn,
  onStreamEnd,
  onConfirmClarification,
  onCancelClarification,
}: {
  turn: KaiTurn;
  onStreamEnd: (closingText?: string) => void;
  onConfirmClarification: (turnId: string, selectedLabels: string[]) => void;
  onCancelClarification: (turnId: string) => void;
}) {
  const didEnd = useRef(false);
  useEffect(() => {
    if (!didEnd.current) {
      didEnd.current = true;
      onStreamEnd();
    }
  }, [onStreamEnd]);

  const payload = turn.clarificationPayload;
  if (!payload) {
    return (
      <div className="flex justify-start mb-4 message-slide-in-left">
        <div className="max-w-[85%] w-full bg-transparent px-4 py-3">
          <p className="text-[13.5px] text-[var(--text2)] leading-relaxed font-sans">
            I lost track of which metrics to offer — try the chip again.
          </p>
        </div>
      </div>
    );
  }

  // Resolve catalog entries so the AW-006 can render label + description.
  const catalogEntries = resolveMetrics(payload.scope, payload.candidates);
  const options = catalogEntries.map((m) => ({
    value: m.label,
    label: m.label,
    description: m.description,
  }));

  // Build a single AW-006 widget on the fly. We don't go through the simulator
  // because there's no fixture — the payload is dynamic.
  const widget: ParsedWidget = {
    key: `${turn.id}:clarification`,
    widgetType: 'AW-006',
    Component: resolveWidget('AW-006'),
    data: {
      prompt: payload.prompt,
      context: payload.currentLabels.length > 0
        ? `Already on the report: ${payload.currentLabels.join(', ')}.`
        : undefined,
      options,
      confirmLabel: 'Add to report',
      cancelLabel: 'Not now',
    },
    frameId: `f-clarify-${turn.id}`,
    frameType: 'result',
  };

  const handlers: WidgetActionHandlers = {
    onClarificationConfirm: (labels) => onConfirmClarification(turn.id, labels),
    onClarificationCancel: () => onCancelClarification(turn.id),
  };

  return (
    <WidgetActionContext.Provider value={handlers}>
      <KaiResponse widgets={[widget]} />
    </WidgetActionContext.Provider>
  );
}

// ── Workflow clarification turn (single-mode AW-006) ─────────────────────────
// Spawned when the user asks vaguely to set up a workflow. Renders the workflow
// catalog as radio options. Confirm → spawn an ad29-workflow turn carrying the
// chosen workflowId. Cancel → remove this turn and its paired user message.

function WorkflowClarificationTurnRenderer({
  turn,
  onStreamEnd,
  onConfirmClarification,
  onCancelClarification,
}: {
  turn: KaiTurn;
  onStreamEnd: (closingText?: string) => void;
  onConfirmClarification: (turnId: string, selectedIds: string[]) => void;
  onCancelClarification: (turnId: string) => void;
}) {
  const didEnd = useRef(false);
  useEffect(() => {
    if (!didEnd.current) {
      didEnd.current = true;
      onStreamEnd();
    }
  }, [onStreamEnd]);

  const payload = turn.workflowClarificationPayload;
  if (!payload) {
    return (
      <div className="flex justify-start mb-4 message-slide-in-left">
        <div className="max-w-[85%] w-full bg-transparent px-4 py-3">
          <p className="text-[13.5px] text-[var(--text2)] leading-relaxed font-sans">
            I lost track of which workflows to offer — try again.
          </p>
        </div>
      </div>
    );
  }

  // Resolve catalog entries — preserve catalog order.
  const options = payload.candidates
    .map((id) => getWorkflow(id))
    .filter((w): w is NonNullable<ReturnType<typeof getWorkflow>> => !!w)
    .map((w) => ({ value: w.id, label: w.label, description: w.description }));

  const widget: ParsedWidget = {
    key: `${turn.id}:workflow-clarify`,
    widgetType: 'AW-006',
    Component: resolveWidget('AW-006'),
    data: {
      prompt: payload.prompt,
      context: 'Pick a pre-built workflow to stage. You can edit it before activating.',
      options,
      mode: 'single',
      confirmLabel: 'Continue',
      cancelLabel: 'Not now',
    },
    frameId: `f-workflow-clarify-${turn.id}`,
    frameType: 'result',
  };

  const handlers: WidgetActionHandlers = {
    onClarificationConfirm: (ids) => onConfirmClarification(turn.id, ids),
    onClarificationCancel: () => onCancelClarification(turn.id),
  };

  return (
    <WidgetActionContext.Provider value={handlers}>
      <KaiResponse widgets={[widget]} />
    </WidgetActionContext.Provider>
  );
}

// ── Restage turn (uc2 follow-up with patched fields) ─────────────────────────

function RestageRenderer({
  turn,
  onStreamEnd,
  onToggleTTS,
  isReading,
  onFormReady,
}: {
  turn: KaiTurn;
  onStreamEnd: (closingText?: string) => void;
  onToggleTTS?: (text: string) => void;
  isReading?: boolean;
  onFormReady?: (fields: FormFieldSnapshot[]) => void;
}) {
  const fields = turn.restagedFields ?? [];
  const summary = turn.restageChangeSummary ?? 'Re-staged form with updated values.';

  const makeWidget = (
    suffix: string,
    widgetType: string,
    data: Record<string, unknown>,
    config: Record<string, unknown>,
  ): ParsedWidget => ({
    key: `${turn.id}:${suffix}`,
    widgetType,
    Component: resolveWidget(widgetType),
    data,
    config,
    frameId: turn.id,
    frameType: 'result',
  });

  // Detect whether the staged form is an order or a task so the re-staged
  // surface matches the original (sr2-reorder + uc2-order ship 'subtotal').
  const isOrder = fields.some((f) => f.fieldId === 'subtotal');
  const entityKind = isOrder ? 'order' : 'task';
  const entityTitle = isOrder
    ? `Reorder — ${fields.find((f) => f.fieldId === 'customer')?.value ?? 'Order'}`
    : (fields.find((f) => f.fieldId === 'title')?.value ?? 'Task');
  const stepTitle = isOrder ? 'Reorder Details' : 'Task Details';
  const formId = isOrder ? 'order-restage-form' : 'task-restage-form';
  const consentMessage = isOrder
    ? "I've updated the reorder. Here's the revised version."
    : "I've updated the task. Here's the revised version.";

  const allWidgets: ParsedWidget[] = [
    makeWidget('reasoning', 'UW-014', {
      summary,
      steps: [
        { step: 1, action: 'parse_change_request', result: 'Changes extracted', ms: 180 },
        { step: 2, action: 'apply_field_patches', result: `${fields.length} field(s) updated`, ms: 40 },
        { step: 3, action: 'restage_form', result: 'Form re-staged for review', ms: 20 },
      ],
      mcpsAccessed: [],
      totalMs: 240,
    }, { collapsed: true }),
    makeWidget('entity', 'UW-003', {
      entityType: entityKind,
      title: entityTitle,
      fields: fields.map((f) => ({ label: f.label, value: f.value })),
    }, {}),
    makeWidget('form', 'AW-004', {
      formId,
      steps: [{ stepTitle, fields }],
    }, { mode: 'review', editable: false }),
    makeWidget('consent', 'AW-012', {
      message: consentMessage,
      tier: 'draft',
      actions: ['Confirm & Create', 'Edit', 'Cancel'],
    }, {}),
  ];

  const [streamedWidgets, setStreamedWidgets] = useState<ParsedWidget[]>([]);
  const allWidgetsRef = useRef(allWidgets);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    allWidgetsRef.current.forEach((w, i) => {
      timers.push(setTimeout(() => setStreamedWidgets((prev) => [...prev, w]), i * STREAM_WIDGET_DELAY_MS));
    });
    timers.push(setTimeout(() => {
      onStreamEnd(summary);
      onFormReady?.(fields);
    }, allWidgetsRef.current.length * STREAM_WIDGET_DELAY_MS));
    return () => timers.forEach(clearTimeout);
  // onStreamEnd identity is stable; allWidgetsRef holds the initial widget list
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const closingText = {
    type: 'description' as const,
    text: summary,
  };

  const consent = useConsentFlow(turn.id, fields);

  const patchedWidgets = streamedWidgets.map((w) => {
    if (w.widgetType === 'AW-004') {
      const isConfirmed = consent.consentState === 'confirmed';
      return { ...w, config: { mode: isConfirmed ? 'review' : consent.formMode, editable: !isConfirmed && consent.formMode === 'edit' } };
    }
    return w;
  });

  const consentHandlers: ConsentHandlers = {
    onConfirm: consent.onConfirm,
    onEdit: consent.onEdit,
    onCancel: consent.onCancel,
    onResetEdit: consent.onResetEdit,
    isConfirming: consent.isConfirming,
  };

  const isDimmed = consent.consentState === 'cancelled' || consent.consentState === 'confirmed';

  return (
    <>
      <div style={{ transition: 'opacity 400ms ease', opacity: isDimmed ? 0.4 : 1 }}>
        <KaiResponse widgets={patchedWidgets} consentHandlers={consentHandlers} closingText={closingText} />
        <CanvasTextBlock
          closingText={closingText}
          isReading={isReading}
          onToggleTTS={onToggleTTS ? () => onToggleTTS(closingText.text) : undefined}
        />
      </div>
      {consent.confirmedWidgets.length > 0 && <KaiResponse widgets={consent.confirmedWidgets} />}
    </>
  );
}

// ── Docs Q&A turn ────────────────────────────────────────────────────────────

function DocsQATurnRenderer({
  turn,
  onStreamEnd,
  onToggleTTS,
  isReading,
  onStreamComplete,
  generateCtx,
}: {
  turn: KaiTurn;
  onStreamEnd: (closingText?: string) => void;
  onToggleTTS?: (text: string) => void;
  isReading?: boolean;
  onStreamComplete?: (text: string) => void;
  generateCtx: GenerateContext;
}) {
  const qa = turn.docsQA!;
  const { showConfidence } = useUserPreferences();
  const confidencePct = Math.round((qa.confidence ?? 0.9) * 100);
  const source = qa.source;

  const reasoningWidget: ParsedWidget = {
    key: `${turn.id}:reasoning`,
    widgetType: 'UW-014',
    Component: resolveWidget('UW-014'),
    data: {
      summary: `Searched knowledge base. Found match in '${source ?? qa.category ?? 'article'}'. Confidence: ${confidencePct}%`,
      steps: [
        { step: 1, action: 'search_knowledge_base', result: '83 documents indexed', ms: 120 },
        { step: 2, action: 'match_query', result: `Found in '${source ?? qa.category ?? 'article'}'`, ms: 85 },
        { step: 3, action: 'generate_answer', result: `Confidence: ${confidencePct}%`, ms: 200 },
      ],
      mcpsAccessed: ['Knowledge Base'],
      totalMs: 405,
    },
    config: { collapsed: true },
    frameId: turn.id,
    frameType: 'result',
  };

  const [widgets, setWidgets] = useState<ParsedWidget[]>([]);
  const [widgetsDone, setWidgetsDone] = useState(false);
  const didEnd = useRef(false);

  useEffect(() => {
    const t = setTimeout(() => {
      setWidgets([reasoningWidget]);
      const t2 = setTimeout(() => {
        if (!didEnd.current) {
          didEnd.current = true;
          setWidgetsDone(true);
          // In AI mode, don't queue the hardcoded answer for TTS — the streamed
          // LLM text will be spoken via onStreamComplete instead.
          onStreamEnd(generateCtx.aiMode ? undefined : qa.answer);
        }
      }, STREAM_WIDGET_DELAY_MS);
      return () => clearTimeout(t2);
    }, STREAM_WIDGET_DELAY_MS);
    return () => clearTimeout(t);
  // onStreamEnd is stable; reasoningWidget built from turn (stable)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // T8: augment the matched doc answer with LLM reformulation
  const llm = useKaiGenerate({
    enabled: generateCtx.aiMode,
    capability: 'docs-qa',
    userQuery: generateCtx.userQuery,
    additionalContext: qa.answer,
    persona: generateCtx.persona,
    customInstructions: generateCtx.customInstructions,
    includeFinancial: generateCtx.includeFinancial,
    widgetsDone,
  });

  // In AI mode, never show the hardcoded fixture answer — only the streamed
  // LLM text. The reasoning card + source pill + confidence bar still convey
  // that the KB match was found; the canvas text must be 100% LLM-generated.
  const fixtureText = generateCtx.aiMode ? '' : qa.answer;
  const closingText = { type: 'insight' as const, text: fixtureText };
  const confidenceColor = confidencePct >= 80 ? '#16a34a' : '#d97706';

  return (
    <>
      <KaiResponse widgets={widgets} />
      <CanvasTextBlock
        closingText={closingText}
        streamingText={llm.failed ? '' : llm.streamingText}
        isStreaming={llm.isStreaming}
        isReading={isReading}
        onToggleTTS={onToggleTTS ? () => onToggleTTS(llm.streamingText || qa.answer) : undefined}
        onStreamComplete={onStreamComplete}
      />
      {showConfidence && (
        <div className="flex justify-start mb-4">
          <div className="max-w-[85%] w-full px-4 flex items-center gap-3 flex-wrap">
            {source && (
              <span style={{
                fontSize: 11, fontWeight: 600, padding: '2px 8px',
                borderRadius: 99, background: 'var(--surface2)', color: 'var(--text2)',
                border: '1px solid var(--border)', fontFamily: 'var(--display)',
              }}>
                {source}
              </span>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 80, height: 4, borderRadius: 99, background: 'var(--border)', overflow: 'hidden' }}>
                <div style={{ width: `${confidencePct}%`, height: '100%', background: confidenceColor, borderRadius: 99, transition: 'width 600ms ease' }} />
              </div>
              <span style={{ fontSize: 11, color: 'var(--text2)', fontFamily: 'var(--display)' }}>{confidencePct}% match</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ── Page-context turn ─────────────────────────────────────────────────────────

function PageContextTurnRenderer({
  turn,
  onStreamEnd,
  onToggleTTS,
  isReading,
  onStreamComplete,
  onWidgetsReady,
  generateCtx,
}: {
  turn: KaiTurn;
  onStreamEnd: (closingText?: string) => void;
  onToggleTTS?: (text: string) => void;
  isReading?: boolean;
  onStreamComplete?: (text: string) => void;
  onWidgetsReady?: (widgets: ParsedWidget[]) => void;
  generateCtx: GenerateContext;
}) {
  const match = turn.pageContextMatch!;
  const didEnd = useRef(false);
  const [widgetsDone, setWidgetsDone] = useState(false);

  // Emit stream-end immediately on mount — no artificial delay needed
  useEffect(() => {
    if (!didEnd.current) {
      didEnd.current = true;
      setWidgetsDone(true);
      onWidgetsReady?.(match.widgets);
      onStreamEnd(match.closingText?.text);
    }
  }, [onStreamEnd, onWidgetsReady, match.widgets, match.closingText]);

  const llm = useKaiGenerate({
    enabled: generateCtx.aiMode,
    capability: generateCtx.capability,
    userQuery: generateCtx.userQuery,
    widgetData: match.widgets,
    persona: generateCtx.persona,
    customInstructions: generateCtx.customInstructions,
    pageContext: generateCtx.pageContext,
    includeFinancial: generateCtx.includeFinancial,
    widgetsDone,
  });

  // Stamp turn id onto widget keys so they're unique across turns
  const widgets = match.widgets.map((w) => ({ ...w, key: `${turn.id}:${w.key}` }));

  return (
    <>
      <KaiResponse widgets={widgets} />
      {match.closingText && (
        <CanvasTextBlock
          closingText={match.closingText}
          streamingText={llm.failed ? '' : llm.streamingText}
          isStreaming={llm.isStreaming}
          isReading={isReading}
          onToggleTTS={onToggleTTS ? () => onToggleTTS(llm.streamingText || match.closingText.text) : undefined}
          onStreamComplete={onStreamComplete}
        />
      )}
    </>
  );
}

// ── Dashboard-builder turn ────────────────────────────────────────────────────

function DashboardBuilderTurnRenderer({
  turn,
  onStreamEnd,
  onToggleTTS,
  isReading,
  onStreamComplete,
  onWidgetsReady,
  onSaveDashboard,
  onEditDashboard,
  generateCtx,
}: {
  turn: KaiTurn;
  onStreamEnd: (closingText?: string) => void;
  onToggleTTS?: (text: string) => void;
  isReading?: boolean;
  onStreamComplete?: (text: string) => void;
  onWidgetsReady?: (widgets: ParsedWidget[]) => void;
  onSaveDashboard: (dashboardData: DashboardCompositeData, title: string, description: string) => void;
  onEditDashboard: (dashboardData: DashboardCompositeData) => void;
  generateCtx: GenerateContext;
}) {
  const match = turn.pageContextMatch!;
  const didEnd = useRef(false);
  const [dismissed, setDismissed] = useState(false);
  const [widgetsDone, setWidgetsDone] = useState(false);

  useEffect(() => {
    if (!didEnd.current) {
      didEnd.current = true;
      setWidgetsDone(true);
      onWidgetsReady?.(match.widgets);
      onStreamEnd(match.closingText?.text);
    }
  }, [onStreamEnd, onWidgetsReady, match.widgets, match.closingText]);

  // T5: dashboard/report narrative
  const llm = useKaiGenerate({
    enabled: generateCtx.aiMode,
    capability: 'dashboard',
    userQuery: generateCtx.userQuery,
    widgetData: match.widgets,
    persona: generateCtx.persona,
    customInstructions: generateCtx.customInstructions,
    pageContext: generateCtx.pageContext,
    includeFinancial: generateCtx.includeFinancial,
    widgetsDone,
  });

  const dashboardWidget = match.widgets.find((w) => w.widgetType === 'UW-030');
  const dashboardData = dashboardWidget?.data as DashboardCompositeData | undefined;

  // Patch ConsentBanner handlers into the AW-012 widget
  const widgets = match.widgets.map((w) => ({ ...w, key: `${turn.id}:${w.key}` }));

  const consentHandlers: ConsentHandlers = {
    onConfirm: () => {
      if (!dashboardData) return;
      onSaveDashboard(dashboardData, dashboardData.title, dashboardData.description);
    },
    onEdit: () => {
      if (!dashboardData) return;
      onEditDashboard(dashboardData);
    },
    onCancel: () => {
      setDismissed(true);
    },
    onResetEdit: () => {},
    isConfirming: false,
  };

  return (
    <>
      <div style={{ transition: 'opacity 400ms ease', opacity: dismissed ? 0.4 : 1 }}>
        <KaiResponse widgets={widgets} consentHandlers={consentHandlers} />
        {match.closingText && (
          <CanvasTextBlock
            closingText={match.closingText}
            streamingText={llm.failed ? '' : llm.streamingText}
            isStreaming={llm.isStreaming}
            isReading={isReading}
            onToggleTTS={onToggleTTS ? () => onToggleTTS(llm.streamingText || match.closingText.text) : undefined}
            onStreamComplete={onStreamComplete}
          />
        )}
      </div>
    </>
  );
}

// ── Email turn (email-draft / email-shorter) ──────────────────────────────────
// In Demo mode: renders the full fixture (hardcoded Subject + Body).
// In AI mode: shows only the To field, streams the LLM email into Subject + Body,
//             then shows a static CanvasTextBlock asking the user to send or edit.

function parseEmailStream(text: string): { subject: string; body: string } {
  const lines = text.split('\n');
  let subject = '';
  const bodyLines: string[] = [];
  let inBody = false;
  for (const line of lines) {
    if (!inBody && line.toLowerCase().startsWith('subject:')) {
      subject = line.slice(line.indexOf(':') + 1).trim();
    } else if (!inBody && subject) {
      // First non-empty line after subject starts the body
      if (line.trim()) inBody = true;
      if (inBody) bodyLines.push(line);
    } else if (inBody) {
      bodyLines.push(line);
    }
  }
  return { subject, body: bodyLines.join('\n') };
}

function EmailTurnRenderer({
  turn,
  onStreamEnd,
  onToggleTTS,
  isReading,
  onStreamComplete,
  onWidgetsReady,
  generateCtx,
}: {
  turn: KaiTurn;
  onStreamEnd: (closingText?: string) => void;
  onToggleTTS?: (text: string) => void;
  isReading?: boolean;
  onStreamComplete?: (text: string) => void;
  onWidgetsReady?: (widgets: ParsedWidget[]) => void;
  generateCtx: GenerateContext;
}) {
  const isEmailShorter = turn.useCase === 'email-shorter';
  const capability = isEmailShorter ? 'email-tone' : 'email-draft';

  const { widgets: streamedWidgets, isStreaming: fixtureStreaming, closingText } = useStreamSimulator(
    turn.useCase as 'email-draft' | 'email-shorter' | 'cap1-email-draft',
    turn.id,
    'widgets' as ResponseMode,
    'professional',
    turn.userQuery,
  );

  const didEnd = useRef(false);
  const [widgetsDone, setWidgetsDone] = useState(false);
  const [fixtureStreamDone, setFixtureStreamDone] = useState(false);
  const didStream = useRef(false);

  useEffect(() => {
    if (fixtureStreaming) didStream.current = true;
  }, [fixtureStreaming]);

  useEffect(() => {
    if (!fixtureStreaming && didStream.current && !fixtureStreamDone) {
      setFixtureStreamDone(true);
    }
  }, [fixtureStreaming, fixtureStreamDone]);

  useEffect(() => {
    if (fixtureStreamDone && !widgetsDone) {
      setWidgetsDone(true);
      onWidgetsReady?.(streamedWidgets);
    }
  }, [fixtureStreamDone, widgetsDone, streamedWidgets, onWidgetsReady]);

  // For chip-chained email turns (cap1-email-draft fired off a confirmed task),
  // prepend the prior turn's widgets so the LLM sees the exact task fields the
  // user confirmed (lead, title, due date, assignee, priority) and grounds the
  // email body in that data.
  const enrichedEmailWidgetData = turn.priorContextWidgets && turn.priorContextWidgets.length > 0
    ? [...turn.priorContextWidgets, ...streamedWidgets]
    : streamedWidgets;

  const llm = useKaiGenerate({
    enabled: generateCtx.aiMode,
    capability,
    userQuery: generateCtx.userQuery,
    widgetData: enrichedEmailWidgetData,
    persona: generateCtx.persona,
    customInstructions: generateCtx.customInstructions,
    pageContext: generateCtx.pageContext,
    includeFinancial: generateCtx.includeFinancial,
    widgetsDone,
  });

  // When LLM stream is done, call onStreamEnd
  useEffect(() => {
    if (!generateCtx.aiMode && fixtureStreamDone && !didEnd.current) {
      didEnd.current = true;
      onStreamEnd(closingText?.text);
      return;
    }
    if (generateCtx.aiMode && !llm.isStreaming && (llm.streamingText.length > 0 || llm.failed) && !didEnd.current) {
      didEnd.current = true;
      const successText = isEmailShorter
        ? 'Done — trimmed and ready. Want to adjust further or copy this to send?'
        : 'Draft ready. Want to adjust the tone, shorten it, or send this?';
      onStreamEnd(llm.failed ? (closingText?.text ?? successText) : successText);
    }
  }, [generateCtx.aiMode, fixtureStreamDone, llm.isStreaming, llm.streamingText, closingText, onStreamEnd, isEmailShorter]);

  // In AI mode, patch the email widget with streamed content
  const widgets = streamedWidgets.map((w) => {
    if (!generateCtx.aiMode) return w;
    if (w.widgetType !== 'UW-003') return w;
    const { subject, body } = parseEmailStream(llm.streamingText);
    const originalFields = (w.data as { fields?: { label: string; value: string }[] }).fields ?? [];
    const toField = originalFields.find((f) => f.label === 'To') ?? { label: 'To', value: '' };
    const patchedFields: { label: string; value: string }[] = [toField];
    if (subject || llm.isStreaming) {
      patchedFields.push({ label: 'Subject', value: subject });
    }
    if (body || (llm.isStreaming && subject)) {
      patchedFields.push({ label: 'Body', value: body });
    }
    return {
      ...w,
      data: {
        ...(w.data as object),
        fields: patchedFields,
      },
    };
  });

  const successClosingText = {
    type: 'description' as const,
    text: isEmailShorter
      ? 'Done — trimmed and ready. Want to adjust further or copy this to send?'
      : 'Draft ready. Want to adjust the tone, shorten it, or send this?',
  };

  // In AI mode with failed stream, use fixture closing text as fallback
  const displayClosingText = generateCtx.aiMode
    ? successClosingText
    : (closingText ?? successClosingText);

  // Only show CanvasTextBlock once email content is done (not while streaming into widget)
  const showCanvas = !generateCtx.aiMode
    ? (widgetsDone && !!closingText)
    : (!llm.isStreaming && (llm.streamingText.length > 0 || llm.failed));

  // Detect the "Email this report" variant from the user query and append an
  // attachment chip below the email card. Matches the same predicate used in
  // useStreamSimulator's effectiveUseCase routing.
  const isReportSummary =
    !isEmailShorter &&
    !!turn.userQuery &&
    (turn.userQuery.toLowerCase().includes('report summary') ||
      (turn.userQuery.toLowerCase().includes('report') && turn.userQuery.toLowerCase().includes('leadership')));

  return (
    <>
      <KaiResponse widgets={widgets} />
      {isReportSummary && widgetsDone && (
        <EmailAttachmentChip
          filename="q1-sales-report.png"
          sizeLabel="248 KB"
          downloadStem="kai-q1-sales-report"
        />
      )}
      {showCanvas && (
        <CanvasTextBlock
          closingText={displayClosingText}
          isReading={isReading}
          onToggleTTS={onToggleTTS ? () => onToggleTTS(displayClosingText.text) : undefined}
          onStreamComplete={onStreamComplete}
        />
      )}
    </>
  );
}

// ── Dispatcher ───────────────────────────────────────────────────────────────

// ── Restored turn renderer ────────────────────────────────────────────────────
// Used when a turn is rehydrated from history. Renders the saved widget
// snapshot + LLM text exactly as captured, with no streaming, no LLM calls,
// no consent hooks — entirely deterministic.

function rehydrateWidget(sw: SerializedWidget): ParsedWidget {
  const Component = resolveWidget(sw.widgetType);
  return {
    key: sw.key,
    widgetType: sw.widgetType,
    Component,
    data: sw.data,
    config: sw.config,
    highlights: sw.highlights,
    frameId: sw.frameId ?? `restored-${sw.key}`,
    frameType: (sw.frameType ?? 'result') as ParsedWidget['frameType'],
    branchId: sw.branchId,
  };
}

function RestoredTurnRenderer({
  turn,
  onStreamEnd,
}: {
  turn: KaiTurn;
  onStreamEnd: (closingText?: string) => void;
}) {
  const didEnd = useRef(false);
  useEffect(() => {
    if (!didEnd.current) {
      didEnd.current = true;
      onStreamEnd(turn.restoredClosingText?.text);
    }
  }, [onStreamEnd, turn.restoredClosingText]);

  if (turn.useCase === 'unknown' && turn.unknownReply) {
    return (
      <div className="flex justify-start mb-4">
        <div className="max-w-[85%] w-full bg-transparent px-4 py-3">
          <p className="text-[13.5px] text-[var(--text2)] leading-relaxed font-sans">
            {turn.unknownReply}
          </p>
        </div>
      </div>
    );
  }

  const widgets: ParsedWidget[] = (turn.restoredWidgets ?? []).map(rehydrateWidget);
  const closingText = turn.restoredClosingText
    ? (turn.restoredClosingText as unknown as import('@/lib/types').ClosingText)
    : undefined;

  return (
    <>
      <KaiResponse widgets={widgets} closingText={closingText} />
      {closingText && (
        <CanvasTextBlock
          closingText={closingText}
          streamingText={turn.restoredLlmText ?? ''}
          isStreaming={false}
        />
      )}
    </>
  );
}

function KaiTurnRenderer({
  turn,
  responseMode,
  personalityId,
  onSelect,
  onStreamEnd,
  onFormReady,
  onToggleTTS,
  isReading,
  onStreamComplete,
  onConfirmed,
  onWorkflowActivated,
  onNavigate,
  onWidgetsReady,
  onSaveDashboard,
  onEditDashboard,
  onSaveAsDashboardFromAd17,
  onClarificationConfirm,
  onClarificationCancel,
  onWorkflowClarificationConfirm,
  onWorkflowClarificationCancel,
  generateCtx,
}: {
  turn: KaiTurn;
  responseMode: ResponseMode;
  personalityId: import('@/lib/types').PersonalityId;
  onSelect: (q: string) => void;
  onStreamEnd: (closingText?: string) => void;
  onFormReady?: (fields: FormFieldSnapshot[]) => void;
  onToggleTTS?: (text: string) => void;
  isReading?: boolean;
  onStreamComplete?: (text: string) => void;
  onConfirmed?: (fields: import('@/hooks/useConsentFlow').FormField[]) => void;
  onWorkflowActivated?: (workflowId: WorkflowId) => void;
  onNavigate?: (route: string) => void;
  onWidgetsReady?: (widgets: ParsedWidget[]) => void;
  onSaveDashboard?: (dashboardData: DashboardCompositeData, title: string, description: string) => void;
  onEditDashboard?: (dashboardData: DashboardCompositeData) => void;
  onSaveAsDashboardFromAd17?: (widgets: ParsedWidget[]) => void;
  onClarificationConfirm?: (turnId: string, labels: string[]) => void;
  onClarificationCancel?: (turnId: string) => void;
  onWorkflowClarificationConfirm?: (turnId: string, selectedIds: string[]) => void;
  onWorkflowClarificationCancel?: (turnId: string) => void;
  generateCtx: GenerateContext;
}) {
  if (turn.isRestored) {
    return <RestoredTurnRenderer turn={turn} onStreamEnd={onStreamEnd} />;
  }
  if (turn.useCase === 'dashboard-builder') {
    return (
      <DashboardBuilderTurnRenderer
        turn={turn}
        onStreamEnd={onStreamEnd}
        onToggleTTS={onToggleTTS}
        isReading={isReading}
        onStreamComplete={onStreamComplete}
        onWidgetsReady={onWidgetsReady}
        onSaveDashboard={onSaveDashboard ?? (() => {})}
        onEditDashboard={onEditDashboard ?? (() => {})}
        generateCtx={generateCtx}
      />
    );
  }
  if (turn.useCase === 'page-context') {
    return <PageContextTurnRenderer turn={turn} onStreamEnd={onStreamEnd} onToggleTTS={onToggleTTS} isReading={isReading} onStreamComplete={onStreamComplete} onWidgetsReady={onWidgetsReady} generateCtx={generateCtx} />;
  }
  if (turn.useCase === 'docs-qa') {
    return <DocsQATurnRenderer turn={turn} onStreamEnd={onStreamEnd} onToggleTTS={onToggleTTS} isReading={isReading} onStreamComplete={onStreamComplete} generateCtx={generateCtx} />;
  }
  if (turn.useCase === 'unknown') {
    return <UnknownTurnRenderer turn={turn} onSelect={onSelect} onStreamEnd={onStreamEnd} />;
  }
  if (turn.useCase === 'metric-clarification') {
    return (
      <MetricClarificationTurnRenderer
        turn={turn}
        onStreamEnd={onStreamEnd}
        onConfirmClarification={onClarificationConfirm ?? (() => {})}
        onCancelClarification={onClarificationCancel ?? (() => {})}
      />
    );
  }
  if (turn.useCase === 'workflow-clarification') {
    return (
      <WorkflowClarificationTurnRenderer
        turn={turn}
        onStreamEnd={onStreamEnd}
        onConfirmClarification={onWorkflowClarificationConfirm ?? (() => {})}
        onCancelClarification={onWorkflowClarificationCancel ?? (() => {})}
      />
    );
  }
  if (turn.useCase === 'uc2-restage') {
    return <RestageRenderer turn={turn} onStreamEnd={onStreamEnd} onToggleTTS={onToggleTTS} isReading={isReading} onFormReady={onFormReady} />;
  }
  if (
    turn.useCase === 'uc2' ||
    turn.useCase === 'uc3' ||
    turn.useCase === 'uc2-order' ||
    turn.useCase === 'sr2-reorder' ||
    turn.useCase === 'ad29-workflow' ||
    // Audrey vDemo caps 1–6 — all have AW-004 + AW-012 staged-form flows
    turn.useCase === 'cap1-task-email' ||
    turn.useCase === 'cap2-lead-creation' ||
    turn.useCase === 'cap2-auto-task' ||
    turn.useCase === 'cap3-lead-won' ||
    turn.useCase === 'cap4-merge-customer' ||
    turn.useCase === 'cap5-user-creation' ||
    turn.useCase === 'cap6-catalog-builder'
  ) {
    return <ConsentTurnRenderer turn={turn} responseMode={responseMode} personalityId={personalityId} onStreamEnd={onStreamEnd} onFormReady={onFormReady} onToggleTTS={onToggleTTS} isReading={isReading} onStreamComplete={onStreamComplete} onConfirmed={onConfirmed} onWorkflowActivated={onWorkflowActivated} onNavigate={onNavigate} onWidgetsReady={onWidgetsReady} generateCtx={generateCtx} />;
  }
  if (turn.useCase === 'email-draft' || turn.useCase === 'email-shorter' || turn.useCase === 'cap1-email-draft') {
    return <EmailTurnRenderer turn={turn} onStreamEnd={onStreamEnd} onToggleTTS={onToggleTTS} isReading={isReading} onStreamComplete={onStreamComplete} onWidgetsReady={onWidgetsReady} generateCtx={generateCtx} />;
  }
  return <StandardTurnRenderer turn={turn} responseMode={responseMode} personalityId={personalityId} onStreamEnd={onStreamEnd} onToggleTTS={onToggleTTS} isReading={isReading} onStreamComplete={onStreamComplete} onWidgetsReady={onWidgetsReady} onSaveAsDashboardFromAd17={onSaveAsDashboardFromAd17} generateCtx={generateCtx} />;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

// Encodes confidence into a coloured progress bar appended to the result string.
// AgentReasoningCard renders result as plain text so we embed a sentinel that
// the StepTimeline can detect and render specially. Instead, we store the
// confidence on the step itself as a custom field — AgentReasoningCard reads it.
// Original SKU prices from the canonical sr2-reorder fixture. Keep in sync if
// the fixture line items change. Used to compute the live "Reorder" column +
// quantity deltas in the sr2-compare side-by-side table.
const SR2_SKU_PRICES: Record<string, number> = {
  'Artisan Table Lamp - Brass': 185,
  'Linen Throw - Sand': 89,
  'Wall Sconce - Matte Black': 245,
  'Ceramic Vase - Sage': 129,
};

function parseLineItems(itemsValue: string): { sku: string; qty: number }[] {
  if (!itemsValue) return [];
  // Match `<sku> [× | x | X] <qty>` with any surrounding whitespace.
  // Some inputs may contain unicode × (U+00D7) or ASCII x; both supported.
  const re = /^\s*(.+?)\s*[×xX]\s*(\d+)\s*$/;
  return itemsValue.split(',').map((chunk) => {
    const m = chunk.match(re);
    if (!m) return { sku: chunk.trim(), qty: 0 };
    return { sku: m[1].trim(), qty: Number(m[2]) };
  });
}

function patchCompareWidget(widget: ParsedWidget, liveFields: FormFieldSnapshot[]): ParsedWidget {
  const itemsField = liveFields.find((f) => f.fieldId === 'items')?.value ?? '';
  const subtotalField = liveFields.find((f) => f.fieldId === 'subtotal')?.value ?? '';
  const discountField = liveFields.find((f) => f.fieldId === 'discount')?.value ?? '';
  const deliveryField = liveFields.find((f) => f.fieldId === 'deliveryDate')?.value ?? '';
  const liveItems = parseLineItems(itemsField);

  const data = widget.data as Record<string, unknown>;
  const origRows = (data.rows as Array<Record<string, string>> | undefined) ?? [];

  // Build a map of original quantities by SKU from the fixture's `original` cell.
  const origQtyBySku = new Map<string, number>();
  for (const row of origRows) {
    const sku = row.sku;
    const orig = row.original ?? '';
    const m = orig.match(/(\d+)\s*@/);
    if (sku && m) origQtyBySku.set(sku, Number(m[1]));
  }

  const skuRows = liveItems.map(({ sku, qty }) => {
    const origQty = origQtyBySku.get(sku);
    const price = SR2_SKU_PRICES[sku];
    const reorder = price ? `${qty} @ $${price.toFixed(2)}` : `${qty}`;
    let delta = '—';
    if (origQty === undefined) delta = 'new';
    else if (qty !== origQty) delta = `${qty - origQty > 0 ? '+' : ''}${qty - origQty}`;
    return {
      sku,
      original: origQty !== undefined && price ? `${origQty} @ $${price.toFixed(2)}` : '—',
      reorder,
      delta,
    };
  });

  // Find the original "Subtotal", "Discount", "Delivery" rows verbatim and
  // overwrite their `reorder` column with the live form values.
  const origSubtotalRow = origRows.find((r) => r.sku === 'Subtotal');
  const origDiscountRow = origRows.find((r) => r.sku === 'Discount');
  const origDeliveryRow = origRows.find((r) => r.sku === 'Delivery');

  const liveDelivery = deliveryField
    ? new Date(deliveryField + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : (origDeliveryRow?.reorder ?? '—');

  const summaryRows: Array<Record<string, string>> = [];
  if (origSubtotalRow) {
    summaryRows.push({
      sku: 'Subtotal',
      original: origSubtotalRow.original,
      reorder: subtotalField || origSubtotalRow.reorder,
      delta: subtotalField && subtotalField !== origSubtotalRow.original ? 'updated' : '—',
    });
  }
  if (origDiscountRow) {
    summaryRows.push({
      sku: 'Discount',
      original: origDiscountRow.original,
      reorder: discountField || origDiscountRow.reorder,
      delta: discountField && discountField !== origDiscountRow.original ? 'updated' : '—',
    });
  }
  if (origDeliveryRow) {
    summaryRows.push({
      sku: 'Delivery',
      original: origDeliveryRow.original,
      reorder: liveDelivery,
      delta: liveDelivery !== origDeliveryRow.original ? 'updated' : '—',
    });
  }

  return {
    ...widget,
    data: {
      ...data,
      rows: [...skuRows, ...summaryRows],
    },
  };
}

function injectClassificationStep(widget: ParsedWidget, cls: KaiClassification): ParsedWidget {
  const data = widget.data as Record<string, unknown>;
  const existingSteps = Array.isArray(data.steps) ? data.steps : [];
  const confidence = cls.confidence;
  const confidenceLabel =
    confidence === undefined ? 'n/a'
      : confidence > 0.9 ? 'High confidence'
        : confidence >= 0.7 ? 'Medium confidence'
          : 'Low confidence — may need clarification';

  const classificationStep = {
    step: 0,
    action: 'intent_classification',
    result: `${cls.useCase} (${cls.classification ?? 'unknown'}), confidence: ${confidence !== undefined ? confidence.toFixed(2) : 'n/a'
      } — ${confidenceLabel}`,
    ms: cls.latencyMs ?? 0,
    // Custom fields read by StepTimeline for the confidence bar
    confidence,
    confidenceLabel,
  };
  return {
    ...widget,
    data: {
      ...data,
      steps: [classificationStep, ...existingSteps],
    },
  };
}

function delay(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

interface PageContextPayload {
  page: string;
  visibleData?: unknown[];
  activeFilters?: string[];
}

async function fetchWithTimeout(
  message: string,
  timeoutMs: number,
  personalitySuffix?: string,
  pageContext?: PageContextPayload,
  customInstructions?: string,
  includeFinancial = true,
): Promise<KaiClassification> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const t0 = Date.now();
    const res = await fetch('/api/kai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, personalitySuffix, pageContext, customInstructions, includeFinancial }),
      signal: controller.signal,
    });
    const latencyMs = Date.now() - t0;
    const json = await res.json();
    console.log('[Kai AI classification]', json, `(${latencyMs}ms)`);
    return { ...json, latencyMs };
  } finally {
    clearTimeout(timer);
  }
}

async function classifyWithAI(
  message: string,
  personalitySuffix?: string,
  pageContext?: PageContextPayload,
  customInstructions?: string,
  includeFinancial = true,
): Promise<{ cls: KaiClassification; timedOut: boolean }> {
  try {
    const cls = await fetchWithTimeout(message, AI_TIMEOUT_MS, personalitySuffix, pageContext, customInstructions, includeFinancial);
    return { cls, timedOut: false };
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      return { cls: { useCase: 'unknown', error: 'timeout' }, timedOut: true };
    }
    // First attempt failed (non-timeout) — retry once
    console.warn('[Kai] API call failed, retrying in 500ms…', err);
    await delay(AI_RETRY_DELAY_MS);
    try {
      const cls = await fetchWithTimeout(message, AI_TIMEOUT_MS, personalitySuffix, pageContext, customInstructions, includeFinancial);
      return { cls, timedOut: false };
    } catch (retryErr) {
      console.error('[Kai] Retry also failed, falling back to keyword match', retryErr);
      return { cls: { useCase: 'unknown', error: 'retry_failed' }, timedOut: false };
    }
  }
}

// ── Shell ─────────────────────────────────────────────────────────────────────

export default function ChatShell() {
  const searchParams = useSearchParams();
  const aiMode = searchParams.get('ai') === 'true';
  const { pendingQuery, setPendingQuery, focusChatSignal, setView, currentView } = useLayout();
  const { mode: responseMode } = useResponseMode();
  const { selectedPersonality } = usePersona();
  const { currentPage, pageData, pageActions, starterPrompts, proactiveBrief } = usePageContext();
  const {
    customInstructions, proactiveAssistance, includeFinancial, readAloud,
    autoSendVoice, notificationSounds, requireConfirmation, autoSaveArtifacts,
  } = useUserPreferences();
  const customInstructionsRef = useRef(customInstructions);
  useEffect(() => { customInstructionsRef.current = customInstructions; }, [customInstructions]);
  const { addSession, updateSession } = useChatHistory();
  const { registerSaveAndReset, pendingRestore, consumePendingRestore } = useChatSession();
  const { addTask, addLead, archiveLead } = useSharedCRM();
  const { addOrder } = useSharedOrders();
  const { addCustomer } = useSharedCustomers();
  const { triggerNudge } = useNudge();
  const { tourPrefill, clearTourPrefill, notifyTourWidgetsReady, notifyTourQuerySent, notifyTourChipClicked, resumeTour } = useGuidedTour();

  // When AI mode is active, show a distinct message in the thinking indicator
  const [thinkingMessage, setThinkingMessage] = useState<string | undefined>(undefined);

  // Consecutive chip-triggered turns (reset on manual send)
  const chipChainDepthRef = useRef(0);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hello! I'm Kai, your AI business assistant. How can I help you today?",
      timestamp: Date.now(),
    },
  ]);
  const [kaiTurns, setKaiTurns] = useState<KaiTurn[]>([]);
  // Snapshot of uc2 form fields captured when a uc2 turn finishes streaming
  const [currentRestageableFields, setCurrentRestageableFields] = useState<FormFieldSnapshot[]>([]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [activeStreams, setActiveStreams] = useState(0);
  const [toast, setToast] = useState<string | null>(null);
  const [inputShaking, setInputShaking] = useState(false);
  const [speakingTurnId, setSpeakingTurnId] = useState<string | null>(null);
  const [saveDashboardModal, setSaveDashboardModal] = useState<{
    dashboardData: DashboardCompositeData;
    title: string;
    description: string;
  } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const scrollAnchorRef = useRef<HTMLDivElement>(null);
  const thinkingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const voice = useVoice();
  // True when the most recent user input came from voice (drives TTS after render)
  const lastInputWasVoiceRef = useRef(false);
  // Pending closing text to speak once streaming ends
  const pendingTtsRef = useRef<string | null>(null);
  // Widgets from the most-recently-completed turn — used for template var resolution
  const lastTurnWidgetsRef = useRef<ParsedWidget[]>([]);
  // Tracks widget keys we've already auto-saved this session — keeps re-renders
  // from double-saving the same artifact (e.g. React strict-mode double mount).
  const autoSavedKeysRef = useRef<Set<string>>(new Set());
  // History capture: rendered widgets + streamed LLM text per turn id.
  const turnIdToWidgetsRef = useRef<Record<string, ParsedWidget[]>>({});
  const turnIdToLlmTextRef = useRef<Record<string, string>>({});
  // Session lifecycle bookkeeping for history save.
  const sessionStartRef = useRef<number>(Date.now());
  const sessionIdRef = useRef<string>(`s-${Date.now()}`);
  // Live mirrors of messages/turns for save snapshots (avoid stale closures).
  const messagesRef = useRef<Message[]>([]);
  const kaiTurnsRef = useRef<KaiTurn[]>([]);

  const isStreaming = activeStreams > 0;
  const isBusy = isThinking || isStreaming;

  const scrollToBottom = useCallback(() => {
    scrollAnchorRef.current?.scrollIntoView({ block: 'end', behavior: 'instant' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages.length, kaiTurns.length, isThinking, scrollToBottom]);

  // Keep refs in sync for the save-on-new-chat snapshot path.
  useEffect(() => { messagesRef.current = messages; }, [messages]);
  useEffect(() => { kaiTurnsRef.current = kaiTurns; }, [kaiTurns]);

  useEffect(() => {
    return () => {
      if (thinkingTimerRef.current) clearTimeout(thinkingTimerRef.current);
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);


  const showToast = useCallback((text: string) => {
    setToast(text);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToast(null), 2500);
  }, []);

  const shakeInput = useCallback(() => {
    setInputShaking(true);
    setTimeout(() => setInputShaking(false), 450);
    inputRef.current?.focus();
  }, []);

  const handleStreamEnd = useCallback((closingText?: string) => {
    if (closingText) pendingTtsRef.current = closingText;
    setActiveStreams((prev) => {
      const next = Math.max(0, prev - 1);
      if (next === 0 && lastInputWasVoiceRef.current && pendingTtsRef.current) {
        voice.speak(pendingTtsRef.current);
        pendingTtsRef.current = null;
        lastInputWasVoiceRef.current = false;
      }
      return next;
    });
    setKaiTurns((prev) => {
      const last = prev[prev.length - 1];
      if (last && (last.useCase === 'email-draft' || last.useCase === 'email-shorter')) {
        setTimeout(() => triggerNudge('email'), 0);
      }
      return prev;
    });
  }, [voice, triggerNudge]);

  const handleFormReady = useCallback((fields: FormFieldSnapshot[]) => {
    setCurrentRestageableFields(fields);
  }, []);

  const handleStreamComplete = useCallback((turnId: string, text: string) => {
    if (turnId) turnIdToLlmTextRef.current[turnId] = text;
    if (readAloud) {
      if (voice.isSpeaking) voice.stopSpeaking();
      voice.speak(text);
    } else if (notificationSounds) {
      // Only chime when we're not also reading aloud — avoid overlap.
      playNotifySound();
    }
  }, [readAloud, notificationSounds, voice]);

  const handleToggleTTS = useCallback((turnId: string, text: string) => {
    // Stop if this turn is already speaking, OR if auto-speak is running
    // (speakingTurnId may be null when speech was triggered programmatically).
    if (voice.isSpeaking && (speakingTurnId === turnId || speakingTurnId === null)) {
      voice.stopSpeaking();
      setSpeakingTurnId(null);
    } else {
      if (voice.isSpeaking) voice.stopSpeaking();
      // Unlock audio on first manual click — this is a user gesture so it's safe.
      unlockAudio();
      setSpeakingTurnId(turnId);
      voice.speak(text);
    }
  }, [speakingTurnId, voice]);

  const spawnDocsQATurn = useCallback((qaPair: import('@/lib/types').DocsQAPair) => {
    setIsThinking(false);
    setThinkingMessage(undefined);
    setKaiTurns((prev) => [...prev, { id: (Date.now() + 1).toString(), useCase: 'docs-qa' as const, docsQA: qaPair }]);
    setActiveStreams((n) => n + 1);
    thinkingTimerRef.current = null;
  }, []);

  const spawnPageContextTurn = useCallback((match: PageContextMatch, fromChip = false) => {
    setIsThinking(false);
    setThinkingMessage(undefined);
    setKaiTurns((prev) => [...prev, {
      id: (Date.now() + 1).toString(),
      useCase: 'page-context' as const,
      pageContextMatch: match,
      ...(fromChip ? { fromChip: true } : {}),
    }]);
    setActiveStreams((n) => n + 1);
    thinkingTimerRef.current = null;
  }, []);

  const spawnTurn = useCallback((useCase: UseCase | 'email-draft' | 'email-shorter', trimmed: string, aiClassification?: KaiClassification, fromChip = false) => {
    // Intercept unknown → docs Q&A before falling through to the generic unknown reply
    if (useCase === 'unknown') {
      const { matched, qaPair } = useDocsQA(trimmed);
      if (matched && qaPair) {
        spawnDocsQATurn(qaPair);
        return;
      }
    }
    setIsThinking(false);
    setThinkingMessage(undefined);
    // Carry forward email context: if rewriting an email and the previous email
    // turn was a handoff/customer-notify variant, tag the new userQuery so the
    // simulator routes to the matching variant fixture.
    let resolvedQuery = trimmed;
    if (useCase === 'email-shorter') {
      const lastEmail = [...kaiTurns].reverse().find((t) => t.useCase === 'email-draft' || t.useCase === 'email-shorter');
      const lastQ = lastEmail?.userQuery?.toLowerCase() ?? '';
      if (lastQ.includes('handoff email') || lastQ.includes('__handoff__')) {
        resolvedQuery = `${trimmed} __handoff__`;
      } else if ((lastQ.includes('notification') || lastQ.includes('notify')) && (lastQ.includes('new rep') || lastQ.includes('affected customers') || lastQ.includes('__customernotify__'))) {
        resolvedQuery = `${trimmed} __customernotify__`;
      }
    }
    const turn: KaiTurn = {
      id: (Date.now() + 1).toString(),
      useCase,
      userQuery: resolvedQuery,
      ...(useCase === 'unknown' ? { unknownReply: getUnknownReply(trimmed) } : {}),
      ...(aiClassification ? { aiClassification } : {}),
      ...(fromChip ? { fromChip: true } : {}),
    };
    if (useCase !== 'unknown') {
      setActiveStreams((n) => n + 1);
    }
    setKaiTurns((prev) => [...prev, turn]);
    thinkingTimerRef.current = null;
  }, [spawnDocsQATurn, kaiTurns]);

  // ── ad17-report metric helpers ─────────────────────────────────────────────
  // Declared above handleSend because handleSend invokes
  // handleAd17MetricsRequest in its body for manual-typed metric requests.

  // Spawns a new ad17-report turn with `labels` appended via the metric catalog.
  // Reuses the existing render path — only the new turn is set to in-progress;
  // the prior ad17-report turn is dimmed via isStale.
  const spawnAd17WithMetrics = useCallback((newLabels: string[], userQueryText: string) => {
    setKaiTurns((prev) => {
      // Find the most recent ad17-report turn so we can carry forward its
      // previously-added metrics (avoids losing them on chained adds).
      let priorAdded: string[] = [];
      for (let i = prev.length - 1; i >= 0; i--) {
        if (prev[i].useCase === 'ad17-report') {
          priorAdded = prev[i].ad17AddedMetrics ?? [];
          break;
        }
      }
      const merged: string[] = [...priorAdded];
      for (const l of newLabels) {
        if (!merged.includes(l)) merged.push(l);
      }
      const updated = prev.map((t, i) =>
        i === prev.length - 1 && !t.isStale ? { ...t, isStale: true } : t,
      );
      return [
        ...updated,
        {
          id: (Date.now() + 2).toString(),
          useCase: 'ad17-report' as const,
          userQuery: userQueryText,
          ad17AddedMetrics: merged,
          fromChip: true,
        },
      ];
    });
    setActiveStreams((n) => n + 1);
  }, []);

  // Reads the current ad17-report metric labels from the last-turn widget snapshot.
  const getCurrentAd17Labels = useCallback((): string[] => {
    const metricRow = lastTurnWidgetsRef.current.find((w) => w.widgetType === 'UW-002');
    if (!metricRow) return [];
    const cards = ((metricRow.data as { cards?: Record<string, unknown>[] }).cards) ?? [];
    return cards.map((c) => String(c.label)).filter(Boolean);
  }, []);

  // Handles the ad17 "Add more metrics" path: posts to /api/kai/restage-metrics
  // and either spawns a metric-clarification turn (intent=clarify) or a new
  // ad17-report turn with labels applied (intent=apply).
  const handleAd17MetricsRequest = useCallback(async (userQueryText: string) => {
    setIsThinking(true);
    setThinkingMessage(aiMode ? 'Choosing the right metrics…' : undefined);
    if (thinkingTimerRef.current) clearTimeout(thinkingTimerRef.current);
    const currentLabels = getCurrentAd17Labels();
    try {
      const res = await fetch('/api/kai/restage-metrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userQueryText, scope: 'ad17-report', currentLabels }),
      });
      const data = await res.json() as
        | { intent: 'apply'; add: string[]; remove: string[] }
        | { intent: 'clarify'; candidates: string[]; prompt: string };

      setIsThinking(false);
      setThinkingMessage(undefined);

      if (data.intent === 'apply' && data.add.length > 0) {
        spawnAd17WithMetrics(data.add, userQueryText);
        return;
      }

      // Clarify path — spawn a metric-clarification turn that holds the
      // candidates so the AW-006 ClarificationCard can render them. Do NOT
      // stale the prior ad17-report turn here; staling happens only when the
      // user confirms a selection. Cancelling removes the clarification turn
      // entirely and leaves ad17-report as the active turn.
      setKaiTurns((prev) => [
        ...prev,
        {
          id: (Date.now() + 2).toString(),
          useCase: 'metric-clarification' as const,
          userQuery: userQueryText,
          clarificationPayload: {
            scope: 'ad17-report',
            prompt: data.intent === 'clarify' ? data.prompt : 'Which metrics would you like to add?',
            candidates: data.intent === 'clarify' ? data.candidates : [],
            currentLabels,
          },
          fromChip: true,
        },
      ]);
      setActiveStreams((n) => n + 1);
    } catch (err) {
      console.error('[ad17 metrics request error]', err);
      setIsThinking(false);
      setThinkingMessage(undefined);
      // Silent fall-through: spawn a clarify turn from the full catalog so
      // the user can still proceed even if the endpoint fails entirely.
      const catalog = METRIC_CATALOG['ad17-report'];
      const haveLower = new Set(currentLabels.map((l) => l.toLowerCase()));
      const candidates = catalog.map((m) => m.label).filter((l) => !haveLower.has(l.toLowerCase()));
      setKaiTurns((prev) => [
        ...prev,
        {
          id: (Date.now() + 2).toString(),
          useCase: 'metric-clarification' as const,
          userQuery: userQueryText,
          clarificationPayload: {
            scope: 'ad17-report',
            prompt: 'Which metrics would you like to add?',
            candidates,
            currentLabels,
          },
          fromChip: true,
        },
      ]);
      setActiveStreams((n) => n + 1);
    }
  }, [aiMode, getCurrentAd17Labels, spawnAd17WithMetrics]);

  // ── ad29 workflow spawn helpers (declared above handleSend for TDZ safety) ──

  // Spawns a fresh ad29-workflow turn whose widgets are driven by the catalog.
  // Used both for direct routing of specific workflow phrasings and for the
  // ClarificationCard confirm path.
  const spawnAd29WorkflowTurn = useCallback((workflowId: WorkflowId, userQueryText: string, opts?: { fromChip?: boolean }) => {
    setKaiTurns((prev) => [
      ...prev,
      {
        id: (Date.now() + 2).toString(),
        useCase: 'ad29-workflow' as const,
        userQuery: userQueryText,
        workflowId,
        ...(opts?.fromChip ? { fromChip: true } : {}),
      },
    ]);
    setActiveStreams((n) => n + 1);
  }, []);

  // Spawns an ad29-test turn carrying the prior ad29-workflow turn's
  // workflowId so the sample-data table is workflow-specific.
  const spawnAd29TestTurn = useCallback((workflowId: WorkflowId, userQueryText: string) => {
    setKaiTurns((prev) => [
      ...prev,
      {
        id: (Date.now() + 2).toString(),
        useCase: 'ad29-test' as const,
        userQuery: userQueryText,
        workflowId,
        fromChip: true,
      },
    ]);
    setActiveStreams((n) => n + 1);
  }, []);

  // Spawns a workflow-clarification turn listing the catalog as radio options.
  const spawnWorkflowClarificationTurn = useCallback((userQueryText: string, opts?: { fromChip?: boolean }) => {
    setKaiTurns((prev) => [
      ...prev,
      {
        id: (Date.now() + 2).toString(),
        useCase: 'workflow-clarification' as const,
        userQuery: userQueryText,
        workflowClarificationPayload: {
          prompt: 'Which workflow would you like to set up?',
          candidates: WORKFLOW_CATALOG.map((w) => w.id),
        },
        ...(opts?.fromChip ? { fromChip: true } : {}),
      },
    ]);
    setActiveStreams((n) => n + 1);
  }, []);

  const handleSend = useCallback(async (text: string, fromVoice = false, fromChip = false) => {
    const trimmed = text.trim();

    if (!trimmed) {
      shakeInput();
      return;
    }

    if (isBusy) {
      showToast("Kai is still thinking...");
      return;
    }

    // Notify tour that query was sent — hides overlay while Kai works
    notifyTourQuerySent();

    // Track chip chain depth: increment on chip-send, reset on manual send
    if (fromChip) {
      chipChainDepthRef.current += 1;
    } else {
      chipChainDepthRef.current = 0;
    }

    lastInputWasVoiceRef.current = fromVoice;
    pendingTtsRef.current = null;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: trimmed,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');

    // Follow-up detection (widget swap, form re-stage)
    const lastKai = kaiTurns.length > 0 ? kaiTurns[kaiTurns.length - 1] : null;
    const followUp = detectFollowUp(trimmed, lastKai?.useCase ?? null);
    if (followUp.type === 'widget-swap') {
      setIsThinking(true);
      thinkingTimerRef.current = setTimeout(() => {
        setIsThinking(false);
        setKaiTurns((prev) => {
          const updated = prev.map((t, i) =>
            i === prev.length - 1 ? { ...t, isStale: true } : t,
          );
          return [...updated, { id: (Date.now() + 1).toString(), useCase: 'uc1-swap' as const }];
        });
        setActiveStreams((n) => n + 1);
      }, 1200);
      return;
    }

    if (followUp.type === 'form-restage') {
      setIsThinking(true);
      setThinkingMessage('Applying your changes...');
      const fieldsForApi = Object.fromEntries(
        currentRestageableFields.map((f) => [f.fieldId, f.value])
      );
      try {
        const res = await fetch('/api/kai/restage', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: trimmed, currentFields: fieldsForApi }),
        });
        const { changes = [] } = await res.json() as { changes: { fieldId: string; newValue: string }[] };
        const patched = currentRestageableFields.map((f) => {
          const change = changes.find((c) => c.fieldId === f.fieldId);
          return change ? { ...f, value: change.newValue } : f;
        });
        const changeList = changes.map((c) => {
          const field = currentRestageableFields.find((f) => f.fieldId === c.fieldId);
          return `${field?.label ?? c.fieldId} → "${c.newValue}"`;
        }).join(', ');
        const summary = changes.length > 0
          ? `Applied ${changes.length} change${changes.length > 1 ? 's' : ''}: ${changeList}`
          : 'Re-staged form (no changes detected).';
        setIsThinking(false);
        setThinkingMessage(undefined);
        setKaiTurns((prev) => {
          const updated = prev.map((t, i) =>
            i === prev.length - 1 ? { ...t, isStale: true } : t,
          );
          return [...updated, {
            id: (Date.now() + 1).toString(),
            useCase: 'uc2-restage' as const,
            restagedFields: patched,
            restageChangeSummary: summary,
          }];
        });
        setActiveStreams((n) => n + 1);
      } catch {
        setIsThinking(false);
        setThinkingMessage(undefined);
        showToast('Could not apply changes — please try again.');
      }
      return;
    }

    if (aiMode) {
      setThinkingMessage('Classifying your intent...');
    } else {
      setThinkingMessage(undefined);
    }
    setIsThinking(true);

    // ad-17 metric requests (manual-typed). When the active turn is an
    // ad17-report, treat any "add/include/append X" query as a metric-add
    // request and route to /api/kai/restage-metrics. The endpoint decides
    // whether to apply (catalog hit), clarify (vague/unknown metric), or
    // surface the catalog. Carve-outs avoid hijacking clearly non-metric
    // intents (email drafts, dashboard saves, task creation, snapshots).
    if (
      lastKai?.useCase === 'ad17-report' &&
      /\b(add|include|append)\b/i.test(trimmed) &&
      !/\b(email|draft|task|dashboard|save\b|snapshot|attachment|image|note|new order|this order|an order|the order|create order)\b/i.test(trimmed)
    ) {
      if (thinkingTimerRef.current) clearTimeout(thinkingTimerRef.current);
      setIsThinking(false);
      setThinkingMessage(undefined);
      handleAd17MetricsRequest(trimmed);
      return;
    }

    // ad-29 workflow routing — hidden (workflow creation not exposed in this build)
    // {
    //   const lower = trimmed.toLowerCase();
    //   const hasSetupVerb = /\b(set up|setup|create|build|configure|make|new)\b/i.test(lower);
    //   const hasWorkflowWord = /\bworkflow\b/i.test(lower);
    //   const looksLikeWorkflowSetup = hasSetupVerb && hasWorkflowWord;
    //   if (looksLikeWorkflowSetup) {
    //     const inferred = inferWorkflowId(trimmed);
    //     if (thinkingTimerRef.current) clearTimeout(thinkingTimerRef.current);
    //     thinkingTimerRef.current = setTimeout(() => {
    //       setIsThinking(false);
    //       setThinkingMessage(undefined);
    //       if (inferred && !isVagueWorkflowRequest(trimmed)) {
    //         spawnAd29WorkflowTurn(inferred, trimmed, { fromChip });
    //       } else {
    //         spawnWorkflowClarificationTurn(trimmed, { fromChip });
    //       }
    //       thinkingTimerRef.current = null;
    //     }, 1200);
    //     return;
    //   }
    // }

    // Dashboard builder — global keywords, checked before page/general matchers
    const dashboardHit = matchDashboardQuery(trimmed);
    if (dashboardHit) {
      // Apply chart-type preference from Custom Instructions.
      // Detects "bar chart" or "line chart" directives and patches all CH-001 widgets.
      const instrLower = (customInstructionsRef.current ?? '').toLowerCase();
      const preferBar = /\bbar charts?\b/.test(instrLower);
      const preferLine = /\bline charts?\b/.test(instrLower);
      if (preferBar || preferLine) {
        const targetType = preferBar ? 'bar' : 'line';
        // The chart lives inside UW-030's data.cells, not as a top-level widget
        dashboardHit.widgets = dashboardHit.widgets.map((w) => {
          if (w.widgetType === 'UW-030') {
            const cells = (w.data.cells as Array<Record<string, unknown>>) ?? [];
            const patched = cells.map((cell) =>
              cell.widgetType === 'CH-001'
                ? { ...cell, config: { ...((cell.config as Record<string, unknown>) ?? {}), chartType: targetType, showArea: !preferBar, showDataPoints: !preferBar } }
                : cell
            );
            return { ...w, data: { ...w.data, cells: patched } };
          }
          return w;
        });
      }
      if (thinkingTimerRef.current) clearTimeout(thinkingTimerRef.current);
      thinkingTimerRef.current = setTimeout(() => {
        setIsThinking(false);
        setThinkingMessage(undefined);
        setKaiTurns((prev) => [...prev, {
          id: (Date.now() + 1).toString(),
          useCase: 'dashboard-builder' as const,
          pageContextMatch: dashboardHit,
          ...(fromChip ? { fromChip: true } : {}),
        }]);
        setActiveStreams((n) => n + 1);
        thinkingTimerRef.current = null;
      }, 1200);
      return;
    }

    // Page context takes priority over all other routing when on a WizOrder page
    const pageContextHit = matchPageContextQuery(currentPage, trimmed);
    if (pageContextHit) {
      const thinkMs = 800;
      if (thinkingTimerRef.current) clearTimeout(thinkingTimerRef.current);
      thinkingTimerRef.current = setTimeout(() => {
        spawnPageContextTurn(pageContextHit, fromChip);
      }, thinkMs);
      return;
    }

    // Specialized routes (order history, meeting prep) before email + general matcher
    const specialHit = matchSpecialQuery(trimmed);
    if (specialHit) {
      const thinkMs = 1200;
      if (thinkingTimerRef.current) clearTimeout(thinkingTimerRef.current);
      thinkingTimerRef.current = setTimeout(() => {
        spawnPageContextTurn(specialHit, fromChip);
      }, thinkMs);
      return;
    }

    // Chip-spawn useCases (terminal follow-on responses, no further chip groups).
    // Must run BEFORE matchSpecialCapabilityQuery so "approve all" doesn't match
    // the broader "approval" trigger of ad1-approval.
    {
      const lower = trimmed.toLowerCase();
      let chipUseCase:
        | 'sr2-compare'
        | 'ad1-approved'
        | 'ad1-flagged'
        | 'ad29-test'
        | null = null;
      if (lower.includes('side-by-side') || lower.includes('side by side') || lower.includes('with the original order')) {
        chipUseCase = 'sr2-compare';
      } else if (lower.includes('approve all') && lower.includes('standard')) {
        chipUseCase = 'ad1-approved';
      } else if (lower.includes('details on the flagged') || lower.includes('flagged items')) {
        chipUseCase = 'ad1-flagged';
      } else if (lower.includes('which records would have triggered') || (lower.includes('sample data') && lower.includes('workflow'))) {
        chipUseCase = 'ad29-test';
      }
      if (chipUseCase) {
        const snapshot = currentRestageableFields.length > 0 ? [...currentRestageableFields] : undefined;
        if (thinkingTimerRef.current) clearTimeout(thinkingTimerRef.current);
        thinkingTimerRef.current = setTimeout(() => {
          setIsThinking(false);
          setThinkingMessage(undefined);
          setKaiTurns((prev) => [...prev, {
            id: (Date.now() + 1).toString(),
            useCase: chipUseCase!,
            userQuery: trimmed,
            ...(snapshot ? { liveFields: snapshot } : {}),
            ...(fromChip ? { fromChip: true } : {}),
          }]);
          setActiveStreams((n) => n + 1);
          thinkingTimerRef.current = null;
        }, 1400);
        return;
      }
    }

    // Special capability groups (sr-2/11/14/20, ad-1/3/17/29) — before order creation
    // and email pre-router so their keyword-set wins. Each routes to a dedicated
    // fixture; sr2-reorder goes through ConsentTurnRenderer; the rest go
    // through StandardTurnRenderer.
    {
      const capHit = matchSpecialCapabilityQuery(trimmed);
      if (capHit) {
        // Cap 7 reports — reroute through the V2 dashboard-builder pipeline so
        // the existing Edit / Save / Download flow lights up. Reports already
        // declare capability:"dashboard-builder" + frameType:"dashboard_staged"
        // and carry an AW-012 consent banner, so parseFrame produces the same
        // shape as the V2 dashboard fixtures.
        if (capHit.useCase.startsWith('report-')) {
          const reportFixtureLoader = REPORT_FIXTURE_LOADERS[capHit.useCase];
          if (reportFixtureLoader) {
            if (thinkingTimerRef.current) clearTimeout(thinkingTimerRef.current);
            const captured = trimmed;
            const capturedFromChip = fromChip;
            reportFixtureLoader().then((fixture) => {
              const parsed = parseFrame(
                {
                  frameId: fixture.frameId ?? 'f-report',
                  frameType: 'result',
                  widgets: fixture.widgets,
                } as Parameters<typeof parseFrame>[0],
                0,
              );
              const match: PageContextMatch = {
                widgets: parsed,
                closingText: fixture.closingText,
              };
              thinkingTimerRef.current = setTimeout(() => {
                setIsThinking(false);
                setThinkingMessage(undefined);
                setKaiTurns((prev) => [...prev, {
                  id: (Date.now() + 1).toString(),
                  useCase: 'dashboard-builder' as const,
                  pageContextMatch: match,
                  userQuery: captured,
                  ...(capturedFromChip ? { fromChip: true } : {}),
                }]);
                setActiveStreams((n) => n + 1);
                thinkingTimerRef.current = null;
              }, 1200);
            });
            return;
          }
        }

        if (thinkingTimerRef.current) clearTimeout(thinkingTimerRef.current);
        // Snapshot prior turn's widgets so chip-chained capabilities (e.g. the
        // cap1-task-email → cap1-email-draft email draft) can reference the
        // task the user just confirmed in their LLM prompt.
        const priorWidgets = lastTurnWidgetsRef.current.length > 0
          ? [...lastTurnWidgetsRef.current]
          : undefined;
        thinkingTimerRef.current = setTimeout(() => {
          setIsThinking(false);
          setThinkingMessage(undefined);
          setKaiTurns((prev) => [...prev, {
            id: (Date.now() + 1).toString(),
            useCase: capHit.useCase,
            userQuery: trimmed,
            ...(fromChip ? { fromChip: true } : {}),
            ...(priorWidgets && fromChip ? { priorContextWidgets: priorWidgets } : {}),
          }]);
          setActiveStreams((n) => n + 1);
          thinkingTimerRef.current = null;
        }, 1600);
        return;
      }
    }

    // Order creation (uc2-order): "Create a new order...", "Create an order for...".
    // Excluded from uc2 task path so the staged form + chip group target orders.
    {
      const lower = trimmed.toLowerCase();
      const isOrderCreate =
        lower.includes('order') &&
        (lower.includes('create') || lower.includes('new order') || lower.includes('place an order')) &&
        !lower.includes('task') &&
        !lower.includes('approval') &&
        !lower.includes('history');
      if (isOrderCreate) {
        if (thinkingTimerRef.current) clearTimeout(thinkingTimerRef.current);
        setIsThinking(true);
        thinkingTimerRef.current = setTimeout(() => {
          setIsThinking(false);
          setThinkingMessage(undefined);
          setKaiTurns((prev) => [...prev, {
            id: (Date.now() + 1).toString(),
            useCase: 'uc2-order' as const,
            userQuery: trimmed,
            ...(fromChip ? { fromChip: true } : {}),
          }]);
          setActiveStreams((n) => n + 1);
          thinkingTimerRef.current = null;
        }, 2000);
        return;
      }
    }

    // Email draft chain routing — before general matcher
    const m = trimmed.toLowerCase();
    // sr-20 chip "Add a discount offer" routes the resulting query to email-shorter
    // (treated as an edit on the existing draft).
    if (m.includes('add a mention') || m.includes('early-access discount')) {
      if (thinkingTimerRef.current) clearTimeout(thinkingTimerRef.current);
      thinkingTimerRef.current = setTimeout(() => {
        spawnTurn('email-shorter', trimmed, undefined, fromChip);
      }, 800);
      return;
    }
    if (m.includes('email') || m.includes('draft')) {
      const emailUseCase = (m.includes('shorter') || m.includes('shorten') || m.includes('shorter') || m.includes('concise'))
        ? 'email-shorter'
        : 'email-draft';
      if (thinkingTimerRef.current) clearTimeout(thinkingTimerRef.current);
      thinkingTimerRef.current = setTimeout(() => {
        spawnTurn(emailUseCase, trimmed, undefined, fromChip);
      }, 800);
      return;
    }

    if (aiMode) {
      const aiPageCtx = currentPage
        ? { page: currentPage, visibleData: Object.values(pageData).slice(0, 20) as unknown[] }
        : undefined;
      const { cls, timedOut } = await classifyWithAI(trimmed, selectedPersonality.systemPromptSuffix, aiPageCtx, customInstructions || undefined, includeFinancial);

      if (timedOut) {
        showToast('AI classification timed out, using local matching.');
        const useCase = matchQuery(trimmed);
        spawnTurn(useCase, trimmed, undefined, fromChip);
        return;
      }

      if (cls.error === 'retry_failed') {
        // Silent fallback — already logged
        const useCase = matchQuery(trimmed);
        spawnTurn(useCase, trimmed, undefined, fromChip);
        return;
      }

      const useCase: UseCase = (['uc1', 'uc2', 'uc3', 'unknown'] as UseCase[]).includes(cls.useCase)
        ? cls.useCase
        : 'unknown';
      spawnTurn(useCase, trimmed, cls, fromChip);
    } else {
      // Keyword path: fixed delay then spawn
      const useCase = matchQuery(trimmed);
      const thinkMs = useCase === 'unknown' ? 800 : 2000;
      if (thinkingTimerRef.current) clearTimeout(thinkingTimerRef.current);
      thinkingTimerRef.current = setTimeout(() => {
        spawnTurn(useCase, trimmed, undefined, fromChip);
      }, thinkMs);
    }
  }, [isBusy, shakeInput, showToast, aiMode, spawnTurn, spawnPageContextTurn, currentPage, currentRestageableFields, notifyTourQuerySent, handleAd17MetricsRequest, spawnAd29WorkflowTurn, spawnWorkflowClarificationTurn, customInstructions]);

  const pendingQueryFiredRef = useRef(false);
  useEffect(() => {
    if (pendingQuery && !pendingQueryFiredRef.current) {
      pendingQueryFiredRef.current = true;
      const query = pendingQuery;
      setPendingQuery(null);
      // Defer one tick so ChatShell is fully mounted/stable after view switch
      setTimeout(() => handleSend(query), 0);
    }
    if (!pendingQuery) {
      pendingQueryFiredRef.current = false;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingQuery]);

  // Tour prefill — load query into input box and focus, but do NOT auto-send
  useEffect(() => {
    if (!tourPrefill) return;
    setInput(tourPrefill);
    clearTourPrefill();
    setTimeout(() => inputRef.current?.focus(), 50);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tourPrefill]);

  // Clear speaking indicator when TTS finishes naturally
  useEffect(() => {
    if (!voice.isSpeaking) setSpeakingTurnId(null);
  }, [voice.isSpeaking]);

  // Focus input whenever "Ask Kai" is clicked (signal increments each click)
  useEffect(() => {
    if (focusChatSignal > 0) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusChatSignal]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(input);
    }
  };

  const greeting = messages[0];
  const userMessages = messages.slice(1);

  const showChips = !isBusy && kaiTurns.length === 0;

  const handleReset = useCallback(() => {
    if (thinkingTimerRef.current) clearTimeout(thinkingTimerRef.current);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setMessages([{
      id: '1',
      role: 'assistant',
      content: "Hello! I'm Kai, your AI business assistant. How can I help you today?",
      timestamp: Date.now(),
    }]);
    setKaiTurns([]);
    setCurrentRestageableFields([]);
    setInput('');
    setIsThinking(false);
    setActiveStreams(0);
    setToast(null);
    setInputShaking(false);
    setThinkingMessage(undefined);
    chipChainDepthRef.current = 0;
    clearTourPrefill();
    resumeTour();
  }, [resumeTour, clearTourPrefill]);

  // Called when UC-2/3 consent is confirmed — writes task to SharedCRMContext
  const handleConfirmed = useCallback((fields: import('@/hooks/useConsentFlow').FormField[]) => {
    // Order vs task discrimination: order forms carry a 'subtotal' field;
    // task forms carry 'priority' + 'type'.
    const isOrder = fields.some((f) => f.fieldId === 'subtotal');
    if (isOrder) {
      const subtotalRaw = fields.find((f) => f.fieldId === 'subtotal')?.value ?? '0';
      const total = Number(subtotalRaw.replace(/[^0-9.]/g, '')) || 0;
      const itemsField = fields.find((f) => f.fieldId === 'items')?.value ?? '';
      // Prefer unit total (sum of `× N` markers); fall back to line-item count.
      const unitMatches = itemsField.match(/[×x]\s*(\d+)/gi) ?? [];
      const unitTotal = unitMatches.reduce((sum, m) => sum + Number(m.replace(/[^0-9]/g, '')), 0);
      const itemCount = unitTotal > 0
        ? unitTotal
        : (itemsField ? itemsField.split(',').length : 0);
      // Confirming an order moves it past Draft — the staged-form status is
      // the pre-confirmation state, not the post-confirmation reality.
      const order: SharedOrder = {
        id: `O-${Date.now()}`,
        createdAt: new Date().toISOString(),
        createdByKai: true,
        orderNumber: `ORD-K${Math.floor(Date.now() / 1000) % 100000}`,
        customer: fields.find((f) => f.fieldId === 'customer')?.value ?? 'Unknown',
        customerId: 'C-4201',
        total,
        status: 'Confirmed',
        items: itemCount,
        rep: fields.find((f) => f.fieldId === 'rep')?.value ?? 'Heman Bhullar',
      };
      addOrder(order);
      return;
    }
    // Cap 3 — customer conversion. The 4-step form carries a unique `taxId` field
    // and hidden `sourceLeadId` + `newCustomerId` metadata.
    const isCustomerConversion = fields.some((f) => f.fieldId === 'taxId');
    if (isCustomerConversion) {
      const newCustomerId = fields.find((f) => f.fieldId === 'newCustomerId')?.value ?? `C-${Date.now()}`;
      const sourceLeadId = fields.find((f) => f.fieldId === 'sourceLeadId')?.value;
      const legalName = fields.find((f) => f.fieldId === 'legalName')?.value ?? 'New Customer';
      const salesRep = fields.find((f) => f.fieldId === 'salesRep')?.value ?? '';
      addCustomer({
        id: newCustomerId,
        name: legalName.replace(/\s+LLC$/i, '').trim(),
        contact: fields.find((f) => f.fieldId === 'contact')?.value ?? '',
        lifetimeRevenue: 0,
        lastOrder: '',
        tags: ['New'],
        rep: salesRep,
        status: 'Active',
        ordersYTD: 0,
        createdByKai: true,
      });
      if (sourceLeadId) archiveLead(sourceLeadId);
      return;
    }

    // Cap 4 — merge. Form carries `mergeTarget` + `sourceLeadId` + `sourceCustomerId`
    // plus boolean checkbox decisions. Effects: archive the source lead so it
    // disappears from the active leads list; surviving customer record stays put
    // (existing customer state is read-only in this demo).
    const isMerge = fields.some((f) => f.fieldId === 'mergeTarget');
    if (isMerge) {
      const sourceLeadId = fields.find((f) => f.fieldId === 'sourceLeadId')?.value;
      const sourceCustomerId = fields.find((f) => f.fieldId === 'sourceCustomerId')?.value;
      const mergeTarget = fields.find((f) => f.fieldId === 'mergeTarget')?.value;
      // Archive the lead in every case — the merge resolves the duplicate, so
      // the lead should no longer appear as Qualified in the leads list.
      if (sourceLeadId) archiveLead(sourceLeadId);
      // If the user chose "Convert to Customer", also surface the merged record
      // as a Kai-created customer so the Customers page reflects the new active
      // entity. Respect the per-section checkbox toggles the user set via Modify.
      if (mergeTarget === 'Convert to Customer') {
        // Fixture checkboxes carry native booleans at the JSON layer but TS sees
        // them as strings — check both 'true' and the literal true at runtime.
        const flag = (id: string) => {
          const v = fields.find((f) => f.fieldId === id)?.value as unknown;
          return v === 'true' || v === true;
        };
        const carryRep = flag('mergeRep');
        const carryOrders = flag('mergeOrders');
        addCustomer({
          id: sourceCustomerId ?? `C-${Date.now()}`,
          name: 'The Garden Gate Shop',
          contact: 'David Park',
          lifetimeRevenue: carryOrders ? 8200 : 0,
          lastOrder: carryOrders ? '2024-10-14' : '',
          tags: ['Merged', 'Re-activated'],
          rep: carryRep ? 'Hannah Cho' : '(unassigned)',
          status: 'Active',
          ordersYTD: 0,
          createdByKai: true,
        });
      }
      return;
    }

    // Cap 2 — lead creation. Lead forms carry `company` + `source` (no order/task markers).
    const isLead =
      fields.some((f) => f.fieldId === 'company') &&
      fields.some((f) => f.fieldId === 'source') &&
      !fields.some((f) => f.fieldId === 'subtotal') &&
      !fields.some((f) => f.fieldId === 'title');
    if (isLead) {
      const newLeadId = fields.find((f) => f.fieldId === 'newLeadId')?.value ?? `L-${Date.now()}`;
      const lead: SharedLead = {
        id: newLeadId,
        createdAt: new Date().toISOString(),
        createdByKai: true,
        name: fields.find((f) => f.fieldId === 'company')?.value ?? 'New Lead',
        contact: fields.find((f) => f.fieldId === 'contact')?.value ?? '',
        email: fields.find((f) => f.fieldId === 'email')?.value,
        source: fields.find((f) => f.fieldId === 'source')?.value ?? 'Other',
        status: fields.find((f) => f.fieldId === 'stage')?.value ?? 'New',
        assignedTo: fields.find((f) => f.fieldId === 'assignee')?.value ?? '',
      };
      addLead(lead);
      // Cap 2 follow-up — spawn the auto-task turn so it streams below the success dialog.
      // The chat renderer pairs userMessages[i] ↔ kaiTurns[i] by index, so we also push
      // a synthetic user message to keep the alignment (rendered as a soft "Kai →" note).
      setMessages((prev) => [...prev, {
        id: `msg-cap2-autotask-${Date.now()}`,
        role: 'user',
        content: `Suggested follow-up task for ${lead.name}`,
        timestamp: Date.now(),
      }]);
      setKaiTurns((prev) => [...prev, {
        id: (Date.now() + 1).toString(),
        useCase: 'cap2-auto-task' as const,
      }]);
      setActiveStreams((n) => n + 1);
      return;
    }

    const isTask =
      fields.some((f) => f.fieldId === 'title') &&
      fields.some((f) => f.fieldId === 'assignee');
    if (!isTask) return; // Generic capability confirm (e.g. workflow activation) — no shared-state write
    const task: SharedTask = {
      id: `T-${Date.now()}`,
      createdAt: new Date().toISOString(),
      createdByKai: true,
      title: fields.find(f => f.fieldId === 'title')?.value ?? 'Task',
      type: fields.find(f => f.fieldId === 'type')?.value ?? 'Follow Up',
      priority: fields.find(f => f.fieldId === 'priority')?.value ?? 'Medium',
      assignedTo: fields.find(f => f.fieldId === 'assignee')?.value ?? 'Heman Bhullar',
      dueDate: fields.find(f => f.fieldId === 'dueDate')?.value ?? new Date().toISOString().split('T')[0],
      status: 'Open',
      customerName: fields.find(f => f.fieldId === 'customer')?.value,
    };
    addTask(task);
  }, [addTask, addOrder, addLead, archiveLead, addCustomer]);

  // Called when user clicks deep-link in ConfirmationDialog — navigates to WizOrder page
  const handleNavigate = useCallback((route: string) => {
    setView(route as ViewRoute);
  }, [setView]);

  const { setActive: setActiveDashboard } = useDashboardBuilder();
  const { addArtifact } = useArtifacts();

  // Captures the final widget list from the most-recently-completed turn.
  // `turnId` enables per-turn capture for the history-save snapshot.
  // `isLastTurn` gates the side-effects (nudges, auto-save) — capture still happens always.
  const handleWidgetsReady = useCallback((turnId: string, widgets: ParsedWidget[], isLastTurn = true) => {
    if (turnId) turnIdToWidgetsRef.current[turnId] = widgets;
    if (!isLastTurn) return; // capture-only path for older turns
    lastTurnWidgetsRef.current = widgets;
    // Defer nudge triggers — calling setState from another component's render cycle
    // (via onWidgetsReady) causes React's "setState during render" warning.
    setTimeout(() => {
      const types = new Set(widgets.map((w) => w.widgetType));
      if (types.has('CH-001')) triggerNudge('chart');
      else if (types.has('UW-030')) triggerNudge('dashboard');
    }, 0);

    // Auto-save artifacts pref: when ON, persist CH-001 and UW-030 widgets
    // to My Artifacts without a Save click. De-duped via widget key.
    if (autoSaveArtifacts) {
      setTimeout(() => {
        for (const w of widgets) {
          if (w.widgetType !== 'CH-001' && w.widgetType !== 'UW-030') continue;
          if (autoSavedKeysRef.current.has(w.key)) continue;
          autoSavedKeysRef.current.add(w.key);
          const isDashboard = w.widgetType === 'UW-030';
          const title = (w.data as { title?: string })?.title ?? w.widgetType;
          if (isDashboard) {
            const saved: import('@/lib/types').SavedDashboard = {
              id: `auto-${Date.now()}-${w.key}`,
              type: 'chart',
              category: 'Dashboards and Reports',
              title,
              description: 'Auto-saved by Kai',
              savedAt: Date.now(),
              sourceWidget: { widgetType: w.widgetType, data: w.data, config: w.config },
              dashboardData: w.data as unknown as DashboardCompositeData,
            };
            addArtifact(saved);
          } else {
            addArtifact({
              id: `auto-${Date.now()}-${w.key}`,
              type: 'chart',
              category: 'other',
              title,
              description: 'Auto-saved by Kai',
              savedAt: Date.now(),
              sourceWidget: { widgetType: w.widgetType, data: w.data, config: w.config },
            });
          }
        }
      }, 0);
    }

    scrollToBottom();
    setTimeout(() => {
      scrollToBottom();
      setTimeout(() => notifyTourWidgetsReady(), 350);
    }, 300);
  }, [triggerNudge, notifyTourWidgetsReady, scrollToBottom, autoSaveArtifacts, addArtifact]);

  // Activate Workflow CTA on ad29-workflow turns: persists the workflow into
  // My Artifacts under "Scheduled" so the user can review it later. Idempotent
  // — re-activating the same workflow in the same chat just replaces the
  // existing artifact's timestamp.
  const handleWorkflowActivated = useCallback((workflowId: WorkflowId) => {
    const wf = getWorkflow(workflowId);
    if (!wf) return;
    const audienceSummary = wf.setupMetrics
      .slice(0, 2)
      .map((m) => `${m.label}: ${m.value}`)
      .join(' · ');
    const saved: import('@/lib/types').SavedWorkflow = {
      id: `wf-${Date.now()}`,
      type: 'workflow',
      category: 'Scheduled',
      title: wf.label,
      description: wf.description,
      savedAt: Date.now(),
      sourceWidget: {
        widgetType: 'UW-003',
        data: { workflowId },
      },
      workflowId,
      audienceSummary,
      scheduleStatus: 'Active — Scheduled',
      trigger: wf.detail.trigger,
    };
    addArtifact(saved);
    showToast(`${wf.label} activated · saved to My Artifacts`);
  }, [addArtifact]);

  // ── History persistence ───────────────────────────────────────────────────
  // Serialize the in-memory turns into the snapshot format used by ChatHistory.
  const buildSerializedTurns = useCallback((): SerializedTurn[] => {
    const turns = kaiTurnsRef.current;
    return turns.map<SerializedTurn>((t) => {
      const widgets = (turnIdToWidgetsRef.current[t.id] ?? []).map<SerializedWidget>((w) => ({
        key: w.key,
        widgetType: w.widgetType,
        data: w.data,
        config: w.config,
        highlights: w.highlights,
        frameId: w.frameId,
        frameType: w.frameType,
        branchId: w.branchId,
      }));
      // closingText is computed at render time per turn; we don't always have it
      // on the KaiTurn object. The simplest preserved version is whatever the
      // simulator/match would produce — for the snapshot we capture
      // pageContextMatch.closingText if present, else leave undefined and rely
      // on llmText to render the canvas block.
      const closingText = t.pageContextMatch?.closingText
        ? { type: t.pageContextMatch.closingText.type as string, text: t.pageContextMatch.closingText.text }
        : undefined;
      return {
        id: t.id,
        useCase: t.useCase,
        userQuery: t.userQuery,
        isStale: t.isStale,
        widgets,
        closingText,
        llmText: turnIdToLlmTextRef.current[t.id],
        workflowId: t.workflowId,
        ad17AddedMetrics: t.ad17AddedMetrics,
        docsQA: t.docsQA,
        unknownReply: t.unknownReply,
      };
    });
  }, []);

  // Build a session-scaffold (id + timestamps + raw payload) for History save.
  const buildSessionScaffold = useCallback((): Omit<SavedSession, 'title' | 'subtext' | 'tag'> => ({
    id: sessionIdRef.current,
    createdAt: sessionStartRef.current,
    updatedAt: Date.now(),
    messages: messagesRef.current,
    turns: buildSerializedTurns(),
  }), [buildSerializedTurns]);

  const resetSessionState = useCallback(() => {
    const greeting: Message = {
      id: '1',
      role: 'assistant',
      content: "Hello! I'm Kai, your AI business assistant. How can I help you today?",
      timestamp: Date.now(),
    };
    setMessages([greeting]);
    setKaiTurns([]);
    setCurrentRestageableFields([]);
    setInput('');
    setIsThinking(false);
    setActiveStreams(0);
    setSpeakingTurnId(null);
    setSaveDashboardModal(null);
    chipChainDepthRef.current = 0;
    turnIdToWidgetsRef.current = {};
    turnIdToLlmTextRef.current = {};
    lastTurnWidgetsRef.current = [];
    autoSavedKeysRef.current = new Set();
    sessionStartRef.current = Date.now();
    sessionIdRef.current = `s-${Date.now()}`;
  }, []);

  // Persist the current session to ChatHistory (no UI reset). Returns true if a
  // save happened, false if skipped (e.g. greeting-only or restored-only).
  // addSession is keyed by id, so repeated calls during the same session just
  // overwrite the same history row — safe to call from view-change effects.
  const saveCurrentSession = useCallback((): boolean => {
    const scaffold = buildSessionScaffold();
    const userMessageCount = scaffold.messages.filter((m) => m.role === 'user').length;
    if (userMessageCount === 0) return false;
    // If the session consists entirely of restored turns (user only viewed an
    // old session and didn't add anything new), skip saving — that row is
    // already in history and re-saving would bump its updatedAt for a no-op view.
    const hasLiveTurn = scaffold.turns.some((t) => !t.isStale && Object.prototype.hasOwnProperty.call(turnIdToWidgetsRef.current, t.id));
    if (!hasLiveTurn && kaiTurnsRef.current.every((t) => t.isRestored)) return false;
    const heur = heuristicSummary(scaffold.messages, scaffold.turns);
    const saved: SavedSession = { ...scaffold, ...heur };
    addSession(saved);
    summarizeSession(buildSummarizePayload(scaffold.messages, scaffold.turns))
      .then((llm) => {
        if (llm) updateSession(saved.id, { title: llm.title, subtext: llm.subtext, tag: llm.tag });
      })
      .catch(() => {});
    return true;
  }, [buildSessionScaffold, addSession, updateSession]);

  // Save the current conversation, reset state, route to a fresh chat view.
  // Invoked by the sidebar "New Chat" button.
  const saveAndResetSession = useCallback(() => {
    saveCurrentSession();
    resetSessionState();
    setView('chat');
  }, [saveCurrentSession, resetSessionState, setView]);

  // Register the save handler so the sidebar can invoke it on New Chat click.
  useEffect(() => {
    registerSaveAndReset(saveAndResetSession);
  }, [registerSaveAndReset, saveAndResetSession]);

  // Auto-save whenever the user navigates away from chat — covers every other
  // exit path (Dashboard, Orders, CRM, History, My Artifacts, Admin, ...).
  // No reset: when the user comes back to /chat the same conversation is still
  // visible. The next New Chat (or restore from History) is what clears it.
  const prevViewRef = useRef<string>(currentView);
  useEffect(() => {
    const prev = prevViewRef.current;
    const next = currentView;
    if (prev === 'chat' && next !== 'chat') {
      saveCurrentSession();
    }
    prevViewRef.current = next;
  }, [currentView, saveCurrentSession]);

  // Restore a saved session: rehydrate messages + turns and skip streaming/LLM.
  const restoreSession = useCallback((s: SavedSession) => {
    resetSessionState();
    sessionIdRef.current = s.id;
    sessionStartRef.current = s.createdAt;
    setMessages(s.messages);
    const restored: KaiTurn[] = s.turns.map((t) => ({
      id: t.id,
      useCase: t.useCase as KaiTurn['useCase'],
      userQuery: t.userQuery,
      isStale: t.isStale,
      docsQA: t.docsQA,
      unknownReply: t.unknownReply,
      workflowId: t.workflowId as WorkflowId | undefined,
      ad17AddedMetrics: t.ad17AddedMetrics,
      isRestored: true,
      restoredWidgets: t.widgets,
      restoredClosingText: t.closingText,
      restoredLlmText: t.llmText,
    }));
    setKaiTurns(restored);
    setActiveStreams(0);
    setIsThinking(false);
  }, [resetSessionState]);

  // Watch for pending restore requests from HistoryView.
  useEffect(() => {
    if (pendingRestore) {
      restoreSession(pendingRestore);
      consumePendingRestore();
    }
  }, [pendingRestore, restoreSession, consumePendingRestore]);

  const handleSaveDashboard = useCallback((dashboardData: DashboardCompositeData, title: string, description: string) => {
    setSaveDashboardModal({ dashboardData, title, description });
  }, []);

  // ad17-report: "Save as Dashboard" CTA / chip → convert the report widgets
  // into a dashboard and open the same SaveArtifactModal used by dashboard-builder.
  const handleSaveAsDashboardFromAd17 = useCallback((widgets: ParsedWidget[]) => {
    const dashboardData = buildDashboardFromAd17(widgets);
    setSaveDashboardModal({
      dashboardData,
      title: dashboardData.title,
      description: dashboardData.description,
    });
  }, []);

  // ClarificationCard confirm → spawn an ad17-report turn with the chosen labels.
  // Marks the clarification turn stale so the user can't double-confirm.
  const handleClarificationConfirm = useCallback((clarificationTurnId: string, selectedLabels: string[]) => {
    // Build a synthetic user-side bubble describing the selection.
    const labelText = selectedLabels.length === 1
      ? selectedLabels[0]
      : selectedLabels.slice(0, -1).join(', ') + ' and ' + selectedLabels[selectedLabels.length - 1];
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: `Add ${labelText}`,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setKaiTurns((prev) => prev.map((t) => (t.id === clarificationTurnId ? { ...t, isStale: true } : t)));
    spawnAd17WithMetrics(selectedLabels, `Add ${labelText}`);
  }, [spawnAd17WithMetrics]);

  // Cancelling a clarification removes the clarification turn AND its paired
  // user-side message, restoring the state to before "add a metric" was sent.
  // This keeps the userMessages ↔ kaiTurns index pairing aligned and lets the
  // prior ad17-report turn become the active turn again (chips reappear).
  const handleClarificationCancel = useCallback((clarificationTurnId: string) => {
    setKaiTurns((prev) => {
      const idx = prev.findIndex((t) => t.id === clarificationTurnId);
      if (idx === -1) return prev;
      const next = [...prev];
      next.splice(idx, 1);
      return next;
    });
    // Pop the most recent user message — it was the one that triggered the
    // clarification. (userMessages = messages.slice(1), so the paired user
    // message is always the last item in `messages`.)
    setMessages((prev) => (prev.length > 1 ? prev.slice(0, -1) : prev));
  }, []);

  // ── ad29 workflow handlers ─────────────────────────────────────────────────
  // (Spawn helpers live higher in the component so handleSend can reference
  // them; the confirm/cancel handlers below only fire from rendered widgets.)

  // ClarificationCard confirm (workflow flow): user picked one workflow id.
  // Stales the clarification turn and spawns the ad29-workflow turn.
  const handleWorkflowClarificationConfirm = useCallback((clarificationTurnId: string, selectedIds: string[]) => {
    const id = selectedIds[0] as WorkflowId | undefined;
    if (!id) return;
    const wf = getWorkflow(id);
    if (!wf) return;
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: `Set up the ${wf.label} workflow`,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setKaiTurns((prev) => prev.map((t) => (t.id === clarificationTurnId ? { ...t, isStale: true } : t)));
    spawnAd29WorkflowTurn(id, `Set up the ${wf.label} workflow`);
  }, [spawnAd29WorkflowTurn]);

  // ClarificationCard cancel (workflow flow): mirror the metric-flow cancel —
  // remove the clarification turn AND pop the trailing user message so state
  // returns to whatever was active before the picker appeared.
  const handleWorkflowClarificationCancel = useCallback((clarificationTurnId: string) => {
    setKaiTurns((prev) => {
      const idx = prev.findIndex((t) => t.id === clarificationTurnId);
      if (idx === -1) return prev;
      const next = [...prev];
      next.splice(idx, 1);
      return next;
    });
    setMessages((prev) => (prev.length > 1 ? prev.slice(0, -1) : prev));
  }, []);

  const handleEditDashboard = useCallback((dashboardData: DashboardCompositeData) => {
    // Mark the last dashboard turn stale, then open DashboardFullView with no saved artifact ID
    setKaiTurns((prev) => prev.map((t, i) =>
      i === prev.length - 1 && t.useCase === 'dashboard-builder' ? { ...t, isStale: true } : t
    ));
    setActiveDashboard(dashboardData, '', 'chat');
    setView('dashboard-view');
  }, [setActiveDashboard, setView]);

  // Resolves {templateVars} in a chip query from the last turn's widget data,
  // then sends it as a chip-triggered message
  const handleChipClick = useCallback((query: string) => {
    const vars = extractTemplateVars(lastTurnWidgetsRef.current);
    const resolved = resolveChipQuery(query, vars);

    // ad-17 "Save as dashboard" chip: convert the existing report into a
    // dashboard and open the save modal directly instead of spawning a fresh
    // sales-performance dashboard turn (which would happen because
    // matchDashboardQuery accepts the "save as dashboard" keyword).
    const lastTurn = kaiTurns.length > 0 ? kaiTurns[kaiTurns.length - 1] : null;
    if (
      lastTurn?.useCase === 'ad17-report' &&
      /save (this )?as (a )?dashboard/i.test(resolved)
    ) {
      chipChainDepthRef.current += 1;
      triggerNudge('action-chip');
      notifyTourChipClicked();
      handleSaveAsDashboardFromAd17(lastTurnWidgetsRef.current);
      return;
    }

    // ad-17 metric requests via chip click: in AI mode, route through
    // /api/kai/restage-metrics so the endpoint can either apply or clarify.
    // In Demo mode (no API key), the endpoint's vague-pattern matcher returns
    // a clarify shape that spawns the ClarificationCard turn. Specific chip
    // phrasings hit a deterministic DEMO_APPLY_TRIGGER and skip clarification.
    if (
      lastTurn?.useCase === 'ad17-report' &&
      /\b(add|include|append)\b/i.test(resolved) &&
      !/\b(email|draft|task|dashboard|save\b|snapshot|attachment|image|note|new order|this order|an order|the order|create order)\b/i.test(resolved)
    ) {
      chipChainDepthRef.current += 1;
      triggerNudge('action-chip');
      notifyTourChipClicked();
      const userMessage: Message = {
        id: Date.now().toString(),
        role: 'user',
        content: resolved,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, userMessage]);
      handleAd17MetricsRequest(resolved);
      return;
    }

    // ad-29 "Test with sample data" chip — only meaningful when the prior turn
    // is an ad29-workflow we built from the catalog. Spawn an ad29-test turn
    // carrying that workflowId so the sample data table is workflow-specific.
    if (
      lastTurn?.useCase === 'ad29-workflow' &&
      lastTurn.workflowId &&
      /which records would have triggered|sample data/i.test(resolved)
    ) {
      chipChainDepthRef.current += 1;
      triggerNudge('action-chip');
      notifyTourChipClicked();
      const userMessage: Message = {
        id: Date.now().toString(),
        role: 'user',
        content: resolved,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, userMessage]);
      spawnAd29TestTurn(lastTurn.workflowId, resolved);
      return;
    }

    // ad-29 "Create another workflow" chip — hidden (workflow creation not exposed in this build)
    // if (
    //   (lastTurn?.useCase === 'ad29-workflow' || lastTurn?.useCase === 'ad29-test') &&
    //   /(set up|create|build).{0,12}workflow/i.test(resolved)
    // ) {
    //   chipChainDepthRef.current += 1;
    //   triggerNudge('action-chip');
    //   notifyTourChipClicked();
    //   const userMessage: Message = {
    //     id: Date.now().toString(),
    //     role: 'user',
    //     content: 'Set up another workflow',
    //     timestamp: Date.now(),
    //   };
    //   setMessages((prev) => [...prev, userMessage]);
    //   spawnWorkflowClarificationTurn('Set up another workflow', { fromChip: true });
    //   return;
    if (false) {
    }

    triggerNudge('action-chip');
    notifyTourChipClicked();
    handleSend(resolved, false, true);
  }, [handleSend, triggerNudge, notifyTourChipClicked, kaiTurns, handleSaveAsDashboardFromAd17, handleAd17MetricsRequest, spawnAd29TestTurn, spawnWorkflowClarificationTurn]);

  useEffect(() => {
    function onAsk(e: Event) {
      const ce = e as CustomEvent<{ query: string }>;
      if (ce.detail?.query) handleChipClick(ce.detail.query);
    }
    window.addEventListener('kai:ask', onAsk);
    return () => window.removeEventListener('kai:ask', onAsk);
  }, [handleChipClick]);

  return (
    <div className="flex flex-col h-full">
      {/* Mode indicator bar */}
      <div className="shrink-0 flex justify-end px-8 pt-3 pb-0">
        <ModeIndicator aiMode={aiMode} />
      </div>

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-8 py-8 scroll-smooth"
      >
        <div className="max-w-4xl mx-auto relative">
          {kaiTurns.length > 0 && (
            <button
              onClick={handleReset}
              className="absolute top-0 right-0 text-[12px] text-[var(--text3)] hover:text-[var(--primary-80)] transition-all flex items-center gap-1.5 py-1 z-10 font-sans"
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="1 4 1 10 7 10" />
                <path d="M3.51 15a9 9 0 1 0 .49-4.95" />
              </svg>
              New conversation
            </button>
          )}

          {/* Proactive brief — shown only when preference is ON */}
          {kaiTurns.length === 0 && !isBusy && proactiveAssistance && (
            <div data-tour="proactive-brief">
              <ProactiveBriefCard
                brief={proactiveBrief}
                onChipClick={handleChipClick}
              />
            </div>
          )}

          <MessageBubble message={greeting} />

          {userMessages.map((msg, i) => {
            const turn = kaiTurns[i];
            const isLastTurn = i === kaiTurns.length - 1;
            const chipKey = turn ? USECASE_CHIP_KEY[turn.useCase] ?? '' : '';
            const capChips: ActionChip[] = chipKey ? (ACTION_CHIPS_MAP.capabilityChips[chipKey] ?? []) : [];
            const pageChips: ActionChip[] = pageActions;
            const allChips = [...capChips, ...pageChips];
            // Show chips only on the last completed (non-stale) turn and only if not busy
            const showTurnChips = isLastTurn && !isBusy && allChips.length > 0 && !turn?.isStale;
            const chainAtLimit = chipChainDepthRef.current >= MAX_CHIP_CHAIN_DEPTH;

            // Build the generate context for this turn's LLM call
            const generateCtx: GenerateContext = {
              aiMode,
              capability: turn?.useCase ?? 'general',
              userQuery: msg.content,
              persona: selectedPersonality.id,
              customInstructions: customInstructions || undefined,
              pageContext: currentPage
                ? { page: currentPage, visibleData: Object.values(pageData).slice(0, 20) as unknown[] }
                : undefined,
              includeFinancial,
            };

            return (
              <div key={msg.id}>
                <MessageBubble message={msg} />
                {turn && (
                  <div style={{ position: 'relative' }}>
                    <KaiTurnRenderer
                      turn={turn}
                      responseMode={responseMode}
                      personalityId={selectedPersonality.id}
                      onSelect={handleSend}
                      onStreamEnd={handleStreamEnd}
                      onFormReady={handleFormReady}
                      onToggleTTS={(text) => handleToggleTTS(turn.id, text)}
                      isReading={speakingTurnId === turn.id && voice.isSpeaking}
                      onStreamComplete={(text) => handleStreamComplete(turn.id, text)}
                      onConfirmed={handleConfirmed}
                      onWorkflowActivated={handleWorkflowActivated}
                      onNavigate={handleNavigate}
                      onWidgetsReady={(widgets) => handleWidgetsReady(turn.id, widgets, isLastTurn)}
                      onSaveDashboard={handleSaveDashboard}
                      onEditDashboard={handleEditDashboard}
                      onSaveAsDashboardFromAd17={handleSaveAsDashboardFromAd17}
                      onClarificationConfirm={handleClarificationConfirm}
                      onClarificationCancel={handleClarificationCancel}
                      onWorkflowClarificationConfirm={handleWorkflowClarificationConfirm}
                      onWorkflowClarificationCancel={handleWorkflowClarificationCancel}
                      generateCtx={generateCtx}
                    />
                    {turn.isStale && <StaleOverlay />}
                    {showTurnChips && (
                      chainAtLimit ? (
                        <p style={{
                          fontFamily: 'var(--sans)',
                          fontSize: 13,
                          color: 'var(--text3)',
                          marginTop: 12,
                          paddingLeft: 4,
                        }}>
                          What would you like to do next?
                        </p>
                      ) : (
                        <div data-tour="action-chips">
                          <ActionChipsBar
                            chips={allChips}
                            onChipClick={handleChipClick}
                          />
                        </div>
                      )
                    )}
                    {isLastTurn && !isBusy && (
                      <>
                        <UsageNudge type="chart" />
                        <UsageNudge type="dashboard" />
                        <UsageNudge type="email" />
                        <UsageNudge type="action-chip" />
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {isThinking && <ThinkingIndicator overrideMessage={thinkingMessage} />}
          <div ref={scrollAnchorRef} style={{ height: 1 }} />
        </div>
      </div>

      {/* Dashboard save modal */}
      {saveDashboardModal && (
        <SaveArtifactModal
          widgetType="UW-030"
          defaultTitle={saveDashboardModal.title}
          defaultDescription={saveDashboardModal.description}
          data={saveDashboardModal.dashboardData as unknown as Record<string, unknown>}
          categoryOverride="Dashboards and Reports"
          dashboardData={saveDashboardModal.dashboardData}
          onClose={() => setSaveDashboardModal(null)}
          onSaved={() => {
            setSaveDashboardModal(null);
            showToast('Dashboard saved to My Artifacts');
          }}
        />
      )}

      {/* Toast */}
      {toast && (
        <div
          className="fixed bottom-28 left-1/2 -translate-x-1/2 px-4 py-2 bg-gray-800 text-white text-sm rounded-lg shadow-lg pointer-events-none"
          style={{ animation: 'kai-entrance 200ms ease both', zIndex: 50 }}
        >
          {toast}
        </div>
      )}

      <div className="shrink-0 bg-[var(--surface)] border-t border-[var(--border)] px-6 py-4">
        <div className="max-w-4xl mx-auto">
          {showChips && (
            <SuggestedQueries
              onSelect={handleChipClick}
              pageChips={
                pageActions.length > 0
                  ? pageActions
                  : starterPrompts.length > 0
                    ? starterPrompts.map(s => ({ label: s, query: s, icon: '', category: 'suggested' as const }))
                    : []
              }
            />
          )}

          <div className="flex items-center gap-2" data-tour="chat-input">
            <div className="relative group flex-1">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={voice.isListening ? 'Listening...' : isBusy ? 'Kai is working...' : 'Ask Kai anything...'}
                className={`w-full h-[44px] pl-[16px] pr-[132px] bg-[var(--surface2)] border border-[var(--border)] rounded-[10px] text-[var(--text)] font-sans text-[13.5px] focus:outline-none focus:border-[var(--ai-accent-border)] focus:ring-[3px] focus:ring-[rgba(91,106,240,0.1)] transition-all ${inputShaking ? 'kai-shake border-[var(--error-80)]' : ''}`}
              />
              <div className="absolute right-[6px] top-[4px] flex items-center gap-1">
                <button
                  onClick={() => handleSend(input)}
                  disabled={isBusy}
                  className="h-[32px] px-4 bg-[var(--primary-80)] text-white text-[13px] font-medium rounded-[8px] hover:bg-[var(--primary-70)] transition-all disabled:opacity-50 disabled:cursor-not-allowed font-sans"
                >
                  Send
                </button>
                <VoiceButton
                  voice={voice}
                  onSend={(text) => handleSend(text, true)}
                  onTranscriptChange={setInput}
                  disabled={isBusy}
                  autoSend={autoSendVoice}
                />
              </div>
            </div>
          </div>

          {/* Cmd+K hint — tour target, visually subtle */}
          <div
            data-tour="cmd-k-hint"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 5,
              marginTop: 8,
            }}
          >
            <kbd style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '2px 6px',
              background: 'var(--surface2)',
              border: '1px solid var(--border2)',
              borderRadius: 5,
              fontFamily: 'var(--mono)',
              fontSize: 10.5,
              color: 'var(--text3)',
              lineHeight: 1.4,
            }}>⌘K</kbd>
            <span style={{
              fontFamily: 'var(--sans)',
              fontSize: 11,
              color: 'var(--text3)',
            }}>
              Quick-access any capability
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
