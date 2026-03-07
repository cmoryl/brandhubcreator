import { useState, useEffect, useRef, useCallback } from 'react';
import { Plus, Search, Trash2, Pencil, Upload, Download, ExternalLink, FolderArchive, Loader2, Filter, Sparkles } from 'lucide-react';
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

const DEFAULT_CATEGORIES = ['Technology', 'Retail', 'Healthcare', 'Finance', 'Media', 'Automotive', 'Consumer Goods', 'Hospitality', 'Gaming', 'Studios', 'General'];

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
      setLogos((data || []).map(d => ({
        ...d,
        files: (Array.isArray(d.files) ? d.files : []) as unknown as ClientLogoFile[],
      })));
    } catch (err) {
      console.error('Failed to fetch global logos:', err);
      toast.error('Failed to load logo library');
    } finally {
      setIsLoading(false);
    }
  }, [organization?.id]);

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
    setAddDialogOpen(true);
  };

  const handleFileUploadFromLibrary = (variant: ClientLogoVariant, url: string) => {
    const format: ClientLogoFormat = 'png';
    const filtered = formData.files.filter(f => !(f.variant === variant && f.format === format));
    setFormData(prev => ({ ...prev, files: [...filtered, { variant, format, url }] }));
    toast.success(`${VARIANT_LABELS[variant]} logo added`);
  };

  const handleLocalFileUpload = (variant: ClientLogoVariant, format: ClientLogoFormat, file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const url = e.target?.result as string;
      const filtered = formData.files.filter(f => !(f.variant === variant && f.format === format));
      setFormData(prev => ({ ...prev, files: [...filtered, { variant, format, url }] }));
      toast.success(`${VARIANT_LABELS[variant]} ${FORMAT_LABELS[format]} added`);
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

    const variants: ClientLogoVariant[] = ['color', 'white', 'black'];
    let completedCount = 0;

    for (const variant of variants) {
      setGeneratingVariant(variant);
      try {
        const { data, error } = await supabase.functions.invoke('generate-client-logo', {
          body: {
            companyName: formData.name.trim(),
            variant,
            organizationId: organization.id,
          },
        });

        if (error) throw error;
        if (data?.error) {
          // Handle specific status codes
          if (data.error.includes('Rate limit')) {
            toast.error(data.error);
            break;
          }
          if (data.error.includes('credits')) {
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
        console.error(`[AI Generate] ${variant} failed:`, err);
        toast.error(`Failed to generate ${variant} variant`);
      }

      completedCount++;
      setGenerateProgress(Math.round((completedCount / variants.length) * 100));
    }

    setIsGenerating(false);
    setGeneratingVariant(null);
    setGenerateProgress(100);
    toast.success(`AI logo generation complete for "${formData.name.trim()}"`);
  };

  const getPreviewUrl = (files: ClientLogoFile[], variant: ClientLogoVariant): string | null => {
    return files.find(f => f.variant === variant && f.format === 'png')?.url
      || files.find(f => f.variant === variant && f.format === 'svg')?.url
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

  const FileUploadCell = ({ variant, format }: { variant: ClientLogoVariant; format: ClientLogoFormat }) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const existingUrl = formData.files.find(f => f.variant === variant && f.format === format)?.url;
    
    return (
      <div>
        <input
          ref={inputRef}
          type="file"
          accept={format === 'eps' ? '.eps' : format === 'svg' ? '.svg,image/svg+xml' : 'image/png'}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleLocalFileUpload(variant, format, file);
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
        <Button onClick={() => { resetForm(); setAddDialogOpen(true); }} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Logo
        </Button>
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
                  const colorPreview = getPreviewUrl(logo.files, 'color');
                  const whitePreview = getPreviewUrl(logo.files, 'white');
                  const blackPreview = getPreviewUrl(logo.files, 'black');
                  
                  return (
                    <Card key={logo.id} className="group overflow-hidden hover:border-primary/50 transition-colors">
                      {/* 3-variant preview */}
                      <div className="grid grid-cols-3 divide-x divide-border border-b">
                        <div className="aspect-[4/3] bg-white flex items-center justify-center p-3">
                          {colorPreview ? (
                            <img src={colorPreview} alt={`${logo.name} color`} className="max-h-full max-w-full object-contain" />
                          ) : <span className="text-[10px] text-muted-foreground">—</span>}
                        </div>
                        <div className="aspect-[4/3] bg-slate-900 flex items-center justify-center p-3">
                          {whitePreview ? (
                            <img src={whitePreview} alt={`${logo.name} white`} className="max-h-full max-w-full object-contain" />
                          ) : <span className="text-[10px] text-slate-500">—</span>}
                        </div>
                        <div className="aspect-[4/3] bg-white flex items-center justify-center p-3">
                          {blackPreview ? (
                            <img src={blackPreview} alt={`${logo.name} black`} className="max-h-full max-w-full object-contain" />
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
                            <button onClick={() => openEdit(logo)} className="p-1.5 rounded-md hover:bg-secondary">
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button onClick={() => handleDelete(logo.id)} className="p-1.5 rounded-md hover:bg-destructive hover:text-destructive-foreground">
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
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
            
            {/* File uploads per variant */}
            <div className="space-y-2">
              <Label>Logo Files</Label>
              <p className="text-xs text-muted-foreground">Upload files or pick from the image library for each variant</p>
              <div className="grid grid-cols-3 gap-4">
                {(['color', 'white', 'black'] as ClientLogoVariant[]).map(variant => (
                  <div key={variant} className="space-y-2">
                    <div className="text-sm font-medium text-center">{VARIANT_LABELS[variant]}</div>
                    <div className={cn("rounded-lg p-2 space-y-1.5", VARIANT_BG[variant])}>
                      {/* Preview */}
                      {getPreviewUrl(formData.files, variant) && (
                        <div className="aspect-[4/3] flex items-center justify-center p-2 mb-1">
                          <img src={getPreviewUrl(formData.files, variant)!} alt={variant} className="max-h-full max-w-full object-contain" />
                        </div>
                      )}
                      {(['png', 'svg', 'eps'] as ClientLogoFormat[]).map(format => (
                        <FileUploadCell key={`${variant}-${format}`} variant={variant} format={format} />
                      ))}
                    </div>
                    <ImageLibraryPicker
                      onSelect={(url) => handleFileUploadFromLibrary(variant, url)}
                      trigger={
                        <Button variant="outline" size="sm" className="w-full text-xs gap-1">
                          <FolderArchive className="h-3 w-3" />
                          From Library
                        </Button>
                      }
                    />
                  </div>
                ))}
              </div>
            </div>
            
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
