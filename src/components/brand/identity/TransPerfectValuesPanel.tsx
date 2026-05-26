/**
 * TransPerfectValuesPanel — Brand pillars and values from the
 * TransPerfect Brand Guidelines 2026 v3.0.
 *
 * Surfaces the canonical four pillars (Precision, Reach, Speed, Trust)
 * alongside the brand promise so every value referenced on the page
 * ladders back to the same source of truth.
 */

import { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Target,
  Globe2,
  Zap,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const PILLARS = [
  {
    icon: Target,
    title: 'Precision',
    desc: 'Linguistic, cultural and technical accuracy verified by humans, accelerated by AI.',
  },
  {
    icon: Globe2,
    title: 'Reach',
    desc: '170+ languages across 140 cities — one operating model, one quality bar.',
  },
  {
    icon: Zap,
    title: 'Speed',
    desc: 'Always-on automation tuned for enterprise SLA — minutes, not weeks.',
  },
  {
    icon: ShieldCheck,
    title: 'Trust',
    desc: 'Certified workflows, enterprise security, and accountability at every step.',
  },
];

export const TransPerfectValuesPanel = () => {
  const [open, setOpen] = useState(true);

  return (
    <div className="border border-border rounded-xl overflow-hidden bg-card">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors text-left"
      >
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">
            TransPerfect Brand Pillars
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
        <div className="px-4 pb-4 space-y-4 border-t border-border pt-4">
          <p className="text-xs text-muted-foreground leading-relaxed">
            Every value, message and product narrative ladders back to the
            same four pillars. Use them as a litmus test: if a story does
            not advance one of these, it does not belong on a TransPerfect
            surface.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {PILLARS.map((p) => (
              <div
                key={p.title}
                className="p-3 rounded-lg bg-muted/40 border border-border/60 flex gap-3"
              >
                <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                  <p.icon className="h-4 w-4 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-foreground">{p.title}</p>
                  <p className="text-[11px] text-muted-foreground leading-snug mt-0.5">
                    {p.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-start gap-2 p-3 rounded-lg bg-primary/5 border border-primary/20">
            <Sparkles className="h-4 w-4 text-primary mt-0.5 shrink-0" />
            <p className="text-xs text-muted-foreground leading-relaxed">
              <strong className="text-foreground">Brand promise:</strong>{' '}
              <em>Any content. Any language. Any market. Done right.</em> The
              pillars are the proof points; the promise is the headline.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
