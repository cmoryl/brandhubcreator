import { useState, useCallback, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Save, RefreshCw, Star, Building2, Package, Calendar, Settings, Undo2, Eye, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ThemeToggle } from '@/components/ThemeToggle';
import { FullBrandPage } from '@/components/brand/FullBrandPage';
import { FullEventPage } from '@/components/event/FullEventPage';
import { MobileSectionNav } from '@/components/brand/MobileSectionNav';
import { MobileEventSectionNav } from '@/components/event/MobileEventSectionNav';
import { AppBreadcrumbs } from '@/components/AppBreadcrumbs';
import { BackToTopButton } from '@/components/BackToTopButton';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { normalizeSectionOrder, normalizeHiddenSections } from '@/lib/sectionOrder';
import type { BrandGuide, ProductGuide, SectionId } from '@/types/brand';
import type { EventGuide, EventSectionId } from '@/types/event';
import type { Json } from '@/integrations/supabase/types';

// Page transition animation
const pageTransition = {
  initial: { opacity: 0, y: 20 },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
    },
  },
};

interface DemoBrandData {
  id: string;
  name: string;
  slug: string;
  type: string;
  industry_label: string | null;
  gradient_class: string | null;
  card_image_url: string | null;
  display_order: number;
  is_featured: boolean;
  is_active: boolean;
  guide_data: Json;
  section_order: string[] | null;
  hidden_sections: string[] | null;
  page_settings: Json | null;
  created_at: string;
  updated_at: string;
}

// Database-backed demo brand editor with full section editing
export default function DemoBrandEditor() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  
  const [demoBrand, setDemoBrand] = useState<DemoBrandData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [activeSection, setActiveSection] = useState<SectionId | null>(null);
  const [activeEventSection, setActiveEventSection] = useState<EventSectionId | null>(null);
  const [scrollToSection, setScrollToSection] = useState<SectionId | null>(null);
  const [scrollToEventSection, setScrollToEventSection] = useState<EventSectionId | null>(null);

  // Load demo brand from database
  useEffect(() => {
    const loadDemoBrand = async () => {
      if (!slug) return;
      
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('demo_brands')
          .select('*')
          .eq('slug', slug)
          .single();

        if (error) throw error;
        setDemoBrand(data);
      } catch (error) {
        console.error('[DemoBrandEditor] Error loading demo brand:', error);
        toast.error('Failed to load demo brand');
      } finally {
        setIsLoading(false);
      }
    };

    loadDemoBrand();
  }, [slug]);

  const isEvent = demoBrand?.type === 'event';
  
  // Parse guide data with normalization
  const guideData = useMemo(() => {
    if (!demoBrand?.guide_data) return null;
    const data = demoBrand.guide_data as Record<string, unknown>;
    return {
      ...data,
      type: demoBrand.type,
      createdAt: new Date(demoBrand.created_at),
      updatedAt: new Date(demoBrand.updated_at),
    } as BrandGuide | ProductGuide | EventGuide;
  }, [demoBrand]);

  const sectionOrder = useMemo(() => {
    return normalizeSectionOrder(demoBrand?.section_order as SectionId[] | null);
  }, [demoBrand?.section_order]);

  const hiddenSections = useMemo(() => {
    return normalizeHiddenSections(demoBrand?.hidden_sections as SectionId[] | null, sectionOrder);
  }, [demoBrand?.hidden_sections, sectionOrder]);

  // Save changes to database
  const saveChanges = useCallback(async () => {
    if (!demoBrand || !hasChanges) return;
    
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('demo_brands')
        .update({
          guide_data: demoBrand.guide_data,
          section_order: demoBrand.section_order,
          hidden_sections: demoBrand.hidden_sections,
          page_settings: demoBrand.page_settings,
          updated_at: new Date().toISOString(),
        })
        .eq('id', demoBrand.id);

      if (error) throw error;
      
      setHasChanges(false);
      toast.success('Demo brand saved');
    } catch (error) {
      console.error('[DemoBrandEditor] Error saving:', error);
      toast.error('Failed to save changes');
    } finally {
      setIsSaving(false);
    }
  }, [demoBrand, hasChanges]);

  // Handle guide updates
  const handleBrandUpdate = useCallback((updates: Partial<BrandGuide | ProductGuide>) => {
    if (!demoBrand) return;
    
    setDemoBrand(prev => {
      if (!prev) return prev;
      const currentGuideData = prev.guide_data as Record<string, unknown>;
      return {
        ...prev,
        guide_data: { ...currentGuideData, ...updates } as Json,
      };
    });
    setHasChanges(true);
  }, [demoBrand]);

  const handleEventUpdate = useCallback((updates: Partial<EventGuide>) => {
    if (!demoBrand) return;
    
    setDemoBrand(prev => {
      if (!prev) return prev;
      const currentGuideData = prev.guide_data as Record<string, unknown>;
      return {
        ...prev,
        guide_data: { ...currentGuideData, ...updates } as Json,
      };
    });
    setHasChanges(true);
  }, [demoBrand]);

  const handleSectionSelect = useCallback((sectionId: SectionId) => {
    setScrollToSection(sectionId);
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

  // Reload from database (discard changes)
  const reloadFromDatabase = useCallback(async () => {
    if (!slug) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('demo_brands')
        .select('*')
        .eq('slug', slug)
        .single();

      if (error) throw error;
      setDemoBrand(data);
      setHasChanges(false);
      toast.success('Changes discarded');
    } catch (error) {
      console.error('[DemoBrandEditor] Error reloading:', error);
      toast.error('Failed to reload');
    } finally {
      setIsLoading(false);
    }
  }, [slug]);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading demo brand...</p>
        </div>
      </div>
    );
  }

  // Not found state
  if (!demoBrand || !guideData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-foreground mb-4">Demo Brand Not Found</h1>
          <p className="text-muted-foreground mb-6">The demo brand you're looking for doesn't exist in the database.</p>
          <Button onClick={() => navigate('/admin/demo-pages')} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Demo Pages
          </Button>
        </div>
      </div>
    );
  }

  // Not admin state
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-foreground mb-4">Access Denied</h1>
          <p className="text-muted-foreground mb-6">You need admin privileges to edit demo brands.</p>
          <Button onClick={() => navigate('/')} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  const getTypeIcon = () => {
    switch (demoBrand.type) {
      case 'brand': return <Building2 className="h-3 w-3" />;
      case 'product': return <Package className="h-3 w-3" />;
      case 'event': return <Calendar className="h-3 w-3" />;
      default: return <Building2 className="h-3 w-3" />;
    }
  };

  const pageSettings = demoBrand.page_settings as Record<string, unknown> | null;
  const heroFullWidth = pageSettings?.heroFullWidth as boolean ?? false;

  return (
    <motion.div 
      className="min-h-screen bg-background overflow-x-hidden"
      initial={pageTransition.initial}
      animate={pageTransition.animate}
    >
      {/* Editor Header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-lg border-b border-border">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate('/admin/demo-pages')} 
              className="gap-1 sm:gap-2 shrink-0 h-9 px-2 sm:px-3"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Back</span>
            </Button>
            <div className="h-5 w-px bg-border hidden sm:block" />
            <Badge variant="secondary" className="gap-1 shrink-0 text-xs h-6">
              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
              Demo Editor
            </Badge>
            <Badge variant="outline" className="gap-1 hidden md:flex text-xs">
              {getTypeIcon()}
              {demoBrand.type.charAt(0).toUpperCase() + demoBrand.type.slice(1)}
            </Badge>
            {demoBrand.industry_label && (
              <Badge variant="outline" className="gap-1 hidden lg:flex text-xs">
                {demoBrand.industry_label}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            {hasChanges && (
              <Badge variant="destructive" className="gap-1 text-xs animate-pulse">
                Unsaved changes
              </Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={reloadFromDatabase}
              disabled={!hasChanges || isSaving}
              className="gap-1 h-9 px-2 sm:px-3"
              title="Discard changes"
            >
              <Undo2 className="h-4 w-4" />
              <span className="hidden sm:inline">Discard</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.open(`/demo/${demoBrand.type}/${demoBrand.slug}`, '_blank')}
              className="gap-1 h-9 px-2 sm:px-3"
              title="Preview in new tab"
            >
              <Eye className="h-4 w-4" />
              <span className="hidden sm:inline">Preview</span>
            </Button>
            <ThemeToggle />
            <Button
              size="sm"
              onClick={saveChanges}
              disabled={!hasChanges || isSaving}
              className="gap-1 sm:gap-2 h-9 px-3 sm:px-4"
            >
              {isSaving ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span className="hidden sm:inline">Saving...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span className="hidden sm:inline">Save</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Breadcrumbs */}
      <div className="hidden sm:block max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <AppBreadcrumbs
          items={[
            { label: 'Admin', icon: Settings, href: '/admin' },
            { label: 'Demo Pages', icon: Star, href: '/admin/demo-pages' },
          ]}
          currentPage={`Edit: ${demoBrand.name}`}
        />
      </div>

      {/* Page Content */}
      <div className="pb-6 sm:pb-8">
        {isEvent ? (
          <FullEventPage
            event={guideData as EventGuide}
            eventId={demoBrand.id}
            sectionOrder={sectionOrder as EventSectionId[]}
            hiddenSections={hiddenSections as EventSectionId[]}
            isAdmin={true}
            heroFullWidth={heroFullWidth}
            canEdit={true}
            scrollToSection={scrollToEventSection}
            onSectionVisible={handleEventSectionVisible}
            onEventUpdate={handleEventUpdate}
          />
        ) : (
          <FullBrandPage
            brand={guideData as BrandGuide | ProductGuide}
            brandId={demoBrand.id}
            sectionOrder={sectionOrder}
            scrollToSection={scrollToSection}
            onSectionVisible={handleSectionVisible}
            hiddenSections={hiddenSections}
            isAdmin={true}
            heroFullWidth={heroFullWidth}
            canEdit={true}
            onBrandUpdate={handleBrandUpdate}
          />
        )}
      </div>

      {/* Mobile Section Navigation */}
      {isEvent ? (
        <MobileEventSectionNav
          sectionOrder={sectionOrder as EventSectionId[]}
          hiddenSections={hiddenSections as EventSectionId[]}
          activeSection={activeEventSection || undefined}
          onSectionSelect={handleEventSectionSelect}
          eventName={demoBrand.name}
        />
      ) : (
        <MobileSectionNav
          sectionOrder={sectionOrder}
          hiddenSections={hiddenSections}
          activeSection={activeSection || undefined}
          onSectionSelect={handleSectionSelect}
          brandName={demoBrand.name}
        />
      )}

      {/* Back to Top Button */}
      <BackToTopButton />
    </motion.div>
  );
}
