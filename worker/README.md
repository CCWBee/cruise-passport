# Cruise sync Worker

This Worker is a small shared mailbox for Cruise Passport groups.

## Deploy

1. Install the Worker dependencies:

   ```sh
   cd worker && npm install
   ```

2. Create the KV namespace:

   ```sh
   npx wrangler kv namespace create CRUISE_KV
   ```

   Paste the printed namespace ID into `wrangler.toml` in place of `REPLACE_WITH_KV_ID`.

3. Deploy the Worker:

   ```sh
   npx wrangler deploy
   ```

4. Copy the deployed `*.workers.dev` URL into the app's `VITE_SYNC_URL` configuration described in PART 2.

## Local testing

Run `npx wrangler dev`. Wrangler serves a local KV namespace by default, so local testing needs no Cloudflare account access.

Cloudflare KV is eventually consistent. Updates can take about 60 seconds to propagate, which is acceptable for a cruise group.

Knowing the group code is the only authentication. Writes are last-write-wins for each member, so group codes should be shared only with the small, trusted friend group they identify.
