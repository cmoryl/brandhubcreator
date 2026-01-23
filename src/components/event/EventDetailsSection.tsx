import { useState } from 'react';
import { Calendar, MapPin, Users, Hash, Link, Edit2, Check, X, Building2, Tag } from 'lucide-react';
import { EventDetails } from '@/types/event';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface EventDetailsSectionProps {
  eventDetails: EventDetails;
  onUpdate: (updates: Partial<EventDetails>) => void;
  isEditable?: boolean;
  subtitle?: string;
}

const EVENT_TYPES = [
  { value: 'conference', label: 'Conference' },
  { value: 'trade-show', label: 'Trade Show' },
  { value: 'summit', label: 'Summit' },
  { value: 'webinar', label: 'Webinar' },
  { value: 'workshop', label: 'Workshop' },
  { value: 'launch', label: 'Product Launch' },
  { value: 'other', label: 'Other' },
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

  const InfoItem = ({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value?: string | number }) => (
    <div className="flex items-start gap-3">
      <div className="p-2 rounded-lg bg-primary/10">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground uppercase tracking-wide">{label}</p>
        <p className="font-medium">{value || '—'}</p>
      </div>
    </div>
  );

  return (
    <section id="eventdetails" className="scroll-mt-24">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">Event Information</h2>
          {subtitle && (
            <p className="text-muted-foreground mt-1" dangerouslySetInnerHTML={{ __html: subtitle }} />
          )}
        </div>
        {isEditable && !isEditing && (
          <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
            <Edit2 className="h-4 w-4 mr-2" />
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
        <Card>
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
                        {type.label}
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <Card className={cn("p-6", eventDetails.eventName && "border-primary/20 bg-primary/5")}>
            <InfoItem icon={Tag} label="Event Name" value={eventDetails.eventName} />
          </Card>
          <Card className="p-6">
            <InfoItem icon={Building2} label="Event Type" value={EVENT_TYPES.find(t => t.value === eventDetails.eventType)?.label} />
          </Card>
          <Card className="p-6">
            <InfoItem icon={Calendar} label="Dates" value={eventDetails.eventDates} />
          </Card>
          <Card className="p-6">
            <InfoItem icon={MapPin} label="Location" value={eventDetails.location} />
          </Card>
          {eventDetails.venue && (
            <Card className="p-6">
              <InfoItem icon={Building2} label="Venue" value={eventDetails.venue} />
            </Card>
          )}
          {eventDetails.expectedAttendees && (
            <Card className="p-6">
              <InfoItem icon={Users} label="Expected Attendees" value={eventDetails.expectedAttendees.toLocaleString()} />
            </Card>
          )}
          {eventDetails.hashtag && (
            <Card className="p-6">
              <InfoItem icon={Hash} label="Hashtag" value={eventDetails.hashtag} />
            </Card>
          )}
          {eventDetails.registrationUrl && (
            <Card className="p-6">
              <InfoItem icon={Link} label="Registration" value="View Registration →" />
            </Card>
          )}
        </div>
      )}
    </section>
  );
};
