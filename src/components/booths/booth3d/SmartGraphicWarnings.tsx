/**
 * SmartGraphicWarnings — Proactive trade show graphic warnings
 * Catches common mistakes: low resolution, unreadable text, small logos,
 * missing graphics, and low contrast before production.
 */
import { useState, useEffect, useCallback } from 'react';
import {
  AlertTriangle, ImageOff, Eye, Ruler, Maximize2, ZoomIn,
  ChevronDown, ChevronUp, Shield, Loader2,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { PanelConfig } from './boothConfigs';

/* ─── Types ────────────────────────────────── */

export interface GraphicWarning {
  id: string;
  panelId: string;
  panelLabel: string;
  severity: 'error' | 'warning' | 'info';
  category: 'resolution' | 'readability' | 'logo' | 'contrast' | 'missing' | 'density';
  title: string;
  detail: string;
  fix: string;
}

interface SmartGraphicWarningsProps {
  panels: PanelConfig[];
  assignments: Record<string, string>;
  /** Show warnings for a specific panel only, or all if null */
  focusPanelId?: string | null;
  /** Compact mode for inspector sidebar */
  compact?: boolean;
}

/* ─── Analysis Helpers ─────────────────────── */

interface ImageMetrics {
  width: number;
  height: number;
  edgeDensity: number;
  avgContrast: number;
  lowContrastPct: number;
  contentFillPct: number;
  whitespaceRatio: number;
  hasSmallElements: boolean;
  smallElementPct: number;
}

function analyzeImageForWarnings(imageUrl: string): Promise<ImageMetrics> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const naturalW = img.naturalWidth;
      const naturalH = img.naturalHeight;

      const canvas = document.createElement('canvas');
      const w = 128, h = 128;
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(defaultMetrics(naturalW, naturalH));
        return;
      }

      ctx.drawImage(img, 0, 0, w, h);
      const data = ctx.getImageData(0, 0, w, h).data;

      // Grayscale
      const gray = new Float32Array(w * h);
      for (let i = 0; i < w * h; i++) {
        gray[i] = (data[i * 4] * 0.299 + data[i * 4 + 1] * 0.587 + data[i * 4 + 2] * 0.114) / 255;
      }

      // Edge detection + contrast
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
          const lc = Math.max(gx, gy);
          totalContrast += lc;
          if (lc < 0.02) lowContrastCount++;
        }
      }

      const totalPixels = (w - 2) * (h - 2);
      const edgeDensity = edgeCount / totalPixels;
      const avgContrast = totalContrast / totalPixels;
      const lowContrastPct = lowContrastCount / totalPixels;

      // Content fill
      let contentPixels = 0;
      let whitespacePixels = 0;
      for (let i = 0; i < w * h; i++) {
        if (gray[i] > 0.92) whitespacePixels++;
        else contentPixels++;
      }

      // Small element detection: look for small isolated edge clusters
      // Grid-based: 8x8 grid, count cells with edges but very small area
      const gridSize = 8;
      const cellW = Math.floor(w / gridSize);
      const cellH = Math.floor(h / gridSize);
      let smallCells = 0;
      let totalEdgeCells = 0;

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
          const density = cellTotal > 0 ? cellEdges / cellTotal : 0;
          if (density > 0.1) {
            totalEdgeCells++;
            // Small element: high edge density in a tiny area
            if (density > 0.3 && density < 0.7) smallCells++;
          }
        }
      }

      resolve({
        width: naturalW,
        height: naturalH,
        edgeDensity,
        avgContrast,
        lowContrastPct,
        contentFillPct: contentPixels / (w * h),
        whitespaceRatio: whitespacePixels / (w * h),
        hasSmallElements: smallCells >= 2,
        smallElementPct: totalEdgeCells > 0 ? smallCells / totalEdgeCells : 0,
      });
    };
    img.onerror = () => resolve(defaultMetrics(0, 0));
    img.src = imageUrl;
  });
}

function defaultMetrics(w: number, h: number): ImageMetrics {
  return {
    width: w, height: h, edgeDensity: 0, avgContrast: 0, lowContrastPct: 1,
    contentFillPct: 0, whitespaceRatio: 1, hasSmallElements: false, smallElementPct: 0,
  };
}

/* ─── Warning Generation ──────────────────── */

function generateWarnings(
  panel: PanelConfig,
  imageUrl: string | undefined,
  metrics: ImageMetrics | null,
): GraphicWarning[] {
  const warnings: GraphicWarning[] = [];
  const base = { panelId: panel.id, panelLabel: panel.label };

  // 1. Missing graphic
  if (!imageUrl) {
    warnings.push({
      ...base,
      id: `${panel.id}-missing`,
      severity: 'error',
      category: 'missing',
      title: 'No graphic assigned',
      detail: `${panel.label} has no artwork — it will render blank at the show.`,
      fix: 'Assign a graphic from the Asset Library or upload a production file.',
    });
    return warnings; // no further checks possible
  }

  if (!metrics) return warnings;

  // 2. Resolution check — DPI at print scale
  const panelWidthInches = (panel.size[0] / 0.3048) * 12;
  const panelHeightInches = (panel.size[1] / 0.3048) * 12;
  const dpiW = metrics.width / panelWidthInches;
  const dpiH = metrics.height / panelHeightInches;
  const effectiveDpi = Math.min(dpiW, dpiH);

  if (effectiveDpi < 72) {
    warnings.push({
      ...base,
      id: `${panel.id}-resolution`,
      severity: 'error',
      category: 'resolution',
      title: 'Graphic resolution too low',
      detail: `Image is ${metrics.width}×${metrics.height}px — only ~${Math.round(effectiveDpi)} DPI at print size (${panelWidthInches.toFixed(0)}″×${panelHeightInches.toFixed(0)}″). Minimum 100 DPI recommended.`,
      fix: `Upload at least ${Math.ceil(panelWidthInches * 100)}×${Math.ceil(panelHeightInches * 100)}px for acceptable quality.`,
    });
  } else if (effectiveDpi < 100) {
    warnings.push({
      ...base,
      id: `${panel.id}-resolution`,
      severity: 'warning',
      category: 'resolution',
      title: 'Resolution below recommended',
      detail: `~${Math.round(effectiveDpi)} DPI — acceptable for large-format but may appear soft up close. 150+ DPI ideal.`,
      fix: `Upgrade to ${Math.ceil(panelWidthInches * 150)}×${Math.ceil(panelHeightInches * 150)}px for crisp output.`,
    });
  }

  // 3. Readability / 10ft rule
  const panelHeightFt = panel.size[1] / 0.3048;
  const estTextAreaPct = Math.min(metrics.edgeDensity * 3, 1);
  const estTextHeightInches = panelHeightFt * estTextAreaPct * 0.3 * 12;
  const maxVisibleDistFt = estTextHeightInches * 10;

  if (estTextAreaPct > 0.05 && maxVisibleDistFt < 12) {
    warnings.push({
      ...base,
      id: `${panel.id}-readability`,
      severity: maxVisibleDistFt < 8 ? 'error' : 'warning',
      category: 'readability',
      title: 'Text unreadable from aisle',
      detail: `Text is only visible from ~${Math.round(maxVisibleDistFt)}ft. Standard aisle viewing is 12-20ft.`,
      fix: 'Increase headline font size or reduce the amount of body text. Apply the 10ft Rule: 1 inch of letter height per 10 feet.',
    });
  }

  // 4. Logo / small element check
  if (metrics.hasSmallElements && metrics.smallElementPct > 0.3) {
    warnings.push({
      ...base,
      id: `${panel.id}-logo`,
      severity: 'warning',
      category: 'logo',
      title: 'Logo or elements may be too small',
      detail: 'Detected small detailed elements that may be invisible from typical viewing distances.',
      fix: 'Ensure logos occupy at least 10% of panel width. Fine details like taglines or URLs should be reserved for close-range panels.',
    });
  }

  // 5. Contrast
  if (metrics.avgContrast < 0.06) {
    warnings.push({
      ...base,
      id: `${panel.id}-contrast`,
      severity: 'warning',
      category: 'contrast',
      title: 'Low contrast detected',
      detail: `Average contrast is very low — text may wash out under trade show lighting.`,
      fix: 'Increase text/background contrast. Use dark text on light backgrounds or vice versa. Avoid mid-tone on mid-tone.',
    });
  }

  // 6. Overcrowded
  if (metrics.contentFillPct > 0.85 && metrics.whitespaceRatio < 0.1) {
    warnings.push({
      ...base,
      id: `${panel.id}-density`,
      severity: 'warning',
      category: 'density',
      title: 'Panel is overcrowded',
      detail: `${Math.round(metrics.contentFillPct * 100)}% content fill with only ${Math.round(metrics.whitespaceRatio * 100)}% whitespace.`,
      fix: 'Remove secondary content. Trade show panels should be scannable in 3-5 seconds — aim for 25%+ whitespace.',
    });
  }

  return warnings;
}

/* ─── Severity Styling ────────────────────── */

const severityConfig = {
  error: {
    icon: AlertTriangle,
    bg: 'bg-destructive/10',
    border: 'border-destructive/30',
    text: 'text-destructive',
    badge: 'bg-destructive/15 text-destructive',
    label: 'Critical',
  },
  warning: {
    icon: AlertTriangle,
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    text: 'text-amber-600 dark:text-amber-400',
    badge: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
    label: 'Warning',
  },
  info: {
    icon: Eye,
    bg: 'bg-primary/5',
    border: 'border-primary/20',
    text: 'text-primary',
    badge: 'bg-primary/10 text-primary',
    label: 'Info',
  },
} as const;

const categoryIcons: Record<GraphicWarning['category'], typeof AlertTriangle> = {
  resolution: ZoomIn,
  readability: Eye,
  logo: Maximize2,
  contrast: Ruler,
  missing: ImageOff,
  density: Maximize2,
};

/* ─── Warning Card ────────────────────────── */

function WarningCard({ warning, compact }: { warning: GraphicWarning; compact?: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const config = severityConfig[warning.severity];
  const CategoryIcon = categoryIcons[warning.category];

  if (compact) {
    return (
      <button
        onClick={() => setExpanded(v => !v)}
        className={cn(
          'w-full text-left rounded-md border px-2 py-1.5 transition-colors',
          config.bg, config.border,
          'hover:brightness-95'
        )}
      >
        <div className="flex items-start gap-1.5">
          <CategoryIcon className={cn('h-3 w-3 mt-0.5 shrink-0', config.text)} />
          <div className="flex-1 min-w-0">
            <p className={cn('text-[10px] font-semibold leading-tight', config.text)}>
              {warning.title}
            </p>
            {expanded && (
              <div className="mt-1 space-y-1">
                <p className="text-[9px] text-muted-foreground leading-snug">{warning.detail}</p>
                <p className="text-[9px] text-foreground/80 italic leading-snug">💡 {warning.fix}</p>
              </div>
            )}
          </div>
          {expanded ? (
            <ChevronUp className="h-3 w-3 shrink-0 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-3 w-3 shrink-0 text-muted-foreground" />
          )}
        </div>
      </button>
    );
  }

  return (
    <div className={cn(
      'rounded-lg border px-3 py-2 transition-colors',
      config.bg, config.border,
    )}>
      <div className="flex items-start gap-2">
        <CategoryIcon className={cn('h-4 w-4 mt-0.5 shrink-0', config.text)} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className={cn('text-xs font-semibold', config.text)}>{warning.title}</p>
            <Badge className={cn('text-[8px] h-4 px-1.5', config.badge)}>
              {warning.panelLabel}
            </Badge>
          </div>
          <p className="text-[10px] text-muted-foreground mt-0.5 leading-snug">{warning.detail}</p>
          <p className="text-[10px] text-foreground/80 mt-1 italic leading-snug">💡 {warning.fix}</p>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Component ──────────────────────── */

export function SmartGraphicWarnings({
  panels,
  assignments,
  focusPanelId,
  compact = false,
}: SmartGraphicWarningsProps) {
  const [warnings, setWarnings] = useState<GraphicWarning[]>([]);
  const [loading, setLoading] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const runAnalysis = useCallback(async () => {
    setLoading(true);
    const targetPanels = focusPanelId
      ? panels.filter(p => p.id === focusPanelId)
      : panels;

    const allWarnings: GraphicWarning[] = [];

    await Promise.all(
      targetPanels.map(async (panel) => {
        const imageUrl = assignments[panel.id];
        let metrics: ImageMetrics | null = null;

        if (imageUrl) {
          try {
            metrics = await analyzeImageForWarnings(imageUrl);
          } catch {
            metrics = null;
          }
        }

        const panelWarnings = generateWarnings(panel, imageUrl, metrics);
        allWarnings.push(...panelWarnings);
      })
    );

    // Sort: errors first, then warnings, then info
    allWarnings.sort((a, b) => {
      const order = { error: 0, warning: 1, info: 2 };
      return order[a.severity] - order[b.severity];
    });

    setWarnings(allWarnings);
    setLoading(false);
  }, [panels, assignments, focusPanelId]);

  useEffect(() => {
    runAnalysis();
  }, [runAnalysis]);

  const errorCount = warnings.filter(w => w.severity === 'error').length;
  const warningCount = warnings.filter(w => w.severity === 'warning').length;

  // Nothing to show
  if (!loading && warnings.length === 0) {
    if (compact) return null;
    return (
      <div className="flex items-center gap-2 px-2 py-2 rounded-md bg-primary/5 border border-primary/20">
        <Shield className="h-4 w-4 text-primary" />
        <p className="text-[10px] text-primary font-medium">All graphics pass trade show checks</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Header */}
      <button
        onClick={() => setCollapsed(v => !v)}
        className="flex items-center justify-between w-full"
      >
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
          <AlertTriangle className="h-3 w-3" /> Smart Warnings
        </p>
        <div className="flex items-center gap-1.5">
          {loading && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
          {errorCount > 0 && (
            <Badge className="text-[8px] h-4 px-1.5 bg-destructive/15 text-destructive">
              {errorCount} critical
            </Badge>
          )}
          {warningCount > 0 && (
            <Badge className="text-[8px] h-4 px-1.5 bg-amber-500/15 text-amber-600 dark:text-amber-400">
              {warningCount} warning{warningCount !== 1 ? 's' : ''}
            </Badge>
          )}
          {collapsed ? (
            <ChevronDown className="h-3 w-3 text-muted-foreground" />
          ) : (
            <ChevronUp className="h-3 w-3 text-muted-foreground" />
          )}
        </div>
      </button>

      {/* Warning list */}
      {!collapsed && (
        <div className={cn('space-y-1.5', loading && 'opacity-60')}>
          {warnings.map((w) => (
            <WarningCard key={w.id} warning={w} compact={compact} />
          ))}
        </div>
      )}
    </div>
  );
}
