import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Building2, FlaskConical, Scale, Shield, Monitor, Film, Gamepad2, Radio, Heart, Database, Microscope, Globe, Trash2, Plus, X, Search, ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { LinkedBoothCard } from '@/types/brand';
import { useBoothImages } from '@/hooks/useBoothImages';
import { useCustomDivisions } from '@/hooks/useCustomDivisions';
import { DivisionDetail, DIVISIONS, customToBoothDivision, type BoothDivision } from '@/pages/BoothsCatalog';

// Icon map matching BoothsCatalog DIVISIONS
const ICON_MAP: Record<string, React.ElementType> = {
  Building2, FlaskConical, Scale, Shield, Monitor, Film, Gamepad2,
  Radio, Heart, Database, Microscope, Globe,
};

// Static booth division data for the picker
const BOOTH_DIVISIONS = [
  { id: 'corporate', name: 'Corporate', tagline: 'The Language of Global Business', iconName: 'Building2', color: 'hsl(200, 85%, 45%)', services: ['Efficient Translation', 'Analytics & Insights', 'Real-Time Updates'] },
  { id: 'life-sciences', name: 'Life Sciences', tagline: 'Simplify Your Path From Lab to Launch', iconName: 'FlaskConical', color: 'hsl(195, 80%, 40%)', services: ['Regulatory Affairs', 'Patient Recruitment', 'Medical Writing'] },
  { id: 'legal', name: 'Legal', tagline: 'The Global Leader in Legal Technology & Support', iconName: 'Scale', color: 'hsl(210, 70%, 35%)', services: ['eDiscovery', 'Forensic Technology', 'Managed Review'] },
  { id: 'ip', name: 'IP (Intellectual Property)', tagline: 'Protect Your IP in Any Country', iconName: 'Shield', color: 'hsl(220, 65%, 40%)', services: ['Patent Filing', 'AI Translation', 'GlobalLink'] },
  { id: 'digital', name: 'Digital', tagline: 'Global Performance for International Brands', iconName: 'Monitor', color: 'hsl(265, 60%, 50%)', services: ['SEO & Paid Media', 'AI Copywriting', 'Social Intelligence'] },
  { id: 'media', name: 'Media', tagline: "The World's Largest Provider of Media Services", iconName: 'Film', color: 'hsl(350, 70%, 50%)', services: ['Subtitling', 'Dubbing', 'Accessibility'] },
  { id: 'gaming', name: 'Gaming', tagline: 'Level Up Your Global Reach', iconName: 'Gamepad2', color: 'hsl(280, 70%, 55%)', services: ['Game Localization', 'QA Testing', 'Voiceover'] },
  { id: 'globallink', name: 'GlobalLink', tagline: 'Unlock Global Content Velocity', iconName: 'Globe', color: 'hsl(190, 75%, 42%)', services: ['TMS', 'AI Translation', 'CMS Connectors'] },
  { id: 'regulated-industries', name: 'Regulated Industries', tagline: 'Risk-Free Compliance at Scale', iconName: 'Shield', color: 'hsl(200, 60%, 35%)', services: ['Compliance', 'Regulatory', 'Quality'] },
  { id: 'ai', name: 'AI Solutions', tagline: 'AI-Powered Language Technology', iconName: 'Database', color: 'hsl(250, 65%, 55%)', services: ['NMT', 'LLM Solutions', 'Data Services'] },
  { id: 'techresearch', name: 'Tech & Research', tagline: 'Powering Discovery Through Language', iconName: 'Microscope', color: 'hsl(175, 60%, 40%)', services: ['Patent Analytics', 'Research Translation', 'Data Mining'] },
  { id: 'healthcare', name: 'Healthcare', tagline: 'Connecting Patients Through Language', iconName: 'Heart', color: 'hsl(0, 65%, 50%)', services: ['Patient Communication', 'Telephonic Interpreting', 'Healthcare Innovation'] },
];

// Card that renders a linked booth in the brand guide — exported for inline use
export const LinkedBoothPreviewCard = ({ booth, isEditable, onRemove, onOpenDetail }: {
  booth: LinkedBoothCard;
  isEditable: boolean;
  onRemove: () => void;
  onOpenDetail: () => void;
}) => {
  const Icon = ICON_MAP[booth.iconName] || Building2;
  const { images, getVariantImage } = useBoothImages(booth.divisionId);
  // Try __card__ first, then fall back to the first available image from the division
  const cardImage = getVariantImage('__card__', '') || images[0]?.image_url || '';

  return (
    <motion.button
      onClick={onOpenDetail}
      className="group relative overflow-hidden rounded-2xl border border-border/40 bg-card text-left transition-all hover:border-primary/30 hover:shadow-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-primary w-full"
      whileHover={{ y: -4, scale: 1.01 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
    >
      <div className="relative aspect-[16/10] overflow-hidden">
        {cardImage ? (
          <img
            src={cardImage}
            alt={`${booth.divisionName} booth`}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center" style={{ backgroundColor: booth.color + '20' }}>
            <Icon className="h-12 w-12 text-muted-foreground/30" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        <div className="absolute bottom-4 left-4 right-4">
          <div className="flex items-center gap-2 mb-1">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ backgroundColor: booth.color }}>
              <Icon className="h-4 w-4 text-white" />
            </div>
            <h3 className="text-lg font-bold text-white font-heading">{booth.divisionName}</h3>
          </div>
          <p className="text-xs text-white/80 line-clamp-1">{booth.tagline}</p>
        </div>
        <div className="absolute top-3 right-3 flex gap-1.5">
          <Badge variant="secondary" className="bg-white/90 text-foreground text-xs backdrop-blur-sm border-none gap-1">
            <ExternalLink className="h-3 w-3" />
            Booth Card
          </Badge>
        </div>
        {isEditable && (
          <button
            onClick={(e) => { e.stopPropagation(); onRemove(); }}
            className="absolute top-3 left-3 h-7 w-7 rounded-full bg-black/50 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white hover:bg-destructive/70 transition-colors opacity-0 group-hover:opacity-100"
            title="Remove linked booth"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
      <div className="p-4">
        <div className="flex flex-wrap gap-1.5">
          {booth.services.slice(0, 3).map((s) => (
            <Badge key={s} variant="outline" className="text-[10px] font-normal">{s}</Badge>
          ))}
          {booth.services.length > 3 && (
            <Badge variant="outline" className="text-[10px] font-normal text-muted-foreground">
              +{booth.services.length - 3} more
            </Badge>
          )}
        </div>
      </div>
    </motion.button>
  );
};

// Picker dialog for selecting booths to link
export const LinkBoothDialog = ({ open, onOpenChange, linkedBooths, onLink }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  linkedBooths: LinkedBoothCard[];
  onLink: (booth: LinkedBoothCard) => void;
}) => {
  const [search, setSearch] = useState('');
  const { divisions: customDivisions } = useCustomDivisions();
  const linkedIds = new Set(linkedBooths.map(b => b.divisionId));

  // Merge static divisions with DB overrides + add any purely custom divisions
  const allDivisions = useMemo(() => {
    // Apply DB overrides to static divisions
    const merged = BOOTH_DIVISIONS.map(staticDiv => {
      const dbOverride = customDivisions.find(d => d.division_id === staticDiv.id);
      if (dbOverride) {
        return {
          ...staticDiv,
          name: dbOverride.name || staticDiv.name,
          tagline: dbOverride.tagline || staticDiv.tagline,
          color: dbOverride.color || staticDiv.color,
          iconName: dbOverride.icon_name || staticDiv.iconName,
          services: dbOverride.services?.length ? dbOverride.services : staticDiv.services,
        };
      }
      return staticDiv;
    });

    // Add custom divisions that don't match any static ID
    const staticIds = new Set(BOOTH_DIVISIONS.map(d => d.id));
    const uniqueCustoms = customDivisions
      .filter(d => !staticIds.has(d.division_id))
      .map(d => ({
        id: d.division_id,
        name: d.name,
        tagline: d.tagline || '',
        iconName: d.icon_name || 'Building2',
        color: d.color || 'hsl(200, 70%, 45%)',
        services: d.services || [],
      }));

    return [...merged, ...uniqueCustoms];
  }, [customDivisions]);

  const filtered = useMemo(() => {
    if (!search.trim()) return allDivisions;
    const q = search.toLowerCase();
    return allDivisions.filter(d =>
      d.name.toLowerCase().includes(q) || d.tagline.toLowerCase().includes(q)
    );
  }, [search, allDivisions]);

  const handleSelect = (div: typeof BOOTH_DIVISIONS[0]) => {
    onLink({
      id: crypto.randomUUID(),
      divisionId: div.id,
      divisionName: div.name,
      tagline: div.tagline,
      color: div.color,
      iconName: div.iconName,
      services: div.services,
      linkedAt: new Date().toISOString(),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Link Booth Card</DialogTitle>
          <DialogDescription>Select a booth division to embed in this brand guide's Event Signage section.</DialogDescription>
        </DialogHeader>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search divisions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <ScrollArea className="flex-1 -mx-6 px-6">
          <div className="space-y-2 py-2">
            {filtered.map((div) => {
              const Icon = ICON_MAP[div.iconName] || Building2;
              const alreadyLinked = linkedIds.has(div.id);
              return (
                <button
                  key={div.id}
                  onClick={() => !alreadyLinked && handleSelect(div)}
                  disabled={alreadyLinked}
                  className="w-full flex items-center gap-3 p-3 rounded-lg border border-border/40 hover:border-primary/40 hover:bg-muted/40 transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg shrink-0" style={{ backgroundColor: div.color }}>
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{div.name}</p>
                    <p className="text-xs text-muted-foreground line-clamp-1">{div.tagline}</p>
                    {div.services.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {div.services.slice(0, 3).map(s => (
                          <Badge key={s} variant="outline" className="text-[10px] font-normal py-0">{s}</Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  {alreadyLinked ? (
                    <Badge variant="secondary" className="text-[10px] shrink-0">Linked</Badge>
                  ) : (
                    <Plus className="h-4 w-4 text-muted-foreground shrink-0" />
                  )}
                </button>
              );
            })}
            {filtered.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">No matching divisions found</p>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
// Helper: resolve a LinkedBoothCard to a full BoothDivision for DivisionDetail — exported for inline use
export function resolveBoothDivision(booth: LinkedBoothCard, customDivisions: ReturnType<typeof useCustomDivisions>['divisions']): BoothDivision | null {
  // Check static DIVISIONS first
  const staticDiv = DIVISIONS.find(d => d.id === booth.divisionId);
  if (staticDiv) return staticDiv;

  // Check custom divisions
  const customDiv = customDivisions.find(d => d.division_id === booth.divisionId);
  if (customDiv) return customToBoothDivision(customDiv);

  return null;
}

// Section that renders linked booths within Event Signage
export const LinkedBoothsSection = ({ linkedBooths, isEditable, onChange }: {
  linkedBooths: LinkedBoothCard[];
  isEditable: boolean;
  onChange?: (booths: LinkedBoothCard[]) => void;
}) => {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [selectedDivision, setSelectedDivision] = useState<BoothDivision | null>(null);
  const { divisions: customDivisions } = useCustomDivisions();

  if (linkedBooths.length === 0 && !isEditable) return null;

  const handleLink = (booth: LinkedBoothCard) => {
    onChange?.([...linkedBooths, booth]);
    setPickerOpen(false);
  };

  const handleRemove = (id: string) => {
    onChange?.(linkedBooths.filter(b => b.id !== id));
  };

  const handleOpenDetail = (booth: LinkedBoothCard) => {
    const division = resolveBoothDivision(booth, customDivisions);
    if (division) {
      setSelectedDivision(division);
    }
  };

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-lg flex items-center gap-2">
          Booth Cards
          <Badge variant="secondary" className="font-normal">{linkedBooths.length}</Badge>
        </h3>
        {isEditable && (
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setPickerOpen(true)}>
            <Plus className="h-3.5 w-3.5" />
            Link Booth
          </Button>
        )}
      </div>

      {linkedBooths.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {linkedBooths.map((booth) => (
            <LinkedBoothPreviewCard
              key={booth.id}
              booth={booth}
              isEditable={isEditable}
              onRemove={() => handleRemove(booth.id)}
              onOpenDetail={() => handleOpenDetail(booth)}
            />
          ))}
        </div>
      ) : isEditable ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-8 text-center">
            <Building2 className="h-8 w-8 text-muted-foreground/40 mb-3" />
            <p className="text-sm text-muted-foreground mb-3">No booth cards linked yet</p>
            <Button variant="outline" size="sm" onClick={() => setPickerOpen(true)} className="gap-1.5">
              <Plus className="h-3.5 w-3.5" />
              Link Booth Card
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <LinkBoothDialog
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        linkedBooths={linkedBooths}
        onLink={handleLink}
      />

      {/* Full Booth Detail Popup - same as Booth Catalog */}
      <AnimatePresence>
        {selectedDivision && (
          <DivisionDetail
            division={selectedDivision}
            onClose={() => setSelectedDivision(null)}
            isAdmin={false}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
