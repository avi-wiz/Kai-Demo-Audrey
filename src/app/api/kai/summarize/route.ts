import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { HISTORY_TAGS } from '@/lib/historyTags';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

interface SummarizeBody {
  messages?: Array<{ role: 'user' | 'assistant'; content: string }>;
  turns?: Array<{ useCase: string; userQuery?: string; closingText?: string }>;
}

const SYSTEM_PROMPT = `You summarize a sales-assistant chat session for a "Chat History" sidebar.

Allowed tag values (pick EXACTLY one — copy verbatim):
${HISTORY_TAGS.map((t) => `- ${t}`).join('\n')}

CRITICAL OUTPUT FORMAT:
- Output ONLY a JSON object. NO prose, NO preamble, NO markdown fences.
- Your entire response must start with { and end with }.

Shape:
{ "title": "<= 60 chars, action-oriented (e.g. 'Restock order for Acme Corp')",
  "subtext": "<= 110 chars, one-line factual recap of what happened",
  "tag": "<one of the allowed tag values>" }

Rules:
1. Title should describe the user's intent and key entity, not be generic ("Conversation about sales").
2. Subtext should reflect concrete outcomes (drafted email, created task, viewed report) — not Kai's tone or prefatory text.
3. Tag must be EXACTLY one of the allowed values. If unsure, choose "Other".`;

export async function POST(request: Request) {
  let body: SummarizeBody;
  try {
    body = (await request.json()) as SummarizeBody;
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400 });
  }
  const messages = Array.isArray(body.messages) ? body.messages : [];
  const turns = Array.isArray(body.turns) ? body.turns : [];

  if (messages.length === 0 && turns.length === 0) {
    return NextResponse.json({ ok: false, error: 'Empty session' }, { status: 400 });
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ ok: false, error: 'No API key' }, { status: 503 });
  }

  // Compact, bounded transcript — protect against huge sessions.
  const transcriptLines: string[] = [];
  messages.slice(0, 40).forEach((m) => {
    const role = m.role === 'user' ? 'User' : 'Kai';
    const content = String(m.content ?? '').slice(0, 400);
    if (content.trim()) transcriptLines.push(`${role}: ${content}`);
  });
  const turnLines: string[] = [];
  turns.slice(0, 20).forEach((t, i) => {
    const ct = t.closingText ? ` — Kai replied: ${String(t.closingText).slice(0, 240)}` : '';
    turnLines.push(`Turn ${i + 1} (useCase=${t.useCase}): ${t.userQuery ?? ''}${ct}`);
  });

  const userContent = [
    'CONVERSATION:',
    transcriptLines.join('\n') || '(no user-visible bubbles)',
    '',
    'KAI TURN SUMMARY:',
    turnLines.join('\n') || '(no turns)',
  ].join('\n');

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 256,
      temperature: 0,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userContent }],
    });

    const rawText = (response.content[0] as { type: string; text: string }).text
      .replace(/^```(?:json)?\n?/, '')
      .replace(/\n?```$/, '')
      .trim();

    const jsonStart = rawText.indexOf('{');
    const jsonEnd = rawText.lastIndexOf('}');
    if (jsonStart === -1 || jsonEnd <= jsonStart) {
      return NextResponse.json({ ok: false, error: 'Non-JSON response' }, { status: 502 });
    }
    let parsed: { title?: unknown; subtext?: unknown; tag?: unknown };
    try {
      parsed = JSON.parse(rawText.slice(jsonStart, jsonEnd + 1));
    } catch {
      return NextResponse.json({ ok: false, error: 'JSON parse failed' }, { status: 502 });
    }

    const title = typeof parsed.title === 'string' ? parsed.title.slice(0, 80).trim() : '';
    const subtext = typeof parsed.subtext === 'string' ? parsed.subtext.slice(0, 140).trim() : '';
    const rawTag = typeof parsed.tag === 'string' ? parsed.tag.trim() : '';
    const tag = (HISTORY_TAGS as readonly string[]).includes(rawTag) ? rawTag : 'Other';

    if (!title || !subtext) {
      return NextResponse.json({ ok: false, error: 'Missing fields' }, { status: 502 });
    }
    return NextResponse.json({ title, subtext, tag });
  } catch (err) {
    console.error('[summarize error]', err);
    return NextResponse.json({ ok: false, error: 'Upstream error' }, { status: 502 });
  }
}
