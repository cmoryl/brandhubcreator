/**
 * BrandPhotographyGenerator
 *
 * Focused dialog inside the Imagery Hub for generating AI photography that
 * follows the brand's locked photography rules (humanRealistic, softTransition,
 * documentaryPortrait, environmentalCandid, goldenHourIntimate). Generated
 * images are saved directly into a chosen Imagery Hub section.
 */
import { useMemo, useState } from 'react';
import { Sparkles, Loader2, Camera, Plus, Library, Check } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ApprovedImage, ApprovedImagerySubSection } from '@/types/brand';
import { ImageryEntity } from '@/hooks/useImageryHubEntities';
import { StylePreset } from '@/types/creativeStudio';
import { getStartersForBrand, type PhotographyStarter } from '@/lib/brandPhotographyStarters';
import { cn } from '@/lib/utils';

const BRAND_PHOTO_PRESETS: { key: StylePreset; label: string; description: string }[] = [
  { key: 'humanRealistic', label: 'Hyper-Realistic Human', description: 'Soft light, shallow DoF, authentic moments — the canonical brand photography style' },
  { key: 'softTransition', label: 'Soft Transition', description: 'Photo dissolving into a progressive blur of brand-color gradient' },
  { key: 'documentaryPortrait', label: 'Documentary Portrait', description: '85mm f/2.0 single-subject close-up, available window light, Portra 400 grade' },
  { key: 'environmentalCandid', label: 'Environmental Candid', description: '35mm f/2.8 wider scene, mid-action, layered foreground' },
  { key: 'goldenHourIntimate', label: 'Golden Hour Intimate', description: '50mm f/1.8 warm amber rim light, contemplative single moment' },
];

const ASPECT_RATIOS: { key: '1:1' | '16:9' | '4:3' | '9:16'; label: string; dims: string }[] = [
  { key: '16:9', label: 'Landscape (hero)', dims: '1920×1080' },
  { key: '4:3', label: 'Standard', dims: '1600×1200' },
  { key: '1:1', label: 'Square', dims: '1024×1024' },
  { key: '9:16', label: 'Portrait (mobile)', dims: '1080×1920' },
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entity: ImageryEntity;
  sections: ApprovedImagerySubSection[];
  onAddImages: (sectionId: string, images: ApprovedImage[]) => Promise<void>;
  onAddSection: (name: string) => Promise<string | undefined>;
}

export const BrandPhotographyGenerator = ({
  open, onOpenChange, entity, sections, onAddImages, onAddSection,
}: Props) => {
  const [prompt, setPrompt] = useState('');
  const [stylePreset, setStylePreset] = useState<StylePreset>('humanRealistic');
  const [aspectRatio, setAspectRatio] = useState<'1:1' | '16:9' | '4:3' | '9:16'>('16:9');
  const [targetSectionId, setTargetSectionId] = useState<string>(sections[0]?.id ?? '__new__');
  const [newSectionName, setNewSectionName] = useState('AI Photography');
  const [generating, setGenerating] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const presetMeta = BRAND_PHOTO_PRESETS.find(p => p.key === stylePreset)!;
  const isNewSection = targetSectionId === '__new__';

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error('Describe what you want to photograph');
      return;
    }
    setGenerating(true);
    setPreviewUrl(null);
    try {
      const { data, error } = await supabase.functions.invoke('generate-creative-asset', {
        body: {
          prompt: prompt.trim(),
          entityId: entity.id,
          entityType: entity.type,
          category: 'photography',
          aspectRatio,
          stylePreset,
          applyBrandContext: true,
          saveToHistory: true,
        },
      });
      if (error) throw error;
      if (!data?.imageUrl) throw new Error('No image returned');
      setPreviewUrl(data.imageUrl);
      toast.success('Image generated — review and save to a section');
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Generation failed';
      toast.error(msg);
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!previewUrl) return;
    let sectionId = targetSectionId;
    if (isNewSection) {
      const name = newSectionName.trim() || 'AI Photography';
      const created = await onAddSection(name);
      if (!created) {
        toast.error('Could not create section');
        return;
      }
      sectionId = created;
    }
    const newImage: ApprovedImage = {
      id: `ai-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      url: previewUrl,
      thumbnailUrl: previewUrl,
      title: prompt.trim().slice(0, 80),
      source: 'ai-generated',
      category: presetMeta.label,
      approvedAt: new Date().toISOString(),
      tags: ['ai-generated', 'brand-photography', stylePreset],
    };
    await onAddImages(sectionId, [newImage]);
    toast.success('Saved to imagery library');
    setPreviewUrl(null);
    setPrompt('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Generate Brand Photography
          </DialogTitle>
          <DialogDescription>
            AI imagery for <span className="font-medium text-foreground">{entity.name}</span> —
            locked to your approved photography rules (soft light, shallow DoF, authentic human
            moments). Includes thumbs-down feedback on past rejections automatically.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          <div className="space-y-2">
            <Label>What do you want to photograph?</Label>
            <Textarea
              placeholder="e.g. Two colleagues reviewing a translated document at a sunlit desk; one is mid-sentence, the other listening intently"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              Describe the moment, not the style — the brand photography preset handles lens,
              lighting, color, and composition for you.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Photography Style</Label>
              <Select value={stylePreset} onValueChange={(v) => setStylePreset(v as StylePreset)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-[400px]">
                  <SelectGroup>
                    <SelectLabel className="text-xs uppercase tracking-wider text-muted-foreground">
                      Brand-Locked Presets
                    </SelectLabel>
                    {BRAND_PHOTO_PRESETS.map(p => (
                      <SelectItem key={p.key} value={p.key}>
                        <div className="flex flex-col">
                          <span className="font-medium">{p.label}</span>
                          <span className="text-xs text-muted-foreground">{p.description}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Aspect Ratio</Label>
              <Select value={aspectRatio} onValueChange={(v) => setAspectRatio(v as typeof aspectRatio)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ASPECT_RATIOS.map(r => (
                    <SelectItem key={r.key} value={r.key}>
                      {r.label} <span className="text-muted-foreground ml-1">({r.dims})</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
            <div className="flex items-start gap-2">
              <Sparkles className="h-3.5 w-3.5 mt-0.5 shrink-0 text-primary" />
              <div>
                <span className="font-medium text-foreground">{presetMeta.label}:</span>{' '}
                {presetMeta.description}. The brand color palette, archetype, and any thumbs-down
                rejections are added to the prompt automatically.
              </div>
            </div>
          </div>

          {previewUrl ? (
            <div className="space-y-3">
              <div className="rounded-lg overflow-hidden border border-border bg-muted">
                <img src={previewUrl} alt="Generated preview" className="w-full h-auto" />
              </div>
              <div className="space-y-2">
                <Label>Save to section</Label>
                <Select value={targetSectionId} onValueChange={setTargetSectionId}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {sections.map(s => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                    <SelectItem value="__new__">
                      <span className="flex items-center gap-2">
                        <Plus className="h-3.5 w-3.5" /> New section…
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
                {isNewSection && (
                  <input
                    type="text"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    placeholder="Section name"
                    value={newSectionName}
                    onChange={(e) => setNewSectionName(e.target.value)}
                  />
                )}
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-border bg-muted/20 p-8 text-center text-sm text-muted-foreground">
              Generated preview will appear here.
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Badge variant="outline" className="mr-auto text-[10px]">
            Brand rules applied
          </Badge>
          {previewUrl && (
            <>
              <Button variant="outline" onClick={() => setPreviewUrl(null)} disabled={generating}>
                Discard
              </Button>
              <Button variant="outline" onClick={handleGenerate} disabled={generating}>
                {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Regenerate'}
              </Button>
              <Button onClick={handleSave} disabled={generating}>
                Save to Library
              </Button>
            </>
          )}
          {!previewUrl && (
            <Button onClick={handleGenerate} disabled={generating || !prompt.trim()} className="gap-2">
              {generating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Generating…
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" /> Generate
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
