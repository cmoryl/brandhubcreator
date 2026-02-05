/**
 * GlobalMapThemeEditor - Admin component for managing global map theme
 * This theme is inherited by all brand guides that use shared company locations
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Palette, Map, Loader2, Check, RotateCcw, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useGlobalMapTheme } from '@/hooks/usePlatformSettings';
import { 
  MapThemeConfig, 
  MapTileStyle, 
  MAP_TILE_CONFIGS, 
  MAP_THEME_PRESETS,
  DEFAULT_MAP_THEME,
} from '@/types/mapTheme';

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

  const handleUIThemeChange = (key: keyof MapThemeConfig['uiTheme'], value: string) => {
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
      <CardContent>
        <Tabs defaultValue="presets" className="space-y-4">
          <TabsList>
            <TabsTrigger value="presets">
              <Sparkles className="h-4 w-4 mr-1" />
              Presets
            </TabsTrigger>
            <TabsTrigger value="tiles">
              <Map className="h-4 w-4 mr-1" />
              Map Tiles
            </TabsTrigger>
            <TabsTrigger value="markers">
              <Palette className="h-4 w-4 mr-1" />
              Marker Colors
            </TabsTrigger>
            <TabsTrigger value="ui">UI Theme</TabsTrigger>
          </TabsList>

          {/* Presets Tab */}
          <TabsContent value="presets" className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {Object.entries(MAP_THEME_PRESETS).map(([key, preset]) => (
                <button
                  key={key}
                  onClick={() => handleApplyPreset(key)}
                  className={cn(
                    "p-4 rounded-lg border-2 transition-all text-left",
                    "hover:border-primary/50 hover:shadow-md",
                    JSON.stringify(localTheme) === JSON.stringify(preset)
                      ? "border-primary bg-primary/5"
                      : "border-border"
                  )}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">{MAP_TILE_CONFIGS[preset.tileStyle].preview}</span>
                    <span className="font-medium capitalize">{key}</span>
                  </div>
                  <div className="flex gap-1">
                    {Object.values(preset.markerColors).slice(0, 4).map((color, i) => (
                      <div
                        key={i}
                        className="w-4 h-4 rounded-full border border-white/20"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </button>
              ))}
            </div>
          </TabsContent>

          {/* Tiles Tab */}
          <TabsContent value="tiles" className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {Object.values(MAP_TILE_CONFIGS).map((config) => (
                <button
                  key={config.id}
                  onClick={() => handleTileStyleChange(config.id)}
                  className={cn(
                    "p-4 rounded-lg border-2 transition-all",
                    "hover:border-primary/50 hover:shadow-md",
                    localTheme.tileStyle === config.id
                      ? "border-primary bg-primary/5"
                      : "border-border"
                  )}
                >
                  <span className="text-2xl">{config.preview}</span>
                  <p className="mt-2 font-medium">{config.label}</p>
                </button>
              ))}
            </div>
          </TabsContent>

          {/* Markers Tab */}
          <TabsContent value="markers" className="space-y-4">
            <ScrollArea className="h-[300px]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pr-4">
                {Object.entries(localTheme.markerColors).map(([category, color]) => (
                  <div key={category} className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-full border-2 border-white/20 shadow-lg flex-shrink-0"
                      style={{ backgroundColor: color }}
                    />
                    <div className="flex-1">
                      <Label className="capitalize text-sm">{category}</Label>
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
            </ScrollArea>
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

            {/* Preview */}
            <div 
              className="mt-4 p-4 rounded-lg border"
              style={{
                background: localTheme.uiTheme.panelBackground,
                borderColor: localTheme.uiTheme.borderColor,
              }}
            >
              <p 
                className="text-sm font-medium"
                style={{ color: localTheme.uiTheme.panelText }}
              >
                Panel Preview
              </p>
              <p 
                className="text-xs mt-1"
                style={{ color: localTheme.uiTheme.accentColor }}
              >
                Accent text color
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
