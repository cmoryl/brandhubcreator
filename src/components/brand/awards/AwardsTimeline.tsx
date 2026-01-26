import React, { useState, useRef } from 'react';
import { BrandAward } from '@/types/brand';
import { cn } from '@/lib/utils';
import { Trophy, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AwardCard from './AwardCard';

interface AwardsTimelineProps {
  awardsByYear: Record<number, BrandAward[]>;
  sortedYears: number[];
  canEdit: boolean;
  onEdit: (award: BrandAward) => void;
  onDelete: (id: string) => void;
}

const AwardsTimeline: React.FC<AwardsTimelineProps> = ({
  awardsByYear,
  sortedYears,
  canEdit,
  onEdit,
  onDelete,
}) => {
  // Start with all years collapsed
  const [expandedYears, setExpandedYears] = useState<Set<number>>(new Set());
  const [hoveredYear, setHoveredYear] = useState<number | null>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const yearRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  const toggleYear = (year: number) => {
    setExpandedYears(prev => {
      const next = new Set(prev);
      if (next.has(year)) {
        next.delete(year);
      } else {
        next.add(year);
      }
      return next;
    });
  };

  const expandAll = () => {
    setExpandedYears(new Set(sortedYears));
  };

  const collapseAll = () => {
    setExpandedYears(new Set());
  };

  const allExpanded = sortedYears.every(y => expandedYears.has(y));
  const someExpanded = expandedYears.size > 0;

  return (
    <div className="relative">
      {/* Compact Header with Expand/Collapse */}
      <div className="flex items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>{sortedYears.length} years of awards</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={allExpanded ? collapseAll : expandAll}
          className="gap-1.5 h-7 text-xs"
        >
          {allExpanded ? (
            <>
              <ChevronUp className="h-3.5 w-3.5" />
              Collapse All
            </>
          ) : (
            <>
              <ChevronDown className="h-3.5 w-3.5" />
              Expand All
            </>
          )}
        </Button>
      </div>

      {/* Timeline Content */}
      <div ref={timelineRef} className="relative">
        {/* Main vertical timeline line */}
        <div className="absolute left-4 sm:left-5 top-0 bottom-0 w-px">
          <div className="absolute inset-0 bg-gradient-to-b from-primary via-primary/40 to-transparent" />
        </div>

        {/* Year Sections */}
        <div className="space-y-2">
          {sortedYears.map((year, yearIndex) => {
            const awards = awardsByYear[year];
            const isExpanded = expandedYears.has(year);
            
            return (
              <div
                key={year}
                ref={(el) => {
                  if (el) yearRefs.current.set(year, el);
                }}
                className="relative"
              >
                {/* Year Marker Node */}
                <div className="absolute left-4 sm:left-5 -translate-x-1/2 top-3 z-10">
                  <div className={cn(
                    "w-3 h-3 rounded-full border-2 transition-all duration-300",
                    isExpanded
                      ? "bg-primary border-primary"
                      : "bg-background border-primary/60"
                  )} />
                </div>

                {/* Year Header - Clickable */}
                <button
                  onClick={() => toggleYear(year)}
                  onMouseEnter={() => setHoveredYear(year)}
                  onMouseLeave={() => setHoveredYear(null)}
                  className={cn(
                    "w-full ml-8 sm:ml-10 flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200",
                    "hover:bg-muted/50 group text-left",
                    isExpanded && "bg-muted/30"
                  )}
                >
                  <div className={cn(
                    "flex items-center justify-center w-6 h-6 rounded-md transition-all",
                    isExpanded ? "bg-primary/10" : "bg-muted/50 group-hover:bg-primary/10"
                  )}>
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4 text-primary" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-primary" />
                    <span className="text-lg font-bold tracking-tight text-foreground">
                      {year}
                    </span>
                  </div>
                  
                  <span className={cn(
                    "text-xs px-2 py-0.5 rounded-full font-medium",
                    isExpanded 
                      ? "bg-primary/10 text-primary" 
                      : "bg-muted text-muted-foreground"
                  )}>
                    {awards.length} {awards.length === 1 ? 'award' : 'awards'}
                  </span>
                  
                  <div className="flex-1 h-px bg-gradient-to-r from-border/50 to-transparent ml-2" />
                </button>

                {/* Collapsible Awards Grid */}
                <div
                  className={cn(
                    "ml-8 sm:ml-10 overflow-hidden transition-all duration-300 ease-out",
                    isExpanded ? "max-h-[2000px] opacity-100 mt-2 mb-4" : "max-h-0 opacity-0"
                  )}
                >
                  <div className="pl-4 border-l border-border/30 ml-3">
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 py-2">
                      {awards.map((award, awardIndex) => (
                        <AwardCard
                          key={award.id}
                          award={award}
                          canEdit={canEdit}
                          onEdit={onEdit}
                          onDelete={onDelete}
                          compact
                          animationDelay={awardIndex * 30}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AwardsTimeline;
