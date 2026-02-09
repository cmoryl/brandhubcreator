import React, { useState, useEffect } from 'react';
import { 
  Lightbulb, 
  TrendingUp, 
  Target, 
  AlertTriangle, 
  Sparkles,
  ChevronDown,
  ChevronUp,
  Clock,
  CheckCircle2,
  Archive,
  RefreshCw,
  Zap,
  BarChart3,
  Shield,
  Rocket,
  Brain,
  Eye
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useResearchBriefings, ResearchBriefing } from '@/hooks/useResearchBriefings';
import { formatDistanceToNow } from 'date-fns';

interface BrandResearchBriefingProps {
  entityId: string;
  entityType: 'brand' | 'product' | 'event';
  entityName: string;
}

export function BrandResearchBriefing({ entityId, entityType, entityName }: BrandResearchBriefingProps) {
  const { 
    briefings,
    latestBriefing,
    isLoading,
    isGenerating,
    generateBriefing,
    markAsRead,
    markAsActioned,
    archiveBriefing,
  } = useResearchBriefings(entityId, entityType);

  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['priorities']));

  // Mark as read when viewing
  useEffect(() => {
    if (latestBriefing && latestBriefing.status === 'new') {
      markAsRead(latestBriefing.id);
    }
  }, [latestBriefing, markAsRead]);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(section)) {
        newSet.delete(section);
      } else {
        newSet.add(section);
      }
      return newSet;
    });
  };

  const getUrgencyColor = (level: string) => {
    switch (level) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'normal': return 'bg-blue-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-muted';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'outline';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'moderate': return 'default';
      case 'low': return 'secondary';
      default: return 'outline';
    }
  };

  if (isLoading) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex items-center justify-center py-12">
          <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!latestBriefing) {
    return (
      <Card className="border-dashed bg-gradient-to-br from-primary/5 to-accent/5">
        <CardContent className="flex flex-col items-center justify-center py-12 space-y-4">
          <div className="p-4 rounded-full bg-primary/10">
            <Brain className="h-8 w-8 text-primary" />
          </div>
          <div className="text-center space-y-2">
            <h3 className="font-semibold text-lg">Brand Research Intelligence</h3>
            <p className="text-muted-foreground text-sm max-w-md">
              Generate AI-powered research briefings with market intelligence, 
              competitive insights, and strategic recommendations for {entityName}.
            </p>
          </div>
          <Button 
            onClick={() => generateBriefing()} 
            disabled={isGenerating}
            className="mt-4"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Generating Research...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Generate First Briefing
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  const briefing = latestBriefing;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3 bg-gradient-to-r from-primary/5 via-accent/5 to-transparent">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">{briefing.title}</CardTitle>
            </div>
            <CardDescription className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatDistanceToNow(new Date(briefing.created_at), { addSuffix: true })}
              </span>
              <Badge variant="outline" className="text-xs">
                {briefing.briefing_type}
              </Badge>
              <Badge className={`${getUrgencyColor(briefing.urgency_level)} text-white text-xs`}>
                {briefing.urgency_level} urgency
              </Badge>
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {briefing.status !== 'actioned' && (
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => markAsActioned(briefing.id)}
              >
                <CheckCircle2 className="h-4 w-4 mr-1" />
                Mark Actioned
              </Button>
            )}
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => archiveBriefing(briefing.id)}
            >
              <Archive className="h-4 w-4" />
            </Button>
            <Button 
              size="sm" 
              onClick={() => generateBriefing()}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Confidence Score */}
        <div className="mt-4 space-y-1">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Research Confidence</span>
            <span className="font-medium">{briefing.confidence_score}%</span>
          </div>
          <Progress value={briefing.confidence_score} className="h-2" />
        </div>

        {/* Summary */}
        {briefing.summary && (
          <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
            {briefing.summary}
          </p>
        )}
      </CardHeader>

      <CardContent className="p-0">
        <Tabs defaultValue="priorities" className="w-full">
          <TabsList className="w-full justify-start rounded-none border-b bg-transparent h-auto p-0">
            <TabsTrigger 
              value="priorities" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
            >
              <Zap className="h-4 w-4 mr-1.5" />
              Priorities
            </TabsTrigger>
            <TabsTrigger 
              value="intelligence"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
            >
              <BarChart3 className="h-4 w-4 mr-1.5" />
              Intelligence
            </TabsTrigger>
            <TabsTrigger 
              value="strategy"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
            >
              <Target className="h-4 w-4 mr-1.5" />
              Strategy
            </TabsTrigger>
            <TabsTrigger 
              value="risks"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
            >
              <Shield className="h-4 w-4 mr-1.5" />
              Risks
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[400px]">
            <div className="p-4">
              <TabsContent value="priorities" className="mt-0 space-y-4">
                {/* Priority Actions */}
                <div className="space-y-3">
                  <h4 className="font-medium flex items-center gap-2">
                    <Zap className="h-4 w-4 text-yellow-500" />
                    Priority Actions
                  </h4>
                  <div className="space-y-2">
                    {briefing.priority_actions?.map((action, i) => (
                      <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-yellow-500/5 border border-yellow-500/20">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-yellow-500/20 flex items-center justify-center text-xs font-medium text-yellow-600">
                          {i + 1}
                        </span>
                        <p className="text-sm">{action}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Suggested Updates */}
                {briefing.suggested_updates && briefing.suggested_updates.length > 0 && (
                  <Collapsible open={expandedSections.has('updates')} onOpenChange={() => toggleSection('updates')}>
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" className="w-full justify-between p-0 h-auto hover:bg-transparent">
                        <h4 className="font-medium flex items-center gap-2">
                          <Lightbulb className="h-4 w-4 text-blue-500" />
                          Suggested Brand Updates
                          <Badge variant="secondary" className="ml-2">{briefing.suggested_updates.length}</Badge>
                        </h4>
                        {expandedSections.has('updates') ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="pt-3">
                      <div className="space-y-3">
                        {briefing.suggested_updates.map((update, i) => (
                          <div key={i} className="p-3 rounded-lg bg-blue-500/5 border border-blue-500/20 space-y-2">
                            <div className="flex items-center justify-between">
                              <Badge variant="outline">{update.section}</Badge>
                            </div>
                            <p className="text-sm"><strong>Current:</strong> {update.currentState}</p>
                            <p className="text-sm text-primary"><strong>Suggested:</strong> {update.suggestedChange}</p>
                            <p className="text-xs text-muted-foreground">{update.reason}</p>
                          </div>
                        ))}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                )}
              </TabsContent>

              <TabsContent value="intelligence" className="mt-0 space-y-4">
                {/* Market Intelligence */}
                <div className="space-y-3">
                  <h4 className="font-medium flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-green-500" />
                    Market Intelligence
                  </h4>
                  
                  <div className="grid gap-3">
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-xs font-medium text-muted-foreground mb-2">Industry Trends</p>
                      <ul className="space-y-1">
                        {briefing.market_intelligence?.industryTrends?.map((trend, i) => (
                          <li key={i} className="text-sm flex items-start gap-2">
                            <span className="text-green-500 mt-1">•</span>
                            {trend}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-xs font-medium text-muted-foreground mb-2">Emerging Opportunities</p>
                      <ul className="space-y-1">
                        {briefing.market_intelligence?.emergingOpportunities?.map((opp, i) => (
                          <li key={i} className="text-sm flex items-start gap-2">
                            <span className="text-blue-500 mt-1">•</span>
                            {opp}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Competitive Insights */}
                <div className="space-y-3">
                  <h4 className="font-medium flex items-center gap-2">
                    <Target className="h-4 w-4 text-purple-500" />
                    Competitive Insights
                  </h4>
                  
                  <div className="grid gap-3">
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-xs font-medium text-muted-foreground mb-2">Differentiation Opportunities</p>
                      <ul className="space-y-1">
                        {briefing.competitive_insights?.differentiationOpportunities?.map((diff, i) => (
                          <li key={i} className="text-sm flex items-start gap-2">
                            <span className="text-purple-500 mt-1">•</span>
                            {diff}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-xs font-medium text-muted-foreground mb-2">Positioning Gaps</p>
                      <ul className="space-y-1">
                        {briefing.competitive_insights?.positioningGaps?.map((gap, i) => (
                          <li key={i} className="text-sm flex items-start gap-2">
                            <span className="text-orange-500 mt-1">•</span>
                            {gap}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Trend Analysis */}
                <div className="space-y-3">
                  <h4 className="font-medium flex items-center gap-2">
                    <Eye className="h-4 w-4 text-cyan-500" />
                    Trend Analysis
                  </h4>
                  
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="p-3 rounded-lg bg-green-500/5 border border-green-500/20">
                      <p className="text-xs font-medium text-green-600 mb-2">Rising Trends</p>
                      <ul className="space-y-1">
                        {briefing.trend_analysis?.risingTrends?.map((trend, i) => (
                          <li key={i} className="text-sm">↗ {trend}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-3 rounded-lg bg-red-500/5 border border-red-500/20">
                      <p className="text-xs font-medium text-red-600 mb-2">Declining Trends</p>
                      <ul className="space-y-1">
                        {briefing.trend_analysis?.decliningTrends?.map((trend, i) => (
                          <li key={i} className="text-sm">↘ {trend}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="strategy" className="mt-0 space-y-4">
                {/* Strategic Recommendations */}
                <div className="space-y-3">
                  <h4 className="font-medium flex items-center gap-2">
                    <Rocket className="h-4 w-4 text-primary" />
                    Strategic Recommendations
                  </h4>
                  
                  <div className="space-y-3">
                    {briefing.strategic_recommendations?.map((rec, i) => (
                      <div key={i} className="p-4 rounded-lg border bg-card">
                        <div className="flex items-center justify-between mb-2">
                          <Badge variant={getPriorityColor(rec.priority) as any}>
                            {rec.priority} priority
                          </Badge>
                          <span className="text-xs text-muted-foreground">{rec.timeframe}</span>
                        </div>
                        <p className="font-medium text-sm mb-1">{rec.action}</p>
                        <p className="text-xs text-muted-foreground">{rec.rationale}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Growth Opportunities */}
                <div className="space-y-3">
                  <h4 className="font-medium flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-green-500" />
                    Growth Opportunities
                  </h4>
                  
                  <div className="space-y-3">
                    {briefing.growth_opportunities?.map((opp, i) => (
                      <div key={i} className="p-4 rounded-lg bg-green-500/5 border border-green-500/20">
                        <p className="font-medium text-sm mb-2">{opp.opportunity}</p>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-muted-foreground">Potential Impact:</span>
                            <p>{opp.potentialImpact}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Investment Required:</span>
                            <p>{opp.requiredInvestment}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="risks" className="mt-0 space-y-4">
                {/* Risk Alerts */}
                <div className="space-y-3">
                  <h4 className="font-medium flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                    Risk Alerts
                  </h4>
                  
                  <div className="space-y-3">
                    {briefing.risk_alerts?.map((risk, i) => (
                      <div key={i} className="p-4 rounded-lg border bg-card">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant={getSeverityColor(risk.severity) as any}>
                            {risk.severity}
                          </Badge>
                        </div>
                        <p className="font-medium text-sm mb-2">{risk.risk}</p>
                        <div className="p-2 rounded bg-muted/50">
                          <p className="text-xs">
                            <strong>Mitigation:</strong> {risk.mitigation}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Threat Assessment */}
                <div className="space-y-3">
                  <h4 className="font-medium flex items-center gap-2">
                    <Shield className="h-4 w-4 text-orange-500" />
                    Competitive Threats
                  </h4>
                  
                  <div className="p-3 rounded-lg bg-muted/50">
                    <ul className="space-y-2">
                      {briefing.competitive_insights?.threatAssessment?.map((threat, i) => (
                        <li key={i} className="text-sm flex items-start gap-2">
                          <span className="text-orange-500 mt-1">⚠</span>
                          {threat}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Sentiment Concerns */}
                <div className="space-y-3">
                  <h4 className="font-medium flex items-center gap-2">
                    <Eye className="h-4 w-4 text-yellow-500" />
                    Sentiment Signals
                  </h4>
                  
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="p-3 rounded-lg bg-green-500/5">
                      <p className="text-xs font-medium text-green-600 mb-2">Positive Indicators</p>
                      <ul className="space-y-1">
                        {briefing.sentiment_signals?.positiveIndicators?.map((ind, i) => (
                          <li key={i} className="text-sm">✓ {ind}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-3 rounded-lg bg-red-500/5">
                      <p className="text-xs font-medium text-red-600 mb-2">Concern Areas</p>
                      <ul className="space-y-1">
                        {briefing.sentiment_signals?.concernAreas?.map((concern, i) => (
                          <li key={i} className="text-sm">! {concern}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </div>
          </ScrollArea>
        </Tabs>

        {/* Historical Briefings */}
        {briefings && briefings.length > 1 && (
          <div className="border-t p-4">
            <Collapsible>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between">
                  <span className="text-sm text-muted-foreground">
                    View {briefings.length - 1} previous briefing{briefings.length > 2 ? 's' : ''}
                  </span>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-2">
                <div className="space-y-2">
                  {briefings.slice(1).map((b) => (
                    <div 
                      key={b.id} 
                      className="p-3 rounded-lg border bg-muted/30 flex items-center justify-between"
                    >
                      <div>
                        <p className="text-sm font-medium">{b.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(b.created_at), { addSuffix: true })}
                        </p>
                      </div>
                      <Badge variant="outline">{b.status}</Badge>
                    </div>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
