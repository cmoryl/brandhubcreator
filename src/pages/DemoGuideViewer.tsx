import { useState, useCallback, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Star, Building2, Package, Calendar, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ThemeToggle } from '@/components/ThemeToggle';
import { FullBrandPage } from '@/components/brand/FullBrandPage';
import { FullEventPage } from '@/components/event/FullEventPage';
import { MobileSectionNav } from '@/components/brand/MobileSectionNav';
import { MobileEventSectionNav } from '@/components/event/MobileEventSectionNav';
import { AppBreadcrumbs } from '@/components/AppBreadcrumbs';
import { BackToTopButton } from '@/components/BackToTopButton';
import { DemoTour, StartTourButton } from '@/components/demo/DemoTour';
import { getTourSteps } from '@/data/demoTourSteps';
import { DEMO_BRANDS, DEMO_PRODUCTS, DEMO_EVENTS, DEMO_INDUSTRIES } from '@/data/demoGuides';
import type { BrandGuide, ProductGuide, SectionId } from '@/types/brand';
import type { EventGuide, EventSectionId } from '@/types/event';

// Demo guide viewer page - renders static demo data for brands, products, and events
export default function DemoGuideViewer() {
  const { type, slug } = useParams<{ type: 'brand' | 'product' | 'event'; slug: string }>();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState<SectionId | null>(null);
  const [activeEventSection, setActiveEventSection] = useState<EventSectionId | null>(null);
  const [scrollToSection, setScrollToSection] = useState<SectionId | null>(null);
  const [scrollToEventSection, setScrollToEventSection] = useState<EventSectionId | null>(null);
  const [isTourOpen, setIsTourOpen] = useState(false);

  const tourSteps = getTourSteps(type || 'brand');

  // Find the initial demo guide based on type
  const initialDemoGuide = useMemo(() => {
    if (type === 'brand') {
      return DEMO_BRANDS.find(b => b.slug === slug);
    } else if (type === 'product') {
      return DEMO_PRODUCTS.find(p => p.slug === slug);
    } else if (type === 'event') {
      return DEMO_EVENTS.find(e => e.slug === slug);
    }
    return undefined;
  }, [type, slug]);

  // Local state for demo guide data (allows editing without persistence)
  const [demoGuideData, setDemoGuideData] = useState<typeof initialDemoGuide>(initialDemoGuide);

  // Reset data when switching demos
  useEffect(() => {
    setDemoGuideData(initialDemoGuide);
  }, [initialDemoGuide]);

  // Use demoGuideData for rendering (aliased as demoGuide for compatibility)
  const demoGuide = demoGuideData;

  const sectionOrder = (demoGuide?.sectionOrder || []) as SectionId[];
  const isEvent = type === 'event';

  // Handle updates to the demo guide (local only, not persisted)
  const handleBrandUpdate = useCallback((updates: Partial<BrandGuide | ProductGuide>) => {
    setDemoGuideData(prev => prev ? { ...prev, ...updates } as typeof prev : prev);
  }, []);

  const handleEventUpdate = useCallback((updates: Partial<EventGuide>) => {
    setDemoGuideData(prev => prev ? { ...prev, ...updates } as typeof prev : prev);
  }, []);

  const handleSectionSelect = useCallback((sectionId: SectionId) => {
    setScrollToSection(sectionId);
    // Clear after a short delay to allow re-selection of the same section
    setTimeout(() => setScrollToSection(null), 100);
  }, []);

  const handleEventSectionSelect = useCallback((sectionId: EventSectionId) => {
    setScrollToEventSection(sectionId);
    setTimeout(() => setScrollToEventSection(null), 100);
  }, []);

  const handleSectionVisible = useCallback((sectionId: SectionId) => {
    setActiveSection(sectionId);
  }, []);

  const handleEventSectionVisible = useCallback((sectionId: EventSectionId) => {
    setActiveEventSection(sectionId);
  }, []);

  if (!demoGuide) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-foreground mb-4">Demo Guide Not Found</h1>
          <p className="text-muted-foreground mb-6">The demo guide you're looking for doesn't exist.</p>
          <Button onClick={() => navigate('/')} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  // Convert demo data to full guide format with dates
  const fullGuide = {
    ...demoGuide,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as BrandGuide | ProductGuide | EventGuide;

  const industry = DEMO_INDUSTRIES[demoGuide.id] || (
    type === 'brand' ? 'Brand Guide' : 
    type === 'product' ? 'Product Guide' : 
    'Event Kit'
  );

  const getTypeIcon = () => {
    switch (type) {
      case 'brand': return <Building2 className="h-3 w-3" />;
      case 'product': return <Package className="h-3 w-3" />;
      case 'event': return <Calendar className="h-3 w-3" />;
      default: return <Building2 className="h-3 w-3" />;
    }
  };

  const getTypeLabel = () => {
    switch (type) {
      case 'brand': return 'Brand Guides';
      case 'product': return 'Product Guides';
      case 'event': return 'Event Kits';
      default: return 'Demo Guides';
    }
  };

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Demo Header Banner - Compact on mobile */}
      <div className="sticky top-0 z-50 bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 border-b border-border backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-12 sm:h-14 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 sm:gap-3 min-w-0">
            <Button variant="ghost" size="sm" onClick={() => navigate('/')} className="gap-1 sm:gap-2 shrink-0 h-8 sm:h-9 px-2 sm:px-3">
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Back</span>
            </Button>
            <div className="h-5 w-px bg-border hidden sm:block" />
            <Badge variant="secondary" className="gap-1 shrink-0 text-xs h-6">
              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
              <span className="hidden xs:inline">Demo</span>
            </Badge>
            <Badge variant="outline" className="gap-1 hidden md:flex text-xs">
              {getTypeIcon()}
              {industry}
            </Badge>
            {isEvent && (
              <Badge className="bg-accent text-accent-foreground gap-1 hidden lg:flex text-xs">
                <Calendar className="h-3 w-3" />
                Event Kit
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1.5 sm:gap-3">
            <StartTourButton onClick={() => setIsTourOpen(true)} stepCount={tourSteps.length} />
            <ThemeToggle />
            <Button size="sm" onClick={() => window.location.href = 'mailto:support@brandhub.com?subject=BrandHub Demo Request'} className="gap-1 sm:gap-2 h-8 sm:h-9 px-2 sm:px-4 text-xs sm:text-sm">
              <span className="hidden sm:inline">Get Started</span>
              <span className="sm:hidden">Contact</span>
              <ExternalLink className="h-3 w-3 sm:h-4 sm:w-4 hidden sm:block" />
            </Button>
          </div>
        </div>
      </div>

      {/* Breadcrumbs - Hidden on mobile for cleaner look */}
      <div className="hidden sm:block max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <AppBreadcrumbs
          items={[
            { label: 'Demo Guides', icon: Star, href: '/' },
            { label: getTypeLabel(), icon: type === 'brand' ? Building2 : type === 'product' ? Package : Calendar, href: '/' },
          ]}
          currentPage={demoGuide.hero.name}
        />
      </div>

      {/* Page Content - Use different component for events */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-4 sm:pt-0 pb-6 sm:pb-8">
        {isEvent ? (
          <FullEventPage
            event={fullGuide as EventGuide}
            eventId={demoGuide.id}
            onEventUpdate={handleEventUpdate}
            sectionOrder={(demoGuide.sectionOrder || []) as EventSectionId[]}
            hiddenSections={[]}
            isAdmin={true}
            heroFullWidth={true}
            canEdit={true}
            scrollToSection={scrollToEventSection}
            onSectionVisible={handleEventSectionVisible}
          />
        ) : (
          <FullBrandPage
            brand={fullGuide as BrandGuide | ProductGuide}
            brandId={demoGuide.id}
            onBrandUpdate={handleBrandUpdate}
            sectionOrder={sectionOrder}
            scrollToSection={scrollToSection}
            onSectionVisible={handleSectionVisible}
            hiddenSections={[]}
            isAdmin={true}
            heroFullWidth={true}
            canEdit={true}
          />
        )}
      </div>

      {/* Mobile Section Navigation */}
      {isEvent ? (
        <MobileEventSectionNav
          sectionOrder={(demoGuide.sectionOrder || []) as EventSectionId[]}
          hiddenSections={[]}
          activeSection={activeEventSection || undefined}
          onSectionSelect={handleEventSectionSelect}
          eventName={demoGuide.hero.name}
        />
      ) : (
        <MobileSectionNav
          sectionOrder={sectionOrder}
          hiddenSections={[]}
          activeSection={activeSection || undefined}
          onSectionSelect={handleSectionSelect}
          brandName={demoGuide.hero.name}
        />
      )}

      {/* Bottom CTA Banner */}
      <div className="bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-12 text-center">
          <h3 className="text-lg sm:text-2xl font-semibold text-foreground mb-2 sm:mb-3">
            Like what you see?
          </h3>
          <p className="text-muted-foreground mb-4 sm:mb-6 max-w-xl mx-auto text-sm sm:text-base">
            {isEvent 
              ? 'Create your own professional event brand kits with all the features you\'ve just explored.'
              : 'Create your own professional brand guidelines with all the features you\'ve just explored.'
            }
          </p>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 justify-center">
            <Button size="lg" onClick={() => window.location.href = 'mailto:support@brandhub.com?subject=BrandHub Demo Request'} className="gap-2 h-11 sm:h-12">
              Request a Demo
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate('/')} className="h-11 sm:h-12">
              Explore More Demos
            </Button>
          </div>
        </div>
      </div>

      {/* Back to Top Button */}
      <BackToTopButton />

      {/* Interactive Tour */}
      <DemoTour
        steps={tourSteps}
        isOpen={isTourOpen}
        onClose={() => setIsTourOpen(false)}
      />
    </div>
  );
}
