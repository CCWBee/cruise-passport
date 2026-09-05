import { Suspense, lazy, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { SeaHero } from './SeaHero'
import { useStore, useAllDrinks } from '../../state/store'
import {
  computeStats, nextBadge, countOn, lastVenueOn, venueProgress, biggestBar, deckCount,
  dayPart, greetingWord, firstName, newMedals, topMedal, crewToday, syncedAgo,
  type NextBadge,
} from '../../state/stats'
import { useSources, pickedForYou } from '../../state/social'
import { DAYS, START, today, nowHour, VENUES } from '../../data/model'
import { useCountUp } from '../../ui/useCountUp'
import { FriendDot } from '../../ui/FriendDot'
import { IconStar } from '../../ui/Icon'
// the flat coin, the Suspense fallback for the 3D one: the same object the Badges grid draws
import { MedalDisc } from '../badges/Badges'
import { DrinkSheet } from '../drinks/DrinkSheet'
import { VenueSheet } from '../ship/VenueSheet'
import { WrappedTeaser } from '../wrapped/WrappedTeaser'
// the coin's own stylesheet: it carries the metal and emblem custom properties Medallion reads off
// the page, so the sheet's coin and this one are struck from the same tokens
import '../badges/badges.css'
import './home.css'

// The 3D coin, loaded only when a new medal is actually being announced: three.js is the heaviest
// thing in the app and Home opens two hundred times a voyage without one.
const Medallion = lazy(() => import('../badges/Medallion'))

const drinkVenue = (key: string) => VENUES[key]?.name || key

function countdown(): { text: ReactNode } {
  const i = DAYS.indexOf(today())
  if (i > -1) return { text: <>Day <b>{i + 1}</b> of 15 aboard</> }
  const d = Math.ceil((+new Date(START + 'T00:00:00') - +new Date(today() + 'T00:00:00')) / 86400000)
  if (d > 0) return { text: <>Sails in <b>{d}</b> day{d === 1 ? '' : 's'}</> }
  return { text: <>Voyage complete</> }
}

// The remainder said in the badge's own unit, so the line reads as a sentence ("2 more gins").
// An id with no unit here is a percentage badge and is measured in per cent.
const BADGE_UNIT: Record<string, [string, string]> = {
  first: ['drink', 'drinks'], ten: ['drink', 'drinks'], twentyfive: ['drink', 'drinks'],
  fifty: ['drink', 'drinks'], hundred: ['drink', 'drinks'], onefifty: ['drink', 'drinks'],
  twohundred: ['drink', 'drinks'], everybar: ['venue', 'venues'],
  // "whiskey": the badge covers American whiskey and bourbon and its sheet is spelled that way,
  // so the row and the sheet it opens use one spelling.
  coffee: ['coffee cocktail', 'coffee cocktails'], whiskey: ['whiskey', 'whiskeys'],
  gin: ['gin', 'gins'], rum: ['rum', 'rums'], wine: ['wine', 'wines'],
}
function badgeRemainder(nb: NextBadge): string {
  const left = Math.max(1, nb.need - nb.cur)
  const unit = BADGE_UNIT[nb.badge.id]
  if (!unit) return `${left}% more of the list`
  return `${left} more ${left === 1 ? unit[0] : unit[1]}`
}

// The greeting's second line. The hero chip already says which day of the voyage it is, so this says
// the date instead: two lines, two facts. Long weekday and month because it is read at a glance.
const greetDate = (iso: string): string =>
  new Date(iso + 'T12:00:00').toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })

function Fact({ value, label }: { value: ReactNode; label: string }) {
  return (
    <div className="fact">
      <div className="fact-v tnum">{value}</div>
      <div className="fact-l">{label}</div>
    </div>
  )
}

export function Home() {
  const drinks = useAllDrinks()
  const me = useStore((s) => s.me)
  const profile = useStore((s) => s.profile)
  const friends = useStore((s) => s.friends)
  const seenMedals = useStore((s) => s.seenMedals)
  const markMedalsSeen = useStore((s) => s.markMedalsSeen)
  const srcs = useSources()
  const [openId, setOpenId] = useState<string | null>(null)
  const [openVenue, setOpenVenue] = useState<string | null>(null)
  const s = useMemo(() => computeStats(drinks, me), [drinks, me])
  const pct = Math.min(100, s.pct)
  const pctShown = useCountUp(pct)
  const cd = countdown()
  const day = today()
  const hour = nowHour()
  const aboard = DAYS.indexOf(day) > -1

  // ── the greeting: the screen's first line, who and when, before what. Only with a name: a
  // greeting to nobody is decoration, so without one the hero stays first.
  const greetName = firstName(profile.name)

  // the chips floating on the sea. The shader lenses the water under their rectangles; the chips
  // themselves stay HTML, so the CSS-glass fallback is unchanged when there is no WebGL.
  const readoutRef = useRef<HTMLDivElement>(null)
  const countRef = useRef<HTMLParagraphElement>(null)
  const best = s.best
  const bestRating = best ? me.entries[best.id]?.rating || 0 : 0

  // ── the bar module. Aboard it is the venue of the last drink written today; with nothing
  // written today it falls back to the bar with most logged, and before sailing to the longest
  // list. Nothing here is inferred from the clock: a wrong bar called yours is a lie.
  const lastVenue = aboard ? lastVenueOn(drinks, me, day) : null
  const barKey = lastVenue || (aboard ? s.favVenue : null) || biggestBar(drinks)
  const barHead = lastVenue ? 'Last bar' : aboard && s.favVenue ? 'Your top bar' : 'Where to start'
  const bar = useMemo(
    () => (barKey ? venueProgress(drinks, me, barKey) : null),
    [drinks, me, barKey],
  )

  // ── up next: the badge nearest to earned, measured the way the Badges screen measures it
  const nb = useMemo(() => nextBadge(s.badgeStat), [s.badgeStat])
  // the top bar row is dropped when the module above already names that venue
  const showTopBar = !!s.favVenue && s.favVenue !== barKey

  // ── the new medal: earned since the guest last looked. One module, the highest tier of the
  // batch, the rest counted in its meta.
  const fresh = useMemo(() => newMedals(s.badgeStat, seenMedals), [s.badgeStat, seenMedals])
  const medal = topMedal(fresh)
  // The rest of the batch, counted in its own unit. "Ten gin drinks · and 5 more" reads as fifteen
  // gins, so on a batch the count replaces the hint rather than sharing the line with it: the hint
  // is one tap away in the sheet, and the meta line never states a number of the wrong thing.
  const more = fresh.length - 1
  const moreMedals = more > 0 ? `and ${more} more ${more === 1 ? 'medal' : 'medals'}` : ''

  // The moment is spent the first time it is shown, so the ids are taken on render and written when
  // Home goes away (or straight away on a tap). All of them, not just the coin's: the module counted
  // the others, so parading them one at a time on the next three opens would repeat a moment had.
  const shown = useRef<string[]>([])
  if (medal) shown.current = fresh.map((b) => b.id)
  // The flush is scheduled, not immediate, so React's development double-mount (which unmounts once
  // on purpose) cannot spend the moment before the guest has seen it: the remount cancels the timer.
  const pending = useRef<{ ids: string[]; timer: number } | null>(null)
  useEffect(() => {
    if (pending.current) { window.clearTimeout(pending.current.timer); pending.current = null }
    return () => {
      const ids = shown.current
      if (!ids.length) return
      const job = { ids, timer: 0 }
      job.timer = window.setTimeout(() => {
        markMedalsSeen(ids)
        if (pending.current === job) pending.current = null
      }, 0)
      pending.current = job
    }
  }, [markMedalsSeen])

  // ── the crew: one line per person who logged today. An entry carries a date and not a time, so
  // the line says the day's count, where most of it happened, and when their passport last reached
  // this phone. Nobody logged today means no rows and no filler saying so.
  const syncedAt = useMemo(() => {
    const at: Record<string, number> = {}
    friends.forEach((f) => { at[f.id] = f.exportedAt })
    return at
  }, [friends])
  const crew = useMemo(() => crewToday(drinks, srcs, syncedAt, day), [drinks, srcs, syncedAt, day])

  // ── for you: a short shelf of drinks to try next, each with an honest reason (a matched friend
  // loved it, or it is in the spirit you rate highest). Renders only when there is a real basis.
  const picks = useMemo(() => pickedForYou(me, srcs), [me, srcs])

  // the top drink: a row either way. With a rating it opens the sheet; empty, it goes to the
  // list that fills it, so the empty state ships the one action that ends it.
  const topDrink = (
    <span className="row-copy">
      <span className="t-strong">{best ? best.name : 'No top drink yet'}</span>
      <span className="t-meta">
        {best ? (
          <>
            <span className="home-stars" aria-label={`${bestRating} out of 5`}>
              {Array.from({ length: bestRating }, (_, i) => <IconStar key={i} size={13} filled />)}
            </span>
            {' · '}
            {drinkVenue(best.venue)}
          </>
        ) : 'Rate a drink and it appears here'}
      </span>
    </span>
  )

  return (
    <div className="wrap page home">
      {greetName && (
        <header className="home-greet">
          <h1 className="t-title">{greetingWord(dayPart(hour))}, {greetName}</h1>
          <p className="t-meta">{greetDate(day)}</p>
        </header>
      )}

      <div className="home-hero">
        <SeaHero level={pct / 100} hour={hour} chips={[readoutRef, countRef]} />
        <p className="sea-count glass-live glass-sm glass-edge" ref={countRef}>{cd.text}</p>
        <div className="sea-readout glass-live glass-sm glass-edge" ref={readoutRef}>
          <div className="sea-pct tnum">{pctShown.toFixed(0)}<small>%</small></div>
          <p className="sea-sub">{s.n} of {s.total}<br />tried</p>
        </div>
        {/* the one primary action on the app, floating on the water where the thumb rests */}
        <Link to="/drinks?log=1" className="sea-log glass-live glass-sm glass-edge glass-coral pressable" viewTransition>
          Log a drink
        </Link>
      </div>

      <section className="section">
        <div className="section-head"><h2 className="t-h2">{aboard ? 'Today' : 'The ship'}</h2></div>
        <div className="facts">
          {aboard ? (
            // Aboard, three numbers that move by the day. "Day n of 15" is not among them: the
            // hero chip already says it.
            <>
              <Fact value={countOn(me, day)} label="logged today" />
              <Fact value={s.streak} label="day streak" />
              <Fact value={`${s.bars} of ${s.barsTotal}`} label="bars visited" />
            </>
          ) : (
            // Before sailing there is no day, no streak and nothing logged, and "drinks to go"
            // is only the hero's own "58 of 214" turned round. So the row describes the ship:
            // three counts that are true and useful on a cold open with an empty passport, and
            // that lead into "Where to start" below.
            <>
              <Fact value={s.barsTotal} label="bars" />
              <Fact value={s.restTotal} label="restaurants" />
              <Fact value={deckCount()} label="decks" />
            </>
          )}
        </div>
      </section>

      {picks.length > 0 && (
        <section className="section">
          <div className="section-head"><h2 className="t-h2">For you</h2></div>
          {/* a shelf you swipe: each card is an independently opened unit, so it earns its boundary.
              The reason line, in the accent, is the honest basis: a matched friend, or your palate. */}
          <ul className="rec-rail" role="list">
            {picks.map((p) => (
              <li key={p.drink.id} className="rec-card">
                <button type="button" className="rec-open pressable" onClick={() => setOpenId(p.drink.id)}>
                  <span className="rec-reason">{p.reason}</span>
                  <span className="rec-name t-strong">{p.drink.name}</span>
                  <span className="rec-meta t-meta">{drinkVenue(p.drink.venue)} · {p.drink.spirits[0] || p.drink.category}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {bar && (
        <section className="section">
          <div className="section-head"><h2 className="t-h2">{barHead}</h2></div>
          <button
            type="button"
            className="row pressable"
            onClick={() => setOpenVenue(bar.key)}
            aria-label={`${drinkVenue(bar.key)}, ${bar.done} of ${bar.total} tried here`}
          >
            <span className="row-copy">
              <span className="t-strong">{drinkVenue(bar.key)}</span>
              <span className="t-meta tnum">
                {bar.done} of {bar.total} tried here
                {bar.next ? ` · ${bar.next.name} next` : ''}
              </span>
            </span>
          </button>
        </section>
      )}

      {/* The reward moment, and the one place Home is allowed to be spectacular. No heading: the
          line "New medal · Gin Explorer" is the heading, and a second one would say it twice. */}
      {medal && (
        <section className="section">
          <Link
            to={`/badges?badge=${medal.id}`}
            className="row pressable"
            viewTransition
            onClick={() => markMedalsSeen(fresh.map((b) => b.id))}
            // spoken, the middle dot is gone, so the second line becomes its own sentence and says
            // the same thing the screen says
            aria-label={`New medal, ${medal.name}. ${moreMedals ? `And ${more} more new ${more === 1 ? 'medal' : 'medals'}.` : `${medal.hint}.`}`}
          >
            <div className="home-coin">
              <Suspense fallback={<MedalDisc badge={medal} earned />}>
                <Medallion badge={medal} earned intro />
              </Suspense>
            </div>
            <span className="row-copy">
              <span className="t-strong">New medal · {medal.name}</span>
              <span className="t-meta">{moreMedals || medal.hint}</span>
            </span>
          </Link>
        </section>
      )}

      <section className="section">
        <div className="section-head"><h2 className="t-h2">Up next</h2></div>

        {nb && (
          <Link
            to={`/badges?badge=${nb.badge.id}`}
            className="row pressable"
            viewTransition
            aria-label={`${nb.badge.name}, ${nb.cur} of ${nb.need}`}
          >
            <span className="row-copy">
              <span className="t-strong">{nb.badge.name}</span>
              <span className="t-meta">{badgeRemainder(nb)}</span>
              {/* the remainder is already in words above, so the bar carries the count for
                  assistive technology only; the row never says the same number twice */}
              <span
                className="meter"
                role="progressbar"
                aria-label={`${nb.cur} of ${nb.need}`}
                aria-valuemin={0}
                aria-valuemax={nb.need}
                aria-valuenow={Math.min(nb.cur, nb.need)}
              >
                <span style={{ width: `${nb.pct}%` }} />
              </span>
            </span>
          </Link>
        )}

        {best ? (
          <button type="button" className="row pressable" onClick={() => setOpenId(best.id)}>
            {topDrink}
          </button>
        ) : (
          <Link
            to="/drinks"
            className="row pressable"
            viewTransition
            aria-label="No top drink yet, rate a drink"
          >
            {topDrink}
          </Link>
        )}

        {/* a bar name opens that bar, here as in the module above: two rows that look the same
            on one screen must not do two different things */}
        {showTopBar && (
          <button
            type="button"
            className="row pressable"
            onClick={() => setOpenVenue(s.favVenue!)}
            aria-label={`${drinkVenue(s.favVenue!)}, ${s.favVenueN} drinks logged`}
          >
            <span className="row-copy">
              <span className="t-strong">{drinkVenue(s.favVenue!)}</span>
              <span className="t-meta tnum">{s.favVenueN} drinks logged</span>
            </span>
          </button>
        )}

        {/* one line per crew member who logged today: the same dot, name and meta line the crew
            screen's "Sailing with" rows use, so a person reads the same way on both */}
        {crew.map((c) => {
          // "at" when every one of today's drinks was there, "mostly" when more than half were, and
          // nothing at all when the day was spread: a hedge where the data is exact would be as
          // dishonest as a fact where it is not, and "mostly" on a three-way tie is neither
          const where = !c.venue ? ''
            : c.onlyVenue ? ` at ${drinkVenue(c.venue)}`
              : `, mostly ${drinkVenue(c.venue)}`
          const synced = c.syncedAt ? syncedAgo(c.syncedAt) : ''
          const line = `${c.n} today${where}${synced ? ` · synced ${synced}` : ''}`
          // spoken, the middle dot is gone and "synced" needs its verb, so the clauses are written
          // out rather than the printed line read aloud
          const spoken = [c.name, `${c.n} today${where}`, synced && `last synced ${synced}`, 'open your crew']
            .filter(Boolean).join(', ')
          return (
            <Link
              key={c.id}
              to="/social"
              className="row pressable"
              viewTransition
              aria-label={spoken}
            >
              <FriendDot name={c.name} colour={c.colour} size={28} />
              <span className="row-copy">
                {/* .t-strong, not Social's .t-body: inside one list the primary line reads one way,
                    and the badge, drink and bar rows above are 17/600 */}
                <span className="t-strong">{c.name}</span>
                <span className="t-meta tnum">{line}</span>
              </span>
            </Link>
          )
        })}
      </section>

      <WrappedTeaser />

      {openId && <DrinkSheet id={openId} onClose={() => setOpenId(null)} onOpen={setOpenId} />}
      {openVenue && <VenueSheet venueKey={openVenue} onClose={() => setOpenVenue(null)} />}
    </div>
  )
}
