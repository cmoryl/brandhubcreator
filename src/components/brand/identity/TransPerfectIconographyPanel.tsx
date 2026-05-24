/**
 * TransPerfectIconographyPanel — Iconography rules from the
 * TransPerfect Brand Guidelines 2026 v3.0.
 *
 * Surfaces grid, stroke, corner, color and usage rules so every icon
 * shipped under the TransPerfect mark feels cut from the same cloth.
 */

import { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Shapes,
  CheckCircle2,
  XCircle,
  Grid3X3,
  Minus,
  CornerDownRight,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const SPECS = [
  { icon: <Grid3X3 className="h-3.5 w-3.5 text-primary" />, label: 'Grid', value: '24 × 24 pixel grid · 20px live area · 2px padding' },
  { icon: <Minus className="h-3.5 w-3.5 text-primary" />, label: 'Stroke', value: '1.5px outline · 2px filled · pixel-aligned' },
  { icon: <CornerDownRight className="h-3.5 w-3.5 text-primary" />, label: 'Corners', value: '2px exterior radius · 1px interior · round caps + joins' },
];

const STYLES = [
  { name: 'Outline (default)', desc: '1.5px stroke in Digital Blue or currentColor. 90% of UI usage.' },
  { name: 'Filled',            desc: 'Solid Digital Blue. Reserved for selected/active states.' },
  { name: 'Duotone',           desc: 'Digital Blue + 30% tint. Marketing surfaces only.' },
];

const DO_RULES = [
  'Snap every node to the 24px grid — no half pixels',
  'Use Digital Blue #003FC7 or currentColor — never raw black',
  'Maintain visual weight across the set (eyeball balance, not math)',
  'Pair filled icons only with filled, outline with outline',
];

const DONT_RULES = [
  'Mix stroke widths inside a single icon',
  'Add gradients, shadows or skeuomorphic detail',
  'Recolour icons with off-palette hues (no greens, reds, neons)',
  'Use icons smaller than 16px on web or 20pt on print',
  'Crop the live area — keep 2px padding on every side',
];

export const TransPerfectIconographyPanel = () => {
  const [open, setOpen] = useState(true);

  return (
    <div className="border border-border rounded-xl overflow-hidden bg-card">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors text-left"
      >
        <div className="flex items-center gap-2">
          <Shapes className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">
            TransPerfect Iconography System
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
            TransPerfect icons are humanist, geometric and weightless — built
            on a 24px grid with a 1.5px stroke. Style follows the wordmark:
            confident, direct, never decorative.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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

          <div>
            <h5 className="text-[10px] uppercase tracking-wide font-semibold text-muted-foreground mb-2">
              Styles
            </h5>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {STYLES.map((s) => (
                <div key={s.name} className="p-3 rounded-lg bg-muted/40 border border-border/60">
                  <p className="text-xs font-semibold text-foreground">{s.name}</p>
                  <p className="text-[11px] text-muted-foreground leading-snug mt-1">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-border pt-4">
            <RuleList tone="green" title="Do" items={DO_RULES} />
            <RuleList tone="red"   title="Don’t" items={DONT_RULES} />
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
