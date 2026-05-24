/**
 * BrandsView — brand profiles influencing generation, QA, and export.
 * Visualizes palette swatches and icon style rules per brand.
 */

import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Palette, Type, Hash, Edit3, Building2, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import { LibraryIconPreview } from './LibraryIconPreview';
import { useIconLibraries } from '@/hooks/useIconLibraries';
import { useIconLibraryBrandLinks } from '@/hooks/useIconLibraryBrandLinks';
import type { BrandIconography } from '@/types/brand';

interface BrandProfile {
  id: string;
  name: string;
  slug: string;
  tagline: string;
  palette: string[];
  typography: { heading: string; body: string };
  iconRules: { stroke: number; corner: 'round' | 'sharp'; grid: number };
  setsCount: number;
  iconsCount: number;
  emojis: string[];
  accentToken: string;
  entityType?: 'brand' | 'product' | 'event';
}

interface Props {
  organizationName: string;
  /** Active organization id — used to load real icon libraries per brand. */
  organizationId?: string;
  /** Real brand profiles from the database */
  brandProfiles?: Array<{
    id: string;
    name: string;
    slug?: string;
    type: 'brand' | 'product' | 'event';
  }>;
}

// NOTE: Hardcoded TransPerfect/GlobalLink/etc seed brands were removed —
// they leaked tenant data into every org's view. Brand profiles now come
// strictly from the active org's brands/products/events tables.


function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export const BrandsView = ({ organizationName, organizationId, brandProfiles = [] }: Props) => {
  const [q, setQ] = useState('');
  const navigate = useNavigate();
  const { libraries } = useIconLibraries(organizationId);
  const { getLinkedLibraryIdsForEntity } = useIconLibraryBrandLinks(organizationId);

  const normalize = (s: string) => (s || '').toLowerCase().replace(/[^a-z0-9]/g, '');

  /**
   * Resolve brand-specific libraries for a profile:
   *   explicit links → name-matched brand libs → core libs as a last resort.
   * Returns the pool so callers can derive both icons and counts.
   */
  const poolForProfile = (
    profile: { id: string; name: string; entityType?: 'brand' | 'product' | 'event' },
  ) => {
    if (!libraries.length) return [];
    const key = normalize(profile.name);
    const explicit = profile.entityType
      ? new Set(getLinkedLibraryIdsForEntity(profile.id, profile.entityType))
      : new Set<string>();

    const matched = libraries.filter((l) => {
      if (explicit.has(l.id)) return true;
      if (l.level === 'core') return false;
      const libKey = normalize(l.name);
      if (!libKey || !key) return false;
      return libKey === key || libKey.includes(key) || key.includes(libKey);
    });

    return matched.length ? matched : libraries.filter((l) => l.level === 'core');
  };

  const iconsForProfile = (
    profile: { id: string; name: string; entityType?: 'brand' | 'product' | 'event' },
  ): BrandIconography[] => {
    const pool = poolForProfile(profile);
    const collected: BrandIconography[] = [];
    for (const lib of pool) {
      for (const ic of lib.icons || []) {
        if (ic?.svgPath) collected.push(ic);
        if (collected.length >= 6) return collected;
      }
    }
    return collected;
  };

  const countsForProfile = (
    profile: { id: string; name: string; entityType?: 'brand' | 'product' | 'event' },
  ) => {
    const pool = poolForProfile(profile);
    return {
      setsCount: pool.length,
      iconsCount: pool.reduce((s, l) => s + (l.icons?.length ?? 0), 0),
    };
  };

  const profiles = useMemo(() => {
    // Start with real DB brands
    const realProfiles: BrandProfile[] = brandProfiles
      .filter((b) => b.slug)
      .map((b) => ({
        id: b.id,
        name: b.name,
        slug: b.slug!,
        tagline: b.type === 'product' ? 'Product profile' : b.type === 'event' ? 'Event profile' : 'Brand profile',
        palette: ['#03002C', '#1A4FCF', '#06ACE7', '#FF4FB3'],
        typography: { heading: 'Geist Sans', body: 'Inter' },
        iconRules: { stroke: 1.75, corner: 'round' as const, grid: 24 },
        setsCount: 0,
        iconsCount: 0,
        emojis: ['⚙️', '📊', '🔐', '🔌', '⚡', '🧩'],
        accentToken: '--tp-light-blue',
        entityType: b.type,
      }));

    const orgProfile: BrandProfile = {
      id: 'org',
      name: organizationName || 'Your brand',
      slug: slugify(organizationName || 'your-brand'),
      tagline: 'Active workspace · Default profile',
      palette: ['#03002C', '#1A4FCF', '#06ACE7', '#FF4FB3'],
      typography: { heading: 'Geist Sans', body: 'Inter' },
      iconRules: { stroke: 1.75, corner: 'round', grid: 24 },
      setsCount: 0,
      iconsCount: 0,
      emojis: ['⚙️', '📊', '🔐', '🔌', '⚡', '🧩'],
      accentToken: '--tp-light-blue',
    };

    const all = [orgProfile, ...realProfiles];
    if (!q.trim()) return all;
    const term = q.toLowerCase();
    return all.filter(
      (b) => b.name.toLowerCase().includes(term) || b.tagline.toLowerCase().includes(term),
    );
  }, [organizationName, q, brandProfiles]);

  return (
    <div className="space-y-6">
      <header className="tp-card relative overflow-hidden p-6">
        <div
          className="absolute inset-0 opacity-40"
          style={{
            background:
              'radial-gradient(50% 80% at 100% 0%, hsl(var(--tp-pink) / 0.16), transparent 70%)',
          }}
          aria-hidden
        />
        <div className="relative flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              <Building2 className="h-3.5 w-3.5" />
              <span>Brand identity systems</span>
            </div>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">Brand Profiles</h1>
            <p className="text-sm text-muted-foreground max-w-2xl">
              Color, typography, and icon rules that drive every generation, QA pass, and export.
            </p>
          </div>
          <Button
            size="sm"
            className="gap-1.5"
            onClick={() => {
              // Brand creation lives in the org admin; nudge user there.
              toast.info('Create a new brand from the organization dashboard.');
              navigate('/admin');
            }}
          >
            <Plus className="h-4 w-4" />
            New brand
          </Button>
        </div>
      </header>

      <div className="relative max-w-md">
        <Input
          placeholder="Search brand profiles…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="h-9"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {profiles.map((b) => {
          const accent = `hsl(var(${b.accentToken}))`;
          const to = `/icon-studio/${b.entityType || 'brand'}/${b.slug}`;
          const { setsCount, iconsCount } = countsForProfile({
            id: b.id,
            name: b.name,
            entityType: b.entityType,
          });
          return (
            <Link
              key={b.id}
              to={to}
              className="tp-card tp-card-interactive p-5 block transition-colors hover:border-primary/40"
              style={{
                backgroundImage: `linear-gradient(135deg, hsl(var(${b.accentToken}) / 0.08), transparent 60%)`,
              }}
            >
              <header className="flex items-start justify-between gap-3 mb-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="h-11 w-11 rounded-xl flex items-center justify-center text-base font-semibold flex-shrink-0"
                    style={{ background: accent, color: 'white' }}
                  >
                    {b.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-base truncate">{b.name}</h3>
                    <p className="text-[11px] text-muted-foreground truncate">{b.tagline}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 flex-shrink-0"
                    aria-label={`Edit ${b.name}`}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      navigate(to);
                    }}
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                  </Button>
                  <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                </div>
              </header>

              {/* Palette */}
              <div className="mb-4">
                <div className="flex items-center gap-1.5 mb-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                  <Palette className="h-3 w-3" />
                  <span>Palette</span>
                </div>
                <div className="flex gap-1">
                  {b.palette.map((c) => (
                    <div
                      key={c}
                      className="h-7 flex-1 rounded-md border border-border/50"
                      style={{ background: c }}
                      title={c}
                    />
                  ))}
                </div>
              </div>

              {/* Icon preview */}
              <div className="mb-4">
                <div className="flex items-center gap-1.5 mb-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                  <Hash className="h-3 w-3" />
                  <span>Icon style sample</span>
                </div>
                <LibraryIconPreview
                  icons={iconsForProfile({ id: b.id, name: b.name, entityType: b.entityType })}
                  fallbackEmojis={b.emojis}
                  accent={accent}
                  size="md"
                  count={6}
                />
              </div>

              {/* Meta */}
              <dl className="grid grid-cols-3 gap-2 pt-3 border-t border-border/50 text-[11px]">
                <div>
                  <dt className="text-muted-foreground flex items-center gap-1">
                    <Type className="h-3 w-3" /> Type
                  </dt>
                  <dd className="font-medium truncate" title={b.typography.heading}>
                    {b.typography.heading}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Stroke / Grid</dt>
                  <dd className="font-medium">
                    {b.iconRules.stroke}px · {b.iconRules.grid}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Library</dt>
                  <dd className="font-medium tabular-nums">
                    {b.setsCount} sets · {b.iconsCount}
                  </dd>
                </div>
              </dl>
            </Link>
          );
        })}
      </div>
    </div>
  );
};
