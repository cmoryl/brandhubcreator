import { useState, useCallback } from 'react';
import { X, Pencil, Upload, Download, Package, Maximize2, Sparkles, Loader2, FolderOpen, Shapes } from 'lucide-react';
import { useStorageUpload } from '@/hooks/useStorageUpload';
import { BrandPattern, BrandColor, LayoutPreset, CustomDesignShape } from '@/types/brand';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SectionHeader } from './SectionHeader';
import { LayoutSelector, useLayoutClasses } from './LayoutSelector';
import { toast } from 'sonner';
import { useDropZone } from '@/components/ui/drop-zone';
import { supabase } from '@/integrations/supabase/client';
import { PatternPreviewModal } from './PatternPreviewModal';
import { ImageLibraryPicker } from '@/components/ui/ImageLibraryPicker';
import { DesignElementsSection } from './DesignElementsSection';
import { useSaveToLibrary } from '@/hooks/useSaveToLibrary';
import { GeometricPrimitivesStudio } from './primitives/GeometricPrimitivesStudio';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface PatternsSectionProps {
  patterns: BrandPattern[];
  onPatternsChange: (patterns: BrandPattern[]) => void;
  customSubtitle?: string;
  onSubtitleChange?: (subtitle: string) => void;
  layout?: LayoutPreset;
  onLayoutChange?: (layout: LayoutPreset) => void;
  // Brand context for AI generation
  brandName?: string;
  brandColors?: BrandColor[];
  brandTagline?: string;
  brandArchetype?: string;
  brandSlug?: string;
  // Custom shapes
  customShapes?: CustomDesignShape[];
  onCustomShapesChange?: (shapes: CustomDesignShape[]) => void;
  entityId?: string;
  entityType?: 'brand' | 'product' | 'event';
}

const RESOLUTION_OPTIONS = [
  { label: '512 × 512', value: '512', size: 512 },
  { label: '1024 × 1024', value: '1024', size: 1024 },
  { label: '2048 × 2048', value: '2048', size: 2048 },
  { label: '4096 × 4096 (4K)', value: '4096', size: 4096 },
];

export const PatternsSection = ({ 
  patterns, 
  onPatternsChange, 
  customSubtitle, 
  onSubtitleChange, 
  layout = 'grid-3', 
  onLayoutChange,
  brandName,
  brandColors,
  brandTagline,
  brandArchetype,
  brandSlug,
  customShapes = [],
  onCustomShapesChange,
  entityId,
  entityType = 'brand',
}: PatternsSectionProps) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isHeaderEditing, setIsHeaderEditing] = useState(false);
  const [previewPattern, setPreviewPattern] = useState<BrandPattern | null>(null);
  const [downloadResolution, setDownloadResolution] = useState('1024');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPrimitivesStudio, setShowPrimitivesStudio] = useState(false);
  
  const { gridClass } = useLayoutClasses(layout);
  const { saveToLibrary } = useSaveToLibrary();
  const { uploadFile } = useStorageUpload({ entityType, entityId });

  const generateAIPatterns = async () => {
    if (!brandColors || brandColors.length === 0) {
      toast.error('Add brand colors first to generate patterns');
      return;
    }

    setIsGenerating(true);
    toast.info('Generating 4 brand-specific geometric primitives...');

    try {
      const { data, error } = await supabase.functions.invoke('generate-brand-assets', {
        body: {
          type: 'patterns',
          brandContext: {
            name: brandName || 'Brand',
            colors: brandColors.map(c => ({ hex: c.hex, name: c.name, role: c.role })),
            tagline: brandTagline,
            archetype: brandArchetype
          },
          count: 4
        }
      });

      if (error) throw error;

      if (data?.patterns && data.patterns.length > 0) {
        const newPatterns: BrandPattern[] = [];
        
        // Save each generated pattern to the library and use the stored URL
        for (const p of data.patterns as Array<{ name: string; url: string }>) {
          const patternName = `${brandName || 'Brand'} - ${p.name}`;
          
          // Save to organization image library
          const savedResult = await saveToLibrary(p.url, patternName, 'Backgrounds');
          
          if (savedResult) {
            // Use the stored URL from the library
            newPatterns.push({
              id: crypto.randomUUID(),
              name: p.name,
              url: savedResult.publicUrl
            });
          } else {
            // Fallback to base64 if storage fails
            newPatterns.push({
              id: crypto.randomUUID(),
              name: p.name,
              url: p.url
            });
          }
        }
        
        onPatternsChange([...patterns, ...newPatterns]);
        toast.success(`Generated ${newPatterns.length} patterns and saved to Image Library!`);
      } else {
        toast.error('No patterns were generated');
      }
    } catch (error) {
      console.error('Pattern generation error:', error);
      toast.error('Failed to generate patterns. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFileDrop = useCallback(async (file: File) => {
    const fileName = file.name.replace(/\.[^/.]+$/, '');
    
    let fileUrl: string;
    if (entityId) {
      const result = await uploadFile(file, 'asset', `pattern-${crypto.randomUUID()}`);
      if (!result) return;
      fileUrl = result.url;
    } else {
      // Fallback: save to library via base64 for unsaved entities
      const reader = new FileReader();
      const dataUrl = await new Promise<string>((resolve) => {
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.readAsDataURL(file);
      });
      const savedResult = await saveToLibrary(dataUrl, `${brandName || 'Brand'} - ${fileName}`, 'Backgrounds');
      fileUrl = savedResult?.publicUrl || dataUrl;
    }

    const newPattern: BrandPattern = {
      id: crypto.randomUUID(),
      name: fileName,
      url: fileUrl,
    };
    onPatternsChange([...patterns, newPattern]);
    toast.success(`"${fileName}" uploaded`);
  }, [patterns, onPatternsChange, saveToLibrary, brandName, entityId, uploadFile]);

  const handleLibrarySelect = useCallback((url: string) => {
    const urlParts = url.split('/');
    const fileName = urlParts[urlParts.length - 1]?.split('.')[0] || 'Library Pattern';
    const newPattern: BrandPattern = {
      id: crypto.randomUUID(),
      name: fileName,
      url,
    };
    onPatternsChange([...patterns, newPattern]);
  }, [patterns, onPatternsChange]);

  const { isDragging, fileInputRef, dragHandlers, openFilePicker, handleInputChange } = useDropZone({
    onFileDrop: handleFileDrop,
    accept: 'image/*',
    multiple: true,
  });

  const updatePattern = (id: string, updates: Partial<BrandPattern>) => {
    onPatternsChange(patterns.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const deletePattern = (id: string) => {
    onPatternsChange(patterns.filter(p => p.id !== id));
    if (editingId === id) setEditingId(null);
  };

  const downloadPatternHighRes = async (pattern: BrandPattern, resolution: number) => {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = resolution;
      canvas.height = resolution;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        toast.error('Canvas not supported');
        return;
      }

      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      await new Promise<void>((resolve, reject) => {
        img.onload = () => {
          // Tile the pattern across the canvas
          const patternCanvas = document.createElement('canvas');
          const patternCtx = patternCanvas.getContext('2d');
          if (!patternCtx) {
            reject(new Error('Pattern canvas not supported'));
            return;
          }
          
          // Use source dimensions for tiling
          patternCanvas.width = img.width;
          patternCanvas.height = img.height;
          patternCtx.drawImage(img, 0, 0);
          
          const canvasPattern = ctx.createPattern(patternCanvas, 'repeat');
          if (canvasPattern) {
            ctx.fillStyle = canvasPattern;
            ctx.fillRect(0, 0, resolution, resolution);
          } else {
            // Fallback: scale image to fill
            ctx.drawImage(img, 0, 0, resolution, resolution);
          }
          resolve();
        };
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = pattern.url;
      });

      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob(resolve, 'image/png', 1.0);
      });

      if (!blob) {
        toast.error('Failed to generate image');
        return;
      }

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${pattern.name}-${resolution}x${resolution}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success(`Downloaded ${pattern.name} at ${resolution}×${resolution}`);
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download pattern');
    }
  };

  const downloadPattern = (pattern: BrandPattern) => {
    const resolution = RESOLUTION_OPTIONS.find(r => r.value === downloadResolution)?.size || 1024;
    downloadPatternHighRes(pattern, resolution);
  };

  const downloadAllPatterns = async () => {
    if (patterns.length === 0) {
      toast.error('No patterns to download');
      return;
    }
    
    const resolution = RESOLUTION_OPTIONS.find(r => r.value === downloadResolution)?.size || 1024;
    toast.info(`Downloading ${patterns.length} patterns at ${resolution}×${resolution}...`);
    
    for (const pattern of patterns) {
      await downloadPatternHighRes(pattern, resolution);
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    toast.success(`Downloaded ${patterns.length} pattern(s)`);
  };

  return (
    <section className="space-y-4 sm:space-y-6">
      {/* Section header - always full width on its own row */}
      <SectionHeader
        title="Geometric Primitives"
        defaultSubtitle="Surface texture rules for visual continuity"
        customSubtitle={customSubtitle}
        onSubtitleChange={onSubtitleChange}
        isEditing={isHeaderEditing}
        onEditToggle={() => setIsHeaderEditing(!isHeaderEditing)}
      />
      
      {/* Controls row - separate from header */}
      <div className="flex items-center gap-2 flex-wrap">
          <Button 
            onClick={() => setShowPrimitivesStudio(true)} 
            variant="secondary" 
            size="sm" 
            className="gap-2"
          >
            <Shapes className="h-4 w-4" />
            Patterns Studio
          </Button>
          {onLayoutChange && (
            <LayoutSelector
              value={layout}
              onChange={onLayoutChange}
              availableLayouts={['grid-2', 'grid-3', 'grid-4', 'compact']}
              size="sm"
            />
          )}
          <Select value={downloadResolution} onValueChange={setDownloadResolution}>
            <SelectTrigger className="w-[140px] h-9">
              <SelectValue placeholder="Resolution" />
            </SelectTrigger>
            <SelectContent>
              {RESOLUTION_OPTIONS.map(opt => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {patterns.length > 0 && (
            <Button onClick={downloadAllPatterns} variant="outline" size="sm" className="gap-2">
              <Package className="h-4 w-4" />
              Download All
            </Button>
          )}
          <Button 
            onClick={generateAIPatterns} 
            size="sm" 
            variant="secondary"
            className="gap-2"
            disabled={isGenerating}
          >
            {isGenerating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            {isGenerating ? 'Generating...' : 'AI Generate'}
          </Button>
          <ImageLibraryPicker
            onSelect={handleLibrarySelect}
            trigger={
              <Button variant="outline" size="sm" className="gap-2">
                <FolderOpen className="h-4 w-4" />
                Library
              </Button>
            }
            defaultCategory="Backgrounds"
          />
          <Button onClick={openFilePicker} size="sm" className="gap-2">
            <Upload className="h-4 w-4" />
            Upload
          </Button>
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
            {/* Pattern preview - single tile */}
            <div
              className="h-32 relative cursor-pointer flex items-center justify-center bg-muted/30"
              onClick={() => setPreviewPattern(pattern)}
            >
              <img 
                src={pattern.url} 
                alt={pattern.name}
                className="w-24 h-24 object-contain rounded-lg shadow-sm"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                <Maximize2 className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
              </div>
              <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => { e.stopPropagation(); downloadPattern(pattern); }}
                  className="p-1.5 rounded-full bg-background/80 backdrop-blur-sm hover:bg-secondary"
                  title="Download"
                >
                  <Download className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); deletePattern(pattern.id); }}
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
                  <h3 className="font-medium text-foreground truncate">{pattern.name}</h3>
                  <button
                    onClick={() => setEditingId(pattern.id)}
                    className="p-1.5 rounded-md hover:bg-secondary transition-colors shrink-0"
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

      {/* Design Elements Library - Always Visible */}
      <div className="mt-8">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Design Elements Library</h3>
        </div>
        <div className="p-4 bg-muted/30 rounded-xl border border-border">
          <DesignElementsSection 
            canEdit={Boolean(onPatternsChange)} 
            brandColors={brandColors} 
            brandSlug={brandSlug}
            customShapes={customShapes}
            onCustomShapesChange={onCustomShapesChange}
            brandName={brandName}
          />
        </div>
      </div>

      {/* Pattern Preview Modal */}
      <PatternPreviewModal
        pattern={previewPattern}
        open={!!previewPattern}
        onOpenChange={(open) => !open && setPreviewPattern(null)}
      />

      {/* Seamless Patterns Studio */}
      <GeometricPrimitivesStudio
        open={showPrimitivesStudio}
        onOpenChange={setShowPrimitivesStudio}
        patterns={patterns}
        onPatternsChange={onPatternsChange}
        shapes={customShapes}
        onShapesChange={onCustomShapesChange}
        brandColors={brandColors || []}
        brandName={brandName}
      />
    </section>
  );
};
