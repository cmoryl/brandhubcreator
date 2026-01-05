import { useState } from 'react';
import { Plus, Copy, Check, X, Pencil } from 'lucide-react';
import { BrandColor } from '@/types/brand';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface ColorPaletteSectionProps {
  colors: BrandColor[];
  onColorsChange: (colors: BrandColor[]) => void;
}

export const ColorPaletteSection = ({ colors, onColorsChange }: ColorPaletteSectionProps) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const addColor = () => {
    const newColor: BrandColor = {
      id: crypto.randomUUID(),
      name: 'New Color',
      hex: '#6B7280',
      usage: 'Define usage',
    };
    onColorsChange([...colors, newColor]);
    setEditingId(newColor.id);
  };

  const updateColor = (id: string, updates: Partial<BrandColor>) => {
    onColorsChange(colors.map(c => c.id === id ? { ...c, ...updates } : c));
  };

  const deleteColor = (id: string) => {
    onColorsChange(colors.filter(c => c.id !== id));
    if (editingId === id) setEditingId(null);
  };

  const copyHex = async (hex: string, id: string) => {
    await navigator.clipboard.writeText(hex);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getContrastColor = (hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5 ? '#1a1a1a' : '#ffffff';
  };

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-serif font-semibold text-foreground">Color Palette</h2>
          <p className="text-muted-foreground mt-1">Define your brand's color system</p>
        </div>
        <Button onClick={addColor} size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          Add Color
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {colors.map((color, index) => (
          <div
            key={color.id}
            className="group relative bg-card rounded-xl overflow-hidden shadow-sm border border-border animate-scale-in"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            {/* Color swatch */}
            <div
              className="h-32 relative cursor-pointer transition-transform hover:scale-[1.02]"
              style={{ backgroundColor: color.hex }}
              onClick={() => copyHex(color.hex, color.id)}
            >
              <div 
                className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ color: getContrastColor(color.hex) }}
              >
                {copiedId === color.id ? (
                  <div className="flex items-center gap-1 text-sm font-medium">
                    <Check className="h-4 w-4" />
                    Copied!
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-sm font-medium">
                    <Copy className="h-4 w-4" />
                    Copy
                  </div>
                )}
              </div>

              {/* Delete button */}
              <button
                onClick={(e) => { e.stopPropagation(); deleteColor(color.id); }}
                className="absolute top-2 right-2 p-1.5 rounded-full bg-background/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive hover:text-destructive-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Color info */}
            <div className="p-4 space-y-3">
              {editingId === color.id ? (
                <div className="space-y-2">
                  <Input
                    value={color.name}
                    onChange={(e) => updateColor(color.id, { name: e.target.value })}
                    className="h-8 text-sm font-medium"
                    placeholder="Color name"
                  />
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={color.hex}
                      onChange={(e) => updateColor(color.id, { hex: e.target.value })}
                      className="h-8 w-12 p-1 cursor-pointer"
                    />
                    <Input
                      value={color.hex}
                      onChange={(e) => updateColor(color.id, { hex: e.target.value })}
                      className="h-8 text-sm font-mono uppercase"
                      placeholder="#000000"
                    />
                  </div>
                  <Input
                    value={color.usage || ''}
                    onChange={(e) => updateColor(color.id, { usage: e.target.value })}
                    className="h-8 text-sm"
                    placeholder="Usage description"
                  />
                  <Button size="sm" variant="secondary" onClick={() => setEditingId(null)} className="w-full">
                    Done
                  </Button>
                </div>
              ) : (
                <>
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-medium text-foreground">{color.name}</h3>
                      <p className="text-sm font-mono text-muted-foreground uppercase">{color.hex}</p>
                    </div>
                    <button
                      onClick={() => setEditingId(color.id)}
                      className="p-1.5 rounded-md hover:bg-secondary transition-colors"
                    >
                      <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                    </button>
                  </div>
                  {color.usage && (
                    <p className="text-sm text-muted-foreground">{color.usage}</p>
                  )}
                </>
              )}
            </div>
          </div>
        ))}

        {colors.length === 0 && (
          <button
            onClick={addColor}
            className="h-48 border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-accent hover:text-accent transition-colors"
          >
            <Plus className="h-8 w-8" />
            <span className="text-sm font-medium">Add your first color</span>
          </button>
        )}
      </div>
    </section>
  );
};
