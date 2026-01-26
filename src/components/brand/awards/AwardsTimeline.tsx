import React, { useState, useRef, useEffect } from 'react';
import { BrandAward } from '@/types/brand';
import { cn } from '@/lib/utils';
import { Trophy, ChevronLeft, ChevronRight } from 'lucide-react';
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
  const [activeYear, setActiveYear] = useState<number | null>(null);
  const [hoveredYear, setHoveredYear] = useState<number | null>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const yearRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  const scrollToYear = (year: number) => {
    const element = yearRefs.current.get(year);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleYearClick = (year: number) => {
    if (activeYear === year) {
      setActiveYear(null);
    } else {
      setActiveYear(year);
      scrollToYear(year);
    }
  };

  const filteredYears = activeYear 
    ? sortedYears.filter(y => y === activeYear)
    : sortedYears;

  return (
    <div className="relative">
      {/* Horizontal Year Navigation - Professional Design */}
      <div className="sticky top-0 z-20 bg-background/98 backdrop-blur-md border-b border-border/50 -mx-4 px-4 sm:-mx-6 sm:px-6">
        <div className="py-4">
          {/* Year Pills Row */}
          <div className="flex items-center gap-2">
            {/* All button */}
            <button
              onClick={() => setActiveYear(null)}
              className={cn(
                "relative px-4 py-2 rounded-full text-sm font-medium transition-all duration-300",
                "border border-transparent",
                activeYear === null 
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25" 
                  : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              All
            </button>

            {/* Divider */}
            <div className="w-px h-6 bg-border mx-1" />

            {/* Scrollable Year Pills */}
            <div className="flex-1 overflow-x-auto scrollbar-hide">
              <div className="flex items-center gap-1.5">
                {sortedYears.map((year, index) => {
                  const count = awardsByYear[year].length;
                  const isActive = activeYear === year;
                  const isHovered = hoveredYear === year;
                  
                  return (
                    <button
                      key={year}
                      onClick={() => handleYearClick(year)}
                      onMouseEnter={() => setHoveredYear(year)}
                      onMouseLeave={() => setHoveredYear(null)}
                      className={cn(
                        "relative flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-all duration-300",
                        "border whitespace-nowrap",
                        isActive
                          ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20 scale-105"
                          : "bg-card border-border/50 text-foreground hover:border-primary/30 hover:bg-accent/5"
                      )}
                      style={{
                        animationDelay: `${index * 30}ms`,
                      }}
                    >
                      <span className="font-semibold">{year}</span>
                      <span className={cn(
                        "text-xs px-1.5 py-0.5 rounded-full",
                        isActive 
                          ? "bg-primary-foreground/20 text-primary-foreground" 
                          : "bg-muted text-muted-foreground"
                      )}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Timeline Content */}
      <div ref={timelineRef} className="relative mt-8">
        {/* Main vertical timeline line */}
        <div className="absolute left-4 sm:left-6 top-0 bottom-0 w-px">
          <div className="absolute inset-0 bg-gradient-to-b from-primary via-primary/40 to-transparent" />
          {/* Animated glow effect */}
          <div 
            className="absolute inset-0 bg-gradient-to-b from-primary to-transparent opacity-50 blur-sm"
            style={{ animation: 'pulse 3s ease-in-out infinite' }}
          />
        </div>

        {/* Year Sections */}
        <div className="space-y-12">
          {filteredYears.map((year, yearIndex) => {
            const awards = awardsByYear[year];
            
            return (
              <div
                key={year}
                ref={(el) => {
                  if (el) yearRefs.current.set(year, el);
                }}
                className="relative animate-fade-in"
                style={{ 
                  animationDelay: `${yearIndex * 80}ms`,
                  animationFillMode: 'backwards'
                }}
              >
                {/* Year Marker Node */}
                <div className="absolute left-4 sm:left-6 -translate-x-1/2 flex flex-col items-center z-10">
                  {/* Outer glow ring */}
                  <div className={cn(
                    "absolute w-10 h-10 rounded-full transition-all duration-500",
                    activeYear === year 
                      ? "bg-primary/20 scale-125" 
                      : "bg-transparent scale-100"
                  )} />
                  {/* Main node */}
                  <div className={cn(
                    "relative w-4 h-4 rounded-full border-2 transition-all duration-300",
                    "flex items-center justify-center",
                    activeYear === year
                      ? "bg-primary border-primary scale-125 shadow-lg shadow-primary/40"
                      : "bg-background border-primary/60 hover:border-primary hover:scale-110"
                  )}>
                    {activeYear === year && (
                      <div className="absolute inset-0 rounded-full bg-primary animate-ping opacity-30" />
                    )}
                  </div>
                </div>

                {/* Year Content */}
                <div className="ml-12 sm:ml-16">
                  {/* Year Header */}
                  <div className="flex items-center gap-4 mb-6">
                    <div className={cn(
                      "flex items-center gap-3 px-4 py-2 rounded-xl transition-all duration-300",
                      "bg-gradient-to-r from-primary/10 via-primary/5 to-transparent",
                      "border-l-2 border-primary"
                    )}>
                      <Trophy className="h-4 w-4 text-primary" />
                      <span className="text-2xl font-bold tracking-tight text-foreground">
                        {year}
                      </span>
                      <span className="text-sm text-muted-foreground font-medium">
                        {awards.length} {awards.length === 1 ? 'award' : 'awards'}
                      </span>
                    </div>
                    <div className="flex-1 h-px bg-gradient-to-r from-border to-transparent" />
                  </div>

                  {/* Awards Grid - Compact Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3">
                    {awards.map((award, awardIndex) => (
                      <AwardCard
                        key={award.id}
                        award={award}
                        canEdit={canEdit}
                        onEdit={onEdit}
                        onDelete={onDelete}
                        compact
                        animationDelay={(yearIndex * 80) + (awardIndex * 40)}
                      />
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom fade */}
        <div className="absolute bottom-0 left-4 sm:left-6 w-4 h-16 bg-gradient-to-t from-background to-transparent -translate-x-1/2" />
      </div>
    </div>
  );
};

export default AwardsTimeline;
