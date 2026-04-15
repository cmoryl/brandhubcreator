import { useMemo, useState } from 'react';
import { Eye, EyeOff, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { SectionId } from '@/types/brand';
import { sectionMeta } from './sectionMeta';

interface MobileSectionNavProps {
  sectionOrder: SectionId[];
  hiddenSections?: SectionId[];
  activeSection?: SectionId;
  onSectionSelect: (sectionId: SectionId) => void;
  brandName?: string;
  /** When true, show hidden sections + render hide/show eye toggles */
  isAdmin?: boolean;
  /** Persist hidden sections when toggling via the eye icon */
  onHiddenSectionsChange?: (hiddenSections: SectionId[]) => void;
}

export const MobileSectionNav = ({
  sectionOrder,
  hiddenSections = [],
  activeSection,
  onSectionSelect,
  brandName = 'Brand Guide',
  isAdmin = false,
  onHiddenSectionsChange,
}: MobileSectionNavProps) => {
  const [open, setOpen] = useState(false);

  const sections = useMemo(() => {
    const base = sectionOrder.filter((id) => sectionMeta[id]);
    if (isAdmin) return base;
    return base.filter((id) => !hiddenSections.includes(id));
  }, [sectionOrder, hiddenSections, isAdmin]);

  const handleSelect = (sectionId: SectionId) => {
    onSectionSelect(sectionId);
    setOpen(false);
  };

  const toggleVisibility = (sectionId: SectionId) => {
    if (!onHiddenSectionsChange) return;

    const next = hiddenSections.includes(sectionId)
      ? hiddenSections.filter((id) => id !== sectionId)
      : [...hiddenSections, sectionId];

    onHiddenSectionsChange(next);
  };

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button
          variant="default"
          size="icon"
          className="fixed bottom-6 right-6 z-40 h-14 w-14 rounded-full shadow-lg lg:hidden touch-target"
          aria-label="Open section navigation"
        >
          <Menu className="h-6 w-6" />
        </Button>
      </DrawerTrigger>
      <DrawerContent className="max-h-[85vh] flex flex-col">
        <DrawerHeader className="pb-2 flex-shrink-0">
          <DrawerTitle className="text-left text-fluid-lg">{brandName}</DrawerTitle>
          <p className="text-xs text-muted-foreground text-left">
            {sections.length} sections
            {isAdmin && onHiddenSectionsChange ? ' • Tap eye to hide' : ''}
          </p>
        </DrawerHeader>

        <ScrollArea className="flex-1 min-h-0 px-4 pb-6" style={{ maxHeight: 'calc(85vh - 80px)' }}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
            {sections.map((sectionId) => {
              const meta = sectionMeta[sectionId];
              if (!meta) return null;

              const Icon = meta.icon;
              const isActive = activeSection === sectionId;
              const isHidden = hiddenSections.includes(sectionId);
              const canToggle = isAdmin && !!onHiddenSectionsChange;

              return (
                <div key={sectionId} className="relative">
                  <button
                    onClick={() => handleSelect(sectionId)}
                    className={cn(
                      'w-full flex items-center gap-2 p-3 sm:p-4 rounded-lg text-sm text-left transition-colors touch-manipulation touch-target-sm pr-12',
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted/50 text-foreground hover:bg-muted active:bg-muted/80',
                      isHidden && canToggle && 'opacity-70'
                    )}
                  >
                    <Icon className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
                    <span className={cn('truncate text-xs sm:text-sm', isHidden && canToggle && 'line-through')}>
                      {meta.label}
                    </span>
                  </button>

                  {canToggle && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        toggleVisibility(sectionId);
                      }}
                      className={cn(
                        'absolute right-2 top-1/2 -translate-y-1/2 shrink-0 p-2 rounded-md transition-colors',
                        'border-2 border-primary/50 bg-primary/10 hover:bg-primary/20',
                        'text-primary'
                      )}
                      aria-label={isHidden ? 'Show section' : 'Hide section'}
                      title={isHidden ? 'Section hidden from viewers - tap to show' : 'Tap to hide from viewers'}
                    >
                      {isHidden ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </DrawerContent>
    </Drawer>
  );
};

