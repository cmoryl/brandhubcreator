/**
 * VisibilityDashboard — Org-wide visibility gap overview for Admin Dashboard
 * Shows cross-entity visibility scores, gaps, and growth tracking
 * With interactive expandable entity detail cards
 */
import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Eye, Search, Bot, Share2, AlertTriangle, TrendingUp,
  Loader2, RefreshCw, BarChart3, ChevronDown, ChevronUp,
  ExternalLink, Lightbulb, Target, Info,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';

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
  search_results: any;
  ai_results: any;
  social_results: any;
}

// ─── Score Badge ────────────────────────────────────────────
function ScoreBadge({ score, label, icon: Icon }: { score: number | null; label: string; icon?: React.ElementType }) {
  const s = score ?? 0;
  const color = s >= 70 ? 'text-emerald-500' : s >= 40 ? 'text-amber-500' : 'text-destructive';
  return (
    <div className="flex items-center gap-1.5">
      {Icon && <Icon className="h-3 w-3 text-muted-foreground" />}
      <span className="text-[10px] text-muted-foreground">{label}</span>
      <span className={cn('text-xs font-bold tabular-nums', color)}>{score !== null ? Math.round(s) : '—'}</span>
    </div>
  );
}

// ─── Score Ring ─────────────────────────────────────────────
function ScoreRing({ score, size = 56, label }: { score: number; size?: number; label: string }) {
  const strokeWidth = 4;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 70 ? 'hsl(142.1 76.2% 36.3%)' : score >= 40 ? 'hsl(38 92% 50%)' : 'hsl(var(--destructive))';

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative">
        <svg width={size} height={size} className="transform -rotate-90">
          <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="hsl(var(--muted))" strokeWidth={strokeWidth} />
          <circle
            cx={size/2} cy={size/2} r={radius} fill="none"
            stroke={color} strokeWidth={strokeWidth} strokeLinecap="round"
            strokeDasharray={circumference} strokeDashoffset={offset}
            className="transition-all duration-700"
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-sm font-bold tabular-nums">{score}</span>
      </div>
      <span className="text-[10px] text-muted-foreground font-medium">{label}</span>
    </div>
  );
}

// ─── Gap Item Card ──────────────────────────────────────────
function GapCard({ gap }: { gap: any }) {
  const severityColor = {
    critical: 'border-destructive/40 bg-destructive/5',
    high: 'border-amber-500/40 bg-amber-500/5',
    medium: 'border-blue-500/30 bg-blue-500/5',
    low: 'border-border bg-muted/30',
  }[gap.severity || 'low'] || 'border-border bg-muted/30';

  const severityBadge = {
    critical: 'destructive',
    high: 'default',
    medium: 'secondary',
    low: 'outline',
  }[gap.severity || 'low'] as any || 'outline';

  return (
    <div className={cn('rounded-lg border p-2.5 space-y-1', severityColor)}>
      <div className="flex items-start justify-between gap-2">
        <span className="text-xs font-medium leading-snug">{gap.title || gap.gap || 'Visibility Gap'}</span>
        <Badge variant={severityBadge} className="text-[9px] shrink-0">{gap.severity || 'info'}</Badge>
      </div>
      {gap.description && <p className="text-[11px] text-muted-foreground leading-snug">{gap.description}</p>}
      {gap.category && (
        <div className="flex items-center gap-1">
          <Badge variant="outline" className="text-[8px]">{gap.category}</Badge>
        </div>
      )}
    </div>
  );
}

// ─── Recommendation Card ────────────────────────────────────
function RecommendationCard({ rec, index }: { rec: any; index: number }) {
  return (
    <div className="flex items-start gap-2 p-2 rounded-lg bg-muted/30 border border-border/40">
      <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
        <span className="text-[9px] font-bold text-primary">{index + 1}</span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium leading-snug">{rec.title || rec.recommendation || `Recommendation ${index + 1}`}</p>
        {rec.description && <p className="text-[11px] text-muted-foreground leading-snug mt-0.5">{rec.description}</p>}
        {rec.impact && (
          <Badge variant="outline" className="text-[8px] mt-1">
            <Target className="h-2 w-2 mr-0.5" />Impact: {rec.impact}
          </Badge>
        )}
      </div>
    </div>
  );
}

// ─── Expandable Entity Card ─────────────────────────────────
function EntityDetailCard({ audit }: { audit: AuditRecord }) {
  const [isOpen, setIsOpen] = useState(false);
  const score = audit.overall_visibility_score ?? 0;
  const gaps = Array.isArray(audit.visibility_gaps) ? audit.visibility_gaps : [];
  const recs = Array.isArray(audit.recommendations) ? audit.recommendations : [];
  const criticalGaps = gaps.filter(g => g.severity === 'critical' || g.severity === 'high');

  const searchResults = audit.search_results || {};
  const aiResults = audit.ai_results || {};
  const socialResults = audit.social_results || {};

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className={cn('overflow-hidden transition-all', isOpen && 'ring-1 ring-primary/20')}>
        <CollapsibleTrigger asChild>
          <button className="w-full text-left">
            <CardContent className="p-3">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[8px] shrink-0">{audit.entity_type}</Badge>
                    <span className="text-sm font-medium truncate">{audit.entity_name}</span>
                    {criticalGaps.length > 0 && (
                      <Badge variant="outline" className="text-[9px] text-destructive border-destructive/30">
                        <AlertTriangle className="h-2.5 w-2.5 mr-0.5" />{criticalGaps.length} critical
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1.5">
                    <ScoreBadge score={audit.search_visibility_score} label="Search" icon={Search} />
                    <ScoreBadge score={audit.ai_platform_score} label="AI" icon={Bot} />
                    <ScoreBadge score={audit.social_media_score} label="Social" icon={Share2} />
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="w-16 text-right">
                    <span className={cn('text-lg font-bold tabular-nums',
                      score >= 70 ? 'text-emerald-500' : score >= 40 ? 'text-amber-500' : 'text-destructive'
                    )}>{Math.round(score)}</span>
                  </div>
                  {isOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                </div>
              </div>
              <Progress value={score} className="h-1 mt-2" />
            </CardContent>
          </button>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="border-t border-border/40 p-4 space-y-4 bg-muted/10">
            {/* Score Rings */}
            <div className="flex justify-center gap-6">
              <ScoreRing score={Math.round(audit.search_visibility_score ?? 0)} label="Search" />
              <ScoreRing score={Math.round(audit.ai_platform_score ?? 0)} label="AI Platforms" />
              <ScoreRing score={Math.round(audit.social_media_score ?? 0)} label="Social" />
              <ScoreRing score={Math.round(score)} label="Overall" size={64} />
            </div>

            {/* Dimension Details */}
            <div className="grid sm:grid-cols-3 gap-3">
              {/* Search Details */}
              <Card className="border-l-2" style={{ borderLeftColor: 'hsl(var(--chart-1))' }}>
                <CardHeader className="p-2.5 pb-1">
                  <CardTitle className="text-[11px] font-semibold flex items-center gap-1.5">
                    <Search className="h-3 w-3" /> Search Visibility
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-2.5 pt-0 space-y-1.5">
                  {searchResults.keyword_gaps && Array.isArray(searchResults.keyword_gaps) && searchResults.keyword_gaps.length > 0 && (
                    <div>
                      <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold">Keyword Gaps</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {searchResults.keyword_gaps.slice(0, 6).map((kw: string, i: number) => (
                          <Badge key={i} variant="outline" className="text-[9px]">{kw}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {searchResults.content_gaps && Array.isArray(searchResults.content_gaps) && searchResults.content_gaps.length > 0 && (
                    <div>
                      <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold">Content Gaps</span>
                      {searchResults.content_gaps.slice(0, 3).map((cg: any, i: number) => (
                        <p key={i} className="text-[11px] text-muted-foreground">• {typeof cg === 'string' ? cg : cg.title || cg.description || JSON.stringify(cg)}</p>
                      ))}
                    </div>
                  )}
                  {(!searchResults.keyword_gaps || searchResults.keyword_gaps?.length === 0) && (!searchResults.content_gaps || searchResults.content_gaps?.length === 0) && (
                    <p className="text-[11px] text-muted-foreground italic">No detailed search data available</p>
                  )}
                </CardContent>
              </Card>

              {/* AI Platform Details */}
              <Card className="border-l-2" style={{ borderLeftColor: 'hsl(var(--chart-3))' }}>
                <CardHeader className="p-2.5 pb-1">
                  <CardTitle className="text-[11px] font-semibold flex items-center gap-1.5">
                    <Bot className="h-3 w-3" /> AI Platform Presence
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-2.5 pt-0 space-y-1.5">
                  {aiResults.platforms && Array.isArray(aiResults.platforms) && aiResults.platforms.length > 0 ? (
                    aiResults.platforms.slice(0, 4).map((plat: any, i: number) => (
                      <div key={i} className="flex items-center justify-between">
                        <span className="text-[11px]">{plat.name || plat.platform || `Platform ${i+1}`}</span>
                        <Badge variant="outline" className={cn('text-[9px]',
                          (plat.score || plat.readiness || 0) >= 70 ? 'text-emerald-500' : 'text-amber-500'
                        )}>{plat.score || plat.readiness || '—'}%</Badge>
                      </div>
                    ))
                  ) : aiResults.readiness_score != null ? (
                    <div className="text-center py-2">
                      <span className="text-lg font-bold">{aiResults.readiness_score}%</span>
                      <p className="text-[10px] text-muted-foreground">AI Readiness</p>
                    </div>
                  ) : (
                    <p className="text-[11px] text-muted-foreground italic">No AI platform data available</p>
                  )}
                </CardContent>
              </Card>

              {/* Social Details */}
              <Card className="border-l-2" style={{ borderLeftColor: 'hsl(var(--chart-5))' }}>
                <CardHeader className="p-2.5 pb-1">
                  <CardTitle className="text-[11px] font-semibold flex items-center gap-1.5">
                    <Share2 className="h-3 w-3" /> Social & Media
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-2.5 pt-0 space-y-1.5">
                  {socialResults.platforms && Array.isArray(socialResults.platforms) && socialResults.platforms.length > 0 ? (
                    socialResults.platforms.slice(0, 4).map((plat: any, i: number) => (
                      <div key={i} className="flex items-center justify-between">
                        <span className="text-[11px]">{plat.name || plat.platform || `Channel ${i+1}`}</span>
                        <Badge variant="outline" className="text-[9px]">{plat.score || plat.presence || '—'}%</Badge>
                      </div>
                    ))
                  ) : socialResults.overall_presence != null ? (
                    <div className="text-center py-2">
                      <span className="text-lg font-bold">{socialResults.overall_presence}%</span>
                      <p className="text-[10px] text-muted-foreground">Social Presence</p>
                    </div>
                  ) : (
                    <p className="text-[11px] text-muted-foreground italic">No social data available</p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Visibility Gaps */}
            {gaps.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                  <h5 className="text-xs font-semibold">Visibility Gaps ({gaps.length})</h5>
                </div>
                <div className="grid sm:grid-cols-2 gap-2">
                  {gaps.slice(0, 6).map((gap, i) => (
                    <GapCard key={i} gap={gap} />
                  ))}
                </div>
                {gaps.length > 6 && (
                  <p className="text-[11px] text-muted-foreground text-center">+{gaps.length - 6} more gaps</p>
                )}
              </div>
            )}

            {/* Recommendations */}
            {recs.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Lightbulb className="h-3.5 w-3.5 text-primary" />
                  <h5 className="text-xs font-semibold">Recommendations ({recs.length})</h5>
                </div>
                <div className="space-y-1.5">
                  {recs.slice(0, 5).map((rec, i) => (
                    <RecommendationCard key={i} rec={rec} index={i} />
                  ))}
                </div>
              </div>
            )}

            {/* Audit metadata */}
            <div className="flex items-center gap-3 text-[10px] text-muted-foreground pt-1 border-t border-border/30">
              <Info className="h-3 w-3 shrink-0" />
              <span>Audited {audit.completed_at ? new Date(audit.completed_at).toLocaleDateString() : new Date(audit.created_at).toLocaleDateString()}</span>
              <span>·</span>
              <span>ID: {audit.id.slice(0, 8)}</span>
            </div>
          </div>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

export function VisibilityDashboard({ organizationId }: VisibilityDashboardProps) {
  const [audits, setAudits] = useState<AuditRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAudits = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('brand_visibility_audits')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('status', 'completed')
        .order('created_at', { ascending: false });

      if (error) throw error;

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

  useEffect(() => { fetchAudits(); }, [fetchAudits]);

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
        allGaps.reduce((acc, g) => { acc[g.category] = (acc[g.category] || 0) + 1; return acc; }, {} as Record<string, number>)
      ).sort(([, a], [, b]) => (b as number) - (a as number)),
    };
  }, [audits]);

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
            Cross-entity visibility scores and gap analysis · Click any entity to expand full details
          </p>
        </div>
        <Button onClick={fetchAudits} variant="outline" size="sm" className="gap-1.5 text-xs">
          <RefreshCw className="h-3.5 w-3.5" /> Refresh
        </Button>
      </div>

      {/* Aggregate Infographic */}
      {stats && (
        <Card className="bg-gradient-to-br from-card to-muted/20">
          <CardContent className="p-5">
            <div className="flex flex-col md:flex-row items-center gap-6">
              {/* Score Rings */}
              <div className="flex items-center gap-4">
                <ScoreRing score={Math.round(stats.avgOverall ?? 0)} size={72} label="Overall" />
                <div className="flex flex-col gap-2">
                  <ScoreRing score={Math.round(stats.avgSearch ?? 0)} size={48} label="Search" />
                  <ScoreRing score={Math.round(stats.avgAI ?? 0)} size={48} label="AI" />
                  <ScoreRing score={Math.round(stats.avgSocial ?? 0)} size={48} label="Social" />
                </div>
              </div>

              {/* Stats Grid */}
              <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="text-center p-3 rounded-lg bg-card border border-border/40">
                  <p className="text-2xl font-bold text-foreground">{stats.totalEntities}</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">Entities</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-card border border-border/40">
                  <p className="text-2xl font-bold text-destructive">{stats.criticalGaps}</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">Critical</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-card border border-border/40">
                  <p className="text-2xl font-bold text-foreground">{stats.totalGaps}</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">Total Gaps</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-card border border-border/40">
                  <p className="text-2xl font-bold" style={{
                    color: (stats.avgOverall ?? 0) >= 70 ? 'hsl(142.1 76.2% 36.3%)' : (stats.avgOverall ?? 0) >= 40 ? 'hsl(38 92% 50%)' : 'hsl(var(--destructive))',
                  }}>{stats.avgOverall !== null ? Math.round(stats.avgOverall) : '—'}%</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">Avg Score</p>
                </div>
              </div>
            </div>

            {/* Gap Categories */}
            {stats.topCategories.length > 0 && (
              <div className="mt-4 pt-3 border-t border-border/30">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Gap Distribution</span>
                <div className="flex flex-wrap gap-2 mt-1.5">
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
          </CardContent>
        </Card>
      )}

      {/* Entity-by-Entity Breakdown (Expandable) */}
      <div className="space-y-2">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Entity Scores — click to expand ({sortedAudits.length})
        </h4>
        {sortedAudits.map((audit) => (
          <EntityDetailCard key={audit.id} audit={audit} />
        ))}
      </div>
    </div>
  );
}
