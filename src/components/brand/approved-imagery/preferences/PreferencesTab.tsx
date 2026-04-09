import { Eye, Tag, Palette, Paintbrush } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { VisualDNA } from '@/hooks/useImageryPreferenceLearning';

interface PreferencesTabProps {
  visualDna: VisualDNA;
}

export const PreferencesTab = ({ visualDna }: PreferencesTabProps) => {
  const patterns = visualDna.approval_patterns || {};
  const topThemes = Array.isArray(patterns.top_themes) ? patterns.top_themes.slice(0, 6) : [];
  const moodKw = Array.isArray(visualDna.mood_keywords) ? visualDna.mood_keywords.slice(0, 10) : [];
  const topCategories = Array.isArray(visualDna.preferred_categories) ? visualDna.preferred_categories.slice(0, 6) : [];
  const colors = Array.isArray(visualDna.preferred_colors) ? visualDna.preferred_colors.slice(0, 10) : [];
  const styles = Array.isArray(visualDna.preferred_styles) ? visualDna.preferred_styles.slice(0, 6) : [];

  return (
    <div className="space-y-4">
      {/* Preferred Themes */}
      {topThemes.length > 0 && (
        <Section icon={<Eye className="h-3.5 w-3.5" />} label="Preferred Themes">
          <div className="flex flex-wrap gap-1.5">
            {topThemes.map((theme, i) => (
              <Badge key={i} variant="secondary" className="text-[11px] bg-green-500/10 text-green-700 dark:text-green-300 border-green-500/20">
                {theme}
              </Badge>
            ))}
          </div>
        </Section>
      )}

      {/* Mood & Style */}
      {moodKw.length > 0 && (
        <Section icon={<Tag className="h-3.5 w-3.5" />} label="Mood & Style">
          <div className="flex flex-wrap gap-1.5">
            {moodKw.map((kw, i) => (
              <Badge key={i} variant="outline" className="text-[11px]">{kw}</Badge>
            ))}
          </div>
        </Section>
      )}

      {/* Top Categories */}
      {topCategories.length > 0 && (
        <Section icon={<Palette className="h-3.5 w-3.5" />} label="Top Categories">
          <div className="space-y-1.5">
            {topCategories.map((cat, i) => (
              <div key={i} className="flex items-center gap-2 text-xs">
                <span className="flex-1 truncate text-foreground">{cat.name}</span>
                <div className="w-24 h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${Math.min(cat.weight * 100, 100)}%` }}
                  />
                </div>
                <span className="text-[10px] text-muted-foreground w-8 text-right">
                  {Math.round(cat.weight * 100)}%
                </span>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Preferred Colors */}
      {colors.length > 0 && (
        <Section icon={<Paintbrush className="h-3.5 w-3.5" />} label="Preferred Colors">
          <div className="flex flex-wrap gap-2">
            {colors.map((c, i) => (
              <div key={i} className="flex flex-col items-center gap-0.5">
                <div
                  className="rounded-full border border-border"
                  style={{
                    backgroundColor: c.color,
                    width: `${Math.max(20, Math.min(32, c.weight * 32))}px`,
                    height: `${Math.max(20, Math.min(32, c.weight * 32))}px`,
                  }}
                />
                <span className="text-[9px] text-muted-foreground">{c.color}</span>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Preferred Styles */}
      {styles.length > 0 && (
        <Section icon={<Eye className="h-3.5 w-3.5" />} label="Preferred Styles">
          <div className="space-y-1.5">
            {styles.map((s, i) => (
              <div key={i} className="flex items-center gap-2 text-xs">
                <span className="flex-1 truncate text-foreground">{s.style}</span>
                <div className="w-24 h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-accent transition-all"
                    style={{ width: `${Math.min(s.weight * 100, 100)}%` }}
                  />
                </div>
                <span className="text-[10px] text-muted-foreground w-8 text-right">
                  {Math.round(s.weight * 100)}%
                </span>
              </div>
            ))}
          </div>
        </Section>
      )}
    </div>
  );
};

const Section = ({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) => (
  <div className="space-y-1.5">
    <p className="text-xs font-medium text-foreground flex items-center gap-1.5">
      {icon} {label}
    </p>
    {children}
  </div>
);
