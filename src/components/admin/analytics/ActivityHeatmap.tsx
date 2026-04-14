/**
 * ActivityHeatmap - Hour-of-day × Day-of-week heatmap for page views/activity
 */

import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface HeatmapData {
  hour: number;
  day: number; // 0=Sun, 6=Sat
  count: number;
}

interface ActivityHeatmapProps {
  data: HeatmapData[];
  title?: string;
  description?: string;
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

function getIntensityClass(count: number, max: number): string {
  if (max === 0 || count === 0) return 'bg-muted/30';
  const ratio = count / max;
  if (ratio > 0.75) return 'bg-primary';
  if (ratio > 0.5) return 'bg-primary/70';
  if (ratio > 0.25) return 'bg-primary/40';
  return 'bg-primary/15';
}

function formatHour(hour: number): string {
  if (hour === 0) return '12a';
  if (hour < 12) return `${hour}a`;
  if (hour === 12) return '12p';
  return `${hour - 12}p`;
}

export function ActivityHeatmap({ data, title = 'Activity Heatmap', description = 'Page views by hour and day of week' }: ActivityHeatmapProps) {
  const { grid, maxCount, totalActivity } = useMemo(() => {
    const grid = new Map<string, number>();
    let maxCount = 0;
    let totalActivity = 0;

    data.forEach(({ hour, day, count }) => {
      const key = `${day}-${hour}`;
      grid.set(key, (grid.get(key) || 0) + count);
      const val = grid.get(key)!;
      if (val > maxCount) maxCount = val;
      totalActivity += count;
    });

    return { grid, maxCount, totalActivity };
  }, [data]);

  // Find peak hour
  const peakInfo = useMemo(() => {
    let peakKey = '';
    let peakVal = 0;
    grid.forEach((val, key) => {
      if (val > peakVal) {
        peakVal = val;
        peakKey = key;
      }
    });
    if (!peakKey) return null;
    const [day, hour] = peakKey.split('-').map(Number);
    return { day: DAYS[day], hour: formatHour(hour), count: peakVal };
  }, [grid]);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            <CardDescription className="text-xs">{description}</CardDescription>
          </div>
          {peakInfo && (
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Peak Activity</p>
              <p className="text-sm font-semibold">{peakInfo.day} {peakInfo.hour}</p>
              <p className="text-xs text-muted-foreground">{peakInfo.count} events</p>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <div className="min-w-[600px]">
            {/* Hour labels */}
            <div className="flex ml-10 mb-1">
              {HOURS.filter(h => h % 3 === 0).map(h => (
                <div key={h} className="text-[10px] text-muted-foreground" style={{ width: `${100 / 8}%` }}>
                  {formatHour(h)}
                </div>
              ))}
            </div>

            {/* Grid */}
            {DAYS.map((day, dayIndex) => (
              <div key={day} className="flex items-center gap-1 mb-[2px]">
                <span className="text-[10px] text-muted-foreground w-8 text-right shrink-0">{day}</span>
                <div className="flex gap-[2px] flex-1">
                  {HOURS.map(hour => {
                    const count = grid.get(`${dayIndex}-${hour}`) || 0;
                    return (
                      <Tooltip key={hour}>
                        <TooltipTrigger asChild>
                          <div
                            className={cn(
                              'flex-1 h-4 rounded-sm transition-colors cursor-default',
                              getIntensityClass(count, maxCount)
                            )}
                          />
                        </TooltipTrigger>
                        <TooltipContent side="top" className="text-xs">
                          <p className="font-medium">{day} {formatHour(hour)}</p>
                          <p>{count} event{count !== 1 ? 's' : ''}</p>
                        </TooltipContent>
                      </Tooltip>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Legend */}
            <div className="flex items-center justify-end gap-2 mt-3">
              <span className="text-[10px] text-muted-foreground">Less</span>
              {['bg-muted/30', 'bg-primary/15', 'bg-primary/40', 'bg-primary/70', 'bg-primary'].map(cls => (
                <div key={cls} className={cn('w-3 h-3 rounded-sm', cls)} />
              ))}
              <span className="text-[10px] text-muted-foreground">More</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
