/**
 * Organization Portal Page
 * Public-facing portal for organization's brands, products, and events
 * Refactored to use modular hooks and components
 */

import { useState, useEffect, lazy, Suspense, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Globe, Lock, Building2, ArrowLeft, Search, Package, Calendar, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ThemeToggle } from '@/components/ThemeToggle';
import { HeroBackground } from '@/components/HeroBackground';
import { AppBreadcrumbs } from '@/components/AppBreadcrumbs';
import { useAuth } from '@/contexts/AuthContext';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useEvents } from '@/contexts/EventContext';
import { useSEO } from '@/hooks/useSEO';
import { useStableLoading } from '@/hooks/useStableLoading';
import { usePortalData, useFilteredPortalData } from '@/hooks/usePortalData';
import { usePortalPagination } from '@/hooks/usePortalPagination';
import { DEFAULT_PORTAL_SETTINGS } from '@/lib/organization/types';
import { PublicLoadingScreen } from '@/components/PublicLoadingScreen';
import { SearchInput } from '@/components/ui/search-input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PortalBrandCard, PortalProductCard, PortalEventCard, PortalGridSkeleton, PortalPagination } from '@/components/portal';
import { toast } from 'sonner';

// Lazy load admin components
const AppSettingsEditor = lazy(() => import('@/components/admin/AppSettingsEditor').then(m => ({ default: m.AppSettingsEditor })));

const OrganizationPortal = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const { userRole } = useOrganization();
  const { addEvent } = useEvents();
  
  // Use the new portal data hook
  const { organization, brands, products, events, isLoading, error } = usePortalData(slug);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'brands' | 'products' | 'events'>('all');
  const [isCreatingEvent, setIsCreatingEvent] = useState(false);

  // Use the filtering hook
  const { filteredBrands, filteredProducts, filteredEvents, totalResults } = useFilteredPortalData(
    brands,
    products,
    events,
    searchQuery
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
  const stableLoading = useStableLoading(isLoading, {
    showDelay: 100,
    minDisplayTime: 300,
    maxLoadingTime: 6000
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

  // Loading state
  if (stableLoading) {
    const displayName = organization?.name || (slug ? slug.charAt(0).toUpperCase() + slug.slice(1) : undefined);
    return <PublicLoadingScreen type="portal" name={displayName} />;
  }

  // Error state
  if (error || !organization) {
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

  const portalSettings = organization.portalSettings || DEFAULT_PORTAL_SETTINGS;
  const heroFullWidth = portalSettings.heroFullWidth ?? false;
  const orgColors = {
    primary: organization.primaryColor || '#6366f1',
    secondary: organization.secondaryColor || '#8b5cf6',
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <HeroBackground />

        {/* Header */}
        <header className="relative z-10 animate-fade-in-down safe-area-inset-top">
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
              {user && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => navigate('/')}
                  className="gap-1.5 sm:gap-2 h-9 sm:h-8 px-2 sm:px-3"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span className="hidden sm:inline">Dashboard</span>
                </Button>
              )}
              {canEdit && (
                <Suspense fallback={null}>
                  <AppSettingsEditor />
                </Suspense>
              )}
              <Badge variant="outline" className="gap-1 hidden sm:flex">
                <Globe className="h-3 w-3" />
                Public Portal
              </Badge>
              <ThemeToggle />
            </div>
          </div>
        </header>

        {/* Breadcrumbs */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <AppBreadcrumbs
            items={[]}
            currentPage={organization.name}
            currentIcon={Building2}
          />
        </div>

        {/* Hero Content */}
        <div className={`relative z-10 ${heroFullWidth ? 'px-4 sm:px-6 lg:px-8' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'} pt-4 sm:pt-8 pb-16 sm:pb-24`}>
          <div className="max-w-3xl">
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
            <p className="text-base sm:text-xl text-muted-foreground mb-6 sm:mb-8 max-w-2xl animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
              Explore our public brand guidelines and resources.
            </p>

            {/* Search Bar */}
            <div className="max-w-md animate-fade-in-up" style={{ animationDelay: '0.35s' }}>
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

            {/* Stats */}
            <div className="flex items-center gap-6 sm:gap-8 mt-8 sm:mt-12 pt-6 sm:pt-8 border-t border-border/50 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
              <div>
                <p className="text-2xl sm:text-3xl font-semibold text-foreground">{brands.length}</p>
                <p className="text-xs sm:text-sm text-muted-foreground">Public Brands</p>
              </div>
              {products.length > 0 && (
                <div>
                  <p className="text-2xl sm:text-3xl font-semibold text-foreground">{products.length}</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">Public Products</p>
                </div>
              )}
              {events.length > 0 && (
                <div>
                  <p className="text-2xl sm:text-3xl font-semibold text-foreground">{events.length}</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">Public Events</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content Grid */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 safe-area-inset-bottom">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)} className="w-full">
          <div className="flex items-center justify-between mb-6 sm:mb-8 gap-4">
            <div className="flex-1 overflow-x-auto scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
              <TabsList className="bg-muted w-max sm:w-auto">
                <TabsTrigger value="all" className="gap-1.5 sm:gap-2 px-3 sm:px-4">
                  All
                  <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-xs">
                    {filteredBrands.length + filteredProducts.length + filteredEvents.length}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="brands" className="gap-1.5 sm:gap-2 px-3 sm:px-4">
                  <Building2 className="h-4 w-4 hidden sm:block" />
                  Brands
                  <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-xs">
                    {filteredBrands.length}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="products" className="gap-1.5 sm:gap-2 px-3 sm:px-4">
                  <Package className="h-4 w-4 hidden sm:block" />
                  Products
                  <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-xs">
                    {filteredProducts.length}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="events" className="gap-1.5 sm:gap-2 px-3 sm:px-4">
                  <Calendar className="h-4 w-4 hidden sm:block" />
                  Events
                  <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-xs">
                    {filteredEvents.length}
                  </Badge>
                </TabsTrigger>
              </TabsList>
            </div>
            {canEdit && (
              <Button 
                onClick={handleCreateEvent} 
                disabled={isCreatingEvent}
                size="sm"
                className="gap-2 shrink-0"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Add Event</span>
              </Button>
            )}
          </div>

          {/* All Content */}
          <TabsContent value="all" className="space-y-16">
            {isLoading && brands.length === 0 && products.length === 0 && (
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

            {!isLoading && filteredBrands.length > 0 && (
              <section>
                <h2 className="text-lg sm:text-xl font-semibold text-foreground mb-4 sm:mb-6 flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-muted-foreground" />
                  Brand Guidelines
                  {brandsPagination.showPagination && (
                    <Badge variant="secondary" className="ml-2">
                      {brandsPagination.startIndex + 1}-{brandsPagination.endIndex} of {brandsPagination.totalItems}
                    </Badge>
                  )}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  {brandsPagination.paginatedItems.map((brand, index) => (
                    <PortalBrandCard key={brand.id} brand={brand} index={index} orgColors={orgColors} />
                  ))}
                </div>
                {brandsPagination.showPagination && activeTab === 'all' && (
                  <div className="mt-4 text-center">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setActiveTab('brands')}
                    >
                      View all {filteredBrands.length} brands
                    </Button>
                  </div>
                )}
              </section>
            )}

            {!isLoading && filteredProducts.length > 0 && (
              <section>
                <h2 className="text-lg sm:text-xl font-semibold text-foreground mb-4 sm:mb-6 flex items-center gap-2">
                  <Package className="h-5 w-5 text-muted-foreground" />
                  Product Guidelines
                  {productsPagination.showPagination && (
                    <Badge variant="secondary" className="ml-2">
                      {productsPagination.startIndex + 1}-{productsPagination.endIndex} of {productsPagination.totalItems}
                    </Badge>
                  )}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  {productsPagination.paginatedItems.map((product, index) => (
                    <PortalProductCard key={product.id} product={product} index={index} orgColors={orgColors} />
                  ))}
                </div>
                {productsPagination.showPagination && activeTab === 'all' && (
                  <div className="mt-4 text-center">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setActiveTab('products')}
                    >
                      View all {filteredProducts.length} products
                    </Button>
                  </div>
                )}
              </section>
            )}

            {!isLoading && filteredEvents.length > 0 && (
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
                    <PortalEventCard key={event.id} event={event} index={index} orgColors={orgColors} />
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

            {!isLoading && totalResults === 0 && (
              <EmptyState searchQuery={searchQuery} type="all" />
            )}
          </TabsContent>

          <TabsContent value="brands">
            {filteredBrands.length === 0 ? (
              <EmptyState searchQuery={searchQuery} type="brands" />
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {brandsPagination.paginatedItems.map((brand, index) => (
                    <PortalBrandCard key={brand.id} brand={brand} index={index} orgColors={orgColors} />
                  ))}
                </div>
                {brandsPagination.showPagination && (
                  <PortalPagination
                    currentPage={brandsPagination.currentPage}
                    totalPages={brandsPagination.totalPages}
                    onPageChange={brandsPagination.goToPage}
                    totalItems={brandsPagination.totalItems}
                    startIndex={brandsPagination.startIndex}
                    endIndex={brandsPagination.endIndex}
                  />
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="products">
            {filteredProducts.length === 0 ? (
              <EmptyState searchQuery={searchQuery} type="products" />
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {productsPagination.paginatedItems.map((product, index) => (
                    <PortalProductCard key={product.id} product={product} index={index} orgColors={orgColors} />
                  ))}
                </div>
                {productsPagination.showPagination && (
                  <PortalPagination
                    currentPage={productsPagination.currentPage}
                    totalPages={productsPagination.totalPages}
                    onPageChange={productsPagination.goToPage}
                    totalItems={productsPagination.totalItems}
                    startIndex={productsPagination.startIndex}
                    endIndex={productsPagination.endIndex}
                  />
                )}
              </>
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
                    <PortalEventCard key={event.id} event={event} index={index} orgColors={orgColors} />
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} {organization.name}. All rights reserved.
          </p>
        </div>
      </footer>
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
