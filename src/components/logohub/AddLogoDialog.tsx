import { useRef, useState } from 'react';
import {
  Plus,
  Upload,
  Sparkles,
  Loader2,
  FilePlus2,
  ArrowLeft,
  Check,
  Search,
  CheckCircle2,
  Circle,
} from 'lucide-react';
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
import { cn } from '@/lib/utils';
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
type AiStep = 'form' | 'discovering' | 'preview' | 'committing';

interface Candidate {
  url: string;
  source: string;
  format?: string;
  suggestedLockup?: ClientLogoLockup;
  suggestedVariant?: ClientLogoVariant;
}

interface Selection {
  url: string;
  lockup: ClientLogoLockup;
  variant: ClientLogoVariant;
  enabled: boolean;
}

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

  // AI discovery state
  const [aiStep, setAiStep] = useState<AiStep>('form');
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [selections, setSelections] = useState<Selection[]>([]);
  const [discoveredColors, setDiscoveredColors] = useState<Record<string, string> | null>(null);

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
    setAiStep('form');
    setCandidates([]);
    setSelections([]);
    setDiscoveredColors(null);
  };

  const resolveCategory = () => (newCategory.trim() || category || 'General');

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

  const handleDiscover = async () => {
    if (!validateBase()) return;
    setBusy(true);
    setAiStep('discovering');
    try {
      const { data, error } = await supabase.functions.invoke('discover-brand-logos', {
        body: { website_url: website.trim() },
      });
      if (error) throw error;
      if (!data?.ok) throw new Error(data?.error || 'discovery failed');
      const found: Candidate[] = data.candidates || [];
      if (!found.length) {
        toast.warning('No logos found on that website. Try Manual or Upload instead.');
        setAiStep('form');
        return;
      }
      setCandidates(found);
      setSelections(
        found.map((c) => ({
          url: c.url,
          lockup: c.suggestedLockup || 'wordmark',
          variant: c.suggestedVariant || 'color',
          // Pre-enable wordmark candidates by default, skip favicons
          enabled: c.suggestedLockup !== 'icon',
        })),
      );
      setDiscoveredColors(data.colors || null);
      setAiStep('preview');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Discovery failed');
      setAiStep('form');
    } finally {
      setBusy(false);
    }
  };

  const handleCommit = async () => {
    const picked = selections.filter((s) => s.enabled);
    if (!picked.length) {
      toast.error('Select at least one logo to save');
      return;
    }
    setBusy(true);
    setAiStep('committing');
    try {
      const { data, error } = await supabase.functions.invoke('commit-brand-logos', {
        body: {
          organization_id: organization!.id,
          name: name.trim(),
          category: resolveCategory(),
          description: description.trim() || undefined,
          website_url: website.trim() || undefined,
          selections: picked.map((s) => ({
            url: s.url,
            lockup: s.lockup,
            variant: s.variant,
          })),
        },
      });
      if (error) throw error;
      if (!data?.ok) throw new Error(data?.error || 'commit failed');

      const savedCount = data.files?.length ?? picked.length;
      const failed = data.errors?.length ?? 0;
      if (failed) {
        toast.warning(`Saved ${savedCount} logo(s); ${failed} failed to download`);
      } else {
        toast.success(`Added ${name} with ${savedCount} logo${savedCount === 1 ? '' : 's'}`);
      }
      onAdded();
      setOpen(false);
      resetAll();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Commit failed');
      setAiStep('preview');
    } finally {
      setBusy(false);
    }
  };

  const submit = () => {
    if (mode === 'manual') return handleManual();
    if (mode === 'upload') return handleUpload();
    if (aiStep === 'form' || aiStep === 'discovering') return handleDiscover();
    return handleCommit();
  };

  const updateSelection = (idx: number, patch: Partial<Selection>) => {
    setSelections((prev) => prev.map((s, i) => (i === idx ? { ...s, ...patch } : s)));
  };

  const showSharedFields = mode !== 'ai' || aiStep === 'form';

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
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add a logo</DialogTitle>
          <DialogDescription>
            Create a new brand entry. You can add details manually, upload a file, or have AI find
            the official logo from the brand's website.
          </DialogDescription>
        </DialogHeader>

        <Tabs
          value={mode}
          onValueChange={(v) => {
            setMode(v as Mode);
            setAiStep('form');
          }}
          className="w-full"
        >
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

          {/* AI step indicator */}
          {mode === 'ai' && (
            <div className="flex items-center justify-center gap-2 pt-4 text-xs">
              <StepDot label="1. Brand" active={aiStep === 'form'} done={aiStep !== 'form'} />
              <div className="h-px w-6 bg-border" />
              <StepDot
                label="2. Discover"
                active={aiStep === 'discovering'}
                done={aiStep === 'preview' || aiStep === 'committing'}
              />
              <div className="h-px w-6 bg-border" />
              <StepDot
                label="3. Review"
                active={aiStep === 'preview' || aiStep === 'committing'}
                done={false}
              />
            </div>
          )}

          {/* Shared brand fields */}
          {showSharedFields && (
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
          )}

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

          <TabsContent value="ai" className="mt-3 space-y-3">
            {aiStep === 'form' && (
              <div className="rounded-md border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
                <p className="font-medium text-foreground mb-1 flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5" /> AI Logo Discovery
                </p>
                <p>
                  We'll scrape the brand's website with Firecrawl and surface every logo candidate
                  (wordmark, icon, OG image, favicon). You'll preview them before anything is saved.
                </p>
              </div>
            )}

            {aiStep === 'discovering' && (
              <div className="flex flex-col items-center justify-center py-10 gap-3 text-sm text-muted-foreground">
                <Loader2 className="h-7 w-7 animate-spin text-primary" />
                <p>Scraping {new URL(website.startsWith('http') ? website : `https://${website}`).hostname}…</p>
                <p className="text-xs">This usually takes 5–15 seconds.</p>
              </div>
            )}

            {(aiStep === 'preview' || aiStep === 'committing') && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">
                      {candidates.length} candidate{candidates.length === 1 ? '' : 's'} found
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Toggle which to save and confirm the lockup/variant for each.
                    </p>
                  </div>
                  {discoveredColors && (
                    <div className="flex items-center gap-1">
                      {Object.entries(discoveredColors)
                        .slice(0, 5)
                        .map(([k, v]) =>
                          typeof v === 'string' && v.startsWith('#') ? (
                            <div
                              key={k}
                              className="h-5 w-5 rounded border border-border"
                              style={{ background: v }}
                              title={`${k}: ${v}`}
                            />
                          ) : null,
                        )}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {candidates.map((c, idx) => {
                    const sel = selections[idx];
                    if (!sel) return null;
                    const isWhite = sel.variant === 'white';
                    return (
                      <div
                        key={`${c.url}-${idx}`}
                        className={cn(
                          'rounded-lg border-2 overflow-hidden transition-colors',
                          sel.enabled
                            ? 'border-primary bg-primary/5'
                            : 'border-border bg-card opacity-70',
                        )}
                      >
                        <button
                          type="button"
                          onClick={() => updateSelection(idx, { enabled: !sel.enabled })}
                          className="w-full text-left"
                        >
                          <div
                            className={cn(
                              'relative h-28 flex items-center justify-center p-3',
                              isWhite ? 'bg-slate-900' : 'bg-white',
                            )}
                          >
                            <img
                              src={c.url}
                              alt={c.source}
                              className="max-h-full max-w-full object-contain"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.opacity = '0.2';
                              }}
                            />
                            <div className="absolute top-1.5 right-1.5">
                              {sel.enabled ? (
                                <CheckCircle2 className="h-5 w-5 text-primary bg-background rounded-full" />
                              ) : (
                                <Circle className="h-5 w-5 text-muted-foreground bg-background rounded-full" />
                              )}
                            </div>
                          </div>
                        </button>
                        <div className="p-2 space-y-1.5 border-t border-border">
                          <p className="text-[10px] text-muted-foreground truncate" title={c.url}>
                            {c.source}
                            {c.format ? ` · ${c.format.toUpperCase()}` : ''}
                          </p>
                          <div className="grid grid-cols-2 gap-1.5">
                            <Select
                              value={sel.lockup}
                              onValueChange={(v) =>
                                updateSelection(idx, { lockup: v as ClientLogoLockup })
                              }
                            >
                              <SelectTrigger className="h-7 text-[11px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="icon">Icon</SelectItem>
                                <SelectItem value="wordmark">Wordmark</SelectItem>
                              </SelectContent>
                            </Select>
                            <Select
                              value={sel.variant}
                              onValueChange={(v) =>
                                updateSelection(idx, { variant: v as ClientLogoVariant })
                              }
                            >
                              <SelectTrigger className="h-7 text-[11px]">
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
                      </div>
                    );
                  })}
                </div>

                <p className="text-xs text-muted-foreground">
                  {selections.filter((s) => s.enabled).length} selected · originals will be
                  downloaded and rehosted in the logo bucket.
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        <DialogFooter>
          {mode === 'ai' && aiStep === 'preview' && (
            <Button
              variant="ghost"
              onClick={() => setAiStep('form')}
              disabled={busy}
              className="mr-auto"
            >
              <ArrowLeft className="h-3.5 w-3.5 mr-1.5" /> Back
            </Button>
          )}
          <Button variant="ghost" onClick={() => setOpen(false)} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={busy}>
            {busy ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                {mode === 'ai'
                  ? aiStep === 'discovering'
                    ? 'Discovering…'
                    : 'Saving…'
                  : mode === 'upload'
                  ? 'Uploading…'
                  : 'Adding…'}
              </>
            ) : (
              <>
                {mode === 'manual' && (
                  <>
                    <Plus className="h-3.5 w-3.5 mr-1.5" /> Add brand
                  </>
                )}
                {mode === 'upload' && (
                  <>
                    <Upload className="h-3.5 w-3.5 mr-1.5" /> Upload & add
                  </>
                )}
                {mode === 'ai' && aiStep === 'form' && (
                  <>
                    <Search className="h-3.5 w-3.5 mr-1.5" /> Discover logos
                  </>
                )}
                {mode === 'ai' && aiStep === 'preview' && (
                  <>
                    <Check className="h-3.5 w-3.5 mr-1.5" />
                    Save {selections.filter((s) => s.enabled).length} logo
                    {selections.filter((s) => s.enabled).length === 1 ? '' : 's'}
                  </>
                )}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function StepDot({ label, active, done }: { label: string; active: boolean; done: boolean }) {
  return (
    <div
      className={cn(
        'flex items-center gap-1.5 px-2 py-1 rounded-md',
        active && 'bg-primary/10 text-primary font-medium',
        done && !active && 'text-muted-foreground',
        !active && !done && 'text-muted-foreground/60',
      )}
    >
      {done ? (
        <CheckCircle2 className="h-3.5 w-3.5" />
      ) : (
        <Circle className={cn('h-3.5 w-3.5', active && 'fill-primary/20')} />
      )}
      {label}
    </div>
  );
}
