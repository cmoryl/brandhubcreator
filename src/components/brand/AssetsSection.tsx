import { useState, useCallback } from 'react';
import { X, Download, Folder, File, Upload, Globe, Expand, ChevronDown, ChevronUp } from 'lucide-react';
import { BrandAsset } from '@/types/brand';
import { Button } from '@/components/ui/button';
import { SectionHeader } from './SectionHeader';
import { useDropZone } from '@/components/ui/drop-zone';
import { WebsiteImageScanner } from './WebsiteImageScanner';
import { PreviewDialog } from '@/components/ui/preview-dialog';

interface AssetsSectionProps {
  assets: BrandAsset[];
  onAssetsChange?: (assets: BrandAsset[]) => void;
  customSubtitle?: string;
  onSubtitleChange?: (subtitle: string) => void;
  websiteUrl?: string;
}

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

const getFileIcon = (type?: string) => {
  if (!type) return '📁';
  if (type.includes('zip') || type.includes('rar')) return '📦';
  if (type.includes('pdf')) return '📄';
  if (type.includes('image')) return '🖼️';
  if (type.includes('video')) return '🎬';
  if (type.includes('audio')) return '🎵';
  return '📁';
};

export const AssetsSection = ({ assets, onAssetsChange, customSubtitle, onSubtitleChange, websiteUrl }: AssetsSectionProps) => {
  const canEdit = Boolean(onAssetsChange);
  const [isHeaderEditing, setIsHeaderEditing] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [previewAsset, setPreviewAsset] = useState<BrandAsset | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

  const handleImportImages = useCallback((images: { name: string; url: string; type: string }[]) => {
    if (!onAssetsChange) return;
    const newAssets: BrandAsset[] = images.map((img) => ({
      id: crypto.randomUUID(),
      name: img.name,
      type: img.type,
      url: img.url,
      size: 'External',
    }));
    onAssetsChange([...assets, ...newAssets]);
  }, [assets, onAssetsChange]);
  const handleFileDrop = useCallback((file: File) => {
    if (!onAssetsChange) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const url = event.target?.result as string;
      const newAsset: BrandAsset = {
        id: crypto.randomUUID(),
        name: file.name,
        type: file.type || 'unknown',
        url,
        size: formatFileSize(file.size),
      };
      onAssetsChange([...assets, newAsset]);
    };
    reader.readAsDataURL(file);
  }, [assets, onAssetsChange]);

  const { isDragging, fileInputRef, dragHandlers, openFilePicker, handleInputChange } = useDropZone({
    onFileDrop: handleFileDrop,
    accept: '*',
    maxSize: 50 * 1024 * 1024, // 50MB for assets
  });

  const deleteAsset = (id: string) => {
    if (!onAssetsChange) return;
    onAssetsChange(assets.filter(a => a.id !== id));
  };

  const downloadAsset = (asset: BrandAsset) => {
    const link = document.createElement('a');
    link.href = asset.url;
    link.download = asset.name;
    link.click();
  };

  // Group by type (with null-safe check)
  const groupedAssets = (assets || []).reduce((acc, asset) => {
    const assetType = asset?.type || 'unknown';
    const category = assetType.split('/')[0] || 'other';
    if (!acc[category]) acc[category] = [];
    acc[category].push(asset);
    return acc;
  }, {} as Record<string, BrandAsset[]>);

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1">
          <SectionHeader
            title="Operational Vault"
            defaultSubtitle="Direct storage for heavy assets - ZIP, RAW, High-Res"
            customSubtitle={customSubtitle}
            onSubtitleChange={canEdit ? onSubtitleChange : undefined}
            isEditing={isHeaderEditing}
            onEditToggle={() => setIsHeaderEditing(!isHeaderEditing)}
          />
        </div>
        {canEdit && (
          <div className="flex items-center gap-2 shrink-0">
            <Button onClick={() => setIsScannerOpen(true)} variant="outline" size="sm" className="gap-2">
              <Globe className="h-4 w-4" />
              Scan Website
            </Button>
            <Button onClick={openFilePicker} size="sm" className="gap-2">
              <Upload className="h-4 w-4" />
              Upload Assets
            </Button>
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleInputChange}
        className="hidden"
      />

      {Object.keys(groupedAssets).length > 0 ? (
        <div className="space-y-6">
          {Object.entries(groupedAssets).map(([category, categoryAssets]) => (
            <div key={category} className="space-y-3">
              <div className="flex items-center gap-2">
                <Folder className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide capitalize">
                  {category}
                </h3>
                <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded">
                  {categoryAssets.length} files
                </span>
              </div>
              {(() => {
                const INITIAL_ROWS = 2;
                const COLS = 5; // lg:grid-cols-5
                const initialLimit = INITIAL_ROWS * COLS;
                const isExpanded = expandedCategories[category];
                const visibleAssets = isExpanded ? categoryAssets : categoryAssets.slice(0, initialLimit);
                const hasMore = categoryAssets.length > initialLimit;

                return (
                  <>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                      {visibleAssets.map((asset, index) => (
                        <div
                          key={asset.id}
                          className="group relative bg-card rounded-xl border border-border overflow-hidden animate-fade-in"
                          style={{ animationDelay: `${index * 50}ms` }}
                        >
                          <div className="aspect-square relative overflow-hidden bg-muted/30 flex items-center justify-center">
                            {asset.type?.startsWith('image/') ? (
                              <img src={asset.url} alt={asset.name} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                            ) : (
                              <span className="text-4xl">{getFileIcon(asset.type)}</span>
                            )}
                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                              {asset.type?.startsWith('image/') && (
                                <Button variant="secondary" size="icon" className="h-9 w-9" onClick={() => setPreviewAsset(asset)}>
                                  <Expand className="h-4 w-4" />
                                </Button>
                              )}
                              <Button variant="secondary" size="icon" className="h-9 w-9" onClick={() => downloadAsset(asset)}>
                                <Download className="h-4 w-4" />
                              </Button>
                              {canEdit && (
                                <Button variant="destructive" size="icon" className="h-9 w-9" onClick={() => deleteAsset(asset.id)}>
                                  <X className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                          <div className="p-3 space-y-1">
                            <p className="text-sm font-medium truncate" title={asset.name}>{asset.name}</p>
                            <p className="text-xs text-muted-foreground">{asset.size} • {asset.type?.split('/')[1]?.toUpperCase() || 'FILE'}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    {hasMore && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full mt-3 gap-2"
                        onClick={() => setExpandedCategories(prev => ({ ...prev, [category]: !prev[category] }))}
                      >
                        {isExpanded ? (
                          <>
                            <ChevronUp className="h-4 w-4" />
                            Show Less
                          </>
                        ) : (
                          <>
                            <ChevronDown className="h-4 w-4" />
                            View More ({categoryAssets.length - initialLimit} more)
                          </>
                        )}
                      </Button>
                    )}
                  </>
                );
              })()}
            </div>
          ))}
        </div>
      ) : canEdit ? (
        <button
          onClick={openFilePicker}
          onDragOver={dragHandlers.onDragOver}
          onDragLeave={dragHandlers.onDragLeave}
          onDrop={dragHandlers.onDrop}
          className={`w-full h-48 border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-3 transition-colors ${
            isDragging 
              ? 'border-primary bg-primary/5 text-primary' 
              : 'border-border text-muted-foreground hover:border-accent hover:text-accent'
          }`}
        >
          <File className="h-10 w-10" />
          <div className="text-center">
            <p className="font-medium">{isDragging ? 'Drop files to upload' : 'Upload brand assets'}</p>
            <p className="text-sm">ZIP, RAW, PDF, and other heavy files</p>
          </div>
        </button>
      ) : (
        <div className="w-full h-48 border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-3 border-border text-muted-foreground">
          <File className="h-10 w-10" />
          <div className="text-center">
            <p className="font-medium">No assets uploaded</p>
          </div>
        </div>
      )}

      {canEdit && (
        <WebsiteImageScanner
          open={isScannerOpen}
          onOpenChange={setIsScannerOpen}
          defaultUrl={websiteUrl || ''}
          onImportImages={handleImportImages}
        />
      )}

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
