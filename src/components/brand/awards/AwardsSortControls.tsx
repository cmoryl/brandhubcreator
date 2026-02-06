import React from 'react';
import { ArrowUpDown, Calendar, Building2, Trophy, LayoutGrid, List, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

export type SortOption = 'year-desc' | 'year-asc' | 'organization' | 'title' | 'category';
export type ViewMode = 'timeline' | 'grid';

interface AwardsSortControlsProps {
  sortOption: SortOption;
  onSortChange: (option: SortOption) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  totalCount: number;
}

const sortLabels: Record<SortOption, { label: string; icon: React.ReactNode }> = {
  'year-desc': { label: 'Newest First', icon: <Calendar className="h-3.5 w-3.5" /> },
  'year-asc': { label: 'Oldest First', icon: <Calendar className="h-3.5 w-3.5" /> },
  'category': { label: 'Category', icon: <Tag className="h-3.5 w-3.5" /> },
  'organization': { label: 'Organization', icon: <Building2 className="h-3.5 w-3.5" /> },
  'title': { label: 'Title', icon: <Trophy className="h-3.5 w-3.5" /> },
};

const AwardsSortControls: React.FC<AwardsSortControlsProps> = ({
  sortOption,
  onSortChange,
  viewMode,
  onViewModeChange,
  totalCount,
}) => {
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-sm">
          <Trophy className="h-4 w-4 text-primary" />
          <span className="font-semibold text-foreground">{totalCount}</span>
          <span className="text-muted-foreground">total awards</span>
        </div>
        
        <div className="w-px h-5 bg-border" />
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-2 h-8 text-muted-foreground hover:text-foreground">
              <ArrowUpDown className="h-3.5 w-3.5" />
              <span className="text-xs">{sortLabels[sortOption].label}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-44">
            {(Object.keys(sortLabels) as SortOption[]).map((option) => (
              <DropdownMenuItem
                key={option}
                onClick={() => onSortChange(option)}
                className={cn(
                  "gap-2 cursor-pointer text-sm",
                  sortOption === option && "bg-accent"
                )}
              >
                {sortLabels[option].icon}
                {sortLabels[option].label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <ToggleGroup 
        type="single" 
        value={viewMode} 
        onValueChange={(value) => value && onViewModeChange(value as ViewMode)}
        className="bg-muted/50 rounded-lg p-0.5 border border-border/50"
      >
        <ToggleGroupItem 
          value="timeline" 
          aria-label="Timeline view"
          className="h-7 w-8 data-[state=on]:bg-background data-[state=on]:shadow-sm rounded-md"
        >
          <List className="h-3.5 w-3.5" />
        </ToggleGroupItem>
        <ToggleGroupItem 
          value="grid" 
          aria-label="Grid view"
          className="h-7 w-8 data-[state=on]:bg-background data-[state=on]:shadow-sm rounded-md"
        >
          <LayoutGrid className="h-3.5 w-3.5" />
        </ToggleGroupItem>
      </ToggleGroup>
    </div>
  );
};

export default AwardsSortControls;
