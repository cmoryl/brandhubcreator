import { useState, useCallback } from 'react';
import { Upload, Download, Package, Maximize2, Sparkles, Loader2, Grid, LayoutList } from 'lucide-react';
import { BrandPattern, BrandColor } from '@/types/brand';
import { Button } from '@/components/ui/button';
import { SectionHeader } from '@/components/brand/SectionHeader';
import { toast } from 'sonner';
import { useDropZone } from '@/components/ui/drop-zone';
import { supabase } from '@/integrations/supabase/client';
import { PatternPreviewModal } from '@/components/brand/PatternPreviewModal';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { useSaveToLibrary } from '@/hooks/useSaveToLibrary';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface EventPatternsSectionProps {
  patterns: BrandPattern[];
  onPatternsChange?: (patterns: BrandPattern[]) => void;
  isEditable?: boolean;
  // Event context for AI generation
  eventName?: string;
  eventColors?: BrandColor[];
  eventTagline?: string;
}

const RESOLUTION_OPTIONS = [
  { label: '512 × 512', value: '512', size: 512 },
  { label: '1024 × 1024', value: '1024', size: 1024 },
  { label: '2048 × 2048', value: '2048', size: 2048 },
  { label: '4096 × 4096 (4K)', value: '4096', size: 4096 },
];

type ViewMode = 'panel' | 'grid';

export const EventPatternsSection = ({ 
  patterns, 
  onPatternsChange, 
  isEditable = false,
  eventName,
  eventColors,
  eventTagline
}: EventPatternsSectionProps) => {
  const [isHeaderEditing, setIsHeaderEditing] = useState(false);
  const [previewPattern, setPreviewPattern] = useState<BrandPattern | null>(null);
  const [downloadResolution, setDownloadResolution] = useState('1024');
  const [isGenerating, setIsGenerating] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('panel');
  const { saveToLibrary } = useSaveToLibrary();

  const generateAIPatterns = async () => {
    if (!eventColors || eventColors.length === 0) {
      toast.error('Add event colors first to generate patterns');
      return;
    }

    setIsGenerating(true);
    toast.info('Generating 4 event-specific geometric primitives...');

    try {
      const { data, error } = await supabase.functions.invoke('generate-brand-assets', {
        body: {
          type: 'patterns',
          brandContext: {
            name: eventName || 'Event',
            colors: eventColors.map(c => ({ hex: c.hex, name: c.name, role: c.role })),
            tagline: eventTagline,
          },
          count: 4
        }
      });

      if (error) throw error;

      if (data?.patterns && data.patterns.length > 0 && onPatternsChange) {
        const newPatterns: BrandPattern[] = [];
        
        // Save each generated pattern to the library and use the stored URL
        for (const p of data.patterns as Array<{ name: string; url: string }>) {
          const patternName = `${eventName || 'Event'} - ${p.name}`;
          
          // Save to organization image library
          const savedResult = await saveToLibrary(p.url, patternName, 'Backgrounds');
          
          if (savedResult) {
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
    if (!onPatternsChange) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      const dataUrl = event.target?.result as string;
      const fileName = file.name.replace(/\.[^/.]+$/, '');
      
      // Save to library first
      const savedResult = await saveToLibrary(dataUrl, `${eventName || 'Event'} - ${fileName}`, 'Backgrounds');
      
      const newPattern: BrandPattern = {
        id: crypto.randomUUID(),
        name: fileName,
        url: savedResult?.publicUrl || dataUrl,
      };
      onPatternsChange([...patterns, newPattern]);
      
      if (savedResult) {
        toast.success(`"${fileName}" saved to Image Library`);
      }
    };
    reader.readAsDataURL(file);
  }, [patterns, onPatternsChange, saveToLibrary, eventName]);

  const { isDragging, fileInputRef, dragHandlers, openFilePicker, handleInputChange } = useDropZone({
    onFileDrop: handleFileDrop,
    accept: 'image/*',
    multiple: true,
  });

  const deletePattern = (id: string) => {
    if (onPatternsChange) {
      onPatternsChange(patterns.filter(p => p.id !== id));
    }
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
          const patternCanvas = document.createElement('canvas');
          const patternCtx = patternCanvas.getContext('2d');
          if (!patternCtx) {
            reject(new Error('Pattern canvas not supported'));
            return;
          }
          
          patternCanvas.width = img.width;
          patternCanvas.height = img.height;
          patternCtx.drawImage(img, 0, 0);
          
          const canvasPattern = ctx.createPattern(patternCanvas, 'repeat');
          if (canvasPattern) {
            ctx.fillStyle = canvasPattern;
            ctx.fillRect(0, 0, resolution, resolution);
          } else {
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

  if (patterns.length === 0 && !isEditable) {
    return null;
  }

  return (
    <section className="space-y-4 sm:space-y-6">
      {/* Section header - always full width on its own row */}
      <SectionHeader
        title="Event Patterns"
        defaultSubtitle="Geometric primitives for event visual identity"
        isEditing={isHeaderEditing}
        onEditToggle={() => setIsHeaderEditing(!isHeaderEditing)}
      />
      
      {/* Controls row - separate from header */}
      <div className="flex items-center gap-2 flex-wrap">
          <ToggleGroup type="single" value={viewMode} onValueChange={(v) => v && setViewMode(v as ViewMode)}>
            <ToggleGroupItem value="panel" aria-label="Panel view" size="sm">
              <LayoutList className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="grid" aria-label="Grid view" size="sm">
              <Grid className="h-4 w-4" />
            </ToggleGroupItem>
          </ToggleGroup>
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
          {isEditable && (
            <>
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
              <Button onClick={openFilePicker} size="sm" className="gap-2">
                <Upload className="h-4 w-4" />
                Upload
              </Button>
            </>
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

      {/* Panel View - All patterns in a single scrollable row */}
      {viewMode === 'panel' && patterns.length > 0 && (
        <div 
          className={`flex gap-4 overflow-x-auto pb-4 ${isDragging ? 'ring-2 ring-primary ring-offset-2 rounded-xl' : ''}`}
          {...dragHandlers}
        >
          {patterns.map((pattern, index) => (
            <div
              key={pattern.id}
              className="group relative bg-card rounded-xl overflow-hidden shadow-sm border border-border animate-scale-in shrink-0 w-48"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div
                className="h-32 relative cursor-pointer"
                style={{ backgroundImage: `url(${pattern.url})`, backgroundSize: '64px 64px', backgroundRepeat: 'repeat' }}
                onClick={() => setPreviewPattern(pattern)}
              >
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
                  {isEditable && (
                    <button
                      onClick={(e) => { e.stopPropagation(); deletePattern(pattern.id); }}
                      className="p-1.5 rounded-full bg-background/80 backdrop-blur-sm hover:bg-destructive hover:text-destructive-foreground"
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>
              <div className="p-3">
                <h3 className="font-medium text-foreground text-sm truncate">{pattern.name}</h3>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Grid View - Traditional grid layout */}
      {viewMode === 'grid' && patterns.length > 0 && (
        <div 
          className={`grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 ${isDragging ? 'ring-2 ring-primary ring-offset-2 rounded-xl' : ''}`}
          {...dragHandlers}
        >
          {patterns.map((pattern, index) => (
            <div
              key={pattern.id}
              className="group relative bg-card rounded-xl overflow-hidden shadow-sm border border-border animate-scale-in"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div
                className="h-32 relative cursor-pointer"
                style={{ backgroundImage: `url(${pattern.url})`, backgroundSize: '64px 64px', backgroundRepeat: 'repeat' }}
                onClick={() => setPreviewPattern(pattern)}
              >
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
                  {isEditable && (
                    <button
                      onClick={(e) => { e.stopPropagation(); deletePattern(pattern.id); }}
                      className="p-1.5 rounded-full bg-background/80 backdrop-blur-sm hover:bg-destructive hover:text-destructive-foreground"
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>
              <div className="p-3">
                <h3 className="font-medium text-foreground text-sm truncate">{pattern.name}</h3>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {patterns.length === 0 && isEditable && (
        <button
          onClick={openFilePicker}
          className={`w-full h-48 border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-2 transition-colors ${
            isDragging 
              ? 'border-primary bg-primary/5 text-primary' 
              : 'border-border text-muted-foreground hover:border-accent hover:text-accent'
          }`}
          {...dragHandlers}
        >
          <Upload className="h-8 w-8" />
          <span className="text-sm font-medium">{isDragging ? 'Drop to upload' : 'Upload your first pattern'}</span>
        </button>
      )}

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

      <PatternPreviewModal
        pattern={previewPattern}
        open={!!previewPattern}
        onOpenChange={(open) => !open && setPreviewPattern(null)}
      />
    </section>
  );
};
