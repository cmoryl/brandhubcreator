/**
 * Contrast Matrix — heatmap grid showing every color pair's
 * WCAG contrast ratio at a glance.
 */

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { contrastRatio, wcagLevel, type WcagLevel } from '@/lib/oklchAccessibility';
import { Grid3X3 } from 'lucide-react';

interface LabColor {
  id: string;
  hex: string;
  name: string;
}

const cellColor = (level: WcagLevel): string => {
  switch (level) {
    case 'AAA': return 'bg-green-500/20 dark:bg-green-500/30';
    case 'AA': return 'bg-emerald-500/20 dark:bg-emerald-500/30';
    case 'AA-large': return 'bg-amber-500/20 dark:bg-amber-500/30';
    case 'Fail': return 'bg-red-500/20 dark:bg-red-500/30';
  }
};

const levelLabel = (level: WcagLevel): string => {
  switch (level) {
    case 'AAA': return '✓ AAA';
    case 'AA': return '✓ AA';
    case 'AA-large': return '~ Lg';
    case 'Fail': return '✗ Fail';
  }
};

export function ContrastMatrix({ colors }: { colors: LabColor[] }) {
  const matrix = useMemo(() => {
    return colors.map(row =>
      colors.map(col => {
        if (row.id === col.id) return null;
        const ratio = contrastRatio(row.hex, col.hex);
        return { ratio, level: wcagLevel(ratio) };
      })
    );
  }, [colors]);

  if (colors.length < 2) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Grid3X3 className="h-10 w-10 mx-auto mb-3 opacity-30" />
        <p className="text-sm">Add at least 2 colors for the contrast matrix</p>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Grid3X3 className="h-4 w-4 text-primary" />
          Contrast Matrix
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="p-1" />
                {colors.map(c => (
                  <th key={c.id} className="p-1">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="w-7 h-7 rounded border mx-auto cursor-pointer" style={{ backgroundColor: c.hex }} />
                      </TooltipTrigger>
                      <TooltipContent className="text-xs">
                        <p className="font-semibold">{c.name}</p>
                        <p className="font-mono">{c.hex}</p>
                      </TooltipContent>
                    </Tooltip>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {colors.map((row, ri) => (
                <tr key={row.id}>
                  <td className="p-1">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="w-7 h-7 rounded border cursor-pointer" style={{ backgroundColor: row.hex }} />
                      </TooltipTrigger>
                      <TooltipContent className="text-xs">
                        <p className="font-semibold">{row.name}</p>
                        <p className="font-mono">{row.hex}</p>
                      </TooltipContent>
                    </Tooltip>
                  </td>
                  {colors.map((col, ci) => {
                    const cell = matrix[ri][ci];
                    if (!cell) {
                      return (
                        <td key={col.id} className="p-1">
                          <div className="w-full aspect-square rounded bg-muted/30 flex items-center justify-center min-w-[40px]">
                            <span className="text-[9px] text-muted-foreground">—</span>
                          </div>
                        </td>
                      );
                    }
                    return (
                      <td key={col.id} className="p-1">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className={cn(
                              "w-full aspect-square rounded flex flex-col items-center justify-center min-w-[40px] cursor-pointer transition-transform hover:scale-110",
                              cellColor(cell.level),
                            )}>
                              <span className="text-[10px] font-bold leading-none">{cell.ratio.toFixed(1)}</span>
                              <span className="text-[8px] leading-none mt-0.5">{levelLabel(cell.level)}</span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent className="text-xs">
                            <p className="font-semibold">{row.name} on {col.name}</p>
                            <p>Ratio: {cell.ratio.toFixed(2)}:1 — {cell.level}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <div className="rounded px-2 py-0.5 text-[10px] font-medium" style={{ backgroundColor: col.hex, color: row.hex }}>
                                Sample
                              </div>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-4 mt-3 pt-3 border-t">
          {(['AAA', 'AA', 'AA-large', 'Fail'] as WcagLevel[]).map(level => (
            <div key={level} className="flex items-center gap-1.5">
              <div className={cn("w-3 h-3 rounded", cellColor(level))} />
              <span className="text-[10px] text-muted-foreground">{level}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
