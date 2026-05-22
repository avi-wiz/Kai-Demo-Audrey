import Anthropic from '@anthropic-ai/sdk';
import { planSchema } from '@/lib/planner/schema';
import { compile } from '@/lib/planner/compile';
import { TOOL_REGISTRY } from '@/lib/planner/tools/index';
import { WIDGET_CATALOG } from '@/lib/planner/widget_catalog';
import { t11PlannerPrompt, t11PlannerClosingPrompt } from '@/lib/systemPrompts';
import type { SystemPromptArgs } from '@/lib/systemPrompts';
import type { PageContextBody } from '@/lib/systemPrompts';
import type { Frame } from '@/lib/types';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

interface PlanRequestBody {
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  query: string;
  persona?: string;
  customInstructions?: string;
  pageContext?: PageContextBody;
}

// ── Catalog summaries for the system prompt ───────────────────────────────────

function buildToolCatalog(): string {
  return Object.entries(TOOL_REGISTRY)
    .map(([name, def]) => `${name}: ${def.definitionForPrompt}`)
    .join('\n\n');
}

function buildWidgetCatalogSummary(): string {
  return Object.entries(WIDGET_CATALOG)
    .map(([id, entry]) => `${id}: ${entry.goodFor}`)
    .join('\n');
}

const IR_SCHEMA_SUMMARY = `{
  "reasoning": "string — your reasoning, shown live to user",
  "steps": [{ "tool": "toolName", "args": {}, "bindTo": "camelCaseId" }],
  "widgets": [{ "widgetType": "UW-004", "dataFrom": "camelCaseId", "transform": { "pick": [], "rename": {} }, "config": {}, "highlights": [] }],
  "closingTextHint": "string or null",
  "emptyResultInsight": false
}`;

const FEW_SHOTS = `EXAMPLES:

Query: "Show overdue tasks for Marcus"
{
  "reasoning": "Querying tasks filtered to Marcus Rivera (R-002) and status Overdue",
  "steps": [{ "tool": "queryTasks", "args": { "repId": "R-002", "status": "Overdue" }, "bindTo": "overdueTasksResult" }],
  "widgets": [{ "widgetType": "UW-011", "dataFrom": "overdueTasksResult", "transform": { "pick": ["id", "title", "dueDate", "priority", "assignedTo", "status"] } }],
  "closingTextHint": "Highlight the most urgent task and suggest a next action for Marcus",
  "emptyResultInsight": false
}

Query: "Leads in Discovery / Qualified stage"
{
  "reasoning": "Querying leads with status Qualified to surface active pipeline",
  "steps": [{ "tool": "queryLeads", "args": { "status": "Qualified" }, "bindTo": "qualifiedLeads" }],
  "widgets": [{ "widgetType": "UW-004", "dataFrom": "qualifiedLeads", "transform": { "pick": ["name", "contact", "region", "assignedTo", "lastContact"] } }],
  "closingTextHint": "Summarize which leads are closest to conversion",
  "emptyResultInsight": true
}`;

// ── SSE helpers ───────────────────────────────────────────────────────────────

function sseEvent(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

// ── Route handler (SSE stream) ────────────────────────────────────────────────

export async function POST(request: Request) {
  if (process.env.KAI_PLANNER_DISABLED === '1') {
    console.log('[api/kai/plan] disabled', JSON.stringify({ reason: 'planner_disabled' }));
    return new Response(JSON.stringify({ ok: false, reason: 'planner_disabled' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let body: PlanRequestBody;
  try {
    body = await request.json();
  } catch {
    return new Response('Invalid request body', { status: 400 });
  }

  const { messages, query, persona, customInstructions, pageContext } = body;

  if (!query || !Array.isArray(messages)) {
    return new Response('query and messages required', { status: 400 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const startMs = Date.now();
      const emit = (event: string, data: unknown) => {
        controller.enqueue(encoder.encode(sseEvent(event, data)));
      };
      const fail = (reason: string) => {
        const latencyMs = Date.now() - startMs;
        console.warn('[api/kai/plan] fail', JSON.stringify({ query, reason, latencyMs }));
        emit('error', { ok: false, reason });
        controller.close();
      };

      emit('planning_started', { at: startMs });

      const plannerSystemPrompt = t11PlannerPrompt({
        persona,
        customInstructions,
        pageContext,
        toolCatalog: buildToolCatalog(),
        widgetCatalogSummary: buildWidgetCatalogSummary(),
        irSchema: IR_SCHEMA_SUMMARY,
        fewShots: FEW_SHOTS,
      } as SystemPromptArgs & { toolCatalog: string; widgetCatalogSummary: string; irSchema: string; fewShots: string });

      // ── Step 1: Run Opus planner ──────────────────────────────────────────
      async function runPlanner(extraMessages: Anthropic.Messages.MessageParam[] = []): Promise<string> {
        let raw = '';
        const s = await client.messages.create({
          model: 'claude-opus-4-7',
          max_tokens: 1200,
          system: plannerSystemPrompt,
          messages: [
            ...messages.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
            ...extraMessages,
          ],
          stream: true,
        });
        for await (const event of s) {
          if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
            raw += event.delta.text;
          }
        }
        return raw.trim();
      }

      const plannerStartMs = Date.now();
      emit('node', { nodeId: 'plan', action: 'planning', status: 'running' });

      let irRaw: string;
      try {
        irRaw = await runPlanner();
      } catch (err) {
        console.warn('[api/kai/plan] planner stream error', err);
        return fail('planner_upstream_error');
      }

      const cleaned = irRaw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();

      let parsed: unknown;
      try {
        parsed = JSON.parse(cleaned);
      } catch {
        try {
          irRaw = await runPlanner([
            { role: 'assistant', content: cleaned },
            { role: 'user', content: `Your previous response was not valid JSON. Please output only a valid JSON Plan IR object with no prose or markdown.` },
          ]);
          const cleaned2 = irRaw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
          parsed = JSON.parse(cleaned2);
        } catch {
          console.warn('[api/kai/plan] IR parse failed after retry');
          return fail('ir_parse_failed');
        }
      }

      let validationResult = planSchema.safeParse(parsed);
      if (!validationResult.success) {
        console.warn('[api/kai/plan] IR schema failed (first try):', validationResult.error.message);
        console.warn('[api/kai/plan] raw IR:', JSON.stringify(parsed));
        try {
          irRaw = await runPlanner([
            { role: 'assistant', content: cleaned },
            { role: 'user', content: `Your plan failed schema validation: ${validationResult.error.message}. Fix it and output only valid JSON.` },
          ]);
          const cleaned3 = irRaw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
          const parsed3 = JSON.parse(cleaned3);
          validationResult = planSchema.safeParse(parsed3);
          if (!validationResult.success) {
            console.warn('[api/kai/plan] IR schema failed (retry):', validationResult.error.message);
            console.warn('[api/kai/plan] raw IR (retry):', JSON.stringify(parsed3));
            return fail('ir_schema_invalid');
          }
        } catch (err) {
          console.warn('[api/kai/plan] IR retry threw:', err);
          return fail('ir_schema_invalid');
        }
      }

      const plan = validationResult.data!;
      const planMs = Date.now() - plannerStartMs;

      emit('node', {
        nodeId: 'plan',
        action: 'planning',
        status: 'completed',
        ms: planMs,
        result: `${plan.steps.length} step${plan.steps.length === 1 ? '' : 's'}`,
      });
      emit('reasoning', { reasoning: plan.reasoning });

      // ── Step 2: Compile (emit a node per tool step) ──────────────────────
      for (const step of plan.steps) {
        emit('node', { nodeId: step.bindTo, action: step.tool, status: 'running', input: step.bindTo });
      }

      const compileStartMs = Date.now();
      const compileResult = await compile(plan, query);
      if (!compileResult.ok) {
        console.warn('[api/kai/plan] compile failed', compileResult.reason);
        return fail(compileResult.reason);
      }

      const compileMs = Date.now() - compileStartMs;
      const { frame, toolResults } = compileResult;

      for (const step of plan.steps) {
        const result = toolResults[step.bindTo] as { rows?: unknown[]; groups?: unknown[]; total?: number } | undefined;
        const count = result?.rows?.length ?? result?.groups?.length ?? 0;
        emit('node', {
          nodeId: step.bindTo,
          action: step.tool,
          status: 'completed',
          ms: Math.max(1, Math.round(compileMs / plan.steps.length)),
          result: `${count} row${count === 1 ? '' : 's'}`,
        });
      }

      emit('frame_ready', { frame });

      // ── Step 3: Sonnet closing text (token-streamed) ─────────────────────
      let closingText: { type: 'insight'; text: string } | undefined;

      if (plan.closingTextHint !== null) {
        // Build a compact JSON summary of the actual rendered widgets so the
        // closing-text pass can reference real values instead of widget IDs.
        // Arrays trimmed to TRIM_ARR; nested arrays/objects flattened to a
        // brief marker so token count stays bounded. Scalars always pass
        // through verbatim — Sonnet must see real names + numbers.
        const TRIM_ARR = 8;
        const MAX_DEPTH = 4;
        const compactValue = (v: unknown, depth = 0): unknown => {
          if (v === null || v === undefined) return v;
          // Scalars: always pass through.
          if (typeof v !== 'object') return v;
          if (depth >= MAX_DEPTH) {
            if (Array.isArray(v)) return `[${v.length} items]`;
            return '{…}';
          }
          if (Array.isArray(v)) {
            const trimmed = v.slice(0, TRIM_ARR).map(item => compactValue(item, depth + 1));
            return v.length > TRIM_ARR ? [...trimmed, `…+${v.length - TRIM_ARR} more`] : trimmed;
          }
          const out: Record<string, unknown> = {};
          for (const [k, val] of Object.entries(v as Record<string, unknown>)) {
            out[k] = compactValue(val, depth + 1);
          }
          return out;
        };

        const widgetDataSummary = frame.widgets
          .map(w => `${w.widgetType}: ${JSON.stringify(compactValue(w.data))}`)
          .join('\n\n');

        // Recompute emptyResultInsight from actual frame data — the planner's
        // pre-execution guess is unreliable.
        const hasAnyRows = frame.widgets.some(w => {
          const d = w.data as { rows?: unknown[]; groups?: unknown[]; items?: unknown[]; series?: unknown[]; fields?: unknown[]; cards?: unknown[] };
          return (d.rows && d.rows.length > 0)
            || (d.groups && d.groups.length > 0)
            || (d.items && d.items.length > 0)
            || (d.series && d.series.length > 0)
            || (d.fields && d.fields.length > 0)
            || (d.cards && d.cards.length > 0);
        });
        const actualEmpty = !hasAnyRows;

        const closingSystemPrompt = t11PlannerClosingPrompt({
          persona,
          customInstructions,
          closingTextHint: plan.closingTextHint,
          emptyResultInsight: actualEmpty,
          widgetSummary: widgetDataSummary,
        } as SystemPromptArgs & { closingTextHint: string; emptyResultInsight?: boolean; widgetSummary: string });

        emit('node', { nodeId: 'closing', action: 'closing_text', status: 'running' });
        const closingStartMs = Date.now();

        // Run the closing-text stream once with a chosen model. Returns the
        // accumulated text and the final stop reason. Throws if Anthropic
        // returns an error.
        const runClosingStream = async (model: string): Promise<{ text: string; stopReason: string | null | undefined }> => {
          let raw = '';
          let stop: string | null | undefined;
          const s = await client.messages.create({
            model,
            max_tokens: 600,
            system: closingSystemPrompt,
            messages: [{ role: 'user', content: query }],
            stream: true,
          });
          for await (const event of s) {
            if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
              raw += event.delta.text;
              emit('closing_delta', { delta: event.delta.text });
            }
            if (event.type === 'message_delta' && event.delta.stop_reason) {
              stop = event.delta.stop_reason;
            }
          }
          return { text: raw, stopReason: stop };
        };

        // Anthropic occasionally returns transient overloaded_error (529).
        // One retry after a short backoff almost always clears it.
        const isRetryableUpstream = (err: unknown): boolean => {
          const msg = err instanceof Error ? err.message : String(err);
          return msg.includes('overloaded_error') || msg.includes('"type":"overloaded"') || msg.includes('529');
        };

        try {
          let closingRaw = '';
          let stopReason: string | null | undefined = undefined;
          // Retry policy for transient overloads: try Sonnet twice with
          // backoff, then fail over to Opus (separate capacity pool — usually
          // available even when Sonnet is overloaded).
          const attempts: Array<{ model: string; backoffMs: number }> = [
            { model: 'claude-sonnet-4-6', backoffMs: 0 },
            { model: 'claude-sonnet-4-6', backoffMs: 1200 },
            { model: 'claude-opus-4-7', backoffMs: 2000 },
          ];
          let lastErr: unknown;
          let success = false;
          for (let i = 0; i < attempts.length; i += 1) {
            const { model, backoffMs } = attempts[i];
            if (backoffMs > 0) {
              console.warn(`[api/kai/plan] closing text retry ${i} (${model}) after ${backoffMs}ms`);
              await new Promise(r => setTimeout(r, backoffMs));
            }
            try {
              const r = await runClosingStream(model);
              closingRaw = r.text;
              stopReason = r.stopReason;
              success = true;
              break;
            } catch (err) {
              lastErr = err;
              if (!isRetryableUpstream(err)) throw err;
            }
          }
          if (!success) throw lastErr;
          const trimmed = closingRaw.trim();
          if (trimmed) {
            closingText = { type: 'insight', text: trimmed };
            console.log('[api/kai/plan] closing ok', JSON.stringify({ chars: trimmed.length, stopReason, ms: Date.now() - closingStartMs }));
          } else {
            // Sonnet returned nothing — log details and synthesize a minimal
            // fallback so the UI still shows insight context.
            console.warn('[api/kai/plan] closing text empty', JSON.stringify({
              stopReason,
              promptLen: closingSystemPrompt.length,
              widgetSummaryLen: widgetDataSummary.length,
            }));
            const fallback = plan.closingTextHint
              ? `Here's what I found. ${plan.closingTextHint}`
              : 'Here are the results — let me know if you want a deeper cut.';
            closingText = { type: 'insight', text: fallback };
            emit('closing_delta', { delta: fallback });
          }
          emit('node', {
            nodeId: 'closing',
            action: 'closing_text',
            status: 'completed',
            ms: Date.now() - closingStartMs,
          });
        } catch (err) {
          const message = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
          console.warn('[api/kai/plan] closing text error:', message);
          if (err instanceof Error && err.stack) console.warn(err.stack);
          // Fallback so the user still sees a narrative, even if Sonnet failed.
          const fallback = plan.closingTextHint
            ? `Here's what I found. ${plan.closingTextHint}`
            : 'Here are the results — let me know if you want a deeper cut.';
          closingText = { type: 'insight', text: fallback };
          emit('closing_delta', { delta: fallback });
          emit('node', {
            nodeId: 'closing',
            action: 'closing_text',
            status: 'failed',
            ms: Date.now() - closingStartMs,
          });
        }
      }

      const finalFrame: Frame = {
        ...frame,
        ...(closingText ? { closingText } : {}),
      };

      const latencyMs = Date.now() - startMs;
      const runLog = { query, ir: plan, toolResults, frame: finalFrame, latencyMs };
      // Structured success log per Decision §31 — query, step count, widget
      // count, latency, tool names. Full IR/toolResults are returned to the
      // client in the SSE `done` event for window.lastPlannerRun inspection.
      console.log('[api/kai/plan] ok', JSON.stringify({
        query,
        latencyMs,
        steps: plan.steps.length,
        widgets: plan.widgets.length,
        tools: plan.steps.map(s => s.tool),
        widgetTypes: plan.widgets.map(w => w.widgetType),
        hasClosingText: closingText !== undefined,
      }));

      emit('done', { ok: true, frame: finalFrame, plannerRunLog: runLog, latencyMs });
      controller.close();
    },
  });

  return new Response(stream, {
    status: 200,
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
    },
  });
}
