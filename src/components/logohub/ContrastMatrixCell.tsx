import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  url: string;
  variant: 'color' | 'black' | 'white';
}

interface ContrastResult {
  bg: string;
  label: string;
  ratio: number;
  status: 'pass' | 'warn' | 'fail';
}

/** Approved background swatches every brand mark should survive on. */
const BACKGROUNDS = [
  { bg: '#ffffff', label: 'White' },
  { bg: '#f4f4f5', label: 'Light gray' },
  { bg: '#0a0a0a', label: 'Black' },
  { bg: '#0f172a', label: 'Slate dark' },
  { bg: '#1e40af', label: 'Brand blue' },
  { bg: '#dc2626', label: 'Brand red' },
];

function srgbToLinear(c: number): number {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}
function luminance(r: number, g: number, b: number): number {
  return 0.2126 * srgbToLinear(r) + 0.7152 * srgbToLinear(g) + 0.0722 * srgbToLinear(b);
}
function hexLum(hex: string): number {
  const m = hex.replace('#', '').match(/.{2}/g);
  if (!m) return 0;
  const [r, g, b] = m.map((h) => parseInt(h, 16));
  return luminance(r, g, b);
}
function contrast(l1: number, l2: number): number {
  const a = Math.max(l1, l2);
  const b = Math.min(l1, l2);
  return (a + 0.05) / (b + 0.05);
}

export function ContrastMatrixCell({ url, variant }: Props) {
  const [results, setResults] = useState<ContrastResult[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const ctrl = new AbortController();
    setLoading(true);
    setError(null);

    (async () => {
      try {
        // Rasterize the logo onto a transparent canvas, then compute its
        // average ink luminance from pixels with alpha > 0.
        const blob = await fetch(url, { signal: ctrl.signal }).then((r) => {
          if (!r.ok) throw new Error(`HTTP ${r.status}`);
          return r.blob();
        });
        const bitmap = await createImageBitmap(blob).catch(() => null);
        if (!bitmap) throw new Error('Could not decode image');
        const W = 64;
        const H = Math.max(1, Math.round((bitmap.height / bitmap.width) * 64));
        const canvas = document.createElement('canvas');
        canvas.width = W;
        canvas.height = H;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) throw new Error('No canvas context');
        ctx.clearRect(0, 0, W, H);
        ctx.drawImage(bitmap, 0, 0, W, H);
        const data = ctx.getImageData(0, 0, W, H).data;

        let sumLum = 0;
        let opaquePixels = 0;
        for (let i = 0; i < data.length; i += 4) {
          const a = data[i + 3];
          if (a < 32) continue; // ignore transparent
          opaquePixels += 1;
          sumLum += luminance(data[i], data[i + 1], data[i + 2]);
        }
        if (opaquePixels === 0) throw new Error('Image is blank / fully transparent');
        const inkLum = sumLum / opaquePixels;

        const computed: ContrastResult[] = BACKGROUNDS.map(({ bg, label }) => {
          const ratio = contrast(inkLum, hexLum(bg));
          const status: ContrastResult['status'] =
            ratio >= 4.5 ? 'pass' : ratio >= 3 ? 'warn' : 'fail';
          return { bg, label, ratio, status };
        });
        if (!cancelled) {
          setResults(computed);
          setLoading(false);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Failed');
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
      ctrl.abort();
    };
  }, [url]);

  const failCount = results?.filter((r) => r.status === 'fail').length ?? 0;
  const warnCount = results?.filter((r) => r.status === 'warn').length ?? 0;

  return (
    <details className="mt-1 text-[10px] text-left">
      <summary
        className={cn(
          'cursor-pointer hover:underline inline-flex items-center gap-1',
          loading
            ? 'text-muted-foreground'
            : failCount > 0
              ? 'text-red-600 dark:text-red-400'
              : warnCount > 0
                ? 'text-amber-600 dark:text-amber-400'
                : 'text-emerald-600 dark:text-emerald-400',
        )}
      >
        {loading ? (
          <>
            <Loader2 className="h-3 w-3 animate-spin" /> Contrast…
          </>
        ) : error ? (
          <>Contrast: {error}</>
        ) : (
          <>
            Multi-bg contrast · {failCount}✗ · {warnCount}⚠
          </>
        )}
      </summary>
      {results && (
        <div className="mt-1 grid grid-cols-3 gap-1">
          {results.map((r) => (
            <div key={r.bg} className="flex flex-col items-center gap-0.5">
              <div
                className="h-10 w-14 rounded border border-border flex items-center justify-center overflow-hidden"
                style={{ backgroundColor: r.bg }}
              >
                <img src={url} alt="" className="max-h-9 max-w-12 object-contain" loading="lazy" />
              </div>
              <span
                className={cn(
                  'text-[9px] font-medium',
                  r.status === 'pass'
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : r.status === 'warn'
                      ? 'text-amber-600 dark:text-amber-400'
                      : 'text-red-600 dark:text-red-400',
                )}
              >
                {r.label} · {r.ratio.toFixed(1)}
              </span>
            </div>
          ))}
        </div>
      )}
      <p className="mt-1 text-[9px] text-muted-foreground">
        WCAG: ≥4.5 pass · ≥3.0 large-text only · &lt;3.0 fail. Variant: <em>{variant}</em>.
      </p>
    </details>
  );
}
