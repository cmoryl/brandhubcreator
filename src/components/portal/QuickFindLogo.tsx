/**
 * QuickFind Logo Widget
 * A search-enabled logo finder for the organization portal hero section
 * Supports favorites with database persistence
 */

import { useState, useMemo } from 'react';
import { Search, Download, ExternalLink, X, Image as ImageIcon, Heart, Star } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useLogoFavorites } from '@/hooks/useLogoFavorites';
import { useAuth } from '@/contexts/AuthContext';

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

  // Handle download
  const handleDownload = async (logo: LogoResult) => {
    try {
      const response = await fetch(logo.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const extension = logo.url.split('.').pop()?.split('?')[0] || 'png';
      a.download = `${logo.entityName}-${logo.name}.${extension}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
      // Fallback: open in new tab
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
    <div className={cn('w-full', className)}>
      {/* Collapsed State - Click to expand */}
      {!isExpanded ? (
        <button
          onClick={() => setIsExpanded(true)}
          className="group flex items-center gap-2 px-3 py-2 rounded-lg border border-border/50 bg-background/50 backdrop-blur-sm hover:bg-background/80 hover:border-border transition-all duration-200"
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
        <div className="rounded-xl border border-border/50 bg-background/80 backdrop-blur-sm p-4 animate-fade-in">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <ImageIcon className="h-4 w-4" style={{ color: accentColor }} />
              <span className="text-sm font-medium">QuickFind Logo</span>
              <Badge variant="secondary" className="text-xs px-1.5 py-0">
                {allLogos.length} logos
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
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-[240px] overflow-y-auto">
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
                    <div className="absolute inset-0 bg-background/90 backdrop-blur-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
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
                        onClick={() => handleDownload(logo)}
                        title="Download"
                      >
                        <Download className="h-3.5 w-3.5" />
                      </Button>
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
  );
};
