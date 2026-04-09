import { TrendingUp, TrendingDown, EyeOff } from 'lucide-react';
import { VisualDNA } from '@/hooks/useImageryPreferenceLearning';

interface OverviewTabProps {
  visualDna: VisualDNA;
}

export const OverviewTab = ({ visualDna }: OverviewTabProps) => {
  const patterns = visualDna.approval_patterns || {};
  const confidence = Math.round(visualDna.confidence_score || 0);
  const total = (visualDna.total_approved || 0) + (visualDna.total_skipped || 0) + (visualDna.total_removed || 0);

  return (
    <div className="space-y-4">
      {/* Confidence Ring + Stats */}
      <div className="flex items-center gap-5">
        {/* Radial confidence ring */}
        <div className="relative shrink-0">
          <svg width="72" height="72" viewBox="0 0 72 72">
            <circle cx="36" cy="36" r="30" fill="none" stroke="hsl(var(--muted))" strokeWidth="6" />
            <circle
              cx="36" cy="36" r="30"
              fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={`${(confidence / 100) * 188.5} 188.5`}
              transform="rotate(-90 36 36)"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-sm font-bold text-foreground">{confidence}%</span>
            <span className="text-[9px] text-muted-foreground">confidence</span>
          </div>
        </div>

        {/* Stats column */}
        <div className="flex-1 space-y-1.5">
          <div className="flex items-center gap-2 text-xs">
            <TrendingUp className="h-3.5 w-3.5 text-green-600 dark:text-green-400 shrink-0" />
            <span className="font-medium text-foreground">{visualDna.total_approved}</span>
            <span className="text-muted-foreground">approved</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <EyeOff className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <span className="font-medium text-foreground">{visualDna.total_skipped}</span>
            <span className="text-muted-foreground">skipped</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <TrendingDown className="h-3.5 w-3.5 text-red-500 shrink-0" />
            <span className="font-medium text-foreground">{visualDna.total_removed}</span>
            <span className="text-muted-foreground">removed</span>
          </div>
          <p className="text-[10px] text-muted-foreground">{total} total interactions</p>
        </div>
      </div>

      {/* Summary */}
      {patterns.summary && (
        <div className="rounded-md bg-muted/40 p-3">
          <p className="text-xs leading-relaxed text-foreground">{patterns.summary}</p>
        </div>
      )}
    </div>
  );
};
