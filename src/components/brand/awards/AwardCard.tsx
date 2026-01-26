import React from 'react';
import { Trash2, ExternalLink, Building2 } from 'lucide-react';
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
    return (
      <Card
        ref={ref}
        className={cn(
          "group overflow-hidden hover:shadow-lg transition-all duration-500 cursor-pointer",
          "hover:scale-[1.02] hover:-translate-y-1",
          "animate-fade-in opacity-0",
          compact && "shadow-sm"
        )}
        style={{ 
          animationDelay: `${animationDelay}ms`,
          animationFillMode: 'forwards'
        }}
        onClick={() => canEdit && onEdit(award)}
      >
        {award.imageUrl && !compact && (
          <div className="aspect-[16/9] overflow-hidden bg-muted">
            <img
              src={award.imageUrl}
              alt={award.title}
              className="w-full h-full object-contain p-3 transition-transform duration-500 group-hover:scale-105"
            />
          </div>
        )}
        <CardContent className={cn(
          compact ? "p-3" : (award.imageUrl ? "pt-3 pb-4 px-4" : "p-4")
        )}>
          <div className="space-y-1.5">
            <div className="flex items-start justify-between gap-2">
              <h3 className={cn(
                "font-semibold leading-tight line-clamp-2",
                compact ? "text-xs" : "text-sm"
              )}>
                {award.title}
              </h3>
              {canEdit && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(award.id);
                  }}
                >
                  <Trash2 className="h-3 w-3 text-destructive" />
                </Button>
              )}
            </div>
            
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Building2 className="h-3 w-3 shrink-0" />
              <span className="truncate">{award.organization}</span>
            </div>

            {award.category && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                {award.category}
              </Badge>
            )}

            {award.description && !compact && (
              <p className="text-xs text-muted-foreground line-clamp-2">
                {award.description}
              </p>
            )}

            {award.linkUrl && (
              <a
                href={award.linkUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1 text-[10px] text-primary hover:underline"
              >
                Learn more <ExternalLink className="h-2.5 w-2.5" />
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
