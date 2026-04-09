/**
 * IconStudioTabs - Tab-based navigation replacing the old wizard stepper
 * Simplified from 6 confusing sequential steps to 4 clear, freely-navigable tabs
 */

import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export interface StudioTab {
  id: string;
  label: string;
  icon: LucideIcon;
  description: string;
  badge?: number;
}

interface IconStudioTabsProps {
  tabs: StudioTab[];
  activeTab: string;
  onTabChange: (id: string) => void;
}

export const IconStudioTabs = ({
  tabs,
  activeTab,
  onTabChange,
}: IconStudioTabsProps) => {
  return (
    <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = tab.id === activeTab;

        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap',
              'hover:bg-accent/50',
              isActive
                ? 'bg-primary/10 text-primary border border-primary/20 shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Icon className="h-4 w-4 flex-shrink-0" />
            <span>{tab.label}</span>
            {tab.badge !== undefined && tab.badge > 0 && (
              <Badge variant="secondary" className="h-5 px-1.5 text-[10px] ml-0.5">
                {tab.badge}
              </Badge>
            )}
          </button>
        );
      })}
    </div>
  );
};
