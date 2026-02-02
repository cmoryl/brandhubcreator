import { cn } from '@/lib/utils';

interface ScoreGaugeProps {
  score: number;
  maxScore?: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  label?: string;
}

export function ScoreGauge({ 
  score, 
  maxScore = 100, 
  size = 'md',
  showLabel = true,
  label = 'Overall Score'
}: ScoreGaugeProps) {
  const percentage = Math.min(100, Math.max(0, (score / maxScore) * 100));
  
  const getColor = () => {
    if (percentage >= 80) return 'text-green-500';
    if (percentage >= 60) return 'text-yellow-500';
    if (percentage >= 40) return 'text-orange-500';
    return 'text-red-500';
  };

  const getStrokeColor = () => {
    if (percentage >= 80) return 'stroke-green-500';
    if (percentage >= 60) return 'stroke-yellow-500';
    if (percentage >= 40) return 'stroke-orange-500';
    return 'stroke-red-500';
  };

  const sizeClasses = {
    sm: { container: 'w-16 h-16', text: 'text-lg', label: 'text-xs' },
    md: { container: 'w-24 h-24', text: 'text-2xl', label: 'text-sm' },
    lg: { container: 'w-32 h-32', text: 'text-3xl', label: 'text-base' },
  };

  const strokeWidth = size === 'sm' ? 4 : size === 'md' ? 5 : 6;
  const radius = size === 'sm' ? 28 : size === 'md' ? 42 : 56;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className={cn('relative', sizeClasses[size].container)}>
        <svg className="w-full h-full transform -rotate-90">
          {/* Background circle */}
          <circle
            cx="50%"
            cy="50%"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-muted/30"
          />
          {/* Progress circle */}
          <circle
            cx="50%"
            cy="50%"
            r={radius}
            fill="none"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            className={cn('transition-all duration-700 ease-out', getStrokeColor())}
            style={{
              strokeDasharray: circumference,
              strokeDashoffset,
            }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={cn('font-bold', sizeClasses[size].text, getColor())}>
            {Math.round(score)}
          </span>
        </div>
      </div>
      {showLabel && (
        <span className={cn('text-muted-foreground', sizeClasses[size].label)}>
          {label}
        </span>
      )}
    </div>
  );
}
