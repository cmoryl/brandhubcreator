/**
 * QuickFind Logo Widget - Compact logo finder with ZIP download
 */

import { useState, useMemo } from 'react';
import { Search, Download, X, Image as ImageIcon, Star, ChevronDown, Archive, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { useLogoFavorites } from '@/hooks/useLogoFavorites';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import JSZip from 'jszip';

interface LogoResult {
  id: string;
  logoId: string;
  name: string;
  url: string;
  variant: string;
  entityId: string;
  entityName: string;
  entityType: 'brand' | 'product' | 'event';
  entitySlug?: string;
}

interface QuickFindLogoProps {
  brands: Array<{
    id: string;
    name: string;
    slug?: string;
    logos?: Array<{ id: string; name: string; url: string; variant: string }>;
  }>;
  products: Array<{
    id: string;
    name: string;
    slug?: string;
    logos?: Array<{ id: string; name: string; url: string; variant: string }>;
  }>;
  events: Array<{
    id: string;
    name: string;
    slug?: string;
    logos?: Array<{ id: string; name: string; url: string; variant: string }>;
  }>;
  accentColor?: string;
  className?: string;
}

export const QuickFindLogo = ({
  brands,
  products,
  events,
  accentColor = '#6366f1',
  className,
}: QuickFindLogoProps) => {
  const { user } = useAuth();
  const { favorites, isFavorite, toggleFavorite } = useLogoFavorites();
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [previewLogo, setPreviewLogo] = useState<LogoResult | null>(null);
  const [isDownloadingAll, setIsDownloadingAll] = useState(false);

  // Aggregate all logos
  const allLogos = useMemo(() => {
    const logos: LogoResult[] = [];
    brands.forEach((brand) => {
      brand.logos?.forEach((logo) => {
        logos.push({
          id: `brand-${brand.id}-${logo.id}`,
          logoId: logo.id,
          name: logo.name,
          url: logo.url,
          variant: logo.variant,
          entityId: brand.id,
          entityName: brand.name,
          entityType: 'brand',
          entitySlug: brand.slug,
        });
      });
    });
    products.forEach((product) => {
      product.logos?.forEach((logo) => {
        logos.push({
          id: `product-${product.id}-${logo.id}`,
          logoId: logo.id,
          name: logo.name,
          url: logo.url,
          variant: logo.variant,
          entityId: product.id,
          entityName: product.name,
          entityType: 'product',
          entitySlug: product.slug,
        });
      });
    });
    events.forEach((event) => {
      event.logos?.forEach((logo) => {
        logos.push({
          id: `event-${event.id}-${logo.id}`,
          logoId: logo.id,
          name: logo.name,
          url: logo.url,
          variant: logo.variant,
          entityId: event.id,
          entityName: event.name,
          entityType: 'event',
          entitySlug: event.slug,
        });
      });
    });
    return logos;
  }, [brands, products, events]);

  // Filter logos
  const filteredLogos = useMemo(() => {
    if (!searchQuery.trim()) return allLogos.slice(0, 9);
    const query = searchQuery.toLowerCase();
    return allLogos.filter(
      (logo) =>
        logo.name.toLowerCase().includes(query) ||
        logo.entityName.toLowerCase().includes(query) ||
        logo.variant.toLowerCase().includes(query)
    );
  }, [allLogos, searchQuery]);

  // Single file download
  const handleDownload = async (logo: LogoResult, format?: 'png' | 'jpg' | 'webp') => {
    try {
      const response = await fetch(logo.url);
      const blob = await response.blob();
      const originalExt = logo.url.split('.').pop()?.split('?')[0]?.toLowerCase() || 'png';
      
      if (format && format !== originalExt) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = reject;
          img.src = URL.createObjectURL(blob);
        });
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          if (format === 'jpg') {
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
          }
          ctx.drawImage(img, 0, 0);
          const mimeType = format === 'jpg' ? 'image/jpeg' : format === 'webp' ? 'image/webp' : 'image/png';
          canvas.toBlob((convertedBlob) => {
            if (convertedBlob) {
              const url = URL.createObjectURL(convertedBlob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `${logo.entityName}-${logo.name}.${format}`;
              a.click();
              URL.revokeObjectURL(url);
              toast.success(`Downloaded as ${format.toUpperCase()}`);
            }
          }, mimeType, 0.92);
        }
        URL.revokeObjectURL(img.src);
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${logo.entityName}-${logo.name}.${originalExt}`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success('Downloaded');
      }
    } catch {
      toast.error('Download failed');
      window.open(logo.url, '_blank');
    }
  };

  // Download all as ZIP
  const handleDownloadAll = async (logos: LogoResult[]) => {
    if (logos.length === 0) return;
    
    setIsDownloadingAll(true);
    const loadingToast = toast.loading(`Preparing ${logos.length} logos...`);
    
    try {
      const zip = new JSZip();
      const folders: Record<string, JSZip> = {};
      
      // Create folders for each entity type
      folders['brands'] = zip.folder('brands')!;
      folders['products'] = zip.folder('products')!;
      folders['events'] = zip.folder('events')!;
      
      let successCount = 0;
      
      for (const logo of logos) {
        try {
          const response = await fetch(logo.url);
          if (!response.ok) continue;
          
          const blob = await response.blob();
          const ext = logo.url.split('.').pop()?.split('?')[0]?.toLowerCase() || 'png';
          const fileName = `${logo.entityName}/${logo.name}-${logo.variant}.${ext}`.replace(/[<>:"/\\|?*]/g, '_');
          
          const folder = folders[`${logo.entityType}s`];
          if (folder) {
            folder.file(fileName, blob);
            successCount++;
          }
        } catch (err) {
          console.warn(`Failed to fetch ${logo.name}:`, err);
        }
      }
      
      if (successCount === 0) {
        toast.dismiss(loadingToast);
        toast.error('No logos could be downloaded');
        return;
      }
      
      const content = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = `logos-${new Date().toISOString().split('T')[0]}.zip`;
      a.click();
      URL.revokeObjectURL(url);
      
      toast.dismiss(loadingToast);
      toast.success(`Downloaded ${successCount} logos as ZIP`);
    } catch (err) {
      console.error('ZIP creation failed:', err);
      toast.dismiss(loadingToast);
      toast.error('Failed to create ZIP file');
    } finally {
      setIsDownloadingAll(false);
    }
  };

  const handleToggleFavorite = (logo: LogoResult) => {
    toggleFavorite({
      entityId: logo.entityId,
      entityType: logo.entityType,
      logoId: logo.logoId,
      logoName: logo.name,
      logoUrl: logo.url,
      logoVariant: logo.variant,
      entityName: logo.entityName,
      entitySlug: logo.entitySlug,
    });
  };

  if (allLogos.length === 0) return null;

  return (
    <>
      <div className={cn('w-full max-w-sm', className)}>
        {!isExpanded ? (
          <button
            onClick={() => setIsExpanded(true)}
            className="group flex items-center gap-2 px-3 py-1.5 rounded-full border border-border/50 bg-background/60 backdrop-blur-sm hover:bg-background/90 transition-all text-sm"
          >
            <ImageIcon className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-muted-foreground">Logos</span>
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
              {allLogos.length}
            </Badge>
          </button>
        ) : (
          <div className="rounded-lg border border-border/50 bg-background/95 backdrop-blur-md p-3 shadow-lg animate-fade-in">
            {/* Header */}
            <div className="flex items-center gap-2 mb-2">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search logos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-7 h-8 text-sm"
                  autoFocus
                />
              </div>
              {/* Download All Button */}
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={() => handleDownloadAll(allLogos)}
                disabled={isDownloadingAll}
                title="Download all as ZIP"
              >
                {isDownloadingAll ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Archive className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={() => { setIsExpanded(false); setSearchQuery(''); }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Compact Grid */}
            <div className="grid grid-cols-3 gap-1.5 max-h-[180px] overflow-y-auto">
              {filteredLogos.length > 0 ? (
                filteredLogos.map((logo) => {
                  const isFav = isFavorite(logo.entityId, logo.logoId);
                  return (
                    <button
                      key={logo.id}
                      onClick={() => setPreviewLogo(logo)}
                      className="group relative aspect-square rounded border border-border/30 bg-white dark:bg-muted/30 p-1.5 hover:border-border hover:shadow-sm transition-all"
                    >
                      {isFav && (
                        <Star className="absolute top-0.5 right-0.5 h-2.5 w-2.5 text-amber-500 fill-amber-500" />
                      )}
                      <img
                        src={logo.url}
                        alt={logo.name}
                        className="w-full h-full object-contain"
                        loading="lazy"
                      />
                    </button>
                  );
                })
              ) : (
                <p className="col-span-3 py-4 text-center text-xs text-muted-foreground">
                  No logos found
                </p>
              )}
            </div>

            {searchQuery && filteredLogos.length > 0 && (
              <p className="text-[10px] text-muted-foreground mt-1.5">
                {filteredLogos.length} of {allLogos.length}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Preview Dialog */}
      <Dialog open={!!previewLogo} onOpenChange={(open) => !open && setPreviewLogo(null)}>
        <DialogContent className="max-w-md p-4">
          {previewLogo && (
            <div className="space-y-4">
              {/* Preview */}
              <div className="aspect-square bg-[repeating-conic-gradient(#e5e5e5_0%_25%,#f5f5f5_0%_50%)] dark:bg-[repeating-conic-gradient(#333_0%_25%,#444_0%_50%)] bg-[length:16px_16px] rounded-lg flex items-center justify-center p-6">
                <img src={previewLogo.url} alt={previewLogo.name} className="max-h-full max-w-full object-contain" />
              </div>
              
              {/* Info & Actions */}
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-medium text-sm truncate">{previewLogo.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{previewLogo.entityName} • {previewLogo.variant}</p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {user && (
                    <Button
                      size="icon"
                      variant={isFavorite(previewLogo.entityId, previewLogo.logoId) ? 'default' : 'outline'}
                      className={cn('h-8 w-8', isFavorite(previewLogo.entityId, previewLogo.logoId) && 'bg-amber-500 hover:bg-amber-600')}
                      onClick={() => handleToggleFavorite(previewLogo)}
                    >
                      <Star className={cn('h-4 w-4', isFavorite(previewLogo.entityId, previewLogo.logoId) && 'fill-current')} />
                    </Button>
                  )}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="sm" className="h-8 gap-1.5">
                        <Download className="h-4 w-4" />
                        <ChevronDown className="h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleDownload(previewLogo)}>Original</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDownload(previewLogo, 'png')}>PNG</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDownload(previewLogo, 'jpg')}>JPG</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDownload(previewLogo, 'webp')}>WebP</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => handleDownloadAll(allLogos)} disabled={isDownloadingAll}>
                        <Archive className="h-4 w-4 mr-2" />
                        All Logos (ZIP)
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
