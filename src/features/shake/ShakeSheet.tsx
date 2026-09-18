import { useEffect, useId, useMemo, useRef, useState } from 'react'
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
const HOLD_MS = 300     // the anticipation beat, the tin still shut
const SETTLE_MS = 580   // the lid at 0, the drop 60 behind it, its rise 520: the drop lands here
const CLOSE_MS = 240    // the lid back on and the drop back in, before a second shake
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
  // What the card beneath the shaker says, spoken as one sentence: the middle dot is gone in
  // speech, so the deck needs its word back. It waits for the drop to land, so the announcement and
  // the card arrive together rather than the reader hearing the answer while the lid is still going.
  const spoken = drink && phase === 'revealed'
    ? (venue ? `Try ${venue.name}'s ${drink.name}, Deck ${venue.deck}` : `Try ${drink.name}`)
    : ''

  // The region is mounted empty and filled a frame after the reveal: a live region inserted already
  // holding its text is unreliably announced by VoiceOver and NVDA (ui/Confirm.tsx says the same).
  useEffect(() => {
    if (!spoken) return
    const frame = requestAnimationFrame(() => setAnnounce(spoken))
    return () => cancelAnimationFrame(frame)
  }, [spoken])

  useEffect(() => () => {
    window.clearTimeout(timer.current)
    rattle.current?.stop()
  }, [])

  // The shake itself, from a shaker that is already shut.
  const run = (pick: ShakeResult) => {
    // one pattern, not a tap and then a series: on Android a second vibrate() replaces the first,
    // and this one opens with the press tap anyway
    haptic('shake')
    rattle.current = startRattle(quiet)
    setPhase('shaking')
    const reduced = reducedMotion()
    timer.current = window.setTimeout(() => {
      // the lid goes here, and the cork with it. The result is set at the same moment, so the sheet
      // takes the card's height while the lid is flipping; the card itself is held back in CSS to
      // the drop's landing, which is the one thing that would jolt if it arrived late.
      rattle.current?.reveal()
      setResult(pick)
      setRecent((r) => [...r, pick.id].slice(-RECENT_KEPT))
      setPhase('opening')
      timer.current = window.setTimeout(() => {
        haptic('success')
        setPhase('revealed')
        // no Confirm tick: the answer is on the screen, which is DESIGN.md's own test for when a
        // confirmation is owed and when it is noise
      }, reduced ? 0 : SETTLE_MS)
    }, reduced ? REDUCED_MS : SHAKE_MS + HOLD_MS)
  }

  const press = () => {
    const pick = shake({ drinks, entries: me.entries, forYou: picks.map((p) => ({ id: p.drink.id, reason: p.reason })), recent, random: Math.random })
    // nothing to shake: the row on Home is hidden in that case, so this is the defence behind it
    if (!pick) return
    window.clearTimeout(timer.current)
    rattle.current?.stop()
    setAnnounce('')
    setResult(null)
    // Shake again puts the lid back on and the drop back in the mouth first, so every shake starts
    // from a closed shaker rather than from an open one snapping shut as it begins to move.
    if (phase === 'opening' || phase === 'revealed') {
      setPhase('closing')
      timer.current = window.setTimeout(() => run(pick), CLOSE_MS)
      return
    }
    run(pick)
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

  // Shut, shaking or opening, the control is the same ghost reading Shaking: the answer is not on
  // screen until the drop has landed, and a button that says Go get it before then has nothing to go
  // and get.
  const busy = phase === 'shaking' || phase === 'opening' || phase === 'closing'
  const label = busy ? 'Shaking'
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
            {/* data-drink names what the card is naming, which is what the QA reveal check reads
                back against the store to prove the pick was a drink the guest has not tried */}
            <div className="shake-answer" data-drink={drink.id}>
              {/* the name first and in full: the one job of this moment is to name a drink, and the
                  drop that came out of the tin carries no lettering of its own */}
              <h3 className="t-h2">{drink.name}</h3>
              <p className="t-meta tnum">{where}</p>
              <p className="t-body">{result.reason}</p>
            </div>
          )}

          <button
            type="button"
            className="btn btn-coral btn-wide pressable shake-go"
            disabled={busy}
            onClick={() => (phase === 'revealed' && result ? setOpenDrink(result.id) : press())}
          >
            {label}
          </button>

          <div className="shake-quiets">
            {phase === 'revealed' && (
              <button type="button" className="quiet-action shake-again" onClick={press}>Shake again</button>
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
