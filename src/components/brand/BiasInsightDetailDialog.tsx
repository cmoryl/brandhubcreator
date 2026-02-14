/**
 * Bias Awareness Insight Detail Dialog
 * Shows full scan results including advanced modules when clicking bias insight cards
 */

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Scale, Languages, Eye, Accessibility, ShieldCheck, AlertCircle, CheckCircle2, Download, ChevronDown, ChevronRight, ListChecks, Palette, GlobeLock, ImageIcon, ClipboardCheck, Paintbrush, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface BiasInsightDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entityId: string;
  entityType: 'brand' | 'product' | 'event';
}

export const BiasInsightDetailDialog = ({ open, onOpenChange, entityId, entityType }: BiasInsightDetailDialogProps) => {
  const [scan, setScan] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!open || !entityId) return;
    setLoading(true);
    supabase
      .from('bias_awareness_scans')
      .select('*')
      .eq('entity_id', entityId)
      .eq('entity_type', entityType)
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        setScan(data);
        setLoading(false);
      });
  }, [open, entityId, entityType]);

  const toggleModule = (key: string) => {
    setExpandedModules(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const scoreColor = (v: number) => v >= 80 ? 'text-emerald-500' : v >= 60 ? 'text-amber-500' : 'text-destructive';
  const scoreBg = (v: number) => v >= 80 ? 'bg-emerald-500' : v >= 60 ? 'bg-amber-500' : 'bg-destructive';

  const dimensions = scan ? [
    { label: 'Inclusion', score: Number(scan.inclusion_score) || 0, icon: Scale },
    { label: 'Language', score: Number(scan.language_score) || 0, icon: Languages },
    { label: 'Visual', score: Number(scan.visual_score) || 0, icon: Eye },
    { label: 'Accessibility', score: Number(scan.accessibility_score) || 0, icon: Accessibility },
    { label: 'AI Governance', score: Number(scan.ai_governance_score) || 0, icon: ShieldCheck },
  ] : [];

  const findings = scan ? (Array.isArray(scan.findings) ? scan.findings : []) : [];
  const recommendations = scan ? (Array.isArray(scan.recommendations) ? scan.recommendations : []) : [];

  const renderArrayItems = (items: any[], variant: 'check' | 'risk' | 'neutral' = 'neutral') => (
    <ul className="space-y-1">
      {items.slice(0, 8).map((item: any, i: number) => (
        <li key={i} className="flex items-start gap-1.5 text-xs text-muted-foreground">
          <span className={cn(
            "mt-1 h-1.5 w-1.5 rounded-full shrink-0",
            variant === 'check' ? 'bg-emerald-500' : variant === 'risk' ? 'bg-destructive' : 'bg-muted-foreground'
          )} />
          {typeof item === 'string' ? item : item?.action || item?.recommendation || item?.message || item?.area || JSON.stringify(item)}
        </li>
      ))}
    </ul>
  );

  const renderModuleCard = (key: string, label: string, icon: React.ElementType, data: any) => {
    if (!data || typeof data !== 'object') return null;
    const score = data.overall_score ?? data.imagery_inclusion_score ?? data.score;
    const isExpanded = expandedModules.has(key);
    const Icon = icon;

    return (
      <Collapsible key={key} open={isExpanded} onOpenChange={() => toggleModule(key)}>
        <CollapsibleTrigger asChild>
          <button className="w-full flex items-center gap-2 p-2.5 rounded-md bg-card hover:bg-accent/10 border border-border/50 transition-colors text-left">
            <Icon className="h-3.5 w-3.5 text-violet-400 shrink-0" />
            <span className="text-xs font-medium flex-1">{label}</span>
            {score !== undefined && (
              <Badge className={cn(scoreBg(Number(score)), 'text-white text-[10px] px-1.5 py-0')}>{Math.round(Number(score))}</Badge>
            )}
            {isExpanded ? <ChevronDown className="h-3 w-3 text-muted-foreground" /> : <ChevronRight className="h-3 w-3 text-muted-foreground" />}
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent className="pl-2 pt-2 space-y-2">
          {/* PI&E touchpoints */}
          {data.touchpoints && typeof data.touchpoints === 'object' && (
            <div className="space-y-1.5">
              {Object.entries(data.touchpoints as Record<string, any>).map(([tk, tv]: [string, any]) => (
                <div key={tk} className="bg-muted/30 rounded p-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium capitalize">{tk.replace(/_/g, ' ')}</span>
                    {tv?.score !== undefined && <span className={cn("text-[10px] font-bold", scoreColor(Number(tv.score)))}>{Math.round(Number(tv.score))}</span>}
                  </div>
                  {Array.isArray(tv?.missing_voices) && tv.missing_voices.length > 0 && renderArrayItems(tv.missing_voices, 'risk')}
                  {Array.isArray(tv?.curb_cut_opportunities) && tv.curb_cut_opportunities.length > 0 && renderArrayItems(tv.curb_cut_opportunities, 'check')}
                  {Array.isArray(tv?.generalization_risks) && tv.generalization_risks.length > 0 && renderArrayItems(tv.generalization_risks, 'risk')}
                  {Array.isArray(tv?.diversity_gaps) && tv.diversity_gaps.length > 0 && renderArrayItems(tv.diversity_gaps, 'risk')}
                  {Array.isArray(tv?.intersectionality_issues) && tv.intersectionality_issues.length > 0 && renderArrayItems(tv.intersectionality_issues, 'risk')}
                  {tv?.recommendation && <p className="text-[10px] text-muted-foreground mt-1">→ {tv.recommendation}</p>}
                </div>
              ))}
            </div>
          )}

          {/* WFA areas */}
          {data.areas && typeof data.areas === 'object' && (
            <div className="space-y-1.5">
              {Object.entries(data.areas as Record<string, any>).map(([ak, av]: [string, any]) => (
                <div key={ak} className="bg-muted/30 rounded p-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium capitalize">{ak.replace(/_/g, ' ')}</span>
                    {av?.score !== undefined && <span className={cn("text-[10px] font-bold", scoreColor(Number(av.score)))}>{Math.round(Number(av.score))}</span>}
                  </div>
                  {Array.isArray(av?.findings) && av.findings.length > 0 && renderArrayItems(av.findings)}
                </div>
              ))}
            </div>
          )}

          {/* Policy-as-Code */}
          {Array.isArray(data.disparate_impact_flags) && data.disparate_impact_flags.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold text-muted-foreground mb-1">Disparate Impact Flags</p>
              {renderArrayItems(data.disparate_impact_flags.map((f: any) => `${f.area}: ratio ${f.ratio} [${f.severity}] — ${f.recommendation || ''}`), 'risk')}
            </div>
          )}
          {data.data_journey_traceability && (
            <div className="flex gap-3 text-[10px]">
              <span className="text-muted-foreground">Data Journey: <strong className="text-foreground">{data.data_journey_traceability}</strong></span>
              <span className="text-muted-foreground">Bias Detection: <strong className="text-foreground">{data.bias_detection_automation}</strong></span>
              <span className="text-muted-foreground">Monitoring: <strong className="text-foreground">{data.threshold_monitoring}</strong></span>
            </div>
          )}

          {/* Imagery Stop/Go */}
          {Array.isArray(data.stop_signals_detected) && data.stop_signals_detected.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold text-destructive/80 mb-1">⛔ STOP Signals Detected</p>
              {renderArrayItems(data.stop_signals_detected, 'risk')}
            </div>
          )}
          {Array.isArray(data.go_signals_present) && data.go_signals_present.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold text-emerald-500/80 mb-1">✅ GO Signals Present</p>
              {renderArrayItems(data.go_signals_present, 'check')}
            </div>
          )}
          {Array.isArray(data.recommendations) && data.recommendations.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold text-muted-foreground mb-1">Recommendations</p>
              {renderArrayItems(data.recommendations)}
            </div>
          )}

          {/* Inclusion Checklist */}
          {data.completed_count !== undefined && (
            <div className="flex items-center gap-3 text-xs">
              <span className="text-muted-foreground">Completed: <strong className="text-foreground">{data.completed_count}/{data.applicable_count}</strong></span>
              {data.score !== undefined && <Progress value={Number(data.score)} className="h-1.5 flex-1" />}
            </div>
          )}
          {data.categories && typeof data.categories === 'object' && (
            <div className="space-y-1.5">
              {Object.entries(data.categories as Record<string, any>).map(([ck, cv]: [string, any]) => (
                <div key={ck} className="bg-muted/30 rounded p-2">
                  <p className="text-[10px] font-semibold capitalize mb-1">{ck}</p>
                  {Array.isArray(cv?.met) && cv.met.length > 0 && renderArrayItems(cv.met, 'check')}
                  {Array.isArray(cv?.unmet) && cv.unmet.length > 0 && renderArrayItems(cv.unmet, 'risk')}
                </div>
              ))}
            </div>
          )}
        </CollapsibleContent>
      </Collapsible>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="flex items-center gap-2">
            <Scale className="h-5 w-5 text-violet-500" />
            Bias & Inclusivity Report
          </DialogTitle>
          <div className="flex items-center gap-2">
            <DialogDescription className="flex-1">
              Latest scan results {scan?.completed_at ? `from ${format(new Date(scan.completed_at), 'MMM d, yyyy')}` : ''}
            </DialogDescription>
            {scan && (
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 shrink-0"
                onClick={() => {
                  import('@/lib/exportHtml').then(({ exportBiasAwarenessHtml }) => {
                    exportBiasAwarenessHtml(scan, { entityName: scan.entity_name || 'Entity', entityType: entityType });
                  });
                }}
              >
                <Download className="h-3.5 w-3.5" />
                Export
              </Button>
            )}
          </div>
        </DialogHeader>

        <div className="overflow-y-auto max-h-[calc(90vh-100px)] p-6 pt-4 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
            </div>
          ) : !scan ? (
            <p className="text-center py-8 text-muted-foreground">No completed scan found.</p>
          ) : (
            <>
              {/* Dimension Scores */}
              <Card>
                <CardHeader className="pb-2 px-4 pt-3">
                  <CardTitle className="text-xs font-semibold">Core Dimensions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2.5 px-4 pb-3">
                  {dimensions.map((dim) => (
                    <div key={dim.label}>
                      <div className="flex items-center gap-2 mb-0.5">
                        <dim.icon className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs font-medium flex-1">{dim.label}</span>
                        <Badge className={cn(scoreBg(dim.score), 'text-white text-[10px] px-1.5 py-0')}>{dim.score}</Badge>
                      </div>
                      <Progress value={dim.score} className="h-1" />
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* WCAG 2.2 Compliance */}
              {scan.wcag_compliance && typeof scan.wcag_compliance === 'object' && (
                <Card>
                  <CardHeader className="pb-2 px-4 pt-3">
                    <CardTitle className="text-xs font-semibold flex items-center gap-1.5">
                      <ListChecks className="h-3.5 w-3.5 text-sky-500" />
                      WCAG 2.2 Compliance
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-3">
                    {typeof scan.wcag_compliance === 'object' && Object.entries(scan.wcag_compliance as Record<string, any>).map(([key, val]) => {
                      if (Array.isArray(val) && val.length > 0) {
                        return (
                          <div key={key} className="mb-2">
                            <p className="text-[10px] font-semibold text-muted-foreground capitalize mb-1">{key.replace(/_/g, ' ')}</p>
                            {renderArrayItems(val, key.includes('met') || key.includes('pass') ? 'check' : key.includes('fail') || key.includes('gap') ? 'risk' : 'neutral')}
                          </div>
                        );
                      }
                      if (typeof val === 'string') return <p key={key} className="text-xs text-muted-foreground mb-1"><span className="capitalize">{key.replace(/_/g, ' ')}: </span>{val}</p>;
                      return null;
                    })}
                  </CardContent>
                </Card>
              )}

              {/* Advanced Modules */}
              {(scan.pie_module || scan.wfa_module || scan.policy_as_code_module || scan.inclusive_imagery_module || scan.inclusion_checklist_module) && (
                <div className="space-y-2">
                  <h3 className="text-xs font-semibold text-muted-foreground px-1">Advanced Governance Modules</h3>
                  {renderModuleCard('pie', 'PI&E "Who Else?" Framework', ListChecks, scan.pie_module)}
                  {renderModuleCard('wfa', 'WFA 12-Area Bias Litmus (Color-Linked)', GlobeLock, scan.wfa_module)}
                  {renderModuleCard('policy', 'Policy-as-Code Disparate Impact', ShieldCheck, scan.policy_as_code_module)}
                  {renderModuleCard('imagery', 'Inclusive Imagery Stop/Go', ImageIcon, scan.inclusive_imagery_module)}
                  {renderModuleCard('checklist', '2026 Master Inclusion Checklist', ClipboardCheck, scan.inclusion_checklist_module)}
                </div>
              )}

              {/* Color Science Modules */}
              {(scan.color_accessibility_module || scan.color_strategy_module) && (
                <div className="space-y-2">
                  <h3 className="text-xs font-semibold text-muted-foreground px-1">Color Science & DBA Modules</h3>
                  
                  {/* Color Accessibility */}
                  {scan.color_accessibility_module && typeof scan.color_accessibility_module === 'object' && (() => {
                    const cam = scan.color_accessibility_module as any;
                    return renderModuleCard('color_access', 'Color Accessibility & OKLCH', Palette, cam) || (
                      <Collapsible open={expandedModules.has('color_access_detail')} onOpenChange={() => toggleModule('color_access_detail')}>
                        <CollapsibleTrigger asChild>
                          <button className="w-full flex items-center gap-2 p-2.5 rounded-md bg-card hover:bg-accent/10 border border-border/50 transition-colors text-left">
                            <Palette className="h-3.5 w-3.5 text-violet-400 shrink-0" />
                            <span className="text-xs font-medium flex-1">Color Accessibility & OKLCH</span>
                            {cam.overall_score !== undefined && (
                              <Badge className={cn(scoreBg(Number(cam.overall_score)), 'text-white text-[10px] px-1.5 py-0')}>{Math.round(Number(cam.overall_score))}</Badge>
                            )}
                          </button>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="pl-2 pt-2 space-y-2">
                          <div className="flex flex-wrap gap-2 text-[10px]">
                            {cam.oklch_readiness && <Badge variant="outline" className="text-[9px]">OKLCH: {cam.oklch_readiness}</Badge>}
                            {cam.dark_mode_compliance && <Badge variant="outline" className="text-[9px]">Dark Mode: {cam.dark_mode_compliance}</Badge>}
                            {cam.colorblind_safe !== undefined && <Badge variant="outline" className="text-[9px]">Colorblind Safe: {cam.colorblind_safe ? '✅' : '❌'}</Badge>}
                          </div>
                          {cam.contrast_compliance && (
                            <div className="flex gap-3 text-[10px]">
                              <span className="text-muted-foreground">Text: <strong className={cam.contrast_compliance.primary_text === 'pass' ? 'text-emerald-500' : 'text-destructive'}>{cam.contrast_compliance.primary_text}</strong></span>
                              <span className="text-muted-foreground">Focus: <strong className={cam.contrast_compliance.focus_indicators === 'pass' ? 'text-emerald-500' : 'text-destructive'}>{cam.contrast_compliance.focus_indicators}</strong></span>
                              <span className="text-muted-foreground">UI: <strong className={cam.contrast_compliance.ui_components === 'pass' ? 'text-emerald-500' : 'text-destructive'}>{cam.contrast_compliance.ui_components}</strong></span>
                            </div>
                          )}
                          {Array.isArray(cam.issues) && cam.issues.length > 0 && renderArrayItems(cam.issues, 'risk')}
                          {Array.isArray(cam.recommendations) && cam.recommendations.length > 0 && renderArrayItems(cam.recommendations, 'check')}
                        </CollapsibleContent>
                      </Collapsible>
                    );
                  })()}

                  {/* Color Strategy & DBA */}
                  {scan.color_strategy_module && typeof scan.color_strategy_module === 'object' && (() => {
                    const csm = scan.color_strategy_module as any;
                    return (
                      <Collapsible open={expandedModules.has('color_strategy')} onOpenChange={() => toggleModule('color_strategy')}>
                        <CollapsibleTrigger asChild>
                          <button className="w-full flex items-center gap-2 p-2.5 rounded-md bg-card hover:bg-accent/10 border border-border/50 transition-colors text-left">
                            <Paintbrush className="h-3.5 w-3.5 text-violet-400 shrink-0" />
                            <span className="text-xs font-medium flex-1">Color Strategy & DBA</span>
                            {csm.overall_score !== undefined && (
                              <Badge className={cn(scoreBg(Number(csm.overall_score)), 'text-white text-[10px] px-1.5 py-0')}>{Math.round(Number(csm.overall_score))}</Badge>
                            )}
                          </button>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="pl-2 pt-2 space-y-2">
                          <div className="flex flex-wrap gap-2 text-[10px]">
                            {csm.dba_uniqueness !== undefined && <Badge variant="outline" className="text-[9px]">DBA Uniqueness: {csm.dba_uniqueness}</Badge>}
                            {csm.dba_fame !== undefined && <Badge variant="outline" className="text-[9px]">DBA Fame: {csm.dba_fame}</Badge>}
                            {csm.tonal_consistency && <Badge variant="outline" className="text-[9px]">Tonal: {csm.tonal_consistency}</Badge>}
                            {csm.sentiment_alignment && <Badge variant="outline" className="text-[9px]">Sentiment: {csm.sentiment_alignment}</Badge>}
                          </div>
                          {Array.isArray(csm.cultural_conflicts) && csm.cultural_conflicts.length > 0 && (
                            <div>
                              <p className="text-[10px] font-semibold text-destructive/80 mb-1">🌍 Cultural Color Conflicts</p>
                              {renderArrayItems(csm.cultural_conflicts.map((c: any) => `${c.color} in ${c.market}: ${c.conflict} [${c.severity}]`), 'risk')}
                            </div>
                          )}
                          {Array.isArray(csm.recommendations) && csm.recommendations.length > 0 && renderArrayItems(csm.recommendations, 'check')}
                        </CollapsibleContent>
                      </Collapsible>
                    );
                  })()}
                </div>
              )}

              {/* Findings */}
              {findings.length > 0 && (
                <Card>
                  <CardHeader className="pb-2 px-4 pt-3">
                    <CardTitle className="text-xs font-semibold flex items-center gap-2">
                      <AlertCircle className="h-3.5 w-3.5 text-amber-500" />
                      Findings ({findings.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-3">
                    <ul className="space-y-1.5">
                      {findings.slice(0, 15).map((f: any, i: number) => (
                        <li key={i} className="flex items-start gap-2 text-xs">
                          <span className={cn(
                            "mt-1 h-1.5 w-1.5 rounded-full shrink-0",
                            f?.severity === 'critical' || f?.severity === 'high' ? 'bg-destructive' :
                            f?.severity === 'medium' ? 'bg-amber-500' : 'bg-muted-foreground'
                          )} />
                          <span className="text-muted-foreground">
                            {f?.dimension && <Badge variant="outline" className="text-[9px] mr-1 py-0 px-1">{f.dimension}</Badge>}
                            {f?.title && <strong className="text-foreground">{f.title}: </strong>}
                            {f?.message || f?.description || String(f)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* Recommendations */}
              {recommendations.length > 0 && (
                <Card className="border-accent/30 bg-accent/5">
                  <CardHeader className="pb-2 px-4 pt-3">
                    <CardTitle className="text-xs font-semibold flex items-center gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 text-accent" />
                      Recommendations
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-3">
                    <ul className="space-y-1">
                      {recommendations.slice(0, 10).map((r: any, i: number) => (
                        <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                          {r?.priority && <Badge variant="outline" className={cn("text-[9px] py-0 px-1 shrink-0",
                            r.priority === 'immediate' ? 'border-destructive/50 text-destructive' :
                            r.priority === 'short_term' ? 'border-amber-500/50 text-amber-500' : ''
                          )}>{r.priority.replace('_', ' ')}</Badge>}
                          <span>→ {r?.action || r?.message || r?.recommendation || String(r)}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* Persona Coverage */}
              {scan.persona_coverage && typeof scan.persona_coverage === 'object' && (
                <Card>
                  <CardHeader className="pb-2 px-4 pt-3">
                    <CardTitle className="text-xs font-semibold">Persona Spectrum Coverage</CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-3">
                    {(scan.persona_coverage as any).coverage_percentage !== undefined && (
                      <div className="flex items-center gap-2 mb-2">
                        <Progress value={Number((scan.persona_coverage as any).coverage_percentage)} className="h-1.5 flex-1" />
                        <span className={cn("text-xs font-bold", scoreColor(Number((scan.persona_coverage as any).coverage_percentage)))}>
                          {Math.round(Number((scan.persona_coverage as any).coverage_percentage))}%
                        </span>
                      </div>
                    )}
                    <div className="grid grid-cols-4 gap-1 text-[10px]">
                      <span className="font-semibold text-muted-foreground">Spectrum</span>
                      <span className="font-semibold text-muted-foreground text-center">Perm.</span>
                      <span className="font-semibold text-muted-foreground text-center">Temp.</span>
                      <span className="font-semibold text-muted-foreground text-center">Situ.</span>
                      {['mobility', 'vision', 'hearing', 'speech', 'cognitive'].map(s => {
                        const sp = (scan.persona_coverage as any)?.[s];
                        if (!sp) return null;
                        return [
                          <span key={`${s}-l`} className="capitalize font-medium">{s}</span>,
                          <span key={`${s}-p`} className="text-center">{sp.permanent ? '✅' : '❌'}</span>,
                          <span key={`${s}-t`} className="text-center">{sp.temporary ? '✅' : '❌'}</span>,
                          <span key={`${s}-s`} className="text-center">{sp.situational ? '✅' : '❌'}</span>,
                        ];
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
