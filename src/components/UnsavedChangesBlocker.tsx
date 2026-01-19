import { useEffect } from 'react';
import { useBrands } from '@/contexts/BrandContext';

/**
 * Component that prevents accidental navigation when there are unsaved changes.
 * Uses the browser's native beforeunload event to show a confirmation dialog.
 * 
 * Note: useBlocker from react-router-dom requires a data router (createBrowserRouter),
 * but this app uses BrowserRouter. So we rely on beforeunload for protection.
 * The debounced sync (500ms) and flush on unmount in useBrandStorage ensure
 * data is saved even without explicit user confirmation on internal navigation.
 */
export const UnsavedChangesBlocker = () => {
  const { hasPendingChanges, saveNow } = useBrands();

  // Handle browser beforeunload with a native prompt
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasPendingChanges()) {
        e.preventDefault();
        // Modern browsers ignore custom messages, but we need to set returnValue
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasPendingChanges]);

  // Flush pending changes on unmount (when navigating away within the app)
  useEffect(() => {
    return () => {
      // If there are pending changes when this component unmounts,
      // the useBrandStorage hook's own cleanup will handle flushing them.
      // This is a safety net that triggers an immediate save attempt.
      if (hasPendingChanges()) {
        saveNow().catch(console.error);
      }
    };
  }, [hasPendingChanges, saveNow]);

  // This component doesn't render anything - it just provides protection
  return null;
};
