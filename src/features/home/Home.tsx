import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { SeaHero } from './SeaHero'
import { useStore, useAllDrinks } from '../../state/store'
import {
  computeStats, countOn, currentBar, venueProgress, biggestBar,
  dayPart, greetingWord, firstName, newMedals, topMedal, crewToday, syncedAgo,
} from '../../state/stats'
import { useSources, pickedForYou } from '../../state/social'
import { DAYS, START, today, nowHour, VENUES, VENUE_KEYS } from '../../data/model'
import { BADGES, TIER_WORD, badgeCount } from '../../data/badges'
import { useCountUp } from '../../ui/useCountUp'
import { useScreenTitle } from '../../app/screenTitle'
import { FriendDot } from '../../ui/FriendDot'
import { IconShaker } from '../../ui/Icon'
// the struck coin, and the case's own arithmetic, so the tray and the case it opens count alike
import { Coin } from '../badges/Coin'
import { earnedWords, medalGroups, remainder } from '../badges/medals'
import { DrinkSheet } from '../drinks/DrinkSheet'
import { ShakeSheet } from '../shake/ShakeSheet'
import { VenueSheet } from '../ship/VenueSheet'
import { WrappedTeaser } from '../wrapped/WrappedTeaser'
import './home.css'

const drinkVenue = (key: string) => VENUES[key]?.name || key

function countdown(): { text: ReactNode } {
  const i = DAYS.indexOf(today())
  // DAYS.length, not 15: a ten-day sailing says ten, and the Sun Princess still says fifteen.
  if (i > -1) return { text: <>Day <b>{i + 1}</b> of {DAYS.length}</> }
  const d = Math.ceil((+new Date(START + 'T00:00:00') - +new Date(today() + 'T00:00:00')) / 86400000)
  if (d > 0) return { text: <>Sails in <b>{d}</b> day{d === 1 ? '' : 's'}</> }
  return { text: <>Voyage complete</> }
}

// The greeting's second line. The sky chip already says which day of the voyage it is, so this says
// the date instead: two lines, two facts. Long weekday and month because it is read at a glance.
const greetDate = (iso: string): string =>
  new Date(iso + 'T12:00:00').toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })

// Five coins at 56 and four gaps of 8 fill the tray's inner width at 390 (C's arithmetic, on the
// spacing scale). Past five the count in the heading says the rest, and the case shows them all.
const TRAY_COINS = 5

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
  const [shakeOpen, setShakeOpen] = useState(false)
  const s = useMemo(() => computeStats(drinks, me), [drinks, me])
  const pct = Math.min(100, s.pct)
  const pctShown = useCountUp(pct)
  const cd = countdown()
  const day = today()
  const hour = nowHour()
  const aboard = DAYS.indexOf(day) > -1

  // ── the greeting: the screen's first line, who and when, before what. Only with a name: a
  // greeting to nobody is decoration, so without one the sea window is first, and the top bar
  // takes the tab's name when the page scrolls.
  const greetName = firstName(profile.name)
  const greeting = greetName ? `${greetingWord(dayPart(hour))}, ${greetName}` : ''
  useScreenTitle(greeting)

  // ── the bar module. Aboard it is the venue of the last drink written today; with nothing
  // written today it falls back to the bar with most logged, and before sailing to the longest
  // list. Nothing here is inferred from the clock: a wrong bar called yours is a lie.
  const lastVenue = currentBar(drinks, me, day)
  const barKey = lastVenue || (aboard ? s.favVenue : null) || biggestBar(drinks)
  const barHead = lastVenue ? 'Last bar' : aboard && s.favVenue ? 'Your top bar' : 'Where to start'
  const bar = useMemo(
    () => (barKey ? venueProgress(drinks, me, barKey) : null),
    [drinks, me, barKey],
  )

  // ── the medal tray: the case's three groups, counted the way the case counts them
  const groups = useMemo(() => medalGroups(s.badgeStat), [s.badgeStat])

  // The new medal: earned since the guest last looked. It leads the tray, the highest tier of the
  // batch, and the kicker counts the batch. With nothing new the tray is led by the best medal held.
  const fresh = useMemo(() => newMedals(s.badgeStat, seenMedals), [s.badgeStat, seenMedals])
  const medal = topMedal(fresh)
  const lead = medal ?? groups.earned[0] ?? null
  const rest = groups.earned.filter((b) => b !== lead).slice(0, TRAY_COINS)
  // the nearest medal in reach, the measure the case's In reach list is sorted by
  const next = groups.reach[0] ?? null

  // The moment is spent the first time it is shown, so the ids are taken on render and written when
  // Home goes away (or straight away on a tap). All of them, not just the coin's: the kicker counted
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

  // Aboard, today's three facts are true only when there is a bar to count; with none, every one
  // of them is zero. Before sailing the only thing to say about the ship is the way to a first
  // venue, and only when there is no venue at all.
  const shipZero = aboard ? s.barsTotal === 0 : VENUE_KEYS.length === 0
  const todayFacts = aboard && !shipZero

  // The tray renders once there is something to earn: with no catalogue there is no first drink to
  // log, and a tray saying so would be a promise nothing can keep.
  const showTray = drinks.length > 0 || groups.earned.length > 0
  const earnedCount = groups.earned.length
  // Spoken, the tray is one control, so its label says what the coins and lines say, in order.
  const trayLabel = [
    earnedCount ? `Medals, ${earnedCount} of ${BADGES.length} earned` : 'Medals, none earned yet',
    medal && lead ? (fresh.length > 1 ? `${fresh.length} new medals, led by ${lead.name}` : `New medal, ${lead.name}`) : '',
    next ? `Next, ${next.badge.name}, ${badgeCount(next.badge, next.progress.cur, next.progress.need)}` : '',
    'Open the case',
  ].filter(Boolean).join('. ') + '.'

  return (
    <div className="wrap page home">
      {greetName && (
        <header className="home-greet">
          <h1 className="t-title">{greeting}</h1>
          <p className="t-meta">{greetDate(day)}</p>
        </header>
      )}

      {/* The window onto the sea, and the sky chip floating in it. The readout has left the water
          for the line below, and "Log a drink" has gone to the dock, whose Log is the one coral
          fill on the screen. */}
      <SeaHero level={pct / 100} hour={hour}>
        <p className="sea-chip glass glass-sm glass-calm">{cd.text}</p>
      </SeaHero>

      {/* The readout: the one display number in the app, and beside it what it counts. Aboard, the
          day's three facts are its next lines, the numbers that move by the day; "Day 3 of 15" is
          not among them, because the sky chip says it. */}
      <div className="readout">
        <p className="t-display tnum readout-pct">{pctShown.toFixed(0)}<small>%</small></p>
        <div className="readout-copy">
          {/* with nothing to try the line keeps its place and says what is true rather than "0 of 0" */}
          <p className="readout-sub tnum">{s.total ? <><b>{s.n}</b> of {s.total} tried</> : 'No drinks yet'}</p>
          {todayFacts && (
            <>
              <p className="readout-today tnum"><b>{countOn(me, day)}</b> today · <b>{s.streak}</b> day streak</p>
              <p className="readout-today tnum"><b>{s.bars} of {s.barsTotal}</b> bars visited</p>
            </>
          )}
        </div>
      </div>

      {/* Module 2, the medal tray: the one box on Home that holds things, on the case's velvet, and
          the one tap to the case. The new medal leads it large and turns once; the other earned
          coins lie beside it; the nearest in reach is a blank with its ring filling. The count is
          said once, in the heading. The whole tray is one target, so the coins inside take no taps
          of their own. */}
      {showTray && (
        <section className="section home-medals">
          <div className="section-head">
            <h2 className="t-h2">Medals</h2>
            {earnedCount > 0 && <p className="t-meta tnum">{earnedCount} of {BADGES.length}</p>}
          </div>
          <Link
            to="/badges"
            className="case tray pressable"
            data-room="night"
            onClick={() => { if (fresh.length) markMedalsSeen(fresh.map((b) => b.id)) }}
            aria-label={trayLabel}
          >
            {lead ? (
              <span className="tray-lead">
                {/* keyed by the medal, so a second new medal mounts a coin of its own and turns too */}
                <Coin key={lead.id} badge={lead} state="earned" size={96} turn={!!medal} />
                <span className="tray-copy">
                  {medal && <span className="tray-new">{fresh.length > 1 ? `${fresh.length} new medals` : 'New medal'}</span>}
                  <span className="tray-name">{lead.name}</span>
                  <span className="t-meta">{TIER_WORD[lead.tier ?? 'bronze']} medal · {earnedWords(lead)}</span>
                </span>
              </span>
            ) : (
              <span className="t-meta tray-empty">Log your first drink and the first coin is struck.</span>
            )}
            {rest.length > 0 && (
              <span className="tray-coins">
                {rest.map((b) => <Coin key={b.id} badge={b} state="earned" size={56} />)}
              </span>
            )}
            {next && (
              <span className="tray-next">
                <Coin badge={next.badge} state="reach" progress={next.progress.pct / 100} size={44} />
                {/* the remainder in words; the ring carries the count, so the line never says the
                    same number twice */}
                <span className="row-copy">
                  <span className="t-strong">{next.badge.name}</span>
                  <span className="t-meta">{remainder(next.badge, next.progress)}</span>
                </span>
              </span>
            )}
          </Link>
        </section>
      )}

      {/* The one case where today's facts would all be structural zeros, which DESIGN.md forbids
          outright: in their place, the way to a first bar. Aboard the test is barsTotal and not the
          venue count, because a sailing whose venues are all restaurants has venues and no bars. */}
      {shipZero && (
        <section className="section">
          <div className="section-head"><h2 className="t-h2">The ship</h2></div>
          <Link to="/ship" className="row pressable">
            <span className="row-copy">
              <span className="t-strong">{aboard ? 'Add a bar' : 'Add your first venue'}</span>
              <span className="t-meta">{aboard ? 'Nothing to check in at on this sailing yet' : 'Bars, cafés and restaurants you will drink at'}</span>
            </span>
          </Link>
        </section>
      )}

      {/* The section renders for the shelf or for the shaker alone: for a guest with no ratings and
          no crew there is no shelf, and the shaker is then the most useful thing on the screen, so
          the heading and this one row are the whole section. With no catalogue at all there is
          nothing to shake and nothing to suggest, and the section goes. */}
      {(picks.length > 0 || drinks.length > 0) && (
        <section className="section">
          <div className="section-head"><h2 className="t-h2">For you</h2></div>
          {/* a shelf you swipe: each card is an independently opened unit, so it earns its boundary.
              The name leads, so the first screen ends on words rather than on boxes (the judged
              defect in C); the reason, in the lamp's colour, is the honest basis: a matched friend,
              or your palate. */}
          {picks.length > 0 && (
            <ul className="rec-rail" role="list">
              {picks.map((p) => (
                <li key={p.drink.id} className="rec-card">
                  <button
                    type="button"
                    className="rec-open pressable"
                    onClick={() => setOpenId(p.drink.id)}
                    aria-label={`${p.drink.name}, ${drinkVenue(p.drink.venue)}. ${p.reason}`}
                  >
                    <span className="rec-name">{p.drink.name}</span>
                    <span className="rec-reason">{p.reason}</span>
                    {/* a taste pick's reason already names the spirit, so its meta is the venue
                        alone; a crew pick's reason names a person, so the spirit is new there */}
                    <span className="rec-meta t-meta">
                      {p.kind === 'taste' ? drinkVenue(p.drink.venue) : `${drinkVenue(p.drink.venue)} · ${p.drink.spirits[0] || p.drink.category}`}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          {/* The shake card: the playful last item of the section that already exists to suggest
              drinks, so it borrows that heading and adds none. It is a card rather than a row
              because it is the one thing on Home that does something for you, and it should read
              as pressable at a glance (Charles, 23 September 2026). One plate across the full
              width with the tin leading, so it is a different shape from the shelf's cards above
              it. Ink only: the dock's Log keeps the screen's coral. The second line says when you
              would reach for it; what the shaker does is the sheet's meta line, said there. The
              wrapper keeps the gap shake.css sets under the shelf. */}
          {drinks.length > 0 && (
            <div className="shake-row">
              <button
                type="button"
                className="shake-card pressable shake-open"
                aria-haspopup="dialog"
                onClick={() => setShakeOpen(true)}
              >
                {/* the cobbler at 52, its stroke near the hero's 2.4 on screen, in the sheet's steel */}
                <IconShaker className="shake-card-tin" size={52} strokeWidth={1.1} />
                <span className="shake-card-copy">
                  <span className="t-strong">Shake for a drink</span>
                  <span className="t-meta">When you cannot decide</span>
                </span>
              </button>
            </div>
          )}
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

      {/* Up next: where the crew is today. The nearest medal was here and is now the tray's last
          line, so it is said once; with nobody logging today the section has nothing to say and
          does not render. One line per crew member who logged today: the same dot, name and meta
          line the crew screen's "Sailing with" rows use, so a person reads the same way on both. */}
      {crew.length > 0 && (
        <section className="section">
          <div className="section-head"><h2 className="t-h2">Up next</h2></div>
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
                aria-label={spoken}
              >
                <FriendDot name={c.name} colour={c.colour} size={28} />
                <span className="row-copy">
                  {/* .t-strong, not Social's .t-body: inside one list the primary line reads one way */}
                  <span className="t-strong">{c.name}</span>
                  <span className="t-meta tnum">{line}</span>
                </span>
              </Link>
            )
          })}
        </section>
      )}

      <WrappedTeaser />

      {openId && <DrinkSheet id={openId} onClose={() => setOpenId(null)} />}
      {openVenue && <VenueSheet venueKey={openVenue} onClose={() => setOpenVenue(null)} />}
      {shakeOpen && <ShakeSheet onClose={() => setShakeOpen(false)} />}
    </div>
  )
}
