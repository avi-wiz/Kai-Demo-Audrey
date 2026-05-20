import type { UseCase, WizOrderPageName, ClosingText } from './types';
import { parseFrame } from '@/components/engine/FrameParser';
import type { ParsedWidget } from '@/components/engine/FrameParser';

// ── Page-context fixture types ────────────────────────────────────────────────

interface PageQueryWidget {
  widgetType: string;
  data: Record<string, unknown>;
  config?: Record<string, unknown>;
  highlights?: unknown[];
}

interface PageQuery {
  id: string;
  keywords: string[];
  frameId: string;
  frameType: 'result' | 'reasoning' | 'action_staged' | 'error' | 'clarification';
  widgets: PageQueryWidget[];
  closingText: ClosingText;
}

interface PageContextFixture {
  pageQueries: PageQuery[];
}

// ── Fixture imports (static — bundled at build time) ──────────────────────────

import salesPerfFixture from '@/fixtures/dashboard-sales-performance.json';
import orderAnalyticsFixture from '@/fixtures/dashboard-order-analytics.json';
// customerHealthFixture removed — keywords hijacked by report-customer-health capability route
// pipelineFixture removed — keywords hijacked by report-pipeline capability route
import ordersFixture from '@/fixtures/page-context-orders.json';
import customersFixture from '@/fixtures/page-context-customers.json';
import productsFixture from '@/fixtures/page-context-products.json';
import crmFixture from '@/fixtures/page-context-crm.json';
import dashboardFixture from '@/fixtures/page-context-dashboard.json';
import orderHistoryFixture from '@/fixtures/special-order-history.json';
import meetingPrepFixture from '@/fixtures/special-meeting-prep.json';

const PAGE_FIXTURES: Record<WizOrderPageName, PageContextFixture> = {
  orders:    ordersFixture as unknown as PageContextFixture,
  customers: customersFixture as unknown as PageContextFixture,
  products:  productsFixture as unknown as PageContextFixture,
  crm:       crmFixture as unknown as PageContextFixture,
  dashboard: dashboardFixture as unknown as PageContextFixture,
};

export interface DashboardMatch {
  widgets: ParsedWidget[];
  closingText: ClosingText;
  capability: string;
}

export interface PageContextMatch {
  widgets: ParsedWidget[];
  closingText: ClosingText;
}

type DashboardFixtureRaw = { widgets: PageQueryWidget[]; closingText: ClosingText; capability: string; frameId: string };

const DASHBOARD_ROUTES: { keywords: string[]; fixture: DashboardFixtureRaw }[] = [
  // customer-health route removed — keywords moved to report-customer-health capability route
  // { keywords: ['customer health', 'customer dashboard', 'customer retention', 'dormant customer', 'churn dashboard', 'retention dashboard'], fixture: customerHealthFixture },
  {
    keywords: ['order analytics', 'order dashboard', 'order volume', 'fulfillment dashboard', 'orders dashboard'],
    fixture: orderAnalyticsFixture as unknown as DashboardFixtureRaw,
  },
  // pipeline route removed — keywords moved to report-pipeline capability route
  // { keywords: ['pipeline dashboard', 'pipeline health', 'open quotes', 'quote pipeline', 'deal pipeline', 'show pipeline'], fixture: pipelineFixture },
  {
    keywords: ['sales dashboard', 'sales performance', 'build me a dashboard', 'build a dashboard', 'build a sales', 'create a dashboard', 'create a sales', 'rep performance', 'revenue dashboard', 'save this as a dashboard', 'save as dashboard'],
    fixture: salesPerfFixture as unknown as DashboardFixtureRaw,
  },
];

/**
 * Matches dashboard-builder queries before page/general matchers.
 * Returns parsed widgets + closingText from the best-matching fixture, or null.
 */
export function matchDashboardQuery(message: string): DashboardMatch | null {
  const m = message.toLowerCase();

  const route = DASHBOARD_ROUTES.find((r) => r.keywords.some((kw) => m.includes(kw)));
  if (!route) return null;

  const { fixture } = route;
  const parsed = parseFrame(
    {
      frameId: fixture.frameId ?? 'f-dash',
      frameType: 'result',
      widgets: fixture.widgets,
    } as Parameters<typeof parseFrame>[0],
    0,
  );

  return { widgets: parsed, closingText: fixture.closingText, capability: fixture.capability ?? 'dashboard-builder' };
}

/**
 * If the user is on a WizOrder page AND the query matches a keyword from the
 * page-context fixture for that page, returns the pre-parsed widgets +
 * closingText to render directly. Returns null to fall through to normal routing.
 */
export function matchPageContextQuery(
  page: WizOrderPageName | null,
  message: string,
): PageContextMatch | null {
  if (!page) return null;

  const fixture = PAGE_FIXTURES[page];
  if (!fixture) return null;

  const m = message.toLowerCase();

  for (const query of fixture.pageQueries) {
    const hit = query.keywords.some((kw) => m.includes(kw.toLowerCase()));
    if (!hit) continue;

    // Build a minimal Frame and run it through the real FrameParser
    const frame = {
      frameId: query.frameId,
      frameType: query.frameType,
      widgets: query.widgets,
    };
    const parsed = parseFrame(frame as Parameters<typeof parseFrame>[0], 0);

    return { widgets: parsed, closingText: query.closingText };
  }

  return null;
}

// Specialized routes (order history, meeting prep) handled before matchQuery.
type SpecialFixtureRaw = { widgets: PageQueryWidget[]; closingText: ClosingText; frameId: string };

const SPECIAL_ROUTES: { keywords: string[]; fixture: SpecialFixtureRaw }[] = [
  {
    keywords: ['recent orders', 'order history', 'past orders', 'previous orders', "'s recent orders", 'show order history', 'orders for magnolia', 'magnolia orders', 'orders from magnolia', 'magnolia home orders'],
    fixture: orderHistoryFixture as unknown as SpecialFixtureRaw,
  },
  {
    keywords: ['prep me', 'prep for meeting', 'meeting prep', 'next meeting', 'prep for my next meeting', 'meeting brief', 'pre-meeting brief', 'prepare for meeting', 'prepare me for'],
    fixture: meetingPrepFixture as unknown as SpecialFixtureRaw,
  },
];

/**
 * Matches "show recent orders" and "prep for meeting" style queries before
 * the general matcher (which would otherwise classify them as uc1 because
 * they mention 'acme'). Returns parsed widgets + closingText, or null.
 */
export function matchSpecialQuery(message: string): PageContextMatch | null {
  const m = message.toLowerCase();

  const route = SPECIAL_ROUTES.find((r) => r.keywords.some((kw) => m.includes(kw)));
  if (!route) return null;

  const { fixture } = route;
  const parsed = parseFrame(
    {
      frameId: fixture.frameId ?? 'f-special',
      frameType: 'result',
      widgets: fixture.widgets,
    } as Parameters<typeof parseFrame>[0],
    0,
  );

  return { widgets: parsed, closingText: fixture.closingText };
}

// ── Capability-chip groups (sr-2, sr-11, sr-14, sr-20, ad-1, ad-3, ad-17, ad-29) ──
// Each group has a trigger keyword set + useCase identifier. Routed before
// matchQuery / email pre-router so its keywords don't fall through.

export type CapabilityUseCase =
  | 'sr2-reorder'
  | 'sr11-invoice'
  | 'sr14-brief'
  | 'sr20-outreach'
  | 'ad1-approval'
  | 'ad3-handoff'
  | 'ad17-report'
  | 'ad29-workflow'
  // Audrey vDemo capabilities (Caps 1–6)
  | 'cap1-task-email'
  | 'cap1-email-draft'
  | 'cap2-lead-creation'
  | 'cap3-lead-won'
  | 'cap4-merge-customer'
  | 'cap5-user-creation'
  | 'cap6-catalog-builder'
  // Audrey vDemo reports (Cap 7)
  | 'report-collection-performance'
  | 'report-prebook-pacing'
  | 'report-customer-health'
  | 'report-pipeline'
  | 'report-team-performance'
  | 'report-catalog-health';

const CAPABILITY_ROUTES: { keywords: string[]; useCase: CapabilityUseCase }[] = [
  { keywords: ['reorder', 'restock magnolia', 'amend this order'], useCase: 'sr2-reorder' },
  { keywords: ['overdue invoice', 'payment due', 'show me overdue', "show me invoice", 'pull up invoice', 'invoice for magnolia'], useCase: 'sr11-invoice' },
  { keywords: ['meeting brief', 'action items from meeting', 'meeting summary', 'post-meeting'], useCase: 'sr14-brief' },
  { keywords: ['outreach', 'outreach email', 'campaign message', 'campaign email', 're-engagement email'], useCase: 'sr20-outreach' },
  { keywords: ['approval queue', 'pending approval', 'pending approvals', 'waiting for approval', 'waiting for my approval', 'waiting on my approval', 'awaiting approval', 'awaiting my approval', 'needs my approval', 'need my approval'], useCase: 'ad1-approval' },
  { keywords: ['rep handoff', 'reassign rep', 'account transition', 'territory rebalance'], useCase: 'ad3-handoff' },
  { keywords: ['q1 sales report', 'quarterly report', 'build me a report', 'monthly report', 'sales report'], useCase: 'ad17-report' },
  // ad29-workflow routing intentionally lives in ChatShell (handleSend's
  // ad-29 intercept) so it can branch between direct-apply and clarify based
  // on whether the user named a specific workflow.

  // ── Audrey vDemo capabilities (Caps 1–6) ─────────────────────────────────────
  // Cap 1 email-draft chain — MUST come before the cap1-task-email route so the
  // "Draft the email for Wildflower Market now" chip query matches here first
  // (otherwise the looser 'wildflower' keyword on cap1-task-email re-fires the
  // task form).
  { keywords: ['draft the email for wildflower', 'draft email for wildflower', 'draft the email now', 'send the email', 'rewrite the email', 'add the july 2026 release preview to the email'], useCase: 'cap1-email-draft' },
  { keywords: ['wildflower', 'birdhouse', 'samples', 'send email to wildflower', 'create a task', 'create task'], useCase: 'cap1-task-email' },
  { keywords: ['add lead', 'new lead', 'create lead', 'pine and thistle', 'pine & thistle'], useCase: 'cap2-lead-creation' },
  { keywords: ['move to won', 'convert lead', 'stage to won', 'verdant home', 'verdant'], useCase: 'cap3-lead-won' },
  { keywords: ['merge', 'combine records', 'duplicate', 'garden gate'], useCase: 'cap4-merge-customer' },
  { keywords: ['create user', 'website access', 'wizshop user', 'lakeside living', 'lakeside'], useCase: 'cap5-user-creation' },
  { keywords: ['build catalog', 'create wishlist', 'curated catalog', 'mountain bloom'], useCase: 'cap6-catalog-builder' },

  // ── Audrey vDemo reports (Cap 7) ──────────────────────────────────────────────
  { keywords: ['collection performance', 'how are collections', 'collection report'], useCase: 'report-collection-performance' },
  { keywords: ['pre-book pacing', 'july release', 'july 2026', 'release pacing'], useCase: 'report-prebook-pacing' },
  { keywords: ['customer health', 'account health', 'customer dashboard', 'customer retention', 'dormant customer', 'churn dashboard', 'retention dashboard'], useCase: 'report-customer-health' },
  { keywords: ['pipeline', 'lead conversion', 'my pipeline', 'pipeline report', 'pipeline dashboard', 'pipeline health', 'open quotes', 'quote pipeline', 'deal pipeline', 'show pipeline'], useCase: 'report-pipeline' },
  { keywords: ['team performance', 'rep performance', 'team report'], useCase: 'report-team-performance' },
  { keywords: ['catalog health', 'inventory status', 'stock levels', 'catalog report'], useCase: 'report-catalog-health' },
];

export function matchSpecialCapabilityQuery(message: string): { useCase: CapabilityUseCase } | null {
  const m = message.toLowerCase();
  // If the query is clearly an email/task/dashboard intent (typically a chip
  // click on a capability turn), let the dedicated pre-routers handle it
  // instead of re-triggering the capability fixture.
  // Find a capability route match first — if a strong Audrey-domain keyword
  // matches (wildflower, pine & thistle, verdant, garden gate, lakeside,
  // mountain bloom, any report-* keyword), we route to that capability even
  // if the query also looks like a generic email/task/dashboard intent.
  const route = CAPABILITY_ROUTES.find((r) => r.keywords.some((kw) => m.includes(kw)));
  const isDelegated =
    m.includes('email') ||
    m.includes('draft') ||
    (m.includes('create') && m.includes('task')) ||
    m.includes('save this as a dashboard') ||
    m.includes('save as dashboard');
  if (isDelegated && !route) return null;
  return route ? { useCase: route.useCase } : null;
}

export function matchQuery(message: string): UseCase {
  const m = message.toLowerCase();

  // uc3 first — superset of uc1 + uc2
  // Exclude email/draft queries so "follow-up email" doesn't trigger uc3 task flow
  const isEmailQuery = m.includes('email') || m.includes('draft');
  if (!isEmailQuery && m.includes('magnolia') && (m.includes('revenue') || m.includes('follow') || m.includes('task'))) {
    return 'uc3';
  }

  // uc2 (create + task) checked BEFORE uc1's loose 'acme' match so that
  // "Create a follow-up task for Acme Corp" routes to uc2, not uc1.
  if (m.includes('create') && m.includes('task')) {
    return 'uc2';
  }

  if (m.includes('magnolia') || m.includes("how's") || m.includes('hows') || m.includes('doing') || m.includes('tell me about')) {
    return 'uc1';
  }

  return 'unknown';
}

// Returns a tailored reply for unrecognised queries. Shown in place of widgets.
export function getUnknownReply(message: string): string {
  const m = message.toLowerCase();

  if (m.includes('netsuite') || m.includes('erp')) {
    return "NetSuite integration is on our roadmap for a future phase. Right now, I can help with WizOrder data — want me to pull up customer info, create tasks, or run revenue lookups?";
  }

  return "I don't have that capability yet — but here's what I can help with:";
}
