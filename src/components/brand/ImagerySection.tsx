import { useState, useCallback } from 'react';
import { Upload, ThumbsUp, ThumbsDown, Grid2X2, Grid3X3, LayoutGrid, Rows3, ImageIcon } from 'lucide-react';
import { useStorageUpload } from '@/hooks/useStorageUpload';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { BrandImagery } from '@/types/brand';
import { Button } from '@/components/ui/button';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { SectionHeader } from './SectionHeader';
import { useDropZone } from '@/components/ui/drop-zone';
import { ImageLibraryPicker } from '@/components/ui/ImageLibraryPicker';
import { SortableImageryCard } from './imagery/SortableImageryCard';
import { ImageryGuidelinesPanel } from './imagery/ImageryGuidelinesPanel';
import { TransPerfectPhotographyPanel } from './imagery/TransPerfectPhotographyPanel';
import type { BrandVisualsBundle } from '@/lib/brandLayoutTemplates';

interface ImagerySectionProps {
  imagery: BrandImagery[];
  onImageryChange?: (imagery: BrandImagery[]) => void;
  customSubtitle?: string;
  onSubtitleChange?: (subtitle: string) => void;
  entityId?: string;
  entityType?: 'brand' | 'product' | 'event';
  isAdmin?: boolean;
  /** Brand slug — when set to 'transperfect' the TP photography panel is shown. */
  brandSlug?: string;
  /** @deprecated Layout templates now live in their own dedicated section. */
  brandVisuals?: BrandVisualsBundle;
}

type ViewMode = 'split' | 'grid-2' | 'grid-3' | 'grid-4';

export const ImagerySection = ({ imagery, onImageryChange, customSubtitle, onSubtitleChange, entityId, entityType = 'brand', isAdmin = false, brandSlug }: ImagerySectionProps) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pendingType, setPendingType] = useState<'do' | 'dont'>('do');
  const [isHeaderEditing, setIsHeaderEditing] = useState(false);
  // Default to grid-4 for compact small image preview grid
  const [viewMode, setViewMode] = useState<ViewMode>('grid-4');

  const canEdit = Boolean(onImageryChange);
  const { uploadFile } = useStorageUpload({ entityType, entityId });

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleFileDrop = useCallback(async (file: File) => {
    if (!onImageryChange) return;
    let url: string;
    if (entityId) {
      const result = await uploadFile(file, 'asset', `imagery-${crypto.randomUUID()}`);
      if (!result) return;
      url = result.url;
    } else {
      const reader = new FileReader();
      url = await new Promise((resolve) => {
        reader.onload = (event) => resolve(event.target?.result as string);
        reader.readAsDataURL(file);
      });
    }
    const newImagery: BrandImagery = {
      id: crypto.randomUUID(),
      url,
      type: pendingType,
      description: pendingType === 'do' ? 'Good example of brand photography' : 'Avoid this style',
    };
    onImageryChange([...imagery, newImagery]);
  }, [imagery, onImageryChange, pendingType, entityId, uploadFile]);

  const { isDragging, fileInputRef, dragHandlers, openFilePicker, handleInputChange, multiple } = useDropZone({
    onFileDrop: handleFileDrop,
    // Accept both images and SVGs
    accept: 'image/*,.svg',
    // Many photography examples/screenshots exceed 2MB; allow up to 20MB (Lovable upload limit)
    maxSize: 20 * 1024 * 1024,
    multiple: true,
  });

  const triggerUpload = (type: 'do' | 'dont') => {
    setPendingType(type);
    openFilePicker();
  };

  const handleLibrarySelect = (url: string, type: 'do' | 'dont') => {
    if (!onImageryChange) return;
    const newImagery: BrandImagery = {
      id: crypto.randomUUID(),
      url,
      type,
      description: type === 'do' ? 'Good example of brand photography' : 'Avoid this style',
    };
    onImageryChange([...imagery, newImagery]);
  };

  const updateImagery = (id: string, updates: Partial<BrandImagery>) => {
    if (!onImageryChange) return;
    onImageryChange(imagery.map(i => i.id === id ? { ...i, ...updates } : i));
  };

  const deleteImagery = (id: string) => {
    if (!onImageryChange) return;
    onImageryChange(imagery.filter(i => i.id !== id));
    if (editingId === id) setEditingId(null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !onImageryChange) return;

    const oldIndex = imagery.findIndex((img) => img.id === active.id);
    const newIndex = imagery.findIndex((img) => img.id === over.id);
    
    if (oldIndex !== -1 && newIndex !== -1) {
      onImageryChange(arrayMove(imagery, oldIndex, newIndex));
    }
  };

  const handleDoImagesDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !onImageryChange) return;

    const oldIndex = doImages.findIndex((img) => img.id === active.id);
    const newIndex = doImages.findIndex((img) => img.id === over.id);
    
    if (oldIndex !== -1 && newIndex !== -1) {
      const reorderedDoImages = arrayMove(doImages, oldIndex, newIndex);
      // Reconstruct full imagery array with reordered do images + dont images
      onImageryChange([...reorderedDoImages, ...dontImages]);
    }
  };

  const handleDontImagesDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !onImageryChange) return;

    const oldIndex = dontImages.findIndex((img) => img.id === active.id);
    const newIndex = dontImages.findIndex((img) => img.id === over.id);
    
    if (oldIndex !== -1 && newIndex !== -1) {
      const reorderedDontImages = arrayMove(dontImages, oldIndex, newIndex);
      // Reconstruct full imagery array with do images + reordered dont images
      onImageryChange([...doImages, ...reorderedDontImages]);
    }
  };

  const doImages = imagery.filter(i => i.type === 'do');
  const dontImages = imagery.filter(i => i.type === 'dont');

  const getGridClass = () => {
    switch (viewMode) {
      case 'grid-2': return 'grid-cols-2';
      case 'grid-3': return 'grid-cols-2 sm:grid-cols-3';
      case 'grid-4': return 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4';
      default: return '';
    }
  };

  return (
    <section className="space-y-4 sm:space-y-6">
      {/* Section header - always full width on its own row */}
      <SectionHeader
        title="Visual Direction"
        defaultSubtitle="Photography standards & inclusive imagery audit — considers Approved Imagery, Image Assets, brochures, presentations, PDFs, and case study visuals"
        customSubtitle={customSubtitle}
        onSubtitleChange={canEdit ? onSubtitleChange : undefined}
        isEditing={isHeaderEditing}
        onEditToggle={() => setIsHeaderEditing(!isHeaderEditing)}
      />
      
      {/* Controls row - separate from header */}
      <div className="flex items-center gap-2 flex-wrap">
          <ToggleGroup
            type="single"
            value={viewMode}
            onValueChange={(value) => value && setViewMode(value as ViewMode)}
            className="border rounded-md"
          >
            <ToggleGroupItem value="split" aria-label="Split view" className="px-2 h-8 sm:h-9">
              <Rows3 className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="grid-2" aria-label="2 column grid" className="px-2 h-8 sm:h-9">
              <Grid2X2 className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="grid-3" aria-label="3 column grid" className="px-2 h-8 sm:h-9 hidden sm:flex">
              <Grid3X3 className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="grid-4" aria-label="4 column grid" className="px-2 h-8 sm:h-9 hidden md:flex">
              <LayoutGrid className="h-4 w-4" />
            </ToggleGroupItem>
          </ToggleGroup>
      </div>

      {brandSlug?.toLowerCase() === 'transperfect' && <TransPerfectPhotographyPanel canEdit={canEdit} />}

      {isAdmin && <ImageryGuidelinesPanel canEdit={canEdit} entityId={entityId} entityType={entityType} />}


      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.svg,image/svg+xml"
        multiple
        onChange={handleInputChange}
        className="hidden"
      />

      {viewMode === 'split' ? (
        /* Split View - Original Do/Don't columns */
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
          {/* Do's */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-green-600">
              <ThumbsUp className="h-5 w-5" />
              <h3 className="text-lg font-semibold">Do</h3>
              <span className="text-sm text-muted-foreground">({doImages.length})</span>
            </div>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDoImagesDragEnd}
            >
              <SortableContext items={doImages.map(img => img.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-3">
                  {doImages.map((img, index) => (
                    <SortableImageryCard
                      key={img.id}
                      image={img}
                      index={index}
                      viewMode={viewMode}
                      canEdit={canEdit}
                      isEditing={editingId === img.id}
                      onEdit={setEditingId}
                      onUpdate={updateImagery}
                      onDelete={deleteImagery}
                      onEditDone={() => setEditingId(null)}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
            {canEdit && (
              <div className="flex gap-2">
                <button
                  onClick={() => triggerUpload('do')}
                  onDragOver={(e) => { setPendingType('do'); dragHandlers.onDragOver(e); }}
                  onDragLeave={dragHandlers.onDragLeave}
                  onDrop={(e) => { setPendingType('do'); dragHandlers.onDrop(e); }}
                  className={`flex-1 h-24 border-2 border-dashed rounded-xl flex items-center justify-center gap-2 transition-colors ${
                    isDragging && pendingType === 'do'
                      ? 'border-green-500 bg-green-50 text-green-600'
                      : 'border-green-300 text-green-600 hover:bg-green-50'
                  }`}
                >
                  <Upload className="h-5 w-5" />
                  <span className="text-sm font-medium">{isDragging && pendingType === 'do' ? 'Drop to add' : 'Upload'}</span>
                </button>
                <ImageLibraryPicker
                  onSelect={(url) => handleLibrarySelect(url, 'do')}
                  trigger={
                    <button className="h-24 px-4 border-2 border-dashed border-green-300 rounded-xl flex items-center justify-center gap-2 text-green-600 hover:bg-green-50 transition-colors">
                      <ImageIcon className="h-5 w-5" />
                      <span className="text-sm font-medium">Library</span>
                    </button>
                  }
                />
              </div>
            )}
          </div>

          {/* Don'ts */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-red-600">
              <ThumbsDown className="h-5 w-5" />
              <h3 className="text-lg font-semibold">Don't</h3>
              <span className="text-sm text-muted-foreground">({dontImages.length})</span>
            </div>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDontImagesDragEnd}
            >
              <SortableContext items={dontImages.map(img => img.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-3">
                  {dontImages.map((img, index) => (
                    <SortableImageryCard
                      key={img.id}
                      image={img}
                      index={index}
                      viewMode={viewMode}
                      canEdit={canEdit}
                      isEditing={editingId === img.id}
                      onEdit={setEditingId}
                      onUpdate={updateImagery}
                      onDelete={deleteImagery}
                      onEditDone={() => setEditingId(null)}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
            {canEdit && (
              <div className="flex gap-2">
                <button
                  onClick={() => triggerUpload('dont')}
                  onDragOver={(e) => { setPendingType('dont'); dragHandlers.onDragOver(e); }}
                  onDragLeave={dragHandlers.onDragLeave}
                  onDrop={(e) => { setPendingType('dont'); dragHandlers.onDrop(e); }}
                  className={`flex-1 h-24 border-2 border-dashed rounded-xl flex items-center justify-center gap-2 transition-colors ${
                    isDragging && pendingType === 'dont'
                      ? 'border-red-500 bg-red-50 text-red-600'
                      : 'border-red-300 text-red-600 hover:bg-red-50'
                  }`}
                >
                  <Upload className="h-5 w-5" />
                  <span className="text-sm font-medium">{isDragging && pendingType === 'dont' ? 'Drop to add' : 'Upload'}</span>
                </button>
                <ImageLibraryPicker
                  onSelect={(url) => handleLibrarySelect(url, 'dont')}
                  trigger={
                    <button className="h-24 px-4 border-2 border-dashed border-red-300 rounded-xl flex items-center justify-center gap-2 text-red-600 hover:bg-red-50 transition-colors">
                      <ImageIcon className="h-5 w-5" />
                      <span className="text-sm font-medium">Library</span>
                    </button>
                  }
                />
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Grid View - All images in grid with type badges */
        <div className="space-y-4">
          {canEdit && (
            <div className="flex items-center gap-4 flex-wrap">
              <Button onClick={() => triggerUpload('do')} variant="outline" size="sm" className="gap-2 text-green-600 border-green-300 hover:bg-green-50">
                <ThumbsUp className="h-4 w-4" />
                Upload Do
              </Button>
              <ImageLibraryPicker
                onSelect={(url) => handleLibrarySelect(url, 'do')}
                trigger={
                  <Button variant="outline" size="sm" className="gap-2 text-green-600 border-green-300 hover:bg-green-50">
                    <ImageIcon className="h-4 w-4" />
                    Do from Library
                  </Button>
                }
              />
              <Button onClick={() => triggerUpload('dont')} variant="outline" size="sm" className="gap-2 text-red-600 border-red-300 hover:bg-red-50">
                <ThumbsDown className="h-4 w-4" />
                Upload Don't
              </Button>
              <ImageLibraryPicker
                onSelect={(url) => handleLibrarySelect(url, 'dont')}
                trigger={
                  <Button variant="outline" size="sm" className="gap-2 text-red-600 border-red-300 hover:bg-red-50">
                    <ImageIcon className="h-4 w-4" />
                    Don't from Library
                  </Button>
                }
              />
            </div>
          )}
          
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={imagery.map(img => img.id)} strategy={rectSortingStrategy}>
              <div className={`grid ${getGridClass()} gap-4`}>
                {imagery.map((img, index) => (
                  <SortableImageryCard
                    key={img.id}
                    image={img}
                    index={index}
                    viewMode={viewMode}
                    canEdit={canEdit}
                    isEditing={editingId === img.id}
                    onEdit={setEditingId}
                    onUpdate={updateImagery}
                    onDelete={deleteImagery}
                    onEditDone={() => setEditingId(null)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>

          {imagery.length === 0 && (
            <div className="text-center py-12 border-2 border-dashed border-border rounded-xl">
              <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No imagery examples yet</h3>
              <p className="text-muted-foreground mb-4">Add examples to show what works and what doesn't for your brand photography.</p>
            </div>
          )}
        </div>
      )}
    </section>
  );
};
