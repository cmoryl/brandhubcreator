import { Link } from 'react-router-dom';
import { ArrowLeft, Share2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ParentEventBannerProps {
  parentEventSlug: string;
  parentEventName?: string;
  region?: string;
  accentColor?: string;
}

export const ParentEventBanner = ({
  parentEventSlug,
  parentEventName = 'Master Event Guide',
  region,
  accentColor,
}: ParentEventBannerProps) => {
  return (
    <div 
      className="relative overflow-hidden rounded-lg border mb-4 sm:mb-6"
      style={{
        borderColor: accentColor || 'hsl(var(--border))',
        background: accentColor ? `linear-gradient(135deg, ${accentColor}10 0%, ${accentColor}05 100%)` : undefined,
      }}
    >
      <div className="flex items-center justify-between gap-3 sm:gap-4 px-3 sm:px-4 py-2.5 sm:py-3">
        <Link 
          to={`/event/${parentEventSlug}`}
          className="flex items-center gap-2 sm:gap-3 text-sm hover:opacity-80 transition-opacity group min-h-[44px] touch-manipulation"
        >
          <div 
            className="flex items-center justify-center h-8 w-8 rounded-full bg-background border flex-shrink-0"
            style={{ borderColor: accentColor }}
          >
            <ArrowLeft className="h-4 w-4 text-muted-foreground group-hover:-translate-x-0.5 transition-transform" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">Part of</p>
            <p className="font-medium text-foreground truncate max-w-[150px] sm:max-w-none">{parentEventName}</p>
          </div>
        </Link>

        <div className="flex items-center gap-2 flex-shrink-0">
          {region && (
            <Badge 
              variant="outline"
              className="gap-1 sm:gap-1.5 text-xs px-2 py-1"
              style={{
                borderColor: accentColor,
                backgroundColor: accentColor ? `${accentColor}15` : undefined,
                color: accentColor,
              }}
            >
              <Share2 className="h-3 w-3 hidden sm:block" />
              <span className="truncate max-w-[60px] sm:max-w-none">{region}</span>
              <span className="hidden sm:inline">Region</span>
            </Badge>
          )}
        </div>
      </div>

      {/* Accent line at bottom */}
      {accentColor && (
        <div 
          className="h-0.5 sm:h-1 w-full"
          style={{ backgroundColor: accentColor }}
        />
      )}
    </div>
  );
};
