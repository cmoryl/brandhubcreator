import { useState, useRef, useCallback } from 'react';
import { X, Download, Package, Upload, Image as ImageIcon, Link2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { SectionHeader } from './SectionHeader';
import { toast } from 'sonner';
import { useDropZone } from '@/components/ui/drop-zone';
import { cn } from '@/lib/utils';

// Generic logo type that works for all entity types
export interface UnifiedLogo {
  id: string;
  name: string;
  url: string;
  variant: string;
  description?: string;
}

// Variant configurations for different entity types
export type LogoVariantConfig = {
  value: string;
  label: string;
  color?: string;
};

// Default variants for brands
export const BRAND_LOGO_VARIANTS: LogoVariantConfig[] = [
  { value: 'primary', label: 'Primary Logo', color: 'bg-primary/10 text-primary' },
  { value: 'secondary', label: 'Secondary Logo', color: 'bg-secondary/10 text-secondary-foreground' },
  { value: 'reversed', label: 'Reversed Logo', color: 'bg-slate-900 text-white' },
  { value: 'monochrome', label: 'Monochrome Logo', color: 'bg-gray-100 text-gray-800' },
  { value: 'icon', label: 'Icon / Favicon', color: 'bg-blue-100 text-blue-800' },
  { value: 'wordmark', label: 'Wordmark', color: 'bg-purple-100 text-purple-800' },
];

// Event-specific variants
export const EVENT_LOGO_VARIANTS: LogoVariantConfig[] = [
  { value: 'event-primary', label: 'Event Primary', color: 'bg-primary/10 text-primary' },
  { value: 'event-secondary', label: 'Event Secondary', color: 'bg-secondary/10 text-secondary-foreground' },
  { value: 'co-branded', label: 'Co-Branded', color: 'bg-blue-100 text-blue-800' },
  { value: 'date-lockup', label: 'Date Lockup', color: 'bg-green-100 text-green-800' },
  { value: 'sponsor-lockup', label: 'Sponsor Lockup', color: 'bg-purple-100 text-purple-800' },
  { value: 'stacked', label: 'Stacked', color: 'bg-orange-100 text-orange-800' },
  { value: 'horizontal', label: 'Horizontal', color: 'bg-gray-100 text-gray-800' },
  { value: 'reversed', label: 'Reversed', color: 'bg-slate-900 text-white' },
];

interface UnifiedLogoSectionProps {
  logos: UnifiedLogo[];
  onLogosChange?: (logos: UnifiedLogo[]) => void;
  variants?: LogoVariantConfig[];
  title?: string;
  defaultSubtitle?: string;
  customSubtitle?: string;
  onSubtitleChange?: (subtitle: string) => void;
  isEditable?: boolean;
  showGroupedByVariant?: boolean;
  gridLayout?: 'grouped' | 'flat';
}

export const UnifiedLogoSection = ({
  logos,
  onLogosChange,
  variants = BRAND_LOGO_VARIANTS,
  title = 'Logos',
  defaultSubtitle = 'Upload and organize your logos',
  customSubtitle,
  onSubtitleChange,
  isEditable = true,
  showGroupedByVariant = true,
  gridLayout = 'grouped',
}: UnifiedLogoSectionProps) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isHeaderEditing, setIsHeaderEditing] = useState(false);
  const [pendingVariant, setPendingVariant] = useState<string>(variants[0]?.value || 'primary');
  const [urlPopoverOpen, setUrlPopoverOpen] = useState<string | null>(null);
  const [urlInput, setUrlInput] = useState('');

  const canEdit = isEditable && !!onLogosChange;

  const handleFileDrop = useCallback((file: File, variant: string) => {
    if (!onLogosChange) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const url = event.target?.result as string;
      const newLogo: UnifiedLogo = {
        id: crypto.randomUUID(),
        name: file.name.replace(/\.[^/.]+$/, ''),
        url,
        variant,
      };
      onLogosChange([...logos, newLogo]);
      toast.success(`${file.name} uploaded`);
    };
    reader.readAsDataURL(file);
  }, [logos, onLogosChange]);

  const handleUrlSubmit = useCallback((variant: string) => {
    if (!onLogosChange || !urlInput.trim()) return;
    
    const newLogo: UnifiedLogo = {
      id: crypto.randomUUID(),
      name: urlInput.split('/').pop()?.split('.')[0] || 'Logo',
      url: urlInput.trim(),
      variant,
    };
    onLogosChange([...logos, newLogo]);
    setUrlInput('');
    setUrlPopoverOpen(null);
    toast.success('Logo added from URL');
  }, [logos, onLogosChange, urlInput]);

  const { isDragging, fileInputRef, dragHandlers, openFilePicker, handleInputChange } = useDropZone({
    onFileDrop: (file) => handleFileDrop(file, pendingVariant),
    accept: 'image/*',
  });

  const triggerUpload = (variant: string) => {
    setPendingVariant(variant);
    openFilePicker();
  };

  const updateLogo = (id: string, updates: Partial<UnifiedLogo>) => {
    if (!onLogosChange) return;
    onLogosChange(logos.map(l => l.id === id ? { ...l, ...updates } : l));
  };

  const deleteLogo = (id: string) => {
    if (!onLogosChange) return;
    onLogosChange(logos.filter(l => l.id !== id));
    if (editingId === id) setEditingId(null);
    toast.success('Logo removed');
  };

  const downloadLogo = (logo: UnifiedLogo) => {
    const link = document.createElement('a');
    link.href = logo.url;
    link.download = `${logo.name}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Downloaded ${logo.name}`);
  };

  const downloadAllLogos = async () => {
    if (logos.length === 0) {
      toast.error('No logos to download');
      return;
    }
    
    for (const logo of logos) {
      const variantLabel = variants.find(v => v.value === logo.variant)?.label || logo.variant;
      const link = document.createElement('a');
      link.href = logo.url;
      link.download = `${variantLabel}-${logo.name}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      await new Promise(resolve => setTimeout(resolve, 300));
    }
    toast.success(`Downloaded ${logos.length} logo(s)`);
  };

  const getVariantColor = (variant: string) => {
    return variants.find(v => v.value === variant)?.color || 'bg-gray-100 text-gray-800';
  };

  const getVariantLabel = (variant: string) => {
    return variants.find(v => v.value === variant)?.label || variant;
  };

  // Group logos by variant for grouped display
  const groupedLogos = logos.reduce((acc, logo) => {
    if (!acc[logo.variant]) acc[logo.variant] = [];
    acc[logo.variant].push(logo);
    return acc;
  }, {} as Record<string, UnifiedLogo[]>);

  const renderLogoCard = (logo: UnifiedLogo, index: number) => (
    <Card
      key={logo.id}
      className="group relative overflow-hidden hover:border-primary/50 transition-colors animate-scale-in"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className="aspect-video bg-[repeating-conic-gradient(hsl(var(--muted))_0%_25%,hsl(var(--background))_0%_50%)] bg-[length:20px_20px] flex items-center justify-center p-4 relative">
        <img
          src={logo.url}
          alt={logo.name}
          className="max-h-full max-w-full object-contain"
          loading="lazy"
          decoding="async"
        />
        {gridLayout === 'flat' && (
          <Badge className={cn("absolute top-2 left-2 text-xs", getVariantColor(logo.variant))}>
            {getVariantLabel(logo.variant)}
          </Badge>
        )}
      </div>
      
      <CardContent className="p-3">
        {editingId === logo.id && canEdit ? (
          <div className="space-y-2">
            <Input
              value={logo.name}
              onChange={(e) => updateLogo(logo.id, { name: e.target.value })}
              placeholder="Logo name"
              className="h-8"
            />
            <Select
              value={logo.variant}
              onValueChange={(value) => updateLogo(logo.id, { variant: value })}
            >
              <SelectTrigger className="h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {variants.map((v) => (
                  <SelectItem key={v.value} value={v.value}>{v.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              value={logo.description || ''}
              onChange={(e) => updateLogo(logo.id, { description: e.target.value })}
              placeholder="Description (optional)"
              className="h-8"
            />
            <Button size="sm" variant="secondary" onClick={() => setEditingId(null)} className="w-full">
              Done
            </Button>
          </div>
        ) : (
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h4 className="font-medium text-sm truncate">{logo.name}</h4>
              {logo.description && (
                <p className="text-xs text-muted-foreground truncate">{logo.description}</p>
              )}
            </div>
            <div className={cn(
              "flex items-center gap-1 shrink-0",
              canEdit ? "opacity-0 group-hover:opacity-100 transition-opacity" : ""
            )}>
              <button
                onClick={() => downloadLogo(logo)}
                className="p-1.5 rounded-md hover:bg-secondary transition-colors text-muted-foreground"
                title="Download"
              >
                <Download className="h-3.5 w-3.5" />
              </button>
              {canEdit && (
                <>
                  <button
                    onClick={() => setEditingId(logo.id)}
                    className="p-1.5 rounded-md hover:bg-secondary transition-colors text-muted-foreground"
                    title="Edit"
                  >
                    <ImageIcon className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => deleteLogo(logo.id)}
                    className="p-1.5 rounded-md hover:bg-destructive hover:text-destructive-foreground transition-colors"
                    title="Delete"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );

  const renderUploadZone = (variant: string) => (
    <div className="flex flex-col gap-2">
      <button
        onClick={() => triggerUpload(variant)}
        onDragOver={(e) => { setPendingVariant(variant); dragHandlers.onDragOver(e); }}
        onDragLeave={dragHandlers.onDragLeave}
        onDrop={(e) => { setPendingVariant(variant); dragHandlers.onDrop(e); }}
        className={cn(
          "w-full h-28 border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-2 transition-colors",
          isDragging && pendingVariant === variant
            ? 'border-primary bg-primary/5 text-primary'
            : 'border-border text-muted-foreground hover:border-accent hover:text-accent'
        )}
      >
        <Upload className="h-5 w-5" />
        <span className="text-xs font-medium">
          {isDragging && pendingVariant === variant ? 'Drop to upload' : 'Upload'}
        </span>
      </button>
      
      <Popover open={urlPopoverOpen === variant} onOpenChange={(open) => setUrlPopoverOpen(open ? variant : null)}>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="sm" className="h-7 text-xs gap-1.5 w-full">
            <Link2 className="h-3 w-3" />
            Or paste URL
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-72 p-3" align="center">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Image URL</Label>
            <div className="flex gap-2">
              <Input
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://..."
                className="h-8 text-sm"
                onKeyDown={(e) => e.key === 'Enter' && handleUrlSubmit(variant)}
              />
              <Button size="sm" onClick={() => handleUrlSubmit(variant)} className="h-8">
                Add
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );

  return (
    <section className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div className="flex-1 min-w-0">
          <SectionHeader
            title={title}
            defaultSubtitle={defaultSubtitle}
            customSubtitle={customSubtitle}
            onSubtitleChange={canEdit ? onSubtitleChange : undefined}
            isEditing={isHeaderEditing}
            onEditToggle={canEdit ? () => setIsHeaderEditing(!isHeaderEditing) : undefined}
          />
        </div>
        {logos.length > 0 && (
          <Button onClick={downloadAllLogos} variant="outline" size="sm" className="gap-2 shrink-0 w-full sm:w-auto">
            <Package className="h-4 w-4" />
            <span className="sm:inline">Download All</span>
          </Button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleInputChange}
        className="hidden"
      />

      {showGroupedByVariant && gridLayout === 'grouped' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {variants.map((variant) => (
            <div key={variant.value} className="space-y-3">
              <div className="flex items-center gap-2">
                <Badge className={cn("text-xs", variant.color)}>
                  {variant.label}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  ({groupedLogos[variant.value]?.length || 0})
                </span>
              </div>
              
              <div className="space-y-3">
                {groupedLogos[variant.value]?.map((logo, index) => renderLogoCard(logo, index))}
                {canEdit && renderUploadZone(variant.value)}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <>
          {logos.length === 0 && !canEdit ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <ImageIcon className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <h3 className="font-semibold text-lg mb-2">No logos yet</h3>
                <p className="text-muted-foreground">No logos have been added to this section.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {logos.map((logo, index) => renderLogoCard(logo, index))}
              {canEdit && (
                <Card className="border-dashed flex items-center justify-center min-h-[200px]">
                  <CardContent className="p-4 w-full">
                    <Select value={pendingVariant} onValueChange={setPendingVariant}>
                      <SelectTrigger className="mb-3">
                        <SelectValue placeholder="Select variant" />
                      </SelectTrigger>
                      <SelectContent>
                        {variants.map((v) => (
                          <SelectItem key={v.value} value={v.value}>{v.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {renderUploadZone(pendingVariant)}
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </>
      )}
    </section>
  );
};
