/**
 * ImageryWorkspace - Main workspace area showing imagery for selected entity
 * Integrates upload zones, drag-and-drop grids, analytics, style analysis, inline search,
 * batch operations, auto-categorization, visual search, and quality scoring
 */
import { useState, useCallback, useEffect } from 'react';
import { Plus, Check, X, Copy, ArrowRightLeft, ImageIcon, FolderPlus, Search, Filter, BarChart3, Sparkles, MoreHorizontal, Upload, ChevronDown, Globe } from 'lucide-react';
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
    for (const assignment of assignments) {
      let targetSectionId = assignment.sectionId;
      if (assignment.newSectionName && !targetSectionId) {
        const newId = await onAddSection(assignment.newSectionName);
        if (newId) targetSectionId = newId;
        else continue;
      }
      if (targetSectionId) {
        const imageWithTags = { ...assignment.image, tags: [...new Set([...(assignment.image.tags || []), ...assignment.tags])] };
        await onAddImages(targetSectionId, [imageWithTags]);
      }
    }
  }, [onAddSection, onAddImages]);

  const handleVisualSearchQuery = useCallback((query: string) => {
    if (sections.length > 0) {
      setSearchSectionId(sections[0].id);
    }
    setVisualSearchUrl(null);
  }, [sections]);

  const handleWebsiteImport = useCallback((images: { name: string; url: string; type: string }[]) => {
    const targetSectionId = searchSectionId || sections[0]?.id;
    if (!targetSectionId) return;
    const approved: ApprovedImage[] = images.map((img, i) => ({
      id: `web-${Date.now()}-${i}`,
      url: img.url,
      thumbnailUrl: img.url,
      title: img.name,
      source: 'website-scan' as const,
      addedAt: new Date().toISOString(),
      tags: ['website-scan'],
    }));
    onAddImages(targetSectionId, approved);
  }, [searchSectionId, sections, onAddImages]);

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
                        onRemoveImage={imageId => onRemoveImage(section.id, imageId)}
                        onUpdateTags={(imageId, tags) => onUpdateImageTags(section.id, imageId, tags)}
                        selectedImages={selectedImages}
                        onToggleSelection={img => onToggleImageSelection(section.id, img)}
                        selectionMode={selectionMode}
                        tagFilter={tagFilter}
                        entityId={entity.id}
                        entityType={entity.type}
                        onVisualSearch={url => setVisualSearchUrl(url)}
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
      />
    </div>
  );
};
