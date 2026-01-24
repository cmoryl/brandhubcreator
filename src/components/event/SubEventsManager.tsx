import { useState, useEffect, useCallback } from 'react';
import { Plus, Calendar, Link2, ExternalLink, Trash2, GripVertical, Globe, MapPin, Users, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SectionHeader } from '@/components/brand/SectionHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useEvents } from '@/contexts/EventContext';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

// Region presets with colors
const REGION_PRESETS = [
  { id: 'USA', name: 'USA', color: '#84cc16', icon: '🇺🇸' },
  { id: 'EMEA', name: 'EMEA', color: '#3b82f6', icon: '🇪🇺' },
  { id: 'APAC', name: 'APAC', color: '#f97316', icon: '🌏' },
  { id: 'LATAM', name: 'LATAM', color: '#ec4899', icon: '🌎' },
  { id: 'CUSTOM', name: 'Custom Region', color: '#6366f1', icon: '🌐' },
];

export interface LinkedEventGuide {
  id: string;
  type: 'event';
  slug: string;
  name: string;
  region?: string;
  accentColor?: string;
  location?: string;
  dates?: string;
  venue?: string;
  attendees?: number;
  coverImage?: string;
}

interface EventItem {
  id: string;
  name: string;
  slug?: string | null;
  guide_data: any;
}

interface SubEventsManagerProps {
  eventId: string;
  linkedGuides: LinkedEventGuide[];
  onLinkedGuidesChange: (guides: LinkedEventGuide[]) => void;
  masterEventName?: string;
  masterEventSlug?: string;
  customSubtitle?: string;
  onSubtitleChange?: (subtitle: string) => void;
}

interface SortableEventCardProps {
  event: LinkedEventGuide;
  onUnlink: () => void;
  onEdit: () => void;
}

const SortableEventCard = ({ event, onUnlink, onEdit }: SortableEventCardProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: event.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const regionPreset = REGION_PRESETS.find(r => r.id === event.region?.toUpperCase());

  return (
    <Card
      ref={setNodeRef}
      style={{
        ...style,
        borderColor: event.accentColor || 'hsl(var(--border))',
      }}
      className="overflow-hidden border-2 group"
    >
      {/* Cover image */}
      <div className="relative h-28 overflow-hidden bg-gradient-to-br from-muted to-muted/50">
        {event.coverImage ? (
          <img
            src={event.coverImage}
            alt={event.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{ backgroundColor: `${event.accentColor || 'hsl(var(--primary))'}20` }}
          >
            <Calendar className="h-8 w-8 text-muted-foreground/50" />
          </div>
        )}
        
        {/* Region badge */}
        {event.region && (
          <Badge
            className="absolute top-2 left-2 gap-1 text-white text-xs"
            style={{ backgroundColor: event.accentColor || 'hsl(var(--primary))' }}
          >
            {regionPreset?.icon || '🌐'} {event.region}
          </Badge>
        )}

        {/* Drag handle */}
        <div
          {...attributes}
          {...listeners}
          className="absolute top-2 right-2 p-1.5 bg-background/90 rounded cursor-grab opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>

      <CardContent className="p-3 space-y-2">
        <h4 className="font-medium text-sm line-clamp-2">{event.name}</h4>
        
        <div className="space-y-1 text-xs text-muted-foreground">
          {event.dates && (
            <div className="flex items-center gap-1.5">
              <Calendar className="h-3 w-3" />
              <span>{event.dates}</span>
            </div>
          )}
          {event.location && (
            <div className="flex items-center gap-1.5">
              <MapPin className="h-3 w-3" />
              <span className="line-clamp-1">{event.location}</span>
            </div>
          )}
          {event.attendees && (
            <div className="flex items-center gap-1.5">
              <Users className="h-3 w-3" />
              <span>{event.attendees.toLocaleString()} expected</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-2 border-t">
          <Button
            variant="ghost"
            size="sm"
            className="flex-1 h-7 text-xs"
            asChild
          >
            <RouterLink to={`/event/${event.slug}`}>
              <ExternalLink className="h-3 w-3 mr-1" />
              View
            </RouterLink>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={onEdit}
          >
            Edit
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive hover:text-destructive">
                <Trash2 className="h-3 w-3" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Unlink Sub-Event?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will remove "{event.name}" from this master event's sub-events list. The event itself won't be deleted.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={onUnlink}>Unlink</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
};

export const SubEventsManager = ({
  eventId,
  linkedGuides,
  onLinkedGuidesChange,
  masterEventName = 'Master Event',
  masterEventSlug,
  customSubtitle,
  onSubtitleChange,
}: SubEventsManagerProps) => {
  const [availableEvents, setAvailableEvents] = useState<EventItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<LinkedEventGuide | null>(null);
  const [newEventName, setNewEventName] = useState('');
  const [newEventRegion, setNewEventRegion] = useState('');
  const [newEventLocation, setNewEventLocation] = useState('');
  const [newEventDates, setNewEventDates] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const navigate = useNavigate();
  const { addEvent } = useEvents();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    fetchAvailableEvents();
  }, [eventId]);

  const fetchAvailableEvents = async () => {
    setIsLoading(true);
    try {
      const linkedIds = linkedGuides.map(g => g.id);
      
      const { data: events, error } = await supabase
        .from('events')
        .select('id, name, slug, guide_data')
        .neq('id', eventId); // Exclude current event

      if (error) throw error;

      // Filter out already linked events
      const available = (events || []).filter(e => !linkedIds.includes(e.id));
      setAvailableEvents(available);
    } catch (error) {
      console.error('Error fetching events:', error);
      toast.error('Failed to load available events');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateSubEvent = async () => {
    if (!newEventName.trim()) return;
    
    setIsCreating(true);
    try {
      const regionPreset = REGION_PRESETS.find(r => r.id === newEventRegion);
      const event = await addEvent(newEventName.trim());
      
      if (event) {
        // Add the new event to linked guides with metadata
        const newLinkedGuide: LinkedEventGuide = {
          id: event.id,
          type: 'event',
          slug: event.slug || event.id,
          name: newEventName.trim(),
          region: newEventRegion === 'CUSTOM' ? 'Custom' : newEventRegion,
          accentColor: regionPreset?.color || '#6366f1',
          location: newEventLocation,
          dates: newEventDates,
        };
        
        onLinkedGuidesChange([...linkedGuides, newLinkedGuide]);
        
        toast.success('Sub-event created and linked');
        resetCreateForm();
        setIsCreateDialogOpen(false);
        fetchAvailableEvents();
      }
    } catch (error) {
      console.error('Error creating sub-event:', error);
      toast.error('Failed to create sub-event');
    } finally {
      setIsCreating(false);
    }
  };

  const resetCreateForm = () => {
    setNewEventName('');
    setNewEventRegion('');
    setNewEventLocation('');
    setNewEventDates('');
  };

  const handleLinkEvent = async (eventToLink: EventItem) => {
    // Get event details from guide_data
    const guideData = eventToLink.guide_data || {};
    const eventDetails = guideData.eventDetails || {};
    
    const newLinkedGuide: LinkedEventGuide = {
      id: eventToLink.id,
      type: 'event',
      slug: eventToLink.slug || eventToLink.id,
      name: eventToLink.name,
      region: guideData.region,
      accentColor: guideData.accentColor,
      location: eventDetails.location,
      dates: eventDetails.eventDates,
      attendees: eventDetails.expectedAttendees,
      coverImage: guideData.hero?.coverImage,
    };
    
    onLinkedGuidesChange([...linkedGuides, newLinkedGuide]);
    setAvailableEvents(prev => prev.filter(e => e.id !== eventToLink.id));
    toast.success('Event linked as sub-event');
    setIsLinkDialogOpen(false);
  };

  const handleUnlinkEvent = (eventId: string) => {
    const unlinkedEvent = linkedGuides.find(g => g.id === eventId);
    onLinkedGuidesChange(linkedGuides.filter(g => g.id !== eventId));
    
    // Add back to available events
    if (unlinkedEvent) {
      setAvailableEvents(prev => [...prev, {
        id: unlinkedEvent.id,
        name: unlinkedEvent.name,
        slug: unlinkedEvent.slug,
        guide_data: {},
      }]);
    }
    toast.success('Sub-event unlinked');
  };

  const handleEditEvent = (event: LinkedEventGuide) => {
    setEditingEvent(event);
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = () => {
    if (!editingEvent) return;
    
    const updated = linkedGuides.map(g => 
      g.id === editingEvent.id ? editingEvent : g
    );
    onLinkedGuidesChange(updated);
    setIsEditDialogOpen(false);
    setEditingEvent(null);
    toast.success('Sub-event details updated');
  };

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      const oldIndex = linkedGuides.findIndex(g => g.id === active.id);
      const newIndex = linkedGuides.findIndex(g => g.id === over.id);
      
      const reordered = arrayMove(linkedGuides, oldIndex, newIndex);
      onLinkedGuidesChange(reordered);
    }
  }, [linkedGuides, onLinkedGuidesChange]);

  const [isHeaderEditing, setIsHeaderEditing] = useState(false);
  
  return (
    <section className="space-y-6">
      <SectionHeader
        title="Sub-Events"
        defaultSubtitle={`Manage regional or satellite events linked to ${masterEventName}`}
        customSubtitle={customSubtitle}
        onSubtitleChange={onSubtitleChange}
        isEditing={isHeaderEditing}
        onEditToggle={() => setIsHeaderEditing(!isHeaderEditing)}
      />

      {/* Action buttons */}
      <div className="flex flex-wrap gap-3">
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Plus className="h-4 w-4" />
              Create Sub-Event
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Create New Sub-Event
              </DialogTitle>
              <DialogDescription>
                Create a new regional or satellite event that will be linked to {masterEventName}.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="event-name">Event Name</Label>
                <Input
                  id="event-name"
                  placeholder="e.g., GlobalLink NEXT USA 2026"
                  value={newEventName}
                  onChange={(e) => setNewEventName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Region</Label>
                <Select value={newEventRegion} onValueChange={setNewEventRegion}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a region" />
                  </SelectTrigger>
                  <SelectContent>
                    {REGION_PRESETS.map(region => (
                      <SelectItem key={region.id} value={region.id}>
                        <span className="flex items-center gap-2">
                          <span>{region.icon}</span>
                          <span>{region.name}</span>
                          <span 
                            className="w-3 h-3 rounded-full ml-auto" 
                            style={{ backgroundColor: region.color }}
                          />
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="event-location">Location</Label>
                <Input
                  id="event-location"
                  placeholder="e.g., San Francisco, CA"
                  value={newEventLocation}
                  onChange={(e) => setNewEventLocation(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="event-dates">Event Dates</Label>
                <Input
                  id="event-dates"
                  placeholder="e.g., October 27-28, 2026"
                  value={newEventDates}
                  onChange={(e) => setNewEventDates(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateSubEvent} disabled={!newEventName.trim() || isCreating}>
                {isCreating ? 'Creating...' : 'Create Sub-Event'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isLinkDialogOpen} onOpenChange={setIsLinkDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Link2 className="h-4 w-4" />
              Link Existing Event
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Link Existing Event</DialogTitle>
              <DialogDescription>
                Select an existing event to link as a sub-event of {masterEventName}.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              {isLoading ? (
                <p className="text-sm text-muted-foreground text-center py-4">Loading events...</p>
              ) : availableEvents.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No available events to link</p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {availableEvents.map(event => (
                    <button
                      key={event.id}
                      onClick={() => handleLinkEvent(event)}
                      className="w-full flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors text-left"
                    >
                      <Calendar className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{event.name}</p>
                        {event.guide_data?.eventDetails?.eventDates && (
                          <p className="text-xs text-muted-foreground">
                            {event.guide_data.eventDetails.eventDates}
                          </p>
                        )}
                      </div>
                      <Plus className="h-4 w-4 text-muted-foreground" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Linked sub-events grid */}
      {linkedGuides.length > 0 ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={linkedGuides.map(g => g.id)}
            strategy={rectSortingStrategy}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {linkedGuides.map(event => (
                <SortableEventCard
                  key={event.id}
                  event={event}
                  onUnlink={() => handleUnlinkEvent(event.id)}
                  onEdit={() => handleEditEvent(event)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      ) : (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Globe className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="font-medium text-lg mb-1">No Sub-Events Yet</h3>
            <p className="text-sm text-muted-foreground max-w-sm mb-4">
              Create regional events or link existing ones to build your event series.
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-1" />
                Create
              </Button>
              <Button variant="outline" size="sm" onClick={() => setIsLinkDialogOpen(true)}>
                <Link2 className="h-4 w-4 mr-1" />
                Link
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Edit Sub-Event Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Sub-Event Details</DialogTitle>
            <DialogDescription>
              Update how this sub-event appears in the master event list.
            </DialogDescription>
          </DialogHeader>
          {editingEvent && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Region</Label>
                <Select 
                  value={REGION_PRESETS.find(r => r.id === editingEvent.region?.toUpperCase())?.id || 'CUSTOM'}
                  onValueChange={(value) => {
                    const preset = REGION_PRESETS.find(r => r.id === value);
                    setEditingEvent({
                      ...editingEvent,
                      region: value === 'CUSTOM' ? editingEvent.region : value,
                      accentColor: preset?.color || editingEvent.accentColor,
                    });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {REGION_PRESETS.map(region => (
                      <SelectItem key={region.id} value={region.id}>
                        <span className="flex items-center gap-2">
                          <span>{region.icon}</span>
                          <span>{region.name}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-location">Location</Label>
                <Input
                  id="edit-location"
                  value={editingEvent.location || ''}
                  onChange={(e) => setEditingEvent({ ...editingEvent, location: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-dates">Dates</Label>
                <Input
                  id="edit-dates"
                  value={editingEvent.dates || ''}
                  onChange={(e) => setEditingEvent({ ...editingEvent, dates: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-attendees">Expected Attendees</Label>
                <Input
                  id="edit-attendees"
                  type="number"
                  value={editingEvent.attendees || ''}
                  onChange={(e) => setEditingEvent({ ...editingEvent, attendees: parseInt(e.target.value) || undefined })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-color">Accent Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="edit-color"
                    type="color"
                    value={editingEvent.accentColor || '#6366f1'}
                    onChange={(e) => setEditingEvent({ ...editingEvent, accentColor: e.target.value })}
                    className="w-12 h-10 p-1"
                  />
                  <Input
                    value={editingEvent.accentColor || '#6366f1'}
                    onChange={(e) => setEditingEvent({ ...editingEvent, accentColor: e.target.value })}
                    className="flex-1"
                    placeholder="#6366f1"
                  />
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Legend */}
      {linkedGuides.length > 0 && (
        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground pt-2 border-t">
          {linkedGuides.map(event => (
            event.region && event.accentColor && (
              <div key={event.id} className="flex items-center gap-1.5">
                <div
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: event.accentColor }}
                />
                <span>{event.region}</span>
              </div>
            )
          ))}
        </div>
      )}
    </section>
  );
};
