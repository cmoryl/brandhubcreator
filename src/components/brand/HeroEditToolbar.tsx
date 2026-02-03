import { forwardRef, useState } from 'react';
import { ImageIcon, Video, Move, Upload, Loader2, Check, FolderOpen, Layers, Sparkles, SlidersHorizontal, Type, Sun, Moon, Circle } from 'lucide-react';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ImageLibraryPicker } from '@/components/ui/ImageLibraryPicker';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

export type HeroEffectType = 'none' | 'gradient-bars' | 'horizon-glow' | 'floating-orbs' | 'gradient-spheres' | 'image-orbs' | 'image-panels';

interface HeroEditToolbarProps {
  useVideo: boolean;
  kenBurnsEffect: boolean;
  kenBurnsPreview: boolean;
  // Unified hero effect props
  heroEffect?: HeroEffectType;
  heroEffectIntensity?: 'subtle' | 'medium' | 'bold';
  heroEffectColorScheme?: string;
  heroEffectMode?: 'dark' | 'light';
  heroEffectBrightness?: number;
  isUploading: boolean;
  overlayIntensity?: number;
  overlayGradient?: 'default' | 'radial-dark' | 'top-fade' | 'vignette' | 'brand-tint' | 'none';
  parallaxIntensity?: 0 | 1 | 2 | 3;
  // Text customization props
  taglineColor?: string;
  titleColor?: string;
  taglineGlow?: boolean;
  onMediaTypeChange: (type: 'image' | 'video') => void;
  onKenBurnsToggle: () => void;
  onKenBurnsPreviewStart: () => void;
  onKenBurnsPreviewEnd: () => void;
  // Unified hero effect callbacks
  onHeroEffectChange?: (effect: HeroEffectType) => void;
  onHeroEffectIntensityChange?: (value: 'subtle' | 'medium' | 'bold') => void;
  onHeroEffectColorSchemeChange?: (value: string) => void;
  onHeroEffectModeChange?: (value: 'dark' | 'light') => void;
  onHeroEffectBrightnessChange?: (value: number) => void;
  onUploadClick: () => void;
  onVideoUrlClick: () => void;
  onLibrarySelect: (url: string) => void;
  onOverlayIntensityChange?: (value: number) => void;
  onOverlayGradientChange?: (value: 'default' | 'radial-dark' | 'top-fade' | 'vignette' | 'brand-tint' | 'none') => void;
  onParallaxIntensityChange?: (value: 0 | 1 | 2 | 3) => void;
  // Text customization callbacks
  onTaglineColorChange?: (color: string) => void;
  onTitleColorChange?: (color: string) => void;
  onTaglineGlowChange?: (enabled: boolean) => void;
}

const OVERLAY_PRESETS = [
  { id: 'default', label: 'Default', preview: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)' },
  { id: 'radial-dark', label: 'Radial', preview: 'radial-gradient(ellipse at center, rgba(0,0,0,0.3), rgba(0,0,0,0.8))' },
  { id: 'top-fade', label: 'Top Fade', preview: 'linear-gradient(to bottom, rgba(0,0,0,0.6), transparent)' },
  { id: 'vignette', label: 'Vignette', preview: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.8))' },
  { id: 'brand-tint', label: 'Brand Tint', preview: 'linear-gradient(135deg, hsl(var(--primary) / 0.4), hsl(var(--accent) / 0.3))' },
  { id: 'none', label: 'None', preview: 'transparent' },
] as const;

const EFFECT_INTENSITIES = [
  { id: 'subtle', label: 'Subtle' },
  { id: 'medium', label: 'Medium' },
  { id: 'bold', label: 'Bold' },
] as const;

// Hero effect presets with visual previews
const HERO_EFFECTS: Array<{
  id: HeroEffectType;
  label: string;
  description: string;
  preview: string; // CSS gradient for preview thumbnail
  colorSchemes: Array<{ id: string; label: string; colors: string[] }>;
}> = [
  {
    id: 'none',
    label: 'None',
    description: 'Use image/video only',
    preview: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
    colorSchemes: [],
  },
  {
    id: 'gradient-bars',
    label: 'Gradient Bars',
    description: 'Overlapping vertical panels',
    preview: 'repeating-linear-gradient(90deg, #00d4ff 0%, #6366f1 15%, #a855f7 30%, #6366f1 45%, #00d4ff 60%)',
    colorSchemes: [
      { id: 'cyan-purple', label: 'Cyan/Purple', colors: ['#00d4ff', '#a855f7'] },
      { id: 'blue-teal', label: 'Blue/Teal', colors: ['#3b82f6', '#14b8a6'] },
      { id: 'purple-pink', label: 'Purple/Pink', colors: ['#a855f7', '#ec4899'] },
      { id: 'green-cyan', label: 'Green/Cyan', colors: ['#22c55e', '#06b6d4'] },
      { id: 'amber-orange', label: 'Amber/Orange', colors: ['#f59e0b', '#f97316'] },
    ],
  },
  {
    id: 'horizon-glow',
    label: 'Horizon Glow',
    description: 'Glowing arc rising from bottom',
    preview: 'radial-gradient(ellipse 80% 50% at 50% 100%, #00d4ff 0%, #6366f1 30%, transparent 70%)',
    colorSchemes: [
      { id: 'cyan', label: 'Cyan', colors: ['#00d4ff', '#06b6d4'] },
      { id: 'purple', label: 'Purple', colors: ['#a855f7', '#8b5cf6'] },
      { id: 'blue', label: 'Blue', colors: ['#3b82f6', '#2563eb'] },
      { id: 'teal', label: 'Teal', colors: ['#14b8a6', '#0d9488'] },
      { id: 'rose', label: 'Rose', colors: ['#f43f5e', '#e11d48'] },
    ],
  },
  {
    id: 'floating-orbs',
    label: 'Floating Orbs',
    description: 'Animated gradient spheres',
    preview: 'radial-gradient(circle at 30% 50%, #3b82f6 0%, transparent 50%), radial-gradient(circle at 70% 50%, #a855f7 0%, transparent 50%)',
    colorSchemes: [
      { id: 'blue-purple', label: 'Blue/Purple', colors: ['#3b82f6', '#a855f7'] },
      { id: 'cyan-teal', label: 'Cyan/Teal', colors: ['#00d4ff', '#14b8a6'] },
      { id: 'purple-pink', label: 'Purple/Pink', colors: ['#a855f7', '#ec4899'] },
      { id: 'teal-green', label: 'Teal/Green', colors: ['#14b8a6', '#22c55e'] },
    ],
  },
  {
    id: 'gradient-spheres',
    label: 'Gradient Spheres',
    description: 'Overlapping translucent orbs',
    preview: 'radial-gradient(circle at 35% 45%, #a855f7 0%, transparent 45%), radial-gradient(circle at 65% 55%, #3b82f6 0%, transparent 45%)',
    colorSchemes: [
      { id: 'purple-blue', label: 'Purple/Blue', colors: ['#a855f7', '#3b82f6'] },
      { id: 'cyan-purple', label: 'Cyan/Purple', colors: ['#00d4ff', '#a855f7'] },
      { id: 'blue-teal', label: 'Blue/Teal', colors: ['#3b82f6', '#14b8a6'] },
      { id: 'pink-purple', label: 'Pink/Purple', colors: ['#ec4899', '#a855f7'] },
    ],
  },
  {
    id: 'image-orbs',
    label: 'Image Orbs',
    description: 'Real PNG orbs with parallax',
    preview: 'radial-gradient(circle at 30% 40%, #00d4ff 0%, transparent 40%), radial-gradient(circle at 70% 60%, #6366f1 0%, transparent 40%), linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 100%)',
    colorSchemes: [], // Uses actual PNG images - no color schemes
  },
  {
    id: 'image-panels',
    label: 'Image Panels',
    description: 'Real PNG panels with parallax',
    preview: 'repeating-linear-gradient(90deg, #1a1a40 0%, #3b3b80 8%, #00d4ff 10%, #1a1a40 12%, #1a1a40 20%)',
    colorSchemes: [], // Uses actual PNG images - no color schemes
  },
];

const TEXT_COLOR_PRESETS = [
  { id: '#ffffff', label: 'White' },
  { id: '#f0f0f0', label: 'Off-White' },
  { id: '#139cd8', label: 'Brand Blue' },
  { id: '#00d4ff', label: 'Cyan' },
  { id: '#a855f7', label: 'Purple' },
  { id: '#f59e0b', label: 'Amber' },
  { id: '#10b981', label: 'Emerald' },
  { id: '#f43f5e', label: 'Rose' },
] as const;


export const HeroEditToolbar = forwardRef<HTMLDivElement, HeroEditToolbarProps>(
  function HeroEditToolbar({
    useVideo,
    kenBurnsEffect,
    kenBurnsPreview,
    heroEffect = 'none',
    heroEffectIntensity = 'medium',
    heroEffectColorScheme = 'cyan-purple',
    heroEffectMode = 'dark',
    heroEffectBrightness = 50,
    isUploading,
    overlayIntensity = 50,
    overlayGradient = 'default',
    parallaxIntensity = 1,
    taglineColor = '#ffffff',
    titleColor = '#ffffff',
    taglineGlow = false,
    onMediaTypeChange,
    onKenBurnsToggle,
    onKenBurnsPreviewStart,
    onKenBurnsPreviewEnd,
    onHeroEffectChange,
    onHeroEffectIntensityChange,
    onHeroEffectColorSchemeChange,
    onHeroEffectModeChange,
    onHeroEffectBrightnessChange,
    onUploadClick,
    onVideoUrlClick,
    onLibrarySelect,
    onOverlayIntensityChange,
    onOverlayGradientChange,
    onParallaxIntensityChange,
    onTaglineColorChange,
    onTitleColorChange,
    onTaglineGlowChange,
  }, ref) {
    const [activeTab, setActiveTab] = useState('media');

    // Get current effect config
    const currentEffectConfig = HERO_EFFECTS.find(e => e.id === heroEffect) || HERO_EFFECTS[0];

    return (
      <div 
        ref={ref}
        className="absolute inset-0 z-40 bg-black/40 flex items-center justify-center transition-opacity animate-fade-in"
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Enhanced toolbar container with tabs */}
        <div 
          className="bg-black/70 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl max-w-lg w-full mx-4 overflow-hidden"
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            {/* Tab Navigation */}
            <TabsList className="w-full bg-white/5 rounded-none border-b border-white/10 p-1 h-auto gap-1" onClick={(e) => e.stopPropagation()}>
              <TabsTrigger
                value="media" 
                className="flex-1 text-white/70 data-[state=active]:text-white data-[state=active]:bg-white/15 rounded-lg py-2.5 text-sm gap-2"
              >
                <ImageIcon className="h-4 w-4" />
                Media
              </TabsTrigger>
              <TabsTrigger 
                value="effects" 
                className="flex-1 text-white/70 data-[state=active]:text-white data-[state=active]:bg-white/15 rounded-lg py-2.5 text-sm gap-2"
              >
                <Sparkles className="h-4 w-4" />
                Effects
              </TabsTrigger>
              <TabsTrigger 
                value="overlay" 
                className="flex-1 text-white/70 data-[state=active]:text-white data-[state=active]:bg-white/15 rounded-lg py-2.5 text-sm gap-2"
              >
                <Layers className="h-4 w-4" />
                Overlay
              </TabsTrigger>
              <TabsTrigger 
                value="text" 
                className="flex-1 text-white/70 data-[state=active]:text-white data-[state=active]:bg-white/15 rounded-lg py-2.5 text-sm gap-2"
              >
                <Type className="h-4 w-4" />
                Text
              </TabsTrigger>
            </TabsList>

            {/* Media Tab */}
            <TabsContent value="media" className="p-4 space-y-4 mt-0">
              {/* Media Type Toggle */}
              <div className="flex items-center justify-center">
                <ToggleGroup 
                  type="single" 
                  value={useVideo ? 'video' : 'image'} 
                  onValueChange={(val) => val && onMediaTypeChange(val as 'image' | 'video')}
                  className="bg-white/10 rounded-xl p-1 border border-white/10"
                >
                  <ToggleGroupItem 
                    value="image" 
                    className="text-white data-[state=on]:bg-white/20 data-[state=on]:text-white rounded-lg px-4 py-2 text-sm gap-2"
                  >
                    <ImageIcon className="h-4 w-4" />
                    Image
                  </ToggleGroupItem>
                  <ToggleGroupItem 
                    value="video" 
                    className="text-white data-[state=on]:bg-white/20 data-[state=on]:text-white rounded-lg px-4 py-2 text-sm gap-2"
                  >
                    <Video className="h-4 w-4" />
                    Video
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>

              {/* Upload & Library Actions */}
              <div className="flex items-center justify-center gap-2">
                <button
                  type="button"
                  className={cn(
                    "flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/20 text-white text-sm font-medium transition-all",
                    isUploading ? "opacity-70 cursor-wait bg-white/5" : "hover:bg-white/15 bg-white/10"
                  )}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!isUploading) onUploadClick();
                  }}
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4" />
                      Upload {useVideo ? 'Video' : 'Image'}
                    </>
                  )}
                </button>

                {!useVideo && (
                  <ImageLibraryPicker
                    onSelect={onLibrarySelect}
                    defaultCategory="Backgrounds"
                    trigger={
                      <button
                        type="button"
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/20 text-white text-sm font-medium hover:bg-white/15 bg-white/10 transition-all"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <FolderOpen className="h-4 w-4" />
                        Library
                      </button>
                    }
                  />
                )}

                {useVideo && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onVideoUrlClick();
                    }}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/20 text-white text-sm font-medium hover:bg-white/15 bg-white/10 transition-all"
                  >
                    Paste URL
                  </button>
                )}
              </div>
            </TabsContent>

            {/* Effects Tab */}
            <TabsContent value="effects" className="p-4 space-y-4 mt-0 max-h-[400px] overflow-y-auto">
              {/* Motion Effects Section */}
              {!useVideo && (
                <div className="space-y-3">
                  <label className="text-white/60 text-xs font-medium uppercase tracking-wider">Motion Effect</label>
                  
                  {/* Ken Burns Effect Button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      // Disable hero effects if enabling Ken Burns
                      if (!kenBurnsEffect && heroEffect !== 'none' && onHeroEffectChange) {
                        onHeroEffectChange('none');
                      }
                      onKenBurnsToggle();
                    }}
                    onMouseEnter={onKenBurnsPreviewStart}
                    onMouseLeave={onKenBurnsPreviewEnd}
                    className={cn(
                      "w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border transition-all text-sm font-medium",
                      kenBurnsEffect
                        ? "bg-accent/30 border-accent/50 text-white" 
                        : kenBurnsPreview
                          ? "bg-white/20 border-white/30 text-white ring-2 ring-accent/40"
                          : "bg-white/10 border-white/20 text-white/80 hover:bg-white/15 hover:text-white"
                    )}
                  >
                    <Move className="h-4 w-4" />
                    <span>{kenBurnsPreview ? 'Preview...' : 'Ken Burns Effect'}</span>
                    {kenBurnsEffect && <Check className="h-4 w-4 text-accent" />}
                  </button>
                  <p className="text-white/40 text-xs text-center">Slow cinematic pan & zoom animation</p>
                </div>
              )}

              {/* Background Effect Selection */}
              {!useVideo && onHeroEffectChange && (
                <div className="space-y-3">
                  <label className="text-white/60 text-xs font-medium uppercase tracking-wider">Background Effect</label>
                  
                  {/* Effect grid with visual previews */}
                  <div className="grid grid-cols-2 gap-2">
                    {HERO_EFFECTS.map((effect) => (
                      <button
                        key={effect.id}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          // Disable Ken Burns when selecting an effect
                          if (effect.id !== 'none' && kenBurnsEffect) {
                            onKenBurnsToggle();
                          }
                          onHeroEffectChange(effect.id);
                        }}
                        className={cn(
                          "relative h-20 rounded-xl border-2 overflow-hidden transition-all text-left p-2 flex flex-col justify-end",
                          heroEffect === effect.id
                            ? "border-accent ring-2 ring-accent/30"
                            : "border-white/20 hover:border-white/40"
                        )}
                      >
                        {/* Preview background */}
                        <div 
                          className="absolute inset-0 opacity-80"
                          style={{ background: effect.preview }}
                        />
                        
                        {/* Label overlay */}
                        <div className="relative z-10">
                          <span className="text-white text-xs font-medium drop-shadow-lg">{effect.label}</span>
                          <p className="text-white/60 text-[10px] line-clamp-1">{effect.description}</p>
                        </div>

                        {heroEffect === effect.id && (
                          <div className="absolute top-2 right-2 z-10">
                            <Check className="h-4 w-4 text-accent drop-shadow-lg" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>

                  {/* Effect customization when an effect is active */}
                  {heroEffect !== 'none' && (
                    <div className="pt-3 space-y-4 border-t border-white/10">
                      {/* Intensity */}
                      {onHeroEffectIntensityChange && (
                        <div className="space-y-2">
                          <span className="text-white/60 text-xs">Intensity</span>
                          <div className="flex gap-2">
                            {EFFECT_INTENSITIES.map((preset) => (
                              <button
                                key={preset.id}
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onHeroEffectIntensityChange(preset.id);
                                }}
                                className={cn(
                                  "flex-1 py-2 rounded-lg border text-xs font-medium transition-all",
                                  heroEffectIntensity === preset.id
                                    ? "bg-white/20 border-white/40 text-white"
                                    : "bg-white/5 border-white/10 text-white/60 hover:bg-white/10"
                                )}
                              >
                                {preset.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Color Scheme - dynamic based on selected effect */}
                      {onHeroEffectColorSchemeChange && currentEffectConfig.colorSchemes.length > 0 && (
                        <div className="space-y-2">
                          <span className="text-white/60 text-xs">Color Scheme</span>
                          <div className="grid grid-cols-5 gap-1.5">
                            {currentEffectConfig.colorSchemes.map((scheme) => (
                              <button
                                key={scheme.id}
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onHeroEffectColorSchemeChange(scheme.id);
                                }}
                                className={cn(
                                  "relative h-8 rounded-lg border-2 overflow-hidden transition-all",
                                  heroEffectColorScheme === scheme.id
                                    ? "border-white ring-1 ring-white/50"
                                    : "border-white/20 hover:border-white/40"
                                )}
                                title={scheme.label}
                              >
                                <div 
                                  className="absolute inset-0"
                                  style={{
                                    background: `linear-gradient(135deg, ${scheme.colors[0]}, ${scheme.colors[1]})`
                                  }}
                                />
                                {heroEffectColorScheme === scheme.id && (
                                  <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                                    <Check className="h-3 w-3 text-white" />
                                  </div>
                                )}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Dark/Light Mode Toggle */}
                      {onHeroEffectModeChange && (
                        <div className="space-y-2">
                          <span className="text-white/60 text-xs">Mode</span>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onHeroEffectModeChange('dark');
                              }}
                              className={cn(
                                "flex-1 py-2 rounded-lg border text-xs font-medium transition-all flex items-center justify-center gap-1.5",
                                heroEffectMode === 'dark'
                                  ? "bg-white/20 border-white/40 text-white"
                                  : "bg-white/5 border-white/10 text-white/60 hover:bg-white/10"
                              )}
                            >
                              <Moon className="h-3 w-3" />
                              Dark
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onHeroEffectModeChange('light');
                              }}
                              className={cn(
                                "flex-1 py-2 rounded-lg border text-xs font-medium transition-all flex items-center justify-center gap-1.5",
                                heroEffectMode === 'light'
                                  ? "bg-white/20 border-white/40 text-white"
                                  : "bg-white/5 border-white/10 text-white/60 hover:bg-white/10"
                              )}
                            >
                              <Sun className="h-3 w-3" />
                              Light
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Brightness Slider */}
                      {onHeroEffectBrightnessChange && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-white/60 text-xs">Brightness</span>
                            <span className="text-white/80 text-xs font-mono">{heroEffectBrightness}%</span>
                          </div>
                          <Slider
                            value={[heroEffectBrightness]}
                            onValueChange={([val]) => onHeroEffectBrightnessChange(val)}
                            min={10}
                            max={100}
                            step={5}
                            className="w-full"
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Parallax Intensity - only show when no effects are active */}
              {!useVideo && !kenBurnsEffect && heroEffect === 'none' && onParallaxIntensityChange && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-white/60 text-xs font-medium uppercase tracking-wider">Parallax Depth</label>
                    <span className="text-white/80 text-xs font-mono">
                      {parallaxIntensity === 0 ? 'Off' : `Level ${parallaxIntensity}`}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    {([0, 1, 2, 3] as const).map((level) => (
                      <button
                        key={level}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onParallaxIntensityChange(level);
                        }}
                        className={cn(
                          "flex-1 py-2 rounded-lg border text-sm font-medium transition-all",
                          parallaxIntensity === level
                            ? "bg-white/20 border-white/40 text-white"
                            : "bg-white/5 border-white/10 text-white/60 hover:bg-white/10"
                        )}
                      >
                        {level === 0 ? 'Off' : level}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {useVideo && (
                <div className="text-center py-4 text-white/40 text-sm">
                  <SlidersHorizontal className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Motion effects are not available for video backgrounds</p>
                </div>
              )}
            </TabsContent>

            {/* Overlay Tab */}
            <TabsContent value="overlay" className="p-4 space-y-4 mt-0">
              {/* Overlay Intensity Slider */}
              {onOverlayIntensityChange && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-white/60 text-xs font-medium uppercase tracking-wider">Darkness</label>
                    <span className="text-white/80 text-xs font-mono">{overlayIntensity}%</span>
                  </div>
                  <Slider
                    value={[overlayIntensity]}
                    onValueChange={([val]) => onOverlayIntensityChange(val)}
                    min={0}
                    max={100}
                    step={5}
                    className="w-full"
                  />
                </div>
              )}

              {/* Overlay Gradient Presets */}
              {onOverlayGradientChange && (
                <div className="space-y-3">
                  <label className="text-white/60 text-xs font-medium uppercase tracking-wider">Gradient Style</label>
                  <div className="grid grid-cols-3 gap-2">
                    {OVERLAY_PRESETS.map((preset) => (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOverlayGradientChange(preset.id);
                        }}
                        className={cn(
                          "relative h-16 rounded-lg border-2 overflow-hidden transition-all",
                          overlayGradient === preset.id
                            ? "border-accent ring-2 ring-accent/30"
                            : "border-white/20 hover:border-white/40"
                        )}
                      >
                        <div 
                          className="absolute inset-0 bg-gray-700"
                          style={{ background: preset.preview }}
                        />
                        <span className="absolute inset-x-0 bottom-0 text-white text-[10px] font-medium py-1 bg-black/50">
                          {preset.label}
                        </span>
                        {overlayGradient === preset.id && (
                          <div className="absolute top-1 right-1">
                            <Check className="h-3 w-3 text-accent" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>

            {/* Text Tab */}
            <TabsContent value="text" className="p-4 space-y-4 mt-0">
              {/* Title Color */}
              {onTitleColorChange && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-white/60 text-xs font-medium uppercase tracking-wider">Title Color</label>
                    <div 
                      className="w-6 h-6 rounded-full border-2 border-white/30"
                      style={{ backgroundColor: titleColor }}
                    />
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {TEXT_COLOR_PRESETS.map((preset) => (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onTitleColorChange(preset.id);
                        }}
                        className={cn(
                          "relative h-10 rounded-lg border-2 overflow-hidden transition-all flex items-center justify-center",
                          titleColor === preset.id
                            ? "border-accent ring-2 ring-accent/30"
                            : "border-white/20 hover:border-white/40"
                        )}
                        style={{ backgroundColor: preset.id }}
                      >
                        {titleColor === preset.id && (
                          <Check className="h-4 w-4" style={{ color: preset.id === '#ffffff' || preset.id === '#f0f0f0' ? '#000' : '#fff' }} />
                        )}
                      </button>
                    ))}
                  </div>
                  {/* Custom color input */}
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={titleColor}
                      onChange={(e) => onTitleColorChange(e.target.value)}
                      className="w-10 h-10 rounded-lg border border-white/20 cursor-pointer bg-transparent"
                    />
                    <span className="text-white/60 text-xs">Custom color</span>
                  </div>
                </div>
              )}

              {/* Tagline Color */}
              {onTaglineColorChange && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-white/60 text-xs font-medium uppercase tracking-wider">Tagline Color</label>
                    <div 
                      className="w-6 h-6 rounded-full border-2 border-white/30"
                      style={{ backgroundColor: taglineColor }}
                    />
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {TEXT_COLOR_PRESETS.map((preset) => (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onTaglineColorChange(preset.id);
                        }}
                        className={cn(
                          "relative h-10 rounded-lg border-2 overflow-hidden transition-all flex items-center justify-center",
                          taglineColor === preset.id
                            ? "border-accent ring-2 ring-accent/30"
                            : "border-white/20 hover:border-white/40"
                        )}
                        style={{ backgroundColor: preset.id }}
                      >
                        {taglineColor === preset.id && (
                          <Check className="h-4 w-4" style={{ color: preset.id === '#ffffff' || preset.id === '#f0f0f0' ? '#000' : '#fff' }} />
                        )}
                      </button>
                    ))}
                  </div>
                  {/* Custom color input */}
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={taglineColor}
                      onChange={(e) => onTaglineColorChange(e.target.value)}
                      className="w-10 h-10 rounded-lg border border-white/20 cursor-pointer bg-transparent"
                    />
                    <span className="text-white/60 text-xs">Custom color</span>
                  </div>
                </div>
              )}

              {/* Tagline Glow Effect */}
              {onTaglineGlowChange && (
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-white/60" />
                    <Label htmlFor="tagline-glow" className="text-white/80 text-sm">Text Glow Effect</Label>
                  </div>
                  <Switch
                    id="tagline-glow"
                    checked={taglineGlow}
                    onCheckedChange={onTaglineGlowChange}
                  />
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    );
  }
);

HeroEditToolbar.displayName = 'HeroEditToolbar';
