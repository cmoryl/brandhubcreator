import React, { useState } from 'react';
import { Trash2, ExternalLink, Building2, Award, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BrandAward } from '@/types/brand';
import { cn } from '@/lib/utils';

interface AwardCardProps {
  award: BrandAward;
  canEdit: boolean;
  onEdit: (award: BrandAward) => void;
  onDelete: (id: string) => void;
  compact?: boolean;
  animationDelay?: number;
}

const AwardCard = React.forwardRef<HTMLDivElement, AwardCardProps>(
  ({ award, canEdit, onEdit, onDelete, compact = false, animationDelay = 0 }, ref) => {
    const [imageError, setImageError] = useState(false);
    const hasImage = !!award.imageUrl && !imageError;

    const isValidImageUrl = (url: string | undefined): boolean => {
      if (!url || typeof url !== 'string') return false;
      try {
        const parsed = new URL(url);
        return parsed.protocol === 'http:' || parsed.protocol === 'https:';
      } catch {
        return false;
      }
    };

    const showImage = hasImage && isValidImageUrl(award.imageUrl);

    return (
      <Card
        ref={ref}
        className={cn(
          "group relative overflow-hidden transition-all duration-300",
          "hover:shadow-lg hover:-translate-y-1",
          "border-border/60 hover:border-primary/40",
          "animate-fade-in opacity-0",
          "bg-gradient-to-b from-card to-muted/20",
          canEdit && "cursor-pointer"
        )}
        style={{ 
          animationDelay: `${animationDelay}ms`,
          animationFillMode: 'forwards'
        }}
        onClick={() => canEdit && onEdit(award)}
      >
        {/* Top accent bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/60 via-accent/40 to-primary/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        <CardContent className={cn("relative", compact ? "p-3" : "p-4")}>
          <div className="space-y-2">
            {/* Award Badge Image - Large and prominent */}
            {showImage ? (
              <div className={cn(
                "relative flex items-center justify-center rounded-lg overflow-hidden bg-white border border-border/40 shadow-sm group-hover:shadow-md transition-shadow",
                compact ? "h-20 mb-2" : "h-24 mb-3"
              )}>
                <img
                  src={award.imageUrl}
                  alt={`${award.title} badge`}
                  className="max-h-full max-w-full object-contain p-2"
                  loading="lazy"
                  onError={() => setImageError(true)}
                />
                {/* Subtle shine effect on hover */}
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                {canEdit && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-1 right-1 h-5 w-5 opacity-0 group-hover:opacity-100 transition-all bg-background/80 hover:bg-destructive/10"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(award.id);
                    }}
                  >
                    <Trash2 className="h-2.5 w-2.5 text-destructive" />
                  </Button>
                )}
              </div>
            ) : (
              /* Decorative placeholder when no image */
              <div className={cn(
                "relative flex items-center justify-center rounded-lg overflow-hidden border border-primary/15",
                "bg-gradient-to-br from-primary/8 via-accent/5 to-primary/8",
                compact ? "h-16 mb-2" : "h-20 mb-3"
              )}>
                <div className="relative">
                  <Award className="h-8 w-8 text-primary/30" />
                  <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-accent/40 animate-pulse" />
                </div>
                {canEdit && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-1 right-1 h-5 w-5 opacity-0 group-hover:opacity-100 transition-all bg-background/80 hover:bg-destructive/10"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(award.id);
                    }}
                  >
                    <Trash2 className="h-2.5 w-2.5 text-destructive" />
                  </Button>
                )}
              </div>
            )}

            {/* Title */}
            <h3 className={cn(
              "font-semibold leading-tight line-clamp-2 text-foreground",
              compact ? "text-xs" : "text-sm"
            )}>
              {award.title}
            </h3>
            
            {/* Organization */}
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Building2 className="h-3 w-3 shrink-0 text-primary/50" />
              <span className="truncate">{award.organization}</span>
            </div>

            {/* Year & Category badges */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <Badge 
                variant="secondary" 
                className="text-[10px] px-2 py-0.5 font-bold bg-gradient-to-r from-primary/15 to-primary/10 text-primary border border-primary/20"
              >
                <Calendar className="h-2.5 w-2.5 mr-1" />
                {award.year}
              </Badge>
              {award.category && (
                <Badge 
                  variant="outline" 
                  className="text-[10px] px-1.5 py-0 font-normal text-muted-foreground"
                >
                  {award.category}
                </Badge>
              )}
            </div>

            {/* Description */}
            {award.description && !compact && (
              <p className="text-xs text-muted-foreground line-clamp-2">
                {award.description}
              </p>
            )}

            {/* Link */}
            {award.linkUrl && (
              <a
                href={award.linkUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1 text-[10px] text-primary hover:underline font-medium"
              >
                View <ExternalLink className="h-2.5 w-2.5" />
              </a>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }
);

AwardCard.displayName = 'AwardCard';

export default AwardCard;
