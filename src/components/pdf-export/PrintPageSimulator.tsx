import { ReactNode, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { PAPER_SIZES, PaperSize, PdfTheme } from '@/lib/exportPdf';
import { ThemeClasses, SECTION_HEIGHT_ESTIMATES } from './types';
import { SectionId } from '@/types/brand';

interface PrintPageSimulatorProps {
  paperSize: PaperSize;
  theme: PdfTheme;
  themeClasses: ThemeClasses;
  showMarginGuides?: boolean;
  showPageShadow?: boolean;
  pageNumber: number;
  totalPages: number;
  children: ReactNode;
  brandName?: string;
}

export const PrintPageSimulator = ({
  paperSize,
  theme,
  themeClasses: t,
  showMarginGuides = true,
  showPageShadow = true,
  pageNumber,
  totalPages,
  children,
  brandName,
}: PrintPageSimulatorProps) => {
  const paper = PAPER_SIZES[paperSize];
  
  return (
    <div className="relative">
      {/* Page number badge */}
      <div className="flex items-center justify-center mb-3">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-background border shadow-sm">
          <span className="text-xs font-medium text-foreground">
            Page {pageNumber}
          </span>
          <span className="text-xs text-muted-foreground">
            of {totalPages}
          </span>
        </div>
      </div>
      
      {/* Physical page */}
      <div 
        className={cn(
          "relative rounded-sm transition-shadow duration-200",
          showPageShadow && "shadow-2xl",
          t.bg
        )}
        style={{ 
          width: `${paper.width}mm`,
          minHeight: `${paper.height}mm`,
          boxShadow: showPageShadow 
            ? '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0,0,0,0.05)' 
            : undefined,
        }}
      >
        {/* Margin guides overlay */}
        {showMarginGuides && (
          <div 
            className="absolute inset-0 pointer-events-none z-50 border-2 border-dashed border-blue-400/20"
            style={{
              margin: `${paper.margins[0]}mm ${paper.margins[1]}mm ${paper.margins[2]}mm ${paper.margins[3]}mm`,
            }}
          >
            {/* Corner marks */}
            <div className="absolute -top-1 -left-1 w-2 h-2 border-t-2 border-l-2 border-blue-400/40" />
            <div className="absolute -top-1 -right-1 w-2 h-2 border-t-2 border-r-2 border-blue-400/40" />
            <div className="absolute -bottom-1 -left-1 w-2 h-2 border-b-2 border-l-2 border-blue-400/40" />
            <div className="absolute -bottom-1 -right-1 w-2 h-2 border-b-2 border-r-2 border-blue-400/40" />
          </div>
        )}
        
        {/* Page content area with margins */}
        <div
          style={{
            padding: `${paper.margins[0]}mm ${paper.margins[1]}mm ${paper.margins[2]}mm ${paper.margins[3]}mm`,
            minHeight: `${paper.height}mm`,
          }}
        >
          {children}
        </div>
        
        {/* Page footer (simulated print footer) */}
        <div 
          className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-4 py-2 text-[8px] opacity-30"
          style={{
            marginBottom: `${Math.max(paper.margins[2] - 8, 2)}mm`,
          }}
        >
          <span>{brandName || 'Brand Guide'}</span>
          <span>Page {pageNumber}</span>
        </div>
      </div>
    </div>
  );
};

interface PrintPreviewContainerProps {
  zoom: number;
  children: ReactNode;
}

export const PrintPreviewContainer = ({ zoom, children }: PrintPreviewContainerProps) => {
  return (
    <div 
      className="transition-transform duration-200"
      style={{ 
        transform: `scale(${zoom})`,
        transformOrigin: 'top center',
      }}
    >
      {children}
    </div>
  );
};

interface PageBreakDividerProps {
  paperSize: PaperSize;
}

export const PageBreakDivider = ({ paperSize }: PageBreakDividerProps) => {
  const paper = PAPER_SIZES[paperSize];
  
  return (
    <div 
      className="relative my-6"
      style={{ width: `${paper.width}mm` }}
    >
      {/* Visual gap representing physical page separation */}
      <div className="h-8 bg-gradient-to-b from-background/50 via-muted/30 to-background/50 flex items-center justify-center">
        <div className="flex items-center gap-2">
          <div className="h-px w-12 bg-gradient-to-r from-transparent to-border" />
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted border border-border/50">
            <svg className="w-3 h-3 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <span className="text-[10px] font-medium text-muted-foreground tracking-wide uppercase">
              Page Break
            </span>
          </div>
          <div className="h-px w-12 bg-gradient-to-l from-transparent to-border" />
        </div>
      </div>
    </div>
  );
};

// Calculate estimated pages based on content
export const useEstimatedPages = (
  selectedSections: Set<SectionId>,
  paperSize: PaperSize,
  includeToc: boolean
): number => {
  const paper = PAPER_SIZES[paperSize];
  
  return useMemo(() => {
    const usableHeight = paper.height - paper.margins[0] - paper.margins[2];
    let totalContentHeight = 0;
    
    // Cover page is always ~1 page
    if (selectedSections.has('hero')) {
      totalContentHeight += usableHeight; // Full page for hero
    }
    
    // TOC adds roughly half a page
    if (includeToc && selectedSections.size > 1) {
      totalContentHeight += usableHeight * 0.5;
    }
    
    // Add section heights
    selectedSections.forEach(sectionId => {
      if (sectionId !== 'hero') {
        const height = SECTION_HEIGHT_ESTIMATES[sectionId] || 50;
        totalContentHeight += height;
      }
    });
    
    return Math.max(1, Math.ceil(totalContentHeight / usableHeight));
  }, [selectedSections, paper, includeToc]);
};
