/**
 * IconSetDetailDialog — large preview of a generated icon set / library.
 * Renders the actual stored SVG icons at multiple sizes with the chosen
 * brand accent applied.
 */

import { useMemo, useState } from 'react';
import { Wand2, RefreshCw, Lock, Copy, Download, Sun, Moon, Sparkles, Search } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { StatusChip } from './StatusChip';
import { IconSetPreview } from './IconSetPreview';
import { IconDetailDialog } from '@/components/icon-studio/IconDetailDialog';
import { IconSvgRender } from '@/components/icon-studio/IconSvgRender';
import { RemixSystemDialog } from '@/components/icon-studio/RemixSystemDialog';
import { ReplaceIconDialog } from './ReplaceIconDialog';
import { exportIconSystem } from '@/lib/iconStudio/exportSystem';
import { readRecipe, type IconRecipe } from '@/lib/iconStudio/recipe';
import type { BrandIconography } from '@/types/brand';
import type { IconLibrary } from '@/hooks/useIconLibraries';
import { toast } from 'sonner';

interface Props {
  library: IconLibrary | null;
  accent: string;
  levelLabel: string;
  onClose: () => void;
  onDuplicate?: () => void;
  onRemix?: () => void;
  onRegenerate?: () => void;
  onCompare?: () => void;
  onLockToggle?: () => void;
  onEnrich?: () => void;
  /** Persist a new icons array for the open library (reject / replace flows). */
  onMutateIcons?: (nextIcons: BrandIconography[]) => Promise<void> | void;
}

const SIZE_LADDER: { label: string; tile: number; icon: number; columns: number }[] = [
  { label: '20 px', tile: 28, icon: 14, columns: 14 },
  { label: '32 px', tile: 44, icon: 22, columns: 10 },
  { label: '48 px', tile: 64, icon: 32, columns: 8 },
  { label: '64 px', tile: 88, icon: 44, columns: 6 },
];

const FALLBACK_EMOJIS = ['⚙️', '📊', '🔐', '🔌', '⚡', '🧩', '🌐', '📡', '🔔', '✨', '🧠', '🪄'];

export const IconSetDetailDialog = ({
  library,
  accent,
  levelLabel,
  onClose,
  onDuplicate,
  onRemix,
  onRegenerate,
  onCompare,
  onLockToggle,
  onEnrich,
}: Props) => {
  const open = !!library;
  const [selectedIcon, setSelectedIcon] = useState<BrandIconography | null>(null);
  const [remixOpen, setRemixOpen] = useState(false);
  const [previewTheme, setPreviewTheme] = useState<'light' | 'dark'>('light');
  const [styleOverride, setStyleOverride] = useState<'auto' | 'outlined' | 'filled' | 'duotone'>('outlined');
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [previewSize, setPreviewSize] = useState<20 | 32 | 48 | 64>(32);

  const baseRecipe: IconRecipe | null = useMemo(() => {
    if (!library) return null;
    const seed = library.icons.find((i) => readRecipe(i));
    return seed ? readRecipe(seed) : null;
  }, [library]);

  // Detect the dominant style from the set itself, so "auto" reflects what
  // was actually generated (outlined sets stay outlined, filled stay filled).
  // Brand standard: every icon set renders as outline only — never filled.
  const detectedStyle: 'outlined' | 'filled' | 'duotone' = 'outlined';

  const effectiveStyle = styleOverride === 'auto' ? detectedStyle : styleOverride;

  const handleExport = async () => {
    if (!library) return;
    try {
      await exportIconSystem({
        name: library.name,
        brand: library.name,
        icons: library.icons.filter((i) => i.svgPath),
        accent,
      });
      toast.success('Icon system exported');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Export failed');
    }
  };

  const realIcons = useMemo(() => {
    if (!library) return [];
    return library.icons.filter((i) => i.svgPath);
  }, [library]);

  // Category list (sorted by count desc).
  const categories = useMemo(() => {
    const counts = new Map<string, number>();
    for (const i of realIcons) {
      const c = (i.category || 'uncategorized').toLowerCase();
      counts.set(c, (counts.get(c) ?? 0) + 1);
    }
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1]);
  }, [realIcons]);

  const visibleIcons = useMemo(() => {
    const q = query.trim().toLowerCase();
    return realIcons.filter((i) => {
      if (activeCategory !== 'all') {
        const c = (i.category || 'uncategorized').toLowerCase();
        if (c !== activeCategory) return false;
      }
      if (!q) return true;
      return i.name.toLowerCase().includes(q);
    });
  }, [realIcons, query, activeCategory]);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        className={`max-w-6xl max-h-[92vh] overflow-y-auto p-0 icon-studio-tp ${previewTheme === 'dark' ? 'dark bg-background' : 'bg-background'}`}
        data-theme={previewTheme}
      >
        {library && (
          <>
            {/* Hero */}
            <div
              className="relative overflow-hidden p-8 border-b border-border/60"
              style={{
                background: `radial-gradient(80% 100% at 0% 0%, color-mix(in oklab, ${accent} 20%, transparent), transparent 70%)`,
              }}
            >
              <DialogHeader className="space-y-3">
                <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                  <Badge variant="outline" className="text-[10px]">{levelLabel}</Badge>
                  <StatusChip status={library.is_active ? 'approved' : 'idle'} />
                  <span className="tabular-nums">{library.icons.length} icons</span>
                </div>
                <DialogTitle className="text-3xl font-semibold tracking-tight">
                  {library.name}
                </DialogTitle>
                <DialogDescription className="text-sm text-muted-foreground max-w-2xl">
                  {library.description || 'No description provided for this icon set.'}
                </DialogDescription>
                <div className="flex flex-wrap items-center gap-2 pt-2">
                  <Button size="sm" variant="default" className="gap-1.5" onClick={onDuplicate}>
                    <Copy className="h-3.5 w-3.5" /> Duplicate
                  </Button>
                  <Button size="sm" variant="outline" className="gap-1.5" onClick={() => { setRemixOpen(true); onRemix?.(); }}>
                    <Wand2 className="h-3.5 w-3.5" /> Remix
                  </Button>
                  <Button size="sm" variant="outline" className="gap-1.5" onClick={onRegenerate}>
                    <RefreshCw className="h-3.5 w-3.5" /> Regenerate
                  </Button>
                  {onEnrich && (
                    <Button size="sm" variant="outline" className="gap-1.5" onClick={onEnrich}>
                      <Sparkles className="h-3.5 w-3.5" /> Add industry icons
                    </Button>
                  )}
                  <Button size="sm" variant="outline" className="gap-1.5" onClick={onLockToggle}>
                    <Lock className="h-3.5 w-3.5" />
                    {library.is_active ? 'Lock' : 'Unlock'}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5"
                    onClick={handleExport}
                    disabled={realIcons.length === 0}
                  >
                    <Download className="h-3.5 w-3.5" /> Export bundle
                  </Button>
                </div>

                {/* Preview controls — theme + style override applied to entire set */}
                <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-border/40 mt-3">
                  <div className="flex items-center gap-1 rounded-md border border-border/60 p-0.5">
                    <Button
                      size="sm"
                      variant={previewTheme === 'light' ? 'default' : 'ghost'}
                      className="h-7 px-2 gap-1"
                      onClick={() => setPreviewTheme('light')}
                    >
                      <Sun className="h-3.5 w-3.5" /> Light
                    </Button>
                    <Button
                      size="sm"
                      variant={previewTheme === 'dark' ? 'default' : 'ghost'}
                      className="h-7 px-2 gap-1"
                      onClick={() => setPreviewTheme('dark')}
                    >
                      <Moon className="h-3.5 w-3.5" /> Dark
                    </Button>
                  </div>

                  <div className="flex items-center gap-1 rounded-md border border-border/60 p-0.5">
                    {(['auto', 'outlined', 'filled', 'duotone'] as const).map((s) => (
                      <Button
                        key={s}
                        size="sm"
                        variant={styleOverride === s ? 'default' : 'ghost'}
                        className="h-7 px-2 capitalize"
                        onClick={() => setStyleOverride(s)}
                      >
                        {s === 'auto' ? `Auto (${detectedStyle})` : s}
                      </Button>
                    ))}
                  </div>

                  <span className="text-[11px] text-muted-foreground ml-auto">
                    Preview only — does not alter stored icons
                  </span>
                </div>
              </DialogHeader>
            </div>

            {/* Browse / filter / single-size grid */}
            <div className="p-6 space-y-4">
              {realIcons.length > 0 ? (
                <>
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="relative flex-1 min-w-[220px] max-w-md">
                      <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        placeholder={`Search ${realIcons.length} icons…`}
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className="pl-9 h-9"
                      />
                    </div>
                    <div className="flex items-center gap-1 rounded-md border border-border/60 p-0.5">
                      {([20, 32, 48, 64] as const).map((s) => (
                        <Button
                          key={s}
                          size="sm"
                          variant={previewSize === s ? 'default' : 'ghost'}
                          className="h-7 px-2 text-[11px] tabular-nums"
                          onClick={() => setPreviewSize(s)}
                        >
                          {s}px
                        </Button>
                      ))}
                    </div>
                    <span className="text-[11px] text-muted-foreground ml-auto tabular-nums">
                      {visibleIcons.length} of {realIcons.length}
                    </span>
                  </div>

                  {categories.length > 1 && (
                    <div className="flex flex-wrap gap-1.5">
                      <CategoryChip
                        label={`All ${realIcons.length}`}
                        active={activeCategory === 'all'}
                        onClick={() => setActiveCategory('all')}
                        accent={accent}
                      />
                      {categories.map(([cat, count]) => (
                        <CategoryChip
                          key={cat}
                          label={`${cat} ${count}`}
                          active={activeCategory === cat}
                          onClick={() => setActiveCategory(cat)}
                          accent={accent}
                        />
                      ))}
                    </div>
                  )}

                  {visibleIcons.length === 0 ? (
                    <div className="tp-card p-8 text-center text-sm text-muted-foreground">
                      No icons match your search.
                    </div>
                  ) : activeCategory === 'all' && !query.trim() && categories.length > 1 ? (
                    <CategorizedIconGrid
                      icons={visibleIcons}
                      accent={accent}
                      styleMode={effectiveStyle}
                      sizePx={previewSize}
                      onIconClick={(id) => {
                        const full = library.icons.find((i) => i.id === id) ?? null;
                        setSelectedIcon(full);
                      }}
                      onJumpToCategory={(c) => setActiveCategory(c)}
                    />
                  ) : (
                    <FilteredIconGrid
                      icons={visibleIcons}
                      accent={accent}
                      styleMode={effectiveStyle}
                      sizePx={previewSize}
                      onIconClick={(id) => {
                        const full = library.icons.find((i) => i.id === id) ?? null;
                        setSelectedIcon(full);
                      }}
                    />
                  )}
                </>
              ) : (
                <div className="space-y-4">
                  <div className="text-xs text-muted-foreground">
                    No stored SVG icons yet — showing sample preview using the set's accent.
                  </div>
                  {SIZE_LADDER.map((s) => (
                    <section key={s.label} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                          {s.label}
                        </h4>
                      </div>
                      <div className="tp-card p-4">
                        <IconSetPreview
                          emojis={FALLBACK_EMOJIS}
                          accent={accent}
                          size={s.tile >= 64 ? 'lg' : s.tile >= 40 ? 'md' : 'sm'}
                          count={Math.min(s.columns, 14)}
                          columns={s.columns}
                          variant="glass"
                        />
                      </div>
                    </section>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </DialogContent>

      <IconDetailDialog
        icon={selectedIcon}
        onClose={() => setSelectedIcon(null)}
        accent={accent}
        presentation={effectiveStyle}
        fallbackRecipe={baseRecipe}
      />

      <RemixSystemDialog
        open={remixOpen}
        systemName={library?.name}
        baseRecipe={baseRecipe}
        accent={accent}
        onClose={() => setRemixOpen(false)}
        onRemix={(key, recipe) => {
          toast.success(`Remix queued: ${key}`, {
            description: recipe
              ? 'A new variant will be generated from this system.'
              : 'No recipe attached — variant will use defaults.',
          });
        }}
      />
    </Dialog>
  );
};

/* -------------------------------------------------------------------------- */
/* Filtered single-size grid + category chip                                  */
/* -------------------------------------------------------------------------- */

const CategoryChip = ({
  label,
  active,
  onClick,
  accent,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  accent: string;
}) => (
  <button
    type="button"
    onClick={onClick}
    className="text-[11px] px-2.5 py-1 rounded-full border transition-colors capitalize"
    style={{
      borderColor: active ? accent : 'hsl(var(--border))',
      background: active ? `color-mix(in oklab, ${accent} 14%, transparent)` : 'transparent',
      color: active ? accent : 'hsl(var(--muted-foreground))',
    }}
  >
    {label}
  </button>
);

interface GridProps {
  icons: Array<{ id: string; name: string; svgPath: string; viewBox?: string; fillMode?: 'stroke' | 'fill' }>;
  accent: string;
  styleMode?: 'outlined' | 'filled' | 'duotone';
  sizePx: 20 | 32 | 48 | 64;
  onIconClick?: (id: string) => void;
}

const TILE_FOR_SIZE: Record<number, number> = { 20: 36, 32: 52, 48: 76, 64: 100 };

const FilteredIconGrid = ({ icons, accent, styleMode = 'outlined', sizePx, onIconClick }: GridProps) => {
  const tile = TILE_FOR_SIZE[sizePx];
  // Cap displayed icons to keep DOM cheap; rely on filter/search to narrow.
  const MAX = 600;
  const shown = icons.slice(0, MAX);
  const overflow = icons.length - shown.length;
  return (
    <div className="space-y-3">
      <div
        className="tp-card p-4 grid gap-3"
        style={{ gridTemplateColumns: `repeat(auto-fill, minmax(${tile + 24}px, 1fr))` }}
      >
        {shown.map((icon) => (
          <button
            type="button"
            key={icon.id}
            onClick={() => onIconClick?.(icon.id)}
            className="flex flex-col items-center gap-1.5 group focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg"
            title={icon.name}
          >
            <div
              className="flex items-center justify-center rounded-lg transition-transform group-hover:scale-105"
              style={{
                width: tile,
                height: tile,
                background: `color-mix(in oklab, ${accent} 10%, transparent)`,
                border: `1px solid color-mix(in oklab, ${accent} 22%, transparent)`,
              }}
            >
              <IconSvgRender
                icon={icon as BrandIconography}
                size={sizePx}
                color={accent}
                presentation={styleMode}
                strokeWidth={styleMode === 'duotone' ? 1.5 : 1.75}
              />
            </div>
            <span className="text-[10px] text-muted-foreground truncate max-w-[88px]">
              {icon.name}
            </span>
          </button>
        ))}
      </div>
      {overflow > 0 && (
        <div className="text-[11px] text-muted-foreground text-center">
          Showing first {MAX} of {icons.length}. Use search or category filters to narrow.
        </div>
      )}
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* Categorized grid — groups icons by category with section headers           */
/* -------------------------------------------------------------------------- */

interface CategorizedProps extends GridProps {
  onJumpToCategory?: (cat: string) => void;
}

const PER_CATEGORY_PREVIEW = 48;

const CategorizedIconGrid = ({
  icons,
  accent,
  styleMode = 'outlined',
  sizePx,
  onIconClick,
  onJumpToCategory,
}: CategorizedProps) => {
  const tile = TILE_FOR_SIZE[sizePx];
  // Group preserving first-seen order, but sort groups by size desc.
  const groups = (() => {
    const map = new Map<string, typeof icons>();
    for (const i of icons) {
      const c = ((i as BrandIconography).category || 'uncategorized').toLowerCase();
      if (!map.has(c)) map.set(c, []);
      map.get(c)!.push(i);
    }
    return Array.from(map.entries()).sort((a, b) => b[1].length - a[1].length);
  })();

  return (
    <div className="space-y-6">
      {groups.map(([cat, list]) => {
        const shown = list.slice(0, PER_CATEGORY_PREVIEW);
        const overflow = list.length - shown.length;
        return (
          <section key={cat} className="space-y-2">
            <div className="flex items-end justify-between">
              <h4 className="text-xs font-semibold uppercase tracking-wider capitalize" style={{ color: accent }}>
                {cat}
                <span className="ml-2 text-muted-foreground font-normal normal-case tracking-normal tabular-nums">
                  {list.length}
                </span>
              </h4>
              {overflow > 0 && onJumpToCategory && (
                <button
                  type="button"
                  onClick={() => onJumpToCategory(cat)}
                  className="text-[11px] text-muted-foreground hover:text-foreground transition-colors"
                >
                  View all {list.length} →
                </button>
              )}
            </div>
            <div
              className="tp-card p-4 grid gap-3"
              style={{ gridTemplateColumns: `repeat(auto-fill, minmax(${tile + 24}px, 1fr))` }}
            >
              {shown.map((icon) => (
                <button
                  type="button"
                  key={icon.id}
                  onClick={() => onIconClick?.(icon.id)}
                  className="flex flex-col items-center gap-1.5 group focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg"
                  title={icon.name}
                >
                  <div
                    className="flex items-center justify-center rounded-lg transition-transform group-hover:scale-105"
                    style={{
                      width: tile,
                      height: tile,
                      background: `color-mix(in oklab, ${accent} 10%, transparent)`,
                      border: `1px solid color-mix(in oklab, ${accent} 22%, transparent)`,
                    }}
                  >
                    <IconSvgRender
                      icon={icon as BrandIconography}
                      size={sizePx}
                      color={accent}
                      presentation={styleMode}
                      strokeWidth={styleMode === 'duotone' ? 1.5 : 1.75}
                    />
                  </div>
                  <span className="text-[10px] text-muted-foreground truncate max-w-[88px]">
                    {icon.name}
                  </span>
                </button>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
};
