# The glass revolution: three directions, prototyped for a phone

23 September 2026. Charles, verbatim: "the ui would you say fixed and brought up to modern standards
before it was wordy and cluttered not fun, Liquid Glass you can see was meant to be there by the blue
wave when opening pages but it's not made it too deep and it needs to run on phones, essentially
isn't ready to go yes or no if not get it working and revolution not tweak the ui to clean it up make
it easier to use look at etc".

## The verdict that starts this

Not ready. The declutter took words and boxes out, but the app is still a tidy cream list app, and
the Liquid Glass it was meant to have is not there in any way a guest would see:

1. **There is nothing behind the glass.** Every screen is cream ground (`#FBF3E2` with two washes no
   darker than `#F7ECD3`), and glass over a flat fill is a flat panel. The glass bible's own rule:
   "glass over a dead-flat fill looks lifeless".
2. **The films are nearly opaque.** The sheet carries a white film of 88%, the nav and chips 46 to
   62%, so every glass surface reads as frosted cream; Liquid Glass is clear, lensed at its edges and
   lit from one side.
3. **The one liquid moment is the blue wave.** `SheetWave` washes the sea across a sheet as it opens,
   then leaves an opaque pane. It is the only place the intended material shows, for 2.4 seconds.
4. **Nothing is lensed, lit or morphing** outside the sea hero's two chips: no refraction at edges,
   no specular highlight, no droplet that moves between tabs, no control that swells when pressed.
5. **Not fun.** Nothing in the chrome responds to a thumb beyond a 0.97 press scale; the delight is
   confined to the shaker and the sea.
6. **The medals are grey and buried.** The design audit made the tier ladder "four steps of ink"
   (`badges.css`: a tier is an ordinal, so no gold enters badge art), so every medal is a flat slate
   disc with a small pale emblem. They live two taps deep (You, then the Badges segment), and Home
   shows one only once, in the new-medal moment. Charles, the same night: "Make sure the medals work
   are good looking and prominent enough".

## What every direction must do

- **Run on phones, iPhone Safari first** (the guests' phones), at 60fps on an iPhone 12 class
  device. That rules the technique:
  - Safari supports `-webkit-backdrop-filter` with blur, saturate and brightness, `mask-image`, and
    backdrop filters on pseudo-elements; it does **not** support `url(#svg-filter)` in
    `backdrop-filter`, so SVG displacement refraction is a Chromium-only enhancement and never the
    effect itself.
  - The Liquid Glass look is therefore built from layers Safari renders: a clear body (blur 2 to 8px,
    saturate 160 to 190%, brightness 1.05 to 1.12, a film of 8 to 25%), an **edge lens** (a
    pseudo-element with a heavier backdrop blur and brightness, masked to a ring 6 to 12px wide
    round the shape, so the rim bends and brightens what is behind it while the centre stays
    clear), a **specular** (one light from the top left: an inset highlight on the upper rim, a
    faint inner shade on the lower, and a soft gradient sheen across the top third), a hairline, and
    a soft drop shadow for lift. Colour comes through from behind; tint only the one primary action.
  - At most four backdrop-filtered surfaces on screen at once; never animate `backdrop-filter`
    itself (move the element, not the filter); WebGL for one live effect per view at most.
  - The non-blur fallback and `prefers-reduced-transparency` path exist and hold contrast;
    `prefers-reduced-motion` keeps every state change as a fade.
- **Give the glass something to show.** A backdrop with colour and movement behind the chrome: the
  sea and sky, light, or content with colour in it. A glass surface over flat cream is the failure
  this brief exists to end.
- **Easier to use.** The primary action, logging a drink, is one tap from every screen: the tab bar
  becomes a floating Liquid Glass capsule of the five tabs with a separate round glass button at its
  trailing end that opens search to log a drink (iOS 26's search-tab pattern). The active tab is a
  glass droplet that slides to the tapped tab and swells a little on the way (the liquid morph).
  Large titles collapse into a glass top bar on scroll (a scroll edge effect). Sheets are glass with
  two heights: medium lets the screen show through and read as glass; large goes more opaque for
  reading.
- **Fun.** Controls answer a thumb the way Liquid Glass does: a pressed glass button swells (scale up
  to about 1.04) and its specular brightens, and it settles on release on a short spring-like ease;
  the droplet slides; the blue wave stays as the sheet's signature opening and hands over to a sheet
  that is still glass when it ends; the shaker stays.
- **Medals that look like medals, and are in view.** The medals are the app's reward, so they get
  the one exemption from restraint:
  - **Struck metal in its real colour**: bronze, silver and gold, and a fourth finish for the
    special (the Champion). The metals are material, as the sea is, not an accent, so they sit
    outside the one-accent rule; that is the written reason for the divergence. Relief: a raised
    rim (milled or bevelled), the emblem struck in and catching the same top-left light as the
    glass, a highlight that reads as metal rather than a flat fill. The emblems are the drawn ones
    in `src/features/badges/emblems-data.ts` (SVG strings keyed by badge id); reuse them. A locked
    medal is the same coin shape, unstruck and quiet, never a grey version of an earned one.
  - **Prominent**: the medals are visible on Home without hunting, and never more than one tap from
    it: the case (earned coins, the count, and the next one in reach with its progress) sits in
    Home's rank order where a guest sees it, and opens the full case. The full case is a screen a
    guest wants to open: earned coins large in tier order, then the ones in reach with progress,
    then the locked blanks with what earns them. No grey grid, and not a wall of identical boxes.
  - The new-medal moment stays as the app's one spectacular moment: the coin turns once on entry,
    then rests.
  - Real seed state: 6 of 18 earned (First Sip, Ten Down, Twenty Five, Fifty, Martini Club, Gin
    Explorer); close: Whiskey Lover 9 of 10, Wine Connoisseur 8 of 12, Rum Captain 7 of 12, One
    Hundred 58 of 100, Cocktail Master 27% of 50%, Every Bar 15 of 28; locked: Margarita Queen,
    Brain Freeze. Tiers and hints are in `src/data/badges.ts`.
- **Keep what is right.** The data, the flows and the copy the declutter settled; British English,
  no em dashes, sentence case; the four banned tells (no pill or dot eyebrow, no rule along a heading
  or box, no emoji as UI, no wall of identical rounded boxes); 44px targets; WCAG contrast on every
  surface in every state, measured; one filled accent per screen; the glass icons and the shaker from
  this week.

## Three directions

Each builder takes one and pushes it to its best version; do not converge.

**A. Harbour by day.** iOS 26 faithful and light. The content layer is crisp: near-white and sand
surfaces, ink type, and colour carried by the drinks themselves (the glass icons in a restrained
palette by family). Floating clear Liquid Glass chrome over it: the capsule tab bar and its droplet,
the round Log button, the collapsing glass top bar, glass sheets. The sea hero goes full bleed,
under the status bar, and is the loudest colour in the app. Glass reads because content scrolls
under it.

**B. Open water.** Immersive, in the manner of Apple's Weather app. The sky and sea by the time of day
is the backdrop of every screen (the hero's palettes: dawn, day, golden hour, dusk, night), fixed
behind scrolling content, and the content sits on glass platters over it, light glass with ink by
day and dark glass with light type at dusk and night. The whole app feels like being on deck. The
blue wave is at home here. Hardest on contrast: every platter measured against the brightest and
darkest backdrop it can sit on.

**C. Night bar.** Bold and warm. The world is a ship's bar after dark: a deep ink and navy base with
warm light (the coral and a low amber) pooling behind the glass, luminous glass chrome with bright
rims, the drink glasses drawn as lit line icons, generous type. Playful and confident, a room you
want to be in at eleven at night, still legible at noon on deck (it must pass in daylight too: say
how).

## What each prototype is

A clickable, self-contained page at `prototypes/2026-09-23/<letter>/index.html` (with any files it
needs beside it, no build step, no framework, no network: fonts from the system stack), mobile first
at 390 by 844 and full screen on a phone, centred on a desktop. Real content from the app
(`src/data/raw.ts`: real drink names, bars, decks, the seed's 58 of 214), not lorem ipsum. It shows,
and lets a thumb move between: Home (the hero, For you, the shake row), Drinks (search, a venue
group of rows with their glass icons, tried checks), a drink sheet opened from a row (medium, then
dragged or tapped to large, then closed), the Log button opening search, the tab bar moving
between tabs, the medals on Home, the full medal case, and one medal opened (the coin large, its
name, tier and what earned it). The other tabs can be a single honest screen each. A short `README.md` beside it says
what the direction is, the glass recipe it uses and its measured contrast pairs.

Checked in Brave (never headless Chrome) at 390 wide in an iframe, and on a phone through a
Cloudflare Pages preview. The choice between the three is Charles's; the prototypes exist so he can
make it with a thumb rather than from a description.

## Alongside, in the app: the crew in the roundup

Charles, 23 September: "may as well use social data in the roundup too". Wrapped (the roundup) has
one crew slide today (how many friends, the taste twin, what the group found together, drinks you
both loved). The crew's data says more than that, so the roundup gains crew slides built from what
the synced passports already hold, each insight and never a ranking (DESIGN.md, Social): the
crew's favourite drink, the drink that split you, your find nobody else tried, and one the crew
loved that you missed, to try next time. That is data and copy, so it goes into the app now, in the
current look; the chosen direction restyles Wrapped with everything else.
