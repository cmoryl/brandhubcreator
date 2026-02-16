import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Building2, FlaskConical, Scale, Shield, Monitor, Film, Gamepad2, Radio, Heart, Database, Microscope, Globe, Trash2, Plus, X, Search, ExternalLink, ChevronLeft, ChevronRight, Mail, Link2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { LinkedBoothCard } from '@/types/brand';
import { useBoothImages } from '@/hooks/useBoothImages';

// Icon map matching BoothsCatalog DIVISIONS
const ICON_MAP: Record<string, React.ElementType> = {
  Building2, FlaskConical, Scale, Shield, Monitor, Film, Gamepad2,
  Radio, Heart, Database, Microscope, Globe,
};

// Static booth division data for the picker
const BOOTH_DIVISIONS = [
  { id: 'corporate', name: 'Corporate', tagline: 'The Language of Global Business', iconName: 'Building2', color: 'hsl(200, 85%, 45%)', services: ['Efficient Translation', 'Analytics & Insights', 'Real-Time Updates'], description: 'Any Customer. Any Language. Any Channel.', email: 'info@transperfect.com', website: 'www.transperfect.com' },
  { id: 'life-sciences', name: 'Life Sciences', tagline: 'Simplify Your Path From Lab to Launch', iconName: 'FlaskConical', color: 'hsl(195, 80%, 40%)', services: ['Regulatory Affairs', 'Patient Recruitment', 'Medical Writing'], description: 'Comprehensive life sciences language solutions.', email: 'lifesciences@transperfect.com', website: 'www.transperfect.com/lifesciences' },
  { id: 'legal', name: 'Legal', tagline: 'The Global Leader in Legal Technology & Support', iconName: 'Scale', color: 'hsl(210, 70%, 35%)', services: ['eDiscovery', 'Forensic Technology', 'Managed Review'], description: 'Legal technology and support services.', email: 'legal@transperfect.com', website: 'www.transperfect.com/legal' },
  { id: 'ip', name: 'IP (Intellectual Property)', tagline: 'Protect Your IP in Any Country', iconName: 'Shield', color: 'hsl(220, 65%, 40%)', services: ['Patent Filing', 'AI Translation', 'GlobalLink'], description: 'Intellectual property protection worldwide.', email: 'ip@transperfect.com', website: 'www.transperfect.com/ip' },
  { id: 'digital', name: 'Digital', tagline: 'Global Performance for International Brands', iconName: 'Monitor', color: 'hsl(265, 60%, 50%)', services: ['SEO & Paid Media', 'AI Copywriting', 'Social Intelligence'], description: 'Digital marketing and performance services.', email: 'digital@transperfect.com', website: 'www.transperfect.com/digital' },
  { id: 'media', name: 'Media', tagline: "The World's Largest Provider of Media Services", iconName: 'Film', color: 'hsl(350, 70%, 50%)', services: ['Subtitling', 'Dubbing', 'Accessibility'], description: 'Media localization and accessibility services.', email: 'media@transperfect.com', website: 'www.transperfect.com/media' },
  { id: 'gaming', name: 'Gaming', tagline: 'Level Up Your Global Reach', iconName: 'Gamepad2', color: 'hsl(280, 70%, 55%)', services: ['Game Localization', 'QA Testing', 'Voiceover'], description: 'Gaming localization and QA services.', email: 'gaming@transperfect.com', website: 'www.transperfect.com/gaming' },
  { id: 'globallink', name: 'GlobalLink', tagline: 'Unlock Global Content Velocity', iconName: 'Globe', color: 'hsl(190, 75%, 42%)', services: ['TMS', 'AI Translation', 'CMS Connectors'], description: 'Translation management technology.', email: 'globallink@transperfect.com', website: 'www.globallink.com' },
  { id: 'regulated-industries', name: 'Regulated Industries', tagline: 'Risk-Free Compliance at Scale', iconName: 'Shield', color: 'hsl(200, 60%, 35%)', services: ['Compliance', 'Regulatory', 'Quality'], description: 'Compliance solutions for regulated industries.', email: 'regulated@transperfect.com', website: 'www.transperfect.com' },
  { id: 'ai', name: 'AI Solutions', tagline: 'AI-Powered Language Technology', iconName: 'Database', color: 'hsl(250, 65%, 55%)', services: ['NMT', 'LLM Solutions', 'Data Services'], description: 'AI-powered language technology solutions.', email: 'ai@transperfect.com', website: 'www.transperfect.com/ai' },
  { id: 'techresearch', name: 'Tech & Research', tagline: 'Powering Discovery Through Language', iconName: 'Microscope', color: 'hsl(175, 60%, 40%)', services: ['Patent Analytics', 'Research Translation', 'Data Mining'], description: 'Technology and research language services.', email: 'techresearch@transperfect.com', website: 'www.transperfect.com' },
  { id: 'healthcare', name: 'Healthcare', tagline: 'Connecting Patients Through Language', iconName: 'Heart', color: 'hsl(0, 65%, 50%)', services: ['Patient Communication', 'Telephonic Interpreting', 'Healthcare Innovation'], description: 'Healthcare communication and interpreting services.', email: 'healthcare@transperfect.com', website: 'www.transperfect.com/healthcare' },
];

// ─── Inline Booth Detail Dialog ───────────────────────────────────────
const BoothDetailInlineDialog = ({ booth, open, onOpenChange }: {
  booth: LinkedBoothCard;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) => {
  const navigate = useNavigate();
  const Icon = ICON_MAP[booth.iconName] || Building2;
  const { getMergedVariants } = useBoothImages(booth.divisionId);
  const [activeVariant, setActiveVariant] = useState(0);

  // Look up static data for description/email/website
  const staticData = BOOTH_DIVISIONS.find(d => d.id === booth.divisionId);

  // Get booth images from the database
  const staticVariants = staticData ? [
    { label: 'Default', image: '' },
  ] : [];
  const mergedVariants = getMergedVariants(staticVariants);
  const currentVariant = mergedVariants[activeVariant] || mergedVariants[0];
  const resolvedImage = currentVariant?.image || '';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col p-0">
        {/* Hero Header */}
        <div className="relative">
          {resolvedImage ? (
            <div className="relative aspect-[16/9] overflow-hidden bg-muted">
              <AnimatePresence mode="wait">
                <motion.img
                  key={`${activeVariant}-${resolvedImage}`}
                  src={resolvedImage}
                  alt={currentVariant?.label || booth.divisionName}
                  className="w-full h-full object-contain bg-muted"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                />
              </AnimatePresence>
              {mergedVariants.length > 1 && (
                <>
                  <button
                    onClick={() => setActiveVariant((p) => (p - 1 + mergedVariants.length) % mergedVariants.length)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setActiveVariant((p) => (p + 1) % mergedVariants.length)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                    {mergedVariants.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setActiveVariant(i)}
                        className={`h-2 rounded-full transition-all ${
                          i === activeVariant ? "w-6 bg-white" : "w-2 bg-white/50"
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="aspect-[16/9] flex items-center justify-center bg-muted" style={{ backgroundColor: booth.color + '15' }}>
              <Icon className="h-16 w-16 text-muted-foreground/30" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 p-6 space-y-5">
          {/* Title */}
          <div className="flex items-start gap-3">
            <div
              className="flex h-11 w-11 items-center justify-center rounded-xl shrink-0"
              style={{ backgroundColor: booth.color }}
            >
              <Icon className="h-5 w-5 text-white" />
            </div>
            <div>
              <DialogHeader className="text-left p-0 space-y-1">
                <DialogTitle className="text-xl font-bold font-heading">{booth.divisionName}</DialogTitle>
                <DialogDescription className="text-sm font-semibold text-primary uppercase tracking-wider">
                  {booth.tagline}
                </DialogDescription>
              </DialogHeader>
            </div>
          </div>

          {/* Description */}
          {staticData?.description && (
            <p className="text-sm text-muted-foreground leading-relaxed">{staticData.description}</p>
          )}

          {/* Variant Tabs */}
          {mergedVariants.length > 1 && (
            <div className="flex gap-2 flex-wrap">
              {mergedVariants.map((v, i) => (
                <Button
                  key={v.label}
                  variant={i === activeVariant ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveVariant(i)}
                  className="text-xs"
                >
                  {v.label}
                </Button>
              ))}
            </div>
          )}

          {/* Services */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Services</h4>
            <div className="flex flex-wrap gap-1.5">
              {booth.services.map((s) => (
                <Badge key={s} variant="secondary" className="text-xs font-normal">{s}</Badge>
              ))}
            </div>
          </div>

          {/* Contact */}
          {staticData && (
            <div className="flex flex-wrap gap-3">
              {staticData.email && (
                <a href={`mailto:${staticData.email}`} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
                  <Mail className="h-3.5 w-3.5" />
                  {staticData.email}
                </a>
              )}
              {staticData.website && (
                <a href={staticData.website.startsWith('http') ? staticData.website : `https://${staticData.website}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
                  <Link2 className="h-3.5 w-3.5" />
                  {staticData.website}
                </a>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-border/50 px-6 py-4 flex justify-between items-center">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => {
              onOpenChange(false);
              navigate('/booths', { state: { openDivision: booth.divisionId } });
            }}
          >
            <ExternalLink className="h-3.5 w-3.5" />
            View Full Booth Page
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// ─── Card that renders a linked booth in the brand guide ──────────────
const LinkedBoothPreviewCard = ({ booth, isEditable, onRemove }: {
  booth: LinkedBoothCard;
  isEditable: boolean;
  onRemove: () => void;
}) => {
  const [detailOpen, setDetailOpen] = useState(false);
  const Icon = ICON_MAP[booth.iconName] || Building2;
  const { getVariantImage } = useBoothImages(booth.divisionId);
  const cardImage = getVariantImage('__card__', '');

  return (
    <>
      <motion.button
        onClick={() => setDetailOpen(true)}
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

      <BoothDetailInlineDialog
        booth={booth}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />
    </>
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
  const linkedIds = new Set(linkedBooths.map(b => b.divisionId));

  const filtered = useMemo(() => {
    if (!search.trim()) return BOOTH_DIVISIONS;
    const q = search.toLowerCase();
    return BOOTH_DIVISIONS.filter(d =>
      d.name.toLowerCase().includes(q) || d.tagline.toLowerCase().includes(q)
    );
  }, [search]);

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

// Section that renders linked booths within Event Signage
export const LinkedBoothsSection = ({ linkedBooths, isEditable, onChange }: {
  linkedBooths: LinkedBoothCard[];
  isEditable: boolean;
  onChange?: (booths: LinkedBoothCard[]) => void;
}) => {
  const [pickerOpen, setPickerOpen] = useState(false);

  if (linkedBooths.length === 0 && !isEditable) return null;

  const handleLink = (booth: LinkedBoothCard) => {
    onChange?.([...linkedBooths, booth]);
    setPickerOpen(false);
  };

  const handleRemove = (id: string) => {
    onChange?.(linkedBooths.filter(b => b.id !== id));
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
    </div>
  );
};
