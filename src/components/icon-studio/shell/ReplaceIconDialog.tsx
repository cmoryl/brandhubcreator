/**
 * ReplaceIconDialog — search the bundled icon library and pick a replacement
 * for an existing icon in a saved set. Returns a BrandIconography object via
 * the onPick callback.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { Search, X, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useImportedIcons } from '@/hooks/useImportedIcons';
import { materializeAsBrandIconography, materializeDataUrl } from '@/lib/iconLibrary/loader';
import type { BrandIconography } from '@/types/brand';
import { logger } from '@/lib/logger';
import { safeUUID } from '@/lib/safeUUID';

interface Props {
  open: boolean;
  onClose: () => void;
  /** Name/category of the icon being replaced — used to pre-seed the search. */
  seedQuery?: string;
  /** Brand accent for tinting result tiles. */
  accent?: string;
  /** Called with a freshly built BrandIconography record when the user picks. */
  onPick: (icon: BrandIconography) => void | Promise<void>;
}

interface Hit {
  packId: string;
  name: string;
  category: string;
}

const PAGE = 60;

export const ReplaceIconDialog = ({
  open,
  onClose,
  seedQuery = '',
  accent = 'hsl(var(--tp-digital-blue))',
  onPick,
}: Props) => {
  const { packs, getPackIndex, loading: manifestLoading } = useImportedIcons();
  const [q, setQ] = useState(seedQuery);
  const [searching, setSearching] = useState(false);
  const [hits, setHits] = useState<Hit[]>([]);
  const [shown, setShown] = useState(PAGE);
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [thumbs, setThumbs] = useState<Record<string, string>>({});
  const seqRef = useRef(0);

  // Reset on open / seed change
  useEffect(() => {
    if (!open) return;
    setQ(seedQuery);
    setShown(PAGE);
  }, [open, seedQuery]);

  // Run search whenever q or pack list changes
  useEffect(() => {
    if (!open || packs.length === 0) return;
    const term = q.trim().toLowerCase();
    const mySeq = ++seqRef.current;
    setSearching(true);
    setShown(PAGE);

    (async () => {
      try {
        const results: Hit[] = [];
        const PER_PACK_CAP = 200;
        for (const pack of packs) {
          try {
            const idx = await getPackIndex(pack.id);
            let count = 0;
            for (const e of idx) {
              if (mySeq !== seqRef.current) return;
              if (!term || e.n.toLowerCase().includes(term) || e.c.toLowerCase().includes(term)) {
                results.push({ packId: pack.id, name: e.n, category: e.c });
                count++;
                if (count >= PER_PACK_CAP) break;
              }
              if (results.length >= 1200) break;
            }
            if (results.length >= 1200) break;
          } catch (err) {
            logger.debug('[ReplaceIconDialog] pack index load failed', pack.id, err);
          }
        }
        if (mySeq === seqRef.current) setHits(results);
      } finally {
        if (mySeq === seqRef.current) setSearching(false);
      }
    })();
  }, [open, q, packs, getPackIndex]);

  const visible = useMemo(() => hits.slice(0, shown), [hits, shown]);

  // Lazy thumb materialization for visible hits
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      for (const h of visible) {
        const key = `${h.packId}/${h.name}`;
        if (thumbs[key]) continue;
        try {
          const url = await materializeDataUrl(h.packId, h.name);
          if (cancelled) return;
          setThumbs((prev) => (prev[key] ? prev : { ...prev, [key]: url }));
        } catch {
          /* ignore individual failures */
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [visible, open, thumbs]);

  const handlePick = async (h: Hit) => {
    const key = `${h.packId}/${h.name}`;
    setSubmitting(key);
    try {
      const raw = await materializeAsBrandIconography(h.packId, h.name, h.category);
      const built: BrandIconography = {
        ...raw,
        id: safeUUID(),
        name: raw.name,
        category: raw.category,
        svgPath: raw.svgPath,
        viewBox: raw.viewBox,
        fillMode: raw.fillMode,
      } as BrandIconography;
      await onPick(built);
      onClose();
    } catch (err) {
      logger.debug('[ReplaceIconDialog] pick failed', err);
    } finally {
      setSubmitting(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-4xl max-h-[88vh] overflow-hidden p-0 flex flex-col">
        <DialogHeader className="p-6 pb-3 border-b border-border/60">
          <DialogTitle>Find a replacement icon</DialogTitle>
          <DialogDescription>
            Search across the bundled icon library and pick a replacement. The new
            icon takes the same slot as the one you rejected.
          </DialogDescription>
          <div className="relative mt-3">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by name or category…"
              className="pl-9 pr-9 h-10"
            />
            {q && (
              <button
                type="button"
                onClick={() => setQ('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:bg-muted"
                aria-label="Clear search"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <div className="flex items-center justify-between text-[11px] text-muted-foreground mt-1">
            <span>
              {manifestLoading || searching ? (
                <span className="inline-flex items-center gap-1">
                  <Loader2 className="h-3 w-3 animate-spin" /> Searching…
                </span>
              ) : (
                <>{hits.length.toLocaleString()} matching icons</>
              )}
            </span>
            <span className="tabular-nums">{packs.length} packs</span>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6">
          {visible.length === 0 && !searching ? (
            <div className="text-center text-sm text-muted-foreground py-12">
              No icons match your search.
            </div>
          ) : (
            <>
              <div
                className="grid gap-2"
                style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(96px, 1fr))' }}
              >
                {visible.map((h) => {
                  const key = `${h.packId}/${h.name}`;
                  const url = thumbs[key];
                  const isSubmitting = submitting === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      disabled={!!submitting}
                      onClick={() => handlePick(h)}
                      title={`${h.name} · ${h.packId}`}
                      className="group flex flex-col items-center gap-1.5 rounded-lg border bg-card p-2 transition-all hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
                      style={{ borderColor: `color-mix(in oklab, ${accent} 18%, hsl(var(--border)))` }}
                    >
                      <div
                        className="flex h-14 w-14 items-center justify-center rounded-md"
                        style={{ background: `color-mix(in oklab, ${accent} 8%, transparent)` }}
                      >
                        {isSubmitting ? (
                          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                        ) : url ? (
                          <img src={url} alt={h.name} className="h-8 w-8 object-contain" />
                        ) : (
                          <div className="h-8 w-8 rounded bg-muted/50 animate-pulse" />
                        )}
                      </div>
                      <span className="text-[10px] text-muted-foreground truncate max-w-[88px] capitalize">
                        {h.name.replace(/-/g, ' ')}
                      </span>
                    </button>
                  );
                })}
              </div>
              {shown < hits.length && (
                <div className="flex justify-center pt-6">
                  <Button variant="outline" size="sm" onClick={() => setShown((s) => s + PAGE)}>
                    Show more ({(hits.length - shown).toLocaleString()} remaining)
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
