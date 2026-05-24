/**
 * PdfPreviewDialog — in-app preview of a generated PDF before download.
 * Renders the document via an <iframe> using a blob URL so the user can
 * page through, zoom, and confirm content before saving.
 */
import { useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, ExternalLink, Loader2 } from 'lucide-react';

interface PdfPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  url: string | null;
  filename: string;
  title?: string;
  description?: string;
  loading?: boolean;
}

export const PdfPreviewDialog = ({
  open,
  onOpenChange,
  url,
  filename,
  title = 'PDF preview',
  description,
  loading,
}: PdfPreviewDialogProps) => {
  // Revoke the blob URL when the dialog fully closes to free memory.
  useEffect(() => {
    if (!open && url) {
      const u = url;
      const t = window.setTimeout(() => URL.revokeObjectURL(u), 500);
      return () => window.clearTimeout(t);
    }
  }, [open, url]);

  const handleDownload = () => {
    if (!url) return;
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl w-[95vw] h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 py-4 border-b border-border/60 flex-row items-start justify-between gap-4 space-y-0">
          <div className="min-w-0">
            <DialogTitle className="truncate">{title}</DialogTitle>
            <DialogDescription className="truncate">
              {description ?? filename}
            </DialogDescription>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {url && (
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => window.open(url, '_blank', 'noopener,noreferrer')}
              >
                <ExternalLink className="h-4 w-4" />
                Open in new tab
              </Button>
            )}
            <Button size="sm" className="gap-2" onClick={handleDownload} disabled={!url || loading}>
              <Download className="h-4 w-4" />
              Download
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 min-h-0 bg-muted/30">
          {loading || !url ? (
            <div className="h-full w-full flex flex-col items-center justify-center gap-3 text-sm text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin" />
              Building preview…
            </div>
          ) : (
            <iframe
              key={url}
              src={url}
              title={filename}
              className="h-full w-full border-0"
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PdfPreviewDialog;
