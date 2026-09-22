import { test } from 'node:test'
import assert from 'node:assert/strict'
import { GLASS_FAMILIES, glassFamily, ruleFamily } from './glass.ts'
import { GLASS_BY_DRINK } from './glassByDrink.ts'

const d = (name: string, category: string, frozen = false) => ({ name, category, frozen })

test('the rules read the name before the category: a Signature Mojito is a highball, not a martini glass', () => {
  assert.equal(ruleFamily(d('Dragon Fruit Mojito', 'Signature')), 'highball')
  assert.equal(ruleFamily(d('Bangkok Mule', 'Signature')), 'highball')
  assert.equal(ruleFamily(d('Gin & Tonic Ultima', 'Signature')), 'highball')
  assert.equal(ruleFamily(d('Fancy Pants Paloma', 'Signature')), 'margarita')
  assert.equal(ruleFamily(d('Aperol-Colada', 'Signature')), 'hurricane')
  assert.equal(ruleFamily(d('Chianti Sangria', 'Signature')), 'wine')
  assert.equal(ruleFamily(d('Biiru', 'Signature')), 'pint')
  assert.equal(ruleFamily(d('Negroni', 'Classic')), 'rocks')
  assert.equal(ruleFamily(d('Carajillo Old Fashioned', 'Coffee')), 'rocks')
  assert.equal(ruleFamily(d('Beau Joie Brut Champagne', 'Wine')), 'flute')
})

test('the rules fall back to frozen, then the category, then the cocktail glass', () => {
  assert.equal(ruleFamily(d('Twisted Dirty Banana', 'Frozen', true)), 'hurricane')
  assert.equal(ruleFamily(d('Orange Granita', 'Mocktail', true)), 'hurricane')
  assert.equal(ruleFamily(d('Cappuccino', 'Coffee')), 'cup')
  assert.equal(ruleFamily(d('Stella Artois', 'Beer')), 'pint')
  assert.equal(ruleFamily(d('The Levant', 'Mocktail')), 'highball')
  assert.equal(ruleFamily(d('Butterfly', 'Cocktail Magic')), 'cocktail')
})

test('the classified table holds a known glass for every drink it names', () => {
  const names = Object.keys(GLASS_BY_DRINK)
  assert.equal(names.length, 214, 'the published catalogue is 166 cocktails, 21 wines and 27 beers')
  for (const n of names) assert.ok(GLASS_FAMILIES.includes(GLASS_BY_DRINK[n]), n + ' has a glass that does not exist')
})

test('a published drink takes its classified glass; one the guest added takes the rules', () => {
  assert.equal(glassFamily(d('Aperol Spritz', 'Spritz')), GLASS_BY_DRINK['Aperol Spritz'])
  assert.equal(glassFamily({ ...d('Negroni', 'Signature'), cruise: 'my-sailing' }), 'rocks')
  assert.equal(glassFamily(d('Harbour Fizz', 'Beer')), 'pint')
})
