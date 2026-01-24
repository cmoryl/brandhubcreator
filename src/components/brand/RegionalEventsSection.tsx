/**
 * RegionalEventsSection Component
 * Displays linked regional event guides with region-specific accent colors
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Calendar, ExternalLink, Users, Globe, Pencil, Check } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BackgroundImage } from '@/components/ui/optimized-image';
import { RichTextEditor, RichTextDisplay } from '@/components/ui/rich-text-editor';
import { useEvents } from '@/contexts/EventContext';

interface LinkedEventGuide {
  id: string;
  type: 'event';
  slug: string;
  name: string;
  region: string;
  accentColor: string;
  description: string;
}

interface RegionalEventsSectionProps {
  linkedGuides?: LinkedEventGuide[];
  customSubtitle?: string;
  onSubtitleChange?: (subtitle: string) => void;
  isEditable?: boolean;
}

export const RegionalEventsSection = ({
  linkedGuides = [],
  customSubtitle,
  onSubtitleChange,
  isEditable = false,
}: RegionalEventsSectionProps) => {
  const navigate = useNavigate();
  const { events } = useEvents();
  const [editingSubtitle, setEditingSubtitle] = useState(false);

  // Filter to only event guides
  const eventGuides = linkedGuides.filter(g => g.type === 'event');

  if (eventGuides.length === 0) {
    return null;
  }

  // Get full event data for each linked guide
  const enrichedEvents = eventGuides.map(guide => {
    const eventData = events.find(e => e.slug === guide.slug);
    return {
      ...guide,
      eventData,
    };
  });

  const handleOpenEvent = (slug: string) => {
    navigate(`/event/${slug}`);
  };

  const getRegionIcon = (region: string) => {
    switch (region.toUpperCase()) {
      case 'USA':
        return '🇺🇸';
      case 'EMEA':
        return '🇪🇺';
      case 'APAC':
        return '🌏';
      default:
        return '🌍';
    }
  };

  const defaultSubtitle = "Explore our conference series across global regions";
  const displaySubtitle = customSubtitle || defaultSubtitle;

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <Globe className="h-5 w-5 text-primary" />
            <h2 className="text-xl sm:text-2xl font-serif font-semibold text-foreground">
              Regional Events
            </h2>
          </div>
          {editingSubtitle && isEditable ? (
            <div className="mt-2 space-y-2">
              <RichTextEditor
                value={customSubtitle ?? ''}
                onChange={onSubtitleChange}
                placeholder={defaultSubtitle}
                minHeight="50px"
              />
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setEditingSubtitle(false)}
                className="gap-1.5"
              >
                <Check className="h-3 w-3" />
                Done Editing
              </Button>
            </div>
          ) : (
            <div className="flex items-start gap-2">
              <RichTextDisplay 
                html={displaySubtitle} 
                className="text-muted-foreground text-sm"
              />
              {isEditable && onSubtitleChange && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 shrink-0"
                  onClick={() => setEditingSubtitle(true)}
                >
                  <Pencil className="h-3 w-3" />
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {enrichedEvents.map((event) => {
          const eventDetails = event.eventData?.eventDetails;
          const heroImage = event.eventData?.hero?.coverImage;
          
          return (
            <Card
              key={event.id}
              className="group relative overflow-hidden cursor-pointer hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              onClick={() => handleOpenEvent(event.slug)}
              style={{
                borderColor: event.accentColor,
                borderWidth: '2px',
              }}
            >
              {/* Hero Image */}
              <BackgroundImage
                src={heroImage || ''}
                fallbackSrc="/placeholder.svg"
                className="h-40"
                overlayClassName="bg-gradient-to-t from-black/80 via-black/40 to-transparent"
              >
                {/* Fallback gradient if no image */}
                {!heroImage && (
                  <div
                    className="absolute inset-0 -z-10"
                    style={{
                      background: `linear-gradient(135deg, #0a1628, ${event.accentColor})`,
                    }}
                  />
                )}

                {/* Region Badge */}
                <div className="absolute top-3 left-3">
                  <Badge
                    className="text-white border-0 text-sm font-semibold"
                    style={{ backgroundColor: event.accentColor }}
                  >
                    <span className="mr-1.5">{getRegionIcon(event.region)}</span>
                    {event.region}
                  </Badge>
                </div>

                {/* Open Button */}
                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 bg-white/20 backdrop-blur-sm border border-white/30 text-white hover:bg-white/30"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenEvent(event.slug);
                    }}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>

                {/* Event Name at bottom */}
                <div className="absolute bottom-3 left-3 right-3">
                  <h3 className="text-white font-semibold text-lg line-clamp-1">
                    {event.name}
                  </h3>
                </div>
              </BackgroundImage>

              <CardContent className="p-4 space-y-3">
                {/* Description */}
                <p className="text-sm text-muted-foreground line-clamp-1">
                  {event.description}
                </p>

                {/* Event Details */}
                {eventDetails && (
                  <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                    {eventDetails.location && (
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        <span>{eventDetails.location}</span>
                      </div>
                    )}
                    {eventDetails.startDate && (
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>
                          {new Date(eventDetails.startDate).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
                    )}
                    {eventDetails.expectedAttendees && (
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        <span>{eventDetails.expectedAttendees}+</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Accent color indicator bar */}
                <div
                  className="h-1 w-full rounded-full mt-3"
                  style={{ backgroundColor: event.accentColor }}
                />
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Stats */}
      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground pt-2">
        <span>{eventGuides.length} regional event{eventGuides.length !== 1 ? 's' : ''}</span>
        <span>•</span>
        <span>
          Regions: {[...new Set(eventGuides.map(e => e.region))].join(', ')}
        </span>
      </div>
    </div>
  );
};
