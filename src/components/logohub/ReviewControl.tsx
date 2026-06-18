import { useEffect, useState } from 'react';
import { Check, MessageSquare, Pencil, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import type { LogoAuditReview, ReviewStatus } from '@/hooks/useLogoAuditReviews';

const STATUS_LABEL: Record<ReviewStatus, string> = {
  pending: 'Pending',
  reviewed: 'Reviewed',
  approved: 'Approved',
  rejected: 'Rejected',
};

const STATUS_CLS: Record<ReviewStatus, string> = {
  pending: 'bg-muted text-muted-foreground',
  reviewed: 'bg-blue-500/15 text-blue-700 dark:text-blue-300',
  approved: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
  rejected: 'bg-red-500/15 text-red-700 dark:text-red-300',
};

interface Props {
  review: LogoAuditReview | undefined;
  canEdit: boolean;
  compact?: boolean;
  onSave: (input: { status: ReviewStatus; notes: string | null }) => Promise<boolean | void>;
  onClear?: () => Promise<boolean | void>;
}

export function ReviewControl({ review, canEdit, compact, onSave, onClear }: Props) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<ReviewStatus>(review?.status ?? 'reviewed');
  const [notes, setNotes] = useState(review?.notes ?? '');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setStatus(review?.status ?? 'reviewed');
    setNotes(review?.notes ?? '');
  }, [review?.id, review?.status, review?.notes]);

  const reviewedAt = review?.reviewed_at ? new Date(review.reviewed_at) : null;
  const ageDays = reviewedAt
    ? Math.floor((Date.now() - reviewedAt.getTime()) / 86_400_000)
    : null;
  const isStale = ageDays !== null && ageDays >= 90;

  const badge = review ? (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium',
        STATUS_CLS[review.status],
      )}
    >
      <MessageSquare className="h-3 w-3" />
      {STATUS_LABEL[review.status]}
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
      <MessageSquare className="h-3 w-3" />
      No review
    </span>
  );

  const meta = review ? (
    <div className="flex flex-col gap-0.5 text-[9px] text-muted-foreground">
      {ageDays !== null && (
        <span
          className={cn(
            isStale && 'text-amber-600 dark:text-amber-400 font-medium',
          )}
          title={reviewedAt?.toISOString()}
        >
          {ageDays === 0
            ? 'reviewed today'
            : `reviewed ${ageDays}d ago`}
          {isStale && ' · stale, re-review'}
        </span>
      )}
      {review.reviewed_by && (
        <span title={review.reviewed_by}>
          by {review.reviewed_by.slice(0, 8)}…
        </span>
      )}
    </div>
  ) : null;

  if (!canEdit) {
    return (
      <div className={cn('flex flex-col items-start gap-0.5', compact && 'text-[10px]')}>
        {badge}
        {review?.notes && (
          <p className="text-[10px] text-muted-foreground max-w-[200px] line-clamp-3">
            {review.notes}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <div className="flex items-center gap-1">
        {badge}
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button size="sm" variant="ghost" className="h-6 w-6 p-0" title="Edit review">
              <Pencil className="h-3 w-3" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-3 space-y-2" align="start">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold">Review note</span>
              {review && onClear && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 px-2 text-[10px] text-red-600 hover:text-red-700"
                  disabled={busy}
                  onClick={async () => {
                    setBusy(true);
                    await onClear();
                    setBusy(false);
                    setOpen(false);
                  }}
                >
                  <Trash2 className="h-3 w-3 mr-1" /> Clear
                </Button>
              )}
            </div>
            <Select value={status} onValueChange={(v) => setStatus(v as ReviewStatus)}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="reviewed">Reviewed</SelectItem>
                <SelectItem value="approved">Approved (accept FAIL/WARN)</SelectItem>
                <SelectItem value="rejected">Rejected (needs fix)</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
            <Textarea
              placeholder="Notes — e.g. 'PNG is fine, brand has no SVG'"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="text-xs"
            />
            <div className="flex items-center justify-end gap-1">
              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-xs"
                disabled={busy}
                onClick={() => setOpen(false)}
              >
                <X className="h-3 w-3 mr-1" /> Cancel
              </Button>
              <Button
                size="sm"
                className="h-7 text-xs"
                disabled={busy}
                onClick={async () => {
                  setBusy(true);
                  const ok = await onSave({ status, notes: notes.trim() || null });
                  setBusy(false);
                  if (ok !== false) setOpen(false);
                }}
              >
                <Check className="h-3 w-3 mr-1" /> Save
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>
      {review?.notes && !open && (
        <p className="text-[10px] text-muted-foreground max-w-[220px] line-clamp-3">
          {review.notes}
        </p>
      )}
    </div>
  );
}
