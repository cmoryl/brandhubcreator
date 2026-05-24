/**
 * useIconLibraryRowActions — shared row-action handlers for icon library cards.
 *
 * Centralizes duplicate / lock toggle / delete (with AlertDialog) so LibraryView
 * and IconSetsView don't drift apart. Mutations no-op when canEdit is false.
 */

import { useState, useCallback } from 'react';
import { toast } from 'sonner';
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
import { useIconLibraries, type IconLibrary } from '@/hooks/useIconLibraries';

interface Options {
  organizationId?: string;
  canEdit?: boolean;
}

export const useIconLibraryRowActions = ({ organizationId, canEdit = true }: Options) => {
  const { createLibrary, updateLibrary, deleteLibrary } = useIconLibraries(organizationId);
  const [pendingDelete, setPendingDelete] = useState<IconLibrary | null>(null);

  const handleDuplicate = useCallback(
    (lib: IconLibrary) => {
      if (!canEdit) return;
      if (!organizationId) {
        toast.error('No organization selected');
        return;
      }
      createLibrary.mutate({
        organization_id: organizationId,
        name: `${lib.name} (copy)`,
        level: lib.level,
        description: lib.description || undefined,
        icons: lib.icons,
        parent_library_id: lib.parent_library_id,
        is_active: lib.is_active,
        display_order: (lib.display_order ?? 0) + 1,
      });
    },
    [organizationId, canEdit, createLibrary],
  );

  const handleLockToggle = useCallback(
    (lib: IconLibrary) => {
      if (!canEdit) return;
      updateLibrary.mutate(
        { id: lib.id, updates: { is_active: !lib.is_active } },
        {
          onSuccess: () =>
            toast.success(lib.is_active ? `${lib.name} locked` : `${lib.name} unlocked`),
        },
      );
    },
    [canEdit, updateLibrary],
  );

  const requestDelete = useCallback(
    (lib: IconLibrary) => {
      if (!canEdit) return;
      setPendingDelete(lib);
    },
    [canEdit],
  );

  const confirmDelete = useCallback(() => {
    if (!pendingDelete) return;
    deleteLibrary.mutate(pendingDelete.id);
    setPendingDelete(null);
  }, [pendingDelete, deleteLibrary]);

  const deleteDialog = (
    <AlertDialog open={!!pendingDelete} onOpenChange={(o) => !o && setPendingDelete(null)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete icon set?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently remove <strong>{pendingDelete?.name}</strong> and all of its
            icons. This cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={confirmDelete}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  return {
    handleDuplicate,
    handleLockToggle,
    requestDelete,
    deleteDialog,
  };
};
