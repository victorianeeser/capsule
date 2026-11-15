import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: ['favicon-32.png', 'favicon-64.png', 'apple-touch-icon.png'],
      manifest: {
        name: 'Capsule',
        short_name: 'Capsule',
        description: 'Outfit planner · closet tracker',
        theme_color: '#3E372E',
        background_color: '#FFFFFF',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        navigateFallback: '/index.html',
        runtimeCaching: [
          // Weather: try the network, fall back to the last forecast when offline.
          { urlPattern: /^https:\/\/(api|geocoding-api)\.open-meteo\.com\//, handler: 'NetworkFirst', options: { cacheName: 'weather', networkTimeoutSeconds: 4 } },
          // Background-removal model files: download once, then reuse offline.
          { urlPattern: /^https:\/\/staticimgly\.com\//, handler: 'CacheFirst', options: { cacheName: 'cutout-model', expiration: { maxEntries: 60 } } },
          // Fonts
          { urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\//, handler: 'CacheFirst', options: { cacheName: 'fonts', expiration: { maxEntries: 20 } } },
        ],
      },
    }),
  ],
  server: { port: 5173, host: true },
})
