import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

function buildSystemPrompt(): string {
  const today = new Date().toISOString().split('T')[0];
  // Compute next weekday dates for relative-date resolution
  const todayDate = new Date();
  const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const nextDays: Record<string, string> = {};
  for (let i = 1; i <= 7; i++) {
    const d = new Date(todayDate);
    d.setDate(todayDate.getDate() + i);
    nextDays[DAYS[d.getDay()]] = d.toISOString().split('T')[0];
  }
  const dayTable = Object.entries(nextDays).map(([n, v]) => `${n}: ${v}`).join(', ');
  return `You are a form field change extractor. Today's date is ${today}.
Given a user message and the current form field values, extract every change the user is requesting.

CRITICAL OUTPUT FORMAT:
- Output ONLY a JSON object. NO prose, NO preamble, NO markdown fences, NO explanation.
- Your entire response must start with { and end with }.
- If the message asks for something you cannot map to a field change, return { "changes": [] }. Never apologise, never explain.

Schema:
{ "changes": [ { "fieldId": "string", "newValue": "string" } ] }

Rules:
- fieldId must exactly match one of the IDs provided in Current Fields.
- For date fields: convert relative expressions to YYYY-MM-DD using today as the reference. Next weekday dates: ${dayTable}.
- For priority: allowed values are High, Medium, Low.
- If a request is vague (e.g. "change the quantities" with no specific numbers) but mentions an item, leave the field as-is and return { "changes": [] }.
- If no change is requested for a field, omit it.
- Return { "changes": [] } if nothing changed.`;
}

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Demo-mode hardcoded responses for canonical test phrases
const DEMO_TRIGGERS: { match: string; changes: { fieldId: string; newValue: string }[] }[] = [
  {
    match: 'change the title to catalogue for canton fair',
    changes: [
      { fieldId: 'title', newValue: 'Catalogue for Canton Fair' },
      { fieldId: 'priority', newValue: 'Medium' },
    ],
  },
  {
    match: 'update priority to high',
    changes: [{ fieldId: 'priority', newValue: 'High' }],
  },
  {
    match: 'set assignee to avi',
    changes: [{ fieldId: 'assignee', newValue: 'Avi' }],
  },
  {
    match: 'modify due date to friday',
    changes: [{ fieldId: 'dueDate', newValue: nextFriday() }],
  },
  // uc2-order sr-1 chip queries
  {
    match: 'add more items to this order',
    changes: [
      { fieldId: 'items', newValue: 'Artisan Table Lamp - Brass × 12, Linen Throw - Sand × 8, Wall Sconce - Matte Black × 4, Ceramic Vase - Sage × 6' },
      { fieldId: 'subtotal', newValue: '$6,498.19' },
    ],
  },
  {
    match: 'apply a 10% discount to this order',
    changes: [
      { fieldId: 'discount', newValue: '10%' },
      { fieldId: 'subtotal', newValue: '$5,076.17' },
    ],
  },
];

function nextFriday(): string {
  const d = new Date();
  const day = d.getDay();
  const diff = (5 - day + 7) % 7 || 7; // days until next Friday (never 0)
  d.setDate(d.getDate() + diff);
  return d.toISOString().split('T')[0];
}

export async function POST(request: Request) {
  let message: string;
  let currentFields: Record<string, unknown>;

  try {
    const body = await request.json();
    message = body.message;
    currentFields = body.currentFields ?? {};
    if (!message || typeof message !== 'string') {
      return NextResponse.json({ changes: [], error: 'Missing message' }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ changes: [], error: 'Invalid request body' }, { status: 400 });
  }

  // Demo-mode hardcoded path — check all canonical demo triggers first
  const lowerMsg = message.toLowerCase();
  const demoHit = DEMO_TRIGGERS.find((t) => lowerMsg.includes(t.match));
  if (demoHit) {
    console.log('[Kai restage] Demo trigger matched:', demoHit.match);
    return NextResponse.json({ changes: demoHit.changes });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ changes: [], error: 'API key not configured' });
  }

  try {
    const userContent = `Current fields:\n${JSON.stringify(currentFields, null, 2)}\n\nUser request: ${message}`;
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 256,
      temperature: 0,
      system: buildSystemPrompt(),
      messages: [{ role: 'user', content: userContent }],
    });

    const rawText = (response.content[0] as { type: string; text: string }).text
      .replace(/^```(?:json)?\n?/, '')
      .replace(/\n?```$/, '')
      .trim();

    // Defensive: model sometimes prefaces with prose ("It looks like…").
    // Extract the first balanced {…} block before parsing.
    const jsonStart = rawText.indexOf('{');
    const jsonEnd = rawText.lastIndexOf('}');
    let changes: { fieldId: string; newValue: string }[] = [];
    if (jsonStart !== -1 && jsonEnd > jsonStart) {
      const jsonSlice = rawText.slice(jsonStart, jsonEnd + 1);
      try {
        const parsed = JSON.parse(jsonSlice);
        if (Array.isArray(parsed.changes)) changes = parsed.changes;
      } catch {
        console.warn('[Kai restage] JSON parse failed on slice; treating as no-op:', jsonSlice.slice(0, 200));
      }
    } else {
      console.warn('[Kai restage] Model returned non-JSON; treating as no-op:', rawText.slice(0, 200));
    }

    console.log('[Kai restage ←]', JSON.stringify(changes));
    return NextResponse.json({ changes });
  } catch (err) {
    const isParseError = err instanceof SyntaxError;
    console.error('[Kai restage error]', err);
    return NextResponse.json({
      changes: [],
      error: isParseError ? 'Parse error' : 'API error',
    });
  }
}
