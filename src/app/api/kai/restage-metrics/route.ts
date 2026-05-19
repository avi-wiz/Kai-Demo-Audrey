import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { METRIC_CATALOG, availableMetrics, type MetricScope } from '@/lib/metricCatalog';

/**
 * POST /api/kai/restage-metrics
 *
 * Request:
 *   { message: string, scope: MetricScope, currentLabels: string[] }
 *
 * Response (two shapes):
 *   { intent: "apply",   add: string[], remove: string[] }
 *   { intent: "clarify", candidates: string[], prompt: string }
 *
 * Labels in `add`/`candidates` are catalog labels for the given scope.
 * Caller resolves them to full card payloads via `resolveMetrics(scope, labels)`.
 */

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const VALID_SCOPES: MetricScope[] = [
  'ad17-report',
  'sales-performance',
  'customer-health',
  'order-analytics',
  'pipeline',
];

// Phrases that ALWAYS mean "user is being vague — clarify." Checked before
// the LLM call so demo mode (no API key) still triggers clarification.
const VAGUE_PATTERNS: RegExp[] = [
  /^add (a |another |one more |some )?(metric|kpi|card)s?\.?$/i,
  /add (more|extra) (metric|kpi|card)s?/i,
  /add (a |an )?(metric|kpi|card)s?( to (this|the).*)?\.?$/i,
  /more (metric|kpi|card)s/i,
  /(another|some) (metric|kpi|card)s?/i,
];

// Canonical chip phrasings → deterministic apply (no LLM, no clarify).
// Keep in sync with the action-chips-map.json queries that route here.
interface DemoApplyTrigger {
  match: RegExp;
  scope: MetricScope;
  add: string[];
}

const DEMO_APPLY_TRIGGERS: DemoApplyTrigger[] = [
  {
    match: /add average order value and quote conversion rate/i,
    scope: 'ad17-report',
    add: ['Avg Order Value', 'Quote Conversion Rate'],
  },
];

interface ApplyResponse {
  intent: 'apply';
  add: string[];
  remove: string[];
}

interface ClarifyResponse {
  intent: 'clarify';
  candidates: string[];
  prompt: string;
}

type EndpointResponse = ApplyResponse | ClarifyResponse;

function buildClarifyResponse(scope: MetricScope, currentLabels: string[]): ClarifyResponse {
  const available = availableMetrics(scope, currentLabels).map((m) => m.label);
  return {
    intent: 'clarify',
    candidates: available,
    prompt: 'Which metrics would you like to add?',
  };
}

function buildSystemPrompt(scope: MetricScope, currentLabels: string[]): string {
  const available = availableMetrics(scope, currentLabels);
  const catalog = available
    .map((m) => `- "${m.label}" — ${m.description}`)
    .join('\n');

  return `You are a metric-row editor for a sales analytics report.
Given a user message and the current set of metric labels, decide whether to APPLY a specific change or CLARIFY because the request is ambiguous.

You may only choose metric labels from this allowlist (exact label match required, copy verbatim):
${catalog}

Current metrics already on the report: ${currentLabels.join(', ') || '(none)'}

CRITICAL OUTPUT FORMAT:
- Output ONLY a JSON object. NO prose, NO preamble, NO markdown fences.
- Your entire response must start with { and end with }.

Two valid shapes:
  { "intent": "apply",   "add": ["Label A", "Label B"], "remove": ["Label C"] }
  { "intent": "clarify", "candidates": ["Label A", "Label B", "Label C"], "prompt": "<one short question>" }

Decision rules:
1. If the user names a specific metric that matches the allowlist (exact or near-synonym like "AOV" → "Avg Order Value", "conversion rate" → "Quote Conversion Rate"), return { "intent": "apply", ... } with those labels.
2. If the user says vague things like "add a metric", "another KPI", "more metrics", "add a card" — return { "intent": "clarify", ... } listing 3–5 of the most relevant allowlist labels.
3. If the user asks for something not in the allowlist (e.g. "add sentiment score"), return { "intent": "clarify", ... } so the user can pick from what's available. Do NOT invent metrics.
4. Never include a label that is already in the "current metrics" list above.
5. "remove" is optional — only set it if the user explicitly says to drop a metric.
6. Empty "add" and empty "remove" with intent=apply is invalid; in that case return clarify instead.`;
}

export async function POST(request: Request) {
  let message: string;
  let scope: MetricScope;
  let currentLabels: string[];

  try {
    const body = await request.json();
    message = body.message;
    scope = body.scope;
    currentLabels = Array.isArray(body.currentLabels) ? body.currentLabels : [];
    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Missing message' }, { status: 400 });
    }
    if (!VALID_SCOPES.includes(scope)) {
      return NextResponse.json({ error: 'Invalid scope' }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  // 1. Deterministic demo triggers — canonical chip phrasings.
  const demoApply = DEMO_APPLY_TRIGGERS.find((t) => t.scope === scope && t.match.test(message));
  if (demoApply) {
    const haveLower = new Set(currentLabels.map((l) => l.toLowerCase()));
    const filtered = demoApply.add.filter((l) => !haveLower.has(l.toLowerCase()));
    const resp: ApplyResponse = { intent: 'apply', add: filtered, remove: [] };
    return NextResponse.json(resp);
  }

  // 2. Vague-phrase shortcut — clarify without burning an LLM call.
  if (VAGUE_PATTERNS.some((p) => p.test(message))) {
    return NextResponse.json(buildClarifyResponse(scope, currentLabels));
  }

  // 3. No API key → fall back to clarify (the caller can still let the
  //    in-place demo patch run if it prefers; this endpoint never invents).
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(buildClarifyResponse(scope, currentLabels));
  }

  // 4. LLM path.
  try {
    const userContent = `User request: ${message}`;
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 256,
      temperature: 0,
      system: buildSystemPrompt(scope, currentLabels),
      messages: [{ role: 'user', content: userContent }],
    });

    const rawText = (response.content[0] as { type: string; text: string }).text
      .replace(/^```(?:json)?\n?/, '')
      .replace(/\n?```$/, '')
      .trim();

    const jsonStart = rawText.indexOf('{');
    const jsonEnd = rawText.lastIndexOf('}');
    if (jsonStart === -1 || jsonEnd <= jsonStart) {
      console.warn('[restage-metrics] non-JSON response, falling back to clarify');
      return NextResponse.json(buildClarifyResponse(scope, currentLabels));
    }

    const jsonSlice = rawText.slice(jsonStart, jsonEnd + 1);
    let parsed: Partial<EndpointResponse> & { intent?: string };
    try {
      parsed = JSON.parse(jsonSlice);
    } catch {
      console.warn('[restage-metrics] JSON parse failed, falling back to clarify');
      return NextResponse.json(buildClarifyResponse(scope, currentLabels));
    }

    // Validate against the allowlist. Anything the model invented gets dropped.
    const allow = new Set(METRIC_CATALOG[scope].map((m) => m.label.toLowerCase()));
    const haveLower = new Set(currentLabels.map((l) => l.toLowerCase()));
    const sanitizeLabels = (arr: unknown): string[] => {
      if (!Array.isArray(arr)) return [];
      const seen = new Set<string>();
      const out: string[] = [];
      for (const raw of arr) {
        if (typeof raw !== 'string') continue;
        const lower = raw.toLowerCase();
        if (!allow.has(lower) || seen.has(lower)) continue;
        seen.add(lower);
        // Use the catalog's canonical casing
        const canonical = METRIC_CATALOG[scope].find((m) => m.label.toLowerCase() === lower)!.label;
        out.push(canonical);
      }
      return out;
    };

    if (parsed.intent === 'apply') {
      const add = sanitizeLabels((parsed as ApplyResponse).add).filter((l) => !haveLower.has(l.toLowerCase()));
      const remove = sanitizeLabels((parsed as ApplyResponse).remove).filter((l) => haveLower.has(l.toLowerCase()));
      if (add.length === 0 && remove.length === 0) {
        return NextResponse.json(buildClarifyResponse(scope, currentLabels));
      }
      const resp: ApplyResponse = { intent: 'apply', add, remove };
      return NextResponse.json(resp);
    }

    if (parsed.intent === 'clarify') {
      const candidates = sanitizeLabels((parsed as ClarifyResponse).candidates).filter(
        (l) => !haveLower.has(l.toLowerCase()),
      );
      const prompt = typeof (parsed as ClarifyResponse).prompt === 'string'
        ? (parsed as ClarifyResponse).prompt
        : 'Which metrics would you like to add?';
      const resp: ClarifyResponse = {
        intent: 'clarify',
        candidates: candidates.length > 0 ? candidates : availableMetrics(scope, currentLabels).map((m) => m.label),
        prompt,
      };
      return NextResponse.json(resp);
    }

    // Unknown intent → fall back to clarify
    return NextResponse.json(buildClarifyResponse(scope, currentLabels));
  } catch (err) {
    console.error('[restage-metrics error]', err);
    return NextResponse.json(buildClarifyResponse(scope, currentLabels));
  }
}
