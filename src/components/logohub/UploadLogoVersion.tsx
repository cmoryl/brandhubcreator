import { useRef, useState } from 'react';
import { Upload, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type {
  ClientLogoFile,
  ClientLogoFormat,
  ClientLogoLockup,
  ClientLogoVariant,
} from '@/types/brand';
import { validateLogoUpload, LOGO_UPLOAD_LIMITS } from '@/lib/logoUploadValidation';
import { detectAssetMeta, type DetectedAssetMeta } from '@/lib/logoAssetAutoDetect';

const BUCKET = 'organization-assets';
const FOLDER = 'client-logos';

interface Props {
  logoId: string;
  logoName: string;
  existingFiles: ClientLogoFile[];
  defaultLockup?: ClientLogoLockup;
  defaultVariant?: ClientLogoVariant;
  onUploaded: (updated: ClientLogoFile[]) => void;
  trigger?: React.ReactNode;
}

function safeSlug(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'logo';
}




export function UploadLogoVersion({
  logoId,
  logoName,
  existingFiles,
  defaultLockup = 'icon',
  defaultVariant = 'color',
  onUploaded,
  trigger,
}: Props) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [lockup, setLockup] = useState<ClientLogoLockup>(defaultLockup);
  const [variant, setVariant] = useState<ClientLogoVariant>(defaultVariant);
  const [uploading, setUploading] = useState(false);
  const [detection, setDetection] = useState<DetectedAssetMeta | null>(null);
  const [lockupTouched, setLockupTouched] = useState(false);
  const [variantTouched, setVariantTouched] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setFile(null);
    setDetection(null);
    setLockupTouched(false);
    setVariantTouched(false);
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleFilePick = async (picked: File | null) => {
    setFile(picked);
    setDetection(null);
    if (!picked) return;
    try {
      const meta = await detectAssetMeta(picked, { lockup, variant });
      setDetection(meta);
      if (!lockupTouched) setLockup(meta.lockup);
      if (!variantTouched) setVariant(meta.variant);
    } catch {
      // non-fatal
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error('Choose a file first');
      return;
    }

    setUploading(true);
    try {
      const result = await validateLogoUpload(file);
      if (!result.ok) {
        toast.error((result as { error: string }).error);
        return;
      }
      const { format, blob, contentType, warnings } = result;
      warnings.forEach((w) => toast.warning(w));

      const ts = Date.now();
      const path = `${FOLDER}/${logoId}/${lockup}-${variant}-${ts}-${safeSlug(logoName)}.${format}`;
      const { error: upErr } = await supabase.storage
        .from(BUCKET)
        .upload(path, blob, {
          cacheControl: '3600',
          upsert: false,
          contentType,
        });
      if (upErr) throw upErr;

      const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(path);
      const publicUrl = urlData.publicUrl;

      const newFile: ClientLogoFile = {
        variant,
        format: format as ClientLogoFormat,
        url: publicUrl,
        lockup,
      };
      const nextFiles = [...existingFiles, newFile];

      const { error: updErr } = await supabase
        .from('global_client_logos')
        .update({ files: nextFiles as unknown as never })
        .eq('id', logoId);
      if (updErr) throw updErr;

      toast.success(`Uploaded ${lockup} · ${variant} · ${format.toUpperCase()}`);
      onUploaded(nextFiles);
      setOpen(false);
      reset();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Upload failed';
      toast.error(msg);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) reset();
      }}
    >
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm" variant="outline" className="gap-1">
            <Upload className="h-3.5 w-3.5" /> Upload version
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload logo version</DialogTitle>
          <DialogDescription>
            Add a new SVG or PNG file for <span className="font-medium">{logoName}</span>. It will
            be appended to the brand's file list.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Lockup</Label>
              <Select
                value={lockup}
                onValueChange={(v) => {
                  setLockup(v as ClientLogoLockup);
                  setLockupTouched(true);
                }}
              >
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="icon">Icon / symbol</SelectItem>
                  <SelectItem value="wordmark">Wordmark</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Variant</Label>
              <Select
                value={variant}
                onValueChange={(v) => {
                  setVariant(v as ClientLogoVariant);
                  setVariantTouched(true);
                }}
              >
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="color">Color</SelectItem>
                  <SelectItem value="black">Black</SelectItem>
                  <SelectItem value="white">White</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {detection && file && (
            <div className="flex items-start gap-2 rounded border border-border/60 bg-muted/30 px-2.5 py-2 text-[11px]">
              <Sparkles className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-medium">Auto-matched →</span>
                  <Badge variant="secondary" className="text-[10px] capitalize">
                    {detection.lockup}
                  </Badge>
                  <Badge variant="secondary" className="text-[10px] capitalize">
                    {detection.variant}
                  </Badge>
                  <Badge
                    variant="outline"
                    className="text-[10px] capitalize text-muted-foreground"
                  >
                    {detection.confidence} confidence
                  </Badge>
                </div>
                {detection.reasons.length > 0 && (
                  <p className="mt-0.5 text-muted-foreground truncate">
                    {detection.reasons.join(' · ')}
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <Label className="text-xs">
              File (SVG ≤ {(LOGO_UPLOAD_LIMITS.MAX_SVG_BYTES / 1024 / 1024).toFixed(0)}MB · PNG ≤{' '}
              {(LOGO_UPLOAD_LIMITS.MAX_PNG_BYTES / 1024 / 1024).toFixed(0)}MB)
            </Label>
            <input
              ref={inputRef}
              type="file"
              accept=".svg,.png,image/svg+xml,image/png"
              onChange={(e) => handleFilePick(e.target.files?.[0] ?? null)}
              className="block w-full text-xs file:mr-3 file:py-1.5 file:px-3 file:rounded file:border file:border-border file:bg-muted/40 file:text-xs file:font-medium hover:file:bg-muted"
            />
            {file && (
              <p className="text-[11px] text-muted-foreground">
                {file.name} · {(file.size / 1024).toFixed(1)} KB
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)} disabled={uploading}>
            Cancel
          </Button>
          <Button onClick={handleUpload} disabled={uploading || !file}>
            {uploading ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> Uploading…
              </>
            ) : (
              <>
                <Upload className="h-3.5 w-3.5 mr-1.5" /> Upload
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
