/**
 * IconSetsView — every set the org has generated, grouped by level.
 * Provides duplicate / remix / regenerate / lock affordances + a
 * detail dialog that opens the full set at large size.
 */

import { useEffect, useMemo, useState } from 'react';
import {
  Copy, Wand2, Lock, Unlock, RefreshCw, ArrowUpRight,
  FolderOpen, Plus, Filter, Trash2, Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { LibraryIconPreview } from './LibraryIconPreview';
import { StatusChip } from './StatusChip';
import { IconSetDetailDialog } from './IconSetDetailDialog';
import { BulkRegenerateDialog } from './BulkRegenerateDialog';
import { BulkExpandDialog } from './BulkExpandDialog';
import { useIconLibraries, type IconLibrary } from '@/hooks/useIconLibraries';

interface Props {
  libraries: IconLibrary[];
  organizationId?: string;
  /** When false, hides destructive / mutating affordances. */
  canEdit?: boolean;
  onCreate?: () => void;
  onRegenerate?: (lib: IconLibrary) => void;
  onRemix?: (lib: IconLibrary) => void;
  onCompare?: (lib: IconLibrary) => void;
  autoOpenLibraryId?: string | null;
  onAutoOpenConsumed?: () => void;
}

const SAMPLE_FOR = (name: string): string[] => {
  const n = name.toLowerCase();
  if (n.includes('global')) return ['🔗', '🌍', '⚙️', '📡', '🧩', '🔁'];
  if (n.includes('lang') || n.includes('local')) return ['🌐', '🗣️', '📚', '✅', '🔄', '📝'];
  if (n.includes('health')) return ['🩺', '💊', '🏥', '❤️', '📋', '🧬'];
  if (n.includes('travel')) return ['✈️', '🏨', '🎫', '⭐', '🗺️', '🧳'];
  if (n.includes('finance') || n.includes('bank')) return ['💳', '🏦', '📈', '💰', '🔐', '🧾'];
  if (n.includes('ai')) return ['✨', '🧠', '🤖', '⚡', '🪄', '🧪'];
  return ['⚙️', '📊', '🔐', '🔌', '⚡', '🧩'];
};

const LEVEL_META = {
  core: { label: 'Core systems', token: '--tp-digital-blue', helper: 'Universal company sets' },
  product_line: {
    label: 'Product line packs',
    token: '--tp-orange',
    helper: 'Feature-specific add-ons',
  },
  brand: { label: 'Brand variants', token: '--tp-pink', helper: 'Sub-brand overrides' },
} as const;

type LevelKey = keyof typeof LEVEL_META;

export const IconSetsView = ({
  libraries,
  organizationId,
  canEdit = true,
  onCreate,
  onRegenerate,
  onRemix,
  onCompare,
  autoOpenLibraryId,
  onAutoOpenConsumed,
}: Props) => {
  const [q, setQ] = useState('');
  const [activeLib, setActiveLib] = useState<IconLibrary | null>(null);
  const [regenLib, setRegenLib] = useState<IconLibrary | null>(null);
  const [expandOpen, setExpandOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<IconLibrary | null>(null);
  const { createLibrary, updateLibrary, deleteLibrary } = useIconLibraries(organizationId);

  // Auto-open from deep link (e.g. /icon-studio?section=sets&library=<id>)
  useEffect(() => {
    if (!autoOpenLibraryId) return;
    const match = libraries.find((l) => l.id === autoOpenLibraryId);
    if (match) {
      setActiveLib(match);
      onAutoOpenConsumed?.();
    }
  }, [autoOpenLibraryId, libraries, onAutoOpenConsumed]);

  const grouped = useMemo(() => {
    const term = q.toLowerCase();
    const inQuery = (lib: IconLibrary) =>
      !term ||
      lib.name.toLowerCase().includes(term) ||
      (lib.description ?? '').toLowerCase().includes(term);
    return {
      core: libraries.filter((l) => l.level === 'core').filter(inQuery),
      product_line: libraries.filter((l) => l.level === 'product_line').filter(inQuery),
      brand: libraries.filter((l) => l.level === 'brand').filter(inQuery),
    };
  }, [libraries, q]);

  const handleDuplicate = (lib: IconLibrary) => {
    if (!organizationId) {
      toast.error('No organization selected');
      return;
    }
    createLibrary.mutate({
      organization_id: organizationId,
      name: `${lib.name} (copy)`,
      level: lib.level,
      description: lib.description || undefined,
      icons: lib.icons,
      parent_library_id: lib.parent_library_id,
      is_active: lib.is_active,
      display_order: (lib.display_order ?? 0) + 1,
    });
  };

  const handleLockToggle = (lib: IconLibrary) => {
    updateLibrary.mutate(
      { id: lib.id, updates: { is_active: !lib.is_active } },
      {
        onSuccess: () =>
          toast.success(lib.is_active ? `${lib.name} locked` : `${lib.name} unlocked`),
      },
    );
  };

  const handleRemix = (lib: IconLibrary) => {
    if (onRemix) return onRemix(lib);
    toast.info(`Remix "${lib.name}" — open the generator with this set as a seed.`);
  };

  const handleRegenerate = (lib: IconLibrary) => {
    setRegenLib(lib);
  };

  const handleCompare = (lib: IconLibrary) => {
    if (onCompare) return onCompare(lib);
    toast.info(`Compare versions of "${lib.name}" coming up.`);
  };

  const handleDelete = (lib: IconLibrary) => {
    setPendingDelete(lib);
  };
  const confirmDelete = () => {
    if (!pendingDelete) return;
    deleteLibrary.mutate(pendingDelete.id);
    setPendingDelete(null);
  };

  const levelLabelFor = (lib: IconLibrary) => LEVEL_META[lib.level as LevelKey]?.label ?? lib.level;
  const accentFor = (lib: IconLibrary) =>
    `hsl(var(${LEVEL_META[lib.level as LevelKey]?.token ?? '--tp-digital-blue'}))`;

  return (
    <div className="space-y-6">
      <header className="tp-card relative overflow-hidden p-6">
        <div
          className="absolute inset-0 opacity-40"
          style={{
            background:
              'radial-gradient(50% 80% at 100% 0%, hsl(var(--tp-orange) / 0.16), transparent 70%)',
          }}
          aria-hidden
        />
        <div className="relative flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              <FolderOpen className="h-3.5 w-3.5" />
              <span>Generated icon systems</span>
            </div>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">Icon Sets</h1>
            <p className="text-sm text-muted-foreground max-w-2xl">
              Every set you've generated — core, product line, and brand variants. Click any card
              to view the full set, or use the inline actions to duplicate, remix, regenerate,
              lock, or compare.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setExpandOpen(true)}>
              <Sparkles className="h-4 w-4" />
              Expand brand sets +120
            </Button>
            <Button size="sm" className="gap-1.5" onClick={onCreate}>
              <Plus className="h-4 w-4" />
              New set
            </Button>
          </div>
        </div>
      </header>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Input
            placeholder="Search sets…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="h-9"
          />
        </div>
        <Badge variant="outline" className="gap-1">
          <Filter className="h-3 w-3" />
          {libraries.length} total
        </Badge>
      </div>

      {(Object.keys(LEVEL_META) as LevelKey[]).map((level) => {
        const meta = LEVEL_META[level];
        const items = grouped[level];
        return (
          <section key={level} className="space-y-3">
            <header className="flex items-center justify-between">
              <div>
                <h2
                  className="text-sm font-semibold uppercase tracking-wider"
                  style={{ color: `hsl(var(${meta.token}))` }}
                >
                  {meta.label}
                  <span className="ml-2 text-muted-foreground normal-case tracking-normal text-xs font-normal">
                    {meta.helper}
                  </span>
                </h2>
              </div>
              <Badge variant="secondary" className="text-[10px]">
                {items.length}
              </Badge>
            </header>

            {items.length === 0 ? (
              <div className="tp-card p-4 text-xs text-muted-foreground text-center">
                No {meta.label.toLowerCase()} yet.
              </div>
            ) : (
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {items.map((lib) => {
                  const accent = `hsl(var(${meta.token}))`;
                  const stop = (e: React.MouseEvent) => {
                    e.stopPropagation();
                  };
                  const actions: Array<{
                    label: string;
                    icon: typeof Copy;
                    onClick: () => void;
                  }> = [
                    { label: 'Duplicate', icon: Copy, onClick: () => handleDuplicate(lib) },
                    { label: 'Remix', icon: Wand2, onClick: () => handleRemix(lib) },
                    { label: 'Regenerate', icon: RefreshCw, onClick: () => handleRegenerate(lib) },
                    
                    {
                      label: lib.is_active ? 'Lock' : 'Unlock',
                      icon: lib.is_active ? Lock : Unlock,
                      onClick: () => handleLockToggle(lib),
                    },
                    { label: 'Delete', icon: Trash2, onClick: () => handleDelete(lib) },
                  ];

                  return (
                    <article
                      key={lib.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => setActiveLib(lib)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setActiveLib(lib);
                        }
                      }}
                      className="tp-card tp-card-interactive p-4 text-left cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      style={{
                        backgroundImage: `linear-gradient(135deg, hsl(var(${meta.token}) / 0.07), transparent 60%)`,
                      }}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="min-w-0">
                          <h3 className="text-sm font-semibold truncate">{lib.name}</h3>
                          <p className="text-[11px] text-muted-foreground truncate">
                            {lib.description || 'No description'}
                          </p>
                        </div>
                        <StatusChip status={lib.is_active ? 'approved' : 'idle'} />
                      </div>
                      <LibraryIconPreview
                        icons={lib.icons}
                        fallbackEmojis={SAMPLE_FOR(lib.name)}
                        accent={accent}
                        size="sm"
                        count={6}
                      />
                      <footer
                        className="mt-3 pt-3 border-t border-border/50 flex items-center justify-between"
                        onClick={stop}
                      >
                        <span className="text-[11px] text-muted-foreground tabular-nums">
                          {lib.icons.length} icons
                        </span>
                        <div className="flex items-center gap-0.5">
                          {actions.map((a) => (
                            <Button
                              key={a.label}
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              title={a.label}
                              aria-label={a.label}
                              onClick={(e) => {
                                e.stopPropagation();
                                a.onClick();
                              }}
                            >
                              <a.icon className="h-3.5 w-3.5" />
                            </Button>
                          ))}
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            title="Open set"
                            aria-label="Open set"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveLib(lib);
                            }}
                          >
                            <ArrowUpRight className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </footer>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        );
      })}

      <IconSetDetailDialog
        library={activeLib}
        accent={activeLib ? accentFor(activeLib) : 'hsl(var(--primary))'}
        levelLabel={activeLib ? levelLabelFor(activeLib) : ''}
        onClose={() => setActiveLib(null)}
        onDuplicate={() => activeLib && handleDuplicate(activeLib)}
        onRemix={() => activeLib && handleRemix(activeLib)}
        onRegenerate={() => activeLib && handleRegenerate(activeLib)}
        onCompare={() => activeLib && handleCompare(activeLib)}
        onLockToggle={() => activeLib && handleLockToggle(activeLib)}
      />

      <BulkRegenerateDialog
        library={regenLib}
        organizationId={organizationId}
        onClose={() => setRegenLib(null)}
      />

      <BulkExpandDialog
        open={expandOpen}
        libraries={libraries}
        organizationId={organizationId}
        expandBy={120}
        level="brand"
        onClose={() => setExpandOpen(false)}
      />
    </div>
  );
};
