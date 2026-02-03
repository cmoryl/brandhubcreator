import { forwardRef, useState } from 'react';
import { ImageIcon, Video, Move, Upload, Loader2, Check, FolderOpen, Layers, Sparkles, SlidersHorizontal, LayoutPanelLeft } from 'lucide-react';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ImageLibraryPicker } from '@/components/ui/ImageLibraryPicker';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';

interface HeroEditToolbarProps {
  useVideo: boolean;
  kenBurnsEffect: boolean;
  kenBurnsPreview: boolean;
  gradientBarsEffect?: boolean;
  gradientBarsIntensity?: 'subtle' | 'medium' | 'bold';
  isUploading: boolean;
  overlayIntensity?: number;
  overlayGradient?: 'default' | 'radial-dark' | 'top-fade' | 'vignette' | 'brand-tint' | 'none';
  parallaxIntensity?: 0 | 1 | 2 | 3;
  onMediaTypeChange: (type: 'image' | 'video') => void;
  onKenBurnsToggle: () => void;
  onKenBurnsPreviewStart: () => void;
  onKenBurnsPreviewEnd: () => void;
  onGradientBarsToggle?: () => void;
  onGradientBarsIntensityChange?: (value: 'subtle' | 'medium' | 'bold') => void;
  onUploadClick: () => void;
  onVideoUrlClick: () => void;
  onLibrarySelect: (url: string) => void;
  onOverlayIntensityChange?: (value: number) => void;
  onOverlayGradientChange?: (value: 'default' | 'radial-dark' | 'top-fade' | 'vignette' | 'brand-tint' | 'none') => void;
  onParallaxIntensityChange?: (value: 0 | 1 | 2 | 3) => void;
}

const OVERLAY_PRESETS = [
  { id: 'default', label: 'Default', preview: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)' },
  { id: 'radial-dark', label: 'Radial', preview: 'radial-gradient(ellipse at center, rgba(0,0,0,0.3), rgba(0,0,0,0.8))' },
  { id: 'top-fade', label: 'Top Fade', preview: 'linear-gradient(to bottom, rgba(0,0,0,0.6), transparent)' },
  { id: 'vignette', label: 'Vignette', preview: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.8))' },
  { id: 'brand-tint', label: 'Brand Tint', preview: 'linear-gradient(135deg, hsl(var(--primary) / 0.4), hsl(var(--accent) / 0.3))' },
  { id: 'none', label: 'None', preview: 'transparent' },
] as const;

const GRADIENT_BARS_INTENSITIES = [
  { id: 'subtle', label: 'Subtle' },
  { id: 'medium', label: 'Medium' },
  { id: 'bold', label: 'Bold' },
] as const;

export const HeroEditToolbar = forwardRef<HTMLDivElement, HeroEditToolbarProps>(
  function HeroEditToolbar({
    useVideo,
    kenBurnsEffect,
    kenBurnsPreview,
    gradientBarsEffect = false,
    gradientBarsIntensity = 'medium',
    isUploading,
    overlayIntensity = 50,
    overlayGradient = 'default',
    parallaxIntensity = 1,
    onMediaTypeChange,
    onKenBurnsToggle,
    onKenBurnsPreviewStart,
    onKenBurnsPreviewEnd,
    onGradientBarsToggle,
    onGradientBarsIntensityChange,
    onUploadClick,
    onVideoUrlClick,
    onLibrarySelect,
    onOverlayIntensityChange,
    onOverlayGradientChange,
    onParallaxIntensityChange,
  }, ref) {
    const [activeTab, setActiveTab] = useState('media');

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
            <TabsContent value="effects" className="p-4 space-y-4 mt-0">
              {/* Motion Effects Section */}
              {!useVideo && (
                <div className="space-y-3">
                  <label className="text-white/60 text-xs font-medium uppercase tracking-wider">Motion Effect</label>
                  
                  {/* Ken Burns Effect Button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      // Disable gradient bars if enabling Ken Burns
                      if (!kenBurnsEffect && gradientBarsEffect && onGradientBarsToggle) {
                        onGradientBarsToggle();
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

                  {/* Gradient Bars Effect Button */}
                  {onGradientBarsToggle && (
                    <>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          // Disable Ken Burns if enabling gradient bars
                          if (!gradientBarsEffect && kenBurnsEffect) {
                            onKenBurnsToggle();
                          }
                          onGradientBarsToggle();
                        }}
                        className={cn(
                          "w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border transition-all text-sm font-medium",
                          gradientBarsEffect
                            ? "bg-accent/30 border-accent/50 text-white" 
                            : "bg-white/10 border-white/20 text-white/80 hover:bg-white/15 hover:text-white"
                        )}
                      >
                        <LayoutPanelLeft className="h-4 w-4" />
                        <span>Gradient Bars Effect</span>
                        {gradientBarsEffect && <Check className="h-4 w-4 text-accent" />}
                      </button>
                      <p className="text-white/40 text-xs text-center">Interactive vertical gradient bars with mouse parallax</p>

                      {/* Intensity controls when gradient bars is active */}
                      {gradientBarsEffect && onGradientBarsIntensityChange && (
                        <div className="pt-2 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-white/60 text-xs">Intensity</span>
                          </div>
                          <div className="flex gap-2">
                            {GRADIENT_BARS_INTENSITIES.map((preset) => (
                              <button
                                key={preset.id}
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onGradientBarsIntensityChange(preset.id);
                                }}
                                className={cn(
                                  "flex-1 py-2 rounded-lg border text-xs font-medium transition-all",
                                  gradientBarsIntensity === preset.id
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
                    </>
                  )}
                </div>
              )}

              {/* Parallax Intensity - only show when neither Ken Burns nor Gradient Bars is active */}
              {!useVideo && !kenBurnsEffect && !gradientBarsEffect && onParallaxIntensityChange && (
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
          </Tabs>
        </div>
      </div>
    );
  }
);

HeroEditToolbar.displayName = 'HeroEditToolbar';
