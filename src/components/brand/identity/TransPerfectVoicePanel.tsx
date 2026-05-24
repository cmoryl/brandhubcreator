/**
 * TransPerfectVoicePanel — Voice, tone & messaging principles
 * from the TransPerfect Brand Guidelines 2026 v3.0.
 *
 * Surfaces the voice attributes, tone modulation across contexts,
 * and writing do/don't rules so copywriters stay on-brand.
 */

import { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  MessageSquareQuote,
  CheckCircle2,
  XCircle,
  Mic,
  Sparkles,
  Compass,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const ATTRIBUTES = [
  { icon: <Compass className="h-3.5 w-3.5 text-primary" />, label: 'Confident', desc: 'Direct statements, no hedging. We know the work.' },
  { icon: <Sparkles className="h-3.5 w-3.5 text-primary" />, label: 'Intelligent', desc: 'Precise nouns, specific verbs. Earned expertise, never jargon for show.' },
  { icon: <Mic className="h-3.5 w-3.5 text-primary" />, label: 'Human', desc: 'Plain English first. Warmth without slang or emoji.' },
];

const TONE_MATRIX = [
  { context: 'Marketing & Brand',  tone: 'Bold, visionary, short sentences. Lead with outcome.' },
  { context: 'Product UI',          tone: 'Helpful, concise, second-person. One idea per screen.' },
  { context: 'Sales & RFP',         tone: 'Authoritative, evidence-backed, specifics over adjectives.' },
  { context: 'Support & Errors',    tone: 'Calm, accountable, action-oriented. Tell the user what to do next.' },
];

const DO_RULES = [
  'Lead with the outcome, then explain the mechanism',
  'Use the active voice — "We translate" not "translations are delivered"',
  'Capitalise product names in title case: GlobalLink, DataForce',
  'Numerals for stats and quantities (170+ languages, not one hundred seventy)',
  'Oxford comma, sentence case for UI labels and buttons',
];

const DONT_RULES = [
  'Use "leverage," "synergy," "best-in-class" or other consultant filler',
  'Capitalise random words for emphasis — use weight or italics instead',
  'Write product names in ALL CAPS or with internal punctuation (Global-Link)',
  'Stack three or more adjectives in a row',
  'End buttons or CTAs with a period',
];

export const TransPerfectVoicePanel = () => {
  const [open, setOpen] = useState(true);

  return (
    <div className="border border-border rounded-xl overflow-hidden bg-card">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors text-left"
      >
        <div className="flex items-center gap-2">
          <MessageSquareQuote className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">
            TransPerfect Voice, Tone & Messaging
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
            TransPerfect sounds like the smartest person in the room who has
            no need to prove it. Three constants: <strong className="text-foreground">Confident</strong>,{' '}
            <strong className="text-foreground">Intelligent</strong>, <strong className="text-foreground">Human</strong>.
            Tone modulates by context — voice never does.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {ATTRIBUTES.map((a) => (
              <div key={a.label} className="p-2.5 rounded-lg bg-muted/40 border border-border/60">
                <div className="flex items-center gap-1.5 mb-1">
                  {a.icon}
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                    {a.label}
                  </span>
                </div>
                <p className="text-xs text-foreground/85 leading-snug">{a.desc}</p>
              </div>
            ))}
          </div>

          <div>
            <h5 className="text-[10px] uppercase tracking-wide font-semibold text-muted-foreground mb-2">
              Tone by Context
            </h5>
            <div className="rounded-lg border border-border/60 overflow-hidden">
              {TONE_MATRIX.map((row, i) => (
                <div
                  key={row.context}
                  className={`grid grid-cols-[140px_1fr] gap-3 px-3 py-2 text-xs ${
                    i % 2 === 0 ? 'bg-muted/30' : 'bg-muted/10'
                  }`}
                >
                  <span className="font-semibold text-foreground/90">{row.context}</span>
                  <span className="text-muted-foreground leading-snug">{row.tone}</span>
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
