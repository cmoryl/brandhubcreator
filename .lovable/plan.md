

## Social Asset Studio — Platform Analytics Preview & Template Library

### Feature 1: Platform Analytics Preview

An inline analytics/compatibility panel shown per placement card and in the live preview area. Surfaces dimension checks, file size estimates, and format warnings.

**What it does:**
- When an image is uploaded to a placement slot, analyze it and show:
  - Actual dimensions vs. recommended dimensions (with match/mismatch indicator)
  - Estimated file size with platform limit warnings (e.g., Instagram max 30MB for images)
  - Aspect ratio match check (exact match, acceptable range, or needs cropping)
  - Format compatibility (JPG/PNG/WebP support per platform)
  - Resolution quality score (too small = blurry, too large = unnecessary)
- Color-coded status: green (perfect), amber (acceptable), red (issue)
- Collapsible panel below each `PlacementCard` when an image exists

**Components to create:**
- `src/components/social-studio/AssetAnalytics.tsx` — Reusable analytics display component
- `src/lib/socialPlatformLimits.ts` — Platform-specific file size limits, format support, and dimension tolerances

**Components to modify:**
- `PlacementCard.tsx` — Add analytics panel below image preview when uploaded
- `PlatformStudioView.tsx` — Show summary analytics badge in the live preview header

**Platform limits data structure:**
```text
Platform → {
  maxFileSize: number (MB)
  supportedFormats: string[]
  dimensionTolerance: number (% variance allowed)
  minResolution: { width, height }
}
```

---

### Feature 2: Template Library

A browsable library of pre-built layout templates per platform/format. Templates define composition zones (image area, text area, logo placement, CTA position) that users can preview and apply.

**What it does:**
- New "Templates" tab or panel accessible from each format view
- Pre-built templates organized by platform and format (feed, story, reel, cover)
- Template categories: Announcement, Product Showcase, Quote, Event Promo, Testimonial, Minimal
- Each template defines layout zones rendered as an SVG/CSS overlay preview
- Clicking a template shows it in the live mockup preview area
- Templates reference brand colors from the entity's `guide_data` (primary, secondary, accent)
- Templates are visual starting points — composition guides, not full editors

**Components to create:**
- `src/components/social-studio/TemplateLibrary.tsx` — Browsable template grid with category filter
- `src/components/social-studio/TemplatePreview.tsx` — Individual template card with hover preview
- `src/lib/socialTemplates.ts` — Template definitions (layout zones, text placeholders, color slots)

**Components to modify:**
- `PlatformStudioView.tsx` — Add "Templates" as a panel/section alongside asset placements, with a toggle to show/hide
- `PlacementCard.tsx` — Add "Use Template" option that applies a selected template's layout as a visual overlay guide

**Template data structure:**
```text
Template → {
  id, name, category, platforms[], formats[]
  zones: [
    { type: 'image' | 'text' | 'logo' | 'cta', 
      x%, y%, width%, height%, 
      label, style hints }
  ]
  colorSlots: ['primary', 'secondary', 'accent']
  thumbnail: SVG or CSS-rendered preview
}
```

**Initial template set:** ~18 templates (3 per category × 6 categories), each tagged with compatible platforms and formats.

---

### Implementation Order

1. Platform limits data file (`socialPlatformLimits.ts`)
2. `AssetAnalytics` component with dimension/size/format checks
3. Integrate analytics into `PlacementCard`
4. Template definitions file (`socialTemplates.ts`)
5. `TemplateLibrary` and `TemplatePreview` components
6. Integrate template browser into `PlatformStudioView`

