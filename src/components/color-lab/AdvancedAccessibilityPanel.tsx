import { useMemo } from 'react';
import { Shield, Type, Eye, AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import {
  contrastRatio, wcagLevel, wcagLevelColor, wcagBadgeBg,
  suggestAccessibleColor,
} from '@/lib/oklchAccessibility';
import {
  apcaContrast, apcaLevel, apcaLevelColor, apcaBadgeBg,
  apcaFontRecommendation, analyzeHarmony, colorPsychology,
  type ApcaLevel, type HarmonyResult,
} from '@/lib/apcaContrast';
import { hexToHsl } from '@/lib/colorConversions';

interface LabColor {
  id: string;
  hex: string;
  name: string;
}

interface AdvancedAccessibilityPanelProps {
  colors: LabColor[];
}

export function AdvancedAccessibilityPanel({ colors }: AdvancedAccessibilityPanelProps) {
  // APCA contrast pairs
  const apcaPairs = useMemo(() => {
    const pairs: Array<{
      fg: LabColor; bg: LabColor;
      wcagRatio: number; wcagGrade: string;
      apcaLc: number; apcaGrade: ApcaLevel;
      fontRec: string;
    }> = [];
    for (let i = 0; i < colors.length; i++) {
      for (let j = 0; j < colors.length; j++) {
        if (i === j) continue;
        const wcagR = contrastRatio(colors[i].hex, colors[j].hex);
        const lc = apcaContrast(colors[i].hex, colors[j].hex);
        pairs.push({
          fg: colors[i],
          bg: colors[j],
          wcagRatio: wcagR,
          wcagGrade: wcagLevel(wcagR),
          apcaLc: lc,
          apcaGrade: apcaLevel(lc),
          fontRec: apcaFontRecommendation(lc),
        });
      }
    }
    return pairs.sort((a, b) => Math.abs(b.apcaLc) - Math.abs(a.apcaLc));
  }, [colors]);

  // Harmony analysis
  const harmony: HarmonyResult = useMemo(() => {
    const hues = colors.map(c => hexToHsl(c.hex).h);
    return analyzeHarmony(hues);
  }, [colors]);

  // Psychology per color
  const psychologyMap = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const c of colors) {
      const hsl = hexToHsl(c.hex);
      map.set(c.id, colorPsychology(hsl.h, hsl.s, hsl.l));
    }
    return map;
  }, [colors]);

  // WCAG 2.2 score summary
  const wcag22Score = useMemo(() => {
    if (apcaPairs.length === 0) return { score: 0, grade: 'N/A' };
    const passing = apcaPairs.filter(p => p.wcagGrade !== 'Fail').length;
    const score = Math.round((passing / apcaPairs.length) * 100);
    return {
      score,
      grade: score >= 90 ? 'Excellent' : score >= 70 ? 'Good' : score >= 50 ? 'Fair' : 'Poor',
    };
  }, [apcaPairs]);

  const apcaScore = useMemo(() => {
    if (apcaPairs.length === 0) return { score: 0, grade: 'N/A' };
    const passing = apcaPairs.filter(p => p.apcaGrade !== 'Fail').length;
    const score = Math.round((passing / apcaPairs.length) * 100);
    return {
      score,
      grade: score >= 90 ? 'Excellent' : score >= 70 ? 'Good' : score >= 50 ? 'Fair' : 'Poor',
    };
  }, [apcaPairs]);

  if (colors.length < 2) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Shield className="h-10 w-10 mx-auto mb-3 opacity-30" />
        <p className="text-sm">Add at least 2 colors for accessibility analysis</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Score Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">WCAG 2.2</p>
            <p className={cn("text-3xl font-bold", wcag22Score.score >= 70 ? 'text-primary' : 'text-destructive')}>
              {wcag22Score.score}%
            </p>
            <Badge variant="outline" className="text-[10px] mt-1">{wcag22Score.grade}</Badge>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">APCA</p>
            <p className={cn("text-3xl font-bold", apcaScore.score >= 70 ? 'text-primary' : 'text-destructive')}>
              {apcaScore.score}%
            </p>
            <Badge variant="outline" className="text-[10px] mt-1">{apcaScore.grade}</Badge>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Harmony</p>
            <p className="text-lg font-bold">{harmony.label}</p>
            <p className="text-[10px] text-muted-foreground mt-1">{harmony.description}</p>
          </CardContent>
        </Card>
      </div>

      {/* Color Psychology */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Eye className="h-4 w-4" />
          Color Psychology
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          {colors.map(c => {
            const traits = psychologyMap.get(c.id) || [];
            return (
              <div key={c.id} className="flex items-center gap-2 p-2 rounded-lg border">
                <div className="w-6 h-6 rounded border shrink-0" style={{ backgroundColor: c.hex }} />
                <div className="min-w-0">
                  <p className="text-xs font-medium truncate">{c.name}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{traits.join(' · ')}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <Separator />

      {/* APCA Contrast Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Type className="h-4 w-4" />
            APCA Contrast Grid
          </h3>
          <Tooltip>
            <TooltipTrigger>
              <Info className="h-4 w-4 text-muted-foreground" />
            </TooltipTrigger>
            <TooltipContent className="max-w-xs text-xs">
              APCA (Accessible Perceptual Contrast Algorithm) is the next-generation contrast method.
              Lc ≥75 = body text, Lc ≥60 = large text, Lc ≥30 = non-text only.
            </TooltipContent>
          </Tooltip>
        </div>

        <div className="space-y-2">
          {apcaPairs.slice(0, 20).map((pair, i) => (
            <div key={i} className="rounded-lg border p-3 space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <div className="w-5 h-5 rounded border" style={{ backgroundColor: pair.fg.hex }} />
                <span className="text-[10px] text-muted-foreground">on</span>
                <div className="w-5 h-5 rounded border" style={{ backgroundColor: pair.bg.hex }} />
                <span className="text-xs truncate flex-1">{pair.fg.name} / {pair.bg.name}</span>
                <Badge variant="outline" className={cn("text-[10px] border", wcagBadgeBg(pair.wcagGrade as any))}>
                  <span className={wcagLevelColor(pair.wcagGrade as any)}>WCAG {pair.wcagGrade}</span>
                </Badge>
                <Badge variant="outline" className={cn("text-[10px] border", apcaBadgeBg(pair.apcaGrade))}>
                  <span className={apcaLevelColor(pair.apcaGrade)}>Lc {pair.apcaLc}</span>
                </Badge>
              </div>
              {/* Live preview */}
              <div className="rounded-md p-2" style={{ backgroundColor: pair.bg.hex, color: pair.fg.hex }}>
                <p className="text-sm font-medium">The quick brown fox jumps</p>
                <p className="text-xs opacity-80">WCAG {pair.wcagRatio.toFixed(2)}:1 · APCA Lc {pair.apcaLc}</p>
              </div>
              <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                <Type className="h-3 w-3" />
                {pair.fontRec}
              </p>
              {pair.apcaGrade === 'Fail' && pair.wcagGrade === 'Fail' && (
                <p className="text-[10px] text-destructive flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  Insufficient contrast for any text or UI element
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
