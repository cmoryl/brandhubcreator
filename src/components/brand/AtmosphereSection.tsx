import { useState } from 'react';
import { Pencil, Check, Layers } from 'lucide-react';
import { BrandAtmosphere } from '@/types/brand';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface AtmosphereSectionProps {
  atmosphere: BrandAtmosphere;
  onAtmosphereChange: (atmosphere: BrandAtmosphere) => void;
}

const styleOptions = [
  { value: 'gradient', label: 'Gradient Flow' },
  { value: 'particles', label: 'Particle Field' },
  { value: 'waves', label: 'Wave Motion' },
  { value: 'geometric', label: 'Geometric Shapes' },
  { value: 'noise', label: 'Perlin Noise' },
  { value: 'minimal', label: 'Minimal' },
];

export const AtmosphereSection = ({ atmosphere, onAtmosphereChange }: AtmosphereSectionProps) => {
  const [isEditing, setIsEditing] = useState(false);

  const getPreviewStyle = () => {
    const base = {
      opacity: atmosphere.opacity,
      filter: `blur(${atmosphere.blur}px)`,
    };

    switch (atmosphere.style) {
      case 'gradient':
        return {
          ...base,
          background: 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--accent)) 50%, hsl(var(--primary)) 100%)',
          backgroundSize: '400% 400%',
          animation: atmosphere.animate ? 'gradientFlow 15s ease infinite' : 'none',
        };
      case 'particles':
        return {
          ...base,
          background: 'radial-gradient(circle at 20% 80%, hsl(var(--accent)) 0%, transparent 50%), radial-gradient(circle at 80% 20%, hsl(var(--primary)) 0%, transparent 50%)',
        };
      case 'waves':
        return {
          ...base,
          background: 'linear-gradient(180deg, hsl(var(--primary)) 0%, hsl(var(--accent)) 100%)',
        };
      case 'geometric':
        return {
          ...base,
          background: `
            linear-gradient(60deg, transparent 40%, hsl(var(--accent) / 0.1) 40%, hsl(var(--accent) / 0.1) 60%, transparent 60%),
            linear-gradient(-60deg, transparent 40%, hsl(var(--primary) / 0.1) 40%, hsl(var(--primary) / 0.1) 60%, transparent 60%)
          `,
        };
      case 'noise':
        return {
          ...base,
          background: 'hsl(var(--muted))',
        };
      default:
        return {
          ...base,
          background: 'hsl(var(--background))',
        };
    }
  };

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-serif font-semibold text-foreground">Atmosphere Engine</h2>
          <p className="text-muted-foreground mt-1">Environmental physics for 3D/Canvas backgrounds</p>
        </div>
        <Button
          variant={isEditing ? "default" : "outline"}
          size="sm"
          onClick={() => setIsEditing(!isEditing)}
          className="gap-2"
        >
          {isEditing ? <Check className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
          {isEditing ? 'Done' : 'Edit'}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Preview */}
        <div className="relative aspect-video rounded-xl overflow-hidden border border-border">
          <div
            className="absolute inset-0 transition-all duration-500"
            style={getPreviewStyle()}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-background/80 backdrop-blur-sm rounded-lg p-6 text-center">
              <Layers className="h-8 w-8 mx-auto mb-2 text-foreground" />
              <p className="font-serif font-semibold text-foreground">Atmosphere Preview</p>
              <p className="text-sm text-muted-foreground capitalize">{atmosphere.style}</p>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-card rounded-xl p-6 border border-border space-y-6">
          {isEditing ? (
            <>
              <div>
                <label className="text-sm font-medium text-muted-foreground block mb-2">Style</label>
                <Select
                  value={atmosphere.style}
                  onValueChange={(style) => onAtmosphereChange({ ...atmosphere, style })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {styleOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-muted-foreground">Animate</label>
                <Switch
                  checked={atmosphere.animate}
                  onCheckedChange={(animate) => onAtmosphereChange({ ...atmosphere, animate })}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-muted-foreground">Opacity</label>
                  <span className="text-sm text-foreground">{Math.round(atmosphere.opacity * 100)}%</span>
                </div>
                <Slider
                  value={[atmosphere.opacity]}
                  onValueChange={([opacity]) => onAtmosphereChange({ ...atmosphere, opacity })}
                  min={0}
                  max={1}
                  step={0.05}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-muted-foreground">Blur</label>
                  <span className="text-sm text-foreground">{atmosphere.blur}px</span>
                </div>
                <Slider
                  value={[atmosphere.blur]}
                  onValueChange={([blur]) => onAtmosphereChange({ ...atmosphere, blur })}
                  min={0}
                  max={50}
                  step={1}
                />
              </div>
            </>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Style</span>
                <span className="text-sm font-medium text-foreground capitalize">{atmosphere.style}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Animation</span>
                <span className="text-sm font-medium text-foreground">{atmosphere.animate ? 'Enabled' : 'Disabled'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Opacity</span>
                <span className="text-sm font-medium text-foreground">{Math.round(atmosphere.opacity * 100)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Blur</span>
                <span className="text-sm font-medium text-foreground">{atmosphere.blur}px</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes gradientFlow {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>
    </section>
  );
};
