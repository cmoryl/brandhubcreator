import { TrendingDown, TrendingUp, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { detectRegression } from '@/lib/skillRegressionDetector';
import type { SkillQAHistoryRow } from '@/lib/skillQAClient';

/** Compares the most recent two QA runs and renders a regression / improvement banner. */
export const SkillRegressionAlert = ({ history }: { history: SkillQAHistoryRow[] }) => {
  if (history.length < 2) return null;
  const [latest, previous] = history; // history is newest-first
  const d = detectRegression(latest, previous);

  if (!d.hasRegression && d.improvedTiers.length === 0) return null;

  if (d.hasRegression) {
    return (
      <div className="rounded-md border border-destructive/40 bg-destructive/5 p-3 space-y-2">
        <div className="flex items-center gap-2 text-sm font-medium text-destructive">
          <AlertTriangle className="h-4 w-4" /> Regression detected vs previous run
        </div>
        <div className="flex flex-wrap gap-1.5 text-xs">
          {d.tierDrops.map((t) => (
            <Badge key={t.tier} variant="outline" className="gap-1 border-destructive/40 text-destructive">
              <TrendingDown className="h-3 w-3" /> {t.tier} {t.from}→{t.to} ({t.delta})
            </Badge>
          ))}
          {d.newMissingSections.map((s) => (
            <Badge key={s} variant="outline" className="border-amber-500/40 text-amber-700 dark:text-amber-300">
              now missing: {s}
            </Badge>
          ))}
          {d.identityDrop && (
            <Badge variant="outline" className="gap-1 border-destructive/40 text-destructive">
              <TrendingDown className="h-3 w-3" /> identity {d.identityDrop.from}→{d.identityDrop.to}
            </Badge>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-md border border-emerald-500/40 bg-emerald-500/5 p-3 space-y-1.5">
      <div className="flex items-center gap-2 text-sm font-medium text-emerald-700 dark:text-emerald-300">
        <TrendingUp className="h-4 w-4" /> Improved vs previous run
      </div>
      <div className="flex flex-wrap gap-1.5 text-xs">
        {d.improvedTiers.map((t) => (
          <Badge key={t.tier} variant="outline" className="gap-1 border-emerald-500/40 text-emerald-700 dark:text-emerald-300">
            <TrendingUp className="h-3 w-3" /> {t.tier} {t.from}→{t.to} (+{t.delta})
          </Badge>
        ))}
      </div>
    </div>
  );
};
