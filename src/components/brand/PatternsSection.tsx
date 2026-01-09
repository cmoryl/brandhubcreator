import { useState, useRef } from 'react';
import { Plus, X, Pencil, Upload } from 'lucide-react';
import { BrandPattern } from '@/types/brand';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SectionHeader } from './SectionHeader';

interface PatternsSectionProps {
  patterns: BrandPattern[];
  onPatternsChange: (patterns: BrandPattern[]) => void;
  customSubtitle?: string;
  onSubtitleChange?: (subtitle: string) => void;
}

export const PatternsSection = ({ patterns, onPatternsChange, customSubtitle, onSubtitleChange }: PatternsSectionProps) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isHeaderEditing, setIsHeaderEditing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const url = event.target?.result as string;
      const newPattern: BrandPattern = {
        id: crypto.randomUUID(),
        name: file.name.replace(/\.[^/.]+$/, ''),
        url,
      };
      onPatternsChange([...patterns, newPattern]);
    };
    reader.readAsDataURL(file);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const updatePattern = (id: string, updates: Partial<BrandPattern>) => {
    onPatternsChange(patterns.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const deletePattern = (id: string) => {
    onPatternsChange(patterns.filter(p => p.id !== id));
    if (editingId === id) setEditingId(null);
  };

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1">
          <SectionHeader
            title="Geometric Primitives"
            defaultSubtitle="Surface texture rules for visual continuity"
            customSubtitle={customSubtitle}
            onSubtitleChange={onSubtitleChange}
            isEditing={isHeaderEditing}
            onEditToggle={() => setIsHeaderEditing(!isHeaderEditing)}
          />
        </div>
        <Button onClick={() => fileInputRef.current?.click()} size="sm" className="gap-2 shrink-0">
          <Upload className="h-4 w-4" />
          Upload Pattern
        </Button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        className="hidden"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {patterns.map((pattern, index) => (
          <div
            key={pattern.id}
            className="group relative bg-card rounded-xl overflow-hidden shadow-sm border border-border animate-scale-in"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            {/* Pattern preview */}
            <div
              className="h-32 relative"
              style={{ backgroundImage: `url(${pattern.url})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
            >
              <button
                onClick={() => deletePattern(pattern.id)}
                className="absolute top-2 right-2 p-1.5 rounded-full bg-background/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive hover:text-destructive-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Pattern info */}
            <div className="p-4">
              {editingId === pattern.id ? (
                <div className="space-y-2">
                  <Input
                    value={pattern.name}
                    onChange={(e) => updatePattern(pattern.id, { name: e.target.value })}
                    placeholder="Pattern name"
                    className="h-8"
                  />
                  <Button size="sm" variant="secondary" onClick={() => setEditingId(null)} className="w-full">
                    Done
                  </Button>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-foreground">{pattern.name}</h3>
                  <button
                    onClick={() => setEditingId(pattern.id)}
                    className="p-1.5 rounded-md hover:bg-secondary transition-colors"
                  >
                    <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

        {patterns.length === 0 && (
          <button
            onClick={() => fileInputRef.current?.click()}
            className="h-48 border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-accent hover:text-accent transition-colors"
          >
            <Upload className="h-8 w-8" />
            <span className="text-sm font-medium">Upload your first pattern</span>
          </button>
        )}
      </div>
    </section>
  );
};
