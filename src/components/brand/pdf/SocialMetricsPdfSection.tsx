/**
 * SocialMetricsPdfSection - PDF export section for social media performance data
 */

import { Users, TrendingUp, Heart, MessageCircle, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AggregatedSocialMetrics, SocialMetricsSnapshot } from '@/types/socialMetrics';

interface SocialMetricsPdfSectionProps {
  aggregated: AggregatedSocialMetrics | null;
  snapshots: SocialMetricsSnapshot[];
  theme: 'light' | 'dark';
}

const themeClasses = {
  light: {
    bg: 'bg-white',
    text: 'text-gray-900',
    textMuted: 'text-gray-600',
    textSubtle: 'text-gray-500',
    border: 'border-gray-200',
    card: 'bg-gray-50',
  },
  dark: {
    bg: 'bg-gray-900',
    text: 'text-white',
    textMuted: 'text-gray-300',
    textSubtle: 'text-gray-400',
    border: 'border-gray-700',
    card: 'bg-gray-800',
  },
};

// Platform icons/colors for display
const PLATFORM_COLORS: Record<string, string> = {
  instagram: '#E1306C',
  facebook: '#1877F2',
  twitter: '#1DA1F2',
  linkedin: '#0A66C2',
  tiktok: '#000000',
  youtube: '#FF0000',
  pinterest: '#E60023',
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

function formatPercent(num: number): string {
  return `${num >= 0 ? '+' : ''}${num.toFixed(1)}%`;
}

export const SocialMetricsPdfSection = ({ 
  aggregated, 
  snapshots,
  theme 
}: SocialMetricsPdfSectionProps) => {
  const t = themeClasses[theme];

  if (!aggregated || aggregated.platforms_count === 0) {
    return null;
  }

  // Calculate sentiment indicator
  const avgSentiment = aggregated.avg_sentiment;
  const sentimentLabel = avgSentiment > 20 ? 'Positive' : avgSentiment < -20 ? 'Negative' : 'Neutral';
  const sentimentColor = avgSentiment > 20 ? '#22c55e' : avgSentiment < -20 ? '#ef4444' : '#eab308';

  // Summary metrics
  const summaryMetrics = [
    {
      label: 'Total Followers',
      value: formatNumber(aggregated.total_followers),
      icon: Users,
      color: '#3b82f6'
    },
    {
      label: 'Avg Engagement',
      value: `${aggregated.avg_engagement_rate.toFixed(1)}%`,
      icon: Heart,
      color: '#ec4899'
    },
    {
      label: 'Avg Growth',
      value: formatPercent(aggregated.avg_growth_rate),
      icon: TrendingUp,
      color: aggregated.avg_growth_rate >= 0 ? '#22c55e' : '#ef4444'
    },
    {
      label: 'Brand Mentions',
      value: formatNumber(aggregated.total_mentions),
      icon: MessageCircle,
      color: '#a855f7'
    }
  ];

  return (
    <div id="pdf-section-socialmetrics" className={cn("py-6 border-b pdf-avoid-break", t.border)}>
      {/* Section Header */}
      <div className="pdf-section-header" style={{ marginBottom: '16px' }}>
        <BarChart3 className="h-5 w-5" />
        <h2>Social Media Performance</h2>
      </div>

      {/* Summary Stats Grid */}
      <div className="pdf-grid-2" style={{ marginBottom: '16px' }}>
        {summaryMetrics.map((metric) => (
          <div 
            key={metric.label}
            className={cn("p-4 rounded-lg pdf-avoid-break", t.card)}
            style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}
          >
            <div 
              style={{ 
                width: '32px', 
                height: '32px', 
                borderRadius: '8px', 
                backgroundColor: `${metric.color}20`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <metric.icon 
                style={{ width: '16px', height: '16px', color: metric.color }} 
              />
            </div>
            <div>
              <p className={cn("text-xs", t.textMuted)}>{metric.label}</p>
              <p className={cn("text-xl font-bold", t.text)}>{metric.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Platform Overview */}
      <div className={cn("p-4 rounded-lg mb-4", t.card)}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div>
            <p className={cn("text-sm font-medium", t.text)}>
              Tracking {aggregated.platforms_count} platform{aggregated.platforms_count !== 1 ? 's' : ''}
            </p>
            <p className={cn("text-xs", t.textMuted)}>
              Top platform: {aggregated.top_platform}
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className={cn("text-xs", t.textMuted)}>Sentiment:</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ 
                width: '8px', 
                height: '8px', 
                borderRadius: '50%', 
                backgroundColor: sentimentColor 
              }} />
              <span className={cn("text-sm font-medium", t.text)}>{sentimentLabel}</span>
            </div>
          </div>
        </div>

        {/* Last Updated */}
        {aggregated.latest_snapshot_date && (
          <p className={cn("text-xs", t.textSubtle)}>
            Last updated: {new Date(aggregated.latest_snapshot_date).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </p>
        )}
      </div>

      {/* Platform Breakdown Table */}
      {snapshots.length > 0 && (
        <div className={cn("rounded-lg overflow-hidden", t.card)}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
            <thead>
              <tr className={cn("border-b", t.border)}>
                <th style={{ textAlign: 'left', padding: '10px 12px', fontWeight: 600 }} className={t.text}>
                  Platform
                </th>
                <th style={{ textAlign: 'right', padding: '10px 12px', fontWeight: 600 }} className={t.text}>
                  Followers
                </th>
                <th style={{ textAlign: 'right', padding: '10px 12px', fontWeight: 600 }} className={t.text}>
                  Engagement
                </th>
                <th style={{ textAlign: 'right', padding: '10px 12px', fontWeight: 600 }} className={t.text}>
                  Growth
                </th>
                <th style={{ textAlign: 'right', padding: '10px 12px', fontWeight: 600 }} className={t.text}>
                  Mentions
                </th>
              </tr>
            </thead>
            <tbody>
              {snapshots.slice(0, 6).map((snapshot, idx) => {
                const platformColor = PLATFORM_COLORS[snapshot.platform.toLowerCase()] || '#6b7280';
                return (
                  <tr 
                    key={snapshot.id} 
                    className={cn(idx !== snapshots.length - 1 ? `border-b ${t.border}` : '')}
                  >
                    <td style={{ padding: '10px 12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ 
                          width: '10px', 
                          height: '10px', 
                          borderRadius: '50%', 
                          backgroundColor: platformColor 
                        }} />
                        <span className={cn("font-medium capitalize", t.text)}>
                          {snapshot.platform}
                        </span>
                      </div>
                    </td>
                    <td style={{ textAlign: 'right', padding: '10px 12px' }} className={t.text}>
                      {formatNumber(snapshot.followers_count)}
                    </td>
                    <td style={{ textAlign: 'right', padding: '10px 12px' }} className={t.text}>
                      {snapshot.engagement_rate.toFixed(1)}%
                    </td>
                    <td 
                      style={{ 
                        textAlign: 'right', 
                        padding: '10px 12px',
                        color: snapshot.follower_growth_percent >= 0 ? '#22c55e' : '#ef4444'
                      }}
                    >
                      {formatPercent(snapshot.follower_growth_percent)}
                    </td>
                    <td style={{ textAlign: 'right', padding: '10px 12px' }} className={t.text}>
                      {formatNumber(snapshot.brand_mentions_count)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Footer Note */}
      <p className={cn("text-xs mt-3", t.textSubtle)} style={{ fontStyle: 'italic' }}>
        Social metrics are aggregated from the latest available snapshots per platform.
      </p>
    </div>
  );
};
