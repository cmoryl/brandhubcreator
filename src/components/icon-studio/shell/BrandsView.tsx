/**
 * BrandsView — brand profiles influencing generation, QA, and export.
 * Visualizes palette swatches and icon style rules per brand.
 */

import { useMemo, useState } from 'react';
import { Plus, Palette, Type, Hash, Edit3, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { IconSetPreview } from './IconSetPreview';

interface BrandProfile {
  id: string;
  name: string;
  tagline: string;
  palette: string[];
  typography: { heading: string; body: string };
  iconRules: { stroke: number; corner: 'round' | 'sharp'; grid: number };
  setsCount: number;
  iconsCount: number;
  emojis: string[];
  accentToken: string;
}

interface Props {
  organizationName: string;
}

const DEFAULT_PROFILES: BrandProfile[] = [
  {
    id: 'tp',
    name: 'TransPerfect',
    tagline: 'Enterprise · Trusted · Global',
    palette: ['#03002C', '#1A4FCF', '#06ACE7', '#FF4FB3', '#FF8743', '#1FBF7A'],
    typography: { heading: 'Geist Sans', body: 'Geist Sans' },
    iconRules: { stroke: 1.75, corner: 'round', grid: 24 },
    setsCount: 4,
    iconsCount: 184,
    emojis: ['🌐', '🗣️', '🔗', '📡', '✨', '🛡️'],
    accentToken: '--tp-digital-blue',
  },
  {
    id: 'gl',
    name: 'GlobalLink',
    tagline: 'Technical · Connected · Workflow',
    palette: ['#0F1B3D', '#1A4FCF', '#06ACE7', '#1FBF7A', '#FF8743'],
    typography: { heading: 'Geist Sans', body: 'Inter' },
    iconRules: { stroke: 1.5, corner: 'round', grid: 24 },
    setsCount: 2,
    iconsCount: 96,
    emojis: ['🔗', '⚙️', '🌍', '📡', '🧩', '🔁'],
    accentToken: '--tp-teal',
  },
  {
    id: 'tpai',
    name: 'TransPerfect AI',
    tagline: 'Forward · Premium · Generative',
    palette: ['#03002C', '#9333EA', '#06ACE7', '#FF4FB3'],
    typography: { heading: 'Geist Sans', body: 'Geist Sans' },
    iconRules: { stroke: 1.5, corner: 'round', grid: 24 },
    setsCount: 1,
    iconsCount: 32,
    emojis: ['✨', '🧠', '🤖', '⚡', '🪄', '🧪'],
    accentToken: '--tp-pink',
  },
  {
    id: 'tp-legal',
    name: 'TransPerfect Legal',
    tagline: 'Litigation · eDiscovery · Compliance',
    palette: ['#03002C', '#1A4FCF', '#0B7285', '#C9A84C', '#E8E4DD'],
    typography: { heading: 'Geist Sans', body: 'Inter' },
    iconRules: { stroke: 1.75, corner: 'round', grid: 24 },
    setsCount: 2,
    iconsCount: 72,
    emojis: ['⚖️', '📜', '🔐', '🏛️', '📑', '🪪'],
    accentToken: '--tp-dark-blue',
  },
  {
    id: 'tp-games',
    name: 'TransPerfect Games',
    tagline: 'Localization · QA · Audio · Player-first',
    palette: ['#0D0D0D', '#9333EA', '#06ACE7', '#FF4FB3', '#FFD23F'],
    typography: { heading: 'Geist Sans', body: 'Inter' },
    iconRules: { stroke: 2, corner: 'round', grid: 24 },
    setsCount: 3,
    iconsCount: 108,
    emojis: ['🎮', '🕹️', '🎧', '🏆', '🧩', '⚔️'],
    accentToken: '--tp-purple',
  },
  {
    id: 'tp-media',
    name: 'TransPerfect Media',
    tagline: 'Subtitling · Dubbing · Broadcast · OTT',
    palette: ['#03002C', '#1A4FCF', '#FF4FB3', '#FF8743', '#06ACE7'],
    typography: { heading: 'Geist Sans', body: 'Inter' },
    iconRules: { stroke: 1.5, corner: 'round', grid: 24 },
    setsCount: 2,
    iconsCount: 84,
    emojis: ['🎬', '🎞️', '🎙️', '📺', '🔊', '🎚️'],
    accentToken: '--tp-pink',
  },
  {
    id: 'tp-lifesci',
    name: 'TransPerfect Life Sciences',
    tagline: 'Regulatory · Clinical · Pharma · GxP',
    palette: ['#03002C', '#1FBF7A', '#06ACE7', '#1A4FCF', '#E8F4EF'],
    typography: { heading: 'Geist Sans', body: 'Inter' },
    iconRules: { stroke: 1.75, corner: 'round', grid: 24 },
    setsCount: 3,
    iconsCount: 124,
    emojis: ['🧬', '💊', '🩺', '🧪', '📋', '🏥'],
    accentToken: '--tp-green',
  },
  {
    id: 'tp-travel',
    name: 'TransPerfect Travel',
    tagline: 'Hospitality · Itinerary · Global guests',
    palette: ['#03002C', '#06ACE7', '#FF8743', '#1FBF7A', '#FFD23F'],
    typography: { heading: 'Geist Sans', body: 'Inter' },
    iconRules: { stroke: 1.75, corner: 'round', grid: 24 },
    setsCount: 2,
    iconsCount: 68,
    emojis: ['✈️', '🏨', '🎫', '🗺️', '🧳', '⭐'],
    accentToken: '--tp-light-blue',
  },
  {
    id: 'dataforce',
    name: 'Dataforce',
    tagline: 'AI training data · Annotation · Models',
    palette: ['#0F1E3D', '#1A4FCF', '#9333EA', '#06ACE7', '#1FBF7A'],
    typography: { heading: 'Geist Sans', body: 'Inter' },
    iconRules: { stroke: 1.5, corner: 'round', grid: 24 },
    setsCount: 2,
    iconsCount: 92,
    emojis: ['🧠', '📊', '🤖', '🧪', '📡', '⚙️'],
    accentToken: '--tp-purple',
  },
  {
    id: 'trial-interactive',
    name: 'Trial Interactive',
    tagline: 'eClinical · eTMF · Study workflows',
    palette: ['#03002C', '#1A4FCF', '#1FBF7A', '#06ACE7', '#E8E4DD'],
    typography: { heading: 'Geist Sans', body: 'Inter' },
    iconRules: { stroke: 1.75, corner: 'round', grid: 24 },
    setsCount: 2,
    iconsCount: 88,
    emojis: ['📋', '🧪', '📁', '✅', '👥', '🔬'],
    accentToken: '--tp-teal',
  },
];

export const BrandsView = ({ organizationName }: Props) => {
  const [q, setQ] = useState('');

  const profiles = useMemo(() => {
    const orgProfile: BrandProfile = {
      id: 'org',
      name: organizationName || 'Your brand',
      tagline: 'Active workspace · Default profile',
      palette: ['#03002C', '#1A4FCF', '#06ACE7', '#FF4FB3'],
      typography: { heading: 'Geist Sans', body: 'Inter' },
      iconRules: { stroke: 1.75, corner: 'round', grid: 24 },
      setsCount: 0,
      iconsCount: 0,
      emojis: ['⚙️', '📊', '🔐', '🔌', '⚡', '🧩'],
      accentToken: '--tp-light-blue',
    };
    const all = [orgProfile, ...DEFAULT_PROFILES];
    if (!q.trim()) return all;
    const term = q.toLowerCase();
    return all.filter(
      (b) => b.name.toLowerCase().includes(term) || b.tagline.toLowerCase().includes(term),
    );
  }, [organizationName, q]);

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
          <Button size="sm" className="gap-1.5">
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
          return (
            <article
              key={b.id}
              className="tp-card tp-card-interactive p-5"
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
                <Button variant="ghost" size="icon" className="h-7 w-7 flex-shrink-0">
                  <Edit3 className="h-3.5 w-3.5" />
                </Button>
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
                <IconSetPreview emojis={b.emojis} accent={accent} size="md" count={6} variant="glass" />
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
            </article>
          );
        })}
      </div>
    </div>
  );
};
