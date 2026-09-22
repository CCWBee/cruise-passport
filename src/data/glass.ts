// Which glass a drink is served in. It is the drink's icon in every list and the prize the shaker
// surfaces, so it has to be right, and the category cannot say it: 93 of the 166 cocktails are
// "Signature", Mojitos, Mules and Negronis among them. So a drink on the published catalogue takes
// the glass tools/glass-classify.mjs decided for it (Jev over its name, ingredients and description,
// ruled on by hand where it was unsure), and a drink the guest added takes the rules below: its name
// first, then whether it is frozen, then its category, and the cocktail glass takes the rest.
// The rules are pure and tested in glass.test.ts.
import { GLASS_BY_DRINK } from './glassByDrink.ts'

export type GlassFamily = 'cocktail' | 'margarita' | 'wine' | 'flute' | 'pint' | 'cup' | 'hurricane' | 'highball' | 'rocks'

/** Every family, in the order the list's filter and a legend would name them. */
export const GLASS_FAMILIES: GlassFamily[] = ['cocktail', 'margarita', 'rocks', 'highball', 'hurricane', 'flute', 'wine', 'pint', 'cup']

/** What each glass is called, for an aria-label beside its icon. */
export const GLASS_NAME: Record<GlassFamily, string> = {
  cocktail: 'Cocktail glass', margarita: 'Margarita glass', rocks: 'Rocks glass', highball: 'Highball',
  hurricane: 'Hurricane glass', flute: 'Flute', wine: 'Wine glass', pint: 'Beer glass', cup: 'Coffee cup',
}

/** Words in a drink's name that settle its glass, first match wins. */
const BY_NAME: Array<[RegExp, GlassFamily]> = [
  [/martini|cosmo\b/i, 'cocktail'],
  [/margarita|paloma/i, 'margarita'],
  [/colada|daiquiri|granita|milkshake|fros[eé]/i, 'hurricane'],
  [/mojito|mule\b|tonic|high ?ball|swizzl|fresca|refresher|punch|mai tai|painkiller|sunrise|press\b/i, 'highball'],
  [/negroni|old fashioned|americano|carajillo/i, 'rocks'],
  [/champagne|prosecco|bellini|cava\b|brut\b/i, 'flute'],
  [/spritz|sangria|\bwine\b|ros[eé]\b/i, 'wine'],
  [/biiru|\bbeer\b|lager|\bale\b|cider|stout/i, 'pint'],
]

/** The category's glass, where the name said nothing. */
const BY_CATEGORY: Record<string, GlassFamily> = {
  Margarita: 'margarita',
  Wine: 'wine',
  Spritz: 'wine',
  Beer: 'pint',
  Coffee: 'cup',
  Frozen: 'hurricane',
  Mocktail: 'highball',
}

/** The rules alone, for a drink the catalogue does not know (one the guest added). */
export function ruleFamily(d: { name: string; category: string; frozen?: boolean }): GlassFamily {
  for (const [re, family] of BY_NAME) if (re.test(d.name)) return family
  if (d.frozen) return 'hurricane'
  return BY_CATEGORY[d.category] ?? 'cocktail'
}

export function glassFamily(d: { name: string; category: string; frozen?: boolean; cruise?: string }): GlassFamily {
  // a drink the guest added may share a published drink's name; its glass is still the rules'
  return (!d.cruise && GLASS_BY_DRINK[d.name]) || ruleFamily(d)
}
