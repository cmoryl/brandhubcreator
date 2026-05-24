/**
 * SimilaritySearchPanel — perceptual-hash powered duplicate & similarity finder.
 * Builds a 256-bit pHash per icon (rasterized 64→16 grid), then surfaces:
 *  1. Near-duplicates across the entire library (pairs above a threshold).
 *  2. Click-to-find similar matches for any selected icon.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { Sparkles, Loader2, Search, Layers, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import type { IconLibrary } from '@/hooks/useIconLibraries';
import type { BrandIconography } from '@/types/brand';
import { hashIcon, similarityFromHash, type IconHash } from '@/lib/iconStudio/perceptualHash';

interface Props {
  libraries: IconLibrary[];
}

interface IndexedIcon {
  libraryId: string;
  libraryName: string;
  icon: BrandIconography;
  hash: IconHash;
  key: string;
}

interface Pair {
  a: IndexedIcon;
  b: IndexedIcon;
  similarity: number;
}

const MAX_SCAN = 1500;

const IconChip = ({ entry, onClick, active }: { entry: IndexedIcon; onClick?: () => void; active?: boolean }) => (
  <button
    type="button"
    onClick={onClick}
    className={`group flex flex-col items-center gap-1 rounded-md border p-2 text-left transition-colors hover:border-foreground/40 ${
      active ? 'border-primary bg-primary/5' : 'border-border/60 bg-background'
    }`}
  >
    <div className="h-10 w-10 rounded bg-muted/40 flex items-center justify-center text-foreground">
      <svg viewBox={entry.icon.viewBox || '0 0 24 24'} className="h-7 w-7" aria-hidden>
        {entry.icon.svgPath?.trim().startsWith('<') ? (
          <g dangerouslySetInnerHTML={{ __html: entry.icon.svgPath }} />
        ) : (
          <path
            d={entry.icon.svgPath}
            fill={entry.icon.fillMode === 'stroke' ? 'none' : 'currentColor'}
            stroke={entry.icon.fillMode === 'stroke' ? 'currentColor' : 'none'}
            strokeWidth={1.75}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
      </svg>
    </div>
    <div className="w-full truncate text-[10px] font-medium">{entry.icon.name}</div>
    <div className="w-full truncate text-[9px] text-muted-foreground">{entry.libraryName}</div>
  </button>
);

export const SimilaritySearchPanel = ({ libraries }: Props) => {
  const [building, setBuilding] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [index, setIndex] = useState<IndexedIcon[]>([]);
  const [threshold, setThreshold] = useState(0.9); // duplicate threshold
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const abortRef = useRef(false);

  const flatIcons = useMemo(() => {
    const out: { libraryId: string; libraryName: string; icon: BrandIconography }[] = [];
    for (const lib of libraries) {
      for (const icon of lib.icons) {
        if (icon.svgPath) out.push({ libraryId: lib.id, libraryName: lib.name, icon });
        if (out.length >= MAX_SCAN) break;
      }
      if (out.length >= MAX_SCAN) break;
    }
    return out;
  }, [libraries]);

  const buildIndex = async () => {
    abortRef.current = false;
    setBuilding(true);
    setIndex([]);
    setProgress({ done: 0, total: flatIcons.length });
    const collected: IndexedIcon[] = [];
    for (let i = 0; i < flatIcons.length; i++) {
      if (abortRef.current) break;
      const { libraryId, libraryName, icon } = flatIcons[i];
      const key = `${libraryId}::${icon.id}`;
      const hash = await hashIcon(key, icon.svgPath, icon.viewBox, icon.fillMode);
      if (hash) collected.push({ libraryId, libraryName, icon, hash, key });
      if (i % 25 === 0) {
        setProgress({ done: i + 1, total: flatIcons.length });
        // yield to UI
        await new Promise((r) => setTimeout(r, 0));
      }
    }
    setProgress({ done: flatIcons.length, total: flatIcons.length });
    setIndex(collected);
    setBuilding(false);
  };

  useEffect(() => {
    return () => {
      abortRef.current = true;
    };
  }, []);

  // Duplicate pairs above threshold.
  const duplicatePairs = useMemo<Pair[]>(() => {
    if (index.length < 2) return [];
    const pairs: Pair[] = [];
    for (let i = 0; i < index.length; i++) {
      for (let j = i + 1; j < index.length; j++) {
        const sim = similarityFromHash(index[i].hash, index[j].hash);
        if (sim >= threshold) pairs.push({ a: index[i], b: index[j], similarity: sim });
      }
    }
    pairs.sort((p, q) => q.similarity - p.similarity);
    return pairs.slice(0, 50);
  }, [index, threshold]);

  const selected = useMemo(
    () => (selectedKey ? index.find((e) => e.key === selectedKey) ?? null : null),
    [index, selectedKey],
  );

  const similarToSelected = useMemo(() => {
    if (!selected) return [];
    return index
      .filter((e) => e.key !== selected.key)
      .map((e) => ({ entry: e, similarity: similarityFromHash(selected.hash, e.hash) }))
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 24);
  }, [selected, index]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return index.slice(0, 60);
    return index
      .filter((e) => e.icon.name.toLowerCase().includes(q) || e.libraryName.toLowerCase().includes(q))
      .slice(0, 60);
  }, [index, query]);

  return (
    <section className="tp-card p-5">
      <header className="flex flex-wrap items-end justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Similarity & Dedupe</span>
          </div>
          <h3 className="mt-1 text-base font-semibold">Perceptual similarity search</h3>
          <p className="text-[11px] text-muted-foreground max-w-xl">
            Builds a 256-bit perceptual hash per icon, then surfaces near-duplicates and
            "find similar" matches across all sets.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {index.length > 0 && (
            <Badge variant="outline" className="text-[10px]">
              {index.length.toLocaleString()} hashed
            </Badge>
          )}
          <Button size="sm" onClick={buildIndex} disabled={building || flatIcons.length === 0} className="gap-1.5">
            {building ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Layers className="h-3.5 w-3.5" />}
            {building
              ? `Hashing ${progress.done}/${progress.total}`
              : index.length === 0
                ? `Build index (${flatIcons.length})`
                : 'Rebuild index'}
          </Button>
        </div>
      </header>

      {index.length === 0 && !building && (
        <div className="py-8 text-center text-xs text-muted-foreground">
          Build the index to surface duplicates and similar icons.
        </div>
      )}

      {index.length > 0 && (
        <div className="space-y-6">
          {/* Duplicate threshold control */}
          <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_auto] md:items-end">
            <div>
              <div className="mb-2 flex items-center justify-between text-[11px] uppercase tracking-wider text-muted-foreground">
                <span>Duplicate threshold</span>
                <span className="tabular-nums text-foreground">{Math.round(threshold * 100)}% similar</span>
              </div>
              <Slider
                value={[threshold * 100]}
                min={70}
                max={100}
                step={1}
                onValueChange={([v]) => setThreshold(v / 100)}
              />
            </div>
            <Badge variant="secondary" className="justify-self-start text-[10px] md:justify-self-end">
              {duplicatePairs.length} pair{duplicatePairs.length === 1 ? '' : 's'} found
            </Badge>
          </div>

          {/* Duplicate pairs */}
          <div>
            <h4 className="mb-2 text-[11px] uppercase tracking-wider text-muted-foreground">
              Near-duplicates
            </h4>
            {duplicatePairs.length === 0 ? (
              <div className="rounded-md border border-dashed border-border/60 py-6 text-center text-xs text-muted-foreground">
                No pairs at ≥ {Math.round(threshold * 100)}% similarity.
              </div>
            ) : (
              <ul className="grid grid-cols-1 gap-2 md:grid-cols-2">
                {duplicatePairs.map((p, i) => (
                  <li
                    key={`${p.a.key}__${p.b.key}__${i}`}
                    className="flex items-center gap-2 rounded-md border border-border/60 bg-background p-2"
                  >
                    <IconChip entry={p.a} onClick={() => setSelectedKey(p.a.key)} />
                    <div className="flex-1 text-center text-[10px] text-muted-foreground">
                      <div className="tabular-nums text-foreground font-semibold">
                        {Math.round(p.similarity * 100)}%
                      </div>
                      <div>similar</div>
                    </div>
                    <IconChip entry={p.b} onClick={() => setSelectedKey(p.b.key)} />
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Find similar */}
          <div>
            <h4 className="mb-2 text-[11px] uppercase tracking-wider text-muted-foreground">
              Find similar to…
            </h4>
            <div className="relative mb-3">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search icons by name…"
                className="pl-8"
              />
            </div>

            <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 md:grid-cols-8">
              {filtered.map((e) => (
                <IconChip
                  key={e.key}
                  entry={e}
                  active={selectedKey === e.key}
                  onClick={() => setSelectedKey(e.key)}
                />
              ))}
            </div>

            {selected && (
              <div className="mt-4 rounded-md border border-border/60 bg-muted/20 p-3">
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs">
                    <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-muted-foreground">Most similar to</span>
                    <span className="font-semibold">{selected.icon.name}</span>
                    <Badge variant="outline" className="text-[10px]">{selected.libraryName}</Badge>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedKey(null)}>
                    Clear
                  </Button>
                </div>
                <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 md:grid-cols-8">
                  {similarToSelected.map(({ entry, similarity }) => (
                    <div key={entry.key} className="relative">
                      <IconChip entry={entry} onClick={() => setSelectedKey(entry.key)} />
                      <span className="absolute right-1 top-1 rounded bg-background/90 px-1 text-[9px] font-semibold tabular-nums shadow-sm">
                        {Math.round(similarity * 100)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
};
