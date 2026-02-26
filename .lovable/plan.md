
# Shutterstock Image Search + Approved Imagery Sections

## Overview
Add a Shutterstock-powered image search capability (admin-only) that lets administrators search, preview, and approve stock images into organized sub-sections within the brand guide. Non-admin users see a curated, read-only gallery of approved imagery grouped by category.

## Prerequisites
- **Shutterstock API Key**: You'll need a Shutterstock API account. We'll securely store the API key as a backend secret. I'll walk you through obtaining one when we implement.

## Architecture

### 1. Backend: Edge Function for Shutterstock Search
Create a `shutterstock-search` edge function that:
- Accepts search queries, filters (orientation, category, color)
- Calls the Shutterstock API (`/v2/images/search`)
- Returns preview thumbnails and metadata
- Requires JWT verification + admin role check via `can_use_ai_features`

### 2. Data Model: Approved Imagery with Sub-Sections
Extend the existing `guide_data` JSONB (no new database table needed) with an `approvedImagery` field:

```text
approvedImagery: {
  sections: [
    { id, name, description, images: [{ id, url, thumbnailUrl, title, source, category, approvedBy, approvedAt }] }
  ]
}
```

Sub-sections are admin-configurable (e.g., "People", "Landscapes", "Product Shots", "Lifestyle", "Abstract/Textures").

### 3. Frontend Components

**ShutterstockSearchDialog** (admin-only)
- Search bar with filters (orientation, category, color, keyword)
- Results grid with preview thumbnails
- "Approve" button per image that downloads the licensed image and saves it to storage + the selected sub-section

**ApprovedImagerySection** (new brand guide section)
- Tabs or collapsible sub-sections for each imagery category
- Grid display with density controls (reusing existing pattern)
- Admin controls: add/remove sub-sections, reorder images, remove approved images
- Read-only view for non-admins showing the curated collection

### 4. Integration Points
- New sidebar entry: "Approved Imagery" under the Assets category
- Added to `FullBrandPage.tsx` section renderer
- Added to `BrandSidebar.tsx` / `ReorderableBrandSidebar.tsx`
- Type additions in `src/types/brand.ts`

## Technical Details

### Files to Create
- `supabase/functions/shutterstock-search/index.ts` -- Edge function proxying Shutterstock API
- `src/components/brand/approved-imagery/ApprovedImagerySection.tsx` -- Main section component
- `src/components/brand/approved-imagery/ShutterstockSearchDialog.tsx` -- Search modal
- `src/components/brand/approved-imagery/ImagerySubSection.tsx` -- Sub-section with grid

### Files to Modify
- `src/types/brand.ts` -- Add `ApprovedImagerySection`, `ApprovedImage` types, add field to `BrandGuideData`
- `src/components/brand/FullBrandPage.tsx` -- Register new section
- `src/components/brand/BrandSidebar.tsx` / `ReorderableBrandSidebar.tsx` -- Add sidebar entry
- `supabase/config.toml` -- Register edge function with `verify_jwt = false`

### Security
- Shutterstock API key stored as a backend secret (never exposed to client)
- Search endpoint gated by JWT + admin role check
- Only admins can search, approve, or remove images
- Non-admins see read-only approved gallery

### Shutterstock API Flow
1. Admin opens search dialog, enters query
2. Frontend calls edge function with search params
3. Edge function calls `https://api.shutterstock.com/v2/images/search` with API key
4. Returns preview thumbnails (watermarked previews are free to display)
5. On "Approve", the preview URL is saved to the sub-section (or optionally downloaded to storage for persistence)

## Step-by-Step Implementation Order
1. Request and store the Shutterstock API key as a secret
2. Create the `shutterstock-search` edge function
3. Add TypeScript types for approved imagery data
4. Build the `ApprovedImagerySection` component with sub-sections
5. Build the `ShutterstockSearchDialog` component
6. Wire into the brand editor sidebar and section renderer
7. Test end-to-end
