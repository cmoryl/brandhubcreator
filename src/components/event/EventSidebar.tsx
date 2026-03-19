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

export const eventSectionMeta: Record<EventSectionId, { label: string; icon: React.ElementType; category: string }> = {
  // Core identity
  hero: { label: 'Event Hero', icon: Shield, category: 'Identity' },
  eventdetails: { label: 'Event Details', icon: Calendar, category: 'Identity' },
  tagline: { label: 'Event Tagline', icon: Quote, category: 'Identity' },
  identity: { label: 'Event Narrative', icon: MapPin, category: 'Identity' },
  values: { label: 'Event Pillars', icon: Flag, category: 'Identity' },
  
  // Event-specific
  eventlogos: { label: 'Event Logos', icon: Image, category: 'Event Assets' },
  eventsignage: { label: 'Signage & Banners', icon: Presentation, category: 'Event Assets' },
  eventbanners: { label: 'Digital Collateral', icon: FolderArchive, category: 'Event Assets' }, // Merged into eventdigital
  eventdigital: { label: 'Digital Collateral', icon: FolderArchive, category: 'Event Assets' },
  
  // Visual
  colors: { label: 'Event Colors', icon: Palette, category: 'Visual' },
  gradients: { label: 'Gradients', icon: Blend, category: 'Visual' },
  typography: { label: 'Typography', icon: Type, category: 'Visual' },
  imagery: { label: 'Visual Direction', icon: Camera, category: 'Visual' },
  
  // Social & Communication
  social: { label: 'Social Registry', icon: Users, category: 'Communication' },
  socialassets: { label: 'Social Assets', icon: LayoutGrid, category: 'Communication' },
  
  // Event Program
  eventschedule: { label: 'Event Schedule', icon: Clock, category: 'Program' },
  eventspeakers: { label: 'Speakers', icon: Mic2, category: 'Program' },
  eventsponsors: { label: 'Sponsors', icon: Crown, category: 'Program' },
  
  // Event Media
  eventvideos: { label: 'Event Videos', icon: Video, category: 'Media' },
  
  // Event Websites
  eventwebsites: { label: 'Event Website', icon: Globe, category: 'Communication' },
  
  // Location
  eventlocation: { label: 'Venue & Location', icon: MapPinned, category: 'Venue' },
  
  // History
  eventhistory: { label: 'Event History', icon: History, category: 'Archive' },
  
  // Resources
  assets: { label: 'Operational Vault', icon: FolderArchive, category: 'Resources' },
  imageassets: { label: 'Image Assets', icon: ImageIcon, category: 'hidden' },
  misuse: { label: 'Anti-Patterns', icon: Ban, category: 'Resources' },
  
  // Shared sections (hidden by default for events but available)
  bythenumbers: { label: 'By the Numbers', icon: Shield, category: 'Identity' },
  services: { label: 'Services', icon: Shield, category: 'Identity' },
  revenue: { label: 'Revenue', icon: Shield, category: 'Identity' },
  brief: { label: 'Event Brief', icon: FileText, category: 'Identity' },
  logos: { label: 'Brand Logos', icon: Image, category: 'Visual' },
  brandicon: { label: 'Brand Icons', icon: Image, category: 'Visual' },
  patterns: { label: 'Patterns', icon: Shield, category: 'Visual' },
  textstyles: { label: 'Text Styles', icon: Type, category: 'Typography' },
  iconography: { label: 'Iconography', icon: Shield, category: 'Assets' },
  socialicons: { label: 'Social Icons', icon: Users, category: 'Assets' },
  website: { label: 'Website', icon: Shield, category: 'Communication' },
  signatures: { label: 'Signatures', icon: Shield, category: 'Communication' },
  qr: { label: 'QR Codes', icon: Shield, category: 'Communication' },
  videos: { label: 'Videos', icon: Shield, category: 'Resources' },
  casestudies: { label: 'Digital Collateral', icon: BookOpen, category: 'Collateral' }, // Deprecated - merged into brochures
  brochures: { label: 'Digital Collateral', icon: BookOpen, category: 'Collateral' },
  templates: { label: 'Templates', icon: Layers, category: 'Collateral' },
  templatespecs: { label: 'Template Specs', icon: Ruler, category: 'Collateral' },
  products: { label: 'Products', icon: Shield, category: 'Collateral' },
  subevents: { label: 'Regional Events', icon: Globe, category: 'Identity' },
  sharedassets: { label: 'Shared Assets', icon: FolderArchive, category: 'Resources' },
  webinars: { label: 'Webinar Series', icon: Presentation, category: 'Resources' },
  awards: { label: 'Awards & Recognition', icon: Award, category: 'Resources' },
  events: { label: 'Events', icon: Calendar, category: 'Collateral' },
  eventpatterns: { label: 'Event Patterns', icon: Grid, category: 'Visual' },
  universe: { label: 'Product Universe', icon: Globe, category: 'Collateral' },
  sponsorlogos: { label: 'Sponsor Logos', icon: Crown, category: 'Collateral' },
  clientlogos: { label: 'Client Logos', icon: Users, category: 'Collateral' },
  partnerbooths: { label: 'Partner Booths', icon: Building2, category: 'Event Assets' },
  locations: { label: 'Global Locations', icon: MapPin, category: 'Venue' },
  insights: { label: 'Insights & Updates', icon: TrendingUp, category: 'Resources' },
  presentations: { label: 'Presentation Templates', icon: Presentation, category: 'Collateral' },
  socialmetrics: { label: 'Social Performance', icon: TrendingUp, category: 'Communication' },
  eventprint: { label: 'Print Collateral', icon: Printer, category: 'Event Assets' },
  approvedimagery: { label: 'Approved Imagery', icon: ImageIcon, category: 'Assets' },
  studios: { label: 'Our Studios', icon: Building2, category: 'Ecosystem' },
};

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
