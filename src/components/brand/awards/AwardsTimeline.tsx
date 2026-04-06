import React, { useState, useRef } from 'react';
import { BrandAward } from '@/types/brand';
import { cn } from '@/lib/utils';
import { Trophy, ChevronDown, ChevronUp, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AwardCard from './AwardCard';

interface AwardsTimelineProps {
  awardsByYear: Record<number, BrandAward[]>;
  sortedYears: number[];
  canEdit: boolean;
  onEdit: (award: BrandAward) => void;
  onDelete: (id: string) => void;
}

const TIER_COLORS: Record<string, { bg: string; border: string; text: string; glow: string }> = {
  current: {
    bg: 'from-primary/15 to-primary/5',
    border: 'border-primary/40',
    text: 'text-primary',
    glow: 'shadow-[0_0_20px_-5px_hsl(var(--primary)/0.3)]',
  },
  recent: {
    bg: 'from-accent/15 to-accent/5',
    border: 'border-accent/40',
    text: 'text-accent-foreground',
    glow: 'shadow-[0_0_15px_-5px_hsl(var(--accent)/0.2)]',
  },
  older: {
    bg: 'from-muted/80 to-muted/40',
    border: 'border-border',
    text: 'text-muted-foreground',
    glow: '',
  },
};

const getYearTier = (year: number): string => {
  const currentYear = new Date().getFullYear();
  if (year >= currentYear - 1) return 'current';
  if (year >= currentYear - 3) return 'recent';
  return 'older';
};

const AwardsTimeline: React.FC<AwardsTimelineProps> = ({
  awardsByYear,
  sortedYears,
  canEdit,
  onEdit,
  onDelete,
}) => {
  const [expandedYears, setExpandedYears] = useState<Set<number>>(() => {
    // Auto-expand the most recent 2 years
    return new Set(sortedYears.slice(0, 2));
  });
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

  const expandAll = () => setExpandedYears(new Set(sortedYears));
  const collapseAll = () => setExpandedYears(new Set());

  const allExpanded = sortedYears.every(y => expandedYears.has(y));

  return (
    <div className="relative">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-5">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-primary" />
            <span className="text-[10px] font-medium">Current</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-accent" />
            <span className="text-[10px] font-medium">Recent</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-muted-foreground/40" />
            <span className="text-[10px] font-medium">Legacy</span>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={allExpanded ? collapseAll : expandAll}
          className="gap-1.5 h-7 text-xs"
        >
          {allExpanded ? (
            <><ChevronUp className="h-3.5 w-3.5" /> Collapse All</>
          ) : (
            <><ChevronDown className="h-3.5 w-3.5" /> Expand All</>
          )}
        </Button>
      </div>

      {/* Timeline */}
      <div ref={timelineRef} className="relative">
        {/* Vertical line */}
        <div className="absolute left-5 top-0 bottom-0 w-0.5">
          <div className="absolute inset-0 bg-gradient-to-b from-primary via-accent/50 to-muted-foreground/20 rounded-full" />
        </div>

        <div className="space-y-3">
          {sortedYears.map((year, yearIndex) => {
            const awards = awardsByYear[year];
            const isExpanded = expandedYears.has(year);
            const tier = getYearTier(year);
            const colors = TIER_COLORS[tier];
            
            return (
              <div
                key={year}
                ref={(el) => { if (el) yearRefs.current.set(year, el); }}
                className="relative"
              >
                {/* Timeline node */}
                <div className="absolute left-5 -translate-x-1/2 top-3.5 z-10">
                  <div className={cn(
                    "w-4 h-4 rounded-full border-2 transition-all duration-300 ring-2 ring-background",
                    isExpanded
                      ? tier === 'current' ? "bg-primary border-primary shadow-[0_0_8px_hsl(var(--primary)/0.5)]"
                        : tier === 'recent' ? "bg-accent border-accent"
                        : "bg-muted-foreground/50 border-muted-foreground/50"
                      : "bg-background border-primary/40"
                  )} />
                </div>

                {/* Year header */}
                <button
                  onClick={() => toggleYear(year)}
                  onMouseEnter={() => setHoveredYear(year)}
                  onMouseLeave={() => setHoveredYear(null)}
                  className={cn(
                    "w-full ml-10 flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
                    "hover:bg-muted/50 group text-left",
                    isExpanded && cn("bg-gradient-to-r", colors.bg, colors.glow),
                    isExpanded && "border",
                    isExpanded ? colors.border : "border-transparent"
                  )}
                >
                  <div className={cn(
                    "flex items-center justify-center w-7 h-7 rounded-lg transition-all",
                    isExpanded 
                      ? tier === 'current' ? "bg-primary/15" : tier === 'recent' ? "bg-accent/15" : "bg-muted"
                      : "bg-muted/50 group-hover:bg-primary/10"
                  )}>
                    {isExpanded ? (
                      <ChevronUp className={cn("h-4 w-4", colors.text)} />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2.5">
                    <Trophy className={cn(
                      "h-5 w-5 transition-colors",
                      isExpanded ? colors.text : "text-muted-foreground/60 group-hover:text-primary"
                    )} />
                    <span className={cn(
                      "text-xl font-bold tracking-tight transition-colors",
                      isExpanded ? "text-foreground" : "text-foreground/70 group-hover:text-foreground"
                    )}>
                      {year}
                    </span>
                  </div>
                  
                  <span className={cn(
                    "text-xs px-2.5 py-0.5 rounded-full font-semibold transition-colors",
                    isExpanded 
                      ? tier === 'current' ? "bg-primary/15 text-primary" 
                        : tier === 'recent' ? "bg-accent/15 text-accent-foreground"
                        : "bg-muted text-muted-foreground"
                      : "bg-muted/80 text-muted-foreground"
                  )}>
                    {awards.length} {awards.length === 1 ? 'award' : 'awards'}
                  </span>

                  {/* Mini badge previews when collapsed */}
                  {!isExpanded && awards.some(a => a.imageUrl) && (
                    <div className="hidden sm:flex items-center gap-1 ml-2">
                      {awards.slice(0, 4).filter(a => a.imageUrl).map((a, i) => (
                        <div key={a.id} className="w-6 h-6 rounded-md bg-white border border-border/40 overflow-hidden flex items-center justify-center shadow-sm">
                          <img src={a.imageUrl} alt="" className="max-w-full max-h-full object-contain p-0.5" loading="lazy" />
                        </div>
                      ))}
                      {awards.filter(a => a.imageUrl).length > 4 && (
                        <span className="text-[10px] text-muted-foreground font-medium ml-1">
                          +{awards.filter(a => a.imageUrl).length - 4}
                        </span>
                      )}
                    </div>
                  )}
                  
                  <div className="flex-1 h-px bg-gradient-to-r from-border/50 to-transparent ml-2" />
                </button>

                {/* Expanded awards grid */}
                <div
                  className={cn(
                    "ml-10 overflow-hidden transition-all duration-300 ease-out",
                    isExpanded ? "max-h-[3000px] opacity-100 mt-3 mb-4" : "max-h-0 opacity-0"
                  )}
                >
                  <div className="pl-4 border-l-2 border-primary/10 ml-3">
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 py-2">
                      {awards.map((award, awardIndex) => (
                        <AwardCard
                          key={award.id}
                          award={award}
                          canEdit={canEdit}
                          onEdit={onEdit}
                          onDelete={onDelete}
                          compact
                          animationDelay={awardIndex * 50}
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
