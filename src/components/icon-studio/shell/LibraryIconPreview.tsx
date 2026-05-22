/**
 * LibraryIconPreview — shows the first N real icons from a saved library
 * (using IconSvgRender) so each card reflects the brand-specific style.
 * Falls back to the generic emoji-based IconSetPreview when the library
 * is empty.
 */

import { cn } from '@/lib/utils';
import type { BrandIconography } from '@/types/brand';
import { IconSvgRender } from '@/components/icon-studio/IconSvgRender';
import { IconSetPreview } from './IconSetPreview';

interface Props {
  icons?: BrandIconography[] | null;
  fallbackEmojis: string[];
  accent: string;
  count?: number;
  size?: 'sm' | 'md' | 'lg';
  /** Visual size of the rendered SVG glyph in px. */
  iconPx?: number;
  /** Tile height. */
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
  const real = (icons ?? []).filter((i) => i?.svgPath).slice(0, count);

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

  const tile = tilePx ?? (size === 'lg' ? 56 : size === 'md' ? 40 : 32);
  const glyph = iconPx ?? Math.round(tile * 0.55);
  const gap = size === 'lg' ? 'gap-2' : size === 'md' ? 'gap-1.5' : 'gap-1';

  return (
    <div
      className={cn('grid', gap, className)}
      style={{ gridTemplateColumns: `repeat(${count}, minmax(0, 1fr))` }}
      role="img"
      aria-label="Brand icon preview"
    >
      {real.map((ic, i) => (
        <div
          key={ic.id ?? i}
          className="flex items-center justify-center rounded-md border transition-transform hover:scale-105 text-foreground"
          style={{
            height: tile,
            background: `color-mix(in oklab, ${accent} 12%, transparent)`,
            borderColor: `color-mix(in oklab, ${accent} 28%, transparent)`,
          }}
          title={ic.name}
        >
          <IconSvgRender
            icon={ic}
            size={glyph}
            presentation="outlined"
            strokeWidth={1.75}
          />
        </div>
      ))}
      {/* Pad with empty tiles to keep a stable grid */}
      {Array.from({ length: Math.max(0, count - real.length) }).map((_, i) => (
        <div
          key={`pad-${i}`}
          className="rounded-md border border-dashed"
          style={{
            height: tile,
            borderColor: `color-mix(in oklab, ${accent} 18%, transparent)`,
          }}
        />
      ))}
    </div>
  );
};
