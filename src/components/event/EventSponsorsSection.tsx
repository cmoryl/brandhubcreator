import { useState, useRef } from 'react';
import { Plus, Trash2, Check, X, Crown, Star, Medal, Award, Users, ExternalLink, Upload, Link, ChevronDown, ChevronUp, Image } from 'lucide-react';
import { EventSponsor, SponsorLogoVariant } from '@/types/event';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { RichTextDisplay } from '@/components/ui/rich-text-editor';
import { ImageLibraryPicker } from '@/components/ui/ImageLibraryPicker';
import { GlobalLogoPickerDialog } from '@/components/brand/GlobalLogoPickerDialog';
import { Globe2 } from 'lucide-react';
import { toast } from 'sonner';
import type { ClientLogo } from '@/types/brand';

interface EventSponsorsSectionProps {
  sponsors: EventSponsor[];
  onUpdate: (sponsors: EventSponsor[]) => void;
  isEditable?: boolean;
  subtitle?: string;
}

const SPONSOR_TIERS = [
  { value: 'platinum', label: 'Platinum', icon: Crown, color: 'bg-gradient-to-r from-slate-400 to-slate-300 text-slate-900' },
  { value: 'gold', label: 'Gold', icon: Star, color: 'bg-gradient-to-r from-yellow-400 to-amber-300 text-amber-900' },
  { value: 'silver', label: 'Silver', icon: Medal, color: 'bg-gradient-to-r from-gray-300 to-gray-200 text-gray-800' },
  { value: 'bronze', label: 'Bronze', icon: Award, color: 'bg-gradient-to-r from-orange-300 to-amber-200 text-orange-900' },
  { value: 'partner', label: 'Partner', icon: Users, color: 'bg-primary/10 text-primary' },
  { value: 'media', label: 'Media Partner', icon: Users, color: 'bg-blue-100 text-blue-800' },
  { value: 'other', label: 'Other', icon: Users, color: 'bg-gray-100 text-gray-800' },
];

const LOGO_VARIANTS = [
  { value: 'color', label: 'Color' },
  { value: 'white', label: 'White' },
  { value: 'black', label: 'Black' },
  { value: 'primary', label: 'Primary' },
];

const getTierInfo = (tier: EventSponsor['tier']) => {
  return SPONSOR_TIERS.find(t => t.value === tier) || SPONSOR_TIERS[SPONSOR_TIERS.length - 1];
};

export const EventSponsorsSection = ({
  sponsors,
  onUpdate,
  isEditable = true,
  subtitle,
}: EventSponsorsSectionProps) => {
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [logoInputMode, setLogoInputMode] = useState<'upload' | 'url' | 'library'>('upload');
  const [expandedSponsors, setExpandedSponsors] = useState<Set<string>>(new Set());
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [newItem, setNewItem] = useState<Partial<EventSponsor>>({
    name: '',
    tier: 'gold',
    logoUrl: '',
    logoVariants: [],
  });

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setNewItem({ ...newItem, logoUrl: dataUrl });
    };
    reader.readAsDataURL(file);
  };

  const handleAdd = () => {
    if (!newItem.name) return;
    
    const item: EventSponsor = {
      id: crypto.randomUUID(),
      name: newItem.name,
      tier: newItem.tier as EventSponsor['tier'],
      logoUrl: newItem.logoUrl || '',
      logoVariants: [],
      websiteUrl: newItem.websiteUrl,
      description: newItem.description,
      placement: newItem.placement,
    };
    
    onUpdate([...sponsors, item]);
    setNewItem({ name: '', tier: 'gold', logoUrl: '', logoVariants: [] });
    setLogoInputMode('upload');
    if (logoInputRef.current) logoInputRef.current.value = '';
    setIsAddingNew(false);
    toast.success('Sponsor added');
  };

  const handleDelete = (id: string) => {
    onUpdate(sponsors.filter(s => s.id !== id));
    toast.success('Sponsor removed');
  };

  const toggleSponsorExpanded = (id: string) => {
    setExpandedSponsors(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleAddLogoVariant = (sponsorId: string, variant: SponsorLogoVariant['variant'], url: string) => {
    onUpdate(sponsors.map(s => {
      if (s.id !== sponsorId) return s;
      const existingVariants = s.logoVariants || [];
      // Replace if variant exists, otherwise add
      const existingIndex = existingVariants.findIndex(v => v.variant === variant);
      const newVariant: SponsorLogoVariant = { id: crypto.randomUUID(), variant, url };
      
      if (existingIndex >= 0) {
        const updated = [...existingVariants];
        updated[existingIndex] = newVariant;
        return { ...s, logoVariants: updated };
      }
      return { ...s, logoVariants: [...existingVariants, newVariant] };
    }));
    toast.success(`${variant} logo added`);
  };

  const handleRemoveLogoVariant = (sponsorId: string, variantId: string) => {
    onUpdate(sponsors.map(s => {
      if (s.id !== sponsorId) return s;
      return { ...s, logoVariants: (s.logoVariants || []).filter(v => v.id !== variantId) };
    }));
    toast.success('Logo variant removed');
  };
  // Group sponsors by tier
  const groupedSponsors = sponsors.reduce((acc, sponsor) => {
    if (!acc[sponsor.tier]) acc[sponsor.tier] = [];
    acc[sponsor.tier].push(sponsor);
    return acc;
  }, {} as Record<string, EventSponsor[]>);

  // Order tiers
  const tierOrder = ['platinum', 'gold', 'silver', 'bronze', 'partner', 'media', 'other'];
  const orderedTiers = tierOrder.filter(tier => groupedSponsors[tier]);

  return (
    <section id="eventsponsors" className="scroll-mt-24">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">Sponsors & Partners</h2>
          {subtitle ? (
            <RichTextDisplay html={subtitle} className="text-muted-foreground mt-1" />
          ) : (
            <p className="text-muted-foreground mt-1">Sponsor logos and placement guidelines by tier</p>
          )}
        </div>
        {isEditable && (
          <div className="flex gap-2">
            <Button onClick={() => setIsAddingNew(true)} disabled={isAddingNew}>
              <Plus className="h-4 w-4 mr-2" />
              Add Sponsor
            </Button>
            <GlobalLogoPickerDialog
              existingLogoNames={sponsors.map(s => s.name)}
              onImport={(imported) => {
                const newSponsors: EventSponsor[] = imported.map(logo => {
                  // Prefer black (transparent) logo, then color, then any available
                  const preferredFile = logo.files?.find(f => f.variant === 'black')
                    || logo.files?.find(f => f.variant === 'color')
                    || logo.files?.[0];
                  return {
                    id: crypto.randomUUID(),
                    name: logo.name,
                    tier: 'partner' as const,
                    logoUrl: preferredFile?.url || '',
                    logoVariants: [],
                    websiteUrl: logo.websiteUrl,
                  };
                });
                onUpdate([...sponsors, ...newSponsors]);
              }}
            />
          </div>
        )}
      </div>

      {isAddingNew && (
        <Card className="mb-6 border-dashed border-primary">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Sponsor Name</Label>
                <Input
                  value={newItem.name || ''}
                  onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                  placeholder="Acme Corp"
                />
              </div>
              <div className="space-y-2">
                <Label>Tier</Label>
                <Select
                  value={newItem.tier}
                  onValueChange={(value) => setNewItem({ ...newItem, tier: value as EventSponsor['tier'] })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SPONSOR_TIERS.map((tier) => (
                      <SelectItem key={tier.value} value={tier.value}>
                        {tier.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Logo</Label>
                <Tabs value={logoInputMode} onValueChange={(v) => setLogoInputMode(v as 'upload' | 'url' | 'library')} className="w-full">
                  <TabsList className="grid w-full grid-cols-3 h-9">
                    <TabsTrigger value="upload" className="text-xs gap-1.5">
                      <Upload className="h-3.5 w-3.5" />
                      Upload
                    </TabsTrigger>
                    <TabsTrigger value="url" className="text-xs gap-1.5">
                      <Link className="h-3.5 w-3.5" />
                      URL
                    </TabsTrigger>
                    <TabsTrigger value="library" className="text-xs gap-1.5">
                      <Image className="h-3.5 w-3.5" />
                      Library
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="upload" className="mt-2">
                    <div className="flex gap-2">
                      <input
                        ref={logoInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => logoInputRef.current?.click()}
                        className="flex-1 gap-2"
                      >
                        <Upload className="h-4 w-4" />
                        {newItem.logoUrl ? 'Change Logo' : 'Upload Logo'}
                      </Button>
                      {newItem.logoUrl && (
                        <div className="h-10 w-10 border rounded flex items-center justify-center bg-white">
                          <img src={newItem.logoUrl} alt="Preview" className="max-h-8 max-w-8 object-contain" />
                        </div>
                      )}
                    </div>
                  </TabsContent>
                  <TabsContent value="url" className="mt-2">
                    <Input
                      value={newItem.logoUrl || ''}
                      onChange={(e) => setNewItem({ ...newItem, logoUrl: e.target.value })}
                      placeholder="https://example.com/logo.png"
                    />
                  </TabsContent>
                  <TabsContent value="library" className="mt-2">
                    <div className="flex gap-2">
                      <ImageLibraryPicker
                        onSelect={(url) => setNewItem({ ...newItem, logoUrl: url })}
                        trigger={
                          <Button type="button" variant="outline" className="flex-1 gap-2">
                            <Image className="h-4 w-4" />
                            {newItem.logoUrl ? 'Change from Library' : 'Pick from Library'}
                          </Button>
                        }
                      />
                      {newItem.logoUrl && (
                        <div className="h-10 w-10 border rounded flex items-center justify-center bg-white">
                          <img src={newItem.logoUrl} alt="Preview" className="max-h-8 max-w-8 object-contain" />
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
              <div className="space-y-2">
                <Label>Website URL (optional)</Label>
                <Input
                  value={newItem.websiteUrl || ''}
                  onChange={(e) => setNewItem({ ...newItem, websiteUrl: e.target.value })}
                  placeholder="https://..."
                />
              </div>
              <div className="space-y-2">
                <Label>Placement (optional)</Label>
                <Input
                  value={newItem.placement || ''}
                  onChange={(e) => setNewItem({ ...newItem, placement: e.target.value })}
                  placeholder="Main stage, booth area..."
                />
              </div>
              <div className="space-y-2">
                <Label>Description (optional)</Label>
                <Input
                  value={newItem.description || ''}
                  onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                  placeholder="Brief description..."
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setIsAddingNew(false)}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button onClick={handleAdd} disabled={!newItem.name}>
                <Check className="h-4 w-4 mr-2" />
                Add Sponsor
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {sponsors.length === 0 && !isAddingNew ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Crown className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="font-semibold text-lg mb-2">No sponsors yet</h3>
            <p className="text-muted-foreground mb-4">Add sponsors and partners with their tier and logo placement</p>
            {isEditable && (
              <div className="flex gap-2">
                <Button onClick={() => setIsAddingNew(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Sponsor
                </Button>
                <GlobalLogoPickerDialog
                  existingLogoNames={sponsors.map(s => s.name)}
                  onImport={(imported) => {
                    const newSponsors: EventSponsor[] = imported.map(logo => {
                      const preferredFile = logo.files?.find(f => f.variant === 'black')
                        || logo.files?.find(f => f.variant === 'color')
                        || logo.files?.[0];
                      return {
                        id: crypto.randomUUID(),
                        name: logo.name,
                        tier: 'partner' as const,
                        logoUrl: preferredFile?.url || '',
                        logoVariants: [],
                        websiteUrl: logo.websiteUrl,
                      };
                    });
                    onUpdate([...sponsors, ...newSponsors]);
                  }}
                />
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {orderedTiers.map((tier) => {
            const tierInfo = getTierInfo(tier as EventSponsor['tier']);
            const TierIcon = tierInfo.icon;
            const tierSponsors = groupedSponsors[tier];
            
            return (
              <div key={tier}>
                <div className="flex items-center gap-2 mb-4">
                  <Badge className={cn("gap-1.5 py-1 px-3", tierInfo.color)}>
                    <TierIcon className="h-4 w-4" />
                    {tierInfo.label}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {tierSponsors.length} sponsor{tierSponsors.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className={cn(
                  "grid gap-4",
                  tier === 'platinum' && "grid-cols-1 md:grid-cols-2",
                  tier === 'gold' && "grid-cols-2 md:grid-cols-3",
                  tier === 'silver' && "grid-cols-2 md:grid-cols-4",
                  tier === 'bronze' && "grid-cols-3 md:grid-cols-5",
                  ['partner', 'media', 'other'].includes(tier) && "grid-cols-3 md:grid-cols-6"
                )}>
                  {tierSponsors.map((sponsor) => {
                    const isExpanded = expandedSponsors.has(sponsor.id);
                    const variantCount = sponsor.logoVariants?.length || 0;
                    
                    return (
                      <Card key={sponsor.id} className="group relative overflow-hidden hover:border-primary/50 transition-colors">
                        <CardContent className="p-4">
                          {/* Primary Logo */}
                          {sponsor.logoUrl ? (
                            <div className={cn(
                              "flex items-center justify-center rounded-lg mb-3",
                              /white/i.test(sponsor.logoUrl) ? "bg-gray-900" : "bg-white",
                              tier === 'platinum' && "h-24",
                              tier === 'gold' && "h-20",
                              tier === 'silver' && "h-16",
                              ['bronze', 'partner', 'media', 'other'].includes(tier) && "h-12"
                            )}>
                              <img
                                src={sponsor.logoUrl}
                                alt={sponsor.name}
                                className="max-w-full max-h-full object-contain p-2"
                              />
                            </div>
                          ) : (
                            <div className={cn(
                              "flex items-center justify-center bg-muted rounded-lg mb-3",
                              tier === 'platinum' && "h-24",
                              tier === 'gold' && "h-20",
                              tier === 'silver' && "h-16",
                              ['bronze', 'partner', 'media', 'other'].includes(tier) && "h-12"
                            )}>
                              <span className="text-muted-foreground font-medium text-sm">
                                {sponsor.name.charAt(0)}
                              </span>
                            </div>
                          )}
                          
                          {/* Name & Actions */}
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <h4 className="font-medium truncate text-sm">{sponsor.name}</h4>
                              {sponsor.placement && (
                                <p className="text-xs text-muted-foreground truncate">{sponsor.placement}</p>
                              )}
                            </div>
                            <div className="flex gap-1 shrink-0">
                              {sponsor.websiteUrl && (
                                <Button variant="ghost" size="sm" className="h-7 w-7 p-0" asChild>
                                  <a href={sponsor.websiteUrl} target="_blank" rel="noopener noreferrer">
                                    <ExternalLink className="h-3.5 w-3.5" />
                                  </a>
                                </Button>
                              )}
                              {isEditable && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 w-7 p-0 text-destructive hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                                  onClick={() => handleDelete(sponsor.id)}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              )}
                            </div>
                          </div>
                          
                          {/* Logo Variants Collapsible */}
                          {(isEditable || variantCount > 0) && (
                            <Collapsible open={isExpanded} onOpenChange={() => toggleSponsorExpanded(sponsor.id)} className="mt-3">
                              <CollapsibleTrigger asChild>
                                <Button variant="ghost" size="sm" className="w-full h-7 text-xs gap-1">
                                  <Image className="h-3 w-3" />
                                  Logo Variants {variantCount > 0 && `(${variantCount})`}
                                  {isExpanded ? <ChevronUp className="h-3 w-3 ml-auto" /> : <ChevronDown className="h-3 w-3 ml-auto" />}
                                </Button>
                              </CollapsibleTrigger>
                              <CollapsibleContent className="pt-2 space-y-2">
                                {/* Existing variants */}
                                {sponsor.logoVariants && sponsor.logoVariants.length > 0 && (
                                  <div className="grid grid-cols-2 gap-2">
                                    {sponsor.logoVariants.map((variant) => (
                                      <div key={variant.id} className="relative group/variant">
                                        <div className={cn(
                                          "aspect-[3/2] rounded border flex items-center justify-center p-1",
                                          variant.variant === 'white' && "bg-gray-800",
                                          variant.variant === 'black' && "bg-gray-100",
                                          variant.variant === 'color' && "bg-white",
                                          variant.variant === 'primary' && "bg-white"
                                        )}>
                                          <img src={variant.url} alt={variant.variant} className="max-w-full max-h-full object-contain" />
                                        </div>
                                        <Badge variant="secondary" className="absolute bottom-1 left-1 text-[10px] px-1 h-4">
                                          {variant.variant}
                                        </Badge>
                                        {isEditable && (
                                          <Button
                                            size="icon"
                                            variant="destructive"
                                            className="absolute top-1 right-1 h-5 w-5 opacity-0 group-hover/variant:opacity-100 transition-opacity"
                                            onClick={() => handleRemoveLogoVariant(sponsor.id, variant.id)}
                                          >
                                            <Trash2 className="h-3 w-3" />
                                          </Button>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                )}
                                
                                {/* Add variant buttons */}
                                {isEditable && (
                                  <div className="flex flex-wrap gap-1">
                                    {LOGO_VARIANTS.filter(v => !sponsor.logoVariants?.some(lv => lv.variant === v.value)).map((variant) => (
                                      <ImageLibraryPicker
                                        key={variant.value}
                                        onSelect={(url) => handleAddLogoVariant(sponsor.id, variant.value as SponsorLogoVariant['variant'], url)}
                                        trigger={
                                          <Button size="sm" variant="outline" className="h-6 text-[10px] px-2 gap-1">
                                            <Plus className="h-2.5 w-2.5" />
                                            {variant.label}
                                          </Button>
                                        }
                                      />
                                    ))}
                                  </div>
                                )}
                              </CollapsibleContent>
                            </Collapsible>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};
