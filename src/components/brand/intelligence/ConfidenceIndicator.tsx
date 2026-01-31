import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ConfidenceIndicatorProps {
  confidence: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export function ConfidenceIndicator({ confidence, size = 'sm', showLabel = false }: ConfidenceIndicatorProps) {
  const percentage = Math.round(confidence * 100);
  
  const getColor = () => {
    if (percentage >= 80) return 'bg-green-500';
    if (percentage >= 60) return 'bg-yellow-500';
    if (percentage >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };
  
  const getTextColor = () => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    if (percentage >= 40) return 'text-orange-600';
    return 'text-red-600';
  };
  
  const sizeClasses = {
    sm: 'h-1.5 w-12',
    md: 'h-2 w-16',
    lg: 'h-2.5 w-20',
  };
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-1.5">
            <div className={cn("bg-muted rounded-full overflow-hidden", sizeClasses[size])}>
              <div 
                className={cn("h-full rounded-full transition-all", getColor())}
                style={{ width: `${percentage}%` }}
              />
            </div>
            {showLabel && (
              <span className={cn("text-xs font-medium", getTextColor())}>
                {percentage}%
              </span>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>AI Confidence: {percentage}%</p>
          <p className="text-xs text-muted-foreground">
            {percentage >= 80 ? 'High confidence prediction' :
             percentage >= 60 ? 'Moderate confidence' :
             percentage >= 40 ? 'Low confidence - verify manually' :
             'Very low confidence - treat as hypothesis'}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
