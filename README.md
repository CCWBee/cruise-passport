# Sun Princess Cocktail Passport

An offline-first PWA cocktail passport for the *Sun Princess* cruise (3–17 October 2026): browse the
214 drinks aboard, filter them, tick them off, rate and log them by day, earn 3D award medallions,
and see your voyage as a *Cruise Wrapped* story. Designed as a pocket logbook for the second-hundredth
use: content flat on a sand ground, one accent, a living WebGL sea on Home whose tide-line is your
completion. The design contract is `docs/DESIGN.md`.

**Live:** https://cruise.charlesbee.org &nbsp;·&nbsp; https://cruise.charlesbee.org/?seed loads sample
data + two friends so every surface is populated. Drop `?seed` to start from an empty passport. The
old `ccwbee.github.io/cruise-passport` address is a redirector now, nothing more.

## Highlights

- **Six surfaces:** a living-sea Home, a faceted Drinks browser (self-excluded live counts,
  segmented controls), a bow-to-stern Ship deck map, hand-rolled Stats charts, a Badges wall, and a
  15-day travel-journal Log.
- **3D award medallions:** react-three-fiber matcap-metal coins, 18 unique embossed emblems, spun
  and struck; lazy-loaded so they cost nothing until opened.
- **Cruise Wrapped:** a Spotify-Wrapped-style story of your voyage, built from real data, ending in a
  certificate you can save or share as an image.
- **Social, woven in:** friends join by a link, a QR or a code; their ratings, recommendations
  and comments surface *in context* (a "recommended by" line, friend-dots, group best-bars), not only
  on the Social tab, and invisible until you add a friend.
- **Offline-first PWA:** installable, works with no network (it is a cruise, at sea).

## Stack

Vite · React + TypeScript · react-three-fiber / three · Zustand · vite-plugin-pwa. Supabase is the
backend: anonymous auth, the friend graph, groups and a passport backup. It is optional, so with no
keys configured the app still runs as a guest, offline, on share codes alone.

## Develop

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # production build (base = /)
```

Deployed to Cloudflare Pages by GitHub Actions on every push to `main`, which also publishes the
`redirect/` page to GitHub Pages so old links land on the live site.

## Docs

`docs/DESIGN.md` is the design constitution (thesis, geometry, colour, type, per-screen module order,
the working process and the registry of primitives); `docs/DESIGN-AUDIT.md` records why the earlier
look read as sloppy. `npm run design:check` (also run in CI) fails on CSS that leaves the system.
`tools/qa/` is the screenshot and scan harness. `docs/PRODUCTIONISATION.md` is the plan from demo to
hosted product. `docs/RATIONALISATION.md` is the 1 September pass that collapsed the parallel threads
to one backend, one origin and one crew roster, and records what was cut.
