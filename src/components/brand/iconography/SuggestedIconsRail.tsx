/**
 * SuggestedIconsRail — Phase 2 surface.
 * Shows curated bundled-library icons tailored to (section, brand industry).
 * Click an icon to add it to the brand's iconography list.
 */
import { useEffect, useMemo, useState } from 'react';
import { Sparkles, Plus, RefreshCw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { getSuggestedIcons, type SuggestedIcon } from '@/lib/iconLibrary/suggestions';
import { materializeAsBrandIconography, materializeDataUrl } from '@/lib/iconLibrary/loader';
import type { BrandIconography } from '@/types/brand';

interface SuggestedIconsRailProps {
  sectionId: string;
  industry?: string | null;
  existingIcons?: BrandIconography[];
  onAdd: (icon: BrandIconography) => void;
  limit?: number;
}

export const SuggestedIconsRail = ({
  sectionId,
  industry,
  existingIcons = [],
  onAdd,
  limit = 24,
}: SuggestedIconsRailProps) => {
  const [items, setItems] = useState<SuggestedIcon[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    getSuggestedIcons({ sectionId, industry, limit: limit * 2 })
      .then((res) => {
        if (!alive) return;
        // Shuffle slightly for variety on refresh.
        const shuffled = refreshKey === 0 ? res : [...res].sort(() => Math.random() - 0.5);
        setItems(shuffled.slice(0, limit));
      })
      .catch(() => alive && setItems([]))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [sectionId, industry, limit, refreshKey]);

  const existingIds = useMemo(
    () => new Set(existingIcons.map((i) => i.id)),
    [existingIcons],
  );

  const handleAdd = async (s: SuggestedIcon) => {
    try {
      const brandIcon = await materializeAsBrandIconography(s.pack, s.name, s.category);
      if (existingIds.has(brandIcon.id)) {
        toast.info('Already in your iconography');
        return;
      }
      onAdd(brandIcon as BrandIconography);
      toast.success(`Added ${brandIcon.name}`);
    } catch {
      toast.error('Could not add icon');
    }
  };

  if (!loading && items.length === 0) return null;

  return (
    <section className="tp-card relative overflow-hidden p-4 sm:p-5">
      <div
        className="pointer-events-none absolute inset-0 opacity-30"
        style={{
          background:
            'radial-gradient(60% 100% at 0% 0%, hsl(var(--tp-light-blue) / 0.15), transparent 70%)',
        }}
        aria-hidden
      />
      <div className="relative flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold tracking-tight">Suggested for this brand</h3>
          {industry && (
            <Badge variant="outline" className="text-[10px] uppercase tracking-wider">
              {industry}
            </Badge>
          )}
        </div>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 text-[11px]"
          onClick={() => setRefreshKey((k) => k + 1)}
          disabled={loading}
        >
          <RefreshCw className={`h-3 w-3 mr-1 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="relative grid grid-cols-6 sm:grid-cols-8 md:grid-cols-12 gap-2">
        {loading
          ? Array.from({ length: limit }).map((_, i) => (
              <div key={i} className="aspect-square rounded-md bg-muted/40 animate-pulse" />
            ))
          : items.map((s) => (
              <SuggestedCell
                key={`${s.pack}/${s.name}`}
                icon={s}
                added={existingIds.has(`${s.pack}/${s.name}`)}
                onAdd={() => handleAdd(s)}
              />
            ))}
      </div>
    </section>
  );
};

interface CellProps {
  icon: SuggestedIcon;
  added: boolean;
  onAdd: () => void;
}

const SuggestedCell = ({ icon, added, onAdd }: CellProps) => {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    materializeDataUrl(icon.pack, icon.name)
      .then((u) => alive && setUrl(u))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [icon.pack, icon.name]);

  return (
    <button
      type="button"
      onClick={onAdd}
      title={`${icon.name} · ${icon.packName}`}
      className={`group relative flex aspect-square items-center justify-center rounded-md border transition ${
        added
          ? 'border-primary/40 bg-primary/5 cursor-default'
          : 'bg-muted/30 hover:bg-muted hover:border-primary/40'
      }`}
      disabled={added}
    >
      {url ? (
        <img
          src={url}
          alt={icon.name}
          loading="lazy"
          className="h-6 w-6 object-contain"
          style={{ color: 'hsl(var(--foreground))' }}
        />
      ) : (
        <div className="h-5 w-5 rounded bg-current opacity-10" />
      )}
      {!added && (
        <span className="absolute -top-1 -right-1 hidden h-4 w-4 items-center justify-center rounded-full bg-primary text-primary-foreground group-hover:flex">
          <Plus className="h-2.5 w-2.5" />
        </span>
      )}
    </button>
  );
};

export default SuggestedIconsRail;
