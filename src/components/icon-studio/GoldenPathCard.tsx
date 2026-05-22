/**
 * GoldenPathCard — one-click TransPerfect / Tech-SaaS quickstart.
 *
 * Proves the full end-to-end flow: brand → generate (core + 5 subsets) →
 * QA → export. Lives on the Dashboard as the headline action so any new
 * user can see a real, working icon system inside ~2 minutes.
 *
 * Generation runs through the existing edge function via runGenerationQueue,
 * results are scored client-side via the QA engine, and the final bundle
 * ships via exportIconSystem with a manifest, contact sheet, and tokens.
 */

import { useCallback, useMemo, useState } from 'react';
import { Sparkles, Play, Download, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { BrandIconography } from '@/types/brand';
import {
  runGenerationQueue,
  coreEntryToTask,
  subSetToTask,
  type GenerationTask,
} from '@/lib/iconStudio/generationClient';
import { getIndustryById } from '@/lib/iconStudio/industryPresets';
import {
  buildRecipe,
  attachRecipe,
  TRANSPERFECT_BLUE,
  type IconRecipe,
} from '@/lib/iconStudio/recipe';
import { scoreLibrary } from '@/lib/iconStudio/qa';
import { exportIconSystem } from '@/lib/iconStudio/exportSystem';

interface Props {
  onSaveAsLibrary?: (name: string, icons: BrandIconography[]) => void;
}

const TARGET_SUBSET_IDS = new Set([
  'tech-feat-analytics',
  'tech-feat-security',
  'tech-feat-api',
  'tech-ctx-support',
]);

type Phase = 'idle' | 'generating' | 'qa' | 'ready' | 'exporting' | 'error';

export const GoldenPathCard = ({ onSaveAsLibrary }: Props) => {
  const [phase, setPhase] = useState<Phase>('idle');
  const [progress, setProgress] = useState(0);
  const [currentLabel, setCurrentLabel] = useState<string>('');
  const [icons, setIcons] = useState<BrandIconography[]>([]);
  const [error, setError] = useState<string | null>(null);

  const industry = getIndustryById('tech-saas')!;
  const baseRecipe: IconRecipe = useMemo(
    () =>
      buildRecipe({
        brand: 'TransPerfect',
        industry: 'Tech / SaaS',
        style: 'outlined',
        primaryColor: TRANSPERFECT_BLUE,
        secondaryColor: '#0B6B96',
        metaphor: 'industry icon system',
      }),
    [],
  );

  const tasks: GenerationTask[] = useMemo(() => {
    const core = industry.coreSet.map(coreEntryToTask);
    // Hand-picked: Engineering subset as proxy for "AI" focus + Security/API/Analytics/Support
    const subsets = industry.subSets
      .filter((s) => TARGET_SUBSET_IDS.has(s.id) || s.id === 'tech-dept-eng')
      .map(subSetToTask);
    return [...core, ...subsets];
  }, [industry]);

  const qaSummary = useMemo(() => scoreLibrary(icons, baseRecipe), [icons, baseRecipe]);

  const run = useCallback(async () => {
    setPhase('generating');
    setProgress(0);
    setError(null);
    setIcons([]);

    const collected: BrandIconography[] = [];
    let completedTasks = 0;

    try {
      await runGenerationQueue(tasks, {
        entityName: 'TransPerfect',
        industry: 'Tech / SaaS',
        style: 'outlined',
        onTaskStart: (task) => {
          setCurrentLabel(`Generating ${task.label}…`);
        },
        onTaskDone: (result) => {
          completedTasks += 1;
          if (result.error) {
            // Don't fail the whole run on a single subset failure
            console.warn('Subset failed:', result.task.label, result.error);
          } else {
            // Attach the recipe to every generated icon (per-icon recipe inherits
            // from the system recipe with the subset's category as metaphor)
            const enriched = result.icons.map((icon) =>
              attachRecipe(icon, {
                ...baseRecipe,
                metaphor: `${result.task.label} — ${icon.name}`,
              }),
            );
            collected.push(...enriched);
            setIcons([...collected]);
          }
          setProgress(completedTasks / tasks.length);
        },
      });

      if (collected.length === 0) {
        throw new Error('No icons were generated.');
      }

      setPhase('qa');
      setCurrentLabel('Running QA…');
      // QA is sync; tiny delay just for UX
      await new Promise((r) => setTimeout(r, 350));
      setPhase('ready');
      setCurrentLabel('');
      onSaveAsLibrary?.('TransPerfect · Tech / SaaS (Golden Path)', collected);
      toast.success(`Generated ${collected.length} icons`);
    } catch (e: any) {
      setError(e?.message ?? 'Generation failed');
      setPhase('error');
      toast.error(e?.message ?? 'Generation failed');
    }
  }, [tasks, baseRecipe, onSaveAsLibrary]);

  const handleExport = useCallback(async () => {
    if (!icons.length) return;
    setPhase('exporting');
    try {
      await exportIconSystem({
        name: 'TransPerfect · Tech / SaaS',
        brand: 'TransPerfect',
        industry: 'Tech / SaaS',
        icons,
        recipe: baseRecipe,
        accent: TRANSPERFECT_BLUE,
        onProgress: (r, label) => {
          setProgress(r);
          if (label) setCurrentLabel(label);
        },
      });
      toast.success('Icon system exported');
      setPhase('ready');
    } catch (e: any) {
      toast.error(e?.message ?? 'Export failed');
      setPhase('ready');
    }
  }, [icons, baseRecipe]);

  return (
    <section
      className="tp-card relative overflow-hidden p-6"
      style={{
        background:
          'linear-gradient(135deg, hsl(var(--tp-digital-blue) / 0.08), transparent 60%)',
      }}
    >
      <header className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            <Sparkles className="h-3 w-3" />
            <span>Golden Path · End-to-end demo</span>
          </div>
          <h2 className="text-xl font-semibold tracking-tight">
            Build a TransPerfect Tech / SaaS icon system in one click
          </h2>
          <p className="text-sm text-muted-foreground max-w-2xl">
            Generates a 40+ icon core plus AI, Security, API, Analytics, and Support
            subsets — scored, packaged, and ready for Figma. The full recipe travels
            with every icon so any of them can be regenerated or remixed later.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="gap-1 text-[10px]">
            Outline · 1.75 stroke
          </Badge>
          <Badge variant="outline" className="gap-1 text-[10px]">
            24px grid
          </Badge>
          <Badge
            variant="outline"
            className="gap-1 text-[10px]"
            style={{ borderColor: TRANSPERFECT_BLUE, color: TRANSPERFECT_BLUE }}
          >
            <span
              className="h-2 w-2 rounded-full"
              style={{ background: TRANSPERFECT_BLUE }}
            />
            {TRANSPERFECT_BLUE}
          </Badge>
        </div>
      </header>

      {/* Status row */}
      <div className="mt-5 grid gap-3 md:grid-cols-[1fr_auto]">
        <div className="min-w-0 space-y-2">
          {phase === 'idle' && (
            <p className="text-xs text-muted-foreground">
              {tasks.length} sections queued · ~{tasks.length * 15}s estimated
            </p>
          )}
          {(phase === 'generating' || phase === 'qa' || phase === 'exporting') && (
            <>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span className="truncate">{currentLabel || 'Working…'}</span>
                <span className="ml-auto tabular-nums">
                  {Math.round(progress * 100)}%
                </span>
              </div>
              <Progress value={progress * 100} className="h-1.5" />
            </>
          )}
          {phase === 'ready' && (
            <div className="flex flex-wrap items-center gap-3 text-xs">
              <span className="inline-flex items-center gap-1.5 text-emerald-600">
                <CheckCircle2 className="h-3.5 w-3.5" />
                {icons.length} icons generated
              </span>
              <span className="text-muted-foreground">
                Overall QA{' '}
                <strong className="text-foreground tabular-nums">
                  {qaSummary.average.overall}
                </strong>
              </span>
              <span className="text-muted-foreground">
                {qaSummary.passing} export-ready · {qaSummary.failing} need review
              </span>
            </div>
          )}
          {phase === 'error' && (
            <div className="flex items-center gap-2 text-xs text-destructive">
              <AlertCircle className="h-3.5 w-3.5" />
              {error}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={run}
            disabled={phase === 'generating' || phase === 'qa' || phase === 'exporting'}
            className="gap-1.5"
          >
            <Play className="h-3.5 w-3.5" />
            {phase === 'ready' ? 'Re-run' : phase === 'idle' || phase === 'error' ? 'Run Golden Path' : 'Running…'}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleExport}
            disabled={phase !== 'ready' || !icons.length}
            className="gap-1.5"
          >
            <Download className="h-3.5 w-3.5" />
            Export bundle
          </Button>
        </div>
      </div>

      {/* Preview strip when ready */}
      {phase === 'ready' && icons.length > 0 && (
        <div className="mt-5 rounded-lg border bg-background/60 p-3">
          <div className="grid grid-cols-12 gap-2 max-h-32 overflow-hidden">
            {icons.slice(0, 24).map((icon) => (
              <div
                key={icon.id}
                className="flex items-center justify-center rounded-md border bg-secondary/30 aspect-square"
                title={icon.name}
              >
                <svg
                  width={22}
                  height={22}
                  viewBox={(icon as any).viewBox || '0 0 24 24'}
                  fill={(icon as any).fillMode === 'fill' ? TRANSPERFECT_BLUE : 'none'}
                  stroke={(icon as any).fillMode === 'fill' ? 'none' : TRANSPERFECT_BLUE}
                  strokeWidth={1.75}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d={icon.svgPath || ''} />
                </svg>
              </div>
            ))}
          </div>
          {icons.length > 24 && (
            <div className="mt-2 text-center text-[10px] text-muted-foreground">
              +{icons.length - 24} more
            </div>
          )}
        </div>
      )}
    </section>
  );
};
