# A · Harbour by day

The content layer is iOS 26 in daylight: near-white and sand grounds, ink type, and the colour carried by the drinks (each glass icon in its family's own restrained hue). Floating over it is clear Liquid Glass chrome: a capsule of five tabs with a droplet that slides between them, a round Log button at its trailing end, a top bar that the large title collapses into, and glass sheets at two heights. The sea hero runs full bleed under the status bar as the loudest colour in the app, and the medals are struck metal in the second slot on Home.

Open `index.html` directly (file:// works). It makes no network requests. On a desk it draws a 390 by 844 phone with an iPhone's insets. At phone width, including a 390 iframe, it fills the viewport.

## States you can land on

`?screen=` accepts `home` (the default), `drinks`, `sheet` (Fool's Gold over Drinks, medium height), `sheet-large` (the same sheet at large height), `search` (the Log button's search, opened from Home), `medals` (the full case), `medal` (Gin Explorer opened over the case), `ship`, `crew` and `you`. `?hour=0..23` pins the sky, and `?day=YYYY-MM-DD` pins today (unset, the hero counts down to 3 October from the real date). A deep link lands on a still state. The coin's turn, the blue wave and the droplet's slide run only when a guest taps. The one exception is a bare `index.html` with no `?screen`: Home opens with Gin Explorer turning once, the new-medal moment, so a screenshot taken in its first 1.25 seconds catches the coin mid-turn. `?screen=home` lands with it at rest.

Everything else works by touch and by mouse: tabs (tap one, or put a thumb on the capsule and slide), Log (the capsule folds to the tab you came from and the button runs out into a search field; the dock rides above the keyboard), a row or a For you card opens the drink sheet (drag or tap the grab bar between medium and large, flick or drag down to close, tap outside, Escape), the tried checks, stars, Favourite and Wishlist, a coin opens its medal, "6 of 18" opens the case, the back button, and the shaker row (a shake, then an untried drink).

## The glass recipe

Everything below is built from layers iPhone Safari renders: `-webkit-backdrop-filter` blur, saturate and brightness, `mask`, and backdrop filters on pseudo-elements. There is no `url(#filter)` in any `backdrop-filter`, so there is no SVG displacement even as a Chromium enhancement: the verifying browser would then show a look no guest's phone has. An `.lg` element carries no filter of its own. Its layers, back to front:

| Layer | What it is | Numbers |
| --- | --- | --- |
| Body, `::before` | clear glass: the backdrop blurred a little, saturated and lifted, under a thin film | blur 6px (sheets 20px), saturate 180%, brightness 1.08, white film 16% |
| Edge lens, `::after` | a heavier, brighter backdrop filter masked to a soft frame: two gradients (top to bottom, left to right) that fade from each edge to nothing over the ring's width, added together, so the rim bends and lights what is behind it and melts into the clear centre. The foot is lensed at 70% and the right side at 80%, for the one light from the top left | ring 9px, blur 14px, saturate 170%, brightness 1.22, white 7%. The sheet meets the screen's edges on three sides, so its lens is a 16px band along its top edge, fading down, at brightness 1.16 |
| Specular, on the lens | one light from the top left: a lit upper rim, a little light down the left, the lower rim faintly shaded | inset `0 1.5px 0` white 85%, inset `1.5px 0 0` white 38%, inset `0 -1px 0` and `0 -10px 14px -12px` navy 14% |
| Sheen, `.lg-spec` | a soft gradient across the top third and a highlight at the top left, the only layer that changes on press (opacity) | radial white 42% to 0 at 46%, linear white 20% to 0 at 34%; opacity .75, 1 when pressed |
| Hairline | on the lens | inset `0 0 0 .5px` white 55% |
| Lift | the element's own shadow | `0 1px 2px` navy 10%, `0 10px 28px` navy 16% |

The tones of the same recipe:

- Clear (tab capsule, the search field, the back button): white film 16%, ink type.
- Dark (the two sea chips): navy `#062033` film 14% on the day chip and 24% on the readout, white type, rim 55%. The day chip sits under the date line, not at the top right, so the greeting has the full width: at the top right it pushed "Afternoon, Alex" onto two lines at 390.
- Tinted, the one primary action (Log): coral `#C72F50` film 90%, white type. It is the only tinted surface.
- Sheet: blur 20px. The film is white 36% at medium, where the page reads through, and 86% at large, for reading. The change is a `background-color` transition on the body layer, so the filter never animates.
- Droplet: the active tab's lens. It sits inside the capsule, so it has no backdrop filter (never glass on glass): white 42% with its own top-left specular, hairline and shadow, moved by `transform` only.
- Top bar: the scroll edge effect. Blur 8px and saturate 170% under a ground film of 74% that fades to nothing at its foot (masked), so rows slide under it and the small title holds.

Budget: at most four backdrop-filtered surfaces on screen. Each surface is two filter passes (body and lens), so four surfaces is eight passes, and the sheet's lens is only a 16px band. Home at rest has the day chip, the readout, the capsule and Log. Once Home scrolls far enough for the top bar to come in, and whenever Home is not the screen in front (another tab, or the case pushed over it), the chips drop their filters (`.hero-off`). Drinks scrolled has the capsule, Log and the top bar. With a sheet open, the dock is hidden, which leaves the sheet, plus the top bar or the chips. The medal case has the capsule, Log, back and the top bar.

Fallbacks: without `backdrop-filter`, and under `prefers-reduced-transparency`, every glass surface drops its lens and becomes a solid of the same tone (ground 94%, navy 86%, coral, the sheet at the ground colour), with the same shapes and hierarchy. The top bar becomes the ground.

## The backdrop

The glass always has colour behind it:

- **The sea hero.** It is the app's own shader (`SeaHero.tsx`: the sum-of-sines sea, the sun or the moon, the six palettes by hour with their half-hour cross-fade). Its tide line is completion, and the liner rides the swell, lifting by the water's height at stern and bow and pitching a third of the slope. There is no chip lens in the shader, because the chips are CSS glass. A CSS gradient of the same sky sits under the canvas, so a still render and a phone without WebGL are both right. It is the one live WebGL effect, and it pauses when Home is not showing, when a sheet is open, when the hero is off screen or when the tab is hidden.
- **The content.** It has colour in it: the family hues on the glass icons, the For you cards washed in their drink's colour, and the struck coins.
- **The bottom scroll edge.** Rows fade into the ground under the dock (ground at 45%), so the tab labels hold 4.5:1 over anything while 55% of the colour still shows through. At 62% the capsule read as a white pill on Drinks, Ship, Crew and You; at 45% the rows show through it, blurred.

## The medals

Struck metal in the real colour of each tier. These are material, as the sea is, so they sit outside the one-accent rule. That is the written reason for the divergence.

- Bronze, silver and gold. The Champion is gold with a sea-blue enamel field, the fourth finish, so the special medal is the only coin with colour in its field.
- Every coin is drawn in SVG with one light from the top left. The rim's outer face is a light-to-dark gradient, milled with 144 teeth (a dashed stroke). The rim's inner wall is shaded where the light cannot reach. The field sits below the rim, which casts a shadow onto its upper left, and is polished: lit at the top left, a darker mirror band just past the middle, a second light low right. That dark band is what makes silver read as silver rather than pale plastic, and it lets the frosted relief stand out. The emblem from `emblems-data.ts` is struck in relief: a shadow copy lower right, a highlight copy upper left, and the face in a metal gradient. The copies' offset scales with the coin's size (110 / px, between 0.8 and 2.6 units), so the relief is about a pixel deep on the 52px strip coins and the 224px sheet coin alike. A specular ellipse and a lit arc sit on the upper-left rim, with a shaded arc lower right.
- The reverse is the liner and two lines of sea, struck the same way. It shows as the coin turns.
- A medal not yet earned is the blank the die has not met: the same round shape, unstruck, in sand, never a grey coin. A close one carries its progress round it in the metal it will be struck in, from its mid tone to its dark one, so a silver arc still holds on the ground.
- On Home it is module 2, straight under the hero and inside the fold. Its head reads "Medals" with "6 of 18" and a chevron that opens the case. Below that come Gin Explorer, the new medal, at 112px with its name, tier and hint (it turns once on entry, then rests), the five other earned coins at 52px in tier order, each opening its medal, and the next in reach (Whiskey Lover, "1 more whiskey") on its blank with a metal progress bar.
- The full case lists Earned (the first large, the rest in a three-column set in tier order, each named with its tier), then Close with its progress, then Locked with what earns each.
- An opened medal shows the coin at 224px. It turns once when opened, tilts towards a finger with its light moving the other way, spins once more if flicked, and shows its name, tier, what it takes and the drinks that earned it ("Your 15 gins").

## Motion

- **Press.** A pressed glass control swells to 1.04 (the capsule 1.015) over 140ms and its sheen goes to full. On release it settles over 420ms on `cubic-bezier(.34, 1.56, .64, 1)`, one small overshoot, which the brief asks for.
- **Droplet.** It slides to the tapped tab over 480ms, eased per segment rather than as a whole (one easing over the whole run put the swell in its first 60ms, where no thumb sees it), stretching to 1.22 by 1.08 at 45% of the run and settling slightly narrow before rest. A thumb held on the capsule scrubs it along the tabs, lifted to 1.12, and on release it lands on the nearest tab.
- **Search morph.** The capsule narrows to a circle and the Log button widens into the field over 460ms, and the tint fades from coral to clear.
- **Sheet.** It rises over 440ms on the drawer curve and follows the finger. Past the top it resists (square root). A flick over 0.5px/ms decides the height; otherwise it goes to the nearest height, and it closes past 35% of the way from medium to the bottom. The blue wave (`SheetWave.tsx`'s shader, 2.4s) is the opening of a drink sheet. Its pane is now 78% rather than opaque, so the sheet is glass from the first frame and still glass when the water recedes. While a sheet is open, the sea stops.
- **Coin.** It turns once on entry, 1.25s, from a little tilt, round past 360 and back to rest.
- **Tick.** A tried check pops once when ticked (0.7 to 1.15 to 1).
- **Pushed screen.** The case slides in from the right over 420ms.
- **Reduced motion.** Every one of these becomes a fade (the droplet fades at its new place, the sheet fades in, the coin fades), the sea holds one frame, the wave does not run, and nothing scales.

## Contrast pairs

Each pair composites the surface's films over the lightest and the darkest thing that can sit behind it, then takes the WCAG ratio. Blur is ignored, which is the conservative case: blur only pulls the backdrop towards its mean. The darkest content is the shadow side of a bronze coin, `#3E2410`. All pass.

| Surface | Text | Over the lightest | Over the darkest | Needs |
| --- | --- | --- | --- | --- |
| Tab capsule (edge 45%, brightness 1.08, film 16%) | ink `#1C3C56` label 12/600 | 11.47 (ground) | 4.51 (bronze shadow) | 4.5 |
| Droplet (plus 42% white) | ink label 12/700 | 11.47 | 6.94 | 4.5 |
| Droplet | coral-ink icon (graphic) | 5.32 | 3.87 | 3 |
| Log (coral 90%) | white label 12/700 | 4.62 (over ground) | 5.07 | 4.5 |
| Top bar (ground 74%, film 12%) | ink title 17/600 | 10.90 | 6.96 | 4.5 |
| Sheet, medium (film 36%) | ink body | 11.47 | 6.36 (silver coin shadow side) | 4.5 |
| Sheet, medium | ink-2 on glass, 84%, meta 13 | 7.09 | 4.58 (silver coin shadow side); 5.01 (a small dark coin under 20px of blur) | 4.5 |
| Sheet, large (film 86%) | ink-2 on glass meta 13 | 7.09 | 5.75 (night sea `#041D2E`) | 4.5 |
| Hero greeting, top scrim navy 44% | white 30/700 and 15/600 | 4.99 (dawn sky 30% down) | 16.65 (night) | 4.5 |
| Day chip (scrim plus navy 14%) | white 13/600 | 5.94 (dawn, 30% down) | 16.65 (night) | 4.5 |
| Readout (navy 24%) | white 44/700 | 4.21 (morning water at the waterline) | 11.66 (night) | 3 |
| Readout | white 13/600 | 7.03 (morning, 55% up the water) | 14.05 (night) | 4.5 |
| Ground `#FBF8F2` / sand `#F3EDE2` | ink body | 10.83 / 9.85 | | 4.5 |
| Ground / sand | ink-2 74% meta | 5.10 / 4.84 | | 4.5 |
| Ground / sand | coral-ink reason 13/600 | 5.01 / 4.56 | | 4.5 |
| Glass icons on their 14% disc | family hue (graphic) | lowest 3.85 (pint), highest 6.77 (wine) | | 3 |

The two "silver coin shadow side" cells above were composited from the silver as it was before 23 September; the silver is darker now (a mirror band down to `#7D8996`, shadow `#2F3A46`), and the measured rows below supersede them.

### Measured in Brave, 23 September

Read from the render, not composited on paper: each text box's rendered pixels at 390 in a same-origin iframe, the half furthest from the text colour taken as its background, the ratio given for the median background pixel and for the worst one. Ink-2g is composited at 84% over each pixel.

| Surface, state | Text | Median | Worst | Needs |
| --- | --- | --- | --- | --- |
| Capsule, Home and Drinks | tab label 12/600 | 11.17 to 11.47 | 10.36 | 4.5 |
| Droplet, Home and Drinks | tab label 12/700 | 10.99 to 11.14 | 10.37 | 4.5 |
| Log (coral) | white label 12/700 | 4.63 | 4.62 | 4.5 |
| Day chip, 13:00 / 19:00 / 23:00 | white 13/600 | 5.77 / 7.01 / 13.26 | 5.44 / 6.70 / 12.89 | 4.5 |
| Readout, 13:00 / 19:00 / 23:00 | white 44/800 | 5.48 / 7.30 / 12.46 | 4.32 / 5.79 / 10.38 | 3 |
| Readout, 13:00 | white 13/600 | 5.64 | 5.18 | 4.5 |
| Greeting and date, 13:00 | white 30/700, 15/600 | 7.72, 7.17 | 7.41, 6.88 | 4.5 |
| Medium sheet over Drinks | ink-2g meta 13 | 7.04 to 7.09 | 7.00 | 4.5 |
| Medium sheet over Home's medal case (silver coin, bronze strip) | ink-2g meta 13 | 6.35 to 7.09 | 6.13 | 4.5 |
| Large sheet | ink-2g meta 13 | 6.83 to 6.92 | 6.80 | 4.5 |
| Search field | ink-2g placeholder 17 | 7.09 | 7.09 | 4.5 |

Backdrop-filtered surfaces, counted from the live page: Home at rest 4 (chip, readout, capsule, Log); Home scrolled 3 (capsule, Log, top bar); Drinks, Ship, Crew, You and search 2, plus the top bar once scrolled; the case 3 (back, capsule, Log), plus the top bar once scrolled; a sheet over Drinks 1; a sheet over Home 3 (sheet and the two chips); the medal over the case 2 (back, sheet). Before this pass the case counted 5 and the medal 4, because the covered Home hero kept its two chips filtered. The frame's `scrollWidth` is 390 in every state, and 320 at 320.

Two ink levels were added for glass: `--ink-2g` (84%), because the 74% secondary ink measured 3.71:1 on the medium sheet over a silver coin, and the hero's top scrim at 44%, because 34% left the date line at 4.04:1 under the dawn sky.

## Divergences from DESIGN.md, and why

- There is a droplet under the active tab. DESIGN.md's Navigation rules out an indicator pill. The brief asks for the droplet by name, and it is the brief's liquid morph.
- There is spring-like settle on release. DESIGN.md bans overshoot on UI state. The brief asks for the settle.
- Metal colour is used on the medals, the tier's metal on the progress bar of the next medal, and the family hues on the glass icons. DESIGN.md's colour table allows none of these. The brief makes the metals material, and direction A has the drinks carry the colour.
- The type scale follows iOS: a large title of 34px, a section heading of 20px, and 12px tab labels (the floor).
- In the drink sheet, Tried, Favourite and Wishlist come straight under the title, so logging is visible at medium height without a drag. Rating follows, then the details. Recommend is left out of this prototype.

## Not built here

- The shaker. The row shakes its icon and opens an untried drink; the Shake sheet stays as it is in the app.
- The drink filter panel, the venue sheet (a bar opens its group on Drinks instead), Wrapped and the roundup's crew slides. The crew slides go into the app in its current look, as the brief says.
- Ship, Crew and You are one honest screen each.

## For the render pass

What the Brave pass on 23 September found, item by item: (1) the ring read as a hard band, a pill inside a pill, on the sea chips; it is now the soft frame above. Safari still has to be seen. (2) Needs a phone. (3) The stretch reads as liquid, but one easing over the whole run put it in the first 60ms; it is now eased per segment and peaks at 45% of the run. (4) The relief was under a pixel deep on the strip coins, and 1.4, 1.6 would still have been; the offset now scales with size, and silver gained the polished field. (5) Passes, 6.13 at worst. (6) Nothing clipped at 390. At 320 the five tabs ran under Log, so the dock tightens under 360 (Log 56px, 8px margins), and "Sun Princess Champion" wraps in the case.

The original list:

1. In Brave and on an iPhone, check that the edge lens ring (the masked `::after` with its own backdrop filter) shows as a brighter, softer rim rather than a hard band. If Safari ignores the mask on a backdrop-filtered pseudo-element, drop `--lg-lens-bright` to 1.1 and the ring to 6px.
2. On a phone, check that the sheet rises without dropping frames. It is the largest filtered surface (20px blur over the whole sheet, plus the 16px lens band). If it stutters, take the body blur down to 14px before touching anything else.
3. Check that the droplet's stretch reads as liquid, not as a squashed pill, at 1.22 by 1.08.
4. Check that the relief on the 52px coins in the strip still reads as struck. If not, raise the shadow copy's offset from 1, 1.2 to 1.4, 1.6.
5. Check the medium sheet over Home's medal case: the silver feature coin is the darkest large thing that can sit under it.
6. Check the seed's cards and rows for clipped text at 390, and the case strip and the heading "6 of 18" at 320. If the For you shelf is missing in Brave, suspect its content blocking before a bug (`.rec` is the shortest class on the page).

The data block at the head of `a.js` was generated from `src/data/raw.ts`, `glassByDrink.ts`, `emblems-data.ts`, `badges.ts`'s rules and the `?seed` block in the app's `index.html`, so the drinks, venues, glasses, emblems and the seed's 58 of 214 (6 of 18 medals, Whiskey Lover 9 of 10) are the app's own.
