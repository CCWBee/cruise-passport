// Cruise registry. The app is generalisable across sailings: each cruise carries its own dataset
// (dates, venues, drinks). The published Sun Princess sailing, then whatever the guest has set up
// for themselves (src/data/sailings.ts). The active cruise is chosen once at entry and persisted,
// and the data layer (model.ts) reads its dataset. Switching cruises re-inits the module
// singletons, so it reloads.
import * as sunPrincess from './raw'
import type { VenueRaw, CocktailRow, WineRow, BeerRow } from './raw'
import { allSailings, venuesFor, type Sailing } from './sailings'

export interface CruiseDataset {
  START: string
  END: string
  /** Absent on a sailing the guest set up: it declares no package tiers, so no drink on it carries
   *  one. model.ts's HAS_PACKAGES and pkgFields() are the only readers. */
  PLUS?: number
  PREM?: number
  /** Deck number to the label the ship prints, where the two differ. model.ts's deckLabel() falls
   *  back to the number, so a sailing with no labels needs none. */
  DECK_LABELS?: Record<number, string>
  VENUES: Record<string, VenueRaw>
  COCKTAILS: CocktailRow[]
  WINES: WineRow[]
  BEERS: BeerRow[]
}

export interface Cruise {
  id: string
  name: string
  ship: string
  line: string
  start: string
  end: string
  data: CruiseDataset
}

const PUBLISHED_ID = 'sun-princess-2026'

// Written out rather than passed through as `data: sunPrincess`: a namespace spread is the one
// shape where a field this file expects and the data module does not export stays silent, and
// DECK_LABELS is a new field. Named here, a mis-spelling is a tsc error.
const published: Cruise = {
  id: PUBLISHED_ID,
  name: 'Sun Princess Cocktail Passport',
  ship: 'Sun Princess',
  line: 'Princess Cruises',
  start: sunPrincess.START,
  end: sunPrincess.END,
  data: {
    ...sunPrincess,
    DECK_LABELS: sunPrincess.DECK_LABELS,
    // A venue the guest adds to the published sailing is held in the same record as a user
    // sailing's own venues, so there is one lookup rather than two.
    VENUES: { ...sunPrincess.VENUES, ...venuesFor(PUBLISHED_ID) },
  },
}

/** A sailing the guest set up: its own dates, its own venues, and no published catalogue, so every
 *  drink on it is one they added. `PLUS` and `PREM` are absent, which is what makes HAS_PACKAGES
 *  false there. */
function toCruise(s: Sailing): Cruise {
  return {
    id: s.id,
    name: s.ship + ' Cocktail Passport',
    ship: s.ship,
    line: s.line,
    start: s.start,
    end: s.end,
    data: { START: s.start, END: s.end, VENUES: venuesFor(s.id), COCKTAILS: [], WINES: [], BEERS: [] },
  }
}

// Memoised at module load, as the dataset it feeds is: a catalogue change reloads the page, which
// is already the app's mechanism for exactly this (enterCruise, store.ts).
export const CRUISES: Cruise[] = [published, ...allSailings().map(toCruise)]

const STORAGE = 'spcc-cruise'

export function activeCruiseId(): string {
  try {
    const stored = localStorage.getItem(STORAGE)
    if (stored && CRUISES.some((c) => c.id === stored)) return stored
  } catch { /* storage blocked */ }
  return CRUISES[0].id
}

export function activeCruise(): Cruise {
  return CRUISES.find((c) => c.id === activeCruiseId()) ?? CRUISES[0]
}

export function setActiveCruise(id: string): void {
  try { localStorage.setItem(STORAGE, id) } catch { /* storage blocked */ }
}

export function cruiseById(id: string): Cruise | undefined {
  return CRUISES.find((c) => c.id === id)
}
