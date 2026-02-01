import { Scissors } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PaperSize, PAPER_SIZES } from '@/lib/exportPdf';

interface PageBreakIndicatorProps {
  pageNumber: number;
  paperSize: PaperSize;
  className?: string;
}

export const PageBreakIndicator = ({ pageNumber, paperSize, className }: PageBreakIndicatorProps) => {
  const paper = PAPER_SIZES[paperSize];
  
  return (
    <div 
      className={cn(
        "relative w-full flex items-center justify-center py-2 my-4",
        "border-t-2 border-b-2 border-dashed border-primary/30",
        "bg-gradient-to-r from-transparent via-primary/5 to-transparent",
        className
      )}
    >
      <div className="absolute left-2 flex items-center gap-1.5 text-xs text-muted-foreground">
        <Scissors className="h-3.5 w-3.5 rotate-90" />
        <span className="font-medium">Page break</span>
      </div>
      
      <div className="flex items-center gap-2 px-4 py-1 rounded-full bg-background border shadow-sm">
        <span className="text-xs font-semibold text-foreground">Page {pageNumber}</span>
        <span className="text-xs text-muted-foreground">/ {paper.label}</span>
      </div>
      
      <div className="absolute right-2 text-xs text-muted-foreground">
        {paper.width}×{paper.height}mm
      </div>
    </div>
  );
};
