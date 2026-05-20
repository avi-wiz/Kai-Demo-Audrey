import type { UseCase } from './types';

export const DEMO_QUERIES: Record<UseCase, string> = {
  uc1: "How's Magnolia Home & Garden doing?",
  uc2: 'Create a task for Wildflower Market',
  uc3: 'Show Magnolia revenue and create a follow-up',
  unknown: '',
};

export const SUGGESTED_QUERIES = [
  DEMO_QUERIES.uc1,
  DEMO_QUERIES.uc2,
  DEMO_QUERIES.uc3,
];

export const THINKING_MESSAGES = [
  "Pulling up the story...",
  "Checking the CRM...",
  "Looking into that...",
  "On it, one moment...",
  "Digging through the data...",
  "Almost there...",
];

// AI mode is activated via ?ai=true URL param. Keyword mode is the default.
export const AI_MODE_PARAM = 'ai';

export const STREAM_WIDGET_DELAY_MS = 500;
export const STREAM_FRAME_PAUSE_MS = 1000;

// UC-3 has 3 frames with distinct inter-frame pauses that simulate parallel
// branch execution: reasoning → 1800ms → Branch A results → 1400ms → Branch B action.
// Index i means "pause after frame i before emitting frame i+1".
export const UC3_FRAME_PAUSES_MS: Record<number, number> = {
  0: 1800,
  1: 1400,
};
