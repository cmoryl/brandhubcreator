/**
 * TransPerfectAntiPatternsPanel — Canonical anti-patterns and misuse rules
 * from the TransPerfect Brand Guidelines 2026 v3.0.
 *
 * Surfaces the most common violations across logo, colour, type, motion
 * and imagery so admins reviewing the Anti-Patterns registry have the
 * authoritative reference at the top of the section.
 */

import { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  AlertOctagon,
  XCircle,
  ShieldAlert,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const CATEGORIES: { title: string; rules: string[] }[] = [
  {
    title: 'Logo & Symbol',
    rules: [
      'Do not recolour, outline or add effects to the wordmark',
      'Do not stack sub-brand lockups — always horizontal with the hairline divider',
      'Do not use the symbol as a standalone mark in external communications',
      'Do not place the wordmark below 96px digital / 24mm print',
    ],
  },
  {
    title: 'Colour',
    rules: [
      'Do not use Digital Blue #003FC7 below 4.5:1 contrast on text',
      'Do not introduce accent hues outside the canonical palette',
      'Do not apply gradients to the wordmark or UI text',
    ],
  },
  {
    title: 'Typography',
    rules: [
      'Do not substitute Geist with system Arial or Helvetica',
      'Do not justify body copy — always left-aligned, ragged right',
      'Do not set body copy below 14px or above 19px',
    ],
  },
  {
    title: 'Motion',
    rules: [
      'Do not exceed 560ms for any single transition',
      'Do not use bounce, elastic or overshoot easings',
      'Do not animate brand-critical elements (wordmark, symbol) on loop',
    ],
  },
  {
    title: 'Imagery',
    rules: [
      'Do not place text on busy areas of photography without a Soft Transition backdrop',
      'Do not crop human subjects at the joints (wrists, ankles, neck)',
      'Do not use stock with visible watermarks, vignettes or heavy filters',
    ],
  },
];

export const TransPerfectAntiPatternsPanel = () => {
  const [open, setOpen] = useState(true);

  return (
    <div className="border border-border rounded-xl overflow-hidden bg-card">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors text-left"
      >
        <div className="flex items-center gap-2">
          <AlertOctagon className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">
            TransPerfect Anti-Patterns & Misuse
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
          <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/5 border border-destructive/20">
            <ShieldAlert className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
            <p className="text-xs text-muted-foreground leading-relaxed">
              <strong className="text-foreground">Zero tolerance.</strong>{' '}
              Anti-patterns are the difference between a brand and a
              suggestion. Anything below ships only after written approval
              from Brand Operations.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {CATEGORIES.map((c) => (
              <div key={c.title} className="space-y-2">
                <div className="flex items-center gap-1.5">
                  <XCircle className="h-4 w-4 text-red-600" />
                  <h5 className="text-sm font-semibold text-red-700 dark:text-red-400">
                    {c.title}
                  </h5>
                </div>
                <ul className="space-y-1.5">
                  {c.rules.map((r, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-foreground/80">
                      <span className="mt-0.5 h-1.5 w-1.5 rounded-full shrink-0 bg-red-500" />
                      {r}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
