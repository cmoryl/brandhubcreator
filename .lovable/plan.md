

# Phantom Code Cleanup Audit

## Confirmed Dead Code

### 1. Unused Component: `RealtimeIndicator.tsx`
- **File**: `src/components/RealtimeIndicator.tsx`
- **Status**: Zero imports anywhere in the codebase. Completely orphaned.
- **Action**: Delete file.

### 2. Unused Hook: `useKeyboardShortcuts.ts`
- **File**: `src/hooks/useKeyboardShortcuts.ts`
- **Status**: Zero imports anywhere. Never used.
- **Action**: Delete file.

### 3. Unused Hook: `usePortalKeyboard.ts`
- **File**: `src/hooks/usePortalKeyboard.ts`
- **Status**: Zero imports anywhere. Never used.
- **Action**: Delete file.

### 4. Unused Component + Hook: `scroll-animate.tsx` + `useScrollAnimation.ts`
- **Files**: `src/components/ui/scroll-animate.tsx`, `src/hooks/useScrollAnimation.ts`
- **Status**: `scroll-animate` imports `useScrollAnimation`, but nothing imports `scroll-animate`. Both are dead.
- **Action**: Delete both files.

### 5. Legacy Icon Dialogs (deprecated, unused)
- **Files**: `src/components/brand/iconography/IconCreatorDialog.tsx`, `IconSetGeneratorDialog.tsx`, `AppIconGenerator.tsx`
- **Status**: Marked `@deprecated` in the barrel export (`index.ts`). The barrel re-exports them, but nothing in the app imports them from the barrel or directly. The IconStudio replaced all three.
- **Action**: Delete the three files and remove their exports from `index.ts`.

## Borderline / Keep for Now

### Deprecated `gradientBars*` type fields
- Still actively used as fallback values in `HeroSection.tsx` for backward compatibility with existing saved data. These cannot be removed without a data migration. **Keep**.

### `src/test/` directory
- Contains test files. Not dead code, just unused test infrastructure. **Keep**.

## Summary

| Item | Type | Action |
|------|------|--------|
| `RealtimeIndicator.tsx` | Component | Delete |
| `useKeyboardShortcuts.ts` | Hook | Delete |
| `usePortalKeyboard.ts` | Hook | Delete |
| `scroll-animate.tsx` | Component | Delete |
| `useScrollAnimation.ts` | Hook | Delete |
| `IconCreatorDialog.tsx` | Component | Delete |
| `IconSetGeneratorDialog.tsx` | Component | Delete |
| `AppIconGenerator.tsx` | Component | Delete |
| Barrel exports in `iconography/index.ts` | Exports | Remove 3 legacy lines |

**Total**: 8 files to delete, 1 file to edit. Reduces bundle surface and eliminates dead code paths from the build.

