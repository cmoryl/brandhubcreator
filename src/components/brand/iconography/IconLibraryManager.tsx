/**
 * IconLibraryManager - Simplified 2-panel layout for icon collection management
 * Refactored: delegates to CollectionList, AssignmentPanel, and CreateCollectionDialog
 */

import { useState, useMemo, useCallback } from 'react';
import {
  Plus,
  Sparkles,
  Building2,
  Package,
  Layers,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useIconLibraries, IconLibrary } from '@/hooks/useIconLibraries';
import { useIconLibraryBrandLinks } from '@/hooks/useIconLibraryBrandLinks';
import { IconStudio } from './IconStudio';
import type { IconStudioTab } from './IconStudio';
import { IconPreviewDialog } from './IconPreviewDialog';
import { BrandIconography } from '@/types/brand';
import { useBrands } from '@/contexts/BrandContext';
import { useEvents } from '@/contexts/EventContext';
import { CollectionList, AssignmentPanel, CreateCollectionDialog } from './manager';

interface IconLibraryManagerProps {
  organizationId: string;
  organizationName?: string;
  brandColors?: Array<{ hex: string; name: string }>;
}

export const IconLibraryManager = ({ organizationId, organizationName = '', brandColors = [] }: IconLibraryManagerProps) => {
  const {
    libraries,
    isLoading,
    createLibrary,
    updateLibrary,
    deleteLibrary,
  } = useIconLibraries(organizationId);

  const { brands, products } = useBrands();
  const { events } = useEvents();
  const {
    links,
    linkLibraryToEntity,
    unlinkLibraryFromEntity,
    getLinkedBrandIds,
    getLinkedEntityIds,
    getLinkedLibraryIdsForEntity,
  } = useIconLibraryBrandLinks(organizationId);

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showIconStudio, setShowIconStudio] = useState(false);
  const [iconStudioInitialTab, setIconStudioInitialTab] = useState<IconStudioTab>('library');
  const [editingLibrary, setEditingLibrary] = useState<IconLibrary | null>(null);
  const [activeLibraryForIcons, setActiveLibraryForIcons] = useState<IconLibrary | null>(null);
  const [previewIcon, setPreviewIcon] = useState<BrandIconography | null>(null);

  // Pre-compute linked names map for CollectionList
  const allLinkedNamesMap = useMemo(() => {
    const map = new Map<string, string[]>();
    libraries.forEach(lib => {
      const brandNames = brands
        .filter(b => getLinkedBrandIds(lib.id).includes(b.id))
        .map(b => b.hero?.name || 'Untitled');
      const productNames = (products || [])
        .filter(p => getLinkedEntityIds(lib.id, 'product').includes(p.id))
        .map(p => p.hero?.name || 'Untitled');
      const eventNames = (events || [])
        .filter(e => getLinkedEntityIds(lib.id, 'event').includes(e.id))
        .map(e => e.hero?.name || 'Untitled');
      map.set(lib.id, [...brandNames, ...productNames, ...eventNames]);
    });
    return map;
  }, [libraries, brands, products, events, links, getLinkedBrandIds, getLinkedEntityIds]);

  // Entity items for AssignmentPanel
  const brandItems = useMemo(() => brands.map(b => ({ id: b.id, name: b.hero?.name || 'Untitled Brand' })), [brands]);
  const productItems = useMemo(() => (products || []).map(p => ({ id: p.id, name: p.hero?.name || 'Untitled Product' })), [products]);
  const eventItems = useMemo(() => (events || []).map(e => ({ id: e.id, name: e.hero?.name || 'Untitled Event' })), [events]);

  const handleToggleLink = useCallback((libraryId: string, entityId: string, entityType: 'brand' | 'product' | 'event', isLinked: boolean) => {
    if (isLinked) {
      unlinkLibraryFromEntity.mutate({ libraryId, entityId, entityType });
    } else {
      linkLibraryToEntity.mutate({ libraryId, entityId, entityType });
    }
  }, [linkLibraryToEntity, unlinkLibraryFromEntity]);

  const handleSaveCollection = useCallback(async (data: { name: string; description: string; level: 'core' | 'product_line' | 'brand' }) => {
    if (editingLibrary) {
      await updateLibrary.mutateAsync({
        id: editingLibrary.id,
        updates: { name: data.name, description: data.description || undefined },
      });
    } else {
      await createLibrary.mutateAsync({
        organization_id: organizationId,
        name: data.name,
        level: data.level,
        description: data.description || undefined,
        icons: [],
      });
    }
    setShowCreateDialog(false);
    setEditingLibrary(null);
  }, [editingLibrary, updateLibrary, createLibrary, organizationId]);

  const handleAddIcons = useCallback((library: IconLibrary) => {
    setActiveLibraryForIcons(library);
    setIconStudioInitialTab('creator');
    setShowIconStudio(true);
  }, []);

  const handleSaveIcons = useCallback(async (newIcons: BrandIconography[]) => {
    if (!activeLibraryForIcons) return;
    await updateLibrary.mutateAsync({
      id: activeLibraryForIcons.id,
      updates: { icons: [...activeLibraryForIcons.icons, ...newIcons] },
    });
    setActiveLibraryForIcons(null);
  }, [activeLibraryForIcons, updateLibrary]);

  const handleToggleActive = useCallback(async (library: IconLibrary) => {
    await updateLibrary.mutateAsync({
      id: library.id,
      updates: { is_active: !library.is_active },
    });
  }, [updateLibrary]);

  const totalIcons = libraries.reduce((sum, lib) => sum + lib.icons.length, 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-semibold">Icon Collections</h2>
          <p className="text-sm text-muted-foreground">
            {libraries.length} collection{libraries.length !== 1 ? 's' : ''} · {totalIcons} total icons
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button onClick={() => { setIconStudioInitialTab('library'); setShowIconStudio(true); }} variant="outline" className="gap-2">
            <Sparkles className="h-4 w-4" />
            Icon Studio
          </Button>
          <Button onClick={() => { setEditingLibrary(null); setShowCreateDialog(true); }} className="gap-2">
            <Plus className="h-4 w-4" />
            New Collection
          </Button>
        </div>
      </div>

      {/* Quick info strip */}
      <div className="flex items-center gap-6 p-3 rounded-lg bg-muted/30 border text-sm">
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-blue-500" />
          <span className="text-muted-foreground">Core = all entities</span>
        </div>
        <ChevronRight className="h-3 w-3 text-muted-foreground" />
        <div className="flex items-center gap-2">
          <Package className="h-4 w-4 text-purple-500" />
          <span className="text-muted-foreground">Product Line = division</span>
        </div>
        <ChevronRight className="h-3 w-3 text-muted-foreground" />
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-sky-500" />
          <span className="text-muted-foreground">Brand = specific</span>
        </div>
      </div>

      {/* 2-Panel Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <CollectionList
          libraries={libraries}
          allLinkedNamesMap={allLinkedNamesMap}
          onCreateClick={() => { setEditingLibrary(null); setShowCreateDialog(true); }}
          onEditClick={(lib) => { setEditingLibrary(lib); setShowCreateDialog(true); }}
          onDeleteClick={(id) => deleteLibrary.mutate(id)}
          onAddIcons={handleAddIcons}
          onToggleActive={handleToggleActive}
          onPreviewIcon={setPreviewIcon}
        />

        <AssignmentPanel
          libraries={libraries}
          brands={brandItems}
          products={productItems}
          events={eventItems}
          linkedLibraryIdsForEntity={getLinkedLibraryIdsForEntity}
          onToggleLink={handleToggleLink}
        />
      </div>

      {/* Create/Edit Dialog */}
      <CreateCollectionDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        editingLibrary={editingLibrary}
        onSave={handleSaveCollection}
        isSaving={createLibrary.isPending || updateLibrary.isPending}
      />

      {/* Icon Preview */}
      <IconPreviewDialog
        icon={previewIcon}
        open={!!previewIcon}
        onOpenChange={(open) => !open && setPreviewIcon(null)}
      />

      {/* Icon Studio */}
      <IconStudio
        open={showIconStudio}
        onOpenChange={setShowIconStudio}
        organizationId={organizationId}
        organizationName={organizationName}
        brandColors={brandColors}
        initialTab={iconStudioInitialTab}
        onIconsCreated={(newIcons, libraryId) => {
          if (!libraryId && activeLibraryForIcons) {
            handleSaveIcons(newIcons);
          }
          setActiveLibraryForIcons(null);
        }}
      />
    </div>
  );
};
