/**
 * IconLibraryManager - Organization settings component for managing icon libraries
 * Supports 3-level hierarchy: Core → Product Line → Brand
 * Features drag-and-drop reordering within each level
 * 
 * Now uses the unified IconStudio for icon creation/generation
 */

import { useState } from 'react';
import { Separator } from '@/components/ui/separator';
import { 
  Plus, 
  ChevronRight,
  Building2,
  Package,
  Layers,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useIconLibraries, IconLibrary } from '@/hooks/useIconLibraries';
import { IconStudio, IconStudioTab } from './IconStudio';
import { SortableLevelSection } from './SortableLevelSection';
import { IconLibraryBrandLinker } from './IconLibraryBrandLinker';
import { BrandIconography } from '@/types/brand';

interface IconLibraryManagerProps {
  organizationId: string;
  organizationName?: string;
  brandColors?: Array<{ hex: string; name: string }>;
}

export const IconLibraryManager = ({ organizationId, organizationName = '', brandColors = [] }: IconLibraryManagerProps) => {
  const {
    libraries,
    coreLibraries,
    productLineLibraries,
    brandLibraries,
    isLoading,
    createLibrary,
    updateLibrary,
    deleteLibrary,
  } = useIconLibraries(organizationId);

  const [expandedLevels, setExpandedLevels] = useState<Set<string>>(new Set(['core', 'product_line', 'brand']));
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showIconStudio, setShowIconStudio] = useState(false);
  const [iconStudioInitialTab, setIconStudioInitialTab] = useState<IconStudioTab>('library');
  const [editingLibrary, setEditingLibrary] = useState<IconLibrary | null>(null);
  const [activeLibraryForIcons, setActiveLibraryForIcons] = useState<IconLibrary | null>(null);

  // Form state for create/edit
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formLevel, setFormLevel] = useState<'core' | 'product_line' | 'brand'>('core');
  const [formParentId, setFormParentId] = useState<string | null>(null);

  const toggleLevel = (level: string) => {
    setExpandedLevels(prev => {
      const next = new Set(prev);
      if (next.has(level)) {
        next.delete(level);
      } else {
        next.add(level);
      }
      return next;
    });
  };

  const resetForm = () => {
    setFormName('');
    setFormDescription('');
    setFormLevel('core');
    setFormParentId(null);
    setEditingLibrary(null);
  };

  const openCreateDialog = (level?: 'core' | 'product_line' | 'brand') => {
    resetForm();
    if (level) setFormLevel(level);
    setShowCreateDialog(true);
  };

  const openEditDialog = (library: IconLibrary) => {
    setEditingLibrary(library);
    setFormName(library.name);
    setFormDescription(library.description || '');
    setFormLevel(library.level);
    setFormParentId(library.parent_library_id);
    setShowCreateDialog(true);
  };

  const handleSaveLibrary = async () => {
    if (!formName.trim()) return;

    try {
      const parentId = formParentId && formParentId.trim() !== '' ? formParentId : null;

      if (editingLibrary) {
        await updateLibrary.mutateAsync({
          id: editingLibrary.id,
          updates: {
            name: formName,
            description: formDescription || undefined,
            parent_library_id: parentId,
          },
        });
      } else {
        await createLibrary.mutateAsync({
          organization_id: organizationId,
          name: formName,
          level: formLevel,
          description: formDescription || undefined,
          parent_library_id: parentId,
          icons: [],
        });
      }

      setShowCreateDialog(false);
      resetForm();
    } catch (error) {
      // Error toast is already shown by the mutation's onError handler
      console.error('Save library failed:', error);
    }
  };

  const handleAddIcons = (library: IconLibrary) => {
    setActiveLibraryForIcons(library);
    setIconStudioInitialTab('creator');
    setShowIconStudio(true);
  };

  const openIconStudio = (tab: IconStudioTab = 'library') => {
    setIconStudioInitialTab(tab);
    setShowIconStudio(true);
  };

  const handleSaveIcons = async (newIcons: BrandIconography[]) => {
    if (!activeLibraryForIcons) return;
    
    await updateLibrary.mutateAsync({
      id: activeLibraryForIcons.id,
      updates: {
        icons: [...activeLibraryForIcons.icons, ...newIcons],
      },
    });
    
    setActiveLibraryForIcons(null);
  };

  const handleRemoveIcon = async (library: IconLibrary, iconId: string) => {
    await updateLibrary.mutateAsync({
      id: library.id,
      updates: {
        icons: library.icons.filter(i => i.id !== iconId),
      },
    });
  };

  const handleToggleActive = async (library: IconLibrary) => {
    await updateLibrary.mutateAsync({
      id: library.id,
      updates: { is_active: !library.is_active },
    });
  };

  const handleReorder = async (libraryId: string, newIndex: number) => {
    // Find the library being moved
    const library = libraries.find(l => l.id === libraryId);
    if (!library) return;

    // Get all libraries at the same level
    const levelLibraries = libraries.filter(l => l.level === library.level);
    const oldIndex = levelLibraries.findIndex(l => l.id === libraryId);
    
    if (oldIndex === -1 || oldIndex === newIndex) return;

    // Calculate new display_order values
    // Move the item to its new position and update orders
    const reordered = [...levelLibraries];
    const [moved] = reordered.splice(oldIndex, 1);
    reordered.splice(newIndex, 0, moved);

    // Update display_order for all affected libraries
    const updates = reordered.map((lib, index) => ({
      id: lib.id,
      display_order: index,
    }));

    // Update each library's display_order
    for (const update of updates) {
      if (update.id === libraryId || levelLibraries[update.display_order]?.id !== update.id) {
        await updateLibrary.mutateAsync({
          id: update.id,
          updates: { display_order: update.display_order },
        });
      }
    }
  };

  const handleDeleteLibrary = (id: string) => {
    deleteLibrary.mutate(id);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-semibold">Icon Library Hierarchy</h2>
          <p className="text-sm text-muted-foreground">
            Manage organization-wide icon libraries with 3-level inheritance. Drag to reorder.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button onClick={() => openIconStudio('library')} variant="outline" className="gap-2">
            <Sparkles className="h-4 w-4" />
            Icon Studio
          </Button>
          <Button onClick={() => openCreateDialog()} className="gap-2">
            <Plus className="h-4 w-4" />
            New Library
          </Button>
        </div>
      </div>

      {/* Hierarchy Visualization */}
      <div className="p-4 rounded-lg bg-muted/30 border">
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-blue-500" />
            <span>Core</span>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-purple-500" />
            <span>Product Line</span>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-orange-500" />
            <span>Brand</span>
          </div>
          <span className="text-muted-foreground ml-auto">
            Each level inherits icons from parent levels
          </span>
        </div>
      </div>

      {/* Level Sections with Drag-and-Drop */}
      <div className="space-y-4">
        <SortableLevelSection
          level="core"
          libraries={coreLibraries}
          isExpanded={expandedLevels.has('core')}
          onToggle={() => toggleLevel('core')}
          onCreateLibrary={openCreateDialog}
          onEditLibrary={openEditDialog}
          onDeleteLibrary={handleDeleteLibrary}
          onAddIcons={handleAddIcons}
          onToggleActive={handleToggleActive}
          onRemoveIcon={handleRemoveIcon}
          onReorder={handleReorder}
        />
        <SortableLevelSection
          level="product_line"
          libraries={productLineLibraries}
          isExpanded={expandedLevels.has('product_line')}
          onToggle={() => toggleLevel('product_line')}
          onCreateLibrary={openCreateDialog}
          onEditLibrary={openEditDialog}
          onDeleteLibrary={handleDeleteLibrary}
          onAddIcons={handleAddIcons}
          onToggleActive={handleToggleActive}
          onRemoveIcon={handleRemoveIcon}
          onReorder={handleReorder}
        />
        <SortableLevelSection
          level="brand"
          libraries={brandLibraries}
          isExpanded={expandedLevels.has('brand')}
          onToggle={() => toggleLevel('brand')}
          onCreateLibrary={openCreateDialog}
          onEditLibrary={openEditDialog}
          onDeleteLibrary={handleDeleteLibrary}
          onAddIcons={handleAddIcons}
          onToggleActive={handleToggleActive}
          onRemoveIcon={handleRemoveIcon}
          onReorder={handleReorder}
        />
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingLibrary ? 'Edit Icon Library' : 'Create Icon Library'}
            </DialogTitle>
            <DialogDescription>
              {editingLibrary 
                ? 'Update the library details below'
                : 'Add a new icon library to your organization hierarchy'
              }
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Library Name</Label>
              <Input
                placeholder="e.g., Navigation Icons, Brand Marks"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                placeholder="What icons are in this library?"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                rows={2}
              />
            </div>

            {!editingLibrary && (
              <div className="space-y-2">
                <Label>Hierarchy Level</Label>
                <Select value={formLevel} onValueChange={(v) => setFormLevel(v as typeof formLevel)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="core">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-blue-500" />
                        Core - All brands inherit
                      </div>
                    </SelectItem>
                    <SelectItem value="product_line">
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-purple-500" />
                        Product Line - Division specific
                      </div>
                    </SelectItem>
                    <SelectItem value="brand">
                      <div className="flex items-center gap-2">
                        <Layers className="h-4 w-4 text-orange-500" />
                        Brand - Brand specific
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {formLevel === 'product_line' && coreLibraries.length > 0 && (
              <div className="space-y-2">
                <Label>Parent Core Library (Optional)</Label>
                <Select 
                  value={formParentId || 'none'} 
                  onValueChange={(v) => setFormParentId(v === 'none' ? null : v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select parent library" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No parent</SelectItem>
                    {coreLibraries.map(lib => (
                      <SelectItem key={lib.id} value={lib.id}>{lib.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {formLevel === 'brand' && productLineLibraries.length > 0 && (
              <div className="space-y-2">
                <Label>Parent Product Line (Optional)</Label>
                <Select 
                  value={formParentId || 'none'} 
                  onValueChange={(v) => setFormParentId(v === 'none' ? null : v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select parent library" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No parent</SelectItem>
                    {productLineLibraries.map(lib => (
                      <SelectItem key={lib.id} value={lib.id}>{lib.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSaveLibrary}
              disabled={!formName.trim() || createLibrary.isPending || updateLibrary.isPending}
            >
              {editingLibrary ? 'Save Changes' : 'Create Library'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Unified Icon Studio */}
      <IconStudio
        open={showIconStudio}
        onOpenChange={setShowIconStudio}
        organizationId={organizationId}
        organizationName={organizationName}
        brandColors={brandColors}
        initialTab={iconStudioInitialTab}
        onIconsCreated={(newIcons, libraryId) => {
          // IconStudio's internal handleSaveIcons already persists to org libraries.
          // Only handle the special case where "Add Icons" was clicked on a specific library
          // and the IconStudio didn't have a libraryId target of its own.
          if (!libraryId && activeLibraryForIcons) {
            handleSaveIcons(newIcons);
          }
          setActiveLibraryForIcons(null);
        }}
      />
    </div>
  );
};
