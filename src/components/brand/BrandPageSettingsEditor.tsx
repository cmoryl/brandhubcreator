import { useState, useRef } from 'react';
import { Settings, Upload, X, Sparkles, Waves, LayoutGrid, Image, Palette } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BrandPageSettings, 
  BrandBackgroundType, 
  DEFAULT_PAGE_SETTINGS 
} from '@/types/brand';
import { toast } from 'sonner';
import { HeroBackground } from '@/components/HeroBackground';
import { HeroBackgroundType } from '@/contexts/AppSettingsContext';

interface BrandPageSettingsEditorProps {
  settings: BrandPageSettings;
  onSettingsChange: (settings: BrandPageSettings) => void;
}

const backgroundTypes: { type: BrandBackgroundType; name: string; icon: typeof Image; description: string }[] = [
  { type: 'inherit', name: 'Inherit', icon: Sparkles, description: 'Use app default background' },
  { type: 'solid', name: 'Solid', icon: Palette, description: 'Solid color background' },
  { type: 'gradient', name: 'Gradient', icon: Sparkles, description: 'Static gradient background' },
  { type: 'image', name: 'Image', icon: Image, description: 'Custom background image' },
  { type: 'animated-gradient', name: 'Animated', icon: Waves, description: 'Animated gradient effect' },
  { type: 'animated-particles', name: 'Particles', icon: Sparkles, description: 'Floating particle effect' },
  { type: 'animated-waves', name: 'Waves', icon: Waves, description: 'Flowing wave animation' },
  { type: 'animated-mesh', name: 'Mesh', icon: LayoutGrid, description: 'Mesh gradient effect' },
  { type: 'animated-aurora', name: 'Aurora', icon: Waves, description: 'Northern lights effect' },
  { type: 'animated-geometric', name: 'Geometric', icon: LayoutGrid, description: 'Floating geometric shapes' },
  { type: 'animated-spotlight', name: 'Spotlight', icon: Sparkles, description: 'Moving spotlight effect' },
  { type: 'animated-mesh-waves', name: 'Mesh Lines', icon: LayoutGrid, description: 'Animated mesh wave lines' },
  { type: 'animated-dataflow', name: 'Data Flow', icon: Waves, description: 'Glowing data particle waves' },
];

const headerStyles = [
  { value: 'default', label: 'Default', description: 'Standard header with background' },
  { value: 'minimal', label: 'Minimal', description: 'Simplified header' },
  { value: 'transparent', label: 'Transparent', description: 'Transparent background' },
];

const contentWidths = [
  { value: 'default', label: 'Default', description: 'Standard content width' },
  { value: 'wide', label: 'Wide', description: 'Wider content area' },
  { value: 'full', label: 'Full', description: 'Full width content' },
];

const sectionSpacings = [
  { value: 'compact', label: 'Compact', description: 'Less spacing between sections' },
  { value: 'default', label: 'Default', description: 'Standard spacing' },
  { value: 'spacious', label: 'Spacious', description: 'More spacing between sections' },
];

export const BrandPageSettingsEditor = ({ settings, onSettingsChange }: BrandPageSettingsEditorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState<BrandPageSettings>(settings || DEFAULT_PAGE_SETTINGS);
  const bgImageInputRef = useRef<HTMLInputElement>(null);

  const handleOpen = () => {
    setFormData(settings || DEFAULT_PAGE_SETTINGS);
    setIsOpen(true);
  };

  const handleSave = () => {
    onSettingsChange(formData);
    setIsOpen(false);
    toast.success('Brand page settings updated!');
  };

  const handleReset = () => {
    setFormData(DEFAULT_PAGE_SETTINGS);
    toast.success('Settings reset to defaults');
  };

  const handleBgImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ 
          ...prev, 
          backgroundImage: reader.result as string,
          backgroundType: 'image'
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const removeBgImage = () => {
    setFormData(prev => ({ 
      ...prev, 
      backgroundImage: '',
      backgroundType: 'inherit'
    }));
  };

  // Convert brand background type to hero background type for preview
  const getPreviewType = (): HeroBackgroundType | undefined => {
    if (formData.backgroundType === 'inherit' || formData.backgroundType === 'solid') {
      return undefined;
    }
    return formData.backgroundType as HeroBackgroundType;
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" onClick={handleOpen} className="gap-2">
          <Settings className="h-4 w-4" />
          Page Settings
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Brand Page Settings</DialogTitle>
          <DialogDescription>
            Customize how this brand page looks and behaves. These settings are specific to this brand.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="background" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="background">Background</TabsTrigger>
            <TabsTrigger value="layout">Layout</TabsTrigger>
            <TabsTrigger value="style">Style</TabsTrigger>
          </TabsList>

          <TabsContent value="background" className="space-y-4 py-4">
            {/* Background Preview */}
            <div className="relative h-32 rounded-lg overflow-hidden border border-border">
              {formData.backgroundType === 'solid' ? (
                <div 
                  className="absolute inset-0" 
                  style={{ backgroundColor: formData.backgroundColor || 'hsl(var(--background))' }}
                />
              ) : formData.backgroundType === 'inherit' ? (
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-accent/5 to-background flex items-center justify-center">
                  <span className="text-xs text-muted-foreground">Using app default</span>
                </div>
              ) : (
                <HeroBackground 
                  type={getPreviewType()} 
                  image={formData.backgroundImage}
                  animationSpeed={formData.animationSpeed}
                  tintColor={formData.animationTintColor || undefined}
                />
              )}
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs font-medium bg-background/80 px-2 py-1 rounded">
                  Preview
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <Label>Background Type</Label>
              <div className="grid grid-cols-4 gap-2">
                {backgroundTypes.map((bg) => (
                  <button
                    key={bg.type}
                    onClick={() => setFormData(prev => ({ ...prev, backgroundType: bg.type }))}
                    className={`flex flex-col items-center gap-1 p-2 rounded-lg border-2 transition-colors ${
                      formData.backgroundType === bg.type
                        ? 'border-accent bg-accent/10'
                        : 'border-border hover:border-accent/50'
                    }`}
                  >
                    <bg.icon className={`h-4 w-4 ${
                      formData.backgroundType === bg.type ? 'text-accent' : 'text-muted-foreground'
                    }`} />
                    <span className="text-xs font-medium">{bg.name}</span>
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                {backgroundTypes.find(bg => bg.type === formData.backgroundType)?.description}
              </p>
            </div>

            {formData.backgroundType === 'solid' && (
              <div className="space-y-2">
                <Label>Background Color</Label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={formData.backgroundColor || '#ffffff'}
                    onChange={(e) => setFormData(prev => ({ ...prev, backgroundColor: e.target.value }))}
                    className="w-10 h-10 rounded border cursor-pointer"
                  />
                  <Input
                    value={formData.backgroundColor || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, backgroundColor: e.target.value }))}
                    placeholder="#ffffff"
                    className="flex-1"
                  />
                </div>
              </div>
            )}

            {formData.backgroundType === 'image' && (
              <div className="space-y-3">
                <Label>Background Image</Label>
                {formData.backgroundImage ? (
                  <div className="relative rounded-lg overflow-hidden border border-border">
                    <img
                      src={formData.backgroundImage}
                      alt="Background"
                      className="w-full h-24 object-cover"
                    />
                    <button
                      onClick={removeBgImage}
                      className="absolute top-2 right-2 p-1.5 bg-destructive text-destructive-foreground rounded-full shadow-lg"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div className="h-24 rounded-lg border-2 border-dashed border-muted-foreground/30 flex items-center justify-center">
                    <span className="text-sm text-muted-foreground">No image selected</span>
                  </div>
                )}
                <input
                  ref={bgImageInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleBgImageUpload}
                />
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => bgImageInputRef.current?.click()}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Background Image
                </Button>
              </div>
            )}

            {!['inherit', 'solid', 'gradient', 'image'].includes(formData.backgroundType) && (
              <>
                <div className="space-y-3">
                  <Label>Animation Speed</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['slow', 'medium', 'fast'] as const).map((speed) => (
                      <button
                        key={speed}
                        onClick={() => setFormData(prev => ({ ...prev, animationSpeed: speed }))}
                        className={`py-2 px-3 rounded-lg border-2 text-sm font-medium capitalize transition-colors ${
                          formData.animationSpeed === speed
                            ? 'border-accent bg-accent/10 text-accent'
                            : 'border-border hover:border-accent/50'
                        }`}
                      >
                        {speed}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Animation Color Tint</Label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={formData.animationTintColor || '#00b4d8'}
                      onChange={(e) => setFormData(prev => ({ ...prev, animationTintColor: e.target.value }))}
                      className="w-10 h-10 rounded border cursor-pointer"
                    />
                    <Input
                      value={formData.animationTintColor || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, animationTintColor: e.target.value }))}
                      placeholder="Leave empty for default accent"
                      className="flex-1"
                    />
                    {formData.animationTintColor && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setFormData(prev => ({ ...prev, animationTintColor: '' }))}
                      >
                        Reset
                      </Button>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Customize the glow and particle colors in animated backgrounds
                  </p>
                  {/* Color preset swatches */}
                  <div className="flex flex-wrap gap-2 mt-2">
                    {[
                      { color: '#00b4d8', name: 'Cyan' },
                      { color: '#6366f1', name: 'Indigo' },
                      { color: '#8b5cf6', name: 'Purple' },
                      { color: '#ec4899', name: 'Pink' },
                      { color: '#10b981', name: 'Emerald' },
                      { color: '#f59e0b', name: 'Amber' },
                      { color: '#ef4444', name: 'Red' },
                      { color: '#3b82f6', name: 'Blue' },
                    ].map((preset) => (
                      <button
                        key={preset.color}
                        onClick={() => setFormData(prev => ({ ...prev, animationTintColor: preset.color }))}
                        className={`w-8 h-8 rounded-full border-2 transition-all ${
                          formData.animationTintColor === preset.color 
                            ? 'border-foreground scale-110' 
                            : 'border-transparent hover:scale-105'
                        }`}
                        style={{ backgroundColor: preset.color }}
                        title={preset.name}
                      />
                    ))}
                  </div>
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label>Custom Accent Color (Optional)</Label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={formData.accentColor || '#ff6b35'}
                  onChange={(e) => setFormData(prev => ({ ...prev, accentColor: e.target.value }))}
                  className="w-10 h-10 rounded border cursor-pointer"
                />
                <Input
                  value={formData.accentColor || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, accentColor: e.target.value }))}
                  placeholder="Leave empty for default"
                  className="flex-1"
                />
                {formData.accentColor && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setFormData(prev => ({ ...prev, accentColor: '' }))}
                  >
                    Reset
                  </Button>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Override the app's accent color for this brand page
              </p>
            </div>
          </TabsContent>

          <TabsContent value="layout" className="space-y-4 py-4">
            <div className="flex items-center justify-between p-3 rounded-lg border border-border">
              <div className="space-y-0.5">
                <Label>Full Width Hero</Label>
                <p className="text-xs text-muted-foreground">Expand hero section to full page width</p>
              </div>
              <Switch
                checked={formData.heroFullWidth ?? false}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, heroFullWidth: checked }))}
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border border-border">
              <div className="space-y-0.5">
                <Label>Show Header</Label>
                <p className="text-xs text-muted-foreground">Display the page header</p>
              </div>
              <Switch
                checked={formData.showHeader}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, showHeader: checked }))}
              />
            </div>

            {formData.showHeader && (
              <div className="space-y-3">
                <Label>Header Style</Label>
                <div className="grid grid-cols-3 gap-2">
                  {headerStyles.map((style) => (
                    <button
                      key={style.value}
                      onClick={() => setFormData(prev => ({ ...prev, headerStyle: style.value as any }))}
                      className={`p-3 rounded-lg border-2 transition-colors text-left ${
                        formData.headerStyle === style.value
                          ? 'border-accent bg-accent/10'
                          : 'border-border hover:border-accent/50'
                      }`}
                    >
                      <span className="text-sm font-medium block">{style.label}</span>
                      <span className="text-xs text-muted-foreground">{style.description}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-3">
              <Label>Content Width</Label>
              <div className="grid grid-cols-3 gap-2">
                {contentWidths.map((width) => (
                  <button
                    key={width.value}
                    onClick={() => setFormData(prev => ({ ...prev, contentWidth: width.value as any }))}
                    className={`p-3 rounded-lg border-2 transition-colors text-left ${
                      formData.contentWidth === width.value
                        ? 'border-accent bg-accent/10'
                        : 'border-border hover:border-accent/50'
                    }`}
                  >
                    <span className="text-sm font-medium block">{width.label}</span>
                    <span className="text-xs text-muted-foreground">{width.description}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <Label>Section Spacing</Label>
              <div className="grid grid-cols-3 gap-2">
                {sectionSpacings.map((spacing) => (
                  <button
                    key={spacing.value}
                    onClick={() => setFormData(prev => ({ ...prev, sectionSpacing: spacing.value as any }))}
                    className={`p-3 rounded-lg border-2 transition-colors text-left ${
                      formData.sectionSpacing === spacing.value
                        ? 'border-accent bg-accent/10'
                        : 'border-border hover:border-accent/50'
                    }`}
                  >
                    <span className="text-sm font-medium block">{spacing.label}</span>
                    <span className="text-xs text-muted-foreground">{spacing.description}</span>
                  </button>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="style" className="space-y-4 py-4">
            <div className="p-4 rounded-lg border border-border bg-muted/50">
              <h4 className="font-medium mb-2">Style Presets</h4>
              <p className="text-sm text-muted-foreground mb-4">
                Quick apply common style combinations
              </p>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  className="h-auto py-3 flex flex-col items-start"
                  onClick={() => setFormData(prev => ({
                    ...prev,
                    backgroundType: 'animated-aurora',
                    headerStyle: 'transparent',
                    contentWidth: 'wide',
                    sectionSpacing: 'spacious',
                  }))}
                >
                  <span className="font-medium">Modern & Bold</span>
                  <span className="text-xs text-muted-foreground">Aurora, wide, spacious</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-auto py-3 flex flex-col items-start"
                  onClick={() => setFormData(prev => ({
                    ...prev,
                    backgroundType: 'gradient',
                    headerStyle: 'default',
                    contentWidth: 'default',
                    sectionSpacing: 'default',
                  }))}
                >
                  <span className="font-medium">Clean & Classic</span>
                  <span className="text-xs text-muted-foreground">Gradient, standard layout</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-auto py-3 flex flex-col items-start"
                  onClick={() => setFormData(prev => ({
                    ...prev,
                    backgroundType: 'animated-geometric',
                    headerStyle: 'minimal',
                    contentWidth: 'full',
                    sectionSpacing: 'compact',
                  }))}
                >
                  <span className="font-medium">Tech & Minimal</span>
                  <span className="text-xs text-muted-foreground">Geometric, full width, compact</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-auto py-3 flex flex-col items-start"
                  onClick={() => setFormData(prev => ({
                    ...prev,
                    backgroundType: 'animated-mesh',
                    headerStyle: 'transparent',
                    contentWidth: 'wide',
                    sectionSpacing: 'default',
                  }))}
                >
                  <span className="font-medium">Soft & Elegant</span>
                  <span className="text-xs text-muted-foreground">Mesh gradient, elegant feel</span>
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              <Label>Default Theme Mode</Label>
              <p className="text-xs text-muted-foreground mb-2">
                Set a default theme for this brand page. Users can still toggle, but it will default to this.
              </p>
              <div className="grid grid-cols-3 gap-2">
                {([
                  { value: 'system', label: 'System', description: 'Follow user preference' },
                  { value: 'light', label: 'Light', description: 'Light mode default' },
                  { value: 'dark', label: 'Dark', description: 'Dark mode default' },
                ] as const).map((mode) => (
                  <button
                    key={mode.value}
                    onClick={() => setFormData(prev => ({ ...prev, defaultTheme: mode.value }))}
                    className={`p-3 rounded-lg border-2 transition-colors text-left ${
                      (formData.defaultTheme ?? 'system') === mode.value
                        ? 'border-accent bg-accent/10'
                        : 'border-border hover:border-accent/50'
                    }`}
                  >
                    <span className="text-sm font-medium block">{mode.label}</span>
                    <span className="text-xs text-muted-foreground">{mode.description}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Primary Color */}
            <div className="space-y-2">
              <Label>Custom Primary Color (Optional)</Label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={formData.customPrimaryColor || '#1a1a2e'}
                  onChange={(e) => setFormData(prev => ({ ...prev, customPrimaryColor: e.target.value }))}
                  className="w-10 h-10 rounded border cursor-pointer"
                />
                <Input
                  value={formData.customPrimaryColor || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, customPrimaryColor: e.target.value }))}
                  placeholder="Leave empty for default"
                  className="flex-1"
                />
                {formData.customPrimaryColor && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setFormData(prev => ({ ...prev, customPrimaryColor: '' }))}
                  >
                    Reset
                  </Button>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Override the primary color (text, buttons) for this brand
              </p>
            </div>

            {/* Custom Secondary Color */}
            <div className="space-y-2">
              <Label>Custom Secondary Color (Optional)</Label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={formData.customSecondaryColor || '#2d2d44'}
                  onChange={(e) => setFormData(prev => ({ ...prev, customSecondaryColor: e.target.value }))}
                  className="w-10 h-10 rounded border cursor-pointer"
                />
                <Input
                  value={formData.customSecondaryColor || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, customSecondaryColor: e.target.value }))}
                  placeholder="Leave empty for default"
                  className="flex-1"
                />
                {formData.customSecondaryColor && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setFormData(prev => ({ ...prev, customSecondaryColor: '' }))}
                  >
                    Reset
                  </Button>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Override the secondary color (backgrounds, cards) for this brand
              </p>
            </div>

            <div className="p-4 rounded-lg border border-dashed border-accent/50 bg-accent/5">
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-accent" />
                Pro Tip
              </h4>
              <p className="text-sm text-muted-foreground">
                Each brand can have its own unique look and feel. Use background animations 
                that complement your brand's personality - subtle waves for calm brands, 
                geometric patterns for tech-focused brands.
              </p>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={handleReset}>
            Reset to Defaults
          </Button>
          <Button onClick={handleSave}>
            Save Settings
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};