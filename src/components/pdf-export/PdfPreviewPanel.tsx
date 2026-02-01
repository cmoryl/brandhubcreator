import { useMemo, forwardRef, ReactNode } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import { PAPER_SIZES, PaperSize, PdfTheme } from '@/lib/exportPdf';
import { PDF_PRESETS, PdfLayoutPreset } from '@/lib/pdfPresets';
import { PageBreakIndicator } from './PageBreakIndicator';
import { ThemeClasses, SECTION_HEIGHT_ESTIMATES } from './types';
import { SectionId } from '@/types/brand';
import '@/styles/pdf-export.css';

interface PdfPreviewPanelProps {
  paperSize: PaperSize;
  layoutPreset: PdfLayoutPreset;
  theme: PdfTheme;
  themeClasses: ThemeClasses;
  zoom: number;
  onZoomChange: (zoom: number) => void;
  selectedSections: Set<SectionId>;
  children: ReactNode;
}

export const PdfPreviewPanel = forwardRef<HTMLDivElement, PdfPreviewPanelProps>(({
  paperSize,
  layoutPreset,
  theme,
  themeClasses: t,
  zoom,
  onZoomChange,
  selectedSections,
  children,
}, ref) => {
  const paper = PAPER_SIZES[paperSize];
  const preset = PDF_PRESETS[layoutPreset];
  
  // Calculate estimated page count based on selected sections
  const estimatedPageCount = useMemo(() => {
    const pageHeightMm = paper.height - paper.margins[0] - paper.margins[2];
    let totalHeight = 0;
    
    selectedSections.forEach(sectionId => {
      totalHeight += SECTION_HEIGHT_ESTIMATES[sectionId] || 50;
    });
    
    return Math.max(1, Math.ceil(totalHeight / pageHeightMm));
  }, [selectedSections, paper]);

  const handleZoomIn = () => onZoomChange(Math.min(zoom + 0.25, 2));
  const handleZoomOut = () => onZoomChange(Math.max(zoom - 0.25, 0.5));
  const handleZoomReset = () => onZoomChange(1);

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-muted/50">
      {/* Preview Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b bg-background">
        <div className="flex items-center gap-3">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <div>
            <span className="text-sm font-medium">{preset.label} Style</span>
            <span className="text-xs text-muted-foreground ml-2">• {paper.label}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground mr-2">
            ~{estimatedPageCount} page{estimatedPageCount !== 1 ? 's' : ''}
          </span>
          
          <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7" 
              onClick={handleZoomOut}
              disabled={zoom <= 0.5}
            >
              <ZoomOut className="h-3.5 w-3.5" />
            </Button>
            <div className="w-20 px-1">
              <Slider
                value={[zoom * 100]}
                onValueChange={([v]) => onZoomChange(v / 100)}
                min={50}
                max={200}
                step={25}
              />
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7" 
              onClick={handleZoomIn}
              disabled={zoom >= 2}
            >
              <ZoomIn className="h-3.5 w-3.5" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7" 
              onClick={handleZoomReset}
            >
              <RotateCcw className="h-3 w-3" />
            </Button>
          </div>
          
          <span className="text-xs font-mono text-muted-foreground w-12 text-right">
            {Math.round(zoom * 100)}%
          </span>
        </div>
      </div>

      {/* Preview Content */}
      <ScrollArea className="flex-1">
        <div className="p-6 flex justify-center">
          <div 
            style={{ 
              transform: `scale(${zoom})`,
              transformOrigin: 'top center',
            }}
          >
            {/* Page 1 indicator */}
            <div className="mb-2 flex items-center justify-center">
              <span className="text-xs font-medium text-muted-foreground bg-background px-3 py-1 rounded-full border shadow-sm">
                Page 1
              </span>
            </div>
            
            {/* PDF Document */}
            <div 
              ref={ref}
              className={cn(
                "shadow-2xl pdf-export-container rounded-sm relative",
                `pdf-preset-${layoutPreset}`,
                theme === 'dark' ? 'pdf-theme-dark' : '',
                t.bg
              )}
              style={{ 
                width: `${paper.width}mm`,
                minHeight: `${paper.height}mm`,
                padding: `${paper.margins[0]}mm ${paper.margins[1]}mm ${paper.margins[2]}mm ${paper.margins[3]}mm`,
              }}
            >
              {/* Print margins indicator (only in preview, not in export) */}
              <div 
                className="absolute inset-0 pointer-events-none border-2 border-dashed border-primary/10 z-50"
                style={{
                  margin: `${paper.margins[0]}mm ${paper.margins[1]}mm ${paper.margins[2]}mm ${paper.margins[3]}mm`,
                }}
              />
              
              {children}
            </div>

            {/* Simulated page breaks */}
            {estimatedPageCount > 1 && (
              <>
                {Array.from({ length: estimatedPageCount - 1 }, (_, i) => (
                  <div key={i + 2}>
                    <PageBreakIndicator 
                      pageNumber={i + 2} 
                      paperSize={paperSize}
                    />
                    <div 
                      className={cn(
                        "shadow-2xl rounded-sm",
                        t.bg
                      )}
                      style={{ 
                        width: `${paper.width}mm`,
                        minHeight: `${paper.height * 0.3}mm`,
                        padding: `${paper.margins[0]}mm`,
                      }}
                    >
                      <div className="flex items-center justify-center h-full opacity-30">
                        <p className="text-sm text-muted-foreground">
                          Content continues...
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
});

PdfPreviewPanel.displayName = 'PdfPreviewPanel';
