/**
 * MapThemeEditor - UI for customizing map appearance
 * Supports tile styles, marker colors, and UI theme customization
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  MapThemeConfig, 
  MapTileStyle, 
  MAP_TILE_CONFIGS, 
  MAP_THEME_PRESETS,
  DEFAULT_MAP_THEME 
} from '@/types/mapTheme';
import { Palette, RotateCcw, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LocationCategory } from '@/types/brand';

interface MapThemeEditorProps {
  theme: MapThemeConfig;
  onChange: (theme: MapThemeConfig) => void;
  accentColor?: string;
}

const CATEGORY_LABELS: Record<LocationCategory, string> = {
  studio: 'Studios',
  office: 'Offices',
  headquarters: 'Headquarters',
  datacenter: 'Data Centers',
  partner: 'Partners',
};

export const MapThemeEditor: React.FC<MapThemeEditorProps> = ({
  theme,
  onChange,
  accentColor = '#00d4ff',
}) => {
  const handleTileChange = (tileStyle: MapTileStyle) => {
    onChange({ ...theme, tileStyle });
  };

  const handleMarkerColorChange = (category: LocationCategory, color: string) => {
    onChange({
      ...theme,
      markerColors: { ...theme.markerColors, [category]: color },
    });
  };

  const handlePresetSelect = (presetKey: string) => {
    const preset = MAP_THEME_PRESETS[presetKey];
    if (preset) {
      // Apply preset but keep accent color from brand
      onChange({
        ...preset,
        uiTheme: { ...preset.uiTheme, accentColor },
      });
    }
  };

  const handleReset = () => {
    onChange({ ...DEFAULT_MAP_THEME, uiTheme: { ...DEFAULT_MAP_THEME.uiTheme, accentColor } });
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Palette className="h-4 w-4" />
          Map Theme
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-sm">Map Theme</h4>
            <Button variant="ghost" size="sm" onClick={handleReset} className="h-7 px-2">
              <RotateCcw className="h-3 w-3 mr-1" />
              Reset
            </Button>
          </div>

          {/* Tile Style */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Map Style</Label>
            <div className="grid grid-cols-4 gap-1.5">
              {Object.values(MAP_TILE_CONFIGS).map((config) => (
                <button
                  key={config.id}
                  onClick={() => handleTileChange(config.id)}
                  className={cn(
                    "flex flex-col items-center gap-1 p-2 rounded-md border transition-all",
                    theme.tileStyle === config.id 
                      ? "border-primary bg-primary/10" 
                      : "border-border hover:border-primary/50"
                  )}
                >
                  <span className="text-lg">{config.preview}</span>
                  <span className="text-[10px]">{config.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Presets */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              Quick Presets
            </Label>
            <div className="flex flex-wrap gap-1.5">
              {Object.keys(MAP_THEME_PRESETS).map((key) => (
                <Button
                  key={key}
                  variant="outline"
                  size="sm"
                  onClick={() => handlePresetSelect(key)}
                  className="h-7 text-xs capitalize"
                >
                  {key}
                </Button>
              ))}
            </div>
          </div>

          {/* Marker Colors */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Marker Colors</Label>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(CATEGORY_LABELS) as LocationCategory[]).map((category) => (
                <div key={category} className="flex items-center gap-2">
                  <Input
                    type="color"
                    value={theme.markerColors[category]}
                    onChange={(e) => handleMarkerColorChange(category, e.target.value)}
                    className="w-8 h-8 p-0.5 cursor-pointer"
                  />
                  <span className="text-xs truncate">{CATEGORY_LABELS[category]}</span>
                </div>
              ))}
            </div>
          </div>

          {/* UI Accent (from brand) */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">UI Accent</Label>
            <div className="flex items-center gap-2">
              <div 
                className="w-8 h-8 rounded border"
                style={{ backgroundColor: accentColor }}
              />
              <span className="text-xs text-muted-foreground">
                Uses brand accent color
              </span>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default MapThemeEditor;
