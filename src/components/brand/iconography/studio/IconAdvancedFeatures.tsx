/**
 * IconAdvancedFeatures - Advanced Icon Studio Features
 * 
 * - Optical Size Optimizer (Responsive Icons)
 * - Dynamic Semantic Variants (State Mapping)
 * - Kinetic Branding (Micro-Animations)
 */

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Maximize2,
  Minimize2,
  Monitor,
  Smartphone,
  Eye,
  Palette,
  Sparkles,
  Play,
  Pause,
  Download,
  Copy,
  Check,
  AlertTriangle,
  Zap,
  Target,
  RefreshCw,
  Settings2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import DOMPurify from 'dompurify';
import { useResponsiveIcon, IconSizeVariant, ResponsiveIconSet } from '@/hooks/useResponsiveIcon';
import { useIconStateSystem, IconState, IconStateSet } from '@/hooks/useIconStateSystem';
import { useKineticBranding, BrandPersonality, EntranceAnimation, InteractionAnimation } from '@/hooks/useKineticBranding';
import { BrandIconography } from '@/types/brand';
import { IconKitTooltip } from '@/components/help/IconKitTooltip';
import { BatchProcessingPanel } from './BatchProcessingPanel';
interface IconAdvancedFeaturesProps {
  selectedIcon: BrandIconography | null;
  brandColors: string[];
  onIconUpdate: (icon: BrandIconography) => void;
  icons?: BrandIconography[];
  libraryName?: string;
}

type FeatureTab = 'responsive' | 'states' | 'kinetic' | 'batch';

export const IconAdvancedFeatures: React.FC<IconAdvancedFeaturesProps> = ({
  selectedIcon,
  brandColors,
  onIconUpdate,
  icons = [],
  libraryName = 'Icon Library',
}) => {
  const [activeTab, setActiveTab] = useState<FeatureTab>('responsive');
  const [previewSize, setPreviewSize] = useState<IconSizeVariant>('regular');
  const [previewState, setPreviewState] = useState<IconState>('default');
  const [isAnimating, setIsAnimating] = useState(false);
  const [personality, setPersonality] = useState<BrandPersonality>('professional');
  const [entranceAnim, setEntranceAnim] = useState<EntranceAnimation>('fade');
  const [interactionAnim, setInteractionAnim] = useState<InteractionAnimation>('pulse');

  // Hooks
  const responsiveIcon = useResponsiveIcon(2);
  const stateSystem = useIconStateSystem({
    success: brandColors[0],
    error: brandColors[1],
  });
  const kineticBranding = useKineticBranding(personality);

  // Generated variants
  const [responsiveSet, setResponsiveSet] = useState<ResponsiveIconSet | null>(null);
  const [stateSet, setStateSet] = useState<IconStateSet | null>(null);
  const [kineticData, setKineticData] = useState<{ svg: string; css: string } | null>(null);

  // Generate variants when icon changes
  useEffect(() => {
    if (!selectedIcon?.svgPath) return;

    // Generate responsive variants
    const responsive = responsiveIcon.generateAllVariants(selectedIcon.svgPath);
    setResponsiveSet(responsive);

    // Generate state variants
    const states = stateSystem.generateAllStates(selectedIcon.svgPath);
    setStateSet(states);

    // Generate kinetic animation
    const kinetic = kineticBranding.applyKineticAnimation(
      selectedIcon.svgPath,
      entranceAnim,
      interactionAnim
    );
    setKineticData(kinetic);
  }, [selectedIcon, responsiveIcon, stateSystem, kineticBranding, entranceAnim, interactionAnim]);

  // Update kinetic on animation change
  useEffect(() => {
    if (!selectedIcon?.svgPath) return;
    const kinetic = kineticBranding.applyKineticAnimation(
      selectedIcon.svgPath,
      entranceAnim,
      interactionAnim
    );
    setKineticData(kinetic);
  }, [entranceAnim, interactionAnim, personality]);

  // Render sanitized SVG
  const renderSvg = useCallback((svg: string, size: number = 48) => {
    const sanitized = DOMPurify.sanitize(svg, {
      USE_PROFILES: { svg: true, svgFilters: true },
      FORBID_TAGS: ['script', 'foreignObject'],
    });
    return (
      <div
        className="flex items-center justify-center"
        style={{ width: size, height: size }}
        dangerouslySetInnerHTML={{ __html: sanitized }}
      />
    );
  }, []);

  // Copy to clipboard
  const handleCopy = (content: string, label: string) => {
    navigator.clipboard.writeText(content);
    toast.success(`${label} copied to clipboard`);
  };

  // Download as file
  const handleDownload = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Downloaded ${filename}`);
  };

  if (!selectedIcon) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
        <Target className="h-12 w-12 mb-4 opacity-50" />
        <p className="text-sm font-medium">Select an icon to access advanced features</p>
        <p className="text-xs mt-1">Choose from your library or generate new icons</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Advanced Features
          </h3>
          <p className="text-sm text-muted-foreground">
            Enhance "{selectedIcon.name}" with responsive, stateful, and animated variants
          </p>
        </div>
        <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
          {renderSvg(selectedIcon.svgPath, 32)}
          <span className="text-sm font-medium">{selectedIcon.name}</span>
        </div>
      </div>

      {/* Feature Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as FeatureTab)}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="responsive" className="gap-2">
            <Monitor className="h-4 w-4" />
            <span className="hidden sm:inline">Optical</span>
            <IconKitTooltip sectionId="optical-sizing" size="sm" />
          </TabsTrigger>
          <TabsTrigger value="states" className="gap-2">
            <Palette className="h-4 w-4" />
            <span className="hidden sm:inline">States</span>
            <IconKitTooltip sectionId="semantic-states" size="sm" />
          </TabsTrigger>
          <TabsTrigger value="kinetic" className="gap-2">
            <Sparkles className="h-4 w-4" />
            <span className="hidden sm:inline">Kinetic</span>
            <IconKitTooltip sectionId="kinetic-branding" size="sm" />
          </TabsTrigger>
          <TabsTrigger value="batch" className="gap-2">
            <Zap className="h-4 w-4" />
            <span className="hidden sm:inline">Batch</span>
          </TabsTrigger>
        </TabsList>

        {/* Optical Size Tab */}
        <TabsContent value="responsive" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Maximize2 className="h-4 w-4" />
                Responsive Variants
                <IconKitTooltip sectionId="optical-sizing" inline />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-xs text-muted-foreground">
                Icons automatically adjust detail level based on display size for optimal legibility.
              </p>

              {/* Size Preview Grid */}
              <div className="grid grid-cols-3 gap-4">
                {(['micro', 'regular', 'display'] as IconSizeVariant[]).map((size) => (
                  <div
                    key={size}
                    className={cn(
                      'p-4 rounded-lg border-2 cursor-pointer transition-all text-center',
                      previewSize === size 
                        ? 'border-primary bg-primary/5' 
                        : 'border-border hover:border-primary/50'
                    )}
                    onClick={() => setPreviewSize(size)}
                  >
                    <div className="flex items-center justify-center mb-2 h-16">
                      {responsiveSet && renderSvg(
                        responsiveSet[size],
                        size === 'micro' ? 16 : size === 'regular' ? 32 : 64
                      )}
                    </div>
                    <Badge variant={previewSize === size ? 'default' : 'secondary'} className="text-xs">
                      {size === 'micro' && '12-16px'}
                      {size === 'regular' && '24-48px'}
                      {size === 'display' && '64px+'}
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-1 capitalize">{size}</p>
                  </div>
                ))}
              </div>

              {/* Export Options */}
              <div className="flex gap-2 pt-2 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => responsiveSet && handleCopy(responsiveSet.responsive, 'Responsive SVG')}
                >
                  <Copy className="h-3 w-3 mr-1" />
                  Copy Responsive
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => responsiveSet && handleDownload(
                    JSON.stringify({ micro: responsiveSet.micro, regular: responsiveSet.regular, display: responsiveSet.display }, null, 2),
                    `${selectedIcon.name}-responsive.json`
                  )}
                >
                  <Download className="h-3 w-3 mr-1" />
                  Export All
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* States Tab */}
        <TabsContent value="states" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Interactive State Variants
                <IconKitTooltip sectionId="semantic-states" inline />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-xs text-muted-foreground">
                Pre-generated variants for hover, active, and semantic states (success, error, etc.)
              </p>

              {/* State Preview Grid */}
              <ScrollArea className="h-[200px]">
                <div className="grid grid-cols-4 gap-3">
                  {stateSet && (['default', 'hover', 'active', 'success', 'error', 'warning', 'skeleton', 'disabled'] as IconState[]).map((state) => (
                    <div
                      key={state}
                      className={cn(
                        'p-3 rounded-lg border cursor-pointer transition-all text-center',
                        previewState === state 
                          ? 'border-primary bg-primary/5' 
                          : 'border-border hover:border-primary/50'
                      )}
                      onClick={() => setPreviewState(state)}
                    >
                      <div className="flex items-center justify-center mb-2 h-10">
                        {renderSvg(stateSet[state], state === 'success' || state === 'error' || state === 'warning' ? 32 : 24)}
                      </div>
                      <p className="text-[10px] text-muted-foreground capitalize">{state}</p>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              {/* Export Options */}
              <div className="flex gap-2 pt-2 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => stateSet && handleCopy(stateSet.cssVariables, 'State CSS')}
                >
                  <Copy className="h-3 w-3 mr-1" />
                  Copy CSS
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => stateSet && handleDownload(
                    JSON.stringify(stateSet, null, 2),
                    `${selectedIcon.name}-states.json`
                  )}
                >
                  <Download className="h-3 w-3 mr-1" />
                  Export All
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Kinetic Tab */}
        <TabsContent value="kinetic" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Play className="h-4 w-4" />
                Micro-Animations
                <IconKitTooltip sectionId="kinetic-branding" inline />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Personality Selector */}
              <div className="space-y-2">
                <Label className="text-xs flex items-center gap-1">
                  Brand Personality
                  <IconKitTooltip sectionId="brand-personality" inline size="sm" />
                </Label>
                <Select value={personality} onValueChange={(v) => setPersonality(v as BrandPersonality)}>
                  <SelectTrigger className="h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {kineticBranding.personalityOptions.map((p) => (
                      <SelectItem key={p} value={p} className="capitalize">
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-[10px] text-muted-foreground">
                  Physics: Mass {kineticBranding.physics.mass}, Tension {kineticBranding.physics.tension}, 
                  Elasticity {(kineticBranding.physics.elasticity * 100).toFixed(0)}%
                </p>
              </div>

              {/* Animation Controls */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-xs">Entrance</Label>
                  <Select value={entranceAnim} onValueChange={(v) => setEntranceAnim(v as EntranceAnimation)}>
                    <SelectTrigger className="h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {kineticBranding.entranceOptions.map((a) => (
                        <SelectItem key={a} value={a} className="capitalize">
                          {a}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Interaction</Label>
                  <Select value={interactionAnim} onValueChange={(v) => setInteractionAnim(v as InteractionAnimation)}>
                    <SelectTrigger className="h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {kineticBranding.interactionOptions.map((a) => (
                        <SelectItem key={a} value={a} className="capitalize">
                          {a}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Animation Preview */}
              <div className="relative p-8 rounded-lg bg-muted/30 flex items-center justify-center">
                {kineticData && (
                  <>
                    <style>{kineticData.css}</style>
                    <div
                      key={isAnimating ? 'animating' : 'static'}
                      className={cn(
                        'transition-all',
                        isAnimating && `icon-kinetic icon-animated-${entranceAnim} icon-interactive`
                      )}
                    >
                      {renderSvg(kineticData.svg, 64)}
                    </div>
                  </>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 h-8 w-8"
                  onClick={() => setIsAnimating(!isAnimating)}
                >
                  {isAnimating ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </Button>
              </div>

              {/* Export Options */}
              <div className="flex gap-2 pt-2 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => kineticData && handleCopy(kineticData.css, 'Animation CSS')}
                >
                  <Copy className="h-3 w-3 mr-1" />
                  Copy CSS
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => {
                    if (!selectedIcon) return;
                    const lottie = kineticBranding.generateLottieData(selectedIcon.svgPath, entranceAnim);
                    handleDownload(JSON.stringify(lottie, null, 2), `${selectedIcon.name}-lottie.json`);
                  }}
                >
                  <Download className="h-3 w-3 mr-1" />
                  Export Lottie
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Batch Processing Tab */}
        <TabsContent value="batch" className="space-y-4 mt-4">
          <BatchProcessingPanel
            icons={icons}
            libraryName={libraryName}
            onComplete={(result) => {
              toast.success(`Batch processing complete: ${result.processedCount} icons processed`);
            }}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default IconAdvancedFeatures;
