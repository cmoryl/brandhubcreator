/**
 * ImportedIconPreview — renders sample icons from the bundled library by
 * materializing data URLs on demand from pack JSONs.
 */
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { materializeDataUrl } from '@/lib/iconLibrary/loader';
import type { ImportedIconEntry } from '@/lib/iconLibrary/types';

interface Props {
  icons: ImportedIconEntry[];
  variant?: 'light-blue' | 'white';
  accent: string;
  count?: number;
  tilePx?: number;
  className?: string;
}

export const ImportedIconPreview = ({
  icons,
  variant = 'light-blue',
  accent,
  count = 6,
  tilePx = 32,
  className,
}: Props) => {
  const visible = icons.slice(0, count);
  const [urls, setUrls] = useState<Record<string, string>>({});

  useEffect(() => {
    let cancelled = false;
    Promise.all(
      visible.map((ic) =>
        materializeDataUrl(ic.pack, ic.name).then((url) => [ic.id, url] as const).catch(() => null),
      ),
    ).then((pairs) => {
      if (cancelled) return;
      const next: Record<string, string> = {};
      pairs.forEach((p) => {
        if (p) next[p[0]] = p[1];
      });
      setUrls(next);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible.map((i) => i.id).join('|')]);

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
            color: variant === 'white' ? 'white' : accent,
          }}
          title={ic.label}
        >
          {urls[ic.id] ? (
            <img
              src={urls[ic.id]}
              alt={ic.label}
              loading="lazy"
              className="h-4 w-4 object-contain"
              style={{
                filter: variant === 'white' ? 'brightness(0) invert(1)' : undefined,
              }}
            />
          ) : (
            <div className="h-4 w-4 rounded bg-current opacity-10" />
          )}
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
