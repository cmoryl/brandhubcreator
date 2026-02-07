/**
 * FavoritesFilter - Floating button and controls for section favorites filtering
 */

import { useState } from 'react';
import { Star, X, Filter, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { useSectionFavorites } from '@/hooks/useSectionFavorites';

interface FavoritesFilterProps {
  entityType: 'brand' | 'product' | 'event';
  entityId: string | undefined;
  showFavoritesOnly: boolean;
  onToggleFilter: () => void;
}

export const FavoritesFilter = ({
  entityType,
  entityId,
  showFavoritesOnly,
  onToggleFilter,
}: FavoritesFilterProps) => {
  const {
    favoriteCount,
    hasFavorites,
    isAuthenticated,
    clearAllFavorites,
    isClearing,
  } = useSectionFavorites({ entityType, entityId });

  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Don't show if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="fixed bottom-6 right-6 z-40">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="gap-2 shadow-lg bg-background/95 backdrop-blur-sm border-muted-foreground/20"
              disabled
            >
              <LogIn className="h-4 w-4" />
              <span className="hidden sm:inline">Sign in to save favorites</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Sign in to save your favorite sections</TooltipContent>
        </Tooltip>
      </div>
    );
  }

  const handleClear = async () => {
    await clearAllFavorites();
    setShowClearConfirm(false);
    if (showFavoritesOnly) {
      onToggleFilter(); // Exit favorites-only mode when clearing
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-40 flex items-center gap-2">
      {/* Clear confirmation */}
      {showClearConfirm && (
        <div className="flex items-center gap-2 bg-destructive/10 border border-destructive/30 rounded-lg px-3 py-2 shadow-lg animate-in slide-in-from-right-2">
          <span className="text-sm text-destructive">Clear all favorites?</span>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleClear}
            disabled={isClearing}
          >
            {isClearing ? 'Clearing...' : 'Yes'}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowClearConfirm(false)}
          >
            No
          </Button>
        </div>
      )}

      {/* Main filter button */}
      <div className="flex items-center gap-1 bg-background/95 backdrop-blur-sm rounded-lg shadow-lg border border-border p-1">
        {/* Toggle favorites filter */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={showFavoritesOnly ? 'default' : 'ghost'}
              size="sm"
              onClick={onToggleFilter}
              disabled={!hasFavorites && !showFavoritesOnly}
              className={cn(
                'gap-2 transition-all',
                showFavoritesOnly && 'bg-primary text-primary-foreground'
              )}
            >
              <Star
                className={cn(
                  'h-4 w-4',
                  showFavoritesOnly && 'fill-current'
                )}
              />
              <span className="hidden sm:inline">
                {showFavoritesOnly ? 'Showing Favorites' : 'Favorites'}
              </span>
              {favoriteCount > 0 && (
                <Badge
                  variant={showFavoritesOnly ? 'secondary' : 'outline'}
                  className="h-5 px-1.5 text-xs"
                >
                  {favoriteCount}
                </Badge>
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {hasFavorites
              ? showFavoritesOnly
                ? 'Show all sections'
                : 'Show only favorite sections'
              : 'No favorites yet - click the star on sections to add'}
          </TooltipContent>
        </Tooltip>

        {/* Clear all button */}
        {hasFavorites && !showClearConfirm && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                onClick={() => setShowClearConfirm(true)}
              >
                <X className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Clear all favorites</TooltipContent>
          </Tooltip>
        )}
      </div>
    </div>
  );
};

/**
 * SectionFavoriteButton - Star button to toggle favorite on individual sections
 */
interface SectionFavoriteButtonProps {
  entityType: 'brand' | 'product' | 'event';
  entityId: string | undefined;
  sectionId: string;
  className?: string;
}

export const SectionFavoriteButton = ({
  entityType,
  entityId,
  sectionId,
  className,
}: SectionFavoriteButtonProps) => {
  const { isFavorited, toggleFavorite, isToggling, isAuthenticated } =
    useSectionFavorites({ entityType, entityId });

  const favorited = isFavorited(sectionId);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            'h-7 w-7 shrink-0 transition-colors',
            favorited
              ? 'text-amber-500 hover:text-amber-600'
              : 'text-muted-foreground/50 hover:text-amber-500',
            className
          )}
          onClick={(e) => {
            e.stopPropagation();
            toggleFavorite(sectionId);
          }}
          disabled={isToggling}
        >
          <Star
            className={cn('h-4 w-4', favorited && 'fill-current')}
          />
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        {favorited ? 'Remove from favorites' : 'Add to favorites'}
      </TooltipContent>
    </Tooltip>
  );
};
