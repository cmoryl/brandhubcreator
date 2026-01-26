import React, { useState } from 'react';
import { BrandAward } from '@/types/brand';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
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

  return (
    <div className="relative">
      {/* Timeline Navigation */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm py-3 mb-6 border-b">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <button
            onClick={() => setActiveYear(null)}
            className={cn(
              "px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-300",
              "hover:bg-primary/10",
              activeYear === null 
                ? "bg-primary text-primary-foreground shadow-md" 
                : "bg-muted text-muted-foreground"
            )}
          >
            All Years
          </button>
          {sortedYears.map((year, index) => (
            <button
              key={year}
              onClick={() => setActiveYear(activeYear === year ? null : year)}
              className={cn(
                "px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-300",
                "hover:bg-primary/10 hover:scale-105",
                "animate-fade-in",
                activeYear === year 
                  ? "bg-primary text-primary-foreground shadow-md scale-105" 
                  : "bg-muted text-muted-foreground"
              )}
              style={{ 
                animationDelay: `${index * 50}ms`,
                animationFillMode: 'backwards'
              }}
            >
              {year}
              <span className="ml-1.5 text-xs opacity-70">
                ({awardsByYear[year].length})
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Timeline Content */}
      <div className="relative pl-8">
        {/* Vertical Timeline Line */}
        <div 
          className="absolute left-3 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary via-primary/50 to-transparent"
          style={{
            background: 'linear-gradient(180deg, hsl(var(--primary)) 0%, hsl(var(--primary) / 0.3) 50%, transparent 100%)'
          }}
        />

        {sortedYears
          .filter(year => activeYear === null || activeYear === year)
          .map((year, yearIndex) => (
            <div 
              key={year} 
              className={cn(
                "relative mb-8 animate-fade-in",
                "transition-all duration-500"
              )}
              style={{ 
                animationDelay: `${yearIndex * 100}ms`,
                animationFillMode: 'backwards'
              }}
            >
              {/* Year Marker */}
              <div className="absolute -left-5 flex items-center">
                <div 
                  className={cn(
                    "w-4 h-4 rounded-full border-2 border-primary bg-background",
                    "transition-all duration-300",
                    "group-hover:scale-125 group-hover:bg-primary"
                  )}
                >
                  <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" 
                    style={{ animationDuration: '2s', animationDelay: `${yearIndex * 200}ms` }}
                  />
                </div>
              </div>

              {/* Year Header */}
              <div className="flex items-center gap-3 mb-4">
                <Badge 
                  variant="secondary" 
                  className={cn(
                    "text-sm font-bold px-4 py-1.5 shadow-sm",
                    "bg-gradient-to-r from-primary/10 to-primary/5",
                    "border border-primary/20"
                  )}
                >
                  {year}
                </Badge>
                <div className="h-px flex-1 bg-gradient-to-r from-border to-transparent" />
                <span className="text-xs text-muted-foreground">
                  {awardsByYear[year].length} award{awardsByYear[year].length !== 1 ? 's' : ''}
                </span>
              </div>

              {/* Awards Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {awardsByYear[year].map((award, awardIndex) => (
                  <AwardCard
                    key={award.id}
                    award={award}
                    canEdit={canEdit}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    compact
                    animationDelay={(yearIndex * 100) + (awardIndex * 50)}
                  />
                ))}
              </div>
            </div>
          ))}
      </div>
    </div>
  );
};

export default AwardsTimeline;
