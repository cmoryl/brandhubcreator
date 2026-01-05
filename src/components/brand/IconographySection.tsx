import { useState } from 'react';
import { Plus, X, Pencil, Copy, Check } from 'lucide-react';
import { BrandIconography } from '@/types/brand';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface IconographySectionProps {
  iconography: BrandIconography[];
  onIconographyChange: (iconography: BrandIconography[]) => void;
}

const categoryOptions = ['Navigation', 'Actions', 'Social', 'Status', 'Commerce', 'Media', 'Communication', 'Other'];

export const IconographySection = ({ iconography, onIconographyChange }: IconographySectionProps) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const addIcon = () => {
    const newIcon: BrandIconography = {
      id: crypto.randomUUID(),
      name: 'New Icon',
      svgPath: 'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5',
      category: 'Other',
    };
    onIconographyChange([...iconography, newIcon]);
    setEditingId(newIcon.id);
  };

  const updateIcon = (id: string, updates: Partial<BrandIconography>) => {
    onIconographyChange(iconography.map(i => i.id === id ? { ...i, ...updates } : i));
  };

  const deleteIcon = (id: string) => {
    onIconographyChange(iconography.filter(i => i.id !== id));
    if (editingId === id) setEditingId(null);
  };

  const copySVG = async (icon: BrandIconography) => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="${icon.svgPath}"/></svg>`;
    await navigator.clipboard.writeText(svg);
    setCopiedId(icon.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const groupedIcons = iconography.reduce((acc, icon) => {
    if (!acc[icon.category]) acc[icon.category] = [];
    acc[icon.category].push(icon);
    return acc;
  }, {} as Record<string, BrandIconography[]>);

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-serif font-semibold text-foreground">Neural Vectors</h2>
          <p className="text-muted-foreground mt-1">Custom UI glyph system with SVG path data</p>
        </div>
        <Button onClick={addIcon} size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          Add Icon
        </Button>
      </div>

      <div className="space-y-6">
        {Object.entries(groupedIcons).map(([category, icons]) => (
          <div key={category} className="space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">{category}</h3>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
              {icons.map((icon, index) => (
                <div
                  key={icon.id}
                  className="group relative bg-card rounded-xl p-4 shadow-sm border border-border animate-scale-in flex flex-col items-center cursor-pointer"
                  style={{ animationDelay: `${index * 50}ms` }}
                  onClick={() => copySVG(icon)}
                >
                  <svg
                    className="w-8 h-8 text-foreground mb-2"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d={icon.svgPath} />
                  </svg>
                  <p className="text-xs text-muted-foreground text-center truncate w-full">{icon.name}</p>

                  <div className="absolute inset-0 bg-black/60 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    {copiedId === icon.id ? (
                      <Check className="h-5 w-5 text-white" />
                    ) : (
                      <Copy className="h-5 w-5 text-white" />
                    )}
                  </div>

                  <div className="absolute top-1 right-1 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => { e.stopPropagation(); setEditingId(icon.id); }}
                      className="p-1 rounded bg-background/80"
                    >
                      <Pencil className="h-2.5 w-2.5" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteIcon(icon.id); }}
                      className="p-1 rounded bg-background/80 hover:bg-destructive hover:text-destructive-foreground"
                    >
                      <X className="h-2.5 w-2.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {iconography.length === 0 && (
          <button
            onClick={addIcon}
            className="w-full h-32 border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-accent hover:text-accent transition-colors"
          >
            <Plus className="h-6 w-6" />
            <span className="text-sm font-medium">Add your first custom icon</span>
          </button>
        )}
      </div>

      {/* Edit modal */}
      {editingId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setEditingId(null)}>
          <div className="bg-card rounded-xl p-6 max-w-md w-full space-y-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold">Edit Icon</h3>
            {(() => {
              const icon = iconography.find(i => i.id === editingId);
              if (!icon) return null;
              return (
                <>
                  <Input
                    value={icon.name}
                    onChange={(e) => updateIcon(icon.id, { name: e.target.value })}
                    placeholder="Icon name"
                  />
                  <Select
                    value={icon.category}
                    onValueChange={(category) => updateIcon(icon.id, { category })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categoryOptions.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Textarea
                    value={icon.svgPath}
                    onChange={(e) => updateIcon(icon.id, { svgPath: e.target.value })}
                    placeholder="SVG path data"
                    className="font-mono text-xs min-h-[100px]"
                  />
                  <Button onClick={() => setEditingId(null)} className="w-full">Done</Button>
                </>
              );
            })()}
          </div>
        </div>
      )}
    </section>
  );
};
