import './soon.css'

// Honest marker for features not wired up yet (dashed = work in progress, not final chrome).
export function Soon({ label = 'Coming soon' }: { label?: string }) {
  return <span className="soon-tag">{label}</span>
}
