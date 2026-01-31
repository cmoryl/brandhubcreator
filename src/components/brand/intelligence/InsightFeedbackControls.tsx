import { useState } from 'react';
import { ThumbsUp, ThumbsDown, Pencil, Check, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface InsightFeedbackControlsProps {
  insightId: string;
  currentFeedback?: {
    status: 'approved' | 'rejected' | 'corrected';
    correction_text?: string;
  };
  onSubmitFeedback: (insightId: string, status: 'approved' | 'rejected' | 'corrected', correctionText?: string) => Promise<void>;
  disabled?: boolean;
}

export const InsightFeedbackControls = ({
  insightId,
  currentFeedback,
  onSubmitFeedback,
  disabled = false,
}: InsightFeedbackControlsProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [correctionText, setCorrectionText] = useState(currentFeedback?.correction_text || '');

  const handleFeedback = async (status: 'approved' | 'rejected' | 'corrected', correction?: string) => {
    if (disabled || isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      await onSubmitFeedback(insightId, status, correction);
      if (status === 'corrected') {
        setIsEditing(false);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusStyles = (status: 'approved' | 'rejected' | 'corrected') => {
    if (currentFeedback?.status === status) {
      switch (status) {
        case 'approved':
          return 'bg-green-500/20 text-green-600 border-green-500/30';
        case 'rejected':
          return 'bg-red-500/20 text-red-600 border-red-500/30';
        case 'corrected':
          return 'bg-amber-500/20 text-amber-600 border-amber-500/30';
      }
    }
    return '';
  };

  if (isSubmitting) {
    return (
      <div className="flex items-center gap-1">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  'h-7 w-7 transition-colors',
                  getStatusStyles('approved'),
                  currentFeedback?.status !== 'approved' && 'opacity-60 hover:opacity-100'
                )}
                onClick={() => handleFeedback('approved')}
                disabled={disabled}
              >
                <ThumbsUp className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p className="text-xs">Approve - AI will generate more like this</p>
            </TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  'h-7 w-7 transition-colors',
                  getStatusStyles('rejected'),
                  currentFeedback?.status !== 'rejected' && 'opacity-60 hover:opacity-100'
                )}
                onClick={() => handleFeedback('rejected')}
                disabled={disabled}
              >
                <ThumbsDown className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p className="text-xs">Reject - AI will avoid similar patterns</p>
            </TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  'h-7 w-7 transition-colors',
                  getStatusStyles('corrected'),
                  !isEditing && currentFeedback?.status !== 'corrected' && 'opacity-60 hover:opacity-100'
                )}
                onClick={() => setIsEditing(!isEditing)}
                disabled={disabled}
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p className="text-xs">Correct - Provide better wording</p>
            </TooltipContent>
          </Tooltip>
        </div>
        
        {isEditing && (
          <div className="flex gap-2 animate-in slide-in-from-top-2 duration-200">
            <Textarea
              value={correctionText}
              onChange={(e) => setCorrectionText(e.target.value)}
              placeholder="Enter your preferred wording..."
              className="min-h-[60px] text-sm flex-1"
            />
            <div className="flex flex-col gap-1">
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 text-green-600 hover:bg-green-500/10"
                onClick={() => handleFeedback('corrected', correctionText)}
                disabled={!correctionText.trim()}
              >
                <Check className="h-3.5 w-3.5" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 text-muted-foreground hover:bg-muted"
                onClick={() => setIsEditing(false)}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}
        
        {currentFeedback?.status === 'corrected' && currentFeedback.correction_text && !isEditing && (
          <p className="text-xs text-amber-600 bg-amber-500/10 px-2 py-1 rounded">
            Your correction: "{currentFeedback.correction_text}"
          </p>
        )}
      </div>
    </TooltipProvider>
  );
};
