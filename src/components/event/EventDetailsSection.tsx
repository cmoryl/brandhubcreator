import { useState } from 'react';
import { 
  Calendar, 
  MapPin, 
  Users, 
  Hash, 
  Link, 
  Edit2, 
  Check, 
  X, 
  Building2, 
  Tag, 
  Sparkles,
  ExternalLink,
  Clock,
  Globe
} from 'lucide-react';
import { EventDetails } from '@/types/event';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { RichTextDisplay } from '@/components/ui/rich-text-editor';

interface EventDetailsSectionProps {
  eventDetails: EventDetails;
  onUpdate: (updates: Partial<EventDetails>) => void;
  isEditable?: boolean;
  subtitle?: string;
}

const EVENT_TYPES = [
  { value: 'conference', label: 'Conference', icon: '🎤' },
  { value: 'trade-show', label: 'Trade Show', icon: '🏪' },
  { value: 'summit', label: 'Summit', icon: '🏔️' },
  { value: 'webinar', label: 'Webinar', icon: '💻' },
  { value: 'workshop', label: 'Workshop', icon: '🛠️' },
  { value: 'launch', label: 'Product Launch', icon: '🚀' },
  { value: 'other', label: 'Other', icon: '📌' },
];

export const EventDetailsSection = ({
  eventDetails,
  onUpdate,
  isEditable = true,
  subtitle,
}: EventDetailsSectionProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState<EventDetails>(eventDetails);

  const handleSave = () => {
    onUpdate(draft);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setDraft(eventDetails);
    setIsEditing(false);
  };

  const eventType = EVENT_TYPES.find(t => t.value === eventDetails.eventType);

  // Infographic card component with animations
  const InfoCard = ({ 
    icon: Icon, 
    label, 
    value, 
    delay = 0,
    accent = false,
    href,
    iconEmoji,
  }: { 
    icon?: React.ElementType; 
    label: string; 
    value?: string | number;
    delay?: number;
    accent?: boolean;
    href?: string;
    iconEmoji?: string;
  }) => {
    const content = (
      <div 
        className={cn(
          "group relative p-5 rounded-2xl border transition-all duration-500 cursor-default",
          "bg-gradient-to-br from-card via-card to-muted/30",
          "hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1",
          "animate-fade-in",
          accent && "border-primary/30 bg-gradient-to-br from-primary/5 via-card to-primary/10"
        )}
        style={{ 
          animationDelay: `${delay}ms`,
          animationFillMode: 'backwards',
        }}
      >
        {/* Animated glow effect */}
        <div className={cn(
          "absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-500",
          "bg-gradient-to-br from-primary/10 via-transparent to-accent/10",
          "group-hover:opacity-100"
        )} />
        
        {/* Floating icon with pulse */}
        <div className={cn(
          "relative flex items-center gap-3 mb-3",
        )}>
          <div className={cn(
            "relative p-2.5 rounded-xl transition-all duration-300",
            "bg-gradient-to-br from-primary/20 to-primary/10",
            "group-hover:scale-110 group-hover:rotate-3",
            accent && "from-primary/30 to-accent/20"
          )}>
            {iconEmoji ? (
              <span className="text-lg">{iconEmoji}</span>
            ) : Icon ? (
              <Icon className="h-5 w-5 text-primary" />
            ) : null}
            
            {/* Pulse ring on hover */}
            <div className="absolute inset-0 rounded-xl bg-primary/20 animate-ping opacity-0 group-hover:opacity-30" 
              style={{ animationDuration: '1.5s' }} 
            />
          </div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
        </div>
        
        {/* Value with slide-up animation */}
        <div className="relative">
          <p className={cn(
            "font-semibold text-lg text-foreground transition-all duration-300",
            "group-hover:text-primary",
            href && "flex items-center gap-2"
          )}>
            {value || '—'}
            {href && <ExternalLink className="h-3.5 w-3.5 opacity-50" />}
          </p>
        </div>
        
        {/* Bottom accent line */}
        <div className={cn(
          "absolute bottom-0 left-4 right-4 h-0.5 rounded-full",
          "bg-gradient-to-r from-transparent via-primary/30 to-transparent",
          "scale-x-0 group-hover:scale-x-100 transition-transform duration-500"
        )} />
      </div>
    );

    if (href) {
      return (
        <a href={href} target="_blank" rel="noopener noreferrer" className="block">
          {content}
        </a>
      );
    }

    return content;
  };

  return (
    <section id="eventdetails" className="scroll-mt-24">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
              Event Information
            </h2>
            {subtitle && (
              <RichTextDisplay html={subtitle} className="text-muted-foreground mt-1 text-sm" />
            )}
          </div>
        </div>
        {isEditable && !isEditing && (
          <Button variant="outline" size="sm" onClick={() => setIsEditing(true)} className="gap-2">
            <Edit2 className="h-4 w-4" />
            Edit Details
          </Button>
        )}
        {isEditing && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleCancel}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button size="sm" onClick={handleSave}>
              <Check className="h-4 w-4 mr-2" />
              Save
            </Button>
          </div>
        )}
      </div>

      {isEditing ? (
        <Card className="border-dashed">
          <CardContent className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="eventName">Event Name</Label>
                <Input
                  id="eventName"
                  value={draft.eventName}
                  onChange={(e) => setDraft({ ...draft, eventName: e.target.value })}
                  placeholder="Annual Tech Conference 2026"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="eventType">Event Type</Label>
                <Select
                  value={draft.eventType || 'conference'}
                  onValueChange={(value) => setDraft({ ...draft, eventType: value as EventDetails['eventType'] })}
                >
                  <SelectTrigger id="eventType">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EVENT_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        <span className="flex items-center gap-2">
                          <span>{type.icon}</span>
                          {type.label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="eventDates">Event Dates</Label>
                <Input
                  id="eventDates"
                  value={draft.eventDates}
                  onChange={(e) => setDraft({ ...draft, eventDates: e.target.value })}
                  placeholder="March 15-17, 2026"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={draft.location}
                  onChange={(e) => setDraft({ ...draft, location: e.target.value })}
                  placeholder="San Francisco, CA"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="venue">Venue</Label>
                <Input
                  id="venue"
                  value={draft.venue || ''}
                  onChange={(e) => setDraft({ ...draft, venue: e.target.value })}
                  placeholder="Moscone Center"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="expectedAttendees">Expected Attendees</Label>
                <Input
                  id="expectedAttendees"
                  type="number"
                  value={draft.expectedAttendees || ''}
                  onChange={(e) => setDraft({ ...draft, expectedAttendees: parseInt(e.target.value) || undefined })}
                  placeholder="5000"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tagline">Event Tagline</Label>
                <Input
                  id="tagline"
                  value={draft.tagline || ''}
                  onChange={(e) => setDraft({ ...draft, tagline: e.target.value })}
                  placeholder="Innovate. Connect. Transform."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="hashtag">Event Hashtag</Label>
                <Input
                  id="hashtag"
                  value={draft.hashtag || ''}
                  onChange={(e) => setDraft({ ...draft, hashtag: e.target.value })}
                  placeholder="#TechConf2026"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="registrationUrl">Registration URL</Label>
                <Input
                  id="registrationUrl"
                  type="url"
                  value={draft.registrationUrl || ''}
                  onChange={(e) => setDraft({ ...draft, registrationUrl: e.target.value })}
                  placeholder="https://event.example.com/register"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="relative">
          {/* Background decoration */}
          <div className="absolute inset-0 -z-10 overflow-hidden rounded-3xl">
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
            <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-accent/5 rounded-full blur-3xl" />
          </div>

          {/* Hero event name card */}
          {eventDetails.eventName && (
            <div 
              className="mb-6 p-6 rounded-2xl bg-gradient-to-r from-primary/10 via-primary/5 to-accent/10 border border-primary/20 animate-fade-in"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-primary/20 animate-pulse" style={{ animationDuration: '3s' }}>
                  <Tag className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Event Name</p>
                  <h3 className="text-2xl font-bold text-foreground">{eventDetails.eventName}</h3>
                  {eventDetails.tagline && (
                    <p className="text-sm text-muted-foreground mt-1 italic">"{eventDetails.tagline}"</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Info grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <InfoCard 
              iconEmoji={eventType?.icon}
              label="Event Type" 
              value={eventType?.label}
              delay={50}
            />
            <InfoCard 
              icon={Calendar} 
              label="Dates" 
              value={eventDetails.eventDates}
              delay={100}
            />
            <InfoCard 
              icon={MapPin} 
              label="Location" 
              value={eventDetails.location}
              delay={150}
            />
            {eventDetails.venue && (
              <InfoCard 
                icon={Building2} 
                label="Venue" 
                value={eventDetails.venue}
                delay={200}
              />
            )}
            {eventDetails.expectedAttendees && (
              <InfoCard 
                icon={Users} 
                label="Expected Attendees" 
                value={eventDetails.expectedAttendees.toLocaleString()}
                delay={250}
              />
            )}
            {eventDetails.hashtag && (
              <InfoCard 
                icon={Hash} 
                label="Hashtag" 
                value={eventDetails.hashtag}
                delay={300}
                accent
              />
            )}
            {eventDetails.registrationUrl && (
              <InfoCard 
                icon={Globe} 
                label="Registration" 
                value="Register Now →"
                delay={350}
                href={eventDetails.registrationUrl}
                accent
              />
            )}
          </div>
        </div>
      )}
    </section>
  );
};
