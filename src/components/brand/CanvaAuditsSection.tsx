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
  Brain,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  getCanvaAuditsForBrand,
  summarizeCanvaAudits,
  type CanvaAuditEntry,
} from '@/data/canvaAudits';
import { SectionHeader } from './SectionHeader';
import { AuditCardSkeleton } from './CanvaAuditSkeletons';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useCanvaAuditAnalyses,
  useCanvaAuditSync,
  type CanvaAuditAnalysis,
} from '@/hooks/useCanvaAuditAnalyses';
import { useGuideAdmin } from '@/hooks/useGuideAdmin';

interface CanvaAuditsSectionProps {
  brandSlug?: string | null;
  brandId?: string | null;
  organizationId?: string | null;
  brandName?: string;
  brandColors?: Array<{ hex: string; name?: string }>;
  customSubtitle?: string;
  onSubtitleChange?: (subtitle: string) => void;
  /** When true, render the skeleton variant instead of real cards. */
  loading?: boolean;
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

const AuditCard = memo(
  ({
    audit,
    delayMs = 0,
    analysis,
    onSync,
    syncing,
    canSync,
  }: {
    audit: CanvaAuditEntry;
    delayMs?: number;
    analysis?: CanvaAuditAnalysis;
    onSync?: () => void;
    syncing?: boolean;
    canSync?: boolean;
  }) => {
    const Icon = audit.icon;
    const findingsCount = analysis?.flag_count ?? audit.flagCount ?? 0;
    const healthScore = analysis?.health_score;
    const lastAnalyzed = analysis?.last_analyzed_at;

    return (
      <Link
        to={audit.slug}
        style={{ animationDelay: `${delayMs}ms` }}
        className={cn(
          'group relative flex flex-col overflow-hidden rounded-2xl border bg-card p-6 transition-all animate-fade-in',
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
        <p className="mb-4 flex-1 text-xs leading-relaxed text-muted-foreground">
          {audit.description}
        </p>

        {/* Brain insights badge */}
        {analysis && (
          <div className="mb-4 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2">
            <div className="mb-1 flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-primary">
                <Brain className="h-3 w-3" />
                Brain Insights
              </span>
              {typeof healthScore === 'number' && (
                <span
                  className={cn(
                    'rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums',
                    healthScore >= 80
                      ? 'bg-emerald-500/15 text-emerald-500'
                      : healthScore >= 60
                        ? 'bg-amber-500/15 text-amber-500'
                        : 'bg-destructive/15 text-destructive',
                  )}
                >
                  {healthScore}/100
                </span>
              )}
            </div>
            {analysis.summary && (
              <p className="line-clamp-2 text-[11px] leading-snug text-foreground/80">
                {analysis.summary}
              </p>
            )}
          </div>
        )}

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2 border-t border-border/60 pt-4">
          <div>
            <div className="text-lg font-bold tabular-nums text-foreground">
              {analysis?.template_count ?? audit.templateCount}
            </div>
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
              Templates
            </div>
          </div>
          {audit.categoryCount !== undefined && (
            <div>
              <div className="text-lg font-bold tabular-nums text-foreground">
                {analysis?.category_count || audit.categoryCount}
              </div>
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
                Categories
              </div>
            </div>
          )}
          <div>
            <div
              className={cn(
                'text-lg font-bold tabular-nums',
                findingsCount > 0 ? 'text-amber-500' : 'text-foreground',
              )}
            >
              {findingsCount}
            </div>
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
              Findings
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-4 flex items-center justify-between border-t border-border/40 pt-3 text-[11px] text-muted-foreground">
          <span>
            {lastAnalyzed
              ? `Analyzed ${formatDate(lastAnalyzed)}`
              : `Updated ${formatDate(audit.updatedAt)}`}
          </span>
          <span className="inline-flex items-center gap-1 font-medium text-foreground/80 transition-colors group-hover:text-primary">
            Open audit
            <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </span>
        </div>

        {/* Sync to Brain button (admin only) */}
        {canSync && onSync && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onSync();
            }}
            disabled={syncing}
            className={cn(
              'absolute right-3 top-3 inline-flex items-center gap-1 rounded-full border border-border bg-background/90 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-foreground backdrop-blur transition-all',
              'opacity-0 group-hover:opacity-100 hover:border-primary/40 hover:text-primary',
              syncing && 'opacity-100',
            )}
            title={analysis ? 're-sync to Brain' : 'sync to Brain'}
          >
            {syncing ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Brain className="h-3 w-3" />
            )}
            {syncing ? 'Syncing' : analysis ? 'Re-sync' : 'Sync to Brain'}
          </button>
        )}

        {audit.highlight && !canSync && (
          <div className="absolute inset-x-0 top-0 origin-top scale-y-0 bg-background/95 px-6 py-1.5 text-[10px] font-medium uppercase tracking-wider text-primary backdrop-blur transition-transform group-hover:scale-y-100">
            {audit.highlight}
          </div>
        )}
      </Link>
    );
  },
);
AuditCard.displayName = 'AuditCard';

export const CanvaAuditsSection = ({
  brandSlug,
  brandId,
  organizationId,
  brandName,
  customSubtitle,
  onSubtitleChange,
  loading = false,
}: CanvaAuditsSectionProps) => {
  const audits = getCanvaAuditsForBrand(brandSlug);
  const summary = summarizeCanvaAudits(brandSlug);
  const { analyses, refresh } = useCanvaAuditAnalyses(brandSlug);
  const { sync, syncing } = useCanvaAuditSync();
  const { canEdit } = useGuideAdmin({ entityOrgId: organizationId });

  if (!loading && audits.length === 0) return null;

  const defaultSubtitle = `Every Canva template audit conducted for ${brandName ?? 'this brand'} — sortable inventories, automated findings, per-asset notes, and live Canva Connect sync.`;
  const skeletonCount = Math.max(audits.length, 3);
  const analysisBySlug = new Map(analyses.map((a) => [a.audit_slug, a]));
  const canSync = Boolean(canEdit && organizationId);

  const handleSync = async (auditSlug?: string) => {
    if (!organizationId || !brandSlug) return;
    await sync({ organizationId, brandSlug, brandId, auditSlug, force: true });
    await refresh();
  };


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
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-9 w-9 rounded-lg" />
                <div className="space-y-1.5">
                  <Skeleton className="h-5 w-12" />
                  <Skeleton className="h-2.5 w-16" />
                </div>
              </div>
            ))
          ) : (
            <>
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
            </>
          )}
        </div>

        {/* Audit cards grid — progressive stagger fade-in */}
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {loading
            ? Array.from({ length: skeletonCount }).map((_, i) => (
                <AuditCardSkeleton key={i} delayMs={i * 80} />
              ))
            : audits.map((audit, i) => (
                <AuditCard
                  key={audit.slug}
                  audit={audit}
                  delayMs={i * 80}
                  analysis={analysisBySlug.get(audit.slug)}
                  onSync={() => handleSync(audit.slug)}
                  syncing={syncing === audit.slug || syncing === 'all'}
                  canSync={canSync}
                />
              ))}
        </div>

        {/* Hub link + bulk sync */}
        <div className="mt-6 flex items-center justify-between gap-3">
          {canSync ? (
            <button
              type="button"
              onClick={() => handleSync()}
              disabled={Boolean(syncing)}
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-primary/40 hover:text-primary disabled:opacity-60"
            >
              {syncing === 'all' ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Brain className="h-3.5 w-3.5" />
              )}
              {syncing === 'all' ? 'Syncing all to Brain…' : 'Sync all audits to Brain'}
            </button>
          ) : (
            <span />
          )}
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
