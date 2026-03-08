/**
 * AssetColorAnalysis — Extracts dominant colors from an asset's image
 * and displays a mini color analysis in the inspector panel.
 */
import { useState, useEffect, useCallback } from 'react';
import { Palette, Loader2, RefreshCw, Check, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

interface AssetColorAnalysisProps {
  imageUrl: string;
  assetName: string;
  /** Optional brand colors to compare against */
  brandColors?: string[];
}

/** Extract dominant colors from an image using canvas sampling */
function extractColors(imageUrl: string, sampleCount = 6): Promise<string[]> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const size = 64; // downsample for speed
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      if (!ctx) { resolve([]); return; }

      ctx.drawImage(img, 0, 0, size, size);
      const data = ctx.getImageData(0, 0, size, size).data;

      // Simple k-means-ish: bucket by hue ranges
      const buckets: Map<string, { r: number; g: number; b: number; count: number }> = new Map();

      for (let i = 0; i < data.length; i += 16) { // sample every 4th pixel
        const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3];
        if (a < 128) continue; // skip transparent

        // Quantize to reduce palette
        const qr = Math.round(r / 32) * 32;
        const qg = Math.round(g / 32) * 32;
        const qb = Math.round(b / 32) * 32;
        const key = `${qr},${qg},${qb}`;

        const existing = buckets.get(key);
        if (existing) {
          existing.r += r; existing.g += g; existing.b += b; existing.count++;
        } else {
          buckets.set(key, { r, g, b, count: 1 });
        }
      }

      // Sort by frequency, take top N
      const sorted = [...buckets.values()]
        .sort((a, b) => b.count - a.count)
        .slice(0, sampleCount);

      const colors = sorted.map(({ r, g, b, count }) => {
        const avgR = Math.round(r / count);
        const avgG = Math.round(g / count);
        const avgB = Math.round(b / count);
        return `#${avgR.toString(16).padStart(2, '0')}${avgG.toString(16).padStart(2, '0')}${avgB.toString(16).padStart(2, '0')}`;
      });

      resolve(colors);
    };
    img.onerror = () => resolve([]);
    img.src = imageUrl;
  });
}

/** Calculate relative luminance */
function luminance(hex: string): number {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const toLinear = (c: number) => c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

/** WCAG contrast ratio between two hex colors */
function contrastRatio(hex1: string, hex2: string): number {
  const l1 = luminance(hex1);
  const l2 = luminance(hex2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/** Color distance (simple Euclidean in RGB) */
function colorDistance(hex1: string, hex2: string): number {
  const r1 = parseInt(hex1.slice(1, 3), 16), g1 = parseInt(hex1.slice(3, 5), 16), b1 = parseInt(hex1.slice(5, 7), 16);
  const r2 = parseInt(hex2.slice(1, 3), 16), g2 = parseInt(hex2.slice(3, 5), 16), b2 = parseInt(hex2.slice(5, 7), 16);
  return Math.sqrt((r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2);
}

export function AssetColorAnalysis({ imageUrl, assetName, brandColors = [] }: AssetColorAnalysisProps) {
  const [colors, setColors] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [analyzed, setAnalyzed] = useState(false);

  const analyze = useCallback(async () => {
    setLoading(true);
    try {
      const extracted = await extractColors(imageUrl);
      setColors(extracted);
      setAnalyzed(true);
    } catch {
      setColors([]);
    } finally {
      setLoading(false);
    }
  }, [imageUrl]);

  // Auto-analyze on mount
  useEffect(() => {
    if (imageUrl) analyze();
  }, [imageUrl, analyze]);

  if (!imageUrl) return null;

  // Compute basic analysis
  const contrastPairs: { c1: string; c2: string; ratio: number; pass: boolean }[] = [];
  if (colors.length >= 2) {
    for (let i = 0; i < Math.min(colors.length, 3); i++) {
      for (let j = i + 1; j < Math.min(colors.length, 4); j++) {
        const ratio = contrastRatio(colors[i], colors[j]);
        contrastPairs.push({ c1: colors[i], c2: colors[j], ratio, pass: ratio >= 4.5 });
      }
    }
  }

  // Brand alignment check
  const brandMatches: { extracted: string; brand: string; distance: number; match: boolean }[] = [];
  if (brandColors.length > 0 && colors.length > 0) {
    for (const ec of colors.slice(0, 4)) {
      let closest = brandColors[0];
      let minDist = colorDistance(ec, closest);
      for (const bc of brandColors.slice(1)) {
        const d = colorDistance(ec, bc);
        if (d < minDist) { minDist = d; closest = bc; }
      }
      brandMatches.push({ extracted: ec, brand: closest, distance: minDist, match: minDist < 80 });
    }
  }

  const brandAlignmentPct = brandMatches.length > 0
    ? Math.round((brandMatches.filter(m => m.match).length / brandMatches.length) * 100)
    : null;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
          <Palette className="h-3 w-3" /> Color Analysis
        </p>
        <Button
          variant="ghost" size="sm"
          className="h-5 w-5 p-0"
          onClick={analyze}
          disabled={loading}
        >
          {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
        </Button>
      </div>

      {/* Extracted palette */}
      {colors.length > 0 && (
        <div className="space-y-1.5">
          <div className="flex gap-1">
            {colors.map((c, i) => (
              <div key={i} className="group relative">
                <div
                  className="h-6 w-6 rounded border border-border/50 cursor-pointer transition-transform hover:scale-110"
                  style={{ backgroundColor: c }}
                  title={c}
                />
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 hidden group-hover:block bg-popover text-popover-foreground text-[8px] font-mono px-1 py-0.5 rounded shadow-sm border whitespace-nowrap z-10">
                  {c}
                </div>
              </div>
            ))}
          </div>

          {/* Contrast checks */}
          {contrastPairs.length > 0 && (
            <div className="space-y-1">
              <p className="text-[9px] text-muted-foreground font-medium">Contrast Pairs</p>
              {contrastPairs.slice(0, 3).map((pair, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <div className="flex gap-0.5">
                    <div className="h-3 w-3 rounded-sm border border-border/50" style={{ backgroundColor: pair.c1 }} />
                    <div className="h-3 w-3 rounded-sm border border-border/50" style={{ backgroundColor: pair.c2 }} />
                  </div>
                  <span className="text-[9px] font-mono">{pair.ratio.toFixed(1)}:1</span>
                  {pair.pass ? (
                    <Badge variant="secondary" className="text-[8px] h-3.5 px-1 bg-primary/10 text-primary">
                      <Check className="h-2 w-2 mr-0.5" /> AA
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-[8px] h-3.5 px-1 bg-destructive/10 text-destructive">
                      <AlertTriangle className="h-2 w-2 mr-0.5" /> Fail
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Brand alignment */}
          {brandAlignmentPct !== null && (
            <div className="space-y-1">
              <p className="text-[9px] text-muted-foreground font-medium">Brand Alignment</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all",
                      brandAlignmentPct >= 75 ? "bg-primary" :
                      brandAlignmentPct >= 50 ? "bg-amber-500" : "bg-destructive"
                    )}
                    style={{ width: `${brandAlignmentPct}%` }}
                  />
                </div>
                <span className={cn(
                  "text-[10px] font-semibold",
                  brandAlignmentPct >= 75 ? "text-primary" :
                  brandAlignmentPct >= 50 ? "text-amber-500" : "text-destructive"
                )}>
                  {brandAlignmentPct}%
                </span>
              </div>
              <div className="flex gap-0.5">
                {brandMatches.map((m, i) => (
                  <div key={i} className="flex items-center gap-0.5" title={`${m.extracted} → ${m.brand} (dist: ${m.distance.toFixed(0)})`}>
                    <div className="h-3 w-3 rounded-sm border border-border/50" style={{ backgroundColor: m.extracted }} />
                    <span className="text-[8px] text-muted-foreground">→</span>
                    <div className={cn(
                      "h-3 w-3 rounded-sm border",
                      m.match ? "border-primary" : "border-destructive/50"
                    )} style={{ backgroundColor: m.brand }} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {!analyzed && !loading && (
        <p className="text-[9px] text-muted-foreground">Analyzing colors…</p>
      )}
    </div>
  );
}
