import { useState } from 'react';
import { ClipboardCheck, Loader2, TrendingUp, TrendingDown, AlertCircle, CheckCircle2, X, Scale, Languages, Eye, Accessibility, Globe, ShieldCheck, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { BaseGuide } from '@/types/brand';
import { toast } from 'sonner';

interface AuditCategory {
  name: string;
  score: number;
  findings: string[];
  recommendations: string[];
}

interface BiasSubDimension {
  score: number;
  findings: string[];
  recommendations: string[];
}

interface BiasReview {
  score: number;
  languageInclusivity: BiasSubDimension;
  visualRepresentation: BiasSubDimension;
  culturalSensitivity: BiasSubDimension;
  accessibilityConsiderations: BiasSubDimension;
  regulatoryCompliance?: BiasSubDimension;
  overallFindings: string[];
  overallRecommendations: string[];
}

interface AuditResult {
  overallScore: number;
  categories: AuditCategory[];
  biasReview?: BiasReview;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  actionItems: string[];
}

interface BrandAuditButtonProps {
  brand: BaseGuide;
}

export const BrandAuditButton = ({ brand }: BrandAuditButtonProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [auditResult, setAuditResult] = useState<AuditResult | null>(null);

  const pollJob = async (jobId: string): Promise<AuditResult> => {
    const maxAttempts = 60;
    for (let i = 0; i < maxAttempts; i++) {
      await new Promise(r => setTimeout(r, 3000));
      const { data, error } = await supabase
        .from('brand_intelligence_jobs')
        .select('status, result, error_message, progress')
        .eq('id', jobId)
        .single();

      if (error) throw error;
      if (data.status === 'completed' && data.result) {
        const result = data.result as Record<string, unknown>;
        return result.audit as AuditResult;
      }
      if (data.status === 'failed') {
        throw new Error(data.error_message || 'Audit failed');
      }
      // If progress hasn't advanced past 60 for 90 seconds, the worker likely timed out
      if (i > 30 && (data.progress ?? 0) <= 60) {
        throw new Error('Audit worker appears stuck. Please try again.');
      }
    }
    throw new Error('Audit timed out — please try again');
  };

  const runAudit = async () => {
    setIsLoading(true);
    setIsOpen(true);
    setAuditResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('brand-audit', {
        body: { brandId: brand.id, entityType: brand.type || 'brand' }
      });

      if (error) throw error;

      if (data?.jobId) {
        const audit = await pollJob(data.jobId);
        setAuditResult(audit);
        toast.success('Brand audit complete!');
      } else {
        throw new Error('No job created');
      }
    } catch (error) {
      console.error('Audit error:', error);
      toast.error('Failed to run brand audit. Please try again.');
      setIsOpen(false);
    } finally {
      setIsLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 dark:text-green-400';
    if (score >= 60) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 90) return 'Excellent';
    if (score >= 80) return 'Very Good';
    if (score >= 70) return 'Good';
    if (score >= 60) return 'Fair';
    if (score >= 50) return 'Needs Work';
    return 'Critical';
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={runAudit}
        disabled={isLoading}
        className="gap-2"
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <ClipboardCheck className="h-4 w-4" />
        )}
        Audit
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] p-0">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle className="flex items-center gap-2 text-xl">
              <ClipboardCheck className="h-5 w-5 text-accent" />
              Brand Cohesion Audit
            </DialogTitle>
            <div className="flex items-center gap-2">
              <DialogDescription className="flex-1">
                AI-powered analysis of {brand.hero.name}
              </DialogDescription>
              {auditResult && (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 shrink-0"
                  onClick={() => {
                    import('@/lib/exportHtml').then(({ exportBrandAuditHtml }) => {
                      exportBrandAuditHtml(auditResult, { brandName: brand.hero.name });
                    });
                  }}
                >
                  <Download className="h-3.5 w-3.5" />
                  Export
                </Button>
              )}
            </div>
          </DialogHeader>

          <ScrollArea className="max-h-[calc(90vh-120px)]">
            <div className="p-6 pt-4 space-y-6">
              {isLoading && !auditResult && (
                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                  <Loader2 className="h-12 w-12 animate-spin text-accent" />
                  <p className="text-muted-foreground animate-pulse">Analyzing brand cohesion...</p>
                  <p className="text-xs text-muted-foreground">This may take a few moments</p>
                </div>
              )}

              {auditResult && (
                <div className="space-y-6 animate-fade-in">
                  {/* Overall Score */}
                  <Card className="border-2">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Overall Cohesion Score</p>
                          <div className="flex items-baseline gap-2">
                            <span className={`text-5xl font-bold ${getScoreColor(auditResult.overallScore)}`}>
                              {auditResult.overallScore}
                            </span>
                            <span className="text-2xl text-muted-foreground">/100</span>
                          </div>
                        </div>
                        <Badge className={`${getScoreBg(auditResult.overallScore)} text-primary-foreground text-lg px-4 py-2`}>
                          {getScoreLabel(auditResult.overallScore)}
                        </Badge>
                      </div>
                      <Progress value={auditResult.overallScore} className="h-3" />
                    </CardContent>
                  </Card>

                  {/* Summary */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Executive Summary</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground">{auditResult.summary}</p>
                    </CardContent>
                  </Card>

                  {/* Strengths & Weaknesses */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card className="border-green-200 dark:border-green-900">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2 text-green-600 dark:text-green-400">
                          <TrendingUp className="h-4 w-4" />
                          Strengths
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {auditResult.strengths.map((strength, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm">
                              <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                              <span>{strength}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>

                    <Card className="border-red-200 dark:border-red-900">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2 text-red-600 dark:text-red-400">
                          <TrendingDown className="h-4 w-4" />
                          Areas for Improvement
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {auditResult.weaknesses.map((weakness, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm">
                              <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                              <span>{weakness}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Category Breakdown */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Category Breakdown</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {auditResult.categories.map((category, i) => (
                        <div key={i}>
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium">{category.name}</span>
                            <span className={`font-bold ${getScoreColor(category.score)}`}>
                              {category.score}/100
                            </span>
                          </div>
                          <Progress value={category.score} className="h-2 mb-3" />
                          
                          {category.findings.length > 0 && (
                            <div className="mb-2">
                              <p className="text-xs text-muted-foreground mb-1">Findings:</p>
                              <ul className="text-sm space-y-1">
                                {category.findings.map((finding, j) => (
                                  <li key={j} className="text-muted-foreground">• {finding}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          
                          {category.recommendations.length > 0 && (
                            <div className="bg-accent/5 rounded-lg p-3 mt-2">
                              <p className="text-xs font-medium mb-1">Recommendations:</p>
                              <ul className="text-sm space-y-1">
                                {category.recommendations.map((rec, j) => (
                                  <li key={j}>→ {rec}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          
                          {i < auditResult.categories.length - 1 && <Separator className="mt-4" />}
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  {/* Bias & Inclusivity Review */}
                  {auditResult.biasReview && (
                    <Card className="border-violet-200 dark:border-violet-900/50">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base flex items-center gap-2">
                            <Scale className="h-4 w-4 text-violet-500" />
                            Bias & Inclusivity Review
                          </CardTitle>
                          <Badge className={`${getScoreBg(auditResult.biasReview.score)} text-primary-foreground`}>
                            {auditResult.biasReview.score}/100
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* Dimension scores */}
                        {([
                          { key: 'languageInclusivity' as const, label: 'Language Inclusivity', icon: Languages },
                          { key: 'visualRepresentation' as const, label: 'Visual Representation', icon: Eye },
                          { key: 'culturalSensitivity' as const, label: 'Cultural Sensitivity', icon: Globe },
                          { key: 'accessibilityConsiderations' as const, label: 'Accessibility', icon: Accessibility },
                          { key: 'regulatoryCompliance' as const, label: 'EAA Regulatory', icon: ShieldCheck },
                        ]).map((dim, i) => {
                          const sub = auditResult.biasReview![dim.key];
                          if (!sub) return null;
                          return (
                            <div key={dim.key}>
                              <div className="flex items-center gap-2 mb-1.5">
                                <dim.icon className="h-3.5 w-3.5 text-muted-foreground" />
                                <span className="text-sm font-medium flex-1">{dim.label}</span>
                                <span className={`text-sm font-bold ${getScoreColor(sub.score)}`}>{sub.score}/100</span>
                              </div>
                              <Progress value={sub.score} className="h-1.5 mb-2" />
                              {sub.findings?.length > 0 && (
                                <ul className="text-sm space-y-0.5 mb-1.5">
                                  {sub.findings.map((f, j) => (
                                    <li key={j} className="text-muted-foreground text-xs">• {f}</li>
                                  ))}
                                </ul>
                              )}
                              {sub.recommendations?.length > 0 && (
                                <div className="bg-violet-500/5 rounded-md p-2 mb-1">
                                  {sub.recommendations.map((r, j) => (
                                    <p key={j} className="text-xs">→ {r}</p>
                                  ))}
                                </div>
                              )}
                              {i < 3 && <Separator className="mt-3" />}
                            </div>
                          );
                        })}

                        {/* Overall bias findings */}
                        {auditResult.biasReview.overallFindings?.length > 0 && (
                          <div className="pt-2 border-t border-border/50">
                            <p className="text-xs font-semibold mb-1.5">Key Findings</p>
                            <ul className="space-y-1">
                              {auditResult.biasReview.overallFindings.map((f, i) => (
                                <li key={i} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                                  <AlertCircle className="h-3 w-3 mt-0.5 shrink-0 text-violet-500" />
                                  {f}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  <Card className="border-accent/30 bg-accent/5">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <ClipboardCheck className="h-4 w-4 text-accent" />
                        Priority Action Items
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ol className="space-y-2">
                        {auditResult.actionItems.map((item, i) => (
                          <li key={i} className="flex items-start gap-3">
                            <span className="flex items-center justify-center h-6 w-6 rounded-full bg-accent text-accent-foreground text-xs font-bold shrink-0">
                              {i + 1}
                            </span>
                            <span className="text-sm pt-0.5">{item}</span>
                          </li>
                        ))}
                      </ol>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
};
