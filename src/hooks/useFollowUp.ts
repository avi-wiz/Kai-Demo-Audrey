import type { FollowUpType } from '@/lib/types';

const WIDGET_SWAP_KEYWORDS = [
  'table', 'show as table', "don't show chart", 'instead',
  'data table', 'switch to table', 'show me a table',
];

const FORM_RESTAGE_KEYWORDS = [
  'change', 'update', 'set', 'modify', 'make it', 'switch to',
  // uc2-order chip queries — sr-1 group
  'add more', 'apply a', 'apply discount', 'apply 10', '10% discount',
];

export interface FollowUpResult {
  type: FollowUpType;
  data?: unknown;
}

/**
 * Pure function — not a React hook despite the name pattern.
 * Detects widget-swap and form-restage follow-up intents based on
 * the current message and the last Kai turn's use case.
 */
export function detectFollowUp(
  message: string,
  lastKaiUseCase: string | null,
): FollowUpResult {
  if (!lastKaiUseCase) return { type: 'none' };

  const lower = message.toLowerCase();

  if (
    lastKaiUseCase === 'uc1' &&
    WIDGET_SWAP_KEYWORDS.some((kw) => lower.includes(kw))
  ) {
    return { type: 'widget-swap' };
  }

  if (
    (lastKaiUseCase === 'uc2' ||
      lastKaiUseCase === 'uc2-restage' ||
      lastKaiUseCase === 'uc2-order' ||
      lastKaiUseCase === 'sr2-reorder' ||
      lastKaiUseCase === 'ad17-report') &&
    FORM_RESTAGE_KEYWORDS.some((kw) => lower.includes(kw))
  ) {
    return { type: 'form-restage' };
  }

  return { type: 'none' };
}
