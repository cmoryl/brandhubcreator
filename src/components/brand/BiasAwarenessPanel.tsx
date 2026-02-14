/**
 * Bias Awareness Panel
 * Displays bias & inclusion audit results with dimension breakdowns,
 * persona spectrum coverage, and actionable recommendations.
 */

import { useState } from 'react';
import { Shield, Scan, AlertTriangle, CheckCircle2, Info, Eye, MessageSquare, Accessibility, Brain, ChevronDown, ChevronRight, Loader2, Users, FileCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useBiasAwareness } from '@/hooks/useBiasAwareness';

interface BiasAwarenessPanelProps {
  entityType: 'brand' | 'product' | 'event';
  entityId: string;
  entityName: string;
  organizationId: string | null | undefined;
}

const scoreColor = (score: number) => {
  if (score >= 90) return 'text-emerald-500';
  if (score >= 80) return 'text-green-500';
  if (score >= 70) return 'text-amber-500';
  if (score >= 60) return 'text-orange-500';
  return 'text-destructive';
};

const scoreLabel = (score: number) => {
  if (score >= 90) return 'Exemplary';
  if (score >= 80) return 'Strong';
  if (score >= 70) return 'Developing';
  if (score >= 60) return 'Needs Attention';
  return 'Critical';
};

const scoreBg = (score: number) => {
  if (score >= 90) return 'bg-emerald-500/10 border-emerald-500/30';
  if (score >= 80) return 'bg-green-500/10 border-green-500/30';
  if (score >= 70) return 'bg-amber-500/10 border-amber-500/30';
  if (score >= 60) return 'bg-orange-500/10 border-orange-500/30';
  return 'bg-destructive/10 border-destructive/30';
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
    case 'language': return <MessageSquare className="h-3.5 w-3.5" />;
    case 'visual': return <Eye className="h-3.5 w-3.5" />;
    case 'accessibility': return <Accessibility className="h-3.5 w-3.5" />;
    case 'ai_governance': return <Brain className="h-3.5 w-3.5" />;
    default: return <Info className="h-3.5 w-3.5" />;
  }
};

const PersonaSpectrumGrid = ({ coverage }: { coverage: Record<string, unknown> }) => {
  const dimensions = ['mobility', 'vision', 'hearing', 'speech', 'cognitive'];
  const levels = ['permanent', 'temporary', 'situational'];

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-4 gap-1 text-[9px] text-muted-foreground font-medium">
        <div />
        {levels.map(l => <div key={l} className="text-center capitalize">{l}</div>)}
      </div>
      {dimensions.map(dim => {
        const dimData = (coverage[dim] as Record<string, boolean>) || {};
        return (
          <div key={dim} className="grid grid-cols-4 gap-1 items-center">
            <div className="text-[10px] capitalize font-medium">{dim}</div>
            {levels.map(level => (
              <div key={level} className="flex justify-center">
                <div className={`w-4 h-4 rounded-sm border ${dimData[level] ? 'bg-primary/20 border-primary/50' : 'bg-muted/30 border-border'}`}>
                  {dimData[level] && <CheckCircle2 className="h-4 w-4 text-primary" />}
                </div>
              </div>
            ))}
          </div>
        );
      })}
      {coverage.coverage_percentage != null && (
        <div className="flex items-center justify-between text-xs mt-2 pt-2 border-t">
          <span className="text-muted-foreground">Persona Coverage</span>
          <span className={`font-semibold ${scoreColor(Number(coverage.coverage_percentage))}`}>
            {Math.round(Number(coverage.coverage_percentage))}%
          </span>
        </div>
      )}
    </div>
  );
};

const DimensionCard = ({ 
  label, 
  score, 
  icon,
  analysis 
}: { 
  label: string; 
  score: number; 
  icon: React.ReactNode;
  analysis: Record<string, unknown>;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const safeArr = (v: unknown): string[] => Array.isArray(v) ? v.filter(x => typeof x === 'string') : [];

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <button className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all hover:bg-muted/30 ${scoreBg(score)}`}>
          <div className="shrink-0">{icon}</div>
          <div className="flex-1 text-left">
            <p className="text-xs font-medium">{label}</p>
          </div>
          <span className={`text-sm font-bold ${scoreColor(score)}`}>{Math.round(score)}</span>
          {isOpen ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent className="pl-8 pr-3 pb-2 space-y-2 mt-1">
        {safeArr(analysis.strengths || analysis.wcag_strengths || analysis.diversity_signals || analysis.safeguards_detected).length > 0 && (
          <div>
            <p className="text-[10px] font-medium text-muted-foreground mb-1">Strengths</p>
            {safeArr(analysis.strengths || analysis.wcag_strengths || analysis.diversity_signals || analysis.safeguards_detected).map((s, i) => (
              <div key={i} className="flex items-start gap-1.5 text-[10px] mb-0.5">
                <CheckCircle2 className="h-3 w-3 text-green-500 shrink-0 mt-0.5" />
                <span>{s}</span>
              </div>
            ))}
          </div>
        )}
        {safeArr(analysis.issues || analysis.wcag_gaps || analysis.gaps || analysis.risks || analysis.stereotyping_risks).length > 0 && (
          <div>
            <p className="text-[10px] font-medium text-muted-foreground mb-1">Issues</p>
            {safeArr(analysis.issues || analysis.wcag_gaps || analysis.gaps || analysis.risks || analysis.stereotyping_risks).map((item, i) => (
              <div key={i} className="flex items-start gap-1.5 text-[10px] mb-0.5">
                <AlertTriangle className="h-3 w-3 text-amber-500 shrink-0 mt-0.5" />
                <span>{typeof item === 'object' ? JSON.stringify(item) : item}</span>
              </div>
            ))}
          </div>
        )}
        {analysis.framing_assessment && (
          <div className="text-[10px]">
            <span className="text-muted-foreground">Framing: </span>
            <Badge variant="outline" className="text-[9px]">{String(analysis.framing_assessment)}</Badge>
          </div>
        )}
        {analysis.multi_sensory_coverage && (
          <div className="text-[10px]">
            <span className="text-muted-foreground">Multi-Sensory: </span>
            <Badge variant="outline" className="text-[9px]">{String(analysis.multi_sensory_coverage)}</Badge>
          </div>
        )}
        {analysis.policy_as_code_readiness && (
          <div className="text-[10px]">
            <span className="text-muted-foreground">Policy-as-Code: </span>
            <Badge variant="outline" className="text-[9px]">{String(analysis.policy_as_code_readiness)}</Badge>
          </div>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
};

const EntityAdvancedModules = ({ scan }: { scan: any }) => {
  const pie = scan.pie_module as Record<string, any> | null;
  const wfa = scan.wfa_module as Record<string, any> | null;
  const pac = scan.policy_as_code_module as Record<string, any> | null;
  const imagery = scan.inclusive_imagery_module as Record<string, any> | null;
  const checklist = scan.inclusion_checklist_module as Record<string, any> | null;

  const hasModules = pie || wfa || pac || imagery || checklist;

  if (!hasModules) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-6 text-center">
          <FileCheck className="h-8 w-8 mx-auto mb-2 text-muted-foreground/40" />
          <p className="text-xs text-muted-foreground">Advanced modules will appear after a re-scan with the upgraded engine.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <ScrollArea className="max-h-[500px]">
      <div className="space-y-3">
        {/* PI&E */}
        {pie?.touchpoints && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs flex items-center justify-between">
                <span className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5 text-blue-500" /> PI&E "Who Else?" Framework</span>
                <span className={`text-sm font-bold ${scoreColor(Number(pie.overall_score || 0))}`}>{Math.round(Number(pie.overall_score || 0))}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              {Object.entries(pie.touchpoints as Record<string, any>).map(([key, tp]) => (
                <div key={key}>
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="capitalize font-medium">{key}</span>
                    <span className={`font-semibold ${scoreColor(Number(tp?.score || 0))}`}>{Math.round(Number(tp?.score || 0))}</span>
                  </div>
                  {tp?.recommendation && (
                    <p className="text-[9px] text-muted-foreground ml-2">→ {tp.recommendation}</p>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* WFA */}
        {wfa?.areas && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs flex items-center justify-between">
                <span className="flex items-center gap-1.5"><Shield className="h-3.5 w-3.5 text-purple-500" /> WFA Bias Litmus Test</span>
                <span className={`text-sm font-bold ${scoreColor(Number(wfa.overall_score || 0))}`}>{Math.round(Number(wfa.overall_score || 0))}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              {Object.entries(wfa.areas as Record<string, any>).map(([key, area]) => (
                <div key={key} className="text-[10px]">
                  <div className="flex items-center justify-between">
                    <span className="capitalize font-medium">{key.replace(/_/g, ' ')}</span>
                    <span className={`font-semibold ${scoreColor(Number(area?.score || 0))}`}>{Math.round(Number(area?.score || 0))}</span>
                  </div>
                  {Array.isArray(area?.findings) && area.findings.slice(0, 2).map((f: string, i: number) => (
                    <p key={i} className="text-[9px] text-muted-foreground ml-2">• {f}</p>
                  ))}
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Policy-as-Code */}
        {pac && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs flex items-center justify-between">
                <span className="flex items-center gap-1.5"><Brain className="h-3.5 w-3.5 text-orange-500" /> Policy-as-Code Thresholds</span>
                <span className={`text-sm font-bold ${scoreColor(Number(pac.overall_score || 0))}`}>{Math.round(Number(pac.overall_score || 0))}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex gap-3 text-[10px]">
                <Badge variant="outline" className="text-[8px]">Journey: {pac.data_journey_traceability || 'N/A'}</Badge>
                <Badge variant="outline" className="text-[8px]">Detection: {pac.bias_detection_automation || 'N/A'}</Badge>
                <Badge variant="outline" className="text-[8px]">Monitoring: {pac.threshold_monitoring || 'N/A'}</Badge>
              </div>
              {Array.isArray(pac.disparate_impact_flags) && pac.disparate_impact_flags.map((flag: any, i: number) => (
                <div key={i} className="flex items-start gap-1.5 text-[9px]">
                  <AlertTriangle className="h-2.5 w-2.5 text-amber-500 shrink-0 mt-0.5" />
                  <span>{flag.area} (ratio: {flag.ratio}) — {flag.recommendation}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Inclusive Imagery */}
        {imagery && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs flex items-center justify-between">
                <span className="flex items-center gap-1.5"><Eye className="h-3.5 w-3.5 text-green-500" /> Inclusive Imagery (Stop/Go)</span>
                <span className={`text-sm font-bold ${scoreColor(Number(imagery.imagery_inclusion_score || 0))}`}>{Math.round(Number(imagery.imagery_inclusion_score || 0))}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2 text-[9px]">
                <div>
                  <p className="font-medium text-destructive mb-0.5">⛔ STOP</p>
                  {Array.isArray(imagery.stop_signals_detected) && imagery.stop_signals_detected.map((s: string, i: number) => (
                    <p key={i} className="text-muted-foreground">• {s}</p>
                  ))}
                  {(!imagery.stop_signals_detected || imagery.stop_signals_detected.length === 0) && <p className="text-muted-foreground italic">None detected</p>}
                </div>
                <div>
                  <p className="font-medium text-green-500 mb-0.5">✅ GO</p>
                  {Array.isArray(imagery.go_signals_present) && imagery.go_signals_present.map((s: string, i: number) => (
                    <p key={i} className="text-muted-foreground">• {s}</p>
                  ))}
                  {(!imagery.go_signals_present || imagery.go_signals_present.length === 0) && <p className="text-muted-foreground italic">None detected</p>}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 2026 Checklist */}
        {checklist && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs flex items-center justify-between">
                <span className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> 2026 Inclusion Checklist</span>
                <span className={`text-sm font-bold ${scoreColor(Number(checklist.score || 0))}`}>{checklist.completed_count || 0}/{checklist.applicable_count || 26}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {checklist.categories && Object.entries(checklist.categories as Record<string, any>).map(([cat, data]) => (
                <div key={cat} className="mb-2">
                  <p className="text-[10px] font-medium capitalize mb-0.5">{cat}</p>
                  {Array.isArray(data?.met) && data.met.map((m: string, i: number) => (
                    <div key={`met-${i}`} className="flex items-start gap-1 text-[9px]">
                      <CheckCircle2 className="h-2.5 w-2.5 text-green-500 shrink-0 mt-0.5" />
                      <span className="text-muted-foreground">{m}</span>
                    </div>
                  ))}
                  {Array.isArray(data?.unmet) && data.unmet.map((m: string, i: number) => (
                    <div key={`unmet-${i}`} className="flex items-start gap-1 text-[9px]">
                      <AlertTriangle className="h-2.5 w-2.5 text-amber-500 shrink-0 mt-0.5" />
                      <span className="text-muted-foreground">{m}</span>
                    </div>
                  ))}
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </ScrollArea>
  );
};

export const BiasAwarenessPanel = ({ entityType, entityId, entityName, organizationId }: BiasAwarenessPanelProps) => {
  const { latestScan, isLoading, isScanning, startScan } = useBiasAwareness(entityId, entityType, entityName, organizationId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const scan = latestScan;
  const hasResults = scan?.status === 'completed';

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          <div>
            <h3 className="text-sm font-semibold">Bias Awareness & Inclusion</h3>
            <p className="text-[10px] text-muted-foreground">WCAG 2.2 · WFA Framework · Persona Spectrum</p>
          </div>
        </div>
        <Button
          size="sm"
          onClick={startScan}
          disabled={isScanning}
          className="gap-1.5"
        >
          {isScanning ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Scanning...
            </>
          ) : (
            <>
              <Scan className="h-3.5 w-3.5" />
              {hasResults ? 'Re-scan' : 'Run Scan'}
            </>
          )}
        </Button>
      </div>

      {!hasResults && !isScanning && (
        <Card className="border-dashed">
          <CardContent className="py-8 text-center">
            <Shield className="h-10 w-10 mx-auto mb-3 text-muted-foreground/40" />
            <p className="text-sm font-medium">No bias awareness scan yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              Run a scan to analyze your {entityType} for inclusive language, visual diversity, accessibility, and AI governance.
            </p>
          </CardContent>
        </Card>
      )}

      {isScanning && !hasResults && (
        <Card>
          <CardContent className="py-8 text-center">
            <Loader2 className="h-8 w-8 mx-auto mb-3 animate-spin text-primary" />
            <p className="text-sm font-medium">Analyzing for bias & inclusion...</p>
            <p className="text-xs text-muted-foreground mt-1">
              Evaluating language, visuals, accessibility & AI governance
            </p>
          </CardContent>
        </Card>
      )}

      {hasResults && scan && (
        <>
          {/* Overall Score */}
          <Card className={`border ${scoreBg(Number(scan.inclusion_score))}`}>
            <CardContent className="py-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-xs text-muted-foreground">Inclusion Score</p>
                  <p className={`text-3xl font-bold ${scoreColor(Number(scan.inclusion_score))}`}>
                    {Math.round(Number(scan.inclusion_score))}
                    <span className="text-sm font-normal text-muted-foreground">/100</span>
                  </p>
                </div>
                <Badge className={`${scoreBg(Number(scan.inclusion_score))} ${scoreColor(Number(scan.inclusion_score))}`}>
                  {scoreLabel(Number(scan.inclusion_score))}
                </Badge>
              </div>
              <Progress value={Number(scan.inclusion_score)} className="h-2" />
              {scan.completed_at && (
                <p className="text-[9px] text-muted-foreground mt-2">
                  Last scanned: {new Date(scan.completed_at).toLocaleDateString()}
                </p>
              )}
            </CardContent>
          </Card>

          <Tabs defaultValue="dimensions">
            <TabsList className="grid grid-cols-4 w-full">
              <TabsTrigger value="dimensions" className="text-xs">Dimensions</TabsTrigger>
              <TabsTrigger value="modules" className="text-xs">Modules</TabsTrigger>
              <TabsTrigger value="findings" className="text-xs">Findings</TabsTrigger>
              <TabsTrigger value="persona" className="text-xs">Persona</TabsTrigger>
            </TabsList>

            <TabsContent value="dimensions" className="space-y-2 mt-3">
              <DimensionCard
                label="Language & Messaging"
                score={Number(scan.language_score)}
                icon={<MessageSquare className="h-4 w-4 text-blue-500" />}
                analysis={(scan.language_analysis || {}) as Record<string, unknown>}
              />
              <DimensionCard
                label="Visual Representation"
                score={Number(scan.visual_score)}
                icon={<Eye className="h-4 w-4 text-purple-500" />}
                analysis={(scan.visual_analysis || {}) as Record<string, unknown>}
              />
              <DimensionCard
                label="Accessibility (WCAG 2.2)"
                score={Number(scan.accessibility_score)}
                icon={<Accessibility className="h-4 w-4 text-green-500" />}
                analysis={(scan.accessibility_analysis || {}) as Record<string, unknown>}
              />
              <DimensionCard
                label="AI Governance"
                score={Number(scan.ai_governance_score)}
                icon={<Brain className="h-4 w-4 text-orange-500" />}
                analysis={(scan.ai_governance_analysis || {}) as Record<string, unknown>}
              />
            </TabsContent>

            <TabsContent value="modules" className="mt-3">
              <EntityAdvancedModules scan={scan} />
            </TabsContent>

            <TabsContent value="findings" className="mt-3">
              <ScrollArea className="max-h-[400px]">
                <div className="space-y-2">
                  {Array.isArray(scan.findings) && scan.findings.length > 0 ? (
                    scan.findings.map((finding, i) => (
                      <Card key={i} className="border">
                        <CardContent className="p-3">
                          <div className="flex items-start gap-2">
                            {dimensionIcon(finding.dimension)}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="text-xs font-medium">{finding.title}</p>
                                {severityBadge(finding.severity)}
                              </div>
                              <p className="text-[10px] text-muted-foreground">{finding.description}</p>
                              {finding.recommendation && (
                                <div className="mt-1.5 p-1.5 bg-primary/5 rounded text-[10px]">
                                  <span className="font-medium">Action: </span>{finding.recommendation}
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <p className="text-xs text-muted-foreground text-center py-4">No findings to display</p>
                  )}

                  {Array.isArray(scan.recommendations) && scan.recommendations.length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-xs font-semibold mb-2 flex items-center gap-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                        Recommendations
                      </h4>
                      {scan.recommendations.map((rec, i) => (
                        <div key={i} className="flex items-start gap-2 text-[10px] mb-2 p-2 rounded bg-muted/30">
                          <Badge variant="outline" className="text-[8px] shrink-0 capitalize">{rec.priority}</Badge>
                          <div>
                            <p className="font-medium">{rec.action}</p>
                            <p className="text-muted-foreground capitalize">
                              {rec.dimension?.replace('_', ' ')} · {rec.impact} impact
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="persona" className="mt-3">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5" />
                    Microsoft Persona Spectrum Coverage
                  </CardTitle>
                  <p className="text-[9px] text-muted-foreground">
                    Evaluates how well your {entityType} addresses permanent, temporary, and situational constraints
                  </p>
                </CardHeader>
                <CardContent>
                  <PersonaSpectrumGrid coverage={(scan.persona_coverage || {}) as Record<string, unknown>} />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
};
