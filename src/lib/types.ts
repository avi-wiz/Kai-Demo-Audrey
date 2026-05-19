export type FrameType =
  | 'reasoning'
  | 'result'
  | 'action_staged'
  | 'error'
  | 'clarification';

export type UseCase = 'uc1' | 'uc2' | 'uc3' | 'unknown';

export type ConsentState = 'staged' | 'confirmed' | 'editing' | 'cancelled';

export interface TraceStep {
  step: number;
  action: string;
  result: string;
  ms: number;
}

export interface TraceLatency {
  ingestionMs: number;
  planningMs: number;
  executionMs: number;
  widgetResolveMs: number;
  timeToFirstFrameMs: number;
  timeToCompleteMs: number;
}

export interface Trace {
  traceId: string;
  queryClassification: string;
  resolverPath: string;
  workflowId: string;
  fastPathHit: boolean;
  latency: TraceLatency;
}

export interface FrameActions {
  onConfirm?: {
    mcp: string;
    method: string;
    payload: Record<string, unknown>;
  };
  onCancel?: { action: string };
  onModify?: { action: string };
}

export interface Widget<
  TData = Record<string, unknown>,
  TConfig = Record<string, unknown>,
> {
  widgetType: string;
  data: TData;
  config?: TConfig;
  highlights?: WidgetHighlight[];
}

export interface WidgetProps<
  TData = Record<string, unknown>,
  TConfig = Record<string, unknown>,
> {
  data: TData;
  config?: TConfig;
  highlights?: WidgetHighlight[];
}

export interface Frame {
  frameId: string;
  frameType: FrameType;
  widgets: Widget[];
  trace?: Trace;
  actions?: FrameActions;
  branchId?: string;
  /** v1: per-frame response mode override. Falls back to conversation-level ResponseMode. */
  responseMode?: ResponseMode;
  /** v1: Kai's closing remark rendered after all widgets (or alone in text-only mode). */
  closingText?: ClosingText;
  /** v1: Button labels for text-only staged turns. Only used when frameType==='action_staged' and mode==='text-only'. */
  textOnlyActions?: TextOnlyActions;
}

export type FrameBundle = Frame | { frames: Frame[] };

export interface DAGNode {
  nodeId: string;
  action: string;
  status: 'completed' | 'pending' | 'running' | 'failed' | string;
  ms: number;
  dependsOn?: string[];
  input?: string;
  result?: string;
}

export interface DAGBranch {
  branchId: string;
  intent: 'Surface' | 'Act' | string;
  nodes: DAGNode[];
}

export interface DAGPlan {
  sharedNodes: DAGNode[];
  branches: DAGBranch[];
}

export interface AgentReasoningCardData {
  summary: string;
  steps?: TraceStep[];
  dagPlan?: DAGPlan;
  mcpsAccessed: string[];
  totalMs: number;
}

export interface AgentReasoningCardConfig {
  collapsed?: boolean;
  showDag?: boolean;
}

export type Customer360Data = {
  profile: {
    name: string;
    customerId: string;
    type: string;
    salesRep: string;
    priceList: string;
    territory: string;
  };
  metrics: {
    cards: Array<{
      label: string;
      value: number | string;
      format?: string;
    }>;
  };
  salesTrend: number[];
  recentOrders: Array<{
    id: string;
    date: string;
    status: {
      label: string;
      color: string;
    };
    value: number;
  }>;
  openTasks: Array<{
    title: string;
    due: string;
  }>;
  riskIndicator?: {
    level: 'healthy' | 'watch' | 'at_risk' | 'churned';
    reason: string;
  };
} | {
  entityType: 'customer';
  entityId: string;
  displayName: string;
  contactPerson: string;
  email: string;
  phone: string;
  lifetimeRevenue: number;
  lastOrderDate: string;
  lastOrderAmount: number;
  paymentStatus: 'Current' | 'Overdue' | string;
  assignedRep: string;
  tags: string[];
  customerSince: string;
  openOrderCount: number;
  creditLimit: number;
  currentBalance: number;
};

export interface LineChartSeriesRow {
  revenue: number;
  [xKey: string]: string | number;
}

export interface LineChartData {
  title: string;
  series: LineChartSeriesRow[];
  yAxisLabel: string;
  xAxisLabel: string;
}

export interface LineChartConfig {
  chartType: 'line' | 'bar' | 'area';
  showDataPoints?: boolean;
  showArea?: boolean;
  subtitle?: string;
}

export interface CompactListItem {
  id: string;
  title: string;
  dueDate: string;
  priority: 'High' | 'Medium' | 'Low' | string;
  assignedTo: string;
  status: 'Open' | 'In Progress' | 'Completed' | 'Hold' | string;
}

export interface CompactListData {
  title: string;
  items: CompactListItem[];
}

export interface EntityDetailField {
  label: string;
  value: string;
  entityId?: string;
}

export interface EntityDetailCardData {
  entityType: string;
  title?: string;
  fields: EntityDetailField[];
}

interface FormFieldBase {
  fieldId: string;
  label: string;
  value: string;
  required: boolean;
}

export type FormFieldSpec =
  | (FormFieldBase & { type: 'text' })
  | (FormFieldBase & { type: 'date' })
  | (FormFieldBase & { type: 'select'; options: string[] })
  | (FormFieldBase & { type: 'entity_search'; resolvedId: string })
  | (FormFieldBase & { type: 'user_search'; resolvedId: string });

export interface MultiStepFormStep {
  stepTitle: string;
  fields: FormFieldSpec[];
}

export interface MultiStepFormData {
  formId: string;
  steps: MultiStepFormStep[];
}

export interface MultiStepFormConfig {
  mode: 'review' | 'edit';
  editable: boolean;
}

export interface ConsentBannerData {
  message: string;
  tier: 'draft' | string;
  actions: string[];
  branchId?: string;
}

export interface ConfirmationDialogData {
  status: 'success' | 'error' | string;
  title: string;
  message: string;
  entityLink?: { label: string; url: string };
}

export interface MetricTrend {
  direction: 'up' | 'down' | 'flat';
  percent: number;
  period: string;
}

export interface MetricCardData {
  label: string;
  value: string;
  format: 'currency' | 'count' | 'percent' | string;
  trend?: MetricTrend;
}

export interface MetricCardRowData {
  cards: MetricCardData[];
}

export interface DeepLinkButtonData {
  label: string;
  url: string;
  style?: 'primary' | 'secondary';
  /** When set, renders as a button that fires an in-app action via WidgetActionContext instead of navigating. */
  action?: 'save-as-dashboard';
}

// AW-006 ClarificationCard — multi-select dropdown for ambiguous requests.
export interface ClarificationOption {
  /** Canonical value sent back via onClarificationConfirm. */
  value: string;
  /** User-facing label rendered in the option row. */
  label: string;
  /** One-line helper rendered under the label. */
  description?: string;
}

export interface ClarificationCardData {
  /** Main question, e.g. "Which metrics would you like to add?" */
  prompt: string;
  /** Optional explainer below the prompt. */
  context?: string;
  /** Available options the user picks from. */
  options: ClarificationOption[];
  /** Selection mode. Defaults to 'multi'. 'single' renders radio rows. */
  mode?: 'single' | 'multi';
  /** Labels for the confirm button. Defaults to "Add selected" / "Cancel". */
  confirmLabel?: string;
  cancelLabel?: string;
  /** Optional pre-checked option values. */
  defaultSelected?: string[];
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

// ─── v1 Types ────────────────────────────────────────────────────────────────

// ── 1. Layout ────────────────────────────────────────────────────────────────

/** Which sidebar chrome the shell renders. Toggled via Cmd+Shift+L. */
export type LayoutMode = 'kai-only' | 'kai-wizorder';

/**
 * State-based routing — NOT URL-based. Drives currentView in LayoutContext.
 * v2: added 'agent-store'. 'admin/api-key' kept alongside 'admin/models'
 * during migration — remove 'admin/api-key' once call sites are updated.
 */
export type ViewRoute =
  | 'chat'
  | 'history'
  | 'artifacts'
  | 'docs'
  | 'settings'
  | 'agent-store'
  | 'admin/dashboard'
  | 'admin/api-key'
  | 'admin/models'
  | 'admin/prefs'
  // v2.1 WizOrder pages
  | 'wizorder/dashboard'
  | 'wizorder/orders'
  | 'wizorder/customers'
  | 'wizorder/products'
  | 'wizorder/crm'
  // v2.1 Dashboard builder
  | 'dashboard-view';

// ── 2. Response Mode ─────────────────────────────────────────────────────────

/**
 * Per-conversation rendering toggle.
 * 'text-widget' = v0 behaviour (widgets render).
 * 'text-only'   = closing text + consent buttons only, no widget cards.
 */
export type ResponseMode = 'text-widget' | 'text-only';

/**
 * Kai's closing remark rendered after all widgets (or alone in text-only mode).
 * `type` drives the icon/badge: insight=lightbulb, description=text, question=?,
 * action_summary=checkmark (v2 CanvasTextBlock "Action Summary" badge).
 */
export interface ClosingText {
  type: 'insight' | 'description' | 'question' | 'action_summary';
  text: string;
}

/**
 * Button labels for text-only staged turns.
 * Handlers come from ConsentHandlersContext — this carries labels only.
 */
export interface TextOnlyActions {
  confirmText: string;
  editText: string;
  cancelText: string;
}

// ── 3. Artifacts ─────────────────────────────────────────────────────────────

/** Widget category for icon and filter in MyArtifactsView. */
export type ArtifactType =
  | 'metric'
  | 'chart'
  | 'list'
  | 'table'
  | 'entity'
  | 'reasoning'
  | 'form'
  | 'workflow';

/** Filter sidebar grouping in MyArtifactsView. */
export type ArtifactCategory =
  | 'customers'
  | 'tasks'
  | 'reports'
  | 'other'
  | 'Dashboards and Reports'
  | 'Scheduled';

/**
 * A widget pinned by the user via the hover-icon → modal → My Artifacts flow.
 * `sourceWidget` mirrors the Widget shape so re-rendering is just
 * `<Component data={sourceWidget.data} config={sourceWidget.config} />`.
 */
export interface SavedArtifact {
  id: string;
  type: ArtifactType;
  category: ArtifactCategory;
  title: string;
  description: string;
  /** Epoch ms — used for sort order. */
  savedAt: number;
  sourceWidget: {
    widgetType: string;
    data: Record<string, unknown>;
    config?: Record<string, unknown>;
  };
  /** Optional data-URL or icon-name stub. html2canvas is out of scope for the POC. */
  thumbnail?: string;
}

// ── 4. History & Persona ─────────────────────────────────────────────────────

/**
 * One row in HistoryView. Metadata only — not a full conversation replay.
 * Written by ConversationContext on conversation end.
 */
export interface HistoryItem {
  id: string;
  /** User's original message text. */
  query: string;
  useCase: UseCase;
  /** First ~80 chars of closing text or agent summary — shown as preview text. */
  preview: string;
  /** Epoch ms. */
  timestamp: number;
  /** Total turns including follow-ups. */
  messageCount: number;
}

/** Four built-in Kai tones. */
export type PersonalityId = 'professional' | 'friendly' | 'executive';

/**
 * Kai's tone persona. Controls two things simultaneously:
 * 1. `systemPromptSuffix` is appended to the /api/kai system prompt.
 * 2. `closingTextVariant` selects which closing text variant the fixture loader resolves.
 */
export interface Personality {
  id: PersonalityId;
  /** Display label shown in SettingsView card. */
  label: string;
  /** Longer description shown in SettingsView card. */
  description: string;
  /** Appended verbatim to the Anthropic system prompt for this persona. */
  systemPromptSuffix: string;
  /** Key used by fixture loader to pick the right ClosingText variant. */
  closingTextVariant: 'formal' | 'friendly' | 'short' | 'verbose';
}

/**
 * A TTS voice surfaced in UserPreferencesView.
 * Maps 1:1 onto the browser's SpeechSynthesisVoice API.
 */
export interface VoiceOption {
  /** SpeechSynthesisVoice.voiceURI */
  id: string;
  label: string;
  /** BCP-47 language tag, e.g. 'en-US'. */
  lang: string;
  gender?: 'female' | 'male' | 'neutral';
  isDefault?: boolean;
}

// ── 5. Dashboard & Docs ──────────────────────────────────────────────────────

/**
 * Data shape loaded from usage-dashboard.json.
 * Consumed exclusively by UsageDashboardView.
 */
export interface UsageDashboardData {
  totalQueries: number;
  totalUsers: number;
  avgLatencyMs: number;
  /** 0..1 fraction */
  successRate: number;
  topUseCases: Array<{ useCase: UseCase; count: number; pct: number }>;
  /** 30-day daily series */
  queryVolumeTrend: Array<{ date: string; count: number }>;
  topUsers: Array<{ name: string; queryCount: number }>;
  /** 0..1 fraction */
  errorRate: number;
}

/**
 * One Q&A entry from docs-qa-pairs.json (10 hardcoded pairs).
 * `keywords` drives the docs-specific keyword matcher in DocsView.
 */
export interface DocsQAPair {
  id: string;
  question: string;
  answer: string;
  keywords: string[];
  category?: string;
  source?: string;
  confidence?: number;
}

// ── 6. UW-004 DataTable Widget ───────────────────────────────────────────────

/** Cell rendering hint for DataTable columns. */
export type DataTableColumnFormat =
  | 'text'
  | 'currency'
  | 'date'
  | 'number'
  | 'percent'
  | 'badge';

/** Column descriptor for UW-004. `key` must match a key in each row object. */
export interface DataTableColumn {
  key: string;
  label: string;
  format?: DataTableColumnFormat;
  align?: 'left' | 'right' | 'center';
  /** CSS width string, e.g. '120px' or '20%'. */
  width?: string;
  sortable?: boolean;
}

/**
 * Data shape for UW-004 DataTable.
 * Used in the "widget swap" follow-up: CH-001 LineChart → UW-004 DataTable.
 */
export interface DataTableData {
  title?: string;
  columns: DataTableColumn[];
  rows: Array<Record<string, string | number | boolean | null>>;
  /** Optional totals row rendered with distinct styling at the bottom. */
  totalRow?: Record<string, string | number>;
}

/** Config for UW-004 DataTable. */
export interface DataTableConfig {
  /** Rows per page. Defaults to 10. */
  pageSize?: number;
  showPagination?: boolean;
  zebra?: boolean;
}

// ── 7. Conversation Tracking ─────────────────────────────────────────────────

/**
 * How Kai interpreted a follow-up message.
 * Drives which renderer branch ChatShell takes for the new turn.
 */
export type FollowUpType =
  | 'widget-swap'   // "show as table" → replaces CH-001 with UW-004
  | 'form-restage'  // natural-language edit → re-stages AW-004 via API
  | 'clarification' // generic follow-up question
  | 'none';

/**
 * A single chat turn — supersedes the lean v0 Message type.
 * Keeps backward-compat: same id/role/content/timestamp fields.
 * `isStale=true` triggers the stale overlay on old messages after a widget swap.
 */
export interface ConversationMessage {
  id: string;
  role: 'user' | 'assistant';
  /** User text or Kai's closing text. */
  content: string;
  /** Epoch ms. */
  timestamp: number;
  /** Assistant-only: the raw frame bundle rendered for this turn. */
  bundle?: FrameBundle;
  /** Assistant-only: how Kai classified this follow-up. */
  followUpType?: FollowUpType;
  /** Links a follow-up to its parent turn. Null/absent on originating messages. */
  parentMessageId?: string;
  /** True when this message has been superseded by a follow-up swap (gets stale overlay). */
  isStale?: boolean;
}

// ─── v2 Types ────────────────────────────────────────────────────────────────

// ── 1. Agent Store ───────────────────────────────────────────────────────────

/**
 * Filter category for agents in the Agent Store library view.
 * Drives the filter chip row on the PLP.
 */
export type AgentCategory =
  | 'sales'
  | 'support'
  | 'analytics'
  | 'operations'
  | 'general'
  | 'management';

/**
 * Lifecycle state of an agent from the user's perspective.
 * 'included'  — bundled with the product (Kai, Ella); no purchase needed.
 * 'purchased' — user has bought it this session (set by AgentStoreContext).
 * 'available' — in catalog, can be added to cart.
 * 'coming-soon' — shown as teaser, not purchasable.
 */
export type AgentStatus = 'included' | 'purchased' | 'available' | 'coming-soon';

/** A single capability bullet shown in the PDP "What it does" section. */
export interface AgentCapability {
  title: string;
  description: string;
}

/**
 * A data access permission shown in the PDP and checkout consent checklist.
 * `required` drives whether the checkbox is pre-checked and un-toggleable.
 */
export interface AgentDataPermission {
  /** Machine-readable key, e.g. 'orders', 'customers', 'invoices'. */
  id: string;
  name: string;
  description: string;
  required: boolean;
}

/**
 * An external integration the agent can use.
 * Shown in PDP "Integrations" section and editable in MyAgentConfigView.
 */
export interface AgentConnector {
  /** Machine-readable key, e.g. 'netsuite', 'hubspot', 'gmail'. */
  id: string;
  name: string;
  type: 'crm' | 'erp' | 'email' | 'storage' | 'analytics' | string;
  /** 'connected' = already linked in demo; 'available' = can be linked; 'unavailable' = not supported. */
  status: 'connected' | 'available' | 'unavailable';
  description: string;
}

/**
 * Pricing for purchasable agents.
 * `monthly` is numeric for cart math; `label` is pre-formatted display copy.
 * Null on included agents (Kai, Ella). PDP omits pricing display per CLAUDE.md rule 10.
 */
export interface AgentPricing {
  /** USD per month, numeric — used for cart subtotal arithmetic. */
  monthly: number;
  /** Pre-formatted display string, e.g. "$49/month per user". */
  label: string;
}

/**
 * One agent in the catalog. Source of truth is agent-store-catalog.json.
 * AgentStoreContext loads the full catalog and overlays `purchased` status
 * from sessionStorage onto each agent's `status` field at runtime.
 */
export interface Agent {
  id: string;
  name: string;
  /** Short value prop shown on PLP card, e.g. "Your AI sales co-pilot". */
  tagline: string;
  /** Long-form description shown on PDP. */
  description: string;
  category: AgentCategory;
  /** Base status from catalog; runtime `purchased` state applied by context. */
  status: AgentStatus;
  /** Icon path or asset name used on PLP card and PDP hero. */
  image: string;
  /** Accent hex or CSS var token that brand-styles the card, e.g. "#6366f1". */
  color: string;
  capabilities: AgentCapability[];
  dataPermissions: AgentDataPermission[];
  connectors: AgentConnector[];
  /** Null for included agents. Cart math must guard against null. */
  pricing: AgentPricing | null;
}

/**
 * One item in the Agent Store cart.
 * Stores a full Agent snapshot (not just id) so the cart survives catalog reshuffles.
 * Persisted to sessionStorage under key `kai.cart.v2`.
 */
export interface CartItem {
  agent: Agent;
  /** Epoch ms — used for sort order within the cart. */
  addedAt: number;
}

/**
 * Internal sub-view router for the Agent Store module.
 * Lives in AgentStoreContext as `currentStoreView` — NOT in ViewRoute.
 * The global layout only knows `'agent-store'`; the store owns all sub-navigation.
 */
export type AgentStoreView =
  | 'library'               // PLP — grid of all agents with filter chips
  | 'my-agents'             // user's included + purchased agents
  | 'agent-detail'          // PDP — single agent; driven by selectedAgentId
  | 'my-agent-config'       // post-purchase connector/permission config
  | 'payment'               // checkout step 1 — billing / confirm purchase
  | 'checkout-confirmation'; // checkout step 2 — success state

// ── 2. Advanced Dashboard ────────────────────────────────────────────────────

/**
 * Which tab is active inside DashboardLayout.
 * State lives in DashboardLayout local state — no global context needed.
 */
export type DashboardTab = 'overview' | 'performance' | 'usage' | 'agents';

/**
 * Preset date range selector shown at the top of DashboardLayout.
 * 'custom' is present in the UI but non-functional in the POC per CLAUDE.md.
 */
export type DashboardDateRangePreset = '7d' | '30d' | '90d' | 'custom';

/**
 * Date range value held in DashboardLayout local state.
 * startDate/endDate only populated when preset === 'custom' (non-functional in POC).
 */
export interface DashboardDateRange {
  preset: DashboardDateRangePreset;
  /** ISO date string, e.g. '2026-01-01'. Only used when preset === 'custom'. */
  startDate?: string;
  /** ISO date string. Only used when preset === 'custom'. */
  endDate?: string;
}

/**
 * Data shape for the Overview tab. Loaded from dashboard-overview.json.
 * `metrics` drives the 4 animated metric cards at the top.
 * `queryVolume` drives the StackedAreaChart.
 * `actionOutcomes` drives the DonutChart (confirmed / edited / cancelled).
 */
export interface DashboardOverviewData {
  metrics: {
    totalQueries: { value: number; deltaPct: number };
    activeUsers: { value: number; deltaPct: number };
    /** 0..1 fraction */
    successRate: { value: number; deltaPct: number };
    avgLatencyMs: { value: number; deltaPct: number };
  };
  /** Daily series — drives area/line chart. */
  queryVolume: Array<{ date: string; count: number }>;
  actionOutcomes: {
    confirmed: number;
    edited: number;
    cancelled: number;
  };
}

/**
 * Data shape for the Performance tab. Loaded from dashboard-performance.json.
 * `latencyBreakdown` drives the LatencyTable (p50/p95/p99 per stage).
 * `ttffTrend` drives the time-to-first-frame line chart.
 * `intentClassification` and `entityResolution` drive accuracy metric cards.
 * `fallbackRate` drives the PatternList / bar chart.
 */
export interface DashboardPerformanceData {
  latencyBreakdown: Array<{
    stage: 'ingestion' | 'planning' | 'execution' | 'widgetResolve' | string;
    p50: number;
    p95: number;
    p99: number;
  }>;
  ttffTrend: Array<{ date: string; ttffMs: number }>;
  intentClassification: {
    /** 0..1 fraction */
    accuracy: number;
    confusionMatrix?: Array<{ predicted: UseCase; actual: UseCase; count: number }>;
  };
  entityResolution: {
    /** 0..1 fraction */
    successRate: number;
    avgCandidates: number;
  };
  fallbackRate: {
    /** 0..1 overall fallback rate */
    overall: number;
    byUseCase: Array<{ useCase: UseCase; rate: number }>;
  };
}

/**
 * Data shape for the Usage tab. Loaded from dashboard-usage.json.
 * `tokenConsumption` drives the StackedBarChart (input / output / cached tokens per day).
 * `topQueryPatterns` drives the PatternList.
 * `peakHours` drives the HeatmapChart (hour-of-day × day-of-week grid).
 */
export interface DashboardUsageData {
  tokenConsumption: Array<{
    date: string;
    inputTokens: number;
    outputTokens: number;
    cachedTokens?: number;
  }>;
  topQueryPatterns: Array<{
    /** Template string, e.g. "How is {customer} doing?" */
    pattern: string;
    count: number;
    avgLatencyMs: number;
  }>;
  peakHours: Array<{
    /** 0..23 */
    hourOfDay: number;
    /** 0..6, Sunday = 0 */
    dayOfWeek: number;
    queryCount: number;
  }>;
}

/**
 * Data shape for the Agents tab. Loaded from dashboard-agents.json.
 * `agentStatus` drives the status table; references Agent.id for deep-links.
 * `queriesPerAgent` and `actionsPerAgent` drive grouped bar charts.
 * `topCapabilities` drives the capability leaderboard list.
 */
export interface DashboardAgentsData {
  agentStatus: Array<{
    /** Matches Agent.id in agent-store-catalog.json. */
    agentId: string;
    agentName: string;
    status: 'active' | 'idle' | 'error';
    /** Epoch ms of last query handled by this agent. */
    lastActiveTimestamp: number;
  }>;
  queriesPerAgent: Array<{ agentId: string; count: number }>;
  actionsPerAgent: Array<{ agentId: string; count: number }>;
  topCapabilities: Array<{
    agentId: string;
    capability: string;
    invocations: number;
  }>;
}

// ─── v2.1 Types ──────────────────────────────────────────────────────────────

// ── Action Chips ─────────────────────────────────────────────────────────────

export interface ActionChip {
  label: string;
  /** May contain {templateVar} placeholders resolved at send time. */
  query: string;
  icon: string;
  category: 'suggested' | 'page-action' | 'follow-on';
}

export interface ActionChipsMap {
  /** Keyed by capability id. */
  capabilityChips: Record<string, ActionChip[]>;
  /** Keyed by WizOrderPageName. */
  pageChips: Record<string, ActionChip[]>;
}

// ── Highlights ───────────────────────────────────────────────────────────────

export interface WidgetHighlight {
  /** dot-notation path into widget data, e.g. "paymentStatus" or "items[0].dueDate" */
  fieldPath: string;
  type: 'urgent' | 'warning' | 'positive' | 'info';
  message: string;
  action?: ActionChip;
}

// ── Proactive Brief ──────────────────────────────────────────────────────────

export interface BriefItem {
  icon: string;
  text: string;
  priority: 'urgent' | 'attention' | 'info';
  actionChip?: ActionChip;
}

export interface ProactiveBrief {
  briefType: string;
  greeting: string;
  urgentItems: BriefItem[];
  todaysSummary: BriefItem[];
}

// ── Page Context ─────────────────────────────────────────────────────────────

export type WizOrderPageName =
  | 'dashboard'
  | 'orders'
  | 'customers'
  | 'products'
  | 'crm';

export interface PageContextData {
  currentPage: WizOrderPageName | null;
  /** Truncated data snapshot injected into LLM system prompt. */
  pageData: Record<string, unknown>;
  pageActions: ActionChip[];
  starterPrompts: string[];
  proactiveBrief: ProactiveBrief;
}

// ── Dashboard Builder ─────────────────────────────────────────────────────────

export type DashboardLayout = 'grid-2x2' | 'grid-2x3' | 'grid-3x2';

export interface DashboardCell {
  /**
   * Cell placement. `row` and `col` are optional — when omitted the cell
   * auto-places into the current grid (used after layout changes so cells
   * re-flow into the new column count instead of clinging to stale positions).
   */
  position: { row?: number; col?: number; colSpan?: number };
  widgetType: string;
  data: Record<string, unknown>;
  config?: Record<string, unknown>;
  highlights?: WidgetHighlight[];
}

export interface DashboardCompositeData {
  title: string;
  description: string;
  layout: DashboardLayout;
  cells: DashboardCell[];
}

export interface SavedDashboard extends SavedArtifact {
  dashboardData: DashboardCompositeData;
}

/** A workflow the user activated from an ad29-workflow turn. Persisted under
 *  the "Scheduled" category in MyArtifactsView. */
export interface SavedWorkflow extends SavedArtifact {
  workflowId: string;
  /** Cached audience-size cards for rendering the artifact tile. */
  audienceSummary: string;
  /** Status text shown on the artifact tile. */
  scheduleStatus: string;
  /** Plain-text trigger description for the artifact tile. */
  trigger: string;
}

// ── Shared State (Kai ↔ WizOrder pages) ──────────────────────────────────────

export interface KaiCreatedItem {
  id: string;
  createdAt: string;
  readonly createdByKai: true;
}

export interface SharedOrder extends KaiCreatedItem {
  orderNumber: string;
  customer: string;
  customerId: string;
  total: number;
  status: string;
  items: number;
  rep: string;
}

export interface SharedTask extends KaiCreatedItem {
  title: string;
  type: string;
  priority: string;
  assignedTo: string;
  dueDate: string;
  status: string;
  customerId?: string;
  customerName?: string;
}

export interface SharedQuote extends KaiCreatedItem {
  quoteNumber: string;
  customer: string;
  amount: number;
  status: string;
  expiryDate: string;
}

// ── WizOrder Page Entity Types ────────────────────────────────────────────────

export interface WizOrderOrder {
  id: string;
  orderNumber?: string;
  customer: string;
  customerId?: string;
  total: number;
  status: string;
  rep: string;
  date: string;
  items?: number;
  createdByKai?: boolean;
}

export interface WizOrderCustomer {
  id: string;
  name: string;
  contact: string;
  lifetimeRevenue: number;
  lastOrder: string;
  tags: string[];
  rep: string;
  status: 'Active' | 'Dormant' | string;
  ordersYTD: number;
  createdByKai?: boolean;
}

export interface WizOrderProduct {
  sku: string;
  name: string;
  price: number;
  stock: number;
  status: 'In Stock' | 'Low Stock' | 'Out of Stock' | string;
  category: string;
  image: string;
}

export interface WizOrderTask {
  id: string;
  title: string;
  customer: string | null;
  dueDate: string;
  priority: 'High' | 'Medium' | 'Low' | string;
  assignedTo: string;
  status: 'Open' | 'In Progress' | 'Overdue' | 'Completed' | string;
  type: 'Follow Up' | 'Site Visit' | 'Email' | 'Schedule Call' | 'Other' | string;
  createdByKai?: boolean;
}

export interface WizOrderLead {
  id: string;
  name: string;
  contact: string;
  source: 'Trade Show' | 'Website' | 'Referral' | string;
  status: 'New' | 'Contacted' | 'Qualified' | string;
  assignedTo: string;
  createdDate: string;
  lastContact: string | null;
}

export interface WizOrderDeal {
  id: string;
  name: string;
  value: number;
  stage: 'Qualified' | 'Proposal Sent' | 'Negotiation' | string;
  customer: string;
  rep: string;
  closeDate: string;
}

// ── Onboarding ────────────────────────────────────────────────────────────────

export interface OnboardingState {
  completed: boolean;
  completedAt?: string;
  selectedPersonaId?: string;
}

// ── Command Palette ───────────────────────────────────────────────────────────

export interface CommandItem {
  id: string;
  label: string;
  category: 'Sales' | 'Admin' | 'Navigation' | 'Settings';
  /** For capability items — auto-sends on selection. */
  query?: string;
  /** For navigation items — triggers route change. */
  route?: string;
  icon: string;
}
