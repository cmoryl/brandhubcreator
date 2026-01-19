import { useState, useRef } from 'react';
import { Settings, Upload, X, Save, RotateCcw, Image, Sparkles, Waves, LayoutGrid } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
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
  useAppSettings, 
  AppSettings, 
  hexToHSL, 
  hslToHex,
  HeroBackgroundType 
} from '@/contexts/AppSettingsContext';
import { toast } from 'sonner';

const colorPresets = [
  { name: 'Coral', accent: '12 76% 61%' },
  { name: 'Ocean', accent: '199 89% 48%' },
  { name: 'Forest', accent: '142 71% 45%' },
  { name: 'Purple', accent: '262 83% 58%' },
  { name: 'Gold', accent: '45 93% 47%' },
  { name: 'Rose', accent: '346 77% 50%' },
  { name: 'Slate', accent: '215 16% 47%' },
  { name: 'Teal', accent: '175 60% 40%' },
];

const backgroundTypes: { type: HeroBackgroundType; name: string; icon: typeof Image; description: string }[] = [
  { type: 'gradient', name: 'Gradient', icon: Sparkles, description: 'Static gradient background' },
  { type: 'image', name: 'Image', icon: Image, description: 'Custom background image' },
  { type: 'animated-gradient', name: 'Animated', icon: Waves, description: 'Animated gradient effect' },
  { type: 'animated-particles', name: 'Particles', icon: Sparkles, description: 'Floating particle effect' },
  { type: 'animated-waves', name: 'Waves', icon: Waves, description: 'Flowing wave animation' },
  { type: 'animated-mesh', name: 'Mesh', icon: LayoutGrid, description: 'Mesh gradient effect' },
  { type: 'animated-aurora', name: 'Aurora', icon: Waves, description: 'Northern lights effect' },
  { type: 'animated-geometric', name: 'Geometric', icon: LayoutGrid, description: 'Floating geometric shapes' },
  { type: 'animated-spotlight', name: 'Spotlight', icon: Sparkles, description: 'Moving spotlight effect' },
];

export const AppSettingsEditor = () => {
  const { settings, updateSettings, resetColors } = useAppSettings();
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState<AppSettings>(settings);
  const [accentHex, setAccentHex] = useState(hslToHex(settings.colors.accent));
  const logoLightInputRef = useRef<HTMLInputElement>(null);
  const logoDarkInputRef = useRef<HTMLInputElement>(null);
  const bgImageInputRef = useRef<HTMLInputElement>(null);

  const handleOpen = () => {
    setFormData(settings);
    setAccentHex(hslToHex(settings.colors.accent));
    setIsOpen(true);
  };

  const handleSave = () => {
    updateSettings(formData);
    setIsOpen(false);
    toast.success('App settings updated successfully!');
  };

  const handleLogoLightUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, appLogoLight: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLogoDarkUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, appLogoDark: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBgImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ 
          ...prev, 
          heroBackground: { 
            ...prev.heroBackground, 
            image: reader.result as string,
            type: 'image'
          } 
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const removeLogoLight = () => {
    setFormData(prev => ({ ...prev, appLogoLight: '' }));
  };

  const removeLogoDark = () => {
    setFormData(prev => ({ ...prev, appLogoDark: '' }));
  };

  const removeBgImage = () => {
    setFormData(prev => ({ 
      ...prev, 
      heroBackground: { ...prev.heroBackground, image: '', type: 'gradient' } 
    }));
  };

  const handleAccentColorChange = (hex: string) => {
    setAccentHex(hex);
    const hsl = hexToHSL(hex);
    setFormData(prev => ({
      ...prev,
      colors: { ...prev.colors, accent: hsl }
    }));
  };

  const applyPreset = (accentHsl: string) => {
    setAccentHex(hslToHex(accentHsl));
    setFormData(prev => ({
      ...prev,
      colors: { ...prev.colors, accent: accentHsl }
    }));
  };

  const handleResetColors = () => {
    resetColors();
    setAccentHex(hslToHex('12 76% 61%'));
    setFormData(prev => ({
      ...prev,
      colors: {
        accent: '12 76% 61%',
        accentForeground: '0 0% 100%',
        primary: '220 15% 20%',
        primaryForeground: '40 20% 98%',
      }
    }));
    toast.success('Colors reset to defaults!');
  };

  const setBackgroundType = (type: HeroBackgroundType) => {
    setFormData(prev => ({
      ...prev,
      heroBackground: { ...prev.heroBackground, type }
    }));
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" onClick={handleOpen} title="App Settings">
          <Settings className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>App Settings</DialogTitle>
          <DialogDescription>
            Customize the application branding, hero section, and theme colors.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="branding" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="branding">Branding</TabsTrigger>
            <TabsTrigger value="hero">Hero</TabsTrigger>
            <TabsTrigger value="sections">Sections</TabsTrigger>
            <TabsTrigger value="background">Background</TabsTrigger>
            <TabsTrigger value="colors">Colors</TabsTrigger>
          </TabsList>

          <TabsContent value="branding" className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="appName">App Name</Label>
              <Input
                id="appName"
                value={formData.appName}
                onChange={(e) => setFormData(prev => ({ ...prev, appName: e.target.value }))}
                placeholder="Enter app name..."
              />
            </div>

            <div className="space-y-4">
              <Label>App Logos</Label>
              <p className="text-xs text-muted-foreground">
                Upload separate logos for light and dark themes. The appropriate logo will display based on the current theme.
              </p>
              
              {/* Light Mode Logo */}
              <div className="p-3 rounded-lg border border-border bg-white">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-900">Light Mode Logo</span>
                </div>
                <div className="flex items-center gap-3">
                  {formData.appLogoLight ? (
                    <div className="relative">
                      <img
                        src={formData.appLogoLight}
                        alt="Light Mode Logo"
                        className="h-10 w-auto rounded border bg-white p-1"
                      />
                      <button
                        onClick={removeLogoLight}
                        className="absolute -top-2 -right-2 p-1 bg-destructive text-destructive-foreground rounded-full"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="h-10 w-10 rounded border-2 border-dashed border-gray-300 flex items-center justify-center">
                      <span className="text-xs text-gray-400">None</span>
                    </div>
                  )}
                  <input
                    ref={logoLightInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleLogoLightUpload}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => logoLightInputRef.current?.click()}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload
                  </Button>
                </div>
              </div>

              {/* Dark Mode Logo */}
              <div className="p-3 rounded-lg border border-border bg-gray-900">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-white">Dark Mode Logo</span>
                </div>
                <div className="flex items-center gap-3">
                  {formData.appLogoDark ? (
                    <div className="relative">
                      <img
                        src={formData.appLogoDark}
                        alt="Dark Mode Logo"
                        className="h-10 w-auto rounded border border-gray-700 bg-gray-900 p-1"
                      />
                      <button
                        onClick={removeLogoDark}
                        className="absolute -top-2 -right-2 p-1 bg-destructive text-destructive-foreground rounded-full"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="h-10 w-10 rounded border-2 border-dashed border-gray-600 flex items-center justify-center">
                      <span className="text-xs text-gray-500">None</span>
                    </div>
                  )}
                  <input
                    ref={logoDarkInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleLogoDarkUpload}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => logoDarkInputRef.current?.click()}
                    className="border-gray-600 text-gray-300 hover:bg-gray-800"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="hero" className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="heroBadgeText">Badge Text</Label>
              <Input
                id="heroBadgeText"
                value={formData.heroBadgeText}
                onChange={(e) => setFormData(prev => ({ ...prev, heroBadgeText: e.target.value }))}
                placeholder="e.g., Brand Identity Platform"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="heroTitle">Hero Title (Line 1)</Label>
              <Input
                id="heroTitle"
                value={formData.heroTitle}
                onChange={(e) => setFormData(prev => ({ ...prev, heroTitle: e.target.value }))}
                placeholder="e.g., Create stunning"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="heroHighlight">Hero Highlight (Line 2)</Label>
              <Input
                id="heroHighlight"
                value={formData.heroHighlight}
                onChange={(e) => setFormData(prev => ({ ...prev, heroHighlight: e.target.value }))}
                placeholder="e.g., brand guides"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="heroDescription">Hero Description</Label>
              <Textarea
                id="heroDescription"
                value={formData.heroDescription}
                onChange={(e) => setFormData(prev => ({ ...prev, heroDescription: e.target.value }))}
                placeholder="Enter hero description..."
                rows={3}
              />
            </div>
          </TabsContent>

          <TabsContent value="sections" className="space-y-4 py-4">
            <div className="space-y-1 mb-4">
              <p className="text-sm font-medium">Homepage Sections</p>
              <p className="text-xs text-muted-foreground">
                Toggle which sections are visible on the public homepage.
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg border border-border">
                <div className="space-y-0.5">
                  <p className="text-sm font-medium">Demo Brands Showcase</p>
                  <p className="text-xs text-muted-foreground">Featured brand examples for visitors</p>
                </div>
                <Switch
                  checked={formData.pageSections?.demoBrands ?? true}
                  onCheckedChange={(checked) => setFormData(prev => ({
                    ...prev,
                    pageSections: { ...prev.pageSections, demoBrands: checked }
                  }))}
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border border-border">
                <div className="space-y-0.5">
                  <p className="text-sm font-medium">What We Offer</p>
                  <p className="text-xs text-muted-foreground">Services banner with 4 feature cards</p>
                </div>
                <Switch
                  checked={formData.pageSections?.services ?? true}
                  onCheckedChange={(checked) => setFormData(prev => ({
                    ...prev,
                    pageSections: { ...prev.pageSections, services: checked }
                  }))}
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border border-border">
                <div className="space-y-0.5">
                  <p className="text-sm font-medium">Features Section</p>
                  <p className="text-xs text-muted-foreground">Color Systems, Typography, Logo & Assets, Easy Sharing</p>
                </div>
                <Switch
                  checked={formData.pageSections?.features ?? true}
                  onCheckedChange={(checked) => setFormData(prev => ({
                    ...prev,
                    pageSections: { ...prev.pageSections, features: checked }
                  }))}
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border border-border">
                <div className="space-y-0.5">
                  <p className="text-sm font-medium">How It Works</p>
                  <p className="text-xs text-muted-foreground">3-step guide: Create, Add Elements, Share</p>
                </div>
                <Switch
                  checked={formData.pageSections?.howItWorks ?? true}
                  onCheckedChange={(checked) => setFormData(prev => ({
                    ...prev,
                    pageSections: { ...prev.pageSections, howItWorks: checked }
                  }))}
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border border-border">
                <div className="space-y-0.5">
                  <p className="text-sm font-medium">FAQ Preview</p>
                  <p className="text-xs text-muted-foreground">Top questions with link to full Knowledge Base</p>
                </div>
                <Switch
                  checked={formData.pageSections?.faqPreview ?? true}
                  onCheckedChange={(checked) => setFormData(prev => ({
                    ...prev,
                    pageSections: { ...prev.pageSections, faqPreview: checked }
                  }))}
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border border-border">
                <div className="space-y-0.5">
                  <p className="text-sm font-medium">Video Tutorials</p>
                  <p className="text-xs text-muted-foreground">Tutorial videos on Knowledge Base page</p>
                </div>
                <Switch
                  checked={formData.pageSections?.videoTutorials ?? false}
                  onCheckedChange={(checked) => setFormData(prev => ({
                    ...prev,
                    pageSections: { ...prev.pageSections, videoTutorials: checked }
                  }))}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="background" className="space-y-4 py-4">
            <div className="space-y-3">
              <Label>Background Type</Label>
              <div className="grid grid-cols-3 gap-2">
                {backgroundTypes.map((bg) => (
                  <button
                    key={bg.type}
                    onClick={() => setBackgroundType(bg.type)}
                    className={`flex flex-col items-center gap-1.5 p-2.5 rounded-lg border-2 transition-colors ${
                      formData.heroBackground.type === bg.type
                        ? 'border-accent bg-accent/10'
                        : 'border-border hover:border-accent/50'
                    }`}
                  >
                    <bg.icon className={`h-4 w-4 ${
                      formData.heroBackground.type === bg.type ? 'text-accent' : 'text-muted-foreground'
                    }`} />
                    <span className="text-xs font-medium">{bg.name}</span>
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {backgroundTypes.find(bg => bg.type === formData.heroBackground.type)?.description}
              </p>
            </div>

            {formData.heroBackground.type === 'image' && (
              <div className="space-y-3">
                <Label>Background Image</Label>
                <div className="space-y-3">
                  {formData.heroBackground.image ? (
                    <div className="relative rounded-lg overflow-hidden border border-border">
                      <img
                        src={formData.heroBackground.image}
                        alt="Background"
                        className="w-full h-32 object-cover"
                      />
                      <button
                        onClick={removeBgImage}
                        className="absolute top-2 right-2 p-1.5 bg-destructive text-destructive-foreground rounded-full shadow-lg"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="h-32 rounded-lg border-2 border-dashed border-muted-foreground/30 flex items-center justify-center">
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
              </div>
            )}

            {(formData.heroBackground.type === 'animated-gradient' || 
              formData.heroBackground.type === 'animated-particles') && (
              <div className="space-y-3">
                <Label>Animation Speed</Label>
                <div className="grid grid-cols-3 gap-2">
                  {(['slow', 'medium', 'fast'] as const).map((speed) => (
                    <button
                      key={speed}
                      onClick={() => setFormData(prev => ({
                        ...prev,
                        heroBackground: { ...prev.heroBackground, animationSpeed: speed }
                      }))}
                      className={`py-2 px-3 rounded-lg border-2 text-sm font-medium capitalize transition-colors ${
                        formData.heroBackground.animationSpeed === speed
                          ? 'border-accent bg-accent/10 text-accent'
                          : 'border-border hover:border-accent/50'
                      }`}
                    >
                      {speed}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {formData.heroBackground.type === 'image' && (
              <>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Overlay</Label>
                    <p className="text-xs text-muted-foreground">Add a dark overlay for better text readability</p>
                  </div>
                  <Switch
                    checked={formData.heroBackground.overlay}
                    onCheckedChange={(checked) => setFormData(prev => ({
                      ...prev,
                      heroBackground: { ...prev.heroBackground, overlay: checked }
                    }))}
                  />
                </div>

                {formData.heroBackground.overlay && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Overlay Opacity</Label>
                      <span className="text-sm text-muted-foreground">
                        {Math.round(formData.heroBackground.overlayOpacity * 100)}%
                      </span>
                    </div>
                    <Slider
                      value={[formData.heroBackground.overlayOpacity]}
                      onValueChange={([value]) => setFormData(prev => ({
                        ...prev,
                        heroBackground: { ...prev.heroBackground, overlayOpacity: value }
                      }))}
                      min={0}
                      max={1}
                      step={0.05}
                      className="w-full"
                    />
                  </div>
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="colors" className="space-y-4 py-4">
            <div className="space-y-3">
              <Label>Color Presets</Label>
              <div className="grid grid-cols-4 gap-2">
                {colorPresets.map((preset) => (
                  <button
                    key={preset.name}
                    onClick={() => applyPreset(preset.accent)}
                    className="flex flex-col items-center gap-1 p-2 rounded-lg border border-border hover:border-accent transition-colors"
                  >
                    <div 
                      className="w-8 h-8 rounded-full border-2 border-white shadow-sm"
                      style={{ backgroundColor: `hsl(${preset.accent})` }}
                    />
                    <span className="text-xs text-muted-foreground">{preset.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="accentColor">Custom Accent Color</Label>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <input
                    type="color"
                    id="accentColor"
                    value={accentHex}
                    onChange={(e) => handleAccentColorChange(e.target.value)}
                    className="w-12 h-12 rounded-lg cursor-pointer border-2 border-border"
                  />
                </div>
                <div className="flex-1">
                  <Input
                    value={accentHex}
                    onChange={(e) => handleAccentColorChange(e.target.value)}
                    placeholder="#E96D4A"
                    className="font-mono"
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                This color is used for highlights, buttons, and accents throughout the app.
              </p>
            </div>

            <div className="pt-4 border-t border-border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Preview</p>
                  <p className="text-xs text-muted-foreground">See how your colors look</p>
                </div>
                <Button variant="outline" size="sm" onClick={handleResetColors}>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset
                </Button>
              </div>
              <div className="mt-3 p-4 rounded-lg border border-border bg-card">
                <div className="flex items-center gap-3 mb-3">
                  <div 
                    className="w-10 h-10 rounded-lg"
                    style={{ backgroundColor: `hsl(${formData.colors.accent})` }}
                  />
                  <div>
                    <p className="font-medium" style={{ color: `hsl(${formData.colors.accent})` }}>
                      Accent Color
                    </p>
                    <p className="text-xs text-muted-foreground">HSL: {formData.colors.accent}</p>
                  </div>
                </div>
                <Button 
                  size="sm"
                  style={{ 
                    backgroundColor: `hsl(${formData.colors.accent})`,
                    color: `hsl(${formData.colors.accentForeground})`
                  }}
                >
                  Sample Button
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
      </Dialog>
    </>
  );
};
