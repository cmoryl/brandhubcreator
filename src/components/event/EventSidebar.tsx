import { 
  Shield, Quote, Calendar, MapPin, Image, Palette, Type, Camera, 
  Users, LayoutGrid, FolderArchive, Ban, Flag, Presentation, Crown,
  Blend, Clock, Mic2, UserCircle, History, Video, MapPinned,
  FileText, BookOpen, Layers, Ruler, Globe, Award, Grid, ImageIcon, TrendingUp, Building2, Printer
} from 'lucide-react';
import { 
  DndContext, 
  closestCenter, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors,
  DragEndEvent 
} from '@dnd-kit/core';
import { 
  arrayMove, 
  SortableContext, 
  sortableKeyboardCoordinates, 
  verticalListSortingStrategy 
} from '@dnd-kit/sortable';
import { EventSectionId, DEFAULT_EVENT_SECTION_ORDER } from '@/types/event';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SortableSectionItem } from '@/components/brand/SortableSectionItem';

interface EventSidebarProps {
  activeSection: EventSectionId;
  onSectionChange: (section: EventSectionId) => void;
  eventName: string;
  eventId?: string;
  organizationId?: string | null;
  sectionOrder: EventSectionId[];
  onSectionOrderChange: (newOrder: EventSectionId[]) => void;
  hiddenSections?: EventSectionId[];
  onHiddenSectionsChange?: (hiddenSections: EventSectionId[]) => void;
  isAdmin?: boolean;
}

// Re-export eventSectionMeta from extracted module for backwards compatibility
export { eventSectionMeta } from './eventSectionMeta';
import { eventSectionMeta } from './eventSectionMeta';

export const EventSidebar = ({ 
  activeSection, 
  onSectionChange, 
  eventName,
  eventId,
  organizationId,
  sectionOrder,
  onSectionOrderChange,
  hiddenSections = [],
  onHiddenSectionsChange,
  isAdmin = false
}: EventSidebarProps) => {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = sectionOrder.indexOf(active.id as EventSectionId);
      const newIndex = sectionOrder.indexOf(over.id as EventSectionId);
      const newOrder = arrayMove(sectionOrder, oldIndex, newIndex);
      onSectionOrderChange(newOrder);
    }
  };

  const toggleSectionVisibility = (sectionId: EventSectionId) => {
    if (!onHiddenSectionsChange) return;
    
    if (hiddenSections.includes(sectionId)) {
      onHiddenSectionsChange(hiddenSections.filter(id => id !== sectionId));
    } else {
      onHiddenSectionsChange([...hiddenSections, sectionId]);
    }
  };

  // Filter sections: non-admins never see hidden sections
  // Also deduplicate eventbanners (merged into eventdigital)
  const deduplicatedOrder = sectionOrder.filter(id => {
    if (id === 'eventbanners' && sectionOrder.includes('eventdigital')) return false;
    // casestudies and brochures are deprecated in events - eventdigital covers all digital collateral
    if ((id === 'casestudies' || id === 'brochures') && sectionOrder.includes('eventdigital')) return false;
    // templates (Master Scaffolds) is deprecated in events - handled within eventdigital
    if (id === 'templates') return false;
    // imageassets not used in events
    if (id === 'imageassets') return false;
    return true;
  });
  const displayedSections = isAdmin 
    ? deduplicatedOrder 
    : deduplicatedOrder.filter(id => !hiddenSections.includes(id));
    
  const visibleCount = sectionOrder.length - hiddenSections.length;

  return (
    <aside className="w-64 h-full bg-sidebar border-r border-sidebar-border flex flex-col animate-slide-in-left">
      {/* Event header */}
      <div className="p-4 border-b border-sidebar-border animate-fade-in" style={{ animationDelay: '0.1s' }}>
        <div className="flex items-center gap-2 mb-1">
          <Calendar className="h-4 w-4 text-primary" />
          <span className="text-xs font-medium text-primary uppercase tracking-wide">Event Kit</span>
        </div>
        <h2 className="font-semibold text-sidebar-foreground truncate">{eventName || 'Event Guide'}</h2>
        <p className="text-xs text-sidebar-foreground/60 mt-1">
          {visibleCount} of {sectionOrder.length} Sections
          {isAdmin && ' • Click eye to hide'}
        </p>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1">
        <nav className="p-2 pr-1">
          <DndContext 
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={displayedSections} strategy={verticalListSortingStrategy}>
              <div className="space-y-0.5">
                {displayedSections.map((sectionId, index) => {
                  const meta = eventSectionMeta[sectionId];
                  if (!meta) return null;
                  const isHidden = hiddenSections.includes(sectionId);
                  
                  return (
                    <div 
                      key={sectionId}
                      className="animate-fade-in-up"
                      style={{ animationDelay: `${0.2 + index * 0.03}s` }}
                    >
                      <SortableSectionItem
                        id={sectionId}
                        label={meta.label}
                        icon={meta.icon}
                        isActive={activeSection === sectionId}
                        isHidden={isHidden}
                        isAdmin={isAdmin}
                        onClick={() => onSectionChange(sectionId)}
                        onToggleVisibility={() => toggleSectionVisibility(sectionId)}
                      />
                    </div>
                  );
                })}
              </div>
            </SortableContext>
          </DndContext>
        </nav>
      </ScrollArea>

    </aside>
  );
};
