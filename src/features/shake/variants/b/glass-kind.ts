// Which glass the prize is, by the drink's category. Its own file, so glasses.tsx exports only
// components and fast refresh keeps working on it.

export type GlassKind = 'cocktail' | 'margarita' | 'wine' | 'pint' | 'cup' | 'hurricane' | 'highball'

/** The glass for a category, from the spec's table. Anything not named there (Martini, Classic,
 *  Signature, Dessert and the brand categories) takes the stemmed V-shaped cocktail glass. */
export function glassFor(category: string | undefined): GlassKind {
  switch (category) {
    case 'Margarita': return 'margarita'
    case 'Wine': case 'Spritz': return 'wine'
    case 'Beer': return 'pint'
    case 'Coffee': return 'cup'
    case 'Frozen': return 'hurricane'
    case 'Mocktail': return 'highball'
    default: return 'cocktail'
  }
}
