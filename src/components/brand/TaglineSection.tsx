import { useState } from 'react';
import { Plus, X, Quote, Sparkles, Palette } from 'lucide-react';
import { BrandTagline } from '@/types/brand';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SectionHeader } from './SectionHeader';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

type TaglineBackgroundStyle = 'floating' | 'gradient' | 'solid' | 'glass';

interface TaglineSectionProps {
  tagline: BrandTagline;
  onTaglineChange: (tagline: BrandTagline) => void;
  customSubtitle?: string;
  onSubtitleChange?: (subtitle: string) => void;
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

export const TaglineSection = ({ tagline, onTaglineChange, customSubtitle, onSubtitleChange }: TaglineSectionProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [newVariation, setNewVariation] = useState('');
  const [settings, setSettings] = useState<TaglineSettings>(() => {
    // Try to load from tagline if stored
    return (tagline as any)._settings || DEFAULT_SETTINGS;
  });

  const updateSettings = (newSettings: Partial<TaglineSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    // Store settings in tagline object for persistence
    onTaglineChange({ ...tagline, _settings: updated } as any);
  };

  const addVariation = () => {
    if (newVariation.trim() && !tagline.variations?.includes(newVariation.trim())) {
      onTaglineChange({ 
        ...tagline, 
        variations: [...(tagline.variations || []), newVariation.trim()] 
      });
      setNewVariation('');
    }
  };

  const removeVariation = (variation: string) => {
    onTaglineChange({ 
      ...tagline, 
      variations: tagline.variations?.filter(v => v !== variation) || [] 
    });
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
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <SectionHeader
          title="Corporate Tagline"
          defaultSubtitle="Your brand's memorable signature phrases"
          customSubtitle={customSubtitle}
          onSubtitleChange={onSubtitleChange}
          isEditing={isEditing}
          onEditToggle={() => setIsEditing(!isEditing)}
        />
        {isEditing && (
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
        )}
      </div>

      <div className="grid gap-6">
        {/* Primary Tagline - Floating/Customizable Design */}
        <div className={`relative ${bgStyles.container}`}>
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
          <div className={`relative z-10 ${settings.backgroundStyle === 'floating' ? 'py-12 px-4' : 'p-8 md:p-12'}`}>
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
                onChange={(e) => onTaglineChange({ ...tagline, primary: e.target.value })}
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
              <div className="flex flex-col items-center text-center">
                {settings.backgroundStyle !== 'floating' && (
                  <Quote className={`h-10 w-10 ${settings.backgroundStyle === 'glass' ? 'text-primary/40' : 'text-white/40'} mb-4 rotate-180`} />
                )}
                <p className={`text-2xl md:text-4xl lg:text-5xl font-serif font-bold ${bgStyles.textColor} tracking-tight leading-tight ${settings.backgroundStyle !== 'floating' ? 'drop-shadow-lg' : ''}`}>
                  {tagline.primary || 'Add your primary tagline'}
                </p>
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
        <div className="bg-card rounded-xl p-6 border border-border hover:border-primary/30 transition-colors">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-3">Secondary Tagline</h3>
          {isEditing ? (
            <Input
              value={tagline.secondary || ''}
              onChange={(e) => onTaglineChange({ ...tagline, secondary: e.target.value })}
              placeholder="An alternative or supporting tagline"
            />
          ) : (
            <p className="text-xl font-medium text-foreground">
              {tagline.secondary || 'No secondary tagline set'}
            </p>
          )}
        </div>

        {/* Tagline Variations */}
        <div className="bg-card rounded-xl p-6 border border-border">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-3">Tagline Variations</h3>
          <p className="text-sm text-muted-foreground mb-4">Campaign or context-specific tagline variations</p>
          <div className="flex flex-wrap gap-2 mb-4">
            {tagline.variations?.map((variation) => (
              <Badge key={variation} variant="secondary" className="text-sm py-2 px-4 bg-primary/10 hover:bg-primary/20 transition-colors">
                "{variation}"
                {isEditing && (
                  <button onClick={() => removeVariation(variation)} className="ml-2 hover:text-destructive">
                    <X className="h-3 w-3" />
                  </button>
                )}
              </Badge>
            ))}
            {(!tagline.variations || tagline.variations.length === 0) && !isEditing && (
              <span className="text-muted-foreground">No variations added yet</span>
            )}
          </div>
          {isEditing && (
            <div className="flex gap-2">
              <Input
                value={newVariation}
                onChange={(e) => setNewVariation(e.target.value)}
                placeholder="e.g., Campaign-specific tagline..."
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addVariation())}
                className="max-w-md"
              />
              <Button variant="outline" size="icon" onClick={addVariation}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
