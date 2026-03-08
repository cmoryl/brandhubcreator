/**
 * AssetLibraryPanel - Left panel with categorized draggable assets
 * Expanded: Walls, Screens, Counters, Furniture, Lighting, Hanging Signs, Decor, Plants, People
 */
import { useState, useMemo } from 'react';
import {
  Search, Box, Monitor, Armchair, Lightbulb, TreePine,
  ChevronDown, ChevronRight, Layers, Eye, EyeOff,
  Table2, Flag, LayoutGrid, Cuboid, PanelTop, Users, Lamp
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  FURNITURE_CATALOG,
  type FurnitureAsset,
  type FurnitureCategory,
} from './boothFurnitureConfigs';

// Extended categories for the asset library
type AssetCategory = 'walls' | 'screens' | 'counters' | 'furniture' | 'lighting' | 'signs' | 'decor' | 'plants' | 'people';

interface CategoryConfig {
  id: AssetCategory;
  label: string;
  icon: React.ReactNode;
  furnitureCategories: FurnitureCategory[];
  description: string;
}

const ASSET_CATEGORIES: CategoryConfig[] = [
  { id: 'walls', label: 'Walls', icon: <Cuboid className="h-3.5 w-3.5" />, furnitureCategories: ['signage'], description: 'Panels, partitions, backwalls' },
  { id: 'screens', label: 'Screens', icon: <Monitor className="h-3.5 w-3.5" />, furnitureCategories: ['displays'], description: 'TVs, LED walls, kiosks' },
  { id: 'counters', label: 'Counters', icon: <PanelTop className="h-3.5 w-3.5" />, furnitureCategories: ['tables'], description: 'Demo counters, reception desks' },
  { id: 'furniture', label: 'Furniture', icon: <Armchair className="h-3.5 w-3.5" />, furnitureCategories: ['seating'], description: 'Chairs, stools, lounges' },
  { id: 'lighting', label: 'Lighting', icon: <Lightbulb className="h-3.5 w-3.5" />, furnitureCategories: [], description: 'Spots, washes, LED accents' },
  { id: 'signs', label: 'Hanging Signs', icon: <Flag className="h-3.5 w-3.5" />, furnitureCategories: [], description: 'Overhead banners, hanging structures' },
  { id: 'decor', label: 'Decor', icon: <Lamp className="h-3.5 w-3.5" />, furnitureCategories: ['accessories', 'flooring'], description: 'Rugs, accessories, finishing touches' },
  { id: 'plants', label: 'Plants', icon: <TreePine className="h-3.5 w-3.5" />, furnitureCategories: [], description: 'Greenery, planters, living walls' },
  { id: 'people', label: 'People', icon: <Users className="h-3.5 w-3.5" />, furnitureCategories: [], description: 'Staff, visitors, mannequins' },
];

interface AssetLibraryPanelProps {
  onAddAsset: (assetId: string) => void;
  isAdmin: boolean;
}

export function AssetLibraryPanel({ onAddAsset, isAdmin }: AssetLibraryPanelProps) {
  const [search, setSearch] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['screens', 'counters', 'furniture']));

  const toggleCategory = (id: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const filteredByCategory = useMemo(() => {
    const q = search.toLowerCase();
    const result: Record<string, FurnitureAsset[]> = {};
    
    ASSET_CATEGORIES.forEach(cat => {
      const items = FURNITURE_CATALOG.filter(f => {
        if (!cat.furnitureCategories.includes(f.category)) return false;
        if (q && !f.name.toLowerCase().includes(q) && !f.description.toLowerCase().includes(q)) return false;
        return true;
      });
      result[cat.id] = items;
    });

    return result;
  }, [search]);

  const totalAssets = FURNITURE_CATALOG.length;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-3 pt-3 pb-2 border-b">
        <div className="flex items-center gap-2 mb-2">
          <LayoutGrid className="h-4 w-4 text-primary" />
          <span className="text-xs font-semibold">Objects</span>
          <Badge variant="secondary" className="text-[9px] ml-auto">{totalAssets}</Badge>
        </div>
        <div className="relative">
          <Search className="absolute left-2 top-2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search objects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-7 h-7 text-xs"
          />
        </div>
      </div>

      {/* Categories */}
      <div className="flex-1 overflow-y-auto py-1">
        {ASSET_CATEGORIES.map((cat) => {
          const items = filteredByCategory[cat.id] || [];
          const isExpanded = expandedCategories.has(cat.id);
          const hasItems = items.length > 0;
          const isComingSoon = cat.furnitureCategories.length === 0;
          
          return (
            <div key={cat.id}>
              <button
                onClick={() => toggleCategory(cat.id)}
                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-muted/50 transition-colors"
              >
                {isExpanded ? <ChevronDown className="h-3 w-3 text-muted-foreground" /> : <ChevronRight className="h-3 w-3 text-muted-foreground" />}
                {cat.icon}
                <div className="flex-1 text-left min-w-0">
                  <span className="text-xs font-medium">{cat.label}</span>
                </div>
                {hasItems ? (
                  <Badge variant="outline" className="text-[9px] h-4 px-1">{items.length}</Badge>
                ) : isComingSoon ? (
                  <Badge variant="secondary" className="text-[8px] h-4 px-1">Soon</Badge>
                ) : null}
              </button>

              {isExpanded && (
                <div className="px-2 pb-1 space-y-0.5">
                  {!hasItems ? (
                    <div className="px-3 py-3 text-center">
                      <p className="text-[10px] text-muted-foreground">
                        {isComingSoon ? 'Coming soon — stay tuned!' : 'No matching objects'}
                      </p>
                      <p className="text-[9px] text-muted-foreground/70 mt-0.5">{cat.description}</p>
                    </div>
                  ) : (
                    items.map((asset) => (
                      <button
                        key={asset.id}
                        onClick={() => isAdmin && onAddAsset(asset.id)}
                        disabled={!isAdmin}
                        className={cn(
                          "w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-left transition-all group",
                          isAdmin
                            ? "hover:bg-primary/10 cursor-pointer active:bg-primary/20 active:scale-[0.98]"
                            : "opacity-50 cursor-not-allowed"
                        )}
                      >
                        {asset.thumbnailUrl ? (
                          <img
                            src={asset.thumbnailUrl}
                            alt={asset.name}
                            className="h-8 w-8 rounded-md object-cover shrink-0 border border-border"
                          />
                        ) : (
                          <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center shrink-0 group-hover:bg-primary/15 transition-colors">
                            {asset.category === 'displays' ? <Monitor className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" /> :
                             asset.category === 'tables' ? <Table2 className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" /> :
                             asset.category === 'seating' ? <Armchair className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" /> :
                             asset.category === 'signage' ? <Flag className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" /> :
                             <Box className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />}
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="text-[11px] font-medium truncate">{asset.name}</p>
                          <p className="text-[9px] text-muted-foreground truncate">{asset.description.split('(')[0]?.trim()}</p>
                        </div>
                        {asset.hasScreen && <Badge variant="outline" className="text-[8px] h-3.5 px-1 shrink-0">📺</Badge>}
                        {asset.hasCustomTexture && <Badge variant="outline" className="text-[8px] h-3.5 px-1 shrink-0">🎨</Badge>}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Drag hint */}
      {isAdmin && (
        <div className="px-3 py-2 border-t text-center">
          <p className="text-[9px] text-muted-foreground">Click to add to scene • Arrow keys to nudge</p>
        </div>
      )}
    </div>
  );
}
