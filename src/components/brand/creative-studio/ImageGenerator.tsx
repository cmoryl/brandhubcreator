/**
 * Image Generator Component
 * AI-powered image generation with brand context
 */

import { useState } from 'react';
import { Wand2, Sparkles, Settings2, Save, Loader2, Download, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { toast } from 'sonner';
import type { 
  BrandPrompt, 
  AspectRatio, 
  StylePreset, 
  PromptCategory,
  ASPECT_RATIOS,
  STYLE_PRESETS,
  PROMPT_CATEGORIES
} from '@/types/creativeStudio';

interface ImageGeneratorProps {
  entityName: string;
  guideData: Record<string, unknown>;
  prompts: BrandPrompt[];
  isGenerating: boolean;
  onGenerate: (options: {
    prompt: string;
    category?: PromptCategory;
    aspectRatio?: AspectRatio;
    stylePreset?: StylePreset;
    applyBrandContext?: boolean;
    saveToHistory?: boolean;
    promptId?: string;
  }) => Promise<{ imageUrl: string; promptUsed: string } | null>;
  onSavePrompt: (prompt: Omit<BrandPrompt, 'id' | 'entity_id' | 'entity_type' | 'organization_id' | 'created_by' | 'created_at' | 'updated_at' | 'use_count' | 'last_used_at'>) => Promise<BrandPrompt | null>;
}

const ASPECT_RATIO_OPTIONS: Record<AspectRatio, { label: string; dimensions: string }> = {
  '1:1': { label: 'Square', dimensions: '1024×1024' },
  '16:9': { label: 'Landscape', dimensions: '1920×1080' },
  '4:3': { label: 'Standard', dimensions: '1600×1200' },
  '9:16': { label: 'Portrait', dimensions: '1080×1920' },
  'custom': { label: 'Custom', dimensions: 'Variable' }
};

const STYLE_PRESET_OPTIONS: Record<StylePreset, { label: string; description: string }> = {
  'photorealistic': { label: 'Photorealistic', description: 'High-quality photography' },
  'humanRealistic': { label: 'Hyper-Realistic Human', description: 'Soft light, shallow DoF, authentic moments' },
  'softTransition': { label: 'Soft Transition', description: 'Photo merged with progressive brand-color blur' },
  'illustration': { label: 'Illustration', description: 'Digital art style' },
  'minimal': { label: 'Minimal', description: 'Clean and simple' },
  'bold': { label: 'Bold', description: 'Strong contrasts' },
  '3d': { label: '3D Render', description: 'CGI quality' },
  'abstract': { label: 'Abstract', description: 'Artistic expression' }
};

const CATEGORY_OPTIONS: Record<PromptCategory, string> = {
  'general': 'General',
  'social': 'Social Media',
  'marketing': 'Marketing',
  'product': 'Product',
  'event': 'Event',
  'pattern': 'Pattern',
  'photography': 'Photography',
  'hero': 'Hero',
  'icon': 'Icon'
};

export const ImageGenerator = ({
  entityName,
  guideData,
  prompts,
  isGenerating,
  onGenerate,
  onSavePrompt
}: ImageGeneratorProps) => {
  const [prompt, setPrompt] = useState('');
  const [selectedPromptId, setSelectedPromptId] = useState<string | null>(null);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1');
  const [stylePreset, setStylePreset] = useState<StylePreset>('photorealistic');
  const [category, setCategory] = useState<PromptCategory>('general');
  const [applyBrandContext, setApplyBrandContext] = useState(true);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [promptUsed, setPromptUsed] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Get brand colors for preview
  const brandColors = (guideData.colors as Array<{ hex: string; name: string }>) || [];

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error('Please enter a prompt');
      return;
    }

    // Replace {{brand_name}} placeholder
    const processedPrompt = prompt.replace(/\{\{brand_name\}\}/g, entityName);

    const result = await onGenerate({
      prompt: processedPrompt,
      category,
      aspectRatio,
      stylePreset,
      applyBrandContext,
      saveToHistory: true,
      promptId: selectedPromptId || undefined
    });

    if (result) {
      setGeneratedImage(result.imageUrl);
      setPromptUsed(result.promptUsed);
    }
  };

  const handleUsePrompt = (savedPrompt: BrandPrompt) => {
    setPrompt(savedPrompt.prompt_template);
    setCategory(savedPrompt.category);
    setAspectRatio(savedPrompt.aspect_ratio);
    if (savedPrompt.style_preset) {
      setStylePreset(savedPrompt.style_preset);
    }
    setSelectedPromptId(savedPrompt.id);
  };

  const handleSaveAsPrompt = async () => {
    if (!prompt.trim()) {
      toast.error('Please enter a prompt first');
      return;
    }

    await onSavePrompt({
      name: prompt.slice(0, 50) + (prompt.length > 50 ? '...' : ''),
      category,
      prompt_template: prompt,
      description: null,
      output_format: 'image',
      aspect_ratio: aspectRatio,
      style_preset: stylePreset,
      is_default: false,
      is_shared: false
    });
  };

  const copyPrompt = async () => {
    if (promptUsed) {
      await navigator.clipboard.writeText(promptUsed);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success('Prompt copied to clipboard');
    }
  };

  const downloadImage = () => {
    if (generatedImage) {
      const link = document.createElement('a');
      link.href = generatedImage;
      link.download = `${entityName.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="space-y-6">
      {/* Quick prompts from library */}
      {prompts.length > 0 && (
        <div className="space-y-2">
          <Label className="text-sm text-muted-foreground">Quick Start from Library</Label>
          <div className="flex flex-wrap gap-2">
            {prompts.slice(0, 5).map((p) => (
              <Button
                key={p.id}
                variant="outline"
                size="sm"
                onClick={() => handleUsePrompt(p)}
                className="gap-1.5"
              >
                {p.name}
                {p.use_count > 0 && (
                  <Badge variant="secondary" className="h-4 px-1 text-[10px]">
                    {p.use_count}
                  </Badge>
                )}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Main prompt input */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label htmlFor="prompt">Describe what you want to create</Label>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSaveAsPrompt}
            disabled={!prompt.trim()}
            className="h-7 gap-1.5 text-xs"
          >
            <Save className="h-3 w-3" />
            Save to Library
          </Button>
        </div>
        <Textarea
          id="prompt"
          value={prompt}
          onChange={(e) => {
            setPrompt(e.target.value);
            setSelectedPromptId(null);
          }}
          placeholder={`Create a professional hero image for ${entityName}. Modern, premium quality, reflecting brand identity...`}
          className="min-h-[120px] resize-none"
        />
        <p className="text-xs text-muted-foreground">
          Use <code className="bg-muted px-1 rounded">{'{{brand_name}}'}</code> to insert the brand name dynamically
        </p>
      </div>

      {/* Settings row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="space-y-2">
          <Label>Aspect Ratio</Label>
          <Select value={aspectRatio} onValueChange={(v) => setAspectRatio(v as AspectRatio)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.entries(ASPECT_RATIO_OPTIONS) as [AspectRatio, { label: string; dimensions: string }][])
                .filter(([key]) => key !== 'custom')
                .map(([key, { label, dimensions }]) => (
                  <SelectItem key={key} value={key}>
                    {label} ({dimensions})
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Style</Label>
          <Select value={stylePreset} onValueChange={(v) => setStylePreset(v as StylePreset)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.entries(STYLE_PRESET_OPTIONS) as [StylePreset, { label: string }][]).map(([key, { label }]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Category</Label>
          <Select value={category} onValueChange={(v) => setCategory(v as PromptCategory)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.entries(CATEGORY_OPTIONS) as [PromptCategory, string][]).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Brand Context</Label>
          <div className="flex items-center gap-2 h-10">
            <Switch
              checked={applyBrandContext}
              onCheckedChange={setApplyBrandContext}
            />
            <span className="text-sm text-muted-foreground">
              {applyBrandContext ? 'Applied' : 'Off'}
            </span>
          </div>
        </div>
      </div>

      {/* Brand context preview */}
      {applyBrandContext && brandColors.length > 0 && (
        <Card className="p-3 bg-muted/50">
          <div className="flex items-center gap-3">
            <div className="flex -space-x-1">
              {brandColors.slice(0, 5).map((color, i) => (
                <div
                  key={i}
                  className="w-6 h-6 rounded-full border-2 border-background"
                  style={{ backgroundColor: color.hex }}
                  title={color.name}
                />
              ))}
            </div>
            <span className="text-sm text-muted-foreground">
              Brand colors and guidelines will be applied
            </span>
          </div>
        </Card>
      )}

      {/* Generate button */}
      <Button
        onClick={handleGenerate}
        disabled={isGenerating || !prompt.trim()}
        className="w-full gap-2"
        size="lg"
      >
        {isGenerating ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <Wand2 className="h-4 w-4" />
            Generate Image
          </>
        )}
      </Button>

      {/* Generated image preview */}
      {generatedImage && (
        <Card className="overflow-hidden">
          <div className="relative aspect-square md:aspect-video bg-muted">
            <img
              src={generatedImage}
              alt="Generated"
              className="w-full h-full object-contain"
            />
          </div>
          <div className="p-4 flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={downloadImage} className="gap-2">
              <Download className="h-4 w-4" />
              Download
            </Button>
            <Button variant="outline" size="sm" onClick={copyPrompt} className="gap-2">
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              Copy Prompt
            </Button>
          </div>
          
          {/* Show prompt used */}
          <Collapsible>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="w-full justify-start gap-2 rounded-none border-t">
                <Settings2 className="h-4 w-4" />
                View Full Prompt
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="p-4 pt-0">
              <pre className="text-xs bg-muted p-3 rounded-md overflow-x-auto whitespace-pre-wrap">
                {promptUsed}
              </pre>
            </CollapsibleContent>
          </Collapsible>
        </Card>
      )}
    </div>
  );
};
