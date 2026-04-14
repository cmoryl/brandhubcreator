/**
 * EngagementScoreCard - Visual engagement scoring with ring chart
 */

import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface EngagementScoreCardProps {
  score: number; // 0-100
  label: string;
  subtitle?: string;
  trend?: number; // percentage change
  size?: 'sm' | 'md';
}

function getScoreColor(score: number): string {
  if (score >= 80) return 'text-green-500';
  if (score >= 60) return 'text-primary';
  if (score >= 40) return 'text-amber-500';
  return 'text-red-500';
}

function getStrokeColor(score: number): string {
  if (score >= 80) return 'stroke-green-500';
  if (score >= 60) return 'stroke-primary';
  if (score >= 40) return 'stroke-amber-500';
  return 'stroke-red-500';
}

export function EngagementScoreCard({ score, label, subtitle, trend, size = 'md' }: EngagementScoreCardProps) {
  const radius = size === 'sm' ? 28 : 36;
  const strokeWidth = size === 'sm' ? 4 : 5;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;
  const svgSize = (radius + strokeWidth) * 2;

  return (
    <Card>
      <CardContent className={cn('flex items-center gap-3', size === 'sm' ? 'p-3' : 'p-4')}>
        {/* Ring */}
        <div className="relative shrink-0">
          <svg width={svgSize} height={svgSize} className="-rotate-90">
            <circle
              cx={radius + strokeWidth}
              cy={radius + strokeWidth}
              r={radius}
              fill="none"
              strokeWidth={strokeWidth}
              className="stroke-muted"
            />
            <circle
              cx={radius + strokeWidth}
              cy={radius + strokeWidth}
              r={radius}
              fill="none"
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={circumference - progress}
              strokeLinecap="round"
              className={cn('transition-all duration-700', getStrokeColor(score))}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={cn('font-bold', getScoreColor(score), size === 'sm' ? 'text-sm' : 'text-lg')}>
              {score}
            </span>
          </div>
        </div>

        {/* Label */}
        <div className="min-w-0">
          <p className={cn('font-medium truncate', size === 'sm' ? 'text-xs' : 'text-sm')}>{label}</p>
          {subtitle && <p className="text-xs text-muted-foreground truncate">{subtitle}</p>}
          {trend !== undefined && (
            <p className={cn('text-xs font-medium', trend >= 0 ? 'text-green-500' : 'text-red-500')}>
              {trend >= 0 ? '▲' : '▼'} {Math.abs(trend).toFixed(1)}%
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
