/**
 * Canva Template Gallery
 * Filterable gallery of all Canva-linked collateral items for an entity
 */

import { useMemo, useState } from 'react';
import { ExternalLink, Filter, Layout } from 'lucide-react';
import { BrandBrochure } from '@/types/brand';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { toast } from 'sonner';
import {
  parseCanvaUrl,
  refineDesignType,
  getDesignTypeIcon,
  buildBrandContextReminder,
  CANVA_LOGO_SVG,
  type CanvaDesignType,
} from '@/lib/canvaUtils';

interface CanvaTemplateGalleryProps {
  brochures: BrandBrochure[];
  entityName: string;
  guideData: Record<string, unknown>;
}

export const CanvaTemplateGallery = ({
  brochures,
  entityName,
  guideData,
}: CanvaTemplateGalleryProps) => {
  const [filterType, setFilterType] = useState<CanvaDesignType | 'all'>('all');

  const canvaItems = useMemo(() => {
    return brochures
      .filter((b) => b.externalUrl?.includes('canva.com'))
      .map((b) => {
        const raw = parseCanvaUrl(b.externalUrl);
        const info = refineDesignType(raw, b.category, b.title);
        return { brochure: b, info };
      });
  }, [brochures]);

  const designTypes = useMemo(() => {
    const types = new Set(canvaItems.map((i) => i.info.designType));
    return Array.from(types);
  }, [canvaItems]);

  const filtered = filterType === 'all'
    ? canvaItems
    : canvaItems.filter((i) => i.info.designType === filterType);

  const handleOpenInCanva = (url: string) => {
    toast.info(buildBrandContextReminder(entityName, guideData), {
      duration: 6000,
      icon: '🎨',
    });
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  if (canvaItems.length === 0) {
    return (
      <div className="text-center py-12 space-y-3">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
          <img src={CANVA_LOGO_SVG} alt="Canva" className="w-8 h-8" />
        </div>
        <h3 className="font-semibold text-foreground">No Canva Templates Yet</h3>
        <p className="text-sm text-muted-foreground max-w-sm mx-auto">
          Add Canva template links to your Digital Collateral or Social Banners to see them here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      {designTypes.length > 1 && (
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="h-3.5 w-3.5 text-muted-foreground" />
          <button
            onClick={() => setFilterType('all')}
            className={`px-2.5 py-1 text-xs rounded-full border transition-colors ${
              filterType === 'all'
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-transparent text-muted-foreground border-border hover:border-primary/50'
            }`}
          >
            All ({canvaItems.length})
          </button>
          {designTypes.map((type) => {
            const count = canvaItems.filter((i) => i.info.designType === type).length;
            const label = canvaItems.find((i) => i.info.designType === type)?.info.displayLabel;
            return (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-2.5 py-1 text-xs rounded-full border transition-colors ${
                  filterType === type
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-transparent text-muted-foreground border-border hover:border-primary/50'
                }`}
              >
                {getDesignTypeIcon(type)} {label} ({count})
              </button>
            );
          })}
        </div>
      )}

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(({ brochure, info }) => (
          <div
            key={brochure.id}
            className="group rounded-lg border bg-card overflow-hidden hover:shadow-md transition-shadow"
          >
            {/* Thumbnail */}
            <div className="aspect-[16/10] bg-muted relative flex items-center justify-center">
              {brochure.thumbnailUrl ? (
                <OptimizedImage
                  src={brochure.thumbnailUrl}
                  alt={brochure.title}
                  className="w-full h-full"
                  objectFit="cover"
                />
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <img src={CANVA_LOGO_SVG} alt="Canva" className="w-10 h-10 opacity-60" />
                  <span className="text-xs text-muted-foreground">{info.displayLabel}</span>
                </div>
              )}

              {/* Canva badge */}
              <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-background/80 backdrop-blur-sm border text-[10px] font-medium">
                <img src={CANVA_LOGO_SVG} alt="" className="w-3.5 h-3.5" />
                <span>{info.displayLabel}</span>
              </div>
            </div>

            {/* Info */}
            <div className="p-3 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h4 className="font-medium text-sm text-foreground truncate">{brochure.title}</h4>
                  <p className="text-xs text-muted-foreground">{brochure.category}</p>
                </div>
                <Badge variant="outline" className="text-[10px] shrink-0 gap-1">
                  {getDesignTypeIcon(info.designType)} {info.displayLabel}
                </Badge>
              </div>

              <Button
                size="sm"
                variant="outline"
                className="w-full gap-2 text-xs border-[hsl(178,100%,40%)]/30 text-[hsl(178,100%,30%)] hover:bg-[hsl(178,100%,40%)]/10 hover:text-[hsl(178,100%,25%)] hover:border-[hsl(178,100%,40%)]/50"
                onClick={() => handleOpenInCanva(brochure.externalUrl!)}
              >
                <img src={CANVA_LOGO_SVG} alt="" className="w-4 h-4" />
                Open in Canva
                <ExternalLink className="h-3 w-3 ml-auto" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
