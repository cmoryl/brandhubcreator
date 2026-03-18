/**
 * Learned Preferences Panel
 * Shows the AI-learned visual DNA and preference insights for an entity
 */

import { Brain, RefreshCw, Loader2, TrendingUp, TrendingDown, Palette, Tag, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { VisualDNA } from '@/hooks/useImageryPreferenceLearning';
import { cn } from '@/lib/utils';

interface LearnedPreferencesPanelProps {
  visualDna: VisualDNA | null;
  signalCount: number;
  isAnalyzing: boolean;
  isLoading: boolean;
  onAnalyze: () => void;
}

export const LearnedPreferencesPanel = ({
  visualDna,
  signalCount,
  isAnalyzing,
  isLoading,
  onAnalyze,
}: LearnedPreferencesPanelProps) => {
  if (isLoading) {
    return (
      <div className="flex items-center gap-2 py-2 text-muted-foreground text-xs">
        <Loader2 className="h-3 w-3 animate-spin" />
        Loading learned preferences...
      </div>
    );
  }

  // No data yet
  if (!visualDna && signalCount === 0) {
    return (
      <div className="flex items-center gap-2 p-2.5 rounded-lg border border-dashed border-border bg-muted/20">
        <Brain className="h-4 w-4 text-muted-foreground shrink-0" />
        <div className="flex-1">
          <p className="text-xs text-muted-foreground">
            <span className="font-medium text-foreground">Preference Learning</span> — Approve or skip images to teach the AI your brand's visual taste.
          </p>
        </div>
      </div>
    );
  }

  // Have signals but no analysis yet
  if (!visualDna && signalCount > 0) {
    return (
      <div className="flex items-center gap-2 p-2.5 rounded-lg border border-primary/20 bg-primary/5">
        <Brain className="h-4 w-4 text-primary shrink-0" />
        <div className="flex-1">
          <p className="text-xs">
            <span className="font-medium">{signalCount} interactions</span> recorded.
          </p>
          <p className="text-[10px] text-muted-foreground">Run analysis to build your Visual DNA profile.</p>
        </div>
        <Button size="sm" variant="outline" className="h-6 text-[10px] gap-1 shrink-0" onClick={onAnalyze} disabled={isAnalyzing}>
          {isAnalyzing ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
          Analyze
        </Button>
      </div>
    );
  }

  if (!visualDna) return null;

  const patterns = visualDna.approval_patterns || {};
  const topCategories = Array.isArray(visualDna.preferred_categories)
    ? visualDna.preferred_categories.slice(0, 5) : [];
  const moodKw = Array.isArray(visualDna.mood_keywords) ? visualDna.mood_keywords.slice(0, 8) : [];
  const avoidKw = Array.isArray(visualDna.avoid_keywords) ? visualDna.avoid_keywords.slice(0, 6) : [];
  const topThemes = Array.isArray(patterns.top_themes) ? patterns.top_themes.slice(0, 5) : [];
  const rejectionReasons = Array.isArray(patterns.rejection_reasons) ? patterns.rejection_reasons.slice(0, 4) : [];

  return (
    <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 space-y-2.5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Brain className="h-4 w-4 text-primary" />
          <span className="text-xs font-semibold text-foreground">Learned Visual Preferences</span>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant="outline" className="text-[9px] px-1 h-4">
                {Math.round(visualDna.confidence_score || 0)}% confident
              </Badge>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs max-w-48">
              Based on {visualDna.total_approved} approvals, {visualDna.total_skipped} skips, {visualDna.total_removed} removals
            </TooltipContent>
          </Tooltip>
        </div>
        <Button size="sm" variant="ghost" className="h-5 text-[9px] gap-1 px-1.5" onClick={onAnalyze} disabled={isAnalyzing}>
          {isAnalyzing ? <Loader2 className="h-2.5 w-2.5 animate-spin" /> : <RefreshCw className="h-2.5 w-2.5" />}
          Re-analyze
        </Button>
      </div>

      {/* Confidence bar */}
      <Progress value={visualDna.confidence_score || 0} className="h-1" />

      {/* Summary */}
      {patterns.summary && (
        <p className="text-[10px] text-muted-foreground leading-relaxed">{patterns.summary}</p>
      )}

      {/* Stats row */}
      <div className="flex gap-3 text-[10px]">
        <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
          <TrendingUp className="h-3 w-3" /> {visualDna.total_approved} approved
        </span>
        <span className="flex items-center gap-1 text-muted-foreground">
          <EyeOff className="h-3 w-3" /> {visualDna.total_skipped} skipped
        </span>
        <span className="flex items-center gap-1 text-red-500">
          <TrendingDown className="h-3 w-3" /> {visualDna.total_removed} removed
        </span>
      </div>

      {/* Top themes */}
      {topThemes.length > 0 && (
        <div className="space-y-1">
          <p className="text-[10px] font-medium text-foreground flex items-center gap-1">
            <Eye className="h-3 w-3" /> Preferred Themes
          </p>
          <div className="flex flex-wrap gap-1">
            {topThemes.map((theme, i) => (
              <Badge key={i} variant="secondary" className="text-[9px] bg-green-500/10 text-green-700 dark:text-green-300 border-green-500/20">
                {theme}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Mood keywords */}
      {moodKw.length > 0 && (
        <div className="space-y-1">
          <p className="text-[10px] font-medium text-foreground flex items-center gap-1">
            <Tag className="h-3 w-3" /> Mood & Style
          </p>
          <div className="flex flex-wrap gap-1">
            {moodKw.map((kw, i) => (
              <Badge key={i} variant="outline" className="text-[9px]">{kw}</Badge>
            ))}
          </div>
        </div>
      )}

      {/* Avoid keywords */}
      {avoidKw.length > 0 && (
        <div className="space-y-1">
          <p className="text-[10px] font-medium text-destructive flex items-center gap-1">
            <EyeOff className="h-3 w-3" /> Avoid
          </p>
          <div className="flex flex-wrap gap-1">
            {avoidKw.map((kw, i) => (
              <Badge key={i} variant="outline" className="text-[9px] border-destructive/30 text-destructive">{kw}</Badge>
            ))}
          </div>
        </div>
      )}

      {/* Top categories */}
      {topCategories.length > 0 && (
        <div className="space-y-1">
          <p className="text-[10px] font-medium text-foreground flex items-center gap-1">
            <Palette className="h-3 w-3" /> Top Categories
          </p>
          <div className="space-y-0.5">
            {topCategories.map((cat, i) => (
              <div key={i} className="flex items-center gap-2 text-[10px]">
                <span className="flex-1 truncate">{cat.name}</span>
                <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${Math.min(cat.weight * 100, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Rejection insights */}
      {rejectionReasons.length > 0 && (
        <div className="space-y-1 pt-1 border-t border-border/50">
          <p className="text-[10px] font-medium text-muted-foreground">Why images were rejected:</p>
          <ul className="text-[10px] text-muted-foreground space-y-0.5">
            {rejectionReasons.map((reason, i) => (
              <li key={i} className="flex items-start gap-1">
                <span className="text-destructive mt-0.5">•</span> {reason}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
