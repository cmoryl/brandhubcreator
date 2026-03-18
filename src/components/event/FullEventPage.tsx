import { useMemo, useCallback, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { EventSectionId, DEFAULT_EVENT_SECTION_ORDER, EventGuide } from '@/types/event';
import { HeroSection } from '@/components/brand/HeroSection';
import { TaglineSection } from '@/components/brand/TaglineSection';
import { ColorPaletteSection } from '@/components/brand/ColorPaletteSection';
import { GradientsSection } from '@/components/brand/GradientsSection';
import { TypographySection } from '@/components/brand/TypographySection';
import { ImagerySection } from '@/components/brand/ImagerySection';
import { SocialSection } from '@/components/brand/SocialSection';
import { SocialAssetsSection } from '@/components/brand/SocialAssetsSection';
import { AssetsSection } from '@/components/brand/AssetsSection';
import { ImageAssetsSection } from '@/components/brand/ImageAssetsSection';
import { MisuseSection } from '@/components/brand/MisuseSection';
import { DigitalCollateralSection } from '@/components/brand/DigitalCollateralSection';
import { TemplatesSection } from '@/components/brand/TemplatesSection';
import { TemplateSpecsSection } from '@/components/brand/TemplateSpecsSection';
import { SponsorLogosSection } from '@/components/brand/SponsorLogosSection';
import { ClientLogosSection } from '@/components/brand/ClientLogosSection';
import { ApprovedImagerySection } from '@/components/brand/approved-imagery/ApprovedImagerySection';
import { EventDetailsSection } from './EventDetailsSection';
import { EventLogosSection } from './EventLogosSection';
import { EventSignageSection } from './EventSignageSection';
import { EventPrintCollateralSection } from './EventPrintCollateralSection';

import { EventDigitalSection } from './EventDigitalSection';
import { EventSponsorsSection } from './EventSponsorsSection';
import { EventScheduleSection } from './EventScheduleSection';
import { EventHistorySection } from './EventHistorySection';
import { EventVideosSection } from './EventVideosSection';
import { EventLocationSection } from './EventLocationSection';
import { EventWebsiteSection } from './EventWebsiteSection';
import { SubEventsSection, LinkedEventGuide } from './SubEventsSection';
import { SubEventsManager } from './SubEventsManager';
import { SharedAssetsSection, SharedAsset } from './SharedAssetsSection';
import { syncSharedAssetsToSubEvents } from '@/lib/syncSharedAssetsToSubEvents';
import { EventPatternsSection } from './EventPatternsSection';
import { EventSpeakersSection } from './EventSpeakersSection';
import { PresentationTemplatesSection } from '@/components/brand/PresentationTemplatesSection';
import { QRSection } from '@/components/brand/QRSection';
import { Separator } from '@/components/ui/separator';
import { InsightsSection } from '@/components/brand/InsightsSection';

export interface FullEventPageProps {
  event: EventGuide;
  eventId: string;
  onEventUpdate?: (updates: Partial<EventGuide>) => void;
  sectionOrder?: EventSectionId[];
  hiddenSections?: EventSectionId[];
  isAdmin?: boolean;
  canEdit?: boolean;
  heroFullWidth?: boolean;
  scrollToSection?: EventSectionId | null;
  onSectionVisible?: (sectionId: EventSectionId) => void;
}

export const FullEventPage = ({
  event,
  eventId,
  onEventUpdate,
  sectionOrder = DEFAULT_EVENT_SECTION_ORDER,
  hiddenSections = [],
  isAdmin = false,
  canEdit = false,
  heroFullWidth = false,
  scrollToSection = null,
  onSectionVisible,
}: FullEventPageProps) => {
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Scroll to section when scrollToSection changes
  useEffect(() => {
    if (scrollToSection) {
      const element = document.getElementById(scrollToSection);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        
        // Add highlight flash after scroll completes
        const flashTimeout = setTimeout(() => {
          element.classList.add('section-highlight-flash');
          const cleanupTimeout = setTimeout(() => {
            element.classList.remove('section-highlight-flash');
          }, 1300);
          return () => clearTimeout(cleanupTimeout);
        }, 400);
        
        return () => clearTimeout(flashTimeout);
      }
    }
  }, [scrollToSection]);

  // Intersection observer for section visibility
  useEffect(() => {
    if (!onSectionVisible) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const sectionId = entry.target.id as EventSectionId;
            if (sectionId && sectionOrder.includes(sectionId)) {
              onSectionVisible(sectionId);
            }
          }
        });
      },
      { threshold: 0.3, rootMargin: '-80px 0px -50% 0px' }
    );

    // Observe all section elements
    sectionOrder.forEach((sectionId) => {
      const element = document.getElementById(sectionId);
      if (element) {
        observer.observe(element);
      }
    });

    return () => observer.disconnect();
  }, [sectionOrder, onSectionVisible]);
  // Helper to conditionally create change handler
  const editHandler = useCallback(<T,>(handler: (value: T) => void) => {
    return canEdit && onEventUpdate ? handler : undefined;
  }, [canEdit, onEventUpdate]);

  const updateEvent = useCallback((updates: Partial<EventGuide>) => {
    if (onEventUpdate) {
      onEventUpdate(updates);
    }
  }, [onEventUpdate]);

  // Render section content based on sectionId
  const renderSectionContent = useCallback((sectionId: EventSectionId) => {
    switch (sectionId) {
      case 'hero':
        return (
          <HeroSection
            hero={event.hero}
            onHeroChange={editHandler((hero) => updateEvent({ hero }))}
            fullWidth={heroFullWidth}
            guideData={event as unknown as Record<string, unknown>}
            entityType="event"
            entityId={eventId}
            hiddenSections={hiddenSections}
          />
        );
      case 'tagline':
        return (
          <TaglineSection
            tagline={event.tagline}
            onTaglineChange={editHandler((tagline) => updateEvent({ tagline }))}
          />
        );
      case 'eventdetails':
        return (
          <EventDetailsSection
            eventDetails={event.eventDetails || { eventName: '', eventDates: '', location: '' }}
            onUpdate={canEdit ? (updates) => updateEvent({ eventDetails: { ...event.eventDetails, ...updates } as any }) : () => {}}
            isEditable={canEdit}
          />
        );
      case 'eventlogos':
        return (
          <EventLogosSection
            logos={event.eventLogos || []}
            onUpdate={canEdit ? (eventLogos) => updateEvent({ eventLogos }) : () => {}}
            isEditable={canEdit}
            entityId={event.id}
            entityType="event"
          />
        );
      case 'eventsignage':
        return (
          <EventSignageSection
            signage={event.eventSignage || []}
            onUpdate={canEdit ? (eventSignage) => updateEvent({ eventSignage }) : () => {}}
            isEditable={canEdit}
            brandName={event.hero?.name}
            brandColors={event.colors?.map(c => c.hex)}
            eventId={eventId}
          />
        );
      case 'eventprint':
        return (
          <EventPrintCollateralSection
            items={event.eventPrintMaterials || []}
            onItemsChange={canEdit ? (eventPrintMaterials) => updateEvent({ eventPrintMaterials }) : undefined}
            isEditable={canEdit}
            eventId={eventId}
          />
        );
      case 'eventbanners':
      case 'eventdigital':
        return (
          <EventDigitalSection
            materials={event.eventDigitalMaterials || []}
            onUpdate={canEdit ? (eventDigitalMaterials) => updateEvent({ eventDigitalMaterials }) : () => {}}
            banners={event.eventBanners || []}
            onBannersChange={canEdit ? (eventBanners) => updateEvent({ eventBanners }) : undefined}
            templates={event.templates || []}
            onTemplatesChange={editHandler((templates) => updateEvent({ templates }))}
            brochures={event.brochures || []}
            onBrochuresChange={editHandler((brochures) => updateEvent({ brochures }))}
            printMaterials={event.eventPrintMaterials || []}
            onPrintMaterialsChange={canEdit ? (eventPrintMaterials) => updateEvent({ eventPrintMaterials }) : undefined}
            sponsorshipMaterials={event.eventSponsorshipMaterials || []}
            onSponsorshipMaterialsChange={canEdit ? (eventSponsorshipMaterials) => updateEvent({ eventSponsorshipMaterials }) : undefined}
            emailBanners={event.emailBanners || []}
            onEmailBannersChange={canEdit ? (emailBanners) => updateEvent({ emailBanners }) : undefined}
            digitalAssets={event.eventDigitalAssets || []}
            onDigitalAssetsChange={canEdit ? (eventDigitalAssets) => updateEvent({ eventDigitalAssets }) : undefined}
            infographics={event.eventInfographics || []}
            onInfographicsChange={canEdit ? (eventInfographics) => updateEvent({ eventInfographics }) : undefined}
            applications={event.eventApplications || []}
            onApplicationsChange={canEdit ? (eventApplications) => updateEvent({ eventApplications }) : undefined}
            isEditable={canEdit}
            eventId={event.id}
          />
        );
      case 'eventwebsites':
        return (
          <EventWebsiteSection
            websites={event.websites || []}
            onWebsitesChange={canEdit ? (websites) => updateEvent({ websites }) : () => {}}
            isEditable={canEdit}
          />
        );
      case 'eventlocation':
        return (
          <EventLocationSection
            location={event.eventLocation || { venueName: '', address: '', city: '', country: '', venueMaps: [] }}
            onUpdate={canEdit ? (eventLocation) => updateEvent({ eventLocation }) : () => {}}
            isEditable={canEdit}
          />
        );
      case 'eventschedule':
        return (
          <EventScheduleSection
            schedule={event.eventSchedule || []}
            onUpdate={canEdit ? (eventSchedule) => updateEvent({ eventSchedule }) : () => {}}
            speakers={event.eventSpeakers || []}
            isEditable={canEdit}
          />
        );
      case 'eventspeakers':
        return (
          <EventSpeakersSection
            speakers={event.eventSpeakers || []}
            onUpdate={canEdit ? (eventSpeakers) => updateEvent({ eventSpeakers }) : () => {}}
            isEditable={canEdit}
            eventId={event?.id}
          />
        );
      case 'eventsponsors':
        return (
          <EventSponsorsSection
            sponsors={event.eventSponsors || []}
            onUpdate={canEdit ? (eventSponsors) => updateEvent({ eventSponsors }) : () => {}}
            isEditable={canEdit}
            entityId={event.id}
            entityType="event"
          />
        );
      case 'eventhistory':
        return (
          <EventHistorySection
            history={event.eventHistory || []}
            onUpdate={canEdit ? (eventHistory) => updateEvent({ eventHistory }) : () => {}}
            isEditable={canEdit}
          />
        );
      case 'eventvideos':
        return (
          <EventVideosSection
            videos={event.eventVideos || []}
            onUpdate={canEdit ? (eventVideos) => updateEvent({ eventVideos }) : () => {}}
            isEditable={canEdit}
          />
        );
      case 'colors':
        return (
          <ColorPaletteSection
            colors={event.colors || []}
            onColorsChange={editHandler((colors) => updateEvent({ colors }))}
            colorCombinations={event.colorCombinations || []}
            onColorCombinationsChange={editHandler((colorCombinations) => updateEvent({ colorCombinations }))}
            brandName={event.hero.name}
          />
        );
      case 'gradients':
        return (
          <GradientsSection
            gradients={event.gradients || []}
            onGradientsChange={editHandler((gradients) => updateEvent({ gradients }))}
          />
        );
      case 'typography':
        return (
          <TypographySection
            typography={event.typography || []}
            onTypographyChange={editHandler((typography) => updateEvent({ typography }))}
          />
        );
      case 'imagery':
        return (
          <ImagerySection
            imagery={event.imagery || []}
            onImageryChange={editHandler((imagery) => updateEvent({ imagery }))}
          />
        );
      case 'social':
        return (
          <SocialSection
            social={event.social || []}
            onSocialChange={editHandler((social) => updateEvent({ social }))}
            entityId={eventId}
            entityType="event"
            organizationId={event.organizationId}
            entityName={event.hero?.name}
          />
        );
      case 'socialassets':
        return (
          <SocialAssetsSection
            socialAssets={event.socialAssets || []}
            onSocialAssetsChange={editHandler((socialAssets) => updateEvent({ socialAssets }))}
            displayBanners={event.displayBanners || []}
            onDisplayBannersChange={editHandler((displayBanners) => updateEvent({ displayBanners }))}
            entityId={eventId}
            entityType="event"
          />
        );
      case 'assets':
        return (
          <AssetsSection
            assets={event.assets || []}
            onAssetsChange={editHandler((assets) => updateEvent({ assets }))}
          />
        );
      case 'imageassets':
        return (
          <ImageAssetsSection
            imageAssets={event.imageAssets || []}
            onImageAssetsChange={editHandler((imageAssets) => updateEvent({ imageAssets }))}
            canEdit={canEdit}
            entityId={eventId}
            entityType="event"
          />
        );
      case 'misuse':
        return (
          <MisuseSection
            misuse={event.misuse || []}
            onMisuseChange={editHandler((misuse) => updateEvent({ misuse }))}
          />
        );
      case 'casestudies':
      case 'brochures':
        // Now handled in eventdigital section
        return null;
      case 'templates':
        // Now handled in eventdigital section
        return null;
      case 'templatespecs':
        return (
          <TemplateSpecsSection
            templateSpecs={event.templateSpecs || []}
            onTemplateSpecsChange={editHandler((templateSpecs) => updateEvent({ templateSpecs }))}
            entityId={event.id}
            entityType="event"
          />
        );
      case 'subevents': {
        // Convert linkedGuides to the expected format
        const linkedEvents: LinkedEventGuide[] = (event.linkedGuides || [])
          .filter(g => g.type === 'event')
          .map(g => ({
            id: g.id,
            type: 'event' as const,
            slug: g.slug || '',
            name: g.name || '',
            region: g.region,
            accentColor: g.accentColor,
            location: g.location,
            dates: g.dates,
            attendees: g.attendees,
            coverImage: g.coverImage,
          }));
        
        // If in edit mode, show the manager; otherwise show the display section
        if (canEdit) {
          return (
            <SubEventsManager
              eventId={eventId}
              linkedGuides={linkedEvents}
              onLinkedGuidesChange={(guides) => updateEvent({ linkedGuides: guides } as any)}
              masterEventName={event.hero?.name || 'Master Event'}
              masterEventSlug={event.slug}
            />
          );
        }
        
        // Display-only mode - only show if there are sub-events
        if (linkedEvents.length === 0) return null;
        
        return (
          <SubEventsSection
            linkedGuides={linkedEvents}
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
            isEditable={canEdit}
            eventId={event?.id}
          />
        );
      }
      case 'eventpatterns':
        return (
          <EventPatternsSection
            patterns={event.patterns || []}
            onPatternsChange={canEdit ? (patterns) => updateEvent({ patterns }) : undefined}
            isEditable={canEdit}
            eventName={event.hero?.name}
            eventColors={event.colors}
            eventTagline={event.tagline?.primary}
          />
        );
      case 'sponsorlogos':
        return (
          <SponsorLogosSection
            sponsors={event.sponsorLogos || []}
            onSponsorsChange={canEdit ? (sponsorLogos) => updateEvent({ sponsorLogos }) : undefined}
          />
        );
      case 'clientlogos':
        return (
          <ClientLogosSection
            clientLogos={event.clientLogos || []}
            onClientLogosChange={editHandler((clientLogos) => updateEvent({ clientLogos }))}
          />
        );
      case 'presentations':
        return (
          <PresentationTemplatesSection
            presentations={event.presentationTemplates || []}
            onUpdate={editHandler((presentationTemplates) => updateEvent({ presentationTemplates }))}
            isEditable={canEdit}
            entityId={eventId}
            entityType="event"
          />
        );
      case 'insights':
        return (
          <InsightsSection
            insights={(event as any).insights || []}
            layout={(event as any).insightsLayout}
            onInsightsChange={editHandler((insights) => updateEvent({ insights } as any))}
            onLayoutChange={canEdit ? (insightsLayout) => updateEvent({ insightsLayout } as any) : undefined}
            entityType="event"
            entityId={eventId}
            websites={(event as any).websites}
            entityName={event.hero?.name}
            industry={event.identity?.archetype}
            organizationId={(event as any).organizationId}
            brandContext={{
              colors: event.colors?.map?.((c: any) => c.hex) || [],
              archetype: event.identity?.archetype,
              mission: event.identity?.missionStatement,
              tagline: event.hero?.tagline,
            }}
            insightsAccessCode={(event as any).insightsAccessCode}
            eventData={event}
          />
        );
      case 'qr':
        return (
          <QRSection
            qr={event.qr}
            onQRChange={editHandler((qr) => updateEvent({ qr }))}
            entityType="event"
            entityId={eventId}
            logos={event.logos}
          />
        );
      case 'approvedimagery':
        return (
          <ApprovedImagerySection
            approvedImagery={(event as any).approvedImagery}
            onApprovedImageryChange={editHandler((approvedImagery) => updateEvent({ approvedImagery } as any))}
            canEdit={canEdit}
            entityId={eventId}
            entityType="event"
            organizationId={(event as any).organizationId}
          />
        );
      default:
        return null;
    }
  }, [event, canEdit, heroFullWidth, editHandler, updateEvent]);

  // Filter out hidden sections for non-admin users
  const visibleSections = useMemo(() => {
    // Deduplicate: eventbanners merged into eventdigital
    const deduped = sectionOrder.filter(id => {
      if (id === 'eventbanners' && sectionOrder.includes('eventdigital')) return false;
      if (id === 'templates') return false; // Master Scaffolds removed from events
      return true;
    });
    return isAdmin ? deduped : deduped.filter(id => !hiddenSections.includes(id));
  }, [isAdmin, sectionOrder, hiddenSections]);

  return (
    <div className="space-y-8 sm:space-y-12">
      {visibleSections.map((sectionId, index) => {
        const content = renderSectionContent(sectionId);
        if (!content) return null;

        const isHidden = hiddenSections.includes(sectionId);
        const isLast = index >= visibleSections.length - 1;

        // Hero section should be full-width, other sections get content container
        const isHeroSection = sectionId === 'hero';

        return (
          <div key={sectionId}>
            <div
              id={sectionId}
              className={cn(
                'scroll-mt-24',
                isHidden && isAdmin && 'opacity-50 relative',
                !isHeroSection && 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'
              )}
            >
              {isHidden && isAdmin && (
                <div className="absolute -top-2 right-0 text-xs bg-muted px-2 py-1 rounded text-muted-foreground z-10">
                  Hidden from viewers
                </div>
              )}
              {content}
            </div>
            {!isLast && <Separator className="my-8 sm:my-12 max-w-7xl mx-auto" />}
          </div>
        );
      })}
      <div className="h-32" />
    </div>
  );
};
