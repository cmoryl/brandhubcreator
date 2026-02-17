import { useState, useRef } from 'react';
import { Upload, Link, Image, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ImageLibraryPicker } from '@/components/ui/ImageLibraryPicker';
import { useStorageUpload } from '@/hooks/useStorageUpload';
import { cn } from '@/lib/utils';

interface EventInfoCardImagePickerProps {
  label: string;
  currentImage?: string;
  onImageChange: (url: string | undefined) => void;
  entityId?: string;
}

export const EventInfoCardImagePicker = ({
  label,
  currentImage,
  onImageChange,
  entityId,
}: EventInfoCardImagePickerProps) => {
  const [mode, setMode] = useState<'upload' | 'url' | 'library'>('upload');
  const [urlInput, setUrlInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadFile, isUploading } = useStorageUpload({ entityType: 'event', entityId });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const result = await uploadFile(file, 'asset', `card-${label.toLowerCase().replace(/\s+/g, '-')}`);
    if (result) {
      onImageChange(result.url);
    }
  };

  const handleUrlSubmit = () => {
    if (urlInput.trim()) {
      onImageChange(urlInput.trim());
      setUrlInput('');
    }
  };

  return (
    <div className="space-y-2">
      <Label className="text-xs">{label} Card Image</Label>
      {currentImage && (
        <div className="relative w-full h-20 rounded-lg overflow-hidden border bg-muted">
          <img src={currentImage} alt={`${label} card`} className="w-full h-full object-cover" />
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute top-1 right-1 h-5 w-5"
            onClick={() => onImageChange(undefined)}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}
      <Tabs value={mode} onValueChange={(v) => setMode(v as typeof mode)} className="w-full">
        <TabsList className="grid w-full grid-cols-3 h-8">
          <TabsTrigger value="upload" className="text-[10px] gap-1">
            <Upload className="h-3 w-3" />
            Upload
          </TabsTrigger>
          <TabsTrigger value="url" className="text-[10px] gap-1">
            <Link className="h-3 w-3" />
            URL
          </TabsTrigger>
          <TabsTrigger value="library" className="text-[10px] gap-1">
            <Image className="h-3 w-3" />
            Library
          </TabsTrigger>
        </TabsList>
        <TabsContent value="upload" className="mt-1">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full text-xs h-8"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
          >
            {isUploading ? 'Uploading...' : 'Choose File'}
          </Button>
        </TabsContent>
        <TabsContent value="url" className="mt-1">
          <div className="flex gap-1">
            <Input
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="https://..."
              className="h-8 text-xs"
              onKeyDown={(e) => e.key === 'Enter' && handleUrlSubmit()}
            />
            <Button type="button" size="sm" className="h-8 text-xs px-2" onClick={handleUrlSubmit}>
              Set
            </Button>
          </div>
        </TabsContent>
        <TabsContent value="library" className="mt-1">
          <ImageLibraryPicker
            onSelect={(url) => onImageChange(url)}
            trigger={
              <Button type="button" variant="outline" size="sm" className="w-full text-xs h-8 gap-1">
                <Image className="h-3 w-3" />
                Pick from Library
              </Button>
            }
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};
