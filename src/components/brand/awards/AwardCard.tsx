import React from 'react';
import { Trash2, ExternalLink, Building2, Award } from 'lucide-react';
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
    const hasImage = !!award.imageUrl;

    return (
      <Card
        ref={ref}
        className={cn(
          "group relative overflow-hidden transition-all duration-300",
          "hover:shadow-md hover:-translate-y-0.5",
          "border-border/60 hover:border-primary/30",
          "animate-fade-in opacity-0",
          canEdit && "cursor-pointer"
        )}
        style={{ 
          animationDelay: `${animationDelay}ms`,
          animationFillMode: 'forwards'
        }}
        onClick={() => canEdit && onEdit(award)}
      >
        {/* Subtle gradient overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        <CardContent className={cn("relative", compact ? "p-3" : "p-4")}>
          <div className="space-y-2">
            {/* Logo/Image Section */}
            {hasImage ? (
              <div className={cn(
                "relative flex items-center justify-center rounded-md overflow-hidden bg-white",
                compact ? "h-12 mb-2" : "h-16 mb-3"
              )}>
                <img
                  src={award.imageUrl}
                  alt={`${award.organization} logo`}
                  className="max-h-full max-w-full object-contain p-1.5"
                  loading="lazy"
                />
                {canEdit && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-0.5 right-0.5 h-5 w-5 opacity-0 group-hover:opacity-100 transition-all bg-background/80 hover:bg-destructive/10"
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
              /* Header with icon and delete - no image */
              <div className="flex items-start gap-2">
                <div className={cn(
                  "shrink-0 rounded-md p-1.5 transition-colors",
                  "bg-primary/10 text-primary group-hover:bg-primary/15"
                )}>
                  <Award className="h-3.5 w-3.5" />
                </div>
                
                <div className="flex-1" />

                {canEdit && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-all shrink-0 hover:bg-destructive/10"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(award.id);
                    }}
                  >
                    <Trash2 className="h-3 w-3 text-destructive" />
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
              <Building2 className="h-3 w-3 shrink-0" />
              <span className="truncate">{award.organization}</span>
            </div>

            {/* Year badge */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <Badge 
                variant="secondary" 
                className="text-[10px] px-1.5 py-0 font-semibold bg-primary/10 text-primary border-0"
              >
                {award.year}
              </Badge>
              {award.category && (
                <Badge 
                  variant="outline" 
                  className="text-[10px] px-1.5 py-0 font-normal"
                >
                  {award.category}
                </Badge>
              )}
            </div>

            {/* Description - only show if not compact */}
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
