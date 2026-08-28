import type { ButtonHTMLAttributes, ReactNode } from 'react'
import './button.css'

type Variant = 'primary' | 'secondary' | 'ghost'
type Size = 'sm' | 'md' | 'lg'

export interface GlassButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  tone?: 'coral' | 'mint'
  block?: boolean
  loading?: boolean
  icon?: ReactNode
}

export function GlassButton({
  variant = 'secondary',
  size = 'md',
  tone = 'coral',
  block,
  loading,
  icon,
  children,
  className = '',
  disabled,
  ...rest
}: GlassButtonProps) {
  return (
    <button
      className={`gbtn gbtn-${variant} gbtn-${size}`
        + (tone === 'mint' ? ' gbtn-mint' : '')
        + (block ? ' gbtn-block' : '')
        + (loading ? ' is-loading' : '')
        + (className ? ` ${className}` : '')}
      aria-busy={loading || undefined}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? <span className="gbtn-spin" aria-hidden /> : icon}
      <span className="gbtn-label">{children}</span>
    </button>
  )
}
