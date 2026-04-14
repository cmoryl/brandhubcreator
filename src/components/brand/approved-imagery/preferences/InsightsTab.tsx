import { Lightbulb, Shapes, Palette, FileText } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { VisualDNA } from '@/hooks/useImageryPreferenceLearning';

interface InsightsTabProps {
  visualDna: VisualDNA;
}

export const InsightsTab = ({ visualDna }: InsightsTabProps) => {
  const patterns = visualDna.approval_patterns || {};
  const compositions = Array.isArray(visualDna.preferred_compositions) ? visualDna.preferred_compositions : [];
  const preferred = compositions.filter(c => c.preference !== 'avoid' && c.preference !== 'dislike');
  const colors = Array.isArray(visualDna.preferred_colors) ? visualDna.preferred_colors : [];
  const ds = visualDna.data_sources;

  const hasContent = patterns.style_preference || patterns.diversity_inclination || preferred.length > 0 || colors.length > 0;

  if (!hasContent) {
    return (
      <p className="text-xs text-muted-foreground py-4 text-center">
        More data needed to generate deeper insights. Continue reviewing images or add brand materials.
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

      {/* Preferred Color Palette from AI */}
      {colors.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-foreground flex items-center gap-1.5">
            <Palette className="h-3.5 w-3.5 text-primary" /> Detected Palette Preference
          </p>
          <div className="flex gap-1.5">
            {colors.slice(0, 8).map((c, i) => (
              <div
                key={i}
                className="w-7 h-7 rounded-md border border-border shadow-sm"
                style={{ backgroundColor: c.color }}
                title={`${c.color} (weight: ${Math.round(c.weight * 100)}%)`}
              />
            ))}
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

      {/* Data richness indicator */}
      {ds && (
        <div className="rounded-md bg-muted/30 p-2.5">
          <p className="text-[10px] text-muted-foreground flex items-center gap-1.5">
            <FileText className="h-3 w-3 shrink-0" />
            Analysis synthesized from {ds.interaction_signals || 0} interactions, {ds.approved_imagery || 0} approved images, {ds.vault_assets || 0} vault assets, {ds.brand_colors || 0} brand colors, and {ds.collateral_items || 0} collateral items
            {ds.has_visual_analysis ? ' + visual audit data' : ''}
            {ds.has_inclusive_assessment ? ' + inclusion assessment' : ''}.
          </p>
        </div>
      )}
    </div>
  );
};