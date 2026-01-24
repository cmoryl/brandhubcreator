import { useMemo, useCallback, useEffect, useRef } from 'react';
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
import { MisuseSection } from '@/components/brand/MisuseSection';
import { CaseStudiesSection } from '@/components/brand/CaseStudiesSection';
import { TemplatesSection } from '@/components/brand/TemplatesSection';
import { BrochuresSection } from '@/components/brand/BrochuresSection';
import { TemplateSpecsSection } from '@/components/brand/TemplateSpecsSection';
import { EventDetailsSection } from './EventDetailsSection';
import { EventLogosSection } from './EventLogosSection';
import { EventSignageSection } from './EventSignageSection';
import { EventBannersSection } from './EventBannersSection';
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
import { Separator } from '@/components/ui/separator';

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
          />
        );
      case 'eventsignage':
        return (
          <EventSignageSection
            signage={event.eventSignage || []}
            onUpdate={canEdit ? (eventSignage) => updateEvent({ eventSignage }) : () => {}}
            isEditable={canEdit}
          />
        );
      case 'eventbanners':
        return (
          <EventBannersSection
            banners={event.eventBanners || []}
            onUpdate={canEdit ? (eventBanners) => updateEvent({ eventBanners }) : () => {}}
            isEditable={canEdit}
          />
        );
      case 'eventdigital':
        return (
          <EventDigitalSection
            materials={event.eventDigitalMaterials || []}
            onUpdate={canEdit ? (eventDigitalMaterials) => updateEvent({ eventDigitalMaterials }) : () => {}}
            isEditable={canEdit}
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
          <div className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-serif font-semibold">Event Speakers</h2>
            {event.eventSpeakers && event.eventSpeakers.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {event.eventSpeakers.map((speaker) => (
                  <div key={speaker.id} className="p-4 rounded-lg border bg-card text-center">
                    {speaker.photoUrl && (
                      <img src={speaker.photoUrl} alt={speaker.name} className="w-20 h-20 sm:w-24 sm:h-24 rounded-full mx-auto mb-3 object-cover" />
                    )}
                    <h3 className="font-medium text-sm sm:text-base">{speaker.name}</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground">{speaker.title}</p>
                    {speaker.company && <p className="text-xs text-muted-foreground">{speaker.company}</p>}
                    {speaker.bio && <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{speaker.bio}</p>}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">No speakers added yet.</p>
            )}
          </div>
        );
      case 'eventsponsors':
        return (
          <EventSponsorsSection
            sponsors={event.eventSponsors || []}
            onUpdate={canEdit ? (eventSponsors) => updateEvent({ eventSponsors }) : () => {}}
            isEditable={canEdit}
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
          />
        );
      case 'socialassets':
        return (
          <SocialAssetsSection
            socialAssets={event.socialAssets || []}
            onSocialAssetsChange={editHandler((socialAssets) => updateEvent({ socialAssets }))}
            displayBanners={event.displayBanners || []}
            onDisplayBannersChange={editHandler((displayBanners) => updateEvent({ displayBanners }))}
          />
        );
      case 'assets':
        return (
          <AssetsSection
            assets={event.assets || []}
            onAssetsChange={editHandler((assets) => updateEvent({ assets }))}
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
        return (
          <CaseStudiesSection
            caseStudies={event.caseStudies || []}
            onCaseStudiesChange={editHandler((caseStudies) => updateEvent({ caseStudies }))}
          />
        );
      case 'templates':
        return (
          <TemplatesSection
            templates={event.templates || []}
            onTemplatesChange={editHandler((templates) => updateEvent({ templates }))}
          />
        );
      case 'brochures':
        return (
          <BrochuresSection
            brochures={event.brochures || []}
            onBrochuresChange={editHandler((brochures) => updateEvent({ brochures }))}
          />
        );
      case 'templatespecs':
        return (
          <TemplateSpecsSection
            templateSpecs={event.templateSpecs || []}
            onTemplateSpecsChange={editHandler((templateSpecs) => updateEvent({ templateSpecs }))}
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
        
        return (
          <SharedAssetsSection
            assets={sharedAssets}
            onAssetsChange={canEdit ? (assets) => updateEvent({ sharedAssets: assets } as any) : undefined}
            isEditable={canEdit}
          />
        );
      }
      default:
        return null;
    }
  }, [event, canEdit, heroFullWidth, editHandler, updateEvent]);

  // Filter out hidden sections for non-admin users
  const visibleSections = useMemo(() =>
    isAdmin
      ? sectionOrder
      : sectionOrder.filter(id => !hiddenSections.includes(id)),
    [isAdmin, sectionOrder, hiddenSections]
  );

  return (
    <div className="space-y-8 sm:space-y-12">
      {visibleSections.map((sectionId, index) => {
        const content = renderSectionContent(sectionId);
        if (!content) return null;

        const isHidden = hiddenSections.includes(sectionId);
        const isLast = index >= visibleSections.length - 1;

        return (
          <div key={sectionId}>
            <div
              id={sectionId}
              className={`scroll-mt-24 ${isHidden && isAdmin ? 'opacity-50 relative' : ''}`}
            >
              {isHidden && isAdmin && (
                <div className="absolute -top-2 right-0 text-xs bg-muted px-2 py-1 rounded text-muted-foreground z-10">
                  Hidden from viewers
                </div>
              )}
              {content}
            </div>
            {!isLast && <Separator className="my-8 sm:my-12" />}
          </div>
        );
      })}
      <div className="h-32" />
    </div>
  );
};
