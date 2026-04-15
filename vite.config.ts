import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  
  return {
    server: {
      host: "::",
      port: 8080,
    },
    build: {
      target: 'es2020',
      sourcemap: true,
      cssCodeSplit: true,
      chunkSizeWarningLimit: 600,
      modulePreload: {
        polyfill: false,
      },
      rollupOptions: {
        output: {
          manualChunks: (id) => {
            // Form libraries - deferred, not needed on landing page
            if (id.includes('node_modules/react-day-picker') ||
                id.includes('node_modules/react-hook-form') ||
                id.includes('node_modules/@hookform')) {
              return 'vendor-forms';
            }
            // 3D libraries - deferred, only used in specific pages
            if (id.includes('node_modules/@react-three') ||
                id.includes('node_modules/three') ||
                id.includes('node_modules/react-reconciler')) {
              return 'vendor-three';
            }
            // Chart libraries (recharts, d3, victory) are intentionally NOT
            // manually chunked — they have circular internal imports that cause
            // ReferenceError TDZ crashes when forced into a single chunk.
            // Vite/Rollup handles their splitting correctly on its own.
            // PDF generation - heavy, lazy-loaded
            if (id.includes('node_modules/jspdf') ||
                id.includes('node_modules/html2pdf') ||
                id.includes('node_modules/html2canvas')) {
              return 'vendor-pdf';
            }
            // PDF.js viewer - very heavy, lazy-loaded
            if (id.includes('node_modules/pdfjs-dist')) {
              return 'vendor-pdfjs';
            }
            // Spreadsheet library - heavy, lazy-loaded
            if (id.includes('node_modules/xlsx')) {
              return 'vendor-xlsx';
            }
            // ZIP library
            if (id.includes('node_modules/jszip')) {
              return 'vendor-zip';
            }
            // QR code libraries
            if (id.includes('node_modules/qr-code-styling') ||
                id.includes('node_modules/qrcode')) {
              return 'vendor-qr';
            }
            // Sanitization
            if (id.includes('node_modules/dompurify')) {
              return 'vendor-sanitize';
            }
            // Drawer library (vaul) - commonly shared but heavy
            if (id.includes('node_modules/vaul')) {
              return 'vendor-drawer';
            }
            // DnD libraries - only needed in editors
            if (id.includes('node_modules/@dnd-kit')) {
              return 'vendor-dnd';
            }
            // Core React libraries
            if (id.includes('node_modules/react/') || 
                id.includes('node_modules/react-dom/') || 
                id.includes('node_modules/react-router') ||
                id.includes('node_modules/scheduler')) {
              return 'vendor-react';
            }
            // Leaflet map libraries - isolated chunk, lazy-loaded
            if (id.includes('node_modules/leaflet') || 
                id.includes('node_modules/react-leaflet') ||
                id.includes('node_modules/@react-leaflet')) {
              return 'vendor-leaflet';
            }
            // Supabase - defer loading
            if (id.includes('node_modules/@supabase')) {
              return 'vendor-supabase';
            }
            // UI components - commonly used (Radix + cmdk + embla)
            if (id.includes('node_modules/@radix-ui') ||
                id.includes('node_modules/cmdk') ||
                id.includes('node_modules/embla-carousel')) {
              return 'vendor-ui';
            }
            // Animation libraries - can be deferred
            if (id.includes('node_modules/framer-motion') || 
                id.includes('node_modules/motion')) {
              return 'vendor-animation';
            }
            // Utility libraries
            if (id.includes('node_modules/date-fns') ||
                id.includes('node_modules/clsx') ||
                id.includes('node_modules/tailwind-merge') ||
                id.includes('node_modules/zod')) {
              return 'vendor-utils';
            }
          },
        },
      },
    },
    plugins: [
      react(),
      mode === "development" && componentTagger(),
      VitePWA({
        registerType: "autoUpdate",
        injectRegister: null,
        includeAssets: ["favicon.ico", "placeholder.svg", "robots.txt"],
        devOptions: {
          enabled: false, // Never run SW in development/preview
        },
        workbox: {
      skipWaiting: true,
      clientsClaim: true,
      cleanupOutdatedCaches: true,
      // Only precache critical assets — lazy chunks use runtime caching
      globPatterns: ["**/*.{css,ico,png,svg,woff,woff2,webp}"],
      // Do NOT use navigateFallback — it causes the SW to serve stale index.html
      navigateFallback: undefined,
      runtimeCaching: [
            {
              // JS chunks — cache lazily at runtime instead of precaching 71MB
              urlPattern: /\.js$/i,
              handler: "StaleWhileRevalidate",
              options: { cacheName: "js-chunks", expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 7 } },
            },
            {
              // Google Fonts stylesheets
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: "StaleWhileRevalidate",
              options: { cacheName: "google-fonts-stylesheets", expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 } },
            },
            {
              // Google Fonts webfont files
              urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
              handler: "CacheFirst",
              options: { cacheName: "google-fonts-webfonts", expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 } },
            },
            {
              // Supabase storage images
              urlPattern: /^https:\/\/.*\.supabase\.co\/storage\/.*/i,
              handler: "StaleWhileRevalidate",
              options: { cacheName: "supabase-storage", expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 } },
            },
            {
              // CDN-hosted PDF.js worker and other CDN assets
              urlPattern: /^https:\/\/cdnjs\.cloudflare\.com\/.*/i,
              handler: "CacheFirst",
              options: { cacheName: "cdn-assets", expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 } },
            },
            {
              // Google Storage (external favicon, etc.)
              urlPattern: /^https:\/\/storage\.googleapis\.com\/.*/i,
              handler: "StaleWhileRevalidate",
              options: { cacheName: "google-storage", expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 30 } },
            },
          ],
          navigateFallbackDenylist: [/^\/~oauth/],
        },
        manifest: {
          name: "BrandHub",
          short_name: "BrandHub",
          description: "Create and manage comprehensive brand guides",
          theme_color: "#1a1a2e",
          background_color: "#1a1a2e",
          display: "standalone",
          scope: "/",
          start_url: "/",
          icons: [
            { src: "/icons/pwa-192x192.png", sizes: "192x192", type: "image/png" },
            { src: "/icons/pwa-512x512.png", sizes: "512x512", type: "image/png" },
            { src: "/icons/pwa-512x512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
          ],
        },
      }),
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
      dedupe: [
        "react", 
        "react-dom", 
        "react/jsx-runtime",
        "react/jsx-dev-runtime",
        "@react-leaflet/core",
        "framer-motion",
        "@tanstack/react-query",
        "@radix-ui/react-context",
        "@radix-ui/react-primitive",
        "@radix-ui/react-slot",
        "three",
      ],
    },
    optimizeDeps: {
      include: [
        'leaflet', 
        'react-leaflet', 
        '@react-leaflet/core',
        '@tanstack/react-query',
        'framer-motion',
        'recharts',
        'zod',
        'dompurify',
        '@supabase/supabase-js',
      ],
    },
    // VITE_ prefixed env vars are automatically handled by Vite - no manual define needed
  };
});
