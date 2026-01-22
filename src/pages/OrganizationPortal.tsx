import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight, Globe, Lock, Building2, ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ThemeToggle } from '@/components/ThemeToggle';
import { HeroBackground } from '@/components/HeroBackground';
import { useAuth } from '@/contexts/AuthContext';
import { useSEO } from '@/hooks/useSEO';
import { OrganizationPortalSettings, DEFAULT_PORTAL_SETTINGS } from '@/types/organization';
import { OptimizedImage } from '@/components/ui/optimized-image';

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
  const { user } = useAuth();
  const [organization, setOrganization] = useState<OrganizationData | null>(null);
  const [brands, setBrands] = useState<PublicBrand[]>([]);
  const [products, setProducts] = useState<PublicProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  // Main data fetching effect
  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      if (!slug) {
        setError('Organization not found');
        setIsLoading(false);
        return;
      }

      try {
        // Fetch organization by slug
        const { data: orgData, error: orgError } = await supabase
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

        if (!orgData) {
          setError('Organization not found');
          setIsLoading(false);
          return;
        }

        setOrganization({
          ...orgData,
          portal_settings: orgData.portal_settings as OrganizationPortalSettings | null,
        });

        // Fetch public brands for this organization
        const { data: brandsData, error: brandsError } = await supabase
          .from('brands')
          .select('id, name, slug, is_public, guide_data, updated_at')
          .eq('organization_id', orgData.id)
          .eq('is_public', true)
          .order('updated_at', { ascending: false });

        if (cancelled) return;

        if (brandsError) {
          console.error('Error fetching brands:', brandsError);
        } else {
          setBrands((brandsData as PublicBrand[]) || []);
        }

        // Fetch public products for this organization
        const { data: productsData, error: productsError } = await supabase
          .from('products')
          .select('id, name, slug, is_public, parent_brand_id, guide_data, updated_at')
          .eq('organization_id', orgData.id)
          .eq('is_public', true)
          .order('updated_at', { ascending: false });

        if (cancelled) return;

        if (productsError) {
          console.error('Error fetching products:', productsError);
        } else {
          setProducts((productsData as PublicProduct[]) || []);
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

    setIsLoading(true);
    fetchData();

    return () => {
      cancelled = true;
    };
  }, [slug]);

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

  useEffect(() => {
    const onFocus = () => refetch();
    const onVisibility = () => {
      if (document.visibilityState === 'visible') refetch();
    };

    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [refetch]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="p-4 bg-accent/10 rounded-2xl w-fit mx-auto animate-pulse">
            <Sparkles className="h-8 w-8 text-accent" />
          </div>
          <p className="text-muted-foreground">Loading portal...</p>
        </div>
      </div>
    );
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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-16">
        {/* Brands Section */}
        <section>
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-semibold text-foreground">Brand Guidelines</h2>
          </div>

          {brands.length === 0 ? (
            <div className="text-center py-16 px-4">
              <div className="p-4 bg-muted/50 rounded-2xl w-fit mx-auto mb-4">
                <Lock className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium text-foreground mb-2">No Public Brands</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                This organization hasn't made any brand guidelines public yet. Check back later for updates.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {brands.map((brand, index) => {
                const guideData = brand.guide_data || {};
                const hero = guideData.hero || { name: brand.name, tagline: '' };
                const colors = guideData.colors || [];

                return (
                <Card 
                  key={brand.id}
                  className="group cursor-pointer hover:shadow-2xl transition-all duration-500 overflow-hidden border-0 bg-card shadow-lg"
                  style={{ animationDelay: `${index * 0.1}s` }}
                  onClick={() => navigate(`/brand/${brand.slug || brand.id}`)}
                >
                  <CardContent className="p-0">
                    {/* Cover Image / Color Preview */}
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
                      
                      {/* Public Badge */}
                      <Badge className="absolute top-3 right-3 gap-1 bg-green-500/90 text-white">
                        <Globe className="h-3 w-3" />
                        Public
                      </Badge>
                    </div>

                    {/* Brand Info */}
                    <div className="p-5">
                      <h3 className="font-semibold text-lg text-foreground mb-1 group-hover:text-accent transition-colors">
                        {hero.name}
                      </h3>
                      {hero.tagline && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                          {hero.tagline}
                        </p>
                      )}
                      
                      {/* Color Preview */}
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
            })}
          </div>
        )}
      </section>

        {/* Products Section */}
        {products.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-semibold text-foreground">Product Guidelines</h2>
            </div>

            {(() => {
              // Organize products into parent/sub-product hierarchy
              const parentProducts = products.filter(p => {
                const linkedGuides = p.guide_data?.linkedGuides || [];
                return linkedGuides.length > 0 || !p.parent_brand_id;
              });
              
              const getSubProducts = (parentId: string) => {
                return products.filter(p => {
                  // Check if this product is linked from the parent
                  const parent = products.find(pp => pp.id === parentId);
                  const linkedIds = (parent?.guide_data?.linkedGuides || []).map((lg: { id: string }) => lg.id);
                  return linkedIds.includes(p.id);
                });
              };

              return (
                <div className="space-y-8">
                  {parentProducts.map((product, index) => {
                    const guideData = product.guide_data || {};
                    const hero = guideData.hero || { name: product.name, tagline: '' };
                    const colors = guideData.colors || [];
                    const subProducts = getSubProducts(product.id);
                    const hasSubProducts = subProducts.length > 0;

                    return (
                      <div key={product.id} className="space-y-4">
                        {/* Parent Product Card */}
                        <Card 
                          className={`group cursor-pointer hover:shadow-2xl transition-all duration-500 overflow-hidden border-0 bg-card shadow-lg ${hasSubProducts ? 'ring-2 ring-accent/30' : ''}`}
                          style={{ animationDelay: `${index * 0.1}s` }}
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
                              
                              {hasSubProducts && (
                                <Badge className="absolute top-3 left-3 gap-1 bg-accent/90 text-white">
                                  {subProducts.length} Sub-products
                                </Badge>
                              )}
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

                        {/* Sub-Products Grid */}
                        {hasSubProducts && (
                          <div className="ml-6 pl-6 border-l-2 border-accent/30">
                            <p className="text-sm text-muted-foreground mb-4">Sub-products</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                              {subProducts.map((subProduct) => {
                                const subGuideData = subProduct.guide_data || {};
                                const subHero = subGuideData.hero || { name: subProduct.name, tagline: '' };
                                const subColors = subGuideData.colors || [];

                                return (
                                  <Card 
                                    key={subProduct.id}
                                    className="group cursor-pointer hover:shadow-lg transition-all duration-300 overflow-hidden border bg-card/50"
                                    onClick={() => navigate(`/product/${subProduct.slug || subProduct.id}`)}
                                  >
                                    <CardContent className="p-0">
                                      <div className="relative h-24 overflow-hidden">
                                        {subHero.coverImage ? (
                                          <OptimizedImage 
                                            src={subHero.coverImage} 
                                            alt={subHero.name}
                                            className="w-full h-full transition-transform duration-300 group-hover:scale-105"
                                            objectFit="cover"
                                          />
                                        ) : (
                                          <div className="w-full h-full flex">
                                            {subColors.length > 0 ? (
                                              subColors.slice(0, 3).map((color: { id: string; hex: string }) => (
                                                <div 
                                                  key={color.id} 
                                                  className="flex-1"
                                                  style={{ backgroundColor: color.hex }}
                                                />
                                              ))
                                            ) : (
                                              <div 
                                                className="flex-1" 
                                                style={{ 
                                                  background: `linear-gradient(135deg, ${organization.primary_color || '#6366f1'}, ${organization.accent_color || '#f59e0b'})` 
                                                }}
                                              />
                                            )}
                                          </div>
                                        )}
                                      </div>

                                      <div className="p-3">
                                        <h4 className="font-medium text-sm text-foreground group-hover:text-accent transition-colors truncate">
                                          {subHero.name}
                                        </h4>
                                        {subHero.tagline && (
                                          <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                                            {subHero.tagline}
                                          </p>
                                        )}
                                      </div>
                                    </CardContent>
                                  </Card>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </section>
        )}
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