import { useState, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Sparkles, Settings2, Eye, MousePointer2, Hand, Move, Maximize2, Download, Image, Video, Film } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { GradientBarsHero } from '@/components/backgrounds/GradientBarsHero';
import { HorizonGlowHero } from '@/components/backgrounds/HorizonGlowHero';
import { FloatingOrbsHero } from '@/components/backgrounds/FloatingOrbsHero';
import { GradientSpheresHero } from '@/components/backgrounds/GradientSpheresHero';
import { ImageOrbsHero } from '@/components/backgrounds/ImageOrbsHero';
import { ImagePanelsHero } from '@/components/backgrounds/ImagePanelsHero';
import { captureEffectAsPng, recordEffectAsVideo, recordEffectAsGif, VideoRecordingState, ExportOptions } from '@/lib/heroEffectExport';
import { ExportOptionsDialog } from '@/components/hero-effects/ExportOptionsDialog';

type EffectType = 'gradient-bars' | 'horizon-glow' | 'floating-orbs' | 'gradient-spheres' | 'image-orbs' | 'image-panels';

interface EffectConfig {
  id: EffectType;
  name: string;
  description: string;
  colorSchemes: string[];
  defaultColorScheme: string;
  hasDensity?: boolean;
  hasSpeed?: boolean;
  hasIntensity?: boolean;
  interactionHints: string[];
}

const EFFECTS: EffectConfig[] = [
  {
    id: 'gradient-bars',
    name: 'Gradient Bars',
    description: 'Animated vertical gradient bars with mouse interaction and wave effects',
    colorSchemes: ['cyan-purple', 'blue-teal', 'purple-pink', 'green-cyan', 'amber-orange'],
    defaultColorScheme: 'cyan-purple',
    hasIntensity: true,
    interactionHints: ['Move mouse to bend bars', 'Bars follow cursor position'],
  },
  {
    id: 'horizon-glow',
    name: 'Horizon Glow',
    description: 'Atmospheric horizon glow with pulsing light rays and depth effect',
    colorSchemes: ['cyan', 'purple', 'blue', 'pink', 'green', 'amber'],
    defaultColorScheme: 'cyan',
    interactionHints: ['Move mouse to shift glow', 'Light rays react to cursor'],
  },
  {
    id: 'floating-orbs',
    name: 'Floating Orbs',
    description: 'Physics-based floating orbs with mouse repulsion and collision detection',
    colorSchemes: ['blue-purple', 'cyan-teal', 'pink-magenta', 'green-emerald', 'amber-orange'],
    defaultColorScheme: 'blue-purple',
    hasDensity: true,
    hasSpeed: true,
    interactionHints: ['Hover to repel orbs', 'Click & hold to attract', 'Orbs collide with each other'],
  },
  {
    id: 'gradient-spheres',
    name: 'Gradient Spheres',
    description: 'Large gradient spheres with fluid physics, spring forces, and interactive reactions',
    colorSchemes: ['purple-blue', 'cyan-purple', 'blue-teal', 'pink-purple'],
    defaultColorScheme: 'purple-blue',
    hasDensity: true,
    hasSpeed: true,
    interactionHints: ['Hover to push spheres', 'Click & hold to pull', 'Watch sphere collisions'],
  },
  {
    id: 'image-orbs',
    name: 'Image Orbs',
    description: 'Floating PNG orbs with hue-rotation color schemes and parallax movement',
    colorSchemes: ['cyan-purple', 'blue-cyan', 'pink-magenta', 'green-teal', 'amber-orange', 'rose-coral'],
    defaultColorScheme: 'cyan-purple',
    hasDensity: true,
    interactionHints: ['Move mouse for parallax', 'Orbs shift with cursor'],
  },
  {
    id: 'image-panels',
    name: 'Image Panels',
    description: 'Overlapping vertical panels with depth parallax and color tinting',
    colorSchemes: ['purple-cyan', 'cyan-blue', 'pink-purple', 'green-teal', 'amber-orange', 'rose-pink'],
    defaultColorScheme: 'purple-cyan',
    hasDensity: true,
    interactionHints: ['Move mouse for depth effect', 'Panels shift at different rates'],
  },
];

const HeroEffectsShowcase = () => {
  const [selectedEffect, setSelectedEffect] = useState<EffectType | null>(null);
  const [mode, setMode] = useState<'dark' | 'light'>('dark');
  const [brightness, setBrightness] = useState(50);
  const [density, setDensity] = useState<'few' | 'normal' | 'many' | 'dense'>('normal');
  const [speed, setSpeed] = useState<'slow' | 'normal' | 'fast' | 'very-fast'>('normal');
  const [intensity, setIntensity] = useState<'subtle' | 'medium' | 'bold'>('medium');
  const [colorScheme, setColorScheme] = useState<string>('cyan-purple');
  const [recordingState, setRecordingState] = useState<VideoRecordingState>({ isRecording: false, progress: 0 });
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [exportTarget, setExportTarget] = useState<{ effectId: string; container: HTMLDivElement | null } | null>(null);

  // Refs for export capture – gallery cards and fullscreen container
  const effectCardRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const fullscreenEffectRef = useRef<HTMLDivElement>(null);

  const selectedConfig = EFFECTS.find(e => e.id === selectedEffect);

  const handleExportPng = useCallback((effectId: string, container: HTMLDivElement | null) => {
    if (!container) return;
    captureEffectAsPng(container, `hero-effect-${effectId}`);
  }, []);

  const handleExportVideo = useCallback((effectId: string, container: HTMLDivElement | null) => {
    if (!container || recordingState.isRecording) return;
    recordEffectAsVideo(container, `hero-effect-${effectId}`, 5000, setRecordingState);
  }, [recordingState.isRecording]);

  const handleOpenExportDialog = useCallback((effectId: string, container: HTMLDivElement | null) => {
    setExportTarget({ effectId, container });
    setExportDialogOpen(true);
  }, []);

  const handleAdvancedExport = useCallback((options: ExportOptions) => {
    if (!exportTarget?.container) return;
    const { effectId, container } = exportTarget;
    const fileName = `hero-effect-${effectId}`;

    setExportDialogOpen(false);

    if (options.format === 'png') {
      captureEffectAsPng(container, fileName, options);
    } else if (options.format === 'webm') {
      recordEffectAsVideo(container, fileName, options.duration * 1000, setRecordingState, options);
    } else if (options.format === 'gif') {
      recordEffectAsGif(container, fileName, setRecordingState, options);
    }
  }, [exportTarget]);

  const renderEffect = (effectId: EffectType, config: { colorScheme: string; mode: 'dark' | 'light'; brightness: number; density?: string; speed?: string; intensity?: string }) => {
    const commonProps = {
      colorScheme: config.colorScheme as any,
      mode: config.mode,
      brightness: config.brightness,
    };

    switch (effectId) {
      case 'gradient-bars':
        return <GradientBarsHero {...commonProps} intensity={(config.intensity as any) || 'medium'} />;
      case 'horizon-glow':
        return <HorizonGlowHero {...commonProps} />;
      case 'floating-orbs':
        return <FloatingOrbsHero {...commonProps} density={(config.density as any) || 'normal'} speed={(config.speed as any) || 'normal'} />;
      case 'gradient-spheres':
        return <GradientSpheresHero {...commonProps} density={(config.density as any) || 'normal'} speed={(config.speed as any) || 'normal'} />;
      case 'image-orbs':
        return <ImageOrbsHero {...commonProps} orbCount={config.density === 'few' ? 3 : config.density === 'many' ? 8 : config.density === 'dense' ? 12 : 5} />;
      case 'image-panels':
        return <ImagePanelsHero {...commonProps} panelCount={config.density === 'few' ? 3 : config.density === 'many' ? 6 : config.density === 'dense' ? 7 : 5} />;
      default:
        return null;
    }
  };

  // Full screen view
  if (selectedEffect) {
    return (
      <div className="relative min-h-screen">
        {/* Effect Background */}
        <div className="absolute inset-0" ref={fullscreenEffectRef}>
          {renderEffect(selectedEffect, { colorScheme, mode, brightness, density, speed, intensity })}
        </div>

        {/* Overlay Content - pointer-events-none so effect is interactive */}
        <div className="relative z-10 min-h-screen flex flex-col pointer-events-none">
          {/* Header */}
          <header className="p-4 flex items-center justify-between bg-gradient-to-b from-black/50 to-transparent pointer-events-auto">
            <Button variant="ghost" onClick={() => setSelectedEffect(null)} className="text-white gap-2 hover:bg-white/10">
              <ArrowLeft className="h-4 w-4" />
              Back to Gallery
            </Button>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-white/20 text-white border-0">
                {selectedConfig?.name}
              </Badge>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="secondary" size="sm" className="gap-2 bg-white/20 text-white border-0 hover:bg-white/30" disabled={recordingState.isRecording}>
                    <Download className="h-4 w-4" />
                    {recordingState.isRecording ? `Recording ${recordingState.progress}%` : 'Export'}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleExportPng(selectedEffect!, fullscreenEffectRef.current)}>
                    <Image className="h-4 w-4 mr-2" />
                    Quick PNG (static)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExportVideo(selectedEffect!, fullscreenEffectRef.current)}>
                    <Video className="h-4 w-4 mr-2" />
                    Quick Video (5s WebM)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => {
                    const config = EFFECTS.find(e => e.id === selectedEffect);
                    if (config) handleOpenExportDialog(selectedEffect!, fullscreenEffectRef.current);
                  }}>
                    <Film className="h-4 w-4 mr-2" />
                    Animated GIF / Advanced Export…
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          {/* Center Title */}
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-white">
              <h1 className="text-5xl md:text-7xl font-bold mb-4 drop-shadow-2xl">
                {selectedConfig?.name}
              </h1>
              <p className="text-xl text-white/70 max-w-2xl mx-auto px-4">
                {selectedConfig?.description}
              </p>
              <p className="mt-6 text-sm text-white/50">
                Move your mouse around to interact with the effect
              </p>
            </div>
          </div>

          {/* Controls Panel */}
          <div className="p-4 pointer-events-auto">
            <Card className="max-w-4xl mx-auto bg-black/60 backdrop-blur-xl border-white/10">
              <CardHeader className="pb-3">
                <CardTitle className="text-white flex items-center gap-2 text-lg">
                  <Settings2 className="h-5 w-5" />
                  Effect Controls
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
                  {/* Mode */}
                  <div className="space-y-2">
                    <Label className="text-white/70 text-xs">Mode</Label>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-white/50">Dark</span>
                      <Switch checked={mode === 'light'} onCheckedChange={(checked) => setMode(checked ? 'light' : 'dark')} />
                      <span className="text-xs text-white/50">Light</span>
                    </div>
                  </div>

                  {/* Color Scheme */}
                  <div className="space-y-2">
                    <Label className="text-white/70 text-xs">Color Scheme</Label>
                    <Select value={colorScheme} onValueChange={setColorScheme}>
                      <SelectTrigger className="h-8 bg-white/10 border-white/20 text-white text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {selectedConfig?.colorSchemes.map(scheme => (
                          <SelectItem key={scheme} value={scheme}>{scheme}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Brightness */}
                  <div className="space-y-2">
                    <Label className="text-white/70 text-xs">Brightness: {brightness}%</Label>
                    <Slider
                      value={[brightness]}
                      onValueChange={([v]) => setBrightness(v)}
                      min={0}
                      max={100}
                      step={5}
                      className="[&_[role=slider]]:bg-white"
                    />
                  </div>

                  {/* Density (if available) */}
                  {selectedConfig?.hasDensity && (
                    <div className="space-y-2">
                      <Label className="text-white/70 text-xs">Density</Label>
                      <Select value={density} onValueChange={(v) => setDensity(v as any)}>
                        <SelectTrigger className="h-8 bg-white/10 border-white/20 text-white text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="few">Few</SelectItem>
                          <SelectItem value="normal">Normal</SelectItem>
                          <SelectItem value="many">Many</SelectItem>
                          <SelectItem value="dense">Dense</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Speed (if available) */}
                  {selectedConfig?.hasSpeed && (
                    <div className="space-y-2">
                      <Label className="text-white/70 text-xs">Speed</Label>
                      <Select value={speed} onValueChange={(v) => setSpeed(v as any)}>
                        <SelectTrigger className="h-8 bg-white/10 border-white/20 text-white text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="slow">Slow</SelectItem>
                          <SelectItem value="normal">Normal</SelectItem>
                          <SelectItem value="fast">Fast</SelectItem>
                          <SelectItem value="very-fast">Very Fast</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Intensity (if available) */}
                  {selectedConfig?.hasIntensity && (
                    <div className="space-y-2">
                      <Label className="text-white/70 text-xs">Intensity</Label>
                      <Select value={intensity} onValueChange={(v) => setIntensity(v as any)}>
                        <SelectTrigger className="h-8 bg-white/10 border-white/20 text-white text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="subtle">Subtle</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="bold">Bold</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Gallery View
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/dashboard" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Dashboard
              </Link>
            </Button>
            <div className="h-6 w-px bg-border" />
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-accent" />
              <h1 className="text-xl font-bold">Hero Background Effects</h1>
            </div>
          </div>
          <Badge variant="outline" className="text-xs">
            {EFFECTS.length} Effects Available
          </Badge>
        </div>
      </header>

      {/* Gallery */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 text-center max-w-2xl mx-auto">
          <p className="text-muted-foreground">
            Interactive hero background effects with mouse tracking, physics simulations, and customizable color schemes. 
            <span className="block mt-2 text-sm text-accent">
              <MousePointer2 className="inline h-4 w-4 mr-1" />
              Move your mouse over each effect to interact!
            </span>
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          {EFFECTS.map((effect) => (
            <Card 
              key={effect.id}
              className="group overflow-hidden transition-all duration-300 hover:shadow-xl cursor-pointer"
              onClick={() => {
                setSelectedEffect(effect.id);
                setColorScheme(effect.defaultColorScheme);
              }}
            >
              {/* Effect Preview - Large interactive area */}
              <div 
                className="relative h-56 sm:h-64 md:h-72 lg:h-80 overflow-hidden"
                ref={(el) => { effectCardRefs.current[effect.id] = el; }}
              >
                {renderEffect(effect.id, { 
                  colorScheme: effect.defaultColorScheme, 
                  mode: 'dark', 
                  brightness: 50,
                  density: 'normal',
                  speed: 'normal',
                  intensity: 'medium'
                })}
                
                {/* Title overlay */}
                <div className="absolute top-4 left-4 right-4 flex items-start justify-between pointer-events-none">
                  <div>
                    <h3 className="text-xl font-bold text-white drop-shadow-lg">{effect.name}</h3>
                    <p className="text-sm text-white/70 mt-1 max-w-xs">{effect.description}</p>
                  </div>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="secondary" 
                        size="icon"
                        className="pointer-events-auto opacity-70 hover:opacity-100 h-8 w-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedEffect(effect.id);
                          setColorScheme(effect.defaultColorScheme);
                        }}
                      >
                        <Maximize2 className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>View Full Screen</TooltipContent>
                  </Tooltip>
                </div>

                {/* Interaction hints - bottom overlay */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 pt-12">
                  <div className="flex flex-wrap gap-2">
                    {effect.interactionHints.map((hint, i) => (
                      <Badge 
                        key={i} 
                        variant="outline" 
                        className="bg-white/10 border-white/20 text-white/90 text-xs backdrop-blur-sm"
                      >
                        {i === 0 && <MousePointer2 className="h-3 w-3 mr-1" />}
                        {i === 1 && hint.toLowerCase().includes('hold') && <Hand className="h-3 w-3 mr-1" />}
                        {i === 1 && !hint.toLowerCase().includes('hold') && <Move className="h-3 w-3 mr-1" />}
                        {i === 2 && <Sparkles className="h-3 w-3 mr-1" />}
                        {hint}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Animated cursor indicator */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                  <div className="relative">
                    <MousePointer2 className="h-8 w-8 text-white/50 animate-bounce" />
                    <div className="absolute inset-0 bg-white/20 rounded-full blur-xl animate-pulse" />
                  </div>
                </div>
              </div>

              {/* Footer with color schemes and controls */}
              <CardContent className="p-4 bg-card/50 border-t">
                <div className="flex items-center justify-between">
                  <div className="flex flex-wrap gap-1">
                    {effect.colorSchemes.slice(0, 4).map(scheme => (
                      <Badge key={scheme} variant="secondary" className="text-xs">
                        {scheme}
                      </Badge>
                    ))}
                    {effect.colorSchemes.length > 4 && (
                      <Badge variant="outline" className="text-xs">
                        +{effect.colorSchemes.length - 4}
                      </Badge>
                    )}
                  </div>
                   <div className="flex gap-1 items-center">
                    {/* Export for PowerPoint dropdown */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-6 px-2 text-xs gap-1"
                          onClick={(e) => e.stopPropagation()}
                          disabled={recordingState.isRecording}
                        >
                          <Download className="h-3 w-3" />
                          Export
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenuItem onClick={() => handleExportPng(effect.id, effectCardRefs.current[effect.id])}>
                          <Image className="h-4 w-4 mr-2" />
                          PNG (static slide background)
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleExportVideo(effect.id, effectCardRefs.current[effect.id])}>
                          <Video className="h-4 w-4 mr-2" />
                          Video (animated background)
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    {effect.hasDensity && (
                      <Tooltip>
                        <TooltipTrigger>
                          <Badge variant="outline" className="text-xs text-muted-foreground">Density</Badge>
                        </TooltipTrigger>
                        <TooltipContent>Adjust number of elements</TooltipContent>
                      </Tooltip>
                    )}
                    {effect.hasSpeed && (
                      <Tooltip>
                        <TooltipTrigger>
                          <Badge variant="outline" className="text-xs text-muted-foreground">Speed</Badge>
                        </TooltipTrigger>
                        <TooltipContent>Control animation speed</TooltipContent>
                      </Tooltip>
                    )}
                    {effect.hasIntensity && (
                      <Tooltip>
                        <TooltipTrigger>
                          <Badge variant="outline" className="text-xs text-muted-foreground">Intensity</Badge>
                        </TooltipTrigger>
                        <TooltipContent>Adjust effect strength</TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
};


export default HeroEffectsShowcase;
