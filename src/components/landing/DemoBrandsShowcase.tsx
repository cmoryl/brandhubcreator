import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Palette, Star, Building2, Package, Eye, Sparkles, Type, Layers, Calendar, MapPin, Users, Crown, Zap, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import brandHubLogo from '@/assets/brandhub-logo.png';

interface DemoBrand {
  id: string;
  name: string;
  slug: string;
  type: string;
  guide_data: {
    hero?: { name?: string; tagline?: string };
    colors?: Array<{ name: string; hex: string }>;
    typography?: Array<{ name: string; fontFamily: string }>;
    values?: Array<{ title: string; description: string }>;
    services?: Array<{ title: string; description: string }>;
    eventDetails?: {
      eventDates?: string;
      location?: string;
      expectedAttendees?: number;
    };
  };
  is_active: boolean;
  is_featured: boolean;
  display_order: number;
  gradient_class: string | null;
  industry_label: string | null;
  card_image_url: string | null;
}

// Demo brands, products, and events showcase for the landing page
const DemoBrandsShowcase = React.forwardRef<HTMLElement, { onLoginClick: () => void }>(({ onLoginClick }, ref) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'brands' | 'products' | 'events'>('brands');

  // Fetch demo brands from database
  const { data: demoBrands = [], isLoading } = useQuery({
    queryKey: ['demo-brands-landing'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('demo_brands')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });
      
      if (error) throw error;
      return data as DemoBrand[];
    },
  });

  // Filter by type
  const brands = demoBrands.filter(d => d.type === 'brand');
  const products = demoBrands.filter(d => d.type === 'product');
  const events = demoBrands.filter(d => d.type === 'event');

  // Feature highlights for the demo section
  const features = [
    { icon: Palette, label: 'Color Systems', description: 'Complete color palettes with usage guidelines' },
    { icon: Type, label: 'Typography', description: 'Font hierarchies and text styles' },
    { icon: Calendar, label: 'Event Branding', description: 'Signage, banners, and schedules' },
    { icon: Layers, label: 'Logo Variants', description: 'Primary, secondary, and icon versions' },
  ];

  // BrandHub demo card data (featured brand)
  const brandHubDemo = brands.find(b => b.slug === 'brandhub' && b.is_featured);
  const heroData = brandHubDemo?.guide_data?.hero;
  const colorsData = brandHubDemo?.guide_data?.colors || [];

  return (
    <section ref={ref} className="py-20 bg-gradient-to-b from-background via-muted/30 to-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <Badge variant="outline" className="mb-4 text-accent border-accent/30">
            <Star className="h-3 w-3 mr-1 fill-current" />
            Live Examples
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-semibold text-foreground mb-4">
            Brand Guidelines in Action
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Explore fully-featured demo guides showcasing all the powerful features of BrandHub
          </p>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-accent" />
          </div>
        )}

        {/* Featured BrandHub Demo Card */}
        {brandHubDemo && (
          <div className="mb-12">
            <Card className="overflow-hidden border-2 border-accent/30 bg-gradient-to-br from-card via-accent/5 to-card shadow-xl hover:shadow-2xl transition-all duration-500">
              <CardContent className="p-0">
                <div className="grid md:grid-cols-2 gap-0">
                  {/* Left: Content */}
                  <div className="p-6 sm:p-8 flex flex-col justify-center">
                    <div className="flex items-center gap-3 mb-4">
                      <Badge className="bg-accent text-accent-foreground gap-1">
                        <Crown className="h-3 w-3" />
                        Featured
                      </Badge>
                      <Badge variant="outline" className="gap-1">
                        <Zap className="h-3 w-3" />
                        Platform Demo
                      </Badge>
                    </div>
                    <h3 className="text-2xl sm:text-3xl font-semibold text-foreground mb-3">
                      {heroData?.name || brandHubDemo.name}
                    </h3>
                    <p className="text-muted-foreground mb-6">
                      {heroData?.tagline || 'Your brand. Always alive.'}
                    </p>
                    <div className="flex flex-wrap gap-2 mb-6">
                      {colorsData.slice(0, 5).map((color, i) => (
                        <div 
                          key={i}
                          className="w-8 h-8 rounded-full border-2 border-background shadow-sm"
                          style={{ backgroundColor: color.hex }}
                          title={color.name}
                        />
                      ))}
                    </div>
                    <Button 
                      size="lg"
                      className="gap-2 w-fit"
                      onClick={() => navigate('/demo/brand/brandhub')}
                    >
                      <Eye className="h-5 w-5" />
                      Explore BrandHub Guide
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {/* Right: Visual */}
                  <div className="relative bg-gradient-to-br from-accent/20 via-primary/10 to-accent/20 flex items-center justify-center min-h-[250px] md:min-h-0">
                    <div className="absolute inset-0 opacity-20">
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,hsl(var(--accent)/0.3)_0%,transparent_50%)]" />
                    </div>
                    <div className="relative flex flex-col items-center gap-4 p-8">
                      <img 
                        src={brandHubLogo}
                        alt="BrandHub"
                        className="w-24 h-24 sm:w-32 sm:h-32 object-contain drop-shadow-lg"
                      />
                      <div className="text-center">
                        <p className="text-xl sm:text-2xl font-semibold text-foreground">
                          Brand<span className="text-accent">Hub</span>
                        </p>
                        <p className="text-sm text-muted-foreground">Your brand. Always alive.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Feature Highlights */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          {features.map((feature, index) => (
            <div 
              key={index}
              className="flex flex-col items-center text-center p-4 rounded-xl bg-card/50 border border-border/50 hover:border-accent/30 transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center mb-3">
                <feature.icon className="h-5 w-5 text-accent" />
              </div>
              <p className="font-medium text-foreground text-sm mb-1">{feature.label}</p>
              <p className="text-xs text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>

        {/* Tabs for Brands, Products, and Events */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'brands' | 'products' | 'events')} className="mb-8">
          <div className="flex justify-center">
            <TabsList className="bg-muted/50">
              <TabsTrigger value="brands" className="gap-2 px-4 sm:px-6">
                <Building2 className="h-4 w-4" />
                <span className="hidden sm:inline">Brand</span> Guides
                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                  {brands.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="products" className="gap-2 px-4 sm:px-6">
                <Package className="h-4 w-4" />
                <span className="hidden sm:inline">Product</span> Guides
                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                  {products.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="events" className="gap-2 px-4 sm:px-6">
                <Calendar className="h-4 w-4" />
                <span className="hidden sm:inline">Event</span> Kits
                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs bg-accent/20 text-accent">
                  {events.length}
                </Badge>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="brands" className="mt-8">
            {/* Filter out BrandHub from the grid since it's featured above */}
            <DemoGuideGrid items={brands.filter(b => b.slug !== 'brandhub')} type="brand" />
          </TabsContent>
          <TabsContent value="products" className="mt-8">
            <DemoGuideGrid items={products} type="product" />
          </TabsContent>
          <TabsContent value="events" className="mt-8">
            <DemoEventGrid events={events} />
          </TabsContent>
        </Tabs>

      </div>
    </section>
  );
});

DemoBrandsShowcase.displayName = 'DemoBrandsShowcase';

// Grid component for demo guides
function DemoGuideGrid({ items, type }: { items: DemoBrand[]; type: 'brand' | 'product' }) {
  const navigate = useNavigate();

  if (items.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No {type} guides available yet.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
      {items.map((item, index) => {
        const gradientClass = item.gradient_class || 'from-primary to-accent';
        const industry = item.industry_label || (type === 'brand' ? 'Brand Guide' : 'Product Guide');
        const heroData = item.guide_data?.hero;
        const colors = item.guide_data?.colors?.slice(0, 4) || [];
        const typography = item.guide_data?.typography || [];
        const values = item.guide_data?.values || [];
        const services = item.guide_data?.services || [];
        
        return (
          <Card 
            key={item.id}
            className="group overflow-hidden border bg-card shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-1"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <CardContent className="p-0">
              {/* Card Image Header */}
              <div className="relative h-40 sm:h-48 overflow-hidden">
                {item.card_image_url ? (
                  <img 
                    src={item.card_image_url}
                    alt={heroData?.name || item.name}
                    loading="lazy"
                    decoding="async"
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className={`absolute inset-0 bg-gradient-to-br ${gradientClass}`} />
                )}
                
                {/* Gradient overlay for readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />
                
                {/* Logo Initial */}
                <div className="absolute bottom-3 left-3 sm:bottom-4 sm:left-4 w-12 h-12 sm:w-16 sm:h-16 bg-white/95 backdrop-blur rounded-xl shadow-lg flex items-center justify-center transform group-hover:scale-110 transition-transform duration-300">
                  <span 
                    className="text-xl sm:text-3xl font-bold"
                    style={{ color: colors[0]?.hex || 'hsl(var(--primary))' }}
                  >
                    {(heroData?.name || item.name).charAt(0)}
                  </span>
                </div>

                {/* Type Badge */}
                <Badge className="absolute top-2 right-2 sm:top-3 sm:right-3 bg-white/90 text-foreground shadow-lg gap-1 text-xs">
                  {type === 'brand' ? <Building2 className="h-3 w-3" /> : <Package className="h-3 w-3" />}
                  <span className="hidden sm:inline">{industry}</span>
                </Badge>

                {/* Featured indicator */}
                <div className="absolute top-2 left-2 sm:top-3 sm:left-3">
                  <Badge variant="secondary" className="bg-white/90 text-foreground shadow gap-1 text-xs">
                    <Star className="h-3 w-3 fill-warning text-warning" />
                    Demo
                  </Badge>
                </div>
              </div>

              {/* Card Content */}
              <div className="p-4 sm:p-5">
                <div className="mb-3 sm:mb-4">
                  <h3 className="font-semibold text-lg sm:text-xl text-foreground mb-1 line-clamp-1">
                    {heroData?.name || item.name}
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">
                    {heroData?.tagline || 'Explore this brand guide'}
                  </p>
                </div>

                {/* Color Swatches */}
                {colors.length > 0 && (
                  <div className="flex items-center gap-2 mb-3 sm:mb-4">
                    <div className="flex -space-x-1">
                      {colors.map((color, i) => (
                        <div 
                          key={i}
                          className="w-5 h-5 sm:w-7 sm:h-7 rounded-full border-2 border-background shadow-sm transition-transform hover:scale-110 hover:z-10"
                          style={{ backgroundColor: color.hex }}
                          title={color.name}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-muted-foreground flex-1 flex items-center gap-1">
                      <Palette className="h-3 w-3" />
                      <span className="hidden sm:inline">{colors.length} Brand Colors</span>
                      <span className="sm:hidden">{colors.length}</span>
                    </span>
                  </div>
                )}

                {/* Quick Stats - hide on mobile */}
                <div className="hidden sm:flex flex-wrap gap-2 mb-4">
                  {typography.length > 0 && (
                    <Badge variant="outline" className="text-xs gap-1">
                      <Type className="h-3 w-3" />
                      {typography.length} Fonts
                    </Badge>
                  )}
                  {values.length > 0 && (
                    <Badge variant="outline" className="text-xs gap-1">
                      <Layers className="h-3 w-3" />
                      {values.length} Values
                    </Badge>
                  )}
                  {services.length > 0 && (
                    <Badge variant="outline" className="text-xs gap-1">
                      <Sparkles className="h-3 w-3" />
                      {services.length} Services
                    </Badge>
                  )}
                </div>

                {/* View Button */}
                <Button 
                  className="w-full gap-2 group/btn text-sm" 
                  onClick={() => navigate(`/demo/${type}/${item.slug}`)}
                >
                  <Eye className="h-4 w-4" />
                  View Full Guide
                  <ArrowRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

// Event-specific grid component
function DemoEventGrid({ events }: { events: DemoBrand[] }) {
  const navigate = useNavigate();

  if (events.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No event kits available yet.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6">
      {events.map((event) => {
        const gradientClass = event.gradient_class || 'from-primary to-accent';
        const industry = event.industry_label || 'Event';
        const heroData = event.guide_data?.hero;
        const colors = event.guide_data?.colors?.slice(0, 4) || [];
        const eventDetails = event.guide_data?.eventDetails;
        
        return (
          <Card 
            key={event.id}
            className="group overflow-hidden border bg-card shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-1"
          >
            <CardContent className="p-0">
              <div className="relative h-44 sm:h-56 overflow-hidden">
                {event.card_image_url ? (
                  <img 
                    src={event.card_image_url}
                    alt={heroData?.name || event.name}
                    loading="lazy"
                    decoding="async"
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className={`absolute inset-0 bg-gradient-to-br ${gradientClass}`} />
                )}
                
                {/* Gradient overlay for readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />
                
                <div className="absolute bottom-3 left-3 sm:bottom-4 sm:left-4 w-12 h-12 sm:w-16 sm:h-16 bg-white/95 backdrop-blur rounded-xl shadow-lg flex items-center justify-center">
                  <Calendar className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                </div>
                <Badge className="absolute top-2 right-2 sm:top-3 sm:right-3 bg-white/90 text-foreground shadow-lg gap-1 text-xs">
                  <Calendar className="h-3 w-3" />
                  <span className="hidden sm:inline">{industry}</span>
                </Badge>
                <Badge className="absolute top-2 left-2 sm:top-3 sm:left-3 bg-accent text-accent-foreground shadow gap-1 text-xs">
                  <Sparkles className="h-3 w-3" />
                  New
                </Badge>
                {eventDetails?.eventDates && (
                  <div className="absolute bottom-3 right-3 sm:bottom-4 sm:right-4 bg-black/60 backdrop-blur-sm rounded-lg px-2 py-1.5 sm:px-3 sm:py-2 text-white">
                    <div className="text-[10px] sm:text-xs opacity-80">Event Date</div>
                    <div className="font-semibold text-xs sm:text-sm">{eventDetails.eventDates}</div>
                  </div>
                )}
              </div>
              <div className="p-4 sm:p-5">
                <h3 className="font-semibold text-lg sm:text-xl text-foreground mb-1 line-clamp-1">
                  {heroData?.name || event.name}
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 mb-3 sm:mb-4">
                  {heroData?.tagline || 'Explore this event kit'}
                </p>
                {eventDetails && (
                  <div className="flex flex-wrap gap-2 sm:gap-3 mb-3 sm:mb-4 text-xs sm:text-sm text-muted-foreground">
                    {eventDetails.location && (
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 sm:h-4 sm:w-4 text-accent" />
                        <span className="line-clamp-1">{eventDetails.location}</span>
                      </div>
                    )}
                    {eventDetails.expectedAttendees && (
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3 sm:h-4 sm:w-4 text-accent" />
                        {eventDetails.expectedAttendees.toLocaleString()}
                      </div>
                    )}
                  </div>
                )}
                {colors.length > 0 && (
                  <div className="flex items-center gap-2 mb-3 sm:mb-4">
                    <div className="flex -space-x-1">
                      {colors.map((color, i) => (
                        <div key={i} className="w-5 h-5 sm:w-7 sm:h-7 rounded-full border-2 border-background shadow-sm" style={{ backgroundColor: color.hex }} title={color.name} />
                      ))}
                    </div>
                    <span className="text-xs text-muted-foreground">{colors.length} <span className="hidden sm:inline">Event </span>Colors</span>
                  </div>
                )}
                <Button className="w-full gap-2 group/btn text-sm" onClick={() => navigate(`/demo/event/${event.slug}`)}>
                  <Eye className="h-4 w-4" />
                  View Event Kit
                  <ArrowRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

export { DemoBrandsShowcase };
