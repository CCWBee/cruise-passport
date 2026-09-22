#!/usr/bin/env node
// Which glass each drink in the published catalogue is served in, decided once and baked into
// src/data/glassByDrink.ts. The glass is the drink's icon in every list and the prize the shaker
// surfaces, so it has to be right; the category cannot say it (93 of the 166 cocktails are
// "Signature", Mojitos, Mules and Negronis among them).
//
// Wines and beers are decided here in code: sparkling wine and Champagne a flute, the other wines a
// wine glass, every beer and cider a pint. The 166 cocktails are put to Jev (TypeSafe's decision
// model, the jev-lab setup: E:/claude-projects/jev-lab/CLAUDE.md) as one Choice each, over the
// drink's name, category, ingredients, description and whether it is frozen, with a description of
// every glass as the criteria. Jev picks from the list; it never invents a glass. Each answer's
// probability goes in the report beside the table, and anything under 0.5 is printed for a person
// to rule on before the table is committed.
//
// usage: node tools/glass-classify.mjs            (writes the table and the report)
//        node tools/glass-classify.mjs --dry      (asks Jev, prints, writes nothing)
// The key is read from E:/claude-projects/jev-lab/.env as TYPESAFE_API_KEY and is never printed.
// Catalogue text is Isabel's published menu data, public, which is what makes the direct route
// allowable. Cost: about 180 input tokens a drink at $0.042 a million, so well under a cent.

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const ENV = 'E:/claude-projects/jev-lab/.env'
const ENDPOINT = 'https://api.typesafe.ai/v1/systemone'
const MODEL = 'jev-1.13.0'
const DRY = process.argv.includes('--dry')

// The glasses, each described the way a bartender would choose it. These are Jev's criteria and the
// only answers it can give. The keys are GlassFamily in src/data/glass.ts.
const GLASSES = {
  cocktail: 'A stemmed V-shaped martini glass or coupe: a drink shaken or stirred and served straight up with no ice, such as a martini, a cosmopolitan, a sidecar, a sour served up, a dessert martini or an espresso martini.',
  margarita: 'A margarita glass with a wide stepped brim: a margarita or another tequila and lime drink served in one.',
  wine: 'A wine glass: still red, white or rose wine, a spritz, or sangria.',
  flute: 'A champagne flute: champagne, prosecco or other sparkling wine, or a sparkling wine cocktail such as a Bellini or a French 75.',
  pint: 'A beer glass: beer, lager, ale, stout, cider, or a beer cocktail.',
  cup: 'A coffee cup or mug: hot coffee, espresso, cappuccino, latte, Irish coffee or another hot drink.',
  hurricane: 'A tall curvy hurricane glass: a frozen or blended drink, a pina colada, a frozen daiquiri, a slushie, a frose or a milkshake.',
  highball: 'A tall highball or collins glass with ice: a long drink topped with soda, tonic, ginger beer, seltzer or juice, such as a mojito, a mule, a gin and tonic, a punch, a fizz, a spritzer, most tiki drinks and most mocktails.',
  rocks: 'A short heavy rocks tumbler: a spirit-forward drink over ice, such as an Old Fashioned, a Negroni, a whiskey on the rocks, a Carajillo or a White Russian.',
}

function readKey() {
  const text = fs.readFileSync(ENV, 'utf8')
  for (const line of text.split(/\r?\n/)) {
    const m = /^\s*(?:export\s+)?TYPESAFE_API_KEY\s*=\s*(.*)$/.exec(line)
    if (m && m[1].trim()) return m[1].trim().replace(/^(['"])(.*)\1$/, '$2')
  }
  throw new Error('TYPESAFE_API_KEY missing from ' + ENV)
}

function table(name) {
  const src = fs.readFileSync(path.join(ROOT, 'src/data/raw.ts'), 'utf8')
  // raw.ts is saved with CRLF line endings
  const m = new RegExp(`export const ${name}[^=]*= (\\[.*?\\]);\\r?\\n`, 's').exec(src)
  if (!m) throw new Error('no table ' + name + ' in raw.ts')
  return JSON.parse(m[1])
}

async function ask(key, state) {
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: MODEL, state, questions: { glass: { type: 'choice', instructions: 'Which glass is this drink served in?', criteria: GLASSES } } }),
  })
  const text = await res.text()
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${text.slice(0, 200)}`)
  const data = JSON.parse(text)
  const a = data.answers.glass
  const probs = Object.entries(a.probabilities || {}).sort((x, y) => y[1] - x[1])
  return { choice: a.choice, p: probs[0] ? probs[0][1] : null, next: probs[1] || null, tokens: data.usage ? data.usage.input_tokens : 0 }
}

const out = {}
const report = []

for (const [name, kind] of table('WINES')) {
  const family = /sparkling|champagne/i.test(kind) || /prosecco|champagne/i.test(name) ? 'flute' : 'wine'
  out[name] = family; report.push({ name, family, by: 'code' })
}
for (const [name] of table('BEERS')) { out[name] = 'pint'; report.push({ name, family: 'pint', by: 'code' }) }

const key = readKey()
const cocktails = table('COCKTAILS')
let tokens = 0
// four at a time: quick, and gentle on a service that publishes no rate limit
for (let i = 0; i < cocktails.length; i += 4) {
  const batch = cocktails.slice(i, i + 4)
  const answers = await Promise.all(batch.map((r) => {
    const [name, , category, spirits, ingredients, flavours, , , frozen, , desc] = r
    const state = [
      `Drink: ${name}`,
      `Menu category: ${category}`,
      `Spirits: ${spirits.join(', ')}`,
      `Ingredients: ${ingredients}`,
      `Flavours: ${flavours.join(', ')}`,
      `Frozen or blended: ${frozen ? 'yes' : 'no'}`,
      `Menu note: ${desc}`,
    ].join('\n')
    return ask(key, state).then((a) => ({ name, ...a }))
  }))
  for (const a of answers) {
    tokens += a.tokens || 0
    out[a.name] = a.choice
    report.push({ name: a.name, family: a.choice, by: 'jev', p: a.p, next: a.next })
    const flag = a.p !== null && a.p < 0.5 ? '  <-- under 0.5, rule on it' : ''
    console.log(`${a.choice.padEnd(10)} ${(a.p ?? 0).toFixed(2)}  ${a.name}${a.next ? `   (then ${a.next[0]} ${a.next[1].toFixed(2)})` : ''}${flag}`)
  }
}
console.log(`\n${cocktails.length} cocktails asked, ${tokens} input tokens, $${((tokens / 1e6) * 0.042).toFixed(6)}`)
const counts = {}
for (const f of Object.values(out)) counts[f] = (counts[f] || 0) + 1
console.log('by glass:', JSON.stringify(counts))

// A person's rulings on the answers Jev was unsure of, or wrong about, applied last: { "name": "family" }
const OVERRIDES = path.join(ROOT, 'tools/glass-classify.overrides.json')
if (fs.existsSync(OVERRIDES)) {
  for (const [n, f] of Object.entries(JSON.parse(fs.readFileSync(OVERRIDES, 'utf8')))) {
    if (!(n in out)) throw new Error('override for a drink not in the catalogue: ' + n)
    if (!(f in GLASSES)) throw new Error('override to a glass that does not exist: ' + f)
    if (out[n] !== f) console.log(`override  ${n}: ${out[n]} -> ${f}`)
    out[n] = f
  }
}

if (!DRY) {
  const lines = Object.entries(out).map(([n, f]) => `  ${JSON.stringify(n)}: '${f}',`)
  fs.writeFileSync(path.join(ROOT, 'src/data/glassByDrink.ts'),
    `// GENERATED by tools/glass-classify.mjs (Jev ${MODEL} for the cocktails, code for wine and beer).\n` +
    `// Each drink in the published catalogue and the glass it is served in, keyed by name. Rulings made by\n` +
    `// hand after the run are in tools/glass-classify.overrides.json and are applied last; edit that, not this.\n` +
    `import type { GlassFamily } from './glass'\n\nexport const GLASS_BY_DRINK: Record<string, GlassFamily> = {\n${lines.join('\n')}\n}\n`)
  fs.writeFileSync(path.join(ROOT, 'tools/glass-classify.report.json'), JSON.stringify({ model: MODEL, tokens, report }, null, 1) + '\n')
  console.log('wrote src/data/glassByDrink.ts and tools/glass-classify.report.json')
}
