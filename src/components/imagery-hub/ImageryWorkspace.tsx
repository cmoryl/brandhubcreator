/**
 * ImageryWorkspace - Main workspace area showing imagery for selected entity
 * Integrates upload zones, drag-and-drop grids, analytics, style analysis, and inline search
 */
import { useState, useCallback } from 'react';
import { Plus, Check, X, Copy, ArrowRightLeft, ImageIcon, FolderPlus, Search, Filter, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { ApprovedImage, ApprovedImagerySubSection } from '@/types/brand';
import { ImageryEntity } from '@/hooks/useImageryHubEntities';
import { InlineImagerySearch } from '@/components/imagery-hub/InlineImagerySearch';
import { ImageryUploadZone } from '@/components/imagery-hub/ImageryUploadZone';
import { ImageryAnalytics } from '@/components/imagery-hub/ImageryAnalytics';
import { StyleAnalysisPanel } from '@/components/imagery-hub/StyleAnalysisPanel';
import { DraggableImageGrid } from '@/components/imagery-hub/DraggableImageGrid';

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

  const totalImages = sections.reduce((sum, s) => sum + s.images.length, 0);
  const searchSection = sections.find(s => s.id === searchSectionId);
  const isSearchOpen = !!searchSectionId;

  const handleAddSection = useCallback(async () => {
    if (!newSectionName.trim()) return;
    await onAddSection(newSectionName.trim());
    setNewSectionName('');
    setAddingSection(false);
  }, [newSectionName, onAddSection]);

  const openSearch = useCallback((sectionId: string) => {
    setSearchSectionId(sectionId);
  }, []);

  const handleApproveImages = useCallback((images: ApprovedImage[]) => {
    if (searchSectionId) onAddImages(searchSectionId, images);
  }, [searchSectionId, onAddImages]);

  // Collect all unique tags across sections
  const allTags = new Set<string>();
  sections.forEach(s => s.images.forEach(img => img.tags?.forEach(t => allTags.add(t))));

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
        isSearchOpen ? 'w-1/2 border-r border-border' : 'flex-1'
      )}>
        {/* Workspace Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: entity.accentColor || 'hsl(var(--primary))' }}
              >
                <ImageIcon className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">{entity.name}</h2>
                <p className="text-sm text-muted-foreground">
                  {totalImages} image{totalImages !== 1 ? 's' : ''} across {sections.length} categor{sections.length !== 1 ? 'ies' : 'y'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
            <StyleAnalysisPanel
              entityId={entity.id}
              entityType={entity.type}
              sections={sections}
            />
            <Button
              variant={showAnalytics ? 'secondary' : 'outline'}
              size="sm"
              onClick={() => setShowAnalytics(!showAnalytics)}
              className="gap-1.5"
            >
              <BarChart3 className="h-3.5 w-3.5" />
              Analytics
            </Button>
            <Button
              variant={selectionMode ? 'secondary' : 'outline'}
              size="sm"
              onClick={onToggleSelectionMode}
              className="gap-1.5"
            >
              <Copy className="h-3.5 w-3.5" />
              {selectionMode ? `${selectedImages.size} selected` : 'Select'}
            </Button>
            {selectionMode && selectedImages.size > 0 && (
              <Button
                size="sm"
                variant="default"
                onClick={() => {
                  const images = Array.from(selectedImages.values());
                  const firstEntry = Array.from(selectedImages.entries())[0];
                  const sectionId = firstEntry?.[0]?.split('::')[0];
                  const section = sections.find(s => s.id === sectionId);
                  onStartBulkCopy(images, section?.name || 'Imported');
                }}
                className="gap-1.5"
              >
                <ArrowRightLeft className="h-3.5 w-3.5" />
                Copy to Entity
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={onStartComparison} className="gap-1.5">
              <ArrowRightLeft className="h-3.5 w-3.5" />
              Compare
            </Button>
            {addingSection ? (
              <div className="flex items-center gap-1.5">
                <Input
                  placeholder="Category name..."
                  value={newSectionName}
                  onChange={e => setNewSectionName(e.target.value)}
                  className="w-40 h-8 text-sm"
                  onKeyDown={e => e.key === 'Enter' && handleAddSection()}
                  autoFocus
                />
                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={handleAddSection} disabled={!newSectionName.trim()}>
                  <Check className="h-3.5 w-3.5" />
                </Button>
                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => { setAddingSection(false); setNewSectionName(''); }}>
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            ) : (
              <Button size="sm" variant="outline" onClick={() => setAddingSection(true)} className="gap-1.5">
                <FolderPlus className="h-3.5 w-3.5" />
                Add Category
              </Button>
            )}
          </div>
        </div>

        {/* Analytics Panel */}
        {showAnalytics && (
          <ImageryAnalytics entity={entity} sections={sections} />
        )}

        {/* Tag Filter Bar */}
        {allTags.size > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <Input
              placeholder="Filter by tag..."
              value={tagFilter}
              onChange={e => setTagFilter(e.target.value)}
              className="w-40 h-7 text-xs"
            />
            {tagFilter && (
              <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setTagFilter('')}>
                Clear
              </Button>
            )}
            <div className="flex gap-1 flex-wrap">
              {Array.from(allTags).slice(0, 10).map(tag => (
                <Badge
                  key={tag}
                  variant={tagFilter === tag ? 'default' : 'outline'}
                  className="text-xs cursor-pointer"
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
          <div className="space-y-4">
            {sections.map(section => (
              <Collapsible key={section.id} defaultOpen>
                <Card className="border-border/50">
                  <div className="p-3 flex items-center justify-between">
                    <CollapsibleTrigger className="flex items-center gap-2 hover:opacity-80">
                      <h3 className="font-semibold text-sm text-foreground">{section.name}</h3>
                      <Badge variant="secondary" className="text-xs">{section.images.length}</Badge>
                    </CollapsibleTrigger>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={() => openSearch(section.id)}>
                        <Search className="h-3 w-3" /> Search Stock
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs text-destructive hover:text-destructive"
                        onClick={() => onRemoveSection(section.id)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <CollapsibleContent>
                    <CardContent className="pt-0 pb-3 px-3 space-y-3">
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

      {/* Right: Inline Search Panel */}
      {isSearchOpen && (
        <div className="w-1/2 h-full">
          <InlineImagerySearch
            onApproveImages={handleApproveImages}
            onClose={() => setSearchSectionId(null)}
            targetSectionName={searchSection?.name || ''}
            entityId={entity.id}
            entityType={entity.type}
            organizationId={organizationId}
          />
        </div>
      )}
    </div>
  );
};
