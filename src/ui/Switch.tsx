import { useId } from 'react'
import './switch.css'

export interface SwitchProps {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
  labelId?: string
  hideLabel?: boolean
  tone?: 'mint' | 'coral'
  size?: 'sm' | 'md'
  disabled?: boolean
}

export function Switch({
  checked,
  onChange,
  label,
  labelId,
  hideLabel,
  tone = 'mint',
  size = 'md',
  disabled,
}: SwitchProps) {
  const generatedId = useId()
  const resolvedLabelId = labelId ?? `sw-label-${generatedId}`
  const toggle = () => {
    if (!disabled) onChange(!checked)
  }
  const control = (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={hideLabel ? label : undefined}
      aria-labelledby={!hideLabel ? resolvedLabelId : undefined}
      className={`sw sw-${size}` + (tone === 'coral' ? ' sw-coral' : '')}
      disabled={disabled}
      onClick={toggle}
      onKeyDown={(event) => {
        if (event.key === ' ' || event.key === 'Enter') {
          event.preventDefault()
          toggle()
        }
      }}
    >
      <span className="sw-track" aria-hidden />
      <span className="sw-knob" aria-hidden />
    </button>
  )

  if (hideLabel) return control
  return (
    <div className="sw-row">
      <span className="sw-row-label" id={resolvedLabelId}>{label}</span>
      {control}
    </div>
  )
}
