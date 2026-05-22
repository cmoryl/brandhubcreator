/**
 * IconSetDetailDialog — large preview of a generated icon set / library.
 * Renders the actual stored SVG icons at multiple sizes with the chosen
 * brand accent applied.
 */

import { useMemo, useState } from 'react';
import { Wand2, RefreshCw, GitCompare, Lock, Copy, ArrowUpRight, Download } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatusChip } from './StatusChip';
import { IconSetPreview } from './IconSetPreview';
import { IconDetailDialog } from '@/components/icon-studio/IconDetailDialog';
import { RemixSystemDialog } from '@/components/icon-studio/RemixSystemDialog';
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
}: Props) => {
  const open = !!library;
  const [selectedIcon, setSelectedIcon] = useState<BrandIconography | null>(null);
  const [remixOpen, setRemixOpen] = useState(false);
  const theme =
    (typeof document !== 'undefined' &&
      document.querySelector('.icon-studio-tp')?.getAttribute('data-theme')) ||
    'light';

  const baseRecipe: IconRecipe | null = useMemo(() => {
    if (!library) return null;
    const seed = library.icons.find((i) => readRecipe(i));
    return seed ? readRecipe(seed) : null;
  }, [library]);

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
    } catch (e: any) {
      toast.error(e?.message ?? 'Export failed');
    }
  };

  const realIcons = useMemo(() => {
    if (!library) return [];
    return library.icons.filter((i) => i.svgPath);
  }, [library]);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        className="max-w-6xl max-h-[92vh] overflow-y-auto p-0 icon-studio-tp"
        data-theme={theme}
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
                  <Button size="sm" variant="outline" className="gap-1.5" onClick={onCompare}>
                    <GitCompare className="h-3.5 w-3.5" /> Compare
                  </Button>
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
              </DialogHeader>
            </div>

            {/* Size ladder with real or sample previews */}
            <div className="p-6 space-y-6">
              {realIcons.length > 0 ? (
                <RealIconLadder
                  icons={realIcons}
                  accent={accent}
                  onIconClick={(id) => {
                    const full = library.icons.find((i) => i.id === id) ?? null;
                    setSelectedIcon(full);
                  }}
                />
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
/* Real icon ladder — renders BrandIconography svgPath at multiple sizes      */
/* -------------------------------------------------------------------------- */

const LADDER: { label: string; tile: number; icon: number }[] = [
  { label: '20 px', tile: 32, icon: 18 },
  { label: '32 px', tile: 48, icon: 26 },
  { label: '48 px', tile: 72, icon: 40 },
  { label: '64 px', tile: 96, icon: 56 },
];

interface LadderProps {
  icons: Array<{ id: string; name: string; svgPath: string; viewBox?: string; fillMode?: 'stroke' | 'fill' }>;
  accent: string;
  onIconClick?: (id: string) => void;
}

const RealIconLadder = ({ icons, accent, onIconClick }: LadderProps) => {
  return (
    <div className="space-y-6">
      {LADDER.map((s) => (
        <section key={s.label} className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {s.label}
            </h4>
            <span className="text-[10px] text-muted-foreground">{icons.length} icons</span>
          </div>
          <div
            className="tp-card p-4 grid gap-3"
            style={{
              gridTemplateColumns: `repeat(auto-fill, minmax(${s.tile + 24}px, 1fr))`,
            }}
          >
            {icons.map((icon) => (
              <button
                type="button"
                key={`${s.label}-${icon.id}`}
                onClick={() => onIconClick?.(icon.id)}
                className="flex flex-col items-center gap-1.5 group focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg"
                title={icon.name}
              >
                <div
                  className="flex items-center justify-center rounded-lg transition-transform group-hover:scale-105"
                  style={{
                    width: s.tile,
                    height: s.tile,
                    background: `color-mix(in oklab, ${accent} 10%, transparent)`,
                    border: `1px solid color-mix(in oklab, ${accent} 22%, transparent)`,
                  }}
                >
                  <svg
                    width={s.icon}
                    height={s.icon}
                    viewBox={icon.viewBox || '0 0 24 24'}
                    fill={icon.fillMode === 'fill' ? accent : 'none'}
                    stroke={icon.fillMode === 'fill' ? 'none' : accent}
                    strokeWidth={1.75}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d={icon.svgPath} />
                  </svg>
                </div>
                <span className="text-[10px] text-muted-foreground truncate max-w-[88px]">
                  {icon.name}
                </span>
              </button>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
};
