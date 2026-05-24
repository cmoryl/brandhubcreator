/**
 * TransPerfectPhotographyPanel — Brand-specific photography & imagery rules
 * sourced from the TransPerfect Brand Guidelines 2026 v3.0.
 *
 * Surfaces the two canonical treatments:
 *  1. Hyper-Realistic Human-Focused Photography
 *  2. Soft Transition (luminous orb / gradient) treatment
 */

import { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Camera,
  Sparkles,
  CheckCircle2,
  XCircle,
  Sun,
  Users,
  Aperture,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const HUMAN_DO = [
  'Real people in authentic, candid moments — not staged stock setups',
  'Soft, natural directional light (window light, golden hour)',
  'Shallow depth of field that keeps the subject the hero',
  'Diverse global representation across age, ethnicity, ability and role',
  'In-context environments: studios, labs, offices, on-location workspaces',
  'Eye contact and quiet confidence — collaboration over performance',
];

const HUMAN_DONT = [
  'Heavily posed or over-retouched stock photography',
  'Harsh on-camera flash or unnatural skin tones',
  'Generic agency “diversity” compositions with a single token subject',
  'AI-generated faces without disclosure or human review',
  'Logos, on-screen UI or text composited into the photograph',
  'Cool desaturated “tech” colour grades — TransPerfect imagery is warm and human',
];

const SOFT_TRANSITION_DO = [
  'Use the canonical Digital Blue → Lavender / Turquoise orb gradient',
  'Treat orbs as luminous, three-dimensional light sources — soft falloff, no hard edges',
  'Leave generous negative space around the orb for headlines and lockups',
  'Pair with Digital Blue #003FC7 or Dark Blue #03002C backgrounds',
  'Use as transitions, hero backdrops and section dividers — moments of calm',
];

const SOFT_TRANSITION_DONT = [
  'Flat circles, hard-edged gradients or low-resolution renders',
  'Off-palette colours (greens, reds, neons) inside the orb',
  'Multiple competing orbs in a single composition',
  'Heavy text or logos placed on top of the brightest area of the orb',
  'Stretching, squashing or rotating the canonical orb shapes',
];

const SECTION_BORDER = 'border-t border-border pt-3';

export const TransPerfectPhotographyPanel = ({ canEdit }: { canEdit?: boolean }) => {
  const [open, setOpen] = useState(true);

  return (
    <div className="border border-border rounded-xl overflow-hidden bg-card">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors text-left"
      >
        <div className="flex items-center gap-2">
          <Camera className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">
            TransPerfect Photography & Imagery
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
            TransPerfect imagery is built on two complementary treatments:{' '}
            <strong className="text-foreground">hyper-realistic human photography</strong>{' '}
            that grounds the brand in real people and real work, and the{' '}
            <strong className="text-foreground">Soft Transition</strong> treatment — a
            luminous orb / gradient system that carries the brand’s expressive,
            optimistic energy.
          </p>

          {/* Treatment 1 — Human Realistic */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              <h4 className="text-sm font-semibold text-foreground">
                1. Hyper-Realistic Human-Focused Photography
              </h4>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Warm, cinematic, documentary-feel imagery. The subject — and what they
              are doing — leads every frame. Available in Creative Studio as the{' '}
              <code className="text-[10px] px-1 py-0.5 rounded bg-muted">humanRealistic</code>{' '}
              style preset.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <RuleList icon={<CheckCircle2 className="h-4 w-4 text-green-600" />} title="Do" tone="green" items={HUMAN_DO} />
              <RuleList icon={<XCircle className="h-4 w-4 text-red-600" />} title="Don’t" tone="red" items={HUMAN_DONT} />
            </div>
          </div>

          {/* Treatment 2 — Soft Transition */}
          <div className={`space-y-3 ${SECTION_BORDER}`}>
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <h4 className="text-sm font-semibold text-foreground">
                2. Soft Transition — Luminous Orb Treatment
              </h4>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              The canonical orb assets live in{' '}
              <code className="text-[10px] px-1 py-0.5 rounded bg-muted">public/orbs/tp-*.png</code>{' '}
              and define the look. Available in Creative Studio as the{' '}
              <code className="text-[10px] px-1 py-0.5 rounded bg-muted">softTransition</code>{' '}
              style preset.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <RuleList icon={<CheckCircle2 className="h-4 w-4 text-green-600" />} title="Do" tone="green" items={SOFT_TRANSITION_DO} />
              <RuleList icon={<XCircle className="h-4 w-4 text-red-600" />} title="Don’t" tone="red" items={SOFT_TRANSITION_DONT} />
            </div>
          </div>

          {/* Technical specs */}
          <div className={`grid grid-cols-1 sm:grid-cols-3 gap-3 ${SECTION_BORDER}`}>
            <SpecCard icon={<Aperture className="h-3.5 w-3.5 text-primary" />} label="Aspect ratios" value="16:9 hero · 4:5 social · 1:1 thumb" />
            <SpecCard icon={<Sun className="h-3.5 w-3.5 text-primary" />} label="Colour grade" value="Warm whites, true skin tones, Digital Blue accent" />
            <SpecCard icon={<Sparkles className="h-3.5 w-3.5 text-primary" />} label="Orb palette" value="#003FC7 · #03002C · Lavender · Turquoise" />
          </div>

          <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/60 border border-border">
            <Camera className="h-4 w-4 text-primary mt-0.5 shrink-0" />
            <p className="text-xs text-muted-foreground leading-relaxed">
              <strong className="text-foreground">Composition rule:</strong> never
              combine a person and a Soft Transition orb in the same frame — orbs are
              graphic transitions, photography is documentary. They live side by side
              in a layout, never stacked on top of each other.
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

function SpecCard({
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
