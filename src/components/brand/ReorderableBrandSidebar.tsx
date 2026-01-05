import { 
  Shield, Scroll, Heart, Image, Bookmark, Palette, Blend, Grid3X3, 
  Type, Code, Layers, Share2, Camera, Users, Mail, QrCode, 
  FolderArchive, Ban, Sparkles, FileText, BookOpen, FileType
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
  identity: { label: 'Narrative Architecture', icon: Scroll, category: 'Identity' },
  values: { label: 'Philosophical Pillars', icon: Heart, category: 'Identity' },
  logos: { label: 'Mark Repository', icon: Image, category: 'Visual' },
  brandicon: { label: 'Symbol Standards', icon: Bookmark, category: 'Visual' },
  colors: { label: 'Prismatic Lab', icon: Palette, category: 'Visual' },
  gradients: { label: 'Gradients', icon: Blend, category: 'Visual' },
  patterns: { label: 'Geometric Primitives', icon: Grid3X3, category: 'Visual' },
  typography: { label: 'Type Registry', icon: Type, category: 'Typography' },
  textstyles: { label: 'CSS Hierarchies', icon: Code, category: 'Typography' },
  iconography: { label: 'Neural Vectors', icon: Layers, category: 'Assets' },
  socialicons: { label: 'Platform Markers', icon: Share2, category: 'Assets' },
  imagery: { label: 'Visual Direction', icon: Camera, category: 'Assets' },
  social: { label: 'Social Registry', icon: Users, category: 'Communication' },
  signatures: { label: 'Signature Protocol', icon: Mail, category: 'Communication' },
  qr: { label: 'Access Ports', icon: QrCode, category: 'Communication' },
  assets: { label: 'Operational Vault', icon: FolderArchive, category: 'Resources' },
  misuse: { label: 'Anti-Patterns', icon: Ban, category: 'Resources' },
  atmosphere: { label: 'Atmosphere Engine', icon: Sparkles, category: 'Resources' },
  casestudies: { label: 'Proof Shards', icon: FileText, category: 'Collateral' },
  brochures: { label: 'Digital Collateral', icon: BookOpen, category: 'Collateral' },
  templates: { label: 'Master Scaffolds', icon: FileType, category: 'Collateral' },
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
    <aside className="w-64 h-screen bg-sidebar border-r border-sidebar-border flex flex-col">
      {/* Brand header */}
      <div className="p-4 border-b border-sidebar-border">
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
                {sectionOrder.map(sectionId => {
                  const meta = sectionMeta[sectionId];
                  if (!meta) return null;
                  const isHidden = hiddenSections.includes(sectionId);
                  
                  return (
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