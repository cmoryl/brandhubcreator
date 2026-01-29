import { useEffect } from 'react';
import { useBrands } from '@/contexts/BrandContext';
import { useEvents } from '@/contexts/EventContext';

/**
 * Component that prevents accidental navigation when there are unsaved changes.
 * Uses the browser's native beforeunload event to show a confirmation dialog.
 * 
 * This component monitors BOTH brand AND event contexts for pending changes,
 * ensuring data is saved when navigating away or closing the browser.
 * 
 * Note: useBlocker from react-router-dom requires a data router (createBrowserRouter),
 * but this app uses BrowserRouter. So we rely on beforeunload for protection.
 * The debounced sync (500ms) and flush on unmount in storage hooks ensure
 * data is saved even without explicit user confirmation on internal navigation.
 */
export const UnsavedChangesBlocker = () => {
  const { hasPendingChanges: hasBrandChanges, saveNow: saveBrands } = useBrands();
  const { hasPendingChanges: hasEventChanges, saveNow: saveEvents } = useEvents();

  // Handle browser beforeunload with a native prompt
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasBrandChanges() || hasEventChanges()) {
        e.preventDefault();
        // Modern browsers ignore custom messages, but we need to set returnValue
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasBrandChanges, hasEventChanges]);

  // Flush pending changes on unmount (when navigating away within the app)
  useEffect(() => {
    return () => {
      // If there are pending changes when this component unmounts,
      // the storage hooks' own cleanup will handle flushing them.
      // This is a safety net that triggers an immediate save attempt.
      if (hasBrandChanges()) {
        saveBrands().catch(console.error);
      }
      if (hasEventChanges()) {
        saveEvents().catch(console.error);
      }
    };
  }, [hasBrandChanges, hasEventChanges, saveBrands, saveEvents]);

  // This component doesn't render anything - it just provides protection
  return null;
};
