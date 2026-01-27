import { useState, useMemo, useRef } from 'react';
import { Plus, Trash2, Check, X, Clock, MapPin, User, ChevronDown, ChevronRight, GripVertical, Edit2, Download, FileSpreadsheet, FileJson, Calendar, FileText, Loader2 } from 'lucide-react';
import { EventScheduleItem, EventSpeaker } from '@/types/event';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from '@/components/ui/dropdown-menu';
import { exportSchedule, ExportFormat } from '@/lib/scheduleExport';
import { exportScheduleToPdf } from '@/lib/scheduleExportPdf';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
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
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface EventScheduleSectionProps {
  schedule: EventScheduleItem[];
  onUpdate: (schedule: EventScheduleItem[]) => void;
  speakers?: EventSpeaker[];
  isEditable?: boolean;
  subtitle?: string;
  /** Event name for export filename */
  eventName?: string;
  /** Event dates for ICS export */
  eventDates?: string;
  /** Event location for ICS export */
  eventLocation?: string;
}

// Session type styling
const SESSION_TYPES = [
  { value: 'keynote', label: 'Keynote', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300' },
  { value: 'session', label: 'Session', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' },
  { value: 'workshop', label: 'Workshop', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' },
  { value: 'panel', label: 'Panel', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300' },
  { value: 'break', label: 'Break', color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300' },
  { value: 'networking', label: 'Networking', color: 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300' },
  { value: 'lunch', label: 'Lunch/Meal', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' },
  { value: 'registration', label: 'Registration', color: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300' },
];

// Sortable schedule item component
const SortableScheduleItem = ({
  item,
  speakers,
  isEditable,
  onEdit,
  onDelete,
}: {
  item: EventScheduleItem;
  speakers?: EventSpeaker[];
  isEditable: boolean;
  onEdit: (item: EventScheduleItem) => void;
  onDelete: (id: string) => void;
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const sessionType = SESSION_TYPES.find(t => t.value === item.track) || SESSION_TYPES[1];
  const linkedSpeaker = speakers?.find(s => s.id === item.speaker || s.name === item.speaker);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group flex gap-4 items-start p-4 rounded-lg border bg-card transition-all",
        isDragging && "opacity-50 shadow-lg",
        "hover:border-primary/30"
      )}
    >
      {/* Timeline indicator */}
      <div className="flex flex-col items-center shrink-0">
        <div className="w-3 h-3 rounded-full bg-primary border-2 border-background shadow-sm" />
        <div className="w-0.5 h-full bg-border flex-1 min-h-[40px]" />
      </div>

      {/* Time column */}
      <div className="shrink-0 w-20 sm:w-24">
        <div className="flex items-center gap-1.5 text-sm font-medium text-foreground">
          <Clock className="h-3.5 w-3.5 text-muted-foreground" />
          {item.time}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-medium text-foreground">{item.title}</h4>
              <Badge className={cn("text-xs", sessionType.color)}>
                {sessionType.label}
              </Badge>
            </div>
            {item.description && (
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {item.description}
              </p>
            )}
            <div className="flex items-center gap-4 mt-2 flex-wrap">
              {(linkedSpeaker || item.speaker) && (
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  {linkedSpeaker?.photoUrl ? (
                    <img 
                      src={linkedSpeaker.photoUrl} 
                      alt={linkedSpeaker.name}
                      className="h-5 w-5 rounded-full object-cover"
                    />
                  ) : (
                    <User className="h-3.5 w-3.5" />
                  )}
                  <span>{linkedSpeaker?.name || item.speaker}</span>
                  {linkedSpeaker?.title && (
                    <span className="text-xs text-muted-foreground/70">
                      ({linkedSpeaker.title})
                    </span>
                  )}
                </div>
              )}
              {item.location && (
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5" />
                  {item.location}
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          {isEditable && (
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                {...attributes}
                {...listeners}
              >
                <GripVertical className="h-4 w-4 text-muted-foreground" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => onEdit(item)}
              >
                <Edit2 className="h-4 w-4 text-muted-foreground" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                onClick={() => onDelete(item.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const EventScheduleSection = ({
  schedule,
  onUpdate,
  speakers = [],
  isEditable = true,
  subtitle,
  eventName = 'Event',
  eventDates,
  eventLocation,
}: EventScheduleSectionProps) => {
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [editingItem, setEditingItem] = useState<EventScheduleItem | null>(null);
  const [expandedDays, setExpandedDays] = useState<string[]>(['Day 1']);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [newItem, setNewItem] = useState<Partial<EventScheduleItem>>({
    time: '',
    title: '',
    description: '',
    speaker: '',
    location: '',
    track: 'session',
  });

  // Export handler
  const handleExport = (format: ExportFormat) => {
    try {
      exportSchedule(schedule, format, {
        eventName,
        eventDates,
        eventLocation,
        speakers,
      });
      toast.success(`Schedule exported as ${format.toUpperCase()}`);
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Failed to export schedule');
    }
  };

  // PDF Export handler
  const handlePdfExport = async () => {
    setIsExportingPdf(true);
    try {
      await exportScheduleToPdf(schedule, {
        eventName,
        eventDates,
        eventLocation,
        speakers,
      });
      toast.success('Schedule exported as PDF');
    } catch (error) {
      console.error('PDF export failed:', error);
      toast.error('Failed to export schedule as PDF');
    } finally {
      setIsExportingPdf(false);
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Group schedule items by day/track for better organization
  const groupedSchedule = useMemo(() => {
    // Simple grouping - you could enhance this with actual date parsing
    const groups: Record<string, EventScheduleItem[]> = {};
    
    schedule.forEach(item => {
      // Try to extract day from time (e.g., "Day 1 - 9:00 AM" or just use "Day 1" as default)
      const timeStr = item.time || '';
      const dayMatch = timeStr.match(/Day\s*(\d+)/i);
      const day = dayMatch ? `Day ${dayMatch[1]}` : 'Day 1';
      
      if (!groups[day]) groups[day] = [];
      groups[day].push(item);
    });

    // Sort items within each day by time
    Object.keys(groups).forEach(day => {
      groups[day].sort((a, b) => {
        const timeA = (a.time || '').replace(/Day\s*\d+\s*-?\s*/i, '');
        const timeB = (b.time || '').replace(/Day\s*\d+\s*-?\s*/i, '');
        return timeA.localeCompare(timeB);
      });
    });

    return groups;
  }, [schedule]);

  const handleAdd = () => {
    if (!newItem.time || !newItem.title) return;

    const item: EventScheduleItem = {
      id: crypto.randomUUID(),
      time: newItem.time,
      title: newItem.title,
      description: newItem.description,
      speaker: newItem.speaker,
      location: newItem.location,
      track: newItem.track,
    };

    onUpdate([...schedule, item]);
    setNewItem({ time: '', title: '', description: '', speaker: '', location: '', track: 'session' });
    setIsAddingNew(false);
  };

  const handleUpdate = () => {
    if (!editingItem) return;
    
    onUpdate(schedule.map(item => 
      item.id === editingItem.id ? editingItem : item
    ));
    setEditingItem(null);
  };

  const handleDelete = (id: string) => {
    onUpdate(schedule.filter(item => item.id !== id));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = schedule.findIndex(item => item.id === active.id);
    const newIndex = schedule.findIndex(item => item.id === over.id);
    onUpdate(arrayMove(schedule, oldIndex, newIndex));
  };

  const toggleDay = (day: string) => {
    setExpandedDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  const renderForm = (
    item: Partial<EventScheduleItem>,
    setItem: (item: Partial<EventScheduleItem>) => void,
    onSave: () => void,
    onCancel: () => void
  ) => (
    <Card className="mb-6 border-dashed border-primary">
      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Time *</Label>
            <Input
              value={item.time || ''}
              onChange={(e) => setItem({ ...item, time: e.target.value })}
              placeholder="Day 1 - 9:00 AM"
            />
          </div>
          <div className="space-y-2">
            <Label>Title *</Label>
            <Input
              value={item.title || ''}
              onChange={(e) => setItem({ ...item, title: e.target.value })}
              placeholder="Opening Keynote"
            />
          </div>
          <div className="space-y-2">
            <Label>Session Type</Label>
            <Select
              value={item.track || 'session'}
              onValueChange={(value) => setItem({ ...item, track: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SESSION_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    <div className="flex items-center gap-2">
                      <Badge className={cn("text-xs", type.color)}>{type.label}</Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Speaker</Label>
            {speakers.length > 0 ? (
              <Select
                value={item.speaker || ''}
                onValueChange={(value) => setItem({ ...item, speaker: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a speaker..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No speaker</SelectItem>
                  {speakers.map((speaker) => (
                    <SelectItem key={speaker.id} value={speaker.id}>
                      <div className="flex items-center gap-2">
                        {speaker.photoUrl && (
                          <img 
                            src={speaker.photoUrl} 
                            alt={speaker.name}
                            className="h-5 w-5 rounded-full object-cover"
                          />
                        )}
                        {speaker.name}
                        {speaker.title && (
                          <span className="text-xs text-muted-foreground">
                            - {speaker.title}
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                value={item.speaker || ''}
                onChange={(e) => setItem({ ...item, speaker: e.target.value })}
                placeholder="Speaker name"
              />
            )}
          </div>
          <div className="space-y-2">
            <Label>Location</Label>
            <Input
              value={item.location || ''}
              onChange={(e) => setItem({ ...item, location: e.target.value })}
              placeholder="Main Stage, Room 101..."
            />
          </div>
          <div className="space-y-2 md:col-span-2 lg:col-span-1">
            <Label>Description</Label>
            <Textarea
              value={item.description || ''}
              onChange={(e) => setItem({ ...item, description: e.target.value })}
              placeholder="Session description..."
              rows={2}
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={onCancel}>
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button onClick={onSave} disabled={!item.time || !item.title}>
            <Check className="h-4 w-4 mr-2" />
            {editingItem ? 'Update' : 'Add Session'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <section id="eventschedule" className="scroll-mt-24">
      <div className="flex items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold">Event Schedule</h2>
          {subtitle ? (
            <p className="text-muted-foreground mt-1" dangerouslySetInnerHTML={{ __html: subtitle }} />
          ) : (
            <p className="text-muted-foreground mt-1">Agenda timeline with sessions, speakers, and locations</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* Export dropdown */}
          {schedule.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Download className="h-4 w-4" />
                  <span className="hidden sm:inline">Export</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>Export Schedule</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleExport('csv')} className="gap-2 cursor-pointer">
                  <FileSpreadsheet className="h-4 w-4" />
                  Export as CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport('json')} className="gap-2 cursor-pointer">
                  <FileJson className="h-4 w-4" />
                  Export as JSON
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport('ics')} className="gap-2 cursor-pointer">
                  <Calendar className="h-4 w-4" />
                  Export as iCal (.ics)
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={handlePdfExport} 
                  className="gap-2 cursor-pointer"
                  disabled={isExportingPdf}
                >
                  {isExportingPdf ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <FileText className="h-4 w-4" />
                  )}
                  Export as PDF
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          
          {/* Add session button */}
          {isEditable && !isAddingNew && !editingItem && (
            <Button onClick={() => setIsAddingNew(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Session
            </Button>
          )}
        </div>
      </div>

      {/* Add new item form */}
      {isAddingNew && renderForm(
        newItem,
        setNewItem,
        handleAdd,
        () => setIsAddingNew(false)
      )}

      {/* Edit item form */}
      {editingItem && renderForm(
        editingItem,
        (updated) => setEditingItem(updated as EventScheduleItem),
        handleUpdate,
        () => setEditingItem(null)
      )}

      {/* Empty State */}
      {schedule.length === 0 && !isAddingNew ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Clock className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="font-semibold text-lg mb-2">No schedule yet</h3>
            <p className="text-muted-foreground mb-4">Add sessions, keynotes, and breaks to build your event timeline</p>
            {isEditable && (
              <Button onClick={() => setIsAddingNew(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add First Session
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <div className="space-y-6">
            {Object.entries(groupedSchedule).map(([day, items]) => (
              <Collapsible
                key={day}
                open={expandedDays.includes(day)}
                onOpenChange={() => toggleDay(day)}
              >
                <CollapsibleTrigger asChild>
                  <button className="flex items-center gap-2 w-full text-left p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                    {expandedDays.includes(day) ? (
                      <ChevronDown className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    )}
                    <h3 className="font-semibold text-lg">{day}</h3>
                    <Badge variant="secondary" className="ml-auto">
                      {items.length} session{items.length !== 1 ? 's' : ''}
                    </Badge>
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-4">
                  <SortableContext
                    items={items.map(item => item.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-2 ml-4 border-l-2 border-border pl-4">
                      {items.map((item) => (
                        <SortableScheduleItem
                          key={item.id}
                          item={item}
                          speakers={speakers}
                          isEditable={isEditable}
                          onEdit={setEditingItem}
                          onDelete={handleDelete}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </CollapsibleContent>
              </Collapsible>
            ))}
          </div>
        </DndContext>
      )}

      {/* Quick stats */}
      {schedule.length > 0 && (
        <div className="mt-8 p-4 rounded-lg bg-muted/30 border">
          <div className="flex flex-wrap gap-6">
            <div>
              <p className="text-2xl font-semibold text-foreground">{schedule.length}</p>
              <p className="text-sm text-muted-foreground">Total Sessions</p>
            </div>
            <div>
              <p className="text-2xl font-semibold text-foreground">
                {new Set(schedule.map(s => s.speaker).filter(Boolean)).size}
              </p>
              <p className="text-sm text-muted-foreground">Speakers</p>
            </div>
            <div>
              <p className="text-2xl font-semibold text-foreground">
                {new Set(schedule.map(s => s.location).filter(Boolean)).size}
              </p>
              <p className="text-sm text-muted-foreground">Locations</p>
            </div>
            <div>
              <p className="text-2xl font-semibold text-foreground">
                {Object.keys(groupedSchedule).length}
              </p>
              <p className="text-sm text-muted-foreground">Days</p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
