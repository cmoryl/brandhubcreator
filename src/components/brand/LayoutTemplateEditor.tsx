/**
 * LayoutTemplateEditor
 *
 * Dialog for customizing a brand layout template:
 *   - edit copy (eyebrow, headline, CTA)
 *   - swap individual slot assets
 *   - export PNG / PDF
 *   - apply the resolved cover to a brand section (Hero / Social / Case Study)
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { Download, FileImage, FileText, Save, Sparkles, Wand2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import {
  resolveTemplate,
  type BrandLayoutTemplate,
  type BrandVisualsBundle,
  type LayoutTemplateCustomization,
} from '@/lib/brandLayoutTemplates';
import { LayoutTemplateCanvas } from './LayoutTemplateCanvas';
import { exportLayoutAsPng, exportLayoutAsPdf } from '@/lib/exportLayoutTemplate';

export type ApplyTarget = 'hero' | 'social' | 'casestudy';

interface LayoutTemplateEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: BrandLayoutTemplate;
  brandVisuals?: BrandVisualsBundle;
  initialCustomization?: LayoutTemplateCustomization;
  onSave?: (customization: LayoutTemplateCustomization) => void;
  onApplyToSection?: (target: ApplyTarget, asset: { type: 'image' | 'video'; url: string }) => void;
}

const safeId = () =>
  (typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `lt-${Date.now()}`);

export const LayoutTemplateEditor = ({
  open,
  onOpenChange,
  template,
  brandVisuals,
  initialCustomization,
  onSave,
  onApplyToSection,
}: LayoutTemplateEditorProps) => {
  const [customization, setCustomization] = useState<LayoutTemplateCustomization>(() =>
    initialCustomization ?? {
      id: safeId(),
      baseTemplateId: template.id,
      name: template.name,
      copy: { eyebrow: '', headline: '', cta: '' },
      slotOverrides: {},
      overlayOverrides: template.overlay,
      createdAt: new Date().toISOString(),
    },
  );

  // Reset when a new template is opened
  useEffect(() => {
    if (open) {
      setCustomization(
        initialCustomization ?? {
          id: safeId(),
          baseTemplateId: template.id,
          name: template.name,
          copy: { eyebrow: '', headline: '', cta: '' },
          slotOverrides: {},
          overlayOverrides: template.overlay,
          createdAt: new Date().toISOString(),
        },
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, template.id]);

  const resolved = useMemo(
    () => resolveTemplate(template, brandVisuals, customization),
    [template, brandVisuals, customization],
  );

  const previewRef = useRef<HTMLDivElement>(null);

  const updateCopy = (key: 'eyebrow' | 'headline' | 'cta', value: string) =>
    setCustomization((c) => ({ ...c, copy: { ...(c.copy ?? {}), [key]: value } }));

  const setHeadlineAlign = (align: 'left' | 'center' | 'right') =>
    setCustomization((c) => ({
      ...c,
      overlayOverrides: {
        ...(c.overlayOverrides ?? template.overlay ?? {}),
        headline: { y: c.overlayOverrides?.headline?.y ?? template.overlay?.headline?.y ?? 60, align },
      },
    }));

  const setHeadlineY = (y: number) =>
    setCustomization((c) => ({
      ...c,
      overlayOverrides: {
        ...(c.overlayOverrides ?? template.overlay ?? {}),
        headline: {
          y,
          align: c.overlayOverrides?.headline?.align ?? template.overlay?.headline?.align ?? 'left',
        },
      },
    }));

  const setSlotOverride = (slotKey: string, assetIdAndType: string) => {
    if (assetIdAndType === '__auto__') {
      setCustomization((c) => {
        const next = { ...(c.slotOverrides ?? {}) };
        delete next[slotKey];
        return { ...c, slotOverrides: next };
      });
      return;
    }
    const [type, id] = assetIdAndType.split(':') as ['image' | 'video', string];
    setCustomization((c) => ({
      ...c,
      slotOverrides: { ...(c.slotOverrides ?? {}), [slotKey]: { type, assetId: id } },
    }));
  };

  const handleExportPng = async () => {
    if (!previewRef.current) return;
    try {
      await exportLayoutAsPng(previewRef.current, {
        fileName: `${customization.name.replace(/\s+/g, '-').toLowerCase()}.png`,
      });
      toast.success('PNG downloaded');
    } catch {
      toast.error('Could not export PNG');
    }
  };

  const handleExportPdf = async () => {
    if (!previewRef.current) return;
    try {
      await exportLayoutAsPdf(previewRef.current, {
        fileName: `${customization.name.replace(/\s+/g, '-').toLowerCase()}.pdf`,
        aspectRatio: template.aspectRatio,
      });
      toast.success('PDF downloaded');
    } catch {
      toast.error('Could not export PDF');
    }
  };

  const handleApply = (target: ApplyTarget) => {
    const cover = resolved.find((r) => r.asset.type !== 'empty');
    if (!cover || cover.asset.type === 'empty') {
      toast.error('No visual available to apply');
      return;
    }
    onApplyToSection?.(target, { type: cover.asset.type, url: cover.asset.url });
    toast.success(`Applied to ${target === 'casestudy' ? 'Case Study' : target}`);
  };

  const handleSave = () => {
    onSave?.(customization);
    toast.success('Variant saved');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wand2 className="h-4 w-4 text-primary" />
            Customize "{template.name}"
          </DialogTitle>
          <DialogDescription>
            Edit headline copy, swap individual visuals, then export or apply to a brand section.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
          {/* Live preview */}
          <div className="space-y-3">
            <LayoutTemplateCanvas
              ref={previewRef}
              template={template}
              resolved={resolved}
              customization={customization}
              presentationMode
            />
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={handleExportPng}>
                <FileImage className="mr-1.5 h-3.5 w-3.5" />
                PNG
              </Button>
              <Button size="sm" variant="outline" onClick={handleExportPdf}>
                <FileText className="mr-1.5 h-3.5 w-3.5" />
                PDF
              </Button>
              {onApplyToSection && (
                <>
                  <Button size="sm" variant="secondary" onClick={() => handleApply('hero')}>
                    <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                    Apply to Hero
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => handleApply('social')}>
                    Apply to Social
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => handleApply('casestudy')}>
                    Apply to Case Study
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Edit panel */}
          <ScrollArea className="max-h-[520px] rounded-lg border bg-muted/20 p-3">
            <Tabs defaultValue="copy">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="copy">Copy</TabsTrigger>
                <TabsTrigger value="slots">Slots</TabsTrigger>
                <TabsTrigger value="layout">Layout</TabsTrigger>
              </TabsList>

              <TabsContent value="copy" className="mt-3 space-y-3">
                <div>
                  <Label className="text-xs">Variant name</Label>
                  <Input
                    value={customization.name}
                    onChange={(e) => setCustomization((c) => ({ ...c, name: e.target.value }))}
                    className="mt-1 h-8"
                  />
                </div>
                {template.overlay?.eyebrow && (
                  <div>
                    <Label className="text-xs">Eyebrow</Label>
                    <Input
                      value={customization.copy?.eyebrow ?? ''}
                      onChange={(e) => updateCopy('eyebrow', e.target.value)}
                      placeholder="e.g. New release"
                      className="mt-1 h-8"
                    />
                  </div>
                )}
                {template.overlay?.headline && (
                  <div>
                    <Label className="text-xs">Headline</Label>
                    <Input
                      value={customization.copy?.headline ?? ''}
                      onChange={(e) => updateCopy('headline', e.target.value)}
                      placeholder="Your headline here"
                      className="mt-1 h-8"
                    />
                  </div>
                )}
                {template.overlay?.cta && (
                  <div>
                    <Label className="text-xs">CTA</Label>
                    <Input
                      value={customization.copy?.cta ?? ''}
                      onChange={(e) => updateCopy('cta', e.target.value)}
                      placeholder="e.g. Get started"
                      className="mt-1 h-8"
                    />
                  </div>
                )}
              </TabsContent>

              <TabsContent value="slots" className="mt-3 space-y-3">
                {template.slots.map((slot) => {
                  const matchingStatic = (brandVisuals?.staticAssets ?? []).filter(
                    (s) => s.expressionState === slot.expressionState,
                  );
                  const matchingMotion = (brandVisuals?.motionAssets ?? []).filter(
                    (m) => m.expressionState === slot.expressionState,
                  );
                  const ov = customization.slotOverrides?.[slot.key];
                  const value = ov && 'assetId' in ov ? `${ov.type}:${ov.assetId}` : '__auto__';

                  return (
                    <div key={slot.key} className="space-y-1">
                      <Label className="text-xs">
                        {slot.label}{' '}
                        <span className="text-muted-foreground">({slot.expressionState})</span>
                      </Label>
                      <Select value={value} onValueChange={(v) => setSlotOverride(slot.key, v)}>
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue placeholder="Auto" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__auto__">Auto (best match)</SelectItem>
                          {matchingStatic.length > 0 && (
                            <>
                              {matchingStatic.map((a) => (
                                <SelectItem key={`i-${a.id}`} value={`image:${a.id}`}>
                                  🖼 {a.name} · {a.aspectRatio}
                                </SelectItem>
                              ))}
                            </>
                          )}
                          {matchingMotion.map((m) => (
                            <SelectItem key={`v-${m.id}`} value={`video:${m.id}`}>
                              🎞 {m.name} · {m.aspectRatio}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  );
                })}
              </TabsContent>

              <TabsContent value="layout" className="mt-3 space-y-3">
                {template.overlay?.headline && (
                  <>
                    <div>
                      <Label className="text-xs">Headline alignment</Label>
                      <div className="mt-1 flex gap-1">
                        {(['left', 'center', 'right'] as const).map((a) => (
                          <Button
                            key={a}
                            size="sm"
                            variant={
                              (customization.overlayOverrides?.headline?.align ??
                                template.overlay?.headline?.align) === a
                                ? 'default'
                                : 'outline'
                            }
                            onClick={() => setHeadlineAlign(a)}
                            className="h-7 flex-1 text-xs"
                          >
                            {a}
                          </Button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs">
                        Headline vertical position (
                        {customization.overlayOverrides?.headline?.y ??
                          template.overlay?.headline?.y ??
                          60}
                        %)
                      </Label>
                      <Input
                        type="range"
                        min={0}
                        max={95}
                        value={
                          customization.overlayOverrides?.headline?.y ??
                          template.overlay?.headline?.y ??
                          60
                        }
                        onChange={(e) => setHeadlineY(Number(e.target.value))}
                        className="mt-1"
                      />
                    </div>
                  </>
                )}
                <p className="rounded-md bg-muted/40 p-2 text-[11px] text-muted-foreground">
                  Need finer control? Save the variant, then duplicate and tweak per channel.
                </p>
              </TabsContent>
            </Tabs>
          </ScrollArea>
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          {onSave && (
            <Button onClick={handleSave}>
              <Save className="mr-1.5 h-3.5 w-3.5" />
              Save variant
            </Button>
          )}
          <Button variant="outline" onClick={handleExportPng}>
            <Download className="mr-1.5 h-3.5 w-3.5" />
            Export PNG
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LayoutTemplateEditor;
