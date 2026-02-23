import { useState, useRef, useMemo } from 'react';
import { useOrganization } from '@/contexts/OrganizationContext';
import { Download, Upload, Plus, Trash2, ExternalLink, Pencil, Package, FolderArchive, Globe2, ArrowUpDown, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { ClientLogo, ClientLogoFile, ClientLogoVariant, ClientLogoFormat } from '@/types/brand';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SectionHeader } from './SectionHeader';
import { GlobalLogoPickerDialog } from './GlobalLogoPickerDialog';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import JSZip from 'jszip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useStorageUpload } from '@/hooks/useStorageUpload';

interface ClientLogosSectionProps {
  clientLogos: ClientLogo[];
  onClientLogosChange?: (clientLogos: ClientLogo[]) => void;
  customSubtitle?: string;
  onSubtitleChange?: (subtitle: string) => void;
  entityId?: string;
  entityType?: 'brand' | 'product' | 'event';
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

export const ClientLogosSection = ({
  clientLogos,
  onClientLogosChange,
  customSubtitle,
  onSubtitleChange,
  entityId,
  entityType = 'brand',
}: ClientLogosSectionProps) => {
  const [isHeaderEditing, setIsHeaderEditing] = useState(false);
  const { organization } = useOrganization();
  const [editingLogoId, setEditingLogoId] = useState<string | null>(null);
  const [previewLogo, setPreviewLogo] = useState<ClientLogo | null>(null);
  const [activeVariant, setActiveVariant] = useState<ClientLogoVariant>('color');
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newLogo, setNewLogo] = useState<Partial<ClientLogo>>({ name: '', description: '', files: [] });
  const [sortOption, setSortOption] = useState<'default' | 'name-asc' | 'name-desc' | 'files-desc'>('default');
  const [isExpanded, setIsExpanded] = useState(false);
  const { uploadFile, isUploading } = useStorageUpload({ entityType, entityId });

  const VISIBLE_COUNT = 6;

  const sortedLogos = useMemo(() => {
    const logos = [...clientLogos];
    switch (sortOption) {
      case 'name-asc':
        return logos.sort((a, b) => a.name.localeCompare(b.name));
      case 'name-desc':
        return logos.sort((a, b) => b.name.localeCompare(a.name));
      case 'files-desc':
        return logos.sort((a, b) => b.files.length - a.files.length);
      default:
        return logos;
    }
  }, [clientLogos, sortOption]);

  const hasMoreLogos = sortedLogos.length > VISIBLE_COUNT;
  const visibleLogos = isExpanded || !hasMoreLogos ? sortedLogos : sortedLogos.slice(0, VISIBLE_COUNT);
  const hiddenCount = sortedLogos.length - VISIBLE_COUNT;

  const canEdit = Boolean(onClientLogosChange);

  const handleAddLogo = () => {
    if (!onClientLogosChange || !newLogo.name) return;
    
    const logo: ClientLogo = {
      id: crypto.randomUUID(),
      name: newLogo.name,
      description: newLogo.description,
      files: newLogo.files || [],
      websiteUrl: newLogo.websiteUrl,
    };
    
    onClientLogosChange([...clientLogos, logo]);
    setNewLogo({ name: '', description: '', files: [] });
    setAddDialogOpen(false);
    toast.success(`${logo.name} added`);
  };

  const handleUpdateLogo = (id: string, updates: Partial<ClientLogo>) => {
    if (!onClientLogosChange) return;
    onClientLogosChange(clientLogos.map(l => l.id === id ? { ...l, ...updates } : l));
  };

  const handleDeleteLogo = (id: string) => {
    if (!onClientLogosChange) return;
    onClientLogosChange(clientLogos.filter(l => l.id !== id));
    toast.success('Logo removed');
  };

  const handleFileUpload = async (logoId: string, variant: ClientLogoVariant, format: ClientLogoFormat, file: File) => {
    if (!onClientLogosChange) return;
    
    let url: string;
    if (entityId) {
      const result = await uploadFile(file, 'logo', `clientlogo-${crypto.randomUUID()}`);
      if (!result) return;
      url = result.url;
    } else {
      const reader = new FileReader();
      url = await new Promise((resolve) => {
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.readAsDataURL(file);
      });
    }

    const logo = clientLogos.find(l => l.id === logoId);
    if (!logo) return;
    const filteredFiles = logo.files.filter(f => !(f.variant === variant && f.format === format));
    const newFile: ClientLogoFile = { variant, format, url };
    handleUpdateLogo(logoId, { files: [...filteredFiles, newFile] });
    toast.success(`${VARIANT_LABELS[variant]} ${FORMAT_LABELS[format]} uploaded`);
  };

  const handleNewLogoFileUpload = async (variant: ClientLogoVariant, format: ClientLogoFormat, file: File) => {
    let url: string;
    if (entityId) {
      const result = await uploadFile(file, 'logo', `clientlogo-new-${crypto.randomUUID()}`);
      if (!result) return;
      url = result.url;
    } else {
      const reader = new FileReader();
      url = await new Promise((resolve) => {
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.readAsDataURL(file);
      });
    }

    const newFile: ClientLogoFile = { variant, format, url };
    const existingFiles = newLogo.files || [];
    const filteredFiles = existingFiles.filter(f => !(f.variant === variant && f.format === format));
    setNewLogo(prev => ({ ...prev, files: [...filteredFiles, newFile] }));
    toast.success(`${VARIANT_LABELS[variant]} ${FORMAT_LABELS[format]} added`);
  };

  const downloadFile = (file: ClientLogoFile, logoName: string) => {
    const link = document.createElement('a');
    link.href = file.url;
    link.download = `${logoName}-${file.variant}.${file.format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Downloaded ${logoName} ${VARIANT_LABELS[file.variant]} ${FORMAT_LABELS[file.format]}`);
  };

  const downloadAllForLogo = async (logo: ClientLogo) => {
    for (const file of logo.files) {
      downloadFile(file, logo.name);
      await new Promise(resolve => setTimeout(resolve, 300));
    }
    toast.success(`Downloaded all ${logo.name} files`);
  };

  const downloadAllAsZip = async () => {
    const allFiles = clientLogos.flatMap(logo => logo.files);
    if (allFiles.length === 0) {
      toast.error('No files to download');
      return;
    }

    toast.loading('Creating ZIP file...', { id: 'zip-download' });
    
    try {
      const zip = new JSZip();
      
      for (const logo of clientLogos) {
        if (logo.files.length === 0) continue;
        
        const folderName = logo.name.replace(/[^a-zA-Z0-9]/g, '_');
        const folder = zip.folder(folderName);
        
        for (const file of logo.files) {
          const fileName = `${file.variant}.${file.format}`;
          
          // Handle base64 data URLs
          if (file.url.startsWith('data:')) {
            const base64Data = file.url.split(',')[1];
            folder?.file(fileName, base64Data, { base64: true });
          } else {
            // For remote URLs, fetch and add
            try {
              const response = await fetch(file.url);
              const blob = await response.blob();
              folder?.file(fileName, blob);
            } catch (err) {
              console.warn(`Failed to fetch ${file.url}`, err);
            }
          }
        }
      }
      
      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'client-logos.zip';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success('ZIP file downloaded!', { id: 'zip-download' });
    } catch (error) {
      console.error('Error creating ZIP:', error);
      toast.error('Failed to create ZIP file', { id: 'zip-download' });
    }
  };

  const getPreviewUrl = (logo: ClientLogo, variant: ClientLogoVariant): string | null => {
    // Prefer PNG, then SVG for preview
    const pngFile = logo.files.find(f => f.variant === variant && f.format === 'png');
    if (pngFile) return pngFile.url;
    
    const svgFile = logo.files.find(f => f.variant === variant && f.format === 'svg');
    if (svgFile) return svgFile.url;
    
    return null;
  };

  const FileUploadCell = ({ logoId, variant, format, existingUrl, isNew }: { 
    logoId: string; 
    variant: ClientLogoVariant; 
    format: ClientLogoFormat;
    existingUrl?: string;
    isNew?: boolean;
  }) => {
    const inputRef = useRef<HTMLInputElement>(null);
    
    const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      
      if (isNew) {
        handleNewLogoFileUpload(variant, format, file);
      } else {
        handleFileUpload(logoId, variant, format, file);
      }
    };
    
    return (
      <div className="relative group">
        <input
          ref={inputRef}
          type="file"
          accept={format === 'eps' ? '.eps' : format === 'svg' ? '.svg,image/svg+xml' : 'image/png'}
          onChange={handleUpload}
          className="hidden"
        />
        {existingUrl ? (
          <button
            onClick={() => downloadFile({ variant, format, url: existingUrl }, 'logo')}
            className="w-full h-10 bg-green-100 dark:bg-green-900/30 rounded flex items-center justify-center gap-1 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
            <span className="text-xs font-medium">{FORMAT_LABELS[format]}</span>
          </button>
        ) : canEdit ? (
          <button
            onClick={() => inputRef.current?.click()}
            className="w-full h-10 border-2 border-dashed border-muted-foreground/30 rounded flex items-center justify-center gap-1 text-muted-foreground hover:border-primary hover:text-primary transition-colors"
          >
            <Upload className="h-3.5 w-3.5" />
            <span className="text-xs">{FORMAT_LABELS[format]}</span>
          </button>
        ) : (
          <div className="w-full h-10 bg-muted/50 rounded flex items-center justify-center">
            <span className="text-xs text-muted-foreground">—</span>
          </div>
        )}
      </div>
    );
  };

  const LogoCard = ({ logo }: { logo: ClientLogo }) => {
    const isEditing = editingLogoId === logo.id;
    const colorPreview = getPreviewUrl(logo, 'color');
    const whitePreview = getPreviewUrl(logo, 'white');
    const blackPreview = getPreviewUrl(logo, 'black');
    
    return (
      <Card className="group overflow-hidden hover:border-primary/50 transition-colors">
        {/* Preview Grid */}
        <div className="grid grid-cols-3 divide-x divide-border border-b">
          {/* Color Preview */}
          <div 
            className="aspect-[4/3] bg-white flex items-center justify-center p-4 cursor-pointer"
            onClick={() => colorPreview && setPreviewLogo(logo)}
          >
            {colorPreview ? (
              <img src={colorPreview} alt={`${logo.name} color`} className="max-h-full max-w-full object-contain" />
            ) : (
              <span className="text-xs text-muted-foreground">No Color</span>
            )}
          </div>
          
          {/* White Preview */}
          <div 
            className="aspect-[4/3] bg-slate-900 flex items-center justify-center p-4 cursor-pointer"
            onClick={() => whitePreview && setPreviewLogo(logo)}
          >
            {whitePreview ? (
              <img src={whitePreview} alt={`${logo.name} white`} className="max-h-full max-w-full object-contain" />
            ) : (
              <span className="text-xs text-slate-500">No White</span>
            )}
          </div>
          
          {/* Black Preview */}
          <div 
            className="aspect-[4/3] bg-white flex items-center justify-center p-4 cursor-pointer"
            onClick={() => blackPreview && setPreviewLogo(logo)}
          >
            {blackPreview ? (
              <img src={blackPreview} alt={`${logo.name} black`} className="max-h-full max-w-full object-contain" />
            ) : (
              <span className="text-xs text-muted-foreground">No Black</span>
            )}
          </div>
        </div>
        
        {/* Variant Labels */}
        <div className="grid grid-cols-3 text-center text-[10px] font-medium text-muted-foreground border-b divide-x divide-border">
          <span className="py-1.5">Color</span>
          <span className="py-1.5">White</span>
          <span className="py-1.5">Black</span>
        </div>
        
        <CardContent className="p-4 space-y-4">
          {/* Logo Info */}
          {isEditing && canEdit ? (
            <div className="space-y-2">
              <Input
                value={logo.name}
                onChange={(e) => handleUpdateLogo(logo.id, { name: e.target.value })}
                placeholder="Logo name"
                className="h-8"
              />
              <Input
                value={logo.description || ''}
                onChange={(e) => handleUpdateLogo(logo.id, { description: e.target.value })}
                placeholder="Description (optional)"
                className="h-8"
              />
              <Input
                value={logo.websiteUrl || ''}
                onChange={(e) => handleUpdateLogo(logo.id, { websiteUrl: e.target.value })}
                placeholder="Website URL (optional)"
                className="h-8"
              />
              <Button size="sm" variant="secondary" onClick={() => setEditingLogoId(null)} className="w-full">
                Done
              </Button>
            </div>
          ) : (
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h4 className="font-semibold text-sm truncate">{logo.name}</h4>
                {logo.description && (
                  <p className="text-xs text-muted-foreground truncate">{logo.description}</p>
                )}
                {logo.websiteUrl && (
                  <a 
                    href={logo.websiteUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline flex items-center gap-1 mt-1"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Website
                  </a>
                )}
              </div>
              {canEdit && (
                <div className="flex gap-1">
                  <button
                    onClick={() => setEditingLogoId(logo.id)}
                    className="p-1.5 rounded-md hover:bg-secondary"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteLogo(logo.id)}
                    className="p-1.5 rounded-md hover:bg-destructive hover:text-destructive-foreground"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>
          )}
          
          {/* Download Grid */}
          <div className="space-y-2">
            <div className="text-xs font-medium text-muted-foreground">Downloads</div>
            <div className="grid grid-cols-3 gap-2">
              {(['color', 'white', 'black'] as ClientLogoVariant[]).map(variant => (
                <div key={variant} className="space-y-1.5">
                  <div className="text-[10px] font-medium text-center uppercase tracking-wider text-muted-foreground">
                    {VARIANT_LABELS[variant]}
                  </div>
                  <div className="space-y-1">
                    {(['png', 'svg', 'eps'] as ClientLogoFormat[]).map(format => {
                      const file = logo.files.find(f => f.variant === variant && f.format === format);
                      return (
                        <FileUploadCell
                          key={`${variant}-${format}`}
                          logoId={logo.id}
                          variant={variant}
                          format={format}
                          existingUrl={file?.url}
                        />
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Download All Button */}
          {logo.files.length > 0 && (
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full gap-2"
              onClick={() => downloadAllForLogo(logo)}
            >
              <Package className="h-4 w-4" />
              Download All ({logo.files.length} files)
            </Button>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <section id="clientlogos" className="scroll-mt-24 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1">
          <SectionHeader
            title="Client Logos"
            defaultSubtitle="Download partner and client logos in multiple formats and color variants"
            customSubtitle={customSubtitle}
            onSubtitleChange={canEdit ? onSubtitleChange : undefined}
            isEditing={isHeaderEditing}
            onEditToggle={() => setIsHeaderEditing(!isHeaderEditing)}
          />
        </div>
        <div className="flex items-center gap-2">
          {clientLogos.length > 0 && clientLogos.some(l => l.files.length > 0) && (
            <Button size="sm" variant="outline" className="gap-2" onClick={downloadAllAsZip}>
              <FolderArchive className="h-4 w-4" />
              Download All (ZIP)
            </Button>
          )}
          {canEdit && (
            <>
              <GlobalLogoPickerDialog
                storageContext={organization?.id && entityId ? { orgId: organization.id, entityType, entityId } : undefined}
                existingLogoNames={clientLogos.map(l => l.name)}
                onImport={(imported) => {
                  onClientLogosChange?.([...clientLogos, ...imported]);
                }}
              />
              <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="gap-2">
                    <Plus className="h-4 w-4" />
                    Add Client Logo
                  </Button>
                </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                <DialogTitle>Add Client Logo</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Client Name *</Label>
                    <Input
                      value={newLogo.name || ''}
                      onChange={(e) => setNewLogo(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g., Acme Corporation"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Website URL</Label>
                    <Input
                      value={newLogo.websiteUrl || ''}
                      onChange={(e) => setNewLogo(prev => ({ ...prev, websiteUrl: e.target.value }))}
                      placeholder="https://..."
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Input
                    value={newLogo.description || ''}
                    onChange={(e) => setNewLogo(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Brief description of the client"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Upload Logo Files</Label>
                  <p className="text-xs text-muted-foreground">Upload logo files for each variant and format combination</p>
                  <div className="grid grid-cols-3 gap-4">
                    {(['color', 'white', 'black'] as ClientLogoVariant[]).map(variant => (
                      <div key={variant} className="space-y-2">
                        <div className="text-sm font-medium text-center">{VARIANT_LABELS[variant]}</div>
                        <div className={cn("rounded-lg p-2", VARIANT_BG[variant])}>
                          <div className="space-y-1.5">
                            {(['png', 'svg', 'eps'] as ClientLogoFormat[]).map(format => {
                              const file = newLogo.files?.find(f => f.variant === variant && f.format === format);
                              return (
                                <FileUploadCell
                                  key={`new-${variant}-${format}`}
                                  logoId="new"
                                  variant={variant}
                                  format={format}
                                  existingUrl={file?.url}
                                  isNew
                                />
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setAddDialogOpen(false)}>Cancel</Button>
                  <Button onClick={handleAddLogo} disabled={!newLogo.name}>Add Logo</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
            </>
          )}
        </div>
      </div>

      {clientLogos.length > 0 ? (
        <div className="space-y-4">
          {/* Sort & Count Bar */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">{clientLogos.length}</span>
              <span>client{clientLogos.length !== 1 ? 's' : ''}</span>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2 h-8 text-muted-foreground hover:text-foreground">
                  <ArrowUpDown className="h-3.5 w-3.5" />
                  <span className="text-xs">
                    {sortOption === 'default' ? 'Default' : sortOption === 'name-asc' ? 'A → Z' : sortOption === 'name-desc' ? 'Z → A' : 'Most Files'}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem onClick={() => setSortOption('default')} className={cn("cursor-pointer text-sm", sortOption === 'default' && "bg-accent")}>Default</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortOption('name-asc')} className={cn("cursor-pointer text-sm", sortOption === 'name-asc' && "bg-accent")}>A → Z</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortOption('name-desc')} className={cn("cursor-pointer text-sm", sortOption === 'name-desc' && "bg-accent")}>Z → A</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortOption('files-desc')} className={cn("cursor-pointer text-sm", sortOption === 'files-desc' && "bg-accent")}>Most Files</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Logo Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {visibleLogos.map(logo => (
              <LogoCard key={logo.id} logo={logo} />
            ))}
          </div>

          {/* Accordion Show More / Show Less */}
          {hasMoreLogos && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-lg border border-border/50 bg-muted/30 hover:bg-muted/60 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="h-4 w-4" />
                  Show Less
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4" />
                  Show {hiddenCount} More Client{hiddenCount !== 1 ? 's' : ''}
                </>
              )}
            </button>
          )}
        </div>
      ) : (
        <div className="text-center py-12 border-2 border-dashed rounded-xl">
          <div className="text-muted-foreground">
            <p className="font-medium">No client logos added yet</p>
            {canEdit && <p className="text-sm">Click "Add Client Logo" to get started</p>}
          </div>
        </div>
      )}

      {/* Preview Dialog */}
      <Dialog open={!!previewLogo} onOpenChange={(open) => !open && setPreviewLogo(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{previewLogo?.name}</DialogTitle>
          </DialogHeader>
          {previewLogo && (
            <div className="space-y-4">
              <Tabs value={activeVariant} onValueChange={(v) => setActiveVariant(v as ClientLogoVariant)}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="color">Color</TabsTrigger>
                  <TabsTrigger value="white">White</TabsTrigger>
                  <TabsTrigger value="black">Black</TabsTrigger>
                </TabsList>
                {(['color', 'white', 'black'] as ClientLogoVariant[]).map(variant => {
                  const url = getPreviewUrl(previewLogo, variant);
                  return (
                    <TabsContent key={variant} value={variant}>
                      <div className={cn(
                        "aspect-video rounded-lg flex items-center justify-center p-8",
                        VARIANT_BG[variant]
                      )}>
                        {url ? (
                          <img src={url} alt={`${previewLogo.name} ${variant}`} className="max-h-full max-w-full object-contain" />
                        ) : (
                          <span className="text-muted-foreground">No {VARIANT_LABELS[variant]} version available</span>
                        )}
                      </div>
                      <div className="flex gap-2 mt-4">
                        {(['png', 'svg', 'eps'] as ClientLogoFormat[]).map(format => {
                          const file = previewLogo.files.find(f => f.variant === variant && f.format === format);
                          return file ? (
                            <Button
                              key={format}
                              variant="outline"
                              size="sm"
                              onClick={() => downloadFile(file, previewLogo.name)}
                              className="gap-2"
                            >
                              <Download className="h-4 w-4" />
                              {FORMAT_LABELS[format]}
                            </Button>
                          ) : null;
                        })}
                      </div>
                    </TabsContent>
                  );
                })}
              </Tabs>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
};
