# Icon Studio Export Bundle

A one-way transfer package for the Presentation Power System project. This
bundle is **by reference**, not by copy — the full source is ~100MB (mostly the
Iconify packs under `public/icon-library/packs/`), which exceeds the repo commit
limit, so the target project pulls files directly from BrandHub Creator using
cross-project tools.

## How to use this bundle (from the target project)

Open the **Presentation Power System** project and paste this to its agent:

> Pull the Icon Studio from `@BrandHub Creator`. Use the manifest at
> `public/icon-studio-export/MANIFEST.txt` in that project for the exact file
> list, follow `public/icon-studio-export/README.md` for wiring, and apply the
> schema in `public/icon-studio-export/db/schema.txt` as a new migration in
> this project. Do NOT connect to BrandHub's backend — this must be fully
> independent.

Its agent will use `cross_project--read_project_file` /
`cross_project--copy_project_asset` to pull each file listed in `MANIFEST.txt`.

## What's included

- **Pages**: `IconStudioPage`, `BrandIconHubPage`
- **UI**: full 7-tab Icon Studio hub (Library, AI Generator, Stylizer,
  Advanced, Hierarchy, App Icons, Creator) plus the shell in
  `src/components/icon-studio/`
- **Hooks**: 11 icon hooks (`useIconLibraries`, `useIconOptimizer`,
  `useStylizer`, `useResponsiveIcon`, `useIconStateSystem`,
  `useKineticBranding`, `useIconHierarchy`, `useIconBatchProcessor`,
  `useIconAbTest`, `useBundledIconLibraries`, `useImportedIcons`,
  `useIconLibraryBrandLinks`)
- **Utilities**: `src/lib/iconStudio/**` (generation, QA, export, recipe,
  industry mapping, perceptual hash, PDF) + `src/lib/iconLibrary/**`
  (loader, kits, categorization, semantic search, restyle, suggestions)
- **Static packs**: `public/icon-library/**` (Iconify packs, index, manifest,
  LICENSES) + `scripts/build-icon-library.mjs` (regenerator)
- **Edge functions**: 11 Supabase functions covering generation, semantic
  search, mono derivation, stylize, deep fetch, suggestions
- **Database**: schema for 6 icon tables, RLS policies, and 112 seed rows for
  `icon_library_brand_links`

## Wiring in the target project

1. **Run the migration** — create the 6 tables from `db/schema.txt` and apply
   the RLS policies from `db/policies.txt`. Include `GRANT` statements on the
   public schema (per Lovable Cloud rules).
2. **Copy files** in `MANIFEST.txt` preserving their paths.
3. **Add routes** — register `/icon-studio` (and `/icon-hub` if desired) in
   the target project's router pointing at `IconStudioPage` /
   `BrandIconHubPage`.
4. **Deploy edge functions** — copy each `supabase/functions/<name>/index.ts`
   and add the matching `[functions.<name>]` block to the target project's
   `supabase/config.toml` with `verify_jwt = false`.
5. **Secrets** — `LOVABLE_API_KEY` is auto-provisioned on Lovable Cloud;
   no manual key required.
6. **Seed** — load `db/icon_library_brand_links.jsonl` if you want the
   existing brand links; the main `organization_icon_libraries` table is
   NOT seeded (41MB of SVG blobs). New generations will populate it.
7. **Dependencies** — verify `lucide-react`, `html2canvas`, `jspdf`,
   `@radix-ui/*` are installed; add any that aren't.

## Independence

Nothing in this bundle points at BrandHub's Supabase URL, project ID, or keys.
The target project uses its own Lovable Cloud instance. Confirmed: the Supabase
client is imported via `@/integrations/supabase/client`, which the target
project generates from its own environment.
