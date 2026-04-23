/**
 * BrandLayoutTemplateGallery
 *
 * Browse, preview and apply reusable layout templates that auto-place
 * Foundation / Collaborate / Transform brand visuals into common sections
 * (hero, services, case study, social, etc.).
 *
 * Pure presentation: parent passes the brand's `brandVisuals` bundle and
 * receives the resolved template + slot assets via `onApply`.
 */
import { useMemo, useState } from 'react';
import { LayoutTemplate, Sparkles, Image as ImageIcon, Film, Check } from 'lucide-react';
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
  type ResolvedSlot,
} from '@/lib/brandLayoutTemplates';

interface BrandLayoutTemplateGalleryProps {
  brandVisuals?: BrandVisualsBundle;
  selectedTemplateId?: string;
  onApply?: (template: BrandLayoutTemplate, resolved: ResolvedSlot[]) => void;
  /** Restrict to specific targets (e.g. only show 'hero' templates in a hero editor). */
  targets?: LayoutSectionTarget[];
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

const TemplatePreviewCanvas = ({
  template,
  resolved,
}: {
  template: BrandLayoutTemplate;
  resolved: ResolvedSlot[];
}) => (
  <div
    className="relative w-full overflow-hidden rounded-md border border-border bg-muted/30"
    style={{ aspectRatio: template.aspectRatio }}
  >
    {resolved.map(({ slot, asset }) => {
      const pos = slot.position ?? { x: 0, y: 0, width: 100, height: 100 };
      return (
        <div
          key={slot.key}
          className="absolute overflow-hidden"
          style={{
            left: `${pos.x}%`,
            top: `${pos.y}%`,
            width: `${pos.width}%`,
            height: `${pos.height}%`,
          }}
        >
          {asset.type === 'image' && (
            <img
              src={asset.url}
              alt={slot.label}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          )}
          {asset.type === 'video' && (
            <video
              src={asset.url}
              className="h-full w-full object-cover"
              autoPlay
              muted
              loop
              playsInline
            />
          )}
          {asset.type === 'empty' && (
            <div
              className="flex h-full w-full flex-col items-center justify-center gap-1 border border-dashed text-[10px]"
              style={{
                borderColor: expressionStateColor[slot.expressionState],
                background: `${expressionStateColor[slot.expressionState]}14`,
                color: expressionStateColor[slot.expressionState],
              }}
            >
              <ImageIcon className="h-3 w-3" />
              <span>{slot.expressionState}</span>
            </div>
          )}

          {/* Slot type chip */}
          <div className="absolute left-1 top-1 flex items-center gap-1">
            <span
              className="rounded px-1 py-0.5 text-[9px] font-medium text-white shadow-sm"
              style={{ background: `${expressionStateColor[slot.expressionState]}cc` }}
            >
              {asset.type === 'video' ? (
                <Film className="inline h-2.5 w-2.5" />
              ) : (
                <ImageIcon className="inline h-2.5 w-2.5" />
              )}{' '}
              {slot.expressionState}
            </span>
          </div>
        </div>
      );
    })}

    {/* Headline overlay hint */}
    {template.overlay?.headline && (
      <div
        className="pointer-events-none absolute left-0 right-0 px-4"
        style={{ top: `${template.overlay.headline.y}%` }}
      >
        <div
          className={cn(
            'h-1.5 w-3/5 rounded bg-foreground/40 backdrop-blur-sm',
            template.overlay.headline.align === 'center' && 'mx-auto',
            template.overlay.headline.align === 'right' && 'ml-auto',
          )}
        />
      </div>
    )}
  </div>
);

export const BrandLayoutTemplateGallery = ({
  brandVisuals,
  selectedTemplateId,
  onApply,
  targets,
}: BrandLayoutTemplateGalleryProps) => {
  const [activeTarget, setActiveTarget] = useState<LayoutSectionTarget | 'all'>('all');

  const visibleTargets = useMemo(
    () =>
      targets
        ? layoutTargets.filter((t) => targets.includes(t.id))
        : layoutTargets,
    [targets],
  );

  const filtered = useMemo(() => {
    const base = targets
      ? brandLayoutTemplates.filter((t) => targets.includes(t.target))
      : brandLayoutTemplates;
    return activeTarget === 'all' ? base : base.filter((t) => t.target === activeTarget);
  }, [activeTarget, targets]);

  return (
    <section className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
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
          {visibleTargets.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTarget(t.id)}
              className={cn(
                'rounded-full border px-2.5 py-1 text-xs transition-colors',
                activeTarget === t.id
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-muted/50 text-muted-foreground hover:border-primary/50',
              )}
              title={t.description}
            >
              {t.label}
            </button>
          ))}
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

          return (
            <div
              key={template.id}
              className={cn(
                'group flex flex-col gap-2 rounded-lg border-2 bg-card p-3 transition-all',
                isSelected
                  ? 'border-primary ring-2 ring-primary/20'
                  : 'border-border hover:border-primary/50 hover:shadow-md',
              )}
            >
              <TemplatePreviewCanvas template={template} resolved={resolved} />

              <div className="space-y-1">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium leading-tight">{template.name}</p>
                  {isSelected && <Check className="h-4 w-4 shrink-0 text-primary" />}
                </div>
                <p className="line-clamp-2 text-xs text-muted-foreground">
                  {template.description}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-1">
                {expressionStates.map((state) => (
                  <ExpressionBadge key={state} state={state} />
                ))}
                <span className="ml-auto text-[10px] uppercase tracking-wide text-muted-foreground">
                  {template.target}
                </span>
              </div>

              {onApply && (
                <Button
                  size="sm"
                  variant={isSelected ? 'default' : 'outline'}
                  className="mt-1 h-8 w-full text-xs"
                  onClick={() => onApply(template, resolved)}
                >
                  {isSelected ? 'Applied' : 'Apply template'}
                </Button>
              )}
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <p className="py-6 text-center text-xs text-muted-foreground">
          No templates available for this filter.
        </p>
      )}
    </section>
  );
};

export default BrandLayoutTemplateGallery;
