import { useState, useRef, useCallback } from 'react';
import { Trash2, Upload, Link2, ExternalLink, Crown, Award, Medal, Star, Handshake, Megaphone, Plus, Globe, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SectionHeader } from './SectionHeader';
import { toast } from 'sonner';
import { ImageLibraryPicker } from '@/components/ui/ImageLibraryPicker';
import { cn } from '@/lib/utils';
import { WebsiteImageScanner } from './WebsiteImageScanner';
import { GlobalLogoPickerDialog } from './GlobalLogoPickerDialog';
import { useStorageUpload } from '@/hooks/useStorageUpload';
import type { SponsorLogo, ClientLogo } from '@/types/brand';

const TIER_CONFIG = {
  platinum: { label: 'Platinum', icon: Crown, color: 'bg-slate-100 text-slate-800 border-slate-300' },
  gold: { label: 'Gold', icon: Award, color: 'bg-amber-100 text-amber-800 border-amber-300' },
  silver: { label: 'Silver', icon: Medal, color: 'bg-gray-200 text-gray-700 border-gray-400' },
  bronze: { label: 'Bronze', icon: Star, color: 'bg-orange-100 text-orange-800 border-orange-300' },
  partner: { label: 'Partner', icon: Handshake, color: 'bg-blue-100 text-blue-800 border-blue-300' },
  media: { label: 'Media', icon: Megaphone, color: 'bg-purple-100 text-purple-800 border-purple-300' },
} as const;

type TierType = keyof typeof TIER_CONFIG;

interface SponsorLogosSectionProps {
  sponsors: SponsorLogo[];
  onSponsorsChange?: (sponsors: SponsorLogo[]) => void;
  customSubtitle?: string;
  onSubtitleChange?: (subtitle: string) => void;
  isEditable?: boolean;
  websiteUrl?: string;
  entityId?: string;
  entityType?: 'brand' | 'product' | 'event';
}

export const SponsorLogosSection = ({
  sponsors = [],
  onSponsorsChange,
  customSubtitle,
  onSubtitleChange,
  isEditable,
  websiteUrl,
  entityId,
  entityType = 'brand',
}: SponsorLogosSectionProps) => {
  const [isHeaderEditing, setIsHeaderEditing] = useState(false);
  const [urlPopoverOpen, setUrlPopoverOpen] = useState<string | null>(null);
  const [urlInput, setUrlInput] = useState('');
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [newSponsor, setNewSponsor] = useState({
    name: '',
    tier: 'partner' as TierType,
    websiteUrl: '',
    placement: '',
  });
  const { uploadFile, isUploading } = useStorageUpload({ entityType, entityId });

  // Default to false for public view; only editable if explicitly enabled AND handler exists
  const canEdit = (isEditable ?? false) && !!onSponsorsChange;

  const handleAddSponsor = (logoUrl: string) => {
    if (!onSponsorsChange) return;
    
    const sponsor: SponsorLogo = {
      id: crypto.randomUUID(),
      name: newSponsor.name || 'New Sponsor',
      url: logoUrl,
      tier: newSponsor.tier,
      websiteUrl: newSponsor.websiteUrl || undefined,
      placement: newSponsor.placement || undefined,
    };
    
    onSponsorsChange([...sponsors, sponsor]);
    setIsAddingNew(false);
    setNewSponsor({ name: '', tier: 'partner', websiteUrl: '', placement: '' });
    toast.success('Sponsor added');
  };

  const handleUpdateSponsor = (id: string, updates: Partial<SponsorLogo>) => {
    if (!onSponsorsChange) return;
    onSponsorsChange(sponsors.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const handleDeleteSponsor = (id: string) => {
    if (!onSponsorsChange) return;
    onSponsorsChange(sponsors.filter(s => s.id !== id));
    toast.success('Sponsor removed');
  };

  const handleFileDrop = useCallback(async (file: File, sponsorId?: string) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    let url: string;
    if (entityId) {
      const result = await uploadFile(file, 'asset', `sponsor-${crypto.randomUUID()}`);
      if (!result) return;
      url = result.url;
    } else {
      const reader = new FileReader();
      url = await new Promise((resolve) => {
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.readAsDataURL(file);
      });
    }

    if (sponsorId) {
      handleUpdateSponsor(sponsorId, { url });
    } else {
      handleAddSponsor(url);
    }
  }, [sponsors, onSponsorsChange, entityId, uploadFile]);

  const handleUrlSubmit = (sponsorId?: string) => {
    if (!urlInput.trim()) return;
    
    if (sponsorId) {
      handleUpdateSponsor(sponsorId, { url: urlInput.trim() });
    } else {
      handleAddSponsor(urlInput.trim());
    }
    
    setUrlInput('');
    setUrlPopoverOpen(null);
  };

  const handleImportFromScanner = (images: { name: string; url: string; type: string }[]) => {
    if (!onSponsorsChange) return;
    const newSponsors = images.map((img) => ({
      id: crypto.randomUUID(),
      name: img.name,
      url: img.url,
      tier: 'partner' as TierType,
    }));
    onSponsorsChange([...sponsors, ...newSponsors]);
    toast.success(`Imported ${newSponsors.length} sponsor logos`);
  };

  // Group sponsors by tier
  const sponsorsByTier = Object.keys(TIER_CONFIG).reduce((acc, tier) => {
    acc[tier as TierType] = sponsors.filter(s => s.tier === tier);
    return acc;
  }, {} as Record<TierType, SponsorLogo[]>);

  const hasSponsors = sponsors.length > 0;

  return (
    <section id="sponsorlogos" className="scroll-mt-24">
      <SectionHeader
        title="Sponsor Logos"
        defaultSubtitle="Partner and sponsor logo placement by tier"
        isEditing={isHeaderEditing}
        onEditToggle={() => setIsHeaderEditing(!isHeaderEditing)}
        onSubtitleChange={canEdit ? onSubtitleChange : undefined}
        customSubtitle={customSubtitle}
      />

      {!hasSponsors && !isAddingNew ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Crown className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="font-semibold text-lg mb-2">No sponsor logos yet</h3>
            <p className="text-muted-foreground mb-4">Add sponsor and partner logos organized by tier</p>
            {canEdit && (
              <div className="flex gap-2">
                <Button onClick={() => setIsAddingNew(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Sponsor
                </Button>
                <GlobalLogoPickerDialog
                  existingLogoNames={sponsors.map(s => s.name)}
                  onImport={(imported) => {
                    if (!onSponsorsChange) return;
                    const newSponsors: SponsorLogo[] = imported.map(logo => ({
                      id: crypto.randomUUID(),
                      name: logo.name,
                      url: logo.files?.find(f => f.variant === 'black')?.url || logo.files?.find(f => f.variant === 'color')?.url || logo.files?.[0]?.url || '',
                      tier: 'partner' as const,
                      websiteUrl: logo.websiteUrl,
                    }));
                    onSponsorsChange([...sponsors, ...newSponsors]);
                  }}
                />
                <Button variant="outline" onClick={() => setIsScannerOpen(true)}>
                  <Globe className="h-4 w-4 mr-2" />
                  Scan Website
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {/* Add New Sponsor Form */}
          {canEdit && isAddingNew && (
            <Card className="border-primary/50 bg-primary/5">
              <CardContent className="p-4 space-y-4">
                <h4 className="font-medium">Add New Sponsor</h4>
                
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Sponsor Name</Label>
                    <Input
                      value={newSponsor.name}
                      onChange={(e) => setNewSponsor({ ...newSponsor, name: e.target.value })}
                      placeholder="Company Name"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Tier</Label>
                    <Select
                      value={newSponsor.tier}
                      onValueChange={(value: TierType) => setNewSponsor({ ...newSponsor, tier: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(TIER_CONFIG).map(([key, config]) => (
                          <SelectItem key={key} value={key}>
                            <div className="flex items-center gap-2">
                              <config.icon className="h-4 w-4" />
                              {config.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Website URL (optional)</Label>
                    <Input
                      value={newSponsor.websiteUrl}
                      onChange={(e) => setNewSponsor({ ...newSponsor, websiteUrl: e.target.value })}
                      placeholder="https://..."
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Placement (optional)</Label>
                    <Input
                      value={newSponsor.placement}
                      onChange={(e) => setNewSponsor({ ...newSponsor, placement: e.target.value })}
                      placeholder="Main stage, lanyards, etc."
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Logo</Label>
                  <div className="flex gap-2">
                    <ImageLibraryPicker
                      onSelect={(url) => handleAddSponsor(url)}
                      trigger={
                        <Button variant="outline" size="sm">
                          <Upload className="h-4 w-4 mr-2" />
                          From Library
                        </Button>
                      }
                    />
                    
                    <Popover open={urlPopoverOpen === 'new'} onOpenChange={(open) => setUrlPopoverOpen(open ? 'new' : null)}>
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Link2 className="h-4 w-4 mr-2" />
                          From URL
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-80">
                        <div className="space-y-2">
                          <Label>Logo URL</Label>
                          <Input
                            value={urlInput}
                            onChange={(e) => setUrlInput(e.target.value)}
                            placeholder="https://example.com/logo.png"
                            onKeyDown={(e) => e.key === 'Enter' && handleUrlSubmit()}
                          />
                          <Button size="sm" onClick={() => handleUrlSubmit()}>Add Logo</Button>
                        </div>
                      </PopoverContent>
                    </Popover>
                    
                    <Button variant="ghost" size="sm" onClick={() => setIsAddingNew(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Sponsors by Tier */}
          {Object.entries(TIER_CONFIG).map(([tierKey, tierConfig]) => {
            const tierSponsors = sponsorsByTier[tierKey as TierType];
            if (tierSponsors.length === 0) return null;

            return (
              <div key={tierKey} className="space-y-3">
                <div className="flex items-center gap-2">
                  <Badge className={cn("gap-1", tierConfig.color)}>
                    <tierConfig.icon className="h-3 w-3" />
                    {tierConfig.label}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {tierSponsors.length} sponsor{tierSponsors.length !== 1 ? 's' : ''}
                  </span>
                </div>

                <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                  {tierSponsors.map((sponsor) => (
                    <SponsorCard
                      key={sponsor.id}
                      sponsor={sponsor}
                      canEdit={canEdit}
                      tierConfig={tierConfig}
                      onUpdate={(updates) => handleUpdateSponsor(sponsor.id, updates)}
                      onDelete={() => handleDeleteSponsor(sponsor.id)}
                      onFileDrop={(file) => handleFileDrop(file, sponsor.id)}
                    />
                  ))}
                </div>
              </div>
            );
          })}

          {/* Add Buttons */}
          {canEdit && !isAddingNew && (
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsAddingNew(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Sponsor
              </Button>
              <GlobalLogoPickerDialog
                existingLogoNames={sponsors.map(s => s.name)}
                onImport={(imported) => {
                  if (!onSponsorsChange) return;
                  const newSponsors: SponsorLogo[] = imported.map(logo => ({
                    id: crypto.randomUUID(),
                    name: logo.name,
                    url: logo.files?.find(f => f.variant === 'black')?.url || logo.files?.find(f => f.variant === 'color')?.url || logo.files?.[0]?.url || '',
                    tier: 'partner' as const,
                    websiteUrl: logo.websiteUrl,
                  }));
                  onSponsorsChange([...sponsors, ...newSponsors]);
                }}
              />
              <Button variant="outline" onClick={() => setIsScannerOpen(true)}>
                <Globe className="h-4 w-4 mr-2" />
                Scan Website
              </Button>
            </div>
          )}
        </div>
      )}

      {canEdit && (
        <WebsiteImageScanner
          open={isScannerOpen}
          onOpenChange={setIsScannerOpen}
          defaultUrl={websiteUrl || ''}
          onImportImages={handleImportFromScanner}
        />
      )}
    </section>
  );
};

interface SponsorCardProps {
  sponsor: SponsorLogo;
  canEdit: boolean;
  tierConfig: typeof TIER_CONFIG[TierType];
  onUpdate: (updates: Partial<SponsorLogo>) => void;
  onDelete: () => void;
  onFileDrop: (file: File) => void;
}

const SponsorCard = ({ sponsor, canEdit, tierConfig, onUpdate, onDelete, onFileDrop }: SponsorCardProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (canEdit) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (!canEdit) return;
    const file = e.dataTransfer.files?.[0];
    if (file) onFileDrop(file);
  };

  return (
    <Card 
      className={cn(
        "group relative overflow-hidden transition-all",
        isDragging && "ring-2 ring-primary"
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <CardContent className="p-3 space-y-2">
        {/* Logo */}
        <div className={cn(
          "aspect-[3/2] rounded-md flex items-center justify-center overflow-hidden border",
          sponsor.url && /white/i.test(sponsor.url) ? "bg-gray-900" : "bg-white"
        )}>
          {sponsor.url ? (
            <img
              src={sponsor.url}
              alt={sponsor.name}
              className="max-w-full max-h-full object-contain p-2"
            />
          ) : (
            <tierConfig.icon className="h-8 w-8 text-muted-foreground/30" />
          )}
        </div>

        {/* Name */}
        {isEditing && canEdit ? (
          <Input
            value={sponsor.name}
            onChange={(e) => onUpdate({ name: e.target.value })}
            onBlur={() => setIsEditing(false)}
            autoFocus
            className="h-7 text-sm"
          />
        ) : (
          <p 
            className={cn(
              "text-sm font-medium truncate",
              canEdit && "cursor-pointer hover:text-primary"
            )}
            onClick={() => canEdit && setIsEditing(true)}
          >
            {sponsor.name}
          </p>
        )}

        {/* Placement badge */}
        {sponsor.placement && (
          <p className="text-xs text-muted-foreground truncate">{sponsor.placement}</p>
        )}

        {/* Actions */}
        {canEdit && (
          <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
            {sponsor.websiteUrl && (
              <Button
                size="icon"
                variant="secondary"
                className="h-6 w-6"
                onClick={() => window.open(sponsor.websiteUrl, '_blank')}
              >
                <ExternalLink className="h-3 w-3" />
              </Button>
            )}
            <Button
              size="icon"
              variant="secondary"
              className="h-6 w-6"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-3 w-3" />
            </Button>
            <Button
              size="icon"
              variant="destructive"
              className="h-6 w-6"
              onClick={onDelete}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onFileDrop(file);
          }}
        />
      </CardContent>
    </Card>
  );
};
