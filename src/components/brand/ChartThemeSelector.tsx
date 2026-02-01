/**
 * ChartThemeSelector Component
 * 
 * Allows users to select and preview chart themes that apply
 * across all chart and infographic sections in a brand guide.
 */

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Palette, Check, Sparkles, BarChart3, PieChart, TrendingUp } from 'lucide-react';
import { ChartTheme, ChartThemeSettings, ChartThemePresetId, BrandColor } from '@/types/brand';
import { 
  resolveChartTheme, 
  getThemePresetOptions, 
  generateBrandTheme,
  CHART_THEME_PRESETS 
} from '@/lib/chartThemes';
import { cn } from '@/lib/utils';

interface ChartThemeSelectorProps {
  settings?: ChartThemeSettings;
  onSettingsChange: (settings: ChartThemeSettings) => void;
  brandColors?: BrandColor[];
  className?: string;
}

export function ChartThemeSelector({
  settings,
  onSettingsChange,
  brandColors = [],
  className,
}: ChartThemeSelectorProps) {
  const [isCustomizerOpen, setIsCustomizerOpen] = useState(false);
  const [customColors, setCustomColors] = useState<Partial<ChartTheme>>(
    settings?.customTheme || {}
  );

  const currentTheme = useMemo(
    () => resolveChartTheme(settings, brandColors),
    [settings, brandColors]
  );

  const presetOptions = useMemo(
    () => getThemePresetOptions(brandColors.length > 0),
    [brandColors.length]
  );

  const handlePresetSelect = (presetId: ChartThemePresetId) => {
    if (presetId === 'custom') {
      setIsCustomizerOpen(true);
      return;
    }
    onSettingsChange({ presetId });
  };

  const handleCustomThemeSave = () => {
    const baseTheme = CHART_THEME_PRESETS['corporate-blue'];
    const customTheme: ChartTheme = {
      ...baseTheme,
      id: 'custom',
      name: 'Custom Theme',
      ...customColors,
    };
    onSettingsChange({ presetId: 'custom', customTheme });
    setIsCustomizerOpen(false);
  };

  const getPreviewTheme = (presetId: ChartThemePresetId): ChartTheme => {
    if (presetId === 'brand-primary') {
      return generateBrandTheme(brandColors, 'primary');
    }
    if (presetId === 'brand-secondary') {
      return generateBrandTheme(brandColors, 'secondary');
    }
    if (presetId === 'custom' && settings?.customTheme) {
      return settings.customTheme;
    }
    return CHART_THEME_PRESETS[presetId as keyof typeof CHART_THEME_PRESETS] || CHART_THEME_PRESETS['corporate-blue'];
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Current Theme Preview */}
      <div className="bg-card border border-border rounded-xl p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Palette className="h-4 w-4 text-primary" />
            <span className="font-semibold text-sm">Chart Theme</span>
          </div>
          <Badge variant="secondary" className="text-xs">
            {currentTheme.name}
          </Badge>
        </div>

        {/* Mini Preview */}
        <div className="bg-muted/50 rounded-lg p-3 mb-4">
          <div className="flex items-end gap-1 h-12">
            {[0.3, 0.5, 0.7, 0.9, 1, 0.85, 0.6].map((height, i) => (
              <div
                key={i}
                className="flex-1 rounded-t transition-all"
                style={{
                  height: `${height * 100}%`,
                  background: `linear-gradient(to top, ${currentTheme.primary}, ${currentTheme.secondary || currentTheme.primary})`,
                  opacity: i === 4 ? 1 : 0.7,
                }}
              />
            ))}
          </div>
          <div className="flex items-center justify-between mt-2 text-[10px]" style={{ color: currentTheme.textColor }}>
            <span>Jan</span>
            <span>Feb</span>
            <span>Mar</span>
            <span>Apr</span>
            <span>May</span>
            <span>Jun</span>
            <span>Jul</span>
          </div>
        </div>

        {/* Theme Palette Preview */}
        <div className="flex gap-1 mb-4">
          {[currentTheme.primary, currentTheme.secondary, currentTheme.accent, currentTheme.gridColor, currentTheme.textColor].map((color, i) => (
            <div
              key={i}
              className="flex-1 h-6 rounded first:rounded-l-lg last:rounded-r-lg"
              style={{ backgroundColor: color }}
              title={['Primary', 'Secondary', 'Accent', 'Grid', 'Text'][i]}
            />
          ))}
        </div>

        {/* Quick Description */}
        <p className="text-xs text-muted-foreground">
          {currentTheme.description || 'Selected chart theme'}
        </p>
      </div>

      {/* Theme Preset Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {presetOptions.map((option) => {
          const theme = getPreviewTheme(option.id);
          const isSelected = settings?.presetId === option.id || 
            (!settings && option.id === 'brand-primary' && brandColors.length > 0) ||
            (!settings && option.id === 'corporate-blue' && brandColors.length === 0);

          return (
            <button
              key={option.id}
              onClick={() => handlePresetSelect(option.id)}
              className={cn(
                'relative group p-3 rounded-xl border-2 transition-all text-left',
                isSelected
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50 bg-card'
              )}
            >
              {isSelected && (
                <div className="absolute top-2 right-2">
                  <Check className="h-4 w-4 text-primary" />
                </div>
              )}

              {/* Mini Chart Preview */}
              <div className="flex items-end gap-0.5 h-8 mb-2">
                {[0.4, 0.6, 0.8, 1, 0.7].map((h, i) => (
                  <div
                    key={i}
                    className="flex-1 rounded-t"
                    style={{
                      height: `${h * 100}%`,
                      backgroundColor: theme.primary,
                      opacity: 0.6 + i * 0.1,
                    }}
                  />
                ))}
              </div>

              {/* Color Dots */}
              <div className="flex gap-1 mb-2">
                {[theme.primary, theme.secondary, theme.accent].map((c, i) => (
                  <div
                    key={i}
                    className="w-3 h-3 rounded-full border border-border/50"
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>

              <span className="text-xs font-medium block truncate">{option.name}</span>
              
              {option.id === 'brand-primary' || option.id === 'brand-secondary' ? (
                <Badge variant="outline" className="mt-1 text-[10px] px-1.5 py-0">
                  <Sparkles className="h-2.5 w-2.5 mr-0.5" />
                  Brand
                </Badge>
              ) : option.id === 'custom' ? (
                <Badge variant="outline" className="mt-1 text-[10px] px-1.5 py-0">
                  <Palette className="h-2.5 w-2.5 mr-0.5" />
                  Custom
                </Badge>
              ) : null}
            </button>
          );
        })}
      </div>

      {/* Custom Theme Editor Sheet */}
      <Sheet open={isCustomizerOpen} onOpenChange={setIsCustomizerOpen}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Custom Chart Theme
            </SheetTitle>
            <SheetDescription>
              Create a personalized color scheme for all charts
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-6">
            {/* Live Preview */}
            <div className="bg-muted/30 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Preview</span>
              </div>
              <div className="flex items-end gap-1 h-20 mb-2" style={{ backgroundColor: customColors.background || '#f8fafc' }}>
                {[0.2, 0.4, 0.6, 0.8, 1, 0.75, 0.5, 0.9].map((h, i) => (
                  <div
                    key={i}
                    className="flex-1 rounded-t transition-all"
                    style={{
                      height: `${h * 100}%`,
                      background: customColors.primary 
                        ? `linear-gradient(to top, ${customColors.primary}, ${customColors.secondary || customColors.primary})`
                        : 'hsl(var(--primary))',
                    }}
                  />
                ))}
              </div>
              <div 
                className="h-px w-full" 
                style={{ backgroundColor: customColors.gridColor || '#e2e8f0' }} 
              />
            </div>

            {/* Color Inputs */}
            <div className="grid grid-cols-2 gap-4">
              <ColorInput
                label="Primary Color"
                value={customColors.primary || '#2563eb'}
                onChange={(v) => setCustomColors({ ...customColors, primary: v })}
                brandColors={brandColors}
              />
              <ColorInput
                label="Secondary Color"
                value={customColors.secondary || '#3b82f6'}
                onChange={(v) => setCustomColors({ ...customColors, secondary: v })}
                brandColors={brandColors}
              />
              <ColorInput
                label="Accent Color"
                value={customColors.accent || '#1d4ed8'}
                onChange={(v) => setCustomColors({ ...customColors, accent: v })}
                brandColors={brandColors}
              />
              <ColorInput
                label="Grid Color"
                value={customColors.gridColor || '#e2e8f0'}
                onChange={(v) => setCustomColors({ ...customColors, gridColor: v })}
              />
              <ColorInput
                label="Text Color"
                value={customColors.textColor || '#475569'}
                onChange={(v) => setCustomColors({ ...customColors, textColor: v })}
              />
              <ColorInput
                label="Background"
                value={customColors.background || '#f8fafc'}
                onChange={(v) => setCustomColors({ ...customColors, background: v })}
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-border">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setIsCustomizerOpen(false)}
              >
                Cancel
              </Button>
              <Button className="flex-1" onClick={handleCustomThemeSave}>
                Apply Theme
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

// Helper component for color input with brand color suggestions
function ColorInput({
  label,
  value,
  onChange,
  brandColors = [],
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  brandColors?: BrandColor[];
}) {
  return (
    <div className="space-y-2">
      <Label className="text-xs">{label}</Label>
      <Popover>
        <PopoverTrigger asChild>
          <button className="w-full h-10 rounded-lg border border-border flex items-center gap-2 px-3 hover:border-primary/50 transition-colors">
            <div
              className="w-6 h-6 rounded-md border border-border"
              style={{ backgroundColor: value }}
            />
            <span className="text-xs font-mono text-muted-foreground truncate">
              {value}
            </span>
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-56 p-3" align="start">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Input
                type="color"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-10 h-10 p-1 cursor-pointer"
              />
              <Input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder="#2563eb"
                className="flex-1 font-mono text-sm"
              />
            </div>
            {brandColors.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-medium text-muted-foreground">
                  Brand Colors
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {brandColors.slice(0, 8).map((color, idx) => (
                    <button
                      key={idx}
                      className="w-7 h-7 rounded-md border-2 border-transparent hover:border-primary transition-colors"
                      style={{ backgroundColor: color.hex }}
                      onClick={() => onChange(color.hex)}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

export default ChartThemeSelector;
