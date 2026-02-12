import { Brain, TrendingUp, Target, Users, MessageSquare, Lightbulb, BarChart3, Globe2, Sparkles } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import type { BrandIntelligenceDetail } from '@/hooks/useBrandIntelligenceInsights';

interface BrandIntelligenceDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  detail: BrandIntelligenceDetail | null;
}

export function BrandIntelligenceDetailDialog({ open, onOpenChange, detail }: BrandIntelligenceDetailDialogProps) {
  if (!detail) return null;

  const advantages = detail.competitive_advantages || [];
  const recommendations = detail.growth_recommendations || [];
  const voice = detail.brand_voice_profile;
  const audience = detail.target_audience;
  

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-primary" />
            Brand Intelligence Overview
          </DialogTitle>
          <DialogDescription>
            AI-generated insights from {detail.analysis_count} analysis run{detail.analysis_count !== 1 ? 's' : ''}
            {detail.last_analyzed_at && (
              <> — Last updated {new Date(detail.last_analyzed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</>
            )}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-6 pb-4">
            {/* Brand Summary */}
            {detail.brand_summary && (
              <section>
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-2">
                  <Sparkles className="h-4 w-4" /> Summary
                </h3>
                <p className="text-sm text-foreground leading-relaxed">{detail.brand_summary}</p>
              </section>
            )}

            {/* Market Position */}
            {detail.market_position && (
              <section>
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-2">
                  <Target className="h-4 w-4" /> Market Position
                </h3>
                <p className="text-sm text-foreground leading-relaxed">{detail.market_position}</p>
              </section>
            )}

            {/* Target Audience */}
            {audience && (
              <section>
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-2">
                  <Users className="h-4 w-4" /> Target Audience
                </h3>
                <div className="space-y-2">
                  {audience.primary && (
                    <p className="text-sm"><span className="font-medium text-foreground">Primary:</span> <span className="text-muted-foreground">{audience.primary}</span></p>
                  )}
                  {Array.isArray(audience.secondary) && audience.secondary.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {audience.secondary.map((s: string, i: number) => (
                        <Badge key={i} variant="secondary" className="text-xs">{s}</Badge>
                      ))}
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* Competitive Advantages */}
            {advantages.length > 0 && (
              <section>
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" /> Competitive Advantages ({advantages.length})
                </h3>
                <div className="space-y-1.5">
                  {advantages.map((adv: string, i: number) => (
                    <div key={i} className="flex items-start gap-2 text-sm">
                      <span className="text-primary mt-0.5">•</span>
                      <span className="text-foreground">{adv}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Voice Profile */}
            {voice && voice.communication_style && (
              <section>
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" /> Brand Voice
                </h3>
                <p className="text-sm text-foreground mb-2">{voice.communication_style}</p>
                <div className="flex flex-wrap gap-1.5">
                  {Array.isArray(voice.tone) && voice.tone.map((t: string, i: number) => (
                    <Badge key={i} variant="outline" className="text-xs">{t}</Badge>
                  ))}
                  {Array.isArray(voice.personality) && voice.personality.map((p: string, i: number) => (
                    <Badge key={`p-${i}`} variant="secondary" className="text-xs">{p}</Badge>
                  ))}
                </div>
              </section>
            )}

            {/* Cultural Readiness */}
            {detail.localization_readiness_score != null && (
              <section>
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-2">
                  <Globe2 className="h-4 w-4" /> Cultural Readiness
                </h3>
                <div className="flex items-center gap-3">
                  <Progress value={detail.localization_readiness_score} className="flex-1" />
                  <span className={cn(
                    "text-sm font-bold",
                    detail.localization_readiness_score >= 70 ? "text-emerald-500" :
                    detail.localization_readiness_score >= 40 ? "text-amber-500" : "text-red-500"
                  )}>
                    {detail.localization_readiness_score}%
                  </span>
                </div>
              </section>
            )}

            {/* Growth Recommendations */}
            {recommendations.length > 0 && (
              <section>
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-2">
                  <Lightbulb className="h-4 w-4" /> Growth Recommendations
                </h3>
                <div className="space-y-3">
                  {recommendations.map((rec: any, i: number) => (
                    <Card key={i} className="border-border/50">
                      <CardContent className="p-3">
                        <div className="flex items-start gap-2">
                          <Badge className={cn(
                            "text-[10px] shrink-0 mt-0.5",
                            rec.priority === 'high' ? 'bg-red-500/10 text-red-500' :
                            rec.priority === 'medium' ? 'bg-amber-500/10 text-amber-500' :
                            'bg-emerald-500/10 text-emerald-500'
                          )}>
                            {rec.priority}
                          </Badge>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-foreground">{rec.recommendation}</p>
                            {rec.rationale && (
                              <p className="text-xs text-muted-foreground mt-1">{rec.rationale}</p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>
            )}

            {/* Analysis Stats */}
            <section className="pt-2 border-t border-border/50">
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <BarChart3 className="h-3.5 w-3.5" />
                  {detail.analysis_count} analyses
                </div>
                {detail.feedback_score != null && (
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5" />
                    Feedback score: {detail.feedback_score}
                  </div>
                )}
              </div>
            </section>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
