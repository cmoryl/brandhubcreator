import { cn } from '@/lib/utils';

interface Props {
  url: string;
  variant: 'color' | 'black' | 'white';
}

/**
 * Color-vision-deficiency previews. Uses SVG <feColorMatrix> filters
 * applied via `filter: url(#id)` so the original bytes remain intact.
 * Defines all filter primitives once per page mount (cheap to repeat).
 *
 * Matrices from: https://www.inclusivecolors.com/ (Brettel et al. 1997).
 */
export function ColorBlindCell({ url, variant }: Props) {
  const dark = variant === 'white';
  return (
    <details className="mt-1 text-[10px] text-left">
      <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
        Color-blind preview
      </summary>
      <ColorBlindFilters />
      <div className="mt-1 grid grid-cols-3 gap-1">
        {[
          { id: 'cvd-protan', label: 'Protan' },
          { id: 'cvd-deutan', label: 'Deutan' },
          { id: 'cvd-tritan', label: 'Tritan' },
        ].map((f) => (
          <div key={f.id} className="flex flex-col items-center gap-0.5">
            <div
              className={cn(
                'h-10 w-14 rounded border border-border flex items-center justify-center overflow-hidden',
                dark ? 'bg-neutral-800' : 'bg-white',
              )}
            >
              <img
                src={url}
                alt=""
                className="max-h-9 max-w-12 object-contain"
                style={{ filter: `url(#${f.id})` }}
                loading="lazy"
              />
            </div>
            <span className="text-[9px] text-muted-foreground">{f.label}</span>
          </div>
        ))}
      </div>
    </details>
  );
}

function ColorBlindFilters() {
  return (
    <svg width="0" height="0" aria-hidden="true" className="absolute" style={{ position: 'absolute' }}>
      <defs>
        <filter id="cvd-protan">
          <feColorMatrix
            type="matrix"
            values="0.567,0.433,0,0,0  0.558,0.442,0,0,0  0,0.242,0.758,0,0  0,0,0,1,0"
          />
        </filter>
        <filter id="cvd-deutan">
          <feColorMatrix
            type="matrix"
            values="0.625,0.375,0,0,0  0.7,0.3,0,0,0  0,0.3,0.7,0,0  0,0,0,1,0"
          />
        </filter>
        <filter id="cvd-tritan">
          <feColorMatrix
            type="matrix"
            values="0.95,0.05,0,0,0  0,0.433,0.567,0,0  0,0.475,0.525,0,0  0,0,0,1,0"
          />
        </filter>
      </defs>
    </svg>
  );
}
