import { useState } from 'react';
import { ExternalLink, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface PreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  previewUrl?: string;
  externalUrl?: string;
  type?: 'image' | 'iframe' | 'video';
  aspectRatio?: 'video' | 'square' | 'portrait' | 'auto';
  imageStyle?: React.CSSProperties;
}

export const PreviewDialog = ({
  open,
  onOpenChange,
  title,
  previewUrl,
  externalUrl,
  type = 'image',
  aspectRatio = 'auto',
  imageStyle,
}: PreviewDialogProps) => {
  const [zoom, setZoom] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.25, 0.5));
  const handleReset = () => setZoom(1);

  const getAspectClass = () => {
    switch (aspectRatio) {
      case 'video': return 'aspect-video';
      case 'square': return 'aspect-square';
      case 'portrait': return 'aspect-[3/4]';
      default: return '';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden bg-background/95 backdrop-blur-xl border-border">
        <DialogHeader className="p-4 border-b border-border flex flex-row items-center justify-between">
          <DialogTitle className="text-lg font-semibold truncate pr-4">{title}</DialogTitle>
          <div className="flex items-center gap-2">
            {type === 'image' && (
              <>
                <Button variant="ghost" size="icon" onClick={handleZoomOut} disabled={zoom <= 0.5}>
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <span className="text-xs text-muted-foreground min-w-[40px] text-center">
                  {Math.round(zoom * 100)}%
                </span>
                <Button variant="ghost" size="icon" onClick={handleZoomIn} disabled={zoom >= 3}>
                  <ZoomIn className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={handleReset}>
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </>
            )}
            {externalUrl && (
              <Button variant="ghost" size="icon" asChild>
                <a href={externalUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            )}
          </div>
        </DialogHeader>

        <div className={cn(
          "relative p-4 bg-muted/30 flex-1 overflow-hidden",
          type === 'iframe' ? 'h-[75vh]' : 'overflow-auto min-h-[400px] max-h-[70vh]'
        )}>
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-muted/50 z-10">
              <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
            </div>
          )}

          {type === 'image' && previewUrl && (
            <div className="flex items-center justify-center min-h-full overflow-auto">
              <img
                src={previewUrl}
                alt={title}
                className={cn(
                  "object-contain transition-transform duration-200 rounded-lg shadow-lg",
                  zoom === 1 ? "max-w-full max-h-[65vh]" : "",
                  getAspectClass()
                )}
                style={{ transform: `scale(${zoom})`, transformOrigin: 'center center', ...imageStyle }}
                onLoad={() => setIsLoading(false)}
                onError={() => setIsLoading(false)}
              />
            </div>
          )}

          {type === 'iframe' && previewUrl && (
            <iframe
              src={previewUrl}
              title={title}
              className={cn(
                "w-full h-full rounded-lg border border-border",
                getAspectClass()
              )}
              style={{ minHeight: '100%' }}
              onLoad={() => setIsLoading(false)}
            />
          )}

          {type === 'video' && previewUrl && (
            <video
              src={previewUrl}
              controls
              className={cn("w-full rounded-lg", getAspectClass())}
              onLoadedData={() => setIsLoading(false)}
            />
          )}

          {!previewUrl && (
            <div className="flex items-center justify-center h-64 text-muted-foreground">
              No preview available
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
