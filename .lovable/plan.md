## Context

Today `StyleSystemsView` and `StyleSystemDetailDialog` render every recipe with **emoji placeholders** (`SAMPLE_EMOJIS`, `CATEGORIES`). The recipe (`stroke / fill / duotone / mono` + a visual `variant`) is shown via CSS surfaces around an emoji glyph. None of it touches a real icon.

Now that we have:
- 111k bundled SVG icons across 29 packs with category + variant metadata
- `applyBrandDnaToSvg()` / `restyleBundledIcon()` that can re-skin any bundled SVG to a target stroke / cap / join / color / fillMode
- Variant detection (outline, filled, duotone, bold, thin, rounded, sharp, …)

Style Systems should stop being a mood board and become a **live preview + apply** surface.

## Goals

1. Every Style System tile previews with **real bundled icons**, restyled through that system's recipe.
2. Each system declares **preferred source variants** so recipes pull from native variants where possible (Outline → outline, Duotone → duotone, Sharp UI → sharp, etc.) instead of synthesizing from one source.
3. From a Style System users can **apply the recipe to a bundled pack/selection** and save the result as a new core library — same flow imported icons already use, but in bulk.
4. The detail dialog becomes the "try before you buy" surface: pick a pack, pick a category, see the restyle live across a real ladder.

## Changes

### 1. Recipe → BrandRestyleDNA mapping
Add `src/components/icon-studio/shell/styleRecipeToDna.ts`:
- Maps each `BaseStyle.recipe` + `preview` to a `BrandRestyleDNA` (`strokeWidth`, `strokeLinecap`, `strokeLinejoin`, `fillMode`, `primaryColor`).
- Maps each style to **preferred source variants** (ordered list, e.g. `['outline', 'thin', 'light']` for `outline`, `['duotone', 'two-tone']` for `duotone`, `['sharp']` for `sharp-ui`, etc.).
- Declares **preferred packs** per style (e.g. `phosphor` for duotone, `heroicons` for outline/solid, `material-symbols` for rounded/sharp).

### 2. Canonical sample slugs
Add `BASE_SAMPLE_SLUGS` — 6–8 universally-present icon names that exist in nearly every pack (`home`, `search`, `user`, `settings`, `heart`, `star`, `bell`, `download`). Used everywhere a preview is currently emoji-driven.

### 3. New `BundledIconLadder` preview component
`src/components/icon-studio/shell/BundledIconLadder.tsx`:
- Props: `style: BaseStyle`, `pack?: string` (defaults to style's preferred pack), `count`, `size`, `accent`.
- Resolves each canonical slug → best variant match in the chosen pack (using existing variant detector against `loadPackIndex`), with graceful fallback to the next preferred pack.
- Calls `restyleBundledIcon(pack, name, dna)` and renders the returned data URLs.
- Lazy / suspended; skeletons while resolving.

### 4. `StyleSystemsView` updates
- Replace `IconSetPreview emojis={SAMPLE_EMOJIS}` on each card with `<BundledIconLadder style={s} count={6} size="sm" />`.
- Replace the **Active recipe panel** preview with the same component at a larger size, plus a small "Source: {pack} · {variant}" caption.
- Add an "Apply to imported pack…" button next to "Use in new set" — opens the new dialog below.

### 5. `StyleSystemDetailDialog` updates
- Drop the `CATEGORIES`/emoji ladder. Replace with:
  - A **pack picker** (defaults to style's preferred pack, lists all packs that expose at least one preferred variant).
  - A **category picker** sourced from `pack.categories`.
  - The size ladder (16 / 24 / 32 / 48 / 64) rendered with `BundledIconLadder` against the chosen pack+category.
- "Apply to set" button stays but now also offers "Apply to this pack's selection" → opens dialog #6.

### 6. New `ApplyStyleToBundledDialog`
`src/components/icon-studio/shell/ApplyStyleToBundledDialog.tsx`:
- Inputs: style recipe, pack, optional category filter, optional variant filter, icon-count cap (default 48, max 250).
- Streams `restyleBundledIcon()` over the selected entries with a progress bar.
- On confirm, calls `useIconLibraries().createLibrary` with `level: 'core'`, `name: "{Pack} · {Style}"`, and the restyled icons stored as `BrandIconography[]` (`id: 'restyled:{pack}/{name}/{recipeHash}'`, `svgPath: <full svg>`, `viewBox`, `fillMode`, `category`).
- Toasts and navigates to the new library in `LibraryView` via the existing `deepLinkLibraryId` pattern (already wired in `IconStudioPage`).

### 7. Pack-aware "preferred source" hints
On each Style System card, show a tiny caption: `Sourced from {pack} · {variant}`. This makes the variant-filter work feel visible and explains why the previews look authentic instead of synthesized.

## Out of scope (call out, don't build)

- New style recipes. The current 36 stay as-is.
- Editing recipes from the UI. Recipes remain code-defined.
- Re-running restyle on already-generated libraries (separate "remix" flow).

## Technical details

- Resolution order per slug: exact match in preferred pack → preferred variant suffix in preferred pack → exact match in fallback packs → first hit in any preferred pack. Cache resolved `(slug, packPreferenceKey) → (pack, name)` in memory for the session.
- `restyleBundledIcon` already caches by `(pack, name, dnaHash)` in memory + localStorage, so re-rendering Style System cards on filter changes is cheap.
- `BundledIconLadder` must defer all SVG materialization until visible (use `IntersectionObserver` or render-on-mount with skeletons — same pattern as `IconCell` in `ImportedIconsView`).
- Skip multicolor packs (`twemoji`, `openmoji`, `flag`, `devicon`, `cryptocurrency`, `meteocons`) from preferred-pack lists for monochrome styles; `restyleBundledIcon` already returns `skipped: true` for these so it's safe, but filtering up front avoids a flash.
- Save-as-library writes go through the existing `organization_icon_libraries` table — no migration needed. `BrandIconography.svgPath` already supports full `<svg>` strings (proven by the imported-icons "Add to library" flow).
- All new UI uses semantic tokens; no raw colors.

## File map

```text
src/components/icon-studio/shell/
  StyleSystemsView.tsx              (edit)
  StyleSystemDetailDialog.tsx       (edit)
  styleRecipeToDna.ts               (new)
  BundledIconLadder.tsx             (new)
  ApplyStyleToBundledDialog.tsx     (new)
```

No DB, no edge functions, no schema changes.
