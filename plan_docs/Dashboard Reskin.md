# Dashboard Reskin — Audrey's Home & Gift

## Context

Reskin the WizOrder Dashboard page so every visible metric, activity item, brief line, and starter prompt references Audrey's real catalog and the synthetic CRM data in `src/data/audreys/`. Adds a new Activity Feed section (does not currently exist on the page) by extending the existing `CompactList` widget with a back-compat activity variant.

## Files Modified

| # | File | Change |
|---|---|---|
| 1 | [src/lib/types.ts](../src/lib/types.ts) | Add `CompactListActivityItem` + convert `CompactListData` to a discriminated union; preserve `CompactListItem` alias |
| 2 | [src/components/widgets/ui/CompactList.tsx](../src/components/widgets/ui/CompactList.tsx) | Branch on `data.kind === 'activity'`; add `ActivityRow` component |
| 3 | [src/components/wizorder/WizDashboardPage.tsx](../src/components/wizorder/WizDashboardPage.tsx) | Replace `METRICS` + `REVENUE_SERIES` with Audrey-derived values; render activity-mode `CompactList` |
| 4 | [src/fixtures/proactive-brief-general.json](../src/fixtures/proactive-brief-general.json) | Rewrite `greeting` + `urgentItems` + `todaysSummary` for Audrey |
| 5 | [src/contexts/PageContext.tsx](../src/contexts/PageContext.tsx) | Replace 4 dashboard starter prompts |

## 1. WizDashboardPage.tsx — KPI Tiles + Activity Feed

### Metrics
- Active SKUs — derived from `PRODUCTS.length` (50)
- This Week Revenue — hardcoded `$42,800`
- Open Orders — `ORDERS` filtered to `Open` or `Submitted` (13)
- Pre-Book Pipeline — sum of `ORDERS.total` where `status === 'Pre-Book Confirmed'`

### Revenue chart
12-month series across all buckets from `SALES_HISTORY`. Title: "Revenue — Last 12 Months", subtitle: "Jun 2025 – May 2026 · Monthly revenue across all buckets".

### Activity Feed
Renders the new `kind: 'activity'` variant of `CompactList` with 3 entries:
- "Beth closed Pre-Book for Bloom & Basket — 24 cases of Pick Of The Patch" (1h ago)
- "New lead: Rustic Charm Boutique via website signup" (3h ago)
- "Order #1047 shipped to Magnolia Home & Garden" (yesterday)

## 2. CompactList activity variant

New discriminated-union data type:
```ts
export type CompactListData =
  | { kind?: 'task'; title: string; items: CompactListTaskItem[] }
  | { kind: 'activity'; title: string; items: CompactListActivityItem[] };

export interface CompactListActivityItem {
  id: string;
  text: string;
  timestamp: string;
  icon?: 'order' | 'lead' | 'task' | 'deal' | 'check' | 'alert' | string;
  actor?: string;
}
```

Existing fixtures that omit `kind` continue to validate as the task arm. Widget branches on `data.kind === 'activity'` and renders an icon + body sentence + right-aligned timestamp using the same outer card chrome.

## 3. Proactive brief (`proactive-brief-general.json`)

Greeting: "Good morning, Beth. Two things need your attention."

Urgent items:
- PhaseOut SKU urgency (cites Wall Planter - Le Jardin, Antiqued Bronze Bird Garden Stake) + "Draft clearance email" chip
- July 2026 release 16 days out, Pick Of The Patch Gnome tracking +18% + "Show pacing table" chip

Today's summary (3 rows): 3 tasks due, 1 new lead, Magnolia 2 PM review.

## 4. Starter prompts (PageContext dashboard)

```
What needs my attention today?
Show me this week's revenue breakdown
How's the July release pacing?
Any overdue tasks?
```

## Verification

1. `npx tsc --noEmit` — must pass clean.
2. Boot dev server and confirm on the Dashboard tab:
   - KPI tiles: Active SKUs=50, This Week Revenue=$42,800, Open Orders=13, Pre-Book Pipeline (computed).
   - Chart shows 12 monthly points Jun 2025 → May 2026.
   - Activity Feed renders 3 rows below the chart with icons + timestamps.
   - Brief greets Beth and surfaces PhaseOut + July pre-book.
   - 4 starter chips read as listed.
