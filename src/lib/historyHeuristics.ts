import type { Message } from './types';
import type { SerializedTurn, HistoryTag } from './historyTypes';
import { inferTagFromUseCases } from './historyTags';

function truncate(s: string, max: number): string {
  const trimmed = s.trim().replace(/\s+/g, ' ');
  if (trimmed.length <= max) return trimmed;
  return trimmed.slice(0, max - 1).trimEnd() + '…';
}

/**
 * Pure, no-LLM summary. Used as instant fallback (and the placeholder shown
 * while the LLM summarize call is in flight).
 */
export function heuristicSummary(
  messages: Message[],
  turns: SerializedTurn[],
): { title: string; subtext: string; tag: HistoryTag } {
  const firstUser = messages.find((m) => m.role === 'user');
  const title = firstUser ? truncate(firstUser.content, 50) : 'Untitled session';

  const liveTurns = turns.filter((t) => !t.isStale);
  let subtext = '';
  for (let i = liveTurns.length - 1; i >= 0; i--) {
    const t = liveTurns[i];
    const text = t.llmText || t.closingText?.text;
    if (text && text.trim()) {
      subtext = truncate(text, 110);
      break;
    }
  }
  if (!subtext) {
    const n = liveTurns.length;
    subtext = n > 0 ? `${n} response${n !== 1 ? 's' : ''}` : 'New conversation';
  }

  const tag = inferTagFromUseCases(liveTurns.map((t) => t.useCase));
  return { title, subtext, tag };
}
