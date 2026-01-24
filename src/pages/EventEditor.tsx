import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTheme } from 'next-themes';
import { Menu, LayoutList, ScrollText, ArrowLeft, Lock, Shield, LogOut, Star, Calendar, Building2, Brain } from 'lucide-react';
import tpLogoWhite from '@/assets/tp-logo-white.svg';
import tpLogoColor from '@/assets/tp-logo-color.svg';
import { EventSectionId, DEFAULT_EVENT_SECTION_ORDER, EventGuide } from '@/types/event';
import { DEFAULT_PAGE_SETTINGS, BrandPageSettings, SectionId, SectionLayoutSettings } from '@/types/brand';
import { LayoutPreset } from '@/components/brand/LayoutSelector';
import { UnsavedChangesBlocker } from '@/components/UnsavedChangesBlocker';
import { PublicLoadingScreen } from '@/components/PublicLoadingScreen';
import { supabase } from '@/integrations/supabase/client';
import { useStableLoading } from '@/hooks/useStableLoading';
import { useEvents } from '@/contexts/EventContext';
import { useAuth } from '@/contexts/AuthContext';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useSEO } from '@/hooks/useSEO';
import { EventSidebar } from '@/components/event/EventSidebar';
import { EventDetailsSection } from '@/components/event/EventDetailsSection';
import { EventLogosSection } from '@/components/event/EventLogosSection';
import { EventSignageSection } from '@/components/event/EventSignageSection';
import { EventBannersSection } from '@/components/event/EventBannersSection';
import { EventDigitalSection } from '@/components/event/EventDigitalSection';
import { EventSponsorsSection } from '@/components/event/EventSponsorsSection';
import { EventScheduleSection } from '@/components/event/EventScheduleSection';
import { EventHistorySection } from '@/components/event/EventHistorySection';
import { EventVideosSection } from '@/components/event/EventVideosSection';
import { EventLocationSection } from '@/components/event/EventLocationSection';
import { EventWebsiteSection } from '@/components/event/EventWebsiteSection';
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
import { CaseStudiesSection } from '@/components/brand/CaseStudiesSection';
import { TemplatesSection } from '@/components/brand/TemplatesSection';
import { BrochuresSection } from '@/components/brand/BrochuresSection';
import { TemplateSpecsSection } from '@/components/brand/TemplateSpecsSection';
import { ShareButton } from '@/components/brand/ShareButton';
import { EventExportPdfButton } from '@/components/event/EventExportPdfButton';
import { BrandIntelligencePanel } from '@/components/brand/BrandIntelligencePanel';
import { BrandPageSettingsEditor } from '@/components/brand/BrandPageSettingsEditor';
import { AppBreadcrumbs } from '@/components/AppBreadcrumbs';
import { SyncStatusIndicator } from '@/components/SyncStatusIndicator';
import { HeroBackground } from '@/components/HeroBackground';
import { BackToTopButton } from '@/components/BackToTopButton';
import { MobileEventSectionNav } from '@/components/event/MobileEventSectionNav';
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';

type ViewMode = 'sections' | 'full';

const EventEditor = () => {
  const { eventSlug } = useParams<{ eventSlug: string }>();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { getEvent, getEventBySlug, updateEvent: updateEventContext, toggleFavorite, isLoading } = useEvents();
  const { user, isAdmin, isApproved, signOut, isLoading: authLoading } = useAuth();
  const { userRole: orgRole, organization } = useOrganization();
  
  const [activeSection, setActiveSection] = useState<EventSectionId>('hero');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('full');
  const [scrollToSection, setScrollToSection] = useState<EventSectionId | null>(null);
  const [publicEvent, setPublicEvent] = useState<EventGuide | null>(null);
  const [publicEventLoading, setPublicEventLoading] = useState(false);
  const [intelligenceOpen, setIntelligenceOpen] = useState(false);

  // Redirect unapproved users
  useEffect(() => {
    if (!authLoading && user && !isApproved && !isAdmin) {
      navigate('/pending-approval');
    }
  }, [user, isApproved, isAdmin, authLoading, navigate]);

  // Scroll to top when event changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [eventSlug]);

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

  // Fetch public event if not in context
  const hasFetchedPublicRef = useRef<string | null>(null);
  
  useEffect(() => {
    const fetchPublicEvent = async () => {
      if (!eventSlug || contextEvent || hasFetchedPublicRef.current === eventSlug) return;
      
      setPublicEventLoading(true);
      hasFetchedPublicRef.current = eventSlug;
      
      try {
        let query = supabase
          .from('events')
          .select('*')
          .eq('is_public', true);
        
        if (isUUID(eventSlug)) {
          query = query.eq('id', eventSlug);
        } else {
          query = query.eq('slug', eventSlug);
        }
        
        const { data, error } = await query.maybeSingle();
        
        if (!error && data) {
          // Convert to EventGuide - simplified version
          const guideData = (data.guide_data || {}) as Record<string, unknown>;
          const event: EventGuide = {
            id: data.id,
            type: 'event',
            slug: data.slug,
            organizationId: data.organization_id,
            parentBrandId: data.parent_brand_id || undefined,
            isFavorite: data.is_favorite ?? false,
            isPublic: data.is_public ?? false,
            sectionOrder: (Array.isArray(data.section_order) ? data.section_order : DEFAULT_EVENT_SECTION_ORDER) as EventSectionId[],
            hiddenSections: (Array.isArray(data.hidden_sections) ? data.hidden_sections : []) as EventSectionId[],
            hero: (guideData.hero || { name: data.name, tagline: '', coverImage: '', logoUrl: '' }) as EventGuide['hero'],
            tagline: (guideData.tagline || { primary: '', secondary: '', variations: [] }) as EventGuide['tagline'],
            identity: (guideData.identity || { missionStatement: '', archetype: '', toneOfVoice: [] }) as EventGuide['identity'],
            values: (Array.isArray(guideData.values) ? guideData.values : []) as EventGuide['values'],
            eventDetails: (guideData.eventDetails || { eventName: data.name, eventDates: '', location: '' }) as EventGuide['eventDetails'],
            eventLogos: (Array.isArray(guideData.eventLogos) ? guideData.eventLogos : []) as EventGuide['eventLogos'],
            eventSignage: (Array.isArray(guideData.eventSignage) ? guideData.eventSignage : []) as EventGuide['eventSignage'],
            eventBanners: (Array.isArray(guideData.eventBanners) ? guideData.eventBanners : []) as EventGuide['eventBanners'],
            eventDigitalMaterials: (Array.isArray(guideData.eventDigitalMaterials) ? guideData.eventDigitalMaterials : []) as EventGuide['eventDigitalMaterials'],
            eventSchedule: (Array.isArray(guideData.eventSchedule) ? guideData.eventSchedule : []) as EventGuide['eventSchedule'],
            eventSpeakers: (Array.isArray(guideData.eventSpeakers) ? guideData.eventSpeakers : []) as EventGuide['eventSpeakers'],
            eventSponsors: (Array.isArray(guideData.eventSponsors) ? guideData.eventSponsors : []) as EventGuide['eventSponsors'],
            eventHistory: (Array.isArray(guideData.eventHistory) ? guideData.eventHistory : []) as EventGuide['eventHistory'],
            eventVideos: (Array.isArray(guideData.eventVideos) ? guideData.eventVideos : []) as EventGuide['eventVideos'],
            eventLocation: (guideData.eventLocation || { venueName: '', address: '', city: '', country: '', venueMaps: [] }) as EventGuide['eventLocation'],
            logos: (Array.isArray(guideData.logos) ? guideData.logos : []) as EventGuide['logos'],
            brandIcons: (Array.isArray(guideData.brandIcons) ? guideData.brandIcons : []) as EventGuide['brandIcons'],
            colors: (Array.isArray(guideData.colors) ? guideData.colors : []) as EventGuide['colors'],
            colorCombinations: (Array.isArray(guideData.colorCombinations) ? guideData.colorCombinations : []) as EventGuide['colorCombinations'],
            gradients: (Array.isArray(guideData.gradients) ? guideData.gradients : []) as EventGuide['gradients'],
            patterns: (Array.isArray(guideData.patterns) ? guideData.patterns : []) as EventGuide['patterns'],
            typography: (Array.isArray(guideData.typography) ? guideData.typography : []) as EventGuide['typography'],
            textStyles: (Array.isArray(guideData.textStyles) ? guideData.textStyles : []) as EventGuide['textStyles'],
            iconography: (Array.isArray(guideData.iconography) ? guideData.iconography : []) as EventGuide['iconography'],
            socialIcons: (Array.isArray(guideData.socialIcons) ? guideData.socialIcons : []) as EventGuide['socialIcons'],
            imagery: (Array.isArray(guideData.imagery) ? guideData.imagery : []) as EventGuide['imagery'],
            social: (Array.isArray(guideData.social) ? guideData.social : []) as EventGuide['social'],
            socialAssets: (Array.isArray(guideData.socialAssets) ? guideData.socialAssets : []) as EventGuide['socialAssets'],
            displayBanners: (Array.isArray(guideData.displayBanners) ? guideData.displayBanners : []) as EventGuide['displayBanners'],
            websites: (Array.isArray(guideData.websites) ? guideData.websites : []) as EventGuide['websites'],
            signatures: (Array.isArray(guideData.signatures) ? guideData.signatures : []) as EventGuide['signatures'],
            emailBanners: (Array.isArray(guideData.emailBanners) ? guideData.emailBanners : []) as EventGuide['emailBanners'],
            qr: (guideData.qr || { defaultUrl: '', fgColor: '#000000', bgColor: '#ffffff' }) as EventGuide['qr'],
            videos: (Array.isArray(guideData.videos) ? guideData.videos : []) as EventGuide['videos'],
            assets: (Array.isArray(guideData.assets) ? guideData.assets : []) as EventGuide['assets'],
            misuse: (Array.isArray(guideData.misuse) ? guideData.misuse : []) as EventGuide['misuse'],
            atmosphere: (guideData.atmosphere || { style: 'gradient', animate: true, opacity: 0.5, blur: 0 }) as EventGuide['atmosphere'],
            caseStudies: (Array.isArray(guideData.caseStudies) ? guideData.caseStudies : []) as EventGuide['caseStudies'],
            brochures: (Array.isArray(guideData.brochures) ? guideData.brochures : []) as EventGuide['brochures'],
            templates: (Array.isArray(guideData.templates) ? guideData.templates : []) as EventGuide['templates'],
            services: (Array.isArray(guideData.services) ? guideData.services : []) as EventGuide['services'],
            pageSettings: (guideData.pageSettings || DEFAULT_PAGE_SETTINGS) as EventGuide['pageSettings'],
            createdAt: new Date(data.created_at),
            updatedAt: new Date(data.updated_at),
          };
          setPublicEvent(event);
        }
      } catch (err) {
        console.error('Error fetching public event:', err);
      } finally {
        setPublicEventLoading(false);
      }
    };
    
    fetchPublicEvent();
  }, [eventSlug, contextEvent]);
  
  const event = contextEvent || publicEvent;
  
  // Check if user can edit: global admin OR org member with appropriate role
  // During auth loading, we preserve potential edit access for logged-in users to avoid UI flicker
  const canEditOrg = orgRole && ['owner', 'admin', 'member'].includes(orgRole);
  const canEdit = user && (isAdmin || canEditOrg || authLoading);
  const isGuideAdmin = Boolean(isAdmin || canEditOrg);
  
  const sectionOrder = useMemo(() => event?.sectionOrder || DEFAULT_EVENT_SECTION_ORDER, [event?.sectionOrder]);
  const hiddenSections = useMemo(() => event?.hiddenSections || [], [event?.hiddenSections]);
  const sectionLayouts = useMemo(() => event?.sectionLayouts || {}, [event?.sectionLayouts]);
  const pageSettings = event?.pageSettings || DEFAULT_PAGE_SETTINGS;

  const getSectionLayout = useCallback((sectionId: EventSectionId): LayoutPreset => {
    return (sectionLayouts[sectionId as SectionId] as LayoutPreset) || 'grid-3';
  }, [sectionLayouts]);

  const handleSectionLayoutChange = useCallback((sectionId: EventSectionId, layout: LayoutPreset) => {
    if (event) {
      updateEventContext(event.id, {
        sectionLayouts: { ...sectionLayouts, [sectionId]: layout }
      });
    }
  }, [event, updateEventContext, sectionLayouts]);

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

  // Optimized loading: prevents flash for fast loads
  const needsPublicData = !contextEvent && !publicEvent;
  const rawLoading = needsPublicData && publicEventLoading;
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

  if (!event) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-foreground mb-2">Event not found</h1>
          <p className="text-muted-foreground mb-4">The event you're looking for doesn't exist.</p>
          <Button onClick={() => navigate('/')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  const updateEvent = (updates: Partial<EventGuide>) => {
    updateEventContext(event.id, updates);
  };

  // Unified section renderer - used by both single-section and full-page views
  const renderSectionContent = useCallback((sectionId: EventSectionId) => {
    // Helper to conditionally create change handler
    const editHandler = <T,>(handler: (value: T) => void) => canEdit ? handler : undefined;
    
    switch (sectionId) {
      case 'hero': 
        return <HeroSection hero={event.hero} onHeroChange={editHandler((hero) => updateEvent({ hero }))} />;
      case 'eventdetails':
        return <EventDetailsSection eventDetails={event.eventDetails} onUpdate={(eventDetails) => updateEvent({ eventDetails: { ...event.eventDetails, ...eventDetails } })} isEditable={canEdit || false} />;
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
        return <EventWebsiteSection websites={event.websites || []} onWebsitesChange={(websites) => updateEvent({ websites })} isEditable={canEdit || false} />;
      case 'eventlogos':
        return <EventLogosSection logos={event.eventLogos || []} onUpdate={(eventLogos) => updateEvent({ eventLogos })} isEditable={canEdit || false} />;
      case 'eventsignage':
        return <EventSignageSection signage={event.eventSignage || []} onUpdate={(eventSignage) => updateEvent({ eventSignage })} isEditable={canEdit || false} layout={getSectionLayout('eventsignage')} onLayoutChange={canEdit ? (layout) => handleSectionLayoutChange('eventsignage', layout) : undefined} />;
      case 'eventbanners':
        return <EventBannersSection banners={event.eventBanners || []} onUpdate={(eventBanners) => updateEvent({ eventBanners })} isEditable={canEdit || false} />;
      case 'eventdigital':
        return <EventDigitalSection materials={event.eventDigitalMaterials || []} onUpdate={(eventDigitalMaterials) => updateEvent({ eventDigitalMaterials })} isEditable={canEdit || false} />;
      case 'colors': 
        return <ColorPaletteSection colors={event.colors} onColorsChange={editHandler((colors) => updateEvent({ colors }))} colorCombinations={event.colorCombinations} onColorCombinationsChange={editHandler((colorCombinations) => updateEvent({ colorCombinations }))} brandName={event.hero.name} />;
      case 'gradients': 
        return <GradientsSection gradients={event.gradients} onGradientsChange={editHandler((gradients) => updateEvent({ gradients }))} />;
      case 'typography': 
        return <TypographySection typography={event.typography} onTypographyChange={editHandler((typography) => updateEvent({ typography }))} />;
      case 'imagery': 
        return <ImagerySection imagery={event.imagery} onImageryChange={editHandler((imagery) => updateEvent({ imagery }))} />;
      case 'social': 
        return <SocialSection social={event.social} onSocialChange={editHandler((social) => updateEvent({ social }))} />;
      case 'socialassets': 
        return (
          <SocialAssetsSection
            socialAssets={event.socialAssets || []}
            onSocialAssetsChange={editHandler((socialAssets) => updateEvent({ socialAssets }))}
            displayBanners={event.displayBanners || []}
            onDisplayBannersChange={editHandler((displayBanners) => updateEvent({ displayBanners }))}
          />
        );
      case 'eventspeakers':
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Event Speakers</h2>
            {event.eventSpeakers?.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {event.eventSpeakers.map((speaker) => (
                  <div key={speaker.id} className="p-4 rounded-lg border bg-card text-center">
                    {speaker.photoUrl && (
                      <img src={speaker.photoUrl} alt={speaker.name} className="w-24 h-24 rounded-full mx-auto mb-3 object-cover" />
                    )}
                    <h3 className="font-medium">{speaker.name}</h3>
                    <p className="text-sm text-muted-foreground">{speaker.title}</p>
                    {speaker.company && <p className="text-xs text-muted-foreground">{speaker.company}</p>}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No speakers added yet.</p>
            )}
          </div>
        );
      case 'eventsponsors':
        return <EventSponsorsSection sponsors={event.eventSponsors || []} onUpdate={(eventSponsors) => updateEvent({ eventSponsors })} isEditable={canEdit || false} />;
      case 'eventschedule':
        return <EventScheduleSection schedule={event.eventSchedule || []} onUpdate={(eventSchedule) => updateEvent({ eventSchedule })} speakers={event.eventSpeakers || []} isEditable={canEdit || false} />;
      case 'eventhistory':
        return <EventHistorySection history={event.eventHistory || []} onUpdate={(eventHistory) => updateEvent({ eventHistory })} isEditable={canEdit || false} />;
      case 'eventvideos':
        return <EventVideosSection videos={event.eventVideos || []} onUpdate={(eventVideos) => updateEvent({ eventVideos })} isEditable={canEdit || false} />;
      case 'eventlocation':
        return <EventLocationSection location={event.eventLocation || { venueName: '', address: '', city: '', country: '', venueMaps: [] }} onUpdate={(eventLocation) => updateEvent({ eventLocation })} isEditable={canEdit || false} />;
      case 'assets': 
        return <AssetsSection assets={event.assets} onAssetsChange={editHandler((assets) => updateEvent({ assets }))} />;
      case 'misuse':
        return <MisuseSection misuse={event.misuse} onMisuseChange={editHandler((misuse) => updateEvent({ misuse }))} />;
      case 'casestudies':
        return <CaseStudiesSection caseStudies={event.caseStudies || []} onCaseStudiesChange={editHandler((caseStudies) => updateEvent({ caseStudies }))} layout={getSectionLayout('casestudies')} onLayoutChange={canEdit ? (layout) => handleSectionLayoutChange('casestudies', layout) : undefined} />;
      case 'templates':
        return <TemplatesSection templates={event.templates || []} onTemplatesChange={editHandler((templates) => updateEvent({ templates }))} layout={getSectionLayout('templates')} onLayoutChange={canEdit ? (layout) => handleSectionLayoutChange('templates', layout) : undefined} />;
      case 'brochures':
        return <BrochuresSection brochures={event.brochures || []} onBrochuresChange={editHandler((brochures) => updateEvent({ brochures }))} layout={getSectionLayout('brochures')} onLayoutChange={canEdit ? (layout) => handleSectionLayoutChange('brochures', layout) : undefined} />;
      case 'templatespecs':
        return <TemplateSpecsSection templateSpecs={event.templateSpecs || []} onTemplateSpecsChange={editHandler((templateSpecs) => updateEvent({ templateSpecs }))} />;
      default:
        return null;
    }
  }, [event, canEdit, getSectionLayout, handleSectionLayoutChange]);

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
    const visibleSections = isGuideAdmin 
      ? sectionOrder 
      : sectionOrder.filter(id => !hiddenSections.includes(id));

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
        {/* Desktop Sidebar - Fixed position for persistent visibility */}
        <div className="hidden lg:block fixed top-0 left-0 h-screen w-64 z-30">
          <EventSidebar 
            activeSection={activeSection} 
            onSectionChange={handleSectionChange} 
            eventName={event.hero.name}
            sectionOrder={sectionOrder}
            onSectionOrderChange={handleSectionOrderChange}
            hiddenSections={hiddenSections}
            onHiddenSectionsChange={handleHiddenSectionsChange}
            isAdmin={isGuideAdmin}
          />
        </div>
        
        {/* Sidebar spacer for fixed positioning */}
        <div className="hidden lg:block w-64 flex-shrink-0" />

        {/* Mobile Sidebar */}
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetContent side="left" className="p-0 w-72">
            <EventSidebar 
              activeSection={activeSection} 
              onSectionChange={(section) => { handleSectionChange(section); setSidebarOpen(false); }} 
              eventName={event.hero.name}
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
                <div className="flex items-center gap-2">
                  <img 
                    src={theme === 'dark' ? tpLogoWhite : tpLogoColor} 
                    alt="BrandHUB" 
                    className="h-6 w-6 object-contain flex-shrink-0" 
                  />
                  <span className="font-semibold text-foreground hidden sm:inline">
                    Brand<span className="text-accent">HUB</span>
                  </span>
                </div>
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
                <ShareButton 
                  guideId={event.id} 
                  guideName={event.hero.name} 
                  type="event" 
                  isPublic={event.isPublic || false}
                  onPublicChange={(isPublic) => updateEvent({ isPublic })}
                  canEdit={canEdit || false}
                  organizationSlug={organization?.slug}
                />
                <EventExportPdfButton event={event} />
                {canEdit && (
                  <Sheet open={intelligenceOpen} onOpenChange={setIntelligenceOpen}>
                    <SheetTrigger asChild>
                      <Button variant="ghost" size="icon" className="relative">
                        <Brain className="h-5 w-5" />
                        <span className="sr-only">Event Intelligence</span>
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="right" className="w-full sm:w-[540px] sm:max-w-xl p-0 overflow-y-auto">
                      <div className="p-6">
                        <BrandIntelligencePanel
                          entityType="event"
                          entityId={event.id}
                          entityName={event.hero.name}
                          organizationId={event.organizationId || undefined}
                        />
                      </div>
                    </SheetContent>
                  </Sheet>
                )}
                {canEdit && (
                  <BrandPageSettingsEditor
                    settings={pageSettings} 
                    onSettingsChange={handlePageSettingsChange} 
                  />
                )}
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
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem className="text-xs text-muted-foreground">
                        {user.email}
                      </DropdownMenuItem>
                      {isAdmin && (
                        <DropdownMenuItem className="gap-2 text-accent">
                          <Shield className="h-4 w-4" />
                          Admin
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleSignOut} className="gap-2">
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

          {/* Content */}
          <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">
            <div className={`${getContentWidthClass()} mx-auto animate-fade-in-up ${getSectionSpacingClass()}`}>
              {/* Breadcrumbs */}
              <AppBreadcrumbs
                items={[
                  { label: organization?.name || 'Events', icon: organization ? Building2 : Calendar, href: organization ? `/org/${organization.slug}` : '/' },
                ]}
                currentPage={event.hero.name}
                currentIcon={Calendar}
                className="mb-6"
              />
              
              {viewMode === 'sections' ? (
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
    </TooltipProvider>
  );
};

export default EventEditor;
