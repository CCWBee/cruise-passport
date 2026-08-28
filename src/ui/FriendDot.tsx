import type { CSSProperties } from 'react'
import './fdot.css'

// Shared social atom: a coloured initial disc. Initials, never emoji (taste law).
export function FriendDot({ name, colour, size = 22 }: { name: string; colour: string; size?: number }) {
  return (
    <span
      className="fdot"
      title={name}
      style={{ '--fc': `var(--fruit-${colour})`, '--sz': `${size}px` } as CSSProperties}
    >
      {(name.trim()[0] || '?').toUpperCase()}
    </span>
  )
}
