import { useState, useRef, useEffect } from 'react';
import { Sparkles, Link2, Upload, Loader2, Image as ImageIcon, X, FileText, FileImage } from 'lucide-react';
import { EventSignage } from '@/types/event';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Progress } from '@/components/ui/progress';
import { useStorageUpload } from '@/hooks/useStorageUpload';

interface EditSignageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  signage: EventSignage;
  onSave: (signage: EventSignage) => void;
  onDelete: (id: string) => void;
  brandName?: string;
  brandColors?: string[];
  eventId?: string;
}

const SIGNAGE_TYPES = [
  { value: 'booth-backdrop', label: 'Booth Backdrop' },
  { value: 'pull-up-banner', label: 'Pull-Up Banner' },
  { value: 'table-banner', label: 'Table Banner' },
  { value: 'hanging-sign', label: 'Hanging Sign' },
  { value: 'floor-graphic', label: 'Floor Graphic' },
  { value: 'directional', label: 'Directional Sign' },
  { value: 'podium-sign', label: 'Podium Sign' },
  { value: 'stage-backdrop', label: 'Stage Backdrop' },
  { value: 'outdoor-banner', label: 'Outdoor Banner' },
  { value: 'other', label: 'Other' },
];

type PreviewMode = 'current' | 'generate' | 'upload' | 'url';
type GenerationStyle = 'photorealistic' | 'venue' | 'mockup';

interface UploadedFile {
  data: string;
  name: string;
  type: string;
}

export const EditSignageDialog = ({
  open,
  onOpenChange,
  signage,
  onSave,
  onDelete,
  brandName,
  brandColors,
  eventId,
}: EditSignageDialogProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const templateInputRef = useRef<HTMLInputElement>(null);
  
  // Storage upload for persistent image storage
  const { uploadFile, isUploading: isStorageUploading, uploadProgress } = useStorageUpload({
    entityType: 'event',
    entityId: eventId,
  });
  
  const [previewMode, setPreviewMode] = useState<PreviewMode>('current');
  const [generationStyle, setGenerationStyle] = useState<GenerationStyle>('photorealistic');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPreview, setGeneratedPreview] = useState<string | null>(null);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string>('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [templateFile, setTemplateFile] = useState<UploadedFile | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  
  const [editedItem, setEditedItem] = useState<EventSignage>(signage);

  // Reset form when signage changes
  useEffect(() => {
    setEditedItem(signage);
    setGeneratedPreview(null);
    setUploadedImage(null);
    setUploadedFileName('');
    setUploadedFile(null);
    setTemplateFile(null);
    setPreviewMode(signage.previewUrl ? 'current' : 'generate');
    setConfirmDelete(false);
  }, [signage, open]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image must be under 10MB');
      return;
    }

    setUploadedFileName(file.name);
    setUploadedFile(file);
    
    // Create preview URL for display
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setUploadedImage(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleTemplateUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isImage = file.type.startsWith('image/');
    const isPdf = file.type === 'application/pdf';
    
    if (!isImage && !isPdf) {
      toast.error('Please upload an image or PDF file');
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      toast.error('Template must be under 15MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setTemplateFile({
        data: base64,
        name: file.name,
        type: file.type,
      });
      toast.success('Template reference added');
    };
    reader.readAsDataURL(file);
  };

  const clearTemplateFile = () => {
    setTemplateFile(null);
    if (templateInputRef.current) {
      templateInputRef.current.value = '';
    }
  };

  const clearUploadedImage = () => {
    setUploadedImage(null);
    setUploadedFileName('');
    setUploadedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const generatePreview = async (fromUpload = false) => {
    if (!editedItem.name || !editedItem.dimensions) {
      toast.error('Please enter name and dimensions first');
      return;
    }

    setIsGenerating(true);
    try {
      const payload: any = {
        signageType: editedItem.type,
        signageName: editedItem.name,
        dimensions: editedItem.dimensions,
        brandName,
        brandColors,
        style: generationStyle,
      };

      if (fromUpload && uploadedImage) {
        payload.referenceImage = uploadedImage;
      }

      if (templateFile) {
        payload.templateReference = {
          data: templateFile.data,
          type: templateFile.type,
          name: templateFile.name,
        };
      }

      const { data, error } = await supabase.functions.invoke('generate-signage-preview', {
        body: payload,
      });

      if (error) throw error;
      if (data?.error) {
        if (data.error.includes('Rate limit')) {
          toast.error('Rate limit reached. Please try again in a moment.');
        } else if (data.error.includes('credits')) {
          toast.error('AI credits exhausted. Please add credits to continue.');
        } else {
          throw new Error(data.error);
        }
        return;
      }

      if (data?.imageUrl) {
        setGeneratedPreview(data.imageUrl);
        toast.success('New preview generated!');
      }
    } catch (error) {
      console.error('Failed to generate preview:', error);
      toast.error('Failed to generate preview. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!editedItem.name || !editedItem.dimensions) return;

    let finalPreviewUrl = editedItem.previewUrl;
    
    if (generatedPreview) {
      finalPreviewUrl = generatedPreview;
    } else if (previewMode === 'upload' && uploadedFile && eventId) {
      // Upload directly to storage for persistent URL
      const result = await uploadFile(uploadedFile, 'asset', `signage-${editedItem.name?.replace(/\s+/g, '-').toLowerCase()}`);
      if (result) {
        finalPreviewUrl = result.url;
      } else {
        // Fallback to base64 if storage upload fails
        finalPreviewUrl = uploadedImage || editedItem.previewUrl;
      }
    } else if (previewMode === 'upload' && uploadedImage) {
      // No eventId available, use base64 as fallback
      finalPreviewUrl = uploadedImage;
    }

    const updatedItem: EventSignage = {
      ...editedItem,
      previewUrl: finalPreviewUrl,
    };

    onSave(updatedItem);
    onOpenChange(false);
  };

  const handleDeleteClick = () => {
    if (confirmDelete) {
      onDelete(signage.id);
      onOpenChange(false);
    } else {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 3000);
    }
  };

  const styleOptions: { value: GenerationStyle; label: string; description: string }[] = [
    { value: 'photorealistic', label: 'Photorealistic', description: 'Studio-quality shot' },
    { value: 'venue', label: 'In Venue', description: 'Trade show setting' },
    { value: 'mockup', label: 'Clean Mockup', description: 'Template-style' },
  ];

  const canSave = editedItem.name && editedItem.dimensions;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Signage</DialogTitle>
          <DialogDescription>
            Update signage details or regenerate the preview
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 pt-2">
          {/* Name and Type */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={editedItem.name || ''}
                onChange={(e) => setEditedItem({ ...editedItem, name: e.target.value })}
                placeholder="Main Booth Backdrop"
              />
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select
                value={editedItem.type}
                onValueChange={(value) => setEditedItem({ ...editedItem, type: value as EventSignage['type'] })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SIGNAGE_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Dimensions */}
          <div className="space-y-2">
            <Label>Dimensions</Label>
            <Input
              value={editedItem.dimensions || ''}
              onChange={(e) => setEditedItem({ ...editedItem, dimensions: e.target.value })}
              placeholder="10ft x 8ft"
            />
          </div>

          {/* Preview Image Section */}
          <div className="space-y-3">
            <Label>Preview Image</Label>
            
            {/* Current Preview */}
            {editedItem.previewUrl && !generatedPreview && (
              <div className="relative">
                <img
                  src={editedItem.previewUrl}
                  alt={editedItem.name}
                  className="w-full h-32 object-cover rounded-lg border"
                />
                <div className="absolute top-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                  Current Preview
                </div>
              </div>
            )}

            {/* Generated Preview */}
            {generatedPreview && (
              <div className="relative">
                <img
                  src={generatedPreview}
                  alt="New Preview"
                  className="w-full h-32 object-cover rounded-lg border"
                />
                <div className="absolute top-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                  <Sparkles className="h-3 w-3" />
                  New AI Preview
                </div>
                <button
                  type="button"
                  onClick={() => setGeneratedPreview(null)}
                  className="absolute top-2 right-2 p-1 bg-black/60 rounded-full hover:bg-black/80 transition-colors"
                >
                  <X className="h-4 w-4 text-white" />
                </button>
              </div>
            )}

            {/* Mode Tabs */}
            <div className="flex rounded-lg border bg-muted/50 p-1">
              <button
                type="button"
                onClick={() => setPreviewMode('generate')}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md text-xs font-medium transition-colors",
                  previewMode === 'generate' 
                    ? "bg-background shadow-sm text-foreground" 
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Sparkles className="h-3.5 w-3.5" />
                Regenerate
              </button>
              <button
                type="button"
                onClick={() => setPreviewMode('upload')}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md text-xs font-medium transition-colors",
                  previewMode === 'upload' 
                    ? "bg-background shadow-sm text-foreground" 
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Upload className="h-3.5 w-3.5" />
                Upload
              </button>
              <button
                type="button"
                onClick={() => setPreviewMode('url')}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md text-xs font-medium transition-colors",
                  previewMode === 'url' 
                    ? "bg-background shadow-sm text-foreground" 
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Link2 className="h-3.5 w-3.5" />
                URL
              </button>
            </div>

            {/* Regenerate Mode */}
            {previewMode === 'generate' && (
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-2">
                  {styleOptions.map((style) => (
                    <button
                      key={style.value}
                      type="button"
                      onClick={() => setGenerationStyle(style.value)}
                      className={cn(
                        "p-2 rounded-lg border text-left transition-all",
                        generationStyle === style.value
                          ? "border-primary bg-primary/5 ring-1 ring-primary"
                          : "border-border hover:border-primary/50"
                      )}
                    >
                      <div className="font-medium text-xs">{style.label}</div>
                      <div className="text-[10px] text-muted-foreground">{style.description}</div>
                    </button>
                  ))}
                </div>

                {/* Template Reference */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Template Reference (optional)</span>
                    {templateFile && (
                      <button
                        type="button"
                        onClick={clearTemplateFile}
                        className="text-xs text-muted-foreground hover:text-destructive"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  
                  {!templateFile ? (
                    <label className="flex items-center gap-2 p-2 border border-dashed rounded-lg cursor-pointer hover:border-primary/50 text-xs">
                      <FileImage className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Upload template (PDF/image)</span>
                      <input
                        ref={templateInputRef}
                        type="file"
                        className="hidden"
                        accept="image/*,.pdf"
                        onChange={handleTemplateUpload}
                      />
                    </label>
                  ) : (
                    <div className="flex items-center gap-2 p-2 border rounded-lg bg-muted/30 text-xs">
                      {templateFile.type === 'application/pdf' ? (
                        <FileText className="h-4 w-4 text-primary" />
                      ) : (
                        <FileImage className="h-4 w-4 text-primary" />
                      )}
                      <span className="truncate flex-1">{templateFile.name}</span>
                      <button onClick={clearTemplateFile}>
                        <X className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                      </button>
                    </div>
                  )}
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full"
                  disabled={!canSave || isGenerating}
                  onClick={() => generatePreview(false)}
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Regenerate Preview
                    </>
                  )}
                </Button>
              </div>
            )}

            {/* Upload Mode */}
            {previewMode === 'upload' && (
              <div className="space-y-2">
                {!uploadedImage ? (
                  <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-lg cursor-pointer hover:border-primary/50">
                    <Upload className="h-6 w-6 text-muted-foreground mb-1" />
                    <p className="text-xs text-muted-foreground">Upload new image</p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleFileUpload}
                    />
                  </label>
                ) : (
                  <div className="relative">
                    <img
                      src={uploadedImage}
                      alt="Uploaded"
                      className="w-full h-24 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={clearUploadedImage}
                      className="absolute top-2 right-2 p-1 bg-black/60 rounded-full hover:bg-black/80"
                    >
                      <X className="h-4 w-4 text-white" />
                    </button>
                  </div>
                )}

                {uploadedImage && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full"
                    disabled={isGenerating}
                    onClick={() => generatePreview(true)}
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Enhancing...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Enhance with AI
                      </>
                    )}
                  </Button>
                )}
              </div>
            )}

            {/* URL Mode */}
            {previewMode === 'url' && (
              <Input
                value={editedItem.previewUrl || ''}
                onChange={(e) => setEditedItem({ ...editedItem, previewUrl: e.target.value })}
                placeholder="https://..."
                className="text-sm"
              />
            )}

            {isGenerating && (
              <Progress value={undefined} className="h-1" />
            )}
          </div>

          {/* Template URL */}
          <div className="space-y-2">
            <Label>Template URL (optional)</Label>
            <Input
              value={editedItem.templateUrl || ''}
              onChange={(e) => setEditedItem({ ...editedItem, templateUrl: e.target.value })}
              placeholder="https://..."
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label>Notes / Specifications (optional)</Label>
            <Textarea
              value={editedItem.notes || ''}
              onChange={(e) => setEditedItem({ ...editedItem, notes: e.target.value })}
              placeholder="Material, installation notes, vendor details..."
              rows={2}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              variant={confirmDelete ? "destructive" : "outline"}
              onClick={handleDeleteClick}
              disabled={isStorageUploading}
              className="flex-shrink-0"
            >
              {confirmDelete ? 'Confirm Delete' : 'Delete'}
            </Button>
            <Button
              onClick={handleSave}
              disabled={!canSave || isStorageUploading}
              className="flex-1"
            >
              {isStorageUploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading... {uploadProgress}%
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
