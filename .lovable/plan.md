
# Event & Sub-Event Save Fixes

## Problem Analysis

After thorough investigation, I've identified **multiple critical issues** preventing event updates from persisting:

### Issue 1: UnsavedChangesBlocker Only Works with Brands
The `UnsavedChangesBlocker` component (line 14) uses `useBrands()` context only:
```tsx
export const UnsavedChangesBlocker = () => {
  const { hasPendingChanges, saveNow } = useBrands();  // ❌ Events not included!
```
This means:
- Events don't get saved when navigating away
- No `beforeunload` protection for event changes
- Pending event updates are lost on navigation

### Issue 2: useEventStorage Missing Cleanup/Flush on Unmount
The `useBrandStorage` hook has comprehensive cleanup (lines 913-926):
```tsx
useEffect(() => {
  window.addEventListener('beforeunload', handleBeforeUnload);
  return () => {
    flushPendingUpdates();  // ✅ Brands flush on unmount
  };
}, [flushPendingUpdates]);
```

But `useEventStorage` has **no equivalent** - pending updates are simply lost when the component unmounts.

### Issue 3: No flushPendingUpdates for Events
`useBrandStorage` has a sophisticated `flushPendingUpdates()` function (lines 830-911) that uses `fetch` with `keepalive: true` to reliably persist data during page unload. `useEventStorage` completely lacks this.

### Issue 4: Public Event Direct Updates May Fail Silently
In `EventEditor.tsx` (lines 385-432), when editing a public event not in context:
- Optimistic updates are made to local state
- Direct Supabase updates are attempted
- But if the sync fails, the error may not properly revert the state or notify the user

---

## Implementation Plan

### Step 1: Create Event-Aware Unsaved Changes Blocker
Create a unified blocker that handles both brands AND events.

**File: `src/components/UnsavedChangesBlocker.tsx`**
- Import both `useBrands` and `useEvents` contexts
- Check `hasPendingChanges()` for BOTH contexts
- Call `saveNow()` on BOTH contexts during cleanup

### Step 2: Add Flush Mechanism to useEventStorage
Add robust flush functionality matching `useBrandStorage`.

**File: `src/hooks/useEventStorage.ts`**

Add:
- User ref tracking (`userRef`, `accessTokenRef`, `orgRef`)
- Individual event sync timeout tracking (like `brandSyncTimeouts`)
- `flushPendingUpdates()` function using `fetch` with `keepalive: true`
- `beforeunload` listener and unmount cleanup effect
- Proper pending updates tracking per event ID

### Step 3: Improve EventEditor Direct Save Reliability
Enhance the direct Supabase update path for public events.

**File: `src/pages/EventEditor.tsx`**

- Add better error handling with user feedback
- Ensure state reverts are more robust
- Add console logging for debugging sync issues

### Step 4: Add saveCache on Successful Sync
Ensure localStorage cache is updated after successful sync.

**File: `src/hooks/useEventStorage.ts`**

- Call `saveCache(eventsRef.current)` after successful `syncPendingUpdates`
- This ensures offline resilience data stays current

---

## Technical Details

### Updated UnsavedChangesBlocker
```typescript
export const UnsavedChangesBlocker = () => {
  const { hasPendingChanges: hasBrandChanges, saveNow: saveBrands } = useBrands();
  const { hasPendingChanges: hasEventChanges, saveNow: saveEvents } = useEvents();

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasBrandChanges() || hasEventChanges()) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes...';
        return e.returnValue;
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasBrandChanges, hasEventChanges]);

  useEffect(() => {
    return () => {
      if (hasBrandChanges()) saveBrands().catch(console.error);
      if (hasEventChanges()) saveEvents().catch(console.error);
    };
  }, [hasBrandChanges, hasEventChanges, saveBrands, saveEvents]);

  return null;
};
```

### Key useEventStorage Additions
```typescript
// Add refs for reliable flush access
const userRef = useRef(user);
const accessTokenRef = useRef<string | null>(null);
const orgRef = useRef(organization);
const eventSyncTimeouts = useRef<Map<string, NodeJS.Timeout>>(new Map());
const pendingEventUpdates = useRef<Map<string, Partial<EventGuide>>>(new Map());

// Track access token for flush operations
useEffect(() => {
  supabase.auth.getSession().then(({ data }) => {
    accessTokenRef.current = data.session?.access_token ?? null;
  });
}, [user]);

// Flush function with keepalive for page unload
const flushPendingUpdates = useCallback(() => {
  eventSyncTimeouts.current.forEach((timeout, id) => {
    clearTimeout(timeout);
    const event = eventsRef.current.find(e => e.id === id);
    const pending = pendingEventUpdates.current.get(id);
    if (event && pending && userRef.current && accessTokenRef.current) {
      const merged = { ...event, ...pending };
      const dbPayload = eventGuideToDb(merged, userRef.current.id, orgRef.current?.id);
      fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/events?id=eq.${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          'Authorization': `Bearer ${accessTokenRef.current}`,
          'Prefer': 'return=minimal',
        },
        body: JSON.stringify(dbPayload),
        keepalive: true,
      }).catch(console.error);
    }
  });
  eventSyncTimeouts.current.clear();
}, []);

// Cleanup effect
useEffect(() => {
  window.addEventListener('beforeunload', flushPendingUpdates);
  return () => {
    window.removeEventListener('beforeunload', flushPendingUpdates);
    flushPendingUpdates();
  };
}, [flushPendingUpdates]);
```

---

## Files to Modify

1. **`src/components/UnsavedChangesBlocker.tsx`** - Add event context integration
2. **`src/hooks/useEventStorage.ts`** - Add flush mechanism, refs, and cleanup
3. **`src/pages/EventEditor.tsx`** - Improve direct update error handling

---

## Testing Checklist

After implementation:
- [ ] Make changes to an event, navigate away, verify changes persist
- [ ] Make changes to a sub-event, navigate away, verify changes persist
- [ ] Close browser tab while editing, reopen, verify changes saved
- [ ] Test offline scenario - make changes, go offline, verify cached
- [ ] Test public event editing path for non-context events
