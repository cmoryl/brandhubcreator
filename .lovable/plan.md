

# Build Optimization Audit -- Missing Includes and Improvements

After reviewing the full build configuration, here are the gaps and recommended additions across chunking, caching, PWA, and headers.

---

## 1. Missing `manualChunks` for Heavy Libraries

Several large dependencies are not grouped into dedicated chunks, meaning they get bundled into the main app chunk or scattered across route chunks, increasing initial load.

| Library | Approx Size | Current Chunk | Recommended Chunk |
|---|---|---|---|
| Recharts | ~200KB | (none -- mixed into app) | `vendor-charts` |
| jsPDF + html2pdf + html2canvas | ~150KB | (none) | `vendor-pdf` |
| JSZip | ~90KB | (none) | `vendor-zip` |
| xlsx | ~300KB+ | (none) | `vendor-xlsx` |
| pdfjs-dist | ~400KB+ | (none) | `vendor-pdfjs` |
| DOMPurify | ~30KB | (none) | `vendor-sanitize` |
| qr-code-styling + qrcode | ~50KB | (none) | `vendor-qr` |
| cmdk | ~20KB | (none) | `vendor-ui` (merge with Radix) |
| zod | ~50KB | (none) | `vendor-utils` (merge with existing) |
| embla-carousel-react | ~25KB | (none) | `vendor-ui` (merge with Radix) |

**Action:** Add these groupings to the `manualChunks` function in `vite.config.ts`.

---

## 2. Missing PWA Runtime Caching Rules

The workbox config only caches Google Fonts and Supabase storage. These are missing:

- **Backend API calls** -- Cache GET requests to the Supabase REST API with `NetworkFirst` strategy so offline reads work for previously-fetched data
- **CDN-hosted PDF.js worker** -- The worker is loaded from `cdnjs.cloudflare.com`; should be cached with `CacheFirst`
- **External favicon** -- The favicon is loaded from `storage.googleapis.com`; should be cached

**Action:** Add 2-3 additional `runtimeCaching` entries to the workbox config.

---

## 3. Missing `_headers` Security and Performance Headers

The `_headers` file only sets `Cache-Control`. Production sites should also include:

- `X-Content-Type-Options: nosniff` -- Prevents MIME-type sniffing
- `X-Frame-Options: DENY` -- Prevents clickjacking
- `Referrer-Policy: strict-origin-when-cross-origin` -- Controls referrer leakage
- `Permissions-Policy` -- Restricts browser features (camera, microphone, etc.)
- `Content-Security-Policy` -- (basic, report-only initially)
- Cache headers for `.woff`/`.woff2` font files (currently missing from `_headers`)
- Cache headers for PWA manifest (`/manifest.webmanifest`)

**Action:** Add a global `/*` block with security headers and font/manifest caching rules.

---

## 4. Missing `optimizeDeps.include` Entries

The `optimizeDeps.include` list pre-bundles dependencies to prevent duplicate instances in dev. Missing entries that should be added:

- `recharts` -- heavy chart library, benefits from pre-bundling
- `zod` -- used with react-hook-form resolvers
- `dompurify` -- used in multiple components
- `@supabase/supabase-js` -- core dependency

---

## 5. PWA `globPatterns` Missing File Types

Current pattern: `**/*.{js,css,html,ico,png,svg,woff,woff2}`

Missing extensions:
- `.webp` -- used for optimized images
- `.jpg` / `.jpeg` -- product/event imagery in public folder
- `.json` -- for any public JSON data files
- `.xml` -- sitemap.xml should be precached

**Action:** Expand `globPatterns` to include these.

---

## 6. Build Target and Minification

Current config does not specify:
- `build.target` -- defaults to `modules`; can be set to `es2020` to match `tsconfig` for consistent output
- `build.minify` -- defaults to `esbuild` which is fine, but `cssMinify: 'lightningcss'` could improve CSS output size (requires adding `lightningcss` dep)
- `build.chunkSizeWarningLimit` -- not set; setting to `600` would flag oversized chunks during development

---

## Technical Implementation Summary

All changes are confined to three files:
1. **`vite.config.ts`** -- Add ~8 new `manualChunks` groups, expand `optimizeDeps.include`, add `globPatterns` extensions, add runtime caching rules, set build target
2. **`public/_headers`** -- Add security headers block and font/manifest cache rules
3. No new dependencies required (lightningcss is optional)

Estimated impact: 15-25% faster cold-load for editor pages by isolating heavy PDF/chart/spreadsheet libraries into lazy-loaded chunks instead of bundling them with route code.

