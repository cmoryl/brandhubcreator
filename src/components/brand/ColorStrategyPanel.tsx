import { useMemo, useState } from 'react';
import {
  Sparkles, Globe, Eye, AlertTriangle, CheckCircle, ChevronDown, ChevronUp,
  Info, Shield, Palette, Brain, MapPin, Lightbulb,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { BrandColor } from '@/types/brand';
import {
  analyzeColorStrategy,
  type ColorStrategyReport,
  type HarmonyType,
  type CulturalColorMeaning,
  type HKAnalysis,
} from '@/lib/colorStrategy';
import { hexToOklch, formatOklch } from '@/lib/oklchAccessibility';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface ColorStrategyPanelProps {
  colors: BrandColor[];
}

const harmonyLabels: Record<HarmonyType, { label: string; icon: string }> = {
  monochromatic: { label: 'Monochromatic', icon: '◉' },
  analogous: { label: 'Analogous', icon: '◔' },
  complementary: { label: 'Complementary', icon: '◑' },
  'split-complementary': { label: 'Split-Complementary', icon: '◕' },
  triadic: { label: 'Triadic', icon: '△' },
  tetradic: { label: 'Tetradic', icon: '◻' },
  custom: { label: 'Custom', icon: '✦' },
};

const riskBadge = (risk: 'safe' | 'caution' | 'high-risk') => {
  switch (risk) {
    case 'safe': return 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 border-green-300 dark:border-green-700';
    case 'caution': return 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-700';
    case 'high-risk': return 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400 border-red-300 dark:border-red-700';
  }
};

const riskLabel = (risk: 'safe' | 'caution' | 'high-risk') => {
  switch (risk) {
    case 'safe': return 'Safe';
    case 'caution': return 'Caution';
    case 'high-risk': return 'High Risk';
  }
};

const hkSeverityColor = (severity: HKAnalysis['severity']) => {
  switch (severity) {
    case 'none': return 'text-muted-foreground';
    case 'low': return 'text-green-600 dark:text-green-400';
    case 'moderate': return 'text-amber-600 dark:text-amber-400';
    case 'high': return 'text-red-600 dark:text-red-400';
  }
};

export const ColorStrategyPanel = ({ colors }: ColorStrategyPanelProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedCulture, setExpandedCulture] = useState<string | null>(null);

  const report = useMemo(() => {
    if (colors.length === 0) return null;
    return analyzeColorStrategy(colors.map(c => ({ hex: c.hex, name: c.name })));
  }, [colors]);

  if (!report || colors.length === 0) return null;

  const harmonyInfo = harmonyLabels[report.harmony.type];

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <button className="flex items-center gap-3 w-full p-3 rounded-lg border border-border bg-card hover:bg-secondary/30 transition-colors text-left">
          <Brain className="h-5 w-5 text-primary shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground">Color Strategy & Psychology</p>
            <p className="text-xs text-muted-foreground">H-K perception · Tonal harmony · Cultural geometry</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded border', riskBadge(report.overallCulturalRisk))}>
              {riskLabel(report.overallCulturalRisk)}
            </span>
            <span className="text-xs font-medium text-muted-foreground">
              {harmonyInfo.icon} {harmonyInfo.label}
            </span>
            {isOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
          </div>
        </button>
      </CollapsibleTrigger>

      <CollapsibleContent>
        <div className="mt-3 space-y-5 p-4 rounded-lg border border-border bg-card">

          {/* Strategic Summary */}
          <div className="space-y-1.5">
            {report.strategicSummary.map((line, i) => (
              <p key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                <Lightbulb className="h-3 w-3 text-primary shrink-0 mt-0.5" />
                {line}
              </p>
            ))}
          </div>

          {/* ── Tonal Harmony ──────────────────────────────────── */}
          <section>
            <h4 className="text-sm font-medium text-foreground mb-2 flex items-center gap-1.5">
              <Palette className="h-4 w-4 text-primary" /> Tonal Harmony
            </h4>
            <div className="rounded-lg bg-muted/50 p-3 space-y-2">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{harmonyInfo.icon}</span>
                <div>
                  <p className="text-sm font-semibold text-foreground">{harmonyInfo.label}</p>
                  <p className="text-xs text-muted-foreground">{report.harmony.description}</p>
                </div>
                <span className="ml-auto text-xs font-bold text-primary">{report.harmony.confidence}%</span>
              </div>

              {/* Hue wheel visualization */}
              <div className="flex items-center gap-4">
                <div className="relative w-16 h-16 rounded-full shrink-0" style={{
                  background: 'conic-gradient(from 0deg, hsl(0,70%,50%), hsl(60,70%,50%), hsl(120,70%,50%), hsl(180,70%,50%), hsl(240,70%,50%), hsl(300,70%,50%), hsl(360,70%,50%))',
                  opacity: 0.5,
                }}>
                  <div className="absolute inset-2 rounded-full bg-card" />
                  {report.harmony.hueAngles.map((angle, i) => (
                    <div
                      key={i}
                      className="absolute w-2.5 h-2.5 rounded-full border-2 border-card shadow-md"
                      style={{
                        backgroundColor: colors[i]?.hex || '#888',
                        top: `${50 - 42 * Math.cos((angle * Math.PI) / 180)}%`,
                        left: `${50 + 42 * Math.sin((angle * Math.PI) / 180)}%`,
                        transform: 'translate(-50%, -50%)',
                      }}
                    />
                  ))}
                </div>
                <div className="text-xs space-y-1 flex-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tonal balance</span>
                    <span className="font-medium text-foreground capitalize">{report.harmony.tonalBalance}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Chroma range</span>
                    <span className="font-mono text-foreground">{report.harmony.chromaRange.min.toFixed(3)}–{report.harmony.chromaRange.max.toFixed(3)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Lightness range</span>
                    <span className="font-mono text-foreground">{(report.harmony.lightnessRange.min * 100).toFixed(0)}–{(report.harmony.lightnessRange.max * 100).toFixed(0)}%</span>
                  </div>
                </div>
              </div>

              {report.harmony.suggestions.length > 0 && (
                <div className="space-y-1 pt-1.5 border-t border-border">
                  {report.harmony.suggestions.map((s, i) => (
                    <p key={i} className="text-xs text-muted-foreground flex items-start gap-1">
                      <Info className="h-3 w-3 text-blue-500 shrink-0 mt-0.5" />
                      {s}
                    </p>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* ── Helmholtz-Kohlrausch Effect ────────────────── */}
          <section>
            <h4 className="text-sm font-medium text-foreground mb-2 flex items-center gap-1.5">
              <Eye className="h-4 w-4 text-primary" /> Helmholtz-Kohlrausch Perception
            </h4>
            <p className="text-xs text-muted-foreground mb-2">
              Chromatic colors appear brighter than equally luminant grays. This affects real-world contrast perception beyond WCAG calculations.
            </p>
            <div className="space-y-2">
              {report.hkAnalyses.map(({ hex, name, analysis }) => (
                <div key={hex} className="flex items-center gap-3 p-2 rounded bg-muted/50 text-xs">
                  <div className="w-6 h-6 rounded-md border border-border shrink-0" style={{ backgroundColor: hex }} />
                  <span className="font-medium text-foreground truncate flex-1">{name}</span>
                  <div className="flex items-center gap-2 shrink-0">
                    {/* Perceived vs actual lightness bar */}
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center gap-1">
                            <span className="text-muted-foreground">L: {(analysis.originalL * 100).toFixed(0)}%</span>
                            {analysis.severity !== 'none' && (
                              <>
                                <span className="text-muted-foreground">→</span>
                                <span className={cn('font-bold', hkSeverityColor(analysis.severity))}>
                                  {(analysis.perceivedL * 100).toFixed(0)}%
                                </span>
                              </>
                            )}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-xs text-xs">
                          <p className="font-medium mb-1">{analysis.description}</p>
                          <p>H-K factor: ×{analysis.correctionFactor}</p>
                          <p>Perception shift: {analysis.perceptionShift > 0 ? '+' : ''}{analysis.perceptionShift}%</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <span className={cn(
                      'text-[10px] px-1 py-0.5 rounded font-medium',
                      analysis.severity === 'high' ? 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400' :
                      analysis.severity === 'moderate' ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400' :
                      'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400'
                    )}>
                      {analysis.severity === 'none' ? 'Neutral' : analysis.severity.charAt(0).toUpperCase() + analysis.severity.slice(1)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ── Cultural Color Geometry ────────────────────── */}
          <section>
            <h4 className="text-sm font-medium text-foreground mb-2 flex items-center gap-1.5">
              <Globe className="h-4 w-4 text-primary" /> Cultural Color Geometry
            </h4>
            <p className="text-xs text-muted-foreground mb-2">
              Color meanings vary dramatically by region. This analysis maps each color against major global markets.
            </p>
            <div className="space-y-3">
              {report.culturalAnalyses.map((ca) => (
                <div key={ca.hex} className="rounded-lg border border-border overflow-hidden">
                  {/* Color header */}
                  <button
                    className="flex items-center gap-3 w-full p-2.5 hover:bg-secondary/30 transition-colors text-left"
                    onClick={() => setExpandedCulture(expandedCulture === ca.hex ? null : ca.hex)}
                  >
                    <div className="w-6 h-6 rounded-md border border-border shrink-0" style={{ backgroundColor: ca.hex }} />
                    <div className="flex-1 min-w-0">
                      <span className="text-xs font-medium text-foreground">{ca.name}</span>
                      <span className="text-[10px] text-muted-foreground ml-1.5 capitalize">({ca.dominantHueFamily})</span>
                    </div>
                    <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded border', riskBadge(ca.overallRisk))}>
                      {riskLabel(ca.overallRisk)}
                    </span>
                    {expandedCulture === ca.hex ?
                      <ChevronUp className="h-3 w-3 text-muted-foreground" /> :
                      <ChevronDown className="h-3 w-3 text-muted-foreground" />
                    }
                  </button>

                  {expandedCulture === ca.hex && (
                    <div className="px-2.5 pb-2.5 space-y-2">
                      {/* Region cards */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {ca.culturalMeanings.map((cm, i) => (
                          <CulturalRegionCard key={i} meaning={cm} />
                        ))}
                      </div>

                      {/* Recommendations */}
                      {ca.recommendations.length > 0 && (
                        <div className="pt-2 border-t border-border space-y-1">
                          {ca.recommendations.map((rec, i) => (
                            <p key={i} className="text-xs text-muted-foreground flex items-start gap-1">
                              {ca.overallRisk === 'high-risk' ?
                                <AlertTriangle className="h-3 w-3 text-red-500 shrink-0 mt-0.5" /> :
                                <Info className="h-3 w-3 text-amber-500 shrink-0 mt-0.5" />
                              }
                              {rec}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};

// ── Sub-components ──────────────────────────────────────────────────

const CulturalRegionCard = ({ meaning }: { meaning: CulturalColorMeaning }) => (
  <div className={cn(
    'p-2 rounded text-xs space-y-1 border',
    meaning.riskLevel === 'high-risk' ? 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800' :
    meaning.riskLevel === 'caution' ? 'bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800' :
    'bg-muted/50 border-border'
  )}>
    <div className="flex items-center gap-1.5">
      <MapPin className="h-3 w-3 text-muted-foreground shrink-0" />
      <span className="font-medium text-foreground">{meaning.region}</span>
      <span className={cn('ml-auto text-[9px] font-bold px-1 py-0.5 rounded border', riskBadge(meaning.riskLevel))}>
        {riskLabel(meaning.riskLevel)}
      </span>
    </div>
    {meaning.positive.length > 0 && (
      <div className="flex flex-wrap gap-1">
        {meaning.positive.map((p, i) => (
          <span key={i} className="text-[10px] px-1 py-0.5 rounded bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
            {p}
          </span>
        ))}
      </div>
    )}
    {meaning.negative.length > 0 && (
      <div className="flex flex-wrap gap-1">
        {meaning.negative.map((n, i) => (
          <span key={i} className="text-[10px] px-1 py-0.5 rounded bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400">
            {n}
          </span>
        ))}
      </div>
    )}
    <p className="text-[10px] text-muted-foreground">{meaning.context}</p>
  </div>
);
