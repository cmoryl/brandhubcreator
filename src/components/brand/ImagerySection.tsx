import { useState, useRef } from 'react';
import { Plus, X, Pencil, Upload, ThumbsUp, ThumbsDown } from 'lucide-react';
import { BrandImagery } from '@/types/brand';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SectionHeader } from './SectionHeader';

interface ImagerySectionProps {
  imagery: BrandImagery[];
  onImageryChange: (imagery: BrandImagery[]) => void;
  customSubtitle?: string;
  onSubtitleChange?: (subtitle: string) => void;
}

export const ImagerySection = ({ imagery, onImageryChange, customSubtitle, onSubtitleChange }: ImagerySectionProps) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pendingType, setPendingType] = useState<'do' | 'dont'>('do');
  const [isHeaderEditing, setIsHeaderEditing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const url = event.target?.result as string;
      const newImagery: BrandImagery = {
        id: crypto.randomUUID(),
        url,
        type: pendingType,
        description: pendingType === 'do' ? 'Good example of brand photography' : 'Avoid this style',
      };
      onImageryChange([...imagery, newImagery]);
    };
    reader.readAsDataURL(file);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const triggerUpload = (type: 'do' | 'dont') => {
    setPendingType(type);
    fileInputRef.current?.click();
  };

  const updateImagery = (id: string, updates: Partial<BrandImagery>) => {
    onImageryChange(imagery.map(i => i.id === id ? { ...i, ...updates } : i));
  };

  const deleteImagery = (id: string) => {
    onImageryChange(imagery.filter(i => i.id !== id));
    if (editingId === id) setEditingId(null);
  };

  const doImages = imagery.filter(i => i.type === 'do');
  const dontImages = imagery.filter(i => i.type === 'dont');

  return (
    <section className="space-y-6">
      <SectionHeader
        title="Visual Direction"
        defaultSubtitle="Photography standards - Do's and Don'ts"
        customSubtitle={customSubtitle}
        onSubtitleChange={onSubtitleChange}
        isEditing={isHeaderEditing}
        onEditToggle={() => setIsHeaderEditing(!isHeaderEditing)}
      />

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        className="hidden"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Do's */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-green-600">
            <ThumbsUp className="h-5 w-5" />
            <h3 className="text-lg font-semibold">Do</h3>
          </div>
          <div className="space-y-3">
            {doImages.map((img, index) => (
              <div
                key={img.id}
                className="group relative bg-card rounded-xl overflow-hidden shadow-sm border-2 border-green-200 animate-scale-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="aspect-video relative">
                  <img src={img.url} alt={img.description} className="w-full h-full object-cover" />
                  <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => setEditingId(img.id)}
                      className="p-1.5 rounded-full bg-background/80 backdrop-blur-sm hover:bg-secondary"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => deleteImagery(img.id)}
                      className="p-1.5 rounded-full bg-background/80 backdrop-blur-sm hover:bg-destructive hover:text-destructive-foreground"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                <div className="p-3">
                  {editingId === img.id ? (
                    <div className="space-y-2">
                      <Input
                        value={img.description}
                        onChange={(e) => updateImagery(img.id, { description: e.target.value })}
                        placeholder="Description"
                        className="h-8"
                      />
                      <Select
                        value={img.type}
                        onValueChange={(type: 'do' | 'dont') => updateImagery(img.id, { type })}
                      >
                        <SelectTrigger className="h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="do">Do</SelectItem>
                          <SelectItem value="dont">Don't</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button size="sm" variant="secondary" onClick={() => setEditingId(null)} className="w-full">Done</Button>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">{img.description}</p>
                  )}
                </div>
              </div>
            ))}
            <button
              onClick={() => triggerUpload('do')}
              className="w-full h-24 border-2 border-dashed border-green-300 rounded-xl flex items-center justify-center gap-2 text-green-600 hover:bg-green-50 transition-colors"
            >
              <Upload className="h-5 w-5" />
              <span className="text-sm font-medium">Add example</span>
            </button>
          </div>
        </div>

        {/* Don'ts */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-red-600">
            <ThumbsDown className="h-5 w-5" />
            <h3 className="text-lg font-semibold">Don't</h3>
          </div>
          <div className="space-y-3">
            {dontImages.map((img, index) => (
              <div
                key={img.id}
                className="group relative bg-card rounded-xl overflow-hidden shadow-sm border-2 border-red-200 animate-scale-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="aspect-video relative">
                  <img src={img.url} alt={img.description} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-red-500/10" />
                  <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => setEditingId(img.id)}
                      className="p-1.5 rounded-full bg-background/80 backdrop-blur-sm hover:bg-secondary"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => deleteImagery(img.id)}
                      className="p-1.5 rounded-full bg-background/80 backdrop-blur-sm hover:bg-destructive hover:text-destructive-foreground"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                <div className="p-3">
                  {editingId === img.id ? (
                    <div className="space-y-2">
                      <Input
                        value={img.description}
                        onChange={(e) => updateImagery(img.id, { description: e.target.value })}
                        placeholder="Description"
                        className="h-8"
                      />
                      <Select
                        value={img.type}
                        onValueChange={(type: 'do' | 'dont') => updateImagery(img.id, { type })}
                      >
                        <SelectTrigger className="h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="do">Do</SelectItem>
                          <SelectItem value="dont">Don't</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button size="sm" variant="secondary" onClick={() => setEditingId(null)} className="w-full">Done</Button>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">{img.description}</p>
                  )}
                </div>
              </div>
            ))}
            <button
              onClick={() => triggerUpload('dont')}
              className="w-full h-24 border-2 border-dashed border-red-300 rounded-xl flex items-center justify-center gap-2 text-red-600 hover:bg-red-50 transition-colors"
            >
              <Upload className="h-5 w-5" />
              <span className="text-sm font-medium">Add example</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
