import { useMemo, useState } from 'react';
import { Shield, Eye, Moon, ChevronDown, ChevronUp, AlertTriangle, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  analyzeGradient,
  wcagLevel,
  wcagLevelColor,
  wcagBadgeBg,
  simulateColorblind,
  colorblindLabels,
  type ColorblindType,
} from '@/lib/oklchAccessibility';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface GradientAccessibilityBadgeProps {
  css: string;
  compact?: boolean;
}

export const GradientAccessibilityBadge = ({ css, compact = false }: GradientAccessibilityBadgeProps) => {
  const [expanded, setExpanded] = useState(false);

  const analysis = useMemo(() => analyzeGradient(css), [css]);

  if (analysis.colors.length < 2) return null;

  const cbTypes: ColorblindType[] = ['protanopia', 'deuteranopia', 'tritanopia'];

  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-1">
              <span className={cn('text-[10px] font-bold px-1 py-0.5 rounded border', wcagBadgeBg(analysis.wcagLevel), wcagLevelColor(analysis.wcagLevel))}>
                {analysis.wcagLevel}
              </span>
              {!analysis.colorblindSafe && <Eye className="h-3 w-3 text-amber-500" />}
              {analysis.darkModeScore < 60 && <Moon className="h-3 w-3 text-amber-500" />}
            </div>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs text-xs space-y-1">
            <p>Min contrast: {analysis.minContrast}:1 ({analysis.wcagLevel})</p>
            <p>Colorblind safe: {analysis.colorblindSafe ? 'Yes' : 'No'}</p>
            <p>Dark mode score: {analysis.darkModeScore}%</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <div className="space-y-2">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 text-xs w-full hover:bg-secondary/50 rounded px-1.5 py-1 transition-colors"
      >
        <Shield className="h-3 w-3 text-muted-foreground shrink-0" />
        <span className={cn('font-bold px-1 py-0.5 rounded border text-[10px]', wcagBadgeBg(analysis.wcagLevel), wcagLevelColor(analysis.wcagLevel))}>
          {analysis.wcagLevel}
        </span>
        <span className="text-muted-foreground truncate">
          {analysis.minContrast}:1 min
        </span>
        {!analysis.colorblindSafe && <Eye className="h-3 w-3 text-amber-500 shrink-0" />}
        {analysis.darkModeScore < 60 && <Moon className="h-3 w-3 text-amber-500 shrink-0" />}
        {expanded ? <ChevronUp className="h-3 w-3 ml-auto shrink-0" /> : <ChevronDown className="h-3 w-3 ml-auto shrink-0" />}
      </button>

      {expanded && (
        <div className="space-y-3 pl-2 border-l-2 border-border ml-1.5 text-xs">
          {/* Contrast */}
          <div>
            <p className="font-medium text-foreground mb-1">WCAG Contrast Range</p>
            <p className="text-muted-foreground">
              Min: {analysis.minContrast}:1 · Max: {analysis.maxContrast}:1
            </p>
          </div>

          {/* Colorblind Simulation */}
          <div>
            <p className="font-medium text-foreground mb-1 flex items-center gap-1">
              <Eye className="h-3 w-3" /> Colorblind Preview
              {analysis.colorblindSafe ? (
                <CheckCircle className="h-3 w-3 text-green-500 ml-1" />
              ) : (
                <AlertTriangle className="h-3 w-3 text-amber-500 ml-1" />
              )}
            </p>
            <div className="space-y-1.5">
              {cbTypes.map(type => {
                const simColors = analysis.colors.map(c => simulateColorblind(c, type));
                const simGradient = css.replace(
                  /#[0-9a-fA-F]{3,8}/g,
                  (() => {
                    let idx = 0;
                    return () => simColors[idx++] || '#808080';
                  })()
                );
                return (
                  <TooltipProvider key={type}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-full h-4 rounded-sm border border-border"
                            style={{ background: simGradient }}
                          />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="text-xs">
                        {colorblindLabels[type]}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                );
              })}
            </div>
          </div>

          {/* Dark Mode */}
          <div>
            <p className="font-medium text-foreground mb-1 flex items-center gap-1">
              <Moon className="h-3 w-3" /> Dark Mode 2.0
              <span className={cn(
                'ml-1 px-1 py-0.5 rounded text-[10px] font-bold',
                analysis.darkModeScore >= 80 ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400' :
                analysis.darkModeScore >= 60 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400' :
                'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400'
              )}>
                {analysis.darkModeScore}%
              </span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
