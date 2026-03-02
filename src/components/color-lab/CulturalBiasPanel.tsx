import { useState } from 'react';
import { Globe, Loader2, AlertTriangle, Lightbulb, MapPin, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface LabColor {
  id: string;
  hex: string;
  name: string;
}

interface CulturalInsight {
  region: string;
  associations: string[];
  warnings: string[];
  opportunities: string[];
}

interface BiasFlag {
  type: 'gender' | 'cultural' | 'age' | 'accessibility';
  severity: 'low' | 'medium' | 'high';
  description: string;
  recommendation: string;
}

interface AnalysisResult {
  overallScore: number;
  culturalInsights: CulturalInsight[];
  biasFlags: BiasFlag[];
  genderPerception: { masculine: number; feminine: number; neutral: number };
  industryFit: Array<{ industry: string; score: number; reason: string }>;
  recommendations: string[];
}

interface CulturalBiasPanelProps {
  colors: LabColor[];
}

export function CulturalBiasPanel({ colors }: CulturalBiasPanelProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  const runAnalysis = async () => {
    if (colors.length < 2) {
      toast.error('Add at least 2 colors for analysis');
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('color-lab-analysis', {
        body: {
          type: 'cultural-bias',
          colors: colors.map(c => ({ hex: c.hex, name: c.name })),
        },
      });

      if (error) throw error;
      setResult(data as AnalysisResult);
      toast.success('Cultural & bias analysis complete');
    } catch (err: any) {
      if (err?.status === 429) toast.error('Rate limit reached. Please try again shortly.');
      else if (err?.status === 402) toast.error('AI credits exhausted. Please add credits.');
      else toast.error('Analysis failed. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const severityColor = (s: string) => {
    if (s === 'high') return 'text-destructive';
    if (s === 'medium') return 'text-amber-600 dark:text-amber-400';
    return 'text-muted-foreground';
  };

  if (!result) {
    return (
      <div className="text-center py-12 space-y-4">
        <Globe className="h-12 w-12 mx-auto text-muted-foreground opacity-30" />
        <div>
          <p className="text-sm font-medium">Cultural & Bias Analysis</p>
          <p className="text-xs text-muted-foreground max-w-md mx-auto mt-1">
            AI-powered analysis evaluates your palette for cultural symbolism across 7+ global markets,
            gender perception bias, age inclusivity, and industry fit scoring.
          </p>
        </div>
        <Button onClick={runAnalysis} disabled={loading || colors.length < 2} className="gap-2">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Globe className="h-4 w-4" />}
          {loading ? 'Analyzing...' : 'Run Analysis'}
        </Button>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[600px]">
      <div className="space-y-6 pr-4">
        {/* Overall Score */}
        <div className="text-center">
          <p className={cn("text-4xl font-bold", result.overallScore >= 70 ? 'text-primary' : 'text-destructive')}>
            {result.overallScore}
          </p>
          <p className="text-xs text-muted-foreground">Cultural Inclusivity Score</p>
        </div>

        {/* Gender Perception */}
        <Card>
          <CardContent className="p-4 space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Gender Perception</h4>
            <div className="flex gap-2 h-6 rounded overflow-hidden">
              <div className="bg-blue-500/70 transition-all" style={{ flex: result.genderPerception.masculine }} />
              <div className="bg-purple-500/70 transition-all" style={{ flex: result.genderPerception.neutral }} />
              <div className="bg-pink-500/70 transition-all" style={{ flex: result.genderPerception.feminine }} />
            </div>
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>Masculine {result.genderPerception.masculine}%</span>
              <span>Neutral {result.genderPerception.neutral}%</span>
              <span>Feminine {result.genderPerception.feminine}%</span>
            </div>
          </CardContent>
        </Card>

        {/* Bias Flags */}
        {result.biasFlags.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Bias Flags ({result.biasFlags.length})
            </h3>
            {result.biasFlags.map((flag, i) => (
              <div key={i} className="rounded-lg border p-3 space-y-1">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px]">{flag.type}</Badge>
                  <span className={cn("text-xs font-medium", severityColor(flag.severity))}>
                    {flag.severity.toUpperCase()}
                  </span>
                </div>
                <p className="text-xs">{flag.description}</p>
                <p className="text-[10px] text-muted-foreground flex items-start gap-1">
                  <Lightbulb className="h-3 w-3 mt-0.5 shrink-0 text-amber-500" />
                  {flag.recommendation}
                </p>
              </div>
            ))}
          </div>
        )}

        <Separator />

        {/* Cultural Insights by Region */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Regional Cultural Insights
          </h3>
          {result.culturalInsights.map((insight, i) => (
            <Card key={i}>
              <CardContent className="p-3 space-y-2">
                <p className="text-xs font-semibold">{insight.region}</p>
                <div className="space-y-1">
                  {insight.associations.length > 0 && (
                    <p className="text-[10px] text-muted-foreground">
                      <strong>Associations:</strong> {insight.associations.join(', ')}
                    </p>
                  )}
                  {insight.warnings.map((w, j) => (
                    <p key={j} className="text-[10px] text-destructive flex items-start gap-1">
                      <AlertTriangle className="h-3 w-3 mt-0.5 shrink-0" />{w}
                    </p>
                  ))}
                  {insight.opportunities.map((o, j) => (
                    <p key={j} className="text-[10px] text-primary flex items-start gap-1">
                      <Lightbulb className="h-3 w-3 mt-0.5 shrink-0" />{o}
                    </p>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Separator />

        {/* Industry Fit */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Industry Fit Scoring
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {result.industryFit.map((fit, i) => (
              <div key={i} className="rounded-lg border p-3 flex items-center gap-3">
                <div className={cn(
                  "text-lg font-bold w-10 text-center",
                  fit.score >= 80 ? 'text-primary' : fit.score >= 50 ? 'text-amber-600' : 'text-destructive'
                )}>
                  {fit.score}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium">{fit.industry}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{fit.reason}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Recommendations */}
        {result.recommendations.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold">Recommendations</h3>
            <ul className="space-y-1">
              {result.recommendations.map((rec, i) => (
                <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                  <Lightbulb className="h-3 w-3 mt-0.5 shrink-0 text-primary" />
                  {rec}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </ScrollArea>
  );
}
