/**
 * StyleAnalysisPanel - AI visual style analysis results
 */
import { useState, useCallback } from 'react';
import { Sparkles, Loader2, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { supabase } from '@/integrations/supabase/client';
import { ApprovedImagerySubSection } from '@/types/brand';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface StyleAnalysis {
  cohesionScore: number;
  dominantPalette: string[];
  styleTags: string[];
  outliers: Array<{ imageId: string; imageUrl: string; reason: string }>;
  recommendations: string[];
}

interface StyleAnalysisPanelProps {
  entityId: string;
  entityType: 'brand' | 'product' | 'event';
  sections: ApprovedImagerySubSection[];
}

export const StyleAnalysisPanel = ({ entityId, entityType, sections }: StyleAnalysisPanelProps) => {
  const [analysis, setAnalysis] = useState<StyleAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const allImages = sections.flatMap(s => s.images);

  const runAnalysis = useCallback(async () => {
    if (allImages.length === 0) {
      toast.error('No images to analyze');
      return;
    }

    setIsAnalyzing(true);
    try {
      const imageUrls = allImages.slice(0, 20).map(img => ({
        id: img.id,
        url: img.url,
        title: img.title,
      }));

      const { data, error } = await supabase.functions.invoke('imagery-style-analyzer', {
        body: { entityId, entityType, images: imageUrls },
      });

      if (error) throw error;
      if (data?.error) {
        toast.error(data.error);
        return;
      }

      setAnalysis(data);
      setIsOpen(true);
      toast.success('Style analysis complete');
    } catch (err) {
      console.error('Style analysis error:', err);
      toast.error('Failed to analyze imagery style');
    } finally {
      setIsAnalyzing(false);
    }
  }, [entityId, entityType, allImages]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={runAnalysis}
          disabled={isAnalyzing || allImages.length === 0}
          className="gap-1.5"
        >
          {isAnalyzing ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Sparkles className="h-3.5 w-3.5" />
          )}
          {analysis ? 'Re-analyze' : 'Analyze Style'}
        </Button>
        {analysis && (
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-1">
              <span className={cn('font-bold', getScoreColor(analysis.cohesionScore))}>
                {analysis.cohesionScore}/100
              </span>
              {isOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </Button>
          </CollapsibleTrigger>
        )}
      </div>

      <CollapsibleContent>
        {analysis && (
          <Card className="mt-3 border-border/50">
            <CardContent className="p-4 space-y-4">
              {/* Score & Palette */}
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <div className={cn('text-3xl font-bold', getScoreColor(analysis.cohesionScore))}>
                    {analysis.cohesionScore}
                  </div>
                  <p className="text-xs text-muted-foreground">Cohesion</p>
                </div>
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground mb-1.5">Dominant Palette</p>
                  <div className="flex gap-1">
                    {analysis.dominantPalette.map((color, i) => (
                      <div
                        key={i}
                        className="w-8 h-8 rounded border border-border"
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Style Tags */}
              <div>
                <p className="text-xs text-muted-foreground mb-1.5">Style Tags</p>
                <div className="flex flex-wrap gap-1">
                  {analysis.styleTags.map((tag, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">{tag}</Badge>
                  ))}
                </div>
              </div>

              {/* Outliers */}
              {analysis.outliers.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> Flagged Images ({analysis.outliers.length})
                  </p>
                  <div className="space-y-2">
                    {analysis.outliers.map((outlier, i) => (
                      <div key={i} className="flex items-center gap-3 p-2 rounded-md bg-muted/50">
                        <img
                          src={outlier.imageUrl}
                          alt=""
                          className="w-12 h-12 object-cover rounded"
                        />
                        <p className="text-xs text-muted-foreground flex-1">{outlier.reason}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommendations */}
              {analysis.recommendations.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1.5">Recommendations</p>
                  <ul className="space-y-1">
                    {analysis.recommendations.map((rec, i) => (
                      <li key={i} className="text-sm text-foreground flex items-start gap-2">
                        <span className="text-primary mt-0.5">•</span>
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
};
