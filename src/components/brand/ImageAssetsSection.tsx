import { useState, useCallback } from 'react';
import { X, Download, Upload, Image as ImageIcon, Expand, FolderOpen, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SectionHeader } from './SectionHeader';
import { useDropZone } from '@/components/ui/drop-zone';
import { PreviewDialog } from '@/components/ui/preview-dialog';
import { ImageLibraryPicker } from '@/components/ui/ImageLibraryPicker';
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

    const assetId = safeUUID();
    
    // Try to upload to storage first (preferred for large files)
    if (entityId) {
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
        return;
      }
    }

    // Fallback to base64 for small files or when storage isn't available
    // Use chunked conversion to avoid stack overflow with large files
    const arrayBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    
    // Check if file is too large for base64 storage (> 2MB)
    if (bytes.length > 2 * 1024 * 1024) {
      toast.error('File too large. Please save the entity first to enable large file uploads.');
      return;
    }
    
    // Chunked base64 conversion to avoid stack overflow
    const chunkSize = 8192;
    let binary = '';
    for (let i = 0; i < bytes.length; i += chunkSize) {
      const chunk = bytes.subarray(i, Math.min(i + chunkSize, bytes.length));
      for (let j = 0; j < chunk.length; j++) {
        binary += String.fromCharCode(chunk[j]);
      }
    }
    const base64 = btoa(binary);
    const dataUrl = `data:${file.type};base64,${base64}`;
    
    const newAsset: ImageAsset = {
      id: assetId,
      name: file.name.split('.')[0] || 'Image',
      type: file.type,
      url: dataUrl,
      size: formatFileSize(file.size),
      uploadedAt: new Date().toISOString(),
    };
    onImageAssetsChange?.([...imageAssets, newAsset]);
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
