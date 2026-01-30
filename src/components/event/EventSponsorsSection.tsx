import { useState, useRef } from 'react';
import { Plus, Trash2, Check, X, Crown, Star, Medal, Award, Users, ExternalLink, Upload, Link } from 'lucide-react';
import { EventSponsor } from '@/types/event';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { RichTextDisplay } from '@/components/ui/rich-text-editor';

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
  const [logoInputMode, setLogoInputMode] = useState<'upload' | 'url'>('upload');
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [newItem, setNewItem] = useState<Partial<EventSponsor>>({
    name: '',
    tier: 'gold',
    logoUrl: '',
  });

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate image file
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file (PNG, JPG, SVG, etc.)');
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
      websiteUrl: newItem.websiteUrl,
      description: newItem.description,
      placement: newItem.placement,
    };
    
    onUpdate([...sponsors, item]);
    setNewItem({ name: '', tier: 'gold', logoUrl: '' });
    setLogoInputMode('upload');
    if (logoInputRef.current) logoInputRef.current.value = '';
    setIsAddingNew(false);
  };

  const handleDelete = (id: string) => {
    onUpdate(sponsors.filter(s => s.id !== id));
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
          <Button onClick={() => setIsAddingNew(true)} disabled={isAddingNew}>
            <Plus className="h-4 w-4 mr-2" />
            Add Sponsor
          </Button>
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
                <Tabs value={logoInputMode} onValueChange={(v) => setLogoInputMode(v as 'upload' | 'url')} className="w-full">
                  <TabsList className="grid w-full grid-cols-2 h-9">
                    <TabsTrigger value="upload" className="text-xs gap-1.5">
                      <Upload className="h-3.5 w-3.5" />
                      Upload
                    </TabsTrigger>
                    <TabsTrigger value="url" className="text-xs gap-1.5">
                      <Link className="h-3.5 w-3.5" />
                      URL
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
              <Button onClick={() => setIsAddingNew(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add First Sponsor
              </Button>
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
                  {tierSponsors.map((sponsor) => (
                    <Card key={sponsor.id} className="group relative overflow-hidden hover:border-primary/50 transition-colors">
                      <CardContent className="p-4">
                        {sponsor.logoUrl ? (
                          <div className={cn(
                            "flex items-center justify-center bg-white rounded-lg mb-3",
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
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};
