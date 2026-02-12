import { useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  Shield,
  Eye,
  Zap,
  Globe,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  ChevronDown,
  ChevronRight,
  Target,
  Accessibility,
  Search,
  ArrowUpRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AnalysisSection {
  score: number;
  findings: string[];
  recommendations: string[];
}

interface PriorityAction {
  action: string;
  impact: string;
  effort: string;
}

interface CompetitorComparison {
  competitor: string;
  strengths: string[];
  weaknesses: string[];
}

interface WebsiteReport {
  overallScore: number;
  grade: string;
  summary: string;
  sections: Record<string, AnalysisSection>;
  priorityActions: PriorityAction[];
  competitorComparison: CompetitorComparison[];
  industryBenchmarks?: {
    averageScore: number;
    topPerformerScore: number;
    positionPercentile: number;
  };
}

interface WebsiteAnalysisCardProps {
  websiteUrl: string;
  websiteLabel: string;
  entityName?: string;
  industry?: string;
  brandContext?: {
    colors?: string[];
    archetype?: string;
    mission?: string;
    tagline?: string;
    competitors?: string[];
  };
}

const SECTION_META: Record<string, { label: string; icon: typeof BarChart3 }> = {
  brandConsistency: { label: 'Brand Consistency', icon: Eye },
  userExperience: { label: 'User Experience', icon: Target },
  contentQuality: { label: 'Content Quality', icon: FileText },
  seoHealth: { label: 'SEO Health', icon: Search },
  performanceInsights: { label: 'Performance', icon: Zap },
  competitivePosition: { label: 'Competitive Position', icon: TrendingUp },
  industryTrends: { label: 'Industry Trends', icon: Globe },
  technicalAudit: { label: 'Technical Audit', icon: Shield },
  accessibilityCompliance: { label: 'Accessibility', icon: Accessibility },
  conversionOptimization: { label: 'Conversion', icon: BarChart3 },
};

const getScoreColor = (score: number) => {
  if (score >= 80) return 'text-green-500';
  if (score >= 60) return 'text-yellow-500';
  return 'text-red-500';
};

const getScoreBg = (score: number) => {
  if (score >= 80) return 'bg-green-500/10 border-green-500/20';
  if (score >= 60) return 'bg-yellow-500/10 border-yellow-500/20';
  return 'bg-red-500/10 border-red-500/20';
};

const getGradeBg = (grade: string) => {
  if (grade === 'A') return 'bg-green-500';
  if (grade === 'B') return 'bg-blue-500';
  if (grade === 'C') return 'bg-yellow-500';
  if (grade === 'D') return 'bg-orange-500';
  return 'bg-red-500';
};

const getImpactBadge = (impact: string) => {
  if (impact === 'high') return 'bg-red-500/10 text-red-600 border-red-500/20';
  if (impact === 'medium') return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20';
  return 'bg-green-500/10 text-green-600 border-green-500/20';
};

export const WebsiteAnalysisCard = ({
  websiteUrl,
  websiteLabel,
  entityName,
  industry,
  brandContext,
}: WebsiteAnalysisCardProps) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [report, setReport] = useState<WebsiteReport | null>(null);
  const [showReport, setShowReport] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  const runAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('website-analysis', {
        body: { websiteUrl, entityName, industry, brandContext },
      });

      if (error) throw new Error(error.message);
      if (!data?.report) throw new Error('No report returned');

      setReport(data.report);
      setShowReport(true);
      toast.success('Website analysis complete!');
    } catch (err) {
      console.error('Website analysis error:', err);
      toast.error(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const toggleSection = (key: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  return (
    <>
      {/* Analysis Trigger Card */}
      <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
        <div className="aspect-video bg-gradient-to-br from-primary/5 via-accent/5 to-primary/10 flex flex-col items-center justify-center gap-3 p-4">
          {report ? (
            <div className="text-center space-y-2">
              <div className={cn('inline-flex items-center justify-center w-14 h-14 rounded-full text-2xl font-bold text-white', getGradeBg(report.grade))}>
                {report.grade}
              </div>
              <div className={cn('text-2xl font-bold', getScoreColor(report.overallScore))}>
                {report.overallScore}/100
              </div>
              <p className="text-xs text-muted-foreground">Site Score</p>
            </div>
          ) : (
            <>
              <BarChart3 className="h-10 w-10 text-primary/60" />
              <p className="text-sm font-medium text-foreground">Site Analysis</p>
              <p className="text-xs text-muted-foreground text-center">
                AI-powered audit report
              </p>
            </>
          )}
        </div>
        <div className="p-4 space-y-3">
          <h3 className="font-medium text-foreground text-sm truncate">
            {websiteLabel} Analysis
          </h3>
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={runAnalysis}
              disabled={isAnalyzing}
              className="flex-1 gap-2"
            >
              {isAnalyzing ? (
                <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Analyzing...</>
              ) : report ? (
                <><Zap className="h-3.5 w-3.5" /> Re-Analyze</>
              ) : (
                <><BarChart3 className="h-3.5 w-3.5" /> Run Analysis</>
              )}
            </Button>
            {report && (
              <Button size="sm" variant="outline" onClick={() => setShowReport(true)}>
                <FileText className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Full Report Dialog */}
      <Dialog open={showReport} onOpenChange={setShowReport}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 gap-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b">
            <DialogTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Website Analysis Report
            </DialogTitle>
            <DialogDescription className="flex items-center gap-2">
              <a href={websiteUrl} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline inline-flex items-center gap-1">
                {websiteUrl} <ArrowUpRight className="h-3 w-3" />
              </a>
            </DialogDescription>
          </DialogHeader>

          {report && (
            <ScrollArea className="flex-1 overflow-auto">
              <div className="p-6 space-y-6">
                {/* Executive Summary */}
                <div className="flex items-start gap-5">
                  <div className={cn('flex-shrink-0 w-20 h-20 rounded-2xl flex flex-col items-center justify-center border', getScoreBg(report.overallScore))}>
                    <span className={cn('text-3xl font-bold', getScoreColor(report.overallScore))}>
                      {report.overallScore}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-medium">/ 100</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={cn('text-white', getGradeBg(report.grade))}>
                        Grade {report.grade}
                      </Badge>
                      <span className="text-sm text-muted-foreground">{websiteLabel}</span>
                    </div>
                    <p className="text-sm text-foreground">{report.summary}</p>
                  </div>
                </div>

                {/* Score Overview Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {Object.entries(report.sections || {}).map(([key, section]) => {
                    const meta = SECTION_META[key];
                    if (!meta || !section) return null;
                    const Icon = meta.icon;
                    return (
                      <button
                        key={key}
                        onClick={() => toggleSection(key)}
                        className={cn(
                          'p-3 rounded-lg border text-center transition-all hover:shadow-sm',
                          expandedSections.has(key) ? 'bg-primary/5 border-primary/20' : 'bg-card border-border'
                        )}
                      >
                        <Icon className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                        <div className={cn('text-lg font-bold', getScoreColor(section.score))}>{section.score}</div>
                        <div className="text-[10px] text-muted-foreground leading-tight">{meta.label}</div>
                      </button>
                    );
                  })}
                </div>

                {/* Detailed Section Reports */}
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-foreground">Detailed Findings</h3>
                  {Object.entries(report.sections || {}).map(([key, section]) => {
                    const meta = SECTION_META[key];
                    if (!meta || !section) return null;
                    const Icon = meta.icon;
                    const isExpanded = expandedSections.has(key);
                    return (
                      <Collapsible key={key} open={isExpanded} onOpenChange={() => toggleSection(key)}>
                        <CollapsibleTrigger className="w-full flex items-center gap-3 p-3 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors">
                          <Icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <span className="text-sm font-medium flex-1 text-left">{meta.label}</span>
                          <div className="flex items-center gap-2">
                            <Progress value={section.score} className="w-16 h-1.5" />
                            <span className={cn('text-sm font-bold w-8 text-right', getScoreColor(section.score))}>
                              {section.score}
                            </span>
                            {isExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                          </div>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="px-3 pt-2 pb-3">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-7">
                            <div className="space-y-2">
                              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                                <AlertTriangle className="h-3 w-3" /> Findings
                              </h4>
                              <ul className="space-y-1.5">
                                {(Array.isArray(section.findings) ? section.findings : []).map((f, i) => (
                                  <li key={i} className="text-xs text-foreground flex gap-2">
                                    <span className="text-muted-foreground mt-0.5">•</span>
                                    <span>{f}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                            <div className="space-y-2">
                              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                                <CheckCircle2 className="h-3 w-3" /> Recommendations
                              </h4>
                              <ul className="space-y-1.5">
                                {(Array.isArray(section.recommendations) ? section.recommendations : []).map((r, i) => (
                                  <li key={i} className="text-xs text-foreground flex gap-2">
                                    <span className="text-green-500 mt-0.5">✓</span>
                                    <span>{r}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    );
                  })}
                </div>

                {/* Priority Actions */}
                {Array.isArray(report.priorityActions) && report.priorityActions.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-foreground">Priority Actions</h3>
                    <div className="space-y-2">
                      {report.priorityActions.map((action, i) => (
                        <div key={i} className="flex items-start gap-3 p-3 rounded-lg border border-border bg-card">
                          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">
                            {i + 1}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-foreground">{action.action}</p>
                          </div>
                          <div className="flex gap-1.5 flex-shrink-0">
                            <Badge variant="outline" className={cn('text-[10px]', getImpactBadge(action.impact))}>
                              {action.impact} impact
                            </Badge>
                            <Badge variant="outline" className="text-[10px]">
                              {action.effort} effort
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Competitor Comparison */}
                {Array.isArray(report.competitorComparison) && report.competitorComparison.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-foreground">Competitor Comparison</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {report.competitorComparison.map((comp, i) => (
                        <div key={i} className="p-3 rounded-lg border border-border bg-card space-y-2">
                          <h4 className="text-sm font-medium text-foreground">{comp.competitor}</h4>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <p className="text-[10px] font-semibold text-green-600 uppercase">Strengths</p>
                              <ul className="mt-1 space-y-0.5">
                                {(Array.isArray(comp.strengths) ? comp.strengths : []).map((s, j) => (
                                  <li key={j} className="text-xs text-muted-foreground">+ {s}</li>
                                ))}
                              </ul>
                            </div>
                            <div>
                              <p className="text-[10px] font-semibold text-red-600 uppercase">Weaknesses</p>
                              <ul className="mt-1 space-y-0.5">
                                {(Array.isArray(comp.weaknesses) ? comp.weaknesses : []).map((w, j) => (
                                  <li key={j} className="text-xs text-muted-foreground">− {w}</li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Industry Benchmarks */}
                {report.industryBenchmarks && (
                  <div className="p-4 rounded-lg border border-border bg-muted/30 space-y-3">
                    <h3 className="text-sm font-semibold text-foreground">Industry Benchmarks</h3>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="text-lg font-bold text-foreground">{report.industryBenchmarks.averageScore}</div>
                        <div className="text-[10px] text-muted-foreground">Industry Avg</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-foreground">{report.industryBenchmarks.topPerformerScore}</div>
                        <div className="text-[10px] text-muted-foreground">Top Performer</div>
                      </div>
                      <div>
                        <div className={cn('text-lg font-bold', getScoreColor(report.industryBenchmarks.positionPercentile))}>
                          {report.industryBenchmarks.positionPercentile}th
                        </div>
                        <div className="text-[10px] text-muted-foreground">Your Percentile</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
