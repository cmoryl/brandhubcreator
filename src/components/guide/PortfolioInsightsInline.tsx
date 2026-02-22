import { useEntityPortfolioInsights } from '@/hooks/usePortfolioInsights';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Lightbulb, ArrowRight, Globe2, Shield, Brain, Target, Eye, Zap } from 'lucide-react';
import { useState } from 'react';

const moduleIcons: Record<string, React.ReactNode> = {
  bias_scan: <Shield className="h-3 w-3" />,
  localization: <Globe2 className="h-3 w-3" />,
  research: <Brain className="h-3 w-3" />,
  competitive: <Target className="h-3 w-3" />,
  website: <Eye className="h-3 w-3" />,
  booth: <Zap className="h-3 w-3" />,
};

const severityColors: Record<string, string> = {
  critical: 'border-destructive/40',
  high: 'border-orange-400/40',
  medium: 'border-amber-400/30',
  low: 'border-border',
};

interface PortfolioInsightsInlineProps {
  entityId: string;
  organizationId?: string;
}

export function PortfolioInsightsInline({ entityId, organizationId }: PortfolioInsightsInlineProps) {
  const { insights, isLoading } = useEntityPortfolioInsights(entityId, organizationId);
  const [showAll, setShowAll] = useState(false);

  if (isLoading || insights.length === 0) return null;

  const displayed = showAll ? insights : insights.slice(0, 3);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 px-1">
        <Lightbulb className="h-4 w-4 text-amber-500" />
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Portfolio Insights
        </h4>
        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 ml-auto">
          {insights.length}
        </Badge>
      </div>

      <div className="space-y-1.5">
        {displayed.map((insight) => (
          <Card 
            key={insight.id} 
            className={`border-l-2 ${severityColors[insight.severity] || 'border-border'}`}
          >
            <CardContent className="p-2.5">
              <div className="flex items-start gap-2">
                <div className="mt-0.5 shrink-0">
                  {moduleIcons[insight.source_module] || <Lightbulb className="h-3 w-3" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium leading-tight line-clamp-1">{insight.title}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">{insight.description}</p>
                  {insight.recommendations?.length > 0 && (
                    <div className="flex items-center gap-1 mt-1 text-[10px] text-primary">
                      <ArrowRight className="h-2.5 w-2.5" />
                      <span className="line-clamp-1">{insight.recommendations[0]?.action}</span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {insights.length > 3 && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="text-[10px] text-primary hover:underline px-1"
        >
          {showAll ? 'Show less' : `Show ${insights.length - 3} more`}
        </button>
      )}
    </div>
  );
}
