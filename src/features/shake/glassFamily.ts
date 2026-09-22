// Which glass the shaker's prize is drawn as. The category alone is too coarse to say it: 93 of the
// 166 cocktails are "Signature", Mojitos and Mules among them, and a Mojito rising out of the tin in a
// martini glass tells the guest something false before the card names it. So the drink's own name
// decides first, then whether it is frozen, then its category, and the cocktail glass takes the rest.
// Pure, so it is tested in glassFamily.test.ts.

export type GlassFamily = 'cocktail' | 'margarita' | 'wine' | 'pint' | 'cup' | 'hurricane' | 'highball' | 'rocks'

/** Words in a drink's name that settle its glass, first match wins. Checked against the published
 *  catalogue on 23 September 2026; a name that matches none falls through to the rules below. */
const BY_NAME: Array<[RegExp, GlassFamily]> = [
  [/martini|cosmo\b/i, 'cocktail'],
  [/margarita|paloma/i, 'margarita'],
  [/colada|daiquiri|granita|milkshake|fros[eé]/i, 'hurricane'],
  [/mojito|mule\b|tonic|high ?ball|swizzl|fresca|refresher|punch|mai tai|painkiller|sunrise|press\b/i, 'highball'],
  [/negroni|old fashioned|americano|carajillo/i, 'rocks'],
  [/spritz|bellini|sangria/i, 'wine'],
  [/biiru|\bbeer\b|lager/i, 'pint'],
]

/** The category's glass, where the name said nothing. The two Princess brand names and any category
 *  not listed take the cocktail glass. */
const BY_CATEGORY: Record<string, GlassFamily> = {
  Margarita: 'margarita',
  Wine: 'wine',
  Spritz: 'wine',
  Beer: 'pint',
  Coffee: 'cup',
  Frozen: 'hurricane',
  Mocktail: 'highball',
}

export function glassFamily(d: { name: string; category: string; frozen?: boolean }): GlassFamily {
  for (const [re, family] of BY_NAME) if (re.test(d.name)) return family
  if (d.frozen) return 'hurricane'
  return BY_CATEGORY[d.category] ?? 'cocktail'
}
