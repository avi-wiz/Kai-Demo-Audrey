'use client';

import { useState, useEffect, useRef } from 'react';

export interface KaiGenerateArgs {
  enabled: boolean;          // false in demo mode — skips the fetch entirely
  capability: string;
  userQuery: string;
  widgetData?: unknown;
  persona?: string;
  customInstructions?: string;
  pageContext?: {
    page: string;
    visibleData?: unknown[];
    activeFilters?: string[];
    systemPromptInjection?: string;
  };
  includeFinancial?: boolean;
  // T6: rewrite with different tone
  originalText?: string;
  // T8: matched doc excerpt
  additionalContext?: string;
  // T7: order modification diff
  changes?: unknown;
  originalTotal?: string;
  newTotal?: string;
  // Only start fetching once widgets have finished rendering
  widgetsDone: boolean;
  // Timeout covers connection + first token only. Once streaming starts it is cancelled.
  timeoutMs?: number;
}

export interface KaiGenerateResult {
  streamingText: string;
  isStreaming: boolean;
  /** True if the fetch timed-out or errored — caller should render fixture fallback */
  failed: boolean;
}

/**
 * Calls POST /api/kai/generate once `args.widgetsDone` becomes true and
 * `args.enabled` is true. Accumulates streamed chunks into `streamingText`.
 *
 * Fallback rules (from V4 §9.8):
 * - Demo mode (enabled=false): no fetch, failed=false — caller uses fixture closingText.
 * - Timeout or network error: failed=true — caller uses fixture closingText.
 */
export function useKaiGenerate(args: KaiGenerateArgs): KaiGenerateResult {
  const {
    enabled,
    capability,
    userQuery,
    widgetData,
    persona,
    customInstructions,
    pageContext,
    includeFinancial = true,
    originalText,
    additionalContext,
    changes,
    originalTotal,
    newTotal,
    widgetsDone,
    timeoutMs = 8000,
  } = args;

  const [streamingText, setStreamingText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [failed, setFailed] = useState(false);
  const firedRef = useRef(false);

  useEffect(() => {
    if (!widgetsDone || !enabled || firedRef.current) return;
    firedRef.current = true;

    const controller = new AbortController();

    // timeoutMs only covers connection + first token. Once the first chunk
    // arrives the timer is cleared so slow completions don't get aborted.
    const timer = setTimeout(() => {
      controller.abort();
      setIsStreaming(false);
      setFailed(true);
    }, timeoutMs);

    (async () => {
      setIsStreaming(true);
      try {
        const requestBody = JSON.stringify({
          messages: [{ role: 'user', content: userQuery || 'Summarize this.' }],
          capability,
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
        });
        const doFetch = () => fetch('/api/kai/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: requestBody,
          signal: controller.signal,
        });
        let res = await doFetch();
        // Retry once on 503 (Anthropic overload) after a short backoff so a
        // transient blip doesn't drop the user straight into fixture fallback.
        if (res.status === 503) {
          await new Promise((resolve) => setTimeout(resolve, 600));
          if (controller.signal.aborted) return;
          res = await doFetch();
        }

        if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let accumulated = '';
        let firstChunk = true;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          // Cancel the connection timeout as soon as the first byte arrives
          if (firstChunk) {
            clearTimeout(timer);
            firstChunk = false;
          }
          accumulated += decoder.decode(value, { stream: true });
          setStreamingText(accumulated);
        }

        clearTimeout(timer);
        setIsStreaming(false);
      } catch (err) {
        clearTimeout(timer);
        if ((err as Error).name !== 'AbortError') {
          console.warn('[useKaiGenerate] stream error, falling back to fixture', err);
        }
        setIsStreaming(false);
        setFailed(true);
      }
    })();

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  // Run once when widgetsDone flips to true — all other args are stable at that point
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [widgetsDone, enabled]);

  return { streamingText, isStreaming, failed };
}
