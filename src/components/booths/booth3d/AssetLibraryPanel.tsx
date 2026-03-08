/**
 * AssetLibraryPanel - Left panel with categorized draggable assets
 * Structure, Media, Furniture, Lighting, Decor categories
 */
import { useState, useMemo } from 'react';
import {
  Search, Box, Monitor, Armchair, Lightbulb, TreePine,
  ChevronDown, ChevronRight, Layers, Eye, EyeOff,
  Table2, Flag, LayoutGrid
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
type AssetCategory = 'structure' | 'media' | 'furniture' | 'lighting' | 'decor';

interface CategoryConfig {
  id: AssetCategory;
  label: string;
  icon: React.ReactNode;
  furnitureCategories: FurnitureCategory[];
}

const ASSET_CATEGORIES: CategoryConfig[] = [
  { id: 'structure', label: 'Structure', icon: <Box className="h-3.5 w-3.5" />, furnitureCategories: ['signage'] },
  { id: 'media', label: 'Media', icon: <Monitor className="h-3.5 w-3.5" />, furnitureCategories: ['displays'] },
  { id: 'furniture', label: 'Furniture', icon: <Armchair className="h-3.5 w-3.5" />, furnitureCategories: ['tables', 'seating'] },
  { id: 'lighting', label: 'Lighting', icon: <Lightbulb className="h-3.5 w-3.5" />, furnitureCategories: [] },
  { id: 'decor', label: 'Decor', icon: <TreePine className="h-3.5 w-3.5" />, furnitureCategories: ['accessories', 'flooring'] },
];

interface AssetLibraryPanelProps {
  onAddAsset: (assetId: string) => void;
  isAdmin: boolean;
}

export function AssetLibraryPanel({ onAddAsset, isAdmin }: AssetLibraryPanelProps) {
  const [search, setSearch] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['furniture', 'media']));

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
          <span className="text-xs font-semibold">Asset Library</span>
          <Badge variant="secondary" className="text-[9px] ml-auto">{totalAssets}</Badge>
        </div>
        <div className="relative">
          <Search className="absolute left-2 top-2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search assets..."
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
          
          return (
            <div key={cat.id}>
              <button
                onClick={() => toggleCategory(cat.id)}
                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-muted/50 transition-colors"
              >
                {isExpanded ? <ChevronDown className="h-3 w-3 text-muted-foreground" /> : <ChevronRight className="h-3 w-3 text-muted-foreground" />}
                {cat.icon}
                <span className="text-xs font-medium flex-1 text-left">{cat.label}</span>
                <Badge variant="outline" className="text-[9px] h-4 px-1">{items.length}</Badge>
              </button>

              {isExpanded && (
                <div className="px-2 pb-1 space-y-0.5">
                  {items.length === 0 ? (
                    <p className="text-[10px] text-muted-foreground px-3 py-2">
                      {cat.furnitureCategories.length === 0 ? 'Coming soon' : 'No matching assets'}
                    </p>
                  ) : (
                    items.map((asset) => (
                      <button
                        key={asset.id}
                        onClick={() => isAdmin && onAddAsset(asset.id)}
                        disabled={!isAdmin}
                        className={cn(
                          "w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-left transition-colors",
                          isAdmin
                            ? "hover:bg-primary/10 cursor-pointer active:bg-primary/20"
                            : "opacity-50 cursor-not-allowed"
                        )}
                      >
                        <div className="h-7 w-7 rounded bg-muted flex items-center justify-center shrink-0">
                          {asset.category === 'displays' ? <Monitor className="h-3.5 w-3.5 text-muted-foreground" /> :
                           asset.category === 'tables' ? <Table2 className="h-3.5 w-3.5 text-muted-foreground" /> :
                           asset.category === 'seating' ? <Armchair className="h-3.5 w-3.5 text-muted-foreground" /> :
                           asset.category === 'signage' ? <Flag className="h-3.5 w-3.5 text-muted-foreground" /> :
                           <Box className="h-3.5 w-3.5 text-muted-foreground" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[11px] font-medium truncate">{asset.name}</p>
                          <p className="text-[9px] text-muted-foreground truncate">{asset.description.split('(')[0]?.trim()}</p>
                        </div>
                        {asset.hasScreen && <Badge variant="outline" className="text-[8px] h-3.5 px-1 shrink-0">📺</Badge>}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
