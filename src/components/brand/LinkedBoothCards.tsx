import { useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Building2, FlaskConical, Scale, Shield, Monitor, Film, Gamepad2, Radio, Heart, Database, Microscope, Globe, Trash2, Plus, X, Search, ExternalLink, Link as LinkIcon, ImagePlus, PenLine, ZoomIn, FileDown, FileText, Download } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { LinkedBoothCard, BoothLink } from '@/types/brand';
import { useBoothImages } from '@/hooks/useBoothImages';
import { useCustomDivisions } from '@/hooks/useCustomDivisions';
import { DivisionDetail, DIVISIONS, customToBoothDivision, type BoothDivision } from '@/pages/BoothsCatalog';
import { PreviewDialog } from '@/components/ui/preview-dialog';
import { Booth3DEmbed } from '@/components/brand/Booth3DEmbed';

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
  { id: 'media', name: 'Media', tagline: 'Where Boutique Expertise Meets Global Excellence', iconName: 'Film', color: 'hsl(340, 65%, 45%)', services: ['Subtitling', 'Dubbing', 'Accessibility'] },
  { id: 'games', name: 'Games', tagline: 'The Language of Global Games', iconName: 'Gamepad2', color: 'hsl(150, 60%, 40%)', services: ['Game Localization', 'QA Testing', 'Voiceover'] },
  { id: 'live', name: 'Live', tagline: 'Multilingual Event Solutions', iconName: 'Radio', color: 'hsl(180, 55%, 40%)', services: ['Content Creation', 'Interpreters', 'Event Technology'] },
  { id: 'globallink', name: 'GlobalLink', tagline: 'Unlock Global Content Velocity', iconName: 'Globe', color: 'hsl(190, 75%, 42%)', services: ['TMS', 'AI Translation', 'CMS Connectors'] },
  { id: 'regulated-industries', name: 'Regulated Industries', tagline: 'Risk-Free Compliance at Scale', iconName: 'Shield', color: 'hsl(200, 60%, 35%)', services: ['Compliance', 'Regulatory', 'Quality'] },
  { id: 'ai', name: 'AI Solutions', tagline: 'AI-Powered Language Technology', iconName: 'Database', color: 'hsl(250, 65%, 55%)', services: ['NMT', 'LLM Solutions', 'Data Services'] },
  { id: 'techresearch', name: 'Tech & Research', tagline: 'Powering Discovery Through Language', iconName: 'Microscope', color: 'hsl(175, 60%, 40%)', services: ['Patent Analytics', 'Research Translation', 'Data Mining'] },
  { id: 'healthcare', name: 'Healthcare', tagline: 'Connecting Patients Through Language', iconName: 'Heart', color: 'hsl(0, 65%, 50%)', services: ['Patient Communication', 'Telephonic Interpreting', 'Healthcare Innovation'] },
  { id: 'health', name: 'Health', tagline: 'Serving Seniors Through the Continuum of Care', iconName: 'Heart', color: 'hsl(350, 70%, 50%)', services: ['Physical Therapy', 'Rehabilitation', 'Digital Health'] },
  { id: 'dataforce', name: 'DataForce', tagline: 'Human Insights for AI that is Reliable. Refined. Respected.', iconName: 'Database', color: 'hsl(270, 55%, 50%)', services: ['Data Collection', 'Data Annotation', 'Bias Mitigation'] },
  { id: 'trial-interactive', name: 'Trial Interactive', tagline: 'Enabling Trial Collaboration in the Cloud', iconName: 'Microscope', color: 'hsl(190, 65%, 42%)', services: ['eClinical Platform', 'AI-Powered Intelligence', 'Expert Support'] },
  { id: 'g3', name: 'G3', tagline: 'Shaping Global Content. Empowering Human Connection.', iconName: 'Globe', color: 'hsl(25, 70%, 50%)', services: ['Learning & Development', 'Localization', 'Market Insights'] },
];

// Card that renders a linked booth in the brand guide — exported for inline use
export const LinkedBoothPreviewCard = ({ booth, isEditable, onRemove, onOpenDetail, onUpdateLinks, onUpdateImage, onUpdateFileUrls }: {
  booth: LinkedBoothCard;
  isEditable: boolean;
  onRemove: () => void;
  onOpenDetail: () => void;
  onUpdateLinks?: (links: BoothLink[]) => void;
  onUpdateImage?: (imageUrl: string | undefined) => void;
  onUpdateFileUrls?: (liveFileUrl?: string, pdfFileUrl?: string) => void;
}) => {
  const Icon = ICON_MAP[booth.iconName] || Building2;
  const { images, getVariantImage } = useBoothImages(booth.divisionId);
  const catalogImage = getVariantImage('__card__', '') || images[0]?.image_url || '';
  const cardImage = booth.customImage || catalogImage;
  const [showAddLink, setShowAddLink] = useState(false);
  const [newLinkLabel, setNewLinkLabel] = useState('');
  const [newLinkUrl, setNewLinkUrl] = useState('');
  const [showImageOptions, setShowImageOptions] = useState(false);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [showFileUrlEditor, setShowFileUrlEditor] = useState(false);
  const [liveFileUrlInput, setLiveFileUrlInput] = useState(booth.liveFileUrl || '');
  const [pdfFileUrlInput, setPdfFileUrlInput] = useState(booth.pdfFileUrl || '');

  const [previewOpen, setPreviewOpen] = useState(false);
  const [booth3DOpen, setBooth3DOpen] = useState(false);
  const boothLinks = booth.links || [];

  const handleAddLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!newLinkLabel.trim() || !newLinkUrl.trim() || !onUpdateLinks) return;
    const newLink: BoothLink = { id: crypto.randomUUID(), label: newLinkLabel.trim(), url: newLinkUrl.trim() };
    onUpdateLinks([...boothLinks, newLink]);
    setNewLinkLabel('');
    setNewLinkUrl('');
    setShowAddLink(false);
  };

  const handleRemoveLink = (linkId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onUpdateLinks?.(boothLinks.filter(l => l.id !== linkId));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onUpdateImage) return;
    setIsUploadingImage(true);
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      const ext = file.name.split('.').pop();
      const path = `booth-images/partner-${booth.id}-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from('organization-assets').upload(path, file, { upsert: true });
      if (error) throw error;
      const { data: urlData } = supabase.storage.from('organization-assets').getPublicUrl(path);
      onUpdateImage(urlData.publicUrl);
      setShowImageOptions(false);
    } catch (err) {
      console.error('Upload failed:', err);
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleImageUrlSubmit = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!imageUrlInput.trim() || !onUpdateImage) return;
    onUpdateImage(imageUrlInput.trim());
    setImageUrlInput('');
    setShowImageOptions(false);
  };

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-border/40 bg-card transition-all hover:border-primary/30 hover:shadow-2xl w-full">
      <motion.button
        onClick={() => setBooth3DOpen(true)}
        className="w-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        whileHover={{ y: -2, scale: 1.005 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        title="Open 3D booth viewer"
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
            {cardImage && (
              <button
                onClick={(e) => { e.stopPropagation(); setPreviewOpen(true); }}
                className="h-7 w-7 rounded-full bg-black/50 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white hover:bg-primary/70 transition-colors opacity-0 group-hover:opacity-100"
                title="View larger"
              >
                <ZoomIn className="h-3.5 w-3.5" />
              </button>
            )}
            {isEditable && (
              <button
                onClick={(e) => { e.stopPropagation(); setShowImageOptions(!showImageOptions); }}
                className="h-7 w-7 rounded-full bg-black/50 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white hover:bg-primary/70 transition-colors opacity-0 group-hover:opacity-100"
                title="Change preview image"
              >
                <ImagePlus className="h-3.5 w-3.5" />
              </button>
            )}
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
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
        </div>
      </motion.button>

      {/* Image Options */}
      {isEditable && showImageOptions && (
        <div className="px-4 pt-3 space-y-2" onClick={(e) => e.stopPropagation()}>
          <div className="flex gap-1.5">
            <Button size="sm" variant="outline" className="h-7 text-xs gap-1 flex-1" onClick={() => fileInputRef.current?.click()} disabled={isUploadingImage}>
              <ImagePlus className="h-3 w-3" /> {isUploadingImage ? 'Uploading...' : 'Upload'}
            </Button>
            {booth.customImage && (
              <Button size="sm" variant="ghost" className="h-7 text-xs text-destructive" onClick={() => { onUpdateImage?.(undefined); setShowImageOptions(false); }}>
                <X className="h-3 w-3" /> Remove
              </Button>
            )}
          </div>
          <div className="flex gap-1.5">
            <Input placeholder="Paste image URL..." value={imageUrlInput} onChange={(e) => setImageUrlInput(e.target.value)} className="h-7 text-xs flex-1" />
            <Button size="sm" variant="default" className="h-7 text-xs" onClick={handleImageUrlSubmit} disabled={!imageUrlInput.trim()}>Set</Button>
          </div>
        </div>
      )}
      <div className="p-4 space-y-3">
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

        {/* 3D Booth viewer (BoothHub embed) */}
        <Booth3DEmbed
          divisionId={booth.divisionId}
          divisionName={booth.divisionName}
          color={booth.color}
        />


        {boothLinks.length > 0 && (
          <div className="space-y-1.5">
            {boothLinks.map((link) => (
              <div key={link.id} className="flex items-center gap-2 group/link">
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center gap-1.5 text-xs text-primary hover:underline truncate flex-1"
                >
                  <LinkIcon className="h-3 w-3 shrink-0" />
                  {link.label}
                </a>
                {isEditable && (
                  <button
                    onClick={(e) => handleRemoveLink(link.id, e)}
                    className="h-5 w-5 rounded flex items-center justify-center text-muted-foreground hover:text-destructive opacity-0 group-hover/link:opacity-100 transition-opacity"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Add Link */}
        {isEditable && (
          showAddLink ? (
            <div className="space-y-2 pt-1" onClick={(e) => e.stopPropagation()}>
              <Input placeholder="Link label" value={newLinkLabel} onChange={(e) => setNewLinkLabel(e.target.value)} className="h-8 text-xs" />
              <Input placeholder="https://..." value={newLinkUrl} onChange={(e) => setNewLinkUrl(e.target.value)} className="h-8 text-xs" />
              <div className="flex gap-1.5">
                <Button size="sm" variant="default" className="h-7 text-xs gap-1" onClick={handleAddLink} disabled={!newLinkLabel.trim() || !newLinkUrl.trim()}>
                  <Plus className="h-3 w-3" /> Add
                </Button>
                <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={(e) => { e.stopPropagation(); setShowAddLink(false); }}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <button
              onClick={(e) => { e.stopPropagation(); setShowAddLink(true); }}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors pt-1"
            >
              <Plus className="h-3 w-3" />
              Add Link
            </button>
          )
        )}

        {/* Live / PDF File Links */}
        {(booth.liveFileUrl || booth.pdfFileUrl) && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {booth.liveFileUrl && (
              <a href={booth.liveFileUrl} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
                <Button size="sm" variant="outline" className="h-7 text-xs gap-1.5">
                  <Download className="h-3 w-3" /> Live Files
                </Button>
              </a>
            )}
            {booth.pdfFileUrl && (
              <a href={booth.pdfFileUrl} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
                <Button size="sm" variant="outline" className="h-7 text-xs gap-1.5">
                  <FileText className="h-3 w-3" /> PDF
                </Button>
              </a>
            )}
          </div>
        )}

        {/* Admin: Edit File URLs */}
        {isEditable && (
          showFileUrlEditor ? (
            <div className="space-y-2 pt-1 border-t border-border/40 mt-2" onClick={(e) => e.stopPropagation()}>
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">File URLs</p>
              <Input placeholder="Live files URL (Dropbox, Figma...)" value={liveFileUrlInput} onChange={(e) => setLiveFileUrlInput(e.target.value)} className="h-8 text-xs" />
              <Input placeholder="PDF file URL" value={pdfFileUrlInput} onChange={(e) => setPdfFileUrlInput(e.target.value)} className="h-8 text-xs" />
              <div className="flex gap-1.5">
                <Button size="sm" variant="default" className="h-7 text-xs gap-1" onClick={(e) => {
                  e.stopPropagation();
                  onUpdateFileUrls?.(liveFileUrlInput.trim() || undefined, pdfFileUrlInput.trim() || undefined);
                  setShowFileUrlEditor(false);
                }}>
                  <FileDown className="h-3 w-3" /> Save
                </Button>
                <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={(e) => { e.stopPropagation(); setShowFileUrlEditor(false); }}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <button
              onClick={(e) => { e.stopPropagation(); setShowFileUrlEditor(true); }}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              <FileDown className="h-3 w-3" />
              {booth.liveFileUrl || booth.pdfFileUrl ? 'Edit File URLs' : 'Add File URLs'}
            </button>
          )
        )}
      </div>

      {/* Preview Dialog with file links */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg" style={{ backgroundColor: booth.color }}>
                <Icon className="h-3.5 w-3.5 text-white" />
              </div>
              {booth.divisionName} — Booth Preview
            </DialogTitle>
          </DialogHeader>
          {cardImage && (
            <img src={cardImage} alt={`${booth.divisionName} booth`} className="w-full rounded-lg object-contain max-h-[50vh]" />
          )}
          <div className="space-y-3 pt-2">
            {/* File download buttons */}
            {(booth.liveFileUrl || booth.pdfFileUrl || boothLinks.length > 0) && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">Downloads & Links</p>
                <div className="flex flex-wrap gap-2">
                  {booth.liveFileUrl && (
                    <a href={booth.liveFileUrl} target="_blank" rel="noopener noreferrer">
                      <Button size="sm" variant="default" className="gap-2">
                        <Download className="h-4 w-4" /> Live Files
                      </Button>
                    </a>
                  )}
                  {booth.pdfFileUrl && (
                    <a href={booth.pdfFileUrl} target="_blank" rel="noopener noreferrer">
                      <Button size="sm" variant="outline" className="gap-2">
                        <FileText className="h-4 w-4" /> Download PDF
                      </Button>
                    </a>
                  )}
                </div>
                {boothLinks.length > 0 && (
                  <div className="space-y-1">
                    {boothLinks.map((link) => (
                      <a key={link.id} href={link.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-primary hover:underline">
                        <LinkIcon className="h-3.5 w-3.5 shrink-0" />
                        {link.label}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            )}
            <div className="flex flex-wrap gap-1.5">
              {booth.services.map((s) => (
                <Badge key={s} variant="outline" className="text-xs">{s}</Badge>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
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
  const [activeTab, setActiveTab] = useState('catalog');
  const [customName, setCustomName] = useState('');
  const [customTagline, setCustomTagline] = useState('');
  const [customColor, setCustomColor] = useState('hsl(200, 70%, 45%)');
  const [customLinks, setCustomLinks] = useState<{ label: string; url: string }[]>([]);
  const [newSizeLabel, setNewSizeLabel] = useState('');
  const [newSizeUrl, setNewSizeUrl] = useState('');
  const { divisions: customDivisions } = useCustomDivisions();
  const linkedIds = new Set(linkedBooths.map(b => b.divisionId));

  // Merge static divisions with DB overrides + add any purely custom divisions
  const allDivisions = useMemo(() => {
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

  const handleAddSizeLink = () => {
    if (!newSizeLabel.trim() || !newSizeUrl.trim()) return;
    setCustomLinks(prev => [...prev, { label: newSizeLabel.trim(), url: newSizeUrl.trim() }]);
    setNewSizeLabel('');
    setNewSizeUrl('');
  };

  const handleRemoveSizeLink = (index: number) => {
    setCustomLinks(prev => prev.filter((_, i) => i !== index));
  };

  const handleCreateCustom = () => {
    if (!customName.trim()) return;
    const customId = `custom-${crypto.randomUUID()}`;
    const boothLinks: BoothLink[] = customLinks.map(l => ({
      id: crypto.randomUUID(),
      label: l.label,
      url: l.url,
    }));
    onLink({
      id: crypto.randomUUID(),
      divisionId: customId,
      divisionName: customName.trim(),
      tagline: customTagline.trim(),
      color: customColor,
      iconName: 'Building2',
      services: [],
      links: boothLinks.length > 0 ? boothLinks : undefined,
      linkedAt: new Date().toISOString(),
    });
    setCustomName('');
    setCustomTagline('');
    setCustomColor('hsl(200, 70%, 45%)');
    setCustomLinks([]);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Link Booth Card</DialogTitle>
          <DialogDescription>Select from the catalog or create a custom standalone booth card.</DialogDescription>
        </DialogHeader>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="catalog">From Catalog</TabsTrigger>
            <TabsTrigger value="custom">Create Custom</TabsTrigger>
          </TabsList>
          <TabsContent value="catalog" className="flex-1 flex flex-col overflow-hidden mt-3">
            <div className="relative mb-3">
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
          </TabsContent>
          <TabsContent value="custom" className="mt-3 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="custom-booth-name">Booth Name *</Label>
              <Input
                id="custom-booth-name"
                placeholder="e.g. Partner Company Name"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="custom-booth-tagline">Tagline</Label>
              <Input
                id="custom-booth-tagline"
                placeholder="e.g. Innovation in Translation"
                value={customTagline}
                onChange={(e) => setCustomTagline(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="custom-booth-color">Card Color</Label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  id="custom-booth-color"
                  value="#3b82f6"
                  onChange={(e) => {
                    const hex = e.target.value;
                    setCustomColor(hex);
                  }}
                  className="h-9 w-12 rounded border border-border cursor-pointer"
                />
                <span className="text-xs text-muted-foreground">Choose a brand color for the card header</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Download Links (Sizes)</Label>
              {customLinks.length > 0 && (
                <div className="space-y-1.5">
                  {customLinks.map((link, i) => (
                    <div key={i} className="flex items-center gap-2 p-2 rounded-md border border-border/40 bg-muted/20">
                      <LinkIcon className="h-3.5 w-3.5 text-primary shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{link.label}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{link.url}</p>
                      </div>
                      <button onClick={() => handleRemoveSizeLink(i)} className="h-5 w-5 rounded flex items-center justify-center text-muted-foreground hover:text-destructive">
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex gap-1.5">
                <Input placeholder="Size label (e.g. 10×10)" value={newSizeLabel} onChange={(e) => setNewSizeLabel(e.target.value)} className="h-8 text-xs flex-1" />
                <Input placeholder="https://..." value={newSizeUrl} onChange={(e) => setNewSizeUrl(e.target.value)} className="h-8 text-xs flex-1" />
                <Button size="sm" variant="outline" className="h-8 text-xs gap-1 shrink-0" onClick={handleAddSizeLink} disabled={!newSizeLabel.trim() || !newSizeUrl.trim()}>
                  <Plus className="h-3 w-3" /> Add
                </Button>
              </div>
              <p className="text-[10px] text-muted-foreground">Add download links for each booth size variant (e.g. 10×10, 10×20, 20×20)</p>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg border border-dashed border-border/60 bg-muted/20">
              <PenLine className="h-5 w-5 text-muted-foreground shrink-0" />
              <p className="text-xs text-muted-foreground">You can also add custom preview images and more links after creating the card.</p>
            </div>
            <Button onClick={handleCreateCustom} disabled={!customName.trim()} className="w-full gap-2">
              <Plus className="h-4 w-4" />
              Create Booth Card
            </Button>
          </TabsContent>
        </Tabs>
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
export const LinkedBoothsSection = ({ linkedBooths, isEditable, onChange, isAdmin = false }: {
  linkedBooths: LinkedBoothCard[];
  isEditable: boolean;
  onChange?: (booths: LinkedBoothCard[]) => void;
  isAdmin?: boolean;
}) => {
  const [pickerOpen, setPickerOpen] = useState(false);
  const navigate = useNavigate();
  const { divisions: customDivisions } = useCustomDivisions();

  if (linkedBooths.length === 0 && !isEditable) return null;

  const handleLink = (booth: LinkedBoothCard) => {
    onChange?.([...linkedBooths, booth]);
    setPickerOpen(false);
  };

  const handleRemove = (id: string) => {
    onChange?.(linkedBooths.filter(b => b.id !== id));
  };

  const handleUpdateLinks = (boothId: string, links: BoothLink[]) => {
    onChange?.(linkedBooths.map(b => b.id === boothId ? { ...b, links } : b));
  };

  const handleUpdateImage = (boothId: string, customImage: string | undefined) => {
    onChange?.(linkedBooths.map(b => b.id === boothId ? { ...b, customImage } : b));
  };

  const handleOpenDetail = (booth: LinkedBoothCard) => {
    // Open the external BoothHub app with the booth's division as a query param
    const url = `https://boothhub.lovable.app/?booth=${encodeURIComponent(booth.divisionId)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
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
              onUpdateLinks={(links) => handleUpdateLinks(booth.id, links)}
              onUpdateImage={(img) => handleUpdateImage(booth.id, img)}
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
