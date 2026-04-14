import { useState, useCallback } from 'react';
import { X, ExternalLink, ZoomIn, ZoomOut, RotateCcw, Download, Loader2, Image as ImageIcon } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ImageryPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  image: {
    id: string;
    url: string;
    thumbnailUrl?: string;
    title: string;
    source?: string;
    category?: string;
  } | null;
  canDownload?: boolean;
}

export const ImageryPreviewDialog = ({
  open,
  onOpenChange,
  image,
  canDownload = false,
}: ImageryPreviewDialogProps) => {
  const [zoom, setZoom] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.25, 0.5));
  const handleReset = () => setZoom(1);

  const shutterstockUrl = image?.source === 'shutterstock' && image?.id
    ? `https://www.shutterstock.com/image-photo/${image.id}`
    : null;

  const isDropbox = image?.source === 'dropbox';

  const handleDownload = useCallback(async () => {
    if (!image?.id) return;
    setDownloading(true);
    try {
      if (isDropbox) {
        // For Dropbox images, the URL is already a temporary download link
        window.open(image.url, '_blank');
        toast.success('Opening Dropbox download');
      } else {
        // Shutterstock licensing flow
        const { data, error } = await supabase.functions.invoke('shutterstock-search', {
          body: { action: 'download', imageId: image.id },
        });

        if (error) throw error;
        if (data?.error) throw new Error(data.error);

        if (data?.requiresUpgrade) {
          window.open(data.shutterstockUrl, '_blank');
          toast.info(data.message || 'Opening image on Shutterstock for manual download');
        } else if (data?.downloadUrl) {
          window.open(data.downloadUrl, '_blank');
          toast.success(data.alreadyLicensed ? 'Re-downloading licensed image' : 'Image licensed & downloading');
        }
      }
    } catch (err: any) {
      console.error('Download error:', err);
      toast.error(err.message || 'Failed to download image');
    } finally {
      setDownloading(false);
    }
  }, [image, isDropbox]);

  if (!image) return null;

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) { setZoom(1); setIsLoading(true); } onOpenChange(o); }}>
      <DialogContent className="max-w-5xl max-h-[90vh] p-0 overflow-hidden bg-background border-border gap-0">
        {/* Header */}
        <DialogHeader className="px-5 py-4 border-b border-border">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-base font-semibold leading-snug line-clamp-2 pr-8">
                {image.title}
              </DialogTitle>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                {image.source === 'shutterstock' && (
                  <Badge variant="secondary" className="text-[10px] font-medium">Shutterstock</Badge>
                )}
                {image.source === 'dropbox' && (
                  <Badge variant="secondary" className="text-[10px] font-medium">Dropbox</Badge>
                )}
                {image.category && (
                  <Badge variant="outline" className="text-[10px]">{image.category}</Badge>
                )}
                <span className="text-[11px] text-muted-foreground">ID: {image.id}</span>
              </div>
            </div>
          </div>
        </DialogHeader>

        {/* Image area */}
        <div className="relative flex-1 bg-muted/30 overflow-auto min-h-[400px] max-h-[60vh] flex items-center justify-center p-6">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-muted/50 z-10">
              <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
            </div>
          )}
          <img
            src={image.url}
            alt={image.title}
            className={cn(
              "object-contain transition-transform duration-200 rounded-lg shadow-lg",
              zoom === 1 ? "max-w-full max-h-[55vh]" : "",
            )}
            style={{ transform: `scale(${zoom})`, transformOrigin: 'center center' }}
            onLoad={() => setIsLoading(false)}
            onError={() => setIsLoading(false)}
          />
        </div>

        {/* Footer toolbar */}
        <div className="px-5 py-3 border-t border-border flex items-center justify-between gap-3 flex-wrap">
          {/* Zoom controls */}
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleZoomOut} disabled={zoom <= 0.5}>
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-xs text-muted-foreground min-w-[40px] text-center font-medium">
              {Math.round(zoom * 100)}%
            </span>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleZoomIn} disabled={zoom >= 3}>
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleReset} title="Reset zoom">
              <RotateCcw className="h-3.5 w-3.5" />
            </Button>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {shutterstockUrl && (
              <Button variant="outline" size="sm" asChild>
                <a href={shutterstockUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                  View on Shutterstock
                </a>
              </Button>
            )}
            {canDownload && (image.source === 'shutterstock' || image.source === 'dropbox') && (
              <Button size="sm" onClick={handleDownload} disabled={downloading}>
                {downloading ? (
                  <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                ) : (
                  <Download className="h-3.5 w-3.5 mr-1.5" />
                )}
                {image.source === 'dropbox' ? 'Download from Dropbox' : 'Download Licensed'}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
