

## Add Grid Density Options to Image Library

Currently the Image Library has two view modes: **Grid** (5 columns max) and **List**. This plan adds multiple grid density options so you can view images at different sizes.

### What Changes

**New grid density toggle** replacing the current simple grid/list switch with 4 options:
- **Large Grid** (3 columns) -- bigger thumbnails for detailed viewing
- **Medium Grid** (5 columns) -- current default
- **Small Grid** (8 columns) -- compact view to see more images at once  
- **List** -- existing list view

The toolbar will show 4 small icon buttons (large grid, medium grid, small grid, list) in the same toggle group area where the current grid/list buttons sit.

### Technical Details

**File: `src/components/admin/AdminImageLibrary.tsx`**

1. Change `ViewMode` type from `'grid' | 'list'` to `'grid-lg' | 'grid-md' | 'grid-sm' | 'list'`
2. Update default state to `'grid-md'`
3. Replace the 2-button toggle with 4 buttons using appropriate icons (`LayoutGrid` for large, `Grid3X3` for medium, `Grid2X2` or similar for small, `List` for list)
4. Map each grid mode to different Tailwind column classes:
   - `grid-lg`: `grid-cols-2 sm:grid-cols-3 lg:grid-cols-3` with larger aspect ratio
   - `grid-md`: `grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5` (current)
   - `grid-sm`: `grid-cols-3 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8` 
5. Conditionally hide file name overlay text on small grid to keep cards clean
6. List view logic stays unchanged

