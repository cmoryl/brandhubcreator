import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { SectionId } from '@/types/brand';
import { sectionMeta } from './ReorderableBrandSidebar';

interface SectionCardGridProps {
  sectionOrder: SectionId[];
  hiddenSections?: SectionId[];
  activeSection: SectionId;
  onSectionSelect: (sectionId: SectionId) => void;
  isAdmin?: boolean;
}

// Sections excluded from card grid navigation (same as sidebar)
const EXCLUDED_FROM_NAV: SectionId[] = ['socialmetrics'];

export const SectionCardGrid = ({
  sectionOrder,
  hiddenSections = [],
  activeSection,
  onSectionSelect,
  isAdmin = false,
}: SectionCardGridProps) => {
  const sections = useMemo(() => {
    const base = sectionOrder.filter(
      (id) => sectionMeta[id] && !EXCLUDED_FROM_NAV.includes(id)
    );
    if (isAdmin) return base;
    return base.filter((id) => !hiddenSections.includes(id));
  }, [sectionOrder, hiddenSections, isAdmin]);

  return (
    <div className="w-full mb-6">
      <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-2">
        {sections.map((sectionId) => {
          const meta = sectionMeta[sectionId];
          if (!meta) return null;
          const Icon = meta.icon;
          const isActive = activeSection === sectionId;
          const isHidden = hiddenSections.includes(sectionId);

          return (
            <button
              key={sectionId}
              onClick={() => onSectionSelect(sectionId)}
              title={meta.label}
              className={cn(
                'flex flex-col items-center justify-center gap-1 p-2 rounded-lg border transition-all aspect-square',
                'hover:shadow-md hover:scale-105 active:scale-95',
                isActive
                  ? 'bg-primary text-primary-foreground border-primary shadow-md ring-2 ring-primary/30'
                  : 'bg-card text-card-foreground border-border hover:border-primary/40 hover:bg-accent/50',
                isHidden && isAdmin && 'opacity-50'
              )}
            >
              <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="text-[8px] sm:text-[9px] leading-tight text-center line-clamp-2 font-medium">
                {meta.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
