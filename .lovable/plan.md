# Icon Studio → Enterprise Production Platform

This is a large, multi-area expansion. To ship it well without one giant unreviewable change, I'll deliver it in **4 phases**. Each phase is shippable on its own and visible in the preview. You can re-prioritize between phases.

---

## Phase 1 — App shell, design system, dashboard, wizard upgrades (Steps 1–3)

**Design system**
- Add Geist Sans (Google Fonts) and TransPerfect palette tokens to `index.css` + `tailwind.config.ts` as semantic tokens: `--tp-navy`, `--tp-digital-blue`, `--tp-teal`, `--tp-pink`, `--tp-orange`, `--tp-green`, `--tp-alabaster`, etc., mapped to `primary`, `accent`, `ring`, status colors. No raw hex in components.
- Status chip system: Queued / Generating / Needs Review / Approved / Failed / Locked.

**App shell** (`src/pages/IconStudioPage.tsx`)
- Top bar: logo, brand-profile selector, Guided/Expert toggle, Save to Library.
- Left sidebar (collapsible) with: Dashboard, Generate, Library, Brands, Style Systems, Icon Sets, QA / Preflight, Export Center, Settings.
- Main workspace + persistent right-side **Production Summary** panel (totals, status counts, QA score, export readiness).

**Dashboard**
- Cards: Recent systems, Active drafts, Approved sets, Needs review, Export history, Brand profiles, Production volume sparkline, QA health gauge.

**Wizard Step 1 — Brand + Industry**
- Brand selector / "Create brand" inline.
- Company name, audience, icon purpose, multi-select usage contexts (Product UI, Website, Sales deck, …).
- 15 industry cards (Tech/SaaS … Custom) with icon strip, accent, core/sub-set counts, description, selected state.

**Wizard Step 2 — Core Icon System**
- Full generator panel: style (18 base styles), color mode, grid, stroke width slider, corner radius, detail level, optical padding, end cap, join, fill, size targets, light/dark toggle, a11y check.
- 12 core section cards (Navigation … Help & Support) with status chip, count, skeleton + thumbnails, Regenerate / Approve.

**Wizard Step 3 — Sub-sets**
- Tabbed pack browser: Department / Feature / Context / Workflow / Compliance / Channel.
- Tech/SaaS packs (15) + TransPerfect packs (16). Each pack card: name, description, count, recommended badge, preview icons, ETA, tags, select checkbox.
- "Generate selected packs" CTA.

---

## Phase 2 — Production Review + Preflight QA (Step 4)

- Top scorecards: Total icons, sections, approved, needs review, failed, brand compliance %, a11y %, SVG health %, export readiness %.
- Filter/search bar: status, section, style, issue, sort, view-mode toggle (grid / list / compare / contact sheet).
- Icon cards with: preview, name, section, status chip, brand fit score, QA warning dots, actions (Approve / Reject / Regenerate / Edit prompt / View SVG / Compare / Lock).
- Preflight checks runner (`src/lib/iconStudio/preflight.ts`): SVG validity, viewBox, stroke consistency, path cleanliness, alignment, optical balance, grid alignment, min-size readability, duplicates, overlaps, color/contrast compliance, light/dark, pixel previews @ 16/24/32/48/64, library-mixing detection, brand compliance, responsible-AI metaphor check.
- "QA Report" side panel: passed / warnings / critical / suggested fixes / regeneration recs.

---

## Phase 3 — Export Center (Step 5)

- Bulk export card: full ZIP, Save to Library, Share link, Export selected.
- Format matrix (toggles): SVG, Optimized SVG, PNG, WebP, PDF contact sheet, Figma-ready SVG, React lib, Vue lib, CSS sprite, Icon font, JSON manifest, Design tokens, Favicons, App icon package, Presentation PNGs.
- PNG size matrix: 16/24/32/48/64/128/256/512.
- Bundler (`src/lib/iconStudio/exportBundle.ts`) builds the exact tree:
  ```text
  icon-system/
    brand/{colors.json, typography.json, icon-rules.json}
    svg/{outline,filled,duotone}/
    png/{24,48,64,128,256,512}/
    react/   figma/
    docs/{icon-contact-sheet.pdf, usage-guide.pdf, qa-report.pdf}
  ```
- Per-section + per-sub-set export cards.

---

## Phase 4 — Library, Brand Profiles, Expert Mode, Supabase persistence

**Supabase migration** (one migration covering all):
`brands`, `icon_sets`, `icon_sections`, `icons`, `icon_variants`, `generation_recipes`, `qa_reports`, `export_jobs`, `comments`, `collections`, `tags` — all with org scoping + RLS via `is_org_member` / `has_role`. Icons store full metadata (id, slug, section, style, stroke, grid, colors, prompt, seed, version, status, scores, svg, png_urls, timestamps).

**Library UI**: saved sets, brands, recipes, presets, themes, favorites, rejects, version history + compare, duplicate, remix, lock, replace, search, tags, collections, comments, approval, downloads.

**Brand Profiles**: name, logo, description, color triads, typography, icon rules, do/don't, brand guide upload, existing samples, tone, naming convention. Used as input to generation/QA/export.

**Expert mode panel**: prompt + negative prompt editors, JSON recipe, seed lock, variation count, similarity tolerance, QA thresholds, SVG optimizer, token map, naming convention editor, batch rename, regeneration strategy, recipe inspector, raw metadata viewer.

---

## Technical notes

- Stack stays React 18 + Vite + TS + Tailwind + shadcn/ui + lucide. JSZip already installed for bundling. Add `svgo` (client-safe build) for optimized SVG only when needed; otherwise hand-rolled minimizer to avoid bundle bloat.
- All generation states are **simulated** until wired to the real `generate-icon-set` edge function — visible skeleton slots, animated progress, status messages ("Generating Navigation icons", "Checking SVG paths", etc.).
- New code lives under `src/components/icon-studio/` and `src/lib/iconStudio/`. Existing files (`industryPresets.ts`, `exportIcon.ts`, `generationClient.ts`, `IconSetWizard.tsx`) get extended, not rewritten.
- Accessibility: keyboard nav, visible focus rings on `--ring` (tp-digital-blue), ARIA labels on all icon-only buttons, `prefers-reduced-motion` respected, status announced via `aria-live`.

---

## Recommended start

Start with **Phase 1** now (shell + dashboard + Steps 1–3 upgrade + design tokens + Geist). It's the visible foundation everything else hangs on, and you'll see it in the preview immediately. Phases 2/3/4 follow in subsequent turns.

Reply with **"go"** to start Phase 1, or tell me which phase to start with / drop / reorder.
