import { useEffect, useState, useRef } from 'react';
import { Plus, X, Pencil, Copy, Check, Mail, Image, ImagePlus, Upload, Link2, ExternalLink, Loader2, LayoutTemplate, Maximize2, Lock, Unlock } from 'lucide-react';
import DOMPurify from 'dompurify';
import { BrandSignature, BrandEmailBanner } from '@/types/brand';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { SectionHeader } from './SectionHeader';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { SignatureEditorPanel } from './signatures/SignatureEditorPanel';
import { SignatureTemplateDialog } from './signatures/SignatureTemplateDialog';
import { renderPreview } from './signatures/signatureRenderer';
import { BANNER_SIZE_PRESETS, DEFAULT_CONFIDENTIALITY } from './signatures/signatureConstants';
import { safeUUID } from '@/lib/safeUUID';

interface SignaturesSectionProps {
  signatures: BrandSignature[];
  onSignaturesChange?: (signatures: BrandSignature[]) => void;
  emailBanners?: BrandEmailBanner[];
  onEmailBannersChange?: (banners: BrandEmailBanner[]) => void;
  customSubtitle?: string;
  onSubtitleChange?: (subtitle: string) => void;
}

const LEGACY_SIGNATURE_REPLACEMENTS: Record<string, string> = {
  'Anna Allen': 'First Last',
  'John Doe': 'First Last',
  'Vice President, Marketing Operations': 'Job Title',
  'Global Account Lead': 'Job Title',
  'Your Company': 'Company Name',
  'aallen@transperfect.com': 'firstinitiallastname@transperfect.com',
  'jdoe@company.com': 'name@company.com',
  '+44 207 061 2000': '+1 000.000.0000',
  '+1 212.555.0123': '+1 000.000.0000',
  '33 Aldgate High Street, First Floor\nLondon, EC3N 1AH': 'Street Address, Floor/Suite\nCity, State ZIP',
  '1250 Broadway, New York, NY 10001': 'Street Address\nCity, State ZIP',
  'https://linkedin.com/in/janedoe': 'https://linkedin.com/in/your-profile',
  'https://linkedin.com/in/johndoe': 'https://linkedin.com/in/your-profile',
  'https://x.com/johndoe': 'https://x.com/your-profile',
  '+1 212.555.0199': '+1 000.000.0000',
};

const replaceLegacySignatureValue = (value?: string) => {
  if (!value) return value;
  return LEGACY_SIGNATURE_REPLACEMENTS[value] ?? value;
};

const normalizeLegacySignature = (signature: BrandSignature): BrandSignature => ({
  ...signature,
  name: replaceLegacySignatureValue(signature.name) || signature.name,
  role: replaceLegacySignatureValue(signature.role) || signature.role,
  company: replaceLegacySignatureValue(signature.company) || signature.company,
  email: replaceLegacySignatureValue(signature.email),
  phone: replaceLegacySignatureValue(signature.phone),
  address: replaceLegacySignatureValue(signature.address),
  socialLinks: signature.socialLinks?.map((link) => ({
    ...link,
    url: replaceLegacySignatureValue(link.url) || link.url,
  })),
});

// ── Banner Size Controls ──
const BannerSizeControls = ({ width, height, onChange }: { width: number; height: number; onChange: (w: number, h: number) => void }) => {
  const [locked, setLocked] = useState(true);
  const ratio = width / height || 4;
  return (
    <div className="space-y-3 p-3 bg-muted/30 rounded-lg border border-border">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2"><Maximize2 className="h-4 w-4 text-muted-foreground" /><span className="text-xs font-medium">Banner Size</span></div>
        <Button variant="ghost" size="sm" onClick={() => setLocked(!locked)} className="h-7 gap-1.5 text-xs">
          {locked ? <Lock className="h-3 w-3" /> : <Unlock className="h-3 w-3" />}{locked ? 'Locked' : 'Unlocked'}
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="text-xs text-muted-foreground">Width (px)</label>
          <Input type="number" value={width} onChange={e => { const w = parseInt(e.target.value) || 600; onChange(w, locked ? Math.round(w / ratio) : height); }} min={100} max={1200} className="h-8 text-sm" />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs text-muted-foreground">Height (px)</label>
          <Input type="number" value={height} onChange={e => { const h = parseInt(e.target.value) || 150; onChange(locked ? Math.round(h * ratio) : width, h); }} min={50} max={600} className="h-8 text-sm" />
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {BANNER_SIZE_PRESETS.map(p => (
          <Button key={p.name} variant={width === p.width && height === p.height ? 'default' : 'outline'} size="sm" className="h-7 text-xs" onClick={() => onChange(p.width, p.height)} title={p.description}>{p.name}</Button>
        ))}
      </div>
    </div>
  );
};

export const SignaturesSection = ({
  signatures,
  onSignaturesChange,
  emailBanners = [],
  onEmailBannersChange,
  customSubtitle,
  onSubtitleChange,
}: SignaturesSectionProps) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingBannerId, setEditingBannerId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [isHeaderEditing, setIsHeaderEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<'signatures' | 'banners'>('signatures');
  const [uploadingBannerId, setUploadingBannerId] = useState<string | null>(null);

  const canEdit = !!onSignaturesChange;

  useEffect(() => {
    if (!onSignaturesChange || signatures.length === 0) return;

    const normalizedSignatures = signatures.map(normalizeLegacySignature);
    const hasLegacyValues = normalizedSignatures.some((signature, index) =>
      JSON.stringify(signature) !== JSON.stringify(signatures[index])
    );

    if (hasLegacyValues) {
      onSignaturesChange(normalizedSignatures);
    }
  }, [signatures, onSignaturesChange]);

  // ── Signature CRUD ──
  const addSignatureFromTemplate = (sig: BrandSignature) => {
    if (!onSignaturesChange) return;
    onSignaturesChange([...signatures, sig]);
    setEditingId(sig.id);
  };

  const addDefaultSignature = () => {
    const sig: BrandSignature = {
      id: safeUUID(),
      name: 'First Last',
      role: 'Job Title',
      html: '',
      company: 'Company Name',
      email: 'name@company.com',
      phone: '+1 000.000.0000',
      website: 'www.company.com',
      address: 'Street Address\nCity, State ZIP',
      logoUrl: '',
      variant: 'full',
      style: {
        fontFamily: 'Arial, sans-serif',
        nameFontSize: 18,
        titleFontSize: 14,
        textFontSize: 12,
        nameColor: '#003b71',
        titleColor: '#139cd8',
        textColor: '#666666',
        linkColor: '#139cd8',
        dividerStyle: 'solid',
        dividerColor: '#139cd8',
        dividerWidth: 2,
        spacing: 15,
        layout: 'horizontal',
      },
      confidentialityNotice: DEFAULT_CONFIDENTIALITY,
    };
    addSignatureFromTemplate(sig);
  };

  const updateSignature = (id: string, updates: Partial<BrandSignature>) => {
    if (!onSignaturesChange) return;
    onSignaturesChange(signatures.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const deleteSignature = (id: string) => {
    if (!onSignaturesChange) return;
    onSignaturesChange(signatures.filter(s => s.id !== id));
    if (editingId === id) setEditingId(null);
  };

  const duplicateSignature = (sig: BrandSignature) => {
    if (!onSignaturesChange) return;
    const dup: BrandSignature = {
      ...sig,
      id: safeUUID(),
      name: `${sig.name} (Copy)`,
      socialLinks: sig.socialLinks?.map(l => ({ ...l, id: safeUUID() })),
    };
    onSignaturesChange([...signatures, dup]);
    setEditingId(dup.id);
  };

  const copyHTML = async (html: string, id: string) => {
    const sanitized = DOMPurify.sanitize(html, {
      ALLOWED_TAGS: ['table', 'tr', 'td', 'th', 'tbody', 'thead', 'p', 'img', 'a', 'strong', 'em', 'b', 'i', 'span', 'div', 'br', 'hr'],
      ALLOWED_ATTR: ['style', 'src', 'alt', 'width', 'height', 'href', 'cellpadding', 'cellspacing', 'border', 'align', 'valign', 'target', 'rel', 'colspan'],
    });
    await navigator.clipboard.writeText(sanitized);
    setCopiedId(id);
    toast.success('HTML copied to clipboard');
    setTimeout(() => setCopiedId(null), 2000);
  };

  // ── Email Banner CRUD ──
  const addEmailBanner = (preset?: typeof BANNER_SIZE_PRESETS[0]) => {
    if (!onEmailBannersChange) return;
    const b: BrandEmailBanner = {
      id: safeUUID(),
      name: preset?.name || 'Email Banner',
      imageUrl: '',
      linkUrl: '',
      width: preset?.width || 600,
      height: preset?.height || 150,
      description: preset?.description || '',
    };
    onEmailBannersChange([...emailBanners, b]);
    setEditingBannerId(b.id);
  };

  const updateEmailBanner = (id: string, updates: Partial<BrandEmailBanner>) => {
    if (!onEmailBannersChange) return;
    onEmailBannersChange(emailBanners.map(b => b.id === id ? { ...b, ...updates } : b));
  };

  const deleteEmailBanner = (id: string) => {
    if (!onEmailBannersChange) return;
    onEmailBannersChange(emailBanners.filter(b => b.id !== id));
    if (editingBannerId === id) setEditingBannerId(null);
  };

  const fileToBase64 = (file: File): Promise<string> => new Promise((resolve, reject) => {
    const r = new FileReader(); r.readAsDataURL(file); r.onload = () => resolve(r.result as string); r.onerror = reject;
  });

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>, bannerId: string) => {
    const file = e.target.files?.[0];
    if (!file || !onEmailBannersChange) return;
    if (!file.type.startsWith('image/')) { toast.error('Please upload an image file'); return; }
    if (file.size > 2 * 1024 * 1024) { toast.error('Image must be less than 2MB'); return; }
    setUploadingBannerId(bannerId);
    try {
      const ext = file.name.split('.').pop();
      const path = `email-banners/${bannerId}-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from('organization-assets').upload(path, file, { upsert: true });
      if (error) {
        const b64 = await fileToBase64(file);
        updateEmailBanner(bannerId, { imageUrl: b64 });
        toast.success('Banner saved');
        return;
      }
      const { data: urlData } = supabase.storage.from('organization-assets').getPublicUrl(path);
      updateEmailBanner(bannerId, { imageUrl: urlData.publicUrl });
      toast.success('Banner uploaded');
    } catch {
      try { const b64 = await fileToBase64(file); updateEmailBanner(bannerId, { imageUrl: b64 }); toast.success('Banner saved'); } catch { toast.error('Upload failed'); }
    } finally { setUploadingBannerId(null); }
  };

  const getVariantBadge = (variant?: string) => {
    switch (variant) {
      case 'full': return <Badge variant="default" className="text-[10px]">Full Signature</Badge>;
      case 'reply': return <Badge variant="secondary" className="text-[10px]">Reply</Badge>;
      case 'minimal': return <Badge variant="outline" className="text-[10px]">Minimal</Badge>;
      default: return null;
    }
  };

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex-1 min-w-0">
          <SectionHeader
            title="Email Signatures & Banners"
            defaultSubtitle="Complete signature templates with promotional banner guidelines"
            customSubtitle={customSubtitle}
            onSubtitleChange={onSubtitleChange}
            isEditing={isHeaderEditing}
            onEditToggle={() => setIsHeaderEditing(!isHeaderEditing)}
          />
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={v => setActiveTab(v as 'signatures' | 'banners')} className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <TabsList>
            <TabsTrigger value="signatures" className="gap-2"><Mail className="h-4 w-4" />Signatures</TabsTrigger>
            <TabsTrigger value="banners" className="gap-2"><Image className="h-4 w-4" />Email Banners</TabsTrigger>
          </TabsList>

          {activeTab === 'signatures' && canEdit && (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="gap-2" onClick={() => setTemplateDialogOpen(true)}>
                <LayoutTemplate className="h-4 w-4" />Templates
                <Badge variant="secondary" className="text-[10px] ml-1">25</Badge>
              </Button>
              <Button onClick={addDefaultSignature} size="sm" className="gap-2">
                <Plus className="h-4 w-4" />Add Signature
              </Button>
            </div>
          )}

          {activeTab === 'banners' && onEmailBannersChange && (
            <div className="flex gap-2">
              <Select onValueChange={name => { const p = BANNER_SIZE_PRESETS.find(x => x.name === name); if (p) addEmailBanner(p); }}>
                <SelectTrigger className="w-[180px] h-9 text-sm"><SelectValue placeholder="Add preset..." /></SelectTrigger>
                <SelectContent>
                  {BANNER_SIZE_PRESETS.map(p => (
                    <SelectItem key={p.name} value={p.name}>
                      <div className="flex flex-col"><span>{p.name}</span><span className="text-xs text-muted-foreground">{p.width} × {p.height}px</span></div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={() => addEmailBanner()} size="sm" className="gap-2"><ImagePlus className="h-4 w-4" />Add Banner</Button>
            </div>
          )}
        </div>

        {/* ═══ Signatures Tab ═══ */}
        <TabsContent value="signatures" className="space-y-4 mt-0">
          {signatures.map((sig, index) => {
            const previewHtml = renderPreview(sig);
            const sanitized = DOMPurify.sanitize(previewHtml, {
              ALLOWED_TAGS: ['table', 'tr', 'td', 'th', 'tbody', 'thead', 'p', 'img', 'a', 'strong', 'em', 'b', 'i', 'span', 'div', 'br', 'hr'],
              ALLOWED_ATTR: ['style', 'src', 'alt', 'width', 'height', 'href', 'cellpadding', 'cellspacing', 'border', 'align', 'valign', 'target', 'rel', 'colspan'],
            });

            return (
              <div key={sig.id} className="group relative bg-card rounded-xl shadow-sm border border-border animate-slide-up overflow-hidden" style={{ animationDelay: `${index * 50}ms` }}>
                {/* Email client chrome header */}
                <div className="bg-muted/50 px-4 py-2 border-b border-border flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-red-400/70" />
                      <div className="w-2.5 h-2.5 rounded-full bg-yellow-400/70" />
                      <div className="w-2.5 h-2.5 rounded-full bg-green-400/70" />
                    </div>
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider ml-2">Internal Mail Client Preview</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {getVariantBadge(sig.variant)}
                    <Button variant="ghost" size="sm" onClick={() => copyHTML(previewHtml, sig.id)} className="h-7 gap-1.5 text-xs">
                      {copiedId === sig.id ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                      {copiedId === sig.id ? 'Copied!' : 'Copy HTML'}
                    </Button>
                  </div>
                </div>

                {editingId === sig.id ? (
                  <SignatureEditorPanel
                    signature={sig}
                    onUpdate={updates => updateSignature(sig.id, updates)}
                    onDelete={() => deleteSignature(sig.id)}
                    onDone={() => setEditingId(null)}
                  />
                ) : (
                  <>
                    {/* Live Preview */}
                    <div className="p-6">
                      <div className="bg-white p-6 rounded-lg border border-border/50" dangerouslySetInnerHTML={{ __html: sanitized }} />
                    </div>

                    {/* Action buttons */}
                    {canEdit && (
                      <div className="px-6 pb-4 flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => duplicateSignature(sig)} className="p-2 rounded-md hover:bg-secondary transition-colors" title="Duplicate">
                          <Copy className="h-4 w-4 text-muted-foreground" />
                        </button>
                        <button onClick={() => setEditingId(sig.id)} className="p-2 rounded-md hover:bg-secondary transition-colors" title="Edit">
                          <Pencil className="h-4 w-4 text-muted-foreground" />
                        </button>
                        <button onClick={() => { if (window.confirm('Delete this signature?')) deleteSignature(sig.id); }} className="p-2 rounded-md hover:bg-destructive hover:text-destructive-foreground transition-colors" title="Delete">
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}

          {signatures.length === 0 && canEdit && (
            <button onClick={() => setTemplateDialogOpen(true)} className="w-full h-40 border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-primary hover:text-primary transition-colors">
              <Mail className="h-8 w-8" />
              <span className="text-sm font-medium">Create email signature template</span>
              <span className="text-xs text-muted-foreground">Choose from 25 templates across 5 categories</span>
            </button>
          )}
        </TabsContent>

        {/* ═══ Email Banners Tab ═══ */}
        <TabsContent value="banners" className="space-y-6 mt-0">
          <div className="bg-muted/50 rounded-lg p-4 border border-border/50">
            <h4 className="font-medium text-sm mb-1">Email Banner Guidelines</h4>
            <p className="text-xs text-muted-foreground">Email banners appear below signatures for promotional campaigns, events, or announcements. Keep file sizes under 100KB and use standard widths (550-600px) for best compatibility.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {emailBanners.map((banner, index) => {
              const isEditing = editingBannerId === banner.id;
              const aspectRatio = banner.width / banner.height;
              return (
                <div key={banner.id} className="group relative bg-card/50 backdrop-blur-sm rounded-xl border border-border/50 overflow-hidden animate-scale-in hover:border-primary/30 transition-colors" style={{ animationDelay: `${index * 50}ms` }}>
                  <div className="flex items-center justify-between px-4 py-3 border-b border-border/30">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center"><Image className="h-4 w-4 text-primary" /></div>
                      {isEditing ? <Input value={banner.name} onChange={e => updateEmailBanner(banner.id, { name: e.target.value })} className="h-7 text-xs w-[140px]" /> : <span className="font-semibold text-sm">{banner.name}</span>}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-mono bg-muted/80 px-2 py-0.5 rounded text-muted-foreground">{banner.width} × {banner.height}</span>
                      {canEdit && (
                        <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => setEditingBannerId(isEditing ? null : banner.id)} className="p-1 rounded hover:bg-secondary transition-colors"><Pencil className="h-3 w-3 text-muted-foreground" /></button>
                          <button onClick={() => deleteEmailBanner(banner.id)} className="p-1 rounded hover:bg-destructive hover:text-destructive-foreground transition-colors"><X className="h-3 w-3" /></button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="px-4 py-4">
                    <div className="relative bg-muted/30 rounded-lg border-2 border-dashed border-primary/30 flex items-center justify-center overflow-hidden transition-colors"
                      style={{ aspectRatio: aspectRatio > 3 ? 4 : aspectRatio, maxHeight: '200px' }}
                      onDragOver={e => { e.preventDefault(); e.currentTarget.classList.add('border-primary', 'bg-primary/10'); }}
                      onDragLeave={e => { e.preventDefault(); e.currentTarget.classList.remove('border-primary', 'bg-primary/10'); }}
                      onDrop={e => {
                        e.preventDefault(); e.currentTarget.classList.remove('border-primary', 'bg-primary/10');
                        const f = e.dataTransfer.files?.[0];
                        if (f?.type.startsWith('image/') && onEmailBannersChange) handleBannerUpload({ target: { files: [f] } } as unknown as React.ChangeEvent<HTMLInputElement>, banner.id);
                      }}>
                      {banner.imageUrl ? <img src={banner.imageUrl} alt={banner.name} className="w-full h-full object-cover rounded" /> : (
                        <div className="flex flex-col items-center gap-2 text-muted-foreground"><ImagePlus className="h-8 w-8 opacity-50" /><span className="text-xs">Drop image here or click edit</span></div>
                      )}
                    </div>
                  </div>

                  <div className="px-4 pb-4 space-y-3">
                    {isEditing ? (
                      <>
                        <BannerSizeControls width={banner.width} height={banner.height} onChange={(w, h) => updateEmailBanner(banner.id, { width: w, height: h })} />
                        <div className="space-y-2">
                          <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Banner Image</label>
                          <div className="flex gap-2">
                            <div className="relative flex-1">
                              <input type="file" accept="image/*" onChange={e => handleBannerUpload(e, banner.id)} className="absolute inset-0 opacity-0 cursor-pointer" disabled={uploadingBannerId === banner.id} />
                              <Button variant="outline" size="sm" className="w-full gap-2 pointer-events-none h-8 text-xs" disabled={uploadingBannerId === banner.id}>
                                {uploadingBannerId === banner.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}Upload
                              </Button>
                            </div>
                            <Popover>
                              <PopoverTrigger asChild><Button variant="outline" size="sm" className="gap-2 h-8 text-xs"><Link2 className="h-3 w-3" />URL</Button></PopoverTrigger>
                              <PopoverContent className="w-80" align="start">
                                <div className="space-y-2"><label className="text-xs font-medium">Image URL</label><Input value={banner.imageUrl} onChange={e => updateEmailBanner(banner.id, { imageUrl: e.target.value })} placeholder="https://example.com/banner.jpg" /></div>
                              </PopoverContent>
                            </Popover>
                          </div>
                        </div>
                        <div className="space-y-1"><label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Link URL (optional)</label><Input value={banner.linkUrl || ''} onChange={e => updateEmailBanner(banner.id, { linkUrl: e.target.value })} placeholder="https://..." className="h-8 text-xs" /></div>
                        <div className="space-y-1"><label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Description</label><Input value={banner.description || ''} onChange={e => updateEmailBanner(banner.id, { description: e.target.value })} placeholder="Campaign or usage notes..." className="h-8 text-xs" /></div>
                        <Button size="sm" variant="secondary" onClick={() => setEditingBannerId(null)} className="mt-2">Done</Button>
                      </>
                    ) : (
                      <div className="bg-muted/50 rounded-lg p-3">
                        <div className="grid grid-cols-2 gap-4 text-xs mb-2">
                          <div><p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-0.5">Dimensions</p><p className="font-medium">{banner.width} × {banner.height} px</p></div>
                          <div><p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-0.5">Aspect Ratio</p><p className="font-medium">{aspectRatio.toFixed(2)}:1</p></div>
                        </div>
                        {banner.description && <p className="text-xs text-muted-foreground">{banner.description}</p>}
                        {banner.linkUrl && <a href={banner.linkUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1 mt-2"><ExternalLink className="h-3 w-3" />View link</a>}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {emailBanners.length === 0 && (
              <button onClick={() => addEmailBanner(BANNER_SIZE_PRESETS[0])} className="h-48 border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-primary hover:text-primary transition-colors col-span-full">
                <ImagePlus className="h-8 w-8" />
                <span className="text-sm font-medium">Add email banner specification</span>
                <span className="text-xs text-muted-foreground">Standard sizes: 600×150, 550×100, 600×200</span>
              </button>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Template Dialog */}
      <SignatureTemplateDialog open={templateDialogOpen} onOpenChange={setTemplateDialogOpen} onSelect={addSignatureFromTemplate} emailBanners={emailBanners} />
    </section>
  );
};
