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

// Each card gets a unique tint color based on index
const CARD_TINTS = [
  { bg: 'hsl(210 80% 55%)',  tint: 'hsl(210 80% 55% / 0.08)' },  // blue
  { bg: 'hsl(280 70% 55%)',  tint: 'hsl(280 70% 55% / 0.08)' },  // purple
  { bg: 'hsl(340 75% 55%)',  tint: 'hsl(340 75% 55% / 0.08)' },  // rose
  { bg: 'hsl(160 60% 45%)',  tint: 'hsl(160 60% 45% / 0.08)' },  // emerald
  { bg: 'hsl(35 90% 55%)',   tint: 'hsl(35 90% 55% / 0.08)' },   // amber
  { bg: 'hsl(190 75% 50%)',  tint: 'hsl(190 75% 50% / 0.08)' },  // cyan
  { bg: 'hsl(250 65% 60%)',  tint: 'hsl(250 65% 60% / 0.08)' },  // indigo
  { bg: 'hsl(15 80% 55%)',   tint: 'hsl(15 80% 55% / 0.08)' },   // orange
  { bg: 'hsl(320 70% 55%)',  tint: 'hsl(320 70% 55% / 0.08)' },  // pink
  { bg: 'hsl(145 55% 48%)',  tint: 'hsl(145 55% 48% / 0.08)' },  // green
  { bg: 'hsl(200 85% 50%)',  tint: 'hsl(200 85% 50% / 0.08)' },  // sky
  { bg: 'hsl(45 95% 55%)',   tint: 'hsl(45 95% 55% / 0.08)' },   // yellow
];

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
        {sections.map((sectionId, index) => {
          const meta = sectionMeta[sectionId];
          if (!meta) return null;
          const Icon = meta.icon;
          const isActive = activeSection === sectionId;
          const isHidden = hiddenSections.includes(sectionId);
          const tint = CARD_TINTS[index % CARD_TINTS.length];

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
                'section-card-shimmer group relative flex flex-col items-center justify-center gap-1 p-2 rounded-xl aspect-square',
                'transition-all duration-300',
                isActive
                  ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25 ring-2 ring-primary/40'
                  : 'bg-card/80 backdrop-blur-sm text-card-foreground',
                isHidden && isAdmin && 'opacity-40 grayscale'
              )}
              style={{
                '--shimmer-color': tint.bg,
                backgroundColor: isActive ? undefined : tint.tint,
              } as React.CSSProperties}
            >
              {/* Active inner glow */}
              {isActive && (
                <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary-foreground/10 to-transparent" />
              )}

              <Icon className={cn(
                'relative z-10 h-5 w-5 sm:h-6 sm:w-6 transition-all duration-300',
                isActive && 'drop-shadow-[0_0_6px_hsl(var(--primary-foreground)/0.8)]'
              )} />
              <span className={cn(
                'relative z-10 text-[9px] sm:text-[10px] leading-tight text-center line-clamp-2 font-bold tracking-wide',
                isActive ? 'text-primary-foreground' : 'text-foreground/80 group-hover:text-foreground'
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
