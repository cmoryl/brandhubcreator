import React from 'react';
import { ArrowUpDown, Calendar, Building2, Trophy, LayoutGrid, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

export type SortOption = 'year-desc' | 'year-asc' | 'organization' | 'title';
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
  'organization': { label: 'By Organization', icon: <Building2 className="h-3.5 w-3.5" /> },
  'title': { label: 'By Title', icon: <Trophy className="h-3.5 w-3.5" /> },
};

const AwardsSortControls: React.FC<AwardsSortControlsProps> = ({
  sortOption,
  onSortChange,
  viewMode,
  onViewModeChange,
  totalCount,
}) => {
  return (
    <div className="flex items-center justify-between gap-4 py-3 px-1">
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">{totalCount}</span> awards
        </span>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2 h-8">
              <ArrowUpDown className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{sortLabels[sortOption].label}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            {(Object.keys(sortLabels) as SortOption[]).map((option) => (
              <DropdownMenuItem
                key={option}
                onClick={() => onSortChange(option)}
                className={cn(
                  "gap-2 cursor-pointer",
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
        className="bg-muted rounded-md p-0.5"
      >
        <ToggleGroupItem 
          value="timeline" 
          aria-label="Timeline view"
          className="h-7 px-2.5 data-[state=on]:bg-background data-[state=on]:shadow-sm"
        >
          <List className="h-3.5 w-3.5" />
        </ToggleGroupItem>
        <ToggleGroupItem 
          value="grid" 
          aria-label="Grid view"
          className="h-7 px-2.5 data-[state=on]:bg-background data-[state=on]:shadow-sm"
        >
          <LayoutGrid className="h-3.5 w-3.5" />
        </ToggleGroupItem>
      </ToggleGroup>
    </div>
  );
};

export default AwardsSortControls;
