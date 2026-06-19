import { useRef, useState } from 'react';
import { Plus, Upload, Sparkles, Loader2, FilePlus2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import {
  validateLogoUpload,
  LOGO_UPLOAD_LIMITS,
} from '@/lib/logoUploadValidation';
import type {
  ClientLogoFile,
  ClientLogoFormat,
  ClientLogoLockup,
  ClientLogoVariant,
} from '@/types/brand';

const BUCKET = 'organization-assets';
const FOLDER = 'client-logos';

const safeSlug = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'logo';

interface Props {
  categories: string[];
  onAdded: () => void;
}

type Mode = 'manual' | 'upload' | 'ai';

export function AddLogoDialog({ categories, onAdded }: Props) {
  const { organization } = useOrganization();
  const { isAdmin } = useAuth();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>('manual');
  const [busy, setBusy] = useState(false);

  // Shared brand fields
  const [name, setName] = useState('');
  const [category, setCategory] = useState('General');
  const [newCategory, setNewCategory] = useState('');
  const [website, setWebsite] = useState('');
  const [description, setDescription] = useState('');

  // Upload-only
  const [file, setFile] = useState<File | null>(null);
  const [lockup, setLockup] = useState<ClientLogoLockup>('wordmark');
  const [variant, setVariant] = useState<ClientLogoVariant>('color');
  const fileRef = useRef<HTMLInputElement>(null);

  if (!isAdmin) return null;

  const resetAll = () => {
    setName('');
    setCategory('General');
    setNewCategory('');
    setWebsite('');
    setDescription('');
    setFile(null);
    setLockup('wordmark');
    setVariant('color');
    if (fileRef.current) fileRef.current.value = '';
    setMode('manual');
  };

  const resolveCategory = () => {
    const c = newCategory.trim() || category;
    return c || 'General';
  };

  const validateBase = () => {
    if (!organization?.id) {
      toast.error('No active organization');
      return false;
    }
    if (!name.trim()) {
      toast.error('Name is required');
      return false;
    }
    if (mode === 'ai' && !website.trim()) {
      toast.error('Website URL is required for AI search');
      return false;
    }
    return true;
  };

  const insertRow = async (initialFiles: ClientLogoFile[] = []) => {
    const { data, error } = await supabase
      .from('global_client_logos')
      .insert({
        organization_id: organization!.id,
        name: name.trim(),
        description: description.trim() || null,
        category: resolveCategory(),
        website_url: website.trim() || null,
        files: initialFiles as unknown as never,
      })
      .select('id')
      .single();
    if (error) throw error;
    return data.id as string;
  };

  const handleManual = async () => {
    if (!validateBase()) return;
    setBusy(true);
    try {
      await insertRow();
      toast.success(`Added ${name}`);
      onAdded();
      setOpen(false);
      resetAll();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to add logo');
    } finally {
      setBusy(false);
    }
  };

  const handleUpload = async () => {
    if (!validateBase()) return;
    if (!file) {
      toast.error('Choose a file to upload');
      return;
    }
    setBusy(true);
    try {
      const result = await validateLogoUpload(file);
      if (!result.ok) {
        toast.error((result as { error: string }).error);
        return;
      }
      const { format, blob, contentType, warnings } = result;
      warnings.forEach((w) => toast.warning(w));

      const id = await insertRow();
      const ts = Date.now();
      const path = `${FOLDER}/${id}/${lockup}-${variant}-${ts}-${safeSlug(name)}.${format}`;
      const { error: upErr } = await supabase.storage
        .from(BUCKET)
        .upload(path, blob, { cacheControl: '3600', upsert: false, contentType });
      if (upErr) throw upErr;
      const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(path);

      const newFile: ClientLogoFile = {
        variant,
        format: format as ClientLogoFormat,
        url: urlData.publicUrl,
        lockup,
      };
      const { error: updErr } = await supabase
        .from('global_client_logos')
        .update({ files: [newFile] as unknown as never })
        .eq('id', id);
      if (updErr) throw updErr;

      toast.success(`Added ${name} with ${format.toUpperCase()} ${lockup}/${variant}`);
      onAdded();
      setOpen(false);
      resetAll();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setBusy(false);
    }
  };

  const handleAi = async () => {
    if (!validateBase()) return;
    setBusy(true);
    const toastId = toast.loading(`Searching the web for ${name} logo…`);
    try {
      await insertRow();
      const { data, error } = await supabase.functions.invoke('scrape-brand-logos', {
        body: {
          brands: [{ name: name.trim(), website_url: website.trim() }],
        },
      });
      if (error) throw error;
      const res = data?.results?.[0];
      if (res?.ok) {
        toast.success(`Found logo for ${name}`, { id: toastId });
      } else {
        toast.warning(
          `Brand added, but no logo found automatically: ${res?.error || 'unknown'}`,
          { id: toastId },
        );
      }
      onAdded();
      setOpen(false);
      resetAll();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'AI search failed', { id: toastId });
    } finally {
      setBusy(false);
    }
  };

  const submit = () => {
    if (mode === 'manual') return handleManual();
    if (mode === 'upload') return handleUpload();
    return handleAi();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) resetAll();
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5">
          <Plus className="h-4 w-4" /> Add logo
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add a logo</DialogTitle>
          <DialogDescription>
            Create a new brand entry. You can add details manually, upload a file, or have AI find
            the official logo from the brand's website.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={mode} onValueChange={(v) => setMode(v as Mode)} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="manual" className="gap-1.5">
              <FilePlus2 className="h-3.5 w-3.5" /> Manual
            </TabsTrigger>
            <TabsTrigger value="upload" className="gap-1.5">
              <Upload className="h-3.5 w-3.5" /> Upload
            </TabsTrigger>
            <TabsTrigger value="ai" className="gap-1.5">
              <Sparkles className="h-3.5 w-3.5" /> AI Find
            </TabsTrigger>
          </TabsList>

          {/* Shared brand fields */}
          <div className="space-y-3 pt-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Brand name *</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. American Express"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.length === 0 && (
                      <SelectItem value="General">General</SelectItem>
                    )}
                    {categories.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Or new category</Label>
                <Input
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  placeholder="Optional"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">
                Website URL {mode === 'ai' ? '*' : '(optional)'}
              </Label>
              <Input
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://example.com"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Description (optional)</Label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Short description"
              />
            </div>
          </div>

          <TabsContent value="manual" className="mt-3">
            <p className="text-xs text-muted-foreground">
              Creates the brand entry only. You can upload files for it from the brand card after.
            </p>
          </TabsContent>

          <TabsContent value="upload" className="mt-3 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Lockup</Label>
                <Select value={lockup} onValueChange={(v) => setLockup(v as ClientLogoLockup)}>
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
                <Select value={variant} onValueChange={(v) => setVariant(v as ClientLogoVariant)}>
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
            <div className="space-y-1.5">
              <Label className="text-xs">
                File (SVG ≤ {(LOGO_UPLOAD_LIMITS.MAX_SVG_BYTES / 1024 / 1024).toFixed(0)}MB · PNG ≤{' '}
                {(LOGO_UPLOAD_LIMITS.MAX_PNG_BYTES / 1024 / 1024).toFixed(0)}MB)
              </Label>
              <input
                ref={fileRef}
                type="file"
                accept=".svg,.png,image/svg+xml,image/png"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className="block w-full text-xs file:mr-3 file:py-1.5 file:px-3 file:rounded file:border file:border-border file:bg-muted/40 file:text-xs file:font-medium hover:file:bg-muted"
              />
              {file && (
                <p className="text-[11px] text-muted-foreground">
                  {file.name} · {(file.size / 1024).toFixed(1)} KB
                </p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="ai" className="mt-3">
            <div className="rounded-md border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
              <p className="font-medium text-foreground mb-1 flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5" /> AI Logo Discovery
              </p>
              <p>
                We'll scrape the official website with Firecrawl, pick the best logo (preferring
                SVG), and save color, black, and white wordmark variants automatically. This usually
                takes 10–30 seconds.
              </p>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={busy}>
            {busy ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                {mode === 'ai' ? 'Searching…' : mode === 'upload' ? 'Uploading…' : 'Adding…'}
              </>
            ) : (
              <>
                {mode === 'ai' ? (
                  <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                ) : mode === 'upload' ? (
                  <Upload className="h-3.5 w-3.5 mr-1.5" />
                ) : (
                  <Plus className="h-3.5 w-3.5 mr-1.5" />
                )}
                {mode === 'ai' ? 'Find with AI' : mode === 'upload' ? 'Upload & add' : 'Add brand'}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
