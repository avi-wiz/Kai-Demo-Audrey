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
  const isTask = fields.some((f) => f.fieldId === 'title') && fields.some((f) => f.fieldId === 'assignee');
  const customer = fields.find((f) => f.fieldId === 'customer')?.value;

  let title: string;
  let message: string;

  if (isOrder) {
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
      const d = new Date(dueDate + 'T00:00:00');
      parts.push(`due ${d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`);
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
