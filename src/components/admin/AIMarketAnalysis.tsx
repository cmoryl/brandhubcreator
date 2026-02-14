import { useState, useEffect } from 'react';
import { exportMarketAnalysisHtml } from '@/lib/exportHtml';
import { 
  Brain, Loader2, TrendingUp, Target, Lightbulb, AlertTriangle, CheckCircle, 
  Zap, Calendar, ArrowRight, Building2, Package, Users, BarChart3, 
  Globe, Share2, MessageCircle, Eye, RefreshCw, ChevronDown, ChevronUp,
  Sparkles, LineChart, PieChart, Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

interface BrandSummary {
  id: string;
  name: string;
  isPublic: boolean;
  hasIdentity: boolean;
  hasColors: boolean;
  hasSocial: boolean;
  valueCount: number;
  serviceCount: number;
}

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
  socialSentiment?: {
    overallScore: number;
    platforms: { name: string; score: number; trend: 'up' | 'down' | 'stable' }[];
    keyTopics: string[];
    recommendations: string[];
  };
  competitorBenchmark?: {
    position: string;
    competitors: { name: string; strength: string; weakness: string }[];
    gaps: string[];
  };
  score: number;
  generatedAt: string;
}

interface StoredAnalysis {
  brandId: string;
  brandName: string;
  analysis: AnalysisResult;
  analysisType: string;
}

export function AIMarketAnalysis() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisType, setAnalysisType] = useState<'comprehensive' | 'market-position' | 'competitive' | 'growth' | 'trends' | 'social-sentiment'>('comprehensive');
  const [selectedBrand, setSelectedBrand] = useState<string>('platform');
  const [brands, setBrands] = useState<BrandSummary[]>([]);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [savedAnalyses, setSavedAnalyses] = useState<StoredAnalysis[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [loadingBrands, setLoadingBrands] = useState(true);

  // Load brands on mount
  useEffect(() => {
    fetchBrands();
    loadSavedAnalyses();
  }, []);

  const fetchBrands = async () => {
    setLoadingBrands(true);
    try {
      const { data, error } = await supabase
        .from('brands')
        .select('id, name, is_public, guide_data')
        .order('name');

      if (error) throw error;

      const brandSummaries: BrandSummary[] = (data || []).map(b => {
        const guide = b.guide_data as Record<string, unknown>;
        const identity = guide?.identity as Record<string, unknown> | undefined;
        const values = guide?.values as unknown[] | undefined;
        const services = guide?.services as unknown[] | undefined;
        const colors = guide?.colors as unknown[] | undefined;
        const social = guide?.social as unknown[] | undefined;

        return {
          id: b.id,
          name: b.name,
          isPublic: b.is_public,
          hasIdentity: !!(identity?.missionStatement || identity?.archetype),
          hasColors: (colors?.length || 0) > 0,
          hasSocial: (social?.length || 0) > 0,
          valueCount: values?.length || 0,
          serviceCount: services?.length || 0,
        };
      });

      setBrands(brandSummaries);
    } catch (err) {
      console.error('Error fetching brands:', err);
    } finally {
      setLoadingBrands(false);
    }
  };

  const loadSavedAnalyses = () => {
    try {
      const saved = localStorage.getItem('market_analyses');
      if (saved) {
        setSavedAnalyses(JSON.parse(saved));
      }
    } catch {
      console.error('Failed to load saved analyses');
    }
  };

  const saveAnalysis = (brandId: string, brandName: string, analysis: AnalysisResult, type: string) => {
    const newAnalysis: StoredAnalysis = { brandId, brandName, analysis, analysisType: type };
    const updated = [newAnalysis, ...savedAnalyses.filter(a => !(a.brandId === brandId && a.analysisType === type))].slice(0, 20);
    setSavedAnalyses(updated);
    localStorage.setItem('market_analyses', JSON.stringify(updated));
  };

  const runAnalysis = async () => {
    setIsAnalyzing(true);
    setError(null);
    try {
      const isPlatform = selectedBrand === 'platform';
      const brand = brands.find(b => b.id === selectedBrand);

      const { data, error: funcError } = await supabase.functions.invoke('market-analysis', {
        body: {
          type: isPlatform ? 'platform' : 'brand',
          entityId: isPlatform ? undefined : selectedBrand,
          analysisType,
        },
      });

      if (funcError) throw funcError;
      if (data.error) throw new Error(data.error);

      setResult(data.analysis);
      
      // Save for history
      saveAnalysis(
        selectedBrand, 
        isPlatform ? 'Platform Overview' : (brand?.name || 'Unknown'), 
        data.analysis, 
        analysisType
      );

      toast.success('Analysis complete!');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Analysis failed';
      setError(message);
      toast.error(message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const loadHistoricalAnalysis = (stored: StoredAnalysis) => {
    setResult(stored.analysis);
    setSelectedBrand(stored.brandId);
    setAnalysisType(stored.analysisType as typeof analysisType);
    setShowHistory(false);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getScoreBadge = (score: number) => {
    if (score >= 80) return <Badge className="bg-green-500">Excellent</Badge>;
    if (score >= 60) return <Badge className="bg-yellow-500">Good</Badge>;
    return <Badge className="bg-red-500">Needs Work</Badge>;
  };

  const selectedBrandData = brands.find(b => b.id === selectedBrand);

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Market Intelligence Center
          </CardTitle>
          <CardDescription className="flex items-center gap-2 flex-wrap">
            AI-powered competitor analysis, market positioning, social sentiment, and trend forecasting
            {result?.generatedAt && (
              <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-muted">
                <Clock className="h-3 w-3" />
                Last run {formatDistanceToNow(new Date(result.generatedAt), { addSuffix: true })}
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Brand Selection & Controls */}
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium mb-1.5 block">Analyze</label>
              <Select value={selectedBrand} onValueChange={setSelectedBrand} disabled={loadingBrands}>
                <SelectTrigger>
                  <SelectValue placeholder="Select brand or platform" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="platform">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="h-4 w-4" />
                      Platform Overview
                    </div>
                  </SelectItem>
                  {brands.map(brand => (
                    <SelectItem key={brand.id} value={brand.id}>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        {brand.name}
                        {brand.isPublic && <Eye className="h-3 w-3 text-green-500" />}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="min-w-[180px]">
              <label className="text-sm font-medium mb-1.5 block">Report Type</label>
              <Select value={analysisType} onValueChange={(v) => setAnalysisType(v as typeof analysisType)}>
                <SelectTrigger>
                  <SelectValue placeholder="Analysis type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="comprehensive">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4" />
                      Comprehensive
                    </div>
                  </SelectItem>
                  <SelectItem value="market-position">
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4" />
                      Market Position
                    </div>
                  </SelectItem>
                  <SelectItem value="competitive">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Competitor Analysis
                    </div>
                  </SelectItem>
                  <SelectItem value="social-sentiment">
                    <div className="flex items-center gap-2">
                      <MessageCircle className="h-4 w-4" />
                      Social Sentiment
                    </div>
                  </SelectItem>
                  <SelectItem value="growth">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Growth Strategy
                    </div>
                  </SelectItem>
                  <SelectItem value="trends">
                    <div className="flex items-center gap-2">
                      <LineChart className="h-4 w-4" />
                      Trend Forecast
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

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

          {/* Brand Data Quality Indicator */}
          {selectedBrand !== 'platform' && selectedBrandData && (
            <div className="p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Brand Data Completeness</span>
                <span className="text-sm text-muted-foreground">{selectedBrandData.name}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant={selectedBrandData.hasIdentity ? "default" : "outline"}>
                  {selectedBrandData.hasIdentity ? <CheckCircle className="h-3 w-3 mr-1" /> : null}
                  Identity
                </Badge>
                <Badge variant={selectedBrandData.hasColors ? "default" : "outline"}>
                  {selectedBrandData.hasColors ? <CheckCircle className="h-3 w-3 mr-1" /> : null}
                  Colors
                </Badge>
                <Badge variant={selectedBrandData.valueCount > 0 ? "default" : "outline"}>
                  {selectedBrandData.valueCount} Values
                </Badge>
                <Badge variant={selectedBrandData.serviceCount > 0 ? "default" : "outline"}>
                  {selectedBrandData.serviceCount} Services
                </Badge>
                <Badge variant={selectedBrandData.hasSocial ? "default" : "outline"}>
                  {selectedBrandData.hasSocial ? <CheckCircle className="h-3 w-3 mr-1" /> : null}
                  Social
                </Badge>
              </div>
            </div>
          )}

          {/* History Toggle */}
          {savedAnalyses.length > 0 && (
            <Collapsible open={showHistory} onOpenChange={setShowHistory}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2">
                  {showHistory ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  Previous Reports ({savedAnalyses.length})
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {savedAnalyses.slice(0, 6).map((saved, i) => (
                    <button
                      key={i}
                      onClick={() => loadHistoricalAnalysis(saved)}
                      className="p-3 text-left bg-muted/30 hover:bg-muted/50 rounded-lg transition-colors"
                    >
                      <p className="font-medium text-sm truncate">{saved.brandName}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">{saved.analysisType}</Badge>
                        <span className="text-xs text-muted-foreground">
                          Score: {saved.analysis.score}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          )}
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              {error}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {result && (
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle>{result.title}</CardTitle>
                <CardDescription>{result.summary}</CardDescription>
              </div>
              <div className="text-right">
                <div className={`text-4xl font-bold ${getScoreColor(result.score)}`}>
                  {result.score}
                </div>
                {getScoreBadge(result.score)}
                <p className="text-xs text-muted-foreground mt-1">
                  {new Date(result.generatedAt).toLocaleDateString()}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 mt-2"
                  onClick={() => {
                    const brandName = selectedBrand === 'platform' ? 'Platform' : (brands.find(b => b.id === selectedBrand)?.name || 'Brand');
                    exportMarketAnalysisHtml(result, { brandName, analysisType });
                    toast.success('HTML report downloaded');
                  }}
                >
                  <ArrowRight className="h-3.5 w-3.5" />
                  Export HTML
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="market" className="w-full">
              <TabsList className="grid grid-cols-3 md:grid-cols-6 w-full">
                <TabsTrigger value="market" className="gap-1">
                  <Target className="h-4 w-4" />
                  <span className="hidden sm:inline">Market</span>
                </TabsTrigger>
                <TabsTrigger value="competitive" className="gap-1">
                  <Users className="h-4 w-4" />
                  <span className="hidden sm:inline">Competitors</span>
                </TabsTrigger>
                <TabsTrigger value="social" className="gap-1">
                  <MessageCircle className="h-4 w-4" />
                  <span className="hidden sm:inline">Social</span>
                </TabsTrigger>
                <TabsTrigger value="growth" className="gap-1">
                  <TrendingUp className="h-4 w-4" />
                  <span className="hidden sm:inline">Growth</span>
                </TabsTrigger>
                <TabsTrigger value="trends" className="gap-1">
                  <LineChart className="h-4 w-4" />
                  <span className="hidden sm:inline">Trends</span>
                </TabsTrigger>
                <TabsTrigger value="actions" className="gap-1">
                  <Calendar className="h-4 w-4" />
                  <span className="hidden sm:inline">Actions</span>
                </TabsTrigger>
              </TabsList>

              {/* Market Position Tab */}
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

              {/* Competitive Analysis Tab */}
              <TabsContent value="competitive" className="mt-4 space-y-4">
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="p-4 bg-blue-500/10 rounded-lg">
                    <h4 className="font-medium text-blue-600 mb-2">Your Strengths</h4>
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
                    <h4 className="font-medium text-purple-600 mb-2">Key Differentiators</h4>
                    <ul className="space-y-2">
                      {result.competitiveAnalysis.differentiators.map((item, i) => (
                        <li key={i} className="text-sm flex items-start gap-2">
                          <Sparkles className="h-4 w-4 shrink-0 mt-0.5 text-purple-500" />
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
                          <Eye className="h-4 w-4 shrink-0 mt-0.5 text-amber-500" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </TabsContent>

              {/* Social Sentiment Tab */}
              <TabsContent value="social" className="mt-4 space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-4 bg-muted/30 rounded-lg">
                    <h4 className="font-medium mb-3">Social Media Presence Analysis</h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      Based on your brand's social profiles and marketing positioning
                    </p>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Brand Consistency</span>
                        <Progress value={result.score * 0.9} className="w-24" />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Voice Clarity</span>
                        <Progress value={result.score * 0.85} className="w-24" />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Visual Identity</span>
                        <Progress value={result.score * 0.95} className="w-24" />
                      </div>
                    </div>
                  </div>
                  <div className="p-4 bg-indigo-500/10 rounded-lg">
                    <h4 className="font-medium text-indigo-600 mb-2">Recommended Actions</h4>
                    <ul className="space-y-2">
                      {result.trendAnalysis.emergingOpportunities.map((item, i) => (
                        <li key={i} className="text-sm flex items-start gap-2">
                          <Share2 className="h-4 w-4 shrink-0 mt-0.5 text-indigo-500" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </TabsContent>

              {/* Growth Tab */}
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

              {/* Trends Tab */}
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

              {/* Action Plan Tab */}
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
          </CardContent>
        </Card>
      )}

      {/* Empty state */}
      {!result && !isAnalyzing && !error && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-muted-foreground">
              <Brain className="h-16 w-16 mx-auto mb-4 opacity-30" />
              <h3 className="text-lg font-medium mb-2">Ready to Analyze</h3>
              <p className="max-w-md mx-auto">
                Select a brand or the entire platform, choose your report type, and click "Run Analysis" to get AI-powered market intelligence based on your brand guide data.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
