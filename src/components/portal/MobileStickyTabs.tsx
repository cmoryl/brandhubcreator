/**
 * Mobile Sticky Tabs Component
 * A fixed-position tab bar for mobile that stays visible while scrolling
 */

import { Building2, Package, Calendar, LayoutGrid } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type TabValue = 'all' | 'brands' | 'products' | 'events';

interface MobileStickyTabsProps {
  activeTab: TabValue;
  onTabChange: (tab: TabValue) => void;
  counts: {
    all: number;
    brands: number;
    products: number;
    events: number;
  };
  accentColor?: string;
}

export const MobileStickyTabs = ({
  activeTab,
  onTabChange,
  counts,
  accentColor,
}: MobileStickyTabsProps) => {
  const tabs = [
    { value: 'all' as const, label: 'All', icon: LayoutGrid, count: counts.all },
    { value: 'brands' as const, label: 'Brands', icon: Building2, count: counts.brands },
    { value: 'products' as const, label: 'Products', icon: Package, count: counts.products },
    { value: 'events' as const, label: 'Events', icon: Calendar, count: counts.events },
  ];

  return (
    <div className="sm:hidden fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-b border-border safe-area-inset-top">
      <div className="flex items-center justify-around px-2 py-2 max-w-lg mx-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.value;

          return (
            <button
              key={tab.value}
              onClick={() => onTabChange(tab.value)}
              className={cn(
                'flex flex-col items-center gap-0.5 px-3 sm:px-4 py-2 rounded-lg transition-all duration-200 min-w-[60px] sm:min-w-[80px] touch-manipulation touch-target-sm',
                isActive
                  ? 'bg-accent/10'
                  : 'hover:bg-muted/50 active:bg-muted'
              )}
              style={{
                color: isActive ? (accentColor || 'hsl(var(--accent))') : undefined,
              }}
              aria-label={`${tab.label} tab`}
              aria-pressed={isActive}
            >
              <div className="relative">
                <Icon className={cn('h-5 w-5 sm:h-6 sm:w-6', isActive ? 'opacity-100' : 'opacity-60')} />
                {tab.count > 0 && (
                  <Badge 
                    variant="secondary" 
                    className={cn(
                      'absolute -top-1.5 -right-2.5 h-4 min-w-4 px-1 text-[10px] flex items-center justify-center',
                      isActive && 'bg-accent/20'
                    )}
                    style={{
                      color: isActive ? (accentColor || 'hsl(var(--accent))') : undefined,
                    }}
                  >
                    {tab.count > 99 ? '99+' : tab.count}
                  </Badge>
                )}
              </div>
              <span className={cn(
                'text-[10px] sm:text-xs font-medium',
                isActive ? 'opacity-100' : 'opacity-60'
              )}>
                {tab.label}
              </span>
              {isActive && (
                <div 
                  className="absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 w-8 sm:w-10 rounded-full"
                  style={{ backgroundColor: accentColor || 'hsl(var(--accent))' }}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
