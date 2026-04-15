import { useState, useRef, lazy, Suspense } from 'react';
import { useStableLoading } from '@/hooks/useStableLoading';
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
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { ArrowLeft, Building2, Upload, Loader2, Palette, Globe, Eye, EyeOff, Trash2, Users, Mail, Crown, Shield, UserPlus, Layout, BarChart3, Library } from 'lucide-react';

// Lazy load analytics and icon library components for performance
const OrganizationAnalytics = lazy(() => import('@/components/organization/OrganizationAnalytics'));
const IconLibraryManager = lazy(() => import('@/components/brand/iconography/IconLibraryManager').then(m => ({ default: m.IconLibraryManager })));
import { CacheSettingsCard } from '@/components/organization/CacheSettingsCard';
import { BatchAssetGenerationCard } from '@/components/organization/BatchAssetGenerationCard';
import { z } from 'zod';

import { MemberRole } from '@/lib/organization/types';

const emailSchema = z.string().email('Please enter a valid email address');

const roleIcons = {
  owner: Crown,
  admin: Shield,
  member: Users,
  viewer: Eye,
};

const roleColors = {
  owner: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  admin: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
  member: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  viewer: 'bg-muted text-muted-foreground border-border',
};

const OrganizationSettings = () => {
  const navigate = useNavigate();
  const { user, isSuperAdmin, isLoading: authLoading } = useAuth();
  const { organization, members, userRole, updateOrganization, deleteOrganization, inviteMember, removeMember, updateMemberRole, isLoading: orgLoading } = useOrganization();
  const stableLoading = useStableLoading(authLoading || orgLoading, { minDisplayTime: 400 });
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
  const [portalHeroFullWidth, setPortalHeroFullWidth] = useState(organization?.portalSettings?.heroFullWidth || false);
  const [portalHeroKenBurns, setPortalHeroKenBurns] = useState(organization?.portalSettings?.heroKenBurns || false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Members management state
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<MemberRole>('member');
  const [isInviting, setIsInviting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
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
      setPortalHeroFullWidth(organization.portalSettings?.heroFullWidth || false);
      setPortalHeroKenBurns(organization.portalSettings?.heroKenBurns || false);
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
        portalSettings: {
          heroFullWidth: portalHeroFullWidth,
          heroKenBurns: portalHeroKenBurns,
        },
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

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      emailSchema.parse(inviteEmail);
    } catch (err) {
      if (err instanceof z.ZodError) {
        toast({
          title: 'Invalid Email',
          description: err.errors[0].message,
          variant: 'destructive',
        });
        return;
      }
    }

    // Check if already invited
    const existingMember = members.find(m => m.invitedEmail === inviteEmail);
    if (existingMember) {
      toast({
        title: 'Already Invited',
        description: 'This email has already been invited to the organization.',
        variant: 'destructive',
      });
      return;
    }

    setIsInviting(true);
    try {
      await inviteMember(inviteEmail, inviteRole);
      toast({
        title: 'Invitation Sent',
        description: `Invitation sent to ${inviteEmail}`,
      });
      setInviteEmail('');
      setInviteRole('member');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to send invitation. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsInviting(false);
    }
  };

  const handleRemoveMember = async (memberId: string, memberRole: string) => {
    if (memberRole === 'owner') {
      toast({
        title: 'Cannot Remove',
        description: 'The organization owner cannot be removed.',
        variant: 'destructive',
      });
      return;
    }

    try {
      await removeMember(memberId);
      toast({
        title: 'Member Removed',
        description: 'The member has been removed from the organization.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to remove member. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleRoleChange = async (memberId: string, newRole: MemberRole) => {
    try {
      await updateMemberRole(memberId, newRole);
      toast({
        title: 'Role Updated',
        description: 'Member role has been updated.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update role. Please try again.',
        variant: 'destructive',
      });
    }
  };

  if (stableLoading) {
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center gap-4">
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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Two-column grid for cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
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

          {/* Portal Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Layout className="h-5 w-5" />
              Portal Settings
            </CardTitle>
            <CardDescription>Customize your public portal appearance</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between p-4 rounded-lg border border-border">
              <div className="space-y-0.5">
                <Label>Full Width Hero</Label>
                <p className="text-sm text-muted-foreground">
                  Expand the portal hero section to full page width
                </p>
              </div>
              <Switch
                checked={portalHeroFullWidth}
                onCheckedChange={setPortalHeroFullWidth}
              />
            </div>

            {/* Ken Burns Effect toggle */}
            <div className="flex items-center justify-between p-4 rounded-lg border border-border">
              <div className="space-y-0.5">
                <Label>Ken Burns Effect</Label>
                <p className="text-sm text-muted-foreground">
                  Apply slow pan/zoom animation to the portal hero background
                </p>
              </div>
              <Switch
                checked={portalHeroKenBurns}
                onCheckedChange={setPortalHeroKenBurns}
              />
            </div>
          </CardContent>
        </Card>

          {/* Advanced - moved into the two-column grid */}
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
        </div>

        {/* Full-width sections below */}
        <div className="space-y-6">
          {/* Icon Library Hierarchy */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Library className="h-5 w-5" />
              Icon Library
            </CardTitle>
            <CardDescription>
              Manage organization-wide icon libraries with hierarchical inheritance
            </CardDescription>
          </CardHeader>
          <CardContent>
            {organization?.id && (
              <Suspense fallback={<Skeleton className="h-64 w-full" />}>
                <IconLibraryManager 
                  organizationId={organization.id}
                  organizationName={organization.name}
                  brandColors={[
                    { hex: primaryColor, name: 'Primary' },
                    { hex: secondaryColor, name: 'Secondary' },
                    { hex: accentColor, name: 'Accent' },
                  ]}
                />
              </Suspense>
            )}
          </CardContent>
        </Card>

        {/* Analytics Dashboard */}
        <Suspense fallback={
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                <Skeleton className="h-6 w-40" />
              </div>
              <Skeleton className="h-4 w-60 mt-1" />
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-24 rounded-lg" />
                ))}
              </div>
              <Skeleton className="h-64 rounded-lg" />
            </CardContent>
          </Card>
        }>
          <OrganizationAnalytics />
        </Suspense>

        {/* Cache & Data Settings */}
        <CacheSettingsCard />

        {/* AI Asset Generation */}
        <BatchAssetGenerationCard />

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Team Members
            </CardTitle>
            <CardDescription>Manage who has access to your organization</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Invite Form */}
            <form onSubmit={handleInvite} className="space-y-4">
              <Label>Invite a new member</Label>
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="email"
                    placeholder="colleague@company.com"
                    className="pl-10"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    required
                  />
                </div>
                <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as MemberRole)}>
                  <SelectTrigger className="w-28">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="member">Member</SelectItem>
                    <SelectItem value="viewer">Viewer</SelectItem>
                  </SelectContent>
                </Select>
                <Button type="submit" disabled={isInviting} className="gap-2">
                  {isInviting ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                  Invite
                </Button>
              </div>
            </form>

            <Separator />

            {/* Members List */}
            <div className="space-y-3">
              <Label className="text-xs text-muted-foreground uppercase tracking-wide">
                Current Members ({members.length})
              </Label>
              {members.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">No members yet</p>
              ) : (
                <div className="space-y-2">
                  {members.map((member) => {
                    const RoleIcon = roleIcons[member.role as keyof typeof roleIcons] || Users;
                    const isPending = !member.inviteAcceptedAt && member.invitedEmail;
                    
                    return (
                      <div
                        key={member.id}
                        className="flex items-center justify-between p-3 rounded-lg border bg-card"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                            <RoleIcon className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="text-sm font-medium flex items-center gap-2">
                              {member.invitedEmail || member.userId}
                              {isPending && (
                                <Badge variant="outline" className="text-xs">
                                  Pending
                                </Badge>
                              )}
                            </p>
                            <Badge 
                              variant="outline" 
                              className={`text-xs capitalize ${roleColors[member.role as keyof typeof roleColors] || roleColors.member}`}
                            >
                              {member.role}
                            </Badge>
                          </div>
                        </div>

                        {member.role !== 'owner' && canEdit && (
                          <div className="flex items-center gap-2">
                            <Select
                              value={member.role}
                              onValueChange={(v) => handleRoleChange(member.id, v as MemberRole)}
                            >
                              <SelectTrigger className="w-24 h-8 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="admin">Admin</SelectItem>
                                <SelectItem value="member">Member</SelectItem>
                                <SelectItem value="viewer">Viewer</SelectItem>
                              </SelectContent>
                            </Select>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Remove member?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This will remove {member.invitedEmail || 'this member'} from the organization. They will lose access to all organization resources.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleRemoveMember(member.id, member.role)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Remove
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        </div>

        {/* Danger Zone - Only visible to owners */}
        {isSuperAdmin && (
          <Card className="border-destructive/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <Trash2 className="h-5 w-5" />
                Danger Zone
              </CardTitle>
              <CardDescription>Irreversible actions that affect your entire organization</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 bg-destructive/5 rounded-lg border border-destructive/20">
                <div className="space-y-0.5">
                  <p className="font-medium">Delete Organization</p>
                  <p className="text-sm text-muted-foreground">
                    Permanently delete this organization and all associated data. This action cannot be undone.
                  </p>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="gap-2">
                      <Trash2 className="h-4 w-4" />
                      Delete Organization
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete <strong>{organization?.name}</strong> and all associated data including:
                        <ul className="list-disc list-inside mt-2 space-y-1">
                          <li>All organization members and invitations</li>
                          <li>Organization settings and branding</li>
                          <li>Portal configurations</li>
                        </ul>
                        <p className="mt-3 font-medium text-destructive">This action cannot be undone.</p>
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={async () => {
                          setIsDeleting(true);
                          const success = await deleteOrganization();
                          setIsDeleting(false);
                          if (success) {
                            toast({
                              title: 'Organization deleted',
                              description: 'Your organization has been permanently deleted.',
                            });
                            navigate('/');
                          } else {
                            toast({
                              title: 'Deletion failed',
                              description: 'Failed to delete organization. Please try again.',
                              variant: 'destructive',
                            });
                          }
                        }}
                        disabled={isDeleting}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        {isDeleting ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            Deleting...
                          </>
                        ) : (
                          'Delete Organization'
                        )}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        )}

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
