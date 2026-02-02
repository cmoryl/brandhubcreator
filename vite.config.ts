import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

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
            // Core React libraries - loaded first
            if (id.includes('node_modules/react') || 
                id.includes('node_modules/react-dom') || 
                id.includes('node_modules/react-router')) {
              return 'vendor-react';
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
    plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    define: {
      // Ensure env variables are available
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL),
      'import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY': JSON.stringify(env.VITE_SUPABASE_PUBLISHABLE_KEY),
    },
  };
});
