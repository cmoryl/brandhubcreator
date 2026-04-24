/**
 * ImageryWorkspace - Main workspace area showing imagery for selected entity
 * Integrates upload zones, drag-and-drop grids, analytics, style analysis, inline search,
 * batch operations, auto-categorization, visual search, and quality scoring
 */
import { useState, useCallback, useEffect } from 'react';
import { Plus, Check, X, Copy, ArrowRightLeft, ImageIcon, FolderPlus, Search, Filter, BarChart3, Sparkles, MoreHorizontal, Upload, ChevronDown, Globe, Combine, Camera } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { WebsiteImageScanner } from '@/components/brand/WebsiteImageScanner';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { ApprovedImage, ApprovedImagerySubSection } from '@/types/brand';
import { ImageryEntity } from '@/hooks/useImageryHubEntities';
import { InlineImagerySearch } from '@/components/imagery-hub/InlineImagerySearch';
import { ImageryUploadZone } from '@/components/imagery-hub/ImageryUploadZone';
import { ImageryAnalytics } from '@/components/imagery-hub/ImageryAnalytics';
import { StyleAnalysisPanel } from '@/components/imagery-hub/StyleAnalysisPanel';
import { DraggableImageGrid } from '@/components/imagery-hub/DraggableImageGrid';
import { BatchOperationsToolbar } from '@/components/imagery-hub/BatchOperationsToolbar';
import { AutoCategorizeDialog } from '@/components/imagery-hub/AutoCategorizeDialog';
import { VisualSearchPanel } from '@/components/imagery-hub/VisualSearchPanel';
import { BrandPhotographyGenerator } from '@/components/imagery-hub/BrandPhotographyGenerator';

interface ImageryWorkspaceProps {
  entity: ImageryEntity;
  sections: ApprovedImagerySubSection[];
  isLoading: boolean;
  organizationId: string | null;
  onAddSection: (name: string) => Promise<string | undefined>;
  onRemoveSection: (sectionId: string) => Promise<void>;
  onAddImages: (sectionId: string, images: ApprovedImage[]) => Promise<void>;
  onRemoveImage: (sectionId: string, imageId: string) => Promise<void>;
  onReorderImages: (sectionId: string, images: ApprovedImage[]) => Promise<void>;
  onUpdateImageTags: (sectionId: string, imageId: string, tags: string[]) => Promise<void>;
  onStartComparison: () => void;
  onStartBulkCopy: (images: ApprovedImage[], sectionName: string) => void;
  selectedImages: Map<string, ApprovedImage>;
  onToggleImageSelection: (sectionId: string, image: ApprovedImage) => void;
  selectionMode: boolean;
  onToggleSelectionMode: () => void;
}

export const ImageryWorkspace = ({
  entity, sections, isLoading, organizationId,
  onAddSection, onRemoveSection, onAddImages, onRemoveImage,
  onReorderImages, onUpdateImageTags,
  onStartComparison, onStartBulkCopy,
  selectedImages, onToggleImageSelection, selectionMode, onToggleSelectionMode,
}: ImageryWorkspaceProps) => {
  const [searchSectionId, setSearchSectionId] = useState<string | null>(null);
  const [newSectionName, setNewSectionName] = useState('');
  const [addingSection, setAddingSection] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [tagFilter, setTagFilter] = useState('');
  const [autoCategorizeOpen, setAutoCategorizeOpen] = useState(false);
  const [visualSearchUrl, setVisualSearchUrl] = useState<string | null>(null);
  const [searchCollapsed, setSearchCollapsed] = useState(false);
  const [websiteScannerOpen, setWebsiteScannerOpen] = useState(false);
  const [photoGenOpen, setPhotoGenOpen] = useState(false);
  const [photoOnly, setPhotoOnly] = useState(false);
  const [presetFilter, setPresetFilter] = useState<string | null>(null);

  // Brand photography preset keys (kept in sync with BrandPhotographyGenerator)
  const PHOTO_PRESETS: { key: string; label: string }[] = [
    { key: 'humanRealistic', label: 'Hyper-Realistic Human' },
    { key: 'softTransition', label: 'Soft Transition' },
    { key: 'documentaryPortrait', label: 'Documentary Portrait' },
    { key: 'environmentalCandid', label: 'Environmental Candid' },
    { key: 'goldenHourIntimate', label: 'Golden Hour Intimate' },
  ];

  const isBrandPhoto = (img: ApprovedImage) =>
    !!img.tags?.includes('ai-generated') && !!img.tags?.includes('brand-photography');

  // Apply Brand Photography + preset filters to sections (hide empty sections after filtering)
  const displaySections = (photoOnly || presetFilter)
    ? sections
        .map(s => ({
          ...s,
          images: s.images.filter(img => {
            if (photoOnly && !isBrandPhoto(img)) return false;
            if (presetFilter && !img.tags?.includes(presetFilter)) return false;
            return true;
          }),
        }))
        .filter(s => s.images.length > 0)
    : sections;

  // Count brand-photography images (across all sections, ignoring preset filter for the badge)
  const photoCount = sections.reduce(
    (sum, s) => sum + s.images.filter(isBrandPhoto).length,
    0,
  );

  const totalImages = sections.reduce((sum, s) => sum + s.images.length, 0);
  const searchSection = sections.find(s => s.id === searchSectionId);

  // Auto-open search panel with first section when sections load
  useEffect(() => {
    if (sections.length > 0 && !searchSectionId) {
      setSearchSectionId(sections[0].id);
    }
  }, [sections, searchSectionId]);

  const handleAddSection = useCallback(async () => {
    if (!newSectionName.trim()) return;
    await onAddSection(newSectionName.trim());
    setNewSectionName('');
    setAddingSection(false);
  }, [newSectionName, onAddSection]);

  const openSearch = useCallback((sectionId: string) => {
    setSearchSectionId(sectionId);
    setSearchCollapsed(false);
  }, []);

  const handleApproveImages = useCallback((images: ApprovedImage[]) => {
    if (searchSectionId) onAddImages(searchSectionId, images);
  }, [searchSectionId, onAddImages]);

  const handleChangeSearchSection = useCallback((sectionId: string) => {
    setSearchSectionId(sectionId);
  }, []);

  // Batch operations handlers
  const handleBulkTag = useCallback(async (tag: string) => {
    for (const [key] of selectedImages) {
      const [sectionId, imageId] = key.split('::');
      const section = sections.find(s => s.id === sectionId);
      const image = section?.images.find(img => img.id === imageId);
      if (image) {
        const newTags = [...new Set([...(image.tags || []), tag])];
        await onUpdateImageTags(sectionId, imageId, newTags);
      }
    }
  }, [selectedImages, sections, onUpdateImageTags]);

  const handleBulkRemoveTag = useCallback(async (tag: string) => {
    for (const [key] of selectedImages) {
      const [sectionId, imageId] = key.split('::');
      const section = sections.find(s => s.id === sectionId);
      const image = section?.images.find(img => img.id === imageId);
      if (image) {
        const newTags = (image.tags || []).filter(t => t !== tag);
        await onUpdateImageTags(sectionId, imageId, newTags);
      }
    }
  }, [selectedImages, sections, onUpdateImageTags]);

  const handleBulkDelete = useCallback(async () => {
    for (const [key] of selectedImages) {
      const [sectionId, imageId] = key.split('::');
      await onRemoveImage(sectionId, imageId);
    }
    onToggleSelectionMode();
  }, [selectedImages, onRemoveImage, onToggleSelectionMode]);

  const handleBulkMove = useCallback(async (targetSectionId: string) => {
    const movedImages: ApprovedImage[] = [];
    for (const [key, image] of selectedImages) {
      const [sectionId] = key.split('::');
      if (sectionId !== targetSectionId) {
        movedImages.push(image);
        await onRemoveImage(sectionId, image.id);
      }
    }
    if (movedImages.length > 0) {
      await onAddImages(targetSectionId, movedImages);
    }
    onToggleSelectionMode();
  }, [selectedImages, onRemoveImage, onAddImages, onToggleSelectionMode]);

  const handleMoveImageToSection = useCallback(async (image: ApprovedImage, fromSectionId: string, toSectionId: string) => {
    await onRemoveImage(fromSectionId, image.id);
    await onAddImages(toSectionId, [image]);
  }, [onRemoveImage, onAddImages]);

  const handleRejectImage = useCallback(async (sectionId: string, image: ApprovedImage) => {
    try {
      // Record a 'rejected' signal so the AI learns what imagery to avoid
      await supabase.functions.invoke('shutterstock-learn', {
        body: {
          action: 'record_signal',
          entityId: entity.id,
          entityType: entity.type,
          organizationId,
          imageId: image.id,
          signalAction: 'rejected',
          imageMetadata: {
            url: image.url || image.thumbnailUrl,
            title: image.title,
            source: image.source,
            tags: image.tags,
            category: image.category,
          },
          sectionName: sections.find(s => s.id === sectionId)?.name,
        },
      });
      // Remove the image from the section
      await onRemoveImage(sectionId, image.id);
      toast.success('Image rejected — AI will learn to avoid similar imagery');
    } catch (err) {
      console.error('Failed to record rejection signal:', err);
      // Still remove the image even if signal fails
      await onRemoveImage(sectionId, image.id);
      toast.info('Image removed (preference signal could not be saved)');
    }
  }, [entity, organizationId, sections, onRemoveImage]);

  const handleBulkQualityScore = useCallback(async (
    scores: Map<string, { score: number; details: ApprovedImage['qualityDetails'] }>
  ) => {
    // Quality scores are stored on the image objects - we update tags to reflect
    // This would need the saveImagery hook to persist qualityScore/qualityDetails
    // For now we just display them via the badge component
  }, []);

  const handleAutoCategorizeApply = useCallback(async (
    assignments: { image: ApprovedImage; sectionId: string; newSectionName?: string; tags: string[] }[]
  ) => {
    // Cache new sections by lowercase name so we only create each once,
    // even when many images are categorized into the same new folder.
    const newSectionCache = new Map<string, string>();
    // Pre-seed with existing sections to catch case-insensitive matches.
    sections.forEach(s => newSectionCache.set(s.name.toLowerCase(), s.id));

    // Group images by target section to batch-insert and avoid race conditions.
    const grouped = new Map<string, { sectionId: string; images: ApprovedImage[] }>();

    for (const assignment of assignments) {
      let targetSectionId = assignment.sectionId;

      if (!targetSectionId && assignment.newSectionName) {
        const key = assignment.newSectionName.trim().toLowerCase();
        const cached = newSectionCache.get(key);
        if (cached) {
          targetSectionId = cached;
        } else {
          const newId = await onAddSection(assignment.newSectionName.trim());
          if (!newId) continue;
          targetSectionId = newId;
          newSectionCache.set(key, newId);
        }
      }

      if (!targetSectionId) continue;

      const imageWithTags = {
        ...assignment.image,
        tags: [...new Set([...(assignment.image.tags || []), ...assignment.tags])],
      };
      const bucket = grouped.get(targetSectionId);
      if (bucket) {
        bucket.images.push(imageWithTags);
      } else {
        grouped.set(targetSectionId, { sectionId: targetSectionId, images: [imageWithTags] });
      }
    }

    for (const { sectionId, images } of grouped.values()) {
      await onAddImages(sectionId, images);
    }
  }, [sections, onAddSection, onAddImages]);

  // Detect sections that share the same (case-insensitive, trimmed) name.
  const duplicateGroups = (() => {
    const groups = new Map<string, ApprovedImagerySubSection[]>();
    sections.forEach(s => {
      const key = s.name.trim().toLowerCase();
      const arr = groups.get(key) || [];
      arr.push(s);
      groups.set(key, arr);
    });
    return Array.from(groups.values()).filter(g => g.length > 1);
  })();
  const duplicateSectionCount = duplicateGroups.reduce((sum, g) => sum + (g.length - 1), 0);

  const handleMergeDuplicates = useCallback(async () => {
    if (duplicateGroups.length === 0) {
      toast.info('No duplicate categories found');
      return;
    }
    let mergedFolders = 0;
    let mergedImages = 0;
    for (const group of duplicateGroups) {
      // Keep the first (oldest) section, merge the rest into it.
      const [keeper, ...dupes] = group;
      const existingIds = new Set(keeper.images.map(i => i.id));
      const toMove: ApprovedImage[] = [];
      for (const dupe of dupes) {
        for (const img of dupe.images) {
          if (!existingIds.has(img.id)) {
            toMove.push(img);
            existingIds.add(img.id);
          }
        }
      }
      if (toMove.length > 0) {
        await onAddImages(keeper.id, toMove);
        mergedImages += toMove.length;
      }
      for (const dupe of dupes) {
        await onRemoveSection(dupe.id);
        mergedFolders += 1;
      }
    }
    toast.success(`Merged ${mergedFolders} duplicate categor${mergedFolders === 1 ? 'y' : 'ies'} (${mergedImages} image${mergedImages === 1 ? '' : 's'} consolidated)`);
  }, [duplicateGroups, onAddImages, onRemoveSection]);

  const handleVisualSearchQuery = useCallback((query: string) => {
    if (sections.length > 0) {
      setSearchSectionId(sections[0].id);
    }
    setVisualSearchUrl(null);
  }, [sections]);

  const handleWebsiteImport = useCallback(async (
    images: { name: string; url: string; type: string }[],
    chosenSectionId?: string,
  ) => {
    if (images.length === 0) return;

    // Resolve destination:
    // - If caller explicitly passed a valid section id → use it
    // - If caller passed undefined (means "create new Website Imports") → create one
    // - If no sections exist at all → also create one
    let targetSectionId: string | undefined;
    if (chosenSectionId && sections.some(s => s.id === chosenSectionId)) {
      targetSectionId = chosenSectionId;
    } else {
      // Reuse an existing "Website Imports" folder if one exists, otherwise create.
      const existing = sections.find(s => s.name.trim().toLowerCase() === 'website imports');
      if (existing) {
        targetSectionId = existing.id;
      } else {
        const created = await onAddSection('Website Imports');
        if (!created) {
          toast.error('Could not create a category for website imports');
          return;
        }
        targetSectionId = created;
      }
    }

    const approved: ApprovedImage[] = images.map((img, i) => ({
      id: `web-${Date.now()}-${i}`,
      url: img.url,
      thumbnailUrl: img.url,
      title: img.name,
      source: 'website-scan' as const,
      addedAt: new Date().toISOString(),
      tags: ['website-scan'],
    }));
    await onAddImages(targetSectionId, approved);
    // Make the new/used folder visible by switching the search context to it.
    setSearchSectionId(targetSectionId);
  }, [sections, onAddImages, onAddSection]);

  // Collect all unique tags across sections
  const allTags = new Set<string>();
  sections.forEach(s => s.images.forEach(img => img.tags?.forEach(t => allTags.add(t))));

  // Get all images for auto-categorize
  const allImages = sections.flatMap(s => s.images);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        Loading imagery...
      </div>
    );
  }

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Left: Sections list */}
      <div className={cn(
        'overflow-auto p-6 space-y-4 transition-all',
        searchSectionId && !searchCollapsed ? 'w-1/2 border-r border-border' : 'flex-1'
      )}>
        {/* Workspace Header */}
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: entity.accentColor || 'hsl(var(--primary))' }}
            >
              <ImageIcon className="h-6 w-6 text-white" />
            </div>
            <div className="min-w-0">
              <h2 className="text-xl font-bold text-foreground truncate">{entity.name}</h2>
              <p className="text-sm text-muted-foreground">
                {totalImages} image{totalImages !== 1 ? 's' : ''} across {sections.length} categor{sections.length !== 1 ? 'ies' : 'y'}
              </p>
            </div>
          </div>

          {/* Action toolbar - grouped into logical clusters */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Primary actions group */}
            <div className="flex items-center gap-2">
              <Button
                size="default"
                variant="outline"
                onClick={() => setAddingSection(true)}
                className="gap-2 h-9"
              >
                <FolderPlus className="h-4 w-4" /> Add Category
              </Button>
              <Button
                size="default"
                variant="outline"
                onClick={onStartComparison}
                className="gap-2 h-9"
              >
                <ArrowRightLeft className="h-4 w-4" /> Compare
              </Button>
            </div>

            {/* Divider */}
            <div className="h-6 w-px bg-border" />

            {/* Generate Brand Photography — primary AI action */}
            <Button
              variant="default"
              size="default"
              onClick={() => setPhotoGenOpen(true)}
              className="gap-2 h-9"
            >
              <Camera className="h-4 w-4" /> Generate Photography
            </Button>

            {/* AI & analysis group */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="default" className="gap-2 h-9">
                  <Sparkles className="h-4 w-4" /> AI Tools <ChevronDown className="h-3 w-3 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48">
                <DropdownMenuItem onClick={() => setShowAnalytics(!showAnalytics)} className="gap-2">
                  <BarChart3 className="h-4 w-4" /> {showAnalytics ? 'Hide' : 'Show'} Analytics
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setAutoCategorizeOpen(true)} disabled={allImages.length === 0} className="gap-2">
                  <Sparkles className="h-4 w-4" /> Auto-Categorize
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleMergeDuplicates}
                  disabled={duplicateSectionCount === 0}
                  className="gap-2"
                >
                  <Combine className="h-4 w-4" />
                  Merge Duplicate Categories
                  {duplicateSectionCount > 0 && (
                    <Badge variant="secondary" className="ml-auto text-[10px] h-5">{duplicateSectionCount}</Badge>
                  )}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setWebsiteScannerOpen(true)} className="gap-2">
                  <Globe className="h-4 w-4" /> Scan Website for Images
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Style Analysis - standalone since it has its own trigger */}
            <StyleAnalysisPanel entityId={entity.id} entityType={entity.type} sections={sections} />

            {/* Selection group */}
            <Button
              variant={selectionMode ? 'secondary' : 'outline'}
              size="default"
              onClick={onToggleSelectionMode}
              className="gap-2 h-9"
            >
              <Copy className="h-4 w-4" />
              {selectionMode ? `${selectedImages.size} selected` : 'Select'}
            </Button>
            {selectionMode && selectedImages.size > 0 && (
              <Button
                size="default"
                variant="default"
                onClick={() => {
                  const images = Array.from(selectedImages.values());
                  const firstEntry = Array.from(selectedImages.entries())[0];
                  const sectionId = firstEntry?.[0]?.split('::')[0];
                  const section = sections.find(s => s.id === sectionId);
                  onStartBulkCopy(images, section?.name || 'Imported');
                }}
                className="gap-2 h-9"
              >
                <ArrowRightLeft className="h-4 w-4" /> Copy to Entity
              </Button>
            )}
          </div>

          {/* Inline add section */}
          {addingSection && (
            <div className="flex items-center gap-2">
              <Input
                placeholder="Category name..."
                value={newSectionName}
                onChange={e => setNewSectionName(e.target.value)}
                className="max-w-xs h-9"
                onKeyDown={e => e.key === 'Enter' && handleAddSection()}
                autoFocus
              />
              <Button size="default" variant="default" className="h-9" onClick={handleAddSection} disabled={!newSectionName.trim()}>
                <Check className="h-4 w-4" />
              </Button>
              <Button size="default" variant="ghost" className="h-9" onClick={() => { setAddingSection(false); setNewSectionName(''); }}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Batch Operations Toolbar */}
        {selectionMode && selectedImages.size > 0 && (
          <BatchOperationsToolbar
            selectedImages={selectedImages}
            sections={sections}
            entityId={entity.id}
            entityType={entity.type}
            onBulkTag={handleBulkTag}
            onBulkRemoveTag={handleBulkRemoveTag}
            onBulkDelete={handleBulkDelete}
            onBulkMove={handleBulkMove}
            onBulkQualityScore={handleBulkQualityScore}
            onClearSelection={onToggleSelectionMode}
          />
        )}

        {/* Visual Search Panel */}
        {visualSearchUrl && (
          <VisualSearchPanel
            imageUrl={visualSearchUrl}
            entityId={entity.id}
            entityType={entity.type}
            onSearchQuery={handleVisualSearchQuery}
            onClose={() => setVisualSearchUrl(null)}
          />
        )}

        {/* Analytics Panel */}
        {showAnalytics && (
          <ImageryAnalytics entity={entity} sections={sections} />
        )}

        {/* Brand Photography Filter Bar */}
        <div className="flex items-center gap-3 flex-wrap">
          <Camera className="h-4 w-4 text-muted-foreground shrink-0" />
          <Button
            variant={photoOnly ? 'default' : 'outline'}
            size="sm"
            className="h-9 gap-2"
            onClick={() => {
              const next = !photoOnly;
              setPhotoOnly(next);
              if (!next) setPresetFilter(null);
            }}
          >
            <Sparkles className="h-3.5 w-3.5" />
            AI Brand Photography
            <Badge variant="secondary" className="ml-1 text-[10px] h-5">{photoCount}</Badge>
          </Button>
          {photoOnly && (
            <div className="flex gap-1.5 flex-wrap items-center">
              <span className="text-xs text-muted-foreground">Preset:</span>
              {PHOTO_PRESETS.map(p => {
                const count = sections.reduce(
                  (sum, s) => sum + s.images.filter(img => isBrandPhoto(img) && img.tags?.includes(p.key)).length,
                  0,
                );
                if (count === 0) return null;
                return (
                  <Badge
                    key={p.key}
                    variant={presetFilter === p.key ? 'default' : 'outline'}
                    className="text-xs cursor-pointer px-2.5 py-1"
                    onClick={() => setPresetFilter(presetFilter === p.key ? null : p.key)}
                  >
                    {p.label} <span className="ml-1 opacity-60">{count}</span>
                  </Badge>
                );
              })}
              {presetFilter && (
                <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setPresetFilter(null)}>
                  Clear preset
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Tag Filter Bar */}
        {allTags.size > 0 && (
          <div className="flex items-center gap-3 flex-wrap">
            <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
            <Input
              placeholder="Filter by tag..."
              value={tagFilter}
              onChange={e => setTagFilter(e.target.value)}
              className="w-48 h-9"
            />
            {tagFilter && (
              <Button variant="ghost" size="default" className="h-9" onClick={() => setTagFilter('')}>
                Clear
              </Button>
            )}
            <div className="flex gap-1.5 flex-wrap">
              {Array.from(allTags).slice(0, 10).map(tag => (
                <Badge
                  key={tag}
                  variant={tagFilter === tag ? 'default' : 'outline'}
                  className="text-sm cursor-pointer px-2.5 py-1"
                  onClick={() => setTagFilter(tagFilter === tag ? '' : tag)}
                >
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Sections */}
        {sections.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <ImageIcon className="h-12 w-12 text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground text-center">
                No imagery categories yet. Add a category to get started.
              </p>
              <Button variant="outline" className="mt-4" onClick={() => setAddingSection(true)}>
                <Plus className="h-4 w-4 mr-1" /> Add First Category
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-5">
            {sections.map(section => (
              <Collapsible key={section.id} defaultOpen>
                <Card className="border-border/50">
                  <div className="p-4 flex items-center justify-between">
                    <CollapsibleTrigger className="flex items-center gap-2.5 hover:opacity-80">
                      <h3 className="font-semibold text-foreground">{section.name}</h3>
                      <Badge variant="secondary">{section.images.length}</Badge>
                    </CollapsibleTrigger>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="default" className="h-9 gap-2" onClick={() => openSearch(section.id)}>
                        <Search className="h-4 w-4" /> Search Stock
                      </Button>
                      <Button
                        variant="ghost"
                        size="default"
                        className="h-9 text-destructive hover:text-destructive"
                        onClick={() => onRemoveSection(section.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <CollapsibleContent>
                    <CardContent className="pt-0 pb-4 px-4 space-y-3">
                      <DraggableImageGrid
                        images={section.images}
                        sectionId={section.id}
                        onReorder={newImages => onReorderImages(section.id, newImages)}
                        onRemoveImage={imageId => {
                          const img = section.images.find(i => i.id === imageId);
                          if (img) {
                            // Fire-and-forget 'removed' signal for AI learning
                            supabase.functions.invoke('shutterstock-learn', {
                              body: {
                                action: 'record_signal',
                                entityId: entity.id,
                                entityType: entity.type,
                                organizationId,
                                imageId,
                                signalAction: 'removed',
                                imageMetadata: {
                                  url: img.url || img.thumbnailUrl,
                                  title: img.title,
                                  source: img.source,
                                  tags: img.tags,
                                },
                                sectionName: section.name,
                              },
                            }).catch(() => {});
                          }
                          onRemoveImage(section.id, imageId);
                        }}
                        onUpdateTags={(imageId, tags) => onUpdateImageTags(section.id, imageId, tags)}
                        selectedImages={selectedImages}
                        onToggleSelection={img => onToggleImageSelection(section.id, img)}
                        selectionMode={selectionMode}
                        tagFilter={tagFilter}
                        entityId={entity.id}
                        entityType={entity.type}
                        onVisualSearch={url => setVisualSearchUrl(url)}
                        availableSections={sections}
                        onMoveToSection={handleMoveImageToSection}
                        onRejectImage={handleRejectImage}
                      />
                      {/* Upload Zone */}
                      {organizationId && (
                        <ImageryUploadZone
                          organizationId={organizationId}
                          entityId={entity.id}
                          sectionId={section.id}
                          onImagesUploaded={images => onAddImages(section.id, images)}
                        />
                      )}
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            ))}
          </div>
        )}
      </div>

      {/* Right: Inline Search Panel - always open with section picker */}
      {searchSectionId && !searchCollapsed && (
        <div className="w-1/2 h-full">
          <InlineImagerySearch
            onApproveImages={handleApproveImages}
            onClose={() => setSearchCollapsed(true)}
            targetSectionName={searchSection?.name || ''}
            entityId={entity.id}
            entityType={entity.type}
            organizationId={organizationId}
            sections={sections}
            activeSectionId={searchSectionId}
            onChangeSection={handleChangeSearchSection}
          />
        </div>
      )}

      {/* Collapsed search toggle */}
      {searchCollapsed && sections.length > 0 && (
        <div className="w-12 h-full border-l border-border flex flex-col items-center pt-4 bg-muted/30">
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10"
            onClick={() => setSearchCollapsed(false)}
            title="Open Search Panel"
          >
            <Search className="h-5 w-5" />
          </Button>
        </div>
      )}

      {/* Auto-Categorize Dialog */}
      <AutoCategorizeDialog
        open={autoCategorizeOpen}
        onOpenChange={setAutoCategorizeOpen}
        images={allImages}
        sections={sections}
        entityName={entity.name}
        onApply={handleAutoCategorizeApply}
      />

      {/* Website Image Scanner */}
      <WebsiteImageScanner
        open={websiteScannerOpen}
        onOpenChange={setWebsiteScannerOpen}
        onImportImages={handleWebsiteImport}
        destinations={sections.map(s => ({ id: s.id, name: s.name }))}
        defaultDestinationId={searchSectionId || sections[sections.length - 1]?.id}
      />

      {/* Brand Photography Generator */}
      <BrandPhotographyGenerator
        open={photoGenOpen}
        onOpenChange={setPhotoGenOpen}
        entity={entity}
        sections={sections}
        onAddImages={onAddImages}
        onAddSection={onAddSection}
      />
    </div>
  );
};
