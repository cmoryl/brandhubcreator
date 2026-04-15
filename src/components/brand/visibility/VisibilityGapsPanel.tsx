/**
 * VisibilityGapsPanel — Per-entity visibility gap analysis UI
 * Shows search, AI platform, and social/media visibility scores and gaps
 */
import { useState, useMemo } from 'react';
import {
  Search,
  Bot,
  Share2,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Radar,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  Zap,
  ExternalLink,
  Globe2,
  Target,
  Eye,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Separator } from '@/components/ui/separator';
import { useVisibilityAudit, type VisibilityAudit } from '@/hooks/useVisibilityAudit';
import { cn } from '@/lib/utils';

interface VisibilityGapsPanelProps {
  entityId: string;
  entityType: 'brand' | 'product' | 'event';
  entityName: string;
  organizationId?: string | null;
  websites?: string[];
  socialProfiles?: string[];
  isAdmin?: boolean;
}

const severityColors: Record<string, string> = {
  critical: 'bg-destructive/10 text-destructive border-destructive/20',
  high: 'bg-red-500/10 text-red-500 border-red-500/20',
  medium: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  low: 'bg-green-500/10 text-green-500 border-green-500/20',
};

const categoryIcons: Record<string, React.ReactNode> = {
  search: <Search className="h-3.5 w-3.5" />,
  ai: <Bot className="h-3.5 w-3.5" />,
  social: <Share2 className="h-3.5 w-3.5" />,
  media: <Globe2 className="h-3.5 w-3.5" />,
  content: <Target className="h-3.5 w-3.5" />,
};

function ScoreRing({ score, label, size = 'md' }: { score: number | null; label: string; size?: 'sm' | 'md' }) {
  const s = score ?? 0;
  const radius = size === 'sm' ? 28 : 36;
  const stroke = size === 'sm' ? 4 : 5;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (s / 100) * circumference;
  const svgSize = (radius + stroke) * 2;

  const color = s >= 70 ? 'hsl(var(--chart-2))' : s >= 40 ? 'hsl(var(--chart-4))' : 'hsl(var(--destructive))';

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={svgSize} height={svgSize} className="-rotate-90">
        <circle cx={radius + stroke} cy={radius + stroke} r={radius} fill="none" stroke="hsl(var(--muted))" strokeWidth={stroke} />
        <circle cx={radius + stroke} cy={radius + stroke} r={radius} fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" className="transition-all duration-700" />
      </svg>
      <span className={cn("font-bold", size === 'sm' ? 'text-lg' : 'text-2xl')} style={{ color, marginTop: `-${svgSize / 2 + (size === 'sm' ? 12 : 16)}px` }}>
        {score !== null ? Math.round(s) : '—'}
      </span>
      <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium mt-1">{label}</span>
    </div>
  );
}

export function VisibilityGapsPanel({
  entityId,
  entityType,
  entityName,
  organizationId,
  websites = [],
  socialProfiles = [],
  isAdmin = false,
}: VisibilityGapsPanelProps) {
  const { audit, isLoading, isAnalyzing, runAudit } = useVisibilityAudit({
    entityId,
    entityType,
    entityName,
    organizationId,
  });

  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    search: false,
    ai: false,
    social: false,
    gaps: true,
    recommendations: false,
  });

  const toggleSection = (key: string) =>
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));

  const sortedGaps = useMemo(() => {
    if (!audit?.visibility_gaps) return [];
    const gaps = Array.isArray(audit.visibility_gaps) ? audit.visibility_gaps : [];
    const order = { critical: 0, high: 1, medium: 2, low: 3 };
    return [...gaps].sort((a, b) => (order[a.severity as keyof typeof order] ?? 3) - (order[b.severity as keyof typeof order] ?? 3));
  }, [audit?.visibility_gaps]);

  const sortedRecs = useMemo(() => {
    if (!audit?.recommendations) return [];
    const recs = Array.isArray(audit.recommendations) ? audit.recommendations : [];
    return [...recs].sort((a, b) => (a.priority || 99) - (b.priority || 99));
  }, [audit?.recommendations]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // No audit yet — show CTA
  if (!audit) {
    return (
      <div className="space-y-4">
        <div className="text-center py-8 space-y-3">
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Eye className="h-6 w-6 text-primary" />
          </div>
          <h3 className="text-sm font-semibold">Visibility Gap Analysis</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Discover where {entityName} is missing online — in search engines, AI platforms, and social media — and get actionable steps to fix each gap.
          </p>
          {isAdmin && (
            <Button onClick={() => runAudit(websites, socialProfiles)} disabled={isAnalyzing} size="sm" className="gap-1.5">
              {isAnalyzing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Radar className="h-3.5 w-3.5" />}
              {isAnalyzing ? 'Analyzing...' : 'Run Visibility Audit'}
            </Button>
          )}
        </div>
      </div>
    );
  }

  // Processing state
  if (audit.status === 'processing' || audit.status === 'pending') {
    return (
      <div className="text-center py-8 space-y-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
        <p className="text-sm font-medium">Analyzing visibility gaps...</p>
        <p className="text-xs text-muted-foreground">Scanning search, AI platforms, and social media presence</p>
      </div>
    );
  }

  // Failed state
  if (audit.status === 'failed') {
    return (
      <div className="text-center py-8 space-y-3">
        <AlertTriangle className="h-8 w-8 text-destructive mx-auto" />
        <p className="text-sm font-medium text-destructive">Audit failed</p>
        <p className="text-xs text-muted-foreground">{audit.error_message}</p>
        {isAdmin && (
          <Button onClick={() => runAudit(websites, socialProfiles)} size="sm" variant="outline" className="gap-1.5">
            <Radar className="h-3.5 w-3.5" /> Retry
          </Button>
        )}
      </div>
    );
  }

  // Completed — show results
  return (
    <div className="space-y-4">
      {/* Score Overview */}
      <div className="grid grid-cols-4 gap-2 py-2">
        <ScoreRing score={audit.overall_visibility_score} label="Overall" />
        <ScoreRing score={audit.search_visibility_score} label="Search" size="sm" />
        <ScoreRing score={audit.ai_platform_score} label="AI" size="sm" />
        <ScoreRing score={audit.social_media_score} label="Social" size="sm" />
      </div>

      <Separator />

      {/* Visibility Gaps */}
      <Collapsible open={expandedSections.gaps} onOpenChange={() => toggleSection('gaps')}>
        <CollapsibleTrigger className="flex w-full items-center justify-between py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors">
          <span className="flex items-center gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5" />
            Visibility Gaps ({sortedGaps.length})
          </span>
          {expandedSections.gaps ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-2">
          {sortedGaps.map((gap, i) => (
            <Card key={i} className="border-l-2" style={{
              borderLeftColor: gap.severity === 'critical' ? 'hsl(var(--destructive))' : gap.severity === 'high' ? '#ef4444' : gap.severity === 'medium' ? '#f59e0b' : '#22c55e',
            }}>
              <CardContent className="p-3 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    {categoryIcons[gap.category] || <Target className="h-3.5 w-3.5" />}
                    <span className="text-xs font-semibold">{gap.title}</span>
                  </div>
                  <div className="flex gap-1">
                    <Badge variant="outline" className={cn('text-[9px]', severityColors[gap.severity])}>{gap.severity}</Badge>
                    {gap.estimated_effort && (
                      <Badge variant="outline" className="text-[9px]">
                        <Zap className="h-2 w-2 mr-0.5" />{gap.estimated_effort}
                      </Badge>
                    )}
                  </div>
                </div>
                <p className="text-[11px] text-muted-foreground">{gap.description}</p>
                {gap.action_items?.length > 0 && (
                  <ul className="space-y-0.5">
                    {gap.action_items.map((item: string, j: number) => (
                      <li key={j} className="flex items-start gap-1.5 text-[10px] text-muted-foreground">
                        <CheckCircle2 className="h-3 w-3 mt-0.5 text-primary shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          ))}
        </CollapsibleContent>
      </Collapsible>

      {/* Search Analysis */}
      <Collapsible open={expandedSections.search} onOpenChange={() => toggleSection('search')}>
        <CollapsibleTrigger className="flex w-full items-center justify-between py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors">
          <span className="flex items-center gap-1.5"><Search className="h-3.5 w-3.5" /> Search Visibility</span>
          {expandedSections.search ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-3 pt-1">
          {audit.search_analysis && (
            <>
              <p className="text-xs text-muted-foreground">{audit.search_analysis.seo_health}</p>
              {audit.search_analysis.keyword_gaps?.length > 0 && (
                <div className="space-y-1">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Keyword Gaps</p>
                  {audit.search_analysis.keyword_gaps.map((kw: any, i: number) => (
                    <div key={i} className="flex items-center justify-between rounded-md bg-muted/40 px-2 py-1.5">
                      <span className="text-xs font-medium">{kw.keyword}</span>
                      <div className="flex gap-1">
                        <Badge variant="outline" className="text-[8px]">{kw.difficulty}</Badge>
                        <Badge variant="outline" className={cn("text-[8px]", kw.potential_impact === 'high' ? 'text-green-500' : '')}>{kw.potential_impact} impact</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {audit.search_analysis.content_gaps?.length > 0 && (
                <div className="space-y-1">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Content Gaps</p>
                  {audit.search_analysis.content_gaps.map((cg: any, i: number) => (
                    <div key={i} className="flex items-center justify-between rounded-md bg-muted/40 px-2 py-1.5">
                      <span className="text-xs">{cg.topic}</span>
                      <Badge variant="outline" className="text-[8px]">{cg.content_type}</Badge>
                    </div>
                  ))}
                </div>
              )}
              {audit.search_analysis.strengths?.length > 0 && (
                <div className="space-y-1">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Strengths</p>
                  {audit.search_analysis.strengths.map((s: string, i: number) => (
                    <div key={i} className="flex items-start gap-1.5 text-[11px] text-muted-foreground">
                      <CheckCircle2 className="h-3 w-3 mt-0.5 text-green-500 shrink-0" />{s}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </CollapsibleContent>
      </Collapsible>

      {/* AI Platform Analysis */}
      <Collapsible open={expandedSections.ai} onOpenChange={() => toggleSection('ai')}>
        <CollapsibleTrigger className="flex w-full items-center justify-between py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors">
          <span className="flex items-center gap-1.5"><Bot className="h-3.5 w-3.5" /> AI Platform Presence</span>
          {expandedSections.ai ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-3 pt-1">
          {audit.ai_platform_analysis && (
            <>
              <p className="text-xs text-muted-foreground">{audit.ai_platform_analysis.overall_readiness}</p>
              {audit.ai_platform_analysis.platforms?.map((p: any, i: number) => (
                <div key={i} className="rounded-md border p-2 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium">{p.platform}</span>
                    <Badge variant="outline" className={cn("text-[9px]",
                      p.presence_level === 'strong' ? 'text-green-500' :
                      p.presence_level === 'moderate' ? 'text-amber-500' :
                      p.presence_level === 'minimal' ? 'text-orange-500' : 'text-destructive'
                    )}>{p.presence_level}</Badge>
                  </div>
                  {p.issues?.length > 0 && p.issues.map((issue: string, j: number) => (
                    <p key={j} className="text-[10px] text-muted-foreground flex items-start gap-1">
                      <AlertTriangle className="h-2.5 w-2.5 mt-0.5 text-amber-500 shrink-0" />{issue}
                    </p>
                  ))}
                  {p.improvements?.length > 0 && p.improvements.map((imp: string, j: number) => (
                    <p key={j} className="text-[10px] text-muted-foreground flex items-start gap-1">
                      <TrendingUp className="h-2.5 w-2.5 mt-0.5 text-primary shrink-0" />{imp}
                    </p>
                  ))}
                </div>
              ))}
              {audit.ai_platform_analysis.knowledge_graph_status && (
                <p className="text-[10px] text-muted-foreground">
                  <strong>Knowledge Graph:</strong> {audit.ai_platform_analysis.knowledge_graph_status}
                </p>
              )}
            </>
          )}
        </CollapsibleContent>
      </Collapsible>

      {/* Social/Media Analysis */}
      <Collapsible open={expandedSections.social} onOpenChange={() => toggleSection('social')}>
        <CollapsibleTrigger className="flex w-full items-center justify-between py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors">
          <span className="flex items-center gap-1.5"><Share2 className="h-3.5 w-3.5" /> Social & Media</span>
          {expandedSections.social ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-3 pt-1">
          {audit.social_media_analysis && (
            <>
              <p className="text-xs text-muted-foreground">{audit.social_media_analysis.coverage_assessment}</p>
              {audit.social_media_analysis.platform_gaps?.map((pg: any, i: number) => (
                <div key={i} className="flex items-center justify-between rounded-md bg-muted/40 px-2 py-1.5">
                  <div className="space-y-0.5">
                    <span className="text-xs font-medium">{pg.platform}</span>
                    <p className="text-[10px] text-muted-foreground">{pg.opportunity}</p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Badge variant="outline" className={cn("text-[8px]",
                      pg.status === 'missing' ? 'text-destructive' :
                      pg.status === 'inactive' ? 'text-orange-500' :
                      pg.status === 'underperforming' ? 'text-amber-500' : 'text-green-500'
                    )}>{pg.status}</Badge>
                  </div>
                </div>
              ))}
            </>
          )}
        </CollapsibleContent>
      </Collapsible>

      {/* Top Recommendations */}
      <Collapsible open={expandedSections.recommendations} onOpenChange={() => toggleSection('recommendations')}>
        <CollapsibleTrigger className="flex w-full items-center justify-between py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors">
          <span className="flex items-center gap-1.5"><TrendingUp className="h-3.5 w-3.5" /> Recommendations ({sortedRecs.length})</span>
          {expandedSections.recommendations ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-2 pt-1">
          {sortedRecs.map((rec, i) => (
            <div key={i} className="flex items-start gap-2 rounded-md border p-2">
              <div className="flex items-center justify-center h-5 w-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold shrink-0">
                {rec.priority}
              </div>
              <div className="space-y-0.5 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold">{rec.title}</span>
                  <Badge variant="outline" className={cn("text-[8px]", rec.impact === 'high' ? 'text-green-500' : '')}>{rec.impact} impact</Badge>
                </div>
                <p className="text-[10px] text-muted-foreground">{rec.description}</p>
              </div>
            </div>
          ))}
        </CollapsibleContent>
      </Collapsible>

      {/* Re-run */}
      {isAdmin && (
        <div className="pt-2">
          <Button onClick={() => runAudit(websites, socialProfiles)} disabled={isAnalyzing} size="sm" variant="outline" className="w-full gap-1.5 text-xs">
            {isAnalyzing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Radar className="h-3.5 w-3.5" />}
            {isAnalyzing ? 'Analyzing...' : 'Re-run Visibility Audit'}
          </Button>
          {audit.completed_at && (
            <p className="text-[9px] text-muted-foreground text-center mt-1">
              Last audit: {new Date(audit.completed_at).toLocaleDateString()}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
