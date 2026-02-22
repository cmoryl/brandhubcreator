/**
 * IconLibraryPicker - Allows selecting icons from organization icon libraries
 * Used to link admin icon libraries to brand icon pages
 */

import { useState, useMemo } from 'react';
import { 
  Search, 
  Building2, 
  Package, 
  Layers, 
  Check,
  X,
  Grid2X2,
  List,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Toggle } from '@/components/ui/toggle';
import { useIconLibraries, IconLibrary } from '@/hooks/useIconLibraries';
import { BrandIconography, BrandIcon } from '@/types/brand';
import { cn } from '@/lib/utils';
import DOMPurify from 'dompurify';

interface IconLibraryPickerProps {
  organizationId: string | undefined;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onIconsSelected: (icons: BrandIcon[]) => void;
  existingIconIds?: string[];
}

const LEVEL_CONFIG = {
  core: {
    label: 'Core',
    icon: Building2,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
  },
  product_line: {
    label: 'Product Line',
    icon: Package,
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
  },
  brand: {
    label: 'Brand',
    icon: Layers,
    color: 'text-orange-500',
    bgColor: 'bg-orange-500/10',
  },
};

export const IconLibraryPicker = ({
  organizationId,
  open,
  onOpenChange,
  onIconsSelected,
  existingIconIds = [],
}: IconLibraryPickerProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<'all' | 'core' | 'product_line' | 'brand'>('all');
  const [selectedIcons, setSelectedIcons] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  const { libraries, isLoading } = useIconLibraries(organizationId);

  // Flatten all icons with their library info
  const allIcons = useMemo(() => {
    const icons: { icon: BrandIconography; library: IconLibrary }[] = [];
    libraries.forEach(lib => {
      lib.icons.forEach(icon => {
        icons.push({ icon, library: lib });
      });
    });
    return icons;
  }, [libraries]);

  // Filter icons
  const filteredIcons = useMemo(() => {
    return allIcons.filter(({ icon, library }) => {
      // Filter by level
      if (selectedLevel !== 'all' && library.level !== selectedLevel) {
        return false;
      }
      // Filter by search
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          icon.name.toLowerCase().includes(query) ||
          icon.category.toLowerCase().includes(query) ||
          library.name.toLowerCase().includes(query)
        );
      }
      return true;
    });
  }, [allIcons, selectedLevel, searchQuery]);

  // Group icons by category
  const groupedIcons = useMemo(() => {
    const groups: Record<string, typeof filteredIcons> = {};
    filteredIcons.forEach(item => {
      const category = item.icon.category || 'Other';
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(item);
    });
    return groups;
  }, [filteredIcons]);

  const toggleIcon = (iconId: string) => {
    setSelectedIcons(prev => {
      const next = new Set(prev);
      if (next.has(iconId)) {
        next.delete(iconId);
      } else {
        next.add(iconId);
      }
      return next;
    });
  };

  const handleConfirm = () => {
    const selectedIconData: BrandIcon[] = [];
    selectedIcons.forEach(iconId => {
      const found = allIcons.find(({ icon }) => icon.id === iconId);
      if (found) {
        // Build proper SVG content preserving full path data
        const viewBox = found.icon.viewBox || '0 0 24 24';
        const isFullSvg = found.icon.svgPath.includes('<');
        
        let svgContent: string;
        if (isFullSvg) {
          // Full SVG inner content - wrap in complete SVG
          const sanitized = DOMPurify.sanitize(found.icon.svgPath, {
            USE_PROFILES: { svg: true, svgFilters: true },
            FORBID_TAGS: ['script', 'foreignObject'],
          });
          svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}">${sanitized}</svg>`;
        } else {
          // Path data only
          svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" fill="${found.icon.fillMode === 'fill' ? 'currentColor' : 'none'}" stroke="${found.icon.fillMode !== 'fill' ? 'currentColor' : 'none'}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="${found.icon.svgPath}"/></svg>`;
        }
        
        selectedIconData.push({
          id: crypto.randomUUID(),
          name: found.icon.name,
          url: `data:image/svg+xml,${encodeURIComponent(svgContent)}`,
          settings: `From ${found.library.name} library (${found.library.level})`,
          isPrimary: false,
          isVariation: false,
        });
      }
    });
    onIconsSelected(selectedIconData);
    setSelectedIcons(new Set());
    onOpenChange(false);
  };

  const renderIcon = (icon: BrandIconography) => {
    const viewBox = icon.viewBox || '0 0 24 24';
    const isFullSvg = icon.svgPath.includes('<');

    if (isFullSvg) {
      const sanitized = DOMPurify.sanitize(icon.svgPath, {
        USE_PROFILES: { svg: true, svgFilters: true },
        FORBID_TAGS: ['script', 'foreignObject'],
      });
      return (
        <svg viewBox={viewBox} className="w-full h-full" fill="currentColor">
          <g dangerouslySetInnerHTML={{ __html: sanitized }} />
        </svg>
      );
    }

    const sanitizedPath = DOMPurify.sanitize(icon.svgPath);
    return (
      <svg
        viewBox={viewBox}
        fill={icon.fillMode === 'fill' ? 'currentColor' : 'none'}
        stroke={icon.fillMode !== 'fill' ? 'currentColor' : 'none'}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-full h-full"
      >
        <path d={sanitizedPath} />
      </svg>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5" />
            Select Icons from Library
          </DialogTitle>
          <DialogDescription>
            Choose icons from your organization's icon libraries to add to this brand.
          </DialogDescription>
        </DialogHeader>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search icons..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex items-center gap-2">
            <Tabs value={selectedLevel} onValueChange={(v) => setSelectedLevel(v as typeof selectedLevel)}>
              <TabsList>
                <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
                <TabsTrigger value="core" className="text-xs">Core</TabsTrigger>
                <TabsTrigger value="product_line" className="text-xs">Product</TabsTrigger>
                <TabsTrigger value="brand" className="text-xs">Brand</TabsTrigger>
              </TabsList>
            </Tabs>
            <Toggle
              pressed={viewMode === 'grid'}
              onPressedChange={(pressed) => setViewMode(pressed ? 'grid' : 'list')}
              size="sm"
              aria-label="Toggle view"
            >
              {viewMode === 'grid' ? <Grid2X2 className="h-4 w-4" /> : <List className="h-4 w-4" />}
            </Toggle>
          </div>
        </div>

        {/* Selection count */}
        {selectedIcons.size > 0 && (
          <div className="flex items-center justify-between px-3 py-2 bg-accent/10 rounded-lg">
            <span className="text-sm font-medium">
              {selectedIcons.size} icon{selectedIcons.size !== 1 ? 's' : ''} selected
            </span>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setSelectedIcons(new Set())}
            >
              Clear selection
            </Button>
          </div>
        )}

        {/* Icons Grid */}
        <ScrollArea className="flex-1 h-[400px]">
          {isLoading ? (
            <div className="flex items-center justify-center h-32 text-muted-foreground">
              Loading icons...
            </div>
          ) : Object.keys(groupedIcons).length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
              <Layers className="h-8 w-8 mb-2 opacity-50" />
              <p>No icons found</p>
              {searchQuery && <p className="text-xs">Try a different search term</p>}
            </div>
          ) : (
            <div className="space-y-6 pr-4">
              {Object.entries(groupedIcons).map(([category, icons]) => (
                <div key={category}>
                  <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    {category}
                    <Badge variant="secondary" className="text-xs">
                      {icons.length}
                    </Badge>
                  </h4>
                  
                  {viewMode === 'grid' ? (
                    <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                      {icons.map(({ icon, library }) => {
                        const isSelected = selectedIcons.has(icon.id);
                        const alreadyExists = existingIconIds.includes(icon.id);
                        const levelConfig = LEVEL_CONFIG[library.level as keyof typeof LEVEL_CONFIG];
                        
                        return (
                          <button
                            key={icon.id}
                            onClick={() => !alreadyExists && toggleIcon(icon.id)}
                            disabled={alreadyExists}
                            className={cn(
                              "relative aspect-square p-2 rounded-lg border transition-all",
                              "hover:border-accent hover:shadow-md",
                              isSelected && "border-accent bg-accent/10 ring-2 ring-accent",
                              alreadyExists && "opacity-50 cursor-not-allowed",
                              !isSelected && !alreadyExists && "border-border bg-card"
                            )}
                            title={`${icon.name} (${library.name})`}
                          >
                            <div className="w-full h-full flex items-center justify-center text-foreground">
                              {renderIcon(icon)}
                            </div>
                            {isSelected && (
                              <div className="absolute -top-1 -right-1 w-4 h-4 bg-accent rounded-full flex items-center justify-center">
                                <Check className="w-3 h-3 text-accent-foreground" />
                              </div>
                            )}
                            {alreadyExists && (
                              <Badge 
                                variant="secondary" 
                                className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[8px] px-1"
                              >
                                Added
                              </Badge>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {icons.map(({ icon, library }) => {
                        const isSelected = selectedIcons.has(icon.id);
                        const alreadyExists = existingIconIds.includes(icon.id);
                        const levelConfig = LEVEL_CONFIG[library.level as keyof typeof LEVEL_CONFIG];
                        const LevelIcon = levelConfig.icon;
                        
                        return (
                          <button
                            key={icon.id}
                            onClick={() => !alreadyExists && toggleIcon(icon.id)}
                            disabled={alreadyExists}
                            className={cn(
                              "w-full flex items-center gap-3 p-2 rounded-lg border transition-all",
                              "hover:border-accent",
                              isSelected && "border-accent bg-accent/10",
                              alreadyExists && "opacity-50 cursor-not-allowed",
                              !isSelected && !alreadyExists && "border-border bg-card"
                            )}
                          >
                            <div className="w-8 h-8 flex items-center justify-center text-foreground shrink-0">
                              {renderIcon(icon)}
                            </div>
                            <div className="flex-1 text-left">
                              <p className="text-sm font-medium">{icon.name}</p>
                              <p className="text-xs text-muted-foreground">{library.name}</p>
                            </div>
                            <div className={cn("p-1 rounded", levelConfig.bgColor)}>
                              <LevelIcon className={cn("h-3 w-3", levelConfig.color)} />
                            </div>
                            {isSelected && <Check className="h-4 w-4 text-accent" />}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleConfirm}
            disabled={selectedIcons.size === 0}
          >
            Add {selectedIcons.size || ''} Icon{selectedIcons.size !== 1 ? 's' : ''}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
