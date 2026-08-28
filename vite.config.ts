import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// Liquid Sea Glass PWA — offline-first (installable, works at sea), Vercel-ready.
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'Sun Princess Cocktail Passport',
        short_name: 'Cocktails',
        description: 'A cocktail passport for the Sun Princess, 3 to 17 October 2026.',
        start_url: '.',
        display: 'standalone',
        orientation: 'portrait',
        theme_color: '#FBF3E2',
        background_color: '#FBF3E2',
        icons: [],
      },
      workbox: { globPatterns: ['**/*.{js,css,html,svg,png,woff2}'] },
      devOptions: { enabled: false },
    }),
  ],
})
