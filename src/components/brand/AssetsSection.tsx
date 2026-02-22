import { useState, useCallback } from 'react';
import { X, Download, Folder, File, Upload, Globe, Expand, ChevronDown, ChevronUp, Tag, GripVertical, Loader2 } from 'lucide-react';
import { PdfThumbnailCard } from './PdfThumbnailCard';
import { BrandAsset, ASSET_CATEGORIES, AssetCategory, PRINT_SIGNAGE_TYPES } from '@/types/brand';
import { Button } from '@/components/ui/button';
import { SectionHeader } from './SectionHeader';
import { useDropZone } from '@/components/ui/drop-zone';
import { WebsiteImageScanner } from './WebsiteImageScanner';
import { PreviewDialog } from '@/components/ui/preview-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, rectSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useStorageUpload } from '@/hooks/useStorageUpload';

interface AssetsSectionProps {
  assets: BrandAsset[];
  onAssetsChange?: (assets: BrandAsset[]) => void;
  customSubtitle?: string;
  onSubtitleChange?: (subtitle: string) => void;
  websiteUrl?: string;
  entityId?: string;
  entityType?: 'brand' | 'product' | 'event';
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

const PRINT_CATEGORIES = ['Print Materials', 'Signage & Banners'] as const;

interface PendingFile {
  file: File;
  name: string;
  category: AssetCategory;
  printType?: string;
  dimensions?: string;
}

// Sortable asset card component
const SortableAssetCard = ({ asset, canEdit, onPreview, onDownload, onDelete }: {
  asset: BrandAsset;
  canEdit: boolean;
  onPreview: (asset: BrandAsset) => void;
  onDownload: (asset: BrandAsset) => void;
  onDelete: (id: string) => void;
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: asset.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group relative bg-card rounded-lg border border-border overflow-hidden"
    >
      {canEdit && (
        <button
          {...attributes}
          {...listeners}
          className="absolute top-1 right-1 z-10 h-6 w-6 flex items-center justify-center rounded bg-background/80 border border-border text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
        >
          <GripVertical className="h-3 w-3" />
        </button>
      )}
      <div className="aspect-[4/3] relative overflow-hidden bg-muted/30 flex items-center justify-center">
        {asset.type?.startsWith('image/') ? (
          <img src={asset.url} alt={asset.name} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
        ) : asset.type === 'application/pdf' && asset.thumbnailUrl ? (
          <>
            <img src={asset.thumbnailUrl} alt={asset.name} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
            <span className="absolute top-1 left-1 text-[8px] font-bold bg-destructive text-destructive-foreground px-1.5 py-0.5 rounded">PDF</span>
          </>
      ) : asset.type === 'application/pdf' ? (
          <div className="absolute inset-0">
            <PdfThumbnailCard url={asset.url} name={asset.name} />
          </div>
        ) : (
          <span className="text-2xl">{getFileIcon(asset.type)}</span>
        )}
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          {(asset.type?.startsWith('image/') || asset.type === 'application/pdf') && (
            <Button variant="secondary" size="icon" className="h-7 w-7" onClick={() => onPreview(asset)}>
              <Expand className="h-3 w-3" />
            </Button>
          )}
          <Button variant="secondary" size="icon" className="h-7 w-7" onClick={() => onDownload(asset)}>
            <Download className="h-3 w-3" />
          </Button>
          {canEdit && (
            <Button variant="destructive" size="icon" className="h-7 w-7" onClick={() => onDelete(asset.id)}>
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>
      <div className="p-2 space-y-0.5">
        <p className="text-xs font-medium truncate" title={asset.name}>{asset.name}</p>
        <p className="text-[10px] text-muted-foreground">{asset.size} • {asset.type?.split('/')[1]?.toUpperCase() || 'FILE'}</p>
        {asset.printType && (
          <p className="text-[10px] text-primary/70 font-medium truncate">
            {PRINT_SIGNAGE_TYPES.find(t => t.value === asset.printType)?.label || asset.printType}
            {asset.dimensions ? ` · ${asset.dimensions}` : ''}
          </p>
        )}
      </div>
    </div>
  );
};

export const AssetsSection = ({ assets, onAssetsChange, customSubtitle, onSubtitleChange, websiteUrl, entityId, entityType = 'brand' }: AssetsSectionProps) => {
  const canEdit = Boolean(onAssetsChange);
  const [isHeaderEditing, setIsHeaderEditing] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [previewAsset, setPreviewAsset] = useState<BrandAsset | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const [pendingFile, setPendingFile] = useState<PendingFile | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [isConfirming, setIsConfirming] = useState(false);

  const { uploadFile, isUploading } = useStorageUpload({ entityType, entityId });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

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

  const generatePdfThumbnailFromFile = useCallback(async (file: File): Promise<Blob | undefined> => {
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const pdfjsLib = await import('pdfjs-dist');
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
      const pdf = await pdfjsLib.getDocument(dataUrl).promise;
      const page = await pdf.getPage(1);
      const viewport = page.getViewport({ scale: 1.5 });
      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return undefined;
      await page.render({ canvasContext: ctx, viewport }).promise;
      return await new Promise<Blob | undefined>((resolve) =>
        canvas.toBlob((b) => resolve(b ?? undefined), 'image/jpeg', 0.7)
      );
    } catch (err) {
      console.warn('PDF thumbnail generation failed:', err);
      return undefined;
    }
  }, []);

  const confirmUpload = useCallback(async () => {
    if (!pendingFile || !onAssetsChange) return;
    setIsConfirming(true);
    try {
      const assetId = crypto.randomUUID();
      const sizeLabel = formatFileSize(pendingFile.file.size);
      const fileType = pendingFile.file.type || 'unknown';

      let fileUrl: string;
      let thumbnailUrl: string | undefined;

      if (entityId) {
        // Upload main file to cloud storage
        const uploaded = await uploadFile(pendingFile.file, 'asset', `vault-${assetId}`);
        if (!uploaded) { setIsConfirming(false); return; }
        fileUrl = uploaded.url;

        // For PDFs, generate thumbnail and upload it too
        if (fileType === 'application/pdf') {
          const thumbBlob = await generatePdfThumbnailFromFile(pendingFile.file);
          if (thumbBlob) {
            const thumbFile = Object.assign(thumbBlob, { name: `thumb-${assetId}.jpg`, lastModified: Date.now() }) as unknown as File;
            const thumbUploaded = await uploadFile(thumbFile, 'asset', `vault-thumb-${assetId}`);
            if (thumbUploaded) thumbnailUrl = thumbUploaded.url;
          }
        }
      } else {
        // Fallback: use base64 for unsaved entities (rare edge case)
        fileUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.readAsDataURL(pendingFile.file);
        });
      }

      const newAsset: BrandAsset = {
        id: assetId,
        name: pendingFile.name,
        type: fileType,
        url: fileUrl,
        size: sizeLabel,
        category: pendingFile.category,
        thumbnailUrl,
        printType: pendingFile.printType,
        dimensions: pendingFile.dimensions,
      };
      onAssetsChange([...assets, newAsset]);
      setPendingFile(null);
    } finally {
      setIsConfirming(false);
    }
  }, [pendingFile, assets, onAssetsChange, entityId, uploadFile, generatePdfThumbnailFromFile]);

  const { isDragging, fileInputRef, dragHandlers, openFilePicker, handleInputChange } = useDropZone({
    onFileDrop: handleFileDrop,
    accept: '*',
    maxSize: 50 * 1024 * 1024,
  });

  const deleteAsset = (id: string) => {
    if (!onAssetsChange) return;
    onAssetsChange(assets.filter(a => a.id !== id));
  };

  const downloadAsset = async (asset: BrandAsset) => {
    try {
      const response = await fetch(asset.url);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = asset.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch {
      // Fallback: open in new tab if fetch fails
      window.open(asset.url, '_blank');
    }
  };

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !onAssetsChange) return;

    const oldIndex = assets.findIndex(a => a.id === active.id);
    const newIndex = assets.findIndex(a => a.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    onAssetsChange(arrayMove(assets, oldIndex, newIndex));
  }, [assets, onAssetsChange]);

  // Group by category
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
        onChange={handleInputChange}
        className="hidden"
      />

      {Object.keys(groupedAssets).length > 0 ? (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
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
                      <SortableContext items={visibleAssets.map(a => a.id)} strategy={rectSortingStrategy}>
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2.5">
                          {visibleAssets.map((asset) => (
                            <SortableAssetCard
                              key={asset.id}
                              asset={asset}
                              canEdit={canEdit}
                              onPreview={setPreviewAsset}
                              onDownload={downloadAsset}
                              onDelete={deleteAsset}
                            />
                          ))}
                        </div>
                      </SortableContext>
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
        </DndContext>
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
                  onValueChange={(val) => setPendingFile(prev => prev ? { ...prev, category: val as AssetCategory, printType: undefined } : null)}
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

              {/* Sub-type picker for print & signage categories */}
              {PRINT_CATEGORIES.includes(pendingFile.category as typeof PRINT_CATEGORIES[number]) && (
                <>
                  <div className="space-y-2">
                    <Label>Material / Signage Type</Label>
                    <Select
                      value={pendingFile.printType || ''}
                      onValueChange={(val) => setPendingFile(prev => prev ? { ...prev, printType: val } : null)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type…" />
                      </SelectTrigger>
                      <SelectContent>
                        {PRINT_SIGNAGE_TYPES.map(t => (
                          <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Dimensions <span className="text-muted-foreground font-normal">(optional)</span></Label>
                    <Input
                      value={pendingFile.dimensions || ''}
                      onChange={(e) => setPendingFile(prev => prev ? { ...prev, dimensions: e.target.value } : null)}
                      placeholder="e.g. 10ft × 8ft, A3, 24×36in"
                    />
                  </div>
                </>
              )}
              <p className="text-xs text-muted-foreground">
                {formatFileSize(pendingFile.file.size)} • {pendingFile.file.type?.split('/')[1]?.toUpperCase() || 'FILE'}
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingFile(null)} disabled={isConfirming || isUploading}>Cancel</Button>
            <Button onClick={confirmUpload} disabled={isConfirming || isUploading} className="gap-2">
              {(isConfirming || isUploading) && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {(isConfirming || isUploading) ? 'Uploading…' : 'Upload'}
            </Button>
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
        title={previewAsset?.name || 'Preview'}
        previewUrl={previewAsset?.url}
        type={previewAsset?.type === 'application/pdf' ? 'iframe' : 'image'}
        aspectRatio="auto"
      />
    </section>
  );
};
