import { useEffect, useCallback, useState } from 'react';
import { useBlocker } from 'react-router-dom';
import { useBrands } from '@/contexts/BrandContext';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Loader2 } from 'lucide-react';

export const UnsavedChangesBlocker = () => {
  const { hasPendingChanges, saveNow } = useBrands();
  const [isSaving, setIsSaving] = useState(false);

  // Check for pending changes
  const shouldBlock = useCallback(() => {
    return hasPendingChanges();
  }, [hasPendingChanges]);

  const blocker = useBlocker(shouldBlock);

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

  const handleSaveAndLeave = async () => {
    setIsSaving(true);
    try {
      await saveNow();
      blocker.proceed?.();
    } catch (error) {
      console.error('Failed to save:', error);
      // Still proceed even if save fails - the flush mechanism will retry
      blocker.proceed?.();
    } finally {
      setIsSaving(false);
    }
  };

  const handleLeaveWithoutSaving = () => {
    blocker.proceed?.();
  };

  const handleStay = () => {
    blocker.reset?.();
  };

  if (blocker.state !== 'blocked') {
    return null;
  }

  return (
    <AlertDialog open={true}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Unsaved Changes</AlertDialogTitle>
          <AlertDialogDescription>
            You have unsaved changes that are still syncing. What would you like to do?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          <AlertDialogCancel onClick={handleStay} disabled={isSaving}>
            Stay on Page
          </AlertDialogCancel>
          <button 
            onClick={handleLeaveWithoutSaving} 
            disabled={isSaving}
            className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground h-10 px-4 py-2"
          >
            Leave Without Saving
          </button>
          <AlertDialogAction onClick={handleSaveAndLeave} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              'Save & Leave'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
