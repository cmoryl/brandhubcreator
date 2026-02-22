import { useState } from 'react';
import { X, ExternalLink, Download, ZoomIn, ZoomOut, RotateCcw, Copy, Check } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export interface CollateralPreviewItem {
  name: string;
  imageUrl?: string;
  previewUrl?: string;
  type?: string;
  typeLabel?: string;
  dimensions?: string;
  description?: string;
  platform?: string;
  fileUrl?: string;       // Download / live file link
  templateUrl?: string;   // Template download link
  externalUrl?: string;   // External link (app store, website, etc.)
  fileType?: string;      // svg, png, jpg, etc.
  category?: string;
  quantity?: string;
  width?: number;
  height?: number;
}

interface DigitalCollateralPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: CollateralPreviewItem | null;
}

export const DigitalCollateralPreviewDialog = ({
  open,
  onOpenChange,
  item,
}: DigitalCollateralPreviewDialogProps) => {
  const [zoom, setZoom] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  if (!item) return null;

  const imgSrc = item.imageUrl || item.previewUrl;
  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.25, 0.5));
  const handleReset = () => setZoom(1);

  const handleDownload = async () => {
    const url = item.fileUrl || item.templateUrl || imgSrc;
    if (!url) return;
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = item.name || 'download';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch {
      window.open(url, '_blank');
    }
  };

  const handleCopyUrl = () => {
    const url = item.fileUrl || item.templateUrl || item.externalUrl || imgSrc;
    if (!url) return;
    navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success('Link copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const allLinks = [
    item.fileUrl && { label: 'Live File', url: item.fileUrl },
    item.templateUrl && { label: 'Template', url: item.templateUrl },
    item.externalUrl && { label: 'External Link', url: item.externalUrl },
  ].filter(Boolean) as { label: string; url: string }[];

  const metaItems = [
    item.typeLabel && { label: 'Type', value: item.typeLabel },
    item.dimensions && { label: 'Dimensions', value: item.dimensions },
    (item.width && item.height) && { label: 'Size', value: `${item.width} × ${item.height}px` },
    item.platform && { label: 'Platform', value: item.platform },
    item.fileType && { label: 'Format', value: item.fileType.toUpperCase() },
    item.category && { label: 'Category', value: item.category },
    item.quantity && { label: 'Quantity', value: item.quantity },
  ].filter(Boolean) as { label: string; value: string }[];

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) { setZoom(1); setIsLoading(true); setCopied(false); } }}>
      <DialogContent className="max-w-5xl max-h-[92vh] p-0 overflow-hidden bg-background/95 backdrop-blur-xl border-border gap-0">
        {/* Header */}
        <DialogHeader className="p-4 border-b border-border flex flex-row items-center justify-between shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <DialogTitle className="text-lg font-semibold truncate">{item.name}</DialogTitle>
            {item.typeLabel && (
              <Badge variant="secondary" className="shrink-0 text-xs">{item.typeLabel}</Badge>
            )}
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleZoomOut} disabled={zoom <= 0.5}>
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-xs text-muted-foreground min-w-[40px] text-center">{Math.round(zoom * 100)}%</span>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleZoomIn} disabled={zoom >= 3}>
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleReset}>
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        {/* Body: Image + Sidebar */}
        <div className="flex flex-col md:flex-row flex-1 overflow-hidden min-h-0">
          {/* Image area */}
          <div className="flex-1 relative bg-muted/30 overflow-auto flex items-center justify-center min-h-[300px] md:min-h-[400px]">
            {isLoading && imgSrc && (
              <div className="absolute inset-0 flex items-center justify-center bg-muted/50 z-10">
                <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
              </div>
            )}
            {imgSrc ? (
              <img
                src={imgSrc}
                alt={item.name}
                className={cn(
                  "object-contain transition-transform duration-200 rounded-lg shadow-lg",
                  zoom === 1 ? "max-w-full max-h-[65vh]" : ""
                )}
                style={{ transform: `scale(${zoom})`, transformOrigin: 'center center' }}
                onLoad={() => setIsLoading(false)}
                onError={() => setIsLoading(false)}
              />
            ) : (
              <div className="flex items-center justify-center h-64 text-muted-foreground">
                No preview available
              </div>
            )}
          </div>

          {/* Sidebar panel */}
          <div className="md:w-[280px] border-t md:border-t-0 md:border-l border-border bg-card p-4 overflow-y-auto shrink-0 space-y-4">
            {/* Description */}
            {item.description && (
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Description</h4>
                <p className="text-sm text-foreground leading-relaxed">{item.description}</p>
              </div>
            )}

            {/* Metadata */}
            {metaItems.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Details</h4>
                <div className="space-y-1.5">
                  {metaItems.map((meta) => (
                    <div key={meta.label} className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{meta.label}</span>
                      <span className="font-medium text-foreground">{meta.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* External Links */}
            {allLinks.length > 0 && (
              <>
                <Separator />
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Links</h4>
                  <div className="space-y-2">
                    {allLinks.map((link) => (
                      <Button key={link.label} variant="outline" size="sm" className="w-full justify-start gap-2 text-xs h-8" asChild>
                        <a href={link.url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">{link.label}</span>
                        </a>
                      </Button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Actions */}
            <Separator />
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Actions</h4>
              {(item.fileUrl || item.templateUrl || imgSrc) && (
                <Button variant="default" size="sm" className="w-full gap-2 text-xs h-9" onClick={handleDownload}>
                  <Download className="h-3.5 w-3.5" />
                  Download Asset
                </Button>
              )}
              {imgSrc && (
                <Button variant="outline" size="sm" className="w-full gap-2 text-xs h-9" onClick={() => window.open(imgSrc, '_blank')}>
                  <ExternalLink className="h-3.5 w-3.5" />
                  Open in New Tab
                </Button>
              )}
              <Button variant="ghost" size="sm" className="w-full gap-2 text-xs h-9" onClick={handleCopyUrl}>
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? 'Copied!' : 'Copy Link'}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
