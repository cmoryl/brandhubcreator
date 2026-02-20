import { useState, useEffect, useCallback } from 'react';
import { FileText, Loader2, RefreshCw, AlertTriangle } from 'lucide-react';

interface PdfThumbnailCardProps {
  url: string;
  name: string;
}

export const PdfThumbnailCard = ({ url, name }: PdfThumbnailCardProps) => {
  const [thumbnailDataUrl, setThumbnailDataUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const generate = useCallback(async (signal: AbortSignal) => {
    if (!url) {
      setLoading(false);
      setError(true);
      return;
    }

    setLoading(true);
    setError(false);

    try {
      const pdfjsLib = await import('pdfjs-dist');
      const version = pdfjsLib.version;
      const majorVersion = parseInt(version.split('.')[0], 10);
      const workerExt = majorVersion >= 4 ? 'pdf.worker.min.mjs' : 'pdf.worker.min.js';
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${version}/${workerExt}`;

      const pdf = await pdfjsLib.getDocument(url).promise;
      if (signal.aborted) return;

      const page = await pdf.getPage(1);
      const viewport = page.getViewport({ scale: 1.5 });

      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext('2d');
      if (!ctx || signal.aborted) return;

      await page.render({ canvasContext: ctx, viewport }).promise;
      if (!signal.aborted) {
        setThumbnailDataUrl(canvas.toDataURL('image/jpeg', 0.7));
      }
    } catch (err) {
      console.warn('PDF thumbnail generation failed:', err);
      if (!signal.aborted) setError(true);
    } finally {
      if (!signal.aborted) setLoading(false);
    }
  }, [url]);

  useEffect(() => {
    const controller = new AbortController();
    generate(controller.signal);
    return () => controller.abort();
  }, [generate, retryCount]);

  const handleRetry = () => {
    setRetryCount(c => c + 1);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center w-full h-full gap-2 bg-muted/30">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="text-[10px] text-muted-foreground">Rendering…</span>
      </div>
    );
  }

  if (thumbnailDataUrl) {
    return (
      <>
        <img src={thumbnailDataUrl} alt={name} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
        <span className="absolute top-1 left-1 text-[8px] font-bold bg-destructive text-destructive-foreground px-1.5 py-0.5 rounded">PDF</span>
      </>
    );
  }

  // Fallback: if we have a valid URL, try native browser PDF embed
  if (!error && url) {
    return (
      <object
        data={`${url}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
        type="application/pdf"
        className="w-full h-full pointer-events-none"
      >
        <FallbackIcon name={name} onRetry={handleRetry} />
      </object>
    );
  }

  // No URL or error
  if (!url) {
    return <MissingFileIcon name={name} />;
  }

  return <FallbackIcon name={name} onRetry={handleRetry} />;
};

const MissingFileIcon = ({ name }: { name: string }) => (
  <div className="flex flex-col items-center justify-center w-full h-full gap-1.5 bg-muted/20">
    <AlertTriangle className="h-6 w-6 text-warning/70" />
    <span className="text-[9px] text-muted-foreground font-medium">File not found</span>
    <span className="text-[9px] text-muted-foreground max-w-[85%] truncate text-center">{name}</span>
  </div>
);

const FallbackIcon = ({ name, onRetry }: { name: string; onRetry?: () => void }) => (
  <div className="flex flex-col items-center justify-center w-full h-full gap-1.5 bg-muted/20">
    <div className="relative">
      <FileText className="h-7 w-7 text-muted-foreground/60" />
      <span className="absolute -bottom-1 -right-1 text-[7px] font-bold bg-destructive text-destructive-foreground px-1 rounded">PDF</span>
    </div>
    <span className="text-[9px] text-muted-foreground max-w-[85%] truncate text-center">{name}</span>
    {onRetry && (
      <button 
        onClick={(e) => { e.stopPropagation(); onRetry(); }}
        className="flex items-center gap-1 text-[9px] text-primary hover:text-primary/80 transition-colors mt-0.5"
      >
        <RefreshCw className="h-2.5 w-2.5" />
        Retry
      </button>
    )}
  </div>
);
