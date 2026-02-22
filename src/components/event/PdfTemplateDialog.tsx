import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Image, Upload, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export interface PdfTemplateConfig {
  headerImageUrl?: string;
  footerImageUrl?: string;
  backgroundImageUrl?: string;
  backgroundOpacity?: number;
  useTemplate: boolean;
}

interface PdfTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: PdfTemplateConfig;
  onTemplateChange: (template: PdfTemplateConfig) => void;
  onExport: (template: PdfTemplateConfig) => void;
  isExporting: boolean;
}

const ImageUploadSlot = ({
  label,
  description,
  imageUrl,
  onUpload,
  onRemove,
}: {
  label: string;
  description: string;
  imageUrl?: string;
  onUpload: (dataUrl: string) => void;
  onRemove: () => void;
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be under 5MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => onUpload(reader.result as string);
    reader.readAsDataURL(file);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{label}</Label>
      <p className="text-xs text-muted-foreground">{description}</p>
      <input ref={inputRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
      {imageUrl ? (
        <div className="relative rounded-lg border border-border overflow-hidden bg-muted/30">
          <img src={imageUrl} alt={label} className="w-full h-20 object-contain bg-background" />
          <Button
            variant="destructive"
            size="icon"
            className="absolute top-1 right-1 h-6 w-6"
            onClick={onRemove}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      ) : (
        <Button
          variant="outline"
          size="sm"
          className="w-full gap-2 h-20 border-dashed"
          onClick={() => inputRef.current?.click()}
        >
          <Upload className="h-4 w-4" />
          Upload {label}
        </Button>
      )}
    </div>
  );
};

export const PdfTemplateDialog = ({
  open,
  onOpenChange,
  template,
  onTemplateChange,
  onExport,
  isExporting,
}: PdfTemplateDialogProps) => {
  const update = (partial: Partial<PdfTemplateConfig>) => {
    onTemplateChange({ ...template, ...partial });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Image className="h-5 w-5" />
            PDF Export Template
          </DialogTitle>
          <DialogDescription>
            Add custom header, footer, or background images to your PDF export.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="use-template" className="text-sm font-medium">Use custom template</Label>
            <Switch
              id="use-template"
              checked={template.useTemplate}
              onCheckedChange={(checked) => update({ useTemplate: checked })}
            />
          </div>

          {template.useTemplate && (
            <>
              <ImageUploadSlot
                label="Header Image"
                description="Displayed at the top of every page (recommended: 800×100px)"
                imageUrl={template.headerImageUrl}
                onUpload={(url) => update({ headerImageUrl: url })}
                onRemove={() => update({ headerImageUrl: undefined })}
              />

              <ImageUploadSlot
                label="Footer Image"
                description="Displayed at the bottom of every page (recommended: 800×60px)"
                imageUrl={template.footerImageUrl}
                onUpload={(url) => update({ footerImageUrl: url })}
                onRemove={() => update({ footerImageUrl: undefined })}
              />

              <ImageUploadSlot
                label="Background Image"
                description="Watermark or background on every page (recommended: 595×842px)"
                imageUrl={template.backgroundImageUrl}
                onUpload={(url) => update({ backgroundImageUrl: url })}
                onRemove={() => update({ backgroundImageUrl: undefined })}
              />

              {template.backgroundImageUrl && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Background Opacity: {Math.round((template.backgroundOpacity ?? 0.1) * 100)}%</Label>
                  <Input
                    type="range"
                    min="5"
                    max="50"
                    value={Math.round((template.backgroundOpacity ?? 0.1) * 100)}
                    onChange={(e) => update({ backgroundOpacity: parseInt(e.target.value) / 100 })}
                    className="w-full"
                  />
                </div>
              )}
            </>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={() => onExport(template)} disabled={isExporting} className="gap-2">
            {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Export PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
