// Cold storage, 18 October 2026: one voyage summary per guest, built from the database export with
// the app's own Wrapped logic (src/features/wrapped/wrappedData.ts), so the email says what the
// Wrapped screen would have said. Reads archive/<date>-export.json, writes archive/summaries/<code>.json.
// Run: npx --yes tsx tools/coldstorage/summaries.ts archive/2026-10-18-export.json
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs'

// The app reads localStorage in a few modules at load; a plain map stands in for it here.
const mem = new Map<string, string>()
;(globalThis as any).localStorage = {
  getItem: (k: string) => mem.get(k) ?? null,
  setItem: (k: string, v: string) => { mem.set(k, v) },
  removeItem: (k: string) => { mem.delete(k) },
  clear: () => mem.clear(),
  key: () => null,
  length: 0,
}

const { DRINKS, DRINK_BY_ID, VENUES } = await import('../../src/data/model')
const { deriveWrapped, certificateRows } = await import('../../src/features/wrapped/wrappedData')
const { BADGES } = await import('../../src/data/badges')

const file = process.argv[2]
const dump = JSON.parse(readFileSync(file, 'utf8')).rows[0].dump
const profiles: any[] = dump.profiles ?? []
const backups: any[] = dump.backups ?? []
const edges: any[] = dump.friends ?? []
const byUser = new Map(profiles.map((p) => [p.user_id, p]))
const byCode = new Map(profiles.map((p) => [p.code, p]))
const stateOf = (uid: string) => backups.find((b) => b.user_id === uid)?.state
// What a friend could see in the app: their public passport, never their private diary notes or
// favourites (stats.ts marks both private). The backup holds both, so they are taken out here.
const shared = (me: any) => ({
  visits: me?.visits ?? {},
  entries: Object.fromEntries(Object.entries(me?.entries ?? {}).map(([id, e]: any) => {
    const { notes, fav, wish, again, ...rest } = e
    return [id, rest]
  })),
})

mkdirSync('archive/summaries', { recursive: true })
for (const p of profiles) {
  const st = stateOf(p.user_id)
  if (!st?.me) continue
  const custom = Array.isArray(st.custom) ? st.custom : []
  const drinks = [...DRINKS, ...custom]
  const find = (id: string) => DRINK_BY_ID[id] ?? custom.find((d: any) => d.id === id)
  // the crew: everyone this guest had a live edge to, with the passport their own phone last backed up
  const crew = edges.filter((e) => e.user_id === p.user_id).map((e) => byCode.get(e.friend_code)).filter(Boolean)
    // B42Y-SHRY is an empty second passport of Sophia's, made on 4 October; CWT6-MZPS is hers
    .filter((f: any) => f.code !== 'B42Y-SHRY')
    .map((f: any) => ({ id: f.user_id, name: f.name, colour: f.colour, passport: shared(stateOf(f.user_id)?.me), isSelf: false }))
  const srcs = [{ id: p.user_id, name: p.name, colour: p.colour, passport: st.me, isSelf: true }, ...crew]
  const cards = deriveWrapped(drinks, st.me, srcs)
  const finale: any = cards.find((c: any) => c.kind === 'finale')
  const tried = Object.entries(st.me.entries ?? {}).filter(([, e]: any) => e.tried)
    .map(([id, e]: any) => {
      const d = find(id)
      return { id, name: d?.name ?? id, venue: d ? (VENUES[d.venue]?.name ?? d.category) : '', date: e.date ?? '', rating: e.rating ?? null, fav: !!e.fav, notes: e.notes ?? '' }
    })
    .sort((a, b) => a.date.localeCompare(b.date) || a.name.localeCompare(b.name))
  const out = {
    name: p.name, code: p.code, colour: p.colour, backupAt: backups.find((b) => b.user_id === p.user_id)?.updated_at,
    total: drinks.length, cards, certificate: finale ? certificateRows(finale) : [],
    medals: (cards.find((c: any) => c.kind === 'medals') as any)?.earned?.map((id: string) => BADGES.find((b) => b.id === id)?.name ?? id) ?? [],
    crew: crew.map((c) => c.name), tried,
  }
  writeFileSync(`archive/summaries/${p.code}.json`, JSON.stringify(out, null, 2))
  console.log(p.name, p.code, 'tried', tried.length, 'cards', cards.map((c: any) => c.kind).join(','))
}
