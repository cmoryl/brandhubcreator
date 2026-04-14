/**
 * ImageryUploadZone - Drag-and-drop upload zone for custom imagery
 */
import { useState, useCallback, useRef } from 'react';
import { Upload, Loader2, ImagePlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { ApprovedImage } from '@/types/brand';
import { toast } from 'sonner';

const BUCKET_NAME = 'organization-assets';

interface ImageryUploadZoneProps {
  organizationId: string;
  entityId: string;
  sectionId: string;
  onImagesUploaded: (images: ApprovedImage[]) => void;
}

export const ImageryUploadZone = ({
  organizationId, entityId, sectionId, onImagesUploaded,
}: ImageryUploadZoneProps) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadCount, setUploadCount] = useState({ done: 0, total: 0 });
  const inputRef = useRef<HTMLInputElement>(null);

  const uploadFiles = useCallback(async (files: File[]) => {
    const imageFiles = files.filter(f => f.type.startsWith('image/'));
    if (imageFiles.length === 0) {
      toast.error('No image files found');
      return;
    }

    setIsUploading(true);
    setUploadCount({ done: 0, total: imageFiles.length });
    const uploadedImages: ApprovedImage[] = [];

    for (const file of imageFiles) {
      try {
        const timestamp = Date.now();
        const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
        const fileName = `upload-${timestamp}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
        const filePath = `${organizationId}/imagery/${entityId}/${sectionId}/${fileName}`;

        const { error } = await supabase.storage
          .from(BUCKET_NAME)
          .upload(filePath, file, { cacheControl: '3600', upsert: true });

        if (error) {
          console.error('Upload error:', error);
          continue;
        }

        const { data: urlData } = supabase.storage
          .from(BUCKET_NAME)
          .getPublicUrl(filePath);

        uploadedImages.push({
          id: crypto.randomUUID(),
          url: `${urlData.publicUrl}?t=${timestamp}`,
          thumbnailUrl: `${urlData.publicUrl}?t=${timestamp}`,
          title: file.name.replace(/\.[^/.]+$/, ''),
          source: 'upload',
          approvedAt: new Date().toISOString(),
          tags: [],
        });
      } catch (err) {
        console.error('Upload failed for', file.name, err);
      }
      setUploadCount(prev => ({ ...prev, done: prev.done + 1 }));
    }

    if (uploadedImages.length > 0) {
      onImagesUploaded(uploadedImages);
      toast.success(`Uploaded ${uploadedImages.length} image(s)`);
    }

    setIsUploading(false);
    setUploadCount({ done: 0, total: 0 });
  }, [organizationId, entityId, sectionId, onImagesUploaded]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    uploadFiles(files);
  }, [uploadFiles]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    uploadFiles(files);
    if (inputRef.current) inputRef.current.value = '';
  }, [uploadFiles]);

  return (
    <div
      className={cn(
        'border-2 border-dashed rounded-lg p-4 transition-colors text-center',
        isDragOver ? 'border-primary bg-primary/5' : 'border-muted-foreground/20 hover:border-muted-foreground/40',
        isUploading && 'opacity-70 pointer-events-none'
      )}
      onDragOver={e => { e.preventDefault(); setIsDragOver(true); }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={handleDrop}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFileSelect}
      />
      {isUploading ? (
        <div className="flex items-center justify-center gap-2 py-2">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          <span className="text-sm text-muted-foreground">
            Uploading {uploadCount.done}/{uploadCount.total}...
          </span>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-1.5 py-1">
          <Upload className="h-5 w-5 text-muted-foreground/50" />
          <p className="text-xs text-muted-foreground">
            Drop images here or{' '}
            <button
              className="text-primary hover:underline font-medium"
              onClick={() => inputRef.current?.click()}
            >
              browse
            </button>
          </p>
        </div>
      )}
    </div>
  );
};
