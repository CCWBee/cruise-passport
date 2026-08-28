import type { InputHTMLAttributes, TextareaHTMLAttributes } from 'react'
import './field.css'

interface FieldBase {
  label: string
  id: string
  hint?: string
  error?: string
  className?: string
}

export interface TextFieldProps extends FieldBase, Omit<InputHTMLAttributes<HTMLInputElement>, keyof FieldBase> {}
export interface TextAreaProps extends FieldBase, Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, keyof FieldBase> {}
export interface NumberFieldProps extends FieldBase, Omit<InputHTMLAttributes<HTMLInputElement>, keyof FieldBase> {}

function FieldHelp({ id, hint, error }: Pick<FieldBase, 'id' | 'hint' | 'error'>) {
  if (error) return <span className="field-hint field-err" id={`${id}-err`}>{error}</span>
  if (hint) return <span className="field-hint" id={`${id}-hint`}>{hint}</span>
  return null
}

function helpId(id: string, hint?: string, error?: string) {
  return error ? `${id}-err` : hint ? `${id}-hint` : undefined
}

export function TextField({ label, id, hint, error, className = '', ...rest }: TextFieldProps) {
  return (
    <div className={`field${className ? ` ${className}` : ''}`}>
      <label className="field-label eyebrow" htmlFor={id}>{label}</label>
      <input
        id={id}
        className="field-ctrl"
        aria-invalid={!!error || undefined}
        aria-describedby={helpId(id, hint, error)}
        {...rest}
      />
      <FieldHelp id={id} hint={hint} error={error} />
    </div>
  )
}

export function TextArea({ label, id, hint, error, className = '', ...rest }: TextAreaProps) {
  return (
    <div className={`field${className ? ` ${className}` : ''}`}>
      <label className="field-label eyebrow" htmlFor={id}>{label}</label>
      <textarea
        id={id}
        className="field-ctrl"
        aria-invalid={!!error || undefined}
        aria-describedby={helpId(id, hint, error)}
        {...rest}
      />
      <FieldHelp id={id} hint={hint} error={error} />
    </div>
  )
}

export function NumberField({ label, id, hint, error, className = '', ...rest }: NumberFieldProps) {
  return (
    <div className={`field${className ? ` ${className}` : ''}`}>
      <label className="field-label eyebrow" htmlFor={id}>{label}</label>
      <input
        {...rest}
        id={id}
        type="number"
        className="field-ctrl tnum"
        aria-invalid={!!error || undefined}
        aria-describedby={helpId(id, hint, error)}
      />
      <FieldHelp id={id} hint={hint} error={error} />
    </div>
  )
}
