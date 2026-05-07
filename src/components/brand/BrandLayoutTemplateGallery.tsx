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
import { LayoutTemplate, Sparkles, Image as ImageIcon, Film, Check, Wand2, Maximize2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
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
    className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium"
    style={{
      borderColor: `${expressionStateColor[state]}55`,
      color: expressionStateColor[state],
      background: `${expressionStateColor[state]}14`,
    }}
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
  const [previewTpl, setPreviewTpl] = useState<{ template: BrandLayoutTemplate; resolved: ResolvedSlot[] } | null>(null);
  const [editorTemplate, setEditorTemplate] = useState<BrandLayoutTemplate | null>(null);
  const [editorCustomization, setEditorCustomization] = useState<LayoutTemplateCustomization | undefined>();
  const [industry, setIndustry] = useState<IndustryId | null>(() => loadIndustryPreference());
  const [activePreset, setActivePreset] = useState<CollateralPreset | null>(null);
  const [presetRatioOverride, setPresetRatioOverride] = useState<number | null>(null);
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
    // Always reset the manual override when the preset changes — the new
    // preset's canonical ratio becomes the baseline.
    setPresetRatioOverride(null);
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
    <section className="space-y-4 text-white">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-center gap-2">
          <LayoutTemplate className="h-4 w-4 text-[hsl(229_100%_75%)]" />
          <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-white/80">Templates</h3>
          <span className="rounded-full border border-white/15 bg-white/5 px-2 py-0.5 text-[10px] font-medium text-white/70">
            {filtered.length}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-white/50">
          <Sparkles className="h-3 w-3" />
          Foundation · Collaborate · Transform — auto-placed
        </div>
      </div>

      {/* Industry suggestions */}
      <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3 backdrop-blur-sm [&_*]:!text-white/80 [&_button]:!border-white/15 [&_button]:!bg-white/5 hover:[&_button]:!border-white/30">
        <IndustrySelector value={industry} onChange={setIndustry} />
      </div>

      {/* Quick collateral preview presets */}
      <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3 backdrop-blur-sm">
        <CollateralPresetSwitcher
          activePresetId={activePreset?.id ?? null}
          onPresetChange={handlePresetChange}
          ratioOverride={presetRatioOverride}
          onRatioOverrideChange={setPresetRatioOverride}
        />
      </div>

      {/* Reusable slot presets */}
      <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3 backdrop-blur-sm">
        <SlotPresetsPanel
          presets={slotPresets}
          onApply={handleApplySlotPreset}
          onDelete={handleDeleteSlotPreset}
        />
      </div>

      {/* Saved custom variants */}
      {savedCustomizations && savedCustomizations.length > 0 && (
        <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3 backdrop-blur-sm">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/60">
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
                  className="h-7 border-white/15 bg-white/5 text-xs text-white hover:border-white/30 hover:bg-white/10"
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
              'rounded-full border px-3 py-1 text-xs font-medium transition-all',
              activeTarget === 'all'
                ? 'border-white bg-white text-[hsl(229_45%_8%)] shadow-[0_0_24px_-6px_rgba(255,255,255,0.4)]'
                : 'border-white/15 bg-white/5 text-white/70 hover:border-white/30 hover:text-white',
            )}
          >
            All
          </button>
          {visibleTargets.map((t) => {
            const isRecommended = recommendedSet.has(t.id);
            const confidence = scoreTargetForIndustry(industry, t.id);
            const isActive = activeTarget === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTarget(t.id)}
                className={cn(
                  'inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium transition-all',
                  isActive
                    ? 'border-white bg-white text-[hsl(229_45%_8%)] shadow-[0_0_24px_-6px_rgba(255,255,255,0.4)]'
                    : isRecommended
                      ? 'border-[hsl(265_90%_75%)]/40 bg-[hsl(265_90%_75%)]/10 text-white hover:border-[hsl(265_90%_75%)]/70'
                      : 'border-white/15 bg-white/5 text-white/70 hover:border-white/30 hover:text-white',
                )}
                title={
                  confidence
                    ? `${t.description}\n\nFit for ${industryDef?.label}: ${confidence.score}% (${confidence.level})\n• ${confidence.reasons.join('\n• ')}`
                    : t.description
                }
              >
                {isRecommended && <Sparkles className="h-3 w-3" />}
                {t.label}
                {confidence && !isActive && (
                  <span className="ml-0.5 rounded-full bg-white/15 px-1 py-0 text-[9px] font-bold tabular-nums text-white">
                    {confidence.score}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Bento grid — wide targets span 2 cols */}
      <div className="grid auto-rows-[minmax(0,auto)] grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {filtered.map((template, idx) => {
          const resolved = resolveTemplate(template, brandVisuals);
          const isSelected = selectedTemplateId === template.id;
          const expressionStates = Array.from(
            new Set(template.slots.map((s) => s.expressionState)),
          ) as ExpressionState[];
          const isRecommended = recommendedSet.has(template.target);
          const suggestedCopy = getIndustryCopy(industry, template.target);
          const confidence: RecommendationConfidence | null = scoreRecommendation(industry, template);
          const presetMatchesTemplate = activePreset && activePreset.target === template.target;
          const effectiveRatio = presetMatchesTemplate
            ? presetRatioOverride ?? activePreset!.aspectRatio
            : null;
          const previewTemplate =
            effectiveRatio != null
              ? { ...template, aspectRatio: effectiveRatio }
              : template;

          // Bento sizing: wide aspects (>1.6) get 2 cols; first hero/billboard gets 4 cols
          const ratio = previewTemplate.aspectRatio;
          const wideTargets = new Set(['hero', 'billboard', 'web', 'editorial', 'casestudy', 'email']);
          const isFeature = idx === 0 && (wideTargets.has(template.target) || ratio >= 2);
          const isWide = !isFeature && (wideTargets.has(template.target) || ratio >= 1.6);
          const spanClass = isFeature
            ? 'sm:col-span-2 lg:col-span-4'
            : isWide
              ? 'sm:col-span-2 lg:col-span-2'
              : 'lg:col-span-2 xl:col-span-1';

          return (
            <div
              key={template.id}
              className={cn(
                'group relative flex flex-col gap-3 overflow-hidden rounded-2xl border bg-white/[0.03] p-3 backdrop-blur-sm transition-all duration-300',
                'hover:-translate-y-0.5 hover:bg-white/[0.06] hover:shadow-[0_20px_50px_-20px_rgba(0,0,0,0.6)]',
                isSelected
                  ? 'border-white shadow-[0_0_0_1px_rgba(255,255,255,0.6),0_20px_50px_-20px_rgba(255,255,255,0.25)]'
                  : isRecommended
                    ? 'border-[hsl(265_90%_75%)]/40 hover:border-[hsl(265_90%_75%)]/70'
                    : 'border-white/10 hover:border-white/25',
                spanClass,
              )}
            >
              {/* Subtle inner glow on featured */}
              {isFeature && (
                <div
                  aria-hidden
                  className="pointer-events-none absolute -inset-px rounded-2xl opacity-60"
                  style={{
                    background:
                      'radial-gradient(120% 60% at 0% 0%, hsl(229 100% 60% / 0.18), transparent 60%), radial-gradient(80% 60% at 100% 100%, hsl(265 100% 65% / 0.18), transparent 60%)',
                  }}
                />
              )}

              <button
                type="button"
                onClick={() => setPreviewTpl({ template: previewTemplate, resolved })}
                className="group/preview relative block w-full overflow-hidden rounded-xl ring-1 ring-white/10 transition-all hover:ring-white/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
                aria-label={`View ${template.name} full size`}
              >
                <LayoutTemplateCanvas template={previewTemplate} resolved={resolved} />
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all group-hover/preview:bg-black/30 group-hover/preview:opacity-100"
                >
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 text-[11px] font-semibold text-[hsl(229_45%_8%)] shadow-lg">
                    <Maximize2 className="h-3 w-3" />
                    View full size
                  </span>
                </span>
              </button>

              <div className="relative space-y-1.5">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-[Poppins] text-sm font-semibold leading-tight text-white">
                    {template.name}
                  </p>
                  {isSelected ? (
                    <Check className="h-4 w-4 shrink-0 text-white" />
                  ) : isRecommended && confidence ? (
                    <span
                      className={cn(
                        'inline-flex shrink-0 items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide',
                        confidence.level === 'strong'
                          ? 'bg-[hsl(265_90%_75%)] text-[hsl(229_45%_8%)]'
                          : confidence.level === 'good'
                            ? 'border border-[hsl(265_90%_75%)]/40 bg-[hsl(265_90%_75%)]/10 text-[hsl(265_90%_85%)]'
                            : 'border border-white/15 bg-white/5 text-white/60',
                      )}
                      title={`${confidenceLevelLabel[confidence.level]} for ${industryDef?.label} — ${confidence.score}%\n\n• ${confidence.reasons.join('\n• ')}`}
                    >
                      <Sparkles className="h-2.5 w-2.5" />
                      {confidence.score}%
                    </span>
                  ) : null}
                </div>
                <p className="line-clamp-2 text-xs leading-relaxed text-white/55">
                  {template.description}
                </p>
                {suggestedCopy && (
                  <div className="mt-1 rounded-lg border border-[hsl(265_90%_75%)]/20 bg-[hsl(265_90%_75%)]/5 px-2 py-1.5">
                    <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-[hsl(265_90%_85%)]/80">
                      Suggested copy
                    </p>
                    <p className="mt-0.5 line-clamp-2 text-[11px] font-medium text-white/85">
                      {suggestedCopy.headline}
                    </p>
                  </div>
                )}
              </div>

              <div className="relative flex flex-wrap items-center gap-1">
                {expressionStates.map((state) => (
                  <ExpressionBadge key={state} state={state} />
                ))}
                <span className="ml-auto text-[10px] uppercase tracking-[0.14em] text-white/40">
                  {template.target}
                </span>
              </div>

              <div className="relative mt-auto flex gap-1.5">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 flex-1 border-white/15 bg-white/5 text-xs text-white hover:border-white/30 hover:bg-white/10"
                  onClick={() => openEditor(template)}
                >
                  <Wand2 className="mr-1 h-3 w-3" />
                  Customize
                </Button>
                {onApply && (
                  <Button
                    size="sm"
                    className={cn(
                      'h-8 flex-1 text-xs',
                      isSelected
                        ? 'bg-white text-[hsl(229_45%_8%)] hover:bg-white/90'
                        : 'bg-[hsl(229_100%_60%)] text-white hover:bg-[hsl(229_100%_55%)]',
                    )}
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
        <p className="py-6 text-center text-xs text-white/50">
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
