import { useMemo } from 'react';
import { motion } from 'framer-motion';
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

const EXCLUDED_FROM_NAV: SectionId[] = ['socialmetrics'];

// Category color mapping for subtle accent variety
const CATEGORY_ACCENT: Record<string, string> = {
  Identity: 'from-primary/20 to-primary/5',
  Visual: 'from-accent/20 to-accent/5',
  Typography: 'from-secondary/30 to-secondary/10',
  Assets: 'from-primary/15 to-accent/10',
  Communication: 'from-accent/15 to-primary/10',
  Resources: 'from-muted-foreground/10 to-muted/20',
  Collateral: 'from-primary/10 to-secondary/15',
};

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
    <div className="w-full mb-8">
      <motion.div 
        className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-1.5 sm:gap-2"
        initial="hidden"
        animate="visible"
        variants={{
          hidden: {},
          visible: { transition: { staggerChildren: 0.02 } },
        }}
      >
        {sections.map((sectionId) => {
          const meta = sectionMeta[sectionId];
          if (!meta) return null;
          const Icon = meta.icon;
          const isActive = activeSection === sectionId;
          const isHidden = hiddenSections.includes(sectionId);
          const gradientClass = CATEGORY_ACCENT[meta.category] || CATEGORY_ACCENT.Resources;

          return (
            <motion.button
              key={sectionId}
              onClick={() => onSectionSelect(sectionId)}
              title={meta.label}
              variants={{
                hidden: { opacity: 0, y: 12, scale: 0.9 },
                visible: { opacity: 1, y: 0, scale: 1 },
              }}
              whileHover={{ scale: 1.08, y: -2 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              className={cn(
                'group relative flex flex-col items-center justify-center gap-1 p-2 rounded-xl aspect-square overflow-hidden',
                'border transition-all duration-300',
                isActive
                  ? 'bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/25 ring-2 ring-primary/40'
                  : 'bg-card/80 backdrop-blur-sm text-card-foreground border-border/60 hover:border-primary/50 hover:shadow-[0_0_15px_hsl(var(--primary)/0.4),0_0_30px_hsl(var(--primary)/0.15)] hover:ring-1 hover:ring-primary/30',
                isHidden && isAdmin && 'opacity-40 grayscale'
              )}
            >
              {/* Subtle gradient background */}
              {!isActive && (
                <div className={cn(
                  'absolute inset-0 bg-gradient-to-br opacity-60 transition-opacity duration-300',
                  gradientClass
                )} />
              )}
              
              {/* Active glow effect */}
              {isActive && (
                <div className="absolute inset-0 bg-gradient-to-br from-primary-foreground/10 to-transparent" />
              )}

              <Icon className={cn(
                'relative z-10 h-4 w-4 sm:h-5 sm:w-5 transition-transform duration-200',
                isActive && 'drop-shadow-sm'
              )} />
              <span className={cn(
                'relative z-10 text-[7px] sm:text-[8px] leading-tight text-center line-clamp-2 font-semibold tracking-tight',
                !isActive && 'text-muted-foreground'
              )}>
                {meta.label}
              </span>

              {/* Bottom accent bar for active */}
              {isActive && (
                <motion.div
                  layoutId="section-card-indicator"
                  className="absolute bottom-0 left-1 right-1 h-0.5 rounded-full bg-primary-foreground/60"
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
            </motion.button>
          );
        })}
      </motion.div>
    </div>
  );
};
