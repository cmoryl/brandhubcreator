import { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { parseGradient, gradientToCSS, ColorStop, ParsedGradient, isValidHex } from '@/lib/gradientParser';

interface GradientEditorProps {
  css: string;
  onChange: (css: string) => void;
  name: string;
  onNameChange: (name: string) => void;
  onDone: () => void;
}

export const GradientEditor = ({ css, onChange, name, onNameChange, onDone }: GradientEditorProps) => {
  const [parsed, setParsed] = useState<ParsedGradient | null>(null);
  const [rawCss, setRawCss] = useState(css);
  const [isRawMode, setIsRawMode] = useState(false);

  // Parse CSS on mount and when css prop changes
  useEffect(() => {
    const result = parseGradient(css);
    setParsed(result);
    setRawCss(css);
    // If we can't parse it, switch to raw mode
    if (!result) {
      setIsRawMode(true);
    }
  }, [css]);

  // Update CSS when parsed changes
  const updateFromParsed = useCallback((newParsed: ParsedGradient) => {
    setParsed(newParsed);
    const newCss = gradientToCSS(newParsed);
    setRawCss(newCss);
    onChange(newCss);
  }, [onChange]);

  const handleAngleChange = (value: number[]) => {
    if (!parsed) return;
    updateFromParsed({ ...parsed, angle: value[0] });
  };

  const handleColorChange = (index: number, color: string) => {
    if (!parsed) return;
    const newStops = [...parsed.colorStops];
    newStops[index] = { ...newStops[index], color };
    updateFromParsed({ ...parsed, colorStops: newStops });
  };

  const handlePositionChange = (index: number, position: number) => {
    if (!parsed) return;
    const newStops = [...parsed.colorStops];
    newStops[index] = { ...newStops[index], position: Math.max(0, Math.min(100, position)) };
    // Sort by position
    newStops.sort((a, b) => a.position - b.position);
    updateFromParsed({ ...parsed, colorStops: newStops });
  };

  const addColorStop = () => {
    if (!parsed || parsed.colorStops.length >= 8) return;
    
    // Find a good position for the new stop
    const positions = parsed.colorStops.map(s => s.position);
    let newPosition = 50;
    
    // Find the largest gap
    let maxGap = 0;
    let gapStart = 0;
    for (let i = 0; i < positions.length - 1; i++) {
      const gap = positions[i + 1] - positions[i];
      if (gap > maxGap) {
        maxGap = gap;
        gapStart = positions[i];
      }
    }
    if (maxGap > 0) {
      newPosition = gapStart + maxGap / 2;
    }
    
    // Use middle color of adjacent stops or default
    const newStop: ColorStop = {
      color: '#888888',
      position: Math.round(newPosition)
    };
    
    const newStops = [...parsed.colorStops, newStop].sort((a, b) => a.position - b.position);
    updateFromParsed({ ...parsed, colorStops: newStops });
  };

  const removeColorStop = (index: number) => {
    if (!parsed || parsed.colorStops.length <= 2) return;
    const newStops = parsed.colorStops.filter((_, i) => i !== index);
    updateFromParsed({ ...parsed, colorStops: newStops });
  };

  const handleRawCssChange = (value: string) => {
    setRawCss(value);
    // Try to parse
    const result = parseGradient(value);
    if (result) {
      setParsed(result);
    }
    onChange(value);
  };

  const toggleMode = () => {
    setIsRawMode(!isRawMode);
  };

  return (
    <div className="space-y-4">
      {/* Name input */}
      <div className="space-y-1.5">
        <Label htmlFor="gradient-name" className="text-xs">Name</Label>
        <Input
          id="gradient-name"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="Gradient name"
          className="h-8"
        />
      </div>

      {/* Live Preview */}
      <div 
        className="h-20 rounded-lg border border-border"
        style={{ background: rawCss }}
      />

      {/* Toggle between visual and raw mode */}
      <div className="flex items-center justify-between">
        <Label className="text-xs text-muted-foreground">
          {isRawMode ? 'Raw CSS Mode' : 'Visual Editor'}
        </Label>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={toggleMode}
          className="text-xs h-7"
        >
          Switch to {isRawMode ? 'Visual' : 'Raw CSS'}
        </Button>
      </div>

      {isRawMode ? (
        /* Raw CSS Editor */
        <div className="space-y-1.5">
          <Label htmlFor="raw-css" className="text-xs">CSS Gradient</Label>
          <Input
            id="raw-css"
            value={rawCss}
            onChange={(e) => handleRawCssChange(e.target.value)}
            placeholder="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
            className="h-8 font-mono text-xs"
          />
        </div>
      ) : parsed ? (
        /* Visual Editor */
        <div className="space-y-4">
          {/* Angle Control */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs">Angle</Label>
              <span className="text-xs text-muted-foreground font-mono">{parsed.angle}°</span>
            </div>
            <Slider
              value={[parsed.angle]}
              onValueChange={handleAngleChange}
              min={0}
              max={360}
              step={1}
              className="w-full"
            />
          </div>

          {/* Color Stops */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs">Color Stops</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={addColorStop}
                disabled={parsed.colorStops.length >= 8}
                className="h-6 px-2 text-xs gap-1"
              >
                <Plus className="h-3 w-3" />
                Add
              </Button>
            </div>
            
            <div className="space-y-2">
              {parsed.colorStops.map((stop, index) => (
                <div key={index} className="flex items-center gap-2 group">
                  <GripVertical className="h-3 w-3 text-muted-foreground/50" />
                  
                  {/* Color picker */}
                  <div className="relative">
                    <input
                      type="color"
                      value={isValidHex(stop.color) ? stop.color : '#888888'}
                      onChange={(e) => handleColorChange(index, e.target.value)}
                      className="w-8 h-8 rounded border border-border cursor-pointer"
                    />
                  </div>
                  
                  {/* Hex input */}
                  <Input
                    value={stop.color}
                    onChange={(e) => handleColorChange(index, e.target.value)}
                    placeholder="#000000"
                    className="h-8 w-24 font-mono text-xs"
                  />
                  
                  {/* Position slider */}
                  <div className="flex-1 flex items-center gap-2">
                    <Slider
                      value={[stop.position]}
                      onValueChange={(v) => handlePositionChange(index, v[0])}
                      min={0}
                      max={100}
                      step={1}
                      className="flex-1"
                    />
                    <span className="text-xs text-muted-foreground w-8 text-right font-mono">
                      {stop.position}%
                    </span>
                  </div>
                  
                  {/* Delete button */}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeColorStop(index)}
                    disabled={parsed.colorStops.length <= 2}
                    className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Gradient Bar Preview with stops */}
          <div className="relative h-6 rounded border border-border overflow-hidden">
            <div 
              className="absolute inset-0"
              style={{ background: `linear-gradient(90deg, ${parsed.colorStops.map(s => `${s.color} ${s.position}%`).join(', ')})` }}
            />
            {parsed.colorStops.map((stop, index) => (
              <div
                key={index}
                className="absolute top-0 w-0.5 h-full bg-background/80"
                style={{ left: `${stop.position}%` }}
              />
            ))}
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          Could not parse gradient. Use raw CSS mode.
        </p>
      )}

      <Button size="sm" variant="secondary" onClick={onDone} className="w-full">
        Done
      </Button>
    </div>
  );
};
