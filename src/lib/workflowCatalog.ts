/**
 * Server-side / shared workflow catalog. Each entry carries the data needed to
 * render both the "Setup" turn (ad29-workflow) and the "Test with sample data"
 * turn (ad29-test) for that specific workflow.
 *
 * The two render functions return plain widget arrays — no fixture JSON files.
 * Adding a new workflow = adding one entry here.
 */

export type WorkflowId =
  | 'dormant-reengagement'
  | 'quote-expiry-reminder'
  | 'low-stock-reorder'
  | 'vip-upgrade'
  | 'high-value-approval'
  | 'stalled-deal-nudge'
  | 'new-customer-onboarding';

export interface CatalogWorkflow {
  id: WorkflowId;
  /** Display label shown on the ClarificationCard option row. */
  label: string;
  /** One-line helper rendered under the label on the ClarificationCard. */
  description: string;
  /** Data backing the UW-003 entity card on the ad29-workflow turn. */
  detail: {
    workflowName: string;
    trigger: string;
    audience: string;
    steps: string[];
    status: string;
  };
  /** UW-002 metrics on the setup turn (audience-size cards). */
  setupMetrics: { label: string; value: string; format: 'count' | 'currency' | 'percent' }[];
  /** UW-014 reasoning summary for the setup turn. */
  setupSummary: string;
  /** Closing insight text on the setup turn. */
  setupClosing: string;
  /** UW-002 metrics on the "Test with sample data" turn. */
  testMetrics: { label: string; value: string; format: 'count' | 'currency' | 'percent' }[];
  /** Sample triggered records — feeds the UW-004 data table on the test turn. */
  testRecords: { customer: string; tier: string; detail: string; ltv: string; wouldDo: string }[];
  /** Test-turn reasoning summary. */
  testSummary: string;
  /** Test-turn closing insight. */
  testClosing: string;
}

export const WORKFLOW_CATALOG: CatalogWorkflow[] = [
  {
    id: 'dormant-reengagement',
    label: 'Dormant Customer Re-engagement',
    description: 'Email customers who haven\'t ordered in 60+ days, escalate to rep + exec if no response.',
    detail: {
      workflowName: 'Dormant Re-engagement (Q2)',
      trigger: 'Customer has no order in last 60 days',
      audience: 'VIP + Standard tiers, US only',
      steps: [
        'Send re-engagement email with category highlights',
        'Wait 5 days; if no order, create rep follow-up task',
        'Wait 10 days; if no response, flag account for executive review',
      ],
      status: 'Draft — not yet active',
    },
    setupMetrics: [
      { label: 'Audience Match', value: '32', format: 'count' },
      { label: 'VIP in Audience', value: '7', format: 'count' },
      { label: 'Avg Days Dormant', value: '84', format: 'count' },
      { label: 'Combined LTV', value: '$2.1M', format: 'currency' },
    ],
    setupSummary: 'Drafted dormant-customer re-engagement workflow. Defined trigger, conditions, and 3-step action sequence.',
    setupClosing: 'Workflow drafted: 3-step re-engagement sequence triggered by 60-day dormancy. 32 customers currently match — including 7 VIPs with $2.1M combined LTV. Want to test against the last 30 days first or activate now?',
    testMetrics: [
      { label: 'Triggered', value: '12', format: 'count' },
      { label: 'Would Email', value: '12', format: 'count' },
      { label: 'Would Task', value: '8', format: 'count' },
      { label: 'Would Flag', value: '2', format: 'count' },
    ],
    testRecords: [
      { customer: 'Pacific Goods', tier: 'VIP', detail: '62 days dormant', ltv: '$312,000', wouldDo: 'Email' },
      { customer: 'BlueRidge Decor', tier: 'Standard', detail: '67 days dormant', ltv: '$148,000', wouldDo: 'Email' },
      { customer: 'Stillwater Co', tier: 'Standard', detail: '71 days dormant', ltv: '$96,400', wouldDo: 'Email + Task' },
      { customer: 'Cedar & Co', tier: 'Standard', detail: '78 days dormant', ltv: '$84,200', wouldDo: 'Email + Task' },
      { customer: 'Highland Goods', tier: 'VIP', detail: '92 days dormant', ltv: '$278,000', wouldDo: 'Email + Task + Flag' },
    ],
    testSummary: 'Replayed dormant re-engagement workflow against last 30 days. Identified records that would have triggered.',
    testClosing: 'Over the last 30 days, 12 customers would have triggered this workflow — 2 escalated to exec review. Pacific Goods and Highland Goods would be the highest-LTV touches. Workflow looks healthy; activate when ready.',
  },
  {
    id: 'quote-expiry-reminder',
    label: 'Quote Expiry Reminder',
    description: 'Nudge customer and rep three days before an open quote expires.',
    detail: {
      workflowName: 'Quote Expiry Reminder',
      trigger: 'Open quote expires in 3 days',
      audience: 'All quotes in Pending status, any tier',
      steps: [
        'Send reminder email to customer with quote summary + extended-discount option',
        'Slack-notify the assigned rep + their manager',
        'If still no response 24h before expiry, auto-flag the deal as at-risk',
      ],
      status: 'Draft — not yet active',
    },
    setupMetrics: [
      { label: 'Open Quotes', value: '18', format: 'count' },
      { label: 'Expiring This Week', value: '4', format: 'count' },
      { label: 'Avg Quote Value', value: '$7,200', format: 'currency' },
      { label: 'At-Risk Value', value: '$28.8K', format: 'currency' },
    ],
    setupSummary: 'Drafted quote-expiry reminder workflow. Captures the 4 quotes expiring this week.',
    setupClosing: 'Workflow drafted: 3-day pre-expiry reminder for open quotes. 4 quotes ($28.8K) would trigger this week — including Acme\'s Summer Collection ($8.2K) tomorrow. Test or activate?',
    testMetrics: [
      { label: 'Triggered', value: '11', format: 'count' },
      { label: 'Customer Reminded', value: '11', format: 'count' },
      { label: 'Rep Notified', value: '11', format: 'count' },
      { label: 'Closed Won', value: '6', format: 'count' },
    ],
    testRecords: [
      { customer: 'Acme Corp', tier: 'VIP', detail: 'QT-1192 · $8,200', ltv: '$482,000', wouldDo: 'Email + Slack' },
      { customer: 'Pinnacle Retail', tier: 'VIP', detail: 'QT-1198 · $12,800', ltv: '$386,000', wouldDo: 'Email + Slack' },
      { customer: 'Metro Design', tier: 'Standard', detail: 'QT-1210 · $5,600', ltv: '$74,000', wouldDo: 'Email + Slack + At-Risk Flag' },
      { customer: 'Coastal Living', tier: 'VIP', detail: 'QT-1186 · $9,400', ltv: '$254,000', wouldDo: 'Email + Slack' },
      { customer: 'Summit Home', tier: 'Standard', detail: 'QT-1203 · $4,100', ltv: '$62,000', wouldDo: 'Email + Slack + At-Risk Flag' },
    ],
    testSummary: 'Replayed quote-expiry reminder against the last 30 days. 11 quotes hit the 3-day window.',
    testClosing: 'Over 30 days, 11 quotes would have triggered. 6 of those closed-won after the reminder — a ~55% recovery rate on otherwise expiring quotes. Strong signal to activate.',
  },
  {
    id: 'low-stock-reorder',
    label: 'Low-Stock Reorder Alert',
    description: 'Detect SKUs below reorder threshold and draft a purchase order for ops review.',
    detail: {
      workflowName: 'Low-Stock Reorder Alert',
      trigger: 'SKU inventory drops below reorder threshold',
      audience: 'All active SKUs across 14 collections',
      steps: [
        'Notify ops team in #ops-inventory Slack channel',
        'Auto-draft a purchase order using the SKU\'s default supplier',
        'Schedule a check-in 7 days later to confirm PO confirmation',
      ],
      status: 'Draft — not yet active',
    },
    setupMetrics: [
      { label: 'Active SKUs', value: '842', format: 'count' },
      { label: 'Below Threshold', value: '12', format: 'count' },
      { label: 'Out of Stock', value: '4', format: 'count' },
      { label: 'At-Risk Sales', value: '$48,200', format: 'currency' },
    ],
    setupSummary: 'Drafted low-stock reorder workflow. Identified 12 SKUs below threshold and 4 fully OOS.',
    setupClosing: 'Workflow drafted: auto-draft POs when stock dips below threshold. 12 SKUs would trigger today — 4 are already out and blocking $48.2K in pending orders. Test or activate?',
    testMetrics: [
      { label: 'Triggered', value: '9', format: 'count' },
      { label: 'POs Drafted', value: '9', format: 'count' },
      { label: 'Avg Lead Time', value: '14 days', format: 'count' },
      { label: 'Estimated PO Cost', value: '$24,600', format: 'currency' },
    ],
    testRecords: [
      { customer: 'WC-LMP-018', tier: 'SKU', detail: 'Artisan Table Lamp — Brass · 3 left', ltv: '$185 / unit', wouldDo: 'Slack + Draft PO' },
      { customer: 'WC-VAS-042', tier: 'SKU', detail: 'Ceramic Vase Set — Ocean Blue · 5 left', ltv: '$145 / unit', wouldDo: 'Slack + Draft PO' },
      { customer: 'WC-CDL-006', tier: 'SKU', detail: 'Soy Candle Collection — 6pk · 0 left', ltv: '$32 / unit', wouldDo: 'Slack + Draft PO + Escalate' },
      { customer: 'WC-PIL-021', tier: 'SKU', detail: 'Linen Throw Pillow — Sand · 7 left', ltv: '$42 / unit', wouldDo: 'Slack + Draft PO' },
      { customer: 'WC-SCN-014', tier: 'SKU', detail: 'Wall Sconce — Matte Black · 0 left', ltv: '$245 / unit', wouldDo: 'Slack + Draft PO + Escalate' },
    ],
    testSummary: 'Replayed low-stock reorder against the last 30 days. 9 SKUs would have triggered.',
    testClosing: '9 SKUs would have triggered, drafting POs worth ~$24.6K. Two SKUs (Soy Candle, Wall Sconce) were already blocking $11K in pending orders by the time the alert fires — consider tightening the threshold by 10 units.',
  },
  {
    id: 'vip-upgrade',
    label: 'VIP Upgrade Trigger',
    description: 'Promote customers to VIP when LTV crosses $100K — assign senior rep and send a congrats note.',
    detail: {
      workflowName: 'VIP Upgrade Trigger',
      trigger: 'Customer LTV crosses $100,000',
      audience: 'Standard-tier customers with positive YoY growth',
      steps: [
        'Update customer tier to VIP in CRM',
        'Reassign account to a senior rep with VIP capacity',
        'Send a personalized congratulatory email from the senior rep',
      ],
      status: 'Draft — not yet active',
    },
    setupMetrics: [
      { label: 'Standard Customers', value: '142', format: 'count' },
      { label: 'Near Threshold', value: '8', format: 'count' },
      { label: 'Crossing This Quarter', value: '3', format: 'count' },
      { label: 'Combined LTV', value: '$326K', format: 'currency' },
    ],
    setupSummary: 'Drafted VIP-upgrade workflow. 3 customers are projected to cross $100K LTV this quarter.',
    setupClosing: 'Workflow drafted: auto-upgrade Standard customers crossing $100K LTV. 3 customers ($326K combined) would trigger this quarter. Bay Area Boutiques is closest — currently at $98.4K. Test or activate?',
    testMetrics: [
      { label: 'Triggered', value: '4', format: 'count' },
      { label: 'Tier Updated', value: '4', format: 'count' },
      { label: 'Reps Reassigned', value: '4', format: 'count' },
      { label: 'Combined New LTV', value: '$418K', format: 'currency' },
    ],
    testRecords: [
      { customer: 'Bay Area Boutiques', tier: 'Standard → VIP', detail: 'LTV $108K · crossed Mar 14', ltv: '$108,200', wouldDo: 'Upgrade + Reassign + Email' },
      { customer: 'Western Crafts', tier: 'Standard → VIP', detail: 'LTV $102K · crossed Mar 28', ltv: '$102,400', wouldDo: 'Upgrade + Reassign + Email' },
      { customer: 'Lighthouse Home', tier: 'Standard → VIP', detail: 'LTV $115K · crossed Apr 09', ltv: '$115,800', wouldDo: 'Upgrade + Reassign + Email' },
      { customer: 'Driftwood Goods', tier: 'Standard → VIP', detail: 'LTV $101K · crossed Apr 22', ltv: '$101,200', wouldDo: 'Upgrade + Reassign + Email' },
    ],
    testSummary: 'Replayed VIP-upgrade trigger against the last 30 days. 4 customers crossed the threshold.',
    testClosing: '4 customers would have been promoted in the last 30 days, totalling $418K in upgraded LTV. All four are now on senior reps with VIP capacity — a clean retention play to activate.',
  },
  {
    id: 'high-value-approval',
    label: 'High-Value Order Approval',
    description: 'Route orders above $25K to admin review and Slack-alert the approver.',
    detail: {
      workflowName: 'High-Value Order Approval',
      trigger: 'New order total exceeds $25,000',
      audience: 'All confirmed orders, any customer tier',
      steps: [
        'Pause order from auto-confirming',
        'Notify admin approver in #approvals Slack channel',
        'Auto-confirm if approved within 4 hours; escalate otherwise',
      ],
      status: 'Draft — not yet active',
    },
    setupMetrics: [
      { label: 'Orders This Quarter', value: '412', format: 'count' },
      { label: 'Over $25K', value: '14', format: 'count' },
      { label: 'Avg High-Value Order', value: '$38,400', format: 'currency' },
      { label: 'Total Gated Value', value: '$538K', format: 'currency' },
    ],
    setupSummary: 'Drafted high-value approval workflow. 14 orders this quarter would have been gated for review.',
    setupClosing: 'Workflow drafted: gate orders over $25K for admin review. 14 orders ($538K) this quarter would have triggered. Average review window historically clears in 2.1 hours. Test or activate?',
    testMetrics: [
      { label: 'Triggered', value: '5', format: 'count' },
      { label: 'Auto-Approved (<4h)', value: '4', format: 'count' },
      { label: 'Escalated', value: '1', format: 'count' },
      { label: 'Combined Value', value: '$192K', format: 'currency' },
    ],
    testRecords: [
      { customer: 'Pinnacle Retail', tier: 'VIP', detail: 'ORD-3014 · $48,200', ltv: '$386,000', wouldDo: 'Gate + Slack + Auto-approve' },
      { customer: 'Acme Corp', tier: 'VIP', detail: 'ORD-3022 · $32,100', ltv: '$482,000', wouldDo: 'Gate + Slack + Auto-approve' },
      { customer: 'Coastal Living', tier: 'VIP', detail: 'ORD-3027 · $28,800', ltv: '$254,000', wouldDo: 'Gate + Slack + Auto-approve' },
      { customer: 'Riverstone LLC', tier: 'Standard', detail: 'ORD-3038 · $44,600', ltv: '$186,000', wouldDo: 'Gate + Slack + Escalate' },
      { customer: 'Pacific Goods', tier: 'VIP', detail: 'ORD-3044 · $38,400', ltv: '$312,000', wouldDo: 'Gate + Slack + Auto-approve' },
    ],
    testSummary: 'Replayed high-value approval against the last 30 days. 5 orders cleared the threshold.',
    testClosing: 'Over 30 days, 5 orders worth $192K would have been gated — 4 cleared within 4 hours, 1 escalated (Riverstone took 11 hours). Activating this would protect against the one $44.6K escalation while barely slowing the others.',
  },
  {
    id: 'stalled-deal-nudge',
    label: 'Stalled Deal Nudge',
    description: 'Alert rep + manager when a deal sits in the same stage for 14+ days without activity.',
    detail: {
      workflowName: 'Stalled Deal Nudge',
      trigger: 'Deal in same pipeline stage 14+ days with no activity',
      audience: 'All open deals across the sales team',
      steps: [
        'Email the assigned rep with a stage history + last-touch summary',
        'CC the rep\'s manager if the deal has been stalled 21+ days',
        'Auto-flag the deal as at-risk after 30 days with no movement',
      ],
      status: 'Draft — not yet active',
    },
    setupMetrics: [
      { label: 'Open Deals', value: '48', format: 'count' },
      { label: 'Stalled 14+ Days', value: '9', format: 'count' },
      { label: 'Stalled 21+ Days', value: '4', format: 'count' },
      { label: 'Stalled Value', value: '$112K', format: 'currency' },
    ],
    setupSummary: 'Drafted stalled-deal nudge workflow. 9 deals are currently inactive ≥14 days.',
    setupClosing: 'Workflow drafted: nudge reps when a deal stagnates 14+ days. 9 deals ($112K) currently match — 4 of those are over 21 days and would also CC managers. Test or activate?',
    testMetrics: [
      { label: 'Triggered', value: '14', format: 'count' },
      { label: 'Rep Emailed', value: '14', format: 'count' },
      { label: 'Manager CC\'d', value: '6', format: 'count' },
      { label: 'Re-engaged', value: '8', format: 'count' },
    ],
    testRecords: [
      { customer: 'Acme Corp', tier: 'VIP', detail: 'DEAL-204 · 18 days in Proposal Sent', ltv: '$482,000', wouldDo: 'Email rep' },
      { customer: 'Bay Area Boutiques', tier: 'Standard', detail: 'DEAL-215 · 23 days in Negotiation', ltv: '$108,200', wouldDo: 'Email rep + CC manager' },
      { customer: 'Hearth & Home', tier: 'Standard', detail: 'DEAL-222 · 16 days in Proposal Sent', ltv: '$72,400', wouldDo: 'Email rep' },
      { customer: 'Western Crafts', tier: 'VIP', detail: 'DEAL-228 · 25 days in Negotiation', ltv: '$102,400', wouldDo: 'Email rep + CC manager' },
      { customer: 'Driftwood Goods', tier: 'Standard', detail: 'DEAL-233 · 14 days in Qualified', ltv: '$101,200', wouldDo: 'Email rep' },
    ],
    testSummary: 'Replayed stalled-deal nudge against the last 30 days. 14 deals would have triggered.',
    testClosing: '14 deals would have been nudged — 8 of them re-engaged within 48 hours of the email. Strongest signal: deals at 21+ days where the manager-CC moved 5 of 6 forward. Worth activating.',
  },
  {
    id: 'new-customer-onboarding',
    label: 'New Customer Onboarding',
    description: 'Trigger a welcome email, onboarding task, and 30-day check-in on a customer\'s first order.',
    detail: {
      workflowName: 'New Customer Onboarding',
      trigger: 'Customer places their first confirmed order',
      audience: 'All new customers, any tier',
      steps: [
        'Send a welcome email with onboarding resources from the assigned rep',
        'Create a "30-day check-in" task in the rep\'s CRM queue',
        'After 60 days, evaluate for VIP tier if LTV trajectory qualifies',
      ],
      status: 'Draft — not yet active',
    },
    setupMetrics: [
      { label: 'Active Customers', value: '156', format: 'count' },
      { label: 'New This Quarter', value: '27', format: 'count' },
      { label: 'Avg First-Order', value: '$2,840', format: 'currency' },
      { label: '60-Day Retention', value: '74%', format: 'percent' },
    ],
    setupSummary: 'Drafted new-customer onboarding workflow. 27 new customers this quarter would have entered the sequence.',
    setupClosing: 'Workflow drafted: 3-step onboarding triggered by first order. 27 new customers this quarter would have entered the sequence with a 74% 60-day retention rate. Test or activate?',
    testMetrics: [
      { label: 'Triggered', value: '9', format: 'count' },
      { label: 'Welcomed', value: '9', format: 'count' },
      { label: 'Tasks Created', value: '9', format: 'count' },
      { label: 'Second-Order Rate', value: '67%', format: 'percent' },
    ],
    testRecords: [
      { customer: 'Birch & Bone', tier: 'New · Standard', detail: 'First order · $1,840', ltv: '$1,840', wouldDo: 'Welcome + Task' },
      { customer: 'Northbound Goods', tier: 'New · Standard', detail: 'First order · $3,200', ltv: '$3,200', wouldDo: 'Welcome + Task' },
      { customer: 'Willow & Pine', tier: 'New · Standard', detail: 'First order · $4,460', ltv: '$4,460', wouldDo: 'Welcome + Task' },
      { customer: 'Tidewater Design', tier: 'New · Standard', detail: 'First order · $2,180', ltv: '$2,180', wouldDo: 'Welcome + Task' },
      { customer: 'Goldleaf Studio', tier: 'New · Standard', detail: 'First order · $5,640', ltv: '$5,640', wouldDo: 'Welcome + Task' },
    ],
    testSummary: 'Replayed new-customer onboarding against the last 30 days. 9 customers entered the sequence.',
    testClosing: '9 customers were welcomed in the last 30 days, with 6 placing a second order within 30 days (67%). The two best second-order customers — Willow & Pine and Goldleaf Studio — both responded to the welcome email within 48 hours. Strong activation case.',
  },
];

const BY_ID = new Map(WORKFLOW_CATALOG.map((w) => [w.id, w]));

export function getWorkflow(id: WorkflowId): CatalogWorkflow | null {
  return BY_ID.get(id) ?? null;
}

/**
 * Best-effort id resolution from a free-form user query. Falls back to null
 * if no workflow keyword set matches — the caller should then clarify.
 */
const ID_KEYWORDS: { id: WorkflowId; keywords: string[] }[] = [
  { id: 'dormant-reengagement', keywords: ['dormant', 're-engage', 'reengage'] },
  { id: 'quote-expiry-reminder', keywords: ['quote expiry', 'expiring quote', 'quote reminder', 'expire quote'] },
  { id: 'low-stock-reorder', keywords: ['low stock', 'reorder', 'inventory alert', 'restock workflow'] },
  { id: 'vip-upgrade', keywords: ['vip upgrade', 'tier upgrade', 'promote vip', 'vip promotion'] },
  { id: 'high-value-approval', keywords: ['high-value approval', 'high value approval', 'large order approval', 'order approval workflow'] },
  { id: 'stalled-deal-nudge', keywords: ['stalled deal', 'stalled pipeline', 'deal nudge', 'pipeline nudge'] },
  { id: 'new-customer-onboarding', keywords: ['onboarding', 'new customer', 'welcome workflow', 'first order workflow'] },
];

export function inferWorkflowId(message: string): WorkflowId | null {
  const m = message.toLowerCase();
  for (const entry of ID_KEYWORDS) {
    if (entry.keywords.some((kw) => m.includes(kw))) return entry.id;
  }
  return null;
}

/**
 * Returns true when the message is a vague workflow-setup request that should
 * trigger the ClarificationCard rather than apply directly.
 */
export function isVagueWorkflowRequest(message: string): boolean {
  const m = message.toLowerCase().trim();
  // Specifically "set up a workflow" / "create a workflow" with no identifier.
  if (inferWorkflowId(m)) return false;
  return /(set up|create|build|configure|make).{0,12}\bworkflow\b/i.test(m)
    || /\bworkflow\b/i.test(m) && /\b(another|new|different)\b/i.test(m);
}
