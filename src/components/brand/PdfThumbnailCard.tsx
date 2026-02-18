import { useState, useEffect } from 'react';
import { FileText, Loader2 } from 'lucide-react';

interface PdfThumbnailCardProps {
  url: string;
  name: string;
}

export const PdfThumbnailCard = ({ url, name }: PdfThumbnailCardProps) => {
  const [thumbnailDataUrl, setThumbnailDataUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const generate = async () => {
      try {
        const pdfjsLib = await import('pdfjs-dist');
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

        const pdf = await pdfjsLib.getDocument(url).promise;
        const page = await pdf.getPage(1);
        const viewport = page.getViewport({ scale: 1.5 });

        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d');
        if (!ctx || cancelled) return;

        await page.render({ canvasContext: ctx, viewport }).promise;
        if (!cancelled) {
          setThumbnailDataUrl(canvas.toDataURL('image/jpeg', 0.7));
        }
      } catch (err) {
        console.warn('PDF thumbnail generation failed:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    generate();
    return () => { cancelled = true; };
  }, [url]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-2 bg-gradient-to-br from-destructive/10 to-destructive/5">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="text-[10px] text-muted-foreground">Rendering PDF…</span>
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

  return (
    <object
      data={`${url}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
      type="application/pdf"
      className="w-full h-full pointer-events-none"
    >
      <div className="flex flex-col items-center justify-center h-full gap-2 bg-gradient-to-br from-destructive/10 to-destructive/5">
        <div className="relative">
          <FileText className="h-10 w-10 text-destructive/80" />
          <span className="absolute -bottom-1 -right-1 text-[8px] font-bold bg-destructive text-destructive-foreground px-1 rounded">PDF</span>
        </div>
        <span className="text-[10px] text-muted-foreground max-w-[80%] truncate text-center">{name}</span>
      </div>
    </object>
  );
};
