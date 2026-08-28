import './chip.css'

export function Chip({ label, count, on, disabled, onClick, tone }: {
  label: string
  count?: number
  on?: boolean
  disabled?: boolean
  onClick?: () => void
  tone?: 'coral'
}) {
  return (
    <button
      className={'chip pressable' + (on ? ' on' : '') + (tone === 'coral' ? ' coral' : '')}
      aria-pressed={!!on}
      disabled={disabled && !on}
      onClick={onClick}
    >
      {label}
      {count !== undefined && <span className="chip-c tnum">{count}</span>}
    </button>
  )
}
