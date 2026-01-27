

## Cache Management & Events Offline Resilience

This plan addresses two improvements to your application's data management:

1. **Cache Management Utility** - A centralized way to clear all caches and refresh data
2. **Events LocalStorage Fallback** - Adding offline resilience to events (matching brands/products)

---

## Overview

Your app currently has three separate cache layers with no unified way to clear them:
- React Query (icon libraries)
- LocalStorage (brands/products)
- In-memory Map (portal data)

Events currently lack the LocalStorage fallback that brands and products have, meaning if the backend is temporarily unreachable, users see empty event lists instead of cached data.

---

## What You'll Get

### Feature 1: Cache Management Utility

A new "Cache & Data" settings card in Organization Settings with:
- Visual display of cache status (localStorage size, items cached, last sync time)
- "Clear Cache & Refresh" button that purges all cache layers
- Automatic data refetch after clearing

### Feature 2: Events Offline Resilience

The events storage hook will gain:
- LocalStorage persistence (matching brands/products pattern)
- Automatic cache loading during backend outages
- Graceful degradation with helpful user messaging

---

## Implementation Steps

### Step 1: Create Cache Management Utility

Create `src/lib/cacheManager.ts` - a centralized utility that:
- Clears the `brandhub_guides_cache_v1` localStorage key (brands/products)
- Clears the new `brandhub_events_cache_v1` localStorage key (events)
- Clears the portal data in-memory Map
- Invalidates React Query cache
- Returns statistics about what was cleared

### Step 2: Add LocalStorage to Events

Update `src/hooks/useEventStorage.ts` to add:
- `CACHE_KEY` constant (`brandhub_events_cache_v1`)
- `saveCache()` function to persist events to localStorage
- `loadCache()` function to read cached events
- Date rehydration for createdAt/updatedAt fields
- Fallback logic in `fetchEvents()` to load cache on backend failure
- Call `saveCache()` after successful fetches

### Step 3: Add Cache Settings UI

Update `src/pages/OrganizationSettings.tsx` to add a new "Cache & Data" card:
- Display current cache statistics
- "Clear Cache & Refresh" button with loading state
- Confirmation dialog before clearing
- Toast notification on completion

### Step 4: Export Clear Function from Contexts

Update `src/contexts/BrandContext.tsx` and `src/contexts/EventContext.tsx` to:
- Export a `clearLocalCache()` method for external cache clearing
- Return `refetch` functions already available in storage hooks

---

## Technical Details

### Cache Manager API

```text
+------------------------+
|    cacheManager.ts     |
+------------------------+
| clearAllCaches()       | --> Clears localStorage + in-memory
| getCacheStats()        | --> Returns size/item counts
| clearPortalCache()     | --> Clears portal Map only
+------------------------+
```

### Events Cache Structure

```text
localStorage key: "brandhub_events_cache_v1"

{
  savedAt: number (timestamp),
  userId: string | null,
  events: EventGuide[]
}
```

### UI Component Structure

```text
Organization Settings
├── General (existing)
├── Branding (existing)
├── Portal Settings (existing)
├── Icon Library (existing)
├── Analytics (existing)
├── Cache & Data (NEW)  <-- Insert here
│   ├── Cache Statistics Display
│   └── Clear Cache Button
├── Team Members (existing)
└── Danger Zone (existing)
```

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/lib/cacheManager.ts` | Centralized cache clearing utility |

## Files to Modify

| File | Changes |
|------|---------|
| `src/hooks/useEventStorage.ts` | Add localStorage cache layer |
| `src/pages/OrganizationSettings.tsx` | Add Cache & Data settings card |
| `src/contexts/BrandContext.tsx` | Export clearLocalCache method |
| `src/contexts/EventContext.tsx` | Export clearLocalCache method |
| `src/hooks/usePortalData.ts` | Export cache clearing function |

---

## User Experience

After implementation:

1. **Normal operation**: No visible changes - caching works silently
2. **Backend outage**: Events now show cached data instead of empty state
3. **Troubleshooting**: Admins can go to Organization Settings > Cache & Data to:
   - See how much data is cached
   - Clear all caches if they suspect stale data
   - Force a fresh sync from the backend

---

## Risk Assessment

- **Low risk**: All changes are additive and follow existing patterns
- **Backward compatible**: Existing localStorage data continues to work
- **Graceful fallback**: If cache reading fails, app continues normally

