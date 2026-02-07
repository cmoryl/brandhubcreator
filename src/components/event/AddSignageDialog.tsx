import { useState, useRef } from 'react';
import { Plus, Sparkles, Link2, Upload, Loader2, Image as ImageIcon, X, FileText, FileImage } from 'lucide-react';
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
import { useStorageUpload } from '@/hooks/useStorageUpload';

interface AddSignageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (signage: EventSignage) => void;
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

type PreviewMode = 'generate' | 'enhance' | 'upload' | 'url';
type GenerationStyle = 'photorealistic' | 'venue' | 'mockup';

interface UploadedFile {
  data: string;
  name: string;
  type: string;
}

interface ReferenceImage {
  data: string;
  name: string;
  type: 'design' | 'booth-reference' | 'venue-reference';
}

export const AddSignageDialog = ({
  open,
  onOpenChange,
  onAdd,
  brandName,
  brandColors,
  eventId,
}: AddSignageDialogProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const templateInputRef = useRef<HTMLInputElement>(null);
  
  // Storage upload for persistent image storage
  const { uploadFile, isUploading: isStorageUploading, uploadProgress } = useStorageUpload({
    entityType: 'event',
    entityId: eventId,
  });
  const [previewMode, setPreviewMode] = useState<PreviewMode>('generate');
  const [generationStyle, setGenerationStyle] = useState<GenerationStyle>('photorealistic');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPreview, setGeneratedPreview] = useState<string | null>(null);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string>('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [directUploadImage, setDirectUploadImage] = useState<string | null>(null);
  const [directUploadFileName, setDirectUploadFileName] = useState<string>('');
  const [directUploadFile, setDirectUploadFile] = useState<File | null>(null);
  const directUploadRef = useRef<HTMLInputElement>(null);
  const [templateFile, setTemplateFile] = useState<UploadedFile | null>(null);
  const [boothReferences, setBoothReferences] = useState<ReferenceImage[]>([]);
  const boothRefInputRef = useRef<HTMLInputElement>(null);

  const [newItem, setNewItem] = useState<Partial<EventSignage>>({
    name: '',
    type: 'booth-backdrop',
    dimensions: '',
    notes: '',
    previewUrl: '',
    templateUrl: '',
    liveFilesUrl: '',
  });

  const resetForm = () => {
    setNewItem({ name: '', type: 'booth-backdrop', dimensions: '', notes: '', previewUrl: '', templateUrl: '', liveFilesUrl: '' });
    setGeneratedPreview(null);
    setUploadedImage(null);
    setUploadedFileName('');
    setUploadedFile(null);
    setDirectUploadImage(null);
    setDirectUploadFileName('');
    setDirectUploadFile(null);
    setTemplateFile(null);
    setBoothReferences([]);
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

  const handleDirectUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
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

    setDirectUploadFileName(file.name);
    setDirectUploadFile(file);
    
    // Create preview URL for display
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setDirectUploadImage(base64);
    };
    reader.readAsDataURL(file);
  };

  const clearDirectUpload = () => {
    setDirectUploadImage(null);
    setDirectUploadFileName('');
    setDirectUploadFile(null);
    if (directUploadRef.current) {
      directUploadRef.current.value = '';
    }
  };

  const handleBoothRefUpload = (e: React.ChangeEvent<HTMLInputElement>, refType: 'booth-reference' | 'venue-reference') => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Limit to 5 reference images total
    if (boothReferences.length + files.length > 5) {
      toast.error('Maximum 5 reference images allowed');
      return;
    }

    Array.from(files).forEach(file => {
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} is not an image`);
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name} is too large (max 10MB)`);
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        setBoothReferences(prev => [...prev, {
          data: base64,
          name: file.name,
          type: refType,
        }]);
      };
      reader.readAsDataURL(file);
    });

    // Clear input for next upload
    if (boothRefInputRef.current) {
      boothRefInputRef.current.value = '';
    }
  };

  const removeBoothReference = (index: number) => {
    setBoothReferences(prev => prev.filter((_, i) => i !== index));
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

      // Include booth/venue reference images if available
      if (boothReferences.length > 0) {
        payload.referenceImages = boothReferences.map(ref => ({
          data: ref.data,
          type: ref.type,
          name: ref.name,
        }));
      }

      // Include template reference if available
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
        toast.success('Preview generated successfully!');
      }
    } catch (error) {
      console.error('Failed to generate preview:', error);
      toast.error('Failed to generate preview. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAdd = async (withPreview = false) => {
    if (!newItem.name || !newItem.dimensions) return;

    let finalPreviewUrl = newItem.previewUrl;
    
    if (withPreview && generatedPreview) {
      finalPreviewUrl = generatedPreview;
    } else if (previewMode === 'enhance' && uploadedImage && !generatedPreview) {
      // Use the uploaded image directly if no AI generation was done
      finalPreviewUrl = uploadedImage;
    } else if (previewMode === 'upload' && directUploadFile && eventId) {
      // Upload directly to storage for persistent URL
      const result = await uploadFile(directUploadFile, 'asset', `signage-${newItem.name?.replace(/\s+/g, '-').toLowerCase()}`);
      if (result) {
        finalPreviewUrl = result.url;
      } else {
        // Fallback to base64 if storage upload fails
        finalPreviewUrl = directUploadImage || undefined;
      }
    } else if (previewMode === 'upload' && directUploadImage) {
      // No eventId available, use base64 as fallback
      finalPreviewUrl = directUploadImage;
    }

    const item: EventSignage = {
      id: crypto.randomUUID(),
      name: newItem.name,
      type: newItem.type as EventSignage['type'],
      dimensions: newItem.dimensions,
      previewUrl: finalPreviewUrl,
      templateUrl: newItem.templateUrl,
      liveFilesUrl: newItem.liveFilesUrl,
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
  const hasGeneratedOrUploaded = generatedPreview || uploadedImage || directUploadImage;

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
            <div className="grid grid-cols-4 rounded-lg border bg-muted/50 p-1 gap-1">
              <button
                type="button"
                onClick={() => setPreviewMode('generate')}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 py-2 px-2 rounded-md text-xs font-medium transition-colors",
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
                onClick={() => setPreviewMode('enhance')}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 py-2 px-2 rounded-md text-xs font-medium transition-colors",
                  previewMode === 'enhance' 
                    ? "bg-background shadow-sm text-foreground" 
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Sparkles className="h-4 w-4" />
                Enhance
              </button>
              <button
                type="button"
                onClick={() => setPreviewMode('upload')}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 py-2 px-2 rounded-md text-xs font-medium transition-colors",
                  previewMode === 'upload' 
                    ? "bg-background shadow-sm text-foreground" 
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Upload className="h-4 w-4" />
                Upload
              </button>
              <button
                type="button"
                onClick={() => setPreviewMode('url')}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 py-2 px-2 rounded-md text-xs font-medium transition-colors",
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
              <div className="space-y-4">
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

                {/* Design Image Upload - Prominent Section */}
                <div className="space-y-2 p-3 border rounded-lg bg-muted/30">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Your Design (optional)</Label>
                    {uploadedImage && (
                      <button
                        type="button"
                        onClick={clearUploadedImage}
                        className="text-xs text-muted-foreground hover:text-destructive transition-colors"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  
                  <p className="text-xs text-muted-foreground">
                    Upload your booth design and AI will render it in a realistic setting
                  </p>

                  {!uploadedImage ? (
                    <label className="flex items-center gap-3 p-3 border-2 border-dashed rounded-lg cursor-pointer hover:border-primary/50 transition-colors bg-background">
                      <div className="p-2 rounded-md bg-primary/10">
                        <Upload className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">Upload your booth design</p>
                        <p className="text-xs text-muted-foreground">
                          Your artwork, mockup, or design file
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
                        alt="Your design"
                        className="w-full h-28 object-contain rounded-lg border bg-white"
                      />
                      <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                        {uploadedFileName}
                      </div>
                      <button
                        type="button"
                        onClick={clearUploadedImage}
                        className="absolute top-2 right-2 p-1 bg-black/60 rounded-full hover:bg-black/80 transition-colors"
                      >
                        <X className="h-4 w-4 text-white" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Booth Template Reference Upload */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">Booth Template Reference (optional)</Label>
                    {templateFile && (
                      <button
                        type="button"
                        onClick={clearTemplateFile}
                        className="text-xs text-muted-foreground hover:text-destructive transition-colors"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  
                  {!templateFile ? (
                    <label className="flex items-center gap-3 p-3 border border-dashed rounded-lg cursor-pointer hover:border-primary/50 transition-colors">
                      <div className="p-2 rounded-md bg-muted">
                        <FileImage className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">Upload template reference</p>
                        <p className="text-xs text-muted-foreground">
                          PDF or image of booth layout/design template
                        </p>
                      </div>
                      <input
                        ref={templateInputRef}
                        type="file"
                        className="hidden"
                        accept="image/*,.pdf"
                        onChange={handleTemplateUpload}
                      />
                    </label>
                  ) : (
                    <div className="flex items-center gap-3 p-3 border rounded-lg bg-muted/30">
                      <div className="p-2 rounded-md bg-primary/10">
                        {templateFile.type === 'application/pdf' ? (
                          <FileText className="h-5 w-5 text-primary" />
                        ) : (
                          <FileImage className="h-5 w-5 text-primary" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{templateFile.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {templateFile.type === 'application/pdf' ? 'PDF Template' : 'Image Template'}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={clearTemplateFile}
                        className="p-1 hover:bg-destructive/10 rounded transition-colors"
                      >
                        <X className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                      </button>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground/70">
                    AI will use this as reference for accurate booth proportions and layout
                  </p>
                </div>

                {/* Booth/Venue Reference Images */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">Booth & Venue References (optional)</Label>
                    {boothReferences.length > 0 && (
                      <span className="text-xs text-muted-foreground">{boothReferences.length}/5</span>
                    )}
                  </div>
                  
                  <p className="text-xs text-muted-foreground/70">
                    Add photos of similar booths or venue spaces to help AI create a more realistic render
                  </p>

                  {/* Reference image grid */}
                  {boothReferences.length > 0 && (
                    <div className="grid grid-cols-3 gap-2">
                      {boothReferences.map((ref, idx) => (
                        <div key={idx} className="relative group">
                          <img
                            src={ref.data}
                            alt={ref.name}
                            className="w-full aspect-square object-cover rounded-lg border"
                          />
                          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-1 rounded-b-lg">
                            <span className="text-[10px] text-white/90 capitalize">{ref.type.replace('-', ' ')}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeBoothReference(idx)}
                            className="absolute top-1 right-1 p-1 bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="h-3 w-3 text-white" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add reference buttons */}
                  {boothReferences.length < 5 && (
                    <div className="flex gap-2">
                      <label className="flex-1 flex items-center justify-center gap-2 p-2 border border-dashed rounded-lg cursor-pointer hover:border-primary/50 transition-colors text-xs">
                        <ImageIcon className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Booth Photo</span>
                        <input
                          type="file"
                          className="hidden"
                          accept="image/*"
                          multiple
                          onChange={(e) => handleBoothRefUpload(e, 'booth-reference')}
                        />
                      </label>
                      <label className="flex-1 flex items-center justify-center gap-2 p-2 border border-dashed rounded-lg cursor-pointer hover:border-primary/50 transition-colors text-xs">
                        <ImageIcon className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Venue Photo</span>
                        <input
                          type="file"
                          className="hidden"
                          accept="image/*"
                          multiple
                          onChange={(e) => handleBoothRefUpload(e, 'venue-reference')}
                        />
                      </label>
                    </div>
                  )}
                </div>

                {/* Generate Button */}
                <Button
                  type="button"
                  variant={uploadedImage ? "default" : "outline"}
                  className="w-full"
                  disabled={!canGenerate || isGenerating}
                  onClick={() => generatePreview(!!uploadedImage)}
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {uploadedImage ? 'Rendering Your Design...' : 'Generating...'}
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      {uploadedImage 
                        ? 'Render Design in Scene' 
                        : templateFile 
                          ? 'Generate from Template' 
                          : 'Generate Preview'}
                    </>
                  )}
                </Button>
              </div>
            )}

            {/* Upload & Enhance Mode */}
            {previewMode === 'enhance' && (
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

            {/* Direct Upload Mode */}
            {previewMode === 'upload' && (
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground">
                  Upload a preview image directly without AI enhancement
                </p>

                {/* Upload Area */}
                {!directUploadImage ? (
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:border-primary/50 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <ImageIcon className="h-8 w-8 text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">
                        Click to upload preview image
                      </p>
                      <p className="text-xs text-muted-foreground/70 mt-1">
                        PNG, JPG up to 10MB
                      </p>
                    </div>
                    <input
                      ref={directUploadRef}
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleDirectUpload}
                    />
                  </label>
                ) : (
                  <div className="relative">
                    <img
                      src={directUploadImage}
                      alt="Preview image"
                      className="w-full h-40 object-cover rounded-lg border"
                    />
                    <button
                      type="button"
                      onClick={clearDirectUpload}
                      className="absolute top-2 right-2 p-1 bg-black/60 rounded-full hover:bg-black/80 transition-colors"
                    >
                      <X className="h-4 w-4 text-white" />
                    </button>
                    <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                      <ImageIcon className="h-3 w-3" />
                      {directUploadFileName}
                    </div>
                  </div>
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

          {/* Template URL & Live Files URL */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Template URL</Label>
              <Input
                value={newItem.templateUrl || ''}
                onChange={(e) => setNewItem({ ...newItem, templateUrl: e.target.value })}
                placeholder="https://..."
              />
              <p className="text-xs text-muted-foreground/70">Link to downloadable template</p>
            </div>
            <div className="space-y-2">
              <Label>Live Files Location</Label>
              <Input
                value={newItem.liveFilesUrl || ''}
                onChange={(e) => setNewItem({ ...newItem, liveFilesUrl: e.target.value })}
                placeholder="Figma, Google Drive, Dropbox..."
              />
              <p className="text-xs text-muted-foreground/70">Link to editable design files</p>
            </div>
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
              disabled={!newItem.name || !newItem.dimensions || isStorageUploading}
              className="flex-1"
            >
              Add Without Preview
            </Button>
            <Button
              onClick={() => handleAdd(true)}
              disabled={!newItem.name || !newItem.dimensions || (!generatedPreview && !newItem.previewUrl && !uploadedImage && !directUploadImage) || isStorageUploading}
              className="flex-1"
            >
              {isStorageUploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading... {uploadProgress}%
                </>
              ) : generatedPreview ? (
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
