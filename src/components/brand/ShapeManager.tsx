import { useState, useMemo } from 'react';
import { Plus, Sparkles, Loader2, Trash2, Download, Eye, Code, Copy, Check, Wand2, Search, Filter, X, Library } from 'lucide-react';
import DOMPurify from 'dompurify';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { CustomDesignShape, BrandColor } from '@/types/brand';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { SHAPE_LIBRARY, SHAPE_INDUSTRIES, SHAPE_CATEGORIES, type LibraryShape } from '@/data/shapeLibrary';

// SVG sanitization config to prevent XSS attacks
const SVG_SANITIZE_CONFIG = {
  USE_PROFILES: { svg: true, svgFilters: true },
  FORBID_TAGS: ['script', 'foreignObject'],
  FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur'],
};

const sanitizeSvg = (svg: string): string => {
  return DOMPurify.sanitize(svg, SVG_SANITIZE_CONFIG);
};

// Example SVG templates for manual tab
const SVG_TEMPLATES = [
  {
    name: 'Basic Circle',
    description: 'Simple circle with solid fill',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><circle cx="50" cy="50" r="40" fill="#4F46E5"/></svg>`,
  },
  {
    name: 'Gradient Rectangle',
    description: 'Rounded rectangle with gradient',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 80" width="120" height="80"><defs><linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#6366F1"/><stop offset="100%" stop-color="#A855F7"/></linearGradient></defs><rect x="10" y="10" width="100" height="60" rx="12" fill="url(#grad1)"/></svg>`,
  },
  {
    name: 'Star Shape',
    description: '5-pointed star polygon',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><polygon points="50,5 61,40 98,40 68,62 79,97 50,75 21,97 32,62 2,40 39,40" fill="#F59E0B"/></svg>`,
  },
  {
    name: 'Soft Blob',
    description: 'Organic blob shape with path',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><path d="M50 10 C80 15, 95 35, 90 55 C85 75, 70 90, 45 88 C20 86, 8 70, 12 50 C16 30, 25 8, 50 10 Z" fill="#10B981"/></svg>`,
  },
  {
    name: 'Badge with Stroke',
    description: 'Hexagon with border',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><polygon points="50,5 90,27.5 90,72.5 50,95 10,72.5 10,27.5" fill="#1E293B" stroke="#3B82F6" stroke-width="3"/></svg>`,
  },
  {
    name: 'Radial Gradient',
    description: 'Circle with radial glow',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><defs><radialGradient id="radial1" cx="30%" cy="30%"><stop offset="0%" stop-color="#60A5FA"/><stop offset="100%" stop-color="#1E40AF"/></radialGradient></defs><circle cx="50" cy="50" r="40" fill="url(#radial1)"/></svg>`,
  },
];

const STYLE_OPTIONS = [
  { value: 'geometric', label: 'Geometric', description: 'Sharp, precise shapes' },
  { value: 'organic', label: 'Organic', description: 'Flowing, natural forms' },
  { value: 'minimal', label: 'Minimal', description: 'Simple, clean designs' },
  { value: 'layered', label: 'Layered', description: 'Depth with overlays' },
  { value: 'abstract', label: 'Abstract', description: 'Creative, artistic' },
];

// Template card component
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
            dangerouslySetInnerHTML={{ __html: sanitizeSvg(template.svg) }}
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

// Library shape card component
const LibraryShapeCard = ({
  shape,
  isAdded,
  onAdd,
}: {
  shape: LibraryShape;
  isAdded: boolean;
  onAdd: (shape: LibraryShape) => void;
}) => {
  return (
    <Card 
      className={`group cursor-pointer transition-all ${isAdded ? 'border-primary/50 bg-primary/5' : 'hover:border-primary/30 hover:shadow-sm'}`}
      onClick={() => !isAdded && onAdd(shape)}
    >
      <CardContent className="p-2.5">
        <div 
          className="aspect-square flex items-center justify-center bg-muted/30 rounded-md mb-1.5 overflow-hidden p-1 [&>svg]:max-w-full [&>svg]:max-h-full"
          dangerouslySetInnerHTML={{ __html: sanitizeSvg(shape.svg) }}
        />
        <div className="flex items-center justify-between gap-1">
          <div className="min-w-0">
            <p className="text-[11px] font-medium truncate leading-tight">{shape.name}</p>
            <div className="flex items-center gap-1 mt-0.5">
              <Badge variant="secondary" className="text-[9px] px-1 py-0 h-3.5">
                {shape.category}
              </Badge>
            </div>
          </div>
          {isAdded && (
            <Check className="h-3.5 w-3.5 text-primary shrink-0" />
          )}
        </div>
      </CardContent>
    </Card>
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
  const [activeTab, setActiveTab] = useState<'library' | 'generate' | 'manual'>('library');
  const [isGenerating, setIsGenerating] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState<string>('geometric');
  const [previewShape, setPreviewShape] = useState<CustomDesignShape | null>(null);
  
  // Library filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  
  // Manual SVG state
  const [manualName, setManualName] = useState('');
  const [manualSvg, setManualSvg] = useState('');
  const [manualCategory, setManualCategory] = useState<string>('custom');
  const [svgPreviewError, setSvgPreviewError] = useState<string | null>(null);

  // Filtered library shapes
  const filteredShapes = useMemo(() => {
    let results = SHAPE_LIBRARY;
    
    if (selectedIndustry !== 'all') {
      results = results.filter(s => s.industry === selectedIndustry);
    }
    if (selectedCategory !== 'all') {
      results = results.filter(s => s.category === selectedCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      results = results.filter(s =>
        s.name.toLowerCase().includes(q) ||
        s.tags.some(t => t.includes(q)) ||
        s.category.toLowerCase().includes(q) ||
        s.industry.toLowerCase().includes(q)
      );
    }
    
    return results;
  }, [searchQuery, selectedIndustry, selectedCategory]);

  // Count shapes per industry for badges
  const industryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    SHAPE_LIBRARY.forEach(s => {
      counts[s.industry] = (counts[s.industry] || 0) + 1;
    });
    counts['all'] = SHAPE_LIBRARY.length;
    return counts;
  }, []);

  const addLibraryShape = (libShape: LibraryShape) => {
    const newShape: CustomDesignShape = {
      id: crypto.randomUUID(),
      name: libShape.name,
      type: 'custom',
      category: libShape.category,
      svg: libShape.svg,
    };
    onShapesChange([...shapes, newShape]);
    toast.success(`Added "${libShape.name}" to your shapes`);
  };

  const isShapeAdded = (libShape: LibraryShape) => {
    return shapes.some(s => s.name === libShape.name);
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

  const validateSvg = (svg: string): boolean => {
    if (!svg.trim()) {
      setSvgPreviewError('Please enter SVG code');
      return false;
    }
    const trimmed = svg.trim();
    if (!trimmed.startsWith('<svg') || !trimmed.includes('</svg>')) {
      setSvgPreviewError('Invalid SVG: must start with <svg and end with </svg>');
      return false;
    }
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

  const handleSvgChange = (value: string) => {
    setManualSvg(value);
    if (value.trim()) {
      validateSvg(value);
    } else {
      setSvgPreviewError(null);
    }
  };

  const prettifySvg = () => {
    if (!manualSvg.trim()) return;
    try {
      let formatted = manualSvg.trim();
      formatted = formatted.replace(/>\s+</g, '><');
      formatted = formatted.replace(/\s+/g, ' ');
      formatted = formatted.replace(/>(?!<\/)/g, '>\n');
      formatted = formatted.replace(/<\//g, '\n</');
      const lines = formatted.split('\n').filter(line => line.trim());
      let indentLevel = 0;
      const indentSize = 2;
      const indentedLines = lines.map(line => {
        const trimmedLine = line.trim();
        if (trimmedLine.startsWith('</')) {
          indentLevel = Math.max(0, indentLevel - 1);
        }
        const indent = ' '.repeat(indentLevel * indentSize);
        const result = indent + trimmedLine;
        if (
          trimmedLine.startsWith('<') && 
          !trimmedLine.startsWith('</') && 
          !trimmedLine.endsWith('/>') &&
          !trimmedLine.includes('</')
        ) {
          indentLevel++;
        }
        return result;
      });
      setManualSvg(indentedLines.join('\n'));
      toast.success('SVG formatted');
    } catch {
      toast.error('Could not format SVG');
    }
  };

  const hasActiveFilters = searchQuery.trim() || selectedIndustry !== 'all' || selectedCategory !== 'all';

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedIndustry('all');
    setSelectedCategory('all');
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          Manage Shapes
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-3">
          <DialogTitle className="flex items-center gap-2">
            <Library className="h-5 w-5 text-primary" />
            Design Shape Manager
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)} className="flex-1 flex flex-col min-h-0">
          <div className="px-6 pb-3">
            <TabsList className="grid grid-cols-3 w-full max-w-md">
              <TabsTrigger value="library" className="gap-1.5">
                <Search className="h-3.5 w-3.5" />
                Shape Library
              </TabsTrigger>
              <TabsTrigger value="manual" className="gap-1.5">
                <Code className="h-3.5 w-3.5" />
                Manual SVG
              </TabsTrigger>
              <TabsTrigger value="generate" className="gap-1.5">
                <Sparkles className="h-3.5 w-3.5" />
                AI Generate
              </TabsTrigger>
            </TabsList>
          </div>

          {/* ─── LIBRARY TAB ─── */}
          <TabsContent value="library" className="flex-1 min-h-0 flex flex-col m-0 data-[state=inactive]:hidden">
            {/* Search & Filters */}
            <div className="px-6 pb-3 space-y-3 border-b">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search shapes by name, tag, or keyword..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-8"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Filter className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <Select value={selectedIndustry} onValueChange={setSelectedIndustry}>
                  <SelectTrigger className="h-8 text-xs flex-1">
                    <SelectValue placeholder="Industry" />
                  </SelectTrigger>
                  <SelectContent>
                    {SHAPE_INDUSTRIES.map(ind => (
                      <SelectItem key={ind.value} value={ind.value}>
                        <span className="flex items-center gap-2">
                          {ind.label}
                          <Badge variant="secondary" className="text-[9px] px-1 py-0 h-3.5 ml-auto">
                            {industryCounts[ind.value] || 0}
                          </Badge>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="h-8 text-xs flex-1">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {SHAPE_CATEGORIES.map(cat => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {hasActiveFilters && (
                  <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8 text-xs gap-1 shrink-0">
                    <X className="h-3 w-3" />
                    Clear
                  </Button>
                )}
              </div>
              <div className="text-xs text-muted-foreground">
                {filteredShapes.length} shape{filteredShapes.length !== 1 ? 's' : ''} found
                {hasActiveFilters && ` (${SHAPE_LIBRARY.length} total)`}
              </div>
            </div>

            {/* Shape Grid */}
            <ScrollArea className="flex-1">
              <div className="p-6">
                {filteredShapes.length > 0 ? (
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2.5">
                    {filteredShapes.map((shape) => (
                      <LibraryShapeCard
                        key={shape.id}
                        shape={shape}
                        isAdded={isShapeAdded(shape)}
                        onAdd={addLibraryShape}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <Search className="h-8 w-8 mx-auto mb-3 opacity-40" />
                    <p className="text-sm font-medium">No shapes match your filters</p>
                    <p className="text-xs mt-1">Try adjusting your search or clearing filters</p>
                    <Button variant="outline" size="sm" onClick={clearFilters} className="mt-3">
                      Clear all filters
                    </Button>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* ─── MANUAL SVG TAB ─── */}
          <TabsContent value="manual" className="flex-1 min-h-0 m-0 data-[state=inactive]:hidden">
            <ScrollArea className="h-full">
              <div className="p-6 space-y-4">
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
                    <div className="flex items-center justify-between">
                      <Label>SVG Code</Label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={prettifySvg}
                        disabled={!manualSvg.trim()}
                        className="h-7 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                      >
                        <Wand2 className="h-3.5 w-3.5" />
                        Prettify
                      </Button>
                    </div>
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
                        dangerouslySetInnerHTML={{ __html: sanitizeSvg(manualSvg) }}
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
            </ScrollArea>
          </TabsContent>

          {/* ─── AI GENERATE TAB ─── */}
          <TabsContent value="generate" className="flex-1 min-h-0 m-0 data-[state=inactive]:hidden">
            <ScrollArea className="h-full">
              <div className="p-6 space-y-4">
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
            </ScrollArea>
          </TabsContent>
        </Tabs>

        {/* Current Shapes */}
        {shapes.length > 0 && (
          <div className="border-t px-6 py-4">
            <h4 className="text-sm font-medium mb-3">Your Custom Shapes ({shapes.length})</h4>
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
              {shapes.map(shape => (
                <div 
                  key={shape.id} 
                  className="group relative bg-muted/30 rounded-lg p-2 border border-border hover:border-primary/30 transition-all"
                >
                  <div 
                    className="aspect-square flex items-center justify-center overflow-hidden [&>svg]:max-w-full [&>svg]:max-h-full"
                    dangerouslySetInnerHTML={{ __html: sanitizeSvg(shape.svg) }}
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
                className="aspect-square max-h-[300px] flex items-center justify-center bg-muted/30 rounded-xl p-8 border border-border [&>svg]:max-w-full [&>svg]:max-h-full"
                dangerouslySetInnerHTML={{ __html: sanitizeSvg(previewShape.svg) }}
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
