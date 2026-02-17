import { useState, useEffect, useCallback } from 'react';
import { Search, Check, Loader2, Filter, Globe2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { ClientLogo, ClientLogoFile, ClientLogoVariant } from '@/types/brand';

interface GlobalLogoPickerDialogProps {
  /** Already-used logo IDs to show as "already added" */
  existingLogoNames?: string[];
  /** Called when user confirms selection */
  onImport: (logos: ClientLogo[]) => void;
  trigger?: React.ReactNode;
}

interface GlobalClientLogo {
  id: string;
  name: string;
  description: string | null;
  category: string;
  website_url: string | null;
  files: ClientLogoFile[];
}

const getPreviewUrl = (files: ClientLogoFile[]): { url: string; isWhite: boolean } | null => {
  // Prefer color, then black, then white variant; prefer png over svg
  for (const variant of ['color', 'black', 'white'] as ClientLogoVariant[]) {
    const png = files.find(f => f.variant === variant && f.format === 'png');
    if (png) return { url: png.url, isWhite: variant === 'white' };
    const svg = files.find(f => f.variant === variant && f.format === 'svg');
    if (svg) return { url: svg.url, isWhite: variant === 'white' };
  }
  // Fallback: any file
  if (files.length > 0) return { url: files[0].url, isWhite: /white/i.test(files[0].variant) };
  return null;
};

export function GlobalLogoPickerDialog({ existingLogoNames = [], onImport, trigger }: GlobalLogoPickerDialogProps) {
  const { organization } = useOrganization();
  const [open, setOpen] = useState(false);
  const [logos, setLogos] = useState<GlobalClientLogo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const fetchLogos = useCallback(async () => {
    if (!organization?.id) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('global_client_logos')
        .select('id, name, description, category, website_url, files')
        .eq('organization_id', organization.id)
        .order('category')
        .order('name');
      
      if (error) throw error;
      setLogos((data || []).map(d => ({
        ...d,
        files: (Array.isArray(d.files) ? d.files : []) as unknown as ClientLogoFile[],
      })));
    } catch (err) {
      console.error('Failed to fetch global logos:', err);
    } finally {
      setIsLoading(false);
    }
  }, [organization?.id]);

  useEffect(() => {
    if (open) {
      fetchLogos();
      setSelectedIds(new Set());
      setSearchTerm('');
      setCategoryFilter('all');
    }
  }, [open, fetchLogos]);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleImport = () => {
    const selected = logos.filter(l => selectedIds.has(l.id));
    const clientLogos: ClientLogo[] = selected.map(l => ({
      id: crypto.randomUUID(),
      name: l.name,
      description: l.description || undefined,
      files: l.files,
      websiteUrl: l.website_url || undefined,
    }));
    onImport(clientLogos);
    toast.success(`Imported ${clientLogos.length} logo${clientLogos.length !== 1 ? 's' : ''} from global library`);
    setOpen(false);
  };

  const categories = Array.from(new Set(logos.map(l => l.category))).sort();

  const filteredLogos = logos.filter(l => {
    const matchesSearch = !searchTerm || l.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || l.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const isAlreadyAdded = (name: string) => existingLogoNames.some(n => n.toLowerCase() === name.toLowerCase());

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="gap-2">
            <Globe2 className="h-4 w-4" />
            Import from Global Library
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Globe2 className="h-5 w-5" />
            Import from Global Logo Library
          </DialogTitle>
        </DialogHeader>

        {/* Filters */}
        <div className="flex gap-3 pt-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search logos..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9" />
          </div>
          {categories.length > 1 && (
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[160px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Logo Grid */}
        <ScrollArea className="flex-1 min-h-0 -mx-6 px-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredLogos.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p className="font-medium">{logos.length === 0 ? 'No logos in the global library' : 'No matches found'}</p>
              <p className="text-sm mt-1">{logos.length === 0 ? 'Add logos in Admin → Logo Hub first' : 'Adjust your search'}</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 py-2">
              {filteredLogos.map(logo => {
                const isSelected = selectedIds.has(logo.id);
                const alreadyAdded = isAlreadyAdded(logo.name);
                const preview = getPreviewUrl(logo.files);
                
                return (
                  <button
                    key={logo.id}
                    onClick={() => !alreadyAdded && toggleSelect(logo.id)}
                    disabled={alreadyAdded}
                    className={cn(
                      "relative border rounded-lg overflow-hidden text-left transition-all",
                      isSelected ? "border-primary ring-2 ring-primary/20" : "border-border hover:border-primary/50",
                      alreadyAdded && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    {/* Check indicator */}
                    {isSelected && (
                      <div className="absolute top-2 right-2 z-10 h-5 w-5 bg-primary rounded-full flex items-center justify-center">
                        <Check className="h-3 w-3 text-primary-foreground" />
                      </div>
                    )}
                    {alreadyAdded && (
                      <div className="absolute top-2 right-2 z-10">
                        <Badge variant="secondary" className="text-[10px]">Added</Badge>
                      </div>
                    )}
                    
                    {/* Preview */}
                    <div className={cn(
                      "aspect-square flex items-center justify-center p-4",
                      preview?.isWhite ? "bg-gray-900" : "bg-white"
                    )}>
                      {preview ? (
                        <img src={preview.url} alt={logo.name} className="max-h-full max-w-full object-contain" />
                      ) : (
                        <span className="text-xs text-muted-foreground">No preview</span>
                      )}
                    </div>
                    
                    <div className="p-2 border-t">
                      <p className="text-xs font-medium truncate">{logo.name}</p>
                      <p className="text-[10px] text-muted-foreground">{logo.category} • {logo.files.length} files</p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t">
          <span className="text-sm text-muted-foreground">
            {selectedIds.size} selected
          </span>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleImport} disabled={selectedIds.size === 0}>
              Import {selectedIds.size > 0 ? `(${selectedIds.size})` : ''}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
