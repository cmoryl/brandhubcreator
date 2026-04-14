/**
 * SearchByImageUpload - Upload an image to find visually similar stock imagery
 * Uses Shutterstock's reverse image search (CV similar images API)
 */
import { useState, useCallback, useRef } from 'react';
import { Upload, ImageIcon, X, Loader2, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SearchByImageUploadProps {
  onResults: (results: any[], totalCount: number) => void;
  onLoading: (loading: boolean) => void;
}

export const SearchByImageUpload = ({ onResults, onLoading }: SearchByImageUploadProps) => {
  const [preview, setPreview] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const processFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file (JPG, PNG, WebP)');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be under 5MB');
      return;
    }

    // Convert to base64
    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = e.target?.result as string;
      setPreview(base64);
      setSearching(true);
      onLoading(true);

      try {
        const { data, error } = await supabase.functions.invoke('shutterstock-search', {
          body: { action: 'reverse_image', base64Image: base64, per_page: 24 },
        });
        if (error) throw error;
        if (data?.error) throw new Error(data.error);
        onResults(data.results || [], data.totalCount || 0);
        toast.success(`Found ${data.totalCount || 0} similar images`);
      } catch (err: any) {
        console.error('Reverse image search error:', err);
        toast.error(err.message || 'Failed to search by image');
      } finally {
        setSearching(false);
        onLoading(false);
      }
    };
    reader.readAsDataURL(file);
  }, [onResults, onLoading]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, [processFile]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  }, [processFile]);

  const clearPreview = useCallback(() => {
    setPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  return (
    <div className="space-y-2">
      {preview ? (
        <div className="relative inline-block">
          <img src={preview} alt="Search reference" className="h-20 w-20 object-cover rounded-lg border border-border" />
          <Button
            variant="secondary"
            size="icon"
            className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full"
            onClick={clearPreview}
          >
            <X className="h-3 w-3" />
          </Button>
          {searching && (
            <div className="absolute inset-0 bg-background/60 backdrop-blur-sm rounded-lg flex items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            </div>
          )}
        </div>
      ) : (
        <div
          ref={dropRef}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            'flex items-center gap-3 p-3 rounded-lg border-2 border-dashed cursor-pointer transition-all',
            dragOver
              ? 'border-primary bg-primary/5'
              : 'border-border hover:border-muted-foreground/40 hover:bg-muted/30'
          )}
        >
          <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
            <Camera className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground">Search by Image</p>
            <p className="text-xs text-muted-foreground">Drop an image or click to upload — find visually similar stock photos</p>
          </div>
        </div>
      )}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFileSelect}
      />
    </div>
  );
};
