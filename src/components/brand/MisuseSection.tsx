import { useState, useRef } from 'react';
import { Plus, X, Upload, AlertTriangle } from 'lucide-react';
import { BrandMisuse } from '@/types/brand';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SectionHeader } from './SectionHeader';

interface MisuseSectionProps {
  misuse: BrandMisuse[];
  onMisuseChange: (misuse: BrandMisuse[]) => void;
  customSubtitle?: string;
  onSubtitleChange?: (subtitle: string) => void;
}

export const MisuseSection = ({ misuse, onMisuseChange, customSubtitle, onSubtitleChange }: MisuseSectionProps) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isHeaderEditing, setIsHeaderEditing] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const url = event.target?.result as string;
      const newMisuse: BrandMisuse = {
        id: crypto.randomUUID(),
        url,
        description: 'Describe why this is incorrect usage',
      };
      onMisuseChange([...misuse, newMisuse]);
      setEditingId(newMisuse.id);
    };
    reader.readAsDataURL(file);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const updateMisuse = (id: string, updates: Partial<BrandMisuse>) => {
    onMisuseChange(misuse.map(m => m.id === id ? { ...m, ...updates } : m));
  };

  const deleteMisuse = (id: string) => {
    onMisuseChange(misuse.filter(m => m.id !== id));
    if (editingId === id) setEditingId(null);
  };

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1">
          <SectionHeader
            title="Anti-Patterns"
            defaultSubtitle="Registry of forbidden transformations and violations"
            customSubtitle={customSubtitle}
            onSubtitleChange={onSubtitleChange}
            isEditing={isHeaderEditing}
            onEditToggle={() => setIsHeaderEditing(!isHeaderEditing)}
          />
        </div>
        <Button onClick={() => fileInputRef.current?.click()} size="sm" variant="destructive" className="gap-2 shrink-0">
          <Upload className="h-4 w-4" />
          Add Example
        </Button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        className="hidden"
      />

      <div className="bg-destructive/5 border-2 border-dashed border-destructive/30 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <AlertTriangle className="h-6 w-6 text-destructive" />
          <div>
            <h3 className="font-semibold text-destructive">Logo Misuse Examples</h3>
            <p className="text-sm text-muted-foreground">Document incorrect usage to protect brand integrity</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {misuse.map((item, index) => (
            <div
              key={item.id}
              className="group relative bg-card rounded-xl overflow-hidden shadow-sm border-2 border-red-200 animate-scale-in"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="aspect-video relative">
                <img src={item.url} alt={item.description} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-red-500/20" />
                <div className="absolute top-2 left-2 bg-destructive text-destructive-foreground text-xs font-bold px-2 py-1 rounded">
                  ✕ DON'T
                </div>
                <button
                  onClick={() => deleteMisuse(item.id)}
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-background/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive hover:text-destructive-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="p-3">
                {editingId === item.id ? (
                  <div className="space-y-2">
                    <Input
                      value={item.description}
                      onChange={(e) => updateMisuse(item.id, { description: e.target.value })}
                      placeholder="Why is this wrong?"
                      className="h-8"
                    />
                    <Button size="sm" variant="secondary" onClick={() => setEditingId(null)} className="w-full">
                      Done
                    </Button>
                  </div>
                ) : (
                  <p
                    className="text-sm text-muted-foreground cursor-pointer hover:text-foreground"
                    onClick={() => setEditingId(item.id)}
                  >
                    {item.description}
                  </p>
                )}
              </div>
            </div>
          ))}

          <button
            onClick={() => fileInputRef.current?.click()}
            className="aspect-video border-2 border-dashed border-red-300 rounded-xl flex flex-col items-center justify-center gap-2 text-red-400 hover:bg-red-50 transition-colors"
          >
            <Plus className="h-6 w-6" />
            <span className="text-sm font-medium">Add misuse example</span>
          </button>
        </div>
      </div>
    </section>
  );
};
