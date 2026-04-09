import { Lightbulb, Shapes } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { VisualDNA } from '@/hooks/useImageryPreferenceLearning';

interface InsightsTabProps {
  visualDna: VisualDNA;
}

export const InsightsTab = ({ visualDna }: InsightsTabProps) => {
  const patterns = visualDna.approval_patterns || {};
  const compositions = Array.isArray(visualDna.preferred_compositions) ? visualDna.preferred_compositions : [];
  const preferred = compositions.filter(c => c.preference !== 'avoid' && c.preference !== 'dislike');

  const hasContent = patterns.style_preference || patterns.diversity_inclination || preferred.length > 0;

  if (!hasContent) {
    return (
      <p className="text-xs text-muted-foreground py-4 text-center">
        More data needed to generate deeper insights. Continue reviewing images.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {/* Style Preference */}
      {patterns.style_preference && (
        <div className="space-y-1">
          <p className="text-xs font-medium text-foreground flex items-center gap-1.5">
            <Lightbulb className="h-3.5 w-3.5 text-amber-500" /> Style Preference
          </p>
          <div className="rounded-md bg-muted/40 p-3">
            <p className="text-xs leading-relaxed text-foreground">{patterns.style_preference}</p>
          </div>
        </div>
      )}

      {/* Diversity Inclination */}
      {patterns.diversity_inclination && (
        <div className="space-y-1">
          <p className="text-xs font-medium text-foreground">Diversity & Inclusion</p>
          <div className="rounded-md bg-muted/40 p-3">
            <p className="text-xs leading-relaxed text-foreground">{patterns.diversity_inclination}</p>
          </div>
        </div>
      )}

      {/* Preferred Compositions */}
      {preferred.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-foreground flex items-center gap-1.5">
            <Shapes className="h-3.5 w-3.5" /> Composition Preferences
          </p>
          <div className="flex flex-wrap gap-1.5">
            {preferred.map((c, i) => (
              <Badge key={i} variant="secondary" className="text-[11px]">
                {c.type} → {c.preference}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
