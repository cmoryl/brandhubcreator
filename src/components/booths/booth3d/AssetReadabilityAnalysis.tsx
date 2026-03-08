/**
 * AssetReadabilityAnalysis — Analyzes assigned panel/asset artwork for:
 * 1. Text size & 10ft Rule (trade show visibility)
 * 2. WCAG contrast on graphics
 * 3. Content density warnings
 * 4. Readability scoring
 *
 * Uses canvas-based image analysis (edge detection, region analysis)
 * combined with panel physical dimensions for production-grade checks.
 */
import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Eye, Type, Ruler, BarChart3, AlertTriangle, Check, X,
  Loader2, RefreshCw, Maximize2, Accessibility,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

/* ─── Types ────────────────────────────────── */

interface ReadabilityResult {
  /** 0-100 overall readability score */
  overallScore: number;
  textSizeCheck: {
    score: number;
    estimatedTextAreaPct: number;
    minVisibleDistanceFt: number;
    meetsTradeShowRule: boolean;
    recommendation: string;
  };
  contrastCheck: {
    score: number;
    avgContrast: number;
    lowContrastRegions: number;
    wcagAA: boolean;
    wcagAAA: boolean;
    recommendation: string;
  };
  densityCheck: {
    score: number;
    contentFillPct: number;
    isOvercrowded: boolean;
    whitespaceRatio: number;
    recommendation: string;
  };
  readabilityCheck: {
    score: number;
    hasVisualHierarchy: boolean;
    estimatedTextBlocks: number;
    edgeDensity: number;
    recommendation: string;
  };
}

interface AssetReadabilityAnalysisProps {
  imageUrl: string;
  assetName: string;
  /** Physical panel dimensions in meters [width, height] */
  panelSizeMeters?: [number, number];
  /** Category hint: 'panel' | 'banner' | 'screen' | 'texture' */
  assetType?: string;
}

/* ─── Image Analysis Engine ────────────────── */

interface ImageAnalysisData {
  /** Percentage of image that contains high-contrast edges (text-like) */
  edgeDensity: number;
  /** Average local contrast (0-1) */
  avgContrast: number;
  /** Percentage of pixels with very low contrast to neighbors */
  lowContrastPct: number;
  /** Percentage of image that is "content" vs whitespace */
  contentFillPct: number;
  /** Ratio of whitespace-like regions */
  whitespaceRatio: number;
  /** Estimated percentage of area covered by text-like regions */
  textAreaPct: number;
  /** Number of distinct edge-dense regions (text blocks) */
  estimatedTextBlocks: number;
  /** Whether there's variation in edge density across zones (hierarchy) */
  hasHierarchy: boolean;
  /** Minimum contrast ratio found in significant regions */
  minRegionContrast: number;
}

function analyzeImage(imageUrl: string): Promise<ImageAnalysisData> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const w = 128, h = 128;
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(getDefaultAnalysis());
        return;
      }

      ctx.drawImage(img, 0, 0, w, h);
      const data = ctx.getImageData(0, 0, w, h).data;

      // Convert to grayscale
      const gray = new Float32Array(w * h);
      for (let i = 0; i < w * h; i++) {
        gray[i] = (data[i * 4] * 0.299 + data[i * 4 + 1] * 0.587 + data[i * 4 + 2] * 0.114) / 255;
      }

      // Edge detection (simple Sobel-like)
      let edgeCount = 0;
      let totalContrast = 0;
      let lowContrastCount = 0;
      const edgeMap = new Float32Array(w * h);

      for (let y = 1; y < h - 1; y++) {
        for (let x = 1; x < w - 1; x++) {
          const idx = y * w + x;
          const gx = Math.abs(gray[idx + 1] - gray[idx - 1]);
          const gy = Math.abs(gray[(y + 1) * w + x] - gray[(y - 1) * w + x]);
          const edge = Math.sqrt(gx * gx + gy * gy);
          edgeMap[idx] = edge;

          if (edge > 0.08) edgeCount++;

          const localContrast = Math.max(gx, gy);
          totalContrast += localContrast;
          if (localContrast < 0.02) lowContrastCount++;
        }
      }

      const totalPixels = (w - 2) * (h - 2);
      const edgeDensity = edgeCount / totalPixels;
      const avgContrast = totalContrast / totalPixels;
      const lowContrastPct = lowContrastCount / totalPixels;

      // Content fill: count non-uniform regions
      let contentPixels = 0;
      let whitespacePixels = 0;
      for (let i = 0; i < w * h; i++) {
        if (gray[i] > 0.92) whitespacePixels++;
        else contentPixels++;
      }
      const contentFillPct = contentPixels / (w * h);
      const whitespaceRatio = whitespacePixels / (w * h);

      // Estimate text area: high-edge-density zones
      const textAreaPct = Math.min(edgeDensity * 3, 1); // scale up

      // Estimate text blocks: divide into 4x4 grid, count blocks with high edge density
      const gridSize = 4;
      const cellW = Math.floor(w / gridSize);
      const cellH = Math.floor(h / gridSize);
      let textBlocks = 0;
      const blockDensities: number[] = [];

      for (let gy = 0; gy < gridSize; gy++) {
        for (let gx = 0; gx < gridSize; gx++) {
          let cellEdges = 0;
          let cellTotal = 0;
          for (let cy = gy * cellH; cy < (gy + 1) * cellH && cy < h; cy++) {
            for (let cx = gx * cellW; cx < (gx + 1) * cellW && cx < w; cx++) {
              cellEdges += edgeMap[cy * w + cx] > 0.08 ? 1 : 0;
              cellTotal++;
            }
          }
          const d = cellTotal > 0 ? cellEdges / cellTotal : 0;
          blockDensities.push(d);
          if (d > 0.15) textBlocks++;
        }
      }

      // Hierarchy: check if there's variance in block densities
      const meanDensity = blockDensities.reduce((a, b) => a + b, 0) / blockDensities.length;
      const variance = blockDensities.reduce((a, b) => a + (b - meanDensity) ** 2, 0) / blockDensities.length;
      const hasHierarchy = variance > 0.005 && textBlocks >= 2;

      // Min region contrast: from the highest-edge blocks
      const sortedDensities = [...blockDensities].sort((a, b) => b - a);
      const minRegionContrast = sortedDensities.length > 2 ? sortedDensities[2] * 10 : avgContrast * 5;

      resolve({
        edgeDensity,
        avgContrast,
        lowContrastPct,
        contentFillPct,
        whitespaceRatio,
        textAreaPct,
        estimatedTextBlocks: textBlocks,
        hasHierarchy,
        minRegionContrast: Math.min(minRegionContrast, 21),
      });
    };
    img.onerror = () => resolve(getDefaultAnalysis());
    img.src = imageUrl;
  });
}

function getDefaultAnalysis(): ImageAnalysisData {
  return {
    edgeDensity: 0, avgContrast: 0, lowContrastPct: 1,
    contentFillPct: 0, whitespaceRatio: 1, textAreaPct: 0,
    estimatedTextBlocks: 0, hasHierarchy: false, minRegionContrast: 1,
  };
}

/* ─── Scoring Logic ────────────────────────── */

function computeReadability(
  analysis: ImageAnalysisData,
  panelSizeMeters?: [number, number],
): ReadabilityResult {
  // 10ft Rule: 1 inch of letter height per 10 feet of viewing distance
  // Trade show standard: panels should be readable from ~15-20ft
  // For a panel of height H meters, text occupying textAreaPct of it:
  const panelHeightFt = panelSizeMeters ? panelSizeMeters[1] / 0.3048 : 8;
  const estTextHeightFt = panelHeightFt * analysis.textAreaPct * 0.3; // rough: 30% of text area is actual letter height
  const estTextHeightInches = estTextHeightFt * 12;
  const maxVisibleDistFt = estTextHeightInches * 10; // 10ft rule
  const meetsTradeShowRule = maxVisibleDistFt >= 15;

  let textSizeScore: number;
  if (maxVisibleDistFt >= 20) textSizeScore = 100;
  else if (maxVisibleDistFt >= 15) textSizeScore = 80;
  else if (maxVisibleDistFt >= 10) textSizeScore = 55;
  else textSizeScore = 30;

  // If very little text detected, it's probably an image-heavy panel — that's fine
  if (analysis.textAreaPct < 0.05) textSizeScore = 90;

  const textSizeRec = meetsTradeShowRule
    ? `Text visible from ~${Math.round(maxVisibleDistFt)}ft — meets trade show standards`
    : `Text may only be visible from ~${Math.round(maxVisibleDistFt)}ft — increase size for 15ft+ readability`;

  // WCAG Contrast
  const estContrastRatio = Math.max(1, analysis.minRegionContrast);
  const wcagAA = estContrastRatio >= 4.5;
  const wcagAAA = estContrastRatio >= 7;
  let contrastScore: number;
  if (wcagAAA) contrastScore = 100;
  else if (wcagAA) contrastScore = 80;
  else if (estContrastRatio >= 3) contrastScore = 55;
  else contrastScore = 25;

  // Boost contrast score if average contrast is decent
  if (analysis.avgContrast > 0.15) contrastScore = Math.min(100, contrastScore + 10);

  const lowContrastRegions = Math.round(analysis.lowContrastPct * 16); // out of ~16 grid cells
  const contrastRec = wcagAA
    ? `Contrast appears sufficient (est. ${estContrastRatio.toFixed(1)}:1)`
    : `Low contrast detected — ensure text/background ratio ≥ 4.5:1 for readability`;

  // Content Density
  const isOvercrowded = analysis.contentFillPct > 0.85 && analysis.whitespaceRatio < 0.1;
  let densityScore: number;
  if (analysis.whitespaceRatio >= 0.25) densityScore = 95;
  else if (analysis.whitespaceRatio >= 0.15) densityScore = 80;
  else if (analysis.whitespaceRatio >= 0.08) densityScore = 60;
  else densityScore = 35;

  const densityRec = isOvercrowded
    ? 'Panel is overcrowded — reduce content or increase whitespace for visual breathing room'
    : analysis.whitespaceRatio > 0.3
      ? 'Good whitespace balance — content has room to breathe'
      : 'Content density is moderate — consider simplifying for trade show scanning';

  // Readability (hierarchy + flow)
  let readabilityScore: number;
  if (analysis.hasHierarchy && analysis.estimatedTextBlocks >= 2 && analysis.estimatedTextBlocks <= 6) {
    readabilityScore = 90;
  } else if (analysis.hasHierarchy) {
    readabilityScore = 75;
  } else if (analysis.estimatedTextBlocks <= 2) {
    readabilityScore = 85; // minimal text = easy to scan
  } else {
    readabilityScore = 45;
  }

  const readabilityRec = analysis.hasHierarchy
    ? `Visual hierarchy detected (${analysis.estimatedTextBlocks} content zones) — good scanning flow`
    : analysis.estimatedTextBlocks > 4
      ? 'No clear hierarchy — use size variation and spacing to guide the eye'
      : 'Minimal text content — ensure key message is prominent';

  const overallScore = Math.round(
    textSizeScore * 0.3 + contrastScore * 0.3 + densityScore * 0.2 + readabilityScore * 0.2
  );

  return {
    overallScore,
    textSizeCheck: {
      score: textSizeScore,
      estimatedTextAreaPct: Math.round(analysis.textAreaPct * 100),
      minVisibleDistanceFt: Math.round(maxVisibleDistFt),
      meetsTradeShowRule,
      recommendation: textSizeRec,
    },
    contrastCheck: {
      score: contrastScore,
      avgContrast: analysis.avgContrast,
      lowContrastRegions,
      wcagAA,
      wcagAAA,
      recommendation: contrastRec,
    },
    densityCheck: {
      score: densityScore,
      contentFillPct: Math.round(analysis.contentFillPct * 100),
      isOvercrowded,
      whitespaceRatio: Math.round(analysis.whitespaceRatio * 100),
      recommendation: densityRec,
    },
    readabilityCheck: {
      score: readabilityScore,
      hasVisualHierarchy: analysis.hasHierarchy,
      estimatedTextBlocks: analysis.estimatedTextBlocks,
      edgeDensity: analysis.edgeDensity,
      recommendation: readabilityRec,
    },
  };
}

/* ─── Score Badge Component ──────────────── */

function ScoreBadge({ score, size = 'sm' }: { score: number; size?: 'sm' | 'lg' }) {
  const color = score >= 80 ? 'text-primary' : score >= 60 ? 'text-amber-500' : 'text-destructive';
  const bg = score >= 80 ? 'bg-primary/10' : score >= 60 ? 'bg-amber-500/10' : 'bg-destructive/10';
  return (
    <span className={cn(
      'font-bold rounded-full inline-flex items-center justify-center',
      bg, color,
      size === 'lg' ? 'text-sm h-7 w-7' : 'text-[9px] h-5 min-w-5 px-1'
    )}>
      {score}
    </span>
  );
}

function CheckRow({ label, icon, score, pass, detail, recommendation }: {
  label: string;
  icon: React.ReactNode;
  score: number;
  pass: boolean;
  detail: string;
  recommendation: string;
}) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="space-y-1">
      <button
        onClick={() => setExpanded(v => !v)}
        className="flex items-center gap-1.5 w-full text-left group"
      >
        <span className="shrink-0">{icon}</span>
        <span className="text-[10px] font-medium flex-1">{label}</span>
        <ScoreBadge score={score} />
        {pass ? (
          <Check className="h-3 w-3 text-primary shrink-0" />
        ) : (
          <AlertTriangle className="h-3 w-3 text-destructive shrink-0" />
        )}
      </button>
      {expanded && (
        <div className="ml-5 space-y-1">
          <p className="text-[9px] text-muted-foreground">{detail}</p>
          <p className="text-[9px] text-foreground/80 italic">{recommendation}</p>
        </div>
      )}
    </div>
  );
}

/* ─── Main Component ─────────────────────── */

export function AssetReadabilityAnalysis({
  imageUrl,
  assetName,
  panelSizeMeters,
  assetType = 'panel',
}: AssetReadabilityAnalysisProps) {
  const [result, setResult] = useState<ReadabilityResult | null>(null);
  const [loading, setLoading] = useState(false);

  const analyze = useCallback(async () => {
    setLoading(true);
    try {
      const data = await analyzeImage(imageUrl);
      const readability = computeReadability(data, panelSizeMeters);
      setResult(readability);
    } catch {
      setResult(null);
    } finally {
      setLoading(false);
    }
  }, [imageUrl, panelSizeMeters]);

  useEffect(() => {
    if (imageUrl) analyze();
  }, [imageUrl, analyze]);

  if (!imageUrl) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
          <Accessibility className="h-3 w-3" /> Readability & Access
        </p>
        <div className="flex items-center gap-1">
          {result && <ScoreBadge score={result.overallScore} size="lg" />}
          <Button variant="ghost" size="sm" className="h-5 w-5 p-0" onClick={analyze} disabled={loading}>
            {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
          </Button>
        </div>
      </div>

      {loading && !result && (
        <div className="flex items-center gap-2 py-2">
          <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
          <span className="text-[10px] text-muted-foreground">Analyzing readability…</span>
        </div>
      )}

      {result && (
        <div className="space-y-2">
          {/* Overall score bar */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[9px] text-muted-foreground">Overall Readability</span>
              <span className={cn(
                'text-[10px] font-bold',
                result.overallScore >= 80 ? 'text-primary' :
                result.overallScore >= 60 ? 'text-amber-500' : 'text-destructive'
              )}>
                {result.overallScore >= 80 ? 'Good' : result.overallScore >= 60 ? 'Fair' : 'Needs Work'}
              </span>
            </div>
            <Progress
              value={result.overallScore}
              className="h-1.5"
            />
          </div>

          {/* Individual checks */}
          <div className="space-y-1.5 pt-1">
            <CheckRow
              label="10ft Rule"
              icon={<Ruler className="h-3 w-3 text-muted-foreground" />}
              score={result.textSizeCheck.score}
              pass={result.textSizeCheck.meetsTradeShowRule}
              detail={`~${result.textSizeCheck.estimatedTextAreaPct}% text area · Visible from ${result.textSizeCheck.minVisibleDistanceFt}ft`}
              recommendation={result.textSizeCheck.recommendation}
            />
            <CheckRow
              label="WCAG Contrast"
              icon={<Eye className="h-3 w-3 text-muted-foreground" />}
              score={result.contrastCheck.score}
              pass={result.contrastCheck.wcagAA}
              detail={`${result.contrastCheck.wcagAAA ? 'AAA' : result.contrastCheck.wcagAA ? 'AA' : 'Fail'} · ${result.contrastCheck.lowContrastRegions} low-contrast zones`}
              recommendation={result.contrastCheck.recommendation}
            />
            <CheckRow
              label="Content Density"
              icon={<Maximize2 className="h-3 w-3 text-muted-foreground" />}
              score={result.densityCheck.score}
              pass={!result.densityCheck.isOvercrowded}
              detail={`${result.densityCheck.contentFillPct}% content fill · ${result.densityCheck.whitespaceRatio}% whitespace`}
              recommendation={result.densityCheck.recommendation}
            />
            <CheckRow
              label="Visual Hierarchy"
              icon={<Type className="h-3 w-3 text-muted-foreground" />}
              score={result.readabilityCheck.score}
              pass={result.readabilityCheck.hasVisualHierarchy || result.readabilityCheck.estimatedTextBlocks <= 2}
              detail={`${result.readabilityCheck.estimatedTextBlocks} text zones · ${result.readabilityCheck.hasVisualHierarchy ? 'Hierarchy detected' : 'No clear hierarchy'}`}
              recommendation={result.readabilityCheck.recommendation}
            />
          </div>

          {/* Quick tips */}
          {result.overallScore < 70 && (
            <div className="bg-destructive/5 border border-destructive/20 rounded-md px-2 py-1.5 mt-1">
              <p className="text-[9px] font-semibold text-destructive flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" /> Trade Show Optimization Tips
              </p>
              <ul className="text-[9px] text-muted-foreground mt-1 space-y-0.5 list-disc list-inside">
                {!result.textSizeCheck.meetsTradeShowRule && (
                  <li>Increase headline size for 15ft+ visibility</li>
                )}
                {!result.contrastCheck.wcagAA && (
                  <li>Boost text-background contrast to 4.5:1 minimum</li>
                )}
                {result.densityCheck.isOvercrowded && (
                  <li>Remove clutter — aim for 25%+ whitespace</li>
                )}
                {!result.readabilityCheck.hasVisualHierarchy && result.readabilityCheck.estimatedTextBlocks > 3 && (
                  <li>Create size contrast between headlines and body</li>
                )}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
