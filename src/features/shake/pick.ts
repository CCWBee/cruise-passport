// What the shaker surfaces. Pure, with `random` injected, so the sheet hands it Math.random and the
// tests hand it a fixed sequence. It declares its own shapes rather than importing the model, so it
// loads under `node --test` with no DOM and nothing that reads `location` at module load.

export interface ShakeCandidate { id: string; name: string; venue: string; category: string; spirits: string[] }
export interface ShakeInput {
  drinks: ShakeCandidate[]
  entries: Record<string, { tried?: boolean; rating?: number; date?: string }>
  forYou: { id: string; reason: string }[]   // pickedForYou, ids and reasons, in order
  recent: string[]                           // ids revealed this session, newest last
  random: () => number                       // injected, so tests are deterministic
}
export interface ShakeResult { id: string; reason: string; allTried: boolean }

/** How many of this session's reveals the shaker remembers. Six is a full shelf: long enough that a
 *  repeat inside one sitting is impossible on any real catalogue, short enough that a bar with seven
 *  drinks left does not run out of things to say. */
export const RECENT_KEPT = 6

const ALL_TRIED_REASON = 'You have tried them all. Have another.'
// A pick with nothing personal behind it gives no reason: "One you have not tried" repeated the
// sheet's own meta line on the same screen, and the card shows no line rather than an empty one.
const UNIFORM_REASON = ''

/** The guest's top spirit, by the same rule `pickedForYou` uses: a spirit they have rated 4 or more
 *  at least three times. Wine and beer are not spirits, and "because you love wine" over a cocktail
 *  list would be a category error. Ties go to the larger count, then alphabetically, so the phrase
 *  the guest is shown does not change between shakes for no reason. */
function topSpirit(input: ShakeInput, byId: Map<string, ShakeCandidate>): string | null {
  const love: Record<string, number> = {}
  for (const [id, e] of Object.entries(input.entries)) {
    if ((e.rating ?? 0) < 4) continue
    const d = byId.get(id)
    if (!d) continue
    for (const sp of d.spirits) if (sp !== 'Wine' && sp !== 'Beer') love[sp] = (love[sp] || 0) + 1
  }
  const top = Object.entries(love)
    .filter(([, n]) => n >= 3)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0]
  return top ? top[0] : null
}

/** The drink the guest scored highest, ties broken by the latest date logged, then by the order the
 *  catalogue is in, so the answer is stable for an unchanged passport. */
function bestRated(input: ShakeInput): ShakeCandidate | null {
  let best: ShakeCandidate | null = null
  let bestRating = -1
  let bestDate = ''
  for (const d of input.drinks) {
    const e = input.entries[d.id]
    const rating = e?.rating ?? 0
    const date = e?.date || ''
    if (rating > bestRating || (rating === bestRating && date > bestDate)) {
      best = d; bestRating = rating; bestDate = date
    }
  }
  return best
}

/**
 * One shake. Null only when there is nothing to shake, which the row on Home already guards against:
 * this is the defence behind it.
 */
export function shake(input: ShakeInput): ShakeResult | null {
  if (!input.drinks.length) return null
  const byId = new Map(input.drinks.map((d) => [d.id, d]))

  // A drink that has been rated has been had, whether or not the tick was ever tapped: the two flags
  // are set independently in the drink sheet, and recommending one back would read as a bug.
  const untried = input.drinks.filter((d) => !input.entries[d.id]?.tried && !input.entries[d.id]?.rating)
  if (!untried.length) {
    const best = bestRated(input)
    return best ? { id: best.id, reason: ALL_TRIED_REASON, allTried: true } : null
  }

  // Never the same answer twice in a sitting: a shaker that repeats itself is a broken one. The
  // guard yields when it would leave nothing, because no answer is worse than a repeated one.
  const fresh = untried.filter((d) => !input.recent.includes(d.id))
  const pool = fresh.length ? fresh : untried

  const reasons = new Map(input.forYou.map((p) => [p.id, p.reason]))
  const spirit = topSpirit(input, byId)

  // One pass: the weight and the line that explains it are decided together, so the guest is never
  // told a reason the pick was not made for. Four against one keeps the shelf's picks likely without
  // making this a second shelf: a plain untried gin still surfaces often.
  let total = 0
  const weighted = pool.map((d) => {
    const forYou = reasons.get(d.id)
    const weight = forYou ? 4 : spirit && d.spirits.includes(spirit) ? 2 : 1
    const reason = forYou || (weight === 2 ? `Because you love ${spirit!.toLowerCase()}` : UNIFORM_REASON)
    total += weight
    return { d, weight, reason }
  })

  // Draw by weight: walk the cumulative run and take the band `random()` lands in. The last band
  // catches a random() that returns exactly 1, which the contract does not promise it cannot.
  let r = input.random() * total
  for (const w of weighted) {
    r -= w.weight
    if (r < 0) return { id: w.d.id, reason: w.reason, allTried: false }
  }
  const last = weighted[weighted.length - 1]
  return { id: last.d.id, reason: last.reason, allTried: false }
}
