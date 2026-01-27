## Cache Management & Events Offline Resilience - IMPLEMENTED ✓

### Summary
Added centralized cache management and events offline resilience:

1. **Cache Management Utility** (`src/lib/cacheManager.ts`)
   - Unified API for clearing all caches (localStorage, portal Map, React Query)
   - `getCacheStats()` for statistics display
   - `clearAllCaches()` for one-click purge

2. **Events LocalStorage Fallback** (`src/hooks/useEventStorage.ts`)
   - Added `CACHE_KEY` constant using shared cache keys
   - Added `saveCache()` and `loadCache()` functions
   - Automatic fallback to cached data on fetch failure
   - Cache saved after successful fetches

3. **Cache Settings UI** (`src/components/organization/CacheSettingsCard.tsx`)
   - Displays cache statistics (size, items, last sync)
   - "Clear Cache & Refresh" button with confirmation
   - Integrates with Organization Settings page

4. **Context Exports**
   - `clearLocalCache()` exposed from `BrandContext` and `EventContext`
   - Portal cache registered with `cacheManager` for external clearing

### Files Modified
- `src/lib/cacheManager.ts` (NEW)
- `src/components/organization/CacheSettingsCard.tsx` (NEW)
- `src/hooks/useEventStorage.ts`
- `src/hooks/usePortalData.ts`
- `src/contexts/BrandContext.tsx`
- `src/contexts/EventContext.tsx`
- `src/pages/OrganizationSettings.tsx`

