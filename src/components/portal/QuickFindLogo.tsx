/**
 * QuickFind Logo Widget
 * A search-enabled logo finder for the organization portal hero section
 * Supports favorites with database persistence, format downloads, and full preview
 */

import { useState, useMemo } from 'react';
import { Search, Download, ExternalLink, X, Image as ImageIcon, Star, ZoomIn, ChevronDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { useLogoFavorites } from '@/hooks/useLogoFavorites';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface LogoResult {
  id: string;
  logoId: string; // Original logo ID from guide_data
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
  const { favorites, isFavorite, toggleFavorite, isLoading: favoritesLoading } = useLogoFavorites();
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [previewLogo, setPreviewLogo] = useState<LogoResult | null>(null);

  // Aggregate all logos from all entities
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

  // Filter logos based on search query and favorites filter
  const filteredLogos = useMemo(() => {
    let results = allLogos;

    // Apply favorites filter
    if (showFavoritesOnly) {
      results = results.filter((logo) => isFavorite(logo.entityId, logo.logoId));
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      results = results.filter(
        (logo) =>
          logo.name.toLowerCase().includes(query) ||
          logo.entityName.toLowerCase().includes(query) ||
          logo.variant.toLowerCase().includes(query)
      );
    } else if (!showFavoritesOnly) {
      // Show first 12 when no search and not viewing favorites
      results = results.slice(0, 12);
    }

    return results;
  }, [allLogos, searchQuery, showFavoritesOnly, isFavorite]);

  // Handle download with format selection
  const handleDownload = async (logo: LogoResult, format?: 'png' | 'jpg' | 'svg' | 'webp') => {
    try {
      const response = await fetch(logo.url);
      const blob = await response.blob();
      
      // Determine original extension
      const originalExt = logo.url.split('.').pop()?.split('?')[0]?.toLowerCase() || 'png';
      const targetFormat = format || originalExt;
      
      // For format conversion, we need to use canvas (except for SVG which we download as-is)
      if (format && format !== originalExt && format !== 'svg' && originalExt !== 'svg') {
        // Create image and canvas for conversion
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
          // For JPG, fill with white background first
          if (format === 'jpg') {
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
          }
          ctx.drawImage(img, 0, 0);
          
          const mimeType = format === 'jpg' ? 'image/jpeg' : format === 'webp' ? 'image/webp' : 'image/png';
          const quality = format === 'jpg' || format === 'webp' ? 0.92 : undefined;
          
          canvas.toBlob((convertedBlob) => {
            if (convertedBlob) {
              const url = URL.createObjectURL(convertedBlob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `${logo.entityName}-${logo.name}.${format}`;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              URL.revokeObjectURL(url);
              toast.success(`Downloaded as ${format.toUpperCase()}`);
            }
          }, mimeType, quality);
        }
        
        URL.revokeObjectURL(img.src);
      } else {
        // Direct download without conversion
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${logo.entityName}-${logo.name}.${targetFormat}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success('Downloaded successfully');
      }
    } catch (error) {
      console.error('Download failed:', error);
      toast.error('Download failed. Opening in new tab instead.');
      window.open(logo.url, '_blank');
    }
  };

  // Handle favorite toggle
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

  // Don't render if no logos available
  if (allLogos.length === 0) return null;

  const getEntityTypeColor = (type: 'brand' | 'product' | 'event') => {
    switch (type) {
      case 'brand':
        return 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20';
      case 'product':
        return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
      case 'event':
        return 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20';
    }
  };

  return (
    <>
      <div className={cn('w-full max-w-xs', className)}>
        {/* Collapsed State - Click to expand */}
        {!isExpanded ? (
          <button
            onClick={() => setIsExpanded(true)}
            className="group flex items-center gap-2 px-3 py-2 rounded-lg border border-border/50 bg-background/80 backdrop-blur-sm hover:bg-background hover:border-border transition-all duration-200 shadow-sm"
          >
            <ImageIcon className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
            <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
              QuickFind Logo
            </span>
            <Badge variant="secondary" className="text-xs px-1.5 py-0">
              {allLogos.length}
            </Badge>
            {user && favorites.length > 0 && (
              <Badge variant="outline" className="text-xs px-1.5 py-0 gap-0.5 text-amber-600 dark:text-amber-400 border-amber-500/30">
                <Star className="h-2.5 w-2.5 fill-current" />
                {favorites.length}
              </Badge>
            )}
          </button>
        ) : (
          /* Expanded State */
          <div className="rounded-xl border border-border/50 bg-background/95 backdrop-blur-md p-4 animate-fade-in shadow-lg">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <ImageIcon className="h-4 w-4" style={{ color: accentColor }} />
                <span className="text-sm font-medium">QuickFind Logo</span>
                <Badge variant="secondary" className="text-xs px-1.5 py-0">
                  {allLogos.length}
                </Badge>
              </div>
              <div className="flex items-center gap-1">
                {/* Favorites Toggle */}
                {user && (
                  <Button
                    variant={showFavoritesOnly ? 'default' : 'ghost'}
                    size="sm"
                    className={cn(
                      'h-6 px-2 gap-1 text-xs',
                      showFavoritesOnly && 'bg-amber-500 hover:bg-amber-600 text-white'
                    )}
                    onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                    disabled={favoritesLoading}
                  >
                    <Star className={cn('h-3 w-3', showFavoritesOnly && 'fill-current')} />
                    {favorites.length}
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => {
                    setIsExpanded(false);
                    setSearchQuery('');
                    setShowFavoritesOnly(false);
                  }}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            {/* Search Input */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder={showFavoritesOnly ? "Search favorites..." : "Search by name, brand, or variant..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 text-sm bg-muted/30"
                autoFocus
              />
            </div>

            {/* Results Grid */}
            <div className="grid grid-cols-3 gap-2 max-h-[280px] overflow-y-auto">
              {filteredLogos.length > 0 ? (
                filteredLogos.map((logo) => {
                  const isLogoFavorite = isFavorite(logo.entityId, logo.logoId);
                  return (
                    <div
                      key={logo.id}
                      className="group relative rounded-lg border border-border/50 bg-white dark:bg-muted/20 p-2 hover:border-border hover:shadow-sm transition-all duration-200"
                    >
                      {/* Favorite indicator */}
                      {isLogoFavorite && (
                        <div className="absolute top-1 right-1 z-10">
                          <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                        </div>
                      )}

                      {/* Logo Preview */}
                      <div className="aspect-square w-full flex items-center justify-center p-1.5 mb-1.5">
                        <img
                          src={logo.url}
                          alt={logo.name}
                          className="max-h-full max-w-full object-contain"
                          loading="lazy"
                        />
                      </div>

                      {/* Logo Info */}
                      <div className="space-y-1">
                        <p className="text-[10px] font-medium text-foreground truncate" title={logo.name}>
                          {logo.name}
                        </p>
                        <Badge
                          variant="outline"
                          className={cn('text-[9px] px-1 py-0 capitalize', getEntityTypeColor(logo.entityType))}
                        >
                          {logo.entityName}
                        </Badge>
                      </div>

                      {/* Hover Actions */}
                      <div className="absolute inset-0 bg-background/95 backdrop-blur-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5 p-2">
                        <div className="flex items-center gap-1">
                          {user && (
                            <Button
                              size="icon"
                              variant={isLogoFavorite ? 'default' : 'outline'}
                              className={cn(
                                'h-7 w-7',
                                isLogoFavorite && 'bg-amber-500 hover:bg-amber-600 text-white'
                              )}
                              onClick={() => handleToggleFavorite(logo)}
                              title={isLogoFavorite ? 'Remove from favorites' : 'Add to favorites'}
                            >
                              <Star className={cn('h-3.5 w-3.5', isLogoFavorite && 'fill-current')} />
                            </Button>
                          )}
                          <Button
                            size="icon"
                            variant="outline"
                            className="h-7 w-7"
                            onClick={() => setPreviewLogo(logo)}
                            title="View larger"
                          >
                            <ZoomIn className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                        <div className="flex items-center gap-1">
                          {/* Download with format options */}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 px-2 gap-1 text-xs"
                              >
                                <Download className="h-3 w-3" />
                                <ChevronDown className="h-2.5 w-2.5" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="center" className="min-w-[100px]">
                              <DropdownMenuItem onClick={() => handleDownload(logo)}>
                                Original
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDownload(logo, 'png')}>
                                PNG
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDownload(logo, 'jpg')}>
                                JPG
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDownload(logo, 'webp')}>
                                WebP
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                          <Button
                            size="icon"
                            variant="outline"
                            className="h-7 w-7"
                            onClick={() => window.open(logo.url, '_blank')}
                            title="Open in new tab"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="col-span-full py-6 text-center text-sm text-muted-foreground">
                  {showFavoritesOnly && !searchQuery
                    ? "No favorites yet. Click the star on any logo to add it."
                    : `No logos found for "${searchQuery}"`}
                </div>
              )}
            </div>

            {/* Results Count */}
            {(searchQuery || showFavoritesOnly) && filteredLogos.length > 0 && (
              <p className="text-xs text-muted-foreground mt-2">
                Showing {filteredLogos.length} {showFavoritesOnly ? 'favorite' : ''} logo{filteredLogos.length !== 1 ? 's' : ''}
                {!showFavoritesOnly && ` of ${allLogos.length}`}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Full Preview Dialog */}
      <Dialog open={!!previewLogo} onOpenChange={(open) => !open && setPreviewLogo(null)}>
        <DialogContent className="max-w-2xl">
          {previewLogo && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {previewLogo.name}
                  <Badge variant="outline" className={cn('text-xs capitalize', getEntityTypeColor(previewLogo.entityType))}>
                    {previewLogo.entityName}
                  </Badge>
                </DialogTitle>
              </DialogHeader>
              <div className="flex flex-col items-center gap-6">
                {/* Large Preview */}
                <div className="w-full aspect-video bg-[repeating-conic-gradient(#e5e5e5_0%_25%,#f5f5f5_0%_50%)] dark:bg-[repeating-conic-gradient(#333_0%_25%,#444_0%_50%)] bg-[length:20px_20px] rounded-lg flex items-center justify-center p-8">
                  <img
                    src={previewLogo.url}
                    alt={previewLogo.name}
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
                
                {/* Actions */}
                <div className="flex flex-wrap items-center justify-center gap-2">
                  {user && (
                    <Button
                      variant={isFavorite(previewLogo.entityId, previewLogo.logoId) ? 'default' : 'outline'}
                      size="sm"
                      className={cn(
                        'gap-2',
                        isFavorite(previewLogo.entityId, previewLogo.logoId) && 'bg-amber-500 hover:bg-amber-600 text-white'
                      )}
                      onClick={() => handleToggleFavorite(previewLogo)}
                    >
                      <Star className={cn('h-4 w-4', isFavorite(previewLogo.entityId, previewLogo.logoId) && 'fill-current')} />
                      {isFavorite(previewLogo.entityId, previewLogo.logoId) ? 'Favorited' : 'Add to Favorites'}
                    </Button>
                  )}
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="gap-2">
                        <Download className="h-4 w-4" />
                        Download
                        <ChevronDown className="h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => handleDownload(previewLogo)}>
                        Original Format
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDownload(previewLogo, 'png')}>
                        PNG (Transparent)
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDownload(previewLogo, 'jpg')}>
                        JPG (White Background)
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDownload(previewLogo, 'webp')}>
                        WebP (Optimized)
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => window.open(previewLogo.url, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4" />
                    Open Original
                  </Button>
                </div>

                {/* Metadata */}
                <div className="text-center text-sm text-muted-foreground">
                  <p>Variant: <span className="font-medium text-foreground">{previewLogo.variant}</span></p>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
