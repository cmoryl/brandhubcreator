import { Grid2X2, Grid3X3, LayoutGrid, List, Rows3, Square } from 'lucide-react';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

export type LayoutPreset = 
  | 'grid-2'      // 2 columns
  | 'grid-3'      // 3 columns  
  | 'grid-4'      // 4 columns
  | 'list'        // Horizontal list view
  | 'large-cards' // Large 2-column cards
  | 'compact';    // Compact small cards (5+ columns)

export interface LayoutSelectorProps {
  value: LayoutPreset;
  onChange: (value: LayoutPreset) => void;
  availableLayouts?: LayoutPreset[];
  size?: 'sm' | 'default';
}

const LAYOUT_CONFIG: Record<LayoutPreset, { 
  icon: React.ComponentType<{ className?: string }>; 
  label: string;
  description: string;
}> = {
  'grid-2': { 
    icon: Grid2X2, 
    label: '2 Columns',
    description: 'Large cards in 2 columns'
  },
  'grid-3': { 
    icon: Grid3X3, 
    label: '3 Columns',
    description: 'Medium cards in 3 columns'
  },
  'grid-4': { 
    icon: LayoutGrid, 
    label: '4 Columns',
    description: 'Standard grid with 4 columns'
  },
  'list': { 
    icon: List, 
    label: 'List',
    description: 'Horizontal list with details'
  },
  'large-cards': { 
    icon: Square, 
    label: 'Large Cards',
    description: 'Featured large cards'
  },
  'compact': { 
    icon: Rows3, 
    label: 'Compact',
    description: 'Dense grid with small items'
  },
};

const DEFAULT_LAYOUTS: LayoutPreset[] = ['grid-2', 'grid-3', 'grid-4', 'list'];

export const LayoutSelector = ({ 
  value, 
  onChange, 
  availableLayouts = DEFAULT_LAYOUTS,
  size = 'default'
}: LayoutSelectorProps) => {
  return (
    <ToggleGroup
      type="single"
      value={value}
      onValueChange={(v) => v && onChange(v as LayoutPreset)}
      className="border rounded-md bg-background"
    >
      {availableLayouts.map((layout) => {
        const config = LAYOUT_CONFIG[layout];
        const Icon = config.icon;
        return (
          <Tooltip key={layout}>
            <TooltipTrigger asChild>
              <ToggleGroupItem 
                value={layout} 
                aria-label={config.label}
                className={size === 'sm' ? 'px-2 h-8' : 'px-2.5'}
              >
                <Icon className={size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4'} />
              </ToggleGroupItem>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              <p className="font-medium">{config.label}</p>
              <p className="text-muted-foreground">{config.description}</p>
            </TooltipContent>
          </Tooltip>
        );
      })}
    </ToggleGroup>
  );
};

// Helper hook to get grid classes based on layout preset
export const useLayoutClasses = (layout: LayoutPreset) => {
  const gridClasses: Record<LayoutPreset, string> = {
    'grid-2': 'grid grid-cols-1 sm:grid-cols-2 gap-6',
    'grid-3': 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5',
    'grid-4': 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4',
    'list': 'flex flex-col gap-3',
    'large-cards': 'grid grid-cols-1 md:grid-cols-2 gap-8',
    'compact': 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3',
  };

  const cardClasses: Record<LayoutPreset, string> = {
    'grid-2': 'aspect-video',
    'grid-3': 'aspect-[4/3]',
    'grid-4': 'aspect-square',
    'list': 'flex-row h-24',
    'large-cards': 'aspect-[16/10]',
    'compact': 'aspect-square',
  };

  return {
    gridClass: gridClasses[layout],
    cardClass: cardClasses[layout],
    isListView: layout === 'list',
    isCompact: layout === 'compact',
    isLarge: layout === 'large-cards' || layout === 'grid-2',
  };
};

export default LayoutSelector;
