import type { HistoryTag } from './historyTypes';

export const HISTORY_TAGS: readonly HistoryTag[] = [
  'Sales',
  'Admin Ops',
  'Reports & Analytics',
  'Email & Outreach',
  'Workflows',
  'Knowledge Base',
  'Dashboards',
  'Other',
] as const;

export const USECASE_TO_TAG: Record<string, HistoryTag> = {
  uc1: 'Sales',
  'uc1-swap': 'Sales',
  'sr2-reorder': 'Sales',
  'sr2-compare': 'Sales',
  'sr11-invoice': 'Sales',
  'sr14-brief': 'Sales',
  'sr20-outreach': 'Sales',

  'ad1-approval': 'Admin Ops',
  'ad1-approved': 'Admin Ops',
  'ad1-flagged': 'Admin Ops',
  'ad3-handoff': 'Admin Ops',

  'ad17-report': 'Reports & Analytics',
  'metric-clarification': 'Reports & Analytics',

  'email-draft': 'Email & Outreach',
  'email-shorter': 'Email & Outreach',

  'ad29-workflow': 'Workflows',
  'ad29-test': 'Workflows',
  'workflow-clarification': 'Workflows',

  'docs-qa': 'Knowledge Base',

  'dashboard-builder': 'Dashboards',

  uc2: 'Other',
  'uc2-order': 'Other',
  'uc2-restage': 'Other',
  uc3: 'Other',
  'page-context': 'Other',
  unknown: 'Other',
};

export const TAG_COLORS: Record<HistoryTag, { color: string; bg: string }> = {
  'Sales':              { color: 'var(--primary-80)', bg: 'rgba(22,136,95,0.10)' },
  'Admin Ops':          { color: '#b45309',           bg: 'rgba(245,158,11,0.12)' },
  'Reports & Analytics':{ color: '#1d4ed8',           bg: 'rgba(59,130,246,0.10)' },
  'Email & Outreach':   { color: '#7c3aed',           bg: 'rgba(124,58,237,0.10)' },
  'Workflows':          { color: '#0891b2',           bg: 'rgba(8,145,178,0.10)' },
  'Knowledge Base':     { color: 'var(--text2)',      bg: 'var(--surface2)' },
  'Dashboards':         { color: '#be185d',           bg: 'rgba(190,24,93,0.10)' },
  'Other':              { color: 'var(--text2)',      bg: 'var(--surface2)' },
};

/** Tag inference from per-turn use-cases. Picks the mode; ties go to most recent. */
export function inferTagFromUseCases(useCases: string[]): HistoryTag {
  if (useCases.length === 0) return 'Other';
  const counts: Record<string, number> = {};
  const lastSeen: Record<string, number> = {};
  useCases.forEach((uc, i) => {
    const tag = USECASE_TO_TAG[uc] ?? 'Other';
    counts[tag] = (counts[tag] ?? 0) + 1;
    lastSeen[tag] = i;
  });
  let best: HistoryTag = 'Other';
  let bestCount = -1;
  let bestRecency = -1;
  for (const tag of Object.keys(counts) as HistoryTag[]) {
    const c = counts[tag];
    const r = lastSeen[tag];
    if (c > bestCount || (c === bestCount && r > bestRecency)) {
      best = tag;
      bestCount = c;
      bestRecency = r;
    }
  }
  return best;
}
