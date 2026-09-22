# Declutter: fewer words, fewer lines, one thing at a time

22 September 2026. Charles, verbatim: "make sure we've declutterred the ui as it's a bit dense
wordy", pointing at `jakubkrehel/skills` (better-writing, better-layout, better-interface) and
`emilkowalski/skills` (emil-design-eng, mobile-native) as the standard. The audit that produced the
change list below is `wf_e3866d7c-5a7` (seven read-only lenses and a synthesis); every change in
it carries its file and line, its before and after, and its reason. Read `docs/DESIGN.md` in full
before touching anything, then this spec, then the files your stream owns.

## The rule behind every change

Delete first; then use the platform; then reuse what the project has; then correct the value; add
only when nothing else will do. A helper line that restates its label, a meta line that repeats what
the screen already shows, a sentence explaining what the control makes obvious, a second route to
the same place and a number shown twice on one screen are the things that go. Guardrails are
shortened, never removed: the consent line, `GUEST_HONESTY`, the privacy note's facts, every error
that names its recovery, every sheet's one meta line (its wording may change; its existence may
not). Isabel's catalogue text in `src/data/raw.ts` is data and is not edited; which of its fields a
screen shows is a UI decision.

## Rulings on the audit's open questions

Charles asked for the declutter, so these are made here, each in the direction of fewer elements,
and reported to him with the result:

1. **Per-deck completion lives on Stats.** Ship's deck headings become plain ("Deck 17"): a shared
   list is counted once in the heading and twice in the rows beneath it, so the heading contradicts
   its own rows, and Ship's rows already answer "what is done". Stats keeps "Where you have been" and
   its deck bars. The audit's Stats change that removes the deck bars is **not** made.
2. **The masthead leaves the five tabs.** It stays on Entry and Landing, the two screens a cold
   visitor meets (every cold visitor reaches one of them first: `App.tsx`), and the greeting becomes
   Home's first line again.
3. **The filter panel's Where group is the six deck chips.** The venue clouds and their deck
   subheadings go; a bar is found by typing its name (search already matches it) or from its sheet on
   Ship.
4. **Home before sailing loses "The ship" facts row**; For you moves up into its place.
5. **The drink sheet loses "Order again"** (the field stays in `restore.ts`, so old backups still
   merge) **and "Also at <bar>"**. Favourite already says "I would have it again", and the bar's group
   and its sheet already list its other drinks.
6. **A drink the guest added is honest about what it is:** no invented sweetness, strength or ABV, no
   Recommend chip and no crew Comment, because `share.ts` never sends it to the crew.
7. **Meta lines carry the one fact the controls do not show.** Add a drink: "Only you will see it."
   Add a venue: "Only the deck and name are needed." (so the Hours and Notes hints go entirely, and
   Hours gains the placeholder "4pm to late"); editing a venue: "The drinks logged here stay logged."
   A new sailing: "Only the ship and dates are needed. You add the bars next." (so the "Optional."
   hint goes); editing one: "Your logged drinks stay where they are."
8. **Add to your crew keeps one idle line:** "Their code is at the top of their Crew page." It is the
   one fact nothing else on the sheet gives.
9. **Every empty list on You takes one shape:** a short line and one filled "Log a drink" (Stats'
   present shape), minted once as a shared class in `src/styles/base.css` and used by Stats, Badges
   and Log.
10. **The venue sheet's meter goes**; its text line ("6 of 44 tried") carries the number, the row
    behind the sheet shows it, and every drink below carries its own check.
11. **Wrapped loses "Certificate of a voyage"** from the card and from the saved picture alike.
12. **The Shake sheet's copy is the shaker fold's** (`docs/specs/2026-09-22-shaker-fold.md`), so one
    writer owns those files. Home's shake row losing its subtitle is the home stream's.

## Who owns what

Seven builders run at once, each in its own git worktree, on disjoint files. A builder touches its
own files and nothing else; anything it needs changed elsewhere goes in its report.

| Stream | Owns | Also carries |
| --- | --- | --- |
| fold | `src/features/shake/**`, `src/styles/tokens.css`, the `.btn` rules in `src/styles/base.css`, `tools/qa/design-allow.txt`, `tools/qa/shake-live.mjs`, DESIGN.md's Motion, Iconography and Shake sheet sections and the shaker's registry rows | the shaker fold spec in full |
| home | `src/features/home/**` (including `DiscoverTogether.tsx`), `src/features/wrapped/WrappedTeaser.tsx` | Home's shake row loses its subtitle |
| drinks | `src/features/drinks/**`, `src/data/model.ts` | |
| ship | `src/features/ship/**`, `src/features/cruise/SailingSheet.tsx` | |
| crew | `src/features/social/**`, `src/features/friends/**`, `src/features/privacy/**`, `src/state/store.ts`, `src/state/social.ts`, `CLAUDE.md` (the Seed paragraph only) | polish item 1, `docs/specs/2026-09-17-polish.md`, first |
| you | `src/features/stats/**`, `src/features/badges/**`, `src/features/log/**`, `src/features/wrapped/**` except `WrappedTeaser.tsx`, `src/data/badges.ts`, the new empty-state class in `src/styles/base.css` | |
| shell | `src/app/**` (Nav, Shell, Masthead, App, their CSS, including `.page-lead` in `shell.css`), `src/features/cruise/Entry.tsx`, `src/features/landing/**` | |

DESIGN.md outside the fold's sections is not edited by any builder: each builder returns the exact
DESIGN.md amendments its changes need (section, old text, new text, reason), and one docs pass applies
them all after the merge. The Copy rules this pass adds there: a row that opens a sheet does not
repeat that sheet's meta line; a sheet's meta line carries the one fact its controls do not show,
never a list of the fields below it; a hairline separates rows in a list and never groups inside a
sheet; a structural zero is never shown on any screen; a number is shown once per screen, and not on
a tab another tab already covers.

## The change list, by surface

Each entry is the audit's, verbatim, under the stream that makes it. Where a ruling above settles an
option the entry offers, the ruling wins; the entries it overrides are marked.

### Shared chrome (bottom nav and masthead, every tab) (stream: shell)

Words now: Masthead: 2 words and about 44px above every tab inside Shell; nav: one sliding indicator plate on every tab. After: Masthead gone from the five tabs (kept on Entry and Landing); no plate, the active tab is coral icon and label.

1. `src/app/Nav.tsx:22; src/app/nav.css:1-3, 11-23, 33`
   - Before: <div className="nav-lens" style={{ '--i': Math.max(0, active), '--n': TABS.length } as CSSProperties} hidden={active < 0} aria-hidden />, painted by .nav-lens::before { background: rgba(255,255,255,.42); border-radius: var(--r-control); box-shadow: inset 0 1px 0 var(--glass-rim), ... } and slid by transition: transform var(--t-panel)
   - After: remove: the .nav-lens element in Nav.tsx:22 and its rules at nav.css:11-23 plus the reduced-motion line at 33. Rewrite the nav.css:1-3 comment to 'The active tab is coral icon and label.' The active tab keeps coral and weight 600. The CSSProperties import then goes unused.
   - Why: This is the indicator pill that DESIGN.md:210 retired by name ('there is no indicator pill and no icon lift'). It is fault 9 in DESIGN-AUDIT, and it is a sixth motion outside the five authored ones. It shows on every tab, at the thumb, on all 200 opens. Deleting it is the cheapest possible fix and costs nothing.

2. `src/app/Shell.tsx:28-32; src/app/Masthead.tsx:7-15; src/app/shell.css:5-10; docs/DESIGN.md:333-337, 618`
   - Before: <Masthead /> rendered inside Shell above every routed screen (about 44px: s3 plus safe-t on top, s2 below, one 15px line)
   - After: remove <Masthead /> from Shell.tsx:32 and keep it on Entry and Landing. Amend DESIGN.md: registry 618 becomes 'the app's name above the entry screen and the landing, the two screens a cold visitor meets'. In the Home section at 333-337, replace the masthead sentences with 'The greeting is the screen's first line.' Check .page padding-top against --safe-t after the change.
   - Why: Shell.tsx justifies the masthead for a visitor who arrives cold, but App.tsx:198-204 sends every cold visitor to Landing or Entry, and both carry their own Masthead (confirmed by grep: Shell.tsx:32, Entry.tsx:56, Landing.tsx:44). Inside Shell it is two words the guest already knows, it takes about 44px above the fold on every tab, and on Ship, Crew and You it sits directly on top of the h1. This changes DESIGN.md, so it is listed in decisionsForOwner.


### Home (stream: home)

Words now: Pre-sailing 135, aboard 169, BYO 75, BYO with no venues or drinks 43 (innerText of .home at 390x844, including about 36 words of For you cards off to the right). After: About 110, 144, 57 and 31; aboard, the Up next rows drop from 5 to 3.

1. `src/features/home/Home.tsx:169-186, 375-404; docs/DESIGN.md:381-383`
   - Before: Up next | Whiskey Lover / 1 more whiskey | Apples Delight / ★★★★★ · Good Spirits at Sea | Crooners / 31 drinks logged | Sam ... | Ravi ...   (empty: 'No top drink yet' / 'Rate a drink and it appears here')
   - After: remove both rows and the topDrink block; Up next keeps the nearest badge and the crew lines. With neither present (byo-empty), the Up next section does not render. DESIGN.md:381-383 loses 'the top drink and top bar rows as today', with the written reason: both are retrospective and live in Stats' Highest rated and Bars you drink at most, and Last bar's 'Your top bar' fallback already names the top bar when nothing is logged today.
   - Why: Under a heading that says 'Up next', both rows describe the past, and the Stats screen shows the same facts. In byo-empty the placeholder points to an empty Drinks list, which is an empty state with no action that fills it. This removes two rows and 10 to 12 words on every open. Stats keeps 'Bars you drink at most' under every option in the Stats changes below, so the reason given here still holds.

2. `src/features/home/Home.tsx:238-246, 167; docs/DESIGN.md:355-356`
   - Before: The ship | 18 bars | 10 restaurants | 6 decks   (byo: 3 bars | 0 restaurants | 2 decks)
   - After: remove the pre-sailing facts row. Before sailing, module 2 renders only when there is no venue (the existing 'Add your first venue' row); otherwise For you moves up into its place. DESIGN.md:355-356 changes with it, with the reason: the counts do not change between opens and do not answer 'what do I do now'; Ship holds them. Minimum fallback if the row stays: leave out any fact whose value is 0.
   - Why: None of it is actionable, and none of it changes in the eleven days before sailing. Removing it lifts For you, the shake row and Where to start about 110px, into the fold. The '0 restaurants' case already breaks DESIGN's rule against structural zeros. Full removal or the zero-only fallback is in decisionsForOwner.

3. `src/features/home/Home.tsx:292; docs/DESIGN.md:367-368`
   - Before: Shake for a drink / The shaker picks one you have not tried
   - After: Shake for a drink   (one line: remove the t-meta span; the sheet's meta stays the single statement of what the shaker does). DESIGN.md:367-368 becomes 'reading "Shake for a drink"'.
   - Why: Two lenses found this separately. The row repeats, word for word, the Shake sheet meta one tap later (ShakeSheet.tsx:165), and DESIGN.md:403 fixes the sheet's wording, so the row is the copy that goes. It saves seven words and one line at the fold on every open. The same pattern on Crew is merged under 'Set up a group'.

4. `src/features/home/Home.tsx:273; src/state/social.ts:179`
   - Before: Because you love gin / Makoto Gin & Tonic / Makoto Ocean · Gin
   - After: Because you love gin / Makoto Gin & Tonic / Makoto Ocean   (for p.kind === 'taste' the meta line is the venue alone; crew picks keep venue · spirit, where the spirit is new information)
   - Why: On half the shelf the reason line already names the spirit, so the meta line says it twice. The cut also removes one middle dot.

5. `src/features/home/Home.tsx:233`
   - Before: Today | 8 logged today
   - After: Today | 8 logged
   - Why: The count repeats its own heading. The line is above the fold on all fifteen days.

6. `src/features/wrapped/WrappedTeaser.tsx:23`
   - Before: Your voyage, wrapped / Ready to open   (or 'Ready to open again')
   - After: Your voyage, wrapped   (remove the t-meta span; the aria-label keeps the 'again' distinction)
   - Why: The row renders only when Wrapped is unlocked (:13), so 'Ready to open' tells the guest nothing the row being there does not.

7. `src/features/home/Home.tsx:35`
   - Before: Day 3 of 15 aboard
   - After: Day 3 of 15
   - Why: The word adds nothing in a cruise logbook, the change brings the code into line with DESIGN.md:353's own wording, and it is glass text on the poster, where fewer words help in glare.


### Drinks list and filter panel (stream: drinks)

Words now: List viewport 110; filter panel 35 with Where collapsed, about 163 with Where open (34 chips, panel 1574px tall). After: List about 101; filter panel about 32 collapsed, about 50 with Where open.

1. `src/features/drinks/FilterPanel.tsx:75-93; src/features/drinks/facets.ts:22`
   - Before: Where: a row of six deck chips ('Deck 7 67' ... 'Deck 18 2'), then for each deck a 'Deck 7' subheading and a cloud of venue chips ('Good Spirits at Sea 19', 'Crown Grill 0', ...)
   - After: Where: the six deck chips only. Remove the venue clouds and their deck subheadings (FilterPanel.tsx:80-93). A bar is found by typing its name, which already filters to that venue's group, or from its venue sheet on Ship. If a venue filter must stay, the smaller fix is to drop the constrained guard at FilterPanel.tsx:81 so zero-drink venues never render ('!(c("venues", k) === 0 && !f.venues.includes(k))'), which removes 9 dead chips.
   - Why: This is the biggest single cut on Drinks: 28 chips and 6 subheadings, and the panel falls from 1574px. Search already matches the venue name (facets.ts:22), the list has venue headings, and each venue has its own sheet, so this is a fourth route to one place. The 34 chips are also a wall of identical rounded boxes, which is banned tell 4. Full removal or the zero-chip fallback is in decisionsForOwner.

2. `src/features/drinks/DrinkCard.tsx:13; docs/DESIGN.md:449-450`
   - Before: const fold = [d.category, d.price !== null ? money(d.price) : null].filter(Boolean).join(' · ')  → 'Coffee · $4'
   - After: const fold = d.price !== null ? money(d.price) : ''  → '$4'; amend DESIGN.md:449-450 to 'Price becomes part of the meta line ("£12")'
   - Why: 'Signature' appears on 93 rows, and within a venue group the category is usually identical from row to row. It stays in the sheet's meta line and in the Type filter. Dropping it gives the clamped ingredients line room, which cuts off today, and saves about 9 words per viewport.

3. `src/features/drinks/FilterPanel.tsx:49; src/features/drinks/Drinks.tsx:121-123`
   - Before: '214 of 214' at the top of the panel, and '214 drinks' in the count line directly beneath it
   - After: remove the <p> at FilterPanel.tsx:49; render .fhead only when nChosen(f) > 0, holding 'Clear all' alone. The count line below is the one count.
   - Why: With the panel open, both counts are on screen at once. The count line is DESIGN's module 2 and already updates live.


### Drink sheet (stream: drinks)

Words now: Apples Delight with crew present: about 129 (114 innerText plus 15 placeholder), scroll height 1257 against a 722 viewport; a custom drink about 50. After: About 76, scroll height about 830; a custom drink about 22.

1. `src/features/drinks/DrinkSheet.tsx:81, 207-216`
   - Before: Heading 'Also at Good Spirits at Sea', then six .mini buttons: Gin & Tonic Ultima, Azul Blanco, Grappa Peach, Bangkok Mule, Sandia en Fuego, The Great Pumpkin
   - After: remove (DrinkSheet.tsx:81 and 207-216)
   - Why: Six identical chips (banned tell 4), and a second route to the same list: that bar's group in the list and its venue sheet both show those drinks. DESIGN.md:461-468 does not list it for this sheet. It removes about 19 words and 250px. In decisionsForOwner because it removes a feature.

2. `src/features/drinks/DrinkSheet.tsx:163-181`
   - Before: Label 'Notes', placeholder 'Glass, garnish, who made it, whether it was worth the walk.', hint 'Private to you.' / Label 'Comment', placeholder 'One line others will see.', hint 'Shared with your crew.'
   - After: Label 'Private notes', no hint, no placeholder / Label 'Comment for your crew', no hint, no placeholder
   - Why: Guardrail kept: who can see each field was said by the hint lines and is now said by the labels, so nothing about privacy is lost. The system lens's keep list makes the same move and asks that the words survive, which they do. The Comment placeholder repeated its own hint, and the Notes placeholder is mannered. This removes two helper lines and 22 words from the app's most-opened sheet.

3. `src/features/drinks/DrinkSheet.tsx:148; docs/DESIGN.md:464-468`
   - Before: Tried · Favourite · Wishlist · Order again / Recommend (two lines at 390px)
   - After: Tried · Favourite · Wishlist · Recommend (324.5px of the 358px available, one line). Remove DrinkSheet.tsx:148 and amend DESIGN.md:464-468 to drop the chip and the sentence accepting the wrap.
   - Why: Grep confirms nothing reads e.again except restore.ts:45, the backup merge. Removing the chip takes out a whole 44px line and a competing target. The stored field can stay in restore.ts so old backups still merge. It removes a feature, so it is in decisionsForOwner.

4. `src/features/drinks/AddSheet.tsx:34-40; src/features/drinks/DrinkSheet.tsx:100-112, 149, 172-181; src/state/share.ts:87`
   - Before: Fixture Cold Brew / Ingredients not recorded / Added to your personal passport. / Price not published / Sweetness ●●●○○ Strength ●●●○○ / Standard, roughly 16 to 22% / ... Recommend / Comment, 'Shared with your crew.'   (and in AddSheet: ingredients: ingredients.trim() || 'Ingredients not recorded')
   - After: For an id starting with 'c', render no meters and no strength line, no Recommend chip and no Comment field. Write desc '' and ingredients '' in AddSheet.tsx:34,40, and render each of ingredients, blurb and facts only when it is non-empty. What remains: title, meta line, rating, Tried / Favourite / Wishlist, date, notes.
   - Why: share.ts:87 skips every custom id (confirmed), so the Recommend chip and 'Shared with your crew' promise sharing that never happens. The meters and ABV are made-up defaults shown as facts, which breaks DESIGN's Honest rule. The ship lens reached the same ingredients change from the venue sheet, where 'Ingredients not recorded' prints on every row the guest added. The sheet goes from about 13 blocks to 7. Whether to hide these controls or make sharing work is in decisionsForOwner.

5. `src/features/drinks/DrinkSheet.tsx:11, 112; src/data/model.ts:71, 78`
   - Before: Strength ●●●○○, then the line 'Standard, roughly 16 to 22%' ('Moderate, roughly 12 to 16%' on a Budweiser)
   - After: remove the line, except for strength 0: '{d.strength === 0 && <p className="ds-abv t-meta">Alcohol free</p>}'. Delete the ABV array.
   - Why: The line restates the dots, and its percentage is a band worked out from the dot count, not a measurement. For 48 beers and wines it is wrong by about three times. DESIGN.md:466 names the dots and no sentence under them. 'Alcohol free' stays because five empty rings cannot say 'none'.

6. `src/features/drinks/DrinkSheet.tsx:21-37, 134`
   - Before: '4.3 average from 3 aboard' / 'Ratings ranged 3 to 5 aboard' / 'Recommended by Sam' / below: 'Sam ★★★★★ The blue one is unreal, get it first'
   - After: remove the consensus line (DrinkSheet.tsx:134 and consensusLine at :21-37); keep the average, the recommended line and the crew rows
   - Why: The range sits one line under the average of the same ratings, and each friend's stars appear again in the crew rows. The cut saves 6 words and a line.

7. `src/features/drinks/DrinkSheet.tsx:107, 114; src/features/drinks/drinksheet.css:7, 88`
   - Before: <hr className="hairline ds-rule" /> before the meters and again before the rating
   - After: remove both <hr>; give .ds-meters and .ds-rate-head margin-top: var(--s5)
   - Why: Separate groups with space first and lines last. DESIGN allows hairlines between rows of a list, and these sit between groups. The same rule applies to the venue sheet (see crossCutting).

8. `src/features/drinks/DrinkSheet.tsx:54`
   - Before: 'Price not published · Fruity, Sweet'
   - After: 'Fruity, Sweet' (d.price === null yields null, which the existing filter(Boolean) drops)
   - Why: The list row already shows nothing when a price is missing, so the sheet should match it. This saves 3 words on 35 or more sheets and removes a line that repeats Peach Bellini's blurb.

9. `src/features/drinks/DrinkSheet.tsx:103-105`
   - Before: Named in trip reports but not confirmed on a published menu. Have a look at the bar.
   - After: Not on a published menu. Check at the bar.
   - Why: Guardrail kept: this is the honesty line for 19 drinks, so it is shortened, not removed (17 words to 9). On the worst case it is the fourth line saying the same uncertainty.

10. `src/data/model.ts:72`
   - Before: 'Poured across the ship. ' + (HAS_PACKAGES && w[2] <= PLUS! ? 'Within the Plus allowance.' : 'Premier tier.')
   - After: 'Poured across the ship.'
   - Why: factsLine already prints the tier beside the price. This text is generated in model.ts, not Isabel's raw.ts.


### Add a drink sheet (stream: drinks)

Words now: 27 plus 5 placeholder words. After: About 23.

1. `src/features/drinks/AddSheet.tsx:97-100`
   - Before: hint 'Separate more than one with commas.' under placeholder 'Gin, liqueur'
   - After: remove the hint; keep the placeholder 'Gin, liqueur'
   - Why: The placeholder is already the example, so the hint says it again. The cut saves 6 words and a line.

2. `src/features/drinks/AddSheet.tsx:60, 72`
   - Before: Something new, or missing from the published menus.
   - After: Only you will see it.
   - Why: DESIGN.md requires the one meta line, so its wording changes and the line stays. The current line repeats the 'Add a missing drink' button. The replacement tells the guest the one thing they cannot find out elsewhere: share.ts:87 never sends a custom drink to the crew. The system lens proposes 'Only the name is needed.' instead (see disagreements and decisionsForOwner).


### Ship (stream: ship)

Words now: 213 seeded (innerText of .ship-page less 6 sr-only phrases); empty state 22. After: About 174; empty state about 14.

1. `src/features/ship/Ship.tsx:70-72; docs/DESIGN.md:472`
   - Before: <h2 className="t-h2 tnum">Deck {deckLabel(deck)} · {done} of {total}<span className="sr-only"> drinks tried</span></h2>  (renders "Deck 17 · 6 of 65")
   - After: <h2 className="t-h2">Deck {deckLabel(deck)}</h2>  (renders "Deck 17"), and DESIGN.md Ship's heading example amended to "Deck 17" with the reason: the deck total lives on Stats, and the rows carry the counts here
   - Why: Stats' 'Where you have been' shows exactly these numbers (confirmed: both are uniqueMenu per deck). The heading also contradicts its own rows. A shared list is counted once in the heading, so Deck 17's two rows read 6 of 44 each while the heading reads 6. Disputed: the you lens would delete the Stats bars instead, and the system lens would keep this count. Deleting both would remove per-deck completion from the app. In decisionsForOwner.

2. `src/features/ship/Ship.tsx:90-92; src/styles/base.css:177; src/features/ship/ship.css:14-16`
   - Before: <span className="meter" aria-hidden><span style={{ width: `${pct}%` }} /></span> on every venue row, including tried === 0
   - After: {tried > 0 && <span className="meter" aria-hidden><span style={{ width: `${pct}%` }} /></span>}
   - Why: On the seeded ship, 19 of 28 rows draw a full-width grey track whose only message is zero, which the count at the right already says, a few pixels above the row hairline. This takes the system lens's form, the smaller change: the written reason for the track in ship.css:14 (a short fill must not read as an underline) still applies wherever there is a fill. The ship lens would drop the track on every row. Both are in disagreements.

3. `src/features/ship/Ship.tsx:47; src/app/shell.css:14; src/features/ship/ship.css:3-4`
   - Before: <p className="page-lead t-meta">Bars and cafés, from the top deck down.</p>
   - After: remove, and the .page-lead rule at shell.css:14 with it. Also delete `.ship-page > h1 { margin-bottom: var(--s1); }` and `.ship-decks > .section:first-child { margin-top: 0; }` so the first deck heading takes `.section`'s own gap below the title
   - Why: No other screen has a lead line under its h1, and DESIGN.md's Ship section does not name one. The deck headings already read from the top down. The line is wrong twice: the list includes restaurants and diners, and on a guest's own empty sailing it describes decks that do not exist. It saves a line on every open.

4. `src/features/ship/Ship.tsx:116-119`
   - Before: <span className="t-body">Add a venue</span><span className="t-meta">Bars, cafés and restaurants on this ship</span>
   - After: <span className="t-body">Add a venue</span>  (meta line removed; row keeps chevron and 48px)
   - Why: The guest has just scrolled past 28 venues, so the list above already explains what a venue is. The cut removes 7 words and a line.

5. `src/features/ship/Ship.tsx:90-94; src/features/ship/VenueSheet.tsx:80-100`
   - Before: Ship row "Fixture Café … 0 of 0" with an empty track; sheet "0 of 0 tried from this list", empty meter, then "No published drinks for this venue yet."
   - After: When menu.length is 0: the Ship row shows the name only (no count, no meter); the sheet drops the progress line and meter and reads "No drinks here yet."
   - Why: A structural zero, which DESIGN rules out on Home. 'Published' is wrong for a venue the guest made. The one action that fills the list (the add sheet) is an addition, so it is noted here and not counted as a cut.


### Venue sheet (stream: ship)

Words now: 382 for Sun Bar (39 above the drink list). After: 375 (32 above the drink list); two to three fewer horizontal lines.

1. `src/features/ship/VenueSheet.tsx:69, 78; src/features/ship/ship.css:21, 24`
   - Before: <hr className="hairline venue-rule" /> <div className="venue-visit">…Switch…</div> <hr className="hairline venue-rule" />
   - After: remove both <hr>s. `.venue-visit { margin-top: var(--s5) }` and the progress block keeps `margin-top: var(--s4)`
   - Why: About 90px carries three horizontal lines: rule, rule, meter. One labelled switch needs no fence of its own. The rules above a delete in VenueForm and SailingSheet stay, because the registry requires them.

2. `src/features/ship/VenueSheet.tsx:80-92`
   - Before: <p className="t-meta tnum">{done} of {menu.length} tried from this list</p> plus a <div className="meter" role="progressbar">
   - After: <p className="t-meta tnum">{done} of {menu.length} tried</p>, with the meter removed (move role=progressbar semantics onto nothing; the text says it). Amend DESIGN.md Venue sheet "the progress line" to mean the text line
   - Why: Both lenses cut 'from this list'. Only the ship lens removes the meter: the same number appears in the text, in the meter, and on the row behind the sheet, and every drink below carries its own tried check. The system lens keeps the meter and its aria-label. The line DESIGN.md names survives as text.

3. `src/features/ship/VenueSheet.tsx:49`
   - Before: Same list as {sharesWith.name}, shared across the ship.
   - After: Same list as {sharesWith.name}.
   - Why: The tail repeats 'same list as'. The line itself stays: it is the only explanation of why nine venues read the same 'n of 44'.


### Add a venue and Your sailing sheets (stream: ship)

Words now: Add a venue 41; Your sailing edit 45, new 42. After: About 20; 21; 29.

1. `src/features/ship/VenueForm.tsx:187; src/features/cruise/SailingSheet.tsx:123-125`
   - Before: Saving reloads the app, so the change shows on every screen.
   - After: remove in both forms (and the `dirty` state that exists only to show it, plus `.venue-form-note` / `.sailing-note` CSS)
   - Why: It explains a mechanism the guest cannot act on. The store is persisted, so the reload loses nothing. It is also wrong for 'Save and add another', which does not reload. It removes 11 words per form and lifts the primary button by a line.

2. `src/features/cruise/SailingSheet.tsx:134`
   - Before: Crew and groups need a sailing you are both on, so for now they work on the published sailings.  (rendered on new and edit)
   - After: {!editing && <p className="t-meta sailing-crew">Crew and groups only work on the published sailings for now.</p>}
   - Why: Guardrail kept: it states what a guest stands to lose, so it is shortened (18 words to 11) and still shown before the sailing exists. On edit it is hidden, as the code comment already intends ('said once'). The first-open lens asks that it not be dropped, and it is not.

3. `src/features/ship/VenueForm.tsx:125-129`
   - Before: 'Where you will be drinking. Deck and name are what the app groups by.' / 'Change how this venue reads. The drinks logged here stay logged.'
   - After: 'Where you will be drinking.' / 'The drinks logged here stay logged.'
   - Why: The one meta line stays, as DESIGN requires, and each drops from two lines to one. The edit line keeps the reassurance that logs survive. For the add line, the system lens keeps the other half ('Deck and name are what the app groups by.'). Both are in disagreements and decisionsForOwner.

4. `src/features/cruise/SailingSheet.tsx:79-83`
   - Before: 'Change the ship or the dates. Your logged drinks stay where they are.' / 'The ship, the line and the dates. You add the bars next.'
   - After: 'Your logged drinks stay where they are.' / 'You add the bars next.'
   - Why: The first clause of each line reads out the fields below. For new, the system lens prefers 'Only the ship and dates are needed. You add the bars next.', which would let the 'Optional.' hint at SailingSheet.tsx:98 go. With the shorter line, that hint stays, because Field.tsx draws no required marker.

5. `src/features/ship/VenueForm.tsx:170, 180`
   - Before: Hours hint="Optional. For example, 4pm to late."  Notes hint="Optional. Anything you want to remember about it."
   - After: Hours hint="Optional." placeholder="4pm to late"  Notes hint="Optional."
   - Why: The example moves into the placeholder, as AddSheet already does, and 'Anything you want to remember' repeats the Notes label. This cuts 10 words. The system lens removes the whole hint and relies on a meta line saying what is required. That only works if its meta wording is chosen, so 'Optional.' stays here (see disagreements).

6. `src/features/ship/VenueForm.tsx:192, 196`
   - Before: Add it / Save and add another
   - After: Add it / Add another
   - Why: Both buttons save, and the verb should be the same on both. The cut saves 2 words.


### Crew screen (stream: crew)

Words now: About 95 (named, aboard; friend-dot initials excluded); empty sailing 45. After: About 55; empty about 40.

1. `src/features/social/Social.tsx:76, 173-187; src/state/social.ts:105-112; docs/DESIGN.md:504`
   - Before: h2 "Nobody has tried these yet" then four drink rows, each with "O'Malley's Irish Pub · Deck 7".
   - After: Remove the section and the `undisc` memo (Social.tsx:76). Amend DESIGN.md Crew to five modules, with this reason: "its picks had no personal basis, and Discover together above and the Shake sheet on Home already suggest untried drinks with a reason".
   - Why: The picks come in catalogue order, which is exactly the generic 'you might like' that DESIGN.md:363-365 bans. About 36 words and four rows go, and the page drops from 1143px to about 870px.

2. `src/features/social/Social.tsx:164; src/features/friends/GroupSheet.tsx:106`
   - Before: Row: "Set up a group" / "One link, everyone joins". Sheet meta: "One link, everyone joins. No codes to swap round the table."
   - After: Row: "Set up a group" on one line, the second span removed. Sheet meta: "One link, everyone joins." (The meta line stays, as DESIGN.md requires.)
   - Why: This is the same pattern as Home's shake row: a row subtitle that repeats the meta line of the sheet it opens. The tail of the meta line is mannered. It removes 4 words from Crew and 7 from the sheet, and the sheet meta drops to one line.

3. `src/features/home/DiscoverTogether.tsx:48-50`
   - Before: `<span className="fstack disc-rec-dots">` with up to two FriendDots before each drink name
   - After: remove the dot stack from the rec rows (keep the one dot on the "shares your taste" line)
   - Why: The meta line under each row already names the friend. The dots also push the drink names off the section's left edge. Three coloured discs go.

4. `src/features/social/Social.tsx:113`
   - Before: Nobody yet. Add someone with the button above.
   - After: Nobody yet.
   - Why: The coral 'Add to your crew' button sits directly above.

5. `src/features/social/Social.tsx:120-121`
   - Before: 8 logged / Nothing logged yet
   - After: 8 tried / Nothing tried yet
   - Why: The number counts e.tried, and Discover together on the same screen calls it 'tried'. No words are saved, but the guest has one term less to reconcile.


### Add to your crew sheet (stream: crew)

Words now: About 70 at rest, including the visible placeholder (system lens counts 64). After: About 42 (system lens estimates about 50 with its idle note kept).

1. `src/features/friends/AddCrewSheet.tsx:255-271, 274-291; docs/DESIGN.md:518-519`
   - Before: Label "Join a group", an always-visible input with placeholder "Invite code or link", and a full-width "Join group" button (disabled until something is typed), all shown at rest.
   - After: One `.quiet-action` reading "Join a group with a code" directly above "Paste a code instead", 12 between them as on the Shake sheet. It expands in place to the same label, field and "Join group" button, with the same useState fold the paste path already uses. Amend DESIGN.md Crew (4) to "Join a group, folded like the paste path".
   - Why: About 150px of a 640px sheet is taken by a rare route, since most group joins arrive as a tapped /join link. The fold reuses the pattern this sheet already has for pasting a code, and no route is lost.

2. `src/features/friends/AddCrewSheet.tsx:158, 165, 170, 172, 216`
   - Before: Sheet meta "Find them by name, or send them your link." then h3 "Find them", then label "Their name or code", then under the field "Their name, or the code at the top of their Crew page."
   - After: Remove the h3 "Find them" (the `.addme-find > .f-field` margin rule already sets the seam). The idle note text becomes '' and the element takes `sr-only` when idle as well as when rows are shown (`rows > 0 || find === 'idle'`), so the live region stays mounted for "Searching…", "Nobody…" and "No connection…".
   - Why: Four lines, 21 words, all saying 'name or code'. Both lenses remove the h3. They split on the idle note: the crew lens empties it, while the system lens keeps one new fact in it ('Their code is at the top of their Crew page.'). See disagreements.

3. `src/features/friends/AddCrewSheet.tsx:226`
   - Before: Standing together? AirDrop or Nearby Share it from the share sheet. Otherwise message it.
   - After: Beside them? AirDrop or Nearby Share it.
   - Why: The native share sheet lists AirDrop and every messaging app itself. DESIGN.md:516-517 requires the line, so it is shortened: 15 words on two lines become 6 on one.

4. `src/features/friends/AddCrewSheet.tsx:244`
   - Before: Label "Your code" above the code and Copy
   - After: remove the label; the code and Copy sit 12 under the plate
   - Why: The toggle directly above now reads 'Hide my code', so the label only names what the guest just tapped.

5. `src/features/friends/AddCrewSheet.tsx:155`
   - Before: No connection, so the search cannot run. Your link still works.
   - After: No connection. Send your link instead.
   - Why: Guardrail kept: it is error text, and it still names the recovery, the button directly beneath. 11 words become 6.


### Your details, Group sheet, name card (/add, /join) and privacy note (stream: crew)

Words now: Your details 82; Set up a group 21; /add lead 13; privacy note 490. After: About 60; 14; 4; about 465.

1. `src/features/friends/ProfileSheet.tsx:108-113`
   - Before: Label "Your code", then the code as a read-only `code` element.
   - After: remove
   - Why: The same code is on the Crew header behind this sheet and, with Copy, under Show my code. Removing it saves about 80px. GUEST_HONESTY still mentions the friend code and is not touched.

2. `src/features/friends/ProfileSheet.tsx:39, 151`
   - Before: Sign in and your passport comes back on any phone. We use Google only to know it is you.
   - After: We use Google only to know it is you.
   - Why: The heading, GUEST_HONESTY directly above and the button already say the first sentence. The second states a limit on how Google is used, so it stays. The three other branches name a recovery and are untouched. 19 words become 9.

3. `src/features/social/NameFields.tsx:24-25; src/features/friends/ProfileSheet.tsx:86`
   - Before: placeholder="Your name"
   - After: remove the placeholder attribute at both sites
   - Why: The label 'Your name' is directly above, and the NameCard heading asks the same question, so the first form a new guest meets says it three times. NameFields is the shared primitive, so one edit also covers Entry, the Crew name card, /add and /join.

4. `src/app/App.tsx:106-108, 157`
   - Before: /add: "{from} is adding you. Tell them who you are, then we’ll add you both." / "Tell them who you are, then we’ll add you."  /join: "Tell the group who you are, then we’ll add you."
   - After: /add: "{from} is adding you." / "Someone is adding you."  /join: "You are joining a group."
   - Why: 'Tell them who you are' repeats the h1's question, and Done obviously does the adding. 13 words become 4.

5. `src/features/friends/GroupSheet.tsx:154`
   - Before: Each member row: name / "Aboard" (owner: "Hosts this group")
   - After: Member rows: name only. Owner row: name / "Hosts this group".
   - Why: The sheet meta already says '{n} aboard'. With the repetition gone, the host is the one row that stands out. Taken from source, because the seed has no group.

6. `src/features/friends/ProfileSheet.tsx:78`
   - Before: The name and colour your crew sees on everything you share.
   - After: How your crew sees you, and where your passport is kept.
   - Why: The required meta line now describes the whole sheet instead of repeating two field labels. The shorter option, 'How your crew sees you.', is 5 words. Low priority, because the sheet is rarely opened.

7. `src/app/App.tsx:51-53`
   - Before: <div className="panel card center"> holding one p.t-body and, on failure, the "Go to your crew" link
   - After: remove the panel wrapper: the line and the button sit on the ground, and the inline 16 becomes a class on the spacing scale
   - Why: A box round the only thing on the screen is the fourth banned tell, and the inline margin sits outside the token system. The error text and its recovery link stay.

8. `src/features/privacy/PrivacySheet.tsx:53`
   - Before: Adding is not something you approve. Once you have set a name, anyone using the app can find you by name or by code, and adding you makes the crew mutual at once: from that moment they see your passport and you see theirs, with no request and no acceptance. The search itself returns your name, your colour and your code, and nothing else, and a guest who has set no name is not findable at all. Removing someone cuts both sides, and they stop seeing your passport from that moment.
   - After: Nobody approves an add. Once you have set a name, anyone in the app can find you by name or code, and adding you is mutual at once: they see your passport and you see theirs. The search returns only your name, colour and code, and a guest with no name cannot be found. Removing someone cuts both sides at once.
   - Why: Guardrail kept: every fact in the privacy note survives (no approval; findable once named; mutual at once; what the search returns; an unnamed guest cannot be found; removal cuts both ways). All seven headings stay, as PrivacySheet.tsx:22-25 requires. About 88 words become about 60. GUEST_HONESTY is untouched.


### You: Stats (stream: you)

Words now: 196 words, 117 lines. After: About 150 words, 80 lines.

1. `src/features/stats/Stats.tsx:153-155, 160-163, 203, 207`
   - Before: categories and spirits each render every entry (11 and 11 rows in the seed)
   - After: .slice(0, 5) on both, matching the five of 'Highest rated'. Headings unchanged.
   - Why: The top five answer 'what do you drink'. Rows six to eleven are ones and twos. It removes 12 rows and about 580px. The venues list beside them is already capped at 8, so this follows an existing pattern.

2. **NOT MADE (ruling 1: Stats keeps the deck bars).** `src/features/stats/Stats.tsx:164-178, 189-198; docs/DESIGN.md:534-535`
   - Before: <h2>Where you have been</h2> then six DeckBars rows ("Deck 18 / 6 of 46" ... "Deck 7 / 52 of 121") then <h3>Bars you drink at most</h3> and its rows
   - After: remove DeckBars and the deckRows memo; the section becomes <h2 className="t-h2">Bars you drink at most</h2> followed directly by CountRows (the h3 goes, since it is now the only list in the section). Amend DESIGN.md You section in the same change: 'completion by deck lives on Ship, whose deck headings already carry it; Stats does not repeat a number another tab shows'.
   - Why: The bars repeat Ship's deck headings figure for figure and take most of Stats' first screen. This directly contradicts the ship lens, which removes the Ship headings and names Stats as the number's home. Only one of the two can land unless Charles rules for 'neither' (decisionsForOwner). Under every option, 'Bars you drink at most' stays, which Home's top-bar cut relies on.


### You: Badges and the badge sheet (stream: you)

Words now: 119 words, 48 lines. After: About 82 words, 38 lines.

1. `src/features/badges/Badges.tsx:146-162; src/data/badges.ts:32-54`
   - Before: <span className="row-copy"><span className="t-strong">{badge.name}</span><span className="t-meta">{badge.hint}</span></span> with the bar and '58 of 100' stacked at the right
   - After: row-copy holds the name only; .badge-meter lays the 3px bar and its '58 of 100' side by side on the row's one line (grid-auto-flow: column, align-items: center), so a Close row is one line at the 48 minimum. The hint stays as the badge sheet's meta line (Badges.tsx:194), which the row already opens. Locked rows keep their hint: there it is the only statement of what earns the badge.
   - Why: In seven of ten rows the hint repeats the name and the count ('One Hundred / Log one hundred / 58 of 100'). It removes about 35 words and ten lines. It must ship with the next change, because for the two percentage badges the hint is currently the only clue that the numbers are percentages.

2. `src/data/badges.ts:51, 54; src/features/badges/Badges.tsx:161, 206`
   - Before: Cocktail Master: '27 of 50'; Sun Princess Champion: '27 of 90'
   - After: '27% of 50%' and '27% of 90%' (the percentage badges format their count with a % suffix; the others are unchanged). With the Close hints removed (finding above), this suffix is what tells the guest these two are percentages.
   - Why: Honest: everywhere else in the app 'n of m' counts drinks, so without the % these read as 27 drinks. This goes out in the same change as rank 1. It also reaches Home's Up next nearest-badge row.

3. `src/features/badges/Badges.tsx:106-107`
   - Before: Earned … 6 of 18 earned
   - After: 6 of 18
   - Why: The heading already says Earned. A section head carries its count at the right, not a second label.

4. `src/features/badges/Badges.tsx:202-208`
   - Before: `Not earned yet: ${cur} of ${need}`
   - After: `${cur} of ${need}` (with the % suffix from the finding above); 'Earned' and the no-progress 'Not earned yet' stay as they are
   - Why: A count short of its target already means not earned. The words stay where no count exists, so the state never rests on the coin's colour alone.


### You: Log (stream: you)

Words now: 382 words, 207 lines (58 two-line rows). After: About 250 words, 150 lines.

1. `src/features/log/Log.tsx:67-70`
   - Before: <span className="t-meta">{VENUES[drink.venue]?.name || drink.venue}</span> under every drink name
   - After: remove; each Log row is the drink name and its rating on one line. The venue is the drink sheet's meta line, one tap away.
   - Why: This is the largest line cut in the app: about 130 words and 58 lines, roughly a third of the page. The guest scans Log for the drink, and the bar line is mostly one name repeated in runs ('Crooners' six times on Day 1). Stats' rated rows keep their venue line.

2. `src/features/log/Log.tsx:27`
   - Before: 'Nothing logged yet. Mark a drink as tried and it appears here under its day.'
   - After: 'Nothing logged yet.' then <Link className="btn btn-coral" to="/drinks">Log a drink</Link> in Stats' .stats-empty shape; Badges' empty state takes the same shape
   - Why: DESIGN.md:187-188 says every list ships its empty state with the one action that fills it, and Log has none. 14 words become 3 plus the action. The only addition in this proposal, and one DESIGN.md already requires. The lenses split on shape: the you lens uses Stats' filled button and unifies all three segments, the system lens uses Badges' text link (`<Link className="badge-empty-action" to="/drinks">Log a drink</Link>`). See disagreements. Taken from source only; not rendered.


### Wrapped (story cards and certificate) (stream: you)

Words now: Per card with footer: tried 11, top bar 11, spirit 9, decks 12, archetype 20, medals 10, crew 39, certificate plus footer 51. After: 7, 8, 6, 11, 16, 8, 32, 42.

1. `src/features/wrapped/Wrapped.tsx:442`
   - Before: <span>{holding ? 'Paused' : `${index + 1} of ${cards.length}`}</span>
   - After: <span>{holding ? 'Paused' : ''}</span> (the three slots stay, so Previous and Next keep their places)
   - Why: The rail at the top already shows the position, and its aria-label says it in words. The number repeats on every card.

2. `src/features/wrapped/Wrapped.tsx:227-234`
   - Before: 'Taste twin: Sam, 100% match' / 'Together you found 63 of 214' / '5 of those you owe to the crew' / 'Both loved: Bangkok Mule, Apples Delight and The Cartagena Cool'
   - After: remove the '{n} of those you owe to the crew' line; keep the other three
   - Why: It is the densest card in the story, and this line qualifies the one above it in mannered wording.

3. `src/features/wrapped/Wrapped.tsx:210; src/features/wrapped/wrappedData.ts:96`
   - Before: <p className="t-meta">{card.archetype.traits.join(', ')}</p> -> 'Strong, Signature, 3 venues'
   - After: remove (the traits field can stay in the data type unused, or be dropped from deriveArchetype)
   - Why: '3 venues' comes two cards after 'across 15 venues', counted a different way, so the story contradicts itself. The card's point is the archetype name and its blurb.

4. `src/features/wrapped/Wrapped.tsx:163-166`
   - Before: <p className="t-meta">{card.pct.toFixed(0)}% of the passport</p>
   - After: remove
   - Why: '58 of 214' and '27%' are the same fact on one card. The certificate keeps '27% complete' as a summary.

5. `src/features/wrapped/Wrapped.tsx:141, 120`
   - Before: {status || 'Saves a picture you can post.'}; error 'Could not make the picture.'
   - After: {status} (the role="status" region stays, empty at rest, and still says 'Saved.' or 'Shared.'); error becomes 'Could not make the picture. Try again.'
   - Why: The resting line explains the button. Guardrail kept and strengthened: the error gains 'Try again.', because error text must name a recovery.

6. `src/features/wrapped/Wrapped.tsx:174-175, 183`
   - Before: 'Deck 8' and '31 drinks logged here' on two lines; '15 appearances in your glass'
   - After: one line 'Deck 8 · 31 drinks'; '15 drinks'
   - Why: 'Appearances in your glass' is a metaphor where a count will do. Merging the lines leaves one qualifying line under the bar's name.

7. `src/features/wrapped/Wrapped.tsx:216-218`
   - Before: 'Medals' / 6 / 'of 18 medals earned'
   - After: 'Medals' / 6 / 'of 18 earned'
   - Why: The label already says Medals. This matches the Badges heading change.

8. `src/features/wrapped/Wrapped.tsx:241; src/features/wrapped/wrappedImage.ts:140`
   - Before: <p className="t-meta">Certificate of a voyage</p> above <h2>Cruise Wrapped</h2>
   - After: remove from both the card and wrappedImage.ts (shifting the canvas layout up one line), so the screen and the poster stay identical as certificateRows intends
   - Why: Two headings stacked on one object, and DESIGN-AUDIT fault 2 already lists it as an eyebrow. This is effort M because it changes the saved poster. In decisionsForOwner.


### Entry, Landing and Not found (first open) (stream: shell)

Words now: Entry 111 single / 112 multi (.entry-in 669 of 737px); landing phone 78, desktop 103; not found 13 plus the nav. After: Entry about 84 / 85 and about 36px shorter; landing phone about 62, desktop about 78; not found 5 plus the button.

1. `src/features/cruise/Entry.tsx:127`
   - Before: Tapping Done turns on sync: your name, colour and the drinks you log go to this app’s own server in London, under your friend code. You do not need to sign in, there is no analytics and no advertising, and you can delete it all from Your details at any time.
   - After: Done turns on sync: your name, colour and the drinks you log go to this app’s own server in London, under your friend code. No sign-in needed, no analytics, no advertising. Delete it all from Your details at any time.
   - Why: Guardrail kept: this is the consent line, and every promise survives. Done is the trigger; it says what goes, that it is the app's own server, that the server is in London, and that it is stored under the friend code. It keeps 'no sign-in needed', where 'needed' matters because optional Google sign-in exists, plus no analytics, no advertising, and deletion from Your details. 50 words become about 40, over three or four lines instead of five. That frees room on the multi-sailing branch, which is near DESIGN's scroll limit.

2. `src/features/cruise/Entry.tsx:106, 89-96`
   - Before: <span className="t-meta">For a ship that is not on this list</span>
   - After: remove (the row reads 'Set up your own sailing' alone; Entry.tsx:89-96 comment and DESIGN.md Entry module 2 updated to a one-line row)
   - Why: 'Your own sailing' already says it, and on the single-sailing branch there is no list, so the line is also untrue. It removes 9 words and a line.

3. `src/features/cruise/Entry.tsx:143; src/features/privacy/PrivacySheet.tsx:13`
   - Before: <span className="t-strong">Privacy note</span>
<span className="t-meta">{PRIVACY_SUBTITLE}</span>  (renders 'What leaves your phone, and how to remove it.')
   - After: On Entry only: <span className="t-strong">Privacy note</span> as a one-line row. PRIVACY_SUBTITLE stays as the sheet's meta line (PrivacySheet.tsx:35, required) and on ProfileSheet's row (ProfileSheet.tsx:173), where no consent line sits above it. DESIGN.md Entry module 5 amended from 'a two-line .row-copy' to one line, with the reason: the consent line above already says what leaves and how to remove it.
   - Why: This is a deliberate, written divergence from ProfileSheet's otherwise identical row. The reason: on Entry the consent line directly above already says what leaves the phone and how to delete it, and ProfileSheet has no such line. The row and the privacy note's content are untouched.

4. `src/features/landing/Landing.tsx:96`
   - Before: It saves as Cocktails, with its own icon, and opens without a browser bar.
   - After: It saves as Cocktails.
   - Why: The file's own comment says the name is the one fact a guest needs to find the app again. The cut saves 10 words and a line.

5. `src/features/landing/Landing.tsx:84, 90`
   - Before: Open the address in Safari, tap the share button, then Add to Home Screen.
Open the address in Chrome, tap the menu, then Install app.
   - After: In Safari, tap the share button, then Add to Home Screen.
In Chrome, tap the menu, then Install app.
   - Why: On the phone branch the guest is already at the address. The cut saves 3 words per step and fits the iPhone step on one line at 390.

6. `src/features/landing/Landing.tsx:60`
   - Before: Point your phone’s camera at this code. There is nothing to download from an app store.
   - After: Point your phone’s camera at this code.
   - Why: The install steps below already show there is no app store. 9 words go from the screen's main module.

7. `src/app/App.tsx:173-174`
   - Before: <h1 className="t-title">Not found</h1>
<p className="muted t-body">That link does not go anywhere here.</p>
   - After: <h1 className="t-title">That link does not go anywhere</h1> and remove the <p>
   - Why: Two lines for one fact. The recovery, 'Back to your passport', stays.

8. `src/features/cruise/Entry.tsx:128`
   - Before: This version of the app has no server, so nothing leaves this phone. Your passport is stored on this phone only.
   - After: This version of the app has no server, so nothing leaves this phone.
   - Why: Guardrail kept: the promise that nothing leaves the phone stays, and only its repetition goes. The live build has a backend, so guests rarely see this branch.


### Shake sheet (copy only; the drawing is the shaker-v2 round's) (stream: fold)

Words now: 27 visible when revealed (35 counting the sr-only live line). After: 23.

1. `src/features/shake/pick.ts:21; src/features/shake/ShakeSheet.tsx:182; src/features/shake/pick.test.ts:87, 97; docs/DESIGN.md:416`
   - Before: pick.ts:21 const UNIFORM_REASON = 'One you have not tried'
ShakeSheet.tsx:182 <p className="t-body">{result.reason}</p>
   - After: pick.ts:21 const UNIFORM_REASON = ''
ShakeSheet.tsx:182 {result.reason && <p className="t-body">{result.reason}</p>}
(pick.test.ts:87 and :97 assert the old string and change with it; DESIGN.md Shake sheet module 3 drops 'or "One you have not tried"' from the reason list)
   - Why: It repeats the required meta line on the same screen. The reason line now appears only when it says something new. .shake-slot's min-height already holds the space, so the reveal does not jump. The spec gives this copy to the declutter pass, and the variant builders touch only variants/<letter>, so the two passes do not edit the same files. The sound toggle stays as text: the icon set has no speaker glyph, and 'Shake quietly' is plainer for this guest.


## Cross-cutting (from the synthesis; the docs pass and the owning streams carry these)

- Nav indicator plate (src/app/Nav.tsx:22, src/app/nav.css:1-3, 11-23, 33): delete. DESIGN.md:210 already bans it, so no rule change is needed. Reaches every tab. Evidence: before-home, before-drinks, before-ship, before-social and before-stats.png in tools/qa/shots-declutter/.
- Masthead scope (src/app/Shell.tsx:32; DESIGN.md registry row 618 and Home 333-337): move it from Shell to Entry and Landing only, which already render their own (grep: Entry.tsx:56, Landing.tsx:44). Reaches Home, Drinks, Ship, Crew and You. Owner decision.
- Row subtitle that repeats the meta line of the sheet it opens: remove it from the row and keep the sheet's required line. Reaches Home's shake row (Home.tsx:292, DESIGN.md:367-368) and Crew's 'Set up a group' row (Social.tsx:164). Proposed DESIGN.md Copy rule: 'A row that opens a sheet does not repeat that sheet's meta line.'
- One meta line per sheet (DESIGN.md:149, 582, 611): every proposed change rewrites a meta line and none removes one. Rewrites reach AddSheet, VenueForm (add and edit), SailingSheet (new and edit), GroupSheet, ProfileSheet and the AddCrewSheet AirDrop line. Proposed clarification: the line carries the one fact the controls do not show, never a list of the fields below it.
- Placeholders are examples, never labels: NameFields.tsx:24-25 (the shared primitive, reaching Entry, the Crew name card, /add and /join) and ProfileSheet.tsx:86 lose 'Your name'. DrinkSheet Notes and Comment lose theirs. VenueForm hours gains the example '4pm to late'. AddSheet's 'Gin, liqueur' is the model.
- Hairlines between groups: remove the four rules in DrinkSheet.tsx:107, 114 and VenueSheet.tsx:69, 78, and use var(--s5) between groups instead. Keep the rule above a ConfirmButton delete (SailingSheet.tsx:137, VenueForm.tsx:202), which the registry requires. Proposed DESIGN.md Geometry line: a hairline separates rows in a list and never groups within a sheet.
- The .meter track (src/styles/base.css:177, ship.css:14-16) reaches Ship venue rows, the Venue sheet progress, the 0 of 0 own-venue case and Home's 3px badge meter. The proposal renders no meter at zero on Ship rows. The track's written reason stays wherever there is a fill. Both lenses' forms are in disagreements.
- Structural zeros: DESIGN.md states the rule only for Home (355-356). The proposal applies it wherever a zero is structural: Home pre-sailing '0 restaurants', Ship and Venue sheet '0 of 0' on a guest's own venue, and the 9 zero-drink venue chips if the filter keeps any. Suggest moving the rule to DESIGN.md Copy or States so it binds every screen.
- Empty states carry the one action that fills them (DESIGN.md:187-188): Log has none. Log, Stats and Badges use three different shapes. The proposal settles on one shape across the three You segments (see disagreements for which).
- A number shown twice (DESIGN.md step 2 already says it for the hero): the proposal applies it across screens and tabs. Stats DeckBars against Ship deck headings, the filter panel count against the count line, the Wrapped footer against the rail, the Wrapped percentage against the count, the drink sheet consensus against the average, and the badge heading against its count. Suggest one DESIGN.md sentence that extends the rule to any two places on one screen and to any tab another tab already covers.
- Custom-drink defaults (src/features/drinks/AddSheet.tsx:34-40: sweet 3, strength 3, 'Ingredients not recorded', 'Added to your personal passport.') reach the Drinks list row, the Drink sheet and the Venue sheet's rows. Writing '' and rendering only non-empty fields fixes all three. share.ts:87 (verified) means every crew-facing control on a custom drink promises something false.
- Percentage badge formatting (src/data/badges.ts:51, 54) reaches the Badges Close rows, the badge sheet and Home's Up next nearest-badge row. It must land in the same change as the Close-row hint removal.
- DESIGN.md amendments this proposal needs, each with the written reason given in its change: Home 353 (the chip already matches), 355-356 (pre-sailing facts), 367-368 (shake row), 381-383 (top drink and top bar rows); Drinks 449-450 (row meta without category); Drink sheet 464-468 (Order again and the wrap sentence); Ship 472 (heading example, if Ship loses the count); Venue sheet 'the progress line' (text only, if the meter goes); Crew 504 (five modules) and 518-519 (Join a group folded); You 534-535 (DeckBars, if Stats loses them); Entry modules 2 and 5 (one-line rows, with the written divergence from ProfileSheet); Shake sheet module 3 at 416 (the reason list); registry 618 (masthead). The shaker-v2 fold will also edit the Shake section, so the two edits must be merged, not overwritten.
- .page-lead (src/app/shell.css:14) has one user, Ship.tsx:47. Delete the class with the line so no later screen reuses it.

## Keep (the audit's list of what looks cuttable and stays)

- The shaker drawing, its motion and the variants folder: they belong to the shaker-v2 round (docs/specs/2026-09-22-shaker-v2.md). That round is the answer to 'More what I conceptualise a cocktail shaker looking like', and this proposal does not touch Shaker.tsx or variants/.
- GUEST_HONESTY, verbatim, wherever it renders (Your details, the privacy note).
- The consent line on Entry: shortened, with every promise kept (listed in the Entry change).
- All seven privacy note headings (PrivacySheet.tsx:22-25); only one paragraph is tightened.
- Every sheet's single meta line (DESIGN.md:149, 582, 611) and the Shake sheet meta's fixed wording (DESIGN.md:403).
- Every ConfirmButton armed note (venue remove, sailing delete, group leave and delete, Delete my data, linked account), shown only once armed, and the hairline above each delete.
- Error text that names a recovery: the deck range error, the end-date error, the invite-route errors in App.tsx, 'Nobody by that name yet. They may not have set a name.', and the sign-in hint's three recovery branches.
- Home: crew lines' '· synced 20 min ago' (the only freshness signal anywhere in the app); the hero's '27%' next to '58 of 214 tried' (the poster exception DESIGN.md names); the 3px badge meter; the coral reason line on rec cards; Last bar's three heading variants; 'Add your first venue' with its meta; the medal row's meta; the greeting's date line.
- Drinks: the drink sheet meta line 'Good Spirits at Sea · Deck 7 · Signature'; the venue heading's 'n of m tried'; 'Add a missing drink'; the count line; 'Your rating' beside the crew average; 'Recommended by' and the crew rows; 'Alcohol free' for strength 0; facet counts on Status, Package and the quick chips; the empty and filter-empty states; Isabel's raw.ts text.
- Ship: the per-row 'n of m' count; the shared-list line (only its tail goes); 'Change this sailing'; 'Edit this venue'; the two-line empty Ship state, which DESIGN.md:484-487 justifies in writing; the crew caveat on a new sailing (shortened).
- Crew: the friend code on the Crew header; 'Remove' on each crew row; 'Paste a code instead'; the Scan sheet meta; the Privacy note row on Your details with PRIVACY_SUBTITLE.
- You: the Log day heading and its count; 'Days 8 to 15 · nothing logged yet'; the badge sheet meta '<hint> · <tier> tier'; the Close rows' bar and 'n of m'; the Locked rows' hints; 'Earned' and the no-progress 'Not earned yet'; 'A voyage in cocktails'; the Wrapped Previous and Next words; '4 ratings' under the best-rated bars; the certificate's summary rows; the Wrapped locked copy; Stats' 'Rate a drink to see your best and worst.'
- Shake: the sound toggle as text ('Shake quietly' / 'Shake with sound'), because the icon set has no speaker glyph and text is plainer for this guest; 'Shake again'.
- Landing and Entry: the 'what this is' sentence (DESIGN.md requires it to be identical on both screens); the address under the desktop QR code; the 'Your name' and 'Your colour' labels (it is the placeholders that go); 'Back to your passport' on Not found.
- The sheet grab bar together with the X, and the toast's X: the dismissals that do not rely on dragging, for guests who do not know the gesture and for keyboard and screen-reader users.

## Checks for every stream

- `npx tsc -p tsconfig.app.json --noEmit`, `npm test`, `npm run lint` (0 errors, the 28 known warnings), `npm run design:check`, and `node tools/qa/scan.mjs` on the files you touched.
- A render of every screen and sheet you changed, before and after, at 390x844, read honestly: rank order, fold, nothing orphaned by a removal, no widow line, no gap where a line left. Visible word counts before and after, from the rendered text.
- British English, no em dashes, sentence case, dry, no mannered phrases, in every string you write.
