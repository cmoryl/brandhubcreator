## Goal
Expand the Global Logo Hub with additional client logos (with proper black variants) to better populate 5 TransPerfect industry pages.

## Industries to cover
1. **Manufacturing** — `transperfect.com/industries/manufacturing`
2. **Automotive** — `transperfect.com/industries/automotive`
3. **Digital Marketing / Advertising** — `transperfect.com/industries/marketing-translation-services`
4. **Medical Device** — `transperfect.com/industries/medical-device` (goes into existing Life Sciences category)
5. **Legal** — `transperfect.com/industries/legal` (audit/top-up existing Legal category)

## Approach

### 1. Discover clients (Firecrawl)
- Scrape each of the 5 TransPerfect industry pages for client/case-study brand names + logos.
- Deduplicate against `global_client_logos` to identify only net-new brands per industry.

### 2. Category setup
- Create new categories where missing: **Manufacturing**, **Automotive**, **Digital Marketing** (Digital Marketing may fold into existing `Digital` — I'll confirm during discovery, defaulting to a new "Marketing & Advertising" category to keep client-side vs marketing-agency clients separate).
- Medical Device brands → existing **Life Sciences** category.
- Legal brands → existing **Legal** category (fill gaps only).

### 3. Sourcing pipeline (reuse existing infra)
For each new brand:
1. Insert row into `global_client_logos` with `name`, `category`, `website_url`.
2. Run `hard-search-logos` edge function — Firecrawl scrapes official site branding, uploads color SVG/PNG + derives true monochrome **black** and **white** variants.
3. Fallback for gaps: Wikimedia/simple-icons via `resource-icons-libs`, then `deep-icon-fetch`, then `derive-mono-icons` to guarantee a black variant exists.
4. Rasterize any SVG-only wordmarks to 2048px PNG via `rasterize-wordmark-png`.

### 4. Verification
- Extend the existing Missing Logos queue filter to surface these 5 industries.
- Run a targeted audit (mirroring `travel_audit`/`games_audit`) that reports per-brand: has `wordmark-black` (SVG or ≥1024px PNG)? Any brand failing = flagged for manual upload.
- Publish results to a lightweight `/logohub/industry-fill-qa` page grouped by industry, with the same repair actions (Upload / Deep-fetch / Derive B/W) already used on the Travel Review page.

## Deliverables
- New/updated categories and brand rows populated with color + **black** wordmark variants (white variants also derived for free by the pipeline).
- QA page at `/logohub/industry-fill-qa` showing coverage per industry with one-click repair.
- Any brand the pipeline can't auto-resolve is queued in `/logohub/missing` for manual SVG upload.

## Question before I start
Roughly how many logos per industry do you want (e.g. top 10–15 each, or every logo shown on the page)? Default: I'll ingest every distinct brand featured on each of the 5 pages.