import { EyeOff, ShieldAlert } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { VisualDNA } from '@/hooks/useImageryPreferenceLearning';

interface AvoidTabProps {
  visualDna: VisualDNA;
}

export const AvoidTab = ({ visualDna }: AvoidTabProps) => {
  const patterns = visualDna.approval_patterns || {};
  const avoidKw = Array.isArray(visualDna.avoid_keywords) ? visualDna.avoid_keywords.slice(0, 10) : [];
  const rejectionReasons = Array.isArray(patterns.rejection_reasons) ? patterns.rejection_reasons.slice(0, 6) : [];
  const compositions = Array.isArray(visualDna.preferred_compositions) ? visualDna.preferred_compositions : [];
  const disliked = compositions.filter(c => c.preference === 'avoid' || c.preference === 'dislike');

  if (avoidKw.length === 0 && rejectionReasons.length === 0 && disliked.length === 0) {
    return (
      <p className="text-xs text-muted-foreground py-4 text-center">
        No avoidance patterns detected yet. Keep reviewing images to build this profile.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {/* Avoid keywords */}
      {avoidKw.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-destructive flex items-center gap-1.5">
            <EyeOff className="h-3.5 w-3.5" /> Avoid Keywords
          </p>
          <div className="flex flex-wrap gap-1.5">
            {avoidKw.map((kw, i) => (
              <Badge key={i} variant="outline" className="text-[11px] border-destructive/30 text-destructive">
                {kw}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Rejection reasons */}
      {rejectionReasons.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
            <ShieldAlert className="h-3.5 w-3.5" /> Rejection Reasons
          </p>
          <div className="rounded-md border border-destructive/20 bg-destructive/5 p-2.5 space-y-1">
            {rejectionReasons.map((reason, i) => (
              <div key={i} className="flex items-start gap-1.5 text-xs text-foreground">
                <span className="text-destructive mt-0.5 shrink-0">•</span>
                <span>{reason}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Disliked compositions */}
      {disliked.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground">Composition Dislikes</p>
          <div className="flex flex-wrap gap-1.5">
            {disliked.map((c, i) => (
              <Badge key={i} variant="outline" className="text-[11px] border-destructive/20 text-destructive/80">
                {c.type}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
