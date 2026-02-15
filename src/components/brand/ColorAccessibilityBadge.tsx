import { useMemo, useState } from 'react';
import { Eye, Moon, Shield, ChevronDown, ChevronUp, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  contrastRatio,
  wcagLevel,
  wcagLevelColor,
  wcagBadgeBg,
  hexToOklch,
  formatOklch,
  simulateColorblind,
  colorblindLabels,
  evaluateDarkModeCompliance,
  type ColorblindType,
  type WcagLevel,
} from '@/lib/oklchAccessibility';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface ColorAccessibilityBadgeProps {
  hex: string;
  name?: string;
  compact?: boolean;
}

/**
 * Inline accessibility badge for a single color swatch.
 * Shows WCAG contrast vs white/dark, colorblind preview dots, and dark mode score.
 */
export const ColorAccessibilityBadge = ({ hex, name, compact = false }: ColorAccessibilityBadgeProps) => {
  const [expanded, setExpanded] = useState(false);

  const analysis = useMemo(() => {
    const onWhite = contrastRatio(hex, '#FFFFFF');
    const onDark = contrastRatio(hex, '#1A1A2E');
    const oklch = hexToOklch(hex);
    const darkMode = evaluateDarkModeCompliance(hex);
    const cbTypes: ColorblindType[] = ['protanopia', 'deuteranopia', 'tritanopia'];
    const cbSimulations = cbTypes.map(type => ({
      type,
      label: colorblindLabels[type],
      simulated: simulateColorblind(hex, type),
    }));
    return { onWhite, onDark, oklch, darkMode, cbSimulations };
  }, [hex]);

  const whiteLevel = wcagLevel(analysis.onWhite);
  const darkLevel = wcagLevel(analysis.onDark);
  const bestLevel = analysis.onWhite >= analysis.onDark ? whiteLevel : darkLevel;

  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-1">
              <span className={cn('text-[10px] font-bold px-1 py-0.5 rounded border', wcagBadgeBg(bestLevel), wcagLevelColor(bestLevel))}>
                {bestLevel}
              </span>
              {analysis.darkMode.score < 60 && (
                <Moon className="h-3 w-3 text-amber-500" />
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs">
            <div className="space-y-1 text-xs">
              <p className="font-medium">WCAG Contrast</p>
              <p>On white: {analysis.onWhite.toFixed(1)}:1 ({whiteLevel})</p>
              <p>On dark: {analysis.onDark.toFixed(1)}:1 ({darkLevel})</p>
              <p className="font-medium pt-1">OKLCH</p>
              <p>{formatOklch(analysis.oklch)}</p>
              {analysis.darkMode.issues.length > 0 && (
                <>
                  <p className="font-medium pt-1 text-amber-500">Dark Mode Issues</p>
                  {analysis.darkMode.issues.map((issue, i) => (
                    <p key={i}>• {issue}</p>
                  ))}
                </>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <div className="space-y-2">
      {/* Summary row */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 text-xs w-full hover:bg-secondary/50 rounded px-1.5 py-1 transition-colors"
      >
        <Shield className="h-3 w-3 text-muted-foreground shrink-0" />
        <span className={cn('font-bold px-1 py-0.5 rounded border text-[10px]', wcagBadgeBg(bestLevel), wcagLevelColor(bestLevel))}>
          {bestLevel}
        </span>
        <span className="text-muted-foreground truncate">
          {analysis.onWhite.toFixed(1)}:1 / {analysis.onDark.toFixed(1)}:1
        </span>
        {analysis.darkMode.score < 60 && <Moon className="h-3 w-3 text-amber-500 shrink-0" />}
        {expanded ? <ChevronUp className="h-3 w-3 ml-auto shrink-0" /> : <ChevronDown className="h-3 w-3 ml-auto shrink-0" />}
      </button>

      {expanded && (
        <div className="space-y-3 pl-2 border-l-2 border-border ml-1.5 text-xs">
          {/* OKLCH Value */}
          <div>
            <p className="font-medium text-foreground mb-1">OKLCH Value</p>
            <code className="text-[11px] bg-muted px-1.5 py-0.5 rounded font-mono">
              {formatOklch(analysis.oklch)}
            </code>
          </div>

          {/* WCAG Contrast Details */}
          <div>
            <p className="font-medium text-foreground mb-1">WCAG Contrast</p>
            <div className="flex gap-2">
              <ContrastPill label="On White" ratio={analysis.onWhite} level={whiteLevel} bgHex="#FFFFFF" fgHex={hex} />
              <ContrastPill label="On Dark" ratio={analysis.onDark} level={darkLevel} bgHex="#1A1A2E" fgHex={hex} />
            </div>
          </div>

          {/* Colorblind Simulation */}
          <div>
            <p className="font-medium text-foreground mb-1 flex items-center gap-1">
              <Eye className="h-3 w-3" /> Colorblind Preview
            </p>
            <div className="flex gap-1.5">
              {analysis.cbSimulations.map(({ type, label, simulated }) => (
                <TooltipProvider key={type}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div
                        className="w-6 h-6 rounded-full border border-border shadow-sm"
                        style={{ backgroundColor: simulated }}
                      />
                    </TooltipTrigger>
                    <TooltipContent side="top" className="text-xs">
                      <p className="font-medium">{label}</p>
                      <p className="font-mono">{simulated}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ))}
            </div>
          </div>

          {/* Dark Mode 2.0 */}
          <div>
            <p className="font-medium text-foreground mb-1 flex items-center gap-1">
              <Moon className="h-3 w-3" /> Dark Mode 2.0
              <span className={cn(
                'ml-1 px-1 py-0.5 rounded text-[10px] font-bold',
                analysis.darkMode.score >= 80 ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400' :
                analysis.darkMode.score >= 60 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400' :
                'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400'
              )}>
                {analysis.darkMode.score}%
              </span>
            </p>
            {analysis.darkMode.issues.length > 0 ? (
              <ul className="space-y-0.5">
                {analysis.darkMode.issues.map((issue, i) => (
                  <li key={i} className="flex items-start gap-1 text-muted-foreground">
                    <AlertTriangle className="h-3 w-3 text-amber-500 shrink-0 mt-0.5" />
                    {issue}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground flex items-center gap-1">
                <CheckCircle className="h-3 w-3 text-green-500" /> Fully compliant
              </p>
            )}
            {analysis.darkMode.suggestions.length > 0 && (
              <ul className="mt-1 space-y-0.5">
                {analysis.darkMode.suggestions.map((s, i) => (
                  <li key={i} className="flex items-start gap-1 text-muted-foreground">
                    <Info className="h-3 w-3 text-blue-500 shrink-0 mt-0.5" />
                    {s}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ── Small sub-component ─────────────────────────────────────────────

const ContrastPill = ({ label, ratio, level, bgHex, fgHex }: {
  label: string; ratio: number; level: WcagLevel; bgHex: string; fgHex: string;
}) => (
  <div className="flex items-center gap-1.5">
    <div className="w-5 h-5 rounded-sm border border-border overflow-hidden flex items-center justify-center" style={{ backgroundColor: bgHex }}>
      <span className="text-[8px] font-bold" style={{ color: fgHex }}>Aa</span>
    </div>
    <span className="text-muted-foreground">{label}: {ratio.toFixed(1)}:1</span>
    <span className={cn('text-[10px] font-bold', wcagLevelColor(level))}>{level}</span>
  </div>
);
