import { useState } from 'react';
import { Plus, Copy, Check, X, Pencil } from 'lucide-react';
import { BrandColor } from '@/types/brand';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { getAllColorFormats, getContrastColor } from '@/lib/colorUtils';
import { toast } from 'sonner';

interface ColorPaletteSectionProps {
  colors: BrandColor[];
  onColorsChange: (colors: BrandColor[]) => void;
}

export const ColorPaletteSection = ({ colors, onColorsChange }: ColorPaletteSectionProps) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [copiedValue, setCopiedValue] = useState<string | null>(null);

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

  const copyValue = async (value: string, label: string) => {
    await navigator.clipboard.writeText(value);
    setCopiedValue(value);
    toast.success(`${label} copied!`);
    setTimeout(() => setCopiedValue(null), 2000);
  };

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-serif font-semibold text-foreground">Color Palette</h2>
          <p className="text-muted-foreground mt-1">Define your brand's color system with all color formats</p>
        </div>
        <Button onClick={addColor} size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          Add Color
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {colors.map((color, index) => {
          const formats = getAllColorFormats(color.hex);
          
          return (
            <div
              key={color.id}
              className="group relative bg-card rounded-xl overflow-hidden shadow-sm border border-border animate-scale-in"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex">
                {/* Color swatch */}
                <div
                  className="w-32 min-h-[200px] relative cursor-pointer transition-transform hover:scale-[1.02] shrink-0"
                  style={{ backgroundColor: color.hex }}
                  onClick={() => copyValue(color.hex, 'HEX')}
                >
                  <div 
                    className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ color: getContrastColor(color.hex) }}
                  >
                    {copiedValue === color.hex ? (
                      <Check className="h-6 w-6" />
                    ) : (
                      <Copy className="h-6 w-6" />
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
                <div className="flex-1 p-4 space-y-3">
                  {editingId === color.id ? (
                    <div className="space-y-3">
                      <Input
                        value={color.name}
                        onChange={(e) => updateColor(color.id, { name: e.target.value })}
                        className="h-9 font-medium"
                        placeholder="Color name"
                      />
                      <div className="flex gap-2">
                        <Input
                          type="color"
                          value={color.hex}
                          onChange={(e) => updateColor(color.id, { hex: e.target.value })}
                          className="h-9 w-14 p-1 cursor-pointer"
                        />
                        <Input
                          value={color.hex}
                          onChange={(e) => updateColor(color.id, { hex: e.target.value })}
                          className="h-9 font-mono uppercase"
                          placeholder="#000000"
                        />
                      </div>
                      <Input
                        value={color.pantone || ''}
                        onChange={(e) => updateColor(color.id, { pantone: e.target.value })}
                        className="h-9"
                        placeholder="Pantone (e.g., PMS 286 C)"
                      />
                      <Input
                        value={color.usage || ''}
                        onChange={(e) => updateColor(color.id, { usage: e.target.value })}
                        className="h-9"
                        placeholder="Usage description"
                      />
                      <Button size="sm" variant="secondary" onClick={() => setEditingId(null)} className="w-full">
                        Done
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-start justify-between">
                        <h3 className="font-semibold text-lg text-foreground">{color.name}</h3>
                        <button
                          onClick={() => setEditingId(color.id)}
                          className="p-1.5 rounded-md hover:bg-secondary transition-colors"
                        >
                          <Pencil className="h-4 w-4 text-muted-foreground" />
                        </button>
                      </div>

                      {/* Color codes grid */}
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <ColorCodeItem 
                          label="HEX" 
                          value={formats.hex} 
                          onCopy={() => copyValue(formats.hex, 'HEX')}
                          isCopied={copiedValue === formats.hex}
                        />
                        <ColorCodeItem 
                          label="RGB" 
                          value={formats.rgb} 
                          onCopy={() => copyValue(formats.rgb, 'RGB')}
                          isCopied={copiedValue === formats.rgb}
                        />
                        <ColorCodeItem 
                          label="CMYK" 
                          value={formats.cmyk} 
                          onCopy={() => copyValue(formats.cmyk, 'CMYK')}
                          isCopied={copiedValue === formats.cmyk}
                        />
                        <ColorCodeItem 
                          label="HSV" 
                          value={formats.hsv} 
                          onCopy={() => copyValue(formats.hsv, 'HSV')}
                          isCopied={copiedValue === formats.hsv}
                        />
                        {color.pantone && (
                          <ColorCodeItem 
                            label="Pantone" 
                            value={color.pantone} 
                            onCopy={() => copyValue(color.pantone!, 'Pantone')}
                            isCopied={copiedValue === color.pantone}
                            className="col-span-2"
                          />
                        )}
                      </div>

                      {color.usage && (
                        <p className="text-sm text-muted-foreground pt-2 border-t border-border">{color.usage}</p>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {colors.length === 0 && (
          <button
            onClick={addColor}
            className="h-48 border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-accent hover:text-accent transition-colors col-span-full"
          >
            <Plus className="h-8 w-8" />
            <span className="text-sm font-medium">Add your first color</span>
          </button>
        )}
      </div>
    </section>
  );
};

interface ColorCodeItemProps {
  label: string;
  value: string;
  onCopy: () => void;
  isCopied: boolean;
  className?: string;
}

const ColorCodeItem = ({ label, value, onCopy, isCopied, className }: ColorCodeItemProps) => (
  <button
    onClick={onCopy}
    className={cn(
      "flex items-center justify-between p-2 rounded-md bg-secondary/50 hover:bg-secondary transition-colors text-left group/item",
      className
    )}
  >
    <div className="min-w-0 flex-1">
      <span className="font-semibold text-foreground block">{label}</span>
      <span className="font-mono text-muted-foreground truncate block text-[10px]">{value}</span>
    </div>
    <div className="shrink-0 ml-2 opacity-0 group-hover/item:opacity-100 transition-opacity">
      {isCopied ? (
        <Check className="h-3 w-3 text-green-500" />
      ) : (
        <Copy className="h-3 w-3 text-muted-foreground" />
      )}
    </div>
  </button>
);