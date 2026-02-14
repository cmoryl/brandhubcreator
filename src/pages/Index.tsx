/**
 * BrandHub Index Page
 * Features an interactive orbit visualization showcasing demo brands, products, and events
 */

import { useMemo, useEffect, useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Sparkles, Building2, Package, Calendar, Rocket, Play, Clock, DollarSign, Zap, HelpCircle, Scale, Accessibility, ShieldCheck } from 'lucide-react';
import { GlitchText } from '@/components/ui/GlitchText';
import { HeroOrbit } from '@/components/landing/HeroOrbit';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ParallaxCard } from '@/components/ui/parallax-card';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useAuth } from '@/contexts/AuthContext';
import { DEMO_GRADIENTS, DEMO_INDUSTRIES, DEMO_CARD_IMAGES, getOrbitBrands, getOrbitProducts, getOrbitEvents } from '@/data/demoGuides';
import { ParticleEmbers } from '@/components/ParticleEmbers';
import { InteractiveCTA } from '@/components/landing/InteractiveCTA';
import { BrandHubLogo } from '@/components/BrandHubLogo';
import { GetStartedSurveyModal } from '@/components/landing/GetStartedSurveyModal';
import { DemoFirstTimeModal, useFirstTimeDemoPrompt } from '@/components/landing/DemoFirstTimeModal';
import brandhubLogo from '@/assets/brandhub-logo.svg';

const Index = () => {
  const navigate = useNavigate();
  const { user, isAdmin, isApproved, accessStatus, isLoading } = useAuth();
  const [showSurveyModal, setShowSurveyModal] = useState(false);
  const [showDemoModal, setShowDemoModal] = useState(false);
  const [pendingDemo, setPendingDemo] = useState<{ path: string; name: string } | null>(null);
  const { shouldShowPrompt } = useFirstTimeDemoPrompt();

  // Auto-redirect authenticated users to dashboard
  useEffect(() => {
    if (isLoading) return; // Wait for auth to settle
    const hasAccess = !!user && accessStatus === 'ready' && (isAdmin || isApproved);
    if (hasAccess) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, accessStatus, isAdmin, isApproved, isLoading, navigate]);

  // Get orbit entities (lightweight stubs for visualization)
  const orbitBrands = useMemo(() => getOrbitBrands(), []);
  const orbitProducts = useMemo(() => getOrbitProducts(), []);
  const orbitEvents = useMemo(() => getOrbitEvents(), []);

  // Featured demos for cards below
  const featuredDemos = [
    {
      id: 'demo-brandhub',
      name: 'BrandHub',
      type: 'brand',
      description: 'The platform itself - explore how BrandHub documents its own brand identity',
      gradient: DEMO_GRADIENTS['demo-brandhub'],
      industry: DEMO_INDUSTRIES['demo-brandhub'],
      cardImage: DEMO_CARD_IMAGES['demo-brandhub'],
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
      cardImage: DEMO_CARD_IMAGES['demo-nexus-tech'],
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
      cardImage: DEMO_CARD_IMAGES['demo-nexus-cloud'],
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
      cardImage: DEMO_CARD_IMAGES['demo-innovation-summit'],
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

  // Handle demo click - show first-time modal or navigate directly
  const handleDemoClick = useCallback((path: string, name: string) => {
    if (shouldShowPrompt) {
      setPendingDemo({ path, name });
      setShowDemoModal(true);
    } else {
      navigate(path);
    }
  }, [shouldShowPrompt, navigate]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <BrandHubLogo size="md" />
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Button onClick={handleSignInClick} variant="outline" size="sm">
              Sign In
            </Button>
            <Button onClick={() => setShowSurveyModal(true)} size="sm">
              Get Started
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section with Orbit */}
      <section className="relative pt-8 pb-8 min-h-[50vh] flex items-center overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5" />
        
        {/* Blue Particle Embers Background - non-interactive for smooth scrolling */}
        <ParticleEmbers 
          count={35} 
          color="hsl(199 89% 48%)" 
          interactive={false}
          className="z-[1]"
        />
        
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse delay-1000" />
          <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-secondary/10 rounded-full blur-3xl animate-pulse delay-500" />
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          {/* Two-column layout - Text left, Orbit right */}
          <div className="grid md:grid-cols-2 gap-6 md:gap-8 lg:gap-12 items-center">
            {/* Text content - Left side */}
            <div className="text-center md:text-left order-2 md:order-1">
              <Badge variant="secondary" className="mb-4 gap-1.5">
                <Sparkles className="h-3 w-3" />
                AI-Powered Inclusive Brand Architecture
              </Badge>
              
              <h1 className="text-3xl sm:text-4xl md:text-4xl lg:text-5xl xl:text-6xl font-bold tracking-tight mb-4 md:mb-6">
                <span className="text-foreground">Create </span>
                <GlitchText text="Living" glowColor="hsl(199 89% 48%)" />
                <br />
                <GlitchText text="Brand" glowColor="hsl(199 89% 48%)" />
                <span className="text-foreground"> Guides</span>
              </h1>
              
              <p className="text-base sm:text-lg md:text-lg lg:text-xl text-muted-foreground mb-6 md:mb-8 max-w-xl mx-auto md:mx-0">
                Transform static brand guidelines into dynamic, inclusive experiences. 
                Bias awareness, WCAG 2.2 compliance, and AI governance — built in from day one.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center md:justify-start">
                <Button size="lg" onClick={() => setShowSurveyModal(true)} className="gap-2">
                  Start Building
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <Button size="lg" variant="outline" onClick={() => navigate('/demo/brand/brandhub')} className="gap-2 border-accent text-accent hover:bg-accent hover:text-accent-foreground">
                  <Play className="h-4 w-4" />
                  View Demo
                </Button>
              </div>

              {/* Stats - below CTA on left */}
              <div className="mt-8 md:mt-10 grid grid-cols-3 gap-4 md:gap-6 max-w-sm mx-auto md:mx-0">
                <div className="text-center md:text-left">
                  <div className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">{orbitBrands.length}</div>
                  <div className="text-xs sm:text-sm text-muted-foreground">Demo Brands</div>
                </div>
                <div className="text-center md:text-left">
                  <div className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">{orbitProducts.length}</div>
                  <div className="text-xs sm:text-sm text-muted-foreground">Products</div>
                </div>
                <div className="text-center md:text-left">
                  <div className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">{orbitEvents.length}</div>
                  <div className="text-xs sm:text-sm text-muted-foreground">Events</div>
                </div>
              </div>
            </div>

            {/* Orbit Visualization - Right side - tablet optimized */}
            <div className="order-1 md:order-2 flex justify-center md:justify-end">
              <div className="w-full max-w-[320px] sm:max-w-[400px] md:max-w-[380px] lg:max-w-[520px] xl:max-w-[680px]">
                <HeroOrbit
                  className="w-full aspect-square"
                  primaryColor="#6366f1"
                  centerLogo={brandhubLogo}
                  brands={orbitBrands}
                  products={orbitProducts}
                  events={orbitEvents}
                  onEntityClick={(entity) => {
                    const pathPrefix = entity.type === 'brand' ? '/demo/brand' : entity.type === 'product' ? '/demo/product' : '/demo/event';
                    const path = `${pathPrefix}/${entity.slug || entity.id}`;
                    handleDemoClick(path, entity.name);
                  }}
                />
                <p className="text-center text-[10px] md:text-xs text-muted-foreground mt-2 md:mt-3 opacity-70">
                  Click entities to explore • Hover for details
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Demos Section */}
      <section className="py-24 bg-gradient-to-b from-muted/20 via-muted/40 to-muted/20 relative overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-border to-transparent" />
          <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-border to-transparent" />
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        </div>

        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-12 relative z-10">
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-4 gap-1.5 animate-fade-in">
              <Sparkles className="h-3 w-3" />
              Interactive Demos
            </Badge>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-5">
              Explore <GlitchText text="Live" glowColor="hsl(199 89% 48%)" className="text-3xl sm:text-4xl lg:text-5xl" /> Examples
            </h2>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto">
              See how brands, products, and events come to life with interactive guidelines. 
              Click any card to explore a fully-featured demo.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-6 lg:gap-8">
            {featuredDemos.map((demo, index) => {
              const Icon = demo.icon;
              return (
                <ParallaxCard
                  key={demo.id}
                  onClick={() => handleDemoClick(demo.path, demo.name)}
                  imageSrc={demo.cardImage}
                  imageAlt={demo.name}
                  fallbackGradient={demo.gradient}
                  parallaxIntensity={15}
                  scaleOnHover={1.15}
                  priority={index === 0}
                  className="group rounded-3xl bg-card/80 backdrop-blur-sm border border-border/50 hover:border-accent/60 shadow-lg hover:shadow-2xl hover:shadow-accent/10"
                  imageClassName="h-44 sm:h-48"
                  style={{
                    animationDelay: `${index * 100}ms`,
                    animation: 'fadeInUp 0.6s ease-out backwards',
                  }}
                >
                  {/* Icon with glow effect */}
                  <div className="absolute top-44 sm:top-48 -mt-14 right-4 z-10 p-2.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 group-hover:bg-accent/20 group-hover:border-accent/40 transition-all duration-500">
                    <Icon className="h-6 w-6 text-white drop-shadow-lg" />
                  </div>
                  
                  {/* Industry badge overlay */}
                  <div className="absolute top-4 left-4 z-10">
                    <Badge className="bg-black/40 backdrop-blur-md text-white border-white/20 text-xs font-medium">
                      {demo.industry}
                    </Badge>
                  </div>
                  
                  {/* Content */}
                  <div className="p-6 pt-4">
                    <h3 className="font-bold text-xl mb-3 group-hover:text-accent transition-colors duration-300">
                      {demo.name}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                      {demo.description}
                    </p>
                    
                    <div className="flex items-center gap-2 mt-5 text-sm font-medium text-accent translate-x-0 group-hover:translate-x-1 transition-transform duration-300">
                      <span>Explore Demo</span>
                      <ArrowRight className="h-4 w-4" />
                    </div>
                  </div>

                  {/* Hover glow effect */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-3xl ring-1 ring-accent/30" />
                </ParallaxCard>
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
              Inclusive Architecture by Default
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Intelligent <GlitchText text="Performance" glowColor="hsl(199 89% 48%)" className="text-3xl sm:text-4xl" /></h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              From bias-aware AI governance to WCAG 2.2 compliance, every feature is designed to build for everyone by default.
            </p>
          </div>

          {/* Value Props Row */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl p-6 border border-primary/20 text-center">
              <Scale className="h-8 w-8 text-primary mx-auto mb-3" />
              <div className="text-3xl font-bold text-foreground mb-1">12</div>
              <p className="text-sm text-muted-foreground">Deep Intelligence Modules</p>
            </div>
            <div className="bg-gradient-to-br from-accent/10 to-accent/5 rounded-2xl p-6 border border-accent/20 text-center">
              <Accessibility className="h-8 w-8 text-accent mx-auto mb-3" />
              <div className="text-3xl font-bold text-foreground mb-1">WCAG 2.2</div>
              <p className="text-sm text-muted-foreground">Full AA/AAA criteria tracked</p>
            </div>
            <div className="bg-gradient-to-br from-secondary/20 to-secondary/10 rounded-2xl p-6 border border-secondary/30 text-center">
              <ShieldCheck className="h-8 w-8 text-secondary-foreground mx-auto mb-3" />
              <div className="text-3xl font-bold text-foreground mb-1">EAA + 508</div>
              <p className="text-sm text-muted-foreground">Global regulatory compliance</p>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-card rounded-2xl p-8 border border-border hover:border-primary/30 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6">
                <Building2 className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">AI-Powered Brand Guides</h3>
              <p className="text-muted-foreground">
                Oracle Brain aligns intelligence across your portfolio. Bias Awareness Scanner evaluates language, visual, accessibility & AI governance dimensions automatically.
              </p>
            </div>

            <div className="bg-card rounded-2xl p-8 border border-border hover:border-primary/30 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mb-6">
                <Package className="h-6 w-6 text-accent" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Inclusive Product Lines</h3>
              <p className="text-muted-foreground">
                PI&E "Who Else?" framework, WFA 12-area bias litmus test, and Policy-as-Code governance ensure every product is built for everyone.
              </p>
            </div>

            <div className="bg-card rounded-2xl p-8 border border-border hover:border-primary/30 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-secondary/20 flex items-center justify-center mb-6">
                <Calendar className="h-6 w-6 text-secondary-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Accessible Event Kits</h3>
              <p className="text-muted-foreground">
                Universal Event Framework with accessibility checklists, Microsoft Persona Spectrum coverage, and GlobalLink localization — all WCAG 2.2 compliant.
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
            <BrandHubLogo size="sm" />
            
            {/* Footer Links */}
            <div className="flex items-center gap-6">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate('/knowledge')}
                className="text-muted-foreground hover:text-foreground gap-1.5"
              >
                <HelpCircle className="h-4 w-4" />
                FAQ
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate('/demo/brand/brandhub')}
                className="text-muted-foreground hover:text-foreground gap-1.5"
              >
                <Play className="h-4 w-4" />
                Demos
              </Button>
            </div>
            
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} BrandHub. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      {/* Get Started Survey Modal */}
      <GetStartedSurveyModal open={showSurveyModal} onOpenChange={setShowSurveyModal} />

      {/* Demo First Time Modal */}
      {pendingDemo && (
        <DemoFirstTimeModal
          open={showDemoModal}
          onOpenChange={setShowDemoModal}
          targetPath={pendingDemo.path}
          demoName={pendingDemo.name}
        />
      )}
    </div>
  );
};

export default Index;
