import { useState, useRef } from 'react';
import { Plus, X, Upload, File, Download, Folder } from 'lucide-react';
import { BrandAsset } from '@/types/brand';
import { Button } from '@/components/ui/button';

interface AssetsSectionProps {
  assets: BrandAsset[];
  onAssetsChange: (assets: BrandAsset[]) => void;
}

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

const getFileIcon = (type: string) => {
  if (type.includes('zip') || type.includes('rar')) return '📦';
  if (type.includes('pdf')) return '📄';
  if (type.includes('image')) return '🖼️';
  if (type.includes('video')) return '🎬';
  if (type.includes('audio')) return '🎵';
  return '📁';
};

export const AssetsSection = ({ assets, onAssetsChange }: AssetsSectionProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
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
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const deleteAsset = (id: string) => {
    onAssetsChange(assets.filter(a => a.id !== id));
  };

  const downloadAsset = (asset: BrandAsset) => {
    const link = document.createElement('a');
    link.href = asset.url;
    link.download = asset.name;
    link.click();
  };

  // Group by type
  const groupedAssets = assets.reduce((acc, asset) => {
    const category = asset.type.split('/')[0] || 'other';
    if (!acc[category]) acc[category] = [];
    acc[category].push(asset);
    return acc;
  }, {} as Record<string, BrandAsset[]>);

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-serif font-semibold text-foreground">Operational Vault</h2>
          <p className="text-muted-foreground mt-1">Direct storage for heavy assets - ZIP, RAW, High-Res</p>
        </div>
        <Button onClick={() => fileInputRef.current?.click()} size="sm" className="gap-2">
          <Upload className="h-4 w-4" />
          Upload Assets
        </Button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFileUpload}
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
          onClick={() => fileInputRef.current?.click()}
          className="w-full h-48 border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center gap-3 text-muted-foreground hover:border-accent hover:text-accent transition-colors"
        >
          <File className="h-10 w-10" />
          <div className="text-center">
            <p className="font-medium">Upload brand assets</p>
            <p className="text-sm">ZIP, RAW, PDF, and other heavy files</p>
          </div>
        </button>
      )}
    </section>
  );
};
