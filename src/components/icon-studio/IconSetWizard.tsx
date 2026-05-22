/**
 * IconSetWizard — Step-by-step icon set creation for companies.
 *
 * Flow:
 *  1. Industry      — Pick an industry preset (bento cards).
 *  2. Core           — Confirm/generate the universal company core set.
 *  3. Sub-Sets       — Add industry-specific sub-sets (tabbed by department /
 *                      feature / use context).
 *  4. Preflight      — Visual grid of every generated icon; retry/remove.
 *  5. Export         — Bulk ZIP (SVG + transparent PNGs) or individual download.
 */

import { useCallback, useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Download,
  FileImage,
  Image as ImageIcon,
  Loader2,
  Plus,
  RefreshCcw,
  Sparkles,
  Trash2,
  X,
  ShieldCheck,
  Layers,
  Building2,
  PackageCheck,
  Wand2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { BrandIconography } from '@/types/brand';
import {
  INDUSTRY_PRESETS,
  IndustryPreset,
  SubSetTemplate,
  SUBSET_GROUPINGS,
  SubSetGrouping,
} from '@/lib/iconStudio/industryPresets';
import {
  GenerationTask,
  GenerationResult,
  coreEntryToTask,
  runGenerationQueue,
  runGenerationTask,
  subSetToTask,
} from '@/lib/iconStudio/generationClient';
import {
  downloadBatchBundle,
  downloadIconBundle,
  downloadIconPng,
  downloadIconSvg,
  DEFAULT_PNG_SIZES,
} from '@/lib/iconStudio/exportIcon';
import { IconSetPreview } from '@/components/icon-studio/shell/IconSetPreview';

type StepId = 'industry' | 'core' | 'subsets' | 'preflight' | 'export';

const STEPS: Array<{ id: StepId; label: string; icon: any; helper: string }> = [
  { id: 'industry', label: 'Industry', icon: Building2, helper: 'Pick your space' },
  { id: 'core', label: 'Core set', icon: ShieldCheck, helper: 'Company essentials' },
  { id: 'subsets', label: 'Sub-sets', icon: Layers, helper: 'Specialized packs' },
  { id: 'preflight', label: 'Preflight', icon: PackageCheck, helper: 'Review & fix' },
  { id: 'export', label: 'Export', icon: Download, helper: 'SVG + PNG bundles' },
];

interface SectionState {
  task: GenerationTask;
  /** Display name shown on the chip */
  displayName: string;
  /** Whether this section belongs to the core (true) or a sub-set (false) */
  isCore: boolean;
  status: 'idle' | 'generating' | 'complete' | 'error';
  icons: BrandIconography[];
  error?: string;
}

interface Props {
  organizationName: string;
  /** Called when the user saves the resulting set(s) into a library. */
  onSaveAsLibrary?: (name: string, icons: BrandIconography[]) => void;
}

export const IconSetWizard = ({ organizationName, onSaveAsLibrary }: Props) => {
  const [step, setStep] = useState<StepId>('industry');
  const [industry, setIndustry] = useState<IndustryPreset | null>(null);
  const [companyName, setCompanyName] = useState(organizationName || '');
  const [style, setStyle] = useState<'outlined' | 'filled' | 'duotone'>('outlined');
  const [selectedSubSetIds, setSelectedSubSetIds] = useState<Set<string>>(new Set());
  const [grouping, setGrouping] = useState<SubSetGrouping>('department');

  /** Map keyed by GenerationTask.key */
  const [sections, setSections] = useState<Map<string, SectionState>>(new Map());
  const [busy, setBusy] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);

  const currentStepIdx = STEPS.findIndex((s) => s.id === step);

  const subSetsByGrouping = useMemo(() => {
    const out: Record<SubSetGrouping, SubSetTemplate[]> = {
      department: [],
      feature: [],
      context: [],
    };
    industry?.subSets.forEach((s) => out[s.grouping].push(s));
    return out;
  }, [industry]);

  /* ------------------------------ Helpers ------------------------------ */

  const upsertSection = useCallback(
    (key: string, patch: Partial<SectionState> & { task?: GenerationTask }) => {
      setSections((prev) => {
        const next = new Map(prev);
        const existing = next.get(key);
        if (!existing && !patch.task) return prev;
        next.set(key, {
          task: patch.task ?? existing!.task,
          displayName: patch.displayName ?? existing?.displayName ?? '',
          isCore: patch.isCore ?? existing?.isCore ?? false,
          status: patch.status ?? existing?.status ?? 'idle',
          icons: patch.icons ?? existing?.icons ?? [],
          error: patch.error ?? existing?.error,
        });
        return next;
      });
    },
    [],
  );

  const allIcons = useMemo(
    () =>
      Array.from(sections.values()).flatMap((s) =>
        s.icons.map((icon) => ({ icon, section: s })),
      ),
    [sections],
  );

  const stats = useMemo(() => {
    const list = Array.from(sections.values());
    return {
      total: list.reduce((sum, s) => sum + s.icons.length, 0),
      done: list.filter((s) => s.status === 'complete').length,
      failed: list.filter((s) => s.status === 'error').length,
      generating: list.filter((s) => s.status === 'generating').length,
      sections: list.length,
    };
  }, [sections]);

  /* ----------------------------- Generation ---------------------------- */

  const runQueue = useCallback(
    async (tasks: Array<{ task: GenerationTask; displayName: string; isCore: boolean }>) => {
      if (!industry || tasks.length === 0) return;
      setBusy(true);
      // Seed sections as idle so UI can show queued chips
      tasks.forEach(({ task, displayName, isCore }) => {
        upsertSection(task.key, {
          task,
          displayName,
          isCore,
          status: 'idle',
          icons: [],
        });
      });

      try {
        await runGenerationQueue(
          tasks.map((t) => t.task),
          {
            entityName: companyName || industry.name,
            industry: industry.name,
            style,
            onTaskStart: (task) =>
              upsertSection(task.key, { status: 'generating' }),
            onTaskDone: (result: GenerationResult) => {
              upsertSection(result.task.key, {
                status: result.error ? 'error' : 'complete',
                icons: result.icons,
                error: result.error,
              });
            },
          },
        );
      } finally {
        setBusy(false);
      }
    },
    [industry, companyName, style, upsertSection],
  );

  const generateCore = useCallback(async () => {
    if (!industry) return;
    const tasks = industry.coreSet.map((entry) => ({
      task: coreEntryToTask(entry),
      displayName: `Core · ${entry.label}`,
      isCore: true,
    }));
    await runQueue(tasks);
  }, [industry, runQueue]);

  const generateSelectedSubSets = useCallback(async () => {
    if (!industry) return;
    const selected = industry.subSets.filter((s) => selectedSubSetIds.has(s.id));
    const tasks = selected
      .filter((s) => {
        const key = subSetToTask(s).key;
        return !sections.get(key) || sections.get(key)?.status === 'error';
      })
      .map((s) => ({
        task: subSetToTask(s),
        displayName: s.name,
        isCore: false,
      }));
    if (tasks.length === 0) {
      toast.info('Nothing new to generate — everything is already ready.');
      return;
    }
    await runQueue(tasks);
  }, [industry, selectedSubSetIds, sections, runQueue]);

  const regenerateSection = useCallback(
    async (key: string) => {
      const section = sections.get(key);
      if (!section) return;
      upsertSection(key, { status: 'generating', error: undefined });
      try {
        const icons = await runGenerationTask(section.task, {
          entityName: companyName || industry?.name || 'Brand',
          industry: industry?.name,
          style,
        });
        upsertSection(key, { status: 'complete', icons });
      } catch (err: any) {
        upsertSection(key, {
          status: 'error',
          error: err?.message ?? 'Failed',
        });
      }
    },
    [sections, companyName, industry, style, upsertSection],
  );

  const removeIcon = useCallback((sectionKey: string, iconId: string) => {
    setSections((prev) => {
      const next = new Map(prev);
      const section = next.get(sectionKey);
      if (!section) return prev;
      next.set(sectionKey, {
        ...section,
        icons: section.icons.filter((i) => i.id !== iconId),
      });
      return next;
    });
  }, []);

  /* ------------------------------- Export ------------------------------ */

  const handleBulkExport = useCallback(async () => {
    if (allIcons.length === 0) {
      toast.error('Nothing to export yet.');
      return;
    }
    setBusy(true);
    setExportProgress(0);
    try {
      const groups: Record<string, BrandIconography[]> = {};
      sections.forEach((section) => {
        if (section.icons.length === 0) return;
        const folder = section.isCore
          ? `core/${section.displayName.replace(/^Core · /, '')}`
          : `sub-sets/${section.displayName}`;
        groups[folder] = section.icons;
      });
      await downloadBatchBundle({
        groups,
        zipName: `${(companyName || industry?.name || 'icons').toLowerCase().replace(/\s+/g, '-')}-icon-system`,
        sizes: DEFAULT_PNG_SIZES,
        onProgress: setExportProgress,
      });
      toast.success('Icon system ZIP ready');
    } catch (err: any) {
      toast.error(err?.message ?? 'Export failed');
    } finally {
      setBusy(false);
      setExportProgress(0);
    }
  }, [allIcons.length, sections, companyName, industry]);

  const saveToLibrary = useCallback(() => {
    if (!onSaveAsLibrary || !industry) return;
    const icons = allIcons.map((a) => a.icon);
    if (icons.length === 0) return;
    onSaveAsLibrary(
      `${companyName || industry.name} icon system`,
      icons,
    );
    toast.success('Saved to your library');
  }, [onSaveAsLibrary, industry, allIcons, companyName]);

  /* ------------------------------- Render ------------------------------ */

  const canNext = (() => {
    if (step === 'industry') return !!industry;
    if (step === 'core') return stats.done >= industry?.coreSet.length! ? true : false;
    if (step === 'subsets') return true; // optional
    if (step === 'preflight') return stats.total > 0;
    return false;
  })();

  const goNext = () => {
    const idx = currentStepIdx;
    if (idx < STEPS.length - 1) setStep(STEPS[idx + 1].id);
  };
  const goBack = () => {
    const idx = currentStepIdx;
    if (idx > 0) setStep(STEPS[idx - 1].id);
  };

  return (
    <div className="space-y-6">
      {/* Stepper */}
      <Stepper currentIdx={currentStepIdx} onStepClick={(id) => setStep(id)} stats={stats} />

      {/* Step content */}
      <div className="min-h-[420px]">
        {step === 'industry' && (
          <IndustryStep selected={industry} onSelect={setIndustry} />
        )}

        {step === 'core' && industry && (
          <CoreStep
            industry={industry}
            companyName={companyName}
            setCompanyName={setCompanyName}
            style={style}
            setStyle={setStyle}
            sections={sections}
            busy={busy}
            stats={stats}
            onGenerate={generateCore}
            onRegenerate={regenerateSection}
          />
        )}

        {step === 'subsets' && industry && (
          <SubSetsStep
            industry={industry}
            grouping={grouping}
            setGrouping={setGrouping}
            subSetsByGrouping={subSetsByGrouping}
            selected={selectedSubSetIds}
            setSelected={setSelectedSubSetIds}
            sections={sections}
            busy={busy}
            onGenerate={generateSelectedSubSets}
            onRegenerate={regenerateSection}
          />
        )}

        {step === 'preflight' && (
          <PreflightStep
            sections={sections}
            busy={busy}
            stats={stats}
            onRegenerate={regenerateSection}
            onRemoveIcon={removeIcon}
          />
        )}

        {step === 'export' && (
          <ExportStep
            sections={sections}
            stats={stats}
            busy={busy}
            exportProgress={exportProgress}
            onBulkExport={handleBulkExport}
            onSaveToLibrary={onSaveAsLibrary ? saveToLibrary : undefined}
          />
        )}
      </div>

      {/* Nav bar */}
      <div className="flex items-center justify-between border-t pt-4">
        <Button variant="ghost" onClick={goBack} disabled={currentStepIdx === 0 || busy}>
          <ChevronLeft className="h-4 w-4 mr-1" /> Back
        </Button>
        <div className="text-xs text-muted-foreground">
          Step {currentStepIdx + 1} of {STEPS.length}
        </div>
        {step !== 'export' ? (
          <Button onClick={goNext} disabled={!canNext || busy}>
            Next <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        ) : (
          <Button onClick={handleBulkExport} disabled={busy || stats.total === 0}>
            <Download className="h-4 w-4 mr-1" /> Download ZIP
          </Button>
        )}
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* Stepper                                                                    */
/* -------------------------------------------------------------------------- */

const Stepper = ({
  currentIdx,
  onStepClick,
  stats,
}: {
  currentIdx: number;
  onStepClick: (id: StepId) => void;
  stats: { total: number; done: number; sections: number };
}) => (
  <div className="rounded-xl border bg-gradient-to-br from-card to-muted/30 p-4">
    <div className="flex items-center gap-2 overflow-x-auto">
      {STEPS.map((s, i) => {
        const Icon = s.icon;
        const isActive = i === currentIdx;
        const isDone = i < currentIdx;
        return (
          <button
            key={s.id}
            onClick={() => onStepClick(s.id)}
            className={cn(
              'group flex-1 min-w-[140px] flex items-center gap-3 rounded-lg p-3 text-left transition-all border',
              isActive && 'bg-primary/10 border-primary/30 shadow-sm',
              !isActive && !isDone && 'border-transparent hover:bg-accent/40',
              isDone && 'border-transparent text-muted-foreground',
            )}
          >
            <div
              className={cn(
                'h-9 w-9 rounded-full flex items-center justify-center flex-shrink-0 border',
                isActive && 'bg-primary text-primary-foreground border-primary',
                isDone && 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30',
                !isActive && !isDone && 'bg-muted text-muted-foreground border-border',
              )}
            >
              {isDone ? <CheckCircle2 className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
            </div>
            <div className="min-w-0">
              <div className="text-sm font-medium truncate">{s.label}</div>
              <div className="text-[11px] text-muted-foreground truncate">{s.helper}</div>
            </div>
          </button>
        );
      })}
    </div>
    {stats.total > 0 && (
      <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
        <Badge variant="secondary" className="gap-1">
          <Sparkles className="h-3 w-3" /> {stats.total} icons
        </Badge>
        <Badge variant="outline">{stats.sections} sections</Badge>
        {stats.done > 0 && (
          <span className="text-emerald-600">{stats.done} complete</span>
        )}
      </div>
    )}
  </div>
);

/* -------------------------------------------------------------------------- */
/* Step 1 — Industry                                                           */
/* -------------------------------------------------------------------------- */

const IndustryStep = ({
  selected,
  onSelect,
}: {
  selected: IndustryPreset | null;
  onSelect: (i: IndustryPreset) => void;
}) => (
  <div className="space-y-4">
    <div>
      <h2 className="text-2xl font-semibold tracking-tight">Pick your industry</h2>
      <p className="text-sm text-muted-foreground">
        Each pack ships with a curated core set plus industry-specific sub-sets.
      </p>
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {INDUSTRY_PRESETS.map((p) => {
        const Icon = p.icon;
        const isSelected = selected?.id === p.id;
        return (
          <button
            key={p.id}
            onClick={() => onSelect(p)}
            className={cn(
              'group relative overflow-hidden rounded-2xl border bg-card p-5 text-left transition-all',
              'hover:shadow-lg hover:-translate-y-0.5',
              isSelected && 'ring-2 ring-primary border-primary shadow-lg',
            )}
            style={{
              backgroundImage: `linear-gradient(135deg, hsl(${p.accent} / 0.12), transparent 70%)`,
            }}
          >
            <div className="flex items-start justify-between mb-4">
              <div
                className="h-12 w-12 rounded-xl flex items-center justify-center text-white shadow-md"
                style={{ background: `hsl(${p.accent})` }}
              >
                <Icon className="h-6 w-6" />
              </div>
              {isSelected && (
                <Badge className="bg-primary text-primary-foreground">Selected</Badge>
              )}
            </div>
            <h3 className="text-lg font-semibold">{p.name}</h3>
            <p className="text-xs text-muted-foreground mb-3">{p.tagline}</p>
            <IconSetPreview
              emojis={p.sampleEmojis}
              accent={`hsl(${p.accent})`}
              size="md"
              variant="glass"
              className="mb-3"
            />
            <div className="text-xs text-muted-foreground flex items-center gap-3">
              <span>{p.coreSet.length} core sections</span>
              <span>·</span>
              <span>{p.subSets.length} sub-sets</span>
            </div>
          </button>
        );
      })}
    </div>
  </div>
);

/* -------------------------------------------------------------------------- */
/* Step 2 — Core                                                              */
/* -------------------------------------------------------------------------- */

const CoreStep = ({
  industry,
  companyName,
  setCompanyName,
  style,
  setStyle,
  sections,
  busy,
  stats,
  onGenerate,
  onRegenerate,
}: {
  industry: IndustryPreset;
  companyName: string;
  setCompanyName: (s: string) => void;
  style: 'outlined' | 'filled' | 'duotone';
  setStyle: (s: 'outlined' | 'filled' | 'duotone') => void;
  sections: Map<string, SectionState>;
  busy: boolean;
  stats: { done: number; total: number; sections: number };
  onGenerate: () => void;
  onRegenerate: (key: string) => void;
}) => {
  const coreSections = industry.coreSet.map((entry) => ({
    entry,
    section: sections.get(coreEntryToTask(entry).key),
  }));
  const hasAnyGenerated = coreSections.some((c) => c.section?.icons?.length);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">
          Your core <span className="text-primary">{industry.name}</span> set
        </h2>
        <p className="text-sm text-muted-foreground">
          These are the universal company icons (navigation, UI states, messaging…). Generate
          them first — sub-sets stack on top.
        </p>
      </div>

      <Card>
        <CardContent className="grid gap-4 md:grid-cols-3 p-5">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Company name</label>
            <Input
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Acme Inc."
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Style</label>
            <div className="flex gap-1">
              {(['outlined', 'filled', 'duotone'] as const).map((s) => (
                <Button
                  key={s}
                  size="sm"
                  variant={style === s ? 'default' : 'outline'}
                  onClick={() => setStyle(s)}
                  className="capitalize flex-1"
                >
                  {s}
                </Button>
              ))}
            </div>
          </div>
          <div className="flex items-end">
            <Button
              onClick={onGenerate}
              disabled={busy}
              className="w-full gap-2"
              size="lg"
            >
              {busy ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Generating…
                </>
              ) : hasAnyGenerated ? (
                <>
                  <RefreshCcw className="h-4 w-4" /> Re-generate core
                </>
              ) : (
                <>
                  <Wand2 className="h-4 w-4" /> Generate core set
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {coreSections.map(({ entry, section }) => (
          <SectionCard
            key={entry.label}
            title={entry.label}
            subtitle={`${entry.count} icons`}
            section={section}
            onRegenerate={() =>
              section && onRegenerate(coreEntryToTask(entry).key)
            }
            tone="core"
          />
        ))}
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* Step 3 — Sub-sets                                                          */
/* -------------------------------------------------------------------------- */

const SubSetsStep = ({
  industry,
  grouping,
  setGrouping,
  subSetsByGrouping,
  selected,
  setSelected,
  sections,
  busy,
  onGenerate,
  onRegenerate,
}: {
  industry: IndustryPreset;
  grouping: SubSetGrouping;
  setGrouping: (g: SubSetGrouping) => void;
  subSetsByGrouping: Record<SubSetGrouping, SubSetTemplate[]>;
  selected: Set<string>;
  setSelected: (s: Set<string>) => void;
  sections: Map<string, SectionState>;
  busy: boolean;
  onGenerate: () => void;
  onRegenerate: (key: string) => void;
}) => {
  const toggle = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Add industry sub-sets</h2>
          <p className="text-sm text-muted-foreground">
            Pick the specialized packs your teams will actually use. You can mix and match.
          </p>
        </div>
        <Button
          onClick={onGenerate}
          disabled={busy || selected.size === 0}
          className="gap-2"
          size="lg"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
          Generate {selected.size > 0 ? `${selected.size} sub-set${selected.size > 1 ? 's' : ''}` : ''}
        </Button>
      </div>

      <Tabs value={grouping} onValueChange={(v) => setGrouping(v as SubSetGrouping)}>
        <TabsList className="grid w-full max-w-xl grid-cols-3">
          {SUBSET_GROUPINGS.map((g) => (
            <TabsTrigger key={g.id} value={g.id} className="flex flex-col gap-0.5 py-2 h-auto">
              <span className="text-sm">{g.label}</span>
              <span className="text-[10px] text-muted-foreground">{g.description}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {SUBSET_GROUPINGS.map((g) => (
          <TabsContent key={g.id} value={g.id} className="mt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {subSetsByGrouping[g.id].map((s) => {
                const isSelected = selected.has(s.id);
                const section = sections.get(subSetToTask(s).key);
                return (
                  <button
                    key={s.id}
                    onClick={() => toggle(s.id)}
                    className={cn(
                      'relative text-left rounded-xl border p-4 transition-all bg-card',
                      'hover:shadow-md',
                      isSelected && 'ring-2 ring-primary border-primary',
                    )}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <div
                          className="h-10 w-10 rounded-lg flex items-center justify-center text-xl"
                          style={{
                            background: `hsl(${industry.accent} / 0.15)`,
                          }}
                        >
                          {s.emoji}
                        </div>
                        <div>
                          <div className="font-medium text-sm">{s.name}</div>
                          <div className="text-[11px] text-muted-foreground">
                            {s.count} icons
                          </div>
                        </div>
                      </div>
                      <div
                        className={cn(
                          'h-5 w-5 rounded-md border flex items-center justify-center flex-shrink-0',
                          isSelected
                            ? 'bg-primary border-primary text-primary-foreground'
                            : 'border-muted-foreground/30',
                        )}
                      >
                        {isSelected && <CheckCircle2 className="h-3.5 w-3.5" />}
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">{s.description}</p>
                    {section && (
                      <div className="mt-3 pt-3 border-t flex items-center justify-between text-[11px]">
                        <SectionStatusPill section={section} />
                        {section.status === 'error' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-[11px]"
                            onClick={(e) => {
                              e.stopPropagation();
                              onRegenerate(subSetToTask(s).key);
                            }}
                          >
                            <RefreshCcw className="h-3 w-3 mr-1" /> Retry
                          </Button>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* Step 4 — Preflight                                                          */
/* -------------------------------------------------------------------------- */

const PreflightStep = ({
  sections,
  busy,
  stats,
  onRegenerate,
  onRemoveIcon,
}: {
  sections: Map<string, SectionState>;
  busy: boolean;
  stats: { total: number; done: number; sections: number; failed: number };
  onRegenerate: (key: string) => void;
  onRemoveIcon: (sectionKey: string, iconId: string) => void;
}) => {
  const list = Array.from(sections.values()).filter((s) => s.icons.length > 0 || s.status === 'error');

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Preflight</h2>
          <p className="text-sm text-muted-foreground">
            Review every icon, retry sections, or remove individual icons before export.
          </p>
        </div>
        <div className="flex gap-2 text-xs">
          <Badge variant="secondary">{stats.total} icons</Badge>
          <Badge variant="outline">{stats.sections} sections</Badge>
          {stats.failed > 0 && (
            <Badge className="bg-destructive/15 text-destructive border-destructive/30">
              {stats.failed} failed
            </Badge>
          )}
        </div>
      </div>

      {list.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground">
            Nothing generated yet — go back and run the core set first.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {list.map((section) => (
            <Card key={section.task.key}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Badge variant={section.isCore ? 'default' : 'secondary'}>
                      {section.isCore ? 'Core' : 'Sub-set'}
                    </Badge>
                    <span className="text-sm font-medium">{section.displayName}</span>
                    <SectionStatusPill section={section} />
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onRegenerate(section.task.key)}
                    disabled={busy}
                    className="gap-1.5"
                  >
                    <RefreshCcw className="h-3.5 w-3.5" /> Regenerate
                  </Button>
                </div>
                {section.icons.length === 0 ? (
                  <div className="text-xs text-muted-foreground py-4">
                    {section.error || 'No icons in this section.'}
                  </div>
                ) : (
                  <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
                    {section.icons.map((icon) => (
                      <IconTile
                        key={icon.id}
                        icon={icon}
                        onRemove={() => onRemoveIcon(section.task.key, icon.id)}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* Step 5 — Export                                                             */
/* -------------------------------------------------------------------------- */

const ExportStep = ({
  sections,
  stats,
  busy,
  exportProgress,
  onBulkExport,
  onSaveToLibrary,
}: {
  sections: Map<string, SectionState>;
  stats: { total: number; sections: number };
  busy: boolean;
  exportProgress: number;
  onBulkExport: () => void;
  onSaveToLibrary?: () => void;
}) => {
  const allSections = Array.from(sections.values()).filter((s) => s.icons.length > 0);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Export your icon system</h2>
        <p className="text-sm text-muted-foreground">
          Download everything as a single ZIP (organized by core / sub-sets, each icon as SVG +
          transparent PNGs at {DEFAULT_PNG_SIZES.join(', ')} px), or download individual icons.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="md:col-span-2 bg-gradient-to-br from-primary/5 to-card">
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-primary/15 text-primary flex items-center justify-center">
                <PackageCheck className="h-6 w-6" />
              </div>
              <div>
                <div className="font-semibold">Bulk export — full system</div>
                <div className="text-xs text-muted-foreground">
                  {stats.total} icons · {stats.sections} sections · SVG + {DEFAULT_PNG_SIZES.length} PNG sizes
                </div>
              </div>
            </div>

            {busy && exportProgress > 0 && (
              <Progress value={exportProgress * 100} className="h-2" />
            )}

            <div className="flex flex-wrap gap-2">
              <Button onClick={onBulkExport} disabled={busy || stats.total === 0} size="lg" className="gap-2">
                <Download className="h-4 w-4" /> Download full ZIP
              </Button>
              {onSaveToLibrary && (
                <Button variant="outline" onClick={onSaveToLibrary} disabled={stats.total === 0} className="gap-2">
                  <Plus className="h-4 w-4" /> Save to library
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 space-y-2">
            <div className="text-sm font-semibold">Per-icon formats</div>
            <div className="flex items-start gap-2 text-xs text-muted-foreground">
              <FileImage className="h-4 w-4 mt-0.5" />
              <span>SVG (vector, infinitely scalable, recolorable)</span>
            </div>
            <div className="flex items-start gap-2 text-xs text-muted-foreground">
              <ImageIcon className="h-4 w-4 mt-0.5" />
              <span>Transparent PNG · {DEFAULT_PNG_SIZES.join(' / ')} px</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Per-section download list */}
      <div className="space-y-3">
        <div className="text-sm font-medium text-muted-foreground">Individual sets</div>
        {allSections.map((section) => (
          <Card key={section.task.key}>
            <CardContent className="p-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <Badge variant={section.isCore ? 'default' : 'secondary'}>
                  {section.isCore ? 'Core' : 'Sub-set'}
                </Badge>
                <span className="font-medium text-sm truncate">{section.displayName}</span>
                <span className="text-xs text-muted-foreground">{section.icons.length} icons</span>
              </div>
              <div className="flex flex-wrap gap-2 items-center">
                {section.icons.slice(0, 6).map((icon) => (
                  <IconQuickActions key={icon.id} icon={icon} />
                ))}
                {section.icons.length > 6 && (
                  <span className="text-xs text-muted-foreground">+{section.icons.length - 6} more</span>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* Shared bits                                                                 */
/* -------------------------------------------------------------------------- */

const SectionCard = ({
  title,
  subtitle,
  section,
  onRegenerate,
  tone,
}: {
  title: string;
  subtitle: string;
  section?: SectionState;
  onRegenerate: () => void;
  tone: 'core' | 'sub';
}) => {
  const status = section?.status ?? 'idle';
  return (
    <Card>
      <CardContent className="p-3 space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium">{title}</div>
            <div className="text-[11px] text-muted-foreground">{subtitle}</div>
          </div>
          <SectionStatusPill section={section} />
        </div>
        <div className="grid grid-cols-6 gap-1 min-h-[56px] items-center">
          {section?.icons.slice(0, 6).map((icon) => (
            <div
              key={icon.id}
              className="h-7 w-7 mx-auto text-foreground"
              dangerouslySetInnerHTML={{ __html: icon.svgPath || '' }}
            />
          ))}
          {(!section || section.icons.length === 0) &&
            Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  'h-7 w-7 mx-auto rounded-md border border-dashed border-muted-foreground/20',
                  status === 'generating' && 'animate-pulse bg-muted/40',
                )}
              />
            ))}
        </div>
        {status === 'error' && (
          <Button variant="outline" size="sm" onClick={onRegenerate} className="w-full h-7 text-[11px]">
            <RefreshCcw className="h-3 w-3 mr-1" /> Retry
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

const SectionStatusPill = ({ section }: { section?: SectionState }) => {
  const status = section?.status ?? 'idle';
  if (status === 'idle')
    return <Badge variant="outline" className="text-[10px]">Queued</Badge>;
  if (status === 'generating')
    return (
      <Badge variant="outline" className="text-[10px] gap-1">
        <Loader2 className="h-2.5 w-2.5 animate-spin" /> Generating
      </Badge>
    );
  if (status === 'complete')
    return (
      <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/30 text-[10px] gap-1">
        <CheckCircle2 className="h-2.5 w-2.5" /> {section?.icons.length} ready
      </Badge>
    );
  return (
    <Badge className="bg-destructive/15 text-destructive border-destructive/30 text-[10px]">
      Failed
    </Badge>
  );
};

const IconTile = ({
  icon,
  onRemove,
}: {
  icon: BrandIconography;
  onRemove: () => void;
}) => (
  <div className="group relative aspect-square rounded-lg border bg-card p-2 flex flex-col items-center justify-center gap-1">
    <div
      className="h-8 w-8 text-foreground"
      dangerouslySetInnerHTML={{ __html: icon.svgPath || '' }}
    />
    <div className="text-[9px] text-muted-foreground truncate w-full text-center">
      {icon.name}
    </div>
    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition bg-background/90 rounded-lg flex flex-col items-center justify-center gap-1">
      <IconQuickActions icon={icon} compact />
      <Button
        size="sm"
        variant="ghost"
        className="h-6 px-1.5 text-[10px] text-destructive hover:text-destructive"
        onClick={onRemove}
      >
        <Trash2 className="h-3 w-3" />
      </Button>
    </div>
  </div>
);

const IconQuickActions = ({
  icon,
  compact = false,
}: {
  icon: BrandIconography;
  compact?: boolean;
}) => {
  const [pending, setPending] = useState<'svg' | 'png' | 'zip' | null>(null);
  const run = async (kind: 'svg' | 'png' | 'zip') => {
    setPending(kind);
    try {
      if (kind === 'svg') downloadIconSvg(icon);
      else if (kind === 'png') await downloadIconPng(icon, 256);
      else await downloadIconBundle(icon);
    } catch (err: any) {
      toast.error(err?.message ?? 'Download failed');
    } finally {
      setPending(null);
    }
  };

  if (compact) {
    return (
      <div className="flex gap-0.5">
        <Button size="sm" variant="ghost" className="h-6 px-1.5 text-[10px]" onClick={() => run('svg')}>
          {pending === 'svg' ? <Loader2 className="h-3 w-3 animate-spin" /> : 'SVG'}
        </Button>
        <Button size="sm" variant="ghost" className="h-6 px-1.5 text-[10px]" onClick={() => run('png')}>
          {pending === 'png' ? <Loader2 className="h-3 w-3 animate-spin" /> : 'PNG'}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1 bg-muted/40 rounded-md p-1">
      <span
        className="h-5 w-5 text-foreground"
        dangerouslySetInnerHTML={{ __html: icon.svgPath || '' }}
      />
      <Button size="sm" variant="ghost" className="h-6 px-1.5 text-[10px]" onClick={() => run('svg')}>
        {pending === 'svg' ? <Loader2 className="h-3 w-3 animate-spin" /> : 'SVG'}
      </Button>
      <Button size="sm" variant="ghost" className="h-6 px-1.5 text-[10px]" onClick={() => run('png')}>
        {pending === 'png' ? <Loader2 className="h-3 w-3 animate-spin" /> : 'PNG'}
      </Button>
      <Button size="sm" variant="ghost" className="h-6 px-1.5 text-[10px]" onClick={() => run('zip')}>
        {pending === 'zip' ? <Loader2 className="h-3 w-3 animate-spin" /> : 'ZIP'}
      </Button>
    </div>
  );
};

export default IconSetWizard;
