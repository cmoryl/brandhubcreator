import { useState, useCallback } from 'react';
import { X, Download, Upload, Image as ImageIcon, Expand, FolderOpen, Loader2, Grid3X3, LayoutGrid, Grid2X2, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SectionHeader } from './SectionHeader';
import { useDropZone } from '@/components/ui/drop-zone';
import { PreviewDialog } from '@/components/ui/preview-dialog';
import { ImageLibraryPicker } from '@/components/ui/ImageLibraryPicker';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { safeUUID } from '@/lib/safeUUID';
import { useStorageUpload } from '@/hooks/useStorageUpload';
import { toast } from 'sonner';

// Image Asset type
export interface ImageAsset {
  id: string;
  name: string;
  url: string;
  size: string;
  type: string;
  uploadedAt: string;
  removed?: boolean;
  reason?: string;
}

interface ImageAssetsSectionProps {
  imageAssets?: ImageAsset[];
  onImageAssetsChange?: (assets: ImageAsset[]) => void;
  customSubtitle?: string;
  onSubtitleChange?: (subtitle: string) => void;
  /** Controls whether editing is allowed */
  canEdit?: boolean;
  /** Entity ID for storage uploads */
  entityId?: string;
  /** Entity type for storage uploads */
  entityType?: 'brand' | 'event' | 'product';
}

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

export const ImageAssetsSection = ({ 
  imageAssets = [], 
  onImageAssetsChange, 
  customSubtitle, 
  onSubtitleChange,
  canEdit = false,
  entityId,
  entityType = 'brand',
}: ImageAssetsSectionProps) => {
  const [isHeaderEditing, setIsHeaderEditing] = useState(false);
  const [previewAsset, setPreviewAsset] = useState<ImageAsset | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  type GridDensity = 'grid-lg' | 'grid-md' | 'grid-sm' | 'list';
  const [gridDensity, setGridDensity] = useState<GridDensity>(() => {
    try {
      return (localStorage.getItem('image-assets-grid-density') as GridDensity) || 'grid-lg';
    } catch { return 'grid-lg'; }
  });
  const handleDensityChange = (d: GridDensity) => {
    setGridDensity(d);
    try { localStorage.setItem('image-assets-grid-density', d); } catch {}
  };

  const gridClass = {
    'grid-lg': 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4',
    'grid-md': 'grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-7 gap-3',
    'grid-sm': 'grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-2',
    'list': 'flex flex-col gap-2',
  }[gridDensity];
  const isCompact = gridDensity === 'grid-sm';
  const isList = gridDensity === 'list';

  // Use storage upload hook for proper blob storage (avoids base64 database storage issues)
  const { uploadFile, isUploading, uploadProgress } = useStorageUpload({ 
    entityType, 
    entityId 
  });

  const handleFileDrop = useCallback(async (file: File) => {
    // Only accept image files
    if (!file.type.startsWith('image/')) {
      toast.error('Only image files (PNG, JPG, WEBP) are allowed');
      return;
    }

    // Require storage upload — base64 fallback causes data loss via stripBase64FromGuideData
    if (!entityId) {
      toast.error('Please save this guide first, then upload images.');
      return;
    }

    const assetId = safeUUID();
    const result = await uploadFile(file, 'asset', `asset-${assetId}`);
    if (result) {
      const newAsset: ImageAsset = {
        id: assetId,
        name: file.name.split('.')[0] || 'Image',
        type: file.type,
        url: result.url,
        size: formatFileSize(file.size),
        uploadedAt: new Date().toISOString(),
      };
      onImageAssetsChange?.([...imageAssets, newAsset]);
    }
  }, [imageAssets, onImageAssetsChange, entityId, uploadFile]);

  const handleLibrarySelect = useCallback((url: string) => {
    const urlParts = url.split('/');
    const fileName = urlParts[urlParts.length - 1] || 'Library Image';
    const newAsset: ImageAsset = {
      id: safeUUID(),
      name: fileName.split('.')[0] || 'Library Image',
      type: 'image/jpeg',
      url,
      size: 'From Library',
      uploadedAt: new Date().toISOString(),
    };
    onImageAssetsChange?.([...imageAssets, newAsset]);
  }, [imageAssets, onImageAssetsChange]);

  const { isDragging, fileInputRef, dragHandlers, openFilePicker, handleInputChange } = useDropZone({
    onFileDrop: handleFileDrop,
    accept: 'image/png,image/jpeg,image/jpg,image/webp',
    maxSize: 10 * 1024 * 1024, // 10MB for images
    disabled: !canEdit || isUploading,
    multiple: true,
  });

  const deleteAsset = (id: string) => {
    onImageAssetsChange?.(imageAssets.filter(a => a.id !== id));
  };
  const downloadAsset = (asset: ImageAsset) => {
    const link = document.createElement('a');
    link.href = asset.url;
    link.download = asset.name;
    link.click();
  };

  // Filter out removed/broken assets for display
  const validAssets = imageAssets.filter(a => !a.removed && a.url);
  const removedCount = imageAssets.length - validAssets.length;

  // Only show section if there are valid assets OR user can edit
  if (validAssets.length === 0 && !canEdit) {
    return null;
  }

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1">
          <SectionHeader
            title="Image Assets"
            defaultSubtitle="Brand images and visual assets for download"
            customSubtitle={customSubtitle}
            onSubtitleChange={onSubtitleChange}
            isEditing={isHeaderEditing}
            onEditToggle={canEdit ? () => setIsHeaderEditing(!isHeaderEditing) : undefined}
          />
        </div>
        {canEdit && (
          <div className="flex items-center gap-2 shrink-0">
            <ImageLibraryPicker
              onSelect={handleLibrarySelect}
              trigger={
                <Button variant="outline" size="sm" className="gap-2">
                  <FolderOpen className="h-4 w-4" />
                  Library
                </Button>
              }
              defaultCategory="Product Images"
            />
            <Button onClick={openFilePicker} size="sm" className="gap-2" disabled={isUploading}>
              {isUploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
            {isUploading ? 'Uploading...' : 'Upload'}
          </Button>
        </div>
      )}
    </div>

    {/* Grid Density Controls */}
    {validAssets.length > 0 && (
      <div className="flex items-center justify-end gap-1">
        {([
          { id: 'grid-lg' as const, icon: LayoutGrid, label: 'Large Grid (5 cols)' },
          { id: 'grid-md' as const, icon: Grid2X2, label: 'Medium Grid (7 cols)' },
          { id: 'grid-sm' as const, icon: Grid3X3, label: 'Small Grid (8 cols)' },
          { id: 'list' as const, icon: List, label: 'List View' },
        ]).map(opt => (
          <Tooltip key={opt.id}>
            <TooltipTrigger asChild>
              <Button
                variant={gridDensity === opt.id ? 'secondary' : 'ghost'}
                size="icon"
                className="h-8 w-8"
                onClick={() => handleDensityChange(opt.id)}
              >
                <opt.icon className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">{opt.label}</TooltipContent>
          </Tooltip>
        ))}
      </div>
    )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/webp"
        multiple
        onChange={handleInputChange}
        className="hidden"
      />

      {/* Upload Progress Bar */}
      {isUploading && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Uploading image...
            </span>
            <span className="font-medium">{uploadProgress}%</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary rounded-full transition-all duration-300 ease-out"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Notice about migrated/removed assets */}
      {removedCount > 0 && canEdit && (
        <div className="flex items-center gap-3 p-3 rounded-lg border border-destructive/30 bg-destructive/5 text-sm">
          <Upload className="h-4 w-4 text-destructive shrink-0" />
          <p className="text-muted-foreground">
            <span className="font-medium text-foreground">{removedCount} image{removedCount !== 1 ? 's' : ''}</span> migrated out of database storage — re-upload via the button above to restore.
          </p>
        </div>
      )}

      {validAssets.length > 0 ? (
        <div className={gridClass}>
          {validAssets.map((asset, index) => isList ? (
            <div
              key={asset.id}
              className="group relative bg-card rounded-lg border border-border overflow-hidden animate-fade-in flex items-center gap-3 pr-2"
              style={{ animationDelay: `${index * 30}ms` }}
              onMouseEnter={() => setHoveredId(asset.id)}
              onMouseLeave={() => setHoveredId(null)}
            >
              <div className="h-14 w-14 shrink-0 overflow-hidden bg-muted/30">
                <img src={asset.url} alt={asset.name} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{asset.name}</p>
                <p className="text-xs text-muted-foreground">{asset.size} • {asset.type.split('/')[1]?.toUpperCase() || 'IMAGE'}</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setPreviewAsset(asset)}>
                  <Expand className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => downloadAsset(asset)}>
                  <Download className="h-3.5 w-3.5" />
                </Button>
                {canEdit && (
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteAsset(asset.id)}>
                    <X className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div
              key={asset.id}
              className={cn(
                "group relative bg-card rounded-xl border border-border overflow-hidden animate-fade-in",
                isCompact && "rounded-lg"
              )}
              style={{ animationDelay: `${index * 30}ms` }}
              onMouseEnter={() => setHoveredId(asset.id)}
              onMouseLeave={() => setHoveredId(null)}
            >
              <div className="aspect-square relative overflow-hidden bg-muted/30">
                <img src={asset.url} alt={asset.name} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                <div className={cn(
                  "absolute inset-0 bg-black/60 flex items-center justify-center gap-1.5 transition-opacity duration-200",
                  hoveredId === asset.id ? 'opacity-100' : 'opacity-0'
                )}>
                  <Button variant="secondary" size="icon" className={cn(isCompact ? "h-7 w-7" : "h-9 w-9")} onClick={() => setPreviewAsset(asset)}>
                    <Expand className={cn(isCompact ? "h-3 w-3" : "h-4 w-4")} />
                  </Button>
                  <Button variant="secondary" size="icon" className={cn(isCompact ? "h-7 w-7" : "h-9 w-9")} onClick={() => downloadAsset(asset)}>
                    <Download className={cn(isCompact ? "h-3 w-3" : "h-4 w-4")} />
                  </Button>
                  {canEdit && (
                    <Button variant="destructive" size="icon" className={cn(isCompact ? "h-7 w-7" : "h-9 w-9")} onClick={() => deleteAsset(asset.id)}>
                      <X className={cn(isCompact ? "h-3 w-3" : "h-4 w-4")} />
                    </Button>
                  )}
                </div>
              </div>
              {!isCompact && (
                <div className="p-3 space-y-1">
                  <p className="text-sm font-medium truncate" title={asset.name}>{asset.name}</p>
                  <p className="text-xs text-muted-foreground">{asset.size} • {asset.type.split('/')[1]?.toUpperCase() || 'IMAGE'}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : canEdit ? (
        <button
          onClick={openFilePicker}
          onDragOver={dragHandlers.onDragOver}
          onDragLeave={dragHandlers.onDragLeave}
          onDrop={dragHandlers.onDrop}
          className={cn(
            "w-full h-48 border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-3 transition-colors",
            isDragging 
              ? 'border-primary bg-primary/5 text-primary' 
              : 'border-border text-muted-foreground hover:border-accent hover:text-accent'
          )}
        >
          <ImageIcon className="h-10 w-10" />
          <div className="text-center">
            <p className="font-medium">{isDragging ? 'Drop images to upload' : 'Upload image assets'}</p>
            <p className="text-sm">PNG, JPG, or WEBP up to 10MB</p>
          </div>
        </button>
      ) : null}

      {/* Preview Dialog */}
      <PreviewDialog
        open={!!previewAsset}
        onOpenChange={(open) => !open && setPreviewAsset(null)}
        title={previewAsset?.name || 'Image Preview'}
        previewUrl={previewAsset?.url}
        type="image"
        aspectRatio="auto"
      />
    </section>
  );
};
