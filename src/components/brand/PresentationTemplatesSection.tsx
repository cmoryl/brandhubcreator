/**
 * PresentationTemplatesSection - Display and manage PowerPoint template examples
 * Shows slide thumbnail galleries with download capability
 * Now persists to database via presentation_templates table
 */

import { useState, useRef, useEffect } from 'react';
import { Plus, Upload, Download, Trash2, FileText, Loader2, Eye, ChevronLeft, ChevronRight, Presentation, X, ExternalLink, Monitor, ImagePlus } from 'lucide-react';
import { PresentationTemplate, PresentationSlide } from '@/types/brand';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useOrganization } from '@/contexts/OrganizationContext';
import { RichTextDisplay } from '@/components/ui/rich-text-editor';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { usePresentationTemplates } from '@/hooks/usePresentationTemplates';

interface PresentationTemplatesSectionProps {
  presentations?: PresentationTemplate[]; // Now optional - we fetch from DB
  onUpdate?: (presentations: PresentationTemplate[]) => void; // Now optional
  isEditable?: boolean;
  subtitle?: string;
  entityType?: 'brand' | 'event' | 'product';
  entityId?: string;
}

const CATEGORIES = [
  { value: 'sales', label: 'Sales' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'corporate', label: 'Corporate' },
  { value: 'event', label: 'Event' },
  { value: 'training', label: 'Training' },
  { value: 'other', label: 'Other' },
];

const getCategoryColor = (category?: string) => {
  const colors: Record<string, string> = {
    sales: 'bg-green-100 text-green-800',
    marketing: 'bg-purple-100 text-purple-800',
    corporate: 'bg-blue-100 text-blue-800',
    event: 'bg-orange-100 text-orange-800',
    training: 'bg-cyan-100 text-cyan-800',
    other: 'bg-gray-100 text-gray-800',
  };
  return colors[category || 'other'] || colors.other;
};

// Generate Microsoft Office Online embed URL
const getOfficeEmbedUrl = (fileUrl: string): string => {
  // Office Online viewer requires a publicly accessible URL
  const encodedUrl = encodeURIComponent(fileUrl);
  return `https://view.officeapps.live.com/op/embed.aspx?src=${encodedUrl}`;
};

// Office Online embed viewer component with improved sizing and error handling
const OfficeEmbed = ({ fileUrl, fileName }: { fileUrl: string; fileName: string }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const embedUrl = getOfficeEmbedUrl(fileUrl);

  // The Office Online embed may fail silently inside iframe; give it time to load, then show fallback on error
  useEffect(() => {
    const timer = setTimeout(() => {
      // If still loading after 15s, assume it worked
      setIsLoading(false);
    }, 15000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="relative w-full bg-muted rounded-lg overflow-hidden" style={{ height: '60vh', minHeight: '400px', maxHeight: '600px' }}>
      {isLoading && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted z-10">
          <div className="text-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">Loading presentation...</p>
            <p className="text-[10px] text-muted-foreground/70 mt-1">This may take a moment</p>
          </div>
        </div>
      )}
      
      {hasError ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted/50 p-4 text-center">
          <Presentation className="h-10 w-10 text-muted-foreground/50 mb-3" />
          <p className="text-sm font-medium mb-1">Preview unavailable</p>
          <p className="text-xs text-muted-foreground mb-4 max-w-sm">
            The live preview could not load. This can happen with very large files or network issues.
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" asChild>
              <a href={embedUrl.replace('/embed.aspx', '/view.aspx')} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                Open in Office Online
              </a>
            </Button>
          </div>
        </div>
      ) : (
        <iframe
          src={embedUrl}
          className="w-full h-full border-0"
          title={`Preview: ${fileName}`}
          onLoad={() => setIsLoading(false)}
          onError={() => {
            setIsLoading(false);
            setHasError(true);
          }}
          allow="fullscreen"
          sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
        />
      )}
    </div>
  );
};

// Compact slide gallery component with scrollable slide deck
const SlideGallery = ({ slides, onClose }: { slides: PresentationSlide[]; onClose?: () => void }) => {
  const [activeIndex, setActiveIndex] = useState(0);

  if (slides.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 bg-muted/30 rounded-lg">
        <div className="text-center text-muted-foreground">
          <Presentation className="h-6 w-6 mx-auto mb-1 opacity-50" />
          <p className="text-xs">No slide previews available</p>
        </div>
      </div>
    );
  }

  const currentSlide = slides[activeIndex];
  
  return (
    <div className="space-y-2">
      {/* Main slide view - fixed height */}
      <div className="relative h-[280px] bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg overflow-hidden">
        {currentSlide?.thumbnailUrl ? (
          <img
            src={currentSlide.thumbnailUrl}
            alt={currentSlide.title || `Slide ${activeIndex + 1}`}
            className="w-full h-full object-contain"
            crossOrigin="anonymous"
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full p-4 text-center">
            <Presentation className="h-8 w-8 text-white/30 mb-2" />
            <p className="text-sm font-medium text-white/70 mb-1">
              {currentSlide?.title || `Slide ${activeIndex + 1}`}
            </p>
            {currentSlide?.textContent && (
              <p className="text-xs text-white/50 max-w-sm line-clamp-3">
                {currentSlide.textContent}
              </p>
            )}
          </div>
        )}
        
        {/* Navigation arrows */}
        {slides.length > 1 && (
          <>
            <button
              onClick={() => setActiveIndex((i) => (i > 0 ? i - 1 : slides.length - 1))}
              className="absolute left-1 top-1/2 -translate-y-1/2 p-1.5 bg-black/50 rounded-full hover:bg-black/70 transition-colors"
            >
              <ChevronLeft className="h-4 w-4 text-white" />
            </button>
            <button
              onClick={() => setActiveIndex((i) => (i < slides.length - 1 ? i + 1 : 0))}
              className="absolute right-1 top-1/2 -translate-y-1/2 p-1.5 bg-black/50 rounded-full hover:bg-black/70 transition-colors"
            >
              <ChevronRight className="h-4 w-4 text-white" />
            </button>
          </>
        )}

        {/* Slide counter */}
        <div className="absolute bottom-1.5 right-1.5 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded">
          {activeIndex + 1} / {slides.length}
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-1.5 right-1.5 p-1 bg-black/60 rounded-full hover:bg-black/80 transition-colors"
          >
            <X className="h-3 w-3 text-white" />
          </button>
        )}
      </div>

      {/* Larger thumbnail strip for easier navigation */}
      <ScrollArea className="w-full">
        <div className="flex gap-1.5 pb-2">
          {slides.map((slide, index) => (
            <button
              key={slide.id}
              onClick={() => setActiveIndex(index)}
              className={cn(
                "flex-shrink-0 w-16 aspect-video rounded border overflow-hidden transition-all",
                index === activeIndex
                  ? "border-primary ring-1 ring-primary/50"
                  : "border-border/50 hover:border-primary/50"
              )}
            >
              {slide.thumbnailUrl ? (
                <img
                  src={slide.thumbnailUrl}
                  alt={slide.title || `Slide ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-muted flex items-center justify-center">
                  <span className="text-[10px] text-muted-foreground">{index + 1}</span>
                </div>
              )}
            </button>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
};

export const PresentationTemplatesSection = ({
  presentations: propPresentations,
  onUpdate,
  isEditable = true,
  subtitle,
  entityType = 'brand',
  entityId,
}: PresentationTemplatesSectionProps) => {
  const { organization } = useOrganization();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewPresentation, setPreviewPresentation] = useState<PresentationTemplate | null>(null);
  
  // Fetch presentations from database
  const { 
    presentations: dbPresentations, 
    isLoading: isLoadingPresentations,
    addPresentation,
    deletePresentation,
    updatePresentation,
  } = usePresentationTemplates(entityType, entityId);
  
  // Card image replace
  const cardImageInputRef = useRef<HTMLInputElement>(null);
  const [replacingImageForId, setReplacingImageForId] = useState<string | null>(null);
  const [isUploadingCardImage, setIsUploadingCardImage] = useState(false);
  
  // Use database presentations if available, fallback to props for backward compatibility
  const presentations = dbPresentations.length > 0 ? dbPresentations : (propPresentations || []);
  
  const [newPresentation, setNewPresentation] = useState({
    name: '',
    description: '',
    category: 'corporate' as PresentationTemplate['category'],
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.pptx')) {
      toast.error('Please upload a .pptx file');
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      toast.error('File must be under 50MB');
      return;
    }

    setSelectedFile(file);
    if (!newPresentation.name) {
      setNewPresentation(prev => ({
        ...prev,
        name: file.name.replace('.pptx', '').replace(/_/g, ' '),
      }));
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !organization?.id || !entityId) {
      toast.error('Missing required information');
      return;
    }

    setIsUploading(true);
    setUploadProgress(10);

    // Show loading toast for long-running operation
    const loadingToast = toast.loading(`Uploading ${selectedFile.name}...`);

    try {
      // Create form data for the edge function
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('entityType', entityType);
      formData.append('entityId', entityId);
      formData.append('organizationId', organization.id);

      setUploadProgress(30);
      toast.loading(`Processing presentation...`, { id: loadingToast });

      // Call the parse-presentation edge function
      const { data: sessionData } = await supabase.auth.getSession();
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/parse-presentation`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${sessionData.session?.access_token}`,
          },
          body: formData,
        }
      );

      setUploadProgress(70);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to process presentation');
      }

      const result = await response.json();
      console.log('[PresentationUpload] Parse result:', result);
      setUploadProgress(90);

      toast.loading(`Saving to database...`, { id: loadingToast });

      // Save to database using the hook
      await addPresentation({
        name: newPresentation.name || selectedFile.name.replace('.pptx', ''),
        description: newPresentation.description,
        fileUrl: result.fileUrl,
        fileName: result.fileName,
        fileSize: result.fileSize,
        slides: result.slides,
        category: newPresentation.category,
      });

      console.log('[PresentationUpload] Saved to database successfully');
      
      setUploadProgress(100);
      
      // Dismiss loading toast and show success
      toast.dismiss(loadingToast);
      toast.success(`Presentation uploaded with ${result.slides.length} slides`);
      
      // Reset form
      setSelectedFile(null);
      setNewPresentation({ name: '', description: '', category: 'corporate' });
      setIsDialogOpen(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (error) {
      console.error('[PresentationUpload] Error:', error);
      toast.dismiss(loadingToast);
      toast.error(error instanceof Error ? error.message : 'Failed to upload presentation');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deletePresentation(id);
    } catch (error) {
      console.error('[PresentationDelete] Error:', error);
    }
  };

  // Handle card image replacement
  const handleReplaceCardImage = async (file: File, presentationId: string) => {
    if (!organization?.id) return;

    setIsUploadingCardImage(true);
    try {
      const ext = file.name.split('.').pop()?.toLowerCase() || 'png';
      const storagePath = `${organization.id}/presentations/cards/${presentationId}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('organization-assets')
        .upload(storagePath, file, {
          contentType: file.type,
          upsert: true,
        });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('organization-assets')
        .getPublicUrl(storagePath);

      const cardImageUrl = `${urlData.publicUrl}?t=${Date.now()}`;

      await updatePresentation({ id: presentationId, updates: { cardImageUrl } });
      toast.success('Card image updated');
    } catch (error) {
      console.error('[CardImage] Upload error:', error);
      toast.error('Failed to upload card image');
    } finally {
      setIsUploadingCardImage(false);
      setReplacingImageForId(null);
    }
  };

  const onCardImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !replacingImageForId) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be under 5MB');
      return;
    }

    handleReplaceCardImage(file, replacingImageForId);
    e.target.value = '';
  };

  return (
    <section id="presentations" className="scroll-mt-24">
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold">Presentation Templates</h2>
          {subtitle ? (
            <RichTextDisplay html={subtitle} className="text-muted-foreground mt-1" />
          ) : (
            <p className="text-muted-foreground mt-1">PowerPoint templates and slide deck examples</p>
          )}
        </div>
        {isEditable && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Presentation
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Upload Presentation</DialogTitle>
                <DialogDescription>
                  Upload a PowerPoint file to extract slide thumbnails
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 pt-2">
                {/* File Upload */}
                <div className="space-y-2">
                  <Label>PowerPoint File</Label>
                  {!selectedFile ? (
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:border-primary/50 transition-colors">
                      <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">Click to upload .pptx</p>
                      <p className="text-xs text-muted-foreground/70 mt-1">Max 50MB</p>
                      <input
                        ref={fileInputRef}
                        type="file"
                        className="hidden"
                        accept=".pptx"
                        onChange={handleFileSelect}
                      />
                    </label>
                  ) : (
                    <div className="flex items-center gap-3 p-3 border rounded-lg bg-muted/30">
                      <FileText className="h-8 w-8 text-primary" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{selectedFile.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {(selectedFile.size / (1024 * 1024)).toFixed(1)} MB
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedFile(null);
                          if (fileInputRef.current) fileInputRef.current.value = '';
                        }}
                        className="p-1 hover:bg-destructive/10 rounded"
                      >
                        <X className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Name */}
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input
                    value={newPresentation.name}
                    onChange={(e) => setNewPresentation(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Corporate Overview 2026"
                  />
                </div>

                {/* Category */}
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select
                    value={newPresentation.category}
                    onValueChange={(v) => setNewPresentation(prev => ({ ...prev, category: v as PresentationTemplate['category'] }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map(cat => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label>Description (optional)</Label>
                  <Input
                    value={newPresentation.description}
                    onChange={(e) => setNewPresentation(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Master template for sales pitches"
                  />
                </div>

                {/* Upload progress */}
                {isUploading && (
                  <div className="space-y-2">
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                    <p className="text-xs text-center text-muted-foreground">
                      Processing presentation...
                    </p>
                  </div>
                )}

                <Button
                  onClick={handleUpload}
                  disabled={!selectedFile || isUploading}
                  className="w-full"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Presentation
                    </>
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {presentations.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Presentation className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="font-semibold text-lg mb-2">No presentation templates yet</h3>
            <p className="text-muted-foreground mb-4">Upload PowerPoint files to display slide examples</p>
            {isEditable && (
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add First Presentation
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {presentations.map((pres) => {
            // Determine card thumbnail: cardImageUrl > first slide > placeholder
            const cardThumbnail = pres.cardImageUrl || pres.slides[0]?.thumbnailUrl;

            return (
              <Card key={pres.id} className="group overflow-hidden hover:border-primary/50 transition-colors">
                {/* Card preview image */}
                <div
                  className="aspect-video bg-muted relative cursor-pointer"
                  onClick={() => setPreviewPresentation(pres)}
                >
                  {cardThumbnail ? (
                    <OptimizedImage
                      src={cardThumbnail}
                      alt={pres.name}
                      className="w-full h-full"
                      objectFit="cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <Presentation className="h-12 w-12 text-muted-foreground/30" />
                    </div>
                  )}
                  
                  <Badge className={cn("absolute top-2 left-2", getCategoryColor(pres.category))}>
                    {CATEGORIES.find(c => c.value === pres.category)?.label || 'Other'}
                  </Badge>
                  
                  <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                    {pres.slides.length} slides
                  </div>

                  {/* Hover overlay with view + optional replace image */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                    <Button variant="secondary" size="sm">
                      <Eye className="h-4 w-4 mr-2" />
                      View Slides
                    </Button>
                    {isEditable && (
                      <Button
                        variant="secondary"
                        size="sm"
                        disabled={isUploadingCardImage}
                        onClick={(e) => {
                          e.stopPropagation();
                          setReplacingImageForId(pres.id);
                          cardImageInputRef.current?.click();
                        }}
                      >
                        {isUploadingCardImage && replacingImageForId === pres.id ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <ImagePlus className="h-4 w-4 mr-2" />
                        )}
                        Replace Image
                      </Button>
                    )}
                  </div>
                </div>

                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="min-w-0">
                      <h3 className="font-semibold truncate">{pres.name}</h3>
                      {pres.description && (
                        <p className="text-sm text-muted-foreground line-clamp-1">{pres.description}</p>
                      )}
                    </div>
                    {isEditable && (
                      <button
                        onClick={() => handleDelete(pres.id)}
                        className="p-1.5 rounded hover:bg-destructive/10 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                      </button>
                    )}
                  </div>

                  <div className="flex items-center justify-between mt-3">
                    <span className="text-xs text-muted-foreground">{pres.fileSize}</span>
                    <Button variant="outline" size="sm" asChild>
                      <a href={pres.fileUrl} download={pres.fileName}>
                        <Download className="h-3.5 w-3.5 mr-1.5" />
                        Download
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Slide preview dialog with scrollable content */}
      <Dialog open={!!previewPresentation} onOpenChange={() => setPreviewPresentation(null)}>
        <DialogContent className="max-w-2xl w-[95vw] max-h-[80vh] overflow-y-auto">
          <DialogHeader className="pb-2">
            <DialogTitle className="text-base flex items-center gap-2">
              <Presentation className="h-4 w-4" />
              {previewPresentation?.name}
            </DialogTitle>
            {previewPresentation?.description && (
              <DialogDescription className="text-sm">{previewPresentation.description}</DialogDescription>
            )}
          </DialogHeader>
          
          {previewPresentation && (
            <div className="space-y-4">
              <Tabs defaultValue="live" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-3">
                  <TabsTrigger value="live" className="text-xs">
                    <Monitor className="h-3.5 w-3.5 mr-1.5" />
                    Live Preview
                  </TabsTrigger>
                  <TabsTrigger value="thumbnails" className="text-xs">
                    <Eye className="h-3.5 w-3.5 mr-1.5" />
                    Thumbnails
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="live" className="mt-0">
                  <OfficeEmbed 
                    fileUrl={previewPresentation.fileUrl} 
                    fileName={previewPresentation.fileName} 
                  />
                  <p className="text-[10px] text-muted-foreground text-center mt-2">
                    Powered by Microsoft Office Online
                  </p>
                </TabsContent>
                
                <TabsContent value="thumbnails" className="mt-0">
                  <SlideGallery slides={previewPresentation.slides} />
                </TabsContent>
              </Tabs>
              
              <div className="flex items-center justify-between mt-3 pt-3 border-t flex-shrink-0">
                <Button variant="outline" size="sm" asChild>
                  <a 
                    href={getOfficeEmbedUrl(previewPresentation.fileUrl).replace('/embed.aspx', '/view.aspx')} 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                    Open in Office
                  </a>
                </Button>
                <Button size="sm" asChild>
                  <a href={previewPresentation.fileUrl} download={previewPresentation.fileName}>
                    <Download className="h-3.5 w-3.5 mr-1.5" />
                    Download
                  </a>
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Hidden input for card image replacement */}
      <input
        ref={cardImageInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onCardImageSelect}
      />
    </section>
  );
};
