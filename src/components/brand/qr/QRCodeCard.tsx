/**
 * QRCodeCard - Individual QR code display card with styled rendering
 */

import { useState, useEffect, useRef } from 'react';
import QRCodeStyling, { DotType, CornerDotType, CornerSquareType } from 'qr-code-styling';
import { Download, Pencil, Trash2, Copy, Check, ExternalLink, QrCode as QrCodeIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { QRCode as QRCodeType } from '@/hooks/useQRCodes';

interface QRCodeCardProps {
  qrCode: QRCodeType;
  canEdit: boolean;
  onEdit: () => void;
  onDelete: () => void;
  variant?: 'grid' | 'list';
}

const USE_CASE_LABELS: Record<string, { label: string; color: string }> = {
  event: { label: 'Event', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' },
  product: { label: 'Product', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
  marketing: { label: 'Marketing', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' },
  contact: { label: 'Contact', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
  wifi: { label: 'WiFi', color: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400' },
  other: { label: 'Other', color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300' },
};

export const QRCodeCard = ({ qrCode, canEdit, onEdit, onDelete, variant = 'grid' }: QRCodeCardProps) => {
  const [copied, setCopied] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Helper to check if URL is valid for QR generation
  const isValidUrl = (url: string): boolean => {
    if (!url || url.trim() === '' || url === 'https://' || url === 'http://') return false;
    try {
      new URL(url);
      return true;
    } catch {
      return url.length > 5; // Allow non-URL text data
    }
  };

  // Create QRCodeStyling instance
  const createQRInstance = (size: number) => {
    // Determine if we have a valid logo to show
    const hasValidLogo = qrCode.logoType !== 'none' && qrCode.logoUrl && qrCode.logoUrl.trim() !== '';
    
    return new QRCodeStyling({
      width: size,
      height: size,
      type: 'svg',
      data: qrCode.url || 'https://example.com',
      dotsOptions: {
        color: qrCode.fgColor,
        type: (qrCode.dotStyle || 'square') as DotType,
      },
      cornersSquareOptions: {
        color: qrCode.fgColor,
        type: ((qrCode.cornerStyle || 'square') === 'dot' ? 'dot' : (qrCode.cornerStyle || 'square')) as CornerSquareType,
      },
      cornersDotOptions: {
        color: qrCode.fgColor,
        type: (qrCode.cornerStyle || 'square') as CornerDotType,
      },
      backgroundOptions: {
        color: qrCode.bgColor,
      },
      ...(hasValidLogo ? {
        imageOptions: {
          crossOrigin: 'anonymous',
          margin: 4,
          hideBackgroundDots: true,
        },
        image: qrCode.logoUrl,
      } : {}),
      qrOptions: {
        errorCorrectionLevel: qrCode.errorCorrection,
      },
    });
  };

  // Render QR code preview - works for both variants
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    
    // Skip rendering if URL is invalid
    if (!isValidUrl(qrCode.url)) {
      container.innerHTML = '';
      return;
    }
    
    const size = variant === 'list' ? 56 : 200;
    const qrInstance = createQRInstance(size);
    
    // Use requestAnimationFrame to ensure DOM is ready
    const renderQR = () => {
      try {
        container.innerHTML = '';
        qrInstance.append(container);
      } catch (error) {
        console.warn('[QRCodeCard] Failed to render QR code:', error);
      }
    };
    
    const rafId = requestAnimationFrame(renderQR);
    
    return () => {
      cancelAnimationFrame(rafId);
      container.innerHTML = '';
    };
  }, [qrCode.url, qrCode.fgColor, qrCode.bgColor, qrCode.errorCorrection, qrCode.dotStyle, qrCode.cornerStyle, qrCode.logoUrl, qrCode.logoType, variant]);

  const copyUrl = async () => {
    await navigator.clipboard.writeText(qrCode.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadPNG = async () => {
    setIsDownloading(true);
    try {
      const qr = createQRInstance(qrCode.size);
      await qr.download({ name: `${qrCode.name.replace(/[^a-z0-9]/gi, '_')}-qr`, extension: 'png' });
    } catch (err) {
      console.error('PNG download error:', err);
    } finally {
      setIsDownloading(false);
    }
  };

  const downloadSVG = async () => {
    setIsDownloading(true);
    try {
      const qr = createQRInstance(qrCode.size);
      
      // Get the raw SVG blob
      const blob = await qr.getRawData('svg');
      if (!blob) throw new Error('Failed to generate SVG');
      
      const svgText$ = blob instanceof Blob ? blob.text() : Promise.resolve(new TextDecoder().decode(blob));
      let svgText = await svgText$;
      
      // If there's a logo, embed it as base64 data URI in the SVG
      const hasValidLogo = qrCode.logoType !== 'none' && qrCode.logoUrl && qrCode.logoUrl.trim() !== '';
      if (hasValidLogo && qrCode.logoUrl) {
        try {
          const logoResponse = await fetch(qrCode.logoUrl, { mode: 'cors' });
          const logoBlob = await logoResponse.blob();
          const logoDataUri = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(logoBlob);
          });
          
          // Replace any xlink:href or href pointing to the logo URL with the data URI
          svgText = svgText.replace(
            new RegExp(`(xlink:href|href)=["']${qrCode.logoUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["']`, 'g'),
            `$1="${logoDataUri}"`
          );
          
          // Also handle cases where the library uses a generic image reference
          if (!svgText.includes(logoDataUri) && svgText.includes('<image')) {
            svgText = svgText.replace(
              /(<image[^>]*(?:xlink:href|href)=["'])((?:blob:|http)[^"']*)(["'])/g,
              `$1${logoDataUri}$3`
            );
          }
        } catch (logoErr) {
          console.warn('Could not embed logo in SVG, exporting without:', logoErr);
        }
      }
      
      const svgBlob = new Blob([svgText], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(svgBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${qrCode.name.replace(/[^a-z0-9]/gi, '_')}-qr.svg`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('SVG download error:', err);
    } finally {
      setIsDownloading(false);
    }
  };

  const useCaseConfig = qrCode.useCase ? USE_CASE_LABELS[qrCode.useCase] : null;

  // List variant - horizontal compact layout
  if (variant === 'list') {
    return (
      <Card className="group overflow-hidden hover:border-primary/50 transition-colors">
        <div className="flex items-center gap-4 p-3">
          {/* QR Preview Thumbnail - using qr-code-styling */}
          <div 
            ref={containerRef}
            className="w-16 h-16 bg-white rounded-lg flex items-center justify-center shrink-0 border [&>svg]:max-w-full [&>svg]:max-h-full [&>svg]:p-1"
          >
            {!qrCode.url && <QrCodeIcon className="h-6 w-6 text-muted-foreground/30" />}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="font-semibold text-sm truncate">{qrCode.name}</h4>
              {useCaseConfig && (
                <Badge className={cn("shrink-0", useCaseConfig.color)} variant="secondary">
                  {useCaseConfig.label}
                </Badge>
              )}
            </div>
            <p className="text-xs font-mono text-muted-foreground truncate mt-0.5">{qrCode.url}</p>
            {qrCode.description && (
              <p className="text-xs text-muted-foreground/70 truncate mt-0.5">{qrCode.description}</p>
            )}
          </div>

          {/* Color swatches */}
          <div className="flex items-center gap-1 shrink-0">
            <div 
              className="w-5 h-5 rounded border border-border" 
              style={{ backgroundColor: qrCode.fgColor }}
              title={qrCode.fgColor}
            />
            <div 
              className="w-5 h-5 rounded border border-border" 
              style={{ backgroundColor: qrCode.bgColor }}
              title={qrCode.bgColor}
            />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 shrink-0">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={copyUrl}>
                  {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>{copied ? 'Copied!' : 'Copy URL'}</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={downloadPNG} disabled={isDownloading}>
                  <Download className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Download PNG</TooltipContent>
            </Tooltip>
            {canEdit && (
              <>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={onEdit}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Edit</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive" onClick={onDelete}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Delete</TooltipContent>
                </Tooltip>
              </>
            )}
          </div>
        </div>
      </Card>
    );
  }

  // Grid variant - card layout with styled QR
  return (
    <Card className="group overflow-hidden hover:border-primary/50 transition-colors">
      {/* QR Code Preview - using qr-code-styling */}
      <div className="aspect-square bg-white flex items-center justify-center p-4 relative">
        <div 
          ref={containerRef}
          className="w-full h-full flex items-center justify-center [&>svg]:max-w-full [&>svg]:max-h-full"
        >
          {!qrCode.url && (
            <div className="w-full h-full bg-muted animate-pulse rounded flex items-center justify-center">
              <QrCodeIcon className="h-12 w-12 text-muted-foreground/30" />
            </div>
          )}
        </div>

        {/* Use case badge */}
        {useCaseConfig && (
          <Badge className={cn("absolute top-2 left-2", useCaseConfig.color)}>
            {useCaseConfig.label}
          </Badge>
        )}

        {/* Admin actions overlay */}
        {canEdit && (
          <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  variant="secondary"
                  className="h-7 w-7"
                  onClick={onEdit}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Edit</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  variant="destructive"
                  className="h-7 w-7"
                  onClick={onDelete}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Delete</TooltipContent>
            </Tooltip>
          </div>
        )}
      </div>

      <CardContent className="p-4 space-y-3">
        {/* Name & Description */}
        <div>
          <h4 className="font-semibold text-sm truncate">{qrCode.name}</h4>
          {qrCode.description && (
            <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{qrCode.description}</p>
          )}
        </div>

        {/* URL display */}
        <div className="flex items-center gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-mono text-muted-foreground truncate bg-muted/50 px-2 py-1 rounded">
              {qrCode.url}
            </p>
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0" onClick={copyUrl}>
                {copied ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{copied ? 'Copied!' : 'Copy URL'}</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                size="icon" 
                variant="ghost" 
                className="h-7 w-7 shrink-0"
                onClick={() => window.open(qrCode.url, '_blank')}
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Open URL</TooltipContent>
          </Tooltip>
        </div>

        {/* Download buttons */}
        <div className="flex gap-2">
          <Button 
            size="sm" 
            variant="outline" 
            className="flex-1 gap-1.5 text-xs"
            onClick={downloadPNG}
            disabled={isDownloading}
          >
            <Download className="h-3.5 w-3.5" />
            PNG
          </Button>
          <Button 
            size="sm" 
            variant="outline" 
            className="flex-1 gap-1.5 text-xs"
            onClick={downloadSVG}
            disabled={isDownloading}
          >
            <Download className="h-3.5 w-3.5" />
            SVG
          </Button>
        </div>

        {/* Color swatches */}
        <div className="flex items-center gap-2 pt-1 border-t border-border">
          <div className="flex items-center gap-1.5">
            <div 
              className="w-4 h-4 rounded border border-border" 
              style={{ backgroundColor: qrCode.fgColor }}
            />
            <span className="text-[10px] font-mono text-muted-foreground uppercase">{qrCode.fgColor}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div 
              className="w-4 h-4 rounded border border-border" 
              style={{ backgroundColor: qrCode.bgColor }}
            />
            <span className="text-[10px] font-mono text-muted-foreground uppercase">{qrCode.bgColor}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
