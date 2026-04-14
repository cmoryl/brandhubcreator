import { useState, useRef } from 'react';
import { Plus, X, Pencil, Upload, Star, StarOff, Layers, Library, Loader2 } from 'lucide-react';
import { BrandIcon } from '@/types/brand';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SectionHeader } from './SectionHeader';
import { Badge } from '@/components/ui/badge';
import { IconLibraryPicker } from './iconography';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useStorageUpload } from '@/hooks/useStorageUpload';
import { toast } from 'sonner';

interface BrandIconsSectionProps {
  brandIcons: BrandIcon[];
  onBrandIconsChange: (brandIcons: BrandIcon[]) => void;
  entityId?: string;
  entityType?: 'brand' | 'product' | 'event';
  customSubtitle?: string;
  onSubtitleChange?: (subtitle: string) => void;
}

export const BrandIconsSection = ({ brandIcons, onBrandIconsChange, customSubtitle, onSubtitleChange, entityId, entityType = 'brand' }: BrandIconsSectionProps) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isHeaderEditing, setIsHeaderEditing] = useState(false);
  const [showLibraryPicker, setShowLibraryPicker] = useState(false);
  const [isUploadingIcon, setIsUploadingIcon] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const variationInputRef = useRef<HTMLInputElement>(null);
  const pendingUploadMeta = useRef<{ asPrimary: boolean; asVariation: boolean }>({ asPrimary: false, asVariation: false });
  
  const { organization } = useOrganization();
  const { uploadFile } = useStorageUpload({ entityType, entityId });
  
  // Derive canEdit from whether change handler is provided
  const canEdit = Boolean(onBrandIconsChange);

  const primarySymbol = brandIcons.find(icon => icon.isPrimary);
  const variations = brandIcons.filter(icon => icon.isVariation && !icon.isPrimary);
  const otherIcons = brandIcons.filter(icon => !icon.isPrimary && !icon.isVariation);
  
  const handleLibraryIconsSelected = (icons: BrandIcon[]) => {
    onBrandIconsChange([...brandIcons, ...icons]);
  };

  const triggerUpload = (asPrimary: boolean, asVariation: boolean) => {
    pendingUploadMeta.current = { asPrimary, asVariation };
    (asPrimary || !asVariation ? fileInputRef : variationInputRef).current?.click();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const { asPrimary, asVariation } = pendingUploadMeta.current;

    if (!entityId) {
      toast.error('Save the entity first to enable icon uploads.');
      e.target.value = '';
      return;
    }

    setIsUploadingIcon(true);
    try {
      const iconId = crypto.randomUUID();
      const result = await uploadFile(file, 'asset', `brand-icon-${iconId}`);
      if (!result) return;

      let updatedIcons = [...brandIcons];
      if (asPrimary) {
        updatedIcons = updatedIcons.map(icon => ({ ...icon, isPrimary: false }));
      }
      const newIcon: BrandIcon = {
        id: iconId,
        name: file.name.replace(/\.[^/.]+$/, ''),
        url: result.url,
        settings: asPrimary ? 'Primary brand symbol' : (asVariation ? 'Symbol variation' : 'min-size: 16px, max-size: 512px'),
        isPrimary: asPrimary,
        isVariation: asVariation,
      };
      onBrandIconsChange([...updatedIcons, newIcon]);
    } finally {
      setIsUploadingIcon(false);
      e.target.value = '';
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (variationInputRef.current) variationInputRef.current.value = '';
  };

  const setPrimarySymbol = (id: string) => {
    onBrandIconsChange(brandIcons.map(icon => ({
      ...icon,
      isPrimary: icon.id === id,
      isVariation: icon.id === id ? false : icon.isVariation,
    })));
  };

  const toggleVariation = (id: string) => {
    onBrandIconsChange(brandIcons.map(icon => 
      icon.id === id ? { ...icon, isVariation: !icon.isVariation, isPrimary: false } : icon
    ));
  };

  const updateIcon = (id: string, updates: Partial<BrandIcon>) => {
    onBrandIconsChange(brandIcons.map(i => i.id === id ? { ...i, ...updates } : i));
  };

  const deleteIcon = (id: string) => {
    onBrandIconsChange(brandIcons.filter(i => i.id !== id));
    if (editingId === id) setEditingId(null);
  };

  const IconCard = ({ icon, index, size = 'normal' }: { icon: BrandIcon; index: number; size?: 'large' | 'normal' | 'small' }) => {
    const isEditing = editingId === icon.id;
    
    const sizeClasses = {
      large: 'w-32 h-32',
      normal: 'w-16 h-16',
      small: 'w-12 h-12',
    };

    const cardSizeClasses = {
      large: 'p-8',
      normal: 'p-4',
      small: 'p-3',
    };

    return (
      <div
        className={`group relative bg-card rounded-xl shadow-sm border border-border flex flex-col items-center
          transition-all duration-500 ease-out hover:shadow-xl hover:-translate-y-1 hover:border-accent/30
          ${cardSizeClasses[size]}
          ${icon.isPrimary ? 'ring-2 ring-accent ring-offset-2 ring-offset-background' : ''}
        `}
        style={{ animationDelay: `${index * 50}ms` }}
      >
        {icon.isPrimary && (
          <Badge className="absolute -top-2 left-1/2 -translate-x-1/2 bg-accent text-accent-foreground text-xs">
            Primary
          </Badge>
        )}
        {icon.isVariation && !icon.isPrimary && (
          <Badge variant="secondary" className="absolute -top-2 left-1/2 -translate-x-1/2 text-xs">
            Variation
          </Badge>
        )}
        
        <div className={`${sizeClasses[size]} bg-muted rounded-lg flex items-center justify-center mb-3 
          transition-all duration-300 group-hover:scale-105 group-hover:shadow-md`}>
          <img 
            src={icon.url} 
            alt={icon.name} 
            className={`${size === 'large' ? 'max-h-24 max-w-24' : size === 'small' ? 'max-h-8 max-w-8' : 'max-h-12 max-w-12'} object-contain transition-transform duration-300 group-hover:scale-110`}
            loading="lazy"
            decoding="async"
          />
        </div>

        {isEditing ? (
          <div className="space-y-2 w-full">
            <Input
              value={icon.name}
              onChange={(e) => updateIcon(icon.id, { name: e.target.value })}
              placeholder="Icon name"
              className="h-8 text-xs"
            />
            <Input
              value={icon.settings}
              onChange={(e) => updateIcon(icon.id, { settings: e.target.value })}
              placeholder="Settings"
              className="h-8 text-xs"
            />
            <Button size="sm" variant="secondary" onClick={() => setEditingId(null)} className="w-full">
              Done
            </Button>
          </div>
        ) : (
          <>
            <p className={`font-medium text-foreground text-center truncate w-full transition-colors duration-300 group-hover:text-accent ${size === 'large' ? 'text-lg' : 'text-sm'}`}>
              {icon.name}
            </p>
            <p className={`text-muted-foreground text-center truncate w-full ${size === 'large' ? 'text-sm' : 'text-xs'}`}>
              {icon.settings}
            </p>
            {canEdit && (
              <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {!icon.isPrimary && (
                  <button
                    onClick={() => setPrimarySymbol(icon.id)}
                    className="p-1 rounded-md bg-background/80 hover:bg-accent hover:text-accent-foreground transition-colors"
                    title="Set as primary symbol"
                  >
                    <Star className="h-3 w-3" />
                  </button>
                )}
                {icon.isPrimary && (
                  <button
                    onClick={() => updateIcon(icon.id, { isPrimary: false })}
                    className="p-1 rounded-md bg-accent text-accent-foreground transition-colors"
                    title="Remove as primary"
                  >
                    <StarOff className="h-3 w-3" />
                  </button>
                )}
                {!icon.isPrimary && (
                  <button
                    onClick={() => toggleVariation(icon.id)}
                    className={`p-1 rounded-md transition-colors ${icon.isVariation ? 'bg-secondary' : 'bg-background/80 hover:bg-secondary'}`}
                    title={icon.isVariation ? "Remove from variations" : "Add as variation"}
                  >
                    <Layers className="h-3 w-3 text-muted-foreground" />
                  </button>
                )}
                <button
                  onClick={() => setEditingId(icon.id)}
                  className="p-1 rounded-md bg-background/80 hover:bg-secondary transition-colors"
                >
                  <Pencil className="h-3 w-3 text-muted-foreground" />
                </button>
                <button
                  onClick={() => deleteIcon(icon.id)}
                  className="p-1 rounded-md bg-background/80 hover:bg-destructive hover:text-destructive-foreground transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    );
  };

  return (
    <section className="space-y-8">
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1">
          <SectionHeader
            title="Symbol Standards"
            defaultSubtitle="Shorthand identification - favicons, brand marks, and symbol usage"
            customSubtitle={customSubtitle}
            onSubtitleChange={onSubtitleChange}
            isEditing={isHeaderEditing}
            onEditToggle={() => setIsHeaderEditing(!isHeaderEditing)}
          />
        </div>
        {canEdit && (
          <div className="flex gap-2 shrink-0">
            {organization?.id && (
              <Button 
                onClick={() => setShowLibraryPicker(true)} 
                size="sm" 
                variant="outline"
                className="gap-2"
              >
                <Library className="h-4 w-4" />
                From Library
              </Button>
            )}
            <Button onClick={() => fileInputRef.current?.click()} size="sm" className="gap-2">
              <Upload className="h-4 w-4" />
              Upload Icon
            </Button>
          </div>
        )}
      </div>

      {/* Icon Library Picker Dialog */}
      <IconLibraryPicker
        organizationId={organization?.id}
        open={showLibraryPicker}
        onOpenChange={setShowLibraryPicker}
        onIconsSelected={handleLibraryIconsSelected}
        existingIconIds={brandIcons.map(i => i.id)}
      />

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        className="hidden"
      />
      <input
        ref={variationInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Primary Symbol Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold text-foreground">Primary Symbol</h3>
          <Badge variant="outline" className="text-xs">Main Mark</Badge>
        </div>
        
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Large Primary Symbol Display */}
          {primarySymbol ? (
            <div className="flex-shrink-0">
              <IconCard icon={primarySymbol} index={0} size="large" />
            </div>
          ) : (
            <button
              onClick={() => { pendingUploadMeta.current = { asPrimary: true, asVariation: false }; fileInputRef.current?.click(); }}
              className="flex-shrink-0 w-48 h-48 border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center gap-3 text-muted-foreground hover:border-accent hover:text-accent transition-all duration-300 hover:shadow-lg hover:scale-[1.02] bg-card"
            >
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                <Star className="h-8 w-8" />
              </div>
              <span className="text-sm font-medium text-center px-4">Set Primary Symbol</span>
            </button>
          )}

          {/* Symbol Variations */}
          <div className="flex-1 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Symbol Variations</p>
              {canEdit && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => variationInputRef.current?.click()}
                className="gap-1.5 text-xs"
              >
                <Plus className="h-3 w-3" />
                Add Variation
              </Button>
              )}
            </div>
            
            {variations.length > 0 ? (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {variations.map((icon, index) => (
                  <IconCard key={icon.id} icon={icon} index={index} size="small" />
                ))}
              </div>
            ) : (
              <div className="border border-dashed border-border rounded-lg p-6 text-center text-muted-foreground bg-muted/20">
                <Layers className="h-6 w-6 mx-auto mb-2 opacity-50" />
                <p className="text-xs">No variations yet</p>
                <p className="text-xs opacity-70">Add smaller versions, monochrome, or alternate styles</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Other Icons Grid */}
      {(otherIcons.length > 0 || brandIcons.length === 0) && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground">Additional Icons</h3>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {otherIcons.map((icon, index) => (
              <IconCard key={icon.id} icon={icon} index={index} size="normal" />
            ))}

            {brandIcons.length === 0 && (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="col-span-full h-32 border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-accent hover:text-accent transition-colors"
              >
                <Upload className="h-6 w-6" />
                <span className="text-sm font-medium">Upload brand icons</span>
              </button>
            )}
          </div>
        </div>
      )}
    </section>
  );
};
