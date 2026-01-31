import { Brain, GitBranch, ThumbsUp, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface LearningContext {
  approved_insights?: string[];
  rejected_insights?: string[];
  user_corrections?: Array<{ original: string; corrected: string }>;
  cross_entity_insights?: string[];
}

interface LearningStatusBadgeProps {
  learningContext?: LearningContext;
  parentEntityName?: string;
  feedbackScore?: number;
}

export const LearningStatusBadge = ({
  learningContext,
  parentEntityName,
  feedbackScore,
}: LearningStatusBadgeProps) => {
  const hasLearning = learningContext && (
    (learningContext.approved_insights?.length || 0) > 0 ||
    (learningContext.rejected_insights?.length || 0) > 0 ||
    (learningContext.user_corrections?.length || 0) > 0
  );

  const approvedCount = learningContext?.approved_insights?.length || 0;
  const rejectedCount = learningContext?.rejected_insights?.length || 0;
  const correctionsCount = learningContext?.user_corrections?.length || 0;
  const totalFeedback = approvedCount + rejectedCount + correctionsCount;

  return (
    <TooltipProvider>
      <div className="flex flex-wrap gap-1.5">
        {hasLearning && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge 
                variant="outline" 
                className="gap-1 text-xs bg-purple-500/10 text-purple-600 border-purple-500/20 cursor-help"
              >
                <Brain className="h-3 w-3" />
                Learning Active
              </Badge>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-xs">
              <div className="space-y-1 text-xs">
                <p className="font-medium">AI Learning from your feedback:</p>
                <ul className="space-y-0.5 text-muted-foreground">
                  <li>• {approvedCount} approved insights (AI generates more like these)</li>
                  <li>• {rejectedCount} rejected insights (AI avoids similar patterns)</li>
                  <li>• {correctionsCount} corrections (AI learns your preferences)</li>
                </ul>
              </div>
            </TooltipContent>
          </Tooltip>
        )}
        
        {parentEntityName && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge 
                variant="outline" 
                className="gap-1 text-xs bg-blue-500/10 text-blue-600 border-blue-500/20 cursor-help"
              >
                <GitBranch className="h-3 w-3" />
                Linked to {parentEntityName}
              </Badge>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p className="text-xs">
                This analysis incorporates insights from the parent brand
              </p>
            </TooltipContent>
          </Tooltip>
        )}
        
        {feedbackScore !== undefined && totalFeedback > 0 && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge 
                variant="outline" 
                className={`gap-1 text-xs cursor-help ${
                  feedbackScore >= 50 
                    ? 'bg-green-500/10 text-green-600 border-green-500/20' 
                    : feedbackScore >= 0
                    ? 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                    : 'bg-red-500/10 text-red-600 border-red-500/20'
                }`}
              >
                <ThumbsUp className="h-3 w-3" />
                {Math.round(feedbackScore)}% approval
              </Badge>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p className="text-xs">
                Based on {totalFeedback} feedback submissions
              </p>
            </TooltipContent>
          </Tooltip>
        )}
        
        {!hasLearning && !parentEntityName && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge 
                variant="outline" 
                className="gap-1 text-xs bg-muted text-muted-foreground cursor-help"
              >
                <Sparkles className="h-3 w-3" />
                Ready to learn
              </Badge>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p className="text-xs">
                Approve or reject insights to help AI learn your preferences
              </p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  );
};
