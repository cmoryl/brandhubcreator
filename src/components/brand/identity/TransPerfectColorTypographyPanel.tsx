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

// ---------- Color system ----------
const CORE_COLORS = [
  { name: 'Digital Blue', hex: '#003FC7', role: 'Primary brand colour · CTAs, links, accents', pantone: 'PMS 2728 C' },
  { name: 'Dark Blue',    hex: '#03002C', role: 'Authority surface · headlines on light, base on dark', pantone: 'PMS 282 C' },
];

const ACCENT_COLORS = [
  { name: 'Lavender',   hex: '#7C6BD1', role: 'Soft Transition orb mid-tone' },
  { name: 'Turquoise',  hex: '#3DC0BD', role: 'Accent · data viz, highlights' },
  { name: 'Yellow',     hex: '#FFD400', role: 'Energy accent · sparingly' },
  { name: 'Orange',     hex: '#FF6B00', role: 'Warm accent · alerts, callouts' },
];

const NEUTRALS = [
  { name: 'Alabaster',  hex: '#E5E0D5' },
  { name: 'Light Gray', hex: '#F2F2F2' },
  { name: 'Dark Gray',  hex: '#666666' },
  { name: 'Blue White', hex: '#E0EAF5' },
];

const COLOR_DO = [
  'Lead with Digital Blue #003FC7 — it is the brand',
  'Pair Digital Blue with Dark Blue or Alabaster for premium contrast',
  'Use accents sparingly — one accent per composition',
  'Verify AA contrast on every text + surface pairing',
];
const COLOR_DONT = [
  'Tint or shade Digital Blue — use the exact hex',
  'Stack multiple accent colours in the same composition',
  'Place body copy on the bright centre of a Soft Transition orb',
  'Introduce off-palette greens, reds or neons',
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
  const [open, setOpen] = useState(true);
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
        TransPerfect leads with <strong className="text-foreground">Digital Blue #003FC7</strong>{' '}
        paired with <strong className="text-foreground">Dark Blue #03002C</strong>. Accents are
        reserved for moments of energy; neutrals do the heavy lifting in long-form layouts.
      </p>

      <SubHeading>Core</SubHeading>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {CORE_COLORS.map((c) => <SwatchCard key={c.hex} {...c} large />)}
      </div>

      <SubHeading>Accents</SubHeading>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {ACCENT_COLORS.map((c) => <SwatchCard key={c.hex} {...c} />)}
      </div>

      <SubHeading>Neutrals</SubHeading>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
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
  role,
  pantone,
  large,
}: {
  name: string;
  hex: string;
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
        <p className="text-[10px] font-mono uppercase text-muted-foreground">{hex}</p>
        {pantone && <p className="text-[10px] text-muted-foreground">{pantone}</p>}
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
