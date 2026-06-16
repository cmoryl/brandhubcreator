import { memo } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowUpRight,
  CheckCircle2,
  FileStack,
  AlertCircle,
  RefreshCw,
  Sparkles,
  LayoutGrid,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  getCanvaAuditsForBrand,
  summarizeCanvaAudits,
  type CanvaAuditEntry,
} from '@/data/canvaAudits';
import { SectionHeader } from './SectionHeader';

interface CanvaAuditsSectionProps {
  brandSlug?: string | null;
  brandName?: string;
  brandColors?: Array<{ hex: string; name?: string }>;
  customSubtitle?: string;
  onSubtitleChange?: (subtitle: string) => void;
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}

const StatusPill = ({ status }: { status: CanvaAuditEntry['status'] }) => {
  const map = {
    live: {
      label: 'Live',
      icon: CheckCircle2,
      cls: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    },
    in_progress: {
      label: 'In Progress',
      icon: RefreshCw,
      cls: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    },
    draft: {
      label: 'Draft',
      icon: AlertCircle,
      cls: 'bg-muted text-muted-foreground border-border',
    },
  }[status];
  const Icon = map.icon;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider',
        map.cls,
      )}
    >
      <Icon className="h-3 w-3" />
      {map.label}
    </span>
  );
};

const AuditCard = memo(({ audit }: { audit: CanvaAuditEntry }) => {
  const Icon = audit.icon;
  return (
    <Link
      to={audit.slug}
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-2xl border bg-card p-6 transition-all',
        'hover:-translate-y-1 hover:border-primary/50 hover:shadow-xl hover:shadow-primary/5',
        'bg-gradient-to-br',
        audit.accent,
      )}
    >
      {/* Top row */}
      <div className="mb-5 flex items-start justify-between gap-3">
        <div className="rounded-xl bg-background/70 p-3 backdrop-blur ring-1 ring-border/50">
          <Icon className="h-5 w-5 text-foreground" />
        </div>
        <div className="flex flex-col items-end gap-2">
          <StatusPill status={audit.status} />
          {audit.liveSync && (
            <span className="inline-flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              <Sparkles className="h-3 w-3" />
              Canva Connect
            </span>
          )}
        </div>
      </div>

      {/* Title block */}
      <div className="mb-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-primary/80">
        {audit.division}
      </div>
      <h3 className="mb-2 text-base font-bold leading-tight text-foreground">
        {audit.title}
      </h3>
      <p className="mb-5 flex-1 text-xs leading-relaxed text-muted-foreground">
        {audit.description}
      </p>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2 border-t border-border/60 pt-4">
        <div>
          <div className="text-lg font-bold tabular-nums text-foreground">
            {audit.templateCount}
          </div>
          <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
            Templates
          </div>
        </div>
        {audit.categoryCount !== undefined && (
          <div>
            <div className="text-lg font-bold tabular-nums text-foreground">
              {audit.categoryCount}
            </div>
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
              Categories
            </div>
          </div>
        )}
        {audit.flagCount !== undefined && (
          <div>
            <div
              className={cn(
                'text-lg font-bold tabular-nums',
                audit.flagCount > 0 ? 'text-amber-500' : 'text-foreground',
              )}
            >
              {audit.flagCount}
            </div>
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
              Findings
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="mt-4 flex items-center justify-between border-t border-border/40 pt-3 text-[11px] text-muted-foreground">
        <span>Updated {formatDate(audit.updatedAt)}</span>
        <span className="inline-flex items-center gap-1 font-medium text-foreground/80 transition-colors group-hover:text-primary">
          Open audit
          <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </span>
      </div>

      {audit.highlight && (
        <div className="absolute inset-x-0 top-0 origin-top scale-y-0 bg-background/95 px-6 py-1.5 text-[10px] font-medium uppercase tracking-wider text-primary backdrop-blur transition-transform group-hover:scale-y-100">
          {audit.highlight}
        </div>
      )}
    </Link>
  );
});
AuditCard.displayName = 'AuditCard';

export const CanvaAuditsSection = ({
  brandSlug,
  brandName,
  customSubtitle,
  onSubtitleChange,
}: CanvaAuditsSectionProps) => {
  const audits = getCanvaAuditsForBrand(brandSlug);
  const summary = summarizeCanvaAudits(brandSlug);

  if (audits.length === 0) return null;

  const defaultSubtitle = `Every Canva template audit conducted for ${brandName ?? 'this brand'} — sortable inventories, automated findings, per-asset notes, and live Canva Connect sync.`;

  return (
    <section className="w-full" aria-labelledby="canva-audits-heading">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            <LayoutGrid className="h-3.5 w-3.5" />
            Brand Operations
          </div>
          <SectionHeader
            title="Canva Template Audits"
            defaultSubtitle={defaultSubtitle}
            customSubtitle={customSubtitle}
            onSubtitleChange={onSubtitleChange}
            isEditing={false}
            onEditToggle={() => {}}
          />
        </div>

        {/* Summary strip */}
        <div className="mb-6 grid grid-cols-2 gap-3 rounded-xl border border-border bg-card p-4 sm:grid-cols-4">
          <SummaryStat label="Audits" value={summary.auditCount} icon={FileStack} />
          <SummaryStat label="Templates" value={summary.templateCount} />
          <SummaryStat
            label="Findings"
            value={summary.flagCount}
            highlight={summary.flagCount > 0}
          />
          <SummaryStat
            label="Live Sync"
            value={`${summary.liveSyncCount}/${summary.auditCount}`}
            icon={Sparkles}
          />
        </div>

        {/* Audit cards grid */}
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {audits.map((audit) => (
            <AuditCard key={audit.slug} audit={audit} />
          ))}
        </div>

        {/* Hub link */}
        <div className="mt-6 flex justify-end">
          <Link
            to="/brand-canva-audits"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-primary"
          >
            View all brand Canva audits
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </section>
  );
};

const SummaryStat = ({
  label,
  value,
  icon: Icon,
  highlight,
}: {
  label: string;
  value: string | number;
  icon?: React.ComponentType<{ className?: string }>;
  highlight?: boolean;
}) => (
  <div className="flex items-center gap-3">
    {Icon && (
      <div className="rounded-lg bg-muted/50 p-2">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
    )}
    <div>
      <div
        className={cn(
          'text-xl font-bold tabular-nums leading-none',
          highlight ? 'text-amber-500' : 'text-foreground',
        )}
      >
        {value}
      </div>
      <div className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
    </div>
  </div>
);
