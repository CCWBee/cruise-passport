/* A self-destroying service worker, and the only reason this file exists.
   The retired build registered a precaching worker at /cruise-passport/sw.js with a navigation
   fallback, so anyone who visited or installed the old site still has a worker answering every
   /cruise-passport/* navigation from cache: they would never fetch the redirect page at all, and
   would stay on the old origin with a second identity. This is the one file that worker re-fetches
   on its update check, so it takes the chance to unregister itself, drop the caches it filled, and
   reload every open tab into the redirect. */
self.addEventListener('install', () => self.skipWaiting())

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    await self.registration.unregister()
    // Cache Storage is scoped to the origin, not to this worker, and ccwbee.github.io hosts other
    // projects that keep their own offline caches. Workbox names its caches after the scope URL, so
    // drop only the ones that name this app.
    const keys = await caches.keys()
    await Promise.all(keys.filter((key) => key.includes('cruise-passport')).map((key) => caches.delete(key)))
    const clients = await self.clients.matchAll({ type: 'window' })
    clients.forEach((client) => client.navigate(client.url))
  })())
})
