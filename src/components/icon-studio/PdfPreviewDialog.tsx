/**
 * PdfPreviewDialog — in-app preview of a generated PDF before download.
 * Shows progress + cancel while building, then an iframe preview when ready.
 */
import { useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Download, ExternalLink, Loader2, X } from 'lucide-react';

export interface PdfPreviewProgress {
  percent: number;       // 0–1
  message: string;
  current?: number;
  total?: number;
}

interface PdfPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  url: string | null;
  filename: string;
  title?: string;
  description?: string;
  loading?: boolean;
  progress?: PdfPreviewProgress | null;
  /** Optional cancel handler — when provided, shows a Cancel button while loading. */
  onCancel?: () => void;
}

export const PdfPreviewDialog = ({
  open,
  onOpenChange,
  url,
  filename,
  title = 'PDF preview',
  description,
  loading,
  progress,
  onCancel,
}: PdfPreviewDialogProps) => {
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

  const pct = Math.max(0, Math.min(100, Math.round((progress?.percent ?? 0) * 100)));

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
            <div className="h-full w-full flex flex-col items-center justify-center gap-5 px-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-3">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                <span className="font-medium text-foreground">
                  {progress?.message ?? 'Building preview…'}
                </span>
              </div>
              <div className="w-full max-w-md space-y-2">
                <Progress value={pct} className="h-2" />
                <div className="flex justify-between text-xs tabular-nums text-muted-foreground">
                  <span>
                    {progress?.current != null && progress?.total != null
                      ? `${progress.current} / ${progress.total} icons`
                      : 'Working…'}
                  </span>
                  <span>{pct}%</span>
                </div>
              </div>
              {onCancel && (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={onCancel}
                >
                  <X className="h-4 w-4" />
                  Cancel
                </Button>
              )}
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
