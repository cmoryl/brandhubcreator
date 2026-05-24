import { useState, useEffect, useMemo } from 'react';
import { Plus, X, Quote, Sparkles, Palette, Type, Pencil, Check, ChevronDown, Eye, EyeOff, Star, Tag } from 'lucide-react';
import { BrandTagline, TaglineFontSettings, TaglineVariation } from '@/types/brand';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GoogleFontPicker, DEFAULT_FONT_SETTINGS, FontSettings } from '@/components/ui/google-font-picker';
import { AnimatedTagline, TaglineAnimation, TaglineHoverEffect, TaglineEnvironment, TAGLINE_ENVIRONMENT_OPTIONS } from '@/components/ui/animated-tagline';
import { SectionEnvironmentOverlay } from './SectionEnvironmentOverlay';
import { TaglineAnimationSettings } from './TaglineAnimationSettings';
import { TypographyPairingPreview, POPULAR_FONT_PAIRINGS } from './settings/TypographyPairingPreview';
import { cn } from '@/lib/utils';
import { TransPerfectVoicePanel } from './identity/TransPerfectVoicePanel';

type TaglineBackgroundStyle = 'floating' | 'gradient' | 'solid' | 'glass';
type VariationStyle = TaglineVariation['style'];

interface TaglineSectionProps {
  tagline: BrandTagline;
  onTaglineChange?: (tagline: BrandTagline) => void;
  customSubtitle?: string;
  onSubtitleChange?: (subtitle: string) => void;
  brandSlug?: string;
}

interface TaglineSettings {
  backgroundStyle: TaglineBackgroundStyle;
  gradientColors: { from: string; via: string; to: string };
  solidColor: string;
}

const DEFAULT_SETTINGS: TaglineSettings = {
  backgroundStyle: 'floating',
  gradientColors: { from: '#6366f1', via: '#f59e0b', to: '#6366f1' },
  solidColor: '#6366f1',
};

// Load Google Font dynamically
const loadGoogleFont = (fontFamily: string) => {
  const fontId = `google-font-${fontFamily.replace(/\s+/g, '-').toLowerCase()}`;
  if (document.getElementById(fontId)) return;
  
  const link = document.createElement('link');
  link.id = fontId;
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontFamily)}:wght@100;200;300;400;500;600;700;800;900&display=swap`;
  document.head.appendChild(link);
};

export const TaglineSection = ({ tagline, onTaglineChange, customSubtitle, onSubtitleChange, brandSlug }: TaglineSectionProps) => {
  const isTransPerfect = brandSlug?.toLowerCase() === 'transperfect';

  const [isEditing, setIsEditing] = useState(false);
  const [newVariation, setNewVariation] = useState('');
  const [settings, setSettings] = useState<TaglineSettings>(() => {
    // Try to load from tagline if stored
    return (tagline as any)._settings || DEFAULT_SETTINGS;
  });

  // Font settings for primary tagline
  const fontSettings: FontSettings = tagline.fontSettings || DEFAULT_FONT_SETTINGS;

  // Load the font on mount
  useEffect(() => {
    if (fontSettings.fontFamily) {
      loadGoogleFont(fontSettings.fontFamily);
    }
  }, [fontSettings.fontFamily]);

  // Check if editing is allowed
  const canEdit = !!onTaglineChange;

  // Visibility flags (default to true)
  const showSecondary = tagline.showSecondary !== false;
  const showVariations = tagline.showVariations !== false;

  const toggleSecondary = () => {
    onTaglineChange?.({ ...tagline, showSecondary: !showSecondary });
  };

  const toggleVariations = () => {
    onTaglineChange?.({ ...tagline, showVariations: !showVariations });
  };

  const updateSettings = (newSettings: Partial<TaglineSettings>) => {
    if (!onTaglineChange) return;
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    // Store settings in tagline object for persistence
    onTaglineChange({ ...tagline, _settings: updated } as any);
  };

  const updateFontSettings = (newFontSettings: FontSettings) => {
    if (!onTaglineChange) return;
    onTaglineChange({ ...tagline, fontSettings: newFontSettings });
  };

  // Normalize variations to V2 format for internal use
  const normalizedVariations: TaglineVariation[] = useMemo(() => {
    // Prefer variationsV2 if available
    if (tagline.variationsV2 && tagline.variationsV2.length > 0) {
      return tagline.variationsV2;
    }
    // Migrate legacy variations array
    if (tagline.variations && tagline.variations.length > 0) {
      return tagline.variations.map((text, index) => ({
        text,
        style: (['gradient', 'accent-bar', 'floating-card', 'glass', 'outlined'] as const)[index % 5],
      }));
    }
    return [];
  }, [tagline.variationsV2, tagline.variations]);

  const styleLabels: Record<NonNullable<VariationStyle>, { label: string; icon: string }> = {
    'gradient': { label: 'Gradient', icon: '🎨' },
    'accent-bar': { label: 'Accent Bar', icon: '▌' },
    'floating-card': { label: 'Card', icon: '📄' },
    'glass': { label: 'Glass', icon: '🔮' },
    'outlined': { label: 'Outlined', icon: '○' },
  };

  const addVariation = () => {
    if (!onTaglineChange) return;
    if (newVariation.trim()) {
      const alreadyExists = normalizedVariations.some(v => v.text === newVariation.trim());
      if (!alreadyExists) {
        const newVar: TaglineVariation = {
          text: newVariation.trim(),
          style: 'gradient',
        };
        onTaglineChange({ 
          ...tagline, 
          variationsV2: [...normalizedVariations, newVar],
          variations: [...(tagline.variations || []), newVariation.trim()],
        });
        setNewVariation('');
      }
    }
  };

  const removeVariation = (text: string) => {
    if (!onTaglineChange) return;
    onTaglineChange({ 
      ...tagline, 
      variationsV2: normalizedVariations.filter(v => v.text !== text),
      variations: tagline.variations?.filter(v => v !== text) || [],
    });
  };

  const updateVariationStyle = (text: string, style: NonNullable<VariationStyle>) => {
    if (!onTaglineChange) return;
    const updated = normalizedVariations.map(v => 
      v.text === text ? { ...v, style } : v
    );
    onTaglineChange({ ...tagline, variationsV2: updated });
  };

  const updateVariationContext = (text: string, context: string) => {
    if (!onTaglineChange) return;
    const updated = normalizedVariations.map(v => 
      v.text === text ? { ...v, context: context || undefined } : v
    );
    onTaglineChange({ ...tagline, variationsV2: updated });
  };

  const toggleVariationFeatured = (text: string) => {
    if (!onTaglineChange) return;
    const updated = normalizedVariations.map(v => 
      v.text === text ? { ...v, isFeatured: !v.isFeatured } : { ...v, isFeatured: false }
    );
    onTaglineChange({ ...tagline, variationsV2: updated });
  };

  const getBackgroundStyles = () => {
    switch (settings.backgroundStyle) {
      case 'floating':
        return {
          container: 'bg-transparent',
          inner: '',
          showEffects: true,
          textColor: 'text-foreground',
        };
      case 'gradient':
        return {
          container: 'rounded-2xl overflow-hidden',
          inner: `bg-gradient-to-br bg-[length:200%_200%] animate-[gradient-shift_8s_ease_infinite]`,
          customGradient: `linear-gradient(135deg, ${settings.gradientColors.from}, ${settings.gradientColors.via}, ${settings.gradientColors.to})`,
          showEffects: true,
          textColor: 'text-white',
        };
      case 'solid':
        return {
          container: 'rounded-2xl overflow-hidden',
          inner: '',
          customBg: settings.solidColor,
          showEffects: false,
          textColor: 'text-white',
        };
      case 'glass':
        return {
          container: 'rounded-2xl overflow-hidden',
          inner: 'bg-background/50 backdrop-blur-xl border border-border/50',
          showEffects: true,
          textColor: 'text-foreground',
        };
      default:
        return {
          container: '',
          inner: '',
          showEffects: false,
          textColor: 'text-foreground',
        };
    }
  };

  const bgStyles = getBackgroundStyles();

  return (
    <section className="space-y-4 sm:space-y-6">
      {isTransPerfect && <TransPerfectVoicePanel />}
      {/* Options bar - only show when editing is allowed */}
      {canEdit && (
      <div className="flex items-center justify-end gap-2">
        {isEditing ? (
          <>
            {/* Animation Settings Button */}
            <TaglineAnimationSettings
              animation={tagline.taglineAnimation || 'fade-slide'}
              hoverEffect={tagline.taglineHoverEffect || 'none'}
              environment={tagline.taglineEnvironment || 'none'}
              onAnimationChange={(animation) => onTaglineChange?.({ ...tagline, taglineAnimation: animation })}
              onHoverEffectChange={(effect) => onTaglineChange?.({ ...tagline, taglineHoverEffect: effect })}
              onEnvironmentChange={(env) => onTaglineChange?.({ ...tagline, taglineEnvironment: env })}
              previewText={tagline.primary || 'Your tagline here'}
            />
            
            {/* Font Settings Button */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Type className="h-4 w-4" />
                  Font
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[420px] max-h-[85vh] overflow-y-auto" align="end">
                <Tabs defaultValue="presets" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-4">
                    <TabsTrigger value="presets">Quick Presets</TabsTrigger>
                    <TabsTrigger value="custom">Custom Font</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="presets" className="space-y-4">
                    <div>
                      <h4 className="font-medium text-sm mb-3">Popular Font Pairings</h4>
                      <p className="text-xs text-muted-foreground mb-3">
                        Select a curated pairing to quickly style your tagline
                      </p>
                      <TypographyPairingPreview
                        onSelect={(pairing) => {
                          updateFontSettings({
                            ...fontSettings,
                            fontFamily: pairing.heading,
                          });
                        }}
                      />
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="custom" className="space-y-4">
                    <h4 className="font-medium text-sm">Primary Tagline Typography</h4>
                    <GoogleFontPicker
                      value={fontSettings}
                      onChange={updateFontSettings}
                      previewText={tagline.primary || 'Your tagline here'}
                    />
                  </TabsContent>
                </Tabs>
              </PopoverContent>
            </Popover>
            
            {/* Style Button */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Palette className="h-4 w-4" />
                  Style
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80" align="end">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Background Style</label>
                    <ToggleGroup 
                      type="single" 
                      value={settings.backgroundStyle}
                      onValueChange={(value) => value && updateSettings({ backgroundStyle: value as TaglineBackgroundStyle })}
                      className="flex flex-wrap gap-1"
                    >
                      <ToggleGroupItem value="floating" size="sm">Floating</ToggleGroupItem>
                      <ToggleGroupItem value="gradient" size="sm">Gradient</ToggleGroupItem>
                      <ToggleGroupItem value="solid" size="sm">Solid</ToggleGroupItem>
                      <ToggleGroupItem value="glass" size="sm">Glass</ToggleGroupItem>
                    </ToggleGroup>
                  </div>

                  {settings.backgroundStyle === 'gradient' && (
                    <div className="space-y-3">
                      <label className="text-sm font-medium">Gradient Colors</label>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="text-xs text-muted-foreground">From</label>
                          <Input
                            type="color"
                            value={settings.gradientColors.from}
                            onChange={(e) => updateSettings({ 
                              gradientColors: { ...settings.gradientColors, from: e.target.value }
                            })}
                            className="h-10 p-1 cursor-pointer"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground">Via</label>
                          <Input
                            type="color"
                            value={settings.gradientColors.via}
                            onChange={(e) => updateSettings({ 
                              gradientColors: { ...settings.gradientColors, via: e.target.value }
                            })}
                            className="h-10 p-1 cursor-pointer"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground">To</label>
                          <Input
                            type="color"
                            value={settings.gradientColors.to}
                            onChange={(e) => updateSettings({ 
                              gradientColors: { ...settings.gradientColors, to: e.target.value }
                            })}
                            className="h-10 p-1 cursor-pointer"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {settings.backgroundStyle === 'solid' && (
                    <div>
                      <label className="text-sm font-medium mb-2 block">Background Color</label>
                      <div className="flex gap-2">
                        <Input
                          type="color"
                          value={settings.solidColor}
                          onChange={(e) => updateSettings({ solidColor: e.target.value })}
                          className="h-10 w-16 p-1 cursor-pointer"
                        />
                        <Input
                          value={settings.solidColor}
                          onChange={(e) => updateSettings({ solidColor: e.target.value })}
                          placeholder="#6366f1"
                          className="flex-1"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </PopoverContent>
            </Popover>

            {/* Visibility toggles */}
            <div className="flex items-center gap-1 border-l border-border pl-2 ml-1">
              <Button
                variant={showSecondary ? "outline" : "ghost"}
                size="sm"
                className={cn("gap-1.5 text-xs", !showSecondary && "text-muted-foreground/50")}
                onClick={toggleSecondary}
                title={showSecondary ? "Hide secondary tagline" : "Show secondary tagline"}
              >
                {showSecondary ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                <span className="hidden sm:inline">Secondary</span>
              </Button>
              <Button
                variant={showVariations ? "outline" : "ghost"}
                size="sm"
                className={cn("gap-1.5 text-xs", !showVariations && "text-muted-foreground/50")}
                onClick={toggleVariations}
                title={showVariations ? "Hide variations" : "Show variations"}
              >
                {showVariations ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                <span className="hidden sm:inline">Variations</span>
              </Button>
            </div>
            
            {/* Done button */}
            <Button variant="default" size="sm" className="gap-2" onClick={() => setIsEditing(false)}>
              <Check className="h-4 w-4" />
              Done
            </Button>
          </>
        ) : (
          <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground" onClick={() => setIsEditing(true)}>
            <Pencil className="h-4 w-4" />
            Edit
          </Button>
        )}
      </div>
      )}
      <div className="grid gap-6">
        {/* Primary Tagline - Floating/Customizable Design */}
        <div className={`relative ${bgStyles.container}`}>
          {/* Section-level environment effect */}
          <SectionEnvironmentOverlay 
            effect={tagline.taglineEnvironment || 'none'} 
            className="z-[5]"
          />
          {/* Background layer for gradient/solid */}
          {settings.backgroundStyle === 'gradient' && (
            <>
              <div 
                className="absolute inset-0" 
                style={{ background: bgStyles.customGradient, backgroundSize: '200% 200%', animation: 'gradient-shift 8s ease infinite' }}
              />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.15)_0%,transparent_50%)]" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(255,255,255,0.1)_0%,transparent_40%)]" />
            </>
          )}
          {settings.backgroundStyle === 'solid' && (
            <div className="absolute inset-0" style={{ backgroundColor: bgStyles.customBg }} />
          )}
          {settings.backgroundStyle === 'glass' && (
            <div className={`absolute inset-0 ${bgStyles.inner}`} />
          )}
          
          {/* Floating sparkle effects */}
          {bgStyles.showEffects && settings.backgroundStyle !== 'floating' && (
            <>
              <div className="absolute top-4 left-8 animate-pulse">
                <Sparkles className={`h-5 w-5 ${settings.backgroundStyle === 'glass' ? 'text-primary/40' : 'text-white/40'}`} />
              </div>
              <div className="absolute bottom-6 right-12 animate-pulse delay-300">
                <Sparkles className={`h-4 w-4 ${settings.backgroundStyle === 'glass' ? 'text-primary/30' : 'text-white/30'}`} />
              </div>
              <div className="absolute top-1/2 right-8 animate-pulse delay-700">
                <Sparkles className={`h-3 w-3 ${settings.backgroundStyle === 'glass' ? 'text-primary/25' : 'text-white/25'}`} />
              </div>
            </>
          )}

          {/* Floating style decorative elements */}
          {settings.backgroundStyle === 'floating' && (
            <>
              <div className="absolute -left-4 top-1/2 -translate-y-1/2 w-1 h-16 bg-gradient-to-b from-transparent via-primary/50 to-transparent rounded-full" />
              <div className="absolute -right-4 top-1/2 -translate-y-1/2 w-1 h-16 bg-gradient-to-b from-transparent via-primary/50 to-transparent rounded-full" />
              <div className="absolute top-0 left-1/2 -translate-x-1/2 h-px w-1/3 bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 h-px w-1/3 bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
            </>
          )}
          
          {/* Content */}
          <div className={`relative z-10 overflow-hidden text-center ${settings.backgroundStyle === 'floating' ? 'py-8 sm:py-12 px-4' : 'p-4 sm:p-8 md:p-12'}`}>
            {settings.backgroundStyle !== 'floating' && (
              <div className="flex items-center gap-2 mb-4">
                <div className={`h-px flex-1 bg-gradient-to-r from-transparent ${settings.backgroundStyle === 'glass' ? 'via-foreground/20' : 'via-white/30'} to-transparent`} />
                <span className={`text-xs font-medium ${settings.backgroundStyle === 'glass' ? 'text-muted-foreground' : 'text-white/70'} uppercase tracking-[0.3em]`}>Primary Tagline</span>
                <div className={`h-px flex-1 bg-gradient-to-r from-transparent ${settings.backgroundStyle === 'glass' ? 'via-foreground/20' : 'via-white/30'} to-transparent`} />
              </div>
            )}
            
            {isEditing ? (
              <Input
                value={tagline.primary}
                onChange={(e) => onTaglineChange?.({ ...tagline, primary: e.target.value })}
                placeholder="Your main corporate tagline"
                className={`text-xl md:text-2xl text-center ${
                  settings.backgroundStyle === 'floating' 
                    ? 'bg-muted/50 border-border' 
                    : settings.backgroundStyle === 'glass'
                      ? 'bg-background/30 border-border/50 backdrop-blur-sm'
                      : 'bg-white/10 border-white/20 text-white placeholder:text-white/50 backdrop-blur-sm'
                }`}
              />
            ) : (
              <div className="flex flex-col items-center w-full">
                {settings.backgroundStyle !== 'floating' && (
                  <Quote className={`h-10 w-10 ${settings.backgroundStyle === 'glass' ? 'text-primary/40' : 'text-white/40'} mb-4 rotate-180`} />
                )}
                <AnimatedTagline
                  text={tagline.primary || 'Add your primary tagline'}
                  animation={tagline.taglineAnimation || 'fade-slide'}
                  hoverEffect={tagline.taglineHoverEffect || 'none'}
                  environment="none"
                  className={`${bgStyles.textColor} ${settings.backgroundStyle !== 'floating' ? 'drop-shadow-lg' : ''} w-full`}
                  style={{
                    fontFamily: `"${fontSettings.fontFamily}", serif`,
                    fontWeight: fontSettings.fontWeight,
                    fontSize: `clamp(1.25rem, 4vw, ${fontSettings.fontSize}px)`,
                    letterSpacing: `${fontSettings.letterSpacing}px`,
                    lineHeight: fontSettings.lineHeight,
                    textTransform: fontSettings.textTransform,
                    textAlign: 'center',
                    fontStyle: fontSettings.fontStyle,
                    overflowWrap: 'break-word',
                    wordBreak: 'break-word',
                    whiteSpace: 'pre-line',
                  }}
                />
                {settings.backgroundStyle !== 'floating' && (
                  <Quote className={`h-10 w-10 ${settings.backgroundStyle === 'glass' ? 'text-primary/40' : 'text-white/40'} mt-4`} />
                )}
              </div>
            )}
          </div>
          
          {/* Bottom glow line for gradient/solid */}
          {(settings.backgroundStyle === 'gradient' || settings.backgroundStyle === 'solid') && (
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/2 h-1 bg-gradient-to-r from-transparent via-white/50 to-transparent blur-sm" />
          )}
        </div>

        {/* Secondary Tagline */}
        {(showSecondary || isEditing) && (
        <div className={cn("bg-card rounded-xl p-6 border border-border hover:border-primary/30 transition-colors", !showSecondary && "opacity-40 border-dashed")}>
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-3">
            Secondary Tagline
            {!showSecondary && <span className="ml-2 text-xs font-normal italic">(hidden from viewers)</span>}
          </h3>
          {isEditing ? (
            <Input
              value={tagline.secondary || ''}
              onChange={(e) => onTaglineChange?.({ ...tagline, secondary: e.target.value })}
              placeholder="An alternative or supporting tagline"
            />
          ) : (
            <p className="text-lg sm:text-xl font-medium text-foreground break-words" style={{ overflowWrap: 'break-word' }}>
              {tagline.secondary || 'No secondary tagline set'}
            </p>
          )}
        </div>
        )}

        {/* Tagline Variations - Editorial Masonry Display */}
        {(showVariations || isEditing) && (
        <div className={cn("relative overflow-hidden rounded-2xl border border-primary/15 bg-gradient-to-br from-card via-card to-primary/5", !showVariations && "opacity-40 border-dashed")}>
          {/* Decorative background elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-primary/8 blur-3xl" />
            <div className="absolute -bottom-24 -left-24 w-64 h-64 rounded-full bg-accent/8 blur-3xl" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-gradient-to-br from-primary/5 to-accent/5 blur-3xl" />
            <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
          </div>
          
          <div className="relative z-10 p-6 md:p-8">
            {/* Header with decorative line */}
            <div className="flex items-center gap-4 mb-6">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/20">
                  <Quote className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">
                    Tagline Variations
                    {!showVariations && <span className="ml-2 text-xs font-normal italic text-muted-foreground">(hidden from viewers)</span>}
                  </h3>
                  <p className="text-xs text-muted-foreground">Campaign & context-specific messaging</p>
                </div>
              </div>
              <div className="flex-1 h-px bg-gradient-to-r from-border via-primary/20 to-transparent" />
              {normalizedVariations.length > 0 && (
                <Badge variant="outline" className="text-[10px] font-medium">
                  {normalizedVariations.length} variation{normalizedVariations.length !== 1 ? 's' : ''}
                </Badge>
              )}
            </div>
            
            {/* Variations display */}
            {normalizedVariations.length > 0 ? (
              <>
                {/* Featured variation - displayed prominently at top */}
                {normalizedVariations.some(v => v.isFeatured) && (
                  <div className="mb-6">
                    {normalizedVariations.filter(v => v.isFeatured).map((variation) => (
                      <div
                        key={`featured-${variation.text}`}
                        className="relative group rounded-2xl p-6 md:p-8 bg-gradient-to-br from-primary/12 via-primary/6 to-accent/12 border border-primary/35 shadow-[0_0_30px_-5px_hsl(var(--primary)/0.2)] animate-fade-in ring-1 ring-primary/10"
                      >
                        {/* Featured badge */}
                        <div className="absolute -top-3 left-6 flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-primary to-primary/80 text-primary-foreground text-[10px] font-semibold uppercase tracking-wider shadow-lg shadow-primary/30">
                          <Star className="h-3 w-3 fill-current" />
                          Featured
                        </div>
                        {/* Glow corners */}
                        <div className="absolute top-0 left-0 w-16 h-16 bg-gradient-to-br from-primary/20 to-transparent rounded-tl-2xl pointer-events-none" />
                        <div className="absolute bottom-0 right-0 w-16 h-16 bg-gradient-to-tl from-accent/20 to-transparent rounded-br-2xl pointer-events-none" />
                        
                        {variation.context && (
                          <div className="mb-3 mt-1">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-primary/10 text-primary border border-primary/20">
                              <Tag className="h-2.5 w-2.5" />
                              {variation.context}
                            </span>
                          </div>
                        )}
                        <p className="text-xl md:text-2xl font-semibold text-foreground italic leading-relaxed">
                          "{variation.text}"
                        </p>
                        {isEditing && (
                          <div className="flex items-center gap-2 mt-4 pt-3 border-t border-primary/10">
                            <Input
                              value={variation.context || ''}
                              onChange={(e) => updateVariationContext(variation.text, e.target.value)}
                              placeholder="Context (e.g., Social Media)"
                              className="h-7 text-xs max-w-[200px] bg-background/50"
                            />
                            <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 text-primary" onClick={() => toggleVariationFeatured(variation.text)}>
                              <Star className="h-3 w-3 fill-current" /> Unfeature
                            </Button>
                            <button onClick={() => removeVariation(variation.text)} className="p-1 rounded text-muted-foreground hover:text-destructive transition-colors ml-auto">
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Masonry 2-column grid for remaining variations */}
                {(() => {
                  const nonFeatured = normalizedVariations.filter(v => !v.isFeatured);
                  if (nonFeatured.length === 0) return null;
                  const col1 = nonFeatured.filter((_, i) => i % 2 === 0);
                  const col2 = nonFeatured.filter((_, i) => i % 2 === 1);

                  const renderCard = (variation: TaglineVariation, globalIndex: number) => {
                    const currentStyle = variation.style || 'gradient';
                    const styleClasses: Record<NonNullable<VariationStyle>, string> = {
                      'gradient': 'bg-gradient-to-br from-primary/15 via-accent/8 to-primary/10 border border-primary/30 hover:border-primary/50 hover:from-primary/20 hover:to-accent/15 hover:shadow-[0_4px_20px_-4px_hsl(var(--primary)/0.2)]',
                      'accent-bar': 'bg-gradient-to-r from-accent/10 to-muted/30 border-l-4 border-l-accent border border-accent/15 hover:border-accent/40 hover:from-accent/15 hover:shadow-[0_4px_20px_-4px_hsl(var(--accent)/0.15)]',
                      'floating-card': 'bg-card shadow-lg hover:shadow-xl border border-border/60 hover:border-primary/40 hover:-translate-y-1 ring-1 ring-primary/5 hover:ring-primary/15',
                      'glass': 'bg-gradient-to-br from-background/70 to-primary/5 backdrop-blur-md border border-primary/20 hover:border-primary/40 hover:from-background/80 hover:to-primary/10 shadow-[inset_0_1px_0_0_hsl(var(--primary)/0.1)]',
                      'outlined': 'border-2 border-primary/20 hover:border-primary/50 bg-gradient-to-br from-transparent to-primary/3 hover:to-primary/8 hover:shadow-[0_0_20px_-5px_hsl(var(--primary)/0.15)]',
                    };

                    return (
                      <div
                        key={variation.text}
                        className={cn(
                          'relative group rounded-xl p-5 transition-all duration-300',
                          styleClasses[currentStyle],
                        )}
                        style={{
                          animationDelay: `${globalIndex * 75}ms`,
                          animation: 'fade-in 0.4s ease-out both',
                        }}
                      >
                        {/* Index badge */}
                        <div className="absolute -top-2.5 -left-2.5 w-8 h-8 rounded-full bg-gradient-to-br from-primary via-primary/90 to-accent text-primary-foreground flex items-center justify-center text-[10px] font-bold shadow-[0_2px_8px_-2px_hsl(var(--primary)/0.5)] z-10 ring-2 ring-background">
                          {String(globalIndex + 1).padStart(2, '0')}
                        </div>

                        {/* Context chip */}
                        {variation.context && (
                          <div className="mb-2.5 pl-3">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-gradient-to-r from-primary/15 to-accent/15 text-primary border border-primary/25 shadow-sm">
                              <Tag className="h-2.5 w-2.5" />
                              {variation.context}
                            </span>
                          </div>
                        )}

                        <div className="pl-3">
                          <p className="text-base md:text-lg font-medium text-foreground/90 group-hover:text-foreground transition-colors italic leading-relaxed">
                            <span className="text-primary/40 font-serif text-xl mr-0.5">"</span>
                            {variation.text}
                            <span className="text-primary/40 font-serif text-xl ml-0.5">"</span>
                          </p>
                        </div>

                        {/* Edit controls */}
                        {isEditing && (
                          <div className="flex items-center gap-1.5 mt-3 pt-2.5 pl-3 border-t border-border/30">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-6 px-1.5 gap-1 text-[10px] text-muted-foreground hover:text-foreground">
                                  <span>{styleLabels[currentStyle].icon}</span>
                                  <span className="hidden sm:inline">{styleLabels[currentStyle].label}</span>
                                  <ChevronDown className="h-2.5 w-2.5" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="start" className="w-40">
                                {(Object.keys(styleLabels) as NonNullable<VariationStyle>[]).map((styleKey) => (
                                  <DropdownMenuItem
                                    key={styleKey}
                                    onClick={() => updateVariationStyle(variation.text, styleKey)}
                                    className={cn("gap-2 cursor-pointer", currentStyle === styleKey && "bg-accent")}
                                  >
                                    <span>{styleLabels[styleKey].icon}</span>
                                    <span>{styleLabels[styleKey].label}</span>
                                    {currentStyle === styleKey && <Check className="h-3 w-3 ml-auto" />}
                                  </DropdownMenuItem>
                                ))}
                              </DropdownMenuContent>
                            </DropdownMenu>
                            <Input
                              value={variation.context || ''}
                              onChange={(e) => updateVariationContext(variation.text, e.target.value)}
                              placeholder="Context..."
                              className="h-6 text-[10px] max-w-[120px] bg-background/50 px-2"
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              className={cn("h-6 w-6 p-0", variation.isFeatured && "text-primary")}
                              onClick={() => toggleVariationFeatured(variation.text)}
                              title="Set as featured"
                            >
                              <Star className={cn("h-3 w-3", variation.isFeatured && "fill-current")} />
                            </Button>
                            <button onClick={() => removeVariation(variation.text)} className="p-1 rounded text-muted-foreground hover:text-destructive transition-colors ml-auto">
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  };

                  return (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
                      <div className="flex flex-col gap-4 md:gap-5">
                        {col1.map((v) => renderCard(v, normalizedVariations.indexOf(v)))}
                      </div>
                      <div className="flex flex-col gap-4 md:gap-5 md:mt-6">
                        {col2.map((v) => renderCard(v, normalizedVariations.indexOf(v)))}
                      </div>
                    </div>
                  );
                })()}
              </>
            ) : (
              !isEditing && (
                <div className="flex flex-col items-center justify-center py-14 text-center">
                  {/* Overlapping quote marks illustration */}
                  <div className="relative mb-6">
                    <div className="absolute -left-3 -top-1 text-5xl font-serif text-primary/10 select-none animate-pulse">"</div>
                    <div className="absolute left-1 top-1 text-5xl font-serif text-primary/20 select-none">"</div>
                    <div className="relative p-4 rounded-2xl bg-gradient-to-br from-primary/5 to-accent/5 border border-primary/10">
                      <Quote className="h-8 w-8 text-primary/30" />
                    </div>
                  </div>
                  <p className="text-foreground font-semibold text-sm">No tagline variations yet</p>
                  <p className="text-xs text-muted-foreground mt-1.5 max-w-[260px] leading-relaxed">
                    Campaign-specific and contextual tagline alternatives will appear here
                  </p>
                </div>
              )
            )}
            
            {/* Add new variation input */}
            {isEditing && (
              <div className="mt-6 pt-6 border-t border-border/50">
                <div className="flex gap-3">
                  <div className="relative flex-1 max-w-lg">
                    <Quote className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                    <Input
                      value={newVariation}
                      onChange={(e) => setNewVariation(e.target.value)}
                      placeholder="Add a new tagline variation..."
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addVariation())}
                      className="pl-10 bg-background/50 border-border/50 focus:border-primary/50"
                    />
                  </div>
                  <Button 
                    variant="default" 
                    onClick={addVariation}
                    disabled={!newVariation.trim()}
                    className="gap-2 px-4"
                  >
                    <Plus className="h-4 w-4" />
                    Add
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
        )}
      </div>
    </section>
  );
};
