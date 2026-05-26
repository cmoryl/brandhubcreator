/**
 * TransPerfectSocialPanel — Social media production standards
 * from the TransPerfect Brand Guidelines 2026 v3.0.
 *
 * Covers feed posts, stories/reels, profile/cover art, and paid placements.
 * Ensures every social surface keeps the wordmark, type system, Digital Blue
 * accent and Soft Transition orb usage on-brand.
 */

import { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Share2,
  CheckCircle2,
  XCircle,
  Ruler,
  Type,
  Palette,
  Image as ImageIcon,
  ShieldAlert,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const SPECS = [
  { icon: <Ruler className="h-3.5 w-3.5 text-primary" />,    label: 'Safe area',     value: 'Keep wordmark & copy inside 80% centred safe zone · 64px outer padding' },
  { icon: <Type className="h-3.5 w-3.5 text-primary" />,     label: 'Type system',   value: 'Geist Display 48–96pt headlines · Geist 16/22pt body · single weight per post' },
  { icon: <Palette className="h-3.5 w-3.5 text-primary" />,  label: 'Colour',        value: 'Navy #000B5A canvas · Digital Blue #003FC7 accent · Alabaster surface' },
  { icon: <ImageIcon className="h-3.5 w-3.5 text-primary" />, label: 'Imagery',      value: 'One hero photograph OR one Soft Transition orb — never both in a frame' },
];

const DO_RULES = [
  'Lock the wordmark to top-left or bottom-left with cap-height exclusion zone',
  'Lead every post with a single idea — one headline, one image, one CTA',
  'Use Digital Blue #003FC7 only for the CTA, link sticker or one accent shape',
  'Crop responsibly: design for the 1:1 safe area, extend art to 4:5 and 9:16',
  'Caption in plain English first — translations route through GlobalLink',
  'Alt-text every image · describe the subject, not the brand',
];

const DONT_RULES = [
  'Do not place the wordmark over busy photography or a person’s face',
  'Do not stack more than two type sizes in a single post',
  'Do not use emoji as bullet points or replacements for words',
  'Do not apply gradients, glows or drop-shadows to the wordmark',
  'Do not mix Soft Transition orbs with photography in the same frame',
  'Do not ship paid placements without Brand Operations review',
];

export const TransPerfectSocialPanel = () => {
  const [open, setOpen] = useState(true);

  return (
    <div className="border border-border rounded-xl overflow-hidden bg-card">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors text-left"
      >
        <div className="flex items-center gap-2">
          <Share2 className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">
            TransPerfect Social Asset Standards
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
          <p className="text-xs text-muted-foreground leading-relaxed">
            Social is the most public surface of the brand. Posts must read
            as TransPerfect at thumbnail size — same wordmark placement, same
            two-colour discipline, same restrained typography — whether the
            format is a 1:1 feed post, 9:16 story, or 16:9 reel cover.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {SPECS.map((s) => (
              <div key={s.label} className="p-2.5 rounded-lg bg-muted/40 border border-border/60">
                <div className="flex items-center gap-1.5 mb-1">
                  {s.icon}
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                    {s.label}
                  </span>
                </div>
                <p className="text-xs text-foreground/85 leading-snug">{s.value}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-border pt-4">
            <RuleList tone="green" title="Do" items={DO_RULES} />
            <RuleList tone="red"   title="Don’t" items={DONT_RULES} />
          </div>

          <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/60 border border-border">
            <ShieldAlert className="h-4 w-4 text-primary mt-0.5 shrink-0" />
            <p className="text-xs text-muted-foreground leading-relaxed">
              <strong className="text-foreground">Channel ownership:</strong>{' '}
              corporate handles are centrally managed by Brand Operations.
              Regional and product handles inherit this system — overrides
              require written approval and route through GlobalLink for
              every non-English market.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

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
