import { useState, useRef } from 'react';
import { Plus, Sparkles, Link2, Upload, Loader2, Image as ImageIcon, X } from 'lucide-react';
import { EventSignage } from '@/types/event';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Progress } from '@/components/ui/progress';

interface AddSignageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (signage: EventSignage) => void;
  brandName?: string;
  brandColors?: string[];
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

type PreviewMode = 'generate' | 'upload' | 'url';
type GenerationStyle = 'photorealistic' | 'venue' | 'mockup';

export const AddSignageDialog = ({
  open,
  onOpenChange,
  onAdd,
  brandName,
  brandColors,
}: AddSignageDialogProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewMode, setPreviewMode] = useState<PreviewMode>('generate');
  const [generationStyle, setGenerationStyle] = useState<GenerationStyle>('photorealistic');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPreview, setGeneratedPreview] = useState<string | null>(null);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string>('');
  
  const [newItem, setNewItem] = useState<Partial<EventSignage>>({
    name: '',
    type: 'booth-backdrop',
    dimensions: '',
    notes: '',
    previewUrl: '',
    templateUrl: '',
  });

  const resetForm = () => {
    setNewItem({ name: '', type: 'booth-backdrop', dimensions: '', notes: '', previewUrl: '', templateUrl: '' });
    setGeneratedPreview(null);
    setUploadedImage(null);
    setUploadedFileName('');
    setPreviewMode('generate');
  };

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
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setUploadedImage(base64);
    };
    reader.readAsDataURL(file);
  };

  const clearUploadedImage = () => {
    setUploadedImage(null);
    setUploadedFileName('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const generatePreview = async (fromUpload = false) => {
    if (!newItem.name || !newItem.dimensions) {
      toast.error('Please enter name and dimensions first');
      return;
    }

    setIsGenerating(true);
    try {
      const payload: any = {
        signageType: newItem.type,
        signageName: newItem.name,
        dimensions: newItem.dimensions,
        brandName,
        brandColors,
        style: generationStyle,
      };

      // If generating from uploaded image, include base64
      if (fromUpload && uploadedImage) {
        payload.referenceImage = uploadedImage;
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
        toast.success('Preview generated successfully!');
      }
    } catch (error) {
      console.error('Failed to generate preview:', error);
      toast.error('Failed to generate preview. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAdd = (withPreview = false) => {
    if (!newItem.name || !newItem.dimensions) return;

    let finalPreviewUrl = newItem.previewUrl;
    
    if (withPreview && generatedPreview) {
      finalPreviewUrl = generatedPreview;
    } else if (previewMode === 'upload' && uploadedImage && !generatedPreview) {
      // Use the uploaded image directly if no AI generation was done
      finalPreviewUrl = uploadedImage;
    }

    const item: EventSignage = {
      id: crypto.randomUUID(),
      name: newItem.name,
      type: newItem.type as EventSignage['type'],
      dimensions: newItem.dimensions,
      previewUrl: finalPreviewUrl,
      templateUrl: newItem.templateUrl,
      notes: newItem.notes,
      specifications: newItem.specifications,
    };

    onAdd(item);
    resetForm();
    onOpenChange(false);
  };

  const styleOptions: { value: GenerationStyle; label: string; description: string }[] = [
    { value: 'photorealistic', label: 'Photorealistic', description: 'Studio-quality product shot' },
    { value: 'venue', label: 'In Venue', description: 'Trade show setting with atmosphere' },
    { value: 'mockup', label: 'Clean Mockup', description: 'Minimal template-style preview' },
  ];

  const canGenerate = newItem.name && newItem.dimensions;
  const hasGeneratedOrUploaded = generatedPreview || uploadedImage;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) resetForm();
      onOpenChange(isOpen);
    }}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Signage
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Event Signage</DialogTitle>
          <DialogDescription>
            Add booth backdrops, banners, and other physical signage with optional AI-generated previews
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 pt-2">
          {/* Name and Type */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={newItem.name || ''}
                onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                placeholder="Main Booth Backdrop"
              />
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select
                value={newItem.type}
                onValueChange={(value) => setNewItem({ ...newItem, type: value as EventSignage['type'] })}
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
              value={newItem.dimensions || ''}
              onChange={(e) => setNewItem({ ...newItem, dimensions: e.target.value })}
              placeholder="10ft x 8ft"
            />
          </div>

          {/* Preview Image Section */}
          <div className="space-y-3">
            <Label>Preview Image</Label>
            
            {/* Mode Tabs */}
            <div className="flex rounded-lg border bg-muted/50 p-1">
              <button
                type="button"
                onClick={() => setPreviewMode('generate')}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-colors",
                  previewMode === 'generate' 
                    ? "bg-background shadow-sm text-foreground" 
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Sparkles className="h-4 w-4" />
                AI Generate
              </button>
              <button
                type="button"
                onClick={() => setPreviewMode('upload')}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-colors",
                  previewMode === 'upload' 
                    ? "bg-background shadow-sm text-foreground" 
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Upload className="h-4 w-4" />
                Upload & Enhance
              </button>
              <button
                type="button"
                onClick={() => setPreviewMode('url')}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-colors",
                  previewMode === 'url' 
                    ? "bg-background shadow-sm text-foreground" 
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Link2 className="h-4 w-4" />
                URL
              </button>
            </div>

            {/* AI Generate Mode */}
            {previewMode === 'generate' && (
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground">
                  Generate a hyper-realistic preview image using AI
                </p>
                
                {/* Style Options */}
                <div className="grid grid-cols-3 gap-2">
                  {styleOptions.map((style) => (
                    <button
                      key={style.value}
                      type="button"
                      onClick={() => setGenerationStyle(style.value)}
                      className={cn(
                        "p-3 rounded-lg border text-left transition-all",
                        generationStyle === style.value
                          ? "border-primary bg-primary/5 ring-1 ring-primary"
                          : "border-border hover:border-primary/50"
                      )}
                    >
                      <div className="font-medium text-sm">{style.label}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{style.description}</div>
                    </button>
                  ))}
                </div>

                {/* Generate Button */}
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  disabled={!canGenerate || isGenerating}
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
                      Generate Preview
                    </>
                  )}
                </Button>
              </div>
            )}

            {/* Upload & Enhance Mode */}
            {previewMode === 'upload' && (
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground">
                  Upload a booth photo or screen grab and AI will enhance it into a professional preview
                </p>

                {/* Upload Area */}
                {!uploadedImage ? (
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:border-primary/50 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">
                        Click to upload booth image
                      </p>
                      <p className="text-xs text-muted-foreground/70 mt-1">
                        PNG, JPG up to 10MB
                      </p>
                    </div>
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
                      alt="Uploaded booth"
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={clearUploadedImage}
                      className="absolute top-2 right-2 p-1 bg-black/60 rounded-full hover:bg-black/80 transition-colors"
                    >
                      <X className="h-4 w-4 text-white" />
                    </button>
                    <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                      {uploadedFileName}
                    </div>
                  </div>
                )}

                {/* Style Options for Upload */}
                {uploadedImage && (
                  <>
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
                        </button>
                      ))}
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      disabled={!canGenerate || isGenerating}
                      onClick={() => generatePreview(true)}
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Enhancing with AI...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4 mr-2" />
                          Enhance with AI
                        </>
                      )}
                    </Button>
                  </>
                )}
              </div>
            )}

            {/* URL Mode */}
            {previewMode === 'url' && (
              <Input
                value={newItem.previewUrl || ''}
                onChange={(e) => setNewItem({ ...newItem, previewUrl: e.target.value })}
                placeholder="https://..."
              />
            )}

            {/* Generated Preview Display */}
            {generatedPreview && (
              <div className="relative mt-3">
                <img
                  src={generatedPreview}
                  alt="AI Generated Preview"
                  className="w-full h-40 object-cover rounded-lg border"
                />
                <div className="absolute top-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                  <Sparkles className="h-3 w-3" />
                  AI Generated
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

            {/* Generation Progress */}
            {isGenerating && (
              <div className="space-y-2">
                <Progress value={undefined} className="h-1" />
                <p className="text-xs text-center text-muted-foreground">
                  {previewMode === 'upload' ? 'Enhancing your image...' : 'Creating your preview...'}
                </p>
              </div>
            )}
          </div>

          {/* Template URL */}
          <div className="space-y-2">
            <Label>Template URL (optional)</Label>
            <Input
              value={newItem.templateUrl || ''}
              onChange={(e) => setNewItem({ ...newItem, templateUrl: e.target.value })}
              placeholder="https://..."
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label>Notes / Specifications (optional)</Label>
            <Textarea
              value={newItem.notes || ''}
              onChange={(e) => setNewItem({ ...newItem, notes: e.target.value })}
              placeholder="Material, installation notes, vendor details..."
              rows={3}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => handleAdd(false)}
              disabled={!newItem.name || !newItem.dimensions}
              className="flex-1"
            >
              Add Without Preview
            </Button>
            <Button
              onClick={() => handleAdd(true)}
              disabled={!newItem.name || !newItem.dimensions || (!generatedPreview && !newItem.previewUrl && !uploadedImage)}
              className="flex-1"
            >
              {generatedPreview ? (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Add with AI Preview
                </>
              ) : (
                <>
                  <ImageIcon className="h-4 w-4 mr-2" />
                  Add with Preview
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
