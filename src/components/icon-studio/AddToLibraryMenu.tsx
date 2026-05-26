/**
 * AddToLibraryMenu — dropdown that adds a given icon to an existing
 * organization icon library, or creates a new "Imported icons" library
 * scoped to the active organization. Used from the imported-icons workspace
 * so bundled icons can flow into the same downstream surfaces as generated
 * icon sets (Library / Icon Sets / Brand sections).
 */
import { useState } from 'react';
import { Plus, FolderPlus, Check, Library as LibraryIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import type { BrandIconography } from '@/types/brand';
import { useIconLibraries, type IconLibrary } from '@/hooks/useIconLibraries';

interface Props {
  icon: BrandIconography | null;
  organizationId?: string;
  /** Optional label override (e.g. "Add to brand section"). */
  label?: string;
}

export const AddToLibraryMenu = ({ icon, organizationId, label = 'Add to library' }: Props) => {
  const { libraries, createLibrary, updateLibrary } = useIconLibraries(organizationId);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  if (!organizationId || !icon) return null;

  // Show only writable (non-bundled) libraries.
  const writable: IconLibrary[] = libraries.filter((l) => !String(l.id).startsWith('bundled:'));

  const handleAddToExisting = async (lib: IconLibrary) => {
    if (!icon) return;
    if (lib.icons.some((i) => i.id === icon.id || i.name === icon.name)) {
      toast.info(`Already in “${lib.name}”`);
      return;
    }
    setBusyId(lib.id);
    try {
      await updateLibrary.mutateAsync({
        id: lib.id,
        updates: { icons: [...lib.icons, icon] },
      });
      toast.success(`Added to “${lib.name}”`);
      setOpen(false);
    } catch {
      // toast already surfaced by hook
    } finally {
      setBusyId(null);
    }
  };

  const handleCreateNew = async () => {
    if (!icon) return;
    setBusyId('__new');
    try {
      await createLibrary.mutateAsync({
        organization_id: organizationId,
        name: 'Imported icons',
        level: 'core',
        description: 'Icons saved from the bundled library',
        icons: [icon],
      });
      toast.success(`Added "${icon.name}" to "Imported icons" — available in brand sections`);
      setOpen(false);
    } finally {
      setBusyId(null);
    }
  };


  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button size="sm" variant="secondary" className="gap-1.5">
          <Plus className="h-3.5 w-3.5" /> {label}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="text-[11px] uppercase tracking-wider text-muted-foreground">
          Add to existing library
        </DropdownMenuLabel>
        {writable.length === 0 ? (
          <div className="px-2 py-3 text-xs text-muted-foreground">
            No libraries yet. Create one below.
          </div>
        ) : (
          writable.slice(0, 12).map((lib) => {
            const already = lib.icons.some((i) => i.id === icon.id || i.name === icon.name);
            return (
              <DropdownMenuItem
                key={lib.id}
                disabled={busyId === lib.id || already}
                onClick={(e) => {
                  e.preventDefault();
                  handleAddToExisting(lib);
                }}
                className="flex items-center justify-between gap-2"
              >
                <span className="flex items-center gap-2 truncate">
                  <LibraryIcon className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="truncate">{lib.name}</span>
                  <span className="text-[10px] text-muted-foreground uppercase">{lib.level}</span>
                </span>
                {already && <Check className="h-3.5 w-3.5 text-muted-foreground" />}
              </DropdownMenuItem>
            );
          })
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={(e) => {
            e.preventDefault();
            handleCreateNew();
          }}
          disabled={busyId === '__new'}
        >
          <FolderPlus className="mr-2 h-3.5 w-3.5" />
          New “Imported icons” library
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
