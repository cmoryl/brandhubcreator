/**
 * Learned Preferences Panel — Redesigned with tabbed layout
 */

import { Brain, RefreshCw, Loader2, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { VisualDNA } from '@/hooks/useImageryPreferenceLearning';
import { OverviewTab } from './preferences/OverviewTab';
import { PreferencesTab } from './preferences/PreferencesTab';
import { AvoidTab } from './preferences/AvoidTab';
import { InsightsTab } from './preferences/InsightsTab';

interface LearnedPreferencesPanelProps {
  visualDna: VisualDNA | null;
  signalCount: number;
  isAnalyzing: boolean;
  isLoading: boolean;
  onAnalyze: () => void;
  onApplyToSearch?: (query: string) => void;
  maxHeight?: string;
}

export const LearnedPreferencesPanel = ({
  visualDna,
  signalCount,
  isAnalyzing,
  isLoading,
  onAnalyze,
  onApplyToSearch,
  maxHeight,
}: LearnedPreferencesPanelProps) => {
  if (isLoading) {
    return (
      <div className="flex items-center gap-2 py-3 text-muted-foreground text-xs">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        Loading learned preferences...
      </div>
    );
  }

  if (!visualDna && signalCount === 0) {
    return (
      <div className="flex items-center gap-2 p-3 rounded-lg border border-dashed border-border bg-muted/20">
        <Brain className="h-4 w-4 text-muted-foreground shrink-0" />
        <div className="flex-1">
          <p className="text-xs text-muted-foreground">
            <span className="font-medium text-foreground">Preference Learning</span> — Approve or skip images to teach the AI your brand's visual taste.
          </p>
        </div>
      </div>
    );
  }

  if (!visualDna && signalCount > 0) {
    return (
      <div className="flex items-center gap-2 p-3 rounded-lg border border-primary/20 bg-primary/5">
        <Brain className="h-4 w-4 text-primary shrink-0" />
        <div className="flex-1">
          <p className="text-xs">
            <span className="font-medium">{signalCount} interactions</span> recorded.
          </p>
          <p className="text-[11px] text-muted-foreground">Run analysis to build your Visual DNA profile.</p>
        </div>
        <Button size="sm" variant="outline" className="h-7 text-xs gap-1 shrink-0" onClick={onAnalyze} disabled={isAnalyzing}>
          {isAnalyzing ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
          Analyze
        </Button>
      </div>
    );
  }

  if (!visualDna) return null;

  const patterns = visualDna.approval_patterns || {};
  const topThemes = Array.isArray(patterns.top_themes) ? patterns.top_themes : [];
  const moodKw = Array.isArray(visualDna.mood_keywords) ? visualDna.mood_keywords : [];

  const handleApplyToSearch = () => {
    if (!onApplyToSearch) return;
    const terms = [...topThemes.slice(0, 3), ...moodKw.slice(0, 2)];
    if (terms.length > 0) {
      onApplyToSearch(terms.join(' '));
    }
  };

  return (
    <div
      className="rounded-lg border border-primary/20 bg-primary/5 p-3 space-y-3"
      style={maxHeight ? { maxHeight, overflowY: 'auto' } : undefined}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Brain className="h-4 w-4 text-primary" />
          <span className="text-xs font-semibold text-foreground">Learned Visual Preferences</span>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant="outline" className="text-[10px] px-1.5 h-5">
                {Math.round(visualDna.confidence_score || 0)}% confident
              </Badge>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs max-w-52">
              Based on {visualDna.total_approved} approvals, {visualDna.total_skipped} skips, {visualDna.total_removed} removals
            </TooltipContent>
          </Tooltip>
        </div>
        <div className="flex items-center gap-1">
          {onApplyToSearch && topThemes.length > 0 && (
            <Button size="sm" variant="outline" className="h-6 text-[10px] gap-1 px-2" onClick={handleApplyToSearch}>
              <Wand2 className="h-2.5 w-2.5" /> Apply to Search
            </Button>
          )}
          <Button size="sm" variant="ghost" className="h-6 text-[10px] gap-1 px-1.5" onClick={onAnalyze} disabled={isAnalyzing}>
            {isAnalyzing ? <Loader2 className="h-2.5 w-2.5 animate-spin" /> : <RefreshCw className="h-2.5 w-2.5" />}
            Re-analyze
          </Button>
        </div>
      </div>

      {/* Tabbed content */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="w-full h-8 bg-muted/50">
          <TabsTrigger value="overview" className="text-[11px] flex-1 h-6 data-[state=active]:bg-background">Overview</TabsTrigger>
          <TabsTrigger value="preferences" className="text-[11px] flex-1 h-6 data-[state=active]:bg-background">Preferences</TabsTrigger>
          <TabsTrigger value="avoid" className="text-[11px] flex-1 h-6 data-[state=active]:bg-background">Avoid</TabsTrigger>
          <TabsTrigger value="insights" className="text-[11px] flex-1 h-6 data-[state=active]:bg-background">Insights</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="mt-3">
          <OverviewTab visualDna={visualDna} />
        </TabsContent>
        <TabsContent value="preferences" className="mt-3">
          <PreferencesTab visualDna={visualDna} />
        </TabsContent>
        <TabsContent value="avoid" className="mt-3">
          <AvoidTab visualDna={visualDna} />
        </TabsContent>
        <TabsContent value="insights" className="mt-3">
          <InsightsTab visualDna={visualDna} />
        </TabsContent>
      </Tabs>
    </div>
  );
};
