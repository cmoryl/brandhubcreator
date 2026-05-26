/**
 * DashboardView — enterprise studio dashboard (high-end visual revamp).
 *
 * Premium hero with animated gradient mesh, large stat tiles, rich recent-system
 * cards with real icon previews, and visually distinctive brand profile tiles.
 */

import {
  ArrowUpRight,
  Folder,
  Image as ImageIcon,
  Plus,
  Sparkles,
  Users,
  X,
  Layers,
  Wand2,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatusChip } from './StatusChip';

import { LibraryIconPreview } from './LibraryIconPreview';
import type { BrandIconography } from '@/types/brand';

import { useHiddenItems } from './useHiddenItems';
import type { SectionStatus } from './studioData';

interface BrandProfile {
  id: string;
  name: string;
  slug?: string;
  tone?: string;
  members?: number;
  entityType?: 'brand' | 'product' | 'event';
}

interface RecentLibrary {
  id: string;
  name: string;
  level?: 'core' | 'product_line' | 'brand';
  iconCount: number;
  isActive?: boolean;
  icons?: BrandIconography[];
}

interface Props {
  organizationName: string;
  totalIcons: number;
  totalLibraries: number;
  onStartGenerate: () => void;
  onNavigate?: (section: 'library' | 'sets' | 'export' | 'brands' | 'qa' | 'styles' | 'generate' | 'imported') => void;
  onOpenLibrary?: (libraryId: string) => void;
  recentLibraries?: RecentLibrary[];
  brandProfiles?: BrandProfile[];
  importedIconCount?: number;
}

const levelAccent = (lvl?: string) =>
  lvl === 'product_line'
    ? 'hsl(var(--tp-orange))'
    : lvl === 'brand'
    ? 'hsl(var(--tp-pink))'
    : 'hsl(var(--tp-digital-blue))';
const levelLabel = (lvl?: string) =>
  lvl === 'product_line' ? 'Product line' : lvl === 'brand' ? 'Brand' : 'Core';

const sampleEmojis = ['⚙️', '📊', '🔐', '🔌', '⚡', '🧩'];

/* -------------------------- Stat tile -------------------------- */
const StatTile = ({
  label,
  value,
  icon: Icon,
  accent,
  onClick,
}: {
  label: string;
  value: string;
  icon: typeof Sparkles;
  accent: string;
  onClick?: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    className="group relative overflow-hidden rounded-2xl border bg-card p-5 text-left transition-all hover:-translate-y-0.5 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-primary/40"
    style={{ borderColor: `color-mix(in oklab, ${accent} 22%, hsl(var(--border)))` }}
  >
    <div
      className="absolute inset-0 opacity-50 transition-opacity group-hover:opacity-80"
      style={{
        background: `radial-gradient(120% 90% at 100% 0%, ${accent} / 0.16, transparent 60%)`,
      }}
      aria-hidden
    />
    <div className="relative flex items-start justify-between">
      <div>
        <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          {label}
        </div>
        <div className="mt-2 text-3xl font-semibold tracking-tight">{value}</div>
      </div>
      <div
        className="flex h-10 w-10 items-center justify-center rounded-xl"
        style={{
          background: `color-mix(in oklab, ${accent} 16%, transparent)`,
          color: accent,
        }}
      >
        <Icon className="h-5 w-5" />
      </div>
    </div>
    <div className="relative mt-4 flex items-center gap-1 text-[11px] text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
      View <ArrowUpRight className="h-3 w-3" />
    </div>
  </button>
);

/* ------------------- Recent system card (rich) ------------------- */
const RecentSystemCard = ({
  lib,
  onClick,
}: {
  lib: RecentLibrary;
  onClick?: () => void;
}) => {
  const accent = levelAccent(lib.level);
  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative flex w-full flex-col gap-4 overflow-hidden rounded-2xl border bg-card p-5 text-left transition-all hover:-translate-y-0.5 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-primary/40"
      style={{ borderColor: `color-mix(in oklab, ${accent} 18%, hsl(var(--border)))` }}
    >
      <div
        className="absolute inset-x-0 top-0 h-24 opacity-60 transition-opacity group-hover:opacity-90"
        style={{
          background: `radial-gradient(80% 100% at 0% 0%, ${accent} / 0.22, transparent 70%)`,
        }}
        aria-hidden
      />
      <div className="relative flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
            {levelLabel(lib.level)}
          </div>
          <div className="mt-1 truncate text-base font-semibold">{lib.name}</div>
        </div>
        <StatusChip status={lib.isActive ? 'approved' : 'idle'} />
      </div>
      <div className="relative">
        <LibraryIconPreview
          icons={lib.icons}
          fallbackEmojis={sampleEmojis}
          accent={accent}
          count={6}
          size="md"
          tilePx={44}
        />
      </div>
      <div className="relative flex items-center justify-between text-[11px] text-muted-foreground">
        <span>{lib.iconCount} icons</span>
        <span className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          Open <ArrowUpRight className="h-3 w-3" />
        </span>
      </div>
    </button>
  );
};

export const DashboardView = ({
  organizationName,
  totalIcons,
  totalLibraries,
  onStartGenerate,
  onNavigate,
  onOpenLibrary,
  recentLibraries = [],
  brandProfiles = [],
  importedIconCount = 0,
}: Props) => {
  const { hidden: hiddenBrands, hide: hideBrand, clear: clearHiddenBrands, isHidden: isBrandHidden } =
    useHiddenItems('brand-profiles');
  const visibleBrandProfiles = brandProfiles.filter((b) => !isBrandHidden(b.id));

  return (
    <div className="space-y-10">
      {/* ============ HERO ============ */}
      <header className="relative overflow-hidden rounded-3xl border bg-card p-8 md:p-10">
        {/* animated gradient mesh */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(55% 70% at 10% 0%, hsl(var(--tp-digital-blue) / 0.35), transparent 70%), radial-gradient(45% 65% at 95% 20%, hsl(var(--tp-pink) / 0.22), transparent 70%), radial-gradient(60% 80% at 60% 110%, hsl(var(--tp-orange) / 0.18), transparent 70%)',
          }}
          aria-hidden
        />
        {/* subtle grid */}
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              'linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
          aria-hidden
        />
        <div className="relative flex flex-wrap items-end justify-between gap-8">
          <div className="max-w-2xl space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border bg-background/60 px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-muted-foreground backdrop-blur">
              <Sparkles className="h-3 w-3" />
              Icon production platform
            </div>
            <h1 className="text-4xl md:text-5xl font-semibold tracking-tight leading-[1.05]">
              Welcome back
              {organizationName ? (
                <>
                  ,{' '}
                  <span
                    className="bg-clip-text text-transparent"
                    style={{
                      backgroundImage:
                        'linear-gradient(120deg, hsl(var(--tp-digital-blue)), hsl(var(--tp-pink)))',
                    }}
                  >
                    {organizationName}
                  </span>
                </>
              ) : null}
            </h1>
            <p className="text-sm md:text-base text-muted-foreground max-w-xl leading-relaxed">
              Generate, QA, organize and export brand-consistent icon systems at scale —
              with industry packs, preflight discipline, and production-ready bundles.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="lg" className="gap-2 rounded-xl" onClick={() => onNavigate?.('library')}>
              <Folder className="h-4 w-4" />
              Open library
            </Button>
            <Button
              size="lg"
              className="gap-2 rounded-xl shadow-lg"
              style={{
                background:
                  'linear-gradient(120deg, hsl(var(--tp-digital-blue)), hsl(var(--tp-pink)))',
                color: 'white',
              }}
              onClick={onStartGenerate}
            >
              <Wand2 className="h-4 w-4" />
              New icon system
            </Button>
          </div>
        </div>

        {/* Stat tiles */}
        <div className="relative mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatTile
            label="Total icons"
            value={totalIcons.toLocaleString()}
            icon={Sparkles}
            accent="hsl(var(--tp-digital-blue))"
            onClick={() => onNavigate?.('library')}
          />
          <StatTile
            label="Libraries"
            value={totalLibraries.toLocaleString()}
            icon={Layers}
            accent="hsl(var(--tp-pink))"
            onClick={() => onNavigate?.('sets')}
          />
          <StatTile
            label="Imported"
            value={importedIconCount.toLocaleString()}
            icon={ImageIcon}
            accent="hsl(var(--tp-teal))"
            onClick={() => onNavigate?.('imported')}
          />
          <StatTile
            label="Brands"
            value={visibleBrandProfiles.length.toLocaleString()}
            icon={Users}
            accent="hsl(var(--tp-orange))"
            onClick={() => onNavigate?.('brands')}
          />
        </div>
      </header>

      {/* ============ RECENT SYSTEMS ============ */}
      <section>
        <header className="mb-4 flex items-end justify-between">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">Recent icon systems</h2>
            <p className="text-xs text-muted-foreground">
              Jump back into the libraries you touched most recently.
            </p>
          </div>
          <Button variant="ghost" size="sm" className="h-8 gap-1 text-xs" onClick={() => onNavigate?.('sets')}>
            View all <ArrowUpRight className="h-3 w-3" />
          </Button>
        </header>

        {recentLibraries.length === 0 ? (
          <div className="rounded-2xl border border-dashed bg-card/40 p-10 text-center">
            <div
              className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl"
              style={{
                background: 'color-mix(in oklab, hsl(var(--tp-digital-blue)) 14%, transparent)',
                color: 'hsl(var(--tp-digital-blue))',
              }}
            >
              <Wand2 className="h-6 w-6" />
            </div>
            <div className="text-sm font-medium">No icon systems yet</div>
            <p className="mx-auto mt-1 max-w-sm text-xs text-muted-foreground">
              Generate your first system to see it featured here with a live preview.
            </p>
            <Button size="sm" className="mt-4 gap-1.5" onClick={onStartGenerate}>
              <Plus className="h-3.5 w-3.5" /> New icon system
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {recentLibraries.slice(0, 8).map((lib) => (
              <RecentSystemCard
                key={lib.id}
                lib={lib}
                onClick={() => onOpenLibrary?.(lib.id)}
              />
            ))}
          </div>
        )}
      </section>

      {/* ============ IMPORTED ASSETS ============ */}
      {importedIconCount > 0 && (
        <section
          className="relative overflow-hidden rounded-2xl border p-6"
          style={{
            background:
              'linear-gradient(120deg, color-mix(in oklab, hsl(var(--tp-teal)) 10%, hsl(var(--card))) 0%, hsl(var(--card)) 70%)',
          }}
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div
                className="flex h-14 w-14 items-center justify-center rounded-2xl"
                style={{
                  background: 'color-mix(in oklab, hsl(var(--tp-teal)) 18%, transparent)',
                  color: 'hsl(var(--tp-teal))',
                }}
              >
                <ImageIcon className="h-7 w-7" />
              </div>
              <div>
                <h3 className="text-base font-semibold">Curated imported library</h3>
                <p className="text-xs text-muted-foreground">
                  {importedIconCount.toLocaleString()} bundled SVG icons · light-blue & white
                  variants · searchable · copy-ready
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => onNavigate?.('imported')}>
              Browse imported <ArrowUpRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </section>
      )}

      {/* ============ BRAND PROFILES ============ */}
      <section>
        <header className="mb-4 flex items-end justify-between">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">Brand profiles</h2>
            <p className="text-xs text-muted-foreground">
              Profiles influence generation, QA, and export defaults.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {hiddenBrands.size > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-[11px]"
                onClick={clearHiddenBrands}
              >
                Restore {hiddenBrands.size} hidden
              </Button>
            )}
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => onNavigate?.('brands')}>
              <Plus className="h-3.5 w-3.5" />
              New brand
            </Button>
          </div>
        </header>

        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {(visibleBrandProfiles.length > 0
            ? visibleBrandProfiles
            : [{ id: 'placeholder', name: organizationName || 'Your brand', tone: 'Add brands to see them here', members: 0 } as typeof visibleBrandProfiles[number]]
          ).map((b, idx) => {
            const isPlaceholder = b.id === 'placeholder';
            const palette = [
              'hsl(var(--tp-digital-blue))',
              'hsl(var(--tp-pink))',
              'hsl(var(--tp-orange))',
              'hsl(var(--tp-teal))',
            ];
            const accent = palette[idx % palette.length];
            const initials = b.name
              .split(/\s+/)
              .slice(0, 2)
              .map((p) => p[0])
              .join('')
              .toUpperCase();

            const inner = (
              <div
                className="group relative h-full overflow-hidden rounded-2xl border bg-card p-4 transition-all hover:-translate-y-0.5 hover:shadow-xl"
                style={{ borderColor: `color-mix(in oklab, ${accent} 20%, hsl(var(--border)))` }}
              >
                <div
                  className="absolute inset-x-0 top-0 h-16 opacity-60"
                  style={{
                    background: `radial-gradient(80% 100% at 0% 0%, ${accent} / 0.20, transparent 70%)`,
                  }}
                  aria-hidden
                />
                <div className="relative flex items-start gap-3">
                  <div
                    className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl text-sm font-semibold"
                    style={{
                      background: `color-mix(in oklab, ${accent} 18%, transparent)`,
                      color: accent,
                    }}
                  >
                    {initials || '★'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-semibold">{b.name}</span>
                      <div className="flex items-center gap-1">
                        {typeof b.members === 'number' && b.members > 0 && (
                          <Badge variant="secondary" className="gap-1 text-[10px]">
                            <Users className="h-3 w-3" />
                            {b.members}
                          </Badge>
                        )}
                        {!isPlaceholder && (
                          <button
                            type="button"
                            aria-label={`Hide ${b.name} from dashboard`}
                            title="Hide from dashboard"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              hideBrand(b.id);
                            }}
                            className="inline-flex h-5 w-5 items-center justify-center rounded-md text-muted-foreground opacity-0 transition-opacity hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    </div>
                    {b.tone && (
                      <div className="mt-0.5 line-clamp-2 text-[11px] text-muted-foreground">
                        {b.tone}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );

            return (
              <li key={b.id}>
                {b.slug ? (
                  <Link to={`/icon-studio/${b.entityType || 'brand'}/${b.slug}`} className="block h-full">
                    {inner}
                  </Link>
                ) : (
                  inner
                )}
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
};
