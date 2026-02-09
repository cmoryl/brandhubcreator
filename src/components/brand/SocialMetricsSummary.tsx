/**
 * SocialMetricsSummary - Displays aggregated social metrics with trends
 */

import { AggregatedSocialMetrics, SocialMetricsSnapshot } from '@/types/socialMetrics';
import { Users, TrendingUp, MessageCircle, Heart, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SocialMetricsSummaryProps {
  aggregated: AggregatedSocialMetrics | null;
  snapshots: SocialMetricsSnapshot[];
  isLoading?: boolean;
}

export const SocialMetricsSummary = ({ aggregated, snapshots, isLoading }: SocialMetricsSummaryProps) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-20 bg-muted/50 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (!aggregated || aggregated.platforms_count === 0) {
    return null;
  }

  const metrics = [
    {
      label: 'Total Followers',
      value: formatNumber(aggregated.total_followers),
      icon: Users,
      color: 'text-blue-500'
    },
    {
      label: 'Avg Engagement',
      value: `${aggregated.avg_engagement_rate.toFixed(1)}%`,
      icon: Heart,
      color: 'text-pink-500'
    },
    {
      label: 'Avg Growth',
      value: `${aggregated.avg_growth_rate >= 0 ? '+' : ''}${aggregated.avg_growth_rate.toFixed(1)}%`,
      icon: TrendingUp,
      color: aggregated.avg_growth_rate >= 0 ? 'text-green-500' : 'text-red-500'
    },
    {
      label: 'Brand Mentions',
      value: formatNumber(aggregated.total_mentions),
      icon: MessageCircle,
      color: 'text-purple-500'
    }
  ];

  // Calculate sentiment indicator
  const avgSentiment = aggregated.avg_sentiment;
  const sentimentLabel = avgSentiment > 20 ? 'Positive' : avgSentiment < -20 ? 'Negative' : 'Neutral';
  const sentimentColor = avgSentiment > 20 ? 'bg-green-500' : avgSentiment < -20 ? 'bg-red-500' : 'bg-yellow-500';

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {metrics.map((metric, idx) => (
          <div 
            key={metric.label}
            className="bg-card border border-border rounded-lg p-3 animate-scale-in"
            style={{ animationDelay: `${idx * 50}ms` }}
          >
            <div className="flex items-center gap-2 mb-1">
              <metric.icon className={cn('h-4 w-4', metric.color)} />
              <span className="text-xs text-muted-foreground">{metric.label}</span>
            </div>
            <p className="text-xl font-semibold text-foreground">{metric.value}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between bg-card border border-border rounded-lg p-3">
        <div className="flex items-center gap-3">
          <BarChart3 className="h-5 w-5 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium text-foreground">
              Tracking {aggregated.platforms_count} platform{aggregated.platforms_count !== 1 ? 's' : ''}
            </p>
            <p className="text-xs text-muted-foreground">
              Top platform: {aggregated.top_platform}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Sentiment:</span>
          <div className="flex items-center gap-1.5">
            <div className={cn('w-2 h-2 rounded-full', sentimentColor)} />
            <span className="text-sm font-medium">{sentimentLabel}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toString();
}
