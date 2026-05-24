/**
 * TransPerfectQRPanel — QR code production standards
 * from the TransPerfect Brand Guidelines 2026 v3.0.
 *
 * Surfaces module shape, error-correction, colour, sizing and embed
 * rules so every QR shipped under the TransPerfect mark scans cleanly
 * and looks like it belongs to the brand.
 */

import { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  QrCode,
  CheckCircle2,
  XCircle,
  Ruler,
  ShieldCheck,
  Palette,
  Layers,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const SPECS = [
  { icon: <Layers className="h-3.5 w-3.5 text-primary" />,  label: 'Modules',  value: 'Rounded square · 30% corner radius · no custom shapes' },
  { icon: <ShieldCheck className="h-3.5 w-3.5 text-primary" />, label: 'Error correction', value: 'Level H (30%) — required when wordmark is embedded' },
  { icon: <Palette className="h-3.5 w-3.5 text-primary" />, label: 'Colour',    value: 'Foreground Navy #000B5A or Digital Blue #003FC7 · background pure white' },
  { icon: <Ruler className="h-3.5 w-3.5 text-primary" />,   label: 'Size',     value: 'Minimum 24mm print · 96px digital · 4-module quiet zone' },
];

const DO_RULES = [
  'Use the TransPerfect symbol centred in a white knockout, 22% of code area',
  'Test every code at production size on three devices before shipping',
  'Lock destination URLs through Brand Operations — no personal redirects',
  'Pair with a one-line CTA: "Scan to learn more" in Geist Medium 12pt',
];

const DONT_RULES = [
  'Do not place QR codes on photography without a white safety panel',
  'Do not gradient, outline or invert the modules',
  'Do not embed the full wordmark — symbol only inside the code',
  'Do not exceed 22% logo coverage — scan reliability drops below 95%',
  'Do not shrink below the 24mm / 96px minimum, even on collateral edges',
];

export const TransPerfectQRPanel = () => {
  const [open, setOpen] = useState(true);

  return (
    <div className="border border-border rounded-xl overflow-hidden bg-card">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors text-left"
      >
        <div className="flex items-center gap-2">
          <QrCode className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">
            TransPerfect QR Code Standards
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
            QR codes are functional brand surfaces. They must scan on the
            first try, look intentional next to the wordmark, and route
            through approved short-links. Decoration is the enemy of reach.
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
