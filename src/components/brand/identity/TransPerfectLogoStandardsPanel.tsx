/**
 * TransPerfectLogoStandardsPanel — Brand-specific logo & symbol standards
 * sourced from the TransPerfect Brand Guidelines 2026 v3.0.
 *
 * Surfaces the canonical wordmark rules, clear-space, minimum sizes,
 * sub-brand lockup patterns, and anti-pattern guidance so admins editing
 * TransPerfect logos always have the rulebook visible alongside the assets.
 */

import { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Shapes,
  CheckCircle2,
  XCircle,
  Ruler,
  Square,
  Layers,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const DO_RULES = [
  'Use the master TransPerfect wordmark in Digital Blue #003FC7 on light backgrounds',
  'Use the reversed (white) wordmark on Digital Blue, Dark Blue or photographic backgrounds',
  'Maintain clear space equal to the height of the "T" cap on every side',
  'Lock sub-brand names with a 1px Digital Blue divider, equal cap-height spacing',
  'Pair the symbol only when the wordmark is also present elsewhere on the surface',
];

const DONT_RULES = [
  'Recolour the wordmark outside the canonical palette (no gradients, no shadows)',
  'Stretch, skew, rotate or outline the wordmark',
  'Reconstruct or retype the wordmark in Geist or any other font',
  'Place the wordmark on busy areas of photography without a Soft Transition backdrop',
  'Stack sub-brand lockups vertically — always horizontal divider lockups',
  'Use the symbol alone as a standalone brand mark in external communications',
];

const SECTION_BORDER = 'border-t border-border pt-3';

export const TransPerfectLogoStandardsPanel = ({ canEdit }: { canEdit?: boolean }) => {
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
            TransPerfect Logo & Symbol Standards
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
        <div className="px-4 pb-4 space-y-5 border-t border-border pt-3">
          <p className="text-xs text-muted-foreground leading-relaxed">
            The TransPerfect wordmark is the primary identifier across every
            surface. The symbol is a supporting mark — never a replacement.
            All variants below are derived from the same master artwork and
            must be used without modification.
          </p>

          {/* Specs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Spec
              icon={<Ruler className="h-3.5 w-3.5 text-primary" />}
              label="Clear space"
              value='Equal to the height of the "T" cap on all sides'
            />
            <Spec
              icon={<Square className="h-3.5 w-3.5 text-primary" />}
              label="Minimum size"
              value="Digital 96px wide · Print 24mm wide"
            />
            <Spec
              icon={<Layers className="h-3.5 w-3.5 text-primary" />}
              label="Sub-brand lockup"
              value="Wordmark · 1px Digital Blue divider · sub-brand in Geist Medium"
            />
          </div>

          {/* Do / Don't */}
          <div className={`grid grid-cols-1 sm:grid-cols-2 gap-4 ${SECTION_BORDER}`}>
            <RuleList
              icon={<CheckCircle2 className="h-4 w-4 text-green-600" />}
              title="Do"
              tone="green"
              items={DO_RULES}
            />
            <RuleList
              icon={<XCircle className="h-4 w-4 text-red-600" />}
              title="Don’t"
              tone="red"
              items={DONT_RULES}
            />
          </div>

          <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/60 border border-border">
            <Shapes className="h-4 w-4 text-primary mt-0.5 shrink-0" />
            <p className="text-xs text-muted-foreground leading-relaxed">
              <strong className="text-foreground">Lockup rule:</strong> sub-brand
              lockups always read left-to-right —{' '}
              <code className="text-[10px] px-1 py-0.5 rounded bg-muted">
                [TransPerfect wordmark] │ [Sub-brand name]
              </code>{' '}
              — separated by a hairline Digital Blue divider one cap-height tall.
              Never stack or place the sub-brand above or below the wordmark.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

function RuleList({
  icon,
  title,
  tone,
  items,
}: {
  icon: React.ReactNode;
  title: string;
  tone: 'green' | 'red';
  items: string[];
}) {
  const dot = tone === 'green' ? 'bg-green-500' : 'bg-red-500';
  const heading =
    tone === 'green'
      ? 'text-green-700 dark:text-green-400'
      : 'text-red-700 dark:text-red-400';
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5">
        {icon}
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

function Spec({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="p-2.5 rounded-lg bg-muted/40 border border-border/60">
      <div className="flex items-center gap-1.5 mb-1">
        {icon}
        <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          {label}
        </span>
      </div>
      <p className="text-xs text-foreground/85 leading-snug">{value}</p>
    </div>
  );
}
