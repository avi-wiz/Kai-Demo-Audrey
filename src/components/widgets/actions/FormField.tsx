'use client';

export interface FormFieldProps {
  field: {
    fieldId: string;
    type: string;
    label: string;
    value: string;
    options?: string[];
    required?: boolean;
    resolvedId?: string;
  };
  disabled?: boolean;
  onChange?: (fieldId: string, value: string) => void;
}

const inputBase: React.CSSProperties = {
  width: '100%',
  height: 38,
  padding: '0 12px',
  fontSize: 13,
  borderRadius: 'var(--radius-inner)',
  border: '1px solid var(--border)',
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'var(--transition-fast)',
  fontFamily: 'var(--sans)',
};

const inputEnabled: React.CSSProperties = {
  ...inputBase,
  background: 'var(--surface2)',
  color: 'var(--text)',
  cursor: 'text',
};

const inputDisabled: React.CSSProperties = {
  ...inputBase,
  background: 'var(--surface2)',
  color: 'var(--text2)',
  cursor: 'not-allowed',
  opacity: 0.7,
};

export default function FormField({ field, disabled = false, onChange }: FormFieldProps) {
  const style = disabled ? inputDisabled : inputEnabled;
  const handleChange = (val: string) => onChange?.(field.fieldId, val);

  const isResolved = (field.type === 'entity_search' || field.type === 'user_search') && field.resolvedId;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {/* Label */}
      <label style={{
        fontSize: 10.5,
        fontWeight: 600,
        color: 'var(--text3)',
        textTransform: 'uppercase',
        letterSpacing: '0.4px',
        display: 'flex',
        alignItems: 'center',
        gap: 3,
        fontFamily: 'var(--sans)',
        marginBottom: 4,
      }}>
        {field.label}
        {field.required && <span style={{ color: 'var(--error-80)', fontWeight: 700 }}>*</span>}
      </label>

      {/* Input */}
      {field.type === 'select' ? (
        <select
          value={field.value}
          disabled={disabled}
          onChange={(e) => handleChange(e.target.value)}
          style={{ ...style, height: 38 }}
        >
          {field.options?.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      ) : field.type === 'textarea' ? (
        <textarea
          value={field.value}
          disabled={disabled}
          rows={3}
          onChange={(e) => handleChange(e.target.value)}
          style={{ ...style, height: 'auto', padding: '9px 12px', resize: 'vertical' }}
        />
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input
            type={field.type === 'date' ? 'date' : 'text'}
            value={field.value}
            disabled={disabled}
            onChange={(e) => handleChange(e.target.value)}
            style={{ ...style, flex: 1 }}
            onFocus={(e) => {
              if (!disabled) {
                e.currentTarget.style.borderColor = 'var(--ai-accent-border)';
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(91, 106, 240, 0.1)';
              }
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = 'var(--border)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          />
          {isResolved && (
            <span style={{
              flexShrink: 0,
              fontSize: 10,
              fontWeight: 600,
              color: 'var(--badge-success-text)',
              background: 'var(--badge-success-bg)',
              border: '1px solid var(--badge-success-border)',
              borderRadius: 'var(--radius-badge)',
              padding: '2px 7px',
              fontFamily: 'var(--mono)',
            }}>
              {field.resolvedId}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
