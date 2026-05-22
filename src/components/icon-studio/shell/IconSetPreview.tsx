/**
 * IconSetPreview — visual mini-gallery for an icon set / pack / industry.
 *
 * Renders a 6-tile grid of real Lucide vector icons styled with a brand
 * accent token. Replaces the single-emoji placeholders with a proper
 * preview that hints at what a generated set will look like.
 */

import { cn } from '@/lib/utils';
import { iconsFromEmojis } from './iconPreviewMap';

interface Props {
  /** Source emoji list (from preset data); resolved to Lucide icons */
  emojis: string[];
  /** CSS color expression, e.g. `hsl(var(--tp-digital-blue))` or `hsl(221 100% 39%)`. */
  accent?: string;
  /** Visual density preset */
  size?: 'sm' | 'md' | 'lg';
  /** How many tiles to render (defaults to 6) */
  count?: number;
  /** Aesthetic style of the tiles */
  variant?: 'tile' | 'glass' | 'outline';
  className?: string;
}

const SIZE_PX: Record<NonNullable<Props['size']>, { tile: number; icon: number; gap: string }> = {
  sm: { tile: 28, icon: 14, gap: 'gap-1' },
  md: { tile: 40, icon: 20, gap: 'gap-1.5' },
  lg: { tile: 56, icon: 28, gap: 'gap-2' },
};

export const IconSetPreview = ({
  emojis,
  accent = 'hsl(var(--primary))',
  size = 'md',
  count = 6,
  variant = 'tile',
  className,
}: Props) => {
  const icons = iconsFromEmojis(emojis, count).slice(0, count);
  const dims = SIZE_PX[size];

  return (
    <div
      className={cn('grid grid-cols-6', dims.gap, className)}
      role="img"
      aria-label="Icon set preview"
    >
      {icons.map((Icon, i) => {
        const baseStyle: React.CSSProperties = {
          width: dims.tile,
          height: dims.tile,
          color: accent,
        };
        if (variant === 'tile') {
          baseStyle.background = `color-mix(in oklab, ${accent} 10%, transparent)`;
          baseStyle.border = `1px solid color-mix(in oklab, ${accent} 22%, transparent)`;
        } else if (variant === 'glass') {
          baseStyle.background = `linear-gradient(135deg, color-mix(in oklab, ${accent} 18%, transparent), color-mix(in oklab, ${accent} 4%, transparent))`;
          baseStyle.border = `1px solid color-mix(in oklab, ${accent} 28%, transparent)`;
          baseStyle.boxShadow = `inset 0 1px 0 color-mix(in oklab, ${accent} 30%, transparent)`;
        } else {
          baseStyle.border = `1.5px solid color-mix(in oklab, ${accent} 45%, transparent)`;
        }
        return (
          <div
            key={i}
            className="flex items-center justify-center rounded-lg transition-transform hover:scale-105"
            style={baseStyle}
          >
            <Icon style={{ width: dims.icon, height: dims.icon }} strokeWidth={1.75} />
          </div>
        );
      })}
    </div>
  );
};
