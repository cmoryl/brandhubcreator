import { useState } from 'react';
import { Loader2, Sparkles, TrendingUp, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { runAutoImproveLoop, type LoopIteration } from '@/lib/skillAutoImproveLoop';
import { downloadPatchedSkill } from '@/lib/skillEnhanceClient';
import { requestSkillAutofix } from '@/lib/skillEnhanceClient';
import type { BrandGuide, ProductGuide } from '@/types/brand';
import type { EventGuide } from '@/types/event';
import type { SkillQAReport } from '@/lib/skillQAClient';

type AnyGuide = BrandGuide | ProductGuide | EventGuide;

const scoreColor = (s: number) =>
  s >= 80 ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
  : s >= 60 ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
  : 'bg-destructive/15 text-destructive';

interface Props {
  guide: AnyGuide;
  initialReport: SkillQAReport;
  onLatestReport?: (r: SkillQAReport) => void;
  onLoopComplete?: () => void;
}

/** Run-until-target loop: QA → autofix → re-QA, capped by maxIterations. */
export const AutoImproveLoopPanel = ({ guide, initialReport, onLatestReport, onLoopComplete }: Props) => {
  const [target, setTarget] = useState(80);
  const [maxIter, setMaxIter] = useState(3);
  const [running, setRunning] = useState(false);
  const [phase, setPhase] = useState<'idle' | 'qa' | 'autofix' | 'done'>('idle');
  const [activeIter, setActiveIter] = useState(0);
  const [iters, setIters] = useState<LoopIteration[]>([]);
  const [downloading, setDownloading] = useState(false);

  const minScore = (r: SkillQAReport) => {
    const vals = Object.values(r.summary.avgScoreByTier || {}).map(Number);
    return vals.length ? Math.min(...vals) : 0;
  };
  const initMin = minScore(initialReport);
  const lastIter = iters[iters.length - 1];
  const finalMin = lastIter?.minScore ?? initMin;
  const reachedTarget = finalMin >= target;

  const start = async () => {
    setRunning(true); setIters([]); setPhase('qa'); setActiveIter(1);
    const tId = toast.loading('Auto-improving skill…');
    try {
      const result = await runAutoImproveLoop(guide, {
        targetScore: target,
        maxIterations: maxIter,
        onPhase: (p, i) => { setPhase(p); setActiveIter(i); },
        onIteration: (it) => {
          setIters((prev) => [...prev, it]);
          onLatestReport?.(it.report);
        },
      });
      const last = result[result.length - 1];
      const reached = last && last.minScore >= target;
      toast[reached ? 'success' : 'info'](
        reached ? `Reached ${last.minScore}/100 in ${result.length} iteration${result.length === 1 ? '' : 's'}` : `Stopped at ${last?.minScore ?? 0}/100 after ${result.length} iteration${result.length === 1 ? '' : 's'}`,
        { id: tId },
      );
      onLoopComplete?.();
    } catch (e: any) {
      toast.error(e?.message || 'Loop failed', { id: tId });
    } finally {
      setRunning(false); setPhase('done');
    }
  };

  const downloadFinal = async () => {
    if (!lastIter) return;
    // Re-derive the final cumulative patches by asking autofix once more on the
    // last report. Cheaper than tracking patches per iter and good enough for export.
    setDownloading(true);
    const tId = toast.loading('Building patched skill zip…');
    try {
      const { buildSkillContextFromGuide } = await import('@/lib/skillEnhanceClient');
      const skill = await buildSkillContextFromGuide(guide);
      const fix = await requestSkillAutofix(skill, lastIter.report);
      await downloadPatchedSkill(guide, fix.patches);
      toast.success('Patched skill downloaded', { id: tId });
    } catch (e: any) {
      toast.error(e?.message || 'Download failed', { id: tId });
    } finally {
      setDownloading(false);
    }
  };

  const phaseLabel =
    phase === 'qa' ? `Running QA (iteration ${activeIter}/${maxIter})…`
    : phase === 'autofix' ? `Proposing patches (iteration ${activeIter})…`
    : phase === 'done' ? 'Done'
    : '';

  return (
    <div className="rounded-md border border-primary/30 bg-primary/5 p-3 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 font-medium text-sm">
          <Sparkles className="h-4 w-4 text-primary" /> Auto-improve loop
          <span className="text-xs font-normal text-muted-foreground">
            QA → patch → re-QA, until target.
          </span>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-muted-foreground">Target</label>
          <input
            type="number" min={50} max={100} value={target} disabled={running}
            onChange={(e) => setTarget(Math.max(50, Math.min(100, Number(e.target.value) || 80)))}
            className="w-14 text-xs rounded border bg-background px-2 py-1"
          />
          <label className="text-xs text-muted-foreground">Max iters</label>
          <input
            type="number" min={1} max={5} value={maxIter} disabled={running}
            onChange={(e) => setMaxIter(Math.max(1, Math.min(5, Number(e.target.value) || 3)))}
            className="w-14 text-xs rounded border bg-background px-2 py-1"
          />
          <Button size="sm" onClick={start} disabled={running} className="gap-1">
            {running ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <TrendingUp className="h-3.5 w-3.5" />}
            {running ? 'Running…' : 'Start'}
          </Button>
        </div>
      </div>

      {running && (
        <div className="space-y-1">
          <div className="text-xs text-muted-foreground">{phaseLabel}</div>
          <Progress value={(activeIter / maxIter) * 100} />
        </div>
      )}

      {iters.length > 0 && (
        <div className="space-y-1">
          <div className="grid grid-cols-[auto,1fr,auto] gap-2 text-xs items-center">
            <div className="text-muted-foreground">Start</div>
            <div className="text-muted-foreground">Initial min score</div>
            <Badge className={scoreColor(initMin)}>{initMin}/100</Badge>
            {iters.map((it) => (
              <div key={it.iteration} className="contents">
                <div className="text-muted-foreground">#{it.iteration}</div>
                <div className="truncate text-muted-foreground">
                  {it.patchedFiles.length > 0
                    ? <>Patched: {it.patchedFiles.map((p) => <code key={p} className="text-[10px] mr-1">{p}</code>)}</>
                    : <em>No patches applied</em>}
                </div>
                <Badge className={scoreColor(it.minScore)}>{it.minScore}/100</Badge>
              </div>
            ))}
          </div>

          {!running && (
            <div className="flex items-center justify-between gap-2 mt-2 pt-2 border-t">
              <div className="flex items-center gap-2 text-sm">
                {reachedTarget
                  ? <><CheckCircle2 className="h-4 w-4 text-emerald-500" /> Reached target ({finalMin}/{target}).</>
                  : <><AlertTriangle className="h-4 w-4 text-amber-500" /> Stopped at {finalMin}/{target}.</>
                }
              </div>
              <Button size="sm" variant="outline" onClick={downloadFinal} disabled={downloading} className="gap-1">
                {downloading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                Download patched skill
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
