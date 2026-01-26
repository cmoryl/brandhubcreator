import { useState, useEffect, useCallback } from 'react';
import { Plus, Calendar, MapPin, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SectionHeader } from './SectionHeader';
import { LayoutSelector, useLayoutClasses } from './LayoutSelector';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { LayoutPreset } from '@/types/brand';
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

interface EventItem {
  id: string;
  name: string;
  slug?: string | null;
  guide_data: Record<string, unknown>;
}

interface EventsSectionProps {
  brandId: string;
  customSubtitle?: string;
  onSubtitleChange?: (subtitle: string) => void;
  layout?: LayoutPreset;
  onLayoutChange?: (layout: LayoutPreset) => void;
}

// Sortable event card component
const SortableEventCard = ({ 
  event, 
  onUnlink, 
  onOpen 
}: { 
  event: EventItem; 
  onUnlink: (event: EventItem) => void;
  onOpen: (event: EventItem) => void;
}) => {
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

  const guideData = event.guide_data || {};
  const hero = guideData.hero as { name?: string; tagline?: string; coverImage?: string } | undefined;
  const eventDetails = guideData.eventDetails as { 
    eventDates?: string; 
    location?: string; 
    venue?: string;
  } | undefined;
  const colors = (guideData.colors as Array<{ hex?: string; role?: string }>) || [];
  const primaryColor = colors.find(c => c.role === 'primary')?.hex || colors[0]?.hex || '#6366f1';

  return (
    <div ref={setNodeRef} style={style}>
      <Card 
        className="group relative overflow-hidden cursor-grab active:cursor-grabbing hover:shadow-lg transition-all duration-200"
        {...attributes}
        {...listeners}
      >
        {/* Color accent bar */}
        <div 
          className="absolute top-0 left-0 right-0 h-1"
          style={{ backgroundColor: primaryColor }}
        />
        
        {/* Cover image or gradient */}
        <div 
          className="h-24 sm:h-32 relative"
          style={{
            background: hero?.coverImage 
              ? `url(${hero.coverImage}) center/cover`
              : `linear-gradient(135deg, ${primaryColor}22, ${primaryColor}44)`
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
          <Badge className="absolute top-2 right-2 bg-primary/90">
            <Calendar className="h-3 w-3 mr-1" />
            Event
          </Badge>
        </div>

        <CardContent className="p-4 space-y-3">
          <div>
            <h3 className="font-semibold text-base line-clamp-1">{event.name}</h3>
            {hero?.tagline && (
              <p className="text-sm text-muted-foreground line-clamp-1">{hero.tagline}</p>
            )}
          </div>

          {/* Event details */}
          <div className="space-y-1 text-xs text-muted-foreground">
            {eventDetails?.eventDates && (
              <div className="flex items-center gap-1.5">
                <Calendar className="h-3 w-3 shrink-0" />
                <span className="line-clamp-1">{eventDetails.eventDates}</span>
              </div>
            )}
            {eventDetails?.location && (
              <div className="flex items-center gap-1.5">
                <MapPin className="h-3 w-3 shrink-0" />
                <span className="line-clamp-1">{eventDetails.location}</span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 gap-1.5"
              onClick={(e) => {
                e.stopPropagation();
                onOpen(event);
              }}
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Open
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={(e) => {
                e.stopPropagation();
                onUnlink(event);
              }}
            >
              Unlink
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export const EventsSection = ({ 
  brandId,
  customSubtitle, 
  onSubtitleChange,
  layout = 'grid-3',
  onLayoutChange
}: EventsSectionProps) => {
  const [linkedEvents, setLinkedEvents] = useState<EventItem[]>([]);
  const [availableEvents, setAvailableEvents] = useState<EventItem[]>([]);
  const { gridClass } = useLayoutClasses(layout);
  const [isHeaderEditing, setIsHeaderEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newEventName, setNewEventName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const navigate = useNavigate();
  const { addEvent } = useEvents();

  useEffect(() => {
    fetchEvents();
  }, [brandId]);

  const fetchEvents = async () => {
    setIsLoading(true);
    try {
      // Fetch events linked to this brand via parent_brand_id
      const [
        { data: linkedByParent, error: linkedError },
        { data: allEvents, error: allError },
      ] = await Promise.all([
        supabase
          .from('events')
          .select('id, name, slug, guide_data')
          .eq('parent_brand_id', brandId),
        supabase
          .from('events')
          .select('id, name, slug, guide_data')
          .is('parent_brand_id', null),
      ]);

      if (linkedError) throw linkedError;
      if (allError) throw allError;

      const linked = (linkedByParent || []).map(e => ({
        ...e,
        guide_data: (e.guide_data || {}) as Record<string, unknown>
      }));
      
      const linkedIds = linked.map(e => e.id);
      const available = (allEvents || [])
        .filter(e => !linkedIds.includes(e.id))
        .map(e => ({
          ...e,
          guide_data: (e.guide_data || {}) as Record<string, unknown>
        }));

      setLinkedEvents(linked);
      setAvailableEvents(available);
    } catch (error) {
      console.error('Error fetching events:', error);
      toast.error('Failed to load events');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateEvent = async () => {
    if (!newEventName.trim()) return;
    
    setIsCreating(true);
    try {
      const event = await addEvent(newEventName.trim(), brandId);
      if (event) {
        toast.success('Event guide created and linked');
        setNewEventName('');
        setIsCreateDialogOpen(false);
        fetchEvents();
      }
    } catch (error) {
      console.error('Error creating event:', error);
      toast.error('Failed to create event guide');
    } finally {
      setIsCreating(false);
    }
  };

  const linkEvent = async (eventId: string) => {
    const event = availableEvents.find(e => e.id === eventId);
    if (!event) return;

    try {
      const { error } = await supabase
        .from('events')
        .update({ parent_brand_id: brandId })
        .eq('id', eventId);

      if (error) throw error;

      // Optimistic update
      setLinkedEvents(prev => [...prev, event]);
      setAvailableEvents(prev => prev.filter(e => e.id !== eventId));
      toast.success('Event linked to brand');
    } catch (error) {
      console.error('Error linking event:', error);
      toast.error('Failed to link event');
    }
  };

  const unlinkEvent = async (event: EventItem) => {
    try {
      const { error } = await supabase
        .from('events')
        .update({ parent_brand_id: null })
        .eq('id', event.id);

      if (error) throw error;

      // Optimistic update
      setLinkedEvents(prev => prev.filter(e => e.id !== event.id));
      setAvailableEvents(prev => [...prev, event]);
      toast.success('Event unlinked from brand');
    } catch (error) {
      console.error('Error unlinking event:', error);
      toast.error('Failed to unlink event');
    }
  };

  const openEvent = useCallback((event: EventItem) => {
    navigate(`/event/${event.slug || event.id}`);
  }, [navigate]);

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = linkedEvents.findIndex(e => e.id === active.id);
      const newIndex = linkedEvents.findIndex(e => e.id === over.id);
      setLinkedEvents(arrayMove(linkedEvents, oldIndex, newIndex));
    }
  }, [linkedEvents]);

  return (
    <section className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div className="flex-1 min-w-0">
          <SectionHeader
            title="Events"
            defaultSubtitle="Conferences, summits, and events associated with this brand"
            customSubtitle={customSubtitle}
            onSubtitleChange={onSubtitleChange}
            isEditing={isHeaderEditing}
            onEditToggle={() => setIsHeaderEditing(!isHeaderEditing)}
          />
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          {onLayoutChange && (
            <LayoutSelector
              value={layout}
              onChange={onLayoutChange}
              availableLayouts={['grid-2', 'grid-3', 'grid-4']}
              size="sm"
            />
          )}
          
          {availableEvents.length > 0 && (
            <Select onValueChange={linkEvent}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Link existing event..." />
              </SelectTrigger>
              <SelectContent>
                {availableEvents.map((event) => (
                  <SelectItem key={event.id} value={event.id}>
                    <span className="flex items-center gap-2">
                      <Calendar className="h-3 w-3" />
                      {event.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                New Event
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Event Guide</DialogTitle>
                <DialogDescription>
                  Create a new event guide linked to this brand.
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <Input
                  placeholder="Event name..."
                  value={newEventName}
                  onChange={(e) => setNewEventName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreateEvent()}
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateEvent} disabled={isCreating || !newEventName.trim()}>
                  {isCreating ? 'Creating...' : 'Create Event'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <div className="h-24 bg-muted" />
              <CardContent className="p-4 space-y-3">
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-3 bg-muted rounded w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : linkedEvents.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Calendar className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium mb-2">No Events Linked</h3>
            <p className="text-sm text-muted-foreground mb-4 max-w-sm">
              Link existing events or create new event guides for conferences, summits, and other brand events.
            </p>
            <div className="flex gap-2">
              {availableEvents.length > 0 && (
                <Select onValueChange={linkEvent}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Link event..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableEvents.map((event) => (
                      <SelectItem key={event.id} value={event.id}>
                        {event.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <Button onClick={() => setIsCreateDialogOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Create Event
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={linkedEvents.map(e => e.id)}
            strategy={rectSortingStrategy}
          >
            <div className={gridClass}>
              {linkedEvents.map((event) => (
                <SortableEventCard
                  key={event.id}
                  event={event}
                  onUnlink={unlinkEvent}
                  onOpen={openEvent}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </section>
  );
};
