

# Imagery Hub Expansion Plan

## Current State
The Imagery Hub has: Entity Picker (tree + flat), Shutterstock inline search, bulk copy between entities, side-by-side comparison, and AI search suggestions. It lacks custom uploads, analytics, visual style analysis, and drag-and-drop organization.

## Planned Features

### 1. Custom Image Upload Support
Add a drag-and-drop upload zone within each imagery category, alongside the existing Shutterstock search. Users can drop files or click to browse, uploading directly to the `organization-assets` storage bucket. Uploaded images get the same `ApprovedImage` metadata structure as Shutterstock results.

- Add an upload dropzone component inside `ImageryWorkspace` per section
- Upload to `organization-assets/{orgId}/imagery/{entityId}/{sectionId}/`
- Generate thumbnails and persist as `ApprovedImage` entries in `guide_data`

### 2. AI Visual Style Analyzer
A new panel that uses Lovable AI (gemini-2.5-flash with image support) to analyze all approved imagery for an entity and return a style consistency report: dominant colors, style cohesion score, outlier detection, and recommendations.

- New edge function `imagery-style-analyzer` that receives image URLs and entity brand context
- Returns: cohesion score (0-100), dominant palette, style tags, flagged outliers with reasons
- UI: collapsible analysis panel below the workspace header with score ring, palette swatches, and flagged images

### 3. Image Analytics Dashboard
A stats bar and expandable analytics panel showing per-entity and cross-entity imagery metrics.

- **Per-entity stats**: total images, images per category, most recently added, category coverage gaps
- **Cross-entity overview**: entity with most/fewest images, categories missing across entities
- Computed client-side from existing `guide_data` — no new tables needed
- UI: stats cards row at top of workspace + an "Analytics" tab/panel toggle

### 4. Drag & Drop Reorder + Tagging
Enable reordering images within categories via drag-and-drop, and add a tagging system for filtering.

- Integrate `@dnd-kit/core` for drag-and-drop reorder within each section's image grid
- Persist new order back to `guide_data.approvedImagery.sections[].images`
- Add `tags: string[]` field to `ApprovedImage` type
- Tag editor inline on each image (click to add/remove tags)
- Filter bar above sections to filter by tag across all categories

## Technical Details

### Files to Create
- `src/components/imagery-hub/ImageryUploadZone.tsx` — drag-and-drop upload component
- `src/components/imagery-hub/ImageryAnalytics.tsx` — analytics dashboard panel
- `src/components/imagery-hub/StyleAnalysisPanel.tsx` — AI style analysis UI
- `src/components/imagery-hub/DraggableImageGrid.tsx` — drag-and-drop image grid
- `src/components/imagery-hub/ImageTagEditor.tsx` — inline tag editor
- `supabase/functions/imagery-style-analyzer/index.ts` — AI style analysis edge function

### Files to Modify
- `src/components/imagery-hub/ImageryWorkspace.tsx` — integrate upload zone, analytics toggle, drag-and-drop grid, tag filter bar
- `src/pages/ImageryHub.tsx` — add style analyzer trigger and analytics panel toggle
- `src/hooks/useEntityImagery.ts` — add `reorderImages` and `updateImageTags` methods
- `src/types/brand.ts` — add `tags?: string[]` to `ApprovedImage` type

### Dependencies
- `@dnd-kit/core` and `@dnd-kit/sortable` for drag-and-drop

### Edge Function: `imagery-style-analyzer`
- Receives entity image URLs + brand context (colors, archetype)
- Sends to gemini-2.5-flash-lite for visual analysis
- Returns structured cohesion report via tool calling
- Uses `LOVABLE_API_KEY` (auto-provisioned)

