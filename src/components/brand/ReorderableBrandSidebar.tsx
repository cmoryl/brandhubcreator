import { 
  Shield, Scroll, Heart, Image, Bookmark, Palette, Blend, Grid3X3, 
  Type, Code, Layers, Share2, Camera, Users, Mail, QrCode, Globe,
  FolderArchive, Ban, FileText, BookOpen, FileType, Video, Quote, Package, Briefcase, LayoutGrid, TrendingUp, BarChart3, Presentation, Calendar, Award
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
import { SectionId, DEFAULT_SECTION_ORDER } from '@/types/brand';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SortableSectionItem } from './SortableSectionItem';

interface ReorderableBrandSidebarProps {
  activeSection: SectionId;
  onSectionChange: (section: SectionId) => void;
  brandName: string;
  sectionOrder: SectionId[];
  onSectionOrderChange: (newOrder: SectionId[]) => void;
  hiddenSections?: SectionId[];
  onHiddenSectionsChange?: (hiddenSections: SectionId[]) => void;
  isAdmin?: boolean;
}

export const sectionMeta: Record<SectionId, { label: string; icon: React.ElementType; category: string }> = {
  hero: { label: 'Identity Shield', icon: Shield, category: 'Identity' },
  tagline: { label: 'Corporate Tagline', icon: Quote, category: 'Identity' },
  identity: { label: 'Narrative Architecture', icon: Scroll, category: 'Identity' },
  values: { label: 'Philosophical Pillars', icon: Heart, category: 'Identity' },
  bythenumbers: { label: 'By the Numbers', icon: BarChart3, category: 'Identity' },
  services: { label: 'Our Services', icon: Briefcase, category: 'Identity' },
  revenue: { label: 'Revenue Growth', icon: TrendingUp, category: 'Identity' },
  awards: { label: 'Awards & Recognition', icon: Award, category: 'Identity' },
  brief: { label: 'Brand Brief', icon: FileText, category: 'Identity' },
  logos: { label: 'Logos', icon: Image, category: 'Visual' },
  brandicon: { label: 'Symbol Standards', icon: Bookmark, category: 'Visual' },
  colors: { label: 'Prismatic Lab', icon: Palette, category: 'Visual' },
  gradients: { label: 'Gradients', icon: Blend, category: 'Visual' },
  patterns: { label: 'Geometric Primitives', icon: Grid3X3, category: 'Visual' },
  typography: { label: 'Type Registry', icon: Type, category: 'Typography' },
  textstyles: { label: 'CSS Hierarchies', icon: Code, category: 'Typography' },
  iconography: { label: 'Iconography', icon: Layers, category: 'Assets' },
  socialicons: { label: 'Platform Markers', icon: Share2, category: 'Assets' },
  imagery: { label: 'Visual Direction', icon: Camera, category: 'Assets' },
  social: { label: 'Social Registry', icon: Users, category: 'Communication' },
  socialassets: { label: 'Social Assets & Guidelines', icon: LayoutGrid, category: 'Communication' },
  website: { label: 'Website', icon: Globe, category: 'Communication' },
  signatures: { label: 'Signature Protocol', icon: Mail, category: 'Communication' },
  qr: { label: 'Access Ports', icon: QrCode, category: 'Communication' },
  videos: { label: 'Video Resources', icon: Video, category: 'Resources' },
  assets: { label: 'Operational Vault', icon: FolderArchive, category: 'Resources' },
  misuse: { label: 'Anti-Patterns', icon: Ban, category: 'Resources' },
  casestudies: { label: 'Digital Collateral', icon: BookOpen, category: 'Collateral' }, // Deprecated - use brochures
  brochures: { label: 'Digital Collateral', icon: BookOpen, category: 'Collateral' },
  templates: { label: 'Master Scaffolds', icon: FileType, category: 'Collateral' },
  templatespecs: { label: 'Template Specs', icon: FileText, category: 'Collateral' },
  webinars: { label: 'Webinar Series', icon: Presentation, category: 'Resources' },
  products: { label: 'Products', icon: Package, category: 'Collateral' },
  events: { label: 'Events', icon: Calendar, category: 'Collateral' },
};

export const ReorderableBrandSidebar = ({ 
  activeSection, 
  onSectionChange, 
  brandName,
  sectionOrder,
  onSectionOrderChange,
  hiddenSections = [],
  onHiddenSectionsChange,
  isAdmin = false
}: ReorderableBrandSidebarProps) => {
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
      const oldIndex = sectionOrder.indexOf(active.id as SectionId);
      const newIndex = sectionOrder.indexOf(over.id as SectionId);
      const newOrder = arrayMove(sectionOrder, oldIndex, newIndex);
      onSectionOrderChange(newOrder);
    }
  };

  const toggleSectionVisibility = (sectionId: SectionId) => {
    if (!onHiddenSectionsChange) return;
    
    if (hiddenSections.includes(sectionId)) {
      onHiddenSectionsChange(hiddenSections.filter(id => id !== sectionId));
    } else {
      onHiddenSectionsChange([...hiddenSections, sectionId]);
    }
  };

  const visibleCount = sectionOrder.length - hiddenSections.length;

  return (
    <aside className="w-64 h-full bg-sidebar border-r border-sidebar-border flex flex-col animate-slide-in-left">
      {/* Brand header */}
      <div className="p-4 border-b border-sidebar-border animate-fade-in" style={{ animationDelay: '0.1s' }}>
        <h2 className="font-semibold text-sidebar-foreground truncate">{brandName || 'Brand Guide'}</h2>
        <p className="text-xs text-sidebar-foreground/60 mt-1">
          {visibleCount} of {sectionOrder.length} Sections
          {isAdmin && ' • Click eye to hide'}
        </p>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1">
        <nav className="p-2">
          <DndContext 
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={sectionOrder} strategy={verticalListSortingStrategy}>
              <div className="space-y-0.5">
                {sectionOrder.map((sectionId, index) => {
                  const meta = sectionMeta[sectionId];
                  if (!meta) return null;
                  const isHidden = hiddenSections.includes(sectionId);
                  
                  return (
                    <div 
                      key={sectionId}
                      className="animate-fade-in-up"
                      style={{ animationDelay: `${0.2 + index * 0.03}s` }}
                    >
                    <SortableSectionItem
                      key={sectionId}
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