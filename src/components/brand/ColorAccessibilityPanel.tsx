import { useMemo, useState } from 'react';
import { Shield, Eye, Moon, Sun, ChevronDown, ChevronUp, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { BrandColor } from '@/types/brand';
import {
  analyzePalette,
  simulateColorblind,
  colorblindLabels,
  wcagLevelColor,
  wcagBadgeBg,
  suggestAccessibleColor,
  type ColorblindType,
  type PaletteAccessibilityReport,
} from '@/lib/oklchAccessibility';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface ColorAccessibilityPanelProps {
  colors: BrandColor[];
}

export const ColorAccessibilityPanel = ({ colors }: ColorAccessibilityPanelProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeSimulation, setActiveSimulation] = useState<ColorblindType | null>(null);

  const report = useMemo(() => {
    if (colors.length === 0) return null;
    return analyzePalette(colors.map(c => ({ hex: c.hex, name: c.name })));
  }, [colors]);

  if (!report || colors.length === 0) return null;

  const scoreColor = (score: number) =>
    score >= 80 ? 'text-green-600 dark:text-green-400' :
    score >= 60 ? 'text-amber-600 dark:text-amber-400' :
    'text-red-600 dark:text-red-400';

  const scoreBg = (score: number) =>
    score >= 80 ? 'bg-green-100 dark:bg-green-900/30' :
    score >= 60 ? 'bg-amber-100 dark:bg-amber-900/30' :
    'bg-red-100 dark:bg-red-900/30';

  const cbTypes: ColorblindType[] = ['protanopia', 'deuteranopia', 'tritanopia', 'achromatopsia'];

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <button className="flex items-center gap-3 w-full p-3 rounded-lg border border-border bg-card hover:bg-secondary/30 transition-colors text-left">
          <Shield className="h-5 w-5 text-primary shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground">OKLCH Accessibility Report</p>
            <p className="text-xs text-muted-foreground">WCAG contrast · Colorblind safety · Dark Mode 2.0</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className={cn('text-lg font-bold', scoreColor(report.overallScore))}>
              {report.overallScore}%
            </span>
            {isOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
          </div>
        </button>
      </CollapsibleTrigger>

      <CollapsibleContent>
        <div className="mt-3 space-y-4 p-4 rounded-lg border border-border bg-card">
          {/* Score Summary */}
          <div className="grid grid-cols-3 gap-3">
            <ScoreCard
              icon={<Shield className="h-4 w-4" />}
              label="WCAG Contrast"
              score={Math.round(report.wcagPairs.filter(p => p.level !== 'Fail').length / Math.max(report.wcagPairs.length, 1) * 100)}
            />
            <ScoreCard
              icon={<Eye className="h-4 w-4" />}
              label="Colorblind Safe"
              score={report.colorblindScore}
            />
            <ScoreCard
              icon={<Moon className="h-4 w-4" />}
              label="Dark Mode 2.0"
              score={Math.round(report.darkModeScores.reduce((s, d) => s + d.compliance.score, 0) / Math.max(report.darkModeScores.length, 1))}
            />
          </div>

          {/* OKLCH Values Table */}
          <div>
            <h4 className="text-sm font-medium text-foreground mb-2">OKLCH Values</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {report.oklchValues.map(({ hex, name, formatted }) => (
                <div key={hex} className="flex items-center gap-2 text-xs p-2 rounded bg-muted/50">
                  <div className="w-5 h-5 rounded-sm border border-border shrink-0" style={{ backgroundColor: hex }} />
                  <span className="font-medium text-foreground truncate">{name}</span>
                  <code className="ml-auto font-mono text-[10px] text-muted-foreground shrink-0">{formatted}</code>
                </div>
              ))}
            </div>
          </div>

          {/* WCAG Contrast Pairs */}
          <div>
            <h4 className="text-sm font-medium text-foreground mb-2">Contrast Compliance</h4>
            <div className="space-y-1.5">
              <TooltipProvider delayDuration={200}>
                {report.wcagPairs.map((pair, i) => {
                  const suggestion = pair.level === 'Fail' || pair.level === 'AA-large'
                    ? suggestAccessibleColor(pair.color1.hex, pair.color2.hex)
                    : null;
                  return (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      <div className="flex items-center gap-1 shrink-0">
                        <div className="w-4 h-4 rounded-sm border border-border" style={{ backgroundColor: pair.color1.hex }} />
                        <span className="text-muted-foreground">on</span>
                        <div className="w-4 h-4 rounded-sm border border-border" style={{ backgroundColor: pair.color2.hex }} />
                      </div>
                      <span className="text-muted-foreground truncate">
                        {pair.color1.name} on {pair.color2.name}
                      </span>
                      <span className="ml-auto text-muted-foreground shrink-0">{pair.ratio}:1</span>
                      <span className={cn('font-bold text-[10px] px-1 py-0.5 rounded border shrink-0', wcagBadgeBg(pair.level), wcagLevelColor(pair.level))}>
                        {pair.level}
                      </span>
                      {suggestion && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              type="button"
                              className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors shrink-0"
                              onClick={() => {
                                navigator.clipboard.writeText(suggestion);
                              }}
                            >
                              <div className="w-3 h-3 rounded-sm border border-primary/30" style={{ backgroundColor: suggestion }} />
                              Fix
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="text-xs max-w-[200px]">
                            <p className="font-medium mb-1">Suggested: {suggestion}</p>
                            <p className="text-muted-foreground">Click to copy. Adjusted lightness to meet WCAG AA (4.5:1).</p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                  );
                })}
              </TooltipProvider>
            </div>
          </div>

          {/* Colorblind Simulation */}
          <div>
            <h4 className="text-sm font-medium text-foreground mb-2">Colorblind Simulation</h4>
            <div className="space-y-2">
              {cbTypes.map(type => (
                <div key={type} className="space-y-1">
                  <p className="text-xs text-muted-foreground">{colorblindLabels[type]}</p>
                  <div className="flex gap-1.5">
                    {colors.map(c => (
                      <div key={c.id} className="flex flex-col items-center gap-0.5">
                        <div
                          className="w-8 h-8 rounded-md border border-border"
                          style={{ backgroundColor: simulateColorblind(c.hex, type) }}
                        />
                        <span className="text-[9px] text-muted-foreground truncate max-w-[32px]">{c.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Dark Mode Issues */}
          <div>
            <h4 className="text-sm font-medium text-foreground mb-2 flex items-center gap-1">
              <Moon className="h-4 w-4" /> Dark Mode 2.0 Analysis
            </h4>
            <div className="space-y-2">
              {report.darkModeScores.map(({ hex, name, compliance }) => (
                <div key={hex} className="p-2 rounded bg-muted/50 space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-sm border border-border shrink-0" style={{ backgroundColor: hex }} />
                    <span className="text-xs font-medium text-foreground">{name}</span>
                    <span className={cn('ml-auto text-xs font-bold', scoreColor(compliance.score))}>
                      {compliance.score}%
                    </span>
                  </div>
                  {compliance.issues.length > 0 && (
                    <ul className="space-y-0.5 text-xs pl-6">
                      {compliance.issues.map((issue, i) => (
                        <li key={i} className="flex items-start gap-1 text-muted-foreground">
                          <AlertTriangle className="h-3 w-3 text-amber-500 shrink-0 mt-0.5" />
                          {issue}
                        </li>
                      ))}
                    </ul>
                  )}
                  {compliance.issues.length === 0 && (
                    <p className="text-xs text-muted-foreground pl-6 flex items-center gap-1">
                      <CheckCircle className="h-3 w-3 text-green-500" /> Fully compliant
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};

// ── Sub-component ───────────────────────────────────────────────────

const ScoreCard = ({ icon, label, score }: { icon: React.ReactNode; label: string; score: number }) => {
  const color = score >= 80 ? 'text-green-600 dark:text-green-400' :
    score >= 60 ? 'text-amber-600 dark:text-amber-400' :
    'text-red-600 dark:text-red-400';
  const bg = score >= 80 ? 'bg-green-50 dark:bg-green-900/20' :
    score >= 60 ? 'bg-amber-50 dark:bg-amber-900/20' :
    'bg-red-50 dark:bg-red-900/20';

  return (
    <div className={cn('rounded-lg p-3 text-center', bg)}>
      <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
        {icon}
        <span className="text-[10px] font-medium">{label}</span>
      </div>
      <span className={cn('text-xl font-bold', color)}>{score}%</span>
    </div>
  );
};
