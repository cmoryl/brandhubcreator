import { useState, useCallback, useMemo, useEffect, useRef, lazy, Suspense } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTheme } from 'next-themes';
import { Menu, LayoutList, ScrollText, LayoutGrid, ArrowLeft, Lock, Shield, LogOut, Star, Calendar, Building2, Brain, Settings, Download, TrendingUp, LayoutDashboard, Users, HelpCircle, Globe2, Bot } from 'lucide-react';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import tpLogoWhite from '@/assets/tp-logo-white.svg';
import tpLogoColor from '@/assets/tp-logo-color.svg';
import { EventSectionId, DEFAULT_EVENT_SECTION_ORDER, EventGuide } from '@/types/event';
import { GlobalBrandToolbar } from '@/components/brand/GlobalBrandToolbar';
import { RegionalAnalysisPanel } from '@/components/brand/RegionalAnalysisPanel';
import { DEFAULT_PAGE_SETTINGS, BrandPageSettings, SectionId, SectionLayoutSettings } from '@/types/brand';
import { LayoutPreset } from '@/components/brand/LayoutSelector';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { UnsavedChangesBlocker } from '@/components/UnsavedChangesBlocker';
import { PublicLoadingScreen } from '@/components/PublicLoadingScreen';
import { supabase } from '@/integrations/supabase/client';
import { normalizeEventGuide } from '@/lib/guideNormalization';
import { useStableLoading } from '@/hooks/useStableLoading';
import { useEvents } from '@/contexts/EventContext';
import { Json } from '@/integrations/supabase/types';
import { useAuth } from '@/contexts/AuthContext';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useOrgSlug } from '@/hooks/useOrgSlug';
import { useGuideAdmin } from '@/hooks/useGuideAdmin';
import { useAutoBiasMonitoring } from '@/hooks/useAutoBiasMonitoring';
import { useSEO } from '@/hooks/useSEO';
import { trackEntityView } from '@/hooks/usePageTracking';
import { EventSidebar } from '@/components/event/EventSidebar';
import { EventDetailsSection } from '@/components/event/EventDetailsSection';
import { EventLogosSection } from '@/components/event/EventLogosSection';
import { EventSignageSection } from '@/components/event/EventSignageSection';
import { EventPrintCollateralSection } from '@/components/event/EventPrintCollateralSection';

import { EventDigitalSection } from '@/components/event/EventDigitalSection';
import { EventSponsorsSection } from '@/components/event/EventSponsorsSection';
import { EventScheduleSection } from '@/components/event/EventScheduleSection';
import { EventHistorySection } from '@/components/event/EventHistorySection';
import { EventVideosSection } from '@/components/event/EventVideosSection';
import { EventLocationSection } from '@/components/event/EventLocationSection';
import { EventPatternsSection } from '@/components/event/EventPatternsSection';
import { EventSpeakersSection } from '@/components/event/EventSpeakersSection';
import { EventWebsiteSection } from '@/components/event/EventWebsiteSection';
import { SubEventsManager, LinkedEventGuide } from '@/components/event/SubEventsManager';
import { SharedAssetsSection, SharedAsset } from '@/components/event/SharedAssetsSection';
import { syncSharedAssetsToSubEvents } from '@/lib/syncSharedAssetsToSubEvents';
import { PartnerBoothsSection } from '@/components/event/PartnerBoothsSection';
import { HeroSection } from '@/components/brand/HeroSection';
import { TaglineSection } from '@/components/brand/TaglineSection';
import { ColorPaletteSection } from '@/components/brand/ColorPaletteSection';
import { GradientsSection } from '@/components/brand/GradientsSection';
import { TypographySection } from '@/components/brand/TypographySection';
import { ImagerySection } from '@/components/brand/ImagerySection';
import { SocialSection } from '@/components/brand/SocialSection';
import { SocialAssetsSection } from '@/components/brand/SocialAssetsSection';
import { AssetsSection } from '@/components/brand/AssetsSection';
import { MisuseSection } from '@/components/brand/MisuseSection';
import { DigitalCollateralSection } from '@/components/brand/DigitalCollateralSection';
import { TemplatesSection } from '@/components/brand/TemplatesSection';
import { TemplateSpecsSection } from '@/components/brand/TemplateSpecsSection';
import { SponsorLogosSection } from '@/components/brand/SponsorLogosSection';
import { ClientLogosSection } from '@/components/brand/ClientLogosSection';
import { InsightsSection } from '@/components/brand/InsightsSection';
import { LogoSection } from '@/components/brand/LogoSection';
import { BrandIconsSection } from '@/components/brand/BrandIconsSection';
import { PatternsSection } from '@/components/brand/PatternsSection';
import { TextStylesSection } from '@/components/brand/TextStylesSection';
import { IconographySection } from '@/components/brand/IconographySection';
import { SocialIconsSection } from '@/components/brand/SocialIconsSection';
import { WebsiteSection } from '@/components/brand/WebsiteSection';
import { SignaturesSection } from '@/components/brand/SignaturesSection';
import { QRSection } from '@/components/brand/QRSection';
import { VideosSection } from '@/components/brand/VideosSection';
import { ImageAssetsSection } from '@/components/brand/ImageAssetsSection';
import { WebinarSeriesSection } from '@/components/brand/WebinarSeriesSection';
import { ServicesSection } from '@/components/brand/ServicesSection';
import { RevenueChartSection } from '@/components/brand/RevenueChartSection';
import { ByTheNumbersSection } from '@/components/brand/ByTheNumbersSection';
import { ProductsSection } from '@/components/brand/ProductsSection';
import { EventsSection } from '@/components/brand/EventsSection';
import { PresentationTemplatesSection } from '@/components/brand/PresentationTemplatesSection';
import { ApprovedImagerySection } from '@/components/brand/approved-imagery/ApprovedImagerySection';
import { StudiosSection } from '@/components/brand/StudiosSection';
import { ValuesSection } from '@/components/brand/ValuesSection';
import { IdentitySection } from '@/components/brand/IdentitySection';
import { ShareButton } from '@/components/brand/ShareButton';
import { EventExportPdfButton } from '@/components/event/EventExportPdfButton';
import { BrandIntelligencePanel } from '@/components/brand/BrandIntelligencePanel';
import { BrandPageSettingsEditor } from '@/components/brand/BrandPageSettingsEditor';
import { AdminToolbar, type AdminToolbarAction } from '@/components/admin/AdminToolbar';
import { StickyBreadcrumbs } from '@/components/StickyBreadcrumbs';
import { SyncStatusIndicator } from '@/components/SyncStatusIndicator';
import { HeroBackground } from '@/components/HeroBackground';
import { GuideLanguageSelector } from '@/components/localization/GuideLanguageSelector';
import { TranslationHub } from '@/components/brand/TranslationHub';
import { BackToTopButton } from '@/components/BackToTopButton';
import { MobileEventSectionNav } from '@/components/event/MobileEventSectionNav';
import { ParentEventBanner } from '@/components/event/ParentEventBanner';
import { HeroBackgroundType } from '@/contexts/AppSettingsContext';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { SectionCardGrid } from '@/components/brand/SectionCardGrid';
import { eventSectionMeta } from '@/components/event/EventSidebar';
import { calculateBrandHealth } from '@/lib/brandHealthCalculator';
import { useExternalSectionCounts } from '@/hooks/useExternalSectionCounts';

type ViewMode = 'sections' | 'full' | 'cards';

const CompetitiveReportCardLazy = lazy(() =>
  import('@/components/brand/CompetitiveReportCard').then((m) => ({ default: m.CompetitiveReportCard }))
);
const LeafletLocationsSection = lazy(() => import('@/components/brand/LeafletLocationsSection').then(m => ({ default: m.LeafletLocationsSection })));
const AwardsSection = lazy(() => import('@/components/brand/AwardsSection'));
const GlobalLinkUniverseSection = lazy(() => import('@/components/brand/GlobalLinkUniverseSection'));
const BrandAssistant = lazy(() => import('@/components/dataforce/BrandAssistant').then(m => ({ default: m.BrandAssistant })));

const EventEditor = () => {
  const { eventSlug } = useParams<{ eventSlug: string }>();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { getEvent, getEventBySlug, updateEvent: updateEventContext, toggleFavorite, isLoading } = useEvents();
  const { user, isAdmin, isApproved, signOut, isLoading: authLoading } = useAuth();
  const { userRole: orgRole, organization, isLoading: orgLoading } = useOrganization();
  
  const [activeSection, setActiveSection] = useState<EventSectionId>('hero');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('full');
  const [scrollToSection, setScrollToSection] = useState<EventSectionId | null>(null);
  const [publicEvent, setPublicEvent] = useState<EventGuide | null>(null);
  const [publicEventLoading, setPublicEventLoading] = useState(false);
  const [intelligenceOpen, setIntelligenceOpen] = useState(false);
  // Regional analysis panel state
  const [regionalAnalysisOpen, setRegionalAnalysisOpen] = useState(false);
  // Translation hub state
  const [translationHubOpen, setTranslationHubOpen] = useState(false);
  const [parentEvent, setParentEvent] = useState<{ id: string; name: string; slug: string } | null>(null);
  const [assistantOpen, setAssistantOpen] = useState(false);

  // Redirect unapproved users
  useEffect(() => {
    if (!authLoading && user && !isApproved && !isAdmin) {
      navigate('/pending-approval');
    }
  }, [user, isApproved, isAdmin, authLoading, navigate]);

  // Note: scroll-to-top on route change is handled by ScrollToTop component

  // Scroll to section when sidebar nav is clicked, then flash highlight
  useEffect(() => {
    if (scrollToSection && viewMode === 'full') {
      const element = document.getElementById(scrollToSection);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        
        // Add highlight flash after scroll completes
        const flashTimeout = setTimeout(() => {
          element.classList.add('section-highlight-flash');
          
          // Remove the class after animation completes
          const cleanupTimeout = setTimeout(() => {
            element.classList.remove('section-highlight-flash');
          }, 1300);
          
          return () => clearTimeout(cleanupTimeout);
        }, 400); // Wait for scroll to mostly complete
        
        return () => clearTimeout(flashTimeout);
      }
    }
  }, [scrollToSection, viewMode]);

  // Sync sidebar with scroll position using Intersection Observer
  useEffect(() => {
    if (viewMode !== 'full') return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const sectionId = entry.target.id as EventSectionId;
            if (sectionId) {
              setActiveSection(sectionId);
            }
          }
        });
      },
      { threshold: 0.3, rootMargin: '-80px 0px -50% 0px' }
    );

    // Observe all section elements
    const sectionElements = document.querySelectorAll('[id]');
    sectionElements.forEach((el) => {
      // Only observe valid section IDs
      if (DEFAULT_EVENT_SECTION_ORDER.includes(el.id as EventSectionId)) {
        observer.observe(el);
      }
    });

    return () => observer.disconnect();
  }, [viewMode]);

  // Helper to check if the param is a UUID
  const isUUID = (str: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
  
  // Try to get event from context
  const contextEvent = useMemo(() => {
    if (!eventSlug) return undefined;
    if (isUUID(eventSlug)) {
      return getEvent(eventSlug);
    }
    return getEventBySlug(eventSlug);
  }, [eventSlug, getEvent, getEventBySlug]);

  // Fetch public event if not in context AND context is done loading
  const hasFetchedPublicRef = useRef<string | null>(null);
  
  useEffect(() => {
    const fetchPublicEvent = async () => {
      // Wait for context to finish loading before falling back to public fetch
      // This prevents the race condition where we fetch public data while context is still loading
      if (!eventSlug || contextEvent || isLoading || hasFetchedPublicRef.current === eventSlug) return;
      
      setPublicEventLoading(true);
      hasFetchedPublicRef.current = eventSlug;
      
      try {
        // For logged-in users, try fetching without public filter first (they may own it)
        let query = supabase
          .from('events')
          .select('*');
        
        if (isUUID(eventSlug)) {
          query = query.eq('id', eventSlug);
        } else {
          query = query.eq('slug', eventSlug);
        }
        
        const { data, error } = await query.maybeSingle();
        
        if (!error && data) {
          // Convert DB format to EventGuide using centralized normalization
          const guideData = typeof data.guide_data === 'object' && data.guide_data ? data.guide_data : {};
          const event = normalizeEventGuide({
            ...guideData,
            id: data.id,
            slug: data.slug,
            organizationId: data.organization_id,
            parentBrandId: data.parent_brand_id,
            isFavorite: data.is_favorite,
            isPublic: data.is_public,
            sectionOrder: data.section_order,
            hiddenSections: data.hidden_sections,
            createdAt: data.created_at,
            updatedAt: data.updated_at,
            // Ensure hero name is set from data.name if not in guide_data
            hero: { ...(guideData as any)?.hero, name: (guideData as any)?.hero?.name || data.name },
          });
          setPublicEvent(event);
        }
      } catch (err) {
        console.error('Error fetching public event:', err);
      } finally {
        setPublicEventLoading(false);
      }
    };
    
    fetchPublicEvent();
  }, [eventSlug, contextEvent, isLoading]);
  
  const event = contextEvent || publicEvent;

  // Resolve org slug for breadcrumbs - always resolve from entity's organizationId
  const { orgSlug: resolvedOrgSlug, orgName: resolvedOrgName } = useOrgSlug(
    event?.organizationId
  );
  const effectiveOrgSlug = resolvedOrgSlug || organization?.slug;
  const effectiveOrgName = resolvedOrgName || organization?.name;

  // Track event view for analytics
  useEffect(() => {
    if (event?.id && user?.id) {
      trackEntityView(user.id, 'event', event.id, event.hero?.name || 'Unknown Event');
    }
  }, [event?.id, user?.id]);
  // Fetch parent event for sub-events (check if any master event has this event in linkedGuides)
  useEffect(() => {
    const fetchParentEvent = async () => {
      if (!event?.id) return;
      
      try {
        // Find any event that has this event in its linkedGuides
        const { data, error } = await supabase
          .from('events')
          .select('id, name, slug, guide_data')
          .not('guide_data->linkedGuides', 'eq', '[]')
          .limit(50);
        
        if (error || !data) return;
        
        // Check each event's linkedGuides for a reference to this event
        for (const masterEvent of data) {
          const guideData = masterEvent.guide_data as Record<string, unknown>;
          const linkedGuides = Array.isArray(guideData?.linkedGuides) ? guideData.linkedGuides : [];
          
          const isLinked = linkedGuides.some((linked: any) => 
            linked.id === event.id || linked.slug === event.slug
          );
          
          if (isLinked) {
            setParentEvent({
              id: masterEvent.id,
              name: masterEvent.name,
              slug: masterEvent.slug || masterEvent.id,
            });
            return;
          }
        }
        
        // No parent found
        setParentEvent(null);
      } catch (err) {
        console.error('Error fetching parent event:', err);
      }
    };
    
    fetchParentEvent();
  }, [event?.id, event?.slug]);
  
  // Use centralized admin detection hook for consistent behavior across all editors
  const { isGuideAdmin, canEdit, canViewAnalytics } = useGuideAdmin({ 
    entityOrgId: event?.organizationId 
  });

  
  // Permission check (debug logging removed for production)
  
  const sectionOrder = useMemo(() => event?.sectionOrder || DEFAULT_EVENT_SECTION_ORDER, [event?.sectionOrder]);
  const hiddenSections = useMemo(() => event?.hiddenSections || [], [event?.hiddenSections]);
  const adminLayouts = useMemo(() => event?.sectionLayouts || {}, [event?.sectionLayouts]);
  const pageSettings = event?.pageSettings || DEFAULT_PAGE_SETTINGS;

  // User preferences for layout overrides
  const { getPreference, setPreference } = useUserPreferences();
  const eventPrefKey = (sectionId: EventSectionId) => `layout.event.${event?.id}.${sectionId}`;

  const sectionLayouts = useMemo(() => {
    const merged: Record<string, LayoutPreset> = { ...(adminLayouts as Record<string, LayoutPreset>) };
    if (event?.id) {
      Object.keys(merged).forEach(key => {
        const userPref = getPreference<LayoutPreset | undefined>(eventPrefKey(key as EventSectionId));
        if (userPref) merged[key] = userPref;
      });
    }
    return merged;
  }, [adminLayouts, getPreference, event?.id]);

  const eventRefreshTrigger = event?.updatedAt ? new Date(String(event.updatedAt)).getTime() : 0;
  const externalCounts = useExternalSectionCounts(event?.id, 'event', eventRefreshTrigger);

  // Calculate health for card view
  const cardViewHealthScore = useMemo(() => {
    if (!event) return undefined;
    const health = calculateBrandHealth(event as unknown as Record<string, unknown>, hiddenSections, 'event', sectionOrder, externalCounts);
    return health.overallScore;
  }, [event, hiddenSections, sectionOrder, externalCounts]);

  const getSectionLayout = useCallback((sectionId: EventSectionId): LayoutPreset => {
    const userPref = getPreference<LayoutPreset | undefined>(eventPrefKey(sectionId));
    return userPref || (sectionLayouts[sectionId as SectionId] as LayoutPreset) || 'grid-3';
  }, [sectionLayouts, getPreference, event?.id]);

  const handleSectionLayoutChange = useCallback((sectionId: EventSectionId, layout: LayoutPreset) => {
    if (event) {
      if (canEdit) {
        updateEventContext(event.id, {
          sectionLayouts: { ...adminLayouts, [sectionId]: layout }
        });
      }
      // Always save as user preference
      setPreference(eventPrefKey(sectionId), layout);
    }
  }, [event, updateEventContext, adminLayouts, canEdit, setPreference]);

  // SEO metadata
  useSEO({
    title: event ? `${event.hero.name} Event Kit` : 'Event Brand Kit',
    description: event?.eventDetails?.tagline || event?.hero.tagline 
      ? `${event?.hero.name} - ${event?.eventDetails?.tagline || event?.hero.tagline}. Complete event brand kit.`
      : 'Event brand guidelines and assets',
  });

  const getContentWidthClass = () => {
    switch (pageSettings.contentWidth) {
      case 'wide': return 'max-w-6xl';
      case 'full': return 'max-w-full px-4';
      default: return 'max-w-5xl';
    }
  };

  const getSectionSpacingClass = () => {
    switch (pageSettings.sectionSpacing) {
      case 'compact': return 'space-y-4';
      case 'spacious': return 'space-y-16';
      default: return 'space-y-8';
    }
  };

  const getHeaderClasses = () => {
    const base = 'sticky top-0 z-40 animate-fade-in-down';
    switch (pageSettings.headerStyle) {
      case 'minimal': return `${base} bg-background border-b border-border`;
      case 'transparent': return `${base} bg-transparent`;
      default: return `${base} bg-background/80 backdrop-blur-lg border-b border-border`;
    }
  };

  const handleSectionOrderChange = useCallback((newOrder: EventSectionId[]) => {
    if (event) {
      updateEventContext(event.id, { sectionOrder: newOrder });
    }
  }, [event, updateEventContext]);

  const handleHiddenSectionsChange = useCallback((newHiddenSections: EventSectionId[]) => {
    if (event) {
      updateEventContext(event.id, { hiddenSections: newHiddenSections });
    }
  }, [event, updateEventContext]);

  const handlePageSettingsChange = useCallback((newSettings: typeof DEFAULT_PAGE_SETTINGS) => {
    if (event) {
      updateEventContext(event.id, { pageSettings: newSettings });
    }
  }, [event, updateEventContext]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const handleSectionChange = useCallback((section: EventSectionId) => {
    setActiveSection(section);
    if (viewMode === 'full') {
      setScrollToSection(section);
      setTimeout(() => setScrollToSection(null), 100);
    }
  }, [viewMode]);

  // Continuous bias monitoring for events
  const { triggerMonitor: triggerBiasMonitor } = useAutoBiasMonitoring({
    organizationId: event?.organizationId,
    entityType: 'event',
    entityId: event?.id || '',
    entityName: event?.hero?.name || '',
    enabled: canEdit && Boolean(event?.id),
  });

  // Stable update function - must be before early returns to maintain hooks order
  // Handles both context events and directly-fetched public events
  const updateEvent = useCallback(async (updates: Partial<EventGuide>) => {
    if (!event) {
      console.warn('[EventEditor] updateEvent called but no event loaded');
      return;
    }
    
    // Feed to continuous bias monitor
    triggerBiasMonitor({ ...event, ...updates } as unknown as Record<string, unknown>);
    
    // If event is in context, use context updater
    if (contextEvent) {
      updateEventContext(event.id, updates);
      return;
    }
    
    // For public events not in context, update directly via Supabase
    // This handles the case where user is editing an event loaded via public fetch
    if (publicEvent) {
      // Store previous state for potential revert
      const previousState = { ...publicEvent };
      
      // Optimistic update to local state immediately (so UI updates)
      setPublicEvent(prev => prev ? { ...prev, ...updates, updatedAt: new Date() } : null);
      
      // Only sync to database if user is authenticated
      if (!user) {
        console.warn('[EventEditor] User not authenticated, local state updated but not synced to database');
        toast.error('Please sign in to save changes');
        // Revert optimistic update since we can't persist
        setPublicEvent(previousState);
        return;
      }
      
      // Sync to database
      try {
        const mergedEvent = { ...publicEvent, ...updates };
        const { hero, tagline, identity, values, eventDetails, ...rest } = mergedEvent;
        const guideData = {
          hero, tagline, identity, values, eventDetails,
          ...rest,
        };
        // Remove non-guide fields that shouldn't be in guide_data
        const { id, type, slug, organizationId, parentBrandId, isFavorite, isPublic, sectionOrder, hiddenSections, createdAt, updatedAt, ...cleanGuideData } = guideData as EventGuide & Record<string, unknown>;
        
        logger.sync('EventEditor: Syncing public event update to database for event:', event.id);
        
        const { error } = await supabase
          .from('events')
          .update({
            name: hero?.name || publicEvent.hero.name,
            guide_data: cleanGuideData as unknown as Json,
            section_order: mergedEvent.sectionOrder as string[] | null,
            hidden_sections: mergedEvent.hiddenSections as string[] | null,
          })
          .eq('id', event.id);
        
        if (error) {
          console.error('[EventEditor] Failed to update event:', error);
          toast.error('Failed to save changes. Please try again.');
          // Revert optimistic update on error
          setPublicEvent(previousState);
          return;
        }
        
        logger.sync('EventEditor: Successfully synced public event update');
      } catch (err) {
        console.error('[EventEditor] Failed to update event:', err);
        toast.error('Failed to save changes. Please check your connection.');
        // Revert optimistic update on error
        setPublicEvent(previousState);
      }
    } else {
      console.warn('[EventEditor] updateEvent called but no publicEvent available');
    }
  }, [event, contextEvent, publicEvent, user, updateEventContext]);

  // Unified section renderer - must be defined before early returns to maintain hooks order
  // Returns null if event is not loaded yet
  const renderSectionContent = useCallback((sectionId: EventSectionId): React.ReactNode => {
    if (!event) return null;
    
    // Helper to conditionally create change handler
    const editHandler = <T,>(handler: (value: T) => void) => {
      if (!canEdit) return undefined;
      return handler;
    };
    
    switch (sectionId) {
      case 'hero': 
        logger.events('EventEditor: Rendering hero section with canEdit:', canEdit);
        return <HeroSection hero={event.hero} onHeroChange={editHandler((hero) => updateEvent({ hero }))} onOpenIntelligence={canViewAnalytics ? () => setIntelligenceOpen(true) : undefined} guideData={event as unknown as Record<string, unknown>} entityType="event" entityId={event.id} hiddenSections={hiddenSections} sectionOrder={sectionOrder} />;
      case 'eventdetails':
        return <EventDetailsSection eventDetails={event.eventDetails} onUpdate={canEdit ? (eventDetails) => updateEvent({ eventDetails: { ...event.eventDetails, ...eventDetails } }) : () => {}} isEditable={canEdit || false} />;
      case 'tagline': 
        return <TaglineSection tagline={event.tagline} onTaglineChange={editHandler((tagline) => updateEvent({ tagline }))} />;
      case 'identity':
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Event Narrative</h2>
            <div className="prose dark:prose-invert max-w-none">
              <p className="text-muted-foreground">{event.identity?.missionStatement || 'No mission statement defined.'}</p>
              {event.identity?.archetype && (
                <p><strong>Archetype:</strong> {event.identity.archetype}</p>
              )}
              {event.identity?.toneOfVoice?.length > 0 && (
                <p><strong>Tone:</strong> {event.identity.toneOfVoice.join(', ')}</p>
              )}
            </div>
          </div>
        );
      case 'values':
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Event Pillars</h2>
            {event.values?.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {event.values.map((value, index) => (
                  <div key={value.id || index} className="p-4 rounded-lg border bg-card">
                    <h3 className="font-medium">{value.text}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{value.description}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No event pillars defined.</p>
            )}
          </div>
        );
      case 'eventwebsites':
        return <EventWebsiteSection websites={event.websites || []} onWebsitesChange={canEdit ? (websites) => updateEvent({ websites }) : undefined} isEditable={canEdit || false} entityId={event.id} />;
      case 'eventlogos':
        return <EventLogosSection logos={event.eventLogos || []} onUpdate={canEdit ? (eventLogos) => updateEvent({ eventLogos }) : () => {}} isEditable={canEdit || false} entityId={event.id} entityType="event" />;
      case 'eventsignage':
        return <EventSignageSection signage={event.eventSignage || []} onUpdate={canEdit ? (eventSignage) => updateEvent({ eventSignage }) : () => {}} isEditable={canEdit || false} layout={getSectionLayout('eventsignage')} onLayoutChange={canEdit ? (layout) => handleSectionLayoutChange('eventsignage', layout) : undefined} brandName={event.hero?.name} brandColors={event.colors?.map(c => c.hex)} eventId={event.id} />;
      case 'eventprint':
        return <EventPrintCollateralSection items={event.eventPrintMaterials || []} onItemsChange={canEdit ? (eventPrintMaterials) => updateEvent({ eventPrintMaterials }) : undefined} isEditable={canEdit || false} eventId={event.id} />;
      case 'eventbanners':
      case 'eventdigital':
        return <EventDigitalSection materials={event.eventDigitalMaterials || []} onUpdate={canEdit ? (eventDigitalMaterials) => updateEvent({ eventDigitalMaterials }) : () => {}} banners={event.eventBanners || []} onBannersChange={canEdit ? (eventBanners) => updateEvent({ eventBanners }) : undefined} printMaterials={event.eventPrintMaterials || []} onPrintMaterialsChange={canEdit ? (eventPrintMaterials) => updateEvent({ eventPrintMaterials }) : undefined} sponsorshipMaterials={event.eventSponsorshipMaterials || []} onSponsorshipMaterialsChange={canEdit ? (eventSponsorshipMaterials) => updateEvent({ eventSponsorshipMaterials }) : undefined} emailBanners={event.emailBanners || []} onEmailBannersChange={canEdit ? (emailBanners) => updateEvent({ emailBanners }) : undefined} infographics={event.eventInfographics || []} onInfographicsChange={canEdit ? (eventInfographics) => updateEvent({ eventInfographics }) : undefined} applications={event.eventApplications || []} onApplicationsChange={canEdit ? (eventApplications) => updateEvent({ eventApplications }) : undefined} digitalAssets={event.eventDigitalAssets || []} onDigitalAssetsChange={canEdit ? (eventDigitalAssets) => updateEvent({ eventDigitalAssets }) : undefined} isEditable={canEdit || false} eventId={event.id} />;
      case 'colors': 
        return <ColorPaletteSection colors={event.colors} onColorsChange={editHandler((colors) => updateEvent({ colors }))} colorCombinations={event.colorCombinations} onColorCombinationsChange={editHandler((colorCombinations) => updateEvent({ colorCombinations }))} brandName={event.hero.name} />;
      case 'gradients': 
        return <GradientsSection gradients={event.gradients} onGradientsChange={editHandler((gradients) => updateEvent({ gradients }))} brandName={event.hero.name} brandColors={event.colors} />;
      case 'typography': 
        return <TypographySection typography={event.typography} onTypographyChange={editHandler((typography) => updateEvent({ typography }))} isAdmin={isGuideAdmin} />;
      case 'imagery': 
        return <ImagerySection imagery={event.imagery} onImageryChange={editHandler((imagery) => updateEvent({ imagery }))} entityId={event.id} entityType="event" isAdmin={isGuideAdmin} />;
      case 'social': 
        return <SocialSection social={event.social} onSocialChange={editHandler((social) => updateEvent({ social }))} entityId={event.id} entityType="event" organizationId={event.organizationId} entityName={event.hero?.name} />;
      case 'socialassets': 
        return (
          <SocialAssetsSection
            socialAssets={event.socialAssets || []}
            onSocialAssetsChange={editHandler((socialAssets) => updateEvent({ socialAssets }))}
            
          />
        );
      case 'eventspeakers':
        return (
          <EventSpeakersSection
            speakers={event.eventSpeakers || []}
            onUpdate={canEdit ? (eventSpeakers) => updateEvent({ eventSpeakers }) : () => {}}
            isEditable={canEdit || false}
            eventId={event?.id}
          />
        );
      case 'eventsponsors':
        return <EventSponsorsSection sponsors={event.eventSponsors || []} onUpdate={canEdit ? (eventSponsors) => updateEvent({ eventSponsors }) : () => {}} isEditable={canEdit || false} />;
      case 'eventschedule':
        return <EventScheduleSection schedule={event.eventSchedule || []} onUpdate={canEdit ? (eventSchedule) => updateEvent({ eventSchedule }) : () => {}} speakers={event.eventSpeakers || []} isEditable={canEdit || false} eventName={event.hero.name || event.eventDetails?.eventName || 'Event'} eventDates={event.eventDetails?.eventDates} eventLocation={event.eventDetails?.location} />;
      case 'eventhistory':
        return <EventHistorySection history={event.eventHistory || []} onUpdate={canEdit ? (eventHistory) => updateEvent({ eventHistory }) : () => {}} isEditable={canEdit || false} />;
      case 'eventvideos':
        return <EventVideosSection videos={event.eventVideos || []} onUpdate={canEdit ? (eventVideos) => updateEvent({ eventVideos }) : () => {}} isEditable={canEdit || false} />;
      case 'eventlocation':
        return <EventLocationSection location={event.eventLocation || { venueName: '', address: '', city: '', country: '', venueMaps: [] }} onUpdate={canEdit ? (eventLocation) => updateEvent({ eventLocation }) : () => {}} isEditable={canEdit || false} />;
      case 'assets': 
        return <AssetsSection assets={event.assets} onAssetsChange={editHandler((assets) => updateEvent({ assets }))} websiteUrl={(event as any).websites?.[0]?.url} entityId={event.id} entityType="event" />;
      case 'misuse': 
        return <MisuseSection misuse={event.misuse} onMisuseChange={editHandler((misuse) => updateEvent({ misuse }))} entityId={event.id} entityType="event" />;
      case 'casestudies': 
      case 'brochures': 
        return <DigitalCollateralSection collateral={event.brochures} onCollateralChange={editHandler((brochures) => updateEvent({ brochures }))} entityId={event.id} entityType="event" />;
      case 'templates': 
        // Handled in eventdigital unified section - no standalone render
        return null;
      case 'templatespecs':
        return <TemplateSpecsSection templateSpecs={event.templateSpecs || []} onTemplateSpecsChange={editHandler((templateSpecs) => updateEvent({ templateSpecs }))} entityId={event.id} entityType="event" />;
      case 'subevents': {
        const linkedEvents: LinkedEventGuide[] = ((event as any).linkedGuides || [])
          .filter((g: any) => g.type === 'event')
          .map((g: any) => ({
            id: g.id,
            type: 'event',
            slug: g.slug || '',
            name: g.name || '',
            region: g.region,
            accentColor: g.accentColor,
            location: g.location,
            dates: g.dates,
            attendees: g.attendees,
            coverImage: g.coverImage,
          }));
        
        return (
          <SubEventsManager
            eventId={event.id}
            linkedGuides={linkedEvents}
            onLinkedGuidesChange={(guides) => updateEvent({ linkedGuides: guides } as any)}
            masterEventName={event.hero?.name || 'Master Event'}
            masterEventSlug={event.slug}
          />
        );
      }
      case 'sharedassets': {
        const sharedAssets: SharedAsset[] = ((event as any).sharedAssets || []).map((a: any) => ({
          id: a.id,
          name: a.name,
          type: a.type || 'other',
          url: a.url,
          previewUrl: a.previewUrl,
          description: a.description,
          fileType: a.fileType,
          isRequired: a.isRequired,
          tags: a.tags,
        }));
        
        const handleSharedAssetsChange = canEdit ? (assets: SharedAsset[]) => {
          updateEvent({ sharedAssets: assets } as any);
          // Auto-sync to all linked sub-events
          if (event?.id) {
            syncSharedAssetsToSubEvents(event.id, assets);
          }
        } : undefined;
        
        return (
          <SharedAssetsSection
            assets={sharedAssets}
            onAssetsChange={handleSharedAssetsChange}
            isEditable={canEdit || false}
            eventId={event?.id}
          />
        );
      }
      case 'sponsorlogos':
        return <SponsorLogosSection sponsors={event.sponsorLogos || []} onSponsorsChange={editHandler((sponsorLogos) => updateEvent({ sponsorLogos }))} websiteUrl={(event as any).websites?.[0]?.url} isEditable={canEdit} entityId={event.id} entityType="event" />;
      case 'partnerbooths':
        return <PartnerBoothsSection partnerBooths={(event as any).partnerBooths || []} onUpdate={canEdit ? (partnerBooths) => updateEvent({ partnerBooths } as any) : undefined} isEditable={canEdit || false} />;
      case 'clientlogos':
        return <ClientLogosSection clientLogos={event.clientLogos || []} onClientLogosChange={editHandler((clientLogos) => updateEvent({ clientLogos }))} entityId={event.id} entityType="event" />;
      case 'insights':
        return (
          <InsightsSection
            insights={(event as any).insights || []}
            layout={(event as any).insightsLayout}
            onInsightsChange={editHandler((insights) => updateEvent({ insights } as any))}
            onLayoutChange={canEdit ? (insightsLayout) => updateEvent({ insightsLayout } as any) : undefined}
            entityType="event"
            entityId={event.id}
            websites={(event as any).websites}
            entityName={event.hero?.name}
            industry={event.identity?.archetype}
            organizationId={event.organizationId}
            brandContext={{ colors: event.colors?.map?.((c: any) => c.hex) || [], archetype: event.identity?.archetype, mission: event.identity?.missionStatement, tagline: event.hero?.tagline }}
            insightsAccessCode={(event as any).insightsAccessCode}
            onAccessCodeChange={canEdit ? (insightsAccessCode) => updateEvent({ insightsAccessCode } as any) : undefined}
          />
        );
      case 'logos': return <LogoSection logos={event.logos} onLogosChange={editHandler((logos) => updateEvent({ logos }))} entityId={event.id} entityType="event" logoDownloadLinks={event.logoDownloadLinks} onLogoDownloadLinksChange={editHandler((logoDownloadLinks) => updateEvent({ logoDownloadLinks }))} />;
      case 'brandicon': return <BrandIconsSection brandIcons={event.brandIcons} onBrandIconsChange={editHandler((brandIcons) => updateEvent({ brandIcons }))} entityId={event.id} entityType="event" />;
      case 'patterns': return <PatternsSection patterns={event.patterns} onPatternsChange={editHandler((patterns) => updateEvent({ patterns }))} brandName={event.hero.name} brandColors={event.colors} entityId={event.id} entityType="event" />;
      case 'eventpatterns': return <EventPatternsSection patterns={event.patterns || []} onPatternsChange={editHandler((patterns) => updateEvent({ patterns }))} isEditable={canEdit} eventName={event.hero.name} eventColors={event.colors} eventTagline={event.hero.tagline} />;
      case 'textstyles': return <TextStylesSection textStyles={event.textStyles} onTextStylesChange={editHandler((textStyles) => updateEvent({ textStyles }))} />;
      case 'iconography': return <IconographySection iconography={event.iconography} onIconographyChange={editHandler((iconography) => updateEvent({ iconography }))} defaultIconColor={(event as any).defaultIconColor} onDefaultIconColorChange={editHandler((defaultIconColor) => updateEvent({ defaultIconColor }))} brandColors={event.colors?.map(c => ({ hex: c.hex, name: c.name })) || []} organizationId={organization?.id} brandId={event.id} entityType="event" entityName={event.hero?.name || ''} />;
      case 'socialicons': return <SocialIconsSection socialIcons={event.socialIcons} onSocialIconsChange={editHandler((socialIcons) => updateEvent({ socialIcons }))} />;
      case 'website': return <WebsiteSection websites={event.websites} onWebsitesChange={editHandler((websites) => updateEvent({ websites }))} entityType="event" entityId={event.id} />;
      case 'signatures': return <SignaturesSection signatures={event.signatures} onSignaturesChange={editHandler((signatures) => updateEvent({ signatures }))} />;
      case 'qr': return <QRSection qr={event.qr} onQRChange={editHandler((qr) => updateEvent({ qr }))} entityType="event" entityId={event.id} logos={event.logos} />;
      case 'videos': return <VideosSection videos={event.videos} onVideosChange={editHandler((videos) => updateEvent({ videos }))} />;
      case 'imageassets': return <ImageAssetsSection imageAssets={(event as any).imageAssets || []} onImageAssetsChange={editHandler((imageAssets) => updateEvent({ imageAssets } as any))} />;
      case 'bythenumbers': return <ByTheNumbersSection statistics={event.statistics || []} onStatisticsChange={editHandler((statistics) => updateEvent({ statistics }))} brandName={event.hero.name} brandColors={event.colors || []} />;
      case 'services': return <ServicesSection services={(event as any).services || []} onServicesChange={editHandler((services) => updateEvent({ services } as any))} />;
      case 'revenue': return <RevenueChartSection revenueData={(event as any).revenueData} onRevenueDataChange={editHandler((revenueData) => updateEvent({ revenueData } as any))} brandName={event.hero.name} brandColors={event.colors || []} />;
      case 'webinars': return <WebinarSeriesSection webinars={(event as any).webinars || []} onWebinarsChange={editHandler((webinars) => updateEvent({ webinars } as any))} />;
      case 'awards': return <Suspense fallback={<div className="h-64 flex items-center justify-center text-muted-foreground">Loading...</div>}><AwardsSection awards={(event as any).awards || []} onUpdate={editHandler((awards) => updateEvent({ awards } as any))} entityType="event" entityId={event.id} /></Suspense>;
      case 'products': return <ProductsSection brandId={event.id} />;
      case 'events': return <EventsSection brandId={event.id} />;
      case 'universe': return <Suspense fallback={<div className="h-64 flex items-center justify-center text-muted-foreground">Loading...</div>}><GlobalLinkUniverseSection linkedGuides={(event as any).linkedGuides || []} primaryColor={event.colors?.[0]?.hex} /></Suspense>;
      case 'presentations': return <PresentationTemplatesSection entityType="event" entityId={event.id} isEditable={canEdit} />;
      case 'approvedimagery': return <ApprovedImagerySection approvedImagery={(event as any).approvedImagery} onApprovedImageryChange={editHandler((approvedImagery) => updateEvent({ approvedImagery } as any))} canEdit={canEdit} entityId={event.id} entityType="event" organizationId={event.organizationId} />;
      case 'studios': return <StudiosSection studios={(event as any).studios || []} onStudiosChange={editHandler((studios) => updateEvent({ studios } as any))} entityId={event.id} />;
      case 'locations': return (
        <Suspense fallback={<div className="h-64 flex items-center justify-center text-muted-foreground">Loading map...</div>}>
          <LeafletLocationsSection
            locations={(event as any).locations || []}
            locationStats={(event as any).locationStats || []}
            onLocationsChange={editHandler((locations) => updateEvent({ locations } as any))}
            onLocationStatsChange={editHandler((locationStats) => updateEvent({ locationStats } as any))}
            accentColor={event.colors?.[0]?.hex}
          />
        </Suspense>
      );
      default:
        return null;
    }
  }, [event, canEdit, updateEvent, getSectionLayout, handleSectionLayoutChange]);

  // Use existing hasFetchedPublicRef from earlier in component
  // IMPORTANT: Never block a public event page on context loading.
  // If the user deep-links to a public sub-event, the org/event context may still be initializing
  // (or never initialize if no org is selected), which would otherwise cause an infinite loading screen.
  const hasFetchedPublic = hasFetchedPublicRef.current === eventSlug;
  const contextLoading = Boolean(user && isLoading);
  const needsPublicData = !contextEvent && !publicEvent;
  // Show loading if: we need public data AND (still loading OR haven't even started fetching yet)
  const rawLoading = !event && (contextLoading || (needsPublicData && (publicEventLoading || !hasFetchedPublic)));
  const stableLoading = useStableLoading(rawLoading, {
    showDelay: 100,
    minDisplayTime: 300,
    maxLoadingTime: 6000
  });

  if (stableLoading) {
    return (
      <PublicLoadingScreen 
        type="event" 
        name={publicEvent?.hero?.name || eventSlug}
        organizationName={organization?.name}
      />
    );
  }

  // Not found state - only show AFTER we've completed fetch and have no data
  if (!event && hasFetchedPublic && !publicEventLoading && !contextLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-foreground mb-2">Event not found</h1>
          <p className="text-muted-foreground mb-4">The event you're looking for doesn't exist.</p>
          <Button onClick={() => navigate(organization ? `/org/${organization.slug}` : '/')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {organization ? `Back to ${organization.name}` : 'Back to Home'}
          </Button>
        </div>
      </div>
    );
  }

  // Final guard - if somehow we still have no event, show loading
  if (!event) {
    return (
      <PublicLoadingScreen 
        type="event" 
        name={eventSlug}
        organizationName={organization?.name}
      />
    );
  }

  // Wrapper for single section view
  const renderSection = () => {
    const content = renderSectionContent(activeSection);
    if (content) return content;
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Section "{activeSection}" coming soon</p>
      </div>
    );
  };

  // Render all sections for full page view
  const renderFullPage = () => {
    const deduplicatedOrder = sectionOrder.filter(id => {
      if (id === 'eventbanners' && sectionOrder.includes('eventdigital')) return false;
      if ((id === 'casestudies' || id === 'brochures') && sectionOrder.includes('eventdigital')) return false;
      return true;
    });
    const visibleSections = isGuideAdmin 
      ? deduplicatedOrder 
      : deduplicatedOrder.filter(id => !hiddenSections.includes(id));

    return (
      <div className={getSectionSpacingClass()}>
        {visibleSections.map((sectionId) => {
          const content = renderSectionContent(sectionId);
          if (!content) return null;
          
          return (
            <div key={sectionId} id={sectionId} className="scroll-mt-24">
              {content}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <TooltipProvider>
      <UnsavedChangesBlocker />
      <div className="min-h-screen bg-background flex relative">
        {/* Desktop Sidebar - Hidden in cards mode */}
        {viewMode !== 'cards' && (
          <div className="hidden lg:block fixed top-0 left-0 h-screen w-72 z-30">
            <EventSidebar 
              activeSection={activeSection} 
              onSectionChange={handleSectionChange} 
              eventName={event.hero.name}
              eventId={event.id}
              organizationId={event.organizationId}
              sectionOrder={sectionOrder}
              onSectionOrderChange={handleSectionOrderChange}
              hiddenSections={hiddenSections}
              onHiddenSectionsChange={handleHiddenSectionsChange}
              isAdmin={isGuideAdmin}
            />
          </div>
        )}
        
        {/* Sidebar spacer for fixed positioning - Hidden in cards mode */}
        {viewMode !== 'cards' && (
          <div className="hidden lg:block w-72 flex-shrink-0" />
        )}

        {/* Mobile Sidebar */}
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetContent side="left" className="p-0 w-72">
            <EventSidebar 
              activeSection={activeSection} 
              onSectionChange={(section) => { handleSectionChange(section); setSidebarOpen(false); }} 
              eventName={event.hero.name}
              eventId={event.id}
              organizationId={event.organizationId}
              sectionOrder={sectionOrder}
              onSectionOrderChange={handleSectionOrderChange}
              hiddenSections={hiddenSections}
              onHiddenSectionsChange={handleHiddenSectionsChange}
              isAdmin={isGuideAdmin}
            />
          </SheetContent>
        </Sheet>

        {/* Main content */}
        <div className="flex-1 flex flex-col min-w-0 relative z-10">
          {/* Header - Always shown for consistent navigation */}
          <header className={getHeaderClasses()}>
            <div className="px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="lg:hidden">
                      <Menu className="h-5 w-5" />
                    </Button>
                  </SheetTrigger>
                </Sheet>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={() => navigate(organization ? `/org/${organization.slug}` : '/')}>
                      <ArrowLeft className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Back to Home</TooltipContent>
                </Tooltip>
                <button 
                  onClick={() => navigate(organization ? `/org/${organization.slug}` : '/')}
                  className="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer"
                >
                  <img 
                    src={theme === 'dark' ? tpLogoWhite : tpLogoColor} 
                    alt="BrandHUB" 
                    className="h-6 w-6 object-contain flex-shrink-0" 
                  />
                  <span className="font-semibold text-foreground hidden sm:inline">
                    Brand<span className="text-accent">HUB</span>
                  </span>
                </button>
                <div className="h-6 w-px bg-border mx-2 hidden sm:block" />
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  <span className="font-medium text-foreground truncate max-w-[150px] sm:max-w-[200px]">
                    {event.hero.name}
                  </span>
                  {canEdit && (
                    <Badge variant="outline" className="bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20">
                      Editing
                    </Badge>
                  )}
                  {canEdit && <SyncStatusIndicator compact />}
                </div>
              </div>
              <div className="flex items-center gap-3">
                {/* Regional Analysis Toolbar */}
                {event.organizationId && (
                  <GlobalBrandToolbar
                    entityType="event"
                    entityId={event.id}
                    organizationId={event.organizationId}
                    isAdmin={isGuideAdmin}
                    onOpenAnalysis={() => setRegionalAnalysisOpen(true)}
                    className="hidden md:flex"
                  />
                )}
                {/* Language Selector (admin only) */}
                {isGuideAdmin && (
                  <GuideLanguageSelector
                    entityType="event"
                    entityId={event.id}
                    entityName={event.hero.name}
                    onOpenLocalizationPanel={() => setTranslationHubOpen(true)}
                  />
                )}
                {isGuideAdmin && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => toggleFavorite(event.id)}
                      className={event.isFavorite ? 'text-yellow-500' : ''}
                    >
                      <Star className={`h-5 w-5 ${event.isFavorite ? 'fill-current' : ''}`} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{event.isFavorite ? 'Remove from favorites' : 'Add to favorites'}</TooltipContent>
                </Tooltip>
                )}
                <ShareButton 
                  guideId={event.id} 
                  guideName={event.hero.name}
                  guideSlug={event.slug || undefined}
                  type="event" 
                  isPublic={event.isPublic || false}
                  onPublicChange={(isPublic) => updateEvent({ isPublic })}
                  canEdit={canEdit || false}
                  organizationSlug={organization?.slug}
                />
                <ToggleGroup type="single" value={viewMode} onValueChange={(v) => v && setViewMode(v as ViewMode)} className="bg-muted rounded-lg p-0.5">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <ToggleGroupItem value="sections" aria-label="Section view" className="h-8 w-8 data-[state=on]:bg-background">
                        <LayoutList className="h-4 w-4" />
                      </ToggleGroupItem>
                    </TooltipTrigger>
                    <TooltipContent>Section View</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <ToggleGroupItem value="cards" aria-label="Card grid view" className="h-8 w-8 data-[state=on]:bg-background">
                        <LayoutGrid className="h-4 w-4" />
                      </ToggleGroupItem>
                    </TooltipTrigger>
                    <TooltipContent>Card Grid View</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <ToggleGroupItem value="full" aria-label="Full page view" className="h-8 w-8 data-[state=on]:bg-background">
                        <ScrollText className="h-4 w-4" />
                      </ToggleGroupItem>
                    </TooltipTrigger>
                    <TooltipContent>Full Page View</TooltipContent>
                  </Tooltip>
                </ToggleGroup>
                <ThemeToggle />
                {user ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-accent/10 text-accent text-sm">
                            {user.email?.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuLabel className="font-normal">
                        <div className="flex flex-col space-y-1">
                          <p className="text-sm font-medium leading-none">{user.email}</p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            {isAdmin ? (
                              <>
                                <Shield className="h-3 w-3 text-accent" />
                                <span className="text-accent">Admin</span>
                              </>
                            ) : orgRole ? (
                              <span className="capitalize">{orgRole}</span>
                            ) : (
                              'Member'
                            )}
                          </p>
                        </div>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      
                      {/* Quick Navigation */}
                      <DropdownMenuItem onClick={() => navigate(organization ? `/org/${organization.slug}` : '/')} className="gap-2 cursor-pointer">
                        <LayoutDashboard className="h-4 w-4" />
                        Dashboard
                      </DropdownMenuItem>
                      
                      {isAdmin && (
                        <>
                          <DropdownMenuItem onClick={() => navigate('/admin')} className="gap-2 cursor-pointer">
                            <Shield className="h-4 w-4" />
                            Admin Panel
                          </DropdownMenuItem>
                          {organization && (
                            <DropdownMenuItem onClick={() => navigate(`/org/${organization.slug}/settings`)} className="gap-2 cursor-pointer">
                              <Settings className="h-4 w-4" />
                              Organization Settings
                            </DropdownMenuItem>
                          )}
                          {organization && (
                            <DropdownMenuItem onClick={() => navigate(`/org/${organization.slug}/settings`)} className="gap-2 cursor-pointer">
                              <Users className="h-4 w-4" />
                              Manage Members
                            </DropdownMenuItem>
                          )}
                        </>
                      )}
                      
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => navigate('/help')} className="gap-2 cursor-pointer">
                        <HelpCircle className="h-4 w-4" />
                        Help Center
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={handleSignOut} 
                        className="gap-2 cursor-pointer text-destructive focus:text-destructive"
                      >
                        <LogOut className="h-4 w-4" />
                        Sign Out
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <Button variant="outline" size="sm" onClick={() => navigate('/auth')} className="gap-2">
                    <Lock className="h-4 w-4" />
                    Login
                  </Button>
                )}
              </div>
            </div>
          </header>

          {/* Admin Toolbar - visible to members (analytics) and admins (full) */}
          <AdminToolbar
            isVisible={canViewAnalytics || false}
            guideType="event"
            hiddenSectionCount={canEdit ? hiddenSections.length : 0}
            actions={[
              {
                id: 'intelligence',
                label: 'Intelligence',
                icon: Brain,
                onClick: () => setIntelligenceOpen(true),
              },
              {
                id: 'competitive',
                label: 'Competitive',
                icon: TrendingUp,
                render: () => {
                  return (
                    <Suspense fallback={null}>
                      <CompetitiveReportCardLazy
                        entityType="event"
                        entityId={event.id}
                        entityName={event.hero.name}
                        organizationId={event.organizationId || undefined}
                      />
                    </Suspense>
                  );
                },
              },
              // Admin-only actions below
              ...(canEdit ? [
                {
                  id: 'settings',
                  label: 'Page Settings',
                  icon: Settings,
                  render: () => (
                    <BrandPageSettingsEditor
                      settings={pageSettings} 
                      onSettingsChange={handlePageSettingsChange} 
                    />
                  ),
                },
                {
                  id: 'export',
                  label: 'Export PDF',
                  icon: Download,
                  render: () => <EventExportPdfButton event={event} />,
                },
              ] as AdminToolbarAction[] : []),
            ]}
          />

          {/* Content */}
          <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-x-hidden">
            <div className={`${getContentWidthClass()} mx-auto animate-fade-in-up ${getSectionSpacingClass()}`}>
              {/* Sticky Breadcrumbs - show full hierarchy for sub-events */}
              <StickyBreadcrumbs
                homeHref={effectiveOrgSlug ? `/org/${effectiveOrgSlug}` : '/'}
                items={[
                  { label: effectiveOrgName || 'Events', icon: effectiveOrgSlug ? Building2 : Calendar, href: effectiveOrgSlug ? `/org/${effectiveOrgSlug}` : '/' },
                  ...(parentEvent ? [{ label: parentEvent.name, icon: Calendar, href: `/event/${parentEvent.slug}` }] : []),
                ]}
                currentPage={event.hero.name}
                currentIcon={Calendar}
              />

              {/* Parent Event Banner for sub-events */}
              {(event as any).parentEventSlug && (
                <ParentEventBanner
                  parentEventSlug={(event as any).parentEventSlug}
                  parentEventName="GlobalLink NEXT"
                  region={(event as any).region}
                  accentColor={(event as any).regionAccentColor}
                />
              )}
              
              {viewMode === 'cards' ? (
                <div className="animate-fade-in">
                  <SectionCardGrid
                    sectionOrder={sectionOrder as string[]}
                    hiddenSections={hiddenSections as string[]}
                    activeSection={activeSection}
                    onSectionSelect={(section) => { setActiveSection(section as EventSectionId); }}
                    isAdmin={isGuideAdmin}
                    cardViewBackground={pageSettings.cardViewBackground}
                    cardViewBackgroundTint={pageSettings.cardViewBackgroundTint}
                    onCardViewBackgroundChange={(bg, tint) => {
                      handlePageSettingsChange({
                        ...pageSettings,
                        cardViewBackground: bg,
                        cardViewBackgroundTint: tint,
                      });
                    }}
                    entityLightLogoUrl={pageSettings.cardViewLightLogo}
                    entityDarkLogoUrl={pageSettings.cardViewDarkLogo}
                    onEntityLogoChange={canEdit ? (variant: 'light' | 'dark', url: string) => {
                      handlePageSettingsChange({
                        ...pageSettings,
                        ...(variant === 'light' ? { cardViewLightLogo: url } : { cardViewDarkLogo: url }),
                      });
                    } : undefined}
                    entityName={event?.hero?.name}
                    entityTagline={event?.hero?.tagline}
                    healthScore={isGuideAdmin ? cardViewHealthScore : undefined}
                    onOpenIntelligence={canViewAnalytics ? () => setIntelligenceOpen(true) : undefined}
                    entityType="event"
                    entityId={event?.id}
                    customSectionMeta={eventSectionMeta}
                  />
                  {activeSection !== 'hero' && (
                    <div className="animate-zoom-in">
                      {renderSection()}
                    </div>
                  )}
                </div>
              ) : viewMode === 'sections' ? (
                <div className="animate-zoom-in">
                  {renderSection()}
                </div>
              ) : (
                renderFullPage()
              )}
            </div>
          </main>
        </div>
      </div>
      
      {/* Mobile Section Navigation */}
      <MobileEventSectionNav
        sectionOrder={sectionOrder}
        hiddenSections={hiddenSections}
        activeSection={activeSection}
        onSectionSelect={handleSectionChange}
        eventName={event.hero.name}
      />
      
      {/* Back to top button */}
      <BackToTopButton />

      {/* Regional Analysis Panel (admin only) */}
      {isGuideAdmin && event.organizationId && (
        <RegionalAnalysisPanel
          entityType="event"
          entityId={event.id}
          organizationId={event.organizationId}
          guideData={event as unknown as Record<string, unknown>}
          isOpen={regionalAnalysisOpen}
          onOpenChange={setRegionalAnalysisOpen}
        />
      )}

      {/* Translation Hub */}
      <TranslationHub
        open={translationHubOpen}
        onOpenChange={setTranslationHubOpen}
        entityId={event.id}
        entityType="event"
        entityName={event.hero.name}
      />

      {/* Intelligence Panel - rendered at top level so hero button works */}
      <Sheet open={intelligenceOpen} onOpenChange={setIntelligenceOpen}>
        <SheetContent side="right" className="w-full sm:w-[540px] sm:max-w-xl p-0 flex flex-col h-full min-h-0 overflow-hidden">
          <div className="p-6 flex-1 min-h-0">
            <BrandIntelligencePanel
              entityType="event"
              entityId={event.id}
              entityName={event.hero.name}
              organizationId={event.organizationId || undefined}
            />
          </div>
        </SheetContent>
      </Sheet>

      {/* Brand Assistant Floating Button */}
      {canEdit && (
        <>
          <Button
            onClick={() => setAssistantOpen(true)}
            className="fixed bottom-6 left-6 z-50 h-12 w-12 rounded-full shadow-lg bg-primary hover:bg-primary/90 text-primary-foreground p-0"
            aria-label="Open Brand Assistant"
          >
            <Bot className="h-5 w-5" />
          </Button>
          <Suspense fallback={null}>
            <BrandAssistant
              open={assistantOpen}
              onOpenChange={setAssistantOpen}
              entityType="event"
              entityId={event.id}
              entityName={event.hero.name}
            />
          </Suspense>
        </>
      )}
    </TooltipProvider>
  );
};

export default EventEditor;
