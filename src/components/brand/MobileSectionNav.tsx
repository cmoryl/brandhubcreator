import { useState } from 'react';
import { Menu } from 'lucide-react';
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
import { sectionMeta } from './ReorderableBrandSidebar';

interface MobileSectionNavProps {
  sectionOrder: SectionId[];
  hiddenSections?: SectionId[];
  activeSection?: SectionId;
  onSectionSelect: (sectionId: SectionId) => void;
  brandName?: string;
}

export const MobileSectionNav = ({
  sectionOrder,
  hiddenSections = [],
  activeSection,
  onSectionSelect,
  brandName = 'Brand Guide',
}: MobileSectionNavProps) => {
  const [open, setOpen] = useState(false);

  const visibleSections = sectionOrder.filter(
    (id) => !hiddenSections.includes(id) && sectionMeta[id]
  );

  const handleSelect = (sectionId: SectionId) => {
    onSectionSelect(sectionId);
    setOpen(false);
  };

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button
          variant="default"
          size="icon"
          className="fixed bottom-6 right-6 z-40 h-14 w-14 rounded-full shadow-lg sm:hidden"
          aria-label="Open section navigation"
        >
          <Menu className="h-6 w-6" />
        </Button>
      </DrawerTrigger>
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader className="pb-2">
          <DrawerTitle className="text-left">{brandName}</DrawerTitle>
          <p className="text-xs text-muted-foreground text-left">
            {visibleSections.length} sections
          </p>
        </DrawerHeader>
        <ScrollArea className="flex-1 px-4 pb-6">
          <div className="grid grid-cols-2 gap-2">
            {visibleSections.map((sectionId) => {
              const meta = sectionMeta[sectionId];
              if (!meta) return null;
              const Icon = meta.icon;
              const isActive = activeSection === sectionId;

              return (
                <button
                  key={sectionId}
                  onClick={() => handleSelect(sectionId)}
                  className={cn(
                    'flex items-center gap-2 p-3 rounded-lg text-sm text-left transition-colors touch-manipulation',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted/50 text-foreground hover:bg-muted'
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="truncate text-xs">{meta.label}</span>
                </button>
              );
            })}
          </div>
        </ScrollArea>
      </DrawerContent>
    </Drawer>
  );
};
