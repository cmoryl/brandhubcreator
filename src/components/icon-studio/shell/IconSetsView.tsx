/**
 * IconSetsView — every set the org has generated, grouped by level.
 * Provides duplicate / remix / regenerate / lock affordances.
 */

import { useMemo, useState } from 'react';
import {
  Copy, Wand2, Lock, RefreshCw, GitCompare, ArrowUpRight,
  FolderOpen, Plus, Filter,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { IconSetPreview } from './IconSetPreview';
import { StatusChip } from './StatusChip';
import type { IconLibrary } from '@/hooks/useIconLibraries';

interface Props {
  libraries: IconLibrary[];
  onCreate?: () => void;
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

export const IconSetsView = ({ libraries, onCreate }: Props) => {
  const [q, setQ] = useState('');

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
              Every set you've generated — core, product line, and brand variants. Duplicate,
              remix, regenerate, lock, or compare versions.
            </p>
          </div>
          <Button size="sm" className="gap-1.5" onClick={onCreate}>
            <Plus className="h-4 w-4" />
            New set
          </Button>
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

      {(Object.keys(LEVEL_META) as Array<keyof typeof LEVEL_META>).map((level) => {
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
                  return (
                    <article
                      key={lib.id}
                      className="tp-card tp-card-interactive p-4"
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
                      <IconSetPreview
                        emojis={SAMPLE_FOR(lib.name)}
                        accent={accent}
                        size="sm"
                        count={6}
                        variant="glass"
                      />
                      <footer className="mt-3 pt-3 border-t border-border/50 flex items-center justify-between">
                        <span className="text-[11px] text-muted-foreground tabular-nums">
                          {lib.icons.length} icons
                        </span>
                        <div className="flex items-center gap-0.5">
                          {[
                            { label: 'Duplicate', icon: Copy },
                            { label: 'Remix', icon: Wand2 },
                            { label: 'Regenerate', icon: RefreshCw },
                            { label: 'Compare', icon: GitCompare },
                            { label: 'Lock', icon: Lock },
                          ].map((a) => (
                            <Button
                              key={a.label}
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              title={a.label}
                              aria-label={a.label}
                            >
                              <a.icon className="h-3.5 w-3.5" />
                            </Button>
                          ))}
                          <Button variant="ghost" size="icon" className="h-7 w-7" title="Open">
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
    </div>
  );
};
