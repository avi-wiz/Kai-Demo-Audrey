import { CUSTOMERS } from '@/data/audreys/synthetic/customers';
import { LEADS } from '@/data/audreys/synthetic/leads';
import { SALES_REPS } from '@/data/audreys/synthetic/sales-reps';

// The planner often passes a customer/rep/lead "id" arg as a display name
// ("Magnolia") instead of the actual id ("C-8001") because the IR has no
// way to enumerate IDs cheaply in-prompt. These resolvers accept either:
//   - exact id (returns it unchanged if known)
//   - case-insensitive name substring (returns the first matching id)
//   - unknown input (returns null — the caller should then drop the filter
//     entirely or yield an empty result)

function resolve<T extends { id: string; name: string }>(records: T[], input?: string): string | null {
  if (!input) return null;
  const q = input.trim();
  if (!q) return null;
  if (records.some(r => r.id === q)) return q;
  const lower = q.toLowerCase();
  // Try exact name match first, then substring.
  const exact = records.find(r => r.name.toLowerCase() === lower);
  if (exact) return exact.id;
  const partial = records.find(r => r.name.toLowerCase().includes(lower));
  return partial?.id ?? null;
}

export function resolveCustomerRef(input?: string): string | null {
  return resolve(CUSTOMERS, input);
}

export function resolveRepRef(input?: string): string | null {
  return resolve(SALES_REPS, input);
}

export function resolveLeadRef(input?: string): string | null {
  return resolve(LEADS, input);
}
