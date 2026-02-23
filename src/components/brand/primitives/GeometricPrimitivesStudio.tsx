/**
 * GeometricPrimitivesStudio - Full-featured studio for geometric primitive creation & management
 * 
 * Wizard steps:
 * 1. Library - Browse & add from curated shape library
 * 2. Create - Manual SVG entry + templates
 * 3. Generate - AI-powered shape generation
 * 4. Colorize - Apply brand colors & preview variants
 * 5. Export - Batch download SVG/PNG
 */

import { useState, useMemo, useCallback } from 'react';
import DOMPurify from 'dompurify';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SyntaxTextarea } from '@/components/ui/syntax-textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Library,
  Code,
  Sparkles,
  Palette,
  Package,
  ChevronLeft,
  ChevronRight,
  Search,
  Plus,
  Check,
  Download,
  Trash2,
  Eye,
  Loader2,
  Wand2,
  Copy,
  X,
  Filter,
} from 'lucide-react';
import { toast } from 'sonner';
import { CustomDesignShape, BrandColor } from '@/types/brand';
import { supabase } from '@/integrations/supabase/client';
import { SHAPE_LIBRARY, SHAPE_INDUSTRIES, SHAPE_CATEGORIES, type LibraryShape } from '@/data/shapeLibrary';
import { getGeneratedShapes } from '@/data/shapeGenerator';

// SVG sanitization config
const SVG_SANITIZE_CONFIG = {
  USE_PROFILES: { svg: true, svgFilters: true },
  FORBID_TAGS: ['script', 'foreignObject'],
  FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur'],
};

const sanitizeSvg = (svg: string): string => DOMPurify.sanitize(svg, SVG_SANITIZE_CONFIG);

// SVG templates for manual tab
const SVG_TEMPLATES = [
  { name: 'Circle', svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><circle cx="50" cy="50" r="40" fill="#4F46E5"/></svg>` },
  { name: 'Rectangle', svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 80" width="120" height="80"><defs><linearGradient id="rg1" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#6366F1"/><stop offset="100%" stop-color="#A855F7"/></linearGradient></defs><rect x="10" y="10" width="100" height="60" rx="12" fill="url(#rg1)"/></svg>` },
  { name: 'Star', svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><polygon points="50,5 61,40 98,40 68,62 79,97 50,75 21,97 32,62 2,40 39,40" fill="#F59E0B"/></svg>` },
  { name: 'Blob', svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><path d="M50 10 C80 15, 95 35, 90 55 C85 75, 70 90, 45 88 C20 86, 8 70, 12 50 C16 30, 25 8, 50 10 Z" fill="#10B981"/></svg>` },
  { name: 'Hexagon', svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><polygon points="50,5 90,27.5 90,72.5 50,95 10,72.5 10,27.5" fill="#1E293B" stroke="#3B82F6" stroke-width="3"/></svg>` },
  { name: 'Radial', svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><defs><radialGradient id="rg2" cx="30%" cy="30%"><stop offset="0%" stop-color="#60A5FA"/><stop offset="100%" stop-color="#1E40AF"/></radialGradient></defs><circle cx="50" cy="50" r="40" fill="url(#rg2)"/></svg>` },
];

const STYLE_OPTIONS = [
  { value: 'geometric', label: 'Geometric' },
  { value: 'organic', label: 'Organic' },
  { value: 'minimal', label: 'Minimal' },
  { value: 'layered', label: 'Layered' },
  { value: 'abstract', label: 'Abstract' },
];

type StudioStep = 'library' | 'create' | 'generate' | 'colorize' | 'export';

interface StudioStepDef {
  id: StudioStep;
  label: string;
  icon: typeof Library;
  description: string;
}

const STEPS: StudioStepDef[] = [
  { id: 'library', label: 'Library', icon: Library, description: 'Browse shape library' },
  { id: 'create', label: 'Create', icon: Code, description: 'Manual SVG entry' },
  { id: 'generate', label: 'Generate', icon: Wand2, description: 'AI shape generation' },
  { id: 'colorize', label: 'Colorize', icon: Palette, description: 'Apply brand colors' },
  { id: 'export', label: 'Export', icon: Package, description: 'Download shapes' },
];

interface GeometricPrimitivesStudioProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shapes: CustomDesignShape[];
  onShapesChange: (shapes: CustomDesignShape[]) => void;
  brandColors: BrandColor[];
  brandName?: string;
}

// Helper to adjust color brightness
const adjustBrightness = (hex: string, percent: number): string => {
  const num = parseInt(hex.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.min(255, Math.max(0, (num >> 16) + amt));
  const G = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + amt));
  const B = Math.min(255, Math.max(0, (num & 0x0000FF) + amt));
  return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
};

// Apply a color to an SVG by replacing fill colors
const applyColorToSvg = (svg: string, color: string): string => {
  return svg.replace(/fill="(?!none|url)(#[0-9a-fA-F]{3,8}|[a-z]+)"/g, `fill="${color}"`);
};

export const GeometricPrimitivesStudio = ({
  open,
  onOpenChange,
  shapes,
  onShapesChange,
  brandColors,
  brandName,
}: GeometricPrimitivesStudioProps) => {
  const [currentStep, setCurrentStep] = useState<StudioStep>('library');
  const [completedSteps, setCompletedSteps] = useState<Set<StudioStep>>(new Set());

  // Library state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Create state
  const [manualName, setManualName] = useState('');
  const [manualSvg, setManualSvg] = useState('');
  const [manualCategory, setManualCategory] = useState('custom');
  const [svgPreviewError, setSvgPreviewError] = useState<string | null>(null);

  // Generate state
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState('geometric');
  const [isGenerating, setIsGenerating] = useState(false);

  // Colorize state
  const [selectedShapeId, setSelectedShapeId] = useState<string | null>(null);
  const [editFill, setEditFill] = useState('#6366F1');
  const [editStroke, setEditStroke] = useState('#000000');
  const [editStrokeWidth, setEditStrokeWidth] = useState(0);

  // Export state
  const [exportSize, setExportSize] = useState('512');

  // Combined library
  const COMBINED_LIBRARY = useMemo(() => [...SHAPE_LIBRARY, ...getGeneratedShapes()], []);

  const filteredShapes = useMemo(() => {
    let results = COMBINED_LIBRARY;
    if (selectedIndustry !== 'all') results = results.filter(s => s.industry === selectedIndustry);
    if (selectedCategory !== 'all') results = results.filter(s => s.category === selectedCategory);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      results = results.filter(s =>
        s.name.toLowerCase().includes(q) ||
        s.tags.some(t => t.includes(q)) ||
        s.category.toLowerCase().includes(q)
      );
    }
    return results;
  }, [searchQuery, selectedIndustry, selectedCategory, COMBINED_LIBRARY]);

  const isShapeAdded = useCallback((libShape: LibraryShape) => {
    return shapes.some(s => s.name === libShape.name);
  }, [shapes]);

  const addLibraryShape = useCallback((libShape: LibraryShape) => {
    const newShape: CustomDesignShape = {
      id: crypto.randomUUID(),
      name: libShape.name,
      type: 'custom',
      category: libShape.category,
      svg: libShape.svg,
    };
    onShapesChange([...shapes, newShape]);
    toast.success(`Added "${libShape.name}"`);
  }, [shapes, onShapesChange]);

  const deleteShape = useCallback((id: string) => {
    onShapesChange(shapes.filter(s => s.id !== id));
    if (selectedShapeId === id) setSelectedShapeId(null);
    toast.success('Shape removed');
  }, [shapes, onShapesChange, selectedShapeId]);

  // Validate SVG
  const validateSvg = (svg: string): boolean => {
    if (!svg.trim()) { setSvgPreviewError('Enter SVG code'); return false; }
    const t = svg.trim();
    if (!t.startsWith('<svg') || !t.includes('</svg>')) { setSvgPreviewError('Must be valid SVG'); return false; }
    if (t.includes('<script') || t.includes('javascript:')) { setSvgPreviewError('Unsafe content detected'); return false; }
    setSvgPreviewError(null);
    return true;
  };

  const addManualShape = () => {
    if (!manualName.trim()) { toast.error('Enter a shape name'); return; }
    if (!validateSvg(manualSvg)) { toast.error(svgPreviewError || 'Invalid SVG'); return; }
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
    setSvgPreviewError(null);
    toast.success(`Added "${newShape.name}"`);
    setCompletedSteps(prev => new Set(prev).add('create'));
  };

  // AI Generate
  const generateAIShape = async () => {
    if (!prompt.trim()) { toast.error('Enter a description'); return; }
    setIsGenerating(true);
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
        toast.success('AI shape generated!');
        setCompletedSteps(prev => new Set(prev).add('generate'));
      }
    } catch (error) {
      console.error('Shape generation error:', error);
      toast.error('Generation failed. Try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Colorize
  const applyColor = () => {
    if (!selectedShapeId) return;
    const updated = shapes.map(s => {
      if (s.id !== selectedShapeId) return s;
      let svg = s.svg;
      svg = svg.replace(/fill="(?!none|url)(#[0-9a-fA-F]{3,8}|[a-z]+)"/g, `fill="${editFill}"`);
      if (editStrokeWidth > 0) {
        if (svg.includes('stroke="')) {
          svg = svg.replace(/stroke="(#[0-9a-fA-F]{3,8}|[a-z]+)"/g, `stroke="${editStroke}"`);
          svg = svg.replace(/stroke-width="[^"]*"/g, `stroke-width="${editStrokeWidth}"`);
        } else {
          svg = svg.replace(/<(circle|rect|polygon|path|ellipse)(\s)/g, `<$1 stroke="${editStroke}" stroke-width="${editStrokeWidth}"$2`);
        }
      }
      return { ...s, svg };
    });
    onShapesChange(updated);
    toast.success('Color applied');
    setCompletedSteps(prev => new Set(prev).add('colorize'));
  };

  // Export helpers
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

  const downloadPNG = async (shape: CustomDesignShape, size: number = 512) => {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const img = new Image();
    const svgBlob = new Blob([shape.svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(svgBlob);
    img.onload = () => {
      ctx.drawImage(img, 0, 0, size, size);
      const pngUrl = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = pngUrl;
      a.download = `${shape.name.toLowerCase().replace(/\s+/g, '-')}-${size}px.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success(`PNG downloaded (${size}px)`);
    };
    img.src = url;
  };

  const downloadAllSVG = () => {
    shapes.forEach(s => downloadSVG(s));
    setCompletedSteps(prev => new Set(prev).add('export'));
  };

  const stepIndex = STEPS.findIndex(s => s.id === currentStep);

  const goNext = () => {
    if (stepIndex < STEPS.length - 1) {
      setCompletedSteps(prev => new Set(prev).add(currentStep));
      setCurrentStep(STEPS[stepIndex + 1].id);
    }
  };

  const goPrev = () => {
    if (stepIndex > 0) setCurrentStep(STEPS[stepIndex - 1].id);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedIndustry('all');
    setSelectedCategory('all');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 pt-5 pb-3 border-b border-border">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="h-5 w-5 text-primary" />
            Geometric Primitives Studio
          </DialogTitle>
          <p className="text-sm text-muted-foreground">Create, customize, and export brand geometric primitives</p>
        </DialogHeader>

        {/* Wizard Stepper */}
        <div className="px-6 py-3 border-b border-border bg-muted/20">
          <div className="flex items-center justify-between gap-1">
            {STEPS.map((step, i) => {
              const Icon = step.icon;
              const isActive = step.id === currentStep;
              const isComplete = completedSteps.has(step.id);
              return (
                <button
                  key={step.id}
                  onClick={() => setCurrentStep(step.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all flex-1 justify-center ${
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : isComplete
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="hidden sm:inline">{step.label}</span>
                  {isComplete && !isActive && <Check className="h-3 w-3 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Step Content */}
        <ScrollArea className="flex-1 min-h-0">
          <div className="p-6">
            {/* ─── LIBRARY ─── */}
            {currentStep === 'library' && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search shapes..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <Select value={selectedIndustry} onValueChange={setSelectedIndustry}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SHAPE_INDUSTRIES.map(i => (
                        <SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-[160px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SHAPE_CATEGORIES.map(c => (
                        <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {(searchQuery || selectedIndustry !== 'all' || selectedCategory !== 'all') && (
                    <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1">
                      <X className="h-3 w-3" /> Clear
                    </Button>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">{filteredShapes.length} shapes available</p>
                  <Badge variant="outline">{shapes.length} added</Badge>
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                  {filteredShapes.slice(0, 60).map(libShape => {
                    const added = isShapeAdded(libShape);
                    return (
                      <Card
                        key={libShape.id}
                        className={`group cursor-pointer transition-all ${added ? 'border-primary/50 bg-primary/5' : 'hover:border-primary/30'}`}
                        onClick={() => !added && addLibraryShape(libShape)}
                      >
                        <CardContent className="p-2">
                          <div
                            className="aspect-square flex items-center justify-center bg-muted/30 rounded-md overflow-hidden p-1 [&>svg]:max-w-full [&>svg]:max-h-full"
                            dangerouslySetInnerHTML={{ __html: sanitizeSvg(libShape.svg) }}
                          />
                          <p className="text-[10px] font-medium truncate mt-1 text-center">{libShape.name}</p>
                          {added && (
                            <div className="flex justify-center mt-0.5">
                              <Check className="h-3 w-3 text-primary" />
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
                {filteredShapes.length > 60 && (
                  <p className="text-xs text-muted-foreground text-center">Showing 60 of {filteredShapes.length} — refine filters to see more</p>
                )}
              </div>
            )}

            {/* ─── CREATE ─── */}
            {currentStep === 'create' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-semibold mb-3">Quick Templates</h3>
                  <div className="grid grid-cols-6 gap-2">
                    {SVG_TEMPLATES.map(t => (
                      <button
                        key={t.name}
                        onClick={() => { setManualSvg(t.svg); setManualName(t.name); }}
                        className="group aspect-square bg-muted/30 rounded-lg border border-border hover:border-primary/50 transition-all overflow-hidden p-2 flex items-center justify-center [&>svg]:max-w-full [&>svg]:max-h-full"
                      >
                        <div dangerouslySetInnerHTML={{ __html: sanitizeSvg(t.svg) }} className="w-full h-full flex items-center justify-center [&>svg]:max-w-full [&>svg]:max-h-full" />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div>
                      <Label>Shape Name</Label>
                      <Input value={manualName} onChange={e => setManualName(e.target.value)} placeholder="My Custom Shape" />
                    </div>
                    <div>
                      <Label>Category</Label>
                      <Select value={manualCategory} onValueChange={setManualCategory}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="custom">Custom</SelectItem>
                          <SelectItem value="geometric">Geometric</SelectItem>
                          <SelectItem value="organic">Organic</SelectItem>
                          <SelectItem value="abstract">Abstract</SelectItem>
                          <SelectItem value="layered">Layered</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>SVG Code</Label>
                      <SyntaxTextarea
                        value={manualSvg}
                        onChange={v => { setManualSvg(v); if (v.trim()) validateSvg(v); else setSvgPreviewError(null); }}
                        placeholder='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">...</svg>'
                        className="h-40 font-mono text-xs"
                      />
                      {svgPreviewError && <p className="text-xs text-destructive mt-1">{svgPreviewError}</p>}
                    </div>
                    <Button onClick={addManualShape} className="w-full gap-2">
                      <Plus className="h-4 w-4" /> Add Shape
                    </Button>
                  </div>

                  <div className="space-y-3">
                    <Label>Live Preview</Label>
                    <div className="aspect-square bg-muted/30 rounded-xl border-2 border-dashed border-border flex items-center justify-center overflow-hidden p-6">
                      {manualSvg.trim() && !svgPreviewError ? (
                        <div
                          className="w-full h-full flex items-center justify-center [&>svg]:max-w-full [&>svg]:max-h-full"
                          dangerouslySetInnerHTML={{ __html: sanitizeSvg(manualSvg) }}
                        />
                      ) : (
                        <p className="text-sm text-muted-foreground">Paste SVG or pick a template</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ─── GENERATE ─── */}
            {currentStep === 'generate' && (
              <div className="space-y-6 max-w-xl mx-auto">
                <div className="text-center">
                  <Wand2 className="h-10 w-10 text-primary mx-auto mb-2" />
                  <h3 className="text-lg font-semibold">AI Shape Generator</h3>
                  <p className="text-sm text-muted-foreground">Describe the geometric primitive you want to create</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label>Description</Label>
                    <Input
                      value={prompt}
                      onChange={e => setPrompt(e.target.value)}
                      placeholder="e.g., A modern DNA helix with gradient fill"
                      onKeyDown={e => e.key === 'Enter' && generateAIShape()}
                    />
                  </div>

                  <div>
                    <Label>Style</Label>
                    <div className="grid grid-cols-5 gap-2 mt-1">
                      {STYLE_OPTIONS.map(opt => (
                        <Button
                          key={opt.value}
                          variant={style === opt.value ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setStyle(opt.value)}
                          className="text-xs"
                        >
                          {opt.label}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {brandColors.length > 0 && (
                    <div>
                      <Label className="text-xs text-muted-foreground">Brand colors will be applied:</Label>
                      <div className="flex gap-1.5 mt-1">
                        {brandColors.slice(0, 6).map(c => (
                          <div key={c.hex} className="w-6 h-6 rounded-full border border-border shadow-sm" style={{ backgroundColor: c.hex }} title={c.name} />
                        ))}
                      </div>
                    </div>
                  )}

                  <Button onClick={generateAIShape} disabled={isGenerating} className="w-full gap-2">
                    {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                    {isGenerating ? 'Generating...' : 'Generate Shape'}
                  </Button>
                </div>

                {/* Recent AI shapes */}
                {shapes.filter(s => s.aiGenerated).length > 0 && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Recently Generated</Label>
                    <div className="grid grid-cols-4 gap-2 mt-2">
                      {shapes.filter(s => s.aiGenerated).slice(-8).map(s => (
                        <div key={s.id} className="aspect-square bg-muted/30 rounded-lg p-2 flex items-center justify-center [&>svg]:max-w-full [&>svg]:max-h-full">
                          <div dangerouslySetInnerHTML={{ __html: sanitizeSvg(s.svg) }} className="w-full h-full flex items-center justify-center [&>svg]:max-w-full [&>svg]:max-h-full" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ─── COLORIZE ─── */}
            {currentStep === 'colorize' && (
              <div className="space-y-4">
                {shapes.length === 0 ? (
                  <div className="text-center py-12">
                    <Palette className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground">Add shapes first from the Library or Create steps</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-[1fr_300px] gap-6">
                    {/* Shape grid */}
                    <div>
                      <Label className="text-sm mb-2 block">Select a shape to colorize</Label>
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                        {shapes.map(s => (
                          <Card
                            key={s.id}
                            className={`cursor-pointer transition-all ${selectedShapeId === s.id ? 'ring-2 ring-primary' : 'hover:border-primary/30'}`}
                            onClick={() => {
                              setSelectedShapeId(s.id);
                              const fillMatch = s.svg.match(/fill="(#[0-9a-fA-F]{6})"/);
                              if (fillMatch) setEditFill(fillMatch[1]);
                            }}
                          >
                            <CardContent className="p-2">
                              <div
                                className="aspect-square flex items-center justify-center bg-muted/20 rounded-md overflow-hidden p-1 [&>svg]:max-w-full [&>svg]:max-h-full"
                                dangerouslySetInnerHTML={{ __html: sanitizeSvg(s.svg) }}
                              />
                              <p className="text-[10px] font-medium truncate mt-1 text-center">{s.name}</p>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>

                    {/* Color controls */}
                    <div className="space-y-4 border-l border-border pl-6">
                      <h4 className="text-sm font-semibold">Color Controls</h4>

                      {selectedShapeId ? (
                        <>
                          {/* Preview */}
                          <div className="aspect-square bg-muted/20 rounded-xl border border-border flex items-center justify-center p-4">
                            {(() => {
                              const shape = shapes.find(s => s.id === selectedShapeId);
                              if (!shape) return null;
                              const previewSvg = applyColorToSvg(shape.svg, editFill);
                              return (
                                <div
                                  className="w-full h-full flex items-center justify-center [&>svg]:max-w-full [&>svg]:max-h-full"
                                  dangerouslySetInnerHTML={{ __html: sanitizeSvg(previewSvg) }}
                                />
                              );
                            })()}
                          </div>

                          <div>
                            <Label className="text-xs">Fill Color</Label>
                            <div className="flex items-center gap-2 mt-1">
                              <input type="color" value={editFill} onChange={e => setEditFill(e.target.value)} className="w-8 h-8 rounded cursor-pointer border-0" />
                              <Input value={editFill} onChange={e => setEditFill(e.target.value)} className="font-mono text-xs flex-1" />
                            </div>
                          </div>

                          {/* Brand color quick picks */}
                          {brandColors.length > 0 && (
                            <div>
                              <Label className="text-xs">Brand Colors</Label>
                              <div className="flex flex-wrap gap-1.5 mt-1">
                                {brandColors.map(c => (
                                  <button
                                    key={c.hex}
                                    onClick={() => setEditFill(c.hex)}
                                    className={`w-7 h-7 rounded-full border-2 transition-all ${editFill === c.hex ? 'border-primary scale-110' : 'border-border hover:scale-105'}`}
                                    style={{ backgroundColor: c.hex }}
                                    title={c.name}
                                  />
                                ))}
                              </div>
                            </div>
                          )}

                          <div>
                            <Label className="text-xs">Stroke</Label>
                            <div className="flex items-center gap-2 mt-1">
                              <input type="color" value={editStroke} onChange={e => setEditStroke(e.target.value)} className="w-8 h-8 rounded cursor-pointer border-0" />
                              <Input
                                type="number"
                                min={0}
                                max={10}
                                value={editStrokeWidth}
                                onChange={e => setEditStrokeWidth(Number(e.target.value))}
                                className="w-20 text-xs"
                                placeholder="Width"
                              />
                            </div>
                          </div>

                          <Button onClick={applyColor} className="w-full gap-2">
                            <Palette className="h-4 w-4" /> Apply Color
                          </Button>
                        </>
                      ) : (
                        <p className="text-sm text-muted-foreground">Select a shape to customize</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ─── EXPORT ─── */}
            {currentStep === 'export' && (
              <div className="space-y-4">
                {shapes.length === 0 ? (
                  <div className="text-center py-12">
                    <Package className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground">No shapes to export. Add some from the Library or Create steps.</p>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">{shapes.length} Shape{shapes.length !== 1 ? 's' : ''} Ready</h3>
                        <p className="text-sm text-muted-foreground">Download individually or batch export</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Select value={exportSize} onValueChange={setExportSize}>
                          <SelectTrigger className="w-[120px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="256">256px</SelectItem>
                            <SelectItem value="512">512px</SelectItem>
                            <SelectItem value="1024">1024px</SelectItem>
                            <SelectItem value="2048">2048px</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button onClick={downloadAllSVG} variant="outline" className="gap-2">
                          <Package className="h-4 w-4" /> Export All SVG
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                      {shapes.map(s => (
                        <Card key={s.id} className="group relative">
                          <CardContent className="p-3">
                            <div
                              className="aspect-square flex items-center justify-center bg-muted/20 rounded-lg mb-2 overflow-hidden p-2 [&>svg]:max-w-full [&>svg]:max-h-full"
                              dangerouslySetInnerHTML={{ __html: sanitizeSvg(s.svg) }}
                            />
                            <p className="text-xs font-medium truncate mb-2">{s.name}</p>
                            <div className="flex gap-1">
                              <Button size="sm" variant="outline" onClick={() => downloadSVG(s)} className="flex-1 text-xs gap-1 h-7">
                                <Download className="h-3 w-3" /> SVG
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => downloadPNG(s, parseInt(exportSize))} className="flex-1 text-xs gap-1 h-7">
                                <Download className="h-3 w-3" /> PNG
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => deleteShape(s.id)} className="h-7 w-7 p-0 text-destructive hover:text-destructive">
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Footer navigation */}
        <div className="px-6 py-3 border-t border-border flex items-center justify-between bg-muted/20">
          <Button variant="outline" size="sm" onClick={goPrev} disabled={stepIndex === 0} className="gap-1">
            <ChevronLeft className="h-4 w-4" /> Back
          </Button>
          <div className="flex items-center gap-1.5">
            {STEPS.map((s, i) => (
              <div
                key={s.id}
                className={`w-2 h-2 rounded-full transition-all ${
                  i === stepIndex ? 'bg-primary w-4' : completedSteps.has(s.id) ? 'bg-primary/50' : 'bg-muted-foreground/30'
                }`}
              />
            ))}
          </div>
          {stepIndex < STEPS.length - 1 ? (
            <Button size="sm" onClick={goNext} className="gap-1">
              Next <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button size="sm" onClick={() => onOpenChange(false)} className="gap-1">
              Done <Check className="h-4 w-4" />
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
