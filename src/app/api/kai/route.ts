import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const SYSTEM_PROMPT = `You are Kai's intent classifier for WizCommerce's WizOrder platform.
Given a user query, classify it and respond with ONLY a JSON object
(no markdown, no explanation, no backticks):

{
  "useCase": "uc1" | "uc2" | "uc3" | "unknown",
  "classification": "surface" | "act" | "surface+act" | "unknown",
  "entities": [{"name": "string", "type": "customer" | "lead" | "user"}],
  "intents": ["customer_lookup" | "task_creation" | "revenue_query" | "multi_intent"],
  "confidence": 0.0 to 1.0
}

Classification rules:
- Questions about a customer/account/company (how is X doing, tell me about X, check on X) → uc1, classification: surface
- Requests to create, schedule, or stage something (create a task, schedule a call, stage a quote) → uc2, classification: act
- Queries that combine BOTH a data lookup AND an action request → uc3, classification: surface+act
- Anything outside WizOrder scope (weather, general knowledge, coding) → unknown

Entity extraction rules:
- Company names → type: customer (default) or lead if context suggests
- Person names in 'assigned to' context → type: user
- Return empty entities array if no entities found`;

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const VALID_USE_CASES = new Set(['uc1', 'uc2', 'uc3', 'unknown']);

interface PageContextBody {
  page: string;
  visibleData?: unknown[];
  activeFilters?: string[];
}

function buildPageContextSection(ctx: PageContextBody): string {
  const dataSummary = ctx.visibleData && ctx.visibleData.length > 0
    ? JSON.stringify(ctx.visibleData).slice(0, 2000)
    : 'No visible data provided.';
  const filters = ctx.activeFilters && ctx.activeFilters.length > 0
    ? `Active filters: ${ctx.activeFilters.join(', ')}`
    : 'No active filters.';
  return `CURRENT PAGE CONTEXT:
The user is viewing the ${ctx.page} page in WizOrder.
Visible data summary: ${dataSummary}
${filters}
When referencing this data, be specific about what you can see.`;
}

export async function POST(request: Request) {
  let message: string;
  let personalitySuffix: string | undefined;
  let customInstructions: string | undefined;
  let includeFinancial = true;
  let pageContext: PageContextBody | undefined;
  try {
    const body = await request.json();
    message = body.message;
    personalitySuffix = typeof body.personalitySuffix === 'string' ? body.personalitySuffix : undefined;
    customInstructions = typeof body.customInstructions === 'string' && body.customInstructions.trim()
      ? body.customInstructions.trim()
      : undefined;
    if (body.includeFinancial === false) includeFinancial = false;
    if (body.pageContext && typeof body.pageContext === 'object' && typeof body.pageContext.page === 'string') {
      pageContext = body.pageContext as PageContextBody;
    }
    if (!message || typeof message !== 'string') {
      return NextResponse.json({ useCase: 'unknown', error: 'Missing message' }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ useCase: 'unknown', error: 'Invalid request body' }, { status: 400 });
  }

  const parts: string[] = [];
  if (personalitySuffix) parts.push(personalitySuffix);
  if (customInstructions) parts.push(`USER CUSTOM INSTRUCTIONS (always follow these):\n${customInstructions}`);
  if (!includeFinancial) parts.push('DATA PRIVACY: Do not reference or disclose financial data such as credit limits, account balances, or revenue figures.');
  if (pageContext) parts.push(buildPageContextSection(pageContext));
  parts.push(SYSTEM_PROMPT);
  const systemPrompt = parts.join('\n\n');

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 256,
      temperature: 0,
      system: systemPrompt,
      messages: [{ role: 'user', content: message }],
    });

    const raw = (response.content[0] as { type: string; text: string }).text
      .replace(/^```(?:json)?\n?/, '')
      .replace(/\n?```$/, '')
      .trim();

    const parsed = JSON.parse(raw);

    if (!VALID_USE_CASES.has(parsed.useCase)) {
      parsed.useCase = 'unknown';
    }


    return NextResponse.json(parsed);
  } catch (err) {
    const isParseError = err instanceof SyntaxError;
    return NextResponse.json({
      useCase: 'unknown',
      error: isParseError ? 'Parse error' : 'API unavailable',
    });
  }
}
