import { useState, useRef } from 'react';
import { Plus, X, Pencil, Upload } from 'lucide-react';
import { BrandIcon } from '@/types/brand';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SectionHeader } from './SectionHeader';

interface BrandIconsSectionProps {
  brandIcons: BrandIcon[];
  onBrandIconsChange: (brandIcons: BrandIcon[]) => void;
  customSubtitle?: string;
  onSubtitleChange?: (subtitle: string) => void;
}

export const BrandIconsSection = ({ brandIcons, onBrandIconsChange, customSubtitle, onSubtitleChange }: BrandIconsSectionProps) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isHeaderEditing, setIsHeaderEditing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const url = event.target?.result as string;
      const newIcon: BrandIcon = {
        id: crypto.randomUUID(),
        name: file.name.replace(/\.[^/.]+$/, ''),
        url,
        settings: 'min-size: 16px, max-size: 512px',
      };
      onBrandIconsChange([...brandIcons, newIcon]);
    };
    reader.readAsDataURL(file);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const updateIcon = (id: string, updates: Partial<BrandIcon>) => {
    onBrandIconsChange(brandIcons.map(i => i.id === id ? { ...i, ...updates } : i));
  };

  const deleteIcon = (id: string) => {
    onBrandIconsChange(brandIcons.filter(i => i.id !== id));
    if (editingId === id) setEditingId(null);
  };

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1">
          <SectionHeader
            title="Symbol Standards"
            defaultSubtitle="Shorthand identification - favicons and brand marks"
            customSubtitle={customSubtitle}
            onSubtitleChange={onSubtitleChange}
            isEditing={isHeaderEditing}
            onEditToggle={() => setIsHeaderEditing(!isHeaderEditing)}
          />
        </div>
        <Button onClick={() => fileInputRef.current?.click()} size="sm" className="gap-2 shrink-0">
          <Upload className="h-4 w-4" />
          Upload Icon
        </Button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        className="hidden"
      />

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {brandIcons.map((icon, index) => (
          <div
            key={icon.id}
            className="group relative bg-card rounded-xl p-4 shadow-sm border border-border animate-scale-in flex flex-col items-center"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center mb-3">
              <img src={icon.url} alt={icon.name} className="max-h-12 max-w-12 object-contain" />
            </div>

            {editingId === icon.id ? (
              <div className="space-y-2 w-full">
                <Input
                  value={icon.name}
                  onChange={(e) => updateIcon(icon.id, { name: e.target.value })}
                  placeholder="Icon name"
                  className="h-8 text-xs"
                />
                <Input
                  value={icon.settings}
                  onChange={(e) => updateIcon(icon.id, { settings: e.target.value })}
                  placeholder="Settings"
                  className="h-8 text-xs"
                />
                <Button size="sm" variant="secondary" onClick={() => setEditingId(null)} className="w-full">
                  Done
                </Button>
              </div>
            ) : (
              <>
                <p className="text-sm font-medium text-foreground text-center truncate w-full">{icon.name}</p>
                <p className="text-xs text-muted-foreground text-center truncate w-full">{icon.settings}</p>
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => setEditingId(icon.id)}
                    className="p-1 rounded-md bg-background/80 hover:bg-secondary transition-colors"
                  >
                    <Pencil className="h-3 w-3 text-muted-foreground" />
                  </button>
                  <button
                    onClick={() => deleteIcon(icon.id)}
                    className="p-1 rounded-md bg-background/80 hover:bg-destructive hover:text-destructive-foreground transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              </>
            )}
          </div>
        ))}

        {brandIcons.length === 0 && (
          <button
            onClick={() => fileInputRef.current?.click()}
            className="col-span-full h-32 border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-accent hover:text-accent transition-colors"
          >
            <Upload className="h-6 w-6" />
            <span className="text-sm font-medium">Upload brand icons</span>
          </button>
        )}
      </div>
    </section>
  );
};
