import { useState, useRef } from 'react';
import { Plus, X, Pencil, Upload, ThumbsUp, ThumbsDown, Grid2X2, Grid3X3, LayoutGrid, Rows3 } from 'lucide-react';
import { BrandImagery } from '@/types/brand';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { SectionHeader } from './SectionHeader';

interface ImagerySectionProps {
  imagery: BrandImagery[];
  onImageryChange: (imagery: BrandImagery[]) => void;
  customSubtitle?: string;
  onSubtitleChange?: (subtitle: string) => void;
}

type ViewMode = 'split' | 'grid-2' | 'grid-3' | 'grid-4';

export const ImagerySection = ({ imagery, onImageryChange, customSubtitle, onSubtitleChange }: ImagerySectionProps) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pendingType, setPendingType] = useState<'do' | 'dont'>('do');
  const [isHeaderEditing, setIsHeaderEditing] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('split');
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

  const getGridClass = () => {
    switch (viewMode) {
      case 'grid-2': return 'grid-cols-2';
      case 'grid-3': return 'grid-cols-2 sm:grid-cols-3';
      case 'grid-4': return 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4';
      default: return '';
    }
  };

  const renderImageCard = (img: BrandImagery, index: number, borderColor: string, bgHoverColor: string) => (
    <div
      key={img.id}
      className={`group relative bg-card rounded-xl overflow-hidden shadow-sm border-2 ${borderColor} animate-scale-in`}
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className={`${viewMode === 'split' ? 'aspect-video' : 'aspect-square'} relative`}>
        <img src={img.url} alt={img.description} className="w-full h-full object-cover" />
        {img.type === 'dont' && <div className="absolute inset-0 bg-red-500/10" />}
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
        {/* Type badge */}
        <div className={`absolute top-2 left-2 px-2 py-1 rounded-full text-xs font-medium ${img.type === 'do' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
          {img.type === 'do' ? 'Do' : "Don't"}
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
          <p className="text-sm text-muted-foreground line-clamp-2">{img.description}</p>
        )}
      </div>
    </div>
  );

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex-1 min-w-0">
          <SectionHeader
            title="Visual Direction"
            defaultSubtitle="Photography standards - Do's and Don'ts"
            customSubtitle={customSubtitle}
            onSubtitleChange={onSubtitleChange}
            isEditing={isHeaderEditing}
            onEditToggle={() => setIsHeaderEditing(!isHeaderEditing)}
          />
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <ToggleGroup
            type="single"
            value={viewMode}
            onValueChange={(value) => value && setViewMode(value as ViewMode)}
            className="border rounded-md"
          >
            <ToggleGroupItem value="split" aria-label="Split view" className="px-2">
              <Rows3 className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="grid-2" aria-label="2 column grid" className="px-2">
              <Grid2X2 className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="grid-3" aria-label="3 column grid" className="px-2">
              <Grid3X3 className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="grid-4" aria-label="4 column grid" className="px-2">
              <LayoutGrid className="h-4 w-4" />
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        className="hidden"
      />

      {viewMode === 'split' ? (
        /* Split View - Original Do/Don't columns */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Do's */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-green-600">
              <ThumbsUp className="h-5 w-5" />
              <h3 className="text-lg font-semibold">Do</h3>
              <span className="text-sm text-muted-foreground">({doImages.length})</span>
            </div>
            <div className="space-y-3">
              {doImages.map((img, index) => renderImageCard(img, index, 'border-green-200', 'hover:bg-green-50'))}
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
              <span className="text-sm text-muted-foreground">({dontImages.length})</span>
            </div>
            <div className="space-y-3">
              {dontImages.map((img, index) => renderImageCard(img, index, 'border-red-200', 'hover:bg-red-50'))}
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
      ) : (
        /* Grid View - All images in grid with type badges */
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <Button onClick={() => triggerUpload('do')} variant="outline" size="sm" className="gap-2 text-green-600 border-green-300 hover:bg-green-50">
              <ThumbsUp className="h-4 w-4" />
              Add Do
            </Button>
            <Button onClick={() => triggerUpload('dont')} variant="outline" size="sm" className="gap-2 text-red-600 border-red-300 hover:bg-red-50">
              <ThumbsDown className="h-4 w-4" />
              Add Don't
            </Button>
          </div>
          
          <div className={`grid ${getGridClass()} gap-4`}>
            {imagery.map((img, index) => 
              renderImageCard(
                img, 
                index, 
                img.type === 'do' ? 'border-green-200' : 'border-red-200',
                img.type === 'do' ? 'hover:bg-green-50' : 'hover:bg-red-50'
              )
            )}
          </div>

          {imagery.length === 0 && (
            <div className="text-center py-12 border-2 border-dashed border-border rounded-xl">
              <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No imagery examples yet</h3>
              <p className="text-muted-foreground mb-4">Add examples to show what works and what doesn't for your brand photography.</p>
            </div>
          )}
        </div>
      )}
    </section>
  );
};
