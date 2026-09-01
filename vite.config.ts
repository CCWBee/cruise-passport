import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// Liquid Sea Glass PWA. Base is '/cruise-passport/' for the GitHub Pages project site,
// and '/' for local dev/preview.
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/cruise-passport/' : '/',
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
      // og.png is only for crawlers, so keep it out of the runtime precache.
      workbox: { globPatterns: ['**/*.{js,css,html,svg,png,woff2}'], globIgnores: ['**/og.png'] },
      devOptions: { enabled: false },
    }),
  ],
}))
