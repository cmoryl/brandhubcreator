import { useState, useCallback } from 'react';
import { X, Download, Folder, File, Upload } from 'lucide-react';
import { BrandAsset } from '@/types/brand';
import { Button } from '@/components/ui/button';
import { SectionHeader } from './SectionHeader';
import { useDropZone } from '@/components/ui/drop-zone';

interface AssetsSectionProps {
  assets: BrandAsset[];
  onAssetsChange: (assets: BrandAsset[]) => void;
  customSubtitle?: string;
  onSubtitleChange?: (subtitle: string) => void;
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

export const AssetsSection = ({ assets, onAssetsChange, customSubtitle, onSubtitleChange }: AssetsSectionProps) => {
  const [isHeaderEditing, setIsHeaderEditing] = useState(false);

  const handleFileDrop = useCallback((file: File) => {
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
            onSubtitleChange={onSubtitleChange}
            isEditing={isHeaderEditing}
            onEditToggle={() => setIsHeaderEditing(!isHeaderEditing)}
          />
        </div>
        <Button onClick={openFilePicker} size="sm" className="gap-2 shrink-0">
          <Upload className="h-4 w-4" />
          Upload Assets
        </Button>
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
              <div className="bg-card rounded-xl border border-border overflow-hidden divide-y divide-border">
                {categoryAssets.map((asset, index) => (
                  <div
                    key={asset.id}
                    className="group flex items-center justify-between p-4 hover:bg-muted/30 transition-colors animate-fade-in"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <span className="text-2xl">{getFileIcon(asset.type)}</span>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-foreground truncate">{asset.name}</p>
                        <p className="text-xs text-muted-foreground">{asset.size} • {asset.type}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => downloadAsset(asset)}
                        className="gap-2"
                      >
                        <Download className="h-4 w-4" />
                        Download
                      </Button>
                      <button
                        onClick={() => deleteAsset(asset.id)}
                        className="p-2 rounded-md hover:bg-destructive hover:text-destructive-foreground transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
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
      )}
    </section>
  );
};
