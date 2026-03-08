/**
 * BoothScorePanel - Multi-dimensional booth scoring with AI
 * Evaluates Visibility, Traffic Flow, Brand Impact, Engagement Potential
 */
import { useState, useCallback } from 'react';
import {
  Sparkles, Loader2, Eye, Route, Palette, Users,
  Lightbulb, TrendingUp, ChevronDown, ChevronUp, Target
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface BoothScoreData {
  overallScore: number;
  visibility: number;
  trafficFlow: number;
  brandImpact: number;
  engagementPotential: number;
  suggestions: string[];
  strengths: string[];
}

interface BoothScorePanelProps {
  scoreData: BoothScoreData | null;
  onScoreData: (data: BoothScoreData) => void;
  isLoading: boolean;
  onRunScore: () => void;
  crowdScore?: number;
  isAdmin: boolean;
}

function ScoreMeter({ score, label, icon }: { score: number; label: string; icon: React.ReactNode }) {
  const color = score >= 80 ? 'text-green-500' : score >= 60 ? 'text-amber-500' : score >= 40 ? 'text-orange-500' : 'text-red-500';
  const bg = score >= 80 ? 'bg-green-500' : score >= 60 ? 'bg-amber-500' : score >= 40 ? 'bg-orange-500' : 'bg-red-500';

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {icon}
          <span className="text-[11px] font-medium">{label}</span>
        </div>
        <span className={cn("text-xs font-bold tabular-nums", color)}>{score}</span>
      </div>
      <Progress value={score} className="h-1.5" />
    </div>
  );
}

export function BoothScorePanel({
  scoreData,
  onScoreData,
  isLoading,
  onRunScore,
  crowdScore,
  isAdmin,
}: BoothScorePanelProps) {
  const [showSuggestions, setShowSuggestions] = useState(true);

  if (!scoreData && !isLoading) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Target className="h-4 w-4 text-primary" />
          <span className="text-xs font-semibold">Booth Score Intelligence</span>
        </div>
        <p className="text-[10px] text-muted-foreground leading-relaxed">
          Get a comprehensive AI evaluation of your booth's effectiveness across 4 key dimensions.
        </p>
        <Button
          onClick={onRunScore}
          disabled={!isAdmin || isLoading}
          className="w-full gap-2"
          size="sm"
        >
          <Sparkles className="h-4 w-4" />
          Analyze Booth
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-8 gap-3">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <p className="text-xs font-medium">Analyzing booth...</p>
      </div>
    );
  }

  if (!scoreData) return null;

  const overallColor = scoreData.overallScore >= 80 ? 'text-green-500' : scoreData.overallScore >= 60 ? 'text-amber-500' : 'text-orange-500';

  return (
    <div className="space-y-3">
      {/* Overall Score */}
      <div className="text-center py-2">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Overall Booth Score</p>
        <div className={cn("text-4xl font-bold tabular-nums", overallColor)}>
          {scoreData.overallScore}
        </div>
        <p className="text-[10px] text-muted-foreground">/100</p>
      </div>

      <Separator />

      {/* Dimension scores */}
      <div className="space-y-2.5">
        <ScoreMeter score={scoreData.visibility} label="Visibility" icon={<Eye className="h-3.5 w-3.5 text-muted-foreground" />} />
        <ScoreMeter score={scoreData.trafficFlow} label="Traffic Flow" icon={<Route className="h-3.5 w-3.5 text-muted-foreground" />} />
        <ScoreMeter score={scoreData.brandImpact} label="Brand Impact" icon={<Palette className="h-3.5 w-3.5 text-muted-foreground" />} />
        <ScoreMeter score={scoreData.engagementPotential} label="Engagement" icon={<Users className="h-3.5 w-3.5 text-muted-foreground" />} />
      </div>

      {/* Strengths */}
      {scoreData.strengths.length > 0 && (
        <>
          <Separator />
          <div className="space-y-1.5">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
              <TrendingUp className="h-3 w-3" /> Strengths
            </p>
            {scoreData.strengths.map((s, i) => (
              <p key={i} className="text-[11px] text-foreground flex items-start gap-1.5">
                <span className="text-green-500 shrink-0">✓</span>
                {s}
              </p>
            ))}
          </div>
        </>
      )}

      {/* Suggestions */}
      {scoreData.suggestions.length > 0 && (
        <>
          <Separator />
          <button
            onClick={() => setShowSuggestions(v => !v)}
            className="w-full flex items-center gap-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider"
          >
            <Lightbulb className="h-3 w-3" />
            Suggestions ({scoreData.suggestions.length})
            {showSuggestions ? <ChevronUp className="h-3 w-3 ml-auto" /> : <ChevronDown className="h-3 w-3 ml-auto" />}
          </button>
          {showSuggestions && (
            <div className="space-y-1.5">
              {scoreData.suggestions.map((s, i) => (
                <p key={i} className="text-[11px] text-muted-foreground flex items-start gap-1.5">
                  <span className="text-amber-500 shrink-0">→</span>
                  {s}
                </p>
              ))}
            </div>
          )}
        </>
      )}

      {/* Re-run */}
      <Button variant="outline" size="sm" className="w-full text-xs gap-1.5" onClick={onRunScore} disabled={isLoading}>
        <Sparkles className="h-3.5 w-3.5" />
        Re-analyze
      </Button>
    </div>
  );
}
