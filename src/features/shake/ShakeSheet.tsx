import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { VENUES } from '../../data/model'
import { pickedForYou, useSources } from '../../state/social'
import { useAllDrinks, useStore } from '../../state/store'
import { haptic } from '../../ui/haptic'
import { Sheet } from '../../ui/Sheet'
import { DrinkSheet } from '../drinks/DrinkSheet'
import { RECENT_KEPT, shake, type ShakeResult } from './pick'
import { startRattle, type Rattle } from './rattle'
import { Shaker, type ShakePhase } from './Shaker'
import './shake.css'

// The app's one moment of theatre, and the only place it is allowed: on demand, inside a sheet, for
// two seconds. The pick behind it is genuinely useful (untried, weighted by what the guest and their
// crew like) or the theatre would be the whole of it.

const SHAKE_MS = 1800   // the three phases, ending upright
const HOLD_MS = 300     // the anticipation beat, window still dark
const REDUCED_MS = 300  // no shake and no sound: long enough to read as an answer being found

const QUIET_KEY = 'spcc-shake-quiet'

const readQuiet = (): boolean => {
  try { return localStorage.getItem(QUIET_KEY) === '1' } catch { return false }
}
const writeQuiet = (quiet: boolean): void => {
  try {
    if (quiet) localStorage.setItem(QUIET_KEY, '1')
    else localStorage.removeItem(QUIET_KEY)
  } catch { /* storage blocked */ }
}
const reducedMotion = (): boolean => {
  try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches } catch { return false }
}

export function ShakeSheet({ onClose }: { onClose: () => void }) {
  const drinks = useAllDrinks()
  const me = useStore((s) => s.me)
  const srcs = useSources()
  const titleId = useId()
  const [phase, setPhase] = useState<ShakePhase>('idle')
  const [result, setResult] = useState<ShakeResult | null>(null)
  // this sitting's reveals, so the shaker does not say the same thing twice. Not persisted: a new
  // session is a new sitting, and the store has no business holding a list of what a button said.
  const [recent, setRecent] = useState<string[]>([])
  const [quiet, setQuiet] = useState(readQuiet)
  const [openDrink, setOpenDrink] = useState<string | null>(null)
  const [announce, setAnnounce] = useState('')
  // true when the window's two-line clamp cut the name, so the caption has to carry it
  const [clipped, setClipped] = useState(false)
  const nameRef = useRef<HTMLSpanElement>(null)
  const rattle = useRef<Rattle | null>(null)
  const timer = useRef(0)

  const picks = useMemo(() => pickedForYou(me, srcs), [me, srcs])

  const drink = useMemo(
    () => (result ? drinks.find((d) => d.id === result.id) : undefined),
    [result, drinks],
  )
  const venue = drink ? VENUES[drink.venue] : undefined
  // a drink at a venue prints the venue and its deck; one with no venue prints its category, which
  // is all that is true about where to find it
  const where = drink ? (venue ? `${venue.name} · Deck ${venue.deck}` : drink.category) : ''
  // What the two lines beneath the shaker say, spoken as one sentence: the middle dot is gone in
  // speech, so the deck needs its word back.
  const spoken = drink ? (venue ? `Try ${venue.name}'s ${drink.name}, Deck ${venue.deck}` : `Try ${drink.name}`) : ''

  // The region is mounted empty and filled a frame after the reveal: a live region inserted already
  // holding its text is unreliably announced by VoiceOver and NVDA (ui/Confirm.tsx says the same).
  useEffect(() => {
    if (!spoken) return
    const frame = requestAnimationFrame(() => setAnnounce(spoken))
    return () => cancelAnimationFrame(frame)
  }, [spoken])

  // The window holds two lines and no more, and seventeen of the sailing's names are longer than
  // that. Measured rather than guessed, and measured on the paint: a name that fits is not repeated
  // under the shaker, because the answer would then say the same thing twice. The 1px of tolerance
  // keeps a name that exactly fills the box off the caption.
  useLayoutEffect(() => {
    const el = nameRef.current
    if (phase !== 'revealed' || !el) { setClipped(false); return }
    setClipped(el.scrollHeight > el.clientHeight + 1)
  }, [phase, result?.id])

  useEffect(() => () => {
    window.clearTimeout(timer.current)
    rattle.current?.stop()
  }, [])

  const press = () => {
    const pick = shake({ drinks, entries: me.entries, forYou: picks.map((p) => ({ id: p.drink.id, reason: p.reason })), recent, random: Math.random })
    // nothing to shake: the row on Home is hidden in that case, so this is the defence behind it
    if (!pick) return
    // one pattern, not a tap and then a series: on Android a second vibrate() replaces the first,
    // and this one opens with the press tap anyway
    haptic('shake')
    window.clearTimeout(timer.current)
    rattle.current?.stop()
    rattle.current = startRattle(quiet)
    setAnnounce('')
    setResult(null)
    setPhase('shaking')
    timer.current = window.setTimeout(() => {
      rattle.current?.reveal()
      haptic('success')
      setResult(pick)
      setPhase('revealed')
      setRecent((r) => [...r, pick.id].slice(-RECENT_KEPT))
      // no Confirm tick: the answer is on the screen, which is DESIGN.md's own test for when a
      // confirmation is owed and when it is noise
    }, reducedMotion() ? REDUCED_MS : SHAKE_MS + HOLD_MS)
  }

  const toggleQuiet = () => {
    const next = !quiet
    setQuiet(next)
    writeQuiet(next)
  }

  // The drink sheet replaces this one rather than stacking on it: a sheet over a sheet is glass on
  // glass, which DESIGN.md Material forbids. Closing it returns to the reveal, not to Home, so the
  // guest can shake again from where they were.
  if (openDrink) return <DrinkSheet id={openDrink} onClose={() => setOpenDrink(null)} onOpen={setOpenDrink} />

  const label = phase === 'shaking' ? 'Shaking'
    : phase === 'revealed' ? (result?.allTried ? 'Go again' : 'Go get it')
      : 'Shake'

  return (
    <Sheet onClose={onClose} labelledBy={titleId}>
      <div className="shake">
        <h2 className="t-title sheet-title" id={titleId}>Shake</h2>
        <p className="sheet-meta">The shaker picks one you have not tried.</p>

        <div className="shake-body">
          <Shaker phase={phase} />

          {result && drink && (
            <div className="shake-answer">
              {/* the name only when the window could not hold it: the one job of this moment is to
                  name a drink, and a clipped name does not */}
              {clipped && <p className="t-strong">{drink.name}</p>}
              <p className="t-meta tnum">{where}</p>
              <p className="t-body">{result.reason}</p>
            </div>
          )}

          <button
            type="button"
            className="btn btn-coral btn-wide pressable shake-go"
            disabled={phase === 'shaking'}
            onClick={() => (phase === 'revealed' && result ? setOpenDrink(result.id) : press())}
          >
            {label}
          </button>

          <div className="shake-quiets">
            {phase === 'revealed' && (
              <button type="button" className="quiet-action" onClick={press}>Shake again</button>
            )}
            <button type="button" className="quiet-action" onClick={toggleQuiet}>
              {/* the label states the action, not the state, as every other quiet action does */}
              {quiet ? 'Shake with sound' : 'Shake quietly'}
            </button>
          </div>
        </div>

        <p className="sr-only" aria-live="polite">{announce}</p>
      </div>
    </Sheet>
  )
}
