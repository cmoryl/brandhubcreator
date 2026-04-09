/**
 * IconBrandHierarchy - Brand Hierarchy Management UI
 * 
 * Manages icon inheritance across the organization:
 * - Parent Brand DNA (locked rules)
 * - Sub-Brand Style Overrides
 * - Event-Mode Overlays
 * - Color Slot Mapping
 */

import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import {
  Lock,
  Unlock,
  Layers,
  Palette,
  Calendar,
  GitBranch,
  Copy,
  Download,
  Check,
  Eye,
  EyeOff,
  Plus,
  Trash2,
  RefreshCw,
  Settings2,
  Sparkles,
  Building2,
  Package,
  PartyPopper,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { buildSvgString } from '@/lib/svgUtils';
import { toast } from 'sonner';
import DOMPurify from 'dompurify';
import { 
  useIconHierarchy, 
  BrandIconDNA, 
  IconStyleOverride, 
  EventOverlay, 
  ColorSlotMapping,
  HierarchyLevel,
} from '@/hooks/useIconHierarchy';
import { BrandIconography } from '@/types/brand';
import { IconKitTooltip } from '@/components/help/IconKitTooltip';

interface IconBrandHierarchyProps {
  organizationId: string;
  organizationName: string;
  brands: Array<{ id: string; name: string; type: 'brand' | 'product' | 'event' }>;
  brandColors: Array<{ hex: string; name: string }>;
  icons: BrandIconography[];
  onExportCSS: (css: string) => void;
}

type HierarchyTab = 'dna' | 'overrides' | 'events' | 'colors';

export const IconBrandHierarchy: React.FC<IconBrandHierarchyProps> = ({
  organizationId,
  organizationName,
  brands,
  brandColors,
  icons,
  onExportCSS,
}) => {
  const [activeTab, setActiveTab] = useState<HierarchyTab>('dna');
  const [previewBrandId, setPreviewBrandId] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(true);

  // DNA State
  const [dna, setDna] = useState<Partial<BrandIconDNA>>({
    strokeWidth: 2,
    strokeCap: 'round',
    strokeJoin: 'round',
    opticalWeight: 'regular',
    targetAnchorPoints: 50,
    pixelSnapping: true,
    snapPrecision: 0.5,
  });

  // Overrides State
  const [overrides, setOverrides] = useState<IconStyleOverride[]>([]);
  
  // Events State
  const [eventOverlays, setEventOverlays] = useState<EventOverlay[]>([]);
  
  // Color Mappings State
  const [colorMappings, setColorMappings] = useState<Record<string, ColorSlotMapping>>({
    default: {
      primary: brandColors[0]?.hex || '#139cd8',
      secondary: brandColors[1]?.hex || '#64748b',
      accent: brandColors[2]?.hex || '#f59e0b',
      background: 'none',
    },
  });

  // Hook
  const iconHierarchy = useIconHierarchy(dna, icons);

  // Preview icons with current config
  const previewIcons = useMemo(() => {
    const config = {
      overrides: previewBrandId ? overrides.filter(o => o.id === previewBrandId) : [],
      eventOverlay: eventOverlays.find(e => e.active),
      colorMapping: previewBrandId ? colorMappings[previewBrandId] : colorMappings.default,
    };
    return iconHierarchy.generateHierarchicalSet(icons.slice(0, 8), config);
  }, [icons, previewBrandId, overrides, eventOverlays, colorMappings, iconHierarchy]);

  // Render sanitized SVG
  const renderSvg = (svg: string, size: number = 32) => {
    const sanitized = DOMPurify.sanitize(buildSvgString({ svgPath: svg, fillMode: 'fill' }), {
      USE_PROFILES: { svg: true, svgFilters: true },
      FORBID_TAGS: ['script', 'foreignObject'],
    });
    return (
      <div
        className="flex items-center justify-center [&>svg]:w-full [&>svg]:h-full"
        style={{ width: size, height: size }}
        dangerouslySetInnerHTML={{ __html: sanitized }}
      />
    );
  };

  // Add new override
  const handleAddOverride = (level: HierarchyLevel) => {
    const newOverride: IconStyleOverride = {
      id: `override-${Date.now()}`,
      name: `New ${level} Override`,
      level,
      cornerRadius: 0,
      fillMode: 'stroke',
      personality: 'professional',
    };
    setOverrides([...overrides, newOverride]);
    toast.success(`Added ${level} override`);
  };

  // Add new event overlay
  const handleAddEvent = () => {
    const newEvent: EventOverlay = {
      id: `event-${Date.now()}`,
      name: 'New Event',
      active: false,
      texture: 'none',
    };
    setEventOverlays([...eventOverlays, newEvent]);
    toast.success('Added event overlay');
  };

  // Add new color mapping
  const handleAddColorMapping = (brandId: string, brandName: string) => {
    setColorMappings({
      ...colorMappings,
      [brandId]: {
        primary: brandColors[0]?.hex || '#139cd8',
        secondary: brandColors[1]?.hex || '#64748b',
        accent: brandColors[2]?.hex || '#f59e0b',
        background: 'none',
      },
    });
    toast.success(`Added color mapping for ${brandName}`);
  };

  // Export all CSS
  const handleExportCSS = () => {
    const css = iconHierarchy.exportMultiTenantCSS(colorMappings);
    onExportCSS(css);
    
    // Also copy to clipboard
    navigator.clipboard.writeText(css);
    toast.success('Multi-tenant CSS exported and copied to clipboard');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <GitBranch className="h-5 w-5 text-primary" />
            Brand Hierarchy
          </h3>
          <p className="text-sm text-muted-foreground">
            Manage icon inheritance across {organizationName}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowPreview(!showPreview)}
          >
            {showPreview ? <EyeOff className="h-4 w-4 mr-1" /> : <Eye className="h-4 w-4 mr-1" />}
            Preview
          </Button>
          <Button size="sm" onClick={handleExportCSS}>
            <Download className="h-4 w-4 mr-1" />
            Export CSS
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Controls */}
        <div className="lg:col-span-2">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as HierarchyTab)}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="dna" className="gap-1.5">
                <Lock className="h-3 w-3" />
                <span className="hidden sm:inline">DNA</span>
                <IconKitTooltip sectionId="brand-dna" size="sm" />
              </TabsTrigger>
              <TabsTrigger value="overrides" className="gap-1.5">
                <Layers className="h-3 w-3" />
                <span className="hidden sm:inline">Overrides</span>
                <IconKitTooltip sectionId="style-overrides" size="sm" />
              </TabsTrigger>
              <TabsTrigger value="events" className="gap-1.5">
                <PartyPopper className="h-3 w-3" />
                <span className="hidden sm:inline">Events</span>
                <IconKitTooltip sectionId="event-overlays" size="sm" />
              </TabsTrigger>
              <TabsTrigger value="colors" className="gap-1.5">
                <Palette className="h-3 w-3" />
                <span className="hidden sm:inline">Colors</span>
                <IconKitTooltip sectionId="color-mapping" size="sm" />
              </TabsTrigger>
            </TabsList>

            {/* DNA Tab - Locked Rules */}
            <TabsContent value="dna" className="space-y-4 mt-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Lock className="h-4 w-4 text-amber-500" />
                    Brand DNA (Global Rules)
                  </CardTitle>
                  <CardDescription className="text-xs">
                    These rules are inherited by ALL sub-brands and cannot be overridden
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Stroke Width */}
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label className="text-xs flex items-center gap-1">
                        <Lock className="h-3 w-3 text-muted-foreground" />
                        Stroke Width
                      </Label>
                      <span className="text-xs text-muted-foreground">{dna.strokeWidth}px</span>
                    </div>
                    <Slider
                      value={[dna.strokeWidth || 2]}
                      onValueChange={([v]) => setDna({ ...dna, strokeWidth: v })}
                      min={1}
                      max={4}
                      step={0.25}
                    />
                  </div>

                  {/* Stroke Caps */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs flex items-center gap-1">
                        <Lock className="h-3 w-3 text-muted-foreground" />
                        Stroke Cap
                      </Label>
                      <Select
                        value={dna.strokeCap}
                        onValueChange={(v) => setDna({ ...dna, strokeCap: v as any })}
                      >
                        <SelectTrigger className="h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="round">Round</SelectItem>
                          <SelectItem value="square">Square</SelectItem>
                          <SelectItem value="butt">Butt</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs flex items-center gap-1">
                        <Lock className="h-3 w-3 text-muted-foreground" />
                        Stroke Join
                      </Label>
                      <Select
                        value={dna.strokeJoin}
                        onValueChange={(v) => setDna({ ...dna, strokeJoin: v as any })}
                      >
                        <SelectTrigger className="h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="round">Round</SelectItem>
                          <SelectItem value="miter">Miter</SelectItem>
                          <SelectItem value="bevel">Bevel</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Optical Settings */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs flex items-center gap-1">
                        <Lock className="h-3 w-3 text-muted-foreground" />
                        Optical Weight
                      </Label>
                      <Select
                        value={dna.opticalWeight}
                        onValueChange={(v) => setDna({ ...dna, opticalWeight: v as any })}
                      >
                        <SelectTrigger className="h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="light">Light</SelectItem>
                          <SelectItem value="regular">Regular</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="bold">Bold</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs flex items-center gap-1">
                        <Lock className="h-3 w-3 text-muted-foreground" />
                        Max Anchor Points
                      </Label>
                      <Input
                        type="number"
                        value={dna.targetAnchorPoints}
                        onChange={(e) => setDna({ ...dna, targetAnchorPoints: parseInt(e.target.value) })}
                        className="h-8"
                      />
                    </div>
                  </div>

                  {/* Pixel Snapping */}
                  <div className="flex items-center justify-between">
                    <Label className="text-xs flex items-center gap-1">
                      <Lock className="h-3 w-3 text-muted-foreground" />
                      Pixel Snapping
                    </Label>
                    <Switch
                      checked={dna.pixelSnapping}
                      onCheckedChange={(v) => setDna({ ...dna, pixelSnapping: v })}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Overrides Tab */}
            <TabsContent value="overrides" className="space-y-4 mt-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  Style variations that inherit DNA but modify appearance
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleAddOverride('sub-brand')}>
                    <Building2 className="h-3 w-3 mr-1" />
                    Sub-Brand
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleAddOverride('product')}>
                    <Package className="h-3 w-3 mr-1" />
                    Product
                  </Button>
                </div>
              </div>

              <ScrollArea className="h-[300px]">
                <Accordion type="multiple" className="space-y-2">
                  {overrides.map((override, idx) => (
                    <AccordionItem key={override.id} value={override.id} className="border rounded-lg px-3">
                      <AccordionTrigger className="py-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[10px]">
                            {override.level}
                          </Badge>
                          <span className="text-sm">{override.name}</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pb-3 space-y-3">
                        <div className="space-y-2">
                          <Label className="text-xs">Name</Label>
                          <Input
                            value={override.name}
                            onChange={(e) => {
                              const updated = [...overrides];
                              updated[idx].name = e.target.value;
                              setOverrides(updated);
                            }}
                            className="h-8"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-2">
                            <Label className="text-xs flex items-center gap-1">
                              <Unlock className="h-3 w-3 text-green-500" />
                              Corner Radius
                            </Label>
                            <Slider
                              value={[override.cornerRadius || 0]}
                              onValueChange={([v]) => {
                                const updated = [...overrides];
                                updated[idx].cornerRadius = v;
                                setOverrides(updated);
                              }}
                              min={0}
                              max={12}
                              step={1}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs flex items-center gap-1">
                              <Unlock className="h-3 w-3 text-green-500" />
                              Fill Mode
                            </Label>
                            <Select
                              value={override.fillMode}
                              onValueChange={(v) => {
                                const updated = [...overrides];
                                updated[idx].fillMode = v as any;
                                setOverrides(updated);
                              }}
                            >
                              <SelectTrigger className="h-8">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="stroke">Outline</SelectItem>
                                <SelectItem value="fill">Filled</SelectItem>
                                <SelectItem value="duotone">Duotone</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="flex justify-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive"
                            onClick={() => setOverrides(overrides.filter((_, i) => i !== idx))}
                          >
                            <Trash2 className="h-3 w-3 mr-1" />
                            Remove
                          </Button>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
                {overrides.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Layers className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No overrides defined</p>
                    <p className="text-xs">Add sub-brand or product overrides above</p>
                  </div>
                )}
              </ScrollArea>
            </TabsContent>

            {/* Events Tab */}
            <TabsContent value="events" className="space-y-4 mt-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  Temporary themed overlays for events and campaigns
                </p>
                <Button variant="outline" size="sm" onClick={handleAddEvent}>
                  <Plus className="h-3 w-3 mr-1" />
                  Add Event
                </Button>
              </div>

              <ScrollArea className="h-[300px]">
                <div className="space-y-3">
                  {eventOverlays.map((event, idx) => (
                    <Card key={event.id} className={cn(event.active && 'ring-2 ring-primary')}>
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <Input
                            value={event.name}
                            onChange={(e) => {
                              const updated = [...eventOverlays];
                              updated[idx].name = e.target.value;
                              setEventOverlays(updated);
                            }}
                            className="h-8 w-48"
                          />
                          <div className="flex items-center gap-2">
                            <Badge variant={event.active ? 'default' : 'secondary'}>
                              {event.active ? 'Active' : 'Inactive'}
                            </Badge>
                            <Switch
                              checked={event.active}
                              onCheckedChange={(v) => {
                                const updated = [...eventOverlays];
                                updated[idx].active = v;
                                setEventOverlays(updated);
                              }}
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-2">
                            <Label className="text-xs">Texture Effect</Label>
                            <Select
                              value={event.texture}
                              onValueChange={(v) => {
                                const updated = [...eventOverlays];
                                updated[idx].texture = v as any;
                                setEventOverlays(updated);
                              }}
                            >
                              <SelectTrigger className="h-8">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">None</SelectItem>
                                <SelectItem value="grain">Film Grain</SelectItem>
                                <SelectItem value="noise">Noise</SelectItem>
                                <SelectItem value="halftone">Halftone</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="flex items-end">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive"
                              onClick={() => setEventOverlays(eventOverlays.filter((_, i) => i !== idx))}
                            >
                              <Trash2 className="h-3 w-3 mr-1" />
                              Remove
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                {eventOverlays.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <PartyPopper className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No event overlays</p>
                    <p className="text-xs">Add themed layers for special occasions</p>
                  </div>
                )}
              </ScrollArea>
            </TabsContent>

            {/* Colors Tab */}
            <TabsContent value="colors" className="space-y-4 mt-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  Dynamic color slot mappings for each brand/product
                </p>
              </div>

              <ScrollArea className="h-[300px]">
                <div className="space-y-3">
                  {Object.entries(colorMappings).map(([id, mapping]) => (
                    <Card key={id}>
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium capitalize">{id}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setPreviewBrandId(previewBrandId === id ? null : id)}
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            Preview
                          </Button>
                        </div>
                        <div className="grid grid-cols-4 gap-2">
                          {(['primary', 'secondary', 'accent', 'background'] as const).map((slot) => (
                            <div key={slot} className="space-y-1">
                              <Label className="text-[10px] text-muted-foreground capitalize">{slot}</Label>
                              <div className="flex items-center gap-1">
                                <div
                                  className="w-6 h-6 rounded border"
                                  style={{ backgroundColor: mapping[slot] === 'none' ? 'transparent' : mapping[slot] }}
                                />
                                <Input
                                  value={mapping[slot] || ''}
                                  onChange={(e) => {
                                    setColorMappings({
                                      ...colorMappings,
                                      [id]: { ...mapping, [slot]: e.target.value },
                                    });
                                  }}
                                  className="h-6 text-[10px] px-1"
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Add mapping for brands */}
                <div className="mt-4 pt-4 border-t">
                  <Label className="text-xs text-muted-foreground mb-2 block">Add Color Mapping</Label>
                  <div className="flex flex-wrap gap-2">
                    {brands
                      .filter(b => !colorMappings[b.id])
                      .slice(0, 5)
                      .map(brand => (
                        <Button
                          key={brand.id}
                          variant="outline"
                          size="sm"
                          onClick={() => handleAddColorMapping(brand.id, brand.name)}
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          {brand.name}
                        </Button>
                      ))}
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>

        {/* Preview Panel */}
        {showPreview && (
          <div className="lg:col-span-1">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    Live Preview
                  </span>
                  {previewBrandId && (
                    <Badge variant="outline" className="text-[10px]">
                      {previewBrandId}
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-2">
                  {previewIcons.map((icon, idx) => (
                    <Tooltip key={idx}>
                      <TooltipTrigger asChild>
                        <div className="p-2 rounded-lg border bg-muted/30 flex items-center justify-center aspect-square hover:bg-muted/50 transition-colors">
                          {renderSvg(icon.svgPath, 24)}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">
                        {icon.name}
                      </TooltipContent>
                    </Tooltip>
                  ))}
                </div>
                {icons.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Sparkles className="h-6 w-6 mx-auto mb-2 opacity-50" />
                    <p className="text-xs">No icons to preview</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default IconBrandHierarchy;
