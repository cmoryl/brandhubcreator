import { useState, useCallback } from 'react';
import { X, Download, Upload, Image as ImageIcon, Eye, ZoomIn, Expand } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SectionHeader } from './SectionHeader';
import { useDropZone } from '@/components/ui/drop-zone';
import { PreviewDialog } from '@/components/ui/preview-dialog';
import { cn } from '@/lib/utils';
import { safeUUID } from '@/lib/safeUUID';

// Image Asset type
export interface ImageAsset {
  id: string;
  name: string;
  url: string;
  size: string;
  type: string;
  uploadedAt: string;
}

interface ImageAssetsSectionProps {
  imageAssets?: ImageAsset[];
  onImageAssetsChange?: (assets: ImageAsset[]) => void;
  customSubtitle?: string;
  onSubtitleChange?: (subtitle: string) => void;
  /** Controls whether editing is allowed */
  canEdit?: boolean;
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
}: ImageAssetsSectionProps) => {
  const [isHeaderEditing, setIsHeaderEditing] = useState(false);
  const [previewAsset, setPreviewAsset] = useState<ImageAsset | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const handleFileDrop = useCallback((file: File) => {
    // Only accept image files
    if (!file.type.startsWith('image/')) {
      console.error('Only image files (PNG, JPG, WEBP) are allowed');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const url = event.target?.result as string;
      const newAsset: ImageAsset = {
        id: safeUUID(),
        name: file.name,
        type: file.type,
        url,
        size: formatFileSize(file.size),
        uploadedAt: new Date().toISOString(),
      };
      onImageAssetsChange?.([...imageAssets, newAsset]);
    };
    reader.readAsDataURL(file);
  }, [imageAssets, onImageAssetsChange]);

  const { isDragging, fileInputRef, dragHandlers, openFilePicker, handleInputChange } = useDropZone({
    onFileDrop: handleFileDrop,
    accept: 'image/png,image/jpeg,image/jpg,image/webp',
    maxSize: 10 * 1024 * 1024, // 10MB for images
    disabled: !canEdit,
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

  // Only show section if there are assets OR user can edit
  if (imageAssets.length === 0 && !canEdit) {
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
          <Button onClick={openFilePicker} size="sm" className="gap-2 shrink-0">
            <Upload className="h-4 w-4" />
            Upload Image
          </Button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/webp"
        multiple
        onChange={handleInputChange}
        className="hidden"
      />

      {imageAssets.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {imageAssets.map((asset, index) => (
            <div
              key={asset.id}
              className="group relative bg-card rounded-xl border border-border overflow-hidden animate-fade-in"
              style={{ animationDelay: `${index * 50}ms` }}
              onMouseEnter={() => setHoveredId(asset.id)}
              onMouseLeave={() => setHoveredId(null)}
            >
              {/* Image Preview */}
              <div className="aspect-square relative overflow-hidden bg-muted/30">
                <img
                  src={asset.url}
                  alt={asset.name}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                
                {/* Hover Overlay */}
                <div className={cn(
                  "absolute inset-0 bg-black/60 flex items-center justify-center gap-2 transition-opacity duration-200",
                  hoveredId === asset.id ? 'opacity-100' : 'opacity-0'
                )}>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="h-9 w-9"
                    onClick={() => setPreviewAsset(asset)}
                  >
                    <Expand className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="h-9 w-9"
                    onClick={() => downloadAsset(asset)}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  {canEdit && (
                    <Button
                      variant="destructive"
                      size="icon"
                      className="h-9 w-9"
                      onClick={() => deleteAsset(asset.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>

              {/* Asset Info */}
              <div className="p-3 space-y-1">
                <p className="text-sm font-medium truncate" title={asset.name}>
                  {asset.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {asset.size} • {asset.type.split('/')[1]?.toUpperCase() || 'IMAGE'}
                </p>
              </div>
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
