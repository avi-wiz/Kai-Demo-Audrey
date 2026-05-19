import type { Message } from '@/lib/types';
import type { HistoryTag, SerializedTurn } from '@/lib/historyTypes';
import { HISTORY_TAGS } from '@/lib/historyTags';

export interface SummarizeRequest {
  messages: Message[];
  turns: Array<{ useCase: string; userQuery?: string; closingText?: string }>;
}

export interface SummarizeResult {
  title: string;
  subtext: string;
  tag: HistoryTag;
}

/**
 * Fire-and-forget client wrapper for /api/kai/summarize. Returns null on
 * timeout, error, or invalid response — caller keeps its heuristic fallback.
 */
export async function summarizeSession(
  payload: SummarizeRequest,
  timeoutMs = 6000,
): Promise<SummarizeResult | null> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);

  try {
    const res = await fetch('/api/kai/summarize', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
      signal: ctrl.signal,
    });
    if (!res.ok) return null;
    const data = (await res.json()) as Partial<SummarizeResult> & { ok?: boolean };
    if (data?.ok === false) return null;
    if (
      typeof data.title !== 'string' ||
      typeof data.subtext !== 'string' ||
      typeof data.tag !== 'string'
    ) {
      return null;
    }
    const tag = (HISTORY_TAGS as readonly string[]).includes(data.tag)
      ? (data.tag as HistoryTag)
      : null;
    if (!tag) return null;
    return {
      title: data.title.slice(0, 80),
      subtext: data.subtext.slice(0, 140),
      tag,
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/** Tiny helper to flatten a SerializedTurn[] into the shape expected by the endpoint. */
export function buildSummarizePayload(messages: Message[], turns: SerializedTurn[]): SummarizeRequest {
  return {
    messages,
    turns: turns
      .filter((t) => !t.isStale)
      .map((t) => ({
        useCase: t.useCase,
        userQuery: t.userQuery,
        closingText: t.llmText || t.closingText?.text,
      })),
  };
}
