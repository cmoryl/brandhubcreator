import { useState, useCallback } from 'react';
import { Plus, X, Upload, AlertTriangle, FolderOpen, Loader2 } from 'lucide-react';
import { BrandMisuse } from '@/types/brand';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SectionHeader } from './SectionHeader';
import { useDropZone } from '@/components/ui/drop-zone';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { ImageLibraryPicker } from '@/components/ui/ImageLibraryPicker';
import { useStorageUpload } from '@/hooks/useStorageUpload';
import { toast } from 'sonner';

import { TransPerfectAntiPatternsPanel } from './identity/TransPerfectAntiPatternsPanel';

interface MisuseSectionProps {
  misuse: BrandMisuse[];
  onMisuseChange: (misuse: BrandMisuse[]) => void;
  customSubtitle?: string;
  onSubtitleChange?: (subtitle: string) => void;
  entityId?: string;
  entityType?: 'brand' | 'product' | 'event';
  brandSlug?: string;
}

export const MisuseSection = ({ misuse, onMisuseChange, customSubtitle, onSubtitleChange, entityId, entityType = 'brand', brandSlug }: MisuseSectionProps) => {
  const isTransPerfect = brandSlug?.toLowerCase() === 'transperfect';
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isHeaderEditing, setIsHeaderEditing] = useState(false);
  const { uploadFile, isUploading } = useStorageUpload({ entityType, entityId });

  const handleFileDrop = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    let url: string;

    if (entityId) {
      const result = await uploadFile(file, 'asset', `misuse-${crypto.randomUUID()}`);
      if (!result) return;
      url = result.url;
    } else {
      // Fallback for unsaved entities - small images only
      const reader = new FileReader();
      url = await new Promise((resolve) => {
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.readAsDataURL(file);
      });
    }

    const newMisuse: BrandMisuse = {
      id: crypto.randomUUID(),
      url,
      description: 'Describe why this is incorrect usage',
    };
    onMisuseChange([...misuse, newMisuse]);
    setEditingId(newMisuse.id);
  }, [misuse, onMisuseChange, entityId, uploadFile]);

  const handleLibrarySelect = useCallback((url: string) => {
    const newMisuse: BrandMisuse = {
      id: crypto.randomUUID(),
      url,
      description: 'Describe why this is incorrect usage',
    };
    onMisuseChange([...misuse, newMisuse]);
    setEditingId(newMisuse.id);
  }, [misuse, onMisuseChange]);

  const { isDragging, fileInputRef, dragHandlers, openFilePicker, handleInputChange } = useDropZone({
    onFileDrop: handleFileDrop,
    accept: 'image/*',
    multiple: true,
  });

  const updateMisuse = (id: string, updates: Partial<BrandMisuse>) => {
    onMisuseChange(misuse.map(m => m.id === id ? { ...m, ...updates } : m));
  };

  const deleteMisuse = (id: string) => {
    onMisuseChange(misuse.filter(m => m.id !== id));
    if (editingId === id) setEditingId(null);
  };

  // Determine if editing is allowed
  const canEdit = Boolean(onMisuseChange);

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
        {canEdit && (
          <div className="flex items-center gap-2 shrink-0">
            <ImageLibraryPicker
              onSelect={handleLibrarySelect}
              trigger={
                <Button variant="outline" size="sm" className="gap-2">
                  <FolderOpen className="h-4 w-4" />
                  Library
                </Button>
              }
              defaultCategory="Logos"
            />
            <Button onClick={openFilePicker} size="sm" variant="destructive" className="gap-2">
              <Upload className="h-4 w-4" />
              Add Example
            </Button>
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleInputChange}
        className="hidden"
      />

      <div 
        className={`bg-destructive/5 border-2 border-dashed rounded-xl p-6 transition-colors ${
          isDragging ? 'border-destructive bg-destructive/10' : 'border-destructive/30'
        }`}
        {...dragHandlers}
      >
        <div className="flex items-center gap-3 mb-6">
          <AlertTriangle className="h-6 w-6 text-destructive" />
          <div>
            <h3 className="font-semibold text-destructive">Logo Misuse Examples</h3>
            <p className="text-sm text-muted-foreground">
              {isDragging ? 'Drop image to add misuse example' : 'Document incorrect usage to protect brand integrity'}
            </p>
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
                <OptimizedImage src={item.url} alt={item.description} className="w-full h-full" objectFit="cover" />
                <div className="absolute inset-0 bg-destructive/20" />
                <div className="absolute top-2 left-2 bg-destructive text-destructive-foreground text-xs font-bold px-2 py-1 rounded">
                  ✕ DON'T
                </div>
                {canEdit && (
                  <button
                    onClick={() => deleteMisuse(item.id)}
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-background/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive hover:text-destructive-foreground"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
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
                    className={`text-sm text-muted-foreground ${canEdit ? 'cursor-pointer hover:text-foreground' : ''}`}
                    onClick={() => canEdit && setEditingId(item.id)}
                  >
                    {item.description}
                  </p>
                )}
              </div>
            </div>
          ))}

          {canEdit && (
            <button
              onClick={openFilePicker}
              onDragOver={dragHandlers.onDragOver}
              onDragLeave={dragHandlers.onDragLeave}
              onDrop={dragHandlers.onDrop}
              className={`aspect-video border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-2 transition-colors ${
                isDragging 
                  ? 'border-destructive bg-destructive/10 text-destructive' 
                  : 'border-red-300 text-red-400 hover:bg-red-50'
              }`}
            >
              <Plus className="h-6 w-6" />
              <span className="text-sm font-medium">{isDragging ? 'Drop to add' : 'Add misuse example'}</span>
            </button>
          )}
        </div>
      </div>
    </section>
  );
};
