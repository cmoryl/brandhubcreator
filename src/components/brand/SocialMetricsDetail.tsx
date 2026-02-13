/**
 * SocialMetricsDetail - Expandable detail view for a platform's saved metrics
 */

import { SocialMetricsSnapshot } from '@/types/socialMetrics';
import { METRIC_CATEGORIES, METRIC_LABELS } from '@/types/socialMetrics';
import { Users, TrendingUp, MessageCircle, Share2, ChevronDown, ChevronUp, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface SocialMetricsDetailProps {
  snapshot: SocialMetricsSnapshot;
  expanded: boolean;
  onToggle: () => void;
}

const categoryIcons = {
  core: Users,
  growth: TrendingUp,
  sentiment: MessageCircle,
  wordOfMouth: Share2,
};

function formatMetricValue(key: string, value: number): string {
  if (key.includes('rate') || key.includes('percent') || key.includes('coefficient')) {
    return `${value.toFixed(2)}%`;
  }
  if (key === 'earned_media_value') {
    return `$${value.toLocaleString()}`;
  }
  if (key === 'sentiment_score') {
    return `${value > 0 ? '+' : ''}${value}`;
  }
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return value.toLocaleString();
}

export const SocialMetricsDetail = ({ snapshot, expanded, onToggle }: SocialMetricsDetailProps) => {
  // Count non-zero metrics
  const snapshotRecord = snapshot as unknown as Record<string, unknown>;
  const allMetricKeys = Object.values(METRIC_CATEGORIES).flatMap(c => c.metrics);
  const populatedCount = allMetricKeys.filter(k => {
    const val = snapshotRecord[k];
    return typeof val === 'number' && val !== 0;
  }).length;

  return (
    <div className="mt-2">
      <button
        onClick={onToggle}
        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        {expanded ? 'Hide' : 'View'} details ({populatedCount} metrics)
      </button>

      {expanded && (
        <div className="mt-3 space-y-3 animate-scale-in">
          {/* Snapshot metadata */}
          <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {format(new Date(snapshot.snapshot_date), 'MMM d, yyyy')}
            </span>
            <span className="capitalize">{snapshot.period_type}</span>
            <span className="capitalize text-accent">{snapshot.data_source}</span>
          </div>

          {/* Metric categories */}
          {Object.entries(METRIC_CATEGORIES).map(([catKey, { label, metrics }]) => {
            const hasValues = metrics.some(k => {
              const val = snapshotRecord[k];
              return typeof val === 'number' && val !== 0;
            });
            if (!hasValues) return null;

            const Icon = categoryIcons[catKey as keyof typeof categoryIcons];

            return (
              <div key={catKey}>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Icon className="h-3 w-3 text-muted-foreground" />
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                    {label}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                  {metrics.map(metricKey => {
                    const val = snapshotRecord[metricKey];
                    if (typeof val !== 'number' || val === 0) return null;

                    return (
                      <div key={metricKey} className="flex items-center justify-between py-0.5">
                        <span className="text-xs text-muted-foreground truncate mr-2">
                          {METRIC_LABELS[metricKey] || metricKey}
                        </span>
                        <span className={cn(
                          "text-xs font-medium tabular-nums whitespace-nowrap",
                          metricKey === 'sentiment_score' && val > 20 && "text-green-600",
                          metricKey === 'sentiment_score' && val < -20 && "text-red-600",
                          metricKey === 'follower_growth_percent' && val > 0 && "text-green-600",
                          metricKey === 'follower_growth_percent' && val < 0 && "text-red-600",
                        )}>
                          {formatMetricValue(metricKey, val as number)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Notes */}
          {snapshot.notes && (
            <div className="pt-1 border-t border-border/50">
              <p className="text-[11px] text-muted-foreground italic">{snapshot.notes}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
