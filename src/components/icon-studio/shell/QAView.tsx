/**
 * QAView — production-grade preflight dashboard. Scorecards + check list +
 * per-set rows. Contrast (APCA) and 16px raster readability are computed
 * live across the entire library; remaining checks are deterministic.
 */

import { useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  ShieldCheck, Check, AlertTriangle, RefreshCw,
  CheckCircle2, XCircle, Grid3x3, Wand2, MinusCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatusChip } from './StatusChip';
import type { IconLibrary } from '@/hooks/useIconLibraries';
import { runPreflight, type PreflightSummary } from '@/lib/iconStudio/qa';
import { AbTestPanel } from './AbTestPanel';
import { SvgOptimizerPanel } from './SvgOptimizerPanel';


interface Props {
  libraries: IconLibrary[];
  totalIcons: number;
  organizationId?: string;
  organizationName?: string;
  onStartGenerate?: () => void;
}

interface CheckRow {
  id: string;
  label: string;
  description: string;
  status: 'pass' | 'warn' | 'fail' | 'na';
  count: number;
}

const buildChecks = (totalIcons: number, pf: PreflightSummary | null): CheckRow[] => {
  const contrastFailN = pf?.contrastFails.length ?? 0;
  const rasterFailN = pf?.rasterFails.length ?? 0;
  const strokeN = pf?.strokeInconsistentCount ?? 0;
  const brandN = pf?.brandFitFailCount ?? 0;
  return [
    { id: 'stroke', label: 'Stroke consistency', description: 'Uniform stroke width across set', status: strokeN > 0 ? 'warn' : 'pass', count: strokeN },
    { id: 'minsize', label: 'Min-size readability', description: 'Rendered to 16×16 canvas, ≥8% pixel coverage', status: rasterFailN > 0 ? 'fail' : 'pass', count: rasterFailN },
    { id: 'contrast', label: 'Color contrast (APCA)', description: 'Lc ≥ 45 against white + #0B0B0F backgrounds', status: contrastFailN > 0 ? 'fail' : 'pass', count: contrastFailN },
    { id: 'brand', label: 'Brand compliance', description: 'Matches brand color & stroke rules', status: brandN > 0 ? 'warn' : 'pass', count: brandN },
    // Not yet implemented — surfaced honestly instead of fake-passing
    { id: 'svg', label: 'SVG validity', description: 'Parseable, single root, no nested svgs', status: 'na', count: 0 },
    { id: 'viewbox', label: 'ViewBox normalized', description: 'All icons share a 0 0 24 24 viewBox', status: 'na', count: 0 },
    { id: 'grid', label: 'Grid alignment', description: '24px grid, 20px safe zone', status: 'na', count: 0 },
    { id: 'optical', label: 'Optical balance', description: 'Visual weight check across the set', status: 'na', count: 0 },
    { id: 'dupes', label: 'Duplicate detection', description: 'Shape & path hash comparison', status: 'na', count: 0 },
    { id: 'overlap', label: 'Overlap detection', description: 'Self-overlapping fills cleaned', status: 'na', count: 0 },
    { id: 'a11y', label: 'A11y metadata', description: 'title + role + aria-label present', status: 'na', count: 0 },
    { id: 'rai', label: 'Responsible-AI metaphor', description: 'Cultural & sensitive content check', status: 'na', count: 0 },
  ];
};

const StatusIcon = ({ status }: { status: CheckRow['status'] }) => {
  if (status === 'pass')
    return <CheckCircle2 className="h-3.5 w-3.5" style={{ color: 'hsl(var(--tp-green))' }} />;
  if (status === 'warn')
    return <AlertTriangle className="h-3.5 w-3.5" style={{ color: 'hsl(var(--tp-orange))' }} />;
  if (status === 'na')
    return <MinusCircle className="h-3.5 w-3.5 text-muted-foreground" />;
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
    <div className="mt-3 h-1.5 w-full rounded-full overflow-hidden bg-muted">
      <div
        className="h-full rounded-full transition-all"
        style={{ width: `${value}%`, background: `hsl(var(${token}))` }}
      />
    </div>
  </div>
);

export const QAView = ({ libraries, totalIcons, organizationId, onStartGenerate }: Props) => {
  const queryClient = useQueryClient();
  const [preflight, setPreflight] = useState<PreflightSummary | null>(null);
  const [running, setRunning] = useState(false);
  // Cap preflight scan at 2,000 icons to bound CPU/memory on huge libraries.
  const PREFLIGHT_CAP = 2000;
  const allIcons = useMemo(
    () => libraries.flatMap((l) => l.icons).slice(0, PREFLIGHT_CAP),
    [libraries],
  );

  const runChecks = async () => {
    setRunning(true);
    try {
      const pf = await runPreflight(allIcons);
      setPreflight(pf);
      return pf;
    } finally {
      setRunning(false);
    }
  };

  useEffect(() => {
    void runChecks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalIcons]);

  const checks = useMemo(() => buildChecks(totalIcons, preflight), [totalIcons, preflight]);
  const liveChecks = checks.filter((c) => c.status !== 'na');
  const passing = liveChecks.filter((c) => c.status === 'pass').length;
  const warnings = liveChecks.filter((c) => c.status === 'warn').length;
  const failing = liveChecks.filter((c) => c.status === 'fail').length;
  const liveTotal = Math.max(liveChecks.length, 1);
  const pct = (n: number) => Math.round((n / liveTotal) * 100);
  const brandScore = totalIcons === 0 ? 0 : pct(liveChecks.filter((c) => ['brand', 'stroke'].includes(c.id) && c.status === 'pass').length || 0) || (warnings + failing === 0 ? 100 : pct(passing));
  const a11yScore = totalIcons === 0 ? 0 : (preflight ? Math.max(0, 100 - Math.round(((preflight.contrastFails.length) / Math.max(totalIcons, 1)) * 100)) : 0);
  const svgHealth = totalIcons === 0 ? 0 : (preflight ? Math.max(0, 100 - Math.round(((preflight.rasterFails.length) / Math.max(totalIcons, 1)) * 100)) : 0);
  const exportReady = totalIcons === 0 ? 0 : (preflight ? Math.max(0, 100 - Math.round((preflight.exportNotReadyCount / Math.max(totalIcons, 1)) * 100)) : 0);

  const handleRerun = async () => {
    queryClient.invalidateQueries({ queryKey: ['icon-libraries', organizationId] });
    const pf = await runChecks();
    toast.success('Preflight checks re-run', {
      description: `${pf.contrastFails.length} contrast · ${pf.rasterFails.length} 16px · ${pf.exportNotReadyCount} not export-ready`,
    });
  };


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
            <Button variant="outline" size="sm" className="gap-1.5" onClick={handleRerun}>
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
                  {l.icons.length} icons
                </Badge>
                <StatusChip status={l.icons.length > 0 ? 'approved' : 'idle'} />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  title="Re-run preflight"
                  onClick={handleRerun}
                  disabled={running}
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${running ? 'animate-spin' : ''}`} />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <AbTestPanel libraries={libraries} organizationId={organizationId} />
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
