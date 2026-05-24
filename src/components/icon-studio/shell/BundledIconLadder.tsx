/**
 * BundledIconLadder — renders a row of real bundled-library icons restyled
 * through a Style System recipe. Replaces the emoji-driven `IconSetPreview`
 * tiles in StyleSystemsView so users see authentic results.
 *
 * Resolution per slug uses `resolveBundledForStyle`. Results are restyled via
 * `restyleBundledIcon` (which caches in-memory + localStorage) and rendered
 * as <img> tiles for cheap virtualization-friendly painting.
 */

import { useEffect, useMemo, useState } from 'react';
import type { BaseStyle } from './studioData';
import {
  BASE_SAMPLE_SLUGS,
  getStyleSource,
  styleRecipeToDna,
} from './styleRecipeToDna';
import { loadPackIndex } from '@/lib/iconLibrary/loader';
import { restyleBundledIcon } from '@/lib/iconLibrary/restyle';
import type { IconIndexEntry } from '@/lib/iconLibrary/types';
import { cn } from '@/lib/utils';

/**
 * Resolve any CSS color expression (including `hsl(var(--token))`) to a
 * concrete color string. CSS variables don't resolve inside SVG data-URLs
 * used as <img> sources, so we must bake real colors into the SVG before
 * serialization — otherwise stroke-based icons render invisible (default
 * stroke is `none`) and fill-based icons fall back to default black.
 */
function resolveCssColor(input: string): string {
  if (typeof window === 'undefined' || !input) return input;
  if (!input.includes('var(')) return input;
  try {
    const probe = document.createElement('span');
    probe.style.color = input;
    probe.style.display = 'none';
    document.body.appendChild(probe);
    const computed = getComputedStyle(probe).color;
    document.body.removeChild(probe);
    return computed && computed !== '' ? computed : input;
  } catch {
    return input;
  }
}

interface Props {
  style: BaseStyle;
  accent: string;
  /** Override the source pack (e.g. detail dialog pack picker). */
  pack?: string;
  /** Override slugs (used by detail dialog when a category is picked). */
  slugs?: readonly string[];
  /** Icons to show. Defaults to 6. */
  count?: number;
  /** Tile pixel size. */
  tile?: number;
  className?: string;
}

interface ResolvedIcon {
  pack: string;
  name: string;
  dataUrl: string | null;
}

// Session-level cache: `${styleId}|${packKey}|${slug}` → {pack,name}
const resolutionCache = new Map<string, { pack: string; name: string } | null>();
// Per-pack indexes are cached at the loader layer, but we also memoize the
// promise here so a grid of 36 tiles only triggers one fetch per pack.
const indexPromises = new Map<string, Promise<IconIndexEntry[]>>();

function getIndex(packId: string) {
  let p = indexPromises.get(packId);
  if (!p) {
    p = loadPackIndex(packId).catch(() => [] as IconIndexEntry[]);
    indexPromises.set(packId, p);
  }
  return p;
}

/**
 * Best-effort name resolver. Walks preferred packs in order; for each, tries
 * exact slug, then `slug-variant` for each preferred variant, then any name
 * starting with `slug`. Returns null when nothing matches.
 */
async function resolveOne(
  packs: string[],
  variants: string[],
  slug: string,
): Promise<{ pack: string; name: string } | null> {
  for (const packId of packs) {
    const idx = await getIndex(packId);
    if (!idx.length) continue;

    // exact match
    const exact = idx.find((e) => e.n === slug);
    if (exact) return { pack: packId, name: exact.n };

    // slug + preferred variant suffix (e.g. "home-duotone")
    for (const v of variants) {
      const hit = idx.find((e) => e.n === `${slug}-${v}` || e.n === `${slug}_${v}`);
      if (hit) return { pack: packId, name: hit.n };
    }

    // partial: any name that starts with slug (covers "home-line", "home-2", …)
    const partial = idx.find((e) => e.n.startsWith(`${slug}-`) || e.n.startsWith(`${slug}_`));
    if (partial) return { pack: packId, name: partial.n };
  }
  // Last resort: first icon in the first available pack so the tile is never blank.
  for (const packId of packs) {
    const idx = await getIndex(packId);
    if (idx.length) return { pack: packId, name: idx[0].n };
  }
  return null;
}

export function BundledIconLadder({
  style,
  accent,
  pack,
  slugs,
  count = 6,
  tile = 40,
  className,
}: Props) {
  const source = useMemo(() => getStyleSource(style), [style]);
  const effectivePacks = useMemo(
    () => (pack ? [pack, ...source.packs.filter((p) => p !== pack)] : source.packs),
    [pack, source.packs],
  );
  const effectiveSlugs = useMemo(
    () => (slugs ?? BASE_SAMPLE_SLUGS).slice(0, count),
    [slugs, count],
  );
  const dna = useMemo(() => styleRecipeToDna(style, accent), [style, accent]);

  const [resolved, setResolved] = useState<ResolvedIcon[]>(() =>
    effectiveSlugs.map(() => ({ pack: '', name: '', dataUrl: null })),
  );

  // Resolve names → restyled data URLs. Re-runs when any input changes.
  useEffect(() => {
    let cancelled = false;
    const packKey = effectivePacks.join(',');
    (async () => {
      const next: ResolvedIcon[] = [];
      for (const slug of effectiveSlugs) {
        const cacheKey = `${style.id}|${packKey}|${slug}`;
        let resolution = resolutionCache.get(cacheKey);
        if (resolution === undefined) {
          resolution = await resolveOne(effectivePacks, source.variants, slug);
          resolutionCache.set(cacheKey, resolution);
        }
        if (!resolution) {
          next.push({ pack: '', name: slug, dataUrl: null });
          continue;
        }
        try {
          const r = await restyleBundledIcon(resolution.pack, resolution.name, dna);
          next.push({ pack: resolution.pack, name: resolution.name, dataUrl: r.dataUrl });
        } catch {
          next.push({ pack: resolution.pack, name: resolution.name, dataUrl: null });
        }
        if (cancelled) return;
      }
      if (!cancelled) setResolved(next);
    })();
    return () => {
      cancelled = true;
    };
  }, [style.id, effectivePacks, effectiveSlugs, source.variants, dna]);

  return (
    <div
      className={cn(
        'grid gap-2 rounded-lg border border-border/50 bg-card/40 p-3',
        className,
      )}
      style={{ gridTemplateColumns: `repeat(${effectiveSlugs.length}, minmax(0, 1fr))` }}
    >
      {resolved.map((r, i) => (
        <div
          key={`${effectiveSlugs[i]}-${i}`}
          className="flex aspect-square items-center justify-center rounded-md bg-background/60 border border-border/40"
          title={r.name ? `${r.name}${r.pack ? ` · ${r.pack}` : ''}` : effectiveSlugs[i]}
        >
          {r.dataUrl ? (
            <img
              src={r.dataUrl}
              alt={r.name || effectiveSlugs[i]}
              loading="lazy"
              style={{ width: tile, height: tile, color: accent }}
              className="object-contain"
            />
          ) : (
            <div
              className="rounded bg-current opacity-10"
              style={{ width: Math.round(tile * 0.7), height: Math.round(tile * 0.7) }}
            />
          )}
        </div>
      ))}
    </div>
  );
}
