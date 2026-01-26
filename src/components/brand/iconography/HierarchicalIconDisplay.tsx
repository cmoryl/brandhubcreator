/**
 * HierarchicalIconDisplay - Displays icons with collapsible groups showing hierarchy
 * Shows Core → Product Line → Brand icons in separate expandable sections
 */

import { useState, useMemo } from 'react';
import { 
  ChevronDown, 
  ChevronRight, 
  Building2, 
  Package, 
  Layers,
  Lock,
  Info,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useIconLibraries, IconLibrary } from '@/hooks/useIconLibraries';
import { BrandIconography } from '@/types/brand';
import { cn } from '@/lib/utils';
import DOMPurify from 'dompurify';

interface HierarchicalIconDisplayProps {
  organizationId: string | undefined;
  brandIcons?: BrandIconography[];
  productLineId?: string;
  iconColor?: string;
  onIconClick?: (icon: BrandIconography, library?: IconLibrary) => void;
  showEmptyGroups?: boolean;
}

const LEVEL_CONFIG = {
  core: {
    label: 'Core Icons',
    description: 'Organization-wide icons',
    icon: Building2,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    badgeVariant: 'default' as const,
  },
  product_line: {
    label: 'Product Line Icons',
    description: 'Division-specific icons',
    icon: Package,
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
    badgeVariant: 'secondary' as const,
  },
  brand: {
    label: 'Brand Icons',
    description: 'Brand-specific icons',
    icon: Layers,
    color: 'text-orange-500',
    bgColor: 'bg-orange-500/10',
    badgeVariant: 'outline' as const,
  },
};

export const HierarchicalIconDisplay = ({
  organizationId,
  brandIcons = [],
  productLineId,
  iconColor = 'currentColor',
  onIconClick,
  showEmptyGroups = false,
}: HierarchicalIconDisplayProps) => {
  const { libraries, coreLibraries, productLineLibraries, isLoading } = useIconLibraries(organizationId);
  
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    new Set(['core', 'product_line', 'brand'])
  );

  const toggleGroup = (group: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(group)) {
        next.delete(group);
      } else {
        next.add(group);
      }
      return next;
    });
  };

  // Organize icons by level with library info
  const organizedIcons = useMemo(() => {
    const core: { library: IconLibrary; icons: BrandIconography[] }[] = [];
    const productLine: { library: IconLibrary; icons: BrandIconography[] }[] = [];
    
    // Add core library icons
    coreLibraries.forEach(lib => {
      if (lib.icons.length > 0) {
        core.push({ library: lib, icons: lib.icons });
      }
    });
    
    // Add product line icons (filter by productLineId if provided)
    productLineLibraries.forEach(lib => {
      if (lib.icons.length > 0) {
        if (!productLineId || lib.id === productLineId) {
          productLine.push({ library: lib, icons: lib.icons });
        }
      }
    });

    return { core, productLine };
  }, [coreLibraries, productLineLibraries, productLineId]);

  const renderIcon = (icon: BrandIconography, size: number = 24) => {
    const viewBox = icon.viewBox || '0 0 24 24';
    const isFullContent = icon.svgPath.includes('<');
    const colorStyle = iconColor === 'currentColor' ? undefined : iconColor;

    if (isFullContent) {
      const sanitized = DOMPurify.sanitize(icon.svgPath, {
        USE_PROFILES: { svg: true, svgFilters: true },
      });
      return (
        <div 
          className="flex items-center justify-center"
          style={{ width: size, height: size, color: colorStyle }}
        >
          <svg
            viewBox={viewBox}
            className="w-full h-full"
            fill="currentColor"
            dangerouslySetInnerHTML={{ __html: sanitized }}
          />
        </div>
      );
    }

    return (
      <svg
        viewBox={viewBox}
        style={{ width: size, height: size, color: colorStyle }}
        fill={icon.fillMode === 'fill' ? 'currentColor' : 'none'}
        stroke={icon.fillMode === 'stroke' ? 'currentColor' : 'none'}
        strokeWidth={icon.fillMode === 'stroke' ? 2 : undefined}
      >
        <path d={icon.svgPath} />
      </svg>
    );
  };

  const renderIconGroup = (
    level: 'core' | 'product_line' | 'brand',
    groups: { library?: IconLibrary; icons: BrandIconography[] }[],
    isInherited: boolean = false
  ) => {
    const config = LEVEL_CONFIG[level];
    const IconComponent = config.icon;
    const isExpanded = expandedGroups.has(level);
    const totalIcons = groups.reduce((sum, g) => sum + g.icons.length, 0);

    if (totalIcons === 0 && !showEmptyGroups) return null;

    return (
      <Collapsible 
        key={level}
        open={isExpanded} 
        onOpenChange={() => toggleGroup(level)}
        className="border rounded-lg overflow-hidden"
      >
        <CollapsibleTrigger asChild>
          <button className="w-full flex items-center justify-between p-3 hover:bg-muted/50 transition-colors bg-card">
            <div className="flex items-center gap-2">
              <div className={cn('p-1.5 rounded-md', config.bgColor)}>
                <IconComponent className={cn('h-4 w-4', config.color)} />
              </div>
              <span className="font-medium text-sm">{config.label}</span>
              {isInherited && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Lock className="h-3 w-3 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Inherited from organization</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={config.badgeVariant} className="text-xs">
                {totalIcons} icons
              </Badge>
              {isExpanded ? (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="p-3 pt-0 space-y-4">
            {groups.map((group, idx) => (
              <div key={group.library?.id || idx}>
                {group.library && groups.length > 1 && (
                  <p className="text-xs text-muted-foreground mb-2 font-medium">
                    {group.library.name}
                  </p>
                )}
                <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-2">
                  {group.icons.map((icon) => (
                    <button
                      key={icon.id}
                      onClick={() => onIconClick?.(icon, group.library)}
                      className={cn(
                        'aspect-square rounded-lg border flex items-center justify-center',
                        'bg-muted/30 hover:bg-muted hover:border-primary/50 transition-colors',
                        'group relative'
                      )}
                      title={icon.name}
                    >
                      {renderIcon(icon, 20)}
                      {isInherited && (
                        <div className="absolute top-0.5 right-0.5">
                          <Lock className="h-2.5 w-2.5 text-muted-foreground/50" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            ))}
            {totalIcons === 0 && (
              <div className="text-center py-4 text-sm text-muted-foreground">
                No {config.label.toLowerCase()} available
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
      </div>
    );
  }

  const hasAnyIcons = 
    organizedIcons.core.length > 0 || 
    organizedIcons.productLine.length > 0 || 
    brandIcons.length > 0;

  if (!hasAnyIcons && !showEmptyGroups) {
    return (
      <div className="text-center py-8 text-muted-foreground border border-dashed rounded-lg">
        <Layers className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No icons in the library</p>
        <p className="text-xs">Add icons from Organization Settings or directly in the brand</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Info banner */}
      <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/30 text-sm">
        <Info className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
        <div className="text-muted-foreground">
          Icons are organized in a hierarchy. <strong>Core</strong> icons are inherited by all brands, 
          <strong> Product Line</strong> icons are shared within divisions, and 
          <strong> Brand</strong> icons are specific to this guide.
        </div>
      </div>

      {/* Core Icons */}
      {renderIconGroup('core', organizedIcons.core, true)}

      {/* Product Line Icons */}
      {renderIconGroup('product_line', organizedIcons.productLine, true)}

      {/* Brand-Specific Icons */}
      {renderIconGroup('brand', [{ icons: brandIcons }], false)}
    </div>
  );
};
