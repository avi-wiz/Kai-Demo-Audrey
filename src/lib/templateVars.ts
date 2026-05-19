import type { ParsedWidget } from '@/components/engine/FrameParser';

// ── Variable extraction ───────────────────────────────────────────────────────
//
// Walks the most-recently-rendered widgets and builds a flat map of
// { variableName: value } that chip queries can reference as {variableName}.
//
// Supported variables and their sources:
//   {customerName}  — UW-007.data.displayName  | UW-003 field "Customer"
//   {contactName}   — UW-007.data.contactPerson | UW-003 field "Contact"
//   {orderId}       — UW-003.data.title (when entityType=order) | UW-004 first row "order" key
//   {fromRep}       — UW-007.data.assignedRep
//   {toRep}         — UW-003 field "Assigned To" | UW-011 first item assignedTo

export type TemplateVars = Record<string, string>;

function fieldValue(fields: Array<{ label?: string; value?: string }>, label: string): string | undefined {
  return fields.find((f) => f.label?.toLowerCase() === label.toLowerCase())?.value;
}

export function extractTemplateVars(widgets: ParsedWidget[]): TemplateVars {
  const vars: TemplateVars = {};

  for (const widget of widgets) {
    const data = widget.data as Record<string, unknown>;

    // ── UW-007 Customer360Card ──────────────────────────────────────────────
    if (widget.widgetType === 'UW-007') {
      if (typeof data.displayName === 'string') vars.customerName = data.displayName;
      if (typeof data.contactPerson === 'string') vars.contactName = data.contactPerson;
      if (typeof data.assignedRep === 'string') {
        vars.fromRep = data.assignedRep;
        // toRep stays unset until an explicit reassign context sets it
      }
    }

    // ── UW-003 EntityDetailCard ─────────────────────────────────────────────
    if (widget.widgetType === 'UW-003') {
      const fields = Array.isArray(data.fields)
        ? (data.fields as Array<{ label?: string; value?: string }>)
        : [];
      const entityType = typeof data.entityType === 'string' ? data.entityType : '';
      const title = typeof data.title === 'string' ? data.title : '';

      if (entityType === 'customer') {
        if (!vars.customerName) vars.customerName = title;
        const contact = fieldValue(fields, 'contact') ?? fieldValue(fields, 'contact person');
        if (contact && !vars.contactName) vars.contactName = contact;
      }

      if (entityType === 'order') {
        // title is usually "ORD-xxxx — Customer Name"
        const orderIdMatch = title.match(/^(ORD-\d+)/);
        if (orderIdMatch) vars.orderId = orderIdMatch[1];
        const customer = fieldValue(fields, 'customer');
        if (customer && !vars.customerName) vars.customerName = customer;
        const rep = fieldValue(fields, 'rep');
        if (rep && !vars.fromRep) vars.fromRep = rep;
      }

      if (entityType === 'handoff') {
        const fromRep = fieldValue(fields, 'from rep');
        const toRep = fieldValue(fields, 'to rep');
        // Strip trailing "(U-xxxx)" id suffix if present
        const clean = (v?: string) => v?.replace(/\s*\([A-Z]-\d+\)\s*$/, '').trim();
        const cleanedFrom = clean(fromRep);
        const cleanedTo = clean(toRep);
        if (cleanedFrom) vars.fromRep = cleanedFrom;
        if (cleanedTo) vars.toRep = cleanedTo;
      }

      if (entityType === 'deal') {
        const customer = fieldValue(fields, 'customer');
        if (customer && !vars.customerName) vars.customerName = customer;
        const rep = fieldValue(fields, 'rep');
        if (rep && !vars.fromRep) vars.fromRep = rep;
      }

      // Generic: "Assigned To" → toRep if fromRep already set, else fromRep
      const assignedTo = fieldValue(fields, 'assigned to');
      if (assignedTo) {
        if (!vars.fromRep) vars.fromRep = assignedTo;
        else if (!vars.toRep) vars.toRep = assignedTo;
      }
    }

    // ── UW-004 DataTable ────────────────────────────────────────────────────
    if (widget.widgetType === 'UW-004') {
      const rows = Array.isArray(data.rows) ? (data.rows as Record<string, unknown>[]) : [];
      const first = rows[0];
      if (first) {
        if (typeof first.order === 'string' && !vars.orderId) vars.orderId = first.order;
        if (typeof first.customer === 'string' && !vars.customerName) vars.customerName = first.customer;
        if (typeof first.rep === 'string' && !vars.fromRep) vars.fromRep = first.rep;
      }
    }

    // ── UW-011 CompactList ──────────────────────────────────────────────────
    if (widget.widgetType === 'UW-011') {
      const items = Array.isArray(data.items) ? (data.items as Record<string, unknown>[]) : [];
      const first = items[0];
      if (first) {
        if (typeof first.assignedTo === 'string' && !vars.fromRep) vars.fromRep = first.assignedTo;
      }
    }
  }

  return vars;
}

// ── Query template resolution ─────────────────────────────────────────────────

export function resolveChipQuery(query: string, vars: TemplateVars): string {
  return query.replace(/\{(\w+)\}/g, (match, key) => vars[key] ?? match);
}
