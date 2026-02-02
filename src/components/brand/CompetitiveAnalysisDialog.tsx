import { useState } from 'react';
import { TrendingUp, Plus, X, Loader2, Sparkles, BarChart3, Target, Lightbulb, FileText, Users, AlertTriangle, CheckCircle, Download } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useCompetitiveAnalysis } from '@/hooks/useCompetitiveAnalysis';
import { ScoreGauge } from '@/components/admin/competitive-analysis/ScoreGauge';
import { PersonalityMatrixChart } from '@/components/admin/competitive-analysis/PersonalityMatrixChart';
import { StrengthsWeaknessesMatrix } from '@/components/admin/competitive-analysis/StrengthsWeaknessesMatrix';
import { ActionPlanTimeline } from '@/components/admin/competitive-analysis/ActionPlanTimeline';
import { DesignPriorityTable } from '@/components/admin/competitive-analysis/DesignPriorityTable';
import { exportCompetitiveAnalysisPdf } from '@/lib/exportCompetitiveAnalysisPdf';
import { toast } from 'sonner';
import type { EntityType, CompetitiveAnalysisReportData } from '@/types/competitiveAnalysis';

interface CompetitiveAnalysisDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entityType: EntityType;
  entityId: string;
  entityName: string;
  organizationId?: string | null;
}

export function CompetitiveAnalysisDialog({
  open,
  onOpenChange,
  entityType,
  entityId,
  entityName,
  organizationId,
}: CompetitiveAnalysisDialogProps) {
  const [competitors, setCompetitors] = useState<string[]>([]);
  const [newCompetitor, setNewCompetitor] = useState('');
  const [activeTab, setActiveTab] = useState('generate');
  const [isExporting, setIsExporting] = useState(false);

  const {
    latestReport,
    isGenerating,
    generateReport,
  } = useCompetitiveAnalysis({ entityType, entityId, organizationId });

  const handleAddCompetitor = () => {
    if (newCompetitor.trim() && competitors.length < 10) {
      setCompetitors([...competitors, newCompetitor.trim()]);
      setNewCompetitor('');
    }
  };

  const handleRemoveCompetitor = (index: number) => {
    setCompetitors(competitors.filter((_, i) => i !== index));
  };

  const handleGenerate = async () => {
    const result = await generateReport(competitors);
    if (result) {
      setActiveTab('results');
    }
  };

  const handleExportPdf = async () => {
    if (!reportData) return;
    
    setIsExporting(true);
    try {
      await exportCompetitiveAnalysisPdf(reportData, {
        entityName,
        entityType,
      }, (status) => {
        if (status.includes('successfully')) {
          toast.success(status);
        }
      });
    } catch (error) {
      toast.error('Failed to export PDF');
      console.error('PDF export error:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const reportData = latestReport?.report_data as CompetitiveAnalysisReportData | undefined;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Competitive Analysis: {entityName}
          </DialogTitle>
          <DialogDescription>
            Generate comprehensive competitive intelligence reports powered by AI
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="generate" className="gap-2">
              <Sparkles className="w-4 h-4" />
              Generate Report
            </TabsTrigger>
            <TabsTrigger value="results" disabled={!latestReport} className="gap-2">
              <FileText className="w-4 h-4" />
              View Results
            </TabsTrigger>
          </TabsList>

          <TabsContent value="generate" className="flex-1 overflow-auto mt-4">
            <div className="space-y-6">
              <div>
                <Label htmlFor="competitors" className="text-base font-medium">
                  Add Competitors (up to 10)
                </Label>
                <p className="text-sm text-muted-foreground mt-1 mb-3">
                  Enter the names of competitors you want to compare against
                </p>
                
                <div className="flex gap-2">
                  <Input
                    id="competitors"
                    value={newCompetitor}
                    onChange={(e) => setNewCompetitor(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddCompetitor()}
                    placeholder="e.g., Competitor Inc."
                    disabled={competitors.length >= 10}
                  />
                  <Button 
                    onClick={handleAddCompetitor}
                    disabled={!newCompetitor.trim() || competitors.length >= 10}
                    size="icon"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>

                {competitors.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {competitors.map((comp, index) => (
                      <Badge key={index} variant="secondary" className="gap-1 pr-1">
                        {comp}
                        <button
                          onClick={() => handleRemoveCompetitor(index)}
                          className="ml-1 hover:bg-muted rounded p-0.5"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-muted/50 rounded-lg p-4">
                <h4 className="font-medium mb-2">Analysis includes:</h4>
                <ul className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Visual Identity Audit
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Digital Presence Analysis
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Brand Positioning Matrix
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Strengths & Weaknesses
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Strategic Recommendations
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    30/60/90 Day Action Plan
                  </li>
                </ul>
              </div>

              <Button
                onClick={handleGenerate}
                disabled={competitors.length === 0 || isGenerating}
                className="w-full"
                size="lg"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating Analysis... (this may take a minute)
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate Competitive Analysis
                  </>
                )}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="results" className="flex-1 overflow-hidden mt-4">
            {reportData && (
              <ScrollArea className="h-[calc(90vh-200px)]">
                <Tabs defaultValue="summary" className="w-full">
                  <div className="flex items-center justify-between mb-4 gap-4">
                    <TabsList className="grid flex-1 grid-cols-4">
                      <TabsTrigger value="summary" className="text-xs">Summary</TabsTrigger>
                      <TabsTrigger value="positioning" className="text-xs">Positioning</TabsTrigger>
                      <TabsTrigger value="recommendations" className="text-xs">Recommendations</TabsTrigger>
                      <TabsTrigger value="action-plan" className="text-xs">Action Plan</TabsTrigger>
                    </TabsList>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleExportPdf}
                      disabled={isExporting}
                      className="gap-2 shrink-0"
                    >
                      {isExporting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Download className="w-4 h-4" />
                      )}
                      Export PDF
                    </Button>
                  </div>

                  <TabsContent value="summary" className="space-y-6">
                    <div className="flex items-start gap-6">
                      <ScoreGauge score={reportData.score} size="lg" />
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg mb-2">Executive Summary</h3>
                        <p className="text-muted-foreground text-sm leading-relaxed">
                          {reportData.executiveSummary.overview}
                        </p>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            Key Strengths
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ul className="space-y-1 text-sm">
                            {reportData.marketPerception.keyStrengths.map((s, i) => (
                              <li key={i} className="flex items-start gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2" />
                                {s}
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-yellow-500" />
                            Critical Gaps
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ul className="space-y-1 text-sm">
                            {reportData.marketPerception.criticalGaps.map((g, i) => (
                              <li key={i} className="flex items-start gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 mt-2" />
                                {g}
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    </div>

                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <BarChart3 className="w-5 h-5" />
                          Strengths & Weaknesses Matrix
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <StrengthsWeaknessesMatrix matrix={reportData.strengthsWeaknesses} />
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="positioning" className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Users className="w-5 h-5" />
                          Brand Personality Matrix
                        </CardTitle>
                        <CardDescription>
                          How {entityName} is positioned across key brand dimensions
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <PersonalityMatrixChart matrix={reportData.brandPositioning.personalityMatrix} />
                      </CardContent>
                    </Card>

                    <div className="grid md:grid-cols-2 gap-4">
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">Target Audience Signals</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="flex flex-wrap gap-2">
                            {reportData.brandPositioning.targetAudienceSignals.map((s, i) => (
                              <Badge key={i} variant="outline">{s}</Badge>
                            ))}
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">Differentiation Factors</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="flex flex-wrap gap-2">
                            {reportData.brandPositioning.differentiation.map((d, i) => (
                              <Badge key={i} variant="secondary">{d}</Badge>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Trust Indicators</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="grid md:grid-cols-2 gap-2 text-sm">
                          {reportData.brandPositioning.trustIndicators.map((t, i) => (
                            <li key={i} className="flex items-center gap-2">
                              <CheckCircle className="w-4 h-4 text-green-500" />
                              {t}
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="recommendations" className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Target className="w-5 h-5" />
                          Design Priorities
                        </CardTitle>
                        <CardDescription>
                          Ranked by impact and effort required
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <DesignPriorityTable priorities={reportData.recommendations.designPriorities} />
                      </CardContent>
                    </Card>

                    <div className="grid md:grid-cols-2 gap-4">
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">Brand Refinements</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm">
                          <div>
                            <span className="font-medium">Logo:</span>
                            <p className="text-muted-foreground">{reportData.recommendations.brandRefinements.logo}</p>
                          </div>
                          <div>
                            <span className="font-medium">Colors:</span>
                            <p className="text-muted-foreground">{reportData.recommendations.brandRefinements.colors}</p>
                          </div>
                          <div>
                            <span className="font-medium">Typography:</span>
                            <p className="text-muted-foreground">{reportData.recommendations.brandRefinements.typography}</p>
                          </div>
                          <div>
                            <span className="font-medium">Imagery:</span>
                            <p className="text-muted-foreground">{reportData.recommendations.brandRefinements.imagery}</p>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <Lightbulb className="w-4 h-4" />
                            Positioning Opportunities
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ul className="space-y-2 text-sm">
                            {reportData.recommendations.positioningOpportunities.map((o, i) => (
                              <li key={i} className="flex items-start gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2" />
                                {o}
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>

                  <TabsContent value="action-plan" className="space-y-6">
                    <div className="flex items-center gap-2 mb-4">
                      <h3 className="font-semibold text-lg">Top Priorities</h3>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-6">
                      {reportData.executiveSummary.topPriorities.map((p, i) => (
                        <Badge key={i} variant="default" className="text-sm py-1 px-3">
                          {i + 1}. {p}
                        </Badge>
                      ))}
                    </div>

                    <ActionPlanTimeline actionPlan={reportData.executiveSummary.actionPlan} />

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Success Metrics</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="grid md:grid-cols-2 gap-2 text-sm">
                          {reportData.executiveSummary.successMetrics.map((m, i) => (
                            <li key={i} className="flex items-center gap-2">
                              <Target className="w-4 h-4 text-primary" />
                              {m}
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </ScrollArea>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
