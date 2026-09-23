// Writes prototypes/2026-09-23/b/data.js from the app's own data: raw.ts, glassByDrink.ts, the emblems,
// and the ?seed passport rules in index.html. Run from the repo root with node (type stripping).
import * as R from 'file:///E:/claude-projects/cruise-passport/src/data/raw.ts';
import { GLASS_BY_DRINK } from 'file:///E:/claude-projects/cruise-passport/src/data/glassByDrink.ts';
import { EMBLEMS } from 'file:///E:/claude-projects/cruise-passport/src/features/badges/emblems-data.ts';
import fs from 'node:fs';
const r: any = R;
const drinks: any[] = [];
r.COCKTAILS.forEach((c: any, i: number) => drinks.push({ id: 'd' + i, n: c[0], v: c[1], c: c[2], sp: c[3], ing: c[4], fl: c[5], sw: c[6], st: c[7], fz: c[8], p: c[9], ds: c[10], ok: c[11] }));
r.WINES.forEach((w: any, i: number) => drinks.push({ id: 'w' + i, n: w[0], v: 'crooners', c: 'Wine', sp: ['Wine'], ing: w[1] + ' by the glass', fl: [w[1] === 'Red' ? 'Bitter' : 'Refreshing'], sw: w[0] === 'Moscato' ? 5 : 2, st: 2, fz: false, p: w[2], ds: 'Poured across the ship.', ok: true }));
r.BEERS.forEach((b: any, i: number) => drinks.push({ id: 'b' + i, n: b[0], v: 'themix', c: 'Beer', sp: ['Beer'], ing: 'Bottle or can unless marked draft', fl: ['Refreshing'], sw: 1, st: b[0].indexOf('0.0') > -1 ? 0 : 2, fz: false, p: b[1], ds: 'Available fleet wide. Add $2 at pool bars to make it a michelada.', ok: true }));
for (const d of drinks) d.g = (GLASS_BY_DRINK as any)[d.n] || 'cocktail';
// the ?seed passport (index.html): 44 cocktails, 8 wines, 6 beers, dated across the first week
const DAYS: string[] = []; { const d = new Date('2026-10-03T12:00:00'), e = new Date('2026-10-17T12:00:00'); while (d <= e) { DAYS.push(d.toISOString().slice(0, 10)); d.setDate(d.getDate() + 1) } }
const me: Record<string, any> = {};
const seed = (id: string, day: string, rating: number, fav: boolean, wish: boolean) => { me[id] = { t: 1, day, r: rating }; if (fav) me[id].f = 1; if (wish) me[id].w = 1 };
for (let i = 0; i < 44; i++) seed('d' + i, DAYS[i % 7], (i % 5) + 1, i % 4 === 0, i % 6 === 0);
for (let i = 0; i < 8; i++) seed('w' + i, DAYS[i % 7], (i % 5) + 1, i % 3 === 0, false);
for (let i = 0; i < 6; i++) seed('b' + i, DAYS[i % 7], (i % 4) + 1, false, i % 2 === 0);
['d80', 'd81', 'd90', 'w15', 'b20'].forEach((id) => { me[id] = { w: 1 } });
const visited = ['goodspirits', 'omalleys', 'princesslive', 'bellinis', 'coffeecurrents', 'wheelhouse', 'catch', 'crowngrill', 'butchers', 'spellbound', 'crooners', 'makoto', 'umai', 'sabatinis'];
const venues: any = {};
for (const [k, v] of Object.entries<any>(r.VENUES)) venues[k] = { name: v.name, deck: v.deck, type: v.type, hours: v.hours, blurb: v.blurb, shares: v.shares || null, visited: visited.includes(k) };
const out = `// GENERATED from the app's data (src/data/raw.ts, glassByDrink.ts, features/badges/emblems-data.ts)
// and the ?seed passport rules in index.html. Real names, venues, prices and glasses; do not hand-edit.
window.PB_DATA = ${JSON.stringify({ days: DAYS, venues, drinks, me, emblems: EMBLEMS })};
`;
fs.writeFileSync('E:/claude-projects/cruise-passport/prototypes/2026-09-23/b/data.js', out);
const tried = Object.values(me).filter((e: any) => e.t).length;
console.log('drinks', drinks.length, 'tried', tried, 'bytes', out.length);
const gin = drinks.filter(d => me[d.id]?.t && d.sp.includes('Gin')).length;
const wh = drinks.filter(d => me[d.id]?.t && (d.sp.includes('Whiskey') || d.sp.includes('Bourbon'))).length;
const rum = drinks.filter(d => me[d.id]?.t && d.sp.includes('Rum')).length;
const wine = drinks.filter(d => me[d.id]?.t && d.c === 'Wine').length;
const coffee = drinks.filter(d => me[d.id]?.t && d.c === 'Coffee').length;
console.log({ gin, wh, rum, wine, coffee });
console.log('crooners untried', drinks.filter(d => d.v === 'crooners' && !me[d.id]?.t).map(d => d.n).slice(0, 5));
console.log('day5 (', DAYS[4], ')', drinks.filter(d => me[d.id]?.day === DAYS[4]).map(d => d.n + '@' + d.v));
