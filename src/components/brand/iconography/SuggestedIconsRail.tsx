/**
 * SuggestedIconsRail — Phase 2 surface.
 * Shows curated bundled-library icons tailored to (section, brand industry).
 * Click an icon to add it to the brand's iconography list.
 */
import { useEffect, useMemo, useState } from 'react';
import { Sparkles, Plus, RefreshCw, Wand2, Search, X, Package as PackageIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useSemanticIconSearch } from '@/lib/iconLibrary/semanticSearch';
import { toast } from 'sonner';
import { getSuggestedIcons, type SuggestedIcon } from '@/lib/iconLibrary/suggestions';
import { materializeAsBrandIconography, materializeDataUrl } from '@/lib/iconLibrary/loader';
import { restyleBundledIcon, applyBrandDnaToSvg, type BrandRestyleDNA } from '@/lib/iconLibrary/restyle';
import { kitsForSection, resolveKit } from '@/lib/iconLibrary/kits';
import type { BrandIconography } from '@/types/brand';

interface SuggestedIconsRailProps {
  sectionId: string;
  industry?: string | null;
  existingIcons?: BrandIconography[];
  onAdd: (icon: BrandIconography) => void;
  /** Optional batch handler. When provided, kits add all icons in a single state update. */
  onAddBatch?: (icons: BrandIconography[]) => void;
  limit?: number;
  /** Phase 4: optional brand DNA — when present, previews are auto-restyled. */
  brandDna?: BrandRestyleDNA;
}

export const SuggestedIconsRail = ({
  sectionId,
  industry,
  existingIcons = [],
  onAdd,
  onAddBatch,
  limit = 24,
  brandDna,
}: SuggestedIconsRailProps) => {
  const [items, setItems] = useState<SuggestedIcon[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [restyleOn, setRestyleOn] = useState<boolean>(!!brandDna);
  // Phase 3 — AI semantic search state
  const [aiQuery, setAiQuery] = useState('');
  const ai = useSemanticIconSearch();
  const aiActive = ai.hits.length > 0 || !!ai.error;
  const aiExpansion = ai.expansion;
  const displayItems = aiActive
    ? ai.hits.map((h) => ({
        pack: h.pack,
        packName: h.packName,
        name: h.name,
        category: h.category,
        tags: h.tags,
        license: h.license,
      }))
    : items;

  useEffect(() => {
    let alive = true;
    setLoading(true);
    getSuggestedIcons({ sectionId, industry, limit: limit * 2 })
      .then((res) => {
        if (!alive) return;
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
      if (brandDna && restyleOn) {
        try {
          const restyled = await restyleBundledIcon(s.pack, s.name, brandDna);
          if (!restyled.skipped) {
            (brandIcon as BrandIconography).svgPath = applyBrandDnaToSvg(restyled.svg, brandDna);
          }
        } catch { /* fall back to original */ }
      }
      onAdd(brandIcon as BrandIconography);
      toast.success(`Added ${brandIcon.name}${brandDna && restyleOn ? ' (brand DNA applied)' : ''}`);
    } catch {
      toast.error('Could not add icon');
    }
  };

  // Phase 5 — populate a curated kit in one click.
  const availableKits = useMemo(() => kitsForSection(sectionId), [sectionId]);
  const [kitLoadingId, setKitLoadingId] = useState<string | null>(null);

  const handlePopulateKit = async (kitId: string) => {
    const kit = availableKits.find((k) => k.id === kitId);
    if (!kit) return;
    setKitLoadingId(kitId);
    try {
      const dna = brandDna && restyleOn ? brandDna : undefined;
      const resolved = await resolveKit(kit, dna);
      const fresh = resolved.filter((ic) => !existingIds.has(ic.id));
      if (fresh.length === 0) {
        toast.info(`All ${kit.name} icons are already added`);
        return;
      }
      if (onAddBatch) {
        onAddBatch(fresh);
      } else {
        fresh.forEach((ic) => onAdd(ic));
      }
      toast.success(`Added ${fresh.length} icons from ${kit.name}${dna ? ' · brand DNA applied' : ''}`);
    } catch {
      toast.error('Could not populate kit');
    } finally {
      setKitLoadingId(null);
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
      <div className="relative flex flex-wrap items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold tracking-tight">
            {aiActive ? 'AI search results' : 'Suggested for this brand'}
          </h3>
          {industry && !aiActive && (
            <Badge variant="outline" className="text-[10px] uppercase tracking-wider">
              {industry}
            </Badge>
          )}
          {aiActive && aiExpansion?.reasoning && (
            <span className="text-[10px] text-muted-foreground italic max-w-[260px] truncate">
              {aiExpansion.reasoning}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (aiQuery.trim().length < 2) return;
              ai.search({ query: aiQuery, industry, sectionId }).catch(() => {});
            }}
            className="relative"
          >
            <Search className="absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={aiQuery}
              onChange={(e) => setAiQuery(e.target.value)}
              placeholder="AI search: e.g. 'momentum'"
              className="h-7 pl-7 pr-7 text-[11px] w-[180px] md:w-[220px]"
            />
            {aiQuery && (
              <button
                type="button"
                onClick={() => { setAiQuery(''); ai.reset(); }}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label="Clear"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </form>
          {availableKits.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-[11px]"
                  disabled={!!kitLoadingId}
                  title="Populate a curated kit in one click"
                >
                  <PackageIcon className={`h-3 w-3 mr-1 ${kitLoadingId ? 'animate-pulse' : ''}`} />
                  {kitLoadingId ? 'Adding…' : 'Populate kit'}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuLabel>One-click icon kits</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {availableKits.map((kit) => (
                  <DropdownMenuItem
                    key={kit.id}
                    onClick={() => handlePopulateKit(kit.id)}
                    className="flex flex-col items-start gap-0.5 py-2"
                  >
                    <div className="flex w-full items-center justify-between gap-2">
                      <span className="text-xs font-medium">{kit.name}</span>
                      <span className="text-[10px] text-muted-foreground">{kit.items.length}</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground leading-tight">
                      {kit.description}
                    </span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          {brandDna && (
            <Button
              size="sm"
              variant={restyleOn ? 'default' : 'outline'}
              className="h-7 text-[11px]"
              onClick={() => setRestyleOn((v) => !v)}
              title="Restyle previews to match this brand's DNA"
            >
              <Wand2 className="h-3 w-3 mr-1" />
              Brand DNA
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            className="h-7 text-[11px]"
            onClick={() => setRefreshKey((k) => k + 1)}
            disabled={loading || ai.loading}
          >
            <RefreshCw className={`h-3 w-3 mr-1 ${(loading || ai.loading) ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      <div className="relative grid grid-cols-6 sm:grid-cols-8 md:grid-cols-12 gap-2">
        {(loading || ai.loading)
          ? Array.from({ length: limit }).map((_, i) => (
              <div key={i} className="aspect-square rounded-md bg-muted/40 animate-pulse" />
            ))
          : displayItems.length === 0
          ? (
            <div className="col-span-full py-8 text-center text-xs text-muted-foreground">
              {aiActive ? 'No matches. Try a different phrase.' : 'No suggestions yet.'}
            </div>
          )
          : displayItems.map((s) => (
              <SuggestedCell
                key={`${s.pack}/${s.name}`}
                icon={s}
                added={existingIds.has(`${s.pack}/${s.name}`)}
                onAdd={() => handleAdd(s)}
                brandDna={brandDna && restyleOn ? brandDna : undefined}
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
  brandDna?: BrandRestyleDNA;
}

const SuggestedCell = ({ icon, added, onAdd, brandDna }: CellProps) => {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    const promise = brandDna
      ? restyleBundledIcon(icon.pack, icon.name, brandDna).then((r) => r.dataUrl)
      : materializeDataUrl(icon.pack, icon.name);
    promise.then((u) => alive && setUrl(u)).catch(() => {});
    return () => {
      alive = false;
    };
  }, [icon.pack, icon.name, brandDna]);

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
