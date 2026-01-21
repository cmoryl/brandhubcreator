import { useCallback } from 'react';
import { Palette, ArrowRight, ArrowLeft, Loader2, Upload } from 'lucide-react';
import { OnboardingData } from '@/types/organization';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useDropZone } from '@/components/ui/drop-zone';

interface OnboardingStep2Props {
  data: OnboardingData;
  onUpdate: (updates: Partial<OnboardingData>) => void;
  onBack: () => void;
  onNext: () => void;
  isLoading: boolean;
}

export const OnboardingStep2 = ({ data, onUpdate, onBack, onNext, isLoading }: OnboardingStep2Props) => {
  const handleFileDrop = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      onUpdate({ logoUrl: e.target?.result as string });
    };
    reader.readAsDataURL(file);
  }, [onUpdate]);

  const { isDragging, fileInputRef, dragHandlers, openFilePicker, handleInputChange } = useDropZone({
    onFileDrop: handleFileDrop,
    accept: 'image/*',
  });

  return (
    <Card className="border-0 shadow-xl bg-card/80 backdrop-blur">
      <CardHeader className="text-center pb-2">
        <div className="mx-auto p-4 bg-primary/10 rounded-2xl w-fit mb-4">
          <Palette className="h-10 w-10 text-primary" />
        </div>
        <CardTitle className="text-2xl sm:text-3xl">Brand Your Workspace</CardTitle>
        <CardDescription className="text-base">
          Customize the look and feel of your platform
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 pt-4">
        {/* Logo Upload */}
        <div className="space-y-2">
          <Label className="text-base">Organization Logo</Label>
          <div className="flex items-center gap-4">
            <div 
              className={`w-20 h-20 rounded-xl border-2 border-dashed flex items-center justify-center bg-muted/50 overflow-hidden cursor-pointer transition-colors ${
                isDragging ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'
              }`}
              onClick={openFilePicker}
              {...dragHandlers}
            >
              {data.logoUrl ? (
                <img src={data.logoUrl} alt="Logo" className="w-full h-full object-contain p-2" />
              ) : (
                <Upload className={`h-8 w-8 ${isDragging ? 'text-primary' : 'text-muted-foreground'}`} />
              )}
            </div>
            <div className="flex-1">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleInputChange}
                className="hidden"
              />
              <Button variant="outline" size="sm" onClick={openFilePicker} className="gap-2">
                <Upload className="h-4 w-4" />
                {data.logoUrl ? 'Change Logo' : 'Upload Logo'}
              </Button>
              <p className="text-sm text-muted-foreground mt-1">
                PNG, SVG, or JPG (recommended: 200x200px) - or drag & drop
              </p>
            </div>
          </div>
        </div>

        {/* Color Pickers */}
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="primary-color" className="text-sm">Primary Color</Label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                id="primary-color"
                value={data.primaryColor}
                onChange={(e) => onUpdate({ primaryColor: e.target.value })}
                className="w-12 h-12 rounded-lg border border-input cursor-pointer"
              />
              <Input
                value={data.primaryColor}
                onChange={(e) => onUpdate({ primaryColor: e.target.value })}
                className="font-mono text-sm uppercase"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="secondary-color" className="text-sm">Secondary Color</Label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                id="secondary-color"
                value={data.secondaryColor}
                onChange={(e) => onUpdate({ secondaryColor: e.target.value })}
                className="w-12 h-12 rounded-lg border border-input cursor-pointer"
              />
              <Input
                value={data.secondaryColor}
                onChange={(e) => onUpdate({ secondaryColor: e.target.value })}
                className="font-mono text-sm uppercase"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="accent-color" className="text-sm">Accent Color</Label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                id="accent-color"
                value={data.accentColor}
                onChange={(e) => onUpdate({ accentColor: e.target.value })}
                className="w-12 h-12 rounded-lg border border-input cursor-pointer"
              />
              <Input
                value={data.accentColor}
                onChange={(e) => onUpdate({ accentColor: e.target.value })}
                className="font-mono text-sm uppercase"
              />
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="p-4 rounded-xl border border-border bg-background">
          <p className="text-sm text-muted-foreground mb-3">Preview</p>
          <div className="flex items-center gap-3">
            {data.logoUrl && (
              <img src={data.logoUrl} alt="Logo preview" className="w-10 h-10 object-contain" />
            )}
            <span className="font-semibold text-lg" style={{ color: data.primaryColor }}>
              {data.organizationName || 'Your Organization'}
            </span>
          </div>
          <div className="mt-3 flex gap-2">
            <div 
              className="px-4 py-2 rounded-lg text-white text-sm font-medium"
              style={{ backgroundColor: data.primaryColor }}
            >
              Primary Button
            </div>
            <div 
              className="px-4 py-2 rounded-lg text-white text-sm font-medium"
              style={{ backgroundColor: data.accentColor }}
            >
              Accent Button
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={onBack}
            className="flex-1 h-12 text-base"
          >
            <ArrowLeft className="mr-2 h-5 w-5" />
            Back
          </Button>
          <Button
            onClick={onNext}
            disabled={isLoading}
            className="flex-1 h-12 text-base"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                Continue
                <ArrowRight className="ml-2 h-5 w-5" />
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
