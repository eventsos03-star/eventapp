import type { InputHTMLAttributes } from 'react'

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  hint?: string
}

export function Field({ label, error, hint, id, ...props }: FieldProps) {
  const fieldId =
    id ?? `field-${props.name ?? label.toLowerCase().replace(/\s+/g, '-')}`
  return (
    <div className="field">
      <label htmlFor={fieldId}>{label}</label>
      <input
        id={fieldId}
        className={error ? 'input-error' : undefined}
        aria-invalid={!!error}
        {...props}
      />
      {hint && !error && <span className="field-hint">{hint}</span>}
      {error && (
        <span className="field-error" role="alert">
          {error}
        </span>
      )}
    </div>
  )
}
