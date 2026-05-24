# Icon Studio Master Plan — 8 Phases

End-state: every brand in BrandHub owns a fully-restyled, AI-searchable, governance-controlled library of ~40,000 world-class icons, surfaced contextually in every relevant guide section, and exportable as fonts, React packages, sprites, or Figma libraries.

---

## Phase 1 — Maximal Permissive Icon Library (~40k icons)

Bundle 19 best-in-class free/permissive packs. Excludes anything paid (Streamline, Noun Project, FA Pro, Iconscout, Flaticon, SF Symbols) — license-blocked for redistribution.

**Original 12 (~15k):** Phosphor, Lucide, Tabler, Heroicons, Remix, Iconoir, Material Symbols, Carbon, Game Icons, Simple Icons, Font Awesome Free, Ionicons.

**Tier 1 (~17k):** Fluent UI, Mingcute, Solar, Hugeicons Free, Radix, Akar, Devicon, Flag Icons, Weather Icons, Twemoji.

**Tier 2 (~8k):** CoreUI Free, CSS.gg, Bytesize, Pixelarticons, Cryptocurrency Icons, OpenMoji, Atlas Icons.

**Implementation:**
- `scripts/build-icon-library.mjs` — one-shot Node importer (npm + GitHub tarballs), normalizes to 24×24 + `currentColor`, runs SVGO, preserves multi-variant packs (Phosphor 6 weights, Material Symbols 3 styles, Hugeicons 9 styles, Solar 4 styles, Fluent regular/filled).
- Manifest schema extended with `pack`, `variant`, `category`, `tags[]`, `license`, `attribution`, `multicolor`. Split per-pack and lazy-loaded.
- New `ImportedIconsView` with react-window virtualization, filter rail (pack + industry + variant), search, license chips.
- New `/icon-studio/attributions` route + `LICENSES.md` for CC-BY / SIL OFL / CC-BY-SA compliance. Export `.zip` includes `ATTRIBUTIONS.txt`.

Footprint: ~90 MB repo, ~40k SVGs across 19 pack directories.

---

## Phase 2 — Section-Aware Icon Surfacing

Auto-surface relevant icons in every brand guide section based on the brand's industry and the section's purpose.

**Implementation:**
- `src/lib/iconSectionMapping.ts` — section → category/tag list (e.g. `socialAssets` → `['brands','social']`, `appIcons` → `['ui','system','communication']`, `iconography` → all UI families, `geometricPrimitives` → `['shapes','abstract']`).
- `src/lib/brandIndustryToIconTags.ts` — brand `industry` → preferred categories (healthcare → `['health','science','wellness']`, fintech → `['finance','crypto','business','charts']`, etc., ~25 industries).
- "Suggested for this brand" rail at the top of each relevant section (Iconography, Symbol Standards, Social Assets, App Icons, QR Codes, Geometric Primitives), with "Browse all" below.
- Selections persisted to `guide_data.sectionIconSelections` so admins can lock per-brand curated sets.
- Edit-permission guarded via `useGuideAdmin` (per existing project rules).

---

## Phase 3 — AI Icon Intelligence

- **Semantic search**: embed every icon's name + tags + category via Lovable AI Gateway, cache in new `icon_embeddings` table (id, embedding vector, manifest_id). Edge function `icon-semantic-search` returns ranked matches. Search like "trustworthy handshake" → cross-pack semantic results.
- **Auto-tagging pass**: batch script using Gemini Flash Lite enriches sparse tag arrays. One-time + re-runnable.
- **Brand-fit scoring**: edge function `icon-brand-fit` scores icons against brand archetype + industry + voice, returns top-N curated set per brand.

Schema additions: `icon_embeddings`, `icon_brand_fit_scores` (brand_id, icon_id, score, computed_at).

---

## Phase 4 — Auto-Restyling Pipeline (the big "wow")

Apply each brand's icon DNA (stroke weight, cap, corner radius, fill rule, color tokens) to any of the 40k bundled icons on demand.

- Extend existing IconKIT Brand DNA Lock to operate on bundled SVG paths (not only AI-generated icons).
- Restyling happens client-side via the existing `fetchSvgAsBrandIconography` pipeline; results cached per (brand_id, icon_id, dna_version) in `brand_icon_restyled` table with optional Supabase storage offload for hot sets.
- Multicolor packs (Flags, Devicon, Twemoji, OpenMoji, Crypto) flagged to skip recolor — strokes still conformed where possible.
- UI: side-by-side "Original / On-Brand" toggle on every icon card.

Outcome: every brand effectively owns 40k icons in its own visual language.

---

## Phase 5 — Smart Icon Sets & Kits

- **Auto-assembled kits**: edge function takes industry + section + size → returns a coherent set (nav, actions, states, categories) restyled to brand.
- **Section presets**: "Populate Iconography" / "Populate App Icons" one-click buttons in each section.
- **Cross-brand kit cloning**: copy a kit from parent brand to sub-brand, DNA-inheritance applied automatically.
- New `icon_kits` table: brand_id, name, section, icon_ids[], dna_snapshot, locked.

---

## Phase 6 — Usage Analytics & Learning Loop

- Track icon picks per section per industry → `icon_usage_events` table.
- Feed back into Phase 3 brand-fit ranking (collaborative filtering style: "brands like yours also chose…").
- "Trending in your industry" rail.
- "Brand Essentials" surface: most-used icons across this brand's sections.
- Surface unused icons for cleanup.

---

## Phase 7 — Export & Distribution

- **Icon font (.woff2)** generation per brand — uses fantasticon or icomoon-style pipeline in an edge function.
- **React component package** export (`<BrandIcons.Heart />`) as a downloadable npm tarball.
- **Figma plugin export** — push the brand's restyled set to a Figma library via Figma REST API (requires Figma token per org).
- **SVG sprite sheet** + **symbol sheet** for performance-critical embeds.
- All export formats added to existing `ExportCenterView` scope.

---

## Phase 8 — Governance & Compliance

- Compliance scanner (extends existing DataForce compliance pipeline) flags use of non-approved icons per brand.
- Section icon-set locking: master admin can freeze a section's icon set; sub-brand admins request changes.
- Approval workflow with audit log entries (uses existing `audit_logs` infrastructure).
- "Approved Icons Only" mode per brand for strict governance contexts.

---

## Database additions (cumulative across phases)

```
Phase 3: icon_embeddings, icon_brand_fit_scores
Phase 4: brand_icon_restyled
Phase 5: icon_kits
Phase 6: icon_usage_events
Phase 8: icon_approval_requests (audit_logs already exists)
```

All tables RLS-protected, scoped to organization_id via existing membership checks. No FKs to auth.users; user_id is uuid only.

---

## Execution order & rationale

1. **Phase 1** — foundation (the icons themselves)
2. **Phase 2** — make them useful in context
3. **Phase 4** — biggest visible payoff (every brand owns 40k on-brand icons)
4. **Phase 3** — AI search amplifies discovery
5. **Phase 5** — kits productize the restyling
6. **Phase 7** — export turns the library into a deliverable
7. **Phase 6** — analytics improve everything once real usage exists
8. **Phase 8** — governance hardens it for enterprise

Per your standing preference, each phase runs continuously — no per-batch check-ins. Approval gates only between phases.

---

## Out of scope (across all phases)

- Paid packs (Streamline, Noun Project, Iconscout, Flaticon, FA Pro, SF Symbols) — license-blocked
- GPL-licensed packs — would relicense the codebase
- AI-generated *new* icons (already covered by existing IconKIT AI Generator tab)
