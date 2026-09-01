// Cruise registry. The app is generalisable across sailings: each cruise carries its own dataset
// (dates, venues, drinks). One entry today (Sun Princess, Oct 2026); adding another is a new dataset
// module plus a row here. The active cruise is chosen once at entry and persisted, and the data layer
// (model.ts) reads its dataset. Switching cruises re-inits the module singletons, so it reloads.
import * as sunPrincess from './raw'
import type { VenueRaw, CocktailRow, WineRow, BeerRow } from './raw'

export interface CruiseDataset {
  START: string
  END: string
  PLUS: number
  PREM: number
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

export const CRUISES: Cruise[] = [
  {
    id: 'sun-princess-2026',
    name: 'Sun Princess Cocktail Passport',
    ship: 'Sun Princess',
    line: 'Princess Cruises',
    start: sunPrincess.START,
    end: sunPrincess.END,
    data: sunPrincess,
  },
]

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
