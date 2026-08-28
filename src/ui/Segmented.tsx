import type { CSSProperties } from 'react'
import './segmented.css'

export interface SegOption<T extends string> { value: T; label: string; count?: number; disabled?: boolean }

export function Segmented<T extends string>({ options, value, onChange, ariaLabel }: {
  options: SegOption<T>[]
  value: T
  onChange: (v: T) => void
  ariaLabel: string
}) {
  const idx = Math.max(0, options.findIndex((o) => o.value === value))
  return (
    <div className="seg" role="radiogroup" aria-label={ariaLabel}>
      <div className="seg-thumb" style={{ '--n': options.length, '--i': idx } as CSSProperties} aria-hidden />
      {options.map((o) => (
        <button
          key={o.value}
          role="radio"
          aria-checked={o.value === value}
          disabled={o.disabled && o.value !== value}
          className={'seg-btn' + (o.value === value ? ' on' : '')}
          onClick={() => onChange(o.value)}
        >
          {o.label}
          {o.count !== undefined && <span className="seg-c tnum">{o.count}</span>}
        </button>
      ))}
    </div>
  )
}
