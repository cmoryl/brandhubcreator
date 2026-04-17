import { useState, useCallback } from 'react';
import { Globe, Search, Check, Download, Loader2, ImageIcon, X, RefreshCw, Library } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useSaveToLibrary } from '@/hooks/useSaveToLibrary';

interface ScannedImage {
  url: string;
  filename: string;
  alt: string;
}

interface WebsiteImageScannerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultUrl?: string;
  onImportImages: (images: { name: string; url: string; type: string }[]) => void | Promise<void>;
}

export const WebsiteImageScanner = ({
  open,
  onOpenChange,
  defaultUrl = '',
  onImportImages,
}: WebsiteImageScannerProps) => {
  const [url, setUrl] = useState(defaultUrl);
  const [isScanning, setIsScanning] = useState(false);
  const [images, setImages] = useState<ScannedImage[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [filter, setFilter] = useState('');
  const [hasScanned, setHasScanned] = useState(false);
  const [failedImages, setFailedImages] = useState<Set<number>>(new Set());
  const [scanProgress, setScanProgress] = useState('');
  const [isSavingToLibrary, setIsSavingToLibrary] = useState(false);
  const { saveMultipleToLibrary } = useSaveToLibrary();

  const handleScan = useCallback(async () => {
    if (!url.trim()) {
      toast.error('Please enter a URL to scan');
      return;
    }

    setIsScanning(true);
    setImages([]);
    setSelectedIds(new Set());
    setHasScanned(false);
    setFailedImages(new Set());
    setScanProgress('Discovering pages...');

    // Ensure the URL has a protocol prefix
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

  const toggleSelect = (index: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const selectAll = () => {
    const visible = filteredImages.map((_, i) => i);
    if (selectedIds.size === visible.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(visible));
    }
  };

  const handleImport = async () => {
    const selected = Array.from(selectedIds).map((i) => {
      const img = filteredImages[i];
      const ext = img.filename.match(/\.(jpg|jpeg|png|gif|webp|svg|avif|bmp)$/i)?.[1] || 'png';
      return {
        name: img.alt || img.filename || `image-${i}`,
        url: img.url,
        type: `image/${ext === 'jpg' ? 'jpeg' : ext}`,
      };
    });

    try {
      await Promise.resolve(onImportImages(selected));
      toast.success(`Imported ${selected.length} images`);
      onOpenChange(false);
    } catch (err) {
      console.error('Website import error:', err);
      toast.error('Failed to import selected images');
    }
  };

  const filteredImages = images.filter((img) => {
    if (!filter.trim()) return true;
    const q = filter.toLowerCase();
    return (
      img.filename.toLowerCase().includes(q) ||
      img.alt.toLowerCase().includes(q) ||
      img.url.toLowerCase().includes(q)
    );
  });

  const handleSaveToLibrary = useCallback(async () => {
    if (selectedIds.size === 0) return;
    setIsSavingToLibrary(true);
    try {
      const imagesToSave = Array.from(selectedIds).map((i) => {
        const img = filteredImages[i];
        return {
          source: img.url,
          name: img.alt || img.filename || `website-image-${i}`,
        };
      });

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
  }, [selectedIds, filteredImages, saveMultipleToLibrary]);

  const handleImageError = (index: number) => {
    setFailedImages((prev) => new Set(prev).add(index));
  };

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
                {selectedIds.size === filteredImages.length ? 'Deselect All' : 'Select All'}
              </Button>
              <Button variant="outline" size="sm" onClick={handleScan} className="gap-1.5 text-xs">
                <RefreshCw className="h-3.5 w-3.5" />
                Rescan
              </Button>
              <span className="text-xs text-muted-foreground ml-auto">
                {filteredImages.length} images • {selectedIds.size} selected
              </span>
            </div>
          )}
        </div>

        {/* Image Grid — native overflow scroll instead of ScrollArea */}
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
                const isSelected = selectedIds.has(index);
                const isFailed = failedImages.has(index);

                return (
                  <button
                    key={`${img.url}-${index}`}
                    onClick={() => toggleSelect(index)}
                    className={cn(
                      'group relative rounded-lg border-2 overflow-hidden transition-all duration-150 text-left',
                      'hover:shadow-md hover:scale-[1.02]',
                      isSelected
                        ? 'border-primary ring-2 ring-primary/20'
                        : 'border-border hover:border-accent'
                    )}
                  >
                    {/* Selection Indicator */}
                    <div
                      className={cn(
                        'absolute top-1.5 left-1.5 z-10 rounded-sm transition-all',
                        isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                      )}
                    >
                      <Checkbox checked={isSelected} className="h-4 w-4 bg-background/80 backdrop-blur-sm" />
                    </div>

                    {/* Image */}
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
                          onError={() => handleImageError(index)}
                        />
                      )}
                    </div>

                    {/* Label */}
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

        {/* Footer */}
        {hasScanned && images.length > 0 && (
          <div className="border-t border-border p-3 flex items-center justify-between bg-muted/30 shrink-0">
            <p className="text-xs text-muted-foreground">
              Select images to import or save to library
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={handleSaveToLibrary}
                disabled={selectedIds.size === 0 || isSavingToLibrary}
                className="gap-2"
              >
                {isSavingToLibrary ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Library className="h-4 w-4" />
                )}
                {isSavingToLibrary ? 'Saving...' : `Save to Library`}
              </Button>
              <Button
                onClick={handleImport}
                disabled={selectedIds.size === 0}
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                Import {selectedIds.size > 0 ? `${selectedIds.size} Images` : 'Selected'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
