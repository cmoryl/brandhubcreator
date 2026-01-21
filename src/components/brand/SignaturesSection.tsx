import { useState, useRef } from 'react';
import { Plus, X, Pencil, Copy, Check, Code, LayoutTemplate, Mail, Phone, Globe, MapPin, Building2, Image, ExternalLink, ImagePlus, Upload, Link2, Loader2 } from 'lucide-react';
import DOMPurify from 'dompurify';
import { BrandSignature, BrandEmailBanner } from '@/types/brand';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SectionHeader } from './SectionHeader';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SignaturesSectionProps {
  signatures: BrandSignature[];
  onSignaturesChange: (signatures: BrandSignature[]) => void;
  emailBanners?: BrandEmailBanner[];
  onEmailBannersChange?: (banners: BrandEmailBanner[]) => void;
  customSubtitle?: string;
  onSubtitleChange?: (subtitle: string) => void;
}

const signatureTemplates = {
  full: {
    name: 'Full Signature',
    variant: 'full' as const,
    description: 'Complete signature with logo, contact info, and banner area',
    template: `<table cellpadding="0" cellspacing="0" style="font-family: Arial, sans-serif; max-width: 550px;">
  <tr>
    <td style="padding-bottom: 12px; border-bottom: 2px solid #e94560;">
      <p style="margin: 0; font-size: 18px; font-weight: bold; color: #1a1a2e;">[NAME]</p>
      <p style="margin: 4px 0 0 0; font-size: 14px; color: #e94560; font-weight: 500;">[ROLE]</p>
    </td>
  </tr>
  <tr>
    <td style="padding: 15px 0;">
      <table cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding-right: 20px; vertical-align: top;">
            <img src="[LOGO_URL]" alt="[COMPANY]" width="100" height="100" style="display: block;">
          </td>
          <td style="vertical-align: top;">
            <p style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600; color: #1a1a2e;">[COMPANY]</p>
            <p style="margin: 0 0 4px 0; font-size: 12px; color: #666;">[ADDRESS]</p>
            <p style="margin: 8px 0 2px 0; font-size: 12px; color: #666;"><span style="color: #e94560; font-weight: bold;">P:</span> [PHONE]</p>
            <p style="margin: 2px 0; font-size: 12px; color: #666;"><span style="color: #e94560; font-weight: bold;">E:</span> [EMAIL]</p>
            <p style="margin: 2px 0; font-size: 12px; color: #666;"><span style="color: #e94560; font-weight: bold;">W:</span> [WEBSITE]</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
  <tr>
    <td style="padding: 15px 0;">
      <!-- EMAIL BANNER PLACEHOLDER -->
    </td>
  </tr>
  <tr>
    <td style="padding-top: 10px; border-top: 1px solid #eee;">
      <p style="margin: 0; font-size: 9px; color: #999; line-height: 1.4;">[CONFIDENTIALITY]</p>
    </td>
  </tr>
</table>`,
  },
  reply: {
    name: 'Minimal Reply',
    variant: 'reply' as const,
    description: 'Compact signature for email replies',
    template: `<table cellpadding="0" cellspacing="0" style="font-family: Arial, sans-serif;">
  <tr>
    <td style="padding-bottom: 10px;">
      <img src="[LOGO_URL]" alt="[COMPANY]" width="80" height="80" style="display: block;">
    </td>
  </tr>
  <tr>
    <td>
      <p style="margin: 0; font-size: 14px; color: #1a1a2e;">
        <strong>[NAME]</strong> <span style="color: #999;">|</span> <span style="color: #e94560;">[ROLE]</span>
      </p>
      <p style="margin: 4px 0 0 0; font-size: 12px; color: #666;">[COMPANY] <span style="color: #999;">|</span> <a href="https://[WEBSITE]" style="color: #e94560; text-decoration: none;">[WEBSITE]</a></p>
    </td>
  </tr>
</table>`,
  },
  minimal: {
    name: 'Text Only',
    variant: 'minimal' as const,
    description: 'Simple text signature without graphics',
    template: `<div style="font-family: Arial, sans-serif; font-size: 12px; color: #333;">
  <p style="margin: 0; font-weight: bold;">[NAME]</p>
  <p style="margin: 2px 0; color: #666;">[ROLE] | [COMPANY]</p>
  <p style="margin: 8px 0 0 0; color: #999;">[EMAIL] | [PHONE]</p>
</div>`,
  },
};

const defaultConfidentiality = `CONFIDENTIALITY NOTICE: The content of this email is confidential and intended for the recipient specified in message only. It is strictly forbidden to share any part of this message with any third party, without a written consent of the sender. If you received this message by mistake, please reply to this message and follow with its deletion, so that we can ensure such a mistake does not occur in the future.`;

const bannerSizePresets = [
  { name: 'Standard Banner', width: 600, height: 150, description: 'Best for promotional campaigns' },
  { name: 'Compact Banner', width: 550, height: 100, description: 'Subtle promotional space' },
  { name: 'Wide Banner', width: 600, height: 200, description: 'High-impact visuals' },
  { name: 'Square Feature', width: 300, height: 300, description: 'Product spotlight' },
];

export const SignaturesSection = ({ 
  signatures, 
  onSignaturesChange, 
  emailBanners = [],
  onEmailBannersChange,
  customSubtitle, 
  onSubtitleChange 
}: SignaturesSectionProps) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingBannerId, setEditingBannerId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [isHeaderEditing, setIsHeaderEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<'signatures' | 'banners'>('signatures');
  const [uploadingLogoId, setUploadingLogoId] = useState<string | null>(null);
  const [logoInputMode, setLogoInputMode] = useState<'url' | 'upload'>('url');
  const logoFileInputRef = useRef<HTMLInputElement>(null);

  const addSignature = (templateKey: keyof typeof signatureTemplates = 'full') => {
    const template = signatureTemplates[templateKey];
    const newSignature: BrandSignature = {
      id: crypto.randomUUID(),
      name: 'John Doe',
      role: 'Global Account Lead',
      html: template.template,
      company: 'Your Company',
      email: 'jdoe@company.com',
      phone: '+1 212.555.0123',
      website: 'www.company.com',
      address: '1250 Broadway, New York, NY 10001',
      logoUrl: '',
      variant: template.variant,
      confidentialityNotice: templateKey === 'full' ? defaultConfidentiality : undefined,
    };
    onSignaturesChange([...signatures, newSignature]);
    setEditingId(newSignature.id);
    setTemplateDialogOpen(false);
  };

  const updateSignature = (id: string, updates: Partial<BrandSignature>) => {
    onSignaturesChange(signatures.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const deleteSignature = (id: string) => {
    onSignaturesChange(signatures.filter(s => s.id !== id));
    if (editingId === id) setEditingId(null);
  };

  const addEmailBanner = (preset?: typeof bannerSizePresets[0]) => {
    if (!onEmailBannersChange) return;
    const newBanner: BrandEmailBanner = {
      id: crypto.randomUUID(),
      name: preset?.name || 'Email Banner',
      imageUrl: '',
      linkUrl: '',
      width: preset?.width || 600,
      height: preset?.height || 150,
      description: preset?.description || '',
    };
    onEmailBannersChange([...emailBanners, newBanner]);
    setEditingBannerId(newBanner.id);
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

  const copyHTML = async (html: string, id: string) => {
    await navigator.clipboard.writeText(html);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>, signatureId: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image must be less than 2MB');
      return;
    }

    setUploadingLogoId(signatureId);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `signature-logos/${signatureId}-${Date.now()}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from('organization-assets')
        .upload(fileName, file, { upsert: true });

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from('organization-assets')
        .getPublicUrl(fileName);

      updateSignature(signatureId, { logoUrl: urlData.publicUrl });
      toast.success('Logo uploaded successfully');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload logo');
    } finally {
      setUploadingLogoId(null);
      if (logoFileInputRef.current) {
        logoFileInputRef.current.value = '';
      }
    }
  };

  const [uploadingBannerId, setUploadingBannerId] = useState<string | null>(null);

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>, bannerId: string) => {
    const file = e.target.files?.[0];
    if (!file || !onEmailBannersChange) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image must be less than 2MB');
      return;
    }

    setUploadingBannerId(bannerId);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `email-banners/${bannerId}-${Date.now()}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from('organization-assets')
        .upload(fileName, file, { upsert: true });

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from('organization-assets')
        .getPublicUrl(fileName);

      updateEmailBanner(bannerId, { imageUrl: urlData.publicUrl });
      toast.success('Banner uploaded successfully');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload banner');
    } finally {
      setUploadingBannerId(null);
    }
  };

  const renderPreview = (signature: BrandSignature) => {
    let html = signature.html
      .replace(/\[NAME\]/g, signature.name)
      .replace(/\[ROLE\]/g, signature.role)
      .replace(/\[COMPANY\]/g, signature.company || 'Company')
      .replace(/\[EMAIL\]/g, signature.email || 'email@company.com')
      .replace(/\[PHONE\]/g, signature.phone || '+1 234 567 890')
      .replace(/\[WEBSITE\]/g, signature.website || 'www.company.com')
      .replace(/\[ADDRESS\]/g, signature.address || '123 Business St, City')
      .replace(/\[CONFIDENTIALITY\]/g, signature.confidentialityNotice || '')
      .replace(/\[LOGO_URL\]/g, signature.logoUrl || 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect fill="%23f0f0f0" width="100" height="100" rx="4"/><text x="50" y="55" text-anchor="middle" fill="%23999" font-family="Arial" font-size="10">Logo</text></svg>');
    
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: ['table', 'tr', 'td', 'th', 'tbody', 'thead', 'p', 'img', 'a', 'strong', 'em', 'b', 'i', 'span', 'div', 'br', 'hr'],
      ALLOWED_ATTR: ['style', 'src', 'alt', 'width', 'height', 'href', 'cellpadding', 'cellspacing', 'border', 'align', 'valign', 'class', 'target', 'rel', 'colspan']
    });
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

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'signatures' | 'banners')} className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <TabsList>
            <TabsTrigger value="signatures" className="gap-2">
              <Mail className="h-4 w-4" />
              Signatures
            </TabsTrigger>
            <TabsTrigger value="banners" className="gap-2">
              <Image className="h-4 w-4" />
              Email Banners
            </TabsTrigger>
          </TabsList>
          
          {activeTab === 'signatures' && (
            <div className="flex gap-2">
              <Dialog open={templateDialogOpen} onOpenChange={setTemplateDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <LayoutTemplate className="h-4 w-4" />
                    Templates
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl">
                  <DialogHeader>
                    <DialogTitle>Choose a Signature Template</DialogTitle>
                  </DialogHeader>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
                    {Object.entries(signatureTemplates).map(([key, template]) => (
                      <button
                        key={key}
                        onClick={() => addSignature(key as keyof typeof signatureTemplates)}
                        className="text-left p-4 border border-border rounded-lg hover:border-primary hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-medium">{template.name}</h4>
                          {getVariantBadge(template.variant)}
                        </div>
                        <p className="text-xs text-muted-foreground mb-3">{template.description}</p>
                        <div className="bg-white p-2 rounded text-[10px] h-16 overflow-hidden border border-border/50">
                          <div className="font-semibold">John Doe</div>
                          <div className="text-primary text-[9px]">Director</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </DialogContent>
              </Dialog>
              <Button onClick={() => addSignature('full')} size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                Add Signature
              </Button>
            </div>
          )}
          
          {activeTab === 'banners' && onEmailBannersChange && (
            <div className="flex gap-2">
              <Select onValueChange={(name) => {
                const preset = bannerSizePresets.find(p => p.name === name);
                if (preset) addEmailBanner(preset);
              }}>
                <SelectTrigger className="w-[180px] h-9 text-sm">
                  <SelectValue placeholder="Add preset..." />
                </SelectTrigger>
                <SelectContent>
                  {bannerSizePresets.map((preset) => (
                    <SelectItem key={preset.name} value={preset.name}>
                      <div className="flex flex-col">
                        <span>{preset.name}</span>
                        <span className="text-xs text-muted-foreground">{preset.width} × {preset.height}px</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={() => addEmailBanner()} size="sm" className="gap-2">
                <ImagePlus className="h-4 w-4" />
                Add Banner
              </Button>
            </div>
          )}
        </div>

        {/* Signatures Tab */}
        <TabsContent value="signatures" className="space-y-4 mt-0">
          {signatures.map((signature, index) => (
            <div
              key={signature.id}
              className="group relative bg-card rounded-xl shadow-sm border border-border animate-slide-up overflow-hidden"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              {/* Header bar styled like email client */}
              <div className="bg-muted/50 px-4 py-2 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-muted-foreground/30" />
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Internal Mail Client Preview
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {getVariantBadge(signature.variant)}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyHTML(renderPreview(signature), signature.id)}
                    className="h-7 gap-1.5 text-xs"
                  >
                    {copiedId === signature.id ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    {copiedId === signature.id ? 'Copied!' : 'Copy HTML'}
                  </Button>
                </div>
              </div>

              {editingId === signature.id ? (
                <div className="p-6 space-y-6">
                  {/* Section label */}
                  <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                    Contact Information
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-muted-foreground">Full Name</label>
                      <Input
                        value={signature.name}
                        onChange={(e) => updateSignature(signature.id, { name: e.target.value })}
                        placeholder="John Doe"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-muted-foreground">Job Title</label>
                      <Input
                        value={signature.role}
                        onChange={(e) => updateSignature(signature.id, { role: e.target.value })}
                        placeholder="Global Account Lead"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                        <Building2 className="h-3 w-3" /> Company
                      </label>
                      <Input
                        value={signature.company || ''}
                        onChange={(e) => updateSignature(signature.id, { company: e.target.value })}
                        placeholder="Company Name"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                        <MapPin className="h-3 w-3" /> Address
                      </label>
                      <Input
                        value={signature.address || ''}
                        onChange={(e) => updateSignature(signature.id, { address: e.target.value })}
                        placeholder="1250 Broadway, New York, NY 10001"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                        <Phone className="h-3 w-3" /> Phone
                      </label>
                      <Input
                        value={signature.phone || ''}
                        onChange={(e) => updateSignature(signature.id, { phone: e.target.value })}
                        placeholder="+1 212.555.0123"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                        <Mail className="h-3 w-3" /> Email
                      </label>
                      <Input
                        value={signature.email || ''}
                        onChange={(e) => updateSignature(signature.id, { email: e.target.value })}
                        placeholder="jdoe@company.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                        <Globe className="h-3 w-3" /> Website
                      </label>
                      <Input
                        value={signature.website || ''}
                        onChange={(e) => updateSignature(signature.id, { website: e.target.value })}
                        placeholder="www.company.com"
                      />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                        <Image className="h-3 w-3" /> Signature Logo
                      </label>
                      <div className="space-y-3">
                        {/* Logo Preview */}
                        {signature.logoUrl && (
                          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border border-border">
                            <img 
                              src={signature.logoUrl} 
                              alt="Logo preview" 
                              className="h-12 w-12 object-contain rounded bg-white p-1"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-muted-foreground truncate">{signature.logoUrl}</p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => updateSignature(signature.id, { logoUrl: '' })}
                              className="text-destructive hover:text-destructive h-8"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                        
                        {/* Upload/Link Options */}
                        <div className="flex gap-2">
                          {/* Upload Button */}
                          <div className="relative">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleLogoUpload(e, signature.id)}
                              className="absolute inset-0 opacity-0 cursor-pointer"
                              disabled={uploadingLogoId === signature.id}
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-2 pointer-events-none"
                              disabled={uploadingLogoId === signature.id}
                            >
                              {uploadingLogoId === signature.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Upload className="h-4 w-4" />
                              )}
                              Upload Logo
                            </Button>
                          </div>
                          
                          {/* URL Input with Popover */}
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant="outline" size="sm" className="gap-2">
                                <Link2 className="h-4 w-4" />
                                Link URL
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-80" align="start">
                              <div className="space-y-3">
                                <div className="space-y-1">
                                  <label className="text-xs font-medium">Logo URL</label>
                                  <Input
                                    value={signature.logoUrl || ''}
                                    onChange={(e) => updateSignature(signature.id, { logoUrl: e.target.value })}
                                    placeholder="https://example.com/logo.png"
                                  />
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  Enter a direct link to your logo image (PNG, JPG, SVG)
                                </p>
                              </div>
                            </PopoverContent>
                          </Popover>
                        </div>
                        
                        <p className="text-xs text-muted-foreground">
                          Recommended: 100×100px, PNG or SVG with transparent background
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Confidentiality Notice */}
                  {signature.variant === 'full' && (
                    <>
                      <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider pt-4">
                        <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                        Confidentiality Notice
                      </div>
                      <Textarea
                        value={signature.confidentialityNotice || ''}
                        onChange={(e) => updateSignature(signature.id, { confidentialityNotice: e.target.value })}
                        placeholder="Enter confidentiality notice..."
                        className="text-xs min-h-[80px]"
                      />
                    </>
                  )}

                  {/* HTML Template */}
                  <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider pt-4">
                    <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
                    HTML Template (Advanced)
                  </div>
                  <Textarea
                    value={signature.html}
                    onChange={(e) => updateSignature(signature.id, { html: e.target.value })}
                    placeholder="HTML signature template"
                    className="font-mono text-xs min-h-[150px]"
                  />
                  <p className="text-xs text-muted-foreground">
                    Placeholders: [NAME], [ROLE], [COMPANY], [EMAIL], [PHONE], [WEBSITE], [ADDRESS], [LOGO_URL], [CONFIDENTIALITY]
                  </p>

                  <div className="flex gap-2 pt-2">
                    <Button size="sm" variant="secondary" onClick={() => setEditingId(null)}>
                      Done
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => deleteSignature(signature.id)} className="text-destructive hover:text-destructive">
                      <X className="h-4 w-4 mr-1" /> Delete
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Signature Preview */}
                  <div className="p-6">
                    <div
                      className="bg-white p-6 rounded-lg border border-border/50"
                      dangerouslySetInnerHTML={{ __html: renderPreview(signature) }}
                    />
                  </div>
                  
                  {/* Action buttons */}
                  <div className="px-6 pb-4 flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => setEditingId(signature.id)}
                      className="p-2 rounded-md hover:bg-secondary transition-colors"
                    >
                      <Pencil className="h-4 w-4 text-muted-foreground" />
                    </button>
                    <button
                      onClick={() => deleteSignature(signature.id)}
                      className="p-2 rounded-md hover:bg-destructive hover:text-destructive-foreground transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}

          {signatures.length === 0 && (
            <button
              onClick={() => addSignature('full')}
              className="w-full h-40 border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-primary hover:text-primary transition-colors"
            >
              <Mail className="h-8 w-8" />
              <span className="text-sm font-medium">Create email signature template</span>
              <span className="text-xs text-muted-foreground">Choose from Full, Reply, or Minimal variants</span>
            </button>
          )}
        </TabsContent>

        {/* Email Banners Tab */}
        <TabsContent value="banners" className="space-y-6 mt-0">
          {/* Info callout */}
          <div className="bg-muted/50 rounded-lg p-4 border border-border/50">
            <h4 className="font-medium text-sm mb-1">Email Banner Guidelines</h4>
            <p className="text-xs text-muted-foreground">
              Email banners appear below signatures for promotional campaigns, events, or announcements. 
              Keep file sizes under 100KB and use standard widths (550-600px) for best compatibility.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {emailBanners.map((banner, index) => {
              const isEditing = editingBannerId === banner.id;
              const aspectRatio = banner.width / banner.height;

              return (
                <div
                  key={banner.id}
                  className="group relative bg-card/50 backdrop-blur-sm rounded-xl border border-border/50 overflow-hidden animate-scale-in hover:border-primary/30 transition-colors"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  {/* Header */}
                  <div className="flex items-center justify-between px-4 py-3 border-b border-border/30">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Image className="h-4 w-4 text-primary" />
                      </div>
                      {isEditing ? (
                        <Input
                          value={banner.name}
                          onChange={(e) => updateEmailBanner(banner.id, { name: e.target.value })}
                          className="h-7 text-xs w-[140px]"
                        />
                      ) : (
                        <span className="font-semibold text-sm text-foreground">
                          {banner.name}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-mono bg-muted/80 px-2 py-0.5 rounded text-muted-foreground">
                        {banner.width} × {banner.height}
                      </span>
                      <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => setEditingBannerId(isEditing ? null : banner.id)}
                          className="p-1 rounded hover:bg-secondary transition-colors"
                        >
                          <Pencil className="h-3 w-3 text-muted-foreground" />
                        </button>
                        <button
                          onClick={() => deleteEmailBanner(banner.id)}
                          className="p-1 rounded hover:bg-destructive hover:text-destructive-foreground transition-colors"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Banner Preview */}
                  <div className="px-4 py-4">
                    <div 
                      className="relative bg-muted/30 rounded-lg border border-dashed border-primary/30 flex items-center justify-center overflow-hidden"
                      style={{ 
                        aspectRatio: aspectRatio > 3 ? 4 : aspectRatio,
                        maxHeight: '200px'
                      }}
                    >
                      {banner.imageUrl ? (
                        <img 
                          src={banner.imageUrl} 
                          alt={banner.name}
                          className="w-full h-full object-cover rounded"
                        />
                      ) : (
                        <div className="flex flex-col items-center gap-2 text-muted-foreground">
                          <ImagePlus className="h-8 w-8 opacity-50" />
                          <span className="text-xs">Add banner image</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Specs / Edit Form */}
                  <div className="px-4 pb-4 space-y-3">
                    {isEditing ? (
                      <>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Width (px)</label>
                            <Input
                              type="number"
                              value={banner.width}
                              onChange={(e) => updateEmailBanner(banner.id, { width: parseInt(e.target.value) || 600 })}
                              className="h-8 text-xs"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Height (px)</label>
                            <Input
                              type="number"
                              value={banner.height}
                              onChange={(e) => updateEmailBanner(banner.id, { height: parseInt(e.target.value) || 150 })}
                              className="h-8 text-xs"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Banner Image</label>
                          <div className="flex gap-2">
                            {/* Upload Button */}
                            <div className="relative flex-1">
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleBannerUpload(e, banner.id)}
                                className="absolute inset-0 opacity-0 cursor-pointer"
                                disabled={uploadingBannerId === banner.id}
                              />
                              <Button
                                variant="outline"
                                size="sm"
                                className="w-full gap-2 pointer-events-none h-8 text-xs"
                                disabled={uploadingBannerId === banner.id}
                              >
                                {uploadingBannerId === banner.id ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <Upload className="h-3 w-3" />
                                )}
                                Upload
                              </Button>
                            </div>
                            
                            {/* URL Input with Popover */}
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button variant="outline" size="sm" className="gap-2 h-8 text-xs">
                                  <Link2 className="h-3 w-3" />
                                  URL
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-80" align="start">
                                <div className="space-y-3">
                                  <div className="space-y-1">
                                    <label className="text-xs font-medium">Image URL</label>
                                    <Input
                                      value={banner.imageUrl}
                                      onChange={(e) => updateEmailBanner(banner.id, { imageUrl: e.target.value })}
                                      placeholder="https://example.com/banner.jpg"
                                    />
                                  </div>
                                </div>
                              </PopoverContent>
                            </Popover>
                          </div>
                          {banner.imageUrl && (
                            <p className="text-[10px] text-muted-foreground truncate">{banner.imageUrl}</p>
                          )}
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Link URL (optional)</label>
                          <Input
                            value={banner.linkUrl || ''}
                            onChange={(e) => updateEmailBanner(banner.id, { linkUrl: e.target.value })}
                            placeholder="https://..."
                            className="h-8 text-xs"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Description</label>
                          <Input
                            value={banner.description || ''}
                            onChange={(e) => updateEmailBanner(banner.id, { description: e.target.value })}
                            placeholder="Campaign or usage notes..."
                            className="h-8 text-xs"
                          />
                        </div>
                        <Button size="sm" variant="secondary" onClick={() => setEditingBannerId(null)} className="mt-2">
                          Done
                        </Button>
                      </>
                    ) : (
                      <div className="bg-muted/50 rounded-lg p-3">
                        <div className="grid grid-cols-2 gap-4 text-xs mb-2">
                          <div>
                            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-0.5">Dimensions</p>
                            <p className="font-medium">{banner.width} × {banner.height} px</p>
                          </div>
                          <div>
                            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-0.5">Aspect Ratio</p>
                            <p className="font-medium">{aspectRatio.toFixed(2)}:1</p>
                          </div>
                        </div>
                        {banner.description && (
                          <p className="text-xs text-muted-foreground">{banner.description}</p>
                        )}
                        {banner.linkUrl && (
                          <a 
                            href={banner.linkUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-xs text-primary hover:underline flex items-center gap-1 mt-2"
                          >
                            <ExternalLink className="h-3 w-3" /> View link
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {emailBanners.length === 0 && (
              <button
                onClick={() => addEmailBanner(bannerSizePresets[0])}
                className="h-48 border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-primary hover:text-primary transition-colors col-span-full"
              >
                <ImagePlus className="h-8 w-8" />
                <span className="text-sm font-medium">Add email banner specification</span>
                <span className="text-xs text-muted-foreground">Standard sizes: 600×150, 550×100, 600×200</span>
              </button>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </section>
  );
};
