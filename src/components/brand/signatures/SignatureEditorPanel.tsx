import { useState, useRef, useCallback } from 'react';
import {
  User, Building2, MapPin, Phone, Mail, Globe, Image, Palette,
  Type, Code, Upload, Link2, Lock, Unlock, Maximize2, Loader2,
  X, Share2, ChevronDown
} from 'lucide-react';
import { BrandSignature, SignatureSocialLink, SignatureStyle } from '@/types/brand';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { SOCIAL_PLATFORMS, FONT_FAMILIES, DIVIDER_STYLES, LOGO_SIZE_PRESETS, DEFAULT_ACCENT } from './signatureConstants';
import { renderPreview } from './signatureRenderer';
import { safeUUID } from '@/lib/safeUUID';

interface SignatureEditorPanelProps {
  signature: BrandSignature;
  onUpdate: (updates: Partial<BrandSignature>) => void;
  onDelete: () => void;
  onDone: () => void;
}

// ── Logo Size Controls ──
const LogoSizeControls = ({ width, height, onChange }: { width: number; height: number; onChange: (w: number, h: number) => void }) => {
  const [locked, setLocked] = useState(true);
  const ratio = width / height || 1;
  return (
    <div className="space-y-3 p-3 bg-muted/30 rounded-lg border border-border">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2"><Maximize2 className="h-4 w-4 text-muted-foreground" /><span className="text-xs font-medium">Logo Size</span></div>
        <Button variant="ghost" size="sm" onClick={() => setLocked(!locked)} className="h-7 gap-1.5 text-xs">
          {locked ? <Lock className="h-3 w-3" /> : <Unlock className="h-3 w-3" />}{locked ? 'Locked' : 'Unlocked'}
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="text-xs text-muted-foreground">Width (px)</label>
          <Input type="number" value={width} onChange={e => { const w = parseInt(e.target.value) || 100; onChange(w, locked ? Math.round(w / ratio) : height); }} min={20} max={300} className="h-8 text-sm" />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs text-muted-foreground">Height (px)</label>
          <Input type="number" value={height} onChange={e => { const h = parseInt(e.target.value) || 100; onChange(locked ? Math.round(h * ratio) : width, h); }} min={20} max={300} className="h-8 text-sm" />
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {LOGO_SIZE_PRESETS.map(p => (
          <Button key={p.name} variant={width === p.width && height === p.height ? 'default' : 'outline'} size="sm" className="h-7 text-xs" onClick={() => onChange(p.width, p.height)}>{p.name}</Button>
        ))}
      </div>
    </div>
  );
};

export const SignatureEditorPanel = ({ signature: sig, onUpdate, onDelete, onDone }: SignatureEditorPanelProps) => {
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const style = sig.style || {};

  // Use functional update pattern to avoid stale closure on style object
  const updateStyle = useCallback((updates: Partial<SignatureStyle>) => {
    onUpdate({ style: { ...(sig.style || {}), ...updates } });
  }, [sig.style, onUpdate]);

  const fileToBase64 = (file: File): Promise<string> => new Promise((resolve, reject) => {
    const r = new FileReader(); r.readAsDataURL(file); r.onload = () => resolve(r.result as string); r.onerror = reject;
  });

  const handleFileUpload = async (file: File, field: 'logoUrl' | 'bannerUrl') => {
    if (!file.type.startsWith('image/')) { toast.error('Please upload an image file'); return; }
    if (file.size > 2 * 1024 * 1024) { toast.error('Image must be less than 2MB'); return; }
    const setter = field === 'logoUrl' ? setUploadingLogo : setUploadingBanner;
    setter(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `signature-assets/${sig.id}-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from('organization-assets').upload(path, file, { upsert: true });
      if (error) {
        const b64 = await fileToBase64(file);
        onUpdate({ [field]: b64 });
        toast.success('Saved successfully');
        return;
      }
      const { data: urlData } = supabase.storage.from('organization-assets').getPublicUrl(path);
      onUpdate({ [field]: urlData.publicUrl });
      toast.success('Uploaded successfully');
    } catch {
      try { const b64 = await fileToBase64(file); onUpdate({ [field]: b64 }); toast.success('Saved'); } catch { toast.error('Upload failed'); }
    } finally { setter(false); }
  };

  const addSocialLink = (platform: string) => {
    const links = [...(sig.socialLinks || [])];
    if (links.some(l => l.platform === platform)) return;
    links.push({ id: safeUUID(), platform, url: '' });
    onUpdate({ socialLinks: links });
  };

  const updateSocialLink = (id: string, url: string) => {
    onUpdate({ socialLinks: (sig.socialLinks || []).map(l => l.id === id ? { ...l, url } : l) });
  };

  const removeSocialLink = (id: string) => {
    onUpdate({ socialLinks: (sig.socialLinks || []).filter(l => l.id !== id) });
  };

  // Generate copyable HTML
  const exportHtml = renderPreview(sig);

  return (
    <div className="p-6 space-y-4">
      <Tabs defaultValue="contact" className="w-full">
        <TabsList className="w-full grid grid-cols-5 h-9">
          <TabsTrigger value="contact" className="text-xs gap-1.5"><User className="h-3 w-3" />Contact</TabsTrigger>
          <TabsTrigger value="media" className="text-xs gap-1.5"><Image className="h-3 w-3" />Media</TabsTrigger>
          <TabsTrigger value="social" className="text-xs gap-1.5"><Share2 className="h-3 w-3" />Social</TabsTrigger>
          <TabsTrigger value="style" className="text-xs gap-1.5"><Palette className="h-3 w-3" />Style</TabsTrigger>
          <TabsTrigger value="export" className="text-xs gap-1.5"><Code className="h-3 w-3" />Export</TabsTrigger>
        </TabsList>

        {/* ── Contact Tab ── */}
        <TabsContent value="contact" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Full Name</label>
              <Input value={sig.name} onChange={e => onUpdate({ name: e.target.value })} placeholder="First Last" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Job Title</label>
              <Input value={sig.role} onChange={e => onUpdate({ role: e.target.value })} placeholder="Job Title" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5"><Building2 className="h-3 w-3" />Company</label>
              <Input value={sig.company || ''} onChange={e => onUpdate({ company: e.target.value })} placeholder="Company Name" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5"><MapPin className="h-3 w-3" />Address</label>
              <Input value={sig.address || ''} onChange={e => onUpdate({ address: e.target.value })} placeholder="Street Address, Floor/Suite" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5"><Phone className="h-3 w-3" />Phone</label>
              <Input value={sig.phone || ''} onChange={e => onUpdate({ phone: e.target.value })} placeholder="+1 000.000.0000" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5"><Mail className="h-3 w-3" />Email</label>
              <Input value={sig.email || ''} onChange={e => onUpdate({ email: e.target.value })} placeholder="name@company.com" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5"><Globe className="h-3 w-3" />Website</label>
              <Input value={sig.website || ''} onChange={e => onUpdate({ website: e.target.value })} placeholder="www.company.com" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Variant</label>
              <Select value={sig.variant || 'full'} onValueChange={v => onUpdate({ variant: v as BrandSignature['variant'] })}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="full">Full Signature</SelectItem>
                  <SelectItem value="reply">Compact Reply</SelectItem>
                  <SelectItem value="minimal">Text Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {sig.variant === 'full' && (
            <div className="space-y-2 pt-2">
              <label className="text-xs font-medium text-muted-foreground">Confidentiality Notice</label>
              <Textarea value={sig.confidentialityNotice || ''} onChange={e => onUpdate({ confidentialityNotice: e.target.value })} placeholder="Enter confidentiality notice..." className="text-xs min-h-[80px]" />
            </div>
          )}
        </TabsContent>

        {/* ── Media Tab (Logo + Banner) ── */}
        <TabsContent value="media" className="space-y-6 mt-4">
          {/* Logo */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />Signature Logo
            </h4>
            {sig.logoUrl && (
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border border-border">
                <img src={sig.logoUrl} alt="Logo" className="h-12 w-12 object-contain rounded bg-white p-1" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                <p className="flex-1 text-xs text-muted-foreground truncate">{sig.logoUrl.substring(0, 60)}</p>
                <Button variant="ghost" size="sm" onClick={() => onUpdate({ logoUrl: '' })} className="text-destructive h-8"><X className="h-4 w-4" /></Button>
              </div>
            )}
            {!sig.logoUrl && (
              <div className="border-2 border-dashed border-border rounded-lg p-4 text-center hover:border-primary/50 transition-colors"
                onDragOver={e => { e.preventDefault(); e.currentTarget.classList.add('border-primary', 'bg-primary/5'); }}
                onDragLeave={e => { e.preventDefault(); e.currentTarget.classList.remove('border-primary', 'bg-primary/5'); }}
                onDrop={e => { e.preventDefault(); e.currentTarget.classList.remove('border-primary', 'bg-primary/5'); const f = e.dataTransfer.files?.[0]; if (f?.type.startsWith('image/')) handleFileUpload(f, 'logoUrl'); }}>
                <Upload className="h-6 w-6 mx-auto text-muted-foreground mb-2" />
                <p className="text-xs text-muted-foreground">Drag & drop logo, or use buttons below</p>
              </div>
            )}
            <div className="flex gap-2">
              <div className="relative">
                <input type="file" accept="image/*" onChange={e => { const f = e.target.files?.[0]; if (f) handleFileUpload(f, 'logoUrl'); e.target.value = ''; }} className="absolute inset-0 opacity-0 cursor-pointer" disabled={uploadingLogo} />
                <Button variant="outline" size="sm" className="gap-2 pointer-events-none" disabled={uploadingLogo}>
                  {uploadingLogo ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}Upload Logo
                </Button>
              </div>
              <Popover>
                <PopoverTrigger asChild><Button variant="outline" size="sm" className="gap-2"><Link2 className="h-4 w-4" />Link URL</Button></PopoverTrigger>
                <PopoverContent className="w-80" align="start">
                  <div className="space-y-2">
                    <label className="text-xs font-medium">Logo URL</label>
                    <Input value={sig.logoUrl || ''} onChange={e => onUpdate({ logoUrl: e.target.value })} placeholder="https://example.com/logo.png" />
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            {sig.logoUrl && <LogoSizeControls width={sig.logoWidth || 100} height={sig.logoHeight || 100} onChange={(w, h) => onUpdate({ logoWidth: w, logoHeight: h })} />}
          </div>

          {/* Banner */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-accent" />Promotional Banner
            </h4>
            {sig.bannerUrl ? (
              <div className="space-y-2">
                <div className="relative rounded-lg overflow-hidden border border-border">
                  <img src={sig.bannerUrl} alt="Banner" className="w-full h-auto max-h-40 object-cover" />
                  <Button variant="destructive" size="sm" className="absolute top-2 right-2 h-7" onClick={() => onUpdate({ bannerUrl: '', bannerLinkUrl: '' })}><X className="h-3 w-3" /></Button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs text-muted-foreground">Width (px)</label>
                    <Input type="number" value={sig.bannerWidth || 550} onChange={e => onUpdate({ bannerWidth: parseInt(e.target.value) || 550 })} className="h-8 text-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs text-muted-foreground">Height (px)</label>
                    <Input type="number" value={sig.bannerHeight || 150} onChange={e => onUpdate({ bannerHeight: parseInt(e.target.value) || 150 })} className="h-8 text-sm" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground">Banner Link URL</label>
                  <Input value={sig.bannerLinkUrl || ''} onChange={e => onUpdate({ bannerLinkUrl: e.target.value })} placeholder="https://..." className="h-8 text-sm" />
                </div>
              </div>
            ) : (
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input type="file" accept="image/*" onChange={e => { const f = e.target.files?.[0]; if (f) handleFileUpload(f, 'bannerUrl'); e.target.value = ''; }} className="absolute inset-0 opacity-0 cursor-pointer" disabled={uploadingBanner} />
                  <Button variant="outline" size="sm" className="w-full gap-2 pointer-events-none" disabled={uploadingBanner}>
                    {uploadingBanner ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}Upload Banner
                  </Button>
                </div>
                <Popover>
                  <PopoverTrigger asChild><Button variant="outline" size="sm" className="gap-2"><Link2 className="h-3 w-3" />URL</Button></PopoverTrigger>
                  <PopoverContent className="w-80" align="start">
                    <div className="space-y-2">
                      <label className="text-xs font-medium">Banner Image URL</label>
                      <Input value={sig.bannerUrl || ''} onChange={e => onUpdate({ bannerUrl: e.target.value })} placeholder="https://example.com/banner.jpg" />
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            )}
          </div>
        </TabsContent>

        {/* ── Social Tab ── */}
        <TabsContent value="social" className="space-y-4 mt-4">
          <p className="text-xs text-muted-foreground">Add social media links displayed as icon circles in your signature.</p>
          <div className="flex flex-wrap gap-2">
            {SOCIAL_PLATFORMS.map(p => {
              const exists = sig.socialLinks?.some(l => l.platform === p.id);
              return (
                <Button key={p.id} variant={exists ? 'default' : 'outline'} size="sm" className="h-8 text-xs gap-1.5"
                  onClick={() => exists ? removeSocialLink(sig.socialLinks!.find(l => l.platform === p.id)!.id) : addSocialLink(p.id)}
                  style={exists ? { backgroundColor: p.color, borderColor: p.color } : {}}>
                  <span className="w-4 h-4 rounded-full flex items-center justify-center text-[10px]" style={!exists ? { backgroundColor: p.color, color: '#fff' } : { color: '#fff' }}>{p.letter}</span>
                  {p.name}
                </Button>
              );
            })}
          </div>
          {(sig.socialLinks || []).length > 0 && (
            <div className="space-y-3 pt-2">
              {(sig.socialLinks || []).map(link => {
                const p = SOCIAL_PLATFORMS.find(pl => pl.id === link.platform);
                return (
                  <div key={link.id} className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] shrink-0" style={{ backgroundColor: p?.color || '#666', color: '#fff' }}>{p?.letter || '•'}</div>
                    <Input value={link.url} onChange={e => updateSocialLink(link.id, e.target.value)} placeholder={`https://${link.platform}.com/...`} className="h-8 text-xs flex-1" />
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive" onClick={() => removeSocialLink(link.id)}><X className="h-3 w-3" /></Button>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* ── Style Tab ── */}
        <TabsContent value="style" className="space-y-5 mt-4">
          {/* Typography */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Typography</h4>
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground">Font Family</label>
              <Select value={style.fontFamily || 'Arial, sans-serif'} onValueChange={v => updateStyle({ fontFamily: v })}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {FONT_FAMILIES.map(f => <SelectItem key={f.value} value={f.value}><span style={{ fontFamily: f.value }}>{f.label}</span></SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">Name Size</label>
                <Input type="number" value={style.nameFontSize || 18} onChange={e => updateStyle({ nameFontSize: parseInt(e.target.value) || 18 })} min={10} max={32} className="h-8 text-sm" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">Title Size</label>
                <Input type="number" value={style.titleFontSize || 14} onChange={e => updateStyle({ titleFontSize: parseInt(e.target.value) || 14 })} min={8} max={24} className="h-8 text-sm" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">Text Size</label>
                <Input type="number" value={style.textFontSize || 12} onChange={e => updateStyle({ textFontSize: parseInt(e.target.value) || 12 })} min={8} max={20} className="h-8 text-sm" />
              </div>
            </div>
          </div>

          {/* Colors */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Colors</h4>
            <div className="grid grid-cols-2 gap-3">
              {([
                ['nameColor', 'Name Color', style.nameColor || '#003b71'],
                ['titleColor', 'Title Color', style.titleColor || '#139cd8'],
                ['textColor', 'Text Color', style.textColor || '#666666'],
                ['linkColor', 'Link/Accent', style.linkColor || '#139cd8'],
              ] as const).map(([key, label, val]) => (
                <div key={key} className="flex items-center gap-2">
                  <input type="color" value={val} onChange={e => updateStyle({ [key]: e.target.value })} className="w-8 h-8 rounded border border-input cursor-pointer shrink-0" />
                  <div className="flex-1">
                    <label className="text-xs text-muted-foreground">{label}</label>
                    <Input value={val} onChange={e => updateStyle({ [key]: e.target.value })} className="h-7 text-xs font-mono uppercase" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Divider</h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">Style</label>
                <Select value={style.dividerStyle || 'solid'} onValueChange={v => updateStyle({ dividerStyle: v as SignatureStyle['dividerStyle'] })}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {DIVIDER_STYLES.map(d => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">Thickness (px)</label>
                <Input type="number" value={style.dividerWidth ?? 2} onChange={e => updateStyle({ dividerWidth: parseInt(e.target.value) || 2 })} min={0} max={8} className="h-8 text-sm" />
              </div>
            </div>
            {style.dividerStyle !== 'none' && (
              <div className="flex items-center gap-2">
                <input type="color" value={style.dividerColor || '#139cd8'} onChange={e => updateStyle({ dividerColor: e.target.value })} className="w-8 h-8 rounded border border-input cursor-pointer" />
                <Input value={style.dividerColor || '#139cd8'} onChange={e => updateStyle({ dividerColor: e.target.value })} className="h-7 text-xs font-mono uppercase flex-1" />
              </div>
            )}
          </div>

          {/* Layout & Spacing */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Layout</h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">Direction</label>
                <Select value={style.layout || 'horizontal'} onValueChange={v => updateStyle({ layout: v as 'horizontal' | 'vertical' })}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="horizontal">Horizontal (Logo Left)</SelectItem>
                    <SelectItem value="vertical">Vertical (Logo Top)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">Spacing (px)</label>
                <Input type="number" value={style.spacing ?? 15} onChange={e => updateStyle({ spacing: parseInt(e.target.value) || 15 })} min={4} max={40} className="h-8 text-sm" />
              </div>
            </div>
          </div>

          {/* Accent Color (legacy compat) */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Brand Accent Override</h4>
            <div className="flex items-center gap-3">
              <input type="color" value={sig.accentColor || DEFAULT_ACCENT} onChange={e => onUpdate({ accentColor: e.target.value })} className="w-10 h-10 rounded border border-input cursor-pointer" />
              <Input value={sig.accentColor || ''} onChange={e => onUpdate({ accentColor: e.target.value })} placeholder={`Default: ${DEFAULT_ACCENT}`} className="font-mono text-sm uppercase flex-1" />
              {sig.accentColor && <Button variant="ghost" size="sm" onClick={() => onUpdate({ accentColor: undefined })} className="text-xs">Reset</Button>}
            </div>
          </div>
        </TabsContent>

        {/* ── Export Tab ── */}
        <TabsContent value="export" className="space-y-4 mt-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Generated HTML</h4>
              <Button size="sm" variant="outline" className="h-7 text-xs gap-1.5" onClick={async () => {
                await navigator.clipboard.writeText(exportHtml);
                toast.success('HTML copied to clipboard');
              }}>
                <Code className="h-3 w-3" />Copy HTML
              </Button>
            </div>
            <Textarea value={exportHtml} readOnly className="font-mono text-xs min-h-[200px] bg-muted/30" />
            <p className="text-xs text-muted-foreground">Paste this HTML into your email client's signature settings.</p>
          </div>

          {/* Raw HTML override */}
          <div className="space-y-3 pt-4 border-t border-border">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Custom HTML Override (Advanced)</h4>
            <p className="text-xs text-muted-foreground">Editing the raw HTML template will override the visual editor output for legacy signatures.</p>
            <Textarea value={sig.html} onChange={e => onUpdate({ html: e.target.value })} className="font-mono text-xs min-h-[150px]" />
            <p className="text-xs text-muted-foreground">Placeholders: [NAME], [ROLE], [COMPANY], [EMAIL], [PHONE], [WEBSITE], [ADDRESS], [LOGO_URL], [CONFIDENTIALITY]</p>
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex gap-2 pt-2 border-t border-border">
        <Button size="sm" variant="secondary" onClick={onDone}>Done</Button>
        {confirmDelete ? (
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-xs text-destructive font-medium">Delete this signature?</span>
            <Button size="sm" variant="destructive" onClick={onDelete} className="h-7 text-xs">Yes, Delete</Button>
            <Button size="sm" variant="ghost" onClick={() => setConfirmDelete(false)} className="h-7 text-xs">Cancel</Button>
          </div>
        ) : (
          <Button size="sm" variant="ghost" onClick={() => setConfirmDelete(true)} className="text-destructive hover:text-destructive ml-auto"><X className="h-4 w-4 mr-1" />Delete</Button>
        )}
      </div>
    </div>
  );
};
