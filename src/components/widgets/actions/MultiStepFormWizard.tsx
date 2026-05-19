'use client';

import { useState, useEffect, useRef } from 'react';
import type { WidgetProps, MultiStepFormData, MultiStepFormConfig, FormFieldSpec } from '@/lib/types';
import FormField from './FormField';

// TODO: multi-step navigation when steps.length > 1

export default function MultiStepFormWizard({ data: rawData, config: rawConfig }: WidgetProps) {
  const data = rawData as unknown as MultiStepFormData;
  const config = (rawConfig ?? {}) as unknown as MultiStepFormConfig;

  const isReview = config.mode !== 'edit';
  const step = data.steps[0];

  // Local field values for edit mode
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(step.fields.map((f) => [f.fieldId, f.value]))
  );

  const onValuesChange = (rawConfig as Record<string, unknown>)?.onValuesChange as ((values: Record<string, string>) => void) | undefined;

  const onValuesChangeRef = useRef(onValuesChange);
  onValuesChangeRef.current = onValuesChange;

  // Notify parent only after commit, so we never call setState on the parent
  // during this component's render phase.
  const isFirstRun = useRef(true);
  useEffect(() => {
    if (isFirstRun.current) {
      isFirstRun.current = false;
      return;
    }
    onValuesChangeRef.current?.(values);
  }, [values]);

  const handleChange = (fieldId: string, value: string) => {
    setValues((prev) => ({ ...prev, [fieldId]: value }));
  };

  const fullWidthTypes = new Set(['text', 'textarea']);
  const fullWidthIds = new Set(['title', 'description', 'notes']);

  function isFullWidth(field: FormFieldSpec): boolean {
    return fullWidthIds.has(field.fieldId) || fullWidthTypes.has(field.type);
  }

  return (
    <div style={{
      background: 'var(--surface)',
      border: `1px solid ${isReview ? 'var(--border)' : 'var(--ai-accent-border)'}`,
      borderRadius: 'var(--radius-card)',
      padding: 20,
      position: 'relative',
    }}>
      {/* Review Mode Overlay Hint */}
      {isReview && (
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.015)',
          pointerEvents: 'none',
          borderRadius: 'var(--radius-card)',
          zIndex: 1,
        }} />
      )}

      {/* Mode label */}
      <span style={{
        position: 'absolute',
        top: 14,
        right: 14,
        fontSize: 10,
        fontWeight: 600,
        textTransform: 'uppercase',
        color: isReview ? 'var(--ai-accent-text)' : 'var(--info-80)',
        background: isReview ? 'var(--ai-accent-bg)' : 'var(--badge-info-bg)',
        border: `1px solid ${isReview ? 'var(--ai-accent-border)' : 'var(--badge-info-border)'}`,
        borderRadius: 'var(--radius-badge)',
        padding: '2px 8px',
        fontFamily: 'var(--mono)',
        zIndex: 2,
      }}>
        {isReview ? 'Staged by Kai' : 'Editing'}
      </span>

      {/* Step title */}
      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 16, paddingRight: 100, fontFamily: 'var(--sans)', position: 'relative', zIndex: 2 }}>
        {step.stepTitle}
      </div>

      {/* Fields grid — CSS grid with column-span via wrapper divs */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: 14,
        position: 'relative',
        zIndex: 2,
      }}>
        {step.fields.map((field) => {
          const fieldValue = isReview ? field.value : (values[field.fieldId] ?? field.value);
          const resolvedId = ('resolvedId' in field) ? field.resolvedId : undefined;
          const options = ('options' in field) ? field.options : undefined;

          return (
            <div
              key={field.fieldId}
              style={{ gridColumn: isFullWidth(field) ? 'span 2' : 'span 1' }}
            >
              <FormField
                field={{ ...field, value: fieldValue, resolvedId, options }}
                disabled={isReview}
                onChange={isReview ? undefined : handleChange}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
