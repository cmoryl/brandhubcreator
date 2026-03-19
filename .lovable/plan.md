

# Enhanced Canva Template Links (Tier 1)

No new APIs or secrets needed. Pure UX improvement on existing Canva URL handling.

## What We're Building

1. **Smart Canva URL parser utility** — detects design type, extracts design ID, generates proper Canva favicon and branded styling from any `canva.com` URL
2. **Enhanced card display** — Canva-linked items show a Canva logo badge, detected design type (e.g. "Instagram Post", "Presentation"), and a branded purple "Open in Canva" button instead of a generic "Link"
3. **Brand context toast** — when a user clicks "Open in Canva", show a toast with the entity's primary brand colors and tagline as a reminder to apply them
4. **Canva Templates tab in Creative Studio** — a filterable gallery pulling all Canva-linked collateral items across the current entity, grouped by design type

## Files to Create

| File | Purpose |
|------|---------|
| `src/lib/canvaUtils.ts` | URL parser: extracts design ID, detects type (Social Post, Story, Presentation, etc.) from URL patterns and title heuristics, returns Canva favicon URL |
| `src/components/brand/creative-studio/CanvaTemplateGallery.tsx` | Gallery component showing all Canva-linked `BrandBrochure` items for the entity with type badges, thumbnails, and "Open in Canva" buttons |

## Files to Edit

| File | Change |
|------|--------|
| `src/components/brand/DigitalCollateralSection.tsx` | Replace the generic `canva.com` link check (line 288) with the new `canvaUtils` parser. Show Canva favicon + design type badge on cards. Add brand context toast on click. |
| `src/components/brand/creative-studio/CreativeStudioSection.tsx` | Add a "Canva" tab (with Palette icon) that renders `CanvaTemplateGallery`, passing `guideData` and entity's collateral data |
| `src/types/brand.ts` | No changes needed — `BrandBrochure.externalUrl` already stores the Canva link |

## Technical Details

**`canvaUtils.ts` logic:**
- Parse `canva.com/design/DAF...` URLs to extract design ID
- Detect design type from URL path segments (`/design/`, `/presentation/`) and from item category/title keywords
- Map to display labels: "Social Post", "Instagram Story", "Presentation", "Banner", "Logo", "Custom"
- Return Canva brand color (`#00C4CC`) for consistent styling
- Helper to build a brand context reminder string from `guideData` (primary colors + tagline)

**Card enhancement in `DigitalCollateralSection`:**
- When `externalUrl` contains `canva.com`: show inline Canva icon (SVG or favicon), design type badge, and a purple-tinted "Open in Canva" button
- On click, fire a `toast.info()` with "Remember to use: [Brand Name] colors — #hex1, #hex2 | Tagline: ..."
- Works for both social banner cards and regular collateral cards

**`CanvaTemplateGallery` in Creative Studio:**
- Receives the entity's `brochures` array, filters to items with `canva.com` in `externalUrl`
- Groups by detected design type
- Grid display with thumbnails (or placeholder with Canva icon), title, type badge
- "Open in Canva" button per card with brand context toast
- Empty state if no Canva templates linked yet, with guidance to add them via Digital Collateral

