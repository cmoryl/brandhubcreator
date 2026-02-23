/**
 * SeamlessPatternsStudio - Studio for seamless pattern creation & management
 * 
 * Wizard steps:
 * 1. Library - Browse curated seamless pattern templates
 * 2. Create - Upload or paste SVG seamless tiles
 * 3. Generate - AI-powered seamless pattern generation
 * 4. Preview - Live tiling preview with zoom/scale controls
 * 5. Export - Batch download tiled patterns at various resolutions
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
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Library,
  Upload,
  Sparkles,
  Eye,
  Package,
  ChevronLeft,
  ChevronRight,
  Search,
  Plus,
  Check,
  Download,
  Trash2,
  Loader2,
  Wand2,
  Grid,
  ZoomIn,
  ZoomOut,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { BrandColor, BrandPattern } from '@/types/brand';
import { supabase } from '@/integrations/supabase/client';
import { useSaveToLibrary } from '@/hooks/useSaveToLibrary';

// SVG sanitization config
const SVG_SANITIZE_CONFIG = {
  USE_PROFILES: { svg: true, svgFilters: true },
  FORBID_TAGS: ['script', 'foreignObject'],
  FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur'],
};

const sanitizeSvg = (svg: string): string => DOMPurify.sanitize(svg, SVG_SANITIZE_CONFIG);

// Built-in seamless pattern SVG templates
const SEAMLESS_TEMPLATES = [
  {
    id: 'dots',
    name: 'Polka Dots',
    category: 'Classic',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40"><rect width="40" height="40" fill="#f8f9fa"/><circle cx="20" cy="20" r="6" fill="#6366F1" opacity="0.6"/><circle cx="0" cy="0" r="6" fill="#6366F1" opacity="0.6"/><circle cx="40" cy="0" r="6" fill="#6366F1" opacity="0.6"/><circle cx="0" cy="40" r="6" fill="#6366F1" opacity="0.6"/><circle cx="40" cy="40" r="6" fill="#6366F1" opacity="0.6"/></svg>`,
  },
  {
    id: 'stripes-diagonal',
    name: 'Diagonal Stripes',
    category: 'Classic',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40"><rect width="40" height="40" fill="#f8f9fa"/><path d="M-10,10 l20,-20 M0,40 l40,-40 M30,50 l20,-20" stroke="#6366F1" stroke-width="4" opacity="0.3"/></svg>`,
  },
  {
    id: 'chevron',
    name: 'Chevron',
    category: 'Geometric',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="60" height="30" viewBox="0 0 60 30"><rect width="60" height="30" fill="#f8f9fa"/><path d="M0,30 L30,0 L60,30" fill="none" stroke="#6366F1" stroke-width="3" opacity="0.5"/></svg>`,
  },
  {
    id: 'hexagons',
    name: 'Honeycomb',
    category: 'Geometric',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="56" height="100" viewBox="0 0 56 100"><rect width="56" height="100" fill="#f8f9fa"/><path d="M28 66L0 50L0 16L28 0L56 16L56 50L28 66L28 100" fill="none" stroke="#6366F1" stroke-width="2" opacity="0.3"/><path d="M28 0L28 34L0 50L0 84L28 100L56 84L56 50L28 34" fill="none" stroke="#6366F1" stroke-width="2" opacity="0.15"/></svg>`,
  },
  {
    id: 'waves',
    name: 'Waves',
    category: 'Organic',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="80" height="40" viewBox="0 0 80 40"><rect width="80" height="40" fill="#f8f9fa"/><path d="M0,20 Q20,0 40,20 Q60,40 80,20" fill="none" stroke="#6366F1" stroke-width="2.5" opacity="0.4"/><path d="M0,30 Q20,10 40,30 Q60,50 80,30" fill="none" stroke="#6366F1" stroke-width="1.5" opacity="0.2"/></svg>`,
  },
  {
    id: 'crosshatch',
    name: 'Crosshatch',
    category: 'Classic',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40"><rect width="40" height="40" fill="#f8f9fa"/><path d="M0,0 L40,40 M40,0 L0,40" stroke="#6366F1" stroke-width="1.5" opacity="0.25"/></svg>`,
  },
  {
    id: 'triangles',
    name: 'Triangles',
    category: 'Geometric',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="60" height="52" viewBox="0 0 60 52"><rect width="60" height="52" fill="#f8f9fa"/><polygon points="30,0 60,52 0,52" fill="#6366F1" opacity="0.1" stroke="#6366F1" stroke-width="1.5" stroke-opacity="0.3"/></svg>`,
  },
  {
    id: 'diamonds',
    name: 'Diamonds',
    category: 'Geometric',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48"><rect width="48" height="48" fill="#f8f9fa"/><polygon points="24,4 44,24 24,44 4,24" fill="none" stroke="#6366F1" stroke-width="2" opacity="0.3"/></svg>`,
  },
  {
    id: 'circles-overlap',
    name: 'Overlapping Circles',
    category: 'Organic',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 50 50"><rect width="50" height="50" fill="#f8f9fa"/><circle cx="25" cy="25" r="20" fill="none" stroke="#6366F1" stroke-width="1.5" opacity="0.3"/><circle cx="0" cy="0" r="20" fill="none" stroke="#6366F1" stroke-width="1.5" opacity="0.15"/><circle cx="50" cy="50" r="20" fill="none" stroke="#6366F1" stroke-width="1.5" opacity="0.15"/></svg>`,
  },
  {
    id: 'grid-simple',
    name: 'Simple Grid',
    category: 'Classic',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40"><rect width="40" height="40" fill="#f8f9fa"/><path d="M40,0 L0,0 L0,40" fill="none" stroke="#6366F1" stroke-width="1.5" opacity="0.2"/></svg>`,
  },
  {
    id: 'scales',
    name: 'Fish Scales',
    category: 'Organic',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40"><rect width="40" height="40" fill="#f8f9fa"/><circle cx="0" cy="20" r="20" fill="none" stroke="#6366F1" stroke-width="1.5" opacity="0.25"/><circle cx="40" cy="20" r="20" fill="none" stroke="#6366F1" stroke-width="1.5" opacity="0.25"/><circle cx="20" cy="0" r="20" fill="none" stroke="#6366F1" stroke-width="1.5" opacity="0.15"/><circle cx="20" cy="40" r="20" fill="none" stroke="#6366F1" stroke-width="1.5" opacity="0.15"/></svg>`,
  },
  {
    id: 'zigzag',
    name: 'Zigzag',
    category: 'Geometric',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="20" viewBox="0 0 40 20"><rect width="40" height="20" fill="#f8f9fa"/><polyline points="0,20 10,0 20,20 30,0 40,20" fill="none" stroke="#6366F1" stroke-width="2.5" opacity="0.35"/></svg>`,
  },
];

const TEMPLATE_CATEGORIES = ['All', 'Classic', 'Geometric', 'Organic'];

const PATTERN_STYLES = [
  { value: 'geometric', label: 'Geometric' },
  { value: 'organic', label: 'Organic' },
  { value: 'minimalist', label: 'Minimalist' },
  { value: 'art-deco', label: 'Art Deco' },
  { value: 'textile', label: 'Textile' },
  { value: 'abstract', label: 'Abstract' },
];

type StudioStep = 'library' | 'create' | 'generate' | 'preview' | 'export';

interface StudioStepDef {
  id: StudioStep;
  label: string;
  icon: typeof Library;
  description: string;
}

const STEPS: StudioStepDef[] = [
  { id: 'library', label: 'Templates', icon: Library, description: 'Browse pattern templates' },
  { id: 'create', label: 'Create', icon: Upload, description: 'Upload or paste SVG tiles' },
  { id: 'generate', label: 'AI Generate', icon: Wand2, description: 'AI seamless patterns' },
  { id: 'preview', label: 'Tile Preview', icon: Eye, description: 'Preview tiling result' },
  { id: 'export', label: 'Export', icon: Package, description: 'Download patterns' },
];

interface GeometricPrimitivesStudioProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patterns: BrandPattern[];
  onPatternsChange: (patterns: BrandPattern[]) => void;
  brandColors: BrandColor[];
  brandName?: string;
  // Legacy props (ignored, kept for compat)
  shapes?: any[];
  onShapesChange?: (shapes: any[]) => void;
}

export const GeometricPrimitivesStudio = ({
  open,
  onOpenChange,
  patterns = [],
  onPatternsChange,
  brandColors,
  brandName,
}: GeometricPrimitivesStudioProps) => {
  const [currentStep, setCurrentStep] = useState<StudioStep>('library');
  const [completedSteps, setCompletedSteps] = useState<Set<StudioStep>>(new Set());
  const { saveToLibrary } = useSaveToLibrary();

  // Library state
  const [templateCategory, setTemplateCategory] = useState('All');

  // Create state
  const [uploadName, setUploadName] = useState('');
  const [manualSvg, setManualSvg] = useState('');
  const [svgPreviewError, setSvgPreviewError] = useState<string | null>(null);

  // Generate state
  const [prompt, setPrompt] = useState('');
  const [patternStyle, setPatternStyle] = useState('geometric');
  const [isGenerating, setIsGenerating] = useState(false);

  // Preview state
  const [previewPatternId, setPreviewPatternId] = useState<string | null>(null);
  const [tileScale, setTileScale] = useState(64);

  // Export state
  const [exportSize, setExportSize] = useState('1024');

  const filteredTemplates = useMemo(() => {
    if (templateCategory === 'All') return SEAMLESS_TEMPLATES;
    return SEAMLESS_TEMPLATES.filter(t => t.category === templateCategory);
  }, [templateCategory]);

  const previewPattern = useMemo(() => {
    return patterns.find(p => p.id === previewPatternId) || patterns[0] || null;
  }, [previewPatternId, patterns]);

  // Add a template as a pattern (convert SVG to data URL)
  const addTemplate = useCallback((template: typeof SEAMLESS_TEMPLATES[0]) => {
    const svgBlob = new Blob([template.svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(svgBlob);
    
    // Convert to data URL for persistence
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      const savedResult = await saveToLibrary(dataUrl, `${brandName || 'Brand'} - ${template.name}`, 'Backgrounds');
      
      const newPattern: BrandPattern = {
        id: crypto.randomUUID(),
        name: template.name,
        url: savedResult?.publicUrl || dataUrl,
      };
      onPatternsChange([...patterns, newPattern]);
      toast.success(`Added "${template.name}" pattern`);
      URL.revokeObjectURL(url);
    };
    reader.readAsDataURL(svgBlob);
  }, [patterns, onPatternsChange, saveToLibrary, brandName]);

  const isTemplateAdded = useCallback((template: typeof SEAMLESS_TEMPLATES[0]) => {
    return patterns.some(p => p.name === template.name);
  }, [patterns]);

  // Add SVG tile manually
  const validateSvg = (svg: string): boolean => {
    if (!svg.trim()) { setSvgPreviewError('Enter SVG code'); return false; }
    const t = svg.trim();
    if (!t.startsWith('<svg') || !t.includes('</svg>')) { setSvgPreviewError('Must be valid SVG'); return false; }
    if (t.includes('<script') || t.includes('javascript:')) { setSvgPreviewError('Unsafe content'); return false; }
    setSvgPreviewError(null);
    return true;
  };

  const addManualTile = async () => {
    if (!uploadName.trim()) { toast.error('Enter a pattern name'); return; }
    if (!validateSvg(manualSvg)) { toast.error(svgPreviewError || 'Invalid SVG'); return; }
    
    const svgBlob = new Blob([manualSvg.trim()], { type: 'image/svg+xml' });
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      const savedResult = await saveToLibrary(dataUrl, `${brandName || 'Brand'} - ${uploadName.trim()}`, 'Backgrounds');
      
      const newPattern: BrandPattern = {
        id: crypto.randomUUID(),
        name: uploadName.trim(),
        url: savedResult?.publicUrl || dataUrl,
      };
      onPatternsChange([...patterns, newPattern]);
      setUploadName('');
      setManualSvg('');
      setSvgPreviewError(null);
      toast.success(`Added "${newPattern.name}"`);
      setCompletedSteps(prev => new Set(prev).add('create'));
    };
    reader.readAsDataURL(svgBlob);
  };

  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fileName = file.name.replace(/\.[^/.]+$/, '');
    
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      const savedResult = await saveToLibrary(dataUrl, `${brandName || 'Brand'} - ${fileName}`, 'Backgrounds');
      
      const newPattern: BrandPattern = {
        id: crypto.randomUUID(),
        name: fileName,
        url: savedResult?.publicUrl || dataUrl,
      };
      onPatternsChange([...patterns, newPattern]);
      toast.success(`Uploaded "${fileName}"`);
      setCompletedSteps(prev => new Set(prev).add('create'));
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  }, [patterns, onPatternsChange, saveToLibrary, brandName]);

  // AI Generate seamless pattern
  const generateSeamlessPattern = async () => {
    if (!prompt.trim()) { toast.error('Enter a pattern description'); return; }
    
    setIsGenerating(true);
    toast.info('Generating seamless pattern...');

    try {
      const { data, error } = await supabase.functions.invoke('generate-brand-assets', {
        body: {
          type: 'patterns',
          brandContext: {
            name: brandName || 'Brand',
            colors: brandColors.map(c => ({ hex: c.hex, name: c.name, role: c.role })),
            patternPrompt: prompt.trim(),
            patternStyle,
            seamless: true,
          },
          count: 2,
        },
      });

      if (error) throw error;

      if (data?.patterns && data.patterns.length > 0) {
        const newPatterns: BrandPattern[] = [];
        for (const p of data.patterns as Array<{ name: string; url: string }>) {
          const patternName = `${prompt.trim().slice(0, 25)} - ${p.name}`;
          const savedResult = await saveToLibrary(p.url, `${brandName || 'Brand'} - ${patternName}`, 'Backgrounds');
          newPatterns.push({
            id: crypto.randomUUID(),
            name: patternName,
            url: savedResult?.publicUrl || p.url,
          });
        }
        onPatternsChange([...patterns, ...newPatterns]);
        toast.success(`Generated ${newPatterns.length} seamless patterns!`);
        setCompletedSteps(prev => new Set(prev).add('generate'));
        setPrompt('');
      } else {
        toast.error('No patterns generated');
      }
    } catch (error) {
      console.error('Pattern generation error:', error);
      toast.error('Failed to generate. Try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Export
  const downloadPatternTiled = async (pattern: BrandPattern, resolution: number) => {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = resolution;
      canvas.height = resolution;
      const ctx = canvas.getContext('2d');
      if (!ctx) { toast.error('Canvas not supported'); return; }

      const img = new Image();
      img.crossOrigin = 'anonymous';
      await new Promise<void>((resolve, reject) => {
        img.onload = () => {
          const pCanvas = document.createElement('canvas');
          const pCtx = pCanvas.getContext('2d');
          if (!pCtx) { reject(new Error('No ctx')); return; }
          pCanvas.width = img.width;
          pCanvas.height = img.height;
          pCtx.drawImage(img, 0, 0);
          const cp = ctx.createPattern(pCanvas, 'repeat');
          if (cp) { ctx.fillStyle = cp; ctx.fillRect(0, 0, resolution, resolution); }
          else { ctx.drawImage(img, 0, 0, resolution, resolution); }
          resolve();
        };
        img.onerror = () => reject(new Error('Load failed'));
        img.src = pattern.url;
      });

      const blob = await new Promise<Blob | null>(r => canvas.toBlob(r, 'image/png', 1.0));
      if (!blob) { toast.error('Export failed'); return; }
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${pattern.name}-${resolution}x${resolution}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success(`Downloaded at ${resolution}×${resolution}`);
    } catch (err) {
      console.error(err);
      toast.error('Download failed');
    }
  };

  const downloadAll = async () => {
    const size = parseInt(exportSize);
    toast.info(`Exporting ${patterns.length} patterns...`);
    for (const p of patterns) {
      await downloadPatternTiled(p, size);
      await new Promise(r => setTimeout(r, 400));
    }
    setCompletedSteps(prev => new Set(prev).add('export'));
  };

  const deletePattern = (id: string) => {
    onPatternsChange(patterns.filter(p => p.id !== id));
    if (previewPatternId === id) setPreviewPatternId(null);
    toast.success('Pattern removed');
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 pt-5 pb-3 border-b border-border">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Grid className="h-5 w-5 text-primary" />
            Seamless Patterns Studio
          </DialogTitle>
          <p className="text-sm text-muted-foreground">Create, preview, and export seamless tiling patterns for your brand</p>
        </DialogHeader>

        {/* Wizard Stepper */}
        <div className="px-6 py-3 border-b border-border bg-muted/20">
          <div className="flex items-center justify-between gap-1">
            {STEPS.map((step) => {
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
            {/* ─── TEMPLATES ─── */}
            {currentStep === 'library' && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  {TEMPLATE_CATEGORIES.map(cat => (
                    <Button
                      key={cat}
                      variant={templateCategory === cat ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setTemplateCategory(cat)}
                    >
                      {cat}
                    </Button>
                  ))}
                  <div className="ml-auto">
                    <Badge variant="outline">{patterns.length} patterns added</Badge>
                  </div>
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                  {filteredTemplates.map(template => {
                    const added = isTemplateAdded(template);
                    return (
                      <Card
                        key={template.id}
                        className={`group cursor-pointer transition-all ${added ? 'border-primary/50 bg-primary/5' : 'hover:border-primary/30'}`}
                        onClick={() => !added && addTemplate(template)}
                      >
                        <CardContent className="p-2">
                          <div
                            className="aspect-square rounded-md overflow-hidden"
                            style={{
                              backgroundImage: `url("data:image/svg+xml,${encodeURIComponent(template.svg)}")`,
                              backgroundSize: '50%',
                              backgroundRepeat: 'repeat',
                            }}
                          />
                          <p className="text-[10px] font-medium truncate mt-1.5 text-center">{template.name}</p>
                          <p className="text-[9px] text-muted-foreground text-center">{template.category}</p>
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
              </div>
            )}

            {/* ─── CREATE ─── */}
            {currentStep === 'create' && (
              <div className="space-y-6">
                {/* File upload */}
                <div>
                  <h3 className="text-sm font-semibold mb-3">Upload a Seamless Tile</h3>
                  <label className="flex items-center justify-center h-32 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-colors">
                    <div className="text-center">
                      <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">Click to upload a pattern tile image</p>
                      <p className="text-xs text-muted-foreground/70 mt-1">PNG, SVG, JPG — must tile seamlessly</p>
                    </div>
                    <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                  </label>
                </div>

                {/* SVG paste */}
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold">Paste SVG Tile</h3>
                    <div>
                      <Label>Pattern Name</Label>
                      <Input value={uploadName} onChange={e => setUploadName(e.target.value)} placeholder="My Seamless Pattern" />
                    </div>
                    <div>
                      <Label>SVG Code (seamless tile)</Label>
                      <textarea
                        value={manualSvg}
                        onChange={e => { setManualSvg(e.target.value); if (e.target.value.trim()) validateSvg(e.target.value); else setSvgPreviewError(null); }}
                        placeholder='<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">...</svg>'
                        className="w-full h-32 font-mono text-xs p-3 rounded-lg border border-input bg-background resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                      {svgPreviewError && <p className="text-xs text-destructive mt-1">{svgPreviewError}</p>}
                    </div>
                    <Button onClick={addManualTile} className="w-full gap-2">
                      <Plus className="h-4 w-4" /> Add Pattern Tile
                    </Button>
                  </div>

                  <div className="space-y-3">
                    <Label>Tiling Preview</Label>
                    <div
                      className="aspect-square rounded-xl border-2 border-dashed border-border overflow-hidden"
                      style={manualSvg.trim() && !svgPreviewError ? {
                        backgroundImage: `url("data:image/svg+xml,${encodeURIComponent(manualSvg.trim())}")`,
                        backgroundSize: '25%',
                        backgroundRepeat: 'repeat',
                      } : undefined}
                    >
                      {(!manualSvg.trim() || svgPreviewError) && (
                        <div className="w-full h-full flex items-center justify-center">
                          <p className="text-sm text-muted-foreground">Paste SVG to preview tiling</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ─── AI GENERATE ─── */}
            {currentStep === 'generate' && (
              <div className="space-y-6 max-w-xl mx-auto">
                <div className="text-center">
                  <Wand2 className="h-10 w-10 text-primary mx-auto mb-2" />
                  <h3 className="text-lg font-semibold">AI Seamless Pattern Generator</h3>
                  <p className="text-sm text-muted-foreground">Describe the seamless pattern you want to create</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label>Pattern Description</Label>
                    <Input
                      value={prompt}
                      onChange={e => setPrompt(e.target.value)}
                      placeholder="e.g., Subtle geometric tessellation with organic curves"
                      onKeyDown={e => e.key === 'Enter' && !isGenerating && generateSeamlessPattern()}
                    />
                  </div>

                  <div>
                    <Label>Pattern Style</Label>
                    <div className="grid grid-cols-3 gap-2 mt-1">
                      {PATTERN_STYLES.map(opt => (
                        <Button
                          key={opt.value}
                          variant={patternStyle === opt.value ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setPatternStyle(opt.value)}
                          className="text-xs"
                        >
                          {opt.label}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {brandColors.length > 0 && (
                    <div>
                      <Label className="text-xs text-muted-foreground">Brand colors will be used:</Label>
                      <div className="flex gap-1.5 mt-1">
                        {brandColors.slice(0, 8).map(c => (
                          <div key={c.hex} className="w-6 h-6 rounded-full border border-border shadow-sm" style={{ backgroundColor: c.hex }} title={c.name} />
                        ))}
                      </div>
                    </div>
                  )}

                  <Button onClick={generateSeamlessPattern} disabled={isGenerating} className="w-full gap-2">
                    {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                    {isGenerating ? 'Generating...' : 'Generate Seamless Pattern'}
                  </Button>
                </div>
              </div>
            )}

            {/* ─── TILE PREVIEW ─── */}
            {currentStep === 'preview' && (
              <div className="space-y-4">
                {patterns.length === 0 ? (
                  <div className="text-center py-12">
                    <Eye className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground">Add patterns first from Templates, Create, or AI Generate steps</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-[200px_1fr] gap-6">
                    {/* Pattern selector */}
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold">Select Pattern</Label>
                      {patterns.map(p => (
                        <button
                          key={p.id}
                          onClick={() => setPreviewPatternId(p.id)}
                          className={`w-full text-left p-2 rounded-lg border transition-all flex items-center gap-2 ${
                            previewPattern?.id === p.id ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30'
                          }`}
                        >
                          <div
                            className="w-10 h-10 rounded-md border border-border shrink-0"
                            style={{ backgroundImage: `url(${p.url})`, backgroundSize: '20px', backgroundRepeat: 'repeat' }}
                          />
                          <span className="text-xs font-medium truncate">{p.name}</span>
                        </button>
                      ))}
                    </div>

                    {/* Tiling canvas */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-4">
                        <Label className="text-sm shrink-0">Tile Size</Label>
                        <ZoomOut className="h-4 w-4 text-muted-foreground shrink-0" />
                        <Slider
                          value={[tileScale]}
                          onValueChange={([v]) => setTileScale(v)}
                          min={16}
                          max={200}
                          step={4}
                          className="flex-1"
                        />
                        <ZoomIn className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="text-xs text-muted-foreground w-12 text-right">{tileScale}px</span>
                      </div>

                      {previewPattern && (
                        <div
                          className="w-full h-[400px] rounded-xl border border-border overflow-hidden"
                          style={{
                            backgroundImage: `url(${previewPattern.url})`,
                            backgroundSize: `${tileScale}px ${tileScale}px`,
                            backgroundRepeat: 'repeat',
                          }}
                        />
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ─── EXPORT ─── */}
            {currentStep === 'export' && (
              <div className="space-y-4">
                {patterns.length === 0 ? (
                  <div className="text-center py-12">
                    <Package className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground">No patterns to export yet.</p>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">{patterns.length} Pattern{patterns.length !== 1 ? 's' : ''} Ready</h3>
                        <p className="text-sm text-muted-foreground">Download tiled patterns at high resolution</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Select value={exportSize} onValueChange={setExportSize}>
                          <SelectTrigger className="w-[140px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="512">512 × 512</SelectItem>
                            <SelectItem value="1024">1024 × 1024</SelectItem>
                            <SelectItem value="2048">2048 × 2048</SelectItem>
                            <SelectItem value="4096">4096 × 4096</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button onClick={downloadAll} variant="outline" className="gap-2">
                          <Package className="h-4 w-4" /> Export All
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                      {patterns.map(p => (
                        <Card key={p.id} className="group relative">
                          <CardContent className="p-3">
                            <div
                              className="aspect-square rounded-lg mb-2 overflow-hidden border border-border"
                              style={{
                                backgroundImage: `url(${p.url})`,
                                backgroundSize: '48px 48px',
                                backgroundRepeat: 'repeat',
                              }}
                            />
                            <p className="text-xs font-medium truncate mb-2">{p.name}</p>
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => downloadPatternTiled(p, parseInt(exportSize))}
                                className="flex-1 text-xs gap-1 h-7"
                              >
                                <Download className="h-3 w-3" /> PNG
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => deletePattern(p.id)}
                                className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                              >
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

        {/* Navigation Footer */}
        <div className="px-6 py-3 border-t border-border flex items-center justify-between bg-muted/10">
          <Button variant="ghost" onClick={goPrev} disabled={stepIndex === 0} className="gap-1">
            <ChevronLeft className="h-4 w-4" /> Back
          </Button>
          <p className="text-xs text-muted-foreground">
            Step {stepIndex + 1} of {STEPS.length}
          </p>
          {stepIndex < STEPS.length - 1 ? (
            <Button onClick={goNext} className="gap-1">
              Next <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={() => onOpenChange(false)}>Done</Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
