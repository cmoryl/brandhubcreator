import { useState, useRef, useEffect, useCallback, lazy, Suspense, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, Palette, Type, Image, Upload, ArrowRight, Layers, Lock, LogOut, Shield, Package, Clock, Star, Heart, HelpCircle, BookOpen, Zap, Share2, FileText, Building2, UserPlus, Settings, Globe, ExternalLink, BarChart3, Users, FolderCheck, TrendingUp, FileSearch, ShieldCheck, CheckCircle, ChevronDown, Brain, Sparkles, Eye, Play } from 'lucide-react';
import tpLogoWhite from '@/assets/tp-logo-white.svg';
import tpLogoColor from '@/assets/tp-logo-color.svg';
import { AnimatedHeroCanvas } from '@/components/AnimatedHeroCanvas';
import { HierarchicalProductList } from '@/components/HierarchicalProductList';
import { useParallax } from '@/hooks/useParallax';
import { useStableLoading } from '@/hooks/useStableLoading';
import { useBrands } from '@/contexts/BrandContext';
import { useEvents } from '@/contexts/EventContext';
import { useAuth } from '@/contexts/AuthContext';
import { useAppSettings } from '@/contexts/AppSettingsContext';
import { useTheme } from 'next-themes';
import { useOrganization } from '@/contexts/OrganizationContext';
import { toast } from 'sonner';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ThemeToggle } from '@/components/ThemeToggle';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { HeroBackground } from '@/components/HeroBackground';
import { ParticleEmbers } from '@/components/ParticleEmbers';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { BaseGuide } from '@/types/brand';
import { Organization } from '@/types/organization';
import { SyncStatusIndicator } from '@/components/SyncStatusIndicator';
import { OptimizedImage } from '@/components/ui/optimized-image';

// Lazy load components that are not needed on initial render
const DemoBrandsShowcase = lazy(() => import('@/components/landing/DemoBrandsShowcase').then(m => ({ default: m.DemoBrandsShowcase })));
const InviteMembersDialog = lazy(() => import('@/components/organization/InviteMembersDialog').then(m => ({ default: m.InviteMembersDialog })));
const AppSettingsEditor = lazy(() => import('@/components/admin/AppSettingsEditor').then(m => ({ default: m.AppSettingsEditor })));
const OrganizationSwitcher = lazy(() => import('@/components/OrganizationSwitcher').then(m => ({ default: m.OrganizationSwitcher })));
const FeaturesShowcase = lazy(() => import('@/components/landing/FeaturesShowcase').then(m => ({ default: m.FeaturesShowcase })));
const InteractiveProcessSection = lazy(() => import('@/components/landing/InteractiveProcessSection').then(m => ({ default: m.InteractiveProcessSection })));
const PlatformTour = lazy(() => import('@/components/landing/PlatformTour').then(m => ({ default: m.PlatformTour })));
const LearnMoreCard = lazy(() => import('@/components/landing/LearnMoreForm').then(m => ({ default: m.LearnMoreCard })));
const BrandBackupManager = lazy(() => import('@/components/brand/BrandBackupManager').then(m => ({ default: m.BrandBackupManager })));

// Backup reminder constants
const BACKUP_REMINDER_KEY = 'brandhub_last_backup_reminder';
const BACKUP_REMINDER_INTERVAL_DAYS = 7;

const BrandsIndex = () => {
  const navigate = useNavigate();
  const { brands, products, addBrand, addProduct, deleteBrand, deleteProduct, updateBrand, updateProduct, getRecentlyUpdated, toggleFavorite, getFavorites, isLoading } = useBrands();
  const { events, isLoading: eventsLoading } = useEvents();
  const { user, isAdmin, isApproved, accessStatus, accessError, signOut, isLoading: authLoading } = useAuth();
  const { settings } = useAppSettings();
  const { resolvedTheme } = useTheme();
  const { organization, userRole, isLoading: orgLoading } = useOrganization();

  // Redirect authenticated users to their organization portal
  // Only redirect once auth and org context are fully loaded to avoid flickering
  useEffect(() => {
    if (authLoading || orgLoading) return; // Wait for both to settle
    if (accessStatus !== 'ready') return; // Wait for access verification
    
    if (user && organization) {
      // Store welcome message in sessionStorage to show after navigation
      sessionStorage.setItem('welcomeToast', JSON.stringify({
        orgName: organization.name,
        timestamp: Date.now()
      }));
      navigate(`/org/${organization.slug}`, { replace: true });
    }
  }, [user, organization, accessStatus, authLoading, orgLoading, navigate]);

  // Redirect unapproved users to pending approval page
  // Only do this once access has been VERIFIED (otherwise a backend/network hiccup looks like "pending approval").
  useEffect(() => {
    if (!authLoading && user && accessStatus === 'ready' && !isApproved && !isAdmin) {
      navigate('/pending-approval');
    }
  }, [user, isApproved, isAdmin, accessStatus, authLoading, navigate]);

  // If we can't verify access, notify the user (do NOT redirect).
  useEffect(() => {
    if (!authLoading && user && accessStatus === 'error') {
      toast.error(accessError || 'Unable to verify access. Please refresh.');
    }
  }, [authLoading, user, accessStatus, accessError]);
  const [isNewDialogOpen, setIsNewDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ id: string; type: 'brand' | 'product' } | null>(null);
  const [newItemName, setNewItemName] = useState('');
  const [newItemType, setNewItemType] = useState<'brand' | 'product'>('brand');
  const [viewingOrg, setViewingOrg] = useState<Organization | null>(null);
  const fileInputRefs = useRef<Map<string, HTMLInputElement>>(new Map());
  const [showBackupReminder, setShowBackupReminder] = useState(false);
  const [showScrollIndicator, setShowScrollIndicator] = useState(true);

  // Hide scroll indicator after user scrolls past threshold
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 100) {
        setShowScrollIndicator(false);
      }
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const recentlyUpdated = getRecentlyUpdated();
  const allFavorites = getFavorites();
  
  // Parallax scrolling effect
  const parallaxOffset = useParallax({ speed: 0.3, maxOffset: 80 });

  // Get the appropriate logo based on current theme
  const currentLogo = resolvedTheme === 'dark' 
    ? (settings.appLogoDark || settings.appLogoLight || settings.appLogo)
    : (settings.appLogoLight || settings.appLogoDark || settings.appLogo);

  const handleSignOut = useCallback(async () => {
    await signOut();
    navigate('/');
  }, [signOut, navigate]);

  // Allow editing if user is logged in AND either is a global admin OR is an org member with appropriate role
  const canEdit = user && (isAdmin || (organization && ['owner', 'admin', 'member'].includes(userRole || '')));

  // Check for backup reminder - after canEdit is defined
  useEffect(() => {
    if (!user || !canEdit) return;
    
    const lastReminder = localStorage.getItem(BACKUP_REMINDER_KEY);
    const lastReminderDate = lastReminder ? new Date(parseInt(lastReminder)) : null;
    const now = new Date();
    
    // Show reminder if never shown or more than 7 days since last reminder
    if (!lastReminderDate || (now.getTime() - lastReminderDate.getTime()) > BACKUP_REMINDER_INTERVAL_DAYS * 24 * 60 * 60 * 1000) {
      // Only show if user has brands/products
      if (brands.length > 0 || products.length > 0) {
        setShowBackupReminder(true);
      }
    }
  }, [user, canEdit, brands.length, products.length]);

  const dismissBackupReminder = useCallback(() => {
    localStorage.setItem(BACKUP_REMINDER_KEY, Date.now().toString());
    setShowBackupReminder(false);
  }, []);

  // Determine which organization to filter by
  // For admins: use viewingOrg (null = all orgs, or specific org)
  // For regular users: use their organization context
  const activeOrg = isAdmin ? viewingOrg : organization;

  // NOTE: Many legacy items may have organizationId = null (personal).
  // If the user is in an organization, we still show those personal items
  // so they don't "disappear" from the index.
  const belongsToActiveOrgOrPersonal = (orgId: string | null | undefined) => {
    if (!activeOrg) return true;
    return orgId === activeOrg.id || orgId == null;
  };

  // Filter brands and products by active organization context
  // If activeOrg is null (admin viewing all), show all
  // If activeOrg is set, show both org-scoped items and personal (null-org) items
  const orgFilteredBrands = activeOrg
    ? brands.filter(b => belongsToActiveOrgOrPersonal(b.organizationId))
    : brands;

  const orgFilteredProducts = activeOrg
    ? products.filter(p => belongsToActiveOrgOrPersonal(p.organizationId))
    : products;

  // Filter favorites by organization too (same rule as above)
  const favorites = activeOrg
    ? allFavorites.filter(f => belongsToActiveOrgOrPersonal(f.organizationId))
    : allFavorites;


  // Sort brands and products by most recently updated
  const sortedBrands = [...orgFilteredBrands].sort((a, b) =>
    new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
  const sortedProducts = [...orgFilteredProducts].sort((a, b) =>
    new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );

  // Onboarding redirect removed - users go straight to the main page

  // Show skeleton loading state during initial auth check
  // But still render the page shell so users see something immediately
  const rawDataLoading = authLoading || (isLoading && brands.length === 0 && products.length === 0);
  const showDataLoading = useStableLoading(rawDataLoading, {
    showDelay: 100,
    minDisplayTime: 200,
    maxLoadingTime: 5000
  });

  const handleCreateItem = async () => {
    if (newItemName.trim()) {
      if (newItemType === 'brand') {
        const brand = await addBrand(newItemName.trim());
        setNewItemName('');
        setIsNewDialogOpen(false);
        if (brand) navigate(`/brand/${brand.slug || brand.id}`);
      } else {
        const product = await addProduct(newItemName.trim());
        setNewItemName('');
        setIsNewDialogOpen(false);
        if (product) navigate(`/product/${product.slug || product.id}`);
      }
    }
  };

  const handleDeleteClick = (id: string, type: 'brand' | 'product', e: React.MouseEvent) => {
    e.stopPropagation();
    setItemToDelete({ id, type });
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (itemToDelete) {
      if (itemToDelete.type === 'brand') {
        deleteBrand(itemToDelete.id);
      } else {
        deleteProduct(itemToDelete.id);
      }
      setItemToDelete(null);
      setIsDeleteDialogOpen(false);
    }
  };

  const isRecentlyUpdated = (item: BaseGuide) => {
    return recentlyUpdated.some(r => r.id === item.id);
  };

  const handleProductImageUpload = (productId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const product = products.find(p => p.id === productId);
        if (product) {
          updateProduct(productId, {
            hero: { ...product.hero, coverImage: reader.result as string }
          });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageUpload = (brandId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const brand = brands.find(b => b.id === brandId);
        if (brand) {
          updateBrand(brandId, {
            hero: { ...brand.hero, coverImage: reader.result as string }
          });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerImageUpload = (brandId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const input = fileInputRefs.current.get(brandId);
    if (input) {
      input.click();
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section with Parallax */}
      <div className="relative overflow-hidden">
        {/* Animated Canvas Background */}
        <div 
          className="absolute inset-0 transition-transform duration-100 ease-out"
          style={{ transform: `translateY(${parallaxOffset * 0.5}px)` }}
        >
          <AnimatedHeroCanvas />
          <div className="absolute inset-0 bg-gradient-to-b from-background/20 via-transparent to-background pointer-events-none" />
        </div>
        
        {/* Particle Embers Effect with Parallax */}
        <div 
          className="absolute inset-0"
          style={{ transform: `translateY(${parallaxOffset * 0.2}px)` }}
        >
          <ParticleEmbers count={50} color="hsl(199 89% 58%)" />
        </div>

        {/* Backup Reminder Banner */}
        {showBackupReminder && canEdit && (
          <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
            <div className="flex items-center justify-between gap-4 p-4 bg-accent/10 border border-accent/20 rounded-lg backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-accent/20 flex items-center justify-center">
                  <FolderCheck className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <p className="font-medium text-foreground">Time for a backup?</p>
                  <p className="text-sm text-muted-foreground">
                    Protect your {brands.length} brand{brands.length !== 1 ? 's' : ''} and {products.length} product{products.length !== 1 ? 's' : ''} with a backup
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Suspense fallback={null}>
                  <BrandBackupManager showFullBackup />
                </Suspense>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={dismissBackupReminder}
                  className="text-muted-foreground hover:text-foreground"
                >
                  Dismiss
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Header - Mobile optimized */}
        <header className="relative z-10 animate-fade-in-down">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <div className="flex items-center gap-2">
                <img 
                  src={resolvedTheme === 'dark' ? tpLogoWhite : tpLogoColor} 
                  alt="BrandHUB" 
                  className="h-8 sm:h-10 w-8 sm:w-10 object-contain flex-shrink-0" 
                />
                <span className="font-semibold text-lg sm:text-2xl text-foreground">
                  Brand<span className="text-accent">HUB</span>
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-3">
              
              {/* Organization Badge for non-admins - hidden on mobile */}
              {user && organization && !isAdmin && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-muted/50 rounded-lg border border-border/50">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium text-foreground max-w-32 truncate">{organization.name}</span>
                      <Badge variant="secondary" className="text-xs capitalize">
                        {userRole}
                      </Badge>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{organization.name} • {userRole}</p>
                  </TooltipContent>
                </Tooltip>
              )}
              
              {/* Help button - icon only on mobile */}
              <Button variant="ghost" onClick={() => navigate('/knowledge')} className="gap-2 text-muted-foreground hover:text-foreground p-2 sm:px-3" size="sm">
                <HelpCircle className="h-5 w-5 sm:h-4 sm:w-4" />
                <span className="hidden md:inline">Help</span>
              </Button>

              {/* BrandAgent */}
              {user && (
                <Button variant="outline" size="sm" onClick={() => navigate('/agent')} className="gap-2 p-2 sm:px-3">
                  <Sparkles className="h-4 w-4" />
                  <span className="hidden sm:inline">BrandAgent</span>
                </Button>
              )}

              {/* Sync Status - Only show on desktop or when logged in */}
              {user && <SyncStatusIndicator />}

              {/* Public Portal - only show for logged-in users with org */}
              {user && organization && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => window.open(`/org/${organization.slug}`, '_blank')}
                      className="gap-2 p-2 sm:px-3 hidden sm:flex"
                    >
                      <Globe className="h-5 w-5 sm:h-4 sm:w-4" />
                      <span className="hidden md:inline">Public Portal</span>
                      <ExternalLink className="h-3 w-3 hidden sm:block" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>View your organization's public portal</p>
                  </TooltipContent>
                </Tooltip>
              )}
              
              {canEdit && <Suspense fallback={null}><AppSettingsEditor /></Suspense>}
              <ThemeToggle />
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="gap-2" aria-label="User account menu">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-accent/10 text-accent text-sm">
                          {user.email?.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="hidden sm:inline text-sm">{user.email}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-64">
                    {/* Organization Switcher for Admins - at the top */}
                    {isAdmin && (
                      <>
                        <div className="p-2">
                          <p className="text-xs text-muted-foreground mb-2 px-2">Switch Organization</p>
                          <Suspense fallback={null}><OrganizationSwitcher onSwitch={(org) => setViewingOrg(org)} /></Suspense>
                        </div>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => navigate('/admin')} className="gap-2 text-accent">
                          <Shield className="h-4 w-4" />
                          Admin Dashboard
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                      </>
                    )}
                    {/* Organization link - show loading state if org is loading */}
                    {orgLoading ? (
                      <>
                        <DropdownMenuItem disabled className="gap-2 text-muted-foreground">
                          <Building2 className="h-4 w-4 animate-pulse" />
                          Loading organization...
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                      </>
                    ) : organization ? (
                      <>
                        <DropdownMenuItem 
                          onClick={() => navigate(`/org/${organization.slug}`)} 
                          className="gap-2"
                        >
                          <Building2 className="h-4 w-4" />
                          Go to {organization.name}
                        </DropdownMenuItem>
                        {(userRole === 'owner' || userRole === 'admin') && (
                          <>
                            <DropdownMenuItem 
                              onClick={() => navigate('/org/settings')} 
                              className="gap-2"
                            >
                              <Settings className="h-4 w-4" />
                              Organization Settings
                            </DropdownMenuItem>
                            <Suspense fallback={null}><InviteMembersDialog /></Suspense>
                          </>
                        )}
                        <DropdownMenuSeparator />
                      </>
                    ) : null}
                    {/* Backup Option for editors */}
                    {canEdit && (brands.length > 0 || products.length > 0) && (
                      <>
                        <Suspense fallback={null}>
                          <BrandBackupManager showFullBackup variant="dropdown-item" />
                        </Suspense>
                        <DropdownMenuSeparator />
                      </>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut} className="gap-2">
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button onClick={() => navigate('/auth')} variant="outline" className="gap-2">
                  <Lock className="h-4 w-4" />
                  Admin Login
                </Button>
              )}
            </div>
          </div>
        </header>

        {/* Hero Content - Mobile optimized with Parallax */}
        <div 
          className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12 pb-12 sm:pb-24"
          style={{ transform: `translateY(${parallaxOffset * 0.15}px)` }}
        >
          <div className="max-w-3xl">
            {/* Badges - simplified on mobile */}
            <div className="flex flex-wrap items-center gap-2 mb-6 sm:mb-8 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
              <div className="px-3 py-1.5 bg-accent/10 rounded-full border border-accent/20">
                <span className="text-xs font-medium text-accent">{settings.heroBadgeText}</span>
              </div>
              {canEdit && (
                <div className="px-3 py-1.5 bg-green-500/10 rounded-full border border-green-500/20">
                  <span className="text-xs font-medium text-green-600 dark:text-green-400">Edit Mode</span>
                </div>
              )}
            </div>
            
            {/* Headline - more compact on mobile */}
            <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-semibold text-foreground mb-4 sm:mb-6 leading-[1.2] sm:leading-tight animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              Create stunning<br />
              <span className="text-digital-live text-accent" data-text="Live">Live</span> Brand Guides.
            </h1>
            
            {/* Description - hidden on very small screens if too crowded */}
            <p className="text-sm sm:text-lg md:text-xl text-muted-foreground mb-6 sm:mb-8 max-w-2xl animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
              {settings.heroDescription}
            </p>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
              {canEdit ? (
                <>
                  <Button 
                    size="lg" 
                    className="gap-2 w-full sm:w-auto touch-manipulation h-12 sm:h-11"
                    onClick={() => { setNewItemType('brand'); setIsNewDialogOpen(true); }}
                  >
                    <Plus className="h-5 w-5" />
                    Create Brand
                  </Button>
                  <Button 
                    size="lg" 
                    variant="outline"
                    className="gap-2 w-full sm:w-auto touch-manipulation h-12 sm:h-11"
                    onClick={() => { setNewItemType('product'); setIsNewDialogOpen(true); }}
                  >
                    <Package className="h-5 w-5" />
                    Create Product
                  </Button>
                </>
              ) : (
                <>
                  <Button 
                    size="lg" 
                    className="gap-2 w-full sm:w-auto touch-manipulation h-12 sm:h-11"
                    onClick={() => navigate('/auth')}
                  >
                    <Lock className="h-5 w-5" />
                    Login to Create
                  </Button>
                  <Button 
                    size="lg" 
                    variant="outline"
                    className="gap-2 w-full sm:w-auto touch-manipulation h-12 sm:h-11"
                    onClick={() => navigate('/demo/brand/brandhub')}
                  >
                    <Eye className="h-5 w-5" />
                    See BrandHub Demo
                  </Button>
                </>
              )}
            </div>

            {/* Create Organization CTA for users without an org */}
            {user && !organization && !orgLoading && (
              <div className="mt-6 sm:mt-8 p-3 sm:p-4 bg-accent/10 rounded-xl border border-accent/20 animate-fade-in-up" style={{ animationDelay: '0.45s' }}>
                <div className="flex items-center gap-3">
                  <Building2 className="h-5 w-5 text-accent flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">Create your organization</p>
                    <p className="text-xs text-muted-foreground hidden sm:block">Set up your team workspace to share brands and invite members</p>
                  </div>
                  <Button size="sm" onClick={() => navigate('/onboarding')} className="gap-1.5 flex-shrink-0">
                    <Plus className="h-4 w-4" />
                    <span className="hidden sm:inline">Create</span>
                  </Button>
                </div>
              </div>
            )}

            {/* Marketing Highlights - Hidden on mobile to reduce clutter */}
            <div className="hidden sm:flex flex-wrap items-center gap-4 sm:gap-6 mt-10 sm:mt-12 pt-6 sm:pt-8 border-t border-border/50 animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
              <div className="flex items-center gap-2 px-3 py-2 bg-accent/10 rounded-lg border border-accent/20">
                <CheckCircle className="h-4 w-4 text-accent" />
                <span className="text-sm text-foreground">Always Up-to-Date</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-2 bg-primary/10 rounded-lg border border-primary/20">
                <Globe className="h-4 w-4 text-primary" />
                <span className="text-sm text-foreground">Share Anywhere</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-2 bg-green-500/10 rounded-lg border border-green-500/20">
                <Zap className="h-4 w-4 text-green-500" />
                <span className="text-sm text-foreground">Real-time Collaboration</span>
              </div>
            </div>
        </div>

          {/* Scroll Indicator - Mobile only, hides after scrolling */}
          {showScrollIndicator && (
            <div className="flex sm:hidden justify-center mt-6 animate-fade-in" style={{ animationDelay: '0.6s' }}>
              <button 
                onClick={() => window.scrollTo({ top: window.innerHeight - 100, behavior: 'smooth' })}
                className="flex flex-col items-center gap-1 text-muted-foreground/60 hover:text-muted-foreground transition-colors touch-manipulation"
                aria-label="Scroll to explore"
              >
                <span className="text-xs">Scroll to explore</span>
                <div className="animate-bounce">
                  <ChevronDown className="h-5 w-5" />
                </div>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* How It Works Section - Accordion on mobile */}
      {settings.pageSections?.howItWorks !== false && (
        <section className="py-10 sm:py-16 bg-muted/30 border-y border-border">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-6 sm:mb-12">
              <div className="p-3 bg-accent/10 rounded-xl w-fit mx-auto mb-4">
                <Zap className="h-6 w-6 text-accent" />
              </div>
              <h2 className="text-xl sm:text-3xl font-semibold text-foreground mb-2 sm:mb-3">
                How It Works
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto">
                Create your professional brand guide in three simple steps.
              </p>
            </div>
            
            {/* Desktop: Grid layout */}
            <div className="hidden sm:grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-12 h-12 bg-accent text-accent-foreground rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                  1
                </div>
                <h3 className="font-semibold text-foreground text-lg mb-2">Create Your Brand</h3>
                <p className="text-muted-foreground">
                  Sign in and click "New Brand" to start building your brand guide. Give it a name and you are ready to go.
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-accent text-accent-foreground rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                  2
                </div>
                <h3 className="font-semibold text-foreground text-lg mb-2">Add Your Elements</h3>
                <p className="text-muted-foreground">
                  Define your colors, typography, logos, imagery guidelines, and all the elements that make your brand unique.
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-accent text-accent-foreground rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                  3
                </div>
                <h3 className="font-semibold text-foreground text-lg mb-2">Share With Your Team</h3>
                <p className="text-muted-foreground">
                  Share your brand guide link with anyone. They can view it instantly without needing an account.
                </p>
              </div>
            </div>

            {/* Mobile: Accordion layout */}
            <Accordion type="single" collapsible className="sm:hidden">
              <AccordionItem value="step-1" className="border-border/50">
                <AccordionTrigger className="hover:no-underline py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-accent text-accent-foreground rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                      1
                    </div>
                    <span className="font-semibold text-foreground text-left">Create Your Brand</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pl-11 pb-4 text-sm text-muted-foreground">
                  Sign in and click "New Brand" to start building your brand guide. Give it a name and you are ready to go.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="step-2" className="border-border/50">
                <AccordionTrigger className="hover:no-underline py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-accent text-accent-foreground rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                      2
                    </div>
                    <span className="font-semibold text-foreground text-left">Add Your Elements</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pl-11 pb-4 text-sm text-muted-foreground">
                  Define your colors, typography, logos, imagery guidelines, and all the elements that make your brand unique.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="step-3" className="border-border/50">
                <AccordionTrigger className="hover:no-underline py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-accent text-accent-foreground rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                      3
                    </div>
                    <span className="font-semibold text-foreground text-left">Share With Your Team</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pl-11 pb-4 text-sm text-muted-foreground">
                  Share your brand guide link with anyone. They can view it instantly without needing an account.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </section>
      )}

      {/* Services Section - Compact on mobile */}
      {settings.pageSections?.services !== false && (
        <section className="py-10 sm:py-16 border-b border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-6 sm:mb-12">
              <h2 className="text-xl sm:text-3xl font-semibold text-foreground mb-2 sm:mb-3">
                What We Offer
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto">
                Comprehensive tools to build, manage, and share your brand identity
              </p>
            </div>
            {/* Desktop: Grid */}
            <div className="hidden sm:grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="group bg-card rounded-xl p-6 border border-border hover:border-primary/30 hover:shadow-lg transition-all duration-300">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <Palette className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">Brand Guidelines</h3>
                <p className="text-sm text-muted-foreground">Create comprehensive style guides for consistent branding</p>
              </div>
              
              <div className="group bg-card rounded-xl p-6 border border-border hover:border-primary/30 hover:shadow-lg transition-all duration-300">
                <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center mb-4 group-hover:bg-accent/20 transition-colors">
                  <Layers className="h-6 w-6 text-accent" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">Asset Management</h3>
                <p className="text-sm text-muted-foreground">Organize logos, colors, and typography in one place</p>
              </div>
              
              <div className="group bg-card rounded-xl p-6 border border-border hover:border-primary/30 hover:shadow-lg transition-all duration-300">
                <div className="w-12 h-12 rounded-lg bg-green-500/10 flex items-center justify-center mb-4 group-hover:bg-green-500/20 transition-colors">
                  <Share2 className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">Easy Sharing</h3>
                <p className="text-sm text-muted-foreground">Share brand guides with clients and team members</p>
              </div>
              
              <div className="group bg-card rounded-xl p-6 border border-border hover:border-primary/30 hover:shadow-lg transition-all duration-300">
                <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center mb-4 group-hover:bg-blue-500/20 transition-colors">
                  <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">PDF Export</h3>
                <p className="text-sm text-muted-foreground">Generate professional PDF brand books instantly</p>
              </div>
            </div>

            {/* Mobile: Horizontal scroll cards */}
            <div className="flex sm:hidden gap-3 overflow-x-auto pb-2 -mx-4 px-4 snap-x snap-mandatory">
              <div className="flex-shrink-0 w-[70vw] snap-start bg-card rounded-xl p-4 border border-border">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                  <Palette className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground text-sm mb-1">Brand Guidelines</h3>
                <p className="text-xs text-muted-foreground">Comprehensive style guides for consistent branding</p>
              </div>
              <div className="flex-shrink-0 w-[70vw] snap-start bg-card rounded-xl p-4 border border-border">
                <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center mb-3">
                  <Layers className="h-5 w-5 text-accent" />
                </div>
                <h3 className="font-semibold text-foreground text-sm mb-1">Asset Management</h3>
                <p className="text-xs text-muted-foreground">Organize logos, colors, and typography in one place</p>
              </div>
              <div className="flex-shrink-0 w-[70vw] snap-start bg-card rounded-xl p-4 border border-border">
                <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center mb-3">
                  <Share2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="font-semibold text-foreground text-sm mb-1">Easy Sharing</h3>
                <p className="text-xs text-muted-foreground">Share brand guides with clients and team members</p>
              </div>
              <div className="flex-shrink-0 w-[70vw] snap-start bg-card rounded-xl p-4 border border-border">
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center mb-3">
                  <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="font-semibold text-foreground text-sm mb-1">PDF Export</h3>
                <p className="text-xs text-muted-foreground">Generate professional PDF brand books instantly</p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Interactive How It Works Section - Above Demo Brands */}
      {!user && settings.pageSections?.about !== false && (
        <Suspense fallback={<div className="py-24 text-center text-muted-foreground">Loading...</div>}>
          <InteractiveProcessSection />
        </Suspense>
      )}

      {/* Platform Tour - Shows the BrandHub demo and user vs viewer comparison */}
      {!user && (
        <Suspense fallback={<div className="py-24 text-center text-muted-foreground">Loading platform tour...</div>}>
          <PlatformTour />
        </Suspense>
      )}

      {/* Demo Brands Showcase - Always shown on landing page */}
      <Suspense fallback={<div className="py-20 flex justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>}>
        <DemoBrandsShowcase onLoginClick={() => navigate('/auth')} />
      </Suspense>

      {/* Note: User dashboard moved to organization portal - this landing page is now marketing-focused */}

      {/* Create New Dialog */}
      <Dialog open={isNewDialogOpen} onOpenChange={setIsNewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New {newItemType === 'brand' ? 'Brand' : 'Product'} Guide</DialogTitle>
            <DialogDescription>
              Start a new {newItemType} identity from scratch.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="item-name">{newItemType === 'brand' ? 'Brand' : 'Product'} Name</Label>
            <Input
              id="item-name"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              placeholder={`Enter ${newItemType} name...`}
              className="mt-2"
              onKeyDown={(e) => e.key === 'Enter' && handleCreateItem()}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNewDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateItem} disabled={!newItemName.trim()}>
              Create {newItemType === 'brand' ? 'Brand' : 'Product'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {itemToDelete?.type === 'brand' ? 'Brand' : 'Product'} Guide?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. All data will be permanently deleted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete {itemToDelete?.type === 'brand' ? 'Brand' : 'Product'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Features Showcase - New Interactive Section */}
      {settings.pageSections?.features !== false && (
        <Suspense fallback={<div className="py-24 text-center text-muted-foreground">Loading features...</div>}>
          <FeaturesShowcase />
        </Suspense>
      )}


      {/* FAQ Preview Section - Accordion on mobile */}
      {settings.pageSections?.faqPreview !== false && (
        <section className="py-12 sm:py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-6 sm:mb-12">
              <div className="p-3 bg-accent/10 rounded-xl w-fit mx-auto mb-4">
                <HelpCircle className="h-6 w-6 text-accent" />
              </div>
              <h2 className="text-xl sm:text-3xl font-bold text-foreground mb-2 sm:mb-4">Frequently Asked Questions</h2>
              <p className="text-sm sm:text-lg text-muted-foreground">
                Quick answers to common questions about BrandHub.
              </p>
            </div>
            
            {/* Desktop: Card layout */}
            <div className="hidden sm:grid gap-4 mb-8">
              <Card className="p-6 border-border/50 hover:border-accent/30 transition-colors">
                <h3 className="font-semibold text-foreground mb-2">What is BrandHub?</h3>
                <p className="text-muted-foreground">BrandHub is a comprehensive brand guide creation platform with live previews, AI-powered analytics, competitive intelligence, version control, and enterprise-grade security for team collaboration.</p>
              </Card>
              
              <Card className="p-6 border-border/50 hover:border-accent/30 transition-colors">
                <h3 className="font-semibold text-foreground mb-2">What AI features are available?</h3>
                <p className="text-muted-foreground">AI-powered Competitive Intelligence with personality matrix, Brand Intelligence learning system, automated pattern/gradient generation, market analysis, and brand health scoring—all built into the platform.</p>
              </Card>

              <Card className="p-6 border-border/50 hover:border-accent/30 transition-colors">
                <h3 className="font-semibold text-foreground mb-2">What are Product Suites?</h3>
                <p className="text-muted-foreground">Product Suites let you create a master product with multiple linked sub-products in one streamlined wizard. Perfect for product families with shared branding that need individual customization.</p>
              </Card>
              
              <Card className="p-6 border-border/50 hover:border-accent/30 transition-colors">
                <h3 className="font-semibold text-foreground mb-2">Can I share my brand guide publicly?</h3>
                <p className="text-muted-foreground">Yes! All brand guides can be made publicly viewable. Share the link with your team, clients, or stakeholders—no login required for viewers.</p>
              </Card>
              
              <Card className="p-6 border-border/50 hover:border-accent/30 transition-colors">
                <h3 className="font-semibold text-foreground mb-2">What sections can I include?</h3>
                <p className="text-muted-foreground">Over 25 sections: colors, typography, logos, philosophical pillars, imagery, patterns, gradients, icons, QR codes, email signatures, presentation templates, and much more.</p>
              </Card>

              <Card className="p-6 border-border/50 hover:border-accent/30 transition-colors">
                <h3 className="font-semibold text-foreground mb-2">Is my data secure?</h3>
                <p className="text-muted-foreground">Enterprise-grade security with Row Level Security, email masking for privacy, leaked password protection, comprehensive audit logging, and SOC 2 compliant infrastructure.</p>
              </Card>
            </div>

            {/* Mobile: Accordion layout */}
            <Accordion type="single" collapsible className="sm:hidden mb-6">
              <AccordionItem value="faq-1" className="border-border/50">
                <AccordionTrigger className="text-left text-sm font-semibold py-3">
                  What is BrandHub?
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground pb-4">
                  BrandHub is a comprehensive brand guide creation platform with AI-powered analytics, competitive intelligence, and enterprise security.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="faq-2" className="border-border/50">
                <AccordionTrigger className="text-left text-sm font-semibold py-3">
                  What AI features are available?
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground pb-4">
                  Competitive Intelligence with personality matrix, Brand Intelligence learning, automated pattern generation, and brand health scoring.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="faq-3" className="border-border/50">
                <AccordionTrigger className="text-left text-sm font-semibold py-3">
                  Can I share my brand guide publicly?
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground pb-4">
                  Yes! All brand guides can be made publicly viewable. Share the link with anyone—no login required for viewers.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="faq-4" className="border-border/50">
                <AccordionTrigger className="text-left text-sm font-semibold py-3">
                  Is my data secure?
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground pb-4">
                  Enterprise-grade security with Row Level Security, email masking, leaked password protection, and comprehensive audit logs.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
            
            <div className="text-center">
              <Button variant="outline" onClick={() => navigate('/knowledge')} className="gap-2">
                <BookOpen className="h-4 w-4" />
                <span className="hidden sm:inline">View All FAQs & Tutorials</span>
                <span className="sm:hidden">View All FAQs</span>
              </Button>
            </div>
          </div>
        </section>
      )}


      {/* Contact CTA Section - Compact on mobile */}
      {!user && settings.pageSections?.signupCta !== false && (
        <section id="contact" className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
          {/* Animated background */}
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-accent/10 to-primary/5" />
          <div className="absolute inset-0 hidden sm:block">
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          </div>
          
          <div className="relative max-w-3xl mx-auto text-center">
            <Badge variant="secondary" className="mb-3 sm:mb-4 gap-1">
              <Zap className="h-3 w-3" />
              Enterprise Ready
            </Badge>
            <h2 className="text-2xl sm:text-4xl md:text-5xl font-bold text-foreground mb-4 sm:mb-6">
              Ready to transform your
              <span className="block text-accent">brand management?</span>
            </h2>
            <p className="text-sm sm:text-lg text-muted-foreground mb-6 sm:mb-10 max-w-xl mx-auto">
              Contact our team to learn how BrandHub can streamline your brand guidelines with AI-powered analytics and team collaboration.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
              <Button size="lg" onClick={() => window.location.href = 'mailto:support@brandhub.com?subject=BrandHub Inquiry'} className="gap-2 group text-sm sm:text-base h-11 sm:h-12 px-6 sm:px-8">
                <Plus className="h-4 w-4 sm:h-5 sm:w-5 group-hover:rotate-90 transition-transform" />
                Contact Us
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate('/auth')} className="gap-2 text-sm sm:text-base h-11 sm:h-12 px-6 sm:px-8">
                <Lock className="h-4 w-4 sm:h-5 sm:w-5" />
                Sign In
              </Button>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground mt-6 sm:mt-8 flex items-center justify-center gap-3 sm:gap-4 flex-wrap">
              <span className="flex items-center gap-1.5">
                <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-500" />
                Personalized Demo
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-500" />
                Custom Onboarding
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-500" />
                Dedicated Support
              </span>
            </p>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t border-border/30">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <img 
                src={resolvedTheme === 'light' ? tpLogoColor : tpLogoWhite} 
                alt="TransPerfect" 
                className="h-8 w-auto"
              />
              <span className="font-semibold text-lg text-foreground">{settings.appName}</span>
            </div>
            
            <nav className="flex flex-wrap items-center justify-center gap-6 text-sm">
              <button onClick={() => navigate('/about')} className="text-muted-foreground hover:text-foreground transition-colors">
                About
              </button>
              <button onClick={() => navigate('/knowledge')} className="text-muted-foreground hover:text-foreground transition-colors">
                FAQ & Help
              </button>
              <a href="#contact" className="text-muted-foreground hover:text-foreground transition-colors">
                Contact
              </a>
              <button onClick={() => navigate('/auth')} className="text-muted-foreground hover:text-foreground transition-colors">
                Admin Login
              </button>
            </nav>
            
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} {settings.appName}. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default BrandsIndex;
