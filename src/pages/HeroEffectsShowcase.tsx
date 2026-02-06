import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Sparkles, Settings2, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { GradientBarsHero } from '@/components/backgrounds/GradientBarsHero';
import { HorizonGlowHero } from '@/components/backgrounds/HorizonGlowHero';
import { FloatingOrbsHero } from '@/components/backgrounds/FloatingOrbsHero';
import { GradientSpheresHero } from '@/components/backgrounds/GradientSpheresHero';
import { ImageOrbsHero } from '@/components/backgrounds/ImageOrbsHero';
import { ImagePanelsHero } from '@/components/backgrounds/ImagePanelsHero';

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
}

const EFFECTS: EffectConfig[] = [
  {
    id: 'gradient-bars',
    name: 'Gradient Bars',
    description: 'Animated vertical gradient bars with mouse interaction and wave effects',
    colorSchemes: ['cyan-purple', 'blue-teal', 'purple-pink', 'green-cyan', 'amber-orange'],
    defaultColorScheme: 'cyan-purple',
    hasIntensity: true,
  },
  {
    id: 'horizon-glow',
    name: 'Horizon Glow',
    description: 'Atmospheric horizon glow with pulsing light rays and depth effect',
    colorSchemes: ['cyan', 'purple', 'blue', 'pink', 'green', 'amber'],
    defaultColorScheme: 'cyan',
  },
  {
    id: 'floating-orbs',
    name: 'Floating Orbs',
    description: 'Physics-based floating orbs with mouse repulsion and collision detection',
    colorSchemes: ['blue-purple', 'cyan-teal', 'pink-magenta', 'green-emerald', 'amber-orange'],
    defaultColorScheme: 'blue-purple',
    hasDensity: true,
    hasSpeed: true,
  },
  {
    id: 'gradient-spheres',
    name: 'Gradient Spheres',
    description: 'Large gradient spheres with fluid physics, spring forces, and interactive reactions',
    colorSchemes: ['purple-blue', 'cyan-purple', 'blue-teal', 'pink-purple'],
    defaultColorScheme: 'purple-blue',
    hasDensity: true,
    hasSpeed: true,
  },
  {
    id: 'image-orbs',
    name: 'Image Orbs',
    description: 'Floating PNG orbs with hue-rotation color schemes and parallax movement',
    colorSchemes: ['cyan-purple', 'blue-cyan', 'pink-magenta', 'green-teal', 'amber-orange', 'rose-coral'],
    defaultColorScheme: 'cyan-purple',
    hasDensity: true,
  },
  {
    id: 'image-panels',
    name: 'Image Panels',
    description: 'Overlapping vertical panels with depth parallax and color tinting',
    colorSchemes: ['purple-cyan', 'cyan-blue', 'pink-purple', 'green-teal', 'amber-orange', 'rose-pink'],
    defaultColorScheme: 'purple-cyan',
    hasDensity: true,
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

  const selectedConfig = EFFECTS.find(e => e.id === selectedEffect);

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
        <div className="absolute inset-0">
          {renderEffect(selectedEffect, { colorScheme, mode, brightness, density, speed, intensity })}
        </div>

        {/* Overlay Content */}
        <div className="relative z-10 min-h-screen flex flex-col">
          {/* Header */}
          <header className="p-4 flex items-center justify-between bg-gradient-to-b from-black/50 to-transparent">
            <Button variant="ghost" onClick={() => setSelectedEffect(null)} className="text-white gap-2 hover:bg-white/10">
              <ArrowLeft className="h-4 w-4" />
              Back to Gallery
            </Button>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-white/20 text-white border-0">
                {selectedConfig?.name}
              </Badge>
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
          <div className="p-4">
            <Card className="max-w-4xl mx-auto bg-black/60 backdrop-blur-xl border-white/10">
              <CardHeader className="pb-3">
                <CardTitle className="text-white flex items-center gap-2 text-lg">
                  <Settings2 className="h-5 w-5" />
                  Effect Controls
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
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
            Click any effect to view it full-screen with live controls.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {EFFECTS.map((effect) => (
            <Card 
              key={effect.id}
              className="group overflow-hidden cursor-pointer hover:ring-2 hover:ring-accent transition-all duration-300"
              onClick={() => {
                setSelectedEffect(effect.id);
                setColorScheme(effect.defaultColorScheme);
              }}
            >
              {/* Effect Preview */}
              <div className="relative h-48 overflow-hidden">
                {renderEffect(effect.id, { 
                  colorScheme: effect.defaultColorScheme, 
                  mode: 'dark', 
                  brightness: 50,
                  density: 'normal',
                  speed: 'normal',
                  intensity: 'medium'
                })}
                {/* Overlay on hover */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    className="opacity-0 group-hover:opacity-100 transition-opacity gap-2"
                  >
                    <Eye className="h-4 w-4" />
                    View Full Screen
                  </Button>
                </div>
              </div>

              {/* Info */}
              <CardContent className="p-4">
                <h3 className="font-semibold text-lg mb-1">{effect.name}</h3>
                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                  {effect.description}
                </p>
                <div className="flex flex-wrap gap-1">
                  {effect.colorSchemes.slice(0, 3).map(scheme => (
                    <Badge key={scheme} variant="secondary" className="text-xs">
                      {scheme}
                    </Badge>
                  ))}
                  {effect.colorSchemes.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{effect.colorSchemes.length - 3} more
                    </Badge>
                  )}
                </div>
                <div className="flex gap-2 mt-3">
                  {effect.hasDensity && (
                    <Badge variant="outline" className="text-xs text-muted-foreground">Density</Badge>
                  )}
                  {effect.hasSpeed && (
                    <Badge variant="outline" className="text-xs text-muted-foreground">Speed</Badge>
                  )}
                  {effect.hasIntensity && (
                    <Badge variant="outline" className="text-xs text-muted-foreground">Intensity</Badge>
                  )}
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
