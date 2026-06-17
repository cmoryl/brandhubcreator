import { useMemo } from 'react';
import { Layers, RefreshCcw, ExternalLink, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  useCanvaAuditAnalyses,
  useCanvaAuditSync,
} from '@/hooks/useCanvaAuditAnalyses';
import { getCanvaAuditsForBrand } from '@/data/canvaAudits';

interface CanvaOperationsTileProps {
  brandId?: string | null;
  brandSlug?: string | null;
  organizationId?: string | null;
  canEdit?: boolean;
}

function scoreColor(score: number) {
  if (score >= 80) return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30';
  if (score >= 60) return 'bg-amber-500/10 text-amber-600 border-amber-500/30';
  return 'bg-destructive/10 text-destructive border-destructive/30';
}

export function CanvaOperationsTile({
  brandId,
  brandSlug,
  organizationId,
  canEdit,
}: CanvaOperationsTileProps) {
  const registry = useMemo(() => getCanvaAuditsForBrand(brandSlug), [brandSlug]);
  const { analyses, loading, refresh } = useCanvaAuditAnalyses(brandSlug);
  const { sync, syncing } = useCanvaAuditSync();

  if (!brandSlug || registry.length === 0) return null;

  const avgScore = analyses.length
    ? Math.round(
        analyses.reduce((n, a) => n + (a.health_score ?? 0), 0) / analyses.length,
      )
    : null;
  const totalFlags = analyses.reduce((n, a) => n + (a.flag_count ?? 0), 0);
  const totalTemplates = analyses.reduce((n, a) => n + (a.template_count ?? 0), 0);

  const handleSyncAll = async () => {
    if (!organizationId) return;
    await sync({ brandSlug, brandId, organizationId, force: true });
    refresh();
  };

  return (
    <>
      <Separator />
      <div className="rounded-lg border border-cyan-500/20 bg-gradient-to-br from-cyan-500/5 to-emerald-500/5 p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-cyan-500" />
          <span className="text-sm font-semibold">Canva Operations</span>
          {avgScore !== null && (
            <Badge variant="outline" className={`ml-auto text-xs ${scoreColor(avgScore)}`}>
              {avgScore}/100 avg
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div className="p-2 bg-background/60 rounded">
            <p className="font-semibold">{registry.length}</p>
            <p className="text-muted-foreground">Audits</p>
          </div>
          <div className="p-2 bg-background/60 rounded">
            <p className="font-semibold">{totalTemplates || registry.reduce((n, a) => n + a.templateCount, 0)}</p>
            <p className="text-muted-foreground">Templates</p>
          </div>
          <div className="p-2 bg-background/60 rounded">
            <p className="font-semibold flex items-center justify-center gap-1">
              {totalFlags > 0 ? (
                <AlertTriangle className="h-3 w-3 text-amber-500" />
              ) : (
                <CheckCircle2 className="h-3 w-3 text-emerald-500" />
              )}
              {totalFlags}
            </p>
            <p className="text-muted-foreground">Findings</p>
          </div>
        </div>

        {analyses.length === 0 && !loading && (
          <p className="text-xs text-muted-foreground italic">
            No Brain analyses yet. Run a sync to feed Canva findings into intelligence.
          </p>
        )}

        <div className="space-y-2">
          {registry.map((entry) => {
            const slugKey = entry.slug.replace(/^\//, '');
            const analysis = analyses.find((a) => a.audit_slug === slugKey);
            return (
              <div
                key={entry.slug}
                className="flex items-center gap-2 p-2 rounded border border-border/40 bg-background/40 text-xs"
              >
                <entry.icon className="h-3.5 w-3.5 text-cyan-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{entry.title}</p>
                  {analysis?.summary && (
                    <p className="text-muted-foreground line-clamp-1">{analysis.summary}</p>
                  )}
                </div>
                {analysis && (
                  <Badge variant="outline" className={`text-[10px] ${scoreColor(analysis.health_score)}`}>
                    {analysis.health_score}
                  </Badge>
                )}
                <Button asChild size="icon" variant="ghost" className="h-6 w-6">
                  <Link to={entry.slug}>
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                </Button>
              </div>
            );
          })}
        </div>

        {canEdit && organizationId && (
          <Button
            size="sm"
            variant="outline"
            className="w-full"
            onClick={handleSyncAll}
            disabled={!!syncing}
          >
            <RefreshCcw className={`h-3.5 w-3.5 mr-1.5 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Syncing…' : 'Sync all audits to Brain'}
          </Button>
        )}
      </div>
    </>
  );
}
