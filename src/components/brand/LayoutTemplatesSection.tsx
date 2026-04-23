import { useState } from 'react';
import { ImageIcon } from 'lucide-react';
import { SectionHeader } from './SectionHeader';
import { BrandLayoutTemplateGallery } from './BrandLayoutTemplateGallery';
import type { ApplyTarget } from './LayoutTemplateEditor';
import type {
  BrandVisualsBundle,
  LayoutTemplateCustomization,
} from '@/lib/brandLayoutTemplates';

interface LayoutTemplatesSectionProps {
  brandVisuals?: BrandVisualsBundle;
  /** When true, indicates the bundle was auto-derived from existing brand assets. */
  isDerived?: boolean;
  customSubtitle?: string;
  onSubtitleChange?: (subtitle: string) => void;
  savedCustomizations?: LayoutTemplateCustomization[];
  onSaveCustomization?: (customization: LayoutTemplateCustomization) => void;
  onApplyToSection?: (target: ApplyTarget, asset: { type: 'image' | 'video'; url: string }) => void;
}

export const LayoutTemplatesSection = ({
  brandVisuals,
  isDerived,
  customSubtitle,
  onSubtitleChange,
  savedCustomizations,
  onSaveCustomization,
  onApplyToSection,
}: LayoutTemplatesSectionProps) => {
  const [isHeaderEditing, setIsHeaderEditing] = useState(false);
  const connectedVisuals =
    (brandVisuals?.staticAssets?.length ?? 0) + (brandVisuals?.motionAssets?.length ?? 0);

  return (
    <section className="space-y-4 sm:space-y-6">
      <SectionHeader
        title="Layout Templates"
        defaultSubtitle="Ready-to-use layouts that automatically place Foundation, Collaborate, and Transform visuals into hero, social, editorial, and case-study compositions."
        customSubtitle={customSubtitle}
        onSubtitleChange={onSubtitleChange}
        isEditing={isHeaderEditing}
        onEditToggle={() => setIsHeaderEditing(!isHeaderEditing)}
      />

      <div
        id="layout-templates"
        className="relative overflow-hidden rounded-2xl border-2 border-primary/30 bg-gradient-to-br from-primary/10 via-primary/5 to-background p-5 shadow-sm sm:p-6"
      >
        <div
          className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-primary/10 blur-3xl"
          aria-hidden
        />

        <div className="relative space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-primary">
                <ImageIcon className="h-3 w-3" />
                Brand Visual Templates
              </div>
              <h3 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                Auto-filled from your brand visual system
              </h3>
              <p className="max-w-2xl text-sm text-muted-foreground">
                Browse, customize, export and apply reusable layouts built specifically for the Foundation, Collaborate, and Transform asset set.
              </p>
            </div>

            <div className="flex flex-col items-end gap-1">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="inline-flex h-2 w-2 rounded-full bg-primary animate-pulse" />
                {connectedVisuals} brand visuals connected
              </div>
              {isDerived && connectedVisuals > 0 && (
                <span className="rounded-full border border-primary/30 bg-primary/5 px-2 py-0.5 text-[10px] font-medium text-primary">
                  Auto-derived from your brand assets
                </span>
              )}
            </div>
          </div>

          {connectedVisuals > 0 ? (
            <BrandLayoutTemplateGallery
              brandVisuals={brandVisuals}
              savedCustomizations={savedCustomizations}
              onSaveCustomization={onSaveCustomization}
              onApplyToSection={onApplyToSection}
            />
          ) : (
            <div className="rounded-xl border border-dashed border-border bg-background/60 px-4 py-8 text-center text-sm text-muted-foreground">
              Add brand imagery, patterns, gradients, or a hero cover image — your Layout Templates will auto-fill from those assets.
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default LayoutTemplatesSection;
