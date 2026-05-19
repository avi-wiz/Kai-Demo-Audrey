import Anthropic from '@anthropic-ai/sdk';
import { buildSystemPrompt, getMaxTokens } from '@/lib/systemPrompts';
import type { PageContextBody, SystemPromptArgs } from '@/lib/systemPrompts';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ── Request body ──────────────────────────────────────────────────────────────

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface GenerateRequestBody {
  messages: Message[];
  capability?: string;
  persona?: string;
  customInstructions?: string;
  pageContext?: PageContextBody;
  widgetData?: unknown;
  includeFinancial?: boolean;
  // Touchpoint-specific extras forwarded to system prompt builders
  userQuery?: string;
  originalText?: string;
  additionalContext?: string;
  changes?: unknown;
  originalTotal?: string;
  newTotal?: string;
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  let body: GenerateRequestBody;
  try {
    body = await request.json();
  } catch {
    return new Response('Invalid request body', { status: 400 });
  }

  const {
    messages,
    capability = 'general',
    persona,
    customInstructions,
    pageContext,
    widgetData,
    includeFinancial = true,
    userQuery,
    originalText,
    additionalContext,
    changes,
    originalTotal,
    newTotal,
  } = body;

  if (!Array.isArray(messages) || messages.length === 0) {
    return new Response('messages array is required', { status: 400 });
  }

  const args: SystemPromptArgs = {
    persona,
    customInstructions,
    pageContext,
    widgetData,
    includeFinancial,
    userQuery,
    originalText,
    additionalContext,
    changes,
    originalTotal,
    newTotal,
  };

  const systemPrompt = buildSystemPrompt(capability, args);
  const maxTokens = getMaxTokens(capability);

  const encoder = new TextEncoder();

  // Try to start the Anthropic stream BEFORE we open the HTTP response stream,
  // so transient errors (overload, rate limit, auth) become a real HTTP error
  // status the client can detect, instead of being inlined as `[Error: ...]`
  // text into the user-visible response.
  let anthropicStream: Awaited<ReturnType<typeof client.messages.create>>;
  try {
    anthropicStream = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
      stream: true,
    });
  } catch (err) {
    const e = err as { status?: number; message?: string; error?: { type?: string } };
    const isOverloaded = e?.error?.type === 'overloaded_error' || e?.status === 529;
    const status = isOverloaded ? 503 : (typeof e?.status === 'number' ? e.status : 500);
    console.warn('[api/kai/generate] upstream error', { status, message: e?.message, type: e?.error?.type });
    return new Response('upstream_error', { status });
  }

  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const event of anthropicStream) {
          if (
            event.type === 'content_block_delta' &&
            event.delta.type === 'text_delta'
          ) {
            controller.enqueue(encoder.encode(event.delta.text));
          }
        }
      } catch (err) {
        // Mid-stream error — close cleanly without injecting error text into
        // the response body. Client surfaces partial text or fixture fallback.
        console.warn('[api/kai/generate] mid-stream error', err);
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Transfer-Encoding': 'chunked',
      'Cache-Control': 'no-cache',
      'X-Accel-Buffering': 'no',
    },
  });
}
