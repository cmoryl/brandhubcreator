/**
 * Profile image picker for Social Asset Studio.
 * Allows selecting from brand kit logos or uploading a custom profile image.
 */
import { useState, useRef, useEffect } from 'react';
import { Camera, Upload, Check, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ProfileImagePickerProps {
  currentImage?: string;
  brandLogoUrl?: string;
  entityId: string;
  entityType: 'brand' | 'product' | 'event';
  organizationId: string;
  onSelect: (imageUrl: string) => void;
}

interface LogoOption {
  url: string;
  label: string;
}

export const ProfileImagePicker = ({
  currentImage,
  brandLogoUrl,
  entityId,
  entityType,
  organizationId,
  onSelect,
}: ProfileImagePickerProps) => {
  const [open, setOpen] = useState(false);
  const [logos, setLogos] = useState<LogoOption[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Fetch logos from entity guide_data
  useEffect(() => {
    if (!entityId) return;
    const table = entityType === 'brand' ? 'brands' : entityType === 'product' ? 'products' : 'events';
    
    supabase
      .from(table)
      .select('guide_data')
      .eq('id', entityId)
      .single()
      .then(({ data }) => {
        const gd = data?.guide_data as Record<string, any> | null;
        if (!gd) return;
        
        const options: LogoOption[] = [];
        
        // Hero image
        if (gd.hero?.imageUrl) {
          options.push({ url: gd.hero.imageUrl, label: 'Hero Image' });
        }
        
        // Logos array
        if (Array.isArray(gd.logos)) {
          gd.logos.forEach((logo: any, i: number) => {
            const url = logo?.url || logo?.imageUrl;
            if (url) options.push({ url, label: logo.name || `Logo ${i + 1}` });
          });
        }

        // Brand icons
        if (Array.isArray(gd.brandIcons)) {
          gd.brandIcons.forEach((icon: any, i: number) => {
            const url = icon?.url || icon?.imageUrl;
            if (url) options.push({ url, label: icon.name || `Icon ${i + 1}` });
          });
        }

        setLogos(options);
      });
  }, [entityId, entityType]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const path = `${organizationId}/${entityType}s/${entityId}/social-profile-${Date.now()}.${ext}`;
      
      const { error } = await supabase.storage
        .from('organization-assets')
        .upload(path, file, { cacheControl: '3600', upsert: true });

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from('organization-assets')
        .getPublicUrl(path);

      const url = `${urlData.publicUrl}?t=${Date.now()}`;
      onSelect(url);
      setOpen(false);
      toast.success('Profile image uploaded');
    } catch (err) {
      console.error('Upload failed:', err);
      toast.error('Failed to upload image');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const effectiveImage = currentImage || brandLogoUrl;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className={cn(
            "relative group w-12 h-12 rounded-full overflow-hidden border-2 border-border",
            "hover:border-primary transition-colors flex-shrink-0",
            "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          )}
          title="Change profile image"
        >
          {effectiveImage ? (
            <img src={effectiveImage} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-muted flex items-center justify-center">
              <Camera className="w-5 h-5 text-muted-foreground" />
            </div>
          )}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <Camera className="w-4 h-4 text-white" />
          </div>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-3" align="start">
        <div className="space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Social Profile Image
          </p>

          {/* Upload button */}
          <Button
            variant="outline"
            size="sm"
            className="w-full gap-2"
            disabled={uploading}
            onClick={() => fileRef.current?.click()}
          >
            <Upload className="h-4 w-4" />
            {uploading ? 'Uploading…' : 'Upload Custom Image'}
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleUpload}
          />

          {/* Brand kit logos */}
          {logos.length > 0 && (
            <>
              <p className="text-xs text-muted-foreground">From Brand Kit</p>
              <div className="grid grid-cols-4 gap-2">
                {logos.map((logo, i) => {
                  const isSelected = currentImage === logo.url;
                  return (
                    <button
                      key={i}
                      className={cn(
                        "relative w-14 h-14 rounded-lg overflow-hidden border-2 transition-all",
                        isSelected ? "border-primary ring-2 ring-primary/30" : "border-border hover:border-primary/50"
                      )}
                      title={logo.label}
                      onClick={() => {
                        onSelect(logo.url);
                        setOpen(false);
                      }}
                    >
                      <img src={logo.url} alt={logo.label} className="w-full h-full object-cover" />
                      {isSelected && (
                        <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                          <Check className="w-4 h-4 text-primary" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};
