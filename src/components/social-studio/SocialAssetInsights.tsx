/**
 * Comprehensive insights panel for social asset placements.
 * Shows Bias & Inclusion, Brand Compliance, and Engagement Prediction results.
 */
import { useState } from 'react';
import {
  ChevronDown, ChevronUp, RefreshCw, Shield, Eye, TrendingUp,
  AlertTriangle, CheckCircle2, XCircle, Clock, Sparkles, BarChart3,
  Type, FileText,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Progress } from '@/components/ui/progress';
import { SocialAssetAnalysis } from '@/hooks/useSocialAssetAnalysis';

interface SocialAssetInsightsProps {
  analysis: SocialAssetAnalysis | null;
  loading: boolean;
  onReanalyze: () => void;
}

const ScoreBadge = ({ score, label }: { score: number | null; label: string }) => {
  if (score === null) return null;
  const color = score >= 80 ? 'text-emerald-600 dark:text-emerald-400'
    : score >= 60 ? 'text-amber-600 dark:text-amber-400'
    : 'text-destructive';
  const bg = score >= 80 ? 'bg-emerald-500/10'
    : score >= 60 ? 'bg-amber-500/10'
    : 'bg-destructive/10';

  return (
    <div className={cn('flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-semibold', bg, color)}>
      <span>{score}</span>
      <span className="text-muted-foreground font-normal">{label}</span>
    </div>
  );
};

const FindingItem = ({ finding }: { finding: any }) => {
  const severityConfig: Record<string, { icon: typeof AlertTriangle; color: string }> = {
    high: { icon: XCircle, color: 'text-destructive' },
    medium: { icon: AlertTriangle, color: 'text-amber-600 dark:text-amber-400' },
    low: { icon: CheckCircle2, color: 'text-emerald-600 dark:text-emerald-400' },
  };
  const config = severityConfig[finding.severity] || severityConfig.low;
  const Icon = config.icon;

  return (
    <div className="flex items-start gap-2 text-xs">
      <Icon className={cn('h-3.5 w-3.5 mt-0.5 flex-shrink-0', config.color)} />
      <div className="flex-1 min-w-0">
        <p className="font-medium">{finding.description || finding.detail || finding.type}</p>
        {finding.recommendation && (
          <p className="text-muted-foreground mt-0.5">{finding.recommendation}</p>
        )}
      </div>
    </div>
  );
};

const EngagementFactor = ({ factor }: { factor: any }) => {
  const impactConfig: Record<string, string> = {
    positive: 'text-emerald-600 dark:text-emerald-400',
    neutral: 'text-muted-foreground',
    negative: 'text-destructive',
  };
  return (
    <div className="flex items-start gap-2 text-xs">
      <TrendingUp className={cn('h-3.5 w-3.5 mt-0.5 flex-shrink-0', impactConfig[factor.impact] || 'text-muted-foreground')} />
      <div>
        <span className="font-medium">{factor.factor}</span>
        {factor.detail && <span className="text-muted-foreground"> — {factor.detail}</span>}
      </div>
    </div>
  );
};

export const SocialAssetInsights = ({ analysis, loading, onReanalyze }: SocialAssetInsightsProps) => {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'bias' | 'compliance' | 'engagement' | 'text'>('bias');

  if (!analysis && !loading) return null;

  // Analyzing state
  if (analysis?.status === 'analyzing' || loading) {
    return (
      <div className="px-3 py-3 border-t border-border/50">
        <div className="flex items-center gap-2 text-xs">
          <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <span className="text-muted-foreground">Running AI analysis (bias, compliance, engagement)…</span>
        </div>
        <Progress value={33} className="h-1 mt-2" />
      </div>
    );
  }

  // Failed state
  if (analysis?.status === 'failed') {
    return (
      <div className="px-3 py-2.5 border-t border-border/50 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-destructive">
          <XCircle className="h-3.5 w-3.5" />
          <span>{analysis.error_message || 'Analysis failed'}</span>
        </div>
        <Button variant="ghost" size="sm" className="h-6 text-xs px-2" onClick={onReanalyze}>
          <RefreshCw className="h-3 w-3 mr-1" /> Retry
        </Button>
      </div>
    );
  }

  if (analysis?.status !== 'completed') return null;

  const overallScore = analysis.overall_score;
  const overallColor = overallScore !== null && overallScore >= 80 ? 'text-emerald-600 dark:text-emerald-400'
    : overallScore !== null && overallScore >= 60 ? 'text-amber-600 dark:text-amber-400'
    : 'text-destructive';

  const tabs = [
    { id: 'bias' as const, label: 'Bias & Inclusion', icon: Shield, score: analysis.bias_score },
    { id: 'compliance' as const, label: 'Compliance', icon: CheckCircle2, score: analysis.compliance_score },
    { id: 'engagement' as const, label: 'Engagement', icon: BarChart3, score: analysis.content_quality_score },
    { id: 'text' as const, label: 'Text & Content', icon: Type, score: analysis.text_content_score },
  ];

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="w-full">
        <div className="px-3 py-2.5 border-t border-border/50 flex items-center justify-between cursor-pointer hover:bg-muted/50 transition-colors">
          <div className="flex items-center gap-2">
            <Sparkles className={cn('h-3.5 w-3.5', overallColor)} />
            <span className="text-xs font-semibold">
              AI Insights
            </span>
            {overallScore !== null && (
              <Badge variant="secondary" className={cn('text-[10px] h-4 px-1.5', overallColor)}>
                {overallScore}/100
              </Badge>
            )}
            <div className="flex gap-1">
              <ScoreBadge score={analysis.bias_score} label="Bias" />
              <ScoreBadge score={analysis.compliance_score} label="Brand" />
              <ScoreBadge score={analysis.content_quality_score} label="Quality" />
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-5 w-5 p-0"
              onClick={(e) => { e.stopPropagation(); onReanalyze(); }}
              title="Re-analyze"
            >
              <RefreshCw className="h-3 w-3" />
            </Button>
            {open ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />}
          </div>
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="px-3 pb-3 space-y-3">
          {/* Tab selector */}
          <div className="flex gap-1 bg-muted/50 rounded-lg p-0.5">
            {tabs.map((tab) => {
              const TabIcon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-1 text-[10px] font-medium py-1.5 rounded-md transition-colors',
                    activeTab === tab.id
                      ? 'bg-background shadow-sm text-foreground'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  <TabIcon className="h-3 w-3" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Bias & Inclusion Tab */}
          {activeTab === 'bias' && (
            <div className="space-y-2.5">
              {analysis.representation_analysis && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium">Representation & Diversity</span>
                    <ScoreBadge score={analysis.representation_analysis?.diversity_score} label="" />
                  </div>
                  {Array.isArray(analysis.representation_analysis?.findings) &&
                    analysis.representation_analysis.findings.map((f: string, i: number) => (
                      <p key={i} className="text-xs text-muted-foreground pl-2 border-l-2 border-border">{f}</p>
                    ))}
                </div>
              )}

              {analysis.cultural_sensitivity && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium">Cultural Sensitivity</span>
                    <ScoreBadge score={analysis.cultural_sensitivity?.score} label="" />
                  </div>
                  {Array.isArray(analysis.cultural_sensitivity?.recommendations) &&
                    analysis.cultural_sensitivity.recommendations.map((r: string, i: number) => (
                      <p key={i} className="text-xs text-muted-foreground pl-2 border-l-2 border-border">{r}</p>
                    ))}
                </div>
              )}

              {analysis.accessibility_findings && (
                <div className="space-y-1">
                  <span className="text-xs font-medium">Accessibility</span>
                  {analysis.accessibility_findings.alt_text_suggestion && (
                    <p className="text-xs text-muted-foreground pl-2 border-l-2 border-primary/30">
                      <strong>Alt text:</strong> {analysis.accessibility_findings.alt_text_suggestion}
                    </p>
                  )}
                  <div className="flex gap-2 text-xs">
                    <Badge variant="outline" className={cn('text-[10px]', analysis.accessibility_findings.contrast_adequate ? 'border-emerald-500/50 text-emerald-600' : 'border-destructive/50 text-destructive')}>
                      Contrast: {analysis.accessibility_findings.contrast_adequate ? '✓' : '✗'}
                    </Badge>
                    <Badge variant="outline" className={cn('text-[10px]', analysis.accessibility_findings.text_readable ? 'border-emerald-500/50 text-emerald-600' : 'border-destructive/50 text-destructive')}>
                      Readability: {analysis.accessibility_findings.text_readable ? '✓' : '✗'}
                    </Badge>
                  </div>
                </div>
              )}

              {Array.isArray(analysis.bias_findings) && analysis.bias_findings.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-xs font-medium">Findings</span>
                  {analysis.bias_findings.map((f, i) => <FindingItem key={i} finding={f} />)}
                </div>
              )}
            </div>
          )}

          {/* Compliance Tab */}
          {activeTab === 'compliance' && (
            <div className="space-y-2.5">
              {analysis.color_compliance && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium">Color Compliance</span>
                    <ScoreBadge score={analysis.color_compliance?.score} label="" />
                  </div>
                  {Array.isArray(analysis.color_compliance?.detected_colors) && (
                    <div className="flex gap-1 flex-wrap">
                      {analysis.color_compliance.detected_colors.slice(0, 8).map((c: string, i: number) => (
                        <div key={i} className="flex items-center gap-1 text-[10px] text-muted-foreground">
                          <div className="w-3 h-3 rounded-sm border border-border" style={{ backgroundColor: c }} />
                          <span>{c}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {Array.isArray(analysis.color_compliance?.findings) &&
                    analysis.color_compliance.findings.map((f: string, i: number) => (
                      <p key={i} className="text-xs text-muted-foreground pl-2 border-l-2 border-border">{f}</p>
                    ))}
                </div>
              )}

              {analysis.logo_compliance && (
                <div className="space-y-1">
                  <span className="text-xs font-medium">Logo Placement</span>
                  <div className="flex gap-2 text-xs">
                    <Badge variant="outline" className={cn('text-[10px]', analysis.logo_compliance.detected ? 'border-emerald-500/50 text-emerald-600' : 'border-amber-500/50 text-amber-600')}>
                      {analysis.logo_compliance.detected ? `Detected (${analysis.logo_compliance.position || 'found'})` : 'Not detected'}
                    </Badge>
                    {analysis.logo_compliance.size_appropriate !== undefined && (
                      <Badge variant="outline" className={cn('text-[10px]', analysis.logo_compliance.size_appropriate ? 'border-emerald-500/50 text-emerald-600' : 'border-amber-500/50 text-amber-600')}>
                        Size: {analysis.logo_compliance.size_appropriate ? '✓' : '⚠'}
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              {analysis.typography_compliance && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium">Typography</span>
                    <ScoreBadge score={analysis.typography_compliance?.score} label="" />
                  </div>
                  {Array.isArray(analysis.typography_compliance?.findings) &&
                    analysis.typography_compliance.findings.map((f: string, i: number) => (
                      <p key={i} className="text-xs text-muted-foreground pl-2 border-l-2 border-border">{f}</p>
                    ))}
                </div>
              )}

              {Array.isArray(analysis.compliance_details) && analysis.compliance_details.length > 0 && (
                <div className="space-y-1">
                  {analysis.compliance_details.map((d, i) => {
                    const statusColor = d.status === 'pass' ? 'text-emerald-600' : d.status === 'fail' ? 'text-destructive' : 'text-amber-600';
                    return (
                      <div key={i} className="flex items-center gap-2 text-xs">
                        <span className={cn('font-medium', statusColor)}>{d.status === 'pass' ? '✓' : d.status === 'fail' ? '✗' : '⚠'}</span>
                        <span className="font-medium">{d.area}</span>
                        <span className="text-muted-foreground">{d.detail}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Engagement Tab */}
          {activeTab === 'engagement' && (
            <div className="space-y-2.5">
              <div className="grid grid-cols-3 gap-2">
                {analysis.predicted_engagement_rate !== null && (
                  <div className="bg-muted/50 rounded-lg p-2 text-center">
                    <p className="text-lg font-bold text-primary">{analysis.predicted_engagement_rate}%</p>
                    <p className="text-[10px] text-muted-foreground">Est. Engagement</p>
                  </div>
                )}
                {analysis.predicted_reach && (
                  <div className="bg-muted/50 rounded-lg p-2 text-center">
                    <p className="text-lg font-bold capitalize text-primary">{analysis.predicted_reach}</p>
                    <p className="text-[10px] text-muted-foreground">Reach Potential</p>
                  </div>
                )}
                {analysis.content_quality_score !== null && (
                  <div className="bg-muted/50 rounded-lg p-2 text-center">
                    <p className="text-lg font-bold text-primary">{analysis.content_quality_score}</p>
                    <p className="text-[10px] text-muted-foreground">Quality Score</p>
                  </div>
                )}
              </div>

              {analysis.optimal_posting_time && (
                <div className="flex items-center gap-2 text-xs bg-primary/5 rounded-md px-2.5 py-1.5">
                  <Clock className="h-3.5 w-3.5 text-primary" />
                  <span className="font-medium">Best time to post:</span>
                  <span className="text-muted-foreground">{analysis.optimal_posting_time}</span>
                </div>
              )}

              {Array.isArray(analysis.engagement_factors) && analysis.engagement_factors.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-xs font-medium">Engagement Factors</span>
                  {analysis.engagement_factors.map((f, i) => <EngagementFactor key={i} factor={f} />)}
                </div>
              )}
            </div>
          )}

          {/* Text & Content Tab */}
          {activeTab === 'text' && (
            <div className="space-y-2.5">
              {(() => {
                const tc = analysis.text_content_analysis;
                if (!tc) return (
                  <p className="text-xs text-muted-foreground italic">No text content analysis available. Re-analyze to generate.</p>
                );

                return (
                  <>
                    {/* Detected text */}
                    {tc.detected_text && (
                      <div className="space-y-1">
                        <span className="text-xs font-medium">Detected Text</span>
                        <p className="text-xs text-muted-foreground bg-muted/50 rounded-md px-2.5 py-1.5 border border-border/50 whitespace-pre-wrap">
                          {tc.detected_text}
                        </p>
                      </div>
                    )}

                    {!tc.text_present && (
                      <div className="flex items-center gap-2 text-xs bg-muted/50 rounded-md px-2.5 py-1.5">
                        <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-muted-foreground">No text detected on this asset</span>
                      </div>
                    )}

                    {tc.text_present && (
                      <>
                        {/* Quick metrics */}
                        <div className="grid grid-cols-3 gap-2">
                          <div className="bg-muted/50 rounded-lg p-2 text-center">
                            <p className="text-lg font-bold text-primary">{tc.character_count ?? '—'}</p>
                            <p className="text-[10px] text-muted-foreground">Characters</p>
                            {tc.platform_limit && (
                              <p className={cn('text-[10px] font-medium', tc.exceeds_limit ? 'text-destructive' : 'text-emerald-600 dark:text-emerald-400')}>
                                {tc.exceeds_limit ? `Over ${tc.platform_limit}` : `Within ${tc.platform_limit}`}
                              </p>
                            )}
                          </div>
                          <div className="bg-muted/50 rounded-lg p-2 text-center">
                            <p className={cn('text-lg font-bold', tc.ratio_compliant ? 'text-emerald-600 dark:text-emerald-400' : 'text-destructive')}>
                              {tc.text_to_image_ratio ?? '—'}%
                            </p>
                            <p className="text-[10px] text-muted-foreground">Text Ratio</p>
                            <p className={cn('text-[10px] font-medium', tc.ratio_compliant ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400')}>
                              {tc.ratio_compliant ? '≤20% ✓' : '>20% ⚠'}
                            </p>
                          </div>
                          {tc.readability?.clarity_score != null && (
                            <div className="bg-muted/50 rounded-lg p-2 text-center">
                              <p className="text-lg font-bold text-primary">{tc.readability.clarity_score}</p>
                              <p className="text-[10px] text-muted-foreground">Clarity</p>
                              {tc.readability.grade_level && (
                                <p className="text-[10px] text-muted-foreground">{tc.readability.grade_level}</p>
                              )}
                            </div>
                          )}
                        </div>

                        {/* WCAG Contrast */}
                        {tc.wcag_contrast && (
                          <div className="space-y-1">
                            <span className="text-xs font-medium">WCAG Contrast</span>
                            <div className="flex gap-2 text-xs flex-wrap">
                              <Badge variant="outline" className={cn('text-[10px]', tc.wcag_contrast.passes_aa ? 'border-emerald-500/50 text-emerald-600 dark:text-emerald-400' : 'border-destructive/50 text-destructive')}>
                                AA (4.5:1): {tc.wcag_contrast.passes_aa ? '✓ Pass' : '✗ Fail'}
                              </Badge>
                              <Badge variant="outline" className={cn('text-[10px]', tc.wcag_contrast.passes_aaa ? 'border-emerald-500/50 text-emerald-600 dark:text-emerald-400' : 'border-amber-500/50 text-amber-600 dark:text-amber-400')}>
                                AAA (7:1): {tc.wcag_contrast.passes_aaa ? '✓ Pass' : '✗ Fail'}
                              </Badge>
                              {tc.wcag_contrast.estimated_ratio && (
                                <Badge variant="outline" className="text-[10px]">
                                  Est. {tc.wcag_contrast.estimated_ratio}
                                </Badge>
                              )}
                            </div>
                            {Array.isArray(tc.wcag_contrast.findings) && tc.wcag_contrast.findings.map((f: string, i: number) => (
                              <p key={i} className="text-xs text-muted-foreground pl-2 border-l-2 border-border">{f}</p>
                            ))}
                          </div>
                        )}

                        {/* Readability */}
                        {tc.readability && (
                          <div className="space-y-1">
                            <span className="text-xs font-medium">Readability & Grammar</span>
                            {tc.readability.tone_alignment && (
                              <p className="text-xs text-muted-foreground pl-2 border-l-2 border-primary/30">
                                <strong>Tone:</strong> {tc.readability.tone_alignment}
                              </p>
                            )}
                            {Array.isArray(tc.readability.spelling_issues) && tc.readability.spelling_issues.length > 0 && (
                              <div className="space-y-0.5">
                                {tc.readability.spelling_issues.map((issue: string, i: number) => (
                                  <div key={i} className="flex items-center gap-1.5 text-xs">
                                    <XCircle className="h-3 w-3 text-destructive flex-shrink-0" />
                                    <span className="text-destructive">{issue}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                            {Array.isArray(tc.readability.grammar_issues) && tc.readability.grammar_issues.length > 0 && (
                              <div className="space-y-0.5">
                                {tc.readability.grammar_issues.map((issue: string, i: number) => (
                                  <div key={i} className="flex items-center gap-1.5 text-xs">
                                    <AlertTriangle className="h-3 w-3 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                                    <span>{issue}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                            {Array.isArray(tc.readability.findings) && tc.readability.findings.map((f: string, i: number) => (
                              <p key={i} className="text-xs text-muted-foreground pl-2 border-l-2 border-border">{f}</p>
                            ))}
                          </div>
                        )}

                        {/* Findings */}
                        {Array.isArray(tc.findings) && tc.findings.length > 0 && (
                          <div className="space-y-1.5">
                            <span className="text-xs font-medium">Text Findings</span>
                            {tc.findings.map((f: any, i: number) => <FindingItem key={i} finding={f} />)}
                          </div>
                        )}
                      </>
                    )}
                  </>
                );
              })()}
            </div>
          )}

          {/* Analysis timestamp */}
          {analysis.analyzed_at && (
            <p className="text-[10px] text-muted-foreground text-right">
              Analyzed {new Date(analysis.analyzed_at).toLocaleString()}
            </p>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};
