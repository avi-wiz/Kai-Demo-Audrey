import type { DocsQAPair } from '@/lib/types';
import qaPairsRaw from '@/fixtures/docs-qa-pairs.json';

const pairs = (qaPairsRaw as { pairs: DocsQAPair[] }).pairs;

export interface DocsQAResult {
  matched: boolean;
  qaPair: DocsQAPair | null;
}

export function useDocsQA(message: string): DocsQAResult {
  const lower = message.toLowerCase();

  let bestPair: DocsQAPair | null = null;
  let bestScore = 0;

  for (const pair of pairs) {
    const score = pair.keywords.filter((kw) => lower.includes(kw.toLowerCase())).length;
    if (score > bestScore) {
      bestScore = score;
      bestPair = pair;
    }
  }

  if (bestScore >= 1) {
    return { matched: true, qaPair: bestPair };
  }
  return { matched: false, qaPair: null };
}
