/**
 * QRCodeEditorDialog - Create/Edit QR code dialog with advanced styling options
 * Supports custom dot styles, corner styles, colors, and logo overlays
 */

import { useState, useEffect, useRef } from 'react';
import QRCodeStyling, { DotType, CornerDotType, CornerSquareType } from 'qr-code-styling';
import { Loader2, Upload, Image as ImageIcon, QrCode as QrCodeIcon, Circle, Square, Hexagon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { ImageLibraryPicker } from '@/components/ui/ImageLibraryPicker';
import { cn } from '@/lib/utils';
import type { QRCode as QRCodeType, QRDotStyle, QRCornerStyle } from '@/hooks/useQRCodes';

interface QRCodeEditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  qrCode?: QRCodeType;
  brandLogos?: { url: string; name: string }[];
  onSave: (data: Omit<QRCodeType, 'id' | 'createdAt' | 'updatedAt' | 'scanCount'>) => Promise<void>;
  isSaving: boolean;
}

const USE_CASES = [
  { value: 'event', label: 'Event' },
  { value: 'product', label: 'Product' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'contact', label: 'Contact' },
  { value: 'wifi', label: 'WiFi' },
  { value: 'other', label: 'Other' },
];

const ERROR_CORRECTIONS = [
  { value: 'L', label: 'Low (7%)', description: 'Smallest QR, least error tolerance' },
  { value: 'M', label: 'Medium (15%)', description: 'Good balance of size and reliability' },
  { value: 'Q', label: 'Quartile (25%)', description: 'Good for printed materials' },
  { value: 'H', label: 'High (30%)', description: 'Best for logo overlays, largest QR' },
];

const DOT_STYLES: { value: QRDotStyle; label: string; preview: string }[] = [
  { value: 'square', label: 'Square', preview: '◼' },
  { value: 'dots', label: 'Circles', preview: '●' },
  { value: 'rounded', label: 'Rounded', preview: '◆' },
  { value: 'extra-rounded', label: 'Pill', preview: '⬬' },
  { value: 'classy', label: 'Classy', preview: '◧' },
  { value: 'classy-rounded', label: 'Classy Rounded', preview: '◐' },
];

const CORNER_STYLES: { value: QRCornerStyle; label: string; preview: string }[] = [
  { value: 'square', label: 'Square', preview: '◼' },
  { value: 'dot', label: 'Dot', preview: '●' },
  { value: 'extra-rounded', label: 'Rounded', preview: '◉' },
];

const STYLE_PRESETS = [
  { id: 'classic', name: 'Classic', fgColor: '#000000', bgColor: '#ffffff', icon: '⬛' },
  { id: 'inverted', name: 'Inverted', fgColor: '#ffffff', bgColor: '#000000', icon: '⬜' },
  { id: 'ocean', name: 'Ocean', fgColor: '#0077b6', bgColor: '#caf0f8', icon: '🌊' },
  { id: 'forest', name: 'Forest', fgColor: '#1b4332', bgColor: '#d8f3dc', icon: '🌲' },
  { id: 'sunset', name: 'Sunset', fgColor: '#9d4edd', bgColor: '#ffecd2', icon: '🌅' },
  { id: 'midnight', name: 'Midnight', fgColor: '#7209b7', bgColor: '#10002b', icon: '🌙' },
  { id: 'coral', name: 'Coral', fgColor: '#e63946', bgColor: '#f1faee', icon: '🪸' },
  { id: 'mint', name: 'Mint', fgColor: '#2d6a4f', bgColor: '#b7e4c7', icon: '🍃' },
  { id: 'royal', name: 'Royal', fgColor: '#023e8a', bgColor: '#ade8f4', icon: '👑' },
  { id: 'warm', name: 'Warm', fgColor: '#bc6c25', bgColor: '#fefae0', icon: '☀️' },
  { id: 'berry', name: 'Berry', fgColor: '#7b2cbf', bgColor: '#e0aaff', icon: '🫐' },
  { id: 'slate', name: 'Slate', fgColor: '#1e293b', bgColor: '#e2e8f0', icon: '🪨' },
];

interface FormState {
  name: string;
  description: string;
  url: string;
  fgColor: string;
  bgColor: string;
  logoUrl: string;
  logoType: 'none' | 'brand' | 'custom';
  size: number;
  errorCorrection: 'L' | 'M' | 'Q' | 'H';
  dotStyle: QRDotStyle;
  cornerStyle: QRCornerStyle;
  useCase: QRCodeType['useCase'];
  isActive: boolean;
}

const DEFAULT_FORM: FormState = {
  name: '',
  description: '',
  url: 'https://',
  fgColor: '#000000',
  bgColor: '#ffffff',
  logoUrl: '',
  logoType: 'none',
  size: 512,
  errorCorrection: 'M',
  dotStyle: 'square',
  cornerStyle: 'square',
  useCase: undefined,
  isActive: true,
};

export const QRCodeEditorDialog = ({
  open,
  onOpenChange,
  qrCode,
  brandLogos = [],
  onSave,
  isSaving,
}: QRCodeEditorDialogProps) => {
  const [form, setForm] = useState(DEFAULT_FORM);
  const [activeTab, setActiveTab] = useState('basic');
  const qrContainerRef = useRef<HTMLDivElement>(null);
  const qrCodeRef = useRef<QRCodeStyling | null>(null);

  // Initialize form when editing
  useEffect(() => {
    if (qrCode) {
      setForm({
        name: qrCode.name,
        description: qrCode.description || '',
        url: qrCode.url,
        fgColor: qrCode.fgColor,
        bgColor: qrCode.bgColor,
        logoUrl: qrCode.logoUrl || '',
        logoType: qrCode.logoType,
        size: qrCode.size,
        errorCorrection: qrCode.errorCorrection,
        dotStyle: qrCode.dotStyle || 'square',
        cornerStyle: qrCode.cornerStyle || 'square',
        useCase: qrCode.useCase,
        isActive: qrCode.isActive,
      });
    } else {
      setForm(DEFAULT_FORM);
    }
    setActiveTab('basic');
  }, [qrCode, open]);

  // Helper to check if URL is valid for QR generation
  const isValidUrl = (url: string): boolean => {
    if (!url || url.trim() === '' || url === 'https://' || url === 'http://') return false;
    try {
      new URL(url);
      return true;
    } catch {
      return url.length > 10; // Allow non-URL text data like vCard, WiFi
    }
  };

  // Sample URL for preview when user hasn't entered a valid URL yet
  const SAMPLE_URL = 'https://example.com/preview';

  // Generate styled QR preview using qr-code-styling
  useEffect(() => {
    if (!qrContainerRef.current) return;
    
    // Clear container
    qrContainerRef.current.innerHTML = '';
    
    // Use sample URL if the current URL is invalid (shows preview while typing)
    const previewUrl = isValidUrl(form.url) ? form.url : SAMPLE_URL;
    
    try {
      const qrCodeInstance = new QRCodeStyling({
        width: 160,
        height: 160,
        type: 'svg',
        data: previewUrl,
        dotsOptions: {
          color: form.fgColor,
          type: form.dotStyle as DotType,
        },
        cornersSquareOptions: {
          color: form.fgColor,
          type: form.cornerStyle === 'dot' ? 'dot' : form.cornerStyle as CornerSquareType,
        },
        cornersDotOptions: {
          color: form.fgColor,
          type: form.cornerStyle as CornerDotType,
        },
        backgroundOptions: {
          color: form.bgColor,
        },
        imageOptions: form.logoUrl && form.logoType !== 'none' ? {
          crossOrigin: 'anonymous',
          margin: 4,
        } : undefined,
        image: form.logoUrl && form.logoType !== 'none' ? form.logoUrl : undefined,
        qrOptions: {
          errorCorrectionLevel: form.errorCorrection,
        },
      });

      qrCodeRef.current = qrCodeInstance;
      qrCodeInstance.append(qrContainerRef.current);
    } catch (error) {
      console.warn('[QRCodeEditorDialog] Failed to generate QR preview:', error);
    }
  }, [form.url, form.fgColor, form.bgColor, form.errorCorrection, form.dotStyle, form.cornerStyle, form.logoUrl, form.logoType]);

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.url.trim()) return;
    await onSave({
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      url: form.url.trim(),
      fgColor: form.fgColor,
      bgColor: form.bgColor,
      logoUrl: form.logoType !== 'none' ? form.logoUrl : undefined,
      logoType: form.logoType,
      size: form.size,
      errorCorrection: form.errorCorrection,
      dotStyle: form.dotStyle,
      cornerStyle: form.cornerStyle,
      useCase: form.useCase,
      isActive: form.isActive,
    });
    onOpenChange(false);
  };

  const handleLogoSelect = (url: string, type: 'brand' | 'custom') => {
    setForm(prev => ({ ...prev, logoUrl: url, logoType: type }));
  };

  const clearLogo = () => {
    setForm(prev => ({ ...prev, logoUrl: '', logoType: 'none' }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>{qrCode ? 'Edit QR Code' : 'Create QR Code'}</DialogTitle>
          <DialogDescription>
            {qrCode ? 'Update your QR code settings' : 'Create a new branded QR code'}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left: Form */}
            <div className="space-y-4">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid grid-cols-3 w-full">
                  <TabsTrigger value="basic">Basic</TabsTrigger>
                  <TabsTrigger value="style">Style</TabsTrigger>
                  <TabsTrigger value="logo">Logo</TabsTrigger>
                </TabsList>

                <TabsContent value="basic" className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label>Name *</Label>
                    <Input
                      value={form.name}
                      onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Main Website QR"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>URL *</Label>
                    <Input
                      value={form.url}
                      onChange={(e) => setForm(prev => ({ ...prev, url: e.target.value }))}
                      placeholder="https://yourbrand.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea
                      value={form.description}
                      onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Optional description for internal reference"
                      rows={2}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Use Case</Label>
                    <Select
                      value={form.useCase || ''}
                      onValueChange={(v) => setForm(prev => ({ ...prev, useCase: v as QRCodeType['useCase'] }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select use case" />
                      </SelectTrigger>
                      <SelectContent>
                        {USE_CASES.map(uc => (
                          <SelectItem key={uc.value} value={uc.value}>{uc.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </TabsContent>

                <TabsContent value="style" className="space-y-4 pt-4">
                  {/* Dot Style Selection */}
                  <div className="space-y-2">
                    <Label>QR Dot Style</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {DOT_STYLES.map((style) => (
                        <button
                          key={style.value}
                          onClick={() => setForm(prev => ({ ...prev, dotStyle: style.value }))}
                          className={cn(
                            "flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-all",
                            form.dotStyle === style.value
                              ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                              : "border-border hover:border-muted-foreground/50 hover:bg-muted/30"
                          )}
                        >
                          <span className="text-xl">{style.preview}</span>
                          <span className="text-[10px] font-medium">{style.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Corner Style Selection */}
                  <div className="space-y-2">
                    <Label>Corner Style</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {CORNER_STYLES.map((style) => (
                        <button
                          key={style.value}
                          onClick={() => setForm(prev => ({ ...prev, cornerStyle: style.value }))}
                          className={cn(
                            "flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-all",
                            form.cornerStyle === style.value
                              ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                              : "border-border hover:border-muted-foreground/50 hover:bg-muted/30"
                          )}
                        >
                          <span className="text-xl">{style.preview}</span>
                          <span className="text-[10px] font-medium">{style.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Color Preset Styles */}
                  <div className="space-y-2">
                    <Label>Color Presets</Label>
                    <div className="grid grid-cols-4 gap-2">
                      {STYLE_PRESETS.map((preset) => (
                        <button
                          key={preset.id}
                          onClick={() => setForm(prev => ({ 
                            ...prev, 
                            fgColor: preset.fgColor, 
                            bgColor: preset.bgColor 
                          }))}
                          className={cn(
                            "flex flex-col items-center gap-1 p-2 rounded-lg border-2 transition-all hover:scale-105",
                            form.fgColor === preset.fgColor && form.bgColor === preset.bgColor
                              ? "border-primary ring-2 ring-primary/20"
                              : "border-border hover:border-muted-foreground/50"
                          )}
                          style={{ backgroundColor: preset.bgColor }}
                        >
                          <span className="text-lg">{preset.icon}</span>
                          <span 
                            className="text-[10px] font-medium"
                            style={{ color: preset.fgColor }}
                          >
                            {preset.name}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Foreground Color</Label>
                      <div className="flex gap-2">
                        <Input
                          type="color"
                          value={form.fgColor}
                          onChange={(e) => setForm(prev => ({ ...prev, fgColor: e.target.value }))}
                          className="w-12 h-10 p-1 cursor-pointer"
                        />
                        <Input
                          value={form.fgColor}
                          onChange={(e) => setForm(prev => ({ ...prev, fgColor: e.target.value }))}
                          className="flex-1 font-mono uppercase"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Background Color</Label>
                      <div className="flex gap-2">
                        <Input
                          type="color"
                          value={form.bgColor}
                          onChange={(e) => setForm(prev => ({ ...prev, bgColor: e.target.value }))}
                          className="w-12 h-10 p-1 cursor-pointer"
                        />
                        <Input
                          value={form.bgColor}
                          onChange={(e) => setForm(prev => ({ ...prev, bgColor: e.target.value }))}
                          className="flex-1 font-mono uppercase"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Size: {form.size}px</Label>
                    <Slider
                      value={[form.size]}
                      onValueChange={([v]) => setForm(prev => ({ ...prev, size: v }))}
                      min={128}
                      max={1024}
                      step={64}
                    />
                    <p className="text-xs text-muted-foreground">
                      Larger sizes provide higher quality for print materials
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Error Correction</Label>
                    <Select
                      value={form.errorCorrection}
                      onValueChange={(v) => setForm(prev => ({ ...prev, errorCorrection: v as typeof form.errorCorrection }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ERROR_CORRECTIONS.map(ec => (
                          <SelectItem key={ec.value} value={ec.value}>
                            <div>
                              <span className="font-medium">{ec.label}</span>
                              <span className="text-xs text-muted-foreground ml-2">{ec.description}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Higher error correction is recommended when using logo overlays
                    </p>
                  </div>
                </TabsContent>

                <TabsContent value="logo" className="space-y-4 pt-4">
                  <div className="space-y-3">
                    <Label>Logo Overlay (Optional)</Label>
                    <p className="text-xs text-muted-foreground">
                      Add a logo in the center of your QR code. Requires High error correction.
                    </p>

                    {form.logoUrl && form.logoType !== 'none' ? (
                      <div className="flex items-center gap-3 p-3 border rounded-lg bg-muted/30">
                        <img 
                          src={form.logoUrl} 
                          alt="Logo" 
                          className="w-12 h-12 object-contain rounded"
                        />
                        <div className="flex-1">
                          <p className="text-sm font-medium">
                            {form.logoType === 'brand' ? 'Brand Logo' : 'Custom Logo'}
                          </p>
                        </div>
                        <Button variant="ghost" size="sm" onClick={clearLogo}>
                          Remove
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {brandLogos.length > 0 && (
                          <div className="space-y-2">
                            <p className="text-xs font-medium">Brand Logos</p>
                            <div className="grid grid-cols-4 gap-2">
                              {brandLogos.slice(0, 8).map((logo, idx) => (
                                <button
                                  key={idx}
                                  onClick={() => handleLogoSelect(logo.url, 'brand')}
                                  className="aspect-square border rounded-lg p-2 hover:border-primary transition-colors bg-white"
                                >
                                  <img 
                                    src={logo.url} 
                                    alt={logo.name} 
                                    className="w-full h-full object-contain"
                                  />
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="pt-2">
                          <ImageLibraryPicker
                            onSelect={(url) => handleLogoSelect(url, 'custom')}
                            trigger={
                              <Button variant="outline" size="sm" className="gap-2">
                                <Upload className="h-4 w-4" />
                                Upload Custom Logo
                              </Button>
                            }
                          />
                        </div>
                      </div>
                    )}

                    {form.logoType !== 'none' && form.errorCorrection !== 'H' && (
                      <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                        <p className="text-xs text-amber-800 dark:text-amber-300">
                          <strong>Tip:</strong> For best results with logo overlays, switch to High error correction.
                        </p>
                        <Button 
                          variant="link" 
                          size="sm" 
                          className="h-auto p-0 text-xs"
                          onClick={() => {
                            setForm(prev => ({ ...prev, errorCorrection: 'H' }));
                            setActiveTab('style');
                          }}
                        >
                          Switch to High →
                        </Button>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            {/* Right: Live Preview */}
            <div className="flex flex-col p-5 bg-muted/30 rounded-xl border">
              <div className="text-center mb-4">
                <p className="text-sm font-semibold">Live Preview</p>
                <p className="text-xs text-muted-foreground">Updates as you configure</p>
              </div>
              
              {/* QR Code Preview - always shows (uses sample URL when needed) */}
              <div className="flex flex-col items-center mb-4">
                <div 
                  className="rounded-xl p-4 shadow-sm transition-colors"
                  style={{ backgroundColor: form.bgColor }}
                >
                  <div 
                    ref={qrContainerRef}
                    className="w-[160px] h-[160px] flex items-center justify-center [&>svg]:max-w-full [&>svg]:max-h-full"
                  />
                </div>
                {/* Sample indicator when URL is not valid */}
                {!isValidUrl(form.url) && (
                  <p className="text-[10px] text-muted-foreground mt-2 italic">
                    Sample preview — enter your URL to see the actual code
                  </p>
                )}
              </div>

              {/* Live Configuration Summary */}
              <div className="space-y-2 text-xs border-t pt-3">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Name</span>
                  <span className="font-medium truncate max-w-[120px]">{form.name || '—'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">URL</span>
                  <span className="font-mono text-[10px] truncate max-w-[120px]">
                    {form.url && form.url !== 'https://' ? form.url : '—'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Size</span>
                  <span className="font-medium">{form.size}px</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Error Correction</span>
                  <span className="font-medium">{form.errorCorrection}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Dot Style</span>
                  <span className="font-medium capitalize">{form.dotStyle.replace('-', ' ')}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Corner Style</span>
                  <span className="font-medium capitalize">{form.cornerStyle.replace('-', ' ')}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Colors</span>
                  <div className="flex items-center gap-1">
                    <div 
                      className="w-4 h-4 rounded border"
                      style={{ backgroundColor: form.fgColor }}
                      title={`Foreground: ${form.fgColor}`}
                    />
                    <span className="text-muted-foreground/50">/</span>
                    <div 
                      className="w-4 h-4 rounded border"
                      style={{ backgroundColor: form.bgColor }}
                      title={`Background: ${form.bgColor}`}
                    />
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Logo</span>
                  <span className="font-medium capitalize">
                    {form.logoType === 'none' ? 'None' : form.logoType}
                  </span>
                </div>
                {form.useCase && (
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Use Case</span>
                    <span className="font-medium capitalize">{form.useCase}</span>
                  </div>
                )}
              </div>

              {/* Readiness indicator */}
              <div className="mt-4 pt-3 border-t">
                {form.name.trim() && form.url.trim() && form.url !== 'https://' ? (
                  <div className="flex items-center gap-2 text-xs text-green-600 dark:text-green-400">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    Ready to create
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <div className="w-2 h-2 rounded-full bg-muted-foreground/30" />
                    {!form.name.trim() ? 'Enter a name' : 'Enter a valid URL'}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 pt-4 border-t mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={!form.name.trim() || !form.url.trim() || isSaving}
          >
            {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {qrCode ? 'Save Changes' : 'Create QR Code'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
