/**
 * IconPreviewDialog - Full-size icon preview with zoom controls
 */

import { useState } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, Download, Copy, Check, Image, FileCode } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { BrandIconography } from '@/types/brand';
import { cn } from '@/lib/utils';
import DOMPurify from 'dompurify';
import { toast } from 'sonner';

interface IconPreviewDialogProps {
  icon: BrandIconography | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const IconPreviewDialog = ({ icon, open, onOpenChange }: IconPreviewDialogProps) => {
  const [zoom, setZoom] = useState(100);
  const [copied, setCopied] = useState(false);
  const [bgMode, setBgMode] = useState<'light' | 'dark' | 'checker'>('checker');

  if (!icon) return null;

  const viewBox = icon.viewBox || '0 0 24 24';
  const isFullSvg = icon.svgPath.includes('<');

  const generateSvgString = () => {
    if (isFullSvg) {
      const sanitized = DOMPurify.sanitize(icon.svgPath, {
        USE_PROFILES: { svg: true, svgFilters: true },
        FORBID_TAGS: ['script', 'foreignObject'],
      });
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" fill="currentColor">${sanitized}</svg>`;
    }
    
    const fill = icon.fillMode === 'fill' ? 'currentColor' : 'none';
    const stroke = icon.fillMode === 'stroke' ? 'currentColor' : 'none';
    const strokeWidth = icon.fillMode === 'stroke' ? ' stroke-width="2"' : '';
    
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" fill="${fill}" stroke="${stroke}"${strokeWidth}><path d="${icon.svgPath}"/></svg>`;
  };

  const handleCopySvg = async () => {
    try {
      await navigator.clipboard.writeText(generateSvgString());
      setCopied(true);
      toast.success('SVG copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy SVG');
    }
  };

  const handleDownloadSvg = () => {
    const svgString = generateSvgString();
    const blob = new Blob([svgString], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${icon.name.toLowerCase().replace(/\s+/g, '-')}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('SVG downloaded');
  };

  const handleDownloadPng = (size: number) => {
    const svgString = generateSvgString();
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new window.Image();
    img.onload = () => {
      ctx.drawImage(img, 0, 0, size, size);
      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${icon.name.toLowerCase().replace(/\s+/g, '-')}-${size}x${size}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success(`PNG ${size}×${size} downloaded`);
      }, 'image/png');
    };
    img.onerror = () => toast.error('Failed to generate PNG');
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgString)}`;
  };

  const renderPreviewIcon = () => {
    const size = Math.round((zoom / 100) * 200);
    
    if (isFullSvg) {
      const sanitized = DOMPurify.sanitize(icon.svgPath, {
        USE_PROFILES: { svg: true, svgFilters: true },
        FORBID_TAGS: ['script', 'foreignObject'],
      });
      
      return (
        <svg 
          viewBox={viewBox} 
          style={{ width: size, height: size }}
          fill="currentColor"
        >
          <g dangerouslySetInnerHTML={{ __html: sanitized }} />
        </svg>
      );
    }

    return (
      <svg
        viewBox={viewBox}
        style={{ width: size, height: size }}
        fill={icon.fillMode === 'fill' ? 'currentColor' : 'none'}
        stroke={icon.fillMode === 'stroke' ? 'currentColor' : 'none'}
        strokeWidth={icon.fillMode === 'stroke' ? 2 : undefined}
      >
        <path d={icon.svgPath} />
      </svg>
    );
  };

  const bgClasses = {
    light: 'bg-background text-foreground',
    dark: 'bg-card text-card-foreground dark',
    checker: 'bg-[length:20px_20px] bg-[linear-gradient(45deg,hsl(var(--muted))_25%,transparent_25%,transparent_75%,hsl(var(--muted))_75%),linear-gradient(45deg,hsl(var(--muted))_25%,transparent_25%,transparent_75%,hsl(var(--muted))_75%)] bg-[position:0_0,10px_10px] bg-background text-foreground',
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {icon.name}
            <Badge variant="outline" className="text-xs font-normal">
              {icon.fillMode || 'fill'}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Background Mode Toggle */}
          <div className="flex items-center justify-center gap-1 p-1 rounded-lg bg-muted w-fit mx-auto">
            <Button
              variant={bgMode === 'light' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setBgMode('light')}
              className="h-7 px-3 text-xs"
            >
              Light
            </Button>
            <Button
              variant={bgMode === 'dark' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setBgMode('dark')}
              className="h-7 px-3 text-xs"
            >
              Dark
            </Button>
            <Button
              variant={bgMode === 'checker' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setBgMode('checker')}
              className="h-7 px-3 text-xs"
            >
              Checker
            </Button>
          </div>

          {/* Icon Preview Area */}
          <div 
            className={cn(
              'flex items-center justify-center min-h-[280px] rounded-lg border transition-colors',
              bgClasses[bgMode]
            )}
          >
            {renderPreviewIcon()}
          </div>

          {/* Zoom Controls */}
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setZoom(Math.max(25, zoom - 25))}
              disabled={zoom <= 25}
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            
            <div className="flex-1 flex items-center gap-3">
              <Slider
                value={[zoom]}
                onValueChange={([v]) => setZoom(v)}
                min={25}
                max={300}
                step={5}
                className="flex-1"
              />
              <span className="text-sm text-muted-foreground w-12 text-right">
                {zoom}%
              </span>
            </div>

            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setZoom(Math.min(300, zoom + 25))}
              disabled={zoom >= 300}
            >
              <ZoomIn className="h-4 w-4" />
            </Button>

            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setZoom(100)}
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>

          {/* Info & Actions */}
          <div className="flex items-center justify-between pt-2 border-t">
            <div className="text-sm text-muted-foreground">
              <span className="font-medium">ViewBox:</span> {viewBox}
            </div>
            
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleCopySvg}>
                {copied ? (
                  <Check className="h-4 w-4 mr-1" />
                ) : (
                  <Copy className="h-4 w-4 mr-1" />
                )}
                {copied ? 'Copied' : 'Copy SVG'}
              </Button>
              <Button variant="outline" size="sm" onClick={handleDownload}>
                <Download className="h-4 w-4 mr-1" />
                Download
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
