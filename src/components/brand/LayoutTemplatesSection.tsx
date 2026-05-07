import { useState } from 'react';
import { Layers, Sparkles, Wand2 } from 'lucide-react';
import { SectionHeader } from './SectionHeader';
import { BrandLayoutTemplateGallery } from './BrandLayoutTemplateGallery';
import type { ApplyTarget } from './LayoutTemplateEditor';
import type {
  BrandVisualsBundle,
  LayoutTemplateCustomization,
} from '@/lib/brandLayoutTemplates';

interface LayoutTemplatesSectionProps {
  brandVisuals?: BrandVisualsBundle;
  brandLogos?: Array<{ id?: string; url?: string; name?: string; variant?: string }>;
  isDerived?: boolean;
  customSubtitle?: string;
  onSubtitleChange?: (subtitle: string) => void;
  savedCustomizations?: LayoutTemplateCustomization[];
  onSaveCustomization?: (customization: LayoutTemplateCustomization) => void;
  onApplyToSection?: (target: ApplyTarget, asset: { type: 'image' | 'video'; url: string }) => void;
}

export const LayoutTemplatesSection = ({
  brandVisuals,
  brandLogos,
  isDerived,
  customSubtitle,
  onSubtitleChange,
  savedCustomizations,
  onSaveCustomization,
  onApplyToSection,
}: LayoutTemplatesSectionProps) => {
  const [isHeaderEditing, setIsHeaderEditing] = useState(false);
  const staticCount = brandVisuals?.staticAssets?.length ?? 0;
  const motionCount = brandVisuals?.motionAssets?.length ?? 0;
  const humanCount = brandVisuals?.staticAssets?.filter((a) => a.category === 'human').length ?? 0;
  const abstractCount = staticCount - humanCount;
  const variantCount = savedCustomizations?.length ?? 0;
  const totalConnected = staticCount + motionCount;

  return (
    <section className="space-y-4 sm:space-y-6">
      <SectionHeader
        title="Brand Visual Templates"
        defaultSubtitle="An editorial system for composing on-brand layouts — pairs Foundation, Collaborate, and Transform expressions with brand-approved photography and gradient orbs."
        customSubtitle={customSubtitle}
        onSubtitleChange={onSubtitleChange}
        isEditing={isHeaderEditing}
        onEditToggle={() => setIsHeaderEditing(!isHeaderEditing)}
      />

      {/* Editorial dark shell */}
      <div
        id="layout-templates"
        className="relative overflow-hidden rounded-3xl border border-foreground/10 bg-[hsl(229_45%_8%)] text-white shadow-[0_30px_80px_-30px_hsl(229_60%_4%/0.6)]"
      >
        {/* Ambient orbs */}
        <div
          aria-hidden
          className="pointer-events-none absolute -left-32 -top-32 h-[420px] w-[420px] rounded-full bg-[hsl(229_100%_60%)] opacity-25 blur-[120px]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 top-40 h-[360px] w-[360px] rounded-full bg-[hsl(265_100%_65%)] opacity-20 blur-[120px]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.04] mix-blend-overlay"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
            backgroundSize: '24px 24px',
          }}
        />

        {/* Hero header */}
        <div className="relative px-6 pb-6 pt-8 sm:px-10 sm:pt-12 sm:pb-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/80 backdrop-blur">
                <Layers className="h-3 w-3" />
                Layout System · Editorial
              </div>
              <h3 className="font-[Poppins] text-3xl font-bold leading-[1.05] tracking-tight sm:text-4xl lg:text-5xl">
                Design like a magazine.
                <span className="block bg-gradient-to-r from-white via-white/90 to-white/40 bg-clip-text text-transparent">
                  Built like a brand system.
                </span>
              </h3>
              <p className="max-w-xl text-sm leading-relaxed text-white/70 sm:text-base">
                Browse, customize, export, and apply reusable compositions that automatically pull from
                your Foundation orbs, Collaborate human moments, and Transform gradient washes.
              </p>

              {isDerived && totalConnected > 0 && (
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] text-white/70">
                  <Sparkles className="h-3 w-3 text-[hsl(265_90%_75%)]" />
                  Auto-derived from your live brand assets
                </div>
              )}
            </div>

            {/* Stats strip */}
            <div className="grid w-full max-w-md grid-cols-2 gap-2 sm:grid-cols-4 lg:w-auto">
              <Stat label="Abstract" value={abstractCount} accent="hsl(229 100% 70%)" />
              <Stat label="Human" value={humanCount} accent="hsl(15 90% 65%)" />
              <Stat label="Motion" value={motionCount} accent="hsl(155 70% 55%)" />
              <Stat label="Variants" value={variantCount} accent="hsl(265 90% 75%)" icon={<Wand2 className="h-3 w-3" />} />
            </div>
          </div>
        </div>

        {/* Gallery surface */}
        <div className="relative border-t border-white/10 bg-[hsl(229_40%_6%)]/60 px-3 py-6 backdrop-blur-sm sm:px-6 sm:py-8">
          {totalConnected > 0 ? (
            <BrandLayoutTemplateGallery
              brandVisuals={brandVisuals}
              savedCustomizations={savedCustomizations}
              onSaveCustomization={onSaveCustomization}
              onApplyToSection={onApplyToSection}
            />
          ) : (
            <div className="rounded-2xl border border-dashed border-white/15 bg-white/5 px-6 py-16 text-center">
              <Layers className="mx-auto h-8 w-8 text-white/40" />
              <p className="mt-3 text-sm text-white/70">
                Add brand imagery, gradient orbs, or a hero cover image — your Layout Templates auto-fill from those assets.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

interface StatProps {
  label: string;
  value: number;
  accent: string;
  icon?: React.ReactNode;
}

const Stat = ({ label, value, accent, icon }: StatProps) => (
  <div className="group relative overflow-hidden rounded-xl border border-white/10 bg-white/[0.04] p-3 backdrop-blur-sm transition-colors hover:border-white/20">
    <div
      aria-hidden
      className="absolute inset-x-0 top-0 h-px"
      style={{ background: `linear-gradient(90deg, transparent, ${accent}, transparent)` }}
    />
    <div className="flex items-center justify-between gap-2">
      <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/50">
        {label}
      </span>
      {icon && <span className="text-white/40">{icon}</span>}
    </div>
    <div className="mt-1 font-[Poppins] text-2xl font-bold tabular-nums text-white">
      {value}
    </div>
  </div>
);

export default LayoutTemplatesSection;
