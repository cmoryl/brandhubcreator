/**
 * TransPerfectPresentationPanel — Presentation template standards
 * from the TransPerfect Brand Guidelines 2026 v3.0.
 */

import { useState } from 'react';
import {
  ChevronDown, ChevronUp, Presentation, CheckCircle2, XCircle,
  Ruler, Type, Palette, ShieldAlert,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const SPECS = [
  { icon: <Ruler className="h-3.5 w-3.5 text-primary" />, label: 'Slide canvas', value: '16:9 · 1920×1080 master · 48px outer margin · 12-col grid' },
  { icon: <Type className="h-3.5 w-3.5 text-primary" />, label: 'Type', value: 'Geist Display 44pt title · Geist 18/24pt body · 12pt footer' },
  { icon: <Palette className="h-3.5 w-3.5 text-primary" />, label: 'Palette', value: 'Navy #000B5A · Digital Blue #003FC7 · Alabaster · max 3 colours / slide' },
];

const DO_RULES = [
  'Wordmark top-left at 48px from edge on every slide',
  'One headline, one chart or one quote per slide — let it breathe',
  'Use Geist Mono for stats, KPIs and side-by-side data comparisons',
  'Lock chart colour order to Digital Blue → Navy → neutral greys',
  'Number slides in the footer for live presentation reference',
  'Export to .pptx with embedded fonts for handoff outside the system',
];

const DONT_RULES = [
  'Do not centre-stack body copy or use justified paragraphs',
  'Do not animate slide transitions beyond cut or 200ms fade',
  'Do not introduce drop-shadows, glows or 3D bevels on type or shapes',
  'Do not place photography behind body copy without a Navy scrim',
  'Do not exceed 6 bullets per slide — split, don’t compress',
];

export const TransPerfectPresentationPanel = () => {
  const [open, setOpen] = useState(true);
  return (
    <div className="border border-border rounded-xl overflow-hidden bg-card">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors text-left">
        <div className="flex items-center gap-2">
          <Presentation className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">TransPerfect Presentation Standards</span>
          <Badge variant="secondary" className="text-[10px] ml-1">Brand Guidelines 2026 · v3.0</Badge>
        </div>
        {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
      </button>
      {open && (
        <div className="px-4 pb-4 space-y-5 border-t border-border pt-4">
          <p className="text-xs text-muted-foreground leading-relaxed">
            Pitch decks, capability statements and internal presentations are
            the brand’s most-shared collateral. Templates exist so every deck
            reads as one company — restraint over decoration.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {SPECS.map((s) => (
              <div key={s.label} className="p-2.5 rounded-lg bg-muted/40 border border-border/60">
                <div className="flex items-center gap-1.5 mb-1">
                  {s.icon}
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{s.label}</span>
                </div>
                <p className="text-xs text-foreground/85 leading-snug">{s.value}</p>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-border pt-4">
            <RuleList tone="green" title="Do" items={DO_RULES} />
            <RuleList tone="red" title="Don’t" items={DONT_RULES} />
          </div>
          <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/60 border border-border">
            <ShieldAlert className="h-4 w-4 text-primary mt-0.5 shrink-0" />
            <p className="text-xs text-muted-foreground leading-relaxed">
              <strong className="text-foreground">Source files:</strong> always
              ship the editable master (.pptx, .key or Figma) alongside the
              PDF export so regional teams can localise without redrawing.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

function RuleList({ tone, title, items }: { tone: 'green' | 'red'; title: string; items: string[] }) {
  const dot = tone === 'green' ? 'bg-green-500' : 'bg-red-500';
  const heading = tone === 'green' ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400';
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
            <span className={`mt-0.5 h-1.5 w-1.5 rounded-full shrink-0 ${dot}`} />{s}
          </li>
        ))}
      </ul>
    </div>
  );
}
