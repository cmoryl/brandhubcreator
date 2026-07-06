/**
 * TransPerfectColorTypographyPanel — Brand-specific color + type tokens
 * sourced from the TransPerfect Brand Guidelines 2026 v3.0.
 *
 * Two variants:
 *   - variant="color"      → renders the v3.0 colour system
 *   - variant="typography" → renders the v3.0 type system
 */

import { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Palette,
  Type,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

type Variant = 'color' | 'typography';

interface Props {
  variant: Variant;
}

// ---------- Color system (Master Brand v3.0) ----------
// Values sourced verbatim from TransPerfect Master Brand Color Palette.
type Swatch = {
  name: string;
  hex: string;
  rgb: string;
  cmyk: string;
  hsv: string;
  pantone?: string;
  role?: string;
};

const PRIMARY_COLORS: Swatch[] = [
  { name: 'Blue 500', hex: '#003FC7', rgb: '0, 63, 199', cmyk: '100, 68, 0, 22', hsv: '221°, 100%, 78%', pantone: 'PMS 2728 C', role: 'Primary brand colour' },
  { name: 'Blue 800', hex: '#03002C', rgb: '3, 0, 44',   cmyk: '93, 100, 0, 83', hsv: '244°, 100%, 17%', pantone: 'PMS 2767 C', role: 'Primary brand colour' },
];

// Secondary — 10% usage as an accent colour (percentage may be higher as a background shade).
const SECONDARY_COLORS: Swatch[] = [
  { name: 'Aqua',     hex: '#A1FBF9', rgb: '161, 251, 249', cmyk: '36, 0, 1, 2',  hsv: '179°, 36%, 98%',  pantone: 'PMS 317 C' },
  { name: 'Lavender', hex: '#C2A3FF', rgb: '194, 163, 255', cmyk: '24, 36, 0, 0', hsv: '260°, 36%, 100%', pantone: 'PMS 264 C' },
];

// Tertiary — CTAs, icons, hi-lights, colour pops.
const TERTIARY_COLORS: Swatch[] = [
  { name: 'Yellow', hex: '#FFEB66', rgb: '255, 235, 102', cmyk: '0, 8, 60, 0',  hsv: '52°, 60%, 100%',  pantone: 'PMS 121 C'  },
  { name: 'Green',  hex: '#A6FA87', rgb: '166, 250, 135', cmyk: '34, 0, 46, 2', hsv: '104°, 46%, 98%',  pantone: 'PMS 358 C'  },
  { name: 'Peach',  hex: '#FF9B70', rgb: '255, 155, 112', cmyk: '0, 39, 56, 0', hsv: '18°, 56%, 100%',  pantone: 'PMS 163 C'  },
  { name: 'Pink',   hex: '#EC388A', rgb: '236, 56, 138',  cmyk: '0, 76, 42, 7', hsv: '333°, 76%, 93%',  pantone: 'PMS 2395 C' },
  { name: 'Red',    hex: '#E53D2E', rgb: '229, 61, 46',   cmyk: '0, 73, 80, 10', hsv: '5°, 80%, 90%',   pantone: 'PMS 1788 C' },
];

const NEUTRALS: Swatch[] = [
  { name: 'Dark Gray',  hex: '#666666', rgb: '102, 102, 102', cmyk: '0, 0, 0, 60', hsv: '0°, 0%, 40%'  },
  { name: 'Light Gray', hex: '#F2F2F2', rgb: '242, 242, 242', cmyk: '0, 0, 0, 5',  hsv: '0°, 0%, 95%'  },
  { name: 'Blue White', hex: '#E0E8F5', rgb: '224, 232, 245', cmyk: '10, 6, 0, 3', hsv: '217°, 9%, 96%' },
];

const APPROVED_FOR = [
  'TransPerfect', 'GlobalLink', 'Life Sciences', 'Medical Device',
  'Legal', 'Retail', 'Travel Financial', 'Gaming', 'Digital', 'Tech', 'Health',
];

const COLOR_DO = [
  'Lead with Blue 500 #003FC7 paired with Blue 800 #03002C — the primary system',
  'Use secondary Aqua & Lavender at ~10% as accents (higher only as a background shade)',
  'Reserve tertiary colours for CTAs, icons, hi-lights and colour pops',
  'Verify AA contrast on every text + surface pairing',
];
const COLOR_DONT = [
  'Tint, shade or recolour any swatch — use the exact HEX/Pantone values',
  'Stack multiple tertiary colours in the same composition',
  'Let secondary/tertiary colours overpower the primary blues',
  'Introduce off-palette hues (other greens, reds, neons, teals)',
];

// ---------- Typography system ----------
const TYPE_STYLES = [
  { name: 'Display',  font: 'Geist',     weight: '600 · Semibold', size: '64 / 72', tracking: '-0.02em', usage: 'Hero headlines, big editorial moments' },
  { name: 'Headline', font: 'Geist',     weight: '600 · Semibold', size: '40 / 48', tracking: '-0.01em', usage: 'Section titles, modal headers' },
  { name: 'Subhead',  font: 'Geist',     weight: '500 · Medium',   size: '24 / 32', tracking: '-0.005em', usage: 'Card titles, sub-sections' },
  { name: 'Body',     font: 'Inter',     weight: '400 · Regular',  size: '16 / 24', tracking: '0',        usage: 'Long-form copy, paragraphs' },
  { name: 'Caption',  font: 'Inter',     weight: '500 · Medium',   size: '12 / 16', tracking: '0.01em',   usage: 'Labels, meta, eyebrows' },
  { name: 'Mono',     font: 'JetBrains Mono', weight: '400 · Regular', size: '14 / 20', tracking: '0', usage: 'Code, hex values, data' },
];

const TYPE_DO = [
  'Geist for all display + heading levels',
  'Inter for all body, UI labels and long-form reading',
  'Tighten tracking on display sizes, loosen on captions',
  'Use sentence case for headlines (never ALL CAPS for marketing copy)',
];
const TYPE_DONT = [
  'Mix Geist and Inter inside a single heading',
  'Use serifs or condensed faces — TransPerfect is humanist sans only',
  'Set body copy below 14px on web',
  'Letter-space body copy or justify long-form text',
];

export const TransPerfectColorTypographyPanel = ({ variant }: Props) => {
  const [open, setOpen] = useState(false);
  const isColor = variant === 'color';

  return (
    <div className="border border-border rounded-xl overflow-hidden bg-card mb-4">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors text-left"
      >
        <div className="flex items-center gap-2">
          {isColor ? <Palette className="h-4 w-4 text-primary" /> : <Type className="h-4 w-4 text-primary" />}
          <span className="text-sm font-semibold text-foreground">
            {isColor ? 'TransPerfect Colour System' : 'TransPerfect Typography System'}
          </span>
          <Badge variant="secondary" className="text-[10px] ml-1">
            Brand Guidelines 2026 · v3.0
          </Badge>
        </div>
        {open ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-5 border-t border-border pt-4">
          {isColor ? <ColorBody /> : <TypeBody />}
        </div>
      )}
    </div>
  );
};

// ============== Color body ==============
function ColorBody() {
  return (
    <>
      <p className="text-xs text-muted-foreground leading-relaxed">
        The <strong className="text-foreground">Master Brand</strong> palette leads with{' '}
        <strong className="text-foreground">Blue 500 #003FC7</strong> and{' '}
        <strong className="text-foreground">Blue 800 #03002C</strong>. Secondary Aqua & Lavender
        are used at ~10% as accents; tertiary colours are reserved for CTAs, icons, hi-lights
        and colour pops.
      </p>

      <div className="rounded-lg border border-border/60 bg-muted/30 p-3">
        <p className="text-[10px] uppercase tracking-wide font-semibold text-primary mb-1.5">
          Approved For
        </p>
        <div className="flex flex-wrap gap-1.5">
          {APPROVED_FOR.map((label) => (
            <Badge key={label} variant="secondary" className="text-[10px] font-medium">
              {label}
            </Badge>
          ))}
        </div>
      </div>

      <SubHeading>Primary Color Palette</SubHeading>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {PRIMARY_COLORS.map((c) => <SwatchCard key={c.hex} {...c} large />)}
      </div>

      <SubHeading>Secondary Color Palette · 10% accent</SubHeading>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {SECONDARY_COLORS.map((c) => <SwatchCard key={c.hex} {...c} />)}
      </div>

      <SubHeading>Tertiary Colors · CTAs, icons, hi-lights, colour pops</SubHeading>
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {TERTIARY_COLORS.map((c) => <SwatchCard key={c.hex} {...c} />)}
      </div>

      <SubHeading>Supporting Neutrals</SubHeading>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {NEUTRALS.map((c) => <SwatchCard key={c.hex} {...c} />)}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-border pt-4">
        <RuleList tone="green" title="Do" items={COLOR_DO} />
        <RuleList tone="red"   title="Don’t" items={COLOR_DONT} />
      </div>
    </>
  );
}


// ============== Type body ==============
function TypeBody() {
  return (
    <>
      <p className="text-xs text-muted-foreground leading-relaxed">
        <strong className="text-foreground">Geist</strong> for display and headings;{' '}
        <strong className="text-foreground">Inter</strong> for body and UI. JetBrains Mono is
        reserved for code, hex values and tabular data.
      </p>

      <div className="space-y-3">
        {TYPE_STYLES.map((t) => (
          <div
            key={t.name}
            className="grid grid-cols-12 gap-3 items-baseline p-3 rounded-lg bg-muted/40 border border-border/60"
          >
            <div className="col-span-12 sm:col-span-3">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold">
                {t.name}
              </p>
              <p className="text-xs text-foreground/85">{t.font} · {t.weight}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {t.size} · {t.tracking}
              </p>
            </div>
            <div className="col-span-12 sm:col-span-9">
              <p
                className="text-foreground leading-tight"
                style={{
                  fontFamily: t.font === 'JetBrains Mono'
                    ? '"JetBrains Mono", ui-monospace, monospace'
                    : `"${t.font}", system-ui, sans-serif`,
                  fontSize: t.name === 'Display' ? '2rem'
                          : t.name === 'Headline' ? '1.5rem'
                          : t.name === 'Subhead'  ? '1.125rem'
                          : t.name === 'Caption'  ? '0.75rem'
                          : '1rem',
                  fontWeight: t.weight.startsWith('600') ? 600
                            : t.weight.startsWith('500') ? 500 : 400,
                  letterSpacing: t.tracking,
                }}
              >
                Transforming global performance.
              </p>
              <p className="text-[10px] text-muted-foreground mt-1">{t.usage}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-border pt-4">
        <RuleList tone="green" title="Do" items={TYPE_DO} />
        <RuleList tone="red"   title="Don’t" items={TYPE_DONT} />
      </div>
    </>
  );
}

// ============== Shared ==============
function SubHeading({ children }: { children: React.ReactNode }) {
  return (
    <h5 className="text-[10px] uppercase tracking-wide font-semibold text-muted-foreground">
      {children}
    </h5>
  );
}

function SwatchCard({
  name,
  hex,
  rgb,
  cmyk,
  hsv,
  role,
  pantone,
  large,
}: {
  name: string;
  hex: string;
  rgb?: string;
  cmyk?: string;
  hsv?: string;
  role?: string;
  pantone?: string;
  large?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(hex);
    setCopied(true);
    toast.success(`${hex} copied`);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button
      onClick={copy}
      className="text-left group rounded-lg overflow-hidden border border-border/60 bg-muted/30 hover:border-primary/50 transition-colors"
    >
      <div
        className={`${large ? 'h-20' : 'h-14'} w-full relative`}
        style={{ backgroundColor: hex }}
      >
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
          {copied ? (
            <Check className="h-4 w-4 text-white" />
          ) : (
            <Copy className="h-4 w-4 text-white" />
          )}
        </div>
      </div>
      <div className="p-2 space-y-0.5">
        <p className="text-xs font-semibold text-foreground">{name}</p>
        <p className="text-[10px] font-mono uppercase text-muted-foreground">HEX {hex}</p>
        {rgb && <p className="text-[10px] font-mono text-muted-foreground">RGB {rgb}</p>}
        {cmyk && <p className="text-[10px] font-mono text-muted-foreground">CMYK {cmyk}</p>}
        {hsv && <p className="text-[10px] font-mono text-muted-foreground">HSV {hsv}</p>}
        {pantone && <p className="text-[10px] font-semibold text-primary">{pantone}</p>}
        {role && <p className="text-[10px] text-foreground/70 leading-snug pt-0.5">{role}</p>}
      </div>
    </button>
  );
}


function RuleList({
  tone,
  title,
  items,
}: {
  tone: 'green' | 'red';
  title: string;
  items: string[];
}) {
  const dot = tone === 'green' ? 'bg-green-500' : 'bg-red-500';
  const heading =
    tone === 'green'
      ? 'text-green-700 dark:text-green-400'
      : 'text-red-700 dark:text-red-400';
  const Icon = tone === 'green' ? CheckCircle2 : XCircle;
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5">
        <Icon className={`h-4 w-4 ${tone === 'green' ? 'text-green-600' : 'text-red-600'}`} />
        <h5 className={`text-sm font-semibold ${heading}`}>{title}</h5>
      </div>
      <ul className="space-y-1.5">
        {items.map((s, i) => (
          <li key={i} className="flex items-start gap-2 text-xs text-foreground/80">
            <span className={`mt-0.5 h-1.5 w-1.5 rounded-full shrink-0 ${dot}`} />
            {s}
          </li>
        ))}
      </ul>
    </div>
  );
}
