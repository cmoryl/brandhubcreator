/**
 * BrandLogoVariantPicker
 *
 * Reusable swatch picker for choosing a brand logo variant for a template
 * "logo" zone. When a background URL is supplied, the picker samples its
 * luminance and ranks variants by contrast — surfacing a recommended pick,
 * dimming poor matches, and showing the auto-matched marker so users can
 * confirm or override the engine's choice.
 *
 * The component is purely presentational + a small luminance side-effect; it
 * has no opinion on persistence. Callers receive the chosen URL and the
 * BrandLogo object so they can record manual overrides (e.g. clear the
 * `autoMatchedLogoId` flag on the underlying zone).
 */

import { useEffect, useMemo, useState } from 'react';
import { Check, Sparkles, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  sampleImageLuminance,
  scoreLogoForBackground,
  describeBackgroundTone,
} from '@/lib/templateZonePipeline';
import type { BrandLogo } from '@/types/brand';

export interface BrandLogoVariantPickerProps {
  /** Available logo variants from the brand library. */
  brandLogos?: BrandLogo[];
  /** URL currently bound to the zone (if any). Used to highlight the active swatch. */
  selectedUrl?: string;
  /** URL of the background sitting behind the logo zone — drives ranking. */
  backgroundUrl?: string;
  /** When the engine picked the current logo automatically, the id of that logo. */
  autoMatchedLogoId?: string;
  /** Receives both the URL and the source BrandLogo so callers can drop the auto-match flag. */
  onSelect: (url: string, logo: BrandLogo) => void;
  /** Optional title override for the swatch group. */
  label?: string;
  className?: string;
  /** Compact rendering for inline pickers (smaller swatches, tighter spacing). */
  compact?: boolean;
}

/**
 * Stand-alone async hook: samples the perceived luminance of a background
 * image so callers can rank logo variants without re-implementing the
 * canvas-based sampler each time.
 */
export const useBackgroundLuminance = (url?: string): number | null => {
  const [lum, setLum] = useState<number | null>(null);
  useEffect(() => {
    let cancelled = false;
    if (!url) {
      setLum(null);
      return;
    }
    void sampleImageLuminance(url).then((value) => {
      if (!cancelled) setLum(value);
    });
    return () => { cancelled = true; };
  }, [url]);
  return lum;
};

export const BrandLogoVariantPicker = ({
  brandLogos,
  selectedUrl,
  backgroundUrl,
  autoMatchedLogoId,
  onSelect,
  label = 'Brand logo variants',
  className,
  compact = false,
}: BrandLogoVariantPickerProps) => {
  const usableLogos = useMemo(
    () => (brandLogos || []).filter((logo) => !!logo.url),
    [brandLogos],
  );
  const bgLum = useBackgroundLuminance(backgroundUrl);

  if (usableLogos.length === 0) return null;

  const bgTone = bgLum !== null ? describeBackgroundTone(bgLum) : null;
  const ranked = usableLogos
    .map((logo) => ({
      logo,
      score: bgLum !== null ? scoreLogoForBackground(logo.variant, bgLum) : 0.5,
    }))
    .sort((a, b) => b.score - a.score);
  const topScore = ranked[0]?.score ?? 0;

  const swatchSize = compact ? 'h-10 w-14' : 'h-12 w-16';

  return (
    <div
      className={cn(
        'space-y-1.5 rounded-lg border border-dashed border-border bg-muted/10 p-2',
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] font-medium text-muted-foreground">{label}</p>
        {bgTone && (
          <span
            className="flex items-center gap-1 text-[10px] text-muted-foreground"
            title="Detected from the background sitting behind this logo zone"
          >
            <span
              aria-hidden="true"
              className={cn(
                'h-2.5 w-2.5 rounded-full border border-border',
                bgTone === 'dark' && 'bg-foreground',
                bgTone === 'light' && 'bg-background',
                bgTone === 'mid' && 'bg-muted',
              )}
            />
            {bgTone === 'dark' ? 'Dark' : bgTone === 'light' ? 'Light' : 'Mid-tone'} background
          </span>
        )}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {ranked.map(({ logo, score }) => {
          const isActive = selectedUrl === logo.url;
          const isRecommended = bgLum !== null && score === topScore && score >= 0.7;
          const isPoorMatch = bgLum !== null && score < 0.3;
          const isAutoMatched = isActive && autoMatchedLogoId === logo.id;

          const tooltip = [
            `${logo.name} (${logo.variant})`,
            isRecommended ? 'Recommended for this background' : null,
            isPoorMatch ? 'Low contrast on this background' : null,
            isAutoMatched ? 'Auto-matched — click any swatch to confirm or override' : null,
          ].filter(Boolean).join(' — ');

          return (
            <button
              key={logo.id}
              type="button"
              title={tooltip}
              aria-label={tooltip}
              aria-pressed={isActive}
              onClick={() => onSelect(logo.url, logo)}
              className={cn(
                'group relative flex items-center justify-center overflow-hidden rounded-md border p-1 transition-colors',
                swatchSize,
                // Preview reversed/monochrome marks on a dark surface so they
                // remain visible in the picker.
                logo.variant === 'reversed' || logo.variant === 'monochrome'
                  ? 'bg-foreground'
                  : 'bg-background',
                isActive
                  ? 'border-primary ring-2 ring-primary ring-offset-1 ring-offset-background'
                  : isRecommended
                    ? 'border-primary/60 hover:border-primary'
                    : 'border-border hover:border-primary/40',
                isPoorMatch && !isActive && 'opacity-50',
              )}
            >
              <img
                src={logo.url}
                alt={logo.name}
                className="max-h-full max-w-full object-contain"
              />

              {/* Recommended star — engine-suggested best contrast */}
              {isRecommended && !isActive && (
                <span
                  className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-primary-foreground shadow"
                  aria-hidden="true"
                >
                  <Sparkles className="h-2.5 w-2.5" />
                </span>
              )}

              {/* Active checkmark (manual confirmation) */}
              {isActive && !isAutoMatched && (
                <span
                  className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-primary-foreground shadow"
                  aria-hidden="true"
                >
                  <Check className="h-2.5 w-2.5" />
                </span>
              )}

              {/* Auto-matched marker — distinct from manual confirmation */}
              {isAutoMatched && (
                <span
                  className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-white shadow"
                  aria-hidden="true"
                >
                  <Sparkles className="h-2.5 w-2.5" />
                </span>
              )}

              {/* Poor-match warning corner */}
              {isPoorMatch && !isActive && (
                <span
                  className="absolute -bottom-1 -left-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow"
                  aria-hidden="true"
                >
                  <AlertTriangle className="h-2 w-2" />
                </span>
              )}
            </button>
          );
        })}
      </div>

      <p className="text-[10px] text-muted-foreground">
        {autoMatchedLogoId
          ? 'Auto-matched for this background. Tap any swatch to confirm or override.'
          : bgTone
            ? 'Variants are ranked by contrast against the background. ★ = recommended.'
            : 'Tap a variant to drop it into this logo zone.'}
      </p>
    </div>
  );
};
