import { useState, useCallback } from 'react';
import { X, Download, ZoomIn, Upload, Grid2X2, Grid3X3, LayoutGrid, ImageIcon, Tag, Check } from 'lucide-react';
import { VisualAsset } from '@/types/brand';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { SectionHeader } from './SectionHeader';
import { useDropZone } from '@/components/ui/drop-zone';
import { OptimizedImage } from '@/components/ui/optimized-image';

interface VisualAssetsSectionProps {
  visualAssets: VisualAsset[];
  onVisualAssetsChange?: (assets: VisualAsset[]) => void;
  customSubtitle?: string;
  onSubtitleChange?: (subtitle: string) => void;
}

type GridSize = 'small' | 'medium' | 'large';

export const VisualAssetsSection = ({
  visualAssets,
  onVisualAssetsChange,
  customSubtitle,
  onSubtitleChange,
}: VisualAssetsSectionProps) => {
  const [isHeaderEditing, setIsHeaderEditing] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<VisualAsset | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [gridSize, setGridSize] = useState<GridSize>('medium');

  const canEdit = Boolean(onVisualAssetsChange);

  const handleFileDrop = useCallback((file: File) => {
    if (!onVisualAssetsChange) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const url = event.target?.result as string;
      const fileExt = file.name.split('.').pop()?.toLowerCase() as VisualAsset['fileType'];
      
      // Get image dimensions
      const img = new Image();
      img.onload = () => {
        const newAsset: VisualAsset = {
          id: crypto.randomUUID(),
          name: file.name.replace(/\.[^/.]+$/, ''),
          url,
          fileType: fileExt || 'png',
          width: img.width,
          height: img.height,
          fileSize: formatFileSize(file.size),
          downloadable: true,
          createdAt: new Date().toISOString(),
        };
        onVisualAssetsChange([...visualAssets, newAsset]);
      };
      img.src = url;
    };
    reader.readAsDataURL(file);
  }, [visualAssets, onVisualAssetsChange]);

  const { isDragging, fileInputRef, dragHandlers, openFilePicker, handleInputChange } = useDropZone({
    onFileDrop: handleFileDrop,
    accept: 'image/*',
    maxSize: 20 * 1024 * 1024,
  });

  const updateAsset = (id: string, updates: Partial<VisualAsset>) => {
    if (!onVisualAssetsChange) return;
    onVisualAssetsChange(visualAssets.map(a => a.id === id ? { ...a, ...updates } : a));
  };

  const deleteAsset = (id: string) => {
    if (!onVisualAssetsChange) return;
    onVisualAssetsChange(visualAssets.filter(a => a.id !== id));
    if (selectedAsset?.id === id) setSelectedAsset(null);
    if (editingId === id) setEditingId(null);
  };

  const downloadAsset = (asset: VisualAsset) => {
    const link = document.createElement('a');
    link.href = asset.url;
    link.download = `${asset.name}.${asset.fileType}`;
    link.click();
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getGridClass = () => {
    switch (gridSize) {
      case 'small': return 'grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6';
      case 'large': return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';
      default: return 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4';
    }
  };

  const getAspectClass = () => {
    switch (gridSize) {
      case 'small': return 'aspect-square';
      case 'large': return 'aspect-[4/3]';
      default: return 'aspect-[3/2]';
    }
  };

  return (
    <section className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div className="flex-1 min-w-0">
          <SectionHeader
            title="Visual Assets"
            defaultSubtitle="Brand imagery and visual assets gallery"
            customSubtitle={customSubtitle}
            onSubtitleChange={onSubtitleChange}
            isEditing={isHeaderEditing}
            onEditToggle={() => setIsHeaderEditing(!isHeaderEditing)}
          />
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <ToggleGroup
            type="single"
            value={gridSize}
            onValueChange={(value) => value && setGridSize(value as GridSize)}
            className="border rounded-md"
          >
            <ToggleGroupItem value="small" aria-label="Small grid" className="px-2 h-8 sm:h-9">
              <LayoutGrid className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="medium" aria-label="Medium grid" className="px-2 h-8 sm:h-9">
              <Grid3X3 className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="large" aria-label="Large grid" className="px-2 h-8 sm:h-9">
              <Grid2X2 className="h-4 w-4" />
            </ToggleGroupItem>
          </ToggleGroup>
          {canEdit && (
            <Button onClick={openFilePicker} size="sm" className="gap-2">
              <Upload className="h-4 w-4" />
              Upload
            </Button>
          )}
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleInputChange}
        className="hidden"
      />

      {visualAssets.length > 0 ? (
        <div className={`grid ${getGridClass()} gap-3 sm:gap-4`}>
          {visualAssets.map((asset, index) => (
            <div
              key={asset.id}
              className={`group relative bg-card rounded-xl overflow-hidden shadow-sm border border-border hover:shadow-md transition-all cursor-pointer animate-scale-in`}
              style={{ animationDelay: `${index * 30}ms` }}
              onClick={() => setSelectedAsset(asset)}
            >
              <div className={`${getAspectClass()} relative bg-muted/30`}>
                <OptimizedImage
                  src={asset.thumbnailUrl || asset.url}
                  alt={asset.name}
                  className="w-full h-full"
                  objectFit="cover"
                />
                
                {/* Hover overlay with actions */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                  <button
                    onClick={(e) => { e.stopPropagation(); setSelectedAsset(asset); }}
                    className="p-2 rounded-full bg-background/90 backdrop-blur-sm hover:bg-background transition-colors"
                  >
                    <ZoomIn className="h-4 w-4" />
                  </button>
                  {(asset.downloadable !== false) && (
                    <button
                      onClick={(e) => { e.stopPropagation(); downloadAsset(asset); }}
                      className="p-2 rounded-full bg-background/90 backdrop-blur-sm hover:bg-background transition-colors"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                  )}
                  {canEdit && (
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteAsset(asset.id); }}
                      className="p-2 rounded-full bg-background/90 backdrop-blur-sm hover:bg-destructive hover:text-destructive-foreground transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {/* File type badge */}
                <div className="absolute bottom-2 left-2">
                  <Badge variant="secondary" className="text-[10px] uppercase px-1.5 py-0.5 bg-background/80 backdrop-blur-sm">
                    {asset.fileType}
                  </Badge>
                </div>
              </div>
              
              {gridSize !== 'small' && (
                <div className="p-2 sm:p-3">
                  <p className="font-medium text-sm truncate">{asset.name}</p>
                  {asset.width && asset.height && (
                    <p className="text-xs text-muted-foreground">{asset.width} × {asset.height}</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <button
          onClick={canEdit ? openFilePicker : undefined}
          onDragOver={canEdit ? dragHandlers.onDragOver : undefined}
          onDragLeave={canEdit ? dragHandlers.onDragLeave : undefined}
          onDrop={canEdit ? dragHandlers.onDrop : undefined}
          className={`w-full h-48 border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-3 transition-colors ${
            isDragging 
              ? 'border-primary bg-primary/5 text-primary' 
              : canEdit
                ? 'border-border text-muted-foreground hover:border-accent hover:text-accent cursor-pointer'
                : 'border-border text-muted-foreground cursor-default'
          }`}
        >
          <ImageIcon className="h-10 w-10" />
          <div className="text-center">
            <p className="font-medium">{canEdit ? (isDragging ? 'Drop images to upload' : 'Upload visual assets') : 'No visual assets yet'}</p>
            <p className="text-sm">PNG, JPG, GIF, WebP, SVG</p>
          </div>
        </button>
      )}

      {/* Lightbox Modal */}
      <Dialog open={!!selectedAsset} onOpenChange={() => setSelectedAsset(null)}>
        <DialogContent className="max-w-5xl p-0 gap-0 overflow-hidden">
          {selectedAsset && (
            <div className="flex flex-col lg:flex-row">
              {/* Image preview */}
              <div className="flex-1 bg-muted/30 flex items-center justify-center p-4 min-h-[300px] lg:min-h-[500px]">
                <img
                  src={selectedAsset.url}
                  alt={selectedAsset.name}
                  className="max-w-full max-h-[70vh] object-contain rounded-lg"
                />
              </div>
              
              {/* Details sidebar */}
              <div className="w-full lg:w-80 p-6 border-t lg:border-t-0 lg:border-l border-border space-y-4">
                {editingId === selectedAsset.id && canEdit ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Name</Label>
                      <Input
                        value={selectedAsset.name}
                        onChange={(e) => updateAsset(selectedAsset.id, { name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Input
                        value={selectedAsset.description || ''}
                        onChange={(e) => updateAsset(selectedAsset.id, { description: e.target.value })}
                        placeholder="Add a description..."
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>Allow Downloads</Label>
                      <Switch
                        checked={selectedAsset.downloadable !== false}
                        onCheckedChange={(checked) => updateAsset(selectedAsset.id, { downloadable: checked })}
                      />
                    </div>
                    <Button onClick={() => setEditingId(null)} className="w-full">
                      <Check className="h-4 w-4 mr-2" />
                      Done
                    </Button>
                  </div>
                ) : (
                  <>
                    <div>
                      <h3 className="font-semibold text-lg">{selectedAsset.name}</h3>
                      {selectedAsset.description && (
                        <p className="text-sm text-muted-foreground mt-1">{selectedAsset.description}</p>
                      )}
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      {selectedAsset.width && selectedAsset.height && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Dimensions</span>
                          <span>{selectedAsset.width} × {selectedAsset.height} px</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Format</span>
                        <span className="uppercase">{selectedAsset.fileType}</span>
                      </div>
                      {selectedAsset.fileSize && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Size</span>
                          <span>{selectedAsset.fileSize}</span>
                        </div>
                      )}
                    </div>

                    {selectedAsset.tags && selectedAsset.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {selectedAsset.tags.map((tag, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            <Tag className="h-3 w-3 mr-1" />
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}

                    <div className="flex gap-2 pt-2">
                      {(selectedAsset.downloadable !== false) && (
                        <Button onClick={() => downloadAsset(selectedAsset)} className="flex-1 gap-2">
                          <Download className="h-4 w-4" />
                          Download
                        </Button>
                      )}
                      {canEdit && (
                        <Button variant="outline" onClick={() => setEditingId(selectedAsset.id)}>
                          Edit
                        </Button>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
};
