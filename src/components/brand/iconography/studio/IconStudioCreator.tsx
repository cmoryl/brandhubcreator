/**
 * IconStudioCreator — preset asset library hub.
 *
 * Reframes the old 5-tab strip into a friendlier flow:
 *   1. Hero with global search + contextual "Save to library" chip
 *   2. Visual mode cards (Browse / AI / Upload / Custom SVG)
 *   3. Popular collections grid (one-click into a library)
 *   4. Quick-start packs (preset bundles from CORE_SECTIONS)
 *   5. The full IconBrowser docked below as the working surface
 */

import { useMemo, useState } from 'react';
import {
  Library as LibraryIcon,
  Code as CodeIcon,
  ImageIcon,
  Sparkles,
  Globe,
  Search,
  ArrowRight,
  Zap,
  Layers,
  Star,
  ChevronDown,
} from 'lucide-react';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { BrandIconography } from '@/types/brand';
import { IconLibrary } from '@/hooks/useIconLibraries';
import { LucideIconPicker } from './creator/LucideIconPicker';
import { CustomSvgImporter } from './creator/CustomSvgImporter';
import { AiIconSuggestions } from './creator/AiIconSuggestions';
import { IconStylizer } from './IconStylizer';
import { IconBrowser } from './IconBrowser';
import { FEATURED_LIBRARIES } from '@/lib/api/iconify';
import { CORE_SECTIONS } from '@/components/icon-studio/shell/studioData';

interface IconStudioCreatorProps {
  organizationId: string;
  brandColors: Array<{ hex: string; name: string }>;
  libraries: IconLibrary[];
  onSaveIcons: (icons: BrandIconography[], libraryId?: string) => void;
}

type Mode = 'browse' | 'ai' | 'upload' | 'custom' | 'lucide';

const MODES: Array<{
  id: Mode;
  label: string;
  description: string;
  icon: typeof Globe;
  token: string;
  badge?: string;
}> = [
  { id: 'browse', label: 'Browse libraries', description: '50K+ icons across 21 curated collections', icon: Globe, token: '--tp-digital-blue', badge: 'Popular' },
  { id: 'ai', label: 'AI Generate', description: 'Describe what you need — get tailored suggestions', icon: Sparkles, token: '--tp-purple', badge: 'New' },
  { id: 'upload', label: 'Upload & stylize', description: 'Drop SVGs / images, apply brand recipe', icon: ImageIcon, token: '--tp-pink' },
  { id: 'custom', label: 'Paste custom SVG', description: 'For one-off marks, logos, or hand-tuned paths', icon: CodeIcon, token: '--tp-orange' },
];

// Pretty preset bundles users can one-click into the working library.
const QUICK_PACKS = CORE_SECTIONS.slice(0, 8).map((s) => ({
  id: s.id,
  name: s.name,
  count: s.defaultCount,
  desc: s.description,
}));

// Featured collections we want to spotlight as visual chips.
const SPOTLIGHT_COLLECTIONS = [
  { prefix: 'lucide', name: 'Lucide', vibe: 'Clean line', token: '--tp-digital-blue' },
  { prefix: 'tabler', name: 'Tabler', vibe: '6K+ icons', token: '--tp-teal' },
  { prefix: 'ph', name: 'Phosphor', vibe: 'Flexible', token: '--tp-purple' },
  { prefix: 'solar', name: 'Solar', vibe: 'Duotone', token: '--tp-orange' },
  { prefix: 'heroicons', name: 'Heroicons', vibe: 'Tailwind UI', token: '--tp-pink' },
  { prefix: 'fluent', name: 'Fluent UI', vibe: 'Microsoft', token: '--tp-light-blue' },
  { prefix: 'ic', name: 'Material', vibe: 'Google', token: '--tp-green' },
  { prefix: 'carbon', name: 'Carbon', vibe: 'IBM', token: '--tp-dark-blue' },
  { prefix: 'feather', name: 'Feather', vibe: 'Minimal', token: '--tp-digital-blue' },
  { prefix: 'simple-icons', name: 'Brand', vibe: '3K logos', token: '--tp-pink' },
];

export const IconStudioCreator = ({
  organizationId,
  brandColors,
  libraries,
  onSaveIcons,
}: IconStudioCreatorProps) => {
  const [mode, setMode] = useState<Mode>('browse');
  const [selectedLibraryId, setSelectedLibraryId] = useState('');
  const [globalSearch, setGlobalSearch] = useState('');
  const [browserSeed, setBrowserSeed] = useState<{ query?: string; library?: string }>({});

  const totalIcons = useMemo(
    () => libraries.reduce((s, l) => s + l.icons.length, 0),
    [libraries],
  );

  const handleSpotlightClick = (prefix: string) => {
    setMode('browse');
    setBrowserSeed({ library: prefix });
    // Scroll to the working surface
    requestAnimationFrame(() => {
      document.getElementById('icon-creator-workbench')?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    });
  };

  const handleSearch = () => {
    const q = globalSearch.trim();
    if (!q) return;
    setMode('browse');
    setBrowserSeed({ query: q });
    requestAnimationFrame(() => {
      document.getElementById('icon-creator-workbench')?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    });
  };

  const handlePackPick = (packId: string) => {
    // For now, surface AI suggestions seeded with the section name as the prompt.
    const pack = QUICK_PACKS.find((p) => p.id === packId);
    if (!pack) return;
    setMode('ai');
    setBrowserSeed({ query: `${pack.name} icon set — ${pack.desc}` });
    requestAnimationFrame(() => {
      document.getElementById('icon-creator-workbench')?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    });
  };

  return (
    <div className="space-y-6">
      {/* ============= Hero ============= */}
      <section className="relative overflow-hidden rounded-xl border bg-gradient-to-br from-card via-card to-secondary/30 p-6">
        <div
          aria-hidden
          className="absolute inset-0 opacity-50"
          style={{
            background:
              'radial-gradient(60% 80% at 100% 0%, hsl(var(--tp-digital-blue) / 0.15), transparent 70%), radial-gradient(40% 60% at 0% 100%, hsl(var(--tp-purple) / 0.12), transparent 70%)',
          }}
        />
        <div className="relative flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              <LibraryIcon className="h-3.5 w-3.5" />
              <span>Preset asset library</span>
            </div>
            <h2 className="mt-2 text-2xl md:text-3xl font-semibold tracking-tight">
              Find or create any icon — fast.
            </h2>
            <p className="text-sm text-muted-foreground max-w-2xl">
              Search 200,000+ open-source icons, drop in your own SVGs, or let AI design
              missing glyphs for your brand. Everything saves into your working library.
            </p>
          </div>

          {/* Save target — moved into hero as a contextual chip */}
          {libraries.length > 0 && (
            <div className="flex items-center gap-2 rounded-lg border bg-background/70 backdrop-blur-sm px-3 py-2">
              <Label className="text-[10px] uppercase tracking-wider text-muted-foreground whitespace-nowrap">
                Save to
              </Label>
              <Select
                value={selectedLibraryId || 'auto'}
                onValueChange={(v) => setSelectedLibraryId(v === 'auto' ? '' : v)}
              >
                <SelectTrigger className="h-8 min-w-[180px] border-0 bg-transparent text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">Auto · first Core library</SelectItem>
                  {libraries.filter((l) => l.is_active).map((lib) => (
                    <SelectItem key={lib.id} value={lib.id}>
                      {lib.name} ({lib.icons.length})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* Global search */}
        <div className="relative mt-5 flex items-center gap-2">
          <div className="relative flex-1 max-w-2xl">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Search icons across all libraries…  (try: rocket, shield, chart, leaf)"
              className="h-11 pl-9 pr-24 bg-background/70 backdrop-blur"
            />
            <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden md:flex items-center gap-0.5 rounded border bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
              ⌘K
            </kbd>
          </div>
          <Button onClick={handleSearch} disabled={!globalSearch.trim()} className="gap-1.5 h-11">
            Search <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>

        {/* Stats row */}
        <div className="relative mt-5 flex flex-wrap gap-x-6 gap-y-2 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Layers className="h-3.5 w-3.5" /> {FEATURED_LIBRARIES.length} curated libraries
          </span>
          <span className="flex items-center gap-1.5">
            <Star className="h-3.5 w-3.5" /> 200K+ icons available
          </span>
          <span className="flex items-center gap-1.5">
            <Zap className="h-3.5 w-3.5" /> {totalIcons} in your workspace
          </span>
        </div>
      </section>

      {/* ============= Mode cards ============= */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold">How would you like to add icons?</h3>
          <span className="text-[11px] text-muted-foreground">Pick a mode</span>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {MODES.map((m) => {
            const Icon = m.icon;
            const active = mode === m.id;
            return (
              <button
                key={m.id}
                onClick={() => setMode(m.id)}
                className={cn(
                  'group relative overflow-hidden rounded-xl border p-4 text-left transition-all',
                  active
                    ? 'border-primary bg-primary/5 shadow-sm'
                    : 'border-border bg-card hover:border-primary/40 hover:bg-secondary/30',
                )}
              >
                <div
                  className="absolute -top-8 -right-8 h-24 w-24 rounded-full opacity-30 transition-opacity group-hover:opacity-50"
                  style={{ background: `hsl(var(${m.token}) / 0.2)` }}
                  aria-hidden
                />
                <div className="relative flex items-start justify-between">
                  <div
                    className="h-9 w-9 rounded-lg flex items-center justify-center"
                    style={{
                      background: `hsl(var(${m.token}) / 0.14)`,
                      color: `hsl(var(${m.token}))`,
                    }}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  {m.badge && (
                    <Badge variant="secondary" className="text-[9px] uppercase tracking-wider">
                      {m.badge}
                    </Badge>
                  )}
                </div>
                <div className="relative mt-3 text-sm font-semibold">{m.label}</div>
                <p className="relative text-[11px] text-muted-foreground mt-0.5">
                  {m.description}
                </p>
              </button>
            );
          })}
        </div>
      </section>

      {/* ============= Spotlight collections — only when in Browse mode ============= */}
      {mode === 'browse' && (
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold">Popular collections</h3>
            <span className="text-[11px] text-muted-foreground">
              One-click jump to a library
            </span>
          </div>
          <div className="grid gap-2 grid-cols-2 sm:grid-cols-3 md:grid-cols-5">
            {SPOTLIGHT_COLLECTIONS.map((c) => (
              <button
                key={c.prefix}
                onClick={() => handleSpotlightClick(c.prefix)}
                className="group flex items-center gap-3 rounded-lg border bg-card p-3 text-left transition-colors hover:border-primary/40 hover:bg-secondary/30"
              >
                <div
                  className="h-10 w-10 rounded-md flex items-center justify-center text-sm font-bold flex-shrink-0"
                  style={{
                    background: `hsl(var(${c.token}) / 0.14)`,
                    color: `hsl(var(${c.token}))`,
                  }}
                >
                  {c.name.slice(0, 1)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-semibold truncate">{c.name}</div>
                  <div className="text-[10px] text-muted-foreground truncate">{c.vibe}</div>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            ))}
          </div>
        </section>
      )}

      {/* ============= Quick start packs — only when in Browse mode ============= */}
      {mode === 'browse' && (
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold">Quick-start packs</h3>
            <span className="text-[11px] text-muted-foreground">
              Curated sets — instantly drafted by AI
            </span>
          </div>
          <div className="grid gap-2 grid-cols-2 sm:grid-cols-3 md:grid-cols-4">
            {QUICK_PACKS.map((p) => (
              <button
                key={p.id}
                onClick={() => handlePackPick(p.id)}
                className="group rounded-lg border bg-card p-3 text-left transition-colors hover:border-primary/40 hover:bg-secondary/30"
              >
                <div className="flex items-center justify-between">
                  <div className="text-xs font-semibold">{p.name}</div>
                  <Badge variant="outline" className="text-[10px]">
                    {p.count}
                  </Badge>
                </div>
                <p className="mt-1 text-[10px] text-muted-foreground line-clamp-2">
                  {p.desc}
                </p>
                <div className="mt-2 flex items-center gap-1 text-[10px] text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                  <Sparkles className="h-3 w-3" /> Draft with AI
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* ============= Workbench (the active mode) ============= */}
      <section
        id="icon-creator-workbench"
        className="rounded-xl border bg-card p-4 md:p-5 scroll-mt-4"
      >
        <header className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold">
              {mode === 'browse' && 'Browse the library'}
              {mode === 'ai' && 'AI icon suggestions'}
              {mode === 'upload' && 'Upload & stylize'}
              {mode === 'custom' && 'Paste custom SVG'}
              {mode === 'lucide' && 'Lucide library'}
            </h3>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs gap-1"
            onClick={() => setMode('lucide')}
          >
            <LibraryIcon className="h-3.5 w-3.5" /> Lucide-only picker
          </Button>
        </header>

        {mode === 'browse' && (
          <IconBrowser
            key={`${browserSeed.library ?? 'any'}-${browserSeed.query ?? ''}`}
            brandColors={brandColors}
            onAddIcon={(icon) => onSaveIcons([icon], selectedLibraryId || undefined)}
          />
        )}

        {mode === 'lucide' && (
          <LucideIconPicker
            brandColors={brandColors}
            selectedLibraryId={selectedLibraryId}
            onSaveIcons={onSaveIcons}
          />
        )}

        {mode === 'custom' && (
          <CustomSvgImporter
            selectedLibraryId={selectedLibraryId}
            onSaveIcons={onSaveIcons}
          />
        )}

        {mode === 'upload' && (
          <IconStylizer
            brandColors={brandColors.map((c) => c.hex)}
            onIconCreated={(icon) =>
              onSaveIcons([icon], selectedLibraryId || undefined)
            }
          />
        )}

        {mode === 'ai' && (
          <AiIconSuggestions
            organizationId={organizationId}
            brandColors={brandColors}
            selectedLibraryId={selectedLibraryId}
            onSaveIcons={onSaveIcons}
          />
        )}
      </section>
    </div>
  );
};
