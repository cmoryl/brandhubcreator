/**
 * IconStudioColorizer - AI-powered icon color management
 * 
 * Features:
 * - AI-suggested color palettes based on brand colors
 * - Gradient fills (linear, radial, conic)
 * - Duotone and multi-color modes
 * - Direct application to library icons
 * - Live preview with multiple color modes
 */

import { useState, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Paintbrush,
  Sparkles,
  Loader2,
  RotateCcw,
  Copy,
  Check,
  Droplets,
  Sun,
  Circle,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { buildSvgString } from '@/lib/svgUtils';
import { BrandIconography } from '@/types/brand';
import { IconLibrary } from '@/hooks/useIconLibraries';
import { supabase } from '@/integrations/supabase/client';
import DOMPurify from 'dompurify';

interface IconStudioColorizerProps {
  brandColors: Array<{ hex: string; name: string }>;
  libraries: IconLibrary[];
  onSaveIcons: (icons: BrandIconography[], libraryId?: string) => void;
}

type ColorMode = 'solid' | 'linear-gradient' | 'radial-gradient' | 'duotone';

interface GradientStop {
  color: string;
  position: number; // 0-100
}

interface ColorConfig {
  mode: ColorMode;
  solidColor: string;
  gradientAngle: number;
  gradientStops: GradientStop[];
  duotonePrimary: string;
  duotoneSecondary: string;
  opacity: number;
}

interface AIPalette {
  name: string;
  description: string;
  colors: string[];
  gradients: Array<{ stops: GradientStop[]; angle: number; label: string }>;
}

const DEFAULT_CONFIG: ColorConfig = {
  mode: 'solid',
  solidColor: '#000000',
  gradientAngle: 135,
  gradientStops: [
    { color: '#6366f1', position: 0 },
    { color: '#8b5cf6', position: 100 },
  ],
  duotonePrimary: '#6366f1',
  duotoneSecondary: '#a5b4fc',
  opacity: 100,
};

const PRESET_GRADIENTS = [
  { name: 'Sunset', stops: [{ color: '#f97316', position: 0 }, { color: '#ef4444', position: 100 }], angle: 135 },
  { name: 'Ocean', stops: [{ color: '#06b6d4', position: 0 }, { color: '#3b82f6', position: 100 }], angle: 135 },
  { name: 'Forest', stops: [{ color: '#22c55e', position: 0 }, { color: '#14b8a6', position: 100 }], angle: 135 },
  { name: 'Purple Haze', stops: [{ color: '#8b5cf6', position: 0 }, { color: '#ec4899', position: 100 }], angle: 135 },
  { name: 'Gold', stops: [{ color: '#f59e0b', position: 0 }, { color: '#eab308', position: 50 }, { color: '#d97706', position: 100 }], angle: 135 },
  { name: 'Midnight', stops: [{ color: '#1e3a5f', position: 0 }, { color: '#4338ca', position: 100 }], angle: 180 },
  { name: 'Rose', stops: [{ color: '#f43f5e', position: 0 }, { color: '#fb7185', position: 50 }, { color: '#fda4af', position: 100 }], angle: 135 },
  { name: 'Emerald', stops: [{ color: '#059669', position: 0 }, { color: '#34d399', position: 100 }], angle: 180 },
];

/**
 * Generate a unique gradient ID for SVG defs
 */
const makeGradientId = (prefix: string, idx: number) => `colorizer-${prefix}-${idx}-${Date.now()}`;

/**
 * Build SVG fill CSS/attribute based on color config
 */
const buildColorizedSvg = (
  originalSvg: string,
  config: ColorConfig,
  gradientId: string
): string => {
  if (!originalSvg) return originalSvg;

   const normalizedSvg = buildSvgString({
    svgPath: originalSvg,
    fillMode: 'fill',
  });

  // Parse the SVG to modify it
  const parser = new DOMParser();
  const doc = parser.parseFromString(normalizedSvg, 'image/svg+xml');
  const svgEl = doc.querySelector('svg');
  if (!svgEl) return normalizedSvg;

  // Remove existing defs gradient definitions
  const existingDefs = svgEl.querySelector('defs');
  if (existingDefs) existingDefs.remove();

  const paths = svgEl.querySelectorAll('path, circle, rect, polygon, polyline, line, ellipse');

  if (config.mode === 'solid') {
    paths.forEach(p => {
      const hasStroke = p.getAttribute('stroke') && p.getAttribute('stroke') !== 'none';
      const hasFill = p.getAttribute('fill') && p.getAttribute('fill') !== 'none';
      if (hasStroke && !hasFill) {
        p.setAttribute('stroke', config.solidColor);
      } else {
        p.setAttribute('fill', config.solidColor);
        if (hasStroke) p.setAttribute('stroke', config.solidColor);
      }
      if (config.opacity < 100) {
        p.setAttribute('opacity', String(config.opacity / 100));
      }
    });
  } else if (config.mode === 'linear-gradient' || config.mode === 'radial-gradient') {
    // Create defs with gradient
    const defs = doc.createElementNS('http://www.w3.org/2000/svg', 'defs');
    
    if (config.mode === 'linear-gradient') {
      const grad = doc.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
      grad.setAttribute('id', gradientId);
      // Convert angle to x1/y1/x2/y2
      const rad = (config.gradientAngle - 90) * (Math.PI / 180);
      const x1 = Math.round((50 + Math.cos(rad + Math.PI) * 50));
      const y1 = Math.round((50 + Math.sin(rad + Math.PI) * 50));
      const x2 = Math.round((50 + Math.cos(rad) * 50));
      const y2 = Math.round((50 + Math.sin(rad) * 50));
      grad.setAttribute('x1', `${x1}%`);
      grad.setAttribute('y1', `${y1}%`);
      grad.setAttribute('x2', `${x2}%`);
      grad.setAttribute('y2', `${y2}%`);
      
      config.gradientStops.forEach(stop => {
        const s = doc.createElementNS('http://www.w3.org/2000/svg', 'stop');
        s.setAttribute('offset', `${stop.position}%`);
        s.setAttribute('stop-color', stop.color);
        grad.appendChild(s);
      });
      defs.appendChild(grad);
    } else {
      const grad = doc.createElementNS('http://www.w3.org/2000/svg', 'radialGradient');
      grad.setAttribute('id', gradientId);
      grad.setAttribute('cx', '50%');
      grad.setAttribute('cy', '50%');
      grad.setAttribute('r', '50%');
      
      config.gradientStops.forEach(stop => {
        const s = doc.createElementNS('http://www.w3.org/2000/svg', 'stop');
        s.setAttribute('offset', `${stop.position}%`);
        s.setAttribute('stop-color', stop.color);
        grad.appendChild(s);
      });
      defs.appendChild(grad);
    }
    
    svgEl.insertBefore(defs, svgEl.firstChild);
    
    paths.forEach(p => {
      p.setAttribute('fill', `url(#${gradientId})`);
      p.setAttribute('stroke', 'none');
      if (config.opacity < 100) {
        p.setAttribute('opacity', String(config.opacity / 100));
      }
    });
  } else if (config.mode === 'duotone') {
    // Duotone: primary on fill, secondary on stroke or vice versa
    paths.forEach((p, i) => {
      if (i % 2 === 0) {
        p.setAttribute('fill', config.duotonePrimary);
        p.setAttribute('stroke', 'none');
      } else {
        p.setAttribute('fill', config.duotoneSecondary);
        p.setAttribute('stroke', 'none');
      }
      if (config.opacity < 100) {
        p.setAttribute('opacity', String(config.opacity / 100));
      }
    });
    // If single path, use gradient as duotone
    if (paths.length === 1) {
      const defs = doc.createElementNS('http://www.w3.org/2000/svg', 'defs');
      const grad = doc.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
      grad.setAttribute('id', gradientId);
      grad.setAttribute('x1', '0%');
      grad.setAttribute('y1', '0%');
      grad.setAttribute('x2', '100%');
      grad.setAttribute('y2', '100%');
      const s1 = doc.createElementNS('http://www.w3.org/2000/svg', 'stop');
      s1.setAttribute('offset', '0%');
      s1.setAttribute('stop-color', config.duotonePrimary);
      const s2 = doc.createElementNS('http://www.w3.org/2000/svg', 'stop');
      s2.setAttribute('offset', '100%');
      s2.setAttribute('stop-color', config.duotoneSecondary);
      grad.appendChild(s1);
      grad.appendChild(s2);
      defs.appendChild(grad);
      svgEl.insertBefore(defs, svgEl.firstChild);
      paths[0].setAttribute('fill', `url(#${gradientId})`);
    }
  }

  return new XMLSerializer().serializeToString(svgEl);
};

export const IconStudioColorizer = ({
  brandColors,
  libraries,
  onSaveIcons,
}: IconStudioColorizerProps) => {
  const [colorConfig, setColorConfig] = useState<ColorConfig>({
    ...DEFAULT_CONFIG,
    solidColor: brandColors[0]?.hex || '#000000',
  });
  const [selectedIconIds, setSelectedIconIds] = useState<Set<string>>(new Set());
  const [selectedLibraryId, setSelectedLibraryId] = useState('');
  const [activeColorTab, setActiveColorTab] = useState<string>('solid');
  const [isGeneratingPalettes, setIsGeneratingPalettes] = useState(false);
  const [aiPalettes, setAiPalettes] = useState<AIPalette[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // All icons from all libraries
  const allIcons = useMemo(() => 
    libraries.flatMap(l => l.icons.map(icon => ({ ...icon, libraryId: l.id, libraryName: l.name }))),
    [libraries]
  );

  const toggleIcon = (iconId: string) => {
    setSelectedIconIds(prev => {
      const next = new Set(prev);
      if (next.has(iconId)) next.delete(iconId);
      else next.add(iconId);
      return next;
    });
  };

  const selectAll = () => {
    setSelectedIconIds(new Set(allIcons.map(i => i.id)));
  };

  const clearSelection = () => setSelectedIconIds(new Set());

  // AI palette generation
  const generateAIPalettes = useCallback(async () => {
    setIsGeneratingPalettes(true);
    try {
      const response = await supabase.functions.invoke('generate-icon-colors', {
        body: {
          brandColors: brandColors.map(c => ({ hex: c.hex, name: c.name })),
          iconCount: selectedIconIds.size || allIcons.length,
        },
      });

      if (response.error) throw new Error(response.error.message);

      if (response.data?.palettes) {
        setAiPalettes(response.data.palettes);
        toast.success('AI color palettes generated!');
      }
    } catch (error) {
      console.error('AI palette generation error:', error);
      // Fallback: generate local palettes from brand colors
      const fallbackPalettes = generateFallbackPalettes(brandColors);
      setAiPalettes(fallbackPalettes);
      toast.success('Color palettes generated from brand colors');
    } finally {
      setIsGeneratingPalettes(false);
    }
  }, [brandColors, selectedIconIds.size, allIcons.length]);

  // Apply colors to selected icons
  const applyToSelected = useCallback(() => {
    if (selectedIconIds.size === 0) {
      toast.error('Select at least one icon to colorize');
      return;
    }

    const colorizedIcons: BrandIconography[] = [];
    const gradientIdBase = `cz-${Date.now()}`;

    allIcons.forEach((icon, idx) => {
      if (!selectedIconIds.has(icon.id)) return;
      const gId = `${gradientIdBase}-${idx}`;
      const newSvg = buildColorizedSvg(buildSvgString(icon), colorConfig, gId);
      colorizedIcons.push({
        id: `colorized-${icon.id}-${Date.now()}`,
        name: `${icon.name} (colorized)`,
        svgPath: newSvg,
        category: icon.category,
        viewBox: icon.viewBox,
        fillMode: colorConfig.mode === 'solid' ? icon.fillMode : 'fill',
      });
    });

    onSaveIcons(colorizedIcons, selectedLibraryId || undefined);
    toast.success(`Colorized ${colorizedIcons.length} icons`);
  }, [selectedIconIds, colorConfig, allIcons, onSaveIcons, selectedLibraryId]);

  const updateConfig = (updates: Partial<ColorConfig>) => {
    setColorConfig(prev => ({ ...prev, ...updates }));
  };

  const addGradientStop = () => {
    const stops = [...colorConfig.gradientStops];
    const lastPos = stops[stops.length - 1]?.position || 0;
    stops.push({ color: brandColors[stops.length % brandColors.length]?.hex || '#888888', position: Math.min(lastPos + 25, 100) });
    updateConfig({ gradientStops: stops });
  };

  const removeGradientStop = (index: number) => {
    if (colorConfig.gradientStops.length <= 2) return;
    const stops = colorConfig.gradientStops.filter((_, i) => i !== index);
    updateConfig({ gradientStops: stops });
  };

  const updateGradientStop = (index: number, updates: Partial<GradientStop>) => {
    const stops = colorConfig.gradientStops.map((s, i) => i === index ? { ...s, ...updates } : s);
    updateConfig({ gradientStops: stops });
  };

  const applyAIPalette = (palette: AIPalette, type: 'solid' | 'gradient', index?: number) => {
    if (type === 'solid' && palette.colors.length > 0) {
      updateConfig({ mode: 'solid', solidColor: palette.colors[0] });
      setActiveColorTab('solid');
    } else if (type === 'gradient' && palette.gradients.length > 0) {
      const g = palette.gradients[index || 0];
      updateConfig({
        mode: 'linear-gradient',
        gradientStops: g.stops,
        gradientAngle: g.angle,
      });
      setActiveColorTab('gradient');
    }
  };

  const copyColor = (hex: string) => {
    navigator.clipboard.writeText(hex);
    setCopiedId(hex);
    setTimeout(() => setCopiedId(null), 1500);
  };

  // Preview SVG for the color config
  const previewSvg = useMemo(() => {
    const sampleSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>`;
    return buildColorizedSvg(sampleSvg, colorConfig, 'preview-grad');
  }, [colorConfig]);

  // Mode sync
  const handleTabChange = (tab: string) => {
    setActiveColorTab(tab);
    if (tab === 'solid') updateConfig({ mode: 'solid' });
    else if (tab === 'gradient') updateConfig({ mode: 'linear-gradient' });
    else if (tab === 'duotone') updateConfig({ mode: 'duotone' });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Paintbrush className="h-5 w-5 text-primary" />
          Icon Colorizer
        </h3>
        <p className="text-sm text-muted-foreground">
          Apply AI-suggested colors, gradients, and duotone effects to your icons
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Color Controls */}
        <div className="space-y-5">
          {/* AI Palette Suggestions */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">AI Color Suggestions</Label>
              <Button
                size="sm"
                variant="outline"
                onClick={generateAIPalettes}
                disabled={isGeneratingPalettes}
                className="gap-2"
              >
                {isGeneratingPalettes ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                {isGeneratingPalettes ? 'Generating...' : 'Generate'}
              </Button>
            </div>
            
            {/* Brand Colors Quick Pick */}
            {brandColors.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-xs text-muted-foreground">Brand Colors</p>
                <div className="flex flex-wrap gap-2">
                  {brandColors.map(c => (
                    <button
                      key={c.hex}
                      onClick={() => updateConfig({ mode: 'solid', solidColor: c.hex })}
                      className={cn(
                        'w-8 h-8 rounded-md border-2 transition-all hover:scale-110',
                        colorConfig.solidColor === c.hex && colorConfig.mode === 'solid'
                          ? 'border-primary ring-2 ring-primary/30'
                          : 'border-border'
                      )}
                      style={{ backgroundColor: c.hex }}
                      title={`${c.name}: ${c.hex}`}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* AI Palettes */}
            {aiPalettes.length > 0 && (
              <div className="space-y-2">
                {aiPalettes.map((palette, pi) => (
                  <div key={pi} className="border rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">{palette.name}</p>
                        <p className="text-xs text-muted-foreground">{palette.description}</p>
                      </div>
                    </div>
                    {/* Solid colors */}
                    <div className="flex gap-1.5">
                      {palette.colors.map((hex, ci) => (
                        <button
                          key={ci}
                          onClick={() => {
                            updateConfig({ mode: 'solid', solidColor: hex });
                            setActiveColorTab('solid');
                          }}
                          className="w-7 h-7 rounded border border-border hover:scale-110 transition-transform relative group"
                          style={{ backgroundColor: hex }}
                          title={hex}
                        >
                          <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[9px] text-muted-foreground opacity-0 group-hover:opacity-100 whitespace-nowrap">
                            {hex}
                          </span>
                        </button>
                      ))}
                    </div>
                    {/* Gradient presets from AI */}
                    {palette.gradients.length > 0 && (
                      <div className="flex gap-1.5 pt-1">
                        {palette.gradients.map((g, gi) => (
                          <button
                            key={gi}
                            onClick={() => applyAIPalette(palette, 'gradient', gi)}
                            className="h-7 flex-1 rounded border border-border hover:scale-105 transition-transform"
                            style={{
                              background: `linear-gradient(${g.angle}deg, ${g.stops.map(s => `${s.color} ${s.position}%`).join(', ')})`,
                            }}
                            title={g.label}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Color Mode Tabs */}
          <Tabs value={activeColorTab} onValueChange={handleTabChange}>
            <TabsList className="w-full grid grid-cols-3">
              <TabsTrigger value="solid" className="gap-1.5 text-xs">
                <Circle className="h-3 w-3" /> Solid
              </TabsTrigger>
              <TabsTrigger value="gradient" className="gap-1.5 text-xs">
                <Sun className="h-3 w-3" /> Gradient
              </TabsTrigger>
              <TabsTrigger value="duotone" className="gap-1.5 text-xs">
                <Droplets className="h-3 w-3" /> Duotone
              </TabsTrigger>
            </TabsList>

            {/* Solid Color */}
            <TabsContent value="solid" className="space-y-3 mt-3">
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-lg border-2 border-border"
                  style={{ backgroundColor: colorConfig.solidColor }}
                />
                <div className="flex-1 space-y-1">
                  <Label className="text-xs">Color</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={colorConfig.solidColor}
                      onChange={e => updateConfig({ solidColor: e.target.value })}
                      className="w-10 h-8 p-0.5 cursor-pointer"
                    />
                    <Input
                      value={colorConfig.solidColor}
                      onChange={e => updateConfig({ solidColor: e.target.value })}
                      className="flex-1 font-mono text-xs"
                      placeholder="#000000"
                    />
                    <Button size="sm" variant="ghost" onClick={() => copyColor(colorConfig.solidColor)}>
                      {copiedId === colorConfig.solidColor ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Gradient */}
            <TabsContent value="gradient" className="space-y-3 mt-3">
              {/* Gradient Type */}
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={colorConfig.mode === 'linear-gradient' ? 'default' : 'outline'}
                  onClick={() => updateConfig({ mode: 'linear-gradient' })}
                  className="text-xs"
                >
                  Linear
                </Button>
                <Button
                  size="sm"
                  variant={colorConfig.mode === 'radial-gradient' ? 'default' : 'outline'}
                  onClick={() => updateConfig({ mode: 'radial-gradient' })}
                  className="text-xs"
                >
                  Radial
                </Button>
              </div>

              {/* Angle (for linear) */}
              {colorConfig.mode === 'linear-gradient' && (
                <div className="space-y-1.5">
                  <Label className="text-xs">Angle: {colorConfig.gradientAngle}°</Label>
                  <Slider
                    value={[colorConfig.gradientAngle]}
                    onValueChange={([v]) => updateConfig({ gradientAngle: v })}
                    min={0}
                    max={360}
                    step={15}
                  />
                </div>
              )}

              {/* Gradient Stops */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Color Stops</Label>
                  <Button size="sm" variant="ghost" onClick={addGradientStop} className="text-xs h-6">
                    + Add Stop
                  </Button>
                </div>
                {colorConfig.gradientStops.map((stop, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Input
                      type="color"
                      value={stop.color}
                      onChange={e => updateGradientStop(i, { color: e.target.value })}
                      className="w-8 h-7 p-0.5 cursor-pointer"
                    />
                    <Input
                      value={stop.color}
                      onChange={e => updateGradientStop(i, { color: e.target.value })}
                      className="flex-1 font-mono text-xs"
                    />
                    <span className="text-xs text-muted-foreground w-8">{stop.position}%</span>
                    <Slider
                      value={[stop.position]}
                      onValueChange={([v]) => updateGradientStop(i, { position: v })}
                      min={0}
                      max={100}
                      className="w-20"
                    />
                    {colorConfig.gradientStops.length > 2 && (
                      <Button size="sm" variant="ghost" onClick={() => removeGradientStop(i)} className="h-6 w-6 p-0 text-destructive">
                        ×
                      </Button>
                    )}
                  </div>
                ))}
              </div>

              {/* Preset Gradients */}
              <div className="space-y-1.5">
                <Label className="text-xs">Preset Gradients</Label>
                <div className="grid grid-cols-4 gap-2">
                  {PRESET_GRADIENTS.map(g => (
                    <button
                      key={g.name}
                      onClick={() => updateConfig({
                        mode: 'linear-gradient',
                        gradientStops: g.stops,
                        gradientAngle: g.angle,
                      })}
                      className="h-8 rounded-md border border-border hover:ring-2 hover:ring-primary/30 transition-all"
                      style={{
                        background: `linear-gradient(${g.angle}deg, ${g.stops.map(s => `${s.color} ${s.position}%`).join(', ')})`,
                      }}
                      title={g.name}
                    />
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* Duotone */}
            <TabsContent value="duotone" className="space-y-3 mt-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Primary</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={colorConfig.duotonePrimary}
                      onChange={e => updateConfig({ duotonePrimary: e.target.value })}
                      className="w-8 h-7 p-0.5 cursor-pointer"
                    />
                    <Input
                      value={colorConfig.duotonePrimary}
                      onChange={e => updateConfig({ duotonePrimary: e.target.value })}
                      className="font-mono text-xs"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Secondary</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={colorConfig.duotoneSecondary}
                      onChange={e => updateConfig({ duotoneSecondary: e.target.value })}
                      className="w-8 h-7 p-0.5 cursor-pointer"
                    />
                    <Input
                      value={colorConfig.duotoneSecondary}
                      onChange={e => updateConfig({ duotoneSecondary: e.target.value })}
                      className="font-mono text-xs"
                    />
                  </div>
                </div>
              </div>
              {/* Quick duotone presets from brand colors */}
              {brandColors.length >= 2 && (
                <div className="space-y-1.5">
                  <Label className="text-xs">Brand Duotone Pairs</Label>
                  <div className="flex flex-wrap gap-2">
                    {brandColors.slice(0, -1).map((c, i) => {
                      const next = brandColors[i + 1];
                      return (
                        <button
                          key={i}
                          onClick={() => updateConfig({ duotonePrimary: c.hex, duotoneSecondary: next.hex })}
                          className="h-7 w-14 rounded border border-border hover:ring-2 hover:ring-primary/30 transition-all"
                          style={{
                            background: `linear-gradient(90deg, ${c.hex} 50%, ${next.hex} 50%)`,
                          }}
                          title={`${c.name} + ${next.name}`}
                        />
                      );
                    })}
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>

          {/* Opacity */}
          <div className="space-y-1.5">
            <Label className="text-xs">Opacity: {colorConfig.opacity}%</Label>
            <Slider
              value={[colorConfig.opacity]}
              onValueChange={([v]) => updateConfig({ opacity: v })}
              min={10}
              max={100}
              step={5}
            />
          </div>

          {/* Live Preview */}
          <div className="space-y-2">
            <Label className="text-xs">Preview</Label>
            <div className="border rounded-lg p-6 flex items-center justify-center bg-muted/20 min-h-[120px]">
              <div className="flex items-end gap-4">
                {[24, 36, 48, 64].map(size => (
                  <div key={size} className="flex flex-col items-center gap-1">
                    <div
                      style={{ width: size, height: size }}
                      className="[&>svg]:w-full [&>svg]:h-full"
                      dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(previewSvg, { USE_PROFILES: { svg: true, svgFilters: true } }) }}
                    />
                    <span className="text-[9px] text-muted-foreground">{size}px</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button onClick={applyToSelected} disabled={selectedIconIds.size === 0} className="flex-1 gap-2">
              <Paintbrush className="h-4 w-4" />
              Apply to {selectedIconIds.size} Icon{selectedIconIds.size !== 1 ? 's' : ''}
            </Button>
            <Button variant="outline" onClick={() => setColorConfig({ ...DEFAULT_CONFIG, solidColor: brandColors[0]?.hex || '#000000' })}>
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>

          {/* Target Library */}
          {libraries.length > 0 && (
            <div className="space-y-1.5">
              <Label className="text-xs">Save to Library</Label>
              <Select value={selectedLibraryId || 'auto'} onValueChange={v => setSelectedLibraryId(v === 'auto' ? '' : v)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Auto (first Core library)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">Auto (first Core library)</SelectItem>
                  {libraries.filter(l => l.is_active).map(lib => (
                    <SelectItem key={lib.id} value={lib.id}>
                      {lib.name} ({lib.icons.length} icons)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* Right: Icon Selection */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Select Icons to Colorize</Label>
            <div className="flex gap-2">
              <Button size="sm" variant="ghost" onClick={selectAll} className="text-xs">
                Select All
              </Button>
              {selectedIconIds.size > 0 && (
                <Button size="sm" variant="ghost" onClick={clearSelection} className="text-xs">
                  Clear ({selectedIconIds.size})
                </Button>
              )}
            </div>
          </div>

          {allIcons.length === 0 ? (
            <div className="border rounded-lg p-8 text-center text-muted-foreground">
              <Paintbrush className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p className="text-sm font-medium">No icons in your libraries yet</p>
              <p className="text-xs mt-1">Generate or add icons in the Library or AI Generator tabs first</p>
            </div>
          ) : (
            <ScrollArea className="h-[480px] border rounded-lg p-3">
              {libraries.filter(l => l.icons.length > 0).map(lib => (
                <div key={lib.id} className="mb-4">
                  <p className="text-xs font-medium text-muted-foreground mb-2 px-1">
                    {lib.name}
                    <Badge variant="secondary" className="ml-2 text-[10px]">{lib.icons.length}</Badge>
                  </p>
                  <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-7 gap-1.5">
                    {lib.icons.map(icon => {
                      const isSelected = selectedIconIds.has(icon.id);
                      const normalizedSvg = buildSvgString(icon);
                      // Show colorized preview if selected
                      const displaySvg = isSelected
                        ? buildColorizedSvg(normalizedSvg, colorConfig, `sel-${icon.id}`)
                        : normalizedSvg;
                      return (
                        <button
                          key={icon.id}
                          onClick={() => toggleIcon(icon.id)}
                          className={cn(
                            'relative p-2 rounded-md border flex items-center justify-center transition-all aspect-square',
                            isSelected
                              ? 'border-primary bg-primary/10 ring-2 ring-primary/20'
                              : 'border-border hover:border-primary/50 hover:bg-muted/50'
                          )}
                          title={icon.name}
                        >
                          <div
                            className="w-full h-full [&>svg]:w-full [&>svg]:h-full"
                            dangerouslySetInnerHTML={{
                              __html: DOMPurify.sanitize(displaySvg, { USE_PROFILES: { svg: true, svgFilters: true } }),
                            }}
                          />
                          {isSelected && (
                            <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-primary rounded-full flex items-center justify-center">
                              <Check className="h-2 w-2 text-primary-foreground" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </ScrollArea>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * Fallback palette generator using brand colors when AI is unavailable
 */
function generateFallbackPalettes(brandColors: Array<{ hex: string; name: string }>): AIPalette[] {
  if (brandColors.length === 0) {
    return [{
      name: 'Default',
      description: 'Standard icon color palette',
      colors: ['#1a1a2e', '#16213e', '#0f3460', '#533483', '#e94560'],
      gradients: [
        { stops: [{ color: '#1a1a2e', position: 0 }, { color: '#e94560', position: 100 }], angle: 135, label: 'Dark to Accent' },
      ],
    }];
  }

  const hexes = brandColors.map(c => c.hex);
  const palettes: AIPalette[] = [];

  // Brand-native palette
  palettes.push({
    name: 'Brand Native',
    description: 'Your brand colors optimized for icons',
    colors: hexes.slice(0, 6),
    gradients: hexes.length >= 2
      ? [
          { stops: [{ color: hexes[0], position: 0 }, { color: hexes[1], position: 100 }], angle: 135, label: 'Primary Flow' },
          ...(hexes.length >= 3 ? [{ stops: [{ color: hexes[0], position: 0 }, { color: hexes[1], position: 50 }, { color: hexes[2], position: 100 }], angle: 180, label: 'Tri-Tone' }] : []),
        ]
      : [],
  });

  // Muted variant
  palettes.push({
    name: 'Muted Brand',
    description: 'Softer versions for subtle iconography',
    colors: hexes.map(hex => {
      // Lighten by mixing with white
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      const lr = Math.min(255, Math.round(r + (255 - r) * 0.4));
      const lg = Math.min(255, Math.round(g + (255 - g) * 0.4));
      const lb = Math.min(255, Math.round(b + (255 - b) * 0.4));
      return `#${lr.toString(16).padStart(2, '0')}${lg.toString(16).padStart(2, '0')}${lb.toString(16).padStart(2, '0')}`;
    }),
    gradients: [],
  });

  // Dark variant
  palettes.push({
    name: 'Dark Brand',
    description: 'Deep tones for dark-mode or bold statements',
    colors: hexes.map(hex => {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      const dr = Math.round(r * 0.5);
      const dg = Math.round(g * 0.5);
      const db = Math.round(b * 0.5);
      return `#${dr.toString(16).padStart(2, '0')}${dg.toString(16).padStart(2, '0')}${db.toString(16).padStart(2, '0')}`;
    }),
    gradients: hexes.length >= 2
      ? [{ stops: [{ color: darken(hexes[0], 0.5), position: 0 }, { color: darken(hexes[1], 0.5), position: 100 }], angle: 135, label: 'Dark Gradient' }]
      : [],
  });

  return palettes;
}

function darken(hex: string, factor: number): string {
  const r = Math.round(parseInt(hex.slice(1, 3), 16) * factor);
  const g = Math.round(parseInt(hex.slice(3, 5), 16) * factor);
  const b = Math.round(parseInt(hex.slice(5, 7), 16) * factor);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}
