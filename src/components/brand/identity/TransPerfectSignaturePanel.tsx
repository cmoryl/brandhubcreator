/**
 * TransPerfectSignaturePanel — Email signature & banner standards
 * from the TransPerfect Brand Guidelines 2026 v3.0.
 *
 * Surfaces the canonical signature anatomy, type/colour spec, banner
 * rules and do/don't list at the top of the Signatures section when
 * the active brand is TransPerfect.
 */

import { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Mail,
  CheckCircle2,
  XCircle,
  Type,
  Image as ImageIcon,
  Palette,
  ShieldAlert,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const ANATOMY: { label: string; value: string }[] = [
  { label: 'Line 1', value: 'First Last — Bold, Geist 13/16, Navy #000B5A' },
  { label: 'Line 2', value: 'Job Title — Regular, Geist 12/16, Dark Gray #666' },
  { label: 'Line 3', value: 'TransPerfect — Bold, Geist 12/16, Digital Blue #003FC7' },
  { label: 'Line 4', value: 'Office +1 000.000.0000 · Mobile +1 000.000.0000' },
  { label: 'Line 5', value: 'firstinitiallastname@transperfect.com' },
  { label: 'Line 6', value: 'transperfect.com — underlined, Digital Blue' },
];

const SPEC = [
  { icon: <Type className="h-3.5 w-3.5 text-primary" />,    label: 'Type',     value: 'Geist · 12–13px · 16px line-height · left-aligned' },
  { icon: <Palette className="h-3.5 w-3.5 text-primary" />, label: 'Colour',   value: 'Navy #000B5A · Digital Blue #003FC7 · Dark Gray #666666' },
  { icon: <ImageIcon className="h-3.5 w-3.5 text-primary" />, label: 'Banner', value: '600 × 100 px · ≤ 50 KB · PNG/JPG · 72 dpi · alt text required' },
];

const DO_RULES = [
  'Use the TransPerfect wordmark, never the symbol alone',
  'Keep total signature height under 180px including banner',
  'Pin one approved campaign banner at a time — rotate centrally',
  'Use plain HTML tables — no background images or web fonts',
  'Include accessible alt text on every image',
];

const DONT_RULES = [
  'Do not add quotes, taglines or “sent from” lines',
  'Do not embed social icons larger than 16px',
  'Do not use coloured backgrounds behind the signature block',
  'Do not link the wordmark anywhere except transperfect.com',
  'Do not attach confidentiality disclaimers as images',
];

export const TransPerfectSignaturePanel = () => {
  const [open, setOpen] = useState(true);

  return (
    <div className="border border-border rounded-xl overflow-hidden bg-card">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors text-left"
      >
        <div className="flex items-center gap-2">
          <Mail className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">
            TransPerfect Email Signature Standards
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
            Every TransPerfect employee ships the same signature. Six lines,
            one font, three colours, one approved banner. Consistency is the
            brand — personal flair belongs in the body of the email.
          </p>

          <div>
            <h5 className="text-[10px] uppercase tracking-wide font-semibold text-muted-foreground mb-2">
              Signature anatomy
            </h5>
            <div className="rounded-lg border border-border/60 bg-muted/30 divide-y divide-border/60">
              {ANATOMY.map((row) => (
                <div key={row.label} className="flex items-center gap-3 px-3 py-2">
                  <span className="text-[10px] font-mono uppercase tracking-wide text-muted-foreground w-12 shrink-0">
                    {row.label}
                  </span>
                  <span className="text-xs text-foreground/85 leading-snug">{row.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {SPEC.map((s) => (
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

          <div className="flex items-start gap-2 p-3 rounded-lg bg-primary/5 border border-primary/20">
            <ShieldAlert className="h-4 w-4 text-primary mt-0.5 shrink-0" />
            <p className="text-xs text-muted-foreground leading-relaxed">
              <strong className="text-foreground">Centrally managed.</strong>{' '}
              Banners and disclaimers are pushed via IT — do not edit HTML
              source locally. Request a change through Brand Operations.
            </p>
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
