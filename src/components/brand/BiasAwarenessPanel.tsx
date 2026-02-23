/**
 * Bias Awareness Panel
 * Displays bias & inclusion audit results with dimension breakdowns,
 * persona spectrum coverage, and actionable recommendations.
 */

import { useState } from 'react';
import { Shield, Scan, AlertTriangle, CheckCircle2, Info, Eye, MessageSquare, Accessibility, Brain, ChevronDown, ChevronRight, Loader2, Users, FileCheck, Palette, BarChart3, Zap, BookOpen, Layers, ImageIcon, ArrowRight, ShieldCheck, XCircle, MinusCircle } from 'lucide-react';
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
    <div className="overflow-y-auto max-h-[700px]">
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
    </div>
  );
};

// ─── SACM Dashboard Panel ─────────────────────────────────
const SACM_SENTIMENT_COLORS: Record<string, string> = {
  'positive_trust': 'bg-cyan-500',
  'negative_urgency': 'bg-rose-500',
  'neutral_professional': 'bg-slate-500',
  'joy_energy': 'bg-amber-500',
  'calm_wellness': 'bg-emerald-500',
};

const SACM_SENTIMENT_LABELS: Record<string, string> = {
  'positive_trust': 'Positive / Trust',
  'negative_urgency': 'Negative / Urgency',
  'neutral_professional': 'Neutral / Professional',
  'joy_energy': 'Joy / Energy',
  'calm_wellness': 'Calm / Wellness',
};

const SACMDashboardPanel = ({ scan }: { scan: any }) => {
  const sacm = scan.sacm_module as Record<string, any> | null;
  
  if (!sacm) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-6 text-center">
          <Palette className="h-8 w-8 mx-auto mb-2 text-muted-foreground/40" />
          <p className="text-xs text-muted-foreground">SACM analysis will appear after a re-scan with the upgraded engine.</p>
        </CardContent>
      </Card>
    );
  }

  const safeArr = (v: unknown): any[] => Array.isArray(v) ? v : [];
  const overallScore = Number(sacm.overall_score || 0);
  const sentimentAlignment = Number(sacm.sentiment_color_alignment || 0);
  const emotionalValence = Number(sacm.emotional_valence_score || 0);
  const crossChannel = Number(sacm.cross_channel_consistency || 0);
  const coherence = sacm.color_emotion_coherence || 'unknown';
  const profile = sacm.brand_palette_sentiment_profile || {};
  const distribution = profile.sentiment_distribution || {};

  return (
    <div className="overflow-y-auto max-h-[700px] space-y-3">
      {/* SACM Header Score */}
      <Card className={`border ${scoreBg(overallScore)}`}>
        <CardContent className="py-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Palette className="h-4 w-4 text-primary" />
              <div>
                <p className="text-xs font-semibold">SACM Overall Score</p>
                <p className="text-[9px] text-muted-foreground">Sentiment Analysis & Computational Color Modeling</p>
              </div>
            </div>
            <span className={`text-2xl font-bold ${scoreColor(overallScore)}`}>
              {Math.round(overallScore)}
              <span className="text-xs font-normal text-muted-foreground">/100</span>
            </span>
          </div>
          <Progress value={overallScore} className="h-1.5" />
        </CardContent>
      </Card>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-3 gap-2">
        <Card>
          <CardContent className="py-2.5 px-3 text-center">
            <p className="text-[9px] text-muted-foreground">Sentiment-Color</p>
            <p className={`text-lg font-bold ${scoreColor(sentimentAlignment)}`}>{Math.round(sentimentAlignment)}</p>
            <p className="text-[8px] text-muted-foreground">Alignment</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-2.5 px-3 text-center">
            <p className="text-[9px] text-muted-foreground">Emotional</p>
            <p className={`text-lg font-bold ${scoreColor(emotionalValence)}`}>{Math.round(emotionalValence)}</p>
            <p className="text-[8px] text-muted-foreground">Valence</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-2.5 px-3 text-center">
            <p className="text-[9px] text-muted-foreground">Cross-Channel</p>
            <p className={`text-lg font-bold ${scoreColor(crossChannel)}`}>{Math.round(crossChannel)}</p>
            <p className="text-[8px] text-muted-foreground">Consistency</p>
          </CardContent>
        </Card>
      </div>

      {/* Color-Emotion Coherence */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-xs flex items-center gap-1.5">
            <BarChart3 className="h-3.5 w-3.5 text-primary" />
            Color-Emotion Coherence
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 mb-3">
            <Badge variant="outline" className={`text-[9px] ${
              coherence === 'strong' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30' :
              coherence === 'moderate' ? 'bg-amber-500/10 text-amber-600 border-amber-500/30' :
              coherence === 'weak' ? 'bg-orange-500/10 text-orange-600 border-orange-500/30' :
              'bg-destructive/10 text-destructive border-destructive/30'
            }`}>
              {coherence}
            </Badge>
            {profile.dominant_sentiment && (
              <span className="text-[9px] text-muted-foreground">Dominant: <span className="font-medium">{profile.dominant_sentiment}</span></span>
            )}
          </div>

          {/* Sentiment Distribution Bars */}
          {Object.keys(distribution).length > 0 && (
            <div className="space-y-1.5">
              {Object.entries(SACM_SENTIMENT_LABELS).map(([key, label]) => {
                const value = Number(distribution[key] || 0);
                return (
                  <div key={key} className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${SACM_SENTIMENT_COLORS[key]} shrink-0`} />
                    <span className="text-[9px] w-28 text-muted-foreground truncate">{label}</span>
                    <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className={`h-full ${SACM_SENTIMENT_COLORS[key]} rounded-full transition-all`} style={{ width: `${Math.min(value, 100)}%` }} />
                    </div>
                    <span className="text-[9px] font-medium w-7 text-right">{Math.round(value)}%</span>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Mappings Analysis */}
      {safeArr(sacm.mappings_analysis).length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5 text-amber-500" />
              Sentiment-Color Mapping Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {safeArr(sacm.mappings_analysis).map((mapping: any, i: number) => (
              <div key={i} className={`p-2 rounded-lg border text-[10px] ${
                mapping.alignment === 'aligned' ? 'bg-emerald-500/5 border-emerald-500/20' :
                mapping.alignment === 'partial' ? 'bg-amber-500/5 border-amber-500/20' :
                'bg-destructive/5 border-destructive/20'
              }`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium">{mapping.content_sentiment}</span>
                  <Badge variant="outline" className={`text-[8px] ${
                    mapping.alignment === 'aligned' ? 'text-emerald-600' :
                    mapping.alignment === 'partial' ? 'text-amber-600' : 'text-destructive'
                  }`}>
                    {mapping.alignment}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-1 text-[9px] text-muted-foreground">
                  <span>Expected: <span className="font-medium">{mapping.expected_color_family}</span></span>
                  <span>Actual: <span className="font-medium">{mapping.actual_brand_color}</span></span>
                </div>
                {mapping.recommendation && (
                  <p className="text-[9px] text-muted-foreground mt-1 italic">→ {mapping.recommendation}</p>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Bias Flags */}
      {safeArr(sacm.sacm_bias_flags).length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
              SACM Bias Flags
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5">
            {safeArr(sacm.sacm_bias_flags).map((flag: any, i: number) => (
              <div key={i} className="flex items-start gap-2 text-[10px]">
                <Badge variant={flag.bias_risk === 'high' ? 'destructive' : 'outline'} className="text-[8px] shrink-0 mt-0.5">
                  {flag.bias_risk}
                </Badge>
                <div>
                  <p className="font-medium">{flag.area}</p>
                  <p className="text-muted-foreground">{flag.description}</p>
                  <p className="text-[9px] text-muted-foreground">
                    Sentiment: {flag.detected_sentiment} · Used: {flag.color_used} · Expected: {flag.expected_color}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Recommendations */}
      {safeArr(sacm.recommendations).length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
              SACM Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {safeArr(sacm.recommendations).map((rec: string, i: number) => (
              <div key={i} className="flex items-start gap-1.5 text-[10px]">
                <span className="text-primary shrink-0 mt-0.5">→</span>
                <span className="text-muted-foreground">{rec}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// ─── Curb-Cut Effect Dashboard Panel ─────────────────────────────────
const READINESS_COLORS: Record<string, string> = {
  accessible: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30',
  partially_accessible: 'bg-amber-500/10 text-amber-600 border-amber-500/30',
  not_accessible: 'bg-destructive/10 text-destructive border-destructive/30',
};

const CurbCutDashboardPanel = ({ scan }: { scan: any }) => {
  const curbCut = scan.curb_cut_module as Record<string, any> | null;

  if (!curbCut) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-6 text-center">
          <BookOpen className="h-8 w-8 mx-auto mb-2 text-muted-foreground/40" />
          <p className="text-xs text-muted-foreground">Curb-Cut Effect analysis will appear after a re-scan with the upgraded engine.</p>
        </CardContent>
      </Card>
    );
  }

  const safeArr = (v: unknown): any[] => Array.isArray(v) ? v : [];
  const overallScore = Number(curbCut.overall_score || 0);
  const plainLanguageScore = Number(curbCut.plain_language_score || 0);
  const multiModalCoverage = Number(curbCut.multi_modal_coverage || 0);
  const altTextQuality = Number(curbCut.alt_text_quality || 0);
  const fleschGrade = Number(curbCut.flesch_kincaid_grade || 0);
  const altStats = curbCut.alt_text_stats || {};

  return (
    <div className="overflow-y-auto max-h-[700px] space-y-3">
      {/* Curb-Cut Header Score */}
      <Card className={`border ${scoreBg(overallScore)}`}>
        <CardContent className="py-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary" />
              <div>
                <p className="text-xs font-semibold">Curb-Cut Effect Score</p>
                <p className="text-[9px] text-muted-foreground">Plain Language · Multi-Modal · Alt-Text · Universal Design</p>
              </div>
            </div>
            <span className={`text-2xl font-bold ${scoreColor(overallScore)}`}>
              {Math.round(overallScore)}
              <span className="text-xs font-normal text-muted-foreground">/100</span>
            </span>
          </div>
          <Progress value={overallScore} className="h-1.5" />
        </CardContent>
      </Card>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-3 gap-2">
        <Card>
          <CardContent className="py-2.5 px-3 text-center">
            <BookOpen className="h-3.5 w-3.5 mx-auto mb-1 text-blue-500" />
            <p className="text-[9px] text-muted-foreground">Plain Language</p>
            <p className={`text-lg font-bold ${scoreColor(plainLanguageScore)}`}>{Math.round(plainLanguageScore)}</p>
            <p className="text-[8px] text-muted-foreground">
              Grade {fleschGrade > 0 ? fleschGrade.toFixed(1) : 'N/A'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-2.5 px-3 text-center">
            <Layers className="h-3.5 w-3.5 mx-auto mb-1 text-purple-500" />
            <p className="text-[9px] text-muted-foreground">Multi-Modal</p>
            <p className={`text-lg font-bold ${scoreColor(multiModalCoverage)}`}>{Math.round(multiModalCoverage)}</p>
            <p className="text-[8px] text-muted-foreground">Coverage</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-2.5 px-3 text-center">
            <ImageIcon className="h-3.5 w-3.5 mx-auto mb-1 text-green-500" />
            <p className="text-[9px] text-muted-foreground">Alt-Text</p>
            <p className={`text-lg font-bold ${scoreColor(altTextQuality)}`}>{Math.round(altTextQuality)}</p>
            <p className="text-[8px] text-muted-foreground">
              {altStats.images_with_alt || 0}/{altStats.images_total || 0} images
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Jargon Terms */}
      {safeArr(curbCut.jargon_terms).length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
              Jargon Detected ({safeArr(curbCut.jargon_terms).length} terms)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5">
            {safeArr(curbCut.jargon_terms).slice(0, 10).map((term: any, i: number) => (
              <div key={i} className="flex items-center gap-2 text-[10px] p-1.5 rounded bg-amber-500/5 border border-amber-500/10">
                <span className="font-medium text-amber-700 dark:text-amber-400">"{term.term}"</span>
                <ArrowRight className="h-2.5 w-2.5 text-muted-foreground shrink-0" />
                <span className="text-muted-foreground">{term.plain_alternative}</span>
                {term.frequency > 1 && (
                  <Badge variant="outline" className="text-[8px] ml-auto">×{term.frequency}</Badge>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Content Format Gaps */}
      {safeArr(curbCut.content_format_gaps).length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5 text-purple-500" />
              Multi-Modal Content Gaps
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {safeArr(curbCut.content_format_gaps).map((gap: any, i: number) => (
              <div key={i} className="p-2 rounded-lg border text-[10px]">
                <p className="font-medium mb-1">{gap.section}</p>
                <div className="flex flex-wrap gap-1">
                  {safeArr(gap.available_formats).map((f: string, j: number) => (
                    <Badge key={`avail-${j}`} variant="outline" className="text-[8px] bg-emerald-500/10 text-emerald-600 border-emerald-500/20">{f}</Badge>
                  ))}
                  {safeArr(gap.missing_formats).map((f: string, j: number) => (
                    <Badge key={`miss-${j}`} variant="outline" className="text-[8px] bg-destructive/10 text-destructive border-destructive/20">⚠ {f}</Badge>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Alt-Text Stats */}
      {(altStats.images_total > 0 || safeArr(altStats.generic_alt_flags).length > 0) && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs flex items-center gap-1.5">
              <ImageIcon className="h-3.5 w-3.5 text-green-500" />
              Alt-Text Quality Report
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-2 mb-2 text-center text-[10px]">
              <div className="p-1.5 rounded bg-muted/30">
                <p className="font-bold text-sm">{altStats.images_total || 0}</p>
                <p className="text-muted-foreground">Total Images</p>
              </div>
              <div className="p-1.5 rounded bg-muted/30">
                <p className="font-bold text-sm text-emerald-600">{altStats.images_with_alt || 0}</p>
                <p className="text-muted-foreground">With Alt</p>
              </div>
              <div className="p-1.5 rounded bg-muted/30">
                <p className="font-bold text-sm text-blue-600">{altStats.images_with_descriptive_alt || 0}</p>
                <p className="text-muted-foreground">Descriptive</p>
              </div>
            </div>
            {safeArr(altStats.generic_alt_flags).length > 0 && (
              <div className="space-y-1">
                <p className="text-[9px] font-medium text-amber-600">Generic alt-text flags:</p>
                {safeArr(altStats.generic_alt_flags).map((flag: string, i: number) => (
                  <div key={i} className="flex items-start gap-1 text-[9px] text-muted-foreground">
                    <AlertTriangle className="h-2.5 w-2.5 text-amber-500 shrink-0 mt-0.5" />
                    <span>{flag}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Curb-Cut Benefit Mappings */}
      {safeArr(curbCut.curb_cut_mappings).length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5 text-primary" />
              Universal Benefit Mappings
            </CardTitle>
            <p className="text-[9px] text-muted-foreground">How accessibility fixes benefit everyone</p>
          </CardHeader>
          <CardContent className="space-y-2">
            {safeArr(curbCut.curb_cut_mappings).map((mapping: any, i: number) => (
              <div key={i} className="p-2 rounded-lg border bg-primary/5 text-[10px]">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline" className="text-[8px] bg-primary/10 text-primary border-primary/20">{mapping.accommodation}</Badge>
                  <ArrowRight className="h-2.5 w-2.5 text-muted-foreground" />
                  <span className="text-muted-foreground">{mapping.target_audience}</span>
                </div>
                <div className="flex flex-wrap gap-1 mt-1">
                  {safeArr(mapping.universal_benefits).map((benefit: string, j: number) => (
                    <Badge key={j} variant="secondary" className="text-[8px]">✓ {benefit}</Badge>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Content Readiness */}
      {safeArr(curbCut.content_readiness).length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
              Content Readiness
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5">
            {safeArr(curbCut.content_readiness).map((section: any, i: number) => (
              <div key={i} className="flex items-center justify-between text-[10px] p-1.5 rounded border">
                <span className="font-medium">{section.section}</span>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] text-muted-foreground">{section.formats_available}/{section.formats_possible} formats</span>
                  <Badge variant="outline" className={`text-[8px] ${READINESS_COLORS[section.readiness_level] || ''}`}>
                    {section.readiness_level?.replace('_', ' ')}
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Recommendations */}
      {safeArr(curbCut.recommendations).length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
              Curb-Cut Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {safeArr(curbCut.recommendations).map((rec: string, i: number) => (
              <div key={i} className="flex items-start gap-1.5 text-[10px]">
                <span className="text-primary shrink-0 mt-0.5">→</span>
                <span className="text-muted-foreground">{rec}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// ─── WCAG Criterion Row (extracted for hooks compliance) ──────────────
const WCAGCriterionRow = ({ criterion }: { criterion: any }) => {
  const [isOpen, setIsOpen] = useState(criterion.status === 'fail');
  const cfg = WCAG_STATUS_CONFIG[criterion.status] || WCAG_STATUS_CONFIG.not_applicable;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <button className={`w-full flex items-center gap-2 p-2 rounded-lg border transition-all hover:bg-muted/30 ${cfg.bg}`}>
          {cfg.icon}
          <div className="flex-1 text-left">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-mono font-bold">{criterion.id}</span>
              <span className="text-[10px] font-medium">{criterion.name}</span>
            </div>
          </div>
          <Badge variant="outline" className={`text-[8px] ${LEVEL_BADGE[criterion.level] || ''}`}>
            {criterion.level}
          </Badge>
          <Badge variant="outline" className={`text-[8px] capitalize ${cfg.bg}`}>
            {criterion.status?.replace('_', ' ')}
          </Badge>
          {isOpen ? <ChevronDown className="h-3 w-3 text-muted-foreground" /> : <ChevronRight className="h-3 w-3 text-muted-foreground" />}
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent className="pl-8 pr-2 pb-1 space-y-1 mt-1">
        {criterion.evidence && (
          <div className="text-[9px]">
            <span className="font-medium text-muted-foreground">Evidence: </span>
            <span>{criterion.evidence}</span>
          </div>
        )}
        {criterion.remediation && criterion.status !== 'pass' && (
          <div className="text-[9px] p-1.5 rounded bg-primary/5">
            <span className="font-medium">Remediation: </span>
            <span className="text-muted-foreground">{criterion.remediation}</span>
          </div>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
};

// ─── WCAG 2.2 Compliance Dashboard Panel ─────────────────────────────────
const WCAG_STATUS_CONFIG: Record<string, { icon: React.ReactNode; color: string; bg: string }> = {
  pass: { icon: <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />, color: 'text-emerald-600', bg: 'bg-emerald-500/10 border-emerald-500/20' },
  partial: { icon: <MinusCircle className="h-3.5 w-3.5 text-amber-500" />, color: 'text-amber-600', bg: 'bg-amber-500/10 border-amber-500/20' },
  fail: { icon: <XCircle className="h-3.5 w-3.5 text-destructive" />, color: 'text-destructive', bg: 'bg-destructive/10 border-destructive/20' },
  not_applicable: { icon: <MinusCircle className="h-3.5 w-3.5 text-muted-foreground" />, color: 'text-muted-foreground', bg: 'bg-muted/30 border-border' },
};

const LEVEL_BADGE: Record<string, string> = {
  A: 'bg-blue-500/10 text-blue-600 border-blue-500/30',
  AA: 'bg-purple-500/10 text-purple-600 border-purple-500/30',
  AAA: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/30',
};

const WCAGCompliancePanel = ({ scan }: { scan: any }) => {
  const wcag = scan.wcag_compliance as Record<string, any> | null;

  if (!wcag) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-6 text-center">
          <ShieldCheck className="h-8 w-8 mx-auto mb-2 text-muted-foreground/40" />
          <p className="text-xs text-muted-foreground">WCAG 2.2 compliance audit will appear after a re-scan with the upgraded engine.</p>
        </CardContent>
      </Card>
    );
  }

  const safeArr = (v: unknown): any[] => Array.isArray(v) ? v : [];
  const criteria = safeArr(wcag.criteria);
  const passCount = Number(wcag.pass_count || criteria.filter((c: any) => c.status === 'pass').length);
  const failCount = Number(wcag.fail_count || criteria.filter((c: any) => c.status === 'fail').length);
  const partialCount = Number(wcag.partial_count || criteria.filter((c: any) => c.status === 'partial').length);
  const totalApplicable = criteria.filter((c: any) => c.status !== 'not_applicable').length;
  const compliancePercent = totalApplicable > 0 ? Math.round((passCount / totalApplicable) * 100) : 0;

  return (
    <div className="overflow-y-auto max-h-[700px] space-y-3">
      {/* Summary Card */}
      <Card className={`border ${scoreBg(compliancePercent)}`}>
        <CardContent className="py-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" />
              <div>
                <p className="text-xs font-semibold">WCAG 2.2 Compliance</p>
                <p className="text-[9px] text-muted-foreground">9 New Success Criteria · EAA · Section 508</p>
              </div>
            </div>
            <span className={`text-2xl font-bold ${scoreColor(compliancePercent)}`}>
              {compliancePercent}%
            </span>
          </div>
          <Progress value={compliancePercent} className="h-1.5" />
        </CardContent>
      </Card>

      {/* Status Summary */}
      <div className="grid grid-cols-3 gap-2">
        <Card>
          <CardContent className="py-2.5 px-3 text-center">
            <CheckCircle2 className="h-3.5 w-3.5 mx-auto mb-1 text-emerald-500" />
            <p className="text-lg font-bold text-emerald-600">{passCount}</p>
            <p className="text-[9px] text-muted-foreground">Passing</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-2.5 px-3 text-center">
            <MinusCircle className="h-3.5 w-3.5 mx-auto mb-1 text-amber-500" />
            <p className="text-lg font-bold text-amber-600">{partialCount}</p>
            <p className="text-[9px] text-muted-foreground">Partial</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-2.5 px-3 text-center">
            <XCircle className="h-3.5 w-3.5 mx-auto mb-1 text-destructive" />
            <p className="text-lg font-bold text-destructive">{failCount}</p>
            <p className="text-[9px] text-muted-foreground">Failing</p>
          </CardContent>
        </Card>
      </div>

      {/* Regulatory Readiness */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-xs flex items-center gap-1.5">
            <Shield className="h-3.5 w-3.5 text-primary" />
            Regulatory Readiness
          </CardTitle>
        </CardHeader>
        <CardContent className="flex gap-3">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-muted-foreground">EAA 2025:</span>
            <Badge variant="outline" className={`text-[9px] ${
              wcag.eaa_readiness === 'compliant' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30' :
              wcag.eaa_readiness === 'partial' ? 'bg-amber-500/10 text-amber-600 border-amber-500/30' :
              'bg-destructive/10 text-destructive border-destructive/30'
            }`}>
              {wcag.eaa_readiness || 'Unknown'}
            </Badge>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-muted-foreground">Section 508:</span>
            <Badge variant="outline" className={`text-[9px] ${
              wcag.section_508_readiness === 'compliant' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30' :
              wcag.section_508_readiness === 'partial' ? 'bg-amber-500/10 text-amber-600 border-amber-500/30' :
              'bg-destructive/10 text-destructive border-destructive/30'
            }`}>
              {wcag.section_508_readiness || 'Unknown'}
            </Badge>
          </div>
          {wcag.overall_level && (
            <div className="flex items-center gap-1.5 ml-auto">
              <span className="text-[10px] text-muted-foreground">Level:</span>
              <Badge variant="outline" className={`text-[9px] font-bold ${LEVEL_BADGE[wcag.overall_level] || ''}`}>
                {wcag.overall_level}
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Per-Criterion Breakdown */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-xs flex items-center gap-1.5">
            <Accessibility className="h-3.5 w-3.5 text-primary" />
            Criterion-by-Criterion Audit
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {criteria.map((criterion: any, i: number) => (
              <WCAGCriterionRow key={i} criterion={criterion} />
            ))}
        </CardContent>
      </Card>

      {/* Priority Remediations */}
      {safeArr(wcag.priority_remediations).length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
              Priority Remediations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {safeArr(wcag.priority_remediations).map((rec: string, i: number) => (
              <div key={i} className="flex items-start gap-1.5 text-[10px]">
                <span className="text-primary shrink-0 mt-0.5">→</span>
                <span className="text-muted-foreground">{rec}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
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
            <TabsList className="grid grid-cols-7 w-full">
              <TabsTrigger value="dimensions" className="text-xs">Dimensions</TabsTrigger>
              <TabsTrigger value="wcag" className="text-xs">WCAG 2.2</TabsTrigger>
              <TabsTrigger value="curb-cut" className="text-xs">Curb-Cut</TabsTrigger>
              <TabsTrigger value="sacm" className="text-xs">SACM</TabsTrigger>
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

            <TabsContent value="wcag" className="mt-3">
              <WCAGCompliancePanel scan={scan} />
            </TabsContent>

            <TabsContent value="curb-cut" className="mt-3">
              <CurbCutDashboardPanel scan={scan} />
            </TabsContent>

            <TabsContent value="sacm" className="mt-3">
              <SACMDashboardPanel scan={scan} />
            </TabsContent>

            <TabsContent value="modules" className="mt-3">
              <EntityAdvancedModules scan={scan} />
            </TabsContent>

            <TabsContent value="findings" className="mt-3">
              <div className="overflow-y-auto max-h-[600px]">
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
              </div>
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
