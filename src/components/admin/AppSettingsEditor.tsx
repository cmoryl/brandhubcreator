import { useState, useRef } from 'react';
import { Settings, Upload, X, Save } from 'lucide-react';
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
import { useAppSettings, AppSettings } from '@/contexts/AppSettingsContext';
import { toast } from 'sonner';

export const AppSettingsEditor = () => {
  const { settings, updateSettings } = useAppSettings();
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState<AppSettings>(settings);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const handleOpen = () => {
    setFormData(settings);
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
            Customize the application branding and hero section.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* App Branding */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground">App Branding</h3>
            
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
          </div>

          {/* Hero Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Hero Section</h3>

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
          </div>
        </div>

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
