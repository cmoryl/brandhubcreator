/**
 * Multicultural Intelligence Panel
 * Aggregates multicultural insights from research briefings and brand intelligence
 * Provides actionable recommendations for GlobalLink suite utilization
 */

import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Globe2, TrendingUp, MapPin, Languages, Zap, AlertTriangle, 
  CheckCircle2, Target, Lightbulb, ArrowRight, Brain, RefreshCw,
  BarChart3, Sparkles, ArrowUpDown
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import { CulturalAnalysisGenerator } from './CulturalAnalysisGenerator';

interface MulticulturalInsight {
  market: string;
  readiness: 'high' | 'medium' | 'low';
  culturalConsiderations: string[];
  priorityAdaptations: string[];
}

interface GlobalLinkRecommendation {
  product: string;
  priority: 'high' | 'medium' | 'low';
  useCase: string;
  expectedBenefit: string;
}

interface ResearchBriefingData {
  id: string;
  entity_id: string;
  entity_type: string;
  title: string;
  summary: string;
  confidence_score: number;
  urgency_level: string;
  created_at: string;
  market_intelligence?: {
    industryTrends?: string[];
    emergingOpportunities?: string[];
  };
}

interface BrandIntelligenceData {
  entity_id: string;
  entity_type: string;
  cultural_insights?: {
    global_readiness_score?: number;
    primary_markets?: string[];
    cultural_considerations?: Array<{
      region: string;
      considerations: string[];
    }>;
    localization_priorities?: string[];
  } | null;
  globallink_recommendations?: GlobalLinkRecommendation[] | null;
  localization_readiness_score?: number | null;
  regional_adaptations?: Record<string, unknown> | null;
}

export const MulticulturalIntelligencePanel: React.FC = () => {
  const { organization } = useOrganization();
  const [entitySortBy, setEntitySortBy] = useState<'name' | 'readiness' | 'type'>('readiness');
  const [expandedMarket, setExpandedMarket] = useState<string | null>(null);

  // Fetch research briefings with multicultural insights - scoped to organization
  const { data: briefings, isLoading: briefingsLoading, refetch: refetchBriefings } = useQuery({
    queryKey: ['admin-multicultural-briefings', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];
      
      // Get entity IDs for this organization first
      const [brands, products, events] = await Promise.all([
        supabase.from('brands').select('id').eq('organization_id', organization.id),
        supabase.from('products').select('id').eq('organization_id', organization.id),
        supabase.from('events').select('id').eq('organization_id', organization.id),
      ]);
      
      const entityIds = [
        ...(brands.data?.map(b => b.id) || []),
        ...(products.data?.map(p => p.id) || []),
        ...(events.data?.map(e => e.id) || []),
      ];
      
      if (entityIds.length === 0) return [];
      
      const { data, error } = await supabase
        .from('research_briefings')
        .select('*')
        .in('entity_id', entityIds)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      return (data || []) as ResearchBriefingData[];
    },
    enabled: !!organization?.id,
  });

  // Fetch brand intelligence for cultural insights - scoped to organization
  const { data: intelligenceRecords, isLoading: intelligenceLoading, refetch: refetchIntelligence } = useQuery({
    queryKey: ['admin-multicultural-intelligence', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];
      
      const { data, error } = await supabase
        .from('brand_intelligence')
        .select('entity_id, entity_type, cultural_insights, globallink_recommendations, localization_readiness_score, regional_adaptations')
        .eq('organization_id', organization.id)
        .not('cultural_insights', 'is', null)
        .limit(50);

      if (error) throw error;
      return (data || []) as unknown as BrandIntelligenceData[];
    },
    enabled: !!organization?.id,
  });

  // Fetch entity names for display - scoped to organization
  const { data: entityNames } = useQuery({
    queryKey: ['admin-entity-names', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return new Map<string, string>();
      
      const [brands, products, events] = await Promise.all([
        supabase.from('brands').select('id, name').eq('organization_id', organization.id),
        supabase.from('products').select('id, name').eq('organization_id', organization.id),
        supabase.from('events').select('id, name').eq('organization_id', organization.id),
      ]);

      const nameMap = new Map<string, string>();
      brands.data?.forEach(b => nameMap.set(b.id, b.name));
      products.data?.forEach(p => nameMap.set(p.id, p.name));
      events.data?.forEach(e => nameMap.set(e.id, e.name));
      return nameMap;
    },
    enabled: !!organization?.id,
  });

  // Aggregate GlobalLink recommendations across all entities
  const aggregatedGLRecommendations = useMemo(() => {
    const productCounts: Record<string, { count: number; highPriority: number; useCases: Set<string> }> = {
      Translation: { count: 0, highPriority: 0, useCases: new Set() },
      AI: { count: 0, highPriority: 0, useCases: new Set() },
      Connect: { count: 0, highPriority: 0, useCases: new Set() },
      Fluent: { count: 0, highPriority: 0, useCases: new Set() },
    };

    intelligenceRecords?.forEach(record => {
      const rawRecs = record.globallink_recommendations;
      const recommendations = Array.isArray(rawRecs) ? rawRecs : [];
      recommendations.forEach((rec: any) => {
        const product = rec.product || 'Translation';
        if (productCounts[product]) {
          productCounts[product].count++;
          if (rec.priority === 'high') productCounts[product].highPriority++;
          if (rec.useCase) productCounts[product].useCases.add(rec.useCase);
        }
      });
    });

    return productCounts;
  }, [intelligenceRecords]);

  // Calculate global readiness stats
  const readinessStats = useMemo(() => {
    const scores = intelligenceRecords
      ?.map(r => r.localization_readiness_score || r.cultural_insights?.global_readiness_score)
      .filter((s): s is number => s !== undefined && s !== null) || [];

    if (scores.length === 0) return { avg: 0, high: 0, medium: 0, low: 0 };

    const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    return {
      avg,
      high: scores.filter(s => s >= 70).length,
      medium: scores.filter(s => s >= 40 && s < 70).length,
      low: scores.filter(s => s < 40).length,
    };
  }, [intelligenceRecords]);

  // Extract unique markets mentioned with entity details
  const marketOpportunities = useMemo(() => {
    const markets = new Map<string, { 
      mentions: number; 
      readiness: string[];
      entities: Array<{ id: string; name: string; type: string; readinessScore: number; culturalNotes: string[] }>;
    }>();

    intelligenceRecords?.forEach(record => {
      const culturalInsights = record.cultural_insights as any;
      if (culturalInsights?.primary_markets) {
        const entityName = entityNames?.get(record.entity_id) || record.entity_id.slice(0, 8);
        const readinessScore = record.localization_readiness_score || culturalInsights?.global_readiness_score || 0;

        culturalInsights.primary_markets.forEach((market: string) => {
          const existing = markets.get(market) || { mentions: 0, readiness: [], entities: [] };
          existing.mentions++;

          // Collect cultural notes relevant to this market
          const culturalNotes: string[] = [];
          if (Array.isArray(culturalInsights?.cultural_considerations)) {
            culturalInsights.cultural_considerations.forEach((c: any) => {
              const note = typeof c === 'string' ? c : c?.text || c?.description;
              if (note) culturalNotes.push(note);
            });
          }
          if (Array.isArray(culturalInsights?.priority_adaptations)) {
            culturalInsights.priority_adaptations.forEach((a: any) => {
              const note = typeof a === 'string' ? a : a?.text || a?.description;
              if (note) culturalNotes.push(note);
            });
          }

          existing.entities.push({
            id: record.entity_id,
            name: entityName,
            type: record.entity_type,
            readinessScore,
            culturalNotes: culturalNotes.slice(0, 3),
          });
          markets.set(market, existing);
        });
      }
    });

    return Array.from(markets.entries())
      .sort((a, b) => b[1].mentions - a[1].mentions)
      .slice(0, 10);
  }, [intelligenceRecords, entityNames]);

  const sortedEntityRecords = useMemo(() => {
    const filtered = intelligenceRecords?.filter(r => r.cultural_insights) || [];
    return [...filtered].sort((a, b) => {
      const nameA = entityNames?.get(a.entity_id) || '';
      const nameB = entityNames?.get(b.entity_id) || '';
      const scoreA = a.localization_readiness_score || (a.cultural_insights as any)?.global_readiness_score || 0;
      const scoreB = b.localization_readiness_score || (b.cultural_insights as any)?.global_readiness_score || 0;
      switch (entitySortBy) {
        case 'name': return nameA.localeCompare(nameB);
        case 'readiness': return scoreB - scoreA;
        case 'type': return a.entity_type.localeCompare(b.entity_type) || nameA.localeCompare(nameB);
        default: return 0;
      }
    });
  }, [intelligenceRecords, entityNames, entitySortBy]);

  const isLoading = briefingsLoading || intelligenceLoading;

  const handleRefresh = () => {
    refetchBriefings();
    refetchIntelligence();
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'medium': return 'bg-warning/10 text-warning border-warning/20';
      case 'low': return 'bg-primary/10 text-primary border-primary/20';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getReadinessColor = (score: number) => {
    if (score >= 70) return 'text-primary';
    if (score >= 40) return 'text-warning';
    return 'text-destructive';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl">
              <Globe2 className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Multicultural Intelligence</h2>
              <p className="text-muted-foreground">
                AI-powered insights for global brand expansion & localization
              </p>
            </div>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Avg Readiness Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <span className={`text-3xl font-bold ${getReadinessColor(readinessStats.avg)}`}>
                {readinessStats.avg}%
              </span>
              <Progress value={readinessStats.avg} className="flex-1" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Target className="h-4 w-4" />
              Market Ready
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-primary">{readinessStats.high}</span>
              <span className="text-muted-foreground">brands/products</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Score ≥70%</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Brain className="h-4 w-4" />
              Research Briefings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold">{briefings?.length || 0}</span>
              <span className="text-muted-foreground">generated</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Target Markets
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold">{marketOpportunities.length}</span>
              <span className="text-muted-foreground">identified</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="generate" className="space-y-4">
        <TabsList>
          <TabsTrigger value="generate" className="gap-2">
            <Sparkles className="h-4 w-4" />
            Generate Analysis
          </TabsTrigger>
          <TabsTrigger value="globallink" className="gap-2">
            <Zap className="h-4 w-4" />
            GlobalLink Recommendations
          </TabsTrigger>
          <TabsTrigger value="markets" className="gap-2">
            <MapPin className="h-4 w-4" />
            Market Opportunities
          </TabsTrigger>
          <TabsTrigger value="insights" className="gap-2">
            <Lightbulb className="h-4 w-4" />
            Cultural Insights
          </TabsTrigger>
        </TabsList>

        {/* Generate Analysis Tab */}
        <TabsContent value="generate" className="space-y-4">
          <CulturalAnalysisGenerator />
        </TabsContent>

        {/* GlobalLink Recommendations Tab */}
        <TabsContent value="globallink" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(aggregatedGLRecommendations).map(([product, data]) => (
              <Card key={product} className={data.highPriority > 0 ? 'border-primary/30' : ''}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      {product === 'Translation' && <Languages className="h-5 w-5 text-blue-500" />}
                      {product === 'AI' && <Brain className="h-5 w-5 text-purple-500" />}
                      {product === 'Connect' && <Zap className="h-5 w-5 text-amber-500" />}
                      {product === 'Fluent' && <Globe2 className="h-5 w-5 text-green-500" />}
                      GlobalLink {product}
                    </CardTitle>
                    {data.highPriority > 0 && (
                      <Badge variant="destructive" className="text-xs">
                        {data.highPriority} high priority
                      </Badge>
                    )}
                  </div>
                  <CardDescription>
                    {data.count} recommendations across entities
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {data.useCases.size > 0 ? (
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground">Top Use Cases:</p>
                      <ul className="space-y-1">
                        {Array.from(data.useCases).slice(0, 3).map((useCase, idx) => (
                          <li key={idx} className="text-sm flex items-start gap-2">
                            <ArrowRight className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                            <span>{useCase}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No specific recommendations yet. Generate research briefings to populate.
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Market Opportunities Tab */}
        <TabsContent value="markets" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Expansion Opportunities by Market
              </CardTitle>
              <CardDescription>
                Markets identified across brand research and intelligence analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              {marketOpportunities.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {marketOpportunities.map(([market, data]) => {
                    const isExpanded = expandedMarket === market;
                    return (
                      <div 
                        key={market}
                        className={cn(
                          "rounded-lg border bg-card transition-all cursor-pointer",
                          isExpanded ? "md:col-span-2 ring-1 ring-primary/30" : "hover:bg-muted/50"
                        )}
                        onClick={() => setExpandedMarket(isExpanded ? null : market)}
                      >
                        <div className="flex items-center justify-between p-3">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-lg">
                              <MapPin className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium">{market}</p>
                              <p className="text-xs text-muted-foreground">
                                {data.mentions} {data.mentions === 1 ? 'mention' : 'mentions'} across entities
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">Opportunity</Badge>
                            <ArrowRight className={cn("h-4 w-4 text-muted-foreground transition-transform", isExpanded && "rotate-90")} />
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="border-t px-4 py-3 space-y-3">
                            <p className="text-sm font-medium text-muted-foreground">
                              Mentioned by {data.entities.length} {data.entities.length === 1 ? 'entity' : 'entities'}
                            </p>
                            <div className="space-y-2">
                              {data.entities.map((entity) => (
                                <div key={entity.id} className="p-3 rounded-md border bg-muted/30">
                                  <div className="flex items-center justify-between mb-1">
                                    <div className="flex items-center gap-2">
                                      <Badge variant="secondary" className="text-[10px] h-5 capitalize">{entity.type}</Badge>
                                      <span className="text-sm font-medium">{entity.name}</span>
                                    </div>
                                    <span className={cn("text-sm font-semibold", getReadinessColor(entity.readinessScore))}>
                                      {Math.round(entity.readinessScore)}% ready
                                    </span>
                                  </div>
                                  <Progress value={entity.readinessScore} className="h-1.5 my-1.5" />
                                  {entity.culturalNotes.length > 0 && (
                                    <ul className="mt-2 space-y-1">
                                      {entity.culturalNotes.map((note, i) => (
                                        <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                                          <Lightbulb className="h-3 w-3 shrink-0 mt-0.5 text-primary" />
                                          {note}
                                        </li>
                                      ))}
                                    </ul>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Globe2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No market opportunities identified yet.</p>
                  <p className="text-sm">Run brand analysis to discover expansion opportunities.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Cultural Insights Tab */}
        <TabsContent value="insights" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5" />
                Cultural Considerations by Entity
              </CardTitle>
              <CardDescription>
                Localization priorities and cultural adaptations from AI analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 mb-4">
                <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
                <Select value={entitySortBy} onValueChange={(v) => setEntitySortBy(v as 'name' | 'readiness' | 'type')}>
                  <SelectTrigger className="w-[160px] h-8 text-xs">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">Name</SelectItem>
                    <SelectItem value="readiness">Readiness</SelectItem>
                    <SelectItem value="type">Type</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <ScrollArea className="h-[400px]">
                <div className="space-y-4">
                  {sortedEntityRecords.map((record) => {
                    const entityName = entityNames?.get(record.entity_id) || record.entity_id.slice(0, 8);
                    const insights = record.cultural_insights;
                    const score = record.localization_readiness_score || insights?.global_readiness_score || 0;

                    return (
                      <div 
                        key={record.entity_id}
                        className="p-4 rounded-lg border bg-card"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className="font-semibold">{entityName}</h4>
                            <Badge variant="secondary" className="text-xs mt-1">
                              {record.entity_type}
                            </Badge>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground">Readiness</p>
                            <p className={`text-lg font-bold ${getReadinessColor(score)}`}>
                              {score}%
                            </p>
                          </div>
                        </div>

                        {insights?.primary_markets && insights.primary_markets.length > 0 && (
                          <div className="mb-2">
                            <p className="text-xs font-medium text-muted-foreground mb-1">Primary Markets</p>
                            <div className="flex flex-wrap gap-1">
                              {insights.primary_markets.slice(0, 5).map((market, idx) => (
                                <Badge key={idx} variant="outline" className="text-xs">
                                  {market}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {insights?.localization_priorities && insights.localization_priorities.length > 0 && (
                          <div>
                            <p className="text-xs font-medium text-muted-foreground mb-1">Localization Priorities</p>
                            <ul className="text-sm space-y-1">
                              {insights.localization_priorities.slice(0, 3).map((priority, idx) => (
                                <li key={idx} className="flex items-start gap-2">
                                  <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                                  <span>{priority}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {(!intelligenceRecords || intelligenceRecords.filter(r => r.cultural_insights).length === 0) && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Brain className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>No cultural insights available yet.</p>
                      <p className="text-sm">Run brand intelligence analysis to generate insights.</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MulticulturalIntelligencePanel;
