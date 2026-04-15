/**
 * VisibilityDashboard — Org-wide visibility gap overview for Admin Dashboard
 * Shows cross-entity visibility scores, gaps, and growth tracking
 */
import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Eye,
  Search,
  Bot,
  Share2,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Loader2,
  Radar,
  ArrowRight,
  BarChart3,
  RefreshCw,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface VisibilityDashboardProps {
  organizationId: string;
}

interface AuditRecord {
  id: string;
  entity_id: string;
  entity_type: string;
  entity_name: string;
  overall_visibility_score: number | null;
  search_visibility_score: number | null;
  ai_platform_score: number | null;
  social_media_score: number | null;
  visibility_gaps: any[];
  recommendations: any[];
  status: string;
  created_at: string;
  completed_at: string | null;
}

function ScoreBadge({ score, label }: { score: number | null; label: string }) {
  const s = score ?? 0;
  const color = s >= 70 ? 'text-green-500' : s >= 40 ? 'text-amber-500' : 'text-destructive';
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[10px] text-muted-foreground">{label}</span>
      <span className={cn('text-xs font-bold', color)}>{score !== null ? Math.round(s) : '—'}</span>
    </div>
  );
}

export function VisibilityDashboard({ organizationId }: VisibilityDashboardProps) {
  const [audits, setAudits] = useState<AuditRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAudits = useCallback(async () => {
    setIsLoading(true);
    try {
      // Get latest completed audit per entity
      const { data, error } = await supabase
        .from('brand_visibility_audits')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('status', 'completed')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Deduplicate: keep only the latest per entity
      const latestByEntity = new Map<string, AuditRecord>();
      for (const row of (data || [])) {
        const key = `${row.entity_type}-${row.entity_id}`;
        if (!latestByEntity.has(key)) {
          latestByEntity.set(key, row as unknown as AuditRecord);
        }
      }
      setAudits(Array.from(latestByEntity.values()));
    } catch (err) {
      console.error('[VisibilityDashboard] fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [organizationId]);

  useEffect(() => {
    fetchAudits();
  }, [fetchAudits]);

  // Aggregated stats
  const stats = useMemo(() => {
    if (audits.length === 0) return null;
    const avg = (key: keyof AuditRecord) => {
      const vals = audits.map(a => a[key] as number | null).filter((v): v is number => v !== null);
      return vals.length > 0 ? vals.reduce((s, v) => s + v, 0) / vals.length : null;
    };

    const allGaps = audits.flatMap(a => Array.isArray(a.visibility_gaps) ? a.visibility_gaps : []);
    const criticalGaps = allGaps.filter(g => g.severity === 'critical' || g.severity === 'high');

    return {
      totalEntities: audits.length,
      avgOverall: avg('overall_visibility_score'),
      avgSearch: avg('search_visibility_score'),
      avgAI: avg('ai_platform_score'),
      avgSocial: avg('social_media_score'),
      totalGaps: allGaps.length,
      criticalGaps: criticalGaps.length,
      topCategories: Object.entries(
        allGaps.reduce((acc, g) => {
          acc[g.category] = (acc[g.category] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      ).sort(([, a], [, b]) => (b as number) - (a as number)),
    };
  }, [audits]);

  // Sort entities by score (worst first)
  const sortedAudits = useMemo(
    () => [...audits].sort((a, b) => (a.overall_visibility_score ?? 0) - (b.overall_visibility_score ?? 0)),
    [audits]
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (audits.length === 0) {
    return (
      <div className="text-center py-16 space-y-3">
        <div className="mx-auto w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
          <Eye className="h-7 w-7 text-primary" />
        </div>
        <h3 className="text-base font-semibold">No Visibility Audits Yet</h3>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Run visibility audits from the Brand Intelligence panel on any brand, product, or event to see cross-entity visibility gaps here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Eye className="h-5 w-5 text-primary" />
            Visibility Overview
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Cross-entity visibility scores and gap analysis
          </p>
        </div>
        <Button onClick={fetchAudits} variant="outline" size="sm" className="gap-1.5 text-xs">
          <RefreshCw className="h-3.5 w-3.5" /> Refresh
        </Button>
      </div>

      {/* Aggregate Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold" style={{
                color: (stats.avgOverall ?? 0) >= 70 ? 'hsl(var(--chart-2))' : (stats.avgOverall ?? 0) >= 40 ? 'hsl(var(--chart-4))' : 'hsl(var(--destructive))',
              }}>
                {stats.avgOverall !== null ? Math.round(stats.avgOverall) : '—'}
              </p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">Avg Visibility</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-foreground">{stats.totalEntities}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">Entities Audited</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-destructive">{stats.criticalGaps}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">Critical Gaps</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-foreground">{stats.totalGaps}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">Total Gaps</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Dimension Averages */}
      {stats && (
        <div className="grid grid-cols-3 gap-3">
          <Card className="border-l-2" style={{ borderLeftColor: 'hsl(var(--chart-1))' }}>
            <CardContent className="p-3 flex items-center gap-3">
              <Search className="h-4 w-4 text-muted-foreground shrink-0" />
              <div>
                <p className="text-lg font-bold">{stats.avgSearch !== null ? Math.round(stats.avgSearch) : '—'}</p>
                <p className="text-[10px] text-muted-foreground">Search</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-l-2" style={{ borderLeftColor: 'hsl(var(--chart-3))' }}>
            <CardContent className="p-3 flex items-center gap-3">
              <Bot className="h-4 w-4 text-muted-foreground shrink-0" />
              <div>
                <p className="text-lg font-bold">{stats.avgAI !== null ? Math.round(stats.avgAI) : '—'}</p>
                <p className="text-[10px] text-muted-foreground">AI Platforms</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-l-2" style={{ borderLeftColor: 'hsl(var(--chart-5))' }}>
            <CardContent className="p-3 flex items-center gap-3">
              <Share2 className="h-4 w-4 text-muted-foreground shrink-0" />
              <div>
                <p className="text-lg font-bold">{stats.avgSocial !== null ? Math.round(stats.avgSocial) : '—'}</p>
                <p className="text-[10px] text-muted-foreground">Social</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Entity-by-Entity Breakdown */}
      <div className="space-y-2">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Entity Scores (worst first)</h4>
        {sortedAudits.map((audit) => {
          const score = audit.overall_visibility_score ?? 0;
          const gapCount = Array.isArray(audit.visibility_gaps) ? audit.visibility_gaps.length : 0;

          return (
            <Card key={audit.id} className="overflow-hidden">
              <CardContent className="p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[8px] shrink-0">{audit.entity_type}</Badge>
                      <span className="text-sm font-medium truncate">{audit.entity_name}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-1.5">
                      <ScoreBadge score={audit.search_visibility_score} label="Search" />
                      <ScoreBadge score={audit.ai_platform_score} label="AI" />
                      <ScoreBadge score={audit.social_media_score} label="Social" />
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {gapCount > 0 && (
                      <Badge variant="outline" className="text-[9px] text-amber-500">
                        <AlertTriangle className="h-2.5 w-2.5 mr-0.5" />{gapCount} gaps
                      </Badge>
                    )}
                    <div className="w-16 text-right">
                      <span className={cn('text-lg font-bold',
                        score >= 70 ? 'text-green-500' : score >= 40 ? 'text-amber-500' : 'text-destructive'
                      )}>
                        {Math.round(score)}
                      </span>
                    </div>
                  </div>
                </div>
                <Progress value={score} className="h-1 mt-2" />
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Gap Categories Distribution */}
      {stats && stats.topCategories.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Gap Categories</h4>
          <div className="flex flex-wrap gap-2">
            {stats.topCategories.map(([cat, count]) => (
              <Badge key={cat} variant="outline" className="text-xs gap-1">
                {cat === 'search' ? <Search className="h-3 w-3" /> :
                 cat === 'ai' ? <Bot className="h-3 w-3" /> :
                 cat === 'social' ? <Share2 className="h-3 w-3" /> :
                 <BarChart3 className="h-3 w-3" />}
                {cat}: {count as number}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
