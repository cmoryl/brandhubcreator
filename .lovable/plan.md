

## SVG Icon Development — Best Practice Audit & Upgrade Plan

### Current State Summary

The system has solid foundations: a 4-pillar quality scorer, optical weight balancing, accessibility checks, and a multi-stage conversion pipeline. However, several areas fall short of production SVG best practices.

### Issues Found

**1. SVG Import Ignores Original viewBox**
When uploading SVGs, the importer hardcodes `viewBox: '0 0 24 24'` (line 112 of IconStylizer.tsx) instead of parsing the actual viewBox from the uploaded file. This silently distorts non-24x24 icons.

**2. Recoloring Is Fragile (Regex-Based)**
The `recolorSvg` function uses regex to replace `fill`/`stroke` attributes. This breaks on:
- Inline `<style>` blocks with CSS fill/stroke rules
- `class`-based styling (common in Illustrator/Figma exports)
- Gradient references (`fill="url(#grad)"`) — correctly excluded but silently skipped
- `currentColor` usage (should be preserved, not replaced)

**3. No SVG Cleanup on Import**
Uploaded SVGs from design tools contain bloat: editor metadata (`data-name`, Illustrator comments), unused `<defs>`, empty groups, redundant transforms, hardcoded dimensions (`width`/`height` attributes that override viewBox). None of this is stripped.

**4. No Accessibility Attributes**
Generated and imported SVGs never receive `role="img"`, `aria-label`, or `<title>` elements — required for WCAG compliance with meaningful graphics.

**5. Post-Processing in Edge Function Uses String Manipulation**
The stylize-icon edge function (lines 190-231) manipulates SVG via string `.replace()` — inserting attributes by prepending to `<svg`. This can produce malformed markup if the AI returns attributes in unexpected order.

**6. No Deduplication of SVG Attributes**
Multiple `.replace('<svg', '<svg attr="..."')` calls in the edge function can stack duplicate attributes if the AI already included them (e.g., two `stroke-linecap` attributes).

**7. Missing `xmlns` Validation on Direct Import**
Uploaded SVGs may lack `xmlns` — the sanitizer doesn't ensure it, which can cause rendering failures in `<img>` tags or external contexts.

---

### Upgrade Plan

#### A. Smart viewBox Extraction on Import
Parse the uploaded SVG's actual `viewBox` (or derive it from `width`/`height`) before storing. Only default to `0 0 24 24` if none is found.

**File**: `src/components/brand/iconography/studio/IconStylizer.tsx`

#### B. SVG Sanitization & Optimization Utility
Create a dedicated `src/lib/svgUtils.ts` utility with:
- `cleanSvg()` — strips editor metadata, empty `<g>` groups, XML comments, `<?xml>` declarations, unused `<defs>`, hardcoded `width`/`height` (preserving viewBox)
- `ensureAttributes()` — adds `xmlns`, ensures viewBox, adds `role="img"`
- `extractViewBox()` — parses viewBox from markup
- `recolorSvg()` — improved version using DOMParser for accurate attribute targeting (handles inline styles, classes, gradient refs)

**File**: new `src/lib/svgUtils.ts`

#### C. Accessibility Injection
Add `<title>` element with the icon name and `role="img"` + `aria-label` to all SVGs at save time. This applies to both AI-generated and uploaded icons.

**File**: `src/lib/svgUtils.ts` (part of `cleanSvg`)

#### D. Edge Function Post-Processing Hardening
Replace the sequential `.replace('<svg'` chain with a single-pass attribute builder that constructs the `<svg>` opening tag from a merged attribute map — preventing duplicates and malformed output.

**File**: `supabase/functions/stylize-icon/index.ts`

#### E. Unified Recolor Function
Move the improved recolor logic from `svgUtils.ts` into a single export and update all consumers (IconPreviewDialog, IconBrowser, IconStudioColorizer) to use it — eliminating the 3 separate regex implementations.

**Files**: `src/lib/svgUtils.ts`, then update imports in `IconPreviewDialog.tsx`, `IconBrowser.tsx`

#### F. fillMode Detection for Imports
When importing an SVG, auto-detect whether it uses stroke-based or fill-based rendering and set `fillMode` accordingly, rather than defaulting to `'fill'`.

**File**: `src/components/brand/iconography/studio/IconStylizer.tsx`

### Technical Details

The `svgUtils.ts` module (~150 lines) will use `DOMParser` for all parsing (not regex) to handle edge cases correctly. The edge function will use a similar approach with Deno's built-in XML capabilities.

All changes are backward-compatible — existing stored SVGs render identically, but new imports/generations will be cleaner and more robust.

