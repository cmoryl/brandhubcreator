import { useState, useEffect, useRef, useCallback } from 'react';
import { Plus, Search, Trash2, Pencil, Upload, Download, ExternalLink, FolderArchive, Loader2, Filter, Sparkles, ShieldCheck, ShieldAlert, RefreshCw, EyeOff, Eye } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { validateLogoFiles, ISSUE_LABELS, type LogoValidationResult } from '@/lib/logoValidation';
import { validateWordmarkUpload, type UploadValidationResult } from '@/lib/wordmarkUploadValidation';
import { getExemptions, setExempt } from '@/lib/logoValidationExemptions';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { ImageLibraryPicker } from '@/components/ui/ImageLibraryPicker';
import type { ClientLogoVariant, ClientLogoFormat, ClientLogoFile } from '@/types/brand';

interface GlobalClientLogo {
  id: string;
  organization_id: string;
  name: string;
  description: string | null;
  category: string;
  website_url: string | null;
  files: ClientLogoFile[];
  created_at: string;
  updated_at: string;
}

const VARIANT_LABELS: Record<ClientLogoVariant, string> = {
  color: 'Color',
  white: 'White',
  black: 'Black',
};

const VARIANT_BG: Record<ClientLogoVariant, string> = {
  color: 'bg-white',
  white: 'bg-slate-900',
  black: 'bg-white',
};

const FORMAT_LABELS: Record<ClientLogoFormat, string> = {
  png: 'PNG',
  svg: 'SVG',
  eps: 'EPS',
};

const DEFAULT_CATEGORIES = ['PartnerLink Logos', 'Technology', 'Retail', 'Healthcare', 'Finance', 'Media', 'Automotive', 'Consumer Goods', 'Hospitality', 'Gaming', 'Studios', 'General'];

export function GlobalLogoHub() {
  const { organization } = useOrganization();
  const [logos, setLogos] = useState<GlobalClientLogo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editingLogo, setEditingLogo] = useState<GlobalClientLogo | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '', category: 'General', websiteUrl: '', files: [] as ClientLogoFile[] });
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingVariant, setGeneratingVariant] = useState<string | null>(null);
  const [generateProgress, setGenerateProgress] = useState(0);
  const [isSeedingPartners, setIsSeedingPartners] = useState(false);
  const [validations, setValidations] = useState<Record<string, LogoValidationResult>>({});
  const [validatingId, setValidatingId] = useState<string | null>(null);
  const [isValidatingAll, setIsValidatingAll] = useState(false);
  const [exemptIds, setExemptIds] = useState<Set<string>>(new Set());
  const [resyncingId, setResyncingId] = useState<string | null>(null);
  // Per-slot upload validation results, keyed by `${lockup}-${variant}-${format}`
  const [uploadValidations, setUploadValidations] = useState<Record<string, UploadValidationResult>>({});


  useEffect(() => {
    if (organization?.id) setExemptIds(getExemptions(organization.id));
  }, [organization?.id]);

  const toggleExempt = useCallback((logoId: string) => {
    if (!organization?.id) return;
    const wasExempt = exemptIds.has(logoId);
    const next = setExempt(organization.id, logoId, !wasExempt);
    setExemptIds(new Set(next));
    toast.success(wasExempt ? 'Validation alerts re-enabled' : 'Marked as exempt — alerts hidden');
  }, [organization?.id, exemptIds]);

  const handleResyncOne = useCallback(async (logo: GlobalClientLogo) => {
    if (!organization?.id) return;
    setResyncingId(logo.id);
    try {
      const { data, error } = await supabase.functions.invoke('seed-partnerlink-logos', {
        body: { organizationId: organization.id, names: [logo.name], force: true },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      const updated = data?.results?.find((r: any) => r.name === logo.name);
      if (!updated || updated.status === 'no-logo') {
        toast.error(`No source logo found for ${logo.name}. Use "Find Logos" or upload manually.`);
      } else if (updated.status === 'skipped') {
        toast.message(`${logo.name} is already up to date.`);
      } else {
        toast.success(`Re-downloaded files for ${logo.name}`);
      }
      await fetchLogos();
    } catch (err) {
      console.error('Re-sync failed:', err);
      toast.error(err instanceof Error ? err.message : 'Re-sync failed');
    } finally {
      setResyncingId((curr) => (curr === logo.id ? null : curr));
    }
  }, [organization?.id]);


  const runValidation = useCallback(async (logo: GlobalClientLogo) => {
    setValidatingId(logo.id);
    try {
      const result = await validateLogoFiles(logo.files);
      setValidations((prev) => ({ ...prev, [logo.id]: result }));
    } finally {
      setValidatingId((curr) => (curr === logo.id ? null : curr));
    }
  }, []);

  const runValidationAll = useCallback(async (rows: GlobalClientLogo[]) => {
    setIsValidatingAll(true);
    try {
      // Validate in small batches so we don't hammer the network or block the UI.
      const BATCH = 6;
      for (let i = 0; i < rows.length; i += BATCH) {
        const slice = rows.slice(i, i + BATCH);
        const results = await Promise.all(
          slice.map(async (l) => [l.id, await validateLogoFiles(l.files)] as const),
        );
        setValidations((prev) => {
          const next = { ...prev };
          for (const [id, r] of results) next[id] = r;
          return next;
        });
      }
    } finally {
      setIsValidatingAll(false);
    }
  }, []);

  const handleSeedCategory = async (category: 'PartnerLink Logos' | 'Media' | 'General') => {
    if (!organization?.id) return;
    const force = confirm(
      `Seed ${category} Logos.\n\nOK = FORCE refresh every row (re-pull color, white & black variants from source)\nCancel = quick mode (only add missing rows / fill empty ones)`,
    );
    setIsSeedingPartners(true);
    try {
      const { data, error } = await supabase.functions.invoke('seed-partnerlink-logos', {
        body: { organizationId: organization.id, force, category },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success(
        `${category} seed complete — ${data.inserted ?? 0} added, ${data.updated ?? 0} refreshed, ${data.withoutLogo ?? 0} without logos, ${data.skipped ?? 0} unchanged`,
      );
      await fetchLogos();
      setCategoryFilter(category);
    } catch (err) {
      console.error(`Failed to seed ${category} logos:`, err);
      toast.error(err instanceof Error ? err.message : `Failed to seed ${category} logos`);
    } finally {
      setIsSeedingPartners(false);
    }
  };

  const handleSeedPartnerLink = () => handleSeedCategory('PartnerLink Logos');
  const handleSeedMedia = () => handleSeedCategory('Media');
  const handleSeedGeneral = () => handleSeedCategory('General');

  const handleSeedWordmarksForce = async () => {
    if (!organization?.id) return;
    if (!confirm('Re-scrape & OVERWRITE wordmark slots for ALL partners (PartnerLink, Media, General). Icons are preserved. Continue?')) return;
    setIsSeedingPartners(true);
    try {
      const categories = ['PartnerLink Logos', 'Media', 'General'];
      let inserted = 0, updated = 0, skipped = 0, withoutLogo = 0;
      for (const category of categories) {
        const { data, error } = await supabase.functions.invoke('seed-partnerlink-logos', {
          body: { organizationId: organization.id, wordmarksOnly: true, force: true, category },
        });
        if (error) throw error;
        if (data?.error) throw new Error(data.error);
        inserted += data.inserted ?? 0;
        updated += data.updated ?? 0;
        skipped += data.skipped ?? 0;
        withoutLogo += data.withoutLogo ?? 0;
      }
      toast.success(`Wordmark seed complete — ${updated} refreshed, ${withoutLogo} without wordmarks, ${skipped} unchanged`);
      await fetchLogos();
    } catch (err) {
      console.error('Failed to seed wordmarks:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to seed wordmarks');
    } finally {
      setIsSeedingPartners(false);
    }
  };



  const fetchLogos = useCallback(async () => {
    if (!organization?.id) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('global_client_logos')
        .select('*')
        .eq('organization_id', organization.id)
        .order('category', { ascending: true })
        .order('name', { ascending: true });
      
      if (error) throw error;
      const normalized = (data || []).map(d => ({
        ...d,
        files: (Array.isArray(d.files) ? d.files : []) as unknown as ClientLogoFile[],
      }));
      setLogos(normalized);
      setValidations({});
      // Kick off validation in the background so failures surface on cards.
      runValidationAll(normalized);
    } catch (err) {
      console.error('Failed to fetch global logos:', err);
      toast.error('Failed to load logo library');
    } finally {
      setIsLoading(false);
    }
  }, [organization?.id, runValidationAll]);

  useEffect(() => { fetchLogos(); }, [fetchLogos]);

  const handleSave = async () => {
    if (!organization?.id || !formData.name.trim()) return;
    setIsSaving(true);
    try {
      if (editingLogo) {
        const { error } = await supabase
          .from('global_client_logos')
          .update({
            name: formData.name.trim(),
            description: formData.description.trim() || null,
            category: formData.category,
            website_url: formData.websiteUrl.trim() || null,
            files: JSON.parse(JSON.stringify(formData.files)),
          })
          .eq('id', editingLogo.id);
        if (error) throw error;
        toast.success('Logo updated');
      } else {
        const { error } = await supabase
          .from('global_client_logos')
          .insert([{
            organization_id: organization.id,
            name: formData.name.trim(),
            description: formData.description.trim() || null,
            category: formData.category,
            website_url: formData.websiteUrl.trim() || null,
            files: JSON.parse(JSON.stringify(formData.files)),
          }]);
        if (error) throw error;
        toast.success('Logo added to global library');
      }
      resetForm();
      fetchLogos();
    } catch (err) {
      console.error('Failed to save logo:', err);
      toast.error('Failed to save logo');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from('global_client_logos').delete().eq('id', id);
      if (error) throw error;
      setLogos(prev => prev.filter(l => l.id !== id));
      toast.success('Logo removed from global library');
    } catch (err) {
      console.error('Failed to delete logo:', err);
      toast.error('Failed to delete logo');
    }
  };

  const resetForm = () => {
    setFormData({ name: '', description: '', category: 'General', websiteUrl: '', files: [] });
    setEditingLogo(null);
    setAddDialogOpen(false);
    setUploadValidations({});
  };

  const openEdit = (logo: GlobalClientLogo) => {
    setEditingLogo(logo);
    setFormData({
      name: logo.name,
      description: logo.description || '',
      category: logo.category,
      websiteUrl: logo.website_url || '',
      files: logo.files,
    });
    setUploadValidations({});
    setAddDialogOpen(true);
  };

  const handleFileUploadFromLibrary = (variant: ClientLogoVariant, lockup: 'icon' | 'wordmark', url: string) => {
    const format: ClientLogoFormat = 'png';
    const filtered = formData.files.filter(f => !(f.variant === variant && f.format === format && (f.lockup ?? 'icon') === lockup));
    setFormData(prev => ({ ...prev, files: [...filtered, { variant, format, url, lockup }] }));
    // Clear any stale local-upload validation for this slot — library asset wasn't measured here.
    setUploadValidations(prev => {
      const next = { ...prev };
      delete next[`${lockup}-${variant}-${format}`];
      return next;
    });
    toast.success(`${lockup === 'wordmark' ? 'Wordmark ' : ''}${VARIANT_LABELS[variant]} logo added`);
  };

  const handleLocalFileUpload = async (variant: ClientLogoVariant, lockup: 'icon' | 'wordmark', format: ClientLogoFormat, file: File) => {
    const slotKey = `${lockup}-${variant}-${format}`;

    // Run dimension + luminance validation in parallel with the data-URL read.
    const validationPromise = validateWordmarkUpload(file, variant, lockup).catch(() => null);

    const reader = new FileReader();
    reader.onload = async (e) => {
      const url = e.target?.result as string;
      const filtered = formData.files.filter(f => !(f.variant === variant && f.format === format && (f.lockup ?? 'icon') === lockup));
      setFormData(prev => ({ ...prev, files: [...filtered, { variant, format, url, lockup }] }));

      const result = await validationPromise;
      if (result) {
        setUploadValidations(prev => ({ ...prev, [slotKey]: result }));
        if (result.status === 'fail') {
          toast.error(`${VARIANT_LABELS[variant]} ${lockup}: ${result.messages[0] ?? 'Validation failed'}`);
        } else if (result.status === 'warn') {
          toast.warning(`${VARIANT_LABELS[variant]} ${lockup}: ${result.messages[0] ?? 'Check upload'}`);
        } else {
          toast.success(`${lockup === 'wordmark' ? 'Wordmark ' : ''}${VARIANT_LABELS[variant]} ${FORMAT_LABELS[format]} added`);
        }
      } else {
        toast.success(`${lockup === 'wordmark' ? 'Wordmark ' : ''}${VARIANT_LABELS[variant]} ${FORMAT_LABELS[format]} added`);
      }
    };
    reader.readAsDataURL(file);
  };




  const handleAIGenerate = async () => {
    if (!organization?.id || !formData.name.trim()) {
      toast.error('Enter a company name first');
      return;
    }
    setIsGenerating(true);
    setGenerateProgress(0);

    let colorLogoUrl: string | null = null;

    // Step 1: Fetch the real color logo from the web
    setGeneratingVariant('color');
    try {
      const { data, error } = await supabase.functions.invoke('generate-client-logo', {
        body: {
          companyName: formData.name.trim(),
          variant: 'color',
          organizationId: organization.id,
          websiteUrl: formData.websiteUrl?.trim() || undefined,
        },
      });

      if (error) throw error;
      if (data?.error) {
        toast.error(data.error);
        setIsGenerating(false);
        setGeneratingVariant(null);
        return;
      }

      if (data?.url) {
        colorLogoUrl = data.url;
        const newFile: ClientLogoFile = { variant: 'color', format: 'png', url: data.url };
        setFormData(prev => ({
          ...prev,
          files: [...prev.files.filter(f => !(f.variant === 'color' && f.format === 'png')), newFile],
        }));
      }
    } catch (err) {
      console.error('[Logo Fetch] color failed:', err);
      toast.error('Failed to find company logo. Try adding the website URL.');
      setIsGenerating(false);
      setGeneratingVariant(null);
      return;
    }
    setGenerateProgress(33);

    // Step 2 & 3: Create white and black variants using AI conversion
    const monochromeVariants: ClientLogoVariant[] = ['white', 'black'];
    let completedCount = 1;

    for (const variant of monochromeVariants) {
      setGeneratingVariant(variant);
      try {
        const { data, error } = await supabase.functions.invoke('generate-client-logo', {
          body: {
            companyName: formData.name.trim(),
            variant,
            organizationId: organization.id,
            colorLogoUrl,
          },
        });

        if (error) throw error;
        if (data?.error) {
          if (data.error.includes('Rate limit') || data.error.includes('credits')) {
            toast.error(data.error);
            break;
          }
          toast.error(`${variant}: ${data.error}`);
          continue;
        }

        if (data?.url) {
          const newFile: ClientLogoFile = { variant, format: 'png', url: data.url };
          setFormData(prev => ({
            ...prev,
            files: [...prev.files.filter(f => !(f.variant === variant && f.format === 'png')), newFile],
          }));
        }
      } catch (err) {
        console.error(`[Logo Fetch] ${variant} failed:`, err);
        toast.error(`Failed to create ${variant} variant`);
      }

      completedCount++;
      setGenerateProgress(Math.round((completedCount / 3) * 100));
    }

    setIsGenerating(false);
    setGeneratingVariant(null);
    setGenerateProgress(100);
    toast.success(`Logo discovery complete for "${formData.name.trim()}"`);
  };

  const getPreviewUrl = (files: ClientLogoFile[], variant: ClientLogoVariant, lockup: 'icon' | 'wordmark' = 'icon'): string | null => {
    // Prefer seeded SVG data URLs because Simple Icons' CDN often serves SVGs
    // from PNG-looking URLs, and some branded CDN color URLs 404.
    const matches = files.filter(f => f.variant === variant && (f.lockup ?? 'icon') === lockup);
    return matches.find(f => f.format === 'svg')?.url
      || matches.find(f => f.format === 'png')?.url
      || null;
  };


  const categories = Array.from(new Set([...DEFAULT_CATEGORIES, ...logos.map(l => l.category)])).sort();

  const filteredLogos = logos.filter(l => {
    const matchesSearch = !searchTerm || l.name.toLowerCase().includes(searchTerm.toLowerCase()) || l.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || l.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const groupedLogos = filteredLogos.reduce<Record<string, GlobalClientLogo[]>>((acc, logo) => {
    if (!acc[logo.category]) acc[logo.category] = [];
    acc[logo.category].push(logo);
    return acc;
  }, {});

  const FileUploadCell = ({ variant, lockup, format }: { variant: ClientLogoVariant; lockup: 'icon' | 'wordmark'; format: ClientLogoFormat }) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const existingUrl = formData.files.find(f => f.variant === variant && f.format === format && (f.lockup ?? 'icon') === lockup)?.url;
    
    return (
      <div>
        <input
          ref={inputRef}
          type="file"
          accept={format === 'eps' ? '.eps' : format === 'svg' ? '.svg,image/svg+xml' : 'image/png'}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleLocalFileUpload(variant, lockup, format, file);
          }}
          className="hidden"
        />
        {existingUrl ? (
          <button
            onClick={() => inputRef.current?.click()}
            className="w-full h-9 bg-green-100 dark:bg-green-900/30 rounded flex items-center justify-center gap-1 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors"
          >
            <Download className="h-3 w-3" />
            <span className="text-xs font-medium">{FORMAT_LABELS[format]}</span>
          </button>
        ) : (
          <button
            onClick={() => inputRef.current?.click()}
            className="w-full h-9 border-2 border-dashed border-muted-foreground/30 rounded flex items-center justify-center gap-1 text-muted-foreground hover:border-primary hover:text-primary transition-colors"
          >
            <Upload className="h-3 w-3" />
            <span className="text-xs">{FORMAT_LABELS[format]}</span>
          </button>
        )}
      </div>
    );
  };


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">Global Logo Hub</h2>
          <p className="text-sm text-muted-foreground">Master library of client logos — brands and products can import from here</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={handleSeedPartnerLink}
            disabled={isSeedingPartners}
            className="gap-2"
            title="Bulk-import the curated PartnerLink integration partners with color + white + black SVG/PNG assets"
          >
            {isSeedingPartners ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            Seed PartnerLink
          </Button>
          <Button
            variant="outline"
            onClick={handleSeedMedia}
            disabled={isSeedingPartners}
            className="gap-2"
            title="Bulk-import curated Media & entertainment brands with color + white + black SVG/PNG assets"
          >
            {isSeedingPartners ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            Seed Media
          </Button>
          <Button
            variant="outline"
            onClick={handleSeedGeneral}
            disabled={isSeedingPartners}
            className="gap-2"
            title="Bulk-import curated General consumer brands with color + white + black SVG/PNG assets"
          >
            {isSeedingPartners ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            Seed General
          </Button>
          <Button onClick={() => { resetForm(); setAddDialogOpen(true); }} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Logo
          </Button>
        </div>

      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search logos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[180px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map(c => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Badge variant="secondary" className="h-10 px-3 flex items-center">
          {filteredLogos.length} logo{filteredLogos.length !== 1 ? 's' : ''}
        </Badge>
      </div>

      {/* Logo Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : filteredLogos.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed rounded-xl">
          <p className="font-medium text-muted-foreground">
            {logos.length === 0 ? 'No logos in the global library yet' : 'No logos match your search'}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {logos.length === 0 ? 'Add your first client logo to get started' : 'Try adjusting your filters'}
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedLogos).sort(([a], [b]) => a.localeCompare(b)).map(([category, catLogos]) => (
            <div key={category}>
              <div className="flex items-center gap-2 mb-4">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">{category}</h3>
                <Badge variant="outline" className="text-xs">{catLogos.length}</Badge>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {catLogos.map(logo => {
                  const colorPreview = getPreviewUrl(logo.files, 'color', 'icon');
                  const whitePreview = getPreviewUrl(logo.files, 'white', 'icon');
                  const blackPreview = getPreviewUrl(logo.files, 'black', 'icon');
                  const wmColorPreview = getPreviewUrl(logo.files, 'color', 'wordmark');
                  const wmWhitePreview = getPreviewUrl(logo.files, 'white', 'wordmark');
                  const wmBlackPreview = getPreviewUrl(logo.files, 'black', 'wordmark');
                  const hasWordmark = !!(wmColorPreview || wmWhitePreview || wmBlackPreview);
                  const validation = validations[logo.id];
                  const isThisValidating = validatingId === logo.id;

                  return (
                    <Card key={logo.id} className="group overflow-hidden hover:border-primary/50 transition-colors">
                      {/* Icon row */}
                      <div className="px-2 pt-1 text-[9px] uppercase tracking-wider text-muted-foreground font-medium">Icon</div>
                      <div className="grid grid-cols-3 divide-x divide-border border-b">
                        <div className="aspect-[4/3] bg-white flex items-center justify-center p-3">
                          {colorPreview ? (
                            <img src={colorPreview} alt={`${logo.name} color icon`} className="max-h-full max-w-full object-contain" />
                          ) : <span className="text-[10px] text-muted-foreground">—</span>}
                        </div>
                        <div className="aspect-[4/3] bg-slate-900 flex items-center justify-center p-3">
                          {whitePreview ? (
                            <img src={whitePreview} alt={`${logo.name} white icon`} className="max-h-full max-w-full object-contain" />
                          ) : <span className="text-[10px] text-slate-500">—</span>}
                        </div>
                        <div className="aspect-[4/3] bg-white flex items-center justify-center p-3">
                          {blackPreview ? (
                            <img src={blackPreview} alt={`${logo.name} black icon`} className="max-h-full max-w-full object-contain" />
                          ) : <span className="text-[10px] text-muted-foreground">—</span>}
                        </div>
                      </div>
                      {/* Wordmark row */}
                      <div className="px-2 pt-1 text-[9px] uppercase tracking-wider text-muted-foreground font-medium">Wordmark{!hasWordmark && <span className="ml-1 normal-case text-muted-foreground/60">— add via Edit</span>}</div>
                      <div className="grid grid-cols-3 divide-x divide-border border-b">
                        <div className="aspect-[4/3] bg-white flex items-center justify-center p-3">
                          {wmColorPreview ? (
                            <img src={wmColorPreview} alt={`${logo.name} color wordmark`} className="max-h-full max-w-full object-contain" />
                          ) : <span className="text-[10px] text-muted-foreground">—</span>}
                        </div>
                        <div className="aspect-[4/3] bg-slate-900 flex items-center justify-center p-3">
                          {wmWhitePreview ? (
                            <img src={wmWhitePreview} alt={`${logo.name} white wordmark`} className="max-h-full max-w-full object-contain" />
                          ) : <span className="text-[10px] text-slate-500">—</span>}
                        </div>
                        <div className="aspect-[4/3] bg-white flex items-center justify-center p-3">
                          {wmBlackPreview ? (
                            <img src={wmBlackPreview} alt={`${logo.name} black wordmark`} className="max-h-full max-w-full object-contain" />
                          ) : <span className="text-[10px] text-muted-foreground">—</span>}
                        </div>
                      </div>
                      <div className="grid grid-cols-3 text-center text-[10px] font-medium text-muted-foreground border-b divide-x divide-border">
                        <span className="py-1">Color</span>
                        <span className="py-1">White</span>
                        <span className="py-1">Black</span>
                      </div>


                      <CardContent className="p-3 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <h4 className="font-semibold text-sm truncate">{logo.name}</h4>
                            {logo.description && (
                              <p className="text-xs text-muted-foreground truncate">{logo.description}</p>
                            )}
                            <Badge variant="outline" className="text-[10px] mt-1">{logo.category}</Badge>
                          </div>
                          <div className="flex gap-1 shrink-0">
                            <button onClick={() => openEdit(logo)} className="p-1.5 rounded-md hover:bg-secondary" title="Edit">
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button onClick={() => runValidation(logo)} className="p-1.5 rounded-md hover:bg-secondary" title="Re-validate files" disabled={isThisValidating}>
                              {isThisValidating
                                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                : <RefreshCw className="h-3.5 w-3.5" />}
                            </button>
                            <button onClick={() => handleDelete(logo.id)} className="p-1.5 rounded-md hover:bg-destructive hover:text-destructive-foreground" title="Delete">
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Validation status */}
                        <ValidationBadge
                          logo={logo}
                          validation={validation}
                          isValidating={isThisValidating || (!validation && isValidatingAll)}
                          isExempt={exemptIds.has(logo.id)}
                          isResyncing={resyncingId === logo.id}
                          onResync={() => handleResyncOne(logo)}
                          onEdit={() => openEdit(logo)}
                          onToggleExempt={() => toggleExempt(logo.id)}
                        />

                        <div className="text-xs text-muted-foreground">
                          {logo.files.length} file{logo.files.length !== 1 ? 's' : ''}
                          {logo.website_url && (
                            <a href={logo.website_url} target="_blank" rel="noopener noreferrer" className="ml-2 text-primary hover:underline inline-flex items-center gap-0.5">
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={(open) => { if (!open) resetForm(); }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingLogo ? 'Edit Logo' : 'Add Logo to Global Library'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Name *</Label>
                <Input value={formData.name} onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))} placeholder="e.g., Acme Corp" />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={formData.category} onValueChange={(v) => setFormData(p => ({ ...p, category: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {DEFAULT_CATEGORIES.map(c => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Description</Label>
                <Input value={formData.description} onChange={(e) => setFormData(p => ({ ...p, description: e.target.value }))} placeholder="Brief description" />
              </div>
              <div className="space-y-2">
                <Label>Website URL</Label>
                <Input value={formData.websiteUrl} onChange={(e) => setFormData(p => ({ ...p, websiteUrl: e.target.value }))} placeholder="https://..." />
              </div>
            </div>
            
            {/* AI Logo Discovery */}
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <Label className="font-semibold">Logo Discovery</Label>
                </div>
                <Badge variant="outline" className="text-[10px]">Finds real logos</Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Searches the web for the company's actual logo, then creates White and Black variants automatically. 
                Add the website URL above for best results.
              </p>
              {isGenerating && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">
                      {generatingVariant === 'color' 
                        ? 'Searching the web for logo...' 
                        : <>Creating <span className="font-medium text-foreground">{generatingVariant}</span> variant...</>
                      }
                    </span>
                    <span className="font-medium">{generateProgress}%</span>
                  </div>
                  <Progress value={generateProgress} className="h-2" />
                </div>
              )}
              <Button
                variant="outline"
                onClick={handleAIGenerate}
                disabled={!formData.name.trim() || isGenerating}
                className="w-full gap-2"
              >
                {isGenerating ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Finding logos...</>
                ) : (
                  <><Sparkles className="h-4 w-4" /> Find Logos for "{formData.name || '...'}"</>
                )}
              </Button>
            </div>

            {/* File uploads per variant — Icon + Wordmark */}
            {(['icon', 'wordmark'] as const).map(lockup => (
              <div key={lockup} className="space-y-2">
                <Label>{lockup === 'icon' ? 'Icon / Logomark Files' : 'Wordmark / Full Logo Files'}</Label>
                <p className="text-xs text-muted-foreground">
                  {lockup === 'icon'
                    ? 'Square symbol or logomark (e.g. the Salesforce cloud).'
                    : 'Full horizontal logo with brand name (e.g. "salesforce" wordmark).'}
                </p>
                <div className="grid grid-cols-3 gap-4">
                  {(['color', 'white', 'black'] as ClientLogoVariant[]).map(variant => {
                    const previewUrl = getPreviewUrl(formData.files, variant, lockup);
                    // Find the most recently uploaded format's validation for this slot.
                    const slotValidation = (['png', 'svg', 'eps'] as ClientLogoFormat[])
                      .map(fmt => uploadValidations[`${lockup}-${variant}-${fmt}`])
                      .find(Boolean);
                    return (
                    <div key={`${lockup}-${variant}`} className="space-y-2">
                      <div className="text-sm font-medium text-center">{VARIANT_LABELS[variant]}</div>
                      <div className={cn("rounded-lg p-2 space-y-1.5", VARIANT_BG[variant])}>
                        {/* Preview — object-contain inside the 4:3 cell. Center markers prove no cropping. */}
                        {previewUrl && (
                          <div className="relative aspect-[4/3] flex items-center justify-center p-2 mb-1 overflow-hidden rounded">
                            {/* Dashed safe-area outline visualizes the contain box */}
                            <div className="absolute inset-2 border border-dashed border-current/20 rounded pointer-events-none" />
                            <img
                              src={previewUrl}
                              alt={`${lockup} ${variant}`}
                              className="max-h-full max-w-full object-contain relative z-10"
                            />
                          </div>
                        )}
                        {(['png', 'svg', 'eps'] as ClientLogoFormat[]).map(format => (
                          <FileUploadCell key={`${lockup}-${variant}-${format}`} variant={variant} lockup={lockup} format={format} />
                        ))}
                      </div>
                      {/* Validation badge — confirms object-contain sizing and surfaces warnings */}
                      {slotValidation && (
                        <div className={cn(
                          "text-[10px] rounded-md px-2 py-1.5 border space-y-0.5",
                          slotValidation.status === 'pass' && "bg-green-50 dark:bg-green-950/40 border-green-200 dark:border-green-900 text-green-800 dark:text-green-300",
                          slotValidation.status === 'warn' && "bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-300",
                          slotValidation.status === 'fail' && "bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-900 text-red-800 dark:text-red-300",
                        )}>
                          <div className="flex items-center justify-between gap-1 font-medium">
                            <span className="uppercase tracking-wider text-[9px]">
                              {slotValidation.status === 'pass' ? '✓ Fits' : slotValidation.status === 'warn' ? '⚠ Check' : '✕ Invalid'}
                            </span>
                            {slotValidation.width > 0 && (
                              <span className="font-mono text-[9px] opacity-80">
                                {slotValidation.width}×{slotValidation.height} → {slotValidation.fittedWidth}×{slotValidation.fittedHeight}
                              </span>
                            )}
                          </div>
                          {slotValidation.messages.map((msg, i) => (
                            <div key={i} className="leading-snug">{msg}</div>
                          ))}
                        </div>
                      )}
                      <ImageLibraryPicker
                        onSelect={(url) => handleFileUploadFromLibrary(variant, lockup, url)}
                        trigger={
                          <Button variant="outline" size="sm" className="w-full text-xs gap-1">
                            <FolderArchive className="h-3 w-3" />
                            From Library
                          </Button>
                        }
                      />
                    </div>
                  );})}

                </div>
              </div>
            ))}

            
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={resetForm}>Cancel</Button>
              <Button onClick={handleSave} disabled={!formData.name.trim() || isSaving}>
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                {editingLogo ? 'Save Changes' : 'Add to Library'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ValidationBadge({
  logo,
  validation,
  isValidating,
  isExempt,
  isResyncing,
  onResync,
  onEdit,
  onToggleExempt,
}: {
  logo: GlobalClientLogo;
  validation: LogoValidationResult | undefined;
  isValidating: boolean;
  isExempt: boolean;
  isResyncing: boolean;
  onResync: () => void;
  onEdit: () => void;
  onToggleExempt: () => void;
}) {
  if (!logo.files.length) {
    return (
      <div className="flex items-center justify-between gap-2 text-[11px] text-amber-600 dark:text-amber-400">
        <div className="flex items-center gap-1.5 min-w-0">
          <ShieldAlert className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">No files uploaded</span>
        </div>
        <ActionStrip
          isResyncing={isResyncing}
          isExempt={isExempt}
          onResync={onResync}
          onEdit={onEdit}
          onToggleExempt={onToggleExempt}
        />
      </div>
    );
  }
  if (!validation) {
    return (
      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
        {isValidating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ShieldCheck className="h-3.5 w-3.5 opacity-40" />}
        <span>{isValidating ? 'Validating files…' : 'Not validated'}</span>
      </div>
    );
  }
  if (validation.ok) {
    const variants = Array.from(new Set(validation.files.map((f) => f.variant))).sort();
    const sizes = validation.files
      .filter((f) => f.format === 'png' && f.width)
      .map((f) => `${f.variant} ${f.width}×${f.height}`);
    return (
      <div className="flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400" title={sizes.join(' · ')}>
        <ShieldCheck className="h-3.5 w-3.5" />
        <span>All {validation.files.length} files valid · {variants.join(' / ')}</span>
      </div>
    );
  }
  const failingFiles = validation.files.filter((f) => !f.ok);

  if (isExempt) {
    return (
      <div className="flex items-center justify-between gap-2 text-[11px] text-muted-foreground italic">
        <div className="flex items-center gap-1.5 min-w-0">
          <EyeOff className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">
            {failingFiles.length} issue{failingFiles.length !== 1 ? 's' : ''} — exempt
          </span>
        </div>
        <button
          type="button"
          onClick={onToggleExempt}
          className="p-1 rounded hover:bg-secondary"
          title="Un-exempt — re-enable alerts"
        >
          <Eye className="h-3 w-3" />
        </button>
      </div>
    );
  }

  return (
    <TooltipProvider delayDuration={150}>
      <div className="flex items-center justify-between gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              className="flex items-center gap-1.5 text-[11px] text-destructive hover:underline min-w-0"
            >
              <ShieldAlert className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">
                {failingFiles.length} file{failingFiles.length !== 1 ? 's' : ''} failed validation
              </span>
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-xs text-xs space-y-2">
            {failingFiles.map((f, idx) => (
              <div key={idx} className="space-y-0.5">
                <div className="font-medium capitalize">
                  {f.variant} · {f.format.toUpperCase()}
                  {f.width ? ` · ${f.width}×${f.height}` : ''}
                </div>
                <ul className="list-disc pl-4 text-muted-foreground">
                  {f.issues.map((issue) => (
                    <li key={issue}>{ISSUE_LABELS[issue]}</li>
                  ))}
                </ul>
              </div>
            ))}
          </TooltipContent>
        </Tooltip>
        <ActionStrip
          isResyncing={isResyncing}
          isExempt={isExempt}
          onResync={onResync}
          onEdit={onEdit}
          onToggleExempt={onToggleExempt}
        />
      </div>
    </TooltipProvider>
  );
}

function ActionStrip({
  isResyncing,
  isExempt,
  onResync,
  onEdit,
  onToggleExempt,
}: {
  isResyncing: boolean;
  isExempt: boolean;
  onResync: () => void;
  onEdit: () => void;
  onToggleExempt: () => void;
}) {
  return (
    <div className="flex items-center gap-0.5 shrink-0">
      <button
        type="button"
        onClick={onResync}
        disabled={isResyncing}
        className="p-1 rounded hover:bg-secondary disabled:opacity-50"
        title="Re-download files from source"
      >
        {isResyncing ? <Loader2 className="h-3 w-3 animate-spin" /> : <Download className="h-3 w-3" />}
      </button>
      <button
        type="button"
        onClick={onEdit}
        className="p-1 rounded hover:bg-secondary"
        title="Edit / upload manually"
      >
        <Upload className="h-3 w-3" />
      </button>
      <button
        type="button"
        onClick={onToggleExempt}
        className="p-1 rounded hover:bg-secondary"
        title={isExempt ? 'Re-enable alerts' : 'Mark as exempt'}
      >
        {isExempt ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
      </button>
    </div>
  );
}
