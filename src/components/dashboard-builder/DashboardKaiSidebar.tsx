'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useDashboardBuilder } from '@/contexts/DashboardBuilderContext';
import type { DashboardCompositeData, ClarificationOption } from '@/lib/types';
import actionChipsMapRaw from '@/fixtures/action-chips-map.json';
import { METRIC_CATALOG, resolveMetrics, type MetricScope, type CatalogMetric } from '@/lib/metricCatalog';
import { exportDashboardAsPdf, exportDashboardAsCsv } from '@/lib/dashboardExport';
import { WidgetActionContext, type WidgetActionHandlers } from '@/components/engine/FrameParser';
import ClarificationCard from '@/components/widgets/actions/ClarificationCard';

const EDIT_CHIPS = (actionChipsMapRaw as { capabilityChips: Record<string, { label: string; query: string }[]> })
  .capabilityChips['dashboard-edit'] ?? [];

// Infer a MetricScope from the dashboard title/description so the sidebar
// surfaces metrics relevant to the loaded dashboard.
function inferScope(dashboard: DashboardCompositeData): MetricScope {
  const t = `${dashboard.title} ${dashboard.description}`.toLowerCase();
  if (t.includes('customer health') || t.includes('retention') || t.includes('dormant')) return 'customer-health';
  if (t.includes('order analytics') || t.includes('fulfillment')) return 'order-analytics';
  if (t.includes('pipeline')) return 'pipeline';
  // Default — sales performance covers the broadest set.
  return 'sales-performance';
}

interface ClarifyState {
  scope: MetricScope;
  prompt: string;
  candidates: string[];
  currentLabels: string[];
}

interface SidebarMessage {
  id: string;
  role: 'assistant' | 'user';
  /** Plain text content for chat bubble. */
  text?: string;
  /** When set, render an AW-006 ClarificationCard instead of a text bubble. */
  clarify?: ClarifyState;
  /** True after the user has confirmed/cancelled — dims the card. */
  resolved?: boolean;
}

// ── Edit matchers ─────────────────────────────────────────────────────────────

function applyEdit(
  dashboard: DashboardCompositeData,
  message: string,
): { updated: DashboardCompositeData; reply: string } | null {
  const m = message.toLowerCase();

  // "change to last 90 days / change date range"
  if (m.includes('90 days') || m.includes('date range')) {
    const updated: DashboardCompositeData = {
      ...dashboard,
      description: dashboard.description.replace(/Q2 2026|last \d+ days/i, 'Last 90 days'),
      cells: dashboard.cells.map((cell) => {
        if (cell.widgetType === 'UW-002') {
          const cards = (cell.data as { cards: Record<string, unknown>[] }).cards.map((c) => ({
            ...c,
            trend: { ...(c.trend as Record<string, unknown>), period: 'vs 90d prior' },
          }));
          return { ...cell, data: { ...cell.data, cards } };
        }
        if (cell.widgetType === 'CH-001') {
          return {
            ...cell,
            data: {
              ...(cell.data as Record<string, unknown>),
              title: 'Revenue Trend — Daily (Last 90 Days)',
            },
          };
        }
        return cell;
      }),
    };
    return { updated, reply: "Done — the dashboard now shows the last 90 days. The metric trends and chart title have been updated." };
  }

  // Metric-add path: signalled by returning null + isMetric flag so the
  // caller routes through /api/kai/restage-metrics.

  // "replace line chart with bar / replace chart type"
  if (m.includes('bar chart') || m.includes('replace chart') || m.includes('chart type')) {
    const hasLine = dashboard.cells.some(
      (c) => c.widgetType === 'CH-001' && (c.config as Record<string, unknown>)?.chartType === 'line',
    );
    if (!hasLine) return { updated: dashboard, reply: "The chart is already a bar chart." };
    const updated: DashboardCompositeData = {
      ...dashboard,
      cells: dashboard.cells.map((cell) =>
        cell.widgetType === 'CH-001'
          ? { ...cell, config: { ...(cell.config ?? {}), chartType: 'bar', showArea: false } }
          : cell,
      ),
    };
    return { updated, reply: "Swapped the revenue trend chart to a bar chart." };
  }

  // "remove bottom-right / remove a widget"
  if (m.includes('remove') && (m.includes('widget') || m.includes('bottom'))) {
    const lastCell = dashboard.cells[dashboard.cells.length - 1];
    if (!lastCell) return null;
    const updated: DashboardCompositeData = {
      ...dashboard,
      cells: dashboard.cells.slice(0, -1),
    };
    return { updated, reply: `Removed the last widget (${lastCell.widgetType}) from the dashboard.` };
  }

  // "change layout to 2x2 / 3x2 / 2x3 / change layout"
  if (m.includes('layout') || /\b\d\s*[x×]\s*\d\b/.test(m)) {
    // Detect target column count from phrasings like "2x2", "3-column",
    // "two columns", or fall back to the current layout's column count.
    let newLayout: DashboardCompositeData['layout'];
    if (m.includes('3x2') || m.includes('3 x 2') || m.includes('3-column') || m.includes('three column')) {
      newLayout = 'grid-3x2';
    } else if (m.includes('2x3') || m.includes('2 x 3')) {
      newLayout = 'grid-2x3';
    } else {
      newLayout = 'grid-2x2';
    }
    if (newLayout === dashboard.layout) {
      return { updated: dashboard, reply: `The dashboard is already in ${newLayout} layout.` };
    }
    // Strip explicit row/col on each cell so CSS Grid auto-places them into
    // the new column count. colSpan is preserved (clamped to columns at render).
    const reflowedCells = dashboard.cells.map((c) => ({
      ...c,
      position: { colSpan: c.position.colSpan ?? 1 },
    }));
    const updated: DashboardCompositeData = {
      ...dashboard,
      layout: newLayout,
      cells: reflowedCells,
    };
    const friendly = newLayout === 'grid-3x2'
      ? 'a 3-column grid'
      : newLayout === 'grid-2x3'
        ? 'a 2-column · 3-row grid'
        : 'a 2x2 grid';
    return { updated, reply: `Layout changed to ${friendly}. Widgets have been re-flowed to fit.` };
  }

  // "export / download" is handled out-of-band in handleSend (it needs DOM
  // + async access). Leave applyEdit signalling a no-op so the message-level
  // logic can show a deterministic "preparing export" reply.
  return null;
}

// ── Metric helpers ────────────────────────────────────────────────────────────

const METRIC_REGEX = /(\badd|\binclude|\bappend).*?\b(metric|kpi|card|average order|aov|conversion|coverage|win rate|cycle|retention|churn|ltv|nps|fulfillment|backorder|return rate|deal size|velocity)\b/i;

function isMetricRequest(message: string): boolean {
  return METRIC_REGEX.test(message);
}

function getCurrentMetricLabels(dashboard: DashboardCompositeData): string[] {
  const metricsCell = dashboard.cells.find((c) => c.widgetType === 'UW-002');
  if (!metricsCell) return [];
  const cards = ((metricsCell.data as { cards?: Record<string, unknown>[] }).cards) ?? [];
  return cards.map((c) => String(c.label));
}

function applyMetricsToDashboard(
  dashboard: DashboardCompositeData,
  metricsToAdd: CatalogMetric[],
): DashboardCompositeData {
  if (metricsToAdd.length === 0) return dashboard;
  const newCards = metricsToAdd.map((m) => m.card as unknown as Record<string, unknown>);
  return {
    ...dashboard,
    cells: dashboard.cells.map((cell) => {
      if (cell.widgetType !== 'UW-002') return cell;
      const existing = ((cell.data as { cards?: Record<string, unknown>[] }).cards) ?? [];
      const have = new Set(existing.map((c) => String(c.label).toLowerCase()));
      const filtered = newCards.filter((c) => !have.has(String(c.label).toLowerCase()));
      if (filtered.length === 0) return cell;
      return { ...cell, data: { ...cell.data, cards: [...existing, ...filtered] } };
    }),
  };
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SendIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function DashboardKaiSidebar() {
  const { activeDashboard, replaceDashboard } = useDashboardBuilder();

  const [messages, setMessages] = useState<SidebarMessage[]>([
    {
      id: 'seed',
      role: 'assistant',
      text: `Dashboard loaded. What would you like to change? You can replace a widget, adjust the layout, add a metric, or swap the chart type.`,
    },
  ]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length, isThinking]);

  // Metric-add path: POST to /api/kai/restage-metrics and either apply or
  // append a clarification message that renders the AW-006 card inline.
  const handleMetricRequest = useCallback(async (trimmed: string) => {
    if (!activeDashboard) return;
    const scope = inferScope(activeDashboard);
    const currentLabels = getCurrentMetricLabels(activeDashboard);
    try {
      const res = await fetch('/api/kai/restage-metrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: trimmed, scope, currentLabels }),
      });
      const data = await res.json() as
        | { intent: 'apply'; add: string[]; remove: string[] }
        | { intent: 'clarify'; candidates: string[]; prompt: string };

      if (data.intent === 'apply' && data.add.length > 0) {
        const resolved = resolveMetrics(scope, data.add);
        const updated = applyMetricsToDashboard(activeDashboard, resolved);
        replaceDashboard(updated);
        const labelText = resolved.map((m) => m.label).join(' and ');
        setMessages((prev) => [
          ...prev,
          { id: (Date.now() + 1).toString(), role: 'assistant', text: `Added ${labelText} to the metrics row.` },
        ]);
        setIsThinking(false);
        return;
      }

      const candidates = data.intent === 'clarify' ? data.candidates : METRIC_CATALOG[scope].map((m) => m.label);
      const prompt = data.intent === 'clarify' ? data.prompt : 'Which metrics would you like to add?';
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          clarify: {
            scope,
            prompt,
            candidates: candidates.filter((c) => !currentLabels.includes(c)),
            currentLabels,
          },
        },
      ]);
      setIsThinking(false);
    } catch (err) {
      console.error('[dashboard sidebar metric request error]', err);
      // Silent fall-through: clarify with full catalog
      const catalog = METRIC_CATALOG[scope];
      const haveLower = new Set(currentLabels.map((l) => l.toLowerCase()));
      const candidates = catalog.map((m) => m.label).filter((l) => !haveLower.has(l.toLowerCase()));
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          clarify: {
            scope,
            prompt: 'Which metrics would you like to add?',
            candidates,
            currentLabels,
          },
        },
      ]);
      setIsThinking(false);
    }
  }, [activeDashboard, replaceDashboard]);

  const handleSend = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isThinking || !activeDashboard) return;

      setMessages((prev) => [...prev, { id: Date.now().toString(), role: 'user', text: trimmed }]);
      setInput('');
      setIsThinking(true);

      // Export / download — generate the actual file (PDF default, CSV when
      // the user says so explicitly). Captures the live dashboard stage node
      // via `[data-dashboard-stage]` so charts / colors are preserved.
      const lower = trimmed.toLowerCase();
      if (lower.includes('export') || lower.includes('download') || lower.includes('save as report')) {
        const wantsCsv = lower.includes('csv') || lower.includes('spreadsheet');
        const dashboard = activeDashboard;
        const node = document.querySelector<HTMLElement>('[data-dashboard-stage]');
        const format = wantsCsv ? 'CSV' : 'PDF';
        setTimeout(async () => {
          try {
            if (wantsCsv) {
              exportDashboardAsCsv(dashboard);
            } else if (node) {
              await exportDashboardAsPdf(dashboard, node);
            }
            setMessages((prev) => [
              ...prev,
              {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                text: node || wantsCsv
                  ? `Generated ${format} export for "${dashboard.title}". Check your downloads.`
                  : 'I couldn\'t find the dashboard to capture — try again from the dashboard view.',
              },
            ]);
          } catch (err) {
            console.error('[sidebar export]', err);
            setMessages((prev) => [
              ...prev,
              {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                text: `${format} export failed — please try the Export menu in the header.`,
              },
            ]);
          } finally {
            setIsThinking(false);
          }
        }, 600);
        return;
      }

      // Metric-add → endpoint flow (apply or clarify). Other edits stay on
      // the existing in-place applyEdit path.
      if (isMetricRequest(trimmed)) {
        // 600ms artificial think so the bubble feels async like other replies
        setTimeout(() => { void handleMetricRequest(trimmed); }, 600);
        return;
      }

      setTimeout(() => {
        const result = applyEdit(activeDashboard, trimmed);
        const reply = result
          ? result.reply
          : "I'm not sure how to make that change yet. Try asking me to swap a chart type, change the date range, add a metric card, or adjust the layout.";

        if (result) {
          replaceDashboard(result.updated);
        }

        setMessages((prev) => [
          ...prev,
          { id: (Date.now() + 1).toString(), role: 'assistant', text: reply },
        ]);
        setIsThinking(false);
      }, 900);
    },
    [activeDashboard, isThinking, replaceDashboard, handleMetricRequest],
  );

  // Inline ClarificationCard confirm — applies the chosen metrics and marks
  // the card resolved so the user can't double-confirm.
  //
  // setActiveDashboard (used by replaceDashboard) lives on a different
  // component (DashboardBuilderProvider). Calling it from inside another
  // component's setState updater triggers React's
  // "setState during render" warning. Resolve the message + dashboard data
  // up front and call the two setters serially at the top level instead.
  const handleClarifyConfirm = useCallback((messageId: string, selectedLabels: string[]) => {
    if (!activeDashboard) return;
    const msg = messages.find((m) => m.id === messageId);
    if (!msg?.clarify) return;
    const resolved = resolveMetrics(msg.clarify.scope, selectedLabels);
    const updatedDashboard = applyMetricsToDashboard(activeDashboard, resolved);
    const labelText = resolved.map((r) => r.label).join(' and ');
    replaceDashboard(updatedDashboard);
    setMessages((prev) => [
      ...prev.map((m) => (m.id === messageId ? { ...m, resolved: true } : m)),
      { id: (Date.now() + 2).toString(), role: 'assistant', text: `Added ${labelText} to the metrics row.` },
    ]);
  }, [activeDashboard, messages, replaceDashboard]);

  const handleClarifyCancel = useCallback((messageId: string) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === messageId ? { ...m, resolved: true } : m)),
    );
  }, []);

  return (
    <aside style={{
      flex: '0 0 340px',
      width: 340,
      borderLeft: '1px solid var(--border)',
      background: 'var(--surface)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      boxShadow: '-4px 0 20px rgba(0,0,0,0.02)',
    }}>
      {/* Header */}
      <div style={{
        padding: '14px 16px',
        borderBottom: '1px solid var(--border)',
        background: 'linear-gradient(180deg, rgba(91,106,240,0.04) 0%, transparent 100%)',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 2 }}>
          <span style={{
            width: 7, height: 7, borderRadius: '50%',
            background: 'rgba(91,106,240,0.8)',
            boxShadow: '0 0 0 3px rgba(91,106,240,0.15)',
            flexShrink: 0,
          }} />
          <span style={{
            fontSize: 12, fontWeight: 700,
            fontFamily: 'var(--display)', color: 'var(--text)',
            letterSpacing: '0.02em',
          }}>
            Kai — Dashboard Editor
          </span>
        </div>
        <p style={{ margin: 0, fontSize: 11.5, color: 'var(--text2)', fontFamily: 'var(--sans)', lineHeight: 1.5 }}>
          Editing <strong>{activeDashboard?.title ?? 'dashboard'}</strong>
        </p>
      </div>

      {/* Messages + starter chips scroll; input is pinned below. */}
      <div
        ref={scrollRef}
        style={{ flex: 1, overflowY: 'auto', padding: '14px 14px 14px', display: 'flex', flexDirection: 'column', gap: 10, minHeight: 0 }}
      >
        {messages.map((msg) => {
          if (msg.clarify) {
            const catalogEntries = resolveMetrics(msg.clarify.scope, msg.clarify.candidates);
            const options: ClarificationOption[] = catalogEntries.map((m) => ({
              value: m.label,
              label: m.label,
              description: m.description,
            }));
            const handlers: WidgetActionHandlers = {
              onClarificationConfirm: (labels) => handleClarifyConfirm(msg.id, labels),
              onClarificationCancel: () => handleClarifyCancel(msg.id),
            };
            return (
              <div key={msg.id} style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <div style={{ width: '100%', opacity: msg.resolved ? 0.6 : 1, transition: 'opacity 200ms ease' }}>
                  <WidgetActionContext.Provider value={handlers}>
                    <ClarificationCard
                      data={{
                        prompt: msg.clarify.prompt,
                        context: msg.clarify.currentLabels.length > 0
                          ? `Already on the dashboard: ${msg.clarify.currentLabels.join(', ')}.`
                          : undefined,
                        options,
                        confirmLabel: 'Add to dashboard',
                        cancelLabel: 'Not now',
                      } as unknown as Record<string, unknown>}
                    />
                  </WidgetActionContext.Provider>
                </div>
              </div>
            );
          }
          return (
            <div
              key={msg.id}
              style={{
                display: 'flex',
                justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
              }}
            >
              <div style={{
                maxWidth: '88%',
                padding: msg.role === 'user' ? '7px 11px' : '8px 11px',
                borderRadius: msg.role === 'user' ? '10px 10px 2px 10px' : '10px 10px 10px 2px',
                background: msg.role === 'user' ? 'var(--primary-80)' : 'var(--surface2)',
                color: msg.role === 'user' ? '#fff' : 'var(--text)',
                fontSize: 12.5,
                fontFamily: 'var(--sans)',
                lineHeight: 1.55,
              }}>
                {msg.text}
              </div>
            </div>
          );
        })}

        {isThinking && (
          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <div style={{
              padding: '8px 12px',
              borderRadius: '10px 10px 10px 2px',
              background: 'var(--surface2)',
              display: 'flex', gap: 4, alignItems: 'center',
            }}>
              {[0, 1, 2].map((i) => (
                <span key={i} style={{
                  width: 5, height: 5, borderRadius: '50%',
                  background: 'var(--text3)',
                  animation: `kai-dot-bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
                }} />
              ))}
            </div>
          </div>
        )}

        {/* Starter chips — inline below seed message */}
        {messages.length === 1 && !isThinking && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, paddingTop: 4 }}>
            {EDIT_CHIPS.slice(0, 4).map((chip) => (
              <button
                key={chip.label}
                onClick={() => handleSend(chip.query)}
                style={{
                  padding: '4px 10px',
                  fontSize: 11.5,
                  fontFamily: 'var(--display)',
                  fontWeight: 500,
                  background: 'var(--surface2)',
                  color: 'var(--text2)',
                  border: '1px solid var(--border)',
                  borderRadius: 99,
                  cursor: 'pointer',
                  transition: 'all 150ms ease',
                  lineHeight: 1.6,
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(91,106,240,0.4)'; e.currentTarget.style.color = 'var(--text)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text2)'; }}
              >
                {chip.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Pinned input — stays visible regardless of scroll position */}
      <div style={{
        flexShrink: 0,
        borderTop: '1px solid var(--border)',
        background: 'var(--surface)',
        padding: '10px 14px 14px',
      }}>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(input); } }}
            placeholder={isThinking ? 'Kai is thinking…' : 'Ask Kai to edit this dashboard…'}
            disabled={isThinking}
            style={{
              flex: 1,
              height: 34,
              padding: '0 10px',
              background: 'var(--surface2)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              fontFamily: 'var(--sans)',
              fontSize: 12.5,
              color: 'var(--text)',
              outline: 'none',
              boxSizing: 'border-box',
              transition: 'border-color 150ms ease',
            }}
            onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(91,106,240,0.5)'; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; }}
          />
          <button
            onClick={() => handleSend(input)}
            disabled={isThinking || !input.trim()}
            style={{
              width: 34, height: 34, flexShrink: 0,
              background: 'var(--primary-80)',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 150ms ease',
              opacity: isThinking || !input.trim() ? 0.45 : 1,
            }}
            onMouseEnter={(e) => { if (!isThinking && input.trim()) e.currentTarget.style.background = 'var(--primary-70)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--primary-80)'; }}
          >
            <SendIcon />
          </button>
        </div>
      </div>

    </aside>
  );
}
