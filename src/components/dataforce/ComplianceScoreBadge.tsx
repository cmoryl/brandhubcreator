/**
 * ComplianceScoreBadge
 * Reusable badge showing a compliance score with color-coded indicator
 */

import { Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface ComplianceScoreBadgeProps {
  score?: number | null;
  size?: 'sm' | 'md';
  showLabel?: boolean;
  className?: string;
}

export function ComplianceScoreBadge({ score, size = 'sm', showLabel = false, className }: ComplianceScoreBadgeProps) {
  const hasScore = score != null;
  const displayScore = hasScore ? Math.round(score) : null;

  const getColor = () => {
    if (!hasScore) return { bg: 'bg-muted', text: 'text-muted-foreground', icon: 'text-muted-foreground' };
    if (score >= 80) return { bg: 'bg-green-500/15', text: 'text-green-700 dark:text-green-400', icon: 'text-green-600' };
    if (score >= 60) return { bg: 'bg-yellow-500/15', text: 'text-yellow-700 dark:text-yellow-400', icon: 'text-yellow-600' };
    return { bg: 'bg-red-500/15', text: 'text-red-700 dark:text-red-400', icon: 'text-red-600' };
  };

  const colors = getColor();
  const iconSize = size === 'sm' ? 'h-3 w-3' : 'h-4 w-4';
  const textSize = size === 'sm' ? 'text-[10px]' : 'text-xs';
  const padding = size === 'sm' ? 'px-1.5 py-0.5' : 'px-2 py-1';

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn(
            'inline-flex items-center gap-1 rounded-full font-semibold',
            colors.bg, colors.text, textSize, padding,
            className
          )}>
            <Shield className={cn(iconSize, colors.icon)} />
            {hasScore ? `${displayScore}%` : 'N/A'}
            {showLabel && hasScore && (
              <span className="font-normal opacity-80">
                {score >= 80 ? 'Compliant' : score >= 60 ? 'Partial' : 'Non-compliant'}
              </span>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p className="font-medium">
            {hasScore ? `Compliance Score: ${displayScore}%` : 'DataForce Compliance Checker'}
          </p>
          {hasScore && (
            <p className="text-xs text-muted-foreground">
              {score >= 80 ? 'Meets brand guidelines' : score >= 60 ? 'Partially compliant — review recommended' : 'Significant compliance issues detected'}
            </p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
