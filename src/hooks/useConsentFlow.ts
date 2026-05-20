'use client';

import { useState, useCallback, useRef } from 'react';
import type { ConsentState } from '@/lib/types';
import type { ParsedWidget } from '@/components/engine/FrameParser';
import { resolveWidget } from '@/components/engine/ComponentRegistry';

export interface FormField {
  fieldId: string;
  label: string;
  value: string;
  type?: string;
}

export interface ConsentFlowResult {
  consentState: ConsentState;
  isConfirming: boolean;
  formMode: 'review' | 'edit';
  confirmedWidgets: ParsedWidget[];
  onConfirm: () => void;
  onEdit: () => void;
  onCancel: () => void;
  onResetEdit: () => void;
}

export interface ConsentFlowOptions {
  /** Called once when confirmation completes — use to write to SharedContext */
  onConfirmed?: (fields: FormField[]) => void;
  /** Deep-link label + route for the confirmation widget. Defaults to 'View Task' → crm route. */
  deepLink?: { label: string; route: string };
}

function buildConfirmationWidget(
  turnId: string,
  fields: FormField[],
  deepLink?: { label: string; route: string },
): ParsedWidget {
  const isOrder = fields.some((f) => f.fieldId === 'subtotal');
  // Cap 3 — customer conversion (form has taxId, no subtotal).
  const isCustomerConversion = fields.some((f) => f.fieldId === 'taxId') && !isOrder;
  // Cap 4 — merge (form has mergeTarget).
  const isMerge = fields.some((f) => f.fieldId === 'mergeTarget');
  // Cap 5 — user creation (form has username).
  const isUser = fields.some((f) => f.fieldId === 'username');
  // Cap 6 — catalog (form has catalogName).
  const isCatalog = fields.some((f) => f.fieldId === 'catalogName');
  // Cap 2 — lead (form has company + source, no order/task markers).
  const isLead =
    fields.some((f) => f.fieldId === 'company') &&
    fields.some((f) => f.fieldId === 'source') &&
    !isOrder &&
    !isCustomerConversion;
  const isTask =
    fields.some((f) => f.fieldId === 'title') &&
    fields.some((f) => f.fieldId === 'assignee') &&
    !isLead &&
    !isUser &&
    !isCatalog &&
    !isCustomerConversion;
  const customer = fields.find((f) => f.fieldId === 'customer')?.value;

  let title: string;
  let message: string;

  if (isCustomerConversion) {
    const company = fields.find((f) => f.fieldId === 'company')?.value
      ?? fields.find((f) => f.fieldId === 'businessName')?.value;
    const pricelist = fields.find((f) => f.fieldId === 'pricelist')?.value;
    const rep = fields.find((f) => f.fieldId === 'assignedRep')?.value
      ?? fields.find((f) => f.fieldId === 'rep')?.value;
    const parts: string[] = ['Customer created'];
    if (company) parts.push(`for ${company}`);
    if (pricelist) parts.push(`pricelist ${pricelist}`);
    if (rep) parts.push(`rep ${rep}`);
    title = 'Customer Created';
    message = parts.join(', ') + '.';
  } else if (isMerge) {
    const target = fields.find((f) => f.fieldId === 'mergeTarget')?.value;
    const parts: string[] = ['Records merged'];
    if (target) parts.push(`into ${target}`);
    title = 'Merge Complete';
    message = parts.join(', ') + '.';
  } else if (isUser) {
    const username = fields.find((f) => f.fieldId === 'username')?.value;
    const company = fields.find((f) => f.fieldId === 'company')?.value
      ?? fields.find((f) => f.fieldId === 'businessName')?.value;
    const pricelist = fields.find((f) => f.fieldId === 'pricelist')?.value;
    const parts: string[] = ['Website user created'];
    if (username) parts.push(`username ${username}`);
    if (company) parts.push(`for ${company}`);
    if (pricelist) parts.push(`pricelist ${pricelist}`);
    title = 'Website User Created';
    message = parts.join(', ') + '.';
  } else if (isCatalog) {
    const name = fields.find((f) => f.fieldId === 'catalogName')?.value;
    const recipient = fields.find((f) => f.fieldId === 'recipient')?.value
      ?? fields.find((f) => f.fieldId === 'lead')?.value
      ?? fields.find((f) => f.fieldId === 'customer')?.value;
    const itemCount = fields.find((f) => f.fieldId === 'itemCount')?.value;
    const parts: string[] = ['Catalog saved'];
    if (name) parts[0] = `Catalog '${name}' saved`;
    if (recipient) parts.push(`for ${recipient}`);
    if (itemCount) parts.push(`${itemCount} items`);
    title = 'Catalog Saved';
    message = parts.join(', ') + '.';
  } else if (isLead) {
    const company = fields.find((f) => f.fieldId === 'company')?.value;
    const contact = fields.find((f) => f.fieldId === 'contact')?.value;
    const assignee = fields.find((f) => f.fieldId === 'assignee')?.value;
    const parts: string[] = ['Lead created'];
    if (company) parts[0] = `Lead '${company}' created`;
    if (contact) parts.push(`contact ${contact}`);
    if (assignee) parts.push(`assigned to ${assignee}`);
    title = 'Lead Created';
    message = parts.join(', ') + '.';
  } else if (isOrder) {
    const subtotal = fields.find((f) => f.fieldId === 'subtotal')?.value ?? '';
    const items = fields.find((f) => f.fieldId === 'items')?.value ?? '';
    const itemCount = items ? items.split(',').length : 0;
    // Sum unit quantities from `× N` markers (Unicode × U+00D7 or ASCII x).
    const unitMatches = items.match(/[×x]\s*(\d+)/gi) ?? [];
    const unitTotal = unitMatches.reduce((sum, m) => sum + Number(m.replace(/[^0-9]/g, '')), 0);
    const deliveryDate = fields.find((f) => f.fieldId === 'deliveryDate')?.value;
    const rep = fields.find((f) => f.fieldId === 'rep')?.value;

    const parts: string[] = ['Order created'];
    if (customer) parts.push(`for ${customer}`);
    if (itemCount) {
      const lineFrag = `${itemCount} line item${itemCount > 1 ? 's' : ''}`;
      parts.push(unitTotal > 0 ? `${lineFrag} (${unitTotal} units)` : lineFrag);
    }
    if (subtotal) parts.push(`total ${subtotal}`);
    if (deliveryDate) {
      const d = new Date(deliveryDate + 'T00:00:00');
      parts.push(`delivery ${d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`);
    }
    if (rep) parts.push(`rep ${rep}`);

    title = 'Order Created';
    message = parts.join(', ') + '.';
  } else if (isTask) {
    const taskTitle = fields.find((f) => f.fieldId === 'title')?.value ?? 'Task';
    const assignee = fields.find((f) => f.fieldId === 'assignee')?.value;
    const dueDate = fields.find((f) => f.fieldId === 'dueDate')?.value;

    const parts: string[] = [`Task '${taskTitle}' created`];
    if (customer) parts.push(`for ${customer}`);
    if (assignee) parts.push(`assigned to ${assignee}`);
    if (dueDate) {
      // Accept both ISO ("2026-05-22") and display ("May 22, 2026") formats.
      const isISO = /^\d{4}-\d{2}-\d{2}$/.test(dueDate);
      const d = isISO ? new Date(dueDate + 'T00:00:00') : new Date(dueDate);
      const formatted = isNaN(d.getTime())
        ? dueDate
        : d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
      parts.push(`due ${formatted}`);
    }

    title = 'Task Created';
    message = parts.join(', ') + '.';
  } else {
    // Generic capability confirmation (e.g. ad29-workflow activation).
    const wfName =
      fields.find((f) => f.fieldId === 'workflowName')?.value ??
      fields.find((f) => f.fieldId === 'name')?.value;
    title = wfName ? `${wfName} Activated` : 'Action Confirmed';
    const parts: string[] = ['Action confirmed'];
    if (wfName) parts[0] = `${wfName} activated`;
    if (customer) parts.push(`for ${customer}`);
    message = parts.join(', ') + '.';
  }

  const dl =
    deepLink ??
    (isOrder
      ? { label: 'View in Orders', route: 'wizorder/orders' }
      : isCustomerConversion || isMerge
        ? { label: 'View in Customers', route: 'wizorder/customers' }
        : isLead
          ? { label: 'View in CRM', route: 'wizorder/crm' }
          : isUser
            ? { label: 'View Website Users', route: 'wizorder/customers' }
            : isCatalog
              ? { label: 'View in My Catalogs', route: 'wizorder/products' }
              : isTask
                ? { label: 'View in CRM', route: 'wizorder/crm' }
                : null);

  return {
    key: `${turnId}:confirmed:aw003`,
    widgetType: 'AW-003',
    Component: resolveWidget('AW-003'),
    data: {
      status: 'success',
      title,
      message,
      ...(dl ? { entityLink: { label: dl.label, url: dl.route } } : {}),
    },
    config: {},
    frameId: `${turnId}:confirmed`,
    frameType: 'result',
  };
}

export function useConsentFlow(turnId: string, formFields?: FormField[], options?: ConsentFlowOptions): ConsentFlowResult {
  const [consentState, setConsentState] = useState<ConsentState>('staged');
  const [isConfirming, setIsConfirming] = useState(false);
  const [formMode, setFormMode] = useState<'review' | 'edit'>('review');
  const [confirmedWidgets, setConfirmedWidgets] = useState<ParsedWidget[]>([]);

  // Always holds the latest formFields so onConfirm never captures a stale snapshot
  const formFieldsRef = useRef(formFields);
  formFieldsRef.current = formFields;

  const optionsRef = useRef(options);
  optionsRef.current = options;

  const onConfirm = useCallback(() => {
    if (consentState !== 'staged' && consentState !== 'editing') return;
    setIsConfirming(true);

    setTimeout(() => {
      const fields = formFieldsRef.current ?? [];
      const opts = optionsRef.current;
      if (opts?.onConfirmed) opts.onConfirmed(fields);
      const widget = buildConfirmationWidget(turnId, fields, opts?.deepLink);
      setConfirmedWidgets([widget]);
      setConsentState('confirmed');
      setIsConfirming(false);
    }, 300);
  }, [consentState, turnId]);

  const onEdit = useCallback(() => {
    setConsentState('editing');
    setFormMode('edit');
  }, []);

  const onCancel = useCallback(() => {
    setConsentState('cancelled');
  }, []);

  const onResetEdit = useCallback(() => {
    setConsentState('staged');
    setFormMode('review');
  }, []);

  return {
    consentState,
    isConfirming,
    formMode,
    confirmedWidgets,
    onConfirm,
    onEdit,
    onCancel,
    onResetEdit,
  };
}
