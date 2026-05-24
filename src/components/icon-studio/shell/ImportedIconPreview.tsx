/**
 * ImportedIconPreview — renders imported SVG icons using <img> since they
 * live as static files rather than inline svgPath data.
 */
import { cn } from '@/lib/utils';
import type { ImportedIconEntry } from '@/hooks/useImportedIcons';

interface Props {
  icons: ImportedIconEntry[];
  variant: 'light-blue' | 'white';
  accent: string;
  count?: number;
  tilePx?: number;
  className?: string;
}

export const ImportedIconPreview = ({
  icons,
  variant,
  accent,
  count = 6,
  tilePx = 32,
  className,
}: Props) => {
  const visible = icons
    .filter((i) => i.variant === variant)
    .slice(0, count);

  const bgStyle =
    variant === 'white'
      ? { background: 'hsl(var(--tp-digital-blue) / 0.85)' }
      : { background: `color-mix(in oklab, ${accent} 12%, transparent)` };

  return (
    <div className={cn('flex gap-1', className)} role="img" aria-label="Imported icon preview">
      {visible.map((ic) => (
        <div
          key={ic.id}
          className="flex items-center justify-center rounded-md border flex-shrink-0"
          style={{
            height: tilePx,
            width: tilePx,
            ...bgStyle,
            borderColor: `color-mix(in oklab, ${accent} 28%, transparent)`,
          }}
          title={ic.name}
        >
          <img
            src={ic.path}
            alt={ic.name}
            loading="lazy"
            className="h-4 w-4 object-contain"
            style={{
              filter: variant === 'white' ? 'brightness(0) invert(1)' : undefined,
            }}
          />
        </div>
      ))}
      {Array.from({ length: Math.max(0, count - visible.length) }).map((_, i) => (
        <div
          key={`pad-${i}`}
          className="rounded-md border border-dashed flex-shrink-0"
          style={{
            height: tilePx,
            width: tilePx,
            borderColor: `color-mix(in oklab, ${accent} 18%, transparent)`,
          }}
        />
      ))}
    </div>
  );
};
