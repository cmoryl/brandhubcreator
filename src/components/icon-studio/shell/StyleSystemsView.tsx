/**
 * StyleSystemsView — gallery of the 18 base styles as reusable recipes
 * with mini-previews and a "Apply to set" action.
 */

import { useMemo, useState } from 'react';
import { Palette, Wand2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { IconSetPreview } from './IconSetPreview';
import { BASE_STYLES, COLOR_MODES, type BaseStyle } from './studioData';
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

const SAMPLE_EMOJIS = ['⚙️', '📊', '🔐', '🔌', '⚡', '🧩'];

interface Props {
  onStartGenerate?: () => void;
}

export const StyleSystemsView = ({ onStartGenerate }: Props) => {
  const [q, setQ] = useState('');
  const [activeId, setActiveId] = useState<string>(BASE_STYLES[0].id);
  const [colorMode, setColorMode] = useState<string>('mono');

  const filtered = useMemo(() => {
    if (!q.trim()) return BASE_STYLES;
    const t = q.toLowerCase();
    return BASE_STYLES.filter(
      (s) => s.name.toLowerCase().includes(t) || s.description.toLowerCase().includes(t),
    );
  }, [q]);

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
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {filtered.map((s, i) => {
              const isActive = s.id === activeId;
              const accent = `hsl(var(${ACCENTS[i % ACCENTS.length]}))`;
              return (
                <button
                  key={s.id}
                  onClick={() => setActiveId(s.id)}
                  className={cn(
                    'tp-card tp-card-interactive p-4 text-left relative',
                    isActive && 'ring-2 ring-primary',
                  )}
                >
                  {isActive && (
                    <Check
                      className="absolute top-3 right-3 h-4 w-4"
                      style={{ color: 'hsl(var(--tp-green))' }}
                    />
                  )}
                  <h3 className="text-sm font-semibold">{s.name}</h3>
                  <p className="text-[11px] text-muted-foreground mb-3 min-h-[2rem]">
                    {s.description}
                  </p>
                  <IconSetPreview
                    emojis={SAMPLE_EMOJIS}
                    accent={accent}
                    accent2={s.preview.accent2 ? `hsl(var(--${s.preview.accent2}))` : undefined}
                    size="sm"
                    count={6}
                    variant={s.preview.variant}
                    radius={s.preview.radius}
                    strokeWidth={s.preview.strokeWidth}
                  />
                  <div className="mt-3 flex flex-wrap gap-1">
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
                </button>
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

          <Button size="sm" className="w-full gap-1.5" onClick={onStartGenerate}>
            <Wand2 className="h-3.5 w-3.5" />
            Apply to new set
          </Button>
        </aside>
      </div>
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
