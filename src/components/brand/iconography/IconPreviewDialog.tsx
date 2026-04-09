/**
 * IconPreviewDialog - Full-size icon preview with zoom controls & recoloring
 */

import { useState, useMemo, useCallback } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, Download, Copy, Check, Image, FileCode, Palette, ArrowRightLeft } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { BrandIconography } from '@/types/brand';
import { cn } from '@/lib/utils';
import { sanitizeSvg, recolorSvg, extractSvgColors, recolorSvgMulti, validateSvg, type SvgValidationResult, type SvgIssue } from '@/lib/svgUtils';
import { toast } from 'sonner';

interface IconPreviewDialogProps {
  icon: BrandIconography | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdateIcon?: (icon: BrandIconography) => void;
  brandColors?: string[];
}

export const IconPreviewDialog = ({ icon, open, onOpenChange, onUpdateIcon, brandColors = [] }: IconPreviewDialogProps) => {
  const [zoom, setZoom] = useState(100);
  const [copied, setCopied] = useState(false);
  const [bgMode, setBgMode] = useState<'light' | 'dark' | 'checker'>('checker');
  const [recolorHex, setRecolorHex] = useState('');
  const [showRecolor, setShowRecolor] = useState(false);
  const [recolorMode, setRecolorMode] = useState<'uniform' | 'multi'>('uniform');
  const [colorMap, setColorMap] = useState<Record<string, string>>({});
  const [showValidation, setShowValidation] = useState(false);

  const viewBox = icon?.viewBox || '0 0 24 24';
  const isFullSvg = icon?.svgPath?.includes('<') ?? false;
  const isCompleteSvg = isFullSvg && (icon?.svgPath?.trim().startsWith('<svg') ?? false);
  const sanitize = sanitizeSvg;

  // Extract unique colors from the SVG
  const svgColors = useMemo(() => {
    if (!icon?.svgPath) return [];
    return extractSvgColors(icon.svgPath);
  }, [icon?.svgPath]);

  // Validation results
  const validation = useMemo(() => {
    if (!icon?.svgPath) return null;
    return validateSvg(icon.svgPath);
  }, [icon?.svgPath]);

  const displaySvg = useMemo(() => {
    if (!icon?.svgPath) return '';
    // Multi-color mode
    if (recolorMode === 'multi' && Object.keys(colorMap).length > 0) {
      return recolorSvgMulti(icon.svgPath, colorMap);
    }
    // Uniform mode
    if (recolorHex) return recolorSvg(icon.svgPath, recolorHex);
    return icon.svgPath;
  }, [icon?.svgPath, recolorHex, recolorMode, colorMap]);

  if (!icon) return null;

  const generateSvgString = () => {
    const source = displaySvg;
    if (isCompleteSvg) {
      return sanitize(source);
    }
    if (isFullSvg) {
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" fill="currentColor">${sanitize(source)}</svg>`;
    }
    const fill = icon.fillMode === 'fill' ? (recolorHex || 'currentColor') : 'none';
    const stroke = icon.fillMode === 'stroke' ? (recolorHex || 'currentColor') : 'none';
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

  const handleApplyColor = () => {
    if (!onUpdateIcon) return;
    let newSvg: string;
    if (recolorMode === 'multi' && Object.keys(colorMap).length > 0) {
      newSvg = recolorSvgMulti(icon.svgPath, colorMap);
    } else if (recolorHex) {
      newSvg = recolorSvg(icon.svgPath, recolorHex);
    } else {
      return;
    }
    const updated: BrandIconography = { ...icon, svgPath: newSvg };
    onUpdateIcon(updated);
    toast.success('Icon color updated');
    setRecolorHex('');
    setColorMap({});
    setShowRecolor(false);
  };

  const renderPreviewIcon = () => {
    const size = Math.round((zoom / 100) * 200);

    if (isCompleteSvg) {
      return (
        <div
          style={{ width: size, height: size }}
          className="[&>svg]:w-full [&>svg]:h-full [&>svg]:block"
          dangerouslySetInnerHTML={{ __html: sanitize(displaySvg) }}
        />
      );
    }

    if (isFullSvg) {
      return (
        <svg viewBox={viewBox} style={{ width: size, height: size }} fill="currentColor">
          <g dangerouslySetInnerHTML={{ __html: sanitize(displaySvg) }} />
        </svg>
      );
    }

    return (
      <svg
        viewBox={viewBox}
        style={{ width: size, height: size }}
        fill={icon.fillMode === 'fill' ? (recolorHex || 'currentColor') : 'none'}
        stroke={icon.fillMode === 'stroke' ? (recolorHex || 'currentColor') : 'none'}
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

  const defaultSwatches = ['#000000', '#ffffff', '#ef4444', '#3b82f6', '#22c55e', '#f59e0b', '#8b5cf6', '#ec4899'];
  const swatches = brandColors.length > 0 ? [...brandColors, ...defaultSwatches.slice(brandColors.length)] : defaultSwatches;

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
          {/* Background Mode + Recolor Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 p-1 rounded-lg bg-muted w-fit">
              <Button variant={bgMode === 'light' ? 'secondary' : 'ghost'} size="sm" onClick={() => setBgMode('light')} className="h-7 px-3 text-xs">Light</Button>
              <Button variant={bgMode === 'dark' ? 'secondary' : 'ghost'} size="sm" onClick={() => setBgMode('dark')} className="h-7 px-3 text-xs">Dark</Button>
              <Button variant={bgMode === 'checker' ? 'secondary' : 'ghost'} size="sm" onClick={() => setBgMode('checker')} className="h-7 px-3 text-xs">Checker</Button>
            </div>
            <div className="flex items-center gap-1.5">
              <Button
                variant={showRecolor ? 'default' : 'outline'}
                size="sm"
                onClick={() => setShowRecolor(!showRecolor)}
                className="gap-1.5 h-7 text-xs"
              >
                <Palette className="h-3.5 w-3.5" />
                Recolor
              </Button>
              {validation && (
                <Button
                  variant={showValidation ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setShowValidation(!showValidation)}
                  className="gap-1.5 h-7 text-xs"
                >
                  <Badge
                    variant="outline"
                    className={cn(
                      'text-[9px] px-1.5 py-0',
                      validation.score >= 85 ? 'border-green-500 text-green-600' :
                      validation.score >= 70 ? 'border-blue-500 text-blue-600' :
                      validation.score >= 50 ? 'border-amber-500 text-amber-600' :
                      'border-red-500 text-red-600'
                    )}
                  >
                    {validation.score}
                  </Badge>
                  Quality
                </Button>
              )}
            </div>
          </div>

          {/* Validation Panel */}
          {showValidation && validation && (
            <div className="p-3 rounded-lg border bg-muted/30 space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium">SVG Quality Report</Label>
                <Badge
                  variant="outline"
                  className={cn(
                    'text-xs',
                    validation.score >= 85 ? 'border-green-500 text-green-600' :
                    validation.score >= 70 ? 'border-blue-500 text-blue-600' :
                    validation.score >= 50 ? 'border-amber-500 text-amber-600' :
                    'border-red-500 text-red-600'
                  )}
                >
                  Score: {validation.score}/100
                </Badge>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="p-2 rounded bg-background border">
                  <span className="text-muted-foreground">Points</span>
                  <p className="font-medium">{validation.anchorPoints}</p>
                </div>
                <div className="p-2 rounded bg-background border">
                  <span className="text-muted-foreground">Size</span>
                  <p className="font-medium">{(validation.fileSize / 1024).toFixed(1)}KB</p>
                </div>
                <div className="p-2 rounded bg-background border">
                  <span className="text-muted-foreground">Colors</span>
                  <p className="font-medium">{validation.colorCount}</p>
                </div>
              </div>
              <div className="space-y-1">
                {validation.issues.map((issue, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <span className={cn(
                      'w-1.5 h-1.5 rounded-full shrink-0',
                      issue.severity === 'pass' ? 'bg-green-500' :
                      issue.severity === 'warn' ? 'bg-amber-500' : 'bg-red-500'
                    )} />
                    <span className="font-medium">{issue.label}</span>
                    {issue.detail && <span className="text-muted-foreground">{issue.detail}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recolor Panel */}
          {showRecolor && (
            <div className="p-3 rounded-lg border bg-muted/30 space-y-3">
              {/* Mode toggle */}
              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium">Recolor Mode</Label>
                <div className="flex items-center gap-1 p-0.5 rounded-md bg-muted">
                  <Button
                    variant={recolorMode === 'uniform' ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => { setRecolorMode('uniform'); setColorMap({}); }}
                    className="h-6 px-2 text-[10px]"
                  >
                    Uniform
                  </Button>
                  <Button
                    variant={recolorMode === 'multi' ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => { setRecolorMode('multi'); setRecolorHex(''); }}
                    className="h-6 px-2 text-[10px] gap-1"
                    disabled={svgColors.length < 2}
                  >
                    <ArrowRightLeft className="h-3 w-3" />
                    Multi ({svgColors.length})
                  </Button>
                </div>
              </div>

              {recolorMode === 'uniform' ? (
                <>
                  <div className="flex items-center gap-2 flex-wrap">
                    {swatches.map((color) => (
                      <button
                        key={color}
                        onClick={() => setRecolorHex(color)}
                        className={cn(
                          'w-7 h-7 rounded-full border-2 transition-all',
                          recolorHex === color ? 'ring-2 ring-primary ring-offset-2 ring-offset-background scale-110' : 'border-border hover:scale-105'
                        )}
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                    <div className="flex items-center gap-1.5 ml-2">
                      <Input
                        type="color"
                        value={recolorHex || '#000000'}
                        onChange={(e) => setRecolorHex(e.target.value)}
                        className="w-8 h-7 p-0 border-0 cursor-pointer"
                      />
                      <Input
                        type="text"
                        placeholder="#hex"
                        value={recolorHex}
                        onChange={(e) => setRecolorHex(e.target.value)}
                        className="w-20 h-7 text-xs font-mono"
                      />
                    </div>
                  </div>
                </>
              ) : (
                <div className="space-y-2">
                  <p className="text-[10px] text-muted-foreground">Map each source color to a new color</p>
                  {svgColors.map((srcColor) => (
                    <div key={srcColor} className="flex items-center gap-2">
                      <div
                        className="w-6 h-6 rounded border shrink-0"
                        style={{ backgroundColor: srcColor }}
                        title={srcColor}
                      />
                      <span className="text-[10px] font-mono text-muted-foreground w-16 truncate">{srcColor}</span>
                      <span className="text-[10px] text-muted-foreground">→</span>
                      <Input
                        type="color"
                        value={colorMap[srcColor] || srcColor}
                        onChange={(e) => setColorMap(prev => ({ ...prev, [srcColor]: e.target.value }))}
                        className="w-7 h-6 p-0 border-0 cursor-pointer shrink-0"
                      />
                      <Input
                        type="text"
                        placeholder={srcColor}
                        value={colorMap[srcColor] || ''}
                        onChange={(e) => setColorMap(prev => ({ ...prev, [srcColor]: e.target.value }))}
                        className="w-20 h-6 text-[10px] font-mono"
                      />
                      {/* Brand color quick-picks */}
                      {brandColors.slice(0, 4).map(bc => (
                        <button
                          key={bc}
                          onClick={() => setColorMap(prev => ({ ...prev, [srcColor]: bc }))}
                          className="w-5 h-5 rounded-full border hover:scale-110 transition-transform shrink-0"
                          style={{ backgroundColor: bc }}
                          title={bc}
                        />
                      ))}
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-2">
                {((recolorMode === 'uniform' && recolorHex) || (recolorMode === 'multi' && Object.keys(colorMap).length > 0)) && onUpdateIcon && (
                  <Button size="sm" onClick={handleApplyColor} className="h-7 text-xs gap-1">
                    <Check className="h-3 w-3" />
                    Save Color
                  </Button>
                )}
                {(recolorHex || Object.keys(colorMap).length > 0) && (
                  <Button variant="ghost" size="sm" onClick={() => { setRecolorHex(''); setColorMap({}); }} className="h-7 text-xs">
                    Reset
                  </Button>
                )}
              </div>
            </div>
          )}

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
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setZoom(Math.max(25, zoom - 25))} disabled={zoom <= 25}>
              <ZoomOut className="h-4 w-4" />
            </Button>
            <div className="flex-1 flex items-center gap-3">
              <Slider value={[zoom]} onValueChange={([v]) => setZoom(v)} min={25} max={300} step={5} className="flex-1" />
              <span className="text-sm text-muted-foreground w-12 text-right">{zoom}%</span>
            </div>
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setZoom(Math.min(300, zoom + 25))} disabled={zoom >= 300}>
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setZoom(100)}>
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
                {copied ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
                {copied ? 'Copied' : 'Copy SVG'}
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-1" />
                    Download
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel className="text-xs">SVG</DropdownMenuLabel>
                  <DropdownMenuItem onClick={handleDownloadSvg}>
                    <FileCode className="h-4 w-4 mr-2" />
                    SVG (Vector)
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel className="text-xs">PNG</DropdownMenuLabel>
                  {[24, 48, 64, 128, 256, 512].map(size => (
                    <DropdownMenuItem key={size} onClick={() => handleDownloadPng(size)}>
                      <Image className="h-4 w-4 mr-2" />
                      PNG {size}×{size}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
