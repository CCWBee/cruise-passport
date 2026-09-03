import type { ReactNode } from 'react'
import { IconClose, IconSearch } from './Icon'
import './search.css'

export interface SearchFieldProps {
  value: string
  onChange: (v: string) => void
  ariaLabel: string
  placeholder?: string
  trailing?: ReactNode
}

export function SearchField({ value, onChange, ariaLabel, placeholder, trailing }: SearchFieldProps) {
  return (
    <div className="sfield">
      <span className="sfield-icon" aria-hidden><IconSearch size={19} /></span>
      <input
        className="sfield-input"
        type="search"
        inputMode="search"
        value={value}
        placeholder={placeholder}
        aria-label={ariaLabel}
        onChange={(event) => onChange(event.target.value)}
      />
      {value && (
        <button
          className="sfield-clear pressable"
          type="button"
          aria-label="Clear search"
          onClick={() => onChange('')}
        >
          <IconClose size={15} />
        </button>
      )}
      {trailing}
    </div>
  )
}
