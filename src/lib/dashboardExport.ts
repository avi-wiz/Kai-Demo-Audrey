/**
 * Dashboard export helpers — generates downloadable PDF and CSV from a
 * DashboardCompositeData payload. PDF embeds a rasterized snapshot of the
 * live DOM node so charts/highlights survive the export; CSV serializes the
 * structured tabular widgets (UW-002 metric rows + UW-004 data tables).
 */

import type { DashboardCompositeData, DashboardCell } from './types';
import { toPng } from 'html-to-image';

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'dashboard';
}

function triggerDownload(href: string, filename: string) {
  const link = document.createElement('a');
  link.href = href;
  link.download = filename;
  link.click();
}

// ── PNG capture (shared with PDF export) ─────────────────────────────────────

async function captureNodeAsPng(node: HTMLElement): Promise<{ dataUrl: string; width: number; height: number }> {
  // Reuse the same un-clip trick as DownloadSnapshotButton so horizontally
  // scrolling children (UW-002 metric rows when N > 4) capture fully.
  const overflowOverrides: { el: HTMLElement; overflowX: string; overflowY: string }[] = [];
  node.querySelectorAll<HTMLElement>('*').forEach((el) => {
    const cs = window.getComputedStyle(el);
    if (cs.overflowX === 'auto' || cs.overflowX === 'scroll') {
      overflowOverrides.push({ el, overflowX: el.style.overflowX, overflowY: el.style.overflowY });
      el.style.overflowX = 'visible';
      el.style.overflowY = 'visible';
    }
  });
  try {
    if (document.fonts?.ready) await document.fonts.ready;
    const width = Math.max(node.scrollWidth, node.offsetWidth);
    const height = Math.max(node.scrollHeight, node.offsetHeight);
    const dataUrl = await toPng(node, {
      pixelRatio: 2,
      cacheBust: true,
      backgroundColor: '#f0f2f5',
      skipFonts: true,
      width,
      height,
      filter: (el) => {
        if (!(el instanceof HTMLElement)) return true;
        return el.dataset.snapshotIgnore !== 'true';
      },
    });
    return { dataUrl, width, height };
  } finally {
    for (const o of overflowOverrides) {
      o.el.style.overflowX = o.overflowX;
      o.el.style.overflowY = o.overflowY;
    }
  }
}

// ── PDF export ───────────────────────────────────────────────────────────────

export async function exportDashboardAsPdf(
  dashboard: DashboardCompositeData,
  targetNode: HTMLElement,
): Promise<void> {
  // Import jspdf lazily so it doesn't pull into the main bundle.
  const { jsPDF } = await import('jspdf');
  const { dataUrl, width, height } = await captureNodeAsPng(targetNode);

  // A4 landscape gives the widest stage for grids. Convert px → pt at 96 DPI.
  // jsPDF default unit is mm. We'll work in mm with a landscape A4 (297×210).
  const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const pageWidth = pdf.internal.pageSize.getWidth(); // 297
  const pageHeight = pdf.internal.pageSize.getHeight(); // 210
  const margin = 10;
  const availW = pageWidth - margin * 2;
  const availH = pageHeight - margin * 2 - 18; // reserve header strip

  // Scale image to fit page while preserving aspect ratio.
  const aspect = width / height;
  let imgW = availW;
  let imgH = imgW / aspect;
  if (imgH > availH) {
    imgH = availH;
    imgW = imgH * aspect;
  }
  const imgX = (pageWidth - imgW) / 2;
  const imgY = margin + 14;

  // Header
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(14);
  pdf.setTextColor(46, 54, 67); // var(--text)
  pdf.text(dashboard.title, margin, margin + 6);
  if (dashboard.description) {
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    pdf.setTextColor(88, 100, 118); // var(--text2)
    pdf.text(dashboard.description, margin, margin + 11);
  }

  pdf.addImage(dataUrl, 'PNG', imgX, imgY, imgW, imgH, undefined, 'FAST');

  // Footer
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(136, 149, 169); // var(--text3)
  const iso = new Date().toISOString().slice(0, 10);
  pdf.text(`Exported by Kai · ${iso}`, margin, pageHeight - 6);

  const filename = `${slugify(dashboard.title)}-${iso}.pdf`;
  pdf.save(filename);
}

// ── CSV export ───────────────────────────────────────────────────────────────

function escapeCsvField(value: unknown): string {
  if (value === null || value === undefined) return '';
  const s = typeof value === 'string' ? value : String(value);
  // Wrap in quotes if the value contains a comma, quote, or newline.
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function rowsToCsv(rows: string[][]): string {
  return rows.map((cells) => cells.map(escapeCsvField).join(',')).join('\r\n');
}

interface DataTableData {
  title?: string;
  columns?: Array<{ key: string; label: string }>;
  rows?: Array<Record<string, unknown>>;
}

interface MetricCardRowData {
  cards?: Array<{ label: string; value: string; trend?: { direction?: string; percent?: number; period?: string } }>;
}

interface CompactListData {
  title?: string;
  items?: Array<Record<string, unknown>>;
}

function cellToCsvSection(cell: DashboardCell): string[][] {
  // Returns a 2D array (header + rows) for the cell, or [] if not serializable.
  if (cell.widgetType === 'UW-002') {
    const data = cell.data as unknown as MetricCardRowData;
    const cards = data.cards ?? [];
    if (cards.length === 0) return [];
    const out: string[][] = [];
    out.push(['Metric Row']);
    out.push(['Label', 'Value', 'Trend Direction', 'Trend %', 'Trend Period']);
    for (const c of cards) {
      out.push([
        c.label,
        c.value,
        c.trend?.direction ?? '',
        c.trend?.percent !== undefined ? String(c.trend.percent) : '',
        c.trend?.period ?? '',
      ]);
    }
    return out;
  }
  if (cell.widgetType === 'UW-004') {
    const data = cell.data as unknown as DataTableData;
    const cols = data.columns ?? [];
    const rows = data.rows ?? [];
    if (cols.length === 0) return [];
    const out: string[][] = [];
    if (data.title) out.push([data.title]);
    out.push(cols.map((c) => c.label));
    for (const r of rows) {
      out.push(cols.map((c) => {
        const v = r[c.key];
        return v === null || v === undefined ? '' : String(v);
      }));
    }
    return out;
  }
  if (cell.widgetType === 'UW-011') {
    const data = cell.data as unknown as CompactListData;
    const items = data.items ?? [];
    if (items.length === 0) return [];
    const keys = Array.from(new Set(items.flatMap((i) => Object.keys(i))));
    const out: string[][] = [];
    if (data.title) out.push([data.title]);
    out.push(keys);
    for (const item of items) {
      out.push(keys.map((k) => {
        const v = item[k];
        return v === null || v === undefined ? '' : String(v);
      }));
    }
    return out;
  }
  if (cell.widgetType === 'CH-001') {
    const data = cell.data as unknown as { title?: string; series?: Array<Record<string, unknown>> };
    const series = data.series ?? [];
    if (series.length === 0) return [];
    const keys = Object.keys(series[0]);
    const out: string[][] = [];
    if (data.title) out.push([data.title]);
    out.push(keys);
    for (const point of series) {
      out.push(keys.map((k) => {
        const v = point[k];
        return v === null || v === undefined ? '' : String(v);
      }));
    }
    return out;
  }
  return [];
}

export function exportDashboardAsCsv(dashboard: DashboardCompositeData): void {
  const sections: string[][][] = [];
  sections.push([[dashboard.title]]);
  if (dashboard.description) sections.push([[dashboard.description]]);
  for (const cell of dashboard.cells) {
    const rows = cellToCsvSection(cell);
    if (rows.length > 0) sections.push(rows);
  }
  // Join with blank-row separators between sections.
  const merged: string[][] = [];
  sections.forEach((section, i) => {
    if (i > 0) merged.push(['']);
    merged.push(...section);
  });
  const csv = rowsToCsv(merged);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const iso = new Date().toISOString().slice(0, 10);
  triggerDownload(url, `${slugify(dashboard.title)}-${iso}.csv`);
  // Revoke the URL after a tick — too early breaks the download on some browsers.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
