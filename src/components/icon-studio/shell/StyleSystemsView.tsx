/**
 * StyleSystemsView — gallery of the 36 base styles as reusable recipes
 * with mini-previews and a "Apply to set" action.
 *
 * Previews now use real bundled icons restyled through each recipe via
 * `BundledIconLadder`. The "Apply to imported pack…" action streams the
 * recipe across a chosen bundled pack and saves the result as a new core
 * icon library.
 */

import { useMemo, useState } from 'react';
import { Palette, Wand2, Check, Maximize2, X, Library as LibraryIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { StyleSystemDetailDialog } from './StyleSystemDetailDialog';
import { ApplyStyleToBundledDialog } from './ApplyStyleToBundledDialog';
import { BundledIconLadder } from './BundledIconLadder';
import { getStyleSource } from './styleRecipeToDna';
import { BASE_STYLES, COLOR_MODES, type BaseStyle } from './studioData';
import { useHiddenItems } from './useHiddenItems';
import { useOrganization } from '@/contexts/OrganizationContext';
import { cn } from '@/lib/utils';

const ACCENTS = [
  '--tp-digital-blue',
  '--tp-pink',
  '--tp-orange',
  '--tp-teal',
  '--tp-green',
  '--tp-purple',
  '--tp-light-blue',
];

interface Props {
  onStartGenerate?: () => void;
  /** Called with a new library id (deep-link to LibraryView). */
  onLibraryCreated?: (libraryId: string) => void;
}

export const StyleSystemsView = ({ onStartGenerate, onLibraryCreated }: Props) => {
  const { organization } = useOrganization();
  const [q, setQ] = useState('');
  const [activeId, setActiveId] = useState<string>(BASE_STYLES[0].id);
  const [colorMode, setColorMode] = useState<string>('mono');
  const [detailId, setDetailId] = useState<string | null>(null);
  const [detailAccent, setDetailAccent] = useState<string>(`hsl(var(${ACCENTS[0]}))`);
  const [applyStyle, setApplyStyle] = useState<BaseStyle | null>(null);
  const [applyAccent, setApplyAccent] = useState<string>(`hsl(var(${ACCENTS[0]}))`);
  const { hidden, hide, clear, isHidden } = useHiddenItems('style-systems');

  const filtered = useMemo(() => {
    const visible = BASE_STYLES.filter((s) => !isHidden(s.id));
    if (!q.trim()) return visible;
    const t = q.toLowerCase();
    return visible.filter(
      (s) => s.name.toLowerCase().includes(t) || s.description.toLowerCase().includes(t),
    );
  }, [q, isHidden]);

  const active = BASE_STYLES.find((s) => s.id === activeId) ?? BASE_STYLES[0];

  return (
    <div className="space-y-6">
      <header className="tp-card relative overflow-hidden p-6">
        <div
          className="absolute inset-0 opacity-40"
          style={{
            background:
              'radial-gradient(50% 80% at 100% 0%, hsl(var(--tp-purple) / 0.16), transparent 70%)',
          }}
          aria-hidden
        />
        <div className="relative flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              <Palette className="h-3.5 w-3.5" />
              <span>Reusable style recipes</span>
            </div>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">Style Systems</h1>
            <p className="text-sm text-muted-foreground max-w-2xl">
              Pick a base style, lock a color mode — apply it to any new icon system for
              consistent strokes, fills, and brand discipline.
            </p>
          </div>
          <Button size="sm" className="gap-1.5" onClick={onStartGenerate}>
            <Wand2 className="h-4 w-4" />
            Use in new set
          </Button>
        </div>
      </header>

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        {/* Style grid */}
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <Input
              placeholder="Search styles…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="h-9 max-w-xs"
            />
            <Badge variant="outline">{filtered.length} styles</Badge>
            {hidden.size > 0 && (
              <Button variant="ghost" size="sm" className="h-7 text-[11px]" onClick={clear}>
                Restore {hidden.size} hidden
              </Button>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {filtered.map((s, i) => {
              const isActive = s.id === activeId;
              const accent = `hsl(var(${ACCENTS[i % ACCENTS.length]}))`;
              return (
                <div
                  key={s.id}
                  role="button"
                  tabIndex={0}
                  aria-pressed={isActive}
                  onClick={() => {
                    setActiveId(s.id);
                    setDetailAccent(accent);
                    setDetailId(s.id);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setActiveId(s.id);
                      setDetailAccent(accent);
                      setDetailId(s.id);
                    }
                  }}
                  className={cn(
                    'tp-card tp-card-interactive p-4 text-left relative group cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary',
                    isActive && 'ring-2 ring-primary',
                  )}
                >
                  {isActive && (
                    <Check
                      className="absolute top-3 right-3 h-4 w-4"
                      style={{ color: 'hsl(var(--tp-green))' }}
                    />
                  )}
                  <Maximize2 className="absolute top-3 right-9 h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  <button
                    type="button"
                    aria-label={`Hide ${s.name}`}
                    title="Hide from gallery"
                    onClick={(e) => {
                      e.stopPropagation();
                      hide(s.id);
                    }}
                    className="absolute top-2 left-2 inline-flex h-6 w-6 items-center justify-center rounded-md border border-border/60 bg-background/70 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity hover:text-destructive hover:border-destructive/50"
                  >
                    <X className="h-3 w-3" />
                  </button>
                  <h3 className="text-sm font-semibold">{s.name}</h3>
                  <p className="text-[11px] text-muted-foreground mb-3 min-h-[2rem]">
                    {s.description}
                  </p>
                  <BundledIconLadder style={s} accent={accent} count={6} tile={28} />
                  <div className="mt-3 flex flex-wrap items-center gap-1">
                    {Object.entries(s.recipe)
                      .filter(([, v]) => v)
                      .map(([k]) => (
                        <Badge key={k} variant="secondary" className="text-[10px] capitalize">
                          {k}
                        </Badge>
                      ))}
                    <Badge variant="outline" className="text-[10px] capitalize">
                      {s.preview.variant}
                    </Badge>
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <span className="text-[10px] text-muted-foreground truncate">
                      Sourced from {getStyleSource(s).label}
                    </span>
                    <span className="text-[10px] text-primary/80 opacity-0 group-hover:opacity-100 transition-opacity">
                      Click to expand →
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Active recipe panel */}
        <aside className="tp-card p-5 sticky top-4 h-fit space-y-4">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Active recipe
          </div>
          <h2 className="text-xl font-semibold">{active.name}</h2>
          <p className="text-xs text-muted-foreground">{active.description}</p>

          <RecipeFieldset title="Color mode">
            <div className="grid grid-cols-2 gap-1.5">
              {COLOR_MODES.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setColorMode(m.id)}
                  className={cn(
                    'text-[11px] rounded-md border px-2 py-1.5 transition-colors',
                    colorMode === m.id
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-secondary/30 hover:bg-secondary/60',
                  )}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </RecipeFieldset>

          <RecipeFieldset title="Recipe properties">
            <ul className="space-y-1 text-[11px]">
              {[
                ['Stroke', active.recipe.stroke ? 'On · 1.75px' : 'Off'],
                ['Fill', active.recipe.fill ? 'On' : 'Off'],
                ['Duotone', active.recipe.duotone ? 'On' : 'Off'],
                ['Mono', active.recipe.mono ? 'On' : 'Off'],
                ['Grid', '24 px'],
                ['Caps', 'Round'],
                ['Joins', 'Round'],
              ].map(([k, v]) => (
                <li
                  key={k}
                  className="flex items-center justify-between py-1 border-b border-border/40 last:border-0"
                >
                  <span className="text-muted-foreground">{k}</span>
                  <span className="font-medium">{v}</span>
                </li>
              ))}
            </ul>
          </RecipeFieldset>

          <div className="space-y-2">
            <div className="rounded-md border border-border/40 bg-card/40 p-2">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">
                Live preview · {getStyleSource(active).label}
              </div>
              <BundledIconLadder style={active} accent={detailAccent} count={6} tile={32} />
            </div>
            <Button size="sm" className="w-full gap-1.5" onClick={onStartGenerate}>
              <Wand2 className="h-3.5 w-3.5" />
              Apply to new set
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="w-full gap-1.5"
              onClick={() => {
                setApplyStyle(active);
                setApplyAccent(detailAccent);
              }}
              disabled={!organization?.id}
              title={!organization?.id ? 'Select an organization first' : undefined}
            >
              <LibraryIcon className="h-3.5 w-3.5" />
              Apply to imported pack…
            </Button>
          </div>
        </aside>
      </div>

      <StyleSystemDetailDialog
        style={BASE_STYLES.find((s) => s.id === detailId) ?? null}
        accent={detailAccent}
        onClose={() => setDetailId(null)}
        onApply={onStartGenerate}
        onApplyToBundled={(s) => {
          setApplyStyle(s);
          setApplyAccent(detailAccent);
        }}
      />

      <ApplyStyleToBundledDialog
        style={applyStyle}
        accent={applyAccent}
        organizationId={organization?.id}
        onClose={() => setApplyStyle(null)}
        onCreated={(id) => onLibraryCreated?.(id)}
      />
    </div>
  );
};

const RecipeFieldset = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div>
    <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">
      {title}
    </div>
    {children}
  </div>
);

// Tiny re-export so TS reads BaseStyle (silences unused import lint)
export type { BaseStyle };
