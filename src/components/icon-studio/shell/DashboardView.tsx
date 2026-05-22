/**
 * DashboardView — enterprise studio dashboard.
 *
 * Cards: recent systems, active drafts, approved sets, needs review,
 * export history, brand profiles, production volume sparkline, QA health gauge.
 *
 * Phase 1 ships static/derived data so the surface is wired and visible. Live
 * data hooks come in Phase 4 with the Supabase persistence layer.
 */

import {
  ArrowUpRight,
  Download,
  Folder,
  Plus,
  Sparkles,
  Users,
  X,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatusChip } from './StatusChip';
import { IconSetPreview } from './IconSetPreview';
import { LibraryIconPreview } from './LibraryIconPreview';
import type { BrandIconography } from '@/types/brand';
import { GoldenPathCard } from '@/components/icon-studio/GoldenPathCard';
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
}

interface Props {
  organizationName: string;
  /** Total icons across saved libraries */
  totalIcons: number;
  /** Total saved libraries */
  totalLibraries: number;
  onStartGenerate: () => void;
  /** Navigate to another shell section (library, sets, export, brands, qa, styles). */
  onNavigate?: (section: 'library' | 'sets' | 'export' | 'brands' | 'qa' | 'styles' | 'generate') => void;
  /** Open a specific library's detail dialog. */
  onOpenLibrary?: (libraryId: string) => void;
  /** Recent saved libraries (most recently created/updated first). */
  recentLibraries?: RecentLibrary[];
  /** Real brand profiles loaded from the org. */
  brandProfiles?: BrandProfile[];
}

const ActivityRow = ({
  title,
  meta,
  status,
  emojis,
  accent,
  onClick,
}: {
  title: string;
  meta: string;
  status: SectionStatus;
  emojis: string[];
  accent: string;
  onClick?: () => void;
}) => (
  <li>
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-secondary/60 focus:outline-none focus:ring-2 focus:ring-primary/40"
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <IconSetPreview emojis={emojis} accent={accent} size="sm" count={4} variant="glass" className="!grid-cols-4 flex-shrink-0" />
        <div className="min-w-0">
          <div className="text-sm font-medium truncate">{title}</div>
          <div className="text-[11px] text-muted-foreground truncate">{meta}</div>
        </div>
      </div>
      <StatusChip status={status} />
    </button>
  </li>
);

export const DashboardView = ({
  organizationName,
  onStartGenerate,
  onNavigate,
  onOpenLibrary,
  recentLibraries = [],
  brandProfiles = [],
}: Props) => {
  const { hidden: hiddenBrands, hide: hideBrand, clear: clearHiddenBrands, isHidden: isBrandHidden } =
    useHiddenItems('brand-profiles');
  const visibleBrandProfiles = brandProfiles.filter((b) => !isBrandHidden(b.id));

  const levelAccent = (lvl?: string) =>
    lvl === 'product_line' ? 'hsl(var(--tp-orange))'
    : lvl === 'brand' ? 'hsl(var(--tp-pink))'
    : 'hsl(var(--tp-digital-blue))';
  const levelLabel = (lvl?: string) =>
    lvl === 'product_line' ? 'Product line' : lvl === 'brand' ? 'Brand' : 'Core';
  const sampleEmojis = ['⚙️','📊','🔐','🔌','⚡','🧩'];

  return (
    <div className="space-y-8">
      {/* Hero strip */}
      <header className="tp-card relative overflow-hidden p-7">
        <div
          className="absolute inset-0 opacity-50"
          style={{
            background:
              'radial-gradient(60% 60% at 15% 0%, hsl(var(--tp-digital-blue) / 0.25), transparent 70%), radial-gradient(50% 80% at 100% 100%, hsl(var(--tp-pink) / 0.15), transparent 70%)',
          }}
          aria-hidden
        />
        <div className="relative flex flex-wrap items-end justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Icon production platform</span>
            </div>
            <h1 className="text-3xl font-semibold tracking-tight">
              Welcome back{organizationName ? `, ${organizationName}` : ''}
            </h1>
            <p className="text-sm text-muted-foreground max-w-xl">
              Generate, QA, organize and export brand-consistent icon systems at scale —
              with industry packs, preflight discipline, and production-ready bundles.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => onNavigate?.('library')}>
              <Folder className="h-4 w-4" />
              Open library
            </Button>
            <Button size="sm" className="gap-1.5" onClick={onStartGenerate}>
              <Plus className="h-4 w-4" />
              New icon system
            </Button>
          </div>
        </div>
      </header>

      {/* Golden Path quickstart */}
      <GoldenPathCard />

      {/* Recent icon systems + Export history */}
      <section className="grid gap-4 lg:grid-cols-2">
        <div className="tp-card p-5">
          <header className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold">Recent icon systems</h3>
            <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs" onClick={() => onNavigate?.('sets')}>
              View all <ArrowUpRight className="h-3 w-3" />
            </Button>
          </header>
          <ul className="space-y-1">
            {recentLibraries.length === 0 ? (
              <li className="px-3 py-6 text-center text-xs text-muted-foreground">
                No icon systems yet. Generate one to see it here.
              </li>
            ) : (
              recentLibraries.slice(0, 5).map((lib) => (
                <ActivityRow
                  key={lib.id}
                  title={lib.name}
                  meta={`${levelLabel(lib.level)} · ${lib.iconCount} icons`}
                  status={lib.isActive ? 'approved' : 'idle'}
                  emojis={sampleEmojis}
                  accent={levelAccent(lib.level)}
                  onClick={() => onOpenLibrary?.(lib.id)}
                />
              ))
            )}
          </ul>
        </div>

        <div className="tp-card p-5">
          <header className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold">Export history</h3>
            <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs" onClick={() => onNavigate?.('export')}>
              Open center <ArrowUpRight className="h-3 w-3" />
            </Button>
          </header>
          <ul className="divide-y divide-border/60">
            {[
              { name: 'globallink-icon-system.zip', when: '2h ago', size: '3.4 MB' },
              { name: 'life-sciences-pack.zip', when: 'yesterday', size: '1.8 MB' },
              { name: 'travel-loyalty.zip', when: '3d ago', size: '2.1 MB' },
              { name: 'tp-ai-solutions.zip', when: '1w ago', size: '1.2 MB' },
            ].map((row) => (
              <li key={row.name}>
                <button
                  type="button"
                  onClick={() => onNavigate?.('export')}
                  className="flex w-full items-center justify-between py-2.5 text-sm text-left rounded-md px-2 -mx-2 hover:bg-secondary/60 transition-colors"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Download className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                    <span className="truncate">{row.name}</span>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                    <span>{row.size}</span>
                    <span>{row.when}</span>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Brand profiles teaser */}
      <section className="tp-card p-5">
        <header className="mb-3 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold">Brand profiles</h3>
            <p className="text-xs text-muted-foreground">
              Profiles influence generation, QA, and export defaults.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {hiddenBrands.size > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-[11px]"
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
        <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {(visibleBrandProfiles.length > 0
            ? visibleBrandProfiles
            : [{ id: 'placeholder', name: organizationName || 'Your brand', tone: 'Add brands to see them here', members: 0 } as typeof visibleBrandProfiles[number]]
          ).map((b) => {
            const isPlaceholder = b.id === 'placeholder';
            const content = (
              <>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium truncate">{b.name}</span>
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
                        className="inline-flex h-5 w-5 items-center justify-center rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-60 hover:opacity-100"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                </div>
                {b.tone && <div className="text-[11px] text-muted-foreground">{b.tone}</div>}
              </>
            );
            const className =
              'block rounded-lg border bg-secondary/30 px-3 py-2.5 transition-colors hover:bg-secondary/60 hover:border-primary/40';
            return (
              <li key={b.id}>
                {b.slug ? (
                  <Link to={`/icon-studio/${b.entityType || 'brand'}/${b.slug}`} className={className}>
                    {content}
                  </Link>
                ) : (
                  <div className={className}>{content}</div>
                )}
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
};
