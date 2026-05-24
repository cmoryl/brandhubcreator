/**
 * TransPerfectMotionPanel — Motion & Brand Visuals guidance from the
 * TransPerfect Brand Guidelines 2026 v3.0.
 *
 * Surfaces canonical motion principles, easing, duration, and expression-state
 * rules so editors keep transitions on-brand across product, marketing, and
 * event surfaces.
 */

import { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Activity,
  CheckCircle2,
  XCircle,
  Timer,
  Waves,
  Sparkles,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const PRINCIPLES = [
  {
    name: 'Confident',
    desc: 'Movement is purposeful and direct — no hesitation, no bounce.',
  },
  {
    name: 'Fluid',
    desc: 'Eases mirror the Soft Transition gradient: smooth, organic, never linear.',
  },
  {
    name: 'Intelligent',
    desc: 'Motion reveals hierarchy and guides attention to the next action.',
  },
];

const DURATIONS = [
  { token: 'micro',   ms: '120ms', usage: 'Hover, focus, tap feedback' },
  { token: 'short',   ms: '200ms', usage: 'Toggles, accordions, tooltips' },
  { token: 'base',    ms: '320ms', usage: 'Modals, drawers, route changes' },
  { token: 'expressive', ms: '560ms', usage: 'Hero reveals, orb morphs, brand moments' },
];

const EASINGS = [
  { token: 'standard',   curve: 'cubic-bezier(0.2, 0, 0, 1)',     usage: 'Default UI motion' },
  { token: 'entrance',   curve: 'cubic-bezier(0, 0, 0, 1)',       usage: 'Elements entering the frame' },
  { token: 'exit',       curve: 'cubic-bezier(0.3, 0, 1, 1)',     usage: 'Elements leaving the frame' },
  { token: 'expressive', curve: 'cubic-bezier(0.65, 0, 0.05, 1)', usage: 'Brand moments, orb transitions' },
];

const STATES = [
  { name: 'Rest',     desc: 'Static baseline. No motion, no glow.' },
  { name: 'Hover',    desc: 'Lift 2px, scale 1.01, micro ease.' },
  { name: 'Active',   desc: 'Compress 1%, 120ms standard ease.' },
  { name: 'Focus',    desc: '2px Digital Blue ring, no movement.' },
  { name: 'Loading',  desc: 'Soft Transition orb pulse at 1.6s loop.' },
  { name: 'Success',  desc: 'Turquoise sweep in expressive ease, 560ms.' },
];

const DO_RULES = [
  'Use the standard ease for 95% of UI motion',
  'Reserve expressive ease for brand moments (hero, orb morphs)',
  'Animate transform + opacity only — never width, height, top, left',
  'Respect prefers-reduced-motion: collapse to 0ms opacity-only fades',
];

const DONT_RULES = [
  'Use linear easing — TransPerfect motion is always eased',
  'Bounce, overshoot or spring past the target',
  'Animate brand colour shifts — colour is identity, not motion',
  'Stack more than 3 concurrent motion layers in a single frame',
];

export const TransPerfectMotionPanel = () => {
  const [open, setOpen] = useState(true);

  return (
    <div className="border border-border rounded-xl overflow-hidden bg-card">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors text-left"
      >
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">
            TransPerfect Motion & Brand Visuals
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
            Motion is the connective tissue of the TransPerfect identity —
            confident, fluid and intelligent. Every transition should feel like
            the same hand drew the orbs, the wordmark and the interface.
          </p>

          {/* Principles */}
          <div>
            <SubHeading icon={<Sparkles className="h-3 w-3" />}>Principles</SubHeading>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-2">
              {PRINCIPLES.map((p) => (
                <div
                  key={p.name}
                  className="p-3 rounded-lg bg-muted/40 border border-border/60"
                >
                  <p className="text-xs font-semibold text-foreground">{p.name}</p>
                  <p className="text-[11px] text-muted-foreground leading-snug mt-1">
                    {p.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Durations */}
          <div>
            <SubHeading icon={<Timer className="h-3 w-3" />}>Duration tokens</SubHeading>
            <div className="mt-2 rounded-lg border border-border/60 overflow-hidden">
              {DURATIONS.map((d, i) => (
                <div
                  key={d.token}
                  className={`grid grid-cols-12 gap-2 px-3 py-2 text-xs ${
                    i % 2 === 0 ? 'bg-muted/30' : 'bg-muted/10'
                  }`}
                >
                  <span className="col-span-3 font-mono text-foreground/85">
                    motion.{d.token}
                  </span>
                  <span className="col-span-2 font-mono text-primary">{d.ms}</span>
                  <span className="col-span-7 text-muted-foreground">{d.usage}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Easings */}
          <div>
            <SubHeading icon={<Waves className="h-3 w-3" />}>Easing curves</SubHeading>
            <div className="mt-2 rounded-lg border border-border/60 overflow-hidden">
              {EASINGS.map((e, i) => (
                <div
                  key={e.token}
                  className={`grid grid-cols-12 gap-2 px-3 py-2 text-xs ${
                    i % 2 === 0 ? 'bg-muted/30' : 'bg-muted/10'
                  }`}
                >
                  <span className="col-span-3 font-mono text-foreground/85">
                    ease.{e.token}
                  </span>
                  <span className="col-span-5 font-mono text-[10px] text-primary truncate">
                    {e.curve}
                  </span>
                  <span className="col-span-4 text-muted-foreground">{e.usage}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Expression states */}
          <div>
            <SubHeading icon={<Activity className="h-3 w-3" />}>Expression states</SubHeading>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
              {STATES.map((s) => (
                <div
                  key={s.name}
                  className="p-2.5 rounded-lg bg-muted/40 border border-border/60"
                >
                  <p className="text-[11px] font-semibold text-foreground">{s.name}</p>
                  <p className="text-[10px] text-muted-foreground leading-snug mt-0.5">
                    {s.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Do / Don't */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-border pt-4">
            <RuleList tone="green" title="Do" items={DO_RULES} />
            <RuleList tone="red"   title="Don’t" items={DONT_RULES} />
          </div>
        </div>
      )}
    </div>
  );
};

function SubHeading({
  icon,
  children,
}: {
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-1.5">
      {icon && <span className="text-muted-foreground">{icon}</span>}
      <h5 className="text-[10px] uppercase tracking-wide font-semibold text-muted-foreground">
        {children}
      </h5>
    </div>
  );
}

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
