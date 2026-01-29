import { useState } from 'react';
import { Download, ZoomIn, ZoomOut, Grid2X2, Grid3X3, Maximize2, X } from 'lucide-react';
import { BrandPattern } from '@/types/brand';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ToggleGroup,
  ToggleGroupItem,
} from '@/components/ui/toggle-group';

interface PatternPreviewModalProps {
  pattern: BrandPattern | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const RESOLUTION_OPTIONS = [
  { label: '512 × 512', value: '512', size: 512 },
  { label: '1024 × 1024', value: '1024', size: 1024 },
  { label: '2048 × 2048', value: '2048', size: 2048 },
  { label: '4096 × 4096 (4K)', value: '4096', size: 4096 },
];

const TILE_SIZE_OPTIONS = [
  { label: 'Small', value: '32', size: 32 },
  { label: 'Medium', value: '64', size: 64 },
  { label: 'Large', value: '128', size: 128 },
  { label: 'X-Large', value: '256', size: 256 },
];

export const PatternPreviewModal = ({ pattern, open, onOpenChange }: PatternPreviewModalProps) => {
  const [downloadResolution, setDownloadResolution] = useState('1024');
  const [tileSize, setTileSize] = useState('64');
  const [isDownloading, setIsDownloading] = useState(false);

  const currentTileSize = TILE_SIZE_OPTIONS.find(t => t.value === tileSize)?.size || 64;

  const downloadPattern = async (resolution: number) => {
    if (!pattern) return;
    
    setIsDownloading(true);
    try {
      const canvas = document.createElement('canvas');
      canvas.width = resolution;
      canvas.height = resolution;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        toast.error('Canvas not supported');
        return;
      }

      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      await new Promise<void>((resolve, reject) => {
        img.onload = () => {
          // Tile the pattern across the canvas
          const patternCanvas = document.createElement('canvas');
          const patternCtx = patternCanvas.getContext('2d');
          if (!patternCtx) {
            reject(new Error('Pattern canvas not supported'));
            return;
          }
          
          patternCanvas.width = img.width;
          patternCanvas.height = img.height;
          patternCtx.drawImage(img, 0, 0);
          
          const canvasPattern = ctx.createPattern(patternCanvas, 'repeat');
          if (canvasPattern) {
            ctx.fillStyle = canvasPattern;
            ctx.fillRect(0, 0, resolution, resolution);
          } else {
            ctx.drawImage(img, 0, 0, resolution, resolution);
          }
          resolve();
        };
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = pattern.url;
      });

      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob(resolve, 'image/png', 1.0);
      });

      if (!blob) {
        toast.error('Failed to generate image');
        return;
      }

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${pattern.name.toLowerCase().replace(/\s+/g, '-')}-${resolution}x${resolution}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success(`Downloaded ${pattern.name} at ${resolution}×${resolution}`);
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download pattern');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDownload = () => {
    const resolution = RESOLUTION_OPTIONS.find(r => r.value === downloadResolution)?.size || 1024;
    downloadPattern(resolution);
  };

  const increaseTileSize = () => {
    const currentIndex = TILE_SIZE_OPTIONS.findIndex(t => t.value === tileSize);
    if (currentIndex < TILE_SIZE_OPTIONS.length - 1) {
      setTileSize(TILE_SIZE_OPTIONS[currentIndex + 1].value);
    }
  };

  const decreaseTileSize = () => {
    const currentIndex = TILE_SIZE_OPTIONS.findIndex(t => t.value === tileSize);
    if (currentIndex > 0) {
      setTileSize(TILE_SIZE_OPTIONS[currentIndex - 1].value);
    }
  };

  if (!pattern) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="shrink-0">
          <DialogTitle className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div 
                className="w-8 h-8 rounded-md border border-border"
                style={{ 
                  backgroundImage: `url(${pattern.url})`, 
                  backgroundSize: '16px 16px',
                  backgroundRepeat: 'repeat'
                }}
              />
              <span className="font-semibold">{pattern.name}</span>
            </div>
          </DialogTitle>
        </DialogHeader>

        {/* Preview Controls */}
        <div className="flex items-center justify-between gap-4 py-3 border-b border-border shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Tile Size:</span>
            <div className="flex items-center gap-1">
              <Button 
                variant="outline" 
                size="icon" 
                className="h-8 w-8"
                onClick={decreaseTileSize}
                disabled={tileSize === '32'}
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <ToggleGroup type="single" value={tileSize} onValueChange={(v) => v && setTileSize(v)}>
                {TILE_SIZE_OPTIONS.map(opt => (
                  <ToggleGroupItem 
                    key={opt.value} 
                    value={opt.value} 
                    className="text-xs px-2 h-8"
                    aria-label={opt.label}
                  >
                    {opt.size}px
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
              <Button 
                variant="outline" 
                size="icon" 
                className="h-8 w-8"
                onClick={increaseTileSize}
                disabled={tileSize === '256'}
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Select value={downloadResolution} onValueChange={setDownloadResolution}>
              <SelectTrigger className="w-[160px] h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RESOLUTION_OPTIONS.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button 
              onClick={handleDownload}
              className="gap-2"
              disabled={isDownloading}
            >
              <Download className="h-4 w-4" />
              {isDownloading ? 'Downloading...' : 'Download'}
            </Button>
          </div>
        </div>

        {/* Pattern Preview */}
        <div className="flex-1 min-h-0 overflow-auto p-4 bg-muted/30 rounded-lg">
          <div 
            className="w-full aspect-square rounded-lg border border-border shadow-inner mx-auto max-w-[600px] transition-all duration-300"
            style={{ 
              backgroundImage: `url(${pattern.url})`, 
              backgroundSize: `${currentTileSize}px ${currentTileSize}px`, 
              backgroundRepeat: 'repeat' 
            }}
          />
        </div>

        {/* Single Tile Preview */}
        <div className="shrink-0 pt-4 border-t border-border">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-muted-foreground">Single Tile:</span>
              <div className="relative group">
                <img 
                  src={pattern.url} 
                  alt={pattern.name}
                  className="w-24 h-24 rounded-lg border border-border object-cover shadow-sm"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 rounded-lg transition-colors" />
              </div>
            </div>
            <div className="flex-1 text-sm text-muted-foreground">
              <p>This pattern is designed to tile seamlessly. Adjust the tile size above to preview how it will appear at different scales.</p>
              <p className="mt-1">Select your desired resolution and download for use in your designs.</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
