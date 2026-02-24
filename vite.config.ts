import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    server: {
      host: "::",
      port: 8080,
    },
    build: {
      sourcemap: true,
      cssCodeSplit: true, // Split CSS for better caching
      modulePreload: {
        polyfill: true, // Enables modulepreload polyfill for better browser support
      },
      rollupOptions: {
        output: {
          // Reduce chunk fragmentation by grouping small modules
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
            // Core React libraries - use exact path segments to avoid matching react-day-picker etc.
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
            // UI components - commonly used
            if (id.includes('node_modules/@radix-ui')) {
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
                id.includes('node_modules/tailwind-merge')) {
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
        includeAssets: ["favicon.ico", "placeholder.svg", "robots.txt"],
        workbox: {
          globPatterns: ["**/*.{js,css,html,ico,png,svg,woff,woff2}"],
          runtimeCaching: [
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
      // Prevent duplicate React instances that cause "render2 is not a function" errors
      // Including @react-leaflet/core is critical for react-leaflet compatibility
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
      ],
    },
    // Pre-bundle dependencies to prevent duplicate React instances
    optimizeDeps: {
      include: [
        'leaflet', 
        'react-leaflet', 
        '@react-leaflet/core',
        '@tanstack/react-query',
        'framer-motion',
      ],
    },
    define: {
      // Ensure env variables are available
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL),
      'import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY': JSON.stringify(env.VITE_SUPABASE_PUBLISHABLE_KEY),
    },
  };
});
