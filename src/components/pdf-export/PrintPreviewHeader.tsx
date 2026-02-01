import { FileText, ZoomIn, ZoomOut, RotateCcw, Printer, Eye, Grid3X3, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Toggle } from '@/components/ui/toggle';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { PAPER_SIZES, PaperSize } from '@/lib/exportPdf';
import { PDF_PRESETS, PdfLayoutPreset } from '@/lib/pdfPresets';

interface PrintPreviewHeaderProps {
  paperSize: PaperSize;
  layoutPreset: PdfLayoutPreset;
  estimatedPages: number;
  zoom: number;
  onZoomChange: (zoom: number) => void;
  showMarginGuides: boolean;
  onShowMarginGuidesChange: (show: boolean) => void;
  viewMode: 'scroll' | 'single';
  onViewModeChange: (mode: 'scroll' | 'single') => void;
  currentPage?: number;
  onPageChange?: (page: number) => void;
}

export const PrintPreviewHeader = ({
  paperSize,
  layoutPreset,
  estimatedPages,
  zoom,
  onZoomChange,
  showMarginGuides,
  onShowMarginGuidesChange,
  viewMode,
  onViewModeChange,
  currentPage = 1,
  onPageChange,
}: PrintPreviewHeaderProps) => {
  const paper = PAPER_SIZES[paperSize];
  const preset = PDF_PRESETS[layoutPreset];
  
  const handleZoomIn = () => onZoomChange(Math.min(zoom + 0.15, 1.5));
  const handleZoomOut = () => onZoomChange(Math.max(zoom - 0.15, 0.3));
  const handleZoomReset = () => onZoomChange(0.75);
  const handleZoomFit = () => onZoomChange(0.5);

  return (
    <div className="px-4 py-2.5 border-b bg-background flex items-center justify-between gap-4">
      {/* Left: Document info */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="p-1.5 rounded-md bg-primary/10">
          <Printer className="h-4 w-4 text-primary" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium truncate">{preset.label}</span>
            <span className="text-xs text-muted-foreground">•</span>
            <span className="text-xs text-muted-foreground">{paper.label}</span>
          </div>
          <div className="text-xs text-muted-foreground">
            {estimatedPages} page{estimatedPages !== 1 ? 's' : ''} • {paper.width}×{paper.height}mm
          </div>
        </div>
      </div>

      {/* Center: View mode and margin toggle */}
      <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Toggle
                size="sm"
                pressed={showMarginGuides}
                onPressedChange={onShowMarginGuidesChange}
                className="h-7 px-2 data-[state=on]:bg-background"
              >
                <Grid3X3 className="h-3.5 w-3.5" />
              </Toggle>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              {showMarginGuides ? 'Hide' : 'Show'} margin guides
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Right: Zoom controls */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-7 w-7" 
                  onClick={handleZoomOut}
                  disabled={zoom <= 0.3}
                >
                  <ZoomOut className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">Zoom out</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <div className="w-20 px-1">
            <Slider
              value={[zoom * 100]}
              onValueChange={([v]) => onZoomChange(v / 100)}
              min={30}
              max={150}
              step={5}
            />
          </div>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-7 w-7" 
                  onClick={handleZoomIn}
                  disabled={zoom >= 1.5}
                >
                  <ZoomIn className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">Zoom in</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <div className="w-px h-4 bg-border mx-0.5" />
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-7 w-7" 
                  onClick={handleZoomFit}
                >
                  <Maximize2 className="h-3 w-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">Fit to view</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-7 w-7" 
                  onClick={handleZoomReset}
                >
                  <RotateCcw className="h-3 w-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">Reset zoom (75%)</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        
        <span className="text-xs font-mono text-muted-foreground w-10 text-right tabular-nums">
          {Math.round(zoom * 100)}%
        </span>
      </div>
    </div>
  );
};
