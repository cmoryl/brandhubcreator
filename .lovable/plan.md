
# Template Specifications Auto-Select and Crash Fix

## Overview
This plan addresses two issues in the Template Specifications section:
1. When template specs exist, the first one should auto-display on page load
2. Clicking on template specs causes crashes due to missing null safety for the `items` array

## Current Behavior
- The section shows "Select a template specification above to edit" even when specs exist
- Clicking a spec tab can crash if the spec data is malformed (missing `items` array)

## Root Cause Analysis
1. **Auto-select issue**: The `selectedSpecId` state initializes as `null` with no effect to set it to the first spec
2. **Crash issue**: The code accesses `selectedSpec.items` in 15+ places without checking if `items` is actually an array, which can crash if database data is corrupted

---

## Implementation Plan

### Step 1: Add Auto-Select Effect
Add a `useEffect` hook that:
- Runs when `templateSpecs` changes
- If specs exist and no valid spec is selected, auto-selects the first one
- Clears selection if the selected spec was deleted

```text
Location: src/components/brand/TemplateSpecsSection.tsx (after line 298)
```

### Step 2: Add Defensive Guard for Items Array
Create a defensive variable that ensures `items` is always an array:

```text
const selectedSpecItems = selectedSpec?.items ?? [];
```

Replace all instances of `selectedSpec.items` with `selectedSpecItems` to prevent crashes when data is malformed.

### Step 3: Add Defensive Guard in Spec Selection Handlers
Update the handlers to verify the spec has valid structure before operating on it.

---

## Technical Details

### Files to Modify
- `src/components/brand/TemplateSpecsSection.tsx`

### Changes Summary

1. **Add useEffect for auto-selection** (after line 298):
   - Check if `templateSpecs.length > 0`
   - If `selectedSpecId` is null or not found in specs, set it to first spec's id
   - This ensures the first spec is shown immediately on page load

2. **Add defensive items array** (after selectedSpec definition):
   - Create `selectedSpecItems` with fallback to empty array
   - This prevents crashes on `.map()`, `.filter()`, `.length` operations

3. **Update all `selectedSpec.items` references** to use `selectedSpecItems`:
   - Line 338: `Math.max(0, ...selectedSpecItems.map(...))`
   - Line 348: `items: [...selectedSpecItems, newItem]`
   - Line 360: `items: selectedSpecItems.map(...)`
   - Line 369: `selectedSpecItems.filter(...)`
   - Line 389-392: `selectedSpecItems.findIndex(...)`
   - Line 426: `selectedSpecItems.map(...)`
   - Line 558: `items={selectedSpecItems.map(...)}`
   - Line 562: `{selectedSpecItems.map(...)}`
   - Line 578: `{selectedSpecItems.length === 0 && ...}`
   - Line 656-658: `{selectedSpecItems.map(...)}`
   - Line 713: `{selectedSpecItems.slice(0, 8).map(...)}`

### Expected Behavior After Fix
1. When page loads with template specs, the first spec is automatically selected and displayed in full
2. Clicking on spec tabs works without crashes, even if data is malformed
3. If all specs are deleted, the empty state shows correctly
4. If a selected spec is deleted, selection moves to the first remaining spec
