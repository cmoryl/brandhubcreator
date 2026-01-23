import { useState, useEffect, useCallback, useMemo, useRef, lazy, Suspense } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowRight, Globe, Lock, Building2, ArrowLeft, Search, Package, Calendar, Plus, Settings } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ThemeToggle } from '@/components/ThemeToggle';
import { HeroBackground } from '@/components/HeroBackground';
import { AppBreadcrumbs } from '@/components/AppBreadcrumbs';
import { useAuth } from '@/contexts/AuthContext';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useEvents } from '@/contexts/EventContext';
import { useSEO } from '@/hooks/useSEO';
import { useStableLoading } from '@/hooks/useStableLoading';
import { OrganizationPortalSettings, DEFAULT_PORTAL_SETTINGS } from '@/types/organization';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { PublicLoadingScreen } from '@/components/PublicLoadingScreen';
import { SearchInput } from '@/components/ui/search-input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GuideCardSkeleton } from '@/components/ui/guide-card-skeleton';
import { toast } from 'sonner';

// Lazy load admin components
const AppSettingsEditor = lazy(() => import('@/components/admin/AppSettingsEditor').then(m => ({ default: m.AppSettingsEditor })));

interface OrganizationData {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  primary_color: string | null;
  secondary_color: string | null;
  accent_color: string | null;
  portal_settings: OrganizationPortalSettings | null;
}

interface PublicBrand {
  id: string;
  name: string;
  slug: string | null;
  is_public: boolean;
  guide_data: {
    hero?: {
      name: string;
      tagline: string;
      coverImage?: string;
    };
    colors?: Array<{ id: string; hex: string }>;
  };
  updated_at: string;
}

interface PublicProduct {
  id: string;
  name: string;
  slug: string | null;
  is_public: boolean;
  parent_brand_id: string | null;
  guide_data: {
    hero?: {
      name: string;
      tagline: string;
      coverImage?: string;
    };
    colors?: Array<{ id: string; hex: string }>;
    linkedGuides?: Array<{ id: string }>;
  };
  updated_at: string;
}

interface PublicEvent {
  id: string;
  name: string;
  slug: string | null;
  is_public: boolean;
  parent_brand_id: string | null;
  guide_data: {
    hero?: {
      name: string;
      tagline: string;
      coverImage?: string;
    };
    eventDetails?: {
      eventName: string;
      eventDates: string;
      location: string;
    };
    colors?: Array<{ id: string; hex: string }>;
  };
  updated_at: string;
}

const OrganizationPortal = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user, isLoading: authLoading, isAdmin } = useAuth();
  const { organization: contextOrg, isLoading: orgContextLoading, userRole } = useOrganization();
  const { addEvent } = useEvents();
  
  const [organization, setOrganization] = useState<OrganizationData | null>(null);
  const [brands, setBrands] = useState<PublicBrand[]>([]);
  const [products, setProducts] = useState<PublicProduct[]>([]);
  const [events, setEvents] = useState<PublicEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'brands' | 'products' | 'events'>('all');
  const [isCreatingEvent, setIsCreatingEvent] = useState(false);
  
  // Check if user can edit (admin or org member)
  const canEdit = user && (isAdmin || (userRole && ['owner', 'admin', 'member'].includes(userRole)));
  
  // Track if we've already fetched for this slug to avoid duplicate calls
  // Reset when slug changes
  const hasFetchedRef = useRef<string | null>(null);
  
  // Reset hasFetchedRef when slug changes
  useEffect(() => {
    if (slug !== hasFetchedRef.current) {
      hasFetchedRef.current = null;
    }
  }, [slug]);

  // Filter brands and products based on search
  const filteredBrands = useMemo(() => {
    if (!searchQuery.trim()) return brands;
    const query = searchQuery.toLowerCase();
    return brands.filter(brand => {
      const guideData = brand.guide_data || {};
      const hero = guideData.hero || { name: brand.name, tagline: '' };
      return (
        brand.name.toLowerCase().includes(query) ||
        hero.name?.toLowerCase().includes(query) ||
        hero.tagline?.toLowerCase().includes(query)
      );
    });
  }, [brands, searchQuery]);

  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return products;
    const query = searchQuery.toLowerCase();
    return products.filter(product => {
      const guideData = product.guide_data || {};
      const hero = guideData.hero || { name: product.name, tagline: '' };
      return (
        product.name.toLowerCase().includes(query) ||
        hero.name?.toLowerCase().includes(query) ||
        hero.tagline?.toLowerCase().includes(query)
      );
    });
  }, [products, searchQuery]);

  const filteredEvents = useMemo(() => {
    if (!searchQuery.trim()) return events;
    const query = searchQuery.toLowerCase();
    return events.filter(event => {
      const guideData = event.guide_data || {};
      const hero = guideData.hero || { name: event.name, tagline: '' };
      const eventDetails = guideData.eventDetails || { eventName: '', eventDates: '', location: '' };
      return (
        event.name.toLowerCase().includes(query) ||
        hero.name?.toLowerCase().includes(query) ||
        hero.tagline?.toLowerCase().includes(query) ||
        eventDetails.eventName?.toLowerCase().includes(query) ||
        eventDetails.location?.toLowerCase().includes(query)
      );
    });
  }, [events, searchQuery]);

  const totalResults = filteredBrands.length + filteredProducts.length + filteredEvents.length;

  // SEO metadata
  useSEO({
    title: organization ? `${organization.name} Brand Portal` : 'Brand Portal',
    description: organization
      ? `Explore ${organization.name}'s public brand guidelines and resources. Everything you need to represent the brand correctly.`
      : 'Explore public brand guidelines and resources.',
    canonicalUrl: organization ? `${window.location.origin}/org/${organization.slug}` : undefined,
    ogTitle: organization ? `${organization.name} - Brand Portal` : undefined,
    ogDescription: organization
      ? `Official brand guidelines for ${organization.name}. Access logos, colors, typography, and more.`
      : undefined,
    ogImage: organization?.logo_url || undefined,
    ogType: 'website',
  });

  // Main data fetching effect - optimized to use context when available
  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      if (!slug) {
        setError('Organization not found');
        setIsLoading(false);
        return;
      }

      // Skip if we've already successfully fetched for THIS slug
      // Only skip if we have both organization data AND some content (brands, products, or events)
      const hasContent = brands.length > 0 || products.length > 0 || events.length > 0;
      if (hasFetchedRef.current === slug && organization && hasContent) {
        console.log('[PORTAL] Skipping fetch - already have data for slug:', slug);
        setIsLoading(false);
        return;
      }

      console.log('[PORTAL] Starting fetch for slug:', slug, { 
        hasFetchedRef: hasFetchedRef.current,
        hasOrg: !!organization,
        hasContent
      });

      try {
        let orgId: string;
        let orgData: OrganizationData;

        // If user's context org matches the slug and is loaded, use it directly
        if (contextOrg && contextOrg.slug === slug && !orgContextLoading) {
          console.log('[PORTAL] Using context org:', contextOrg.name);
          orgData = {
            id: contextOrg.id,
            name: contextOrg.name,
            slug: contextOrg.slug,
            logo_url: contextOrg.logoUrl,
            primary_color: contextOrg.primaryColor,
            secondary_color: contextOrg.secondaryColor,
            accent_color: contextOrg.accentColor,
            portal_settings: contextOrg.portalSettings as OrganizationPortalSettings | null,
          };
          orgId = contextOrg.id;
        } else {
          // Fetch organization by slug (required for public/different org access)
          console.log('[PORTAL] Fetching org from DB for slug:', slug);
          const { data: fetchedOrg, error: orgError } = await supabase
            .from('organizations')
            .select('id, name, slug, logo_url, primary_color, secondary_color, accent_color, portal_settings')
            .eq('slug', slug)
            .maybeSingle();

          if (cancelled) return;

          if (orgError) {
            console.error('[PORTAL] Error fetching organization:', orgError);
            setError('Unable to load organization');
            setIsLoading(false);
            return;
          }

          if (!fetchedOrg) {
            console.error('[PORTAL] Organization not found for slug:', slug);
            setError('Organization not found');
            setIsLoading(false);
            return;
          }

          console.log('[PORTAL] Fetched org:', fetchedOrg.name);
          orgData = {
            ...fetchedOrg,
            portal_settings: fetchedOrg.portal_settings as OrganizationPortalSettings | null,
          };
          orgId = fetchedOrg.id;
        }

        if (cancelled) return;
        setOrganization(orgData);

        // Fetch brands, products, and events in PARALLEL for faster loading
        console.log('[PORTAL] Fetching content for org:', orgId);
        const [brandsRes, productsRes, eventsRes] = await Promise.all([
          supabase
            .from('brands')
            .select('id, name, slug, is_public, guide_data, updated_at')
            .eq('organization_id', orgId)
            .eq('is_public', true)
            .order('updated_at', { ascending: false }),
          supabase
            .from('products')
            .select('id, name, slug, is_public, parent_brand_id, guide_data, updated_at')
            .eq('organization_id', orgId)
            .eq('is_public', true)
            .order('updated_at', { ascending: false }),
          supabase
            .from('events')
            .select('id, name, slug, is_public, parent_brand_id, guide_data, updated_at')
            .eq('organization_id', orgId)
            .eq('is_public', true)
            .order('updated_at', { ascending: false }),
        ]);

        if (cancelled) return;

        console.log('[PORTAL] Fetched data:', {
          brands: brandsRes.data?.length || 0,
          brandsError: brandsRes.error?.message,
          products: productsRes.data?.length || 0,
          productsError: productsRes.error?.message,
          events: eventsRes.data?.length || 0,
          eventsError: eventsRes.error?.message,
        });

        hasFetchedRef.current = slug; // Track which slug we fetched

        if (brandsRes.error) {
          console.error('[PORTAL] Error fetching brands:', brandsRes.error);
        } else {
          setBrands((brandsRes.data as PublicBrand[]) || []);
        }

        if (productsRes.error) {
          console.error('[PORTAL] Error fetching products:', productsRes.error);
        } else {
          setProducts((productsRes.data as PublicProduct[]) || []);
        }

        if (eventsRes.error) {
          console.error('[PORTAL] Error fetching events:', eventsRes.error);
        } else {
          setEvents((eventsRes.data as PublicEvent[]) || []);
        }

        setError(null);
      } catch (err) {
        if (cancelled) return;
        console.error('[PORTAL] Error:', err);
        setError('Something went wrong');
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    // Start fetching - don't wait for orgContextLoading if we don't have context data yet
    setIsLoading(true);
    fetchData();

    return () => {
      cancelled = true;
    };
  }, [slug, contextOrg, orgContextLoading]);

  // Refetch on tab focus
  const refetch = useCallback(async () => {
    if (!slug || !organization) return;
    
    try {
      const [brandsRes, productsRes, eventsRes] = await Promise.all([
        supabase
          .from('brands')
          .select('id, name, slug, is_public, guide_data, updated_at')
          .eq('organization_id', organization.id)
          .eq('is_public', true)
          .order('updated_at', { ascending: false }),
        supabase
          .from('products')
          .select('id, name, slug, is_public, parent_brand_id, guide_data, updated_at')
          .eq('organization_id', organization.id)
          .eq('is_public', true)
          .order('updated_at', { ascending: false }),
        supabase
          .from('events')
          .select('id, name, slug, is_public, parent_brand_id, guide_data, updated_at')
          .eq('organization_id', organization.id)
          .eq('is_public', true)
          .order('updated_at', { ascending: false }),
      ]);

      if (!brandsRes.error) setBrands((brandsRes.data as PublicBrand[]) || []);
      if (!productsRes.error) setProducts((productsRes.data as PublicProduct[]) || []);
      if (!eventsRes.error) setEvents((eventsRes.data as PublicEvent[]) || []);
    } catch (err) {
      console.error('Error refetching:', err);
    }
  }, [slug, organization]);

  // Debounced refetch on tab focus (prevents duplicate calls from focus + visibility events)
  useEffect(() => {
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;
    
    const debouncedRefetch = () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => refetch(), 300);
    };

    const onFocus = () => debouncedRefetch();
    const onVisibility = () => {
      if (document.visibilityState === 'visible') debouncedRefetch();
    };

    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [refetch]);

  // Stabilize loading to prevent flickers - minimal delay for fast perceived load
  // Use 6 second max timeout as escape hatch
  const stableLoading = useStableLoading(isLoading, 50, 6000);

  if (stableLoading) {
    // Use organization name if available, otherwise capitalize slug
    const displayName = organization?.name || (slug ? slug.charAt(0).toUpperCase() + slug.slice(1) : undefined);
    return <PublicLoadingScreen type="portal" name={displayName} />;
  }

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

  const portalSettings = organization.portal_settings || DEFAULT_PORTAL_SETTINGS;
  const heroFullWidth = portalSettings.heroFullWidth ?? false;

  // Render helper for brand cards
  const renderBrandCard = (brand: PublicBrand, index: number) => {
    const guideData = brand.guide_data || {};
    const hero = guideData.hero || { name: brand.name, tagline: '' };
    const colors = guideData.colors || [];

    return (
      <Card 
        key={brand.id}
        className="group cursor-pointer hover:shadow-2xl transition-all duration-500 overflow-hidden border-0 bg-card shadow-lg"
        style={{ animationDelay: `${index * 0.05}s` }}
        onClick={() => navigate(`/brand/${brand.slug || brand.id}`)}
      >
        <CardContent className="p-0">
          <div className="relative h-44 overflow-hidden">
            {hero.coverImage ? (
              <OptimizedImage 
                src={hero.coverImage} 
                alt={hero.name}
                className="w-full h-full transition-transform duration-500 group-hover:scale-105"
                objectFit="cover"
                priority={index < 3}
              />
            ) : (
              <div className="w-full h-full flex">
                {colors.length > 0 ? (
                  colors.slice(0, 4).map((color: { id: string; hex: string }) => (
                    <div 
                      key={color.id} 
                      className="flex-1 transition-all duration-500 group-hover:flex-[1.1]"
                      style={{ backgroundColor: color.hex }}
                    />
                  ))
                ) : (
                  <div 
                    className="flex-1" 
                    style={{ 
                      background: `linear-gradient(135deg, ${organization.primary_color || '#6366f1'}, ${organization.secondary_color || '#8b5cf6'})` 
                    }}
                  />
                )}
              </div>
            )}
            <Badge className="absolute top-3 right-3 gap-1 bg-green-500/90 text-white">
              <Globe className="h-3 w-3" />
              Public
            </Badge>
          </div>
          <div className="p-5">
            <h3 className="font-semibold text-lg text-foreground mb-1 group-hover:text-accent transition-colors">
              {hero.name}
            </h3>
            {hero.tagline && (
              <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                {hero.tagline}
              </p>
            )}
            {colors.length > 0 && (
              <div className="flex gap-1 mb-4">
                {colors.slice(0, 5).map((color: { id: string; hex: string }) => (
                  <div 
                    key={color.id}
                    className="w-6 h-6 rounded-full border-2 border-background shadow-sm"
                    style={{ backgroundColor: color.hex }}
                  />
                ))}
                {colors.length > 5 && (
                  <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs text-muted-foreground">
                    +{colors.length - 5}
                  </div>
                )}
              </div>
            )}
            <Button variant="ghost" size="sm" className="gap-2 p-0 h-auto text-accent hover:text-accent/80">
              View Guidelines
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  // Render helper for product cards
  const renderProductCard = (product: PublicProduct, index: number) => {
    const guideData = product.guide_data || {};
    const hero = guideData.hero || { name: product.name, tagline: '' };
    const colors = guideData.colors || [];

    return (
      <Card 
        key={product.id}
        className="group cursor-pointer hover:shadow-2xl transition-all duration-500 overflow-hidden border-0 bg-card shadow-lg"
        style={{ animationDelay: `${index * 0.05}s` }}
        onClick={() => navigate(`/product/${product.slug || product.id}`)}
      >
        <CardContent className="p-0">
          <div className="relative h-44 overflow-hidden">
            {hero.coverImage ? (
              <OptimizedImage 
                src={hero.coverImage} 
                alt={hero.name}
                className="w-full h-full transition-transform duration-500 group-hover:scale-105"
                objectFit="cover"
                priority={index < 3}
              />
            ) : (
              <div className="w-full h-full flex">
                {colors.length > 0 ? (
                  colors.slice(0, 4).map((color: { id: string; hex: string }) => (
                    <div 
                      key={color.id} 
                      className="flex-1 transition-all duration-500 group-hover:flex-[1.1]"
                      style={{ backgroundColor: color.hex }}
                    />
                  ))
                ) : (
                  <div 
                    className="flex-1" 
                    style={{ 
                      background: `linear-gradient(135deg, ${organization.primary_color || '#6366f1'}, ${organization.secondary_color || '#8b5cf6'})` 
                    }}
                  />
                )}
              </div>
            )}
            <Badge className="absolute top-3 right-3 gap-1 bg-green-500/90 text-white">
              <Globe className="h-3 w-3" />
              Public
            </Badge>
          </div>
          <div className="p-5">
            <h3 className="font-semibold text-lg text-foreground mb-1 group-hover:text-accent transition-colors">
              {hero.name}
            </h3>
            {hero.tagline && (
              <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                {hero.tagline}
              </p>
            )}
            {colors.length > 0 && (
              <div className="flex gap-1 mb-4">
                {colors.slice(0, 5).map((color: { id: string; hex: string }) => (
                  <div 
                    key={color.id}
                    className="w-6 h-6 rounded-full border-2 border-background shadow-sm"
                    style={{ backgroundColor: color.hex }}
                  />
                ))}
                {colors.length > 5 && (
                  <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs text-muted-foreground">
                    +{colors.length - 5}
                  </div>
                )}
              </div>
            )}
            <Button variant="ghost" size="sm" className="gap-2 p-0 h-auto text-accent hover:text-accent/80">
              View Guidelines
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  // Render helper for event cards
  const renderEventCard = (event: PublicEvent, index: number) => {
    const guideData = event.guide_data || {};
    const hero = guideData.hero || { name: event.name, tagline: '' };
    const eventDetails = guideData.eventDetails || { eventName: '', eventDates: '', location: '' };
    const colors = guideData.colors || [];

    return (
      <Card 
        key={event.id}
        className="group cursor-pointer hover:shadow-2xl transition-all duration-500 overflow-hidden border-0 bg-card shadow-lg"
        style={{ animationDelay: `${index * 0.05}s` }}
        onClick={() => navigate(`/event/${event.slug || event.id}`)}
      >
        <CardContent className="p-0">
          <div className="relative h-44 overflow-hidden">
            {hero.coverImage ? (
              <OptimizedImage 
                src={hero.coverImage} 
                alt={hero.name}
                className="w-full h-full transition-transform duration-500 group-hover:scale-105"
                objectFit="cover"
                priority={index < 3}
              />
            ) : (
              <div className="w-full h-full flex">
                {colors.length > 0 ? (
                  colors.slice(0, 4).map((color: { id: string; hex: string }) => (
                    <div 
                      key={color.id} 
                      className="flex-1 transition-all duration-500 group-hover:flex-[1.1]"
                      style={{ backgroundColor: color.hex }}
                    />
                  ))
                ) : (
                  <div 
                    className="flex-1" 
                    style={{ 
                      background: `linear-gradient(135deg, ${organization.primary_color || '#6366f1'}, ${organization.secondary_color || '#8b5cf6'})` 
                    }}
                  />
                )}
              </div>
            )}
            <Badge className="absolute top-3 right-3 gap-1 bg-green-500/90 text-white">
              <Globe className="h-3 w-3" />
              Public
            </Badge>
            <Badge className="absolute top-3 left-3 gap-1 bg-primary/90 text-primary-foreground">
              <Calendar className="h-3 w-3" />
              Event
            </Badge>
          </div>
          <div className="p-5">
            <h3 className="font-semibold text-lg text-foreground mb-1 group-hover:text-accent transition-colors">
              {hero.name || eventDetails.eventName}
            </h3>
            {eventDetails.eventDates && (
              <p className="text-sm text-muted-foreground mb-1">
                {eventDetails.eventDates}
              </p>
            )}
            {eventDetails.location && (
              <p className="text-sm text-muted-foreground mb-2">
                📍 {eventDetails.location}
              </p>
            )}
            {hero.tagline && (
              <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                {hero.tagline}
              </p>
            )}
            {colors.length > 0 && (
              <div className="flex gap-1 mb-4">
                {colors.slice(0, 5).map((color: { id: string; hex: string }) => (
                  <div 
                    key={color.id}
                    className="w-6 h-6 rounded-full border-2 border-background shadow-sm"
                    style={{ backgroundColor: color.hex }}
                  />
                ))}
                {colors.length > 5 && (
                  <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs text-muted-foreground">
                    +{colors.length - 5}
                  </div>
                )}
              </div>
            )}
            <Button variant="ghost" size="sm" className="gap-2 p-0 h-auto text-accent hover:text-accent/80">
              View Event Kit
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

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

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className={`relative overflow-hidden ${heroFullWidth ? '' : ''}`}>
        <HeroBackground />

        {/* Header - Mobile optimized */}
        <header className="relative z-10 animate-fade-in-down safe-area-inset-top">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 sm:h-20 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
              {organization.logo_url ? (
                <img 
                  src={organization.logo_url} 
                  alt={organization.name} 
                  className="h-8 sm:h-10 w-auto flex-shrink-0" 
                />
              ) : (
                <div 
                  className="p-2 sm:p-2.5 rounded-xl border flex-shrink-0"
                  style={{ 
                    backgroundColor: `${organization.primary_color}20`,
                    borderColor: `${organization.primary_color}40`
                  }}
                >
                  <Building2 
                    className="h-5 w-5 sm:h-6 sm:w-6" 
                    style={{ color: organization.primary_color || 'hsl(var(--accent))' }} 
                  />
                </div>
              )}
              <span className="font-semibold text-lg sm:text-2xl text-foreground truncate">{organization.name}</span>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-3 flex-shrink-0">
              {user && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => navigate('/')}
                  className="gap-1.5 sm:gap-2 h-9 sm:h-8 px-2 sm:px-3 touch-manipulation"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span className="hidden sm:inline">Dashboard</span>
                </Button>
              )}
              {/* App Settings for admins */}
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

        {/* Hero Content - Mobile optimized */}
        <div className={`relative z-10 ${heroFullWidth ? 'px-4 sm:px-6 lg:px-8' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'} pt-4 sm:pt-8 pb-16 sm:pb-24`}>
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 mb-4 sm:mb-6 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
              <div 
                className="px-2.5 sm:px-3 py-1 rounded-full border"
                style={{ 
                  backgroundColor: `${organization.accent_color || organization.primary_color}10`,
                  borderColor: `${organization.accent_color || organization.primary_color}30`
                }}
              >
                <span 
                  className="text-xs font-medium"
                  style={{ color: organization.accent_color || organization.primary_color || 'hsl(var(--accent))' }}
                >
                  Brand Portal
                </span>
              </div>
            </div>
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-semibold text-foreground mb-4 sm:mb-6 leading-tight animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              Welcome to<br />
              <span style={{ color: organization.accent_color || organization.primary_color || 'hsl(var(--accent))' }}>
                {organization.name}
              </span>
            </h1>
            <p className="text-base sm:text-xl text-muted-foreground mb-6 sm:mb-8 max-w-2xl animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
              Explore our public brand guidelines and resources. Everything you need to represent our brand correctly.
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

            {/* Stats - Mobile optimized */}
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

      {/* Brands & Products Grid - Mobile optimized */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 safe-area-inset-bottom">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)} className="w-full">
          <div className="flex items-center justify-between mb-6 sm:mb-8 gap-4">
            {/* Horizontally scrollable tabs on mobile */}
            <div className="flex-1 overflow-x-auto scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
              <TabsList className="bg-muted w-max sm:w-auto">
                <TabsTrigger value="all" className="gap-1.5 sm:gap-2 px-3 sm:px-4 touch-manipulation">
                  All
                  <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-xs">
                    {filteredBrands.length + filteredProducts.length + filteredEvents.length}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="brands" className="gap-1.5 sm:gap-2 px-3 sm:px-4 touch-manipulation">
                  <Building2 className="h-4 w-4 hidden sm:block" />
                  Brands
                  <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-xs">
                    {filteredBrands.length}
                  </Badge>
                </TabsTrigger>
                {products.length > 0 && (
                  <TabsTrigger value="products" className="gap-1.5 sm:gap-2 px-3 sm:px-4 touch-manipulation">
                    <Package className="h-4 w-4 hidden sm:block" />
                    Products
                    <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-xs">
                      {filteredProducts.length}
                    </Badge>
                  </TabsTrigger>
                )}
                <TabsTrigger value="events" className="gap-1.5 sm:gap-2 px-3 sm:px-4 touch-manipulation">
                  <Calendar className="h-4 w-4 hidden sm:block" />
                  Events
                  <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-xs">
                    {filteredEvents.length}
                  </Badge>
                </TabsTrigger>
              </TabsList>
            </div>
            {/* Add Event Button */}
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
            {/* Loading State with Skeletons */}
            {isLoading && brands.length === 0 && products.length === 0 && (
              <div className="space-y-12 sm:space-y-16">
                <section>
                  <h2 className="text-lg sm:text-xl font-semibold text-foreground mb-4 sm:mb-6 flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-muted-foreground" />
                    Brand Guidelines
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    <GuideCardSkeleton count={3} />
                  </div>
                </section>
                <section>
                  <h2 className="text-lg sm:text-xl font-semibold text-foreground mb-4 sm:mb-6 flex items-center gap-2">
                    <Package className="h-5 w-5 text-muted-foreground" />
                    Product Guidelines
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    <GuideCardSkeleton count={3} />
                  </div>
                </section>
              </div>
            )}

            {/* Brands Section */}
            {!isLoading && filteredBrands.length > 0 && (
              <section>
                <h2 className="text-lg sm:text-xl font-semibold text-foreground mb-4 sm:mb-6 flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-muted-foreground" />
                  Brand Guidelines
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  {filteredBrands.map((brand, index) => renderBrandCard(brand, index))}
                </div>
              </section>
            )}

            {/* Products Section */}
            {!isLoading && filteredProducts.length > 0 && (
              <section>
                <h2 className="text-lg sm:text-xl font-semibold text-foreground mb-4 sm:mb-6 flex items-center gap-2">
                  <Package className="h-5 w-5 text-muted-foreground" />
                  Product Guidelines
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  {filteredProducts.map((product, index) => renderProductCard(product, index))}
                </div>
              </section>
            )}

            {/* Events Section */}
            {!isLoading && filteredEvents.length > 0 && (
              <section>
                <h2 className="text-lg sm:text-xl font-semibold text-foreground mb-4 sm:mb-6 flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  Event Brand Kits
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  {filteredEvents.map((event, index) => renderEventCard(event, index))}
                </div>
              </section>
            )}

            {/* Empty State */}
            {!isLoading && filteredBrands.length === 0 && filteredProducts.length === 0 && filteredEvents.length === 0 && (
              <div className="text-center py-16 px-4">
                <div className="p-4 bg-muted/50 rounded-2xl w-fit mx-auto mb-4">
                  {searchQuery ? (
                    <Search className="h-8 w-8 text-muted-foreground" />
                  ) : (
                    <Lock className="h-8 w-8 text-muted-foreground" />
                  )}
                </div>
                <h3 className="text-lg font-medium text-foreground mb-2">
                  {searchQuery ? 'No Results Found' : 'No Public Guidelines'}
                </h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  {searchQuery 
                    ? `No brands, products, or events match "${searchQuery}". Try a different search term.`
                    : "This organization hasn't made any guidelines public yet. Check back later for updates."
                  }
                </p>
              </div>
            )}
          </TabsContent>

          {/* Brands Only */}
          <TabsContent value="brands">
            {filteredBrands.length === 0 ? (
              <div className="text-center py-16 px-4">
                <div className="p-4 bg-muted/50 rounded-2xl w-fit mx-auto mb-4">
                  {searchQuery ? (
                    <Search className="h-8 w-8 text-muted-foreground" />
                  ) : (
                    <Lock className="h-8 w-8 text-muted-foreground" />
                  )}
                </div>
                <h3 className="text-lg font-medium text-foreground mb-2">
                  {searchQuery ? 'No Brands Found' : 'No Public Brands'}
                </h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  {searchQuery 
                    ? `No brands match "${searchQuery}". Try a different search term.`
                    : "This organization hasn't made any brand guidelines public yet."
                  }
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredBrands.map((brand, index) => renderBrandCard(brand, index))}
              </div>
            )}
          </TabsContent>

          {/* Products Only */}
          <TabsContent value="products">
            {filteredProducts.length === 0 ? (
              <div className="text-center py-16 px-4">
                <div className="p-4 bg-muted/50 rounded-2xl w-fit mx-auto mb-4">
                  {searchQuery ? (
                    <Search className="h-8 w-8 text-muted-foreground" />
                  ) : (
                    <Lock className="h-8 w-8 text-muted-foreground" />
                  )}
                </div>
                <h3 className="text-lg font-medium text-foreground mb-2">
                  {searchQuery ? 'No Products Found' : 'No Public Products'}
                </h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  {searchQuery 
                    ? `No products match "${searchQuery}". Try a different search term.`
                    : "This organization hasn't made any product guidelines public yet."
                  }
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.map((product, index) => renderProductCard(product, index))}
              </div>
            )}
          </TabsContent>

          {/* Events Only */}
          <TabsContent value="events">
            {filteredEvents.length === 0 ? (
              <div className="text-center py-16 px-4">
                <div className="p-4 bg-muted/50 rounded-2xl w-fit mx-auto mb-4">
                  {searchQuery ? (
                    <Search className="h-8 w-8 text-muted-foreground" />
                  ) : (
                    <Calendar className="h-8 w-8 text-muted-foreground" />
                  )}
                </div>
                <h3 className="text-lg font-medium text-foreground mb-2">
                  {searchQuery ? 'No Events Found' : 'No Public Events'}
                </h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  {searchQuery 
                    ? `No events match "${searchQuery}". Try a different search term.`
                    : "This organization hasn't made any event brand kits public yet."
                  }
                </p>
                {canEdit && (
                  <Button onClick={handleCreateEvent} disabled={isCreatingEvent} className="mt-4 gap-2">
                    <Plus className="h-4 w-4" />
                    Create Your First Event
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredEvents.map((event, index) => renderEventCard(event, index))}
              </div>
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

export default OrganizationPortal;