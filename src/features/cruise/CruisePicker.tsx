import { CRUISES } from '../../data/cruises'
import { useStore } from '../../state/store'
import { GlassButton } from '../../ui/GlassButton'
import './cruise.css'

function prettyRange(start: string, end: string): string {
  const s = new Date(`${start}T12:00:00`)
  const e = new Date(`${end}T12:00:00`)
  const sameMonth = s.getMonth() === e.getMonth() && s.getFullYear() === e.getFullYear()
  return sameMonth
    ? `${s.getDate()} to ${e.getDate()} ${e.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}`
    : `${s.toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })} to ${e.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}`
}

// First-run landing. Choosing a cruise opens its passport and keeps you in it until it is over.
// One cruise today; the list generalises to more.
export function CruisePicker() {
  const enterCruise = useStore((s) => s.enterCruise)
  return (
    <>
      <div className="ground" aria-hidden />
      <div className="cruise-gate">
        <div className="wrap cruise-gate-in">
          <header className="cruise-hero">
            <div className="eyebrow">Cocktail Passport</div>
            <h1 className="t-title cruise-hero-title">Choose your voyage</h1>
            <p className="muted t-body">Pick your sailing to open its passport. It stays open until the cruise is over.</p>
          </header>

          <div className="cruise-list">
            {CRUISES.map((cruise) => (
              <div key={cruise.id} className="glass card cruise-card">
                <div className="cruise-card-body">
                  <div className="eyebrow">{cruise.line}</div>
                  <h2 className="t-title cruise-card-ship">{cruise.ship}</h2>
                  <p className="muted t-meta tnum">{prettyRange(cruise.start, cruise.end)}</p>
                </div>
                <GlassButton variant="primary" onClick={() => enterCruise(cruise.id)}>Enter</GlassButton>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
