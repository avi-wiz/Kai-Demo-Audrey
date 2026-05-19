import type { WidgetHighlight } from '@/lib/types';

const TODAY = new Date();
TODAY.setHours(0, 0, 0, 0);

function daysDiff(isoDate: string): number {
  const d = new Date(isoDate + 'T00:00:00');
  return Math.round((d.getTime() - TODAY.getTime()) / 86_400_000);
}

function dueDateHighlight(fieldPath: string, isoDate: string): WidgetHighlight | null {
  const diff = daysDiff(isoDate);
  if (diff < 0) {
    return {
      fieldPath,
      type: 'urgent',
      message: `Overdue by ${Math.abs(diff)} day${Math.abs(diff) === 1 ? '' : 's'}`,
    };
  }
  if (diff <= 2) {
    return {
      fieldPath,
      type: 'warning',
      message: diff === 0 ? 'Due today' : `Due in ${diff} day${diff === 1 ? '' : 's'}`,
    };
  }
  return null;
}

// ─── Widget-specific rules ────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function forCompactList(data: any): WidgetHighlight[] {
  const highlights: WidgetHighlight[] = [];
  const items: { dueDate?: string }[] = data?.items ?? [];
  items.forEach((item, i) => {
    if (item.dueDate) {
      const hl = dueDateHighlight(`items[${i}].dueDate`, item.dueDate);
      if (hl) highlights.push(hl);
    }
  });
  return highlights;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function forDataTable(data: any): WidgetHighlight[] {
  const highlights: WidgetHighlight[] = [];
  const columns: { key: string; format?: string }[] = data?.columns ?? [];
  const rows: Record<string, unknown>[] = data?.rows ?? [];

  const dateKeys = columns.filter((c) => c.format === 'date').map((c) => c.key);
  const stockKey = columns.find((c) => c.key === 'stock')?.key ?? null;

  rows.forEach((row, i) => {
    dateKeys.forEach((key) => {
      const val = row[key];
      if (typeof val === 'string') {
        const hl = dueDateHighlight(`rows[${i}].${key}`, val);
        if (hl) highlights.push(hl);
      }
    });

    if (stockKey !== null) {
      const stock = row[stockKey];
      if (stock === 0) {
        highlights.push({ fieldPath: `rows[${i}].${stockKey}`, type: 'urgent', message: 'Out of stock' });
      } else if (typeof stock === 'number' && stock < 20) {
        highlights.push({ fieldPath: `rows[${i}].${stockKey}`, type: 'warning', message: `Low stock — ${stock} units` });
      }
    }
  });

  return highlights;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function forCustomer360Card(data: any): WidgetHighlight[] {
  const highlights: WidgetHighlight[] = [];

  const balance: number = data?.currentBalance ?? 0;
  const creditLimit: number = data?.creditLimit ?? 0;
  if (creditLimit > 0 && balance / creditLimit > 0.5) {
    const pct = Math.round((balance / creditLimit) * 100);
    highlights.push({
      fieldPath: 'metrics.cards[1].value',
      type: 'warning',
      message: `Balance is $${balance.toLocaleString()} — ${pct}% of $${creditLimit.toLocaleString()} credit limit`,
    });
  }

  const tags: string[] = data?.tags ?? [];
  const lastOrder: string = data?.lastOrderDate ?? '';
  if (lastOrder && tags.some((t) => t.toLowerCase() === 'vip')) {
    const diff = daysDiff(lastOrder);
    if (diff < 0 && Math.abs(diff) > 30) {
      highlights.push({
        fieldPath: 'recentOrders[0].status',
        type: 'info',
        message: `Last order was ${Math.abs(diff)} days ago — above your 30-day VIP cadence`,
      });
    }
  }

  return highlights;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function forEntityDetailCard(data: any): WidgetHighlight[] {
  const highlights: WidgetHighlight[] = [];
  const fields: { label: string; value: unknown }[] = data?.fields ?? [];

  fields.forEach((field, i) => {
    const label = field.label?.toLowerCase() ?? '';
    const val = field.value;

    if ((label.includes('due') || label.includes('date')) && typeof val === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(val)) {
      const hl = dueDateHighlight(`fields[${i}]`, val);
      if (hl) highlights.push(hl);
    }

    if (label === 'stock' || label === 'inventory') {
      const n = typeof val === 'number' ? val : Number(val);
      if (!isNaN(n)) {
        if (n === 0) {
          highlights.push({ fieldPath: `fields[${i}]`, type: 'urgent', message: 'Out of stock' });
        } else if (n < 20) {
          highlights.push({ fieldPath: `fields[${i}]`, type: 'warning', message: `Low stock — ${n} units` });
        }
      }
    }
  });

  return highlights;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function forMetricCardRow(data: any): WidgetHighlight[] {
  const highlights: WidgetHighlight[] = [];
  const cards: { trend?: { direction: string; percent: number } }[] = data?.cards ?? [];

  cards.forEach((card, i) => {
    if (card.trend?.direction === 'down') {
      highlights.push({
        fieldPath: `cards[${i}]`,
        type: 'warning',
        message: `Down ${card.trend.percent}% ${card.trend && 'period' in card.trend ? (card.trend as { period?: string }).period ?? '' : ''}`.trim(),
      });
    }
  });

  return highlights;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function forMetricCard(data: any): WidgetHighlight[] {
  if (data?.trend?.direction === 'down') {
    return [{
      fieldPath: 'value',
      type: 'warning',
      message: `Down ${data.trend.percent}% ${data.trend.period ?? ''}`.trim(),
    }];
  }
  return [];
}

// ─── Public API ───────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function generateHighlights(widgetType: string, data: any): WidgetHighlight[] {
  switch (widgetType) {
    case 'UW-011': return forCompactList(data);
    case 'UW-004': return forDataTable(data);
    case 'UW-007': return forCustomer360Card(data);
    case 'UW-003': return forEntityDetailCard(data);
    case 'UW-002': return forMetricCardRow(data);
    case 'UW-001': return forMetricCard(data);
    default:       return [];
  }
}
