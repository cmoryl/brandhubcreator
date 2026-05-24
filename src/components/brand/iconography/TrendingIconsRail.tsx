/**
 * Phase 6 — Trending Icons Rail.
 * "Brands like yours also chose…" — surfaces the most-added icons for the
 * brand's industry, as logged in `icon_usage_events`. One-click to add,
 * respects the same brand DNA + batch-add pipeline as SuggestedIconsRail.
 */
import { useEffect, useMemo, useState } from 'react';
import { TrendingUp, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { useTrendingIcons } from '@/lib/iconLibrary/usageTracking';
import { materializeAsBrandIconography, materializeDataUrl } from '@/lib/iconLibrary/loader';
import { restyleBundledIcon, applyBrandDnaToSvg, type BrandRestyleDNA } from '@/lib/iconLibrary/restyle';
import type { BrandIconography } from '@/types/brand';

interface TrendingIconsRailProps {
  sectionId: string;
  industry?: string | null;
  organizationId?: string | null;
  existingIcons?: BrandIconography[];
  onAdd: (icon: BrandIconography) => void;
  brandDna?: BrandRestyleDNA;
  limit?: number;
}

export const TrendingIconsRail = ({
  sectionId,
  industry,
  organizationId,
  existingIcons = [],
  onAdd,
  brandDna,
  limit = 12,
}: TrendingIconsRailProps) => {
  const { items, loading } = useTrendingIcons({
    industry,
    sectionId,
    limit,
    enabled: !!organizationId && !!industry,
  });

  const existingIds = useMemo(
    () => new Set(existingIcons.map((i) => i.id)),
    [existingIcons],
  );

  const handleAdd = async (pack: string, name: string) => {
    try {
      const brandIcon = (await materializeAsBrandIconography(pack, name, 'Other')) as BrandIconography;
      if (existingIds.has(brandIcon.id)) {
        toast.info('Already in your iconography');
        return;
      }
      if (brandDna) {
        try {
          const restyled = await restyleBundledIcon(pack, name, brandDna);
          if (!restyled.skipped) {
            brandIcon.svgPath = applyBrandDnaToSvg(restyled.svg, brandDna);
          }
        } catch { /* keep original */ }
      }
      onAdd(brandIcon);
      toast.success(`Added ${brandIcon.name}`);
    } catch {
      toast.error('Could not add icon');
    }
  };

  // Hide entirely until we have signal — avoids an empty rail in fresh orgs.
  if (!organizationId || !industry) return null;
  if (!loading && items.length === 0) return null;

  return (
    <section className="tp-card relative overflow-hidden p-4 sm:p-5">
      <div
        className="pointer-events-none absolute inset-0 opacity-30"
        style={{
          background:
            'radial-gradient(60% 100% at 100% 0%, hsl(var(--tp-orange) / 0.12), transparent 70%)',
        }}
        aria-hidden
      />
      <div className="relative mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold tracking-tight">
            Trending in {industry}
          </h3>
          <Badge variant="outline" className="text-[10px] uppercase tracking-wider">
            Brands like yours
          </Badge>
        </div>
        <span className="text-[10px] text-muted-foreground">
          Based on real usage across your organization
        </span>
      </div>

      <div className="relative grid grid-cols-6 sm:grid-cols-8 md:grid-cols-12 gap-2">
        {loading
          ? Array.from({ length: limit }).map((_, i) => (
              <div key={i} className="aspect-square rounded-md bg-muted/40 animate-pulse" />
            ))
          : items.map((t) => (
              <TrendingCell
                key={`${t.pack}/${t.icon_name}`}
                pack={t.pack}
                name={t.icon_name}
                uses={t.uses}
                added={existingIds.has(`${t.pack}/${t.icon_name}`)}
                onAdd={() => handleAdd(t.pack, t.icon_name)}
                brandDna={brandDna}
              />
            ))}
      </div>
    </section>
  );
};

interface CellProps {
  pack: string;
  name: string;
  uses: number;
  added: boolean;
  onAdd: () => void;
  brandDna?: BrandRestyleDNA;
}

const TrendingCell = ({ pack, name, uses, added, onAdd, brandDna }: CellProps) => {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    const promise = brandDna
      ? restyleBundledIcon(pack, name, brandDna).then((r) => r.dataUrl)
      : materializeDataUrl(pack, name);
    promise.then((u) => alive && setUrl(u)).catch(() => {});
    return () => { alive = false; };
  }, [pack, name, brandDna]);

  return (
    <button
      type="button"
      onClick={onAdd}
      disabled={added}
      title={`${name} · used ${uses}×`}
      className={`group relative flex aspect-square items-center justify-center rounded-md border transition ${
        added
          ? 'border-primary/40 bg-primary/5 cursor-default'
          : 'bg-muted/30 hover:bg-muted hover:border-primary/40'
      }`}
    >
      {url ? (
        <img
          src={url}
          alt={name}
          loading="lazy"
          className="h-6 w-6 object-contain"
          style={{ color: 'hsl(var(--foreground))' }}
        />
      ) : (
        <div className="h-5 w-5 rounded bg-current opacity-10" />
      )}
      <span className="pointer-events-none absolute bottom-0.5 right-0.5 rounded bg-background/80 px-1 text-[8px] tabular-nums text-muted-foreground">
        ×{uses}
      </span>
      {!added && (
        <span className="absolute -top-1 -right-1 hidden h-4 w-4 items-center justify-center rounded-full bg-primary text-primary-foreground group-hover:flex">
          <Plus className="h-2.5 w-2.5" />
        </span>
      )}
    </button>
  );
};

export default TrendingIconsRail;
