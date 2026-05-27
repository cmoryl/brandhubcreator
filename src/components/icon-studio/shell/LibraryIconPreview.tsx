/**
 * LibraryIconPreview — premium preview strip of real library icons.
 *
 * Renders a clean, evenly-spaced grid of brand-specific glyphs using
 * IconSvgRender. Falls back to the emoji preview when a library is empty.
 * Shows a "+N" tile when the library has more icons than fit in the preview.
 */

import { cn } from '@/lib/utils';
import type { BrandIconography } from '@/types/brand';
import { IconSvgRender } from '@/components/icon-studio/IconSvgRender';
import { IconSetPreview } from './IconSetPreview';
import { scoreIcon, BRAIN_AXIS_LABELS, type BrainAxis } from '@/lib/iconStudio/qa';

/**
 * Compute the worst-axis brain citation for an icon. Returns null when the
 * icon passes the rubric cleanly so we don't decorate healthy tiles.
 */
const brainCitationFor = (
  icon: BrandIconography,
): { axis: BrainAxis; score: number; principle?: string } | null => {
  try {
    const report = scoreIcon(icon);
    let axis: BrainAxis = 'gridIntegrity';
    let score = 100;
    for (const k of Object.keys(report.scores.brainRubric) as BrainAxis[]) {
      if (report.scores.brainRubric[k] < score) {
        score = report.scores.brainRubric[k];
        axis = k;
      }
    }
    if (score >= 85) return null;
    const finding = report.findings.find((f) => f.brainAxis === axis && f.brainPrinciple);
    return { axis, score, principle: finding?.brainPrinciple };
  } catch {
    return null;
  }
};


interface Props {
  icons?: BrandIconography[] | null;
  fallbackEmojis: string[];
  accent: string;
  count?: number;
  size?: 'sm' | 'md' | 'lg';
  iconPx?: number;
  tilePx?: number;
  className?: string;
}

export const LibraryIconPreview = ({
  icons,
  fallbackEmojis,
  accent,
  count = 6,
  size = 'sm',
  iconPx,
  tilePx,
  className,
}: Props) => {
  const allReal = (icons ?? []).filter((i) => i?.svgPath);
  const totalReal = allReal.length;
  const real = allReal.slice(0, count);

  if (real.length === 0) {
    return (
      <IconSetPreview
        emojis={fallbackEmojis}
        accent={accent}
        size={size}
        count={count}
        variant="glass"
        className={className}
      />
    );
  }

  const tile = tilePx ?? (size === 'lg' ? 56 : size === 'md' ? 44 : 36);
  const glyph = iconPx ?? Math.round(tile * 0.55);
  const gap = size === 'lg' ? 'gap-2' : size === 'md' ? 'gap-1.5' : 'gap-1.5';
  const overflow = Math.max(0, totalReal - real.length);
  // Reserve one slot for the "+N" tile if needed
  const slots = overflow > 0 ? real.slice(0, count - 1) : real;
  const showOverflow = overflow > 0;

  return (
    <div
      className={cn(
        'relative grid auto-cols-fr grid-flow-col items-center rounded-xl p-1.5',
        gap,
        className,
      )}
      style={{
        background: `linear-gradient(135deg, color-mix(in oklab, ${accent} 8%, transparent), color-mix(in oklab, ${accent} 2%, transparent))`,
        border: `1px solid color-mix(in oklab, ${accent} 16%, transparent)`,
      }}
      role="img"
      aria-label="Brand icon preview"
    >
      {slots.map((ic, i) => (
        <div
          key={ic.id ?? i}
          className="group flex items-center justify-center rounded-lg bg-background/70 backdrop-blur-sm text-foreground shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
          style={{
            height: tile,
            width: tile,
            border: `1px solid color-mix(in oklab, ${accent} 22%, transparent)`,
          }}
          title={ic.name}
        >
          <IconSvgRender
            icon={ic}
            size={glyph}
            presentation="auto"
            strokeWidth={1.75}
          />
        </div>
      ))}
      {showOverflow && (
        <div
          className="flex items-center justify-center rounded-lg text-[10px] font-semibold tabular-nums"
          style={{
            height: tile,
            width: tile,
            color: accent,
            background: `color-mix(in oklab, ${accent} 14%, transparent)`,
            border: `1px dashed color-mix(in oklab, ${accent} 34%, transparent)`,
          }}
          title={`${overflow} more icons`}
        >
          +{overflow > 999 ? `${Math.round(overflow / 100) / 10}k` : overflow}
        </div>
      )}
    </div>
  );
};
