/**
 * BrandLayoutTemplateGallery
 *
 * Browse, preview and apply reusable layout templates that auto-place
 * Foundation / Collaborate / Transform brand visuals into common sections
 * (hero, services, case study, social, etc.).
 *
 * Pure presentation: parent passes the brand's `brandVisuals` bundle and
 * receives the resolved template + slot assets via `onApply`. Customize opens
 * an editor for copy / slot swap / export / apply-to-section.
 */
import { useEffect, useMemo, useState } from 'react';
import { LayoutTemplate, Sparkles, Image as ImageIcon, Film, Check, Wand2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  brandLayoutTemplates,
  layoutTargets,
  resolveTemplate,
  expressionStateColor,
  type BrandLayoutTemplate,
  type BrandVisualsBundle,
  type ExpressionState,
  type LayoutSectionTarget,
  type LayoutTemplateCustomization,
  type ResolvedSlot,
} from '@/lib/brandLayoutTemplates';
import { LayoutTemplateCanvas } from './LayoutTemplateCanvas';
import { LayoutTemplateEditor, type ApplyTarget } from './LayoutTemplateEditor';
import { IndustrySelector } from './IndustrySelector';
import {
  getIndustry,
  getIndustryCopy,
  loadIndustryPreference,
  saveIndustryPreference,
  scoreRecommendation,
  scoreTargetForIndustry,
  type ConfidenceLevel,
  type IndustryId,
  type RecommendationConfidence,
} from '@/lib/industrySuggestions';
import {
  CollateralPresetSwitcher,
  type CollateralPreset,
} from './CollateralPresetSwitcher';
import { SlotPresetsPanel } from './SlotPresetsPanel';
import {
  deleteSlotPreset,
  loadSlotPresets,
  presetToTemplate,
  saveSlotPreset,
  templateToPresetPayload,
  type SlotPreset,
} from '@/lib/slotPresets';

interface BrandLayoutTemplateGalleryProps {
  brandVisuals?: BrandVisualsBundle;
  selectedTemplateId?: string;
  onApply?: (template: BrandLayoutTemplate, resolved: ResolvedSlot[]) => void;
  /** Restrict to specific targets (e.g. only show 'hero' templates in a hero editor). */
  targets?: LayoutSectionTarget[];
  /** Saved custom variants for this brand (created via the editor). */
  savedCustomizations?: LayoutTemplateCustomization[];
  /** Persist a saved variant. */
  onSaveCustomization?: (customization: LayoutTemplateCustomization) => void;
  /** Apply the resolved cover into a brand section (hero / social / casestudy). */
  onApplyToSection?: (target: ApplyTarget, asset: { type: 'image' | 'video'; url: string }) => void;
}

const ExpressionBadge = ({ state }: { state: ExpressionState }) => (
  <span
    className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium border"
    style={{ borderColor: expressionStateColor[state], color: expressionStateColor[state] }}
  >
    <span
      className="h-1.5 w-1.5 rounded-full"
      style={{ background: expressionStateColor[state] }}
    />
    {state}
  </span>
);

/** Visual treatment per confidence level — uses semantic tokens only. */
const confidenceLevelClasses: Record<ConfidenceLevel, string> = {
  strong: 'bg-primary text-primary-foreground',
  good: 'bg-primary/15 text-primary',
  fair: 'bg-muted text-muted-foreground',
};

const confidenceLevelLabel: Record<ConfidenceLevel, string> = {
  strong: 'Strong fit',
  good: 'Good fit',
  fair: 'Fair fit',
};

export const BrandLayoutTemplateGallery = ({
  brandVisuals,
  selectedTemplateId,
  onApply,
  targets,
  savedCustomizations,
  onSaveCustomization,
  onApplyToSection,
}: BrandLayoutTemplateGalleryProps) => {
  const [activeTarget, setActiveTarget] = useState<LayoutSectionTarget | 'all'>('all');
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorTemplate, setEditorTemplate] = useState<BrandLayoutTemplate | null>(null);
  const [editorCustomization, setEditorCustomization] = useState<LayoutTemplateCustomization | undefined>();
  const [industry, setIndustry] = useState<IndustryId | null>(() => loadIndustryPreference());
  const [activePreset, setActivePreset] = useState<CollateralPreset | null>(null);
  const [slotPresets, setSlotPresets] = useState<SlotPreset[]>(() => loadSlotPresets());

  useEffect(() => {
    saveIndustryPreference(industry);
  }, [industry]);

  const handleApplySlotPreset = (preset: SlotPreset) => {
    const template = presetToTemplate(preset);
    setEditorTemplate(template);
    setEditorCustomization(undefined);
    setEditorOpen(true);
  };

  const handleDeleteSlotPreset = (id: string) => {
    setSlotPresets((current) => deleteSlotPreset(current, id));
  };

  const handlePresetChange = (preset: CollateralPreset | null) => {
    setActivePreset(preset);
    if (preset) {
      setActiveTarget(preset.target);
    } else {
      setActiveTarget('all');
    }
  };

  const visibleTargets = useMemo(
    () => (targets ? layoutTargets.filter((t) => targets.includes(t.id)) : layoutTargets),
    [targets],
  );

  const industryDef = getIndustry(industry);
  const recommendedTargets = industryDef?.recommendedTargets ?? [];
  const recommendedSet = useMemo(() => new Set(recommendedTargets), [recommendedTargets]);

  const filtered = useMemo(() => {
    const base = targets
      ? brandLayoutTemplates.filter((t) => targets.includes(t.target))
      : brandLayoutTemplates;
    const scoped = activeTarget === 'all' ? base : base.filter((t) => t.target === activeTarget);
    if (!industryDef) return scoped;
    // Sort by confidence score (high → low), keeping non-recommended at the end.
    return [...scoped].sort((a, b) => {
      const sa = scoreRecommendation(industry, a)?.score ?? -1;
      const sb = scoreRecommendation(industry, b)?.score ?? -1;
      return sb - sa;
    });
  }, [activeTarget, targets, industryDef, industry]);

  const openEditor = (template: BrandLayoutTemplate, customization?: LayoutTemplateCustomization) => {
    // If no saved customization is being reopened, prefill copy from the
    // selected industry's starter blocks for this target (when available).
    let next = customization;
    if (!next && industry) {
      const copy = getIndustryCopy(industry, template.target);
      if (copy) {
        next = {
          id: crypto.randomUUID(),
          baseTemplateId: template.id,
          name: template.name,
          copy: { eyebrow: copy.eyebrow, headline: copy.headline, cta: copy.cta },
          slotOverrides: {},
          overlayOverrides: template.overlay,
          createdAt: new Date().toISOString(),
        };
      }
    }
    setEditorTemplate(template);
    setEditorCustomization(next);
    setEditorOpen(true);
  };

  return (
    <section className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-center gap-2">
          <LayoutTemplate className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">Layout templates</h3>
          <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">
            {filtered.length}
          </Badge>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <Sparkles className="h-3 w-3" />
          Auto-fills with Foundation / Collaborate / Transform visuals
        </div>
      </div>

      {/* Industry suggestions */}
      <IndustrySelector
        value={industry}
        onChange={setIndustry}
        className="rounded-lg border bg-muted/30 p-3"
      />

      {/* Quick collateral preview presets */}
      <CollateralPresetSwitcher
        activePresetId={activePreset?.id ?? null}
        onPresetChange={handlePresetChange}
      />

      {/* Reusable slot presets */}
      <SlotPresetsPanel
        presets={slotPresets}
        onApply={handleApplySlotPreset}
        onDelete={handleDeleteSlotPreset}
      />

      {/* Saved custom variants */}
      {savedCustomizations && savedCustomizations.length > 0 && (
        <div className="rounded-lg border bg-muted/30 p-3">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Your saved variants ({savedCustomizations.length})
          </p>
          <div className="flex flex-wrap gap-2">
            {savedCustomizations.map((c) => {
              const base = brandLayoutTemplates.find((t) => t.id === c.baseTemplateId);
              if (!base) return null;
              return (
                <Button
                  key={c.id}
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs"
                  onClick={() => openEditor(base, c)}
                >
                  <Wand2 className="mr-1 h-3 w-3" />
                  {c.name}
                </Button>
              );
            })}
          </div>
        </div>
      )}

      {/* Target filters */}
      {visibleTargets.length > 1 && (
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setActiveTarget('all')}
            className={cn(
              'rounded-full border px-2.5 py-1 text-xs transition-colors',
              activeTarget === 'all'
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border bg-muted/50 text-muted-foreground hover:border-primary/50',
            )}
          >
            All
          </button>
          {visibleTargets.map((t) => {
            const isRecommended = recommendedSet.has(t.id);
            const confidence = scoreTargetForIndustry(industry, t.id);
            return (
              <button
                key={t.id}
                onClick={() => setActiveTarget(t.id)}
                className={cn(
                  'inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs transition-colors',
                  activeTarget === t.id
                    ? 'border-primary bg-primary text-primary-foreground'
                    : isRecommended
                      ? 'border-primary/50 bg-primary/5 text-foreground hover:border-primary'
                      : 'border-border bg-muted/50 text-muted-foreground hover:border-primary/50',
                )}
                title={
                  confidence
                    ? `${t.description}\n\nFit for ${industryDef?.label}: ${confidence.score}% (${confidence.level})\n• ${confidence.reasons.join('\n• ')}`
                    : t.description
                }
              >
                {isRecommended && <Sparkles className="h-3 w-3" />}
                {t.label}
                {confidence && activeTarget !== t.id && (
                  <span
                    className={cn(
                      'ml-0.5 rounded-full px-1 py-0 text-[9px] font-bold tabular-nums',
                      confidenceLevelClasses[confidence.level],
                    )}
                  >
                    {confidence.score}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((template) => {
          const resolved = resolveTemplate(template, brandVisuals);
          const isSelected = selectedTemplateId === template.id;
          const expressionStates = Array.from(
            new Set(template.slots.map((s) => s.expressionState)),
          ) as ExpressionState[];
          const isRecommended = recommendedSet.has(template.target);
          const suggestedCopy = getIndustryCopy(industry, template.target);
          const confidence: RecommendationConfidence | null = scoreRecommendation(industry, template);
          // Quick-preview preset: reframe at the canonical aspect ratio for the
          // collateral type without mutating the underlying template definition.
          const previewTemplate =
            activePreset && activePreset.target === template.target
              ? { ...template, aspectRatio: activePreset.aspectRatio }
              : template;

          return (
            <div
              key={template.id}
              className={cn(
                'group flex flex-col gap-2 rounded-lg border-2 bg-card p-3 transition-all',
                isSelected
                  ? 'border-primary ring-2 ring-primary/20'
                  : isRecommended
                    ? 'border-primary/40 hover:border-primary hover:shadow-md'
                    : 'border-border hover:border-primary/50 hover:shadow-md',
              )}
            >
              <LayoutTemplateCanvas template={previewTemplate} resolved={resolved} />

              <div className="space-y-1">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium leading-tight">{template.name}</p>
                  {isSelected ? (
                    <Check className="h-4 w-4 shrink-0 text-primary" />
                  ) : isRecommended && confidence ? (
                    <span
                      className={cn(
                        'inline-flex shrink-0 items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide',
                        confidence.level === 'strong'
                          ? 'bg-primary text-primary-foreground'
                          : confidence.level === 'good'
                            ? 'border border-primary/40 bg-primary/10 text-primary'
                            : 'border border-border bg-muted text-muted-foreground',
                      )}
                      title={`${confidenceLevelLabel[confidence.level]} for ${industryDef?.label} — ${confidence.score}%\n\n• ${confidence.reasons.join('\n• ')}`}
                    >
                      <Sparkles className="h-2.5 w-2.5" />
                      Suggested
                      <span className="ml-0.5 tabular-nums">{confidence.score}%</span>
                    </span>
                  ) : null}
                </div>
                <p className="line-clamp-2 text-xs text-muted-foreground">
                  {template.description}
                </p>
                {suggestedCopy && (
                  <div className="mt-1 rounded-md border border-primary/20 bg-primary/5 px-2 py-1.5">
                    <p className="text-[9px] font-semibold uppercase tracking-wider text-primary/80">
                      Suggested copy
                    </p>
                    <p className="mt-0.5 line-clamp-2 text-[11px] font-medium text-foreground">
                      {suggestedCopy.headline}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-1">
                {expressionStates.map((state) => (
                  <ExpressionBadge key={state} state={state} />
                ))}
                <span className="ml-auto text-[10px] uppercase tracking-wide text-muted-foreground">
                  {template.target}
                </span>
              </div>

              <div className="mt-1 flex gap-1.5">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 flex-1 text-xs"
                  onClick={() => openEditor(template)}
                >
                  <Wand2 className="mr-1 h-3 w-3" />
                  Customize
                </Button>
                {onApply && (
                  <Button
                    size="sm"
                    variant={isSelected ? 'default' : 'secondary'}
                    className="h-8 flex-1 text-xs"
                    onClick={() => onApply(template, resolved)}
                  >
                    {isSelected ? 'Applied' : 'Apply'}
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <p className="py-6 text-center text-xs text-muted-foreground">
          No templates available for this filter.
        </p>
      )}

      {editorTemplate && (
        <LayoutTemplateEditor
          open={editorOpen}
          onOpenChange={setEditorOpen}
          template={editorTemplate}
          brandVisuals={brandVisuals}
          initialCustomization={editorCustomization}
          existingCustomizations={savedCustomizations}
          onSave={onSaveCustomization}
          onApplyToSection={onApplyToSection}
          existingSlotPresetNames={slotPresets.map((p) => p.name)}
          onSaveAsSlotPreset={({ name, description, template }) => {
            setSlotPresets((current) =>
              saveSlotPreset(current, templateToPresetPayload(template, { name, description })),
            );
          }}
        />
      )}
    </section>
  );
};

export default BrandLayoutTemplateGallery;
