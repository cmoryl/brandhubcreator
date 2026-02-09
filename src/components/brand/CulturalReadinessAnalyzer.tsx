/**
 * CulturalReadinessAnalyzer - One-click cultural analysis for brand intelligence
 * Analyzes brand readiness for global markets
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Globe2,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  MapPin,
  Palette,
  MessageSquare,
  Image,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface CulturalInsights {
  global_readiness_score: number;
  primary_markets: string[];
  cultural_considerations: Array<{
    region: string;
    considerations: string[];
    design_adaptations: string[];
    messaging_notes: string;
  }>;
  localization_priorities: string[];
  color_cultural_notes: string[];
  imagery_guidelines: string[];
}

interface GlobalLinkRecommendation {
  product: string;
  relevance: 'high' | 'medium' | 'low';
  use_case: string;
}

interface CulturalReadinessAnalyzerProps {
  entityId: string;
  entityType: 'brand' | 'product' | 'event';
  entityName: string;
  organizationId?: string | null;
  existingInsights?: CulturalInsights | null;
  existingRecommendations?: GlobalLinkRecommendation[];
  onAnalysisComplete?: (insights: CulturalInsights) => void;
}

export const CulturalReadinessAnalyzer: React.FC<CulturalReadinessAnalyzerProps> = ({
  entityId,
  entityType,
  entityName,
  organizationId,
  existingInsights,
  existingRecommendations = [],
  onAnalysisComplete,
}) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [insights, setInsights] = useState<CulturalInsights | null>(existingInsights || null);
  const [recommendations, setRecommendations] = useState<GlobalLinkRecommendation[]>(existingRecommendations);

  const runAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('brand-intelligence', {
        body: {
          action: 'analyze',
          entityType,
          entityId,
          organizationId,
        },
      });

      if (error) throw error;

      if (data?.analysis?.cultural_insights) {
        setInsights(data.analysis.cultural_insights);
        onAnalysisComplete?.(data.analysis.cultural_insights);
      }
      if (data?.analysis?.globallink_recommendations) {
        setRecommendations(data.analysis.globallink_recommendations);
      }

      toast.success('Cultural analysis complete');
    } catch (error) {
      console.error('Cultural analysis error:', error);
      toast.error('Failed to analyze cultural readiness');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-amber-500';
    return 'text-red-500';
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-amber-500';
    return 'bg-red-500';
  };

  const getRelevanceColor = (relevance: string) => {
    if (relevance === 'high') return 'bg-green-500/10 text-green-700 border-green-200';
    if (relevance === 'medium') return 'bg-amber-500/10 text-amber-700 border-amber-200';
    return 'bg-muted text-muted-foreground';
  };

  if (!insights) {
    return (
      <Card className="border-dashed">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg">
              <Globe2 className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">Cultural Readiness Analysis</CardTitle>
              <CardDescription>
                Analyze {entityName} for global market expansion
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Globe2 className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">
              No cultural analysis available yet
            </p>
            <Button onClick={runAnalysis} disabled={isAnalyzing} className="gap-2">
              {isAnalyzing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Analyze Cultural Readiness
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Score Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg">
                <Globe2 className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold">Global Readiness Score</h3>
                <p className="text-sm text-muted-foreground">{entityName}</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={runAnalysis} disabled={isAnalyzing}>
              {isAnalyzing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className={cn("text-4xl font-bold", getScoreColor(insights.global_readiness_score))}>
                {insights.global_readiness_score}
              </div>
              <p className="text-sm text-muted-foreground">out of 100</p>
            </div>
            <div className="flex-1">
              <Progress 
                value={insights.global_readiness_score} 
                className="h-3"
              />
              <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                <span>Limited</span>
                <span>Ready</span>
                <span>Excellent</span>
              </div>
            </div>
          </div>

          {insights.primary_markets.length > 0 && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-sm font-medium mb-2">Primary Target Markets</p>
              <div className="flex flex-wrap gap-2">
                {insights.primary_markets.map((market, idx) => (
                  <Badge key={idx} variant="secondary" className="gap-1">
                    <MapPin className="h-3 w-3" />
                    {market}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cultural Considerations */}
      {insights.cultural_considerations?.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              Regional Considerations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px] pr-4">
              <div className="space-y-4">
                {insights.cultural_considerations.map((region, idx) => (
                  <div key={idx} className="p-4 rounded-lg border bg-muted/30">
                    <h4 className="font-medium mb-2">{region.region}</h4>
                    
                    {region.considerations?.length > 0 && (
                      <div className="mb-3">
                        <p className="text-xs font-medium text-muted-foreground mb-1">Considerations</p>
                        <ul className="text-sm space-y-1">
                          {region.considerations.map((c, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                              {c}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {region.design_adaptations?.length > 0 && (
                      <div className="mb-3">
                        <p className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
                          <Palette className="h-3 w-3" />
                          Design Adaptations
                        </p>
                        <ul className="text-sm space-y-1">
                          {region.design_adaptations.map((d, i) => (
                            <li key={i} className="text-muted-foreground">• {d}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {region.messaging_notes && (
                      <div className="flex items-start gap-2 text-sm">
                        <MessageSquare className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
                        <span className="text-muted-foreground">{region.messaging_notes}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Localization Priorities & Guidelines */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {insights.localization_priorities?.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                Localization Priorities
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="space-y-2">
                {insights.localization_priorities.map((priority, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm">
                    <Badge variant="outline" className="h-5 w-5 rounded-full p-0 justify-center shrink-0">
                      {idx + 1}
                    </Badge>
                    <span>{priority}</span>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        )}

        {(insights.color_cultural_notes?.length > 0 || insights.imagery_guidelines?.length > 0) && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Image className="h-4 w-4 text-primary" />
                Visual Guidelines
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {insights.color_cultural_notes?.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">Color Notes</p>
                  <ul className="text-sm space-y-1">
                    {insights.color_cultural_notes.map((note, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <Palette className="h-4 w-4 text-purple-500 mt-0.5 shrink-0" />
                        {note}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {insights.imagery_guidelines?.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">Imagery</p>
                  <ul className="text-sm space-y-1">
                    {insights.imagery_guidelines.map((guide, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <Image className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
                        {guide}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* GlobalLink Recommendations */}
      {recommendations.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              Recommended GlobalLink Products
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {recommendations.map((rec, idx) => (
                <div key={idx} className="p-3 rounded-lg border flex items-start gap-3">
                  <Badge className={cn("shrink-0", getRelevanceColor(rec.relevance))}>
                    {rec.relevance}
                  </Badge>
                  <div>
                    <p className="font-medium text-sm">{rec.product}</p>
                    <p className="text-xs text-muted-foreground">{rec.use_case}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CulturalReadinessAnalyzer;
