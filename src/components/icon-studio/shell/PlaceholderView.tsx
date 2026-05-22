/**
 * PlaceholderView — premium "coming next" surface for shell sections that
 * arrive in later phases (Library, Brands, Style Systems, Icon Sets,
 * QA / Preflight, Export Center, Settings). Visible empty state, not a TODO.
 */

import { ArrowRight, type LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface Props {
  icon: LucideIcon;
  title: string;
  description: string;
  phaseLabel?: string;
  features: string[];
  primaryAction?: { label: string; onClick: () => void };
}

export const PlaceholderView = ({
  icon: Icon,
  title,
  description,
  phaseLabel = 'Phase 2',
  features,
  primaryAction,
}: Props) => (
  <div className="space-y-6">
    <header className="tp-card relative overflow-hidden p-7">
      <div
        className="absolute inset-0 opacity-40"
        style={{
          background:
            'radial-gradient(50% 80% at 100% 0%, hsl(var(--tp-light-blue) / 0.18), transparent 70%)',
        }}
        aria-hidden
      />
      <div className="relative flex flex-wrap items-start justify-between gap-6">
        <div className="space-y-3 max-w-2xl">
          <Badge
            variant="outline"
            className="gap-1 border-dashed text-[10px] uppercase tracking-wider"
            style={{ borderColor: 'hsl(var(--tp-light-blue) / 0.5)', color: 'hsl(var(--tp-light-blue))' }}
          >
            {phaseLabel} — in production
          </Badge>
          <div className="flex items-center gap-3">
            <div
              className="flex h-12 w-12 items-center justify-center rounded-xl"
              style={{
                background: 'hsl(var(--tp-light-blue) / 0.12)',
                color: 'hsl(var(--tp-light-blue))',
              }}
            >
              <Icon className="h-6 w-6" />
            </div>
            <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
          </div>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        {primaryAction && (
          <Button onClick={primaryAction.onClick} className="gap-1.5">
            {primaryAction.label}
            <ArrowRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </header>

    <section className="grid gap-3 md:grid-cols-2">
      {features.map((f) => (
        <div key={f} className="tp-card p-4">
          <div className="flex items-start gap-3">
            <div
              className="mt-0.5 h-2 w-2 rounded-full"
              style={{ background: 'hsl(var(--tp-teal))' }}
              aria-hidden
            />
            <span className="text-sm">{f}</span>
          </div>
        </div>
      ))}
    </section>
  </div>
);
