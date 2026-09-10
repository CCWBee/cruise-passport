# cruise-passport: Codex invariants

House rules for every run are in `~/.codex/AGENTS.md`. This file adds the invariants of this project.

## docs/DESIGN.md is the constitution

Before writing any markup or CSS, read its Thesis, the section for the screen you are touching, and the registry of primitives at the foot. Then read the neighbouring screen that does the same job. Most "new" is a sibling of something already built, so grep for it and compose from the registry. Diverge only with a reason written into the change.

A new primitive lands in `src/styles/base.css` or `src/ui/`, gets registered in `docs/DESIGN.md`, and its siblings get swept, all in one change. Values come from the tokens; `npm run design:check` fails the deploy on an off-system value.

These stay out of the markup, without exception:

- eyebrow labels styled as pills or chips, and status dots in front of a heading
- a border line along a heading, a card title or a card edge
- emoji standing in for a UI icon: `src/ui/Icon.tsx` is the only icon system
- a screen made of identically sized rounded boxes; one element dominates

## Scope of a run

Edit only the files the task names. Leave the render check to the caller: run no build, no `tsc`, no dev server, no `git`. CI deploys every push to `main`, so a push here ships to production.

`src/data/raw.ts` is Isabel's own data; change it only when the task says to.

Everything else, including the QA harness and the backend: `CLAUDE.md`.
