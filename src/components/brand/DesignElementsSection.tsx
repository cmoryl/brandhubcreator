import { useState, useMemo } from 'react';
import { Download, ChevronUp, Square, MessageCircle, Waves, Eye, Check, RectangleHorizontal, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { BrandColor } from '@/types/brand';

interface ColorVariant {
  id: string;
  name: string;
  gradient: string;
  colors: string[];
}

// Default fallback variants if no brand colors provided
const DEFAULT_VARIANTS: ColorVariant[] = [
  { id: 'teal', name: 'Teal', gradient: 'from-teal-400 to-emerald-500', colors: ['#2dd4bf', '#10b981'] },
  { id: 'sunset', name: 'Sunset', gradient: 'from-yellow-300 via-pink-400 to-pink-500', colors: ['#fde047', '#f472b6', '#ec4899'] },
  { id: 'rainbow', name: 'Rainbow', gradient: 'from-yellow-400 via-pink-500 to-purple-600', colors: ['#facc15', '#ec4899', '#9333ea'] },
  { id: 'purple', name: 'Purple', gradient: 'from-purple-400 to-blue-500', colors: ['#c084fc', '#3b82f6'] },
  { id: 'navy', name: 'Navy', gradient: 'from-slate-700 to-slate-900', colors: ['#334155', '#0f172a'] },
];

// Generate brand-based color variants from brand colors
const generateBrandVariants = (brandColors: BrandColor[]): ColorVariant[] => {
  if (!brandColors || brandColors.length === 0) return DEFAULT_VARIANTS;

  const variants: ColorVariant[] = [];
  const sortedColors = [...brandColors];

  // Primary variant - uses primary color with a lighter shade
  const primaryColor = sortedColors.find(c => c.role === 'primary') || sortedColors[0];
  if (primaryColor) {
    variants.push({
      id: 'brand-primary',
      name: primaryColor.name || 'Primary',
      gradient: `from-[${primaryColor.hex}] to-[${adjustBrightness(primaryColor.hex, 30)}]`,
      colors: [primaryColor.hex, adjustBrightness(primaryColor.hex, 30)],
    });
  }

  // Secondary variant - uses secondary color or second color
  const secondaryColor = sortedColors.find(c => c.role === 'secondary') || sortedColors[1];
  if (secondaryColor && secondaryColor !== primaryColor) {
    variants.push({
      id: 'brand-secondary',
      name: secondaryColor.name || 'Secondary',
      gradient: `from-[${secondaryColor.hex}] to-[${adjustBrightness(secondaryColor.hex, 20)}]`,
      colors: [secondaryColor.hex, adjustBrightness(secondaryColor.hex, 20)],
    });
  }

  // Accent variant - uses accent color or third color
  const accentColor = sortedColors.find(c => c.role === 'accent') || sortedColors[2];
  if (accentColor && accentColor !== primaryColor && accentColor !== secondaryColor) {
    variants.push({
      id: 'brand-accent',
      name: accentColor.name || 'Accent',
      gradient: `from-[${accentColor.hex}] to-[${adjustBrightness(accentColor.hex, 25)}]`,
      colors: [accentColor.hex, adjustBrightness(accentColor.hex, 25)],
    });
  }

  // Gradient combo - primary to secondary
  if (primaryColor && secondaryColor && primaryColor !== secondaryColor) {
    variants.push({
      id: 'brand-gradient',
      name: 'Brand Gradient',
      gradient: `from-[${primaryColor.hex}] to-[${secondaryColor.hex}]`,
      colors: [primaryColor.hex, secondaryColor.hex],
    });
  }

  // Multi-color variant if we have 3+ colors
  if (sortedColors.length >= 3) {
    const top3 = sortedColors.slice(0, 3);
    variants.push({
      id: 'brand-spectrum',
      name: 'Brand Spectrum',
      gradient: `from-[${top3[0].hex}] via-[${top3[1].hex}] to-[${top3[2].hex}]`,
      colors: top3.map(c => c.hex),
    });
  }

  // Ensure we have at least some variants
  return variants.length > 0 ? variants : DEFAULT_VARIANTS;
};

// Helper to adjust color brightness
const adjustBrightness = (hex: string, percent: number): string => {
  const num = parseInt(hex.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.min(255, Math.max(0, (num >> 16) + amt));
  const G = Math.min(255, Math.max(0, (num >> 8 & 0x00FF) + amt));
  const B = Math.min(255, Math.max(0, (num & 0x0000FF) + amt));
  return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
};

interface DesignElement {
  id: string;
  name: string;
  type: 'speech-bubble' | 'chevron' | 'frame' | 'wave' | 'rounded-rect' | 'layered-rect';
  variant: ColorVariant;
  svg: string;
}

// Generate asymmetric rounded rectangle SVG (one corner different)
const generateRoundedRectSVG = (colors: string[]): string => {
  const gradientId = `grad-${Math.random().toString(36).slice(2, 9)}`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
  <defs>
    <linearGradient id="${gradientId}" x1="0%" y1="0%" x2="100%" y2="100%">
      ${colors.map((c, i) => `<stop offset="${(i / (colors.length - 1)) * 100}%" stop-color="${c}"/>`).join('')}
    </linearGradient>
  </defs>
  <path d="M8 10 Q10 10, 10 10 L90 10 Q90 10, 90 12 L90 70 Q90 90, 70 90 L30 90 Q10 90, 10 70 L10 30 Q10 10, 30 10 Z" fill="url(#${gradientId})"/>
</svg>`;
};

// Generate layered/nested rounded rectangles SVG
const generateLayeredRectSVG = (colors: string[]): string => {
  const gradientId1 = `grad1-${Math.random().toString(36).slice(2, 9)}`;
  const gradientId2 = `grad2-${Math.random().toString(36).slice(2, 9)}`;
  const gradientId3 = `grad3-${Math.random().toString(36).slice(2, 9)}`;
  
  // Create color variations for the layers
  const baseColor = colors[0];
  const endColor = colors[colors.length - 1] || colors[0];
  
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 90" width="120" height="90">
  <defs>
    <linearGradient id="${gradientId1}" x1="0%" y1="0%" x2="100%" y2="100%">
      ${colors.map((c, i) => `<stop offset="${(i / (colors.length - 1)) * 100}%" stop-color="${c}"/>`).join('')}
    </linearGradient>
    <linearGradient id="${gradientId2}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${baseColor}" stop-opacity="0.6"/>
      <stop offset="100%" stop-color="${endColor}" stop-opacity="0.6"/>
    </linearGradient>
    <linearGradient id="${gradientId3}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${baseColor}" stop-opacity="0.3"/>
      <stop offset="100%" stop-color="${endColor}" stop-opacity="0.3"/>
    </linearGradient>
  </defs>
  <!-- Back layer (largest, offset) -->
  <rect x="10" y="15" width="100" height="65" rx="20" ry="20" fill="url(#${gradientId1})"/>
  <!-- Middle layer -->
  <rect x="15" y="12" width="92" height="58" rx="16" ry="16" fill="url(#${gradientId2})"/>
  <!-- Front layer (smallest, innermost) -->
  <rect x="22" y="8" width="82" height="48" rx="12" ry="12" fill="url(#${gradientId3})"/>
</svg>`;
};

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

// Generate all design elements for given variants
const generateElements = (variants: ColorVariant[]): DesignElement[] => {
  const elements: DesignElement[] = [];
  
  variants.forEach(variant => {
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
    elements.push({
      id: `rounded-rect-${variant.id}`,
      name: `Rounded Rectangle - ${variant.name}`,
      type: 'rounded-rect',
      variant,
      svg: generateRoundedRectSVG(variant.colors),
    });
    elements.push({
      id: `layered-rect-${variant.id}`,
      name: `Layered Rectangle - ${variant.name}`,
      type: 'layered-rect',
      variant,
      svg: generateLayeredRectSVG(variant.colors),
    });
  });
  
  return elements;
};

interface DesignElementsSectionProps {
  canEdit?: boolean;
  brandColors?: BrandColor[];
  brandSlug?: string;
}

export const DesignElementsSection = ({ canEdit = false, brandColors, brandSlug }: DesignElementsSectionProps) => {
  const [selectedElement, setSelectedElement] = useState<DesignElement | null>(null);
  const [downloadedIds, setDownloadedIds] = useState<Set<string>>(new Set());

  // Generate elements based on brand colors
  const colorVariants = useMemo(() => generateBrandVariants(brandColors || []), [brandColors]);
  const designElements = useMemo(() => generateElements(colorVariants), [colorVariants]);

  const hasBrandColors = brandColors && brandColors.length > 0;
  
  // Life Sciences brand gets additional custom shapes
  const isLifeSciences = brandSlug === 'life-sciences';
  
  // Define which element types to show (base types + Life Sciences custom shapes)
  const baseElementTypes: DesignElement['type'][] = ['speech-bubble', 'chevron', 'frame', 'wave'];
  const elementTypes: DesignElement['type'][] = isLifeSciences 
    ? [...baseElementTypes, 'rounded-rect', 'layered-rect']
    : baseElementTypes;

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
    designElements.filter(el => el.type === type);

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
    'rounded-rect': RectangleHorizontal,
    'layered-rect': Layers,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Design Elements</h3>
          <p className="text-sm text-muted-foreground">
            {hasBrandColors 
              ? 'Brand-colored assets in SVG and PNG formats'
              : 'Downloadable brand assets in SVG and PNG formats'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {hasBrandColors && (
            <Badge variant="secondary" className="gap-1 bg-primary/10 text-primary border-primary/20">
              Brand Colors
            </Badge>
          )}
          <Badge variant="outline" className="gap-1">
            <Download className="h-3 w-3" />
            {designElements.length} assets
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="speech-bubble" className="w-full">
        <TabsList className={`grid w-full ${isLifeSciences ? 'grid-cols-6 max-w-2xl' : 'grid-cols-4 max-w-lg'}`}>
          {elementTypes.map(type => {
            const Icon = TypeIcon[type];
            const label = type === 'rounded-rect' ? 'Rounded' : type === 'layered-rect' ? 'Layered' : type.replace('-', ' ');
            return (
              <TabsTrigger key={type} value={type} className="gap-1.5 text-xs">
                <Icon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline capitalize">{label}s</span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        {elementTypes.map(type => (
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
