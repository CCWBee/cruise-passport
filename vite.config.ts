import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// Liquid Sea Glass PWA. Hosted on Cloudflare Pages at cruise.charlesbee.org, so one base, '/',
// in dev and in the build.
export default defineConfig({
  base: '/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'Sun Princess Cocktail Passport',
        short_name: 'Cocktails',
        description: 'Tick off all 214 cocktails aboard the Sun Princess. Badges, a Cruise Wrapped finale, and what your crew loved.',
        start_url: '.',
        scope: '.',
        display: 'standalone',
        orientation: 'portrait',
        theme_color: '#FBF3E2',
        background_color: '#FBF3E2',
        icons: [
          { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Precache the whole shell + every chunk (medallions, scanner) + the dataset, so the app is
        // fully usable offline once installed. og.png is crawler-only, so keep it out of the cache.
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        globIgnores: ['**/og.png'],
        // Client routes (/social, /drinks, /add…) are not real files, so serve the app shell for any
        // navigation the cache does not have — offline deep links then resolve in React Router.
        navigateFallback: 'index.html',
        navigateFallbackDenylist: [/^\/api\//],
        cleanupOutdatedCaches: true,
      },
      devOptions: { enabled: false },
    }),
  ],
})
