# Maintenance

Operational and renewal detail for the Cocktail Passport. What the project is and how to work in it
are in `README.md` and `CLAUDE.md`; open work is in `STATE.md`.

## Hosting

Cloudflare Pages project `cruise-passport` on account `charlesbee2002`. The custom domain is
`cruise.charlesbee.org` on the `charlesbee.org` zone, and the default hostname
`cruise-passport.pages.dev` also serves the app.

Deploying means pushing to `main`, which runs `.github/workflows/deploy.yml`, or running
`gh workflow run Deploy -R CCWBee/cruise-passport` by hand. There is no laptop deploy path: the
Pages project takes a built artefact from Actions.

GitHub Pages serves only the redirector in `redirect/`. The old
`ccwbee.github.io/cruise-passport` address preserves path, query and hash on its way to the live
site and is not a host.

## Secrets

Repo secrets on `CCWBee/cruise-passport`, by name only:

- `CLOUDFLARE_API_TOKEN`, scope Account, Cloudflare Pages, Edit.
- `CLOUDFLARE_ACCOUNT_ID`.
- `VITE_SUPABASE_URL`.
- `VITE_SUPABASE_ANON_KEY`.

Rotate a token by creating the replacement in the Cloudflare dashboard, copying it, and running
`Get-Clipboard | gh secret set NAME -R CCWBee/cruise-passport` so the value never enters a prompt or
a transcript. Delete the old token in Cloudflare once a deploy has succeeded on the new one.

Cloudflare API token rolled: not yet. The token in use was pasted into a chat on 1 September 2026 and
the repo is public, so this is the first thing to close.

## Backend

Supabase project `qpmrfoglxohmjhjtvkac`, region eu-west-2, organisation `asajhwmwyfysdrbworbj`. It is
separate from Bobble's project and shares nothing with it.

The free tier pauses a project after seven idle days, which would take out sync, groups and friend
feeds with no alert. Liveness check: `GET https://qpmrfoglxohmjhjtvkac.supabase.co/auth/v1/health`
returns 401 with an `apikey` hint while the project is awake, so a 401 there is good news.

Migrations live in `supabase/migrations/` and are applied with
`npx --yes supabase db query --linked --project-ref qpmrfoglxohmjhjtvkac -f <file>`.

Anonymous sign-in is rate-limited per IP. The current value has not been read off the dashboard and
needs raising before sailing, because a ship puts every passenger behind a handful of egress IPs.

## Monitoring

None. There is no uptime check on the site or the backend. Note when one is added that
`public/_redirects` maps `/*` to `index.html` with status 200, so every path returns 200 with the app
shell: a check has to assert page content, not the status code.

## Data rules

Real users have existed on the backend since 3 September 2026. Purge only anonymous sessions created
the same day with profile name Alex and no edges or memberships, which is what a QA run leaves
behind. Never blanket-purge.

Do not push to `isabelgillam21-sketch/Princess-Cruise-Drinks`. This project is `CCWBee/cruise-passport`.

## Cruise runbook

The sailing is 3 to 17 October 2026 and nobody will be at a keyboard. Before it starts, confirm that
the Cloudflare token has been rolled, that restore has been tested on the phone that will carry the
passport, that the anonymous sign-in rate limit has been raised, and that an uptime workflow is green.

## Local hygiene

`dist/` and `.wrangler/` are gitignored leftovers, not state. Send them to the Recycle Bin when they
go stale rather than trusting them; both were cleared on 5 September 2026.
