import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react-swc";
import { defineConfig, PluginOption } from "vite";
import { VitePWA } from "vite-plugin-pwa";

import sparkPlugin from "@github/spark/spark-vite-plugin";
import createIconImportProxy from "@github/spark/vitePhosphorIconProxyPlugin";
import { resolve } from 'path'

const projectRoot = process.env.PROJECT_ROOT || import.meta.dirname
const base = '/fit-file-merger/'

// https://vite.dev/config/
export default defineConfig({
  base,
  plugins: [
    react(),
    tailwindcss(),
    // DO NOT REMOVE
    createIconImportProxy() as PluginOption,
    sparkPlugin() as PluginOption,
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['reference-map-preview.png'],
      manifest: {
        name: 'FIT Merger',
        short_name: 'FIT Merger',
        description: 'Merge Garmin and fitness FIT files locally in your browser.',
        theme_color: '#2f6df6',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: base,
        scope: base,
        icons: [
          {
            src: `${base}pwa-icon-192.png`,
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: `${base}pwa-icon-512.png`,
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: `${base}pwa-maskable-icon-512.png`,
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webmanifest}'],
        navigateFallback: `${base}index.html`,
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'google-fonts-stylesheets',
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-webfonts',
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 60 * 60 * 24 * 365,
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': resolve(projectRoot, 'src')
    }
  },
});
