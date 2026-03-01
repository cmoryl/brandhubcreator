/**
 * GuideEmptyState - Coaching-oriented empty state for brand guide sections.
 * Shows a relevant visual, description, and actionable CTA instead of
 * a bare "No items yet" message.
 */

import { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface GuideEmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  canEdit?: boolean;
  className?: string;
  /** Optional hint shown below description for non-editors */
  readOnlyHint?: string;
}

export function GuideEmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  canEdit = false,
  className,
  readOnlyHint,
}: GuideEmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-14 px-6 text-center',
        'border-2 border-dashed border-border/50 rounded-xl',
        'bg-gradient-to-b from-muted/20 to-transparent',
        className
      )}
    >
      {/* Animated icon ring */}
      <div className="relative mb-5">
        <div className="w-16 h-16 rounded-2xl bg-primary/5 flex items-center justify-center">
          <Icon className="h-7 w-7 text-primary/40" />
        </div>
        <div className="absolute -inset-1 rounded-2xl border border-primary/10 animate-pulse" />
      </div>

      <h3 className="text-sm font-semibold text-foreground mb-1.5">
        {title}
      </h3>
      <p className="text-xs text-muted-foreground max-w-[280px] leading-relaxed mb-4">
        {description}
      </p>

      {canEdit && actionLabel && onAction ? (
        <Button
          size="sm"
          variant="outline"
          onClick={onAction}
          className="gap-1.5 text-xs border-primary/20 text-primary hover:bg-primary/5"
        >
          {actionLabel}
        </Button>
      ) : readOnlyHint ? (
        <p className="text-[10px] text-muted-foreground/60 italic">
          {readOnlyHint}
        </p>
      ) : null}
    </div>
  );
}
