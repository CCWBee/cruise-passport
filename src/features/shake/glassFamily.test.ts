import { test } from 'node:test'
import assert from 'node:assert/strict'
import { glassFamily } from './glassFamily.ts'

const d = (name: string, category: string, frozen = false) => ({ name, category, frozen })

test('the name decides before the category: a Signature Mojito is a highball, not a martini glass', () => {
  assert.equal(glassFamily(d('Dragon Fruit Mojito', 'Signature')), 'highball')
  assert.equal(glassFamily(d('Bangkok Mule', 'Signature')), 'highball')
  assert.equal(glassFamily(d('Gin & Tonic Ultima', 'Signature')), 'highball')
  assert.equal(glassFamily(d('Fancy Pants Paloma', 'Signature')), 'margarita')
  assert.equal(glassFamily(d('Aperol-Colada', 'Signature')), 'hurricane')
  assert.equal(glassFamily(d('Chianti Sangria', 'Signature')), 'wine')
  assert.equal(glassFamily(d('Biiru', 'Signature')), 'pint')
})

test('stirred drinks over ice take the rocks glass, whatever their category', () => {
  assert.equal(glassFamily(d('Negroni', 'Classic')), 'rocks')
  assert.equal(glassFamily(d('Nagoya Negroni', 'Classic')), 'rocks')
  assert.equal(glassFamily(d('Carajillo Old Fashioned', 'Coffee')), 'rocks')
})

test('a frozen drink the name does not place is a hurricane', () => {
  assert.equal(glassFamily(d('Twisted Dirty Banana', 'Frozen', true)), 'hurricane')
  assert.equal(glassFamily(d('Orange Granita', 'Mocktail', true)), 'hurricane')
})

test('otherwise the category decides, and the cocktail glass takes the rest', () => {
  assert.equal(glassFamily(d('Cappuccino', 'Coffee')), 'cup')
  assert.equal(glassFamily(d('Aperol Spritz', 'Spritz')), 'wine')
  assert.equal(glassFamily(d('Stella Artois', 'Beer')), 'pint')
  assert.equal(glassFamily(d('Beau Joie Brut Champagne', 'Wine')), 'wine')
  assert.equal(glassFamily(d('Gina Colada', 'Mocktail')), 'hurricane')
  assert.equal(glassFamily(d('The Levant', 'Mocktail')), 'highball')
  assert.equal(glassFamily(d('Key Lime Martini', 'Martini')), 'cocktail')
  assert.equal(glassFamily(d('Butterfly', 'Cocktail Magic')), 'cocktail')
  assert.equal(glassFamily(d('Clover Club', 'Classic')), 'cocktail')
})
