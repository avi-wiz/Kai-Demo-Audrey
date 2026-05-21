import type { Frame, Widget } from '@/lib/types';
import type { ValidatedPlan } from './schema';
import { TOOL_REGISTRY, type ToolResult } from './tools/index';
import { WIDGET_CATALOG } from './widget_catalog';

export interface CompileOk {
  ok: true;
  frame: Frame;
  toolResults: Record<string, ToolResult>;
}

export interface CompileFail {
  ok: false;
  reason: string;
}

export type CompileResult = CompileOk | CompileFail;

function applyTransform(
  result: ToolResult,
  transform?: ValidatedPlan['widgets'][number]['transform'],
): unknown {
  if (!transform) return result;

  let data: unknown = result;

  if (transform.pick && Array.isArray((data as { rows?: unknown[] }).rows)) {
    const rows = (data as { rows: Record<string, unknown>[] }).rows;
    const picked = rows.map(row =>
      Object.fromEntries(transform.pick!.filter(k => k in row).map(k => [k, row[k]]))
    );
    data = { ...(data as object), rows: picked };
  }

  if (transform.rename && Array.isArray((data as { rows?: unknown[] }).rows)) {
    const rows = (data as { rows: Record<string, unknown>[] }).rows;
    const renamed = rows.map(row => {
      const out: Record<string, unknown> = { ...row };
      for (const [from, to] of Object.entries(transform.rename!)) {
        if (from in out) {
          out[to] = out[from];
          delete out[from];
        }
      }
      return out;
    });
    data = { ...(data as object), rows: renamed };
  }

  return data;
}

// Humanize a camelCase / snake_case key into a column label.
function humanizeKey(k: string): string {
  return k
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\b\w/g, c => c.toUpperCase());
}

// Guess a column format from the key name. Conservative — falls back to 'text'.
function guessFormat(key: string): string {
  const k = key.toLowerCase();
  if (k.endsWith('date') || k === 'date' || k.endsWith('at')) return 'date';
  if (k === 'status' || k === 'priority' || k === 'stage' || k === 'bucket') return 'badge';
  if (k.includes('total') || k.includes('price') || k.includes('revenue') || k.includes('amount') || k.includes('value')) return 'currency';
  if (k === 'count' || k === 'qty' || k === 'items' || k === 'agg') return 'number';
  return 'text';
}

// UW-004 requires `columns` + `rows`. The tool layer returns `{rows}` (or
// `{groups}` when grouped). The planner IR has no way to declare columns
// itself, so the compiler synthesizes them from the row keys here. Also
// converts grouped results into a 2-column rows shape so they render.
function shapeForDataTable(data: unknown, pick?: string[], rename?: Record<string, string>): unknown {
  if (!data || typeof data !== 'object') return data;
  const d = data as { rows?: Record<string, unknown>[]; groups?: Array<{ key: string; count: number; agg?: number }>; title?: string; [k: string]: unknown };

  // Helper: map an original key to its post-rename key (if rename was applied).
  const renamed = (k: string): string => rename?.[k] ?? k;

  // Group results → rows (note: applyTransform's rename has NOT touched these
  // because groups isn't an array of rows, so we rename here ourselves.)
  if (Array.isArray(d.groups) && !Array.isArray(d.rows)) {
    const rows = d.groups.map(g => ({
      [renamed('key')]: g.key,
      [renamed('count')]: g.count,
      ...(g.agg !== undefined ? { [renamed('agg')]: g.agg } : {}),
    }));
    // Include the agg column whenever the planner picked it (so empty results
    // still show a 3-column table) OR whenever any group actually has an agg.
    const aggRequested = (pick?.includes('agg') ?? false) || d.groups.some(g => g.agg !== undefined);
    const columns = [
      { key: renamed('key'), label: rename?.key ?? 'Group', format: 'text' },
      { key: renamed('count'), label: rename?.count ?? 'Count', format: 'number' },
      ...(aggRequested
        ? [{ key: renamed('agg'), label: rename?.agg ?? 'Total', format: 'currency' }]
        : []),
    ];
    return { ...d, rows, columns };
  }

  if (!Array.isArray(d.rows) || d.rows.length === 0) {
    // Empty result — still provide columns so the widget can render an empty state.
    const keys = pick ?? [];
    return {
      ...d,
      rows: d.rows ?? [],
      columns: keys.map(k => ({ key: renamed(k), label: rename?.[k] ?? humanizeKey(k), format: guessFormat(k) })),
    };
  }

  // Row results — applyTransform already renamed keys on each row. Pick is in
  // the ORIGINAL key namespace; columns should reference the RENAMED keys.
  const sampleOriginalKeys = pick && pick.length > 0
    ? pick
    : Object.keys(d.rows[0]).filter(k => {
        const v = (d.rows![0] as Record<string, unknown>)[k];
        return v === null || ['string', 'number', 'boolean'].includes(typeof v);
      });

  const columns = sampleOriginalKeys.map(k => ({
    key: renamed(k),
    label: rename?.[k] ?? humanizeKey(k),
    format: guessFormat(k),
  }));

  // Rows: rebuild keeping only the chosen (renamed) columns so non-scalar
  // fields don't trip zod.
  const scalarRows = d.rows.map(r => {
    const out: Record<string, unknown> = {};
    for (const k of sampleOriginalKeys) {
      const targetKey = renamed(k);
      if (targetKey in r) out[targetKey] = r[targetKey];
      else if (k in r) out[targetKey] = r[k];
    }
    return out;
  });

  return { ...d, rows: scalarRows, columns };
}

const TOOL_TO_ENTITY_TYPE: Record<string, string> = {
  queryCustomers: 'customer',
  queryLeads: 'lead',
  queryReps: 'rep',
  queryOrders: 'order',
  queryProducts: 'product',
  queryTasks: 'task',
};

function isScalar(v: unknown): boolean {
  return v === null || ['string', 'number', 'boolean'].includes(typeof v);
}

// UW-002 expects `{cards:[{label,value,format?}]}`. Build cards from grouped
// tool results (one card per group) or from a single row of scalar metrics.
function shapeForMetricRow(data: unknown, pick?: string[]): unknown {
  if (!data || typeof data !== 'object') return data;
  const d = data as { rows?: Record<string, unknown>[]; groups?: Array<{ key: string; count: number; agg?: number }>; cards?: unknown };

  // Already a metric row shape — pass through.
  if (Array.isArray(d.cards)) return data;

  // Groups → one card per group.
  if (Array.isArray(d.groups)) {
    const cards = d.groups.slice(0, 5).map(g => ({
      label: humanizeKey(g.key),
      value: g.agg ?? g.count,
      format: g.agg !== undefined ? 'currency' : 'count',
    }));
    return { cards };
  }

  // Single row → one card per scalar field (limit to ~5).
  const row = Array.isArray(d.rows) && d.rows.length > 0 ? d.rows[0] : undefined;
  if (!row) return { cards: [] };

  const keys = (pick && pick.length > 0
    ? pick
    : Object.keys(row).filter(k => isScalar(row[k]))
  ).slice(0, 5);

  const cards = keys.map(k => ({
    label: humanizeKey(k),
    value: row[k] as string | number,
    format: guessFormat(k),
  }));
  return { cards };
}

// UW-011 (task variant) expects `{title, items:[{id,title,dueDate,priority,assignedTo,status}]}`.
// Tool layer returns `{rows:[<task>]}` with the same field names — just rewrap.
function shapeForCompactList(data: unknown, fallbackTitle?: string): unknown {
  if (!data || typeof data !== 'object') return data;
  const d = data as { rows?: Record<string, unknown>[]; items?: unknown; title?: string };
  if (Array.isArray(d.items)) return data;
  const rows = Array.isArray(d.rows) ? d.rows : [];
  const items = rows.slice(0, 8).map(r => ({
    id: String(r.id ?? ''),
    title: String(r.title ?? r.name ?? ''),
    dueDate: String(r.dueDate ?? ''),
    priority: String(r.priority ?? ''),
    assignedTo: String(r.assignedTo ?? r.repName ?? ''),
    status: String(r.status ?? ''),
  }));
  return { kind: 'task' as const, title: d.title ?? fallbackTitle ?? 'Tasks', items };
}

// UW-009 expects `{title?, items:[{sku,name,retailPrice,caseQty,stockStatus,imageUrl}]}`.
// Tool layer returns product rows with snake_case AudreyProduct fields.
function shapeForProductGrid(data: unknown, fallbackTitle?: string): unknown {
  if (!data || typeof data !== 'object') return data;
  const d = data as { rows?: Record<string, unknown>[]; items?: unknown; title?: string };
  if (Array.isArray(d.items)) return data;
  const rows = Array.isArray(d.rows) ? d.rows : [];
  const items = rows.slice(0, 9).map(r => {
    const imgBySize = r.image_urls_by_size as { large?: string[]; original?: string[] } | undefined;
    const imgFallback = Array.isArray(r.image_urls) ? (r.image_urls as string[])[0] : undefined;
    const imageUrl = imgBySize?.large?.[0] ?? imgBySize?.original?.[0] ?? imgFallback ?? '';
    return {
      sku: String(r.sku ?? ''),
      name: String(r.name ?? ''),
      retailPrice: Number(r.retailPrice ?? r.retail_price ?? 0),
      caseQty: Number(r.caseQty ?? r.case_qty ?? 0),
      stockStatus: String(r.stockStatus ?? r.stock_status ?? 'In Stock'),
      imageUrl,
      ...(r.isHero !== undefined || r.is_hero !== undefined ? { isHero: Boolean(r.isHero ?? r.is_hero) } : {}),
      ...(r.bucket ? { bucket: String(r.bucket) } : {}),
      ...(Array.isArray(r.collections) && (r.collections as unknown[]).length > 0
        ? { collection: String((r.collections as unknown[])[0]) }
        : r.collection ? { collection: String(r.collection) } : {}),
    };
  });
  return { ...(fallbackTitle ? { title: fallbackTitle } : d.title ? { title: d.title } : {}), items };
}

// CH-001 expects `{title, series:[{<x>,<y>}], yAxisLabel, xAxisLabel}`. Tool
// returns groups (preferred for charts) or rows. Convert and supply axis labels.
function shapeForChart(data: unknown, fallbackTitle?: string): unknown {
  if (!data || typeof data !== 'object') return data;
  const d = data as {
    rows?: Record<string, unknown>[];
    groups?: Array<{ key: string; count: number; agg?: number }>;
    series?: unknown;
    title?: string;
    yAxisLabel?: string;
    xAxisLabel?: string;
  };
  if (Array.isArray(d.series)) {
    return {
      title: d.title ?? fallbackTitle ?? 'Trend',
      series: d.series,
      yAxisLabel: d.yAxisLabel ?? 'Value',
      xAxisLabel: d.xAxisLabel ?? '',
    };
  }
  if (Array.isArray(d.groups)) {
    const hasAgg = d.groups.some(g => g.agg !== undefined);
    const series = d.groups.map(g => ({ key: g.key, value: hasAgg ? (g.agg ?? 0) : g.count }));
    return {
      title: d.title ?? fallbackTitle ?? 'Group Comparison',
      series,
      yAxisLabel: hasAgg ? 'Total' : 'Count',
      xAxisLabel: 'Group',
    };
  }
  if (Array.isArray(d.rows) && d.rows.length > 0) {
    // Use first row's keys: first scalar key as x, second numeric as y.
    const keys = Object.keys(d.rows[0]).filter(k => isScalar((d.rows![0] as Record<string, unknown>)[k]));
    const xKey = keys[0] ?? 'x';
    const yKey = keys.find(k => typeof (d.rows![0] as Record<string, unknown>)[k] === 'number') ?? keys[1] ?? 'y';
    const series = d.rows.map(r => ({ [xKey]: r[xKey], [yKey]: r[yKey] }));
    return {
      title: d.title ?? fallbackTitle ?? 'Trend',
      series,
      yAxisLabel: humanizeKey(yKey),
      xAxisLabel: humanizeKey(xKey),
    };
  }
  return { title: fallbackTitle ?? 'Trend', series: [], yAxisLabel: '', xAxisLabel: '' };
}

// UW-003 expects `{ entityType, title?, fields:[{label, value}] }`. Tool layer
// returns `{rows:[{...}]}` — pull the first row, infer entityType from the
// source tool name, and map scalar fields into label/value pairs.
function shapeForEntityDetail(data: unknown, toolName?: string, pick?: string[]): unknown {
  if (!data || typeof data !== 'object') return data;
  const d = data as { rows?: Record<string, unknown>[]; title?: string };
  const row = Array.isArray(d.rows) && d.rows.length > 0 ? d.rows[0] : undefined;
  if (!row) return data;

  const entityType = (toolName && TOOL_TO_ENTITY_TYPE[toolName]) ?? 'entity';
  const title = (row.name as string | undefined) ?? (row.title as string | undefined) ?? d.title;

  const keys = pick && pick.length > 0
    ? pick
    : Object.keys(row).filter(k => {
        const v = row[k];
        return v === null || ['string', 'number', 'boolean'].includes(typeof v);
      });

  const fields = keys
    .filter(k => k !== 'name' && k !== 'title' && k in row)
    .map(k => ({ label: humanizeKey(k), value: String(row[k] ?? '') }));

  return { entityType, ...(title ? { title } : {}), fields };
}

export async function compile(plan: ValidatedPlan, userQuery?: string): Promise<CompileResult> {
  const toolResults: Record<string, ToolResult> = {};
  const bindToTool: Record<string, string> = {};

  // Run steps in order
  for (const step of plan.steps) {
    const toolDef = TOOL_REGISTRY[step.tool];
    if (!toolDef) {
      return { ok: false, reason: `Unknown tool: ${step.tool}` };
    }
    try {
      const result = toolDef.execute(step.args);
      toolResults[step.bindTo] = result;
      bindToTool[step.bindTo] = step.tool;
    } catch (err) {
      return { ok: false, reason: `Tool ${step.tool} failed: ${String(err)}` };
    }
  }

  // Hydrate and validate each widget
  const widgets: Widget[] = [];

  for (const widgetSpec of plan.widgets) {
    const sourceResult = toolResults[widgetSpec.dataFrom];
    if (sourceResult === undefined) {
      return { ok: false, reason: `Widget ${widgetSpec.widgetType} references unknown bindTo: ${widgetSpec.dataFrom}` };
    }

    // Typed widgets (UW-009, UW-011) need specific fields the planner couldn't
    // know to pick. Bypass transform.pick for those and shape directly from
    // the raw tool result. Other widgets keep the planner's pick/rename.
    const fallbackTitle = userQuery ? userQuery.slice(0, 80) : undefined;
    const widgetTitle = (widgetSpec.config as { title?: string } | undefined)?.title ?? fallbackTitle;
    let data: unknown;
    if (widgetSpec.widgetType === 'UW-009') {
      data = shapeForProductGrid(sourceResult, widgetTitle);
    } else if (widgetSpec.widgetType === 'UW-011') {
      data = shapeForCompactList(sourceResult, widgetTitle);
    } else {
      data = applyTransform(sourceResult, widgetSpec.transform);
      if (widgetSpec.widgetType === 'UW-002') {
        data = shapeForMetricRow(data, widgetSpec.transform?.pick);
      } else if (widgetSpec.widgetType === 'UW-003') {
        data = shapeForEntityDetail(data, bindToTool[widgetSpec.dataFrom], widgetSpec.transform?.pick);
      } else if (widgetSpec.widgetType === 'UW-004') {
        data = shapeForDataTable(data, widgetSpec.transform?.pick, widgetSpec.transform?.rename);
      } else if (widgetSpec.widgetType === 'CH-001') {
        data = shapeForChart(data, widgetTitle);
      }
    }

    const catalogEntry = WIDGET_CATALOG[widgetSpec.widgetType];
    if (!catalogEntry) {
      return { ok: false, reason: `Widget type ${widgetSpec.widgetType} not in catalog` };
    }

    const parseResult = catalogEntry.dataShape.safeParse(data);
    if (!parseResult.success) {
      return {
        ok: false,
        reason: `Widget ${widgetSpec.widgetType} data shape invalid: ${parseResult.error.message}`,
      };
    }

    widgets.push({
      widgetType: widgetSpec.widgetType,
      data: data as Record<string, unknown>,
      ...(widgetSpec.config ? { config: widgetSpec.config } : {}),
      ...(widgetSpec.highlights ? { highlights: widgetSpec.highlights.map(h => ({ ...h, message: h.message ?? '', fieldPath: h.fieldPath ?? '' })) } : {}),
    });
  }

  const frame: Frame = {
    frameId: `planner-${Date.now()}`,
    frameType: 'result',
    widgets,
  };

  return { ok: true, frame, toolResults };
}
