import { useState, useCallback, useMemo } from 'react';
import { Globe, Search, Check, Download, Loader2, ImageIcon, X, RefreshCw, Library, FolderOpen } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useSaveToLibrary } from '@/hooks/useSaveToLibrary';

interface ScannedImage {
  url: string;
  filename: string;
  alt: string;
}

interface DestinationOption {
  id: string;
  name: string;
}

interface WebsiteImageScannerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultUrl?: string;
  onImportImages: (
    images: { name: string; url: string; type: string }[],
    targetSectionId?: string,
  ) => void | Promise<void>;
  /** Optional list of destination categories the user can pick from. */
  destinations?: DestinationOption[];
  /** Default destination id (e.g. last-created category). */
  defaultDestinationId?: string;
}

const NEW_FOLDER_VALUE = '__new__';

export const WebsiteImageScanner = ({
  open,
  onOpenChange,
  defaultUrl = '',
  onImportImages,
  destinations = [],
  defaultDestinationId,
}: WebsiteImageScannerProps) => {
  const [url, setUrl] = useState(defaultUrl);
  const [isScanning, setIsScanning] = useState(false);
  const [images, setImages] = useState<ScannedImage[]>([]);
  // Track selection by URL so the set survives filter/sort changes.
  const [selectedUrls, setSelectedUrls] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState('');
  const [hasScanned, setHasScanned] = useState(false);
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());
  const [scanProgress, setScanProgress] = useState('');
  const [isSavingToLibrary, setIsSavingToLibrary] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [destinationId, setDestinationId] = useState<string>(
    defaultDestinationId || destinations[0]?.id || NEW_FOLDER_VALUE
  );
  const { saveMultipleToLibrary } = useSaveToLibrary();

  const handleScan = useCallback(async () => {
    if (!url.trim()) {
      toast.error('Please enter a URL to scan');
      return;
    }

    setIsScanning(true);
    setImages([]);
    setSelectedUrls(new Set());
    setHasScanned(false);
    setFailedImages(new Set());
    setScanProgress('Discovering pages...');

    let scanUrl = url.trim();
    if (!/^https?:\/\//i.test(scanUrl)) {
      scanUrl = `https://${scanUrl}`;
    }

    try {
      const { data, error } = await supabase.functions.invoke('scan-website-images', {
        body: { url: scanUrl, deepCrawl: true },
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Scan failed');

      setImages(data.images || []);
      setHasScanned(true);
      const pageCount = data.pagesScanned || 1;
      toast.success(`Found ${data.images?.length || 0} images across ${pageCount} page${pageCount > 1 ? 's' : ''}`);
    } catch (err: any) {
      console.error('Scan error:', err);
      toast.error(err.message || 'Failed to scan website');
    } finally {
      setIsScanning(false);
      setScanProgress('');
    }
  }, [url]);

  const filteredImages = useMemo(() => {
    if (!filter.trim()) return images;
    const q = filter.toLowerCase();
    return images.filter(
      (img) =>
        img.filename.toLowerCase().includes(q) ||
        img.alt.toLowerCase().includes(q) ||
        img.url.toLowerCase().includes(q)
    );
  }, [images, filter]);

  const toggleSelect = (url: string) => {
    setSelectedUrls((prev) => {
      const next = new Set(prev);
      if (next.has(url)) next.delete(url);
      else next.add(url);
      return next;
    });
  };

  const selectAll = () => {
    const visibleUrls = filteredImages.map((img) => img.url);
    const allSelected = visibleUrls.every((u) => selectedUrls.has(u));
    setSelectedUrls((prev) => {
      const next = new Set(prev);
      if (allSelected) {
        visibleUrls.forEach((u) => next.delete(u));
      } else {
        visibleUrls.forEach((u) => next.add(u));
      }
      return next;
    });
  };

  const handleImport = async () => {
    if (selectedUrls.size === 0) return;
    // Resolve selections back to image objects (URL-stable, filter-safe).
    const byUrl = new Map(images.map((img) => [img.url, img]));
    const selected = Array.from(selectedUrls)
      .map((u, i) => {
        const img = byUrl.get(u);
        if (!img) return null;
        const ext = img.filename.match(/\.(jpg|jpeg|png|gif|webp|svg|avif|bmp)$/i)?.[1] || 'png';
        return {
          name: img.alt || img.filename || `image-${i}`,
          url: img.url,
          type: `image/${ext === 'jpg' ? 'jpeg' : ext}`,
        };
      })
      .filter((x): x is { name: string; url: string; type: string } => x !== null);

    if (selected.length === 0) {
      toast.error('No valid images selected');
      return;
    }

    setIsImporting(true);
    try {
      const targetId =
        destinationId && destinationId !== NEW_FOLDER_VALUE ? destinationId : undefined;
      await Promise.resolve(onImportImages(selected, targetId));
      const destLabel = targetId
        ? destinations.find((d) => d.id === targetId)?.name || 'selected category'
        : '"Website Imports" category';
      toast.success(
        `Imported ${selected.length} image${selected.length === 1 ? '' : 's'} → ${destLabel}`
      );
      onOpenChange(false);
    } catch (err) {
      console.error('Website import error:', err);
      toast.error('Failed to import selected images');
    } finally {
      setIsImporting(false);
    }
  };

  const handleSaveToLibrary = useCallback(async () => {
    if (selectedUrls.size === 0) return;
    setIsSavingToLibrary(true);
    try {
      const byUrl = new Map(images.map((img) => [img.url, img]));
      const imagesToSave = Array.from(selectedUrls)
        .map((u, i) => {
          const img = byUrl.get(u);
          if (!img) return null;
          return {
            source: img.url,
            name: img.alt || img.filename || `website-image-${i}`,
          };
        })
        .filter((x): x is { source: string; name: string } => x !== null);

      const results = await saveMultipleToLibrary(imagesToSave, 'General');
      if (results.length > 0) {
        toast.success(`Saved ${results.length} images to Image Library`);
      } else {
        toast.error('Failed to save images to library');
      }
    } catch (err) {
      console.error('Save to library error:', err);
      toast.error('Failed to save images to library');
    } finally {
      setIsSavingToLibrary(false);
    }
  }, [selectedUrls, images, saveMultipleToLibrary]);

  const handleImageError = (url: string) => {
    setFailedImages((prev) => new Set(prev).add(url));
  };

  const allVisibleSelected =
    filteredImages.length > 0 && filteredImages.every((img) => selectedUrls.has(img.url));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl h-[90vh] p-0 flex flex-col overflow-hidden bg-background border-border">
        <DialogHeader className="p-4 pb-0 shrink-0">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Globe className="h-5 w-5 text-primary" />
            Website Image Scanner
          </DialogTitle>
        </DialogHeader>

        {/* URL Input */}
        <div className="px-4 pb-3 space-y-3 shrink-0">
          <div className="flex gap-2">
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://www.example.com"
              className="flex-1"
              onKeyDown={(e) => e.key === 'Enter' && handleScan()}
            />
            <Button onClick={handleScan} disabled={isScanning} className="gap-2 shrink-0">
              {isScanning ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              {isScanning ? 'Scanning...' : 'Deep Scan'}
            </Button>
          </div>

          {/* Filter + Actions Bar */}
          {hasScanned && images.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  placeholder="Filter images..."
                  className="pl-8 h-8 text-sm"
                />
              </div>
              <Button variant="outline" size="sm" onClick={selectAll} className="gap-1.5 text-xs">
                <Check className="h-3.5 w-3.5" />
                {allVisibleSelected ? 'Deselect All' : 'Select All'}
              </Button>
              <Button variant="outline" size="sm" onClick={handleScan} className="gap-1.5 text-xs">
                <RefreshCw className="h-3.5 w-3.5" />
                Rescan
              </Button>
              <span className="text-xs text-muted-foreground ml-auto">
                {filteredImages.length} images • {selectedUrls.size} selected
              </span>
            </div>
          )}
        </div>

        {/* Image Grid */}
        <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-4">
          {isScanning && (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <p className="font-medium">Deep scanning website for images...</p>
              <p className="text-sm">{scanProgress || 'Crawling pages and extracting imagery'}</p>
            </div>
          )}

          {!isScanning && hasScanned && filteredImages.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
              <ImageIcon className="h-10 w-10" />
              <p className="font-medium">
                {filter ? 'No images match your filter' : 'No images found on this site'}
              </p>
              <p className="text-sm">Try a different URL or check the website is accessible</p>
            </div>
          )}

          {!isScanning && !hasScanned && (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
              <Globe className="h-10 w-10" />
              <p className="font-medium">Enter a website URL to discover images</p>
              <p className="text-sm">Deep scan crawls all linked pages to find every image</p>
            </div>
          )}

          {!isScanning && filteredImages.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {filteredImages.map((img, index) => {
                const isSelected = selectedUrls.has(img.url);
                const isFailed = failedImages.has(img.url);

                return (
                  <button
                    key={`${img.url}-${index}`}
                    onClick={() => toggleSelect(img.url)}
                    className={cn(
                      'group relative rounded-lg border-2 overflow-hidden transition-all duration-150 text-left',
                      'hover:shadow-md hover:scale-[1.02]',
                      isSelected
                        ? 'border-primary ring-2 ring-primary/20'
                        : 'border-border hover:border-accent'
                    )}
                  >
                    <div
                      className={cn(
                        'absolute top-1.5 left-1.5 z-10 rounded-sm transition-all',
                        isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                      )}
                    >
                      <Checkbox checked={isSelected} className="h-4 w-4 bg-background/80 backdrop-blur-sm" />
                    </div>

                    <div className="aspect-square bg-muted/50 flex items-center justify-center overflow-hidden">
                      {isFailed ? (
                        <div className="flex flex-col items-center gap-1 text-muted-foreground p-2">
                          <X className="h-5 w-5" />
                          <span className="text-[10px] text-center">Failed to load</span>
                        </div>
                      ) : (
                        <img
                          src={img.url}
                          alt={img.alt || img.filename}
                          className="w-full h-full object-cover"
                          loading="lazy"
                          onError={() => handleImageError(img.url)}
                        />
                      )}
                    </div>

                    <div className="p-1.5">
                      <p className="text-[10px] text-muted-foreground truncate" title={img.alt || img.filename}>
                        {img.alt || img.filename}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer with Destination Picker */}
        {hasScanned && images.length > 0 && (
          <div className="border-t border-border p-3 flex items-center justify-between bg-muted/30 shrink-0 flex-wrap gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <FolderOpen className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-xs text-muted-foreground shrink-0">Import to:</span>
              <Select value={destinationId} onValueChange={setDestinationId}>
                <SelectTrigger className="h-8 w-[220px] text-sm">
                  <SelectValue placeholder="Choose category" />
                </SelectTrigger>
                <SelectContent>
                  {destinations.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.name}
                    </SelectItem>
                  ))}
                  <SelectItem value={NEW_FOLDER_VALUE}>+ New "Website Imports" category</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={handleSaveToLibrary}
                disabled={selectedUrls.size === 0 || isSavingToLibrary}
                className="gap-2"
              >
                {isSavingToLibrary ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Library className="h-4 w-4" />
                )}
                {isSavingToLibrary ? 'Saving...' : 'Save to Library'}
              </Button>
              <Button
                onClick={handleImport}
                disabled={selectedUrls.size === 0 || isImporting}
                className="gap-2"
              >
                {isImporting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                {isImporting
                  ? 'Importing...'
                  : `Import ${selectedUrls.size > 0 ? `${selectedUrls.size} Image${selectedUrls.size === 1 ? '' : 's'}` : 'Selected'}`}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
