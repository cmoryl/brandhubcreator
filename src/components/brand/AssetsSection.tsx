import { useState, useCallback } from 'react';
import { X, Download, Folder, File, Upload, Globe, Expand, ChevronDown, ChevronUp, Tag } from 'lucide-react';
import { BrandAsset, ASSET_CATEGORIES, AssetCategory } from '@/types/brand';
import { Button } from '@/components/ui/button';
import { SectionHeader } from './SectionHeader';
import { useDropZone } from '@/components/ui/drop-zone';
import { WebsiteImageScanner } from './WebsiteImageScanner';
import { PreviewDialog } from '@/components/ui/preview-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

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

interface PendingFile {
  file: File;
  name: string;
  category: AssetCategory;
}

export const AssetsSection = ({ assets, onAssetsChange, customSubtitle, onSubtitleChange, websiteUrl }: AssetsSectionProps) => {
  const canEdit = Boolean(onAssetsChange);
  const [isHeaderEditing, setIsHeaderEditing] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [previewAsset, setPreviewAsset] = useState<BrandAsset | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const [pendingFile, setPendingFile] = useState<PendingFile | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('all');

  const handleImportImages = useCallback((images: { name: string; url: string; type: string }[]) => {
    if (!onAssetsChange) return;
    const newAssets: BrandAsset[] = images.map((img) => ({
      id: crypto.randomUUID(),
      name: img.name,
      type: img.type,
      url: img.url,
      size: 'External',
      category: 'Digital Assets' as AssetCategory,
    }));
    onAssetsChange([...assets, ...newAssets]);
  }, [assets, onAssetsChange]);

  const handleFileDrop = useCallback((file: File) => {
    if (!onAssetsChange) return;
    setPendingFile({
      file,
      name: file.name,
      category: 'Other',
    });
  }, [onAssetsChange]);

  const confirmUpload = useCallback(() => {
    if (!pendingFile || !onAssetsChange) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const url = event.target?.result as string;
      const newAsset: BrandAsset = {
        id: crypto.randomUUID(),
        name: pendingFile.name,
        type: pendingFile.file.type || 'unknown',
        url,
        size: formatFileSize(pendingFile.file.size),
        category: pendingFile.category,
      };
      onAssetsChange([...assets, newAsset]);
      setPendingFile(null);
    };
    reader.readAsDataURL(pendingFile.file);
  }, [pendingFile, assets, onAssetsChange]);

  const { isDragging, fileInputRef, dragHandlers, openFilePicker, handleInputChange: rawHandleInputChange } = useDropZone({
    onFileDrop: handleFileDrop,
    accept: '*',
    maxSize: 50 * 1024 * 1024,
  });

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileDrop(file);
    }
    // Reset the input so the same file can be selected again
    e.target.value = '';
  }, [handleFileDrop]);

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

  // Group by category (using asset.category or falling back to type)
  const filteredAssets = filterCategory === 'all'
    ? (assets || [])
    : (assets || []).filter(a => (a.category || 'Other') === filterCategory);

  const groupedAssets = filteredAssets.reduce((acc, asset) => {
    const category = asset.category || 'Other';
    if (!acc[category]) acc[category] = [];
    acc[category].push(asset);
    return acc;
  }, {} as Record<string, BrandAsset[]>);

  const usedCategories = [...new Set((assets || []).map(a => a.category || 'Other'))];

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

      {/* Category filter */}
      {usedCategories.length > 1 && (
        <div className="flex items-center gap-2 flex-wrap">
          <Tag className="h-4 w-4 text-muted-foreground" />
          <button
            onClick={() => setFilterCategory('all')}
            className={`text-xs px-3 py-1 rounded-full border transition-colors ${
              filterCategory === 'all'
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-secondary text-secondary-foreground border-border hover:border-primary/50'
            }`}
          >
            All ({assets?.length || 0})
          </button>
          {usedCategories.sort().map(cat => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                filterCategory === cat
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-secondary text-secondary-foreground border-border hover:border-primary/50'
              }`}
            >
              {cat} ({(assets || []).filter(a => (a.category || 'Other') === cat).length})
            </button>
          ))}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleInputChange}
        className="hidden"
      />

      {Object.keys(groupedAssets).length > 0 ? (
        <div className="space-y-5">
          {Object.entries(groupedAssets).map(([category, categoryAssets]) => (
            <div key={category} className="space-y-2">
              <div className="flex items-center gap-2">
                <Folder className="h-3.5 w-3.5 text-muted-foreground" />
                <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {category}
                </h3>
                <span className="text-xs text-muted-foreground bg-secondary px-1.5 py-0.5 rounded">
                  {categoryAssets.length}
                </span>
              </div>
              {(() => {
                const INITIAL_ROWS = 2;
                const COLS = 6;
                const initialLimit = INITIAL_ROWS * COLS;
                const isExpanded = expandedCategories[category];
                const visibleAssets = isExpanded ? categoryAssets : categoryAssets.slice(0, initialLimit);
                const hasMore = categoryAssets.length > initialLimit;

                return (
                  <>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2.5">
                      {visibleAssets.map((asset, index) => (
                        <div
                          key={asset.id}
                          className="group relative bg-card rounded-lg border border-border overflow-hidden animate-fade-in"
                          style={{ animationDelay: `${index * 30}ms` }}
                        >
                          <div className="aspect-[4/3] relative overflow-hidden bg-muted/30 flex items-center justify-center">
                            {asset.type?.startsWith('image/') ? (
                              <img src={asset.url} alt={asset.name} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                            ) : (
                              <span className="text-2xl">{getFileIcon(asset.type)}</span>
                            )}
                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                              {asset.type?.startsWith('image/') && (
                                <Button variant="secondary" size="icon" className="h-7 w-7" onClick={() => setPreviewAsset(asset)}>
                                  <Expand className="h-3 w-3" />
                                </Button>
                              )}
                              <Button variant="secondary" size="icon" className="h-7 w-7" onClick={() => downloadAsset(asset)}>
                                <Download className="h-3 w-3" />
                              </Button>
                              {canEdit && (
                                <Button variant="destructive" size="icon" className="h-7 w-7" onClick={() => deleteAsset(asset.id)}>
                                  <X className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                          </div>
                          <div className="p-2 space-y-0.5">
                            <p className="text-xs font-medium truncate" title={asset.name}>{asset.name}</p>
                            <p className="text-[10px] text-muted-foreground">{asset.size} • {asset.type?.split('/')[1]?.toUpperCase() || 'FILE'}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    {hasMore && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full mt-2 gap-2 text-xs h-8"
                        onClick={() => setExpandedCategories(prev => ({ ...prev, [category]: !prev[category] }))}
                      >
                        {isExpanded ? (
                          <>
                            <ChevronUp className="h-3 w-3" />
                            Show Less
                          </>
                        ) : (
                          <>
                            <ChevronDown className="h-3 w-3" />
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
          className={`w-full h-40 border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-3 transition-colors ${
            isDragging 
              ? 'border-primary bg-primary/5 text-primary' 
              : 'border-border text-muted-foreground hover:border-accent hover:text-accent'
          }`}
        >
          <File className="h-8 w-8" />
          <div className="text-center">
            <p className="text-sm font-medium">{isDragging ? 'Drop files to upload' : 'Upload brand assets'}</p>
            <p className="text-xs">ZIP, RAW, PDF, and other heavy files</p>
          </div>
        </button>
      ) : (
        <div className="w-full h-40 border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-3 border-border text-muted-foreground">
          <File className="h-8 w-8" />
          <div className="text-center">
            <p className="text-sm font-medium">No assets uploaded</p>
          </div>
        </div>
      )}

      {/* Upload categorization dialog */}
      <Dialog open={!!pendingFile} onOpenChange={(open) => !open && setPendingFile(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Categorize Asset</DialogTitle>
          </DialogHeader>
          {pendingFile && (
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>File Name</Label>
                <Input
                  value={pendingFile.name}
                  onChange={(e) => setPendingFile(prev => prev ? { ...prev, name: e.target.value } : null)}
                />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select
                  value={pendingFile.category}
                  onValueChange={(val) => setPendingFile(prev => prev ? { ...prev, category: val as AssetCategory } : null)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ASSET_CATEGORIES.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <p className="text-xs text-muted-foreground">
                {formatFileSize(pendingFile.file.size)} • {pendingFile.file.type?.split('/')[1]?.toUpperCase() || 'FILE'}
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingFile(null)}>Cancel</Button>
            <Button onClick={confirmUpload}>Upload</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {canEdit && (
        <WebsiteImageScanner
          open={isScannerOpen}
          onOpenChange={setIsScannerOpen}
          defaultUrl={websiteUrl || ''}
          onImportImages={handleImportImages}
        />
      )}

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
