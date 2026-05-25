/**
 * TransPerfectWebsitePanel — Digital web standards
 * from the TransPerfect Brand Guidelines 2026 v3.0.
 */

import { useState } from 'react';
import {
  ChevronDown, ChevronUp, Globe, CheckCircle2, XCircle,
  Layout, Type, Palette, Accessibility, ShieldAlert,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const SPECS = [
  { icon: <Layout className="h-3.5 w-3.5 text-primary" />, label: 'Grid & layout', value: '1440 max-width · 12-col · 24px gutters · 96/64/48 vertical rhythm' },
  { icon: <Type className="h-3.5 w-3.5 text-primary" />, label: 'Type', value: 'Geist Display 56–96px H1 · Geist 18/28px body · max 65ch line length' },
  { icon: <Palette className="h-3.5 w-3.5 text-primary" />, label: 'Colour', value: 'Navy #000B5A canvas · Digital Blue #003FC7 CTA · Alabaster surface' },
  { icon: <Accessibility className="h-3.5 w-3.5 text-primary" />, label: 'Accessibility', value: 'WCAG 2.2 AA minimum · 4.5:1 body · 3:1 large · visible focus rings' },
];

const DO_RULES = [
  'Lock wordmark to top-left of every page · 24px from edge',
  'Use Digital Blue #003FC7 only for primary CTAs and active links',
  'One hero image OR one Soft Transition orb per fold — never both',
  'Localise every market through GlobalLink — never hand-translate',
  'Lazy-load below-the-fold imagery, prefer WebP/AVIF',
  'Pages must reach LCP < 2.5s, CLS < 0.1, INP < 200ms on 4G',
];

const DONT_RULES = [
  'Do not use auto-playing video with sound or carousels without pause',
  'Do not place white text on photography without a Navy scrim',
  'Do not introduce third-party fonts — Geist is the only system',
  'Do not ship pages without alt-text, skip links and landmark roles',
  'Do not redesign navigation per market — the system is global',
];

export const TransPerfectWebsitePanel = () => {
  const [open, setOpen] = useState(true);
  return (
    <div className="border border-border rounded-xl overflow-hidden bg-card">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors text-left">
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">TransPerfect Website Standards</span>
          <Badge variant="secondary" className="text-[10px] ml-1">Brand Guidelines 2026 · v3.0</Badge>
        </div>
        {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
      </button>
      {open && (
        <div className="px-4 pb-4 space-y-5 border-t border-border pt-4">
          <p className="text-xs text-muted-foreground leading-relaxed">
            Every TransPerfect web property — transperfect.com, product sites, microsites — runs
            on the same grid, type system and accessibility contract. The web is the brand's
            most-visited surface; restraint here is non-negotiable.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
              <strong className="text-foreground">Governance:</strong> all top-level domains and
              subdomains require Brand Operations sign-off. Product microsites inherit this
              system — overrides must be documented in the regional variant.
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
