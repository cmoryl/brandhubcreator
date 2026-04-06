

# Fix: Icon Kit — Import Created Icons to Brand/Product/Event

## Problem

The Icon Studio wizard creates and manages icons at the **organization library level** only. When you finish the process, there's no way to push the created icon set into the specific brand, product, or event you're working on. The Export step only offers file downloads (SVG ZIP, PNG sprite, etc.) — not an "Import to this Brand" action.

## Solution

Add an **"Import to Entity"** action at the end of the wizard that lets admins select which icons from the organization libraries to push into the current brand, product, or event's `guide_data.iconography` array.

## Changes

### 1. Pass entity context into IconStudio
- Update `IconStudioProps` to accept `entityId`, `entityType` (`brand` | `product` | `event`), and `entityName` so the wizard knows which entity it's being opened from.
- Thread these from `IconographySection.tsx` (which already has this context).

### 2. Add "Import to Brand/Product/Event" panel on the Export step
- Add a new section at the top of `IconStudioExport.tsx` (or as a separate card) with:
  - A checkbox grid of all icons across libraries (reusing existing selection UI)
  - A "Select All" toggle
  - An **"Import to [Entity Name]"** button that calls the `onIconsCreated` callback with no `libraryId` — triggering the existing `onIconographyChange` path in `IconographySection.tsx`
- Show the entity name and type in the button label for clarity (e.g., "Import 12 icons to GlobalLink")

### 3. Update handleSaveIcons flow
- Add a new dedicated `onImportToEntity` callback prop to `IconStudio` that explicitly pushes selected icons into the entity's guide_data, bypassing the library save path.
- Alternatively, reuse the existing `onIconsCreated` callback with `libraryId = undefined` which already triggers `onIconographyChange` in `IconographySection.tsx`.

### 4. Files to modify
- `src/components/brand/iconography/IconStudio.tsx` — add entity props, pass to Export step
- `src/components/brand/iconography/studio/IconStudioExport.tsx` — add "Import to Entity" section with icon selection and import button
- `src/components/brand/IconographySection.tsx` — pass `entityId`, `entityType`, `entityName` to IconStudio

