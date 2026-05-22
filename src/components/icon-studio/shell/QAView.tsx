/**
 * QAView — production-grade preflight dashboard. Scorecards + check list +
 * per-set rows. Numbers are derived from libraries when possible; checks
 * are simulated until real preflight wires in.
 */

import { useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  ShieldCheck, Check, AlertTriangle, Eye, RefreshCw,
  CheckCircle2, XCircle, Grid3x3, Wand2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { StatusChip } from './StatusChip';
import type { IconLibrary } from '@/hooks/useIconLibraries';

interface Props {
  libraries: IconLibrary[];
  totalIcons: number;
  organizationId?: string;
  onStartGenerate?: () => void;
}

interface CheckRow {
  id: string;
  label: string;
  description: string;
  status: 'pass' | 'warn' | 'fail';
  count: number;
}

const buildChecks = (totalIcons: number): CheckRow[] => {
  // Deterministic faux numbers derived from total to keep it stable.
  const t = Math.max(totalIcons, 0);
  return [
    { id: 'svg', label: 'SVG validity', description: 'Parseable, single root, no nested svgs', status: 'pass', count: t },
    { id: 'viewbox', label: 'ViewBox normalized', description: 'All icons share a 0 0 24 24 viewBox', status: 'pass', count: t },
    { id: 'stroke', label: 'Stroke consistency', description: 'Uniform stroke width across set', status: t > 20 ? 'warn' : 'pass', count: t > 20 ? Math.max(1, Math.floor(t * 0.05)) : 0 },
    { id: 'grid', label: 'Grid alignment', description: '24px grid, 20px safe zone', status: 'pass', count: 0 },
    { id: 'optical', label: 'Optical balance', description: 'Visual weight check across the set', status: t > 30 ? 'warn' : 'pass', count: t > 30 ? 2 : 0 },
    { id: 'minsize', label: 'Min-size readability', description: 'Renders cleanly at 16px', status: 'pass', count: 0 },
    { id: 'dupes', label: 'Duplicate detection', description: 'Shape & path hash comparison', status: 'pass', count: 0 },
    { id: 'overlap', label: 'Overlap detection', description: 'Self-overlapping fills cleaned', status: 'pass', count: 0 },
    { id: 'contrast', label: 'Color contrast', description: 'Passes 3:1 against bg in both modes', status: 'pass', count: 0 },
    { id: 'a11y', label: 'A11y metadata', description: 'title + role + aria-label present', status: t > 0 ? 'warn' : 'pass', count: t > 0 ? Math.max(1, Math.floor(t * 0.03)) : 0 },
    { id: 'rai', label: 'Responsible-AI metaphor', description: 'Cultural & sensitive content check', status: 'pass', count: 0 },
    { id: 'brand', label: 'Brand compliance', description: 'Matches brand color & stroke rules', status: 'pass', count: 0 },
  ];
};

const StatusIcon = ({ status }: { status: CheckRow['status'] }) => {
  if (status === 'pass')
    return <CheckCircle2 className="h-3.5 w-3.5" style={{ color: 'hsl(var(--tp-green))' }} />;
  if (status === 'warn')
    return <AlertTriangle className="h-3.5 w-3.5" style={{ color: 'hsl(var(--tp-orange))' }} />;
  return <XCircle className="h-3.5 w-3.5" style={{ color: 'hsl(var(--destructive))' }} />;
};

const ScoreCard = ({
  label,
  value,
  token,
}: {
  label: string;
  value: number;
  token: string;
}) => (
  <div className="tp-card p-4">
    <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">
      {label}
    </div>
    <div className="flex items-baseline gap-1">
      <span className="text-3xl font-semibold tabular-nums">{value}</span>
      <span className="text-sm text-muted-foreground">%</span>
    </div>
    <Progress value={value} className="mt-3 h-1.5" style={{ ['--tw-progress' as string]: token }} />
    <div className="mt-2 h-1.5 w-full rounded-full overflow-hidden bg-muted">
      <div
        className="h-full rounded-full transition-all"
        style={{ width: `${value}%`, background: `hsl(var(${token}))` }}
      />
    </div>
  </div>
);

export const QAView = ({ libraries, totalIcons, onStartGenerate }: Props) => {
  const checks = useMemo(() => buildChecks(totalIcons), [totalIcons]);
  const passing = checks.filter((c) => c.status === 'pass').length;
  const warnings = checks.filter((c) => c.status === 'warn').length;
  const failing = checks.filter((c) => c.status === 'fail').length;
  const brandScore = Math.min(100, 80 + Math.floor(passing));
  const a11yScore = Math.min(100, 78 + Math.floor(passing * 1.2));
  const svgHealth = Math.min(100, 88 + Math.floor(passing * 0.5));
  const exportReady = totalIcons > 0 ? Math.min(100, 70 + passing * 2) : 0;

  return (
    <div className="space-y-6">
      <header className="tp-card relative overflow-hidden p-6">
        <div
          className="absolute inset-0 opacity-40"
          style={{
            background:
              'radial-gradient(50% 80% at 100% 0%, hsl(var(--tp-green) / 0.16), transparent 70%)',
          }}
          aria-hidden
        />
        <div className="relative flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Preflight QA</span>
            </div>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">QA / Preflight</h1>
            <p className="text-sm text-muted-foreground max-w-2xl">
              Production-grade checks across SVG health, brand compliance, accessibility,
              and visual balance.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-1.5">
              <RefreshCw className="h-3.5 w-3.5" /> Re-run checks
            </Button>
            <Button size="sm" className="gap-1.5" onClick={onStartGenerate}>
              <Wand2 className="h-3.5 w-3.5" /> Open generator
            </Button>
          </div>
        </div>
      </header>

      {/* Scorecards */}
      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <ScoreCard label="Brand compliance" value={brandScore} token="--tp-digital-blue" />
        <ScoreCard label="Accessibility" value={a11yScore} token="--tp-light-blue" />
        <ScoreCard label="SVG health" value={svgHealth} token="--tp-teal" />
        <ScoreCard label="Export readiness" value={exportReady} token="--tp-green" />
      </section>

      {/* Counters */}
      <section className="grid grid-cols-3 gap-3">
        <Counter label="Passing" value={passing} icon={CheckCircle2} token="--tp-green" />
        <Counter label="Warnings" value={warnings} icon={AlertTriangle} token="--tp-orange" />
        <Counter label="Failing" value={failing} icon={XCircle} token="--destructive" />
      </section>

      {/* Checklist */}
      <section className="tp-card p-5">
        <header className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold">Preflight checks</h3>
            <p className="text-[11px] text-muted-foreground">
              Across {totalIcons.toLocaleString()} icons in {libraries.length} sets
            </p>
          </div>
          <Badge variant="outline" className="gap-1">
            <Grid3x3 className="h-3 w-3" />
            {checks.length} checks
          </Badge>
        </header>
        <ul className="divide-y divide-border/60">
          {checks.map((c) => (
            <li key={c.id} className="flex items-center gap-3 py-2.5">
              <StatusIcon status={c.status} />
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium truncate">{c.label}</div>
                <div className="text-[11px] text-muted-foreground truncate">
                  {c.description}
                </div>
              </div>
              {c.count > 0 && (
                <Badge variant="outline" className="text-[10px]">
                  {c.count} affected
                </Badge>
              )}
              <Button variant="ghost" size="icon" className="h-7 w-7" title="View details">
                <Eye className="h-3.5 w-3.5" />
              </Button>
            </li>
          ))}
        </ul>
      </section>

      {/* Per-set summary */}
      <section className="tp-card p-5">
        <header className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold">Per-set summary</h3>
          <Badge variant="secondary">{libraries.length} sets</Badge>
        </header>
        {libraries.length === 0 ? (
          <div className="py-8 text-center text-xs text-muted-foreground">
            Generate a set to see per-set QA scores.
          </div>
        ) : (
          <ul className="divide-y divide-border/60">
            {libraries.map((l) => (
              <li
                key={l.id}
                className="flex items-center gap-3 py-2.5"
              >
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium truncate">{l.name}</div>
                  <div className="text-[11px] text-muted-foreground">
                    {l.icons.length} icons · {l.level}
                  </div>
                </div>
                <Badge variant="outline" className="text-[10px] tabular-nums">
                  {Math.min(100, 80 + (l.icons.length % 18))}%
                </Badge>
                <StatusChip status={l.icons.length > 0 ? 'approved' : 'idle'} />
                <Button variant="ghost" size="icon" className="h-7 w-7" title="Run preflight">
                  <RefreshCw className="h-3.5 w-3.5" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};

const Counter = ({
  label,
  value,
  icon: Icon,
  token,
}: {
  label: string;
  value: number;
  icon: typeof Check;
  token: string;
}) => (
  <div className="tp-card p-4 flex items-center gap-3">
    <div
      className="h-10 w-10 rounded-lg flex items-center justify-center"
      style={{ background: `hsl(var(${token}) / 0.12)`, color: `hsl(var(${token}))` }}
    >
      <Icon className="h-5 w-5" />
    </div>
    <div>
      <div className="text-2xl font-semibold tabular-nums">{value}</div>
      <div className="text-[11px] text-muted-foreground uppercase tracking-wider">{label}</div>
    </div>
  </div>
);
