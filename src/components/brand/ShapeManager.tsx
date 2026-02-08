import { useState } from 'react';
import { Plus, Sparkles, Loader2, Trash2, Download, Eye, Code, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SyntaxTextarea } from '@/components/ui/syntax-textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { CustomDesignShape, BrandColor } from '@/types/brand';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Example SVG templates for users to copy and modify
const SVG_TEMPLATES = [
  {
    name: 'Basic Circle',
    description: 'Simple circle with solid fill',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
  <circle cx="50" cy="50" r="40" fill="#4F46E5"/>
</svg>`,
  },
  {
    name: 'Gradient Rectangle',
    description: 'Rounded rectangle with gradient',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 80" width="120" height="80">
  <defs>
    <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#6366F1"/>
      <stop offset="100%" stop-color="#A855F7"/>
    </linearGradient>
  </defs>
  <rect x="10" y="10" width="100" height="60" rx="12" fill="url(#grad1)"/>
</svg>`,
  },
  {
    name: 'Star Shape',
    description: '5-pointed star polygon',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
  <polygon 
    points="50,5 61,40 98,40 68,62 79,97 50,75 21,97 32,62 2,40 39,40" 
    fill="#F59E0B"
  />
</svg>`,
  },
  {
    name: 'Soft Blob',
    description: 'Organic blob shape with path',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
  <path 
    d="M50 10 C80 15, 95 35, 90 55 C85 75, 70 90, 45 88 C20 86, 8 70, 12 50 C16 30, 25 8, 50 10 Z" 
    fill="#10B981"
  />
</svg>`,
  },
  {
    name: 'Badge with Stroke',
    description: 'Hexagon with border',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
  <polygon 
    points="50,5 90,27.5 90,72.5 50,95 10,72.5 10,27.5" 
    fill="#1E293B" 
    stroke="#3B82F6" 
    stroke-width="3"
  />
</svg>`,
  },
  {
    name: 'Radial Gradient',
    description: 'Circle with radial glow',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
  <defs>
    <radialGradient id="radial1" cx="30%" cy="30%">
      <stop offset="0%" stop-color="#60A5FA"/>
      <stop offset="100%" stop-color="#1E40AF"/>
    </radialGradient>
  </defs>
  <circle cx="50" cy="50" r="40" fill="url(#radial1)"/>
</svg>`,
  },
];

// Predefined shape templates
const PRESET_SHAPES: Omit<CustomDesignShape, 'id'>[] = [
  {
    name: 'Rounded Rectangle',
    type: 'custom',
    category: 'geometric',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
      <defs><linearGradient id="rr1" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#6B8DD6"/><stop offset="100%" stop-color="#8E7DBE"/></linearGradient></defs>
      <path d="M8 10 Q10 10, 10 10 L90 10 Q90 10, 90 12 L90 70 Q90 90, 70 90 L30 90 Q10 90, 10 70 L10 30 Q10 10, 30 10 Z" fill="url(#rr1)"/>
    </svg>`,
  },
  {
    name: 'Layered Rectangle',
    type: 'custom',
    category: 'layered',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 90" width="120" height="90">
      <defs>
        <linearGradient id="lr1" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#4F46E5"/><stop offset="100%" stop-color="#7C3AED"/></linearGradient>
        <linearGradient id="lr2" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#4F46E5" stop-opacity="0.6"/><stop offset="100%" stop-color="#7C3AED" stop-opacity="0.6"/></linearGradient>
        <linearGradient id="lr3" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#4F46E5" stop-opacity="0.3"/><stop offset="100%" stop-color="#7C3AED" stop-opacity="0.3"/></linearGradient>
      </defs>
      <rect x="10" y="15" width="100" height="65" rx="20" ry="20" fill="url(#lr1)"/>
      <rect x="15" y="12" width="92" height="58" rx="16" ry="16" fill="url(#lr2)"/>
      <rect x="22" y="8" width="82" height="48" rx="12" ry="12" fill="url(#lr3)"/>
    </svg>`,
  },
  {
    name: 'Soft Circle',
    type: 'custom',
    category: 'organic',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
      <defs><radialGradient id="sc1" cx="30%" cy="30%"><stop offset="0%" stop-color="#60A5FA"/><stop offset="100%" stop-color="#3B82F6"/></radialGradient></defs>
      <circle cx="50" cy="50" r="40" fill="url(#sc1)"/>
    </svg>`,
  },
  {
    name: 'Hexagon',
    type: 'custom',
    category: 'geometric',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
      <defs><linearGradient id="hex1" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#10B981"/><stop offset="100%" stop-color="#059669"/></linearGradient></defs>
      <polygon points="50,5 90,27.5 90,72.5 50,95 10,72.5 10,27.5" fill="url(#hex1)"/>
    </svg>`,
  },
  {
    name: 'Pill Shape',
    type: 'custom',
    category: 'minimal',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 150 60" width="150" height="60">
      <defs><linearGradient id="pill1" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color="#F472B6"/><stop offset="100%" stop-color="#EC4899"/></linearGradient></defs>
      <rect x="5" y="5" width="140" height="50" rx="25" ry="25" fill="url(#pill1)"/>
    </svg>`,
  },
  {
    name: 'Abstract Wave',
    type: 'custom',
    category: 'abstract',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 80" width="200" height="80">
      <defs><linearGradient id="wave1" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color="#8B5CF6"/><stop offset="50%" stop-color="#A78BFA"/><stop offset="100%" stop-color="#C4B5FD"/></linearGradient></defs>
      <path d="M0 40 Q25 20, 50 40 T100 40 T150 40 T200 40 L200 80 L0 80 Z" fill="url(#wave1)" opacity="0.8"/>
      <path d="M0 50 Q25 30, 50 50 T100 50 T150 50 T200 50 L200 80 L0 80 Z" fill="url(#wave1)" opacity="0.5"/>
    </svg>`,
  },
  {
    name: 'Diamond',
    type: 'custom',
    category: 'geometric',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
      <defs><linearGradient id="dia1" x1="50%" y1="0%" x2="50%" y2="100%"><stop offset="0%" stop-color="#FBBF24"/><stop offset="100%" stop-color="#F59E0B"/></linearGradient></defs>
      <polygon points="50,5 95,50 50,95 5,50" fill="url(#dia1)"/>
    </svg>`,
  },
  {
    name: 'Blob',
    type: 'custom',
    category: 'organic',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
      <defs><radialGradient id="blob1" cx="40%" cy="40%"><stop offset="0%" stop-color="#34D399"/><stop offset="100%" stop-color="#10B981"/></radialGradient></defs>
      <path d="M50 10 C80 15, 95 35, 90 55 C85 75, 70 90, 45 88 C20 86, 8 70, 12 50 C16 30, 25 8, 50 10 Z" fill="url(#blob1)"/>
    </svg>`,
  },
];

const STYLE_OPTIONS = [
  { value: 'geometric', label: 'Geometric', description: 'Sharp, precise shapes' },
  { value: 'organic', label: 'Organic', description: 'Flowing, natural forms' },
  { value: 'minimal', label: 'Minimal', description: 'Simple, clean designs' },
  { value: 'layered', label: 'Layered', description: 'Depth with overlays' },
  { value: 'abstract', label: 'Abstract', description: 'Creative, artistic' },
];

// Template card component for example SVGs
const TemplateCard = ({ 
  template, 
  onUse 
}: { 
  template: typeof SVG_TEMPLATES[0]; 
  onUse: (svg: string) => void;
}) => {
  const [copied, setCopied] = useState(false);
  
  const handleClick = () => {
    onUse(template.svg);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={handleClick}
          className="group relative aspect-square bg-muted/30 rounded-lg border border-border hover:border-primary/50 transition-all overflow-hidden p-2"
        >
          <div 
            className="w-full h-full flex items-center justify-center [&>svg]:max-w-full [&>svg]:max-h-full"
            dangerouslySetInnerHTML={{ __html: template.svg }}
          />
          <div className="absolute inset-0 bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            {copied ? (
              <Check className="h-4 w-4 text-primary" />
            ) : (
              <Copy className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
        </button>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="max-w-[200px]">
        <p className="font-medium">{template.name}</p>
        <p className="text-xs text-muted-foreground">{template.description}</p>
      </TooltipContent>
    </Tooltip>
  );
};

interface ShapeManagerProps {
  shapes: CustomDesignShape[];
  onShapesChange: (shapes: CustomDesignShape[]) => void;
  brandColors: BrandColor[];
  brandName?: string;
}

export const ShapeManager = ({ shapes, onShapesChange, brandColors, brandName }: ShapeManagerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'presets' | 'generate' | 'manual'>('presets');
  const [isGenerating, setIsGenerating] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState<string>('geometric');
  const [previewShape, setPreviewShape] = useState<CustomDesignShape | null>(null);
  
  // Manual SVG state
  const [manualName, setManualName] = useState('');
  const [manualSvg, setManualSvg] = useState('');
  const [manualCategory, setManualCategory] = useState<string>('custom');
  const [svgPreviewError, setSvgPreviewError] = useState<string | null>(null);

  const addPresetShape = (preset: Omit<CustomDesignShape, 'id'>) => {
    const newShape: CustomDesignShape = {
      ...preset,
      id: crypto.randomUUID(),
    };
    onShapesChange([...shapes, newShape]);
    toast.success(`Added "${preset.name}" to your shapes`);
  };

  const generateAIShape = async () => {
    if (!prompt.trim()) {
      toast.error('Please enter a description for the shape');
      return;
    }

    setIsGenerating(true);
    toast.info('Generating custom shape with AI...');

    try {
      const { data, error } = await supabase.functions.invoke('generate-shape', {
        body: {
          prompt: prompt.trim(),
          brandColors: brandColors.map(c => ({ hex: c.hex, name: c.name })),
          style,
        },
      });

      if (error) throw error;

      if (data?.svg) {
        const newShape: CustomDesignShape = {
          id: crypto.randomUUID(),
          name: prompt.trim().slice(0, 30),
          type: 'custom',
          category: style,
          svg: data.svg,
          aiGenerated: true,
        };
        onShapesChange([...shapes, newShape]);
        setPrompt('');
        toast.success('AI shape generated and added!');
      } else {
        throw new Error('No SVG returned');
      }
    } catch (error) {
      console.error('Shape generation error:', error);
      toast.error('Failed to generate shape. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const deleteShape = (id: string) => {
    onShapesChange(shapes.filter(s => s.id !== id));
    toast.success('Shape removed');
  };

  const downloadSVG = (shape: CustomDesignShape) => {
    const blob = new Blob([shape.svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${shape.name.toLowerCase().replace(/\s+/g, '-')}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('SVG downloaded');
  };

  const isPresetAdded = (preset: Omit<CustomDesignShape, 'id'>) => {
    return shapes.some(s => s.name === preset.name);
  };

  const validateSvg = (svg: string): boolean => {
    if (!svg.trim()) {
      setSvgPreviewError('Please enter SVG code');
      return false;
    }
    
    // Basic SVG validation
    const trimmed = svg.trim();
    if (!trimmed.startsWith('<svg') || !trimmed.includes('</svg>')) {
      setSvgPreviewError('Invalid SVG: must start with <svg and end with </svg>');
      return false;
    }
    
    // Check for potentially dangerous content
    if (trimmed.includes('<script') || trimmed.includes('javascript:') || trimmed.includes('onerror')) {
      setSvgPreviewError('SVG contains potentially unsafe content');
      return false;
    }
    
    setSvgPreviewError(null);
    return true;
  };

  const addManualShape = () => {
    if (!manualName.trim()) {
      toast.error('Please enter a name for your shape');
      return;
    }
    
    if (!validateSvg(manualSvg)) {
      toast.error(svgPreviewError || 'Invalid SVG');
      return;
    }

    const newShape: CustomDesignShape = {
      id: crypto.randomUUID(),
      name: manualName.trim(),
      type: 'custom',
      category: manualCategory,
      svg: manualSvg.trim(),
    };
    
    onShapesChange([...shapes, newShape]);
    setManualName('');
    setManualSvg('');
    setManualCategory('custom');
    setSvgPreviewError(null);
    toast.success(`Added "${newShape.name}" to your shapes`);
  };

  // Live preview validation
  const handleSvgChange = (value: string) => {
    setManualSvg(value);
    if (value.trim()) {
      validateSvg(value);
    } else {
      setSvgPreviewError(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          Manage Shapes
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Design Shape Manager</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'presets' | 'generate' | 'manual')} className="flex-1 flex flex-col min-h-0">
          <TabsList className="grid grid-cols-3 w-full max-w-md">
            <TabsTrigger value="presets">Presets</TabsTrigger>
            <TabsTrigger value="manual" className="gap-1.5">
              <Code className="h-3.5 w-3.5" />
              Manual SVG
            </TabsTrigger>
            <TabsTrigger value="generate" className="gap-1.5">
              <Sparkles className="h-3.5 w-3.5" />
              AI Generate
            </TabsTrigger>
          </TabsList>

          <TabsContent value="presets" className="flex-1 min-h-0 overflow-auto mt-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {PRESET_SHAPES.map((preset, index) => {
                const added = isPresetAdded(preset);
                return (
                  <Card 
                    key={index} 
                    className={`group cursor-pointer transition-all ${added ? 'border-primary/50 bg-primary/5' : 'hover:border-primary/30'}`}
                    onClick={() => !added && addPresetShape(preset)}
                  >
                    <CardContent className="p-3">
                      <div 
                        className="aspect-square flex items-center justify-center bg-muted/30 rounded-lg mb-2 overflow-hidden"
                        dangerouslySetInnerHTML={{ __html: preset.svg }}
                      />
                      <div className="flex items-center justify-between gap-1">
                        <div className="min-w-0">
                          <p className="text-xs font-medium truncate">{preset.name}</p>
                          <Badge variant="secondary" className="text-[10px] mt-0.5">
                            {preset.category}
                          </Badge>
                        </div>
                        {added && (
                          <Badge variant="outline" className="text-[10px] shrink-0">Added</Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="manual" className="flex-1 min-h-0 overflow-auto mt-4 space-y-4">
            <div className="space-y-4">
              {/* Example Templates */}
              <div className="space-y-2">
                <Label className="text-muted-foreground">Example Templates</Label>
                <p className="text-xs text-muted-foreground">Click to copy to editor, then customize</p>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {SVG_TEMPLATES.map((template, index) => (
                    <TemplateCard 
                      key={index} 
                      template={template} 
                      onUse={(svg) => {
                        handleSvgChange(svg);
                        toast.success('Template copied to editor');
                      }}
                    />
                  ))}
                </div>
              </div>

              <div className="border-t border-border pt-4 space-y-4">
                <div className="space-y-2">
                  <Label>Shape Name</Label>
                  <Input
                    placeholder="e.g., Custom Badge, Brand Frame"
                    value={manualName}
                    onChange={(e) => setManualName(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={manualCategory} onValueChange={setManualCategory}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STYLE_OPTIONS.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>SVG Code</Label>
                  <SyntaxTextarea
                    placeholder='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">...</svg>'
                    value={manualSvg}
                    onChange={handleSvgChange}
                    className="min-h-[140px]"
                  />
                  {svgPreviewError && (
                    <p className="text-xs text-destructive">{svgPreviewError}</p>
                  )}
                </div>

                {/* Live Preview */}
                {manualSvg.trim() && !svgPreviewError && (
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Preview</Label>
                    <div 
                      className="aspect-square max-h-[150px] flex items-center justify-center bg-muted/30 rounded-lg p-4 border border-border"
                      dangerouslySetInnerHTML={{ __html: manualSvg }}
                    />
                  </div>
                )}

                <Button 
                  onClick={addManualShape} 
                  disabled={!manualName.trim() || !manualSvg.trim() || !!svgPreviewError}
                  className="w-full gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add Shape
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="generate" className="flex-1 min-h-0 overflow-auto mt-4 space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Describe your shape</Label>
                <Input
                  placeholder="e.g., A rounded rectangle with soft corners and a gradient glow"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  disabled={isGenerating}
                />
              </div>

              <div className="space-y-2">
                <Label>Style</Label>
                <Select value={style} onValueChange={setStyle} disabled={isGenerating}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STYLE_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>
                        <div className="flex flex-col">
                          <span>{opt.label}</span>
                          <span className="text-xs text-muted-foreground">{opt.description}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {brandColors.length > 0 && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>Using brand colors:</span>
                  <div className="flex gap-1">
                    {brandColors.slice(0, 5).map((c, i) => (
                      <div 
                        key={i} 
                        className="w-5 h-5 rounded-full border border-border" 
                        style={{ backgroundColor: c.hex }}
                        title={c.name}
                      />
                    ))}
                    {brandColors.length > 5 && (
                      <span className="text-xs">+{brandColors.length - 5}</span>
                    )}
                  </div>
                </div>
              )}

              <Button 
                onClick={generateAIShape} 
                disabled={isGenerating || !prompt.trim()}
                className="w-full gap-2"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Generate Shape
                  </>
                )}
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        {/* Current Shapes */}
        {shapes.length > 0 && (
          <div className="border-t pt-4 mt-4">
            <h4 className="text-sm font-medium mb-3">Your Custom Shapes ({shapes.length})</h4>
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
              {shapes.map(shape => (
                <div 
                  key={shape.id} 
                  className="group relative bg-muted/30 rounded-lg p-2 border border-border hover:border-primary/30 transition-all"
                >
                  <div 
                    className="aspect-square flex items-center justify-center overflow-hidden"
                    dangerouslySetInnerHTML={{ __html: shape.svg }}
                  />
                  <p className="text-[10px] text-center mt-1 truncate">{shape.name}</p>
                  
                  {/* Actions overlay */}
                  <div className="absolute inset-0 bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1 rounded-lg">
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      className="h-7 w-7"
                      onClick={() => setPreviewShape(shape)}
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </Button>
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      className="h-7 w-7"
                      onClick={() => downloadSVG(shape)}
                    >
                      <Download className="h-3.5 w-3.5" />
                    </Button>
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      className="h-7 w-7 text-destructive"
                      onClick={() => deleteShape(shape.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  
                  {shape.aiGenerated && (
                    <Badge variant="secondary" className="absolute top-1 right-1 text-[8px] px-1 py-0">
                      AI
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </DialogContent>

      {/* Preview Modal */}
      <Dialog open={!!previewShape} onOpenChange={(open) => !open && setPreviewShape(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{previewShape?.name}</DialogTitle>
          </DialogHeader>
          {previewShape && (
            <div className="space-y-4">
              <div 
                className="aspect-square max-h-[300px] flex items-center justify-center bg-muted/30 rounded-xl p-8 border border-border"
                dangerouslySetInnerHTML={{ __html: previewShape.svg }}
              />
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  className="flex-1 gap-2"
                  onClick={() => previewShape && downloadSVG(previewShape)}
                >
                  <Download className="h-4 w-4" />
                  Download SVG
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Dialog>
  );
};
