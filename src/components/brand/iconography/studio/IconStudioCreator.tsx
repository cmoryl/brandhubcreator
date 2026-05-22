/**
 * IconStudioCreator — calm browse-first library hub.
 *
 * Reframed (v2): the prior 4-mode card strip and quick-start packs were
 * overwhelming. Users primarily want to *browse and view* the library;
 * advanced add-modes (AI / Upload / Custom SVG) are tucked into a small
 * "More ways to add" menu so they're discoverable but out of the way.
 *
 * Popular collections now render *real* sample icons from the Iconify CDN
 * so users see at a glance what each library actually looks like.
 */

import { useMemo, useState } from 'react';
import {
  Library as LibraryIcon,
  Code as CodeIcon,
  ImageIcon,
  Sparkles,
  Search,
  ArrowRight,
  Plus,
} from 'lucide-react';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { BrandIconography } from '@/types/brand';
import { IconLibrary } from '@/hooks/useIconLibraries';
import { LucideIconPicker } from './creator/LucideIconPicker';
import { CustomSvgImporter } from './creator/CustomSvgImporter';
import { AiIconSuggestions } from './creator/AiIconSuggestions';
import { IconStylizer } from './IconStylizer';
import { IconBrowser } from './IconBrowser';

interface IconStudioCreatorProps {
  organizationId: string;
  brandColors: Array<{ hex: string; name: string }>;
  libraries: IconLibrary[];
  onSaveIcons: (icons: BrandIconography[], libraryId?: string) => void;
}

type Mode = 'browse' | 'ai' | 'upload' | 'custom' | 'lucide';

/* -------------------------------------------------------------------------- */
/* Popular collections — each rendered with real sample icons via Iconify CDN */
/* -------------------------------------------------------------------------- */

interface Spotlight {
  prefix: string;
  name: string;
  vibe: string;
  samples: string[]; // icon names within the prefix
}

const SPOTLIGHT_COLLECTIONS: Spotlight[] = [
  { prefix: 'lucide', name: 'Lucide', vibe: 'Clean line · 1.5K',
    samples: ['rocket', 'sparkles', 'shield', 'compass', 'leaf', 'star'] },
  { prefix: 'tabler', name: 'Tabler', vibe: '6K+ outline icons',
    samples: ['home', 'settings', 'user', 'bell', 'heart', 'message'] },
  { prefix: 'ph', name: 'Phosphor', vibe: 'Flexible · 9K',
    samples: ['airplane', 'camera', 'chat-circle', 'lightning', 'globe', 'coffee'] },
  { prefix: 'solar', name: 'Solar', vibe: 'Duotone family',
    samples: ['home-bold-duotone', 'settings-bold-duotone', 'user-bold-duotone',
      'bell-bold-duotone', 'heart-bold-duotone', 'star-bold-duotone'] },
  { prefix: 'heroicons', name: 'Heroicons', vibe: 'Tailwind UI · 300',
    samples: ['home', 'cog-6-tooth', 'user', 'bell', 'heart', 'star'] },
  { prefix: 'fluent', name: 'Fluent UI', vibe: 'Microsoft · 18K',
    samples: ['home-24-regular', 'settings-24-regular', 'person-24-regular',
      'alert-24-regular', 'heart-24-regular', 'star-24-regular'] },
  { prefix: 'mdi', name: 'Material', vibe: 'Google · 7K',
    samples: ['home', 'cog', 'account', 'bell', 'heart', 'star'] },
  { prefix: 'carbon', name: 'Carbon', vibe: 'IBM · 2K',
    samples: ['home', 'settings', 'user', 'notification', 'favorite', 'star'] },
  { prefix: 'feather', name: 'Feather', vibe: 'Minimal · 280',
    samples: ['home', 'settings', 'user', 'bell', 'heart', 'star'] },
  { prefix: 'simple-icons', name: 'Brand Logos', vibe: '3K logos',
    samples: ['github', 'figma', 'slack', 'notion', 'linear', 'vercel'] },
];

const iconUrl = (prefix: string, name: string, hex: string) =>
  `https://api.iconify.design/${prefix}/${name}.svg?color=${encodeURIComponent(hex)}`;

/* -------------------------------------------------------------------------- */

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
  const [advancedOpen, setAdvancedOpen] = useState<null | 'ai' | 'upload' | 'custom' | 'lucide'>(null);

  const totalIcons = useMemo(
    () => libraries.reduce((s, l) => s + l.icons.length, 0),
    [libraries],
  );

  const previewHex = brandColors[0]?.hex || '#0F1E3D';

  const focusWorkbench = () => {
    requestAnimationFrame(() => {
      document.getElementById('icon-creator-workbench')?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    });
  };

  const handleSpotlightClick = (prefix: string) => {
    setMode('browse');
    setBrowserSeed({ library: prefix });
    focusWorkbench();
  };

  const handleSearch = () => {
    const q = globalSearch.trim();
    if (!q) return;
    setMode('browse');
    setBrowserSeed({ query: q });
    focusWorkbench();
  };

  /* ------------------------------ render ------------------------------ */

  return (
    <div className="space-y-6">
      {/* ============= Hero ============= */}
      <section className="relative overflow-hidden rounded-xl border bg-gradient-to-br from-card via-card to-secondary/30 p-6">
        <div
          aria-hidden
          className="absolute inset-0 opacity-50"
          style={{
            background:
              'radial-gradient(60% 80% at 100% 0%, hsl(var(--tp-digital-blue) / 0.15), transparent 70%)',
          }}
        />
        <div className="relative flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              <LibraryIcon className="h-3.5 w-3.5" />
              <span>Browse the icon library</span>
            </div>
            <h2 className="mt-2 text-2xl md:text-3xl font-semibold tracking-tight">
              Find any icon, fast.
            </h2>
            <p className="text-sm text-muted-foreground max-w-2xl">
              Search 200,000+ open-source icons across 21 curated collections.
              Click a collection below to start browsing — or search by keyword.
            </p>
          </div>

          {/* Advanced add modes — tucked into a single menu */}
          <div className="flex items-center gap-2">
            {libraries.length > 0 && (
              <div className="flex items-center gap-2 rounded-lg border bg-background/70 backdrop-blur-sm px-3 py-2">
                <Label className="text-[10px] uppercase tracking-wider text-muted-foreground whitespace-nowrap">
                  Save to
                </Label>
                <Select
                  value={selectedLibraryId || 'auto'}
                  onValueChange={(v) => setSelectedLibraryId(v === 'auto' ? '' : v)}
                >
                  <SelectTrigger className="h-8 min-w-[160px] border-0 bg-transparent text-xs">
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

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1.5 h-9">
                  <Plus className="h-3.5 w-3.5" /> Add your own
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  More ways to add
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => { setAdvancedOpen('ai'); }}>
                  <Sparkles className="h-4 w-4 mr-2" /> AI generate
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { setAdvancedOpen('upload'); }}>
                  <ImageIcon className="h-4 w-4 mr-2" /> Upload &amp; stylize
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { setAdvancedOpen('custom'); }}>
                  <CodeIcon className="h-4 w-4 mr-2" /> Paste custom SVG
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { setAdvancedOpen('lucide'); }}>
                  <LibraryIcon className="h-4 w-4 mr-2" /> Lucide-only picker
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
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
          </div>
          <Button onClick={handleSearch} disabled={!globalSearch.trim()} className="gap-1.5 h-11">
            Search <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>

        {/* Stats row */}
        <div className="relative mt-4 flex flex-wrap gap-x-6 gap-y-1 text-[11px] text-muted-foreground">
          <span>21 curated libraries</span>
          <span>·</span>
          <span>200K+ icons</span>
          <span>·</span>
          <span>{totalIcons} in your workspace</span>
        </div>
      </section>

      {/* ============= Popular collections with real sample icons ============= */}
      <section>
        <div className="mb-3 flex items-end justify-between">
          <div>
            <h3 className="text-sm font-semibold">Popular collections</h3>
            <p className="text-[11px] text-muted-foreground">
              Click a card to browse the full library
            </p>
          </div>
        </div>
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {SPOTLIGHT_COLLECTIONS.map((c) => (
            <button
              key={c.prefix}
              onClick={() => handleSpotlightClick(c.prefix)}
              className="group rounded-xl border bg-card p-4 text-left transition-all hover:border-primary/50 hover:shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-semibold truncate">{c.name}</div>
                  <div className="text-[11px] text-muted-foreground truncate">{c.vibe}</div>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-1" />
              </div>
              {/* Real icon sample strip */}
              <div className="mt-3 grid grid-cols-6 gap-1.5">
                {c.samples.map((s) => (
                  <div
                    key={s}
                    className="aspect-square rounded-md border bg-background/50 flex items-center justify-center p-1.5"
                  >
                    <img
                      src={iconUrl(c.prefix, s, previewHex)}
                      alt=""
                      className="h-full w-full"
                      loading="lazy"
                      onError={(e) => {
                        // Hide broken samples gracefully
                        (e.currentTarget as HTMLImageElement).style.opacity = '0';
                      }}
                    />
                  </div>
                ))}
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* ============= Workbench — the browser docked below ============= */}
      <section
        id="icon-creator-workbench"
        className="rounded-xl border bg-card p-4 md:p-5 scroll-mt-4"
      >
        <header className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold">
              {browserSeed.library
                ? `Browsing ${SPOTLIGHT_COLLECTIONS.find((s) => s.prefix === browserSeed.library)?.name ?? browserSeed.library}`
                : browserSeed.query
                  ? `Results for "${browserSeed.query}"`
                  : 'All libraries'}
            </h3>
            <p className="text-[11px] text-muted-foreground">
              Click any icon to add it to your selected library.
            </p>
          </div>
          {(browserSeed.library || browserSeed.query) && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={() => setBrowserSeed({})}
            >
              Show all libraries
            </Button>
          )}
        </header>

        <IconBrowser
          key={`${browserSeed.library ?? 'any'}-${browserSeed.query ?? ''}`}
          brandColors={brandColors}
          onAddIcon={(icon) => onSaveIcons([icon], selectedLibraryId || undefined)}
        />
      </section>

      {/* ============= Advanced add modes — opened from "Add your own" menu ============= */}
      <Dialog open={!!advancedOpen} onOpenChange={(o) => !o && setAdvancedOpen(null)}>
        <DialogContent className="max-w-3xl max-h-[88vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {advancedOpen === 'ai' && 'AI icon suggestions'}
              {advancedOpen === 'upload' && 'Upload & stylize'}
              {advancedOpen === 'custom' && 'Paste custom SVG'}
              {advancedOpen === 'lucide' && 'Lucide icon picker'}
            </DialogTitle>
            <DialogDescription>
              {advancedOpen === 'ai' && 'Describe what you need — AI drafts tailored glyphs.'}
              {advancedOpen === 'upload' && 'Drop SVGs or images, then apply your brand recipe.'}
              {advancedOpen === 'custom' && 'For one-off marks, logos, or hand-tuned paths.'}
              {advancedOpen === 'lucide' && 'Browse the full Lucide set with a focused picker.'}
            </DialogDescription>
          </DialogHeader>
          <div className="pt-2">
            {advancedOpen === 'ai' && (
              <AiIconSuggestions
                organizationId={organizationId}
                brandColors={brandColors}
                selectedLibraryId={selectedLibraryId}
                onSaveIcons={onSaveIcons}
              />
            )}
            {advancedOpen === 'upload' && (
              <IconStylizer
                brandColors={brandColors.map((c) => c.hex)}
                onIconCreated={(icon) =>
                  onSaveIcons([icon], selectedLibraryId || undefined)
                }
              />
            )}
            {advancedOpen === 'custom' && (
              <CustomSvgImporter
                selectedLibraryId={selectedLibraryId}
                onSaveIcons={onSaveIcons}
              />
            )}
            {advancedOpen === 'lucide' && (
              <LucideIconPicker
                brandColors={brandColors}
                selectedLibraryId={selectedLibraryId}
                onSaveIcons={onSaveIcons}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* mode is kept in state for potential future use but currently unused */}
      <span className="hidden">{mode}</span>
    </div>
  );
};
