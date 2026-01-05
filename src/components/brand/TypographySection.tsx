import { useState } from 'react';
import { Plus, X, Pencil } from 'lucide-react';
import { BrandTypography } from '@/types/brand';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface TypographySectionProps {
  typography: BrandTypography[];
  onTypographyChange: (typography: BrandTypography[]) => void;
}

const fontOptions = [
  { name: 'Inter', family: 'Inter, sans-serif' },
  { name: 'DM Sans', family: 'DM Sans, sans-serif' },
  { name: 'Fraunces', family: 'Fraunces, serif' },
  { name: 'Playfair Display', family: 'Playfair Display, serif' },
  { name: 'Space Grotesk', family: 'Space Grotesk, sans-serif' },
  { name: 'Roboto', family: 'Roboto, sans-serif' },
  { name: 'Open Sans', family: 'Open Sans, sans-serif' },
  { name: 'Lato', family: 'Lato, sans-serif' },
  { name: 'Montserrat', family: 'Montserrat, sans-serif' },
  { name: 'Georgia', family: 'Georgia, serif' },
];

const weightOptions = ['100', '200', '300', '400', '500', '600', '700', '800', '900'];

export const TypographySection = ({ typography, onTypographyChange }: TypographySectionProps) => {
  const [editingId, setEditingId] = useState<string | null>(null);

  const addTypography = () => {
    const newType: BrandTypography = {
      id: crypto.randomUUID(),
      name: 'Heading',
      fontFamily: 'Fraunces, serif',
      weight: '600',
      usage: 'Headlines and titles',
    };
    onTypographyChange([...typography, newType]);
    setEditingId(newType.id);
  };

  const updateTypography = (id: string, updates: Partial<BrandTypography>) => {
    onTypographyChange(typography.map(t => t.id === id ? { ...t, ...updates } : t));
  };

  const deleteTypography = (id: string) => {
    onTypographyChange(typography.filter(t => t.id !== id));
    if (editingId === id) setEditingId(null);
  };

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-serif font-semibold text-foreground">Typography</h2>
          <p className="text-muted-foreground mt-1">Define your brand's type system</p>
        </div>
        <Button onClick={addTypography} size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          Add Style
        </Button>
      </div>

      <div className="space-y-4">
        {typography.map((type, index) => (
          <div
            key={type.id}
            className="group relative bg-card rounded-xl p-6 shadow-sm border border-border animate-slide-up"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            {editingId === type.id ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Input
                    value={type.name}
                    onChange={(e) => updateTypography(type.id, { name: e.target.value })}
                    placeholder="Style name"
                    className="h-10"
                  />
                  <Select
                    value={type.fontFamily}
                    onValueChange={(value) => updateTypography(type.id, { fontFamily: value })}
                  >
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Select font" />
                    </SelectTrigger>
                    <SelectContent>
                      {fontOptions.map(font => (
                        <SelectItem key={font.family} value={font.family}>
                          <span style={{ fontFamily: font.family }}>{font.name}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={type.weight}
                    onValueChange={(value) => updateTypography(type.id, { weight: value })}
                  >
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Weight" />
                    </SelectTrigger>
                    <SelectContent>
                      {weightOptions.map(weight => (
                        <SelectItem key={weight} value={weight}>
                          {weight}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Input
                  value={type.usage}
                  onChange={(e) => updateTypography(type.id, { usage: e.target.value })}
                  placeholder="Usage description"
                  className="h-10"
                />
                <Button size="sm" variant="secondary" onClick={() => setEditingId(null)}>
                  Done
                </Button>
              </div>
            ) : (
              <div className="flex items-start justify-between">
                <div className="space-y-3 flex-1">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                      {type.name}
                    </span>
                    <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded">
                      {type.weight}
                    </span>
                  </div>
                  <p
                    className="text-3xl text-foreground"
                    style={{ fontFamily: type.fontFamily, fontWeight: parseInt(type.weight) }}
                  >
                    The quick brown fox jumps over the lazy dog
                  </p>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="font-mono">{type.fontFamily.split(',')[0]}</span>
                    <span>•</span>
                    <span>{type.usage}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => setEditingId(type.id)}
                    className="p-2 rounded-md hover:bg-secondary transition-colors"
                  >
                    <Pencil className="h-4 w-4 text-muted-foreground" />
                  </button>
                  <button
                    onClick={() => deleteTypography(type.id)}
                    className="p-2 rounded-md hover:bg-destructive hover:text-destructive-foreground transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}

        {typography.length === 0 && (
          <button
            onClick={addTypography}
            className="w-full h-32 border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-accent hover:text-accent transition-colors"
          >
            <Plus className="h-8 w-8" />
            <span className="text-sm font-medium">Add your first typography style</span>
          </button>
        )}
      </div>
    </section>
  );
};
