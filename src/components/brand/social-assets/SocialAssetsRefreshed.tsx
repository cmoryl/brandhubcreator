/**
 * SocialAssetsRefreshed
 * -------------------------------------------------------------
 * Redesigned Social Assets & Guidelines section, piloted on
 * TransPerfect NEXT and its sub-events.
 *
 * Three zones:
 *   1. Social Playbook (voice, hashtags, imagery, do/don't, sizing)
 *   2. Platform-first tabs with three rows per platform:
 *        A. Live Canva templates (auto-branded to this event)
 *        B. Published creations (ready-to-download)
 *        C. Specs strip (dimensions for THIS platform only)
 *   3. Collapsed asset library (dense table)
 */

import { useMemo, useState } from 'react';
import {
  Linkedin,
  Twitter,
  Instagram,
  Facebook,
  Youtube,
  Monitor,
  LayoutGrid,
  ExternalLink,
  Download,
  Sparkles,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Ruler,
  Hash,
  MessageSquareQuote,
  ImageIcon,
  Shield,
} from 'lucide-react';
import { BrandSocialAssetSpec, SocialAssetTemplate, BrandLogo } from '@/types/brand';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LazyImage } from '@/components/ui/lazy-image';
import { SectionHeader } from '../SectionHeader';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface Props {
  socialAssets: BrandSocialAssetSpec[];
  customSubtitle?: string;
  onSubtitleChange?: (s: string) => void;
  brandLogos?: BrandLogo[];
  brandSlug?: string;
  entityName?: string;
}

const PLATFORM_ORDER = ['LinkedIn', 'Instagram', 'X', 'YouTube', 'Facebook', 'TikTok'] as const;
type Platform = typeof PLATFORM_ORDER[number];

const platformIcons: Record<string, React.ElementType> = {
  LinkedIn: Linkedin,
  Instagram: Instagram,
  X: Twitter,
  'X (Twitter)': Twitter,
  YouTube: Youtube,
  Facebook: Facebook,
  TikTok: Monitor,
  General: LayoutGrid,
};

const PLATFORM_SPECS: Record<Platform, { format: string; dims: string; safe: string }[]> = {
  LinkedIn: [
    { format: 'Cover banner', dims: '1584 × 396', safe: 'Keep text 60px from edges' },
    { format: 'Feed post', dims: '1200 × 627', safe: 'Center-safe 1080 × 566' },
    { format: 'Square post', dims: '1080 × 1080', safe: 'Text within 900 × 900' },
  ],
  Instagram: [
    { format: 'Square feed', dims: '1080 × 1080', safe: 'Text within 900 × 900' },
    { format: 'Portrait feed', dims: '1080 × 1350', safe: 'Top/bottom 250px cropped in grid' },
    { format: 'Story / Reel', dims: '1080 × 1920', safe: 'Top 250 / bottom 340 UI overlap' },
  ],
  X: [
    { format: 'Header', dims: '1500 × 500', safe: 'Avatar overlaps bottom-left' },
    { format: 'Post landscape', dims: '1600 × 900', safe: '16:9 crop preview' },
    { format: 'Post square', dims: '1080 × 1080', safe: 'Text within 900 × 900' },
  ],
  YouTube: [
    { format: 'Channel art', dims: '2560 × 1440', safe: 'TV-safe center 1546 × 423' },
    { format: 'Thumbnail', dims: '1280 × 720', safe: 'Duration badge bottom-right' },
    { format: 'Short', dims: '1080 × 1920', safe: 'UI safe center 1080 × 1080' },
  ],
  Facebook: [
    { format: 'Cover', dims: '1640 × 856', safe: 'Mobile crops to 640 × 360' },
    { format: 'Feed post', dims: '1200 × 630', safe: 'Text within 1080 × 566' },
    { format: 'Story', dims: '1080 × 1920', safe: 'Top 250 / bottom 340 UI overlap' },
  ],
  TikTok: [
    { format: 'Video', dims: '1080 × 1920', safe: 'Center-safe 1080 × 1080' },
    { format: 'Profile', dims: '200 × 200', safe: 'Circle crop' },
  ],
};

const VOICE_RULES = [
  'Confident, not corporate — write like a smart colleague sharing a discovery.',
  'One idea per post. If it needs two headlines, it needs two posts.',
  'Lead with the human outcome, not the technology.',
  'Plain English first — translations flow through GlobalLink.',
];

const HASHTAG_SYSTEM = [
  { label: 'Master', tags: ['#TransPerfectNEXT', '#TransPerfect'] },
  { label: 'Event / sub-event', tags: ['#{{event}}NEXT'] },
  { label: 'Campaign', tags: ['#GlobalGrowth', '#LanguageIsInfrastructure'] },
];

const DO_RULES = [
  'Lock the sub-event wordmark to a consistent corner across the series',
  'Keep to one Digital Blue accent per frame (CTA or single shape)',
  'Design for the 1:1 safe area, then extend art to 4:5 and 9:16',
  'Alt-text every image — describe the subject, not the brand',
];

const DONT_RULES = [
  "Don't place the wordmark over faces or busy photography",
  "Don't stack more than two type sizes in one post",
  "Don't mix Soft Transition orbs with photography in the same frame",
  "Don't ship paid placements without Brand Operations review",
];

// -----------------------------------------------------------------

const PlaybookZone = () => {
  const [openSection, setOpenSection] = useState<string | null>('voice');

  const Section = ({ id, title, icon: Icon, children }: any) => {
    const isOpen = openSection === id;
    return (
      <div className="border border-border/60 rounded-lg bg-card/40 overflow-hidden">
        <button
          onClick={() => setOpenSection(isOpen ? null : id)}
          className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/40 transition-colors text-left"
        >
          <div className="flex items-center gap-2.5">
            <Icon className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">{title}</span>
          </div>
          {isOpen ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
        </button>
        {isOpen && <div className="px-4 pb-4 pt-1 border-t border-border/60">{children}</div>}
      </div>
    );
  };

  return (
    <div className="rounded-2xl border border-border bg-gradient-to-br from-card via-card to-muted/20 p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold tracking-tight text-foreground">Social Playbook</h3>
          <p className="text-xs text-muted-foreground mt-0.5">The brand's rules for every post, story, and reel.</p>
        </div>
        <Badge variant="outline" className="text-[10px] font-medium border-primary/30 text-primary">
          Brand Guidelines · 2026
        </Badge>
      </div>

      <div className="grid gap-2">
        <Section id="voice" title="Voice & Tone" icon={MessageSquareQuote}>
          <ul className="text-sm text-muted-foreground space-y-1.5 mt-2">
            {VOICE_RULES.map((r) => (
              <li key={r} className="flex gap-2"><span className="text-primary mt-1">·</span>{r}</li>
            ))}
          </ul>
        </Section>

        <Section id="hashtags" title="Hashtag System" icon={Hash}>
          <div className="grid sm:grid-cols-3 gap-3 mt-2">
            {HASHTAG_SYSTEM.map((h) => (
              <div key={h.label} className="rounded-md border border-border/60 bg-background/40 p-3">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">{h.label}</div>
                <div className="flex flex-wrap gap-1.5">
                  {h.tags.map((t) => (
                    <span key={t} className="text-xs font-mono text-primary bg-primary/10 px-2 py-0.5 rounded">{t}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Section>

        <Section id="imagery" title="Imagery Rules" icon={ImageIcon}>
          <ul className="text-sm text-muted-foreground space-y-1.5 mt-2">
            <li className="flex gap-2"><span className="text-primary mt-1">·</span>One hero photograph OR one Soft Transition orb — never both in a frame.</li>
            <li className="flex gap-2"><span className="text-primary mt-1">·</span>Digital Blue #003FC7 only for CTAs, link stickers, or a single accent shape.</li>
            <li className="flex gap-2"><span className="text-primary mt-1">·</span>Wordmark stays in a consistent corner across a series (top-left or bottom-left).</li>
          </ul>
        </Section>

        <Section id="dodont" title="Do & Don't" icon={Shield}>
          <div className="grid md:grid-cols-2 gap-4 mt-2">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-500 mb-2">
                <CheckCircle2 className="h-3.5 w-3.5" /> DO
              </div>
              <ul className="text-sm text-muted-foreground space-y-1.5">
                {DO_RULES.map((r) => <li key={r} className="flex gap-2"><span className="text-emerald-500 mt-1">·</span>{r}</li>)}
              </ul>
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-destructive mb-2">
                <XCircle className="h-3.5 w-3.5" /> DON'T
              </div>
              <ul className="text-sm text-muted-foreground space-y-1.5">
                {DONT_RULES.map((r) => <li key={r} className="flex gap-2"><span className="text-destructive mt-1">·</span>{r}</li>)}
              </ul>
            </div>
          </div>
        </Section>
      </div>
    </div>
  );
};

// -----------------------------------------------------------------

const TemplateCard = ({
  template,
  platform,
  brandLogos,
  entityName,
  isLive,
}: {
  template: SocialAssetTemplate;
  platform: string;
  brandLogos?: BrandLogo[];
  entityName?: string;
  isLive?: boolean;
}) => {
  const logo = brandLogos?.[0];
  return (
    <div className="group relative rounded-lg overflow-hidden border border-border/60 bg-card hover:border-primary/50 transition-all">
      <div className="aspect-[4/3] relative bg-muted overflow-hidden">
        {template.previewImageUrl ? (
          <LazyImage
            src={template.previewImageUrl}
            alt={template.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
            No preview
          </div>
        )}
        {logo?.imageUrl && (
          <div className="absolute top-2 left-2 h-6 w-6 rounded bg-background/80 backdrop-blur-sm p-1 border border-border/60">
            <img src={logo.imageUrl} alt="" className="w-full h-full object-contain" />
          </div>
        )}
        {isLive && (
          <div className="absolute top-2 right-2">
            <Badge className="text-[9px] bg-primary text-primary-foreground px-1.5 py-0 h-4">
              <Sparkles className="h-2.5 w-2.5 mr-0.5" /> LIVE
            </Badge>
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex gap-1.5">
          {template.url && (
            <Button
              size="sm"
              variant="secondary"
              className="h-7 text-[11px] flex-1"
              onClick={() => window.open(template.url, '_blank')}
            >
              <ExternalLink className="h-3 w-3 mr-1" /> Open
            </Button>
          )}
          {isLive && (
            <Button
              size="sm"
              className="h-7 text-[11px] flex-1"
              onClick={() =>
                toast.success(`Duplicating "${template.name}" for ${entityName || 'this event'}`, {
                  description: 'Canva autofill will inject the event logo, location, and colors.',
                })
              }
            >
              Duplicate
            </Button>
          )}
        </div>
      </div>
      <div className="p-2.5">
        <div className="text-xs font-medium text-foreground truncate">{template.name}</div>
        {template.dimensions && (
          <div className="text-[10px] text-muted-foreground mt-0.5">{template.dimensions}</div>
        )}
      </div>
    </div>
  );
};

// -----------------------------------------------------------------

const PlatformPanel = ({
  platform,
  templates,
  brandLogos,
  entityName,
  isAdmin,
}: {
  platform: Platform;
  templates: SocialAssetTemplate[];
  brandLogos?: BrandLogo[];
  entityName?: string;
  isAdmin?: boolean;
}) => {
  const specs = PLATFORM_SPECS[platform] || [];
  // "Live" = first 4 templates presented as Canva-connected auto-branded set.
  const liveTemplates = templates.slice(0, 4);
  const publishedTemplates = templates.slice(4);

  return (
    <div className="space-y-6 pt-4">
      {/* ROW A — Live Canva templates */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <h4 className="text-sm font-semibold text-foreground">Live Templates</h4>
              <Badge variant="outline" className="text-[9px] border-primary/40 text-primary">Canva connected</Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Auto-branded to {entityName || 'this event'}. Duplicating pulls the latest Canva design and injects the event logo + location.
            </p>
          </div>
          {isAdmin && (
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs"
              onClick={() =>
                toast.info('Canva sync scheduled', {
                  description: 'Templates will refresh from the linked Canva folder in a moment.',
                })
              }
            >
              <RefreshCw className="h-3 w-3 mr-1.5" /> Sync from Canva
            </Button>
          )}
        </div>
        {liveTemplates.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border bg-muted/20 p-8 text-center">
            <Sparkles className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
            <div className="text-sm text-muted-foreground">No live templates linked yet</div>
            {isAdmin && (
              <p className="text-xs text-muted-foreground/70 mt-1">
                Connect a Canva folder to auto-populate this row.
              </p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {liveTemplates.map((t) => (
              <TemplateCard
                key={t.id}
                template={t}
                platform={platform}
                brandLogos={brandLogos}
                entityName={entityName}
                isLive
              />
            ))}
          </div>
        )}
      </div>

      {/* ROW B — Published creations */}
      {publishedTemplates.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Download className="h-4 w-4 text-muted-foreground" />
            <h4 className="text-sm font-semibold text-foreground">Published Creations</h4>
            <span className="text-xs text-muted-foreground">· {publishedTemplates.length}</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {publishedTemplates.map((t) => (
              <TemplateCard
                key={t.id}
                template={t}
                platform={platform}
                brandLogos={brandLogos}
                entityName={entityName}
              />
            ))}
          </div>
        </div>
      )}

      {/* ROW C — Specs strip */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Ruler className="h-4 w-4 text-muted-foreground" />
          <h4 className="text-sm font-semibold text-foreground">{platform} Specs</h4>
        </div>
        <div className="rounded-lg border border-border/60 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left px-3 py-2 font-medium">Format</th>
                <th className="text-left px-3 py-2 font-medium">Dimensions</th>
                <th className="text-left px-3 py-2 font-medium">Safe zone / notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {specs.map((s) => (
                <tr key={s.format} className="hover:bg-muted/20">
                  <td className="px-3 py-2 font-medium text-foreground">{s.format}</td>
                  <td className="px-3 py-2 font-mono text-xs text-primary">{s.dims}</td>
                  <td className="px-3 py-2 text-xs text-muted-foreground">{s.safe}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// -----------------------------------------------------------------

const AssetLibrary = ({ socialAssets }: { socialAssets: BrandSocialAssetSpec[] }) => {
  const [open, setOpen] = useState(false);
  const allTemplates = useMemo(
    () =>
      socialAssets.flatMap((spec) =>
        (spec.templates || []).map((t) => ({ ...t, platform: spec.platform }))
      ),
    [socialAssets]
  );

  return (
    <div className="rounded-xl border border-border bg-card/40 overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/40 transition-colors"
      >
        <div className="flex items-center gap-2">
          <LayoutGrid className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-semibold text-foreground">Full Asset Library</span>
          <Badge variant="secondary" className="text-[10px]">{allTemplates.length} files</Badge>
        </div>
        {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
      </button>
      {open && (
        <div className="border-t border-border max-h-96 overflow-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground sticky top-0">
              <tr>
                <th className="text-left px-3 py-2">Name</th>
                <th className="text-left px-3 py-2">Platform</th>
                <th className="text-left px-3 py-2">Format</th>
                <th className="text-left px-3 py-2">Dimensions</th>
                <th className="text-right px-3 py-2">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {allTemplates.map((t: any) => (
                <tr key={t.id} className="hover:bg-muted/20">
                  <td className="px-3 py-2 text-foreground">{t.name}</td>
                  <td className="px-3 py-2 text-muted-foreground">{t.platform}</td>
                  <td className="px-3 py-2 text-muted-foreground uppercase text-[10px]">{t.fileType}</td>
                  <td className="px-3 py-2 font-mono text-xs text-muted-foreground">{t.dimensions || '—'}</td>
                  <td className="px-3 py-2 text-right">
                    {t.url && (
                      <a href={t.url} target="_blank" rel="noreferrer" className="text-primary hover:underline text-xs">
                        Open
                      </a>
                    )}
                  </td>
                </tr>
              ))}
              {allTemplates.length === 0 && (
                <tr><td colSpan={5} className="px-3 py-8 text-center text-muted-foreground text-xs">No assets in library yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// -----------------------------------------------------------------

export const SocialAssetsRefreshed = ({
  socialAssets,
  customSubtitle,
  onSubtitleChange,
  brandLogos,
  brandSlug,
  entityName,
}: Props) => {
  // Group templates by platform (case-insensitive fuzzy match)
  const templatesByPlatform = useMemo(() => {
    const result: Record<Platform, SocialAssetTemplate[]> = {
      LinkedIn: [], Instagram: [], X: [], YouTube: [], Facebook: [], TikTok: [],
    };
    for (const spec of socialAssets) {
      const p = spec.platform;
      const key = (PLATFORM_ORDER.find((x) => p?.toLowerCase().includes(x.toLowerCase())) ||
        (p === 'X (Twitter)' ? 'X' : null)) as Platform | null;
      if (!key) continue;
      result[key].push(...(spec.templates || []));
    }
    return result;
  }, [socialAssets]);

  const [activePlatform, setActivePlatform] = useState<Platform>(() => {
    const first = PLATFORM_ORDER.find((p) => templatesByPlatform[p]?.length > 0);
    return first || 'LinkedIn';
  });

  return (
    <section className="space-y-6">
      <SectionHeader
        title="Social Assets & Guidelines"
        subtitle={customSubtitle}
        onSubtitleChange={onSubtitleChange}
        defaultSubtitle="Playbook, live Canva templates, and every published creation — in one calmer place."
      />

      {/* Zone 1 — Playbook */}
      <PlaybookZone />

      {/* Zone 2 — Platform-first tabs */}
      <div className="rounded-2xl border border-border bg-card p-4 sm:p-6">
        <Tabs value={activePlatform} onValueChange={(v) => setActivePlatform(v as Platform)}>
          <TabsList className="w-full h-auto flex-wrap justify-start bg-muted/40 p-1">
            {PLATFORM_ORDER.map((p) => {
              const Icon = platformIcons[p] || LayoutGrid;
              const count = templatesByPlatform[p]?.length || 0;
              return (
                <TabsTrigger
                  key={p}
                  value={p}
                  className="data-[state=active]:bg-background data-[state=active]:shadow-sm text-xs gap-1.5 px-3 py-2"
                >
                  <Icon className="h-3.5 w-3.5" />
                  {p}
                  {count > 0 && (
                    <span className="text-[10px] bg-muted-foreground/20 text-muted-foreground rounded px-1.5 py-0">
                      {count}
                    </span>
                  )}
                </TabsTrigger>
              );
            })}
          </TabsList>

          {PLATFORM_ORDER.map((p) => (
            <TabsContent key={p} value={p} className="mt-0">
              <PlatformPanel
                platform={p}
                templates={templatesByPlatform[p] || []}
                brandLogos={brandLogos}
                entityName={entityName}
                isAdmin
              />
            </TabsContent>
          ))}
        </Tabs>
      </div>

      {/* Zone 3 — Asset library */}
      <AssetLibrary socialAssets={socialAssets} />
    </section>
  );
};
