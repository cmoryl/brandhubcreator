/**
 * BrandHub Index Page
 * Features an interactive orbit visualization showcasing demo brands, products, and events
 */

import { useState, useMemo, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from 'next-themes';
import { ArrowRight, Sparkles, Building2, Package, Calendar, Rocket, Play, Clock, DollarSign, Zap } from 'lucide-react';
import { GlobalAssetOrbit, OrbitLegend } from '@/components/portal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useAuth } from '@/contexts/AuthContext';
import { DEMO_BRANDS, DEMO_PRODUCTS, DEMO_EVENTS, DEMO_GRADIENTS, DEMO_INDUSTRIES } from '@/data/demoGuides';
import { ParticleEmbers } from '@/components/ParticleEmbers';
import { InteractiveCTA } from '@/components/landing/InteractiveCTA';
import brandhubLogo from '@/assets/brandhub-logo.svg';

// Transform demo data to orbit format
const transformToOrbitEntity = (item: any, type: 'brand' | 'product' | 'event') => ({
  id: item.id,
  name: item.hero?.name || item.name,
  slug: item.slug,
  type,
  updatedAt: new Date().toISOString(),
  coverImage: item.hero?.coverImage,
  color: item.colors?.[0]?.hex,
  parentBrandId: item.parentBrandId,
});

const Index = () => {
  const navigate = useNavigate();
  const { resolvedTheme } = useTheme();
  const { user, isAdmin, isApproved, accessStatus } = useAuth();
  const [orbitFilter, setOrbitFilter] = useState<'all' | 'brands' | 'products' | 'events'>('all');
  
  // 3D orbit hover effect state
  const orbitRef = useRef<HTMLDivElement>(null);
  const [orbitRotate, setOrbitRotate] = useState({ x: 0, y: 0 });
  const [isOrbitHovered, setIsOrbitHovered] = useState(false);

  const handleOrbitMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!orbitRef.current) return;
    const rect = orbitRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setOrbitRotate({ x: -y * 15, y: x * 15 });
  }, []);

  const handleOrbitMouseLeave = useCallback(() => {
    setOrbitRotate({ x: 0, y: 0 });
    setIsOrbitHovered(false);
  }, []);

  // Transform demo data for orbit
  const orbitBrands = useMemo(() => 
    DEMO_BRANDS.map(b => transformToOrbitEntity(b, 'brand')), []);
  const orbitProducts = useMemo(() => 
    DEMO_PRODUCTS.map(p => transformToOrbitEntity(p, 'product')), []);
  const orbitEvents = useMemo(() => 
    DEMO_EVENTS.map(e => transformToOrbitEntity(e, 'event')), []);

  // Featured demos for cards below
  const featuredDemos = [
    {
      id: 'demo-brandhub',
      name: 'BrandHub',
      type: 'brand',
      description: 'The platform itself - explore how BrandHub documents its own brand identity',
      gradient: DEMO_GRADIENTS['demo-brandhub'],
      industry: DEMO_INDUSTRIES['demo-brandhub'],
      icon: Rocket,
      path: '/demo/brand/brandhub',
    },
    {
      id: 'demo-nexus-tech',
      name: 'Nexus Tech',
      type: 'brand',
      description: 'A modern tech company brand guide with comprehensive identity system',
      gradient: DEMO_GRADIENTS['demo-nexus-tech'],
      industry: DEMO_INDUSTRIES['demo-nexus-tech'],
      icon: Building2,
      path: '/demo/brand/demo-nexus-tech',
    },
    {
      id: 'demo-nexus-cloud',
      name: 'Nexus Cloud Platform',
      type: 'product',
      description: 'Enterprise cloud product with complete visual guidelines',
      gradient: DEMO_GRADIENTS['demo-nexus-cloud'],
      industry: DEMO_INDUSTRIES['demo-nexus-cloud'],
      icon: Package,
      path: '/demo/product/demo-nexus-cloud',
    },
    {
      id: 'demo-innovation-summit',
      name: 'Innovation Summit 2026',
      type: 'event',
      description: 'Conference event kit with signage, banners, and digital assets',
      gradient: DEMO_GRADIENTS['demo-innovation-summit'],
      industry: DEMO_INDUSTRIES['demo-innovation-summit'],
      icon: Calendar,
      path: '/demo/event/demo-innovation-summit',
    },
  ];

  const handleSignInClick = useCallback(() => {
    // If the user is already authenticated + approved, don't send them to /auth only to immediately redirect back to /.
    // This was perceived as “Sign In does nothing”.
    const hasAccess = !!user && accessStatus === 'ready' && (isAdmin || isApproved);
    navigate(hasAccess ? '/dashboard' : '/auth');
  }, [user, accessStatus, isAdmin, isApproved, navigate]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img 
              src={brandhubLogo} 
              alt="BrandHub" 
              className="h-8 w-auto"
            />
            <span className="font-serif font-semibold text-foreground">BrandHub</span>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Button onClick={handleSignInClick} variant="outline" size="sm">
              Sign In
            </Button>
            <Button onClick={handleSignInClick} size="sm">
              Get Started
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section with Orbit */}
      <section className="relative pt-16 min-h-[85vh] flex items-center overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5" />
        
        {/* Blue Particle Embers Background */}
        <ParticleEmbers 
          count={45} 
          color="hsl(199 89% 48%)" 
          interactive={true}
          className="z-[1]"
        />
        
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse delay-1000" />
          <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-secondary/10 rounded-full blur-3xl animate-pulse delay-500" />
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Left: Text content */}
            <div className="order-2 lg:order-1 text-center lg:text-left">
              <Badge variant="secondary" className="mb-4 gap-1.5">
                <Sparkles className="h-3 w-3" />
                Interactive Brand Guidelines Platform
              </Badge>
              
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
                <span className="text-foreground">Create </span>
                <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent animate-gradient">
                  Living
                </span>
                <br />
                <span className="text-foreground">Brand Guides</span>
              </h1>
              
              <p className="text-lg sm:text-xl text-muted-foreground mb-8 max-w-xl mx-auto lg:mx-0">
                Transform static brand guidelines into dynamic, interactive experiences. 
                Manage brands, products, and events in one unified platform.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Button size="lg" onClick={handleSignInClick} className="gap-2">
                  Start Building
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <Button size="lg" variant="outline" onClick={() => navigate('/demo/brand/brandhub')} className="gap-2">
                  <Play className="h-4 w-4" />
                  View Demo
                </Button>
              </div>

              {/* Stats */}
              <div className="mt-12 grid grid-cols-3 gap-6 max-w-md mx-auto lg:mx-0">
                <div className="text-center lg:text-left">
                  <div className="text-2xl sm:text-3xl font-bold text-foreground">{DEMO_BRANDS.length}</div>
                  <div className="text-sm text-muted-foreground">Demo Brands</div>
                </div>
                <div className="text-center lg:text-left">
                  <div className="text-2xl sm:text-3xl font-bold text-foreground">{DEMO_PRODUCTS.length}</div>
                  <div className="text-sm text-muted-foreground">Products</div>
                </div>
                <div className="text-center lg:text-left">
                  <div className="text-2xl sm:text-3xl font-bold text-foreground">{DEMO_EVENTS.length}</div>
                  <div className="text-sm text-muted-foreground">Events</div>
                </div>
              </div>
            </div>

            {/* Right: Orbit Visualization with 3D Effect */}
            <div className="order-1 lg:order-2 relative">
              <div 
                ref={orbitRef}
                className="relative w-full aspect-square max-w-[600px] mx-auto"
                style={{
                  perspective: '1000px',
                }}
                onMouseMove={handleOrbitMouseMove}
                onMouseEnter={() => setIsOrbitHovered(true)}
                onMouseLeave={handleOrbitMouseLeave}
              >
                {/* 3D Transform Wrapper */}
                <div
                  className="relative w-full h-full transition-transform duration-200 ease-out"
                  style={{
                    transform: `rotateX(${orbitRotate.x}deg) rotateY(${orbitRotate.y}deg)`,
                    transformStyle: 'preserve-3d',
                  }}
                >
                  {/* Glow effect behind orbit */}
                  <div 
                    className="absolute inset-0 rounded-full blur-2xl scale-110 transition-all duration-300"
                    style={{
                      background: isOrbitHovered 
                        ? 'radial-gradient(circle, hsl(var(--primary) / 0.35), hsl(var(--accent) / 0.25), transparent 70%)'
                        : 'linear-gradient(135deg, hsl(var(--primary) / 0.2), transparent, hsl(var(--accent) / 0.2))',
                      transform: `translateZ(-50px) scale(${isOrbitHovered ? 1.15 : 1.1})`,
                    }}
                  />
                  
                  {/* Additional depth layers */}
                  <div 
                    className="absolute inset-4 rounded-full blur-xl transition-opacity duration-300"
                    style={{
                      background: 'radial-gradient(circle, hsl(199 89% 48% / 0.15), transparent 60%)',
                      opacity: isOrbitHovered ? 1 : 0.5,
                      transform: 'translateZ(-25px)',
                    }}
                  />
                  
                  <GlobalAssetOrbit
                    className="w-full h-full"
                    primaryColor="hsl(var(--primary))"
                    secondaryColor="hsl(var(--accent))"
                    organizationName="BrandHub"
                    organizationLogo={brandhubLogo}
                    brands={orbitBrands}
                    products={orbitProducts}
                    events={orbitEvents}
                    filter={orbitFilter}
                    showLegend={true}
                    onFilterChange={setOrbitFilter}
                    demoMode={true}
                  />
                </div>
              </div>
              
              {/* Orbit description */}
              <p className="text-center text-sm text-muted-foreground mt-4">
                Click entities to explore demo guides • Hover to see details
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Demos Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Explore Live Examples</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              See how brands, products, and events come to life with interactive guidelines
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredDemos.map((demo) => {
              const Icon = demo.icon;
              return (
                <button
                  key={demo.id}
                  onClick={() => navigate(demo.path)}
                  className="group relative overflow-hidden rounded-2xl bg-card border border-border hover:border-primary/50 transition-all duration-300 text-left"
                >
                  {/* Gradient header */}
                  <div className={`h-24 bg-gradient-to-br ${demo.gradient} relative overflow-hidden`}>
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
                    <Icon className="absolute bottom-3 right-3 h-8 w-8 text-white/80" />
                  </div>
                  
                  {/* Content */}
                  <div className="p-5">
                    <Badge variant="outline" className="mb-2 text-xs">
                      {demo.industry}
                    </Badge>
                    <h3 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors">
                      {demo.name}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {demo.description}
                    </p>
                    
                    <div className="flex items-center gap-1 mt-4 text-sm text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                      Explore
                      <ArrowRight className="h-4 w-4" />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <Badge variant="secondary" className="mb-4 gap-1.5">
              <Zap className="h-3 w-3" />
              Automate Brand Management
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Save Time & Money</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Eliminate manual brand asset creation and maintenance. Let AI handle the repetitive work while your team focuses on strategy.
            </p>
          </div>

          {/* Value Props Row */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl p-6 border border-primary/20 text-center">
              <Clock className="h-8 w-8 text-primary mx-auto mb-3" />
              <div className="text-3xl font-bold text-foreground mb-1">80%</div>
              <p className="text-sm text-muted-foreground">Less time creating brand assets</p>
            </div>
            <div className="bg-gradient-to-br from-accent/10 to-accent/5 rounded-2xl p-6 border border-accent/20 text-center">
              <DollarSign className="h-8 w-8 text-accent mx-auto mb-3" />
              <div className="text-3xl font-bold text-foreground mb-1">50%</div>
              <p className="text-sm text-muted-foreground">Reduction in design costs</p>
            </div>
            <div className="bg-gradient-to-br from-secondary/20 to-secondary/10 rounded-2xl p-6 border border-secondary/30 text-center">
              <Zap className="h-8 w-8 text-secondary-foreground mx-auto mb-3" />
              <div className="text-3xl font-bold text-foreground mb-1">10x</div>
              <p className="text-sm text-muted-foreground">Faster brand guide creation</p>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-card rounded-2xl p-8 border border-border hover:border-primary/30 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6">
                <Building2 className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Automated Brand Guides</h3>
              <p className="text-muted-foreground">
                AI generates patterns, gradients, and color specs automatically. Upload your logo and watch your brand guide build itself.
              </p>
            </div>

            <div className="bg-card rounded-2xl p-8 border border-border hover:border-primary/30 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mb-6">
                <Package className="h-6 w-6 text-accent" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Smart Product Lines</h3>
              <p className="text-muted-foreground">
                Automatically inherit parent brand assets. Create sub-brands and product guides with one click while maintaining consistency.
              </p>
            </div>

            <div className="bg-card rounded-2xl p-8 border border-border hover:border-primary/30 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-secondary/20 flex items-center justify-center mb-6">
                <Calendar className="h-6 w-6 text-secondary-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Instant Event Kits</h3>
              <p className="text-muted-foreground">
                Generate complete event branding packages in minutes. Signage specs, digital banners, and sponsor materials—all automated.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive CTA Section */}
      <InteractiveCTA />

      {/* Footer */}
      <footer className="py-12 border-t border-border">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <img 
                src={brandhubLogo} 
                alt="BrandHub" 
                className="h-6 w-auto"
              />
              <span className="font-serif font-semibold text-foreground">BrandHub</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} BrandHub. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
