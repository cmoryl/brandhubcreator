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
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="max-h-[400px]">
                <Table>
                  <TableHeader>
                    <TableRow>
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
                      <TableRow key={scan.id}>
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
