/**
 * ImportedIconsView — browse, search, filter, and preview icons from the
 * bundled library (~111k icons across 29 permissive packs). Per-pack indexes
 * are loaded lazily; SVGs are materialized on demand via data URLs.
 */
import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { Search, ImageIcon, ExternalLink, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useImportedIcons } from '@/hooks/useImportedIcons';
import { materializeDataUrl, materializeSvg } from '@/lib/iconLibrary/loader';
import type { IconIndexEntry } from '@/lib/iconLibrary/types';
import type { BrandIconography } from '@/types/brand';
import { IconDetailDialog } from '@/components/icon-studio/IconDetailDialog';
import { AddToLibraryMenu } from '@/components/icon-studio/AddToLibraryMenu';
import { useOrganization } from '@/contexts/OrganizationContext';

interface ResolvedRow {
  pack: string;
  packName: string;
  license: string;
  multicolor: boolean;
} 

const CATEGORY_LABELS: Record<string, string> = {
  all: 'All categories',
  ui: 'UI',
  arrows: 'Arrows',
  brands: 'Brands',
  social: 'Social',
  communication: 'Communication',
  health: 'Health',
  wellness: 'Wellness',
  food: 'Food',
  travel: 'Travel',
  finance: 'Finance',
  business: 'Business',
  ecommerce: 'E-commerce',
  education: 'Education',
  science: 'Science',
  nature: 'Nature',
  weather: 'Weather',
  transport: 'Transport',
  tech: 'Tech',
  devtools: 'Dev tools',
  media: 'Media',
  security: 'Security',
  gaming: 'Gaming',
  sports: 'Sports',
  files: 'Files',
  shapes: 'Shapes',
  emoji: 'Emoji',
  flags: 'Flags',
  crypto: 'Crypto',
  misc: 'Misc',
};

interface ImportedIconsViewProps {
  /** When set, opens this pack on mount (used when navigating from a bundled library card). */
  initialPackId?: string;
  onInitialPackConsumed?: () => void;
}

export const ImportedIconsView = ({ initialPackId, onInitialPackConsumed }: ImportedIconsViewProps = {}) => {
  const { organization } = useOrganization();
  const { packs, totalCount, loading } = useImportedIcons();
  const [selectedPack, setSelectedPack] = useState<string>(initialPackId ?? packs[0]?.id ?? 'ph');
  const [packIndex, setPackIndex] = useState<IconIndexEntry[]>([]);
  const [indexLoading, setIndexLoading] = useState(false);
  const [q, setQ] = useState('');
  const [category, setCategory] = useState<string>('all');
  const [selectedIcon, setSelectedIcon] = useState<BrandIconography | null>(null);

  // Honor initialPackId once it (and the packs list) become available.
  useEffect(() => {
    if (initialPackId && packs.some((p) => p.id === initialPackId)) {
      setSelectedPack(initialPackId);
      setCategory('all');
      setQ('');
      onInitialPackConsumed?.();
    }
  }, [initialPackId, packs, onInitialPackConsumed]);

  useEffect(() => {
    if (!selectedPack && packs.length) setSelectedPack(packs[0].id);
  }, [packs, selectedPack]);

  useEffect(() => {
    if (!selectedPack) return;
    setIndexLoading(true);
    import('@/lib/iconLibrary/loader')
      .then((m) => m.loadPackIndex(selectedPack))
      .then(setPackIndex)
      .catch(() => toast.error('Failed to load pack'))
      .finally(() => setIndexLoading(false));
  }, [selectedPack]);

  const currentPack = useMemo(() => packs.find((p) => p.id === selectedPack), [packs, selectedPack]);

  const categories = useMemo(() => {
    if (!currentPack) return ['all'];
    return ['all', ...Object.keys(currentPack.categories).sort()];
  }, [currentPack]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return packIndex.filter((e) => {
      if (category !== 'all' && e.c !== category) return false;
      if (!term) return true;
      if (e.n.includes(term)) return true;
      return e.t.some((t) => t.includes(term));
    });
  }, [packIndex, q, category]);

  // Virtualized grid: compute row count from columns
  const parentRef = useRef<HTMLDivElement>(null);
  const COLS = 8;
  const ROW_HEIGHT = 92;
  const rowCount = Math.ceil(filtered.length / COLS);

  const rowVirtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 4,
  });

  // Open the same workspace dialog used for generated icons.
  // Materializes the SVG on demand and converts it into a BrandIconography
  // object the dialog/exporters already understand.
  const openDetail = useCallback(async (pack: string, name: string, category: string) => {
    try {
      const svg = await materializeSvg(pack, name);
      // Extract viewBox if present, otherwise default to 24x24.
      const vbMatch = svg.match(/viewBox\s*=\s*"([^"]+)"/i);
      const viewBox = vbMatch?.[1] ?? '0 0 24 24';
      // Detect stroke-style markup; default to fill otherwise.
      const lower = svg.toLowerCase();
      const looksStroke = /stroke\s*=\s*"(?!none)/i.test(svg) && lower.includes('fill="none"');
      const fillMode: 'stroke' | 'fill' = looksStroke ? 'stroke' : 'fill';
      setSelectedIcon({
        id: `bundled:${pack}/${name}`,
        name,
        svgPath: svg, // full <svg> string — supported by IconSvgRender/buildSvgString
        category: category || 'misc',
        viewBox,
        fillMode,
      });
    } catch {
      toast.error('Failed to open icon');
    }
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="tp-card relative overflow-hidden p-6">
        <div
          className="absolute inset-0 opacity-40"
          style={{
            background:
              'radial-gradient(50% 80% at 0% 0%, hsl(var(--tp-light-blue) / 0.18), transparent 70%)',
          }}
          aria-hidden
        />
        <div className="relative flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              <ImageIcon className="h-3.5 w-3.5" />
              <span>Bundled icon library</span>
            </div>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">Icon Library</h1>
            <p className="text-sm text-muted-foreground">
              {totalCount.toLocaleString()} icons across {packs.length} world-class
              permissive packs. Searchable, downloadable, ready to style.
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Badge variant="outline" className="text-[10px] uppercase tracking-wider">
              {totalCount.toLocaleString()} icons
            </Badge>
            <Link to="/icon-studio/attributions" className="text-[11px] text-muted-foreground hover:underline inline-flex items-center gap-1">
              <ExternalLink className="h-3 w-3" /> Licenses & attributions
            </Link>
          </div>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
        {/* Pack rail */}
        <aside className="space-y-1 max-h-[78vh] overflow-y-auto pr-2">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2 px-2">Packs</div>
          {packs.map((p) => (
            <button
              key={p.id}
              onClick={() => {
                setSelectedPack(p.id);
                setCategory('all');
                setQ('');
              }}
              className={`w-full flex items-center justify-between rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted/50 transition ${
                selectedPack === p.id ? 'bg-muted font-medium' : ''
              }`}
            >
              <span className="truncate">{p.name}</span>
              <span className="text-[10px] text-muted-foreground tabular-nums">{p.count.toLocaleString()}</span>
            </button>
          ))}
        </aside>

        {/* Main */}
        <div className="space-y-4 min-w-0">
          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[240px] max-w-md">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={`Search ${currentPack?.name ?? ''}…`}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="pl-9 h-9"
              />
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {categories.slice(0, 12).map((c) => (
                <Button
                  key={c}
                  size="sm"
                  variant={category === c ? 'default' : 'outline'}
                  className="h-7 text-[11px]"
                  onClick={() => setCategory(c)}
                >
                  {CATEGORY_LABELS[c] ?? c}
                  {currentPack && c !== 'all' && (
                    <span className="ml-1 opacity-60">{currentPack.categories[c]}</span>
                  )}
                </Button>
              ))}
            </div>
          </div>

          {currentPack && (
            <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
              <Badge variant="outline" className="text-[10px]">{currentPack.license}</Badge>
              <span>by {currentPack.author}</span>
              <span>·</span>
              <span>{filtered.length.toLocaleString()} matching</span>
            </div>
          )}

          {/* Grid */}
          {loading || indexLoading ? (
            <div className="tp-card flex flex-col items-center justify-center py-16 text-muted-foreground">
              Loading…
            </div>
          ) : filtered.length === 0 ? (
            <div className="tp-card py-16 text-center text-sm text-muted-foreground">
              No icons match your search.
            </div>
          ) : (
            <div ref={parentRef} className="tp-card overflow-y-auto" style={{ height: '70vh' }}>
              <div style={{ height: rowVirtualizer.getTotalSize(), position: 'relative', width: '100%' }}>
                {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                  const startIdx = virtualRow.index * COLS;
                  const rowIcons = filtered.slice(startIdx, startIdx + COLS);
                  return (
                    <div
                      key={virtualRow.key}
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: ROW_HEIGHT,
                        transform: `translateY(${virtualRow.start}px)`,
                      }}
                      className="grid gap-2 p-2"
                      // eslint-disable-next-line react/forbid-dom-props
                    >
                      <div className="grid grid-cols-8 gap-2 px-2">
                        {rowIcons.map((e) => (
                          <IconCell
                            key={e.n}
                            pack={selectedPack}
                            name={e.n}
                            onOpen={() => openDetail(selectedPack, e.n, e.c)}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Workspace dialog — same as generated icons, with an extra
          "Add to library" action so imported icons can flow into brand sections. */}
      <IconDetailDialog
        icon={selectedIcon}
        onClose={() => setSelectedIcon(null)}
        presentation="auto"
        hideReviewActions
        extraActions={
          <AddToLibraryMenu
            icon={selectedIcon}
            organizationId={organization?.id}
            label="Add to brand section"
          />
        }
      />
    </div>
  );
};

interface CellProps {
  pack: string;
  name: string;
  onOpen: () => void;
}

const IconCell = ({ pack, name, onOpen }: CellProps) => {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    materializeDataUrl(pack, name).then((u) => {
      if (active) setUrl(u);
    }).catch(() => {});
    return () => { active = false; };
  }, [pack, name]);

  return (
    <button
      type="button"
      className="group relative flex aspect-square items-center justify-center rounded-md border bg-muted/30 hover:bg-muted hover:border-primary/40 transition cursor-pointer"
      title={`Open ${name}`}
      onClick={onOpen}
    >
      {url ? (
        <img src={url} alt={name} loading="lazy" className="h-7 w-7 object-contain" style={{ color: 'hsl(var(--foreground))' }} />
      ) : (
        <div className="h-6 w-6 rounded bg-current opacity-10" />
      )}
      <div className="absolute inset-x-0 -bottom-5 truncate text-center text-[9px] text-muted-foreground opacity-0 group-hover:opacity-100">
        {name}
      </div>
    </button>
  );
};
