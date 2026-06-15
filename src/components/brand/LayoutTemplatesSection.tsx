import { useState } from 'react';
import { Layers, Sparkles, Wand2, ExternalLink, Link2, Check, Pencil } from 'lucide-react';
import { SectionHeader } from './SectionHeader';
import { BrandLayoutTemplateGallery } from './BrandLayoutTemplateGallery';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { parseCanvaUrl } from '@/lib/canvaEmbed';
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
  /** Section-level Canva folder/brand-kit URL — surfaced as "Open in Canva" CTA. */
  canvaFolderUrl?: string;
  /** Per-template Canva share URLs (template.id → URL) — rendered as live iframes per card. */
  canvaTemplateLinks?: Record<string, string>;
  /** Admin-only callbacks. When provided, editing UI is shown. */
  onCanvaFolderUrlChange?: (url: string) => void;
  onCanvaTemplateLinkChange?: (templateId: string, url: string) => void;
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
  canvaFolderUrl,
  canvaTemplateLinks,
  onCanvaFolderUrlChange,
  onCanvaTemplateLinkChange,
}: LayoutTemplatesSectionProps) => {
  const [isHeaderEditing, setIsHeaderEditing] = useState(false);
  const [folderDraft, setFolderDraft] = useState(canvaFolderUrl ?? '');
  const [folderEditing, setFolderEditing] = useState(false);
  const staticCount = brandVisuals?.staticAssets?.length ?? 0;
  const motionCount = brandVisuals?.motionAssets?.length ?? 0;
  const humanCount = brandVisuals?.staticAssets?.filter((a) => a.category === 'human').length ?? 0;
  const abstractCount = staticCount - humanCount;
  const variantCount = savedCustomizations?.length ?? 0;
  const totalConnected = staticCount + motionCount;

  const canEditCanva = !!onCanvaFolderUrlChange;
  const parsedFolder = parseCanvaUrl(canvaFolderUrl);
  const linkedTemplateCount = canvaTemplateLinks
    ? Object.values(canvaTemplateLinks).filter((u) => !!parseCanvaUrl(u)).length
    : 0;

  const saveFolder = () => {
    const trimmed = folderDraft.trim();
    if (trimmed && !parseCanvaUrl(trimmed)) return;
    onCanvaFolderUrlChange?.(trimmed);
    setFolderEditing(false);
  };

  return (
    <section className="space-y-4 sm:space-y-6">
      <SectionHeader
        title="Brand Visual Templates"
        defaultSubtitle="An editorial system for composing on-brand layouts — pairs Foundation, Collaborate, and Transform expressions with brand-approved photography and gradient orbs, now cohesive with your Canva account."
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
                Layout System · Editorial · Canva-cohesive
              </div>
              <h3 className="font-[Poppins] text-3xl font-bold leading-[1.05] tracking-tight sm:text-4xl lg:text-5xl">
                Design like a magazine.
                <span className="block bg-gradient-to-r from-white via-white/90 to-white/40 bg-clip-text text-transparent">
                  Built like a brand system.
                </span>
              </h3>
              <p className="max-w-xl text-sm leading-relaxed text-white/70 sm:text-base">
                Browse, customize, export, and apply reusable compositions that automatically pull from
                your Foundation orbs, Collaborate human moments, and Transform gradient washes —
                each template now mirrors a live design in your Canva account.
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

          {/* Canva integration bar */}
          <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[hsl(265_100%_65%)] to-[hsl(229_100%_60%)] text-white shadow-[0_8px_24px_-12px_hsl(265_100%_65%/0.8)]">
                  <CanvaGlyph />
                </div>
                <div className="min-w-0">
                  <p className="font-[Poppins] text-sm font-semibold text-white">
                    Canva integration
                  </p>
                  <p className="mt-0.5 text-[11px] leading-relaxed text-white/60">
                    Link your Canva brand folder once, then attach a Canva share link to each template
                    below. {linkedTemplateCount > 0 && (
                      <span className="text-[hsl(265_90%_85%)]">
                        {linkedTemplateCount} template{linkedTemplateCount === 1 ? '' : 's'} linked.
                      </span>
                    )}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {parsedFolder && !folderEditing && (
                  <a
                    href={parsedFolder.openUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-[hsl(229_45%_8%)] shadow-sm transition-colors hover:bg-white/90"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Open Canva folder
                  </a>
                )}
                {canEditCanva && !folderEditing && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 border-white/15 bg-white/5 text-xs text-white hover:border-white/30 hover:bg-white/10"
                    onClick={() => {
                      setFolderDraft(canvaFolderUrl ?? '');
                      setFolderEditing(true);
                    }}
                  >
                    {parsedFolder ? <Pencil className="mr-1 h-3 w-3" /> : <Link2 className="mr-1 h-3 w-3" />}
                    {parsedFolder ? 'Edit folder link' : 'Link Canva folder'}
                  </Button>
                )}
              </div>
            </div>

            {canEditCanva && folderEditing && (
              <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
                <Input
                  value={folderDraft}
                  onChange={(e) => setFolderDraft(e.target.value)}
                  placeholder="https://www.canva.com/folder/FAF…  or  https://www.canva.com/design/DAF…/view"
                  className="h-9 flex-1 border-white/15 bg-white/5 text-xs text-white placeholder:text-white/30"
                  autoFocus
                />
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={saveFolder}
                    disabled={folderDraft.trim() !== '' && !parseCanvaUrl(folderDraft)}
                    className="h-9 bg-white text-xs text-[hsl(229_45%_8%)] hover:bg-white/90"
                  >
                    <Check className="mr-1 h-3 w-3" />
                    Save
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setFolderEditing(false);
                      setFolderDraft(canvaFolderUrl ?? '');
                    }}
                    className="h-9 border-white/15 bg-white/5 text-xs text-white hover:border-white/30 hover:bg-white/10"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
            {canEditCanva && folderEditing && folderDraft.trim() !== '' && !parseCanvaUrl(folderDraft) && (
              <p className="mt-2 text-[11px] text-[hsl(15_90%_75%)]">
                That doesn't look like a Canva URL. Use a canva.com share, view, or folder link.
              </p>
            )}
          </div>
        </div>

        {/* Gallery surface */}
        <div className="relative border-t border-white/10 bg-[hsl(229_40%_6%)]/60 px-3 py-6 backdrop-blur-sm sm:px-6 sm:py-8">
          {totalConnected > 0 ? (
            <BrandLayoutTemplateGallery
              brandVisuals={brandVisuals}
              brandLogos={brandLogos}
              savedCustomizations={savedCustomizations}
              onSaveCustomization={onSaveCustomization}
              onApplyToSection={onApplyToSection}
              canvaTemplateLinks={canvaTemplateLinks}
              onCanvaTemplateLinkChange={onCanvaTemplateLinkChange}
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

/** Tiny inline "C" mark — Canva-evocative without trademark misuse. */
const CanvaGlyph = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
    <path
      fill="currentColor"
      d="M12 3a9 9 0 1 0 6.36 15.36l-1.42-1.42A7 7 0 1 1 19 12h-2a5 5 0 1 0-1.46 3.54l1.42 1.42A7 7 0 0 0 19 12a7 7 0 0 0-7-7Z"
    />
  </svg>
);

export default LayoutTemplatesSection;
