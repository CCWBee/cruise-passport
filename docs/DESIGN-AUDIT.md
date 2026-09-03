# Design audit (3 September 2026)

Why the app read as sloppy, checked against the five most-starred anti-slop design skills on GitHub
and the workspace's own taste bar. The fix that follows is governed by `DESIGN.md`.

## The skills used

Ranked by stars on the day, all cloned and read in full:

| Skill | Stars | What it contributed |
| --- | --- | --- |
| [Leonxlnx/taste-skill](https://github.com/Leonxlnx/taste-skill) | 83,963 | the shape and colour consistency locks, the eyebrow cap, the middle-dot ration, the redesign protocol (preserve IA, audit before touching) |
| [pbakaus/impeccable](https://github.com/pbakaus/impeccable) | 65,230 | the craft floor (eyebrows are a ban; cards are the lazy container; nested cards always wrong; theme browser surfaces), the critique and polish playbooks |
| [Nutlope/hallmark](https://github.com/Nutlope/hallmark) | 27,950 | the named tells and the 58-gate slop test: card-in-card, eyebrow on every section, bouncy easing on UI state, contrast gates 40 and 41, two-line clickable text |
| [ibelick/ui-skills](https://github.com/ibelick/ui-skills) | 8,046 | baseline-ui: no gradients or glow as affordance, compositor-only animation, no custom easings, one accent per view, aria on icon buttons |
| [miqdadbadjuber/anti-slop](https://github.com/miqdadbadjuber/anti-slop) | 722 | the purpose test (every distinction must pay rent), the dose caps for glass, radius, shadow and glow, the mobile layout and tap-target rules |

Runners-up that say the same things with fewer stars: agiwhitelist/auteur (1,017), funboy322/avoid-ai-design (61), tasteskill/tasteskill (166), jiji262/claude-design-skill (188).

## The diagnosis

The app had no thesis. It was assembled from the contemporary default bundle: rounded translucent
cards, generous but arbitrary spacing, a warm gradient ground, pills, uppercase tracked labels,
friendly colours, springy motion. Each choice is defensible alone; none of them follows from what
the product is for, so they do not reinforce one another and the result reads as a kit. Taken in
the priority order that matters (information architecture, geometry, hierarchy, states, components,
type and colour, decoration) the faults were:

1. **A wall of identical boxes.** Every screen was a stack of the same pale turquoise card: five on
   Home, nine on Stats, eighteen on Badges, one per day on Log, one per deck on Ship. Same radius,
   same border, same two-layer shadow, same specular edge. With everything elevated, nothing was;
   there was no ground plane and no dominant element. Boxes also nested: rows inside panels inside
   the page, tag pills inside cards, venue pills inside deck cards. Hallmark calls this card-in-card,
   impeccable calls cards the lazy container, the workspace memory calls it "walls of identical
   rounded boxes". Grouping was being done by containers because spacing was not doing it.

2. **An eyebrow on everything.** CRUISE WRAPPED, TOP DRINK, TOP BAR, GROUPS, SAILING WITH, DISCOVER
   TOGETHER, SAILING TOGETHER, YOUR CODE, JOIN A GROUP, YOUR RATING, DATE TRIED, SWEETNESS, STRENGTH,
   CERTIFICATE OF A VOYAGE, A VOYAGE IN COCKTAILS, plus every sheet opened with a coral tracked
   caption line. Around twenty uppercase tracked labels across eight screens, many in the accent
   colour. Impeccable bans the pattern outright; Hallmark defaults it off; taste-skill caps it at one
   per three sections and calls it the most violated rule in production tests.

3. **Glass as the character, not the accent.** Nav, cards, sheets, chips, buttons, the search field,
   the hero chips: everything frosted, with a highlight gradient, over a gradient ground, under film
   grain, beside a glow blob and gradient progress fills. anti-slop's dose cap is one or two glass
   elements; the taste bar in this workspace says glass earns its place only where it shows layering.
   Hierarchy flattened: the primary "Add to your crew" was the same material as a list of untried
   drinks.

4. **Pill everything, radius drift.** Pills for buttons, chips, tags, search, venues, the countdown
   chip, the nav indicator; 18px on fields and toggles; 22px on cards; 28px on sheets; 10, 14 and 8
   elsewhere. taste-skill's shape lock: one documented radius rule or it reads broken.

5. **Accent sprawl.** Coral for action, active nav, links, eyebrows, counts, the deck 18 number and
   medal ribbons; mint for tried, visited, deck fill and progress; gold for stars and medals; lilac
   for wishlist, focus and deck 9; aqua; six fruit colours for deck numbers, donut segments and
   friends; five different toggle colours in one sheet. Colour that encodes nothing (deck numbers in
   six hues) stops colour from meaning anything where it should (tried, rating).

6. **Contrast failures, measured.** Secondary ink at 44% alpha over the card film computes to 2.3:1;
   at 66% to 3.8:1. White text on the coral button, 3.0:1. Coral text on the sand, 3.4:1. Every meta
   line, nav label, hint and the primary button failed WCAG AA. Hallmark gates 40 and 41, anti-slop
   R-25, and the product's own audience (a guest of sixty-five in sunlight) all fail this.

7. **No type scale.** Twenty-three distinct font sizes from 9px to 48px, seven weights from 500 to
   850, body copy at 600. Everything semi-bold means nothing is emphasised. Nav labels at 9.5px,
   chart axes at 9px, hints at 10px uppercase. Below any readable floor for the audience.

8. **Spacing off its own scale.** Tokens declared an 8pt scale; the CSS used 2, 3, 5, 6, 7, 9, 11,
   13, 14, 17, 18, 22, 26, 28, 34. Rhythm was uniform where it should vary (12px between everything)
   and fiddly where it should be exact.

9. **Seven tabs.** Above the working-memory limit and the platform convention of five; labels at
   9.5px; the active state used four signals at once (colour, pill, heavier stroke, lift).

10. **Stats as nine chart cards.** A hero metric already shown on Home, six bar charts of the same
    shape with filled tracks, an eight-colour donut, a sparkline with unreadable axes, no chart
    titled with the question it answers. The brief's point ten verbatim.

11. **Eighteen identical badge tiles**, the icon-tile feature card times eighteen, with rendered
    metal gradients and ribbons on frosted glass.

12. **Motion as weather.** Overshoot springs on the nav indicator and Wrapped cards, a 1.22 scale
    pop, reveal stagger on every page, chart grow-ins, a perpetual backdrop drift, a global
    `.001ms` reduced-motion kill that also destroys useful feedback. Hallmark and taste-skill both
    name bouncy easing on UI state as a tell; impeccable flags the global kill.

13. **Copy tics.** The middle dot as the universal separator, sometimes three to a line; "sipped";
    hint strips in uppercase.

The individually good ideas survive: the sea hero, the sand ground, coral as the accent, the sheet
wave, the drawn icon set, the friend dots. They were never the problem. The problem was that
nothing around them agreed with them.

## The fix, in one paragraph

Write the thesis and the geometry first (`DESIGN.md`), then the tokens and primitives, then each
screen from its five-second read down. Content sits flat on the ground under plain headings; a box
exists only where a boundary means something; glass only where chrome layers over content. One
accent, semantic colour, a five-step type scale with a 12px floor, a six-step spacing scale, three
radii with a written rule, two weights, no shadows on content, one easing, five tabs. Every screen
verified by a fresh screenshot and a mechanical scan of its CSS against the list at the foot of
`DESIGN.md`.
