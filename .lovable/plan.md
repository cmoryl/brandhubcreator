# Icon Studio — End-to-End Production System

Scope is large (7 phases). Proposing a sequenced plan so we ship a real working vertical first, then layer the recipe/QA/library systems on top. Each phase is independently shippable.

---

## Phase 1 — Prove one end-to-end vertical (TransPerfect / Tech-SaaS)

Goal: one user can go Brand → Generate → Review → QA → Export without the app feeling fake.

- Hard-code a "Golden Path" wizard entry: Brand=TransPerfect, Industry=Tech/SaaS, Style=Outline+Duotone, Core=40 icons, Subsets=AI/Security/API/Support/Analytics.
- Wire the existing `generate-icon-set` edge function to actually run the full core+5 subsets in one batched job (progress UI, retry on fail).
- Land output in a new `icon_systems` table (system_id, brand, industry, recipe, status, qa_summary).
- Export bundle: `system.zip` containing `/svg`, `/png@1x,2x,3x`, `contact-sheet.png`, `manifest.json`.
- Files: `src/components/icon-studio/golden-path/GoldenPathWizard.tsx`, `src/lib/iconStudio/exportSystem.ts`, edge fn `export-icon-system`.

## Phase 2 — Recipe system (foundation for everything else)

- New `icon_recipes` table — every generated icon stores its full recipe JSON (schema as in your spec).
- `src/lib/iconStudio/recipe.ts`: `IconRecipe` type, `buildRecipe(brand, style, metaphor)`, `recipeToPrompt(recipe)`, `hashRecipe(recipe)`.
- All generation calls go through `recipeToPrompt` — no more raw prompts in the client.
- Recipes power: regenerate (same recipe), version (recipe + parent_id), QA scoring (recipe is ground truth), brand training (aggregate approved recipes).

## Phase 3 — Icon Detail Page

Route: `/icon-studio/icon/:iconId`. Components:
- `IconDetailHero` — large preview, light/dark toggle, size strip (16/24/32/48/64).
- `IconCodeViewer` — SVG source, copy, download single.
- `IconRecipeEditor` — edit recipe fields → Regenerate button.
- `IconVariantHistory` — vertical timeline of regenerations, click to restore.
- `IconQAPanel` — checks + score (reads from Phase 4).
- Actions bar: Approve / Reject / Regenerate / Replace / Export.

## Phase 4 — QA Scoring Engine

`src/lib/iconStudio/qa/` — pure functions, no AI needed for v1:
- `checkViewBox`, `checkCentered`, `checkStrokeConsistency`, `checkPathCount`, `checkNoRaster`, `check16pxLegibility` (rasterize + edge-count), `checkContrastBothModes`, `checkApprovedColors(recipe)`, `checkStyleMatch(recipe)`, `checkNaming`, `checkMetadata`.
- Aggregate into 4 visible scores: **Brand Fit**, **SVG Health**, **Small-Size Readability**, **Export Ready**.
- Auto-run on generation, store in `icon_qa_results` table, surface badge on every icon card.

## Phase 5 — Figma-ready export (no plugin yet)

Bundle in the Phase-1 export:
- Optimized SVGs (SVGO pass, consistent viewBox, kebab-case names).
- `tokens.json` (design tokens: stroke widths, colors, grid).
- `manifest.json` with full recipe + QA per icon.
- `README.md` with import instructions for Figma.
Defer the actual "Push to Figma" plugin to a later phase — call out as future work.

## Phase 6 — Demo library (5 polished systems)

- Seed `icon_systems` with 5 pre-generated, pre-approved systems: TransPerfect Tech-SaaS, Healthcare, Finance, E-commerce, Legal.
- Each: 30–60 icons, 3 style variants, QA report, contact sheet, downloadable bundle.
- Surface on Icon Studio landing as "Featured Systems" cards — click opens read-only system viewer.

## Phase 7 — "Remix this system"

- Button on any approved system → modal with remix options (filled / duotone / softer / sharper / marketing / UI / dark / presentation).
- Each option = a recipe mutation (e.g. `softer` → `cornerRadius: 'soft', strokeWidth: -=0.25`).
- Spawns new system as child of parent, runs full regen + QA.

---

## Technical Notes

- **DB migrations needed**: `icon_systems`, `icon_recipes`, `icon_qa_results`, `icon_system_exports`. All RLS-scoped to org.
- **Edge functions**: extend `generate-icon-set` to accept recipes; new `export-icon-system`, `qa-icon` (only if we add AI checks later — v1 QA is client-side pure JS).
- **Reuses existing**: `INDUSTRY_PRESETS`, `useIconLibraries`, `IconStudioCreator`, `BrandsView`, `useIconBatchProcessor`.

## Suggested execution order

I'd ship Phase 1+2 together (recipes are the spine of Phase 1's generation calls), then Phase 4 (QA) before Phase 3 (Detail Page needs QA to display), then 5/6/7 in any order.

**Estimated scope**: Phase 1+2 ≈ 1 large turn. Phase 3+4 ≈ 1 large turn. Phase 5+6+7 ≈ 1 turn each.

---

## Question before I start

Want me to proceed with **Phase 1 + Phase 2 together** as the first build (the real spine — Golden Path wizard + recipe system + working export for TransPerfect Tech-SaaS)? Or would you rather I start with Phase 4 (QA engine) first so every generation that already exists immediately gets scored?
