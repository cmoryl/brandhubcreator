import { useState, useRef } from 'react';
import { Settings, Upload, X, Save, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { useAppSettings, AppSettings, hexToHSL, hslToHex } from '@/contexts/AppSettingsContext';
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

export const AppSettingsEditor = () => {
  const { settings, updateSettings, resetColors } = useAppSettings();
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState<AppSettings>(settings);
  const [accentHex, setAccentHex] = useState(hslToHex(settings.colors.accent));
  const logoInputRef = useRef<HTMLInputElement>(null);

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

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, appLogo: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const removeLogo = () => {
    setFormData(prev => ({ ...prev, appLogo: '' }));
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

  return (
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
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="branding">Branding</TabsTrigger>
            <TabsTrigger value="hero">Hero</TabsTrigger>
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

            <div className="space-y-2">
              <Label>App Logo</Label>
              <div className="flex items-center gap-3">
                {formData.appLogo ? (
                  <div className="relative">
                    <img
                      src={formData.appLogo}
                      alt="App Logo"
                      className="h-12 w-auto rounded border bg-white p-1"
                    />
                    <button
                      onClick={removeLogo}
                      className="absolute -top-2 -right-2 p-1 bg-destructive text-destructive-foreground rounded-full"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <div className="h-12 w-12 rounded border-2 border-dashed border-muted-foreground/30 flex items-center justify-center">
                    <span className="text-xs text-muted-foreground">No logo</span>
                  </div>
                )}
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleLogoUpload}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => logoInputRef.current?.click()}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Logo
                </Button>
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
  );
};
