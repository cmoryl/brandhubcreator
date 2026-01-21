import { useState, useCallback } from 'react';
import { X, Pencil, Upload, Download, Package } from 'lucide-react';
import { BrandPattern, LayoutPreset } from '@/types/brand';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SectionHeader } from './SectionHeader';
import { LayoutSelector, useLayoutClasses } from './LayoutSelector';
import { toast } from 'sonner';
import { useDropZone } from '@/components/ui/drop-zone';
import { OptimizedImage } from '@/components/ui/optimized-image';

interface PatternsSectionProps {
  patterns: BrandPattern[];
  onPatternsChange: (patterns: BrandPattern[]) => void;
  customSubtitle?: string;
  onSubtitleChange?: (subtitle: string) => void;
  layout?: LayoutPreset;
  onLayoutChange?: (layout: LayoutPreset) => void;
}

export const PatternsSection = ({ patterns, onPatternsChange, customSubtitle, onSubtitleChange, layout = 'grid-3', onLayoutChange }: PatternsSectionProps) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isHeaderEditing, setIsHeaderEditing] = useState(false);
  const { gridClass } = useLayoutClasses(layout);

  const handleFileDrop = useCallback((file: File) => {
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
  }, [patterns, onPatternsChange]);

  const { isDragging, fileInputRef, dragHandlers, openFilePicker, handleInputChange } = useDropZone({
    onFileDrop: handleFileDrop,
    accept: 'image/*',
  });

  const updatePattern = (id: string, updates: Partial<BrandPattern>) => {
    onPatternsChange(patterns.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const deletePattern = (id: string) => {
    onPatternsChange(patterns.filter(p => p.id !== id));
    if (editingId === id) setEditingId(null);
  };

  const downloadPattern = (pattern: BrandPattern) => {
    const link = document.createElement('a');
    link.href = pattern.url;
    link.download = `${pattern.name}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Downloaded ${pattern.name}`);
  };

  const downloadAllPatterns = async () => {
    if (patterns.length === 0) {
      toast.error('No patterns to download');
      return;
    }
    
    for (const pattern of patterns) {
      const link = document.createElement('a');
      link.href = pattern.url;
      link.download = `pattern-${pattern.name}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      await new Promise(resolve => setTimeout(resolve, 300));
    }
    toast.success(`Downloaded ${patterns.length} pattern(s)`);
  };

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex-1 min-w-0">
          <SectionHeader
            title="Geometric Primitives"
            defaultSubtitle="Surface texture rules for visual continuity"
            customSubtitle={customSubtitle}
            onSubtitleChange={onSubtitleChange}
            isEditing={isHeaderEditing}
            onEditToggle={() => setIsHeaderEditing(!isHeaderEditing)}
          />
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {onLayoutChange && (
            <LayoutSelector
              value={layout}
              onChange={onLayoutChange}
              availableLayouts={['grid-2', 'grid-3', 'grid-4', 'compact']}
              size="sm"
            />
          )}
          {patterns.length > 0 && (
            <Button onClick={downloadAllPatterns} variant="outline" size="sm" className="gap-2">
              <Package className="h-4 w-4" />
              Download All
            </Button>
          )}
          <Button onClick={openFilePicker} size="sm" className="gap-2">
            <Upload className="h-4 w-4" />
            Upload Pattern
          </Button>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleInputChange}
        className="hidden"
      />

      <div 
        className={`${gridClass} ${isDragging ? 'ring-2 ring-primary ring-offset-2 rounded-xl' : ''}`}
        {...dragHandlers}
      >
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
              <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => downloadPattern(pattern)}
                  className="p-1.5 rounded-full bg-background/80 backdrop-blur-sm hover:bg-secondary"
                  title="Download"
                >
                  <Download className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => deletePattern(pattern.id)}
                  className="p-1.5 rounded-full bg-background/80 backdrop-blur-sm hover:bg-destructive hover:text-destructive-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
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
            onClick={openFilePicker}
            className={`h-48 border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-2 transition-colors ${
              isDragging 
                ? 'border-primary bg-primary/5 text-primary' 
                : 'border-border text-muted-foreground hover:border-accent hover:text-accent'
            }`}
          >
            <Upload className="h-8 w-8" />
            <span className="text-sm font-medium">{isDragging ? 'Drop to upload' : 'Upload your first pattern'}</span>
          </button>
        )}
      </div>

      {isDragging && patterns.length > 0 && (
        <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
          <div className="bg-background/90 backdrop-blur-sm px-6 py-3 rounded-xl shadow-lg border border-primary">
            <div className="flex items-center gap-3">
              <Upload className="h-5 w-5 text-primary" />
              <span className="font-medium">Drop to upload pattern</span>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
