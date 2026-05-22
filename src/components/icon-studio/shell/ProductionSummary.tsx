/**
 * ProductionSummary — persistent right rail showing live counts, QA scores,
 * and export readiness. Designed to feel like an enterprise build status panel.
 */

import {
  Activity,
  CheckCircle2,
  CircleDot,
  Eye,
  Package,
  Shield,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { StatusChip } from './StatusChip';

export interface SummaryMetrics {
  totalIcons: number;
  sections: number;
  approved: number;
  needsReview: number;
  failed: number;
  generating: number;
  /** 0–100 */
  brandCompliance: number;
  a11y: number;
  svgHealth: number;
  exportReadiness: number;
}

interface Props {
  metrics: SummaryMetrics;
  brandName?: string;
  industryName?: string;
  onExport?: () => void;
  onSave?: () => void;
}

const Row = ({
  label,
  value,
  icon: Icon,
  accentToken,
}: {
  label: string;
  value: string | number;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  accentToken: string;
}) => (
  <div className="flex items-center justify-between py-2">
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <Icon className="h-3.5 w-3.5" style={{ color: `hsl(${accentToken})` }} />
      <span>{label}</span>
    </div>
    <span className="text-sm font-medium tabular-nums">{value}</span>
  </div>
);

const ScoreBar = ({
  label,
  value,
  accentToken,
}: {
  label: string;
  value: number;
  accentToken: string;
}) => (
  <div className="space-y-1.5">
    <div className="flex items-center justify-between text-[11px]">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium tabular-nums" style={{ color: `hsl(${accentToken})` }}>
        {Math.round(value)}%
      </span>
    </div>
    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'hsl(var(--muted))' }}>
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${Math.min(100, Math.max(0, value))}%`, background: `hsl(${accentToken})` }}
      />
    </div>
  </div>
);

export const ProductionSummary = ({
  metrics,
  brandName,
  industryName,
  onExport,
  onSave,
}: Props) => {
  return (
    <aside
      className="tp-card sticky top-4 flex flex-col gap-5 p-5"
      aria-label="Production summary"
    >
      <header className="space-y-1">
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-muted-foreground">
          <Activity className="h-3 w-3" />
          <span>Production summary</span>
        </div>
        <h3 className="text-base font-semibold leading-tight">
          {brandName || 'No brand selected'}
        </h3>
        {industryName && (
          <p className="text-xs text-muted-foreground">{industryName}</p>
        )}
      </header>

      <div className="tp-divider" />

      <section>
        <h4 className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
          Counts
        </h4>
        <Row label="Total icons" value={metrics.totalIcons} icon={Sparkles} accentToken="var(--tp-light-blue)" />
        <Row label="Sections" value={metrics.sections} icon={Package} accentToken="var(--tp-teal)" />
        <Row label="Approved" value={metrics.approved} icon={CheckCircle2} accentToken="var(--tp-green)" />
        <Row label="Needs review" value={metrics.needsReview} icon={Eye} accentToken="var(--tp-orange)" />
        <Row label="Failed" value={metrics.failed} icon={CircleDot} accentToken="var(--tp-status-failed)" />
      </section>

      {metrics.generating > 0 && (
        <div className="rounded-lg border p-3" style={{ borderColor: 'hsl(var(--tp-light-blue) / 0.4)', background: 'hsl(var(--tp-light-blue) / 0.06)' }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground">Active jobs</span>
            <StatusChip status="generating" label={`${metrics.generating} running`} compact />
          </div>
          <Progress value={Math.min(95, metrics.generating * 12 + 25)} className="h-1.5" />
        </div>
      )}

      <div className="tp-divider" />

      <section className="space-y-3">
        <h4 className="text-[10px] uppercase tracking-wider text-muted-foreground">
          Quality scores
        </h4>
        <ScoreBar label="Brand compliance" value={metrics.brandCompliance} accentToken="var(--tp-purple)" />
        <ScoreBar label="Accessibility" value={metrics.a11y} accentToken="var(--tp-teal)" />
        <ScoreBar label="SVG health" value={metrics.svgHealth} accentToken="var(--tp-light-blue)" />
        <ScoreBar label="Export readiness" value={metrics.exportReadiness} accentToken="var(--tp-green)" />
      </section>

      <div className="tp-divider" />

      <div className="space-y-2">
        <Button
          size="sm"
          className="w-full justify-center gap-2"
          onClick={onExport}
          disabled={!onExport || metrics.totalIcons === 0}
        >
          <Package className="h-3.5 w-3.5" />
          Export package
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="w-full justify-center gap-2"
          onClick={onSave}
          disabled={!onSave || metrics.totalIcons === 0}
        >
          <Shield className="h-3.5 w-3.5" />
          Save to library
        </Button>
      </div>
    </aside>
  );
};
