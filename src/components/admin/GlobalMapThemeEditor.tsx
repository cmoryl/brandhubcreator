/**
 * GlobalMapThemeEditor - Admin component for managing global map theme
 * Features: live map preview, preset thumbnails, marker/button/card style customization
 */

import React, { useState, useEffect, Suspense, lazy } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Palette, Map, Loader2, Check, RotateCcw, Sparkles, 
  Eye, Circle, Diamond, MapPin, Target, Square, RectangleHorizontal,
  MousePointer, Minus, CreditCard, Layers
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useGlobalMapTheme } from '@/hooks/usePlatformSettings';
import { 
  MapThemeConfig, 
  MapTileStyle, 
  MAP_TILE_CONFIGS, 
  MAP_THEME_PRESETS,
  DEFAULT_MAP_THEME,
  TILE_CONFIGS_BY_CATEGORY,
} from '@/types/mapTheme';
import { TilePreviewThumb } from './MapThemePreview';

// Lazy load the heavy map preview
const MapThemePreview = lazy(() => 
  import('./MapThemePreview').then(m => ({ default: m.MapThemePreview }))
);

const BUTTON_STYLES = [
  { value: 'rounded', label: 'Rounded', icon: RectangleHorizontal },
  { value: 'pill', label: 'Pill', icon: Minus },
  { value: 'square', label: 'Square', icon: Square },
  { value: 'ghost', label: 'Ghost', icon: MousePointer },
] as const;

const MARKER_STYLES = [
  { value: 'circle', label: 'Circle', icon: Circle },
  { value: 'pin', label: 'Pin', icon: MapPin },
  { value: 'dot', label: 'Dot', icon: Target },
  { value: 'ring', label: 'Ring', icon: Circle },
  { value: 'diamond', label: 'Diamond', icon: Diamond },
] as const;

const CARD_STYLES = [
  { value: 'default', label: 'Default' },
  { value: 'minimal', label: 'Minimal' },
  { value: 'glass', label: 'Glass' },
  { value: 'bordered', label: 'Bordered' },
] as const;

export function GlobalMapThemeEditor() {
  const { globalMapTheme, isLoading, updateGlobalMapTheme, isUpdating } = useGlobalMapTheme();
  const [localTheme, setLocalTheme] = useState<MapThemeConfig>(DEFAULT_MAP_THEME);
  const [hasChanges, setHasChanges] = useState(false);

  // Sync local state with fetched theme
  useEffect(() => {
    if (globalMapTheme) {
      setLocalTheme(globalMapTheme);
    }
  }, [globalMapTheme]);

  // Track changes
  useEffect(() => {
    if (globalMapTheme) {
      setHasChanges(JSON.stringify(localTheme) !== JSON.stringify(globalMapTheme));
    }
  }, [localTheme, globalMapTheme]);

  const handleTileStyleChange = (style: MapTileStyle) => {
    setLocalTheme(prev => ({ ...prev, tileStyle: style }));
  };

  const handleMarkerColorChange = (category: keyof MapThemeConfig['markerColors'], color: string) => {
    setLocalTheme(prev => ({
      ...prev,
      markerColors: { ...prev.markerColors, [category]: color },
    }));
  };

  const handleUIThemeChange = (key: keyof MapThemeConfig['uiTheme'], value: string | number | boolean) => {
    setLocalTheme(prev => ({
      ...prev,
      uiTheme: { ...prev.uiTheme, [key]: value },
    }));
  };

  const handleApplyPreset = (presetKey: string) => {
    const preset = MAP_THEME_PRESETS[presetKey];
    if (preset) {
      setLocalTheme(preset);
    }
  };

  const handleSave = () => {
    updateGlobalMapTheme(localTheme);
  };

  const handleReset = () => {
    if (globalMapTheme) {
      setLocalTheme(globalMapTheme);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Live Preview + Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Map className="h-5 w-5" />
                Global Map Theme
              </CardTitle>
              <CardDescription>
                Default theme for all location maps using shared company locations
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {hasChanges && (
                <Badge variant="outline" className="text-amber-500 border-amber-500">
                  Unsaved Changes
                </Badge>
              )}
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleReset}
                disabled={!hasChanges || isUpdating}
              >
                <RotateCcw className="h-4 w-4 mr-1" />
                Reset
              </Button>
              <Button 
                size="sm" 
                onClick={handleSave}
                disabled={!hasChanges || isUpdating}
              >
                {isUpdating ? (
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  <Check className="h-4 w-4 mr-1" />
                )}
                Save Changes
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Live Map Preview */}
          <div>
            <Label className="text-sm font-medium flex items-center gap-2 mb-3">
              <Eye className="h-4 w-4 text-primary" />
              Live Preview
            </Label>
            <Suspense fallback={
              <div className="h-[280px] rounded-xl border border-border flex items-center justify-center bg-muted/30">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            }>
              <MapThemePreview theme={localTheme} height="300px" />
            </Suspense>
          </div>

          <Tabs defaultValue="presets" className="space-y-4">
            <TabsList className="flex-wrap">
              <TabsTrigger value="presets">
                <Sparkles className="h-4 w-4 mr-1" />
                Presets
              </TabsTrigger>
              <TabsTrigger value="tiles">
                <Map className="h-4 w-4 mr-1" />
                Map Tiles
              </TabsTrigger>
              <TabsTrigger value="markers">
                <MapPin className="h-4 w-4 mr-1" />
                Markers
              </TabsTrigger>
              <TabsTrigger value="buttons">
                <MousePointer className="h-4 w-4 mr-1" />
                Buttons & Cards
              </TabsTrigger>
              <TabsTrigger value="ui">
                <Palette className="h-4 w-4 mr-1" />
                UI Theme
              </TabsTrigger>
            </TabsList>

            {/* Presets Tab */}
            <TabsContent value="presets" className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {Object.entries(MAP_THEME_PRESETS).map(([key, preset]) => {
                  const isActive = JSON.stringify(localTheme) === JSON.stringify(preset);
                  return (
                    <button
                      key={key}
                      onClick={() => handleApplyPreset(key)}
                      className={cn(
                        "p-3 rounded-lg border-2 transition-all text-left group",
                        "hover:border-primary/50 hover:shadow-md",
                        isActive ? "border-primary bg-primary/5 ring-1 ring-primary/20" : "border-border"
                      )}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg">{MAP_TILE_CONFIGS[preset.tileStyle].preview}</span>
                        <span className="font-medium capitalize text-sm">{key}</span>
                        {isActive && <Check className="h-3.5 w-3.5 text-primary ml-auto" />}
                      </div>
                      <TilePreviewThumb tileStyle={preset.tileStyle} size={100} />
                      <div className="flex gap-1 mt-2">
                        {Object.values(preset.markerColors).map((color, i) => (
                          <div
                            key={i}
                            className="w-4 h-4 rounded-full border border-border/50"
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    </button>
                  );
                })}
              </div>
            </TabsContent>

            {/* Tiles Tab */}
            <TabsContent value="tiles" className="space-y-6">
              {(['basic', 'professional', 'artistic'] as const).map(category => (
                <div key={category} className="space-y-3">
                  <Label className="text-sm font-medium capitalize">{category} Styles</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {TILE_CONFIGS_BY_CATEGORY[category].map((config) => {
                      const isActive = localTheme.tileStyle === config.id;
                      return (
                        <button
                          key={config.id}
                          onClick={() => handleTileStyleChange(config.id)}
                          className={cn(
                            "p-3 rounded-lg border-2 transition-all text-left",
                            "hover:border-primary/50 hover:shadow-md",
                            isActive ? "border-primary bg-primary/5 ring-1 ring-primary/20" : "border-border"
                          )}
                        >
                          <TilePreviewThumb tileStyle={config.id} size={120} />
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-lg">{config.preview}</span>
                            <span className="font-medium text-sm">{config.label}</span>
                            {isActive && <Check className="h-3.5 w-3.5 text-primary ml-auto" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </TabsContent>

            {/* Markers Tab */}
            <TabsContent value="markers" className="space-y-6">
              {/* Marker Style */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Marker Style</Label>
                <div className="flex flex-wrap gap-2">
                  {MARKER_STYLES.map(({ value, label, icon: Icon }) => (
                    <button
                      key={value}
                      onClick={() => handleUIThemeChange('markerStyle', value)}
                      className={cn(
                        "flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 transition-all text-sm",
                        "hover:border-primary/50",
                        (localTheme.uiTheme.markerStyle || 'circle') === value
                          ? "border-primary bg-primary/5"
                          : "border-border"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Marker Size */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Marker Size</Label>
                  <span className="text-xs text-muted-foreground font-mono">{localTheme.uiTheme.markerSize || 20}px</span>
                </div>
                <Slider
                  value={[localTheme.uiTheme.markerSize || 20]}
                  onValueChange={([v]) => handleUIThemeChange('markerSize', v)}
                  min={10}
                  max={40}
                  step={2}
                  className="w-full"
                />
              </div>

              {/* Marker Pulse */}
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">Pulse Animation</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">Animated glow around markers</p>
                </div>
                <Switch
                  checked={localTheme.uiTheme.markerPulse !== false}
                  onCheckedChange={(v) => handleUIThemeChange('markerPulse', v)}
                />
              </div>

              {/* Marker Colors */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Marker Colors by Category</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(localTheme.markerColors).map(([category, color]) => (
                    <div key={category} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border/50">
                      <div
                        className="w-10 h-10 rounded-full border-2 border-background shadow-lg flex-shrink-0"
                        style={{ backgroundColor: color }}
                      />
                      <div className="flex-1">
                        <Label className="capitalize text-sm font-medium">{category}</Label>
                        <div className="flex items-center gap-2 mt-1">
                          <Input
                            type="color"
                            value={color}
                            onChange={(e) => handleMarkerColorChange(
                              category as keyof MapThemeConfig['markerColors'],
                              e.target.value
                            )}
                            className="w-10 h-8 p-0 border-0 cursor-pointer"
                          />
                          <Input
                            type="text"
                            value={color}
                            onChange={(e) => handleMarkerColorChange(
                              category as keyof MapThemeConfig['markerColors'],
                              e.target.value
                            )}
                            className="flex-1 h-8 text-xs font-mono"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* Buttons & Cards Tab */}
            <TabsContent value="buttons" className="space-y-6">
              {/* Button Style */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Button Style</Label>
                <div className="flex flex-wrap gap-2">
                  {BUTTON_STYLES.map(({ value, label, icon: Icon }) => (
                    <button
                      key={value}
                      onClick={() => handleUIThemeChange('buttonStyle', value)}
                      className={cn(
                        "flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 transition-all text-sm",
                        "hover:border-primary/50",
                        (localTheme.uiTheme.buttonStyle || 'rounded') === value
                          ? "border-primary bg-primary/5"
                          : "border-border"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {label}
                    </button>
                  ))}
                </div>
                {/* Button Preview */}
                <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/30 border border-border/50">
                  <span className="text-sm text-muted-foreground mr-2">Preview:</span>
                  {['Filter', 'All Regions', 'Offices'].map(text => (
                    <div
                      key={text}
                      className={cn(
                        "px-3 py-1.5 text-xs font-medium transition-all",
                        localTheme.uiTheme.buttonStyle === 'pill' && 'rounded-full',
                        localTheme.uiTheme.buttonStyle === 'square' && 'rounded-none',
                        localTheme.uiTheme.buttonStyle === 'ghost' && 'bg-transparent',
                        (!localTheme.uiTheme.buttonStyle || localTheme.uiTheme.buttonStyle === 'rounded') && 'rounded-md',
                      )}
                      style={{
                        backgroundColor: localTheme.uiTheme.buttonStyle === 'ghost' ? 'transparent' : (text === 'Filter' ? localTheme.uiTheme.accentColor : 'transparent'),
                        color: text === 'Filter' && localTheme.uiTheme.buttonStyle !== 'ghost' ? '#fff' : localTheme.uiTheme.accentColor,
                        border: `1px solid ${localTheme.uiTheme.accentColor}`,
                      }}
                    >
                      {text}
                    </div>
                  ))}
                </div>
              </div>

              {/* Button Size */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Button Size</Label>
                <div className="flex gap-2">
                  {(['sm', 'md', 'lg'] as const).map(size => (
                    <button
                      key={size}
                      onClick={() => handleUIThemeChange('buttonSize', size)}
                      className={cn(
                        "px-4 py-2 rounded-lg border-2 transition-all text-sm uppercase font-medium",
                        "hover:border-primary/50",
                        (localTheme.uiTheme.buttonSize || 'md') === size
                          ? "border-primary bg-primary/5"
                          : "border-border"
                      )}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              {/* Card Style */}
              <div className="space-y-3">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Location Card Style
                </Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {CARD_STYLES.map(({ value, label }) => {
                    const isActive = (localTheme.uiTheme.cardStyle || 'default') === value;
                    return (
                      <button
                        key={value}
                        onClick={() => handleUIThemeChange('cardStyle', value)}
                        className={cn(
                          "p-4 rounded-lg border-2 transition-all text-left",
                          "hover:border-primary/50",
                          isActive ? "border-primary bg-primary/5" : "border-border"
                        )}
                      >
                        {/* Mini card preview */}
                        <div className={cn(
                          "w-full h-16 rounded-md mb-2 flex items-center justify-center text-[10px]",
                          value === 'default' && "bg-muted border border-border shadow-sm",
                          value === 'minimal' && "bg-transparent border-b border-border",
                          value === 'glass' && "bg-background/60 backdrop-blur border border-border/30 shadow-lg",
                          value === 'bordered' && "bg-transparent border-2 border-foreground/20",
                        )}>
                          <div className="space-y-1 px-2">
                            <div className="h-1.5 w-12 bg-foreground/30 rounded" />
                            <div className="h-1 w-8 bg-foreground/15 rounded" />
                          </div>
                        </div>
                        <span className="text-sm font-medium">{label}</span>
                        {isActive && <Check className="h-3.5 w-3.5 text-primary inline ml-2" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </TabsContent>

            {/* UI Theme Tab */}
            <TabsContent value="ui" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Panel Background</Label>
                  <Input
                    value={localTheme.uiTheme.panelBackground}
                    onChange={(e) => handleUIThemeChange('panelBackground', e.target.value)}
                    placeholder="rgba(10, 22, 40, 0.9)"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Panel Text</Label>
                  <Input
                    value={localTheme.uiTheme.panelText}
                    onChange={(e) => handleUIThemeChange('panelText', e.target.value)}
                    placeholder="rgba(255, 255, 255, 0.7)"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Border Color</Label>
                  <Input
                    value={localTheme.uiTheme.borderColor}
                    onChange={(e) => handleUIThemeChange('borderColor', e.target.value)}
                    placeholder="rgba(255, 255, 255, 0.1)"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Accent Color</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="color"
                      value={localTheme.uiTheme.accentColor}
                      onChange={(e) => handleUIThemeChange('accentColor', e.target.value)}
                      className="w-10 h-9 p-0 border-0 cursor-pointer"
                    />
                    <Input
                      value={localTheme.uiTheme.accentColor}
                      onChange={(e) => handleUIThemeChange('accentColor', e.target.value)}
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>

              {/* Panel Preview */}
              <div 
                className="mt-4 p-4 rounded-lg border"
                style={{
                  background: localTheme.uiTheme.panelBackground,
                  borderColor: localTheme.uiTheme.borderColor,
                }}
              >
                <p className="text-sm font-medium" style={{ color: localTheme.uiTheme.panelText }}>
                  Panel Preview
                </p>
                <p className="text-xs mt-1" style={{ color: localTheme.uiTheme.accentColor }}>
                  Accent text color
                </p>
                <div className="flex gap-2 mt-3">
                  {Object.entries(localTheme.markerColors).map(([cat, color]) => (
                    <div key={cat} className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                      <span className="text-[10px] capitalize" style={{ color: localTheme.uiTheme.panelText }}>{cat}</span>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
