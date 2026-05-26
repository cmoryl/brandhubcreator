/**
 * Organization Portal Page
 * Public-facing portal for organization's brands, products, and events
 * Refactored to use modular hooks and components
 */

import { useState, useEffect, lazy, Suspense, useMemo, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Globe, Lock, Building2, ArrowLeft, Search, Package, Calendar, Plus, Shield, Settings, LogOut, User, LayoutDashboard, Users, HelpCircle, Bot, Droplets, LayoutGrid, ImageIcon, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { HeroBackground } from '@/components/HeroBackground';
import { AppBreadcrumbs } from '@/components/AppBreadcrumbs';
import { AnimatedTagline } from '@/components/ui/animated-tagline';
import { useAuth } from '@/contexts/AuthContext';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useEvents } from '@/contexts/EventContext';
import { useSEO } from '@/hooks/useSEO';
import { useStableLoading } from '@/hooks/useStableLoading';
import { usePortalData, useFilteredPortalData } from '@/hooks/usePortalData';
import { useRecentEntityViews } from '@/hooks/useRecentEntityViews';
import { usePortalPagination } from '@/hooks/usePortalPagination';
import { useLatestComplianceScores } from '@/hooks/dataforce/useLatestComplianceScores';
import { DEFAULT_PORTAL_SETTINGS } from '@/lib/organization/types';
import { PublicLoadingScreen } from '@/components/PublicLoadingScreen';
import { SearchInput } from '@/components/ui/search-input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PortalBrandCard, PortalProductCard, HierarchicalEventCard, HierarchicalProductGrid, HierarchicalBrandGrid, PortalGridSkeleton, PortalPagination, PortalAdminActions, GlobalAssetOrbit, OrbitLegend, MobileStickyTabs } from '@/components/portal';
import { toast } from 'sonner';

// Lazy load admin components
const AppSettingsEditor = lazy(() => import('@/components/admin/AppSettingsEditor').then(m => ({ default: m.AppSettingsEditor })));
const BrandAssistant = lazy(() => import('@/components/dataforce/BrandAssistant').then(m => ({ default: m.BrandAssistant })));

const OrganizationPortal = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user, isAdmin, isSuperAdmin, signOut } = useAuth();
  const { userRole, organization: contextOrg } = useOrganization();
  const { addEvent } = useEvents();
  
  // Use the new portal data hook
  const { organization, brands, products, events, isLoading: dataLoading, hasFetchedOnce, error } = usePortalData(slug);
  
  // Fetch compliance scores for the org
  const { data: complianceScores } = useLatestComplianceScores(organization?.id);
  
  // Track if we have meaningful content (prevents flicker on background refetches)
  const hasContent = brands.length > 0 || products.length > 0 || events.length > 0;
  const hasInitialData = !!organization;
  
  // Full-screen loading: only show when fetch started but no org data yet
  // The key is: don't show loading before fetch starts OR after we have data
  const needsFullScreenLoading = hasFetchedOnce && !hasInitialData && dataLoading;
  
  // Skeleton loading: only show when actively fetching AND we have no content yet
  // Once we have content, background refetches are silent (no skeletons)
  const showSkeletons = hasFetchedOnce && dataLoading && !hasContent;
  
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'brands' | 'products' | 'events'>('all');
  const [isCreatingEvent, setIsCreatingEvent] = useState(false);
  const [assistantOpen, setAssistantOpen] = useState(false);

  // Keep these hooks ABOVE any conditional returns to avoid hook order crashes.
  const orgColors = useMemo(
    () => ({
      primary: organization?.primaryColor || '#6366f1',
      secondary: organization?.secondaryColor || '#8b5cf6',
    }),
    [organization?.primaryColor, organization?.secondaryColor]
  );

  const handleTabChange = useCallback((next: typeof activeTab) => {
    setActiveTab((prev) => (prev === next ? prev : next));
  }, []);

  // Dev-only tracer to catch the exact toggle that causes layout flashing
  useEffect(() => {
    if (!import.meta.env.DEV) return;
    console.debug('[PortalDebug] render flags', {
      slug,
      dataLoading,
      hasFetchedOnce,
      hasInitialData,
      hasContent,
      showSkeletons,
      counts: { brands: brands.length, products: products.length, events: events.length },
      activeTab,
      searchQuery: searchQuery ? '(non-empty)' : '(empty)',
    });
  }, [
    slug,
    dataLoading,
    hasFetchedOnce,
    hasInitialData,
    hasContent,
    showSkeletons,
    brands.length,
    products.length,
    events.length,
    activeTab,
    searchQuery,
  ]);

  // Get user's recently viewed entities for personalized ordering
  const { recentEntityIds } = useRecentEntityViews(user?.id, organization?.id);

  // Use the filtering hook with recency-based ordering
  const { filteredBrands, filteredProducts, filteredEvents, totalResults } = useFilteredPortalData(
    brands,
    products,
    events,
    searchQuery,
    recentEntityIds
  );

  // Pagination reset key - changes when search or tab changes
  const paginationResetKey = useMemo(() => `${searchQuery}-${activeTab}`, [searchQuery, activeTab]);

  // Pagination for each category (12 items per page)
  const brandsPagination = usePortalPagination(filteredBrands, { 
    itemsPerPage: 12, 
    resetKey: `brands-${searchQuery}` 
  });
  const productsPagination = usePortalPagination(filteredProducts, { 
    itemsPerPage: 12, 
    resetKey: `products-${searchQuery}` 
  });
  const eventsPagination = usePortalPagination(filteredEvents, { 
    itemsPerPage: 12, 
    resetKey: `events-${searchQuery}` 
  });
  
  // Check if user can edit
  const canEdit = user && (isAdmin || (userRole && ['owner', 'admin', 'member'].includes(userRole)));

  // SEO metadata
  useSEO({
    title: organization ? `${organization.name} Brand Portal` : 'Brand Portal',
    description: organization
      ? `Explore ${organization.name}'s public brand guidelines and resources.`
      : 'Explore public brand guidelines and resources.',
    canonicalUrl: organization ? `${window.location.origin}/org/${organization.slug}` : undefined,
    ogTitle: organization ? `${organization.name} - Brand Portal` : undefined,
    ogImage: organization?.logoUrl || undefined,
    ogType: 'website',
  });

  // Optimized loading: prevents flash for fast loads
  // Only triggers full-screen loading when we have no data at all
  const stableLoading = useStableLoading(needsFullScreenLoading, {
    showDelay: 200,       // Wait 200ms before showing - most loads complete faster
    minDisplayTime: 300,  // If shown, display for at least 300ms
    maxLoadingTime: 8000
  });

  // Show welcome toast if redirected from sign-in
  useEffect(() => {
    const welcomeData = sessionStorage.getItem('welcomeToast');
    if (welcomeData) {
      try {
        const { orgName, timestamp } = JSON.parse(welcomeData);
        // Only show if within last 10 seconds (prevent stale toasts)
        if (Date.now() - timestamp < 10000) {
          toast.success('Welcome back!', {
            description: `You're now viewing ${orgName}`,
            duration: 4000,
          });
        }
      } catch (e) {
        // Ignore parse errors
      }
      sessionStorage.removeItem('welcomeToast');
    }
  }, []);

  // Handle creating a new event
  const handleCreateEvent = async () => {
    if (!canEdit) return;
    
    setIsCreatingEvent(true);
    try {
      const newEvent = await addEvent('New Event');
      if (newEvent) {
        toast.success('Event created');
        navigate(`/event/${newEvent.slug || newEvent.id}`);
      }
    } catch (err) {
      console.error('Error creating event:', err);
      toast.error('Failed to create event');
    } finally {
      setIsCreatingEvent(false);
    }
  };

  // Loading state - show loading screen while fetching or before data arrives
  // CRITICAL: Don't show "not found" until we've actually finished fetching
  if (stableLoading || (!organization && dataLoading) || (!organization && !hasFetchedOnce)) {
    const displayName = organization?.name || (slug ? slug.charAt(0).toUpperCase() + slug.slice(1) : undefined);
    return <PublicLoadingScreen type="portal" name={displayName} />;
  }

  // Error state - only show after fetch completed with no results
  if ((error || !organization) && hasFetchedOnce && !dataLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="p-4 bg-destructive/10 rounded-2xl w-fit mx-auto">
            <Building2 className="h-8 w-8 text-destructive" />
          </div>
          <h1 className="text-2xl font-semibold text-foreground">Organization Not Found</h1>
          <p className="text-muted-foreground">
            The organization portal you're looking for doesn't exist or has been removed.
          </p>
          <Button onClick={() => navigate('/')} variant="outline">
            Go to Homepage
          </Button>
        </div>
      </div>
    );
  }

  // Final guard - if somehow we still have no organization, show loading
  if (!organization) {
    const displayName = slug ? slug.charAt(0).toUpperCase() + slug.slice(1) : undefined;
    return <PublicLoadingScreen type="portal" name={displayName} />;
  }

  const portalSettings = organization.portalSettings || DEFAULT_PORTAL_SETTINGS;
  const heroFullWidth = portalSettings.heroFullWidth ?? false;
  const heroKenBurns = portalSettings.heroKenBurns ?? false;

  return (
    <div className="min-h-screen bg-background overflow-x-hidden max-w-full">
      {/* Mobile Sticky Tabs - fixed at top on mobile */}
      <MobileStickyTabs
        activeTab={activeTab}
        onTabChange={handleTabChange}
        counts={{
          all: filteredBrands.length + filteredProducts.length + filteredEvents.length,
          brands: filteredBrands.length,
          products: filteredProducts.length,
          events: filteredEvents.length,
        }}
        accentColor={organization.accentColor || orgColors.primary}
      />

      {/* Hero Section - add top padding on mobile to account for sticky tabs */}
      <div className="relative pt-16 sm:pt-0">
        <HeroBackground kenBurnsEffect={heroKenBurns} />

        {/* Header */}
        <header className="relative z-50 animate-fade-in-down safe-area-inset-top">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 sm:h-20 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
              {organization.logoUrl ? (
                <img 
                  src={organization.logoUrl} 
                  alt={organization.name} 
                  className="h-8 sm:h-10 w-auto flex-shrink-0" 
                />
              ) : (
                <div 
                  className="p-2 sm:p-2.5 rounded-xl border flex-shrink-0"
                  style={{ 
                    backgroundColor: `${orgColors.primary}20`,
                    borderColor: `${orgColors.primary}40`
                  }}
                >
                  <Building2 
                    className="h-5 w-5 sm:h-6 sm:w-6" 
                    style={{ color: orgColors.primary }} 
                  />
                </div>
              )}
              <span className="font-semibold text-lg sm:text-2xl text-foreground truncate">
                {organization.name}
              </span>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-3 flex-shrink-0">
              {isSuperAdmin && (
                <Suspense fallback={null}>
                  <AppSettingsEditor />
                </Suspense>
              )}
              <Badge variant="outline" className="gap-1 hidden sm:flex">
                <Globe className="h-3 w-3" />
                Public Portal
              </Badge>
              <ThemeToggle />
              
              {/* User Area / Admin Menu */}
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="relative">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-accent/10 text-accent text-sm font-medium">
                          {user.email?.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      {isAdmin && (
                        <span className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full bg-accent border-2 border-background" />
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{user.email}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          {isAdmin ? (
                            <>
                              <Shield className="h-3 w-3 text-accent" />
                              <span className="text-accent">Admin</span>
                            </>
                          ) : userRole ? (
                            <>
                              <User className="h-3 w-3" />
                              <span className="capitalize">{userRole}</span>
                            </>
                          ) : (
                            'Viewer'
                          )}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    
                    
                    {isAdmin && (
                      <>
                        <DropdownMenuItem onClick={() => navigate('/admin')} className="gap-2 cursor-pointer">
                          <Shield className="h-4 w-4" />
                          Admin Panel
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigate(`/org/${slug}/settings`)} className="gap-2 cursor-pointer">
                          <Settings className="h-4 w-4" />
                          Organization Settings
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigate('/booths')} className="gap-2 cursor-pointer">
                          <LayoutDashboard className="h-4 w-4" />
                          Booth Catalog
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigate('/imagery-hub')} className="gap-2 cursor-pointer">
                          <ImageIcon className="h-4 w-4" />
                          Imagery Hub
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigate('/icon-studio')} className="gap-2 cursor-pointer">
                          <Sparkles className="h-4 w-4" />
                          Icon Studio
                        </DropdownMenuItem>
                      </>
                    )}
                    
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate('/help')} className="gap-2 cursor-pointer">
                      <HelpCircle className="h-4 w-4" />
                      Help Center
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={() => signOut()} 
                      className="gap-2 cursor-pointer text-destructive focus:text-destructive"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => navigate('/auth')}
                  className="gap-2"
                >
                  <User className="h-4 w-4" />
                  <span className="hidden sm:inline">Sign In</span>
                </Button>
              )}
            </div>
          </div>
        </header>

        {/* Breadcrumbs */}
        <div className="relative z-50 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <AppBreadcrumbs
            items={[]}
            currentPage={organization.name}
            currentIcon={Building2}
            showHome={false}
          />
        </div>

        {/* Hero Content */}
        <div className={`relative z-10 ${heroFullWidth ? 'px-4 sm:px-6 lg:px-8' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'} pt-4 sm:pt-8 pb-8 sm:pb-24 overflow-visible`}>
          <div className="relative min-h-0 lg:min-h-[480px]">
            {/* Global Asset Orbit - background layer, not clickable except icons */}
            <div 
              className="hidden lg:block absolute top-1/2 -translate-y-1/2 z-30 animate-fade-in pointer-events-none"
              style={{ 
                animationDelay: '0.3s',
                right: '-5%',
                width: 'clamp(500px, 55vw, 750px)',
                height: 'clamp(500px, 55vw, 750px)',
              }}
            >
              <GlobalAssetOrbit
                primaryColor={organization.accentColor || orgColors.primary}
                secondaryColor={orgColors.secondary}
                organizationName={organization.name}
                organizationLogo={organization.logoUrl}
                className="w-full h-full"
                filter={activeTab}
                showLegend={false}
                onFilterChange={handleTabChange}
                brands={brands.map(b => ({
                  id: b.id,
                  name: b.hero?.name || b.name,
                  slug: b.slug || undefined,
                  type: 'brand' as const,
                  updatedAt: b.updatedAt,
                  coverImage: b.hero?.coverImage,
                  color: b.colors?.[0]?.hex,
                  linkedGuides: b.linkedGuides?.map((g: any) => g.id) || [],
                }))}
                products={products.map(p => ({
                  id: p.id,
                  name: p.hero?.name || p.name,
                  slug: p.slug || undefined,
                  type: 'product' as const,
                  updatedAt: p.updatedAt,
                  coverImage: p.hero?.coverImage,
                  color: p.colors?.[0]?.hex,
                  parentBrandId: p.parentBrandId || undefined,
                  linkedGuides: p.linkedGuides?.map((g: any) => g.id) || [],
                }))}
                events={filteredEvents.map(e => ({
                  id: e.id,
                  name: e.hero?.name || e.name,
                  slug: e.slug || undefined,
                  type: 'event' as const,
                  updatedAt: e.updatedAt,
                  coverImage: e.hero?.coverImage,
                  color: e.colors?.[0]?.hex,
                  parentBrandId: e.parentBrandId || undefined,
                }))}
              />
            </div>

            {/* Text content */}
            <div className="relative z-10 max-w-lg xl:max-w-xl">
              <div className="flex items-center gap-2 mb-4 sm:mb-6 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                <div 
                  className="px-2.5 sm:px-3 py-1 rounded-full border"
                  style={{ 
                    backgroundColor: `${organization.accentColor || orgColors.primary}10`,
                    borderColor: `${organization.accentColor || orgColors.primary}30`
                  }}
                >
                  <span 
                    className="text-xs font-medium"
                    style={{ color: organization.accentColor || orgColors.primary }}
                  >
                    Brand Portal
                  </span>
                </div>
              </div>
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-semibold text-foreground mb-4 sm:mb-6 leading-tight animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                Welcome to<br />
                <span style={{ color: organization.accentColor || orgColors.primary }}>
                  {organization.name}
                </span>
              </h1>
              <div className="text-base sm:text-xl text-muted-foreground mb-6 sm:mb-8 max-w-md animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
                <AnimatedTagline
                  text={portalSettings.heroTagline || DEFAULT_PORTAL_SETTINGS.heroTagline || 'Explore our public brand guidelines and resources.'}
                  animation={portalSettings.taglineAnimation || 'fade-slide'}
                  hoverEffect={portalSettings.taglineHoverEffect || 'none'}
                  environment={portalSettings.taglineEnvironment || 'none'}
                  delay={400}
                  animateOnMount
                />
              </div>

              {/* Search Bar */}
              <div className="max-w-sm animate-fade-in-up" style={{ animationDelay: '0.35s' }}>
                <SearchInput
                  value={searchQuery}
                  onChange={setSearchQuery}
                  placeholder="Search brands and products..."
                  className="w-full"
                />
                {searchQuery && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Found {totalResults} result{totalResults !== 1 ? 's' : ''} for "{searchQuery}"
                  </p>
                )}
              </div>

              {/* Orbit Legend - compact inline */}
              <div className="hidden md:flex mt-6 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
                <OrbitLegend
                  value={activeTab}
                  onValueChange={handleTabChange}
                  counts={{ brands: brands.length, products: products.length, events: events.length }}
                />
              </div>
            </div>
            
          </div>
        </div>
      </div>

      {/* Content Grid */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 safe-area-inset-bottom border-t border-border/50">
        <Tabs value={activeTab} onValueChange={(v) => handleTabChange(v as typeof activeTab)} className="w-full">
          {/* Desktop tabs - hidden on mobile where we use sticky tabs */}
          <div className="hidden sm:flex items-center justify-between mb-6 sm:mb-8 gap-4">
            <div className="flex-1 overflow-x-auto scrollbar-hide">
              <TabsList className="bg-muted w-max sm:w-auto">
                <TabsTrigger value="all" className="gap-1.5 sm:gap-2 px-3 sm:px-4">
                  All
                  <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-xs">
                    {filteredBrands.length + filteredProducts.length + filteredEvents.length}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="brands" className="gap-1.5 sm:gap-2 px-3 sm:px-4">
                  <Building2 className="h-4 w-4" />
                  Brands
                  <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-xs">
                    {filteredBrands.length}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="products" className="gap-1.5 sm:gap-2 px-3 sm:px-4">
                  <Package className="h-4 w-4" />
                  Products
                  <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-xs">
                    {filteredProducts.length}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="events" className="gap-1.5 sm:gap-2 px-3 sm:px-4">
                  <Calendar className="h-4 w-4" />
                  Events
                  <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-xs">
                    {filteredEvents.length}
                  </Badge>
                </TabsTrigger>
              </TabsList>
            </div>
          </div>

          {/* All Content */}
          <TabsContent value="all" className="space-y-16">
            {showSkeletons && (
              <div className="space-y-12 sm:space-y-16">
                <section>
                  <h2 className="text-lg sm:text-xl font-semibold text-foreground mb-4 sm:mb-6 flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-muted-foreground" />
                    Brand Guidelines
                  </h2>
                  <PortalGridSkeleton count={3} />
                </section>
              </div>
            )}

            {!showSkeletons && filteredBrands.length > 0 && (
              <section>
                <h2 className="text-lg sm:text-xl font-semibold text-foreground mb-4 sm:mb-6 flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-muted-foreground" />
                  Brand Guidelines
                  <Badge variant="secondary" className="ml-2">
                    {filteredBrands.length}
                  </Badge>
                </h2>
                <HierarchicalBrandGrid brands={filteredBrands} orgColors={orgColors} complianceScores={complianceScores} />
                {filteredBrands.length > 6 && activeTab === 'all' && (
                  <div className="mt-6 text-center">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setActiveTab('brands')}
                    >
                      View all brands
                    </Button>
                  </div>
                )}
              </section>
            )}

            {!showSkeletons && filteredProducts.length > 0 && (
              <section>
                <h2 className="text-lg sm:text-xl font-semibold text-foreground mb-4 sm:mb-6 flex items-center gap-2">
                  <Package className="h-5 w-5 text-muted-foreground" />
                  Product Guidelines
                  <Badge variant="secondary" className="ml-2">
                    {filteredProducts.length}
                  </Badge>
                </h2>
                <HierarchicalProductGrid products={filteredProducts} orgColors={orgColors} />
                {filteredProducts.length > 6 && activeTab === 'all' && (
                  <div className="mt-6 text-center">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setActiveTab('products')}
                    >
                      View all products
                    </Button>
                  </div>
                )}
              </section>
            )}

            {!showSkeletons && filteredEvents.length > 0 && (
              <section>
                <h2 className="text-lg sm:text-xl font-semibold text-foreground mb-4 sm:mb-6 flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  Event Brand Kits
                  {eventsPagination.showPagination && (
                    <Badge variant="secondary" className="ml-2">
                      {eventsPagination.startIndex + 1}-{eventsPagination.endIndex} of {eventsPagination.totalItems}
                    </Badge>
                  )}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  {eventsPagination.paginatedItems.map((event, index) => (
                    <HierarchicalEventCard key={event.id} event={event} index={index} orgColors={orgColors} />
                  ))}
                </div>
                {eventsPagination.showPagination && activeTab === 'all' && (
                  <div className="mt-4 text-center">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setActiveTab('events')}
                    >
                      View all {filteredEvents.length} events
                    </Button>
                  </div>
                )}
              </section>
            )}

            {!showSkeletons && totalResults === 0 && (
              <EmptyState searchQuery={searchQuery} type="all" />
            )}
          </TabsContent>

          <TabsContent value="brands">
            {filteredBrands.length === 0 ? (
              <EmptyState searchQuery={searchQuery} type="brands" />
            ) : (
              <HierarchicalBrandGrid brands={filteredBrands} orgColors={orgColors} complianceScores={complianceScores} />
            )}
          </TabsContent>

          <TabsContent value="products">
            {filteredProducts.length === 0 ? (
              <EmptyState searchQuery={searchQuery} type="products" />
            ) : (
              <HierarchicalProductGrid products={filteredProducts} orgColors={orgColors} />
            )}
          </TabsContent>

          <TabsContent value="events">
            {filteredEvents.length === 0 ? (
              <EmptyState 
                searchQuery={searchQuery} 
                type="events" 
                canEdit={canEdit}
                onCreateEvent={handleCreateEvent}
                isCreatingEvent={isCreatingEvent}
              />
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {eventsPagination.paginatedItems.map((event, index) => (
                    <HierarchicalEventCard key={event.id} event={event} index={index} orgColors={orgColors} />
                  ))}
                </div>
                {eventsPagination.showPagination && (
                  <PortalPagination
                    currentPage={eventsPagination.currentPage}
                    totalPages={eventsPagination.totalPages}
                    onPageChange={eventsPagination.goToPage}
                    totalItems={eventsPagination.totalItems}
                    startIndex={eventsPagination.startIndex}
                    endIndex={eventsPagination.endIndex}
                  />
                )}
              </>
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} {organization.name}. All rights reserved.
          </p>
          <div className="flex items-center gap-4 flex-wrap justify-center">
            <a href="/help#faq" className="text-sm text-muted-foreground hover:text-foreground transition-colors">FAQs</a>
            <span className="text-border">·</span>
            <a href="/knowledge" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Knowledge Base</a>
            <span className="text-border">·</span>
            <a href="/help" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Help Center</a>
            {user && (
              <>
                <span className="text-border">·</span>
                <Link to="/color-lab" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors">
                  <Droplets className="h-3.5 w-3.5" />
                  Color Lab
                </Link>
                <span className="text-border">·</span>
                <Link to="/booths" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors">
                  <LayoutGrid className="h-3.5 w-3.5" />
                  Booths
                </Link>
              </>
            )}
          </div>
        </div>
      </footer>

      {/* Admin Quick Actions Panel */}
      {canEdit && <PortalAdminActions organizationSlug={slug} />}

      {/* Brand Assistant Floating Button - Admin only */}
      {canEdit && (
        <>
          <Button
            onClick={() => setAssistantOpen(true)}
            className="fixed bottom-6 left-6 z-50 h-12 w-12 rounded-full shadow-lg bg-primary hover:bg-primary/90 text-primary-foreground p-0"
            aria-label="Open Brand Assistant"
          >
            <Bot className="h-5 w-5" />
          </Button>
          <Suspense fallback={null}>
            <BrandAssistant
              open={assistantOpen}
              onOpenChange={setAssistantOpen}
              entityName={organization.name}
            />
          </Suspense>
        </>
      )}
    </div>
  );
};

// Empty state component
interface EmptyStateProps {
  searchQuery: string;
  type: 'all' | 'brands' | 'products' | 'events';
  canEdit?: boolean;
  onCreateEvent?: () => void;
  isCreatingEvent?: boolean;
}

const EmptyState = ({ searchQuery, type, canEdit, onCreateEvent, isCreatingEvent }: EmptyStateProps) => {
  const typeLabels = {
    all: 'Guidelines',
    brands: 'Brands',
    products: 'Products',
    events: 'Events',
  };

  const Icon = type === 'events' ? Calendar : searchQuery ? Search : Lock;

  return (
    <div className="text-center py-16 px-4">
      <div className="p-4 bg-muted/50 rounded-2xl w-fit mx-auto mb-4">
        <Icon className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-medium text-foreground mb-2">
        {searchQuery ? `No ${typeLabels[type]} Found` : `No Public ${typeLabels[type]}`}
      </h3>
      <p className="text-muted-foreground max-w-md mx-auto">
        {searchQuery 
          ? `No ${typeLabels[type].toLowerCase()} match "${searchQuery}". Try a different search term.`
          : `This organization hasn't made any ${typeLabels[type].toLowerCase()} public yet.`
        }
      </p>
      {type === 'events' && canEdit && onCreateEvent && (
        <Button onClick={onCreateEvent} disabled={isCreatingEvent} className="mt-4 gap-2">
          <Plus className="h-4 w-4" />
          Create Your First Event
        </Button>
      )}
    </div>
  );
};

export default OrganizationPortal;
