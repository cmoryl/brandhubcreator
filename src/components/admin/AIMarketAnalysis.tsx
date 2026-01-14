import { useState } from 'react';
import { Brain, Loader2, TrendingUp, Target, Lightbulb, AlertTriangle, CheckCircle, Zap, Calendar, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AnalysisResult {
  title: string;
  summary: string;
  marketPosition: {
    currentState: string;
    opportunities: string[];
    threats: string[];
  };
  competitiveAnalysis: {
    strengths: string[];
    differentiators: string[];
    competitorInsights: string[];
  };
  growthRecommendations: {
    shortTerm: string[];
    longTerm: string[];
    metrics: string[];
  };
  trendAnalysis: {
    industryTrends: string[];
    emergingOpportunities: string[];
    risksToWatch: string[];
  };
  actionPlan: {
    immediate: string[];
    quarterly: string[];
    annual: string[];
  };
  score: number;
  generatedAt: string;
}

export function AIMarketAnalysis() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisType, setAnalysisType] = useState<'comprehensive' | 'market-position' | 'competitive' | 'growth' | 'trends'>('comprehensive');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runAnalysis = async () => {
    setIsAnalyzing(true);
    setError(null);
    try {
      const { data, error: funcError } = await supabase.functions.invoke('market-analysis', {
        body: {
          type: 'platform',
          analysisType,
        },
      });

      if (funcError) throw funcError;
      if (data.error) throw new Error(data.error);

      setResult(data.analysis);
      toast.success('Analysis complete!');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Analysis failed';
      setError(message);
      toast.error(message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5" />
          AI Market Analysis
        </CardTitle>
        <CardDescription>
          Get AI-powered insights on market positioning, competitive analysis, and growth opportunities
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Analysis Controls */}
        <div className="flex flex-wrap gap-3">
          <Select value={analysisType} onValueChange={(v) => setAnalysisType(v as typeof analysisType)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Analysis type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="comprehensive">Comprehensive</SelectItem>
              <SelectItem value="market-position">Market Position</SelectItem>
              <SelectItem value="competitive">Competitive Analysis</SelectItem>
              <SelectItem value="growth">Growth Strategy</SelectItem>
              <SelectItem value="trends">Trend Analysis</SelectItem>
            </SelectContent>
          </Select>

          <Button onClick={runAnalysis} disabled={isAnalyzing} className="gap-2">
            {isAnalyzing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Zap className="h-4 w-4" />
                Run Analysis
              </>
            )}
          </Button>
        </div>

        {error && (
          <div className="p-4 bg-destructive/10 text-destructive rounded-lg flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            {error}
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="space-y-6">
            {/* Score & Summary */}
            <div className="grid md:grid-cols-3 gap-4">
              <div className="md:col-span-2 p-4 bg-muted/50 rounded-lg">
                <h3 className="font-semibold text-lg mb-2">{result.title}</h3>
                <p className="text-muted-foreground">{result.summary}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  Generated: {new Date(result.generatedAt).toLocaleString()}
                </p>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg text-center">
                <p className="text-sm text-muted-foreground mb-2">Platform Health Score</p>
                <p className={`text-4xl font-bold ${getScoreColor(result.score)}`}>
                  {result.score}
                </p>
                <Progress value={result.score} className={`mt-2 ${getScoreBg(result.score)}`} />
              </div>
            </div>

            {/* Detailed Analysis Tabs */}
            <Tabs defaultValue="market" className="w-full">
              <TabsList className="grid grid-cols-2 md:grid-cols-5 w-full">
                <TabsTrigger value="market" className="gap-1">
                  <Target className="h-4 w-4" />
                  Market
                </TabsTrigger>
                <TabsTrigger value="competitive" className="gap-1">
                  <TrendingUp className="h-4 w-4" />
                  Competitive
                </TabsTrigger>
                <TabsTrigger value="growth" className="gap-1">
                  <Lightbulb className="h-4 w-4" />
                  Growth
                </TabsTrigger>
                <TabsTrigger value="trends" className="gap-1">
                  <Zap className="h-4 w-4" />
                  Trends
                </TabsTrigger>
                <TabsTrigger value="actions" className="gap-1">
                  <Calendar className="h-4 w-4" />
                  Actions
                </TabsTrigger>
              </TabsList>

              <TabsContent value="market" className="mt-4 space-y-4">
                <div className="p-4 bg-muted/30 rounded-lg">
                  <h4 className="font-medium mb-2">Current Market Position</h4>
                  <p className="text-muted-foreground">{result.marketPosition.currentState}</p>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-4 bg-green-500/10 rounded-lg">
                    <h4 className="font-medium text-green-600 mb-2 flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" />
                      Opportunities
                    </h4>
                    <ul className="space-y-2">
                      {result.marketPosition.opportunities.map((item, i) => (
                        <li key={i} className="text-sm flex items-start gap-2">
                          <ArrowRight className="h-4 w-4 shrink-0 mt-0.5 text-green-500" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="p-4 bg-red-500/10 rounded-lg">
                    <h4 className="font-medium text-red-600 mb-2 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      Threats
                    </h4>
                    <ul className="space-y-2">
                      {result.marketPosition.threats.map((item, i) => (
                        <li key={i} className="text-sm flex items-start gap-2">
                          <ArrowRight className="h-4 w-4 shrink-0 mt-0.5 text-red-500" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="competitive" className="mt-4 space-y-4">
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="p-4 bg-blue-500/10 rounded-lg">
                    <h4 className="font-medium text-blue-600 mb-2">Strengths</h4>
                    <ul className="space-y-2">
                      {result.competitiveAnalysis.strengths.map((item, i) => (
                        <li key={i} className="text-sm flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 shrink-0 mt-0.5 text-blue-500" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="p-4 bg-purple-500/10 rounded-lg">
                    <h4 className="font-medium text-purple-600 mb-2">Differentiators</h4>
                    <ul className="space-y-2">
                      {result.competitiveAnalysis.differentiators.map((item, i) => (
                        <li key={i} className="text-sm flex items-start gap-2">
                          <Zap className="h-4 w-4 shrink-0 mt-0.5 text-purple-500" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="p-4 bg-amber-500/10 rounded-lg">
                    <h4 className="font-medium text-amber-600 mb-2">Competitor Insights</h4>
                    <ul className="space-y-2">
                      {result.competitiveAnalysis.competitorInsights.map((item, i) => (
                        <li key={i} className="text-sm flex items-start gap-2">
                          <Target className="h-4 w-4 shrink-0 mt-0.5 text-amber-500" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="growth" className="mt-4 space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-4 bg-green-500/10 rounded-lg">
                    <h4 className="font-medium text-green-600 mb-2">Short-Term (1-3 months)</h4>
                    <ul className="space-y-2">
                      {result.growthRecommendations.shortTerm.map((item, i) => (
                        <li key={i} className="text-sm flex items-start gap-2">
                          <ArrowRight className="h-4 w-4 shrink-0 mt-0.5 text-green-500" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="p-4 bg-blue-500/10 rounded-lg">
                    <h4 className="font-medium text-blue-600 mb-2">Long-Term (6-12 months)</h4>
                    <ul className="space-y-2">
                      {result.growthRecommendations.longTerm.map((item, i) => (
                        <li key={i} className="text-sm flex items-start gap-2">
                          <ArrowRight className="h-4 w-4 shrink-0 mt-0.5 text-blue-500" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-medium mb-2">Key Metrics to Track</h4>
                  <div className="flex flex-wrap gap-2">
                    {result.growthRecommendations.metrics.map((item, i) => (
                      <Badge key={i} variant="secondary">{item}</Badge>
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="trends" className="mt-4 space-y-4">
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="p-4 bg-indigo-500/10 rounded-lg">
                    <h4 className="font-medium text-indigo-600 mb-2">Industry Trends</h4>
                    <ul className="space-y-2">
                      {result.trendAnalysis.industryTrends.map((item, i) => (
                        <li key={i} className="text-sm flex items-start gap-2">
                          <TrendingUp className="h-4 w-4 shrink-0 mt-0.5 text-indigo-500" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="p-4 bg-emerald-500/10 rounded-lg">
                    <h4 className="font-medium text-emerald-600 mb-2">Emerging Opportunities</h4>
                    <ul className="space-y-2">
                      {result.trendAnalysis.emergingOpportunities.map((item, i) => (
                        <li key={i} className="text-sm flex items-start gap-2">
                          <Lightbulb className="h-4 w-4 shrink-0 mt-0.5 text-emerald-500" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="p-4 bg-orange-500/10 rounded-lg">
                    <h4 className="font-medium text-orange-600 mb-2">Risks to Watch</h4>
                    <ul className="space-y-2">
                      {result.trendAnalysis.risksToWatch.map((item, i) => (
                        <li key={i} className="text-sm flex items-start gap-2">
                          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-orange-500" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="actions" className="mt-4 space-y-4">
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="p-4 bg-red-500/10 rounded-lg border border-red-200 dark:border-red-900">
                    <h4 className="font-medium text-red-600 mb-2 flex items-center gap-2">
                      <Zap className="h-4 w-4" />
                      Immediate (This Week)
                    </h4>
                    <ul className="space-y-2">
                      {result.actionPlan.immediate.map((item, i) => (
                        <li key={i} className="text-sm flex items-start gap-2">
                          <ArrowRight className="h-4 w-4 shrink-0 mt-0.5 text-red-500" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="p-4 bg-yellow-500/10 rounded-lg border border-yellow-200 dark:border-yellow-900">
                    <h4 className="font-medium text-yellow-600 mb-2 flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Quarterly Goals
                    </h4>
                    <ul className="space-y-2">
                      {result.actionPlan.quarterly.map((item, i) => (
                        <li key={i} className="text-sm flex items-start gap-2">
                          <ArrowRight className="h-4 w-4 shrink-0 mt-0.5 text-yellow-500" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="p-4 bg-green-500/10 rounded-lg border border-green-200 dark:border-green-900">
                    <h4 className="font-medium text-green-600 mb-2 flex items-center gap-2">
                      <Target className="h-4 w-4" />
                      Annual Strategy
                    </h4>
                    <ul className="space-y-2">
                      {result.actionPlan.annual.map((item, i) => (
                        <li key={i} className="text-sm flex items-start gap-2">
                          <ArrowRight className="h-4 w-4 shrink-0 mt-0.5 text-green-500" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}

        {/* Empty state */}
        {!result && !isAnalyzing && !error && (
          <div className="text-center py-8 text-muted-foreground">
            <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Click "Run Analysis" to get AI-powered insights about your platform</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
