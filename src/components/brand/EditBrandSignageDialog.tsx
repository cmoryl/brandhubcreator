import { useState, useRef, useEffect } from 'react';
import { Sparkles, Link2, Upload, Loader2, X, FileText, Image as ImageIcon, Trash2 } from 'lucide-react';
import { BrandEventSignage } from '@/types/brand';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ImageLibraryPicker } from '@/components/ui/ImageLibraryPicker';

interface EditBrandSignageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  signage: BrandEventSignage;
  onSave: (signage: BrandEventSignage) => void;
  onDelete: (id: string) => void;
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

type PreviewMode = 'current' | 'generate' | 'upload' | 'url';
type GenerationStyle = 'photorealistic' | 'venue' | 'mockup';

export const EditBrandSignageDialog = ({
  open,
  onOpenChange,
  signage,
  onSave,
  onDelete,
  brandName,
  brandColors,
}: EditBrandSignageDialogProps) => {
  const [previewMode, setPreviewMode] = useState<PreviewMode>('current');
  const [generationStyle, setGenerationStyle] = useState<GenerationStyle>('photorealistic');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPreview, setGeneratedPreview] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  
  const [editedItem, setEditedItem] = useState<BrandEventSignage>(signage);

  // Reset form when signage changes
  useEffect(() => {
    setEditedItem(signage);
    setGeneratedPreview(null);
    setPreviewMode(signage.previewUrl ? 'current' : 'generate');
    setConfirmDelete(false);
  }, [signage, open]);

  const generatePreview = async () => {
    if (!editedItem.name || !editedItem.dimensions) {
      toast.error('Please enter name and dimensions first');
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-signage-preview', {
        body: {
          signageType: editedItem.type,
          signageName: editedItem.name,
          dimensions: editedItem.dimensions,
          brandName,
          brandColors,
          style: generationStyle,
        },
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

  const handleSave = () => {
    if (!editedItem.name || !editedItem.dimensions) return;

    let finalPreviewUrl = editedItem.previewUrl;
    
    if (generatedPreview) {
      finalPreviewUrl = generatedPreview;
    }

    const updatedItem: BrandEventSignage = {
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

  const handleLibrarySelect = (url: string) => {
    setEditedItem({ ...editedItem, previewUrl: url });
    setGeneratedPreview(null);
    toast.success('Preview image updated');
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
                onValueChange={(value) => setEditedItem({ ...editedItem, type: value as BrandEventSignage['type'] })}
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
            {(editedItem.previewUrl || generatedPreview) && (
              <div className="relative">
                <img
                  src={generatedPreview || editedItem.previewUrl}
                  alt={editedItem.name}
                  className="w-full h-32 object-cover rounded-lg border"
                />
                <div className="absolute top-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                  {generatedPreview ? (
                    <>
                      <Sparkles className="h-3 w-3" />
                      New AI Preview
                    </>
                  ) : (
                    'Current Preview'
                  )}
                </div>
                {generatedPreview && (
                  <button
                    type="button"
                    onClick={() => setGeneratedPreview(null)}
                    className="absolute top-2 right-2 p-1 bg-black/60 rounded-full hover:bg-black/80 transition-colors"
                  >
                    <X className="h-4 w-4 text-white" />
                  </button>
                )}
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

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full"
                  disabled={!canSave || isGenerating}
                  onClick={generatePreview}
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
              <ImageLibraryPicker
                onSelect={handleLibrarySelect}
                trigger={
                  <button
                    type="button"
                    className="w-full p-4 border-2 border-dashed rounded-lg hover:border-primary/50 transition-colors text-center"
                  >
                    <Upload className="h-6 w-6 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm font-medium">Select preview image</p>
                    <p className="text-xs text-muted-foreground">Choose from library or upload new</p>
                  </button>
                }
              />
            )}

            {/* URL Mode */}
            {previewMode === 'url' && (
              <Input
                value={editedItem.previewUrl || ''}
                onChange={(e) => {
                  setEditedItem({ ...editedItem, previewUrl: e.target.value });
                  setGeneratedPreview(null);
                }}
                placeholder="https://..."
              />
            )}
          </div>

          {/* Template URL */}
          <div className="space-y-2">
            <Label>Template URL</Label>
            <Input
              value={editedItem.templateUrl || ''}
              onChange={(e) => setEditedItem({ ...editedItem, templateUrl: e.target.value })}
              placeholder="https://..."
            />
          </div>

          {/* Live Files Location */}
          <div className="space-y-2">
            <Label>Live Files Location</Label>
            <Input
              value={editedItem.specifications || ''}
              onChange={(e) => setEditedItem({ ...editedItem, specifications: e.target.value })}
              placeholder="Figma, Drive, etc."
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label>Notes / Specifications</Label>
            <Textarea
              value={editedItem.notes || ''}
              onChange={(e) => setEditedItem({ ...editedItem, notes: e.target.value })}
              placeholder="Material, installation notes, vendor details..."
              rows={2}
            />
          </div>

          {/* Footer Actions */}
          <div className="flex gap-2 pt-4 border-t">
            <Button
              type="button"
              variant={confirmDelete ? 'destructive' : 'outline'}
              size="sm"
              onClick={handleDeleteClick}
              className="gap-1.5"
            >
              <Trash2 className="h-4 w-4" />
              {confirmDelete ? 'Confirm Delete' : 'Delete'}
            </Button>
            <div className="flex-1" />
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              disabled={!canSave}
            >
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
