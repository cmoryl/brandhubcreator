/**
 * CollateralPresetSwitcher
 *
 * Quick-preview preset chips for marketing collateral. Lets a user switch the
 * Layout Templates gallery between Ebrochure, Case Study, One-Pager and White
 * Paper layouts — and instantly reframe previews at the canonical aspect ratio
 * for that collateral type (A4 portrait, 16:9, A4 spread, etc.).
 *
 * Pure presentation component — parent owns the active state.
 */
import { FileText, BookOpen, FileBadge2, Newspaper, X, Frame, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { LayoutSectionTarget } from '@/lib/brandLayoutTemplates';

/** Selectable reframe ratios offered when a preset is active. */
export interface AspectRatioOption {
  id: string;
  label: string;
  ratio: number;
}

export const aspectRatioOverrides: AspectRatioOption[] = [
  { id: 'a4-portrait', label: 'A4 Portrait', ratio: 210 / 297 },
  { id: 'a4-landscape', label: 'A4 Landscape', ratio: 297 / 210 },
  { id: 'letter-portrait', label: 'US Letter', ratio: 8.5 / 11 },
  { id: '16-9', label: '16:9', ratio: 16 / 9 },
  { id: '4-3', label: '4:3', ratio: 4 / 3 },
  { id: '1-1', label: 'Square', ratio: 1 },
  { id: '9-16', label: '9:16 Story', ratio: 9 / 16 },
];

export interface CollateralPreset {
  id: string;
  label: string;
  description: string;
  /** Layout target to filter the gallery to. */
  target: LayoutSectionTarget;
  /** Canonical aspect ratio used for instant preview reframing. */
  aspectRatio: number;
  /** Human-readable ratio label (e.g. "A4 Portrait", "16:9"). */
  ratioLabel: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const collateralPresets: CollateralPreset[] = [
  {
    id: 'ebrochure',
    label: 'Ebrochure',
    description: 'Multi-page A4 portrait digital brochure',
    target: 'ebrochure',
    aspectRatio: 210 / 297,
    ratioLabel: 'A4 Portrait',
    icon: BookOpen,
  },
  {
    id: 'casestudy',
    label: 'Case Study',
    description: 'Hero-led 16:9 case study layouts',
    target: 'casestudy',
    aspectRatio: 16 / 9,
    ratioLabel: '16:9',
    icon: FileBadge2,
  },
  {
    id: 'onepager',
    label: 'One-Pager',
    description: 'Single-page A4 sales sheet',
    target: 'onepager',
    aspectRatio: 210 / 297,
    ratioLabel: 'A4 Portrait',
    icon: FileText,
  },
  {
    id: 'whitepaper',
    label: 'White Paper',
    description: 'Long-form report cover & spreads',
    target: 'whitepaper',
    aspectRatio: 210 / 297,
    ratioLabel: 'A4 Portrait',
    icon: Newspaper,
  },
];

interface CollateralPresetSwitcherProps {
  activePresetId: string | null;
  onPresetChange: (preset: CollateralPreset | null) => void;
  /** Optional ratio override applied on top of the active preset's canonical ratio. */
  ratioOverride?: number | null;
  /** Called when the user picks a custom reframe ratio (or clears it). */
  onRatioOverrideChange?: (ratio: number | null) => void;
  className?: string;
}

export const CollateralPresetSwitcher = ({
  activePresetId,
  onPresetChange,
  ratioOverride,
  onRatioOverrideChange,
  className,
}: CollateralPresetSwitcherProps) => {
  const activePreset = collateralPresets.find((p) => p.id === activePresetId) ?? null;
  const matchedOverride =
    ratioOverride != null
      ? aspectRatioOverrides.find((o) => Math.abs(o.ratio - ratioOverride) < 0.001) ?? null
      : null;

  return (
    <div className={cn('rounded-lg border bg-muted/30 p-3', className)}>
      <div className="mb-2 flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Quick collateral previews
        </p>
        {activePresetId && (
          <button
            type="button"
            onClick={() => onPresetChange(null)}
            className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground hover:bg-background hover:text-foreground transition-colors"
            title="Clear preset"
          >
            <X className="h-3 w-3" />
            Clear
          </button>
        )}
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {collateralPresets.map((preset) => {
          const Icon = preset.icon;
          const isActive = activePresetId === preset.id;
          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => onPresetChange(isActive ? null : preset)}
              className={cn(
                'group flex flex-col items-start gap-1 rounded-md border p-2.5 text-left transition-all',
                isActive
                  ? 'border-primary bg-primary/10 shadow-sm ring-1 ring-primary/30'
                  : 'border-border bg-background hover:border-primary/50 hover:bg-primary/5',
              )}
              title={preset.description}
            >
              <div className="flex w-full items-center justify-between">
                <Icon
                  className={cn(
                    'h-4 w-4',
                    isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-primary',
                  )}
                />
                <span
                  className={cn(
                    'text-[9px] font-semibold uppercase tracking-wide',
                    isActive ? 'text-primary' : 'text-muted-foreground',
                  )}
                >
                  {preset.ratioLabel}
                </span>
              </div>
              <span
                className={cn(
                  'text-xs font-semibold leading-tight',
                  isActive ? 'text-foreground' : 'text-foreground/90',
                )}
              >
                {preset.label}
              </span>
              <span className="line-clamp-2 text-[10px] leading-snug text-muted-foreground">
                {preset.description}
              </span>
            </button>
          );
        })}
      </div>

      {/* Aspect ratio override — only meaningful when a preset is active */}
      {activePreset && onRatioOverrideChange && (
        <div className="mt-3 border-t border-border/60 pt-3">
          <div className="mb-1.5 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Frame className="h-3 w-3 text-muted-foreground" />
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Reframe ratio
              </p>
              <span className="text-[10px] text-muted-foreground/80">
                Canonical: <span className="font-medium text-foreground/80">{activePreset.ratioLabel}</span>
              </span>
            </div>
            {ratioOverride != null && (
              <button
                type="button"
                onClick={() => onRatioOverrideChange(null)}
                className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground hover:bg-background hover:text-foreground transition-colors"
                title="Reset to canonical ratio"
              >
                <RotateCcw className="h-3 w-3" />
                Reset
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {aspectRatioOverrides.map((opt) => {
              const isActive = matchedOverride?.id === opt.id;
              const isCanonical =
                ratioOverride == null && Math.abs(opt.ratio - activePreset.aspectRatio) < 0.001;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => onRatioOverrideChange(isActive ? null : opt.ratio)}
                  className={cn(
                    'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium transition-colors',
                    isActive
                      ? 'border-primary bg-primary text-primary-foreground'
                      : isCanonical
                        ? 'border-primary/40 bg-primary/10 text-primary'
                        : 'border-border bg-background text-muted-foreground hover:border-primary/50 hover:text-foreground',
                  )}
                  title={
                    isCanonical
                      ? `${opt.label} — canonical ratio for ${activePreset.label}`
                      : `Reframe previews to ${opt.label}`
                  }
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default CollateralPresetSwitcher;
