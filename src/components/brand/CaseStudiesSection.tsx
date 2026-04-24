import { useMemo, useRef, useState } from 'react';
import { Plus, X, Pencil, Upload, Layers, Download, FileImage } from 'lucide-react';
import JSZip from 'jszip';
import { BrandCaseStudy, BrandLogo, SocialTemplateZone } from '@/types/brand';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { SectionHeader } from './SectionHeader';
import { useStorageUpload } from '@/hooks/useStorageUpload';
import { toast } from 'sonner';
import { LayoutSelector, useLayoutClasses, LayoutPreset } from './LayoutSelector';
import { safeUUID } from '@/lib/safeUUID';
import {
  TemplateCanvasEditor,
  CanvasEditorZone,
  hydrateZoneDefaults,
} from './templating/TemplateCanvasEditor';
import {
  renderZoneAtOriginalResolution,
  detectAssetTransparency,
} from '@/lib/templateZonePipeline';

interface CaseStudiesSectionProps {
  caseStudies: BrandCaseStudy[];
  onCaseStudiesChange?: (caseStudies: BrandCaseStudy[]) => void;
  customSubtitle?: string;
  onSubtitleChange?: (subtitle: string) => void;
  layout?: LayoutPreset;
  onLayoutChange?: (layout: LayoutPreset) => void;
  entityId?: string;
  entityType?: 'brand' | 'product' | 'event';
  /** Brand logo library — drives the variant picker + auto-match in the templated editor. */
  brandLogos?: BrandLogo[];
}

// ---------------------------------------------------------------------------
// Default template: a single logo zone bottom-left + a CTA chip top-right.
// Each case study can edit / move / resize these as needed; image media is
// supplied by the case study's own previewUrl as the canvas background.
// ---------------------------------------------------------------------------
const buildDefaultZones = (brandLogos?: BrandLogo[]): SocialTemplateZone[] => {
  const zones: SocialTemplateZone[] = [
    {
      type: 'logo',
      x: 4, y: 76,
      width: 22, height: 18,
      label: 'Brand mark',
      mediaFit: { fit: 'contain', focusX: 50, focusY: 50 },
    },
    {
      type: 'cta',
      x: 60, y: 6,
      width: 36, height: 12,
      label: 'CTA',
      content: 'Read the full case study',
      align: 'right',
    },
  ];
  // Reuse the canvas editor's hydrate helper to seed the logo zone.
  return hydrateZoneDefaults(
    zones.map((z) => ({ ...z, id: safeUUID() })) as (SocialTemplateZone & { id: string })[],
    brandLogos,
  ).map(({ id: _id, ...rest }) => rest as SocialTemplateZone);
};

const toEditorZones = (zones: SocialTemplateZone[] | undefined): CanvasEditorZone[] =>
  (zones || []).map((zone, index) => ({
    ...zone,
    id: `${zone.type}-${index}`,
    label: zone.label || `${zone.type} zone`,
  }));

const fromEditorZones = (zones: CanvasEditorZone[]): SocialTemplateZone[] =>
  zones.map(({ id: _id, ...rest }) => rest as SocialTemplateZone);

export const CaseStudiesSection = ({
  caseStudies: caseStudiesProp,
  onCaseStudiesChange,
  customSubtitle,
  onSubtitleChange,
  layout = 'grid-3',
  onLayoutChange,
  entityId,
  entityType = 'brand',
  brandLogos,
}: CaseStudiesSectionProps) => {
  const canEdit = Boolean(onCaseStudiesChange);
  const caseStudies = Array.isArray(caseStudiesProp) ? caseStudiesProp : [];
  const [editingId, setEditingId] = useState<string | null>(null);
  const [templateEditingId, setTemplateEditingId] = useState<string | null>(null);
  const [exportingId, setExportingId] = useState<string | null>(null);
  const [exportTransparent, setExportTransparent] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [isHeaderEditing, setIsHeaderEditing] = useState(false);
  const { uploadFile } = useStorageUpload({ entityType, entityId });

  const { gridClass } = useLayoutClasses(layout);

  const editingStudy = useMemo(
    () => caseStudies.find((c) => c.id === templateEditingId) || null,
    [caseStudies, templateEditingId],
  );

  const addCaseStudy = () => {
    if (!onCaseStudiesChange) return;
    const newCase: BrandCaseStudy = {
      id: safeUUID(),
      title: 'New Case Study',
      description: 'Describe the project, goals, and outcomes',
      previewUrl: '',
      templateAspect: '16 / 9',
      templateZones: buildDefaultZones(brandLogos),
    };
    onCaseStudiesChange([...caseStudies, newCase]);
    setEditingId(newCase.id);
  };

  const updateCaseStudy = (id: string, updates: Partial<BrandCaseStudy>) => {
    if (!onCaseStudiesChange) return;
    onCaseStudiesChange(caseStudies.map((c) => (c.id === id ? { ...c, ...updates } : c)));
  };

  const deleteCaseStudy = (id: string) => {
    if (!onCaseStudiesChange) return;
    onCaseStudiesChange(caseStudies.filter((c) => c.id !== id));
    if (editingId === id) setEditingId(null);
    if (templateEditingId === id) setTemplateEditingId(null);
  };

  const persistFile = async (file: File): Promise<string | null> => {
    if (entityId) {
      const result = await uploadFile(file, 'asset', `casestudy-${safeUUID()}`);
      return result?.url ?? null;
    }
    return new Promise<string | null>((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve((e.target?.result as string) || null);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(file);
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !pendingId) return;
    const currentPendingId = pendingId;
    if (fileInputRef.current) fileInputRef.current.value = '';
    setPendingId(null);

    const url = await persistFile(file);
    if (!url) return;
    updateCaseStudy(currentPendingId, { previewUrl: url });
  };

  const triggerUpload = (id: string) => {
    setPendingId(id);
    fileInputRef.current?.click();
  };

  /**
   * Export every zone of the given case study at original media resolution
   * into a ZIP archive. Logo zones backed by transparent assets always render
   * with their alpha channel preserved regardless of the dialog toggle.
   */
  const exportTemplateAsZip = async (study: BrandCaseStudy, transparent: boolean) => {
    const zones = study.templateZones || [];
    if (zones.length === 0) {
      toast.error('No template zones to export');
      return;
    }
    setExportingId(study.id);
    try {
      const zip = new JSZip();
      const folder = zip.folder(study.title.replace(/[^\w-]+/g, '-')) || zip;
      let originalUsed = 0;
      let originalFallback = 0;

      for (let i = 0; i < zones.length; i++) {
        const zone = zones[i];
        if (!zone.mediaUrl) continue;

        // Logo zones with transparent source assets always force transparency.
        const logoNeedsTransparency = zone.type === 'logo'
          && await detectAssetTransparency(zone.mediaUrl).catch(() => false);
        const useTransparent = transparent || logoNeedsTransparency;

        const dataUrl = await renderZoneAtOriginalResolution(zone, useTransparent);
        if (!dataUrl) {
          originalFallback += 1;
          continue;
        }
        originalUsed += 1;
        const safeLabel = (zone.label || `zone-${i + 1}`).replace(/[^\w-]+/g, '-');
        folder.file(
          `${String(i + 1).padStart(2, '0')}-${safeLabel}.png`,
          dataUrl.split(',')[1],
          { base64: true },
        );
      }

      // Always also include the background image as `background.png`.
      if (study.previewUrl) {
        try {
          const bgRes = await fetch(study.previewUrl);
          const bgBlob = await bgRes.blob();
          folder.file('background.png', bgBlob);
        } catch {
          // Best-effort — skip if the URL isn't fetchable.
        }
      }

      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${study.title.replace(/[^\w-]+/g, '-')}-zones.zip`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 2000);

      if (originalFallback > 0) {
        toast.success(
          `Exported ${originalUsed} zone${originalUsed === 1 ? '' : 's'} (${originalFallback} skipped — no source media)`,
        );
      } else {
        toast.success(`Exported ${originalUsed} zone${originalUsed === 1 ? '' : 's'} at original resolution`);
      }
    } catch (err) {
      console.error('Case study template export failed', err);
      toast.error('Failed to export template zones');
    } finally {
      setExportingId(null);
    }
  };

  return (
    <section className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div className="flex-1 min-w-0">
          <SectionHeader
            title="Proof Shards"
            defaultSubtitle="Repository of historical success models"
            customSubtitle={customSubtitle}
            onSubtitleChange={canEdit ? onSubtitleChange : undefined}
            isEditing={isHeaderEditing}
            onEditToggle={() => setIsHeaderEditing(!isHeaderEditing)}
          />
        </div>
        <div className="flex items-center gap-2">
          {onLayoutChange && (
            <LayoutSelector
              value={layout}
              onChange={onLayoutChange}
              availableLayouts={['grid-2', 'grid-3', 'grid-4', 'list']}
              size="sm"
            />
          )}
          {canEdit && (
            <Button onClick={addCaseStudy} size="sm" className="gap-2 shrink-0">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Add Case Study</span>
              <span className="sm:hidden">Add</span>
            </Button>
          )}
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        className="hidden"
      />

      <div className={gridClass}>
        {caseStudies.map((study, index) => (
          <div
            key={study.id}
            className="group relative bg-card rounded-xl overflow-hidden shadow-sm border border-border animate-scale-in"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            {/* Preview Image with Drag & Drop */}
            <div
              className={`aspect-video bg-muted relative ${canEdit ? 'cursor-pointer' : ''} transition-colors`}
              onClick={() => canEdit && triggerUpload(study.id)}
              onDragOver={canEdit ? (e) => {
                e.preventDefault();
                e.currentTarget.classList.add('ring-2', 'ring-primary');
              } : undefined}
              onDragLeave={canEdit ? (e) => {
                e.preventDefault();
                e.currentTarget.classList.remove('ring-2', 'ring-primary');
              } : undefined}
              onDrop={canEdit ? async (e) => {
                e.preventDefault();
                e.currentTarget.classList.remove('ring-2', 'ring-primary');
                const file = e.dataTransfer.files?.[0];
                if (file && file.type.startsWith('image/')) {
                  const url = await persistFile(file);
                  if (url) updateCaseStudy(study.id, { previewUrl: url });
                }
              } : undefined}
              style={study.previewUrl ? {
                backgroundImage: `url(${study.previewUrl})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              } : undefined}
            >
              {!study.previewUrl && canEdit && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground hover:text-accent transition-colors gap-1">
                  <Upload className="h-8 w-8" />
                  <span className="text-xs">Drop image or click</span>
                </div>
              )}
              {!study.previewUrl && !canEdit && (
                <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                  <span className="text-sm">No preview</span>
                </div>
              )}

              {/* Templated zone overlay preview (read-only thumbnail). */}
              {study.previewUrl && study.templateZones?.length ? (
                <div className="pointer-events-none absolute inset-0">
                  {study.templateZones.map((zone, zi) => (
                    (zone.type === 'logo' || zone.type === 'image') && zone.mediaUrl ? (
                      <img
                        key={`${study.id}-prev-${zi}`}
                        src={zone.mediaUrl}
                        alt={zone.label}
                        className="absolute"
                        style={{
                          left: `${zone.x}%`,
                          top: `${zone.y}%`,
                          width: `${zone.width}%`,
                          height: `${zone.height}%`,
                          objectFit: zone.mediaFit?.fit || 'contain',
                          objectPosition: `${zone.mediaFit?.focusX ?? 50}% ${zone.mediaFit?.focusY ?? 50}%`,
                        }}
                      />
                    ) : null
                  ))}
                </div>
              ) : null}

              {canEdit && (
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  <button
                    onClick={(e) => { e.stopPropagation(); setTemplateEditingId(study.id); }}
                    className="p-1.5 rounded-full bg-background/80 backdrop-blur-sm hover:bg-secondary"
                    title="Edit template zones"
                  >
                    <Layers className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteCaseStudy(study.id); }}
                    className="p-1.5 rounded-full bg-background/80 backdrop-blur-sm hover:bg-destructive hover:text-destructive-foreground"
                    title="Delete case study"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>

            <div className="p-4">
              {canEdit && editingId === study.id ? (
                <div className="space-y-3">
                  <Input
                    value={study.title}
                    onChange={(e) => updateCaseStudy(study.id, { title: e.target.value })}
                    placeholder="Case study title"
                  />
                  <Textarea
                    value={study.description}
                    onChange={(e) => updateCaseStudy(study.id, { description: e.target.value })}
                    placeholder="Description"
                    className="min-h-[80px] resize-none"
                  />
                  <Button size="sm" variant="secondary" onClick={() => setEditingId(null)} className="w-full">
                    Done
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-start justify-between">
                    <h3 className="font-semibold text-foreground">{study.title}</h3>
                    {canEdit && (
                      <button
                        onClick={() => setEditingId(study.id)}
                        className="p-1.5 rounded-md hover:bg-secondary transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                      </button>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-3">{study.description}</p>
                </div>
              )}
            </div>
          </div>
        ))}

        {caseStudies.length === 0 && canEdit && (
          <button
            onClick={addCaseStudy}
            className="aspect-video border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-accent hover:text-accent transition-colors"
          >
            <Plus className="h-8 w-8" />
            <span className="text-sm font-medium">Add your first case study</span>
          </button>
        )}
      </div>

      {/* Templated single-page editor dialog */}
      <Dialog open={!!editingStudy} onOpenChange={(open) => !open && setTemplateEditingId(null)}>
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle>{editingStudy?.title || 'Case study template'}</DialogTitle>
            <DialogDescription>
              Drag, resize and bind logos to zones. The case study's preview image is the canvas background.
            </DialogDescription>
          </DialogHeader>
          {editingStudy && (
            <div className="space-y-4">
              <TemplateCanvasEditor
                aspect={editingStudy.templateAspect || '16 / 9'}
                backgroundUrl={editingStudy.previewUrl || undefined}
                brandLogos={brandLogos}
                onUploadFile={persistFile}
                canEdit={canEdit}
                zones={toEditorZones(editingStudy.templateZones)}
                onZonesChange={(next) =>
                  updateCaseStudy(editingStudy.id, { templateZones: fromEditorZones(next) })
                }
              />

              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-muted/20 p-3">
                <div className="flex items-center gap-2">
                  <Switch
                    id={`transparent-${editingStudy.id}`}
                    checked={exportTransparent}
                    onCheckedChange={setExportTransparent}
                  />
                  <Label htmlFor={`transparent-${editingStudy.id}`} className="text-sm">
                    Transparent background on PNGs
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => editingStudy && triggerUpload(editingStudy.id)}
                    className="gap-1.5"
                  >
                    <FileImage className="h-3.5 w-3.5" />
                    Replace background
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => editingStudy && exportTemplateAsZip(editingStudy, exportTransparent)}
                    disabled={exportingId === editingStudy.id}
                    className="gap-1.5"
                  >
                    <Download className="h-3.5 w-3.5" />
                    {exportingId === editingStudy.id ? 'Exporting…' : 'Export zones (orig. resolution)'}
                  </Button>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setTemplateEditingId(null)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
};
