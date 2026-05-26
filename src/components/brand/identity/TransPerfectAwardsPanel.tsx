/**
 * TransPerfectAwardsPanel — Awards & recognition presentation standards
 * from the TransPerfect Brand Guidelines 2026 v3.0.
 */

import { useState } from 'react';
import {
  ChevronDown, ChevronUp, Award, CheckCircle2, XCircle,
  Ruler, Type, Palette, ShieldAlert,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const SPECS = [
  { icon: <Ruler className="h-3.5 w-3.5 text-primary" />, label: 'Card geometry', value: 'Square 1:1 thumbnail · 24px padding · 12px corner radius' },
  { icon: <Type className="h-3.5 w-3.5 text-primary" />, label: 'Type', value: 'Geist 14/20pt award name · Geist Mono 11pt year & issuer' },
  { icon: <Palette className="h-3.5 w-3.5 text-primary" />, label: 'Surface', value: 'White card on Alabaster · Navy text · single Digital Blue accent line' },
];

const DO_RULES = [
  'Use the issuing body’s official lockup at 100% black or single-colour',
  'Render every badge inside a white square container for visual parity',
  'Group awards chronologically · most recent first',
  'Cite the year, category and issuing organisation for every entry',
  'Replace pixel badges with vector wherever the issuer publishes one',
];

const DONT_RULES = [
  'Do not recolour, stretch or add effects to third-party award marks',
  'Do not place award badges on Soft Transition orbs or photography',
  'Do not mix portrait and landscape badge ratios in the same grid',
  'Do not display unverified or self-issued “awards”',
  'Do not exceed two accent colours per awards page',
];

export const TransPerfectAwardsPanel = () => {
  const [open, setOpen] = useState(true);
  return (
    <div className="border border-border rounded-xl overflow-hidden bg-card">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors text-left">
        <div className="flex items-center gap-2">
          <Award className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">TransPerfect Awards & Recognition Standards</span>
          <Badge variant="secondary" className="text-[10px] ml-1">Brand Guidelines 2026 · v3.0</Badge>
        </div>
        {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
      </button>
      {open && (
        <div className="px-4 pb-4 space-y-5 border-t border-border pt-4">
          <p className="text-xs text-muted-foreground leading-relaxed">
            Third-party recognition validates the brand — its presentation must
            be quiet and consistent. The issuer's mark leads · TransPerfect's
            voice does not compete with it.
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
              <strong className="text-foreground">Usage rights:</strong> confirm
              you hold written permission to display each badge in marketing
              channels. License terms vary by issuer and region.
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
