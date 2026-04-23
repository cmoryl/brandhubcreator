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
import { FileText, BookOpen, FileBadge2, Newspaper, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { LayoutSectionTarget } from '@/lib/brandLayoutTemplates';

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
  className?: string;
}

export const CollateralPresetSwitcher = ({
  activePresetId,
  onPresetChange,
  className,
}: CollateralPresetSwitcherProps) => {
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
    </div>
  );
};

export default CollateralPresetSwitcher;
