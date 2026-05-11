import { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { fetchSkillQAHistory } from '@/lib/skillQAClient';

/**
 * AI-readiness badge — shows the latest min-tier skill QA score for an entity.
 * Drop into portal cards / hero areas. Renders nothing if no QA has ever run.
 */
interface Props {
  entityType: 'brand' | 'product' | 'event';
  entityId: string;
  className?: string;
  compact?: boolean;
}

const tone = (s: number) =>
  s >= 80 ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
  : s >= 60 ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30'
  : 'bg-destructive/15 text-destructive border-destructive/30';

export const SkillReadinessBadge = ({ entityType, entityId, className, compact }: Props) => {
  const [score, setScore] = useState<number | null>(null);
  const [ranAt, setRanAt] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchSkillQAHistory(entityType, entityId, 1).then((rows) => {
      if (cancelled || !rows[0]) return;
      const vals = Object.values(rows[0].avg_score_by_tier || {}).map(Number).filter((n) => !Number.isNaN(n));
      if (!vals.length) return;
      setScore(Math.min(...vals));
      setRanAt(rows[0].created_at);
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [entityType, entityId]);

  if (score == null) return null;

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="outline" className={`gap-1 ${tone(score)} ${className || ''}`}>
            <Sparkles className="h-3 w-3" />
            {compact ? `${score}` : `AI-ready ${score}/100`}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-xs">
            <div>Lowest model-tier score from latest skill QA</div>
            {ranAt && <div className="text-muted-foreground mt-0.5">Run: {new Date(ranAt).toLocaleString()}</div>}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
