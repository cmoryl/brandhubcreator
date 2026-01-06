import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useOrganization } from '@/contexts/OrganizationContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Building2, Upload, Loader2, Palette, Globe, Eye, EyeOff, Trash2 } from 'lucide-react';

const OrganizationSettings = () => {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const { organization, userRole, updateOrganization, isLoading: orgLoading } = useOrganization();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(organization?.name || '');
  const [slug, setSlug] = useState(organization?.slug || '');
  const [customDomain, setCustomDomain] = useState(organization?.customDomain || '');
  const [primaryColor, setPrimaryColor] = useState(organization?.primaryColor || '#6366f1');
  const [secondaryColor, setSecondaryColor] = useState(organization?.secondaryColor || '#8b5cf6');
  const [accentColor, setAccentColor] = useState(organization?.accentColor || '#f59e0b');
  const [hidePlatformBranding, setHidePlatformBranding] = useState(organization?.hidePlatformBranding || false);
  const [logoUrl, setLogoUrl] = useState(organization?.logoUrl || '');
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Update local state when organization loads
  useState(() => {
    if (organization) {
      setName(organization.name);
      setSlug(organization.slug);
      setCustomDomain(organization.customDomain || '');
      setPrimaryColor(organization.primaryColor || '#6366f1');
      setSecondaryColor(organization.secondaryColor || '#8b5cf6');
      setAccentColor(organization.accentColor || '#f59e0b');
      setHidePlatformBranding(organization.hidePlatformBranding || false);
      setLogoUrl(organization.logoUrl || '');
    }
  });

  const canEdit = userRole === 'owner' || userRole === 'admin';

  // Redirect if not authenticated or no organization
  if (!authLoading && !user) {
    navigate('/auth');
    return null;
  }

  if (!orgLoading && !organization) {
    navigate('/');
    return null;
  }

  if (!orgLoading && !canEdit) {
    toast({
      title: 'Access Denied',
      description: 'Only owners and admins can access organization settings.',
      variant: 'destructive',
    });
    navigate('/');
    return null;
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !organization) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload an image file.',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Please upload an image smaller than 2MB.',
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${organization.id}/logo.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('organization-assets')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('organization-assets')
        .getPublicUrl(fileName);

      setLogoUrl(publicUrl);
      toast({
        title: 'Logo uploaded',
        description: 'Your organization logo has been uploaded.',
      });
    } catch (error: any) {
      console.error('Error uploading logo:', error);
      toast({
        title: 'Upload failed',
        description: error.message || 'Failed to upload logo.',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveLogo = async () => {
    if (!organization) return;

    setIsUploading(true);
    try {
      // List and remove files in the org folder
      const { data: files } = await supabase.storage
        .from('organization-assets')
        .list(organization.id);

      if (files && files.length > 0) {
        const filesToRemove = files.map(f => `${organization.id}/${f.name}`);
        await supabase.storage
          .from('organization-assets')
          .remove(filesToRemove);
      }

      setLogoUrl('');
      toast({
        title: 'Logo removed',
        description: 'Your organization logo has been removed.',
      });
    } catch (error: any) {
      console.error('Error removing logo:', error);
      toast({
        title: 'Removal failed',
        description: error.message || 'Failed to remove logo.',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    if (!organization) return;

    // Validate inputs
    if (!name.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Organization name is required.',
        variant: 'destructive',
      });
      return;
    }

    if (!slug.trim() || slug.length < 2) {
      toast({
        title: 'Validation Error',
        description: 'Slug must be at least 2 characters.',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    try {
      await updateOrganization({
        name: name.trim(),
        slug: slug.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
        customDomain: customDomain.trim() || null,
        primaryColor,
        secondaryColor,
        accentColor,
        hidePlatformBranding,
        logoUrl: logoUrl || null,
      });

      toast({
        title: 'Settings saved',
        description: 'Your organization settings have been updated.',
      });
    } catch (error: any) {
      console.error('Error saving settings:', error);
      toast({
        title: 'Save failed',
        description: error.message || 'Failed to save settings.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (authLoading || orgLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-background/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-xl">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="font-semibold text-lg">Organization Settings</h1>
              <p className="text-sm text-muted-foreground">{organization?.name}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* General Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              General
            </CardTitle>
            <CardDescription>Basic organization information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Organization Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Acme Inc."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">Workspace URL</Label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-muted text-muted-foreground text-sm">
                    brandhub.app/org/
                  </span>
                  <Input
                    id="slug"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                    className="rounded-l-none"
                    placeholder="acme"
                  />
                </div>
              </div>
            </div>

            {/* Logo Upload */}
            <div className="space-y-2">
              <Label>Organization Logo</Label>
              <div className="flex items-center gap-4">
                {logoUrl ? (
                  <div className="relative">
                    <img
                      src={logoUrl}
                      alt="Organization logo"
                      className="h-16 w-16 rounded-lg object-cover border border-border"
                    />
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute -top-2 -right-2 h-6 w-6"
                      onClick={handleRemoveLogo}
                      disabled={isUploading}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <div className="h-16 w-16 rounded-lg border-2 border-dashed border-border flex items-center justify-center bg-muted/50">
                    <Building2 className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="gap-2"
                  >
                    {isUploading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4" />
                    )}
                    {logoUrl ? 'Change Logo' : 'Upload Logo'}
                  </Button>
                  <p className="text-xs text-muted-foreground mt-1">
                    PNG, JPG up to 2MB
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Branding */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Branding
            </CardTitle>
            <CardDescription>Customize your organization's colors</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="primaryColor">Primary Color</Label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    id="primaryColor"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="h-10 w-14 rounded border border-input cursor-pointer"
                  />
                  <Input
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="flex-1 font-mono text-sm"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="secondaryColor">Secondary Color</Label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    id="secondaryColor"
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    className="h-10 w-14 rounded border border-input cursor-pointer"
                  />
                  <Input
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    className="flex-1 font-mono text-sm"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="accentColor">Accent Color</Label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    id="accentColor"
                    value={accentColor}
                    onChange={(e) => setAccentColor(e.target.value)}
                    className="h-10 w-14 rounded border border-input cursor-pointer"
                  />
                  <Input
                    value={accentColor}
                    onChange={(e) => setAccentColor(e.target.value)}
                    className="flex-1 font-mono text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Color Preview */}
            <div className="space-y-2">
              <Label>Preview</Label>
              <div className="flex gap-2 p-4 rounded-lg border border-border bg-muted/30">
                <div
                  className="h-12 w-12 rounded-lg shadow-sm"
                  style={{ backgroundColor: primaryColor }}
                />
                <div
                  className="h-12 w-12 rounded-lg shadow-sm"
                  style={{ backgroundColor: secondaryColor }}
                />
                <div
                  className="h-12 w-12 rounded-lg shadow-sm"
                  style={{ backgroundColor: accentColor }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Advanced */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Advanced
            </CardTitle>
            <CardDescription>Custom domain and white-label options</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="customDomain">Custom Domain</Label>
              <Input
                id="customDomain"
                value={customDomain}
                onChange={(e) => setCustomDomain(e.target.value)}
                placeholder="brands.yourdomain.com"
              />
              <p className="text-xs text-muted-foreground">
                Contact support to configure your custom domain
              </p>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="flex items-center gap-2">
                  {hidePlatformBranding ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  Hide Platform Branding
                </Label>
                <p className="text-sm text-muted-foreground">
                  Remove "Powered by BrandHub" from your public pages
                </p>
              </div>
              <Switch
                checked={hidePlatformBranding}
                onCheckedChange={setHidePlatformBranding}
              />
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end gap-4">
          <Button variant="outline" onClick={() => navigate('/')}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving} className="gap-2">
            {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </div>
      </main>
    </div>
  );
};

export default OrganizationSettings;
