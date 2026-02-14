/**
 * Bias Awareness Admin Panel
 * Organization-wide overview of bias & inclusion scores across all entities
 */

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import {
  Shield,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  RefreshCw,
  BarChart3,
  Eye,
  MessageSquare,
  Accessibility,
  Brain,
  ChevronDown,
  ChevronRight,
  Users,
  Info,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { format } from 'date-fns';

interface ScanRow {
  id: string;
  entity_id: string;
  entity_type: string;
  entity_name: string;
  inclusion_score: number;
  language_score: number;
  visual_score: number;
  accessibility_score: number;
  ai_governance_score: number;
  status: string;
  completed_at: string | null;
  created_at: string;
  findings: any[];
  recommendations: any[];
  language_analysis: Record<string, unknown> | null;
  visual_analysis: Record<string, unknown> | null;
  accessibility_analysis: Record<string, unknown> | null;
  ai_governance_analysis: Record<string, unknown> | null;
  persona_coverage: Record<string, unknown> | null;
}

interface OrgStats {
  totalScans: number;
  completedScans: number;
  avgScore: number;
  entitiesScanned: number;
  scoreDistribution: { excellent: number; good: number; needsWork: number; critical: number };
  dimensionAverages: { language: number; visual: number; accessibility: number; governance: number };
  recentScans: ScanRow[];
}

const scoreColor = (score: number) => {
  if (score >= 90) return 'text-emerald-500';
  if (score >= 80) return 'text-green-500';
  if (score >= 70) return 'text-amber-500';
  if (score >= 60) return 'text-orange-500';
  return 'text-destructive';
};

const scoreBadge = (score: number) => {
  if (score >= 90) return <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 text-[10px]">Exemplary</Badge>;
  if (score >= 80) return <Badge className="bg-green-500/10 text-green-600 border-green-500/30 text-[10px]">Strong</Badge>;
  if (score >= 70) return <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/30 text-[10px]">Developing</Badge>;
  if (score >= 60) return <Badge className="bg-orange-500/10 text-orange-600 border-orange-500/30 text-[10px]">Needs Attention</Badge>;
  return <Badge variant="destructive" className="text-[10px]">Critical</Badge>;
};

const entityTypeBadge = (type: string) => {
  switch (type) {
    case 'brand': return <Badge variant="outline" className="text-[9px]">Brand</Badge>;
    case 'product': return <Badge variant="outline" className="text-[9px]">Product</Badge>;
    case 'event': return <Badge variant="outline" className="text-[9px]">Event</Badge>;
    default: return <Badge variant="outline" className="text-[9px]">{type}</Badge>;
  }
};

const severityBadge = (severity: string) => {
  switch (severity) {
    case 'critical': return <Badge variant="destructive" className="text-[9px] px-1.5 py-0">Critical</Badge>;
    case 'high': return <Badge className="bg-orange-500/10 text-orange-600 border-orange-500/30 text-[9px] px-1.5 py-0">High</Badge>;
    case 'medium': return <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/30 text-[9px] px-1.5 py-0">Medium</Badge>;
    default: return <Badge variant="secondary" className="text-[9px] px-1.5 py-0">Low</Badge>;
  }
};

const dimensionIcon = (dim: string) => {
  switch (dim) {
    case 'language': return <MessageSquare className="h-3 w-3" />;
    case 'visual': return <Eye className="h-3 w-3" />;
    case 'accessibility': return <Accessibility className="h-3 w-3" />;
    case 'ai_governance': return <Brain className="h-3 w-3" />;
    default: return <Info className="h-3 w-3" />;
  }
};

const safeArr = (v: unknown): string[] => Array.isArray(v) ? v.filter(x => typeof x === 'string') : [];

const ScanExpandedDetails = ({ scan }: { scan: ScanRow }) => {
  const findings = Array.isArray(scan.findings) ? scan.findings : [];
  const recommendations = Array.isArray(scan.recommendations) ? scan.recommendations : [];
  const persona = (scan.persona_coverage || {}) as Record<string, unknown>;
  const dimensions = [
    { label: 'Language & Messaging', score: scan.language_score, analysis: scan.language_analysis || {}, icon: <MessageSquare className="h-3.5 w-3.5 text-blue-500" /> },
    { label: 'Visual Representation', score: scan.visual_score, analysis: scan.visual_analysis || {}, icon: <Eye className="h-3.5 w-3.5 text-purple-500" /> },
    { label: 'Accessibility (WCAG)', score: scan.accessibility_score, analysis: scan.accessibility_analysis || {}, icon: <Accessibility className="h-3.5 w-3.5 text-green-500" /> },
    { label: 'AI Governance', score: scan.ai_governance_score, analysis: scan.ai_governance_analysis || {}, icon: <Brain className="h-3.5 w-3.5 text-orange-500" /> },
  ];

  const personaDimensions = ['mobility', 'vision', 'hearing', 'speech', 'cognitive'];
  const personaLevels = ['permanent', 'temporary', 'situational'];

  return (
    <div className="px-4 pb-4 space-y-4">
      {/* Dimension Breakdowns */}
      <div>
        <h4 className="text-xs font-semibold mb-2">Dimension Analysis</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {dimensions.map(dim => {
            const a = dim.analysis as Record<string, unknown>;
            const strengths = safeArr(a.strengths || a.wcag_strengths || a.diversity_signals || a.safeguards_detected);
            const issues = safeArr(a.issues || a.wcag_gaps || a.gaps || a.risks || a.stereotyping_risks);
            return (
              <div key={dim.label} className="p-3 rounded-lg border bg-muted/20 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {dim.icon}
                    <span className="text-xs font-medium">{dim.label}</span>
                  </div>
                  <span className={`text-sm font-bold ${scoreColor(Number(dim.score))}`}>{Math.round(Number(dim.score))}</span>
                </div>
                {strengths.length > 0 && (
                  <div>
                    <p className="text-[9px] font-medium text-muted-foreground mb-0.5">Strengths</p>
                    {strengths.slice(0, 3).map((s, i) => (
                      <div key={i} className="flex items-start gap-1 text-[10px] mb-0.5">
                        <CheckCircle2 className="h-3 w-3 text-green-500 shrink-0 mt-0.5" />
                        <span>{s}</span>
                      </div>
                    ))}
                  </div>
                )}
                {issues.length > 0 && (
                  <div>
                    <p className="text-[9px] font-medium text-muted-foreground mb-0.5">Issues</p>
                    {issues.slice(0, 3).map((item, i) => (
                      <div key={i} className="flex items-start gap-1 text-[10px] mb-0.5">
                        <AlertTriangle className="h-3 w-3 text-amber-500 shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                )}
                {strengths.length === 0 && issues.length === 0 && (
                  <p className="text-[10px] text-muted-foreground italic">No detailed analysis available</p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Findings */}
      {findings.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold mb-2">Findings ({findings.length})</h4>
          <div className="space-y-1.5">
            {findings.map((finding, i) => (
              <div key={i} className="flex items-start gap-2 p-2 rounded border bg-card text-[10px]">
                {dimensionIcon(finding.dimension)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-medium">{finding.title}</span>
                    {severityBadge(finding.severity)}
                  </div>
                  <p className="text-muted-foreground mt-0.5">{finding.description}</p>
                  {finding.recommendation && (
                    <p className="mt-1 text-primary/80"><span className="font-medium">Action:</span> {finding.recommendation}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold mb-2">Recommendations ({recommendations.length})</h4>
          <div className="space-y-1.5">
            {recommendations.map((rec, i) => (
              <div key={i} className="flex items-start gap-2 p-2 rounded border bg-card text-[10px]">
                <Badge variant="outline" className="text-[8px] shrink-0 capitalize">{rec.priority}</Badge>
                <div>
                  <p className="font-medium">{rec.action}</p>
                  <p className="text-muted-foreground capitalize">{rec.dimension?.replace('_', ' ')} · {rec.impact} impact</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Persona Spectrum */}
      {Object.keys(persona).length > 0 && (
        <div>
          <h4 className="text-xs font-semibold mb-2 flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5" />
            Persona Spectrum Coverage
          </h4>
          <div className="p-3 rounded-lg border bg-muted/20 space-y-1.5">
            <div className="grid grid-cols-4 gap-1 text-[9px] text-muted-foreground font-medium">
              <div />
              {personaLevels.map(l => <div key={l} className="text-center capitalize">{l}</div>)}
            </div>
            {personaDimensions.map(dim => {
              const dimData = (persona[dim] as Record<string, boolean>) || {};
              return (
                <div key={dim} className="grid grid-cols-4 gap-1 items-center">
                  <div className="text-[10px] capitalize font-medium">{dim}</div>
                  {personaLevels.map(level => (
                    <div key={level} className="flex justify-center">
                      <div className={`w-4 h-4 rounded-sm border ${dimData[level] ? 'bg-primary/20 border-primary/50' : 'bg-muted/30 border-border'}`}>
                        {dimData[level] && <CheckCircle2 className="h-4 w-4 text-primary" />}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}
            {persona.coverage_percentage != null && (
              <div className="flex items-center justify-between text-xs mt-2 pt-2 border-t">
                <span className="text-muted-foreground">Coverage</span>
                <span className={`font-semibold ${scoreColor(Number(persona.coverage_percentage))}`}>
                  {Math.round(Number(persona.coverage_percentage))}%
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const ExpandableEntityRow = ({ scan }: { scan: ScanRow }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <TableRow className="cursor-pointer hover:bg-muted/50" onClick={() => setIsOpen(!isOpen)}>
        <TableCell className="w-8 px-2">
          {isOpen ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
        </TableCell>
        <TableCell className="text-xs font-medium max-w-[180px] truncate">{scan.entity_name}</TableCell>
        <TableCell>{entityTypeBadge(scan.entity_type)}</TableCell>
        <TableCell className="text-center">
          <span className={`text-xs font-bold ${scoreColor(Number(scan.inclusion_score))}`}>
            {Math.round(Number(scan.inclusion_score))}
          </span>
        </TableCell>
        <TableCell className="text-center">
          <span className={`text-xs ${scoreColor(Number(scan.language_score))}`}>{Math.round(Number(scan.language_score))}</span>
        </TableCell>
        <TableCell className="text-center">
          <span className={`text-xs ${scoreColor(Number(scan.visual_score))}`}>{Math.round(Number(scan.visual_score))}</span>
        </TableCell>
        <TableCell className="text-center">
          <span className={`text-xs ${scoreColor(Number(scan.accessibility_score))}`}>{Math.round(Number(scan.accessibility_score))}</span>
        </TableCell>
        <TableCell className="text-center">
          <span className={`text-xs ${scoreColor(Number(scan.ai_governance_score))}`}>{Math.round(Number(scan.ai_governance_score))}</span>
        </TableCell>
        <TableCell>{scoreBadge(Number(scan.inclusion_score))}</TableCell>
        <TableCell className="text-[10px] text-muted-foreground">
          {scan.completed_at ? format(new Date(scan.completed_at), 'MMM d, yyyy') : '—'}
        </TableCell>
      </TableRow>
      {isOpen && (
        <tr>
          <td colSpan={10} className="p-0 border-b">
            <div className="bg-muted/10 border-t">
              <ScanExpandedDetails scan={scan} />
            </div>
          </td>
        </tr>
      )}
    </>
  );
};

export const BiasAwarenessAdminPanel = () => {
  const { organization } = useOrganization();
  const [stats, setStats] = useState<OrgStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    if (!organization?.id) return;
    setIsLoading(true);

    try {
      const { data, error } = await supabase
        .from('bias_awareness_scans')
        .select('*')
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const scans = (data || []) as unknown as ScanRow[];
      const completed = scans.filter(s => s.status === 'completed');

      // Deduplicate: latest per entity
      const latestByEntity = new Map<string, ScanRow>();
      for (const scan of completed) {
        if (!latestByEntity.has(scan.entity_id)) {
          latestByEntity.set(scan.entity_id, scan);
        }
      }
      const latestScans = Array.from(latestByEntity.values());

      const scores = latestScans.map(s => Number(s.inclusion_score)).filter(n => !isNaN(n));
      const avg = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;

      const langScores = latestScans.map(s => Number(s.language_score)).filter(n => !isNaN(n));
      const visScores = latestScans.map(s => Number(s.visual_score)).filter(n => !isNaN(n));
      const accScores = latestScans.map(s => Number(s.accessibility_score)).filter(n => !isNaN(n));
      const govScores = latestScans.map(s => Number(s.ai_governance_score)).filter(n => !isNaN(n));
      const avgOf = (arr: number[]) => arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

      setStats({
        totalScans: scans.length,
        completedScans: completed.length,
        avgScore: Math.round(avg),
        entitiesScanned: latestScans.length,
        scoreDistribution: {
          excellent: scores.filter(s => s >= 90).length,
          good: scores.filter(s => s >= 70 && s < 90).length,
          needsWork: scores.filter(s => s >= 50 && s < 70).length,
          critical: scores.filter(s => s < 50).length,
        },
        dimensionAverages: {
          language: Math.round(avgOf(langScores)),
          visual: Math.round(avgOf(visScores)),
          accessibility: Math.round(avgOf(accScores)),
          governance: Math.round(avgOf(govScores)),
        },
        recentScans: latestScans.slice(0, 20),
      });
    } catch (err) {
      console.error('[BiasAdmin] Fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [organization?.id]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const s = stats;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-bold">Bias Awareness & Inclusion</h2>
            <p className="text-sm text-muted-foreground">
              Organization-wide inclusion scores · WCAG 2.2 · WFA Framework · Persona Spectrum
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={fetchStats} className="gap-1.5">
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh
        </Button>
      </div>

      {!s || s.entitiesScanned === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <Shield className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
            <p className="text-base font-medium">No bias awareness scans yet</p>
            <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
              Open any brand, product, or event editor → Intelligence Panel → Bias Awareness section to run the first scan.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center gap-2 mb-1">
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">Avg Inclusion Score</p>
                </div>
                <p className={`text-2xl font-bold ${scoreColor(s.avgScore)}`}>{s.avgScore}<span className="text-sm font-normal text-muted-foreground">/100</span></p>
                <Progress value={s.avgScore} className="h-1.5 mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">Entities Scanned</p>
                </div>
                <p className="text-2xl font-bold">{s.entitiesScanned}</p>
                <p className="text-[10px] text-muted-foreground mt-1">{s.totalScans} total scans run</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="h-4 w-4 text-emerald-500" />
                  <p className="text-xs text-muted-foreground">Strong / Exemplary</p>
                </div>
                <p className="text-2xl font-bold text-emerald-600">{s.scoreDistribution.excellent + s.scoreDistribution.good}</p>
                <p className="text-[10px] text-muted-foreground mt-1">entities scoring 70+</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                  <p className="text-xs text-muted-foreground">Needs Attention</p>
                </div>
                <p className="text-2xl font-bold text-destructive">{s.scoreDistribution.needsWork + s.scoreDistribution.critical}</p>
                <p className="text-[10px] text-muted-foreground mt-1">entities scoring below 70</p>
              </CardContent>
            </Card>
          </div>

          {/* Dimension Averages */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Dimension Averages</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Language & Messaging', score: s.dimensionAverages.language, icon: <MessageSquare className="h-4 w-4 text-blue-500" /> },
                  { label: 'Visual Representation', score: s.dimensionAverages.visual, icon: <Eye className="h-4 w-4 text-purple-500" /> },
                  { label: 'Accessibility (WCAG)', score: s.dimensionAverages.accessibility, icon: <Accessibility className="h-4 w-4 text-green-500" /> },
                  { label: 'AI Governance', score: s.dimensionAverages.governance, icon: <Brain className="h-4 w-4 text-orange-500" /> },
                ].map(dim => (
                  <div key={dim.label} className="flex items-center gap-3 p-3 rounded-lg border bg-card">
                    {dim.icon}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{dim.label}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Progress value={dim.score} className="h-1.5 flex-1" />
                        <span className={`text-sm font-bold ${scoreColor(dim.score)}`}>{dim.score}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Entity Scores Table */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Entity Scores</CardTitle>
              <p className="text-[10px] text-muted-foreground">Click a row to expand full scan details</p>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="max-h-[600px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs w-8" />
                      <TableHead className="text-xs">Entity</TableHead>
                      <TableHead className="text-xs">Type</TableHead>
                      <TableHead className="text-xs text-center">Inclusion</TableHead>
                      <TableHead className="text-xs text-center">Language</TableHead>
                      <TableHead className="text-xs text-center">Visual</TableHead>
                      <TableHead className="text-xs text-center">WCAG</TableHead>
                      <TableHead className="text-xs text-center">AI Gov</TableHead>
                      <TableHead className="text-xs">Status</TableHead>
                      <TableHead className="text-xs">Scanned</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {s.recentScans.map(scan => (
                      <ExpandableEntityRow key={scan.id} scan={scan} />
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};
