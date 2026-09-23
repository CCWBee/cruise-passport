# Polish two: medals, the shaker's feel, the Log glass, the icon, the shake card

23 September 2026, after the night-bar redesign went live at `d16ded8`. Charles, verbatim: "Can we
do a quick rework of the medal icons like what are they half of them? The shaker doesn't do haptics
but it's possible via weird api stuff so check that out, the glass on the log button look off it's
got like a darker square in it as opposed to whatever we went for favicon is still shagged, shaker
also has no sound. Shake for a drink button should be on a card to be like here! button!
Essentially."

## 1. Medal emblems that say what the medal is

Today several emblems (the sunrise over a bar that First Sip, Ten Down, Twenty Five and Fifty share
in some form) do not say what they are for. Every medal's face must be readable at 44px as what it
rewards:

- **Count medals** (First Sip, Ten Down, Twenty Five, Fifty, One Hundred, One Fifty, Two Hundred): the
  number struck on the coin, as a real medal carries it (1, 10, 25, 50, 100, 150, 200), in a strong
  engraved numeral with room to breathe; First Sip may be a single glass with a small "1" if that
  reads better.
- **The drink medals** use the drink's own glass from the app's glass family icons (`src/ui/Icon.tsx`,
  the nine `IconGlass*` shapes, both sides of every bowl): Martini Club a cocktail glass, Margarita
  Queen a margarita glass with its lime, Wine Connoisseur a wine glass, Whiskey Lover a rocks glass,
  Coffee Expert a cup, Brain Freeze a snowflake or ice, Gin Explorer a juniper sprig, Rum Captain an
  anchor or ship's wheel, Every Bar a compass or map pin, Cocktail Master a shaker (the app's
  `IconShaker` shape), and the Champion a laurel round the liner.
- Struck in relief exactly as `Coin.tsx` strikes the current emblems (shade copy, highlight copy,
  face in the metal), legible at 44, 56, 96 and 196px in every room. The emblems live in
  `src/features/badges/emblems-data.ts`; nothing else draws a medal.

## 2. The shaker's haptics on iPhone

Charles: haptics are "possible via weird api stuff". iOS Safari has no Vibration API; since iOS 18
toggling an `<input type="checkbox" switch>` gives a system haptic, and a label click can toggle it
from script. Research the current, documented behaviour before building (when it fires, whether it
needs a user gesture, whether a timer can trigger it, whether it works in the home-screen app), then
make `haptic()` in `src/ui/haptic.ts` fire on iPhone for the press and, wherever the platform allows,
the knocks and the landing. Say plainly in DESIGN.md what fires on iPhone and what cannot.

## 3. The shaker's sound on iPhone

The rattle is synthesised Web Audio (`src/features/shake/rattle.ts`). On iPhone Web Audio is silenced
by the ring/silent switch unless the page asks for playback: set `navigator.audioSession.type =
'playback'` (Safari's Audio Session API) before starting, where it exists, and make sure the
AudioContext is created and resumed inside the press handler. Check the defaults too (is sound on by
default, does reduced motion or the quiet setting silence it). Research and state what iPhone does.

## 4. The Log button's glass on Safari

On Charles's iPhone the round Log button shows "a darker square in it". Chromium draws it round and
clean (`tools/qa/sweeps/*/home-*.png`), so it is WebKit-specific. Reproduce it in real WebKit
(Playwright's WebKit build, headless, inside `tools/qa/capped.ps1`), find which layer is square (a
backdrop-filtered pseudo-element not clipped by its border-radius under `isolation` and a negative
z-index is the first suspect), fix it in the glass engine so every round or pill glass surface is
clipped on WebKit, and check the tab bar, the droplet, the sheet, the sky chip and the toast in
WebKit too.

## 5. The icon

Every live icon file is now intact, but the drawing reads as a "7": the glass has one side of its
bowl. Redraw the app icon as a proper glass (both sides of the bowl, a stem, a foot), in the night
bar's look, at every size (`favicon.svg`, 32, 180, 192, 512 and the maskable 512 with its safe
zone), with the manifest's `theme_color` and `background_color` moved off the old cream. iPhone keeps
touch icons by URL for a long time, so publish them under new file names and point `index.html` and
the manifest at those, so a phone fetches them fresh.

## 6. "Shake for a drink" as a card

Home's shake row becomes a card that says "tap me": the shaker drawn small (`IconShaker` or the
`Shaker` art at a small size), "Shake for a drink", and a short line of what it does, as one
tappable glass-or-velvet card in For you's section, the obvious thing to press. It is the one other
box on Home beside the medal tray and the For you shelf: it must not become a wall of identical
boxes, so it takes a different shape from the For you cards.

## Done means

Rendered: the medals, the shake card and the icon in a capped headless sweep at hours 13, 19 and 23;
the glass in WebKit. The gates green (`npm test`, `npx tsc -b`, `npm run lint` with no errors, `npm
run design:check`, `npm run build`), DESIGN.md true, pushed live. Haptics and sound can only be
proven on a real iPhone; say what was verified and what Charles must feel for himself.
