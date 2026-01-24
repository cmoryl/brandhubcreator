import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Palette, Star, ExternalLink, Building2, Package, Eye, Sparkles, Type, Image, Layers, CheckCircle, Calendar, MapPin, Users } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { DEMO_BRANDS, DEMO_PRODUCTS, DEMO_EVENTS, DEMO_GRADIENTS, DEMO_INDUSTRIES } from '@/data/demoGuides';

// Demo brands, products, and events showcase for the landing page
const DemoBrandsShowcase = React.forwardRef<HTMLElement, { onLoginClick: () => void }>(({ onLoginClick }, ref) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'brands' | 'products' | 'events'>('brands');

  // Feature highlights for the demo section
  const features = [
    { icon: Palette, label: 'Color Systems', description: 'Complete color palettes with usage guidelines' },
    { icon: Type, label: 'Typography', description: 'Font hierarchies and text styles' },
    { icon: Calendar, label: 'Event Branding', description: 'Signage, banners, and schedules' },
    { icon: Layers, label: 'Logo Variants', description: 'Primary, secondary, and icon versions' },
  ];

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
                  {DEMO_BRANDS.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="products" className="gap-2 px-4 sm:px-6">
                <Package className="h-4 w-4" />
                <span className="hidden sm:inline">Product</span> Guides
                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                  {DEMO_PRODUCTS.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="events" className="gap-2 px-4 sm:px-6">
                <Calendar className="h-4 w-4" />
                <span className="hidden sm:inline">Event</span> Kits
                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs bg-accent/20 text-accent">
                  {DEMO_EVENTS.length}
                </Badge>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="brands" className="mt-8">
            <DemoGuideGrid items={DEMO_BRANDS} type="brand" />
          </TabsContent>
          <TabsContent value="products" className="mt-8">
            <DemoGuideGrid items={DEMO_PRODUCTS} type="product" />
          </TabsContent>
          <TabsContent value="events" className="mt-8">
            <DemoEventGrid />
          </TabsContent>
        </Tabs>

        {/* What's Included Section */}
        <div className="mt-16 bg-card/50 rounded-2xl border border-border p-8">
          <h3 className="text-xl font-semibold text-foreground mb-6 text-center">
            Every Demo Guide Includes
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              'Color Palette',
              'Typography',
              'Logo Variants',
              'Brand Values',
              'Visual Direction',
              'Social Profiles',
              'Gradients',
              'Statistics',
              'Services',
              'QR Codes',
              'Signatures',
              'Templates',
            ].map((item, index) => (
              <div key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle className="h-4 w-4 text-accent flex-shrink-0" />
                <span>{item}</span>
              </div>
            ))}
          </div>
          
          {/* Event-specific features callout */}
          <div className="mt-6 pt-6 border-t border-border/50">
            <h4 className="text-sm font-medium text-foreground mb-3 text-center">Event Brand Kits Also Include</h4>
            <div className="flex flex-wrap justify-center gap-3">
              {['Schedule & Agenda', 'Venue Signage', 'Digital Banners', 'Sponsor Tiers', 'Event History'].map((item, index) => (
                <Badge key={index} variant="outline" className="gap-1">
                  <Calendar className="h-3 w-3" />
                  {item}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-12 text-center bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 rounded-2xl p-8 border border-border">
          <h3 className="text-2xl font-semibold text-foreground mb-3">
            Ready to build your brand?
          </h3>
          <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
            Create professional brand guidelines in minutes. Free to start, powerful features for teams.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Button size="lg" className="gap-2" onClick={onLoginClick}>
              Get Started Free
              <ArrowRight className="h-5 w-5" />
            </Button>
            <Button size="lg" variant="outline" className="gap-2" onClick={onLoginClick}>
              <Sparkles className="h-5 w-5" />
              See All Features
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
});

DemoBrandsShowcase.displayName = 'DemoBrandsShowcase';

// Grid component for demo guides
function DemoGuideGrid({ items, type }: { items: typeof DEMO_BRANDS | typeof DEMO_PRODUCTS; type: 'brand' | 'product' }) {
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
      {items.map((item, index) => {
        const gradientClass = DEMO_GRADIENTS[item.id] || 'from-primary to-accent';
        const industry = DEMO_INDUSTRIES[item.id] || type === 'brand' ? 'Brand Guide' : 'Product Guide';
        const colors = item.colors.slice(0, 4);
        
        return (
          <Card 
            key={item.id}
            className="group overflow-hidden border bg-card shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-1"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <CardContent className="p-0">
              {/* Gradient Header with Cover Image */}
              <div 
                className={`relative h-40 sm:h-48 bg-gradient-to-br ${gradientClass} overflow-hidden`}
              >
                {/* Cover Image Overlay */}
                {item.hero.coverImage && (
                  <div 
                    className="absolute inset-0 bg-cover bg-center opacity-30 group-hover:opacity-40 transition-opacity"
                    style={{ backgroundImage: `url(${item.hero.coverImage})` }}
                  />
                )}
                
                {/* Pattern Overlay */}
                <div className="absolute inset-0 opacity-20">
                  <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                      <pattern id={`pattern-${item.id}`} width="40" height="40" patternUnits="userSpaceOnUse">
                        <circle cx="20" cy="20" r="2" fill="white" />
                      </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill={`url(#pattern-${item.id})`} />
                  </svg>
                </div>
                
                {/* Logo Initial */}
                <div className="absolute bottom-3 left-3 sm:bottom-4 sm:left-4 w-12 h-12 sm:w-16 sm:h-16 bg-white/95 backdrop-blur rounded-xl shadow-lg flex items-center justify-center transform group-hover:scale-110 transition-transform duration-300">
                  <span 
                    className="text-xl sm:text-3xl font-bold"
                    style={{ color: colors[0]?.hex || 'hsl(var(--primary))' }}
                  >
                    {item.hero.name.charAt(0)}
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
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    Demo
                  </Badge>
                </div>
              </div>

              {/* Card Content */}
              <div className="p-4 sm:p-5">
                <div className="mb-3 sm:mb-4">
                  <h3 className="font-semibold text-lg sm:text-xl text-foreground mb-1 line-clamp-1">
                    {item.hero.name}
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">
                    {item.hero.tagline}
                  </p>
                </div>

                {/* Color Swatches */}
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

                {/* Quick Stats - hide on mobile */}
                <div className="hidden sm:flex flex-wrap gap-2 mb-4">
                  {item.typography.length > 0 && (
                    <Badge variant="outline" className="text-xs gap-1">
                      <Type className="h-3 w-3" />
                      {item.typography.length} Fonts
                    </Badge>
                  )}
                  {item.values.length > 0 && (
                    <Badge variant="outline" className="text-xs gap-1">
                      <Layers className="h-3 w-3" />
                      {item.values.length} Values
                    </Badge>
                  )}
                  {item.services.length > 0 && (
                    <Badge variant="outline" className="text-xs gap-1">
                      <Sparkles className="h-3 w-3" />
                      {item.services.length} Services
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
function DemoEventGrid() {
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-1 gap-6">
      {DEMO_EVENTS.map((event, index) => {
        const gradientClass = DEMO_GRADIENTS[event.id] || 'from-violet-500 to-purple-600';
        const industry = DEMO_INDUSTRIES[event.id] || 'Event';
        const colors = event.colors?.slice(0, 4) || [];
        
        return (
          <Card 
            key={event.id}
            className="group overflow-hidden border bg-card shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-1"
          >
            <CardContent className="p-0">
              <div className={`relative h-44 sm:h-56 bg-gradient-to-br ${gradientClass} overflow-hidden`}>
                {event.hero.coverImage && (
                  <div 
                    className="absolute inset-0 bg-cover bg-center opacity-40 group-hover:opacity-50 transition-opacity"
                    style={{ backgroundImage: `url(${event.hero.coverImage})` }}
                  />
                )}
                <div className="absolute inset-0 opacity-20">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[length:20px_20px]" />
                </div>
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
                {event.eventDetails && (
                  <div className="absolute bottom-3 right-3 sm:bottom-4 sm:right-4 bg-black/60 backdrop-blur-sm rounded-lg px-2 py-1.5 sm:px-3 sm:py-2 text-white">
                    <div className="text-[10px] sm:text-xs opacity-80">Event Date</div>
                    <div className="font-semibold text-xs sm:text-sm">{event.eventDetails.eventDates}</div>
                  </div>
                )}
              </div>
              <div className="p-4 sm:p-5">
                <h3 className="font-semibold text-lg sm:text-xl text-foreground mb-1 line-clamp-1">{event.hero.name}</h3>
                <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 mb-3 sm:mb-4">{event.hero.tagline}</p>
                {event.eventDetails && (
                  <div className="flex flex-wrap gap-2 sm:gap-3 mb-3 sm:mb-4 text-xs sm:text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3 sm:h-4 sm:w-4 text-accent" />
                      <span className="line-clamp-1">{event.eventDetails.location}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-3 w-3 sm:h-4 sm:w-4 text-accent" />
                      {event.eventDetails.expectedAttendees?.toLocaleString()}
                    </div>
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
