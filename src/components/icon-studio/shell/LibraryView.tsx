/**
 * LibraryView — searchable, filterable view of every saved icon library
 * (set) in the organization. Real data from useIconLibraries.
 */

import { useEffect, useMemo, useState } from 'react';
import { Search, Plus, MoreHorizontal, Library as LibraryIcon, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LibraryIconPreview } from './LibraryIconPreview';
import { IconSetDetailDialog } from './IconSetDetailDialog';
import { BulkRegenerateDialog } from './BulkRegenerateDialog';
import { StatusChip } from './StatusChip';
import { type IconLibrary } from '@/hooks/useIconLibraries';
import { useIconLibraryRowActions } from './useIconLibraryRowActions';
import { useImportedIcons } from '@/hooks/useImportedIcons';
import { ImportedIconPreview } from './ImportedIconPreview';

interface Props {
  libraries: IconLibrary[];
  organizationId?: string;
  /** When false, hides destructive / mutating affordances (Duplicate, Lock, Delete, New set). */
  canEdit?: boolean;
  onOpenSet?: (lib: IconLibrary) => void;
  onCreate?: () => void;
  onRemix?: (lib: IconLibrary) => void;
  /** When set, scroll-to-and-highlight this library card and auto-open it once. */
  autoOpenLibraryId?: string | null;
  onAutoOpenConsumed?: () => void;
  /** Navigate to the Imported Icons tab. */
  onViewImported?: () => void;
}

const LEVEL_LABEL: Record<IconLibrary['level'], { label: string; token: string }> = {
  core: { label: 'Core', token: '--tp-digital-blue' },
  product_line: { label: 'Product line', token: '--tp-orange' },
  brand: { label: 'Brand', token: '--tp-pink' },
};

const sampleEmojisFor = (name: string): string[] => {
  const n = name.toLowerCase();
  if (n.includes('global')) return ['🔗', '🌍', '⚙️', '📡', '🧩', '🔁'];
  if (n.includes('lang') || n.includes('local')) return ['🌐', '🗣️', '📚', '✅', '🔄', '📝'];
  if (n.includes('health') || n.includes('clinic')) return ['🩺', '💊', '🏥', '❤️', '📋', '🧬'];
  if (n.includes('travel') || n.includes('loyalty')) return ['✈️', '🏨', '🎫', '⭐', '🗺️', '🧳'];
  if (n.includes('finance') || n.includes('bank')) return ['💳', '🏦', '📈', '💰', '🔐', '🧾'];
  if (n.includes('ai') || n.includes('intel')) return ['✨', '🧠', '🤖', '⚡', '🪄', '🧪'];
  return ['⚙️', '📊', '🔐', '🔌', '⚡', '🧩'];
};

export const LibraryView = ({ libraries, organizationId, canEdit = true, onOpenSet, onCreate, onRemix, autoOpenLibraryId, onAutoOpenConsumed, onViewImported }: Props) => {
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<'all' | IconLibrary['level']>('all');
  const [openLib, setOpenLib] = useState<IconLibrary | null>(null);
  const [regenLib, setRegenLib] = useState<IconLibrary | null>(null);
  const { handleDuplicate, handleLockToggle, requestDelete, deleteDialog } =
    useIconLibraryRowActions({ organizationId, canEdit });
  const { entries: importedEntries, loading: importedLoading } = useImportedIcons();

  // Auto-open from deep link
  useEffect(() => {
    if (!autoOpenLibraryId) return;
    const match = libraries.find((l) => l.id === autoOpenLibraryId);
    if (match) {
      setOpenLib(match);
      onAutoOpenConsumed?.();
    }
  }, [autoOpenLibraryId, libraries, onAutoOpenConsumed]);

  const filtered = useMemo(() => {
    return libraries.filter((l) => {
      if (filter !== 'all' && l.level !== filter) return false;
      if (!q.trim()) return true;
      const term = q.toLowerCase();
      return (
        l.name.toLowerCase().includes(term) ||
        (l.description ?? '').toLowerCase().includes(term)
      );
    });
  }, [libraries, q, filter]);

  const counts = useMemo(
    () => ({
      all: libraries.length,
      core: libraries.filter((l) => l.level === 'core').length,
      product_line: libraries.filter((l) => l.level === 'product_line').length,
      brand: libraries.filter((l) => l.level === 'brand').length,
    }),
    [libraries],
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="tp-card relative overflow-hidden p-6">
        <div
          className="absolute inset-0 opacity-40"
          style={{
            background:
              'radial-gradient(50% 80% at 0% 0%, hsl(var(--tp-digital-blue) / 0.18), transparent 70%)',
          }}
          aria-hidden
        />
        <div className="relative flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              <LibraryIcon className="h-3.5 w-3.5" />
              <span>Saved icon systems</span>
            </div>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">Library</h1>
            <p className="text-sm text-muted-foreground">
              Every icon set you've saved — searchable, taggable, version-controlled.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {onViewImported && (
              <Button size="sm" variant="outline" className="gap-1.5" onClick={onViewImported}>
                <LibraryIcon className="h-4 w-4" />
                Imported assets
              </Button>
            )}
            {canEdit && (
              <Button size="sm" className="gap-1.5" onClick={onCreate}>
                <Plus className="h-4 w-4" />
                New set
              </Button>
            )}
          </div>
        </div>
      </header>



      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name or description…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
        <div className="flex items-center gap-1.5">
          {([
            ['all', `All ${counts.all}`],
            ['core', `Core ${counts.core}`],
            ['product_line', `Product ${counts.product_line}`],
            ['brand', `Brand ${counts.brand}`],
          ] as const).map(([id, label]) => (
            <Button
              key={id}
              size="sm"
              variant={filter === id ? 'default' : 'outline'}
              className="h-8"
              onClick={() => setFilter(id as typeof filter)}
            >
              {label}
            </Button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="tp-card flex flex-col items-center justify-center py-16 text-center">
          <div
            className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl"
            style={{ background: 'hsl(var(--tp-light-blue) / 0.12)', color: 'hsl(var(--tp-light-blue))' }}
          >
            <Sparkles className="h-6 w-6" />
          </div>
          <h3 className="text-base font-semibold">No sets match</h3>
          <p className="text-sm text-muted-foreground mt-1">
            {libraries.length === 0
              ? 'Generate your first icon system to start building your library.'
              : 'Try a different search or filter.'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {/* Imported Assets card */}
          {onViewImported && !importedLoading && importedEntries.length > 0 && (
            <div
              role="button"
              tabIndex={0}
              onClick={onViewImported}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onViewImported();
                }
              }}
              className="tp-card tp-card-interactive group p-5 text-left transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary"
              style={{
                backgroundImage: 'linear-gradient(135deg, hsl(var(--tp-teal) / 0.08), transparent 60%)',
              }}
            >
              <div className="flex items-start justify-between mb-3">
                <Badge
                  variant="outline"
                  className="text-[10px] uppercase tracking-wider"
                  style={{
                    borderColor: 'hsl(var(--tp-teal) / 0.4)',
                    color: 'hsl(var(--tp-teal))',
                  }}
                >
                  Bundled
                </Badge>
              </div>
              <h3 className="text-base font-semibold leading-tight">Imported Assets</h3>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2 min-h-[2.25rem]">
                {importedEntries.length} curated SVG icons bundled with the project — searchable, downloadable, copy-ready.
              </p>
              <div className="mt-4">
                <ImportedIconPreview
                  icons={importedEntries}
                  variant="light-blue"
                  accent="hsl(var(--tp-teal))"
                  count={6}
                  tilePx={32}
                />
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-border/50 pt-3">
                <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                  <span className="tabular-nums font-medium text-foreground">
                    {importedEntries.length}
                  </span>
                  <span>icons</span>
                </div>
                <StatusChip status="approved" />
              </div>
            </div>
          )}
          {filtered.map((lib) => {
            const level = LEVEL_LABEL[lib.level];
            const accent = `hsl(var(${level.token}))`;
            return (
              <div
                key={lib.id}
                role="button"
                tabIndex={0}
                onClick={() => { setOpenLib(lib); onOpenSet?.(lib); }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setOpenLib(lib);
                    onOpenSet?.(lib);
                  }
                }}
                className="tp-card tp-card-interactive group p-5 text-left transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary"
                style={{
                  backgroundImage: `linear-gradient(135deg, hsl(var(${level.token}) / 0.08), transparent 60%)`,
                }}
              >
                <div className="flex items-start justify-between mb-3">
                  <Badge
                    variant="outline"
                    className="text-[10px] uppercase tracking-wider"
                    style={{
                      borderColor: `hsl(var(${level.token}) / 0.4)`,
                      color: `hsl(var(${level.token}))`,
                    }}
                  >
                    {level.label}
                  </Badge>
                  {canEdit && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <MoreHorizontal className="h-3.5 w-3.5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenuItem onClick={() => handleDuplicate(lib)}>Duplicate</DropdownMenuItem>
                        {onRemix && <DropdownMenuItem onClick={() => onRemix(lib)}>Remix</DropdownMenuItem>}
                        <DropdownMenuItem onClick={() => handleLockToggle(lib)}>
                          {lib.is_active ? 'Lock set' : 'Unlock set'}
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive" onClick={() => requestDelete(lib)}>Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
                <h3 className="text-base font-semibold leading-tight">{lib.name}</h3>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2 min-h-[2.25rem]">
                  {lib.description || 'No description'}
                </p>
                <div className="mt-4">
                  <LibraryIconPreview
                    icons={lib.icons}
                    fallbackEmojis={sampleEmojisFor(lib.name)}
                    accent={accent}
                    size="sm"
                    count={6}
                  />
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-border/50 pt-3">
                  <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                    <span className="tabular-nums font-medium text-foreground">
                      {lib.icons.length}
                    </span>
                    <span>icons</span>
                  </div>
                  <StatusChip status={lib.is_active ? 'approved' : 'idle'} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      <IconSetDetailDialog
        library={openLib}
        accent={openLib ? `hsl(var(${LEVEL_LABEL[openLib.level].token}))` : 'hsl(var(--tp-digital-blue))'}
        levelLabel={openLib ? LEVEL_LABEL[openLib.level].label : ''}
        onClose={() => setOpenLib(null)}
        onDuplicate={canEdit && openLib ? () => handleDuplicate(openLib) : undefined}
        onRemix={canEdit && openLib && onRemix ? () => { onRemix(openLib); setOpenLib(null); } : undefined}
        onRegenerate={canEdit && openLib ? () => { setRegenLib(openLib); setOpenLib(null); } : undefined}
        onLockToggle={canEdit && openLib ? () => handleLockToggle(openLib) : undefined}
      />

      <BulkRegenerateDialog
        library={regenLib}
        organizationId={organizationId}
        onClose={() => setRegenLib(null)}
      />

      {deleteDialog}
    </div>
  );
};

