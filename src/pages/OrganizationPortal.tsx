import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowRight, Globe, Lock, Building2, ArrowLeft, Search, Package } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ThemeToggle } from '@/components/ThemeToggle';
import { HeroBackground } from '@/components/HeroBackground';
import { useAuth } from '@/contexts/AuthContext';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useSEO } from '@/hooks/useSEO';
import { useStableLoading } from '@/hooks/useStableLoading';
import { OrganizationPortalSettings, DEFAULT_PORTAL_SETTINGS } from '@/types/organization';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { PublicLoadingScreen } from '@/components/PublicLoadingScreen';
import { SearchInput } from '@/components/ui/search-input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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

const OrganizationPortal = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const { organization: contextOrg, isLoading: orgContextLoading } = useOrganization();
  
  const [organization, setOrganization] = useState<OrganizationData | null>(null);
  const [brands, setBrands] = useState<PublicBrand[]>([]);
  const [products, setProducts] = useState<PublicProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'brands' | 'products'>('all');
  
  // Track if we've already fetched for this slug to avoid duplicate calls
  const hasFetchedRef = useRef<string | null>(null);

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

  const totalResults = filteredBrands.length + filteredProducts.length;

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

      // Check if we've already fetched for THIS slug
      if (hasFetchedRef.current === slug) return;

      try {
        let orgId: string;
        let orgData: OrganizationData;

        // If user's context org matches the slug, use it directly (skip network call)
        if (contextOrg && contextOrg.slug === slug && !orgContextLoading) {
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
          const { data: fetchedOrg, error: orgError } = await supabase
            .from('organizations')
            .select('id, name, slug, logo_url, primary_color, secondary_color, accent_color, portal_settings')
            .eq('slug', slug)
            .maybeSingle();

          if (cancelled) return;

          if (orgError) {
            console.error('Error fetching organization:', orgError);
            setError('Unable to load organization');
            setIsLoading(false);
            return;
          }

          if (!fetchedOrg) {
            setError('Organization not found');
            setIsLoading(false);
            return;
          }

          orgData = {
            ...fetchedOrg,
            portal_settings: fetchedOrg.portal_settings as OrganizationPortalSettings | null,
          };
          orgId = fetchedOrg.id;
        }

        if (cancelled) return;
        setOrganization(orgData);

        // Fetch brands and products in PARALLEL for faster loading
        const [brandsRes, productsRes] = await Promise.all([
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
        ]);

        if (cancelled) return;
        hasFetchedRef.current = slug; // Track which slug we fetched

        if (brandsRes.error) {
          console.error('Error fetching brands:', brandsRes.error);
        } else {
          setBrands((brandsRes.data as PublicBrand[]) || []);
        }

        if (productsRes.error) {
          console.error('Error fetching products:', productsRes.error);
        } else {
          setProducts((productsRes.data as PublicProduct[]) || []);
        }

        setError(null);
      } catch (err) {
        if (cancelled) return;
        console.error('Error:', err);
        setError('Something went wrong');
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    // Start fetching immediately for all cases.
    // If user is logged in AND their org context matches the slug, we might be able to skip a network call,
    // but we still start immediately and use whatever data is available.
    // Don't block on orgContextLoading - just fetch with the current state
    setIsLoading(true);
    fetchData();

    return () => {
      cancelled = true;
    };
  }, [slug, contextOrg, orgContextLoading, user]);

  // Refetch on tab focus
  const refetch = useCallback(async () => {
    if (!slug || !organization) return;
    
    try {
      const [brandsRes, productsRes] = await Promise.all([
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
      ]);

      if (!brandsRes.error) setBrands((brandsRes.data as PublicBrand[]) || []);
      if (!productsRes.error) setProducts((productsRes.data as PublicProduct[]) || []);
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
  const stableLoading = useStableLoading(isLoading, 80);

  if (stableLoading) {
    // Capitalize first letter of slug for display
    const displayName = slug ? slug.charAt(0).toUpperCase() + slug.slice(1) : undefined;
    return <PublicLoadingScreen type="portal" organizationName={displayName} />;
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

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className={`relative overflow-hidden ${heroFullWidth ? '' : ''}`}>
        <HeroBackground />

        {/* Header */}
        <header className="relative z-10 animate-fade-in-down">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {organization.logo_url ? (
                <img 
                  src={organization.logo_url} 
                  alt={organization.name} 
                  className="h-10 w-auto" 
                />
              ) : (
                <div 
                  className="p-2.5 rounded-xl border"
                  style={{ 
                    backgroundColor: `${organization.primary_color}20`,
                    borderColor: `${organization.primary_color}40`
                  }}
                >
                  <Building2 
                    className="h-6 w-6" 
                    style={{ color: organization.primary_color || 'hsl(var(--accent))' }} 
                  />
                </div>
              )}
              <span className="font-semibold text-2xl text-foreground">{organization.name}</span>
            </div>
            <div className="flex items-center gap-3">
              {user && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => navigate('/')}
                  className="gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Dashboard
                </Button>
              )}
              <Badge variant="outline" className="gap-1">
                <Globe className="h-3 w-3" />
                Public Portal
              </Badge>
              <ThemeToggle />
            </div>
          </div>
        </header>

        {/* Hero Content */}
        <div className={`relative z-10 ${heroFullWidth ? 'px-4 sm:px-6 lg:px-8' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'} pt-12 pb-24`}>
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 mb-6 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
              <div 
                className="px-3 py-1 rounded-full border"
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
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold text-foreground mb-6 leading-tight animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              Welcome to<br />
              <span style={{ color: organization.accent_color || organization.primary_color || 'hsl(var(--accent))' }}>
                {organization.name}
              </span>
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground mb-8 max-w-2xl animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
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

            {/* Stats */}
            <div className="flex items-center gap-8 mt-12 pt-8 border-t border-border/50 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
              <div>
                <p className="text-3xl font-semibold text-foreground">{brands.length}</p>
                <p className="text-sm text-muted-foreground">Public Brands</p>
              </div>
              {products.length > 0 && (
                <div>
                  <p className="text-3xl font-semibold text-foreground">{products.length}</p>
                  <p className="text-sm text-muted-foreground">Public Products</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Brands & Products Grid */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)} className="w-full">
          <div className="flex items-center justify-between mb-8">
            <TabsList className="bg-muted">
              <TabsTrigger value="all" className="gap-2">
                All
                <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-xs">
                  {filteredBrands.length + filteredProducts.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="brands" className="gap-2">
                <Building2 className="h-4 w-4" />
                Brands
                <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-xs">
                  {filteredBrands.length}
                </Badge>
              </TabsTrigger>
              {products.length > 0 && (
                <TabsTrigger value="products" className="gap-2">
                  <Package className="h-4 w-4" />
                  Products
                  <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-xs">
                    {filteredProducts.length}
                  </Badge>
                </TabsTrigger>
              )}
            </TabsList>
          </div>

          {/* All Content */}
          <TabsContent value="all" className="space-y-16">
            {/* Brands Section */}
            {filteredBrands.length > 0 && (
              <section>
                <h2 className="text-xl font-semibold text-foreground mb-6 flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-muted-foreground" />
                  Brand Guidelines
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredBrands.map((brand, index) => renderBrandCard(brand, index))}
                </div>
              </section>
            )}

            {/* Products Section */}
            {filteredProducts.length > 0 && (
              <section>
                <h2 className="text-xl font-semibold text-foreground mb-6 flex items-center gap-2">
                  <Package className="h-5 w-5 text-muted-foreground" />
                  Product Guidelines
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredProducts.map((product, index) => renderProductCard(product, index))}
                </div>
              </section>
            )}

            {/* Empty State */}
            {filteredBrands.length === 0 && filteredProducts.length === 0 && (
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
                    ? `No brands or products match "${searchQuery}". Try a different search term.`
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