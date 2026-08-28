# Sun Princess Cocktail Passport

An offline-first PWA cocktail passport for the *Sun Princess* cruise (3–17 October 2026): browse the
214 drinks aboard, filter them, tick them off, rate and log them by day, earn 3D award medallions,
and see your voyage as a *Cruise Wrapped* story. Built in a **"Liquid Sea Glass"** design language —
Apple Liquid Glass material over a warm beach palette, with a living WebGL sea whose tide-line is your
completion.

**Live demo:** https://ccwbee.github.io/cruise-passport/?seed &nbsp;·&nbsp; the `?seed` loads sample
data + two friends so every surface is populated. Drop `?seed` to start from an empty passport.

## Highlights

- **Six surfaces** — a living-sea Home, a faceted Drinks browser (self-excluded live counts,
  segmented controls), a bow-to-stern Ship deck map, hand-rolled Stats charts, a Badges wall, and a
  15-day travel-journal Log.
- **3D award medallions** — react-three-fiber matcap-metal coins, 18 unique embossed emblems, spun
  and struck; lazy-loaded so they cost nothing until opened.
- **Cruise Wrapped** — a Spotify-Wrapped-style story of your voyage, built from real data.
- **Social, woven in** — friends join by an offline share-code merge; their ratings, recommendations
  and comments surface *in context* (a "recommended by" line, friend-dots, group best-bars), never as
  a separate tab, and invisible until you add a friend.
- **Offline-first PWA** — installable, works with no network (it is a cruise, at sea).

## Stack

Vite · React + TypeScript · react-three-fiber / three · Zustand · vite-plugin-pwa. No backend today;
the social layer is offline share-codes with a pluggable sync seam for a future hosted API.

## Develop

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # production build (base = /cruise-passport/)
```

Deployed to GitHub Pages by the `Deploy to GitHub Pages` Actions workflow on every push to `main`.

## Not wired up yet

Marked in-app with a *Coming soon* tag: drink photos, the Wrapped 3D finale, and the Wrapped
share-image export. Async group games and a live sync backend are on the roadmap.
