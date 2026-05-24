/**
 * TransPerfectCollateralPanel — Digital collateral production standards
 * from the TransPerfect Brand Guidelines 2026 v3.0.
 *
 * Covers briefs, spotlights, whitepapers, case studies, eBrochures, pitch
 * decks and capability statements. Ensures every export carries the
 * wordmark, lockup margins, type system and Digital Blue accent correctly.
 */

import { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  FileText,
  CheckCircle2,
  XCircle,
  Ruler,
  Type,
  Palette,
  Layers,
  ShieldAlert,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const SPECS = [
  { icon: <Ruler className="h-3.5 w-3.5 text-primary" />,  label: 'Page geometry', value: 'A4 / US Letter · 18mm outer margin · 12-column grid · 8pt baseline' },
  { icon: <Type className="h-3.5 w-3.5 text-primary" />,   label: 'Type system',   value: 'Geist Display 28–48pt headlines · Geist 10/14pt body · Mono for data' },
  { icon: <Palette className="h-3.5 w-3.5 text-primary" />, label: 'Colour',       value: 'Navy #000B5A primary · Digital Blue #003FC7 accent · Alabaster surface' },
  { icon: <Layers className="h-3.5 w-3.5 text-primary" />, label: 'Cover anatomy', value: 'Wordmark top-left · Category eyebrow · Headline · One image / orb' },
];

const DO_RULES = [
  'Lead every cover with a single hero image OR a single Soft Transition orb — never both',
  'Lock the wordmark to the top-left corner, exclusion zone = cap-height of the "T"',
  'Keep body copy in Geist 10/14pt · max 65 characters per line for readability',
  'Use Digital Blue #003FC7 only for active links, KPIs and one accent per spread',
  'Export press-ready PDF/X-4 for print, PDF 1.7 with embedded fonts for digital',
  'Include a closing page with legal line, region, and a single approved CTA',
];

const DONT_RULES = [
  'Do not stretch the wordmark, recolour it, or place it over busy photography',
  'Do not use more than two type sizes per spread — restraint is the brand',
  'Do not mix Soft Transition orbs with photography in the same frame',
  'Do not use shadows, bevels, glows or gradients on body text',
  'Do not exceed three colours per page (Navy, Alabaster, one accent)',
  'Do not ship without a Brand Operations review for external distribution',
];

export const TransPerfectCollateralPanel = () => {
  const [open, setOpen] = useState(true);

  return (
    <div className="border border-border rounded-xl overflow-hidden bg-card">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors text-left"
      >
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">
            TransPerfect Digital Collateral Standards
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
            Briefs, spotlights, whitepapers, case studies and decks are the
            most frequently shared TransPerfect surfaces. They must read as
            one continuous system — same grid, same wordmark placement, same
            two-colour discipline — across every format and language.
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
              <strong className="text-foreground">Localisation note:</strong>{' '}
              all multilingual collateral routes through GlobalLink. Source
              files must keep editable type layers — no rasterised headlines —
              so translated versions retain the Geist type system and grid.
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
