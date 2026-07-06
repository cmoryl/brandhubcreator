/**
 * NEXT Template Kit
 * Recreates the "TransPerfect NEXT" Canva look-and-feel as in-app,
 * downloadable social + event templates. Vertical accent color is derived
 * from a NEXT-vertical slug map, falling back to event.colors.primary.
 *
 * Formats: Banner (1200x628), Square (1080x1080), Story (1080x1920),
 *          Hero Card (1600x600), Portal Tile (800x1000).
 */
import { useRef, useState, useMemo } from 'react';
import { toPng } from 'html-to-image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Download, Sparkles, LayoutGrid } from 'lucide-react';
import { toast } from 'sonner';
import type { BrandLogo } from '@/types/brand';

/** Pick the best logo for a dark navy backdrop — prefer reversed/white/mono, then anything.
 *  When `preferStacked` is true, boosts stacked/vertical lockups and de-prioritizes horizontal. */
function pickLogoForDark(logos?: BrandLogo[], preferStacked = false): BrandLogo | undefined {
  if (!logos?.length) return undefined;
  const score = (l: BrandLogo) => {
    const v = (l.variant || '').toLowerCase();
    const n = (l.name || '').toLowerCase();
    const t = `${v} ${n}`;
    let s = 0;
    if (t.includes('reversed') || t.includes('white') || t.includes('on-dark') || t.includes('on dark')) s += 3;
    else if (t.includes('monochrome') || t.includes('mono')) s += 2;
    else if (t.includes('primary') || t.includes('main') || t.includes('color')) s += 1;
    if (preferStacked) {
      if (t.includes('stacked') || t.includes('vertical')) s += 5;
      if (t.includes('horizontal') || t.includes('inline') || t.includes('wordmark')) s -= 2;
    }
    return s;
  };
  return [...logos].sort((a, b) => score(b) - score(a))[0];
}

// ------- Vertical accent map (matches restructured NEXT event colors) -------
const NEXT_ACCENTS: Record<string, { accent: string; label: string }> = {
  'transperfect-next': { accent: '#13B1F3', label: 'TransPerfect NEXT' },
  'globallink-next':   { accent: '#13B1F3', label: 'GlobalLink NEXT' },
  'digital-next':      { accent: '#C2A3FF', label: 'Digital NEXT' },
  'finance-next':      { accent: '#FF9B70', label: 'Finance NEXT' },
  'games-next':        { accent: '#A6FA87', label: 'Games NEXT' },
  'legal-next':        { accent: '#3BBEB6', label: 'Legal NEXT' },
  'lifesci-next':      { accent: '#58ED21', label: 'LifeSci NEXT' },
  'experience-next':   { accent: '#FF5757', label: 'Experience NEXT' },
  'learn-next':        { accent: '#FFEB66', label: 'Learn NEXT' },
  'media-next':        { accent: '#EC388A', label: 'Media NEXT' },
  'dataforce-next':    { accent: '#5CE1E6', label: 'DataForce NEXT' },
};

// ------- Per-variant default copy + optional character cutout URL -------
const NEXT_VARIATION_DEFAULTS: Record<
  string,
  { title: string; body: string; cta: string; cutout?: string }
> = {
  'transperfect-next': {
    title: 'Global Content, Localized Everywhere.',
    body: 'The flagship TransPerfect NEXT conference — every language, every market, one platform.',
    cta: 'Reserve Your Seat',
  },
  'globallink-next': {
    title: 'The Future of Translation Management.',
    body: 'GlobalLink NEXT unites AI, workflow, and human expertise in one connected suite.',
    cta: 'See the Platform',
  },
  'digital-next': {
    title: 'Digital Experiences, Reimagined.',
    body: 'Personalized, multilingual, and always-on customer journeys at global scale.',
    cta: 'Explore Digital NEXT',
  },
  'finance-next': {
    title: 'Precision Language for Finance.',
    body: 'Regulated, compliant, audit-ready translation for every financial disclosure.',
    cta: 'Talk to Finance',
  },
  'games-next': {
    title: 'Level Up Your Global Launch.',
    body: 'End-to-end games localization, QA, and audio in every voice your players speak.',
    cta: 'Ship in Every Language',
  },
  'legal-next': {
    title: 'Legal-Grade Translation, at Speed.',
    body: 'eDiscovery, litigation support, and certified translations trusted by AmLaw 100 firms.',
    cta: 'Request a Demo',
  },
  'lifesci-next': {
    title: 'Life Sciences Localization, Validated.',
    body: 'Regulatory, clinical, and commercial content — approved processes for global submission.',
    cta: 'See LifeSci Solutions',
  },
  'experience-next': {
    title: 'Every Customer, Every Language, Every Channel.',
    body: 'Real-time multilingual CX powered by AI and human quality.',
    cta: 'Elevate Experience',
  },
  'learn-next': {
    title: 'Global Learning that Actually Lands.',
    body: 'eLearning localization, voiceover, and LMS integrations for the connected workforce.',
    cta: 'Start Learning Global',
  },
  'media-next': {
    title: 'Stories that Travel.',
    body: 'Dubbing, subtitling, and media localization at broadcast quality — everywhere.',
    cta: 'See the Reel',
  },
  'dataforce-next': {
    title: 'Training Data. On-Brand. At Scale.',
    body: 'AI-ready datasets, human annotation, and cultural QA from the DataForce network.',
    cta: 'Power Your AI',
  },
};

const NAVY = '#0A1638';
const NAVY_DEEP = '#050B22';
const PINK_CTA = '#EC388A';

interface NextTemplatesSectionProps {
  eventSlug?: string;
  eventName?: string;
  defaultAccent?: string;
  defaultTagline?: string;
  defaultDate?: string;
  defaultVenue?: string;
  /** Per-variant Canva template URLs, keyed by NEXT vertical slug. */
  nextVariationCanvaLinks?: Record<string, string>;
  onNextVariationCanvaLinksChange?: (next: Record<string, string>) => void;
  /** Per-variant reversed/white logo image URLs, keyed by NEXT vertical slug. */
  nextVariationLogos?: Record<string, string>;
  onNextVariationLogosChange?: (next: Record<string, string>) => void;
  isAdmin?: boolean;
  /** Approved brand/event logos — the section prefers a reversed/white variant for the dark backdrop. */
  logos?: BrandLogo[];
}

type Format = {
  id: string;
  label: string;
  width: number;
  height: number;
  aspect: string;
};

const FORMATS: Format[] = [
  { id: 'banner',  label: 'Web Banner',   width: 1200, height: 628,  aspect: 'aspect-[1200/628]' },
  { id: 'square',  label: 'Social Square',width: 1080, height: 1080, aspect: 'aspect-square' },
  { id: 'story',   label: 'Story / Reel', width: 1080, height: 1920, aspect: 'aspect-[9/16]' },
  { id: 'hero',    label: 'Event Hero',   width: 1600, height: 600,  aspect: 'aspect-[8/3]' },
  { id: 'tile',    label: 'Portal Tile',  width: 800,  height: 1000, aspect: 'aspect-[4/5]' },
];

/** Diagonal chevron pattern rendered as SVG for crisp export at any scale.
 *  `hideRays` removes the left-side chevron rays for the centered hero layout. */
function ChevronBackdrop({ accent, hideRays = false }: { accent: string; hideRays?: boolean }) {
  return (
    <svg
      className="absolute inset-0 h-full w-full"
      viewBox="0 0 1200 800"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden
    >
      <defs>
        <linearGradient id="np-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={NAVY_DEEP} />
          <stop offset="60%" stopColor={NAVY} />
          <stop offset="100%" stopColor="#1A0F3A" />
        </linearGradient>
        <linearGradient id="np-chev" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={PINK_CTA} stopOpacity="0.55" />
          <stop offset="100%" stopColor={accent} stopOpacity="0.55" />
        </linearGradient>
      </defs>
      <rect width="1200" height="800" fill="url(#np-bg)" />
      {!hideRays && (
        <g opacity="0.85" stroke="url(#np-chev)" strokeWidth="2" fill="none">
          {Array.from({ length: 18 }).map((_, i) => {
            const x = -200 + i * 40;
            return <path key={i} d={`M${x} 800 L${x + 400} 0`} />;
          })}
        </g>
      )}
      {/* Right-side orbit rings */}
      <g opacity="0.35" stroke={accent} strokeWidth="1.2" fill="none">
        <circle cx="1000" cy="400" r="260" />
        <circle cx="1000" cy="400" r="340" />
        <circle cx="1000" cy="400" r="420" />
      </g>
      <g fill="#fff">
        <circle cx="740" cy="400" r="4" />
        <circle cx="1000" cy="60" r="3" />
        <circle cx="1000" cy="740" r="3" />
      </g>
    </svg>
  );
}

/** Vertical NEXT lockup — renders the approved logo image when provided,
 *  otherwise falls back to the typographic lockup. */
function NextLockup({
  label,
  accent,
  logoUrl,
  sizeEm = 3.2,
  centered = false,
}: {
  label: string;
  accent: string;
  logoUrl?: string;
  sizeEm?: number;
  centered?: boolean;
}) {
  if (logoUrl) {
    return (
      <div className={`leading-none ${centered ? 'flex flex-col items-center text-center' : ''}`}>
        <img
          src={logoUrl}
          alt={label}
          crossOrigin="anonymous"
          style={{
            height: `${sizeEm}em`,
            width: 'auto',
            maxWidth: '100%',
            objectFit: 'contain',
            filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.35))',
          }}
        />
        <div className="text-white/70 text-[0.5em] tracking-[0.35em] mt-2">
          BY TRANSPERFECT
        </div>
      </div>
    );
  }

  const [prefix, ...rest] = label.replace(/\s*NEXT\s*/i, '|NEXT').split('|');
  const suffix = rest.join('') || 'NEXT';
  return (
    <div className={`leading-none ${centered ? 'flex flex-col items-center text-center' : ''}`}>
      <div className="text-white font-black tracking-tight" style={{ fontSize: `${sizeEm * 0.28}em` }}>
        {prefix.trim() || 'TransPerfect'}
      </div>
      <div
        className="font-black tracking-tighter"
        style={{
          fontSize: `${sizeEm * 0.75}em`,
          background: `linear-gradient(90deg, #fff 0%, ${accent} 60%, ${PINK_CTA} 100%)`,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          letterSpacing: '-0.04em',
        }}
      >
        {suffix.replace(/next/i, 'NE» T').replace('» T', '»T')}
      </div>
      <div className="text-white/70 text-[0.5em] tracking-[0.35em] mt-1">
        BY TRANSPERFECT
      </div>
    </div>
  );
}

/** One rendered template surface. All layouts share this shell.
 *  `layout='centered-hero'` drops the left chevron rays and stacks a large
 *  logo lockup above the copy, both center-aligned. */
function TemplateSurface({
  format,
  content,
  accent,
  verticalLabel,
  logoUrl,
  layout = 'default',
}: {
  format: Format;
  content: { title: string; body: string; cta: string; date: string; venue: string };
  accent: string;
  verticalLabel: string;
  logoUrl?: string;
  layout?: 'default' | 'centered-hero';
}) {
  const isStory = format.id === 'story';
  const isTile = format.id === 'tile';
  const isBanner = format.id === 'banner' || format.id === 'hero';
  const isCentered = layout === 'centered-hero';

  // CTA gradient: default uses pink → accent; centered-hero uses accent tones only.
  const ctaBackground = isCentered
    ? `linear-gradient(135deg, ${accent} 0%, ${accent}CC 100%)`
    : PINK_CTA;

  return (
    <div
      className="relative h-full w-full overflow-hidden"
      style={{ backgroundColor: NAVY }}
    >
      <ChevronBackdrop accent={accent} hideRays={isCentered} />

      {isCentered ? (
        <div
          className="relative z-10 h-full w-full flex flex-col items-center justify-center text-center"
          style={{ padding: '1.6em', gap: '0.9em' }}
        >
          {/* Large logo above the headline */}
          <div style={{ width: '100%', maxWidth: '70%' }}>
            <NextLockup label={verticalLabel} accent={accent} logoUrl={logoUrl} sizeEm={5.6} centered />
          </div>

          <h2
            className="font-bold"
            style={{
              color: accent,
              fontSize: '1.6em',
              lineHeight: 1.05,
              letterSpacing: '-0.02em',
              maxWidth: '22em',
            }}
          >
            {content.title}
          </h2>
          <p
            className="text-white/90"
            style={{ fontSize: '0.8em', lineHeight: 1.35, maxWidth: '22em' }}
          >
            {content.body}
          </p>

          {content.cta && (
            <div
              className="inline-flex items-center gap-2 rounded-full text-white font-semibold"
              style={{
                background: ctaBackground,
                padding: '0.55em 1.4em',
                fontSize: '0.7em',
                letterSpacing: '0.08em',
              }}
            >
              {content.cta.toUpperCase()}
              <span
                className="inline-flex items-center justify-center rounded-full bg-white/20"
                style={{ width: '1.6em', height: '1.6em' }}
              >
                →
              </span>
            </div>
          )}
        </div>
      ) : (
        <div
          className={`relative z-10 h-full w-full ${
            isBanner ? 'flex items-center' : 'flex flex-col justify-between'
          }`}
          style={{ padding: isStory ? '2em' : '1.6em' }}
        >
          <div className={isBanner ? 'flex-shrink-0' : ''} style={{ maxWidth: isBanner ? '38%' : '100%' }}>
            <NextLockup label={verticalLabel} accent={accent} logoUrl={logoUrl} />
            {(isStory || isTile) && (
              <div className="mt-3 text-white/60 text-[0.55em] tracking-[0.3em]">
                {content.date}
              </div>
            )}
          </div>

          <div
            className={isBanner ? 'flex-1' : ''}
            style={{
              marginLeft: isBanner ? '2em' : 0,
              marginTop: isBanner ? 0 : '1.2em',
            }}
          >
            <h2
              className="font-bold"
              style={{
                color: accent,
                fontSize: isStory ? '2em' : isBanner ? '1.6em' : '1.7em',
                lineHeight: 1.05,
                letterSpacing: '-0.02em',
              }}
            >
              {content.title}
            </h2>
            <p
              className="text-white/90 mt-3"
              style={{
                fontSize: isStory ? '0.95em' : '0.8em',
                lineHeight: 1.35,
                maxWidth: '22em',
              }}
            >
              {content.body}
            </p>

            {(isBanner || isStory) && content.cta && (
              <div
                className="inline-flex items-center gap-2 mt-4 rounded-full text-white font-semibold"
                style={{
                  background: ctaBackground,
                  padding: '0.55em 1.4em',
                  fontSize: '0.7em',
                  letterSpacing: '0.08em',
                }}
              >
                {content.cta.toUpperCase()}
                <span
                  className="inline-flex items-center justify-center rounded-full bg-white/20"
                  style={{ width: '1.6em', height: '1.6em' }}
                >
                  →
                </span>
              </div>
            )}
          </div>

          {!isBanner && (
            <div className="text-white/70 text-[0.55em] tracking-[0.25em]">
              {content.venue}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function NextTemplatesSection({
  eventSlug,
  eventName,
  defaultAccent,
  defaultTagline,
  defaultDate,
  defaultVenue,
  nextVariationCanvaLinks,
  onNextVariationCanvaLinksChange,
  nextVariationLogos,
  onNextVariationLogosChange,
  isAdmin = false,
  logos,
}: NextTemplatesSectionProps) {
  const logoUrl = useMemo(() => pickLogoForDark(logos)?.url, [logos]);
  const stackedLogoUrl = useMemo(() => pickLogoForDark(logos, true)?.url, [logos]);
  const slugKey = (eventSlug || '').toLowerCase();
  const preset = NEXT_ACCENTS[slugKey];
  const accent = preset?.accent || defaultAccent || '#13B1F3';
  const verticalLabel = preset?.label || eventName || 'TransPerfect NEXT';

  const [title, setTitle] = useState(
    defaultTagline || 'GenAI and Machine Translation in Retail Marketing:'
  );
  const [body, setBody] = useState(
    'Industry Leaders Discuss Real-World Success at ' + verticalLabel + '.'
  );
  const [cta, setCta] = useState('Request an Invite');
  const [date, setDate] = useState(defaultDate || '24 & 25 SEPTEMBER, 2026');
  const [venue, setVenue] = useState(defaultVenue || 'QEII CENTRE WESTMINSTER · LONDON');

  const content = useMemo(() => ({ title, body, cta, date, venue }), [title, body, cta, date, venue]);

  const refs = useRef<Record<string, HTMLDivElement | null>>({});

  const download = async (fmt: Format) => {
    const node = refs.current[fmt.id];
    if (!node) return;
    try {
      const dataUrl = await toPng(node, {
        width: fmt.width,
        height: fmt.height,
        pixelRatio: 1,
        cacheBust: true,
        style: {
          // Ensure the export uses the true canvas size regardless of on-screen scale.
          transform: 'none',
          width: `${fmt.width}px`,
          height: `${fmt.height}px`,
          fontSize: `${fmt.height / 22}px`,
        },
      });
      const link = document.createElement('a');
      link.download = `${slugKey || 'next'}-${fmt.id}-${fmt.width}x${fmt.height}.png`;
      link.href = dataUrl;
      link.click();
      toast.success(`Exported ${fmt.label}`);
    } catch (e) {
      console.error(e);
      toast.error('Export failed');
    }
  };

  return (
    <section className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Sparkles className="h-6 w-6" style={{ color: accent }} />
            NEXT Template Kit
          </h2>
          <p className="text-muted-foreground mt-1 max-w-2xl">
            Ready-to-use social and event templates matching the TransPerfect NEXT design system —
            chevron backdrop, vertical lockup, orbit ring motif. Recolored to{' '}
            <span className="font-semibold" style={{ color: accent }}>{verticalLabel}</span>{' '}
            automatically. Edit the copy below and download any format as PNG.
          </p>
        </div>
      </div>

      {/* Editable content */}
      <Card className="p-4 grid gap-3 md:grid-cols-2">
        <div>
          <Label>Headline</Label>
          <Textarea value={title} onChange={(e) => setTitle(e.target.value)} rows={2} />
        </div>
        <div>
          <Label>Body</Label>
          <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={2} />
        </div>
        <div>
          <Label>CTA</Label>
          <Input value={cta} onChange={(e) => setCta(e.target.value)} />
        </div>
        <div>
          <Label>Date line</Label>
          <Input value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div className="md:col-span-2">
          <Label>Venue</Label>
          <Input value={venue} onChange={(e) => setVenue(e.target.value)} />
        </div>
      </Card>

      {/* Template previews */}
      <div className="grid gap-6 md:grid-cols-2">
        {FORMATS.map((fmt) => (
          <div key={fmt.id} className="space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-foreground">{fmt.label}</div>
                <div className="text-xs text-muted-foreground">{fmt.width} × {fmt.height}</div>
              </div>
              <Button size="sm" variant="secondary" onClick={() => download(fmt)}>
                <Download className="h-4 w-4 mr-1" /> PNG
              </Button>
            </div>

            {/* On-screen preview (scaled). The exporter renders at true size via inline width/height. */}
            <div className={`${fmt.aspect} w-full rounded-lg overflow-hidden ring-1 ring-border shadow-lg`}>
              <div
                ref={(el) => { refs.current[fmt.id] = el; }}
                className="h-full w-full"
                style={{ fontSize: 'clamp(10px, 2.2vw, 20px)' }}
              >
                <TemplateSurface
                  format={fmt}
                  content={content}
                  accent={accent}
                  verticalLabel={verticalLabel}
                  logoUrl={logoUrl}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ---------------- Sub-Brand Variations Grid ---------------- */}
      {/* Same Social-Templates card language, re-skinned per NEXT vertical:
          logo lockup, headline copy, character/orb graphic, accent colour,
          and CTA button gradient all swap based on the vertical. */}
      <div className="pt-4 border-t border-border space-y-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="space-y-1">
            <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
              <LayoutGrid className="h-5 w-5 text-primary" />
              Sub-Brand Variations
            </h3>
            <p className="text-sm text-muted-foreground max-w-2xl">
              The same social template applied across every NEXT vertical — each
              card auto-swaps the logo lockup, accent colour, character graphic,
              and CTA gradient to match that sub-brand.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Object.entries(NEXT_ACCENTS).map(([vSlug, vPreset]) => {
            const defaults = NEXT_VARIATION_DEFAULTS[vSlug] || {
              title: content.title,
              body: content.body,
              cta: content.cta,
            };
            const variantContent = {
              title: defaults.title,
              body: defaults.body,
              cta: defaults.cta,
              date: content.date,
              venue: content.venue,
            };
            const isActive = vSlug === slugKey;
            return (
              <div
                key={vSlug}
                className="group rounded-xl border border-border bg-card overflow-hidden hover:border-primary/50 hover:shadow-lg transition-all"
              >
                {/* Preview surface — matches Social Templates 4/3 card frame */}
                <div className="aspect-[4/3] relative overflow-hidden">
                  <div className="absolute inset-0" style={{ fontSize: 10 }}>
                    <TemplateSurface
                      format={FORMATS[0]}
                      content={variantContent}
                      accent={vPreset.accent}
                      verticalLabel={vPreset.label}
                      logoUrl={nextVariationLogos?.[vSlug] || stackedLogoUrl || logoUrl}
                      layout="centered-hero"
                    />
                  </div>
                  {/* Character / orb graphic — accent-tinted, subtle */}
                  <div
                    aria-hidden
                    className="pointer-events-none absolute -right-6 -bottom-6 h-28 w-28 rounded-full opacity-70 blur-md"
                    style={{
                      background: `radial-gradient(circle at 30% 30%, ${vPreset.accent}, ${PINK_CTA} 70%, transparent 80%)`,
                    }}
                  />
                  {isActive && (
                    <div className="absolute top-2 left-2 rounded-md px-1.5 py-0.5 text-[9px] font-semibold text-white bg-primary shadow">
                      Current
                    </div>
                  )}
                </div>

                {/* Card body */}
                <div className="p-3 space-y-2">
                  <div className="flex items-start justify-between gap-2 min-w-0">
                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm font-semibold text-foreground truncate">
                        {vPreset.label}
                      </h4>
                      <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">
                        {defaults.title}
                      </p>
                    </div>
                    <span
                      className="mt-0.5 h-4 w-4 shrink-0 rounded-full ring-2 ring-background shadow"
                      style={{ background: vPreset.accent }}
                      aria-hidden
                    />
                  </div>

                  {(() => {
                    const canvaUrl = nextVariationCanvaLinks?.[vSlug] || '';
                    const hasUrl = !!canvaUrl.trim();
                    return (
                      <>
                        <Button
                          size="sm"
                          disabled={!hasUrl}
                          className="w-full h-8 text-xs font-semibold text-white border-0 hover:opacity-90 disabled:opacity-50"
                          style={{
                            background: hasUrl
                              ? `linear-gradient(135deg, ${vPreset.accent} 0%, ${vPreset.accent}CC 100%)`
                              : undefined,
                          }}
                          onClick={() => {
                            if (!hasUrl) return;
                            window.open(canvaUrl, '_blank', 'noopener,noreferrer');
                          }}
                        >
                          {hasUrl ? `Open ${vPreset.label} in Canva` : 'No Canva template yet'}
                        </Button>
                        {isAdmin && onNextVariationCanvaLinksChange && (
                          <Input
                            value={canvaUrl}
                            onChange={(e) =>
                              onNextVariationCanvaLinksChange({
                                ...(nextVariationCanvaLinks || {}),
                                [vSlug]: e.target.value,
                              })
                            }
                            placeholder="Paste Canva template URL…"
                            className="h-7 text-[11px]"
                          />
                        )}
                        {isAdmin && onNextVariationLogosChange && (
                          <Input
                            value={nextVariationLogos?.[vSlug] || ''}
                            onChange={(e) =>
                              onNextVariationLogosChange({
                                ...(nextVariationLogos || {}),
                                [vSlug]: e.target.value,
                              })
                            }
                            placeholder="Paste logo image URL (reversed/white)…"
                            className="h-7 text-[11px]"
                          />
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default NextTemplatesSection;
