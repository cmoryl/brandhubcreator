/**
 * IconLibraryManager - Simplified 2-panel layout for icon collection management
 * Left: All collections (flat list with type badges)
 * Right: Brand/Product/Event assignment panel with tabs
 */

import { useState, useMemo } from 'react';
import { 
  Plus, 
  Sparkles,
  Search,
  Building2,
  Package,
  Layers,
  Link2,
  Check,
  Pencil,
  Trash2,
  ChevronRight,
  Calendar,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useIconLibraries, IconLibrary } from '@/hooks/useIconLibraries';
import { useIconLibraryBrandLinks } from '@/hooks/useIconLibraryBrandLinks';
import { IconStudio } from './IconStudio';
import type { IconStudioTab } from './IconStudio';
import { IconPreviewDialog } from './IconPreviewDialog';
import { BrandIconography } from '@/types/brand';
import { useBrands } from '@/contexts/BrandContext';
import { useEvents } from '@/contexts/EventContext';
import { cn } from '@/lib/utils';

const LEVEL_BADGES = {
  core: { label: 'Core', icon: Building2, className: 'bg-blue-500/10 text-blue-600 border-blue-500/20' },
  product_line: { label: 'Product', icon: Package, className: 'bg-purple-500/10 text-purple-600 border-purple-500/20' },
  brand: { label: 'Brand', icon: Layers, className: 'bg-sky-500/10 text-sky-600 border-sky-500/20' },
};

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

  const [searchQuery, setSearchQuery] = useState('');
  const [filterLevel, setFilterLevel] = useState<string>('all');
  const [assignTab, setAssignTab] = useState<'brand' | 'product' | 'event'>('brand');
  const [selectedEntityId, setSelectedEntityId] = useState<string>('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showIconStudio, setShowIconStudio] = useState(false);
  const [iconStudioInitialTab, setIconStudioInitialTab] = useState<IconStudioTab>('library');
  const [editingLibrary, setEditingLibrary] = useState<IconLibrary | null>(null);
  const [activeLibraryForIcons, setActiveLibraryForIcons] = useState<IconLibrary | null>(null);
  const [previewIcon, setPreviewIcon] = useState<BrandIconography | null>(null);

  // Form state
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formLevel, setFormLevel] = useState<'core' | 'product_line' | 'brand'>('core');

  // Filtered libraries
  const filteredLibraries = useMemo(() => {
    let result = libraries;
    if (filterLevel !== 'all') {
      result = result.filter(lib => lib.level === filterLevel);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(lib => 
        lib.name.toLowerCase().includes(q) || 
        lib.description?.toLowerCase().includes(q)
      );
    }
    return result;
  }, [libraries, filterLevel, searchQuery]);

  // Entity lists for the right panel
  const entityList = useMemo(() => {
    if (assignTab === 'brand') return brands.map(b => ({ id: b.id, name: b.hero?.name || 'Untitled Brand' }));
    if (assignTab === 'product') return (products || []).map(p => ({ id: p.id, name: p.hero?.name || 'Untitled Product' }));
    if (assignTab === 'event') return (events || []).map(e => ({ id: e.id, name: e.hero?.name || 'Untitled Event' }));
    return [];
  }, [assignTab, brands, products, events]);

  // Linked library IDs for selected entity
  const selectedEntityLinkedLibIds = useMemo(() => {
    if (!selectedEntityId) return new Set<string>();
    return new Set(getLinkedLibraryIdsForEntity(selectedEntityId, assignTab));
  }, [selectedEntityId, assignTab, links, getLinkedLibraryIdsForEntity]);

  const selectedEntityName = useMemo(() => {
    return entityList.find(e => e.id === selectedEntityId)?.name || '';
  }, [entityList, selectedEntityId]);

  // Reset selected entity when switching tabs
  const handleTabChange = (tab: string) => {
    setAssignTab(tab as typeof assignTab);
    setSelectedEntityId('');
  };

  const resetForm = () => {
    setFormName('');
    setFormDescription('');
    setFormLevel('core');
    setEditingLibrary(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setShowCreateDialog(true);
  };

  const openEditDialog = (library: IconLibrary) => {
    setEditingLibrary(library);
    setFormName(library.name);
    setFormDescription(library.description || '');
    setFormLevel(library.level);
    setShowCreateDialog(true);
  };

  const handleSaveLibrary = async () => {
    if (!formName.trim()) return;
    try {
      if (editingLibrary) {
        await updateLibrary.mutateAsync({
          id: editingLibrary.id,
          updates: { name: formName, description: formDescription || undefined },
        });
      } else {
        await createLibrary.mutateAsync({
          organization_id: organizationId,
          name: formName,
          level: formLevel,
          description: formDescription || undefined,
          icons: [],
        });
      }
      setShowCreateDialog(false);
      resetForm();
    } catch (error) {
      console.error('Save library failed:', error);
    }
  };

  const handleAddIcons = (library: IconLibrary) => {
    setActiveLibraryForIcons(library);
    setIconStudioInitialTab('creator');
    setShowIconStudio(true);
  };

  const handleSaveIcons = async (newIcons: BrandIconography[]) => {
    if (!activeLibraryForIcons) return;
    await updateLibrary.mutateAsync({
      id: activeLibraryForIcons.id,
      updates: { icons: [...activeLibraryForIcons.icons, ...newIcons] },
    });
    setActiveLibraryForIcons(null);
  };

  const handleToggleActive = async (library: IconLibrary) => {
    await updateLibrary.mutateAsync({
      id: library.id,
      updates: { is_active: !library.is_active },
    });
  };

  const handleToggleEntityLink = (libraryId: string) => {
    if (!selectedEntityId) return;
    if (selectedEntityLinkedLibIds.has(libraryId)) {
      unlinkLibraryFromEntity.mutate({ libraryId, entityId: selectedEntityId, entityType: assignTab });
    } else {
      linkLibraryToEntity.mutate({ libraryId, entityId: selectedEntityId, entityType: assignTab });
    }
  };

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
          <Button onClick={openCreateDialog} className="gap-2">
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
        {/* LEFT PANEL: All Collections */}
        <div className="lg:col-span-3 space-y-4">
          {/* Search & Filter */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search collections..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex items-center border rounded-md">
              {['all', 'core', 'product_line', 'brand'].map(level => (
                <button
                  key={level}
                  onClick={() => setFilterLevel(level)}
                  className={cn(
                    'px-3 py-1.5 text-xs font-medium transition-colors',
                    filterLevel === level
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {level === 'all' ? 'All' : level === 'product_line' ? 'Product' : level.charAt(0).toUpperCase() + level.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Collection List */}
          <div className="space-y-2">
            {filteredLibraries.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground border border-dashed rounded-lg">
                <Layers className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">{searchQuery ? 'No collections match your search' : 'No collections yet'}</p>
                <Button variant="outline" size="sm" className="mt-3 gap-2" onClick={openCreateDialog}>
                  <Plus className="h-3.5 w-3.5" />
                  Create First Collection
                </Button>
              </div>
            ) : (
              filteredLibraries.map(library => {
                const levelBadge = LEVEL_BADGES[library.level];
                const LevelIcon = levelBadge.icon;
                const linkedBrandIds = getLinkedBrandIds(library.id);
                const linkedProductIds = getLinkedEntityIds(library.id, 'product');
                const linkedEventIds = getLinkedEntityIds(library.id, 'event');
                const linkedBrandNames = brands
                  .filter(b => linkedBrandIds.includes(b.id))
                  .map(b => b.hero?.name || 'Untitled');
                const linkedProductNames = (products || [])
                  .filter(p => linkedProductIds.includes(p.id))
                  .map(p => p.hero?.name || 'Untitled');
                const linkedEventNames = (events || [])
                  .filter(e => linkedEventIds.includes(e.id))
                  .map(e => e.hero?.name || 'Untitled');
                const allLinkedNames = [...linkedBrandNames, ...linkedProductNames, ...linkedEventNames];

                return (
                  <div
                    key={library.id}
                    className={cn(
                      'rounded-lg border bg-card p-4 transition-all hover:shadow-sm',
                      !library.is_active && 'opacity-50'
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        <div className="shrink-0 mt-0.5">
                          <Badge variant="outline" className={cn('text-[10px] gap-1', levelBadge.className)}>
                            <LevelIcon className="h-3 w-3" />
                            {levelBadge.label}
                          </Badge>
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-medium text-sm truncate">{library.name}</h4>
                          {library.description && (
                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{library.description}</p>
                          )}
                          {/* Linked entities inline */}
                          {allLinkedNames.length > 0 && (
                            <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                              <Link2 className="h-3 w-3 text-muted-foreground shrink-0" />
                              {allLinkedNames.slice(0, 3).map((name, i) => (
                                <Badge key={`${name}-${i}`} variant="secondary" className="text-[10px]">{name}</Badge>
                              ))}
                              {allLinkedNames.length > 3 && (
                                <span className="text-[10px] text-muted-foreground">+{allLinkedNames.length - 3}</span>
                              )}
                            </div>
                          )}
                          {library.level === 'core' && allLinkedNames.length === 0 && (
                            <p className="text-[10px] text-blue-500/70 mt-1">Auto-inherited by all entities</p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <Badge variant="outline" className="text-xs">{library.icons.length}</Badge>
                        <Switch
                          checked={library.is_active}
                          onCheckedChange={() => handleToggleActive(library)}
                          className="scale-75"
                        />
                      </div>
                    </div>

                    {/* Icon previews */}
                    {library.icons.length > 0 && (
                      <div className="flex items-center gap-1.5 mt-3 overflow-hidden">
                        {library.icons.slice(0, 12).map((icon) => {
                          const viewBox = icon.viewBox || '0 0 24 24';
                          const isFullSvg = icon.svgPath.includes('<');
                          return (
                            <button
                              key={icon.id}
                              onClick={() => setPreviewIcon(icon)}
                              className="w-7 h-7 shrink-0 border rounded flex items-center justify-center bg-muted/30 hover:bg-muted transition-colors"
                              title={icon.name}
                            >
                              <div className="w-4 h-4">
                                {isFullSvg ? (
                                  <svg viewBox={viewBox} className="w-full h-full" fill="currentColor">
                                    <g dangerouslySetInnerHTML={{ __html: icon.svgPath }} />
                                  </svg>
                                ) : (
                                  <svg viewBox={viewBox} className="w-full h-full"
                                    fill={icon.fillMode === 'fill' ? 'currentColor' : 'none'}
                                    stroke={icon.fillMode === 'stroke' ? 'currentColor' : 'none'}
                                    strokeWidth={icon.fillMode === 'stroke' ? 2 : undefined}
                                  >
                                    <path d={icon.svgPath} />
                                  </svg>
                                )}
                              </div>
                            </button>
                          );
                        })}
                        {library.icons.length > 12 && (
                          <span className="text-xs text-muted-foreground shrink-0">+{library.icons.length - 12}</span>
                        )}
                      </div>
                    )}

                    {/* Actions row */}
                    <div className="flex items-center gap-2 mt-3 pt-3 border-t">
                      <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => handleAddIcons(library)}>
                        <Plus className="h-3 w-3" />
                        Add Icons
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => openEditDialog(library)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Collection</AlertDialogTitle>
                            <AlertDialogDescription>
                              Delete "{library.name}" and its {library.icons.length} icons? This cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteLibrary.mutate(library.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT PANEL: Entity Assignment with Tabs */}
        <div className="lg:col-span-2 space-y-4">
          <div className="sticky top-4">
            <div className="rounded-lg border bg-card">
              <div className="p-4 border-b">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  <Link2 className="h-4 w-4 text-primary" />
                  Assign Collections
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Select a brand, product, or event to manage its icon assignments
                </p>
              </div>

              {/* Entity type tabs */}
              <Tabs value={assignTab} onValueChange={handleTabChange} className="w-full">
                <TabsList className="w-full rounded-none border-b bg-transparent h-auto p-0">
                  <TabsTrigger value="brand" className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent gap-1.5 text-xs py-2.5">
                    <Layers className="h-3.5 w-3.5" />
                    Brands
                    <Badge variant="secondary" className="text-[10px] h-4 px-1">{brands.length}</Badge>
                  </TabsTrigger>
                  <TabsTrigger value="product" className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent gap-1.5 text-xs py-2.5">
                    <Package className="h-3.5 w-3.5" />
                    Products
                    <Badge variant="secondary" className="text-[10px] h-4 px-1">{(products || []).length}</Badge>
                  </TabsTrigger>
                  <TabsTrigger value="event" className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent gap-1.5 text-xs py-2.5">
                    <Calendar className="h-3.5 w-3.5" />
                    Events
                    <Badge variant="secondary" className="text-[10px] h-4 px-1">{(events || []).length}</Badge>
                  </TabsTrigger>
                </TabsList>

                <div className="p-4">
                  <Select value={selectedEntityId || 'none'} onValueChange={(v) => setSelectedEntityId(v === 'none' ? '' : v)}>
                    <SelectTrigger>
                      <SelectValue placeholder={`Choose a ${assignTab}...`} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Choose a {assignTab}...</SelectItem>
                      {entityList.map(entity => (
                        <SelectItem key={entity.id} value={entity.id}>
                          {entity.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </Tabs>

              {selectedEntityId && (
                <div className="px-4 pb-4 space-y-2">
                  <Separator />
                  <div className="pt-2">
                    {/* Core notice */}
                    <div className="text-xs text-muted-foreground bg-blue-500/5 border border-blue-500/20 rounded-md px-3 py-2 mb-3 flex items-center gap-2">
                      <Building2 className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                      Core collections are auto-included for all {assignTab}s
                    </div>

                    {/* Assignable collections (non-core) */}
                    <p className="text-xs font-medium text-muted-foreground mb-2">
                      Toggle collections for {selectedEntityName}:
                    </p>
                    <div className="space-y-1">
                      {libraries.filter(lib => lib.level !== 'core' && lib.is_active && lib.icons.length > 0).map(library => {
                        const isLinked = selectedEntityLinkedLibIds.has(library.id);
                        const levelBadge = LEVEL_BADGES[library.level];
                        const LevelIcon = levelBadge.icon;

                        return (
                          <button
                            key={library.id}
                            onClick={() => handleToggleEntityLink(library.id)}
                            className={cn(
                              'w-full flex items-center justify-between p-2.5 rounded-md text-left transition-colors',
                              isLinked 
                                ? 'bg-primary/5 border border-primary/20' 
                                : 'hover:bg-muted/50 border border-transparent'
                            )}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <div className={cn(
                                'w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-colors',
                                isLinked ? 'bg-primary text-primary-foreground' : 'border border-muted-foreground/30'
                              )}>
                                {isLinked && <Check className="h-3 w-3" />}
                              </div>
                              <div className="min-w-0">
                                <span className="text-sm font-medium truncate block">{library.name}</span>
                                <span className="text-[10px] text-muted-foreground">{library.icons.length} icons</span>
                              </div>
                            </div>
                            <Badge variant="outline" className={cn('text-[10px] shrink-0', levelBadge.className)}>
                              <LevelIcon className="h-2.5 w-2.5 mr-0.5" />
                              {levelBadge.label}
                            </Badge>
                          </button>
                        );
                      })}

                      {libraries.filter(lib => lib.level !== 'core' && lib.is_active && lib.icons.length > 0).length === 0 && (
                        <p className="text-xs text-muted-foreground text-center py-4 italic">
                          No collections available to assign
                        </p>
                      )}
                    </div>

                    {/* Summary */}
                    {selectedEntityLinkedLibIds.size > 0 && (
                      <div className="mt-3 pt-3 border-t">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">
                            {selectedEntityLinkedLibIds.size} collection{selectedEntityLinkedLibIds.size !== 1 ? 's' : ''} assigned
                          </span>
                          <span className="font-medium">
                            {libraries
                              .filter(lib => selectedEntityLinkedLibIds.has(lib.id))
                              .reduce((sum, lib) => sum + lib.icons.length, 0)} icons
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {!selectedEntityId && entityList.length > 0 && (
                <div className="px-4 pb-4">
                  <div className="text-center py-6 text-muted-foreground">
                    <Link2 className="h-6 w-6 mx-auto mb-2 opacity-30" />
                    <p className="text-xs">Select a {assignTab} to manage its icon assignments</p>
                  </div>
                </div>
              )}

              {entityList.length === 0 && (
                <div className="px-4 pb-4">
                  <div className="text-center py-6 text-muted-foreground">
                    <p className="text-xs">No {assignTab}s found. Create some first.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingLibrary ? 'Edit Collection' : 'New Icon Collection'}</DialogTitle>
            <DialogDescription>
              {editingLibrary ? 'Update collection details' : 'Create a new icon collection for your organization'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                placeholder="e.g., Navigation Icons, Social Icons"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                placeholder="What icons are in this collection?"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                rows={2}
              />
            </div>
            {!editingLibrary && (
              <div className="space-y-2">
                <Label>Type</Label>
                <div className="grid grid-cols-3 gap-2">
                  {(['core', 'product_line', 'brand'] as const).map(level => {
                    const badge = LEVEL_BADGES[level];
                    const Icon = badge.icon;
                    return (
                      <button
                        key={level}
                        onClick={() => setFormLevel(level)}
                        className={cn(
                          'p-3 rounded-lg border text-center transition-colors',
                          formLevel === level 
                            ? 'border-primary bg-primary/5' 
                            : 'border-border hover:border-muted-foreground/50'
                        )}
                      >
                        <Icon className={cn('h-5 w-5 mx-auto mb-1', formLevel === level ? 'text-primary' : 'text-muted-foreground')} />
                        <p className="text-xs font-medium">{badge.label}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {level === 'core' ? 'All entities' : level === 'product_line' ? 'By division' : 'Specific'}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancel</Button>
            <Button 
              onClick={handleSaveLibrary}
              disabled={!formName.trim() || createLibrary.isPending || updateLibrary.isPending}
            >
              {editingLibrary ? 'Save Changes' : 'Create Collection'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
