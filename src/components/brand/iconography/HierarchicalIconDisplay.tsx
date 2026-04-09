/**
 * HierarchicalIconDisplay - Collapsible grid showing all available icons for a brand
 * Defaults to collapsed accordion state for cleaner layouts
 * Auto-generates black & white variants for every icon
 */

import { useState, useMemo } from 'react';
import { 
  Building2, 
  Package, 
  Layers,
  Link2,
  Filter,
  ChevronRight,
  Sun,
  Moon,
  Circle,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useIconLibraries, IconLibrary } from '@/hooks/useIconLibraries';
import { useIconLibraryBrandLinks } from '@/hooks/useIconLibraryBrandLinks';
import { BrandIconography } from '@/types/brand';
import { cn } from '@/lib/utils';
import DOMPurify from 'dompurify';
import { buildSvgString, applyColorVariant, type IconColorVariant } from '@/lib/svgUtils';

interface HierarchicalIconDisplayProps {
  organizationId: string | undefined;
  brandId?: string;
  productId?: string;
  eventId?: string;
  brandIcons?: BrandIconography[];
  productLineId?: string;
  iconColor?: string;
  onIconClick?: (icon: BrandIconography, library?: IconLibrary) => void;
  showEmptyGroups?: boolean;
  defaultOpen?: boolean;
}

type SourceFilter = 'all' | 'core' | 'product_line' | 'assigned' | 'brand';

const SOURCE_CHIPS: { key: SourceFilter; label: string; icon: typeof Building2; color: string }[] = [
  { key: 'all', label: 'All', icon: Filter, color: 'text-foreground' },
  { key: 'core', label: 'Core', icon: Building2, color: 'text-blue-500' },
  { key: 'product_line', label: 'Product', icon: Package, color: 'text-purple-500' },
  { key: 'assigned', label: 'Assigned', icon: Link2, color: 'text-emerald-500' },
  { key: 'brand', label: 'This Brand', icon: Layers, color: 'text-sky-500' },
];

const VARIANT_CHIPS: { key: IconColorVariant; label: string; icon: typeof Circle; bgClass: string }[] = [
  { key: 'original', label: 'Original', icon: Circle, bgClass: '' },
  { key: 'black', label: 'Black', icon: Moon, bgClass: 'bg-background' },
  { key: 'white', label: 'White', icon: Sun, bgClass: 'bg-zinc-900' },
];

export const HierarchicalIconDisplay = ({
  organizationId,
  brandId,
  productId,
  eventId,
  brandIcons = [],
  productLineId,
  iconColor = 'currentColor',
  onIconClick,
  showEmptyGroups = false,
  defaultOpen = false,
}: HierarchicalIconDisplayProps) => {
  const { libraries, coreLibraries, productLineLibraries, isLoading } = useIconLibraries(organizationId);
  const { links, getLinkedLibraryIdsForEntity } = useIconLibraryBrandLinks(organizationId);
  const [activeFilter, setActiveFilter] = useState<SourceFilter>('all');
  const [colorVariant, setColorVariant] = useState<IconColorVariant>('original');
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const allIcons = useMemo(() => {
    const items: { icon: BrandIconography; source: SourceFilter; libraryName?: string; library?: IconLibrary }[] = [];

    coreLibraries.forEach(lib => {
      if (lib.is_active) {
        lib.icons.forEach(icon => items.push({ icon, source: 'core', libraryName: lib.name, library: lib }));
      }
    });

    productLineLibraries.forEach(lib => {
      if (lib.is_active && (!productLineId || lib.id === productLineId)) {
        lib.icons.forEach(icon => items.push({ icon, source: 'product_line', libraryName: lib.name, library: lib }));
      }
    });

    const entityId = brandId || productId || eventId;
    const entityType = brandId ? 'brand' : productId ? 'product' : eventId ? 'event' : null;
    if (entityId && entityType) {
      const linkedIds = new Set(getLinkedLibraryIdsForEntity(entityId, entityType));
      libraries.forEach(lib => {
        if (linkedIds.has(lib.id) && lib.is_active) {
          const alreadyAdded = items.some(i => i.library?.id === lib.id);
          if (!alreadyAdded) {
            lib.icons.forEach(icon => items.push({ icon, source: 'assigned', libraryName: lib.name, library: lib }));
          }
        }
      });
    }

    brandIcons.forEach(icon => items.push({ icon, source: 'brand' }));

    return items;
  }, [coreLibraries, productLineLibraries, productLineId, libraries, brandId, productId, eventId, links, getLinkedLibraryIdsForEntity, brandIcons]);

  const filteredIcons = useMemo(() => {
    if (activeFilter === 'all') return allIcons;
    return allIcons.filter(i => i.source === activeFilter);
  }, [allIcons, activeFilter]);

  const counts = useMemo(() => {
    const c: Record<SourceFilter, number> = { all: allIcons.length, core: 0, product_line: 0, assigned: 0, brand: 0 };
    allIcons.forEach(i => c[i.source]++);
    return c;
  }, [allIcons]);

  const renderIcon = (icon: BrandIconography, size: number = 20) => {
    const viewBox = icon.viewBox || '0 0 24 24';
    const isFullContent = icon.svgPath.includes('<');

    // Build normalized SVG and apply color variant
    const fullSvg = buildSvgString(icon);
    const variantSvg = colorVariant === 'original'
      ? fullSvg
      : applyColorVariant(fullSvg, colorVariant);

    const sanitized = DOMPurify.sanitize(variantSvg, {
      USE_PROFILES: { svg: true, svgFilters: true },
    });

    // For white variant on light bg, we need dark bg
    const needsDarkBg = colorVariant === 'white';

    return (
      <div
        className={cn(
          'flex items-center justify-center rounded',
          needsDarkBg && 'bg-zinc-800'
        )}
        style={{ width: size, height: size }}
        dangerouslySetInnerHTML={{ __html: sanitized }}
      />
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
      </div>
    );
  }

  if (allIcons.length === 0 && !showEmptyGroups) {
    return (
      <div className="text-center py-8 text-muted-foreground border border-dashed rounded-lg">
        <Layers className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No inherited icons available</p>
        <p className="text-xs">Assign collections in Organization Settings</p>
      </div>
    );
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className="flex items-center justify-between w-full group py-1">
        <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <ChevronRight className={cn('h-4 w-4 transition-transform', isOpen && 'rotate-90')} />
          Organization Icon Library
          <span className="text-xs font-normal">({allIcons.length} icons)</span>
        </h4>
      </CollapsibleTrigger>

      <CollapsibleContent className="space-y-3 pt-2">
        {/* Source filter chips + color variant toggle */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            {SOURCE_CHIPS.map(chip => {
              const count = counts[chip.key];
              if (count === 0 && chip.key !== 'all') return null;
              const Icon = chip.icon;
              const isActive = activeFilter === chip.key;

              return (
                <button
                  key={chip.key}
                  onClick={() => setActiveFilter(chip.key)}
                  className={cn(
                    'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  <Icon className={cn('h-3 w-3', !isActive && chip.color)} />
                  {chip.label}
                  <span className={cn('text-[10px]', isActive ? 'opacity-80' : 'opacity-60')}>{count}</span>
                </button>
              );
            })}
          </div>

          {/* Color variant toggle */}
          <div className="flex items-center gap-1 bg-muted/50 rounded-full p-0.5">
            {VARIANT_CHIPS.map(chip => {
              const Icon = chip.icon;
              const isActive = colorVariant === chip.key;
              return (
                <button
                  key={chip.key}
                  onClick={() => setColorVariant(chip.key)}
                  title={`${chip.label} variant`}
                  className={cn(
                    'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium transition-all',
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  <Icon className="h-3 w-3" />
                  {chip.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Unified icon grid */}
        <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-2">
          {filteredIcons.map((item, idx) => {
            const sourceColor = item.source === 'core' ? 'border-blue-500/30' 
              : item.source === 'product_line' ? 'border-purple-500/30'
              : item.source === 'assigned' ? 'border-emerald-500/30'
              : 'border-sky-500/30';

            return (
              <button
                key={`${item.icon.id}-${idx}`}
                onClick={() => onIconClick?.(item.icon, item.library)}
                className={cn(
                  'aspect-square rounded-lg border-2 flex items-center justify-center',
                  'hover:shadow-sm transition-all',
                  'group relative',
                  sourceColor,
                  colorVariant === 'white' ? 'bg-zinc-800' : 'bg-muted/30 hover:bg-muted'
                )}
                title={`${item.icon.name}${item.libraryName ? ` (${item.libraryName})` : item.source === 'brand' ? ' (Brand)' : ''}`}
              >
                {renderIcon(item.icon)}
              </button>
            );
          })}
        </div>

        {filteredIcons.length === 0 && (
          <div className="text-center py-6 text-sm text-muted-foreground">
            No icons in this category
          </div>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
};
