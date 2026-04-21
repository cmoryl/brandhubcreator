import { useState, useRef, useCallback, useEffect, forwardRef } from 'react';
import { logger } from '@/lib/logger';
import { LogoDownloadLink } from '@/types/brand';
import { Trash2, Download, Package, Upload, Image as ImageIcon, Link2, Maximize2, FolderOpen, Loader2 } from 'lucide-react';
import { LogoDownloadLinksPanel } from './LogoDownloadLinksPanel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { SectionHeader } from './SectionHeader';
import { toast } from 'sonner';
import { useDropZone } from '@/components/ui/drop-zone';
import { ImageLibraryPicker } from '@/components/ui/ImageLibraryPicker';
import { cn } from '@/lib/utils';
import { useStorageUpload } from '@/hooks/useStorageUpload';

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
  entityId?: string;
  entityType?: 'brand' | 'product' | 'event';
  logoDownloadLinks?: LogoDownloadLink[];
  onLogoDownloadLinksChange?: (links: LogoDownloadLink[]) => void;
}

export const UnifiedLogoSection = forwardRef<HTMLElement, UnifiedLogoSectionProps>(({
  logos,
  onLogosChange,
  variants = BRAND_LOGO_VARIANTS,
  title = 'Logos',
  defaultSubtitle = 'Upload and organize your logos',
  customSubtitle,
  onSubtitleChange,
  isEditable,
  showGroupedByVariant = true,
  gridLayout = 'grouped',
  entityId,
  entityType = 'brand',
  logoDownloadLinks = [],
  onLogoDownloadLinksChange,
}, ref) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isHeaderEditing, setIsHeaderEditing] = useState(false);
  const [pendingVariant, setPendingVariant] = useState<string>(variants[0]?.value || 'primary');
  const [urlPopoverOpen, setUrlPopoverOpen] = useState<string | null>(null);
  const [urlInput, setUrlInput] = useState('');
  const [expandedLogo, setExpandedLogo] = useState<UnifiedLogo | null>(null);
  const { uploadFile } = useStorageUpload({ entityType, entityId });

  // Auto-backfill: convert any base64 logos to storage URLs so they survive stripBase64FromGuideData
  const backfillRanRef = useRef<string | null>(null);
  useEffect(() => {
    if (!entityId || !onLogosChange) return;
    if (backfillRanRef.current === entityId) return;
    const base64Logos = logos.filter(l => l.url?.startsWith('data:'));
    if (base64Logos.length === 0) return;
    backfillRanRef.current = entityId;

    const migrateLogos = async () => {
      let changed = false;
      const updated = await Promise.all(
        logos.map(async (logo) => {
          if (!logo.url?.startsWith('data:')) return logo;
          try {
            const res = await fetch(logo.url);
            const blob = await res.blob();
            const result = await uploadFile(blob as unknown as File, 'logo', `logo-migrated-${logo.id}`);
            if (result?.url) {
              changed = true;
              return { ...logo, url: result.url };
            }
          } catch (err) {
            console.warn(`[UnifiedLogoSection] Failed to migrate base64 logo ${logo.name}:`, err);
          }
          return logo;
        })
      );
      if (changed) {
        onLogosChange(updated);
        logger.storage(`UnifiedLogoSection: Migrated ${base64Logos.length} base64 logos to storage`);
      }
    };
    migrateLogos();
  }, [entityId, logos.length]);

  // Default to false for public view; only editable if explicitly enabled AND handler exists
  const canEdit = (isEditable ?? false) && !!onLogosChange;

  const handleFileDrop = useCallback(async (file: File, variant: string) => {
    if (!onLogosChange) return;
    
    let url: string;
    if (entityId) {
      const result = await uploadFile(file, 'logo', `logo-${crypto.randomUUID()}`);
      if (!result) return;
      url = result.url;
    } else {
      const reader = new FileReader();
      url = await new Promise((resolve) => {
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.readAsDataURL(file);
      });
    }

    const newLogo: UnifiedLogo = {
      id: crypto.randomUUID(),
      name: file.name.replace(/\.[^/.]+$/, ''),
      url,
      variant,
    };
    onLogosChange([...logos, newLogo]);
    toast.success(`${file.name} uploaded`);
  }, [logos, onLogosChange, entityId, uploadFile]);

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

  const handleLibrarySelect = useCallback(async (url: string, variant: string) => {
    if (!onLogosChange) return;
    
    let finalUrl = url;
    // If the library image is base64 and we have storage, upload it first
    if (url.startsWith('data:') && entityId) {
      try {
        const res = await fetch(url);
        const blob = await res.blob();
        const result = await uploadFile(blob as unknown as File, 'logo', `logo-lib-${crypto.randomUUID()}`);
        if (result?.url) {
          finalUrl = result.url;
        }
      } catch (err) {
        console.warn('[UnifiedLogoSection] Failed to upload base64 library logo:', err);
      }
    }

    const urlParts = finalUrl.split('/');
    const fileName = urlParts[urlParts.length - 1]?.split('.')[0] || 'Library Logo';
    const newLogo: UnifiedLogo = {
      id: crypto.randomUUID(),
      name: fileName,
      url: finalUrl,
      variant,
    };
    onLogosChange([...logos, newLogo]);
    toast.success('Logo added from library');
  }, [logos, onLogosChange, entityId, uploadFile]);

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

  // Safe zone wrapper component with X-unit measurement indicators
  const SafeZoneWrapper = ({ children, className, showMeasurements = false }: { children: React.ReactNode; className?: string; showMeasurements?: boolean }) => (
    <div className={cn("relative p-6", className)}>
      {/* Safe zone border */}
      <div className="absolute inset-4 border border-dashed border-muted-foreground/40 rounded pointer-events-none" />
      
      {/* X-unit measurement indicators */}
      {showMeasurements && (
        <>
          {/* Top measurement */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 flex flex-col items-center">
            <div className="h-4 w-px bg-muted-foreground/40" />
            <span className="text-[8px] text-muted-foreground/60 font-mono">1X</span>
          </div>
          {/* Bottom measurement */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 flex flex-col items-center">
            <span className="text-[8px] text-muted-foreground/60 font-mono">1X</span>
            <div className="h-4 w-px bg-muted-foreground/40" />
          </div>
          {/* Left measurement */}
          <div className="absolute left-0 top-1/2 -translate-y-1/2 flex items-center">
            <div className="w-4 h-px bg-muted-foreground/40" />
            <span className="text-[8px] text-muted-foreground/60 font-mono ml-0.5">1X</span>
          </div>
          {/* Right measurement */}
          <div className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center">
            <span className="text-[8px] text-muted-foreground/60 font-mono mr-0.5">1X</span>
            <div className="w-4 h-px bg-muted-foreground/40" />
          </div>
        </>
      )}
      
      <div className="relative flex items-center justify-center min-h-[80px]">
        {children}
      </div>
    </div>
  );

  // Primary Symbol with social circle preview
  const PrimarySymbolPreview = ({ logo }: { logo: UnifiedLogo }) => (
    <div className="border border-border rounded-lg p-4 bg-card">
      <div className="text-xs font-medium text-muted-foreground mb-3 flex items-center gap-2">
        <span className="uppercase tracking-wider">Primary Symbol</span>
        <Badge variant="outline" className="text-[10px]">Social Avatar</Badge>
      </div>
      <div className="grid grid-cols-4 gap-3">
        {/* Square version */}
        <div className="flex flex-col items-center gap-2">
          <div className="w-16 h-16 bg-white rounded-lg border border-border flex items-center justify-center p-2 relative">
            <div className="absolute inset-2 border border-dashed border-muted-foreground/30 rounded" />
            <img src={logo.url} alt="Square" className="max-h-10 max-w-10 object-contain relative z-10" />
          </div>
          <span className="text-[9px] text-muted-foreground">Square</span>
        </div>
        {/* Circle version - Social */}
        <div className="flex flex-col items-center gap-2">
          <div className="w-16 h-16 bg-white rounded-full border border-border flex items-center justify-center p-2 overflow-hidden">
            <img src={logo.url} alt="Circle" className="max-h-10 max-w-10 object-contain" />
          </div>
          <span className="text-[9px] text-muted-foreground">Circle</span>
        </div>
        {/* Dark circle */}
        <div className="flex flex-col items-center gap-2">
          <div className="w-16 h-16 bg-slate-900 rounded-full border border-border flex items-center justify-center p-2 overflow-hidden">
            <img src={logo.url} alt="Dark Circle" className="max-h-10 max-w-10 object-contain" />
          </div>
          <span className="text-[9px] text-muted-foreground">Dark</span>
        </div>
        {/* Brand color circle */}
        <div className="flex flex-col items-center gap-2">
          <div className="w-16 h-16 bg-primary rounded-full border border-border flex items-center justify-center p-2 overflow-hidden">
            <img src={logo.url} alt="Brand Circle" className="max-h-10 max-w-10 object-contain" />
          </div>
          <span className="text-[9px] text-muted-foreground">Brand</span>
        </div>
      </div>
    </div>
  );

  const renderLogoCard = (logo: UnifiedLogo, index: number) => {
    const isIconVariant = logo.variant === 'icon' || logo.variant === 'event-primary';
    
    return (
      <Card
        key={logo.id}
        className="group relative overflow-hidden hover:border-primary/50 transition-colors animate-scale-in"
        style={{ animationDelay: `${index * 50}ms` }}
      >
        
        {/* Expand button overlay */}
        <button
          onClick={() => setExpandedLogo(logo)}
          className="absolute top-2 right-2 z-20 p-2 rounded-md bg-background/80 backdrop-blur-sm border border-border opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background"
          title="View larger"
        >
          <Maximize2 className="h-4 w-4" />
        </button>
        
        {/* Primary Symbol preview for icon variants */}
        {isIconVariant && (
          <div className="p-3 border-b border-border/50">
            <PrimarySymbolPreview logo={logo} />
          </div>
        )}
        
        {/* Multi-background logo display with X measurements */}
        <div className="grid grid-cols-2 cursor-pointer" onClick={() => setExpandedLogo(logo)}>
          {/* Light background */}
          <SafeZoneWrapper className="bg-white border-r border-b border-border/50" showMeasurements={index === 0}>
            <img
              src={logo.url}
              alt={`${logo.name} on light`}
              className="max-h-16 max-w-full object-contain"
              loading="lazy"
              decoding="async"
            />
          </SafeZoneWrapper>
          
          {/* Dark background */}
          <SafeZoneWrapper className="bg-slate-900 border-b border-border/50" showMeasurements={index === 0}>
            <img
              src={logo.url}
              alt={`${logo.name} on dark`}
              className="max-h-16 max-w-full object-contain"
              loading="lazy"
              decoding="async"
            />
          </SafeZoneWrapper>
          
          {/* Checkered/transparent background */}
          <SafeZoneWrapper className="bg-[repeating-conic-gradient(#e5e7eb_0%_25%,#ffffff_0%_50%)] dark:bg-[repeating-conic-gradient(#374151_0%_25%,#1f2937_0%_50%)] bg-[length:16px_16px] border-r border-border/50">
            <img
              src={logo.url}
              alt={`${logo.name} transparent`}
              className="max-h-16 max-w-full object-contain"
              loading="lazy"
              decoding="async"
            />
          </SafeZoneWrapper>
          
          {/* Brand color background */}
          <SafeZoneWrapper className="bg-primary/10">
            <img
              src={logo.url}
              alt={`${logo.name} on brand`}
              className="max-h-16 max-w-full object-contain"
              loading="lazy"
              decoding="async"
            />
          </SafeZoneWrapper>
        </div>
        
        {/* Safe zone legend */}
        <div className="px-3 py-2 bg-muted/30 border-t border-b border-border/50">
          <div className="flex items-center justify-between text-[9px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <span className="w-3 h-px border-t border-dashed border-muted-foreground/60" />
              <span>Clear space = 1X (height of symbol)</span>
            </span>
            <span className="text-muted-foreground/60">Min size: 24px</span>
          </div>
        </div>
        
        {/* Background labels */}
        <div className="grid grid-cols-4 text-[9px] text-center border-b border-border/50">
          <span className="py-1.5 text-muted-foreground border-r border-border/50">Light</span>
          <span className="py-1.5 text-muted-foreground border-r border-border/50">Dark</span>
          <span className="py-1.5 text-muted-foreground border-r border-border/50">Transparent</span>
          <span className="py-1.5 text-muted-foreground">Brand</span>
        </div>
        
        {gridLayout === 'flat' && (
          <Badge className={cn("absolute top-2 left-2 text-xs z-10", getVariantColor(logo.variant))}>
            {getVariantLabel(logo.variant)}
          </Badge>
        )}
        
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
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <button
                          className="p-1.5 rounded-md hover:bg-destructive hover:text-destructive-foreground transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Logo</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete "{logo.name}"? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteLogo(logo.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

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
      
      <div className="flex gap-2">
        <ImageLibraryPicker
          onSelect={(url) => handleLibrarySelect(url, variant)}
          trigger={
            <Button variant="ghost" size="sm" className="h-7 text-xs gap-1.5 flex-1">
              <FolderOpen className="h-3 w-3" />
              Library
            </Button>
          }
          defaultCategory="Logos"
        />
        
        <Popover open={urlPopoverOpen === variant} onOpenChange={(open) => setUrlPopoverOpen(open ? variant : null)}>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="sm" className="h-7 text-xs gap-1.5 flex-1">
              <Link2 className="h-3 w-3" />
              URL
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
    </div>
  );

  return (
    <section ref={ref} className="space-y-4 sm:space-y-6">
      {/* Section header - always full width on its own row */}
      <SectionHeader
        title={title}
        defaultSubtitle={defaultSubtitle}
        customSubtitle={customSubtitle}
        onSubtitleChange={canEdit ? onSubtitleChange : undefined}
        isEditing={isHeaderEditing}
        onEditToggle={canEdit ? () => setIsHeaderEditing(!isHeaderEditing) : undefined}
      />
      
      {/* Controls row - separate from header */}
      {logos.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <Button onClick={downloadAllLogos} variant="outline" size="sm" className="gap-2">
            <Package className="h-4 w-4" />
            <span>Download All</span>
          </Button>
        </div>
      )}


      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleInputChange}
        className="hidden"
      />

      {showGroupedByVariant && gridLayout === 'grouped' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
          {variants
            // Filter out empty variants for non-editors (public viewers)
            .filter(variant => canEdit || (groupedLogos[variant.value]?.length || 0) > 0)
            .map((variant) => (
            <div key={variant.value} className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-border/50">
                <Badge className={cn("text-xs", variant.color)}>
                  {variant.label}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  ({groupedLogos[variant.value]?.length || 0} logo{(groupedLogos[variant.value]?.length || 0) !== 1 ? 's' : ''})
                </span>
              </div>
              
              <div className="space-y-4">
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
      
      {/* Expanded Logo Modal */}
      <Dialog open={!!expandedLogo} onOpenChange={() => setExpandedLogo(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
          <DialogTitle className="sr-only">{expandedLogo?.name} - Full View</DialogTitle>
          {expandedLogo && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold">{expandedLogo.name}</h3>
                <Badge className={cn("mt-1", getVariantColor(expandedLogo.variant))}>
                  {getVariantLabel(expandedLogo.variant)}
                </Badge>
              </div>
              
              {/* Large logo display on multiple backgrounds */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white border border-border rounded-lg p-8 flex items-center justify-center min-h-[200px]">
                  <img src={expandedLogo.url} alt={`${expandedLogo.name} on light`} className="max-h-48 max-w-full object-contain" />
                </div>
                <div className="bg-slate-900 border border-border rounded-lg p-8 flex items-center justify-center min-h-[200px]">
                  <img src={expandedLogo.url} alt={`${expandedLogo.name} on dark`} className="max-h-48 max-w-full object-contain" />
                </div>
                <div className="bg-[repeating-conic-gradient(#e5e7eb_0%_25%,#ffffff_0%_50%)] dark:bg-[repeating-conic-gradient(#374151_0%_25%,#1f2937_0%_50%)] bg-[length:20px_20px] border border-border rounded-lg p-8 flex items-center justify-center min-h-[200px]">
                  <img src={expandedLogo.url} alt={`${expandedLogo.name} transparent`} className="max-h-48 max-w-full object-contain" />
                </div>
                <div className="bg-primary/10 border border-border rounded-lg p-8 flex items-center justify-center min-h-[200px]">
                  <img src={expandedLogo.url} alt={`${expandedLogo.name} on brand`} className="max-h-48 max-w-full object-contain" />
                </div>
              </div>
              
              <div className="grid grid-cols-4 gap-4 text-center text-sm text-muted-foreground">
                <span>Light</span>
                <span>Dark</span>
                <span>Transparent</span>
                <span>Brand</span>
              </div>
              
              {expandedLogo.description && (
                <p className="text-sm text-muted-foreground">{expandedLogo.description}</p>
              )}

              {/* Per-logo download links */}
              <LogoDownloadLinksPanel
                logoId={expandedLogo.id}
                logoName={expandedLogo.name}
                allLinks={logoDownloadLinks}
                canEdit={canEdit}
                onLinksChange={onLogoDownloadLinksChange}
                entityId={entityId}
                entityType={entityType}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
});

UnifiedLogoSection.displayName = 'UnifiedLogoSection';
