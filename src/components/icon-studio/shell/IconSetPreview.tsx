/**
 * IconSetPreview — visual mini-gallery for an icon set / pack / industry.
 *
 * Renders a grid of real Lucide vector icons styled with a brand accent
 * token, in any of ~20 visual variants so style systems read distinctly.
 */

import { cn } from '@/lib/utils';
import { iconsFromEmojis } from './iconPreviewMap';

export type IconPreviewVariant =
  | 'tile' | 'glass' | 'outline' | 'neon' | 'duotone' | 'soft' | 'sharp'
  | 'badge' | 'gradient' | 'sticker' | 'neumorphic' | 'flat' | 'chip'
  | 'ring' | 'dotted' | 'shadow' | 'mono' | 'hatched' | 'sketch'
  | 'pixel' | 'embossed' | 'inverse' | 'paper' | 'risograph';

interface Props {
  emojis: string[];
  /** CSS color expression, e.g. `hsl(var(--tp-digital-blue))`. */
  accent?: string;
  /** Optional secondary accent (for duotone/risograph/aurora). */
  accent2?: string;
  /** Optional recipe from the style system card, used to match glyph fill/stroke. */
  recipe?: { stroke?: boolean; fill?: boolean; duotone?: boolean; mono?: boolean };
  size?: 'sm' | 'md' | 'lg';
  count?: number;
  /** Number of columns in the grid. Defaults to `count` (single row). */
  columns?: number;
  variant?: IconPreviewVariant;
  radius?: number;
  strokeWidth?: number;
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
  accent2,
  recipe,
  size = 'md',
  count = 6,
  columns,
  variant = 'tile',
  radius,
  strokeWidth = 1.75,
  className,
}: Props) => {
  const icons = iconsFromEmojis(emojis, count).slice(0, count);
  const dims = SIZE_PX[size];
  const a2 = accent2 ?? `color-mix(in oklab, ${accent} 60%, white)`;
  const cols = columns ?? Math.min(count, 6);

  return (
    <div
      className={cn('grid', dims.gap, className)}
      style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
      role="img"
      aria-label="Icon set preview"
    >
      {icons.map((Icon, i) => {
        const style: React.CSSProperties = {
          width: dims.tile,
          height: dims.tile,
          color: accent,
          borderRadius: radius ?? 10,
          position: 'relative',
        };
        let iconColor: string | undefined;
        let iconStroke = strokeWidth;
        let extraIconStyle: React.CSSProperties = {};

        switch (variant) {
          case 'tile':
            style.background = `color-mix(in oklab, ${accent} 10%, transparent)`;
            style.border = `1px solid color-mix(in oklab, ${accent} 22%, transparent)`;
            break;
          case 'glass':
            style.background = `linear-gradient(135deg, color-mix(in oklab, ${accent} 18%, transparent), color-mix(in oklab, ${accent} 4%, transparent))`;
            style.border = `1px solid color-mix(in oklab, ${accent} 28%, transparent)`;
            style.boxShadow = `inset 0 1px 0 color-mix(in oklab, ${accent} 30%, transparent)`;
            break;
          case 'outline':
            style.border = `1.5px solid color-mix(in oklab, ${accent} 45%, transparent)`;
            break;
          case 'neon':
            style.background = 'hsl(220 30% 8%)';
            style.border = `1px solid ${accent}`;
            style.boxShadow = `0 0 12px color-mix(in oklab, ${accent} 60%, transparent), inset 0 0 8px color-mix(in oklab, ${accent} 35%, transparent)`;
            break;
          case 'duotone':
            style.background = `linear-gradient(135deg, color-mix(in oklab, ${accent} 22%, transparent) 50%, color-mix(in oklab, ${a2} 18%, transparent) 50%)`;
            style.border = `1px solid color-mix(in oklab, ${accent} 25%, transparent)`;
            break;
          case 'soft':
            style.background = `color-mix(in oklab, ${accent} 14%, transparent)`;
            style.borderRadius = radius ?? 16;
            break;
          case 'sharp':
            style.background = `color-mix(in oklab, ${accent} 18%, transparent)`;
            style.borderRadius = 0;
            break;
          case 'badge':
            style.background = `radial-gradient(circle at 30% 30%, color-mix(in oklab, ${accent} 35%, transparent), color-mix(in oklab, ${accent} 10%, transparent))`;
            style.border = `1.5px solid ${accent}`;
            style.borderRadius = 999;
            break;
          case 'gradient':
            style.background = `linear-gradient(135deg, ${accent}, ${a2})`;
            iconColor = 'white';
            break;
          case 'sticker':
            style.background = 'white';
            style.border = `2px solid ${accent}`;
            style.boxShadow = `2px 2px 0 ${accent}`;
            break;
          case 'neumorphic':
            style.background = 'hsl(220 14% 14%)';
            style.boxShadow = `-2px -2px 4px hsl(220 14% 20%), 2px 2px 4px hsl(220 14% 6%)`;
            break;
          case 'flat':
            style.background = accent;
            iconColor = 'white';
            break;
          case 'chip':
            style.background = `color-mix(in oklab, ${accent} 12%, transparent)`;
            style.border = `1px solid color-mix(in oklab, ${accent} 30%, transparent)`;
            style.borderRadius = 999;
            break;
          case 'ring':
            style.borderRadius = 999;
            style.border = `1.5px solid color-mix(in oklab, ${accent} 50%, transparent)`;
            style.boxShadow = `0 0 0 3px color-mix(in oklab, ${accent} 10%, transparent), 0 0 0 4px color-mix(in oklab, ${accent} 25%, transparent)`;
            break;
          case 'dotted':
            style.border = `1.5px dashed color-mix(in oklab, ${accent} 55%, transparent)`;
            break;
          case 'shadow':
            style.background = `color-mix(in oklab, ${accent} 12%, transparent)`;
            style.boxShadow = `0 6px 12px -4px color-mix(in oklab, ${accent} 50%, transparent)`;
            break;
          case 'mono':
            style.background = 'hsl(220 6% 22%)';
            iconColor = 'hsl(220 6% 78%)';
            break;
          case 'hatched':
            style.backgroundImage = `repeating-linear-gradient(45deg, color-mix(in oklab, ${accent} 22%, transparent) 0 2px, transparent 2px 6px)`;
            style.border = `1px solid color-mix(in oklab, ${accent} 35%, transparent)`;
            break;
          case 'sketch':
            style.border = `1.5px dashed ${accent}`;
            style.background = 'transparent';
            extraIconStyle.transform = `rotate(${(i % 2 ? -1 : 1) * 2}deg)`;
            break;
          case 'pixel':
            style.background = `color-mix(in oklab, ${accent} 18%, transparent)`;
            style.border = `2px solid ${accent}`;
            style.borderRadius = 2;
            style.imageRendering = 'pixelated' as any;
            iconStroke = 2.25;
            break;
          case 'embossed':
            style.background = `linear-gradient(180deg, color-mix(in oklab, ${accent} 16%, transparent), color-mix(in oklab, ${accent} 4%, transparent))`;
            style.boxShadow = `inset 0 1px 0 color-mix(in oklab, white 40%, transparent), inset 0 -1px 0 color-mix(in oklab, black 30%, transparent)`;
            break;
          case 'inverse':
            style.background = accent;
            style.border = `1px solid color-mix(in oklab, ${accent} 80%, black)`;
            iconColor = 'white';
            break;
          case 'paper':
            style.background = 'hsl(40 30% 96%)';
            style.boxShadow = `3px 3px 0 color-mix(in oklab, ${accent} 70%, transparent)`;
            iconColor = `color-mix(in oklab, ${accent} 80%, black)`;
            break;
          case 'risograph':
            style.background = `color-mix(in oklab, ${accent} 22%, transparent)`;
            extraIconStyle = {
              filter: `drop-shadow(2px 2px 0 ${a2})`,
            };
            break;
        }

        const resolvedIconColor = iconColor ?? (recipe?.mono ? 'hsl(var(--muted-foreground))' : accent);
        const recipeFill = recipe?.duotone ? a2 : recipe?.fill ? resolvedIconColor : 'none';
        const recipeFillOpacity = recipe?.duotone ? 0.35 : recipe?.fill ? 0.88 : undefined;
        const recipeStrokeWidth = recipe?.fill && !recipe?.stroke && !recipe?.duotone
          ? Math.max(iconStroke * 0.72, 1)
          : iconStroke;

        return (
          <div
            key={i}
            className="flex items-center justify-center transition-transform hover:scale-105"
            style={style}
          >
            <Icon
              style={{
                width: dims.icon,
                height: dims.icon,
                color: resolvedIconColor,
                ...extraIconStyle,
              }}
              fill={recipeFill}
              fillOpacity={recipeFillOpacity}
              stroke="currentColor"
              strokeWidth={recipeStrokeWidth}
            />
          </div>
        );
      })}
    </div>
  );
};
