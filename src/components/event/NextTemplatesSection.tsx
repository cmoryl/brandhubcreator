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
import { Download, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

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

/** Diagonal chevron pattern rendered as SVG for crisp export at any scale. */
function ChevronBackdrop({ accent }: { accent: string }) {
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
      {/* Left-side chevron rays */}
      <g opacity="0.85" stroke="url(#np-chev)" strokeWidth="2" fill="none">
        {Array.from({ length: 18 }).map((_, i) => {
          const x = -200 + i * 40;
          return <path key={i} d={`M${x} 800 L${x + 400} 0`} />;
        })}
      </g>
      {/* Right-side orbit rings */}
      <g opacity="0.35" stroke={accent} strokeWidth="1.2" fill="none">
        <circle cx="1000" cy="400" r="260" />
        <circle cx="1000" cy="400" r="340" />
        <circle cx="1000" cy="400" r="420" />
      </g>
      {/* Orbit dots */}
      <g fill="#fff">
        <circle cx="740" cy="400" r="4" />
        <circle cx="1000" cy="60" r="3" />
        <circle cx="1000" cy="740" r="3" />
      </g>
    </svg>
  );
}

/** Vertical NEXT lockup (matches the Canva reference lockup style). */
function NextLockup({ label, accent }: { label: string; accent: string }) {
  const [prefix, ...rest] = label.replace(/\s*NEXT\s*/i, '|NEXT').split('|');
  const suffix = rest.join('') || 'NEXT';
  return (
    <div className="leading-none">
      <div className="text-white font-black tracking-tight" style={{ fontSize: '0.9em' }}>
        {prefix.trim() || 'TransPerfect'}
      </div>
      <div
        className="font-black tracking-tighter"
        style={{
          fontSize: '2.4em',
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

/** One rendered template surface. All layouts share this shell. */
function TemplateSurface({
  format,
  content,
  accent,
  verticalLabel,
}: {
  format: Format;
  content: { title: string; body: string; cta: string; date: string; venue: string };
  accent: string;
  verticalLabel: string;
}) {
  const isStory = format.id === 'story';
  const isTile = format.id === 'tile';
  const isBanner = format.id === 'banner' || format.id === 'hero';

  // Scale everything relative to the surface's own em (set by parent inline font-size).
  return (
    <div
      className="relative h-full w-full overflow-hidden"
      style={{ backgroundColor: NAVY }}
    >
      <ChevronBackdrop accent={accent} />

      <div
        className={`relative z-10 h-full w-full ${
          isBanner ? 'flex items-center' : isTile ? 'flex flex-col justify-between' : 'flex flex-col justify-between'
        }`}
        style={{ padding: isStory ? '2em' : '1.6em' }}
      >
        {/* Lockup */}
        <div className={isBanner ? 'flex-shrink-0' : ''} style={{ maxWidth: isBanner ? '38%' : '100%' }}>
          <NextLockup label={verticalLabel} accent={accent} />
          {(isStory || isTile) && (
            <div className="mt-3 text-white/60 text-[0.55em] tracking-[0.3em]">
              {content.date}
            </div>
          )}
        </div>

        {/* Copy block */}
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
                background: PINK_CTA,
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

        {/* Bottom meta */}
        {!isBanner && (
          <div className="text-white/70 text-[0.55em] tracking-[0.25em]">
            {content.venue}
          </div>
        )}
      </div>
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
}: NextTemplatesSectionProps) {
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
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default NextTemplatesSection;
