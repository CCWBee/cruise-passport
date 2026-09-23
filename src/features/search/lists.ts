// What the search shows, as pure functions over plain shapes. It imports nothing from the model, so it
// loads under `node --test` (lists.test.ts) with no DOM and nothing that reads `location` at load.

export interface LogCandidate { id: string; name: string; venue: string }
export type LogEntries = Record<string, { tried?: boolean; wish?: boolean } | undefined>

// the most rows a typed search draws: past sixty the guest types another letter rather than scrolls
export const MATCH_CAP = 60

/** The empty field: the untried drinks on the menu of the bar the guest is in (none when there is no
 *  bar), then their wishlist, untried, with anything already in the first list left out of the second
 *  so a drink is never listed twice. */
export function emptyLists<T extends LogCandidate>(menu: T[] | null, all: T[], entries: LogEntries): { still: T[]; wish: T[] } {
  const still = menu ? menu.filter((d) => !entries[d.id]?.tried) : []
  const listed = new Set(still.map((d) => d.id))
  const wish = all.filter((d) => entries[d.id]?.wish && !entries[d.id]?.tried && !listed.has(d.id))
  return { still, wish }
}

/** A typed search's matches, drinks whose name starts with the query first (prototype C's order),
 *  each half keeping the order it came in, cut to MATCH_CAP. */
export function rankMatches<T extends { name: string }>(matches: T[], q: string, cap: number = MATCH_CAP): T[] {
  const needle = q.trim().toLowerCase()
  const lead: T[] = []
  const rest: T[] = []
  for (const d of matches) (needle && d.name.toLowerCase().startsWith(needle) ? lead : rest).push(d)
  return lead.concat(rest).slice(0, cap)
}

/** Matches grouped under their venue, the groups in the order their best match comes, so the drink
 *  the guest was typing towards heads the first group. */
export function byVenue<T extends LogCandidate>(ranked: T[]): { venue: string; list: T[] }[] {
  const groups = new Map<string, T[]>()
  for (const d of ranked) {
    const list = groups.get(d.venue)
    if (list) list.push(d)
    else groups.set(d.venue, [d])
  }
  return [...groups].map(([venue, list]) => ({ venue, list }))
}
