import { useState } from 'react';
import { Download, ChevronUp, Square, MessageCircle, Waves, Eye, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';

// Design element color variants based on GlobalLink brand colors
const COLOR_VARIANTS = [
  { id: 'teal', name: 'Teal', gradient: 'from-teal-400 to-emerald-500', colors: ['#2dd4bf', '#10b981'] },
  { id: 'sunset', name: 'Sunset', gradient: 'from-yellow-300 via-pink-400 to-pink-500', colors: ['#fde047', '#f472b6', '#ec4899'] },
  { id: 'rainbow', name: 'Rainbow', gradient: 'from-yellow-400 via-pink-500 to-purple-600', colors: ['#facc15', '#ec4899', '#9333ea'] },
  { id: 'purple', name: 'Purple', gradient: 'from-purple-400 to-blue-500', colors: ['#c084fc', '#3b82f6'] },
  { id: 'navy', name: 'Navy', gradient: 'from-slate-700 to-slate-900', colors: ['#334155', '#0f172a'] },
];

interface DesignElement {
  id: string;
  name: string;
  type: 'speech-bubble' | 'chevron' | 'frame' | 'wave';
  variant: typeof COLOR_VARIANTS[number];
  svg: string;
}

// Generate SVG strings for each element type
const generateSpeechBubbleSVG = (colors: string[]): string => {
  const gradientId = `grad-${Math.random().toString(36).slice(2, 9)}`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
  <defs>
    <linearGradient id="${gradientId}" x1="0%" y1="0%" x2="100%" y2="100%">
      ${colors.map((c, i) => `<stop offset="${(i / (colors.length - 1)) * 100}%" stop-color="${c}"/>`).join('')}
    </linearGradient>
  </defs>
  <path d="M50 10 C25 10, 10 25, 10 45 C10 65, 25 80, 50 80 C55 80, 60 79, 64 77 L75 90 L72 75 C82 70, 90 58, 90 45 C90 25, 75 10, 50 10 Z" fill="url(#${gradientId})"/>
</svg>`;
};

const generateChevronSVG = (colors: string[]): string => {
  const gradientId = `grad-${Math.random().toString(36).slice(2, 9)}`;
  const lines = [];
  for (let i = 0; i < 30; i++) {
    const y = 10 + i * 2.5;
    lines.push(`<path d="M10 ${y + 35} L50 ${y} L90 ${y + 35}" fill="none" stroke="url(#${gradientId})" stroke-width="0.8" opacity="${0.3 + (i / 30) * 0.7}"/>`);
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
  <defs>
    <linearGradient id="${gradientId}" x1="0%" y1="0%" x2="100%" y2="100%">
      ${colors.map((c, i) => `<stop offset="${(i / (colors.length - 1)) * 100}%" stop-color="${c}"/>`).join('')}
    </linearGradient>
  </defs>
  ${lines.join('\n  ')}
</svg>`;
};

const generateFrameSVG = (colors: string[]): string => {
  const gradientId = `grad-${Math.random().toString(36).slice(2, 9)}`;
  const glowId = `glow-${Math.random().toString(36).slice(2, 9)}`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
  <defs>
    <linearGradient id="${gradientId}" x1="0%" y1="0%" x2="100%" y2="100%">
      ${colors.map((c, i) => `<stop offset="${(i / (colors.length - 1)) * 100}%" stop-color="${c}"/>`).join('')}
    </linearGradient>
    <filter id="${glowId}" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="3" result="blur"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
  <rect x="10" y="10" width="80" height="80" fill="none" stroke="url(#${gradientId})" stroke-width="2" rx="4" filter="url(#${glowId})"/>
</svg>`;
};

const generateWaveSVG = (colors: string[]): string => {
  const gradientId = `grad-${Math.random().toString(36).slice(2, 9)}`;
  const paths = [];
  for (let i = 0; i < 12; i++) {
    const y = 20 + i * 5;
    const amplitude = 8 + Math.sin(i * 0.5) * 4;
    const frequency = 2 + Math.cos(i * 0.3) * 0.5;
    const phase = i * 15;
    // Generate wave path
    let d = `M 0 ${y}`;
    for (let x = 0; x <= 200; x += 2) {
      const yOffset = Math.sin((x + phase) * frequency * Math.PI / 180) * amplitude;
      d += ` L ${x} ${y + yOffset}`;
    }
    paths.push(`<path d="${d}" fill="none" stroke="url(#${gradientId})" stroke-width="0.6" opacity="${0.4 + (i / 12) * 0.6}"/>`);
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 80" width="200" height="80">
  <defs>
    <linearGradient id="${gradientId}" x1="0%" y1="0%" x2="100%" y2="0%">
      ${colors.map((c, i) => `<stop offset="${(i / (colors.length - 1)) * 100}%" stop-color="${c}"/>`).join('')}
    </linearGradient>
  </defs>
  ${paths.join('\n  ')}
</svg>`;
};

// Generate all design elements
const generateElements = (): DesignElement[] => {
  const elements: DesignElement[] = [];
  
  COLOR_VARIANTS.forEach(variant => {
    elements.push({
      id: `speech-${variant.id}`,
      name: `Speech Bubble - ${variant.name}`,
      type: 'speech-bubble',
      variant,
      svg: generateSpeechBubbleSVG(variant.colors),
    });
    elements.push({
      id: `chevron-${variant.id}`,
      name: `Chevron Arrow - ${variant.name}`,
      type: 'chevron',
      variant,
      svg: generateChevronSVG(variant.colors),
    });
    elements.push({
      id: `frame-${variant.id}`,
      name: `Glow Frame - ${variant.name}`,
      type: 'frame',
      variant,
      svg: generateFrameSVG(variant.colors),
    });
    elements.push({
      id: `wave-${variant.id}`,
      name: `Wave Pattern - ${variant.name}`,
      type: 'wave',
      variant,
      svg: generateWaveSVG(variant.colors),
    });
  });
  
  return elements;
};

const DESIGN_ELEMENTS = generateElements();

interface DesignElementsSectionProps {
  canEdit?: boolean;
}

export const DesignElementsSection = ({ canEdit = false }: DesignElementsSectionProps) => {
  const [selectedElement, setSelectedElement] = useState<DesignElement | null>(null);
  const [downloadedIds, setDownloadedIds] = useState<Set<string>>(new Set());

  const downloadAsSVG = (element: DesignElement) => {
    const blob = new Blob([element.svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${element.id}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setDownloadedIds(prev => new Set(prev).add(element.id));
    toast.success(`Downloaded ${element.name} as SVG`);
  };

  const downloadAsPNG = async (element: DesignElement, size: number = 512) => {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = element.type === 'wave' ? size / 2.5 : size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    const svgBlob = new Blob([element.svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(svgBlob);

    img.onload = () => {
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const pngUrl = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = pngUrl;
      a.download = `${element.id}-${size}px.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setDownloadedIds(prev => new Set(prev).add(element.id));
      toast.success(`Downloaded ${element.name} as PNG (${size}px)`);
    };
    img.src = url;
  };

  const getElementsByType = (type: DesignElement['type']) => 
    DESIGN_ELEMENTS.filter(el => el.type === type);

  const renderElementCard = (element: DesignElement) => (
    <Card 
      key={element.id} 
      className="group relative overflow-hidden border-border/50 hover:border-primary/30 transition-all cursor-pointer"
      onClick={() => setSelectedElement(element)}
    >
      <CardContent className="p-4">
        <div 
          className="aspect-square flex items-center justify-center bg-muted/30 rounded-lg mb-3 overflow-hidden"
          dangerouslySetInnerHTML={{ __html: element.svg }}
        />
        <div className="flex items-center justify-between">
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{element.variant.name}</p>
            <Badge variant="secondary" className="text-xs mt-1">
              {element.type.replace('-', ' ')}
            </Badge>
          </div>
          {downloadedIds.has(element.id) && (
            <Check className="h-4 w-4 text-green-500 shrink-0" />
          )}
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-4">
          <Button size="sm" variant="secondary" className="gap-1.5">
            <Eye className="h-3.5 w-3.5" />
            Preview
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const TypeIcon = {
    'speech-bubble': MessageCircle,
    'chevron': ChevronUp,
    'frame': Square,
    'wave': Waves,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Design Elements</h3>
          <p className="text-sm text-muted-foreground">
            Downloadable brand assets in SVG and PNG formats
          </p>
        </div>
        <Badge variant="outline" className="gap-1">
          <Download className="h-3 w-3" />
          {DESIGN_ELEMENTS.length} assets
        </Badge>
      </div>

      <Tabs defaultValue="speech-bubble" className="w-full">
        <TabsList className="grid grid-cols-4 w-full max-w-lg">
          {(['speech-bubble', 'chevron', 'frame', 'wave'] as const).map(type => {
            const Icon = TypeIcon[type];
            return (
              <TabsTrigger key={type} value={type} className="gap-1.5 text-xs">
                <Icon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline capitalize">{type.replace('-', ' ')}s</span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        {(['speech-bubble', 'chevron', 'frame', 'wave'] as const).map(type => (
          <TabsContent key={type} value={type} className="mt-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
              {getElementsByType(type).map(renderElementCard)}
            </div>
          </TabsContent>
        ))}
      </Tabs>

      {/* Preview/Download Dialog */}
      <Dialog open={!!selectedElement} onOpenChange={(open) => !open && setSelectedElement(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedElement?.name}</DialogTitle>
          </DialogHeader>
          
          {selectedElement && (
            <div className="space-y-4">
              {/* Large Preview */}
              <div 
                className="aspect-square max-h-[300px] flex items-center justify-center bg-muted/30 rounded-xl p-8 border border-border"
                dangerouslySetInnerHTML={{ __html: selectedElement.svg }}
              />

              {/* Color Info */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Colors:</span>
                <div className="flex gap-1">
                  {selectedElement.variant.colors.map((color, i) => (
                    <div
                      key={i}
                      className="w-6 h-6 rounded-full border border-border"
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
                <span className="text-xs text-muted-foreground ml-2">
                  {selectedElement.variant.colors.join(', ')}
                </span>
              </div>

              {/* Download Buttons */}
              <div className="space-y-2">
                <p className="text-sm font-medium">Download Options</p>
                <div className="grid grid-cols-2 gap-2">
                  <Button 
                    variant="outline" 
                    className="gap-2"
                    onClick={() => downloadAsSVG(selectedElement)}
                  >
                    <Download className="h-4 w-4" />
                    SVG (Vector)
                  </Button>
                  <Button 
                    variant="outline"
                    className="gap-2"
                    onClick={() => downloadAsPNG(selectedElement, 512)}
                  >
                    <Download className="h-4 w-4" />
                    PNG 512px
                  </Button>
                  <Button 
                    variant="outline"
                    className="gap-2"
                    onClick={() => downloadAsPNG(selectedElement, 1024)}
                  >
                    <Download className="h-4 w-4" />
                    PNG 1024px
                  </Button>
                  <Button 
                    variant="outline"
                    className="gap-2"
                    onClick={() => downloadAsPNG(selectedElement, 2048)}
                  >
                    <Download className="h-4 w-4" />
                    PNG 2048px
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
